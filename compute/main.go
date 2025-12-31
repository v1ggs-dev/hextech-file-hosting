package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"hextech-panel/config"
	"hextech-panel/db"
	"hextech-panel/handlers"
	"hextech-panel/middleware"
)

func main() {
	// Initialize configuration from environment variables
	config.Init()
	log.Printf("Config loaded: CDN_PATH=%s, PUBLIC_HOSTNAME=%s, ALLOWED_ORIGINS=%v",
		config.CDNPath, config.PublicHostname, config.AllowedOrigins)

	// Initialize database
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./hextech.db"
	}

	if err := db.Init(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Create router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)

	// CORS for frontend - configurable via ALLOWED_ORIGINS env var
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   config.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// API routes
	r.Route("/api", func(r chi.Router) {
		// CSRF token endpoint (no auth required for initial fetch)
		r.Get("/csrf-token", handlers.GetCSRFToken)

		// Protected routes
		r.Group(func(r chi.Router) {
			// Authentication - check for Cloudflare Access headers
			// In development, skip auth if DEV_MODE is set
			if os.Getenv("DEV_MODE") != "true" {
				r.Use(middleware.CloudflareAuth)
			}
			r.Use(middleware.Security)

			// Files
			r.Get("/files", handlers.ListFiles)
			r.Post("/files/upload", handlers.UploadFile)
			r.Post("/files/rename", handlers.RenameFile)
			r.Post("/files/move", handlers.MoveFile)
			r.Post("/files/replace", handlers.ReplaceFile)
			r.Post("/files/delete", handlers.DeleteFile)
			r.Post("/files/mkdir", handlers.CreateDirectory)
			r.Post("/files/zip", handlers.DownloadZip)

			// Metadata
			r.Get("/metadata", handlers.GetMetadata)

			// Logs
			r.Get("/logs", handlers.GetLogs)

			// Settings
			r.Get("/settings", handlers.GetSettings)
			r.Put("/settings", handlers.UpdateSettings)
		})
	})

	// Serve static files for frontend in production
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir != "" {
		fs := http.FileServer(http.Dir(staticDir))
		r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			ext := strings.ToLower(filepath.Ext(path))

			// Set proper Content-Type headers (fixes MIME type issues)
			switch ext {
			case ".js":
				w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			case ".css":
				w.Header().Set("Content-Type", "text/css; charset=utf-8")
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			case ".html":
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
				w.Header().Set("Pragma", "no-cache")
				w.Header().Set("Expires", "0")
			case ".svg":
				w.Header().Set("Content-Type", "image/svg+xml")
				w.Header().Set("Cache-Control", "public, max-age=86400, must-revalidate")
			case ".png":
				w.Header().Set("Content-Type", "image/png")
				w.Header().Set("Cache-Control", "public, max-age=86400, must-revalidate")
			case ".jpg", ".jpeg":
				w.Header().Set("Content-Type", "image/jpeg")
				w.Header().Set("Cache-Control", "public, max-age=86400, must-revalidate")
			case ".ico":
				w.Header().Set("Content-Type", "image/x-icon")
				w.Header().Set("Cache-Control", "public, max-age=86400, must-revalidate")
			case ".woff2":
				w.Header().Set("Content-Type", "font/woff2")
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			case ".json":
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.Header().Set("Cache-Control", "public, max-age=300, must-revalidate")
			default:
				// For root path and unknown extensions
				if path == "/" {
					w.Header().Set("Content-Type", "text/html; charset=utf-8")
					w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
					w.Header().Set("Pragma", "no-cache")
					w.Header().Set("Expires", "0")
				} else {
					w.Header().Set("Cache-Control", "public, max-age=300, must-revalidate")
				}
			}

			fs.ServeHTTP(w, r)
		}))
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting Hextech Control Panel on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
