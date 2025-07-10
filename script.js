/**
 * Sistema CDR Sul Tocantins - JavaScript Completo
 * Versão 2.8 - COMPLETO - Todas as funcionalidades
 * Data: 10/07/2025
 * Integração completa com Google Drive e Sheets
 * Correção do erro "Dados POST não encontrados"
 */

// ==================== CONFIGURAÇÕES ====================

// URL do Google Apps Script (MANTER A URL ATUAL)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec';

// Configurações do sistema
const CONFIG = {
    version: '2.8 - COMPLETO',
    debug: true,
    retryAttempts: 3,
    retryDelay: 2000
};

// ==================== VARIÁVEIS GLOBAIS ====================

let currentUser = null;
let isLoggedIn = false;
let currentTab = 'overview';

// ==================== FUNÇÕES DE UTILIDADE ====================

/**
 * Exibe mensagem para o usuário
 */
function showMessage(message, type = 'info') {
    // Criar modal de mensagem
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    
    messageBox.innerHTML = `
        <div style="color: ${colors[type] || colors.info}; font-size: 18px; margin-bottom: 15px;">
            ${message}
        </div>
        <button onclick="this.closest('.modal').remove()" style="
            background: ${colors[type] || colors.info};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        ">OK</button>
    `;
    
    modal.className = 'modal';
    modal.appendChild(messageBox);
    document.body.appendChild(modal);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 5000);
}

/**
 * Log de debug
 */
function debugLog(message, data = null) {
    if (CONFIG.debug) {
        console.log(`[CDR Sul] ${message}`, data || '');
    }
}

/**
 * Comunicação com Google Apps Script - Versão Robusta
 */
async function sendToScript(action, data = {}, files = null) {
    debugLog(`Enviando ação: ${action}`, data);
    
    try {
        let response;
        
        if (files && files.length > 0) {
            // Envio com arquivos usando FormData
            const formData = new FormData();
            formData.append('action', action);
            
            // Adicionar dados como campos do formulário
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            
            // Adicionar arquivos
            files.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });
            
            response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
        } else {
            // Envio JSON padrão
            const payload = {
                action: action,
                ...data,
                timestamp: new Date().toISOString()
            };

            response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        debugLog(`Resposta recebida:`, result);
        return result;

    } catch (error) {
        debugLog(`Erro na comunicação:`, error);
        throw error;
    }
}

// ==================== FUNÇÕES DE INTERFACE ====================

/**
 * Mostra tela de login
 */
function showLogin() {
    debugLog('Mostrando tela de login');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

/**
 * Mostra tela de cadastro
 */
function showRegister() {
    debugLog('Mostrando tela de cadastro');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

/**
 * Mostra dashboard
 */
function showDashboard() {
    debugLog('Mostrando dashboard');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Carregar dados iniciais
    loadUserData();
    if (currentUser && currentUser.isAdmin) {
        document.getElementById('adminTab').classList.remove('hidden');
    }
}

/**
 * Troca de abas
 */
function showTab(tabName) {
    debugLog(`Mostrando aba: ${tabName}`);
    currentTab = tabName;
    
    // Atualizar botões das abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Mostrar conteúdo da aba
    document.querySelectorAll('.tab-content > div').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}Content`).classList.remove('hidden');
    
    // Carregar dados específicos da aba
    switch (tabName) {
        case 'overview':
            loadUserData();
            break;
        case 'admin':
            if (currentUser && currentUser.isAdmin) {
                loadAdminData();
            }
            break;
    }
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Função de login
 */
async function login() {
    debugLog('Iniciando processo de login');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';
    
    try {
        const result = await sendToScript('login', { email, password });
        
        if (result.success) {
            currentUser = result.user;
            isLoggedIn = true;
            
            // Atualizar interface
            document.getElementById('userName').textContent = `Bem-vindo, ${currentUser.name}!`;
            document.getElementById('userInfo').textContent = `Projeto: ${currentUser.project}`;
            document.getElementById('currentUser').textContent = currentUser.email;
            document.getElementById('currentProject').textContent = currentUser.project || 'Não informado';
            
            showMessage('Login realizado com sucesso!', 'success');
            showDashboard();
            
        } else {
            showMessage(result.message || 'Erro ao fazer login', 'error');
        }
        
    } catch (error) {
        debugLog('Erro no login:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
    }
}

/**
 * Função de cadastro
 */
async function register() {
    debugLog('Iniciando processo de cadastro');
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const institution = document.getElementById('regInstitution').value.trim();
    const project = document.getElementById('regProject').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    
    if (!name || !email || !institution || !project || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    const registerBtn = document.getElementById('registerBtn');
    const originalText = registerBtn.textContent;
    registerBtn.disabled = true;
    registerBtn.textContent = 'Cadastrando...';
    
    try {
        const result = await sendToScript('register', {
            name, email, institution, project, password
        });
        
        if (result.success) {
            showMessage('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
            
            // Limpar formulário
            document.getElementById('registerForm').reset();
            
            // Voltar para login após 2 segundos
            setTimeout(() => {
                showLogin();
            }, 2000);
            
        } else {
            showMessage(result.message || 'Erro ao fazer cadastro', 'error');
        }
        
    } catch (error) {
        debugLog('Erro no cadastro:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = originalText;
    }
}

/**
 * Função de logout
 */
function logout() {
    debugLog('Fazendo logout');
    
    currentUser = null;
    isLoggedIn = false;
    
    // Limpar formulários
    document.getElementById('loginForm').reset();
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').reset();
    }
    
    showMessage('Logout realizado com sucesso!', 'info');
    showLogin();
}

// ==================== FUNÇÕES DE ENVIO ====================

/**
 * Enviar relatório
 */
async function submitReport() {
    debugLog('Enviando relatório');
    
    if (!currentUser) {
        showMessage('Você precisa estar logado para enviar relatórios', 'error');
        return;
    }
    
    const reportType = document.getElementById('reportType').value;
    const reportDate = document.getElementById('reportDate').value;
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    const fileInput = document.getElementById('reportFile');
    
    if (!reportType || !reportDate || !title || !description) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#reportsContent button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    try {
        const files = fileInput.files.length > 0 ? Array.from(fileInput.files) : null;
        
        const result = await sendToScript('submitReport', {
            email: currentUser.email,
            userEmail: currentUser.email,
            reportType: reportType,
            date: reportDate,
            reportDate: reportDate,
            title: title,
            description: description
        }, files);
        
        if (result.success) {
            showMessage('Relatório enviado com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('reportType').value = '';
            document.getElementById('reportDate').value = '';
            document.getElementById('reportTitle').value = '';
            document.getElementById('reportDescription').value = '';
            fileInput.value = '';
            
            // Atualizar estatísticas
            loadUserData();
            
        } else {
            showMessage(`Erro ao enviar relatório: ${result.message}`, 'error');
        }
        
    } catch (error) {
        debugLog('Erro no envio de relatório:', error);
        showMessage('Erro de conexão ao enviar relatório. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Cadastrar atividade
 */
async function submitActivity() {
    debugLog('Cadastrando atividade');
    
    if (!currentUser) {
        showMessage('Você precisa estar logado para cadastrar atividades', 'error');
        return;
    }
    
    const activityType = document.getElementById('activityType').value;
    const activityDate = document.getElementById('activityDate').value;
    const title = document.getElementById('activityTitle').value.trim();
    const description = document.getElementById('activityDescription').value.trim();
    const location = document.getElementById('activityLocation').value.trim();
    const participants = document.getElementById('activityParticipants').value.trim();
    const fileInput = document.getElementById('activityFiles');
    
    if (!activityType || !activityDate || !title || !description) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#activitiesContent button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cadastrando...';
    
    try {
        const files = fileInput.files.length > 0 ? Array.from(fileInput.files) : null;
        
        const result = await sendToScript('submitActivity', {
            email: currentUser.email,
            userEmail: currentUser.email,
            activityType: activityType,
            type: activityType,
            date: activityDate,
            activityDate: activityDate,
            title: title,
            activityName: title,
            description: description,
            location: location,
            participants: participants
        }, files);
        
        if (result.success) {
            showMessage('Atividade cadastrada com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('activityType').value = '';
            document.getElementById('activityDate').value = '';
            document.getElementById('activityTitle').value = '';
            document.getElementById('activityDescription').value = '';
            document.getElementById('activityLocation').value = '';
            document.getElementById('activityParticipants').value = '';
            fileInput.value = '';
            
            // Atualizar estatísticas
            loadUserData();
            
        } else {
            showMessage(`Erro ao cadastrar atividade: ${result.message}`, 'error');
        }
        
    } catch (error) {
        debugLog('Erro no cadastro de atividade:', error);
        showMessage('Erro de conexão ao cadastrar atividade. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Enviar arquivos
 */
async function uploadFiles() {
    debugLog('Enviando arquivos');
    
    if (!currentUser) {
        showMessage('Você precisa estar logado para enviar arquivos', 'error');
        return;
    }
    
    const category = document.getElementById('fileCategory').value;
    const description = document.getElementById('fileDescription').value.trim();
    const fileInput = document.getElementById('uploadFiles');
    
    if (!category) {
        showMessage('Por favor, selecione uma categoria', 'error');
        return;
    }
    
    if (fileInput.files.length === 0) {
        showMessage('Por favor, selecione pelo menos um arquivo', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#filesContent button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    try {
        const files = Array.from(fileInput.files);
        
        const result = await sendToScript('uploadFiles', {
            email: currentUser.email,
            userEmail: currentUser.email,
            category: category,
            description: description
        }, files);
        
        if (result.success) {
            showMessage('Arquivos enviados com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('fileCategory').value = '';
            document.getElementById('fileDescription').value = '';
            fileInput.value = '';
            
            // Atualizar estatísticas
            loadUserData();
            
        } else {
            showMessage(`Erro ao enviar arquivos: ${result.message}`, 'error');
        }
        
    } catch (error) {
        debugLog('Erro no envio de arquivos:', error);
        showMessage('Erro de conexão ao enviar arquivos. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== FUNÇÕES DE CARREGAMENTO DE DADOS ====================

/**
 * Carregar dados do usuário
 */
async function loadUserData() {
    debugLog('Carregando dados do usuário');
    
    if (!currentUser) return;
    
    try {
        const result = await sendToScript('getUserStats', {
            email: currentUser.email,
            userEmail: currentUser.email
        });
        
        if (result.success && result.stats) {
            // Atualizar estatísticas na visão geral
            document.getElementById('statsReports').textContent = result.stats.reports || 0;
            document.getElementById('statsActivities').textContent = result.stats.activities || 0;
            document.getElementById('statsFiles').textContent = result.stats.files || 0;
        } else {
            debugLog('Erro ao carregar estatísticas do usuário:', result.message);
        }
        
    } catch (error) {
        debugLog('Erro ao carregar dados do usuário:', error);
    }
}

/**
 * Carregar dados administrativos
 */
async function loadAdminData() {
    debugLog('Carregando dados administrativos');
    
    if (!currentUser || !currentUser.isAdmin) return;
    
    try {
        const result = await sendToScript('getAdminData', {
            email: currentUser.email
        });
        
        if (result.success && result.data) {
            const data = result.data;
            
            // Atualizar estatísticas gerais
            document.getElementById('adminStatsUsers').textContent = data.totalUsers || 0;
            document.getElementById('adminStatsReports').textContent = data.totalReports || 0;
            document.getElementById('adminStatsActivities').textContent = data.totalActivities || 0;
            document.getElementById('adminStatsFiles').textContent = data.totalFiles || 0;
            
            // Atualizar listas de dados recentes
            updateAdminList('adminUsersList', data.recentUsers, 'users');
            updateAdminList('adminReportsList', data.recentReports, 'reports');
            updateAdminList('adminActivitiesList', data.recentActivities, 'activities');
            
        } else {
            debugLog('Erro ao carregar dados administrativos:', result.message);
            showMessage('Erro ao carregar dados administrativos', 'error');
        }
        
    } catch (error) {
        debugLog('Erro ao carregar dados administrativos:', error);
        showMessage('Erro de conexão ao carregar dados administrativos', 'error');
    }
}

/**
 * Atualizar listas administrativas
 */
function updateAdminList(elementId, data, type) {
    const element = document.getElementById(elementId);
    if (!element || !data || !Array.isArray(data)) {
        if (element) element.innerHTML = '<p>Nenhum dado disponível</p>';
        return;
    }
    
    let html = '';
    
    switch (type) {
        case 'users':
            html = data.map(user => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <strong>${user.name}</strong><br>
                    <small>${user.email} - ${user.institution}</small><br>
                    <small>Projeto: ${user.project}</small>
                </div>
            `).join('');
            break;
            
        case 'reports':
            html = data.map(report => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <strong>${report.title}</strong><br>
                    <small>${report.email} - ${report.type}</small><br>
                    <small>Status: ${report.status}</small>
                </div>
            `).join('');
            break;
            
        case 'activities':
            html = data.map(activity => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <strong>${activity.name}</strong><br>
                    <small>${activity.email}</small><br>
                    <small>Arquivos: ${activity.files}</small>
                </div>
            `).join('');
            break;
    }
    
    element.innerHTML = html || '<p>Nenhum dado disponível</p>';
}

// ==================== INICIALIZAÇÃO ====================

/**
 * Inicializa o sistema quando a página carrega
 */
function initializeSystem() {
    debugLog(`Sistema CDR Sul iniciando - ${CONFIG.version}`);
    
    // Event listeners para formulários
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            register();
        });
    }
    
    // Event listeners para links
    const showRegisterLink = document.getElementById('showRegisterLink');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            showRegister();
        });
    }
    
    const showLoginLink = document.getElementById('showLoginLink');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLogin();
        });
    }
    
    // Event listener para logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Teste de conectividade
    testConnectivity();
    
    debugLog('Sistema inicializado com sucesso');
}

/**
 * Testa conectividade com o servidor
 */
async function testConnectivity() {
    debugLog('Testando conectividade...');
    
    try {
        const result = await sendToScript('test');
        if (result && result.success) {
            debugLog('Conectividade OK:', result);
        } else {
            debugLog('Conectividade limitada');
        }
    } catch (error) {
        debugLog('Erro de conectividade:', error);
    }
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
} else {
    initializeSystem();
}

// Exporta funções para uso global (compatibilidade)
window.login = login;
window.register = register;
window.logout = logout;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showTab = showTab;
window.submitReport = submitReport;
window.submitActivity = submitActivity;
window.uploadFiles = uploadFiles;

debugLog('JavaScript carregado com sucesso');
