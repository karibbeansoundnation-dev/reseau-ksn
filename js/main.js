// ============================================================
// KSN — scripts du site (navigation, formulaires, cartes à faire glisser)
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

// Annuaire (page réseau) : recherche, filtres origine et secteur, pages de 5 membres.
// Sans JavaScript, toute la liste reste affichée.
const annuaire = document.querySelector('.annuaire');
if (annuaire) {
  const PAR_PAGE = 5;
  const cartes = [...annuaire.querySelectorAll('.membre-card')];
  const fSearch = document.getElementById('f-search');
  const fOrigine = document.getElementById('f-origine');
  const fSecteur = document.getElementById('f-secteur');
  const compte = document.getElementById('f-count');
  const vide = document.getElementById('f-empty');
  const pager = document.getElementById('pager');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let page = 1;

  const correspond = (c, q, o, s) =>
    (!q || norm(c.textContent).includes(q)) &&
    (!o || c.dataset.origines.split('|').includes(o)) &&
    (!s || c.dataset.secteurs.split('|').includes(s));

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

  function rendre(defiler) {
    const q = norm(fSearch?.value || '').trim();
    const o = fOrigine?.value || '', s = fSecteur?.value || '';
    const trouvees = cartes.filter((c) => correspond(c, q, o, s));
    const pages = Math.max(1, Math.ceil(trouvees.length / PAR_PAGE));
    page = Math.min(Math.max(page, 1), pages);
    const debut = (page - 1) * PAR_PAGE;
    const visibles = new Set(trouvees.slice(debut, debut + PAR_PAGE));
    cartes.forEach((c) => { c.hidden = !visibles.has(c); });

    const n = trouvees.length;
    if (compte) compte.textContent = n + (n > 1 ? ' membres' : ' membre');
    if (vide) vide.hidden = n > 0;

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
    if (defiler) document.getElementById('f-search')?.closest('.filters')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  [fSearch, fOrigine, fSecteur].forEach((el) => el?.addEventListener('input', () => { page = 1; rendre(false); }));
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

