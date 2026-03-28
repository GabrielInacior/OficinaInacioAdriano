-- =============================================
-- Dados iniciais (Seed)
-- =============================================

INSERT INTO statusos (descricao) VALUES
    ('Aguardando'),
    ('Em Andamento'),
    ('Finalizado'),
    ('Cancelado');

INSERT INTO formaspagamento (nome) VALUES
    ('Pix'),
    ('Cartão de Crédito'),
    ('Cartão de Débito'),
    ('Dinheiro'),
    ('Boleto');

INSERT INTO especialidades (nome) VALUES
    ('Motor'),
    ('Suspensão'),
    ('Elétrica'),
    ('Funilaria'),
    ('Pintura'),
    ('Ar Condicionado'),
    ('Freios'),
    ('Câmbio');

INSERT INTO categoriaspecas (nome) VALUES
    ('Motor'),
    ('Freios'),
    ('Suspensão'),
    ('Elétrica'),
    ('Filtros'),
    ('Óleos e Fluidos'),
    ('Transmissão'),
    ('Arrefecimento');

INSERT INTO cidades (nome, uf) VALUES
    ('São Paulo', 'SP'),
    ('Campinas', 'SP'),
    ('Guarulhos', 'SP'),
    ('Santos', 'SP'),
    ('Ribeirão Preto', 'SP');

INSERT INTO modelos (nome) VALUES
    ('Gol'),
    ('Onix'),
    ('HB20'),
    ('Civic'),
    ('Corolla'),
    ('Tracker'),
    ('T-Cross'),
    ('Creta');
