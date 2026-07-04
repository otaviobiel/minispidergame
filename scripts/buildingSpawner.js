(() => {
  const buildingLayer = document.querySelector('.buildings');
  const gameDisplay = document.querySelector('.game-display');

  if (!buildingLayer || !gameDisplay) return;

  const buildings = [
    { src: './assets/buildings/skyline-tower-deepblue.png', minHeight: 360, maxHeight: 520 },
    { src: './assets/buildings/skyline-wide-dark.png', minHeight: 310, maxHeight: 455 },
    { src: './assets/buildings/skyline-rooftop-blue.png', minHeight: 300, maxHeight: 440 },
    { src: './assets/buildings/skyline-spire-gold.png', minHeight: 395, maxHeight: 560 },
    { src: './assets/buildings/skyline-block-black.png', minHeight: 300, maxHeight: 430 },
    { src: './assets/buildings/skyline-tall-windowed.png', minHeight: 400, maxHeight: 570 }
  ];

  const BUILDING_SPEED = 56;
  const MIN_GROUP_DELAY = 5000;
  const MAX_GROUP_DELAY = 9500;
  const MAX_ACTIVE_GROUPS = 2;

  let activeGroups = 0;

  function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
    }

    return copy;
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
    const chance = Math.random();

    if (chance < 0.68) return 1;
    if (chance < 0.94) return 2;
    return 3;
  }

  function applyBuildingStyle(element, building, index) {
    const height = randomNumber(building.minHeight, building.maxHeight);
    const distance = index === 0 ? 0 : randomNumber(5, 150);

    element.src = building.src;
    element.alt = '';
    element.classList.add('building-item');
    element.style.height = `${height+200}px`;
    element.style.marginLeft = `${distance}px`;
    element.style.zIndex = `${randomNumber(1, 3)}`;
    element.style.opacity = '1';
  }

  async function spawnBuildingGroup() {
    if (activeGroups >= MAX_ACTIVE_GROUPS) return;

    activeGroups += 1;

    const group = document.createElement('div');
    group.classList.add('building-group');
    group.style.animation = 'none';

    const quantity = randomGroupQuantity();
    const selectedBuildings = shuffle(buildings).slice(0, quantity);
    const imageLoads = [];

    selectedBuildings.forEach((building, index) => {
      const img = document.createElement('img');
      applyBuildingStyle(img, building, index);
      group.appendChild(img);
      imageLoads.push(waitForImage(img));
    });

    buildingLayer.appendChild(group);
    await Promise.all(imageLoads);

    requestAnimationFrame(() => {
      const displayWidth = gameDisplay.offsetWidth;
      const groupWidth = group.getBoundingClientRect().width;
      const totalDistance = displayWidth + groupWidth + 120;
      const duration = totalDistance / BUILDING_SPEED;

      group.style.setProperty('--travel-distance', `${totalDistance}px`);
      group.style.animation = `buildingAnimation ${duration}s linear forwards`;

      setTimeout(() => {
        group.remove();
        activeGroups = Math.max(0, activeGroups - 1);
      }, duration * 1000 + 180);
    });
  }

  function startBuildingSpawner() {
    spawnBuildingGroup();
    const nextSpawn = randomNumber(MIN_GROUP_DELAY, MAX_GROUP_DELAY);
    setTimeout(startBuildingSpawner, nextSpawn);
  }

  startBuildingSpawner();
})();
