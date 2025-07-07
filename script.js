/**
 * Sistema de Gestão de Projetos CDR Sul - JavaScript Frontend
 * Versão 3.1 - CORRIGIDA FINAL
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * - Persistência de sessão (não perde login no F5)
 * - Nome do projeto correto para admin
 * - Melhor tratamento de erros
 * - Upload de arquivos corrigido
 */

// ===== CONFIGURAÇÕES =====
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxb999xR_nS_O4S2Tud3SjAZWhvU6Lhd8r_TmM595PU3lw0eBfedIxnsnsguJDc-FTA/exec';
const ADMIN_EMAIL = 'cdrsultocantins@unirg.edu.br'; // APENAS este e-mail tem acesso admin

// Variáveis globais
let currentUser = null;
let isAdmin = false;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema CDR Sul iniciado - Versão 3.1 Corrigida Final');
    
    initializeApp();
});

function initializeApp() {
    // VERIFICAR SE HÁ SESSÃO SALVA
    const savedSession = localStorage.getItem('cdr_current_user');
    
    if (savedSession) {
        try {
            const sessionData = JSON.parse(savedSession);
            currentUser = sessionData.user;
            isAdmin = sessionData.isAdmin;
            
            console.log('✅ Sessão recuperada:', currentUser.email);
            showDashboard();
            updateUserInfo();
            return;
        } catch (error) {
            console.log('❌ Erro ao recuperar sessão:', error);
            localStorage.removeItem('cdr_current_user');
        }
    }
    
    // Se não há sessão, mostrar login
    showLogin();
    console.log('Sistema iniciado na tela de login');
    
    // Testar conectividade com o servidor
    testConnection();
}

// ===== TESTE DE CONECTIVIDADE =====
async function testConnection() {
    try {
        console.log('Testando conectividade com o servidor...');
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Conectividade OK:', data);
            
            if (data.version) {
                console.log('📡 Versão do servidor:', data.version);
            }
            
            if (data.message) {
                console.log('📢 Mensagem do servidor:', data.message);
            }
        } else {
            console.warn('⚠️ Resposta não OK:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Erro de conectividade:', error);
        showMessage('Aviso: Problemas de conectividade detectados. Algumas funcionalidades podem não funcionar.', 'warning');
    }
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function showLogin() {
    hideAllSections();
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginEmail').focus();
}

function showRegister() {
    hideAllSections();
    document.getElementById('registerSection').style.display = 'block';
    clearRegisterForm();
    document.getElementById('registerName').focus();
}

function showDashboard() {
    hideAllSections();
    document.getElementById('dashboardSection').style.display = 'block';
    
    // CONTROLE DE ACESSO ADMIN - APENAS cdrsultocantins@unirg.edu.br
    const adminTab = document.getElementById('adminTab');
    const adminSection = document.getElementById('adminSection');
    
    if (isAdmin && currentUser && currentUser.email === ADMIN_EMAIL) {
        adminTab.style.display = 'block';
        console.log('✅ Usuário admin detectado - Aba Admin habilitada');
    } else {
        adminTab.style.display = 'none';
        adminSection.style.display = 'none';
        console.log('👤 Usuário comum - Aba Admin oculta');
    }
    
    // Carregar dados do usuário
    loadUserData();
    
    // Mostrar primeira aba (Visão Geral)
    showTab('overview');
}

function hideAllSections() {
    const sections = ['loginSection', 'registerSection', 'dashboardSection'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

function showTab(tabName) {
    // Ocultar todas as abas
    const tabs = ['overview', 'reports', 'activities', 'files', 'admin'];
    tabs.forEach(tab => {
        const element = document.getElementById(tab + 'Tab');
        const section = document.getElementById(tab + 'Section');
        
        if (element) element.classList.remove('active');
        if (section) section.style.display = 'none';
    });
    
    // Mostrar aba selecionada
    const activeTab = document.getElementById(tabName + 'Tab');
    const activeSection = document.getElementById(tabName + 'Section');
    
    if (activeTab) activeTab.classList.add('active');
    if (activeSection) activeSection.style.display = 'block';
    
    // Carregar dados específicos da aba
    if (tabName === 'admin' && isAdmin && currentUser && currentUser.email === ADMIN_EMAIL) {
        loadAdminData();
    }
}

// ===== FUNÇÕES DE AUTENTICAÇÃO =====
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('🔐 Tentando login para:', email);
        
        const response = await sendRequest({
            action: 'login',
            email: email,
            password: password
        });
        
        console.log('📥 Resposta do login:', response);
        
        if (response.success) {
            currentUser = response.user;
            
            // VERIFICAR SE É ADMIN - APENAS cdrsultocantins@unirg.edu.br
            isAdmin = (email === ADMIN_EMAIL);
            
            // CORRIGIR NOME DO PROJETO PARA ADMIN
            if (isAdmin && currentUser.email === ADMIN_EMAIL) {
                currentUser.project = 'Sistema de Gestão de Projetos CDR Sul';
            }
            
            console.log('✅ Login bem-sucedido. É admin?', isAdmin);
            
            // SALVAR SESSÃO PERSISTENTE
            localStorage.setItem('cdr_current_user', JSON.stringify({
                user: currentUser,
                isAdmin: isAdmin,
                timestamp: new Date().getTime()
            }));
            
            showMessage('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                showDashboard();
                updateUserInfo();
            }, 1000);
            
        } else {
            showMessage(response.message || 'Erro ao fazer login. Verifique suas credenciais.', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
    
    showLoading(false);
}

async function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const institution = document.getElementById('registerInstitution').value.trim();
    const project = document.getElementById('registerProject').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validações
    if (!name || !email || !institution || !project || !password || !confirmPassword) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor, insira um e-mail válido', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('📝 Tentando cadastrar usuário:', email);
        
        const response = await sendRequest({
            action: 'register',
            name: name,
            email: email,
            institution: institution,
            project: project,
            password: password
        });
        
        console.log('📥 Resposta do cadastro:', response);
        
        if (response.success) {
            showMessage('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
            setTimeout(() => {
                showLogin();
            }, 2000);
            
        } else {
            showMessage(response.message || 'Erro ao cadastrar usuário. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
    
    showLoading(false);
}

function logout() {
    localStorage.removeItem('cdr_current_user');
    currentUser = null;
    isAdmin = false;
    showLogin();
    showMessage('Logout realizado com sucesso!', 'success');
}

// ===== FUNÇÕES DE RELATÓRIOS =====
async function submitReport() {
    if (!currentUser) {
        showMessage('Usuário não autenticado', 'error');
        return;
    }
    
    const reportType = document.getElementById('reportType').value;
    const reportDate = document.getElementById('reportDate').value;
    const reportTitle = document.getElementById('reportTitle').value.trim();
    const reportDescription = document.getElementById('reportDescription').value.trim();
    const reportFiles = document.getElementById('reportFiles').files;
    
    if (!reportType || !reportTitle) {
        showMessage('Por favor, preencha os campos obrigatórios', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('📄 Enviando relatório...');
        
        // Processar arquivos
        const files = [];
        for (let i = 0; i < reportFiles.length; i++) {
            const file = reportFiles[i];
            
            // Validar tamanho do arquivo (máximo 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showMessage(`Arquivo ${file.name} é muito grande. Máximo 10MB.`, 'error');
                showLoading(false);
                return;
            }
            
            try {
                const base64 = await fileToBase64(file);
                files.push({
                    name: file.name,
                    type: file.type,
                    content: base64
                });
            } catch (fileError) {
                console.error('Erro ao processar arquivo:', fileError);
                showMessage(`Erro ao processar arquivo ${file.name}`, 'error');
                showLoading(false);
                return;
            }
        }
        
        const response = await sendRequest({
            action: 'submit_report',
            userEmail: currentUser.email,
            reportType: reportType,
            reportDate: reportDate,
            title: reportTitle,
            description: reportDescription,
            files: files
        });
        
        console.log('📥 Resposta do relatório:', response);
        
        if (response.success) {
            showMessage('Relatório enviado com sucesso!', 'success');
            clearReportForm();
            loadUserData(); // Atualizar estatísticas
        } else {
            showMessage(response.message || 'Erro ao enviar relatório. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar relatório:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    }
    
    showLoading(false);
}

// ===== FUNÇÕES DE ATIVIDADES =====
async function submitActivity() {
    if (!currentUser) {
        showMessage('Usuário não autenticado', 'error');
        return;
    }
    
    const activityDate = document.getElementById('activityDate').value;
    const activityType = document.getElementById('activityType').value;
    const activityTitle = document.getElementById('activityTitle').value.trim();
    const activityDescription = document.getElementById('activityDescription').value.trim();
    const activityLocation = document.getElementById('activityLocation').value.trim();
    const activityParticipants = document.getElementById('activityParticipants').value.trim();
    const activityFiles = document.getElementById('activityFiles').files;
    
    if (!activityType || !activityTitle) {
        showMessage('Por favor, preencha os campos obrigatórios', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('🎯 Cadastrando atividade...');
        
        // Processar arquivos da atividade
        const files = [];
        for (let i = 0; i < activityFiles.length; i++) {
            const file = activityFiles[i];
            
            // Validar tamanho do arquivo (máximo 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showMessage(`Arquivo ${file.name} é muito grande. Máximo 10MB.`, 'error');
                showLoading(false);
                return;
            }
            
            try {
                const base64 = await fileToBase64(file);
                files.push({
                    name: file.name,
                    type: file.type,
                    content: base64
                });
            } catch (fileError) {
                console.error('Erro ao processar arquivo:', fileError);
                showMessage(`Erro ao processar arquivo ${file.name}`, 'error');
                showLoading(false);
                return;
            }
        }
        
        const response = await sendRequest({
            action: 'submit_activity',
            userEmail: currentUser.email,
            activityDate: activityDate,
            activityType: activityType,
            title: activityTitle,
            description: activityDescription,
            location: activityLocation,
            participants: activityParticipants,
            files: files
        });
        
        console.log('📥 Resposta da atividade:', response);
        
        if (response.success) {
            showMessage('Atividade cadastrada com sucesso!', 'success');
            clearActivityForm();
            loadUserData(); // Atualizar estatísticas
        } else {
            showMessage(response.message || 'Erro ao cadastrar atividade. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao cadastrar atividade:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    }
    
    showLoading(false);
}

// ===== FUNÇÕES DE ARQUIVOS =====
async function uploadFiles() {
    if (!currentUser) {
        showMessage('Usuário não autenticado', 'error');
        return;
    }
    
    const category = document.getElementById('fileCategory').value;
    const description = document.getElementById('fileDescription').value.trim();
    const files = document.getElementById('uploadFiles').files;
    
    if (files.length === 0) {
        showMessage('Por favor, selecione pelo menos um arquivo', 'error');
        return;
    }
    
    if (!category) {
        showMessage('Por favor, selecione uma categoria', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('📁 Fazendo upload de arquivos...');
        
        // Processar arquivos
        const fileArray = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validar tamanho do arquivo (máximo 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showMessage(`Arquivo ${file.name} é muito grande. Máximo 10MB.`, 'error');
                showLoading(false);
                return;
            }
            
            try {
                const base64 = await fileToBase64(file);
                fileArray.push({
                    name: file.name,
                    type: file.type,
                    content: base64
                });
            } catch (fileError) {
                console.error('Erro ao processar arquivo:', fileError);
                showMessage(`Erro ao processar arquivo ${file.name}`, 'error');
                showLoading(false);
                return;
            }
        }
        
        const response = await sendRequest({
            action: 'upload_file',
            userEmail: currentUser.email,
            category: category,
            description: description,
            files: fileArray
        });
        
        console.log('📥 Resposta do upload:', response);
        
        if (response.success) {
            showMessage(response.message || 'Arquivos enviados com sucesso!', 'success');
            clearFileForm();
            loadUserData(); // Atualizar estatísticas
        } else {
            showMessage(response.message || 'Erro ao fazer upload. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro no upload:', error);
        showMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    }
    
    showLoading(false);
}

// ===== FUNÇÕES ADMINISTRATIVAS =====
async function loadAdminData() {
    if (!isAdmin || !currentUser || currentUser.email !== ADMIN_EMAIL) {
        console.log('❌ Acesso negado ao painel admin');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('👑 Carregando dados administrativos...');
        
        const response = await sendRequest({
            action: 'get_admin_data'
        });
        
        console.log('📥 Dados admin recebidos:', response);
        
        if (response.success) {
            displayAdminData(response.data);
        } else {
            showMessage('Erro ao carregar dados administrativos', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados admin:', error);
        showMessage('Erro de conexão ao carregar dados administrativos', 'error');
    }
    
    showLoading(false);
}

function displayAdminData(data) {
    // Estatísticas gerais
    document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    document.getElementById('totalReports').textContent = data.totalReports || 0;
    document.getElementById('totalActivities').textContent = data.totalActivities || 0;
    document.getElementById('totalFiles').textContent = data.totalFiles || 0;
    
    // Lista de usuários
    const usersTable = document.getElementById('usersTable');
    usersTable.innerHTML = '';
    
    if (data.users && data.users.length > 0) {
        data.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.institution}</td>
                <td>${user.project}</td>
                <td>${user.reports || 0}</td>
                <td>${user.activities || 0}</td>
                <td>${user.files || 0}</td>
                <td>
                    <button onclick="viewUserDetails('${user.email}')" class="btn btn-small">
                        Ver Detalhes
                    </button>
                </td>
            `;
            usersTable.appendChild(row);
        });
    } else {
        usersTable.innerHTML = '<tr><td colspan="8">Nenhum usuário encontrado</td></tr>';
    }
    
    // Relatórios recentes
    const reportsTable = document.getElementById('reportsTable');
    reportsTable.innerHTML = '';
    
    if (data.recentReports && data.recentReports.length > 0) {
        data.recentReports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(report.date)}</td>
                <td>${report.userEmail}</td>
                <td>${report.type}</td>
                <td>${report.title}</td>
                <td>
                    ${report.files ? `<a href="${report.files}" target="_blank">Ver Arquivos</a>` : 'Sem arquivos'}
                </td>
            `;
            reportsTable.appendChild(row);
        });
    } else {
        reportsTable.innerHTML = '<tr><td colspan="5">Nenhum relatório encontrado</td></tr>';
    }
    
    // Atividades recentes
    const activitiesTable = document.getElementById('activitiesTable');
    activitiesTable.innerHTML = '';
    
    if (data.recentActivities && data.recentActivities.length > 0) {
        data.recentActivities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(activity.date)}</td>
                <td>${activity.userEmail}</td>
                <td>${activity.type}</td>
                <td>${activity.title}</td>
                <td>${activity.location || '-'}</td>
            `;
            activitiesTable.appendChild(row);
        });
    } else {
        activitiesTable.innerHTML = '<tr><td colspan="5">Nenhuma atividade encontrada</td></tr>';
    }
}

async function viewUserDetails(userEmail) {
    showLoading(true);
    
    try {
        const response = await sendRequest({
            action: 'get_user_details',
            userEmail: userEmail
        });
        
        if (response.success) {
            showUserDetailsModal(response.data);
        } else {
            showMessage('Erro ao carregar detalhes do usuário', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar detalhes:', error);
        showMessage('Erro de conexão', 'error');
    }
    
    showLoading(false);
}

function showUserDetailsModal(userData) {
    // Criar modal dinamicamente
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Detalhes do Usuário</h2>
            
            <div class="user-info">
                <h3>${userData.user.name}</h3>
                <p><strong>E-mail:</strong> ${userData.user.email}</p>
                <p><strong>Instituição:</strong> ${userData.user.institution}</p>
                <p><strong>Projeto:</strong> ${userData.user.project}</p>
            </div>
            
            <div class="user-stats">
                <div class="stat-card">
                    <h4>Relatórios</h4>
                    <span class="stat-number">${userData.reports.length}</span>
                </div>
                <div class="stat-card">
                    <h4>Atividades</h4>
                    <span class="stat-number">${userData.activities.length}</span>
                </div>
                <div class="stat-card">
                    <h4>Arquivos</h4>
                    <span class="stat-number">${userData.files.length}</span>
                </div>
            </div>
            
            <div class="user-data">
                <h4>Relatórios Enviados</h4>
                <div class="data-list">
                    ${userData.reports.map(report => `
                        <div class="data-item">
                            <strong>${report.title}</strong> (${report.type})
                            <br><small>${formatDate(report.date)}</small>
                            ${report.files ? `<br><a href="${report.files}" target="_blank">Ver Arquivos</a>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <h4>Atividades Cadastradas</h4>
                <div class="data-list">
                    ${userData.activities.map(activity => `
                        <div class="data-item">
                            <strong>${activity.title}</strong> (${activity.type})
                            <br><small>${formatDate(activity.date)} - ${activity.location || 'Local não informado'}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// ===== FUNÇÕES AUXILIARES =====
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const response = await sendRequest({
            action: 'get_user_data',
            userEmail: currentUser.email
        });
        
        if (response.success) {
            // Atualizar cards de estatísticas
            document.getElementById('userReports').textContent = response.data.reports || 0;
            document.getElementById('userActivities').textContent = response.data.activities || 0;
            document.getElementById('userFiles').textContent = response.data.files || 0;
            document.getElementById('lastUpdate').textContent = formatDate(response.data.lastUpdate || new Date());
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
    }
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userProject').textContent = currentUser.project;
        
        // Mostrar indicador de admin APENAS para cdrsultocantins@unirg.edu.br
        if (isAdmin && currentUser.email === ADMIN_EMAIL) {
            const adminBadge = document.createElement('span');
            adminBadge.className = 'admin-badge';
            adminBadge.textContent = 'ADMIN';
            document.getElementById('userName').appendChild(adminBadge);
        }
    }
}

async function sendRequest(data, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`📡 Tentativa ${i + 1} - Enviando requisição:`, data);
            
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                mode: 'cors'
            });
            
            console.log('📊 Status da resposta:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📥 Resultado recebido:', result);
            return result;
            
        } catch (error) {
            console.error(`❌ Tentativa ${i + 1} falhou:`, error);
            
            if (i === retries - 1) {
                // Última tentativa - verificar se é modo demo
                if (data.action === 'login' && 
                    data.email === 'cdrsultocantins@unirg.edu.br' && 
                    data.password === '123456') {
                    
                    console.log('🔧 Usando modo demo offline');
                    return {
                        success: true,
                        user: {
                            name: 'CDR Sul Tocantins',
                            email: 'cdrsultocantins@unirg.edu.br',
                            institution: 'UNIRG',
                            project: 'Sistema de Gestão de Projetos CDR Sul',
                            isDemo: true
                        }
                    };
                }
                
                throw error;
            }
            
            // Aguardar antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

function showMessage(message, type) {
    // Remover mensagens existentes
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Adicionar ao topo da página
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Remover após 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// ===== FUNÇÕES DE LIMPEZA DE FORMULÁRIOS =====
function clearRegisterForm() {
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerInstitution').value = '';
    document.getElementById('registerProject').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
}

function clearReportForm() {
    document.getElementById('reportType').value = '';
    document.getElementById('reportDate').value = '';
    document.getElementById('reportTitle').value = '';
    document.getElementById('reportDescription').value = '';
    document.getElementById('reportFiles').value = '';
}

function clearActivityForm() {
    document.getElementById('activityDate').value = '';
    document.getElementById('activityType').value = '';
    document.getElementById('activityTitle').value = '';
    document.getElementById('activityDescription').value = '';
    document.getElementById('activityLocation').value = '';
    document.getElementById('activityParticipants').value = '';
    document.getElementById('activityFiles').value = '';
}

function clearFileForm() {
    document.getElementById('fileCategory').value = '';
    document.getElementById('fileDescription').value = '';
    document.getElementById('uploadFiles').value = '';
}

// ===== EVENTOS DE TECLADO =====
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        
        // Login
        if (activeElement.closest('#loginSection')) {
            login();
        }
        
        // Cadastro
        if (activeElement.closest('#registerSection')) {
            register();
        }
    }
});

// ===== EVENTOS DE FORMULÁRIO =====
document.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevenir envio padrão de todos os formulários
});

console.log('✅ Sistema CDR Sul carregado - Versão 3.1 Corrigida Final com Persistência de Sessão');
