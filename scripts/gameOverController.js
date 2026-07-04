(() => {
  const gameOverDisplay = document.querySelector('.game-display');
  const miniSpiderGame = window.miniSpiderGame;

  if (!gameOverDisplay || !miniSpiderGame) return;

  const overlay = gameOverDisplay.querySelector('.game-over-overlay');
  const titleLine1 = overlay?.querySelector('[data-game-over-title-1]');
  const titleLine2 = overlay?.querySelector('[data-game-over-title-2]');
  const finalThugs = overlay?.querySelector('[data-final-thugs]');
  const finalCoins = overlay?.querySelector('[data-final-coins]');
  const finalWebs = overlay?.querySelector('[data-final-webs]');
  const finalTotal = overlay?.querySelector('[data-final-total]');
  const restartButton = overlay?.querySelector('[data-restart-game]');
  const homeButton = overlay?.querySelector('[data-go-home]');

  restartButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    window.location.reload();
  });

  homeButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    window.location.href = './index.html';
  });

  miniSpiderGame.onGameOver((payload = {}) => {
    const stats = miniSpiderGame.getStats?.() || {};
    const won = Boolean(payload.won);

    if (titleLine1 && titleLine2) {
      titleLine1.textContent = won ? 'VITORIA' : 'FIM';
      titleLine2.textContent = won ? ' ' : 'DE JOGO';
    }

    const webs = stats.websCollected || 0;
    const thugs = stats.thugsDefeated || 0;
    const coins = stats.coinsCollected || 0;
    const total = stats.score || 0;

    if (finalThugs) finalThugs.textContent = thugs;
    if (finalCoins) finalCoins.textContent = coins;
    if (finalWebs) finalWebs.textContent = webs;
    if (finalTotal) finalTotal.textContent = total;

    overlay?.classList.add('is-visible');
    overlay?.setAttribute('aria-hidden', 'false');
    gameOverDisplay.classList.add('is-game-over');
    window.miniSpiderAudio?.stopMusic();
    window.miniSpiderAudio?.play(won ? 'victory' : 'gameOver');
  });
})();
