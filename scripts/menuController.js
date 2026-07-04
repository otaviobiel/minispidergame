(() => {
  const settingsButton = document.querySelector('[data-menu-settings]');
  const settingsPanel = document.querySelector('[data-menu-settings-panel]');
  const volumeButton = document.querySelector('[data-menu-volume]');
  const volumeLabel = document.querySelector('[data-volume-label]');
  const menuMusic = document.querySelector('[data-menu-music]');
  const playButton = document.querySelector('[data-play-level]');
  const lockedButtons = document.querySelectorAll('[data-menu-locked]');
  const message = document.querySelector('[data-menu-message]');

  let muted = false;

  function setMessage(text) {
    if (!message) return;
    message.textContent = text;
  }

  settingsButton?.addEventListener('click', () => {
    const isVisible = settingsPanel?.classList.toggle('is-visible');
    settingsPanel?.setAttribute('aria-hidden', String(!isVisible));
    setMessage(isVisible ? 'CONFIGURAÇÕES EM BREVE' : 'SELECIONE UMA OPÇÃO');
  });

  volumeButton?.addEventListener('click', async () => {
    muted = !muted;
    volumeLabel.textContent = muted ? 'MUT' : 'VOL';

    if (menuMusic) {
      menuMusic.muted = muted;

      if (!muted && menuMusic.getAttribute('src')) {
        try {
          await menuMusic.play();
        } catch (error) {
          // O navegador pode bloquear autoplay até o primeiro clique do usuário.
        }
      }
    }

    setMessage(muted ? 'VOLUME DESLIGADO' : 'VOLUME LIGADO');
  });

  playButton?.addEventListener('click', () => {
    window.location.href = './levels/fase_1.html';
  });

  lockedButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setMessage('TELA EM BREVE');
    });
  });
})();
