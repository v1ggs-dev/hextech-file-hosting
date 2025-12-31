package handlers

import (
	"net/http"
	"strconv"

	"hextech-panel/db"
)

// GetLogs handles fetching activity logs
func GetLogs(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50
	offset := 0

	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
		offset = o
	}

	logs, err := db.GetLogs(limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch logs")
		return
	}

	if logs == nil {
		logs = []db.ActivityLog{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"logs":   logs,
		"limit":  limit,
		"offset": offset,
	})
}
