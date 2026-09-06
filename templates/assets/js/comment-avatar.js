/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-09-06 17:19:05
 * Fingerprint: aadec520d901c075
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-08-31 17:36:30
 * Fingerprint: 897f796e1b7f0d91
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-07-05 00:01:15
 * Fingerprint: 1a93cc3686d739b8
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

(function () {
  let configPromise;

  function getAnnotations(item) {
    return item?.spec?.owner?.annotations || {};
  }

  function getEmailHash(item) {
    return getAnnotations(item)['email-hash'] || '';
  }

  function getOwnerAvatar(item) {
    return item?.owner?.avatar || '';
  }

  function getOwnerKind(item) {
    return item?.owner?.kind || '';
  }

  function withSeedParam(url, seed) {
    return `${url}${url.includes('?') ? '&' : '?'}_avatar=${encodeURIComponent(seed)}`;
  }

  function resolveCustomAvatar(url, seed) {
    const source = (url || '').trim();
    const safeSeed = seed || 'anonymous';

    if (!source) {
      return '';
    }

    if (/\{(?:hash|seed)\}/.test(source)) {
      return source
        .replace(/\{hash\}/g, encodeURIComponent(safeSeed))
        .replace(/\{seed\}/g, encodeURIComponent(safeSeed));
    }

    return withSeedParam(source, safeSeed);
  }

  function resolveProviderAvatar(config, seed) {
    const avatar = config?.avatar || {};
    const provider = avatar.provider || 'gravatar';
    const mirror = avatar.providerMirror || '';

    if (provider === 'custom') {
      return resolveCustomAvatar(mirror, seed);
    }

    const baseUrl = (mirror || 'https://gravatar.com').replace(/\/+$/, '');
    return `${baseUrl}/avatar/${seed || ''}`;
  }

  async function fetchConfig() {
    if (!configPromise) {
      configPromise = fetch('/apis/api.commentwidget.halo.run/v1alpha1/config')
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null);
    }
    return configPromise;
  }

  async function resolveCommentAvatar(item) {
    const ownerAvatar = getOwnerAvatar(item);
    const config = await fetchConfig();
    const avatarConfig = config?.avatar;

    if (!avatarConfig?.enable) {
      return ownerAvatar;
    }

    const ownerKind = getOwnerKind(item);
    const isAnonymous = ownerKind === 'Email';
    const seed = getEmailHash(item);
    const policy = avatarConfig.policy || 'anonymousUser';

    if (policy === 'allUser') {
      return resolveProviderAvatar(config, seed);
    }

    if (policy === 'noAvatarUser' && (isAnonymous || !ownerAvatar)) {
      return resolveProviderAvatar(config, seed);
    }

    if (isAnonymous) {
      return resolveProviderAvatar(config, seed);
    }

    return ownerAvatar;
  }

  window.SerenityCommentAvatar = {
    resolve: resolveCommentAvatar,
  };
})();
