(() => {
  const gameDisplay = document.querySelector('.game-display');
  const miniSpiderGame = window.miniSpiderGame;
  if (!gameDisplay || !miniSpiderGame) return;

  const config = {
    stageDurationMs: 60000
  };

  const elements = {
    phaseLabel: document.querySelector('[data-phase-label]'),
    mainPercent: document.querySelector('[data-main-bar-percent]'),
    mainFill: document.querySelector('[data-main-bar-fill]'),
    mainPointer: document.querySelector('[data-main-bar-pointer]'),
    scorePoints: document.querySelector('[data-score-points]'),
    scoreThugs: document.querySelector('[data-score-thugs]'),
    scoreCoins: document.querySelector('[data-score-coins]'),
    scoreWebs: document.querySelector('[data-score-webs]'),
    energyFill: document.querySelector('[data-energy-fill]'),
    energyValue: document.querySelector('[data-energy-value]'),
    shootButton: document.querySelector('[data-special-button]'),
    shootText: document.querySelector('[data-special-text]'),
    pauseButton: document.querySelector('[data-pause-game]'),
    resumeButton: document.querySelector('[data-resume-game]'),
    pauseOverlay: document.querySelector('[data-pause-overlay]')
  };

  let lastFrameTime = performance.now();

  function stopControlPropagation(element) {
    if (!element) return;
    ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach((eventName) => {
      element.addEventListener(eventName, (event) => {
        event.stopPropagation();
      }, { passive: eventName === 'touchstart' ? false : undefined });
    });
  }

  stopControlPropagation(elements.shootButton);
  stopControlPropagation(elements.pauseButton);
  stopControlPropagation(elements.resumeButton);
  stopControlPropagation(elements.pauseOverlay);

  function updateHud() {
    const stats = miniSpiderGame.getStats();
    const phase = stats.phase;
    const isBoss = phase === 'boss';
    const isBossIntro = phase === 'boss-intro';
    const isPreBoss = phase === 'pre-boss';
    const barValue = isBoss
      ? (stats.bossHealth / stats.bossMaxHealth) * 100
      : isPreBoss
        ? (stats.preBossHealth / stats.preBossMaxHealth) * 100
        : stats.progress;

    if (elements.phaseLabel) {
      if (isBoss) elements.phaseLabel.textContent = 'VIDA DO CHEFE';
      else if (isBossIntro) elements.phaseLabel.textContent = 'CHEFE FINAL';
      else if (isPreBoss) elements.phaseLabel.textContent = 'VIDA DO CHEFE DO MEIO';
      else elements.phaseLabel.textContent = 'PROGRESSO';
    }

    if (elements.mainPercent) {
      elements.mainPercent.textContent = isBossIntro ? '!!!' : `${Math.round(barValue)}%`;
    }

    if (elements.mainFill) {
      elements.mainFill.style.width = `${barValue}%`;
      elements.mainFill.classList.toggle('is-boss-life', isBoss || isPreBoss);
      elements.mainFill.classList.toggle('is-pre-boss', isPreBoss);
    }

    if (elements.mainPointer) {
      const pointerValue = Math.max(2, Math.min(98, barValue));
      elements.mainPointer.style.left = `${pointerValue}%`;
      elements.mainPointer.style.opacity = isBossIntro ? '0.9' : '1';
    }

    if (elements.scorePoints) elements.scorePoints.textContent = stats.score || 0;
    if (elements.scoreThugs) elements.scoreThugs.textContent = stats.thugsDefeated || 0;
    if (elements.scoreCoins) elements.scoreCoins.textContent = stats.coinsCollected || 0;
    if (elements.scoreWebs) elements.scoreWebs.textContent = stats.websCollected || 0;

    if (elements.energyFill) elements.energyFill.style.height = `${stats.energy}%`;
    if (elements.energyValue) elements.energyValue.textContent = Math.round(stats.energy);

    if (elements.shootButton) {
      const canShoot = miniSpiderGame.canShootWeb?.() || false;
      elements.shootButton.disabled = !canShoot;
      elements.shootButton.classList.toggle('is-ready', canShoot);
      elements.shootButton.classList.toggle('is-boss-phase', ['stage', 'pre-boss', 'boss'].includes(phase));
    }

    if (elements.shootText) {
      if (['stage', 'pre-boss', 'boss'].includes(phase)) {
        elements.shootText.textContent = miniSpiderGame.canShootWeb?.() ? 'ATIRAR' : 'SEM TEIA';
      } else {
        elements.shootText.textContent = 'FASE';
      }
    }
  }

  function setPausedUi(isPaused) {
    gameDisplay.classList.toggle('is-paused', isPaused);
    elements.pauseOverlay?.classList.toggle('is-visible', isPaused);
    elements.pauseOverlay?.setAttribute('aria-hidden', String(!isPaused));
    if (elements.pauseButton) elements.pauseButton.textContent = isPaused ? '▶' : 'II';
  }

  elements.pauseButton?.addEventListener('click', () => {
    miniSpiderGame.togglePause();
    window.miniSpiderAudio?.play('pause');
  });

  elements.resumeButton?.addEventListener('click', () => {
    miniSpiderGame.resumeGame();
    window.miniSpiderAudio?.play('pause');
  });

  elements.shootButton?.addEventListener('click', () => {
    if (miniSpiderGame.shootWeb?.()) {
      window.miniSpiderAudio?.play('webShoot');
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'KeyP' && event.code !== 'Escape') return;
    event.preventDefault();
    miniSpiderGame.togglePause();
  });

  miniSpiderGame.onPause(() => setPausedUi(true));
  miniSpiderGame.onResume(() => {
    setPausedUi(false);
    lastFrameTime = performance.now();
  });
  miniSpiderGame.onStatsChange(updateHud);
  miniSpiderGame.onEnergyChange(updateHud);
  miniSpiderGame.onBossHealthChange(updateHud);
  miniSpiderGame.onPreBossHealthChange?.(updateHud);
  miniSpiderGame.onPhaseChange(() => {
    const phase = miniSpiderGame.getPhase();
    gameDisplay.classList.toggle('is-boss-phase', phase === 'boss');
    gameDisplay.classList.toggle('is-boss-intro', phase === 'boss-intro');
    gameDisplay.classList.toggle('is-pre-boss', phase === 'pre-boss');
    updateHud();
  });

  function loop(currentTime) {
    if (miniSpiderGame.isStopped()) return;

    if (miniSpiderGame.isPaused()) {
      lastFrameTime = currentTime;
      requestAnimationFrame(loop);
      return;
    }

    const deltaMs = Math.min(currentTime - lastFrameTime, 60);
    lastFrameTime = currentTime;
    miniSpiderGame.addElapsed(deltaMs);

    if (miniSpiderGame.getPhase() === 'stage') {
      const stats = miniSpiderGame.getStats();
      const nextProgress = Math.min(100, stats.progress + (deltaMs / config.stageDurationMs) * 100);
      miniSpiderGame.setProgress(nextProgress);

      if (nextProgress >= 100) {
        miniSpiderGame.setProgress(100);
        miniSpiderGame.setPhase('boss-intro');
        window.miniSpiderAudio?.play('bossStart');
      }
    }

    updateHud();
    requestAnimationFrame(loop);
  }

  updateHud();
  requestAnimationFrame(loop);
})();
