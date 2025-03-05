// Main script for Snappy Games

document.addEventListener('DOMContentLoaded', () => {
    // Add animation to game cards
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach((card, index) => {
        // Add staggered animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
        
        // Add click event
        card.addEventListener('click', () => {
            // Add a small click animation before navigating
            card.classList.add('clicked');
            
            // Get the game URL from the onclick attribute
            const gameUrl = card.getAttribute('onclick').replace("location.href='", "").replace("'", "");
            
            // Navigate after a short delay to show the animation
            setTimeout(() => {
                window.location.href = gameUrl;
            }, 300);
        });
    });
    
    // Update CSS for difficulty labels
    const difficultyLabels = document.querySelectorAll('.difficulty');
    
    difficultyLabels.forEach(label => {
        const text = label.textContent.trim();
        
        if (text === 'Medium') {
            label.style.backgroundColor = '#fff8e1';
            label.style.color = '#ff8f00';
        } else if (text === 'Hard') {
            label.style.backgroundColor = '#ffebee';
            label.style.color = '#c62828';
        }
    });
});
