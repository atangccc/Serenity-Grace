/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-18 20:09:34
 * Fingerprint: eb58ecfd7612f953
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * ANI 动态鼠标指针初始化 (Hue 定制)
 * 
 * 原理：ani-cursor.js 通过 @keyframes 逐帧切换 cursor:url(blob:...)
 * 
 * 关键设计：
 *   - html 元素上挂 arrow animation（html 自身没有其他 animation）
 *   - 所有子元素用 cursor:inherit!important 继承，不设 animation 避免冲突
 *   - 文本/pointer 元素单独挂各自的 animation（这些元素通常没有 AOS 等动画）
 *   - 有 AOS 等动画的元素通过 inherit 继承 cursor，不受影响
 *
 * 三种光标：
 *   指向arrow.ani    -> 默认箭头
 *   复制beam.ani     -> 文本选择
 *   有东西Select.ani -> 手型指针（可点击）
 */
(function() {
  var s = document.createElement('script');
  s.src = '/themes/theme-Serenity/assets/js/ani-cursor.bundle.js';
  s.onload = function() {
    var lib = window['ani-cursor.js'];
    if (!lib || !lib.LoadANICursorPromise) return;
    var B = '/themes/theme-Serenity/assets/fonts/cursor/';
    var urls = {
      arrow:  B + encodeURIComponent('指向arrow.ani'),
      beam:   B + encodeURIComponent('复制beam.ani'),
      select: B + encodeURIComponent('有东西Select.ani')
    };
    var n = 0, info = {};
    function go(key) {
      lib.LoadANICursorPromise(urls[key]).then(function(r) {
        info[key] = r; if (++n === 3) build();
      });
    }
    go('arrow'); go('beam'); go('select');

    function build() {
      var a = info.arrow, b = info.beam, c = info.select;
      var anim = function(i) {
        return i.keyframesName + ' ' + i.totalRoundTime + 'ms step-end infinite';
      };

      var tSel = [
        'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])',
        'textarea','p','span','h1','h2','h3','h4','h5','h6',
        'li','td','th','label','blockquote','pre','code',
        '.link-desc','.link-name',
        '.brand-headline','.brand-desc',
        '.welcome-title','.welcome-tagline','.welcome-bio'
      ].join(',');

      var pSel = [
        'a','button',
        '[role="button"]','summary',
        '.back-to-top',
        '.welcome-overlay',
        '.welcome-theme-toggle',
        '.welcome-mascot-credit',
        '.nav-item',
        '#nav-music',
        '.header-logo',
        '.footer-provider','a.footer-provider',
        '.gateway-home-btn',
        '.gateway-switch a',
        'input[type="submit"]','input[type="button"]',
        'input[type="checkbox"]','input[type="radio"]',
        'select','label[for]',
        '.slider-btn','.swiper-button-next','.swiper-button-prev'
      ].join(',');

      var css = a.KeyFrameContent + '\n' + b.KeyFrameContent + '\n' + c.KeyFrameContent + '\n';

      css += 'html { animation: ' + anim(a) + ' !important; }\n';

      css += 'body, body * { cursor: inherit !important; }\n';

      css += tSel + ' { animation: ' + anim(b) + ' !important; }\n';

      css += pSel + ' { animation: ' + anim(c) + ' !important; }\n';

      var pChildSel = pSel.split(',').map(function(s) { return s.trim() + ' *'; }).join(',');
      css += pChildSel + ' { cursor: inherit !important; }\n';

      css += '[data-aos] { cursor: inherit !important; }\n';

      var style = document.createElement('style');
      style.id = 'ani-cursor-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }
  };
  document.head.appendChild(s);
})();
