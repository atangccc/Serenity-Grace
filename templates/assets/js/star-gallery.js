/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-09-06 17:19:05
 * Fingerprint: aadec520d901c075
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-08-31 17:36:31
 * Fingerprint: 897f796e1b7f0d91
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-07-05 00:01:15
 * Fingerprint: 1a93cc3686d739b8
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

﻿/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-27 20:58:48
 * Fingerprint: 057d2ea289d80a0c
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-27 20:40:02
 * Fingerprint: b4865150106d4433
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

(function () {
  if (typeof window.__SERENITY_STAR_GALLERY_CLEANUP__ === 'function') {
    window.__SERENITY_STAR_GALLERY_CLEANUP__();
  }

  const defaultLogo = '/themes/theme-Serenity/assets/public/logo.webp';
  const avatarFallbackSvg = '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M938.666667 512v307.456a73.685333 73.685333 0 0 1-106.666667 65.877333 123.349333 123.349333 0 0 0-123.562667 7.68 123.392 123.392 0 0 1-136.874666 0l-15.061334-9.984a80.256 80.256 0 0 0-89.002666 0l-15.061334 10.026667a123.392 123.392 0 0 1-136.874666 0 123.349333 123.349333 0 0 0-123.605334-7.68A73.685333 73.685333 0 0 1 85.333333 819.413333V512C85.333333 276.352 276.352 85.333333 512 85.333333s426.666667 191.018667 426.666667 426.666667zM403.072 614.314667a32 32 0 1 0-38.144 51.370666A246.016 246.016 0 0 0 512 714.666667a246.016 246.016 0 0 0 147.072-48.981334 32 32 0 1 0-38.144-51.370666A182.058667 182.058667 0 0 1 512 650.666667a182.058667 182.058667 0 0 1-108.928-36.352zM682.666667 405.333333c0-35.328-19.114667-64-42.666667-64s-42.666667 28.672-42.666667 64 19.114667 64 42.666667 64 42.666667-28.672 42.666667-64zM384 469.333333c23.552 0 42.666667-28.672 42.666667-64S407.552 341.333333 384 341.333333s-42.666667 28.672-42.666667 64 19.114667 64 42.666667 64z"/></svg>';
  const defaultBio = '行走在数字荒原的观测者，试图用文字与代码在万物互联的宇宙里锚定一片宁静星域。专注于前端美学、极简主义设计与去中心化星链网络探索。';
  const statusEndpoint = '/apis/anonymous.astrahub.halo.run/v1alpha1/star-gallery/-/status';
  const snapshotEndpoint = '/apis/anonymous.astrahub.halo.run/v1alpha1/star-gallery/-/snapshot';
  const snapshotWsPath = '/apis/anonymous.astrahub.halo.run/v1alpha1/astrahub/ws/star-gallery';

  const fallbackData = {
    available: false,
    profile: {
      siteName: '',
      avatarUrl: defaultLogo,
      siteUrl: '/',
      bio: '',
      constellation: '',
      nodeSlug: '',
      routeCoordinate: '',
      planetSlot: 'Slot: -',
      rssStatus: 'pending',
      onlineStatus: 'offline',
      lastSyncTime: '等待同步',
      publicKeyMasked: '-',
      relationCount: 0,
    },
    sectors: [],
    posts: [],
  };

  let currentSectors = [];
  let currentPosts = [];
  let modalEl = null;
  let sectorModalKeydownHandler = null;
  let sectorBubbleFrame = 0;
  let sectorBubbleSimulation = null;
  let sectorBubbleResizeHandler = null;
  let activeSectorBubbleDrag = null;
  let lastSectorRenderKey = '';
  let activeDisplayMode = '';
  let snapshotSocket = null;
  let sectorModeObserver = null;
  let destroyed = false;
  let sectorPlanetPager = null;
  const sectorPlanetPageSize = 24;
  const sectorBubbleBounds = {
    left: 30,
    right: 30,
    top: 18,
    bottom: 34,
  };

  function escapeHtml(value) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(value || '');
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '';
  }

  function renderBio(id, value) {
    const el = document.getElementById(id);
    const text = String(value || '').trim();
    const splitIndex = Math.min(30, text.length);
    if (!el) return;
    if (splitIndex > 0 && splitIndex < text.length) {
      el.innerHTML = `<span class="star-bio-line star-bio-line-primary">${escapeHtml(text.slice(0, splitIndex).trim())}</span><span class="star-bio-line star-bio-line-secondary">${escapeHtml(text.slice(splitIndex).trim())}</span>`;
    } else {
      el.textContent = text;
    }
  }

  function integer(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? Math.floor(number) : 0;
  }

  function sectorScoreText(item) {
    return `影响 ${formatScore(item.influence)} · 可信 ${formatScore(item.trust)} · 星球 ${integer(item.friendCount)} 个`;
  }

  function formatScore(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : '0.00';
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }
    return String(value).slice(0, 10).replaceAll('-', '/');
  }

  function relativeTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return '刚刚';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return formatDate(value);
  }

  function truncateText(value, limit) {
    const text = String(value || '').trim();
    const max = Number(limit || 0);
    if (!max || text.length <= max) return text;
    return `${text.slice(0, max)}...`;
  }

  function sectorDisplayName(name) {
    const value = String(name || '').trim();
    if (!value) return '';
    return value.endsWith('星系') ? value : `${value} 星系`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeDisplayMode(value) {
    const mode = String(value || '').trim();
    if (mode === 'stream') return 'flow';
    if (mode === 'orbit') return 'bubble';
    return ['bubble', 'flow', 'minimal'].includes(mode) ? mode : 'bubble';
  }

  function avatarFallbackMarkup(className, hidden) {
    return `<span class="${className}"${hidden ? ' hidden' : ''} aria-hidden="true">${avatarFallbackSvg}</span>`;
  }

  function avatarImageMarkup(src, alt, imageClass, fallbackClass) {
    const url = String(src || '').trim();
    const fallback = avatarFallbackMarkup(fallbackClass, Boolean(url));
    if (!url) return fallback;
    return `<img class="${imageClass}" src="${escapeHtml(url)}" alt="${escapeHtml(alt || '')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.hidden=true;if(this.nextElementSibling){this.nextElementSibling.hidden=false;}" />${fallback}`;
  }

  function bindAvatarFallback(img, fallback) {
    if (!img || !fallback) return;
    img.addEventListener('error', () => {
      img.hidden = true;
      fallback.hidden = false;
    }, { once: true });
  }

  function renderAvailability(available) {
    const root = document.getElementById('starGalleryRoot');
    const notice = document.getElementById('starPluginNotice');
    const state = available === 'loading' ? 'loading' : (available ? 'true' : 'false');
    if (root) root.dataset.available = state;
    if (notice) {
      const hidden = state !== 'false';
      notice.hidden = hidden;
      notice.classList.toggle('is-hidden', hidden);
    }
  }

  function renderProfile(profile, sectors, available) {
    const avatar = document.getElementById('starProfileAvatar');
    const link = document.getElementById('starSiteUrl');
    const relationCount = Number(profile.relationCount ?? sectors.length);

    if (avatar) {
      const profileAvatar = available ? (profile.avatarUrl || profile.nodeAvatar || profile.siteAvatarUrl || profile.logo || '') : defaultLogo;
      avatar.src = profileAvatar || defaultLogo;
      avatar.onerror = function () {
        this.onerror = null;
        this.src = defaultLogo;
      };
    }
    if (link) {
      link.textContent = '访问星系';
      link.href = profile.orbitUrl || profile.orbitURL || profile.hubOrbitUrl || profile.siteUrl || '#';
    }

    const displayName = available ? (profile.constellation || profile.siteName) : '';
    setText('starNodeStatus', displayName || '正在探测星系信号');
    renderBio('starSiteBio', available ? (profile.bio || defaultBio) : '正在接收信号');
    setText('starFriendCount', String(Number.isFinite(relationCount) ? relationCount : 0));
    setText('starPostCount', String(Number.isFinite(relationCount) ? relationCount : 0));
    setText('starConstellation', available ? (profile.constellation || profile.siteName || '正在探测') : '正在探测');
    setText('starNodeSlug', available ? (profile.nodeSlug || profile.siteName || '正在接收') : '正在接收');
    setText('starRouteCoordinate', profile.routeCoordinate || '');
    setText('starPlanetSlot', profile.planetSlot || 'Slot: -');
    setText('starRssStatus', profile.rssStatus || 'pending');
    setText('starPublicKey', profile.publicKeyMasked || '-');
  }

  function sectorCardMarkup(item) {
    return `
        <span class="star-sector-main">
          <span class="star-sector-avatar-wrap">
            ${avatarImageMarkup(item.avatar, sectorDisplayName(item.name), 'star-sector-avatar', 'star-sector-avatar star-sector-avatar-fallback')}
          </span>
          <span class="star-sector-body">
            <strong>${escapeHtml(sectorDisplayName(item.name))}</strong>
            <span class="star-sector-description">${escapeHtml(item.description || '')}</span>
          </span>
        </span>
        <span class="star-sector-footer">
          <span class="star-sector-score">${escapeHtml(sectorScoreText(item))}</span>
        </span>
    `;
  }

  function createSectorCard(item, index, extraClass) {
    const card = document.createElement('button');
    card.className = `star-sector-card${extraClass ? ` ${extraClass}` : ''}`;
    card.type = 'button';
    card.dataset.sectorIndex = String(index);
    card.innerHTML = sectorCardMarkup(item);
    card.addEventListener('click', () => openSectorModal(currentSectors[index]));
    return card;
  }

  function createSectorStreamPlaceholder(rowIndex, itemIndex) {
    const card = document.createElement('div');
    card.className = 'star-sector-card star-sector-stream-placeholder';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = `
      <span class="star-sector-main">
        <span class="star-sector-avatar star-sector-placeholder-avatar">+</span>
        <span class="star-sector-body">
          <strong>等待星系</strong>
          <span class="star-sector-description">新的星链节点即将加入</span>
        </span>
      </span>
      <span class="star-sector-footer">
        <span class="star-sector-score">占位 ${rowIndex + itemIndex + 1}</span>
      </span>
    `;
    return card;
  }

  function renderSectorMinimal(grid, sectors) {
    sectors.forEach((item, index) => {
      grid.appendChild(createSectorCard(item, index));
    });
  }

  function renderSectorFlow(grid, sectors) {
    const rows = [[], [], [], [], []];
    sectors.forEach((item, index) => {
      rows[index % rows.length].push({ item, index });
    });

    rows.forEach((rowItems, rowIndex) => {
      const row = document.createElement('div');
      const track = document.createElement('div');
      const items = rowItems.slice();
      const repeated = [];

      row.className = 'star-sector-marquee-row';
      track.className = `star-sector-marquee-track ${rowIndex % 2 === 0 ? 'star-sector-marquee-left' : 'star-sector-marquee-right'}`;
      track.style.setProperty('--sector-marquee-speed', `${rowIndex === 1 ? 138 : rowIndex === 2 ? 152 : rowIndex === 3 ? 166 : rowIndex === 4 ? 180 : 128}s`);

      while (items.length < 4) {
        items.push(null);
      }

      const repeatFactor = Math.max(3, Math.ceil(24 / items.length));
      for (let i = 0; i < repeatFactor; i += 1) {
        repeated.push(...items);
      }

      repeated.forEach((entry, itemIndex) => {
        const card = entry
          ? createSectorCard(entry.item, entry.index, 'star-sector-stream-card')
          : createSectorStreamPlaceholder(rowIndex, itemIndex);
        track.appendChild(card);
      });

      row.appendChild(track);
      grid.appendChild(row);
    });
  }

  function createSectorBubbleAvatar(item) {
    const wrap = document.createElement('span');
    wrap.className = 'star-sector-bubble-avatar';
    if (item.avatar) {
      const img = document.createElement('img');
      const fallback = document.createElement('span');
      img.src = item.avatar;
      img.alt = sectorDisplayName(item.name);
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      fallback.className = 'star-sector-bubble-avatar-fallback';
      fallback.hidden = true;
      fallback.innerHTML = avatarFallbackSvg;
      bindAvatarFallback(img, fallback);
      wrap.appendChild(img);
      wrap.appendChild(fallback);
    } else {
      wrap.innerHTML = avatarFallbackSvg;
    }
    return wrap;
  }

  function renderSectorBubble(grid, sectors) {
    if (destroyed) return;
    const shell = document.createElement('div');
    const field = document.createElement('div');
    const tip = document.createElement('div');
    const nodes = [];
    shell.className = 'star-sector-bubble-shell';
    field.className = 'star-sector-bubble-field';
    tip.className = 'star-sector-bubble-tip';
    tip.hidden = true;

    sectors.forEach((item, index) => {
      const bubble = document.createElement('button');
      const preview = document.createElement('span');

      bubble.className = 'star-sector-bubble-node';
      bubble.type = 'button';
      bubble.dataset.sectorIndex = String(index);
      bubble.setAttribute('aria-label', sectorDisplayName(item.name));
      preview.className = 'star-sector-card star-sector-bubble-preview-card';
      preview.setAttribute('aria-hidden', 'true');
      preview.innerHTML = sectorCardMarkup(item);
      bubble.appendChild(createSectorBubbleAvatar(item));
      bubble.appendChild(preview);
      bubble.addEventListener('click', (event) => {
        if (bubble.getAttribute('data-dragged') === 'true') {
          event.preventDefault();
          return;
        }
        openSectorModal(currentSectors[index]);
      });
      field.appendChild(bubble);
      nodes.push({ el: bubble, item, index, x: 0, y: 0, vx: 0, vy: 0, r: 24, dragging: false, sleeping: false });
    });

    shell.appendChild(field);
    shell.appendChild(tip);
    grid.appendChild(shell);

    setupSectorBubblePhysics(field, nodes, tip);
    bindSectorBubbleTip(field, tip);
    bindSectorBubbleDrag(field, nodes);
    sectorBubbleResizeHandler = () => {
      if (sectorBubbleSimulation) {
        placeSectorBubbleNodes(sectorBubbleSimulation, true);
        wakeSectorBubbles();
      }
    };
    window.addEventListener('resize', sectorBubbleResizeHandler);
  }

  function setupSectorBubblePhysics(field, nodes, tip) {
    sectorBubbleSimulation = {
      field,
      nodes,
      tip,
      width: 0,
      height: 0,
      gravity: 0.22,
      damping: 0.992,
      bounce: 0.62,
      tipNode: null,
    };
    placeSectorBubbleNodes(sectorBubbleSimulation, false);
    wakeSectorBubbles();
  }

  function placeSectorBubbleNodes(sim, keepVelocity) {
    const rect = sim.field.getBoundingClientRect();
    const count = sim.nodes.length;
    const columns = Math.max(5, Math.ceil(Math.sqrt(count * 1.45)));
    const rows = Math.max(3, Math.ceil(count / columns));
    let radius;

    sim.width = rect.width || sim.field.clientWidth || 760;
    sim.height = rect.height || sim.field.clientHeight || 420;
    radius = Math.max(24, Math.min(38, Math.floor((sim.width - 44) / (columns * 1.92)), Math.floor((sim.height - 58) / (rows * 1.9))));

    const gapX = (sim.width - radius * 2 - sectorBubbleBounds.left - sectorBubbleBounds.right) / Math.max(1, columns - 1);
    const gapY = (sim.height - radius * 2 - sectorBubbleBounds.top - sectorBubbleBounds.bottom) / Math.max(1, rows - 1);

    sim.nodes.forEach((node, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      node.r = radius;
      node.x = clamp(24 + radius + col * gapX + (row % 2) * Math.min(14, gapX * 0.28), radius + 30, sim.width - radius - 30);
      node.y = clamp(20 + radius + row * gapY, radius + sectorBubbleBounds.top, sim.height - radius - sectorBubbleBounds.bottom);
      if (!keepVelocity) {
        node.vx = (Math.random() - 0.5) * 1.8;
        node.vy = (Math.random() - 0.5) * 1.2;
      }
      node.sleeping = false;
      node.el.style.width = `${radius * 2}px`;
      node.el.style.height = `${radius * 2}px`;
      paintSectorBubbleNode(node);
    });
  }

  function paintSectorBubbleNode(node) {
    node.el.style.transform = `translate3d(${node.x - node.r}px, ${node.y - node.r}px, 0)`;
  }

  function shakeSectorBubbles(power) {
    if (!sectorBubbleSimulation) return;
    const force = typeof power === 'number' ? power : 1;
    sectorBubbleSimulation.nodes.forEach((node) => {
      const angle = Math.random() * Math.PI * 2;
      const strength = (14 + Math.random() * 18) * force;
      const floor = sectorBubbleSimulation.height - sectorBubbleBounds.bottom - node.r;
      const onFloor = node.y > floor - 10;
      node.sleeping = false;
      if (onFloor) {
        node.y = Math.min(node.y, floor - (10 + Math.random() * 36) * force);
      }
      node.vx += Math.cos(angle) * strength + (Math.random() - 0.5) * 8 * force;
      node.vy += Math.sin(angle) * strength - (onFloor ? (12 + Math.random() * 18) * force : 0);
    });
    wakeSectorBubbles();
  }

  function wakeSectorBubbles() {
    if (destroyed || sectorBubbleFrame || !sectorBubbleSimulation) return;
    sectorBubbleFrame = window.requestAnimationFrame(tickSectorBubbles);
  }

  function tickSectorBubbles() {
    const sim = sectorBubbleSimulation;
    let energy = 0;

    sectorBubbleFrame = 0;
    if (!sim) return;

    resolveSectorBubbleCollisions(sim);

    sim.nodes.forEach((node) => {
      if (node.dragging) {
        node.sleeping = false;
        energy += 1;
        paintSectorBubbleNode(node);
        return;
      }

      if (node.sleeping) {
        return;
      }

      node.x += node.vx;
      node.y += node.vy;
      node.vy += sim.gravity;
      node.vx *= sim.damping;
      node.vy *= sim.damping;

      if (node.x - node.r < sectorBubbleBounds.left) {
        node.x = node.r + sectorBubbleBounds.left;
        node.vx = Math.abs(node.vx) * sim.bounce;
      } else if (node.x + node.r > sim.width - sectorBubbleBounds.right) {
        node.x = sim.width - node.r - sectorBubbleBounds.right;
        node.vx = -Math.abs(node.vx) * sim.bounce;
      }

      if (node.y - node.r < sectorBubbleBounds.top) {
        node.y = node.r + sectorBubbleBounds.top;
        node.vy = Math.abs(node.vy) * sim.bounce;
      } else if (node.y + node.r > sim.height - sectorBubbleBounds.bottom) {
        node.y = sim.height - node.r - sectorBubbleBounds.bottom;
        node.vy = -Math.abs(node.vy) * sim.bounce;
        node.vx *= 0.965;
        if (Math.abs(node.vy) < 0.8) node.vy = 0;
        if (Math.abs(node.vx) < 0.08) node.vx = 0;
      }

      if (Math.abs(node.vx) < 0.025 && Math.abs(node.vy) < 0.025) {
        node.vx = 0;
        node.vy = 0;
        node.sleeping = true;
      }

      if (node.y + node.r >= sim.height - sectorBubbleBounds.bottom && Math.abs(node.vx) < 0.08 && Math.abs(node.vy) < 0.08) {
        node.y = sim.height - node.r - sectorBubbleBounds.bottom;
        node.vx = 0;
        node.vy = 0;
        node.sleeping = true;
      }

      energy += Math.abs(node.vx) + Math.abs(node.vy);
      paintSectorBubbleNode(node);
    });

    positionSectorBubbleTip();

    if (energy > sim.nodes.length * 0.08) {
      sectorBubbleFrame = window.requestAnimationFrame(tickSectorBubbles);
    }
  }

  function resolveSectorBubbleCollisions(sim) {
    for (let i = 0; i < sim.nodes.length; i += 1) {
      for (let j = i + 1; j < sim.nodes.length; j += 1) {
        const a = sim.nodes[i];
        const b = sim.nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r + 1;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const overlap = min - distance;

        if (overlap > 0) {
          const nx = dx / distance;
          const ny = dy / distance;
          const push = overlap * 0.5;
          const impulse = ((b.vx - a.vx) * nx + (b.vy - a.vy) * ny) * 0.5;
          const movingImpact = Math.abs(impulse) > 0.035 || Math.abs(a.vx) + Math.abs(a.vy) + Math.abs(b.vx) + Math.abs(b.vy) > 0.18;

          if (a.dragging) {
            b.sleeping = false;
            b.x += nx * overlap;
            b.y += ny * overlap;
            b.vx += nx * Math.max(1, Math.abs(a.vx));
            b.vy += ny * Math.max(1, Math.abs(a.vy));
          } else if (b.dragging) {
            a.sleeping = false;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            a.vx -= nx * Math.max(1, Math.abs(b.vx));
            a.vy -= ny * Math.max(1, Math.abs(b.vy));
          } else if (a.sleeping && b.sleeping) {
            continue;
          } else {
            if (movingImpact) {
              a.sleeping = false;
              b.sleeping = false;
            }
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            a.vx += nx * impulse;
            a.vy += ny * impulse;
            b.vx -= nx * impulse;
            b.vy -= ny * impulse;
          }
        }
      }
    }
  }

  function bindSectorBubbleTip(field, tip) {
    if (!sectorBubbleSimulation) return;
    sectorBubbleSimulation.tip = tip;

    field.addEventListener('mouseover', (event) => {
      const nodeEl = event.target.closest('.star-sector-bubble-node');
      if (!nodeEl || !field.contains(nodeEl) || nodeEl.classList.contains('is-dragging')) return;
      showSectorBubbleTip(nodeEl);
    });
    field.addEventListener('focusin', (event) => {
      const nodeEl = event.target.closest('.star-sector-bubble-node');
      if (!nodeEl || !field.contains(nodeEl)) return;
      showSectorBubbleTip(nodeEl);
    });
    field.addEventListener('mouseout', (event) => {
      const nodeEl = event.target.closest('.star-sector-bubble-node');
      if (!nodeEl || nodeEl.contains(event.relatedTarget)) return;
      hideSectorBubbleTip();
    });
    field.addEventListener('focusout', (event) => {
      const nodeEl = event.target.closest('.star-sector-bubble-node');
      if (!nodeEl || nodeEl.contains(event.relatedTarget)) return;
      hideSectorBubbleTip();
    });
  }

  function showSectorBubbleTip(nodeEl) {
    const sim = sectorBubbleSimulation;
    const tip = sim ? sim.tip : null;
    const preview = nodeEl.querySelector('.star-sector-bubble-preview-card');

    if (!tip || !preview) return;
    tip.innerHTML = '';
    tip.appendChild(preview.cloneNode(true));
    tip.hidden = false;
    sim.tipNode = nodeEl;
    positionSectorBubbleTip();
  }

  function hideSectorBubbleTip() {
    if (!sectorBubbleSimulation || !sectorBubbleSimulation.tip) return;
    sectorBubbleSimulation.tip.hidden = true;
    sectorBubbleSimulation.tipNode = null;
  }

  function positionSectorBubbleTip() {
    const sim = sectorBubbleSimulation;
    const tip = sim ? sim.tip : null;
    const nodeEl = sim ? sim.tipNode : null;
    let shellRect;
    let nodeRect;
    let tipRect;
    let x;
    let y;

    if (!tip || !nodeEl || tip.hidden) return;
    shellRect = tip.parentElement.getBoundingClientRect();
    nodeRect = nodeEl.getBoundingClientRect();
    tipRect = tip.getBoundingClientRect();
    x = nodeRect.left - shellRect.left + nodeRect.width / 2;
    y = nodeRect.top - shellRect.top - tipRect.height - 12;
    tip.classList.toggle('is-below', y < 12);
    if (y < 12) {
      y = nodeRect.bottom - shellRect.top + 12;
    }
    x = clamp(x, tipRect.width / 2 + 12, shellRect.width - tipRect.width / 2 - 12);
    tip.style.transform = `translate3d(${x}px, ${y}px, 0) translateX(-50%)`;
  }

  function bindSectorBubbleDrag(field, nodes) {
    nodes.forEach((node) => {
      node.el.addEventListener('pointerdown', (event) => {
        let point;
        if (!sectorBubbleSimulation || event.button !== 0) return;
        event.preventDefault();
        point = getSectorBubblePoint(field, event);
        node.el.setPointerCapture(event.pointerId);
        node.dragging = true;
        node.sleeping = false;
        node.vx = 0;
        node.vy = 0;
        node.el.classList.add('is-dragging');
        hideSectorBubbleTip();
        activeSectorBubbleDrag = {
          node,
          pointerId: event.pointerId,
          offsetX: point.x - node.x,
          offsetY: point.y - node.y,
          lastX: point.x,
          lastY: point.y,
          startX: point.x,
          startY: point.y,
          lastTime: performance.now(),
        };
        wakeSectorBubbles();
      });
    });

    field.addEventListener('pointermove', (event) => {
      const drag = activeSectorBubbleDrag;
      let point;
      let now;
      let dt;

      if (!drag || drag.pointerId !== event.pointerId || !sectorBubbleSimulation) return;
      event.preventDefault();
      point = getSectorBubblePoint(field, event);
      now = performance.now();
      dt = Math.max(16, now - drag.lastTime);
      drag.node.x = clamp(point.x - drag.offsetX, drag.node.r + sectorBubbleBounds.left, sectorBubbleSimulation.width - drag.node.r - sectorBubbleBounds.right);
      drag.node.y = clamp(point.y - drag.offsetY, drag.node.r + sectorBubbleBounds.top, sectorBubbleSimulation.height - drag.node.r - sectorBubbleBounds.bottom);
      drag.node.vx = ((point.x - drag.lastX) / dt) * 16;
      drag.node.vy = ((point.y - drag.lastY) / dt) * 16;
      drag.moved = drag.moved || Math.abs(point.x - drag.startX) + Math.abs(point.y - drag.startY) > 5;
      drag.lastX = point.x;
      drag.lastY = point.y;
      drag.lastTime = now;
      paintSectorBubbleNode(drag.node);
      wakeSectorBubbles();
    });

    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
      field.addEventListener(type, releaseSectorBubbleDrag);
    });
  }

  function releaseSectorBubbleDrag(event) {
    const drag = activeSectorBubbleDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.node.dragging = false;
    drag.node.el.classList.remove('is-dragging');
    if (drag.moved) {
      drag.node.el.setAttribute('data-dragged', 'true');
      setTimeout(() => {
        drag.node.el.removeAttribute('data-dragged');
      }, 80);
    }
    activeSectorBubbleDrag = null;
    wakeSectorBubbles();
  }

  function getSectorBubblePoint(field, event) {
    const rect = field.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function stopSectorBubblePhysics() {
    if (sectorBubbleFrame) {
      window.cancelAnimationFrame(sectorBubbleFrame);
      sectorBubbleFrame = 0;
    }
    if (sectorBubbleResizeHandler) {
      window.removeEventListener('resize', sectorBubbleResizeHandler);
      sectorBubbleResizeHandler = null;
    }
    activeSectorBubbleDrag = null;
    sectorBubbleSimulation = null;
  }

  function renderSectors(sectors) {
    if (destroyed) return;
    const grid = document.getElementById('starSectors');
    if (!grid) return;
    stopSectorBubblePhysics();
    grid.innerHTML = '';

    if (!sectors.length) {
      grid.innerHTML = '<div class="star-empty-card">正在接收星系信号</div>';
      return;
    }

    const mode = currentDisplayMode();
    activeDisplayMode = mode;
    if (mode === 'bubble') {
      renderSectorBubble(grid, sectors);
    } else if (mode === 'flow') {
      renderSectorFlow(grid, sectors);
    } else {
      renderSectorMinimal(grid, sectors);
    }
  }

  function renderTimeline(posts) {
    if (destroyed) return;
    const timeline = document.getElementById('starTimeline');
    if (!timeline) return;

    if (!posts.length) {
      timeline.classList.remove('has-items');
      timeline.classList.add('is-empty');
      timeline.innerHTML = '<div class="star-empty-card">正在接收星际资讯</div>';
      return;
    }

    timeline.classList.add('has-items');
    timeline.classList.remove('is-empty');
    timeline.innerHTML = posts.map((post) => {
      const sourceName = post.nodeName || post.siteName || post.source || '星际资讯';
      const url = post.url || '#';
      const canOpen = url !== '#';
      const siteUrl = post.siteUrl || post.url || '#';
      const canLocate = siteUrl !== '#';
      const postType = String(post.type || '').toLowerCase();
      const isArticle = postType === 'rss' || postType === 'article' || postType === 'post';
      const postTitle = post.title || '捕捉到新的深空资讯';
      const postDescription = post.description || '';
      const actions = isArticle
        ? (canOpen ? `<a class="star-timeline-action" href="${escapeHtml(url)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>打开原文</span></a>` : '')
        : (canLocate ? `<a class="star-timeline-action star-timeline-action-source" href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>定位星球</span></a>` : '');
      return `
      <article class="star-timeline-item">
        <div class="star-timeline-card">
          <span class="star-timeline-avatar-wrap">
            ${avatarImageMarkup(post.avatar, sourceName, 'star-timeline-avatar', 'star-timeline-avatar star-timeline-avatar-fallback')}
          </span>
          <div class="star-timeline-content">
            <h3>${escapeHtml(postTitle)}</h3>
            ${postDescription ? `<p class="star-timeline-summary">${escapeHtml(postDescription)}</p>` : ''}
          </div>
          <time class="star-timeline-time">${escapeHtml(relativeTime(post.publishTime))}</time>
          <span class="star-timeline-source">${escapeHtml(sourceName)}</span>
          ${actions ? `<div class="star-timeline-actions">${actions}</div>` : ''}
        </div>
      </article>
    `;
    }).join('');
  }

  async function loadSectorPlanets(item, page) {
    const url = String(item?.planetsUrl || '').trim();
    if (!url) {
      return { items: [], total: 0, page: 1, hasMore: false };
    }
    const requestUrl = new URL(url, window.location.origin);
    requestUrl.searchParams.set('page', String(page || 1));
    requestUrl.searchParams.set('pageSize', String(sectorPlanetPageSize));
    const response = await fetch(requestUrl.toString(), {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { items: [], total: 0, page: 1, hasMore: false };
    const data = await response.json();
    return {
      items: Array.isArray(data.items) ? data.items : [],
      total: Number(data.total || 0),
      page: Number(data.page || 1),
      hasMore: Boolean(data.hasMore),
    };
  }

  function getSectorPlanetColumns() {
    return window.matchMedia && window.matchMedia('(max-width: 640px)').matches ? 1 : 2;
  }

  function renderSectorPlanetPlaceholders(count) {
    if (count <= 0) return '';
    return Array.from({ length: count }).map(() => `
      <span class="star-sector-planet-card star-sector-planet-placeholder" aria-hidden="true">
        <span class="star-sector-planet-placeholder-avatar"></span>
        <span>
          <strong></strong>
          <em></em>
        </span>
      </span>
    `).join('');
  }

  function renderSectorPlanets(planets) {
    const minVisibleCards = 4 * getSectorPlanetColumns();
    const placeholderCount = Math.max(0, minVisibleCards - planets.length);
    if (!planets.length) {
      return `
        <div class="star-sector-planet-grid">
          ${renderSectorPlanetPlaceholders(placeholderCount)}
        </div>
      `;
    }

    return `
      <div class="star-sector-planet-grid">
        ${planets.map((planet) => `
          <span class="star-sector-planet-card">
            <span class="star-sector-planet-avatar-wrap">
              ${avatarImageMarkup(planet.avatar, planet.name || '', 'star-sector-planet-avatar', 'star-sector-planet-avatar star-sector-planet-avatar-fallback')}
            </span>
            <span class="star-sector-planet-copy">
              <strong>${escapeHtml(planet.name || '')}</strong>
              <em>${escapeHtml(truncateText(planet.description, 30))}</em>
            </span>
          </span>
        `).join('')}
        ${renderSectorPlanetPlaceholders(placeholderCount)}
      </div>
    `;
  }

  function resetSectorPlanetPager() {
    if (sectorPlanetPager && sectorPlanetPager.feed && sectorPlanetPager.onScroll) {
      sectorPlanetPager.feed.removeEventListener('scroll', sectorPlanetPager.onScroll);
    }
    sectorPlanetPager = null;
  }

  function ensureSectorModal() {
    if (modalEl) return modalEl;

    document.querySelectorAll('.star-sector-modal').forEach((existing) => existing.remove());

    modalEl = document.createElement('div');
    modalEl.className = 'star-sector-modal';
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML = `
      <div class="star-sector-modal-backdrop" data-star-sector-close></div>
      <section class="star-sector-dialog" role="dialog" aria-modal="true" aria-label="星系档案">
        <button class="star-sector-close" type="button" data-star-sector-close aria-label="关闭">x</button>
        <aside class="star-sector-dialog-profile" id="starSectorDialogProfile"></aside>
        <div class="star-sector-dialog-main">
          <div class="star-sector-dialog-feed-head" id="starSectorDialogHead"></div>
          <div class="star-sector-dialog-feed" id="starSectorDialogFeed"></div>
        </div>
      </section>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', (event) => {
      if (event.target.closest('[data-star-sector-close]')) closeSectorModal();
    });
    sectorModalKeydownHandler = (event) => {
      if (event.key === 'Escape' && modalEl.classList.contains('is-open')) closeSectorModal();
    };
    document.addEventListener('keydown', sectorModalKeydownHandler);

    return modalEl;
  }

  function openSectorModal(item) {
    if (!item) return;
    resetSectorPlanetPager();

    const modal = ensureSectorModal();
    const profile = modal.querySelector('#starSectorDialogProfile');
    const head = modal.querySelector('#starSectorDialogHead');
    const feed = modal.querySelector('#starSectorDialogFeed');

    profile.innerHTML = `
      <div class="star-sector-dialog-headline">
        <span class="star-sector-dialog-avatar-wrap">
          ${avatarImageMarkup(item.avatar, sectorDisplayName(item.name), 'star-sector-dialog-avatar', 'star-sector-dialog-avatar star-sector-dialog-avatar-fallback')}
        </span>
        <div class="star-sector-dialog-copy">
          <strong>${escapeHtml(sectorDisplayName(item.name))}</strong>
          <p>${escapeHtml(item.description || '')}</p>
        </div>
      </div>
      <div class="star-sector-dialog-stats">
        <span><em>影响</em><strong>${escapeHtml(formatScore(item.influence))}</strong></span>
        <span><em>可信</em><strong>${escapeHtml(formatScore(item.trust))}</strong></span>
        <span><em>星球</em><strong>${escapeHtml(integer(item.friendCount))} 个</strong></span>
      </div>
      ${item.url ? `<a class="star-sector-dialog-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">访问星系</a>` : ''}
      <div class="star-sector-dialog-dates">
        <span><em>加入</em> <strong>${escapeHtml(formatDate(item.joinedAt))}</strong></span>
        <span><em>活跃</em> <strong>${escapeHtml(formatDate(item.activeAt))}</strong></span>
      </div>
    `;
    head.innerHTML = `
      <span>
        <strong>星系成员 · ${integer(item.friendCount)} 个星球</strong>
      </span>
    `;
    feed.innerHTML = `
      ${renderSectorPlanets([])}
    `;
    feed.scrollTop = 0;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('star-sector-modal-open');

    sectorPlanetPager = {
      item,
      feed,
      head,
      page: 1,
      hasMore: false,
      loading: true,
      items: [],
      onScroll: null,
    };

    sectorPlanetPager.onScroll = () => {
      if (!sectorPlanetPager || sectorPlanetPager.feed !== feed) return;
      if (sectorPlanetPager.loading || !sectorPlanetPager.hasMore) return;
      const distance = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
      if (distance > 80) return;
      loadNextSectorPlanetPage();
    };
    feed.addEventListener('scroll', sectorPlanetPager.onScroll, { passive: true });

    loadSectorPlanets(item, 1)
      .then((page) => {
        if (!modal.classList.contains('is-open') || !sectorPlanetPager || sectorPlanetPager.item !== item) return;
        sectorPlanetPager.loading = false;
        sectorPlanetPager.page = Number(page.page || 1);
        sectorPlanetPager.hasMore = Boolean(page.hasMore);
        sectorPlanetPager.items = page.items;
        head.innerHTML = `
          <span>
            <strong>星系成员 · ${integer(page.total || item.friendCount)} 个星球</strong>
          </span>
        `;
        feed.innerHTML = renderSectorPlanets(sectorPlanetPager.items);
        feed.scrollTop = 0;
      })
      .catch(() => {
        if (sectorPlanetPager && sectorPlanetPager.item === item) {
          sectorPlanetPager.loading = false;
          sectorPlanetPager.hasMore = false;
        }
        if (modal.classList.contains('is-open')) {
          feed.innerHTML = renderSectorPlanets([]);
        }
      });
  }

  function loadNextSectorPlanetPage() {
    const pager = sectorPlanetPager;
    if (!pager || pager.loading || !pager.hasMore) return;
    pager.loading = true;
    loadSectorPlanets(pager.item, pager.page + 1)
      .then((page) => {
        if (sectorPlanetPager !== pager || !modalEl || !modalEl.classList.contains('is-open')) return;
        const nextItems = Array.isArray(page.items) ? page.items : [];
        pager.page = Number(page.page || pager.page + 1);
        pager.hasMore = Boolean(page.hasMore);
        pager.items = pager.items.concat(nextItems);
        pager.loading = false;
        pager.feed.innerHTML = renderSectorPlanets(pager.items);
      })
      .catch(() => {
        if (sectorPlanetPager === pager) {
          pager.loading = false;
        }
      });
  }

  function closeSectorModal() {
    if (!modalEl) return;
    resetSectorPlanetPager();
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('star-sector-modal-open');
  }

  function removeSectorModal() {
    closeSectorModal();
    if (sectorModalKeydownHandler) {
      document.removeEventListener('keydown', sectorModalKeydownHandler);
      sectorModalKeydownHandler = null;
    }
    if (modalEl) {
      modalEl.remove();
      modalEl = null;
    }
    document.querySelectorAll('.star-sector-modal').forEach((existing) => existing.remove());
  }

  function normalizeSnapshot(snapshot) {
    const data = snapshot && typeof snapshot === 'object' ? snapshot : fallbackData;
    const profile = Object.assign({}, fallbackData.profile, data.profile || {});
    const sectors = Array.isArray(data.sectors) ? data.sectors : [];
    const posts = Array.isArray(data.posts) ? data.posts : [];
    const available = data.available !== false;
    return { profile, sectors, posts, available };
  }

  function currentDisplayMode() {
    const root = document.getElementById('starGalleryRoot');
    return normalizeDisplayMode(root?.dataset.displayMode || root?.dataset.defaultMode);
  }

  function applyDisplayMode(mode) {
    const root = document.getElementById('starGalleryRoot');
    const nextMode = normalizeDisplayMode(mode);
    if (!root) return nextMode;
    if (root.dataset.defaultMode !== nextMode) root.dataset.defaultMode = nextMode;
    if (root.dataset.displayMode !== nextMode) root.dataset.displayMode = nextMode;
    root.classList.remove('star-gallery-mode-flow', 'star-gallery-mode-minimal', 'star-gallery-mode-bubble');
    root.classList.add(`star-gallery-mode-${nextMode}`);
    return nextMode;
  }

  function bindDisplayModeObserver() {
    const root = document.getElementById('starGalleryRoot');
    if (!root || sectorModeObserver) return;
    sectorModeObserver = new MutationObserver((records) => {
      const changedAttribute = records[records.length - 1]?.attributeName;
      const mode = applyDisplayMode(changedAttribute === 'data-display-mode' ? root.dataset.displayMode : root.dataset.defaultMode);
      if (mode === activeDisplayMode) return;
      lastSectorRenderKey = '';
      renderSectors(currentSectors);
    });
    sectorModeObserver.observe(root, {
      attributes: true,
      attributeFilter: ['data-default-mode', 'data-display-mode'],
    });
  }

  function sectorRenderKey(sectors) {
    const sectorKeys = sectors.map((item) => [
      item.nodeId || '',
      item.url || '',
      item.name || '',
      item.avatar || '',
      item.friendCount || 0,
      item.planetsUrl || '',
    ].join(':')).sort();

    return [
      currentDisplayMode(),
      sectors.length,
      sectorKeys.join('|'),
    ].join('#');
  }

  function renderSnapshot(snapshot) {
    const data = normalizeSnapshot(snapshot);
    const root = document.getElementById('starGalleryRoot');
    applyDisplayMode(root?.dataset.displayMode || root?.dataset.defaultMode);
    renderAvailability(data.available);
    if (!data.available) {
      currentSectors = [];
      currentPosts = [];
      lastSectorRenderKey = '';
      stopSectorBubblePhysics();
      return;
    }
    const nextSectorRenderKey = sectorRenderKey(data.sectors);
    currentSectors = data.sectors;
    currentPosts = data.posts;
    renderProfile(data.profile, data.sectors, data.available);
    if (nextSectorRenderKey !== lastSectorRenderKey) {
      lastSectorRenderKey = nextSectorRenderKey;
      renderSectors(data.sectors);
    }
    renderTimeline(data.posts);
  }

  async function loadSnapshot() {
    try {
      const response = await fetch(snapshotEndpoint, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (destroyed) return;
      if (!response.ok) return;
      renderSnapshot(await response.json());
    } catch (error) {
      console.debug('[StarGallery] load snapshot failed', error);
    }
  }

  async function probeStarGallery() {
    renderAvailability('loading');
    try {
      const response = await fetch(statusEndpoint, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (destroyed) return;
      if (!response.ok) {
        renderAvailability(false);
        return;
      }
      const status = await response.json();
      if (!status || status.available === false) {
        renderAvailability(false);
        return;
      }
      await loadSnapshot();
      connectSnapshotStream();
    } catch (error) {
      console.debug('[StarGallery] probe status failed', error);
      if (!destroyed) renderAvailability(false);
    }
  }

  function connectSnapshotStream() {
    if (destroyed || !('WebSocket' in window)) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}${snapshotWsPath}`);
    snapshotSocket = socket;

    socket.addEventListener('message', (event) => {
      if (destroyed) return;
      try {
        renderSnapshot(JSON.parse(event.data));
      } catch (error) {
        console.debug('[StarGallery] invalid snapshot message', error);
      }
    });
    socket.addEventListener('close', () => {
      if (!destroyed && snapshotSocket === socket) {
        window.setTimeout(connectSnapshotStream, 5000);
      }
    });
  }

  function initStarGallery() {
    if (destroyed) return;
    const root = document.getElementById('starGalleryRoot');
    if (root) {
      applyDisplayMode(root.dataset.displayMode || root.dataset.defaultMode);
    }
    bindDisplayModeObserver();
    if (window.STAR_GALLERY_DATA) {
      renderSnapshot(window.STAR_GALLERY_DATA);
      connectSnapshotStream();
    } else {
      probeStarGallery();
    }
  }

  window.__SERENITY_STAR_GALLERY_CLEANUP__ = function () {
    destroyed = true;
    stopSectorBubblePhysics();
    removeSectorModal();
    if (sectorModeObserver) {
      sectorModeObserver.disconnect();
      sectorModeObserver = null;
    }
    if (snapshotSocket) {
      snapshotSocket.close();
      snapshotSocket = null;
    }
  };

  if (typeof window.__pjaxOnLeave === 'function') {
    window.__pjaxOnLeave(window.__SERENITY_STAR_GALLERY_CLEANUP__);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarGallery);
  } else {
    initStarGallery();
  }
})();
