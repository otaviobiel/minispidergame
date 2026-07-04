(() => {
const obstacleGameDisplay = document.querySelector('.game-display');
const miniSpiderGame = window.miniSpiderGame;
if (!obstacleGameDisplay || !miniSpiderGame) return;

const obstacleSprites = {
  warning: './assets/obstacles/laser-warning.png',
  emitterTop: './assets/obstacles/laser-emitter-top.png',
  emitterBottom: './assets/obstacles/laser-emitter-bottom.png'
};

const obstacleConfig = {
  firstSpawnDelay: 3200,
  minSpawnDelay: 5200,
  maxSpawnDelay: 7600,
  warningDuration: 1050,
  gateSpeed: 250,
  gateWidth: 28,
  emitterHeight: 24,
  gapHeight: 275,
  topSafeLimit: 32,
  floorSafeLimit: 68,
  warningWidth: 84,
  warningRight: 28,
  beamHitboxPaddingX: 7,
  beamVisualWidth: 12
};

const obstacleState = {
  activeGates: [],
  nextSpawnTimeout: null,
  isWarningActive: false,
  warningElement: null,
  warningTimeout: null,
  lastFrameTime: performance.now()
};

function isStageActive() {
  return miniSpiderGame.getPhase?.() === 'stage' && !miniSpiderGame.isStopped?.() && !miniSpiderGame.isGameOver();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRandomDelay() {
  return Math.floor(
    obstacleConfig.minSpawnDelay + Math.random() * (obstacleConfig.maxSpawnDelay - obstacleConfig.minSpawnDelay)
  );
}

function getRandomGapCenterY() {
  const displayHeight = obstacleGameDisplay.offsetHeight;
  const minCenter = obstacleConfig.topSafeLimit + obstacleConfig.gapHeight / 2;
  const maxCenter = displayHeight - obstacleConfig.floorSafeLimit - obstacleConfig.gapHeight / 2;
  return minCenter + Math.random() * Math.max(0, maxCenter - minCenter);
}

function getGapTop(gapCenterY) {
  const displayHeight = obstacleGameDisplay.offsetHeight;
  const maxGapTop = displayHeight - obstacleConfig.floorSafeLimit - obstacleConfig.gapHeight;
  return clamp(
    gapCenterY - obstacleConfig.gapHeight / 2,
    obstacleConfig.topSafeLimit,
    maxGapTop
  );
}

function scheduleNextGate(delay = getRandomDelay()) {
  clearTimeout(obstacleState.nextSpawnTimeout);
  if (!isStageActive()) return;

  obstacleState.nextSpawnTimeout = setTimeout(() => {
    obstacleState.nextSpawnTimeout = null;
    if (!isStageActive()) return;
    if (miniSpiderGame.isPaused?.()) {
      scheduleNextGate(500);
      return;
    }
    if (obstacleState.activeGates.length > 0 || obstacleState.isWarningActive) return scheduleNextGate(900);
    startLaserWarning();
  }, delay);
}

function startLaserWarning() {
  if (!isStageActive() || miniSpiderGame.isPaused?.()) return;
  obstacleState.isWarningActive = true;

  const warning = document.createElement('div');
  warning.classList.add('laser-warning-zone');
  warning.innerHTML = `
    <div class="laser-warning-bar laser-warning-bar-top"></div>
    <div class="laser-warning-gap">
      <img src="${obstacleSprites.warning}" alt="Aviso de laser">
    </div>
    <div class="laser-warning-bar laser-warning-bar-bottom"></div>
  `;

  let gapTop = getGapTop(getRandomGapCenterY());
  warning.style.right = `${obstacleConfig.warningRight}px`;
  warning.style.top = `${gapTop}px`;
  warning.style.height = `${obstacleConfig.gapHeight}px`;

  obstacleGameDisplay.appendChild(warning);
  obstacleState.warningElement = warning;
  window.miniSpiderAudio?.play('laserWarning');

  obstacleState.warningTimeout = setTimeout(() => {
    warning.remove();
    obstacleState.warningElement = null;
    obstacleState.isWarningActive = false;
    if (isStageActive() && !miniSpiderGame.isPaused?.()) {
      spawnLaserGate(gapTop);
    } else {
      scheduleNextGate(550);
    }
  }, obstacleConfig.warningDuration);
}

function spawnLaserGate(gapTop) {
  if (!isStageActive() || miniSpiderGame.isPaused?.()) return;

  const displayWidth = obstacleGameDisplay.offsetWidth;
  const displayHeight = obstacleGameDisplay.offsetHeight;
  const gapBottom = gapTop + obstacleConfig.gapHeight;

  const gateElement = document.createElement('div');
  gateElement.classList.add('laser-gate');
  gateElement.style.left = `${displayWidth + 34}px`;
  gateElement.style.width = `${obstacleConfig.gateWidth}px`;
  gateElement.style.height = `${displayHeight}px`;

  const topEmitter = document.createElement('img');
  topEmitter.classList.add('laser-emitter', 'laser-emitter-top');
  topEmitter.src = obstacleSprites.emitterTop;
  topEmitter.alt = 'Emissor de laser';
  topEmitter.style.top = `${Math.max(0, gapTop - obstacleConfig.emitterHeight)}px`;

  const topBeam = document.createElement('div');
  topBeam.classList.add('laser-beam', 'laser-beam-top');
  topBeam.style.height = `${Math.max(0, gapTop - obstacleConfig.emitterHeight)}px`;

  const bottomEmitter = document.createElement('img');
  bottomEmitter.classList.add('laser-emitter', 'laser-emitter-bottom');
  bottomEmitter.src = obstacleSprites.emitterBottom;
  bottomEmitter.alt = 'Emissor de laser';
  bottomEmitter.style.top = `${gapBottom}px`;

  const bottomBeam = document.createElement('div');
  bottomBeam.classList.add('laser-beam', 'laser-beam-bottom');
  bottomBeam.style.top = `${gapBottom + obstacleConfig.emitterHeight}px`;
  bottomBeam.style.height = `${Math.max(0, displayHeight - (gapBottom + obstacleConfig.emitterHeight))}px`;

  gateElement.appendChild(topBeam);
  gateElement.appendChild(topEmitter);
  gateElement.appendChild(bottomEmitter);
  gateElement.appendChild(bottomBeam);
  obstacleGameDisplay.appendChild(gateElement);
  window.miniSpiderAudio?.play('laserFire');

  obstacleState.activeGates.push({
    element: gateElement,
    x: displayWidth + 34,
    width: obstacleConfig.gateWidth,
    gapTop,
    gapBottom,
    displayHeight,
    counted: false
  });
}

function removeGate(gate) {
  gate.element.remove();
  obstacleState.activeGates = obstacleState.activeGates.filter((item) => item !== gate);
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function getGateHitboxes(gate) {
  const left = gate.x + obstacleConfig.beamHitboxPaddingX;
  const right = gate.x + gate.width - obstacleConfig.beamHitboxPaddingX;
  return [
    { left, right, top: 0, bottom: Math.max(0, gate.gapTop) },
    { left, right, top: gate.gapBottom, bottom: gate.displayHeight }
  ];
}

function clearObstacleSystems() {
  clearTimeout(obstacleState.nextSpawnTimeout);
  obstacleState.nextSpawnTimeout = null;
  clearTimeout(obstacleState.warningTimeout);
  obstacleState.warningElement?.remove();
  obstacleState.warningElement = null;
  obstacleState.isWarningActive = false;
  obstacleState.activeGates.forEach((gate) => gate.element.remove());
  obstacleState.activeGates = [];
}

function updateObstacles(currentTime) {
  if (miniSpiderGame.isStopped?.() || miniSpiderGame.isGameOver()) return;

  if (miniSpiderGame.isPaused?.()) {
    obstacleState.lastFrameTime = currentTime;
    requestAnimationFrame(updateObstacles);
    return;
  }

  if (miniSpiderGame.getPhase?.() !== 'stage') {
    clearObstacleSystems();
    obstacleState.lastFrameTime = currentTime;
    requestAnimationFrame(updateObstacles);
    return;
  }

  const deltaTime = Math.min((currentTime - obstacleState.lastFrameTime) / 1000, 0.04);
  obstacleState.lastFrameTime = currentTime;
  const playerBounds = miniSpiderGame.getPlayerBounds?.();

  if (!obstacleState.nextSpawnTimeout && obstacleState.activeGates.length === 0 && !obstacleState.isWarningActive) {
    scheduleNextGate();
  }

  [...obstacleState.activeGates].forEach((gate) => {
    gate.x -= obstacleConfig.gateSpeed * deltaTime;
    gate.element.style.left = `${gate.x}px`;

    if (!gate.counted && playerBounds && gate.x + gate.width < playerBounds.left) {
      gate.counted = true;
      miniSpiderGame.addObstaclePassed?.('laser');
    }

    if (playerBounds) {
      const hitboxes = getGateHitboxes(gate);
      if (hitboxes.some((hitbox) => intersects(hitbox, playerBounds))) {
        miniSpiderGame.triggerPlayerDeath?.({ message: 'Você foi atingido por um corredor de laser.' });
        return;
      }
    }

    if (gate.x + gate.width < -40) {
      removeGate(gate);
      miniSpiderGame.addObstaclePassed?.('laser');
      if (obstacleState.activeGates.length === 0 && !obstacleState.isWarningActive) {
        scheduleNextGate();
      }
    }
  });

  requestAnimationFrame(updateObstacles);
}

miniSpiderGame.onPhaseChange?.((stats) => {
  if (stats.phase !== 'stage') {
    clearObstacleSystems();
    return;
  }

  obstacleState.lastFrameTime = performance.now();
  if (!obstacleState.nextSpawnTimeout && obstacleState.activeGates.length === 0 && !obstacleState.isWarningActive) {
    scheduleNextGate(900);
  }
});
miniSpiderGame.onPlayerDeath?.(clearObstacleSystems);
miniSpiderGame.onGameOver(clearObstacleSystems);
scheduleNextGate(obstacleConfig.firstSpawnDelay);
requestAnimationFrame(updateObstacles);
})();
