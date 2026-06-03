/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-03 10:28:07
 * Fingerprint: 18f8d0015be24d2b
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Sidebar Sticky 功能
 */
(function() {
  'use strict';

  // 追踪当前页面的 scroll 监听器，PJAX 切换时清理
  var _stickyScrollHandlers = [];

  function initStickySidebar() {
    // 查找所有需要sticky的sidebar
    const sidebars = document.querySelectorAll('.post-sidebar, .archive-sidebar, .tags-stats-card');
    
    if (!sidebars.length) return;

    // 获取header高度
    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 64;
    const topOffset = headerHeight + 16;

    sidebars.forEach(function(sidebar) {
      // 跳过已经初始化的
      if (sidebar.dataset.stickyInit === 'true') return;
      sidebar.dataset.stickyInit = 'true';

      // 获取父容器
      const parent = sidebar.closest('.post-layout, .archive-layout, .tags-layout');
      if (!parent) return;

      // 确保父容器有相对定位
      parent.style.position = 'relative';

      // 记录原始位置和宽度
      const originalWidth = sidebar.offsetWidth;
      const sidebarRect = sidebar.getBoundingClientRect();
      const originalLeft = sidebarRect.left;
      const originalTop = sidebarRect.top + window.pageYOffset;

      let isFixed = false;

      function updateSidebar() {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const parentRect = parent.getBoundingClientRect();
        const parentTop = parentRect.top + scrollY;
        const parentBottom = parentRect.bottom + scrollY;
        const sidebarHeight = sidebar.offsetHeight;

        // 计算sidebar应该开始固定的位置
        const startFixed = originalTop - topOffset;
        // 计算sidebar应该停止固定的位置
        const stopFixed = parentBottom - sidebarHeight;

        if (scrollY > startFixed && scrollY < stopFixed - topOffset) {
          // 固定在顶部
          if (!isFixed) {
            sidebar.style.position = 'fixed';
            sidebar.style.top = topOffset + 'px';
            sidebar.style.left = originalLeft + 'px';
            sidebar.style.width = originalWidth + 'px';
            sidebar.style.zIndex = '50';
            isFixed = true;
          }
        } else if (scrollY >= stopFixed - topOffset) {
          // 停在底部（使用absolute定位）
          sidebar.style.position = 'absolute';
          sidebar.style.top = (stopFixed - parentTop) + 'px';
          sidebar.style.left = '';
          sidebar.style.right = '0';
          sidebar.style.width = originalWidth + 'px';
          sidebar.style.zIndex = '50';
          isFixed = false;
        } else {
          // 恢复原始位置
          if (isFixed || sidebar.style.position === 'absolute') {
            sidebar.style.position = '';
            sidebar.style.top = '';
            sidebar.style.left = '';
            sidebar.style.right = '';
            sidebar.style.width = '';
            sidebar.style.zIndex = '';
            isFixed = false;
          }
        }
      }

      // 使用 requestAnimationFrame 优化性能
      let ticking = false;
      function onScroll() {
        if (!ticking) {
          requestAnimationFrame(function() {
            updateSidebar();
            ticking = false;
          });
          ticking = true;
        }
      }

      // 监听滚动（追踪以便清理）
      window.addEventListener('scroll', onScroll, { passive: true });
      _stickyScrollHandlers.push(onScroll);

      // 初始化
      setTimeout(updateSidebar, 100);
    });
  }

  // 重置所有sidebar，并清理 scroll 监听器
  function resetSidebars() {
    // 移除所有 scroll 监听器
    _stickyScrollHandlers.forEach(function(fn) {
      window.removeEventListener('scroll', fn);
    });
    _stickyScrollHandlers = [];

    const sidebars = document.querySelectorAll('.post-sidebar, .archive-sidebar, .tags-stats-card');
    sidebars.forEach(function(sidebar) {
      sidebar.style.position = '';
      sidebar.style.top = '';
      sidebar.style.left = '';
      sidebar.style.right = '';
      sidebar.style.width = '';
      sidebar.style.zIndex = '';
      sidebar.dataset.stickyInit = '';
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initStickySidebar, 200);
    });
  } else {
    setTimeout(initStickySidebar, 200);
  }

  // 处理窗口大小变化
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      resetSidebars();
      initStickySidebar();
    }, 250);
  });

  // 处理 bfcache（浏览器前进后退缓存）
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      resetSidebars();
      setTimeout(initStickySidebar, 200);
    }
  });

  // 处理页面可见性变化
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      resetSidebars();
      setTimeout(initStickySidebar, 200);
    }
  });

  // 暴露给 PJAX 调用
  window.initSidebarSticky = function() {
    resetSidebars();
    setTimeout(initStickySidebar, 200);
  };
})();
