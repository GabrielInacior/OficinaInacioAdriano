-- =============================================
-- V4: Histórico de alterações de status das OS
-- =============================================

CREATE TABLE historico_os (
    id              BIGSERIAL    PRIMARY KEY,
    codordem        BIGINT       NOT NULL REFERENCES ordensservico(codordem),
    status_anterior VARCHAR(50),
    novo_status     VARCHAR(50)  NOT NULL,
    usuario_id      BIGINT       REFERENCES usuarios(id),
    observacao      VARCHAR(255),
    criado_em       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historico_os_codordem ON historico_os(codordem);
