const gameDisplay = document.querySelector('.game-display');

const miniSpiderGame = window.miniSpiderGame || (window.miniSpiderGame = {
  gameOver: false,
  isDying: false,
  gameOverCallbacks: [],
  deathCallbacks: [],
  onGameOver(callback) {
    this.gameOverCallbacks.push(callback);
  },
  onPlayerDeath(callback) {
    this.deathCallbacks.push(callback);
  },
  isGameOver() {
    return this.gameOver;
  },
  isStopped() {
    return this.gameOver || this.isDying;
  },
  triggerPlayerDeath(payload = {}) {
    if (this.gameOver || this.isDying) return;
    this.isDying = true;
    this.deathPayload = payload;
    this.deathCallbacks.forEach((callback) => callback(payload));
  },
  triggerGameOver(payload = {}) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.gameOverPayload = payload;
    this.gameOverCallbacks.forEach((callback) => callback(payload));
  }
});

const playerSprites = {
  run: [
    './assets/characters/default-spider/anim/walk1.png',
    './assets/characters/default-spider/anim/walk2.png',
    './assets/characters/default-spider/anim/walk3.png'
  ],

  runBlink: [
    './assets/characters/default-spider/anim/walk1.png',
    './assets/characters/default-spider/anim/walk2-blink.png',
    './assets/characters/default-spider/anim/walk3.png'
  ],

  web: './assets/characters/default-spider/anim/webbing.png',

  fall: [
    './assets/characters/default-spider/anim/fall.png',
    './assets/characters/default-spider/anim/fall2.png'
  ]
};

const playerConfig = {
  x: 58,
  floorHeight: 46,
  spriteWidth: 82,
  spriteHeight: 82,
  handOffsetX: 68,
  handOffsetY: 39,
  webRestLength: 12,
  webPullStrength: 0.03,
  webDamping: 0.92,
  gravity: 0.38,
  maxRiseSpeed: 7.4,
  maxFallSpeed: 8,
  maxWebHeight: 999,
  ceilingLimitTop: 8,
  ceilingFallSpeed: -3.2,
  runFrameDelay: 100,
  fallFrameDelay: 500,
  deathAnimationDuration: 850,
  hitboxInsetX: 14,
  hitboxInsetTop: 10,
  hitboxInsetBottom: 8,
  blinkMinDelay: 1000,
  blinkMaxDelay: 1800,
  blinkFrameIndex: 1,
};

const playerState = {
  mode: 'run',
  y: 0,
  velocityY: 0,
  isHoldingWeb: false,
  runFrame: 0,
  fallFrame: 0,
  lastFallFrameTime: 0,
  lastRunFrameTime: 0,
  blinkQueued: false,
  nextBlinkTime: 0,
};

const player = document.createElement('div');
player.classList.add('player');
player.style.left = `${playerConfig.x}px`;
player.style.bottom = `${playerConfig.floorHeight}px`;

const playerImg = document.createElement('img');
playerImg.classList.add('player-sprite');
playerImg.src = playerSprites.run[0];
playerImg.alt = 'Personagem';

const webLine = document.createElement('div');
webLine.classList.add('player-web-line');

player.appendChild(playerImg);
gameDisplay.appendChild(webLine);
gameDisplay.appendChild(player);

function setPlayerSprite(src) {
  const nextSrc = src.replace('./', '');
  if (playerImg.src.endsWith(nextSrc)) return;
  playerImg.src = src;
}

function setMode(mode) {
  if (playerState.mode === mode) return;
  playerState.mode = mode;

  if (mode === 'run') {
    setPlayerSprite(playerSprites.run[playerState.runFrame]);
    webLine.classList.remove('is-visible');
    return;
  }

  if (mode === 'web') {
    setPlayerSprite(playerSprites.web);
    webLine.classList.add('is-visible');
    return;
  }

  if (mode === 'fall') {
    playerState.fallFrame = 0;
    playerState.lastFallFrameTime = performance.now();
    setPlayerSprite(playerSprites.fall[playerState.fallFrame]);
    webLine.classList.remove('is-visible');
  }
}

function getMaxHeight() {
  const ceilingLimit = playerConfig.ceilingLimitTop ?? 8;
  const safeTopLimit = gameDisplay.offsetHeight - playerConfig.floorHeight - playerConfig.spriteHeight - ceilingLimit;
  return Math.min(playerConfig.maxWebHeight, Math.max(0, safeTopLimit));
}

function getHandPosition() {
  const displayHeight = gameDisplay.offsetHeight;
  const handX = playerConfig.x + playerConfig.handOffsetX;
  const handBottom = playerConfig.floorHeight + playerState.y + playerConfig.handOffsetY;
  const handYFromTop = displayHeight - handBottom;

  return {
    x: handX,
    yFromTop: handYFromTop
  };
}

function getPlayerBounds() {
  return {
    left: playerConfig.x + playerConfig.hitboxInsetX,
    top: gameDisplay.offsetHeight - (playerConfig.floorHeight + playerState.y + playerConfig.spriteHeight) + playerConfig.hitboxInsetTop,
    width: playerConfig.spriteWidth - playerConfig.hitboxInsetX * 2,
    height: playerConfig.spriteHeight - playerConfig.hitboxInsetTop - playerConfig.hitboxInsetBottom,
    get right() {
      return this.left + this.width;
    },
    get bottom() {
      return this.top + this.height;
    }
  };
}

function startWeb() {
  if (miniSpiderGame.isStopped() || miniSpiderGame.isPaused?.()) return;
  playerState.isHoldingWeb = true;
  window.miniSpiderAudio?.play('webShoot');
  setMode('web');
}

function releaseWeb() {
  if (miniSpiderGame.isStopped() || miniSpiderGame.isPaused?.()) return;
  playerState.isHoldingWeb = false;

  if (playerState.y > 0) {
    setMode('fall');
  }
}

function updateRunAnimation(currentTime) {
  if (playerState.mode !== 'run') return;

  if (!playerState.nextBlinkTime) {
    scheduleNextBlink(currentTime);
  }

  if (currentTime >= playerState.nextBlinkTime) {
    playerState.blinkQueued = true;
  }

  if (currentTime - playerState.lastRunFrameTime >= playerConfig.runFrameDelay) {
    playerState.lastRunFrameTime = currentTime;

    playerState.runFrame = (playerState.runFrame + 1) % playerSprites.run.length;

    let nextSprite = playerSprites.run[playerState.runFrame];

    if (
      playerState.blinkQueued &&
      playerState.runFrame === playerConfig.blinkFrameIndex
    ) {
      nextSprite = playerSprites.runBlink[playerState.runFrame];
      playerState.blinkQueued = false;
      scheduleNextBlink(currentTime);
    }

    setPlayerSprite(nextSprite);
  }
}

function updateFallAnimation(currentTime) {
  if (playerState.mode !== 'fall') return;

  if (currentTime - playerState.lastFallFrameTime >= playerConfig.fallFrameDelay) {
    playerState.lastFallFrameTime = currentTime;
    playerState.fallFrame = playerState.fallFrame === 0 ? 1 : 1;
    setPlayerSprite(playerSprites.fall[playerState.fallFrame]);
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function scheduleNextBlink(currentTime) {
  playerState.nextBlinkTime = currentTime + randomBetween(
    playerConfig.blinkMinDelay,
    playerConfig.blinkMaxDelay
  );
}


function applyWebPhysics() {
  const handPosition = getHandPosition();
  const ropeStretch = handPosition.yFromTop - playerConfig.webRestLength;

  playerState.velocityY -= playerConfig.gravity;

  if (ropeStretch > 0) {
    playerState.velocityY += ropeStretch * playerConfig.webPullStrength;
  }

  playerState.velocityY *= playerConfig.webDamping;
}

function applyFallPhysics() {
  playerState.velocityY -= playerConfig.gravity;
}

function updateMovement() {
  if (playerState.isHoldingWeb) {
    applyWebPhysics();
  } else {
    applyFallPhysics();
  }

  if (playerState.velocityY > playerConfig.maxRiseSpeed) {
    playerState.velocityY = playerConfig.maxRiseSpeed;
  }

  if (playerState.velocityY < -playerConfig.maxFallSpeed) {
    playerState.velocityY = -playerConfig.maxFallSpeed;
  }

  playerState.y += playerState.velocityY;

  const maxHeight = getMaxHeight();

  if (playerState.y >= maxHeight) {
    playerState.y = maxHeight;

    if (playerState.isHoldingWeb) {
      playerState.isHoldingWeb = false;
      playerState.velocityY = playerConfig.ceilingFallSpeed;
      webLine.classList.remove('is-visible');
      setMode('fall');
      return;
    }

    if (playerState.velocityY > 0) {
      playerState.velocityY = 0;
    }
  }

  if (playerState.y <= 0) {
    playerState.y = 0;
    if (playerState.velocityY < 0) {
      playerState.velocityY = 0;
    }
    if (!playerState.isHoldingWeb) {
      setMode('run');
    }
  }

  if (playerState.isHoldingWeb) {
    setMode('web');
  } else if (playerState.y > 0) {
    setMode('fall');
  }
}

function updatePlayerPosition() {
  player.style.bottom = `${playerConfig.floorHeight + playerState.y}px`;
}

function updateWebLine() {
  if (playerState.mode !== 'web') return;

  const handPosition = getHandPosition();
  webLine.style.left = `${handPosition.x - 1}px`;
  webLine.style.height = `${Math.max(0, handPosition.yFromTop)}px`;
}

function gameLoop(currentTime) {
  if (miniSpiderGame.isStopped()) {
    return;
  }

  if (miniSpiderGame.isPaused?.()) {
    requestAnimationFrame(gameLoop);
    return;
  }

  updateRunAnimation(currentTime);
  updateFallAnimation(currentTime);

  updateMovement();
  updatePlayerPosition();
  updateWebLine();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;
  if (event.repeat) return;

  event.preventDefault();
  startWeb();
});

window.addEventListener('keyup', (event) => {
  if (event.code !== 'Space') return;

  event.preventDefault();
  releaseWeb();
});

gameDisplay.addEventListener('mousedown', startWeb);
window.addEventListener('mouseup', releaseWeb);
window.addEventListener('mouseleave', releaseWeb);

gameDisplay.addEventListener('touchstart', (event) => {
  event.preventDefault();
  startWeb();
}, { passive: false });

window.addEventListener('touchend', releaseWeb);
window.addEventListener('touchcancel', releaseWeb);

miniSpiderGame.getPlayerBounds = getPlayerBounds;
miniSpiderGame.getPlayerState = () => ({ ...playerState });
miniSpiderGame.getPlayerElement = () => player;
miniSpiderGame.getGameDisplay = () => gameDisplay;
miniSpiderGame.onPlayerDeath((payload = {}) => {
  playerState.isHoldingWeb = false;
  playerState.velocityY = -2.6;
  player.classList.add('is-dying');
  gameDisplay.classList.add('is-player-death');
  webLine.classList.remove('is-visible');
  setMode('fall');
  updatePlayerPosition();
  window.miniSpiderAudio?.play('playerDeath');

  setTimeout(() => {
    miniSpiderGame.triggerGameOver(payload);
  }, playerConfig.deathAnimationDuration);
});

miniSpiderGame.onGameOver(() => {
  playerState.isHoldingWeb = false;
  webLine.classList.remove('is-visible');
});

requestAnimationFrame(gameLoop);
