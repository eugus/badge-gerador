ALTER TABLE badge_assignments 
ADD COLUMN download_token VARCHAR(36) UNIQUE,
ADD COLUMN download_count INT DEFAULT 0 NOT NULL,
ADD COLUMN last_downloaded_at TIMESTAMP NULL,
ADD COLUMN token_expires_at TIMESTAMP NULL;

-- Gerar tokens para assignments existentes
UPDATE badge_assignments 
SET download_token = UUID(),
    token_expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
WHERE download_token IS NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_badge_assignments_token ON badge_assignments(download_token);
CREATE INDEX idx_badge_assignments_expires ON badge_assignments(token_expires_at);