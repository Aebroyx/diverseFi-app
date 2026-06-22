package logger

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"time"
)

// LogLevel represents the severity of a log entry
type LogLevel string

const (
	DEBUG LogLevel = "DEBUG"
	INFO  LogLevel = "INFO"
	WARN  LogLevel = "WARN"
	ERROR LogLevel = "ERROR"
)

// Logger represents the application logger
type Logger struct {
	output      io.Writer
	minLevel    LogLevel
	jsonOutput  bool
	serviceName string
}

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp     string                 `json:"timestamp"`
	Level         LogLevel               `json:"level"`
	Message       string                 `json:"message"`
	CorrelationID string                 `json:"correlation_id,omitempty"`
	Service       string                 `json:"service,omitempty"`
	Fields        map[string]interface{} `json:"fields,omitempty"`
}

var defaultLogger *Logger

// Init initializes the default logger
func Init(serviceName, level string, jsonOutput bool) {
	minLevel := parseLogLevel(level)
	defaultLogger = &Logger{
		output:      os.Stdout,
		minLevel:    minLevel,
		jsonOutput:  jsonOutput,
		serviceName: serviceName,
	}
}

// parseLogLevel converts string level to LogLevel
func parseLogLevel(level string) LogLevel {
	switch level {
	case "debug":
		return DEBUG
	case "info":
		return INFO
	case "warn":
		return WARN
	case "error":
		return ERROR
	default:
		return INFO
	}
}

// shouldLog checks if the log level should be logged
func (l *Logger) shouldLog(level LogLevel) bool {
	levels := map[LogLevel]int{
		DEBUG: 0,
		INFO:  1,
		WARN:  2,
		ERROR: 3,
	}
	return levels[level] >= levels[l.minLevel]
}

// log writes a log entry
func (l *Logger) log(level LogLevel, message string, correlationID string, fields map[string]interface{}) {
	if !l.shouldLog(level) {
		return
	}

	entry := LogEntry{
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		Level:         level,
		Message:       message,
		CorrelationID: correlationID,
		Service:       l.serviceName,
		Fields:        fields,
	}

	if l.jsonOutput {
		jsonBytes, err := json.Marshal(entry)
		if err != nil {
			log.Printf("Failed to marshal log entry: %v", err)
			return
		}
		fmt.Fprintln(l.output, string(jsonBytes))
	} else {
		// Human-readable format for development
		fieldsStr := ""
		if len(fields) > 0 {
			fieldsBytes, _ := json.Marshal(fields)
			fieldsStr = fmt.Sprintf(" fields=%s", string(fieldsBytes))
		}
		corrID := ""
		if correlationID != "" {
			corrID = fmt.Sprintf(" correlation_id=%s", correlationID)
		}
		fmt.Fprintf(l.output, "[%s] %s: %s%s%s\n",
			entry.Timestamp, level, message, corrID, fieldsStr)
	}
}

// Debug logs a debug message
func Debug(message string) {
	if defaultLogger != nil {
		defaultLogger.log(DEBUG, message, "", nil)
	}
}

// DebugWithContext logs a debug message with correlation ID and fields
func DebugWithContext(message, correlationID string, fields map[string]interface{}) {
	if defaultLogger != nil {
		defaultLogger.log(DEBUG, message, correlationID, fields)
	}
}

// Info logs an info message
func Info(message string) {
	if defaultLogger != nil {
		defaultLogger.log(INFO, message, "", nil)
	}
}

// InfoWithContext logs an info message with correlation ID and fields
func InfoWithContext(message, correlationID string, fields map[string]interface{}) {
	if defaultLogger != nil {
		defaultLogger.log(INFO, message, correlationID, fields)
	}
}

// Warn logs a warning message
func Warn(message string) {
	if defaultLogger != nil {
		defaultLogger.log(WARN, message, "", nil)
	}
}

// WarnWithContext logs a warning message with correlation ID and fields
func WarnWithContext(message, correlationID string, fields map[string]interface{}) {
	if defaultLogger != nil {
		defaultLogger.log(WARN, message, correlationID, fields)
	}
}

// Error logs an error message
func Error(message string) {
	if defaultLogger != nil {
		defaultLogger.log(ERROR, message, "", nil)
	}
}

// ErrorWithContext logs an error message with correlation ID and fields
func ErrorWithContext(message, correlationID string, fields map[string]interface{}) {
	if defaultLogger != nil {
		defaultLogger.log(ERROR, message, correlationID, fields)
	}
}

// Errorf logs a formatted error message
func Errorf(format string, args ...interface{}) {
	Error(fmt.Sprintf(format, args...))
}

// Infof logs a formatted info message
func Infof(format string, args ...interface{}) {
	Info(fmt.Sprintf(format, args...))
}

// Debugf logs a formatted debug message
func Debugf(format string, args ...interface{}) {
	Debug(fmt.Sprintf(format, args...))
}

// Warnf logs a formatted warning message
func Warnf(format string, args ...interface{}) {
	Warn(fmt.Sprintf(format, args...))
}
