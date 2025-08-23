-- Version and Upgrade Management Schema
-- This file contains the database schema for managing version information,
-- upgrade history, user preferences, and rollback capabilities

-- Table for storing version information and release metadata
CREATE TABLE IF NOT EXISTS versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    release_notes TEXT,
    docker_image VARCHAR(255),
    severity VARCHAR(20) CHECK (severity IN ('patch', 'minor', 'major')) NOT NULL,
    prerequisites TEXT[], -- Array of version prerequisites
    migration_scripts TEXT[], -- Array of migration script paths
    features TEXT[], -- Array of new features
    bug_fixes TEXT[], -- Array of bug fixes
    breaking_changes TEXT[], -- Array of breaking changes
    download_url VARCHAR(500),
    is_stable BOOLEAN DEFAULT true,
    is_prerelease BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient version lookups
CREATE INDEX IF NOT EXISTS idx_versions_version ON versions(version);
CREATE INDEX IF NOT EXISTS idx_versions_release_date ON versions(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_versions_stable ON versions(is_stable, is_prerelease);

-- Table for tracking upgrade sessions and their progress
CREATE TABLE IF NOT EXISTS upgrade_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255), -- Optional user identifier
    session_id VARCHAR(255), -- Web session ID
    from_version VARCHAR(50) NOT NULL,
    to_version VARCHAR(50) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'rolled_back')) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_step VARCHAR(255),
    current_operation VARCHAR(255),
    estimated_time_remaining INTEGER, -- in seconds
    total_steps INTEGER,
    completed_steps INTEGER DEFAULT 0,
    options JSONB, -- Upgrade options (backup enabled, rollback on failure, etc.)
    error_message TEXT,
    rollback_available BOOLEAN DEFAULT true,
    backup_created BOOLEAN DEFAULT false,
    backup_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for upgrade sessions
CREATE INDEX IF NOT EXISTS idx_upgrade_sessions_status ON upgrade_sessions(status);
CREATE INDEX IF NOT EXISTS idx_upgrade_sessions_user ON upgrade_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_sessions_session ON upgrade_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_sessions_start_time ON upgrade_sessions(start_time DESC);

-- Table for storing detailed upgrade logs
CREATE TABLE IF NOT EXISTS upgrade_logs (
    id SERIAL PRIMARY KEY,
    upgrade_session_id UUID NOT NULL REFERENCES upgrade_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    step VARCHAR(255),
    operation VARCHAR(255),
    metadata JSONB, -- Additional structured data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for upgrade logs\nCREATE INDEX IF NOT EXISTS idx_upgrade_logs_session ON upgrade_logs(upgrade_session_id);\nCREATE INDEX IF NOT EXISTS idx_upgrade_logs_timestamp ON upgrade_logs(timestamp DESC);\nCREATE INDEX IF NOT EXISTS idx_upgrade_logs_level ON upgrade_logs(level);\n\n-- Table for user preferences related to upgrades\nCREATE TABLE IF NOT EXISTS upgrade_preferences (\n    id SERIAL PRIMARY KEY,\n    user_id VARCHAR(255), -- Optional user identifier\n    session_id VARCHAR(255), -- Web session ID for anonymous users\n    auto_check_enabled BOOLEAN DEFAULT true,\n    check_interval INTEGER DEFAULT 300000, -- in milliseconds, default 5 minutes\n    notification_frequency VARCHAR(20) CHECK (notification_frequency IN ('immediate', 'daily', 'weekly', 'monthly')) DEFAULT 'immediate',\n    auto_backup_enabled BOOLEAN DEFAULT true,\n    allow_major_upgrades BOOLEAN DEFAULT true,\n    allow_prerelease_upgrades BOOLEAN DEFAULT false,\n    maintenance_window_start TIME,\n    maintenance_window_end TIME,\n    maintenance_window_timezone VARCHAR(50) DEFAULT 'UTC',\n    notification_dismissed_versions TEXT[], -- Array of dismissed version notifications\n    skipped_versions TEXT[], -- Array of permanently skipped versions\n    last_check_time TIMESTAMP WITH TIME ZONE,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n    UNIQUE(user_id, session_id)\n);\n\n-- Index for user preferences\nCREATE INDEX IF NOT EXISTS idx_upgrade_preferences_user ON upgrade_preferences(user_id);\nCREATE INDEX IF NOT EXISTS idx_upgrade_preferences_session ON upgrade_preferences(session_id);\n\n-- Table for tracking rollback operations\nCREATE TABLE IF NOT EXISTS rollback_sessions (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    original_upgrade_session_id UUID NOT NULL REFERENCES upgrade_sessions(id),\n    from_version VARCHAR(50) NOT NULL, -- Version rolling back from\n    to_version VARCHAR(50) NOT NULL,   -- Version rolling back to\n    status VARCHAR(20) CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')) NOT NULL DEFAULT 'pending',\n    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n    end_time TIMESTAMP WITH TIME ZONE,\n    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),\n    current_step VARCHAR(255),\n    error_message TEXT,\n    backup_restored BOOLEAN DEFAULT false,\n    data_restored BOOLEAN DEFAULT false,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Index for rollback sessions\nCREATE INDEX IF NOT EXISTS idx_rollback_sessions_upgrade ON rollback_sessions(original_upgrade_session_id);\nCREATE INDEX IF NOT EXISTS idx_rollback_sessions_status ON rollback_sessions(status);\n\n-- Table for tracking version compatibility and upgrade paths\nCREATE TABLE IF NOT EXISTS version_compatibility (\n    id SERIAL PRIMARY KEY,\n    from_version VARCHAR(50) NOT NULL,\n    to_version VARCHAR(50) NOT NULL,\n    is_direct_upgrade BOOLEAN DEFAULT true,\n    intermediate_versions TEXT[], -- Required intermediate upgrade steps\n    compatibility_notes TEXT,\n    migration_required BOOLEAN DEFAULT false,\n    data_backup_required BOOLEAN DEFAULT false,\n    estimated_duration_minutes INTEGER,\n    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n    UNIQUE(from_version, to_version)\n);\n\n-- Index for version compatibility\nCREATE INDEX IF NOT EXISTS idx_version_compatibility_from ON version_compatibility(from_version);\nCREATE INDEX IF NOT EXISTS idx_version_compatibility_to ON version_compatibility(to_version);\n\n-- Table for storing system health checks before/after upgrades\nCREATE TABLE IF NOT EXISTS system_health_checks (\n    id SERIAL PRIMARY KEY,\n    upgrade_session_id UUID REFERENCES upgrade_sessions(id) ON DELETE CASCADE,\n    rollback_session_id UUID REFERENCES rollback_sessions(id) ON DELETE CASCADE,\n    check_type VARCHAR(50) NOT NULL, -- 'pre_upgrade', 'post_upgrade', 'pre_rollback', 'post_rollback'\n    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n    status VARCHAR(20) CHECK (status IN ('passed', 'failed', 'warning', 'skipped')) NOT NULL,\n    check_name VARCHAR(255) NOT NULL,\n    check_description TEXT,\n    result_details JSONB,\n    error_message TEXT,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Index for health checks\nCREATE INDEX IF NOT EXISTS idx_health_checks_upgrade ON system_health_checks(upgrade_session_id);\nCREATE INDEX IF NOT EXISTS idx_health_checks_rollback ON system_health_checks(rollback_session_id);\nCREATE INDEX IF NOT EXISTS idx_health_checks_type ON system_health_checks(check_type);\n\n-- Function to update timestamps automatically\nCREATE OR REPLACE FUNCTION update_updated_at_column()\nRETURNS TRIGGER AS $$\nBEGIN\n    NEW.updated_at = CURRENT_TIMESTAMP;\n    RETURN NEW;\nEND;\n$$ language 'plpgsql';\n\n-- Triggers for automatic timestamp updates\nCREATE TRIGGER update_versions_updated_at BEFORE UPDATE ON versions\n    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n\nCREATE TRIGGER update_upgrade_sessions_updated_at BEFORE UPDATE ON upgrade_sessions\n    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n\nCREATE TRIGGER update_upgrade_preferences_updated_at BEFORE UPDATE ON upgrade_preferences\n    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n\nCREATE TRIGGER update_rollback_sessions_updated_at BEFORE UPDATE ON rollback_sessions\n    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n\n-- Insert some initial version compatibility data\nINSERT INTO version_compatibility (from_version, to_version, estimated_duration_minutes, risk_level)\nVALUES \n    ('1.0.304', '1.0.314', 5, 'low'),\n    ('1.0.300', '1.0.314', 8, 'medium')\nON CONFLICT (from_version, to_version) DO NOTHING;\n\n-- Create a view for recent upgrade activity\nCREATE OR REPLACE VIEW recent_upgrade_activity AS\nSELECT \n    us.id,\n    us.from_version,\n    us.to_version,\n    us.status,\n    us.start_time,\n    us.end_time,\n    us.progress_percentage,\n    us.current_operation,\n    CASE \n        WHEN us.end_time IS NOT NULL THEN \n            EXTRACT(EPOCH FROM (us.end_time - us.start_time))\n        ELSE \n            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - us.start_time))\n    END as duration_seconds,\n    (us.options->>'backupEnabled')::boolean as backup_enabled,\n    (us.options->>'rollbackOnFailure')::boolean as rollback_on_failure\nFROM upgrade_sessions us\nORDER BY us.start_time DESC\nLIMIT 50;\n\n-- Create a view for upgrade statistics\nCREATE OR REPLACE VIEW upgrade_statistics AS\nSELECT \n    DATE_TRUNC('day', start_time) as date,\n    COUNT(*) as total_upgrades,\n    COUNT(*) FILTER (WHERE status = 'completed') as successful_upgrades,\n    COUNT(*) FILTER (WHERE status = 'failed') as failed_upgrades,\n    COUNT(*) FILTER (WHERE status = 'rolled_back') as rolled_back_upgrades,\n    AVG(EXTRACT(EPOCH FROM (end_time - start_time))) FILTER (WHERE status = 'completed') as avg_duration_seconds\nFROM upgrade_sessions\nWHERE start_time >= CURRENT_DATE - INTERVAL '30 days'\nGROUP BY DATE_TRUNC('day', start_time)\nORDER BY date DESC;\n"