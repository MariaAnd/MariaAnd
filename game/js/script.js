(function ($) {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var score, stop, ticker;
    var ground = [], water = [], enemies = [], environment = [];
    var platformHeight, platformLength, gapLength;
    var platformWidth = 32;
    var platformBase = canvas.height - platformWidth;  // bottom row of the game
    var platformSpacer = 64;
    var playSound;

    /**
     * Gets a random number between range
     *
     * @param {number} low
     * @param {number} high
     * @returns {number}
     */
    function rand(low, high) {
        return Math.floor( Math.random() * (high - low + 1) + low );
    }

    /**
     * Bounds a number between range
     *
     * @param {number} num
     * @param {number} low
     * @param {number} high
     * @returns {number}
     */
    function bound(num, low, high) {
        return Math.max( Math.min(num, high), low);
    }

    /**
     * Loads all assets
     */
    var assetLoader = (function() {
        // images list
        this.imgs        = {
            'bg'            : 'imgs/bg.png',
            'sky'           : 'imgs/sky.png',
            'backdrop'      : 'imgs/backdrop.png',
            'backdrop2'     : 'imgs/backdrop_ground.png',
            'brick'         : 'imgs/brick.png',
            'avatar_normal' : 'imgs/normal_walk.png',
            'water'         : 'imgs/water.png',
            'brick1'        : 'imgs/brickMid1.png',
            'brick2'        : 'imgs/brickMid2.png',
            'bones'         : 'imgs/bones.png',
            'plant'         : 'imgs/plant.png',
            'bush1'         : 'imgs/bush1.png',
            'bush2'         : 'imgs/bush2.png',
            'cliff'         : 'imgs/brickCliffRight.png',
            'fire'          : 'imgs/fire.png',
            'skull'         : 'imgs/skull.png',
            'bigfire'       : 'imgs/bigfire.png'
        };

        // sounds list
        this.sounds      = {
            'bg'            : 'sounds/bg.mp3',
            'jump'          : 'sounds/jump.mp3',
            'gameOver'      : 'sounds/gameOver.mp3'
        };

        var assetsLoaded = 0;
        var numImgs = Object.keys(this.imgs).length;
        var numSounds = Object.keys(this.sounds).length;
        this.totalAssest = numImgs+numSounds;

        /**
         * Ensures all assets are loaded before using them
         *
         * @param {number} list - List name ('imgs', 'sounds')
         * @param {number} name - Asset name in the list
         */
        function assetLoaded(list, name) {
            if (this[list][name].status !== 'loading') {
                return;
            }

            this[list][name].status = 'loaded';
            assetsLoaded++;

            if (typeof this.progress === 'function') {
                this.progress(assetsLoaded, this.totalAssest);
            }

            if (assetsLoaded === this.totalAssest && typeof this.finished === 'function') {
                this.finished();
            }
        }

        /**
         * Checks the ready state of an Audio file.
         * @param {string} sound - Name of the audio asset that was loaded.
         */
        function checkAudioState(sound) {
            if (this.sounds[sound].status === 'loading' && this.sounds[sound].readyState === 4) {
                assetLoaded.call(this, 'sounds', sound);
            }
        }

        /**
         * Creates assets, sets callback for asset loading, sets asset source
         */
        this.downloadAll = function() {
            var that = this;
            var src;

            for (var img in this.imgs) {
                if (this.imgs.hasOwnProperty(img)) {
                    src = this.imgs[img];

                    (function(that, img) {
                        that.imgs[img] = new Image();
                        that.imgs[img].status = 'loading';
                        that.imgs[img].name = img;
                        that.imgs[img].onload = function() { assetLoaded.call(that, 'imgs', img) };
                        that.imgs[img].src = src;
                    })(that, img);
                }
            }

            for (var sound in this.sounds) {
                if (this.sounds.hasOwnProperty(sound)) {
                    src = this.sounds[sound];

                    (function(that, sound) {
                        that.sounds[sound] = new Audio();
                        that.sounds[sound].status = 'loading';
                        that.sounds[sound].name = sound;
                        that.sounds[sound].addEventListener('canplay', function() {
                            checkAudioState.call(that, sound);
                        });
                        that.sounds[sound].src = src;
                        that.sounds[sound].preload = 'auto';
                        that.sounds[sound].load();
                    })(that, sound);
                }
            }
        };

        return {
            imgs: this.imgs,
            sounds: this.sounds,
            totalAssest: this.totalAssest,
            downloadAll: this.downloadAll
        };
    })();

    /**
     * Show asset loading progress
     * @param {number} progress - Number of assets loaded
     * @param {number} total - Total number of assets
     */
    assetLoader.progress = function(progress, total) {
        var pBar = document.getElementById('progress-bar');
        pBar.value = progress / total;
        document.getElementById('p').innerHTML = Math.round(pBar.value * 100) + "%";
    };

    /**
     * Load the main menu
     */
    assetLoader.finished = function() {
        mainMenu();
    };


    /**
     * Create a Spritesheet
     * @param {string} path - Path to the image.
     * @param {number} frameWidth - Width (in px) of each frame.
     * @param {number} frameHeight - Height (in px) of each frame.
     */
    function SpriteSheet(path, frameWidth, frameHeight) {
        this.image = new Image();
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;

        // calculate the number of frames in a row after the image loads
        var self = this;
        this.image.onload = function() {
            self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
        };

        this.image.src = path;
    }

    /**
     *
     * @param {object} spritesheet - The spritesheet used to create the animation.
     * @param {number} frameSpeed - Number of frames to wait for before animation.
     * @param {number} startFrame - First frame in animation sequence.
     * @param {number} endFrame - Last frame in animation sequence.
     * @constructor
     */
    function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

        var animationSequence = [];
        var currentFrame = 0;
        var counter = 0;

        for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
            animationSequence.push(frameNumber);

        /**
         * Update the animation
         */
        this.update = function() {

            if (counter === (frameSpeed - 1))
                currentFrame = (currentFrame + 1) % animationSequence.length;

            counter = (counter + 1) % frameSpeed;
        };

        /**
         * Draw the current frame
         * @param {number} x - X position to draw
         * @param {number} y - Y position to draw
         */
        this.draw = function(x, y) {
            // gets the column of the frame
            var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

            ctx.drawImage(
                spritesheet.image,
                col * spritesheet.frameWidth, 0,
                spritesheet.frameWidth, spritesheet.frameHeight,
                x, y,
                spritesheet.frameWidth, spritesheet.frameHeight);
        };
    }

    /**
     * Creates a background
     */
    var background = (function() {
        var sky = {};
        var backdrop = {};
        var backdrop2 = {};

        /**
         * Draws the backgrounds with different speeds
         */
        this.draw = function() {
            ctx.drawImage(assetLoader.imgs.bg, 0, 0);

            sky.x -= sky.speed;
            backdrop.x -= backdrop.speed;
            backdrop2.x -= backdrop2.speed;

            ctx.drawImage(assetLoader.imgs.sky, sky.x, sky.y);
            ctx.drawImage(assetLoader.imgs.sky, sky.x + canvas.width, sky.y);

            ctx.drawImage(assetLoader.imgs.backdrop, backdrop.x, backdrop.y);
            ctx.drawImage(assetLoader.imgs.backdrop, backdrop.x + canvas.width, backdrop.y);

            ctx.drawImage(assetLoader.imgs.backdrop2, backdrop2.x, backdrop2.y);
            ctx.drawImage(assetLoader.imgs.backdrop2, backdrop2.x + canvas.width, backdrop2.y);

            // If the image scrolled off the screen, reset
            if (sky.x + assetLoader.imgs.sky.width <= 0)
                sky.x = 0;
            if (backdrop.x + assetLoader.imgs.backdrop.width <= 0)
                backdrop.x = 0;
            if (backdrop2.x + assetLoader.imgs.backdrop2.width <= 0)
                backdrop2.x = 0;
        };

        /**
         * Reset background to zero
         */
        this.reset = function()  {
            sky.x = 0;
            sky.y = 0;
            sky.speed = 0.2;

            backdrop.x = 0;
            backdrop.y = 0;
            backdrop.speed = 0.4;

            backdrop2.x = 0;
            backdrop2.y = 0;
            backdrop2.speed = 0.6;
        };

        return {
            draw: this.draw,
            reset: this.reset
        };
    })();

    /**
     * A vector for 2d space.
     * @param {number} x - Center x coordinate.
     * @param {number} y - Center y coordinate.
     * @param {number} dx - Change in x.
     * @param {number} dy - Change in y.
     */
    function Vector(x, y, dx, dy) {
        // position
        this.x = x || 0;
        this.y = y || 0;
        // direction
        this.dx = dx || 0;
        this.dy = dy || 0;
    }

    /**
     * Advance the vectors position by dx,dy
     */
    Vector.prototype.advance = function() {
        this.x += this.dx;
        this.y += this.dy;
    };

    /**
     * Gets the minimum distance between two vectors
     * @param {object} vec - Vector
     * @returns {number}
     */
    Vector.prototype.minDist = function(vec) {
        var minDist = Infinity;
        var max = Math.max( Math.abs(this.dx), Math.abs(this.dy),
            Math.abs(vec.dx ), Math.abs(vec.dy ) );
        var slice = 1 / max;
        var x, y, distSquared;

        // get the middle of each vector
        var vec1 = {}, vec2 = {};
        vec1.x = this.x + this.width/2;
        vec1.y = this.y + this.height/2;
        vec2.x = vec.x + vec.width/2;
        vec2.y = vec.y + vec.height/2;
        for (var percent = 0; percent < 1; percent += slice) {
            x = (vec1.x + this.dx * percent) - (vec2.x + vec.dx * percent);
            y = (vec1.y + this.dy * percent) - (vec2.y + vec.dy * percent);
            distSquared = x * x + y * y;
            minDist = Math.min(minDist, distSquared);
        }

        return Math.sqrt(minDist);
    };

    /**
     * The player
     */
    var player = (function(player) {
        player.width = 90;
        player.height = 100;
        player.speed = 6;
        // jumping
        player.gravity = 1;
        player.dy = 0;
        player.jumpDy = -10;
        player.isFalling = false;
        player.isJumping = false;
        // spritesheets
        player.sheet = new SpriteSheet('imgs/normal_walk.png', player.width, player.height);
        player.walkAnim = new Animation(player.sheet, 4, 0, 9);
        player.jumpAnim = new Animation(player.sheet, 4, 8, 8);
        player.fallAnim = new Animation(player.sheet, 4, 8, 8);
        player.anim = player.walkAnim;

        Vector.call(player, 0, 0, 0, player.dy);

        var jumpCounter = 0;  // how long the jump button can be pressed down

        /**
         * Update the player's position and animation
         */
        player.update = function() {
            // jumps if not currently jumping or falling
            if (KEY_STATUS.space && player.dy === 0 && !player.isJumping) {
                player.isJumping = true;
                player.dy = player.jumpDy;
                jumpCounter = 12;
                assetLoader.sounds.jump.play();
            }

            // jumps higher if the space bar is continually pressed
            if (KEY_STATUS.space && jumpCounter) {
                player.dy = player.jumpDy;
            }

            jumpCounter = Math.max(jumpCounter-1, 0);

            this.advance();

            // adds gravity
            if (player.isFalling || player.isJumping) {
                player.dy += player.gravity;
            }

            // changes animation if falling
            if (player.dy > 0) {
                player.anim = player.fallAnim;
            }
            // changes animation is jumping
            else if (player.dy < 0) {
                player.anim = player.jumpAnim;
            }
            else {
                player.anim = player.walkAnim;
            }

            player.anim.update();
        };

        /**
         * Draws the player in it's current position
         */
        player.draw = function() {
            player.anim.draw(player.x, player.y);
        };

        /**
         * Resets the player's position
         */
        player.reset = function() {
            player.x = 64;
            player.y = 250;
            player.speed = 6;
        };

        return player;
    })(Object.create(Vector.prototype));

    /**
     * Sprites are anything drawn to the screen (ground, enemies, etc.)
     * @param {number} x - Starting x position of the player
     * @param {number} y - Starting y position of the player
     * @param {string} type - Type of sprite
     */
    function Sprite(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = platformWidth;
        this.height = platformWidth;
        this.type = type;
        Vector.call(this, x, y, 0, 0);

        /**
         * Updates the Sprite's position by the player's speed
         */
        this.update = function() {
            this.dx = -player.speed;
            this.advance();
        };

        /**
         * Draws the sprite at it's current position
         */
        this.draw = function() {
            ctx.save();
            ctx.translate(0.5,0.5);
            ctx.drawImage(assetLoader.imgs[this.type], this.x, this.y);
            ctx.restore();
        };
    }
    Sprite.prototype = Object.create(Vector.prototype);

    /**
     * Gets the type of a platform based on platform height
     * @returns {string}
     */
    function getType() {
        var type;
        switch (platformHeight) {
            case 0:
            case 1:
                type = Math.random() > 0.5 ? 'brick1' : 'brick2';
                break;
            case 2:
                type = 'brick';
                break;
            case 3:
                type = 'bones';
                break;
            case 4:
                type = 'skull';
                break;
        }
        if (platformLength === 1 && platformHeight < 3 && rand(0, 3) === 0) {
            type = 'cliff';
        }

        return type;
    }

    /**
     * Updates all ground position and draw
     */
    function updateGround() {
        // animate ground
        player.isFalling = true;
        for (var i = 0; i < ground.length; i++) {
            ground[i].update();
            ground[i].draw();

            // stop the player from falling when landing on a platform
            var angle;
            if (player.minDist(ground[i]) <= player.height/2 + platformWidth/2 &&
                (angle = Math.atan2(player.y - ground[i].y, player.x - ground[i].x) * 180/Math.PI) > -130 &&
                angle < -50) {
                player.isJumping = false;
                player.isFalling = false;
                player.y = ground[i].y - player.height + 5;
                player.dy = 0;
            }
        }

        // remove ground that have gone off the screen
        if (ground[0] && ground[0].x < -platformWidth) {
            ground.splice(0, 1);
        }
    }

    /**
     * Updates water position.
     */
    function updateWater() {
        // animate water
        for (var i = 0; i < water.length; i++) {
            water[i].update();
            water[i].draw();
        }

        // remove water that has gone off the screen
        if (water[0] && water[0].x < -platformWidth) {
            var w = water.splice(0, 1)[0];
            w.x = water[water.length-1].x + platformWidth;
            water.push(w);
        }
    }

    /**
     * Update all environment position
     */
    function updateEnvironment() {
        // animate environment
        for (var i = 0; i < environment.length; i++) {
            environment[i].update();
            environment[i].draw();
        }

        // remove environment that have gone off the screen
        if (environment[0] && environment[0].x < -platformWidth) {
            environment.splice(0, 1);
        }
    }

    /**
     * Update all enemies position.
     */
    function updateEnemies() {
        // animate enemies
        for (var i = 0; i < enemies.length; i++) {
            enemies[i].update();
            enemies[i].draw();

            // player meets enemy
            if (player.minDist(enemies[i]) <= player.width*0.6 - platformWidth/2) {
                gameOver();
            }
        }

        // remove enemies that have gone off the screen
        if (enemies[0] && enemies[0].x < -platformWidth) {
            enemies.splice(0, 1);
        }
    }

    /**
     * Update the players position and draw
     */
    function updatePlayer() {
        player.update();
        player.draw();

        // game over
        if (player.y + player.height >= canvas.height) {
            gameOver();
        }
    }

    /**
     * Spawn new sprites off screen
     */
    function spawnSprites() {
        score++;

        // first creates a gap
        if (gapLength > 0) {
            gapLength--;
        }
        // then creates ground
        else if (platformLength > 0) {
            var type = getType();

            ground.push(new Sprite(
                canvas.width + platformWidth % player.speed,
                platformBase - platformHeight * platformSpacer,
                type
            ));
            platformLength--;

            // adds random environment sprites
            spawnEnvironmentSprites();

            // adds random enemies
            spawnEnemySprites();
        }
        // starts over
        else {
            gapLength = rand(player.speed - 2, player.speed);
            platformHeight = bound(rand(0, platformHeight + rand(0, 2)), 0, 4);
            platformLength = rand(Math.floor(player.speed/2), player.speed * 4);
        }
    }

    /**
     * Spawns new environment sprites
     */
    function spawnEnvironmentSprites() {
        if (score > 40 && rand(0, 20) === 0 && platformHeight < 3) {
            if (Math.random() > 0.5) {
                environment.push(new Sprite(
                    canvas.width + platformWidth % player.speed,
                    platformBase - platformHeight * platformSpacer - platformWidth,
                    'plant'
                ));
            }
            else if (platformLength > 2) {
                environment.push(new Sprite(
                    canvas.width + platformWidth % player.speed,
                    platformBase - platformHeight * platformSpacer - platformWidth,
                    'bush1'
                ));
                environment.push(new Sprite(
                    canvas.width + platformWidth % player.speed + platformWidth,
                    platformBase - platformHeight * platformSpacer - platformWidth,
                    'bush2'
                ));
            }
        }
    }

    /**
     * Spawns new enemy sprites
     */
    function spawnEnemySprites() {
        if (score > 100 && Math.random() > 0.96 && enemies.length < 3 && platformLength > 5 &&
            (enemies.length ? canvas.width - enemies[enemies.length-1].x >= platformWidth * 3 ||
                canvas.width - enemies[enemies.length-1].x < platformWidth : true)) {
            enemies.push(new Sprite(
                canvas.width + platformWidth % player.speed,
                platformBase - platformHeight * platformSpacer - platformWidth,
                Math.random() > 0.5 ? 'fire' : 'bigfire'
            ));
        }
    }

    /**
     * Game loop
     */
    function animate() {
        if (!stop) {
            requestAnimFrame( animate );
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            background.draw();

            updateWater();
            updateEnvironment();
            updatePlayer();
            updateGround();
            updateEnemies();

            // draws the score
            ctx.fillText('Score: ' + score + 'm', canvas.width - 140, 30);

            // spawns a new Sprite
            if (ticker % Math.floor(platformWidth / player.speed) === 0) {
                spawnSprites();
            }

            // increases player speed only when player is jumping
            if (ticker > (Math.floor(platformWidth / player.speed) * player.speed * 20) && player.dy !== 0) {
                player.speed = bound(++player.speed, 0, 15);
                player.walkAnim.frameSpeed = Math.floor(platformWidth / player.speed) - 1;

                // reset ticker
                ticker = 0;

                // spawn a platform to fill in gap created by increasing player speed
                if (gapLength === 0) {
                    var type = getType();
                    ground.push(new Sprite(
                        canvas.width + platformWidth % player.speed,
                        platformBase - platformHeight * platformSpacer,
                        type
                    ));
                    platformLength--;
                }
            }

            ticker++;
        }
    }

    /**
     * Keep track of the spacebar events
     */
    var KEY_CODES = {
        32: 'space'
    };
    var KEY_STATUS = {};
    for (var code in KEY_CODES) {
        if (KEY_CODES.hasOwnProperty(code)) {
            KEY_STATUS[KEY_CODES[code]] = false;
        }
    }
    document.onkeydown = function(e) {
        var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
        if (KEY_CODES[keyCode]) {
            e.preventDefault();
            KEY_STATUS[KEY_CODES[keyCode]] = true;
        }
    };
    document.onkeyup = function(e) {
        var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
        if (KEY_CODES[keyCode]) {
            e.preventDefault();
            KEY_STATUS[KEY_CODES[keyCode]] = false;
        }
    };


    var requestAnimFrame = (function(){
        return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback, element){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    /**
     * Shows the main menu after loading all assets
     */
    function mainMenu() {
        for (var sound in assetLoader.sounds) {
            if (assetLoader.sounds.hasOwnProperty(sound)) {
                assetLoader.sounds[sound].muted = !playSound;
            }
        }

        $('#progress').hide();
        $('#main').show();
        $('.sound').show();
    }

    /**
     * Starts the game - resets all variables and entities, spawn ground and water.
     */
    function startGame() {
        document.getElementById('game-over').style.display = 'none';
        ground = [];
        water = [];
        environment = [];
        enemies = [];
        player.reset();

        ticker = 0;
        stop = false;
        score = 0;
        platformHeight = 2;
        platformLength = 15;
        gapLength = 0;

        ctx.font = '16px arial, sans-serif';

        for (var i = 0; i < 30; i++) {
            ground.push(new Sprite(i * (platformWidth-3), platformBase - platformHeight * platformSpacer, 'brick'));
        }

        for (i = 0; i < canvas.width / 32 + 2; i++) {
            water.push(new Sprite(i * platformWidth, platformBase, 'water'));
        }

        background.reset();

        animate();

        assetLoader.sounds.gameOver.pause();
        assetLoader.sounds.bg.currentTime = 0;
        assetLoader.sounds.bg.loop = true;
        assetLoader.sounds.bg.play();
    }

    /**
     * Ends the game and restarts
     */
    function gameOver() {
        stop = true;
        $('#score').html(score);
        $('#game-over').show();
        assetLoader.sounds.bg.pause();
        assetLoader.sounds.gameOver.currentTime = 0;
        assetLoader.sounds.gameOver.play();
    }

    /**
     * Click handlers for the different menu screens
     */
    $('.rules').click(function() {
        $('#main').hide();
        $('#rules').show();
    });

    $('.back').click(function() {
        $('#rules').hide();
        $('#main').show();
    });
    $('.sound').click(function() {
        var $this = $(this);
        // sound off
        if ($this.hasClass('sound-on')) {
            $this.removeClass('sound-on').addClass('sound-off');
            playSound = false;
        }
        // sound on
        else {
            $this.removeClass('sound-off').addClass('sound-on');
            playSound = true;
        }

        // mute or unmute all sounds
        for (var sound in assetLoader.sounds) {
            if (assetLoader.sounds.hasOwnProperty(sound)) {
                assetLoader.sounds[sound].muted = !playSound;
            }
        }
    });
    $('.play').click(function() {
        $('#menu').hide();
        startGame();
    });
    $('.restart').click(function() {
        $('#game-over').hide();
        startGame();
    });

    assetLoader.downloadAll();
})(jQuery);