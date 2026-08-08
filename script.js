const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Új, nagy felbontás (1080x2340)
canvas.width = 1080;
canvas.height = 2340;

const yardImg = new Image(); yardImg.src = "assets/yard.png";
const bowlWaterImg = new Image(); bowlWaterImg.src = "assets/tál_víz.png";
const bowlWaterEmptyImg = new Image(); bowlWaterEmptyImg.src = "assets/tál_víz_üres.png";
const bowlFoodImg = new Image(); bowlFoodImg.src = "assets/tál_kaja.png";
const bowlFoodEmptyImg = new Image(); bowlFoodEmptyImg.src = "assets/tál_kaja_üres.png";

const dogImages = {
    idle: new Image(), angry: new Image(), belly: new Image(),
    walk: new Image(), eating: new Image(), drinking: new Image()
};
dogImages.idle.src = "assets/dog_idle.png";
dogImages.angry.src = "assets/dog_angry.png";
dogImages.belly.src = "assets/dog_belly.png";
dogImages.walk.src = "assets/dog_walk.png";
dogImages.eating.src = "assets/dog_eating.png";
dogImages.drinking.src = "assets/dog_drinking.png";

// Kutyus helyzete és mérete az 1080x2340-es vásznon (lent az udvaron)
let dog = { 
    x: 415, y: 1800, 
    startX: 415, startY: 1800, 
    width: 250, height: 250, 
    state: "Alap (Idle)", 
    currentImage: dogImages.idle 
};

// Tálak helyzete és mérete az alsó részen
const bowls = {
    water: { x: 150, y: 1950, width: 180, height: 180, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 750, y: 1950, width: 180, height: 180, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

let imagesLoaded = 0;
const totalImages = 10;
function checkLoad() { if (++imagesLoaded === totalImages) gameLoop(); }
yardImg.onload = checkLoad;
[bowlWaterImg, bowlWaterEmptyImg, bowlFoodImg, bowlFoodEmptyImg].forEach(img => img.onload = checkLoad);
Object.values(dogImages).forEach(img => img.onload = checkLoad);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    // Tálak kirajzolása
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    
    // Kutyus kirajzolása
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    
    // Állapot szöveg
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 60px monospace";
    ctx.fillText(`Állapot: ${dog.state}`, 80, 150);
    
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("mousedown", (e) => startInteraction(e));
canvas.addEventListener("touchstart", (e) => startInteraction(e.touches[0]));

function startInteraction(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Tálak ellenőrzése
    Object.values(bowls).forEach(bowl => {
        if (clickX >= bowl.x && clickX <= bowl.x + bowl.width && clickY >= bowl.y && clickY <= bowl.y + bowl.height) {
            if (!bowl.isFull) {
                bowl.isFull = true; 
                bowl.img = bowl.fullImg;
            } else {
                const state = (bowl === bowls.food) ? "Eszik... 🍖" : "Iszik... 💧";
                const img = (bowl === bowls.food) ? dogImages.eating : dogImages.drinking;
                
                moveDogTo(bowl.x, bowl.y, state, img, () => { 
                    bowl.isFull = false; 
                    bowl.img = bowl.emptyImg; 
                });
            }
        }
    });

    // Kutyusra kattintás (Megsértődés)
    if (clickX >= dog.x && clickX <= dog.x + dog.width && clickY >= dog.y && clickY <= dog.y + dog.height) {
        dog.state = "Megsértődött! 💢"; 
        dog.currentImage = dogImages.angry;
        setTimeout(() => { 
            dog.state = "Alap (Idle)"; 
            dog.currentImage = dogImages.idle; 
        }, 1500);
    }
}

// Kutyus mozgatása a tálhoz, majd visszasétálás az alaphelyzetbe
function moveDogTo(targetX, targetY, stateText, img, onComplete) {
    dog.state = "Odafut... 🐕";
    
    const animateToBowl = () => {
        let dx = targetX - dog.x; 
        let dy = targetY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.1; 
            dog.y += dy * 0.1;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(animateToBowl);
        } else {
            dog.state = stateText; 
            dog.currentImage = img;
            
            setTimeout(() => { 
                animateBackToStart();
                if (onComplete) onComplete();
            }, 2000);
        }
    };

    const animateBackToStart = () => {
        let dx = dog.startX - dog.x; 
        let dy = dog.startY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.1; 
            dog.y += dy * 0.1;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(animateBackToStart);
        } else {
            dog.state = "Alap (Idle)"; 
            dog.currentImage = dogImages.idle;
            dog.x = dog.startX;
            dog.y = dog.startY;
        }
    };

    animateToBowl();
}
