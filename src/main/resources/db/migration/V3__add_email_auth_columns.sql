-- =============================================
-- V3: Colunas de verificação de email e 2FA
-- =============================================

ALTER TABLE usuarios
    ADD COLUMN email_verificado         BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN dois_fatores_ativo       BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN codigo_verificacao       VARCHAR(6),
    ADD COLUMN codigo_verificacao_expira_em TIMESTAMP,
    ADD COLUMN codigo_tipo              VARCHAR(30),
    ADD COLUMN temp_token_2fa           VARCHAR(36),
    ADD COLUMN temp_token_2fa_expira_em TIMESTAMP;

-- Marca usuários já existentes como verificados para não bloquear acesso
UPDATE usuarios SET email_verificado = TRUE WHERE email_verificado = FALSE;
