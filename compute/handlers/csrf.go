package handlers

import (
	"net/http"

	"hextech-panel/middleware"
)

// GetCSRFToken returns the CSRF token for the frontend
func GetCSRFToken(w http.ResponseWriter, r *http.Request) {
	token := middleware.GetCSRFToken()
	writeJSON(w, http.StatusOK, map[string]string{
		"token": token,
	})
}
