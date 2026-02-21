/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-02-21 13:40:33
 * Fingerprint: a60e55b473a87906
 * Copyright © 2026 Serenity. All rights reserved.
 * Unauthorized copying or distribution is prohibited.
 */
window.SerenityLightbox=(function(){function create(opts){var className=opts.className;var delegateSelector=opts.delegateSelector;var getSrc=opts.getSrc||function(img){return img.getAttribute('data-src')||img.src;};var guard=opts.guard;if(typeof guard==='function'&&guard()===false)return null;var overlay=document.createElement('div');overlay.className=className;overlay.innerHTML='<div class="'+className+'-close">&times;</div>'+'<img class="'+className+'-img" src="" alt="" />';document.body.appendChild(overlay);var lbImg=overlay.querySelector('.'+className+'-img');function open(src,alt){lbImg.src='';lbImg.alt=alt||'';lbImg.src=src;overlay.classList.add('active');document.body.style.overflow='hidden';}function close(){overlay.classList.remove('active');document.body.style.overflow='';lbImg.src='';}document.addEventListener('click',function(e){var img=e.target.closest(delegateSelector);if(!img)return;e.stopPropagation();open(getSrc(img),img.alt);});overlay.addEventListener('click',close);document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay.classList.contains('active')){close();}});return{open:open,close:close,overlay:overlay};}return{create:create};})();