(() => {
  const gameDisplay = document.querySelector('.game-display');
  const miniSpiderGame = window.miniSpiderGame;
  if (!gameDisplay || !miniSpiderGame) return;

  const coinConfig = {
    firstSpawnDelay: 2400,
    minSpawnDelay: 1700,
    maxSpawnDelay: 3200,
    speed: 178,
    width: 22,
    height: 22,
    groundBottom: 62,
    maxActiveCoins: 3,
    points: 10,
    hitboxInset: 3
  };

  const coinState = {
    coins: [],
    nextSpawnTimeout: null,
    lastFrameTime: performance.now()
  };

  function randomNumber(min, max) {
    return Math.floor(min + Math.random() * (max - min));
  }

  function isStageActive() {
    return miniSpiderGame.getPhase?.() === 'stage' && !miniSpiderGame.isStopped?.() && !miniSpiderGame.isGameOver?.();
  }

  function getGroundY() {
    return gameDisplay.offsetHeight - coinConfig.groundBottom - coinConfig.height;
  }

  function scheduleNextCoin(delay = randomNumber(coinConfig.minSpawnDelay, coinConfig.maxSpawnDelay)) {
    clearTimeout(coinState.nextSpawnTimeout);
    if (!isStageActive()) return;

    coinState.nextSpawnTimeout = setTimeout(() => {
      if (!isStageActive()) return;

      if (miniSpiderGame.isPaused?.()) {
        scheduleNextCoin(450);
        return;
      }

      if (coinState.coins.length >= coinConfig.maxActiveCoins) {
        scheduleNextCoin(700);
        return;
      }

      spawnCoin();
      scheduleNextCoin();
    }, delay);
  }

  function spawnCoin() {
    if (!isStageActive()) return;

    const element = document.createElement('div');
    element.classList.add('ground-coin');
    element.innerHTML = '<span class="ground-coin-shine"></span>';

    const coin = {
      element,
      x: gameDisplay.offsetWidth + randomNumber(20, 150),
      y: getGroundY(),
      width: coinConfig.width,
      height: coinConfig.height
    };

    element.style.left = `${coin.x}px`;
    element.style.top = `${coin.y}px`;
    gameDisplay.appendChild(element);
    coinState.coins.push(coin);
  }

  function removeCoin(coin) {
    coin.element.remove();
    coinState.coins = coinState.coins.filter((item) => item !== coin);
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function getCoinBounds(coin) {
    const inset = coinConfig.hitboxInset;
    return {
      left: coin.x + inset,
      top: coin.y + inset,
      right: coin.x + coin.width - inset,
      bottom: coin.y + coin.height - inset
    };
  }

  function clearCoins() {
    clearTimeout(coinState.nextSpawnTimeout);
    coinState.coins.forEach((coin) => coin.element.remove());
    coinState.coins = [];
  }

  function updateCoins(currentTime) {
    if (miniSpiderGame.isStopped?.() || miniSpiderGame.isGameOver?.()) return;

    if (miniSpiderGame.isPaused?.()) {
      coinState.lastFrameTime = currentTime;
      requestAnimationFrame(updateCoins);
      return;
    }

    if (!isStageActive()) {
      clearCoins();
      coinState.lastFrameTime = currentTime;
      requestAnimationFrame(updateCoins);
      return;
    }

    const deltaTime = Math.min((currentTime - coinState.lastFrameTime) / 1000, 0.04);
    coinState.lastFrameTime = currentTime;
    const playerBounds = miniSpiderGame.getPlayerBounds?.();

    [...coinState.coins].forEach((coin) => {
      coin.x -= coinConfig.speed * deltaTime;
      coin.element.style.left = `${coin.x}px`;

      if (playerBounds && intersects(getCoinBounds(coin), playerBounds)) {
        miniSpiderGame.collectCoin?.(coinConfig.points);
        window.miniSpiderAudio?.play('collectWeb');
        removeCoin(coin);
        return;
      }

      if (coin.x + coin.width < -30) {
        removeCoin(coin);
      }
    });

    requestAnimationFrame(updateCoins);
  }

  miniSpiderGame.onPhaseChange?.((stats) => {
    if (stats.phase !== 'stage') {
      clearCoins();
      return;
    }

    scheduleNextCoin(700);
  });
  miniSpiderGame.onPlayerDeath?.(clearCoins);
  miniSpiderGame.onGameOver(clearCoins);

  scheduleNextCoin(coinConfig.firstSpawnDelay);
  requestAnimationFrame(updateCoins);
})();
