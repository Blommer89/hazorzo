const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Belső fix felbontás beállítása (klasszikus retro 4:3)
canvas.width = 384;
canvas.height = 288;

// Képek betöltése
const yardImg = new Image();
yardImg.src = "assets/yard.png";

const dogImg = new Image();
dogImg.src = "assets/dog.png";

// Kutyus objektum az adatokkal és pozícióval
let dog = {
    x: 150,
    y: 160,
    width: 48,
    height: 48,
    state: "Alap (Idle)",
    frameX: 0 // Sprite sheet aktuális oszlopa (0 = alap, 1 = dühös, 2 = hasra fekvés, stb.)
};

// Várjuk meg, amíg mindkét kép betöltődik, mielőtt elindítjuk a ciklust
let imagesLoaded = 0;
function imageLoadedCheck() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        gameLoop();
    }
}

yardImg.onload = imageLoadedCheck;
dogImg.onload = imageLoadedCheck;

// Fő Játék Ciklus (Loop)
function gameLoop() {
    // 1. Udvar háttér kirajzolása
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);

    // 2. Kutyus kirajzolása (Sprite sheet darabolás vagy sima kép)
    ctx.drawImage(
        dogImg, 
        dog.frameX * 48, 0, 48, 48, // Kivágás a sprite-ból (ha egymás mellett vannak)
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

// Kattintás / Érintés kezdete (Megsértődés vagy Simizés indítása)
canvas.addEventListener("mousedown", (e) => {
    startInteraction(e);
});

canvas.addEventListener("touchstart", (e) => {
    // Mobilos érintés támogatása
    const touch = e.touches[0];
    startInteraction(touch);
    e.preventDefault();
});

function startInteraction(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Ha a kutyusra kattintott/bökte
    if (
        clickX >= dog.x &&
        clickX <= dog.x + dog.width &&
        clickY >= dog.y &&
        clickY <= dog.y + dog.height
    ) {
        isLongPress = false;
        
        // Időzítő a hosszabb nyomásra (Simizés)
        pressTimer = setTimeout(() => {
            isLongPress = true;
            dog.state = "Hasra fekszik... 😊";
            dog.frameX = 2; // Feltételezve, hogy a 3. fázis a hasra fekvés
        }, 500); // Fél másodperc nyomva tartás után simizés lesz
    }
}

// Kattintás / Érintés vége
canvas.addEventListener("mouseup", () => endInteraction());
canvas.addEventListener("touchend", () => endInteraction());

function endInteraction() {
    clearTimeout(pressTimer);
    
    // Ha rövid kattintás volt (nem volt hosszan nyomva)
    if (!isLongPress && dog.state === "Alap (Idle)") {
        dog.state = "Megsértődött! 💢";
        dog.frameX = 1; // 2. fázis: mérges
        
        setTimeout(() => {
            dog.state = "Alap (Idle)";
            dog.frameX = 0;
        }, 1500);
    } else if (isLongPress) {
        // Ha véget ért a simizés
        isLongPress = false;
        dog.state = "Alap (Idle)";
        dog.frameX = 0;
    }
}

// Sima odafuttató függvény koordinátákra
function moveDogTo(targetX, targetY, customState, frameIndex) {
    dog.state = customState;
    dog.frameX = frameIndex;

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
            // Megérkezés után visszatér alapba
            dog.state = "Alap (Idle)";
            dog.frameX = 0;
        }
    };
    animateMove();
}

// UI Gombok eseményei
document.getElementById("btn-whistle").addEventListener("click", () => {
    moveDogTo(150, 160, "Odafut a sípra! 📯", 3); // Séta/futás fázis
});

document.getElementById("btn-food").addEventListener("click", () => {
    moveDogTo(80, 180, "Eszik a tálból... 🍖", 0);
});

document.getElementById("btn-water").addEventListener("click", () => {
    moveDogTo(250, 180, "Iszik a tálból... 💧", 0);
});

// Biztos ami biztos fallback, ha a képek valamiért nem lőnék be az onload-ot
setTimeout(() => {
    if (imagesLoaded < 2) {
        console.log("Képek betöltési időtúllépés, játék indítása kényszerítve.");
        gameLoop();
    }
}, 1000);
