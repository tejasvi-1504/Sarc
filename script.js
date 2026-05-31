/* =====================================================
   SARC Pvt Limited — script.js  (v3 — GSAP + Three.js)
   ===================================================== */

/* ---- Register GSAP plugins ---- */
try { gsap.registerPlugin(ScrollTrigger); } catch(e) { console.warn('ScrollTrigger not available'); }

/* =====================================================
   SET INITIAL HIDDEN STATES IMMEDIATELY
   (preloader is covering the page, so no flash)
   ===================================================== */
(function setInitialStates() {
  if (typeof gsap === 'undefined') return;
  gsap.set('.bw-char',       { yPercent: 110, force3D: true });
  gsap.set('#heroBadge',     { autoAlpha: 0, y: 28 });
  gsap.set('#brandSub',      { autoAlpha: 0, y: 18 });
  gsap.set('#heroHeadline',  { autoAlpha: 0, y: 32 });
  gsap.set('#heroActions',   { autoAlpha: 0, y: 24 });
  gsap.set('#heroKpis',      { autoAlpha: 0, y: 36 });
  gsap.set('.scroll-prompt', { autoAlpha: 0 });
})();

/* =====================================================
   1.  PRELOADER  (runs before GSAP hero sequence)
   ===================================================== */
let heroReady = false;

(function () {
  const bar    = document.getElementById('preBar');
  const pct    = document.getElementById('prePct');
  const loader = document.getElementById('preloader');
  document.body.style.overflow = 'hidden';

  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 14 + 4;
    if (p >= 100) {
      p = 100;
      clearInterval(tick);
      bar.style.width = '100%';
      pct.textContent = '100%';
      setTimeout(() => {
        loader.classList.add('done');
        document.body.style.overflow = '';
        runHeroAnimation();
      }, 500);
    } else {
      bar.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
    }
  }, 80);
})();

/* =====================================================
   2.  THREE.JS CINEMATIC ROAD  (hero background)
   ===================================================== */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  let W = canvas.offsetWidth, H = canvas.offsetHeight;

  /* Scene */
  const scene    = new THREE.Scene();
  scene.fog      = new THREE.Fog(0x030912, 40, 160);

  /* Camera */
  const camera   = new THREE.PerspectiveCamera(58, W / H, 0.1, 200);
  camera.position.set(0, 2.2, 11);

  /* Renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x030912, 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);

  /* --- Road surface --- */
  const roadGeo = new THREE.PlaneGeometry(9, 300);
  const roadMat = new THREE.MeshBasicMaterial({ color: 0x060e1c });
  const road    = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -100;
  scene.add(road);

  /* --- Road shoulders --- */
  const shoulderMat = new THREE.MeshBasicMaterial({ color: 0x040b14 });
  [-7, 7].forEach(x => {
    const sg   = new THREE.PlaneGeometry(5, 300);
    const mesh = new THREE.Mesh(sg, shoulderMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, -0.01, -100);
    scene.add(mesh);
  });

  /* --- White edge stripes --- */
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
  [-4.4, 4.4].forEach(x => {
    const eg   = new THREE.PlaneGeometry(0.12, 300);
    const mesh = new THREE.Mesh(eg, edgeMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.01, -100);
    scene.add(mesh);
  });

  /* --- Gold side glow strips --- */
  const glowStripMat = new THREE.MeshBasicMaterial({ color: 0xc9a040, transparent: true, opacity: 0.1 });
  [-4.8, 4.8].forEach(x => {
    const gg   = new THREE.PlaneGeometry(0.4, 300);
    const mesh = new THREE.Mesh(gg, glowStripMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.01, -100);
    scene.add(mesh);
  });

  /* --- Center dashes (moving) --- */
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xc9a040, transparent: true, opacity: 0.88 });
  const dashes  = [];
  for (let i = 0; i < 50; i++) {
    const dg   = new THREE.PlaneGeometry(0.22, 4.5);
    const mesh = new THREE.Mesh(dg, dashMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.015, -i * 8);
    dashes.push(mesh);
    scene.add(mesh);
  }

  /* --- Stars / sky particles --- */
  const starVerts = [];
  for (let i = 0; i < 1200; i++) {
    starVerts.push(
      (Math.random() - 0.5) * 300,
      Math.random() * 25 + 3,
      Math.random() * -200 - 5
    );
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x8899cc, size: 0.14, transparent: true, opacity: 0.55 });
  scene.add(new THREE.Points(starGeo, starMat));

  /* --- Lights --- */
  scene.add(new THREE.AmbientLight(0x1a2a4a, 3));
  const headlight = new THREE.PointLight(0xc9a040, 2.5, 60);
  headlight.position.set(0, 4, 8);
  scene.add(headlight);

  /* --- Mouse tracking for subtle camera lean --- */
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / W - 0.5) * 2;
    my = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  /* --- Resize --- */
  window.addEventListener('resize', () => {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  /* --- Animate --- */
  let offset = 0;
  function animateRoad() {
    requestAnimationFrame(animateRoad);
    offset += 0.11;

    dashes.forEach((d, i) => {
      d.position.z = -((i * 8 - offset) % 400) + 12;
    });

    camera.position.x += (mx * 0.9 - camera.position.x) * 0.04;
    camera.position.y += (2.2 - my * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -20);

    renderer.render(scene, camera);
  }
  animateRoad();
})();

/* =====================================================
   3.  FLOATING BACKGROUND PARTICLES
   ===================================================== */
(function () {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const pts = Array.from({ length: 50 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: 1 + Math.random() * 1.5
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,160,64,0.3)'; ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 125) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(201,160,64,${0.08*(1-d/125)})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* =====================================================
   4.  HERO GSAP ANIMATION  (called after preloader)
   ===================================================== */
/* Hard fallback — forces everything visible after 5s if GSAP fails */
function forceHeroVisible() {
  ['.bw-char','#heroBadge','#brandSub','#heroHeadline','#heroActions',
   '#heroKpis','.kpi-card','.scroll-prompt'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.cssText += ';opacity:1!important;transform:none!important;visibility:visible!important;';
    });
  });
}

function runHeroAnimation() {
  /* Ensure states are set (guard: called if setInitialStates already ran) */
  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },   /* smoother, not "snappy" */
    onComplete: () => gsap.set('.scroll-prompt', { autoAlpha: 1 })
  });

  /* SARC letters slide up — generous stagger, 1.8s each */
  tl.to('.bw-char', {
    yPercent: 0, duration: 1.8, stagger: 0.14, force3D: true
  })
  /* Badge fades in while chars still moving */
  .to('#heroBadge',    { autoAlpha: 1, y: 0, duration: 1.1 }, '-=1.5')
  /* Subtitle line */
  .to('#brandSub',     { autoAlpha: 1, y: 0, duration: 1.0 }, '-=1.0')
  /* Main headline */
  .to('#heroHeadline', { autoAlpha: 1, y: 0, duration: 1.1 }, '-=0.8')
  /* CTA buttons */
  .to('#heroActions',  { autoAlpha: 1, y: 0, duration: 1.0 }, '-=0.7')
  /* KPI cards */
  .to('#heroKpis',     { autoAlpha: 1, y: 0, duration: 1.0 }, '-=0.6')
  /* Scroll hint */
  .to('.scroll-prompt',{ autoAlpha: 1, duration: 0.8 }, '-=0.2');

  /* Safety net: if anything goes wrong, make page readable after 5s */
  setTimeout(forceHeroVisible, 5000);
}

/* =====================================================
   5.  SCROLL-TRIGGERED ANIMATIONS (GSAP ScrollTrigger)
   ===================================================== */
window.addEventListener('load', () => {
  if (typeof ScrollTrigger === 'undefined') return;

  /* Generic fade-up for section headers */
  gsap.utils.toArray('.gsap-up').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      y: 50, opacity: 0, duration: 1.1, ease: 'power3.out'
    });
  });

  /* Service / Why / Maintenance cards — gentle stagger */
  gsap.utils.toArray('#services .svc-card, #why .why-card, #maintenance .maint-card').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      y: 60, opacity: 0, duration: 1.0,
      delay: (i % 3) * 0.1,
      ease: 'power3.out'
    });
  });

  /* Left / right panels */
  gsap.utils.toArray('.gsap-left').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      x: -60, opacity: 0, duration: 1.2, ease: 'power3.out'
    });
  });
  gsap.utils.toArray('.gsap-right').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      x: 60, opacity: 0, duration: 1.2, ease: 'power3.out'
    });
  });

  /* Stats cards */
  gsap.from('.imp-stat', {
    scrollTrigger: { trigger: '#impact', start: 'top 78%', once: true },
    y: 55, opacity: 0, duration: 1.0, stagger: 0.15, ease: 'power3.out'
  });

  /* KPI hover tilt */
  gsap.utils.toArray('.kpi-card').forEach(card => {
    card.addEventListener('mouseenter', () => gsap.to(card, { scale: 1.04, duration: 0.3 }));
    card.addEventListener('mouseleave', () => gsap.to(card, { scale: 1, duration: 0.4 }));
  });

  /* Section heading gentle fade+rise */
  gsap.utils.toArray('.sec-title').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      y: 30, opacity: 0, duration: 1.2, ease: 'power3.out'
    });
  });
});

/* =====================================================
   6.  COUNTER ANIMATION
   ===================================================== */
(function () {
  const nums = document.querySelectorAll('.imp-num[data-target]');
  const obs  = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.target;
      gsap.to({ val: 0 }, {
        val: target, duration: 2, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(this.targets()[0].val); }
      });
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => obs.observe(n));
})();

/* =====================================================
   7.  CARD 3D TILT  (GSAP quickTo for performance)
   ===================================================== */
(function () {
  document.querySelectorAll('.svc-card, .why-card, .imp-stat').forEach(card => {
    const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power3.out' });
    const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power3.out' });
    const shdw = gsap.quickTo(card, 'boxShadow', { duration: 0.4 });

    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const y  = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      rotX(-y * 6);
      rotY(x * 6);
    });
    card.addEventListener('mouseleave', () => {
      rotX(0); rotY(0);
    });
  });
  gsap.set('.svc-card, .why-card, .imp-stat', { transformPerspective: 800 });
})();

/* =====================================================
   8.  CUSTOM CURSOR
   ===================================================== */
(function () {
  if (window.matchMedia('(hover: none)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let cx = 0, cy = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
  }, { passive: true });

  (function trackRing() {
    rx += (cx - rx) * 0.14;
    ry += (cy - ry) * 0.14;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(trackRing);
  })();

  /* Expand ring on interactive elements */
  const hoverEls = 'a, button, [data-magnetic], .svc-card, .why-card, .kpi-card, .av-card, .photo-wrap';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
})();

/* =====================================================
   9.  MAGNETIC BUTTONS  (GSAP quickTo)
   ===================================================== */
(function () {
  document.querySelectorAll('.mag-btn').forEach(btn => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });

    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width  / 2) * 0.4);
      yTo((e.clientY - r.top  - r.height / 2) * 0.4);
    });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
})();

/* =====================================================
   10. SCROLL PROGRESS BAR
   ===================================================== */
(function () {
  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    bar.style.width = (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
  }, { passive: true });
})();

/* =====================================================
   11. NAVBAR
   ===================================================== */
(function () {
  const nav  = document.getElementById('navbar');
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('navMenu');

  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60), { passive: true });

  btn.addEventListener('click', () => { btn.classList.toggle('open'); menu.classList.toggle('open'); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { btn.classList.remove('open'); menu.classList.remove('open'); }));
})();

/* =====================================================
   12. SMOOTH ANCHOR SCROLL
   ===================================================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = document.getElementById('navbar').offsetHeight + 20;
    gsap.to(window, {
      scrollTo: target.offsetTop - offset,
      duration: 1.2,
      ease: 'expo.inOut'
    });
  });
});
/* Fallback: register ScrollToPlugin if loaded */
try { gsap.registerPlugin(ScrollToPlugin); } catch(e) {}

/* =====================================================
   13. FOUNDER PHOTO UPLOAD
   ===================================================== */
function triggerUpload() {
  document.getElementById('photoInput').click();
}
function loadPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('founderImg');
    const ph  = document.getElementById('photoPlaceholder');
    img.src = e.target.result;
    gsap.to(ph,  { opacity: 0, duration: 0.4, onComplete: () => ph.style.display = 'none' });
    img.style.display = 'block';
    gsap.from(img, { opacity: 0, scale: 1.05, duration: 0.6, ease: 'expo.out' });
  };
  reader.readAsDataURL(input.files[0]);
}

/* =====================================================
   14. CONTACT FORM
   ===================================================== */
function submitForm(e) {
  e.preventDefault();
  const txt = document.getElementById('submitText');
  const ico = document.getElementById('submitIcon');
  const btn = e.target.querySelector('.btn-submit');

  gsap.to(btn, { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 });
  setTimeout(() => {
    txt.textContent = 'Sent Successfully!';
    ico.className = 'fas fa-check';
    btn.style.background = 'linear-gradient(135deg,#2ecc71,#27ae60)';
    gsap.from(btn, { scale: 0.95, duration: 0.3, ease: 'back.out' });
    setTimeout(() => {
      txt.textContent = 'Send Enquiry';
      ico.className = 'fas fa-arrow-right';
      btn.style.background = '';
      e.target.reset();
    }, 3500);
  }, 200);
}

/* =====================================================
   15. FLOAT CALL — hide near contact section
   ===================================================== */
(function () {
  const btn     = document.getElementById('floatCall');
  const contact = document.getElementById('contact');
  if (!btn || !contact) return;
  new IntersectionObserver(([entry]) => {
    gsap.to(btn, { opacity: entry.isIntersecting ? 0 : 1, y: entry.isIntersecting ? 20 : 0, duration: 0.4, pointerEvents: entry.isIntersecting ? 'none' : 'auto' });
  }, { threshold: 0.25 }).observe(contact);
})();
