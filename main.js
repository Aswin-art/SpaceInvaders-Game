/**@type {HTMLCanvasElement} */
const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

canvas.width = 800
canvas.height = 500

const menu = document.querySelector('.menu')
const paused = document.querySelector('.paused')
const gameoverEl = document.querySelector('.gameover')
const nameInput = document.querySelector('.name')
const levelInput = document.querySelector('.level')
const btnMenu = document.querySelector('.btn-menu')
const btnGameover = document.querySelector('.btn-gameover')
const scoreEl = document.querySelector('.score')

function spawnEnemies(){
    let enemies = []
    for(let i = 0; i < Math.ceil(Math.random() * 4); ++i){
        const position = {
            x: Math.floor(Math.random() * ((canvas.width - 100) - 100) + 100),
            y: Math.round(Math.random() * (-100) - 150)
        }

        const speeds = [4, 3, 2]
        let speed = speeds[Math.round(Math.random() * 2)]
        
        enemies.push(new Enemy(position, speed))
    }
    
    return enemies
}

function spawnBullet(ship){
    const position = {
        x: ship.position.x + 22,
        y: ship.position.y
    }

    return new Bullet(position)
}

function shipCrashWithEnemy(ship, enemy){
    return ship.position.x < enemy.position.x + enemy.width &&
        ship.position.x + ship.width > enemy.position.x &&
        ship.position.y < enemy.position.y + enemy.height &&
        ship.position.y + ship.height > enemy.position.y
}

function bulletCrashWithEnemy(bullet, enemy){
    return bullet.position.x < enemy.position.x + enemy.width &&
        bullet.position.x + bullet.width > enemy.position.x &&
        bullet.position.y < enemy.position.y + enemy.height &&
        bullet.position.y + bullet.height > enemy.position.y
}

function enemyPassed(enemy){
    return enemy.position.y > canvas.height
}

function bulletPassed(bullet){
    return bullet.position.y < 0
}

class Bullet{
    constructor(position){
        this.width = 7
        this.height = 10
        this.position = position
        this.speed = 10
    }

    draw(){
        ctx.fillStyle = 'red'
        ctx.fillRect(this.position.x, this.position.y - this.height / 2, this.width, this.height)
    }

    update(){
        this.position.y -= this.speed
    }
}

class Enemy{
    constructor(position, speed){
        this.width = 50
        this.height = 50
        this.position = position
        this.image = new Image()
        this.image.src = './invader.png'
        this.speed = speed
    }

    draw(){
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
    }

    update(){
        this.position.y += this.speed
    }
}

class Ship{
    constructor(){
        this.width = 50
        this.height = 50
        this.position = {
            x: canvas.width / 2 - this.width / 2,
            y: canvas.height - this.height - 10
        }
        this.image = new Image()
        this.image.src = './spaceship.png'
        this.speed = 0
        this.maxSpeed = 9
    }

    moveLeft(){
        this.speed = -this.maxSpeed
    }

    moveRight(){
        this.speed = this.maxSpeed
    }

    stop(){
        this.speed = 0
    }

    draw(){
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
    }

    update(){
        if(this.position.x + this.width > canvas.width){
            this.position.x = canvas.width - this.width
        }

        if(this.position.x < 0){
            this.position.x = 0
        }

        this.position.x += this.speed
    }
}

class EventHandler{
    constructor(game){
        document.addEventListener('keydown', (e) => {
            switch(e.key){
                case 'ArrowLeft':
                    game.ship.moveLeft()
                    break;
                case 'ArrowRight':
                    game.ship.moveRight()
                    break;
                case 'Escape':
                    if(pause){
                        audioBackground.play()
                        pause = false
                        paused.style.display = 'none'
                        animate()
                    }else{
                        audioBackground.pause()
                        pause = true
                        paused.style.display = 'block'
                    }
                    break;
                case ' ':
                    if(game.bullets.length > 4){
                        return
                    }else{
                        const audioShoot = new Audio('./audio/shoot.wav')
                        audioShoot.play()
                        game.bullets.push(spawnBullet(game.ship))
                    }
                    break;
                default:
                    break;
            }
        })

        document.addEventListener('keyup', (e) => {
            switch(e.key){
                case 'ArrowLeft':
                    if(game.ship.speed < 0){
                        game.ship.stop()
                    }
                    break;
                case 'ArrowRight':
                    if(game.ship.speed > 0){
                        game.ship.stop()
                    }
                    break;
                default:
                    break;
            }
        })
    }
}

class Game{
    constructor(){
        this.setup()
    }

    setup() {
        this.enemies = []
        this.bullets = []
        this.ship = new Ship()
        this.score = 0
        new EventHandler(this)
    }

    draw(){
        [this.ship, ...this.enemies, ...this.bullets].forEach(e => e.draw())
        ctx.fillStyle = 'white'
        ctx.fillText(format_time, 10, 20)
        ctx.fillStyle = 'white'
        ctx.fillText('Score: ' + this.score, 10, 40)
    }
    
    update(){
        [this.ship, ...this.enemies, ...this.bullets].forEach(e => e.update())

        // Spawn Enemies
        // if(enemySpawnInterval > 100){
        //     this.enemies.push(spawnEnemies())
        //     enemySpawnInterval = 0
        // }else{
        //     enemySpawnInterval++
        // }

        // Spawn enemies
        if(this.enemies.length == 0){
            this.enemies = spawnEnemies()
        }

        // Check if enemy crash with the player ship 
        // && check if enemy passed the bottom border
        this.enemies.forEach((enemy, index) => {
            if(enemyPassed(enemy)){
                this.enemies.splice(index, 1)
            }

            if(shipCrashWithEnemy(this.ship, enemy)){
                const audioGameover = new Audio('./audio/gameOver.mp3')
                audioGameover.play()
                audioBackground.pause()
                gameover = true
                scoreEl.innerHTML = this.score
                gameoverEl.style.display = 'block'
            }
        })

        // Check if bullet hit enemy
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if(bulletCrashWithEnemy(bullet, enemy)){
                    const audioHit = new Audio('./audio/explode.wav')
                    audioHit.play()
                    this.bullets.splice(bulletIndex, 1)
                    this.enemies.splice(enemyIndex, 1)
                    this.score += 10
                }
            })
        })

        // Check if bullet passed the top border
        this.bullets.forEach((bullet, index) => {
            if(bulletPassed(bullet)){
                this.bullets.splice(index, 1)
            }
        })
    }
}

const game = new Game()
let pause = true
let gameover = false
let enemySpawnInterval = 0
let time = 0
let format_time_second = null
let format_time_minute = null
let format_time_hour = null
let format_time = '00:00:00'

const audioBackground = new Audio('./audio/backgroundMusic.wav')

setInterval(() => {
    if(pause || gameover){
        return
    }else{
        time++

        if(time > 120){
            gameover = true
            pause = true
            gameoverEl.style.display = 'block'
        }

        let second = Math.floor(time % 60)
        let minute = Math.floor(time / 60)
        let hour = Math.floor(minute / 60)

        if(second < 10){
            format_time_second = '0' + second
        }else{
            format_time_second = second
        }

        if(minute < 10){
            format_time_minute = '0' + minute
        }else{
            format_time_minute = minute
        }

        if(hour < 10){
            format_time_hour = '0' + hour
        }else{
            format_time_hour = hour
        }

        format_time = format_time_hour + ':' + format_time_minute + ':' + format_time_second
    }
}, 1000)

function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if(!pause && !gameover){
        game.draw()
        game.update()
        requestAnimationFrame(animate)
    }
}

function play(){
    localStorage.setItem('name', nameInput.value)
    localStorage.setItem('level', levelInput.value)
    menu.style.display = 'none'
    pause = false
    gameover = false
    audioBackground.play()
    animate()
}

function restart(){
    audioBackground.currentTime = 0
    audioBackground.play()
    gameoverEl.style.display = 'none'
    time = 0
    pause = 0
    gameover = 0
    game.setup()
    animate()
}

nameInput.addEventListener('input', () => {
    if(nameInput.value != ''){
        btnMenu.style.pointerEvents = 'all'
        btnMenu.style.backgroundColor = 'salmon'
    }else{
        btnMenu.style.pointerEvents = 'none'
        btnMenu.style.backgroundColor = 'rgba(250, 128, 114, .6)'
    }
})

btnMenu.addEventListener('click', play)
btnGameover.addEventListener('click', restart)