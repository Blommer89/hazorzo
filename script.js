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
    bark: new Image(), pee: new Image(), dead: new Image()
};
dogImages.idle.src = "assets/dog_idle.png";
dogImages.angry.src = "assets/dog_angry.png";
dogImages.belly.src = "assets/dog_belly.png";
dogImages.walk.src = "assets/dog_walk.png";
dogImages.eating.src = "assets/dog_eating.png";
dogImages.drinking.src = "assets/dog_drinking.png";
dogImages.bark.src = "assets/dog_bark.png";
dogImages.pee.src = "assets/dog_pee.png";
dogImages.dead.src = "assets/dog_dead.png"; // Opcionális: halott kép (ha nincs még ilyen fájlod, fallbackként az angry-t vagy idle-t is használhatja)

// Kutya adatai (beleértve a tamagocsi statisztikákat)
let dog = { 
    x: 415, y: 1650, 
    startX: 415, startY: 1650, 
    width: 250, height: 250, 
    currentImage: dogImages.idle,
    isBusy: false,
    isDead: false,
    
    // Statisztikák (0 - 100)
    health: 100,
    hunger: 0,    // 0 = jóllakott, 100 = halálosan éhes
    thirst: 0,    // 0 = nem szomjas, 100 = halálosan szomjas
    bladder: 0    // 0 = üres hólyag, 100 = mindjárt bepisil / tele van
};

// ==================================================================================
// KÖRNYEZETI ELEMEK POZÍCIONÁLÁSA
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
        startStatsLoop(); // Elindítjuk az életmód-számlálót
    }
}

let imagesLoaded = 0;
const totalImages = 16; // 15 kép + 1 dead kép
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
let longPressTimer = null;

// ==================================================================================
// TAMAGOCSI IDŐZÍTŐ (Minden másodpercben romlanak a statisztikák)
// ==================================================================================
function startStatsLoop() {
    setInterval(() => {
        if (dog.isDead) return;

        // Szükségletek romlása (növekedése)
        dog.hunger += 1.5;   // Idővel éhezik
        dog.thirst += 2.0;   // Gyorsabban szomjazik
        dog.bladder += 1.0;  // Telik a hólyagja

        // Határok biztosítása (0 és 100 között)
        dog.hunger = Math.min(100, Math.max(0, dog.hunger));
        dog.thirst = Math.min(100, Math.max(0, dog.thirst));
        dog.bladder = Math.min(100, Math.max(0, dog.bladder));

        // Ha éhes, szomjas vagy tele van a hólyaga, az életcsík csökken
        if (dog.hunger > 80 || dog.thirst > 80 || dog.bladder > 90) {
            dog.health -= 3;
        } else {
            // Ha minden rendben, lassan gyógyul/stabil
            dog.health = Math.min(100, dog.health + 1);
        }

        // Halál ellenőrzése
        if (dog.health <= 0) {
            dog.health = 0;
            dog.isDead = true;
            dog.currentImage = dogImages.dead.complete ? dogImages.dead : dogImages.angry;
        }
    }, 1000);
}

// ==================================================================================
// FŐ JÁTÉKCIKLUS (Kirajzolás + UI / Életcsíkok)
// ==================================================================================
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    // Háttérelemek
    ctx.drawImage(treeImg, treeLeft.x, treeLeft.y, treeLeft.width, treeLeft.height);
    ctx.drawImage(treeImg, treeRight.x, treeRight.y, treeRight.width, treeRight.height);
    ctx.drawImage(doghouseImg, doghouse.x, doghouse.y, doghouse.width, doghouse.height);
    
    // Előtér elemek
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);

    // ==============================================================================
    // UI: ÉLETCSÍK ÉS SZÜKSÉGLETEK KIRAJZOLÁSA A KÉPERNYŐ TETEJÉRE
    // ==============================================================================
    drawHUD();
    
    requestAnimationFrame(gameLoop);
}

function drawHUD() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(50, 50, 980, 140); // Háttérdoboz a statoknak
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, 980, 140);

    // 1. Életerő (HP) csík
    drawBar(80, 75, 400, 25, "Életcsík", dog.health, "#e74c3c");
    // 2. Éhség csík
    drawBar(550, 75, 400, 25, "Éhség", 100 - dog.hunger, "#e67e22");
    // 3. Szomjúság csík
    drawBar(80, 125, 400, 25, "Szomjúság", 100 - dog.thirst, "#3498db");
    // 4. Hólyag / Pisilés csík
    drawBar(550, 125, 400, 25, "Pisilés", 100 - dog.bladder, "#f1c40f");

    // Ha a kutya meghalt, írjuk ki pirossal
    if (dog.isDead) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 70px Arial";
        ctx.textAlign = "center";
        ctx.fillText("A KUTYA MEGHALT!", canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillStyle = "#ffffff";
        ctx.font = "35px Arial";
        ctx.fillText("Nem gondoskodtál róla időben...", canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = "left"; // Visszaállítva
    }
}

// Segédfüggvény stat csíkok rajzolásához
function drawBar(x, y, w, h, label, value, color) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    ctx.fillText(`${label}:`, x, y - 5);

    // Háttér (üres rész)
    ctx.fillStyle = "#444444";
    ctx.fillRect(x + 110, y - 20, w - 110, h);

    // Kitöltött rész
    ctx.fillStyle = color;
    let fillWidth = Math.max(0, ((w - 110) * (value / 100)));
    ctx.fillRect(x + 110, y - 20, fillWidth, h);

    // Keret
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 110, y - 20, w - 110, h);
}

// Koordináta konvertáló
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

// ==================================================================================
// ÉRINTÉSEK ÉS KATTINTÁSOK KEZELÉSE
// ==================================================================================

canvas.addEventListener("pointerdown", (e) => {
    if (dog.isDead) return; // Ha halott, nem reagál
    if (e.cancelable) e.preventDefault();
    const coords = getCanvasCoords(e);
    const startX = coords.x;
    const startY = coords.y;

    if (returnTimeout) { clearTimeout(returnTimeout); returnTimeout = null; }
    if (currentAnimationId) { cancelAnimationFrame(currentAnimationId); currentAnimationId = null; }
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

    const padding = 60;
    if (startX >= dog.x - padding && startX <= dog.x + dog.width + padding && 
        startY >= dog.y - padding && startY <= dog.y + dog.height + padding) {
        
        if (dog.isBusy) return;

        // Hosszú érintés -> Simogatás (javítja a kedvét / életét is picit)
        longPressTimer = setTimeout(() => {
            dog.isBusy = true;
            dog.currentImage = dogImages.belly;
            longPressTimer = null;
            dog.health = Math.min(100, dog.health + 5); // Simi ad egy kis HP-t!
            
            returnTimeout = setTimeout(() => { 
                dog.currentImage = dogImages.idle; 
                dog.isBusy = false; 
            }, 2000);
        }, 400);

        return;
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (dog.isDead) return;

    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;

        const coords = getCanvasCoords(e);
        const moveX = coords.x;
        const moveY = coords.y;
        const padding = 60;

        // 1. Kutyára bökés -> Morcos
        if (moveX >= dog.x - padding && moveX <= dog.x + dog.width + padding && 
            moveY >= dog.y - padding && moveY <= dog.y + dog.height + padding) {
            
            if (dog.isBusy) return;
            dog.isBusy = true;
            dog.currentImage = dogImages.angry;
            setTimeout(() => { dog.currentImage = dogImages.idle; dog.isBusy = false; }, 1500);
            return;
        }

        // 2. BAL FA (Pisilés -> Nullázza a hólyag-statisztikát!)
        if (moveX >= treeLeft.x && moveX <= treeLeft.x + treeLeft.width && moveY >= treeLeft.y && moveY <= treeLeft.y + treeLeft.height) {
            if (dog.isBusy) return;
            let targetX = treeLeft.x + (treeLeft.width / 2) - (dog.width / 2) - 60;
            let targetY = treeLeft.y + treeLeft.height - 230; 
            moveDogToCustom(targetX, targetY, () => {
                dog.currentImage = dogImages.pee;
                dog.bladder = 0; // Kiszáradt a hólyag!
                returnTimeout = setTimeout(() => { animateBackToStart(); }, 2500);
            });
            return;
        }

        // 3. JOBB FA (Pisilés -> Nullázza a hólyag-statisztikát!)
        if (moveX >= treeRight.x && moveX <= treeRight.x + treeRight.width && moveY >= treeRight.y && moveY <= treeRight.y + treeRight.height) {
            if (dog.isBusy) return;
            let targetX = treeRight.x + (treeRight.width / 2) - (dog.width / 2) - 60;
            let targetY = treeRight.y + treeRight.height - 230; 
            moveDogToCustom(targetX, targetY, () => {
                dog.currentImage = dogImages.pee;
                dog.bladder = 0; // Kiszáradt a hólyag!
                returnTimeout = setTimeout(() => { animateBackToStart(); }, 2500);
            });
            return;
        }

        // 4. TÁLAK (Evés / Ivás -> Csökkentik az éhséget és szomjúságot!)
        let clickedBowl = false;
        Object.values(bowls).forEach(bowl => {
            if (moveX >= bowl.x && moveX <= bowl.x + bowl.width && moveY >= bowl.y && moveY <= bowl.y + bowl.height) {
                clickedBowl = true;
                if (dog.isBusy) return;
                
                bowl.isFull = true; 
                bowl.img = bowl.fullImg;
                
                dog.isBusy = true;
                const isFoodBowl = (bowl === bowls.food);
                const imgAsset = isFoodBowl ? dogImages.eating : dogImages.drinking;
                
                let targetX = (bowl.x + (bowl.width / 2) - (dog.width / 2)) + 70;
                let targetY = bowl.y - 120; 

                moveDogToExplicit(targetX, targetY, imgAsset, () => { 
                    bowl.isFull = false; 
                    bowl.img = bowl.emptyImg;
                    
                    // Ha evett, csökken az éhség; ha ivott, csökken a szomjúság
                    if (isFoodBowl) {
                        dog.hunger = Math.max(0, dog.hunger - 50);
                    } else {
                        dog.thirst = Math.max(0, dog.thirst - 50);
                    }
                });
            }
        });

        if (clickedBowl) return;
        if (dog.isBusy) return;
        
        // 5. Bárhova máshova -> Ugatás
        let targetX = moveX - dog.width / 2;
        let targetY = moveY - dog.height / 2;
        moveDogToCustom(targetX, targetY, () => {
            dog.currentImage = dogImages.bark;
            returnTimeout = setTimeout(() => { animateBackToStart(); }, 2000);
        });
    }
});

// ==================================================================================
// MOZGATÓ FÜGGVÉNYEK
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
