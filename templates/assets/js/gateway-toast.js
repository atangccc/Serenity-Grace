/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-05-07 12:04:20
 * Fingerprint: a8fd07c3a5b41317
 * Copyright © 2026 Serenity. All rights reserved.
 * Unauthorized copying or distribution is prohibited.
 */
function showToast(message,type,targetElement,duration){type=type||'info';duration=duration||3000;var icons={error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'};var existing=document.querySelector('.sepo-toast');if(existing)existing.remove();var toast=document.createElement('div');toast.className='sepo-toast '+type;var iconSpan=document.createElement('span');iconSpan.className='sepo-toast-icon';iconSpan.innerHTML=icons[type]||icons.info;var msgSpan=document.createElement('span');msgSpan.className='sepo-toast-message';msgSpan.textContent=message;toast.appendChild(iconSpan);toast.appendChild(msgSpan);document.body.appendChild(toast);requestAnimationFrame(function(){toast.classList.add('show');});setTimeout(function(){toast.classList.remove('show');setTimeout(function(){toast.remove();},300);},duration);}