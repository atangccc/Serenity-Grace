/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-18 20:09:34
 * Fingerprint: eb58ecfd7612f953
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Gateway 页面（登录/注册）通用气泡提示
 * 使用 .sepo-toast 样式，绝对定位浮现在目标元素上方
 *
 * @param {string} message - 提示文本
 * @param {string} [type='info'] - 'error' | 'success' | 'info'
 * @param {Element} [targetElement] - 插入的父元素；省略则自动查找表单输入框
 * @param {number} [duration=3000] - 自动消失时间（毫秒）
 */
function showToast(message, type, targetElement, duration) {
  type = type || 'info';
  duration = duration || 3000;

  var icons = {
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  // 确定插入目标
  if (!targetElement) {
    var input = document.querySelector('input[name="username"]') ||
                document.querySelector('input[type="text"]');
    targetElement = input ? input.closest('.form-input') : null;
    if (!targetElement) {
      targetElement = document.querySelector('.form-item');
    }
  }
  if (!targetElement) return;

  // 移除已有 toast
  var existing = targetElement.querySelector('.sepo-toast');
  if (existing) existing.remove();

  // 确保父元素有相对定位
  var pos = window.getComputedStyle(targetElement).position;
  if (pos === 'static') targetElement.style.position = 'relative';

  var toast = document.createElement('div');
  toast.className = 'sepo-toast ' + type;
  var iconSpan = document.createElement('span');
  iconSpan.className = 'sepo-toast-icon';
  iconSpan.innerHTML = icons[type] || icons.info;
  var msgSpan = document.createElement('span');
  msgSpan.className = 'sepo-toast-message';
  msgSpan.textContent = message;
  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  targetElement.appendChild(toast);

  requestAnimationFrame(function() { toast.classList.add('show'); });

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, duration);
}
