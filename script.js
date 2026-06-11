const statusDiv = document.getElementById('status');
const uploadInput = document.getElementById('upload-imagem');
const imagemOriginal = document.getElementById('imagem-original');
const canvasResultado = document.getElementById('canvas-resultado');

// Executa quando o OpenCV.js terminar de carregar na página
document.getElementById('opencv-script').onload = function() {
    statusDiv.style.backgroundColor = "#d4edda";
    statusDiv.style.color = "#155724";
    statusDiv.innerText = "OpenCV pronto! Selecione uma foto de drone ou aérea com gado.";
    uploadInput.disabled = false; // Libera o botão de upload
};

// Detecta quando o usuário envia uma imagem
uploadInput.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
        const url = URL.createObjectURL(arquivo);
        imagemOriginal.src = url;
    }
});

// Quando a imagem terminar de carregar na tela, processa a contagem
imagemOriginal.onload = function() {
    processarContagemGado();
};

function processarContagemGado() {
    // 1. Lê a imagem do elemento HTML e joga para a matriz do OpenCV
    let src = cv.imread(imagemOriginal);
    let dst = cv.createMatWithSize(src.rows, src.cols, cv.CV_8UC3);
    let cinza = new cv.Mat();
    let desfocada = new cv.Mat();
    let limiar = new cv.Mat();
    let contornos = new cv.MatVector();
    let hierarquia = new cv.Mat();

    // 2. Converte para tons de cinza
    cv.cvtColor(src, cinza, cv.COLOR_RGBA2GRAY);

    // 3. Aplica desfoque para limpar imperfeições da grama
    let ksize = new cv.Size(5, 5);
    cv.GaussianBlur(cinza, desfocada, ksize, 0, 0, cv.BORDER_DEFAULT);

    // 4. Limiarização (Binarização em Preto e Branco)
    // Se o gado for claro e o pasto escuro, usamos THRESH_BINARY. Valor corte: 170.
    cv.threshold(desfocada, limiar, 170, 255, cv.THRESH_BINARY);

    // 5. Encontra os contornos dos objetos brancos gerados
    cv.findContours(limiar, contornos, hierarquia, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let totalGado = 0;
    src.copyTo(dst); // Copia imagem original para a tela de desenho final

    // 6. Loop para filtrar o tamanho dos bois encontrados
    for (let i = 0; i < contornos.size(); ++i) {
        let contorno = contornos.get(i);
        let area = cv.contourArea(contorno);

        // Filtro de tamanho de área (Ajuste 50 e 3000 dependendo da resolução da foto)
        if (area > 50 && area < 3000) {
            totalGado++;
            
            // Pega as coordenadas para desenhar o retângulo
            let retangulo = cv.boundingRect(contorno);
            let ponto1 = new cv.Point(retangulo.x, retangulo.y);
            let ponto2 = new cv.Point(retangulo.x + retangulo.width, retangulo.y + retangulo.height);
            
            // Desenha o quadrado verde em volta do boi
            cv.rectangle(dst, ponto1, ponto2, [0, 255, 0, 255], 2);

            // Escreve o número do boi ao lado do retângulo
            cv.putText(dst, totalGado.toString(), new cv.Point(retangulo.x, retangulo.y - 5), 
                       cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 0, 0, 255], 1);
        }
    }

    // Escreve o placar geral no topo esquerdo do Canvas
    cv.putText(dst, `Total de Gado: ${totalGado}`, new cv.Point(15, 35), 
               cv.FONT_HERSHEY_SIMPLEX, 1, [255, 0, 0, 255], 2);

    // 7. Renderiza o resultado no Canvas HTML
    cv.imshow(canvasResultado, dst);

    // 8. Limpa a memória das matrizes do OpenCV
    src.delete(); dst.delete(); cinza.delete(); desfocada.delete();
    limiar.delete(); contornos.delete(); hierarquia.delete();
}
