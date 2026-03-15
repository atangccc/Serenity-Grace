/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-03-14 12:07:18
 * Fingerprint: 03eca0170d5b92e0
 * Copyright © 2026 Serenity. All rights reserved.
 * Unauthorized copying or distribution is prohibited.
 */
var currentLinkUrl = '';
var isDragging = false;
var startX = 0;
var curX = 0;

document.addEventListener('DOMContentLoaded', function() {
    // 1. 拦截所有带 data-link 的卡片点击
    const linkCards = document.querySelectorAll('.link-card[data-link]');
    linkCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止卡片自带的跳转
            const url = this.href;
            const name = this.querySelector('.link-name')?.textContent || '该站点';
            showLinkConfirm(url, name); // 调用滑块弹窗
        });
    });

    // 2. 初始化滑块逻辑
    const slider = document.querySelector('.link-slider-button');
    if (slider) {
        slider.addEventListener('mousedown', startDrag);
        slider.addEventListener('touchstart', startDrag, {passive: true});
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, {passive: false});
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
});

// 显示滑块弹窗
function showLinkConfirm(url, name) {
    currentLinkUrl = url;
    const modal = document.getElementById('linkConfirmModal');
    modal.querySelector('.link-target-name').textContent = name;
    modal.classList.add('active');
    
    // 重置滑块状态
    const btn = document.querySelector('.link-slider-button');
    const bg = document.querySelector('.link-slider-bg');
    btn.style.left = '0';
    bg.style.width = '0';
}

function closeLinkConfirm() {
    document.getElementById('linkConfirmModal').classList.remove('active');
}

// 拖拽逻辑 (关键：在拖动结束且成功时执行 window.open)
// 在 links.js 中找到对应函数并替换
function drag(e) {
    if (!isDragging) return;
    
    // 获取当前坐标
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const sliderTrack = document.querySelector('.link-slider-track');
    const sliderBtn = document.querySelector('.link-slider-button');
    const bg = document.querySelector('.link-slider-bg');
    
    // 关键优化：拖拽时移除所有过渡动画，实现“零延迟”跟手
    sliderBtn.style.transition = 'none';
    bg.style.transition = 'none';

    let moveX = clientX - startX;
    const maxDistance = sliderTrack.offsetWidth - sliderBtn.offsetWidth;
    
    // 边界限制
    if (moveX < 0) moveX = 0;
    if (moveX > maxDistance) moveX = maxDistance;
    
    // 使用 transform 代替 left 性能更好（可选，这里先用 left 保证兼容）
    sliderBtn.style.left = moveX + 'px';
    bg.style.width = (moveX + sliderBtn.offsetWidth / 2) + 'px'; // 背景颜色跟着滑块走
    
    if (moveX >= maxDistance) {
        isDragging = false;
        // 成功后的反馈
        sliderBtn.style.transition = 'all 0.2s ease'; // 成功时加个微弱动画
        document.querySelector('.link-slider-text').textContent = '验证通过';
        document.querySelector('.link-slider-text').style.color = '#fff';
        
        setTimeout(() => {
            window.open(currentLinkUrl, '_blank', 'noopener,noreferrer');
            closeLinkConfirm();
        }, 300);
    }
}

function startDrag(e) {
    isDragging = true;
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const sliderBtn = document.querySelector('.link-slider-button');
    
    // 记录点击位置相对于滑块左侧的偏移，防止点击瞬间滑块“闪现”
    startX = clientX - sliderBtn.offsetLeft;
    
    // 拖动时增加一点点击缩放的视觉反馈
    sliderBtn.style.transform = 'scale(0.95)';
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    
    const sliderTrack = document.querySelector('.link-slider-track');
    const sliderBtn = document.querySelector('.link-slider-button');
    const bg = document.querySelector('.link-slider-bg');
    const maxDistance = sliderTrack.offsetWidth - sliderBtn.offsetWidth;
    
    sliderBtn.style.transform = 'scale(1)'; // 恢复大小

    // 如果没拉到底，恢复 transition 实现平滑弹回
    if (parseInt(sliderBtn.style.left) < maxDistance) {
        sliderBtn.style.transition = 'left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        bg.style.transition = 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        sliderBtn.style.left = '0';
        bg.style.width = '0';
    }
}
