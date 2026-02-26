class Camera {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.width = game.width;
        this.height = game.height;
    }

    update() {
        // Follow player with easing
        const targetX = this.game.player.x - this.width / 2;
        const targetY = this.game.player.y - this.height / 2;
        
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }
}

class Vehicle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
        this.acceleration = 0.2;
        this.deceleration = 0.1;
        this.friction = 0.05;
        this.maxSpeed = 8;
        this.steering = 0.04;
        this.width = 60;
        this.height = 30;
        this.color = color;
        this.isOccupied = false;
    }

    update(keys) {
        if (!this.isOccupied) {
            // Apply friction even if not occupied
            if (this.speed > 0) this.speed -= this.friction;
            if (this.speed < 0) this.speed += this.friction;
            if (Math.abs(this.speed) < this.friction) this.speed = 0;
            
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            return;
        }

        // Acceleration
        if (keys['w'] || keys['ArrowUp']) {
            if (this.speed < this.maxSpeed) this.speed += this.acceleration;
        } else if (keys['s'] || keys['ArrowDown']) {
            if (this.speed > -this.maxSpeed / 2) this.speed -= this.acceleration;
        } else {
            // Friction
            if (this.speed > 0) this.speed -= this.friction;
            if (this.speed < 0) this.speed += this.friction;
            if (Math.abs(this.speed) < this.friction) this.speed = 0;
        }

        // Steering (Only when moving)
        if (Math.abs(this.speed) > 0.1) {
            const steeringDir = this.speed > 0 ? 1 : -1;
            if (keys['a'] || keys['ArrowLeft']) this.angle -= this.steering * steeringDir;
            if (keys['d'] || keys['ArrowRight']) this.angle += this.steering * steeringDir;
        }

        // Movement
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-this.width/2 + 2, -this.height/2 + 2, this.width, this.height);

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        // Roof
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-10, -10, 30, 20);

        // Windows
        ctx.fillStyle = '#add8e6';
        ctx.fillRect(15, -12, 5, 24); // Front
        ctx.fillRect(-20, -12, 5, 24); // Back

        // Headlights
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.width/2 - 5, -this.height/2 + 2, 5, 6);
        ctx.fillRect(this.width/2 - 5, this.height/2 - 8, 5, 6);

        ctx.restore();
    }
}

class Building {
    constructor(x, y, w, h, color = '#555') {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.color = color;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, 10, this.width, this.height);

        // Main Body
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);

        // Roof Detail
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, this.width - 20, this.height - 20);

        ctx.restore();
    }

    collidesWith(posX, posY, size) {
        return (posX + size > this.x && 
                posX - size < this.x + this.width &&
                posY + size > this.y && 
                posY - size < this.y + this.height);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.keys = {};
        this.player = {
            x: 500,
            y: 540,
            angle: 0,
            speed: 0,
            maxSpeed: 4,
            width: 32,
            height: 32,
            color: '#f1c40f',
            inVehicle: null
        };

        this.vehicles = [
            new Vehicle(600, 600, '#e74c3c'),
            new Vehicle(1000, 400, '#3498db'),
            new Vehicle(1200, 1500, '#9b59b6')
        ];

        this.buildings = [
            new Building(100, 100, 200, 300, '#444'),
            new Building(1000, 1000, 400, 200, '#4a4a4a'),
            new Building(600, 100, 300, 300, '#3d3d3d'),
            new Building(100, 1000, 300, 400, '#555'),
            new Building(1500, 600, 200, 600, '#2c3e50')
        ];


        this.camera = new Camera(this);
        this.worldSize = 2000;

        this.init();
    }


    init() {
        // Event Listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Interaction Keys
            if (e.key === 'f') {
                this.toggleVehicle();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('resize', () => this.handleResize());

        // Simulate Loading
        setTimeout(() => {
            document.getElementById('loading-overlay').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-overlay').style.display = 'none';
            }, 800);
        }, 1500);

        this.loop();
    }

    toggleVehicle() {
        if (this.player.inVehicle) {
            // Exit Vehicle
            const v = this.player.inVehicle;
            v.isOccupied = false;
            this.player.inVehicle = null;
            
            // Spawn player next to car
            this.player.x += Math.cos(v.angle + Math.PI/2) * 50;
            this.player.y += Math.sin(v.angle + Math.PI/2) * 50;
        } else {
            // Enter Vehicle
            let closest = null;
            let minDist = 80; // Interaction range

            this.vehicles.forEach(v => {
                const dist = Math.sqrt((this.player.x - v.x)**2 + (this.player.y - v.y)**2);
                if (dist < minDist) {
                    minDist = dist;
                    closest = v;
                }
            });

            if (closest) {
                this.player.inVehicle = closest;
                closest.isOccupied = true;
                closest.speed = 0; // Stop car when entering
            }
        }
    }

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.camera.width = this.width;
        this.camera.height = this.height;
    }

    update() {
        // Update all vehicles
        this.vehicles.forEach(v => {
            const oldX = v.x;
            const oldY = v.y;
            v.update(this.keys);

            // Vehicle Collision with Buildings
            this.buildings.forEach(b => {
                if (b.collidesWith(v.x, v.y, 30)) {
                    v.x = oldX;
                    v.y = oldY;
                    v.speed *= -0.5; // Bounce
                }
            });
        });

        if (this.player.inVehicle) {
            // Player is in a vehicle
            const v = this.player.inVehicle;
            this.player.x = v.x;
            this.player.y = v.y;
            this.player.angle = v.angle;
        } else {
            // Player Movement (Walking)
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            let dx = 0;
            let dy = 0;

            if (this.keys['ArrowUp'] || this.keys['w']) dy -= 1;
            if (this.keys['ArrowDown'] || this.keys['s']) dy += 1;
            if (this.keys['ArrowLeft'] || this.keys['a']) dx -= 1;
            if (this.keys['ArrowRight'] || this.keys['d']) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx /= length;
                dy /= length;

                this.player.x += dx * this.player.maxSpeed;
                this.player.y += dy * this.player.maxSpeed;
                this.player.angle = Math.atan2(dy, dx);

                // Player Collision with Buildings
                this.buildings.forEach(b => {
                    if (b.collidesWith(this.player.x, this.player.y, 16)) {
                        this.player.x = oldX;
                        this.player.y = oldY;
                    }
                });
            }
        }

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.worldSize, this.player.x));
        this.player.y = Math.max(0, Math.min(this.worldSize, this.player.y));

        this.camera.update();
    }

    draw() {
        // Background (Grass)
        this.ctx.fillStyle = '#2d5a27';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.camera.apply(this.ctx);

        // World Background (More grass)
        this.ctx.fillStyle = '#346a2e';
        this.ctx.fillRect(0, 0, this.worldSize, this.worldSize);

        // Draw Roads (Grid-like)
        this.drawWorld();

        // Draw Buildings
        this.buildings.forEach(b => b.draw(this.ctx));

        // Draw Vehicles
        this.vehicles.forEach(v => v.draw(this.ctx));

        // Draw Player (If not in vehicle)
        if (!this.player.inVehicle) {
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);
            this.ctx.rotate(this.player.angle);
            
            // Player Shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.arc(2, 2, 16, 0, Math.PI * 2);
            this.ctx.fill();

            // Player Body
            this.ctx.fillStyle = this.player.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
            this.ctx.fill();

            // Direction Indicator (Face)
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(8, -4, 8, 8);
            
            this.ctx.restore();
        }

        this.camera.restore(this.ctx);

        // Draw Minimap (Top-left fixed)
        this.drawMinimap();
    }

    drawMinimap() {
        const size = 180;
        const padding = 20;
        const scale = size / this.worldSize;
        
        this.ctx.save();
        this.ctx.translate(padding, padding);
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(0, 0, size, size);
        this.ctx.strokeRect(0, 0, size, size);

        // Buildings on minimap
        this.ctx.fillStyle = '#666';
        this.buildings.forEach(b => {
            this.ctx.fillRect(b.x * scale, b.y * scale, b.width * scale, b.height * scale);
        });

        // Vehicles on minimap
        this.vehicles.forEach(v => {
            this.ctx.fillStyle = v.color;
            this.ctx.fillRect(v.x * scale - 2, v.y * scale - 1, 4, 2);
        });

        // Player on minimap
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x * scale, this.player.y * scale, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }


    drawWorld() {
        const roadWidth = 150;
        const spacing = 500;
        
        this.ctx.fillStyle = '#333';
        
        // Vertical Roads
        for (let x = 0; x <= this.worldSize; x += spacing) {
            this.ctx.fillRect(x - roadWidth/2, 0, roadWidth, this.worldSize);
            
            // Road Lines
            this.ctx.strokeStyle = '#fff';
            this.ctx.setLineDash([20, 20]);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.worldSize);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Horizontal Roads
        for (let y = 0; y <= this.worldSize; y += spacing) {
            this.ctx.fillRect(0, y - roadWidth/2, this.worldSize, roadWidth);

            // Road Lines
            this.ctx.strokeStyle = '#fff';
            this.ctx.setLineDash([20, 20]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.worldSize, y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}


// Start Game
window.onload = () => {
    new Game();
};
