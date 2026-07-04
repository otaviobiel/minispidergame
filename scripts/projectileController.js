(() => {
const projectileGameDisplay = document.querySelector('.game-display');
const miniSpiderGame = window.miniSpiderGame;
if (!projectileGameDisplay || !miniSpiderGame) return;

const projectileSprites = {
  missile: './assets/projectiles/missile.png',
  warning: './assets/projectiles/warning.png'
};

const projectileConfig = {
  warningDuration: 1150,
  firstSpawnDelay: 1200,
  minSpawnDelay: 2600,
  maxSpawnDelay: 4400,
  missileSpeed: 560,
  missileWidth: 64,
  missileHeight: 28,
  warningWidth: 48,
  warningHeight: 48,
  warningRight: 8,
  floorSafeLimit: 72,
  topSafeLimit: 28,
  oneAtATime: true,
  hitboxInsetX: 8,
  hitboxInsetY: 5
};

const projectileState = {
  activeProjectiles: [],
  isWarningActive: false,
  lastFrameTime: performance.now(),
  nextSpawnTimeout: null,
  warningFrame: null,
  warningElement: null,
  warningResolveTimeout: null
};

function isStageActive() {
  return miniSpiderGame.getPhase?.() === 'stage' && !miniSpiderGame.isStopped?.() && !miniSpiderGame.isGameOver();
}

function getRandomDelay() {
  return Math.floor(
    projectileConfig.minSpawnDelay + Math.random() * (projectileConfig.maxSpawnDelay - projectileConfig.minSpawnDelay)
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPlayerCenterY() {
  const bounds = miniSpiderGame.getPlayerBounds?.();
  if (!bounds) return projectileGameDisplay.offsetHeight / 2;
  return bounds.top + bounds.height / 2;
}

function getSafeTargetY() {
  const displayHeight = projectileGameDisplay.offsetHeight;
  const playerCenterY = getPlayerCenterY();

  return clamp(
    playerCenterY,
    projectileConfig.topSafeLimit,
    displayHeight - projectileConfig.floorSafeLimit
  );
}

function scheduleNextProjectile(delay = getRandomDelay()) {
  clearTimeout(projectileState.nextSpawnTimeout);
  if (!isStageActive()) return;

  projectileState.nextSpawnTimeout = setTimeout(() => {
    projectileState.nextSpawnTimeout = null;
    if (!isStageActive()) return;
    if (miniSpiderGame.isPaused?.()) {
      scheduleNextProjectile(400);
      return;
    }
    if (projectileConfig.oneAtATime && projectileState.activeProjectiles.length > 0) {
      scheduleNextProjectile(700);
      return;
    }
    startProjectileWarning();
  }, delay);
}

function startProjectileWarning() {
  if (projectileState.isWarningActive || !isStageActive() || miniSpiderGame.isPaused?.()) return;

  projectileState.isWarningActive = true;
  const warning = document.createElement('img');
  warning.classList.add('projectile-warning');
  warning.src = projectileSprites.warning;
  warning.alt = 'Aviso de míssil';
  projectileGameDisplay.appendChild(warning);
  projectileState.warningElement = warning;
  window.miniSpiderAudio?.play('missileWarning');

  let targetY = getSafeTargetY();

  function followPlayerDuringWarning() {
    if (!isStageActive()) return;
    if (miniSpiderGame.isPaused?.()) {
      projectileState.warningFrame = requestAnimationFrame(followPlayerDuringWarning);
      return;
    }
    targetY = getSafeTargetY();
    warning.style.top = `${targetY - projectileConfig.warningHeight / 2}px`;
    warning.style.right = `${projectileConfig.warningRight}px`;
    projectileState.warningFrame = requestAnimationFrame(followPlayerDuringWarning);
  }

  followPlayerDuringWarning();

  projectileState.warningResolveTimeout = setTimeout(() => {
    cancelAnimationFrame(projectileState.warningFrame);
    warning.remove();
    projectileState.warningElement = null;
    projectileState.isWarningActive = false;
    if (isStageActive() && !miniSpiderGame.isPaused?.()) {
      spawnMissile(targetY);
    } else {
      scheduleNextProjectile(450);
    }
  }, projectileConfig.warningDuration);
}

function spawnMissile(targetY) {
  if (!isStageActive() || miniSpiderGame.isPaused?.()) return;

  const missile = document.createElement('img');
  missile.classList.add('projectile-missile');
  missile.src = projectileSprites.missile;
  missile.alt = 'Míssil';

  const displayWidth = projectileGameDisplay.offsetWidth;
  const projectile = {
    element: missile,
    x: displayWidth + projectileConfig.missileWidth,
    y: targetY - projectileConfig.missileHeight / 2,
    width: projectileConfig.missileWidth,
    height: projectileConfig.missileHeight
  };

  missile.style.left = `${projectile.x}px`;
  missile.style.top = `${projectile.y}px`;

  projectileGameDisplay.appendChild(missile);
  projectileState.activeProjectiles.push(projectile);
  window.miniSpiderAudio?.play('missileLaunch');
}

function removeProjectile(projectile) {
  projectile.element.remove();
  projectileState.activeProjectiles = projectileState.activeProjectiles.filter((item) => item !== projectile);
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function getProjectileBounds(projectile) {
  return {
    left: projectile.x + projectileConfig.hitboxInsetX,
    top: projectile.y + projectileConfig.hitboxInsetY,
    right: projectile.x + projectile.width - projectileConfig.hitboxInsetX,
    bottom: projectile.y + projectile.height - projectileConfig.hitboxInsetY
  };
}

function clearProjectileSystems() {
  clearTimeout(projectileState.nextSpawnTimeout);
  projectileState.nextSpawnTimeout = null;
  clearTimeout(projectileState.warningResolveTimeout);
  cancelAnimationFrame(projectileState.warningFrame);
  projectileState.warningElement?.remove();
  projectileState.warningElement = null;
  projectileState.isWarningActive = false;
  projectileState.activeProjectiles.forEach((projectile) => projectile.element.remove());
  projectileState.activeProjectiles = [];
}

function updateProjectiles(currentTime) {
  if (miniSpiderGame.isStopped?.() || miniSpiderGame.isGameOver()) return;

  if (miniSpiderGame.isPaused?.()) {
    projectileState.lastFrameTime = currentTime;
    requestAnimationFrame(updateProjectiles);
    return;
  }

  if (miniSpiderGame.getPhase?.() !== 'stage') {
    clearProjectileSystems();
    projectileState.lastFrameTime = currentTime;
    requestAnimationFrame(updateProjectiles);
    return;
  }

  const deltaTime = Math.min((currentTime - projectileState.lastFrameTime) / 1000, 0.04);
  projectileState.lastFrameTime = currentTime;
  const playerBounds = miniSpiderGame.getPlayerBounds?.();

  if (!projectileState.nextSpawnTimeout && projectileState.activeProjectiles.length === 0 && !projectileState.isWarningActive) {
    scheduleNextProjectile();
  }

  [...projectileState.activeProjectiles].forEach((projectile) => {
    projectile.x -= projectileConfig.missileSpeed * deltaTime;
    projectile.element.style.left = `${projectile.x}px`;

    if (playerBounds && intersects(getProjectileBounds(projectile), playerBounds)) {
      miniSpiderGame.triggerPlayerDeath?.({ message: 'Um míssil te acertou em cheio.' });
      return;
    }

    if (projectile.x + projectile.width < -20) {
      removeProjectile(projectile);
      miniSpiderGame.addObstaclePassed?.('missile');
      if (projectileState.activeProjectiles.length === 0 && !projectileState.isWarningActive) {
        scheduleNextProjectile();
      }
    }
  });

  requestAnimationFrame(updateProjectiles);
}

miniSpiderGame.onPhaseChange?.((stats) => {
  if (stats.phase !== 'stage') {
    clearProjectileSystems();
    return;
  }

  projectileState.lastFrameTime = performance.now();
  if (!projectileState.nextSpawnTimeout && projectileState.activeProjectiles.length === 0 && !projectileState.isWarningActive) {
    scheduleNextProjectile(900);
  }
});
miniSpiderGame.onPlayerDeath?.(clearProjectileSystems);
miniSpiderGame.onGameOver(clearProjectileSystems);
scheduleNextProjectile(projectileConfig.firstSpawnDelay);
requestAnimationFrame(updateProjectiles);
})();
