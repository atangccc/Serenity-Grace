/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-20 19:41:39
 * Fingerprint: f3a918453bf9de13
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

var PAGE_SIZE = 10;
var currentPage = 1;
var totalPages = 1;
var allFriends = [];

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url, fallback) {
  fallback = fallback || '#';
  if (typeof url !== 'string') return fallback;
  var trimmed = url.trim();
  if (!trimmed) return fallback;
  var lower = trimmed.toLowerCase();
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/')
  ) return trimmed;
  return fallback;
}

function init() {
  // 幂等：重入时重置分页状态
  currentPage = 1;
  totalPages = 1;
  allFriends = [];
  fetch('/apis/api.link.halo.run/v1alpha1/linkfeeds?limit=500')
    .then(function(res) {
      if (res.status === 404 || res.status === 403) {
        showPluginNotice();
        return null;
      }
      if (!res.ok) {
        showEmpty();
        return null;
      }
      return res.json();
    })
    .then(function(data) {
      if (!data) return;
      allFriends = (data.items || []);
      if (allFriends.length === 0) {
        showEmpty();
        return;
      }
      totalPages = Math.ceil(allFriends.length / PAGE_SIZE);
      document.getElementById('totalCount').textContent = allFriends.length;
      document.getElementById('totalPages').textContent = totalPages;
      document.getElementById('pagination').style.display = 'flex';
      renderPage(1);
    })
    .catch(function() {
      showPluginNotice();
    });
}

function showPluginNotice() {
  var el = document.getElementById('pluginNotice');
  if (el) el.style.display = 'flex';
}

function showEmpty() {
  var el = document.getElementById('emptyState');
  if (el) {
    el.style.display = 'flex';
    el.classList.remove('aos-animate');
    void el.offsetHeight;
    if (typeof AOS !== 'undefined') AOS.refresh();
  }
}

function renderPage(page) {
  currentPage = page;
  var start = (page - 1) * PAGE_SIZE;
  var pageData = allFriends.slice(start, start + PAGE_SIZE);

  var grid = document.getElementById('friendsCircleGrid');
  grid.innerHTML = '';

  var fragment = document.createDocumentFragment();
  pageData.forEach(function(item, index) {
    fragment.appendChild(createCard(item, start + index));
  });
  grid.appendChild(fragment);

  updatePagination();

  if (window.__lenis) {
    window.__lenis.scrollTo(0, { duration: 1.2 });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function createCard(item, index) {
  var card = document.createElement('div');
  card.className = 'friend-post-card';
  card.setAttribute('data-aos', 'fade-up');
  card.setAttribute('data-aos-delay', (index % PAGE_SIZE) * 50);

  var date = item && item.publishedAt ? new Date(item.publishedAt) : null;
  var isValidDate = date && !isNaN(date.getTime());
  var formattedDate = isValidDate
    ? date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0') + ' ' +
      String(date.getHours()).padStart(2, '0') + ':' +
      String(date.getMinutes()).padStart(2, '0')
    : '--';

  var authorUrl = sanitizeUrl(item && item.authorUrl, '#');
  var postLink = sanitizeUrl(item && item.url, '#');
  var logoUrl = sanitizeUrl(item && item.authorLogo, '');
  var authorName = (item && item.author) || '未知作者';
  var fallbackAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(authorName);
  var avatarSrc = logoUrl || fallbackAvatar;
  var safeAuthor = escapeHtml(authorName);
  var safeTitle = escapeHtml((item && item.title) || '无标题');
  var safeDescription = escapeHtml((item && item.summary) || '暂无描述');
  var safeFormattedDate = escapeHtml(formattedDate);
  var safeAvatarSrc = escapeHtml(avatarSrc);
  var safeFallbackAvatar = escapeHtml(fallbackAvatar);

  card.innerHTML =
    '<div class="friend-post-author">' +
      '<a href="' + authorUrl + '" target="_blank" rel="noopener noreferrer" class="friend-author-link">' +
        '<img src="' + safeAvatarSrc + '"' +
             ' data-fallback="' + safeFallbackAvatar + '"' +
             ' alt="' + safeAuthor + '"' +
             ' class="friend-author-avatar"' +
             ' loading="lazy"' +
             ' referrerpolicy="no-referrer"' +
             ' onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback=\'\';}else{this.style.display=\'none\';}">' +
        '<div class="friend-author-info">' +
          '<span class="friend-author-name">' + safeAuthor + '</span>' +
          '<time class="friend-post-time">' + safeFormattedDate + '</time>' +
        '</div>' +
      '</a>' +
    '</div>' +
    '<div class="friend-post-content">' +
      '<h3 class="friend-post-title">' + safeTitle + '</h3>' +
      '<p class="friend-post-desc">' + safeDescription + '</p>' +
    '</div>' +
    '<a href="' + postLink + '" target="_blank" rel="noopener noreferrer" class="friend-post-arrow">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
        '<path d="M9 18l6-6-6-6"/>' +
      '</svg>' +
    '</a>';

  return card;
}

function updatePagination() {
  document.getElementById('currentPage').textContent = currentPage;

  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  if (currentPage <= 1) {
    prevBtn.classList.add('pagination-arrow-disabled');
    prevBtn.disabled = true;
  } else {
    prevBtn.classList.remove('pagination-arrow-disabled');
    prevBtn.disabled = false;
  }

  if (currentPage >= totalPages) {
    nextBtn.classList.add('pagination-arrow-disabled');
    nextBtn.disabled = true;
  } else {
    nextBtn.classList.remove('pagination-arrow-disabled');
    nextBtn.disabled = false;
  }
}

function prevPage() {
  if (currentPage > 1) renderPage(currentPage - 1);
}

function nextPage() {
  if (currentPage < totalPages) renderPage(currentPage + 1);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
