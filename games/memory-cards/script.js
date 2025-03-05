// Snappy's Memory Cards Game

// Game variables
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 8;
let moves = 0;
let timer = 60;
let isPlaying = false;
let timerInterval;

// Card content - emojis for card faces
const cardEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'
];

// DOM elements
const gameBoard = document.getElementById('game-board');
const pairsFoundElement = document.getElementById('pairs-found');
const totalPairsElement = document.getElementById('total-pairs');
const timerElement = document.getElementById('timer');
const movesElement = document.getElementById('moves');
const startButton = document.getElementById('start-btn');
const resetButton = document.getElementById('reset-btn');
const gameOverScreen = document.getElementById('game-over');
const victoryScreen = document.getElementById('victory');
const finalPairsElement = document.getElementById('final-pairs');
const finalMovesElement = document.getElementById('final-moves');
const resultMessageElement = document.getElementById('result-message');
const victoryTimeElement = document.getElementById('victory-time');
const victoryMovesElement = document.getElementById('victory-moves');
const playAgainButton = document.getElementById('play-again-btn');
const playAgainVictoryButton = document.getElementById('play-again-victory-btn');

// Initialize game
function initGame() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    timer = 60;
    isPlaying = false;
    
    clearInterval(timerInterval);
    
    updateUI();
    gameBoard.innerHTML = '';
    
    gameOverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
}

// Update UI elements
function updateUI() {
    pairsFoundElement.textContent = matchedPairs;
    totalPairsElement.textContent = totalPairs;
    timerElement.textContent = timer;
    movesElement.textContent = moves;
    
    // Update timer color based on remaining time
    const timerContainer = document.querySelector('.timer-container');
    if (timer <= 10) {
        timerContainer.classList.add('danger');
        timerContainer.classList.remove('warning');
    } else if (timer <= 20) {
        timerContainer.classList.add('warning');
        timerContainer.classList.remove('danger');
    } else {
        timerContainer.classList.remove('warning', 'danger');
    }
}

// Generate a shuffled array of card values
function generateCards() {
    // Select random emojis from the array
    const selectedEmojis = [...cardEmojis]
        .sort(() => 0.5 - Math.random())
        .slice(0, totalPairs);
    
    // Create pairs of each emoji
    const cardValues = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle the cards
    return cardValues.sort(() => 0.5 - Math.random());
}

// Create card elements and add to the game board
function createCardElements() {
    const cardValues = generateCards();
    
    cardValues.forEach((value, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index;
        card.dataset.value = value;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${value}</div>
            </div>
        `;
        
        card.addEventListener('click', handleCardClick);
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

// Handle card click
function handleCardClick(event) {
    if (!isPlaying) return;
    
    const clickedCard = event.currentTarget;
    
    // Ignore if card is already flipped or matched
    if (
        flippedCards.length >= 2 ||
        clickedCard.classList.contains('flipped') ||
        clickedCard.classList.contains('matched')
    ) {
        return;
    }
    
    // Flip the card
    clickedCard.classList.add('flipped');
    flippedCards.push(clickedCard);
    
    // Check for a match if two cards are flipped
    if (flippedCards.length === 2) {
        moves++;
        movesElement.textContent = moves;
        
        const [card1, card2] = flippedCards;
        
        if (card1.dataset.value === card2.dataset.value) {
            // Match found
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                flippedCards = [];
                
                matchedPairs++;
                pairsFoundElement.textContent = matchedPairs;
                
                // Check for victory
                if (matchedPairs === totalPairs) {
                    victory();
                }
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                
                // Add shake animation
                card1.classList.add('shake');
                card2.classList.add('shake');
                
                setTimeout(() => {
                    card1.classList.remove('shake');
                    card2.classList.remove('shake');
                    flippedCards = [];
                }, 500);
            }, 1000);
        }
    }
}

// Start the game
function startGame() {
    if (isPlaying) return;
    
    initGame();
    isPlaying = true;
    
    createCardElements();
    
    // Start the timer
    timerInterval = setInterval(() => {
        timer--;
        updateUI();
        
        if (timer <= 0) {
            clearInterval(timerInterval);
            gameOver();
        }
    }, 1000);
}

// Reset the game
function resetGame() {
    initGame();
}

// Game over
function gameOver() {
    isPlaying = false;
    clearInterval(timerInterval);
    
    finalPairsElement.textContent = matchedPairs;
    finalMovesElement.textContent = moves;
    
    // Set result message based on performance
    if (matchedPairs === 0) {
        resultMessageElement.textContent = "Try again, you can do better!";
    } else if (matchedPairs < totalPairs / 2) {
        resultMessageElement.textContent = "Good effort, but you can improve!";
    } else if (matchedPairs < totalPairs) {
        resultMessageElement.textContent = "Almost there! Try again for a perfect score.";
    }
    
    gameOverScreen.classList.remove('hidden');
}

// Victory
function victory() {
    isPlaying = false;
    clearInterval(timerInterval);
    
    const timeSpent = 60 - timer;
    victoryTimeElement.textContent = timeSpent;
    victoryMovesElement.textContent = moves;
    
    victoryScreen.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', resetGame);
playAgainVictoryButton.addEventListener('click', resetGame);

// Initialize the game on load
document.addEventListener('DOMContentLoaded', initGame);
