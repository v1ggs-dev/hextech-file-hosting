package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"
)

var (
	csrfToken     string
	csrfTokenOnce sync.Once
)

// generateCSRFToken creates a random CSRF token
func generateCSRFToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

// Security middleware adds security headers and CSRF protection
func Security(next http.Handler) http.Handler {
	csrfTokenOnce.Do(func() {
		csrfToken = generateCSRFToken()
	})

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'")

		// CSRF protection for state-changing requests
		if r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions {
			requestToken := r.Header.Get("X-CSRF-Token")
			if requestToken != csrfToken {
				http.Error(w, `{"error": "Invalid or missing CSRF token"}`, http.StatusForbidden)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// GetCSRFToken returns the current CSRF token
func GetCSRFToken() string {
	csrfTokenOnce.Do(func() {
		csrfToken = generateCSRFToken()
	})
	return csrfToken
}
