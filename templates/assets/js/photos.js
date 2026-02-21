/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-02-21 13:40:33
 * Fingerprint: a60e55b473a87906
 * Copyright © 2026 Serenity. All rights reserved.
 * Unauthorized copying or distribution is prohibited.
 */
document.addEventListener('DOMContentLoaded',function(){var filterBtns=document.querySelectorAll('.filter-btn');var photoItems=document.querySelectorAll('.photo-item');filterBtns.forEach(function(btn){btn.addEventListener('click',function(){var group=this.dataset.group;filterBtns.forEach(function(b){b.classList.remove('active');});this.classList.add('active');photoItems.forEach(function(item){if(group==='all'||item.dataset.group===group){item.classList.remove('hidden');}else{item.classList.add('hidden');}});});});SerenityLightbox.create({className:'photo-lightbox',delegateSelector:'.photo-wrapper img'});});