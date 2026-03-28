// ============================================================
// Oficina Inácio & Adriano - Neumorphism SPA
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
    if (!icon) return;
    icon.className = document.documentElement.classList.contains('dark')
        ? 'fas fa-sun' : 'fas fa-moon';
}

// ============ API HELPERS ============
async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + path, { ...options, headers });
    if (res.status === 401) { logout(); throw new Error('Sessão expirada'); }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && (data.message || data.error)) || 'Erro na requisição');
    return data;
}

// ============ TOAST ============
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast-item ' + type;
    toast.innerHTML = `<i class="toast-icon fas ${iconMap[type] || iconMap.info}"></i><span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); }, 2800);
    setTimeout(() => { toast.remove(); }, 3200);
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ============ INPUT MASKS ============
const Masks = {
    cpf(v)     { return v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'); },
    cnpj(v)    { return v.replace(/\D/g,'').slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2'); },
    telefone(v){ const d=v.replace(/\D/g,'').slice(0,11); return d.length>10 ? d.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3') : d.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3'); },
    placa(v)   { const u=v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7); if(u.length<=3) return u; return u.slice(0,3)+'-'+u.slice(3); },
    money(v)   { const n=v.replace(/\D/g,''); const f=(parseInt(n||'0',10)/100).toFixed(2); return 'R$ '+f.replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.'); },
    integer(v) { return v.replace(/\D/g,''); },
};

const Validators = {
    cpf(v) {
        const d = v.replace(/\D/g,'');
        if (d.length !== 11) return 'CPF deve ter 11 dígitos';
        if (/^(\d)\1{10}$/.test(d)) return 'CPF inválido';
        let sum=0; for(let i=0;i<9;i++) sum+=parseInt(d[i])*(10-i); let r=11-(sum%11); if(r>=10)r=0; if(parseInt(d[9])!==r) return 'CPF inválido';
        sum=0; for(let i=0;i<10;i++) sum+=parseInt(d[i])*(11-i); r=11-(sum%11); if(r>=10)r=0; if(parseInt(d[10])!==r) return 'CPF inválido';
        return null;
    },
    cnpj(v) {
        const d = v.replace(/\D/g,'');
        if (d.length !== 14) return 'CNPJ deve ter 14 dígitos';
        if (/^(\d)\1{13}$/.test(d)) return 'CNPJ inválido';
        const w1=[5,4,3,2,9,8,7,6,5,4,3,2], w2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
        let sum=0; for(let i=0;i<12;i++) sum+=parseInt(d[i])*w1[i]; let r=sum%11<2?0:11-(sum%11); if(parseInt(d[12])!==r) return 'CNPJ inválido';
        sum=0; for(let i=0;i<13;i++) sum+=parseInt(d[i])*w2[i]; r=sum%11<2?0:11-(sum%11); if(parseInt(d[13])!==r) return 'CNPJ inválido';
        return null;
    },
    telefone(v) {
        const d = v.replace(/\D/g,'');
        if (d.length < 10 || d.length > 11) return 'Telefone deve ter 10 ou 11 dígitos';
        return null;
    },
    placa(v) {
        const u = v.replace(/[^A-Za-z0-9]/g,'').toUpperCase();
        if (u.length !== 7) return 'Placa deve ter 7 caracteres';
        if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(u)) return 'Formato inválido (ABC-1234 ou ABC1D23)';
        return null;
    },
    email(v) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email inválido';
        return null;
    },
    minLength(n) { return (v) => v.length < n ? `Mínimo de ${n} caracteres` : null; },
    required(v) { return (!v || !v.trim()) ? 'Campo obrigatório' : null; },
    positiveNumber(v) { return (isNaN(v) || Number(v) <= 0) ? 'Deve ser um número positivo' : null; },
    year(v) { const n=Number(v); return (isNaN(n) || n < 1900 || n > new Date().getFullYear()+2) ? 'Ano inválido' : null; },
};

function applyMask(input, maskName) {
    if (!Masks[maskName]) return;
    input.addEventListener('input', () => {
        const pos = input.selectionStart;
        const oldLen = input.value.length;
        input.value = Masks[maskName](input.value);
        const newLen = input.value.length;
        input.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen));
    });
}

function showFieldChip(input, message, type = 'error') {
    clearFieldChip(input);
    input.classList.add('is-error');
    input.classList.remove('is-valid');
    const chip = document.createElement('div');
    chip.className = 'field-chip ' + type + ' visible';
    const iconMap = { error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    chip.innerHTML = `<i class="fas ${iconMap[type] || iconMap.error}"></i><span>${message}</span>`;
    input.parentElement.appendChild(chip);
}

function showFieldChipHtml(input, html, type = 'warning') {
    clearFieldChip(input);
    input.classList.add('is-error');
    const chip = document.createElement('div');
    chip.className = 'field-chip ' + type + ' visible';
    const iconMap = { error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    chip.innerHTML = `<i class="fas ${iconMap[type]}"></i><span>${html}</span>`;
    input.parentElement.appendChild(chip);
}

function clearFieldChip(input) {
    input.classList.remove('is-error', 'is-valid');
    const existing = input.parentElement.querySelector('.field-chip');
    if (existing) existing.remove();
}

function markValid(input) {
    clearFieldChip(input);
    input.classList.add('is-valid');
}

function validateField(input, validators) {
    if (!validators || validators.length === 0) return true;
    const val = input.value.trim();
    for (const v of validators) {
        const fn = typeof v === 'function' ? v : Validators[v];
        if (!fn) continue;
        const err = fn(val);
        if (err) { showFieldChip(input, err); return false; }
    }
    if (val) markValid(input);
    else clearFieldChip(input);
    return true;
}

function validateForm(form, fields) {
    let allValid = true;
    for (const f of fields) {
        if (!f.validators || f.validators.length === 0) continue;
        const input = form.querySelector(`[name="${f.name}"]`);
        if (!input) continue;
        if (!validateField(input, f.validators)) {
            allValid = false;
        }
    }
    return allValid;
}

function setupLiveValidation(form, fields) {
    for (const f of fields) {
        const input = form.querySelector(`[name="${f.name}"]`);
        if (!input) continue;
        // Apply mask
        if (f.mask) applyMask(input, f.mask);
        // Live validation on blur
        if (f.validators && f.validators.length > 0) {
            input.addEventListener('blur', () => validateField(input, f.validators));
            input.addEventListener('input', () => {
                if (input.classList.contains('is-error')) validateField(input, f.validators);
            });
        }
    }
}

// ============ MODAL ============
function openModal(title, bodyHtml) {
    const modal = document.getElementById('modal');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-content neu-flat animate-scale-in">
        <div class="modal-header">
            <h3>${escapeHtml(title)}</h3>
            <button onclick="closeModal()" class="neu-btn neu-btn-ghost neu-btn-icon" style="width:36px;height:36px">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
    </div>`;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('closing');
    setTimeout(() => { modal.className = 'hidden'; }, 250);
}

function confirmDialog(message) {
    return new Promise((resolve) => {
        openModal('Confirmação', `
            <p style="color:var(--text-secondary);margin-bottom:8px">${escapeHtml(message)}</p>
            <div class="confirm-actions">
                <button onclick="closeModal();window.__confirmResolve(false)" class="neu-btn neu-btn-sm">Cancelar</button>
                <button onclick="closeModal();window.__confirmResolve(true)" class="neu-btn neu-btn-sm neu-btn-danger">Confirmar</button>
            </div>`);
        window.__confirmResolve = resolve;
    });
}

// ============ AUTH ============
function showLogin() {
    document.getElementById('loginTab').classList.remove('hidden');
    document.getElementById('registerTab').classList.add('hidden');
}
function showRegister() {
    document.getElementById('loginTab').classList.add('hidden');
    document.getElementById('registerTab').classList.remove('hidden');
}

function showLoginMsg(msg, type) {
    const el = document.getElementById('loginMsg');
    el.textContent = msg;
    el.className = 'login-msg ' + type;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                senha: document.getElementById('loginPassword').value
            })
        });
        token = data.token;
        localStorage.setItem('token', token);
        showApp();
    } catch (err) { showLoginMsg(err.message, 'error'); }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const passInput = document.getElementById('regPassword');
    let valid = true;
    if (!nameInput.value.trim()) { showFieldChip(nameInput, 'Nome é obrigatório'); valid = false; } else clearFieldChip(nameInput);
    if (!validateField(emailInput, ['required', 'email'])) valid = false;
    if (!validateField(passInput, ['required', Validators.minLength(6)])) valid = false;
    if (!valid) return;
    try {
        await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                nome: nameInput.value,
                email: emailInput.value,
                senha: passInput.value
            })
        });
        showLoginMsg('Cadastro realizado! Faça login.', 'success');
        showLogin();
    } catch (err) { showLoginMsg(err.message, 'error'); }
});

function logout() {
    token = null;
    localStorage.removeItem('token');
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('loginMsg').className = 'hidden';
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
    if (sec) {
        sec.classList.remove('hidden');
        sec.className = 'section animate-fade-in';
    }

    document.querySelectorAll('.sidebar-item').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.section === section) t.classList.add('active');
    });

    switch (section) {
        case 'dashboard': renderDashboard(); break;
        case 'clientes': loadCrud('clientes', 'Clientes', 'fa-users', clienteConfig()); break;
        case 'veiculos': loadCrud('veiculos', 'Veículos', 'fa-car', veiculoConfig()); break;
        case 'mecanicos': loadCrud('mecanicos', 'Mecânicos', 'fa-hard-hat', mecanicoConfig()); break;
        case 'pecas': loadCrud('pecas', 'Peças', 'fa-cogs', pecaConfig()); break;
        case 'fornecedores': loadCrud('fornecedores', 'Fornecedores', 'fa-truck', fornecedorConfig()); break;
        case 'ordens': loadCrud('ordens', 'Ordens de Serviço', 'fa-clipboard-list', ordemConfig()); break;
        case 'pagamentos': loadCrud('pagamentos', 'Pagamentos', 'fa-credit-card', pagamentoConfig()); break;
        case 'profile': renderProfile(); break;
    }
}

// ============ DASHBOARD ============
async function renderDashboard() {
    const container = document.getElementById('sec-dashboard');
    container.innerHTML = `
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-chart-pie"></i>Dashboard</h2>
        </div>
        <div class="stat-grid" id="dashboardCards">
            <div class="loading-spinner"></div>
        </div>`;

    const stats = [
        { label: 'Clientes', endpoint: '/api/clientes?size=1', icon: 'fa-users', color: 'blue' },
        { label: 'Veículos', endpoint: '/api/veiculos?size=1', icon: 'fa-car', color: 'green' },
        { label: 'Ordens de Serviço', endpoint: '/api/ordens-servico?size=1', icon: 'fa-clipboard-list', color: 'purple' },
        { label: 'Mecânicos', endpoint: '/api/mecanicos?size=1', icon: 'fa-hard-hat', color: 'orange' },
        { label: 'Peças', endpoint: '/api/pecas?size=1', icon: 'fa-cogs', color: 'pink' },
        { label: 'Fornecedores', endpoint: '/api/fornecedores?size=1', icon: 'fa-truck', color: 'cyan' },
    ];

    let html = '';
    for (let i = 0; i < stats.length; i++) {
        const s = stats[i];
        try {
            const data = await api(s.endpoint);
            const total = data.totalElements || 0;
            html += `<div class="neu-card stat-card animate-slide-up stagger-${i + 1}">
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div>
                        <p class="stat-label">${s.label}</p>
                        <p class="stat-value">${total}</p>
                    </div>
                    <div class="stat-icon ${s.color}">
                        <i class="fas ${s.icon}"></i>
                    </div>
                </div>
            </div>`;
        } catch { /* skip */ }
    }
    document.getElementById('dashboardCards').innerHTML = html || '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>Nenhum dado disponível</p></div>';
}

// ============ PROFILE ============
function renderProfile() {
    const container = document.getElementById('sec-profile');
    container.innerHTML = `
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-user-cog"></i>Perfil</h2>
        </div>
        <div class="profile-grid">
            <div class="neu-card" style="padding:28px">
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:20px;color:var(--text)">
                    <i class="fas fa-user" style="color:var(--primary);margin-right:8px"></i>Dados Pessoais
                </h3>
                <form id="profileForm">
                    <div class="form-group">
                        <label class="form-label">Nome</label>
                        <input type="text" id="profileName" class="neu-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" id="profileEmail" class="neu-input" required>
                    </div>
                    <button type="submit" class="neu-btn neu-btn-primary">
                        <i class="fas fa-save"></i> Salvar
                    </button>
                </form>
            </div>
            <div class="neu-card" style="padding:28px">
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:20px;color:var(--text)">
                    <i class="fas fa-lock" style="color:var(--accent);margin-right:8px"></i>Alterar Senha
                </h3>
                <form id="passwordForm">
                    <div class="form-group">
                        <label class="form-label">Senha Atual</label>
                        <input type="password" id="currentPassword" class="neu-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nova Senha</label>
                        <input type="password" id="newPassword" class="neu-input" required minlength="6">
                    </div>
                    <button type="submit" class="neu-btn neu-btn-accent">
                        <i class="fas fa-key"></i> Alterar Senha
                    </button>
                </form>
            </div>
        </div>`;

    loadProfileData();

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    nome: document.getElementById('profileName').value,
                    email: document.getElementById('profileEmail').value
                })
            });
            showToast('Perfil atualizado!');
            const profile = await api('/api/auth/profile');
            document.getElementById('userName').textContent = profile.nome;
        } catch (err) { showToast(err.message, 'error'); }
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api('/api/auth/password', {
                method: 'PUT',
                body: JSON.stringify({
                    senhaAtual: document.getElementById('currentPassword').value,
                    novaSenha: document.getElementById('newPassword').value
                })
            });
            showToast('Senha alterada!');
            document.getElementById('passwordForm').reset();
        } catch (err) { showToast(err.message, 'error'); }
    });
}

async function loadProfileData() {
    try {
        const profile = await api('/api/auth/profile');
        document.getElementById('profileName').value = profile.nome;
        document.getElementById('profileEmail').value = profile.email;
    } catch {}
}

// ============ GENERIC CRUD ENGINE ============
function buildFormField(f, value) {
    const val = value !== undefined && value !== null ? value : '';
    const hintHtml = f.hint ? `<span class="field-hint">${escapeHtml(f.hint)}</span>` : '';

    if (f.type === 'select') {
        const hasOptions = f.options && f.options.length > 0;
        const opts = (f.options || []).map(o =>
            `<option value="${o.value}" ${String(o.value) === String(val) ? 'selected' : ''}>${escapeHtml(String(o.label))}</option>`
        ).join('');

        // Dependency warning for empty selects
        let chipHtml = '';
        if (!hasOptions && f.emptyMsg) {
            const linkPart = f.emptyLink
                ? ` <a onclick="closeModal();showSection('${f.emptyLink}')">${escapeHtml(f.emptyLinkLabel || 'Cadastrar')}</a>`
                : '';
            chipHtml = `<div class="field-chip warning visible"><i class="fas fa-exclamation-triangle"></i><span>${escapeHtml(f.emptyMsg)}${linkPart}</span></div>`;
        }

        return `<div class="form-group">
            <label class="form-label">${escapeHtml(f.label)}</label>
            <select name="${f.name}" class="neu-input${!hasOptions ? ' is-error' : ''}" ${f.required ? 'required' : ''} ${!hasOptions ? 'disabled' : ''}>
                <option value="">${hasOptions ? 'Selecione...' : 'Nenhum disponível'}</option>${opts}
            </select>
            ${chipHtml}${hintHtml}
        </div>`;
    }

    const inputType = (f.mask === 'money' || f.mask === 'cpf' || f.mask === 'cnpj' || f.mask === 'telefone' || f.mask === 'placa') ? 'text' : (f.type || 'text');
    const displayVal = f.mask && val ? (Masks[f.mask] ? Masks[f.mask](String(val)) : val) : val;
    const placeholderAttr = f.placeholder ? `placeholder="${escapeHtml(f.placeholder)}"` : '';

    return `<div class="form-group">
        <label class="form-label">${escapeHtml(f.label)}</label>
        <input type="${inputType}" name="${f.name}" value="${escapeHtml(String(displayVal))}" class="neu-input"
            ${f.required ? 'required' : ''} ${f.step ? 'step="' + f.step + '"' : ''} ${placeholderAttr}
            ${f.maxlength ? 'maxlength="' + f.maxlength + '"' : ''}>
        ${hintHtml}
    </div>`;
}

async function loadCrud(section, title, icon, config) {
    const container = document.getElementById('sec-' + section);
    container.innerHTML = `
        <div class="section-header">
            <h2 class="section-title"><i class="fas ${icon}"></i>${escapeHtml(title)}</h2>
            <button onclick="openCreateModal_${section}()" class="neu-btn neu-btn-primary">
                <i class="fas fa-plus"></i> Novo
            </button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead><tr>${config.columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}<th>Ações</th></tr></thead>
                <tbody id="table-${section}">
                    <tr><td colspan="${config.columns.length + 1}"><div class="loading-spinner"></div></td></tr>
                </tbody>
            </table>
        </div>
        <div id="pagination-${section}" class="pagination"></div>`;

    window['openCreateModal_' + section] = async () => {
        const fields = await config.formFields();
        const html = `<form id="createForm-${section}">
            ${fields.map(f => buildFormField(f, '')).join('')}
            <button type="submit" class="neu-btn neu-btn-primary" style="width:100%;margin-top:8px">
                <i class="fas fa-save"></i> Salvar
            </button>
        </form>`;
        openModal('Novo ' + title.replace(/s$/, ''), html);
        const form = document.getElementById('createForm-' + section);
        setupLiveValidation(form, fields);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(form, fields)) { showToast('Corrija os campos destacados', 'error'); return; }
            const formData = Object.fromEntries(new FormData(e.target));
            if (config.cleanData) config.cleanData(formData);
            if (config.prepareData) config.prepareData(formData);
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
        const html = `<form id="editForm-${section}">
            ${fields.map(f => buildFormField(f, config.getFieldValue ? config.getFieldValue(f.name, item) : item[f.name])).join('')}
            <button type="submit" class="neu-btn neu-btn-primary" style="width:100%;margin-top:8px">
                <i class="fas fa-save"></i> Atualizar
            </button>
        </form>`;
        openModal('Editar ' + title.replace(/s$/, ''), html);
        const form = document.getElementById('editForm-' + section);
        setupLiveValidation(form, fields);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(form, fields)) { showToast('Corrija os campos destacados', 'error'); return; }
            const formData = Object.fromEntries(new FormData(e.target));
            if (config.cleanData) config.cleanData(formData);
            if (config.prepareData) config.prepareData(formData);
            try {
                await api(config.apiPath + '/' + id, { method: 'PUT', body: JSON.stringify(formData) });
                closeModal();
                showToast('Atualizado com sucesso!');
                loadCrudData(section, config, 0);
            } catch (err) { showToast(err.message, 'error'); }
        });
    };

    window['deleteItem_' + section] = async (id) => {
        const ok = await confirmDialog('Tem certeza que deseja excluir este registro?');
        if (!ok) return;
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
            tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}">
                <div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum registro encontrado</p></div>
            </td></tr>`;
        } else {
            tbody.innerHTML = items.map(item => {
                const idVal = config.getId(item);
                return `<tr class="animate-fade-in">
                    ${config.columns.map(c => `<td>${c.render ? c.render(item) : escapeHtml(String(item[c.key] ?? '-'))}</td>`).join('')}
                    <td>
                        <div class="table-actions">
                            <button onclick="openEditModal_${section}(${idVal})" class="table-action-btn edit" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteItem_${section}(${idVal})" class="table-action-btn delete" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

        if (isPage && data.totalPages > 1) {
            const pag = document.getElementById('pagination-' + section);
            let pagHtml = '';
            for (let i = 0; i < data.totalPages; i++) {
                pagHtml += `<button onclick="loadCrudData('${section}', window['${section}Config'], ${i})"
                    class="pagination-btn ${i === page ? 'active' : ''}">${i + 1}</button>`;
            }
            pag.innerHTML = pagHtml;
        }
        window[section + 'Config'] = config;
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}">
            <div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${escapeHtml(err.message)}</p></div>
        </td></tr>`;
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
            { label: 'CPF', key: 'cpf', render: i => escapeHtml(Masks.cpf(String(i.cpf || ''))) },
            { label: 'Telefone', key: 'telefone', render: i => escapeHtml(Masks.telefone(String(i.telefone || ''))) },
        ],
        formFields: async () => [
            { name: 'nome', label: 'Nome', required: true, placeholder: 'Nome completo', validators: ['required'] },
            { name: 'cpf', label: 'CPF', required: true, mask: 'cpf', placeholder: '000.000.000-00', hint: 'Formato: 000.000.000-00', validators: ['required', 'cpf'] },
            { name: 'telefone', label: 'Telefone', required: true, mask: 'telefone', placeholder: '(00) 00000-0000', hint: 'Formato: (00) 00000-0000', validators: ['required', 'telefone'] },
        ],
        cleanData: d => { d.cpf = d.cpf.replace(/\D/g,''); d.telefone = d.telefone.replace(/\D/g,''); },
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
            const clienteList = (clientes.content || clientes);
            return [
                { name: 'placa', label: 'Placa', required: true, mask: 'placa', placeholder: 'ABC-1234', hint: 'Formato: ABC-1234 ou ABC1D23', validators: ['required', 'placa'] },
                { name: 'codModelo', label: 'Modelo', type: 'select', required: true, options: modelos.map(m => ({ value: m.codModelo, label: m.nome })), emptyMsg: 'Nenhum modelo cadastrado' },
                { name: 'ano', label: 'Ano', type: 'number', required: true, placeholder: new Date().getFullYear().toString(), validators: ['required', 'year'], hint: '1900 - ' + (new Date().getFullYear()+1) },
                { name: 'codCliente', label: 'Cliente', type: 'select', required: true, options: clienteList.map(c => ({ value: c.codCliente, label: c.nome })), emptyMsg: 'Nenhum cliente cadastrado.', emptyLink: 'clientes', emptyLinkLabel: 'Cadastrar cliente' },
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
                { name: 'nome', label: 'Nome', required: true, placeholder: 'Nome do mecânico', validators: ['required'] },
                { name: 'codEspecialidade', label: 'Especialidade', type: 'select', required: true, options: esp.map(e => ({ value: e.codEspecialidade, label: e.nome })), emptyMsg: 'Nenhuma especialidade cadastrada' },
                { name: 'comissaoPercentual', label: 'Comissão (%)', type: 'number', step: '0.01', required: true, placeholder: '10.00', validators: ['required', 'positiveNumber'], hint: 'Percentual de comissão (ex: 10.50)' },
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
            const fornList = (forns.content || forns);
            return [
                { name: 'nome', label: 'Nome', required: true, placeholder: 'Nome da peça', validators: ['required'] },
                { name: 'precoVenda', label: 'Preço Venda (R$)', mask: 'money', required: true, placeholder: 'R$ 0,00', validators: ['required'], hint: 'Valor em reais' },
                { name: 'estoqueMinimo', label: 'Estoque Mínimo', mask: 'integer', type: 'text', required: true, placeholder: '0', validators: ['required', 'positiveNumber'] },
                { name: 'codCategoria', label: 'Categoria', type: 'select', required: true, options: cats.map(c => ({ value: c.codCategoria, label: c.nome })), emptyMsg: 'Nenhuma categoria cadastrada' },
                { name: 'codFornecedor', label: 'Fornecedor', type: 'select', required: true, options: fornList.map(f => ({ value: f.codFornecedor, label: f.razaoSocial })), emptyMsg: 'Nenhum fornecedor cadastrado.', emptyLink: 'fornecedores', emptyLinkLabel: 'Cadastrar fornecedor' },
            ];
        },
        cleanData: d => {
            d.precoVenda = d.precoVenda.replace(/[R$\s.]/g,'').replace(',','.');
            d.estoqueMinimo = d.estoqueMinimo.replace(/\D/g,'');
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
            { label: 'CNPJ', key: 'cnpj', render: i => escapeHtml(Masks.cnpj(String(i.cnpj || ''))) },
            { label: 'Cidade', key: 'cidade' },
        ],
        formFields: async () => {
            const cidades = await api('/api/cidades');
            return [
                { name: 'razaoSocial', label: 'Razão Social', required: true, placeholder: 'Nome da empresa', validators: ['required'] },
                { name: 'cnpj', label: 'CNPJ', required: true, mask: 'cnpj', placeholder: '00.000.000/0000-00', hint: 'Formato: 00.000.000/0000-00', validators: ['required', 'cnpj'] },
                { name: 'codCidade', label: 'Cidade', type: 'select', required: true, options: cidades.map(c => ({ value: c.codCidade, label: c.nome + '/' + c.uf })), emptyMsg: 'Nenhuma cidade cadastrada' },
            ];
        },
        cleanData: d => { d.cnpj = d.cnpj.replace(/\D/g,''); },
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
            { label: 'Status', key: 'status', render: i => {
                const s = String(i.status || '');
                const cls = s === 'Finalizado' ? 'badge-success' : s === 'Cancelado' ? 'badge-danger' : 'badge-warning';
                return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
            }},
        ],
        formFields: async () => {
            const veiculos = await api('/api/veiculos?size=100');
            const statuses = await api('/api/status');
            const veicList = (veiculos.content || veiculos);
            return [
                { name: 'dataEntrada', label: 'Data Entrada', type: 'date', hint: 'Data de entrada do veículo' },
                { name: 'kmAtual', label: 'KM Atual', mask: 'integer', type: 'text', placeholder: '0', hint: 'Quilometragem atual do veículo' },
                { name: 'codVeiculo', label: 'Veículo', type: 'select', required: true, options: veicList.map(v => ({ value: v.codVeiculo, label: v.placa + ' - ' + v.modelo })), emptyMsg: 'Nenhum veículo cadastrado.', emptyLink: 'veiculos', emptyLinkLabel: 'Cadastrar veículo' },
                { name: 'codStatus', label: 'Status', type: 'select', required: true, options: statuses.map(s => ({ value: s.codStatus, label: s.descricao })), emptyMsg: 'Nenhum status disponível' },
            ];
        },
        cleanData: d => { if (d.kmAtual) d.kmAtual = d.kmAtual.replace(/\D/g,''); },
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
            const ordList = (ordens.content || ordens);
            return [
                { name: 'valor', label: 'Valor (R$)', mask: 'money', required: true, placeholder: 'R$ 0,00', validators: ['required'], hint: 'Valor do pagamento' },
                { name: 'data', label: 'Data', type: 'date', hint: 'Data do pagamento' },
                { name: 'codOrdem', label: 'Ordem de Serviço', type: 'select', required: true, options: ordList.map(o => ({ value: o.codOrdem, label: '#' + o.codOrdem + ' - ' + (o.veiculo || '') })), emptyMsg: 'Nenhuma OS cadastrada.', emptyLink: 'ordens', emptyLinkLabel: 'Cadastrar OS' },
                { name: 'codForma', label: 'Forma de Pagamento', type: 'select', required: true, options: formas.map(f => ({ value: f.codForma, label: f.nome })), emptyMsg: 'Nenhuma forma de pagamento disponível' },
            ];
        },
        cleanData: d => {
            d.valor = d.valor.replace(/[R$\s.]/g,'').replace(',','.');
        },
        prepareData: d => { d.valor = Number(d.valor); d.codOrdem = Number(d.codOrdem); d.codForma = Number(d.codForma); d.data = d.data || null; },
    };
}

// ============ INIT ============
initTheme();
if (token) showApp(); else document.getElementById('loginScreen').classList.remove('hidden');
