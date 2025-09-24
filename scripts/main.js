import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.4/index.js';

const canvas = document.getElementById('hero-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 32);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const ambient = new THREE.AmbientLight(0x6b6eff, 1.5);
scene.add(ambient);

const planetGeometry = new THREE.SphereGeometry(9, 64, 64);
const planetMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#6b6eff') },
    uColor2: { value: new THREE.Color('#a65dff') }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 transformed = position;
      transformed += normal * 0.3 * sin(uv.y * 12.0 + uv.x * 6.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec2 vUv;
    void main() {
      float pulse = sin(uTime * 0.4 + vUv.y * 12.0) * 0.5 + 0.5;
      vec3 color = mix(uColor1, uColor2, pulse);
      gl_FragColor = vec4(color, 0.9);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planet);

const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
const orbits = [];
for (let i = 0; i < 4; i += 1) {
  const geometry = new THREE.TorusGeometry(11 + i * 1.5, 0.08, 16, 180);
  const torus = new THREE.Mesh(geometry, orbitMaterial.clone());
  torus.rotation.x = Math.PI / 2.5;
  torus.rotation.z = (Math.PI / 4) * i;
  scene.add(torus);
  orbits.push(torus);
}

const haloGeometry = new THREE.RingGeometry(11.5, 12.5, 64);
const haloMaterial = new THREE.MeshBasicMaterial({ color: 0xa65dff, side: THREE.DoubleSide, transparent: true, opacity: 0.18 });
const halo = new THREE.Mesh(haloGeometry, haloMaterial);
halo.rotation.x = Math.PI / 2;
scene.add(halo);

const particleCount = 420;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i += 1) {
  const radius = THREE.MathUtils.randFloat(14, 22);
  const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const y = THREE.MathUtils.randFloat(-3, 3);
  positions[i * 3] = Math.cos(angle) * radius;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = Math.sin(angle) * radius;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particlesMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.7 });
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const controls = new OrbitControls(camera, canvas);
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.45;
controls.minPolarAngle = Math.PI / 2.7;
controls.maxPolarAngle = Math.PI - Math.PI / 2.7;

const mouseParallax = { x: 0, y: 0 };
window.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = (event.clientY / window.innerHeight) * 2 - 1;
  mouseParallax.x = x * 0.4;
  mouseParallax.y = y * 0.25;
});

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  planetMaterial.uniforms.uTime.value = elapsed;
  planet.rotation.y += 0.0025;
  orbits.forEach((torus, index) => {
    torus.rotation.z += 0.0015 + index * 0.0004;
  });
  particles.rotation.y += 0.0007;

  camera.position.x += (mouseParallax.x - camera.position.x * 0.05);
  camera.position.y += (-mouseParallax.y - camera.position.y * 0.05);
  camera.lookAt(scene.position);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Scroll splitting logo sphere
const splitTarget = document.querySelector('[data-scroll-split]');
const splitObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        splitTarget.classList.add('is-split');
      } else {
        splitTarget.classList.remove('is-split');
      }
    });
  },
  { threshold: 0.1 }
);
splitObserver.observe(document.querySelector('#hero'));

// Smooth scroll buttons
function scrollToTarget(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.querySelectorAll('[data-scroll]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToTarget(button.getAttribute('data-scroll'));
  });
});

// Reveal timeline items as holograms
const timelineItems = document.querySelectorAll('.timeline__item');
const timelineObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        timelineObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.35 }
);
timelineItems.forEach((item) => timelineObserver.observe(item));

// Speaker data
const speakers = [
  {
    name: 'Dr. Liora Sung',
    role: 'Главный архитектор метавселенных, Synaptic Worlds',
    video: 'https://cdn.coverr.co/videos/coverr-ai-machine-intelligence-2830/1080p.mp4',
    fallback: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Ethan "Pulse" Navarro',
    role: 'XR-исполнитель и нейромузыкант',
    video: 'https://cdn.coverr.co/videos/coverr-man-in-vr-headset-1547058566613?download=1',
    fallback: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Nadia Voron',
    role: 'CEO, Aurora Synth Labs',
    video: 'https://cdn.coverr.co/videos/coverr-the-future-is-now-1584375434425?download=1',
    fallback: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Prof. Milo Adebayo',
    role: 'Руководитель AI-платформ, HyperLooped Reality',
    video: 'https://cdn.coverr.co/videos/coverr-the-digital-realm-1584985164805?download=1',
    fallback: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=600&q=80'
  }
];

const speakersGrid = document.querySelector('.speakers-grid');

speakers.forEach((speaker, index) => {
  const card = document.createElement('article');
  card.className = 'speaker-card';
  card.setAttribute('role', 'listitem');
  card.style.setProperty('--delay', `${index * 0.15}s`);

  const avatar = document.createElement('div');
  avatar.className = 'speaker-card__avatar';
  const video = document.createElement('video');
  video.src = speaker.video;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.poster = speaker.fallback;

  video.addEventListener('mouseenter', () => video.play());
  video.addEventListener('focus', () => video.play());
  video.addEventListener('mouseleave', () => video.pause());
  video.addEventListener('blur', () => video.pause());

  avatar.appendChild(video);

  const info = document.createElement('div');
  info.className = 'speaker-card__info';
  const name = document.createElement('h3');
  name.textContent = speaker.name;
  const role = document.createElement('p');
  role.textContent = speaker.role;

  info.append(name, role);
  card.append(avatar, info);
  speakersGrid.appendChild(card);
});

// Program schedule
const schedule = {
  day: [
    {
      title: 'Metaverse Vision Keynote',
      time: '09:30 · Main Portal',
      details: ['Лира Санг раскрывает дорожную карту открытых метавселенных', 'Погружение в живую 3D-визуализацию будущих городов']
    },
    {
      title: 'AI X Creativity Lab',
      time: '11:00 · Synth Lab',
      details: ['Интерактивные сессии с генеративными AI-композиторами', 'Создание адаптивных AR-спектаклей в реальном времени']
    },
    {
      title: 'Spatial Commerce Forum',
      time: '14:00 · Immersive Forum',
      details: ['Панельная дискуссия о mixed-reality торговле', 'Примеры digital twin storefronts']
    }
  ],
  week: [
    {
      title: 'FutureScape Week Overview',
      time: 'Понедельник — Пятница',
      details: ['XR Bootcamps', 'AI прототипирование', 'Metaverse Venture Sessions', 'Экскурсии по NeoCity XR Arena']
    },
    {
      title: 'Creator Circles',
      time: 'Каждый вечер',
      details: ['Тематические хабы: education, fashion, gaming', 'Mentor matchmaking']
    }
  ],
  map: [
    {
      title: 'Immersive Map',
      time: 'Always On · Web Portal',
      details: ['Переключайтесь между сценами через голографический интерфейс', 'Исследуйте 3D-карту NeoCity XR Arena', 'Встречайте спикеров через AI-аватары']
    }
  ]
};

const programView = document.querySelector('.program-view');

function renderSchedule(mode = 'day') {
  programView.innerHTML = '';
  schedule[mode].forEach((session) => {
    const card = document.createElement('article');
    card.className = 'program-card';
    const title = document.createElement('h3');
    title.textContent = session.title;
    const time = document.createElement('span');
    time.className = 'program-card__time';
    time.textContent = session.time;
    const meta = document.createElement('div');
    meta.className = 'program-card__meta';
    session.details.forEach((detail) => {
      const badge = document.createElement('span');
      badge.textContent = detail;
      meta.appendChild(badge);
    });
    card.append(title, time, meta);
    programView.appendChild(card);
  });
}

renderSchedule('day');

document.querySelectorAll('.program-mode').forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    document.querySelectorAll('.program-mode').forEach((item) => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-checked', item === button ? 'true' : 'false');
    });
    renderSchedule(mode);
  });
});

// Portal form wizard
const form = document.querySelector('.portal-form');
const steps = Array.from(form.querySelectorAll('.portal-step'));
const status = form.querySelector('.portal-status');
let currentStep = 0;

function updateSteps(direction) {
  const current = steps[currentStep];
  if (direction === 'next' && !validateStep(current)) {
    status.textContent = 'Пожалуйста, заполните обязательные поля.';
    pulseFields(current.querySelectorAll('input, select'));
    return;
  }

  current.classList.remove('is-active');
  if (direction === 'next') currentStep = Math.min(currentStep + 1, steps.length - 1);
  if (direction === 'prev') currentStep = Math.max(currentStep - 1, 0);
  const target = steps[currentStep];
  target.classList.add('is-active');
  status.textContent = `Портал ${currentStep + 1} / ${steps.length}`;
  gsap.fromTo(
    target,
    { opacity: 0, filter: 'blur(8px)', scale: 0.97 },
    { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.65, ease: 'expo.out' }
  );
}

function validateStep(stepElement) {
  const fields = Array.from(stepElement.querySelectorAll('input[required], select[required]'));
  return fields.every((field) => field.value.trim().length > 0);
}

function pulseFields(elements) {
  elements.forEach((el, index) => {
    gsap.fromTo(
      el,
      { boxShadow: '0 0 0 rgba(166, 93, 255, 0)', scale: 1 },
      { boxShadow: '0 0 20px rgba(166, 93, 255, 0.75)', scale: 1.02, duration: 0.35, yoyo: true, repeat: 1, delay: index * 0.05 }
    );
  });
}

form.addEventListener('click', (event) => {
  const target = event.target;
  if (target.matches('[data-next]')) {
    updateSteps('next');
  }
  if (target.matches('[data-prev]')) {
    updateSteps('prev');
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const current = steps[currentStep];
  if (!validateStep(current)) {
    status.textContent = 'Заполните обязательные поля.';
    pulseFields(current.querySelectorAll('input, select'));
    return;
  }

  status.textContent = 'Синхронизация с порталами...';
  gsap.to(form, { background: 'rgba(35, 12, 65, 0.85)', duration: 0.6, yoyo: true, repeat: 1 });

  setTimeout(() => {
    status.textContent = 'Добро пожаловать в FutureScape 2025! Секретный портал активирован.';
    const afterpartyToggle = form.querySelector('input[name="afterparty"]');
    if (afterpartyToggle.checked) {
      unlockAfterparty();
    }
  }, 900);
});

function unlockAfterparty() {
  const afterpartySection = document.getElementById('afterparty');
  const afterpartyLink = document.querySelector('.afterparty-link');
  afterpartyLink.hidden = false;
  afterpartyLink.dataset.glitch = 'Afterparty';
  afterpartyLink.textContent = 'Afterparty Portal';
  afterpartyLink.addEventListener('click', (event) => {
    event.preventDefault();
    afterpartySection.hidden = false;
    document.body.style.overflow = 'hidden';
    gsap.fromTo(
      afterpartySection.querySelector('.afterparty__content'),
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }
    );
    triggerGlitch(afterpartyLink);
  });
}

function triggerGlitch(element) {
  element.classList.add('is-glitching');
  setTimeout(() => element.classList.remove('is-glitching'), 1200);
}

// Button glitch hover
const glitchButtons = document.querySelectorAll('.cta, .program-mode, .afterparty-link');

glitchButtons.forEach((button) => {
  button.dataset.glitch = button.textContent.trim();
  button.addEventListener('mouseenter', () => button.classList.add('is-glitching'));
  button.addEventListener('mouseleave', () => button.classList.remove('is-glitching'));
});

// Parallax for hero orbit list
const heroSection = document.querySelector('#hero');
heroSection.addEventListener('mousemove', (event) => {
  const rect = heroSection.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  const orbitList = heroSection.querySelector('.hero__orbit-list');
  orbitList.style.transform = `translate3d(${x * 20}px, ${y * 20}px, 0)`;
});

heroSection.addEventListener('mouseleave', () => {
  const orbitList = heroSection.querySelector('.hero__orbit-list');
  orbitList.style.transform = 'translate3d(0,0,0)';
});

// Reveal program cards with GSAP
function animateProgramCards() {
  gsap.fromTo(
    '.program-card',
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'expo.out' }
  );
}

const programObserver = new MutationObserver(animateProgramCards);
programObserver.observe(programView, { childList: true });
animateProgramCards();

// Hide afterparty when overlay clicked
const afterpartySection = document.getElementById('afterparty');
afterpartySection?.addEventListener('click', (event) => {
  if (event.target === afterpartySection) {
    afterpartySection.hidden = true;
    document.body.style.overflow = '';
  }
});

// Accessibility: pause speaker videos when not visible
const speakerVideos = document.querySelectorAll('.speaker-card video');
const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        entry.target.pause();
      }
    });
  },
  { threshold: 0.25 }
);
speakerVideos.forEach((video) => videoObserver.observe(video));

// Intro animations
window.addEventListener('load', () => {
  gsap.from('.hero__content h1', { y: 40, opacity: 0, duration: 1, ease: 'expo.out' });
  gsap.from('.hero__lead', { y: 30, opacity: 0, delay: 0.2, duration: 1, ease: 'expo.out' });
  gsap.from('.hero__cta-group', { y: 30, opacity: 0, delay: 0.4, duration: 1, ease: 'expo.out' });
  gsap.from('.hero__orbit-list li', { y: 20, opacity: 0, delay: 0.5, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
});
