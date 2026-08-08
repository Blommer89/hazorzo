// ... az előző kód eleje (képbetöltések) változatlan ...

let isLongPress = false;
let pressTimer;

// Hosszú nyomás érzékelése (Simizéshez)
canvas.addEventListener("mousedown", (e) => {
    pressTimer = setTimeout(() => {
        isLongPress = true;
        dog.state = "Hasra fekszik... 😊";
        dog.frameX = 2; // Tegyük fel, hogy a 3. kép a hasra fekvés
    }, 500); // 500ms után tekintjük "hosszú nyomásnak"
});

canvas.addEventListener("mouseup", () => {
    clearTimeout(pressTimer);
    if (isLongPress) {
        isLongPress = false;
        dog.state = "Alap (Idle)";
        dog.frameX = 0;
    }
});

// Sípra mozgás logikája (egyszerű lineáris interpoláció)
function moveDogTo(targetX, targetY) {
    dog.state = "Odafut... 🐕";
    const animate = () => {
        if (Math.abs(dog.x - targetX) > 2) {
            dog.x += (targetX - dog.x) * 0.05;
            dog.y += (targetY - dog.y) * 0.05;
            requestAnimationFrame(animate);
        } else {
            dog.state = "Alap (Idle)";
            dog.frameX = 0;
        }
    };
    animate();
}

// Gombok frissítése
document.getElementById("btn-whistle").addEventListener("click", () => {
    moveDogTo(150, 160); // Vissza a kezdőhelyre
});

document.getElementById("btn-food").addEventListener("click", () => {
    dog.state = "Eszik... 🍖";
    moveDogTo(50, 200); // Odamegy a tálhoz
});
