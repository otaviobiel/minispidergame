(() => {
  const gameDisplay = document.querySelector('.game-display');
  const miniSpiderGame = window.miniSpiderGame;
  if (!gameDisplay || !miniSpiderGame) return;

  const config = {
    firstSpawnDelay: 3300,
    minSpawnDelay: 5200,
    maxSpawnDelay: 8200,
    maxActiveBombs: 1,
    bombWidth: 34,
    bombHeight: 34,
    groundBottom: 54,
    bombHealth: 2,
    bombPoints: 50,
    dangerRadius: 74,
    bombScrollSpeed: 178,
    throwDuration: 850,
    throwArcHeight: 125,
    webShotSpeed: 560,
    webShotWidth: 34,
    webShotHeight: 10,
    webHitboxInset: 2,
    bossWebDamage: 10
  };

  const state = {
    bombs: [],
    webShots: [],
    nextSpawnTimeout: null,
    lastFrameTime: performance.now()
  };

  function randomNumber(min, max) {
    return Math.floor(min + Math.random() * (max - min));
  }

  function isBombStageActive() {
    return miniSpiderGame.getPhase?.() === 'stage' && !miniSpiderGame.isStopped?.() && !miniSpiderGame.isGameOver?.();
  }

  function canUpdateWebShots() {
    return ['stage', 'pre-boss', 'boss'].includes(miniSpiderGame.getPhase?.()) && !miniSpiderGame.isStopped?.() && !miniSpiderGame.isGameOver?.();
  }

  function scheduleNextBomb(delay = randomNumber(config.minSpawnDelay, config.maxSpawnDelay)) {
    clearTimeout(state.nextSpawnTimeout);
    if (!isBombStageActive()) return;

    state.nextSpawnTimeout = setTimeout(() => {
      if (!isBombStageActive()) return;
      if (miniSpiderGame.isPaused?.()) {
        scheduleNextBomb(450);
        return;
      }
      if (state.bombs.length >= config.maxActiveBombs) {
        scheduleNextBomb(900);
        return;
      }
      spawnBomb();
      scheduleNextBomb();
    }, delay);
  }

  function getGroundY() {
    return gameDisplay.offsetHeight - config.groundBottom - config.bombHeight;
  }

  function getPlayerShotOrigin() {
    const bounds = miniSpiderGame.getPlayerBounds?.();
    if (!bounds) return null;

    return {
      x: bounds.right - 2,
      y: bounds.top + bounds.height / 2 - config.webShotHeight / 2
    };
  }

  function spawnBomb() {
    if (!isBombStageActive()) return;

    const wrapper = document.createElement('div');
    wrapper.classList.add('ground-bomb', 'is-thrown');
    wrapper.innerHTML = `
      <span class="ground-bomb-radius"></span>
      <span class="ground-bomb-body">
        <span class="ground-bomb-fuse"></span>
        <span class="ground-bomb-spark"></span>
      </span>
    `;

    const targetX = randomNumber(
      Math.floor(gameDisplay.offsetWidth * 0.52),
      Math.floor(gameDisplay.offsetWidth * 0.88)
    );
    const targetY = getGroundY();
    const startX = gameDisplay.offsetWidth + config.bombWidth + 42;
    const startY = randomNumber(44, 110);
    const now = performance.now();

    const bomb = {
      element: wrapper,
      x: startX,
      y: startY,
      startX,
      startY,
      targetX,
      targetY,
      width: config.bombWidth,
      height: config.bombHeight,
      health: config.bombHealth,
      state: 'thrown',
      bornAt: now,
      armedAt: 0
    };

    wrapper.style.left = `${bomb.x}px`;
    wrapper.style.top = `${bomb.y}px`;
    gameDisplay.appendChild(wrapper);
    state.bombs.push(bomb);
    window.miniSpiderAudio?.play('missileLaunch');
  }

  function spawnWebShot() {
    if (!canUpdateWebShots()) return;

    const origin = getPlayerShotOrigin();
    if (!origin) return;

    const element = document.createElement('div');
    element.classList.add('web-fluid-shot');

    const shot = {
      element,
      x: origin.x,
      y: origin.y,
      width: config.webShotWidth,
      height: config.webShotHeight
    };

    element.style.left = `${shot.x}px`;
    element.style.top = `${shot.y}px`;
    gameDisplay.appendChild(element);
    state.webShots.push(shot);
  }

  function removeBomb(bomb, defused = false) {
    bomb.element.remove();
    state.bombs = state.bombs.filter((item) => item !== bomb);

    if (defused) {
      miniSpiderGame.defeatThug?.(config.bombPoints);
      window.miniSpiderAudio?.play('bossHit');
    }
  }

  function explodeBomb(bomb, killsPlayer = false) {
    if (!bomb || bomb.state === 'exploding') return;
    bomb.state = 'exploding';
    bomb.element.classList.add('is-exploding');
    window.miniSpiderAudio?.play('laserFire');

    if (killsPlayer) {
      miniSpiderGame.triggerPlayerDeath?.({ message: 'A bomba explodiu perto demais.' });
    }

    setTimeout(() => removeBomb(bomb, false), 260);
  }

  function removeWebShot(shot) {
    shot.element.remove();
    state.webShots = state.webShots.filter((item) => item !== shot);
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function getBox(item, inset = 0) {
    return {
      left: item.x + inset,
      top: item.y + inset,
      right: item.x + item.width - inset,
      bottom: item.y + item.height - inset
    };
  }

  function getBombBodyBox(bomb) {
    return {
      left: bomb.x + 5,
      top: bomb.y + 7,
      right: bomb.x + bomb.width - 5,
      bottom: bomb.y + bomb.height - 3
    };
  }

  function getCenter(bounds) {
    return {
      x: bounds.left + (bounds.width ?? (bounds.right - bounds.left)) / 2,
      y: bounds.top + (bounds.height ?? (bounds.bottom - bounds.top)) / 2
    };
  }

  function clearBombs() {
    clearTimeout(state.nextSpawnTimeout);
    state.bombs.forEach((bomb) => bomb.element.remove());
    state.bombs = [];
  }

  function clearWebShots() {
    state.webShots.forEach((shot) => shot.element.remove());
    state.webShots = [];
  }

  function clearBombSystems() {
    clearBombs();
    clearWebShots();
  }

  function updateBombs(currentTime, deltaTime) {
    const playerBounds = miniSpiderGame.getPlayerBounds?.();
    const playerCenter = playerBounds ? getCenter(playerBounds) : null;

    [...state.bombs].forEach((bomb) => {
      if (bomb.state === 'thrown') {
        const progress = Math.min(1, (currentTime - bomb.bornAt) / config.throwDuration);
        const eased = 1 - Math.pow(1 - progress, 2);
        const arc = Math.sin(progress * Math.PI) * config.throwArcHeight;

        bomb.x = bomb.startX + (bomb.targetX - bomb.startX) * eased;
        bomb.y = bomb.startY + (bomb.targetY - bomb.startY) * eased - arc;

        if (progress >= 1) {
          bomb.x = bomb.targetX;
          bomb.y = bomb.targetY;
          bomb.state = 'armed';
          bomb.armedAt = currentTime;
          bomb.element.classList.remove('is-thrown');
          bomb.element.classList.add('is-armed');
        }
      } else if (bomb.state === 'armed') {
        bomb.x -= config.bombScrollSpeed * deltaTime;
      }

      bomb.element.style.left = `${bomb.x}px`;
      bomb.element.style.top = `${bomb.y}px`;

      if (bomb.state === 'armed' && playerBounds && intersects(getBombBodyBox(bomb), playerBounds)) {
        explodeBomb(bomb, true);
        return;
      }

      if (bomb.state === 'armed' && playerCenter) {
        const bombCenter = {
          x: bomb.x + bomb.width / 2,
          y: bomb.y + bomb.height / 2
        };
        const distance = Math.hypot(playerCenter.x - bombCenter.x, playerCenter.y - bombCenter.y);

        if (distance <= config.dangerRadius) {
          explodeBomb(bomb, true);
          return;
        }
      }

      if (bomb.x + bomb.width < -120) {
        removeBomb(bomb, false);
      }
    });
  }

  function tryHitBossWithShot(shot, shotBounds) {
    const bossTarget = window.miniSpiderBossTarget;
    if (!bossTarget?.isActive?.()) return false;

    const bossBounds = bossTarget.getBounds?.();
    if (!bossBounds || !intersects(shotBounds, bossBounds)) return false;

    removeWebShot(shot);
    bossTarget.hit?.(config.bossWebDamage);
    return true;
  }

  function updateWebShots(deltaTime) {
    [...state.webShots].forEach((shot) => {
      shot.x += config.webShotSpeed * deltaTime;
      shot.element.style.left = `${shot.x}px`;

      const shotBounds = getBox(shot, config.webHitboxInset);

      for (const bomb of [...state.bombs]) {
        if (bomb.state === 'exploding') continue;
        if (!intersects(shotBounds, getBox(bomb, 1))) continue;

        bomb.health -= 1;
        bomb.element.classList.add('is-hit');
        setTimeout(() => bomb.element?.classList.remove('is-hit'), 120);
        removeWebShot(shot);

        if (bomb.health <= 0) {
          bomb.element.classList.add('is-defused');
          removeBomb(bomb, true);
        }
        return;
      }

      if (tryHitBossWithShot(shot, shotBounds)) return;

      if (shot.x > gameDisplay.offsetWidth + 40) {
        removeWebShot(shot);
      }
    });
  }

  function update(currentTime) {
    if (miniSpiderGame.isStopped?.() || miniSpiderGame.isGameOver?.()) return;

    if (miniSpiderGame.isPaused?.()) {
      state.lastFrameTime = currentTime;
      requestAnimationFrame(update);
      return;
    }

    if (!canUpdateWebShots()) {
      clearBombSystems();
      state.lastFrameTime = currentTime;
      requestAnimationFrame(update);
      return;
    }

    const deltaTime = Math.min((currentTime - state.lastFrameTime) / 1000, 0.04);
    state.lastFrameTime = currentTime;

    if (isBombStageActive()) {
      updateBombs(currentTime, deltaTime);
    } else {
      clearBombs();
    }

    updateWebShots(deltaTime);

    requestAnimationFrame(update);
  }

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'KeyF' || event.repeat) return;
    if (miniSpiderGame.shootWeb?.()) {
      event.preventDefault();
      window.miniSpiderAudio?.play('webShoot');
    }
  });

  miniSpiderGame.onWebShot?.(spawnWebShot);
  miniSpiderGame.onPhaseChange?.((stats) => {
    if (stats.phase === 'stage') {
      scheduleNextBomb(1200);
      return;
    }

    clearBombs();
    if (stats.phase !== 'pre-boss') clearWebShots();
  });
  miniSpiderGame.onPlayerDeath?.(clearBombSystems);
  miniSpiderGame.onGameOver(clearBombSystems);

  scheduleNextBomb(config.firstSpawnDelay);
  requestAnimationFrame(update);
})();
