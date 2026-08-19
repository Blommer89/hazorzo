const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1080;
canvas.height = 2340;

// ANIMÁCIÓS ÉS IDŐZÍTŐ VÁLTOZÓK
let currentAnimationId = null;
let returnTimeout = null;
let longPressTimer = null;
let butterflyTimeout = null;
let squirrelTimeout = null;
let squirrelMoveInterval = null;
let tailWagInterval = null;
let peeInterval = null;
let postmanEventInterval = null;
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
const keritesImg = new Image(); keritesImg.src = "assets/kerites.png";
const postasImg = new Image(); postasImg.src = "assets/postas.png";

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

// Kutya adatai (eredeti, pontos pozíciók)
let dog = { 
    x: 415, y: 1650, 
    startX: 415, startY: 1650, 
    width: 250, height: 250, 
    currentImage: dogImages.idle,
    isBusy: false,
    isDead: false,
    isInDoghouse: false, 
    isPeeing: false,
    isBarkingAtPostman: false,
    
    health: 100,
    hunger: 10,   
    thirst: 10,   
    bladder: 10   
};

// Postás adatai
let postman = {
    x: -150, y: 1830,
    width: 150, height: 200,
    active: false,
    speed: 12
};

let keritesPattern = null;

let butterfly = { x: 0, y: 0, width: 100, height: 100, active: false };
let squirrel = { x: 0, y: 0, baseX: 0, baseY: 0, width: 100, height: 100, active: false };

const treeLeft = { x: 80, y: 200, width: 320, height: 420 };
const treeRight = { x: 680, y: 350, width: 320, height: 420 };
const doghouse = { x: 600, y: 950, width: 300, height: 300 };

const bowls = {
    water: { x: 590, y: 1300, width: 90, height: 90, img: bowlWaterEmptyImg, fullImg: bowlWaterImg, emptyImg: bowlWaterEmptyImg, isFull: false },
    food: { x: 750, y: 1350, width: 90, height: 90, img: bowlFoodEmptyImg, fullImg: bowlFoodImg, emptyImg: bowlFoodEmptyImg, isFull: false }
};

const resetButton = { x: 340, y: 1550, width: 400, height: 90 };

// Mentési rendszer
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

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        if (keritesImg.complete) {
            keritesPattern = ctx.createPattern(keritesImg, 'repeat-x');
        } else {
            keritesImg.onload = () => {
                keritesPattern = ctx.createPattern(keritesImg, 'repeat-x');
            };
        }

        gameLoop();
        startStatsLoop(); 
        startButterflyLoop(); 
        checkNightTimeLoop(); 
        startPeeLoop();
        startPostmanEventLoop();
    }
}

let imagesLoaded = 0;
const imagesToLoad = [
    yardImg, doghouseImg, treeImg, 
    bowlWaterImg, bowlWaterEmptyImg, bowlFoodImg, bowlFoodEmptyImg,
    butterflyImg, squirrelImg, keritesImg, postasImg,
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
        startGame();
    }
}, 1500);

// ==================================================================================
// POSTÁS ESEMÉNY (2 percenként)
// ==================================================================================

function startPostmanEventLoop() {
    if (postmanEventInterval) clearInterval(postmanEventInterval);
    
    postmanEventInterval = setInterval(() => {
        if (dog.isDead || dog.isBusy || dog.isInDoghouse || dog.isPeeing || postman.active) return;
        
        postman.x = -postman.width;
        postman.active = true;
        animatePostmanArrival();
        
    }, 120000); 
}

function animatePostmanArrival() {
    let targetX = canvas.width / 2 - postman.width / 2;
    
    const movePostman = () => {
        if (!postman.active || dog.isDead) return;
        
        if (postman.x < targetX) {
            postman.x += postman.speed;
            requestAnimationFrame(movePostman);
        } else {
            onPostmanArrived();
        }
    };
    movePostman();
}

function onPostmanArrived() {
    if (dog.isDead || dog.isInDoghouse) {
        startPostmanDeparture();
        return;
    }

    if (butterflyTimeout) clearTimeout(butterflyTimeout);
    if (squirrelTimeout) clearTimeout(squirrelTimeout);
    if (squirrelMoveInterval) clearInterval(squirrelMoveInterval);
    if (tailWagInterval) clearInterval(tailWagInterval);
    if (returnTimeout) clearTimeout(returnTimeout);
    if (currentAnimationId) cancelAnimationFrame(currentAnimationId);
    dog.isBusy = true;

    let targetDogX = postman.x + postman.width + 10; 
    let targetDogY = 1650;

    moveDogToCustom(targetDogX, targetDogY, () => {
        if (dog.isDead) return;
        dog.isBarkingAtPostman = true;
        dog.currentImage = dogImages.bark;
        
        returnTimeout = setTimeout(() => {
            if (dog.isDead) return;
            dog.isBarkingAtPostman = false;
            dog.currentImage = dogImages.idle;
            
            animateBackToStart();
            startPostmanDeparture();
        }, 4000);
    });
}

function startPostmanDeparture() {
    const movePostmanOut = () => {
        if (!postman.active || dog.isDead) return;
        
        if (postman.x < canvas.width) {
            postman.x += postman.speed;
            requestAnimationFrame(movePostmanOut);
        } else {
            postman.active = false;
            postman.x = -postman.width;
        }
    };
    movePostmanOut();
}

// ==================================================================================
// PISILÉS ÉS ÉJSZAKAI ALVÁS LOGIKA
// ==================================================================================

function startPeeLoop() {
    if (peeInterval) clearInterval(peeInterval);
    peeInterval = setInterval(() => {
        if (dog.isDead || dog.isBusy || dog.isInDoghouse || dog.isPeeing || dog.isBarkingAtPostman || postman.active) return;

        if (dog.bladder >= 70) {
            triggerPeeBehavior();
        }
    }, 15000);
}

function triggerPeeBehavior() {
    dog.isBusy = true;
    dog.isPeeing = true;
    if (tailWagInterval) clearInterval(tailWagInterval);

    let treeTargetX = treeLeft.x + 100;
    let treeTargetY = treeLeft.y + 280;

    moveDogToCustom(treeTargetX, treeTargetY, () => {
        if (dog.isDead) return;
        dog.currentImage = dogImages.pee;

        returnTimeout = setTimeout(() => {
            if (dog.isDead) return;
            dog.bladder = 0;
            dog.isPeeing = false;
            animateBackToStart();
        }, 4000);
    });
}

function checkNightTimeLoop() {
    setInterval(() => {
        if (dog.isDead || dog.isBusy || dog.isPeeing || dog.isBarkingAtPostman) return;
        const currentHour = new Date().getHours();
        const isNight = currentHour >= 22 || currentHour < 6;
        if (isNight && !dog.isInDoghouse) {
            dog.isInDoghouse = true;
            dog.x = doghouse.x + 25;
            dog.y = doghouse.y + 25;
            updateDogAppearance();
        } else if (!isNight && dog.isInDoghouse) {
            dog.isInDoghouse = false;
            dog.x = dog.startX;
            dog.y = dog.startY;
            updateDogAppearance();
        }
    }, 60000);
}

// ==================================================================================
// MOZGATÁSI ÉS ANIMÁCIÓS SEGÉDEK (Eredeti, gyors sebesség)
// ==================================================================================

function moveDogTo(targetX, targetY, targetImage, onArrived) {
    if (dog.isBusy || dog.isDead) return;
    dog.isBusy = true;
    if (tailWagInterval) clearInterval(tailWagInterval);

    let speed = 15; 
    const step = () => {
        if (dog.isDead) return;
        let dx = targetX - dog.x;
        let dy = targetY - dog.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > speed) {
            dog.x += (dx / dist) * speed;
            dog.y += (dy / dist) * speed;
            dog.currentImage = dogImages.walk;
            currentAnimationId = requestAnimationFrame(step);
        } else {
            dog.x = targetX;
            dog.y = targetY;
            dog.currentImage = targetImage;
            if (onArrived) onArrived();
        }
    };
    step();
}

function moveDogToCustom(targetX, targetY, callback) {
    let speed = 15; 
    const step = () => {
        if (dog.isDead) return;
        let dx = targetX - dog.x;
        let dy = targetY - dog.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > speed) {
            dog.x += (dx / dist) * speed;
            dog.y += (dy / dist) * speed;
            dog.currentImage = dogImages.walk;
            currentAnimationId = requestAnimationFrame(step);
        } else {
            dog.x = targetX;
            dog.y = targetY;
            if (callback) callback();
        }
    };
    step();
}

function animateBackToStart() {
    moveDogToCustom(dog.startX, dog.startY, () => {
        dog.isBusy = false;
        updateDogAppearance();
    });
}

function startTailWag() {
    if (tailWagInterval) clearInterval(tailWagInterval);
    let toggle = false;
    tailWagInterval = setInterval(() => {
        if (dog.isDead || dog.isBusy || dog.health < 100 || dog.isInDoghouse || dog.isPeeing || dog.isBarkingAtPostman) return;
        toggle = !toggle;
        dog.currentImage = toggle ? dogImages.idle2 : dogImages.idle;
    }, 350); 
}

function updateDogAppearance() {
    if (tailWagInterval) clearInterval(tailWagInterval);

    if (dog.isPeeing) {
        dog.currentImage = dogImages.pee;
    } else if (dog.isBarkingAtPostman) {
        dog.currentImage = dogImages.bark;
    } else if (dog.health < 100) {
        dog.currentImage = dogImages.sick.complete ? dogImages.sick : dogImages.sleep;
    } else if (dog.isInDoghouse) {
        dog.currentImage = dogImages.sleep; 
    } else {
        dog.currentImage = dogImages.idle;
        startTailWag(); 
    }
}

function startStatsLoop() {
    setInterval(() => {
        if (dog.isDead) return;

        dog.hunger = Math.min(100, dog.hunger + 0.1);
        dog.thirst = Math.min(100, dog.thirst + 0.15);
        dog.bladder = Math.min(100, dog.bladder + 0.08);

        if (dog.hunger > 85 || dog.thirst > 85 || dog.bladder > 90) {
            dog.health = Math.max(0, dog.health - 0.5);
        } else if (dog.hunger < 50 && dog.thirst < 50 && dog.bladder < 50) {
            dog.health = Math.min(100, dog.health + 0.2);
        }

        if (dog.health <= 0) {
            dog.health = 0;
            dog.isDead = true;
            dog.currentImage = dogImages.dead;
            dog.isBusy = true;
        }

        saveGameData();
    }, 1000);
}

function startButterflyLoop() {
    // Pillangó hurok helye
}

// ==================================================================================
// KATTINTÁSI ESEMÉNYEK KEZELÉSE
// ==================================================================================

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (dog.isDead) {
        if (x >= resetButton.x && x <= resetButton.x + resetButton.width &&
            y >= resetButton.y && y <= resetButton.y + resetButton.height) {
            dog.health = 100;
            dog.hunger = 10;
            dog.thirst = 10;
            dog.bladder = 10;
            dog.isDead = false;
            dog.isBusy = false;
            dog.x = dog.startX;
            dog.y = dog.startY;
            updateDogAppearance();
            saveGameData();
        }
        return;
    }

    if (dog.isBusy || dog.isInDoghouse || dog.isPeeing || dog.isBarkingAtPostman) return;

    // Víz tál kattintás (tál feltöltése vagy ivás)
    if (x >= bowls.water.x && x <= bowls.water.x + bowls.water.width &&
        y >= bowls.water.y && y <= bowls.water.y + bowls.water.height) {
        if (!bowls.water.isFull) {
            bowls.water.isFull = true;
        } else {
            moveDogTo(bowls.water.x - 60, bowls.water.y + 10, dogImages.drinking, () => {
                returnTimeout = setTimeout(() => {
                    dog.thirst = Math.max(0, dog.thirst - 40);
                    bowls.water.isFull = false;
                    animateBackToStart();
                }, 3000);
            });
        }
        return;
    }

    // Kaja tál kattintás (tál feltöltése vagy evés)
    if (x >= bowls.food.x && x <= bowls.food.x + bowls.food.width &&
        y >= bowls.food.y && y <= bowls.food.y + bowls.food.height) {
        if (!bowls.food.isFull) {
            bowls.food.isFull = true;
        } else {
            moveDogTo(bowls.food.x - 60, bowls.food.y + 10, dogImages.eating, () => {
                returnTimeout = setTimeout(() => {
                    dog.hunger = Math.max(0, dog.hunger - 40);
                    bowls.food.isFull = false;
                    animateBackToStart();
                }, 3000);
            });
        }
        return;
    }

    // Kutya simogatás / mérgeskedés
    if (x >= dog.x && x <= dog.x + dog.width && y >= dog.y && y <= dog.y + dog.height) {
        dog.isBusy = true;
        if (tailWagInterval) clearInterval(tailWagInterval);
        dog.currentImage = dogImages.angry;

        returnTimeout = setTimeout(() => {
            dog.isBusy = false;
            updateDogAppearance();
        }, 2000);
    }
});

// ==================================================================================
// FŐ RENDERELÉSI CIKLUS
// ==================================================================================

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Udvar háttér
    if (yardImg.complete) {
        ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    }

    // 2. Kutyaház
    if (doghouseImg.complete) {
        ctx.drawImage(doghouseImg, doghouse.x, doghouse.y, doghouse.width, doghouse.height);
    }

    // 3. Fák
    if (treeImg.complete) {
        ctx.drawImage(treeImg, treeLeft.x, treeLeft.y, treeLeft.width, treeLeft.height);
        ctx.drawImage(treeImg, treeRight.x, treeRight.y, treeRight.width, treeRight.height);
    }

    // 4. Tálak
    let waterImage = bowls.water.isFull ? bowls.water.fullImg : bowls.water.emptyImg;
    if (waterImage.complete) {
        ctx.drawImage(waterImage, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    }
    let foodImage = bowls.food.isFull ? bowls.food.fullImg : bowls.food.emptyImg;
    if (foodImage.complete) {
        ctx.drawImage(foodImage, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    }

    // 5. Postás (ha aktív)
    if (postman.active && postasImg.complete) {
        ctx.drawImage(postasImg, postman.x, postman.y, postman.width, postman.height);
    }

    // 6. Kerítés a kert alján
    if (keritesPattern) {
        ctx.save();
        ctx.fillStyle = keritesPattern;
        let fenceHeight = 150; 
        ctx.fillRect(0, canvas.height - fenceHeight, canvas.width, fenceHeight);
        ctx.restore();
    } else if (keritesImg.complete) {
        ctx.drawImage(keritesImg, 0, canvas.height - 150, canvas.width, 150);
    }

    // 7. Kutya rajzolása
    if (dog.currentImage && dog.currentImage.complete) {
        ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
    }

    // 8. Statisztikák megjelenítése tetején
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(50, 50, 980, 120);

    ctx.fillStyle = "white";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`Életerő: ${Math.round(dog.health)}%`, 80, 100);
    ctx.fillText(`Éhség: ${Math.round(dog.hunger)}%`, 380, 100);
    ctx.fillText(`Szomj: ${Math.round(dog.thirst)}%`, 680, 100);

    if (dog.isDead) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 60px sans-serif";
        ctx.fillText("A KUTYA ELPUSZTULT", 220, 1050);

        // Újraindítás / frissítés gomb
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(resetButton.x, resetButton.y, resetButton.width, resetButton.height);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 40px sans-serif";
        ctx.fillText("ÚJRAINDÍTÁS", resetButton.x + 65, resetButton.y + 60);
    }

    requestAnimationFrame(gameLoop);
}
