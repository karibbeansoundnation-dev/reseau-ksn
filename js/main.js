// ============================================================
// KSN — scripts du site (navigation, formulaires, animations)
// ============================================================

// --- À PERSONNALISER ---------------------------------------
// Numéro WhatsApp de KSN au format international, sans + ni espaces
// (ex : 33785053758 pour le 07 85 05 37 58, 596696123456 pour un mobile Martinique) :
const KSN_WHATSAPP = "33785053758";
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

// Annuaire (page réseau) : recherche, filtres territoire et secteur, pastilles de territoire, filtres actifs,
// pages de 12 fiches (8 sur tablette, 5 sur téléphone). Sans JavaScript, toute la liste reste affichée.
const annuaire = document.querySelector('.annuaire');
if (annuaire) {
  const mqGrand = window.matchMedia('(min-width: 901px)');   // 3 colonnes
  const mqMoyen = window.matchMedia('(min-width: 601px)');   // 2 colonnes
  const parPage = () => (mqGrand.matches ? 12 : mqMoyen.matches ? 8 : 5);
  let taille = parPage();
  const cartes = [...annuaire.querySelectorAll('.membre-card')];
  const fSearch = document.getElementById('f-search');
  const fOrigine = document.getElementById('f-origine');
  const fSecteur = document.getElementById('f-secteur');
  const fForm = document.getElementById('f-form');
  const fToggle = document.getElementById('f-toggle');
  const fPanel = document.getElementById('f-panel');
  const fBadge = document.getElementById('f-badge');
  const fQuick = document.getElementById('f-quick');
  const fReset = document.getElementById('f-reset');
  const fActive = document.getElementById('f-active');
  const compte = document.getElementById('f-count');
  const vide = document.getElementById('f-empty');
  const pager = document.getElementById('pager');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // La recherche porte sur le nom, le territoire et le rôle, pas sur les secteurs (ceux-ci ont leur filtre).
  const textes = new Map(cartes.map((c) => [c, norm(
    ['.membre-nom', '.membre-type', '.membre-role'].map((s) => c.querySelector(s)?.textContent || '').join(' ')
  )]));
  let page = 1;

  const correspond = (c, q, o, s) =>
    (!q || textes.get(c).includes(q)) &&
    (!o || c.dataset.origines.split('|').includes(o)) &&
    (!s || c.dataset.secteurs.split('|').includes(s));

  // Rôles longs : 4 lignes puis « Lire la suite » (le bouton n'apparaît que si le texte est vraiment coupé)
  cartes.forEach((c) => {
    const role = c.querySelector('.membre-role');
    if (!role) return;
    role.classList.add('is-clamped');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'membre-more';
    b.textContent = 'Lire la suite';
    b.hidden = true;
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => {
      const ouvert = role.classList.toggle('is-open');
      b.textContent = ouvert ? 'Réduire' : 'Lire la suite';
      b.setAttribute('aria-expanded', String(ouvert));
    });
    role.after(b);
  });
  function mesurer() {
    cartes.forEach((c) => {
      if (c.hidden) return;
      const role = c.querySelector('.membre-role');
      const b = c.querySelector('.membre-more');
      if (!role || !b || role.classList.contains('is-open')) return;
      b.hidden = !(role.scrollHeight > role.clientHeight + 1);
    });
  }

  function bouton(texte, cible, { actif = false, desactive = false, label = '', classe = '' } = {}) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = texte;
    if (classe) b.className = classe;
    if (label) b.setAttribute('aria-label', label);
    if (actif) b.setAttribute('aria-current', 'page');
    if (desactive) b.disabled = true;
    else b.addEventListener('click', () => { page = cible; rendre(true); });
    return b;
  }

  function numeros(pages) {
    // 1 … page-1 page page+1 … dernière
    const sel = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
    const liste = [...sel].sort((a, b) => a - b);
    const sortie = [];
    liste.forEach((n, i) => {
      if (i && n - liste[i - 1] === 2) sortie.push(n - 1);        // un seul numéro manquant : on l'affiche
      else if (i && n - liste[i - 1] > 2) sortie.push('…');
      sortie.push(n);
    });
    return sortie;
  }

  // Filtres actifs : une pastille par filtre, un clic la retire
  function pastilles(q, o, s) {
    const liste = [];
    if (q) liste.push({ texte: '« ' + fSearch.value.trim() + ' »', retirer: () => { fSearch.value = ''; } });
    if (o) liste.push({ texte: o, retirer: () => { fOrigine.value = ''; } });
    if (s) liste.push({ texte: s, retirer: () => { fSecteur.value = ''; } });
    const ul = fActive.querySelector('ul');
    ul.replaceChildren(...liste.map(({ texte, retirer }) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = texte;
      b.setAttribute('aria-label', 'Retirer le filtre : ' + texte);
      b.addEventListener('click', () => { retirer(); page = 1; rendre(false); });
      li.append(b);
      return li;
    }));
    fActive.hidden = liste.length === 0;
    if (fReset) fReset.hidden = liste.length === 0;
  }

  function rendre(defiler) {
    const q = norm(fSearch?.value || '').trim();
    const o = fOrigine?.value || '', s = fSecteur?.value || '';
    const trouvees = cartes.filter((c) => correspond(c, q, o, s));
    const pages = Math.max(1, Math.ceil(trouvees.length / taille));
    page = Math.min(Math.max(page, 1), pages);
    const debut = (page - 1) * taille;
    const visibles = new Set(trouvees.slice(debut, debut + taille));
    cartes.forEach((c) => { c.hidden = !visibles.has(c); });

    const n = trouvees.length;
    if (compte) {
      const nombre = document.createElement('strong');
      nombre.textContent = String(n);
      compte.replaceChildren(nombre, n > 1 ? ' membres dans l’annuaire' : ' membre dans l’annuaire');
    }
    if (vide) vide.hidden = n > 0;

    // Barre de filtres : compteur sur le bouton, pastilles de territoire, filtres actifs
    const nbSelects = (o ? 1 : 0) + (s ? 1 : 0);
    if (fBadge) { fBadge.textContent = String(nbSelects); fBadge.hidden = nbSelects === 0; }
    fQuick?.querySelectorAll('[data-origine]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.origine === o)));
    if (fActive) pastilles(q, o, s);

    if (pager) {
      pager.replaceChildren();
      pager.hidden = pages < 2;
      if (pages > 1) {
        pager.append(bouton('Précédent', page - 1, { desactive: page === 1, classe: 'pager-nav' }));
        const nums = document.createElement('span');
        nums.className = 'pager-nums';
        numeros(pages).forEach((x) => {
          if (x === '…') {
            const e = document.createElement('span');
            e.textContent = '…';
            e.setAttribute('aria-hidden', 'true');
            nums.append(e);
          } else {
            nums.append(bouton(String(x), x, { actif: x === page, label: 'Page ' + x }));
          }
        });
        pager.append(nums);
        const info = document.createElement('span');
        info.className = 'pager-info';
        info.textContent = 'Page ' + page + ' sur ' + pages;
        pager.append(info);
        pager.append(bouton('Suivant', page + 1, { desactive: page === pages, classe: 'pager-nav' }));
      }
    }
    mesurer();
    if (defiler) document.getElementById('filtres')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  [fSearch, fOrigine, fSecteur].forEach((el) => el?.addEventListener('input', () => { page = 1; rendre(false); }));
  fForm?.addEventListener('submit', (e) => { e.preventDefault(); page = 1; rendre(true); fSearch.blur(); });

  // Boutons réservés à JavaScript : filtres repliables, territoires, réinitialiser
  if (fToggle && fPanel) {
    fPanel.hidden = true;
    fToggle.hidden = false;
    fToggle.addEventListener('click', () => {
      const ouvert = fPanel.hidden;
      fPanel.hidden = !ouvert;
      fToggle.setAttribute('aria-expanded', String(ouvert));
    });
  }
  if (fQuick) {
    fQuick.hidden = false;
    fQuick.querySelectorAll('[data-origine]').forEach((b) => b.addEventListener('click', () => {
      fOrigine.value = fOrigine.value === b.dataset.origine ? '' : b.dataset.origine;
      page = 1;
      rendre(false);
    }));
  }
  fReset?.addEventListener('click', () => {
    fSearch.value = ''; fOrigine.value = ''; fSecteur.value = '';
    page = 1;
    rendre(false);
  });

  // Le nombre de fiches par page suit le nombre de colonnes : on garde la même première fiche à l'écran
  const surChangement = () => {
    const nouvelle = parPage();
    if (nouvelle === taille) return;
    page = Math.floor(((page - 1) * taille) / nouvelle) + 1;
    taille = nouvelle;
    rendre(false);
  };
  mqGrand.addEventListener('change', surChangement);
  mqMoyen.addEventListener('change', surChangement);
  let attente = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(attente); attente = requestAnimationFrame(mesurer); });

  rendre(false);
}

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
Nom : ${nom}
Activité : ${metier}
Territoire : ${terr}${projet ? `
Projet : ${projet}` : ''}
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
  const body = `${message}\n\n${nom}\n${email}`;
  location.href = `mailto:${KSN_EMAIL}?subject=${encodeURIComponent('Contact KSN : ' + sujet)}&body=${encodeURIComponent(body)}`;
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

// Compteurs animés : chiffres clés ("+180", "3", "~8 000", "15") et compteur d'annuaire (page Le réseau)
function countUp(statEl) {
  const b = statEl.querySelector('b');
  if (!b || b.dataset.done) return;
  b.dataset.done = '1';
  // « +180 », « 15 », « ~8 000 » : préfixe, nombre (espace des milliers permise), suffixe
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
