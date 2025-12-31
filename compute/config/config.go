package config

import (
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration loaded from environment variables
var (
	// CDNPath is the base directory where files are stored
	// Default: /srv/cdn
	CDNPath string

	// PublicHostname is the public domain used for generating share URLs
	// Default: localhost
	PublicHostname string

	// MaxUploadSize is the maximum file upload size in bytes
	// Default: 104857600 (100MB)
	MaxUploadSize int64

	// AllowedOrigins is a list of allowed CORS origins
	// Default: * (all origins - suitable for same-origin deployment)
	AllowedOrigins []string

	// BlockedExtensions is the default list of blocked file extensions
	BlockedExtensions string
)

// Init loads configuration from environment variables
// Should be called once at application startup
func Init() {
	CDNPath = getEnvOrDefault("CDN_PATH", "/srv/cdn")
	PublicHostname = getEnvOrDefault("PUBLIC_HOSTNAME", "localhost")
	MaxUploadSize = getEnvOrDefaultInt64("MAX_UPLOAD_SIZE", 104857600) // 100MB
	BlockedExtensions = getEnvOrDefault("BLOCKED_EXTENSIONS", "php,phtml,phar,cgi,pl,py,sh,exe,dll,so,bin,bat,cmd,ps1,asp,aspx,jsp,jspx,cfm,htaccess")

	// Parse CORS origins
	originsStr := getEnvOrDefault("ALLOWED_ORIGINS", "*")
	if originsStr == "*" {
		AllowedOrigins = []string{"*"}
	} else {
		origins := strings.Split(originsStr, ",")
		AllowedOrigins = make([]string, 0, len(origins))
		for _, o := range origins {
			o = strings.TrimSpace(o)
			if o != "" {
				AllowedOrigins = append(AllowedOrigins, o)
			}
		}
	}
}

// getEnvOrDefault returns env variable value or default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvOrDefaultInt64 returns env variable as int64 or default if not set/invalid
func getEnvOrDefaultInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseInt(value, 10, 64); err == nil {
			return parsed
		}
	}
	return defaultValue
}
