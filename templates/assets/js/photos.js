/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-14 20:38:41
 * Fingerprint: c77ef69c22818532
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

// 图库页面 - 筛选、灯箱、加载动画

function initPhotosPage() {
  'use strict';

  if (window.__photosCleanup) {
    window.__photosCleanup();
  }

  var filterBtns = document.querySelectorAll('.filter-btn');
  var photoItems = document.querySelectorAll('.photo-item');
  var masonry = document.getElementById('photos-masonry');

  if (!masonry) return;

  // ========== 分组筛选 ==========
  function handleFilter(e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    var group = btn.dataset.group;
    filterBtns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    photoItems.forEach(function(item) {
      if (group === 'all' || item.dataset.group === group) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  }

  var filterContainer = document.querySelector('.photos-filter');
  if (filterContainer) {
    filterContainer.addEventListener('click', handleFilter);
  }

  // ========== 图片加载淡入 ==========
  var imgs = masonry.querySelectorAll('.photo-wrapper img');
  imgs.forEach(function(img) {
    var w = img.closest('.photo-wrapper');
    if (img.complete && img.naturalHeight > 0) {
      if (w) w.classList.add('img-loaded');
    } else {
      img.addEventListener('load', function() {
        if (w) w.classList.add('img-loaded');
      });
      img.addEventListener('error', function() {
        if (w) w.classList.add('img-loaded');
      });
    }
  });

  // ========== 灯箱 ==========
  if (!window.__photosLightbox && typeof SerenityLightbox !== 'undefined') {
    window.__photosLightbox = SerenityLightbox.create({
      className: 'photo-lightbox',
      delegateSelector: '.photo-wrapper img'
    });
  }

  // ========== 清理 ==========
  window.__photosCleanup = function() {
    if (filterContainer) {
      filterContainer.removeEventListener('click', handleFilter);
    }
    window.__photosCleanup = null;
  };
}

// 首次加载初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhotosPage);
} else {
  initPhotosPage();
}
