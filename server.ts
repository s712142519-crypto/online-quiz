import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Game State
const games = new Map();

// Helper to generate game code
function generateGameCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Host: Create Game
    socket.on('createGame', async (quizData) => {
        const gameCode = generateGameCode();
        const qrCodeData = await QRCode.toDataURL(`${process.env.APP_URL || 'http://localhost:3000'}?join=${gameCode}`);
        
        games.set(gameCode, {
            hostId: socket.id,
            quizData: quizData,
            players: [],
            status: 'lobby',
            currentQuestionIndex: -1,
            leaderboard: [],
            answeredPlayers: new Set()
        });

        socket.join(gameCode);
        socket.emit('gameCreated', { gameCode, qrCodeData });
        console.log(`Game created: ${gameCode}`);
    });

    // Player: Join Game
    socket.on('joinGame', ({ gameCode, username, avatar }) => {
        const game = games.get(gameCode);
        if (game && game.status === 'lobby') {
            const player = {
                id: socket.id,
                username,
                avatar,
                score: 0,
                lastAnswerTime: 0
            };
            game.players.push(player);
            socket.join(gameCode);
            
            // Notify host and player
            io.to(gameCode).emit('playerJoined', game.players);
            socket.emit('joinedSuccessfully', { gameCode, username });
        } else {
            socket.emit('error', 'Game not found or already started');
        }
    });

    // Host: Start Quiz
    socket.on('startGame', (gameCode) => {
        const game = games.get(gameCode);
        if (game && game.hostId === socket.id) {
            game.status = 'playing';
            sendNextQuestion(gameCode);
        }
    });

    // Player: Submit Answer
    socket.on('submitAnswer', ({ gameCode, answerIndex, timeRemaining }) => {
        const game = games.get(gameCode);
        if (game && game.status === 'playing') {
            const player = game.players.find(p => p.id === socket.id);
            const question = game.quizData.questions[game.currentQuestionIndex];
            
            if (game.answeredPlayers.has(socket.id)) return; // Prevent double submission
            game.answeredPlayers.add(socket.id);

            const isCorrect = selectedAnswerIsCorrect(question, answerIndex);
            let points = 0;
            
            if (player && isCorrect) {
                points = Math.round(500 + (timeRemaining * 50));
                player.score += points;
            }
            
            // Send immediate feedback to the player
            socket.emit('answerFeedback', { isCorrect, points, score: player?.score || 0 });

            // Check if everyone answered
            if (game.answeredPlayers.size >= game.players.length) {
                io.to(game.hostId).emit('allAnswered');
            }
        }
    });

    // Host: Next Question
    socket.on('nextQuestion', (gameCode) => {
        const game = games.get(gameCode);
        if (game && game.hostId === socket.id) {
            sendNextQuestion(gameCode);
        }
    });

    function selectedAnswerIsCorrect(question, index) {
        return question.a === index;
    }

    function sendNextQuestion(gameCode) {
        const game = games.get(gameCode);
        if (!game) return;

        game.currentQuestionIndex++;
        game.answeredPlayers.clear(); // Reset answered players for new question

        if (game.currentQuestionIndex < game.quizData.questions.length) {
            const question = { ...game.quizData.questions[game.currentQuestionIndex] };
            delete question.a; // Hide answer from players
            
            io.to(gameCode).emit('newQuestion', {
                question,
                index: game.currentQuestionIndex,
                total: game.quizData.questions.length
            });
        } else {
            game.status = 'finished';
            const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
            io.to(gameCode).emit('quizFinished', sortedPlayers);
        }
    }

    // Host: Show Leaderboard
    socket.on('showLeaderboard', (gameCode) => {
        const game = games.get(gameCode);
        if (game && game.hostId === socket.id) {
            const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
            io.to(gameCode).emit('intermediateLeaderboard', sortedPlayers);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Handle cleanup if needed
    });
});

// Fallback for any other routes to index.html to prevent 403/404
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-stack Quiz Server running on port ${PORT}`);
});
