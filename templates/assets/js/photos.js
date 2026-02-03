/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-02-03 15:56:45
 * Fingerprint: 9177fdd3bb22d0cc
 * Copyright © 2026 Serenity. All rights reserved.
 * Unauthorized copying or distribution is prohibited.
 */
document.addEventListener('DOMContentLoaded',function(){const filterBtns=document.querySelectorAll('.filter-btn');const photoItems=document.querySelectorAll('.photo-item');filterBtns.forEach(btn=>{btn.addEventListener('click',function(){const group=this.dataset.group;filterBtns.forEach(b=>b.classList.remove('active'));this.classList.add('active');photoItems.forEach(item=>{if(group==='all'||item.dataset.group===group){item.classList.remove('hidden');}else{item.classList.add('hidden');}});});});});function openLightbox(img){const lightbox=document.getElementById('lightbox');const lightboxImg=document.getElementById('lightbox-img');lightboxImg.src=img.src;lightboxImg.alt=img.alt;lightbox.classList.add('active');document.body.style.overflow='hidden';}function closeLightbox(event){if(event&&event.target !==event.currentTarget&&event.target.id !=='lightbox'){return;}const lightbox=document.getElementById('lightbox');lightbox.classList.remove('active');document.body.style.overflow='';}document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeLightbox();}});