// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec',
    VERSION: '3.1 - CORREÇÃO JSON + TRATAMENTO ROBUSTO',
    DEBUG: true
};

// ==================== ESTADO GLOBAL ====================
let currentUser = null;
let isLoggedIn = false;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log(`[CDR Sul] Sistema CDR Sul iniciando - Versão ${CONFIG.VERSION}`);
    
    // Verificar sessão salva
    checkSavedSession();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Testar conectividade
    testConnectivity();
});

function setupEventListeners() {
    try {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Formulário de cadastro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
        
        // Formulário de relatório
        const reportForm = document.getElementById('reportForm');
        if (reportForm) {
            reportForm.addEventListener('submit', handleSubmitReport);
        }
        
        // Formulário de atividade
        const activityForm = document.getElementById('activityForm');
        if (activityForm) {
            activityForm.addEventListener('submit', handleSubmitActivity);
        }
        
        // Formulário de arquivos
        const filesForm = document.getElementById('filesForm');
        if (filesForm) {
            filesForm.addEventListener('submit', handleUploadFiles);
        }
        
        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Links de navegação
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', handleNavigation);
        });
        
        // Link de cadastro
        const registerLink = document.getElementById('registerLink');
        if (registerLink) {
            registerLink.addEventListener('click', showRegisterForm);
        }
        
        // Link de voltar ao login
        const backToLoginLink = document.getElementById('backToLoginLink');
        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', showLoginForm);
        }
        
        console.log('[CDR Sul] Event listeners configurados');
    } catch (error) {
        console.error('[CDR Sul] Erro ao configurar event listeners:', error);
    }
}

// ==================== COMUNICAÇÃO COM GOOGLE APPS SCRIPT ====================

async function makeRequest(action, data = {}, files = null) {
    try {
        console.log(`[CDR Sul] Enviando ação: ${action}`);
        console.log(`[CDR Sul] Dados:`, data);
        
        if (!CONFIG.GOOGLE_APPS_SCRIPT_URL || CONFIG.GOOGLE_APPS_SCRIPT_URL === 'INSERIR_URL_AQUI') {
            throw new Error('URL do Google Apps Script não configurada');
        }
        
        // Preparar dados
        const formData = new FormData();
        formData.append('action', action);
        
        // Adicionar dados
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        
        // Adicionar arquivos se existirem
        if (files) {
            if (files instanceof FileList) {
                for (let i = 0; i < files.length; i++) {
                    formData.append(`file_${i}`, files[i]);
                }
            } else if (files instanceof File) {
                formData.append('file_0', files);
            }
        }
        
        // Fazer requisição
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'cors'
        });
        
        console.log(`[CDR Sul] Status da resposta: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // ==================== TRATAMENTO ROBUSTO DE JSON ====================
        let result;
        const responseText = await response.text();
        
        console.log(`[CDR Sul] Resposta bruta:`, responseText);
        
        try {
            // Tentar fazer parse do JSON
            result = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('[CDR Sul] Erro ao fazer parse do JSON:', jsonError);
            console.error('[CDR Sul] Resposta que causou erro:', responseText);
            
            // Se não conseguir fazer parse, criar resposta de erro
            result = {
                success: false,
                error: `Resposta inválida do servidor: ${responseText.substring(0, 100)}...`,
                debug: {
                    originalError: jsonError.message,
                    responseText: responseText
                }
            };
        }
        
        console.log(`[CDR Sul] Resposta processada:`, result);
        
        return result;
        
    } catch (error) {
        console.error(`[CDR Sul] Erro na requisição:`, error);
        
        return {
            success: false,
            error: `Erro de conexão: ${error.message}`,
            debug: {
                action: action,
                url: CONFIG.GOOGLE_APPS_SCRIPT_URL,
                originalError: error.toString()
            }
        };
    }
}

async function testConnectivity() {
    try {
        console.log('[CDR Sul] Testando conectividade...');
        
        if (!CONFIG.GOOGLE_APPS_SCRIPT_URL || CONFIG.GOOGLE_APPS_SCRIPT_URL === 'INSERIR_URL_AQUI') {
            console.warn('[CDR Sul] URL do Google Apps Script não configurada');
            return;
        }
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const result = await response.text();
            try {
                const jsonResult = JSON.parse(result);
                console.log('[CDR Sul] Conectividade OK:', jsonResult);
            } catch (e) {
                console.log('[CDR Sul] Conectividade OK (resposta não-JSON):', result);
            }
        } else {
            console.warn('[CDR Sul] Problema de conectividade:', response.status);
        }
    } catch (error) {
        console.warn('[CDR Sul] Erro de conectividade:', error.message);
    }
}

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }
        
        showMessage('Fazendo login...', 'info');
        
        const result = await makeRequest('login', {
            email: email,
            password: password
        });
        
        if (result.success) {
            currentUser = result.data;
            isLoggedIn = true;
            
            // Salvar sessão
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            
            showMessage(result.message || 'Login realizado com sucesso!', 'success');
            showDashboard();
        } else {
            showMessage(result.error || 'Erro no login', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro no login:', error);
        showMessage('Erro interno no login', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value;
        const institution = document.getElementById('registerInstitution').value;
        
        if (!email || !password || !name) {
            showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        showMessage('Criando conta...', 'info');
        
        const result = await makeRequest('register', {
            email: email,
            password: password,
            name: name,
            institution: institution
        });
        
        if (result.success) {
            showMessage(result.message || 'Conta criada com sucesso!', 'success');
            showLoginForm();
            
            // Preencher email no login
            document.getElementById('email').value = email;
        } else {
            showMessage(result.error || 'Erro no cadastro', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro no cadastro:', error);
        showMessage('Erro interno no cadastro', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('cdr_user');
    showLoginForm();
    showMessage('Logout realizado com sucesso!', 'success');
}

function checkSavedSession() {
    try {
        const savedUser = localStorage.getItem('cdr_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            isLoggedIn = true;
            showDashboard();
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao verificar sessão salva:', error);
        localStorage.removeItem('cdr_user');
    }
}

// ==================== FUNÇÕES DE ENVIO ====================

async function handleSubmitReport(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        const data = {
            email: currentUser.email,
            reportType: formData.get('reportType'),
            title: formData.get('title'),
            description: formData.get('description')
        };
        
        const fileInput = form.querySelector('input[type="file"]');
        const files = fileInput ? fileInput.files : null;
        
        showMessage('Enviando relatório...', 'info');
        
        const result = await makeRequest('submitReport', data, files);
        
        if (result.success) {
            showMessage(result.message || 'Relatório enviado com sucesso!', 'success');
            form.reset();
            loadUserStats(); // Atualizar estatísticas
        } else {
            showMessage(result.error || 'Erro ao enviar relatório', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar relatório:', error);
        showMessage('Erro interno ao enviar relatório', 'error');
    }
}

async function handleSubmitActivity(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        const data = {
            email: currentUser.email,
            activityType: formData.get('activityType'),
            title: formData.get('title'),
            description: formData.get('description'),
            location: formData.get('location'),
            participants: formData.get('participants')
        };
        
        const fileInput = form.querySelector('input[type="file"]');
        const files = fileInput ? fileInput.files : null;
        
        showMessage('Cadastrando atividade...', 'info');
        
        const result = await makeRequest('submitActivity', data, files);
        
        if (result.success) {
            showMessage(result.message || 'Atividade cadastrada com sucesso!', 'success');
            form.reset();
            loadUserStats(); // Atualizar estatísticas
        } else {
            showMessage(result.error || 'Erro ao cadastrar atividade', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao cadastrar atividade:', error);
        showMessage('Erro interno ao cadastrar atividade', 'error');
    }
}

async function handleUploadFiles(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        const data = {
            email: currentUser.email,
            category: formData.get('category'),
            description: formData.get('description')
        };
        
        const fileInput = form.querySelector('input[type="file"]');
        const files = fileInput ? fileInput.files : null;
        
        if (!files || files.length === 0) {
            showMessage('Por favor, selecione pelo menos um arquivo', 'error');
            return;
        }
        
        showMessage('Enviando arquivos...', 'info');
        
        const result = await makeRequest('uploadFiles', data, files);
        
        if (result.success) {
            showMessage(result.message || 'Arquivos enviados com sucesso!', 'success');
            form.reset();
            loadUserStats(); // Atualizar estatísticas
        } else {
            showMessage(result.error || 'Erro ao enviar arquivos', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar arquivos:', error);
        showMessage('Erro interno ao enviar arquivos', 'error');
    }
}

// ==================== FUNÇÕES DE CARREGAMENTO DE DADOS ====================

async function loadAdminData() {
    try {
        if (!currentUser || !currentUser.isAdmin) {
            return;
        }
        
        console.log('[CDR Sul] Carregando dados administrativos...');
        
        const result = await makeRequest('getAdminData', {
            email: currentUser.email
        });
        
        if (result.success && result.data) {
            updateAdminDashboard(result.data);
        } else {
            console.error('[CDR Sul] Erro ao carregar dados admin:', result.error);
            showAdminError();
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar dados admin:', error);
        showAdminError();
    }
}

async function loadUserStats() {
    try {
        if (!currentUser) {
            return;
        }
        
        console.log('[CDR Sul] Carregando estatísticas do usuário...');
        
        const result = await makeRequest('getUserStats', {
            email: currentUser.email
        });
        
        if (result.success && result.data) {
            updateUserDashboard(result.data);
        } else {
            console.error('[CDR Sul] Erro ao carregar stats:', result.error);
            showUserStatsError();
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar stats:', error);
        showUserStatsError();
    }
}

// ==================== FUNÇÕES DE INTERFACE ====================

function showLoginForm() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    // Atualizar informações do usuário
    updateUserInfo();
    
    // Mostrar aba inicial
    showTab('visao-geral');
    
    // Carregar dados
    if (currentUser.isAdmin) {
        loadAdminData();
    }
    loadUserStats();
}

function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const adminBadge = document.getElementById('adminBadge');
    const adminTab = document.getElementById('adminTab');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.name || 'Usuário';
    }
    
    if (userEmailElement) {
        userEmailElement.textContent = currentUser.email || '';
    }
    
    if (adminBadge) {
        adminBadge.style.display = currentUser.isAdmin ? 'inline' : 'none';
    }
    
    if (adminTab) {
        adminTab.style.display = currentUser.isAdmin ? 'block' : 'none';
    }
}

function handleNavigation(event) {
    event.preventDefault();
    const tabId = event.target.getAttribute('data-tab');
    if (tabId) {
        showTab(tabId);
    }
}

function showTab(tabId) {
    // Esconder todas as abas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remover classe ativa de todos os links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Adicionar classe ativa ao link
    const activeLink = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Carregar dados específicos da aba
    if (tabId === 'admin' && currentUser && currentUser.isAdmin) {
        loadAdminData();
    } else if (tabId === 'visao-geral') {
        loadUserStats();
    }
}

function updateAdminDashboard(data) {
    try {
        // Atualizar contadores
        const totalUsersElement = document.getElementById('totalUsers');
        const totalReportsElement = document.getElementById('totalReports');
        const totalActivitiesElement = document.getElementById('totalActivities');
        
        if (totalUsersElement) {
            totalUsersElement.textContent = data.totalUsers || '0';
        }
        
        if (totalReportsElement) {
            totalReportsElement.textContent = data.totalReports || '0';
        }
        
        if (totalActivitiesElement) {
            totalActivitiesElement.textContent = data.totalActivities || '0';
        }
        
        // Atualizar listas
        updateRecentList('recentUsersList', data.recentUsers, 'usuário');
        updateRecentList('recentReportsList', data.recentReports, 'relatório');
        updateRecentList('recentActivitiesList', data.recentActivities, 'atividade');
        
        console.log('[CDR Sul] Dashboard admin atualizado');
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao atualizar dashboard admin:', error);
    }
}

function updateUserDashboard(data) {
    try {
        // Atualizar contadores do usuário
        const userReportsElement = document.getElementById('userReports');
        const userActivitiesElement = document.getElementById('userActivities');
        const userFilesElement = document.getElementById('userFiles');
        
        if (userReportsElement) {
            userReportsElement.textContent = data.reportsCount || '0';
        }
        
        if (userActivitiesElement) {
            userActivitiesElement.textContent = data.activitiesCount || '0';
        }
        
        if (userFilesElement) {
            userFilesElement.textContent = data.filesCount || '0';
        }
        
        // Atualizar listas do usuário
        updateRecentList('userRecentReports', data.recentReports, 'relatório');
        updateRecentList('userRecentActivities', data.recentActivities, 'atividade');
        
        console.log('[CDR Sul] Dashboard usuário atualizado');
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao atualizar dashboard usuário:', error);
    }
}

function updateRecentList(elementId, items, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (!items || items.length === 0) {
        element.innerHTML = `<p>Nenhum ${type} encontrado</p>`;
        return;
    }
    
    const html = items.map(item => {
        const date = new Date(item.date).toLocaleDateString('pt-BR');
        return `
            <div class="recent-item">
                <strong>${item.title || item.name}</strong>
                <small>${item.email || ''} - ${date}</small>
            </div>
        `;
    }).join('');
    
    element.innerHTML = html;
}

function showAdminError() {
    const elements = ['totalUsers', 'totalReports', 'totalActivities'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '-';
        }
    });
    
    const lists = ['recentUsersList', 'recentReportsList', 'recentActivitiesList'];
    lists.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<p>Erro ao carregar dados</p>';
        }
    });
}

function showUserStatsError() {
    const elements = ['userReports', 'userActivities', 'userFiles'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '-';
        }
    });
    
    const lists = ['userRecentReports', 'userRecentActivities'];
    lists.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<p>Erro ao carregar dados</p>';
        }
    });
}

function showMessage(message, type = 'info') {
    // Remover mensagens anteriores
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Adicionar estilos
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    // Cores por tipo
    switch (type) {
        case 'success':
            messageDiv.style.backgroundColor = '#28a745';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            messageDiv.style.backgroundColor = '#ffc107';
            messageDiv.style.color = '#000';
            break;
        default:
            messageDiv.style.backgroundColor = '#17a2b8';
    }
    
    // Adicionar ao DOM
    document.body.appendChild(messageDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
    
    console.log(`[CDR Sul] Mensagem (${type}): ${message}`);
}

// ==================== UTILITÁRIOS ====================

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR');
}

// ==================== LOGS E DEBUG ====================
console.log(`[CDR Sul] Script carregado - Versão ${CONFIG.VERSION}`);

// Expor funções globais para debug
if (CONFIG.DEBUG) {
    window.cdrDebug = {
        makeRequest,
        testConnectivity,
        currentUser: () => currentUser,
        config: CONFIG
    };
}
