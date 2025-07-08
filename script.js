/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão Final Completa
 */

// ATENÇÃO: Cole aqui o URL da sua implantação final do Apps Script!
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw46D1ZcV0IohzFTq4Zwg3CagxeMW0_oKZ5gadsxAKoQXQwUiUUiGwC1QP0nX_TdFkG/exec';

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
  }
};

// ==================== NAVEGAÇÃO ====================
function showLogin() {
  document.getElementById('authContainer').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('registerScreen').style.display = 'none';
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
  if(adminTab) adminTab.style.display = currentUser.isAdmin ? 'flex' : 'none';

  showTab({ currentTarget: document.querySelector('.tab')}, 'overview');
}

function showTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    const content = document.getElementById(tabName + 'Content');
    if(content) content.style.display = 'block';
    
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
    } else { showMessage(response.message, 'error'); }
  } catch (e) { showMessage(`Erro de conexão: ${e.message}`, 'error'); }
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
    } else { showMessage(response.message, 'error'); }
  } catch (e) { showMessage(`Erro no cadastro: ${e.message}`, 'error'); }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('cdr_user');
  showLogin();
}

// ==================== AÇÕES DO DASHBOARD ====================
async function submitReport() {
    if(!currentUser) return showMessage('Faça login para continuar', 'error');
    const reportType = document.getElementById('reportType').value;
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    const fileInput = document.getElementById('reportFile');

    let filePayload = {};
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        filePayload = { fileName: file.name, fileData: await fileToBase64(file) };
    }
    
    try {
        const response = await makeRequest('submitReport', { email: currentUser.email, reportType, title, description, ...filePayload });
        showMessage(response.message, response.success ? 'success' : 'error');
    } catch (e) { showMessage(`Erro ao enviar relatório: ${e.message}`, 'error'); }
}

// (Adicione aqui as outras funções como submitActivity e uploadFiles)

// ==================== COMUNICAÇÃO E UTILITÁRIOS ====================
async function makeRequest(action, data = {}) {
  showMessage('Processando...', 'info');
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data }),
      mode: 'cors'
    });
    if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
    const result = await response.json();
    if(result.success) {
        showMessage(result.message, 'success');
    } else {
        showMessage(result.message, 'error');
    }
    return result;
  } catch (error) {
    showMessage(`Erro Crítico: ${error.message}`, 'error');
    throw error;
  }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

function showMessage(message, type) {
  const container = document.getElementById('message-area');
  if(!container) return; // Não faz nada se o container de mensagem não existir
  container.innerHTML = `<div class="message message-${type}">${message}</div>`;
  // Não remove a mensagem de erro automaticamente, apenas as de sucesso e info
  if(type !== 'error') {
      setTimeout(() => { container.innerHTML = ''; }, 5000);
  }
}
