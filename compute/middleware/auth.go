package middleware

import (
	"net/http"
	"os"
)

// CloudflareAuth middleware validates Cloudflare Access headers
func CloudflareAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Bypass Cloudflare auth in development mode
		if os.Getenv("BYPASS_CF_AUTH") == "true" {
			next.ServeHTTP(w, r)
			return
		}

		// Cloudflare Access sets this header for authenticated users
		email := r.Header.Get("Cf-Access-Authenticated-User-Email")
		
		if email == "" {
			http.Error(w, `{"error": "Unauthorized: Cloudflare Access authentication required"}`, http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// GetAuthenticatedEmail extracts the authenticated user email from the request
func GetAuthenticatedEmail(r *http.Request) string {
	return r.Header.Get("Cf-Access-Authenticated-User-Email")
}
