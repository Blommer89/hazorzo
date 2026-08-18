const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1080;
canvas.height = 2340;

// Háttér és objektum képek betöltése
const yardImg = new Image(); yardImg.src = "assets/yard.png";
const doghouseImg = new Image(); doghouseImg.src = "assets/doghouse.png";
const treeImg = new Image(); treeImg.src = "assets/tree.png";
const bowlWaterImg = new Image(); bowlWaterImg.src = "assets/tál_víz.png";
const bowlWaterEmptyImg = new Image(); bowlWaterEmptyImg.src = "assets/tál_víz_üres.png";
const bowlFoodImg = new Image(); bowlFoodImg.src = "assets/tál_kaja.png";
const bowlFoodEmptyImg = new Image(); bowlFoodEmptyImg.src = "assets/tál_kaja_üres.png";

// Kutya animációs képek betöltése
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

// Kutya alapadatai (Kezdőpozíció alul, méret, aktuális kép, elfoglalt státusz)
let dog = { 
    x: 415, y: 1650, 
    startX: 415, startY: 1650, 
    width: 250, height: 250, 
    currentImage: dogImages.idle,
    isBusy: false 
};

// ==================================================================================
// KÖRNYEZETI ELEMEK (Fák és Kutyaház)
// ==================================================================================
// Két fa létrehozása a jobb és bal felső sarok közelében, eltérő magassággal (y: 200 és y: 350)
const treeLeft = { x: 80, y: 200, width: 320, height: 420 };
const treeRight = { x: 680, y: 350, width: 320, height: 420 };

// A kutyaházat lejjebb hoztuk a kijelző közepe felé (y: 350 -> y: 950)
const doghouse = { x: 365, y: 950, width: 350, height: 350 };

// ==================================================================================
// TÁLAK POZÍCIÓJÁNAK ÉS MÉRETÉNEK KALIBRÁLÁSA (A kért legutóbbi számokkal)
// ==================================================================================
// A tálak lejjebb kerültek a kijelző közepétől kicsit feljebb (y: 1150)
const bowls = {
    water: { x: 300, y: 1150, width: 130, height: 130, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 650, y: 1150, width: 130, height: 130, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

let gameStarted = false;
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
    }
}

// Képek betöltésének ellenőrzése, hogy ne rajzoljon üresen a canvas
let imagesLoaded = 0;
const totalImages = 15; // 14 kép + 1 plusz fa miatt
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

// Érintéskezelési segédváltozók a simogatáshoz és kattintáshoz
let touchStartX = 0;
let touchStartY = 0;
let maxDistance = 0;
let touchedOnDog = false;

// Fő játóciklus (Renderelés)
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    // Mindkét fa kirajzolása
    ctx.drawImage(treeImg, treeLeft.x, treeLeft.y, treeLeft.width, treeLeft.height);
    ctx.drawImage(treeImg, treeRight.x, treeRight.Y, treeRight.width, treeRight.height);
    
    ctx.drawImage(doghouseImg, doghouse.x, doghouse.y, doghouse.width, doghouse.height);
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    
    requestAnimationFrame(gameLoop);
}

// Koordináta konvertáló függvény (mobil/egér érintés pontos leképezéséhez a canvas-ra)
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

// 1. Érintés / Kattintás kezdete (Itt nézzük meg, hogy a kutyára inttettek-e)
canvas.addEventListener("pointerdown", (e) => {
    const coords = getCanvasCoords(e);
    touchStartX = coords.x;
    touchStartY = coords.y;
    maxDistance = 0;
    
    const padding = 50; // Kicsit megnöveltük a tartományt a könnyebb elérésért
    if (touchStartX >= dog.x - padding && touchStartX <= dog.x + dog.width + padding && 
        touchStartY >= dog.y - padding && touchStartY <= dog.y + dog.height + padding) {
        touchedOnDog = true;
    } else { 
        touchedOnDog = false; 
    }
});

// 2. Mozgatás közbeni távolság mérése (Ez különösen fontos a simogatás felismeréséhez mobil eszközökön)
canvas.addEventListener("pointermove", (e) => {
    if (!touchedOnDog) return;
    const coords = getCanvasCoords(e);
    const currentDistance = Math.hypot(coords.x - touchStartX, coords.y - touchStartY);
    if (currentDistance > maxDistance) {
        maxDistance = currentDistance;
    }
});

// 3. Érintés vége / Felengedés (Itt dől el, hogy simogatás, morcosság, tál-kezelés vagy pisi történt-e)
canvas.addEventListener("pointerup", (e) => {
    const coords = getCanvasCoords(e);
    const moveX = coords.x;
    const moveY = coords.y;

    if (returnTimeout) { clearTimeout(returnTimeout); returnTimeout = null; }
    if (currentAnimationId) { cancelAnimationFrame(currentAnimationId); currentAnimationId = null; }

    // Ha a kutyán történt az érintés:
    if (touchedOnDog) {
        touchedOnDog = false;
        if (dog.isBusy) return;
        
        // Ha elhúzta az ujját (maxDistance > 15 pixel), akkor az SIMOGATÁS (belly)
        // Ha csak rákattintott húzás nélkül, akkor MORCOS (angry)
        if (maxDistance > 15) {
            dog.isBusy = true;
            dog.currentImage = dogImages.belly;
            setTimeout(() => { dog.currentImage = dogImages.idle; dog.isBusy = false; }, 2000);
        } else {
            dog.isBusy = true;
            dog.currentImage = dogImages.angry;
            setTimeout(() => { dog.currentImage = dogImages.idle; dog.isBusy = false; }, 1500);
        }
        return;
    }

    // ==================================================================================
    // BAL FA (Pisi a bal oldali fánál)
    // ==================================================================================
    if (moveX >= treeLeft.x && moveX <= treeLeft.x + treeLeft.width && moveY >= treeLeft.y && moveY <= treeLeft.y + treeLeft.height) {
        if (dog.isBusy) return;
        
        // A kért -60-as eltolással
        let targetX = treeLeft.x + (treeLeft.width / 2) - (dog.width / 2) - 60;
        let targetY = treeLeft.y + treeLeft.height - 230; 

        moveDogToCustom(targetX, targetY, () => {
            dog.currentImage = dogImages.pee;
            returnTimeout = setTimeout(() => { animateBackToStart(); }, 2500);
        });
        return;
    }

    // ==================================================================================
    // JOBB FA (Pisi a jobb oldali fánál)
    // ==================================================================================
    if (moveX >= treeRight.x && moveX <= treeRight.x + treeRight.width && moveY >= treeRight.y && moveY <= treeRight.y + treeRight.height) {
        if (dog.isBusy) return;
        
        // A kért -60-as eltolással
        let targetX = treeRight.x + (treeRight.width / 2) - (dog.width / 2) - 60;
        let targetY = treeRight.y + treeRight.height - 230; 

        moveDogToCustom(targetX, targetY, () => {
            dog.currentImage = dogImages.pee;
            returnTimeout = setTimeout(() => { animateBackToStart(); }, 2500);
        });
        return;
    }

    // ==================================================================================
    // TÁLAK KEZELÉSE (Evés / Ivás)
    // ==================================================================================
    let clickedBowl = false;
    Object.values(bowls).forEach(bowl => {
        if (moveX >= bowl.x && moveX <= bowl.x + bowl.width && moveY >= bowl.y && moveY <= bowl.y + bowl.height) {
            clickedBowl = true;
            if (dog.isBusy) return;
            
            // Tál megtöltése azonnal
            bowl.isFull = true; 
            bowl.img = bowl.fullImg;
            
            dog.isBusy = true;
            const imgAsset = (bowl === bowls.food) ? dogImages.eating : dogImages.drinking;
            
            // A megadott +70-es vízszintes eltolással és y - 120 függőleges pozícióval
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
    
    // ==================================================================================
    // BÁRHOVA MSHOL TÖRTÉNŐ KATTINTÁS (Ugatás a helyszínen)
    // ==================================================================================
    let targetX = moveX - dog.width / 2;
    let targetY = moveY - dog.height / 2;

    moveDogToCustom(targetX, targetY, () => {
        dog.currentImage = dogImages.bark;
        returnTimeout = setTimeout(() => { animateBackToStart(); }, 2000);
    });
});

// Függvény a tálhoz való odafutáshoz (automatikusan kiüríti a tálat a végén)
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

// Függvény egyedi helyre (fákhoz vagy ugatási helyre) történő odafutáshoz
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

// Függvény a kezdőpozícióba való visszasétáláshoz
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
