package security

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	ErrBlockedExtension = errors.New("file extension is blocked")
	ErrFileTooLarge     = errors.New("file exceeds maximum size")
	ErrInvalidFilename  = errors.New("invalid filename")
	ErrMIMEMismatch     = errors.New("MIME type does not match extension")
)

// Default blocked extensions (executable/script files)
var DefaultBlockedExtensions = []string{
	"php", "phtml", "phar", "cgi", "pl", "py", "sh",
	"exe", "dll", "so", "bin", "bat", "cmd", "ps1",
	"asp", "aspx", "jsp", "jspx", "cfm", "htaccess",
}

// filenameRegex allows alphanumeric, dash, underscore, dot
var filenameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9._-]*$`)

// ValidateFilename checks if a filename is valid and normalizes it
func ValidateFilename(filename string) (string, error) {
	// Remove any path components
	filename = filepath.Base(filename)
	
	if filename == "" || filename == "." || filename == ".." {
		return "", ErrInvalidFilename
	}

	// Normalize: lowercase, replace spaces with dashes
	normalized := strings.ToLower(filename)
	normalized = strings.ReplaceAll(normalized, " ", "-")

	// Validate against regex
	if !filenameRegex.MatchString(normalized) {
		return "", ErrInvalidFilename
	}

	return normalized, nil
}

// ValidateExtension checks if the file extension is allowed
func ValidateExtension(filename string, blockedExtensions []string) error {
	ext := strings.TrimPrefix(filepath.Ext(filename), ".")
	ext = strings.ToLower(ext)

	for _, blocked := range blockedExtensions {
		if strings.EqualFold(ext, blocked) {
			return ErrBlockedExtension
		}
	}

	return nil
}

// ValidateMIME checks if the detected MIME type matches the file extension
func ValidateMIME(filename string, content []byte) error {
	ext := filepath.Ext(filename)
	expectedMIME := mime.TypeByExtension(ext)
	
	// Detect actual MIME type from content
	detectedMIME := http.DetectContentType(content)

	// If we have an expected MIME type, do a loose match
	if expectedMIME != "" {
		// Extract base MIME type (without parameters)
		expectedBase := strings.Split(expectedMIME, ";")[0]
		detectedBase := strings.Split(detectedMIME, ";")[0]

		// Allow application/octet-stream as a fallback
		if detectedBase != expectedBase && detectedBase != "application/octet-stream" {
			// Some common mismatches we can allow
			if !isAllowedMIMEMismatch(expectedBase, detectedBase) {
				return ErrMIMEMismatch
			}
		}
	}

	return nil
}

// isAllowedMIMEMismatch handles common acceptable MIME mismatches
func isAllowedMIMEMismatch(expected, detected string) bool {
	// Text files often detected as application/octet-stream
	if strings.HasPrefix(expected, "text/") && detected == "application/octet-stream" {
		return true
	}
	// SVG files can be detected as text/xml, text/plain, or text/html depending on content
	// The detected parameter is the base MIME type (charset already stripped)
	if expected == "image/svg+xml" {
		switch detected {
		case "text/xml", "text/plain", "text/html", "application/xml":
			return true
		}
	}
	// JavaScript files might be detected as text/plain
	if expected == "application/javascript" || expected == "text/javascript" {
		if detected == "text/plain" {
			return true
		}
	}
	// CSS files might be detected as text/plain
	if expected == "text/css" && detected == "text/plain" {
		return true
	}
	// JSON files might be detected as text/plain
	if expected == "application/json" && detected == "text/plain" {
		return true
	}
	return false
}

// ComputeSHA256 computes the SHA256 hash of a reader
func ComputeSHA256(r io.Reader) (string, error) {
	h := sha256.New()
	if _, err := io.Copy(h, r); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// ComputeSHA256Bytes computes SHA256 hash of a byte slice
func ComputeSHA256Bytes(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

// ParseBlockedExtensions parses a comma-separated list of extensions
func ParseBlockedExtensions(s string) []string {
	if s == "" {
		return DefaultBlockedExtensions
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, strings.ToLower(p))
		}
	}
	return result
}
