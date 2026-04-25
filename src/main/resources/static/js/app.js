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

function makeBtnWithIcon(icon, text, cls, onClick) {
  const b = el('button', 'btn ' + cls);
  const i = document.createElement('i');
  i.setAttribute('data-lucide', icon);
  i.setAttribute('width', '14');
  i.setAttribute('height', '14');
  b.appendChild(i);
  if (text) b.appendChild(document.createTextNode(' ' + text));
  b.addEventListener('click', onClick);
  return b;
}

function makeIconBtn(icon, cls, onClick, title) {
  const b = el('button', 'btn btn-icon ' + cls);
  if (title) b.title = title;
  const i = document.createElement('i');
  i.setAttribute('data-lucide', icon);
  i.setAttribute('width', '14');
  i.setAttribute('height', '14');
  b.appendChild(i);
  b.addEventListener('click', onClick);
  return b;
}

function makeBadge(text, cls) {
  return el('span', 'badge ' + cls, text);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

// ── Toast ────────────────────────────────────────
function toast(msg, type) {
  const container = document.getElementById('toast-container');
  const t = el('div', 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : ''), msg);
  container.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
}

// ── Theme ─────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  const isDark = document.documentElement.classList.contains('dark');
  if (icon) {
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    refreshIcons();
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
  if (state.currentPage === 'dashboard') loadDashboard();
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
  if (!validateEmail(email)) { toast('Email inválido', 'error'); return; }
  if (senha.length < 6) { toast('Senha deve ter no mínimo 6 caracteres', 'error'); return; }
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
  if (novaSenha.length < 6) { toast('Senha deve ter no mínimo 6 caracteres', 'error'); return; }
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
  fornecedores: 'Fornecedores',
  modelos: 'Modelos de Veículo',
  categorias: 'Categorias de Peças',
  especialidades: 'Especialidades',
  'formas-pagamento': 'Formas de Pagamento',
  cidades: 'Cidades',
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
    fornecedores: loadFornecedores,
    modelos: loadModelos,
    categorias: loadCategorias,
    especialidades: loadEspecialidades,
    'formas-pagamento': loadFormasPagamento,
    cidades: loadCidades,
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

function getChartTheme() {
  const dark = document.documentElement.classList.contains('dark');
  return {
    grid:      dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tick:      dark ? '#64748B' : '#94A3B8',
    tooltip:   dark ? '#1E293B' : '#ffffff',
    ttBorder:  dark ? '#334155' : '#E2E8F0',
    ttText:    dark ? '#E2E8F0' : '#1E293B',
    ttMuted:   dark ? '#64748B' : '#94A3B8',
    legend:    dark ? '#94A3B8' : '#64748B',
  };
}

function renderCharts(resumo, g) {
  destroyChart('status'); destroyChart('receita'); destroyChart('mecanicos');

  const t = getChartTheme();

  const tooltipStyle = {
    backgroundColor: t.tooltip,
    borderColor: t.ttBorder,
    borderWidth: 1,
    titleColor: t.ttText,
    bodyColor: t.ttMuted,
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxWidth: 10,
    boxHeight: 10,
  };

  // OS por status — donut
  const statusList   = resumo.osPorStatus || [];
  const statusLabels = statusList.map(s => s.status);
  const statusValues = statusList.map(s => s.count);
  const colorMap     = {
    Aguardando: '#3B82F6',
    'Em Andamento': '#F59E0B',
    Finalizado: '#10B981',
    Cancelado: '#EF4444'
  };
  const statusColors = statusLabels.map(l => colorMap[l] || '#94A3B8');

  const ctxS = document.getElementById('chart-status');
  if (ctxS) {
    state.charts.status = new Chart(ctxS, {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{
          data: statusValues,
          backgroundColor: statusColors,
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        cutout: '68%',
        animation: { animateScale: true, duration: 600 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: t.legend, padding: 16, font: { size: 12 }, boxWidth: 12, boxHeight: 12 }
          },
          tooltip: tooltipStyle
        }
      }
    });
  }

  // Receita por semana — barras verticais
  const semanas = g.receitaPorSemana || [];
  const ctxR = document.getElementById('chart-receita');
  if (ctxR) {
    const gradR = ctxR.getContext('2d').createLinearGradient(0, 0, 0, 200);
    gradR.addColorStop(0, 'rgba(37,99,235,0.85)');
    gradR.addColorStop(1, 'rgba(37,99,235,0.25)');
    state.charts.receita = new Chart(ctxR, {
      type: 'bar',
      data: {
        labels: semanas.map(s => s.semana),
        datasets: [{
          label: 'Receita',
          data: semanas.map(s => s.total),
          backgroundColor: gradR,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        animation: { duration: 600 },
        plugins: { legend: { display: false }, tooltip: { ...tooltipStyle, callbacks: { label: ctx => ' R$ ' + fmtMoney(ctx.parsed.y) } } },
        scales: {
          x: { grid: { color: t.grid }, ticks: { color: t.tick } },
          y: { grid: { color: t.grid }, ticks: { color: t.tick, callback: v => 'R$' + fmtMoney(v) } }
        }
      }
    });
  }

  // Top mecânicos — barras horizontais
  const mecs = g.mecanicosMaisAtivos || [];
  const ctxM = document.getElementById('chart-mecanicos');
  if (ctxM) {
    const gradM = ctxM.getContext('2d').createLinearGradient(200, 0, 0, 0);
    gradM.addColorStop(0, 'rgba(16,185,129,0.85)');
    gradM.addColorStop(1, 'rgba(16,185,129,0.25)');
    state.charts.mecanicos = new Chart(ctxM, {
      type: 'bar',
      data: {
        labels: mecs.map(m => m.mecanico),
        datasets: [{
          label: 'OS Finalizadas',
          data: mecs.map(m => m.osFinalizadas),
          backgroundColor: gradM,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        animation: { duration: 600 },
        plugins: { legend: { display: false }, tooltip: tooltipStyle },
        scales: {
          x: { grid: { color: t.grid }, ticks: { color: t.tick, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: t.tick } }
        }
      }
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
    actDiv.appendChild(makeIconBtn('eye', 'btn-outline', () => navigateTo('os-detalhe', { id: os.codOrdem }), 'Ver detalhes'));
    actDiv.appendChild(makeIconBtn('pencil', 'btn-ghost', () => openModal('os', os), 'Editar'));
    actDiv.appendChild(makeIconBtn('trash-2', 'btn-danger', () => confirmDelete('ordens-servico', os.codOrdem, loadOS), 'Excluir'));
    tdAcoes.appendChild(actDiv);
    tr.appendChild(tdAcoes);
    tbody.appendChild(tr);
  });
  refreshIcons();
}

// ── OS Detalhe ───────────────────────────────────
let currentOSId = null;

async function loadOSDetalhe(id) {
  currentOSId = id;
  const content = document.getElementById('os-detalhe-content');
  clearEl(content);
  content.appendChild(el('p', 'text-muted', 'Carregando...'));
  try {
    const os = await get('/ordens-servico/' + id + '/detalhe');
    clearEl(content);
    buildOSDetalhe(content, os);
  } catch (e) {
    clearEl(content);
    content.appendChild(el('p', 'text-muted', 'Erro ao carregar OS'));
  }
}

function buildOSDetalhe(container, os) {
  const editable = os.status === 'Aguardando' || os.status === 'Em Andamento';

  // ── Header ────────────────────────────────────────
  const header = el('div', 'os-detail-header');
  const titleBlock = el('div');
  const titleRow = el('div', 'flex items-center gap-2');
  titleRow.appendChild(el('div', 'os-detail-title', 'OS #' + os.codOrdem));
  titleRow.appendChild(makeBadge(os.status, statusBadgeCls(os.status)));
  titleBlock.appendChild(titleRow);
  if (os.dataEntrada) {
    titleBlock.appendChild(el('div', 'text-muted text-sm mt-2',
      'Entrada: ' + fmtDate(os.dataEntrada) + (os.kmAtual ? '  ·  ' + os.kmAtual + ' km' : '')));
  }
  header.appendChild(titleBlock);

  const actDiv = el('div', 'os-actions');
  if (os.status === 'Aguardando') {
    actDiv.appendChild(makeBtnWithIcon('play', 'Iniciar Atendimento', 'btn-primary btn-sm', function() { atualizarStatusOS(os.codOrdem, 'Em Andamento'); }));
    actDiv.appendChild(makeBtnWithIcon('x', 'Cancelar OS', 'btn-danger btn-sm', function() { atualizarStatusOS(os.codOrdem, 'Cancelado'); }));
  } else if (os.status === 'Em Andamento') {
    actDiv.appendChild(makeBtnWithIcon('check', 'Finalizar OS', 'btn-success btn-sm', function() { tentarFinalizarOS(os); }));
    actDiv.appendChild(makeBtnWithIcon('x', 'Cancelar OS', 'btn-danger btn-sm', function() { atualizarStatusOS(os.codOrdem, 'Cancelado'); }));
  } else {
    actDiv.appendChild(makeBtnWithIcon('printer', 'Imprimir', 'btn-outline btn-sm', function() { window.print(); }));
  }
  header.appendChild(actDiv);
  container.appendChild(header);

  // ── Timeline ──────────────────────────────────────
  const tlCard = el('div', 'card');
  tlCard.style.marginBottom = '20px';
  const steps = ['Aguardando', 'Em Andamento', 'Finalizado'];
  const curIdx = steps.indexOf(os.status);
  const isCancelled = os.status === 'Cancelado';
  const timeline = el('div', 'timeline');
  steps.forEach(function(step, i) {
    const stepEl = el('div', 'timeline-step');
    if (isCancelled) stepEl.classList.add('cancelled');
    else if (i < curIdx) stepEl.classList.add('done');
    else if (i === curIdx) stepEl.classList.add('current');
    const dot = el('div', 'timeline-dot');
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', isCancelled ? 'x' : i < curIdx ? 'check' : i === curIdx ? 'clock' : 'circle');
    icon.setAttribute('width', '13'); icon.setAttribute('height', '13');
    dot.appendChild(icon);
    stepEl.appendChild(dot);
    stepEl.appendChild(el('div', 'timeline-label', isCancelled && i === 0 ? 'Cancelado' : step));
    timeline.appendChild(stepEl);
  });
  tlCard.appendChild(timeline);
  container.appendChild(tlCard);

  // ── Info veículo/cliente ──────────────────────────
  const infoCard = el('div', 'card');
  infoCard.style.marginBottom = '20px';
  const infoGrid = el('div', 'info-grid');
  [['Cliente', os.clienteNome], ['CPF', os.clienteCpf], ['Telefone', os.clienteTelefone],
   ['Veículo', os.veiculoModelo], ['Placa', os.veiculoPlaca], ['Ano', os.veiculoAno]
  ].forEach(function(pair) {
    const item = el('div', 'info-item');
    item.appendChild(el('label', null, pair[0]));
    item.appendChild(el('span', null, pair[1] != null ? String(pair[1]) : '–'));
    infoGrid.appendChild(item);
  });
  infoCard.appendChild(infoGrid);
  container.appendChild(infoCard);

  // ── Two-column layout ─────────────────────────────
  const layout = el('div', 'os-detail-layout');
  const mainCol = el('div', 'os-detail-main');
  const sideCol = el('div', 'os-detail-side');
  layout.appendChild(mainCol);
  layout.appendChild(sideCol);
  container.appendChild(layout);

  buildMecanicosSection(mainCol, os, editable);
  buildPecasSection(mainCol, os, editable);

  buildResumoFinanceiro(sideCol, os);
  buildPagamentosSection(sideCol, os);

  // ── Histórico (full-width, abaixo) ────────────────
  if (os.historico && os.historico.length) {
    const histCard = el('div', 'card');
    histCard.style.marginTop = '20px';
    const histHeader = el('div', 'section-header');
    histHeader.appendChild(el('span', 'section-title', 'Histórico de Status'));
    histCard.appendChild(histHeader);
    histCard.appendChild(buildSimpleTable(
      ['De', 'Para', 'Por', 'Observação', 'Data'],
      os.historico.map(function(h) { return [h.statusAnterior || '–', h.novoStatus, h.usuario, h.observacao || '–', fmtDateTime(h.criadoEm)]; })
    ));
    container.appendChild(histCard);
  }

  refreshIcons();
}

// ── Mecânicos section ─────────────────────────────
function buildMecanicosSection(container, os, editable) {
  const card = el('div', 'card');
  card.style.marginBottom = '20px';

  const header = el('div', 'section-header');
  header.appendChild(el('span', 'section-title', 'Mecânicos'));

  let inlineForm = null;
  if (editable) {
    const addBtn = makeBtnWithIcon('plus', 'Adicionar', 'btn-outline btn-sm', async function() {
      if (inlineForm) { inlineForm.remove(); inlineForm = null; refreshIcons(); return; }
      inlineForm = await buildAddMecanicoForm(os.codOrdem, function() { inlineForm = null; });
      const anchor = card.querySelector('table') || card.querySelector('.empty-section');
      if (anchor) card.insertBefore(inlineForm, anchor); else card.appendChild(inlineForm);
      refreshIcons();
    });
    header.appendChild(addBtn);
  }
  card.appendChild(header);

  if (!os.mecanicos || !os.mecanicos.length) {
    card.appendChild(el('p', 'empty-section', 'Nenhum mecânico vinculado.'));
  } else {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Mecânico', 'Especialidade', 'Horas', 'M.O.', ''].forEach(function(h) {
      const th = document.createElement('th'); th.textContent = h; hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    os.mecanicos.forEach(function(m) {
      const tr = document.createElement('tr');
      [m.nome, m.especialidade || '–', m.horasTrabalhadas, 'R$ ' + fmtMoney(m.valorMaoDeObra)].forEach(function(v) {
        const td = document.createElement('td'); td.textContent = v != null ? v : '–'; tr.appendChild(td);
      });
      const tdAct = document.createElement('td');
      if (editable) {
        tdAct.appendChild(makeIconBtn('trash-2', 'btn-danger', async function() {
          if (!confirm('Remover mecânico da OS?')) return;
          try {
            await del('/mecanicos-os/' + m.codMecanico + '/' + os.codOrdem);
            toast('Mecânico removido!', 'success');
            loadOSDetalhe(currentOSId);
          } catch (e) { toast(e.message, 'error'); }
        }, 'Remover'));
      }
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }
  container.appendChild(card);
  refreshIcons();
}

async function buildAddMecanicoForm(codOrdem, onClose) {
  const mecanicos = await get('/mecanicos?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const form = el('div', 'inline-form');
  const row = el('div', 'inline-form-row');
  const mecSel = makeSelect('inf-mec', [['', 'Selecione o mecânico...']].concat(mecanicos.map(function(m) { return [m.codMecanico, m.nome]; })), '');
  const horasInp = makeInput('number', 'inf-horas', '2', '');
  horasInp.min = '0.5'; horasInp.step = '0.5';
  row.appendChild(formGroup('Mecânico', mecSel, true));
  row.appendChild(formGroup('Horas trabalhadas', horasInp, true));
  form.appendChild(row);
  const actions = el('div', 'inline-form-actions');
  actions.appendChild(makeBtn('Cancelar', 'btn-ghost btn-sm', function() { form.remove(); onClose(); }));
  actions.appendChild(makeBtnWithIcon('check', 'Adicionar', 'btn-primary btn-sm', async function() {
    let ok = true;
    if (!mecSel.value) { fieldError(mecSel, 'Selecione o mecânico'); ok = false; }
    if (!horasInp.value || parseFloat(horasInp.value) <= 0) { fieldError(horasInp, 'Informe as horas'); ok = false; }
    if (!ok) return;
    try {
      await post('/mecanicos-os', { codMecanico: Number(mecSel.value), codOrdem: codOrdem, horasTrabalhadas: parseFloat(horasInp.value) });
      toast('Mecânico adicionado!', 'success');
      loadOSDetalhe(currentOSId);
    } catch (e) { toast(e.message, 'error'); }
  }));
  form.appendChild(actions);
  return form;
}

// ── Peças section ─────────────────────────────────
function buildPecasSection(container, os, editable) {
  const card = el('div', 'card');
  card.style.marginBottom = '20px';

  const header = el('div', 'section-header');
  header.appendChild(el('span', 'section-title', 'Peças Utilizadas'));

  let inlineForm = null;
  if (editable) {
    const addBtn = makeBtnWithIcon('plus', 'Adicionar', 'btn-outline btn-sm', async function() {
      if (inlineForm) { inlineForm.remove(); inlineForm = null; refreshIcons(); return; }
      inlineForm = await buildAddPecaForm(os.codOrdem, function() { inlineForm = null; });
      const anchor = card.querySelector('table') || card.querySelector('.empty-section');
      if (anchor) card.insertBefore(inlineForm, anchor); else card.appendChild(inlineForm);
      refreshIcons();
    });
    header.appendChild(addBtn);
  }
  card.appendChild(header);

  if (!os.pecas || !os.pecas.length) {
    card.appendChild(el('p', 'empty-section', 'Nenhuma peça utilizada.'));
  } else {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Peça', 'Qtd', 'Valor Unit.', 'Subtotal', ''].forEach(function(h) {
      const th = document.createElement('th'); th.textContent = h; hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    os.pecas.forEach(function(p) {
      const tr = document.createElement('tr');
      [p.nome, p.quantidade, 'R$ ' + fmtMoney(p.valorCobrado), 'R$ ' + fmtMoney(p.subtotal)].forEach(function(v) {
        const td = document.createElement('td'); td.textContent = v != null ? v : '–'; tr.appendChild(td);
      });
      const tdAct = document.createElement('td');
      if (editable) {
        tdAct.appendChild(makeIconBtn('trash-2', 'btn-danger', async function() {
          if (!confirm('Remover peça da OS?')) return;
          try {
            await del('/pecas-os/' + os.codOrdem + '/' + p.codPeca);
            toast('Peça removida!', 'success');
            loadOSDetalhe(currentOSId);
          } catch (e) { toast(e.message, 'error'); }
        }, 'Remover'));
      }
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }
  container.appendChild(card);
  refreshIcons();
}

async function buildAddPecaForm(codOrdem, onClose) {
  const pecas = await get('/pecas?size=500').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const form = el('div', 'inline-form');
  const row = el('div', 'inline-form-row');
  const pecaSel = makeSelect('inf-peca', [['', 'Selecione a peça...']].concat(pecas.map(function(p) { return [p.codPeca, p.nome]; })), '');
  const qtdInp = makeInput('number', 'inf-qtd', '1', '1');
  qtdInp.min = '1'; qtdInp.step = '1';
  const valorInp = makeInput('number', 'inf-peca-valor', '0,00', '');
  valorInp.min = '0.01'; valorInp.step = '0.01';

  pecaSel.addEventListener('change', function() {
    const sel = pecas.find(function(p) { return String(p.codPeca) === pecaSel.value; });
    if (sel && sel.precoVenda != null) valorInp.value = sel.precoVenda;
  });

  row.appendChild(formGroup('Peça', pecaSel, true));
  row.appendChild(formGroup('Quantidade', qtdInp, true));
  form.appendChild(row);
  form.appendChild(formGroup('Valor cobrado (R$)', valorInp, true));

  const actions = el('div', 'inline-form-actions');
  actions.appendChild(makeBtn('Cancelar', 'btn-ghost btn-sm', function() { form.remove(); onClose(); }));
  actions.appendChild(makeBtnWithIcon('check', 'Adicionar', 'btn-primary btn-sm', async function() {
    let ok = true;
    if (!pecaSel.value) { fieldError(pecaSel, 'Selecione a peça'); ok = false; }
    if (!qtdInp.value || parseInt(qtdInp.value) < 1) { fieldError(qtdInp, 'Mínimo 1'); ok = false; }
    if (!valorInp.value || parseFloat(valorInp.value) <= 0) { fieldError(valorInp, 'Informe o valor'); ok = false; }
    if (!ok) return;
    try {
      await post('/pecas-os', { codOrdem: codOrdem, codPeca: Number(pecaSel.value), quantidade: parseInt(qtdInp.value), valorCobrado: parseFloat(valorInp.value) });
      toast('Peça adicionada!', 'success');
      loadOSDetalhe(currentOSId);
    } catch (e) { toast(e.message, 'error'); }
  }));
  form.appendChild(actions);
  return form;
}

// ── Resumo financeiro ─────────────────────────────
function buildResumoFinanceiro(container, os) {
  const card = el('div', 'card');
  card.style.marginBottom = '20px';
  const header = el('div', 'section-header');
  header.appendChild(el('span', 'section-title', 'Resumo Financeiro'));
  card.appendChild(header);

  const totalGeral = Number(os.totalPecas || 0) + Number(os.totalMaoDeObra || 0);
  [
    ['Peças', os.totalPecas, ''],
    ['Mão de Obra', os.totalMaoDeObra, ''],
    ['Total Geral', totalGeral, 'is-total'],
    ['Total Pago', os.totalPago, 'is-success'],
    ['Saldo Pendente', os.saldoPendente, Number(os.saldoPendente) > 0 ? 'is-danger' : 'is-success'],
  ].forEach(function(item) {
    const row = el('div', 'resumo-row' + (item[2] ? ' ' + item[2] : ''));
    row.appendChild(el('span', 'resumo-label', item[0]));
    row.appendChild(el('span', 'resumo-value', 'R$ ' + fmtMoney(item[1] || 0)));
    card.appendChild(row);
  });

  if (Number(os.saldoPendente) > 0) {
    const alert = el('div', 'saldo-alert danger');
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'alert-circle'); icon.setAttribute('width', '14'); icon.setAttribute('height', '14');
    alert.appendChild(icon);
    alert.appendChild(el('span', null, 'R$ ' + fmtMoney(os.saldoPendente) + ' pendente'));
    card.appendChild(alert);
  } else if (Number(os.totalPago) > 0) {
    const alert = el('div', 'saldo-alert success');
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'check-circle'); icon.setAttribute('width', '14'); icon.setAttribute('height', '14');
    alert.appendChild(icon);
    alert.appendChild(el('span', null, 'Pagamento quitado'));
    card.appendChild(alert);
  }
  container.appendChild(card);
  refreshIcons();
}

// ── Pagamentos section ────────────────────────────
function buildPagamentosSection(container, os) {
  const card = el('div', 'card');
  card.style.marginBottom = '20px';
  const canPay = os.status !== 'Cancelado';

  const header = el('div', 'section-header');
  header.appendChild(el('span', 'section-title', 'Pagamentos'));

  let inlineForm = null;
  if (canPay) {
    const addBtn = makeBtnWithIcon('plus', 'Registrar', 'btn-primary btn-sm', async function() {
      if (inlineForm) { inlineForm.remove(); inlineForm = null; refreshIcons(); return; }
      inlineForm = await buildAddPagamentoForm(os.codOrdem, function() { inlineForm = null; });
      const anchor = card.querySelector('.pagamento-row') || card.querySelector('.empty-section');
      if (anchor) card.insertBefore(inlineForm, anchor); else card.appendChild(inlineForm);
      refreshIcons();
    });
    header.appendChild(addBtn);
  }
  card.appendChild(header);

  if (!os.pagamentos || !os.pagamentos.length) {
    card.appendChild(el('p', 'empty-section', 'Nenhum pagamento registrado.'));
  } else {
    os.pagamentos.forEach(function(p) {
      const row = el('div', 'pagamento-row');
      const info = el('div', 'pagamento-info');
      info.appendChild(el('div', 'pagamento-forma', p.formaPagamento || '–'));
      info.appendChild(el('div', 'pagamento-data', fmtDate(p.data)));
      row.appendChild(info);
      row.appendChild(el('div', 'pagamento-valor', 'R$ ' + fmtMoney(p.valor)));
      if (canPay) {
        row.appendChild(makeIconBtn('trash-2', 'btn-danger', async function() {
          if (!confirm('Excluir pagamento?')) return;
          try {
            await del('/pagamentos/' + p.codPagamento);
            toast('Pagamento excluído!', 'success');
            loadOSDetalhe(currentOSId);
          } catch (e) { toast(e.message, 'error'); }
        }, 'Excluir'));
      }
      card.appendChild(row);
    });
  }
  container.appendChild(card);
  refreshIcons();
}

async function buildAddPagamentoForm(codOrdem, onClose) {
  const formas = await get('/formas-pagamento').catch(function() { return []; });
  const forOpts = Array.isArray(formas) ? formas.map(function(f) { return [f.codForma, f.nome]; }) : [];
  const form = el('div', 'inline-form');
  const row = el('div', 'inline-form-row');
  const valorInp = makeInput('number', 'inf-pag-valor', '0,00', '');
  valorInp.min = '0.01'; valorInp.step = '0.01';
  const formaSel = makeSelect('inf-pag-forma', [['', 'Selecione...']].concat(forOpts), '');
  row.appendChild(formGroup('Valor (R$)', valorInp, true));
  row.appendChild(formGroup('Forma de Pagamento', formaSel, true));
  form.appendChild(row);
  form.appendChild(formGroup('Data', makeInput('date', 'inf-pag-data', '', new Date().toISOString().slice(0, 10)), true));
  const actions = el('div', 'inline-form-actions');
  actions.appendChild(makeBtn('Cancelar', 'btn-ghost btn-sm', function() { form.remove(); onClose(); }));
  actions.appendChild(makeBtnWithIcon('check', 'Confirmar', 'btn-primary btn-sm', async function() {
    let ok = true;
    if (!valorInp.value || parseFloat(valorInp.value) <= 0) { fieldError(valorInp, 'Valor inválido'); ok = false; }
    if (!formaSel.value) { fieldError(formaSel, 'Selecione a forma'); ok = false; }
    if (!ok) return;
    try {
      await post('/pagamentos', { valor: parseFloat(valorInp.value), data: document.getElementById('inf-pag-data').value || null, codOrdem: codOrdem, codForma: Number(formaSel.value) });
      toast('Pagamento registrado!', 'success');
      loadOSDetalhe(currentOSId);
    } catch (e) { toast(e.message, 'error'); }
  }));
  form.appendChild(actions);
  return form;
}

async function tentarFinalizarOS(os) {
  if (Number(os.saldoPendente) > 0) {
    toast('Saldo pendente de R$ ' + fmtMoney(os.saldoPendente) + '. Registre o pagamento antes de finalizar.', 'warning');
    const side = document.querySelector('.os-detail-side');
    if (side) side.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  await atualizarStatusOS(os.codOrdem, 'Finalizado');
}

function buildSimpleTable(headers, rows) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  headers.forEach(function(h) { const th = document.createElement('th'); th.textContent = h; tr.appendChild(th); });
  thead.appendChild(tr); table.appendChild(thead);
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
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('cliente', c); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('clientes', c.codCliente, loadClientes); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('clientes', data, loadClientes);
    refreshIcons();
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
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('veiculo', v); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('veiculos', v.codVeiculo, loadVeiculos); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('veiculos', data, loadVeiculos);
    refreshIcons();
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
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('mecanico', m); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('mecanicos', m.codMecanico, loadMecanicos); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('mecanicos', data, loadMecanicos);
    refreshIcons();
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
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('peca', p); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('pecas', p.codPeca, loadPecas); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('pecas', data, loadPecas);
    refreshIcons();
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
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('pagamentos', p.codPagamento, loadPagamentos); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('pagamentos', data, loadPagamentos);
    refreshIcons();
  } catch (e) { toast('Erro ao carregar pagamentos', 'error'); }
}

// ── Modelos ───────────────────────────────────────
async function loadModelos() {
  try {
    const items = await get('/modelos');
    const tbody = document.getElementById('modelos-tbody');
    clearEl(tbody);
    if (!items || !items.length) { emptyRow(tbody, 2, 'Nenhum modelo cadastrado'); return; }
    items.forEach(function(m) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.textContent = m.nome; tr.appendChild(td);
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('modelo', m); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('modelos', m.codModelo, loadModelos); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    refreshIcons();
  } catch (e) { toast('Erro ao carregar modelos', 'error'); }
}

// ── Fornecedores ──────────────────────────────────
let fornecedoresPage = 0;

async function loadFornecedores(page) {
  if (page !== undefined) fornecedoresPage = page;
  const search = document.getElementById('fornecedor-search') ? document.getElementById('fornecedor-search').value : '';
  const params = new URLSearchParams({ page: fornecedoresPage, size: 15 });
  if (search) params.set('razaoSocial', search);
  try {
    const data = await get('/fornecedores?' + params);
    const tbody = document.getElementById('fornecedores-tbody');
    clearEl(tbody);
    const items = data.content || [];
    if (!items.length) { emptyRow(tbody, 4, 'Nenhum fornecedor cadastrado'); return; }
    items.forEach(function(f) {
      const tr = document.createElement('tr');
      [f.razaoSocial, f.cnpj || '–', f.cidade || '–'].forEach(function(val) {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('fornecedor', f); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('fornecedores', f.codFornecedor, loadFornecedores); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    renderPagination('fornecedores', data, loadFornecedores);
    refreshIcons();
  } catch (e) { toast('Erro ao carregar fornecedores', 'error'); }
}

// ── Categorias ────────────────────────────────────
async function loadCategorias() {
  try {
    const items = await get('/categorias-pecas');
    const tbody = document.getElementById('categorias-tbody');
    clearEl(tbody);
    if (!items || !items.length) { emptyRow(tbody, 2, 'Nenhuma categoria cadastrada'); return; }
    items.forEach(function(c) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.textContent = c.nome; tr.appendChild(td);
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('categoria', c); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('categorias-pecas', c.codCategoria, loadCategorias); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    refreshIcons();
  } catch (e) { toast('Erro ao carregar categorias', 'error'); }
}

// ── Especialidades ────────────────────────────────
async function loadEspecialidades() {
  try {
    const items = await get('/especialidades');
    const tbody = document.getElementById('especialidades-tbody');
    clearEl(tbody);
    if (!items || !items.length) { emptyRow(tbody, 2, 'Nenhuma especialidade cadastrada'); return; }
    items.forEach(function(e) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.textContent = e.nome; tr.appendChild(td);
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('especialidade', e); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('especialidades', e.codEspecialidade, loadEspecialidades); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    refreshIcons();
  } catch (e) { toast('Erro ao carregar especialidades', 'error'); }
}

// ── Formas de Pagamento ───────────────────────────
async function loadFormasPagamento() {
  try {
    const items = await get('/formas-pagamento');
    const tbody = document.getElementById('formas-pagamento-tbody');
    clearEl(tbody);
    if (!items || !items.length) { emptyRow(tbody, 2, 'Nenhuma forma de pagamento cadastrada'); return; }
    items.forEach(function(f) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.textContent = f.nome; tr.appendChild(td);
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('forma-pagamento', f); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('formas-pagamento', f.codForma, loadFormasPagamento); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    refreshIcons();
  } catch (e) { toast('Erro ao carregar formas de pagamento', 'error'); }
}

// ── Cidades ───────────────────────────────────────
let cidadesAll = [];

async function loadCidades() {
  try {
    const items = await get('/cidades');
    cidadesAll = items || [];
    const search = document.getElementById('cidade-search') ? document.getElementById('cidade-search').value.toLowerCase() : '';
    const filtered = search ? cidadesAll.filter(c => c.nome.toLowerCase().includes(search) || c.uf.toLowerCase().includes(search)) : cidadesAll;
    const tbody = document.getElementById('cidades-tbody');
    clearEl(tbody);
    if (!filtered.length) { emptyRow(tbody, 3, 'Nenhuma cidade cadastrada'); return; }
    filtered.forEach(function(c) {
      const tr = document.createElement('tr');
      [c.nome, c.uf].forEach(function(val) {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      const tdA = document.createElement('td');
      const div = el('div', 'table-actions');
      div.appendChild(makeIconBtn('pencil', 'btn-ghost', function() { openModal('cidade', c); }, 'Editar'));
      div.appendChild(makeIconBtn('trash-2', 'btn-danger', function() { confirmDelete('cidades', c.codCidade, loadCidades); }, 'Excluir'));
      tdA.appendChild(div);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    refreshIcons();
  } catch (e) { toast('Erro ao carregar cidades', 'error'); }
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
  if (novaSenha.length < 6) { toast('Nova senha deve ter no mínimo 6 caracteres', 'error'); return; }
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
  const titles = {
    os: 'Ordem de Serviço',
    cliente: 'Cliente',
    veiculo: 'Veículo',
    mecanico: 'Mecânico',
    peca: 'Peça',
    pagamento: 'Pagamento',
    modelo: 'Modelo de Veículo',
    fornecedor: 'Fornecedor',
    categoria: 'Categoria de Peça',
    especialidade: 'Especialidade',
    'forma-pagamento': 'Forma de Pagamento',
    cidade: 'Cidade',
  };
  titleEl.textContent = (entity ? 'Editar ' : 'Novo ') + (titles[type] || type);
  const builders = {
    os: buildOSForm,
    cliente: buildClienteForm,
    veiculo: buildVeiculoForm,
    mecanico: buildMecanicoForm,
    peca: buildPecaForm,
    pagamento: buildPagamentoForm,
    modelo: buildModeloForm,
    fornecedor: buildFornecedorForm,
    categoria: buildCategoriaForm,
    especialidade: buildEspecialidadeForm,
    'forma-pagamento': buildFormaPagamentoForm,
    cidade: buildCidadeForm,
  };
  if (builders[type]) {
    Promise.resolve(builders[type](body, entity)).then(function() {
      refreshIcons();
    });
  }
  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  modalType = null; modalEntity = null;
}

function closeModalOnOverlay(e) { if (e.target.id === 'modal-overlay') closeModal(); }

async function saveModal() {
  try {
    const savers = {
      os: saveOS,
      cliente: saveCliente,
      veiculo: saveVeiculo,
      mecanico: saveMecanico,
      peca: savePeca,
      pagamento: savePagamento,
      modelo: saveModelo,
      fornecedor: saveFornecedor,
      categoria: saveCategoria,
      especialidade: saveEspecialidade,
      'forma-pagamento': saveFormaPagamento,
      cidade: saveCidade,
    };
    if (savers[modalType]) await savers[modalType]();
  } catch (e) { toast(e.message, 'error'); }
}

function formGroup(label, input, required) {
  const g = el('div', 'form-group');
  const lbl = el('label', 'form-label', label + (required ? ' *' : ''));
  g.appendChild(lbl);
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
  s.className = 'form-input form-select';
  options.forEach(function(opt) {
    const o = document.createElement('option');
    o.value = opt[0];
    o.textContent = opt[1];
    if (String(opt[0]) === String(selectedVal)) o.selected = true;
    s.appendChild(o);
  });
  return s;
}

// ── Form Builders ─────────────────────────────────

// OS Form
async function buildOSForm(body, os) {
  const veiculos = await get('/veiculos?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const statusOpts = [[1,'Aguardando'],[2,'Em Andamento'],[3,'Finalizado'],[4,'Cancelado']];
  const veiSel = makeSelect('modal-os-veiculo', [['', 'Selecione...']].concat(veiculos.map(function(v) { return [v.codVeiculo, v.placa + ' — ' + (v.modelo || '')]; })), os ? os.codVeiculo : '');
  const kmInput = makeInput('number', 'modal-os-km', '0', os ? os.kmAtual : '');
  kmInput.min = '0'; kmInput.step = '1';
  body.appendChild(formGroup('Veículo', veiSel, true));
  body.appendChild(formGroup('Data Entrada', makeInput('date', 'modal-os-data', '', os ? os.dataEntrada : new Date().toISOString().slice(0,10)), true));
  body.appendChild(formGroup('KM Atual', kmInput, true));
  body.appendChild(formGroup('Status', makeSelect('modal-os-status', statusOpts, os ? os.codStatus : 1)));
  setupNumberInput(kmInput, 0, 'KM');
}

async function saveOS() {
  const vei  = document.getElementById('modal-os-veiculo');
  const data = document.getElementById('modal-os-data');
  const km   = document.getElementById('modal-os-km');
  let ok = true;
  if (!validateRequired(vei, 'Veículo')) ok = false;
  if (!validateRequired(data, 'Data')) ok = false;
  if (!validateRequired(km, 'KM')) ok = false;
  else if (parseInt(km.value) < 0) { fieldError(km, 'KM deve ser não negativo'); ok = false; }
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = {
    codVeiculo: Number(getVal('modal-os-veiculo')),
    dataEntrada: getVal('modal-os-data') || null,
    kmAtual: Number(getVal('modal-os-km')),
    codStatus: Number(getVal('modal-os-status'))
  };
  if (modalEntity) await put('/ordens-servico/' + modalEntity.codOrdem, b);
  else await post('/ordens-servico', b);
  toast('OS salva!', 'success');
  closeModal(); loadOS();
}

// Cliente Form
function buildClienteForm(body, c) {
  const nomeInput = makeInput('text', 'modal-cli-nome', 'Nome completo', c ? c.nome : '');
  const cpfInput  = makeInput('text', 'modal-cli-cpf',  '000.000.000-00', c ? c.cpf : '');
  const telInput  = makeInput('text', 'modal-cli-tel',  '(00) 00000-0000', c ? c.telefone : '');
  body.appendChild(formGroup('Nome', nomeInput, true));
  body.appendChild(formGroup('CPF', cpfInput));
  body.appendChild(formGroup('Telefone', telInput));
  setupCPFInput(cpfInput);
  setupTelInput(telInput);
}

async function saveCliente() {
  const nome = document.getElementById('modal-cli-nome');
  const cpf  = document.getElementById('modal-cli-cpf');
  let ok = true;
  if (!validateRequired(nome, 'Nome')) ok = false;
  if (cpf.value.trim() && !validateCPF(cpf.value)) { fieldError(cpf, 'CPF inválido'); ok = false; }
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { nome: nome.value.trim(), cpf: getVal('modal-cli-cpf') || null, telefone: getVal('modal-cli-tel') || null };
  if (modalEntity) await put('/clientes/' + modalEntity.codCliente, b);
  else await post('/clientes', b);
  toast('Cliente salvo!', 'success');
  closeModal(); loadClientes();
}

// Veículo Form
async function buildVeiculoForm(body, v) {
  const clientes = await get('/clientes?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const modelos  = await get('/modelos').catch(function() { return []; });
  const modArr   = Array.isArray(modelos) ? modelos : (modelos.content || []);
  const placaInput = makeInput('text', 'modal-vei-placa', 'ABC-1234 ou ABC1D23', v ? v.placa : '');
  const anoInput   = makeInput('number', 'modal-vei-ano', '2020', v ? v.ano : '');
  anoInput.min = '1900'; anoInput.max = String(new Date().getFullYear() + 1);
  const cliSelect = makeSelect('modal-vei-cliente', [['', 'Selecione...']].concat(clientes.map(function(c) { return [c.codCliente, c.nome]; })), v ? v.codCliente : '');
  const modSelect = makeSelect('modal-vei-modelo',  [['', 'Selecione...']].concat(modArr.map(function(m) { return [m.codModelo, m.nome]; })),  v ? v.codModelo  : '');
  body.appendChild(formGroup('Placa', placaInput, true));
  body.appendChild(formGroup('Modelo', modSelect, true));
  body.appendChild(formGroup('Ano', anoInput, true));
  body.appendChild(formGroup('Cliente', cliSelect, true));
  setupPlacaInput(placaInput);
  setupNumberInput(anoInput, 1900, 'Ano');
}

async function saveVeiculo() {
  const placa  = document.getElementById('modal-vei-placa');
  const modelo = document.getElementById('modal-vei-modelo');
  const ano    = document.getElementById('modal-vei-ano');
  const cli    = document.getElementById('modal-vei-cliente');
  let ok = true;
  if (!validateRequired(placa, 'Placa')) ok = false;
  else if (!validatePlaca(placa.value)) { fieldError(placa, 'Placa inválida (ex: ABC-1234 ou ABC1D23)'); ok = false; }
  if (!validateRequired(modelo, 'Modelo')) ok = false;
  if (!validateRequired(ano, 'Ano')) ok = false;
  if (!validateRequired(cli, 'Cliente')) ok = false;
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = {
    placa: placa.value.trim().toUpperCase(),
    codModelo: Number(getVal('modal-vei-modelo')),
    ano: Number(getVal('modal-vei-ano')),
    codCliente: Number(getVal('modal-vei-cliente'))
  };
  if (modalEntity) await put('/veiculos/' + modalEntity.codVeiculo, b);
  else await post('/veiculos', b);
  toast('Veículo salvo!', 'success');
  closeModal(); loadVeiculos();
}

// Mecânico Form
async function buildMecanicoForm(body, m) {
  const especialidades = await get('/especialidades').catch(function() { return []; });
  const espOpts = Array.isArray(especialidades) ? especialidades.map(function(e) { return [e.codEspecialidade, e.nome]; }) : [];
  const nomeInput = makeInput('text', 'modal-mec-nome', 'Nome completo', m ? m.nome : '');
  const comInput  = makeInput('number', 'modal-mec-com', '10', m ? m.comissaoPercentual : '');
  comInput.min = '0'; comInput.max = '100'; comInput.step = '0.1';
  body.appendChild(formGroup('Nome', nomeInput, true));
  body.appendChild(formGroup('Especialidade', makeSelect('modal-mec-esp', [['', 'Selecione...']].concat(espOpts), m ? m.codEspecialidade : ''), true));
  body.appendChild(formGroup('Comissão (%)', comInput, true));
  setupNumberInput(comInput, 0, 'Comissão');
}

async function saveMecanico() {
  const nome = document.getElementById('modal-mec-nome');
  const esp  = document.getElementById('modal-mec-esp');
  const com  = document.getElementById('modal-mec-com');
  let ok = true;
  if (!validateRequired(nome, 'Nome')) ok = false;
  if (!validateRequired(esp, 'Especialidade')) ok = false;
  if (!validateRequired(com, 'Comissão')) ok = false;
  else { const v = parseFloat(com.value); if (isNaN(v) || v < 0 || v > 100) { fieldError(com, 'Comissão deve ser entre 0 e 100'); ok = false; } }
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { nome: nome.value.trim(), codEspecialidade: Number(getVal('modal-mec-esp')), comissaoPercentual: Number(getVal('modal-mec-com')) };
  if (modalEntity) await put('/mecanicos/' + modalEntity.codMecanico, b);
  else await post('/mecanicos', b);
  toast('Mecânico salvo!', 'success');
  closeModal(); loadMecanicos();
}

// Peça Form
async function buildPecaForm(body, p) {
  const categorias   = await get('/categorias-pecas').catch(function() { return []; });
  const fornData     = await get('/fornecedores?size=200').catch(function() { return { content: [] }; });
  const fornecedores = fornData.content || (Array.isArray(fornData) ? fornData : []);
  const catOpts = Array.isArray(categorias)   ? categorias.map(function(c) { return [c.codCategoria, c.nome]; })    : [];
  const forOpts = fornecedores.map(function(f) { return [f.codFornecedor, f.razaoSocial || f.nome]; });
  const nomeInput  = makeInput('text', 'modal-peca-nome', 'Nome da peça', p ? p.nome : '');
  const precoInput = makeInput('number', 'modal-peca-preco', '0,00', p ? p.precoVenda : '');
  const estInput   = makeInput('number', 'modal-peca-estmin', '5', p ? p.estoqueMinimo : '');
  precoInput.min  = '0'; precoInput.step = '0.01';
  estInput.min    = '0'; estInput.step   = '1';
  body.appendChild(formGroup('Nome', nomeInput, true));
  body.appendChild(formGroup('Preço de Venda (R$)', precoInput, true));
  body.appendChild(formGroup('Estoque Mínimo', estInput, true));
  body.appendChild(formGroup('Categoria', makeSelect('modal-peca-cat', [['', 'Selecione...']].concat(catOpts), p ? p.codCategoria : '')));
  body.appendChild(formGroup('Fornecedor', makeSelect('modal-peca-for', [['', 'Selecione...']].concat(forOpts), p ? p.codFornecedor : '')));
  setupNumberInput(precoInput, 0, 'Preço');
  setupNumberInput(estInput, 0, 'Estoque mínimo');
}

async function savePeca() {
  const nome   = document.getElementById('modal-peca-nome');
  const preco  = document.getElementById('modal-peca-preco');
  const estmin = document.getElementById('modal-peca-estmin');
  let ok = true;
  if (!validateRequired(nome, 'Nome')) ok = false;
  if (!validateRequired(preco, 'Preço')) ok = false;
  else if (parseFloat(preco.value) < 0) { fieldError(preco, 'Preço deve ser não negativo'); ok = false; }
  if (!validateRequired(estmin, 'Estoque mínimo')) ok = false;
  else if (parseInt(estmin.value) < 0) { fieldError(estmin, 'Estoque mínimo deve ser não negativo'); ok = false; }
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = {
    nome: nome.value.trim(),
    precoVenda: Number(preco.value),
    estoqueMinimo: Number(estmin.value),
    codCategoria: Number(getVal('modal-peca-cat')) || null,
    codFornecedor: Number(getVal('modal-peca-for')) || null
  };
  if (modalEntity) await put('/pecas/' + modalEntity.codPeca, b);
  else await post('/pecas', b);
  toast('Peça salva!', 'success');
  closeModal(); loadPecas();
}

// Pagamento Form
async function buildPagamentoForm(body) {
  const formas = await get('/formas-pagamento').catch(function() { return []; });
  const osList = await get('/ordens-servico?size=200').then(function(d) { return d.content || []; }).catch(function() { return []; });
  const forOpts = Array.isArray(formas) ? formas.map(function(f) { return [f.codForma, f.nome]; }) : [];
  const osOpts  = osList.map(function(o) { return [o.codOrdem, '#' + o.codOrdem + ' — ' + (o.cliente || '')]; });
  const valorInput = makeInput('number', 'modal-pag-valor', '0,00', '');
  valorInput.min = '0.01'; valorInput.step = '0.01';
  body.appendChild(formGroup('OS', makeSelect('modal-pag-os', [['', 'Selecione...']].concat(osOpts), null), true));
  body.appendChild(formGroup('Valor (R$)', valorInput, true));
  body.appendChild(formGroup('Data', makeInput('date', 'modal-pag-data', '', new Date().toISOString().slice(0,10)), true));
  body.appendChild(formGroup('Forma de Pagamento', makeSelect('modal-pag-forma', [['', 'Selecione...']].concat(forOpts), null), true));
  setupNumberInput(valorInput, 0.01, 'Valor');
}

async function savePagamento() {
  const os    = document.getElementById('modal-pag-os');
  const valor = document.getElementById('modal-pag-valor');
  const data  = document.getElementById('modal-pag-data');
  const forma = document.getElementById('modal-pag-forma');
  let ok = true;
  if (!validateRequired(os, 'OS')) ok = false;
  if (!validateRequired(valor, 'Valor')) ok = false;
  else { const v = parseFloat(valor.value); if (isNaN(v) || v <= 0) { fieldError(valor, 'Valor deve ser maior que zero'); ok = false; } }
  if (!validateRequired(data, 'Data')) ok = false;
  if (!validateRequired(forma, 'Forma de pagamento')) ok = false;
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { codOrdem: Number(getVal('modal-pag-os')), valor: Number(getVal('modal-pag-valor')), data: getVal('modal-pag-data'), codForma: Number(getVal('modal-pag-forma')) };
  await post('/pagamentos', b);
  toast('Pagamento registrado!', 'success');
  closeModal(); loadPagamentos();
}

// Modelo Form
function buildModeloForm(body, m) {
  const nomeInput = makeInput('text', 'modal-mod-nome', 'Ex: Fiat Uno, Honda Civic…', m ? m.nome : '');
  body.appendChild(formGroup('Nome', nomeInput, true));
}

async function saveModelo() {
  const nome = document.getElementById('modal-mod-nome');
  if (!validateRequired(nome, 'Nome')) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { nome: nome.value.trim() };
  if (modalEntity) await put('/modelos/' + modalEntity.codModelo, b);
  else await post('/modelos', b);
  toast('Modelo salvo!', 'success');
  closeModal(); loadModelos();
}

// Fornecedor Form
async function buildFornecedorForm(body, f) {
  const cidades = await get('/cidades').catch(function() { return []; });
  const cidOpts = Array.isArray(cidades) ? cidades.map(function(c) { return [c.codCidade, c.nome + ' — ' + c.uf]; }) : [];
  const razInput  = makeInput('text', 'modal-for-raz', 'Razão social', f ? f.razaoSocial : '');
  const cnpjInput = makeInput('text', 'modal-for-cnpj', '00.000.000/0000-00', f ? f.cnpj : '');
  body.appendChild(formGroup('Razão Social', razInput, true));
  body.appendChild(formGroup('CNPJ', cnpjInput, true));
  body.appendChild(formGroup('Cidade', makeSelect('modal-for-cid', [['', 'Selecione...']].concat(cidOpts), f ? f.codCidade : ''), true));
  setupCNPJInput(cnpjInput);
}

async function saveFornecedor() {
  const raz  = document.getElementById('modal-for-raz');
  const cnpj = document.getElementById('modal-for-cnpj');
  const cid  = document.getElementById('modal-for-cid');
  let ok = true;
  if (!validateRequired(raz, 'Razão Social')) ok = false;
  if (!validateRequired(cnpj, 'CNPJ')) ok = false;
  else if (!validateCNPJ(cnpj.value)) { fieldError(cnpj, 'CNPJ inválido'); ok = false; }
  if (!validateRequired(cid, 'Cidade')) ok = false;
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { razaoSocial: raz.value.trim(), cnpj: cnpj.value.trim(), codCidade: Number(cid.value) };
  if (modalEntity) await put('/fornecedores/' + modalEntity.codFornecedor, b);
  else await post('/fornecedores', b);
  toast('Fornecedor salvo!', 'success');
  closeModal(); loadFornecedores();
}

// Categoria Form
function buildCategoriaForm(body, c) {
  const nomeInput = makeInput('text', 'modal-cat-nome', 'Ex: Motor, Freios, Suspensão…', c ? c.nome : '');
  body.appendChild(formGroup('Nome', nomeInput, true));
}

async function saveCategoria() {
  const nome = document.getElementById('modal-cat-nome');
  if (!validateRequired(nome, 'Nome')) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { nome: nome.value.trim() };
  if (modalEntity) await put('/categorias-pecas/' + modalEntity.codCategoria, b);
  else await post('/categorias-pecas', b);
  toast('Categoria salva!', 'success');
  closeModal(); loadCategorias();
}

// Especialidade Form
function buildEspecialidadeForm(body, e) {
  const nomeInput = makeInput('text', 'modal-esp-nome', 'Ex: Elétrica, Funilaria…', e ? e.nome : '');
  body.appendChild(formGroup('Nome', nomeInput, true));
}

async function saveEspecialidade() {
  const nome = document.getElementById('modal-esp-nome');
  if (!validateRequired(nome, 'Nome')) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { nome: nome.value.trim() };
  if (modalEntity) await put('/especialidades/' + modalEntity.codEspecialidade, b);
  else await post('/especialidades', b);
  toast('Especialidade salva!', 'success');
  closeModal(); loadEspecialidades();
}

// Forma de Pagamento Form
function buildFormaPagamentoForm(body, f) {
  const nomeInput = makeInput('text', 'modal-fpag-nome', 'Ex: Dinheiro, Cartão de Crédito…', f ? f.nome : '');
  body.appendChild(formGroup('Nome', nomeInput, true));
}

async function saveFormaPagamento() {
  const nome = document.getElementById('modal-fpag-nome');
  if (!validateRequired(nome, 'Nome')) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { nome: nome.value.trim() };
  if (modalEntity) await put('/formas-pagamento/' + modalEntity.codForma, b);
  else await post('/formas-pagamento', b);
  toast('Forma de pagamento salva!', 'success');
  closeModal(); loadFormasPagamento();
}

// Cidade Form
function buildCidadeForm(body, c) {
  const nomeInput = makeInput('text', 'modal-cid-nome', 'Nome da cidade', c ? c.nome : '');
  const ufInput   = makeInput('text', 'modal-cid-uf', 'SP', c ? c.uf : '');
  ufInput.maxLength = 2;
  body.appendChild(formGroup('Nome', nomeInput, true));
  body.appendChild(formGroup('UF (2 letras)', ufInput, true));
  ufInput.addEventListener('input', function() {
    ufInput.value = ufInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  });
}

async function saveCidade() {
  const nome = document.getElementById('modal-cid-nome');
  const uf   = document.getElementById('modal-cid-uf');
  let ok = true;
  if (!validateRequired(nome, 'Nome')) ok = false;
  if (!validateRequired(uf, 'UF')) ok = false;
  else if (uf.value.trim().length !== 2) { fieldError(uf, 'UF deve ter exatamente 2 letras'); ok = false; }
  if (!ok) { toast('Corrija os campos obrigatórios', 'error'); return; }
  const b = { nome: nome.value.trim(), uf: uf.value.trim().toUpperCase() };
  if (modalEntity) await put('/cidades/' + modalEntity.codCidade, b);
  else await post('/cidades', b);
  toast('Cidade salva!', 'success');
  closeModal(); loadCidades();
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
  if (totalPages <= 1) return;
  const maxVisible = 7;
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let end   = Math.min(totalPages, start + maxVisible);
  if (end - start < maxVisible) start = Math.max(0, end - maxVisible);

  if (start > 0) {
    const btn = el('button', 'page-btn', '«');
    btn.addEventListener('click', function() { loader(0); });
    ctrl.appendChild(btn);
  }
  for (let i = start; i < end; i++) {
    const btn = el('button', 'page-btn' + (i === currentPage ? ' active' : ''), String(i + 1));
    (function(idx) { btn.addEventListener('click', function() { loader(idx); }); }(i));
    ctrl.appendChild(btn);
  }
  if (end < totalPages) {
    const btn = el('button', 'page-btn', '»');
    btn.addEventListener('click', function() { loader(totalPages - 1); });
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
  td.style.padding = '32px 24px';
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

// ── Máscaras e Validações ─────────────────────────

function applyMask(input, maskFn) {
  input.addEventListener('input', function() {
    const cursor = input.selectionStart;
    const prev   = input.value;
    input.value  = maskFn(input.value);
    const diff   = input.value.length - prev.length;
    try { input.setSelectionRange(cursor + diff, cursor + diff); } catch (_) {}
  });
}

function maskCPF(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function maskTelefone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10)
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function maskPlaca(v) {
  const d = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (d.length <= 4) return d.replace(/^([A-Z]{1,3})(\d*)/, '$1$2');
  if (/^[A-Z]{3}\d[A-Z]/.test(d)) {
    return d.slice(0, 3) + d.slice(3, 7).replace(/^(\d)([A-Z])(\d{0,2})/, '$1$2$3');
  }
  return d.slice(0, 3) + '-' + d.slice(3, 7);
}

function maskCNPJ(v) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function validateCPF(cpf) {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

function validateCNPJ(cnpj) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = function(d, n) {
    let sum = 0, pos = n - 7;
    for (let i = n; i >= 1; i--) { sum += parseInt(d[n - i]) * pos--; if (pos < 2) pos = 9; }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(d, 12) === parseInt(d[12]) && calc(d, 13) === parseInt(d[13]);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePlaca(placa) {
  const d = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return /^[A-Z]{3}\d{4}$/.test(d) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(d);
}

function fieldError(input, msg) {
  input.classList.add('error');
  input.classList.remove('valid');
  let err = input.parentNode.querySelector('.form-error');
  if (!err) { err = el('div', 'form-error'); input.parentNode.appendChild(err); }
  err.textContent = msg;
  err.classList.add('visible');
}

function fieldOk(input) {
  input.classList.remove('error');
  input.classList.add('valid');
  const err = input.parentNode.querySelector('.form-error');
  if (err) err.classList.remove('visible');
}

function fieldReset(input) {
  input.classList.remove('error', 'valid');
  const err = input.parentNode.querySelector('.form-error');
  if (err) err.classList.remove('visible');
}

function bindValidation(input, validateFn, errorMsg) {
  input.addEventListener('blur', function() {
    const v = input.value.trim();
    if (!v) { fieldReset(input); return; }
    if (validateFn(v)) fieldOk(input); else fieldError(input, errorMsg);
  });
  input.addEventListener('input', function() {
    if (input.classList.contains('error')) {
      const v = input.value.trim();
      if (validateFn(v)) fieldOk(input);
    }
  });
}

function setupCPFInput(input) {
  applyMask(input, maskCPF);
  bindValidation(input, validateCPF, 'CPF inválido');
}

function setupTelInput(input) {
  applyMask(input, maskTelefone);
  bindValidation(input, function(v) { return v.replace(/\D/g,'').length >= 10; }, 'Telefone inválido');
}

function setupPlacaInput(input) {
  input.addEventListener('input', function() {
    const raw = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    input.value = raw;
  });
  bindValidation(input, validatePlaca, 'Placa inválida (ex: ABC-1234 ou ABC1D23)');
}

function setupCNPJInput(input) {
  applyMask(input, maskCNPJ);
  bindValidation(input, validateCNPJ, 'CNPJ inválido');
}

function setupEmailInput(input) {
  bindValidation(input, validateEmail, 'Email inválido');
}

function setupNumberInput(input, min, label) {
  input.addEventListener('blur', function() {
    const v = parseFloat(input.value);
    if (input.value === '') { fieldReset(input); return; }
    if (isNaN(v) || v < (min !== undefined ? min : 0)) {
      fieldError(input, (label || 'Valor') + ' deve ser >= ' + (min !== undefined ? min : 0));
    } else {
      fieldOk(input);
    }
  });
}

function validateRequired(input, label) {
  const v = input.tagName === 'SELECT' ? input.value : input.value.trim();
  if (!v || v === '0') { fieldError(input, (label || 'Campo') + ' é obrigatório'); return false; }
  fieldOk(input); return true;
}

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  refreshIcons();

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
window.toggleTheme          = toggleTheme;
window.loadOS               = loadOS;
window.loadClientes         = loadClientes;
window.loadPecas            = loadPecas;
window.loadFornecedores     = loadFornecedores;
window.loadCidades          = loadCidades;
