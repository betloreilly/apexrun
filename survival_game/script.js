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

// --- Game State ---
let isDay = true;
let cycleTimer = Date.now();
let currentCycleDuration = DAY_DURATION;
let daysSurvived = 0;
let score = INITIAL_SCORE;
let lastTime = 0;
let player = null; // Will be Fox or Wolf instance
let monsters = [];
let food = [];
let particles = []; // Add particles array
let gameOver = false; // Add Game Over flag
let rockSpawnTimer = ROCK_SPAWN_INTERVAL; // Timer for spawning rocks

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
        const bodyH = this.height * 0.7; // Main body part height
        const legH = this.height * 0.3;
        const legW = this.width * 0.2;
        const tailW = this.width * 0.8;
        const tailH = this.height * 0.4;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Flip horizontally based on movement direction
        const scaleX = (this.dx === 0) ? 1 : Math.sign(this.dx);
        ctx.scale(scaleX, 1);

        // Legs (draw first)
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8; // Slightly different alpha for legs?
        ctx.fillRect(-bodyW * 0.35, bodyH / 2 - legH * 0.2, legW, legH); // Back leg
        ctx.fillRect( bodyW * 0.15, bodyH / 2 - legH * 0.2, legW, legH); // Front leg
        ctx.globalAlpha = 1.0;

        // Tail (bushy ellipse)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(-bodyW * 0.6, 0, tailW / 2, tailH / 2, Math.PI / 6, 0, Math.PI * 2); // Angled ellipse
        ctx.fill();

        // Body (main rectangle)
        ctx.fillStyle = this.color;
        ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

        // Head/Snout Triangle
        ctx.beginPath();
        ctx.moveTo(bodyW * 0.3, -bodyH / 2); // Top back of head
        ctx.lineTo(bodyW * 0.3 + this.snoutLength, 0); // Snout tip
        ctx.lineTo(bodyW * 0.3, bodyH / 2); // Bottom back of head
        ctx.closePath();
        ctx.fill();
        
        // Eye (small black dot)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(bodyW * 0.3 + this.snoutLength * 0.4, -bodyH * 0.1, 2, 0, Math.PI * 2);
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

        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;

        // Boundary check
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const groundLine = SCREEN_HEIGHT * (1 - 0.9); // Calculate ground line (10% sky)

        if (this.x - halfW < 0 || this.x + halfW > SCREEN_WIDTH) {
            this.dx *= -1;
            this.x = Math.max(halfW, Math.min(SCREEN_WIDTH - halfW, this.x));
        }
        // Prevent moving above ground line & handle bottom boundary
        if (this.y + halfH > SCREEN_HEIGHT) { // Hit bottom
            this.dy = Math.abs(this.dy) * -1; // Force bounce up
            this.y = SCREEN_HEIGHT - halfH;
        } else if (this.y - halfH < groundLine) { // Hit top (ground line)
             this.dy = Math.abs(this.dy); // Force bounce down
             this.y = groundLine + halfH;
        }
    }

    setRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    draw(ctx) {
        const bodyH = this.height * 0.8; // Body height
        const bodyW = this.width;
        const headR = this.width * 0.3; // Head radius
        const earH = this.height * 0.7;
        const earW = this.width * 0.2;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Simple rotation based on horizontal movement direction
        if (this.dx !== 0) {
            ctx.scale(Math.sign(this.dx), 1); // Flip horizontally if moving left
        }

        // Ears (draw first)
        ctx.fillStyle = COLOR_RABBIT_BODY;
        ctx.fillRect(-bodyW * 0.1 - earW / 2, -bodyH / 2 - headR - earH, earW, earH); // Left ear
        ctx.fillRect( bodyW * 0.1 - earW / 2, -bodyH / 2 - headR - earH, earW, earH); // Right ear
        ctx.fillStyle = COLOR_RABBIT_DETAIL; // Inner ear pink
        ctx.fillRect(-bodyW * 0.1 - earW / 4, -bodyH / 2 - headR - earH*0.8, earW/2, earH*0.8);
        ctx.fillRect( bodyW * 0.1 - earW / 4, -bodyH / 2 - headR - earH*0.8, earW/2, earH*0.8);

        // Body (ellipse/oval)
        ctx.fillStyle = COLOR_RABBIT_BODY;
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (circle)
        ctx.beginPath();
        ctx.arc(bodyW * 0.3, -bodyH / 2, headR, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose (small detail)
        ctx.fillStyle = COLOR_RABBIT_DETAIL;
        ctx.beginPath();
        ctx.arc(bodyW * 0.3 + headR * 0.8, -bodyH / 2, headR * 0.2, 0, Math.PI * 2);
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

        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;

        // Boundary check
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const groundLine = SCREEN_HEIGHT * (1 - 0.9); // Calculate ground line (10% sky)

        if (this.x - halfW < 0 || this.x + halfW > SCREEN_WIDTH) {
            this.dx *= -1;
            this.x = Math.max(halfW, Math.min(SCREEN_WIDTH - halfW, this.x));
        }
        // Prevent moving above ground line & handle bottom boundary
        if (this.y + halfH > SCREEN_HEIGHT) { // Hit bottom
            this.dy = Math.abs(this.dy) * -1; // Force bounce up
            this.y = SCREEN_HEIGHT - halfH;
        } else if (this.y - halfH < groundLine) { // Hit top (ground line)
             this.dy = Math.abs(this.dy); // Force bounce down
             this.y = groundLine + halfH;
        }
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

        ctx.save();
        ctx.translate(this.x, this.y);

        // Simple rotation based on horizontal movement direction
        if (this.dx !== 0) {
            ctx.scale(Math.sign(this.dx), 1); // Flip horizontally if moving left
        }
        
        // Tail (curly line)
        ctx.strokeStyle = COLOR_PIG_BODY;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-bodyW / 2, 0);
        ctx.quadraticCurveTo(-bodyW * 0.7, -bodyH * 0.3, -bodyW*0.6, bodyH * 0.1);
        ctx.stroke();

        // Body (ellipse)
        ctx.fillStyle = COLOR_PIG_BODY;
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (circle)
        ctx.beginPath();
        ctx.arc(bodyW * 0.35, -bodyH * 0.1, headR, 0, Math.PI * 2);
        ctx.fill();

        // Snout (circle)
        ctx.fillStyle = COLOR_PIG_DETAIL;
        const snoutX = bodyW * 0.35 + headR * 0.9;
        const snoutY = -bodyH * 0.1;
        ctx.beginPath();
        ctx.arc(snoutX, snoutY, snoutR, 0, Math.PI * 2);
        ctx.fill();
        // Nostrils (tiny black dots)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(snoutX - snoutR * 0.3, snoutY, 1, 0, Math.PI*2);
        ctx.arc(snoutX + snoutR * 0.3, snoutY, 1, 0, Math.PI*2);
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
        // Optionally add logic here for a game over screen fade, etc.
        return; // Stop updates if game is over
    }

    handleDayNightCycle();

    if (player) {
        player.update(deltaTime);
    } else {
        // console.warn("update: Player object is null!"); // Keep warning just in case
    }

    // Update NPCs
    monsters.forEach(monster => monster.update(deltaTime));
    food.forEach(item => item.update(deltaTime));
    particles.forEach(p => p.update(deltaTime));

    // --- Collision Handling & Interactions ---
    if (player && !gameOver) { // Don't check collisions if game over
        // Player vs Food (Daytime)
        if (isDay) {
            for (let i = food.length - 1; i >= 0; i--) {
                const item = food[i];
                if (item.isActive && checkRectCollision(player, item)) {
                     if (item.healAmount > 0) { 
                         player.heal(item.healAmount); // Heal player
                         item.isActive = false; 
                         console.log(`Collected ${item.constructor.name}! +${item.healAmount} score. Score: ${score}`);
                     }
                }
            }
        }
        // Player vs Monsters (Nighttime)
        else {
            for (let i = monsters.length - 1; i >= 0; i--) {
                const monster = monsters[i];
                if (monster.isActive) {
                    let collisionBounds = monster; // Default bounds
                    if (monster instanceof TreeMonster && monster.hasFallen) {
                        // Use special bounds for fallen tree
                        collisionBounds = monster.getFallingBounds();
                    }
                    
                    if (checkRectCollision(player, collisionBounds)) {
                        if (monster instanceof RockMonster) {
                            console.log("Hit by Rock!");
                            player.takeHit(monster.damage);
                            monster.isActive = false;
                        }
                        // Damage from Tree only applies AFTER it has fallen (hasFallen=true)
                        else if (monster instanceof TreeMonster && monster.hasFallen) {
                             // Damage is now applied within the Tree's update when fall completes
                             // So we might not need to check here again, but can leave as safeguard?
                        }
                    }
                }
            }
        }
    }

    // Clean up inactive objects
    food = food.filter(f => f.isActive);
    monsters = monsters.filter(m => m.isActive);
    particles = particles.filter(p => p.isActive); // Clean up dead particles

    // console.log("update finished."); // Remove log
}

// --- Day/Night Cycle Logic ---
function handleDayNightCycle() {
    const now = Date.now();
    if (now - cycleTimer > currentCycleDuration) {
        isDay = !isDay;
        cycleTimer = now;
        if (isDay) {
            currentCycleDuration = DAY_DURATION;
            daysSurvived++;
            console.log(`Transitioning to Day ${daysSurvived + 1}`);
            clearMonsters(); // Clear remaining night monsters
            spawnFood();
        } else {
            currentCycleDuration = NIGHT_DURATION;
            console.log('Transitioning to Night');
            clearFood();
            spawnInitialMonsters(); // Spawn initial trees
            rockSpawnTimer = ROCK_SPAWN_INTERVAL; // Reset rock spawn timer
        }
    }

    // --- Continuous Rock Spawning at Night ---
    if (!isDay && !gameOver) {
        rockSpawnTimer -= (now - lastTime) / 1000; // Use deltaTime essentially
        if (rockSpawnTimer <= 0) {
            // Count active rocks
            const activeRocks = monsters.filter(m => m instanceof RockMonster && m.isActive).length;
            if (activeRocks < MAX_ACTIVE_ROCKS) {
                spawnRock(); // Spawn a single rock
            }
            rockSpawnTimer = ROCK_SPAWN_INTERVAL; // Reset timer
        }
    }
}

// --- Spawning/Clearing Functions ---
function spawnInitialMonsters() {
    monsters = []; // Clear existing monsters
    for (let i = 0; i < NUM_MONSTERS_INITIAL; i++) {
        const x = Math.random() * SCREEN_WIDTH;
        const y = Math.random() * SCREEN_HEIGHT;
        // Start with only Trees
        monsters.push(new TreeMonster(x, y));
    }
    console.log(`Spawned ${monsters.length} initial trees.`);
    // Rocks will now spawn over time
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
    food = []; // Clear existing
    for (let i = 0; i < NUM_FOOD; i++) { // Use updated NUM_FOOD
        const x = Math.random() * SCREEN_WIDTH;
        const y = Math.random() * SCREEN_HEIGHT;
        if (Math.random() < 0.6) { 
            food.push(new Rabbit(x, y));
        } else {
            food.push(new Pig(x, y));
        }
    }
    console.log(`Spawned ${food.length} food items.`);
}

function clearFood() {
    console.log(`Clearing ${food.length} food items.`);
    food = [];
}

// --- Background Drawing (Modified to draw on main ctx) ---
function drawBackground(targetCtx) {
    const groundRatio = 0.9; // 90% ground
    const groundLevel = SCREEN_HEIGHT * (1 - groundRatio);

    // Sky
    targetCtx.fillStyle = isDay ? COLOR_BG_DAY : COLOR_BG_NIGHT;
    targetCtx.fillRect(0, 0, SCREEN_WIDTH, groundLevel); // Only draw sky in the top 10%

    // Ground Area Color
    targetCtx.fillStyle = isDay ? COLOR_GROUND_DAY : COLOR_GROUND_NIGHT;
    targetCtx.fillRect(0, groundLevel, SCREEN_WIDTH, SCREEN_HEIGHT * groundRatio); // Fill ground area

    // Night specific elements
    if (!isDay) {
         // Draw Hill (simple curve over the ground area)
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

// --- Main Draw Function (Draws directly to main ctx) ---
function draw() {
    // 1. Clear the main canvas (optional, as background overwrites)
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 2. Draw Background directly onto main ctx
    drawBackground(ctx);

    // 3. Draw Game Objects directly onto main ctx
    particles.forEach(p => p.draw(ctx));
    food.forEach(item => item.draw(ctx));
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

    // Timer
    const timeLeft = Math.ceil((currentCycleDuration - (Date.now() - cycleTimer)) / 1000);
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
    }
}

// --- Attack Handling ---
function handleAttack() {
    if (!player || isDay || gameOver) return;

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
                console.log(`Hit ${monster.constructor.name}!`);
                monster.isActive = false; // Mark for removal
                monsterHit = true;
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
    score = INITIAL_SCORE;
    gameOver = false;
    isDay = true; // Start at Day 1
    cycleTimer = Date.now();
    currentCycleDuration = DAY_DURATION;
    daysSurvived = 0;
    monsters = [];
    food = [];
    particles = [];
    player = null; // Ensure player is reset
    lastTime = 0; // Reset timer
    rockSpawnTimer = ROCK_SPAWN_INTERVAL; // Initialize timer here too
    
    console.log("init started.");
    try {
        // Choose character
        player = new Fox(PLAYER_START_X, PLAYER_START_Y);

        // Initial spawn
        if (isDay) {
            spawnFood();
        } else {
            spawnInitialMonsters();
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

// console.log("Script end, calling init()."); // Remove log
init(); 