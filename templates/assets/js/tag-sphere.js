/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-18 20:18:24
 * Fingerprint: d54be6a69e9c9bfb
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * 3D 旋转球形标签云
 * PJAX 兼容：状态挂到 window 单例，resize 仅绑定一次，避免随内容重执行而叠加。
 */
(function () {
  'use strict';

  if (window.__tagSphereLoaded) {
    // 脚本已加载过（PJAX 随内容重复注入）：仅重新初始化当前页 DOM
    if (typeof window.__tagSphereInit === 'function') window.__tagSphereInit();
    return;
  }
  window.__tagSphereLoaded = true;

  var MAX_TAGS = 60;          
  var RADIUS_RATIO = 0.42;    
  var IDLE_SPEED_X = 0.0008;  
  var IDLE_SPEED_Y = 0.0015;

  var instances = [];         

  function destroyAll() {
    instances.forEach(function (st) {
      if (st.rafId) cancelAnimationFrame(st.rafId);
      st.unbind();
      st.root.classList.remove('tag-sphere-ready');
      st.tags.forEach(function (t) {
        var s = t.el.style;
        s.transform = s.opacity = s.position = s.left = s.top = s.filter = s.zIndex = s.pointerEvents = '';
      });
    });
    instances = [];
  }

  function initOne(root) {
    var els = Array.prototype.slice.call(root.querySelectorAll('.widget-tag'))
      .filter(function (el) { return el.getAttribute('href'); });

    if (els.length < 3) return;
    if (els.length > MAX_TAGS) els = els.slice(0, MAX_TAGS);

    var n = els.length;
    var w = root.clientWidth || 220;
    var h = root.clientHeight || 220;
    var radius = Math.min(w, h) * RADIUS_RATIO;

    var tags = [];
    for (var i = 0; i < n; i++) {
      var phi = Math.acos(-1 + (2 * i + 1) / n);
      var theta = Math.sqrt(n * Math.PI) * phi;
      tags.push({
        el: els[i],
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi)
      });
    }

    root.classList.add('tag-sphere-ready');

    var st = {
      root: root,
      tags: tags,
      radius: radius,
      rafId: null,
      speedX: IDLE_SPEED_X,
      speedY: IDLE_SPEED_Y,
      angleX: 0,
      angleY: 0,
      hovering: false,
      dragging: false,
      lastX: 0,
      lastY: 0,
      moved: false,
      unbind: function () {}
    };

    var hoverSpeed = 0.04; 

    function onMove(e) {
      if (st.dragging) return; 
      var rect = root.getBoundingClientRect();
      var dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      var dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
      st.speedY = dx * hoverSpeed;
      st.speedX = -dy * hoverSpeed;
    }
    function onLeave() {
      if (st.dragging) return;
      st.speedX = IDLE_SPEED_X;
      st.speedY = IDLE_SPEED_Y;
    }

    // ===== 拖动旋转 =====
    function pointerXY(e) {      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    function onDragStart(e) {
      st.dragging = true;
      st.moved = false;
      var p = pointerXY(e);
      st.lastX = p.x;
      st.lastY = p.y;
      root.classList.add('tag-sphere-grabbing');
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd);
    }
    function onDragMove(e) {
      if (!st.dragging) return;
      var p = pointerXY(e);
      var dx = p.x - st.lastX;
      var dy = p.y - st.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) st.moved = true;
      st.lastX = p.x;
      st.lastY = p.y;
      st.angleY += dx * 0.006;
      st.angleX += -dy * 0.006;
      st.speedY = dx * 0.0015; 
      st.speedX = -dy * 0.0015;
      if (e.cancelable) e.preventDefault();
    }
    function onDragEnd() {
      st.dragging = false;
      root.classList.remove('tag-sphere-grabbing');
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
    }
    function onClickCapture(e) {
      if (st.moved) {
        e.preventDefault();
        e.stopPropagation();
        st.moved = false;
      }
    }

    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('mousedown', onDragStart);
    root.addEventListener('touchstart', onDragStart, { passive: true });
    root.addEventListener('click', onClickCapture, true);

    st.unbind = function () {
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('mousedown', onDragStart);
      root.removeEventListener('touchstart', onDragStart);
      root.removeEventListener('click', onClickCapture, true);
      onDragEnd();
    };

    instances.push(st);
    render(st);
  }

  function render(st) {
    if (instances.indexOf(st) === -1) return;

    st.angleX += st.speedX;
    st.angleY += st.speedY;

    var sinX = Math.sin(st.angleX), cosX = Math.cos(st.angleX);
    var sinY = Math.sin(st.angleY), cosY = Math.cos(st.angleY);
    var r = st.radius;
    var PERSPECTIVE = r * 2.4;

    st.tags.forEach(function (t) {
      var y1 = t.y * cosX - t.z * sinX;
      var z1 = t.y * sinX + t.z * cosX;
      var x2 = t.x * cosY + z1 * sinY;
      var z2 = -t.x * sinY + z1 * cosY;

      var px = x2 * r;
      var py = y1 * r;
      var zPos = z2 * r;
      var scale = PERSPECTIVE / (PERSPECTIVE - zPos);

      var depth = (z2 + 1) / 2;
      var opacity = 0.25 + depth * 0.75;

      var el = t.el;
      el.style.transform =
        'translate(-50%, -50%) translate3d(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px,0) scale(' + scale.toFixed(3) + ')';
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(Math.round(depth * 100));
      el.style.filter = depth < 0.5 ? 'blur(' + ((0.5 - depth) * 1.8).toFixed(2) + 'px)' : 'none';
      el.style.pointerEvents = depth < 0.35 ? 'none' : 'auto';
    });

    st.rafId = requestAnimationFrame(function () { render(st); });
  }

  function initAll() {
    destroyAll();
    var roots = document.querySelectorAll('.widget-tags-sphere');
    Array.prototype.forEach.call(roots, function (root) {
      initOne(root);
    });
  }

  function boot() {
    requestAnimationFrame(initAll);
  }

  var resizeTimer = null;

  // 暴露给 PJAX 重入：每次进入带标签云的页面时调用
  window.__tagSphereInit = function () {
    boot();
    // 注册一次性离场清理（停止 rAF、解绑、清定时器）
    if (typeof window.__pjaxOnLeave === 'function') {
      window.__pjaxOnLeave(function () {
        destroyAll();
        if (resizeTimer) { clearTimeout(resizeTimer); resizeTimer = null; }
      });
    }
  };

  // resize 监听仅绑定一次（脚本首次执行时）
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initAll, 250);
  });

  // 入口：兼容首次加载与 PJAX 注入
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.__tagSphereInit);
  } else {
    window.__tagSphereInit();
  }
})();
