/* ================================================
   Oficina Inácio Adriano — Frontend SPA
   Vanilla JS, DOM API only (no innerHTML)
   ================================================ */

'use strict';

// ── State ────────────────────────────────────────
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  currentPage: 'dashboard',
  tempToken2fa: null,
  pendingEmail: null,
  charts: {},
  pagination: {}
};

// ── API ──────────────────────────────────────────
const API = '/api';

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const res = await fetch(API + path, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Erro na requisição');
  return data;
}

const get   = (path)       => apiFetch(path);
const post  = (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) });
const put   = (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) });
const patch = (path, body) => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) });
const del   = (path)       => apiFetch(path, { method: 'DELETE' });

// ── DOM Helpers ──────────────────────────────────
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls)  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function clearEl(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

function setVal(id, val) {
  const node = document.getElementById(id);
  if (node) node.value = val != null ? val : '';
}

function getVal(id) {
  const node = document.getElementById(id);
  return node ? node.value.trim() : '';
}

function makeBtn(text, cls, onClick) {
  const b = el('button', 'btn ' + cls, text);
  b.addEventListener('click', onClick);
  return b;
}

function makeBadge(text, cls) {
  return el('span', 'badge ' + cls, text);
}

// ── Toast ────────────────────────────────────────
function toast(msg, type) {
  const container = document.getElementById('toast-container');
  const t = el('div', 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : ''), msg);
  container.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
}

// ── Auth Screens ─────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.auth-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

// ── Code Digit Inputs ────────────────────────────
function initCodeDigits(groupId) {
  const inputs = document.querySelectorAll('#' + groupId + ' .code-digit');
  inputs.forEach((inp, i) => {
    inp.value = '';
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus();
    });
    inp.addEventListener('paste', e => {
      e.preventDefault();
      const txt = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      inputs.forEach((d, j) => { d.value = txt[j] || ''; });
      const last = Math.min(txt.length, inputs.length) - 1;
      if (last >= 0) inputs[last].focus();
    });
  });
}

function getCode(groupId) {
  return Array.from(document.querySelectorAll('#' + groupId + ' .code-digit'))
    .map(i => i.value).join('');
}

// ── Auth Actions ─────────────────────────────────
async function doLogin() {
  const email = getVal('login-email');
  const senha  = getVal('login-senha');
  if (!email || !senha) { toast('Preencha email e senha', 'error'); return; }
  try {
    const data = await post('/auth/login', { email, senha });
    if (data.requires2fa) {
      state.tempToken2fa = data.tempToken;
      state.pendingEmail = email;
      initCodeDigits('twofa-code-inputs');
      showScreen('screen-2fa');
      toast('Código enviado para seu email', 'info');
    } else {
      finishLogin(data);
    }
  } catch (e) { toast(e.message, 'error'); }
}

async function doRegister() {
  const nome  = getVal('reg-nome');
  const email = getVal('reg-email');
  const senha = getVal('reg-senha');
  if (!nome || !email || !senha) { toast('Preencha todos os campos', 'error'); return; }
  try {
    await post('/auth/register', { nome, email, senha });
    state.pendingEmail = email;
    setText('verify-email-subtitle', 'Código enviado para ' + email + '. Digite abaixo:');
    initCodeDigits('verify-code-inputs');
    showScreen('screen-verify-email');
    toast('Verifique seu email', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function doVerifyEmail() {
  const codigo = getCode('verify-code-inputs');
  if (codigo.length !== 6) { toast('Digite o código completo', 'error'); return; }
  try {
    await post('/auth/verify-email', { email: state.pendingEmail, codigo });
    toast('Email verificado! Faça login.', 'success');
    showScreen('screen-login');
  } catch (e) { toast(e.message, 'error'); }
}

async function doResendVerification() {
  if (!state.pendingEmail) { toast('Email não definido', 'error'); return; }
  try {
    await post('/auth/resend-verification', { email: state.pendingEmail });
    toast('Código reenviado!', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function doVerify2FA() {
  const codigo = getCode('twofa-code-inputs');
  if (codigo.length !== 6) { toast('Digite o código completo', 'error'); return; }
  try {
    const data = await post('/auth/verify-2fa', { tempToken: state.tempToken2fa, codigo });
    finishLogin(data);
  } catch (e) { toast(e.message, 'error'); }
}

async function doForgotPassword() {
  const email = getVal('forgot-email');
  if (!email) { toast('Informe o email', 'error'); return; }
  try {
    await post('/auth/forgot-password', { email });
    state.pendingEmail = email;
    initCodeDigits('reset-code-inputs');
    showScreen('screen-reset');
    toast('Código enviado!', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function doResetPassword() {
  const codigo = getCode('reset-code-inputs');
  const novaSenha = getVal('reset-senha');
  if (codigo.length !== 6) { toast('Digite o código completo', 'error'); return; }
  if (!novaSenha) { toast('Informe a nova senha', 'error'); return; }
  try {
    await post('/auth/reset-password', { email: state.pendingEmail, codigo, novaSenha });
    showScreen('screen-login');
    toast('Senha redefinida! Faça login.', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

function finishLogin(data) {
  state.token = data.token;
  localStorage.setItem('token', data.token);
  loadAppUser();
}

async function loadAppUser() {
  try {
    const u = await get('/auth/profile');
    state.user = u;
    localStorage.setItem('user', JSON.stringify(u));
    setText('sidebar-name', u.nome || 'Usuário');
    setText('sidebar-role', u.role || 'USER');
    const av = document.getElementById('sidebar-avatar');
    if (av) av.textContent = (u.nome || 'U')[0].toUpperCase();
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').classList.add('active');
    navigateTo('dashboard');
  } catch {
    doLogout();
  }
}

function doLogout() {
  state.token = null;
  state.user  = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.getElementById('app-container').classList.remove('active');
  document.getElementById('auth-container').style.display = '';
  showScreen('screen-login');
}

// ── Navigation ───────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  'ordens-servico': 'Ordens de Serviço',
  'os-detalhe': 'Detalhes da OS',
  clientes: 'Clientes',
  veiculos: 'Veículos',
  mecanicos: 'Mecânicos',
  pecas: 'Peças',
  pagamentos: 'Pagamentos',
  perfil: 'Meu Perfil'
};

function navigateTo(page, params) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector('.sidebar-nav a[data-page="' + page + '"]');
  if (navEl) navEl.classList.add('active');
  setText('topbar-title', PAGE_TITLES[page] || page);
  const loaders = {
    dashboard: loadDashboard,
    'ordens-servico': loadOS,
    clientes: loadClientes,
    veiculos: loadVeiculos,
    mecanicos: loadMecanicos,
    pecas: loadPecas,
    pagamentos: loadPagamentos,
    perfil: loadPerfil
  };
  if (page === 'os-detalhe' && params) loadOSDetalhe(params.id);
  else if (loaders[page]) loaders[page]();
}

// ── Dashboard ────────────────────────────────────
async function loadDashboard() {
  try {
    const [resumo, graficos] = await Promise.all([get('/dashboard/resumo'), get('/dashboard/graficos')]);
    setText('stat-aguardando', resumo.osAbertas != null ? resumo.osAbertas : '–');
    setText('stat-andamento',  resumo.osEmAndamento != null ? resumo.osEmAndamento : '–');
    setText('stat-receita',    'R$ ' + fmtMoney(resumo.receitaMes || 0));
    setText('stat-estoque',    resumo.pecasEstoqueBaixo != null ? resumo.pecasEstoqueBaixo : '–');
    const badge = document.getElementById('stock-badge');
    if (badge) badge.classList.toggle('visible', (resumo.pecasEstoqueBaixo || 0) > 0);
    renderCharts(resumo, graficos);
  } catch (e) { toast('Erro ao carregar dashboard', 'error'); }
}

function destroyChart(key) {
  if (state.charts[key]) { state.charts[key].destroy(); delete state.charts[key]; }
}

function renderCharts(resumo, g) {
  destroyChart('status'); destroyChart('receita'); destroyChart('mecanicos');

  // OS por status (from resumo.osPorStatus list)
  const statusList = resumo.osPorStatus || [];
  const statusLabels = statusList.map(function(s) { return s.status; });
  const statusValues = statusList.map(function(s) { return s.count; });
  const colorMap = { Aguardando: '#2563EB', 'Em Andamento': '#EA580C', Finalizado: '#16A34A', Cancelado: '#DC2626' };
  const statusColors = statusLabels.map(function(l) { return colorMap[l] || '#94A3B8'; });

  const ctxS = document.getElementById('chart-status');
  if (ctxS) {
    state.charts.status = new Chart(ctxS, {
      type: 'doughnut',
      data: { labels: statusLabels, datasets: [{ data: statusValues, backgroundColor: statusColors, borderWidth: 2 }] },
      options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
    });
  }

  // Receita por semana (list of {semana, total})
  const semanas = g.receitaPorSemana || [];
  const ctxR = document.getElementById('chart-receita');
  if (ctxR) {
    state.charts.receita = new Chart(ctxR, {
      type: 'bar',
      data: {
        labels: semanas.map(function(s) { return s.semana; }),
        datasets: [{ label: 'Receita', data: semanas.map(function(s) { return s.total; }), backgroundColor: 'rgba(37,99,235,.7)', borderRadius: 6 }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: function(v) { return 'R$' + fmtMoney(v); } } } } }
    });
  }

  // Top mecânicos (list of {mecanico, osFinalizadas})
  const mecs = g.mecanicosMaisAtivos || [];
  const ctxM = document.getElementById('chart-mecanicos');
  if (ctxM) {
    state.charts.mecanicos = new Chart(ctxM, {
      type: 'bar',
      data: {
        labels: mecs.map(function(m) { return m.mecanico; }),
        datasets: [{ label: 'OS Finalizadas', data: mecs.map(function(m) { return m.osFinalizadas; }), backgroundColor: 'rgba(22,163,74,.7)', borderRadius: 6 }]
      },
      options: { indexAxis: 'y', plugins: { legend: { display: false } } }
    });
  }
}

// ── Ordens de Serviço ────────────────────────────
let osPage = 0;

async function loadOS(page) {
  if (page !== undefined) osPage = page;
  const status = document.getElementById('os-filter-status') ? document.getElementById('os-filter-status').value : '';
  const params = new URLSearchParams({ page: osPage, size: 15 });
  if (status) params.set('status', status);
  try {
    const data = await get('/ordens-servico?' + params);
    renderOSTable(data);
    renderPagination('os', data, loadOS);
  } catch (e) { toast('Erro ao carregar OS', 'error'); }
}

function statusBadgeCls(s) {
  if (s === 'Aguardando')   return 'badge-blue';
  if (s === 'Em Andamento') return 'badge-orange';
  if (s === 'Finalizado')   return 'badge-green';
  if (s === 'Cancelado')    return 'badge-red';
  return 'badge-gray';
}

function renderOSTable(data) {
  const tbody = document.getElementById('os-tbody');
  clearEl(tbody);
  const items = data.content || [];
  if (!items.length) { emptyRow(tbody, 7, 'Nenhuma OS encontrada'); return; }
  items.forEach(os => {
    const tr = document.createElement('tr');
    [os.codOrdem, os.cliente || '–', os.veiculo || '–', fmtDate(os.dataEntrada), os.kmAtual != null ? os.kmAtual : '–'].forEach(v => {
      const td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
    });
    const tdStatus = document.createElement('td');
    tdStatus.appendChild(makeBadge(os.status, statusBadgeCls(os.status)));
    tr.appendChild(tdStatus);
    const tdAcoes = document.createElement('td');
    const actDiv = el('div', 'table-actions');
    actDiv.appendChild(makeBtn('Ver', 'btn btn-outline btn-sm', () => navigateTo('os-detalhe', { id: os.codOrdem })));
    actDiv.appendChild(makeBtn('Editar', 'btn btn-ghost btn-sm', () => openModal('os', os)));
    actDiv.appendChild(makeBtn('Excluir', 'btn btn-danger btn-sm', () => confirmDelete('ordens-servico', os.codOrdem, loadOS)));
    tdAcoes.appendChild(actDiv);
    tr.appendChild(tdAcoes);
    tbody.appendChild(tr);
  });
}

// ── OS Detalhe ───────────────────────────────────
async function loadOSDetalhe(id) {
  const content = document.getElementById('os-detalhe-content');
  clearEl(content);
  content.appendChild(el('p', 'text-muted', 'Carregando...'));
  try {
    const os = await get('/ordens-servico/' + id + '/detalhe');
    clearEl(content);
    buildOSDetalhe(content, os);
  } catch (e) { clearEl(content); content.appendChild(el('p', 'text-muted', 'Erro ao carregar OS')); }
}

function buildOSDetalhe(container, os) {
  // Header
  const header = el('div', 'os-detail-header');
  const titleBlock = el('div');
  titleBlock.appendChild(el('div', 'os-detail-title', 'OS #' + os.codOrdem));
  titleBlock.appendChild(makeBadge(os.status, statusBadgeCls(os.status)));
  header.appendChild(titleBlock);

  const actDiv = el('div', 'os-actions');
  if (os.status === 'Aguardando') {
    actDiv.appendChild(makeBtn('▶ Iniciar', 'btn btn-primary btn-sm', () => atualizarStatusOS(os.codOrdem, 'Em Andamento')));
    actDiv.appendChild(makeBtn('✕ Cancelar', 'btn btn-danger btn-sm', () => atualizarStatusOS(os.codOrdem, 'Cancelado')));
  } else if (os.status === 'Em Andamento') {
    actDiv.appendChild(makeBtn('✔ Finalizar', 'btn btn-success btn-sm', () => atualizarStatusOS(os.codOrdem, 'Finalizado')));
    actDiv.appendChild(makeBtn('✕ Cancelar', 'btn btn-danger btn-sm', () => atualizarStatusOS(os.codOrdem, 'Cancelado')));
  }
  header.appendChild(actDiv);
  container.appendChild(header);

  // Timeline
  const steps = ['Aguardando', 'Em Andamento', 'Finalizado'];
  const currentIdx = steps.indexOf(os.status);
  const isCancelled = os.status === 'Cancelado';
  const timelineSection = el('div', 'os-detail-section');
  timelineSection.appendChild(el('h3', null, 'Status'));
  const timeline = el('div', 'timeline');
  steps.forEach((step, i) => {
    const stepEl = el('div', 'timeline-step');
    if (isCancelled) stepEl.classList.add('cancelled');
    else if (i < currentIdx) stepEl.classList.add('done');
    else if (i === currentIdx) stepEl.classList.add('current');
    const dot = el('div', 'timeline-dot', isCancelled ? '✕' : i < currentIdx ? '✔' : i === currentIdx ? '●' : '○');
    stepEl.appendChild(dot);
    stepEl.appendChild(el('div', 'timeline-label', isCancelled && i === 0 ? 'Cancelado' : step));
    timeline.appendChild(stepEl);
  });
  timelineSection.appendChild(timeline);
  container.appendChild(timelineSection);

  // Info geral
  const infoSection = el('div', 'os-detail-section');
  infoSection.appendChild(el('h3', null, 'Informações Gerais'));
  const infoGrid = el('div', 'info-grid');
  [
    ['Cliente', os.clienteNome], ['CPF', os.clienteCpf], ['Telefone', os.clienteTelefone],
    ['Veículo', os.veiculoModelo], ['Placa', os.veiculoPlaca], ['Ano', os.veiculoAno],
    ['Data Entrada', fmtDate(os.dataEntrada)], ['KM', os.kmAtual]
  ].forEach(function(pair) {
    const item = el('div', 'info-item');
    item.appendChild(el('label', null, pair[0]));
    item.appendChild(el('span', null, pair[1] != null ? String(pair[1]) : '–'));
    infoGrid.appendChild(item);
  });
  infoSection.appendChild(infoGrid);
  container.appendChild(infoSection);

  // Mecânicos
  if (os.mecanicos && os.mecanicos.length) {
    const sec = el('div', 'os-detail-section');
    sec.appendChild(el('h3', null, 'Mecânicos'));
    sec.appendChild(buildSimpleTable(
      ['Nome', 'Especialidade', 'Horas', 'Comissão %', 'M.O.'],
      os.mecanicos.map(m => [m.nome, m.especialidade, m.horasTrabalhadas, m.comissaoPercentual + '%', 'R$ ' + fmtMoney(m.valorMaoDeObra)])
    ));
    container.appendChild(sec);
  }

  // Peças
  if (os.pecas && os.pecas.length) {
    const sec = el('div', 'os-detail-section');
    sec.appendChild(el('h3', null, 'Peças'));
    sec.appendChild(buildSimpleTable(
      ['Peça', 'Qtd', 'Valor Unit.', 'Subtotal'],
      os.pecas.map(p => [p.nome, p.quantidade, 'R$ ' + fmtMoney(p.valorCobrado), 'R$ ' + fmtMoney(p.subtotal)])
    ));
    container.appendChild(sec);
  }

  // Resumo financeiro
  const sumSection = el('div', 'os-detail-section');
  sumSection.appendChild(el('h3', null, 'Resumo Financeiro'));
  const sumGrid = el('div', 'summary-grid');
  [
    ['Total Peças', 'R$ ' + fmtMoney(os.totalPecas), ''],
    ['Mão de Obra', 'R$ ' + fmtMoney(os.totalMaoDeObra), ''],
    ['Total Pago',  'R$ ' + fmtMoney(os.totalPago), ''],
    ['Saldo',       'R$ ' + fmtMoney(os.saldoPendente), os.saldoPendente > 0 ? 'danger' : '']
  ].forEach(function(s) {
    const item = el('div', 'summary-item' + (s[2] ? ' ' + s[2] : ''));
    item.appendChild(el('label', null, s[0]));
    item.appendChild(el('div', 'value', s[1]));
    sumGrid.appendChild(item);
  });
  sumSection.appendChild(sumGrid);
  container.appendChild(sumSection);

  // Pagamentos
  if (os.pagamentos && os.pagamentos.length) {
    const sec = el('div', 'os-detail-section');
    sec.appendChild(el('h3', null, 'Pagamentos'));
    sec.appendChild(buildSimpleTable(
      ['#', 'Valor', 'Data', 'Forma'],
      os.pagamentos.map(p => [p.codPagamento, 'R$ ' + fmtMoney(p.valor), fmtDate(p.data), p.formaPagamento])
    ));
    container.appendChild(sec);
  }

  // Histórico
  if (os.historico && os.historico.length) {
    const sec = el('div', 'os-detail-section');
    sec.appendChild(el('h3', null, 'Histórico de Status'));
    sec.appendChild(buildSimpleTable(
      ['De', 'Para', 'Por', 'Observação', 'Data'],
      os.historico.map(h => [h.statusAnterior || '–', h.novoStatus, h.usuario, h.observacao || '–', fmtDateTime(h.criadoEm)])
    ));
    container.appendChild(sec);
  }
}

function buildSimpleTable(headers, rows) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  headers.forEach(function(h) { const th = document.createElement('th'); th.textContent = h; tr.appendChild(th); });
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach(function(row) {
    const r = document.createElement('tr');
    row.forEach(function(cell) { const td = document.createElement('td'); td.textContent = cell != null ? cell : '–'; r.appendChild(td); });
    tbody.appendChild(r);
  });
  table.appendChild(tbody);
  return table;
}

async function atualizarStatusOS(id, novoStatus) {
  const obs = prompt('Observação (opcional):') || '';
  try {
    await patch('/ordens-servico/' + id + '/status', { novoStatus, observacao: obs });
    toast('Status atualizado!', 'success');
    loadOSDetalhe(id);
  } catch (e) { toast(e.message, 'error'); }
}

// ── Clientes ──────────────────────────────────────
let clientesPage = 0;

async function loadClientes(page) {
  if (page !== undefined) clientesPage = page;
  const search = document.getElementById('cliente-search') ? document.getElementById('cliente-search').value : '';
  const params = new URLSearchParams({ page: clientesPage, size: 15 });
  if (search) params.set('nome', search);
  try {
    const data = await get('/clientes?' + params);
    const tbody = document.getElementById('clientes-tbody');
    clearEl(tbody);
    const items = data.content || [];
    if (!items.length) { emptyRow(tbody, 4, 'Nenhum cliente encontrado'); return; }
    items.forEach(function(c) {
      const tr = document.createElement('tr');
      [c.nome, c.cpf || '–', c.telefone || '–'].forEach(function(v) { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeBtn('Editar', 'btn btn-ghost btn-sm', function() { openModal('cliente', c); }));
      div.appendChild(makeBtn('Excluir', 'btn btn-danger btn-sm', function() { confirmDelete('clientes', c.codCliente, loadClientes); }));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('clientes', data, loadClientes);
  } catch (e) { toast('Erro ao carregar clientes', 'error'); }
}

// ── Veículos ──────────────────────────────────────
let veiculosPage = 0;

async function loadVeiculos(page) {
  if (page !== undefined) veiculosPage = page;
  try {
    const data = await get('/veiculos?page=' + veiculosPage + '&size=15');
    const tbody = document.getElementById('veiculos-tbody');
    clearEl(tbody);
    const items = data.content || [];
    if (!items.length) { emptyRow(tbody, 5, 'Nenhum veículo encontrado'); return; }
    items.forEach(function(v) {
      const tr = document.createElement('tr');
      [v.placa, v.modelo || '–', v.ano || '–', v.cliente || '–'].forEach(function(val) {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeBtn('Editar', 'btn btn-ghost btn-sm', function() { openModal('veiculo', v); }));
      div.appendChild(makeBtn('Excluir', 'btn btn-danger btn-sm', function() { confirmDelete('veiculos', v.codVeiculo, loadVeiculos); }));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('veiculos', data, loadVeiculos);
  } catch (e) { toast('Erro ao carregar veículos', 'error'); }
}

// ── Mecânicos ─────────────────────────────────────
let mecanicosPage = 0;

async function loadMecanicos(page) {
  if (page !== undefined) mecanicosPage = page;
  try {
    const data = await get('/mecanicos?page=' + mecanicosPage + '&size=15');
    const tbody = document.getElementById('mecanicos-tbody');
    clearEl(tbody);
    const items = data.content || [];
    if (!items.length) { emptyRow(tbody, 4, 'Nenhum mecânico encontrado'); return; }
    items.forEach(function(m) {
      const tr = document.createElement('tr');
      [m.nome, m.especialidade || '–', (m.comissaoPercentual != null ? m.comissaoPercentual : '–') + '%'].forEach(function(val) {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeBtn('Editar', 'btn btn-ghost btn-sm', function() { openModal('mecanico', m); }));
      div.appendChild(makeBtn('Excluir', 'btn btn-danger btn-sm', function() { confirmDelete('mecanicos', m.codMecanico, loadMecanicos); }));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('mecanicos', data, loadMecanicos);
  } catch (e) { toast('Erro ao carregar mecânicos', 'error'); }
}

// ── Peças ─────────────────────────────────────────
let pecasPage = 0;

async function loadPecas(page) {
  if (page !== undefined) pecasPage = page;
  const search = document.getElementById('peca-search') ? document.getElementById('peca-search').value : '';
  const params = new URLSearchParams({ page: pecasPage, size: 15 });
  if (search) params.set('nome', search);
  try {
    const data = await get('/pecas?' + params);
    const tbody = document.getElementById('pecas-tbody');
    clearEl(tbody);
    const items = data.content || [];
    if (!items.length) { emptyRow(tbody, 6, 'Nenhuma peça encontrada'); return; }
    items.forEach(function(p) {
      const tr = document.createElement('tr');
      [p.nome, p.categoria || '–', p.fornecedor || '–', 'R$ ' + fmtMoney(p.precoVenda), p.estoqueMinimo != null ? p.estoqueMinimo : '–'].forEach(function(val) {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeBtn('Editar', 'btn btn-ghost btn-sm', function() { openModal('peca', p); }));
      div.appendChild(makeBtn('Excluir', 'btn btn-danger btn-sm', function() { confirmDelete('pecas', p.codPeca, loadPecas); }));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('pecas', data, loadPecas);
  } catch (e) { toast('Erro ao carregar peças', 'error'); }
}

// ── Pagamentos ────────────────────────────────────
let pagamentosPage = 0;

async function loadPagamentos(page) {
  if (page !== undefined) pagamentosPage = page;
  try {
    const data = await get('/pagamentos?page=' + pagamentosPage + '&size=15');
    const tbody = document.getElementById('pagamentos-tbody');
    clearEl(tbody);
    const items = data.content || [];
    if (!items.length) { emptyRow(tbody, 5, 'Nenhum pagamento encontrado'); return; }
    items.forEach(function(p) {
      const tr = document.createElement('tr');
      ['#' + (p.codOrdem || '–'), 'R$ ' + fmtMoney(p.valor), fmtDate(p.data), p.formaPagamento || '–'].forEach(function(val) {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeBtn('Excluir', 'btn btn-danger btn-sm', function() { confirmDelete('pagamentos', p.codPagamento, loadPagamentos); }));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('pagamentos', data, loadPagamentos);
  } catch (e) { toast('Erro ao carregar pagamentos', 'error'); }
}

// ── Perfil ────────────────────────────────────────
async function loadPerfil() {
  try {
    const u = await get('/auth/profile');
    setVal('perfil-nome', u.nome);
    setVal('perfil-email', u.email);
    const btn2faOn  = document.getElementById('btn-2fa-on');
    const btn2faOff = document.getElementById('btn-2fa-off');
    if (btn2faOn)  btn2faOn.style.display  = u.doisFatoresAtivo ? 'none' : '';
    if (btn2faOff) btn2faOff.style.display = u.doisFatoresAtivo ? '' : 'none';
  } catch (e) { toast('Erro ao carregar perfil', 'error'); }
}

async function saveProfile() {
  const nome  = getVal('perfil-nome');
  const email = getVal('perfil-email');
  try {
    await put('/auth/profile', { nome, email });
    toast('Perfil salvo!', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function changePassword() {
  const senhaAtual = getVal('pwd-atual');
  const novaSenha  = getVal('pwd-nova');
  if (!senhaAtual || !novaSenha) { toast('Preencha os campos de senha', 'error'); return; }
  try {
    await put('/auth/password', { senhaAtual, novaSenha });
    toast('Senha alterada!', 'success');
    setVal('pwd-atual', '');
    setVal('pwd-nova', '');
  } catch (e) { toast(e.message, 'error'); }
}

async function toggle2FA(ativar) {
  try {
    await put('/auth/2fa?ativar=' + ativar, {});
    toast(ativar ? '2FA ativado!' : '2FA desativado!', 'success');
    loadPerfil();
  } catch (e) { toast(e.message, 'error'); }
}

// ── Modal ─────────────────────────────────────────
let modalType   = null;
let modalEntity = null;

function openModal(type, entity) {
  modalType   = type;
  modalEntity = entity || null;
  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const body    = document.getElementById('modal-body');
  clearEl(body);
  const titles = { os: 'Ordem de Serviço', cliente: 'Cliente', veiculo: 'Veículo', mecanico: 'Mecânico', peca: 'Peça', pagamento: 'Pagamento' };
  titleEl.textContent = (entity ? 'Editar ' : 'Novo ') + (titles[type] || type);
  const builders = { os: buildOSForm, cliente: buildClienteForm, veiculo: buildVeiculoForm, mecanico: buildMecanicoForm, peca: buildPecaForm, pagamento: buildPagamentoForm };
  if (builders[type]) builders[type](body, entity);
  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  modalType = null; modalEntity = null;
}

function closeModalOnOverlay(e) { if (e.target.id === 'modal-overlay') closeModal(); }

async function saveModal() {
  try {
    const savers = { os: saveOS, cliente: saveCliente, veiculo: saveVeiculo, mecanico: saveMecanico, peca: savePeca, pagamento: savePagamento };
    if (savers[modalType]) await savers[modalType]();
  } catch (e) { toast(e.message, 'error'); }
}

function formGroup(label, input) {
  const g = el('div', 'form-group');
  g.appendChild(el('label', 'form-label', label));
  g.appendChild(input);
  return g;
}

function makeInput(type, id, placeholder, value) {
  const i = document.createElement('input');
  i.type = type || 'text';
  i.id = id;
  i.className = 'form-input';
  if (placeholder) i.placeholder = placeholder;
  if (value !== undefined && value !== null) i.value = value;
  return i;
}

function makeSelect(id, options, selectedVal) {
  const s = document.createElement('select');
  s.id = id;
  s.className = 'form-input';
  options.forEach(function(opt) {
    const o = document.createElement('option');
    o.value = opt[0];
    o.textContent = opt[1];
    if (String(opt[0]) === String(selectedVal)) o.selected = true;
    s.appendChild(o);
  });
  return s;
}

// OS Form
async function buildOSForm(body, os) {
  const veiculos = await get('/veiculos?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const statusOpts = [[1,'Aguardando'],[2,'Em Andamento'],[3,'Finalizado'],[4,'Cancelado']];
  body.appendChild(formGroup('Veículo', makeSelect('modal-os-veiculo', veiculos.map(function(v) { return [v.codVeiculo, v.placa + ' — ' + (v.modelo || '')]; }), os ? os.codVeiculo : null)));
  body.appendChild(formGroup('Data Entrada', makeInput('date', 'modal-os-data', '', os ? os.dataEntrada : new Date().toISOString().slice(0,10))));
  body.appendChild(formGroup('KM Atual', makeInput('number', 'modal-os-km', '0', os ? os.kmAtual : '')));
  body.appendChild(formGroup('Status', makeSelect('modal-os-status', statusOpts, os ? os.codStatus : 1)));
}

async function saveOS() {
  const body = {
    codVeiculo: Number(getVal('modal-os-veiculo')),
    dataEntrada: getVal('modal-os-data') || null,
    kmAtual: Number(getVal('modal-os-km')),
    codStatus: Number(getVal('modal-os-status'))
  };
  if (modalEntity) await put('/ordens-servico/' + modalEntity.codOrdem, body);
  else await post('/ordens-servico', body);
  toast('OS salva!', 'success');
  closeModal(); loadOS();
}

// Cliente Form
function buildClienteForm(body, c) {
  body.appendChild(formGroup('Nome', makeInput('text', 'modal-cli-nome', 'Nome completo', c ? c.nome : '')));
  body.appendChild(formGroup('CPF', makeInput('text', 'modal-cli-cpf', '000.000.000-00', c ? c.cpf : '')));
  body.appendChild(formGroup('Telefone', makeInput('text', 'modal-cli-tel', '(00) 00000-0000', c ? c.telefone : '')));
}

async function saveCliente() {
  const body = { nome: getVal('modal-cli-nome'), cpf: getVal('modal-cli-cpf'), telefone: getVal('modal-cli-tel') };
  if (modalEntity) await put('/clientes/' + modalEntity.codCliente, body);
  else await post('/clientes', body);
  toast('Cliente salvo!', 'success');
  closeModal(); loadClientes();
}

// Veículo Form
async function buildVeiculoForm(body, v) {
  const clientes = await get('/clientes?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const modelos  = await get('/modelos?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  body.appendChild(formGroup('Placa', makeInput('text', 'modal-vei-placa', 'ABC-1234', v ? v.placa : '')));
  body.appendChild(formGroup('Modelo', makeSelect('modal-vei-modelo', modelos.map(function(m) { return [m.codModelo, m.nome]; }), v ? v.codModelo : null)));
  body.appendChild(formGroup('Ano', makeInput('number', 'modal-vei-ano', '2020', v ? v.ano : '')));
  body.appendChild(formGroup('Cliente', makeSelect('modal-vei-cliente', clientes.map(function(c) { return [c.codCliente, c.nome]; }), v ? v.codCliente : null)));
}

async function saveVeiculo() {
  const body = { placa: getVal('modal-vei-placa'), codModelo: Number(getVal('modal-vei-modelo')), ano: Number(getVal('modal-vei-ano')), codCliente: Number(getVal('modal-vei-cliente')) };
  if (modalEntity) await put('/veiculos/' + modalEntity.codVeiculo, body);
  else await post('/veiculos', body);
  toast('Veículo salvo!', 'success');
  closeModal(); loadVeiculos();
}

// Mecânico Form
async function buildMecanicoForm(body, m) {
  const especialidades = await get('/especialidades').catch(function() { return []; });
  const espOpts = Array.isArray(especialidades) ? especialidades.map(function(e) { return [e.codEspecialidade, e.nome]; }) : [];
  body.appendChild(formGroup('Nome', makeInput('text', 'modal-mec-nome', 'Nome completo', m ? m.nome : '')));
  body.appendChild(formGroup('Especialidade', makeSelect('modal-mec-esp', espOpts, m ? m.codEspecialidade : null)));
  body.appendChild(formGroup('Comissão %', makeInput('number', 'modal-mec-com', '10', m ? m.comissaoPercentual : '')));
}

async function saveMecanico() {
  const body = { nome: getVal('modal-mec-nome'), codEspecialidade: Number(getVal('modal-mec-esp')), comissaoPercentual: Number(getVal('modal-mec-com')) };
  if (modalEntity) await put('/mecanicos/' + modalEntity.codMecanico, body);
  else await post('/mecanicos', body);
  toast('Mecânico salvo!', 'success');
  closeModal(); loadMecanicos();
}

// Peça Form
async function buildPecaForm(body, p) {
  const categorias   = await get('/categorias').catch(function() { return []; });
  const fornecedores = await get('/fornecedores').catch(function() { return []; });
  const catOpts = Array.isArray(categorias)   ? categorias.map(function(c) { return [c.codCategoria, c.nome]; })    : [];
  const forOpts = Array.isArray(fornecedores) ? fornecedores.map(function(f) { return [f.codFornecedor, f.razaoSocial || f.nome]; }) : [];
  body.appendChild(formGroup('Nome', makeInput('text', 'modal-peca-nome', 'Nome da peça', p ? p.nome : '')));
  body.appendChild(formGroup('Preço', makeInput('number', 'modal-peca-preco', '0.00', p ? p.preco : '')));
  body.appendChild(formGroup('Estoque Mínimo', makeInput('number', 'modal-peca-estmin', '5', p ? p.estoqueMinimo : '')));
  body.appendChild(formGroup('Categoria', makeSelect('modal-peca-cat', catOpts, p ? p.codCategoria : null)));
  body.appendChild(formGroup('Fornecedor', makeSelect('modal-peca-for', forOpts, p ? p.codFornecedor : null)));
}

async function savePeca() {
  const body = { nome: getVal('modal-peca-nome'), precoVenda: Number(getVal('modal-peca-preco')), estoqueMinimo: Number(getVal('modal-peca-estmin')), codCategoria: Number(getVal('modal-peca-cat')), codFornecedor: Number(getVal('modal-peca-for')) };
  if (modalEntity) await put('/pecas/' + modalEntity.codPeca, body);
  else await post('/pecas', body);
  toast('Peça salva!', 'success');
  closeModal(); loadPecas();
}

// Pagamento Form
async function buildPagamentoForm(body) {
  const formas = await get('/formas-pagamento').catch(function() { return []; });
  const osList = await get('/ordens-servico?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const forOpts = Array.isArray(formas)  ? formas.map(function(f) { return [f.codForma, f.nome]; }) : [];
  const osOpts  = osList.map(function(o) { return [o.codOrdem, '#' + o.codOrdem + ' — ' + (o.cliente || '')]; });
  body.appendChild(formGroup('OS', makeSelect('modal-pag-os', osOpts, null)));
  body.appendChild(formGroup('Valor', makeInput('number', 'modal-pag-valor', '0.00', '')));
  body.appendChild(formGroup('Data', makeInput('date', 'modal-pag-data', '', new Date().toISOString().slice(0,10))));
  body.appendChild(formGroup('Forma de Pagamento', makeSelect('modal-pag-forma', forOpts, null)));
}

async function savePagamento() {
  const body = { codOrdem: Number(getVal('modal-pag-os')), valor: Number(getVal('modal-pag-valor')), data: getVal('modal-pag-data'), codForma: Number(getVal('modal-pag-forma')) };
  await post('/pagamentos', body);
  toast('Pagamento registrado!', 'success');
  closeModal(); loadPagamentos();
}

// ── Pagination ────────────────────────────────────
function renderPagination(prefix, data, loader) {
  const info = document.getElementById(prefix + '-pagination-info');
  const ctrl = document.getElementById(prefix + '-pagination-controls');
  if (!info || !ctrl) return;
  const totalElements = data.totalElements || 0;
  const totalPages    = data.totalPages    || 1;
  const currentPage   = data.number        || 0;
  info.textContent = totalElements + ' registro(s)';
  clearEl(ctrl);
  for (let i = 0; i < totalPages; i++) {
    const btn = el('button', 'page-btn' + (i === currentPage ? ' active' : ''), String(i + 1));
    (function(idx) { btn.addEventListener('click', function() { loader(idx); }); }(i));
    ctrl.appendChild(btn);
  }
}

// ── Utilities ─────────────────────────────────────
function fmtMoney(val) {
  if (val == null) return '0,00';
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '–';
  const dt = new Date(d + (String(d).includes('T') ? '' : 'T00:00:00'));
  return dt.toLocaleDateString('pt-BR');
}

function fmtDateTime(d) {
  if (!d) return '–';
  return new Date(d).toLocaleString('pt-BR');
}

function emptyRow(tbody, cols, msg) {
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = cols;
  td.className = 'text-center text-muted';
  td.style.padding = '24px';
  td.textContent = msg;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

function confirmDelete(resource, id, reload) {
  if (!confirm('Confirma a exclusão?')) return;
  del('/' + resource + '/' + id)
    .then(function() { toast('Excluído!', 'success'); reload(); })
    .catch(function(e) { toast(e.message, 'error'); });
}

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initCodeDigits('verify-code-inputs');
  initCodeDigits('reset-code-inputs');
  initCodeDigits('twofa-code-inputs');

  if (state.token) {
    loadAppUser();
  } else {
    document.getElementById('auth-container').style.display = '';
    showScreen('screen-login');
  }

  var loginEmail = document.getElementById('login-email');
  var loginSenha = document.getElementById('login-senha');
  if (loginEmail) loginEmail.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
  if (loginSenha) loginSenha.addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
});

// ── Global exposure (HTML onclick handlers) ───────
window.doLogin              = doLogin;
window.doRegister           = doRegister;
window.doVerifyEmail        = doVerifyEmail;
window.doResendVerification = doResendVerification;
window.doVerify2FA          = doVerify2FA;
window.doForgotPassword     = doForgotPassword;
window.doResetPassword      = doResetPassword;
window.doLogout             = doLogout;
window.showScreen           = showScreen;
window.navigateTo           = navigateTo;
window.openModal            = openModal;
window.closeModal           = closeModal;
window.closeModalOnOverlay  = closeModalOnOverlay;
window.saveModal            = saveModal;
window.saveProfile          = saveProfile;
window.changePassword       = changePassword;
window.toggle2FA            = toggle2FA;
window.loadOS               = loadOS;
window.loadClientes         = loadClientes;
window.loadPecas            = loadPecas;
