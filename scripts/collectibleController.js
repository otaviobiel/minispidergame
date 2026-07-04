(() => {
  const gameDisplay = document.querySelector('.game-display');
  const miniSpiderGame = window.miniSpiderGame;
  if (!gameDisplay || !miniSpiderGame) return;

  const collectibleConfig = {
    src: './assets/collectibles/web-energy.png',
    width: 32,
    height: 32,
    speed: 175,
    minDelay: 1600,
    maxDelay: 2850,
    floorSafeLimit: 82,
    topSafeLimit: 60,
    energyValue: 25
  };

  const collectibleState = {
    items: [],
    nextSpawnTimeout: null,
    lastFrameTime: performance.now()
  };

  function randomNumber(min, max) {
    return Math.floor(min + Math.random() * (max - min));
  }

  function canSpawnCollectible() {
    return ['stage', 'pre-boss', 'boss-intro', 'boss'].includes(miniSpiderGame.getPhase()) && !miniSpiderGame.isStopped();
  }

  function scheduleNextCollectible(delay = randomNumber(collectibleConfig.minDelay, collectibleConfig.maxDelay)) {
    clearTimeout(collectibleState.nextSpawnTimeout);

    if (!canSpawnCollectible()) return;

    collectibleState.nextSpawnTimeout = setTimeout(() => {
      if (miniSpiderGame.isPaused()) {
        scheduleNextCollectible(400);
        return;
      }

      if (canSpawnCollectible()) {
        spawnCollectible();
      }
    }, delay);
  }

  function spawnCollectible() {
    const displayHeight = gameDisplay.offsetHeight;
    const displayWidth = gameDisplay.offsetWidth;
    const minY = collectibleConfig.topSafeLimit;
    const maxY = displayHeight - collectibleConfig.floorSafeLimit;
    const y = randomNumber(minY, maxY);

    const itemElement = document.createElement('img');
    itemElement.classList.add('web-collectible');
    itemElement.src = collectibleConfig.src;
    itemElement.alt = 'Energia de teia';

    const item = {
      element: itemElement,
      x: displayWidth + collectibleConfig.width,
      y,
      width: collectibleConfig.width,
      height: collectibleConfig.height
    };

    itemElement.style.left = `${item.x}px`;
    itemElement.style.top = `${item.y}px`;
    gameDisplay.appendChild(itemElement);
    collectibleState.items.push(item);

    scheduleNextCollectible();
  }

  function removeItem(item) {
    item.element.remove();
    collectibleState.items = collectibleState.items.filter((current) => current !== item);
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function getItemBounds(item) {
    return {
      left: item.x + 6,
      top: item.y + 6,
      right: item.x + item.width - 6,
      bottom: item.y + item.height - 6
    };
  }

  function clearCollectibles() {
    clearTimeout(collectibleState.nextSpawnTimeout);
    collectibleState.items.forEach((item) => item.element.remove());
    collectibleState.items = [];
  }

  function updateCollectibles(currentTime) {
    if (miniSpiderGame.isStopped()) return;

    if (miniSpiderGame.isPaused()) {
      collectibleState.lastFrameTime = currentTime;
      requestAnimationFrame(updateCollectibles);
      return;
    }

    if (!canSpawnCollectible()) {
      clearCollectibles();
      return;
    }

    const deltaTime = Math.min((currentTime - collectibleState.lastFrameTime) / 1000, 0.04);
    collectibleState.lastFrameTime = currentTime;
    const playerBounds = miniSpiderGame.getPlayerBounds?.();

    [...collectibleState.items].forEach((item) => {
      item.x -= collectibleConfig.speed * deltaTime;
      item.element.style.left = `${item.x}px`;

      if (playerBounds && intersects(getItemBounds(item), playerBounds)) {
        miniSpiderGame.collectWebEnergy(1, collectibleConfig.energyValue);
        window.miniSpiderAudio?.play('collectWeb');
        removeItem(item);
        return;
      }

      if (item.x + item.width < -20) {
        removeItem(item);
      }
    });

    requestAnimationFrame(updateCollectibles);
  }

  miniSpiderGame.onPhaseChange((stats) => {
    if (!['stage', 'pre-boss', 'boss-intro', 'boss'].includes(stats.phase)) {
      clearCollectibles();
      return;
    }

    if (collectibleState.items.length === 0) {
      scheduleNextCollectible(900);
    }
  });
  miniSpiderGame.onPlayerDeath(clearCollectibles);
  miniSpiderGame.onGameOver(clearCollectibles);

  scheduleNextCollectible(1500);
  requestAnimationFrame(updateCollectibles);
})();
