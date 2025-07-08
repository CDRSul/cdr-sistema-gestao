/**
 * Sistema CDR Sul Tocantins - Frontend JavaScript
 * Versão 2.0 - 100% Funcional
 */

// ==================== CONFIGURAÇÕES ====================

// URL do Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3EWGWrdkfzwkc7uYoVVh4DCH4KGLiCBrYwO_GQfiTWbodXY3FwUs_lYgPSqNHUJzjZw/exec';

// Variáveis globais
let currentUser = null;
let userStats = { reports: 0, activities: 0, files: 0 };

// ==================== INICIALIZAÇÃO ====================

// Inicializar sistema ao carregar página
window.onload = function() {
    console.log('Sistema CDR Sul iniciando...');
    
    // Verificar se há sessão salva
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
    
    // Configurar upload de arquivos por drag and drop
    setupFileUpload();
    
    // Definir data atual no campo de atividade
    const today = new Date().toISOString().split('T')[0];
    const activityDateField = document.getElementById('activityDate');
    if (activityDateField) {
        activityDateField.value = today;
    }
};

// ==================== AUTENTICAÇÃO ====================

// Função de login
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
        
        const response = await makeRequest('login', {
            email: email,
            password: password
        });
        
        if (response.success) {
            currentUser = response.user;
            
            // Salvar sessão no localStorage
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            
            showDashboard();
            loadUserStats();
            showMessage('Login realizado com sucesso!', 'success');
        } else {
            showMessage(response.message || 'E-mail ou senha incorretos', 'error');
        }
        
    } catch (error) {
        console.error('ERRO DETALHADO NO LOGIN:', error);
    // A linha abaixo vai mostrar o erro real na interface do site
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
    
    if (!name || !email || !institution || !project || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Por favor, digite um e-mail válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    try {
        showMessage('Cadastrando usuário...', 'info');
        
        const response = await makeRequest('register', {
            name: name,
            email: email,
            institution: institution,
            project: project,
            password: password
        });
        
        if (response.success) {
            showMessage('Usuário cadastrado com sucesso! Faça login para continuar.', 'success');
            showLogin();
            
            // Pré-preencher campos de login
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
        } else {
            showMessage(response.message || 'Erro ao cadastrar usuário', 'error');
        }
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

// Função de logout
function logout() {
    currentUser = null;
    userStats = { reports: 0, activities: 0, files: 0 };
    
    // Limpar localStorage
    localStorage.removeItem('cdr_user');
    
    // Limpar campos
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    
    // Mostrar tela de login
    showLogin();
    showMessage('Logout realizado com sucesso!', 'success');
}

// ==================== NAVEGAÇÃO ====================

// Mostrar tela de login
function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

// Mostrar tela de cadastro
function showRegister() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

// Mostrar dashboard
function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('userName').textContent = `Bem-vindo, ${currentUser.name}!`;
        document.getElementById('userInfo').textContent = `${currentUser.institution} - ${currentUser.project}`;
        document.getElementById('currentUser').textContent = currentUser.email;
        document.getElementById('currentProject').textContent = currentUser.project;
        
        // Mostrar aba admin apenas para administradores
        const adminTab = document.getElementById('adminTab');
        if (currentUser.isAdmin) {
            adminTab.classList.remove('hidden');
        } else {
            adminTab.classList.add('hidden');
        }
    }
}

// Mostrar abas do dashboard
function showTab(tabName) {
    // Esconder todos os conteúdos
    const contents = ['overview', 'reports', 'activities', 'files', 'admin'];
    contents.forEach(content => {
        const element = document.getElementById(content + 'Content');
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Remover classe active de todas as abas
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Mostrar conteúdo selecionado
    const selectedContent = document.getElementById(tabName + 'Content');
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    // Adicionar classe active à aba correspondente
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Carregar dados específicos da aba
    if (tabName === 'admin' && currentUser && currentUser.isAdmin) {
        loadAdminData();
    }
}

// ==================== RELATÓRIOS ====================

// Enviar relatório
async function submitReport() {
    if (!currentUser) {
        showMessage('Usuário não logado', 'error');
        return;
    }
    
    const reportType = document.getElementById('reportType').value;
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    const fileInput = document.getElementById('reportFile');
    
    if (!reportType || !title || !description) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    try {
        showMessage('Enviando relatório...', 'info');
        
        let fileData = null;
        let fileName = null;
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName = file.name;
            fileData = await fileToBase64(file);
        }
        
        const response = await makeRequest('submitReport', {
            email: currentUser.email,
            reportType: reportType,
            title: title,
            description: description,
            fileName: fileName,
            fileData: fileData
        });
        
        if (response.success) {
            showMessage('Relatório enviado com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('reportType').value = '';
            document.getElementById('reportTitle').value = '';
            document.getElementById('reportDescription').value = '';
            document.getElementById('reportFile').value = '';
            
            // Atualizar estatísticas
            loadUserStats();
        } else {
            showMessage(response.message || 'Erro ao enviar relatório', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao enviar relatório:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

// ==================== ATIVIDADES ====================

// Cadastrar atividade
async function submitActivity() {
    if (!currentUser) {
        showMessage('Usuário não logado', 'error');
        return;
    }
    
    const name = document.getElementById('activityName').value.trim();
    const date = document.getElementById('activityDate').value;
    const description = document.getElementById('activityDescription').value.trim();
    const filesInput = document.getElementById('activityFiles');
    
    if (!name || !date || !description) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    try {
        showMessage('Cadastrando atividade...', 'info');
        
        let files = [];
        
        if (filesInput.files.length > 0) {
            for (let i = 0; i < filesInput.files.length; i++) {
                const file = filesInput.files[i];
                const fileData = await fileToBase64(file);
                files.push({
                    name: file.name,
                    data: fileData,
                    size: file.size,
                    type: file.type
                });
            }
        }
        
        const response = await makeRequest('submitActivity', {
            email: currentUser.email,
            name: name,
            date: date,
            description: description,
            files: files
        });
        
        if (response.success) {
            showMessage('Atividade cadastrada com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('activityName').value = '';
            document.getElementById('activityDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('activityDescription').value = '';
            document.getElementById('activityFiles').value = '';
            
            // Atualizar estatísticas
            loadUserStats();
        } else {
            showMessage(response.message || 'Erro ao cadastrar atividade', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao cadastrar atividade:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

// ==================== ARQUIVOS ====================

// Configurar upload de arquivos
function setupFileUpload() {
    const uploadArea = document.querySelector('.file-upload-area');
    const fileInput = document.getElementById('uploadFiles');
    
    if (!uploadArea || !fileInput) return;
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        fileInput.files = files;
        updateFileUploadDisplay(files);
    });
    
    // Mudança no input
    fileInput.addEventListener('change', (e) => {
        updateFileUploadDisplay(e.target.files);
    });
}

// Atualizar display de upload
function updateFileUploadDisplay(files) {
    const uploadArea = document.querySelector('.file-upload-area');
    if (!uploadArea) return;
    
    if (files.length > 0) {
        uploadArea.innerHTML = `
            <p>📁 ${files.length} arquivo(s) selecionado(s)</p>
            <p style="font-size: 0.9em; color: #666; margin-top: 10px;">Clique em "Enviar Arquivos" para fazer upload</p>
        `;
    } else {
        uploadArea.innerHTML = `
            <p>📁 Clique aqui ou arraste arquivos</p>
            <p style="font-size: 0.9em; color: #666; margin-top: 10px;">Formatos aceitos: PDF, DOC, DOCX, JPG, PNG, MP4, etc.</p>
        `;
    }
}

// Enviar arquivos
async function uploadFiles() {
    if (!currentUser) {
        showMessage('Usuário não logado', 'error');
        return;
    }
    
    const category = document.getElementById('fileCategory').value;
    const description = document.getElementById('fileDescription').value.trim();
    const filesInput = document.getElementById('uploadFiles');
    
    if (!category || !description) {
        showMessage('Por favor, preencha categoria e descrição', 'error');
        return;
    }
    
    if (filesInput.files.length === 0) {
        showMessage('Por favor, selecione pelo menos um arquivo', 'error');
        return;
    }
    
    try {
        showMessage('Enviando arquivos...', 'info');
        
        let files = [];
        
        for (let i = 0; i < filesInput.files.length; i++) {
            const file = filesInput.files[i];
            const fileData = await fileToBase64(file);
            files.push({
                name: file.name,
                data: fileData,
                size: file.size,
                type: file.type
            });
        }
        
        const response = await makeRequest('uploadFiles', {
            email: currentUser.email,
            category: category,
            description: description,
            files: files
        });
        
        if (response.success) {
            showMessage('Arquivos enviados com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('fileCategory').value = '';
            document.getElementById('fileDescription').value = '';
            document.getElementById('uploadFiles').value = '';
            updateFileUploadDisplay([]);
            
            // Atualizar estatísticas
            loadUserStats();
        } else {
            showMessage(response.message || 'Erro ao enviar arquivos', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao enviar arquivos:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

// ==================== ESTATÍSTICAS ====================

// Carregar estatísticas do usuário
async function loadUserStats() {
    if (!currentUser) return;
    
    try {
        const response = await makeRequest('getUserStats', {
            email: currentUser.email
        });
        
        if (response.success) {
            userStats = response.stats;
            updateStatsDisplay();
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Atualizar display das estatísticas
function updateStatsDisplay() {
    const statsReports = document.getElementById('statsReports');
    const statsActivities = document.getElementById('statsActivities');
    const statsFiles = document.getElementById('statsFiles');
    
    if (statsReports) statsReports.textContent = userStats.reports || 0;
    if (statsActivities) statsActivities.textContent = userStats.activities || 0;
    if (statsFiles) statsFiles.textContent = userStats.files || 0;
}

// ==================== ADMINISTRAÇÃO ====================

// Carregar dados administrativos
async function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('Acesso negado', 'error');
        return;
    }
    
    try {
        showMessage('Carregando dados administrativos...', 'info');
        
        const response = await makeRequest('getAdminData', {
            email: currentUser.email
        });
        
        if (response.success) {
            const data = response.data;
            
            // Atualizar estatísticas administrativas
            const adminStatsUsers = document.getElementById('adminStatsUsers');
            const adminStatsReports = document.getElementById('adminStatsReports');
            const adminStatsActivities = document.getElementById('adminStatsActivities');
            const adminStatsFiles = document.getElementById('adminStatsFiles');
            
            if (adminStatsUsers) adminStatsUsers.textContent = data.totalUsers || 0;
            if (adminStatsReports) adminStatsReports.textContent = data.totalReports || 0;
            if (adminStatsActivities) adminStatsActivities.textContent = data.totalActivities || 0;
            if (adminStatsFiles) adminStatsFiles.textContent = data.totalFiles || 0;
            
            showMessage('Dados administrativos carregados!', 'success');
        } else {
            showMessage(response.message || 'Erro ao carregar dados administrativos', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados administrativos:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

// Exportar dados
async function exportData() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('Acesso negado', 'error');
        return;
    }
    
    try {
        showMessage('Exportando dados...', 'info');
        
        const response = await makeRequest('exportData', {
            email: currentUser.email
        });
        
        if (response.success) {
            showMessage('Dados exportados! Abrindo planilha...', 'success');
            
            // Abrir planilha em nova aba
            if (response.spreadsheetUrl) {
                window.open(response.spreadsheetUrl, '_blank');
            }
        } else {
            showMessage(response.message || 'Erro ao exportar dados', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
}

// ==================== UTILITÁRIOS ====================

// Fazer requisição para Google Apps Script
async function makeRequest(action, data) {
    const requestData = {
        action: action,
        ...data
    };
    
    console.log('Enviando requisição:', action, requestData);
    
    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        mode: 'cors'
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Resposta recebida:', result);
    
    return result;
}

// Converter arquivo para base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remover prefixo "data:tipo/mime;base64,"
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Validar e-mail
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar mensagens
function showMessage(message, type) {
    // Remove mensagens existentes
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Cria nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Insere no container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        
        // Remove após 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// ==================== EVENTOS GLOBAIS ====================

// Permitir login com Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const loginScreen = document.getElementById('loginScreen');
        const registerScreen = document.getElementById('registerScreen');
        
        if (!loginScreen.classList.contains('hidden')) {
            login();
        } else if (!registerScreen.classList.contains('hidden')) {
            register();
        }
    }
});

// Prevenir perda de dados ao sair da página
window.addEventListener('beforeunload', function(e) {
    // Verificar se há dados não salvos nos formulários
    const forms = document.querySelectorAll('input, textarea, select');
    let hasUnsavedData = false;
    
    forms.forEach(field => {
        if (field.value && field.value.trim() !== '' && field.id !== 'email' && field.id !== 'password') {
            hasUnsavedData = true;
        }
    });
    
    if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = 'Você tem dados não salvos. Tem certeza que deseja sair?';
    }
});

console.log('Sistema CDR Sul Tocantins carregado - Versão 2.0');

