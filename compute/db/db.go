package db

import (
	"database/sql"
	_ "embed"
	"log"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

//go:embed schema.sql
var schemaSQL string

var (
	database *sql.DB
	once     sync.Once
)

// Init initializes the database connection and runs schema
func Init(dbPath string) error {
	var initErr error
	once.Do(func() {
		var err error
		database, err = sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
		if err != nil {
			initErr = err
			return
		}

		// Run schema
		if _, err := database.Exec(schemaSQL); err != nil {
			initErr = err
			return
		}

		log.Println("Database initialized successfully")
	})
	return initErr
}

// Get returns the database connection
func Get() *sql.DB {
	return database
}

// Close closes the database connection
func Close() error {
	if database != nil {
		return database.Close()
	}
	return nil
}

// LogActivity records an activity in the log
func LogActivity(action, filePath, sourceIP string) error {
	_, err := database.Exec(
		"INSERT INTO activity_log (action, file_path, source_ip) VALUES (?, ?, ?)",
		action, filePath, sourceIP,
	)
	return err
}

// GetLogs retrieves activity logs with pagination
func GetLogs(limit, offset int) ([]ActivityLog, error) {
	rows, err := database.Query(
		"SELECT id, timestamp, action, file_path, source_ip FROM activity_log ORDER BY timestamp DESC LIMIT ? OFFSET ?",
		limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []ActivityLog
	for rows.Next() {
		var log ActivityLog
		var sourceIP sql.NullString
		if err := rows.Scan(&log.ID, &log.Timestamp, &log.Action, &log.FilePath, &sourceIP); err != nil {
			return nil, err
		}
		log.SourceIP = sourceIP.String
		logs = append(logs, log)
	}
	return logs, rows.Err()
}

// ActivityLog represents a log entry
type ActivityLog struct {
	ID        int64  `json:"id"`
	Timestamp string `json:"timestamp"`
	Action    string `json:"action"`
	FilePath  string `json:"file_path"`
	SourceIP  string `json:"source_ip,omitempty"`
}

// GetSetting retrieves a setting value
func GetSetting(key string) (string, error) {
	var value string
	err := database.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&value)
	return value, err
}

// SetSetting updates a setting value
func SetSetting(key, value string) error {
	_, err := database.Exec("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, value)
	return err
}

// GetAllSettings retrieves all settings
func GetAllSettings() (map[string]string, error) {
	rows, err := database.Query("SELECT key, value FROM settings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		settings[key] = value
	}
	return settings, rows.Err()
}

// SaveFileHash stores a file's SHA256 hash
func SaveFileHash(path, hash string) error {
	_, err := database.Exec(
		"INSERT OR REPLACE INTO file_metadata (path, sha256, computed_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
		path, hash,
	)
	return err
}

// GetFileHash retrieves a cached file hash
func GetFileHash(path string) (string, error) {
	var hash string
	err := database.QueryRow("SELECT sha256 FROM file_metadata WHERE path = ?", path).Scan(&hash)
	return hash, err
}

// DeleteFileHash removes a cached hash entry
func DeleteFileHash(path string) error {
	_, err := database.Exec("DELETE FROM file_metadata WHERE path = ?", path)
	return err
}
