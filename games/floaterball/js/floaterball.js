/*
Title:      Floater Ball
Author:     Drew D. Lenhart
Website:    https://github.com/dlenhart/floaterball
Date:       02-27-2026
Version:    0.3.3

Description:  Collect as many squares as possible within the time 
limit. Use the walls and other objects to your advantage and get 
the highest score possible. P.S. don't eat the red squares!

Notes: I started this game back in 2016 and slowly worked on it
for 10 years here and there. I hope you enjoy this game and shoot 
me an email if you find any bugs --Drew Lenhart (dlenhart at gmail dot com)
*/

let game = null;
let timer = null;

let FLTR = {
    DAMPING: 0.97,
    SPEED_INCREMENT: 0.5,
    MAX_SPEED: 8,
    INITIAL_TIME: 20,
    TIMER_INTERVAL: 1000,
    INITIAL_LEVEL: 1,
    TOTAL_LEVELS: 50,
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    HEADER_HEIGHT: 20,
    BALL_RADIUS: 10,
    BALL_COLOR: "#ffffff",
    FOOD_WIDTH: 20,
    FOOD_HEIGHT: 20,
    FOOD_COLOR: "#6F7678",
    FOOD_STROKE_COLOR: "white",
    BONUS_FOOD_COLOR: "#9B59B6",
    BONUS_FOOD_POINTS: 10,
    POWERUP_FOOD_COLOR: "#FF8C00",
    POWERUP_SIZE_MULTIPLIER: 2,
    GREEN_FOOD_COLOR: "#00FF00",
    GREEN_FOOD_POINTS: 5,
    FORBIDDEN_FOOD_COLOR: "#FF0000",
    OBSTACLE_BASE_SIZE: 20,
    OBSTACLE_MAX_MULTIPLIER: 4,
    OBSTACLE_COLOR: "#000000",
    OBSTACLE_STROKE_COLOR: "#00ffff",
    OBSTACLE_STROKE_WIDTH: 2,
    STICKY_MINE_COLOR: "#FFD700",
    STICKY_MINE_STROKE_COLOR: "#FFA500",
    STICKY_MINE_DURATION: 5000,
    POPUP_DURATION: 60,
    POPUP_RISE_SPEED: 1,
    POPUP_FONT_SIZE: 20,
    TEXT_SIZE: 14,
    TEXT_COLOR: "#00ffff",
    POPUP_COLOR: "#00ffff",
    TEXT_FONT: "Courier New",
    KEY_SHIFT: "Shift",
    KEY_SPACE: " ",
    KEY_ESCAPE: "Escape",
    KEY_LEFT: "ArrowLeft",
    KEY_UP: "ArrowUp",
    KEY_RIGHT: "ArrowRight",
    KEY_DOWN: "ArrowDown",
    xSpeed: 0,
    ySpeed: 0,
    y: 300,
    x: 300,
    foodXPos: 0,
    foodYPos: 0,
    greenFoodItems: [],
    greenFoodCount: 0,
    bonusFoodXPos: -100,
    bonusFoodYPos: -100,
    bonusFoodActive: false,
    powerupFoodXPos: -100,
    powerupFoodYPos: -100,
    powerupFoodActive: false,
    powerupAlreadySpawned: false,
    powerupActive: false,
    forbiddenFoodXPos: -100,
    forbiddenFoodYPos: -100,
    forbiddenFoodActive: false,
    forbiddenFoodDeath: false,
    currentBallRadius: 10,
    trail: [],
    maxTrailLength: 15,
    obstacles: [],
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    gamePaused: false,
    score: 0,
    canvas: null,
    ctx: null,
    timeLeft: 20,
    level: 1,
    debug: false,
    gameEnded: false,
    highScore: 0,
    levelTransition: false,
    levelScoreCount: 0,
    scorePopups: [],
    stickyMines: [],
    stickyStuck: false,
    stickyStuckTimer: null,
    stickyStuckStart: 0,
    stickyStuckRemaining: 0,
    wallHitCooldown: false,
    bonusSpawnTimer: null,
    forbiddenSpawnTimer: null,

    sounds: {},

    init: function () {
        try {
            FLTR.canvas = document.getElementsByTagName('canvas')[0];

            if (!FLTR.canvas) {
                throw new Error('Canvas element not found');
            }
            FLTR.canvas.width = FLTR.CANVAS_WIDTH;
            FLTR.canvas.height = FLTR.CANVAS_HEIGHT;
            FLTR.ctx = FLTR.canvas.getContext('2d');

            if (!FLTR.ctx) {
                throw new Error('Could not get 2D context from canvas');
            }

            const savedHighScore = localStorage.getItem('floaterball_highscore');
            FLTR.highScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;

            FLTR.loadSounds();
        } catch (error) {
            console.error('Initialization error:', error.message);
            alert('Failed to initialize game: ' + error.message);
        }
    },

    getLevelTime: function (level) {
        return Math.max(8, FLTR.INITIAL_TIME - Math.floor((level - 1) / 3));
    },

    getObstacleCount: function (level) {
        if (level < 2) return 0;
        if (level <= 10) return level + 1;
        if (level <= 25) return 11 + Math.floor((level - 10) / 2);
        return Math.min(25, 18 + Math.floor((level - 25) / 3));
    },

    getStickyMineCount: function (level) {
        if (level < 10) return 0;
        return Math.min(5, Math.floor((level - 10) / 8) + 1);
    },

    rectanglesOverlap: function (x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
    },

    ballOverlapsRectangle: function (ballX, ballY, ballRadius, rectX, rectY, rectW, rectH) {
        const closestX = Math.max(rectX, Math.min(ballX, rectX + rectW));
        const closestY = Math.max(rectY, Math.min(ballY, rectY + rectH));
        const distanceX = ballX - closestX;
        const distanceY = ballY - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (ballRadius * ballRadius);
    },

    ballCollidesWithFood: function (foodX, foodY, foodWidth, foodHeight) {
        return Math.round(FLTR.x) + FLTR.currentBallRadius > foodX &&
            Math.round(FLTR.x) - FLTR.currentBallRadius < foodX + foodWidth &&
            Math.round(FLTR.y) + FLTR.currentBallRadius > foodY &&
            Math.round(FLTR.y) - FLTR.currentBallRadius < foodY + foodHeight;
    },

    isPositionValidForFood: function (x, y, width, height, excludeTypes = []) {
        // Check black obstacles
        for (let i = 0; i < FLTR.obstacles.length; i++) {
            const obs = FLTR.obstacles[i];
            if (FLTR.rectanglesOverlap(
                    x,
                    y,
                    width,
                    height,
                    obs.x,
                    obs.y,
                    obs.width,
                    obs.height)) {
                return false;
            }
        }

        // Check regular food
        if (!excludeTypes.includes('regular') &&
            FLTR.rectanglesOverlap(
                x,
                y,
                width,
                height,
                FLTR.foodXPos,
                FLTR.foodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)
        ) {
            return false;
        }

        // Check bonus food
        if (!excludeTypes.includes('bonus') && FLTR.bonusFoodActive &&
            FLTR.rectanglesOverlap(
                x,
                y,
                width,
                height,
                FLTR.bonusFoodXPos,
                FLTR.bonusFoodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)
        ) {
            return false;
        }

        // Check powerup food
        if (!excludeTypes.includes('powerup') && FLTR.powerupFoodActive &&
            FLTR.rectanglesOverlap(
                x,
                y,
                width,
                height,
                FLTR.powerupFoodXPos,
                FLTR.powerupFoodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)
        ) {
            return false;
        }

        // Check forbidden food
        if (!excludeTypes.includes('forbidden') && FLTR.forbiddenFoodActive &&
            FLTR.rectanglesOverlap(
                x,
                y,
                width,
                height,
                FLTR.forbiddenFoodXPos,
                FLTR.forbiddenFoodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)
        ) {
            return false;
        }

        // Check green food
        if (!excludeTypes.includes('green')) {
            for (let i = 0; i < FLTR.greenFoodItems.length; i++) {
                const green = FLTR.greenFoodItems[i];
                if (FLTR.rectanglesOverlap(
                        x,
                        y,
                        width,
                        height,
                        green.x,
                        green.y,
                        FLTR.FOOD_WIDTH,
                        FLTR.FOOD_HEIGHT)) {
                    return false;
                }
            }
        }

        // Check sticky mines
        for (let i = 0; i < FLTR.stickyMines.length; i++) {
            const mine = FLTR.stickyMines[i];
            if (FLTR.rectanglesOverlap(
                    x,
                    y,
                    width,
                    height,
                    mine.x,
                    mine.y,
                    FLTR.FOOD_WIDTH,
                    FLTR.FOOD_HEIGHT)) {
                return false;
            }
        }

        // Prevent food spawning on top of or too close to the ball
        const expandedRadius = FLTR.currentBallRadius + 30;
        if (FLTR.ballOverlapsRectangle(
            FLTR.x, 
            FLTR.y, 
            expandedRadius, 
            x, 
            y, 
            width, 
            height)
        ) {
            return false;
        }

        return true;
    },

    generateFoodPosition: function (excludeTypes = []) {
        let validPosition = false;
        let attempts = 0;
        let x, y;

        while (!validPosition && attempts < 100) {
            x = Math.round((FLTR.CANVAS_WIDTH - FLTR.FOOD_WIDTH) * Math.random());
            y = Math.round(
                FLTR.HEADER_HEIGHT + (FLTR.CANVAS_HEIGHT - FLTR.HEADER_HEIGHT - FLTR.FOOD_HEIGHT) *
                Math.random()
            );

            validPosition = FLTR.isPositionValidForFood(
                x,
                y,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT,
                excludeTypes
            );
            attempts++;
        }

        return validPosition ? {
            x,
            y
        } : null;
    },

    generateObstacles: function () {
        FLTR.obstacles = [];
        const obstacleCount = FLTR.getObstacleCount(FLTR.level);

        if (FLTR.level >= 2) {
            FLTR.greenFoodCount = Math.floor(Math.random() * 3) + 1;
        } else {
            FLTR.greenFoodCount = 0;
        }

        for (let i = 0; i < obstacleCount; i++) {
            let validPosition = false;
            let attempts = 0;
            let obstacle;
            while (!validPosition && attempts < 100) {
                const isHorizontal = Math.random() < 0.5;
                const sizeMultiplier = 1 + Math.random() * (FLTR.OBSTACLE_MAX_MULTIPLIER - 1);
                const width = isHorizontal ?
                    FLTR.OBSTACLE_BASE_SIZE * sizeMultiplier : FLTR.OBSTACLE_BASE_SIZE;
                const height = isHorizontal ?
                    FLTR.OBSTACLE_BASE_SIZE : FLTR.OBSTACLE_BASE_SIZE * sizeMultiplier;
                const x = Math.round((FLTR.CANVAS_WIDTH - width) * Math.random());
                const y = Math.round(FLTR.HEADER_HEIGHT +
                    (FLTR.CANVAS_HEIGHT - FLTR.HEADER_HEIGHT - height) * Math.random()
                );

                obstacle = {
                    x,
                    y,
                    width,
                    height
                };

                validPosition = true;

                for (let j = 0; j < FLTR.obstacles.length; j++) {
                    const existing = FLTR.obstacles[j];

                    if (FLTR.rectanglesOverlap(
                            x,
                            y,
                            width,
                            height,
                            existing.x,
                            existing.y,
                            existing.width,
                            existing.height)) {
                        validPosition = false;
                        break;
                    }
                }
                if (validPosition &&
                    FLTR.ballOverlapsRectangle(
                        FLTR.x, FLTR.y, FLTR.BALL_RADIUS, x, y, width, height
                    )
                ) {
                    validPosition = false;
                }
                if (validPosition &&
                    FLTR.rectanglesOverlap(
                        FLTR.foodXPos,
                        FLTR.foodYPos,
                        FLTR.FOOD_WIDTH,
                        FLTR.FOOD_HEIGHT,
                        x,
                        y,
                        width,
                        height
                    )
                ) {
                    validPosition = false;
                }
                attempts++;
            }
            if (validPosition) {
                FLTR.obstacles.push(obstacle);
            }
        }

        FLTR.greenFoodItems = [];
        for (let i = 0; i < FLTR.greenFoodCount; i++) {
            FLTR.squares.greenFood();
        }

        FLTR.stickyMines = [];
        const stickyMineCount = FLTR.getStickyMineCount(FLTR.level);
        for (let i = 0; i < stickyMineCount; i++) {
            FLTR.squares.stickyMine();
        }
    },

    spawnTimedSpecialFoods: function () {
        if (FLTR.level >= 2) {
            FLTR.bonusSpawnTimer = setTimeout(function () {
                FLTR.bonusSpawnTimer = null;
                if (!FLTR.gameEnded && FLTR.level >= 2) {
                    FLTR.squares.bonus();
                }
            }, 5000);
        }

        if (FLTR.level % 2 === 0 && FLTR.level >= 2) {
            FLTR.forbiddenSpawnTimer = setTimeout(function () {
                FLTR.forbiddenSpawnTimer = null;
                if (!FLTR.gameEnded && FLTR.level % 2 === 0) {
                    FLTR.squares.forbidden();
                }
            }, 5000);
        }
    },

    windowXCollision: function () {
        if (!FLTR.canvas) return;
        if (FLTR.x + FLTR.xSpeed - FLTR.currentBallRadius <= 0 ||
            FLTR.x + FLTR.xSpeed + FLTR.currentBallRadius >= FLTR.canvas.width
        ) {
            FLTR.xSpeed = -FLTR.xSpeed;
            FLTR.playWallHit();
            if (FLTR.debug) console.log(FLTR.canvas.width + " Position: " + FLTR.x);
        }
    },

    windowYCollision: function () {
        if (!FLTR.canvas) return;
        if (FLTR.y + FLTR.ySpeed - FLTR.currentBallRadius < FLTR.HEADER_HEIGHT ||
            FLTR.y + FLTR.ySpeed + FLTR.currentBallRadius >= FLTR.canvas.height
        ) {
            FLTR.ySpeed = -FLTR.ySpeed;
            FLTR.playWallHit();
            if (FLTR.debug) console.log(FLTR.canvas.height + " Position: " + FLTR.y);
        }
    },

    obstacleCollision: function () {
        for (let i = 0; i < FLTR.obstacles.length; i++) {
            const obs = FLTR.obstacles[i];
            if (FLTR.ballOverlapsRectangle(
                    FLTR.x,
                    FLTR.y,
                    FLTR.currentBallRadius,
                    obs.x,
                    obs.y,
                    obs.width,
                    obs.height)) {
                FLTR.xSpeed = -FLTR.xSpeed * 0.8;
                FLTR.ySpeed = -FLTR.ySpeed * 0.8;
                FLTR.playSound('obstacleHit');
                const centerX = obs.x + obs.width / 2;
                const centerY = obs.y + obs.height / 2;
                const dx = FLTR.x - centerX;
                const dy = FLTR.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    FLTR.x += (dx / distance) * 2;
                    FLTR.y += (dy / distance) * 2;
                }

                if (FLTR.debug) console.log("Obstacle collision");

                break;
            }
        }
    },

    foodCollision: function () {
        if (FLTR.ballCollidesWithFood(
                FLTR.foodXPos,
                FLTR.foodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)) {
            if (FLTR.debug) console.log("Food collision");
            FLTR.score++;
            FLTR.levelScoreCount++;
            FLTR.playSound('eatRegular');
            FLTR.createScorePopup(
                FLTR.foodXPos + FLTR.FOOD_WIDTH / 2, FLTR.foodYPos, "+1"
            );
            FLTR.squares.random();

            // Spawn powerup in last 12 seconds of level 2+ (only once per level)
            if (FLTR.timeLeft <= 12 && !FLTR.powerupAlreadySpawned && FLTR.level >= 2) {
                FLTR.powerupAlreadySpawned = true;
                FLTR.squares.powerup();
            }
        }
    },

    bonusFoodCollision: function () {
        if (!FLTR.bonusFoodActive) return;

        if (FLTR.ballCollidesWithFood(
                FLTR.bonusFoodXPos,
                FLTR.bonusFoodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)) {
            if (FLTR.debug) console.log("Bonus food collision");
            FLTR.score += FLTR.BONUS_FOOD_POINTS;
            FLTR.levelScoreCount++;
            FLTR.playSound('eatPurple');
            FLTR.createScorePopup(
                FLTR.bonusFoodXPos + FLTR.FOOD_WIDTH / 2, FLTR.bonusFoodYPos, "+10"
            );
            FLTR.resetFoodPosition('bonus');
        }
    },

    powerupFoodCollision: function () {
        if (!FLTR.powerupFoodActive) return;
        if (FLTR.ballCollidesWithFood(
                FLTR.powerupFoodXPos,
                FLTR.powerupFoodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)) {
            if (FLTR.debug) console.log("Powerup food collision");

            FLTR.powerupActive = true;
            FLTR.playSound('eatOrange');
            FLTR.currentBallRadius = FLTR.BALL_RADIUS * FLTR.POWERUP_SIZE_MULTIPLIER;

            if (FLTR.y - FLTR.currentBallRadius < FLTR.HEADER_HEIGHT) {
                FLTR.y = FLTR.HEADER_HEIGHT + FLTR.currentBallRadius;
            }

            if (FLTR.y + FLTR.currentBallRadius > FLTR.CANVAS_HEIGHT) {
                FLTR.y = FLTR.CANVAS_HEIGHT - FLTR.currentBallRadius;
            }

            if (FLTR.x - FLTR.currentBallRadius < 0) {
                FLTR.x = FLTR.currentBallRadius;
            }

            if (FLTR.x + FLTR.currentBallRadius > FLTR.CANVAS_WIDTH) {
                FLTR.x = FLTR.CANVAS_WIDTH - FLTR.currentBallRadius;
            }

            FLTR.resetFoodPosition('powerup');
        }
    },

    greenFoodCollision: function () {
        for (let i = FLTR.greenFoodItems.length - 1; i >= 0; i--) {
            const greenFood = FLTR.greenFoodItems[i];
            if (FLTR.ballCollidesWithFood(
                    greenFood.x,
                    greenFood.y,
                    FLTR.FOOD_WIDTH,
                    FLTR.FOOD_HEIGHT)) {
                if (FLTR.debug) console.log("Green food collision");
                FLTR.score += FLTR.GREEN_FOOD_POINTS;
                FLTR.levelScoreCount++;
                FLTR.playSound('eatGreen');
                FLTR.createScorePopup(
                    greenFood.x + FLTR.FOOD_WIDTH / 2,
                    greenFood.y, "+" + FLTR.GREEN_FOOD_POINTS
                );
                FLTR.greenFoodItems.splice(i, 1);
            }
        }
    },

    forbiddenFoodCollision: function () {
        if (!FLTR.forbiddenFoodActive) return;
        if (FLTR.ballCollidesWithFood(
                FLTR.forbiddenFoodXPos,
                FLTR.forbiddenFoodYPos,
                FLTR.FOOD_WIDTH,
                FLTR.FOOD_HEIGHT)) {
            if (FLTR.debug) console.log("Forbidden food collision - Game Over!");
            FLTR.playSound('forbidden');
            FLTR.forbiddenFoodDeath = true;
            endGame();
        }
    },

    stickyMineCollision: function () {
        if (FLTR.stickyStuck) return;
        for (let i = FLTR.stickyMines.length - 1; i >= 0; i--) {
            const mine = FLTR.stickyMines[i];
            if (FLTR.ballCollidesWithFood(
                    mine.x,
                    mine.y,
                    FLTR.FOOD_WIDTH,
                    FLTR.FOOD_HEIGHT)) {
                if (FLTR.debug) console.log("Sticky mine collision - stuck for 5 seconds!");
                FLTR.xSpeed = 0;
                FLTR.ySpeed = 0;
                FLTR.stickyStuck = true;
                FLTR.playSound('stickyMine');
                FLTR.stickyStuckStart = Date.now();
                FLTR.stickyStuckRemaining = FLTR.STICKY_MINE_DURATION;
                FLTR.createScorePopup(mine.x + FLTR.FOOD_WIDTH / 2, mine.y, "Stuck!");
                FLTR.stickyMines.splice(i, 1);

                FLTR.stickyStuckTimer = setTimeout(function () {
                    FLTR.stickyStuck = false;
                    FLTR.stickyStuckTimer = null;
                    FLTR.stickyStuckRemaining = 0;
                }, FLTR.STICKY_MINE_DURATION);
                break;
            }
        }
    },

    resetFoodPosition: function (type) {
        switch (type) {
            case 'bonus':
                FLTR.bonusFoodActive = false;
                FLTR.bonusFoodXPos = -100;
                FLTR.bonusFoodYPos = -100;
                break;
            case 'powerup':
                FLTR.powerupFoodActive = false;
                FLTR.powerupFoodXPos = -100;
                FLTR.powerupFoodYPos = -100;
                break;
            case 'forbidden':
                FLTR.forbiddenFoodActive = false;
                FLTR.forbiddenFoodXPos = -100;
                FLTR.forbiddenFoodYPos = -100;
                break;
        }
    },

    clearSpawnTimers: function () {
        if (FLTR.bonusSpawnTimer) {
            clearTimeout(FLTR.bonusSpawnTimer);
            FLTR.bonusSpawnTimer = null;
        }
        if (FLTR.forbiddenSpawnTimer) {
            clearTimeout(FLTR.forbiddenSpawnTimer);
            FLTR.forbiddenSpawnTimer = null;
        }
    },

    resetAllSpecialFood: function () {
        FLTR.clearSpawnTimers();
        FLTR.resetFoodPosition('bonus');
        FLTR.resetFoodPosition('powerup');
        FLTR.resetFoodPosition('forbidden');
        FLTR.greenFoodItems = [];
        FLTR.stickyMines = [];
        FLTR.foodXPos = -100;
        FLTR.foodYPos = -100;
    },

    loadSounds: function () {
        for (const key of Object.keys(FLTR.sounds)) {
            const audio = FLTR.sounds[key];
            audio.pause();
            audio.src = '';
        }
        FLTR.sounds = {};

        const soundFiles = {
            eatRegular: 'assets/sfx/eat-regular-food.wav',
            eatGreen: 'assets/sfx/green-fruit.wav',
            eatPurple: 'assets/sfx/purple-fruit.wav',
            eatOrange: 'assets/sfx/orange-fruit.wav',
            forbidden: 'assets/sfx/forbidden-fruit.wav',
            obstacleHit: 'assets/sfx/obstacle-hit.wav',
            stickyMine: 'assets/sfx/sticky-mines.wav',
            wallHit: 'assets/sfx/wall-hit.wav',
        };

        for (const [key, src] of Object.entries(soundFiles)) {
            const audio = new Audio(src);
            audio.preload = 'auto';
            FLTR.sounds[key] = audio;
        }
    },

    playSound: function (key) {
        try {
            const sound = FLTR.sounds[key];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(function () {});
            }
        } catch (e) {}
    },

    playWallHit: function () {
        if (!FLTR.wallHitCooldown) {
            FLTR.playSound('wallHit');
            FLTR.wallHitCooldown = true;
            setTimeout(function () {
                FLTR.wallHitCooldown = false;
            }, 150);
        }
    },

    createScorePopup: function (x, y, text) {
        FLTR.scorePopups.push({
            x: x,
            y: y,
            text: text,
            life: FLTR.POPUP_DURATION,
            alpha: 1.0
        });
    },

    updateScorePopups: function () {
        for (let i = FLTR.scorePopups.length - 1; i >= 0; i--) {
            const popup = FLTR.scorePopups[i];
            popup.y -= FLTR.POPUP_RISE_SPEED;
            popup.life--;
            popup.alpha = popup.life / FLTR.POPUP_DURATION;

            if (popup.life <= 0) {
                FLTR.scorePopups.splice(i, 1);
            }
        }
    },

    drawScorePopups: function () {
        if (FLTR.ctx) {
            for (let i = 0; i < FLTR.scorePopups.length; i++) {
                const popup = FLTR.scorePopups[i];
                FLTR.ctx.save();
                FLTR.ctx.font = 'bold ' + FLTR.POPUP_FONT_SIZE + 'px ' + FLTR.TEXT_FONT;
                FLTR.ctx.fillStyle = FLTR.POPUP_COLOR;
                FLTR.ctx.globalAlpha = popup.alpha;
                FLTR.ctx.textAlign = 'center';
                FLTR.ctx.strokeStyle = 'black';
                FLTR.ctx.lineWidth = 3;
                FLTR.ctx.strokeText(popup.text, popup.x, popup.y);
                FLTR.ctx.fillText(popup.text, popup.x, popup.y);
                FLTR.ctx.restore();
            }
        }
    },

    levelCheck: function () {
        if (FLTR.timeLeft <= 0 && FLTR.level !== FLTR.TOTAL_LEVELS) {
            if (FLTR.levelScoreCount === 0) {
                endGame();
                return;
            }
            if (!FLTR.levelTransition) {
                FLTR.levelTransition = true;
                FLTR.gamePaused = true;
                cancelAnimationFrame(game);
                clearInterval(timer);
                timer = null;

                FLTR.obstacles = [];
                FLTR.resetAllSpecialFood();

                FLTR.draw();
            }
        } else if (FLTR.level == FLTR.TOTAL_LEVELS && FLTR.timeLeft <= 0) {
            endGame();
        }
        return;
    },

    continueToNextLevel: function () {
        if (FLTR.levelTransition) {
            const overlay = document.getElementById('levelTransitionOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }

            FLTR.levelTransition = false;
            FLTR.level = FLTR.level + 1;
            FLTR.timeLeft = FLTR.getLevelTime(FLTR.level);
            FLTR.levelScoreCount = 0;
            FLTR.powerupActive = false;
            FLTR.powerupAlreadySpawned = false;
            FLTR.currentBallRadius = FLTR.BALL_RADIUS;
            FLTR.stickyStuck = false;
            if (FLTR.stickyStuckTimer) {
                clearTimeout(FLTR.stickyStuckTimer);
                FLTR.stickyStuckTimer = null;
            }
            FLTR.trail = [];
            FLTR.scorePopups = [];
            FLTR.wallHitCooldown = false;
            FLTR.resetAllSpecialFood();
            FLTR.generateObstacles();
            FLTR.squares.random();

            FLTR.spawnTimedSpecialFoods();

            FLTR.gamePaused = false;
            game = requestAnimationFrame(FLTR.gameloop);

            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            timer = setInterval(updateTimer, FLTR.TIMER_INTERVAL);
        }
    },

    update: function () {
        try {
            if (FLTR.stickyStuck) {
                FLTR.updateScorePopups();
                FLTR.levelCheck();
                return;
            }
            FLTR.checkKeys.move();
            FLTR.xSpeed *= FLTR.DAMPING;
            FLTR.ySpeed *= FLTR.DAMPING;
            FLTR.windowXCollision();
            FLTR.windowYCollision();
            FLTR.obstacleCollision();
            FLTR.foodCollision();
            FLTR.bonusFoodCollision();
            FLTR.powerupFoodCollision();
            FLTR.greenFoodCollision();
            FLTR.forbiddenFoodCollision();
            FLTR.stickyMineCollision();
            FLTR.x += FLTR.xSpeed;
            FLTR.y += FLTR.ySpeed;
            FLTR.trail.push({
                x: FLTR.x,
                y: FLTR.y
            });
            if (FLTR.trail.length > FLTR.maxTrailLength) {
                FLTR.trail.shift();
            }
            FLTR.updateScorePopups();
            FLTR.levelCheck();
        } catch (error) {
            console.error('Update error:', error.message);
        }
    },

    draw: function () {
        try {
            FLTR.character.clear();
            FLTR.ctx.fillStyle = '#000000';
            FLTR.ctx.fillRect(0, 0, FLTR.CANVAS_WIDTH, 20);
            FLTR.obstacles.forEach(obs => {
                FLTR.squares.obstacle(obs.x, obs.y, obs.width, obs.height);
            });
            FLTR.character.trail();
            FLTR.character.circle(FLTR.x, FLTR.y, FLTR.currentBallRadius);
            FLTR.squares.food(FLTR.foodXPos, FLTR.foodYPos);
            if (FLTR.bonusFoodActive) {
                FLTR.squares.bonusFood(FLTR.bonusFoodXPos, FLTR.bonusFoodYPos);
            }

            if (FLTR.powerupFoodActive) {
                FLTR.squares.powerupFood(FLTR.powerupFoodXPos, FLTR.powerupFoodYPos);
            }

            FLTR.greenFoodItems.forEach(greenFood => {
                FLTR.squares.green(greenFood.x, greenFood.y);
            });

            FLTR.stickyMines.forEach(mine => {
                FLTR.squares.drawStickyMine(mine.x, mine.y);
            });

            if (FLTR.stickyStuck) {
                FLTR.text.centeredText(
                    'Stuck!', FLTR.x, FLTR.y - FLTR.currentBallRadius - 15, 16, '#FFD700'
                );
            }

            if (FLTR.forbiddenFoodActive) {
                FLTR.squares.forbiddenFood(FLTR.forbiddenFoodXPos, FLTR.forbiddenFoodYPos);
            }

            FLTR.drawScorePopups();

            FLTR.text.text('Score: ' + FLTR.score + '  Level: ' + FLTR.level, 5, 14, 14, 'white');
            FLTR.text.rightAlignedText(
                'Time: ' + FLTR.timeLeft + 's  High score: ' + FLTR.highScore, FLTR.CANVAS_WIDTH - 5, 14, 14, 'white'
            );

            if (FLTR.gamePaused && !FLTR.levelTransition && !FLTR.gameEnded) {
                const centerX = FLTR.CANVAS_WIDTH / 2;
                const centerY = FLTR.CANVAS_HEIGHT / 2;
                FLTR.text.centeredText('Paused', centerX, centerY, 24, FLTR.TEXT_COLOR);
            }

            if (FLTR.levelTransition) {
                const overlay = document.getElementById('levelTransitionOverlay');
                if (overlay) {
                    overlay.style.display = 'block';
                }
            }

            if (FLTR.gameEnded) {
                const overlay = document.getElementById('gameOverOverlay');
                const title = document.getElementById('gameOverTitle');
                const message = document.getElementById('gameOverMessage');

                if (overlay && title && message) {
                    if (FLTR.levelScoreCount === 0 && !FLTR.forbiddenFoodDeath) {
                        title.textContent = 'GAME OVER!';
                        title.style.color = '#ff00ff';
                        title.style.textShadow = '0 0 10px #ff00ff';
                        message.innerHTML = '<span style="color: #ff0000;">' +
                            'You failed to get any points this level and must start over!</span><br><br>Your final score was: ' +
                            '<span style="color: #ffff00; font-weight: bold;">' + FLTR.score + '</span>';
                    } else if (FLTR.forbiddenFoodDeath) {
                        title.textContent = 'You ate the forbidden fruit!';
                        title.style.color = '#ff0000';
                        title.style.textShadow = '0 0 10px #ff0000';
                        message.innerHTML = 'Your score was: <span style="color: #ffff00; font-weight: bold;">' + FLTR.score + '</span>';
                    } else {
                        title.textContent = 'GAME OVER!';
                        title.style.color = '#ff00ff';
                        title.style.textShadow = '0 0 10px #ff00ff';
                        message.innerHTML = 'Your score was: <span style="color: #ffff00; font-weight: bold;">' + FLTR.score + '</span>';
                    }

                    overlay.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Draw error:', error.message);
        }
    },

    gameloop: function (timestamp) {
        try {
            if (!FLTR.gamePaused && !FLTR.gameEnded) {
                FLTR.draw();
                FLTR.update();
                game = requestAnimationFrame(FLTR.gameloop);
            } else if (FLTR.gameEnded) {
                FLTR.draw();
            }
        } catch (error) {
            console.error('Gameloop error:', error.message);
            cancelAnimationFrame(game);
        }
    }
};

FLTR.character = {
    clear: function () {
        if (FLTR.ctx) {
            FLTR.ctx.clearRect(0, 0, FLTR.CANVAS_WIDTH, FLTR.CANVAS_HEIGHT);
        }
    },
    trail: function () {
        if (FLTR.ctx && FLTR.trail.length > 1) {
            for (let i = 0; i < FLTR.trail.length; i++) {
                const alpha = (i / FLTR.trail.length) * 0.5;
                const size = (i / FLTR.trail.length) * FLTR.currentBallRadius;
                FLTR.ctx.beginPath();
                FLTR.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                FLTR.ctx.arc(FLTR.trail[i].x, FLTR.trail[i].y, size, 0, Math.PI * 2, true);
                FLTR.ctx.closePath();
                FLTR.ctx.fill();
            }
        }
    },
    circle: function (x, y, r) {
        if (FLTR.ctx) {
            FLTR.ctx.beginPath();
            FLTR.ctx.fillStyle = FLTR.BALL_COLOR;
            FLTR.ctx.arc(x, y, r, 0, Math.PI * 2, true);
            FLTR.ctx.closePath();
            FLTR.ctx.fill();
        }
    }
};

FLTR.squares = {
    random: function () {
        const pos = FLTR.generateFoodPosition(['regular']);
        if (pos) {
            FLTR.foodXPos = pos.x;
            FLTR.foodYPos = pos.y;
        }
    },

    bonus: function () {
        const pos = FLTR.generateFoodPosition(['bonus']);
        if (pos) {
            FLTR.bonusFoodXPos = pos.x;
            FLTR.bonusFoodYPos = pos.y;
            FLTR.bonusFoodActive = true;
        }
    },

    powerup: function () {
        const pos = FLTR.generateFoodPosition(['powerup']);
        if (pos) {
            FLTR.powerupFoodXPos = pos.x;
            FLTR.powerupFoodYPos = pos.y;
            FLTR.powerupFoodActive = true;
        }
    },

    greenFood: function () {
        const pos = FLTR.generateFoodPosition(['green']);
        if (pos) {
            FLTR.greenFoodItems.push({
                x: pos.x,
                y: pos.y
            });
        }
    },

    forbidden: function () {
        const pos = FLTR.generateFoodPosition(['forbidden']);
        if (pos) {
            FLTR.forbiddenFoodXPos = pos.x;
            FLTR.forbiddenFoodYPos = pos.y;
            FLTR.forbiddenFoodActive = true;
        }
    },

    drawFood: function (x, y, fillColor) {
        if (FLTR.ctx) {
            FLTR.ctx.fillStyle = fillColor;
            FLTR.ctx.fillRect(x, y, FLTR.FOOD_WIDTH, FLTR.FOOD_HEIGHT);
            FLTR.ctx.strokeStyle = FLTR.FOOD_STROKE_COLOR;
            FLTR.ctx.strokeRect(x, y, FLTR.FOOD_WIDTH, FLTR.FOOD_HEIGHT);
        }
    },

    forbiddenFood: function (x, y) {
        this.drawFood(x, y, FLTR.FORBIDDEN_FOOD_COLOR);
    },

    green: function (x, y) {
        this.drawFood(x, y, FLTR.GREEN_FOOD_COLOR);
    },

    food: function (x, y) {
        this.drawFood(x, y, FLTR.FOOD_COLOR);
    },

    bonusFood: function (x, y) {
        this.drawFood(x, y, FLTR.BONUS_FOOD_COLOR);
    },

    powerupFood: function (x, y) {
        this.drawFood(x, y, FLTR.POWERUP_FOOD_COLOR);
    },

    obstacle: function (x, y, width, height) {
        if (FLTR.ctx) {
            FLTR.ctx.fillStyle = FLTR.OBSTACLE_COLOR;
            FLTR.ctx.fillRect(x, y, width, height);
            FLTR.ctx.strokeStyle = FLTR.OBSTACLE_STROKE_COLOR;
            FLTR.ctx.lineWidth = FLTR.OBSTACLE_STROKE_WIDTH;
            FLTR.ctx.strokeRect(x, y, width, height);
            FLTR.ctx.lineWidth = 1;
        }
    },

    stickyMine: function () {
        const pos = FLTR.generateFoodPosition([]);
        if (pos) {
            FLTR.stickyMines.push({
                x: pos.x,
                y: pos.y
            });
        }
    },

    drawStickyMine: function (x, y) {
        if (FLTR.ctx) {
            const cx = x + FLTR.FOOD_WIDTH / 2;
            const topY = y;
            const bottomY = y + FLTR.FOOD_HEIGHT;
            const leftX = x;
            const rightX = x + FLTR.FOOD_WIDTH;

            FLTR.ctx.beginPath();
            FLTR.ctx.moveTo(cx, topY);
            FLTR.ctx.lineTo(rightX, bottomY);
            FLTR.ctx.lineTo(leftX, bottomY);
            FLTR.ctx.closePath();
            FLTR.ctx.fillStyle = FLTR.STICKY_MINE_COLOR;
            FLTR.ctx.fill();
            FLTR.ctx.strokeStyle = FLTR.STICKY_MINE_STROKE_COLOR;
            FLTR.ctx.lineWidth = 2;
            FLTR.ctx.stroke();
            FLTR.ctx.lineWidth = 1;
        }
    }
};

FLTR.text = {
    text: function (string, x, y, size, col) {
        if (FLTR.ctx) {
            FLTR.ctx.font = 'bold ' + size + 'px ' + FLTR.TEXT_FONT;
            FLTR.ctx.fillStyle = col;
            FLTR.ctx.fillText(string, x, y);
        }
    },
    rightAlignedText: function (string, x, y, size, col) {
        if (FLTR.ctx) {
            FLTR.ctx.font = 'bold ' + size + 'px ' + FLTR.TEXT_FONT;
            FLTR.ctx.fillStyle = col;
            FLTR.ctx.textAlign = 'right';
            FLTR.ctx.fillText(string, x, y);
            FLTR.ctx.textAlign = 'left';
        }
    },
    centeredText: function (string, x, y, size, col) {
        if (FLTR.ctx) {
            FLTR.ctx.font = 'bold ' + size + 'px ' + FLTR.TEXT_FONT;
            FLTR.ctx.fillStyle = col;
            FLTR.ctx.textAlign = 'center';
            FLTR.ctx.textBaseline = 'middle';
            FLTR.ctx.shadowColor = 'black';
            FLTR.ctx.shadowBlur = 4;
            FLTR.ctx.shadowOffsetX = 2;
            FLTR.ctx.shadowOffsetY = 2;
            FLTR.ctx.fillText(string, x, y);
            FLTR.ctx.shadowColor = 'transparent';
            FLTR.ctx.shadowBlur = 0;
            FLTR.ctx.shadowOffsetX = 0;
            FLTR.ctx.shadowOffsetY = 0;
            FLTR.ctx.textAlign = 'left';
            FLTR.ctx.textBaseline = 'alphabetic';
        }
    }
};

FLTR.checkKeys = {
    move: function () {
        if (FLTR.space) {
            FLTR.ySpeed = 0;
            FLTR.xSpeed = 0;
        }
        if (FLTR.left) {
            FLTR.xSpeed -= FLTR.SPEED_INCREMENT;
        }
        if (FLTR.right) {
            FLTR.xSpeed += FLTR.SPEED_INCREMENT;
        }
        if (FLTR.up) {
            FLTR.ySpeed -= FLTR.SPEED_INCREMENT;
        }
        if (FLTR.down) {
            FLTR.ySpeed += FLTR.SPEED_INCREMENT;
        }
        FLTR.xSpeed = Math.max(-FLTR.MAX_SPEED, Math.min(FLTR.MAX_SPEED, FLTR.xSpeed));
        FLTR.ySpeed = Math.max(-FLTR.MAX_SPEED, Math.min(FLTR.MAX_SPEED, FLTR.ySpeed));
    }
};

window.onkeydown = function (event) {
    const keyPressed = event.key;
    switch (keyPressed) {
        case FLTR.KEY_SPACE:
            if (FLTR.levelTransition) {
                FLTR.continueToNextLevel();
            }
            break;
        case FLTR.KEY_ESCAPE:
            if (!FLTR.levelTransition && !FLTR.gameEnded && timer) {
                showExitConfirmation();
            }
            break;
        case 'p':
        case 'P':
            if (!FLTR.levelTransition && !FLTR.gameEnded) {
                pauseGame();
            }
            break;
        case FLTR.KEY_SHIFT:
            FLTR.space = true;
            break;
        case FLTR.KEY_LEFT:
            FLTR.left = true;
            break;
        case FLTR.KEY_UP:
            FLTR.up = true;
            break;
        case FLTR.KEY_RIGHT:
            FLTR.right = true;
            break;
        case FLTR.KEY_DOWN:
            FLTR.down = true;
            break;
    }
}

window.onkeyup = function (event) {
    const keyPressed = event.key;

    switch (keyPressed) {
        case FLTR.KEY_SHIFT:
            FLTR.space = false;
            break;
        case FLTR.KEY_LEFT:
            FLTR.left = false;
            break;
        case FLTR.KEY_UP:
            FLTR.up = false;
            break;
        case FLTR.KEY_RIGHT:
            FLTR.right = false;
            break;
        case FLTR.KEY_DOWN:
            FLTR.down = false;
            break;
    }
}

showHideButton = function (id, displayType = "none") {
    try {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = displayType;
        } else {
            console.warn('Element with id "' + id + '" not found');
        }
    } catch (error) {
        console.error('showHideButton error:', error.message);
    }
}

updateTimer = function () {
    try {
        FLTR.timeLeft = FLTR.timeLeft - 1;
        return FLTR.timeLeft;
    } catch (error) {
        console.error('updateTimer error:', error.message);
        return 0;
    }
}

pauseGameEngine = function () {
    try {
        if (!FLTR.gamePaused) {
            cancelAnimationFrame(game);
            clearInterval(timer);
            timer = null;
            FLTR.gamePaused = true;
            FLTR.scorePopups = [];

            if (FLTR.stickyStuck && FLTR.stickyStuckTimer) {
                clearTimeout(FLTR.stickyStuckTimer);
                FLTR.stickyStuckTimer = null;
                FLTR.stickyStuckRemaining -= (Date.now() - FLTR.stickyStuckStart);
                if (FLTR.stickyStuckRemaining < 0) FLTR.stickyStuckRemaining = 0;
            }
        }
    } catch (error) {
        console.error('pauseGameEngine error:', error.message);
    }
}

resumeGameEngine = function () {
    try {
        if (FLTR.gamePaused) {
            game = requestAnimationFrame(FLTR.gameloop);
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            timer = setInterval(updateTimer, FLTR.TIMER_INTERVAL);
            FLTR.gamePaused = false;

            if (FLTR.stickyStuck && FLTR.stickyStuckRemaining > 0) {
                FLTR.stickyStuckStart = Date.now();
                FLTR.stickyStuckTimer = setTimeout(function () {
                    FLTR.stickyStuck = false;
                    FLTR.stickyStuckTimer = null;
                    FLTR.stickyStuckRemaining = 0;
                }, FLTR.stickyStuckRemaining);
            } else if (FLTR.stickyStuck) {
                FLTR.stickyStuck = false;
                FLTR.stickyStuckRemaining = 0;
            }
        }
    } catch (error) {
        console.error('resumeGameEngine error:', error.message);
    }
}

saveHighScoreIfNeeded = function () {
    try {
        if (FLTR.score > FLTR.highScore) {
            FLTR.highScore = FLTR.score;
            localStorage.setItem('floaterball_highscore', FLTR.highScore.toString());
        }
    } catch (error) {
        console.error('saveHighScoreIfNeeded error:', error.message);
    }
}

resetGameState = function () {
    try {
        FLTR.level = FLTR.INITIAL_LEVEL;
        FLTR.score = 0;
        FLTR.timeLeft = FLTR.getLevelTime(FLTR.INITIAL_LEVEL);
        FLTR.gameEnded = false;
        FLTR.levelTransition = false;
        FLTR.levelScoreCount = 0;
        FLTR.xSpeed = 0;
        FLTR.ySpeed = 0;
        FLTR.x = 300;
        FLTR.y = 300;
        FLTR.forbiddenFoodDeath = false;
        FLTR.gamePaused = false;
        FLTR.powerupActive = false;
        FLTR.powerupAlreadySpawned = false;
        FLTR.currentBallRadius = FLTR.BALL_RADIUS;
        FLTR.stickyStuck = false;
        if (FLTR.stickyStuckTimer) {
            clearTimeout(FLTR.stickyStuckTimer);
            FLTR.stickyStuckTimer = null;
        }
        FLTR.stickyStuckStart = 0;
        FLTR.stickyStuckRemaining = 0;
        FLTR.trail = [];
        FLTR.scorePopups = [];
        FLTR.wallHitCooldown = false;
        FLTR.left = false;
        FLTR.right = false;
        FLTR.up = false;
        FLTR.down = false;
        FLTR.space = false;
        FLTR.resetAllSpecialFood();
    } catch (error) {
        console.error('resetGameState error:', error.message);
    }
}

pauseGame = function () {
    try {
        if (!FLTR.gamePaused) {
            pauseGameEngine();
            FLTR.draw();
        } else if (FLTR.gamePaused) {
            resumeGameEngine();
        }
    } catch (error) {
        console.error('pauseGame error:', error.message);
    }
}

endGame = function () {
    try {
        cancelAnimationFrame(game);
        clearInterval(timer);
        timer = null;
        FLTR.gameEnded = true;
        FLTR.stickyStuck = false;
        if (FLTR.stickyStuckTimer) {
            clearTimeout(FLTR.stickyStuckTimer);
            FLTR.stickyStuckTimer = null;
        }
        FLTR.clearSpawnTimers();
        saveHighScoreIfNeeded();
    } catch (error) {
        console.error('endGame error:', error.message);
    }
}

resetGame = function () {
    try {
        const overlay = document.getElementById('gameOverOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        resetGameState();
        startGame();
    } catch (error) {
        console.error('resetGame error:', error.message);
    }
}

showExitConfirmation = function () {
    try {
        pauseGameEngine();

        const overlay = document.getElementById('exitConfirmOverlay');
        if (overlay) {
            overlay.style.display = 'block';
        }
    } catch (error) {
        console.error('showExitConfirmation error:', error.message);
    }
}

exitToMainMenu = function () {
    try {
        cancelAnimationFrame(game);
        clearInterval(timer);
        timer = null;
        FLTR.gameEnded = true;

        saveHighScoreIfNeeded();
        resetGameState();

        const startOverlay = document.getElementById('startOverlay');
        if (startOverlay) {
            startOverlay.style.display = 'block';
        }

        if (FLTR.ctx) {
            FLTR.ctx.clearRect(0, 0, FLTR.CANVAS_WIDTH, FLTR.CANVAS_HEIGHT);
        }
    } catch (error) {
        console.error('exitToMainMenu error:', error.message);
    }
}

resumeFromExit = function () {
    try {
        resumeGameEngine();
    } catch (error) {
        console.error('resumeFromExit error:', error.message);
    }
}

startGame = function () {
    try {
        if (!FLTR.canvas) {
            FLTR.init();
        }

        FLTR.generateObstacles();
        FLTR.squares.random();

        FLTR.spawnTimedSpecialFoods();

        game = requestAnimationFrame(FLTR.gameloop);

        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        timer = setInterval(updateTimer, FLTR.TIMER_INTERVAL);
    } catch (error) {
        console.error('startGame error:', error.message);
    }
}

let eventListenersAdded = false;

function addGameEventListeners() {
    if (eventListenersAdded) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    eventListenersAdded = true;
}

function handleVisibilityChange() {
    if (document.hidden) {
        if (!FLTR.gamePaused && !FLTR.gameEnded && !FLTR.levelTransition && timer) {
            pauseGame();
        }
    }
}

function handleWindowBlur() {
    if (!FLTR.gamePaused && !FLTR.gameEnded && !FLTR.levelTransition && timer) {
        pauseGame();
    }
}

addGameEventListeners();