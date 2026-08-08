const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 384;
canvas.height = 288;

// Képek betöltése
const yardImg = new Image(); yardImg.src = "assets/yard.png";

// Tálak képei
const bowlWaterImg = new Image(); bowlWaterImg.src = "assets/tál_víz.png";
const bowlWaterEmptyImg = new Image(); bowlWaterEmptyImg.src = "assets/tál_víz_üres.png";
const bowlFoodImg = new Image(); bowlFoodImg.src = "assets/tál_kaja.png";
const bowlFoodEmptyImg = new Image(); bowlFoodEmptyImg.src = "assets/tál_kaja_üres.png";

// Kutyus képei
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

let dog = { x: 150, y: 160, width: 48, height: 48, state: "Alap (Idle)", currentImage: dogImages.idle };

// Tálak objektum állapottal
const bowls = {
    water: { x: 50, y: 200, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 280, y: 200, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

let imagesLoaded = 0;
const totalImages = 10;
function checkLoad() { if (++imagesLoaded === totalImages) gameLoop(); }
yardImg.onload = checkLoad;
bowlWaterImg.onload = checkLoad; bowlWaterEmptyImg.onload = checkLoad;
bowlFoodImg.onload = checkLoad; bowlFoodEmptyImg.onload = checkLoad;
Object.values(dogImages).forEach(img => img.onload = checkLoad);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    // Tálak kirajzolása
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, 48, 48);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, 48, 48);
    
    // Kutyus
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    
    ctx.fillStyle = "#fff"; ctx.font = "12px monospace";
    ctx.fillText(`Állapot: ${dog.state}`, 10, 20);
    requestAnimationFrame(gameLoop);
}

// Interakciók
canvas.addEventListener("mousedown", (e) => startInteraction(e));
canvas.addEventListener("touchstart", (e) => startInteraction(e.touches[0]));

function startInteraction(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Tál ellenőrzés
    Object.values(bowls).forEach(bowl => {
        if (clickX >= bowl.x && clickX <= bowl.x + 48 && clickY >= bowl.y && clickY <= bowl.y + 48) {
            if (!bowl.isFull) {
                // Megtöltés
                bowl.isFull = true;
                bowl.img = bowl.fullImg;
            } else {
                // Evés/Ivás indítása
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
        setTimeout(() => { dog.state = "Alap (Idle)"; dog.currentImage = dogImages.idle; }, 1500);
    }
}

function moveDogTo(targetX, targetY, stateText, img, onComplete) {
    dog.state = "Odafut... 🐕";
    const animate = () => {
        let dx = targetX - dog.x; let dy = targetY - dog.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            dog.x += dx * 0.1; dog.y += dy * 0.1;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(animate);
        } else {
            dog.state = stateText; dog.currentImage = img;
            setTimeout(() => { 
                dog.state = "Alap (Idle)"; dog.currentImage = dogImages.idle;
                if (onComplete) onComplete();
            }, 2000);
        }
    };
    animate();
}
