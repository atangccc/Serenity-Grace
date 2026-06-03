/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-03 10:28:07
 * Fingerprint: 18f8d0015be24d2b
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * 欢迎页控制脚本
 */
(function() {
  'use strict';
  
  // 检查是否已经访问过（本次会话）
  var hasVisited = sessionStorage.getItem('serenity-welcomed');
  
  // 吉祥物对话列表 - 支持后台配置
  var mascotSayings = (function() {
    // 从后台配置读取（已在 layout.html 中设置）
    if (window.WELCOME_SAYINGS && Array.isArray(window.WELCOME_SAYINGS) && window.WELCOME_SAYINGS.length > 0) {
      return window.WELCOME_SAYINGS;
    }
    // 默认语录
    return [
      '点击任意处进入哦~',
      '欢迎欢迎！快进来吧~',
      '嘿！点我点我~',
      '准备好探索了吗？',
      '来玩吧来玩吧~',
      '哒哒哒~ 点击进入！',
      '今天也要开心哦~',
      '点击屏幕开始冒险~'
    ];
  })();
  
  function hideOverlay(overlay) {
    overlay.classList.add('hidden');
    sessionStorage.setItem('serenity-welcomed', 'true');
    
    // 解锁 body 滚动
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    
    // 恢复滚动位置
    var scrollY = document.body.dataset.scrollY;
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY));
      delete document.body.dataset.scrollY;
    }
    
    // 移除初始化样式
    var initStyle = document.getElementById('welcome-init-style');
    if (initStyle) {
      initStyle.remove();
    }
    
    // 动画结束后移除元素
    setTimeout(function() {
      overlay.style.display = 'none';
    }, 800);
  }
  
  function lockBodyScroll() {
    // 保存当前滚动位置
    var scrollY = window.scrollY;
    document.body.dataset.scrollY = scrollY;
    
    // 锁定 body 滚动
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = -scrollY + 'px';
  }
  
  function createParticles() {
    var particles = document.getElementById('welcomeParticles');
    if (!particles) return;
    
    for (var i = 0; i < 20; i++) {
      var particle = document.createElement('div');
      particle.className = 'welcome-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.animationDuration = (5 + Math.random() * 5) + 's';
      particles.appendChild(particle);
    }
  }
  
  function setRandomSaying() {
    var bubble = document.getElementById('welcomeMascotBubble');
    if (!bubble) return;
    
    var text = bubble.querySelector('.bubble-text');
    if (text) {
      var randomIndex = Math.floor(Math.random() * mascotSayings.length);
      text.textContent = mascotSayings[randomIndex];
    }
  }
  
  function initThemeToggle() {
    var toggleBtn = document.getElementById('welcomeThemeToggle');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // 阻止冒泡，防止触发进入
      
      // 复用 main.js 中的全局 transitionTheme，避免重复定义
      var doTransition = typeof transitionTheme === 'function' ? transitionTheme : function(cb) { cb(); };
      doTransition(function() {
        var html = document.documentElement;
        var currentTheme = html.getAttribute('data-theme') || 'dark';
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        html.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('color-scheme', newTheme);
      }, e.clientX, e.clientY);
    });
  }
  
  function init() {
    var overlay = document.getElementById('welcomeOverlay');
    
    // 无论欢迎页是否存在，都需要移除初始化样式
    var initStyle = document.getElementById('welcome-init-style');
    if (initStyle) {
      initStyle.remove();
    }
    
    if (!overlay) return; // 欢迎页不存在，直接返回
    
    if (hasVisited) {
      // 已访问过，直接隐藏欢迎页
      overlay.style.display = 'none';
      return;
    }
    
    // 首次访问，显示欢迎页
    lockBodyScroll();
    createParticles();
    setRandomSaying();
    initThemeToggle();
    
    // 阻止欢迎页上的滚动事件传播到页面
    overlay.addEventListener('wheel', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
    
    overlay.addEventListener('touchmove', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
    
    // 点击进入（排除主题切换按钮）
    overlay.addEventListener('click', function(e) {
      if (e.target.closest('.welcome-theme-toggle')) return;
      hideOverlay(overlay);
    });
    
    // 按任意键进入
    function handleKey(e) {
      if (!overlay.classList.contains('hidden')) {
        hideOverlay(overlay);
        document.removeEventListener('keydown', handleKey);
      }
    }
    document.addEventListener('keydown', handleKey);
  }
  
  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
