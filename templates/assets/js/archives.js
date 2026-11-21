/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-11-21 16:50:51
 * Fingerprint: aa52ad889ce25ad2
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-08-31 17:36:30
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

function sortPinnedPosts() {
  const archiveList = document.querySelector('.archive-list');
  if (!archiveList) return;
  
  const cards = Array.from(archiveList.querySelectorAll('.archive-card'));
  if (cards.length === 0) return;

  const pinnedCards = cards.filter(card => card.classList.contains('pinned'));
  const normalCards = cards.filter(card => !card.classList.contains('pinned'));

  if (pinnedCards.length === 0) return;

  archiveList.innerHTML = '';

  const fragment = document.createDocumentFragment();
  pinnedCards.forEach(card => fragment.appendChild(card));
  normalCards.forEach(card => fragment.appendChild(card));
  archiveList.appendChild(fragment);
}

function getCommentTargetName(comment) {
  if (!comment) return '';
  var spec = comment.spec || {};
  var ref = spec.subjectRef || spec.subject || spec.targetRef || spec.commentSubject || {};
  return ref.name || spec.name || '';
}

async function loadLatestComments() {
  const container = document.getElementById('latestComments');
  if (!container) return;

  const commentCount = parseInt(container.closest('.sidebar-widget').getAttribute('data-comment-count') || '3');

  try {
    const allComments = [];
    const postPermalinkMap = new Map();

    const postsResponse = await fetch(`/apis/api.content.halo.run/v1alpha1/posts?page=1&size=20&sort=metadata.creationTimestamp,desc`);
    let recentPosts = [];
    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      recentPosts = postsData.items || [];
      recentPosts.forEach(post => {
        if (post && post.metadata && post.metadata.name) {
          postPermalinkMap.set(post.metadata.name, post.status && post.status.permalink ? post.status.permalink : '/');
        }
      });
    }

    if (recentPosts.length > 0) {
      const commentTasks = recentPosts.slice(0, 12).map(post => {
        const params = new URLSearchParams({
          group: 'content.halo.run',
          kind: 'Post',
          name: post.metadata.name,
          page: '1',
          size: '5',
          version: 'v1alpha1',
          withReplies: 'false'
        });
        return fetch(`/apis/api.halo.run/v1alpha1/comments?${params.toString()}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => ({ post: post, data: data }))
          .catch(() => null);
      });

      const results = await Promise.all(commentTasks);
      results.forEach(result => {
        if (!result || !result.data || !result.data.items || result.data.items.length === 0) return;
        result.data.items.forEach(comment => {
          comment._postPermalink = result.post && result.post.status && result.post.status.permalink ? result.post.status.permalink : '/';
          allComments.push(comment);
        });
      });
    }

    allComments.sort((a, b) => {
      const timeA = new Date(a.metadata.creationTimestamp).getTime();
      const timeB = new Date(b.metadata.creationTimestamp).getTime();
      return timeB - timeA;
    });

    const latestComments = allComments.slice(0, commentCount);

    if (latestComments.length > 0) {
      const commentItems = await Promise.all(latestComments.map(async comment => {
        const author = comment.owner?.displayName || '匿名';
        const contentHTML = comment.spec?.content || '';
        const content = htmlToText(contentHTML);
        const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
        const postUrl = comment._postPermalink || '/';

        const avatar = window.SerenityCommentAvatar
          ? await window.SerenityCommentAvatar.resolve(comment)
          : '';
        const safePostUrl = window.SerenityCommentAvatar && typeof window.SerenityCommentAvatar.sanitizeUrl === 'function'
          ? window.SerenityCommentAvatar.sanitizeUrl(postUrl)
          : '';

        const itemEl = document.createElement('a');
        itemEl.href = `${safePostUrl || '/'}#comment-${encodeURIComponent(comment.metadata.name || '')}`;
        itemEl.className = 'comment-item';

        if (avatar) {
          const avatarEl = document.createElement('img');
          avatarEl.className = 'comment-avatar';
          avatarEl.src = avatar;
          avatarEl.alt = author;
          avatarEl.addEventListener('error', function () {
            avatarEl.style.display = 'none';
          }, { once: true });
          itemEl.appendChild(avatarEl);
        }

        const bodyEl = document.createElement('div');
        bodyEl.className = 'comment-body';
        const authorEl = document.createElement('span');
        authorEl.className = 'comment-author';
        authorEl.textContent = author;
        const textEl = document.createElement('p');
        textEl.className = 'comment-text';
        textEl.textContent = shortContent;
        bodyEl.append(authorEl, textEl);
        itemEl.appendChild(bodyEl);
        return itemEl;
      }));
      container.replaceChildren(...commentItems);
    } else {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'comment-empty';
      emptyEl.textContent = '暂无评论';
      container.replaceChildren(emptyEl);
    }
  } catch (error) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'comment-empty';
    emptyEl.textContent = '暂无评论';
    container.replaceChildren(emptyEl);
  }
}

async function loadHitokoto() {
  const widget = document.getElementById('hitokoto-widget');
  const textEl = document.getElementById('hitokoto-text');
  const fromEl = document.getElementById('hitokoto-from');
  
  if (!textEl || !widget) return;
  
  const apiUrl = widget.getAttribute('data-api') || 'https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=i&c=k';
  
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.hitokoto) {
        textEl.textContent = data.hitokoto;
        if (fromEl && data.from) {
          fromEl.textContent = `—— ${data.from}`;
        }
      }
    }
  } catch (error) {

  }
}

function truncateArchiveMeta() {
  var isMobile = window.innerWidth <= 768;
  document.querySelectorAll('.archive-card-meta').forEach(function (meta) {

    var oldEllipsis = meta.querySelector('.archive-meta-ellipsis');
    if (oldEllipsis) oldEllipsis.remove();
    meta.querySelectorAll('.archive-category, .archive-tag').forEach(function (el) {
      el.style.display = '';
    });
    if (!isMobile) return;

    var items = Array.from(meta.querySelectorAll('.archive-category, .archive-tag'));
    if (items.length <= 3) return;
    for (var i = 3; i < items.length; i++) {
      items[i].style.display = 'none';
    }

    var lastVisible = items[2];
    var dot = document.createElement('span');
    dot.className = 'archive-meta-ellipsis';
    dot.textContent = '...';
    lastVisible.parentNode.insertBefore(dot, lastVisible.nextSibling);
  });
}

function applyArchiveSidebarOrder() {
  const sidebar = document.querySelector('.archive-sidebar');
  const orderSource = document.getElementById('archiveSidebarOrder');
  if (!sidebar || !orderSource) return;

  const widgets = new Map();
  sidebar.querySelectorAll(':scope > [data-sidebar-component]').forEach(function (widget) {
    widgets.set(widget.dataset.sidebarComponent, widget);
  });

  const orderedWidgets = [];
  const usedComponents = new Set();
  orderSource.querySelectorAll('[data-sidebar-order]').forEach(function (item) {
    const component = item.dataset.sidebarOrder;
    const widget = widgets.get(component);
    if (!widget || usedComponents.has(component)) return;
    usedComponents.add(component);
    orderedWidgets.push(widget);
  });

  widgets.forEach(function (widget, component) {
    if (!usedComponents.has(component)) orderedWidgets.push(widget);
  });

  orderSource.remove();
  sidebar.append(...orderedWidgets);
}

function initArchiveActivityCalendar() {
  const root = document.getElementById('archiveActivityCalendar');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';

  const monthLabel = root.querySelector('.activity-calendar-month');
  const daysGrid = root.querySelector('.activity-calendar-days');
  const monthLabels = root.querySelector('.activity-calendar-month-labels');
  const heatmap = root.querySelector('.activity-calendar-heatmap');
  const tooltip = root.querySelector('.activity-calendar-tooltip');
  if (!monthLabel || !daysGrid || !monthLabels || !heatmap || !tooltip) return;

  const includePosts = root.dataset.includePosts !== 'false';
  const includeMoments = root.dataset.includeMoments !== 'false' && root.dataset.momentsAvailable === 'true';
  const includePhotos = root.dataset.includePhotos !== 'false' && root.dataset.photosAvailable === 'true';
  const activityByDate = new Map();
  const today = new Date();
  const state = {
    viewYear: today.getFullYear(),
    viewMonth: today.getMonth(),
    selectedKey: toDateKey(today)
  };
  const abortController = 'AbortController' in window ? new AbortController() : null;

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function normalizeDate(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : toDateKey(date);
  }

  function parseDateKey(key) {
    const parts = key.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function addActivity(value, type) {
    const key = normalizeDate(value);
    if (!key) return;
    const counts = activityByDate.get(key) || { post: 0, moment: 0, photo: 0, total: 0 };
    if (!Object.prototype.hasOwnProperty.call(counts, type)) return;
    counts[type] += 1;
    counts.total += 1;
    activityByDate.set(key, counts);
  }

  function getLevel(count, max) {
    if (!count || !max) return 0;
    return Math.max(1, Math.min(4, Math.ceil((count / max) * 4)));
  }

  function getMonthMaximum(year, month) {
    let maximum = 0;
    const prefix = `${year}-${pad(month + 1)}-`;
    activityByDate.forEach(function (counts, key) {
      if (key.startsWith(prefix)) maximum = Math.max(maximum, counts.total);
    });
    return maximum;
  }

  function renderCalendar() {
    monthLabel.textContent = `${state.viewYear}年${state.viewMonth + 1}月`;
    daysGrid.replaceChildren();

    const firstOffset = (new Date(state.viewYear, state.viewMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
    const monthMaximum = getMonthMaximum(state.viewYear, state.viewMonth);

    const visibleCellCount = Math.ceil((firstOffset + daysInMonth) / 7) * 7;
    for (let index = 0; index < visibleCellCount; index += 1) {
      const day = index - firstOffset + 1;
      if (day < 1 || day > daysInMonth) {
        const placeholder = document.createElement('span');
        placeholder.className = 'activity-calendar-day-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        daysGrid.appendChild(placeholder);
        continue;
      }

      const date = new Date(state.viewYear, state.viewMonth, day);
      const key = toDateKey(date);
      const counts = activityByDate.get(key);
      const count = counts ? counts.total : 0;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `activity-calendar-day activity-level-${getLevel(count, monthMaximum)}`;
      button.textContent = String(day);
      button.dataset.date = key;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', `${state.viewYear}年${state.viewMonth + 1}月${day}日，${count}次内容更新`);
      if (key === toDateKey(today)) button.classList.add('is-today');
      if (key === state.selectedKey) {
        button.classList.add('is-selected');
        button.setAttribute('aria-selected', 'true');
      }
      button.addEventListener('click', function () {
        state.selectedKey = key;
        renderCalendar();
      });
      daysGrid.appendChild(button);
    }
  }

  function bucketRange(month, period) {
    const start = period * 10 + 1;
    const end = period === 2 ? new Date(state.viewYear, month + 1, 0).getDate() : start + 9;
    return { start: start, end: end };
  }

  function bucketCounts(month, period) {
    const range = bucketRange(month, period);
    const result = { post: 0, moment: 0, photo: 0, total: 0 };
    for (let day = range.start; day <= range.end; day += 1) {
      const counts = activityByDate.get(toDateKey(new Date(state.viewYear, month, day)));
      if (!counts) continue;
      result.post += counts.post;
      result.moment += counts.moment;
      result.photo += counts.photo;
      result.total += counts.total;
    }
    return result;
  }

  function tooltipText(bucket, periodName) {
    const parts = [];
    if (includePosts) parts.push(`文章 ${bucket.counts.post} 篇`);
    if (includeMoments) parts.push(`瞬间 ${bucket.counts.moment} 次更新`);
    if (includePhotos) parts.push(`图片 ${bucket.counts.photo} 张`);
    const detail = parts.length ? parts.join(' · ') : '暂无内容更新';
    return `${bucket.month + 1}月${periodName} · ${detail}`;
  }

  function showHeatmapTooltip(cell, text) {
    tooltip.textContent = text;
    tooltip.hidden = false;
    const rootRect = root.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const left = cellRect.left - rootRect.left + (cellRect.width / 2) - (tooltip.offsetWidth / 2);
    const maxLeft = root.clientWidth - tooltip.offsetWidth - 8;
    tooltip.style.left = `${Math.max(8, Math.min(maxLeft, left))}px`;
    tooltip.style.top = `${cellRect.top - rootRect.top - tooltip.offsetHeight - 7}px`;
  }

  function hideHeatmapTooltip() {
    tooltip.hidden = true;
  }

  function renderHeatmap() {
    monthLabels.replaceChildren();
    heatmap.replaceChildren();
    const buckets = [];

    for (let month = 0; month < 12; month += 1) {
      const label = document.createElement('span');
      label.textContent = String(month + 1);
      monthLabels.appendChild(label);
      for (let period = 0; period < 3; period += 1) {
        buckets.push({ month: month, period: period, counts: bucketCounts(month, period) });
      }
    }

    const maximum = buckets.reduce(function (max, bucket) {
      return Math.max(max, bucket.counts.total);
    }, 0);
    const periodNames = ['上旬', '中旬', '下旬'];

    buckets.forEach(function (bucket) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `activity-calendar-heat-cell activity-level-${getLevel(bucket.counts.total, maximum)}`;
      cell.setAttribute('role', 'gridcell');
      const details = tooltipText(bucket, periodNames[bucket.period]);
      cell.setAttribute('aria-label', `${state.viewYear}年${details}`);
      cell.addEventListener('mouseenter', function () {
        showHeatmapTooltip(cell, details);
      });
      cell.addEventListener('mouseleave', hideHeatmapTooltip);
      cell.addEventListener('focus', function () {
        showHeatmapTooltip(cell, details);
      });
      cell.addEventListener('blur', hideHeatmapTooltip);
      cell.addEventListener('click', function () {
        hideHeatmapTooltip();
        const range = bucketRange(bucket.month, bucket.period);
        state.viewMonth = bucket.month;
        state.selectedKey = toDateKey(new Date(state.viewYear, bucket.month, range.start));
        renderAll();
      });
      heatmap.appendChild(cell);
    });
  }

  function renderAll() {
    renderCalendar();
    renderHeatmap();
  }

  function moveMonth(offset) {
    const selected = parseDateKey(state.selectedKey);
    const next = new Date(state.viewYear, state.viewMonth + offset, 1);
    const nextDay = Math.min(selected.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate());
    state.viewYear = next.getFullYear();
    state.viewMonth = next.getMonth();
    state.selectedKey = toDateKey(new Date(state.viewYear, state.viewMonth, nextDay));
    renderAll();
  }

  root.querySelectorAll('[data-calendar-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      const action = button.dataset.calendarAction;
      if (action === 'previous') moveMonth(-1);
      if (action === 'next') moveMonth(1);
      if (action === 'today') {
        state.viewYear = today.getFullYear();
        state.viewMonth = today.getMonth();
        state.selectedKey = toDateKey(today);
        renderAll();
      }
    });
  });

  root.querySelectorAll('.archive-activity-seed [data-activity-date]').forEach(function (item) {
    addActivity(item.dataset.activityDate, item.dataset.activityType);
  });

  renderAll();

  async function loadPosts() {
    if (!includePosts) return;
    let page = 1;
    const pageSize = 100;
    try {
      while (true) {
        const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
        const response = await fetch(`/apis/api.content.halo.run/v1alpha1/posts?${params.toString()}`, {
          signal: abortController ? abortController.signal : undefined
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const items = data && Array.isArray(data.items) ? data.items : [];
        items.forEach(function (post) {
          addActivity(post && post.spec ? post.spec.publishTime : '', 'post');
        });

        const totalPages = Number(data && data.totalPages || 0);
        const hasNext = data && data.hasNext !== undefined
          ? data.hasNext === true
          : (totalPages > 0 ? page < totalPages : items.length === pageSize);
        if (!hasNext) break;
        page += 1;
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return;
    } finally {
      if (document.documentElement.contains(root)) renderAll();
    }
  }

  if (abortController && typeof window.__pjaxOnLeave === 'function') {
    window.__pjaxOnLeave(function () {
      abortController.abort();
    });
  }
  loadPosts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyArchiveSidebarOrder();
    sortPinnedPosts();
    loadLatestComments();
    loadHitokoto();
    truncateArchiveMeta();
    initArchiveActivityCalendar();
  });
} else {
  applyArchiveSidebarOrder();
  sortPinnedPosts();
  loadLatestComments();
  loadHitokoto();
  truncateArchiveMeta();
  initArchiveActivityCalendar();
}
