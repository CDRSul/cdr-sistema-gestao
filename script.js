// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec',
    VERSION: '3.3 - ARQUIVOS CORRIGIDO + SEGURANÇA',
    DEBUG: true,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB em bytes
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total
    SUPPORTED_FORMATS: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'zip', 'rar', 'xlsx', 'ppt', 'doc', 'xlx']
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
        
        // Validação de arquivos em tempo real
        setupFileValidation();
        
        console.log('[CDR Sul] Event listeners configurados');
    } catch (error) {
        console.error('[CDR Sul] Erro ao configurar event listeners:', error);
    }
}

// ==================== VALIDAÇÃO DE ARQUIVOS ====================

function setupFileValidation() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            validateFiles(e.target.files, e.target);
        });
    });
}

function validateFiles(files, inputElement) {
    if (!files || files.length === 0) return true;
    
    let totalSize = 0;
    const errors = [];
    const warnings = [];
    
    Array.from(files).forEach((file, index) => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        totalSize += file.size;
        
        // Verificar tamanho individual
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            errors.push(`${file.name} (${fileSizeMB}MB) excede o limite de 10MB`);
        }
        
        // Verificar formato
        const extension = file.name.split('.').pop().toLowerCase();
        if (!CONFIG.SUPPORTED_FORMATS.includes(extension)) {
            warnings.push(`${file.name} - formato ${extension} pode não ser suportado`);
        }
        
        // Verificar se é imagem grande (pode ser comprimida)
        if (file.size > CONFIG.MAX_FILE_SIZE && ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            warnings.push(`${file.name} será comprimido automaticamente`);
        }
    });
    
    // Verificar tamanho total
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    if (totalSize > CONFIG.MAX_TOTAL_SIZE) {
        errors.push(`Tamanho total (${totalSizeMB}MB) excede o limite de 50MB`);
    }
    
    // Exibir feedback
    const feedbackDiv = inputElement.parentNode.querySelector('.file-feedback') || 
                       createFileFeedback(inputElement);
    
    if (errors.length > 0) {
        feedbackDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>Erros encontrados:</strong>
                <ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>
                <small>Comprima os arquivos ou divida em partes menores.</small>
            </div>
        `;
        inputElement.setCustomValidity('Arquivos muito grandes');
        return false;
    }
    
    if (warnings.length > 0) {
        feedbackDiv.innerHTML = `
            <div class="alert alert-warning">
                <strong>Avisos:</strong>
                <ul>${warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
            </div>
        `;
    } else {
        feedbackDiv.innerHTML = `
            <div class="alert alert-success">
                <strong>✓ Arquivos válidos:</strong> ${files.length} arquivo(s), Total: ${totalSizeMB}MB
            </div>
        `;
    }
    
    inputElement.setCustomValidity('');
    return true;
}

function createFileFeedback(inputElement) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'file-feedback mt-2';
    inputElement.parentNode.appendChild(feedbackDiv);
    return feedbackDiv;
}

// ==================== COMUNICAÇÃO COM GOOGLE APPS SCRIPT ====================

async function makeRequest(action, data = {}, files = null) {
    try {
        console.log(`[CDR Sul] Enviando ação: ${action}`);
        console.log(`[CDR Sul] Dados:`, Object.keys(data));
        console.log(`[CDR Sul] Arquivos:`, files ? files.length : 0);
        
        // Validar arquivos antes de enviar
        if (files && files.length > 0) {
            const validation = validateFilesForUpload(Array.from(files));
            if (!validation.success) {
                throw new Error(validation.error);
            }
        }
        
        const formData = new FormData();
        
        // Adicionar dados
        formData.append('action', action);
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        
        // Adicionar arquivos com nomes específicos
        if (files && files.length > 0) {
            Array.from(files).forEach((file, index) => {
                // Usar nomes específicos baseados na ação
                let fileName = `file_${index}`;
                if (action === 'submitReport') {
                    fileName = `reportFile_${index}`;
                } else if (action === 'submitActivity') {
                    fileName = `activityFile_${index}`;
                } else if (action === 'uploadFiles') {
                    fileName = `uploadFile_${index}`;
                }
                
                formData.append(fileName, file);
                console.log(`[CDR Sul] Arquivo adicionado: ${fileName} = ${file.name} (${file.size} bytes)`);
            });
        }
        
        console.log(`[CDR Sul] Enviando requisição para: ${CONFIG.GOOGLE_APPS_SCRIPT_URL}`);
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log(`[CDR Sul] Resposta recebida: ${responseText.substring(0, 200)}...`);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[CDR Sul] Erro ao fazer parse da resposta:', parseError);
            throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 100)}`);
        }
        
        console.log(`[CDR Sul] Resposta processada:`, result);
        return result;
        
    } catch (error) {
        console.error(`[CDR Sul] Erro na requisição:`, error);
        throw error;
    }
}

function validateFilesForUpload(files) {
    if (!files || files.length === 0) {
        return { success: true };
    }
    
    let totalSize = 0;
    const errors = [];
    
    files.forEach(file => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        totalSize += file.size;
        
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            // Verificar se é imagem (pode ser comprimida)
            const extension = file.name.split('.').pop().toLowerCase();
            if (!['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
                errors.push(`${file.name} (${fileSizeMB}MB) excede 10MB e não pode ser comprimido`);
            }
        }
    });
    
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    if (totalSize > CONFIG.MAX_TOTAL_SIZE) {
        errors.push(`Tamanho total (${totalSizeMB}MB) excede 50MB`);
    }
    
    if (errors.length > 0) {
        return {
            success: false,
            error: errors.join('; ')
        };
    }
    
    return { success: true };
}

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');
    
    try {
        showMessage(messageDiv, 'Fazendo login...', 'info');
        
        const result = await makeRequest('login', { email, password });
        
        if (result.success) {
            currentUser = result.user;
            isLoggedIn = true;
            
            // Salvar sessão
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            localStorage.setItem('cdr_login_time', Date.now().toString());
            
            showMessage(messageDiv, result.message, 'success');
            
            setTimeout(() => {
                showDashboard();
            }, 1000);
        } else {
            showMessage(messageDiv, result.error, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro no login:', error);
        showMessage(messageDiv, `Erro de conexão: ${error.message}`, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const name = document.getElementById('registerName').value;
    const institution = document.getElementById('registerInstitution').value;
    const messageDiv = document.getElementById('registerMessage');
    
    try {
        showMessage(messageDiv, 'Criando conta...', 'info');
        
        const result = await makeRequest('register', { email, password, name, institution });
        
        if (result.success) {
            showMessage(messageDiv, result.message, 'success');
            
            setTimeout(() => {
                showLoginForm();
            }, 2000);
        } else {
            showMessage(messageDiv, result.error, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro no cadastro:', error);
        showMessage(messageDiv, `Erro de conexão: ${error.message}`, 'error');
    }
}

// ==================== FUNÇÕES DE ENVIO ====================

async function handleSubmitReport(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const files = document.getElementById('reportFile').files;
    const messageDiv = document.getElementById('reportMessage');
    
    try {
        // Validar arquivos
        if (files.length > 0 && !validateFiles(files, document.getElementById('reportFile'))) {
            showMessage(messageDiv, 'Corrija os problemas com os arquivos antes de enviar', 'error');
            return;
        }
        
        showMessage(messageDiv, 'Enviando relatório...', 'info');
        
        const data = {
            email: currentUser.email,
            reportType: formData.get('reportType'),
            title: formData.get('title'),
            description: formData.get('description'),
            period: formData.get('period')
        };
        
        console.log('[CDR Sul] Dados do relatório:', data);
        console.log('[CDR Sul] Arquivos do relatório:', files.length);
        
        const result = await makeRequest('submitReport', data, files);
        
        if (result.success) {
            showMessage(messageDiv, result.message, 'success');
            
            // Mostrar detalhes do arquivo se houver
            if (result.data && result.data.fileName) {
                let details = `Arquivo: ${result.data.fileName}`;
                if (result.data.fileInfo) {
                    details += ` (${result.data.fileInfo})`;
                }
                showMessage(messageDiv, details, 'info', true);
            } else if (result.data && !result.data.hasFile) {
                showMessage(messageDiv, 'Relatório salvo sem arquivo anexo', 'warning', true);
            }
            
            e.target.reset();
            
            // Atualizar estatísticas se estiver na aba visão geral
            if (document.getElementById('overviewTab') && document.getElementById('overviewTab').classList.contains('active')) {
                loadUserStats();
            }
        } else {
            showMessage(messageDiv, result.error, 'error');
            
            // Mostrar detalhes específicos sobre limitações de arquivo
            if (result.details && result.details.suggestion) {
                showMessage(messageDiv, result.details.suggestion, 'warning', true);
            }
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar relatório:', error);
        showMessage(messageDiv, `Erro ao enviar relatório: ${error.message}`, 'error');
    }
}

async function handleSubmitActivity(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const files = document.getElementById('activityFiles').files;
    const messageDiv = document.getElementById('activityMessage');
    
    try {
        // Validar arquivos
        if (files.length > 0 && !validateFiles(files, document.getElementById('activityFiles'))) {
            showMessage(messageDiv, 'Corrija os problemas com os arquivos antes de enviar', 'error');
            return;
        }
        
        showMessage(messageDiv, 'Cadastrando atividade...', 'info');
        
        const data = {
            email: currentUser.email,
            activityType: formData.get('activityType'),
            title: formData.get('title'),
            description: formData.get('description'),
            location: formData.get('location'),
            participants: formData.get('participants')
        };
        
        console.log('[CDR Sul] Dados da atividade:', data);
        console.log('[CDR Sul] Arquivos da atividade:', files.length);
        
        const result = await makeRequest('submitActivity', data, files);
        
        if (result.success) {
            showMessage(messageDiv, result.message, 'success');
            
            // Mostrar detalhes dos arquivos
            if (result.data && result.data.files && result.data.files.length > 0) {
                const details = `Evidências: ${result.data.files.join(', ')}`;
                showMessage(messageDiv, details, 'info', true);
                
                if (result.data.fileInfos && result.data.fileInfos.length > 0) {
                    showMessage(messageDiv, result.data.fileInfos.join('; '), 'warning', true);
                }
            } else {
                showMessage(messageDiv, 'Atividade cadastrada sem evidências', 'warning', true);
            }
            
            e.target.reset();
            
            // Atualizar estatísticas
            if (document.getElementById('overviewTab') && document.getElementById('overviewTab').classList.contains('active')) {
                loadUserStats();
            }
        } else {
            showMessage(messageDiv, result.error, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao cadastrar atividade:', error);
        showMessage(messageDiv, `Erro ao cadastrar atividade: ${error.message}`, 'error');
    }
}

async function handleUploadFiles(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const files = document.getElementById('uploadFiles').files;
    const messageDiv = document.getElementById('filesMessage');
    
    try {
        if (files.length === 0) {
            showMessage(messageDiv, 'Selecione pelo menos um arquivo', 'error');
            return;
        }
        
        // Validar arquivos
        if (!validateFiles(files, document.getElementById('uploadFiles'))) {
            showMessage(messageDiv, 'Corrija os problemas com os arquivos antes de enviar', 'error');
            return;
        }
        
        showMessage(messageDiv, 'Enviando arquivos...', 'info');
        
        const data = {
            email: currentUser.email,
            category: formData.get('category'),
            description: formData.get('description')
        };
        
        console.log('[CDR Sul] Dados dos arquivos:', data);
        console.log('[CDR Sul] Arquivos para upload:', files.length);
        
        const result = await makeRequest('uploadFiles', data, files);
        
        if (result.success) {
            showMessage(messageDiv, result.message, 'success');
            
            // Mostrar detalhes dos arquivos
            if (result.data) {
                if (result.data.files && result.data.files.length > 0) {
                    const details = `Arquivos enviados: ${result.data.files.join(', ')}`;
                    showMessage(messageDiv, details, 'info', true);
                }
                
                if (result.data.skippedFiles && result.data.skippedFiles.length > 0) {
                    const skipped = `Arquivos pulados: ${result.data.skippedFiles.join(', ')}`;
                    showMessage(messageDiv, skipped, 'warning', true);
                }
                
                if (result.data.fileInfos && result.data.fileInfos.length > 0) {
                    showMessage(messageDiv, result.data.fileInfos.join('; '), 'info', true);
                }
            }
            
            e.target.reset();
            
            // Atualizar estatísticas
            if (document.getElementById('overviewTab') && document.getElementById('overviewTab').classList.contains('active')) {
                loadUserStats();
            }
        } else {
            showMessage(messageDiv, result.error, 'error');
            
            // Mostrar detalhes específicos se houver
            if (result.details) {
                if (result.details.receivedKeys) {
                    showMessage(messageDiv, `Chaves recebidas: ${result.details.receivedKeys.join(', ')}`, 'info', true);
                }
                if (result.details.skippedFiles) {
                    showMessage(messageDiv, `Arquivos com problema: ${result.details.skippedFiles.join(', ')}`, 'warning', true);
                }
            }
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar arquivos:', error);
        showMessage(messageDiv, `Erro ao enviar arquivos: ${error.message}`, 'error');
    }
}

// ==================== CARREGAMENTO DE DADOS ====================

async function loadUserStats() {
    try {
        console.log('[CDR Sul] Carregando estatísticas do usuário');
        
        const result = await makeRequest('getUserStats', { 
            email: currentUser.email,
            requestType: 'userStats'
        });
        
        if (result.success && result.data) {
            updateUserStatsDisplay(result.data);
        } else {
            console.error('[CDR Sul] Erro ao carregar estatísticas:', result.error);
            showUserStatsError();
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar estatísticas:', error);
        showUserStatsError();
    }
}

function updateUserStatsDisplay(data) {
    // Atualizar contadores
    const elements = {
        'userReportsCount': data.reportsCount || 0,
        'userActivitiesCount': data.activitiesCount || 0,
        'userFilesCount': data.filesCount || 0
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
    
    // Atualizar listas recentes
    updateRecentList('userRecentReports', data.recentReports || [], 'relatório');
    updateRecentList('userRecentActivities', data.recentActivities || [], 'atividade');
    
    console.log('[CDR Sul] Estatísticas do usuário atualizadas');
}

function showUserStatsError() {
    const elements = ['userReportsCount', 'userActivitiesCount', 'userFilesCount'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '0';
        }
    });
    
    const recentLists = ['userRecentReports', 'userRecentActivities'];
    recentLists.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<li class="list-group-item text-muted">Erro ao carregar dados</li>';
        }
    });
}

async function loadAdminData() {
    try {
        console.log('[CDR Sul] Carregando dados administrativos');
        
        const result = await makeRequest('getAdminData', { 
            email: currentUser.email,
            requestType: 'adminData'
        });
        
        if (result.success && result.data) {
            updateAdminDisplay(result.data);
        } else {
            console.error('[CDR Sul] Erro ao carregar dados admin:', result.error);
            showAdminError();
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar dados admin:', error);
        showAdminError();
    }
}

function updateAdminDisplay(data) {
    // Atualizar contadores
    const elements = {
        'totalUsers': data.totalUsers || 0,
        'totalReports': data.totalReports || 0,
        'totalActivities': data.totalActivities || 0
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
    
    // Atualizar listas recentes
    updateRecentList('recentUsers', data.recentUsers || [], 'usuário');
    updateRecentList('recentReports', data.recentReports || [], 'relatório');
    updateRecentList('recentActivities', data.recentActivities || [], 'atividade');
    
    console.log('[CDR Sul] Dados administrativos atualizados');
}

function updateRecentList(elementId, items, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (!items || items.length === 0) {
        element.innerHTML = `<li class="list-group-item text-muted">Nenhum ${type} encontrado</li>`;
        return;
    }
    
    const html = items.map(item => {
        let title = item.title || item.name || 'Sem título';
        let subtitle = '';
        
        if (type === 'usuário') {
            subtitle = item.email || 'Email não informado';
        } else {
            subtitle = `${item.type || 'Tipo não informado'} - ${formatDate(item.date)}`;
        }
        
        return `
            <li class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${title}</h6>
                        <small class="text-muted">${subtitle}</small>
                    </div>
                </div>
            </li>
        `;
    }).join('');
    
    element.innerHTML = html;
}

function showAdminError() {
    const elements = ['totalUsers', 'totalReports', 'totalActivities'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '0';
        }
    });
    
    const recentLists = ['recentUsers', 'recentReports', 'recentActivities'];
    recentLists.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<li class="list-group-item text-muted">Erro ao carregar dados</li>';
        }
    });
}

// ==================== FUNÇÕES DE INTERFACE ====================

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    // Atualizar informações do usuário
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    
    // Configurar abas baseado no papel do usuário
    if (currentUser.role === 'admin') {
        document.getElementById('adminTab').style.display = 'block';
        showTab('admin');
        loadAdminData();
    } else {
        document.getElementById('adminTab').style.display = 'none';
        showTab('overview');
        loadUserStats();
    }
}

function showTab(tabName) {
    // Esconder todas as abas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Remover classe active de todos os links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Mostrar aba selecionada
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Adicionar classe active ao link
    const selectedLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedLink) {
        selectedLink.classList.add('active');
    }
    
    // Carregar dados específicos da aba
    if (tabName === 'overview') {
        loadUserStats();
    } else if (tabName === 'admin') {
        loadAdminData();
    }
}

function handleNavigation(e) {
    e.preventDefault();
    const tabName = e.target.getAttribute('data-tab');
    if (tabName) {
        showTab(tabName);
    }
}

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

function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    
    // Limpar sessão
    localStorage.removeItem('cdr_user');
    localStorage.removeItem('cdr_login_time');
    
    showLoginForm();
}

function checkSavedSession() {
    try {
        const savedUser = localStorage.getItem('cdr_user');
        const loginTime = localStorage.getItem('cdr_login_time');
        
        if (savedUser && loginTime) {
            const timeDiff = Date.now() - parseInt(loginTime);
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Sessão válida por 24 horas
            if (hoursDiff < 24) {
                currentUser = JSON.parse(savedUser);
                isLoggedIn = true;
                showDashboard();
                console.log('[CDR Sul] Sessão restaurada');
                return;
            }
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao verificar sessão:', error);
    }
    
    showLoginForm();
}

async function testConnectivity() {
    try {
        console.log('[CDR Sul] Testando conectividade...');
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL);
        const result = await response.json();
        
        if (result.success) {
            console.log(`[CDR Sul] Conectividade OK: ${result.version}`);
            
            // Mostrar informações sobre limitações
            if (result.limits) {
                console.log(`[CDR Sul] Limites: Arquivo ${result.limits.maxFileSize}, Total ${result.limits.maxTotalSize}`);
            }
        } else {
            console.warn('[CDR Sul] Problema na conectividade:', result.error);
        }
    } catch (error) {
        console.warn('[CDR Sul] Erro de conectividade:', error.message);
    }
}

// ==================== FUNÇÕES AUXILIARES ====================

function showMessage(element, message, type, append = false) {
    if (!element) return;
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const messageHtml = `<div class="alert ${alertClass} mt-2">${message}</div>`;
    
    if (append) {
        element.innerHTML += messageHtml;
    } else {
        element.innerHTML = messageHtml;
    }
    
    // Auto-remover mensagens de sucesso após 5 segundos
    if (type === 'success') {
        setTimeout(() => {
            if (element.innerHTML.includes(message)) {
                element.innerHTML = '';
            }
        }, 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Data não informada';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return 'Data inválida';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== INICIALIZAÇÃO FINAL ====================

console.log(`[CDR Sul] JavaScript carregado - Versão ${CONFIG.VERSION}`);
console.log(`[CDR Sul] URL configurada: ${CONFIG.GOOGLE_APPS_SCRIPT_URL}`);
console.log(`[CDR Sul] Limites: Arquivo ${formatFileSize(CONFIG.MAX_FILE_SIZE)}, Total ${formatFileSize(CONFIG.MAX_TOTAL_SIZE)}`);
console.log(`[CDR Sul] Formatos suportados: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
