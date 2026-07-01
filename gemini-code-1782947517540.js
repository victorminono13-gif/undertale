const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname)); // Serve os arquivos da pasta (HTML, Imagens)

let gameState = {
    turn: 'enemy', // 'enemy' ou 'player'
    timeRemaining: 15,
    soul: { x: 320, y: 320, color: 'red', gravityDir: 'down' },
    projectiles: []
};

io.on('connection', (socket) => {
    console.log('Um jogador conectou:', socket.id);

    // Envia o estado atual para quem acabou de conectar
    socket.emit('gameStateUpdate', gameState);

    // Recebe movimentos do Jogador (Coração)
    socket.on('playerMove', (data) => {
        gameState.soul.x = data.x;
        gameState.soul.y = data.y;
        socket.broadcast.emit('updateSoul', gameState.soul);
    });

    // Recebe comandos de ataque do Inimigo (Sans)
    socket.on('enemyAttack', (attackData) => {
        // attackData contém o tipo de ataque baseado nas teclas (W,A,S,D, Setas, H, J, etc)
        
        if (attackData.type === 'sleep_turn') {
            gameState.turn = 'infinite_sleep';
            io.emit('stateChange', gameState.turn);
        } else if (attackData.type === 'wake_up') {
            gameState.turn = 'player'; // Retorna ao turno do jogador após acordar
            io.emit('stateChange', gameState.turn);
        } else if (attackData.type === 'gravity') {
            gameState.soul.color = 'blue';
            gameState.soul.gravityDir = attackData.dir;
            io.emit('gravityChange', { color: 'blue', dir: attackData.dir });
        } else {
            // Repassa o ataque de ossos para o jogador renderizar
            io.emit('spawnProjectile', attackData);
        }
    });

    // Gerenciador do fim do turno do inimigo
    socket.on('endEnemyTurn', () => {
        gameState.turn = 'player';
        io.emit('stateChange', 'player');
    });

    socket.on('disconnect', () => {
        console.log('Jogador desconectou');
    });
});

http.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
    console.log('Link do Jogador: http://localhost:3000/?role=player');
    console.log('Link do Inimigo: http://localhost:3000/?role=sans');
});