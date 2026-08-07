const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Belső felbontás beállítása (A pixeles grafikához tökéletes fix méret)
canvas.width = 384;
canvas.height = 288;

// Teszt kutya objektum, amíg nincsenek kész a képek
let dog = {
    x: 150,
    y: 160,
    width: 48,
    height: 48,
    color: "#d9822b", // Berni hegyi kutya jellegű barna-fekete-fehér hangulat
    state: "Alap (Idle)"
};

// Fő Játék Ciklus (Loop)
function gameLoop() {
    // 1. Képernyő törlése
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ideiglenes udvar háttér (zöld fű alul)
    ctx.fillStyle = "#38b764";
    ctx.fillRect(0, 180, canvas.width, 108);

    // Teszt kutya kirajzolása
    ctx.fillStyle = dog.color;
    ctx.fillRect(dog.x, dog.y, dog.width, dog.height);

    // Szöveg kiírása a kutyus aktuális kedvéről
    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.fillText(`Állapot: ${dog.state}`, 10, 20);

    requestAnimationFrame(gameLoop);
}

// Interakció: Ha megböököd/kattintasz a kutyára
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Megnézzük, hogy a kutyára kattintott-e
    if (
        clickX >= dog.x &&
        clickX <= dog.x + dog.width &&
        clickY >= dog.y &&
        clickY <= dog.y + dog.height
    ) {
        dog.state = "Megsértődött! 💢";
        dog.color = "#cc2f2f"; // Elvörösödik dühében
        
        // 1.5 másodperc múlva visszatér alapba
        setTimeout(() => {
            dog.state = "Alap (Idle)";
            dog.color = "#d9822b";
        }, 1500);
    }
});

// Gombok eseményei
document.getElementById("btn-whistle").addEventListener("click", () => {
    dog.state = "Odafut a sípra! 📯";
    dog.x = 150; // Visszaáll középre
});

document.getElementById("btn-food").addEventListener("click", () => {
    dog.state = "Eszik a tálból... 🍖";
});

document.getElementById("btn-water").addEventListener("click", () => {
    dog.state = "Iszik a tálból... 💧";
});

// Indítjuk a ciklust
gameLoop();