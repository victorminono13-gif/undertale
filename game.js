// ==========================================
// CONFIGURAÇÃO DO MULTIPLAYER (PEERJS)
// ==========================================
const peer = new Peer(); 
let conn = null;
let isHost = true; // Quem cria a sala é o Sans (Host) por padrão

peer.on('open', (id) => {
    document.getElementById('my-id').innerText = id;
});

// Quando alguém se conecta A VOCÊ (Você é o Sans)
peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
    isHost = true; 
    document.getElementById('status').innerText = "Status: Frisk conectou! Batalha iniciada.";
});

// Quando VOCÊ se conecta a alguém (Você é a Frisk)
function connectToPeer() {
    const friendId = document.getElementById('friend-id').value;
    conn = peer.connect(friendId);
    isHost = false; 
    setupConnection();
    document.getElementById('status').innerText = "Status: Conectado ao Sans! Batalha iniciada.";
}

function setupConnection() {
    conn.on('open', () => {
        // Envia a sua posição atual para o outro jogador constantemente
        setInterval(sendGameState, 1000 / 30); // 30 "ticks" de rede por segundo
    });

    conn.on('data', (data) => {
        // Recebe a posição do inimigo e atualiza na sua tela
        if (isHost) {
            frisk.x = data.x;
            frisk.y = data.y;
        } else {
            sans.x = data.x;
            sans.y = data.y;
        }
    });
}

function sendGameState() {
    if (!conn || !conn.open) return;
    
    // Manda apenas as suas coordenadas para economizar banda
    if (isHost) {
        conn.send({ x: sans.x, y: sans.y });
    } else {
        conn.send({ x: frisk.x, y: frisk.y });
    }
}

// ==========================================
// ENGINE DO JOGO (CANVAS & MOVIMENTAÇÃO)
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Estados dos personagens
let sans = { x: 320, y: 100, width: 40, height: 60, speed: 5, color: '#00aaff' };
let frisk = { x: 320, y: 400, width: 20, height: 20, speed: 4, color: '#ff0000' };

// Controles
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup',   (e) => keys[e.key] = false);

function update() {
    // Se você for o Host (Sans), você controla o quadrado azul
    if (isHost) {
        if (keys['w'] || keys['ArrowUp']) sans.y -= sans.speed;
        if (keys['s'] || keys['ArrowDown']) sans.y += sans.speed;
        if (keys['a'] || keys['ArrowLeft']) sans.x -= sans.speed;
        if (keys['d'] || keys['ArrowRight']) sans.x += sans.speed;
        
        // Limites da tela
        sans.x = Math.max(0, Math.min(canvas.width - sans.width, sans.x));
        sans.y = Math.max(0, Math.min(canvas.height - sans.height, sans.y));
    } 
    // Se você for o Cliente (Frisk), você controla o quadrado vermelho (a alma)
    else {
        if (keys['w'] || keys['ArrowUp']) frisk.y -= frisk.speed;
        if (keys['s'] || keys['ArrowDown']) frisk.y += frisk.speed;
        if (keys['a'] || keys['ArrowLeft']) frisk.x -= frisk.speed;
        if (keys['d'] || keys['ArrowRight']) frisk.x += frisk.speed;

        // Limites da tela
        frisk.x = Math.max(0, Math.min(canvas.width - frisk.width, frisk.x));
        frisk.y = Math.max(0, Math.min(canvas.height - frisk.height, frisk.y));
    }
}

function draw() {
    // Limpa a tela com preto
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha uma "Arena" basica (a caixa de batalha)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(150, 250, 340, 200);

    // Desenha o Sans
    ctx.fillStyle = sans.color;
    ctx.fillRect(sans.x, sans.y, sans.width, sans.height);

    // Desenha a Frisk (Alma)
    ctx.fillStyle = frisk.color;
    ctx.fillRect(frisk.x, frisk.y, frisk.width, frisk.height);
}

// Loop principal a 60 FPS
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
gameLoop();