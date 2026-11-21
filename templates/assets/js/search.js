/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-11-21 16:48:16
 * Fingerprint: 07c0cfc71865f1be
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

(function() {
  'use strict';
  
  var postsData = [];
  var searchTimeout = null;
  var dataLoaded = false;
  var loadPromise = null;
  var lastFocusedElement = null;
  var POSTS_PAGE_SIZE = 100;
  
  // 缓存 DOM 元素
  var modalEl, inputEl, resultsEl, searchBoxEl;
  
  window.openSearchModal = function() {
    if (modalEl && inputEl) {
      if (!modalEl.classList.contains('active')) {
        lastFocusedElement = document.activeElement;
      }
      modalEl.classList.add('active');
      modalEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function() { inputEl.focus(); });
      // 打开搜索框时加载数据
      if (!dataLoaded) {
        loadPostsData();
      }
    }
  };
  
  window.closeSearchModal = function() {
    if (modalEl && inputEl && resultsEl) {
      var wasOpen = modalEl.classList.contains('active');
      modalEl.classList.remove('active');
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      inputEl.value = '';
      resultsEl.innerHTML = '<div class="search-empty">输入关键词开始搜索<\/div>';
      if (wasOpen && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
      lastFocusedElement = null;
    }
  };
  
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  
  function highlightKeyword(text, keyword) {
    if (!text || !keyword) return escapeHtml(text) || '';
    try {
      var escaped = escapeHtml(text);
      var regex = new RegExp('(' + escapeRegExp(keyword) + ')', 'gi');
      return escaped.replace(regex, '<mark>$1<\/mark>');
    } catch (e) {
      return escapeHtml(text);
    }
  }
  
  function searchPosts(keyword) {
    if (!keyword) return [];
    var lowerKeyword = keyword.toLowerCase();
    return postsData.filter(function(post) {
      var title = (post.title || '').toLowerCase();
      var excerpt = (post.excerpt || '').toLowerCase();
      return title.includes(lowerKeyword) || excerpt.includes(lowerKeyword);
    });
  }
  
  function mapPosts(items) {
    return items.map(function(post) {
      return {
        title: post.spec && post.spec.title || '',
        excerpt: post.status && post.status.excerpt || '',
        url: post.status && post.status.permalink || '#'
      };
    });
  }

  function fetchPostsPage(page) {
    var params = new URLSearchParams({
      page: String(page),
      size: String(POSTS_PAGE_SIZE)
    });
    return fetch('/apis/api.content.halo.run/v1alpha1/posts?' + params.toString())
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load posts');
        return response.json();
      })
      .then(function(data) {
        var items = data && Array.isArray(data.items) ? data.items : [];
        postsData = postsData.concat(mapPosts(items));

        var totalPages = Number(data && data.totalPages || 0);
        var hasNext = data && data.hasNext === true;
        if (data && data.hasNext === undefined) {
          hasNext = totalPages > 0 ? page < totalPages : items.length === POSTS_PAGE_SIZE;
        }
        return hasNext ? fetchPostsPage(page + 1) : postsData;
      });
  }

  function loadPostsData() {
    if (dataLoaded) return Promise.resolve(postsData);
    if (loadPromise) return loadPromise;

    postsData = [];
    loadPromise = fetchPostsPage(1).then(function() {
      dataLoaded = true;
      return postsData;
    }, function() {
      postsData = [];
      dataLoaded = false;
      loadPromise = null;
      return postsData;
    });
    return loadPromise;
  }
  
  function handleSearch(keyword) {
    if (!keyword) {
      resultsEl.innerHTML = '<div class="search-empty">输入关键词开始搜索<\/div>';
      return;
    }

    if (!dataLoaded) {
      resultsEl.innerHTML = '<div class="search-loading">正在加载文章...<\/div>';
      loadPostsData().then(function() {
        var currentKeyword = inputEl ? inputEl.value.trim() : '';
        if (!currentKeyword) return;
        if (dataLoaded) handleSearch(currentKeyword);
        else resultsEl.innerHTML = '<div class="search-empty">文章加载失败，请稍后重试<\/div>';
      });
      return;
    }
    
    var matchedPosts = searchPosts(keyword);
    
    if (matchedPosts.length === 0) {
      resultsEl.innerHTML = '<div class="search-empty">未找到相关文章<\/div>';
      return;
    }
    
    var html = matchedPosts.map(function(post) {
      return '<a href="' + escapeHtml(post.url) + '" class="search-item">' +
        '<div class="search-item-title">' + highlightKeyword(post.title, keyword) + '<\/div>' +
        '<div class="search-item-excerpt">' + highlightKeyword(post.excerpt, keyword) + '<\/div>' +
      '<\/a>';
    }).join('');
    
    resultsEl.innerHTML = html;
  }
  
  function init() {
    // 缓存 DOM 元素
    modalEl = document.getElementById('search-modal');
    inputEl = document.getElementById('search-input');
    resultsEl = document.getElementById('search-results');
    searchBoxEl = document.getElementById('search-box');
    
    if (searchBoxEl) {
      searchBoxEl.addEventListener('click', openSearchModal);
    }
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeSearchModal();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Tab' && modalEl && modalEl.classList.contains('active')) {
        var focusable = Array.prototype.slice.call(
          modalEl.querySelectorAll('input, button, a[href], [tabindex]:not([tabindex="-1"])')
        ).filter(function(element) { return !element.disabled && element.offsetParent !== null; });
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    
    // 搜索输入防抖
    if (inputEl) {
      inputEl.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        var keyword = e.target.value.trim();
        
        if (!keyword) {
          resultsEl.innerHTML = '<div class="search-empty">输入关键词开始搜索<\/div>';
          return;
        }
        
        resultsEl.innerHTML = '<div class="search-loading">搜索中...<\/div>';
        searchTimeout = setTimeout(function() { handleSearch(keyword); }, 200);
      });
    }
  }
  
  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
