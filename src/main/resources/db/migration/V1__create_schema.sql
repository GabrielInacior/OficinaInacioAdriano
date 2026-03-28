-- =============================================
-- Oficina Inácio Adriano - Schema Principal
-- =============================================

-- Tabela de usuários (autenticação)
CREATE TABLE usuarios (
    id               BIGSERIAL    PRIMARY KEY,
    nome             VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    senha            VARCHAR(255) NOT NULL,
    role             VARCHAR(20)  NOT NULL DEFAULT 'USER',
    ativo            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1. Status das ordens de serviço
CREATE TABLE statusos (
    codstatus   BIGSERIAL   PRIMARY KEY,
    descricao   VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Formas de pagamento
CREATE TABLE formaspagamento (
    codforma BIGSERIAL   PRIMARY KEY,
    nome     VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Clientes
CREATE TABLE clientes (
    codcliente BIGSERIAL    PRIMARY KEY,
    nome       VARCHAR(255) NOT NULL,
    cpf        VARCHAR(14)  NOT NULL UNIQUE,
    telefone   VARCHAR(20)  NOT NULL
);

-- Tabela auxiliar: Modelos de veículos (campo modelo*)
CREATE TABLE modelos (
    codmodelo BIGSERIAL    PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL UNIQUE
);

-- 4. Veículos
CREATE TABLE veiculos (
    codveiculo BIGSERIAL   PRIMARY KEY,
    placa      VARCHAR(10) NOT NULL UNIQUE,
    codmodelo  BIGINT      NOT NULL REFERENCES modelos(codmodelo),
    ano        INTEGER     NOT NULL,
    codcliente BIGINT      NOT NULL REFERENCES clientes(codcliente)
);

-- Tabela auxiliar: Cidades (campo cidade*)
CREATE TABLE cidades (
    codcidade BIGSERIAL    PRIMARY KEY,
    nome      VARCHAR(150) NOT NULL,
    uf        VARCHAR(2)   NOT NULL
);

-- 5. Fornecedores
CREATE TABLE fornecedores (
    codfornecedor BIGSERIAL    PRIMARY KEY,
    razaosocial   VARCHAR(255) NOT NULL,
    cnpj          VARCHAR(18)  NOT NULL UNIQUE,
    codcidade     BIGINT       NOT NULL REFERENCES cidades(codcidade)
);

-- 6. Categorias de peças
CREATE TABLE categoriaspecas (
    codcategoria BIGSERIAL    PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL UNIQUE
);

-- 7. Peças
CREATE TABLE pecas (
    codpeca       BIGSERIAL     PRIMARY KEY,
    nome          VARCHAR(255)  NOT NULL,
    precovenda    NUMERIC(12,2) NOT NULL,
    estoqueminimo INTEGER       NOT NULL DEFAULT 0,
    codcategoria  BIGINT        NOT NULL REFERENCES categoriaspecas(codcategoria),
    codfornecedor BIGINT        NOT NULL REFERENCES fornecedores(codfornecedor)
);

-- Tabela auxiliar: Especialidades (campo especialidade*)
CREATE TABLE especialidades (
    codespecialidade BIGSERIAL    PRIMARY KEY,
    nome             VARCHAR(100) NOT NULL UNIQUE
);

-- 8. Mecânicos
CREATE TABLE mecanicos (
    codmecanico        BIGSERIAL     PRIMARY KEY,
    nome               VARCHAR(255)  NOT NULL,
    codespecialidade   BIGINT        NOT NULL REFERENCES especialidades(codespecialidade),
    comissaopercentual NUMERIC(5,2)  NOT NULL DEFAULT 0
);

-- 9. Ordens de serviço
CREATE TABLE ordensservico (
    codordem    BIGSERIAL PRIMARY KEY,
    dataentrada DATE      NOT NULL DEFAULT CURRENT_DATE,
    kmatual     INTEGER,
    codveiculo  BIGINT    NOT NULL REFERENCES veiculos(codveiculo),
    codstatus   BIGINT    NOT NULL REFERENCES statusos(codstatus)
);

-- 10. Pagamentos
CREATE TABLE pagamentos (
    codpagamento BIGSERIAL     PRIMARY KEY,
    valor        NUMERIC(12,2) NOT NULL,
    data         DATE          NOT NULL DEFAULT CURRENT_DATE,
    codordem     BIGINT        NOT NULL REFERENCES ordensservico(codordem),
    codforma     BIGINT        NOT NULL REFERENCES formaspagamento(codforma)
);

-- 11. Mecânicos x Ordens de Serviço (N:N)
CREATE TABLE mecanicosos (
    codmecanico      BIGINT        NOT NULL REFERENCES mecanicos(codmecanico),
    codordem         BIGINT        NOT NULL REFERENCES ordensservico(codordem),
    horastrabalhadas NUMERIC(6,2)  NOT NULL DEFAULT 0,
    PRIMARY KEY (codmecanico, codordem)
);

-- 12. Peças x Ordens de Serviço (N:N)
CREATE TABLE pecasos (
    codordem     BIGINT        NOT NULL REFERENCES ordensservico(codordem),
    codpeca      BIGINT        NOT NULL REFERENCES pecas(codpeca),
    quantidade   INTEGER       NOT NULL DEFAULT 1,
    valorcobrado NUMERIC(12,2) NOT NULL,
    PRIMARY KEY (codordem, codpeca)
);

-- =============================================
-- Índices para performance
-- =============================================
CREATE INDEX idx_veiculos_codcliente   ON veiculos(codcliente);
CREATE INDEX idx_veiculos_codmodelo    ON veiculos(codmodelo);
CREATE INDEX idx_fornecedores_codcidade ON fornecedores(codcidade);
CREATE INDEX idx_pecas_codcategoria    ON pecas(codcategoria);
CREATE INDEX idx_pecas_codfornecedor   ON pecas(codfornecedor);
CREATE INDEX idx_mecanicos_espec       ON mecanicos(codespecialidade);
CREATE INDEX idx_ordensservico_veiculo ON ordensservico(codveiculo);
CREATE INDEX idx_ordensservico_status  ON ordensservico(codstatus);
CREATE INDEX idx_pagamentos_ordem      ON pagamentos(codordem);
CREATE INDEX idx_pagamentos_forma      ON pagamentos(codforma);
CREATE INDEX idx_usuarios_email        ON usuarios(email);
CREATE INDEX idx_clientes_cpf          ON clientes(cpf);
CREATE INDEX idx_fornecedores_cnpj     ON fornecedores(cnpj);
