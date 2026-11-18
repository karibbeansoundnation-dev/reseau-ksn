// ============================================================
// KSN — scripts du site (navigation, formulaires, cartes à faire glisser)
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

// Recherche dans l'annuaire (page réseau) : sans accents ni majuscules
const search = document.getElementById('f-search');
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function filtre() {
  const q = norm(search?.value || '').trim();
  let n = 0;
  document.querySelectorAll('.membre-card').forEach(c => {
    const ok = !q || norm(c.textContent).includes(q);
    c.style.display = ok ? '' : 'none';
    if (ok) n++;
  });
  const compte = document.getElementById('f-count');
  if (compte) compte.textContent = n + (n > 1 ? ' membres' : ' membre');
  const vide = document.getElementById('f-empty');
  if (vide) vide.hidden = n > 0;
}
search?.addEventListener('input', filtre);

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

