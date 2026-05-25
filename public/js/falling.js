const INGREDIENT_SRCS = [
  '/images/saffron_flower.png',
  '/images/rose_petal.png',
  '/images/sandalwood.png',
  '/images/nagkesar.png',
  '/images/mulethi.png',
  '/images/aloe_vera.png',
  '/images/orange_peel.png',
  '/images/rose.png',
  '/images/saffron_thread.png',
];

let fallingCanvas, fallingCtx;
let fallingW, fallingH;
let fallingParticles = [];
let loadedImgs = [];
let loadCount = 0;

// Pre-process each image: strip black background once at load time
function stripBlackBackground(srcImg) {
  const offscreen = document.createElement('canvas');
  offscreen.width  = srcImg.naturalWidth;
  offscreen.height = srcImg.naturalHeight;
  const oc = offscreen.getContext('2d');
  oc.drawImage(srcImg, 0, 0);

  const imageData = oc.getImageData(0, 0, offscreen.width, offscreen.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const brightness = (r + g + b) / 3;
    if (brightness < 30) {
      d[i+3] = 0;
    } else if (brightness < 80) {
      d[i+3] = Math.round(((brightness - 30) / 50) * d[i+3]);
    }
  }
  oc.putImageData(imageData, 0, 0);
  return offscreen; // return the processed canvas, not the original img
}

function initFallingBackground() {
  fallingCanvas = document.getElementById('hero-canvas');
  fallingCtx = fallingCanvas.getContext('2d');

  function resize() {
    fallingW = fallingCanvas.width  = window.innerWidth;
    fallingH = fallingCanvas.height = fallingCanvas.offsetHeight || window.innerHeight;
    console.log('Canvas size:', fallingW, fallingH);
    // Re-spawn so particles fill the new size
    if (fallingParticles.length > 0) {
      fallingParticles = [];
      for (let i = 0; i < 24; i++) fallingParticles.push(makeParticle(true));
    }
  }
  resize();
  window.addEventListener('resize', resize);

  INGREDIENT_SRCS.forEach((src, idx) => {
    const img = new Image();
    img.onload = () => {
      // Strip black bg once here, store processed canvas
      loadedImgs[idx] = stripBlackBackground(img);
      loadCount++;
      if (loadCount === INGREDIENT_SRCS.length) {
        console.log('All ingredient images processed, starting animation');
        for (let i = 0; i < 24; i++) fallingParticles.push(makeParticle(true));
        requestAnimationFrame(fallingLoop);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load:', src);
      loadedImgs[idx] = null;
      loadCount++;
      if (loadCount === INGREDIENT_SRCS.length) {
        for (let i = 0; i < 24; i++) fallingParticles.push(makeParticle(true));
        requestAnimationFrame(fallingLoop);
      }
    };
    img.src = src;
  });
}

function makeParticle(scattered) {
  const imgs = loadedImgs.filter(Boolean);
  if (!imgs.length) return null;
  const img = imgs[Math.floor(Math.random() * imgs.length)];
  const size = 70 + Math.random() * 90;
  return {
    img,
    x: Math.random() * fallingW,
    y: scattered ? Math.random() * fallingH : -size - Math.random() * 400,
    size,
    vy: 0.6 + Math.random() * 1.1,
    vx: (Math.random() - 0.5) * 0.5,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.014,
    opacity: 0.8 + Math.random() * 0.2,
    wobble: Math.random() * Math.PI * 2,
    wobbleV: 0.007 + Math.random() * 0.01,
    wobbleA: 0.4 + Math.random() * 0.9,
  };
}

function fallingLoop() {
  fallingCtx.clearRect(0, 0, fallingW, fallingH);

  // Warm cream gradient background
  const bg = fallingCtx.createLinearGradient(0, 0, fallingW, fallingH);
  bg.addColorStop(0,   '#FAF0DF');
  bg.addColorStop(0.5, '#F5E6C8');
  bg.addColorStop(1,   '#EDD8BC');
  fallingCtx.fillStyle = bg;
  fallingCtx.fillRect(0, 0, fallingW, fallingH);

  // Soft vignette
  const vig = fallingCtx.createRadialGradient(
    fallingW * .5, fallingH * .5, fallingH * .1,
    fallingW * .5, fallingH * .5, fallingH * .9
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(40,25,5,0.15)');
  fallingCtx.fillStyle = vig;
  fallingCtx.fillRect(0, 0, fallingW, fallingH);

  for (let i = fallingParticles.length - 1; i >= 0; i--) {
    const p = fallingParticles[i];
    if (!p) { fallingParticles.splice(i, 1); continue; }

    p.wobble += p.wobbleV;
    p.x += p.vx + Math.sin(p.wobble) * p.wobbleA;
    p.y += p.vy;
    p.rot += p.rotV;

    if (p.y > fallingH + p.size) {
      fallingParticles.splice(i, 1);
      continue;
    }

    const w = p.size;
    const h = (p.img.height / p.img.width) * p.size;

    fallingCtx.save();
    fallingCtx.globalAlpha = p.opacity;
    fallingCtx.translate(p.x, p.y);
    fallingCtx.rotate(p.rot);
    fallingCtx.shadowColor = 'rgba(80,40,10,0.25)';
    fallingCtx.shadowBlur = 14;
    fallingCtx.shadowOffsetX = 2;
    fallingCtx.shadowOffsetY = 5;
    fallingCtx.drawImage(p.img, -w/2, -h/2, w, h);
    fallingCtx.restore();
  }

  while (fallingParticles.length < 24) fallingParticles.push(makeParticle(false));
  requestAnimationFrame(fallingLoop);
}