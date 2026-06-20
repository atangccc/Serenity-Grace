/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-20 19:32:31
 * Fingerprint: 11ff2e64a2e0cffa
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

var COMMENT_DATA = [];

async function fetchCommentData() {
  // 幂等：重入时重置数组，避免数据翻倍累积
  COMMENT_DATA = [];
  try {
    const params = new URLSearchParams({
      group: 'content.halo.run',
      kind: 'SinglePage',
      name: window.__GUESTBOOK_PAGE_NAME__ || 'guestbook',
      page: '1',
      size: '100',
      version: 'v1alpha1',
      withReplies: 'false'
    });
    
    const response = await fetch(`/apis/api.halo.run/v1alpha1/comments?${params.toString()}`);
    if (!response.ok) return;
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        const author = item.owner?.displayName || item.owner?.name || '匿名';
        const text = htmlToText(item.spec?.content || '').trim();
        
        let avatar = '';
        const annotations = item.spec?.owner?.annotations;
        if (annotations) {
          const website = annotations.website;
          const emailHash = annotations['email-hash'];
          if (website && emailHash) {
            const baseUrl = website.endsWith('/') ? website : website + '/';
            avatar = `${baseUrl}avatar/${emailHash}`;
          }
        }
        
        if (text) {
          COMMENT_DATA.push({ author, text, avatar });
        }
      });
      
      const count = COMMENT_DATA.length;
      document.getElementById('guestbookCount').textContent = count;
      document.getElementById('guestbookCountText').textContent = `共 ${count} 条`;
    }
  } catch (error) {
  }
}

fetchCommentData();

// Use var to avoid redeclaration error on re-execution
var DanmakuSystem = class DanmakuSystem {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = document.getElementById('danmakuCanvas');
    this.danmakus = [];
    this.activeDanmakus = new Set();
    this.isPaused = false;
    this.tracks = 6;
    this.trackHeight = 60;
    this.messages = [];
    
    this.init();
  }
  
  async init() {
    let waitTime = 0;
    const maxWaitTime = 12000;
    const checkInterval = 500;
    
    while (COMMENT_DATA.length === 0 && waitTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }
    
    if (COMMENT_DATA && COMMENT_DATA.length > 0) {
      this.messages = COMMENT_DATA;
      
      const hint = document.getElementById('danmakuHint');
      if (hint) hint.style.display = 'none';
      
      setTimeout(() => this.sendInitialDanmakus(), 500);
      this.startAutoPlay();
    }
  }
  
  startAutoPlay() {
    let currentIndex = 0;
    
    this._autoPlayTimer = setInterval(() => {
      if (!this.isPaused && this.messages.length > 0) {
        const msg = this.messages[currentIndex];
        
        if (!this.activeDanmakus.has(msg.text)) {
          this.addDanmaku(msg.author, msg.text, msg.avatar);
        }
        
        currentIndex = (currentIndex + 1) % this.messages.length;
      }
    }, 5000);
  }
  
  sendInitialDanmakus() {
    const count = Math.min(3, this.messages.length);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const msg = this.messages[i];
        this.addDanmaku(msg.author, msg.text, msg.avatar);
      }, i * 2000);
    }
  }
  
  addDanmaku(author, text, avatar) {
    this.activeDanmakus.add(text);
    
    const danmaku = document.createElement('div');
    danmaku.className = 'danmaku-item';
    
    const avatarHTML = avatar ? 
      `<img src="${avatar}" class="danmaku-avatar" alt="${this.escapeHtml(author)}" onerror="this.style.display='none'" />` : '';
    
    danmaku.innerHTML = `
      ${avatarHTML}
      <span class="danmaku-author">${this.escapeHtml(author)}:</span>
      <span class="danmaku-text">${this.escapeHtml(text)}</span>
    `;
    
    const track = Math.floor(Math.random() * this.tracks);
    const top = track * this.trackHeight + 20;
    
    danmaku.style.top = `${top}px`;
    danmaku.style.left = '100%';
    
    const duration = 15 + Math.random() * 5;
    danmaku.style.animationDuration = `${duration}s`;
    danmaku.style.animationName = 'danmaku-move';
    danmaku.style.animationTimingFunction = 'linear';
    danmaku.style.animationFillMode = 'forwards';
    
    this.canvas.appendChild(danmaku);
    this.danmakus.push(danmaku);
    
    danmaku.addEventListener('animationend', () => {
      danmaku.remove();
      this.danmakus = this.danmakus.filter(d => d !== danmaku);
      this.activeDanmakus.delete(text);
    });
  }
  
  escapeHtml(text) {
    // 复用 main.js 全局 escapeHtml
    return (typeof window.escapeHtml === 'function') ? window.escapeHtml(text) : text;
  }
};

function initDanmakuSystem() {
  // 重入时停掉上一个实例的自动播放定时器，避免 interval 泄漏
  if (window.__danmakuSystem && window.__danmakuSystem._autoPlayTimer) {
    clearInterval(window.__danmakuSystem._autoPlayTimer);
  }
  window.__danmakuSystem = new DanmakuSystem('danmakuContainer');
  if (typeof window.__pjaxOnLeave === 'function') {
    window.__pjaxOnLeave(function () {
      if (window.__danmakuSystem && window.__danmakuSystem._autoPlayTimer) {
        clearInterval(window.__danmakuSystem._autoPlayTimer);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDanmakuSystem);
} else {
  initDanmakuSystem();
}
