let socket;
let canvas, ctx;
let isDrawing = false;
let currentColor = 'black';
let brushSize = 3;
let drawingHistory = [];
let historyStep = -1;
let myId = null;
let currentRoom = null;
let isMyTurn = false;

// Sound effects (simple beep system)
const sounds = {
    correct: () => playBeep(800, 0.2),
    wrong: () => playBeep(200, 0.1),
    join: () => playBeep(600, 0.1),
    start: () => playBeep(500, 0.15),
    roundend: () => playBeep(400, 0.2),
    win: () => {
        playBeep(523, 0.15);
        setTimeout(() => playBeep(659, 0.15), 150);
        setTimeout(() => playBeep(784, 0.3), 300);
    },
    gamestart: () => {
        playBeep(400, 0.1);
        setTimeout(() => playBeep(500, 0.1), 100);
        setTimeout(() => playBeep(600, 0.2), 200);
    }
};

function playBeep(frequency, duration) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.log('Audio not supported');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    socket = io();
    
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setupEventListeners();
    setupSocketListeners();
    
    // Request rooms list immediately
    socket.emit('getRooms');
});

function setupEventListeners() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentColor = btn.dataset.color;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    document.getElementById('brushSize').addEventListener('input', (e) => {
        brushSize = e.target.value;
        document.getElementById('sizeDisplay').textContent = brushSize;
    });
    
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('fillBtn').addEventListener('click', fillCanvas);
    
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function setupSocketListeners() {
    socket.on('connect', () => {
        myId = socket.id;
        console.log('✅ Connected to server');
    });
    
    socket.on('roomsList', (rooms) => {
        displayRooms(rooms);
    });
    
    socket.on('joinedRoom', (data) => {
        currentRoom = data.roomId;
        document.getElementById('lobbyScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        document.getElementById('roomCode').textContent = data.roomId;
        
        if (data.settings) {
            document.getElementById('totalRounds').textContent = data.settings.rounds;
        }
        
        addChatMessage('✅ Joined room successfully!', 'system');
        addChatMessage('🎮 Waiting for more players to start...', 'system');
    });
    
    socket.on('playerJoined', (player) => {
        addChatMessage(`👋 ${player.name} joined the game`, 'system');
    });
    
    socket.on('playerLeft', (player) => {
        addChatMessage(`👋 ${player.name} left the game`, 'system');
    });
    
    socket.on('updatePlayers', (players) => {
        updatePlayerList(players);
    });
    
    socket.on('gameStart', (data) => {
        document.getElementById('totalRounds').textContent = data.rounds;
        addChatMessage('🎮 Game is starting!', 'system');
    });
    
    socket.on('newRound', (data) => {
        document.getElementById('currentRound').textContent = data.round;
        clearCanvas();
        document.getElementById('hintBox').style.display = 'none';
        addChatMessage(`🎨 Round ${data.round}: ${data.drawer} is drawing!`, 'system');
    });
    
    socket.on('chooseWord', (words) => {
        isMyTurn = true;
        canvas.classList.remove('disabled');
        showWordChoices(words);
        addChatMessage('✏️ Choose a word to draw!', 'system');
    });
    
    socket.on('startDrawing', (data) => {
        document.getElementById('wordChoices').style.display = 'none';
        document.getElementById('wordDisplay').textContent = data.wordDisplay;
        
        if (!isMyTurn) {
            canvas.classList.add('disabled');
            addChatMessage(`🎯 Guess the word! (${data.wordLength} letters)`, 'system');
        } else {
            addChatMessage('🎨 Start drawing!', 'system');
        }
    });
    
    socket.on('draw', (data) => {
        drawRemote(data);
    });
    
    socket.on('clearCanvas', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    socket.on('fill', (color) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    
    socket.on('message', (data) => {
        addChatMessage(`${data.player}: ${data.message}`, 'normal');
    });
    
    socket.on('correctGuess', (data) => {
        addChatMessage(`✅ ${data.player} guessed the word! +${data.points} points`, 'correct');
    });
    
    socket.on('closeGuess', (player) => {
        addChatMessage(`💡 ${player} is close!`, 'close');
    });
    
    socket.on('showHint', (hint) => {
        const hintBox = document.getElementById('hintBox');
        hintBox.textContent = `💡 Hint: ${hint}`;
        hintBox.style.display = 'block';
    });
    
    socket.on('roundEnd', (data) => {
        addChatMessage(`⏰ Round ended! The word was: ${data.word}`, 'system');
        isMyTurn = false;
        canvas.classList.add('disabled');
    });
    
    socket.on('gameEnd', (data) => {
        const winner = data.winner;
        addChatMessage(`🏆 Game Over! Winner: ${winner.name} with ${winner.score} points!`, 'system');
        addChatMessage('', 'system');
        addChatMessage('📊 Final Scores:', 'system');
        data.players.forEach((p, i) => {
            addChatMessage(`${i + 1}. ${p.name}: ${p.score} points`, 'system');
        });
        
        setTimeout(() => {
            if (confirm('🎉 Game ended! Play again?')) {
                location.reload();
            }
        }, 3000);
    });
    
    socket.on('timer', (time) => {
        document.getElementById('timer').textContent = time;
        
        // Change timer color based on time
        const timerEl = document.querySelector('.timer');
        if (time <= 10) {
            timerEl.style.color = '#f44336';
        } else if (time <= 30) {
            timerEl.style.color = '#ff9800';
        } else {
            timerEl.style.color = '#4CAF50';
        }
    });
    
    socket.on('playSound', (soundName) => {
        if (sounds[soundName]) {
            sounds[soundName]();
        }
    });
    
    socket.on('error', (message) => {
        alert('❌ ' + message);
    });
}

function createRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    const difficulty = document.getElementById('difficulty').value;
    const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
    const rounds = parseInt(document.getElementById('rounds').value);
    const timePerRound = parseInt(document.getElementById('timePerRound').value);
    const password = document.getElementById('password').value.trim();
    const customWordsInput = document.getElementById('customWords').value.trim();
    const customWords = customWordsInput ? customWordsInput.split(',').map(w => w.trim()) : [];
    
    if (!playerName) {
        alert('❌ Please enter your name');
        return;
    }
    
    socket.emit('createRoom', {
        playerName,
        difficulty,
        maxPlayers,
        rounds,
        timePerRound,
        password: password || null,
        customWords
    });
}

function quickJoin() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        alert('❌ Please enter your name');
        return;
    }
    
    socket.emit('quickJoin', { playerName });
}

function joinRoom(roomId, hasPassword) {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        alert('❌ Please enter your name');
        return;
    }
    
    let password = null;
    if (hasPassword) {
        password = prompt('🔒 Enter room password:');
        if (!password) return;
    }
    
    socket.emit('joinRoom', { roomId, playerName, password });
}

function displayRooms(rooms) {
    const roomList = document.getElementById('roomList');
    
    if (rooms.length === 0) {
        roomList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No rooms available. Create one!</p>';
        return;
    }
    
    roomList.innerHTML = rooms.map(room => `
        <div class="room-item">
            <div>
                <strong>🎮 Room ${room.id.substring(0, 6)}</strong>
                ${room.hasPassword ? '🔒' : '🌐'}
                <span class="difficulty-badge difficulty-${room.difficulty}">${room.difficulty}</span>
                <br>
                <small>👥 ${room.players}/${room.maxPlayers} | 🎯 ${room.rounds} rounds | ⏱️ ${room.timePerRound}s</small>
            </div>
            <button onclick="joinRoom('${room.id}', ${room.hasPassword})">Join</button>
        </div>
    `).join('');
}

function updatePlayerList(players) {
    if (!players) return;
    
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = players.map(player => `
        <li class="player-item ${player.isDrawing ? 'drawing' : ''} ${player.hasGuessed ? 'guessed' : ''}">
            <span>
                ${player.isDrawing ? '🎨 ' : ''}
                ${player.hasGuessed ? '✅ ' : ''}
                ${player.name}${player.id === myId ? ' (You)' : ''}
            </span>
            <span class="player-score">${player.score}</span>
        </li>
    `).join('');
}

function showWordChoices(words) {
    const container = document.getElementById('wordChoices');
    container.innerHTML = words.map((word, i) => `
        <button class="word-choice" onclick="selectWord(${i})">
            ${word.word}
            <span class="difficulty-badge difficulty-${word.difficulty}">${word.difficulty}</span>
        </button>
    `).join('');
    container.style.display = 'flex';
}

function selectWord(index) {
    socket.emit('wordChosen', index);
    document.getElementById('wordChoices').style.display = 'none';
}

function startDrawing(e) {
    if (!isMyTurn) return;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    socket.emit('startDraw', { x, y });
}

function draw(e) {
    if (!isDrawing || !isMyTurn) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();
    
    socket.emit('drawing', { x, y, color: currentColor, size: brushSize });
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        socket.emit('stopDraw');
        saveState();
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (e.type === 'touchstart') {
        if (!isMyTurn) return;
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
        socket.emit('startDraw', { x, y });
    } else if (e.type === 'touchmove' && isDrawing) {
        ctx.lineTo(x, y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
        ctx.stroke();
        socket.emit('drawing', { x, y, color: currentColor, size: brushSize });
    }
}

function drawRemote(data) {
    if (data.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
    } else if (data.type === 'draw') {
        ctx.lineTo(data.x, data.y);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.stroke();
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isMyTurn) {
        socket.emit('clear');
    }
    saveState();
}

function fillCanvas() {
    if (!isMyTurn) return;
    ctx.fillStyle = currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('fill', currentColor);
    saveState();
}

function saveState() {
    historyStep++;
    if (historyStep < drawingHistory.length) {
        drawingHistory.length = historyStep;
    }
    drawingHistory.push(canvas.toDataURL());
}

function undo() {
    if (historyStep > 0 && isMyTurn) {
        historyStep--;
        const img = new Image();
        img.src = drawingHistory[historyStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    socket.emit('guess', message);
    input.value = '';
}

function addChatMessage(text, type = 'normal') {
    const chatMessages = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = `chat-message ${type}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Auto-refresh rooms list
setInterval(() => {
    if (document.getElementById('lobbyScreen').classList.contains('active')) {
        socket.emit('getRooms');
    }
}, 3000);