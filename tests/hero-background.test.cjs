const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../templates/index.html'), 'utf8');
const source = html.match(/<script th:unless="\$\{hasApi\}">([\s\S]*?)<\/script>/)[1];

function setup({ frameCallback = true, dark = 'dark.mp4', light = 'light.mp4' } = {}) {
  const timers = new Map();
  let timerId = 0;
  class Media {
    constructor(attributes = {}) {
      this.attributes = { ...attributes };
      this.style = {};
      this.events = new Map();
      this.classes = new Set();
      this.classList = {
        add: (name) => this.classes.add(name),
        remove: (name) => this.classes.delete(name),
        contains: (name) => this.classes.has(name),
      };
      this.readyState = 0;
      this.paused = true;
      this.frames = new Map();
      this.frameId = 0;
      if (frameCallback) {
        this.requestVideoFrameCallback = (callback) => {
          this.frames.set(++this.frameId, callback);
          return this.frameId;
        };
        this.cancelVideoFrameCallback = (id) => this.frames.delete(id);
      }
    }
    getAttribute(key) { return this.attributes[key] || null; }
    setAttribute(key, value) { this.attributes[key] = value; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(type, fn) {
      if (!this.events.has(type)) this.events.set(type, new Set());
      this.events.get(type).add(fn);
    }
    removeEventListener(type, fn) { this.events.get(type)?.delete(fn); }
    emit(type) { for (const fn of [...(this.events.get(type) || [])]) fn(); }
    load() { this.readyState = 0; }
    play() { this.paused = false; return this.rejectPlay ? Promise.reject(Error('blocked')) : Promise.resolve(); }
    pause() { this.paused = true; }
    ready() { this.readyState = 2; this.emit('loadeddata'); }
    frame() { const callbacks = [...this.frames.values()]; this.frames.clear(); callbacks.forEach((fn) => fn()); }
  }
  const img = new Media({ 'data-dark': dark, 'data-light': light,
    'data-default-dark': 'default-dark.webp', 'data-default-light': 'default-light.webp',
    'data-poster-dark': 'poster-dark.webp', 'data-poster-light': 'poster-light.webp' });
  const primary = new Media(), secondary = new Media(), root = new Media({ 'data-theme': 'dark' });
  const handlers = {};
  const window = { innerWidth: 1000, matchMedia: () => ({ matches: window.innerWidth <= 768 }),
    addEventListener: (type, fn) => { handlers[type] = fn; }, removeEventListener: () => {} };
  const elements = { '.hero-bg-theme-img': img, '.hero-bg-theme-video': primary,
    '.hero-bg-video-primary': primary, '.hero-bg-video-secondary': secondary };
  const context = { document: { documentElement: root, querySelector: (selector) => elements[selector] }, window,
    MutationObserver: class { constructor(fn) { this.fn = fn; } observe() {} disconnect() {} },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; }, clearTimeout: (id) => timers.delete(id) };
  vm.runInNewContext(source, context);
  return { img, primary, secondary, root, window,
    theme: (theme) => { root.setAttribute('data-theme', theme); window.__homeThemeBgObserver.fn([{ attributeName: 'data-theme' }]); },
    resize: (width) => { window.innerWidth = width; handlers.resize(); },
    flush: () => { const jobs = [...timers.values()]; timers.clear(); jobs.forEach((fn) => fn()); } };
}

test('first video keeps the matching poster until a decoded frame is presented', () => {
  const s = setup();
  assert.equal(s.img.getAttribute('src'), 'poster-dark.webp');
  assert.equal(s.secondary.getAttribute('poster'), 'poster-dark.webp');
  assert.equal(s.secondary.style.display, 'block');
  assert.equal(s.secondary.style.opacity, '0');
  s.secondary.ready();
  assert.equal(s.secondary.style.opacity, '0');
  s.secondary.frame();
  assert.equal(s.secondary.style.opacity, '1');
  assert.equal(s.img.style.display, 'block');
});

test('theme switch keeps the old video until the new frame, then pauses the old video only', () => {
  const s = setup();
  s.secondary.ready(); s.secondary.frame(); s.flush();
  s.theme('light');
  assert.equal(s.secondary.style.opacity, '1');
  assert.equal(s.primary.style.opacity, '0');
  assert.equal(s.primary.getAttribute('poster'), 'poster-light.webp');
  s.primary.ready(); s.primary.frame(); s.flush();
  assert.equal(s.primary.style.display, 'block');
  assert.equal(s.primary.paused, false);
  assert.equal(s.secondary.paused, true);
});

test('rapid theme reversal cancels stale frame callbacks and keeps the current video', () => {
  const s = setup();
  s.secondary.ready(); s.secondary.frame(); s.flush();
  s.theme('light'); s.primary.ready();
  const stale = [...s.primary.frames.values()][0];
  s.theme('dark'); stale(); s.flush();
  assert.equal(s.secondary.style.opacity, '1');
  assert.equal(s.secondary.paused, false);
  assert.equal(s.primary.style.display, 'none');
});

test('load error falls back to the current poster, then a failed poster falls back to the bundled image', () => {
  const s = setup();
  s.secondary.emit('error');
  assert.equal(s.img.getAttribute('src'), 'poster-dark.webp');
  assert.equal(s.secondary.style.display, 'none');
  s.img.emit('error');
  assert.equal(s.img.getAttribute('src'), 'default-dark.webp');
});

test('play rejection keeps a poster with and without frame callback support', async () => {
  for (const frameCallback of [true, false]) {
    const s = setup({ frameCallback });
    s.secondary.rejectPlay = true; s.secondary.ready();
    await Promise.resolve();
    assert.equal(s.img.getAttribute('src'), 'poster-dark.webp');
    assert.equal(s.secondary.style.display, 'none');
  }
});

test('browsers without frame callbacks switch on loadeddata', () => {
  const s = setup({ frameCallback: false });
  s.secondary.ready(); s.flush();
  assert.equal(s.secondary.style.opacity, '1');
  assert.equal(s.secondary.paused, false);
});

test('mobile video override and image-only theme retain the intended sources', () => {
  const s = setup({ light: 'light-image.webp' });
  s.img.setAttribute('data-mobile-dark', 'mobile.webm?version=1');
  s.resize(600);
  assert.equal(s.secondary.getAttribute('src'), 'mobile.webm?version=1');
  s.theme('light');
  assert.equal(s.img.getAttribute('src'), 'light-image.webp');
  assert.equal(s.secondary.style.display, 'none');
  assert.equal(s.primary.getAttribute('src'), null);
});

test('missing poster values use the bundled theme wallpaper', () => {
  const s = setup();
  s.img.removeAttribute('data-poster-light');
  s.theme('light');
  assert.equal(s.img.getAttribute('src'), 'default-light.webp');
  assert.equal(s.secondary.getAttribute('poster'), 'default-light.webp');
});

test('scroll opacity belongs to the container and does not reveal the pending video', () => {
  const main = fs.readFileSync(path.join(__dirname, '../templates/assets/js/main.js'), 'utf8');
  const fn = main.slice(main.indexOf('function initHeroBackground()'), main.indexOf('function initBackToTop()'));
  const media = [{ style: { opacity: '0' } }, { style: { opacity: '1' } }];
  const background = { style: {}, querySelectorAll: () => media };
  vm.runInNewContext(fn + '\ninitHeroBackground();', {
    document: { querySelector: () => background },
    window: { pageYOffset: 500, innerHeight: 1000 }, addPageScrollListener: () => {},
  });
  assert.equal(background.style.opacity, 0.5);
  assert.deepEqual(media.map((item) => item.style.opacity), ['0', '1']);
  assert.equal(media[0].style.filter, 'blur(10px)');
});
