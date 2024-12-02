// Game variables
const gameContainer = document.getElementById('game-container');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById("startButton");
gameContainer.appendChild(canvas);

// Sounds
const fireSound = new Audio('sound/firesound.mp3');
const burstSound = new Audio('sound/burstsound.mp3');
const gameOverSound = new Audio('sound/gameoversound.mp3');
const powerupSound = new Audio('sound/powerupsound.mp3');

// Game objects
let spaceship = { x: 50, y: 200, width: 55, height: 90, speed: 5, moveUp: false, moveDown: false };
let bullets = [];
let bugs = [];
let blasts = [];
let powerups = [];

// Game state
let gameActive = false;
let score = 0;
let bulletSpeed = 6; 
let bulletInterval = 240; 
let powerupActive = false;
let powerupTimer = null;

// Images
const spaceshipImage = new Image();
const bugImage = new Image();
const bulletImage = new Image();
const blastImage = new Image();
const powerupImage = new Image();

// Load images
spaceshipImage.src = 'images/gamepadship.png';
bugImage.src = 'images/bugs.png';
bulletImage.src = 'images/bullet.png';
blastImage.src = 'images/blast.png';
powerupImage.src = 'images/powerup.png';

// Set canvas dimensions
canvas.width = 800;
canvas.height = 300;


// Increase dot generation and destroy when out of canvas

let dots = [];
const dotInterval = 500; // Increase frequency to generate more dots (faster)
let lastDotTime = 0;

function generateDots() {
    const currentTime = Date.now();
    if (currentTime - lastDotTime > dotInterval) {
        lastDotTime = currentTime;
        // Generate a new dot with increased frequency
        dots.push({
            x: canvas.width, // Start from the right side
            y: Math.random() * canvas.height, // Random vertical position
            radius: 1.5, // Small size for the dots
            speed: Math.random() * 2 + 1, // Random speed for each dot
            opacity: 0.6 // Start fully visible
        });
    }
}

// Draw Dots and remove off-screen dots
function drawDots() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White with some opacity
    dots.forEach((dot, index) => {
        dot.x -= dot.speed; // Move the dot to the left
        dot.opacity = Math.abs(Math.sin(Date.now() / 100)); // Make the dot blink

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`; // Apply blinking effect
        ctx.fill();

        // Remove dots once they move off-screen
        if (dot.x + dot.radius < 0) {
            dots.splice(index, 1);
        }
    });
}



// Event listeners for fluid keyboard movement
document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') spaceship.moveUp = true;
    if (e.key === 's' || e.key === 'S') spaceship.moveDown = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') spaceship.moveUp = false;
    if (e.key === 's' || e.key === 'S') spaceship.moveDown = false;
});

// Mobile buttons - Move Up
document.getElementById('moveUp').addEventListener('mousedown', () => {
    spaceship.moveUp = true;
});

// Mobile buttons - Move Down
document.getElementById('moveDown').addEventListener('mousedown', () => {
    spaceship.moveDown = true;
});

// Stop movement on mouse release or touch end
document.getElementById('moveUp').addEventListener('mouseup', () => {
    spaceship.moveUp = false;
});

document.getElementById('moveDown').addEventListener('mouseup', () => {
    spaceship.moveDown = false;
});

// Touch support for mobile devices - Move Up
document.getElementById('moveUp').addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    spaceship.moveUp = true;
});

// Touch support for mobile devices - Move Down
document.getElementById('moveDown').addEventListener('touchstart', (e) => {
    e.preventDefault();
    spaceship.moveDown = true;
});

// Stop movement on touch end
document.getElementById('moveUp').addEventListener('touchend', () => {
    spaceship.moveUp = false;
});

document.getElementById('moveDown').addEventListener('touchend', () => {
    spaceship.moveDown = false;
});

// Game functions
function drawSpaceship() {
    ctx.drawImage(spaceshipImage, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

function drawBugs() {
    bugs.forEach((bug) => {
        ctx.drawImage(bugImage, bug.x, bug.y, bug.width, bug.height);
    });
}

function drawBullets() {
    bullets.forEach((bullet) => {
        ctx.drawImage(bulletImage, bullet.x, bullet.y, 20, 10);
    });
}

function drawBlasts() {
    blasts.forEach((blast) => {
        ctx.drawImage(blastImage, blast.x, blast.y, 50, 50);
    });
}

function drawPowerups() {
    powerups.forEach((powerup) => {
        ctx.drawImage(powerupImage, powerup.x, powerup.y, 40, 40);
    });
}

function spawnBug() {
    const bugCount = Math.min(5, Math.floor(score / 10) + 2); 
    for (let i = 0; i < bugCount; i++) {
        const y = Math.random() * (canvas.height - 50);
        const speed = Math.random() * 3 + 3;
        const dives = Math.random() < 0.3;
        bugs.push({ x: canvas.width, y, width: 40, height: 40, speed, dives });
    }
}

function spawnBullet() {
    if (gameActive) {
        bullets.push({ x: spaceship.x + spaceship.width, y: spaceship.y + spaceship.height / 2 - 5 });
        fireSound.play();
    }
}

function spawnPowerup() {
    if (powerups.length === 0 && gameActive) {
        const y = Math.random() * (canvas.height - 50);
        powerups.push({ x: canvas.width, y, width: 40, height: 40, sineOffset: Math.random() * 10 });
    }
}

// Update game state
function updateGame() {
    if (!gameActive) return;

    // Move spaceship with fluid controls, incrementally moving by speed
    if (spaceship.moveUp && spaceship.y > 0) spaceship.y -= spaceship.speed;
    if (spaceship.moveDown && spaceship.y < canvas.height - spaceship.height) spaceship.y += spaceship.speed;

    // Move bullets
    bullets = bullets.filter((bullet) => bullet.x < canvas.width);
    bullets.forEach((bullet) => (bullet.x += bulletSpeed));

    // Move bugs
    bugs.forEach((bug) => {
        bug.x -= bug.speed;
        if (bug.dives) {
            bug.y += bug.speed * (bug.y < spaceship.y ? 1 : -1);
        }
    });

    // Move powerups with sine wave motion
    powerups.forEach((powerup) => {
        powerup.x -= 2;
        powerup.y = canvas.height / 2 + Math.sin(powerup.sineOffset) * 40;
        powerup.sineOffset += 0.05;
    });

    // Handle bullet and bug collisions
    bullets = bullets.filter((bullet) => {
        return !bugs.some((bug, index) => {
            const collision =
                bullet.x < bug.x + bug.width &&
                bullet.x + 20 > bug.x &&
                bullet.y < bug.y + bug.height &&
                bullet.y + 10 > bug.y;

            if (collision) {
                blasts.push({ x: bug.x, y: bug.y, timer: 15 }); 
                bugs.splice(index, 1); 
                score += 1; 
                burstSound.play();
                return true; 
            }
            return false;
        });
    });

    // Handle powerup collection
    powerups = powerups.filter((powerup) => {
        const collected =
            powerup.x < spaceship.x + spaceship.width &&
            powerup.x + powerup.width > spaceship.x &&
            powerup.y < spaceship.y + spaceship.height &&
            powerup.y + powerup.height > spaceship.y;

        if (collected) {
            powerupActive = true;
            powerupSound.play();

            bugs.forEach((bug) => blasts.push({ x: bug.x, y: bug.y, timer: 15 }));
            bugs = [];
            blasts.push({ x: spaceship.x, y: spaceship.y, timer: 15 }); 
        }

        return !collected;
    });

    // Remove blasts after animation
    blasts = blasts.filter((blast) => --blast.timer > 0);

    // End game if a bug hits the spaceship
    bugs.forEach((bug) => {
        if (
            bug.x < spaceship.x + spaceship.width &&
            bug.x + bug.width > spaceship.x &&
            bug.y < spaceship.y + spaceship.height &&
            bug.y + bug.height > spaceship.y
        ) {
            blasts.push({ x: spaceship.x, y: spaceship.y, timer: 15 }); 
            gameActive = false;
            gameOverSound.play();
            fireSound.pause(); // Pause the fire sound
        }
    });
}

function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    drawSpaceship();
    drawBugs();
    drawBullets();
    drawBlasts();
    drawPowerups();
    drawUI();
    generateDots();
    drawDots();

    updateGame();

    requestAnimationFrame(gameLoop);
}

// Start and reset the game
document.getElementById('startButton').addEventListener('click', () => {
    if (!gameActive) {
        // Reset game state and start a new game
        const gameTitleImage = document.getElementById("game-title-image");
        if (gameTitleImage) gameTitleImage.remove();
    }
    gameActive = true;
    score = 0;
    bugs = [];
    bullets = [];
    blasts = [];
    powerups = [];
    powerupActive = false;

    fireSound.loop = true; // Set the fire sound to loop
    fireSound.play(); // Play the fire sound

    setInterval(spawnBug, 600); 
    setInterval(spawnBullet, bulletInterval);
    setTimeout(() => setInterval(spawnPowerup, 5000), 10000);
    
    startButton.textContent = "Restart";

    gameLoop();
});