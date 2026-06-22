package models

// SearchUser represents a user in search results
type SearchUser struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Username string `json:"username"`
}

// SearchRole represents a role in search results
type SearchRole struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
}

// SearchMenu represents a menu in search results
type SearchMenu struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Path string `json:"path"`
	Icon string `json:"icon"`
}

// GlobalSearchResponse represents the response for global search
type GlobalSearchResponse struct {
	Users []SearchUser `json:"users"`
	Roles []SearchRole `json:"roles"`
	Menus []SearchMenu `json:"menus"`
}
