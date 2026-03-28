// ============================================================
// Oficina Inácio & Adriano - Frontend Application
// ============================================================

const API = '';
let token = localStorage.getItem('token');
let currentSection = 'dashboard';

// ============ THEME SYSTEM ============
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    updateThemeIcon();
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (document.documentElement.classList.contains('dark')) {
        icon.className = 'fas fa-sun text-yellow-400';
    } else {
        icon.className = 'fas fa-moon text-gray-600';
    }
}

// ============ API HELPERS ============
async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + path, { ...options, headers });
    if (res.status === 401) { logout(); throw new Error('Sessão expirada'); }
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Erro na requisição');
    return data;
}

// ============ TOAST ============
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const inner = toast.querySelector('div');
    const icon = document.getElementById('toastIcon');
    const msgEl = document.getElementById('toastMsg');

    inner.className = 'px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-center space-x-2 toast-in';
    inner.classList.add(type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600');
    icon.className = 'fas ' + (type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    msgEl.textContent = msg;

    toast.classList.remove('hidden');
    setTimeout(() => { inner.classList.remove('toast-in'); inner.classList.add('toast-out'); }, 2500);
    setTimeout(() => { toast.classList.add('hidden'); inner.classList.remove('toast-out'); }, 2800);
}

// ============ MODAL ============
function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// ============ AUTH ============
function showLogin() { document.getElementById('loginTab').classList.remove('hidden'); document.getElementById('registerTab').classList.add('hidden'); }
function showRegister() { document.getElementById('loginTab').classList.add('hidden'); document.getElementById('registerTab').classList.remove('hidden'); }

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: document.getElementById('loginEmail').value, senha: document.getElementById('loginPassword').value })
        });
        token = data.token;
        localStorage.setItem('token', token);
        showApp();
    } catch (err) { showLoginMsg(err.message, 'red'); }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ nome: document.getElementById('regName').value, email: document.getElementById('regEmail').value, senha: document.getElementById('regPassword').value })
        });
        showLoginMsg('Cadastro realizado! Faça login.', 'green');
        showLogin();
    } catch (err) { showLoginMsg(err.message, 'red'); }
});

function showLoginMsg(msg, color) {
    const el = document.getElementById('loginMsg');
    el.textContent = msg;
    el.className = 'mt-4 text-center text-sm text-' + color + '-600 dark:text-' + color + '-400';
    el.classList.remove('hidden');
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginForm').reset();
}

// ============ SHOW APP ============
async function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    try {
        const profile = await api('/api/auth/profile');
        document.getElementById('userName').textContent = profile.nome;
    } catch {}
    showSection('dashboard');
}

// ============ SECTIONS ============
function showSection(section) {
    currentSection = section;
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const sec = document.getElementById('sec-' + section);
    if (sec) sec.classList.remove('hidden');

    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.section === section) t.classList.add('active');
    });

    switch (section) {
        case 'dashboard': loadDashboard(); break;
        case 'clientes': loadCrud('clientes', 'Clientes', clienteConfig()); break;
        case 'veiculos': loadCrud('veiculos', 'Veículos', veiculoConfig()); break;
        case 'mecanicos': loadCrud('mecanicos', 'Mecânicos', mecanicoConfig()); break;
        case 'pecas': loadCrud('pecas', 'Peças', pecaConfig()); break;
        case 'fornecedores': loadCrud('fornecedores', 'Fornecedores', fornecedorConfig()); break;
        case 'ordens': loadCrud('ordens', 'Ordens de Serviço', ordemConfig()); break;
        case 'pagamentos': loadCrud('pagamentos', 'Pagamentos', pagamentoConfig()); break;
        case 'profile': loadProfile(); break;
    }
}

// ============ DASHBOARD ============
async function loadDashboard() {
    const cards = document.getElementById('dashboardCards');
    const stats = [
        { label: 'Clientes', endpoint: '/api/clientes?size=1', icon: 'fa-users', color: 'blue' },
        { label: 'Veículos', endpoint: '/api/veiculos?size=1', icon: 'fa-car', color: 'green' },
        { label: 'Ordens de Serviço', endpoint: '/api/ordens-servico?size=1', icon: 'fa-clipboard-list', color: 'purple' },
        { label: 'Mecânicos', endpoint: '/api/mecanicos?size=1', icon: 'fa-hard-hat', color: 'orange' },
    ];

    let html = '';
    for (const s of stats) {
        try {
            const data = await api(s.endpoint);
            const total = data.totalElements || 0;
            html += `<div class="stat-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${s.label}</p>
                        <p class="text-3xl font-bold mt-1">${total}</p>
                    </div>
                    <div class="w-12 h-12 bg-${s.color}-100 dark:bg-${s.color}-900/30 rounded-xl flex items-center justify-center">
                        <i class="fas ${s.icon} text-${s.color}-600 dark:text-${s.color}-400 text-xl"></i>
                    </div>
                </div>
            </div>`;
        } catch { html += ''; }
    }
    cards.innerHTML = html;
}

// ============ PROFILE ============
async function loadProfile() {
    try {
        const profile = await api('/api/auth/profile');
        document.getElementById('profileName').value = profile.nome;
        document.getElementById('profileEmail').value = profile.email;
    } catch {}
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ nome: document.getElementById('profileName').value, email: document.getElementById('profileEmail').value }) });
        showToast('Perfil atualizado!');
        const profile = await api('/api/auth/profile');
        document.getElementById('userName').textContent = profile.nome;
    } catch (err) { showToast(err.message, 'error'); }
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await api('/api/auth/password', { method: 'PUT', body: JSON.stringify({ senhaAtual: document.getElementById('currentPassword').value, novaSenha: document.getElementById('newPassword').value }) });
        showToast('Senha alterada!');
        document.getElementById('passwordForm').reset();
    } catch (err) { showToast(err.message, 'error'); }
});

// ============ GENERIC CRUD ENGINE ============
const inputClass = 'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition text-sm';

function buildFormField(f, value) {
    const val = value !== undefined && value !== null ? value : '';
    if (f.type === 'select') {
        const opts = (f.options || []).map(o => `<option value="${o.value}" ${String(o.value) === String(val) ? 'selected' : ''}>${o.label}</option>`).join('');
        return `<div><label class="block text-sm font-medium mb-1">${f.label}</label><select name="${f.name}" class="${inputClass}" ${f.required ? 'required' : ''}><option value="">Selecione...</option>${opts}</select></div>`;
    }
    return `<div><label class="block text-sm font-medium mb-1">${f.label}</label><input type="${f.type || 'text'}" name="${f.name}" value="${val}" class="${inputClass}" ${f.required ? 'required' : ''} ${f.step ? 'step="' + f.step + '"' : ''}></div>`;
}

async function loadCrud(section, title, config) {
    const container = document.getElementById('sec-' + section);
    container.innerHTML = `<div class="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 class="text-2xl font-bold">${title}</h2>
        <button onclick="openCreateModal_${section}()" class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-xl transition text-sm shadow-lg shadow-primary-500/25">
            <i class="fas fa-plus mr-1"></i>Novo
        </button>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table class="data-table"><thead><tr>${config.columns.map(c => `<th>${c.label}</th>`).join('')}<th>Ações</th></tr></thead><tbody id="table-${section}"><tr><td colspan="${config.columns.length + 1}" class="text-center py-8 text-gray-400">Carregando...</td></tr></tbody></table>
    </div>
    <div id="pagination-${section}" class="flex justify-center gap-2 mt-4"></div>`;

    window['openCreateModal_' + section] = async () => {
        const fields = await config.formFields();
        const html = `<form id="createForm-${section}" class="space-y-4">${fields.map(f => buildFormField(f, '')).join('')}
            <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition">
                <i class="fas fa-save mr-1"></i>Salvar</button></form>`;
        openModal('Novo ' + title.replace(/s$/, ''), html);
        document.getElementById('createForm-' + section).addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target));
            config.prepareData && config.prepareData(formData);
            try {
                await api(config.apiPath, { method: 'POST', body: JSON.stringify(formData) });
                closeModal();
                showToast('Criado com sucesso!');
                loadCrudData(section, config, 0);
            } catch (err) { showToast(err.message, 'error'); }
        });
    };

    window['openEditModal_' + section] = async (id) => {
        const item = await api(config.apiPath + '/' + id);
        const fields = await config.formFields();
        const html = `<form id="editForm-${section}" class="space-y-4">${fields.map(f => buildFormField(f, config.getFieldValue ? config.getFieldValue(f.name, item) : item[f.name])).join('')}
            <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition">
                <i class="fas fa-save mr-1"></i>Atualizar</button></form>`;
        openModal('Editar ' + title.replace(/s$/, ''), html);
        document.getElementById('editForm-' + section).addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = Object.fromEntries(new FormData(e.target));
            config.prepareData && config.prepareData(formData);
            try {
                await api(config.apiPath + '/' + id, { method: 'PUT', body: JSON.stringify(formData) });
                closeModal();
                showToast('Atualizado com sucesso!');
                loadCrudData(section, config, 0);
            } catch (err) { showToast(err.message, 'error'); }
        });
    };

    window['deleteItem_' + section] = async (id) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await api(config.apiPath + '/' + id, { method: 'DELETE' });
            showToast('Excluído com sucesso!');
            loadCrudData(section, config, 0);
        } catch (err) { showToast(err.message, 'error'); }
    };

    loadCrudData(section, config, 0);
}

async function loadCrudData(section, config, page) {
    const tbody = document.getElementById('table-' + section);
    try {
        const data = await api(config.apiPath + '?page=' + page + '&size=15');
        const items = data.content || data;
        const isPage = !!data.content;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="text-center py-8 text-gray-400">Nenhum registro encontrado</td></tr>`;
        } else {
            tbody.innerHTML = items.map(item => {
                const idVal = config.getId(item);
                return `<tr>${config.columns.map(c => `<td>${c.render ? c.render(item) : (item[c.key] ?? '-')}</td>`).join('')}
                    <td class="flex gap-2">
                        <button onclick="openEditModal_${section}(${idVal})" class="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteItem_${section}(${idVal})" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"><i class="fas fa-trash"></i></button>
                    </td></tr>`;
            }).join('');
        }

        if (isPage && data.totalPages > 1) {
            const pag = document.getElementById('pagination-' + section);
            let pagHtml = '';
            for (let i = 0; i < data.totalPages; i++) {
                pagHtml += `<button onclick="loadCrudData('${section}', window['${section}Config'], ${i})" class="px-3 py-1 rounded-lg text-sm ${i === page ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}">${i + 1}</button>`;
            }
            pag.innerHTML = pagHtml;
        }
        window[section + 'Config'] = config;
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="text-center py-8 text-red-400">${err.message}</td></tr>`;
    }
}

// ============ CRUD CONFIGS ============
function clienteConfig() {
    return {
        apiPath: '/api/clientes',
        getId: i => i.codCliente,
        columns: [
            { label: 'ID', key: 'codCliente' },
            { label: 'Nome', key: 'nome' },
            { label: 'CPF', key: 'cpf' },
            { label: 'Telefone', key: 'telefone' },
        ],
        formFields: async () => [
            { name: 'nome', label: 'Nome', required: true },
            { name: 'cpf', label: 'CPF', required: true },
            { name: 'telefone', label: 'Telefone', required: true },
        ],
    };
}

function veiculoConfig() {
    return {
        apiPath: '/api/veiculos',
        getId: i => i.codVeiculo,
        columns: [
            { label: 'ID', key: 'codVeiculo' },
            { label: 'Placa', key: 'placa' },
            { label: 'Modelo', key: 'modelo' },
            { label: 'Ano', key: 'ano' },
            { label: 'Cliente', key: 'cliente' },
        ],
        formFields: async () => {
            const modelos = await api('/api/modelos');
            const clientes = await api('/api/clientes?size=100');
            return [
                { name: 'placa', label: 'Placa', required: true },
                { name: 'codModelo', label: 'Modelo', type: 'select', required: true, options: modelos.map(m => ({ value: m.codModelo, label: m.nome })) },
                { name: 'ano', label: 'Ano', type: 'number', required: true },
                { name: 'codCliente', label: 'Cliente', type: 'select', required: true, options: (clientes.content || clientes).map(c => ({ value: c.codCliente, label: c.nome })) },
            ];
        },
        prepareData: d => { d.codModelo = Number(d.codModelo); d.ano = Number(d.ano); d.codCliente = Number(d.codCliente); },
    };
}

function mecanicoConfig() {
    return {
        apiPath: '/api/mecanicos',
        getId: i => i.codMecanico,
        columns: [
            { label: 'ID', key: 'codMecanico' },
            { label: 'Nome', key: 'nome' },
            { label: 'Especialidade', key: 'especialidade' },
            { label: 'Comissão %', key: 'comissaoPercentual' },
        ],
        formFields: async () => {
            const esp = await api('/api/especialidades');
            return [
                { name: 'nome', label: 'Nome', required: true },
                { name: 'codEspecialidade', label: 'Especialidade', type: 'select', required: true, options: esp.map(e => ({ value: e.codEspecialidade, label: e.nome })) },
                { name: 'comissaoPercentual', label: 'Comissão (%)', type: 'number', step: '0.01', required: true },
            ];
        },
        prepareData: d => { d.codEspecialidade = Number(d.codEspecialidade); d.comissaoPercentual = Number(d.comissaoPercentual); },
    };
}

function pecaConfig() {
    return {
        apiPath: '/api/pecas',
        getId: i => i.codPeca,
        columns: [
            { label: 'ID', key: 'codPeca' },
            { label: 'Nome', key: 'nome' },
            { label: 'Preço', key: 'precoVenda', render: i => 'R$ ' + Number(i.precoVenda).toFixed(2) },
            { label: 'Est. Mín.', key: 'estoqueMinimo' },
            { label: 'Categoria', key: 'categoria' },
            { label: 'Fornecedor', key: 'fornecedor' },
        ],
        formFields: async () => {
            const cats = await api('/api/categorias-pecas');
            const forns = await api('/api/fornecedores?size=100');
            return [
                { name: 'nome', label: 'Nome', required: true },
                { name: 'precoVenda', label: 'Preço Venda', type: 'number', step: '0.01', required: true },
                { name: 'estoqueMinimo', label: 'Estoque Mínimo', type: 'number', required: true },
                { name: 'codCategoria', label: 'Categoria', type: 'select', required: true, options: cats.map(c => ({ value: c.codCategoria, label: c.nome })) },
                { name: 'codFornecedor', label: 'Fornecedor', type: 'select', required: true, options: (forns.content || forns).map(f => ({ value: f.codFornecedor, label: f.razaoSocial })) },
            ];
        },
        prepareData: d => { d.precoVenda = Number(d.precoVenda); d.estoqueMinimo = Number(d.estoqueMinimo); d.codCategoria = Number(d.codCategoria); d.codFornecedor = Number(d.codFornecedor); },
    };
}

function fornecedorConfig() {
    return {
        apiPath: '/api/fornecedores',
        getId: i => i.codFornecedor,
        columns: [
            { label: 'ID', key: 'codFornecedor' },
            { label: 'Razão Social', key: 'razaoSocial' },
            { label: 'CNPJ', key: 'cnpj' },
            { label: 'Cidade', key: 'cidade' },
        ],
        formFields: async () => {
            const cidades = await api('/api/cidades');
            return [
                { name: 'razaoSocial', label: 'Razão Social', required: true },
                { name: 'cnpj', label: 'CNPJ', required: true },
                { name: 'codCidade', label: 'Cidade', type: 'select', required: true, options: cidades.map(c => ({ value: c.codCidade, label: c.nome + '/' + c.uf })) },
            ];
        },
        prepareData: d => { d.codCidade = Number(d.codCidade); },
    };
}

function ordemConfig() {
    return {
        apiPath: '/api/ordens-servico',
        getId: i => i.codOrdem,
        columns: [
            { label: 'ID', key: 'codOrdem' },
            { label: 'Data Entrada', key: 'dataEntrada' },
            { label: 'KM Atual', key: 'kmAtual' },
            { label: 'Veículo', key: 'veiculo' },
            { label: 'Cliente', key: 'cliente' },
            { label: 'Status', key: 'status', render: i => `<span class="px-2 py-1 rounded-lg text-xs font-semibold ${i.status === 'Finalizado' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : i.status === 'Cancelado' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}">${i.status}</span>` },
        ],
        formFields: async () => {
            const veiculos = await api('/api/veiculos?size=100');
            const statuses = await api('/api/status');
            return [
                { name: 'dataEntrada', label: 'Data Entrada', type: 'date' },
                { name: 'kmAtual', label: 'KM Atual', type: 'number' },
                { name: 'codVeiculo', label: 'Veículo', type: 'select', required: true, options: (veiculos.content || veiculos).map(v => ({ value: v.codVeiculo, label: v.placa + ' - ' + v.modelo })) },
                { name: 'codStatus', label: 'Status', type: 'select', required: true, options: statuses.map(s => ({ value: s.codStatus, label: s.descricao })) },
            ];
        },
        prepareData: d => { d.codVeiculo = Number(d.codVeiculo); d.codStatus = Number(d.codStatus); d.kmAtual = d.kmAtual ? Number(d.kmAtual) : null; d.dataEntrada = d.dataEntrada || null; },
    };
}

function pagamentoConfig() {
    return {
        apiPath: '/api/pagamentos',
        getId: i => i.codPagamento,
        columns: [
            { label: 'ID', key: 'codPagamento' },
            { label: 'Valor', render: i => 'R$ ' + Number(i.valor).toFixed(2) },
            { label: 'Data', key: 'data' },
            { label: 'Ordem', key: 'codOrdem' },
            { label: 'Forma', key: 'formaPagamento' },
        ],
        formFields: async () => {
            const ordens = await api('/api/ordens-servico?size=100');
            const formas = await api('/api/formas-pagamento');
            return [
                { name: 'valor', label: 'Valor (R$)', type: 'number', step: '0.01', required: true },
                { name: 'data', label: 'Data', type: 'date' },
                { name: 'codOrdem', label: 'Ordem de Serviço', type: 'select', required: true, options: (ordens.content || ordens).map(o => ({ value: o.codOrdem, label: '#' + o.codOrdem + ' - ' + o.veiculo })) },
                { name: 'codForma', label: 'Forma de Pagamento', type: 'select', required: true, options: formas.map(f => ({ value: f.codForma, label: f.nome })) },
            ];
        },
        prepareData: d => { d.valor = Number(d.valor); d.codOrdem = Number(d.codOrdem); d.codForma = Number(d.codForma); d.data = d.data || null; },
    };
}

// ============ INIT ============
initTheme();
if (token) showApp(); else { document.getElementById('loginScreen').classList.remove('hidden'); }
