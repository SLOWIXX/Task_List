
const TEMPLATES_DIR = 'components';
const PATH_MODAL = `${TEMPLATES_DIR}/modal.html`;
const PATH_ITEM = `${TEMPLATES_DIR}/task-item.html`;

let modalTemplate = null;
let itemTemplate = null;

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  modalTemplate = await loadTemplate(PATH_MODAL, fallbackModal());
  itemTemplate  = await loadTemplate(PATH_ITEM, fallbackItem());

  const btnAjouter = document.getElementById('ajouter-tache-btn');
  btnAjouter?.addEventListener('click', afficherDialogAjout);

  const liste = document.getElementById('liste-taches');
  liste.addEventListener('click', onListeClick);
  liste.addEventListener('change', onListeChange);

  chargerTaches();
}

async function loadTemplate(path, fallback) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error('fetch failed');
    return await r.text();
  } catch {
    return fallback;
  }
}

function lireTaches() {
  return JSON.parse(localStorage.getItem('mes_taches') || '[]');
}
function ecrireTaches(taches) {
  localStorage.setItem('mes_taches', JSON.stringify(taches));
}
function ajouterTacheObjet(t) {
  const arr = lireTaches();
  arr.push(t);
  ecrireTaches(arr);
}
function supprimerTacheParId(id) {
  const arr = lireTaches().filter(x => x.id !== id);
  ecrireTaches(arr);
}

function chargerTaches() {
  const arr = lireTaches();
  const ul = document.getElementById('liste-taches');
  ul.innerHTML = '';
  arr.forEach(t => ul.appendChild(rendreTache(t)));
}

function rendreTache(tache) {
  const tpl = document.createElement('template');
  tpl.innerHTML = itemTemplate.trim();
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = tache.id;
  node.querySelector('.titre').textContent = tache.titre;
  const details = node.querySelector('.details');
  if (details) {
    details.textContent = tache.details || '';
    details.style.display = tache.details ? '' : 'none';
  }
  const etat = node.querySelector('.etat');
  if (etat) etat.checked = !!tache.fait;
  if (tache.fait) node.classList.add('fini');
  return node;
}

function afficherDialogAjout() {
  if (document.querySelector('.dialog-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = modalTemplate;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('#forme-nouvelle-tache');
  const annuler = overlay.querySelector('#annuler-btn');

  annuler?.addEventListener('click', () => fermerDialog(overlay));
  overlay.addEventListener('click', (ev) => { if (ev.target === overlay) fermerDialog(overlay); });
  document.addEventListener('keydown', onEsc);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const titre = (fd.get('titre') || '').toString().trim();
    const details = (fd.get('details') || '').toString().trim();
    if (!titre) return;
    const tache = { id: Date.now().toString(), titre, details, fait: false };
    ajouterTacheObjet(tache);
    document.getElementById('liste-taches').appendChild(rendreTache(tache));
    fermerDialog(overlay);
    form.reset();
  });
}

function fermerDialog(overlay) {
  if (!overlay) overlay = document.querySelector('.dialog-overlay');
  if (!overlay) return;
  overlay.remove();
  document.removeEventListener('keydown', onEsc);
}
function onEsc(e) { if (e.key === 'Escape') fermerDialog(); }

function onListeClick(e) {
  const btnSuppr = e.target.closest('.supprimer');
  if (btnSuppr) {
    const li = btnSuppr.closest('.tache');
    if (!li) return;
    supprimerTacheParId(li.dataset.id);
    li.remove();
    return;
  }

  const btnEdit = e.target.closest('.modifier');
  if (btnEdit) {
    const li = btnEdit.closest('.tache');
    if (!li) return;
    demarrerEditionInline(li);
  }
}

function demarrerEditionInline(li) {
  if (document.querySelector('.tache[data-editing="1"]')) return;
  li.dataset.editing = '1';

  const id = li.dataset.id;
  const titreEl = li.querySelector('.titre');
  const detailsEl = li.querySelector('.details');

  const valeurTitre = titreEl ? titreEl.textContent : '';
  const valeurDetails = detailsEl ? detailsEl.textContent : '';

  const form = document.createElement('form');
  form.className = 'edition-inline';
  form.innerHTML = `
    <div style="flex:1;min-width:0">
      <input name="titre" type="text" value="${escapeHtml(valeurTitre)}" required maxlength="120" style="width:100%;padding:8px;border-radius:8px;margin-bottom:6px" />
      <textarea name="details" rows="2" style="width:100%;padding:8px;border-radius:8px">${escapeHtml(valeurDetails)}</textarea>
    </div>
    <div class="boutons" style="margin-left:8px;display:flex;flex-direction:column;gap:6px">
      <button type="submit" class="sauver" title="Sauver" style="padding:6px 8px;border-radius:8px">✔️</button>
      <button type="button" class="annuler-edition" title="Annuler" style="padding:6px 8px;border-radius:8px">✖️</button>
    </div>
  `;

  const corps = li.querySelector('.corps');
  const boutons = li.querySelector('.boutons');
  if (corps) corps.style.display = 'none';
  if (boutons) boutons.style.display = 'none';
  li.appendChild(form);

  const annulerBtn = form.querySelector('.annuler-edition');
  annulerBtn.addEventListener('click', () => terminerEdition(li, false));

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const nvTitre = (fd.get('titre') || '').toString().trim();
    const nvDetails = (fd.get('details') || '').toString().trim();
    if (!nvTitre) return; 

    const taches = lireTaches();
    const t = taches.find(x => x.id === id);
    if (t) {
      t.titre = nvTitre;
      t.details = nvDetails;
      ecrireTaches(taches);
    }


    if (titreEl) titreEl.textContent = nvTitre;
    if (detailsEl) {
      detailsEl.textContent = nvDetails;
      detailsEl.style.display = nvDetails ? '' : 'none';
    }

    terminerEdition(li, true);
  });

  const onKey = (ev) => {
    if (ev.key === 'Escape') {
      terminerEdition(li, false);
    }
  };
  document.addEventListener('keydown', onKey);

  li._edition_cleanup = () => {
    document.removeEventListener('keydown', onKey);
  };
}
function terminerEdition(li, saved) {
  const form = li.querySelector('.edition-inline');
  const corps = li.querySelector('.corps');
  const boutons = li.querySelector('.boutons');
  if (form) form.remove();
  if (corps) corps.style.display = '';
  if (boutons) boutons.style.display = '';

  if (li._edition_cleanup) {
    try { li._edition_cleanup(); } catch {}
    li._edition_cleanup = null;
  }
  delete li.dataset.editing;
}

function onListeChange(e) {
  const cb = e.target.closest('.etat');
  if (!cb) return;
  const li = cb.closest('.tache');
  if (!li) return;
  const id = li.dataset.id;
  const arr = lireTaches();
  const t = arr.find(x => x.id === id);
  if (t) { t.fait = cb.checked; ecrireTaches(arr); }
  li.classList.toggle('fini', cb.checked);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fallbackModal() {
  return `
  <div class="modal">
    <div class="modal-body">
      <h3>Ajouter une tâche</h3>
      <form id="forme-nouvelle-tache">
        <label class="champ"><span>Titre</span><input name="titre" type="text" required maxlength="120"/></label>
        <label class="champ"><span>Détails</span><textarea name="details" rows="3"></textarea></label>
        <div class="actions-modal">
          <button type="submit" class="btn-primaire">Ajouter</button>
          <button type="button" id="annuler-btn">Annuler</button>
        </div>
      </form>
    </div>
  </div>`;
}

function fallbackItem() {
  return `
  <li class="tache">
    <label class="gauche"><input type="checkbox" class="etat"/></label>
    <div class="corps">
      <div class="titre"></div>
      <div class="details"></div>
    </div>
    <div class="boutons">
      <button type="button" class="modifier" title="Modifier">✏️</button>
      <button type="button" class="supprimer" title="Supprimer">🗑️</button>
    </div>
  </li>`;
}