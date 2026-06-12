/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-12 17:03:04
 * Fingerprint: a120876833389618
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * 登录页面脚本 - 拾光风格
 * 支持登录 ↔ 忘记密码视图切换
 */

var brandTexts = {
  login: {
    headline: '静候，\n文字里的重逢。',
    desc: '欢迎回到这片宁静的文字角落。在这里，每一行字都是时光的注脚。'
  },
  forgot: {
    headline: '别急，\n我们帮你找回。',
    desc: '每一段旅程都值得继续。输入你的邮箱，我们会帮你重新启程。'
  }
};

var currentView = 'login';

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

function switchView(viewName) {
  if (viewName === currentView) return;

  var panels = document.querySelectorAll('.gateway-view-panel');
  panels.forEach(function(panel) {
    panel.classList.remove('active');
  });

  setTimeout(function() {
    var target = document.getElementById('view-' + viewName);
    if (target) {
      target.classList.add('active');
    }
  }, 80);

  updateBrandText(viewName);
  currentView = viewName;
}

function updateBrandText(viewName) {
  var headline = document.getElementById('brand-headline');
  var desc = document.getElementById('brand-desc');
  if (!headline || !desc) return;

  var texts = brandTexts[viewName] || brandTexts.login;

  headline.style.opacity = '0';
  headline.style.transform = 'translateX(1.875rem)';
  desc.style.opacity = '0';
  desc.style.transform = 'translateX(1.875rem)';

  setTimeout(function() {
    headline.textContent = texts.headline;
    desc.textContent = texts.desc;

    headline.style.transition = 'opacity 0.7s cubic-bezier(0.23,1,0.32,1), transform 0.7s cubic-bezier(0.23,1,0.32,1)';
    desc.style.transition = 'opacity 0.7s cubic-bezier(0.23,1,0.32,1), transform 0.7s cubic-bezier(0.23,1,0.32,1)';
    headline.style.opacity = '1';
    headline.style.transform = 'translateX(0)';
    setTimeout(function() {
      desc.style.opacity = '1';
      desc.style.transform = 'translateX(0)';
    }, 100);
  }, 300);
}

document.addEventListener('DOMContentLoaded', function() {
  bindPersistentInputState(document);
  setTimeout(function() {
    bindPersistentInputState(document);
  }, 250);

  // 处理服务端返回的错误/成功信息 → 转为气泡提示
  var alerts = document.querySelectorAll('.alert');
  alerts.forEach(function(alert) {
    var message = alert.textContent.trim();
    if (!message) return;
    var isError = alert.classList.contains('alert-error');
    var isSuccess = alert.classList.contains('alert-success');
    if (typeof showToast === 'function') {
      showToast(message, isError ? 'error' : (isSuccess ? 'success' : 'info'));
    }
    alert.remove();
  });

  // 表单提交加载状态
  setTimeout(function() {
    var loginForm = document.querySelector('#login-form') || document.querySelector('form[action*="login"]');
    if (loginForm) {
      loginForm.addEventListener('submit', function() {
        var submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '登录中...';
        }
      });
    }

    // 忘记密码链接 → 切换到忘记密码视图
    var forgotLink = document.querySelector('.form-item-extra-link') ||
                     document.querySelector('a[href*="password-reset"]') ||
                     document.querySelector('a[href*="forgot"]');
    if (forgotLink) {
      forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var csrfInput = document.querySelector('#login-form input[name="_csrf"]') ||
                        document.querySelector('input[name="_csrf"]');
        var resetCsrf = document.getElementById('reset-csrf');
        if (csrfInput && resetCsrf) {
          resetCsrf.value = csrfInput.value;
        }
        switchView('forgot');
      });
    }

    // 找回密码表单 AJAX 提交
    var resetForm = document.getElementById('reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = document.getElementById('reset-email');
        var csrfToken = document.getElementById('reset-csrf');
        var submitBtn = resetForm.querySelector('button[type="submit"]');
        if (!emailInput || !emailInput.value.trim()) {
          if (typeof showToast === 'function') showToast('请输入邮箱地址', 'error');
          return;
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '发送中...';
        }
        var formData = new URLSearchParams();
        formData.append('email', emailInput.value.trim());
        if (csrfToken && csrfToken.value) {
          formData.append('_csrf', csrfToken.value);
        }
        fetch('/password-reset/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
          redirect: 'manual'
        }).then(function(resp) {
          if (resp.status === 429) {
            if (typeof showToast === 'function') showToast('操作过于频繁，请稍后再试', 'error');
          } else if (resp.ok || resp.status === 200 || resp.type === 'opaqueredirect') {
            if (typeof showToast === 'function') showToast('如果该邮箱已注册，您将收到重置链接', 'success');
            emailInput.value = '';
            setInputFilledState(emailInput);
          } else {
            if (typeof showToast === 'function') showToast('发送失败，请稍后重试', 'error');
          }
        }).catch(function() {
          if (typeof showToast === 'function') showToast('网络错误，请检查连接', 'error');
        }).finally(function() {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '发送重置邮件';
          }
        });
      });
    }

    // 记住我 ↔ 社交登录表单同步
    var rememberMe = document.getElementById('remember-me');
    if (rememberMe) {
      rememberMe.addEventListener('change', function() {
        var checked = rememberMe.checked;
        document.querySelectorAll('.social-btn-form').forEach(function(form) {
          var action = form.getAttribute('action');
          if (action) {
            form.setAttribute('action', action.replace(/remember-me=(true|false)/, 'remember-me=' + checked));
          }
        });
      });
    }
  }, 100);
});
