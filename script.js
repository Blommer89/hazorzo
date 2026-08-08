const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Belső fix felbontás beállítása (klasszikus retro 4:3)
canvas.width = 384;
canvas.height = 288;

// Különálló képek betöltése
const yardImg = new Image();
yardImg.src = "assets/yard.png";

const dogImages = {
    idle: new Image(),
    angry: new Image(),
    belly: new Image(),
    walk: new Image()
};

dogImages.idle.src = "assets/dog_idle.png";
dogImages.angry.src = "assets/dog_angry.png";
dogImages.belly.src = "assets/dog_belly.png";
dogImages.walk.src = "assets/dog_walk.png";

// Kutyus objektum az adatokkal és pozícióval
let dog = {
    x: 150,
    y: 160,
    width: 48,
    height: 48,
    state: "Alap (Idle)",
    currentImage: dogImages.idle // Alapértelmezett kép
};

// Várjuk meg, amíg minden kép betöltődik, mielőtt elindítjuk a ciklust
let totalImages = 5;
let imagesLoaded = 0;

function imageLoadedCheck() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop();
    }
}

yardImg.onload = imageLoadedCheck;
Object.values(dogImages).forEach(img => img.onload = imageLoadedCheck);

// Fő Játék Ciklus (Loop)
function gameLoop() {
    // 1. Udvar háttér kirajzolása
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);

    // 2. Kutyus kirajzolása az aktuális képpel
    ctx.drawImage(
        dog.currentImage, 
        dog.x, dog.y, dog.width, dog.height
    );

    // 3. Állapot szöveg megjelenítése retro fekete árnyékkal
    ctx.fillStyle = "#000";
    ctx.font = "12px monospace";
    ctx.fillText(`Állapot: ${dog.state}`, 11, 21);
    ctx.fillStyle = "#fff";
    ctx.fillText(`Állapot: ${dog.state}`, 10, 20);

    requestAnimationFrame(gameLoop);
}

// --- INTERAKCIÓK ÉS VEZÉRLÉS ---

let pressTimer;
let isLongPress = false;

// Kattintás / Érintés kezdete
canvas.addEventListener("mousedown", (e) => startInteraction(e));
canvas.addEventListener("touchstart", (e) => {
    startInteraction(e.touches[0]);
    e.preventDefault();
});

function startInteraction(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Ha a kutyusra kattintottak
    if (
        clickX >= dog.x &&
        clickX <= dog.x + dog.width &&
        clickY >= dog.y &&
        clickY <= dog.y + dog.height
    ) {
        isLongPress = false;
        
        // Hosszú nyomás időzítő (Simizés)
        pressTimer = setTimeout(() => {
            isLongPress = true;
            dog.state = "Hasra fekszik... 😊";
            dog.currentImage = dogImages.belly;
        }, 500);
    }
}

// Kattintás / Érintés vége
canvas.addEventListener("mouseup", () => endInteraction());
canvas.addEventListener("touchend", () => endInteraction());

function endInteraction() {
    clearTimeout(pressTimer);
    
    // Rövid kattintás (Megsértődés)
    if (!isLongPress && dog.state === "Alap (Idle)") {
        dog.state = "Megsértődött! 💢";
        dog.currentImage = dogImages.angry;
        
        setTimeout(() => {
            dog.state = "Alap (Idle)";
            dog.currentImage = dogImages.idle;
        }, 1500);
    } else if (isLongPress) {
        // Simizés vége
        isLongPress = false;
        dog.state = "Alap (Idle)";
        dog.currentImage = dogImages.idle;
    }
}

// Sima odafuttató függvény koordinátákra
function moveDogTo(targetX, targetY, customState, imgAsset) {
    dog.state = customState;
    dog.currentImage = imgAsset;

    const animateMove = () => {
        let dx = targetX - dog.x;
        let dy = targetY - dog.y;
        
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            dog.x += dx * 0.08;
            dog.y += dy * 0.08;
            requestAnimationFrame(animateMove);
        } else {
            dog.x = targetX;
            dog.y = targetY;
            dog.state = "Alap (Idle)";
            dog.currentImage = dogImages.idle;
        }
    };
    animateMove();
}

// UI Gombok eseményei
document.getElementById("btn-whistle").addEventListener("click", () => {
    moveDogTo(150, 160, "Odafut a sípra! 📯", dogImages.walk);
});

document.getElementById("btn-food").addEventListener("click", () => {
    moveDogTo(80, 180, "Eszik a tálból... 🍖", dogImages.walk);
});

document.getElementById("btn-water").addEventListener("click", () => {
    moveDogTo(250, 180, "Iszik a tálból... 💧", dogImages.walk);
});

// Biztos ami biztos fallback, ha a képek lassabban töltenének
setTimeout(() => {
    if (imagesLoaded < totalImages) {
        console.log("Képek betöltési időtúllépés, játék indítása kényszerítve.");
        gameLoop();
    }
}, 1500);
