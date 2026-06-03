/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-03 10:28:07
 * Fingerprint: 18f8d0015be24d2b
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * 注册页面脚本
 */
(function() {
  'use strict';

  function setInputFilledState(input) {
    if (!input) return;
    var wrap = input.closest('.form-input');
    if (!wrap) return;
    var filled = (input.value || '').length > 0;
    wrap.classList.toggle('has-value', filled);
  }

  function bindPersistentInputState(root) {
    var scope = root || document;
    var inputs = scope.querySelectorAll('.halo-form .form-input input:not([type="hidden"])');
    inputs.forEach(function(input) {
      if (input.dataset.filledStateBound !== '1') {
        input.dataset.filledStateBound = '1';
        ['input', 'change', 'blur', 'keyup'].forEach(function(evt) {
          input.addEventListener(evt, function() {
            setInputFilledState(input);
          });
        });
      }
      setInputFilledState(input);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    bindPersistentInputState(document);
    setTimeout(function() {
      bindPersistentInputState(document);
    }, 250);

    handleAlerts();
    initFormSubmit();
    styleEmailCodeButton();
  });

  function handleAlerts() {
    var alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
      var text = alert.textContent.trim();
      if (!text) return;
      var isError = alert.classList.contains('alert-error');
      if (isError && typeof showToast === 'function') {
        showToast(text, 'error');
      }
    });
  }

  function initFormSubmit() {
    var form = document.querySelector('#signup-form') || document.querySelector('form[action*="signup"]');
    if (form) {
      form.addEventListener('submit', function() {
        var btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = '注册中...'; }
      });
    }
  }


  function styleEmailCodeButton() {
    var btn = document.getElementById('emailCodeSendButton');
    if (!btn) return;
    var loadingIcon = '<svg class="sepo-btn-icon sepo-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>';
    var successIcon = '<svg class="sepo-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>';

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type !== 'childList' && m.type !== 'characterData') return;
        var text = btn.textContent.trim();
        if (text.includes('发送中') || text.includes('sending')) {
          btn.innerHTML = loadingIcon;
          btn.classList.add('sepo-btn-loading');
          btn.classList.remove('sepo-btn-success');
        } else if (text.includes('发送成功') || text.includes('success')) {
          btn.innerHTML = successIcon;
          btn.classList.add('sepo-btn-success');
          btn.classList.remove('sepo-btn-loading');
        } else {
          btn.classList.remove('sepo-btn-loading', 'sepo-btn-success');
        }
      });
    });
    observer.observe(btn, { childList: true, characterData: true, subtree: true });
  }
})();
