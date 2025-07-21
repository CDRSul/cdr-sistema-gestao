const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec',
    VERSION: '3.4 - MELHORADO COM FEEDBACK VISUAL E PDF',
    DEBUG: true,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB em bytes
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total
    SUPPORTED_FORMATS: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'zip', 'rar', 'xlsx', 'ppt', 'xls']
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
        
        // Botão de gerar PDF
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        if (generatePdfBtn) {
            generatePdfBtn.addEventListener('click', generateUserPDF);
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
            updateFileInfo(e.target);
        });
    });
}

function updateFileInfo(inputElement) {
    const files = inputElement.files;
    const infoId = inputElement.id + 'Info';
    const infoDiv = document.getElementById(infoId);
    
    if (!infoDiv) return;
    
    if (files.length === 0) {
        infoDiv.classList.add('hidden');
        return;
    }
    
    let totalSize = 0;
    let fileList = '';
    
    Array.from(files).forEach(file => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        totalSize += file.size;
        fileList += `<div>📎 ${file.name} (${sizeMB}MB)</div>`;
    });
    
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    infoDiv.innerHTML = `
        <strong>Arquivos selecionados:</strong><br>
        ${fileList}
        <div style="margin-top: 8px;"><strong>Total: ${files.length} arquivo(s) - ${totalSizeMB}MB</strong></div>
    `;
    infoDiv.classList.remove('hidden');
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
    });
    
    // Verificar tamanho total
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    if (totalSize > CONFIG.MAX_TOTAL_SIZE) {
        errors.push(`Tamanho total (${totalSizeMB}MB) excede o limite de 50MB`);
    }
    
    if (errors.length > 0) {
        showMessage('Erro: ' + errors.join(', '), 'error');
        inputElement.setCustomValidity('Arquivos muito grandes');
        return false;
    }
    
    if (warnings.length > 0) {
        showMessage('Aviso: ' + warnings.join(', '), 'info');
    }
    
    inputElement.setCustomValidity('');
    return true;
}

// ==================== FEEDBACK VISUAL ====================
function setButtonLoading(buttonId, isLoading, loadingText = 'Carregando...') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('btn-loading');
        button.dataset.originalText = button.textContent;
        button.innerHTML = `<span class="spinner"></span>${loadingText}`;
    } else {
        button.disabled = false;
        button.classList.remove('btn-loading');
        button.innerHTML = button.dataset.originalText || button.textContent.replace(/^.*?([A-Za-z].*)$/, '$1');
    }
}

function showProgress(progressId, show = true, percentage = 0) {
    const progressContainer = document.getElementById(progressId);
    if (!progressContainer) return;
    
    if (show) {
        progressContainer.style.display = 'block';
        const progressFill = progressContainer.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
    } else {
        progressContainer.style.display = 'none';
    }
}

function showMessage(message, type = 'info') {
    // Remove mensagens anteriores
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Inserir no topo do conteúdo ativo
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        activeSection.insertBefore(messageDiv, activeSection.firstChild);
    }
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// ==================== COMUNICAÇÃO COM GOOGLE APPS SCRIPT ====================
async function makeRequest(action, data = {}, files = null) {
    try {
        console.log(`[CDR Sul] Enviando ação: ${action}`);
        
        const formData = new FormData();
        
        // Adicionar dados
        formData.append('action', action);
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        
        // Adicionar arquivos se houver
        if (files && files.length > 0) {
            Array.from(files).forEach((file, index) => {
                formData.append(`file_${index}`, file);
            });
        }
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`[CDR Sul] Resposta recebida:`, result);
        
        return result;
        
    } catch (error) {
        console.error(`[CDR Sul] Erro na requisição:`, error);
        throw error;
    }
}

// ==================== AUTENTICAÇÃO ====================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    setButtonLoading('loginBtn', true, 'Fazendo login...');
    
    try {
        const result = await makeRequest('login', { email, password });
        
        if (result.success) {
            currentUser = result.data.user;
            isLoggedIn = true;
            
            // Salvar sessão
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            localStorage.setItem('cdr_session', 'active');
            
            showMessage('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                showDashboard();
                loadUserData();
            }, 1000);
            
        } else {
            showMessage(result.error || 'Erro no login', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro no login:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        setButtonLoading('loginBtn', false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    if (!data.name || !data.email || !data.institution || !data.project || !data.password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    setButtonLoading('registerBtn', true, 'Criando conta...');
    
    try {
        const result = await makeRequest('register', data);
        
        if (result.success) {
            showMessage('Conta criada com sucesso! Faça login para continuar.', 'success');
            setTimeout(() => {
                showLoginForm();
            }, 2000);
        } else {
            showMessage(result.error || 'Erro no cadastro', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro no cadastro:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        setButtonLoading('registerBtn', false);
    }
}

// ==================== ENVIO DE DADOS ====================
async function handleSubmitReport(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const files = document.getElementById('reportFiles').files;
    
    if (!data.type || !data.date || !data.title || !data.description) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    data.userEmail = currentUser.email;
    
    setButtonLoading('submitReportBtn', true, 'Enviando relatório...');
    showProgress('reportProgress', true, 0);
    
    try {
        // Simular progresso
        for (let i = 0; i <= 100; i += 20) {
            showProgress('reportProgress', true, i);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const result = await makeRequest('submitReport', data, files);
        
        if (result.success) {
            showMessage('Relatório enviado com sucesso!', 'success');
            e.target.reset();
            updateFileInfo(document.getElementById('reportFiles'));
            loadUserData(); // Atualizar estatísticas
        } else {
            showMessage(result.error || 'Erro ao enviar relatório', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar relatório:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        setButtonLoading('submitReportBtn', false);
        showProgress('reportProgress', false);
    }
}

async function handleSubmitActivity(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const files = document.getElementById('activityFiles').files;
    
    if (!data.type || !data.date || !data.title || !data.description) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    data.userEmail = currentUser.email;
    
    setButtonLoading('submitActivityBtn', true, 'Cadastrando atividade...');
    showProgress('activityProgress', true, 0);
    
    try {
        // Simular progresso
        for (let i = 0; i <= 100; i += 25) {
            showProgress('activityProgress', true, i);
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        const result = await makeRequest('submitActivity', data, files);
        
        if (result.success) {
            showMessage('Atividade cadastrada com sucesso!', 'success');
            e.target.reset();
            updateFileInfo(document.getElementById('activityFiles'));
            loadUserData(); // Atualizar estatísticas
        } else {
            showMessage(result.error || 'Erro ao cadastrar atividade', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao cadastrar atividade:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        setButtonLoading('submitActivityBtn', false);
        showProgress('activityProgress', false);
    }
}

async function handleUploadFiles(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const files = document.getElementById('uploadFiles').files;
    
    if (!data.category || files.length === 0) {
        showMessage('Por favor, selecione a categoria e pelo menos um arquivo', 'error');
        return;
    }
    
    data.userEmail = currentUser.email;
    
    setButtonLoading('submitFilesBtn', true, 'Enviando arquivos...');
    showProgress('filesProgress', true, 0);
    
    try {
        // Simular progresso
        for (let i = 0; i <= 100; i += 10) {
            showProgress('filesProgress', true, i);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const result = await makeRequest('uploadFiles', data, files);
        
        if (result.success) {
            showMessage('Arquivos enviados com sucesso!', 'success');
            e.target.reset();
            updateFileInfo(document.getElementById('uploadFiles'));
            loadUserData(); // Atualizar estatísticas
        } else {
            showMessage(result.error || 'Erro ao enviar arquivos', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar arquivos:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        setButtonLoading('submitFilesBtn', false);
        showProgress('filesProgress', false);
    }
}

// ==================== GERAÇÃO DE PDF ====================
async function generateUserPDF() {
    if (!currentUser) {
        showMessage('Usuário não encontrado', 'error');
        return;
    }
    
    setButtonLoading('generatePdfBtn', true, 'Gerando PDF...');
    
    try {
        const result = await makeRequest('generatePDF', {
            userEmail: currentUser.email,
            requestedBy: currentUser.email,
            isAdmin: currentUser.isAdmin || false
        });
        
        if (result.success && result.data.pdfUrl) {
            showMessage('Relatório PDF gerado com sucesso!', 'success');
            // Abrir PDF em nova aba
            window.open(result.data.pdfUrl, '_blank');
        } else {
            showMessage(result.error || 'Erro ao gerar relatório PDF', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao gerar PDF:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        setButtonLoading('generatePdfBtn', false);
    }
}

async function generateAdminPDF(userEmail) {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('Acesso negado', 'error');
        return;
    }
    
    try {
        const result = await makeRequest('generatePDF', {
            userEmail: userEmail,
            requestedBy: currentUser.email,
            isAdmin: true
        });
        
        if (result.success && result.data.pdfUrl) {
            showMessage('Relatório PDF gerado com sucesso!', 'success');
            // Abrir PDF em nova aba
            window.open(result.data.pdfUrl, '_blank');
        } else {
            showMessage(result.error || 'Erro ao gerar relatório PDF', 'error');
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao gerar PDF admin:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    }
}

// ==================== CARREGAMENTO DE DADOS ====================
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Carregar relatórios do usuário
        const reportsResult = await makeRequest('getReports', { userEmail: currentUser.email });
        if (reportsResult.success) {
            updateReportsCount(reportsResult.data.length);
            displayReports(reportsResult.data);
            displayRecentReports(reportsResult.data.slice(-3));
        }
        
        // Carregar atividades do usuário
        const activitiesResult = await makeRequest('getActivities', { userEmail: currentUser.email });
        if (activitiesResult.success) {
            updateActivitiesCount(activitiesResult.data.length);
            displayActivities(activitiesResult.data);
            displayRecentActivities(activitiesResult.data.slice(-3));
        }
        
        // Carregar arquivos do usuário
        const filesResult = await makeRequest('getFiles', { userEmail: currentUser.email });
        if (filesResult.success) {
            updateFilesCount(filesResult.data.length);
            displayFiles(filesResult.data);
            displayRecentFiles(filesResult.data.slice(-3));
        }
        
        // Se for admin, carregar dados administrativos
        if (currentUser.isAdmin) {
            loadAdminData();
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar dados do usuário:', error);
    }
}

async function loadAdminData() {
    try {
        // Carregar todos os usuários
        const usersResult = await makeRequest('getUsers');
        if (usersResult.success) {
            updateTotalUsers(usersResult.data.length);
            displayAllUsers(usersResult.data);
        }
        
        // Carregar todos os relatórios
        const allReportsResult = await makeRequest('getReports');
        if (allReportsResult.success) {
            updateTotalReports(allReportsResult.data.length);
            displayAdminReports(allReportsResult.data.slice(-10));
        }
        
        // Carregar todas as atividades
        const allActivitiesResult = await makeRequest('getActivities');
        if (allActivitiesResult.success) {
            updateTotalActivities(allActivitiesResult.data.length);
            displayAdminActivities(allActivitiesResult.data.slice(-10));
        }
        
        // Carregar todos os arquivos
        const allFilesResult = await makeRequest('getFiles');
        if (allFilesResult.success) {
            updateTotalFiles(allFilesResult.data.length);
            displayAdminFiles(allFilesResult.data.slice(-10));
        }
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar dados administrativos:', error);
    }
}

// ==================== ATUALIZAÇÃO DE INTERFACE ====================
function updateReportsCount(count) {
    const element = document.getElementById('reportsCount');
    if (element) element.textContent = count;
}

function updateActivitiesCount(count) {
    const element = document.getElementById('activitiesCount');
    if (element) element.textContent = count;
}

function updateFilesCount(count) {
    const element = document.getElementById('filesCount');
    if (element) element.textContent = count;
}

function updateTotalUsers(count) {
    const element = document.getElementById('totalUsers');
    if (element) element.textContent = count;
}

function updateTotalReports(count) {
    const element = document.getElementById('totalReports');
    if (element) element.textContent = count;
}

function updateTotalActivities(count) {
    const element = document.getElementById('totalActivities');
    if (element) element.textContent = count;
}

function updateTotalFiles(count) {
    const element = document.getElementById('totalFiles');
    if (element) element.textContent = count;
}

function displayRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = '<p>Nenhuma atividade cadastrada ainda.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="data-item">
            <h4>${activity.title}</h4>
            <p><strong>Tipo:</strong> ${activity.type} | <strong>Data:</strong> ${formatDate(activity.date)}</p>
            <p><strong>Local:</strong> ${activity.location || 'Não informado'}</p>
            <p>${activity.description}</p>
        </div>
    `).join('');
}

function displayRecentFiles(files) {
    const container = document.getElementById('recentFiles');
    if (!container) return;
    
    if (files.length === 0) {
        container.innerHTML = '<p>Nenhum arquivo enviado ainda.</p>';
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="data-item">
            <h4>${file.name}</h4>
            <p><strong>Categoria:</strong> ${file.category} | <strong>Tamanho:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Data:</strong> ${formatDate(file.uploadDate)}</p>
            <p>${file.description || 'Sem descrição'}</p>
            ${file.driveUrl ? `<p><a href="${file.driveUrl}" target="_blank">📎 Abrir arquivo</a></p>` : ''}
        </div>
    `).join('');
}

function displayAllUsers(users) {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<p>Nenhum usuário cadastrado.</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-info-admin">
                <h5>${user.name}</h5>
                <p><strong>E-mail:</strong> ${user.email}</p>
                <p><strong>Instituição:</strong> ${user.institution}</p>
                <p><strong>Projeto:</strong> ${user.project}</p>
            </div>
            <button class="btn-user-pdf" onclick="generateAdminPDF('${user.email}')">
                📄 Relatório PDF
            </button>
        </div>
    `).join('');
}

// ==================== UTILITÁRIOS ====================
function formatDate(dateString) {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== NAVEGAÇÃO ====================
function showLoginForm() {
    document.getElementById('loginFormContainer').classList.remove('hidden');
    document.getElementById('registerFormContainer').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('loginFormContainer').classList.add('hidden');
    document.getElementById('registerFormContainer').classList.remove('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    
    // Atualizar informações do usuário
    if (currentUser) {
        document.getElementById('userName').textContent = `Olá, ${currentUser.name}!`;
        document.getElementById('userInfo').textContent = `${currentUser.email} - ${currentUser.institution}`;
        
        if (currentUser.isAdmin) {
            document.getElementById('adminBadge').classList.remove('hidden');
            document.getElementById('adminNavLink').classList.remove('hidden');
        }
    }
}

function handleNavigation(e) {
    e.preventDefault();
    
    const section = e.target.dataset.section;
    if (!section) return;
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Mostrar seção correspondente
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    
    localStorage.removeItem('cdr_user');
    localStorage.removeItem('cdr_session');
    
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginScreen').style.display = 'flex';
    
    // Limpar formulários
    document.querySelectorAll('form').forEach(form => form.reset());
    
    showMessage('Logout realizado com sucesso!', 'success');
}

function checkSavedSession() {
    const savedUser = localStorage.getItem('cdr_user');
    const savedSession = localStorage.getItem('cdr_session');
    
    if (savedUser && savedSession === 'active') {
        try {
            currentUser = JSON.parse(savedUser);
            isLoggedIn = true;
            showDashboard();
            loadUserData();
        } catch (error) {
            console.error('[CDR Sul] Erro ao restaurar sessão:', error);
            localStorage.removeItem('cdr_user');
            localStorage.removeItem('cdr_session');
        }
    }
}

async function testConnectivity() {
    try {
        const result = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL);
        console.log('[CDR Sul] Conectividade testada com sucesso');
    } catch (error) {
        console.warn('[CDR Sul] Problema de conectividade:', error);
    }
}

// ==================== FUNÇÕES AUXILIARES DE EXIBIÇÃO ====================
function displayReports(reports) {
    const container = document.getElementById('reportsList');
    if (!container) return;
    
    if (reports.length === 0) {
        container.innerHTML = '<p>Nenhum relatório enviado ainda.</p>';
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="data-item">
            <h4>${report.title}</h4>
            <p><strong>Tipo:</strong> ${report.type} | <strong>Data:</strong> ${formatDate(report.date)}</p>
            <p>${report.description}</p>
            ${report.fileUrls && report.fileUrls.length > 0 ? 
                `<p><strong>Arquivos:</strong> ${report.fileUrls.map((url, index) => 
                    `<a href="${url}" target="_blank">📎 ${report.files[index] || 'Arquivo'}</a>`
                ).join(', ')}</p>` : ''}
        </div>
    `).join('');
}

function displayActivities(activities) {
    const container = document.getElementById('activitiesList');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = '<p>Nenhuma atividade cadastrada ainda.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="data-item">
            <h4>${activity.title}</h4>
            <p><strong>Tipo:</strong> ${activity.type} | <strong>Data:</strong> ${formatDate(activity.date)}</p>
            <p><strong>Local:</strong> ${activity.location || 'Não informado'}</p>
            <p><strong>Participantes:</strong> ${activity.participants || 'Não informado'}</p>
            <p>${activity.description}</p>
            ${activity.fileUrls && activity.fileUrls.length > 0 ? 
                `<p><strong>Arquivos:</strong> ${activity.fileUrls.map((url, index) => 
                    `<a href="${url}" target="_blank">📎 ${activity.files[index] || 'Arquivo'}</a>`
                ).join(', ')}</p>` : ''}
        </div>
    `).join('');
}

function displayFiles(files) {
    const container = document.getElementById('filesList');
    if (!container) return;
    
    if (files.length === 0) {
        container.innerHTML = '<p>Nenhum arquivo enviado ainda.</p>';
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="data-item">
            <h4>${file.name}</h4>
            <p><strong>Categoria:</strong> ${file.category} | <strong>Tamanho:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Data:</strong> ${formatDate(file.uploadDate)}</p>
            <p>${file.description || 'Sem descrição'}</p>
            ${file.driveUrl ? `<p><a href="${file.driveUrl}" target="_blank">📎 Abrir arquivo</a></p>` : ''}
        </div>
    `).join('');
}

function displayAdminReports(reports) {
    const container = document.getElementById('adminReportsList');
    if (!container) return;
    
    if (reports.length === 0) {
        container.innerHTML = '<p>Nenhum relatório encontrado.</p>';
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="data-item">
            <h4>${report.title}</h4>
            <p><strong>Usuário:</strong> ${report.userEmail}</p>
            <p><strong>Tipo:</strong> ${report.type} | <strong>Data:</strong> ${formatDate(report.date)}</p>
            <p>${report.description}</p>
        </div>
    `).join('');
}

function displayAdminActivities(activities) {
    const container = document.getElementById('adminActivitiesList');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="data-item">
            <h4>${activity.title}</h4>
            <p><strong>Usuário:</strong> ${activity.userEmail}</p>
            <p><strong>Tipo:</strong> ${activity.type} | <strong>Data:</strong> ${formatDate(activity.date)}</p>
            <p><strong>Local:</strong> ${activity.location || 'Não informado'}</p>
            <p>${activity.description}</p>
        </div>
    `).join('');
}

function displayAdminFiles(files) {
    const container = document.getElementById('adminFilesList');
    if (!container) return;
    
    if (files.length === 0) {
        container.innerHTML = '<p>Nenhum arquivo encontrado.</p>';
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="data-item">
            <h4>${file.name}</h4>
            <p><strong>Usuário:</strong> ${file.userEmail}</p>
            <p><strong>Categoria:</strong> ${file.category} | <strong>Tamanho:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Data:</strong> ${formatDate(file.uploadDate)}</p>
            <p>${file.description || 'Sem descrição'}</p>
        </div>
    `).join('');
}
