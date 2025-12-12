// Simple storage abstraction for localStorage
window.storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};
