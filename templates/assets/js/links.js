/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-09-06 17:08:20
 * Fingerprint: 91b2dee920cf4cca
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

var currentLinkUrl = '';

function initLinksPage() {
  if (typeof window.__linksPageCleanup === 'function') {
    window.__linksPageCleanup();
  }

  var board = document.querySelector('[data-links-board]');
  var grid = board ? board.querySelector('.link-grid') : null;
  var sourceCards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.link-card[data-link]')) : [];
  var confirmModal = document.getElementById('linkConfirmModal');
  var searchInput = document.getElementById('linksSearchInput');
  var searchClear = document.querySelector('.links-search-clear');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.links-filter-chip[data-link-filter]'));
  var emptyState = document.querySelector('.links-empty-state');
  var configuredMode = board ? board.getAttribute('data-default-mode') : 'stream';
  var activeMode = ['stream', 'minimal', 'orbit'].indexOf(configuredMode) === -1 ? 'stream' : configuredMode;
  var activeFilter = 'all';
  var visibleCards = sourceCards.slice();
  var cleanups = [];
  var bubbleFrame = 0;
  var bubbleSimulation = null;
  var bubbleResizeHandler = null;
  var activeBubbleDrag = null;
  var bubbleBounds = {
    left: 30,
    right: 30,
    top: 18,
    bottom: 34
  };

  function cleanupLinksPage() {
    stopBubblePhysics();
    while (cleanups.length) {
      cleanups.pop()();
    }
    if (window.__linksPageCleanup === cleanupLinksPage) {
      window.__linksPageCleanup = null;
    }
  }

  window.__linksPageCleanup = cleanupLinksPage;

  if (typeof window.__pjaxOnLeave === 'function') {
    window.__pjaxOnLeave(cleanupLinksPage);
  }

  function bind(target, type, handler, options) {
    if (!target || typeof target.addEventListener !== 'function') return;
    target.addEventListener(type, handler, options);
    cleanups.push(function () {
      target.removeEventListener(type, handler, options);
    });
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getCardData(card) {
    var avatar = card.querySelector('.link-avatar');
    var placeholder = card.querySelector('.link-avatar-placeholder');
    return {
      url: card.href,
      name: card.getAttribute('data-link-name') || (card.querySelector('.link-name') || {}).textContent || '',
      desc: card.getAttribute('data-link-desc') || (card.querySelector('.link-desc') || {}).textContent || '',
      group: card.getAttribute('data-link-group') || '空白分类',
      avatar: avatar ? avatar.getAttribute('src') : '',
      fallback: placeholder ? placeholder.innerHTML : ''
    };
  }

  function cloneCard(card) {
    var clone = card.cloneNode(true);
    clone.removeAttribute('data-aos');
    clone.removeAttribute('data-aos-delay');
    clone.hidden = false;
    return clone;
  }

  function refreshAos() {
    if (typeof AOS !== 'undefined' && typeof AOS.refresh === 'function') {
      setTimeout(function () { AOS.refresh(); }, 80);
    }
  }

  function applyMode(mode) {
    if (!board) return;
    activeMode = ['stream', 'minimal', 'orbit'].indexOf(mode) === -1 ? 'stream' : mode;
    board.classList.remove('links-board-stream', 'links-board-minimal', 'links-board-orbit');
    board.classList.add('links-board-' + activeMode);
    var section = board.closest('.link-section');
    if (section) {
      section.classList.toggle('links-gallery-active', activeMode === 'minimal');
    }

    renderLayout();
  }

  function applyFilters() {
    var query = normalizeText(searchInput ? searchInput.value : '');

    visibleCards = sourceCards.filter(function (card) {
      var data = getCardData(card);
      var haystack = normalizeText([data.name, data.desc, data.group, data.url].join(' '));
      var matchesSearch = !query || haystack.indexOf(query) !== -1;
      var matchesGroup = activeFilter === 'all' || data.group === activeFilter;
      return matchesSearch && matchesGroup;
    });

    if (emptyState) {
      emptyState.hidden = visibleCards.length !== 0;
    }

    if (searchClear) {
      searchClear.hidden = !query;
    }

    renderLayout();
  }

  function clearGrid() {
    if (!grid) return;
    stopBubblePhysics();
    grid.innerHTML = '';
  }

  function renderLayout() {
    if (!grid) return;
    clearGrid();

    if (!visibleCards.length) {
      refreshAos();
      return;
    }

    if (activeMode === 'orbit') {
      renderBubbleField();
    } else if (activeMode === 'stream') {
      renderStream();
    } else {
      renderMinimal();
    }

    refreshAos();
  }

  function renderMinimal() {
    var grouped = new Map();
    visibleCards.forEach(function (card) {
      var group = getCardData(card).group || '空白分类';
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group).push(card);
    });

    Array.from(grouped.entries()).forEach(function (entry) {
      var section = document.createElement('section');
      var heading = document.createElement('div');
      var list = document.createElement('div');

      section.className = 'links-gallery-section';
      heading.className = 'links-gallery-heading';
      heading.innerHTML = '<span>' + escapeHtml(entry[0]) + '</span><em>' + entry[1].length + '</em>';
      list.className = 'links-gallery-grid';

      entry[1].forEach(function (card) {
        card.hidden = false;
        list.appendChild(card);
      });

      section.appendChild(heading);
      section.appendChild(list);
      grid.appendChild(section);
    });
  }

  function renderStream(rowCount) {
    var count = Math.max(1, rowCount || 5);
    var rows = Array.from({ length: count }, function () { return []; });
    visibleCards.forEach(function (card, index) {
      rows[index % rows.length].push(card);
    });

    rows.forEach(function (rowCards, rowIndex) {
      var row = document.createElement('div');
      var track = document.createElement('div');
      var repeated = [];
      var rowItems = rowCards.slice();

      row.className = 'links-marquee-row';
      track.className = 'links-marquee-track ' + (rowIndex % 2 === 0 ? 'links-marquee-left' : 'links-marquee-right');
      track.style.setProperty('--marquee-speed', (rowIndex === 1 ? 138 : rowIndex === 2 ? 152 : rowIndex === 3 ? 166 : rowIndex === 4 ? 180 : 128) + 's');

      while (rowItems.length < 4) {
        rowItems.push(null);
      }

      var repeatFactor = Math.max(3, Math.ceil(24 / rowItems.length));

      for (var i = 0; i < repeatFactor; i++) {
        repeated = repeated.concat(rowItems);
      }

      repeated.forEach(function (card, itemIndex) {
        var clone = card ? cloneCard(card) : createStreamPlaceholder(rowIndex, itemIndex);
        clone.classList.add('links-stream-card');
        track.appendChild(clone);
      });

      row.appendChild(track);
      grid.appendChild(row);
    });
  }

  function createStreamPlaceholder(rowIndex, itemIndex) {
    var card = document.createElement('div');
    var avatarWrap = document.createElement('div');
    var avatar = document.createElement('div');
    var info = document.createElement('div');
    var name = document.createElement('span');
    var desc = document.createElement('span');
    var tag = document.createElement('span');

    card.className = 'link-card links-stream-placeholder';
    avatarWrap.className = 'link-avatar-wrap';
    avatar.className = 'link-avatar-placeholder';
    avatar.textContent = '+';
    info.className = 'link-info';
    name.className = 'link-name';
    desc.className = 'link-desc';
    tag.className = 'link-group-tag';
    name.textContent = '等待邻居';
    desc.textContent = '新的友链节点即将加入';
    tag.textContent = '占位';

    avatarWrap.appendChild(avatar);
    info.appendChild(name);
    info.appendChild(desc);
    card.appendChild(avatarWrap);
    card.appendChild(info);
    card.appendChild(tag);
    card.setAttribute('aria-hidden', 'true');
    card.style.setProperty('--placeholder-index', String(rowIndex + itemIndex));
    return card;
  }

  function renderAvatar(data, className) {
    var wrap = document.createElement('span');
    wrap.className = className;

    if (data.avatar) {
      var img = document.createElement('img');
      var fallback = null;
      img.alt = data.name;
      img.referrerPolicy = 'no-referrer';
      if (data.fallback) {
        fallback = document.createElement('span');
        fallback.className = className + '-fallback';
        fallback.innerHTML = data.fallback;
        fallback.hidden = true;
        img.addEventListener('error', function () {
          img.hidden = true;
          fallback.hidden = false;
        }, { once: true });
      }
      img.src = data.avatar;
      wrap.appendChild(img);
      if (fallback) {
        wrap.appendChild(fallback);
      }
    } else if (data.fallback) {
      wrap.innerHTML = data.fallback;
    } else {
      wrap.textContent = data.name ? data.name.charAt(0).toUpperCase() : 'A';
    }

    return wrap;
  }

  function renderBubbleField() {
    var shell = document.createElement('div');
    var field = document.createElement('div');
    var tip = document.createElement('div');
    var nodes = [];
    field.className = 'links-bubble-field';
    tip.className = 'links-bubble-tip';
    tip.hidden = true;

    visibleCards.forEach(function (card) {
      var data = getCardData(card);
      var bubble = document.createElement('a');
      var preview = cloneCard(card);

      bubble.className = 'links-bubble-node';
      bubble.href = data.url;
      bubble.setAttribute('data-link', '');
      bubble.setAttribute('data-link-name', data.name);
      bubble.setAttribute('aria-label', data.name);
      preview.classList.add('links-bubble-preview-card');
      preview.removeAttribute('href');
      preview.removeAttribute('target');
      preview.removeAttribute('rel');
      preview.removeAttribute('data-link');
      preview.setAttribute('aria-hidden', 'true');
      bubble.appendChild(renderAvatar(data, 'links-bubble-avatar'));
      bubble.appendChild(preview);
      field.appendChild(bubble);
      nodes.push({ el: bubble, x: 0, y: 0, vx: 0, vy: 0, r: 24, dragging: false, sleeping: false });
    });

    shell.appendChild(field);
    shell.appendChild(tip);
    grid.appendChild(shell);

    setupBubblePhysics(field, nodes);
    bindBubbleTip(field, tip);
    bindBubbleDrag(field, nodes);
    bubbleResizeHandler = function () {
      if (bubbleSimulation) {
        placeBubbleNodes(bubbleSimulation, true);
        wakeBubbles();
      }
    };
    window.addEventListener('resize', bubbleResizeHandler);
  }

  function setupBubblePhysics(field, nodes) {
    bubbleSimulation = {
      field: field,
      nodes: nodes,
      width: 0,
      height: 0,
      gravity: 0.22,
      damping: 0.992,
      bounce: 0.62,
      tip: null,
      tipNode: null
    };

    placeBubbleNodes(bubbleSimulation, false);
    wakeBubbles();
  }

  function placeBubbleNodes(sim, keepVelocity) {
    var rect = sim.field.getBoundingClientRect();
    var count = sim.nodes.length;
    var columns = Math.max(5, Math.ceil(Math.sqrt(count * 1.45)));
    var rows = Math.max(3, Math.ceil(count / columns));
    var gapX;
    var gapY;
    var radius;

    sim.width = rect.width || sim.field.clientWidth || 760;
    sim.height = rect.height || sim.field.clientHeight || 420;
    radius = Math.max(24, Math.min(38, Math.floor((sim.width - 44) / (columns * 1.92)), Math.floor((sim.height - 58) / (rows * 1.9))));
    gapX = (sim.width - radius * 2 - bubbleBounds.left - bubbleBounds.right) / Math.max(1, columns - 1);
    gapY = (sim.height - radius * 2 - bubbleBounds.top - bubbleBounds.bottom) / Math.max(1, rows - 1);

    sim.nodes.forEach(function (node, index) {
      var col = index % columns;
      var row = Math.floor(index / columns);
      node.r = radius;
      node.x = clamp(24 + radius + col * gapX + (row % 2) * Math.min(14, gapX * 0.28), radius + 30, sim.width - radius - 30);
      node.y = clamp(20 + radius + row * gapY, radius + bubbleBounds.top, sim.height - radius - bubbleBounds.bottom);
      if (!keepVelocity) {
        node.vx = (Math.random() - 0.5) * 1.8;
        node.vy = (Math.random() - 0.5) * 1.2;
      }
      node.sleeping = false;
      node.el.style.width = radius * 2 + 'px';
      node.el.style.height = radius * 2 + 'px';
      paintBubbleNode(node);
    });
  }

  function shakeBubbles(power) {
    if (!bubbleSimulation) return;
    var force = typeof power === 'number' ? power : 1;
    bubbleSimulation.nodes.forEach(function (node) {
      var angle = Math.random() * Math.PI * 2;
      var strength = (14 + Math.random() * 18) * force;
      var floor = bubbleSimulation.height - bubbleBounds.bottom - node.r;
      var onFloor = node.y > floor - 10;
      node.sleeping = false;
      if (onFloor) {
        node.y = Math.min(node.y, floor - (10 + Math.random() * 36) * force);
      }
      node.vx += Math.cos(angle) * strength + (Math.random() - 0.5) * 8 * force;
      node.vy += Math.sin(angle) * strength - (onFloor ? (12 + Math.random() * 18) * force : 0);
    });
    wakeBubbles();
  }

  function wakeBubbles() {
    if (bubbleFrame || !bubbleSimulation) return;
    bubbleFrame = window.requestAnimationFrame(tickBubbles);
  }

  function stopBubblePhysics() {
    if (bubbleFrame) {
      window.cancelAnimationFrame(bubbleFrame);
      bubbleFrame = 0;
    }
    if (bubbleResizeHandler) {
      window.removeEventListener('resize', bubbleResizeHandler);
      bubbleResizeHandler = null;
    }
    activeBubbleDrag = null;
    bubbleSimulation = null;
  }

  function tickBubbles() {
    var sim = bubbleSimulation;
    var energy = 0;

    bubbleFrame = 0;
    if (!sim) return;

    resolveBubbleCollisions(sim);

    sim.nodes.forEach(function (node) {
      if (node.dragging) {
        node.sleeping = false;
        energy += 1;
        paintBubbleNode(node);
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

      if (node.x - node.r < bubbleBounds.left) {
        node.x = node.r + bubbleBounds.left;
        node.vx = Math.abs(node.vx) * sim.bounce;
      } else if (node.x + node.r > sim.width - bubbleBounds.right) {
        node.x = sim.width - node.r - bubbleBounds.right;
        node.vx = -Math.abs(node.vx) * sim.bounce;
      }

      if (node.y - node.r < bubbleBounds.top) {
        node.y = node.r + bubbleBounds.top;
        node.vy = Math.abs(node.vy) * sim.bounce;
      } else if (node.y + node.r > sim.height - bubbleBounds.bottom) {
        node.y = sim.height - node.r - bubbleBounds.bottom;
        node.vy = -Math.abs(node.vy) * sim.bounce;
        node.vx *= 0.965;
        if (Math.abs(node.vy) < 0.8) {
          node.vy = 0;
        }
        if (Math.abs(node.vx) < 0.08) {
          node.vx = 0;
        }
      }

      if (Math.abs(node.vx) < 0.025 && Math.abs(node.vy) < 0.025) {
        node.vx = 0;
        node.vy = 0;
        node.sleeping = true;
      }

      if (node.y + node.r >= sim.height - bubbleBounds.bottom && Math.abs(node.vx) < 0.08 && Math.abs(node.vy) < 0.08) {
        node.y = sim.height - node.r - bubbleBounds.bottom;
        node.vx = 0;
        node.vy = 0;
        node.sleeping = true;
      }

      energy += Math.abs(node.vx) + Math.abs(node.vy);
      paintBubbleNode(node);
    });

    positionBubbleTip();

    if (energy > sim.nodes.length * 0.08) {
      bubbleFrame = window.requestAnimationFrame(tickBubbles);
    }
  }

  function resolveBubbleCollisions(sim) {
    var cellSize = Math.max(64, sim.nodes.length ? sim.nodes[0].r * 2.8 : 72);
    var buckets = Object.create(null);

    sim.nodes.forEach(function (node, index) {
      var key = Math.floor(node.x / cellSize) + ':' + Math.floor(node.y / cellSize);
      if (!buckets[key]) {
        buckets[key] = [];
      }
      buckets[key].push(index);
    });

    sim.nodes.forEach(function (a, index) {
      var cellX = Math.floor(a.x / cellSize);
      var cellY = Math.floor(a.y / cellSize);

      for (var x = cellX - 1; x <= cellX + 1; x++) {
        for (var y = cellY - 1; y <= cellY + 1; y++) {
          var bucket = buckets[x + ':' + y];
          if (!bucket) continue;
          bucket.forEach(function (otherIndex) {
            if (otherIndex <= index) return;
            resolveBubblePair(a, sim.nodes[otherIndex]);
          });
        }
      }
    });
  }

  function resolveBubblePair(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var min = a.r + b.r + 1;
    var distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
    var overlap = min - distance;

    if (overlap <= 0) return;

    var nx = dx / distance;
    var ny = dy / distance;
    var push = overlap * 0.5;
    var impulse = ((b.vx - a.vx) * nx + (b.vy - a.vy) * ny) * 0.5;
    var movingImpact = Math.abs(impulse) > 0.035 || Math.abs(a.vx) + Math.abs(a.vy) + Math.abs(b.vx) + Math.abs(b.vy) > 0.18;

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
      return;
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

  function paintBubbleNode(node) {
    node.el.style.transform = 'translate3d(' + (node.x - node.r) + 'px,' + (node.y - node.r) + 'px,0) rotate(' + (node.vx * 2.8) + 'deg)';
  }

  function bindBubbleDrag(field, nodes) {
    nodes.forEach(function (node) {
      node.el.addEventListener('pointerdown', function (event) {
        var point;
        if (!bubbleSimulation || event.button !== 0) return;
        event.preventDefault();
        point = getBubblePoint(field, event);
        node.el.setPointerCapture(event.pointerId);
        node.dragging = true;
        node.sleeping = false;
        node.vx = 0;
        node.vy = 0;
        node.el.classList.add('is-dragging');
        hideBubbleTip();
        activeBubbleDrag = {
          node: node,
          pointerId: event.pointerId,
          offsetX: point.x - node.x,
          offsetY: point.y - node.y,
          lastX: point.x,
          lastY: point.y,
          startX: point.x,
          startY: point.y,
          lastTime: performance.now()
        };
        wakeBubbles();
      });
    });

    field.addEventListener('pointermove', function (event) {
      var drag = activeBubbleDrag;
      var point;
      var now;
      var dt;

      if (!drag || drag.pointerId !== event.pointerId || !bubbleSimulation) return;
      event.preventDefault();
      point = getBubblePoint(field, event);
      now = performance.now();
      dt = Math.max(16, now - drag.lastTime);
      drag.node.x = clamp(point.x - drag.offsetX, drag.node.r + bubbleBounds.left, bubbleSimulation.width - drag.node.r - bubbleBounds.right);
      drag.node.y = clamp(point.y - drag.offsetY, drag.node.r + bubbleBounds.top, bubbleSimulation.height - drag.node.r - bubbleBounds.bottom);
      drag.node.vx = (point.x - drag.lastX) / dt * 16;
      drag.node.vy = (point.y - drag.lastY) / dt * 16;
      drag.moved = drag.moved || Math.abs(point.x - drag.startX) + Math.abs(point.y - drag.startY) > 5;
      drag.lastX = point.x;
      drag.lastY = point.y;
      drag.lastTime = now;
      paintBubbleNode(drag.node);
      wakeBubbles();
    });

    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (type) {
      field.addEventListener(type, releaseBubbleDrag);
    });
  }

  function bindBubbleTip(field, tip) {
    if (!bubbleSimulation) return;
    bubbleSimulation.tip = tip;

    field.addEventListener('mouseover', function (event) {
      var node = event.target.closest('.links-bubble-node');
      if (!node || !field.contains(node) || node.classList.contains('is-dragging')) return;
      showBubbleTip(node);
    });

    field.addEventListener('mouseout', function (event) {
      var node = event.target.closest('.links-bubble-node');
      if (!node || node.contains(event.relatedTarget)) return;
      hideBubbleTip();
    });
  }

  function showBubbleTip(node) {
    var sim = bubbleSimulation;
    var tip = sim ? sim.tip : null;
    var preview = node.querySelector('.links-bubble-preview-card');

    if (!tip || !preview) return;
    tip.innerHTML = '';
    tip.appendChild(preview.cloneNode(true));
    tip.hidden = false;
    sim.tipNode = node;
    positionBubbleTip();
  }

  function hideBubbleTip() {
    if (!bubbleSimulation || !bubbleSimulation.tip) return;
    bubbleSimulation.tip.hidden = true;
    bubbleSimulation.tipNode = null;
  }

  function positionBubbleTip() {
    var sim = bubbleSimulation;
    var tip = sim ? sim.tip : null;
    var node = sim ? sim.tipNode : null;
    var shellRect;
    var nodeRect;
    var tipRect;
    var x;
    var y;

    if (!tip || !node || tip.hidden) return;
    shellRect = tip.parentElement.getBoundingClientRect();
    nodeRect = node.getBoundingClientRect();
    tipRect = tip.getBoundingClientRect();
    x = nodeRect.left - shellRect.left + nodeRect.width / 2;
    y = nodeRect.top - shellRect.top - tipRect.height - 12;
    tip.classList.toggle('is-below', y < 12);
    if (y < 12) {
      y = nodeRect.bottom - shellRect.top + 12;
    }
    x = clamp(x, tipRect.width / 2 + 12, shellRect.width - tipRect.width / 2 - 12);
    tip.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translateX(-50%)';
  }

  function releaseBubbleDrag(event) {
    var drag = activeBubbleDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.node.dragging = false;
    drag.node.el.classList.remove('is-dragging');
    if (drag.moved) {
      drag.node.el.setAttribute('data-dragged', 'true');
      setTimeout(function () {
        drag.node.el.removeAttribute('data-dragged');
      }, 80);
    }
    activeBubbleDrag = null;
    wakeBubbles();
  }

  function getBubblePoint(field, event) {
    var rect = field.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  bind(board, 'click', function (event) {
    var link = event.target.closest('.link-card[data-link], .links-bubble-node[data-link]');
    if (!link || !board.contains(link)) return;
    if (link.getAttribute('data-dragged') === 'true') {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    showLinkConfirm(link.href || link.getAttribute('data-link-url'), link.getAttribute('data-link-name') || '该站点');
  });

  filterButtons.forEach(function (button) {
    bind(button, 'click', function () {
      activeFilter = button.getAttribute('data-link-filter') || 'all';
      filterButtons.forEach(function (item) {
        item.classList.toggle('active', item === button);
      });
      applyFilters();
    });
  });

  if (searchInput) {
    bind(searchInput, 'input', applyFilters);
  }

  function clearSearch() {
    if (!searchInput) return;
    searchInput.value = '';
    applyFilters();
    searchInput.focus();
  }

  bind(searchClear, 'click', clearSearch);

  bind(document, 'keydown', function (event) {
    if (event.key === 'Escape' && confirmModal && confirmModal.classList.contains('active')) {
      closeLinkConfirm();
    }
  });

  bind(confirmModal, 'click', function (event) {
    if (event.target === confirmModal) {
      closeLinkConfirm();
    }
  });

  applyMode(activeMode);
  applyFilters();

  window.__linksGetVisibleCards = function () {
    return visibleCards.slice();
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLinksPage);
} else {
  initLinksPage();
}

function showLinkConfirm(url, name) {
  currentLinkUrl = url;

  var modal = document.getElementById('linkConfirmModal');
  var targetName = document.querySelector('.link-target-name');
  var confirmButton = document.querySelector('.link-confirm-cta');

  if (targetName) {
    targetName.textContent = name;
  }

  if (modal) {
    modal.classList.add('active');
  }

  var board = document.querySelector('[data-links-board]');
  if (board) {
    board.classList.add('links-board-paused');
  }

  if (confirmButton) {
    confirmButton.focus();
  }
}

function confirmLinkVisit() {
  if (!currentLinkUrl) return;
  window.open(currentLinkUrl, '_blank', 'noopener,noreferrer');
  closeLinkConfirm();
}

function closeLinkConfirm() {
  var modal = document.getElementById('linkConfirmModal');
  var board = document.querySelector('[data-links-board]');
  currentLinkUrl = '';
  if (modal) {
    modal.classList.remove('active');
  }
  if (board) {
    board.classList.remove('links-board-paused');
  }
}

function visitRandomLink() {
  var links = typeof window.__linksGetVisibleCards === 'function'
    ? window.__linksGetVisibleCards()
    : Array.prototype.slice.call(document.querySelectorAll('.link-card[data-link]'));

  if (links.length > 0) {
    var randomIndex = Math.floor(Math.random() * links.length);
    var link = links[randomIndex];
    var name = link.getAttribute('data-link-name') || (link.querySelector('.link-name') || {}).textContent || '该站点';
    showLinkConfirm(link.href, name);
  }
}
