const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1080;
canvas.height = 2340;

const yardImg = new Image(); yardImg.src = "assets/yard.png";
const doghouseImg = new Image(); doghouseImg.src = "assets/doghouse.png";
const treeImg = new Image(); treeImg.src = "assets/tree.png"; // Új fa kép
const bowlWaterImg = new Image(); bowlWaterImg.src = "assets/tál_víz.png";
const bowlWaterEmptyImg = new Image(); bowlWaterEmptyImg.src = "assets/tál_víz_üres.png";
const bowlFoodImg = new Image(); bowlFoodImg.src = "assets/tál_kaja.png";
const bowlFoodEmptyImg = new Image(); bowlFoodEmptyImg.src = "assets/tál_kaja_üres.png";

const dogImages = {
    idle: new Image(), angry: new Image(), belly: new Image(),
    walk: new Image(), eating: new Image(), drinking: new Image(),
    bark: new Image(), pee: new Image() // Új pisilő kép
};
dogImages.idle.src = "assets/dog_idle.png";
dogImages.angry.src = "assets/dog_angry.png";
dogImages.belly.src = "assets/dog_belly.png";
dogImages.walk.src = "assets/dog_walk.png";
dogImages.eating.src = "assets/dog_eating.png";
dogImages.drinking.src = "assets/dog_drinking.png";
dogImages.bark.src = "assets/dog_bark.png";
dogImages.pee.src = "assets/dog_pee.png"; // Új pisilő kép betöltése

let dog = { 
    x: 415, y: 1650, 
    startX: 415, startY: 1650, 
    width: 250, height: 250, 
    state: "Alap (Idle)", 
    currentImage: dogImages.idle,
    isBusy: false 
};

// Kutyaház a bal felső sarokban
const doghouse = {
    x: 80, y: 300, width: 350, height: 350
};

// Fa a jobb felső sarokban (igény szerint finomhangolhatod a méretet és pozíciót)
const tree = {
    x: 650, y: 250, width: 350, height: 450
};

const bowls = {
    water: { x: 120, y: 1980, width: 180, height: 180, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 780, y: 1980, width: 180, height: 180, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

let gameStarted = false;
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
    }
}
setTimeout(startGame, 1000);

let imagesLoaded = 0;
const totalImages = 14; // 1 yard + 1 kutyaház + 1 fa + 4 tál + 7 kutya kép = 14 összesen
function checkLoad() {
    imagesLoaded++;
    if (imagesLoaded >= totalImages) {
        startGame();
    }
}

yardImg.onload = checkLoad; yardImg.onerror = checkLoad;
doghouseImg.onload = checkLoad; doghouseImg.onerror = checkLoad;
treeImg.onload = checkLoad; treeImg.onerror = checkLoad;
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
let maxDistance = 0;
let touchedOnDog = false;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Háttér elemek (Udvar, Kutyaház, Fa)
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(doghouseImg, doghouse.x, doghouse.y, doghouse.width, doghouse.height);
    ctx.drawImage(treeImg, tree.x, tree.y, tree.width, tree.height);
    
    // Tálak és Kutya
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    
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
    maxDistance = 0;

    const padding = 30;
    if (
        touchStartX >= dog.x - padding && 
        touchStartX <= dog.x + dog.width + padding && 
        touchStartY >= dog.y - padding && 
        touchStartY <= dog.y + dog.height + padding
    ) {
        touchedOnDog = true;
    } else {
        touchedOnDog = false;
    }
});

canvas.addEventListener("pointermove", (e) => {
    if (!touchedOnDog) return;
    const coords = getCanvasCoords(e);
    const currentDistance = Math.hypot(coords.x - touchStartX, coords.y - touchStartY);
    if (currentDistance > maxDistance) {
        maxDistance = currentDistance;
    }
});

canvas.addEventListener("pointerup", (e) => {
    const coords = getCanvasCoords(e);
    const moveX = coords.x;
    const moveY = coords.y;

    if (returnTimeout) {
        clearTimeout(returnTimeout);
        returnTimeout = null;
    }

    // 1. Kutyus simogatása vagy bökése
    if (touchedOnDog) {
        touchedOnDog = false;
        if (dog.isBusy) return;

        // Simogatás (húzás) -> Hátára fekszik
        if (maxDistance > 30) {
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

    // 2. Fára kattintás -> Odafut és pisil
    if (
        moveX >= tree.x && moveX <= tree.x + tree.width && 
        moveY >= tree.y && moveY <= tree.y + tree.height
    ) {
        if (dog.isBusy) return;
        
        // A fa elé vagy mellé szalad (a fa alatti részre)
        let targetX = tree.x + (tree.width / 2) - (dog.width / 2);
        let targetY = tree.y + tree.height - 100;

        moveDogToCustom(targetX, targetY, () => {
            dog.state = "Pisi idő... 💧🐕";
            dog.currentImage = dogImages.pee;

            returnTimeout = setTimeout(() => {
                animateBackToStart();
            }, 2500);
        });
        return;
    }

    // 3. Tálak ellenőrzése
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

    // 4. Üres udvarra bökés -> Odaszalad és ugat
    if (dog.isBusy) return;
    
    let targetX = moveX - dog.width / 2;
    let targetY = moveY - dog.height / 2;

    moveDogToCustom(targetX, targetY, () => {
        dog.state = "Vau! Vau! 🐕‍🦺";
        dog.currentImage = dogImages.bark;

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

function moveDogToCustom(targetX, targetY, onComplete) {
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
            if (onComplete) onComplete();
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
