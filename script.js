/* =====================================================
   SARC Pvt Limited — script.js
   ===================================================== */

/* === PRELOADER === */
(function () {
  const fill   = document.getElementById('preFill');
  const pct    = document.getElementById('prePct');
  const loader = document.getElementById('preloader');
  document.body.style.overflow = 'hidden';
  let progress = 0;

  const tick = setInterval(() => {
    progress += Math.random() * 15 + 3;
    if (progress >= 100) {
      progress = 100;
      clearInterval(tick);
      setTimeout(() => {
        loader.classList.add('done');
        document.body.style.overflow = '';
      }, 400);
    }
    fill.style.width = progress + '%';
    pct.textContent  = Math.floor(progress) + '%';
  }, 90);
})();

/* === BACKGROUND PARTICLE CANVAS === */
(function () {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const count = 55;
  const pts   = Array.from({ length: count }, () => ({
    x  : Math.random() * window.innerWidth,
    y  : Math.random() * window.innerHeight,
    vx : (Math.random() - 0.5) * 0.35,
    vy : (Math.random() - 0.5) * 0.35,
    r  : 1 + Math.random() * 1.5,
  }));

  const CONNECT = 130;

  function loop() {
    ctx.clearRect(0, 0, W, H);

    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,160,64,0.35)';
      ctx.fill();
    }

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx   = pts[i].x - pts[j].x;
        const dy   = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(201,160,64,${0.1 * (1 - dist / CONNECT)})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(loop);
  }
  loop();
})();

/* === NAVBAR SCROLL === */
(function () {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* === HAMBURGER MENU === */
(function () {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('navMenu');

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
    });
  });
})();

/* === SMOOTH ANCHOR SCROLL === */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = document.getElementById('navbar').offsetHeight;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

/* === SCROLL REVEAL === */
(function () {
  const classes = ['.reveal', '.reveal-left', '.reveal-right'];
  const els     = document.querySelectorAll(classes.join(','));

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
      }
    });
  }, { threshold: 0.13 });

  els.forEach(el => obs.observe(el));
})();

/* === COUNTER ANIMATION === */
(function () {
  const nums = document.querySelectorAll('.imp-num[data-target]');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target);
      const dur    = 1600;
      const start  = performance.now();

      const animate = now => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / dur, 1);
        const ease     = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        el.textContent = Math.round(ease * target);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => obs.observe(n));
})();

/* === CARD 3D TILT === */
(function () {
  const cards = document.querySelectorAll('.svc-card, .why-card, .kpi-card, .imp-stat');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const x   = e.clientX - r.left;
      const y   = e.clientY - r.top;
      const cx  = r.width  / 2;
      const cy  = r.height / 2;
      const rx  = ((y - cy) / cy) * 6;
      const ry  = ((cx - x) / cx) * 6;
      card.style.transform = `translateY(-10px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.style.transition = 'transform 0.08s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.45s ease';
    });
  });
})();

/* === FOUNDER PHOTO UPLOAD === */
function triggerUpload() {
  document.getElementById('photoInput').click();
}

function loadPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img         = document.getElementById('founderImg');
    const placeholder = document.getElementById('photoPlaceholder');
    img.src           = e.target.result;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

/* === CONTACT FORM === */
function submitForm(e) {
  e.preventDefault();
  const text = document.getElementById('submitText');
  const icon = document.getElementById('submitIcon');
  const btn  = e.target.querySelector('.btn-submit');

  text.textContent  = 'Sent Successfully!';
  icon.className    = 'fas fa-check';
  btn.style.background = 'linear-gradient(135deg,#2ecc71,#27ae60)';

  setTimeout(() => {
    text.textContent  = 'Send Enquiry';
    icon.className    = 'fas fa-arrow-right';
    btn.style.background = '';
    e.target.reset();
  }, 3500);
}

/* === FLOATING CALL: hide when contact is visible === */
(function () {
  const btn     = document.getElementById('floatCall');
  const contact = document.getElementById('contact');

  const obs = new IntersectionObserver(entries => {
    btn.style.opacity    = entries[0].isIntersecting ? '0' : '1';
    btn.style.pointerEvents = entries[0].isIntersecting ? 'none' : 'auto';
  }, { threshold: 0.3 });

  if (contact) obs.observe(contact);
})();
