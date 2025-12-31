package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"hextech-panel/config"
	"hextech-panel/db"
	"hextech-panel/security"
)

// SettingsResponse represents the settings response
type SettingsResponse struct {
	BaseDirectory     string   `json:"base_directory"`
	MaxUploadSize     int64    `json:"max_upload_size"`
	BlockedExtensions []string `json:"blocked_extensions"`
	PublicHostname    string   `json:"public_hostname"`
}

// GetSettings handles fetching settings
func GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := db.GetAllSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch settings")
		return
	}

	maxSize, _ := strconv.ParseInt(settings["max_upload_size"], 10, 64)
	if maxSize == 0 {
		maxSize = 100 * 1024 * 1024
	}

	response := SettingsResponse{
		BaseDirectory:     settings["base_directory"],
		MaxUploadSize:     maxSize,
		BlockedExtensions: security.ParseBlockedExtensions(settings["blocked_extensions"]),
		PublicHostname:    settings["public_hostname"],
	}

	if response.BaseDirectory == "" {
		response.BaseDirectory = config.CDNPath
	}
	if response.PublicHostname == "" {
		response.PublicHostname = config.PublicHostname
	}

	writeJSON(w, http.StatusOK, response)
}

// UpdateSettingsRequest represents the update settings request
type UpdateSettingsRequest struct {
	BaseDirectory     *string   `json:"base_directory,omitempty"`
	MaxUploadSize     *int64    `json:"max_upload_size,omitempty"`
	BlockedExtensions *[]string `json:"blocked_extensions,omitempty"`
	PublicHostname    *string   `json:"public_hostname,omitempty"`
}

// UpdateSettings handles updating settings
func UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req UpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.BaseDirectory != nil {
		if err := db.SetSetting("base_directory", *req.BaseDirectory); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to update base_directory")
			return
		}
	}

	if req.MaxUploadSize != nil {
		if err := db.SetSetting("max_upload_size", strconv.FormatInt(*req.MaxUploadSize, 10)); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to update max_upload_size")
			return
		}
	}

	if req.BlockedExtensions != nil {
		value := ""
		for i, ext := range *req.BlockedExtensions {
			if i > 0 {
				value += ","
			}
			value += ext
		}
		if err := db.SetSetting("blocked_extensions", value); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to update blocked_extensions")
			return
		}
	}

	if req.PublicHostname != nil {
		if err := db.SetSetting("public_hostname", *req.PublicHostname); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to update public_hostname")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Settings updated successfully",
	})
}
