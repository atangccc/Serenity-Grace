/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-18 20:10:29
 * Fingerprint: 6e4461a8b63de2fa
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * 欢迎页控制脚本
 */
(function() {
  'use strict';
  
  var hasVisited = sessionStorage.getItem('serenity-welcomed');
  
  var mascotSayings = (function() {
    if (window.WELCOME_SAYINGS && Array.isArray(window.WELCOME_SAYINGS) && window.WELCOME_SAYINGS.length > 0) {
      return window.WELCOME_SAYINGS;
    }
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
  
  function unlockBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    if (document.body.dataset.scrollY) {
      delete document.body.dataset.scrollY;
    }
  }

  function hideOverlay(overlay) {
    overlay.classList.add('hidden');
    sessionStorage.setItem('serenity-welcomed', 'true');

    var scrollY = document.body.dataset.scrollY;
    unlockBodyScroll();
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY));
    }

    var initStyle = document.getElementById('welcome-init-style');
    if (initStyle) {
      initStyle.remove();
    }
    
    setTimeout(function() {
      overlay.style.display = 'none';
    }, 800);
  }
  
  function lockBodyScroll() {
    var scrollY = window.scrollY;
    document.body.dataset.scrollY = scrollY;
    
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
      e.stopPropagation(); 
      
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

    var initStyle = document.getElementById('welcome-init-style');
    if (initStyle) {
      initStyle.remove();
    }
    
    if (!overlay) {
      unlockBodyScroll();
      return;
    }

    if (hasVisited) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
      unlockBodyScroll();
      return;
    }
    
    lockBodyScroll();
    createParticles();
    setRandomSaying();
    initThemeToggle();
    
    overlay.addEventListener('wheel', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
    
    overlay.addEventListener('touchmove', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    overlay.addEventListener('click', function(e) {
      if (e.target.closest('.welcome-theme-toggle')) return;
      hideOverlay(overlay);
    });

    function handleKey(e) {
      if (!overlay.classList.contains('hidden')) {
        hideOverlay(overlay);
        document.removeEventListener('keydown', handleKey);
      }
    }
    document.addEventListener('keydown', handleKey);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
