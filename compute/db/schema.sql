-- Hextech File Hosting Control Panel - Database Schema

-- File metadata cache (optional, filesystem is source of truth)
CREATE TABLE IF NOT EXISTS file_metadata (
    path TEXT PRIMARY KEY,
    sha256 TEXT NOT NULL,
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL CHECK(action IN ('upload', 'rename', 'move', 'replace', 'delete')),
    file_path TEXT NOT NULL,
    source_ip TEXT
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Default settings (will be overridden by environment variables)
-- These are just initial placeholders - the app uses config.CDNPath and config.PublicHostname
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('base_directory', ''),
    ('max_upload_size', '104857600'),
    ('blocked_extensions', 'php,phtml,phar,cgi,pl,py,sh,exe,dll,so,bin,bat,cmd,ps1'),
    ('public_hostname', '');

-- Index for faster log queries
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
