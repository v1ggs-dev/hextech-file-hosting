package security

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

var (
	ErrPathTraversal    = errors.New("path traversal attempt detected")
	ErrSymlinkDetected  = errors.New("symlinks are not allowed")
	ErrOutsideBaseDir   = errors.New("path is outside base directory")
	ErrInvalidPath      = errors.New("invalid path")
)

// ValidatePath ensures a path is safe and within the base directory
// Returns the canonicalized absolute path if valid
func ValidatePath(basePath, requestedPath string) (string, error) {
	if requestedPath == "" {
		requestedPath = "/"
	}

	// Normalize the base path
	absBase, err := filepath.Abs(basePath)
	if err != nil {
		return "", ErrInvalidPath
	}
	absBase = filepath.Clean(absBase)

	// Check for obvious traversal patterns
	if strings.Contains(requestedPath, "..") {
		return "", ErrPathTraversal
	}

	// Join and normalize
	fullPath := filepath.Join(absBase, requestedPath)
	fullPath = filepath.Clean(fullPath)

	// Ensure the path is within base directory
	if !strings.HasPrefix(fullPath, absBase) {
		return "", ErrOutsideBaseDir
	}

	return fullPath, nil
}

// ValidatePathExists validates the path and ensures it exists
func ValidatePathExists(basePath, requestedPath string) (string, error) {
	fullPath, err := ValidatePath(basePath, requestedPath)
	if err != nil {
		return "", err
	}

	// Check if path exists
	info, err := os.Lstat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", ErrInvalidPath
		}
		return "", err
	}

	// Check for symlinks
	if info.Mode()&os.ModeSymlink != 0 {
		return "", ErrSymlinkDetected
	}

	return fullPath, nil
}

// ValidateParentExists validates the path's parent directory exists
func ValidateParentExists(basePath, requestedPath string) (string, error) {
	fullPath, err := ValidatePath(basePath, requestedPath)
	if err != nil {
		return "", err
	}

	// Check parent directory exists
	parentDir := filepath.Dir(fullPath)
	info, err := os.Stat(parentDir)
	if err != nil {
		return "", ErrInvalidPath
	}
	if !info.IsDir() {
		return "", ErrInvalidPath
	}

	return fullPath, nil
}

// IsSymlink checks if a path is a symlink
func IsSymlink(path string) (bool, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return false, err
	}
	return info.Mode()&os.ModeSymlink != 0, nil
}

// GetRelativePath returns the path relative to the base directory
func GetRelativePath(basePath, fullPath string) string {
	rel, err := filepath.Rel(basePath, fullPath)
	if err != nil {
		return fullPath
	}
	// Convert to forward slashes for consistency
	return "/" + strings.ReplaceAll(rel, "\\", "/")
}
