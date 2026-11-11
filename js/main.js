// ============================================================
// KSN — scripts du site (navigation, formulaires, animations)
// ============================================================

// --- À PERSONNALISER ---------------------------------------
// Numéro WhatsApp de KSN au format international, sans + ni espaces
// (ex : 596696123456 pour un mobile Martinique). REMPLACER :
const KSN_WHATSAPP = "596696000000";
// Adresse qui reçoit les inscriptions à la newsletter :
const KSN_EMAIL = "contact@reseau-ksn.fr";
// ------------------------------------------------------------

// Préférence « réduire les animations » (lue une seule fois, en tête de fichier)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Menu mobile : ouvre / ferme, se referme au tap sur un lien, hors du menu ou avec Échap
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
function setMenu(open) {
  if (!burger || !menu) return;
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  document.documentElement.classList.toggle('menu-open', open);   // fige la page derrière le menu plein écran
}
burger?.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('click', (e) => { if (!e.target.closest('header')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('pageshow', () => setMenu(false));   // retour arrière : le menu ne doit pas rester ouvert
window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

// Lien actif
const page = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(a => {
  if (a.getAttribute('href') === page) a.classList.add('active');
});

// Filtres annuaire (page réseau)
const met = document.getElementById('f-metier');
const ter = document.getElementById('f-territoire');
const search = document.getElementById('f-search');
function filtre() {
  const m = met?.value || '', t = ter?.value || '', q = (search?.value || '').toLowerCase();
  document.querySelectorAll('.membre-card').forEach(c => {
    const ok = (!m || c.dataset.metier === m) &&
               (!t || c.dataset.territoire === t) &&
               (!q || c.textContent.toLowerCase().includes(q));
    c.style.display = ok ? '' : 'none';
  });
  refreshSwipe();
}
[met, ter, search].forEach(el => el?.addEventListener('input', filtre));

// Actualités : filtre par catégorie (puces « Toutes / KSN / Filière / Membres »)
const chips = document.querySelectorAll('.chip[data-filter]');
chips.forEach(chip => chip.addEventListener('click', () => {
  const f = chip.dataset.filter;
  chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
  document.querySelectorAll('.news[data-cat]').forEach(card => {
    card.hidden = f !== 'all' && card.dataset.cat !== f;
  });
}));

// Fiche « Nous rejoindre » → message WhatsApp pré-rempli pour entrer dans le groupe
document.getElementById('form-rejoindre')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nom = document.getElementById('r-nom').value.trim();
  const metier = document.getElementById('r-metier').value;
  const terr = document.getElementById('r-terr').value;
  const projet = document.getElementById('r-projet').value.trim();
  const msg =
`Bonjour KSN ! Je souhaite rejoindre le groupe WhatsApp de la communauté.
— Nom : ${nom}
— Activité : ${metier}
— Territoire : ${terr}${projet ? `
— Mon projet : ${projet}` : ''}
Merci !`;
  const url = `https://wa.me/${KSN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  // Si Safari bloque l'ouverture d'un nouvel onglet, on bascule dans l'onglet courant
  if (!window.open(url, '_blank')) location.href = url;
});

// Newsletter → e-mail pré-rempli à l'équipe KSN (pas de service d'envoi branché)
document.getElementById('form-newsletter')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('n-email').value.trim();
  const body = `Bonjour KSN, merci de m'inscrire à la newsletter.\nMon e-mail : ${email}`;
  location.href = `mailto:${KSN_EMAIL}?subject=${encodeURIComponent('Inscription newsletter KSN')}&body=${encodeURIComponent(body)}`;
});

// Page Contact → e-mail pré-rempli à l'équipe KSN (pas de service d'envoi branché)
document.getElementById('form-contact')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nom = document.getElementById('c-nom').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const sujet = document.getElementById('c-sujet').value;
  const message = document.getElementById('c-message').value.trim();
  const body = `${message}\n\n— ${nom}\n${email}`;
  location.href = `mailto:${KSN_EMAIL}?subject=${encodeURIComponent('Contact KSN — ' + sujet)}&body=${encodeURIComponent(body)}`;
});

// ============================================================
// ANIMATIONS
// ============================================================
// Reveal au scroll : cartes, titres, blocs — avec décalage en cascade
function initAnims() {
  if (reduceMotion) return;

  const targets = document.querySelectorAll(
    '.card, .seek-item, .stat, .tl-item, .member, .event, section h2, section .eyebrow, .seeking-eyebrow, .ksn-form, .filters'
  );
  targets.forEach(el => {
    if (el.classList.contains('reveal')) return;
    if (el.closest('[style*="display: none"], [style*="display:none"]')) return;
    el.classList.add('reveal');
    // cascade : décalage selon la position dans le parent
    const siblings = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [el];
    const idx = siblings.indexOf(el);
    el.style.setProperty('--d', `${Math.min(idx, 6) * 0.09}s`);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        io.unobserve(en.target);
        if (en.target.classList.contains('stat') || en.target.classList.contains('build')) countUp(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
}

// Compteurs animés : chiffres clés ("170+", "3", "170", "15") et compteur d'annuaire (page Le réseau)
function countUp(statEl) {
  const b = statEl.querySelector('b');
  if (!b || b.dataset.done) return;
  b.dataset.done = '1';
  // « 170+ », « 15 », « ~8 000 » : préfixe, nombre (espace des milliers permise), suffixe
  const m = b.textContent.trim().match(/^(\D*?)([\d\s]+)(\D*)$/);
  if (!m) return;
  const prefix = m[1], suffix = m[3];
  const num = parseInt(m[2].replace(/\D/g, ''), 10);
  if (isNaN(num)) return;
  const fmt = (n) => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, '\u00a0');   // espace insécable des milliers
  const dur = 1400, t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    b.textContent = prefix + fmt(Math.round(num * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Marquee : duplique le contenu pour une boucle sans couture
document.querySelectorAll('.marquee-track').forEach(track => {
  track.innerHTML += track.innerHTML;
});

// Parallaxe légère sur le logo du héro (grands écrans seulement : sur iPhone, rien à faire défiler)
if (!reduceMotion && window.matchMedia('(min-width: 641px)').matches) {
  const spiral = document.querySelector('.hero .hero-spiral');
  if (spiral) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) spiral.style.marginTop = `${y * 0.08}px`;
    }, { passive: true });
  }
}

// Cartes à faire glisser (mobile) : pastilles de position, cliquables, recalculées si un filtre masque des cartes
function refreshSwipe() {
  document.querySelectorAll('.swipe').forEach((sw) => {
    let dots = sw.nextElementSibling;
    if (!dots || !dots.classList.contains('swipe-dots')) {
      dots = document.createElement('div');
      dots.className = 'swipe-dots';
      sw.after(dots);
      let ticking = false;
      sw.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; markSwipe(sw, dots); });
      }, { passive: true });
    }
    const items = [...sw.children].filter((c) => !c.hidden && c.style.display !== 'none');
    dots.hidden = items.length < 2;
    dots.replaceChildren(...items.map((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Carte ${i + 1} sur ${items.length}`);
      b.addEventListener('click', () => it.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'start', block: 'nearest' }));
      return b;
    }));
    markSwipe(sw, dots);
  });
}
function markSwipe(sw, dots) {
  const items = [...sw.children].filter((c) => !c.hidden && c.style.display !== 'none');
  const left = sw.getBoundingClientRect().left + (parseFloat(getComputedStyle(sw).paddingLeft) || 0);
  let best = 0, gap = Infinity;
  items.forEach((it, i) => {
    const d = Math.abs(it.getBoundingClientRect().left - left);
    if (d < gap) { gap = d; best = i; }
  });
  if (sw.scrollLeft + sw.clientWidth >= sw.scrollWidth - 4) best = items.length - 1;   // en butée à droite : la dernière
  [...dots.children].forEach((b, i) => b.toggleAttribute('aria-current', i === best));
}
refreshSwipe();
window.addEventListener('resize', refreshSwipe);

initAnims();
