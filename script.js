/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão Final
 */

// ATENÇÃO: Substitua o link abaixo pelo URL da SUA NOVA IMPLANTAÇÃO do Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw46D1ZcV0IohzFTq4Zwg3CagxeMW0_oKZ5gadsxAKoQXQwUiUUiGwC1QP0nX_TdFkG/exec';

let currentUser = null;

window.onload = function() {
    console.log('Sistema CDR Sul iniciando...');
    const savedUser = localStorage.getItem('cdr_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
            loadDashboardData();
        } catch (error) {
            localStorage.removeItem('cdr_user');
        }
    }
};

// --- FUNÇÕES DE AUTENTICAÇÃO ---
async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return showMessage('Por favor, preencha todos os campos.', 'error');
    
    try {
        const response = await makeRequest('login', { email, password });
        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            showDashboard();
            loadDashboardData();
        } else {
            showMessage(response.message, 'error');
        }
    } catch (e) {
        showMessage(`Erro de conexão: ${e.message}`, 'error');
    }
}

async function register() {
    // Implemente a lógica de cadastro conforme os IDs do seu HTML
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    // ... colete outros campos ...
    const password = document.getElementById('regPassword').value.trim();

    if (!name || !email || !password) return showMessage('Preencha os campos obrigatórios.', 'error');

    try {
        const response = await makeRequest('register', { name, email, password /*, ...outros campos*/ });
        if(response.success){
            showMessage('Usuário cadastrado com sucesso!', 'success');
            showLogin();
        } else {
            showMessage(response.message, 'error');
        }
    } catch(e) {
        showMessage(`Erro ao cadastrar: ${e.message}`, 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('cdr_user');
    showLogin();
}

// --- LÓGICA DO PAINEL (DASHBOARD) ---
function showLogin() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    document.getElementById('userName').textContent = `Bem-vindo, ${currentUser.name}!`;

    // Mostra ou esconde a aba de Admin
    const adminTab = document.getElementById('adminTab');
    if (currentUser.isAdmin) {
        adminTab.style.display = 'block';
    } else {
        adminTab.style.display = 'none';
    }
}

async function loadDashboardData() {
    if (!currentUser) return;
    // Lógica para carregar dados do usuário comum ou do admin
    if(currentUser.isAdmin) {
        // Ex: const adminData = await makeRequest('getAdminData', { email: currentUser.email });
    } else {
        // Ex: const userData = await makeRequest('getUserData', { email: currentUser.email });
    }
}


// --- FUNÇÃO DE COMUNICAÇÃO (NÃO MEXER) ---
async function makeRequest(action, data) {
    const requestData = { action, ...data };
    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestData),
        mode: 'cors'
    });
    if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
    return await response.json();
}

// --- FUNÇÃO DE MENSAGEM ---
function showMessage(message, type) {
    // ... (sua lógica de showMessage)
    alert(`${type.toUpperCase()}: ${message}`);
}
