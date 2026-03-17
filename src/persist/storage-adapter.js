// Abstract storage interface + localStorage implementation.
// All persistence goes through this adapter. Godot port swaps implementation.

export class LocalStorageAdapter {
  constructor(namespace = "scoundrel") {
    this.namespace = namespace;
  }

  _key(key) {
    return `${this.namespace}:${key}`;
  }

  save(key, data) {
    localStorage.setItem(this._key(key), JSON.stringify(data));
  }

  load(key) {
    const raw = localStorage.getItem(this._key(key));
    return raw ? JSON.parse(raw) : null;
  }

  delete(key) {
    localStorage.removeItem(this._key(key));
  }

  listKeys(prefix = "") {
    const full = this._key(prefix);
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(full)) {
        results.push(k.slice(this.namespace.length + 1));
      }
    }
    return results;
  }

  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(this.namespace + ":")) {
        const shortKey = k.slice(this.namespace.length + 1);
        data[shortKey] = JSON.parse(localStorage.getItem(k));
      }
    }
    return data;
  }

  importAll(data) {
    for (const [key, value] of Object.entries(data)) {
      this.save(key, value);
    }
  }
}
