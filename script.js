/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão 2.2 - Final e Corrigida
 */

// ==================== CONFIGURAÇÕES ====================

// ATENÇÃO: Verifique se este é o URL da sua última implantação funcional do Apps Script.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw46D1ZcV0IohzFTq4Zwg3CagxeMW0_oKZ5gadsxAKoQXQwUiUUiGwC1QP0nX_TdFkG/exec';

// Variáveis globais
let currentUser = null;
let userStats = { reports: 0, activities: 0, files: 0 };

// ==================== INICIALIZAÇÃO ====================

window.onload = function() {
    console.log('Sistema CDR Sul iniciando...');
    const savedUser = localStorage.getItem('cdr_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
            loadUserStats();
            showMessage('Sessão restaurada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao restaurar sessão:', error);
            localStorage.removeItem('cdr_user');
        }
    }
    setupFileUpload();
    const today = new Date().toISOString().split('T')[0];
    const activityDateField = document.getElementById('activityDate');
    if (activityDateField) {
        activityDateField.value = today;
    }
};

// ==================== AUTENTICAÇÃO ====================

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) {
        showMessage('Por favor, preencha e-mail e senha', 'error');
        return;
    }
    try {
        showMessage('Fazendo login...', 'info');
        const response = await makeRequest('login', { email, password });
        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            showDashboard();
            loadUserStats();
            showMessage('Login realizado com sucesso!', 'success');
        } else {
            showMessage(response.message || 'E-mail ou senha incorretos', 'error');
        }
    } catch (error) {
        // MANTIDO: Mensagem de erro detalhada para facilitar a depuração.
        console.error('ERRO DETALHADO NO LOGIN:', error);
        showMessage(`Erro de Conexão: ${error.message}. Verifique o console (F12).`, 'error');
    }
}

async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const institution = document.getElementById('regInstitution').value.trim();
    const project = document.getElementById('regProject').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    // ADICIONADO: Linha de depuração para verificar os dados de cadastro.
    console.log('Dados que serão enviados para o cadastro:', { name, email, institution, project, password });

    if (!name || !email || !institution || !project || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showMessage('Por favor, digite um e-mail válido', 'error');
        return;
    }
    try {
        showMessage('Cadastrando usuário...', 'info');
        const response = await makeRequest('register', { name, email, institution, project, password });
        if (response.success) {
            showMessage('Usuário cadastrado com sucesso! Faça login para continuar.', 'success');
            showLogin();
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
        } else {
            showMessage(response.message || 'Erro ao cadastrar usuário', 'error');
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

function logout() {
    currentUser = null;
    userStats = { reports: 0, activities: 0, files: 0 };
    localStorage.removeItem('cdr_user');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    showLogin();
    showMessage('Logout realizado com sucesso!', 'success');
}

// ==================== NAVEGAÇÃO ====================

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
    if (currentUser) {
        document.getElementById('userName').textContent = `Bem-vindo, ${currentUser.name}!`;
        const userInfo = document.getElementById('userInfo');
        if(userInfo) {
            userInfo.textContent = `${currentUser.institution || ''} - ${currentUser.project || ''}`;
        }
        const currentUserEl = document.getElementById('currentUser');
        if(currentUserEl) {
            currentUserEl.textContent = currentUser.email;
        }
        const currentProjectEl = document.getElementById('currentProject');
        if(currentProjectEl) {
            currentProjectEl.textContent = currentUser.project;
        }
        const adminTab = document.getElementById('adminTab');
        if (currentUser.isAdmin) {
            adminTab.classList.remove('hidden');
        } else {
            adminTab.classList.add('hidden');
        }
    }
}

function showTab(tabName) {
    const contents = ['overview', 'reports', 'activities', 'files', 'admin'];
    contents.forEach(content => {
        const element = document.getElementById(content + 'Content');
        if (element) {
            element.classList.add('hidden');
        }
    });
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    const selectedContent = document.getElementById(tabName + 'Content');
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
    if (tabName === 'admin' && currentUser && currentUser.isAdmin) {
        loadAdminData();
    }
}

// ==================== FUNÇÕES DE DADOS (RELATÓRIOS, ETC.) ====================
// (As funções como submitReport, submitActivity, etc., continuam aqui)

// Enviar relatório
async function submitReport() {
    if (!currentUser) return;
    const reportType = document.getElementById('reportType').value;
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    if (!reportType || !title || !description) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    try {
        showMessage('Enviando relatório...', 'info');
        const response = await makeRequest('submitReport', { email: currentUser.email, reportType, title, description });
        if (response.success) {
            showMessage('Relatório enviado com sucesso!', 'success');
            document.getElementById('reportTitle').value = '';
            document.getElementById('reportDescription').value = '';
            loadUserStats();
        } else {
            showMessage(response.message || 'Erro ao enviar relatório', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar relatório:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

// ==================== UTILITÁRIOS ====================

async function makeRequest(action, data) {
    const requestData = { action, ...data };
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            // CORREÇÃO CRÍTICA: O Content-Type foi alterado para 'text/plain' para evitar erros de CORS.
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(requestData),
            mode: 'cors'
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erro em makeRequest:", error);
        throw error;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(messageDiv, container.firstChild);
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// (As demais funções utilitárias e de setup como setupFileUpload, fileToBase64, etc., devem ser mantidas aqui)
function setupFileUpload() {
    const uploadArea = document.querySelector('.file-upload-area');
    if(uploadArea) {
        // ... Lógica do setupFileUpload ...
    }
}

async function loadUserStats() {
    if (!currentUser) return;
    try {
        const response = await makeRequest('getUserStats', { email: currentUser.email });
        if (response.success) {
            userStats = response.stats;
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

function updateStatsDisplay() {
    const statsReports = document.getElementById('statsReports');
    const statsActivities = document.getElementById('statsActivities');
    const statsFiles = document.getElementById('statsFiles');
    if (statsReports) statsReports.textContent = userStats.reports || 0;
    if (statsActivities) statsActivities.textContent = userStats.activities || 0;
    if (statsFiles) statsFiles.textContent = userStats.files || 0;
}

// (Código adicionado por Otacílio em 08/07/2025 às 16:22h)
