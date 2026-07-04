(() => {
  const gameDisplay = document.querySelector('.game-display');
  const miniSpiderGame = window.miniSpiderGame;
  if (!gameDisplay || !miniSpiderGame) return;

  const bossConfig = {
    sprite: './assets/bosses/duende_verde.png',
    shotSprite: './assets/effects/player-shot.png',
    specialSprite: './assets/effects/special-orb.png',
    grenadeSprite: './assets/effects/special-orb.png',

    width: 118,
    height: 118,
    baseRight: 20,

    followSpeed: 155,
    followDeadZone: 4,
    followYOffset: 0,
    verticalPaddingTop: 58,
    verticalPaddingBottom: 72,

    preBossTriggerProgress: 50,
    preBossFirstAttackDelay: 1300,
    finalBossFirstAttackDelay: 1300,
    preBossMaxAttacks: 2,
    preBossAttackInterval: 3600,
    preBossExitSpeed: 360,
    preBossDefeatPoints: 150,

    shotCooldown: 430,
    shotSpeed: 520,
    shotDamage: 2.1,

    attackInterval: 3600,
    warningDuration: 1050,
    chargeSpeed: 560,
    chargeOvershoot: 150,
    chargeLeftLimit: -95,
    returnSpeed: 340,
    chargeReturnHoldMs: 520,

    grenadeSpeed: 340,
    grenadeWidth: 44,
    grenadeHeight: 44,
    grenadeHitboxInset: 7,

    introSpeed: 230,
    introDelayAfterArrive: 950,

    specialSpeed: 650,
    specialDamage: 40
  };

  const bossState = {
    active: false,
    combatReady: false,
    encounter: 'none', // none | pre | final
    preBossStarted: false,
    element: null,
    introBanner: null,
    spiderSense: null,
    x: 0,
    y: 180,
    mode: 'idle',
    nextAttackAt: 0,
    warningStartedAt: 0,
    preBossAttackCount: 0,
    introArrivedAt: 0,
    lastShotAt: 0,
    charge: null,
    chargeEndedAt: 0,
    pendingAttackType: 'grenade',
    finalAttackIndex: 0,
    shots: [],
    specials: [],
    grenades: [],
    lastFrameTime: performance.now(),
    rafId: null
  };

  function createBoss() {
    if (bossState.element?.isConnected) return bossState.element;

    const boss = document.createElement('img');
    boss.classList.add('boss-enemy');
    boss.src = bossConfig.sprite;
    boss.alt = 'Chefe';
    gameDisplay.appendChild(boss);
    bossState.element = boss;
    return boss;
  }

  function createIntroBanner() {
    if (bossState.introBanner?.isConnected) return bossState.introBanner;

    const banner = document.createElement('div');
    banner.classList.add('boss-intro-banner');
    gameDisplay.appendChild(banner);
    bossState.introBanner = banner;
    return banner;
  }

  function createSpiderSense() {
    if (bossState.spiderSense?.isConnected) return bossState.spiderSense;

    const spiderSense = document.createElement('div');
    spiderSense.classList.add('player-spider-sense');

    for (let index = 0; index < 3; index += 1) {
      const ray = document.createElement('span');
      ray.classList.add('player-spider-sense-ray');
      spiderSense.appendChild(ray);
    }

    gameDisplay.appendChild(spiderSense);
    bossState.spiderSense = spiderSense;
    return spiderSense;
  }

  function updateSpiderSensePosition(playerBounds = miniSpiderGame.getPlayerBounds?.()) {
    const spiderSense = createSpiderSense();
    if (!spiderSense || !playerBounds) return;

    const headCenterX = playerBounds.left + playerBounds.width / 2;
    const headTopY = playerBounds.top - 4;

    spiderSense.style.left = `${headCenterX}px`;
    spiderSense.style.top = `${headTopY}px`;
  }

  function toggleSpiderSense(visible, playerBounds) {
    const spiderSense = createSpiderSense();
    if (!spiderSense) return;

    if (visible) updateSpiderSensePosition(playerBounds);
    spiderSense.classList.toggle('is-visible', Boolean(visible));
  }

  function scheduleBossLoop() {
    if (bossState.rafId) return;
    bossState.rafId = requestAnimationFrame(updateBoss);
  }

  function getBaseX() {
    return gameDisplay.offsetWidth - bossConfig.width - bossConfig.baseRight;
  }

  function getBossMinY() {
    return bossConfig.verticalPaddingTop;
  }

  function getBossMaxY() {
    return Math.max(
      getBossMinY(),
      gameDisplay.offsetHeight - bossConfig.height - bossConfig.verticalPaddingBottom
    );
  }

  function clampBossY(value) {
    return Math.max(getBossMinY(), Math.min(getBossMaxY(), value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getPlayerTargetY(playerBounds) {
    if (!playerBounds) return null;

    return clampBossY(
      playerBounds.top +
        playerBounds.height / 2 -
        bossConfig.height / 2 +
        bossConfig.followYOffset
    );
  }

  function moveBossTowardPlayer(deltaTime, playerBounds) {
    const targetY = getPlayerTargetY(playerBounds);
    if (targetY === null) return;

    const distance = targetY - bossState.y;

    if (Math.abs(distance) <= bossConfig.followDeadZone) {
      bossState.y = targetY;
      return;
    }

    const maxStep = bossConfig.followSpeed * deltaTime;
    bossState.y += Math.sign(distance) * Math.min(Math.abs(distance), maxStep);
    bossState.y = clampBossY(bossState.y);
  }

  function resetBossClasses() {
    bossState.element?.classList.remove('is-intro', 'is-warning', 'is-charging', 'is-returning', 'is-hit');
  }

  function prepareBossIntro(encounter) {
    const boss = createBoss();
    const banner = createIntroBanner();
    const playerBounds = miniSpiderGame.getPlayerBounds?.();
    const targetY = getPlayerTargetY(playerBounds);

    bossState.active = true;
    bossState.combatReady = false;
    bossState.encounter = encounter;
    bossState.x = gameDisplay.offsetWidth + bossConfig.width + 40;
    bossState.y = targetY ?? Math.max(70, gameDisplay.offsetHeight / 2 - bossConfig.height / 2);
    bossState.mode = encounter === 'pre' ? 'pre-intro' : 'intro';
    bossState.nextAttackAt = 0;
    bossState.warningStartedAt = 0;
    bossState.preBossAttackCount = 0;
    bossState.introArrivedAt = 0;
    bossState.charge = null;
    bossState.chargeEndedAt = 0;
    bossState.pendingAttackType = encounter === 'pre' ? 'charge' : 'grenade';
    bossState.finalAttackIndex = 0;
    bossState.lastShotAt = performance.now() + 650;
    bossState.lastFrameTime = performance.now();

    resetBossClasses();
    boss.classList.add('is-visible', 'is-intro');
    banner.textContent = encounter === 'pre' ? 'CUIDADO! O CHEFE APARECEU!' : 'HAHAHAHAHA! TO AQUIII!';
    banner.classList.add('is-visible');

    toggleSpiderSense(false);
    clearEnemyProjectiles();
    updateBossPosition();
    scheduleBossLoop();
  }

  function startPreBossIntro() {
    if (bossState.preBossStarted || miniSpiderGame.getPhase?.() !== 'stage') return;
    if (bossState.encounter === 'final') return;

    bossState.preBossStarted = true;
    miniSpiderGame.resetPreBossHealth?.();
    miniSpiderGame.setPhase?.('pre-boss');
    prepareBossIntro('pre');
    window.miniSpiderAudio?.play('bossStart');
  }

  function startFinalBossIntro() {
    prepareBossIntro('final');
  }

  function startBossCombat() {
    if (bossState.encounter !== 'final') {
      startFinalBossIntro();
      return;
    }

    bossState.active = true;
    bossState.combatReady = true;
    bossState.mode = 'idle';
    bossState.nextAttackAt = performance.now() + bossConfig.finalBossFirstAttackDelay;
    resetBossClasses();
    bossState.introBanner?.classList.remove('is-visible');
    toggleSpiderSense(false);
    scheduleBossLoop();
  }

  function startPreBossCombat(currentTime) {
    bossState.combatReady = true;
    bossState.mode = 'idle';
    bossState.nextAttackAt = currentTime + bossConfig.preBossFirstAttackDelay;
    resetBossClasses();
    bossState.introBanner?.classList.remove('is-visible');
    toggleSpiderSense(false);
  }

  function updateBossPosition() {
    if (!bossState.element) return;
    bossState.element.style.left = `${bossState.x}px`;
    bossState.element.style.top = `${bossState.y}px`;
  }

  function getBossBounds() {
    return {
      left: bossState.x + 30,
      top: bossState.y + 24,
      right: bossState.x + bossConfig.width - 30,
      bottom: bossState.y + bossConfig.height - 22
    };
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function getCenter(bounds) {
    return {
      x: bounds.left + (bounds.width ?? (bounds.right - bounds.left)) / 2,
      y: bounds.top + (bounds.height ?? (bounds.bottom - bounds.top)) / 2
    };
  }

  function startAttackWarning(currentTime, playerBounds) {
    bossState.mode = 'warning';
    bossState.warningStartedAt = currentTime;

    if (bossState.encounter === 'pre') {
      bossState.pendingAttackType = 'charge';
    } else {
      bossState.finalAttackIndex += 1;
      bossState.pendingAttackType = bossState.finalAttackIndex % 2 === 0 ? 'charge' : 'grenade';
    }
    bossState.element?.classList.add('is-warning');
    toggleSpiderSense(true, playerBounds);
    window.miniSpiderAudio?.play('missileWarning');
  }

  function startTargetedCharge(playerBounds) {
    const bossBounds = getBossBounds();
    const bossCenter = getCenter(bossBounds);
    const targetCenter = playerBounds ? getCenter(playerBounds) : { x: bossCenter.x - 320, y: bossCenter.y };
    const dx = targetCenter.x - bossCenter.x;
    const dy = targetCenter.y - bossCenter.y;
    const distance = Math.max(1, Math.hypot(dx, dy));

    bossState.charge = {
      vx: dx / distance,
      vy: dy / distance,
      maxDistance: distance + bossConfig.chargeOvershoot,
      traveled: 0
    };

    if (bossState.encounter === 'pre') {
      bossState.preBossAttackCount += 1;
    }

    bossState.mode = 'charge';
    bossState.element?.classList.remove('is-warning', 'is-returning');
    bossState.element?.classList.add('is-charging');
    toggleSpiderSense(false);
  }

  function updateTargetedCharge(deltaTime, playerBounds) {
    if (!bossState.charge) return;

    const step = bossConfig.chargeSpeed * deltaTime;
    bossState.x += bossState.charge.vx * step;
    bossState.y += bossState.charge.vy * step;
    bossState.charge.traveled += step;

    if (playerBounds && intersects(getBossBounds(), playerBounds)) {
      miniSpiderGame.triggerPlayerDeath?.({ message: 'O chefe te acertou no ataque.' });
      return;
    }

    const outOfBounds =
      bossState.x < bossConfig.chargeLeftLimit ||
      bossState.x > gameDisplay.offsetWidth + bossConfig.width ||
      bossState.y < -bossConfig.height ||
      bossState.y > gameDisplay.offsetHeight;

    if (bossState.charge.traveled >= bossState.charge.maxDistance || outOfBounds) {
      bossState.mode = 'charge-hold';
      bossState.chargeEndedAt = performance.now();
      bossState.charge = null;
    }
  }


  function startPreBossDefeated() {
    if (bossState.encounter !== 'pre' || bossState.mode === 'exit') return;

    bossState.combatReady = false;
    bossState.mode = 'exit';
    bossState.charge = null;
    bossState.nextAttackAt = 0;
    bossState.element?.classList.remove('is-warning', 'is-charging');
    bossState.element?.classList.add('is-returning');
    toggleSpiderSense(false);
    miniSpiderGame.addScore?.(bossConfig.preBossDefeatPoints);
  }

  function hitBossWithWeb(amount = 10) {
    if (
      !bossState.active ||
      !bossState.combatReady ||
      bossState.mode === 'exit' ||
      miniSpiderGame.isStopped?.() ||
      miniSpiderGame.isGameOver?.()
    ) {
      return false;
    }

    bossState.element?.classList.add('is-hit');
    setTimeout(() => bossState.element?.classList.remove('is-hit'), 120);
    window.miniSpiderAudio?.play('bossHit');

    if (bossState.encounter === 'pre') {
      const defeated = miniSpiderGame.damagePreBoss?.(amount);
      if (defeated) startPreBossDefeated();
      return true;
    }

    if (bossState.encounter === 'final' && miniSpiderGame.getPhase?.() === 'boss') {
      miniSpiderGame.damageBoss?.(Math.max(2, amount * 0.45));
      return true;
    }

    return false;
  }

  function spawnBossGrenade(playerBounds) {
    if (!bossState.active || !bossState.combatReady || bossState.encounter !== 'final') return;

    const bossBounds = getBossBounds();
    const bossCenter = getCenter(bossBounds);
    const targetCenter = playerBounds ? getCenter(playerBounds) : { x: bossCenter.x - 300, y: bossCenter.y };
    const dx = targetCenter.x - bossCenter.x;
    const dy = targetCenter.y - bossCenter.y;
    const distance = Math.max(1, Math.hypot(dx, dy));

    const grenadeElement = document.createElement('img');
    grenadeElement.classList.add('boss-grenade-shot');
    grenadeElement.src = bossConfig.grenadeSprite;
    grenadeElement.alt = 'Granada do chefe';

    const grenade = {
      element: grenadeElement,
      x: bossCenter.x - bossConfig.grenadeWidth / 2,
      y: bossCenter.y - bossConfig.grenadeHeight / 2,
      width: bossConfig.grenadeWidth,
      height: bossConfig.grenadeHeight,
      vx: dx / distance,
      vy: dy / distance
    };

    grenadeElement.style.left = `${grenade.x}px`;
    grenadeElement.style.top = `${grenade.y}px`;
    gameDisplay.appendChild(grenadeElement);
    bossState.grenades.push(grenade);
    window.miniSpiderAudio?.play('missileLaunch');
  }

  function spawnShot() {
    if (!bossState.combatReady || bossState.encounter !== 'final') return;

    const playerBounds = miniSpiderGame.getPlayerBounds?.();
    if (!playerBounds) return;

    const shotElement = document.createElement('img');
    shotElement.classList.add('player-shot');
    shotElement.src = bossConfig.shotSprite;
    shotElement.alt = 'Disparo';

    const shot = {
      element: shotElement,
      x: playerBounds.right - 4,
      y: playerBounds.top + playerBounds.height / 2 - 5,
      width: 22,
      height: 10
    };

    shotElement.style.left = `${shot.x}px`;
    shotElement.style.top = `${shot.y}px`;
    gameDisplay.appendChild(shotElement);
    bossState.shots.push(shot);
    window.miniSpiderAudio?.play('playerShot');
  }

  function spawnSpecialOrb() {
    if (!bossState.active || !bossState.combatReady || bossState.encounter !== 'final') return;

    const playerBounds = miniSpiderGame.getPlayerBounds?.();
    if (!playerBounds) return;

    const orbElement = document.createElement('img');
    orbElement.classList.add('special-orb-shot');
    orbElement.src = bossConfig.specialSprite;
    orbElement.alt = 'Especial';

    const orb = {
      element: orbElement,
      x: playerBounds.right,
      y: playerBounds.top + playerBounds.height / 2 - 24,
      width: 48,
      height: 48
    };

    orbElement.style.left = `${orb.x}px`;
    orbElement.style.top = `${orb.y}px`;
    gameDisplay.appendChild(orbElement);
    bossState.specials.push(orb);
  }

  function removeShot(shot) {
    shot.element.remove();
    bossState.shots = bossState.shots.filter((item) => item !== shot);
  }

  function removeSpecial(orb) {
    orb.element.remove();
    bossState.specials = bossState.specials.filter((item) => item !== orb);
  }

  function removeGrenade(grenade) {
    grenade.element.remove();
    bossState.grenades = bossState.grenades.filter((item) => item !== grenade);
  }

  function clearEnemyProjectiles() {
    bossState.grenades.forEach((grenade) => grenade.element.remove());
    bossState.grenades = [];
  }

  function updateShots(deltaTime) {
    if (bossState.encounter !== 'final') return;

    const bossBounds = getBossBounds();

    [...bossState.shots].forEach((shot) => {
      shot.x += bossConfig.shotSpeed * deltaTime;
      shot.element.style.left = `${shot.x}px`;

      const shotBounds = {
        left: shot.x,
        top: shot.y,
        right: shot.x + shot.width,
        bottom: shot.y + shot.height
      };

      if (intersects(shotBounds, bossBounds)) {
        removeShot(shot);
        miniSpiderGame.damageBoss(bossConfig.shotDamage);
        window.miniSpiderAudio?.play('bossHit');
        return;
      }

      if (shot.x > gameDisplay.offsetWidth + 40) {
        removeShot(shot);
      }
    });
  }

  function updateSpecials(deltaTime) {
    if (bossState.encounter !== 'final') return;

    const bossBounds = getBossBounds();

    [...bossState.specials].forEach((orb) => {
      orb.x += bossConfig.specialSpeed * deltaTime;
      orb.element.style.left = `${orb.x}px`;

      const orbBounds = {
        left: orb.x + 6,
        top: orb.y + 6,
        right: orb.x + orb.width - 6,
        bottom: orb.y + orb.height - 6
      };

      if (intersects(orbBounds, bossBounds)) {
        removeSpecial(orb);
        miniSpiderGame.damageBoss(bossConfig.specialDamage);
        window.miniSpiderAudio?.play('bossHit');
        return;
      }

      if (orb.x > gameDisplay.offsetWidth + 60) {
        removeSpecial(orb);
      }
    });
  }

  function updateGrenades(deltaTime, playerBounds) {
    [...bossState.grenades].forEach((grenade) => {
      grenade.x += grenade.vx * bossConfig.grenadeSpeed * deltaTime;
      grenade.y += grenade.vy * bossConfig.grenadeSpeed * deltaTime;
      grenade.element.style.left = `${grenade.x}px`;
      grenade.element.style.top = `${grenade.y}px`;

      const inset = bossConfig.grenadeHitboxInset;
      const grenadeBounds = {
        left: grenade.x + inset,
        top: grenade.y + inset,
        right: grenade.x + grenade.width - inset,
        bottom: grenade.y + grenade.height - inset
      };

      if (playerBounds && intersects(grenadeBounds, playerBounds)) {
        miniSpiderGame.triggerPlayerDeath?.({ message: 'A granada do chefe te acertou.' });
        return;
      }

      const offScreen =
        grenade.x + grenade.width < -60 ||
        grenade.x > gameDisplay.offsetWidth + 60 ||
        grenade.y + grenade.height < -60 ||
        grenade.y > gameDisplay.offsetHeight + 60;

      if (offScreen) removeGrenade(grenade);
    });
  }

  function clearBoss() {
    toggleSpiderSense(false);
    bossState.element?.remove();
    bossState.introBanner?.remove();
    bossState.spiderSense?.remove();
    bossState.element = null;
    bossState.introBanner = null;
    bossState.spiderSense = null;
    bossState.shots.forEach((shot) => shot.element.remove());
    bossState.specials.forEach((orb) => orb.element.remove());
    bossState.grenades.forEach((grenade) => grenade.element.remove());
    bossState.shots = [];
    bossState.specials = [];
    bossState.grenades = [];
    bossState.active = false;
    bossState.combatReady = false;
    bossState.encounter = 'none';
    bossState.mode = 'idle';
    bossState.preBossAttackCount = 0;
    bossState.charge = null;
    bossState.chargeEndedAt = 0;
    bossState.pendingAttackType = 'grenade';
    bossState.finalAttackIndex = 0;
    if (bossState.rafId) {
      cancelAnimationFrame(bossState.rafId);
      bossState.rafId = null;
    }
  }

  function finishPreBoss() {
    const shouldResumeStage = bossState.encounter === 'pre' && !miniSpiderGame.isStopped?.() && !miniSpiderGame.isGameOver?.();
    clearBoss();
    if (shouldResumeStage) {
      miniSpiderGame.setPhase?.('stage');
    }
  }

  function updateIntro(currentTime, deltaTime, playerBounds) {
    bossState.x -= bossConfig.introSpeed * deltaTime;

    if (bossState.encounter === 'pre') {
      moveBossTowardPlayer(deltaTime, playerBounds);
    } else {
      bossState.y += Math.sin(currentTime / 240) * 22 * deltaTime;
      bossState.y = clampBossY(bossState.y);
    }

    const baseX = getBaseX();

    if (bossState.x <= baseX) {
      bossState.x = baseX;

      if (bossState.encounter === 'pre') {
        startPreBossCombat(currentTime);
        return;
      }

      if (!bossState.introArrivedAt) {
        bossState.introArrivedAt = currentTime;
        bossState.element?.classList.remove('is-intro');
        bossState.element?.classList.add('is-warning');
      }

      if (currentTime - bossState.introArrivedAt >= bossConfig.introDelayAfterArrive) {
        bossState.element?.classList.remove('is-warning');
        miniSpiderGame.setPhase('boss');
        startBossCombat();
      }
    }
  }

  function updateBoss(currentTime) {
    bossState.rafId = null;

    if (!bossState.active || miniSpiderGame.isStopped() || miniSpiderGame.isGameOver()) return;

    if (miniSpiderGame.isPaused()) {
      bossState.lastFrameTime = currentTime;
      scheduleBossLoop();
      return;
    }

    const deltaTime = Math.min((currentTime - bossState.lastFrameTime) / 1000, 0.04);
    bossState.lastFrameTime = currentTime;
    const playerBounds = miniSpiderGame.getPlayerBounds?.();

    if (bossState.mode === 'intro' || bossState.mode === 'pre-intro') {
      updateIntro(currentTime, deltaTime, playerBounds);
      updateBossPosition();
      scheduleBossLoop();
      return;
    }

    if (bossState.mode === 'idle') {
      moveBossTowardPlayer(deltaTime, playerBounds);

      if (bossState.combatReady && currentTime >= bossState.nextAttackAt) {
        startAttackWarning(currentTime, playerBounds);
      }
    }

    if (bossState.mode === 'warning') {
      moveBossTowardPlayer(deltaTime, playerBounds);
      toggleSpiderSense(true, playerBounds);

      if (currentTime - bossState.warningStartedAt >= bossConfig.warningDuration) {
        if (bossState.pendingAttackType === 'charge') {
          startTargetedCharge(playerBounds);
        } else {
          bossState.element?.classList.remove('is-warning');
          toggleSpiderSense(false);
          spawnBossGrenade(playerBounds);
          bossState.mode = 'idle';
          bossState.nextAttackAt = currentTime + bossConfig.attackInterval;
        }
      }
    }

    if (bossState.mode === 'charge') {
      updateTargetedCharge(deltaTime, playerBounds);
    }

    if (bossState.mode === 'charge-hold') {
      if (playerBounds && intersects(getBossBounds(), playerBounds)) {
        miniSpiderGame.triggerPlayerDeath?.({ message: 'O chefe te acertou no ataque.' });
        return;
      }

      if (currentTime - bossState.chargeEndedAt >= bossConfig.chargeReturnHoldMs) {
        bossState.mode = 'return';
        bossState.element?.classList.add('is-returning');
      }
    }

    if (bossState.mode === 'return') {
      const baseX = getBaseX();
      const distanceX = baseX - bossState.x;
      const stepX = bossConfig.returnSpeed * deltaTime;

      bossState.x += Math.sign(distanceX) * Math.min(Math.abs(distanceX), stepX);
      moveBossTowardPlayer(deltaTime, playerBounds);

      if (Math.abs(distanceX) <= stepX) {
        bossState.x = baseX;
        bossState.element?.classList.remove('is-charging');
        toggleSpiderSense(false);

        if (bossState.encounter === 'pre' && bossState.preBossAttackCount >= bossConfig.preBossMaxAttacks) {
          bossState.mode = 'exit';
          bossState.element?.classList.add('is-returning');
        } else {
          bossState.element?.classList.remove('is-returning');
          bossState.mode = 'idle';
          bossState.nextAttackAt = currentTime + (
            bossState.encounter === 'pre' ? bossConfig.preBossAttackInterval : bossConfig.attackInterval
          );
        }
      }
    }

    if (bossState.mode === 'exit') {
      bossState.element?.classList.add('is-returning');
      bossState.x += bossConfig.preBossExitSpeed * deltaTime;
      moveBossTowardPlayer(deltaTime, playerBounds);

      if (bossState.x > gameDisplay.offsetWidth + bossConfig.width + 45) {
        finishPreBoss();
        return;
      }
    }

    if (
      bossState.combatReady &&
      bossState.encounter === 'final' &&
      currentTime - bossState.lastShotAt >= bossConfig.shotCooldown
    ) {
      bossState.lastShotAt = currentTime;
      spawnShot();
    }

    if (bossState.mode !== 'warning') {
      toggleSpiderSense(false);
    }

    updateShots(deltaTime);
    updateSpecials(deltaTime);
    updateGrenades(deltaTime, playerBounds);
    updateBossPosition();
    scheduleBossLoop();
  }


  window.miniSpiderBossTarget = {
    isActive() {
      return (
        bossState.active &&
        bossState.combatReady &&
        ['pre', 'final'].includes(bossState.encounter) &&
        bossState.mode !== 'exit' &&
        !(bossState.encounter === 'final' && miniSpiderGame.getPhase?.() !== 'boss') &&
        !miniSpiderGame.isStopped?.() &&
        !miniSpiderGame.isGameOver?.()
      );
    },
    getBounds() {
      if (!this.isActive()) return null;
      return getBossBounds();
    },
    hit(amount) {
      return hitBossWithWeb(amount);
    }
  };

  miniSpiderGame.onStatsChange?.((stats) => {
    if (
      stats.phase === 'stage' &&
      stats.progress >= bossConfig.preBossTriggerProgress &&
      !bossState.preBossStarted
    ) {
      startPreBossIntro();
    }
  });

  miniSpiderGame.onPhaseChange?.((stats) => {
    if (stats.phase === 'boss-intro') startFinalBossIntro();
    if (stats.phase === 'boss') startBossCombat();
  });

  miniSpiderGame.onSpecialAttack(spawnSpecialOrb);
  miniSpiderGame.onPlayerDeath(clearBoss);
  miniSpiderGame.onGameOver(clearBoss);

  if (miniSpiderGame.getPhase() === 'boss-intro') startFinalBossIntro();
  if (miniSpiderGame.getPhase() === 'boss') startBossCombat();
})();
