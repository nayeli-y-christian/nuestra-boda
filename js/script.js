(function () {
  'use strict';

  // Pétalos cayendo desde la parte superior
  var cv = document.getElementById('petalos');
  var ctx = cv.getContext('2d');
  var petalos = [];
  var colores = ['#f1d3cd', '#e9c9c4', '#f7e6e2', '#ffffff', '#f4dcc6'];
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function ajustar() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function nuevo(arriba) {
    var t = 9 + Math.random() * 11;
    return {
      x: Math.random() * W, y: arriba ? -20 - Math.random() * 40 : Math.random() * H,
      t: t, vy: 0.5 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.4,
      fase: Math.random() * 6.28, osc: 0.6 + Math.random() * 1.2,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.03,
      volteo: Math.random() * 6.28, vv: 0.02 + Math.random() * 0.03,
      c: colores[(Math.random() * colores.length) | 0], a: 0.65 + Math.random() * 0.3
    };
  }
  function dibujar(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.abs(Math.cos(p.volteo)) * 0.8 + 0.2);
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.moveTo(0, -p.t);
    ctx.bezierCurveTo(p.t * 0.9, -p.t * 0.6, p.t * 0.7, p.t * 0.6, 0, p.t);
    ctx.bezierCurveTo(-p.t * 0.7, p.t * 0.6, -p.t * 0.9, -p.t * 0.6, 0, -p.t);
    ctx.fill();
    ctx.restore();
  }
  function animar() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < petalos.length; i++) {
      var p = petalos[i];
      p.fase += 0.015 * p.osc;
      p.x += p.vx + Math.sin(p.fase) * 0.7;
      p.y += p.vy;
      p.rot += p.vr;
      p.volteo += p.vv;
      if (p.y > H + 30 || p.x < -40 || p.x > W + 40) petalos[i] = nuevo(true);
      dibujar(petalos[i]);
    }
    requestAnimationFrame(animar);
  }
  if (!reducir) {
    ajustar();
    var cantidad = W < 600 ? 22 : 40;
    for (var k = 0; k < cantidad; k++) petalos.push(nuevo(false));
    window.addEventListener('resize', ajustar);
    requestAnimationFrame(animar);
  }

  // Música de fondo (se inicia al abrir el sobre, porque el navegador exige un toque del usuario)
  var audio = document.getElementById('musica');
  var btnMusica = document.getElementById('musica-btn');
  function estado(sonando) {
    btnMusica.setAttribute('aria-pressed', sonando ? 'true' : 'false');
    btnMusica.setAttribute('aria-label', sonando ? 'Pausar música' : 'Reproducir música');
  }
  var gestos = ['pointerdown', 'touchend', 'keydown', 'click'];
  function quitarGestos() { gestos.forEach(function (g) { document.removeEventListener(g, alGesto, true); }); }
  function alGesto(ev) {
    if (ev && btnMusica.contains(ev.target)) { quitarGestos(); return; }
    reproducir();
  }
  function reproducir() {
    audio.volume = 0.6;
    var r = audio.play();
    if (r && r.then) {
      r.then(function () { btnMusica.hidden = false; estado(true); quitarGestos(); },
             function () { /* el navegador la bloqueó: se reintenta en el siguiente toque */ });
    }
  }
  // Intento de reproducción automática al cargar; si el navegador la bloquea,
  // arranca en el primer toque, clic o tecla del invitado.
  gestos.forEach(function (g) { document.addEventListener(g, alGesto, true); });
  reproducir();
  audio.addEventListener('canplaythrough', function () { if (audio.paused && !btnMusica.dataset.manual) reproducir(); }, { once: true });

  btnMusica.addEventListener('click', function () {
    btnMusica.dataset.manual = '1';
    if (audio.paused) { audio.play().then(function () { estado(true); }, function () { estado(false); }); }
    else { audio.pause(); estado(false); }
  });

  // Portada tipo sobre
  var sobre = document.getElementById('sobre');
  document.getElementById('abrir').addEventListener('click', function () {
    reproducir();
    sobre.classList.add('abierto');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    setTimeout(function () { sobre.style.display = 'none'; }, 1000);
  });

  // Aparición al hacer scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Cuenta regresiva: 24 de abril de 2027, 5:30 pm (hora del centro de México, UTC-6)
  var meta = new Date('2027-04-24T17:30:00-06:00').getTime();
  var ids = { d: 'c-d', h: 'c-h', m: 'c-m', s: 'c-s' };
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    var diff = Math.max(0, meta - Date.now());
    var s = Math.floor(diff / 1000);
    document.getElementById(ids.d).textContent = Math.floor(s / 86400);
    document.getElementById(ids.h).textContent = pad(Math.floor(s % 86400 / 3600));
    document.getElementById(ids.m).textContent = pad(Math.floor(s % 3600 / 60));
    document.getElementById(ids.s).textContent = pad(s % 60);
  }
  tick();
  setInterval(tick, 1000);

  // Confirmación por WhatsApp
  var WHATSAPP = '5215583072029';
  var form = document.getElementById('form');
  var error = document.getElementById('error');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
      error.textContent = 'Por favor escribe tu nombre.';
      return;
    }
    error.textContent = '';
    var texto = 'Hola, soy ' + nombre + '. Confirmo mi asistencia a la boda de Nayeli y Christian (24 de abril de 2027).';
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  });
})();
