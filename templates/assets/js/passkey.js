/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-19 11:46:55
 * Fingerprint: 7c18c15dc546a462
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

﻿(function() {
  var AUTH_PROVIDER_API = '/apis/api.console.halo.run/v1alpha1/auth-providers';
  var PASSKEY_API = '/apis/api.passkey.halo.run/v1alpha1';

  function isSecureContextForPasskey() {
    return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }

  function isPasskeySupported() {
    return !!(window.PublicKeyCredential && navigator.credentials && isSecureContextForPasskey());
  }

  function base64urlToArrayBuffer(input) {
    if (!input) return new ArrayBuffer(0);
    var base64 = String(input).replace(/-/g, '+').replace(/_/g, '/');
    base64 += '='.repeat((4 - (base64.length % 4)) % 4);
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function arrayBufferToBase64url(buffer) {
    if (!buffer) return '';
    var bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer);
    var binary = '';
    for (var i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function getCsrfInfo() {
    var tokenMeta = document.querySelector('meta[name="_csrf"]');
    var headerMeta = document.querySelector('meta[name="_csrf_header"]');
    return {
      token: tokenMeta ? tokenMeta.content : '',
      headerName: headerMeta ? headerMeta.content : 'X-CSRF-TOKEN'
    };
  }

  async function requestJson(url, options) {
    var csrf = getCsrfInfo();
    var headers = Object.assign({ Accept: 'application/json' }, (options && options.headers) || {});
    if (csrf.token) {
      headers[csrf.headerName] = csrf.token;
    }

    var response = await fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: headers
    }, options || {}));

    var text = '';
    try {
      text = await response.text();
    } catch (error) {
      text = '';
    }

    var data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = null;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data: data,
      text: text
    };
  }

  function getDeviceDisplayName() {
    var platform = '';
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      platform = navigator.userAgentData.platform;
    } else if (navigator.platform) {
      platform = navigator.platform;
    }
    platform = String(platform || '').replace(/_/g, ' ').trim();
    return platform ? ('我的' + platform + '设备') : '当前设备';
  }

  function showMessage(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type || 'info');
    }
  }

  function updateButtonState(button, loading, text) {
    if (!button) return;
    if (!button.dataset.defaultText) {
      var label = button.querySelector('span');
      button.dataset.defaultText = label ? label.textContent : button.textContent;
    }
    button.disabled = !!loading;
    button.classList.toggle('is-loading', !!loading);
    var textNode = button.querySelector('span');
    if (textNode) {
      textNode.textContent = loading ? text : button.dataset.defaultText;
    }
  }

  function explainCredentialError(error) {
    if (!error || !error.name) return '';
    if (error.name === 'NotAllowedError') return '你已取消本次通行密钥操作';
    if (error.name === 'InvalidStateError') return '这枚通行密钥可能已经绑定过了';
    if (error.name === 'NotSupportedError') return '当前浏览器或设备暂不支持通行密钥';
    if (error.name === 'SecurityError') return '当前环境不满足通行密钥的安全要求';
    if (error.name === 'AbortError') return '操作已取消';
    if (error.name === 'TimeoutError') return '操作超时，请稍后重试';
    return '';
  }

  async function loadAuthProviders() {
    var result = await requestJson(AUTH_PROVIDER_API, { method: 'GET' });
    if (!result.ok || !Array.isArray(result.data)) {
      return [];
    }
    return result.data;
  }

  async function handlePasskeyRegistration(button) {
    updateButtonState(button, true, '绑定中...');
    try {
      var origin = window.location.origin;
      var displayName = getDeviceDisplayName();

      var optionsResult = await requestJson(PASSKEY_API + '/registration/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: displayName,
          origin: origin
        })
      });

      if (!optionsResult.ok || !optionsResult.data) {
        throw new Error((optionsResult.data && optionsResult.data.message) || '暂时无法获取通行密钥注册选项');
      }

      var options = optionsResult.data;
      var credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64urlToArrayBuffer(options.challenge),
          rp: {
            id: options.rp.id,
            name: options.rp.name
          },
          user: {
            id: base64urlToArrayBuffer(options.user.id),
            name: options.user.name,
            displayName: options.user.displayName
          },
          pubKeyCredParams: (options.pubKeyCredParams || []).map(function(param) {
            return {
              type: param.type,
              alg: param.alg
            };
          }),
          timeout: options.timeout,
          authenticatorSelection: options.authenticatorSelection ? {
            authenticatorAttachment: options.authenticatorSelection.authenticatorAttachment,
            residentKey: options.authenticatorSelection.residentKey,
            userVerification: options.authenticatorSelection.userVerification
          } : undefined,
          excludeCredentials: (options.excludeCredentials || []).map(function(id) {
            return {
              type: 'public-key',
              id: base64urlToArrayBuffer(id)
            };
          }),
          attestation: 'none'
        }
      });

      if (!credential) {
        throw new Error('未获取到通行密钥注册结果');
      }

      var attestationResponse = credential.response;
      var verifyResult = await requestJson(PASSKEY_API + '/registration/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credentialId: arrayBufferToBase64url(credential.rawId),
          attestationObject: arrayBufferToBase64url(attestationResponse.attestationObject),
          clientDataJSON: arrayBufferToBase64url(attestationResponse.clientDataJSON),
          transports: typeof attestationResponse.getTransports === 'function' ? attestationResponse.getTransports() : [],
          displayName: displayName,
          origin: origin
        })
      });

      if (!verifyResult.ok) {
        throw new Error((verifyResult.data && verifyResult.data.message) || '通行密钥绑定失败');
      }

      showMessage('通行密钥绑定成功，下次可以直接验证登录', 'success');
    } catch (error) {
      showMessage(explainCredentialError(error) || (error && error.message) || '通行密钥绑定失败', 'error');
    } finally {
      updateButtonState(button, false, '');
    }
  }

  async function initPasskeyBinding() {
    var section = document.getElementById('passkey-register-section');
    var button = document.getElementById('passkey-register-btn');
    if (!section || !button || !isPasskeySupported()) {
      return;
    }

    try {
      var providers = await loadAuthProviders();
      var passkeyProvider = providers.find(function(provider) {
        return provider && provider.name === 'passkey' && provider.enabled === true;
      });
      if (!passkeyProvider) {
        return;
      }
    } catch (error) {
      return;
    }

    section.hidden = false;
    button.hidden = false;
    button.addEventListener('click', function() {
      handlePasskeyRegistration(button);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    initPasskeyBinding();
  });
})();
