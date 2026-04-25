# Design: Melhorias Gerais — Oficina Inácio Adriano

**Data:** 2026-04-24  
**Status:** Aprovado  
**Escopo:** Email/Auth, Dashboard, UI Redesign, Ordens de Serviço completa

---

## Contexto

Sistema de gestão de oficina mecânica em Spring Boot 3.4.1 + Vanilla JS. Já possui CRUD completo de OS, mecânicos, peças, pagamentos e clientes, com autenticação JWT. Não possui verificação de email, 2FA, dashboard, nem tela de detalhes de OS.

---

## Módulo 1 — Email & Autenticação

### 1.1 Verificação de email no cadastro

- Ao registrar, usuário recebe status `PENDENTE_VERIFICACAO` e não pode logar até verificar
- Backend gera código de 6 dígitos aleatório, salva no banco com expiração de 15 minutos
- Email enviado via SMTP Gmail com o código
- Frontend exibe tela de verificação após cadastro; usuário digita o código
- Se expirado, botão "Reenviar código" disponível (gera novo código, invalida anterior)
- Endpoint: `POST /api/auth/verify-email` (body: `{ email, codigo }`)
- Endpoint: `POST /api/auth/resend-verification` (body: `{ email }`)

### 1.2 Redefinição de senha

- Usuário informa email na tela de login → clica "Esqueci minha senha"
- Backend valida se email existe e está verificado, gera código de 6 dígitos (15 min)
- Email enviado com o código
- Frontend exibe tela de redefinição: campo código + nova senha + confirmar senha
- Após sucesso, todos os tokens JWT do usuário são implicitamente invalidados (campo `senha_alterada_em`)
- Endpoints:
  - `POST /api/auth/forgot-password` (body: `{ email }`)
  - `POST /api/auth/reset-password` (body: `{ email, codigo, novaSenha }`)

### 1.3 2FA opcional por email

- Usuário ativa/desativa na tela de perfil
- Quando ativo: login com email+senha retorna `{ requires2fa: true, tempToken: "..." }` ao invés do JWT
- Frontend redireciona para tela de verificação 2FA
- Código de 6 dígitos enviado por email, validade 10 minutos
- `POST /api/auth/verify-2fa` (body: `{ tempToken, codigo }`) → retorna JWT normal
- `tempToken` é um UUID salvo no banco com expiração, descartado após uso

### 1.4 Alterações na tabela `usuarios`

```sql
ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN dois_fatores_ativo BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN codigo_verificacao VARCHAR(6);
ALTER TABLE usuarios ADD COLUMN codigo_verificacao_expira_em TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN codigo_tipo VARCHAR(30);
ALTER TABLE usuarios ADD COLUMN senha_alterada_em TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN temp_token_2fa VARCHAR(36);
ALTER TABLE usuarios ADD COLUMN temp_token_2fa_expira_em TIMESTAMP;
```

`codigo_tipo` valores: `EMAIL_VERIFICACAO`, `RESET_SENHA`, `DOIS_FATORES`

### 1.5 Serviço de email

- Dependência: `spring-boot-starter-mail`
- `EmailService` com métodos: `enviarCodigoVerificacao`, `enviarCodigoResetSenha`, `enviarCodigo2FA`
- Templates HTML simples inline (sem Thymeleaf — manter stack atual)
- Configuração via `application.properties` (credenciais via variáveis de ambiente ou arquivo local não versionado):
  ```properties
  spring.mail.host=smtp.gmail.com
  spring.mail.port=587
  spring.mail.username=${SMTP_USER}
  spring.mail.password=${SMTP_PASS}
  spring.mail.properties.mail.smtp.auth=true
  spring.mail.properties.mail.smtp.starttls.enable=true
  ```

---

## Módulo 2 — UI Redesign

### 2.1 Estilo geral

- Substituir neumorphism por design clean/moderno
- **Tema claro e tema escuro** com toggle no topbar, persistido em `localStorage`
- Variáveis CSS para todas as cores — troca de tema via classe `.dark` no `<html>`
- Paleta clara: fundo `#F8FAFC`, primário `#2563EB`, sucesso `#16A34A`, alerta `#EA580C`, erro `#DC2626`
- Paleta escura: fundo `#0F172A`, cards `#1E293B`, texto `#E2E8F0`
- **Ícones:** Lucide Icons via CDN (`https://unpkg.com/lucide@latest`) — substituir todos os emojis do HTML e JS por `<i data-lucide="..."></i>`. Nenhum emoji no código.
- Tipografia: Inter via Google Fonts
- Sidebar fixa (240px) com logo, navegação por módulo, avatar do usuário no rodapé
- Topbar com título da página atual, ícone de notificações (estoque baixo), toggle de tema, nome do usuário
- Cards com `border-radius: 12px`, sombra `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- Botões com estados hover/active/disabled bem definidos
- Totalmente responsivo (sidebar colapsa em mobile)

### 2.2 Validações de formulário

Todos os formulários devem ter validação visual inline (borda vermelha + mensagem de erro abaixo do campo) e feedback via toast:

| Campo | Validação |
|-------|-----------|
| CPF | Máscara `000.000.000-00`, validação de dígitos verificadores |
| Telefone | Máscara `(00) 00000-0000` ou `(00) 0000-0000` |
| Placa | Máscara `AAA-0000` ou Mercosul `AAA0A00` |
| CNPJ | Máscara `00.000.000/0000-00`, validação de dígitos verificadores |
| Email | Regex padrão RFC |
| Senha | Mínimo 6 caracteres |
| Campos obrigatórios | Destacados com `*`, bloqueiam submit se vazios |
| Números | Não negativos onde aplicável (KM, preço, estoque) |

Validação acontece on-blur e on-submit. Campos inválidos ficam com borda vermelha e mensagem de erro abaixo. Campos válidos ganham borda verde sutil.

### 2.3 Dropdowns com dados do backend (fluxo completo)

Os seguintes dropdowns dependem de dados cadastrados e devem ser carregados corretamente:

| Formulário | Dropdown | Endpoint |
|------------|----------|----------|
| Veículo | Modelo | `GET /api/modelos?size=200` |
| Veículo | Cliente | `GET /api/clientes?size=200` |
| Peça | Categoria | `GET /api/categorias-pecas` |
| Peça | Fornecedor | `GET /api/fornecedores?size=200` |
| Mecânico | Especialidade | `GET /api/especialidades` |
| OS | Veículo | `GET /api/veiculos?size=200` |
| Pagamento | OS | `GET /api/ordens-servico?size=200` |
| Pagamento | Forma | `GET /api/formas-pagamento` |

Endpoints de listagem de auxiliares (categorias, especialidades, formas de pagamento) devem retornar lista simples sem paginação quando chamados sem parâmetros. Se o dropdown vier vazio, exibir mensagem "Nenhum item cadastrado" e desabilitar o campo.

### 2.4 Telas reformuladas

Todas as telas de CRUD ganham:
- Tabelas com header fixo, linhas zebradas, hover highlight
- Paginação visual (anterior/próximo + número de páginas)
- Filtros/busca no topo da tabela
- Formulários em **modal** com validação inline
- Badges coloridos para status
- Ações (editar/excluir) como ícones Lucide na última coluna (sem texto)

### 2.5 Telas novas

- Tela de verificação de email (após cadastro)
- Tela de redefinição de senha (esqueci minha senha)
- Tela de verificação 2FA (após login)
- Tela de detalhes da OS (ver Módulo 4)
- Tela de perfil do usuário (editar dados + toggle 2FA + alterar senha)

---

## Módulo 3 — Dashboard

### 3.1 Cards de resumo (topo)

| Card | Dado | Endpoint |
|------|------|----------|
| OS Abertas | Total com status AGUARDANDO | `GET /api/dashboard/resumo` |
| Em Andamento | Total com status EM_ANDAMENTO | idem |
| Receita do Mês | Soma de pagamentos no mês atual | idem |
| Estoque Baixo | Peças com estoque abaixo do mínimo | idem |

### 3.2 Gráficos (Chart.js via CDN)

- **Donut:** Distribuição de OS por status
- **Barras verticais:** Receita por semana (últimas 4 semanas)
- **Barras horizontais:** Top 5 mecânicos por número de OS concluídas

Endpoint: `GET /api/dashboard/graficos`

### 3.3 Implementação backend

- `DashboardController` + `DashboardService`
- Queries nativas ou JPQL de agregação
- Resposta única com todos os dados do dashboard em um objeto

---

## Módulo 4 — Ordens de Serviço Completa

### 4.1 Tela de listagem

- Tabela: número OS, cliente, veículo (placa + modelo), data entrada, KM, status (badge), valor total estimado, ações
- Filtros: status, período (data entrada), mecânico responsável
- Botão "Nova OS" no topo direito
- Click na linha → abre tela de detalhes

### 4.2 Tela de detalhes

Página dedicada (não modal) com seções:

**Cabeçalho:**
- Número da OS, data entrada, KM atual, botão Voltar

**Informações do veículo/cliente:**
- Cliente (nome, CPF, telefone), veículo (placa, modelo, ano)

**Timeline de status:**
- Linha horizontal com ícones: Aguardando → Em Andamento → Concluída
- Cada etapa mostra data/hora se já passou; etapa atual destacada
- Cancelada aparece como desvio com cor vermelha

**Mecânicos:**
- Tabela: mecânico, especialidade, horas trabalhadas, valor mão de obra
- Botão adicionar/remover mecânico (se OS não concluída/cancelada)

**Peças utilizadas:**
- Tabela: peça, quantidade, valor unitário, subtotal
- Botão adicionar/remover peça (se OS não concluída/cancelada)

**Resumo financeiro:**
- Total peças, total mão de obra, total pago, saldo pendente (destaque vermelho se pendente)

**Pagamentos:**
- Lista: data, forma de pagamento, valor
- Botão "Registrar Pagamento" (se OS em andamento ou concluída)

**Botões de ação (contextuais):**
- `AGUARDANDO` → "Iniciar Atendimento" (azul)
- `EM_ANDAMENTO` → "Concluir OS" (verde) + "Cancelar OS" (vermelho)
- `CONCLUIDA` / `CANCELADA` → sem ações, apenas "Imprimir"

### 4.3 Transições de status

Endpoint: `PATCH /api/ordens-servico/{id}/status`  
Body: `{ novoStatus: "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA" }`

Regras de transição no backend:
- `AGUARDANDO` → `EM_ANDAMENTO` ou `CANCELADA`
- `EM_ANDAMENTO` → `CONCLUIDA` ou `CANCELADA`
- `CONCLUIDA` e `CANCELADA` → sem transição permitida

### 4.4 Histórico de alterações

Nova tabela `historico_os`:
```sql
CREATE TABLE historico_os (
    id BIGSERIAL PRIMARY KEY,
    codordem BIGINT NOT NULL REFERENCES ordensservico(codordem),
    status_anterior VARCHAR(30),
    novo_status VARCHAR(30) NOT NULL,
    usuario_id BIGINT REFERENCES usuarios(id),
    observacao VARCHAR(255),
    criado_em TIMESTAMP DEFAULT NOW()
);
```

Registrado automaticamente em cada transição de status.

### 4.5 Impressão

- Botão "Imprimir" aciona `window.print()`
- CSS `@media print` oculta sidebar, topbar, botões e exibe layout A4 limpo
- Inclui todos os dados da OS, assinatura do cliente no rodapé

---

## Abordagem de implementação

**Incremental por módulo**, na ordem:
1. Módulo 1 (Email/Auth) — base para tudo mais
2. Módulo 2 (UI Redesign) — estrutura visual
3. Módulo 3 (Dashboard) — tela inicial
4. Módulo 4 (OS Completa) — funcionalidade principal

---

## Fora do escopo

- App mobile
- Notificações push
- Integração com sistemas externos (NF-e, ERP)
- TOTP / apps autenticadores
- Upload de fotos da OS
- Chat interno
