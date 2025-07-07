/**
 * Sistema de Gestão de Projetos CDR Sul - Frontend FUNCIONAL
 * Versão FINAL - 100% Compatível com Apps Script
 * 
 * USUÁRIOS PARA TESTE:
 * Admin: cdrsultocantins@unirg.edu.br / 123456
 * Usuário: adriaterra@unirg.edu.br / 123456
 */

// ===== CONFIGURAÇÃO =====
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxb999xR_nS_O4S2Tud3SjAZWhvU6Lhd8r_TmM595PU3lw0eBfedIxnsnsguJDc-FTA/exec';

// ===== VARIÁVEIS GLOBAIS =====
let currentUser = null;
let currentTab = 'overview';

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema CDR Sul carregado - Versão FINAL Funcional');
    
    // Verificar se há usuário salvo
    const savedUser = localStorage.getItem('cdr_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('👤 Usuário recuperado do localStorage:', currentUser.email);
            showDashboard(currentUser);
            return;
        } catch (e) {
            console.log('⚠️ Erro ao recuperar usuário salvo:', e);
            localStorage.removeItem('cdr_user');
        }
    }
    
    // Mostrar tela de login
    showLoginScreen();
    
    // Testar conectividade
    testConnectivity();
});

// ===== TESTAR CONECTIVIDADE =====
async function testConnectivity() {
    console.log('🔍 Testando conectividade com o servidor...');
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Conectividade OK:', data);
            console.log('📡 Versão do servidor:', data.version);
            console.log('📢 Mensagem do servidor:', data.message);
        } else {
            console.log('⚠️ Resposta não OK:', response.status);
        }
    } catch (error) {
        console.log('❌ Erro de conectividade:', error);
    }
}

// ===== MOSTRAR TELA DE LOGIN =====
function showLoginScreen() {
    console.log('🔐 Mostrando tela de login');
    
    document.body.innerHTML = `
        <div class="login-container">
            <div class="login-header">
                <img src="https://static.wixstatic.com/media/96b2d1_82005fa5efee493fb11c905fa9b56a83~mv2.png" alt="CDR Sul Tocantins" class="logo">
                <h1>Sistema de Gestão de Projetos CDR Sul</h1>
                <p>Tudo sobre o seu projeto, reunido em um só lugar</p>
            </div>
            
            <div class="login-form-container">
                <h2>Acesso ao Sistema</h2>
                
                <form id="loginForm" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="loginEmail">E-mail:</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Senha:</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    
                    <button type="submit" class="btn-primary">Entrar</button>
                </form>
                
                <p class="register-link">
                    Não tem conta? <a href="#" onclick="showRegisterScreen()">Cadastre-se aqui</a>
                </p>
            </div>
            
            <div class="footer">
                <p>Desenvolvido pela equipe do CDR Sul Tocantins - Versão 2.7 Final</p>
            </div>
        </div>
    `;
}

// ===== MOSTRAR TELA DE CADASTRO =====
function showRegisterScreen() {
    console.log('📝 Mostrando tela de cadastro');
    
    document.body.innerHTML = `
        <div class="login-container">
            <div class="login-header">
                <img src="https://static.wixstatic.com/media/96b2d1_82005fa5efee493fb11c905fa9b56a83~mv2.png" alt="CDR Sul Tocantins" class="logo">
                <h1>Sistema de Gestão de Projetos CDR Sul</h1>
                <p>Cadastro de Novo Usuário</p>
            </div>
            
            <div class="login-form-container">
                <h2>Criar Conta</h2>
                
                <form id="registerForm" onsubmit="handleRegister(event)">
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
                    
                    <button type="submit" class="btn-primary">Cadastrar</button>
                </form>
                
                <p class="register-link">
                    Já tem conta? <a href="#" onclick="showLoginScreen()">Faça login aqui</a>
                </p>
            </div>
        </div>
    `;
}

// ===== PROCESSAR LOGIN =====
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔐 Tentando login para:', email);
    
    try {
        const result = await sendRequest({
            action: 'login',
            email: email,
            password: password
        });
        
        if (result.success) {
            console.log('✅ Login bem-sucedido:', result.user);
            currentUser = result.user;
            
            // Salvar usuário no localStorage
            localStorage.setItem('cdr_user', JSON.stringify(currentUser));
            
            showDashboard(currentUser);
        } else {
            alert('Erro no login: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Erro no login:', error);
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
}

// ===== PROCESSAR CADASTRO =====
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const institution = document.getElementById('registerInstitution').value;
    const project = document.getElementById('registerProject').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validações
    if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    console.log('📝 Tentando cadastro para:', email);
    
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
            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            showLoginScreen();
        } else {
            alert('Erro no cadastro: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
}

// ===== MOSTRAR DASHBOARD =====
function showDashboard(user) {
    console.log('📊 Mostrando dashboard para:', user.email);
    
    currentUser = user;
    
    document.body.innerHTML = `
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
    
    // Mostrar aba inicial
    showTab('overview');
    
    // Carregar dados do usuário
    loadUserData();
}

// ===== MOSTRAR ABA =====
function showTab(tabName) {
    console.log('📑 Mostrando aba:', tabName);
    
    currentTab = tabName;
    
    // Atualizar navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Mostrar conteúdo da aba
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
            if (currentUser.isAdmin) {
                showAdminTab();
            }
            break;
    }
}

// ===== ABA VISÃO GERAL =====
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
        </div>
    `;
}

// ===== ABA RELATÓRIOS =====
function showReportsTab() {
    document.getElementById('dashboardContent').innerHTML = `
        <div class="reports-tab">
            <h3>Enviar Relatório</h3>
            
            <form id="reportForm" onsubmit="handleSubmitReport(event)">
                <div class="form-group">
                    <label for="reportType">Tipo de Relatório:</label>
                    <select id="reportType" required>
                        <option value="Relatório Parcial">Relatório Parcial</option>
                        <option value="Relatório Final">Relatório Final</option>
                        <option value="Relatório de Atividade">Relatório de Atividade</option>
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
                    <label for="reportFiles">Arquivos (PDF, DOC, DOCX):</label>
                    <input type="file" id="reportFiles" multiple accept=".pdf,.doc,.docx">
                </div>
                
                <button type="submit" class="btn-primary">Enviar Relatório</button>
            </form>
        </div>
    `;
}

// ===== ABA ATIVIDADES =====
function showActivitiesTab() {
    document.getElementById('dashboardContent').innerHTML = `
        <div class="activities-tab">
            <h3>Cadastrar Atividade</h3>
            
            <form id="activityForm" onsubmit="handleSubmitActivity(event)">
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
                    <label for="activityFiles">Arquivos (Fotos, Documentos):</label>
                    <input type="file" id="activityFiles" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                </div>
                
                <button type="submit" class="btn-primary">Cadastrar Atividade</button>
            </form>
        </div>
    `;
}

// ===== ABA ARQUIVOS =====
function showFilesTab() {
    document.getElementById('dashboardContent').innerHTML = `
        <div class="files-tab">
            <h3>Enviar Arquivos</h3>
            
            <form id="filesForm" onsubmit="handleUploadFiles(event)">
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
                    <textarea id="fileDescription" rows="3" placeholder="Descreva os arquivos que está enviando"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="uploadFiles">Selecionar Arquivos:</label>
                    <input type="file" id="uploadFiles" multiple required>
                </div>
                
                <button type="submit" class="btn-primary">Enviar Arquivos</button>
            </form>
        </div>
    `;
}

// ===== ABA ADMIN =====
function showAdminTab() {
    if (!currentUser.isAdmin) {
        console.log('🚫 Acesso negado - usuário não é admin');
        return;
    }
    
    console.log('👑 Carregando painel administrativo');
    
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
            </div>
            
            <div class="admin-sections">
                <div class="admin-section">
                    <h4>Usuários Cadastrados</h4>
                    <div id="adminUsersList">Carregando...</div>
                </div>
                
                <div class="admin-section">
                    <h4>Relatórios Recentes</h4>
                    <div id="adminReportsList">Carregando...</div>
                </div>
                
                <div class="admin-section">
                    <h4>Atividades Recentes</h4>
                    <div id="adminActivitiesList">Carregando...</div>
                </div>
            </div>
        </div>
    `;
    
    // Carregar dados administrativos
    loadAdminData();
}

// ===== PROCESSAR ENVIO DE RELATÓRIO =====
async function handleSubmitReport(event) {
    event.preventDefault();
    
    const reportType = document.getElementById('reportType').value;
    const reportDate = document.getElementById('reportDate').value;
    const title = document.getElementById('reportTitle').value;
    const description = document.getElementById('reportDescription').value;
    
    console.log('📄 Enviando relatório:', title);
    
    try {
        const result = await sendRequest({
            action: 'submit_report',
            userEmail: currentUser.email,
            reportType: reportType,
            reportDate: reportDate,
            title: title,
            description: description
        });
        
        if (result.success) {
            alert('Relatório enviado com sucesso!');
            document.getElementById('reportForm').reset();
            loadUserData(); // Atualizar estatísticas
        } else {
            alert('Erro ao enviar relatório: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao enviar relatório:', error);
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
}

// ===== PROCESSAR CADASTRO DE ATIVIDADE =====
async function handleSubmitActivity(event) {
    event.preventDefault();
    
    const activityType = document.getElementById('activityType').value;
    const activityDate = document.getElementById('activityDate').value;
    const title = document.getElementById('activityTitle').value;
    const description = document.getElementById('activityDescription').value;
    const location = document.getElementById('activityLocation').value;
    const participants = document.getElementById('activityParticipants').value;
    
    console.log('🎯 Cadastrando atividade:', title);
    
    try {
        const result = await sendRequest({
            action: 'submit_activity',
            userEmail: currentUser.email,
            activityType: activityType,
            activityDate: activityDate,
            title: title,
            description: description,
            location: location,
            participants: participants
        });
        
        if (result.success) {
            alert('Atividade cadastrada com sucesso!');
            document.getElementById('activityForm').reset();
            loadUserData(); // Atualizar estatísticas
        } else {
            alert('Erro ao cadastrar atividade: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao cadastrar atividade:', error);
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
}

// ===== PROCESSAR UPLOAD DE ARQUIVOS =====
async function handleUploadFiles(event) {
    event.preventDefault();
    
    const category = document.getElementById('fileCategory').value;
    const description = document.getElementById('fileDescription').value;
    
    console.log('📁 Enviando arquivos, categoria:', category);
    
    try {
        const result = await sendRequest({
            action: 'upload_file',
            userEmail: currentUser.email,
            category: category,
            description: description
        });
        
        if (result.success) {
            alert('Arquivo(s) enviado(s) com sucesso!');
            document.getElementById('filesForm').reset();
            loadUserData(); // Atualizar estatísticas
        } else {
            alert('Erro ao enviar arquivos: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao enviar arquivos:', error);
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
}

// ===== CARREGAR DADOS DO USUÁRIO =====
async function loadUserData() {
    if (!currentUser) return;
    
    console.log('📊 Carregando dados do usuário:', currentUser.email);
    
    try {
        const result = await sendRequest({
            action: 'get_user_data',
            userEmail: currentUser.email
        });
        
        if (result.success) {
            const data = result.data;
            
            // Atualizar estatísticas na visão geral
            const statsReports = document.getElementById('statsReports');
            const statsActivities = document.getElementById('statsActivities');
            const statsFiles = document.getElementById('statsFiles');
            
            if (statsReports) statsReports.textContent = data.reports;
            if (statsActivities) statsActivities.textContent = data.activities;
            if (statsFiles) statsFiles.textContent = data.files;
            
            console.log('✅ Dados do usuário carregados:', data);
        } else {
            console.log('⚠️ Erro ao carregar dados do usuário:', result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
    }
}

// ===== CARREGAR DADOS ADMINISTRATIVOS =====
async function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    console.log('👑 Carregando dados administrativos');
    
    try {
        const result = await sendRequest({
            action: 'get_admin_data'
        });
        
        if (result.success) {
            const data = result.data;
            
            // Atualizar estatísticas admin
            document.getElementById('adminStatsUsers').textContent = data.totalUsers;
            document.getElementById('adminStatsReports').textContent = data.totalReports;
            document.getElementById('adminStatsActivities').textContent = data.totalActivities;
            
            // Mostrar usuários
            const usersList = document.getElementById('adminUsersList');
            if (data.users && data.users.length > 0) {
                usersList.innerHTML = data.users.map(user => `
                    <div class="admin-item">
                        <strong>${user.name}</strong><br>
                        ${user.email}<br>
                        <small>${user.institution} - ${user.project}</small>
                    </div>
                `).join('');
            } else {
                usersList.innerHTML = '<p>Nenhum usuário cadastrado</p>';
            }
            
            // Mostrar relatórios recentes
            const reportsList = document.getElementById('adminReportsList');
            if (data.recentReports && data.recentReports.length > 0) {
                reportsList.innerHTML = data.recentReports.map(report => `
                    <div class="admin-item">
                        <strong>${report.title}</strong><br>
                        ${report.userEmail}<br>
                        <small>${new Date(report.date).toLocaleDateString()}</small>
                    </div>
                `).join('');
            } else {
                reportsList.innerHTML = '<p>Nenhum relatório encontrado</p>';
            }
            
            // Mostrar atividades recentes
            const activitiesList = document.getElementById('adminActivitiesList');
            if (data.recentActivities && data.recentActivities.length > 0) {
                activitiesList.innerHTML = data.recentActivities.map(activity => `
                    <div class="admin-item">
                        <strong>${activity.title}</strong><br>
                        ${activity.userEmail}<br>
                        <small>${new Date(activity.date).toLocaleDateString()} - ${activity.location}</small>
                    </div>
                `).join('');
            } else {
                activitiesList.innerHTML = '<p>Nenhuma atividade encontrada</p>';
            }
            
            console.log('✅ Dados administrativos carregados:', data);
        } else {
            console.log('⚠️ Erro ao carregar dados administrativos:', result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados administrativos:', error);
    }
}

// ===== ENVIAR REQUISIÇÃO =====
async function sendRequest(data) {
    console.log('📡 Enviando requisição:', data);
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📥 Resposta recebida:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        throw error;
    }
}

// ===== LOGOUT =====
function logout() {
    console.log('👋 Fazendo logout');
    
    currentUser = null;
    localStorage.removeItem('cdr_user');
    showLoginScreen();
}

console.log('✅ Sistema CDR Sul Frontend carregado - Versão FINAL Funcional');

