// -------------------------------
// Canvas Setup
// -------------------------------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let keys = {};
document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

// -------------------------------
// Player
// -------------------------------
const gravity = 0.5;
const friction = 0.5;
const groundY = 400;

const player = {
  x: 100,
  y: groundY,
  width: 20,
  height: 55,
  xVel: 0,
  yVel: 0,
  speed: 4,
  jumping: false,
};

// -------------------------------
// Platforms
// -------------------------------
const platforms = [
  { x: 100, y: 300, width: 100, height: 20 },
  { x: 300, y: 240, width: 150, height: 20 },
  { x: 550, y: 180, width: 100, height: 20 },
];

// -------------------------------
// Heart System
// -------------------------------
let maxHearts = 4;
let collectedHearts = 0;

const hearts = [
  { x: 140, y: 270, collected: false },
  { x: 360, y: 210, collected: false },
  { x: 580, y: 150, collected: false },
  { x: 700, y: 350, collected: false },
];

function onHeartCollected() {
  console.log("Heart collected!");
}

// -------------------------------
// Heart Collision
// -------------------------------
function checkHeartPickup() {
  hearts.forEach((h) => {
    if (h.collected) return;

    const dist = Math.hypot(
      player.x - h.x,
      (player.y - player.height / 2) - h.y
    );

    if (dist < 25) {
      h.collected = true;
      if (collectedHearts < maxHearts) collectedHearts++;
      onHeartCollected();
    }
  });
}

// -------------------------------
// Camera System
// -------------------------------
const camera = {
  x: 0,
  y: 0,
  followSpeed: 0.1,
};

// -------------------------------
// Dynamic Background State
// -------------------------------
let bgX = canvas.width / 2;
let bgY = canvas.height / 2;
const bgFollowSpeed = 0.05;

// -------------------------------
// Game Loop
// -------------------------------
function update() {
  // Movement
  if (keys["ArrowLeft"] || keys["KeyA"]) player.xVel = -player.speed;
  else if (keys["ArrowRight"] || keys["KeyD"]) player.xVel = player.speed;
  else player.xVel *= friction;

  if (keys["Space"] || keys["ArrowUp"]) {
    if (!player.jumping) {
      player.yVel = -12;
      player.jumping = true;
    }
  }

  player.yVel += gravity;
  player.x += player.xVel;
  player.y += player.yVel;

  // Ground collision
  if (player.y >= groundY) {
    player.y = groundY;
    player.yVel = 0;
    player.jumping = false;
  }

  // Platform collisions
  platforms.forEach((p) => {
    const footY = player.y;
    const withinX =
      player.x > p.x - player.width && player.x < p.x + p.width;

    const fallingOnTop =
      footY >= p.y && footY <= p.y + 10 && player.yVel > 0;

    if (withinX && fallingOnTop) {
      player.y = p.y;
      player.yVel = 0;
      player.jumping = false;
    }
  });

  // Collect hearts
  checkHeartPickup();

  // Camera follows player
  camera.x += (player.x - camera.x - canvas.width / 2) * camera.followSpeed;
  camera.y += (player.y - camera.y - canvas.height / 2) * camera.followSpeed;

  // Background follows player slightly
  bgX += (player.x - bgX) * bgFollowSpeed;
  bgY += (player.y - bgY) * bgFollowSpeed;

  draw();
  requestAnimationFrame(update);
}

// -------------------------------
// Draw Moving Radial Background
// -------------------------------
function drawBackground() {
  const gradient = ctx.createRadialGradient(
    bgX - camera.x,
    bgY - camera.y,
    50,
    bgX - camera.x,
    bgY - camera.y,
    600
  );

  gradient.addColorStop(0, "#87ceeb");
  gradient.addColorStop(1, "#1c77c2");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// -------------------------------
// Draw Player (origin at feet)
// -------------------------------
// -------------------------------
// Draw Player with direction / pseudo-3D
// -------------------------------
function drawPlayer() {
  const footX = player.x - camera.x;
  const footY = player.y - camera.y;

  // Determine movement direction: 1 = right, -1 = left
  let dir = 1;
  if (player.xVel < -0.1) dir = -1;
  else if (player.xVel > 0.1) dir = 1;

  // Determine animation
  let legSwing = 0;
  let armSwing = 0;

  if (player.jumping) {
    legSwing = -5;
    armSwing = -5;
  } else if (Math.abs(player.xVel) > 0.1) {
    const time = Date.now() / 150;
    legSwing = Math.sin(time) * 5;
    armSwing = -Math.sin(time) * 5;
  }

  // -------------------------------
  // BODY
  // -------------------------------
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(footX - 5, footY - 40, 10, 20);

  // -------------------------------
  // HEAD
  // -------------------------------
  ctx.beginPath();
  // Offset head slightly forward/backward to simulate facing direction
  ctx.arc(footX + dir * 2, footY - 45, 10, 0, Math.PI * 2);
  ctx.fill();

  // -------------------------------
  // ARMS
  // -------------------------------
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(footX - 5, footY - 35);
  ctx.lineTo(footX - 15, footY - 25 + armSwing);
  ctx.moveTo(footX + 5, footY - 35);
  ctx.lineTo(footX + 15, footY - 25 - armSwing);
  ctx.stroke();

  // -------------------------------
  // LEGS
  // -------------------------------
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Slight forward/backward shift for pseudo-3D effect
  ctx.moveTo(footX - 3 + dir * 1, footY - 20);
  ctx.lineTo(footX - 3 + legSwing + dir * 1, footY);
  ctx.moveTo(footX + 3 + dir * 1, footY - 20);
  ctx.lineTo(footX + 3 - legSwing + dir * 1, footY);
  ctx.stroke();
}

// -------------------------------
// Draw Hearts in the World
// -------------------------------
function drawHearts() {
  ctx.fillStyle = "red";

  hearts.forEach((heart) => {
    if (heart.collected) return;

    ctx.save();
    ctx.translate(heart.x - camera.x, heart.y - camera.y);

    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(0, 0, 6, 0, 6, 4);
    ctx.bezierCurveTo(6, 0, 12, 0, 12, 6);
    ctx.bezierCurveTo(12, 10, 6, 14, 6, 18);
    ctx.bezierCurveTo(6, 14, 0, 10, 0, 6);
    ctx.fill();

    ctx.restore();
  });
}

// -------------------------------
// Draw UI Hearts (static, not affected by camera)
// -------------------------------
function drawHeartUI() {
  for (let i = 0; i < maxHearts; i++) {
    let filled = i < collectedHearts;

    ctx.fillStyle = filled ? "red" : "#ffcccc";

    ctx.save();
    ctx.translate(20 + i * 30, 20);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(0, 0, 6, 0, 6, 4);
    ctx.bezierCurveTo(6, 0, 12, 0, 12, 6);
    ctx.bezierCurveTo(12, 10, 6, 14, 6, 18);
    ctx.bezierCurveTo(6, 14, 0, 10, 0, 6);
    ctx.fill();
    ctx.restore();
  }
}

// -------------------------------
// Draw World
// -------------------------------
function draw() {
  drawBackground();
  drawPlayer();

  ctx.fillStyle = "#8B4513";
  platforms.forEach((p) =>
    ctx.fillRect(p.x - camera.x, p.y - camera.y, p.width, p.height)
  );

  ctx.fillStyle = "#006400";
  ctx.fillRect(-1000, groundY - camera.y, canvas.width * 10, 1000);

  drawHearts();
  drawHeartUI();
}

update();
