package services

import (
	"fmt"
	"sync"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/config"
)

// RateLimiterService provides rate limiting functionality
type RateLimiterService struct {
	Config       *config.Config
	ipLimiters   map[string]*limiter
	userLimiters map[uint]*limiter
	mu           sync.RWMutex
	cleanupTick  *time.Ticker
	stopCleanup  chan bool
}

// limiter tracks request counts for a specific identifier
type limiter struct {
	count      int
	windowStart time.Time
	mu         sync.Mutex
}

// NewRateLimiterService creates a new rate limiter service
func NewRateLimiterService(config *config.Config) *RateLimiterService {
	service := &RateLimiterService{
		Config:       config,
		ipLimiters:   make(map[string]*limiter),
		userLimiters: make(map[uint]*limiter),
		cleanupTick:  time.NewTicker(10 * time.Minute),
		stopCleanup:  make(chan bool),
	}

	// Start cleanup goroutine
	go service.cleanup()

	return service
}

// cleanup periodically removes old limiters
func (s *RateLimiterService) cleanup() {
	for {
		select {
		case <-s.cleanupTick.C:
			s.mu.Lock()
			now := time.Now()

			// Clean IP limiters
			for key, lim := range s.ipLimiters {
				lim.mu.Lock()
				if now.Sub(lim.windowStart) > s.Config.RateLimitWindow*2 {
					delete(s.ipLimiters, key)
				}
				lim.mu.Unlock()
			}

			// Clean user limiters
			for key, lim := range s.userLimiters {
				lim.mu.Lock()
				if now.Sub(lim.windowStart) > s.Config.RateLimitWindow*2 {
					delete(s.userLimiters, key)
				}
				lim.mu.Unlock()
			}

			s.mu.Unlock()
		case <-s.stopCleanup:
			return
		}
	}
}

// Stop stops the cleanup goroutine
func (s *RateLimiterService) Stop() {
	s.cleanupTick.Stop()
	s.stopCleanup <- true
}

// getOrCreateIPLimiter gets or creates a limiter for an IP address
func (s *RateLimiterService) getOrCreateIPLimiter(ip string) *limiter {
	s.mu.Lock()
	defer s.mu.Unlock()

	lim, exists := s.ipLimiters[ip]
	if !exists {
		lim = &limiter{
			count:      0,
			windowStart: time.Now(),
		}
		s.ipLimiters[ip] = lim
	}
	return lim
}

// getOrCreateUserLimiter gets or creates a limiter for a user
func (s *RateLimiterService) getOrCreateUserLimiter(userID uint) *limiter {
	s.mu.Lock()
	defer s.mu.Unlock()

	lim, exists := s.userLimiters[userID]
	if !exists {
		lim = &limiter{
			count:      0,
			windowStart: time.Now(),
		}
		s.userLimiters[userID] = lim
	}
	return lim
}

// checkLimit checks if the limiter is within the allowed limit
func (s *RateLimiterService) checkLimit(lim *limiter, maxRequests int) (bool, time.Duration) {
	lim.mu.Lock()
	defer lim.mu.Unlock()

	now := time.Now()

	// Reset window if expired
	if now.Sub(lim.windowStart) > s.Config.RateLimitWindow {
		lim.count = 0
		lim.windowStart = now
	}

	// Check if limit exceeded
	if lim.count >= maxRequests {
		resetTime := lim.windowStart.Add(s.Config.RateLimitWindow).Sub(now)
		return false, resetTime
	}

	return true, 0
}

// recordRequest increments the request counter
func (s *RateLimiterService) recordRequest(lim *limiter) {
	lim.mu.Lock()
	defer lim.mu.Unlock()

	now := time.Now()

	// Reset window if expired
	if now.Sub(lim.windowStart) > s.Config.RateLimitWindow {
		lim.count = 0
		lim.windowStart = now
	}

	lim.count++
}

// CheckIPLimit checks if an IP address is within rate limit
func (s *RateLimiterService) CheckIPLimit(ip string) (bool, time.Duration, error) {
	if !s.Config.RateLimitEnabled {
		return true, 0, nil
	}

	lim := s.getOrCreateIPLimiter(ip)
	allowed, resetTime := s.checkLimit(lim, s.Config.RateLimitPerIP)

	if !allowed {
		return false, resetTime, fmt.Errorf("rate limit exceeded for IP %s", ip)
	}

	return true, 0, nil
}

// RecordIPRequest records a request from an IP address
func (s *RateLimiterService) RecordIPRequest(ip string) {
	if !s.Config.RateLimitEnabled {
		return
	}

	lim := s.getOrCreateIPLimiter(ip)
	s.recordRequest(lim)
}

// CheckUserLimit checks if a user is within rate limit
func (s *RateLimiterService) CheckUserLimit(userID uint) (bool, time.Duration, error) {
	if !s.Config.RateLimitEnabled {
		return true, 0, nil
	}

	lim := s.getOrCreateUserLimiter(userID)
	allowed, resetTime := s.checkLimit(lim, s.Config.RateLimitPerUser)

	if !allowed {
		return false, resetTime, fmt.Errorf("rate limit exceeded for user %d", userID)
	}

	return true, 0, nil
}

// RecordUserRequest records a request from a user
func (s *RateLimiterService) RecordUserRequest(userID uint) {
	if !s.Config.RateLimitEnabled {
		return
	}

	lim := s.getOrCreateUserLimiter(userID)
	s.recordRequest(lim)
}

// GetIPStats returns the current stats for an IP address
func (s *RateLimiterService) GetIPStats(ip string) (count int, resetTime time.Time) {
	s.mu.RLock()
	lim, exists := s.ipLimiters[ip]
	s.mu.RUnlock()

	if !exists {
		return 0, time.Now()
	}

	lim.mu.Lock()
	defer lim.mu.Unlock()

	return lim.count, lim.windowStart.Add(s.Config.RateLimitWindow)
}

// GetUserStats returns the current stats for a user
func (s *RateLimiterService) GetUserStats(userID uint) (count int, resetTime time.Time) {
	s.mu.RLock()
	lim, exists := s.userLimiters[userID]
	s.mu.RUnlock()

	if !exists {
		return 0, time.Now()
	}

	lim.mu.Lock()
	defer lim.mu.Unlock()

	return lim.count, lim.windowStart.Add(s.Config.RateLimitWindow)
}
