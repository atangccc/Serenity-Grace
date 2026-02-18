/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-02-18 21:10:14
 * Fingerprint: 65205959c2b1eee7
 * Copyright © 2026 Serenity. All rights reserved.
 * Unauthorized copying or distribution is prohibited.
 */
document.addEventListener('DOMContentLoaded',function(){var filterBtns=document.querySelectorAll('.filter-btn');var photoItems=document.querySelectorAll('.photo-item');filterBtns.forEach(function(btn){btn.addEventListener('click',function(){var group=this.dataset.group;filterBtns.forEach(function(b){b.classList.remove('active');});this.classList.add('active');photoItems.forEach(function(item){if(group==='all'||item.dataset.group===group){item.classList.remove('hidden');}else{item.classList.add('hidden');}});});});var overlay=document.getElementById('photo-lightbox');var lbImg=document.getElementById('photo-lightbox-img');if(!overlay||!lbImg)return;function openLightbox(src,alt){lbImg.src='';lbImg.alt=alt||'';lbImg.src=src;overlay.classList.add('active');document.body.style.overflow='hidden';}function closeLightbox(){overlay.classList.remove('active');document.body.style.overflow='';lbImg.src='';}document.addEventListener('click',function(e){var wrapper=e.target.closest('.photo-wrapper');if(!wrapper)return;var img=wrapper.querySelector('img');if(!img)return;e.stopPropagation();openLightbox(img.src,img.alt);});overlay.addEventListener('click',closeLightbox);document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay.classList.contains('active')){closeLightbox();}});});