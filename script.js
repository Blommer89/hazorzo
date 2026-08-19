// --- 1. KÉPEK BETÖLTÉSE (Ellenőrizd, hogy a fájlnevek stimmelnek-e!) ---
const yardImg = new Image(); yardImg.src = "assets/udvar.png";
const treeImg = new Image(); treeImg.src = "assets/fa.png";
const doghouseImg = new Image(); doghouseImg.src = "assets/kutyahaz.png";

// ITT JAVÍTOTTUK: kerites.png-re írtuk át
const keritesImg = new Image(); keritesImg.src = "assets/kerites.png"; 

const butterflyImg = new Image(); butterflyImg.src = "assets/pille.png";
const squirrelImg = new Image(); squirrelImg.src = "assets/mokus.png";
const postmanImg = new Image(); postmanImg.src = "assets/postas.png";

// ... (további képek betöltése, pl. dogImages)

// --- 2. JÁTÉK CIKLUS (A biztonságos rajzolás) ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Háttér rajzolása
    if (yardImg.complete) ctx.drawImage(yardImg, 0, 0, canvas.width, canvas.height);
    
    // Fák és kutyaház
    ctx.drawImage(treeImg, treeLeft.x, treeLeft.y, treeLeft.width, treeLeft.height);
    ctx.drawImage(treeImg, treeRight.x, treeRight.y, treeRight.width, treeRight.height);
    ctx.drawImage(doghouseImg, doghouse.x, doghouse.y, doghouse.width, doghouse.height);
    
    // BIZTONSÁGOS KERÍTÉS RAJZOLÁS
    if (keritesImg.complete && keritesImg.naturalWidth > 0) {
        ctx.drawImage(keritesImg, fence.x, fence.y, fence.width, fence.height);
    }
    
    // Tálak
    ctx.drawImage(bowls.water.img, bowls.water.x, bowls.water.y, bowls.water.width, bowls.water.height);
    ctx.drawImage(bowls.food.img, bowls.food.x, bowls.food.y, bowls.food.width, bowls.food.height);
    
    // Pillangó, Mókus, Postás
    if (butterfly.active && butterflyImg.complete) ctx.drawImage(butterflyImg, butterfly.x, butterfly.y, butterfly.width, butterfly.height);
    if (squirrel.active && squirrelImg.complete) ctx.drawImage(squirrelImg, squirrel.x, squirrel.y, squirrel.width, squirrel.height);
    if (postman.active && postmanImg.complete) ctx.drawImage(postmanImg, postman.x, postman.y, postman.width, postman.height);

    // Kutya rajzolása
    if (dog.isDead) {
        if (dogImages.dead.complete) ctx.drawImage(dogImages.dead, dog.x, dog.y, dog.width, dog.height);
    } else {
        if (dog.currentImage && dog.currentImage.complete) {
            ctx.drawImage(dog.currentImage, dog.x, dog.y, dog.width, dog.height);
        }
    }

    drawHUD();
    requestAnimationFrame(gameLoop);
}
