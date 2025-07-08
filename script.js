/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão 4.4 - Correção de Navegação e Lógica de Ações
 */

// ATENÇÃO: Verifique se este é o URL da sua última implantação funcional.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3EWGWrdkfzwkc7uYoVVh4DCH4KGLiCBrYwO_GQfiTWbodXY3FwUs_lYgPSqNHUJzjZw/exec'; // Use o seu URL de implantação mais recente

let currentUser = null;

// ==================== INICIALIZAÇÃO ====================
window.onload = function() {
    console.log('Sistema CDR Sul iniciando...');
    const savedUser = localStorage.getItem('cdr_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
        } catch (error) {
            localStorage.removeItem('cdr_user');
            showLogin();
        }
    } else {
        showLogin();
    }
};

// ==================== NAVEGAÇÃO ENTRE TELAS ====================
function showLogin() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    if (!currentUser) return;
    
    document.getElementById('userName').textContent = `Bem-vindo, ${currentUser.name}!`;

    const adminTab = document.getElementById('adminTab');
    if (adminTab) {
        adminTab.style.display = currentUser.isAdmin ? 'block' : 'none';
    }
}

// ==================== AUTENTICAÇÃO ====================
async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return alert('Por favor, preencha todos os campos.');
    
    try {
        const response = await makeRequest('login', { email, password });
        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            showDashboard();
        } else {
            alert(response.message);
        }
    } catch (e) {
        alert(`Erro de conexão: ${e.message}`);
    }
}

// (As outras funções como register, logout, etc., devem ser mantidas aqui)

// ==================== COMUNICAÇÃO COM BACKEND ====================
async function makeRequest(action, data) {
    const requestData = { action, ...data };
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestData),
            mode: 'cors'
        });
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Erro em makeRequest:", error);
        throw error;
    }
}
