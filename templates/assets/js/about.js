/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-03 10:28:07
 * Fingerprint: 18f8d0015be24d2b
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

function initForeverBlog() {
  const startDateStr = window.FOREVER_BLOG_START_DATE || '2024-01-01';
  const START_DATE = new Date(startDateStr + 'T00:00:00');
  const TEN_YEARS = 10 * 365 * 24 * 60 * 60 * 1000;
  
  function updateCountdown() {
    const el = document.getElementById('progressPercent');
    if (!el) return; // PJAX 离开页面后 DOM 已不存在
    
    const now = new Date();
    const elapsed = now - START_DATE;
    const remaining = TEN_YEARS - elapsed;
    
    if (remaining <= 0) {
      el.textContent = '100';
      document.getElementById('progressFill').style.width = '100%';
      document.getElementById('remainingTime').textContent = '0年:0天:00时:00分:00秒';
      return;
    }
    
    const years = Math.floor(remaining / (365 * 24 * 60 * 60 * 1000));
    const days = Math.floor((remaining % (365 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    const progress = ((elapsed / TEN_YEARS) * 100).toFixed(2);
    el.textContent = progress;
    document.getElementById('progressFill').style.width = progress + '%';
    
    const remainingText = `${years}年:${days}天:${String(hours).padStart(2, '0')}时:${String(minutes).padStart(2, '0')}分:${String(seconds).padStart(2, '0')}秒`;
    document.getElementById('remainingTime').textContent = remainingText;
  }
  
  updateCountdown();
  var timerId = setInterval(updateCountdown, 1000);

  document.addEventListener('pjax:beforeReplace', function cleanup() {
    clearInterval(timerId);
    document.removeEventListener('pjax:beforeReplace', cleanup);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('progressFill')) {
    initForeverBlog();
  }
});
