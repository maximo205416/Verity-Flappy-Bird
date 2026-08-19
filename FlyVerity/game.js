// ==========================================
// 1. ESCENA DEL MENÚ PRINCIPAL (SPLASH SCREEN)
// ==========================================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Cargar imagen del personaje usando la ruta exacta real del archivo
        this.load.image('verity', 'assets/flyverity.png');
        this.load.image('verityStarts', 'assets/verity-starts.png');
        this.load.audio('bgm', 'Sounds/verity-sound.mp3');
        this.load.audio('introSound', 'Sounds/verity-start.mp3');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.verityStartsImage = this.add.image(width / 2, height / 2, 'verityStarts')
            .setDisplaySize(width, height)
            .setVisible(false)
            .setDepth(100);

        // Fondo azul cielo
        this.cameras.main.setBackgroundColor('#70c5ce');

        // --- EFECTO DE PARTICULAS Y BRILLOS EN EL FONDO ---
        for (let i = 0; i < 20; i++) {
            let star = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(2, 5),
                0xffffff,
                Phaser.Math.FloatBetween(0.3, 0.8)
            );
            // Animación de parpadeo suave
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Phaser.Math.Between(1000, 2500),
                yoyo: true,
                repeat: -1
            });
        }

        // --- TÍTULO DEL JUEGO ---
        const title = this.add.text(width / 2, 110, 'FLY VERITY', {
            fontSize: '40px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffde59',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        // Animación suave de escala en el título
        this.tweens.add({
            targets: title,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- PERSONAJE EN EL CENTRO ---
        this.player = this.add.sprite(width / 2, 280, 'verity');
        this.player.setDisplaySize(80, 80);

        // Efecto flotante (arriba y abajo suavemente)
        this.tweens.add({
            targets: this.player,
            y: 260,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- BOTÓN DE PLAY ---
        const playBtnBg = this.add.rectangle(width / 2, 460, 200, 60, 0x2e8b57)
            .setStrokeStyle(4, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const playText = this.add.text(width / 2, 460, '¡JUGAR!', {
            fontSize: '28px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Agrupamos el botón y el texto para animarlos juntos
        const buttonGroup = [playBtnBg, playText];

        // Efectos del botón (Hover y Clic)
        playBtnBg.on('pointerover', () => {
            playBtnBg.setFillStyle(0x3cb371);
            this.tweens.add({
                targets: buttonGroup,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });

        playBtnBg.on('pointerout', () => {
            playBtnBg.setFillStyle(0x2e8b57);
            this.tweens.add({
                targets: buttonGroup,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 100
            });
        });

        const startGameFlow = () => {
            this.sound.stopAll();

            const introSound = this.sound.add('introSound');
            this.verityStartsImage.setVisible(true);

            introSound.play();
            introSound.once('complete', () => {
                this.verityStartsImage.setVisible(false);
                const bgm = this.sound.add('bgm', { loop: true });
                bgm.play();
                this.scene.start('GameScene');
            });
        };

        // Al hacer clic en PLAY, pasamos a la escena del juego
        playBtnBg.on('pointerdown', startGameFlow);

        // Tecla ESPACIO para empezar también
        this.input.keyboard.once('keydown-SPACE', startGameFlow);
    }
}

// ==========================================
// 2. ESCENA DEL JUEGO (GAMEPLAY)
// ==========================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('verity', 'assets/flyverity.png');
        this.load.image('tuberiaTop', 'assets/tuberia1.png');
        this.load.image('tuberiaBottom', 'assets/tuberia2.png');

        // Textura para las nubes
        const cloudGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        cloudGraphics.fillStyle(0xffffff, 0.6);
        cloudGraphics.fillCircle(20, 20, 20);
        cloudGraphics.fillCircle(40, 15, 25);
        cloudGraphics.fillCircle(60, 20, 20);
        cloudGraphics.generateTexture('nube', 80, 40);
    }

    create() {
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;

        this.sound.stopAll();
        const bgm = this.sound.add('bgm', { loop: true });
        bgm.play();

        this.cameras.main.setBackgroundColor('#70c5ce');

        // Audio
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Nubes de fondo
        this.clouds = this.physics.add.group();
        for (let i = 0; i < 3; i++) {
            let x = Math.random() * 400;
            let y = Math.random() * 200 + 50;
            let cloud = this.clouds.create(x, y, 'nube');
            cloud.body.allowGravity = false;
            cloud.setVelocityX(-30);
        }

        // Personaje
        this.player = this.physics.add.sprite(100, 250, 'verity');
        this.player.setDisplaySize(70, 70);
        this.player.setCollideWorldBounds(true);

        const radius = (this.player.displayWidth / 2) * 0.8;
        this.player.body.setCircle(
            radius,
            (this.player.displayWidth - radius * 2) / 2,
            (this.player.displayHeight - radius * 2) / 2
        );

        // Controles
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', this.jump, this);

        // Obstáculos
        this.obstacles = this.physics.add.group();

        this.timer = this.time.addEvent({
            delay: 1800,
            callback: this.addObstaclePair,
            callbackScope: this,
            loop: true
        });

        // Marcadores
        this.scoreText = this.add.text(20, 20, 'Puntos: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.highScoreText = this.add.text(20, 50, 'Récord: ' + this.highScore, {
            fontSize: '18px',
            fill: '#ffde59',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.physics.add.overlap(this.player, this.obstacles, this.gameOver, null, this);

        // Salto inicial para arrancar
        this.jump();
    }

    update() {
        // Mover nubes
        this.clouds.children.iterate((cloud) => {
            if (cloud && cloud.x < -80) {
                cloud.x = 450;
                cloud.y = Math.random() * 200 + 50;
            }
        });

        if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.space)) {
            this.jump();
        }

        // Inclinación
        if (this.player.body.velocity.y < 0) {
            this.player.setAngle(-15);
        } else {
            this.player.setAngle(15);
        }

        // Caída o límite superior
        if (this.player.y >= 580 || this.player.y <= 10) {
            this.gameOver();
        }
    }

    jump() {
        this.player.setVelocityY(-350);
        this.playJumpSound();
    }

    playJumpSound() {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    playHitSound() {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
    }

    addObstaclePair() {
        const gap = 180;
        const holeY = Phaser.Math.Between(200, 400);

        const topObstacle = this.obstacles.create(400, holeY - (gap / 2) - 160, 'tuberiaTop');
        topObstacle.setDisplaySize(60, 320);
        topObstacle.setFlipY(false);
        topObstacle.body.allowGravity = false;
        topObstacle.body.setImmovable(true);
        topObstacle.setVelocityX(-200);
        topObstacle.body.setSize(topObstacle.displayWidth * 0.9, topObstacle.displayHeight);
        topObstacle.body.setOffset(topObstacle.displayWidth * 0.05, 0);
        topObstacle.refreshBody();

        const bottomObstacle = this.obstacles.create(400, holeY + (gap / 2) + 160, 'tuberiaBottom');
        bottomObstacle.setDisplaySize(60, 320);
        bottomObstacle.body.allowGravity = false;
        bottomObstacle.body.setImmovable(true);
        bottomObstacle.setVelocityX(-200);
        bottomObstacle.body.setSize(bottomObstacle.displayWidth * 0.9, bottomObstacle.displayHeight);
        bottomObstacle.body.setOffset(bottomObstacle.displayWidth * 0.05, 0);
        bottomObstacle.refreshBody();

        topObstacle.passed = false;

        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (topObstacle.active && !topObstacle.passed && topObstacle.x < this.player.x) {
                    topObstacle.passed = true;
                    this.score += 1;
                    this.scoreText.setText('Puntos: ' + this.score);

                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('highScore', this.highScore);
                        this.highScoreText.setText('Récord: ' + this.highScore);
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    gameOver() {
        this.playHitSound();
        this.sound.stopAll();
        this.scene.start('MenuScene'); // Vuelve a la portada al perder
    }
}

// ==========================================
// 3. CONFIGURACIÓN E INICIALIZACIÓN
// ==========================================
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    // Le indicamos las dos escenas en orden: primero el menú y luego el juego
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);