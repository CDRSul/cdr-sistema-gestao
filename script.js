/*
 * FRONTEND TESTE UPLOAD - VERSÃO MÍNIMA
 * FOCO: TESTAR UPLOAD DE ARQUIVOS SEM OUTRAS FUNCIONALIDADES
 */

// URL DO SEU GOOGLE APPS SCRIPT
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxW8iySGkZpzbreHqG78LGCL4NiHGBS9PdczQRAncNFUifD5a55v8iMhv7PfB6HVggD/exec';

document.addEventListener('DOMContentLoaded', function() {
    console.log("=== TESTE UPLOAD INICIADO ===");
    
    // Testar conectividade
    testarConectividade();
    
    // Configurar formulário
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleUpload);
    }
    
    // Configurar validação de arquivo
    const fileInput = document.getElementById('arquivo');
    if (fileInput) {
        fileInput.addEventListener('change', validarArquivo);
    }
});

async function testarConectividade() {
    try {
        console.log("Testando conectividade...");
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        console.log("Conectividade OK:", result);
        
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="alert alert-success">
                    ✅ Conectividade OK: ${result.version}
                </div>
            `;
        }
    } catch (error) {
        console.error("Erro de conectividade:", error);
        
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Erro de conectividade: ${error.message}
                </div>
            `;
        }
    }
}

function validarArquivo(event) {
    const file = event.target.files[0];
    const feedback = document.getElementById('fileFeedback');
    
    if (!file) {
        feedback.innerHTML = '';
        return;
    }
    
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
        feedback.innerHTML = `
            <div class="alert alert-warning">
                ⚠️ Arquivo grande: ${file.name} (${sizeMB}MB)
                <br>Limite recomendado: 10MB
            </div>
        `;
    } else {
        feedback.innerHTML = `
            <div class="alert alert-info">
                📄 Arquivo selecionado: ${file.name} (${sizeMB}MB)
            </div>
        `;
    }
}

async function handleUpload(event) {
    event.preventDefault();
    
    console.log("=== INICIANDO UPLOAD ===");
    
    const fileInput = document.getElementById('arquivo');
    const categoria = document.getElementById('categoria').value;
    const descricao = document.getElementById('descricao').value;
    const resultDiv = document.getElementById('resultado');
    
    // Validar arquivo
    if (!fileInput.files || fileInput.files.length === 0) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                ❌ Nenhum arquivo selecionado
            </div>
        `;
        return;
    }
    
    const arquivo = fileInput.files[0];
    console.log("Arquivo selecionado:", arquivo.name, arquivo.size, "bytes");
    
    // Mostrar progresso
    resultDiv.innerHTML = `
        <div class="alert alert-info">
            🔄 Enviando arquivo: ${arquivo.name}...
        </div>
    `;
    
    try {
        // Criar FormData
        const formData = new FormData();
        formData.append('email', 'teste@upload.com');
        formData.append('category', categoria);
        formData.append('description', descricao);
        
        // TESTAR MÚLTIPLAS FORMAS DE ENVIAR O ARQUIVO
        formData.append('arquivo', arquivo);           // Forma 1
        formData.append('file', arquivo);              // Forma 2  
        formData.append('uploadFile', arquivo);        // Forma 3
        formData.append('uploadFile_0', arquivo);      // Forma 4
        
        console.log("FormData criado com:", Array.from(formData.keys()));
        
        // Enviar requisição
        console.log("Enviando para:", SCRIPT_URL);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Erro ao fazer parse:", parseError);
            throw new Error(`Resposta inválida: ${responseText.substring(0, 100)}`);
        }
        
        console.log("Resultado processado:", result);
        
        // Mostrar resultado
        if (result.success) {
            let html = `
                <div class="alert alert-success">
                    ✅ ${result.message}
                </div>
            `;
            
            if (result.data && result.data.arquivosSalvos) {
                html += '<div class="mt-3"><h6>Arquivos salvos:</h6><ul>';
                result.data.arquivosSalvos.forEach(arquivo => {
                    html += `<li><a href="${arquivo.url}" target="_blank">${arquivo.nome}</a> (${arquivo.tamanho} bytes)</li>`;
                });
                html += '</ul></div>';
            }
            
            if (result.data && result.data.debug) {
                html += `
                    <div class="mt-3">
                        <small class="text-muted">
                            Debug: ${result.data.debug.totalEncontrados} arquivos encontrados
                            usando métodos: ${result.data.debug.metodosUsados.join(', ')}
                        </small>
                    </div>
                `;
            }
            
            resultDiv.innerHTML = html;
            
            // Limpar formulário
            document.getElementById('uploadForm').reset();
            document.getElementById('fileFeedback').innerHTML = '';
            
        } else {
            let html = `
                <div class="alert alert-danger">
                    ❌ ${result.error}
                </div>
            `;
            
            if (result.debug) {
                html += `
                    <div class="mt-3">
                        <small class="text-muted">
                            Debug: Parâmetros recebidos: ${result.debug.parameterKeys?.join(', ') || 'nenhum'}
                            <br>Parameters: ${result.debug.parametersKeys?.join(', ') || 'nenhum'}
                        </small>
                    </div>
                `;
            }
            
            resultDiv.innerHTML = html;
        }
        
    } catch (error) {
        console.error("Erro no upload:", error);
        
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                ❌ Erro no upload: ${error.message}
            </div>
        `;
    }
}

console.log("=== SCRIPT TESTE UPLOAD CARREGADO ===");
