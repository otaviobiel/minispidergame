(() => {
  if (window.miniSpiderGame?.__stateReady) return;

  const callbacks = {
    gameOver: [],
    death: [],
    phaseChange: [],
    statsChange: [],
    bossHealthChange: [],
    preBossHealthChange: [],
    energyChange: [],
    specialAttack: [],
    webShot: [],
    pause: [],
    resume: []
  };

  const state = {
    phase: 'stage',
    gameOver: false,
    isDying: false,
    paused: false,
    victory: false,
    progress: 0,
    elapsedMs: 0,
    obstaclesPassed: 0,
    websCollected: 0,
    energy: 0,
    maxEnergy: 100,
    webShotCost: 15,
    score: 0,
    thugsDefeated: 0,
    coinsCollected: 0,
    preBossHealth: 45,
    preBossMaxHealth: 45,
    preBossDefeated: false,
    bossHealth: 100,
    bossMaxHealth: 100,
    specialCount: 0
  };

  function emit(name, payload) {
    callbacks[name]?.forEach((callback) => callback(payload));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  const api = {
    __stateReady: true,
    state,

    onGameOver(callback) { callbacks.gameOver.push(callback); },
    onPlayerDeath(callback) { callbacks.death.push(callback); },
    onPhaseChange(callback) { callbacks.phaseChange.push(callback); },
    onStatsChange(callback) { callbacks.statsChange.push(callback); },
    onBossHealthChange(callback) { callbacks.bossHealthChange.push(callback); },
    onPreBossHealthChange(callback) { callbacks.preBossHealthChange.push(callback); },
    onEnergyChange(callback) { callbacks.energyChange.push(callback); },
    onSpecialAttack(callback) { callbacks.specialAttack.push(callback); },
    onWebShot(callback) { callbacks.webShot.push(callback); },
    onPause(callback) { callbacks.pause.push(callback); },
    onResume(callback) { callbacks.resume.push(callback); },

    isGameOver() { return state.gameOver; },
    isPaused() { return state.paused; },
    isStopped() { return state.gameOver || state.isDying; },
    getPhase() { return state.phase; },
    getStats() { return { ...state }; },

    pauseGame() {
      if (state.gameOver || state.isDying || state.paused) return;
      state.paused = true;
      emit('pause', this.getStats());
    },

    resumeGame() {
      if (!state.paused) return;
      state.paused = false;
      emit('resume', this.getStats());
    },

    togglePause() {
      if (state.paused) this.resumeGame();
      else this.pauseGame();
    },

    setPhase(phase) {
      if (state.phase === phase) return;
      state.phase = phase;
      emit('phaseChange', this.getStats());
      emit('statsChange', this.getStats());
    },

    setProgress(value) {
      state.progress = clamp(value, 0, 100);
      emit('statsChange', this.getStats());
    },

    addElapsed(deltaMs) {
      state.elapsedMs += Math.max(0, deltaMs);
      emit('statsChange', this.getStats());
    },

    addObstaclePassed(type = 'obstacle') {
      state.obstaclesPassed += 1;
      emit('statsChange', { ...state, lastObstacleType: type });
    },

    collectWebEnergy(amount = 1, energyValue = 20) {
      state.websCollected += amount;
      state.energy = clamp(state.energy + energyValue, 0, state.maxEnergy);
      emit('energyChange', this.getStats());
      emit('statsChange', this.getStats());
    },

    canShootWeb() {
      return (
        ['stage', 'pre-boss', 'boss'].includes(state.phase) &&
        state.energy >= state.webShotCost &&
        !state.gameOver &&
        !state.isDying &&
        !state.paused
      );
    },

    shootWeb() {
      if (!this.canShootWeb()) return false;
      state.energy = clamp(state.energy - state.webShotCost, 0, state.maxEnergy);
      emit('energyChange', this.getStats());
      emit('statsChange', this.getStats());
      emit('webShot', this.getStats());
      return true;
    },

    addScore(amount = 0) {
      state.score = Math.max(0, state.score + amount);
      emit('statsChange', this.getStats());
    },

    defeatThug(points = 50) {
      state.thugsDefeated += 1;
      this.addScore(points);
    },

    collectCoin(points = 10) {
      state.coinsCollected += 1;
      this.addScore(points);
    },

    resetPreBossHealth() {
      state.preBossHealth = state.preBossMaxHealth;
      state.preBossDefeated = false;
      emit('preBossHealthChange', this.getStats());
      emit('statsChange', this.getStats());
    },

    damagePreBoss(amount = 1) {
      if (state.phase !== 'pre-boss' || state.gameOver || state.preBossDefeated) return false;
      state.preBossHealth = clamp(state.preBossHealth - amount, 0, state.preBossMaxHealth);

      if (state.preBossHealth <= 0) {
        state.preBossDefeated = true;
      }

      emit('preBossHealthChange', this.getStats());
      emit('statsChange', this.getStats());
      return state.preBossDefeated;
    },

    damageBoss(amount = 1) {
      if (state.phase !== 'boss' || state.gameOver) return;
      state.bossHealth = clamp(state.bossHealth - amount, 0, state.bossMaxHealth);
      emit('bossHealthChange', this.getStats());
      emit('statsChange', this.getStats());

      if (state.bossHealth <= 0) {
        this.triggerVictory();
      }
    },

    canUseSpecial() {
      return false;
    },

    useSpecialAttack() {
      return false;
    },

    triggerPlayerDeath(payload = {}) {
      if (state.gameOver || state.isDying) return;
      state.isDying = true;
      state.paused = false;
      state.deathPayload = payload;
      emit('death', payload);
    },

    triggerVictory() {
      if (state.gameOver) return;
      state.victory = true;
      this.triggerGameOver({
        won: true,
        message: 'Você derrotou o chefe. A cidade está segura.'
      });
    },

    triggerGameOver(payload = {}) {
      if (state.gameOver) return;
      state.gameOver = true;
      state.paused = false;
      state.gameOverPayload = payload;
      emit('gameOver', payload);
    }
  };

  window.miniSpiderGame = api;
})();
