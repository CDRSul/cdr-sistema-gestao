// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_FORMATS: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'zip', 'rar', 'xlsx', 'ppt', 'xls']
};

// ==================== VARIÁVEIS GLOBAIS ====================
let currentUser = null;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('[CDR Sul] Sistema iniciado');
    
    // Verificar se há sessão salva
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard();
        } catch (e) {
            console.error('[CDR Sul] Erro ao carregar sessão:', e);
            localStorage.removeItem('currentUser');
        }
    }
    
    // Configurar eventos
    setupEventListeners();
    setupFileValidation();
});

function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Cadastro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Formulários do dashboard
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleSubmitReport);
    }
    
    const activityForm = document.getElementById('activityForm');
    if (activityForm) {
        activityForm.addEventListener('submit', handleSubmitActivity);
    }
    
    const fileForm = document.getElementById('fileForm');
    if (fileForm) {
        fileForm.addEventListener('submit', handleUploadFiles);
    }
    
    // Botões de navegação
    document.addEventListener('click', function(e) {
        if (e.target.matches('.tab-btn')) {
            showTab(e.target.dataset.tab);
        }
        
        if (e.target.matches('.logout-btn')) {
            handleLogout();
        }
        
        if (e.target.matches('.generate-pdf-btn')) {
            handleGeneratePDF();
        }
        
        if (e.target.matches('.show-register')) {
            showRegisterForm();
        }
        
        if (e.target.matches('.show-login')) {
            showLoginForm();
        }
    });
}

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
    const fileList = [];
    
    Array.from(files).forEach((file, index) => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        totalSize += file.size;
        
        fileList.push({
            name: file.name,
            size: fileSizeMB + 'MB'
        });
        
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
    
    // Exibir feedback
    const feedbackDiv = inputElement.parentNode.querySelector('.file-feedback') || 
                       createFileFeedback(inputElement);
    
    if (errors.length > 0) {
        feedbackDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>❌ Erros encontrados:</strong>
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
                <strong>⚠️ Avisos:</strong>
                <ul>${warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
            </div>
        `;
    } else {
        feedbackDiv.innerHTML = `
            <div class="alert alert-success">
                <strong>✅ Arquivos válidos:</strong>
                <ul>${fileList.map(file => `<li>${file.name} (${file.size})</li>`).join('')}</ul>
                <small>Total: ${totalSizeMB}MB</small>
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
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    // Feedback visual
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Fazendo login...';
    submitBtn.disabled = true;
    
    try {
        const result = await makeRequest('login', { email, password });
        
        if (result.success) {
            currentUser = result.data.user || result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            submitBtn.textContent = 'Login realizado!';
            showAlert('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                showDashboard();
            }, 1000);
        } else {
            throw new Error(result.error || 'Erro no login');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro no login:', error);
        showAlert(`Erro no login: ${error.message}`, 'error');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validações
    if (!data.name || !data.email || !data.institution || !data.project || !data.password) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    if (data.password !== data.confirmPassword) {
        showAlert('As senhas não coincidem', 'error');
        return;
    }
    
    // Feedback visual
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Criando conta...';
    submitBtn.disabled = true;
    
    try {
        const result = await makeRequest('register', data);
        
        if (result.success) {
            submitBtn.textContent = 'Conta criada!';
            showAlert('Usuário cadastrado com sucesso! Faça login para continuar.', 'success');
            
            setTimeout(() => {
                showLoginForm();
            }, 2000);
        } else {
            throw new Error(result.error || 'Erro no cadastro');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro no cadastro:', error);
        showAlert(`Erro no cadastro: ${error.message}`, 'error');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginForm();
    showAlert('Logout realizado com sucesso', 'success');
}

// ==================== FUNÇÕES DO DASHBOARD ====================
async function handleSubmitReport(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.userEmail = currentUser.email;
    
    const files = e.target.querySelector('input[type="file"]').files;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Feedback visual
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando relatório...';
    submitBtn.disabled = true;
    
    try {
        const result = await makeRequest('submitReport', data, files);
        
        if (result.success) {
            submitBtn.textContent = 'Relatório enviado!';
            showAlert('Relatório enviado com sucesso!', 'success');
            e.target.reset();
            
            // Limpar feedback de arquivos
            const feedback = e.target.querySelector('.file-feedback');
            if (feedback) feedback.innerHTML = '';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        } else {
            throw new Error(result.error || 'Erro ao enviar relatório');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar relatório:', error);
        showAlert(`Erro ao enviar relatório: ${error.message}`, 'error');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSubmitActivity(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.userEmail = currentUser.email;
    
    const files = e.target.querySelector('input[type="file"]').files;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Feedback visual
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Cadastrando atividade...';
    submitBtn.disabled = true;
    
    try {
        const result = await makeRequest('submitActivity', data, files);
        
        if (result.success) {
            submitBtn.textContent = 'Atividade cadastrada!';
            showAlert('Atividade cadastrada com sucesso!', 'success');
            e.target.reset();
            
            // Limpar feedback de arquivos
            const feedback = e.target.querySelector('.file-feedback');
            if (feedback) feedback.innerHTML = '';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        } else {
            throw new Error(result.error || 'Erro ao cadastrar atividade');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao cadastrar atividade:', error);
        showAlert(`Erro ao cadastrar atividade: ${error.message}`, 'error');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleUploadFiles(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.userEmail = currentUser.email;
    
    const files = e.target.querySelector('input[type="file"]').files;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!files || files.length === 0) {
        showAlert('Por favor, selecione pelo menos um arquivo', 'error');
        return;
    }
    
    // Feedback visual
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando arquivos...';
    submitBtn.disabled = true;
    
    try {
        const result = await makeRequest('uploadFiles', data, files);
        
        if (result.success) {
            submitBtn.textContent = 'Arquivos enviados!';
            showAlert(`${result.data?.count || files.length} arquivo(s) enviados com sucesso!`, 'success');
            e.target.reset();
            
            // Limpar feedback de arquivos
            const feedback = e.target.querySelector('.file-feedback');
            if (feedback) feedback.innerHTML = '';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        } else {
            throw new Error(result.error || 'Erro ao enviar arquivos');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao enviar arquivos:', error);
        showAlert(`Erro ao enviar arquivos: ${error.message}`, 'error');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleGeneratePDF() {
    const btn = document.querySelector('.generate-pdf-btn');
    if (!btn) return;
    
    const originalText = btn.textContent;
    btn.textContent = 'Gerando PDF...';
    btn.disabled = true;
    
    try {
        const result = await makeRequest('generatePDF', { userEmail: currentUser.email });
        
        if (result.success && result.data?.pdfUrl) {
            btn.textContent = 'PDF gerado!';
            showAlert('Relatório PDF gerado com sucesso!', 'success');
            
            // Abrir PDF em nova aba
            window.open(result.data.pdfUrl, '_blank');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        } else {
            throw new Error(result.error || 'Erro ao gerar PDF');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao gerar PDF:', error);
        showAlert(`Erro ao gerar PDF: ${error.message}`, 'error');
        
        btn.textContent = originalText;
        btn.disabled = false;
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
    
    // Mostrar primeira aba
    showTab('overview');
    
    // Carregar dados se for admin
    if (currentUser?.isAdmin) {
        loadAdminData();
    }
}

function updateUserInfo() {
    if (!currentUser) return;
    
    const userNameElements = document.querySelectorAll('.user-name');
    const userEmailElements = document.querySelectorAll('.user-email');
    const userInstitutionElements = document.querySelectorAll('.user-institution');
    
    userNameElements.forEach(el => el.textContent = currentUser.name);
    userEmailElements.forEach(el => el.textContent = currentUser.email);
    userInstitutionElements.forEach(el => el.textContent = currentUser.institution);
    
    // Mostrar/ocultar aba admin
    const adminTab = document.querySelector('[data-tab="admin"]');
    if (adminTab) {
        adminTab.style.display = currentUser.isAdmin ? 'block' : 'none';
    }
}

function showTab(tabName) {
    // Ocultar todas as abas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Remover classe ativa de todos os botões
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar aba selecionada
    const selectedTab = document.getElementById(`${tabName}Tab`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Ativar botão correspondente
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Carregar dados específicos da aba
    if (tabName === 'overview') {
        loadOverviewData();
    } else if (tabName === 'admin' && currentUser?.isAdmin) {
        loadAdminData();
    }
}

async function loadOverviewData() {
    try {
        // Carregar estatísticas do usuário
        const [reports, activities, files] = await Promise.all([
            makeRequest('getReports', { userEmail: currentUser.email }),
            makeRequest('getActivities', { userEmail: currentUser.email }),
            makeRequest('getFiles', { userEmail: currentUser.email })
        ]);
        
        // Atualizar contadores
        updateCounter('reportsCount', reports.data?.length || 0);
        updateCounter('activitiesCount', activities.data?.length || 0);
        updateCounter('filesCount', files.data?.length || 0);
        
        // Atualizar listas
        updateRecentList('recentReports', reports.data?.slice(0, 5) || []);
        updateRecentList('recentActivities', activities.data?.slice(0, 5) || []);
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar dados da visão geral:', error);
    }
}

async function loadAdminData() {
    if (!currentUser?.isAdmin) return;
    
    try {
        // Carregar dados administrativos
        const [users, allReports, allActivities, allFiles] = await Promise.all([
            makeRequest('getUsers'),
            makeRequest('getReports'),
            makeRequest('getActivities'),
            makeRequest('getFiles')
        ]);
        
        // Atualizar estatísticas administrativas
        updateCounter('totalUsers', users.data?.length || 0);
        updateCounter('totalReports', allReports.data?.length || 0);
        updateCounter('totalActivities', allActivities.data?.length || 0);
        updateCounter('totalFiles', allFiles.data?.length || 0);
        
        // Atualizar lista de usuários
        updateUsersList(users.data || []);
        
    } catch (error) {
        console.error('[CDR Sul] Erro ao carregar dados administrativos:', error);
    }
}

function updateCounter(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = count;
    }
}

function updateRecentList(elementId, items) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (items.length === 0) {
        element.innerHTML = '<p>Nenhum item encontrado</p>';
        return;
    }
    
    const html = items.map(item => `
        <div class="recent-item">
            <h4>${item.title}</h4>
            <p>${item.description || ''}</p>
            <small>${new Date(item.date || item.createdAt).toLocaleDateString('pt-BR')}</small>
        </div>
    `).join('');
    
    element.innerHTML = html;
}

function updateUsersList(users) {
    const element = document.getElementById('usersList');
    if (!element) return;
    
    if (users.length === 0) {
        element.innerHTML = '<p>Nenhum usuário encontrado</p>';
        return;
    }
    
    const html = users.map(user => `
        <div class="user-card">
            <h4>${user.name}</h4>
            <p>${user.email}</p>
            <p>${user.institution}</p>
            <p><strong>Projeto:</strong> ${user.project}</p>
            <button class="btn btn-secondary" onclick="generateUserPDF('${user.email}')">
                Relatório PDF
            </button>
        </div>
    `).join('');
    
    element.innerHTML = html;
}

async function generateUserPDF(userEmail) {
    try {
        const result = await makeRequest('generatePDF', { userEmail });
        
        if (result.success && result.data?.pdfUrl) {
            showAlert('Relatório PDF gerado com sucesso!', 'success');
            window.open(result.data.pdfUrl, '_blank');
        } else {
            throw new Error(result.error || 'Erro ao gerar PDF');
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao gerar PDF do usuário:', error);
        showAlert(`Erro ao gerar PDF: ${error.message}`, 'error');
    }
}

function showAlert(message, type = 'info') {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert-notification');
    existingAlerts.forEach(alert => alert.remove());
    
    // Criar novo alerta
    const alert = document.createElement('div');
    alert.className = `alert-notification alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Adicionar ao topo da página
    document.body.insertBefore(alert, document.body.firstChild);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

// ==================== ESTILOS DINÂMICOS ====================
const styles = `
.alert-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.alert-success { background-color: #28a745; }
.alert-error { background-color: #dc3545; }
.alert-warning { background-color: #ffc107; color: #000; }
.alert-info { background-color: #17a2b8; }

.alert-notification button {
    background: none;
    border: none;
    color: inherit;
    font-size: 20px;
    float: right;
    cursor: pointer;
    margin-left: 10px;
}

.file-feedback {
    margin-top: 10px;
    padding: 10px;
    border-radius: 4px;
}

.alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.alert-warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
.alert-danger { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

.recent-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
    margin-bottom: 10px;
}

.recent-item h4 {
    margin: 0 0 5px 0;
    color: #333;
}

.recent-item p {
    margin: 0 0 5px 0;
    color: #666;
}

.recent-item small {
    color: #999;
}

.user-card {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 15px;
}

.user-card h4 {
    margin: 0 0 10px 0;
    color: #333;
}

.user-card p {
    margin: 5px 0;
    color: #666;
}

.user-card button {
    margin-top: 10px;
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
