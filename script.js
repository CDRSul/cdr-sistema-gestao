// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec',
    VERSION: '4.0 - FINAL FUNCIONANDO COM MELHORIAS',
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
    
    // Testar conectividade
    testConnectivity();
    
    // Mostrar tela inicial
    if (!currentUser) {
        showLoginScreen();
    }
});

// ==================== SISTEMA DE ALERTAS CENTRALIZADOS ====================
function showAlert(message, type = 'info', title = null) {
    const overlay = document.getElementById('alertOverlay');
    const box = document.getElementById('alertBox');
    const icon = document.getElementById('alertIcon');
    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    
    // Configurar tipo
    box.className = `alert-box ${type}`;
    icon.className = `alert-icon ${type}`;
    
    // Configurar ícones
    switch (type) {
        case 'success':
            icon.textContent = '✅';
            titleEl.textContent = title || 'Sucesso';
            break;
        case 'error':
            icon.textContent = '❌';
            titleEl.textContent = title || 'Erro';
            break;
        case 'info':
        default:
            icon.textContent = 'ℹ️';
            titleEl.textContent = title || 'Informação';
            break;
    }
    
    messageEl.textContent = message;
    
    // Mostrar overlay
    overlay.classList.add('show');
    
    // Auto-hide após 8 segundos para sucesso
    if (type === 'success') {
        setTimeout(() => {
            hideAlert();
        }, 8000);
    }
}

function hideAlert() {
    const overlay = document.getElementById('alertOverlay');
    overlay.classList.remove('show');
}

// ==================== VERIFICAR SESSÃO SALVA ====================
function checkSavedSession() {
    try {
        const savedUser = localStorage.getItem('cdr_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            isLoggedIn = true;
            console.log('[CDR Sul] Usuário recuperado da sessão:', currentUser.email);
            showDashboard(currentUser);
        }
    } catch (error) {
        console.error('[CDR Sul] Erro ao recuperar sessão:', error);
        localStorage.removeItem('cdr_user');
    }
}

// ==================== TESTAR CONECTIVIDADE ====================
async function testConnectivity() {
    try {
        console.log('[CDR Sul] Testando conectividade...');
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('[CDR Sul] ✅ Conectividade OK:', data.version);
        } else {
            console.log('[CDR Sul] ⚠️ Resposta não OK:', response.status);
        }
    } catch (error) {
        console.log('[CDR Sul] ❌ Erro de conectividade:', error);
    }
}

// ==================== MOSTRAR TELA DE LOGIN ====================
function showLoginScreen() {
    document.querySelector('.main-container').innerHTML = `
        <div class="login-container">
            <div class="login-header">
                <img src="https://static.wixstatic.com/media/96b2d1_82005fa5efee493fb11c905fa9b56a83~mv2.png" alt="CDR Sul Tocantins" class="logo">
                <h1>Sistema de Gestão de Projetos CDR Sul</h1>
                <p>Tudo sobre o seu projeto, reunido em um só lugar</p>
            </div>
            
            <div class="login-form-container">
                <h2>Acesso ao Sistema</h2>
                
                <form id="loginForm">
                    <div class="form-group">
                        <label for="loginEmail">E-mail:</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Senha:</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    
                    <button type="submit" class="btn-primary" id="loginBtn">
                        <span class="btn-text">Entrar</span>
                    </button>
                </form>
                
                <p class="register-link">
                    Não tem conta? <a href="#" onclick="showRegisterScreen()">Cadastre-se aqui</a>
                </p>
            </div>
            
            <div class="footer">
                <p>Desenvolvido pela equipe do CDR Sul Tocantins - Versão 4.0</p>
            </div>
        </div>
    `;
    
    // Configurar event listener do formulário
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// ==================== MOSTRAR TELA DE CADASTRO ====================
function showRegisterScreen() {
    document.querySelector('.main-container').innerHTML = `
        <div class="login-container">
            <div class="login-header">
                <img src="https://static.wixstatic.com/media/96b2d1_82005fa5efee493fb11c905fa9b56a83~mv2.png" alt="CDR Sul Tocantins" class="logo">
                <h1>Sistema de Gestão de Projetos CDR Sul</h1>
                <p>Cadastro de Novo Usuário</p>
            </div>
            
            <div class="login-form-container">
                <h2>Criar Conta</h2>
                
                <form id="registerForm">
                    <div class="form-group">
                        <label for="registerName">Nome Completo:</label>
                        <input type="text" id="registerName" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="registerEmail">E-mail:</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="registerInstitution">Instituição:</label>
                        <input type="text" id="registerInstitution" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="registerProject">Nome do Projeto:</label>
                        <input type="text" id="registerProject" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="registerPassword">Senha:</label>
                        <input type="password" id="registerPassword" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label for="registerConfirmPassword">Confirmar Senha:</label>
                        <input type="password" id="registerConfirmPassword" required minlength="6">
                    </div>
                    
                    <button type="submit" class="btn-primary" id="registerBtn">
                        <span class="btn-text">Cadastrar</span>
                    </button>
                </form>
                
                <p class="register-link">
                    Já tem conta? <a href="#" onclick="showLoginScreen()">Faça login aqui</a>
                </p>
            </div>
        </div>
    `;
    
    // Configurar event listener do formulário
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

// ==================== PROCESSAR LOGIN ====================
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const btnText = btn.querySelector('.btn-text');
    
    console.log('[CDR Sul] Tentando login:', email);
    
    // Mostrar loading
    btn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Fazendo login...';
    
    try {
        const result = await sendRequest({
            action: 'login',
            email: email,
            password: password
        });
        
        if (result.success) {
            console.log('[CDR Sul] ✅ Login bem-sucedido:', result.user);
            currentUser = result.user;
            isLoggedIn = true;
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            
            showAlert('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                showDashboard(currentUser);
            }, 1500);
        } else {
            showAlert('Erro no login: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro no login:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        // Restaurar botão
        btn.disabled = false;
        btnText.textContent = 'Entrar';
    }
}

// ==================== PROCESSAR CADASTRO ====================
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const institution = document.getElementById('registerInstitution').value;
    const project = document.getElementById('registerProject').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const btn = document.getElementById('registerBtn');
    const btnText = btn.querySelector('.btn-text');
    
    if (password !== confirmPassword) {
        showAlert('As senhas não coincidem!', 'error');
        return;
    }
    
    console.log('[CDR Sul] Tentando cadastro:', email);
    
    // Mostrar loading
    btn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Criando conta...';
    
    try {
        const result = await sendRequest({
            action: 'register',
            name: name,
            email: email,
            institution: institution,
            project: project,
            password: password
        });
        
        if (result.success) {
            showAlert('Usuário cadastrado com sucesso! Faça login para continuar.', 'success');
            setTimeout(() => {
                showLoginScreen();
            }, 2000);
        } else {
            showAlert('Erro no cadastro: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro no cadastro:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        // Restaurar botão
        btn.disabled = false;
        btnText.textContent = 'Cadastrar';
    }
}

// ==================== MOSTRAR DASHBOARD ====================
function showDashboard(user) {
    console.log('[CDR Sul] Mostrando dashboard:', user.email);
    
    currentUser = user;
    isLoggedIn = true;
    
    document.querySelector('.main-container').innerHTML = `
        <div class="dashboard">
            <header class="dashboard-header">
                <div class="header-left">
                    <img src="https://static.wixstatic.com/media/96b2d1_82005fa5efee493fb11c905fa9b56a83~mv2.png" alt="CDR Sul" class="header-logo">
                    <div class="user-info">
                        <h2>Bem-vindo, ${user.name}</h2>
                        <p>Projeto: ${user.project}</p>
                        ${user.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                    </div>
                </div>
                <button onclick="logout()" class="btn-logout">Sair</button>
            </header>
            
            <nav class="dashboard-nav">
                <button onclick="showTab('overview')" class="nav-btn active" data-tab="overview">Visão Geral</button>
                <button onclick="showTab('reports')" class="nav-btn" data-tab="reports">Relatórios</button>
                <button onclick="showTab('activities')" class="nav-btn" data-tab="activities">Atividades</button>
                <button onclick="showTab('files')" class="nav-btn" data-tab="files">Arquivos</button>
                ${user.isAdmin ? '<button onclick="showTab(\'admin\')" class="nav-btn" data-tab="admin">Admin</button>' : ''}
            </nav>
            
            <main class="dashboard-content" id="dashboardContent">
                <!-- Conteúdo será carregado aqui -->
            </main>
        </div>
    `;
    
    showTab('overview');
    loadUserData();
}

// ==================== MOSTRAR ABA ====================
function showTab(tabName) {
    console.log('[CDR Sul] Mostrando aba:', tabName);
    
    // Atualizar navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Mostrar conteúdo
    switch (tabName) {
        case 'overview':
            showOverviewTab();
            break;
        case 'reports':
            showReportsTab();
            break;
        case 'activities':
            showActivitiesTab();
            break;
        case 'files':
            showFilesTab();
            break;
        case 'admin':
            if (currentUser && currentUser.isAdmin) {
                showAdminTab();
            }
            break;
    }
}

// ==================== ABA VISÃO GERAL ====================
function showOverviewTab() {
    document.getElementById('dashboardContent').innerHTML = `
        <div class="overview-tab">
            <h3>Visão Geral do Projeto</h3>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Relatórios Enviados</h4>
                    <div class="stat-number" id="statsReports">-</div>
                </div>
                <div class="stat-card">
                    <h4>Atividades Cadastradas</h4>
                    <div class="stat-number" id="statsActivities">-</div>
                </div>
                <div class="stat-card">
                    <h4>Arquivos Enviados</h4>
                    <div class="stat-number" id="statsFiles">-</div>
                </div>
            </div>
            
            <div class="project-info">
                <h4>Informações do Projeto</h4>
                <p><strong>Coordenador:</strong> ${currentUser.name}</p>
                <p><strong>Instituição:</strong> ${currentUser.institution}</p>
                <p><strong>Projeto:</strong> ${currentUser.project}</p>
                <p><strong>E-mail:</strong> ${currentUser.email}</p>
            </div>
            
            <div class="pdf-section">
                <h4>📄 Relatório Completo em PDF</h4>
                <p>Gere um relatório completo com todas as suas atividades, relatórios e arquivos enviados.</p>
                <button onclick="generatePDF()" class="btn-pdf">Gerar Relatório PDF</button>
            </div>
        </div>
    `;
}

// ==================== ABA RELATÓRIOS ====================
function showReportsTab() {
    document.getElementById('dashboardContent').innerHTML = `
        <div class="reports-tab">
            <h3>Enviar Relatório</h3>
            
            <form id="reportForm">
                <div class="form-group">
                    <label for="reportType">Tipo de Relatório:</label>
                    <select id="reportType" required>
                        <option value="Relatório Parcial">Relatório Parcial</option>
                        <option value="Relatório Final">Relatório Final</option>
                        <option value="Relatório Financeiro">Relatório Financeiro</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="reportDate">Data do Relatório:</label>
                    <input type="date" id="reportDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="form-group">
                    <label for="reportTitle">Título:</label>
                    <input type="text" id="reportTitle" required>
                </div>
                
                <div class="form-group">
                    <label for="reportDescription">Descrição:</label>
                    <textarea id="reportDescription" rows="4" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="reportFiles">Arquivos (PDF, DOC, DOCX) - Obrigatório:</label>
                    <input type="file" id="reportFiles" multiple accept=".pdf,.doc,.docx" required>
                    <div id="reportFilesValidation" class="file-validation" style="display: none;"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary" id="reportBtn">
                        <span class="btn-text">Enviar Relatório</span>
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Configurar validação de arquivos
    document.getElementById('reportFiles').addEventListener('change', function() {
        validateFiles(this.files, 'reportFilesValidation');
    });
    
    // Configurar event listener do formulário
    document.getElementById('reportForm').addEventListener('submit', handleSubmitReport);
}

// ==================== ABA ATIVIDADES ====================
function showActivitiesTab() {
    document.getElementById('dashboardContent').innerHTML = `
        <div class="activities-tab">
            <h3>Cadastrar Atividade</h3>
            
            <form id="activityForm">
                <div class="form-group">
                    <label for="activityType">Tipo de Atividade:</label>
                    <select id="activityType" required>
                        <option value="Reunião">Reunião</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Palestra">Palestra</option>
                        <option value="Curso">Curso</option>
                        <option value="Evento">Evento</option>
                        <option value="Pesquisa de Campo">Pesquisa de Campo</option>
                        <option value="Outra">Outra</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="activityDate">Data da Atividade:</label>
                    <input type="date" id="activityDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="form-group">
                    <label for="activityTitle">Título da Atividade:</label>
                    <input type="text" id="activityTitle" required>
                </div>
                
                <div class="form-group">
                    <label for="activityDescription">Descrição:</label>
                    <textarea id="activityDescription" rows="4" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="activityLocation">Local:</label>
                    <input type="text" id="activityLocation">
                </div>
                
                <div class="form-group">
                    <label for="activityParticipants">Participantes:</label>
                    <textarea id="activityParticipants" rows="2" placeholder="Liste os participantes da atividade"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="activityFiles">Arquivos (Fotos, Documentos) - Opcional:</label>
                    <input type="file" id="activityFiles" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                    <div id="activityFilesValidation" class="file-validation" style="display: none;"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary" id="activityBtn">
                        <span class="btn-text">Cadastrar Atividade</span>
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Configurar validação de arquivos
    document.getElementById('activityFiles').addEventListener('change', function() {
        validateFiles(this.files, 'activityFilesValidation');
    });
    
    // Configurar event listener do formulário
    document.getElementById('activityForm').addEventListener('submit', handleSubmitActivity);
}

// ==================== ABA ARQUIVOS ====================
function showFilesTab() {
    document.getElementById('dashboardContent').innerHTML = `
        <div class="files-tab">
            <h3>Enviar Arquivos</h3>
            
            <form id="filesForm">
                <div class="form-group">
                    <label for="fileCategory">Categoria:</label>
                    <select id="fileCategory" required>
                        <option value="Documentos">Documentos</option>
                        <option value="Fotos">Fotos</option>
                        <option value="Planilhas">Planilhas</option>
                        <option value="Apresentações">Apresentações</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="fileDescription">Descrição:</label>
                    <textarea id="fileDescription" rows="3" placeholder="Descreva os arquivos que está enviando" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="uploadFiles">Selecionar Arquivos - Obrigatório:</label>
                    <input type="file" id="uploadFiles" multiple required>
                    <div id="uploadFilesValidation" class="file-validation" style="display: none;"></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary" id="filesBtn">
                        <span class="btn-text">Enviar Arquivos</span>
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Configurar validação de arquivos
    document.getElementById('uploadFiles').addEventListener('change', function() {
        validateFiles(this.files, 'uploadFilesValidation');
    });
    
    // Configurar event listener do formulário
    document.getElementById('filesForm').addEventListener('submit', handleUploadFiles);
}

// ==================== ABA ADMIN ====================
function showAdminTab() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    document.getElementById('dashboardContent').innerHTML = `
        <div class="admin-tab">
            <h3>Painel Administrativo</h3>
            
            <div class="admin-stats">
                <div class="stat-card">
                    <h4>Total de Usuários</h4>
                    <div class="stat-number" id="adminStatsUsers">-</div>
                </div>
                <div class="stat-card">
                    <h4>Total de Relatórios</h4>
                    <div class="stat-number" id="adminStatsReports">-</div>
                </div>
                <div class="stat-card">
                    <h4>Total de Atividades</h4>
                    <div class="stat-number" id="adminStatsActivities">-</div>
                </div>
                <div class="stat-card">
                    <h4>Total de Arquivos</h4>
                    <div class="stat-number" id="adminStatsFiles">-</div>
                </div>
            </div>
            
            <div class="admin-sections">
                <div class="admin-section">
                    <h4>👥 Usuários Cadastrados</h4>
                    <div id="adminUsersList">Carregando...</div>
                </div>
                
                <div class="admin-section">
                    <h4>📄 Relatórios Recentes</h4>
                    <div id="adminReportsList">Carregando...</div>
                </div>
                
                <div class="admin-section">
                    <h4>🎯 Atividades Recentes</h4>
                    <div id="adminActivitiesList">Carregando...</div>
                </div>
                
                <div class="admin-section">
                    <h4>📁 Arquivos Recentes</h4>
                    <div id="adminFilesList">Carregando...</div>
                </div>
            </div>
        </div>
    `;
    
    loadAdminData();
}

// ==================== VALIDAÇÃO DE ARQUIVOS ====================
function validateFiles(files, validationElementId) {
    const validationEl = document.getElementById(validationElementId);
    
    if (!files || files.length === 0) {
        validationEl.style.display = 'none';
        return;
    }
    
    let totalSize = 0;
    let validFiles = 0;
    let invalidFiles = 0;
    let fileList = '';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSize = file.size;
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        totalSize += fileSize;
        
        const isValidFormat = CONFIG.SUPPORTED_FORMATS.includes(fileExtension);
        const isValidSize = fileSize <= CONFIG.MAX_FILE_SIZE;
        
        if (isValidFormat && isValidSize) {
            validFiles++;
            fileList += `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-name">${fileName}</div>
                        <div class="file-size">${formatFileSize(fileSize)}</div>
                    </div>
                    <div class="file-status valid">Válido</div>
                </div>
            `;
        } else {
            invalidFiles++;
            let reason = '';
            if (!isValidFormat) reason = 'Formato não suportado';
            else if (!isValidSize) reason = 'Arquivo muito grande';
            
            fileList += `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-name">${fileName}</div>
                        <div class="file-size">${formatFileSize(fileSize)}</div>
                    </div>
                    <div class="file-status invalid">${reason}</div>
                </div>
            `;
        }
    }
    
    let validationClass = 'info';
    let validationMessage = `${files.length} arquivo(s) selecionado(s)`;
    
    if (invalidFiles > 0) {
        validationClass = 'error';
        validationMessage = `${invalidFiles} arquivo(s) inválido(s) encontrado(s)`;
    } else if (totalSize > CONFIG.MAX_TOTAL_SIZE) {
        validationClass = 'error';
        validationMessage = `Tamanho total excede ${formatFileSize(CONFIG.MAX_TOTAL_SIZE)}`;
    } else if (validFiles > 0) {
        validationClass = 'success';
        validationMessage = `${validFiles} arquivo(s) válido(s) - Total: ${formatFileSize(totalSize)}`;
    }
    
    validationEl.className = `file-validation ${validationClass}`;
    validationEl.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: 600;">${validationMessage}</div>
        ${fileList}
    `;
    validationEl.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== PROCESSAR ENVIO DE RELATÓRIO ====================
async function handleSubmitReport(event) {
    event.preventDefault();
    
    const reportType = document.getElementById('reportType').value;
    const reportDate = document.getElementById('reportDate').value;
    const title = document.getElementById('reportTitle').value;
    const description = document.getElementById('reportDescription').value;
    const files = document.getElementById('reportFiles').files;
    const btn = document.getElementById('reportBtn');
    const btnText = btn.querySelector('.btn-text');
    
    // Validar arquivos obrigatórios
    if (!files || files.length === 0) {
        showAlert('Por favor, selecione pelo menos um arquivo para o relatório.', 'error');
        return;
    }
    
    console.log('[CDR Sul] Enviando relatório:', title);
    
    // Mostrar loading
    btn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Enviando relatório...';
    
    try {
        // Preparar dados do formulário com arquivos
        let formData = new FormData();
        formData.append('action', 'submitReport');
        formData.append('userEmail', currentUser.email);
        formData.append('reportType', reportType);
        formData.append('reportDate', reportDate);
        formData.append('title', title);
        formData.append('description', description);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Relatório enviado com sucesso!', 'success');
            document.getElementById('reportForm').reset();
            document.getElementById('reportFilesValidation').style.display = 'none';
            loadUserData();
        } else {
            showAlert('Erro ao enviar relatório: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro ao enviar relatório:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        // Restaurar botão
        btn.disabled = false;
        btnText.textContent = 'Enviar Relatório';
    }
}

// ==================== PROCESSAR CADASTRO DE ATIVIDADE ====================
async function handleSubmitActivity(event) {
    event.preventDefault();
    
    const activityType = document.getElementById('activityType').value;
    const activityDate = document.getElementById('activityDate').value;
    const title = document.getElementById('activityTitle').value;
    const description = document.getElementById('activityDescription').value;
    const location = document.getElementById('activityLocation').value;
    const participants = document.getElementById('activityParticipants').value;
    const files = document.getElementById('activityFiles').files;
    const btn = document.getElementById('activityBtn');
    const btnText = btn.querySelector('.btn-text');
    
    console.log('[CDR Sul] Cadastrando atividade:', title);
    
    // Mostrar loading
    btn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Cadastrando atividade...';
    
    try {
        // Preparar dados do formulário com arquivos
        let formData = new FormData();
        formData.append('action', 'submitActivity');
        formData.append('userEmail', currentUser.email);
        formData.append('activityType', activityType);
        formData.append('activityDate', activityDate);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('location', location);
        formData.append('participants', participants);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Atividade cadastrada com sucesso!', 'success');
            document.getElementById('activityForm').reset();
            document.getElementById('activityFilesValidation').style.display = 'none';
            loadUserData();
        } else {
            showAlert('Erro ao cadastrar atividade: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro ao cadastrar atividade:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        // Restaurar botão
        btn.disabled = false;
        btnText.textContent = 'Cadastrar Atividade';
    }
}

// ==================== PROCESSAR UPLOAD DE ARQUIVOS ====================
async function handleUploadFiles(event) {
    event.preventDefault();
    
    const category = document.getElementById('fileCategory').value;
    const description = document.getElementById('fileDescription').value;
    const files = document.getElementById('uploadFiles').files;
    const btn = document.getElementById('filesBtn');
    const btnText = btn.querySelector('.btn-text');
    
    // Validar arquivos obrigatórios
    if (!files || files.length === 0) {
        showAlert('Por favor, selecione pelo menos um arquivo.', 'error');
        return;
    }
    
    console.log('[CDR Sul] Enviando arquivos, categoria:', category);
    
    // Mostrar loading
    btn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Enviando arquivos...';
    
    try {
        // Preparar dados do formulário com arquivos
        let formData = new FormData();
        formData.append('action', 'uploadFiles');
        formData.append('userEmail', currentUser.email);
        formData.append('category', category);
        formData.append('description', description);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Arquivo(s) enviado(s) com sucesso!', 'success');
            document.getElementById('filesForm').reset();
            document.getElementById('uploadFilesValidation').style.display = 'none';
            loadUserData();
        } else {
            showAlert('Erro ao enviar arquivos: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro ao enviar arquivos:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    } finally {
        // Restaurar botão
        btn.disabled = false;
        btnText.textContent = 'Enviar Arquivos';
    }
}

// ==================== GERAR PDF ====================
async function generatePDF() {
    if (!currentUser) return;
    
    console.log('[CDR Sul] Gerando PDF para:', currentUser.email);
    
    try {
        const result = await sendRequest({
            action: 'generatePDF',
            userEmail: currentUser.email
        });
        
        if (result.success && result.pdfUrl) {
            showAlert('Relatório PDF gerado com sucesso! Abrindo em nova aba...', 'success');
            window.open(result.pdfUrl, '_blank');
        } else {
            showAlert('Erro ao gerar relatório: ' + (result.message || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro ao gerar PDF:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    }
}

// ==================== GERAR PDF ADMIN ====================
async function generateAdminPDF(userEmail) {
    if (!currentUser || !currentUser.isAdmin) return;
    
    console.log('[CDR Sul] Gerando PDF admin para:', userEmail);
    
    try {
        const result = await sendRequest({
            action: 'generatePDF',
            userEmail: userEmail,
            adminRequest: true
        });
        
        if (result.success && result.pdfUrl) {
            showAlert('Relatório PDF gerado com sucesso! Abrindo em nova aba...', 'success');
            window.open(result.pdfUrl, '_blank');
        } else {
            showAlert('Erro ao gerar relatório: ' + (result.message || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro ao gerar PDF admin:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    }
}

// ==================== CARREGAR DADOS DO USUÁRIO ====================
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const result = await sendRequest({
            action: 'getUserData',
            userEmail: currentUser.email
        });
        
        if (result.success) {
            const data = result.data;
            
            const statsReports = document.getElementById('statsReports');
            const statsActivities = document.getElementById('statsActivities');
            const statsFiles = document.getElementById('statsFiles');
            
            if (statsReports) statsReports.textContent = data.reports || 0;
            if (statsActivities) statsActivities.textContent = data.activities || 0;
            if (statsFiles) statsFiles.textContent = data.files || 0;
            
            console.log('[CDR Sul] ✅ Dados do usuário carregados:', data);
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro ao carregar dados do usuário:', error);
    }
}

// ==================== CARREGAR DADOS ADMINISTRATIVOS ====================
async function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    try {
        const result = await sendRequest({
            action: 'getAdminData'
        });
        
        if (result.success) {
            const data = result.data;
            
            // Estatísticas
            document.getElementById('adminStatsUsers').textContent = data.totalUsers || 0;
            document.getElementById('adminStatsReports').textContent = data.totalReports || 0;
            document.getElementById('adminStatsActivities').textContent = data.totalActivities || 0;
            document.getElementById('adminStatsFiles').textContent = data.totalFiles || 0;
            
            // Usuários
            const usersList = document.getElementById('adminUsersList');
            if (data.users && data.users.length > 0) {
                usersList.innerHTML = data.users.map(user => 
                    `<div class="admin-item">
                        <div>
                            <strong>${user.name}</strong><br>
                            ${user.email}<br>
                            <small>${user.institution} - ${user.project}</small>
                        </div>
                        <button onclick="generateAdminPDF('${user.email}')" class="btn-admin-pdf">PDF</button>
                    </div>`
                ).join('');
            } else {
                usersList.innerHTML = '<p>Nenhum usuário cadastrado</p>';
            }
            
            // Relatórios
            const reportsList = document.getElementById('adminReportsList');
            if (data.recentReports && data.recentReports.length > 0) {
                reportsList.innerHTML = data.recentReports.map(report => 
                    `<div class="admin-item">
                        <div>
                            <strong>${report.title}</strong><br>
                            ${report.userEmail}<br>
                            <small>${new Date(report.date).toLocaleDateString()} - ${report.type}</small>
                        </div>
                    </div>`
                ).join('');
            } else {
                reportsList.innerHTML = '<p>Nenhum relatório encontrado</p>';
            }
            
            // Atividades
            const activitiesList = document.getElementById('adminActivitiesList');
            if (data.recentActivities && data.recentActivities.length > 0) {
                activitiesList.innerHTML = data.recentActivities.map(activity => 
                    `<div class="admin-item">
                        <div>
                            <strong>${activity.title}</strong><br>
                            ${activity.userEmail}<br>
                            <small>${new Date(activity.date).toLocaleDateString()} - ${activity.location || 'Local não informado'}</small>
                        </div>
                    </div>`
                ).join('');
            } else {
                activitiesList.innerHTML = '<p>Nenhuma atividade encontrada</p>';
            }
            
            // Arquivos
            const filesList = document.getElementById('adminFilesList');
            if (data.recentFiles && data.recentFiles.length > 0) {
                filesList.innerHTML = data.recentFiles.map(file => 
                    `<div class="admin-item">
                        <div>
                            <strong>${file.name}</strong><br>
                            ${file.userEmail}<br>
                            <small>${file.category} - ${file.size || 'Tamanho não informado'}</small>
                        </div>
                    </div>`
                ).join('');
            } else {
                filesList.innerHTML = '<p>Nenhum arquivo encontrado</p>';
            }
            
            console.log('[CDR Sul] ✅ Dados administrativos carregados:', data);
        }
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro ao carregar dados administrativos:', error);
    }
}

// ==================== ENVIAR REQUISIÇÃO ====================
async function sendRequest(data) {
    console.log('[CDR Sul] Enviando requisição:', data);
    
    try {
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(data),
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        
        const result = await response.json();
        console.log('[CDR Sul] Resposta recebida:', result);
        return result;
        
    } catch (error) {
        console.error('[CDR Sul] ❌ Erro na requisição:', error);
        throw error;
    }
}

// ==================== LOGOUT ====================
function logout() {
    console.log('[CDR Sul] Fazendo logout');
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('cdr_user');
    showLoginScreen();
}

console.log(`[CDR Sul] Sistema CDR Sul - Versão ${CONFIG.VERSION}`);
