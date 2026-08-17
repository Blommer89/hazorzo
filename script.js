const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

let dog = { 
    x: 415, y: 1650, 
    startX: 415, startY: 1650, 
    width: 250, height: 250, 
    state: "Alap (Idle)", 
    currentImage: dogImages.idle,
    isBusy: false 
};

const bowls = {
    water: { x: 120, y: 1980, width: 180, height: 180, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 780, y: 1980, width: 180, height: 180, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

// Biztos ami biztos, elindítjuk a játékot 1 másodperc után akkor is, ha valami lassan Töltődne
let gameStarted = false;
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
    }
}
setTimeout(startGame, 1000);

let imagesLoaded = 0;
const totalImages = 10;
function checkLoad() {
    imagesLoaded++;
    if (imagesLoaded >= totalImages) {
        startGame();
    }
}

yardImg.onload = checkLoad;
yardImg.onerror = checkLoad; // Ha hiba van is továbblép
[bowlWaterImg, bowlWaterEmptyImg, bowlFoodImg, bowlFoodEmptyImg].forEach(img => {
    img.onload = checkLoad;
    img.onerror = checkLoad;
});
Object.values(dogImages).forEach(img => {
    img.onload = checkLoad;
    img.onerror = checkLoad;
});

let returnTimeout = null;
let touchStartX = 0;
let touchStartY = 0;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Udvar kirajzolása (ha betöltődött)
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    // Tálak kirajzolása
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    
    // Kutya kirajzolása
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    
    // Állapot szöveg
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 50px monospace";
    ctx.fillText(`Állapot: ${dog.state}`, 80, 150);
    
    requestAnimationFrame(gameLoop);
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

canvas.addEventListener("pointerdown", (e) => {
    const coords = getCanvasCoords(e);
    touchStartX = coords.x;
    touchStartY = coords.y;
});

canvas.addEventListener("pointerup", (e) => {
    const coords = getCanvasCoords(e);
    const moveX = coords.x;
    const moveY = coords.y;

    if (returnTimeout) {
        clearTimeout(returnTimeout);
        returnTimeout = null;
    }

    const distance = Math.hypot(moveX - touchStartX, moveY - touchStartY);
    const padding = 20;

    // 1. Kutyus érintése
    if (
        touchStartX >= dog.x - padding && 
        touchStartX <= dog.x + dog.width + padding && 
        touchStartY >= dog.y - padding && 
        touchStartY <= dog.y + dog.height + padding
    ) {
        if (dog.isBusy) return;

        // Simogatás (húzás) -> Hátára fekszik
        if (distance > 40) {
            dog.isBusy = true;
            dog.state = "Simogatás... 🥰"; 
            dog.currentImage = dogImages.belly;
            setTimeout(() => { 
                dog.state = "Alap (Idle)"; 
                dog.currentImage = dogImages.idle; 
                dog.isBusy = false;
            }, 2000);
            return;
        } 
        // Megbökés -> Haragszik
        else {
            dog.isBusy = true;
            dog.state = "Megsértődött! 💢"; 
            dog.currentImage = dogImages.angry;
            setTimeout(() => { 
                dog.state = "Alap (Idle)"; 
                dog.currentImage = dogImages.idle; 
                dog.isBusy = false;
            }, 1500);
            return;
        }
    }

    // 2. Tálak ellenőrzése
    let clickedBowl = false;
    Object.values(bowls).forEach(bowl => {
        if (moveX >= bowl.x && moveX <= bowl.x + bowl.width && moveY >= bowl.y && moveY <= bowl.y + bowl.height) {
            clickedBowl = true;
            if (dog.isBusy) return;
            
            if (!bowl.isFull) {
                bowl.isFull = true; 
                bowl.img = bowl.fullImg;
            } else {
                dog.isBusy = true;
                const stateText = (bowl === bowls.food) ? "Eszik... 🍖" : "Iszik... 💧";
                const imgAsset = (bowl === bowls.food) ? dogImages.eating : dogImages.drinking;
                
                moveDogTo(bowl.x, bowl.y, stateText, imgAsset, () => { 
                    bowl.isFull = false; 
                    bowl.img = bowl.emptyImg; 
                });
            }
        }
    });

    if (clickedBowl) return;

    // 3. Üres udvarra bökés -> Odaszalad, ugat kettőt
    if (dog.isBusy) return;
    
    let targetX = moveX - dog.width / 2;
    let targetY = moveY - dog.height / 2;

    moveDogToCustom(targetX, targetY, () => {
        dog.state = "Vau! Vau! 🐕‍🦺";
        dog.currentImage = dogImages.angry;

        returnTimeout = setTimeout(() => {
            animateBackToStart();
        }, 2000);
    });
});

function moveDogTo(targetX, targetY, stateText, img, onComplete) {
    dog.isBusy = true;
    dog.state = "Odafut... 🐕";
    
    const animateToBowl = () => {
        let dx = targetX - dog.x; 
        let dy = targetY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; 
            dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(animateToBowl);
        } else {
            dog.x = targetX;
            dog.y = targetY;
            dog.state = stateText; 
            dog.currentImage = img;
            
            setTimeout(() => { 
                animateBackToStart();
                if (onComplete) onComplete();
            }, 2000);
        }
    };
    animateToBowl();
}

function moveDogToCustom(targetX, targetY, on llegue) {
    dog.isBusy = true;
    dog.state = "Odaszalad... 🏃‍♂️";

    const animateCustom = () => {
        let dx = targetX - dog.x; 
        let dy = targetY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; 
            dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(animateCustom);
        } else {
            dog.x = targetX;
            dog.y = targetY;
            if (llegue) llegue();
        }
    };
    animateCustom();
}

function animateBackToStart() {
    dog.isBusy = true;
    dog.state = "Visszasétál... 🏡";

    const stepBack = () => {
        let dx = dog.startX - dog.x; 
        let dy = dog.startY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; 
            dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            requestAnimationFrame(stepBack);
        } else {
            dog.state = "Alap (Idle)"; 
            dog.currentImage = dogImages.idle;
            dog.x = dog.startX;
            dog.y = dog.startY;
            dog.isBusy = false;
        }
    };
    stepBack();
}
