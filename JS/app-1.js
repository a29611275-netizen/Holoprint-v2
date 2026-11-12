/**
 * HoloPrint+ main app logic
 */

// ---------- Navigation ----------
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });

  // close mobile menu
  document.getElementById('navLinks').classList.remove('open');

  if (pageId === 'structures') renderStructuresPage();
  if (pageId === 'create') refreshStructureSelect();
}

document.querySelectorAll('[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showPage(link.dataset.page);
  });
});

document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// ---------- Upload ----------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileListEl = document.getElementById('fileList');
const uploadMsg = document.getElementById('uploadMsg');
const uploadProgress = document.getElementById('uploadProgress');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
  fileInput.value = '';
});

async function handleFiles(fileList) {
  if (!fileList || !fileList.length) return;
  uploadMsg.textContent = '';
  uploadMsg.className = 'msg';
  uploadProgress.classList.remove('hidden');
  const fill = uploadProgress.querySelector('.progress-fill');
  fill.style.width = '10%';

  let added = 0;
  const total = fileList.length;
  for (let i = 0; i < total; i++) {
    const file = fileList[i];
    const res = StructureStore.add(file);
    if (res.ok) {
      try {
        await StructureStore.loadBuffer(res.item);
        added++;
      } catch (err) {
        StructureStore.remove(res.item.id);
        console.warn(err);
      }
    } else {
      uploadMsg.textContent = res.error;
      uploadMsg.className = 'msg error';
    }
    fill.style.width = Math.round(((i + 1) / total) * 100) + '%';
  }

  setTimeout(() => {
    uploadProgress.classList.add('hidden');
    fill.style.width = '0%';
  }, 400);

  if (added) {
    uploadMsg.textContent = `Added ${added} structure(s)`;
    uploadMsg.className = 'msg success';
  }
  renderFileList();
  refreshStructureSelect();
  updateGenerateState();
}

function renderFileList() {
  fileListEl.innerHTML = '';
  StructureStore.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <span class="name" title="${item.name}">${item.displayName}</span>
      <span class="size">${StructureStore.formatSize(item.size)}</span>
      <div class="actions">
        <button title="Rename" data-act="rename" data-id="${item.id}">✏️</button>
        <button class="danger" title="Remove" data-act="remove" data-id="${item.id}">🗑️</button>
      </div>
    `;
    fileListEl.appendChild(div);
  });

  fileListEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (btn.dataset.act === 'remove') {
        StructureStore.remove(id);
        renderFileList();
        refreshStructureSelect();
        updateGenerateState();
      } else if (btn.dataset.act === 'rename') {
        const item = StructureStore.get(id);
        const newName = prompt('New display name:', item.displayName);
        if (newName !== null) {
          StructureStore.rename(id, newName);
          renderFileList();
          refreshStructureSelect();
        }
      }
    });
  });
}

function refreshStructureSelect() {
  const sel = document.getElementById('structureSelect');
  const current = sel.value;
  sel.innerHTML = '<option value="">-- Select structure --</option>';
  StructureStore.items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.displayName;
    sel.appendChild(opt);
  });
  if (current && StructureStore.get(current)) sel.value = current;
  updateStructId();
  updatePreview();
}

document.getElementById('structureSelect').addEventListener('change', () => {
  updateStructId();
  updatePreview();
  updateGenerateState();
});

function updateStructId() {
  const id = document.getElementById('structureSelect').value;
  const item = StructureStore.get(id);
  const safe = item ? PackGenerator.sanitizeName(item.displayName) : '';
  document.getElementById('structId').value = item ? `holoprint:${safe}` : '';
}

// ---------- Preview ----------
function updatePreview() {
  const box = document.getElementById('packPreview');
  const packName = document.getElementById('packName').value.trim() || 'My Structure Pack';
  const id = document.getElementById('structureSelect').value;
  const item = StructureStore.get(id);
  if (!item) {
    box.innerHTML = '<p class="muted">Upload a structure and select it to see pack preview.</p>';
    return;
  }
  const ox = document.getElementById('offsetX').value;
  const oy = document.getElementById('offsetY').value;
  const oz = document.getElementById('offsetZ').value;
  const rot = document.getElementById('rotation').value;
  box.innerHTML = `
    <div class="row"><span class="label">Pack</span><span>${escapeHtml(packName)}</span></div>
    <div class="row"><span class="label">Structure</span><span>${escapeHtml(item.displayName)}</span></div>
    <div class="row"><span class="label">ID</span><span>holoprint:${PackGenerator.sanitizeName(item.displayName)}</span></div>
    <div class="row"><span class="label">Offset</span><span>${ox}, ${oy}, ${oz}</span></div>
    <div class="row"><span class="label">Rotation</span><span>${rot}</span></div>
    <div class="row"><span class="label">Files in pack</span><span>${StructureStore.items.length} structure(s) + script</span></div>
    <div class="row"><span class="label">Trigger</span><span>Armor Stand + Netherite Ingot</span></div>
  `;
}

['packName', 'packDesc', 'offsetX', 'offsetY', 'offsetZ', 'rotation'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updatePreview);
});

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---------- Generate ----------
function updateGenerateState() {
  const btn = document.getElementById('generateBtn');
  const hasStruct = !!document.getElementById('structureSelect').value;
  btn.disabled = !hasStruct || StructureStore.items.length === 0;
}

document.getElementById('generateBtn').addEventListener('click', async () => {
  const genMsg = document.getElementById('genMsg');
  const downloadArea = document.getElementById('downloadArea');
  genMsg.textContent = 'Generating pack...';
  genMsg.className = 'msg info';
  downloadArea.classList.add('hidden');
  downloadArea.innerHTML = '';

  const primaryId = document.getElementById('structureSelect').value;
  const primary = StructureStore.get(primaryId);
  if (!primary) {
    genMsg.textContent = 'Select a structure first';
    genMsg.className = 'msg error';
    return;
  }

  let iconBuffer = null;
  const iconInput = document.getElementById('iconInput');
  if (iconInput.files && iconInput.files[0]) {
    iconBuffer = await iconInput.files[0].arrayBuffer();
  }

  try {
    // Ensure all buffers loaded
    for (const s of StructureStore.items) {
      await StructureStore.loadBuffer(s);
    }

    const result = await PackGenerator.generateMcpack({
      structures: StructureStore.items,
      primaryStructure: primary,
      packName: document.getElementById('packName').value.trim() || 'HoloPrint Plus Pack',
      description: document.getElementById('packDesc').value.trim(),
      offsetX: document.getElementById('offsetX').value,
      offsetY: document.getElementById('offsetY').value,
      offsetZ: document.getElementById('offsetZ').value,
      rotation: document.getElementById('rotation').value,
      iconBuffer
    });

    const url = URL.createObjectURL(result.blob);
    downloadArea.innerHTML = `
      <p>✅ Pack ready!</p>
      <a href="${url}" download="${result.filename}">⬇ Download ${result.filename}</a>
      <p class="muted" style="margin-top:0.5rem;font-size:0.85rem">Structure ID: ${result.structureId}</p>
    `;
    downloadArea.classList.remove('hidden');
    genMsg.textContent = 'Done! Import the .mcpack into Minecraft and enable Beta APIs.';
    genMsg.className = 'msg success';
  } catch (err) {
    console.error(err);
    genMsg.textContent = 'Error: ' + (err.message || err);
    genMsg.className = 'msg error';
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear all uploaded structures?')) return;
  StructureStore.clear();
  renderFileList();
  refreshStructureSelect();
  updateGenerateState();
  document.getElementById('downloadArea').classList.add('hidden');
  document.getElementById('genMsg').textContent = '';
  uploadMsg.textContent = '';
});

// ---------- Structures page ----------
function renderStructuresPage() {
  const el = document.getElementById('structuresTable');
  if (!StructureStore.items.length) {
    el.innerHTML = '<p class="muted">No structures uploaded yet. Go to Create Pack to upload.</p>';
    return;
  }
  el.innerHTML = StructureStore.items.map(item => `
    <div class="item">
      <div>
        <strong>${escapeHtml(item.displayName)}</strong><br>
        <span class="muted" style="font-size:0.85rem">${escapeHtml(item.name)} · ${StructureStore.formatSize(item.size)}</span>
      </div>
      <span class="muted">holoprint:${PackGenerator.sanitizeName(item.displayName)}</span>
    </div>
  `).join('');
}

// ---------- Copy buttons ----------
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const code = document.getElementById(btn.dataset.copy);
    if (code) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        const old = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = old, 1200);
      });
    }
  });
});

// Init
updateGenerateState();
showPage('home');
