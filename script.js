const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Az eredeti képfelbontásod
canvas.width = 777;
canvas.height = 1191;

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

// Kutyus helyzete és az alaphelyzet (ahová visszatér evés után)
let dog = { 
    x: 300, y: 900, 
    startX: 300, startY: 900, 
    width: 120, height: 120, 
    state: "Alap (Idle)", 
    currentImage: dogImages.idle 
};

// Tálak helyzete az alsó részen
const bowls = {
    water: { x: 100, y: 950, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 500, y: 950, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
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
    
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, 120, 120);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, 120, 120);
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    
    ctx.fillStyle = "#fff"; ctx.font = "40px monospace";
    ctx.fillText(`Állapot: ${dog.state}`, 50, 100);
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
        if (clickX >= bowl.x && clickX <= bowl.x + 120 && clickY >= bowl.y && clickY <= bowl.y + 120) {
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
    
    // 1. Odafutás a tálhoz
    const animateToBowl = () => {
        let dx = targetX - dog.x; 
        let dy = targetY - dog.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            dog.x += dx * 0.1; 
            dog.y += dy * 0.1;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(animateToBowl);
        } else {
            // Megérkezett, elkezd enni/inni
            dog.state = stateText; 
            dog.currentImage = img;
            
            setTimeout(() => { 
                // Evés/ivás után elindul vissza
                animateBackToStart();
                if (onComplete) onComplete();
            }, 2000);
        }
    };

    // 2. Visszasétálás az eredeti kiindulási pontra
    const animateBackToStart = () => {
        let dx = dog.startX - dog.x; 
        let dy = dog.startY - dog.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            dog.x += dx * 0.1; 
            dog.y += dy * 0.1;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(animateBackToStart);
        } else {
            // Visszaért a helyére, visszaáll alapba
            dog.state = "Alap (Idle)"; 
            dog.currentImage = dogImages.idle;
            dog.x = dog.startX;
            dog.y = dog.startY;
        }
    };

    animateToBowl();
}
