/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-20 19:41:39
 * Fingerprint: f3a918453bf9de13
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/* 爱发电折叠面板 & 弹窗（含支付验证） */
var _afdianModal = null;
var _afdianVerifyCode = '';
var _afdianPayOpened = false;

function toggleAfdianPanel(id) {
  var btn = document.querySelector('[data-afdian-toggle="' + id + '"]');
  var panel = document.getElementById(id);
  if (!btn || !panel) return;
  var isOpen = btn.classList.contains('afdian-toggle-btn--open');
  if (isOpen) {
    panel.style.maxHeight = '0';
    btn.classList.remove('afdian-toggle-btn--open');
  } else {
    panel.style.maxHeight = panel.scrollHeight + 'px';
    btn.classList.add('afdian-toggle-btn--open');
  }
}

function _genVerifyCode() {
  var chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  var code = '';
  for (var i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

/* 自定义 toast 提示 */
function _afdianToast(msg, type) {
  var t = document.createElement('div');
  t.className = 'afdian-toast' + (type ? ' afdian-toast--' + type : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.classList.add('afdian-toast--show'); }, 10);
  setTimeout(function() {
    t.classList.remove('afdian-toast--show');
    setTimeout(function() { t.remove(); }, 300);
  }, 3000);
}

function showAfdianModal(data) {
  _afdianModal = data;
  _afdianVerifyCode = _genVerifyCode();
  _afdianPayOpened = false;
  var m = document.getElementById('afdian-modal');
  m.querySelector('.afdian-modal-name').textContent = data.name || '';
  m.querySelector('.afdian-modal-price').textContent = '\u00A5' + (data.price || '0');
  var descEl = m.querySelector('.afdian-modal-desc');
  descEl.textContent = data.desc || '';
  descEl.style.display = data.desc ? '' : 'none';
  var picEl = m.querySelector('.afdian-modal-pic');
  if (data.pic) {
    picEl.querySelector('img').src = data.pic;
    picEl.style.display = '';
  } else {
    picEl.style.display = 'none';
  }
  var monthSec = m.querySelector('.afdian-modal-months');
  monthSec.style.display = data.showMonths ? '' : 'none';
  if (data.showMonths) {
    selectAfdianMonth(data.month || 1);
  }
  var verifySection = m.querySelector('.afdian-verify-section');
  if (verifySection) verifySection.style.display = 'none';
  var payBtn = m.querySelector('.afdian-modal-btn-primary');
  if (payBtn) payBtn.style.display = '';
  m.classList.add('active');
}

function closeAfdianModal() {
  document.getElementById('afdian-modal').classList.remove('active');
}

function selectAfdianMonth(v) {
  _afdianModal.month = v;
  document.querySelectorAll('.afdian-month-opt').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-month') === String(v));
  });
}

function confirmAfdianOrder() {
  if (!_afdianModal) return;
  var params = 'plan_id=' + _afdianModal.planId + '&product_type=' + (_afdianModal.productType || '0');
  if (_afdianModal.showMonths) params += '&month=' + (_afdianModal.month || 1);
  var remarkStr = _afdianVerifyCode + '-\u8BF7\u52FF\u4FEE\u6539\uFF0C\u5426\u5219\u8BA2\u5355\u4E0D\u751F\u6548';
  params += '&remark=' + encodeURIComponent(remarkStr);
  var url = 'https://afdian.com/order/create?' + params;
  var w = 520, h = 700;
  var left = Math.round((screen.width - w) / 2);
  var top = Math.round((screen.height - h) / 2);
  window.open(url, 'afdian_pay', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',scrollbars=yes,resizable=yes');
  _afdianPayOpened = true;
  // 在后台创建赞助记录
  var pubApi = '/apis/anonymous.afdian.halo.run/v1alpha1/afdian-payment';
  fetch(pubApi + '/-/create-record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: _afdianModal.planId,
      planName: _afdianModal.name || '',
      price: _afdianModal.price || '0',
      verifyCode: _afdianVerifyCode,
      month: _afdianModal.month || 1
    })
  }).catch(function() {});
  // 显示验证按钮
  var m = document.getElementById('afdian-modal');
  var verifySection = m.querySelector('.afdian-verify-section');
  if (verifySection) verifySection.style.display = '';
}

function verifyAfdianPayment() {
  if (!_afdianModal || !_afdianVerifyCode) return;
  var btn = document.querySelector('.afdian-verify-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = '\u9A8C\u8BC1\u4E2D...';
  var apiBase = '/apis/anonymous.afdian.halo.run/v1alpha1/afdian-payment';
  fetch(apiBase + '/-/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: _afdianModal.planId, verifyCode: _afdianVerifyCode })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.verified) {
      btn.textContent = '\u2713 \u9A8C\u8BC1\u6210\u529F';
      btn.style.background = '#10b981';
      btn.style.borderColor = '#10b981';
      _afdianToast('\u652F\u4ED8\u9A8C\u8BC1\u6210\u529F\uFF01\u8BA2\u5355\u53F7: ' + (data.outTradeNo || ''), 'success');
      setTimeout(function() { closeAfdianModal(); }, 1200);
    } else {
      btn.disabled = false;
      btn.textContent = '\u6211\u5DF2\u4ED8\u6B3E\uFF0C\u9A8C\u8BC1\u652F\u4ED8';
      _afdianToast(data.message || '\u672A\u627E\u5230\u5339\u914D\u7684\u652F\u4ED8\u8BB0\u5F55\uFF0C\u8BF7\u786E\u8BA4\u5DF2\u5B8C\u6210\u4ED8\u6B3E', 'warn');
    }
  })
  .catch(function() {
    btn.disabled = false;
    btn.textContent = '\u6211\u5DF2\u4ED8\u6B3E\uFF0C\u9A8C\u8BC1\u652F\u4ED8';
    _afdianToast('\u9A8C\u8BC1\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5', 'error');
  });
}
