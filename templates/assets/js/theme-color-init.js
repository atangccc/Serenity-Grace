/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-18 20:12:01
 * Fingerprint: 7a2764b9464c2fa5
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

(function() {
  function hexToHsl(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
    if (!result) return null;

    var r = parseInt(result[1], 16) / 255;
    var g = parseInt(result[2], 16) / 255;
    var b = parseInt(result[3], 16) / 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hexToRgbString(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
    if (!result) return '124, 205, 232';
    return parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16);
  }

  function hslToRgbString(h, s, l) {
    s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2,
        r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return Math.round((r + m) * 255) + ', ' + Math.round((g + m) * 255) + ', ' + Math.round((b + m) * 255);
  }

  var DEFAULT_LIGHT = '#7DCDE8';
  var DEFAULT_DARK = '#E87D98';

  function applyAccent(color) {
    var root = document.documentElement;
    var hsl = hexToHsl(color);

    var primary = color;
    var secondary, secondaryRgb;
    if (hsl) {
      var sh = (hsl.h + 20) % 360;
      secondary = 'hsl(' + sh + ', ' + hsl.s + '%, ' + hsl.l + '%)';
      secondaryRgb = hslToRgbString(sh, hsl.s, hsl.l);
    } else {
      secondary = color;
      secondaryRgb = hexToRgbString(color);
    }

    root.style.setProperty('--color-accent', primary);
    root.style.setProperty('--color-accent-secondary', secondary);
    root.style.setProperty('--color-accent-rgb', hexToRgbString(color));
    root.style.setProperty('--color-accent-secondary-rgb', secondaryRgb);
    root.setAttribute('data-hue-active', 'true');

    var h = hsl ? hsl.h : 195;
    root.style.setProperty('--gateway-bg-light-start', 'hsl(' + h + ', 8%, 97%)');
    root.style.setProperty('--gateway-bg-light-end', 'hsl(' + h + ', 6%, 95%)');
    root.style.setProperty('--gateway-bg-light-mute', 'hsl(' + h + ', 5%, 92%)');
    root.style.setProperty('--gateway-bg-dark-start', 'hsl(' + h + ', 4%, 12%)');
    root.style.setProperty('--gateway-bg-dark-end', 'hsl(' + ((h + 15) % 360) + ', 3%, 10%)');
    root.style.setProperty('--gateway-bg-dark-mute', 'hsl(' + ((h + 10) % 360) + ', 3%, 14%)');
  }

  function applyThemeAccent() {
    var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var lightColor = window.__ACCENT_LIGHT || DEFAULT_LIGHT;
    var darkColor = window.__ACCENT_DARK || DEFAULT_DARK;
    applyAccent(theme === 'light' ? lightColor : darkColor);
  }

  window.__applyThemeAccent = applyThemeAccent;

  applyThemeAccent();
})();
