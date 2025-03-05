// Snappy's Word Search Game

// Game variables
let grid = [];
let words = [];
let foundWords = [];
let gridSize = 10;
let difficulty = 'medium';
let selectedCells = [];
let currentWord = '';
let hintTimeout;

// Word categories and lists
const wordCategories = {
    animals: ['DOG', 'CAT', 'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'EAGLE', 'SNAKE', 'FROG', 'MOUSE', 'RABBIT', 'DEER', 'ZEBRA', 'GIRAFFE', 'ELEPHANT', 'MONKEY', 'PANDA', 'KOALA', 'PENGUIN'],
    fruits: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'LEMON', 'MANGO', 'PEACH', 'PEAR', 'CHERRY', 'KIWI', 'MELON', 'PLUM', 'FIG', 'LIME', 'COCONUT', 'AVOCADO', 'PAPAYA', 'GUAVA', 'PINEAPPLE', 'STRAWBERRY'],
    countries: ['USA', 'CANADA', 'MEXICO', 'BRAZIL', 'FRANCE', 'GERMANY', 'ITALY', 'SPAIN', 'CHINA', 'JAPAN', 'INDIA', 'RUSSIA', 'EGYPT', 'KENYA', 'AUSTRALIA', 'PERU', 'CHILE', 'CUBA', 'GREECE', 'SWEDEN'],
    colors: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'BROWN', 'BLACK', 'WHITE', 'GRAY', 'TEAL', 'NAVY', 'GOLD', 'SILVER', 'MAROON', 'VIOLET', 'INDIGO', 'CORAL', 'TURQUOISE']
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const wordList = document.getElementById('word-list');
const wordsFoundElement = document.getElementById('words-found');
const totalWordsElement = document.getElementById('total-words');
const difficultySelect = document.getElementById('difficulty-select');
const startButton = document.getElementById('start-btn');
const hintButton = document.getElementById('hint-btn');
const victoryScreen = document.getElementById('victory');
const playAgainButton = document.getElementById('play-again-btn');

// Direction vectors for word placement
const directions = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
    [0, -1],  // left
    [-1, 0],  // up
    [-1, 1],  // diagonal up-right
    [-1, -1]  // diagonal up-left
];

// Initialize game
function initGame() {
    // Clear any existing hint timeout
    if (hintTimeout) {
        clearTimeout(hintTimeout);
        hintTimeout = null;
    }
    
    // Reset game state
    grid = [];
    words = [];
    foundWords = [];
    selectedCells = [];
    currentWord = '';
    
    // Set grid size based on difficulty
    difficulty = difficultySelect.value;
    switch (difficulty) {
        case 'easy':
            gridSize = 8;
            break;
        case 'medium':
            gridSize = 10;
            break;
        case 'hard':
            gridSize = 12;
            break;
    }
    
    // Generate words for the puzzle
    generateWords();
    
    // Create the grid
    createGrid();
    
    // Place words in the grid
    placeWords();
    
    // Fill remaining cells with random letters
    fillGrid();
    
    // Render the grid and word list
    renderGrid();
    renderWordList();
    
    // Update UI
    updateUI();
    
    // Hide victory screen
    victoryScreen.classList.add('hidden');
}

// Generate a list of words for the puzzle
function generateWords() {
    // Choose a random category
    const categories = Object.keys(wordCategories);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryWords = wordCategories[randomCategory];
    
    // Determine number of words based on difficulty
    let numWords;
    switch (difficulty) {
        case 'easy':
            numWords = 5;
            break;
        case 'medium':
            numWords = 8;
            break;
        case 'hard':
            numWords = 12;
            break;
    }
    
    // Shuffle and select words
    const shuffledWords = [...categoryWords].sort(() => 0.5 - Math.random());
    
    // Filter words based on length and difficulty
    let filteredWords = shuffledWords.filter(word => {
        if (difficulty === 'easy') return word.length <= 6;
        if (difficulty === 'medium') return word.length <= 8;
        return true; // For hard difficulty, any length is fine
    });
    
    // Select the required number of words
    words = filteredWords.slice(0, numWords);
    
    // Update total words count in UI
    totalWordsElement.textContent = words.length;
}

// Create an empty grid
function createGrid() {
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
}

// Place words in the grid
function placeWords() {
    // Sort words by length (longest first)
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    
    for (const word of sortedWords) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!placed && attempts < maxAttempts) {
            attempts++;
            
            // Choose a random starting position and direction
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            
            // For easy difficulty, only use horizontal and vertical directions
            let directionOptions = directions;
            if (difficulty === 'easy') {
                directionOptions = directions.slice(0, 2); // Only right and down
            } else if (difficulty === 'medium') {
                directionOptions = directions.slice(0, 4); // Right, down, and diagonals
            }
            
            const direction = directionOptions[Math.floor(Math.random() * directionOptions.length)];
            
            if (canPlaceWord(word, row, col, direction)) {
                placeWord(word, row, col, direction);
                placed = true;
            }
        }
        
        // If we couldn't place the word after max attempts, remove it from the list
        if (!placed) {
            const index = words.indexOf(word);
            if (index !== -1) {
                words.splice(index, 1);
            }
        }
    }
    
    // Update total words count in UI (in case some words couldn't be placed)
    totalWordsElement.textContent = words.length;
}

// Check if a word can be placed at the given position and direction
function canPlaceWord(word, row, col, direction) {
    const [dRow, dCol] = direction;
    
    // Check if the word fits within the grid
    if (
        row + dRow * (word.length - 1) < 0 ||
        row + dRow * (word.length - 1) >= gridSize ||
        col + dCol * (word.length - 1) < 0 ||
        col + dCol * (word.length - 1) >= gridSize
    ) {
        return false;
    }
    
    // Check if the word overlaps with existing letters
    for (let i = 0; i < word.length; i++) {
        const currentRow = row + dRow * i;
        const currentCol = col + dCol * i;
        const currentCell = grid[currentRow][currentCol];
        
        if (currentCell !== '' && currentCell !== word[i]) {
            return false;
        }
    }
    
    return true;
}

// Place a word in the grid
function placeWord(word, row, col, direction) {
    const [dRow, dCol] = direction;
    
    for (let i = 0; i < word.length; i++) {
        const currentRow = row + dRow * i;
        const currentCol = col + dCol * i;
        grid[currentRow][currentCol] = word[i];
    }
}

// Fill the remaining empty cells with random letters
function fillGrid() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (grid[row][col] === '') {
                const randomIndex = Math.floor(Math.random() * letters.length);
                grid[row][col] = letters[randomIndex];
            }
        }
    }
}

// Render the grid on the game board
function renderGrid() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = grid[row][col];
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add event listeners for cell selection
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseover', updateSelection);
            cell.addEventListener('mouseup', endSelection);
            
            gameBoard.appendChild(cell);
        }
    }
    
    // Add event listener to handle touch events for mobile
    gameBoard.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoard.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameBoard.addEventListener('touchend', handleTouchEnd);
    
    // Add event listener to cancel selection when mouse leaves the grid
    gameBoard.addEventListener('mouseleave', cancelSelection);
}

// Render the word list
function renderWordList() {
    wordList.innerHTML = '';
    
    words.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.classList.add('word-item');
        wordItem.textContent = word;
        wordItem.dataset.word = word;
        
        if (foundWords.includes(word)) {
            wordItem.classList.add('found');
        }
        
        wordList.appendChild(wordItem);
    });
}

// Update UI elements
function updateUI() {
    wordsFoundElement.textContent = foundWords.length;
}

// Start word selection
function startSelection(event) {
    const cell = event.target;
    if (!cell.classList.contains('cell')) return;
    
    // Clear any existing selection
    clearSelection();
    
    // Add the cell to the selection
    cell.classList.add('selected');
    selectedCells.push(cell);
    currentWord = cell.textContent;
}

// Update word selection
function updateSelection(event) {
    if (selectedCells.length === 0) return;
    
    const cell = event.target;
    if (!cell.classList.contains('cell')) return;
    
    // Check if the cell is already in the selection
    if (selectedCells.includes(cell)) return;
    
    // Check if the cell is adjacent to the last selected cell
    const lastCell = selectedCells[selectedCells.length - 1];
    const lastRow = parseInt(lastCell.dataset.row);
    const lastCol = parseInt(lastCell.dataset.col);
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);
    
    // Calculate direction
    const dRow = currentRow - lastRow;
    const dCol = currentCol - lastCol;
    
    // Check if the cells are in a straight line
    if (selectedCells.length > 1) {
        const prevCell = selectedCells[selectedCells.length - 2];
        const prevRow = parseInt(prevCell.dataset.row);
        const prevCol = parseInt(prevCell.dataset.col);
        
        const prevDRow = lastRow - prevRow;
        const prevDCol = lastCol - prevCol;
        
        // Check if the direction is the same
        if (dRow !== prevDRow || dCol !== prevDCol) {
            return;
        }
    }
    
    // Check if the cell is adjacent (including diagonals)
    const isAdjacent = Math.abs(dRow) <= 1 && Math.abs(dCol) <= 1 && (dRow !== 0 || dCol !== 0);
    
    if (!isAdjacent) return;
    
    // Add the cell to the selection
    cell.classList.add('selected');
    selectedCells.push(cell);
    currentWord += cell.textContent;
    
    // Check if the current word matches any of the words in the list
    checkForMatch();
}

// End word selection
function endSelection() {
    if (selectedCells.length === 0) return;
    
    // Check if the current word matches any of the words in the list
    if (!checkForMatch()) {
        clearSelection();
    }
}

// Cancel selection
function cancelSelection() {
    clearSelection();
}

// Clear the current selection
function clearSelection() {
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
    });
    
    selectedCells = [];
    currentWord = '';
}

// Check if the current word matches any of the words in the list
function checkForMatch() {
    // Check forward direction
    const forwardWord = currentWord;
    if (words.includes(forwardWord) && !foundWords.includes(forwardWord)) {
        wordFound(forwardWord);
        return true;
    }
    
    // Check backward direction
    const backwardWord = forwardWord.split('').reverse().join('');
    if (words.includes(backwardWord) && !foundWords.includes(backwardWord)) {
        wordFound(backwardWord);
        return true;
    }
    
    return false;
}

// Handle when a word is found
function wordFound(word) {
    foundWords.push(word);
    
    // Mark the cells as found
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
        cell.classList.add('found');
    });
    
    // Mark the word as found in the word list
    const wordItem = document.querySelector(`.word-item[data-word="${word}"]`);
    if (wordItem) {
        wordItem.classList.add('found');
    }
    
    // Update UI
    updateUI();
    
    // Check for victory
    if (foundWords.length === words.length) {
        victory();
    }
}

// Show a hint
function showHint() {
    // Find a word that hasn't been found yet
    const remainingWords = words.filter(word => !foundWords.includes(word));
    if (remainingWords.length === 0) return;
    
    // Choose a random word
    const randomWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
    
    // Find the cells for this word
    const wordCells = findWordCells(randomWord);
    
    if (wordCells.length > 0) {
        // Highlight the first letter as a hint
        const firstCell = wordCells[0];
        firstCell.classList.add('hint');
        
        // Remove the hint after a few seconds
        hintTimeout = setTimeout(() => {
            firstCell.classList.remove('hint');
        }, 3000);
    }
}

// Find the cells for a specific word
function findWordCells(word) {
    const cells = [];
    const allCells = document.querySelectorAll('.cell');
    
    // Convert NodeList to array for easier manipulation
    const cellsArray = Array.from(allCells);
    
    // Try to find the word in the grid
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            for (const [dRow, dCol] of directions) {
                let found = true;
                const wordCells = [];
                
                for (let i = 0; i < word.length; i++) {
                    const currentRow = row + dRow * i;
                    const currentCol = col + dCol * i;
                    
                    // Check if the position is valid
                    if (
                        currentRow < 0 ||
                        currentRow >= gridSize ||
                        currentCol < 0 ||
                        currentCol >= gridSize
                    ) {
                        found = false;
                        break;
                    }
                    
                    // Check if the letter matches
                    const cellIndex = currentRow * gridSize + currentCol;
                    const cell = cellsArray[cellIndex];
                    
                    if (cell.textContent !== word[i]) {
                        found = false;
                        break;
                    }
                    
                    wordCells.push(cell);
                }
                
                if (found) {
                    return wordCells;
                }
            }
        }
    }
    
    return cells;
}

// Handle touch events for mobile
function handleTouchStart(event) {
    event.preventDefault();
    
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (cell && cell.classList.contains('cell')) {
        startSelection({ target: cell });
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (cell && cell.classList.contains('cell')) {
        updateSelection({ target: cell });
    }
}

function handleTouchEnd() {
    endSelection();
}

// Victory
function victory() {
    victoryScreen.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', initGame);
hintButton.addEventListener('click', showHint);
playAgainButton.addEventListener('click', initGame);
difficultySelect.addEventListener('change', initGame);

// Initialize the game on load
document.addEventListener('DOMContentLoaded', initGame);
