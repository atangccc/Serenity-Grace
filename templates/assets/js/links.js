/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-18 20:10:29
 * Fingerprint: 6e4461a8b63de2fa
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

var currentLinkUrl = '';

function initLinksPage() {
  var linkCards = document.querySelectorAll('.link-card[data-link]');
  var confirmModal = document.getElementById('linkConfirmModal');

  linkCards.forEach(function (card) {
    card.addEventListener('click', function (event) {
      event.preventDefault();
      var url = this.href;
      var name = this.querySelector('.link-name')?.textContent || '该站点';
      showLinkConfirm(url, name);
    });
  });

  function handleKeydown(event) {
    if (event.key === 'Escape' && confirmModal?.classList.contains('active')) {
      closeLinkConfirm();
    }
  }

  document.addEventListener('keydown', handleKeydown);
  // 离场时移除顶层 keydown 监听，防止叠加
  if (typeof window.__pjaxOnLeave === 'function') {
    window.__pjaxOnLeave(function () {
      document.removeEventListener('keydown', handleKeydown);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLinksPage);
} else {
  initLinksPage();
}

function showLinkConfirm(url, name) {
  currentLinkUrl = url;

  var modal = document.getElementById('linkConfirmModal');
  var targetName = document.querySelector('.link-target-name');
  var confirmButton = document.querySelector('.link-confirm-cta');

  if (targetName) {
    targetName.textContent = name;
  }

  if (modal) {
    modal.classList.add('active');
  }

  if (confirmButton) {
    confirmButton.focus();
  }
}

function confirmLinkVisit() {
  if (!currentLinkUrl) return;
  window.open(currentLinkUrl, '_blank', 'noopener,noreferrer');
  closeLinkConfirm();
}

function closeLinkConfirm() {
  var modal = document.getElementById('linkConfirmModal');
  currentLinkUrl = '';
  if (modal) {
    modal.classList.remove('active');
  }
}

function visitRandomLink() {
  var links = document.querySelectorAll('.link-card[data-link]');
  if (links.length > 0) {
    var randomIndex = Math.floor(Math.random() * links.length);
    links[randomIndex].click();
  }
}
