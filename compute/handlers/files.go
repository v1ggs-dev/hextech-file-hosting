package handlers

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"hextech-panel/config"
	"hextech-panel/db"
	"hextech-panel/security"
)

// FileInfo represents a file or directory
type FileInfo struct {
	Name     string    `json:"name"`
	Path     string    `json:"path"`
	IsDir    bool      `json:"is_dir"`
	Size     int64     `json:"size"`
	Modified time.Time `json:"modified"`
	MIMEType string    `json:"mime_type,omitempty"`
}

// FileMetadata represents detailed file information
type FileMetadata struct {
	Name      string    `json:"name"`
	Path      string    `json:"path"`
	FullPath  string    `json:"full_path"`
	Size      int64     `json:"size"`
	MIMEType  string    `json:"mime_type"`
	SHA256    string    `json:"sha256"`
	Created   time.Time `json:"created"`
	Modified  time.Time `json:"modified"`
	PublicURL string    `json:"public_url"`
}

// ListResponse represents the response for listing files
type ListResponse struct {
	Path  string     `json:"path"`
	Files []FileInfo `json:"files"`
}

// getSettings retrieves common settings
func getSettings() (basePath string, maxUploadSize int64, blockedExts []string, publicHost string, err error) {
	basePath, err = db.GetSetting("base_directory")
	if err != nil || basePath == "" {
		basePath = config.CDNPath // Use env var default
	}

	maxSizeStr, _ := db.GetSetting("max_upload_size")
	maxUploadSize, _ = strconv.ParseInt(maxSizeStr, 10, 64)
	if maxUploadSize == 0 {
		maxUploadSize = 100 * 1024 * 1024 // 100MB default
	}

	blockedStr, _ := db.GetSetting("blocked_extensions")
	blockedExts = security.ParseBlockedExtensions(blockedStr)

	publicHost, _ = db.GetSetting("public_hostname")
	if publicHost == "" {
		publicHost = config.PublicHostname // Use env var default
	}

	return
}

// getClientIP extracts client IP from request
func getClientIP(r *http.Request) string {
	// Check Cloudflare header first
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}
	// Fall back to X-Forwarded-For
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return strings.Split(ip, ",")[0]
	}
	// Fall back to remote addr
	return strings.Split(r.RemoteAddr, ":")[0]
}

// writeJSON writes a JSON response
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// writeError writes an error response
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// ListFiles handles listing directory contents
func ListFiles(w http.ResponseWriter, r *http.Request) {
	basePath, _, _, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	requestedPath := r.URL.Query().Get("path")
	if requestedPath == "" {
		requestedPath = "/"
	}

	fullPath, err := security.ValidatePathExists(basePath, requestedPath)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		writeError(w, http.StatusNotFound, "Path not found")
		return
	}

	if !info.IsDir() {
		writeError(w, http.StatusBadRequest, "Path is not a directory")
		return
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to read directory")
		return
	}

	files := make([]FileInfo, 0, len(entries))
	for _, entry := range entries {
		// Skip symlinks
		if entry.Type()&os.ModeSymlink != 0 {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		fi := FileInfo{
			Name:     entry.Name(),
			Path:     filepath.Join(requestedPath, entry.Name()),
			IsDir:    entry.IsDir(),
			Size:     info.Size(),
			Modified: info.ModTime(),
		}

		if !entry.IsDir() {
			ext := filepath.Ext(entry.Name())
			fi.MIMEType = getMIMEType(ext)
		}

		files = append(files, fi)
	}

	// Sort by name by default
	sortBy := r.URL.Query().Get("sort")
	sortDir := r.URL.Query().Get("dir")
	sortFiles(files, sortBy, sortDir == "desc")

	writeJSON(w, http.StatusOK, ListResponse{
		Path:  requestedPath,
		Files: files,
	})
}

// sortFiles sorts the file list
func sortFiles(files []FileInfo, sortBy string, desc bool) {
	sort.Slice(files, func(i, j int) bool {
		// Directories always come first
		if files[i].IsDir != files[j].IsDir {
			return files[i].IsDir
		}

		var less bool
		switch sortBy {
		case "size":
			less = files[i].Size < files[j].Size
		case "modified":
			less = files[i].Modified.Before(files[j].Modified)
		default: // name
			less = strings.ToLower(files[i].Name) < strings.ToLower(files[j].Name)
		}

		if desc {
			return !less
		}
		return less
	})
}

// getMIMEType returns MIME type for an extension
func getMIMEType(ext string) string {
	types := map[string]string{
		".html": "text/html",
		".css":  "text/css",
		".js":   "application/javascript",
		".json": "application/json",
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".gif":  "image/gif",
		".svg":  "image/svg+xml",
		".pdf":  "application/pdf",
		".zip":  "application/zip",
		".txt":  "text/plain",
		".md":   "text/markdown",
	}
	if t, ok := types[strings.ToLower(ext)]; ok {
		return t
	}
	return "application/octet-stream"
}

// GetMetadata handles fetching file metadata
func GetMetadata(w http.ResponseWriter, r *http.Request) {
	basePath, _, _, publicHost, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	requestedPath := r.URL.Query().Get("path")
	if requestedPath == "" {
		writeError(w, http.StatusBadRequest, "Path is required")
		return
	}

	fullPath, err := security.ValidatePathExists(basePath, requestedPath)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		writeError(w, http.StatusNotFound, "File not found")
		return
	}

	if info.IsDir() {
		writeError(w, http.StatusBadRequest, "Path is a directory")
		return
	}

	// Compute or retrieve SHA256
	hash, err := db.GetFileHash(requestedPath)
	if err != nil {
		// Compute hash
		f, err := os.Open(fullPath)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to read file")
			return
		}
		defer f.Close()

		hash, err = security.ComputeSHA256(f)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to compute hash")
			return
		}

		// Cache the hash
		db.SaveFileHash(requestedPath, hash)
	}

	ext := filepath.Ext(info.Name())

	// Build public URL
	publicPath := strings.TrimPrefix(requestedPath, "/")
	publicURL := "https://" + publicHost + "/" + publicPath

	metadata := FileMetadata{
		Name:      info.Name(),
		Path:      requestedPath,
		FullPath:  fullPath,
		Size:      info.Size(),
		MIMEType:  getMIMEType(ext),
		SHA256:    hash,
		Created:   info.ModTime(), // Go doesn't have creation time on all platforms
		Modified:  info.ModTime(),
		PublicURL: publicURL,
	}

	writeJSON(w, http.StatusOK, metadata)
}

// UploadFile handles file uploads
func UploadFile(w http.ResponseWriter, r *http.Request) {
	basePath, maxSize, blockedExts, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	// Limit request size
	r.Body = http.MaxBytesReader(w, r.Body, maxSize)

	// Parse multipart form
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to parse form: "+err.Error())
		return
	}

	targetDir := r.FormValue("directory")
	if targetDir == "" {
		targetDir = "/"
	}
	overwrite := r.FormValue("overwrite") == "true"

	// Validate target directory
	targetPath, err := security.ValidatePathExists(basePath, targetDir)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid target directory: "+err.Error())
		return
	}

	dirInfo, err := os.Stat(targetPath)
	if err != nil || !dirInfo.IsDir() {
		writeError(w, http.StatusBadRequest, "Target is not a directory")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Validate filename
	filename, err := security.ValidateFilename(header.Filename)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid filename: "+err.Error())
		return
	}

	// Check extension
	if err := security.ValidateExtension(filename, blockedExts); err != nil {
		writeError(w, http.StatusBadRequest, "File type not allowed: "+err.Error())
		return
	}

	// Read file content
	content, err := io.ReadAll(file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// Validate MIME type
	if err := security.ValidateMIME(filename, content); err != nil {
		writeError(w, http.StatusBadRequest, "MIME type mismatch: "+err.Error())
		return
	}

	// Compute hash
	hash := security.ComputeSHA256Bytes(content)

	// Full file path
	filePath := filepath.Join(targetPath, filename)
	relativePath := filepath.Join(targetDir, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); err == nil && !overwrite {
		writeError(w, http.StatusConflict, "File already exists")
		return
	}

	// Write file
	if err := os.WriteFile(filePath, content, 0644); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to write file")
		return
	}

	// Cache hash
	db.SaveFileHash(relativePath, hash)

	// Log activity
	db.LogActivity("upload", relativePath, getClientIP(r))

	writeJSON(w, http.StatusCreated, map[string]string{
		"message": "File uploaded successfully",
		"path":    relativePath,
		"sha256":  hash,
	})
}

// RenameFile handles file renaming
func RenameFile(w http.ResponseWriter, r *http.Request) {
	basePath, _, blockedExts, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	var req struct {
		Path    string `json:"path"`
		NewName string `json:"new_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate source path
	srcPath, err := security.ValidatePathExists(basePath, req.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid source path: "+err.Error())
		return
	}

	// Validate new filename
	newName, err := security.ValidateFilename(req.NewName)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid new filename: "+err.Error())
		return
	}

	// Check extension
	if err := security.ValidateExtension(newName, blockedExts); err != nil {
		writeError(w, http.StatusBadRequest, "File type not allowed: "+err.Error())
		return
	}

	// Build destination path
	dstPath := filepath.Join(filepath.Dir(srcPath), newName)

	// Check if destination exists
	if _, err := os.Stat(dstPath); err == nil {
		writeError(w, http.StatusConflict, "A file with this name already exists")
		return
	}

	// Rename
	if err := os.Rename(srcPath, dstPath); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to rename file")
		return
	}

	// Update hash cache
	newRelPath := security.GetRelativePath(basePath, dstPath)
	db.DeleteFileHash(req.Path)

	// Log activity
	db.LogActivity("rename", req.Path+" -> "+newRelPath, getClientIP(r))

	writeJSON(w, http.StatusOK, map[string]string{
		"message":  "File renamed successfully",
		"old_path": req.Path,
		"new_path": newRelPath,
	})
}

// MoveFile handles moving files
func MoveFile(w http.ResponseWriter, r *http.Request) {
	basePath, _, _, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	var req struct {
		Path        string `json:"path"`
		Destination string `json:"destination"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate source
	srcPath, err := security.ValidatePathExists(basePath, req.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid source path: "+err.Error())
		return
	}

	// Validate destination directory
	dstDir, err := security.ValidatePathExists(basePath, req.Destination)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid destination: "+err.Error())
		return
	}

	dstInfo, err := os.Stat(dstDir)
	if err != nil || !dstInfo.IsDir() {
		writeError(w, http.StatusBadRequest, "Destination is not a directory")
		return
	}

	// Build destination path
	filename := filepath.Base(srcPath)
	dstPath := filepath.Join(dstDir, filename)

	// Check if destination file exists
	if _, err := os.Stat(dstPath); err == nil {
		writeError(w, http.StatusConflict, "File already exists at destination")
		return
	}

	// Move
	if err := os.Rename(srcPath, dstPath); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to move file")
		return
	}

	// Update cache
	newRelPath := security.GetRelativePath(basePath, dstPath)
	db.DeleteFileHash(req.Path)

	// Log activity
	db.LogActivity("move", req.Path+" -> "+newRelPath, getClientIP(r))

	writeJSON(w, http.StatusOK, map[string]string{
		"message":  "File moved successfully",
		"old_path": req.Path,
		"new_path": newRelPath,
	})
}

// ReplaceFile handles replacing file contents
func ReplaceFile(w http.ResponseWriter, r *http.Request) {
	basePath, maxSize, blockedExts, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxSize)

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	targetPath := r.FormValue("path")
	if targetPath == "" {
		writeError(w, http.StatusBadRequest, "Path is required")
		return
	}

	// Validate target exists
	fullPath, err := security.ValidatePathExists(basePath, targetPath)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path: "+err.Error())
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		writeError(w, http.StatusNotFound, "File not found")
		return
	}
	if info.IsDir() {
		writeError(w, http.StatusBadRequest, "Cannot replace a directory")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Read content
	content, err := io.ReadAll(file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// Validate MIME
	if err := security.ValidateMIME(filepath.Base(fullPath), content); err != nil {
		writeError(w, http.StatusBadRequest, "MIME type mismatch")
		return
	}

	// Check extension still valid
	if err := security.ValidateExtension(filepath.Base(fullPath), blockedExts); err != nil {
		writeError(w, http.StatusBadRequest, "File type not allowed")
		return
	}

	// Compute hash
	hash := security.ComputeSHA256Bytes(content)

	// Write file
	if err := os.WriteFile(fullPath, content, 0644); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to write file")
		return
	}

	// Update hash
	db.SaveFileHash(targetPath, hash)

	// Log activity
	db.LogActivity("replace", targetPath, getClientIP(r))

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "File replaced successfully",
		"path":    targetPath,
		"sha256":  hash,
	})
}

// DeleteFile handles file deletion
func DeleteFile(w http.ResponseWriter, r *http.Request) {
	basePath, _, _, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	var req struct {
		Path            string `json:"path"`
		ConfirmFilename string `json:"confirm_filename"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate path
	fullPath, err := security.ValidatePathExists(basePath, req.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path: "+err.Error())
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		writeError(w, http.StatusNotFound, "File not found")
		return
	}

	// Confirm filename matches
	if req.ConfirmFilename != info.Name() {
		writeError(w, http.StatusBadRequest, "Filename confirmation does not match")
		return
	}

	// Delete
	if info.IsDir() {
		if err := os.RemoveAll(fullPath); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to delete directory")
			return
		}
	} else {
		if err := os.Remove(fullPath); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to delete file")
			return
		}
	}

	// Remove from cache
	db.DeleteFileHash(req.Path)

	// Log activity
	db.LogActivity("delete", req.Path, getClientIP(r))

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "File deleted successfully",
		"path":    req.Path,
	})
}

// CreateDirectory handles directory creation
func CreateDirectory(w http.ResponseWriter, r *http.Request) {
	basePath, _, _, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	var req struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate parent directory
	parentPath, err := security.ValidatePathExists(basePath, req.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path: "+err.Error())
		return
	}

	parentInfo, err := os.Stat(parentPath)
	if err != nil || !parentInfo.IsDir() {
		writeError(w, http.StatusBadRequest, "Path is not a directory")
		return
	}

	// Validate directory name
	dirName, err := security.ValidateFilename(req.Name)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid directory name")
		return
	}

	// Create directory
	newPath := filepath.Join(parentPath, dirName)
	if err := os.Mkdir(newPath, 0755); err != nil {
		if os.IsExist(err) {
			writeError(w, http.StatusConflict, "Directory already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to create directory")
		return
	}

	relativePath := security.GetRelativePath(basePath, newPath)

	writeJSON(w, http.StatusCreated, map[string]string{
		"message": "Directory created successfully",
		"path":    relativePath,
	})
}

// DownloadZip handles downloading multiple files/folders as a ZIP archive
func DownloadZip(w http.ResponseWriter, r *http.Request) {
	basePath, _, _, _, err := getSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load settings")
		return
	}

	var req struct {
		Paths []string `json:"paths"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.Paths) == 0 {
		writeError(w, http.StatusBadRequest, "No paths provided")
		return
	}

	// Validate all paths first
	validatedPaths := make([]string, 0, len(req.Paths))
	for _, p := range req.Paths {
		fullPath, err := security.ValidatePathExists(basePath, p)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Invalid path: "+p)
			return
		}
		validatedPaths = append(validatedPaths, fullPath)
	}

	// Set headers for ZIP download
	filename := "download.zip"
	if len(req.Paths) == 1 {
		filename = filepath.Base(req.Paths[0]) + ".zip"
	}
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))

	// Create ZIP writer
	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	// Add each path to the ZIP
	for i, fullPath := range validatedPaths {
		relativePath := req.Paths[i]
		info, err := os.Stat(fullPath)
		if err != nil {
			continue
		}

		if info.IsDir() {
			// Walk directory and add all files
			err = filepath.Walk(fullPath, func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}

				// Skip symlinks
				if info.Mode()&os.ModeSymlink != 0 {
					return nil
				}

				// Get relative path within the directory
				relPath, err := filepath.Rel(filepath.Dir(fullPath), path)
				if err != nil {
					return err
				}

				// Use forward slashes in ZIP
				zipPath := strings.ReplaceAll(relPath, "\\", "/")

				if info.IsDir() {
					// Add directory entry
					_, err = zipWriter.Create(zipPath + "/")
					return err
				}

				// Add file
				return addFileToZip(zipWriter, path, zipPath)
			})
			if err != nil {
				// Log error but continue with other files
				continue
			}
		} else {
			// Add single file
			zipPath := strings.ReplaceAll(filepath.Base(relativePath), "\\", "/")
			addFileToZip(zipWriter, fullPath, zipPath)
		}
	}
}

// addFileToZip adds a single file to a ZIP archive
func addFileToZip(zipWriter *zip.Writer, filePath, zipPath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return err
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}

	header.Name = zipPath
	header.Method = zip.Deflate

	writer, err := zipWriter.CreateHeader(header)
	if err != nil {
		return err
	}

	_, err = io.Copy(writer, file)
	return err
}
