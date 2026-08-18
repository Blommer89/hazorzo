const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1080;
canvas.height = 2340;

// Alap képek betöltése
const yardImg = new Image(); yardImg.src = "assets/yard.png";
const doghouseImg = new Image(); doghouseImg.src = "assets/doghouse.png";
const treeImg = new Image(); treeImg.src = "assets/tree.png";
const bowlWaterImg = new Image(); bowlWaterImg.src = "assets/tál_víz.png";
const bowlWaterEmptyImg = new Image(); bowlWaterEmptyImg.src = "assets/tál_víz_üres.png";
const bowlFoodImg = new Image(); bowlFoodImg.src = "assets/tál_kaja.png";
const bowlFoodEmptyImg = new Image(); bowlFoodEmptyImg.src = "assets/tál_kaja_üres.png";

// Kutya állapotok képeinek betöltése
const dogImages = {
    idle: new Image(), angry: new Image(), belly: new Image(),
    walk: new Image(), eating: new Image(), drinking: new Image(),
    bark: new Image(), pee: new Image()
};
dogImages.idle.src = "assets/dog_idle.png";
dogImages.angry.src = "assets/dog_angry.png";
dogImages.belly.src = "assets/dog_belly.png";
dogImages.walk.src = "assets/dog_walk.png";
dogImages.eating.src = "assets/dog_eating.png";
dogImages.drinking.src = "assets/dog_drinking.png";
dogImages.bark.src = "assets/dog_bark.png";
dogImages.pee.src = "assets/dog_pee.png";

// Kutya kezdőadatai (alul, középtájon)
let dog = { 
    x: 415, y: 1650, 
    startX: 415, startY: 1650, 
    width: 250, height: 250, 
    currentImage: dogImages.idle,
    isBusy: false 
};

// ==================================================================================
// KÖRNYEZETI ELEMEK POZÍCIONÁLÁSA (A frissített koordinátáiddal)
// ==================================================================================
const treeLeft = { x: 80, y: 200, width: 320, height: 420 };
const treeRight = { x: 680, y: 350, width: 320, height: 420 };
const doghouse = { x: 600, y: 950, width: 300, height: 300 };

const bowls = {
    water: { x: 590, y: 1300, width: 90, height: 90, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 750, y: 1350, width: 90, height: 90, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

let gameStarted = false;
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
    }
}

let imagesLoaded = 0;
const totalImages = 15;
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

setTimeout(startGame, 1500);

let currentAnimationId = null;
let returnTimeout = null;
let longPressTimer = null; // Időzítő a hosszú érintéshez (Simizés)

// Fő játúciklus (Kirajzolás helyes mélységi sorrendben)
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    // Háttérelemek
    ctx.drawImage(treeImg, treeLeft.x, treeLeft.y, treeLeft.width, treeLeft.height);
    ctx.drawImage(treeImg, treeRight.x, treeRight.y, treeRight.width, treeRight.height);
    ctx.drawImage(doghouseImg, doghouse.x, doghouse.y, doghouse.width, doghouse.height);
    
    // Előtér elemek (Tálak és Kutya)
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    
    requestAnimationFrame(gameLoop);
}

// Koordináta konvertáló mobilhoz és asztali géphez
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

// ==================================================================================
// ÉRINTÉSEK ÉS KATTINTÁSOK KEZELÉSE (LONG PRESS LOGIKával)
// ==================================================================================

canvas.addEventListener("pointerdown", (e) => {
    if (e.cancelable) e.preventDefault();
    const coords = getCanvasCoords(e);
    const startX = coords.x;
    const startY = coords.y;

    if (returnTimeout) { clearTimeout(returnTimeout); returnTimeout = null; }
    if (currentAnimationId) { cancelAnimationFrame(currentAnimationId); currentAnimationId = null; }
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

    const padding = 60;
    // HA A KUTYÁRA NYOMTÁK RÁ:
    if (startX >= dog.x - padding && startX <= dog.x + dog.width + padding && 
        startY >= dog.y - padding && startY <= dog.y + dog.height + padding) {
        
        if (dog.isBusy) return;

        // Elindítunk egy időzítőt: ha 400 milliszekundumig NYOMVA TARTJA -> SIMOGATÁS (belly)
        longPressTimer = setTimeout(() => {
            dog.isBusy = true;
            dog.currentImage = dogImages.belly;
            longPressTimer = null; // Jelezzük, hogy lefutott
            
            // Vissza idle-be 2 másodperc múlva
            returnTimeout = setTimeout(() => { 
                dog.currentImage = dogImages.idle; 
                dog.isBusy = false; 
            }, 2000);
        }, 400);

        return;
    }
});

// Ha elengedi vagy elhúzza az ujját mielőtt letelne a 400ms -> Sima bökés vagy egyéb akció
canvas.addEventListener("pointerup", (e) => {
    // Ha még élt a hosszú érintés időzítője, az azt jelenti, hogy ez egy GYORS KATTINTÁS/BÖKÉS volt
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;

        const coords = getCanvasCoords(e);
        const moveX = coords.x;
        const moveY = coords.y;

        const padding = 60;
        // Ha a kutyán engedte fel gyorsan -> MORCOS (angry)
        if (moveX >= dog.x - padding && moveX <= dog.x + dog.width + padding && 
            moveY >= dog.y - padding && moveY <= dog.y + dog.height + padding) {
            
            if (dog.isBusy) return;
            dog.isBusy = true;
            dog.currentImage = dogImages.angry;
            setTimeout(() => { dog.currentImage = dogImages.idle; dog.isBusy = false; }, 1500);
            return;
        }

        // ==============================================================================
        // EGYÉB KATTINTÁSOK (Fák, Tálak, Ugatás)
        // ==============================================================================
        
        // 1. BAL FA
        if (moveX >= treeLeft.x && moveX <= treeLeft.x + treeLeft.width && moveY >= treeLeft.y && moveY <= treeLeft.y + treeLeft.height) {
            if (dog.isBusy) return;
            let targetX = treeLeft.x + (treeLeft.width / 2) - (dog.width / 2) - 60;
            let targetY = treeLeft.y + treeLeft.height - 230; 
            moveDogToCustom(targetX, targetY, () => {
                dog.currentImage = dogImages.pee;
                returnTimeout = setTimeout(() => { animateBackToStart(); }, 2500);
            });
            return;
        }

        // 2. JOBB FA
        if (moveX >= treeRight.x && moveX <= treeRight.x + treeRight.width && moveY >= treeRight.y && moveY <= treeRight.y + treeRight.height) {
            if (dog.isBusy) return;
            let targetX = treeRight.x + (treeRight.width / 2) - (dog.width / 2) - 60;
            let targetY = treeRight.y + treeRight.height - 230; 
            moveDogToCustom(targetX, targetY, () => {
                dog.currentImage = dogImages.pee;
                returnTimeout = setTimeout(() => { animateBackToStart(); }, 2500);
            });
            return;
        }

        // 3. TÁLAK
        let clickedBowl = false;
        Object.values(bowls).forEach(bowl => {
            if (moveX >= bowl.x && moveX <= bowl.x + bowl.width && moveY >= bowl.y && moveY <= bowl.y + bowl.height) {
                clickedBowl = true;
                if (dog.isBusy) return;
                
                bowl.isFull = true; 
                bowl.img = bowl.fullImg;
                
                dog.isBusy = true;
                const imgAsset = (bowl === bowls.food) ? dogImages.eating : dogImages.drinking;
                
                let targetX = (bowl.x + (bowl.width / 2) - (dog.width / 2)) + 70;
                let targetY = bowl.y - 120; 

                moveDogToExplicit(targetX, targetY, imgAsset, () => { 
                    bowl.isFull = false; 
                    bowl.img = bowl.emptyImg; 
                });
            }
        });

        if (clickedBowl) return;
        if (dog.isBusy) return;
        
        // 4. BÁRHOVA MÁSHOVA -> UGATÁS
        let targetX = moveX - dog.width / 2;
        let targetY = moveY - dog.height / 2;
        moveDogToCustom(targetX, targetY, () => {
            dog.currentImage = dogImages.bark;
            returnTimeout = setTimeout(() => { animateBackToStart(); }, 2000);
        });
    }
});

// ==================================================================================
// MOZGATÓ ÉS ANIMÁCIÓS FÜGGVÉNYEK
// ==================================================================================

function moveDogToExplicit(targetX, targetY, img, onComplete) {
    dog.isBusy = true;
    const animateToBowl = () => {
        let dx = targetX - dog.x; let dy = targetY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            currentAnimationId = requestAnimationFrame(animateToBowl);
        } else {
            dog.x = targetX; dog.y = targetY; dog.currentImage = img;
            returnTimeout = setTimeout(() => { animateBackToStart(); if (onComplete) onComplete(); }, 2000);
        }
    };
    animateToBowl();
}

function moveDogToCustom(targetX, targetY, onComplete) {
    dog.isBusy = true;
    const animateCustom = () => {
        let dx = targetX - dog.x; let dy = targetY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            currentAnimationId = requestAnimationFrame(animateCustom);
        } else {
            dog.x = targetX; dog.y = targetY;
            if (onComplete) onComplete();
        }
    };
    animateCustom();
}

function animateBackToStart() {
    dog.isBusy = true;
    const stepBack = () => {
        let dx = dog.startX - dog.x; let dy = dog.startY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            currentAnimationId = requestAnimationFrame(stepBack);
        } else {
            dog.currentImage = dogImages.idle;
            dog.x = dog.startX;
            dog.y = dog.startY;
            dog.isBusy = false; currentAnimationId = null;
        }
    };
    stepBack();
}
