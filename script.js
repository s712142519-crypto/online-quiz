const socket = io();

// State
let myRole = '';
let myGameCode = '';
let myUsername = '';
let selectedAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
let timer;
let timeLeft = 15;

// DOM Elements
const pages = {
    role: document.getElementById('role-page'),
    hostLobby: document.getElementById('host-lobby-page'),
    playerJoin: document.getElementById('player-join-page'),
    playerWait: document.getElementById('player-wait-page'),
    quiz: document.getElementById('quiz-page'),
    result: document.getElementById('result-page'),
    genre: document.getElementById('genre-page'),
    createQuiz: document.getElementById('create-quiz-page')
};

function showPage(pageId) {
    Object.values(pages).forEach(p => {
        if (p) p.classList.remove('active');
    });
    if (pages[pageId]) pages[pageId].classList.add('active');
}

let selectedGenre = 'General Knowledge';
let customQuiz = {
    title: '',
    questions: []
};

function selectGenre(genre, icon) {
    selectedGenre = genre;
    const cards = document.querySelectorAll('.genre-card');
    cards.forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function proceedToCreation() {
    if (selectedGenre === 'Custom') {
        showPage('createQuiz');
        const list = document.getElementById('questions-list');
        if (list.children.length === 0) {
            addQuestionInput();
        }
    } else {
        // Use pre-defined genre
        initHost(selectedGenre);
    }
}

function addQuestionInput() {
    const list = document.getElementById('questions-list');
    const index = list.children.length;
    const div = document.createElement('div');
    div.className = 'question-input-block';
    div.innerHTML = `
        <input type="text" placeholder="Question ${index + 1}" class="q-input" style="margin-bottom: 10px; width: 100%; padding: 10px; border-radius: 8px; background: #2d3748; color: white; border: 1px solid #4a5568;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
            <input type="text" placeholder="Option 1" class="opt-input" style="width: 100%; padding: 8px; border-radius: 8px; background: #2d3748; color: white; border: 1px solid #4a5568;">
            <input type="text" placeholder="Option 2" class="opt-input" style="width: 100%; padding: 8px; border-radius: 8px; background: #2d3748; color: white; border: 1px solid #4a5568;">
            <input type="text" placeholder="Option 3" class="opt-input" style="width: 100%; padding: 8px; border-radius: 8px; background: #2d3748; color: white; border: 1px solid #4a5568;">
            <input type="text" placeholder="Option 4" class="opt-input" style="width: 100%; padding: 8px; border-radius: 8px; background: #2d3748; color: white; border: 1px solid #4a5568;">
        </div>
        <select class="correct-input" style="width: 100%; margin-top: 10px; padding: 10px; border-radius: 8px; background: #2d3748; color: white; border: 1px solid #4a5568;">
            <option value="0">Correct: Option 1</option>
            <option value="1">Correct: Option 2</option>
            <option value="2">Correct: Option 3</option>
            <option value="3">Correct: Option 4</option>
        </select>
    `;
    list.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function finishQuizCreation() {
    const title = document.getElementById('quiz-title').value || 'My Custom Quiz';
    const blocks = document.querySelectorAll('.question-input-block');
    const questions = [];

    blocks.forEach(block => {
        const q = block.querySelector('.q-input').value;
        const opts = Array.from(block.querySelectorAll('.opt-input')).map(i => i.value);
        const correct = parseInt(block.querySelector('.correct-input').value);

        if (q && opts.every(o => o)) {
            questions.push({ q, options: opts, a: correct });
        }
    });

    if (questions.length === 0) {
        alert('Please add at least one valid question!');
        return;
    }

    const quizData = { title, questions };
    myRole = 'host';
    socket.emit('createGame', quizData);
}

// Role Initialization
function initHost(genre) {
    myRole = 'host';
    // Pre-defined quizzes based on genre
    const quizzes = {
        'General Knowledge': {
            title: 'General Knowledge',
            questions: [
                { q: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], a: 2 },
                { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], a: 1 },
                { q: "What is 5 + 7?", options: ["10", "11", "12", "13"], a: 2 },
                { q: "Who painted the Mona Lisa?", options: ["Van Gogh", "Da Vinci", "Picasso", "Monet"], a: 1 },
                { q: "What is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], a: 3 }
            ]
        },
        'Books': {
            title: 'Books & Literature',
            questions: [
                { q: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], a: 1 },
                { q: "What is the first book of the Bible?", options: ["Exodus", "Genesis", "Leviticus", "Numbers"], a: 1 },
                { q: "Who is the author of 'Harry Potter'?", options: ["J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin", "Stephen King"], a: 1 },
                { q: "Which book features Sherlock Holmes?", options: ["A Study in Scarlet", "The Great Gatsby", "Moby Dick", "War and Peace"], a: 0 }
            ]
        },
        'Science': {
            title: 'Science Quiz',
            questions: [
                { q: "What is the chemical symbol for water?", options: ["O2", "H2O", "CO2", "NaCl"], a: 1 },
                { q: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], a: 2 },
                { q: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], a: 1 },
                { q: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "500,000 km/s"], a: 0 }
            ]
        },
        'History': {
            title: 'History Quiz',
            questions: [
                { q: "Who was the first President of the USA?", options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"], a: 2 },
                { q: "In which year did WWII end?", options: ["1943", "1944", "1945", "1946"], a: 2 },
                { q: "Which empire built the Colosseum?", options: ["Greek", "Roman", "Egyptian", "Persian"], a: 1 },
                { q: "Who was the first man on the moon?", options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], a: 1 }
            ]
        }
    };

    const quizData = quizzes[genre] || quizzes['General Knowledge'];
    socket.emit('createGame', quizData);
}

function initPlayer() {
    myRole = 'player';
    showPage('playerJoin');
    renderAvatars();
    
    // Auto-fill code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('join');
    if (code) document.getElementById('join-code').value = code;
}

function renderAvatars() {
    const container = document.getElementById('avatar-selection');
    // Generate 20 random avatars for swiping
    const seeds = Array.from({length: 20}, (_, i) => `User${i}${Math.random().toString(36).substring(7)}`);
    container.innerHTML = '';
    
    seeds.forEach((seed, i) => {
        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        const img = document.createElement('img');
        img.src = url;
        img.className = 'avatar-option';
        if (i === 0) {
            img.classList.add('selected');
            selectedAvatar = url;
        }
        img.onclick = () => {
            selectedAvatar = url;
            const all = container.querySelectorAll('img');
            all.forEach(el => el.classList.remove('selected'));
            img.classList.add('selected');
            img.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        };
        container.appendChild(img);
    });
}

function shuffleAvatars() {
    // No longer needed as we have swiping, but keeping for compatibility if called
    renderAvatars();
}

// Socket Events
socket.on('gameCreated', ({ gameCode, qrCodeData }) => {
    myGameCode = gameCode;
    document.getElementById('game-code').innerText = gameCode;
    document.getElementById('qr-code').src = qrCodeData;
    
    // Update banner
    document.getElementById('banner-url').innerText = window.location.host;
    document.getElementById('banner-code').innerText = gameCode;
    document.getElementById('code-banner').style.display = 'block';
    
    showPage('hostLobby');
});

socket.on('answerFeedback', ({ isCorrect, points, score }) => {
    const overlay = document.getElementById('feedback-overlay');
    const icon = document.getElementById('feedback-icon');
    const text = document.getElementById('feedback-text');
    const pts = document.getElementById('feedback-points');
    
    overlay.className = `feedback-overlay ${isCorrect ? 'correct' : 'wrong'}`;
    icon.className = `fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'} feedback-icon`;
    text.innerText = isCorrect ? 'Correct!' : 'Wrong!';
    pts.innerText = isCorrect ? `+${points} pts` : 'Better luck next time!';
    
    overlay.style.display = 'flex';
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 2000);
});

socket.on('intermediateLeaderboard', (leaderboard) => {
    const overlay = document.getElementById('leaderboard-overlay');
    const list = document.getElementById('mid-leaderboard-list');
    list.innerHTML = '';
    
    const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(p => p.score)) : 1;
    
    leaderboard.slice(0, 5).forEach((p, i) => {
        const div = document.createElement('div');
        div.className = `leaderboard-item ${i === 0 ? 'top-rank' : ''}`;
        
        const progressWidth = (p.score / maxScore) * 100;
        
        div.innerHTML = `
            <div class="leaderboard-progress" style="width: ${progressWidth}%"></div>
            <span style="font-weight: 700;">#${i+1} ${p.username}</span>
            <span style="font-weight: 800;">${p.score} pts</span>
        `;
        list.appendChild(div);
    });
    
    overlay.style.display = 'block';
});

socket.on('allAnswered', () => {
    if (myRole === 'host' && timer) {
        // Speed up the timer when everyone has answered
        timeLeft = Math.min(timeLeft, 2); 
    }
});

socket.on('playerJoined', (players) => {
    if (myRole === 'host') {
        document.getElementById('player-count').innerText = players.length;
        const lobby = document.getElementById('lobby-players');
        lobby.innerHTML = '';
        players.forEach(p => {
            const div = document.createElement('div');
            div.className = 'player-tag';
            div.innerText = p.username;
            lobby.appendChild(div);
        });
    }
});

socket.on('joinedSuccessfully', ({ gameCode, username }) => {
    myGameCode = gameCode;
    myUsername = username;
    showPage('playerWait');
});

socket.on('newQuestion', ({ question, index, total }) => {
    document.getElementById('leaderboard-overlay').style.display = 'none';
    showPage('quiz');
    document.getElementById('quiz-info').innerText = `Question ${index + 1}/${total}`;
    document.getElementById('question-text').innerText = question.q;
    
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';
    question.options.forEach((opt, i) => {
        const btn = document.createElement('div');
        btn.className = 'option';
        btn.innerText = opt;
        btn.onclick = () => submitAnswer(i, btn);
        grid.appendChild(btn);
    });

    startTimer();
});

socket.on('quizFinished', (leaderboard) => {
    showPage('result');
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(p => p.score)) : 1;
    
    leaderboard.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = `leaderboard-item ${i === 0 ? 'top-rank' : ''}`;
        
        const progressWidth = (p.score / maxScore) * 100;
        
        div.innerHTML = `
            <div class="leaderboard-progress" style="width: ${progressWidth}%"></div>
            <span style="font-weight: 700;">#${i+1} ${p.username}</span>
            <span style="font-weight: 800;">${p.score} pts</span>
        `;
        list.appendChild(div);
    });
});

socket.on('error', (msg) => alert(msg));

// Game Actions
function joinGame() {
    const gameCode = document.getElementById('join-code').value;
    const username = document.getElementById('join-username').value;
    if (!gameCode || !username) return alert("Fill all fields!");
    
    socket.emit('joinGame', { gameCode, username, avatar: selectedAvatar });
}

function startGame() {
    socket.emit('startGame', myGameCode);
}

function submitAnswer(index, element) {
    if (myRole !== 'player') return;
    
    clearInterval(timer);
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.add('disabled'));
    element.style.borderColor = 'white';
    element.style.background = 'rgba(255,255,255,0.3)';
    
    socket.emit('submitAnswer', {
        gameCode: myGameCode,
        answerIndex: index,
        timeRemaining: timeLeft
    });
}

function nextQuestion() {
    socket.emit('nextQuestion', myGameCode);
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
    document.getElementById('timer-text').innerText = timeLeft;
    document.getElementById('progress-bar').style.width = '100%';
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').innerText = timeLeft;
        document.getElementById('progress-bar').style.width = `${(timeLeft/15)*100}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (myRole === 'host') {
                // Show leaderboard before next question
                socket.emit('showLeaderboard', myGameCode);
            }
        }
    }, 1000);
}

// Initial Check
window.onload = () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');

    if (joinCode) {
        myRole = 'player';
        showPage('playerJoin');
        document.getElementById('join-code').value = joinCode;
        renderAvatars();
    } else {
        showPage('role');
    }
};
