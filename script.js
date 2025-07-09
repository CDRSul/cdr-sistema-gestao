// ==================== CONFIGURAÇÕES ====================

// URL do Google Apps Script (vigente)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec';

const CONFIG = {
    version: '2.5 - CORS Corrigido',
    debug: true
};

let currentUser = null;
let isLoggedIn = false;

// ==================== UTILITÁRIOS ====================

function debugLog(message, data = null) {
    if (CONFIG.debug) console.log(`[CDR DEBUG] ${message}`, data || '');
}

function showMessage(msg, type = 'info') {
    const area = document.getElementById('messageArea');
    if (!area) return;
    area.innerHTML = `<div class="message message-${type}">${msg}</div>`;
    setTimeout(() => (area.innerHTML = ''), 5000);
}

// ==================== REQUISIÇÃO SEGURA ====================

async function sendToScript(action, data = {}) {
    debugLog(`Enviando ação: ${action}`);

    const payload = {
        action,
        ...data
    };

    try {
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        const json = await res.json();
        debugLog('Resposta recebida:', json);
        return json;
    } catch (err) {
        console.error('Erro na requisição:', err);
        return { success: false, message: 'Erro de conexão com o servidor' };
    }
}

// ==================== LOGIN E REGISTRO ====================

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        showMessage('Preencha todos os campos.', 'error');
        return;
    }

    document.getElementById('loginBtn').disabled = true;

    const result = await sendToScript('login', { email, password });

    if (result.success) {
        currentUser = result.user;
        isLoggedIn = true;
        showDashboard();
        showMessage('Login realizado com sucesso!', 'success');
    } else {
        showMessage(result.message || 'Erro ao fazer login', 'error');
    }

    document.getElementById('loginBtn').disabled = false;
}

async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const institution = document.getElementById('regInstitution').value.trim();
    const project = document.getElementById('regProject').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (!name || !email || !institution || !project || !password) {
        showMessage('Preencha todos os campos.', 'error');
        return;
    }

    document.getElementById('registerBtn').disabled = true;

    const result = await sendToScript('register', {
        name,
        email,
        institution,
        project,
        password
    });

    if (result.success) {
        showMessage('Cadastro realizado com sucesso!', 'success');
        setTimeout(showLogin, 1500);
    } else {
        showMessage(result.message || 'Erro no cadastro', 'error');
    }

    document.getElementById('registerBtn').disabled = false;
}

// ==================== INTERFACE ====================

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userName').textContent = currentUser.name;
}

function logout() {
    currentUser = null;
    isLoggedIn = false;
    showLogin();
    showMessage('Logout realizado com sucesso.', 'info');
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        login();
    });

    document.getElementById('registerForm').addEventListener('submit', e => {
        e.preventDefault();
        register();
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('showRegisterLink').addEventListener('click', showRegister);
    document.getElementById('showLoginLink').addEventListener('click', showLogin);
});
