const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1080;
canvas.height = 2340;

// ANIMÁCIÓS ÉS IDŐZÍTŐ VÁLTOZÓK DEKLARÁLÁSA ELŐRE
let currentAnimationId = null;
let returnTimeout = null;
let longPressTimer = null;
let butterflyTimeout = null;
let squirrelTimeout = null;
let squirrelMoveInterval = null;
let tailWagInterval = null;
let gameStarted = false;

// Alap képek betöltése
const yardImg = new Image(); yardImg.src = "assets/yard.png";
const doghouseImg = new Image(); doghouseImg.src = "assets/doghouse.png";
const treeImg = new Image(); treeImg.src = "assets/tree.png";
const bowlWaterImg = new Image(); bowlWaterImg.src = "assets/tál_víz.png";
const bowlWaterEmptyImg = new Image(); bowlWaterEmptyImg.src = "assets/tál_víz_üres.png";
const bowlFoodImg = new Image(); bowlFoodImg.src = "assets/tál_kaja.png";
const bowlFoodEmptyImg = new Image(); bowlFoodEmptyImg.src = "assets/tál_kaja_üres.png";
const butterflyImg = new Image(); butterflyImg.src = "assets/butterfly.png"; 
const squirrelImg = new Image(); squirrelImg.src = "assets/squirrel.png"; 

// Kutya állapotok képeinek betöltése
const dogImages = {
    idle: new Image(), idle2: new Image(), sleep: new Image(), angry: new Image(), belly: new Image(),
    walk: new Image(), eating: new Image(), drinking: new Image(),
    bark: new Image(), pee: new Image(), dead: new Image(),
    sick: new Image()
};
dogImages.idle.src = "assets/dog_idle.png";       
dogImages.idle2.src = "assets/dog_idle2.png";     
dogImages.sleep.src = "assets/dog_sleep.png";     
dogImages.angry.src = "assets/dog_angry.png";
dogImages.belly.src = "assets/dog_belly.png";
dogImages.walk.src = "assets/dog_walk.png";
dogImages.eating.src = "assets/dog_eating.png";
dogImages.drinking.src = "assets/dog_drinking.png";
dogImages.bark.src = "assets/dog_bark.png";
dogImages.pee.src = "assets/dog_pee.png";
dogImages.dead.src = "assets/dog_dead.png";
dogImages.sick.src = "assets/dog_sick.png";

// Kutya adatai
let dog = { 
    x: 415, y: 1650, 
    startX: 415, startY: 1650, 
    width: 250, height: 250, 
    currentImage: dogImages.idle,
    isBusy: false,
    isDead: false,
    isInDoghouse: false, 
    
    health: 100,
    hunger: 10,   
    thirst: 10,   
    bladder: 10   
};

// Játékállapot betöltése a localStorage-ból
function loadGameData() {
    const savedData = localStorage.getItem("tamagotchi_dog");
    const savedTime = localStorage.getItem("tamagotchi_last_save");

    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            dog.health = parsed.health;
            dog.hunger = parsed.hunger;
            dog.thirst = parsed.thirst;
            dog.bladder = parsed.bladder;
            dog.isDead = parsed.isDead;

            if (savedTime && !dog.isDead) {
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - parseInt(savedTime, 10)) / 1000);

                if (elapsedSeconds > 0) {
                    dog.hunger = Math.min(100, dog.hunger + elapsedSeconds * 0.3);
                    dog.thirst = Math.min(100, dog.thirst + elapsedSeconds * 0.4);
                    dog.bladder = Math.min(100, dog.bladder + elapsedSeconds * 0.2);

                    for (let i = 0; i < elapsedSeconds; i++) {
                        if (dog.hunger > 85 || dog.thirst > 85 || dog.bladder > 90) {
                            dog.health = Math.max(0, dog.health - 1.5);
                        } else if (dog.hunger < 50 && dog.thirst < 50 && dog.bladder < 50) {
                            dog.health = Math.min(100, dog.health + 0.5);
                        }
                    }

                    if (dog.health <= 0) {
                        dog.health = 0;
                        dog.isDead = true;
                    }
                }
            }
        } catch (e) {
            console.error("Hiba a mentett adatok betöltésekor:", e);
        }
    }

    updateDogAppearance();
}

function saveGameData() {
    const dataToSave = {
        health: dog.health,
        hunger: dog.hunger,
        thirst: dog.thirst,
        bladder: dog.bladder,
        isDead: dog.isDead
    };
    localStorage.setItem("tamagotchi_dog", JSON.stringify(dataToSave));
    localStorage.setItem("tamagotchi_last_save", Date.now().toString());
}

loadGameData();

let butterfly = { x: 0, y: 0, width: 100, height: 100, active: false };
let squirrel = { x: 0, y: 0, baseX: 0, baseY: 0, width: 100, height: 100, active: false };

// Környezeti elemek
const treeLeft = { x: 80, y: 200, width: 320, height: 420 };
const treeRight = { x: 680, y: 350, width: 320, height: 420 };
const doghouse = { x: 600, y: 950, width: 300, height: 300 };

const bowls = {
    water: { x: 590, y: 1300, width: 90, height: 90, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 750, y: 1350, width: 90, height: 90, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

const resetButton = { x: 340, y: 1550, width: 400, height: 90 };

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
        startStatsLoop(); 
        startButterflyLoop(); 
        checkNightTimeLoop(); 
    }
}

function requestFullscreenOnce() {
    let elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    }
}

// Biztonságos és dinamikus képbetöltés kezelő
let imagesLoaded = 0;
const imagesToLoad = [
    yardImg, doghouseImg, treeImg, 
    bowlWaterImg, bowlWaterEmptyImg, bowlFoodImg, bowlFoodEmptyImg,
    butterflyImg, squirrelImg,
    dogImages.idle, dogImages.idle2, dogImages.sleep, dogImages.angry, 
    dogImages.belly, dogImages.walk, dogImages.eating, dogImages.drinking,
    dogImages.bark, dogImages.pee, dogImages.dead, dogImages.sick
];

const totalImages = imagesToLoad.length;

function checkLoad() {
    imagesLoaded++;
    if (imagesLoaded >= totalImages) {
        startGame();
    }
}

imagesToLoad.forEach(img => {
    img.onload = checkLoad;
    img.onerror = checkLoad; 
});

setTimeout(() => {
    if (!gameStarted) {
        console.warn("Biztonsági indítás aktiválva.");
        startGame();
    }
}, 1500);

// Farkcsóváló animáció indítása
function startTailWag() {
    if (tailWagInterval) clearInterval(tailWagInterval);
    let toggle = false;
    tailWagInterval = setInterval(() => {
        if (dog.isDead || dog.isBusy || dog.health < 100 || dog.isInDoghouse) return;
        toggle = !toggle;
        dog.currentImage = toggle ? dogImages.idle2 : dogImages.idle;
    }, 350); 
}

function updateDogAppearance() {
    if (tailWagInterval) clearInterval(tailWagInterval);

    if (dog.health < 100) {
        dog.currentImage = dogImages.sick.complete ? dogImages.sick : dogImages.sleep;
    } else if (dog.isInDoghouse) {
        dog.currentImage = dogImages.sleep; 
    } else {
        dog.currentImage = dogImages.idle;
        startTailWag(); 
    }
}

function checkNightTimeLoop() {
    setInterval(() => {
        if (dog.isDead || dog.isBusy) return;

        const currentHour = new Date().getHours();
        const isNight = currentHour >= 22 || currentHour < 6;

        if (isNight && !dog.isInDoghouse) {
            goToDoghouseForNight();
        } else if (!isNight && dog.isInDoghouse && !dog.isBusy) {
            returnFromDoghouse();
        }
    }, 30000); 
}

function goToDoghouseForNight() {
    dog.isBusy = true;
    butterfly.active = false;
    squirrel.active = false;
    if (butterflyTimeout) clearTimeout(butterflyTimeout);
    if (squirrelTimeout) clearTimeout(squirrelTimeout);
    if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
    if (returnTimeout) clearTimeout(returnTimeout);
    if (currentAnimationId) cancelAnimationFrame(currentAnimationId);
    if (tailWagInterval) clearInterval(tailWagInterval);

    let targetX = doghouse.x + (doghouse.width / 2) - (dog.width / 2);
    let targetY = doghouse.y + doghouse.height - dog.height + 20;

    moveDogToCustom(targetX, targetY, () => {
        if (dog.isDead) return;
        dog.isInDoghouse = true;
        dog.isBusy = false;
        dog.currentImage = dogImages.sleep; 
    });
}

function returnFromDoghouse() {
    dog.isBusy = true;
    let targetX = dog.startX;
    let targetY = dog.startY;

    moveDogToCustom(targetX, targetY, () => {
        if (dog.isDead) return;
        dog.isInDoghouse = false;
        dog.isBusy = false;
        updateDogAppearance();
    });
}

function startStatsLoop() {
    setInterval(() => {
        if (dog.isDead) return;

        dog.hunger += 0.3;   
        dog.thirst += 0.4;   
        dog.bladder += 0.2;  

        dog.hunger = Math.min(100, Math.max(0, dog.hunger));
        dog.thirst = Math.min(100, Math.max(0, dog.thirst));
        dog.bladder = Math.min(100, Math.max(0, dog.bladder));

        if (dog.hunger > 85 || dog.thirst > 85 || dog.bladder > 90) {
            dog.health -= 1.5;
        } else if (dog.hunger < 50 && dog.thirst < 50 && dog.bladder < 50) {
            dog.health = Math.min(100, dog.health + 0.5);
        }

        if (dog.health <= 0) {
            dog.health = 0;
            dog.isDead = true;
            butterfly.active = false; 
            squirrel.active = false;
            if (butterflyTimeout) clearTimeout(butterflyTimeout);
            if (squirrelTimeout) clearTimeout(squirrelTimeout);
            if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
            if (tailWagInterval) clearInterval(tailWagInterval);
            if (returnTimeout) clearTimeout(returnTimeout);
            if (currentAnimationId) cancelAnimationFrame(currentAnimationId);
            
            dog.currentImage = dogImages.dead.complete ? dogImages.dead : dogImages.angry;
        }

        saveGameData();
    }, 1000);
}

function startButterflyLoop() {
    setInterval(() => {
        if (dog.isDead || dog.isBusy || butterfly.active || dog.isInDoghouse) return;

        if (Math.random() < 0.45) {
            butterfly.x = Math.random() * (canvas.width - 300) + 150;
            butterfly.y = Math.random() * 800 + 1200;
            butterfly.active = true;

            if (butterflyTimeout) clearTimeout(butterflyTimeout);
            butterflyTimeout = setTimeout(() => {
                if (!butterfly.active || dog.isDead || dog.isBusy) return;

                triggerDogAction(() => {
                    let targetX = butterfly.x - dog.width / 2 + 20;
                    let targetY = butterfly.y - dog.height / 2 + 20;

                    moveDogToCustom(targetX, targetY, () => {
                        if (dog.isDead) return;
                        dog.currentImage = dogImages.bark;
                        returnTimeout = setTimeout(() => {
                            if (dog.isDead) return;
                            butterfly.active = false;
                            animateBackToStart();
                        }, 2500);
                    });
                });
            }, 1500); 
        }
    }, 7000); 
}

function resetGame() {
    dog.health = 100;
    dog.hunger = 10;
    dog.thirst = 10;
    dog.bladder = 10;
    dog.isDead = false;
    dog.isInDoghouse = false;
    dog.x = dog.startX;
    dog.y = dog.startY;
    dog.isBusy = false;
    butterfly.active = false;
    squirrel.active = false;
    if (butterflyTimeout) clearTimeout(butterflyTimeout);
    if (squirrelTimeout) clearTimeout(squirrelTimeout);
    if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
    if (tailWagInterval) clearInterval(tailWagInterval);
    if (returnTimeout) clearTimeout(returnTimeout);
    if (currentAnimationId) cancelAnimationFrame(currentAnimationId);
    updateDogAppearance();
    saveGameData();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(treeImg, treeLeft.x, treeLeft.y, treeLeft.width, treeLeft.height);
    ctx.drawImage(treeImg, treeRight.x, treeRight.y, treeRight.width, treeRight.height);
    ctx.drawImage(doghouseImg, doghouse.x, doghouse.y, doghouse.width, doghouse.height);
    
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    
    if (butterfly.active && !dog.isDead) {
        ctx.drawImage(butterflyImg, butterfly.x, butterfly.y, butterfly.width, butterfly.height);
    }

    if (squirrel.active && !dog.isDead) {
        ctx.drawImage(squirrelImg, squirrel.x, squirrel.y, squirrel.width, squirrel.height);
    }

    if (dog.isDead) {
        ctx.drawImage(dogImages.dead.complete ? dogImages.dead : dogImages.angry, dog.x, dog.y, dog.width, dog.height);
    } else {
        ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    }

    drawHUD();
    requestAnimationFrame(gameLoop);
}

function drawHUD() {
    if (dog.isDead) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(dogImages.dead.complete ? dogImages.dead : dogImages.angry, canvas.width / 2 - 125, canvas.height / 2 - 320, 250, 250);
        
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 70px Arial";
        ctx.textAlign = "center";
        ctx.fillText("A KUTYA MEGHALT!", canvas.width / 2, canvas.height / 2 - 120);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "35px Arial";
        ctx.fillText("Nem gondoskodtál róla időben...", canvas.width / 2, canvas.height / 2 - 50);

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(resetButton.x, resetButton.y, resetButton.width, resetButton.height);
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(resetButton.x, resetButton.y, resetButton.width, resetButton.height);

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "28px Arial";
        ctx.fillText("Újrakezdés", canvas.width / 2, resetButton.y + resetButton.height / 2 + 10);

        ctx.textAlign = "left";
        return; 
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(50, 50, 980, 140);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, 980, 140);

    drawBar(80, 75, 400, 25, "Életcsík", dog.health, "#e74c3c");
    drawBar(550, 75, 400, 25, "Éhség", 100 - dog.hunger, "#e67e22");
    drawBar(80, 125, 400, 25, "Szomjúság", 100 - dog.thirst, "#3498db");
    drawBar(550, 125, 400, 25, "Pisilés", 100 - dog.bladder, "#f1c40f");
}

function drawBar(x, y, w, h, label, value, color) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    ctx.fillText(`${label}:`, x, y - 5);

    ctx.fillStyle = "#444444";
    ctx.fillRect(x + 110, y - 20, w - 110, h);

    ctx.fillStyle = color;
    let fillWidth = Math.max(0, ((w - 110) * (value / 100)));
    ctx.fillRect(x + 110, y - 20, fillWidth, h);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 110, y - 20, w - 110, h);
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

canvas.addEventListener("pointerdown", (e) => {
    requestFullscreenOnce(); 

    const coords = getCanvasCoords(e);
    const startX = coords.x;
    const startY = coords.y;

    if (dog.isDead) {
        if (startX >= resetButton.x && startX <= resetButton.x + resetButton.width &&
            startY >= resetButton.y && startY <= resetButton.y + resetButton.height) {
            resetGame();
        }
        return; 
    }

    if (e.cancelable) e.preventDefault();

    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

    const padding = 60;
    if (startX >= dog.x - padding && startX <= dog.x + dog.width + padding && 
        startY >= dog.y - padding && startY <= dog.y + dog.height + padding) {
        
        longPressTimer = setTimeout(() => {
            longPressTimer = null;
            if (dog.isDead) return;
            dog.isBusy = true;
            butterfly.active = false; 
            squirrel.active = false;
            if (butterflyTimeout) clearTimeout(butterflyTimeout);
            if (squirrelTimeout) clearTimeout(squirrelTimeout);
            if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
            if (tailWagInterval) clearInterval(tailWagInterval);
            if (returnTimeout) clearTimeout(returnTimeout);
            if (currentAnimationId) cancelAnimationFrame(currentAnimationId);

            dog.currentImage = dogImages.belly;
            dog.health = Math.min(100, dog.health + 5); 
            saveGameData();
            
            returnTimeout = setTimeout(() => { 
                if (dog.isDead) return;
                updateDogAppearance(); 
                dog.isBusy = false; 
                saveGameData();
            }, 2000);
        }, 400);
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (dog.isDead) return; 

    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    const coords = getCanvasCoords(e);
    const moveX = coords.x;
    const moveY = coords.y;
    const padding = 60;

    if (moveX >= doghouse.x && moveX <= doghouse.x + doghouse.width && moveY >= doghouse.y && moveY <= doghouse.y + doghouse.height) {
        if (dog.isBusy || dog.isInDoghouse) return;
        
        triggerDogAction(() => {
            butterfly.active = false;
            squirrel.active = false;
            if (butterflyTimeout) clearTimeout(butterflyTimeout);
            if (squirrelTimeout) clearTimeout(squirrelTimeout);
            if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);

            let targetX = doghouse.x + (doghouse.width / 2) - (dog.width / 2);
            let targetY = doghouse.y + doghouse.height - dog.height + 20;

            moveDogToCustom(targetX, targetY, () => {
                if (dog.isDead) return;
                dog.currentImage = dogImages.sleep; 
                
                returnTimeout = setTimeout(() => {
                    if (dog.isDead) return;
                    animateBackToStart(); 
                }, 5000); 
            });
        });
        return;
    }

    if (butterfly.active && moveX >= butterfly.x - 40 && moveX <= butterfly.x + butterfly.width + 40 &&
        moveY >= butterfly.y - 40 && moveY <= butterfly.y + butterfly.height + 40) {
        
        if (butterflyTimeout) clearTimeout(butterflyTimeout);
        triggerDogAction(() => {
            let targetX = butterfly.x - dog.width / 2 + 20;
            let targetY = butterfly.y - dog.height / 2 + 20;

            moveDogToCustom(targetX, targetY, () => {
                if (dog.isDead) return;
                dog.currentImage = dogImages.bark;
                returnTimeout = setTimeout(() => {
                    if (dog.isDead) return;
                    butterfly.active = false;
                    animateBackToStart();
                }, 2500);
            });
        });
        return;
    }

    if (moveX >= dog.x - padding && moveX <= dog.x + dog.width + padding && 
        moveY >= dog.y - padding && moveY <= dog.y + dog.height + padding) {
        
        if (dog.isBusy) return;
        dog.isBusy = true;
        butterfly.active = false;
        squirrel.active = false;
        if (butterflyTimeout) clearTimeout(butterflyTimeout);
        if (squirrelTimeout) clearTimeout(squirrelTimeout);
        if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
        if (tailWagInterval) clearInterval(tailWagInterval);
        if (returnTimeout) clearTimeout(returnTimeout);
        if (currentAnimationId) cancelAnimationFrame(currentAnimationId);

        dog.currentImage = dogImages.angry;
        returnTimeout = setTimeout(() => { 
            if (dog.isDead) return;
            updateDogAppearance(); 
            dog.isBusy = false; 
        }, 1500);
        return;
    }

    if (moveX >= treeLeft.x && moveX <= treeLeft.x + treeLeft.width && moveY >= treeLeft.y && moveY <= treeLeft.y + treeLeft.height) {
        triggerDogAction(() => {
            butterfly.active = false;
            squirrel.active = false;
            if (butterflyTimeout) clearTimeout(butterflyTimeout);
            if (squirrelTimeout) clearTimeout(squirrelTimeout);
            if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
            let targetX = treeLeft.x + (treeLeft.width / 2) - (dog.width / 2) - 60;
            let targetY = treeLeft.y + treeLeft.height - 230; 
            moveDogToCustom(targetX, targetY, () => {
                if (dog.isDead) return;
                dog.currentImage = dogImages.pee;
                dog.bladder = 0; 
                saveGameData();
                returnTimeout = setTimeout(() => { if (!dog.isDead) animateBackToStart(); }, 2500);
            });
        });
        return;
    }

    if (moveX >= treeRight.x && moveX <= treeRight.x + treeRight.width && moveY >= treeRight.y && moveY <= treeRight.y + treeRight.height) {
        triggerDogAction(() => {
            butterfly.active = false;
            squirrel.active = false;
            if (butterflyTimeout) clearTimeout(butterflyTimeout);
            if (squirrelTimeout) clearTimeout(squirrelTimeout);
            if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
            let targetX = treeRight.x + (treeRight.width / 2) - (dog.width / 2) - 60;
            let targetY = treeRight.y + treeRight.height - 230; 
            moveDogToCustom(targetX, targetY, () => {
                if (dog.isDead) return;
                dog.currentImage = dogImages.pee;
                dog.bladder = 0; 
                saveGameData();
                returnTimeout = setTimeout(() => { if (!dog.isDead) animateBackToStart(); }, 2500);
            });
        });
        return;
    }

    let clickedBowl = false;
    Object.values(bowls).forEach(bowl => {
        if (moveX >= bowl.x && moveX <= bowl.x + bowl.width && moveY >= bowl.y && moveY <= bowl.y + bowl.height) {
            clickedBowl = true;
            triggerDogAction(() => {
                butterfly.active = false;
                squirrel.active = false;
                if (butterflyTimeout) clearTimeout(butterflyTimeout);
                if (squirrelTimeout) clearTimeout(squirrelTimeout);
                if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
                bowl.isFull = true; 
                bowl.img = bowl.fullImg;
                
                const isFoodBowl = (bowl === bowls.food);
                const imgAsset = isFoodBowl ? dogImages.eating : dogImages.drinking;
                
                let targetX = (bowl.x + (bowl.width / 2) - (dog.width / 2)) + 70;
                let targetY = bowl.y - 120; 

                moveDogToExplicit(targetX, targetY, imgAsset, () => { 
                    if (dog.isDead) return;
                    bowl.isFull = false; 
                    bowl.img = bowl.emptyImg;
                    
                    if (isFoodBowl) {
                        dog.hunger = Math.max(0, dog.hunger - 40);
                    } else {
                        dog.thirst = Math.max(0, dog.thirst - 40);
                    }
                    saveGameData();
                });
            });
        }
    });

    if (clickedBowl) return;
    
    triggerDogAction(() => {
        butterfly.active = false;
        if (butterflyTimeout) clearTimeout(butterflyTimeout);
        if (squirrelTimeout) clearTimeout(squirrelTimeout);
        if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);

        squirrel.baseX = moveX - squirrel.width / 2;
        squirrel.baseY = moveY - squirrel.height / 2;
        squirrel.x = squirrel.baseX;
        squirrel.y = squirrel.baseY;
        squirrel.active = true;

        squirrelMoveInterval = setInterval(() => {
            if (!squirrel.active || dog.isDead) return;
            let randomOffsetX = (Math.random() - 0.5) * 70;
            let randomOffsetY = (Math.random() - 0.5) * 70;
            squirrel.x = squirrel.baseX + randomOffsetX;
            squirrel.y = squirrel.baseY + randomOffsetY;
        }, 600);

        squirrelTimeout = setTimeout(() => {
            if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
            if (!squirrel.active || dog.isDead) return;

            let targetX = squirrel.x - dog.width / 2 + 20;
            let targetY = squirrel.y - dog.height / 2 + 20;

            moveDogToCustom(targetX, targetY, () => {
                if (dog.isDead) return;
                dog.currentImage = dogImages.bark; 
                
                returnTimeout = setTimeout(() => {
                    if (dog.isDead) return;
                    squirrel.active = false;
                    animateBackToStart();
                }, 2500);
            });
        }, 3500);
    });
});

function triggerDogAction(actionCallback) {
    if (dog.isDead) return;
    if (returnTimeout) { clearTimeout(returnTimeout); returnTimeout = null; }
    if (currentAnimationId) { cancelAnimationFrame(currentAnimationId); currentAnimationId = null; }
    if (tailWagInterval) clearInterval(tailWagInterval);
    dog.isBusy = false;
    actionCallback();
}

function moveDogToExplicit(targetX, targetY, img, onComplete) {
    if (dog.isDead) return;
    dog.isBusy = true;
    const animateToBowl = () => {
        if (dog.isDead) return;
        let dx = targetX - dog.x; let dy = targetY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            currentAnimationId = requestAnimationFrame(animateToBowl);
        } else {
            dog.x = targetX; dog.y = targetY; dog.currentImage = img;
            returnTimeout = setTimeout(() => { 
                if (dog.isDead) return;
                animateBackToStart(); 
                if (onComplete) onComplete(); 
            }, 2000);
        }
    };
    animateToBowl();
}

function moveDogToCustom(targetX, targetY, onComplete) {
    if (dog.isDead) return;
    dog.isBusy = true;
    const animateCustom = () => {
        if (dog.isDead) return;
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
    if (dog.isDead) return;
    dog.isBusy = true;
    const stepBack = () => {
        if (dog.isDead) return;
        let dx = dog.startX - dog.x; let dy = dog.startY - dog.y;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            dog.x += dx * 0.15; dog.y += dy * 0.15;
            dog.currentImage = dogImages.walk;
            currentAnimationId = requestAnimationFrame(stepBack);
        } else {
            dog.x = dog.startX;
            dog.y = dog.startY;
            dog.isBusy = false; 
            currentAnimationId = null;
            updateDogAppearance(); 
            saveGameData();
        }
    };
    stepBack();
}
