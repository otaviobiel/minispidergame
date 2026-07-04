(() => {
  const natureLayer = document.querySelector('.nature-layer');
  const gameDisplay = document.querySelector('.game-display');
  if (!natureLayer || !gameDisplay) return;

  const natureAssets = [
    {
      src: './assets/nature/small-tree.png',
      className: 'nature-small-tree',
      bottom: 15,
      minHeight: 70,
      maxHeight: 92
    },
    {
      src: './assets/nature/tall-tree.png',
      className: 'nature-tall-tree',
      bottom: 6,
      minHeight: 90,
      maxHeight: 118
    },
    {
      src: './assets/nature/bush.png',
      className: 'nature-bush',
      bottom: 50,
      minHeight: 70,
      maxHeight: 60
    }
  ];

  const NATURE_SPEED = 52;
  const MIN_GROUP_DELAY = 4500;
  const MAX_GROUP_DELAY = 8200;
  const MAX_ACTIVE_GROUPS = 2;

  let activeGroups = 0;

  function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomNature() {
    return natureAssets[Math.floor(Math.random() * natureAssets.length)];
  }

  function waitForImage(image) {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    if (image.decode) return image.decode().catch(() => undefined);

    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }

  function randomGroupQuantity() {
    return Math.random() < 0.72 ? 1 : 2;
  }

  async function spawnNatureGroup() {
    if (activeGroups >= MAX_ACTIVE_GROUPS) return;

    activeGroups += 1;

    const group = document.createElement('div');
    group.classList.add('nature-group');
    group.style.animation = 'none';

    const quantity = randomGroupQuantity();
    const imageLoads = [];

    for (let i = 0; i < quantity; i++) {
      const nature = randomNature();
      const img = document.createElement('img');

      img.src = nature.src;
      img.classList.add('nature-item', nature.className);
      img.alt = '';
      img.style.height = `${randomNumber(nature.minHeight, nature.maxHeight)}px`;
      img.style.zIndex = `${randomNumber(1, 3)}`;

      if (i > 0) {
        img.style.marginLeft = `${randomNumber(15, 58)}px`;
      }

      group.appendChild(img);
      imageLoads.push(waitForImage(img));
    }

    natureLayer.appendChild(group);
    await Promise.all(imageLoads);

    requestAnimationFrame(() => {
      const displayWidth = gameDisplay.offsetWidth;
      const groupWidth = group.getBoundingClientRect().width;
      const totalDistance = displayWidth + groupWidth + 80;
      const duration = totalDistance / NATURE_SPEED;

      group.style.setProperty('--travel-distance', `${totalDistance}px`);
      group.style.animation = `natureAnimation ${duration}s linear forwards`;

      setTimeout(() => {
        group.remove();
        activeGroups = Math.max(0, activeGroups - 1);
      }, duration * 1000 + 180);
    });
  }

  function startNatureSpawner() {
    spawnNatureGroup();
    const nextSpawn = randomNumber(MIN_GROUP_DELAY, MAX_GROUP_DELAY);
    setTimeout(startNatureSpawner, nextSpawn);
  }

  startNatureSpawner();
})();
