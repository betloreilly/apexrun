// console.log("Script start"); // Remove log

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Settings ---
const SCREEN_WIDTH = 1024;
const SCREEN_HEIGHT = 768;

// const PIXEL_SCALE = 4; // Temporarily disable
// const NATIVE_WIDTH = SCREEN_WIDTH / PIXEL_SCALE;
// const NATIVE_HEIGHT = SCREEN_HEIGHT / PIXEL_SCALE;

const DAY_DURATION = 30 * 1000; // 30 seconds for testing
const NIGHT_DURATION = 30 * 1000; // 30 seconds for testing

// Restore original Font sizes
const ARCADE_FONT = "30px 'Courier New', monospace";
const GAMEOVER_FONT = "80px 'Courier New', monospace";

const INITIAL_SCORE = 50;
const MAX_SCORE_DISPLAY = 100; // Visually cap the bar at this score

// Arcade Colors (Examples - adjust as desired)
const COLOR_BG_DAY = '#40C4FF'; // Light Sky Blue
const COLOR_BG_NIGHT = '#0D1B2A'; // Dark Blue/Black
const COLOR_PLAYER_FOX = '#FF9100'; // Bright Orange
const COLOR_PLAYER_WOLF = '#BDBDBD'; // Light Grey
const COLOR_UI_TEXT = '#FFFF00'; // Bright Yellow
const COLOR_UI_SHADOW = '#000000';
const COLOR_GAMEOVER_TEXT = '#FF3D00'; // Bright Red/Orange

const COLOR_GROUND_DAY = '#689F38'; // Light Green
const COLOR_GROUND_NIGHT = '#33691E'; // Dark Green
const COLOR_MOON = '#FFF9C4'; // Pale Yellow
const COLOR_STAR = '#FFFFFF';
const COLOR_SCORE_BAR_BG = '#424242'; // Dark grey
const COLOR_SCORE_BAR_FILL = '#FFEB3B'; // Yellow

const COLOR_TREE = '#5D4037'; // Brown
const COLOR_ROCK = '#757575'; // Medium Grey
const COLOR_RABBIT_BODY = '#FFFFFF';
const COLOR_RABBIT_DETAIL = '#FF80AB'; // Pink nose/ears
const COLOR_PIG_BODY = '#FF80AB'; // Pink
const COLOR_PIG_DETAIL = '#F44336'; // Darker Pink/Red snout

const COLOR_PARTICLE = '#FFEB3B'; // Yellow fire

// Player settings (initial placeholders)
const PLAYER_START_X = SCREEN_WIDTH / 2;
const PLAYER_START_Y = SCREEN_HEIGHT / 2;
const PLAYER_SIZE = 30;

// Character specific settings
const FOX_SPEED = 250;
const FOX_COLOR = COLOR_PLAYER_FOX;

const WOLF_SPEED = 180;
const WOLF_COLOR = COLOR_PLAYER_WOLF;

// Fox specific dimensions
const FOX_WIDTH = 25;
const FOX_HEIGHT = 35;
const FOX_SNOUT_LENGTH = 10;

// Enemy & Food Settings
const TREE_MONSTER_COLOR = COLOR_TREE;
const TREE_MONSTER_SIZE = { width: 40, height: 60 };
const ROCK_MONSTER_COLOR = COLOR_ROCK;
const ROCK_MONSTER_SIZE = 25;
const RABBIT_COLOR = COLOR_RABBIT_BODY;
const RABBIT_SIZE = { width: 20, height: 15 };
const RABBIT_SPEED = 100;
const PIG_COLOR = COLOR_PIG_BODY;
const PIG_SIZE = { width: 35, height: 25 };
const PIG_SPEED = 70;

const RABBIT_HEAL = 5; // Food now heals (increases score)
const PIG_HEAL = 10;

const NUM_MONSTERS = 10; // Total monsters at night (mix of tree/rock)
const NUM_FOOD = 15; // Total food during day (mix of rabbit/pig)

const ANIMAL_CHANGE_DIR_INTERVAL = 2.0; // seconds

// Monster Settings
const TREE_GROWTH_RATE = 5; // pixels per second
const TREE_MAX_HEIGHT_FACTOR = 2.0; // Max height relative to initial size
const TREE_PROXIMITY_RANGE = 80; // pixels
const TREE_FALL_DAMAGE = 25; // Increased damage
const TREE_FALL_DURATION = 0.5;
const ROCK_SPEED = 130; // Slightly faster
const ROCK_DAMAGE = 15; // Increased damage
const ROCK_TARGET_BIAS = 0.7;
const ROCK_SPAWN_INTERVAL = 1.5; // Spawn a rock every 1.5 seconds (adjust as needed)
const MAX_ACTIVE_ROCKS = 10; // Maximum rocks on screen at once

// Spawn numbers
const NUM_MONSTERS_INITIAL = 5; // Initial number of trees at night start

// Dog Constants
const DOG_SPEED = 130; // Slightly faster than fox?
const DOG_WIDTH = 45;
const DOG_HEIGHT = 40;
const DOG_COLOR = '#8B4513'; // Brown
const DOG_ATTACK_RANGE = 40;
const DOG_ATTACK_DAMAGE = 5; // Score damage
const DOG_ATTACK_COOLDOWN = 1.5; // Seconds between attacks
const MAX_DOGS = 3; // Maximum dogs on screen

// Fence Constants
const FENCE_X = SCREEN_WIDTH * 0.4; // Shift left more
const FENCE_Y = SCREEN_HEIGHT * 0.1;
const FENCE_WIDTH = SCREEN_WIDTH * 0.55; // Cover 55% width (larger)
const FENCE_HEIGHT = SCREEN_HEIGHT * 0.7; // Cover 70% height (larger)
const FENCE_POST_WIDTH = 10;
const FENCE_RAIL_HEIGHT = 6;
const FENCE_COLOR = '#A0522D'; // Sienna brown, same as old roof

// Golden Egg Constants
const NUM_GOLDEN_EGGS = 8;
const GOLDEN_EGG_POINTS = 15;
const GOLDEN_EGG_COLOR = '#FFD700'; // Gold
const GOLDEN_EGG_SHINE_COLOR = '#FFFACD'; // Lemon Chiffon (for shine)
const GOLDEN_EGG_WIDTH = 18;
const GOLDEN_EGG_HEIGHT = 24;

// --- Game State ---
let isDay = true;
// let cycleTimer = Date.now(); // REMOVE - Use dayNightCycleStart
// let currentCycleDuration = DAY_DURATION; // REMOVE - Use DAY_DURATION/NIGHT_DURATION directly
let daysSurvived = 0;
let score = INITIAL_SCORE;
let lastTime = 0;
let player = null; // Will be Fox or Wolf instance
let monsters = [];
let food = [];
let particles = []; // Add particles array
let goldenEggs = []; // Array for golden eggs
let gameOver = false; // Add Game Over flag
let rockSpawnTimer = ROCK_SPAWN_INTERVAL; // Timer for spawning rocks
let dayNightCycleStart = performance.now(); // Use performance.now() for consistency
let gameTimeThisCycle = 0;
let gameTimeTotal = 0; // Add a total game time tracker

// --- Canvas Setup ---
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

// Temporarily comment out buffer canvas creation
/*
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d');
bufferCanvas.width = NATIVE_WIDTH;
bufferCanvas.height = NATIVE_HEIGHT;
console.log(`Native resolution: ${NATIVE_WIDTH}x${NATIVE_HEIGHT}`);
*/

// --- Base GameObject Class ---
class GameObject {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isActive = true; // Flag for removal
    }

    // Basic update, can be overridden
    update(deltaTime) {}

    // Placeholder draw, should be overridden
    draw(ctx) {
        ctx.fillStyle = this.color;
        // Default square drawing if not overridden
        ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
    }
}

// --- Particle Class ---
class Particle extends GameObject {
    constructor(x, y, vx, vy, size, lifespan) {
        super(x, y, COLOR_PARTICLE);
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.lifespan = lifespan;
        this.life = lifespan;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.lifespan);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// --- Classes ---
class Player extends GameObject {
    constructor(x, y, speed, color, width, height) {
        super(x, y, color);
        this.speed = speed;
        this.width = width;
        this.height = height;
        this.dx = 0; // Change in x per second
        this.dy = 0; // Change in y per second
        this.attackRange = 50; // Attack radius
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    update(deltaTime) {
        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;

        // Keep player within bounds
        this.x = Math.max(this.width / 2, Math.min(SCREEN_WIDTH - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(SCREEN_HEIGHT - this.height / 2, this.y));
    }

    move(direction) {
        switch (direction) {
            case 'up':    this.dy = -this.speed; break;
            case 'down':  this.dy = this.speed; break;
            case 'left':  this.dx = -this.speed; break;
            case 'right': this.dx = this.speed; break;
        }
    }

    stop(axis) {
        if (axis === 'vertical') this.dy = 0;
        if (axis === 'horizontal') this.dx = 0;
    }

    takeHit(amount) {
        if (gameOver || amount <= 0) return; // No damage if already game over or no amount
        score -= amount;
        console.log(`Player hit! Lost ${amount} score. Score: ${score}`);
        if (score <= 0) {
            score = 0;
            gameOver = true;
            console.log("GAME OVER! Score reached 0.");
            // Stop player movement on game over
            this.dx = 0;
            this.dy = 0;
        }
    }

    heal(amount) {
        if (gameOver || amount <= 0) return;
        score += amount;
        console.log(`Player healed ${amount}. Score: ${score}`);
        // Optional: Add a max score cap if desired
        // const MAX_SCORE = 200; 
        // score = Math.min(score, MAX_SCORE);
    }
}

class Fox extends Player {
    constructor(x, y) {
        super(x, y, FOX_SPEED, FOX_COLOR, FOX_WIDTH, FOX_HEIGHT);
        this.snoutLength = FOX_SNOUT_LENGTH;
    }

    draw(ctx) {
        const bodyW = this.width;
        const bodyH = this.height * 0.7;
        const legH = this.height * 0.3;
        const legW = this.width * 0.2;
        const tailW = this.width * 0.8;
        const tailH = this.height * 0.4;
        const headX = bodyW * 0.3;
        const earW = this.width * 0.3;
        const earH = this.height * 0.3;

        ctx.save();
        ctx.translate(this.x, this.y);
        const scaleX = (this.dx === 0) ? 1 : Math.sign(this.dx);
        ctx.scale(scaleX, 1);

        // Legs (4 legs)
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-bodyW * 0.35, bodyH / 2 - legH * 0.2, legW, legH); // Back left
        ctx.fillRect(-bodyW * 0.1, bodyH / 2 - legH * 0.2, legW, legH); // Back right
        ctx.fillRect( bodyW * 0.05, bodyH / 2 - legH * 0.2, legW, legH); // Front left
        ctx.fillRect( bodyW * 0.3, bodyH / 2 - legH * 0.2, legW, legH); // Front right
        ctx.globalAlpha = 1.0;

        // Tail
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(-bodyW * 0.6, 0, tailW / 2, tailH / 2, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

        // Ears (two triangles)
        ctx.beginPath();
        ctx.moveTo(headX - earW * 0.5, -bodyH / 2 - earH * 0.2);
        ctx.lineTo(headX, -bodyH / 2 - earH);
        ctx.lineTo(headX + earW * 0.5, -bodyH / 2 - earH * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(headX + earW * 0.1, -bodyH / 2 - earH * 0.3);
        ctx.lineTo(headX + earW * 0.6, -bodyH / 2 - earH * 1.1);
        ctx.lineTo(headX + earW * 1.1, -bodyH / 2 - earH * 0.3);
        ctx.closePath();
        ctx.fill();

        // Head/Snout Triangle
        ctx.beginPath();
        ctx.moveTo(headX, -bodyH / 2);
        ctx.lineTo(headX + this.snoutLength, 0);
        ctx.lineTo(headX, bodyH / 2);
        ctx.closePath();
        ctx.fill();
        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(headX + this.snoutLength * 0.4, -bodyH * 0.1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Wolf extends Player {
    constructor(x, y) {
        super(x, y, WOLF_SPEED, WOLF_COLOR, PLAYER_SIZE, PLAYER_SIZE);
        // Add Wolf-specific properties if needed
    }
}

// --- NPC Classes ---
class TreeMonster extends GameObject {
    constructor(x, y) {
        super(x, y, TREE_MONSTER_COLOR);
        this.initialWidth = TREE_MONSTER_SIZE.width;
        this.initialHeight = TREE_MONSTER_SIZE.height;
        this.width = this.initialWidth; // Used for collision bounds
        this.height = this.initialHeight; // Used for collision bounds & growth
        this.trunkWidth = this.initialWidth * 0.4;
        this.trunkHeightRatio = 0.6; // Trunk is 60% of current height
        this.maxHeight = this.initialHeight * TREE_MAX_HEIGHT_FACTOR;
        this.growthRate = TREE_GROWTH_RATE;
        this.proximityRange = TREE_PROXIMITY_RANGE;
        this.fallDamage = TREE_FALL_DAMAGE;
        this.isFalling = false;
        this.fallAngle = 0;
        this.fallProgress = 0;
        this.fallDuration = TREE_FALL_DURATION;
        this.hasFallen = false;
    }

    update(deltaTime) {
        if (!isDay && this.isActive && !this.hasFallen && !gameOver) {
            if (this.isFalling) {
                // --- Falling Logic ---
                this.fallProgress += deltaTime;
                if (this.fallProgress >= this.fallDuration) {
                    this.fallProgress = this.fallDuration; // Cap progress
                    this.hasFallen = true; // Mark as fallen
                    console.log("Tree has fallen!");
                    // Check collision NOW, apply damage if hit
                    if (player && checkRectCollision(player, this.getFallingBounds())) {
                         console.log("Player hit by fallen tree!");
                         player.takeHit(this.fallDamage);
                    }
                    // Tree disappears shortly after falling
                    // Or set isActive=false immediately after check?
                    // Let's remove it after a short delay for visual effect
                    setTimeout(() => { this.isActive = false; }, 200); 
                }
            } else {
                // --- Growing Logic ---
                if (this.height < this.maxHeight) {
                    this.height += this.growthRate * deltaTime;
                    this.height = Math.min(this.height, this.maxHeight);
                }

                // --- Proximity Check ---
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y; // Target is player center
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.proximityRange) {
                        console.log("Tree proximity trigger!");
                        this.isFalling = true;
                        // Calculate angle from tree base (x, y) to player (player.x, player.y)
                        // Angle is measured from positive X-axis, clockwise is positive in canvas usually?
                        // No, atan2 is standard: counter-clockwise from positive X
                        this.fallAngle = Math.atan2(player.y - this.y, player.x - this.x);
                        this.fallProgress = 0;
                    }
                }
            }
        }
    }
    
    // Calculate bounding box for collision when falling/fallen
    getFallingBounds() {
         const angle = this.fallAngle * (this.fallProgress / this.fallDuration);
         const cosA = Math.cos(angle);
         const sinA = Math.sin(angle);
         const halfW = this.width / 2;
         
         // Calculate the corner position of the top of the tree after rotation
         // Relative to the base (0,0 which is at this.x, this.y)
         const topXRel = -this.height * sinA; // Top corner x relative to base after rotation
         const topYRel = -this.height * cosA; // Top corner y relative to base after rotation

         // We need the AABB (Axis-Aligned Bounding Box) of the rotated rectangle
         // Simplified: use the top position and base width for collision check
         // More accurate AABB calculation is complex. Let's use a simpler proxy.
         return { 
              x: this.x + topXRel / 2, // Approx center X
              y: this.y + topYRel / 2, // Approx center Y
              width: Math.abs(topXRel) + this.width, // Rough width encompassing rotation
              height: Math.abs(topYRel) + this.width // Rough height encompassing rotation (use width for base)
         };
    }

    draw(ctx) {
        const currentTrunkH = this.height * this.trunkHeightRatio;
        const leavesRadius = this.width * 0.8; // Make leaves wider than trunk
        const leavesCenterY = -currentTrunkH; // Leaves sit on top of trunk

        ctx.save();
        ctx.translate(this.x, this.y); // Translate to base of the trunk

        if (this.isFalling) {
            const rotation = (this.fallAngle - Math.PI / 2) * (this.fallProgress / this.fallDuration);
            ctx.rotate(rotation);
        }

        // Trunk
        ctx.fillStyle = this.color; // Use TREE_MONSTER_COLOR
        ctx.fillRect(-this.trunkWidth / 2, -currentTrunkH, this.trunkWidth, currentTrunkH);

        // Leaves (simple overlapping circles)
        ctx.fillStyle = '#2E7D32'; // Dark Green for leaves
        ctx.beginPath();
        ctx.arc(0, leavesCenterY, leavesRadius * 0.6, 0, Math.PI * 2); // Center circle
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-leavesRadius * 0.4, leavesCenterY - leavesRadius * 0.3, leavesRadius * 0.5, 0, Math.PI * 2); // Left circle
        ctx.fill();
        ctx.beginPath();
        ctx.arc( leavesRadius * 0.4, leavesCenterY - leavesRadius * 0.3, leavesRadius * 0.5, 0, Math.PI * 2); // Right circle
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, leavesCenterY - leavesRadius * 0.5, leavesRadius * 0.5, 0, Math.PI * 2); // Top circle
        ctx.fill();

        ctx.restore();
    }
}

class RockMonster extends GameObject {
    constructor(x, y) {
        super(x, y, ROCK_MONSTER_COLOR);
        this.radius = ROCK_MONSTER_SIZE / 2;
        this.width = ROCK_MONSTER_SIZE;
        this.height = ROCK_MONSTER_SIZE;
        this.speed = ROCK_SPEED;
        this.dx = 0;
        this.dy = 0;
        this.damage = ROCK_DAMAGE;
        this.setInitialDirection();
        // Define jagged points relative to center (0,0)
        this.shapePoints = this.createJaggedPoints(8, this.radius * 0.8, this.radius * 1.2);
    }

    setInitialDirection() {
        // Start moving generally downwards, with some randomness
        const angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2; // Angle between PI/4 and 3*PI/4
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    update(deltaTime) {
        if (!isDay && this.isActive && !gameOver) {
            // Simple gravity + player bias
            // Calculate direction towards player
            let targetDx = 0;
            let targetDy = 0;
            if (player) {
                targetDx = player.x - this.x;
                targetDy = player.y - this.y;
                // Normalize direction
                const dist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
                if (dist > 0) {
                    targetDx /= dist;
                    targetDy /= dist;
                }
            }

            // Combine downward motion with player bias
            // Prioritize downward movement (Y=1), mix in player direction
            const finalDx = (this.dx + targetDx * this.speed * ROCK_TARGET_BIAS) / 2;
            const finalDy = (this.dy + 1 * this.speed + targetDy * this.speed * ROCK_TARGET_BIAS) / 2; // stronger pull down

            // Simple normalization to prevent excessive speed increase
            const currentSpeed = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
            if (currentSpeed > this.speed * 1.2) { // Cap speed slightly above base
                 this.dx = (finalDx / currentSpeed) * this.speed;
                 this.dy = (finalDy / currentSpeed) * this.speed;
            } else {
                this.dx = finalDx;
                this.dy = finalDy;
            }

            this.x += this.dx * deltaTime;
            this.y += this.dy * deltaTime;

            // Deactivate if it goes way off screen
            if (this.y - this.radius > SCREEN_HEIGHT + 50) {
                this.isActive = false;
            }
        }
        // Rocks stop moving during the day implicitly
    }

    // Helper to create jagged points for the rock shape
    createJaggedPoints(numPoints, minRadius, maxRadius) {
        const points = [];
        const angleStep = (Math.PI * 2) / numPoints;
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep + (Math.random() - 0.5) * angleStep * 0.5; // Add randomness to angle
            const radius = minRadius + Math.random() * (maxRadius - minRadius); // Random radius in range
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return points;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Optional: Rotate slowly as it moves
        // const rotation = (this.x + this.y) * 0.01; // Simple rotation based on position
        // ctx.rotate(rotation);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.shapePoints.length > 0) {
            ctx.moveTo(this.shapePoints[0].x, this.shapePoints[0].y);
            for (let i = 1; i < this.shapePoints.length; i++) {
                ctx.lineTo(this.shapePoints[i].x, this.shapePoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
        } else { // Fallback to circle if points aren't generated
             ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
             ctx.fill();
        }
        ctx.restore();
    }
}

class Rabbit extends GameObject {
    constructor(x, y) {
        super(x, y, COLOR_RABBIT_BODY);
        this.width = RABBIT_SIZE.width;
        this.height = RABBIT_SIZE.height;
        this.speed = RABBIT_SPEED;
        this.dx = 0;
        this.dy = 0;
        this.moveTimer = Math.random() * ANIMAL_CHANGE_DIR_INTERVAL;
        this.changeDirectionInterval = ANIMAL_CHANGE_DIR_INTERVAL;
        this.setRandomDirection();
        this.healAmount = RABBIT_HEAL;
        this.hopOffset = 0;
        this.hopSpeed = 8; // Faster hop cycle
        this.isHopping = false;
    }

    update(deltaTime) {
        if (!isDay) {
            this.dx = 0;
            this.dy = 0;
            this.isHopping = false;
            return;
        }

        this.moveTimer -= deltaTime;
        if (this.moveTimer <= 0) {
            this.setRandomDirection();
            this.moveTimer = this.changeDirectionInterval * (0.5 + Math.random());
        }

        let nextX = this.x + this.dx * deltaTime;
        let nextY = this.y + this.dy * deltaTime;

        // Hopping animation when moving
        if (Math.abs(this.dx) > 1 || Math.abs(this.dy) > 1) {
             this.isHopping = true;
             this.hopOffset = Math.abs(Math.sin(Date.now() * 0.01 * this.hopSpeed)) * -this.height * 0.4; // Hop upwards
        } else {
             this.isHopping = false;
             this.hopOffset = 0;
        }

        // --- Fence Boundary check --- 
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const fenceLeft = FENCE_X + halfW;
        const fenceRight = FENCE_X + FENCE_WIDTH - halfW;
        const fenceTop = FENCE_Y + halfH;
        const fenceBottom = FENCE_Y + FENCE_HEIGHT - halfH;

        if (nextX < fenceLeft) {
            nextX = fenceLeft; 
            this.dx *= -1; // Bounce right
            this.moveTimer = 0; // Change direction sooner after hitting wall
        } else if (nextX > fenceRight) {
            nextX = fenceRight;
            this.dx *= -1; // Bounce left
             this.moveTimer = 0;
        }

        if (nextY < fenceTop) {
            nextY = fenceTop;
            this.dy *= -1; // Bounce down
             this.moveTimer = 0;
        } else if (nextY > fenceBottom) {
            nextY = fenceBottom;
            this.dy *= -1; // Bounce up
             this.moveTimer = 0;
        }
        
        // Apply final position
        this.x = nextX;
        this.y = nextY;
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.hopOffset); // Apply hopping offset

        const scaleX = (this.dx === 0) ? 1 : Math.sign(this.dx);
        ctx.scale(scaleX, 1);

        // Hind legs (visible when hopping/side-on)
        const legH = this.height * 0.5;
        const legW = this.width * 0.3;
        if (this.isHopping || scaleX !== 1) { // Show if hopping or facing left
             ctx.fillStyle = COLOR_RABBIT_BODY;
             ctx.globalAlpha = 0.9;
             ctx.beginPath();
             ctx.ellipse(-this.width * 0.25, this.height * 0.1, legW, legH * 0.6, Math.PI / 4, 0, Math.PI * 2);
             ctx.fill();
             ctx.globalAlpha = 1.0;
        }

        // Body (more oval)
        ctx.fillStyle = COLOR_RABBIT_BODY;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (slightly forward)
        const headX = this.width * 0.35;
        const headY = -this.height * 0.2;
        const headR = this.width * 0.25;
        ctx.beginPath();
        ctx.arc(headX, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // Ears (longer, draw behind head)
        const earH = this.height * 1.1;
        const earW = this.width * 0.18;
        ctx.fillStyle = COLOR_RABBIT_BODY;
        // Back ear
        ctx.beginPath();
        ctx.ellipse(headX - earW * 0.6, headY - earH * 0.4, earW, earH / 2, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        // Front ear
        ctx.beginPath();
        ctx.ellipse(headX + earW * 0.6, headY - earH * 0.45, earW, earH / 2, -Math.PI / 10, 0, Math.PI * 2);
        ctx.fill();
        // Inner ear pink
        ctx.fillStyle = COLOR_RABBIT_DETAIL;
        ctx.beginPath();
        ctx.ellipse(headX + earW * 0.6, headY - earH * 0.45, earW*0.6, earH * 0.35, -Math.PI / 10, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = COLOR_RABBIT_DETAIL;
        ctx.beginPath();
        ctx.arc(headX + headR * 0.8, headY, headR * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(headX + headR * 0.4, headY - headR * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tail (small puff)
        ctx.fillStyle = '#F5F5F5'; // Slightly off-white
        ctx.beginPath();
        ctx.arc(-this.width * 0.5, this.height * 0.1, this.width * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Pig extends GameObject {
    constructor(x, y) {
        super(x, y, COLOR_PIG_BODY);
        this.width = PIG_SIZE.width;
        this.height = PIG_SIZE.height;
        this.speed = PIG_SPEED;
        this.dx = 0;
        this.dy = 0;
        this.moveTimer = Math.random() * ANIMAL_CHANGE_DIR_INTERVAL;
        this.changeDirectionInterval = ANIMAL_CHANGE_DIR_INTERVAL;
        this.setRandomDirection();
        this.healAmount = PIG_HEAL;
    }

    update(deltaTime) {
        if (!isDay) {
            this.dx = 0;
            this.dy = 0;
            return;
        }

        this.moveTimer -= deltaTime;
        if (this.moveTimer <= 0) {
            this.setRandomDirection();
            this.moveTimer = this.changeDirectionInterval * (0.5 + Math.random());
        }

        let nextX = this.x + this.dx * deltaTime;
        let nextY = this.y + this.dy * deltaTime;

        // --- Fence Boundary check --- 
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const fenceLeft = FENCE_X + halfW;
        const fenceRight = FENCE_X + FENCE_WIDTH - halfW;
        const fenceTop = FENCE_Y + halfH;
        const fenceBottom = FENCE_Y + FENCE_HEIGHT - halfH;

        if (nextX < fenceLeft) {
            nextX = fenceLeft; 
            this.dx *= -1; // Bounce right
            this.moveTimer = 0; // Change direction sooner
        } else if (nextX > fenceRight) {
            nextX = fenceRight;
            this.dx *= -1; // Bounce left
             this.moveTimer = 0;
        }

        if (nextY < fenceTop) {
            nextY = fenceTop;
            this.dy *= -1; // Bounce down
             this.moveTimer = 0;
        } else if (nextY > fenceBottom) {
            nextY = fenceBottom;
            this.dy *= -1; // Bounce up
             this.moveTimer = 0;
        }
        
        // Apply final position
        this.x = nextX;
        this.y = nextY;
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    draw(ctx) {
        const bodyW = this.width;
        const bodyH = this.height;
        const headR = this.width * 0.3;
        const snoutR = headR * 0.4;
        const legW = this.width * 0.18;
        const legH = this.height * 0.28;
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.dx !== 0) {
            ctx.scale(Math.sign(this.dx), 1);
        }
        // Tail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-bodyW / 2, 0);
        ctx.quadraticCurveTo(-bodyW * 0.7, -bodyH * 0.3, -bodyW*0.6, bodyH * 0.1);
        ctx.stroke();
        // Legs (4 legs)
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-bodyW * 0.3, bodyH * 0.3, legW, legH); // Back left
        ctx.fillRect(-bodyW * 0.05, bodyH * 0.3, legW, legH); // Back right
        ctx.fillRect( bodyW * 0.13, bodyH * 0.3, legW, legH); // Front left
        ctx.fillRect( bodyW * 0.28, bodyH * 0.3, legW, legH); // Front right
        ctx.globalAlpha = 1.0;
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(bodyW * 0.35, -bodyH * 0.1, headR, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.fillStyle = COLOR_PIG_DETAIL;
        const snoutX = bodyW * 0.35 + headR * 0.9;
        const snoutY = -bodyH * 0.1;
        ctx.beginPath();
        ctx.arc(snoutX, snoutY, snoutR, 0, Math.PI * 2);
        ctx.fill();
        // Nostrils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(snoutX - snoutR * 0.3, snoutY, 1, 0, Math.PI*2);
        ctx.arc(snoutX + snoutR * 0.3, snoutY, 1, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

// --- Golden Egg Class ---
class GoldenEgg extends GameObject {
    constructor(x, y) {
        super(x, y, GOLDEN_EGG_COLOR);
        this.width = GOLDEN_EGG_WIDTH;
        this.height = GOLDEN_EGG_HEIGHT;
        this.points = GOLDEN_EGG_POINTS;
        this.shinePulseTime = Math.random() * Math.PI * 2; // Start shine randomly
        this.shinePulseSpeed = 2; // How fast the shine pulsates
        this.shineMaxAlpha = 0.7;
    }

    update(deltaTime) {
        // Update pulse timer for shine effect
        this.shinePulseTime += deltaTime * this.shinePulseSpeed;
    }

    draw(ctx) {
        if (!this.isActive) return;

        // Draw base egg shape (ellipse)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw pulsing shine overlay
        const shineAlpha = ((Math.sin(this.shinePulseTime) + 1) / 2) * this.shineMaxAlpha; // Varies between 0 and maxAlpha
        ctx.globalAlpha = shineAlpha;
        ctx.fillStyle = GOLDEN_EGG_SHINE_COLOR;
        ctx.beginPath();
        // Slightly smaller ellipse for shine
        ctx.ellipse(this.x, this.y, this.width * 0.4, this.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset global alpha
    }
}

// --- New NPC Classes ---
class GoldenChicken extends GameObject {
    constructor(x, y) {
        super(x, y, '#FFD700'); // Gold color
        this.width = 25;
        this.height = 25;
        this.speed = RABBIT_SPEED * 1.2; // Slightly faster
        this.dx = 0;
        this.dy = 0;
        this.moveTimer = Math.random() * ANIMAL_CHANGE_DIR_INTERVAL;
        this.changeDirectionInterval = ANIMAL_CHANGE_DIR_INTERVAL * 0.8; // Change direction more often
        this.setRandomDirection();
        this.healAmount = 25; // High score value
        this.bobOffset = 0;
        this.bobSpeed = 5;
        this.legAngle = 0; // For leg animation
    }

    update(deltaTime) {
        if (!isDay) {
            this.dx = 0;
            this.dy = 0;
            return;
        }

        this.moveTimer -= deltaTime;
        if (this.moveTimer <= 0) {
            this.setRandomDirection();
            this.moveTimer = this.changeDirectionInterval * (0.5 + Math.random());
        }

        let nextX = this.x + this.dx * deltaTime;
        let nextY = this.y + this.dy * deltaTime;

        // Bobbing effect
        this.bobOffset = Math.sin(Date.now() * 0.01 * this.bobSpeed) * 3;

        // Simple leg swing animation based on movement
        if (Math.abs(this.dx) > 1 || Math.abs(this.dy) > 1) { // If moving
             this.legAngle = Math.sin(Date.now() * 0.015) * (Math.PI / 6); // Swing legs
        } else {
             this.legAngle = 0; // Static legs when stopped
        }

         // --- Fence Boundary check --- 
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const fenceLeft = FENCE_X + halfW;
        const fenceRight = FENCE_X + FENCE_WIDTH - halfW;
        const fenceTop = FENCE_Y + halfH;
        const fenceBottom = FENCE_Y + FENCE_HEIGHT - halfH;

        if (nextX < fenceLeft) {
            nextX = fenceLeft; 
            this.dx *= -1; // Bounce right
            this.moveTimer = 0; // Change direction sooner
        } else if (nextX > fenceRight) {
            nextX = fenceRight;
            this.dx *= -1; // Bounce left
             this.moveTimer = 0;
        }

        if (nextY < fenceTop) {
            nextY = fenceTop;
            this.dy *= -1; // Bounce down
             this.moveTimer = 0;
        } else if (nextY > fenceBottom) {
            nextY = fenceBottom;
            this.dy *= -1; // Bounce up
             this.moveTimer = 0;
        }
        
        // Apply final position
        this.x = nextX;
        this.y = nextY;
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.bobOffset); // Apply bobbing
         if (this.dx !== 0) {
             ctx.scale(Math.sign(this.dx), 1);
         }

        // Legs (draw first, behind body)
        const legLength = this.height * 0.4;
        const legWidth = 3;
        ctx.fillStyle = '#FFA500'; // Orange legs
        ctx.save();
        ctx.rotate(this.legAngle); // Apply swing rotation
        ctx.fillRect(-this.width * 0.15 - legWidth / 2, this.height * 0.3, legWidth, legLength); // Left leg
        ctx.restore();
        ctx.save();
        ctx.rotate(-this.legAngle); // Apply opposite swing rotation
        ctx.fillRect( this.width * 0.15 - legWidth / 2, this.height * 0.3, legWidth, legLength); // Right leg
        ctx.restore();

        // Body (circle)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Small wing
        ctx.fillStyle = '#FFEC8B'; // Lighter gold for wing detail
        ctx.beginPath();
        ctx.ellipse(-this.width*0.1, this.height*0.1, this.width*0.3, this.height*0.2, -0.5, 0, Math.PI*2);
        ctx.fill();

        // Comb (small red bit on top)
        ctx.fillStyle = '#FF0000'; // Red comb
        ctx.beginPath();
        ctx.moveTo(0, -this.height*0.4);
        ctx.lineTo(-this.width*0.1, -this.height*0.55);
        ctx.lineTo(this.width*0.1, -this.height*0.55);
        ctx.closePath();
        ctx.fill();

        // Beak
        ctx.fillStyle = '#FFA500'; // Orange beak
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width * 0.7, -this.height * 0.1);
        ctx.lineTo(this.width * 0.7, this.height * 0.1);
        ctx.closePath();
        ctx.fill();

         // Eye
         ctx.fillStyle = '#000000';
         ctx.beginPath();
         ctx.arc(this.width * 0.3, -this.height * 0.15, 2, 0, Math.PI*2);
         ctx.fill();

        ctx.restore();
    }
}

class Lumberjack extends GameObject {
    constructor(x, y) {
        super(x, y, '#A0522D'); // Base color (used for pants now)
        this.width = 45;
        this.height = 60;
        this.speed = player ? player.speed * 0.65 : 120;
        this.damage = 35;
        this.chaseTarget = player;
        this.attackCooldown = 1.8; // Slightly longer cooldown
        this.attackTimer = 0;
        this.state = 'chasing'; // 'chasing', 'windingUp', 'swinging'
        this.windUpDuration = 0.3; // How long the wind-up takes
        this.swingDuration = 0.4; // How long the axe swing animation takes
        this.stateTimer = 0; // Timer for current state duration
        this.facingRight = true;
    }

    update(deltaTime) {
        if (player && this.speed !== player.speed * 0.65) {
             this.speed = player.speed * 0.65;
        }

        if (isDay || !this.isActive || !this.chaseTarget || gameOver) {
             this.state = 'chasing'; // Reset state if day comes etc.
             this.stateTimer = 0;
            return;
        }

        // Update attack cooldown timer
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
        }
        // Update state timer
        this.stateTimer += deltaTime;

        // --- State Machine ---
        switch (this.state) {
            case 'chasing':
                // --- Chasing Logic ---
                const dx = this.chaseTarget.x - this.x;
                const dy = this.chaseTarget.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    const moveX = (dx / distance) * this.speed;
                    const moveY = (dy / distance) * this.speed;
                    this.x += moveX * deltaTime;
                    this.y += moveY * deltaTime;
                    if (moveX !== 0) this.facingRight = moveX > 0;
                }

                // --- Check for Attack Trigger ---
                if (this.attackTimer <= 0 && checkRectCollision(this, this.chaseTarget)) {
                    console.log("Lumberjack starts wind-up!");
                    this.state = 'windingUp';
                    this.stateTimer = 0; // Reset timer for new state
                }
                break;

            case 'windingUp':
                // Stand still during wind-up
                if (this.stateTimer >= this.windUpDuration) {
                    console.log("Lumberjack swings!");
                    this.state = 'swinging';
                    this.stateTimer = 0; // Reset timer for swing state
                    // Apply damage NOW at the start of the swing
                    if (checkRectCollision(this, this.chaseTarget)) { // Check collision again just in case player moved
                         console.log("Lumberjack hit player!");
                         this.chaseTarget.takeHit(this.damage);
                    }
                    this.attackTimer = this.attackCooldown; // Start cooldown after swing starts
                }
                break;

            case 'swinging':
                // Stand still during swing
                if (this.stateTimer >= this.swingDuration) {
                    this.state = 'chasing'; // Return to chasing after swing
                    this.stateTimer = 0;
                }
                break;
        }

         // Keep Lumberjack within bounds
         this.x = Math.max(this.width / 2, Math.min(SCREEN_WIDTH - this.width / 2, this.x));
         this.y = Math.max(this.height / 2, Math.min(SCREEN_HEIGHT - this.height / 2, this.y));
    }

    draw(ctx) {
         ctx.save();
         ctx.translate(this.x, this.y);
         if (!this.facingRight) {
             ctx.scale(-1, 1);
         }

         // Axe
         const axeHandleLength = this.height * 0.9;
         const axeHeadWidth = this.width * 0.5;
         const axeHeadHeight = this.height * 0.25;
         const pivotX = this.width * 0.15;
         const pivotY = -this.height * 0.1; // Shoulder height pivot

         ctx.save();
         let axeAngle = -Math.PI / 6; // Idle angle

         if (this.state === 'windingUp') {
             // Raise axe during wind-up
             const windUpPhase = this.stateTimer / this.windUpDuration;
             axeAngle = -Math.PI / 6 - windUpPhase * (Math.PI / 3); // Raise slightly higher
         } else if (this.state === 'swinging') {
             // Swing down and slightly up
             const swingPhase = this.stateTimer / this.swingDuration;
              // Fast down, slower up: (swingPhase < 0.5 ? swingPhase * 2 : 1 - (swingPhase - 0.5) * 2)
             const easedPhase = Math.sin(swingPhase * Math.PI); // Smoother sine wave swing
             axeAngle = -Math.PI / 6 - (Math.PI / 3) + easedPhase * (Math.PI * 0.8); // Swing down from raised position
         }

         ctx.translate(pivotX, pivotY);
         ctx.rotate(axeAngle);
         ctx.translate(-pivotX, -pivotY);

         // Handle
         ctx.fillStyle = '#8B4513';
         ctx.fillRect(pivotX - 4, pivotY - axeHandleLength * 0.7, 8, axeHandleLength);
         // Head
         ctx.fillStyle = '#C0C0C0';
         const headBaseY = pivotY - axeHandleLength * 0.7;
         ctx.beginPath();
         ctx.moveTo(pivotX - axeHeadWidth / 2, headBaseY);
         ctx.lineTo(pivotX + axeHeadWidth / 2, headBaseY);
         ctx.lineTo(pivotX + axeHeadWidth * 0.3, headBaseY - axeHeadHeight); // Sharper angle
         ctx.lineTo(pivotX - axeHeadWidth * 0.3, headBaseY - axeHeadHeight);
         ctx.closePath();
         ctx.fill();
         // Shine on axe head
         ctx.fillStyle = '#E0E0E0';
         ctx.beginPath();
         ctx.moveTo(pivotX - axeHeadWidth * 0.1, headBaseY - axeHeadHeight * 0.3);
         ctx.lineTo(pivotX + axeHeadWidth * 0.1, headBaseY - axeHeadHeight * 0.3);
         ctx.lineTo(pivotX + axeHeadWidth * 0.2, headBaseY - axeHeadHeight * 0.8);
         ctx.lineTo(pivotX - axeHeadWidth * 0.2, headBaseY - axeHeadHeight * 0.8);
         ctx.closePath();
         ctx.fill();

         ctx.restore(); // Restore axe rotation

         // Legs/Pants (Bottom part of body rect)
         ctx.fillStyle = this.color; // Use base color (Sienna) for pants
         ctx.fillRect(-this.width / 2, 0, this.width, this.height / 2);

         // Shirt (Top part of body rect)
         const shirtColor = '#DC143C'; // Crimson Red shirt base
         ctx.fillStyle = shirtColor;
         ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height / 2);
         // Plaid pattern (simple lines)
         ctx.strokeStyle = '#000000'; // Black lines
         ctx.lineWidth = 1;
         const lineSpacing = 8;
         for(let i = -this.width/2; i < this.width/2; i+= lineSpacing) {
              ctx.beginPath();
              ctx.moveTo(i, -this.height / 2);
              ctx.lineTo(i, 0);
              ctx.stroke();
         }
          for(let j = -this.height/2; j < 0; j+= lineSpacing) {
              ctx.beginPath();
              ctx.moveTo(-this.width / 2, j);
              ctx.lineTo(this.width / 2, j);
              ctx.stroke();
         }

         // Head
         const headY = -this.height * 0.4;
         const headRadius = this.width * 0.3;
         ctx.fillStyle = '#FFDBAC'; // Skin color
         ctx.beginPath();
         ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
         ctx.fill();

         // Beard
         ctx.fillStyle = '#5C4033';
         ctx.beginPath();
         ctx.moveTo(-headRadius*0.8, headY + headRadius*0.3);
         ctx.lineTo(headRadius*0.8, headY + headRadius*0.3);
         ctx.lineTo(0, headY + headRadius*1.2); // Longer beard
         ctx.closePath();
         ctx.fill();

         // Beanie
         const beanieColor = '#8B0000'; // Dark Red
         const beanieHeight = headRadius * 0.8;
         ctx.fillStyle = beanieColor;
         ctx.beginPath();
         ctx.ellipse(0, headY - headRadius*0.6, headRadius*1.1, beanieHeight, 0, 0, Math.PI * 2);
         ctx.fill();

         ctx.restore(); // Restore main translate/scale
    }
}

// --- New Dog Class ---
class Dog extends GameObject {
    constructor(x, y) {
        super(x, y, DOG_COLOR);
        this.width = DOG_WIDTH;
        this.height = DOG_HEIGHT;
        this.speed = DOG_SPEED;
        this.attackRange = DOG_ATTACK_RANGE;
        this.attackDamage = DOG_ATTACK_DAMAGE;
        this.attackCooldown = DOG_ATTACK_COOLDOWN;
        this.lastAttackTime = 0;
        this.dx = 0; // For visual direction flipping
        this.dy = 0; // Not used for movement logic here, just chase
        this.isActive = true; // Dogs are active by default but logic checks isDay
    }

    update(deltaTime, player, totalGameTime) { // Pass totalGameTime
        if (!isDay || !this.isActive || gameOver || !player) {
            // Dogs are only active and attack during the day
            return;
        }

        // --- Chase Logic ---
        const targetX = player.x;
        const targetY = player.y;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const moveX = Math.cos(angle) * this.speed * deltaTime;
        const moveY = Math.sin(angle) * this.speed * deltaTime;

        this.x += moveX;
        this.y += moveY;
        // Store speed-independent direction for drawing flip
         if (Math.abs(moveX) > 0.1) { // Check threshold to avoid jitter
             this.dx = moveX;
         }


        // Keep within bounds (simple clamp)
        this.x = Math.max(this.width / 2, Math.min(SCREEN_WIDTH - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(SCREEN_HEIGHT - this.height / 2, this.y));


        // --- Attack Logic ---
        const currentTime = totalGameTime / 1000; // Use total game time
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        if (distToPlayer <= this.attackRange && (currentTime - this.lastAttackTime) > this.attackCooldown) {
            console.log("Dog attacks Player!");
            player.takeHit(this.attackDamage);
            this.lastAttackTime = currentTime;
            // Add a visual indicator for attack? (e.g., brief color change)
        }
    }

    draw(ctx) {
         if (!this.isActive) return; // Don't draw if inactive

        const bodyW = this.width * 0.8;
        const bodyH = this.height * 0.6;
        const legH = this.height * 0.4;
        const legW = this.width * 0.15;
        const headSize = this.width * 0.4;
        const tailW = this.width * 0.5;
        const tailH = this.height * 0.2;
        const earSize = headSize * 0.4;

        ctx.save();
        ctx.translate(this.x, this.y);
         // Use the stored dx from update to determine facing direction
         const scaleX = (this.dx === 0) ? 1 : Math.sign(this.dx);
        ctx.scale(scaleX, 1); // Flip based on horizontal movement

        // Legs
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(-bodyW * 0.4, bodyH / 2 - legH * 0.1, legW, legH); // Back left
        ctx.fillRect(-bodyW * 0.15, bodyH / 2 - legH * 0.1, legW, legH); // Back right
        ctx.fillRect( bodyW * 0.1, bodyH / 2 - legH * 0.1, legW, legH); // Front left
        ctx.fillRect( bodyW * 0.35, bodyH / 2 - legH * 0.1, legW, legH); // Front right
        ctx.globalAlpha = 1.0;

        // Tail (simple wagging up/down ellipse?)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(-bodyW * 0.6, -bodyH * 0.1, tailW / 2, tailH / 2, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

        // Head (square-ish)
        const headX = bodyW * 0.4;
        const headY = -bodyH * 0.1;
        ctx.fillRect(headX - headSize / 2, headY - headSize / 2, headSize, headSize);

        // Ears (floppy)
        ctx.fillStyle = '#A0522D'; // Slightly darker ears
        ctx.fillRect(headX - earSize * 1.2, headY - headSize * 0.4, earSize, earSize * 1.2); // Left ear
        ctx.fillRect(headX + earSize * 0.2, headY - headSize * 0.4, earSize, earSize * 1.2); // Right ear


        // Snout (smaller rectangle)
         ctx.fillStyle = '#C68642'; // Lighter snout
         const snoutW = headSize * 0.5;
         const snoutH = headSize * 0.4;
         ctx.fillRect(headX + headSize * 0.4, headY - snoutH / 2, snoutW, snoutH);


        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(headX + headSize * 0.1, headY - headSize * 0.1, 2, 0, Math.PI * 2); // Simple black eye
        ctx.fill();


        ctx.restore();
    }
}

// --- Collision Detection ---
function checkRectCollision(obj1, obj2) {
    // Calculates bounding boxes based on center coordinates and width/height
    const r1 = {
        left: obj1.x - obj1.width / 2,
        right: obj1.x + obj1.width / 2,
        top: obj1.y - obj1.height / 2,
        bottom: obj1.y + obj1.height / 2,
    };
    const r2 = {
        left: obj2.x - obj2.width / 2,
        right: obj2.x + obj2.width / 2,
        top: obj2.y - obj2.height / 2,
        bottom: obj2.y + obj2.height / 2,
    };

    // Check for overlap
    return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
}

// --- Game Loop ---
function gameLoop(timestamp) {
    // console.log("gameLoop entered. Timestamp:", timestamp); // Remove log
    // Ensure timestamp is valid before calculating deltaTime
    if (!lastTime) {
        // console.log("gameLoop: First run, setting lastTime."); // Remove log
        lastTime = timestamp;
    }
    const deltaTime = (timestamp - lastTime) / 1000; // Delta time in seconds
    lastTime = timestamp;

    // Call update and draw
    try {
        update(deltaTime);
        draw();
    } catch (error) {
        console.error("Error within update/draw:", error);
        // Optionally stop the loop on error:
        // return;
    }

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// --- Update Function ---
function update(deltaTime) {
    if (gameOver) {
        return; // Stop updates if game is over
    }

    // Update total game time
    gameTimeTotal += deltaTime * 1000; // Keep track in ms

    handleDayNightCycle();

    // --- Continuous Rock Spawning at Night ---
    if (!isDay && !gameOver) {
        rockSpawnTimer -= deltaTime; // Decrement timer
        if (rockSpawnTimer <= 0) {
            // Count active rocks
            const activeRocks = monsters.filter(m => m instanceof RockMonster && m.isActive).length;
            if (activeRocks < MAX_ACTIVE_ROCKS) {
                spawnRock(); // Spawn a single rock
            }
            rockSpawnTimer = ROCK_SPAWN_INTERVAL; // Reset timer
        }
    }
    // --- End Continuous Rock Spawning ---

    if (player) {
        player.update(deltaTime);
    } else {
        // console.warn("update: Player object is null!"); 
    }

    // Update NPCs and Collectibles
    monsters.forEach(monster => {
        if (monster.isActive) {
            if (monster instanceof Dog) {
                 monster.update(deltaTime, player, gameTimeTotal); // Pass player and gameTimeTotal
            } else {
                 monster.update(deltaTime); // Existing update calls for Tree, Rock, Lumberjack
            }
        }
    });
    food.forEach(item => item.update(deltaTime));
    particles.forEach(p => p.update(deltaTime));
    goldenEggs.forEach(egg => egg.update(deltaTime)); // <<< UPDATE EGGS

    // --- Collision Handling & Interactions ---
    if (player && !gameOver) { 
        // Player vs Food (Daytime)
        if (isDay) {
            for (let i = food.length - 1; i >= 0; i--) {
                const item = food[i];
                if (item.isActive && checkRectCollision(player, item)) {
                     if (item.healAmount > 0) { 
                         player.heal(item.healAmount);
                         item.isActive = false; 
                         const type = item instanceof GoldenChicken ? "Golden Chicken" : item.constructor.name;
                         console.log(`Collected ${type}! +${item.healAmount} score. Score: ${score}`);
                     }
                }
            }
        } 
        // Player vs Monsters & Eggs (Nighttime)
        else { 
            // Player vs Monsters
            for (let i = monsters.length - 1; i >= 0; i--) {
                const monster = monsters[i];
                if (monster.isActive) {
                    let collisionBounds = monster; 
                    if (monster instanceof TreeMonster && monster.hasFallen) {
                        collisionBounds = monster.getFallingBounds();
                    }
                    
                    // Damage from Lumberjack/Tree is handled in their respective updates.
                    // Only check collision for direct-damage monsters like Rocks.
                    if (monster instanceof RockMonster && checkRectCollision(player, collisionBounds)) {
                            console.log("Hit by Rock!");
                            player.takeHit(monster.damage);
                            monster.isActive = false; // Rock disappears on hit
                    }
                     // NOTE: If adding other monsters that deal damage purely on collision (no cooldown/state), check them here.
                }
            }
            // Player vs Golden Eggs (Nighttime) <<< ADD EGG COLLECTION
            for (let i = goldenEggs.length - 1; i >= 0; i--) {
                const egg = goldenEggs[i];
                if (egg.isActive && checkRectCollision(player, egg)) {
                    player.heal(egg.points); // Use heal to add score
                    egg.isActive = false;
                    console.log(`Collected Golden Egg! +${egg.points} score. Score: ${score}`);
                }
            }
        }
    }

    // Clean up inactive objects
    food = food.filter(f => f.isActive);
    monsters = monsters.filter(m => m.isActive);
    particles = particles.filter(p => p.isActive);
    goldenEggs = goldenEggs.filter(e => e.isActive); // <<< CLEANUP EGGS
}

// --- Day/Night Cycle Logic ---
function handleDayNightCycle() {
    const currentTime = performance.now();
    // How long since the current cycle started?
    const elapsedTime = (currentTime - dayNightCycleStart) / 1000; // in seconds
    const targetDuration = (isDay ? DAY_DURATION / 1000 : NIGHT_DURATION / 1000);

    // --- DEBUG LOGGING --- 
    // Only log occasionally to avoid flooding console
    if (Math.random() < 0.02) { // Log roughly every 50 frames (at 60fps)
        console.log(`Cycle Check: isDay=${isDay}, Elapsed=${elapsedTime.toFixed(2)}s, Target=${targetDuration}s, Start=${dayNightCycleStart.toFixed(0)}`);
    }
    // --- END DEBUG LOGGING ---

    // Is elapsed time >= the duration required for the current cycle (day or night)?
    if (elapsedTime >= targetDuration) {
        // --- Transition --- 
        console.log(`TRANSITIONING! Elapsed=${elapsedTime.toFixed(2)}s >= Target=${targetDuration}s. Flipping isDay from ${isDay} to ${!isDay}.`); // Log transition
        isDay = !isDay; // Flip state
        dayNightCycleStart = currentTime; // Reset START time for the NEW cycle
        gameTimeThisCycle = 0; // Reset elapsed time WITHIN the cycle
        rockSpawnTimer = ROCK_SPAWN_INTERVAL; // << Reset rock spawn timer on transition

        if (isDay) {
            daysSurvived++;
            console.log(`--- Starting Day ${daysSurvived + 1} ---`);
            // Day transition logic
            clearMonsters(); // Clear night monsters (Trees, Rocks, Lumberjack)
            clearFood(); // Clear old food
            clearGoldenEggs(); // <<< CLEAR EGGS AT DAY START
            spawnFood(); // Spawn new food for the day
            spawnInitialMonsters(); // Spawn day monsters (Dogs)

        } else {
            console.log(`--- Starting Night ${daysSurvived + 1} ---`);
            // Night transition logic
            clearMonsters(); // Clear day monsters (Dogs)
             clearFood(); // Optionally clear food at night? Or let it persist? Keeping it for now.
            spawnInitialMonsters(); // Spawn night monsters (Trees, Rocks, Lumberjack)
            spawnGoldenEggs(); // <<< SPAWN EGGS AT NIGHT START
        }
        // Update UI immediately (if needed, otherwise draw loop handles it)
        // updateTimeOfDayDisplay(); // Assuming this exists or is handled in drawUI

        // Ensure monsters are active/inactive based on day/night
         monsters.forEach(m => {
             if (m instanceof Dog) m.isActive = isDay;
             if (m instanceof TreeMonster) m.isActive = !isDay;
             if (m instanceof RockMonster) m.isActive = !isDay;
             if (m instanceof Lumberjack) m.isActive = !isDay;
         });
    } else {
        // --- No Transition Yet ---
        // Update how much time has passed within the CURRENT cycle (for UI display)
        gameTimeThisCycle = elapsedTime;
    }
}

// --- Spawning/Clearing Functions ---
function spawnInitialMonsters() {
    // Don't clear here, handleDayNightCycle clears based on transition
    // clearMonsters();

    if (!isDay) {
        console.log(`Spawning monsters for Night ${daysSurvived + 1}`);
        // Base monsters (Trees)
        const baseMonsters = NUM_MONSTERS_INITIAL;
        for (let i = 0; i < baseMonsters; i++) {
            const x = Math.random() * SCREEN_WIDTH;
            const groundLine = SCREEN_HEIGHT * 0.1; // Assuming 10% sky
            const y = groundLine + Math.random() * (SCREEN_HEIGHT * 0.9);
            monsters.push(new TreeMonster(x, y));
        }
         // Rocks spawn continuously via spawnRock, triggered elsewhere (or needs adding)
         // Spawn Lumberjack boss from Night 1 onwards
        if (daysSurvived >= 0 && player) {
             console.log("Spawning Lumberjack!");
             const edgeMargin = 50;
             const spawnX = Math.random() < 0.5 ? -edgeMargin : SCREEN_WIDTH + edgeMargin;
             const spawnY = Math.random() * SCREEN_HEIGHT;
             monsters.push(new Lumberjack(spawnX, spawnY));
        } else if (!player) {
             console.error("Cannot spawn Lumberjack, player not initialized yet!");
        }
         // Ensure rocks are spawned continuously at night (add if logic was removed)
          // rockSpawnTimer logic might need to be added back into the main update loop or here if rocks only spawn initially.
         // Example continuous spawn logic (needs timer management in update):
         // if (rockSpawnTimer <= 0) {
         //     const activeRocks = monsters.filter(m => m instanceof RockMonster && m.isActive).length;
         //     if (activeRocks < MAX_ACTIVE_ROCKS) spawnRock();
         //     rockSpawnTimer = ROCK_SPAWN_INTERVAL;
         // }

    } else { // isDay
        console.log(`Spawning monsters for Day ${daysSurvived + 1}`);
        // Spawn Dogs (only during the day)
        const currentDogs = monsters.filter(m => m instanceof Dog).length; // Should be 0 after clearMonsters
        const dogsToSpawn = MAX_DOGS - currentDogs;
        console.log(`Spawning ${dogsToSpawn} dogs.`);
        for (let i = 0; i < dogsToSpawn; i++) {
            let spawnX, spawnY, tooClose;
            const maxAttempts = 10; // Prevent infinite loop
            let attempts = 0;
            do {
                tooClose = false;
                spawnX = Math.random() * SCREEN_WIDTH;
                spawnY = Math.random() * SCREEN_HEIGHT;
                // Avoid spawning too close to player
                if (player && Math.hypot(player.x - spawnX, player.y - spawnY) < 150) {
                    tooClose = true;
                }
                attempts++;
            } while (tooClose && attempts < maxAttempts);

             if (!tooClose) { // Only spawn if a suitable spot was found
                monsters.push(new Dog(spawnX, spawnY));
            } else {
                 console.warn("Could not find suitable spawn location for dog after", maxAttempts, "attempts.");
             }
        }
    }

    console.log(`Total monsters after spawn: ${monsters.length}`);
}

function spawnRock() {
    // Spawn near top of the hill
    const hillTopY = SCREEN_HEIGHT * (1 - 0.9); // Same as ground line for now
    const spawnMargin = ROCK_MONSTER_SIZE * 2;
    const x = Math.random() * SCREEN_WIDTH;
    // Spawn slightly above the visible hill line for a better effect
    const y = hillTopY - ROCK_MONSTER_SIZE / 2 - (Math.random() * spawnMargin);
    
    const newRock = new RockMonster(x, y);
    monsters.push(newRock);
    // console.log("Spawned a Rock Monster"); // Reduce console noise
}

function clearMonsters() {
    console.log(`Clearing ${monsters.length} monsters.`);
    monsters = [];
}

function spawnFood() {
    food = [];
    const spawnGoldenChicken = daysSurvived >= 0; // Chickens from Day 1
    const goldenChickenChance = 0.25; // Increased chance (25%)

    console.log(`Spawning food inside fence: X=${FENCE_X.toFixed(0)} Y=${FENCE_Y.toFixed(0)} W=${FENCE_WIDTH.toFixed(0)} H=${FENCE_HEIGHT.toFixed(0)}`);

    for (let i = 0; i < NUM_FOOD; i++) {
        // Calculate spawn position WITHIN the fence boundaries
        const margin = 10; // Small margin from the edge
        const x = FENCE_X + margin + Math.random() * (FENCE_WIDTH - 2 * margin);
        // const groundLine = SCREEN_HEIGHT * (1 - 0.9); // No longer needed for Y constraint
        const y = FENCE_Y + margin + Math.random() * (FENCE_HEIGHT - 2 * margin); 

        let spawned = false;
        if (spawnGoldenChicken && Math.random() < goldenChickenChance) {
            // Ensure chicken width/height fits if necessary (using margin helps)
            const chickenWidth = 25;
            const chickenHeight = 25;
             const safeX = Math.max(FENCE_X + chickenWidth/2 + margin, Math.min(FENCE_X + FENCE_WIDTH - chickenWidth/2 - margin, x)); 
             const safeY = Math.max(FENCE_Y + chickenHeight/2 + margin, Math.min(FENCE_Y + FENCE_HEIGHT - chickenHeight/2 - margin, y)); 
            food.push(new GoldenChicken(safeX, safeY));
            spawned = true;
            // console.log(`Spawned Golden Chicken at ${safeX.toFixed(0)}, ${safeY.toFixed(0)}`); // Debug log
        }

        if (!spawned) {
            const isRabbit = Math.random() < 0.6;
            const size = isRabbit ? RABBIT_SIZE : PIG_SIZE;
            // Ensure spawn position fits animal size within fence
             const safeX = Math.max(FENCE_X + size.width / 2 + margin, Math.min(FENCE_X + FENCE_WIDTH - size.width / 2 - margin, x));
             const safeY = Math.max(FENCE_Y + size.height / 2 + margin, Math.min(FENCE_Y + FENCE_HEIGHT - size.height / 2 - margin, y));

            if (isRabbit) { 
                food.push(new Rabbit(safeX, safeY));
                // console.log(`Spawned Rabbit at ${safeX.toFixed(0)}, ${safeY.toFixed(0)}`); // Debug log
            } else {
                food.push(new Pig(safeX, safeY));
                // console.log(`Spawned Pig at ${safeX.toFixed(0)}, ${safeY.toFixed(0)}`); // Debug log
            }
        }
    }
    console.log(`Spawned ${food.length} food items (Day ${daysSurvived + 1}) inside fence.`);
}

function clearFood() {
    console.log(`Clearing ${food.length} food items.`);
    food = [];
}

// --- New Golden Egg Spawning/Clearing ---
function spawnGoldenEggs() {
    goldenEggs = []; // Clear previous night's eggs first
    console.log(`Spawning ${NUM_GOLDEN_EGGS} golden eggs for the night.`);
    const groundLine = SCREEN_HEIGHT * 0.1; // Ensure eggs spawn on ground
    const margin = 5; // Small margin

    for (let i = 0; i < NUM_GOLDEN_EGGS; i++) {
        let spawnX, spawnY, tooCloseToFence;
        let attempts = 0;
        const maxAttempts = 20;

        do {
            tooCloseToFence = false;
            spawnX = margin + Math.random() * (SCREEN_WIDTH - 2 * margin);
            spawnY = groundLine + margin + Math.random() * (SCREEN_HEIGHT * 0.9 - 2 * margin);

            // Check if inside fence area
            if (spawnX > FENCE_X && spawnX < FENCE_X + FENCE_WIDTH &&
                spawnY > FENCE_Y && spawnY < FENCE_Y + FENCE_HEIGHT) {
                tooCloseToFence = true;
            }
            attempts++;
        } while (tooCloseToFence && attempts < maxAttempts);

        if (!tooCloseToFence) {
            // Clamp to ensure within bounds just in case
            const safeX = Math.max(GOLDEN_EGG_WIDTH / 2 + margin, Math.min(SCREEN_WIDTH - GOLDEN_EGG_WIDTH / 2 - margin, spawnX));
            const safeY = Math.max(groundLine + GOLDEN_EGG_HEIGHT / 2 + margin, Math.min(SCREEN_HEIGHT - GOLDEN_EGG_HEIGHT / 2 - margin, spawnY));
            goldenEggs.push(new GoldenEgg(safeX, safeY));
        } else {
            console.warn("Could not find suitable spawn location for golden egg outside fence after", maxAttempts, "attempts.");
        }
    }
}

function clearGoldenEggs() {
    console.log(`Clearing ${goldenEggs.length} golden eggs.`);
    goldenEggs = [];
}

// --- Background Drawing (Modified to draw on main ctx) ---
function drawBackground(targetCtx) {
     // RESTORE Old Sky/Ground Style
    const groundRatio = 0.9; // 90% ground
    const groundLevel = SCREEN_HEIGHT * (1 - groundRatio);

    // Sky
    targetCtx.fillStyle = isDay ? COLOR_BG_DAY : COLOR_BG_NIGHT;
    targetCtx.fillRect(0, 0, SCREEN_WIDTH, groundLevel); // Only draw sky in the top 10%

    // Ground Area Color
    targetCtx.fillStyle = isDay ? COLOR_GROUND_DAY : COLOR_GROUND_NIGHT;
    targetCtx.fillRect(0, groundLevel, SCREEN_WIDTH, SCREEN_HEIGHT * groundRatio); // Fill ground area

    // --- Draw Fence --- 
    targetCtx.fillStyle = FENCE_COLOR;
    const numPostsHorizontal = 5;
    const numPostsVertical = 4;
    const postSpacingX = FENCE_WIDTH / (numPostsHorizontal - 1);
    const postSpacingY = FENCE_HEIGHT / (numPostsVertical - 1);

    // Horizontal Fence Sections (Top and Bottom)
    for (let i = 0; i < numPostsHorizontal; i++) {
        const postX = FENCE_X + i * postSpacingX;
        // Top posts
        targetCtx.fillRect(postX - FENCE_POST_WIDTH / 2, FENCE_Y, FENCE_POST_WIDTH, FENCE_HEIGHT * 0.4); 
        // Bottom posts (representing a back fence maybe?)
        // targetCtx.fillRect(postX - FENCE_POST_WIDTH / 2, FENCE_Y + FENCE_HEIGHT * 0.6, FENCE_POST_WIDTH, FENCE_HEIGHT * 0.4); 
    }
    // Top Rails
    targetCtx.fillRect(FENCE_X, FENCE_Y + FENCE_HEIGHT * 0.1, FENCE_WIDTH, FENCE_RAIL_HEIGHT);
    targetCtx.fillRect(FENCE_X, FENCE_Y + FENCE_HEIGHT * 0.25, FENCE_WIDTH, FENCE_RAIL_HEIGHT);
    // Bottom Rails
    // targetCtx.fillRect(FENCE_X, FENCE_Y + FENCE_HEIGHT * 0.7, FENCE_WIDTH, FENCE_RAIL_HEIGHT);
    // targetCtx.fillRect(FENCE_X, FENCE_Y + FENCE_HEIGHT * 0.85, FENCE_WIDTH, FENCE_RAIL_HEIGHT);

     // Vertical Fence Sections (Left and Right sides)
     for (let i = 0; i < numPostsVertical; i++) {
         const postY = FENCE_Y + i * postSpacingY;
         // Left Posts (excluding corners already drawn)
         if (i > 0 && i < numPostsVertical -1 ) targetCtx.fillRect(FENCE_X - FENCE_POST_WIDTH / 2, postY, FENCE_POST_WIDTH, FENCE_HEIGHT * 0.4); 
         // Right Posts (draw full column)
         targetCtx.fillRect(FENCE_X + FENCE_WIDTH - FENCE_POST_WIDTH / 2, postY, FENCE_POST_WIDTH, FENCE_HEIGHT * 0.4); 
     }
     // Left Rails
     targetCtx.fillRect(FENCE_X, FENCE_Y + FENCE_HEIGHT * 0.1, FENCE_RAIL_HEIGHT, FENCE_HEIGHT);
     targetCtx.fillRect(FENCE_X + FENCE_WIDTH - FENCE_RAIL_HEIGHT, FENCE_Y + FENCE_HEIGHT * 0.1, FENCE_RAIL_HEIGHT, FENCE_HEIGHT); 


    // --- End Fence Drawing ---

     // Night specific elements (Moon, Stars, Hill)
     if (!isDay) {
          // Draw Hill (simple curve over the ground area) - RESTORED
         const hillHeight = groundLevel * 0.6; // How high the hill peaks into the sky area
         const hillPeakX = SCREEN_WIDTH * 0.6; // Where the hill peaks (example)
         targetCtx.fillStyle = COLOR_GROUND_NIGHT; // Use ground color for hill
         targetCtx.beginPath();
         targetCtx.moveTo(0, groundLevel); // Start at left ground level
         // Curve up to a peak and back down
         targetCtx.quadraticCurveTo(hillPeakX, groundLevel - hillHeight, SCREEN_WIDTH, groundLevel);
         targetCtx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT); // Line down to bottom right
         targetCtx.lineTo(0, SCREEN_HEIGHT); // Line to bottom left
         targetCtx.closePath();
         targetCtx.fill();

         // Moon (draw after hill)
         targetCtx.fillStyle = COLOR_MOON;
         targetCtx.beginPath();
         // Position moon higher in the small sky area
         targetCtx.arc(SCREEN_WIDTH * 0.85, groundLevel * 0.4, SCREEN_WIDTH * 0.04, 0, Math.PI * 2);
         targetCtx.fill();

         // Stars (only in sky area above groundLevel)
         targetCtx.fillStyle = COLOR_STAR;
         for (let i = 0; i < 100; i++) {
             const x = Math.random() * SCREEN_WIDTH;
             const y = Math.random() * groundLevel; // Ensure y is within the sky area
             targetCtx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
         }
     }
}

// --- Main Draw Function ---
function draw() {
    // 1. Clear the main canvas (optional, as background overwrites)
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 2. Draw Background directly onto main ctx
    drawBackground(ctx);

    // 3. Draw Game Objects directly onto main ctx
    particles.forEach(p => p.draw(ctx));
    food.forEach(item => item.draw(ctx));
    goldenEggs.forEach(egg => egg.draw(ctx)); // <<< DRAW EGGS (This line was added before but ensure it's correct)
    monsters.forEach(monster => monster.draw(ctx));
    if (player) {
        player.draw(ctx);
    }

    // 4. Draw UI directly onto main ctx
    drawUI(ctx);

    // 5. Scaling step is removed
    /*
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        bufferCanvas, 
        0, 0, NATIVE_WIDTH, NATIVE_HEIGHT, 
        0, 0, SCREEN_WIDTH, SCREEN_HEIGHT 
    );
    */
}

// --- UI Drawing (Draws onto ctx, reverted sizes) ---
function drawUI(targetCtx) { // Takes main ctx as argument now
    // Setup Text Style
    targetCtx.font = ARCADE_FONT; // Use original larger font size
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';
    const shadowOffset = 2; // Restore original shadow offset

    // Function to draw text with shadow on targetCtx
    function drawTextWithShadow(text, x, y) {
        targetCtx.fillStyle = COLOR_UI_SHADOW;
        targetCtx.fillText(text, x + shadowOffset, y + shadowOffset);
        targetCtx.fillStyle = COLOR_UI_TEXT;
        targetCtx.fillText(text, x, y);
    }

    // Coordinates reverted for SCREEN resolution
    const uiX = 10;
    let uiY = 10;
    const lineH = 35; // Line height based on 30px font

    // Day/Night status
    const statusText = `Day ${daysSurvived + 1}` + (isDay ? '' : ' (Night)');
    drawTextWithShadow(statusText, uiX, uiY);
    uiY += lineH;

    // Timer - Use gameTimeThisCycle and correct duration
     const cycleDuration = isDay ? DAY_DURATION : NIGHT_DURATION;
     const timeLeft = Math.max(0, Math.ceil(cycleDuration / 1000 - gameTimeThisCycle)); // Ensure non-negative
    drawTextWithShadow(`Time left: ${timeLeft}`, uiX, uiY);
    uiY += lineH;

    // Draw Score Text & Bar
    drawTextWithShadow(`Score: ${score}`, uiX, uiY);
    uiY += lineH + 5; // Add space before bar

    const barWidth = 200; // Bar width at full resolution
    const barHeight = 20; // Bar height at full resolution
    const scorePercent = Math.min(1, Math.max(0, score / MAX_SCORE_DISPLAY));
    
    targetCtx.fillStyle = COLOR_SCORE_BAR_BG;
    targetCtx.fillRect(uiX, uiY, barWidth, barHeight);
    targetCtx.fillStyle = COLOR_SCORE_BAR_FILL;
    targetCtx.fillRect(uiX, uiY, barWidth * scorePercent, barHeight);
    uiY += barHeight + 10; // Move Y for next UI element

    // Game Over Message
    if (gameOver) {
        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        targetCtx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        targetCtx.font = GAMEOVER_FONT; // Use original larger font
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        const flash = Math.floor(Date.now() / 500) % 2 === 0;
        targetCtx.fillStyle = flash ? COLOR_GAMEOVER_TEXT : COLOR_UI_TEXT;

        targetCtx.fillText("GAME OVER", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

        // Reset font style
        targetCtx.font = ARCADE_FONT;
        targetCtx.fillStyle = COLOR_UI_TEXT;
        targetCtx.textAlign = 'left'; 
        // targetCtx.fillText("Press R to Restart", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        showRestartButton();
    } else {
        hideRestartButton();
    }

    // Add 'by o'reilly' label to bottom right
    const labelText = "by o'reilly";
    const labelMargin = 8; // pixels from edge (slightly adjusted)
    const labelFont = "15px 'Courier New', monospace"; // Smaller font
    const labelColor = '#AAAAAA'; // Lighter grey color
    const labelShadowColor = '#333333'; // Darker shadow

    targetCtx.font = labelFont;
    targetCtx.textAlign = 'right';
    targetCtx.textBaseline = 'bottom';

    // Draw shadow first
    targetCtx.fillStyle = labelShadowColor;
    targetCtx.fillText(labelText, SCREEN_WIDTH - labelMargin + 1, SCREEN_HEIGHT - labelMargin + 1); // Offset shadow
    // Draw main text
    targetCtx.fillStyle = labelColor;
    targetCtx.fillText(labelText, SCREEN_WIDTH - labelMargin, SCREEN_HEIGHT - labelMargin);

    // Reset alignment, baseline, and font if modified
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';
    targetCtx.font = ARCADE_FONT; // Reset to default UI font
}

// --- Attack Handling ---
function handleAttack() {
    if (!player || isDay || gameOver) return; // Player only attacks at night

    console.log("Player attacks!");

    // --- Spawn Attack Particles ---
    const particleCount = 8;
    const particleSpeed = 100; // pixels per second
    const particleLifespan = 0.4; // seconds
    const particleSize = 3;
    // Particle class now uses COLOR_PARTICLE directly
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * particleSpeed * (0.5 + Math.random() * 0.5); // Add some speed variation
        const vy = Math.sin(angle) * particleSpeed * (0.5 + Math.random() * 0.5);
        particles.push(new Particle(player.x, player.y, vx, vy, particleSize, particleLifespan));
    }
    // --- End Particle Spawning ---

    let monsterHit = false;
    // Check for hits (iterating backwards for safe removal within loop)
    for (let i = monsters.length - 1; i >= 0; i--) {
         const monster = monsters[i];
         if (monster.isActive) {
            const dx = player.x - monster.x;
            const dy = player.y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.attackRange) {
                // Check if the monster is NOT a Lumberjack before deactivating
                if (!(monster instanceof Lumberjack)) { 
                    console.log(`Hit ${monster.constructor.name}!`);
                    monster.isActive = false; // Mark for removal
                    monsterHit = true;
                } else {
                    console.log("Player attack hit Lumberjack, but it cannot be killed!");
                    // Optional: Add visual/audio feedback for hitting invincible target
                }
            }
        }
    }

    // Immediate filter for responsive feedback (optional, update loop also handles it)
    if (monsterHit) {
         monsters = monsters.filter(m => m.isActive);
         console.log(`Monsters remaining: ${monsters.length}`);
    }
}

// --- Input Handling ---
const keysPressed = {};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    // Don't process input if game over, except maybe for restart?
    // For now, just block game actions
    if (gameOver) return;

    keysPressed[key] = true;

    // Use 'e' for attack - Ensure this check is working
    if (key === 'e') {
        handleAttack(); 
    }
    // Update movement regardless of attack key press
    updatePlayerMovement();
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
    updatePlayerMovement();
});

function updatePlayerMovement() {
    if (!player || gameOver) { // Stop movement if game over
         if(player) { player.dx = 0; player.dy = 0; }
         return;
    }

    // Horizontal movement
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        player.move('left');
    } else if (keysPressed['d'] || keysPressed['arrowright']) {
        player.move('right');
    } else {
        player.stop('horizontal');
    }

    // Vertical movement
    if (keysPressed['w'] || keysPressed['arrowup']) {
        player.move('up');
    } else if (keysPressed['s'] || keysPressed['arrowdown']) {
        player.move('down');
    } else {
        player.stop('vertical');
    }
}

// --- Initialization ---
function init() {
    // Reset state for potential restart
    score = INITIAL_SCORE; // <<< Restore initial score constant
    gameOver = false;
    isDay = true; // Start at Day 1
    dayNightCycleStart = performance.now(); // Reset timer
    gameTimeThisCycle = 0;
    gameTimeTotal = 0; // Reset total timer
    daysSurvived = 0;
    monsters = [];
    food = [];
    particles = [];
    player = null; // Ensure player is reset
    lastTime = 0; // Reset loop timer
    rockSpawnTimer = ROCK_SPAWN_INTERVAL; // << Initialize rock timer

    console.log("init started.");
    try {
        // Choose character
        player = new Fox(PLAYER_START_X, PLAYER_START_Y);

        // Initial spawn
        if (isDay) {
            spawnFood();
            spawnInitialMonsters(); // <<< ADD THIS CALL
        } else {
            spawnInitialMonsters(); // Night monsters spawn here
            // Optionally spawn food at night too? Currently not.
        }

        // Start the game loop
        // Check if a loop is already running?
        // For simplicity, assume it's not or requestAnimationFrame handles it.
        lastTime = performance.now(); 
        requestAnimationFrame(gameLoop);

    } catch (error) {
        console.error("Error during init:", error);
    }
    console.log("init finished.");
}

// --- Restart Button Logic ---
const restartBtn = document.getElementById('restartBtn');

function showRestartButton() {
    restartBtn.style.display = 'block';
}
function hideRestartButton() {
    restartBtn.style.display = 'none';
}
restartBtn.onclick = function() {
    init();
    hideRestartButton();
};

// --- Music Logic ---
const audio = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');
let isMusicPlaying = false;

musicBtn.addEventListener('click', () => {
  if (isMusicPlaying) {
    audio.pause();
    musicBtn.textContent = '🔊';
  } else {
    audio.play();
    musicBtn.textContent = '🔇';
  }
  isMusicPlaying = !isMusicPlaying;
});

// console.log("Script end, calling init()."); // Remove log
init(); 