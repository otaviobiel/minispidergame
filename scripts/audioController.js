(() => {
  const soundConfig = {
    soundtrack: {
      enabled: false,
      src: './assets/audio/soundtrack.mp3',
      volume: 0.35,
      loop: true
    },
    webShoot: {
      enabled: false,
      src: './assets/audio/web-shoot.mp3',
      volume: 0.55
    },
    missileWarning: {
      enabled: false,
      src: './assets/audio/missile-warning.mp3',
      volume: 0.55
    },
    missileLaunch: {
      enabled: false,
      src: './assets/audio/missile-launch.mp3',
      volume: 0.65
    },
    laserWarning: {
      enabled: false,
      src: './assets/audio/laser-warning.mp3',
      volume: 0.55
    },
    laserFire: {
      enabled: false,
      src: './assets/audio/laser-fire.mp3',
      volume: 0.65
    },

    collectWeb: {
      enabled: false,
      src: './assets/audio/collect-web.mp3',
      volume: 0.55
    },
    bossStart: {
      enabled: false,
      src: './assets/audio/boss-start.mp3',
      volume: 0.7
    },
    bossIntro: {
      enabled: false,
      src: './assets/audio/boss-intro.mp3',
      volume: 0.7
    },
    playerShot: {
      enabled: false,
      src: './assets/audio/player-shot.mp3',
      volume: 0.35
    },
    bossHit: {
      enabled: false,
      src: './assets/audio/boss-hit.mp3',
      volume: 0.45
    },
    specialCast: {
      enabled: false,
      src: './assets/audio/special-cast.mp3',
      volume: 0.75
    },
    specialReady: {
      enabled: false,
      src: './assets/audio/special-ready.mp3',
      volume: 0.65
    },
    pause: {
      enabled: false,
      src: './assets/audio/pause.mp3',
      volume: 0.45
    },
    playerDeath: {
      enabled: false,
      src: './assets/audio/player-death.mp3',
      volume: 0.75
    },
    victory: {
      enabled: false,
      src: './assets/audio/victory.mp3',
      volume: 0.75
    },
    gameOver: {
      enabled: false,
      src: './assets/audio/game-over.mp3',
      volume: 0.7
    }
  };

  const cache = {};

  function getAudio(name) {
    const config = soundConfig[name];

    if (!config || !config.enabled || !config.src) {
      return null;
    }

    if (!cache[name]) {
      const audio = new Audio(config.src);
      audio.volume = config.volume ?? 1;
      audio.loop = Boolean(config.loop);
      audio.preload = 'auto';
      cache[name] = audio;
    }

    return cache[name];
  }

  function play(name) {
    const audio = getAudio(name);
    if (!audio) return;

    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (error) {}
  }

  function startMusic() {
    const music = getAudio('soundtrack');
    if (!music) return;

    music.play().catch(() => {});
  }

  function stopMusic() {
    const music = cache.soundtrack;
    if (!music) return;

    music.pause();
    music.currentTime = 0;
  }

  function enableSound(name, src) {
    if (!soundConfig[name]) return;

    soundConfig[name].enabled = true;

    if (src) {
      soundConfig[name].src = src;
    }

    if (cache[name]) {
      cache[name].src = soundConfig[name].src;
    }
  }

  window.miniSpiderAudio = {
    config: soundConfig,
    play,
    startMusic,
    stopMusic,
    enableSound
  };

  // Quando você ativar a trilha sonora, ela começa no primeiro clique/toque/espaço.
  const unlockMusic = () => {
    startMusic();
    window.removeEventListener('pointerdown', unlockMusic);
    window.removeEventListener('keydown', unlockMusic);
  };

  window.addEventListener('pointerdown', unlockMusic, { once: true });
  window.addEventListener('keydown', unlockMusic, { once: true });
})();
