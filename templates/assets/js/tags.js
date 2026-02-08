/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-02-08 11:28:38
 * Fingerprint: 22b6d7a200f2b512
 * Copyright © 2026 Serenity. All rights reserved.
 * Unauthorized copying or distribution is prohibited.
 */
document.addEventListener('DOMContentLoaded',function(){const rings=document.querySelectorAll('.ring[data-name]');const tooltip=document.getElementById('ring-tooltip');if(!rings.length||!tooltip)return;const colors={'ring-1':'#5B8FF9','ring-2':'#5AD8A6','ring-3':'#F6BD16','ring-4':'#E86452'};rings.forEach(ring=>{ring.addEventListener('mouseenter',(e)=>{const name=ring.dataset.name;const count=ring.dataset.count;const ringClass=Array.from(ring.classList).find(c=>c.startsWith('ring-'));const color=colors[ringClass];tooltip.querySelector('.tooltip-dot').style.background=color;tooltip.querySelector('.tooltip-name').textContent=name;tooltip.querySelector('.tooltip-count').textContent=count+' 篇';tooltip.style.opacity='1';tooltip.style.visibility='visible';});ring.addEventListener('mouseleave',()=>{tooltip.style.opacity='0';tooltip.style.visibility='hidden';});});});