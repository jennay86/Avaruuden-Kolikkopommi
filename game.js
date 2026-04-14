let player, coin;
let canvasEl;
let bombs = [];
let particles = [];
let stars = [];
let vx = 0;
let vy = 0;
let startAnim = 0;

let useScale = true;


const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720; // 16:9, moderni
let scaleFactor = 1;

let audioUnlocked = false;


let deadZone = 25; // kosketusohjauksen kuollut alue


let score = 0;
let highScores = [];
let madeTop5 = false;
let gameOverAnim = 0;
let gameOverShake = 0;

let time = 60;
let gameState = "start";

let coinSound, explosionSound, gameOverSound;
let backgroundMusic, gameMusic, tickingSound, warningSound;
let boosterSound;

let booster = null;
let boosterActive = false;
let boosterTimer = 0;
let boosterCooldown = 0;
let hitCount = 0;
let maxHits = 3;
let combo = 0;
let comboTimer = 0;
let touchX = 0;
let touchY = 0;
let isTouching = false;

let startButton, restartButton, homeButton;
let shake = 0;
let coinPop = 0;
let floatingTexts = [];


let bgColor;

function layoutMenuButtons() {
  const buttonWidth = constrain(floor(width * 0.42), 150, 220);
  const buttonHeight = 45;

  if (startButton) {
    startButton.size(buttonWidth, buttonHeight);
  }

  if (restartButton) {
    restartButton.size(buttonWidth, buttonHeight);
  }

  if (homeButton) {
    homeButton.size(buttonWidth, buttonHeight);
  }

  const startX = startButton ? width / 2 - startButton.elt.offsetWidth / 2 : width / 2 - buttonWidth / 2;
  const restartX = restartButton ? width / 2 - restartButton.elt.offsetWidth / 2 : width / 2 - buttonWidth / 2;
  const homeX = homeButton ? width / 2 - homeButton.elt.offsetWidth / 2 : width / 2 - buttonWidth / 2;

  if (startButton) {
    startButton.position(startX, height / 2 + 20);
  }

  if (restartButton) {
    restartButton.position(restartX, height / 2 + 180);
  }

  if (homeButton) {
    homeButton.position(homeX, height / 2 + 240);
  }
}


function updateScale() {
  // Piirretään aina suoraan canvasin omilla koordinaateilla.
  // Aiempi ylimääräinen skaalakerros aiheutti mobiilissa keskitysvirheitä.
  scaleFactor = 1;
  useScale = false;
}


function sx(x) {
  return x / scaleFactor;
}

function sy(y) {
  return y / scaleFactor;
}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateScale();
  layoutMenuButtons();
}


function tryAutoplayMusic() {
  const ctx = getAudioContext();

  // Jos selain sallii äänen heti
  if (ctx.state === 'running') {
    playLoop(backgroundMusic, 0.2);
    audioUnlocked = true;
  }
}



function unlockAudio() {
  if (!audioUnlocked) {
    userStartAudio();
    playLoop(backgroundMusic, 0.2);
    audioUnlocked = true;
  }
}


function preload() {
  coinSound = loadSound('assets/coin.mp3');
  explosionSound = loadSound('assets/explosion.mp3');
  gameOverSound = loadSound('assets/gameover.mp3');
  backgroundMusic = loadSound('assets/background.mp3');
  gameMusic = loadSound('assets/music.mp3');
  tickingSound = loadSound('assets/ticking.mp3');
  warningSound = loadSound('assets/warning.mp3');
  boosterSound = loadSound('assets/booster.mp3');
}

function setup() {
  
  canvasEl = createCanvas(windowWidth, windowHeight);
  updateScale();
  textFont('Orbitron');
  pixelDensity(1);

  
bgColor = color(10, 15, 40);        // alkuperäinen tumma sininen

  coinSound.setVolume(0.25);
  explosionSound.setVolume(0.25);
  gameOverSound.setVolume(0.4);
  boosterSound.setVolume(0.5);

  backgroundMusic.setVolume(0.3);
  gameMusic.setVolume(0.6);
  tickingSound.setVolume(0.4);
  warningSound.setVolume(0.6);

  player = createVector(width/2, height/2);
  coin = createVector(random(50, width-50), random(50, height-50));

  // stars in the background
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.2, 1)
    });
  }
  
  startButton = createButton("Aloita peli");
  startButton.size(160, 45);
  startButton.mousePressed(startGame);
  startButton.touchStarted(startGame);

  restartButton = createButton("Uudelleen");
  restartButton.size(160, 45);
  restartButton.mousePressed(startGame);
  restartButton.touchStarted(startGame);
  restartButton.hide();

  
homeButton = createButton("Alkuun");
homeButton.size(160, 45);
homeButton.mousePressed(goToStart);
homeButton.touchStarted(goToStart);

homeButton.hide();

  layoutMenuButtons();


  highScores = getItem('highScores') || [];

tryAutoplayMusic()
  
}



function saveScore() {
  madeTop5 = false;

  let currentScore = Math.floor(score);

  // Lisää uusi piste listaan
  highScores.push(currentScore);

  // Järjestä pisteet
  highScores.sort((a, b) => b - a);

  // Tarkista pääsikö nykyinen piste Top 5:een
  if (highScores.indexOf(currentScore) < 5) {
    madeTop5 = true;
  }

  // Pidä vain 5 parasta
  highScores = highScores.slice(0, 5);

  // Tallenna muistiin
  storeItem('highScores', highScores);
}


function playLoop(sound, volume = 0.2) {
  if (!sound) return;
  if (!sound.isPlaying()) {
    sound.setVolume(volume);
    sound.loop();
  }
}

function stopSound(sound) {
  if (sound && sound.isPlaying()) {
    sound.stop();
  }
}

function touchStarted() {
  if (gameState === "play") {
    touchX = sx(mouseX);
    touchY = sy(mouseY);
    isTouching = true;
    return false;
  }
  return true;
}

function touchMoved() {
  if (gameState === "play" && isTouching) {
    touchX = sx(mouseX);
    touchY = sy(mouseY);
    return false;
  }
  return true;
}

function touchEnded() {
  if (gameState === "play") {
    isTouching = false;
    return false;
  }
  return true;
}

function startGame() {
  score = 0;
  time = 60;
  gameState = "play";
  hitCount = 0;
  boosterActive = false;
  boosterTimer = 0;
  boosterCooldown = 0;
  combo = 0;
  comboTimer = 0;

  player.set(width/2, height/2);
  coin.set(random(50, width-50), random(50, height-50));

  bombs = [];
  for (let i = 0; i < 4; i++) {
    bombs.push({
      pos: createVector(random(width), random(height)),
      vel: createVector(random(-4,4), random(-4,4)),
      timer: random(2,5),
      nearMissed: false
    });
  }

  spawnBooster();

  startButton.hide();
  restartButton.hide();
  homeButton.hide();

  userStartAudio();
  stopSound(backgroundMusic);
  playLoop(gameMusic, 0.2);
  playLoop(tickingSound, 0.2);
  stopSound(warningSound);
}

function goToStart() {
  gameState = "start";

  // nollaa animaatiot ja efektit
  startAnim = 0;
  gameOverAnim = 0;
  gameOverShake = 0;

  stopSound(gameMusic);
  stopSound(tickingSound);
  stopSound(warningSound);
  playLoop(backgroundMusic, 0.2);

  restartButton.hide();
  homeButton.hide();

  startButton.show();
}

function drawBackground() {
  noStroke();

  for (let y = 0; y < height; y++) {
let r = red(bgColor);
let g = green(bgColor);
let b = blue(bgColor);

// tummennetaan alaspäin
let shade = lerp(0.4, 1.0, y / height);

fill(
  r * shade,
  g * shade,
  b * shade
);


    rect(0, y, width, 1);
  }

  // tähdet
  for (let s of stars) {
    fill(255, 255, 255, 20);
    ellipse(s.x, s.y, s.size * 2);

    fill(255, 255, 255, 180);
    ellipse(s.x, s.y, s.size);

    s.y += s.speed;
    if (s.y > height) {
      s.y = 0;
      s.x = random(width);
    }
  }
}

function glow(x, y, size, col) {
  for (let i = 4; i > 0; i--) {
    fill(red(col), green(col), blue(col), 40 / i);
    ellipse(x, y, size * i);
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-3, 3),
      vy: random(-3, 3),
      life: 30
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    fill(255, 150, 0, p.life * 8);
    ellipse(p.x, p.y, 5);

    if (p.life <= 0) particles.splice(i, 1);
  }
}

function spawnBooster() {
  booster = {
    pos: createVector(random(50, width - 50), random(50, height - 50)),
    radius: 18
  };
}

function drawBooster() {
  if (!booster) return;

  push();
  translate(booster.pos.x, booster.pos.y);

  let scaleFactor = 0.7;

  let pulse = sin(frameCount * 0.2) * 4;

  // 💚 vihreä hehku
  for (let i = 3; i > 0; i--) {
    fill(0, 255, 100, 40 / i);
    ellipse(0, 0, (40 + pulse) * i * scaleFactor);
  }

  // 💚 ulkorengas
  noFill();
  stroke(0, 255, 100);
  strokeWeight(2);
  ellipse(0, 0, (40 + pulse) * scaleFactor);

  // 💚 sisäydin
  noStroke();
  fill(0, 255, 150);
  ellipse(0, 0, (20 + pulse) * scaleFactor);

  // ✨ kirkas keskusta
  fill(200, 255, 200);
  ellipse(0, 0, 6 * scaleFactor);

  pop();
}


function mousePressed() {
  if (gameState === "start") {
    unlockAudio();
  }
}

function draw() {
  if (canvasEl) {
    const menuState = gameState === "start" || gameState === "gameover";
    canvasEl.style('pointer-events', menuState ? 'none' : 'auto');
  }

  
// ✅ TAUSTA ENSIN – EI SKAALAUSTA
  drawBackground();

  push();

  if (gameState === "play") {
    translate(random(-shake, shake), random(-shake, shake));
  }

  // ✅ SKAALAUS VASTA TÄNNE
  
if (useScale) {
  scale(scaleFactor);
}

  if (gameState === "start" || gameState === "gameover") {
    playLoop(backgroundMusic, 0.2);
  }

  if (gameState === "play") {
    stopSound(backgroundMusic);
    playLoop(gameMusic, 0.2);
    playLoop(tickingSound, 0.2);
    if (time <= 5) {
      playLoop(warningSound, 0.5);
    } else {
      stopSound(warningSound);
    }
  }

  if (gameState === "start") {
    layoutMenuButtons();
    startButton.show();
    restartButton.hide();
    homeButton.hide();

    const compactStartLayout = width < 900 || height < 700;
    const titleSize = constrain(floor(width * 0.06), 28, 42);
    const helpSize = constrain(floor(width * 0.027), 12, 20);
    const helpWidth = min(width * 0.86, 760);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(titleSize);
    // 🚀 avaruus-aloitusanimaatio
startAnim = min(startAnim + 0.012, 1);

// easing (pehmeä loppu)
let t = 1 - pow(1 - startAnim, 3);

// sijainti adaptiivisesti eri näyttöihin
let titleY = lerp(height * 0.06, compactStartLayout ? height * 0.18 : height * 0.24, t);

// skaala (kaukaa → paikalle)
let titleScale = lerp(2.5, 1.0, t);

// kierto
let rotation = lerp(-TWO_PI * 2, 0, t);

// läpinäkyvyys
let alpha = lerp(0, 255, t);

push();
translate(width / 2, titleY);
rotate(rotation);
scale(titleScale);

textAlign(CENTER, CENTER);
textSize(titleSize);
fill(255, alpha);
text("Avaruuden Kolikkopommi", 0, 0);

pop();


textSize(helpSize);
textLeading(helpSize * 1.35);
fill(180, 220, 255);
textAlign(CENTER, TOP);

text(
  "Kerää kolikoita nuolinäppäimillä ja vältä pommeja. "
+ "Saat boostereista lisää tehoa ja suojan.\n"
+ "Pommien läheltä saat bonuspisteitä.",
  width / 2 - helpWidth / 2,
  compactStartLayout ? height * 0.31 : height * 0.35,
  helpWidth
);


    // ✨ hehku
const coinPreviewY = compactStartLayout ? height * 0.6 : height / 2 + 110;
glow(width/2, coinPreviewY, 15, color(255, 200, 0));

const startButtonY = min(height - 70, coinPreviewY + 55);
startButton.position(width / 2 - startButton.elt.offsetWidth / 2, startButtonY);

// 🪙 sama kolikko kuin pelissä
push();
translate(width/2, coinPreviewY);

let w = 26 + sin(frameCount * 0.2) * 4;

// ulkoreuna
stroke(200, 150, 0);
strokeWeight(2);
fill(255, 215, 0);
ellipse(0, 0, w, 26);

// sisärengas
noFill();
stroke(255, 240, 120);
ellipse(0, 0, w * 0.7, 18);

// symboli
noStroke();
fill(255, 240, 120);
textAlign(CENTER, CENTER);
textSize(12);
text("€", 0, 1);

// kiilto
fill(255, 255, 255, 180);
ellipse(-5, -5, 4);

pop();
    return;
  }

  if (gameState === "gameover") {
    startButton.hide();

    stopSound(gameMusic);
    stopSound(tickingSound);
    stopSound(warningSound);
    playLoop(backgroundMusic, 0.2);

    gameOverAnim = min(gameOverAnim + 0.02, 1);

    if (gameOverAnim === 1 && gameOverShake === 0) {
  gameOverShake = 8; // tärähdyksen voimakkuus
  }

    
push();
fill(0, 180);
rect(0, 0, width, height);
pop();


    fill(255);
    textAlign(CENTER, CENTER);

    let baseY = height * 0.25;
    
    let t = gameOverAnim;
    let yOffset = lerp(-90, 0, t);
    let alpha = lerp(0, 255, t);

    let shakeX = 0;
    let shakeY = 0;
    
    if (gameOverShake > 0) {
      shakeX = sin(frameCount * 25) * gameOverShake;
      shakeY = cos(frameCount * 30) * gameOverShake;
      gameOverShake *= 0.85; // vaimenee tasaisesti

}

    
    textSize(48);
    
    fill(255, alpha * 0.3);
    text("Peli ohi!", width / 2 + shakeX, baseY + yOffset + shakeY);

    fill(255, alpha);
    text("Peli ohi!", width / 2, baseY + yOffset);


// 2️⃣ OMAT PISTEET ✅ (LISÄTTY)
textSize(24);
text("Pisteet: " + Math.floor(score), width / 2, baseY + 40);

// 3️⃣ TOP 5
textSize(22);
text("Top 5", width / 2, baseY + 80);

// lista
textSize(20);
for (let i = 0; i < highScores.length; i++) {
  text(
    (i + 1) + ". " + highScores[i],
    width / 2,
    baseY + 115 + i * 26
  );
}

// mihin Top 5 päättyy
let afterTop5Y = baseY + 115 + highScores.length * 26;

// 4️⃣ PÄÄSIT TOP 5 -LISTALLE
if (madeTop5) {
  textSize(24);
  fill(255, 220, 150);
  text("🎉 Pääsit Top 5 -listalle!", width / 2, afterTop5Y + 25);
}

// 5️⃣ UUSINTA-PAINIKE
const buttonY = afterTop5Y + (madeTop5 ? 70 : 40);
const buttonX = width / 2 - restartButton.elt.offsetWidth / 2;

restartButton.position(buttonX, buttonY);
restartButton.show();

homeButton.position(buttonX, buttonY + 60);
homeButton.show();



return;

  }

  startButton.hide();
  restartButton.hide();
  homeButton.hide();

  if (keyIsDown(LEFT_ARROW) ||
    (isTouching && touchX < player.x - deadZone)) {
  vx -= 0.5;
}

if (keyIsDown(RIGHT_ARROW) ||
    (isTouching && touchX > player.x + deadZone)) {
  vx += 0.5;
}

if (keyIsDown(UP_ARROW) ||
    (isTouching && touchY < player.y - deadZone)) {
  vy -= 0.5;
}

if (keyIsDown(DOWN_ARROW) ||
    (isTouching && touchY > player.y + deadZone)) {
  vy += 0.5;
}

// 🖱️ Hiiriohjaus (vain jos hiiren nappia painetaan)
if (!isTouching && mouseIsPressed) {
  let mx = sx(mouseX);
  let my = sy(mouseY);

  let dx = mx - player.x;
  let dy = my - player.y;

  let d = dist(mx, my, player.x, player.y);

  if (d > deadZone) {
    dx = constrain(dx, -100, 100);
    dy = constrain(dy, -100, 100);

    vx += dx * 0.01;
    vy += dy * 0.01;
  }
}

  player.x += vx;
  player.y += vy;

  vx = constrain(vx, -8, 8);
  vy = constrain(vy, -8, 8);

  vx *= 0.9;
  vy *= 0.9

  player.x = constrain(player.x, 15, width - 15);
  player.y = constrain(player.y, 15, height - 15);

  let playerSize = 25 + (boosterActive ? 5 : 0) + sin(frameCount * 0.1) * 2;
  glow(player.x, player.y, 20, color(0, 200, 255));
  fill(120, 220, 255);
  ellipse(player.x, player.y, playerSize);

  // ✨ hehku
glow(coin.x, coin.y, 15, color(255, 200, 0));

// 🪙 kolikko
push();
translate(coin.x, coin.y);

// pieni “spin”
let w = 22 + sin(frameCount * 0.2) * 4 + coinPop;

// ulkoreuna
stroke(200, 150, 0);
strokeWeight(2);
fill(255, 215, 0);
ellipse(0, 0, w, 22);

// sisärengas
noFill();
stroke(255, 240, 120);
ellipse(0, 0, w * 0.7, 16);

// 💰 symboli keskelle
noStroke();
fill(255, 240, 120);
textAlign(CENTER, CENTER);
textSize(10);
text("€", 0, 1);

pop();

  if (booster) {
    drawBooster();
  }

  let desiredBombCount = 4 + floor((60 - time) / 5);
  while (bombs.length < desiredBombCount) {
    bombs.push({
  pos: createVector(random(width), random(height)),
  vel: createVector(random(-4,4), random(-4,4)),
  timer: random(2,5),
  nearMissed: false   // ✅ TÄRKEÄ UUSI RIVI
});

  }

  if (boosterCooldown > 0 && !booster) {
    boosterCooldown -= deltaTime / 1000;
    if (boosterCooldown <= 0) {
      spawnBooster();
    }
  }

  for (let b of bombs) {
    b.pos.add(b.vel);

    if (b.pos.x < 0 || b.pos.x > width) b.vel.x *= -1;
    if (b.pos.y < 0 || b.pos.y > height) b.vel.y *= -1;

    b.timer -= deltaTime / 1000;
    if (b.timer <= 0) {
      b.pos.set(random(width), random(height));
      b.timer = random(2,5);
    }

    // glow
glow(b.pos.x, b.pos.y, 20, color(255, 50, 50));

// pommin runko
fill(30);
ellipse(b.pos.x, b.pos.y, 24);

// punainen ydin (pulssaa)
let pulse = sin(frameCount * 0.2) * 3;
fill(255, 50, 50);
ellipse(b.pos.x, b.pos.y, 10 + pulse);

// pieni kirkas piste keskelle
fill(255, 150, 150);
ellipse(b.pos.x, b.pos.y, 4);
    

    let d = dist(player.x, player.y, b.pos.x, b.pos.y);

if (d < 40 && d > 20 && !b.nearMissed) {
  score += 5;

  let fx = player.x;
  let fy = player.y;

  floatingTexts.push({
    x: fx,
    y: fy,
    text: "+5 NEAR MISS",
    life: 50
  });

  b.nearMissed = true;
}
    

if (d < 20) {
  if (!boosterActive) {
    shake = 10;
    hitCount++;
    createExplosion(b.pos.x, b.pos.y);
    if (explosionSound) explosionSound.play();
    b.pos.set(random(width), random(height));

    if (hitCount >= maxHits) {
  saveScore();
  gameState = "gameover";
  gameOverAnim = 0;
  if (gameOverSound) gameOverSound.play();
  return;
}

  } else {
    b.pos.set(random(width), random(height));
  }
  }
}

  if (dist(player.x, player.y, coin.x, coin.y) < 20) {

bgColor = color(
  random(20, 80),     // R
  random(20, 80),    // G
  random(80, 160)     // B (painotus siniseen)
  
);

    coinPop = 18;

    if (comboTimer > 0) {
      combo++;
    } else {
      combo = 1;
    }

    // ⏱️ combo aika
    comboTimer = min(3, 2 + combo * 0.2);

// 🪙 KOLIKON OIKEAT PISTEET
let coinValue = 10;
let comboMultiplier = max(1, combo);
let bonus = coinValue * comboMultiplier;

// lisätään pisteet
score += bonus;

// näytetään täsmälleen sama luku
floatingTexts.push({
  x: coin.x,
  y: coin.y,
  text: "+" + bonus,
  life: 60
});

// näytetään combo vain jos se vaikutti
if (comboMultiplier > 1) {
  floatingTexts.push({
    x: coin.x,
    y: coin.y - 20,
    text: "COMBO x" + comboMultiplier,
    life: 40
  });
}


    createExplosion(coin.x, coin.y);
    coin.set(random(50, width-50), random(50, height-50));

    if (coinSound) {
      coinSound.rate(random(0.9, 1.1));
      coinSound.play();
    }
  }

  if (booster && dist(player.x, player.y, booster.pos.x, booster.pos.y) < booster.radius + 12) {
    boosterActive = true;
    boosterTimer = 5;
    booster = null;
    boosterCooldown = 5;

    
if (boosterSound) {
    boosterSound.play();
  }

  }

  if (boosterActive) {
    boosterTimer -= deltaTime / 1000;
    if (boosterTimer <= 0) {
      boosterActive = false;
    }
  }

  comboTimer -= deltaTime / 1000;
  if (comboTimer <= 0) {
    combo = 0;
  }

  

  updateParticles();

  pop();

  // ✨ floating texts (EI seuraa kameratärähdystä)
push();

for (let i = floatingTexts.length - 1; i >= 0; i--) {
  let t = floatingTexts[i];

  t.y -= 1; // nousee ylöspäin
  t.life--;

  fill(255, 255, 0, t.life * 4);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(t.text, t.x, t.y);

  if (t.life <= 0) {
    floatingTexts.splice(i, 1);
  }
}

pop();



  time -= deltaTime / 1000;
  if (time < 10) {
  for (let b of bombs) {
    b.vel.mult(1.002);
  }
}



  fill(0, 150);
  rect(10, 10, 170, 100, 10);

  fill(0, 255, 255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("Pisteet: " + score, 20, 20);
  text("Aika: " + ceil(time), 20, 40);
  text("Osumat: " + hitCount + "/" + maxHits, 20, 60);
  text("Combo: " + combo, 20, 80);
  textAlign(CENTER, CENTER);

  if (boosterActive) {
    fill(150, 255, 150);
    textSize(14);
    text("Booster aktiivinen: " + ceil(boosterTimer) + "s", width/2, 20);
  }

  if (time <= 0 && gameState === "play") {
  saveScore();
  gameState = "gameover";
  gameOverAnim = 0;
  if (gameOverSound) gameOverSound.play();
  return;
}

shake *= 0.9;
coinPop *= 0.8;


pop();


}
