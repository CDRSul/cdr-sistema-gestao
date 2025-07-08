/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão Final Completa
 */

// ==================== CONFIGURAÇÕES ====================
// ATENÇÃO: Substitua o link abaixo pelo URL da SUA NOVA IMPLANTAÇÃO!
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw46D1ZcV0IohzFTq4Zwg3CagxeMW0_oKZ5gadsxAKoQXQwUiUUiGwC1QP0nX_TdFkG/exec';

let currentUser = null;

// ==================== INICIALIZAÇÃO ====================
window.onload = () => {
  const savedUser = localStorage.getItem('cdr_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showDashboard();
  } else {
    showLogin();
  }
};

// ==================== NAVEGAÇÃO ====================
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
  // Adicione aqui a lógica para mostrar/esconder a aba de admin, se houver
}

// ==================== AUTENTICAÇÃO ====================
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('Preencha e-mail e senha.');

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

async function register() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  // Adicione aqui a captura de outros campos como instituição e projeto
  // const institution = document.getElementById('regInstitution').value.trim();

  if (!name || !email || !password) return alert('Preencha nome, e-mail e senha.');

  try {
    const response = await makeRequest('register', { name, email, password /*, institution, project */ });
    if (response.success) {
      alert('Usuário cadastrado com sucesso! Faça o login.');
      showLogin();
    } else {
      alert(response.message);
    }
  } catch (e) {
    alert(`Erro no cadastro: ${e.message}`);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('cdr_user');
  showLogin();
}

// ==================== AÇÕES DO SISTEMA ====================
// Adapte as funções abaixo conforme os IDs do seu HTML
async function submitReport() {
    const reportType = document.getElementById('reportType').value;
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    const fileInput = document.getElementById('reportFile');

    let fileData = {};
    if (fileInput.files.length > 0) {
        fileData = {
            name: fileInput.files[0].name,
            data: await fileToBase64(fileInput.files[0])
        }
    }
    
    try {
        const response = await makeRequest('submitReport', { email: currentUser.email, reportType, title, description, fileName: fileData.name, fileData: fileData.data });
        alert(response.message);
        if(response.success) { /* Limpar formulário */ }
    } catch (e) {
        alert(`Erro ao enviar relatório: ${e.message}`);
    }
}


// ==================== UTILITÁRIOS ====================
async function makeRequest(action, data) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...data }),
    mode: 'cors'
  });
  if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
  return await response.json();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}
