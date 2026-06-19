/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-19 11:46:37
 * Fingerprint: d071f399271682be
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * Serenity-Hue 轻量 PJAX 引擎
 * 目标：站内导航只替换 #pjax-main，保持持久层（含音乐胶囊）不被销毁，音乐连续播放。
 *
 * 设计要点：
 * - 仅在 window.__PJAX_ENABLED 为真时启用（由模板按主题配置注入）。
 * - 任何异常/不支持的链接 → 回退整页跳转，绝不白屏。
 * - 生命周期钩子通过 window.__pjaxHooks 暴露，main.js / 各页脚本可注册
 *   beforeLeave(清理) 与 afterEnter(初始化)。引擎本身只负责 DOM 替换与历史管理。
 */
(function () {
  'use strict';

  if (!window.__PJAX_ENABLED) return;
  if (typeof window.fetch !== 'function' || typeof window.history.pushState !== 'function') return;
  if (!('DOMParser' in window)) return;

  var CONTAINER_ID = 'pjax-main';
  var TRANSITION_DURATION = 300; // 与 page-transition 动画一致

  // ---- 生命周期钩子注册表 ----
  // 统一使用全局数组队列，main.js / 各页脚本可在 pjax.js 加载前后任意时机 push：
  //   window.__pjaxPageInit:     Array<fn(ctx)>  进场（afterEnter）时执行
  //   window.__pjaxPageTeardown: Array<fn(ctx)>  离场（beforeLeave）时执行
  // 同时保留 __pjaxHooks 注册式 API 作为兼容。
  window.__pjaxPageInit = window.__pjaxPageInit || [];
  window.__pjaxPageTeardown = window.__pjaxPageTeardown || [];

  // 一次性页面清理队列：各页脚本随内容重新执行时调用 window.__pjaxOnLeave(fn) 注册，
  // 离场（beforeLeave）执行一次后清空，避免随内容重复执行而无限膨胀。
  var onceLeaveQueue = [];
  window.__pjaxOnLeave = function (fn) { if (typeof fn === 'function') onceLeaveQueue.push(fn); };

  var beforeLeaveHooks = [];
  var afterEnterHooks = [];
  window.__pjaxHooks = window.__pjaxHooks || {
    onBeforeLeave: function (fn) { if (typeof fn === 'function') beforeLeaveHooks.push(fn); },
    onAfterEnter: function (fn) { if (typeof fn === 'function') afterEnterHooks.push(fn); }
  };

  function runBeforeLeave(ctx) {
    // 框架内置清理：页面级 scroll 监听 + 页面级事件
    try { if (typeof clearPageScrollListeners === 'function') clearPageScrollListeners(); } catch (e) {}
    try { if (typeof window.__clearPageEvents === 'function') window.__clearPageEvents(); } catch (e) {}
    // 一次性页面清理（各页脚本注册）
    var q = onceLeaveQueue.slice();
    onceLeaveQueue = [];
    q.forEach(function (fn) { try { fn(ctx); } catch (e) { console.warn('[pjax] onLeave error', e); } });
    (window.__pjaxPageTeardown || []).forEach(function (fn) {
      try { fn(ctx); } catch (e) { console.warn('[pjax] teardown error', e); }
    });
    beforeLeaveHooks.forEach(function (fn) { try { fn(ctx); } catch (e) { console.warn('[pjax] beforeLeave hook error', e); } });
  }
  function runAfterEnter(ctx) {
    (window.__pjaxPageInit || []).forEach(function (fn) {
      try { fn(ctx); } catch (e) { console.warn('[pjax] pageInit error', e); }
    });
    afterEnterHooks.forEach(function (fn) { try { fn(ctx); } catch (e) { console.warn('[pjax] afterEnter hook error', e); } });
  }

  // ---- 链接拦截判断 ----
  function shouldHandle(a, event) {
    if (!a) return false;
    if (event && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    if (a.hasAttribute('data-no-pjax')) return false;

    var href = a.getAttribute('href');
    if (!href) return false;
    if (href.charAt(0) === '#') return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

    var url;
    try { url = new URL(a.href, window.location.href); } catch (e) { return false; }
    if (url.origin !== window.location.origin) return false;

    // 排除：控制台 / 登录态相关 / 错误页（独立 layout，走整页跳转）
    var p = url.pathname;
    if (/^\/(console|login|logout|signup)(\/|$)/.test(p)) return false;
    if (/\/(login|logout|signup)$/.test(p)) return false;

    // 同页锚点跳转（仅 hash 不同）交给浏览器
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;

    return true;
  }

  var currentAbort = null;
  var isNavigating = false;

  function showTransition() {
    var t = document.getElementById('page-transition');
    if (t) t.classList.add('active');
  }
  function hideTransition() {
    var t = document.getElementById('page-transition');
    if (t) t.classList.remove('active');
  }

  function hardNavigate(href) {
    window.location.href = href;
  }

  function updateHead(newDoc) {
    if (newDoc.title) document.title = newDoc.title;

    var selectors = [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[property="og:type"]',
      'meta[property="og:url"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:card"]'
    ];
    selectors.forEach(function (sel) {
      var oldEl = document.head.querySelector(sel);
      var newEl = newDoc.head.querySelector(sel);
      if (newEl) {
        if (oldEl) {
          oldEl.setAttribute('content', newEl.getAttribute('content') || '');
        } else {
          document.head.appendChild(newEl.cloneNode(true));
        }
      } else if (oldEl) {
        oldEl.parentNode.removeChild(oldEl);
      }
    });

    var oldCanon = document.head.querySelector('link[rel="canonical"]');
    var newCanon = newDoc.head.querySelector('link[rel="canonical"]');
    if (newCanon) {
      if (oldCanon) oldCanon.setAttribute('href', newCanon.getAttribute('href') || '');
      else document.head.appendChild(newCanon.cloneNode(true));
    } else if (oldCanon) {
      oldCanon.parentNode.removeChild(oldCanon);
    }
  }

  function syncPageStyles(newDoc) {
    var newLinks = Array.prototype.slice.call(newDoc.querySelectorAll('link[rel="stylesheet"]'));
    var newHrefs = {};
    newLinks.forEach(function (link) {
      var href = normalizeStyleHref(link);
      if (href) newHrefs[href] = true;
    });

    var staleLinks = [];
    document.head.querySelectorAll('link[rel="stylesheet"][data-pjax-style]').forEach(function (link) {
      if (!newHrefs[normalizeStyleHref(link)]) staleLinks.push(link);
    });

    var pending = [];
    newLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      if (hasStyleHref(link)) return;
      var clone = link.cloneNode(true);
      clone.setAttribute('data-pjax-style', '');
      var p = new Promise(function (resolve) {
        var done = false;
        function finish() { if (done) return; done = true; resolve(); }
        clone.addEventListener('load', finish, { once: true });
        clone.addEventListener('error', finish, { once: true });
        setTimeout(finish, 4000);
      });
      document.head.appendChild(clone);
      pending.push(p);
    });
    return Promise.all(pending).then(function () {
      staleLinks.forEach(function (link) {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    });
  }
  function normalizeStyleHref(link) {
    if (!link) return '';
    try {
      return new URL(link.getAttribute('href') || link.href || '', document.baseURI).href;
    } catch (e) {
      return link.getAttribute('href') || '';
    }
  }
  function hasStyleHref(link) {
    var href = normalizeStyleHref(link);
    if (!href) return false;
    return Array.prototype.some.call(document.head.querySelectorAll('link[rel="stylesheet"]'), function (existing) {
      return normalizeStyleHref(existing) === href;
    });
  }

  // ---- 重新执行替换进来的 <script>（innerHTML 注入不会自动执行） ----
  // 已在持久层（layout）全局加载的库，PJAX 切页时无需重复加载执行。
  var GLOBAL_JS = ['iconify.min.js', 'aplayer.min.js', 'meting2.min.js', 'lenis.min.js',
    'swiper-bundle.min.js', 'aos.js', 'main.js', 'search.js', 'welcome.js',
    'music-panel.js', 'pjax.js', 'cursor-init.js', 'theme-color-init.js'];
  function isGlobalJs(src) {
    var lower = src.toLowerCase();
    for (var i = 0; i < GLOBAL_JS.length; i++) {
      if (lower.indexOf('/' + GLOBAL_JS[i]) !== -1) return true;
    }
    return false;
  }

  // 外链脚本串行加载，保证执行顺序；内联脚本同步执行。
  function executeScripts(container) {
    var scripts = Array.prototype.slice.call(container.querySelectorAll('script'));
    var chain = Promise.resolve();
    scripts.forEach(function (old) {
      var src = old.getAttribute('src');
      if (src && isGlobalJs(src)) {
        old.parentNode.removeChild(old);
        return;
      }
      chain = chain.then(function () {
        return new Promise(function (resolve) {
          var s = document.createElement('script');
          for (var i = 0; i < old.attributes.length; i++) {
            var attr = old.attributes[i];
            s.setAttribute(attr.name, attr.value);
          }
          s.textContent = old.textContent;
          if (src) {
            s.removeAttribute('defer');
            s.addEventListener('load', function () { resolve(); }, { once: true });
            s.addEventListener('error', function () { resolve(); }, { once: true });
            old.parentNode.replaceChild(s, old);
          } else {
            old.parentNode.replaceChild(s, old);
            resolve();
          }
        });
      });
    });
    return chain;
  }

  // ---- 核心导航 ----
  function navigate(href, isPop) {
    if (isNavigating) {
      if (currentAbort) { try { currentAbort.abort(); } catch (e) {} }
    }
    isNavigating = true;
    showTransition();

    var ctx = { url: href, isPop: !!isPop };
    var controller = ('AbortController' in window) ? new AbortController() : null;
    currentAbort = controller;

    fetch(href, {
      headers: { 'X-Requested-With': 'pjax' },
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('text/html') === -1) throw new Error('Not HTML');
        return res.text();
      })
      .then(function (html) {
        var newDoc = new DOMParser().parseFromString(html, 'text/html');
        var newContainer = newDoc.getElementById(CONTAINER_ID);
        var curContainer = document.getElementById(CONTAINER_ID);
        if (!newContainer || !curContainer) throw new Error('No pjax container');

        // 1) 离场清理
        runBeforeLeave(ctx);

        // 2) 更新 head（title/meta）
        updateHead(newDoc);

        // 3) 先把新页专属 CSS 注入并等待加载完成，再替换内容，避免出现无样式闪烁
        return syncPageStyles(newDoc).then(function () {
          // 4) 替换内容
          curContainer.innerHTML = newContainer.innerHTML;

          // 5) 历史记录
          if (!isPop) {
            window.history.pushState({ pjax: true }, '', href);
          }

          // 6) 执行内容内脚本（外链串行加载完成后再进场初始化）
          return executeScripts(curContainer).then(function () {
            // 7) 滚动复位（Lenis 接管时需同步其内部 target，否则会被平滑拉回旧位置）
            if (window.__lenis && typeof window.__lenis.scrollTo === 'function') {
              window.__lenis.scrollTo(0, { immediate: true });
            } else {
              window.scrollTo(0, 0);
            }

            // 8) 进场初始化
            runAfterEnter(ctx);

            isNavigating = false;
            currentAbort = null;
            setTimeout(hideTransition, 50);
          });
        });
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return; // 被新导航取消，忽略
        console.warn('[pjax] navigate failed, fallback to full load:', err);
        isNavigating = false;
        currentAbort = null;
        hardNavigate(href);
      });
  }

  // ---- 事件绑定 ----
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!shouldHandle(a, e)) return;
    e.preventDefault();
    var href = a.href;
    if (href === window.location.href) return; // 同页
    navigate(href, false);
  });

  window.addEventListener('popstate', function (e) {
    // 仅处理由本引擎产生的历史项；其它情况让浏览器默认行为兜底
    navigate(window.location.href, true);
  });

  // 标记首屏已就绪，便于 afterEnter 钩子区分首次加载与 PJAX 切页
  window.__pjaxReady = true;

  var GLOBAL_CSS = ['base.css', 'lenis.css', 'aos.css', 'swiper-bundle.min.css', 'APlayer.min.css', 'music-panel.css', 'welcome.css', 'qweather-icons.css', 'fontawesome.min.css'];
  function isGlobalCss(href) {
    for (var i = 0; i < GLOBAL_CSS.length; i++) {
      if (href.indexOf(GLOBAL_CSS[i]) !== -1) return true;
    }
    return false;
  }
  document.head.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (!isGlobalCss(href)) link.setAttribute('data-pjax-style', '');
  });
})();
