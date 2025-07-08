/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão Final Completa
 */

// ATENÇÃO: Cole aqui o URL da sua implantação final do Google Apps Script!
const APPS_SCRIPT_URL = 'COLE_AQUI_O_URL_DA_SUA_IMPLANTAÇÃO';

let currentUser = null;

// ==================== INICIALIZAÇÃO ====================
window.onload = () => {
  const savedUser = localStorage.getItem('cdr_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showDashboard();
    } catch {
      localStorage.removeItem('cdr_user');
      showLogin();
    }
  } else {
    showLogin();
  }
};

// ==================== NAVEGAÇÃO ====================
function showLogin() {
  document.getElementById('authContainer').style.display = 'block';
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('registerScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
}

function showRegister() {
  document.getElementById('authContainer').style.display = 'block';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registerScreen').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  if (!currentUser) return;
  
  document.getElementById('userName').textContent = `Bem-vindo, ${currentUser.name}!`;
  document.getElementById('userInfo').textContent = `${currentUser.institution || ''} - ${currentUser.project || ''}`;
  
  const adminTab = document.getElementById('adminTab');
  if (adminTab) {
    adminTab.style.display = currentUser.isAdmin ? 'flex' : 'none';
  }
  // Ativa a primeira aba por padrão
  showTab({ currentTarget: document.querySelector('.tab')}, 'overview');
}

function showTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabName + 'Content').style.display = 'block';
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// ==================== AUTENTICAÇÃO ====================
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) return showMessage('Preencha e-mail e senha.', 'error');
  
  try {
    const response = await makeRequest('login', { email, password });
    if (response.success) {
      currentUser = response.user;
      localStorage.setItem('cdr_user', JSON.stringify(currentUser));
      showDashboard();
    } else {
      showMessage(response.message, 'error');
    }
  } catch (e) {
    showMessage(`Erro de conexão: ${e.message}`, 'error');
  }
}

async function register() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const institution = document.getElementById('regInstitution').value.trim();
  const project = document.getElementById('regProject').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password) return showMessage('Nome, e-mail e senha são obrigatórios.', 'error');

  try {
    const response = await makeRequest('register', { name, email, institution, project, password });
    if (response.success) {
      showMessage('Usuário cadastrado! Por favor, faça o login.', 'success');
      showLogin();
    } else {
      showMessage(response.message, 'error');
    }
  } catch (e) { showMessage(`Erro no cadastro: ${e.message}`, 'error'); }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('cdr_user');
  showLogin();
}

// ==================== COMUNICAÇÃO COM BACKEND ====================
async function makeRequest(action, data = {}) {
  showMessage('Processando...', 'info');
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Correção de CORS
      body: JSON.stringify({ action, ...data }),
      mode: 'cors'
    });
    if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
    const result = await response.json();
    document.getElementById('message-area').innerHTML = ''; // Limpa a mensagem "Processando"
    return result;
  } catch (error) {
    document.getElementById('message-area').innerHTML = '';
    throw error;
  }
}

// ==================== UTILITÁRIOS ====================
function showMessage(message, type) {
  const container = document.getElementById('message-area');
  container.innerHTML = `<div class="message message-${type}">${message}</div>`;
  setTimeout(() => { container.innerHTML = ''; }, 5000);
}

// Adicione aqui as funções para enviar relatórios, atividades, etc.
// Elas devem chamar a função makeRequest com a ação correta.
