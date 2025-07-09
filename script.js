// ==================== CONFIGURAÇÕES ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec';

const CONFIG = { version: '2.7', debug: true };

let currentUser = null;
let isLoggedIn  = false;

// ==================== UTILITÁRIOS ======================
const debugLog = (msg, data = null) =>
  CONFIG.debug && console.log(`[CDR DEBUG] ${msg}`, data ?? '');

// mostra mensagens rápidas
const showMessage = (msg, type = 'info') => {
  const area = document.getElementById('messageArea');
  if (!area) return;
  area.innerHTML = `<div class="message message-${type}">${msg}</div>`;
  setTimeout(() => (area.innerHTML = ''), 5_000);
};

// ================ REQUISIÇÃO (JSON / FORM) ===============
async function sendToScript(action, data = {}) {
  debugLog(`Enviando ação: ${action}`);

  // ① Se o chamador já mandou um FormData (ex.: upload de arquivos)…
  if (data instanceof FormData) {
    data.append('action', action);
    return fetchWithHandling(data);            // sem cabeçalhos extras
  }

  // ② Caso contrário, mandamos JSON como antes
  const payload = { action, ...data };
  return fetchWithHandling(JSON.stringify(payload), {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
}

// helper comum
async function fetchWithHandling(body, extraOpts = {}) {
  try {
    const res  = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      body,
      ...extraOpts
    });
    const json = await res.json();
    debugLog('Resposta recebida', json);
    return json;
  } catch (err) {
    console.error('Erro na requisição', err);
    return { success: false, message: 'Erro de conexão com o servidor' };
  }
}

// ==================== LOGIN / REGISTRO ===================
async function login() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password)
    return showMessage('Preencha todos os campos.', 'error');

  document.getElementById('loginBtn').disabled = true;
  const result = await sendToScript('login', { email, password });

  if (result.success) {
    currentUser = result.user;
    isLoggedIn  = true;
    localStorage.setItem('cdrUser', JSON.stringify(currentUser)); // mantém sessão
    showDashboard();
    showMessage('Login realizado com sucesso!', 'success');
  } else {
    showMessage(result.message || 'Erro ao fazer login', 'error');
  }
  document.getElementById('loginBtn').disabled = false;
}

async function register() {
  const name        = document.getElementById('regName').value.trim();
  const email       = document.getElementById('regEmail').value.trim();
  const institution = document.getElementById('regInstitution').value.trim();
  const project     = document.getElementById('regProject').value.trim();
  const password    = document.getElementById('regPassword').value.trim();

  if (![name,email,institution,project,password].every(Boolean))
    return showMessage('Preencha todos os campos.', 'error');

  document.getElementById('registerBtn').disabled = true;
  const result = await sendToScript('register',
                  { name, email, institution, project, password });

  if (result.success) {
    showMessage('Cadastro realizado com sucesso!', 'success');
    setTimeout(showLogin, 1500);
  } else {
    showMessage(result.message || 'Erro no cadastro', 'error');
  }
  document.getElementById('registerBtn').disabled = false;
}

// ======================= UI ==============================
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
  document.getElementById('userName').textContent  = currentUser.name;
}

function logout() {
  currentUser = null;
  isLoggedIn  = false;
  localStorage.removeItem('cdrUser');
  showLogin();
  showMessage('Logout realizado com sucesso.', 'info');
}

// ===================== INIT ==============================
document.addEventListener('DOMContentLoaded', () => {
  // restaura sessão
  const saved = localStorage.getItem('cdrUser');
  if (saved) { currentUser = JSON.parse(saved); isLoggedIn = true; showDashboard(); }

  document.getElementById('loginForm'   ).addEventListener('submit', e => { e.preventDefault(); login(); });
  document.getElementById('registerForm').addEventListener('submit', e => { e.preventDefault(); register(); });
  document.getElementById('logoutBtn'   ).addEventListener('click', logout);
  document.getElementById('showRegisterLink').addEventListener('click', showRegister);
  document.getElementById('showLoginLink'   ).addEventListener('click', showLogin);
});
