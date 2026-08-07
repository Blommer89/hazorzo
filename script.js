const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Belső fix felbontás beállítása
canvas.width = 384;
canvas.height = 288;

// Képek betöltése
const yardImg = new Image();
yardImg.src = "assets/yard.png";

const dogImg = new Image();
dogImg.src = "assets/dog.png";

// Kutyus objektum az adatokkal
let dog = {
    x: 150,
    y: 160,
    width: 48,
    height: 48,
    state: "Alap (Idle)",
    // Ha a sprite sheetben egymás mellett vannak a fázisok, itt válthatjuk az x eltolást (frameX)
    frameX: 0 
};

// Várjuk meg, amíg betöltődnek a képek, mielőtt indítjuk a ciklust
let imagesLoaded = 0;
function imageLoadedCheck() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        gameLoop();
    }
}

yardImg.onload = imageLoadedCheck;
dogImg.onload = imageLoadedCheck;

// Fő Játék Ciklus
function gameLoop() {
    // 1. Háttér (udvar) kirajzolása a teljes vászonra
    ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);

    // 2. Kutyus kirajzolása
    // (drawImage syntax: kép, forrásX, forrásY, forrásSzélesség, forrásMagasság, 
    //  célX, célY, célSzélesség, célMagasság)
    ctx.drawImage(
        dogImg, 
        dog.frameX * 48, 0, 48, 48, // Kivágás a sprite-ból (ha egy sorban vannak)
        dog.x, dog.y, dog.width, dog.height
    );

    // 3. Állapot szöveg megjelenítése retro stílusban
    ctx.fillStyle = "#000";
    ctx.fillText(`Állapot: ${dog.state}`, 11, 21); // Kis árnyék hatás
    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.fillText(`Állapot: ${dog.state}`, 10, 20);

    requestAnimationFrame(gameLoop);
}

// Interakció: Ha megbököd a kutyát a vásznon
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Megnézzük, hogy a kutyus területére kattintott-e
    if (
        clickX >= dog.x &&
        clickX <= dog.x + dog.width &&
        clickY >= dog.y &&
        clickY <= dog.y + dog.height
    ) {
        dog.state = "Megsértődött! 💢";
        dog.frameX = 1; // Feltételezve, hogy a 2. oszlopban van a mérges póz
        
        setTimeout(() => {
            dog.state = "Alap (Idle)";
            dog.frameX = 0; // Vissza az alap pózra
        }, 1500);
    }
});

// UI Gombok eseményei
document.getElementById("btn-whistle").addEventListener("click", () => {
    dog.state = "Odafut a sípra! 📯";
    dog.x = 150; 
});

document.getElementById("btn-food").addEventListener("click", () => {
    dog.state = "Eszik a tálból... 🍖";
});

document.getElementById("btn-water").addEventListener("click", () => {
    dog.state = "Iszik a tálból... 💧";
});

// Ha esetleg lassan töltődne be vagy hiba lenne, fallback indítás (biztos ami biztos)
setTimeout(() => {
    if (imagesLoaded < 2) {
        console.log("Képek hiányoznak vagy lassan töltenek, de futtatjuk a ciklust.");
        gameLoop();
    }
}, 1000);
