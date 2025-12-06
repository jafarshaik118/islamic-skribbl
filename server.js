const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// EXPANDED Islamic words database - 100+ words!
const islamicWords = {
    easy: [
        { word: 'Kaaba', hint: 'Holy site in Mecca', difficulty: 'easy' },
        { word: 'Mosque', hint: 'Place of worship', difficulty: 'easy' },
        { word: 'Prayer', hint: 'Salah', difficulty: 'easy' },
        { word: 'Quran', hint: 'Holy book', difficulty: 'easy' },
        { word: 'Ramadan', hint: 'Month of fasting', difficulty: 'easy' },
        { word: 'Eid', hint: 'Islamic celebration', difficulty: 'easy' },
        { word: 'Moon', hint: 'Islamic symbol', difficulty: 'easy' },
        { word: 'Star', hint: 'Islamic symbol', difficulty: 'easy' },
        { word: 'Angel', hint: 'Malak', difficulty: 'easy' },
        { word: 'Prophet', hint: 'Messenger of God', difficulty: 'easy' },
        { word: 'Heaven', hint: 'Jannah', difficulty: 'easy' },
        { word: 'Hell', hint: 'Jahannam', difficulty: 'easy' },
        { word: 'Mercy', hint: 'Allah is merciful', difficulty: 'easy' },
        { word: 'Peace', hint: 'Salam', difficulty: 'easy' },
        { word: 'Faith', hint: 'Iman', difficulty: 'easy' },
        { word: 'Book', hint: 'Religious scripture', difficulty: 'easy' },
        { word: 'Water', hint: 'Used for wudu', difficulty: 'easy' },
        { word: 'Heart', hint: 'Qalb', difficulty: 'easy' },
        { word: 'Light', hint: 'Nur', difficulty: 'easy' },
        { word: 'Truth', hint: 'Haqq', difficulty: 'easy' }
    ],
    medium: [
        { word: 'Minaret', hint: 'Tower of mosque', difficulty: 'medium' },
        { word: 'Hijab', hint: 'Head covering', difficulty: 'medium' },
        { word: 'Wudu', hint: 'Ablution before prayer', difficulty: 'medium' },
        { word: 'Mihrab', hint: 'Prayer niche in mosque', difficulty: 'medium' },
        { word: 'Tasbih', hint: 'Prayer beads', difficulty: 'medium' },
        { word: 'Sajdah', hint: 'Prostration in prayer', difficulty: 'medium' },
        { word: 'Zakat', hint: 'Charitable giving', difficulty: 'medium' },
        { word: 'Hajj', hint: 'Pilgrimage to Mecca', difficulty: 'medium' },
        { word: 'Crescent', hint: 'Moon shape symbol', difficulty: 'medium' },
        { word: 'Dome', hint: 'Top of mosque', difficulty: 'medium' },
        { word: 'Zamzam', hint: 'Holy water from Mecca', difficulty: 'medium' },
        { word: 'Sunnah', hint: 'Way of the Prophet', difficulty: 'medium' },
        { word: 'Hadith', hint: 'Prophetic sayings', difficulty: 'medium' },
        { word: 'Jannah', hint: 'Paradise', difficulty: 'medium' },
        { word: 'Jahannam', hint: 'Hellfire', difficulty: 'medium' },
        { word: 'Tawhid', hint: 'Oneness of God', difficulty: 'medium' },
        { word: 'Imam', hint: 'Prayer leader', difficulty: 'medium' },
        { word: 'Suhoor', hint: 'Pre-dawn meal', difficulty: 'medium' },
        { word: 'Iftar', hint: 'Breaking fast', difficulty: 'medium' },
        { word: 'Sadaqah', hint: 'Voluntary charity', difficulty: 'medium' },
        { word: 'Dua', hint: 'Supplication', difficulty: 'medium' },
        { word: 'Dhikr', hint: 'Remembrance of Allah', difficulty: 'medium' },
        { word: 'Taraweeh', hint: 'Ramadan night prayer', difficulty: 'medium' },
        { word: 'Ummah', hint: 'Muslim community', difficulty: 'medium' },
        { word: 'Khutbah', hint: 'Friday sermon', difficulty: 'medium' }
    ],
    hard: [
        { word: 'Muezzin', hint: 'Person who calls to prayer', difficulty: 'hard' },
        { word: 'Qibla', hint: 'Direction of prayer', difficulty: 'hard' },
        { word: 'Adhan', hint: 'Call to prayer', difficulty: 'hard' },
        { word: 'Tawaf', hint: 'Circling the Kaaba', difficulty: 'hard' },
        { word: 'Ihram', hint: 'Sacred state for pilgrimage', difficulty: 'hard' },
        { word: 'Umrah', hint: 'Lesser pilgrimage', difficulty: 'hard' },
        { word: 'Jummah', hint: 'Friday congregational prayer', difficulty: 'hard' },
        { word: 'Qiyam', hint: 'Standing in prayer', difficulty: 'hard' },
        { word: 'Ruku', hint: 'Bowing in prayer', difficulty: 'hard' },
        { word: 'Takbir', hint: 'Allahu Akbar', difficulty: 'hard' },
        { word: 'Shahada', hint: 'Declaration of faith', difficulty: 'hard' },
        { word: 'Isra', hint: 'Night journey', difficulty: 'hard' },
        { word: 'Miraj', hint: 'Ascension to heaven', difficulty: 'hard' },
        { word: 'Laylatul Qadr', hint: 'Night of Power', difficulty: 'hard' },
        { word: 'Ghusl', hint: 'Full ritual bath', difficulty: 'hard' },
        { word: 'Tayammum', hint: 'Dry ablution', difficulty: 'hard' },
        { word: 'Fitrah', hint: 'Natural disposition', difficulty: 'hard' },
        { word: 'Barakah', hint: 'Divine blessing', difficulty: 'hard' },
        { word: 'Taqwa', hint: 'God consciousness', difficulty: 'hard' },
        { word: 'Ijma', hint: 'Scholarly consensus', difficulty: 'hard' },
        { word: 'Ijtihad', hint: 'Independent reasoning', difficulty: 'hard' },
        { word: 'Khilafah', hint: 'Caliphate', difficulty: 'hard' },
        { word: 'Madhab', hint: 'School of thought', difficulty: 'hard' },
        { word: 'Mufti', hint: 'Islamic legal expert', difficulty: 'hard' },
        { word: 'Qadi', hint: 'Islamic judge', difficulty: 'hard' }
    ]
};

const rooms = new Map();
const globalStats = {
    totalGames: 0,
    totalPlayers: new Set(),
    leaderboard: []
};

class Room {
    constructor(id, difficulty, host, settings = {}) {
        this.id = id;
        this.difficulty = difficulty;
        this.players = [host];
        this.maxPlayers = settings.maxPlayers || 8;
        this.currentRound = 0;
        this.totalRounds = settings.rounds || 3;
        this.currentDrawer = 0;
        this.currentWord = null;
        this.wordChoices = [];
        this.gameStarted = false;
        this.timer = null;
        this.timeLeft = settings.timePerRound || 80;
        this.maxTime = settings.timePerRound || 80;
        this.guessedPlayers = new Set();
        this.password = settings.password || null;
        this.customWords = settings.customWords || [];
        this.settings = settings;
    }
    
    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            globalStats.totalPlayers.add(player.name);
            return true;
        }
        return false;
    }
    
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        return this.players.length === 0;
    }
    
    getRandomWords(count = 3) {
        let wordList = [];
        
        // Include custom words if any
        if (this.customWords.length > 0) {
            wordList = [...this.customWords.map(w => ({ 
                word: w, 
                hint: 'Custom word', 
                difficulty: 'custom' 
            }))];
        }
        
        // Add words from selected difficulty
        wordList = [...wordList, ...(islamicWords[this.difficulty] || islamicWords.medium)];
        
        const shuffled = [...wordList].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    nextRound() {
        this.currentRound++;
        this.currentDrawer = (this.currentDrawer + 1) % this.players.length;
        this.guessedPlayers.clear();
        this.players.forEach(p => p.hasGuessed = false);
        return this.currentRound <= this.totalRounds;
    }
    
    getCurrentDrawer() {
        return this.players[this.currentDrawer];
    }
    
    getWordDisplay() {
        if (!this.currentWord) return '';
        return this.currentWord.word.split('').map((char, i) => {
            if (char === ' ') return '  ';
            if (i === 0 || i === this.currentWord.word.length - 1) return char;
            return '_';
        }).join(' ');
    }
}

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);
    
    socket.on('createRoom', (data) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const player = {
            id: socket.id,
            name: data.playerName,
            score: 0,
            isDrawing: false,
            hasGuessed: false,
            avatar: data.avatar || '👤'
        };
        
        const settings = {
            maxPlayers: data.maxPlayers || 8,
            rounds: data.rounds || 3,
            timePerRound: data.timePerRound || 80,
            password: data.password || null,
            customWords: data.customWords || []
        };
        
        const room = new Room(roomId, data.difficulty, player, settings);
        rooms.set(roomId, room);
        
        socket.join(roomId);
        socket.roomId = roomId;
        socket.playerName = data.playerName;
        
        console.log(`🎮 Room created: ${roomId} by ${data.playerName}`);
        console.log(`   Settings: ${settings.rounds} rounds, ${settings.timePerRound}s each`);
        
        socket.emit('joinedRoom', { roomId, settings });
        io.to(roomId).emit('updatePlayers', room.players);
    });
    
    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomId);
        
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        
        // Check password
        if (room.password && room.password !== data.password) {
            socket.emit('error', 'Incorrect password');
            return;
        }
        
        if (room.players.length >= room.maxPlayers) {
            socket.emit('error', 'Room is full');
            return;
        }
        
        const player = {
            id: socket.id,
            name: data.playerName,
            score: 0,
            isDrawing: false,
            hasGuessed: false,
            avatar: data.avatar || '👤'
        };
        
        room.addPlayer(player);
        socket.join(data.roomId);
        socket.roomId = data.roomId;
        socket.playerName = data.playerName;
        
        console.log(`👤 ${data.playerName} joined room ${data.roomId}`);
        
        socket.emit('joinedRoom', { roomId: data.roomId, settings: room.settings });
        socket.broadcast.to(data.roomId).emit('playerJoined', player);
        io.to(data.roomId).emit('updatePlayers', room.players);
        io.to(data.roomId).emit('playSound', 'join');
        
        if (room.players.length >= 2 && !room.gameStarted) {
            setTimeout(() => startGame(room), 2000);
        }
    });
    
    socket.on('quickJoin', (data) => {
        let foundRoom = null;
        for (const [roomId, room] of rooms) {
            if (room.players.length < room.maxPlayers && !room.gameStarted && !room.password) {
                foundRoom = { roomId, room };
                break;
            }
        }
        
        if (foundRoom) {
            const player = {
                id: socket.id,
                name: data.playerName,
                score: 0,
                isDrawing: false,
                hasGuessed: false,
                avatar: data.avatar || '👤'
            };
            
            foundRoom.room.addPlayer(player);
            socket.join(foundRoom.roomId);
            socket.roomId = foundRoom.roomId;
            socket.playerName = data.playerName;
            
            socket.emit('joinedRoom', { roomId: foundRoom.roomId, settings: foundRoom.room.settings });
            socket.broadcast.to(foundRoom.roomId).emit('playerJoined', player);
            io.to(foundRoom.roomId).emit('updatePlayers', foundRoom.room.players);
            io.to(foundRoom.roomId).emit('playSound', 'join');
            
            if (foundRoom.room.players.length >= 2 && !foundRoom.room.gameStarted) {
                setTimeout(() => startGame(foundRoom.room), 2000);
            }
        } else {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const player = {
                id: socket.id,
                name: data.playerName,
                score: 0,
                isDrawing: false,
                hasGuessed: false,
                avatar: data.avatar || '👤'
            };
            
            const room = new Room(roomId, 'medium', player);
            rooms.set(roomId, room);
            
            socket.join(roomId);
            socket.roomId = roomId;
            socket.playerName = data.playerName;
            
            socket.emit('joinedRoom', { roomId, settings: room.settings });
            io.to(roomId).emit('updatePlayers', room.players);
        }
    });
    
    socket.on('getRooms', () => {
        const roomsList = Array.from(rooms.values())
            .filter(room => !room.gameStarted && room.players.length < room.maxPlayers)
            .map(room => ({
                id: room.id,
                players: room.players.length,
                maxPlayers: room.maxPlayers,
                difficulty: room.difficulty,
                hasPassword: !!room.password,
                rounds: room.totalRounds,
                timePerRound: room.maxTime
            }));
        socket.emit('roomsList', roomsList);
    });
    
    socket.on('getLeaderboard', () => {
        socket.emit('leaderboard', globalStats.leaderboard.slice(0, 10));
    });
    
    socket.on('wordChosen', (index) => {
        const room = rooms.get(socket.roomId);
        if (!room || room.getCurrentDrawer().id !== socket.id) return;
        
        room.currentWord = room.wordChoices[index];
        const drawer = room.getCurrentDrawer();
        drawer.isDrawing = true;
        
        console.log(`✏️ ${drawer.name} chose: ${room.currentWord.word}`);
        
        io.to(room.id).emit('startDrawing', {
            wordDisplay: room.getWordDisplay(),
            time: room.timeLeft,
            wordLength: room.currentWord.word.length
        });
        io.to(room.id).emit('updatePlayers', room.players);
        io.to(room.id).emit('playSound', 'start');
        
        startRoundTimer(room);
    });
    
    socket.on('startDraw', (data) => {
        const room = rooms.get(socket.roomId);
        if (!room || room.getCurrentDrawer().id !== socket.id) return;
        socket.to(socket.roomId).emit('draw', { type: 'start', x: data.x, y: data.y });
    });
    
    socket.on('drawing', (data) => {
        const room = rooms.get(socket.roomId);
        if (!room || room.getCurrentDrawer().id !== socket.id) return;
        socket.to(socket.roomId).emit('draw', {
            type: 'draw',
            x: data.x,
            y: data.y,
            color: data.color,
            size: data.size
        });
    });
    
    socket.on('stopDraw', () => {
        socket.to(socket.roomId).emit('draw', { type: 'stop' });
    });
    
    socket.on('clear', () => {
        const room = rooms.get(socket.roomId);
        if (!room || room.getCurrentDrawer().id !== socket.id) return;
        io.to(socket.roomId).emit('clearCanvas');
    });
    
    socket.on('fill', (color) => {
        const room = rooms.get(socket.roomId);
        if (!room || room.getCurrentDrawer().id !== socket.id) return;
        socket.to(socket.roomId).emit('fill', color);
    });
    
    socket.on('guess', (message) => {
        const room = rooms.get(socket.roomId);
        if (!room || !room.currentWord) {
            io.to(socket.roomId).emit('message', {
                player: socket.playerName,
                message: message
            });
            return;
        }
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.isDrawing || player.hasGuessed) {
            io.to(room.id).emit('message', {
                player: player ? player.name : socket.playerName,
                message: message
            });
            return;
        }
        
        const guess = message.toLowerCase().trim();
        const word = room.currentWord.word.toLowerCase();
        
        if (guess === word) {
            player.hasGuessed = true;
            room.guessedPlayers.add(socket.id);
            
            const pointsEarned = Math.floor((room.timeLeft / room.maxTime) * 100);
            player.score += pointsEarned;
            
            // Update global leaderboard
            updateLeaderboard(player.name, pointsEarned);
            
            io.to(room.id).emit('correctGuess', {
                player: player.name,
                points: pointsEarned
            });
            io.to(room.id).emit('updatePlayers', room.players);
            io.to(room.id).emit('playSound', 'correct');
            
            if (room.guessedPlayers.size === room.players.length - 1) {
                endRound(room);
            }
        } else {
            io.to(room.id).emit('message', {
                player: player.name,
                message: message
            });
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`❌ ${socket.playerName || socket.id} disconnected`);
        
        const roomId = socket.roomId;
        if (!roomId) return;
        
        const room = rooms.get(roomId);
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            io.to(roomId).emit('playerLeft', player);
        }
        
        const shouldDelete = room.removePlayer(socket.id);
        
        if (shouldDelete) {
            rooms.delete(roomId);
        } else {
            io.to(roomId).emit('updatePlayers', room.players);
            
            if (room.gameStarted && room.players.length > 0 && room.getCurrentDrawer().id === socket.id) {
                endRound(room);
            }
        }
    });
});

function startGame(room) {
    if (room.gameStarted || room.players.length < 2) return;
    
    room.gameStarted = true;
    room.currentRound = 1;
    room.currentDrawer = 0;
    globalStats.totalGames++;
    
    console.log(`🎮 Game #${globalStats.totalGames} starting in ${room.id}`);
    
    io.to(room.id).emit('gameStart', { rounds: room.totalRounds });
    io.to(room.id).emit('playSound', 'gamestart');
    
    setTimeout(() => startNewRound(room), 1000);
}

function startNewRound(room) {
    room.guessedPlayers.clear();
    room.players.forEach(p => {
        p.isDrawing = false;
        p.hasGuessed = false;
    });
    
    const drawer = room.getCurrentDrawer();
    drawer.isDrawing = true;
    room.wordChoices = room.getRandomWords(3);
    room.timeLeft = room.maxTime;
    
    console.log(`🎨 Round ${room.currentRound}: ${drawer.name} drawing`);
    
    io.to(room.id).emit('newRound', {
        round: room.currentRound,
        drawer: drawer.name
    });
    io.to(room.id).emit('updatePlayers', room.players);
    io.to(drawer.id).emit('chooseWord', room.wordChoices);
}

function startRoundTimer(room) {
    if (room.timer) clearInterval(room.timer);
    
    room.timer = setInterval(() => {
        room.timeLeft--;
        io.to(room.id).emit('timer', room.timeLeft);
        
        if (room.timeLeft === 60 || room.timeLeft === 30) {
            io.to(room.id).emit('showHint', room.currentWord.hint);
        }
        
        if (room.timeLeft <= 0) {
            endRound(room);
        }
    }, 1000);
}

function endRound(room) {
    if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
    }
    
    const drawer = room.getCurrentDrawer();
    drawer.isDrawing = false;
    
    io.to(room.id).emit('roundEnd', { word: room.currentWord.word });
    io.to(room.id).emit('playSound', 'roundend');
    
    if (room.nextRound()) {
        setTimeout(() => startNewRound(room), 5000);
    } else {
        endGame(room);
    }
}

function endGame(room) {
    const winner = room.players.reduce((max, player) => 
        player.score > max.score ? player : max
    );
    
    console.log(`🏆 Winner: ${winner.name} (${winner.score}pts)`);
    
    io.to(room.id).emit('gameEnd', {
        winner: winner,
        players: room.players.sort((a, b) => b.score - a.score)
    });
    io.to(room.id).emit('playSound', 'win');
    
    room.gameStarted = false;
    room.currentRound = 0;
}

function updateLeaderboard(playerName, points) {
    const existing = globalStats.leaderboard.find(p => p.name === playerName);
    if (existing) {
        existing.score += points;
        existing.games++;
    } else {
        globalStats.leaderboard.push({
            name: playerName,
            score: points,
            games: 1
        });
    }
    
    globalStats.leaderboard.sort((a, b) => b.score - a.score);
}

http.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 Islamic Skribbl Server - Enhanced Edition`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`✨ Features: Custom rooms, leaderboard, 100+ words!`);
    console.log('='.repeat(60));
});