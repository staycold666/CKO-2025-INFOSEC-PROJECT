// Snappy's Color Match Game

// Game variables
let pattern = [];
let playerPattern = [];
let level = 1;
let score = 0;
let isPlaying = false;
let canClick = false;

// DOM elements
const patternContainer = document.getElementById('pattern-container');
const statusMessage = document.getElementById('status-message');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('start-btn');
const resetButton = document.getElementById('reset-btn');
const colorButtons = document.querySelectorAll('.color-btn');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-btn');

// Colors array
const colors = ['red', 'blue', 'green', 'yellow'];

// Initialize game
function initGame() {
    pattern = [];
    playerPattern = [];
    level = 1;
    score = 0;
    isPlaying = false;
    canClick = false;
    
    updateUI();
    clearPatternDisplay();
    
    statusMessage.textContent = 'Press Start to begin!';
    gameOverScreen.classList.add('hidden');
}

// Update UI elements
function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
}

// Clear pattern display
function clearPatternDisplay() {
    patternContainer.innerHTML = '';
}

// Generate a random color
function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}

// Add a new color to the pattern
function addToPattern() {
    const newColor = getRandomColor();
    pattern.push(newColor);
}

// Display the pattern to the player
function showPattern() {
    canClick = false;
    statusMessage.textContent = 'Watch the pattern...';
    clearPatternDisplay();
    
    // Create circles for each color in the pattern
    pattern.forEach((color, index) => {
        const circle = document.createElement('div');
        circle.classList.add('pattern-circle');
        circle.style.backgroundColor = getColorCode(color);
        circle.style.opacity = '0.5';
        patternContainer.appendChild(circle);
    });
    
    // Animate the pattern
    const circles = document.querySelectorAll('.pattern-circle');
    let i = 0;
    
    const interval = setInterval(() => {
        if (i > 0) {
            circles[i - 1].style.opacity = '0.5';
        }
        
        if (i < circles.length) {
            circles[i].style.opacity = '1';
            i++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                statusMessage.textContent = 'Your turn! Repeat the pattern.';
                canClick = true;
            }, 500);
        }
    }, 800);
}

// Get the CSS color code from color name
function getColorCode(colorName) {
    switch (colorName) {
        case 'red': return '#e74c3c';
        case 'blue': return '#3498db';
        case 'green': return '#2ecc71';
        case 'yellow': return '#f1c40f';
        default: return '#333';
    }
}

// Handle player's color selection
function handleColorClick(event) {
    if (!isPlaying || !canClick) return;
    
    const clickedColor = event.target.getAttribute('data-color');
    playerPattern.push(clickedColor);
    
    // Flash the button
    event.target.classList.add('flash');
    setTimeout(() => {
        event.target.classList.remove('flash');
    }, 300);
    
    // Check if the player's selection matches the pattern
    const currentIndex = playerPattern.length - 1;
    
    if (playerPattern[currentIndex] !== pattern[currentIndex]) {
        // Wrong color selected
        gameOver();
        return;
    }
    
    // Check if the player has completed the current pattern
    if (playerPattern.length === pattern.length) {
        // Pattern completed successfully
        score += level * 10;
        level++;
        updateUI();
        
        playerPattern = [];
        canClick = false;
        
        statusMessage.textContent = 'Correct! Next level...';
        
        setTimeout(() => {
            nextLevel();
        }, 1500);
    }
}

// Start the next level
function nextLevel() {
    addToPattern();
    showPattern();
}

// Start the game
function startGame() {
    if (isPlaying) return;
    
    isPlaying = true;
    initGame();
    score = 0;
    level = 1;
    updateUI();
    
    setTimeout(() => {
        addToPattern();
        showPattern();
    }, 1000);
}

// Reset the game
function resetGame() {
    initGame();
}

// Game over
function gameOver() {
    isPlaying = false;
    canClick = false;
    
    statusMessage.textContent = 'Game Over!';
    finalScoreElement.textContent = score;
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 1000);
}

// Event listeners
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', resetGame);

colorButtons.forEach(button => {
    button.addEventListener('click', handleColorClick);
});

// Initialize the game on load
document.addEventListener('DOMContentLoaded', initGame);
