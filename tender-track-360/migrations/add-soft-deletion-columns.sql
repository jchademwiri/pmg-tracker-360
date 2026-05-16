-- Migration: Add soft deletion columns to existing tables
-- Run this script to add the new columns for soft deletion functionality
-- Add soft deletion columns to organization table
ALTER TABLE organization
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES "user"(id),
    ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
    ADD COLUMN IF NOT EXISTS permanent_deletion_scheduled_at TIMESTAMP;
-- Add soft deletion columns to tender table
ALTER TABLE tender
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES "user"(id);
-- Add soft deletion columns to follow_up table
ALTER TABLE follow_up
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES "user"(id);
-- Add soft deletion columns to contract table
ALTER TABLE contract
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES "user"(id);
-- Create new tables for advanced features
-- Ownership transfers table
CREATE TABLE IF NOT EXISTS ownership_transfer (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    from_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    to_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL,
    transfer_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    metadata TEXT -- JSON
);
-- Security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    -- JSON
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    severity TEXT DEFAULT 'info' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
-- Organization deletion log table
CREATE TABLE IF NOT EXISTS organization_deletion_log (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    deleted_by TEXT NOT NULL REFERENCES "user"(id),
    deletion_reason TEXT,
    deletion_type TEXT DEFAULT 'soft' NOT NULL,
    data_exported BOOLEAN DEFAULT FALSE NOT NULL,
    export_format TEXT,
    confirmation_token TEXT NOT NULL,
    related_data_count TEXT,
    -- JSON
    soft_deleted_at TIMESTAMP DEFAULT NOW() NOT NULL,
    permanent_deletion_scheduled_at TIMESTAMP,
    permanent_deleted_at TIMESTAMP,
    restored_at TIMESTAMP,
    restored_by TEXT REFERENCES "user"(id),
    metadata TEXT -- JSON
);
-- Session tracking table
CREATE TABLE IF NOT EXISTS session_tracking (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organization(id) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT NOW() NOT NULL,
    last_activity TIMESTAMP DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    -- JSON
    location_info TEXT,
    -- JSON
    is_suspicious BOOLEAN DEFAULT FALSE NOT NULL,
    logout_time TIMESTAMP
);
-- Organization security settings table
CREATE TABLE IF NOT EXISTS organization_security_settings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    require_2fa BOOLEAN DEFAULT FALSE NOT NULL,
    ip_whitelist TEXT,
    -- JSON array
    session_timeout TEXT DEFAULT '86400' NOT NULL,
    -- seconds as string
    max_concurrent_sessions TEXT DEFAULT '5' NOT NULL,
    login_attempt_limit TEXT DEFAULT '5' NOT NULL,
    lockout_duration TEXT DEFAULT '900' NOT NULL,
    -- seconds as string
    password_policy TEXT,
    -- JSON
    audit_retention_days TEXT DEFAULT '365' NOT NULL,
    auto_permanent_delete_days TEXT DEFAULT '30' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_deleted_at ON organization(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tender_deleted_at ON tender(deleted_at);
CREATE INDEX IF NOT EXISTS idx_follow_up_deleted_at ON follow_up(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contract_deleted_at ON contract(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_status ON ownership_transfer(status);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_org_id ON security_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_session_id ON session_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_organization_security_settings_org_id ON organization_security_settings(organization_id);
-- Add comments for documentation
COMMENT ON COLUMN organization.deleted_at IS 'Timestamp when organization was soft deleted';
COMMENT ON COLUMN organization.deleted_by IS 'User ID who deleted the organization';
COMMENT ON COLUMN organization.deletion_reason IS 'Reason provided for deletion';
COMMENT ON COLUMN organization.permanent_deletion_scheduled_at IS 'When permanent deletion is scheduled';
COMMENT ON TABLE ownership_transfer IS 'Tracks organization ownership transfers';
COMMENT ON TABLE security_audit_log IS 'Security events and audit trail';
COMMENT ON TABLE organization_deletion_log IS 'Log of organization deletions and restorations';
COMMENT ON TABLE session_tracking IS 'Enhanced session tracking with device info';
COMMENT ON TABLE organization_security_settings IS 'Organization-specific security settings';