/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão 2.1 - Com depuração de cadastro
 */

// ==================== CONFIGURAÇÕES ====================

// URL do Google Apps Script
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
    if (!isValidEmail(email)) {
        showMessage('Por favor, digite um e-mail válido', 'error');
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
        console.error('ERRO DETALHADO NO LOGIN:', error);
        showMessage(`Erro de Conexão: ${error.message}. Verifique o console (F12).`, 'error');
    }
}

// Função de cadastro
async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const institution = document.getElementById('regInstitution').value.trim();
    const project = document.getElementById('regProject').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    // ================== LINHA DE DEPURAÇÃO ADICION
