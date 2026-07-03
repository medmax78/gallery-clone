/* ── Vessel accordion ─────────────────────────────────────── */
function toggleVessel(id) {
  const body = document.getElementById('vbody-' + id);
  if (body) body.classList.toggle('open');
}

/* ── Modals ───────────────────────────────────────────────── */
function promptRename(id, name) {
  document.getElementById('rename-id').value   = id;
  document.getElementById('rename-name').value = name;
  openModal('rename-modal');
}
function confirmDelete(id, name) {
  document.getElementById('delete-id').value  = id;
  document.getElementById('delete-msg').textContent =
    'Delete "' + name + '" and ALL its photos? This cannot be undone.';
  openModal('delete-modal');
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
});

/* ── Staged upload queue ──────────────────────────────────── */
const stagedQueues = {};   // vesselId -> [{file, preview, date}]

async function readExifDate(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const view = new DataView(e.target.result);
      if (view.getUint16(0, false) !== 0xFFD8) return resolve(null);
      let offset = 2;
      while (offset < view.byteLength) {
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) {
          const exif = e.target.result.slice(offset + 2, offset + 2 + view.getUint16(offset, false) - 2);
          try {
            const str   = String.fromCharCode(...new Uint8Array(exif));
            const match = str.match(/(\d{4}):(\d{2}):(\d{2})/);
            if (match) return resolve(match[1] + '-' + match[2] + '-' + match[3]);
          } catch {}
          return resolve(null);
        }
        if ((marker & 0xFF00) !== 0xFF00) break;
        offset += view.getUint16(offset, false);
      }
      resolve(null);
    };
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function stageFiles(files, vesselId, vesselName) {
  if (!stagedQueues[vesselId]) stagedQueues[vesselId] = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const preview = URL.createObjectURL(file);
    const exif    = await readExifDate(file);
    stagedQueues[vesselId].push({ file, preview, date: exif || today() });
  }
  renderStaged(vesselId);
}

function handleDrop(event, vesselId, vesselName) {
  event.preventDefault();
  document.getElementById('drop-' + vesselId).classList.remove('dragover');
  stageFiles(event.dataTransfer.files, vesselId, vesselName);
}

function renderStaged(vesselId) {
  const queue   = stagedQueues[vesselId] || [];
  const grid    = document.getElementById('staged-' + vesselId);
  const btnWrap = document.getElementById('upload-btn-' + vesselId);
  if (!grid) return;

  if (!queue.length) {
    grid.innerHTML    = '';
    btnWrap.style.display = 'none';
    return;
  }

  btnWrap.style.display = 'block';
  grid.innerHTML = queue.map((item, i) => `
    <div class="staged-item" id="staged-item-${vesselId}-${i}">
      <img src="${item.preview}" alt="">
      <div class="staged-meta">
        <label>Date (EXIF)</label>
        <input type="date" value="${item.date}"
               onchange="stagedQueues['${vesselId}'][${i}].date = this.value">
      </div>
      <button class="staged-remove" onclick="removeStaged('${vesselId}',${i})">Remove</button>
    </div>
  `).join('');
}

function removeStaged(vesselId, index) {
  stagedQueues[vesselId].splice(index, 1);
  renderStaged(vesselId);
}

function clearStaged(vesselId) {
  stagedQueues[vesselId] = [];
  renderStaged(vesselId);
  document.getElementById('file-' + vesselId).value = '';
}

async function uploadStaged(vesselId, vesselName) {
  const queue = stagedQueues[vesselId];
  if (!queue || !queue.length) return;

  const btn = document.querySelector(`#upload-btn-${vesselId} .btn-gold`);
  btn.textContent = 'Uploading...';
  btn.disabled    = true;

  for (const item of queue) {
    const form = new FormData();
    form.append('file',        item.file);
    form.append('vesselName',  vesselName);
    form.append('date',        item.date);
    await fetch('/api/upload.php', { method: 'POST', body: form });
  }

  clearStaged(vesselId);
  window.location.href = '/admin/?tab=vessels&vid=' + vesselId;
}

/* ── Vessel thumbnail upload ──────────────────────────────── */
async function uploadThumb(vesselId, vesselName, input) {
  const file = input.files[0];
  if (!file) return;
  const thumb = document.getElementById('thumb-' + vesselId);
  if (thumb) thumb.style.opacity = '.5';

  const form = new FormData();
  form.append('file',        file);
  form.append('vesselName',  vesselName);
  form.append('isThumbnail', '1');
  form.append('vesselId',    vesselId);

  const res  = await fetch('/api/upload.php', { method: 'POST', body: form });
  const data = await res.json();

  if (data.path && thumb) {
    thumb.src = data.path + '?t=' + Date.now();
    thumb.style.opacity = '1';
  }
  input.value = '';
}
