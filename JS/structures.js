/**
 * Structures store - holds uploaded .mcstructure files in memory
 */
const StructureStore = {
  items: [], // { id, name, size, file, buffer, displayName }

  add(file) {
    if (!file.name.toLowerCase().endsWith('.mcstructure')) {
      return { ok: false, error: 'Only .mcstructure files allowed' };
    }
    if (this.items.some(i => i.name === file.name && i.size === file.size)) {
      return { ok: false, error: 'File already added' };
    }
    const id = 'struct_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const item = {
      id,
      name: file.name,
      displayName: file.name.replace(/\.mcstructure$/i, ''),
      size: file.size,
      file,
      buffer: null
    };
    this.items.push(item);
    return { ok: true, item };
  },

  async loadBuffer(item) {
    if (item.buffer) return item.buffer;
    item.buffer = await item.file.arrayBuffer();
    return item.buffer;
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
  },

  rename(id, newName) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.displayName = newName.trim() || item.displayName;
    }
  },

  get(id) {
    return this.items.find(i => i.id === id);
  },

  clear() {
    this.items = [];
  },

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
};
