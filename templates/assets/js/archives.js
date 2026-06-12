/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-12 17:18:05
 * Fingerprint: 028f1f763c1f1f0f
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

function sortPinnedPosts() {
  const archiveList = document.querySelector('.archive-list');
  if (!archiveList) return;
  
  const cards = Array.from(archiveList.querySelectorAll('.archive-card'));
  if (cards.length === 0) return;

  const pinnedCards = cards.filter(card => card.classList.contains('pinned'));
  const normalCards = cards.filter(card => !card.classList.contains('pinned'));

  if (pinnedCards.length === 0) return;

  archiveList.innerHTML = '';

  const fragment = document.createDocumentFragment();
  pinnedCards.forEach(card => fragment.appendChild(card));
  normalCards.forEach(card => fragment.appendChild(card));
  archiveList.appendChild(fragment);
}

function getCommentTargetName(comment) {
  if (!comment) return '';
  var spec = comment.spec || {};
  var ref = spec.subjectRef || spec.subject || spec.targetRef || spec.commentSubject || {};
  return ref.name || spec.name || '';
}

async function loadLatestComments() {
  const container = document.getElementById('latestComments');
  if (!container) return;

  const commentCount = parseInt(container.closest('.sidebar-widget').getAttribute('data-comment-count') || '3');

  try {
    const allComments = [];
    const postPermalinkMap = new Map();

    const postsResponse = await fetch(`/apis/api.content.halo.run/v1alpha1/posts?page=1&size=20&sort=metadata.creationTimestamp,desc`);
    let recentPosts = [];
    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      recentPosts = postsData.items || [];
      recentPosts.forEach(post => {
        if (post && post.metadata && post.metadata.name) {
          postPermalinkMap.set(post.metadata.name, post.status && post.status.permalink ? post.status.permalink : '/');
        }
      });
    }

    if (recentPosts.length > 0) {
      const commentTasks = recentPosts.slice(0, 12).map(post => {
        const params = new URLSearchParams({
          group: 'content.halo.run',
          kind: 'Post',
          name: post.metadata.name,
          page: '1',
          size: '5',
          version: 'v1alpha1',
          withReplies: 'false'
        });
        return fetch(`/apis/api.halo.run/v1alpha1/comments?${params.toString()}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => ({ post: post, data: data }))
          .catch(() => null);
      });

      const results = await Promise.all(commentTasks);
      results.forEach(result => {
        if (!result || !result.data || !result.data.items || result.data.items.length === 0) return;
        result.data.items.forEach(comment => {
          comment._postPermalink = result.post && result.post.status && result.post.status.permalink ? result.post.status.permalink : '/';
          allComments.push(comment);
        });
      });
    }

    allComments.sort((a, b) => {
      const timeA = new Date(a.metadata.creationTimestamp).getTime();
      const timeB = new Date(b.metadata.creationTimestamp).getTime();
      return timeB - timeA;
    });

    const latestComments = allComments.slice(0, commentCount);

    if (latestComments.length > 0) {
      const commentsHTML = latestComments.map(comment => {
        const author = comment.owner?.displayName || '匿名';
        const contentHTML = comment.spec?.content || '';
        const content = htmlToText(contentHTML);
        const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
        const postUrl = comment._postPermalink || '/';

        let avatar = '';
        const annotations = comment.spec?.owner?.annotations;
        if (annotations) {
          const website = annotations.website;
          const emailHash = annotations['email-hash'];
          if (website && emailHash) {
            const baseUrl = website.endsWith('/') ? website : website + '/';
            avatar = `${baseUrl}avatar/${emailHash}`;
          }
        }

        if (!avatar) {
          avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}`;
        }

        return `
          <a href="${postUrl}#comment-${comment.metadata.name}" class="comment-item">
            <img class="comment-avatar" src="${avatar}" alt="${escapeHtml(author)}" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}'" />
            <div class="comment-body">
              <span class="comment-author">${escapeHtml(author)}</span>
              <p class="comment-text">${escapeHtml(shortContent)}</p>
            </div>
          </a>
        `;
      }).join('');

      container.innerHTML = commentsHTML;
    } else {
      container.innerHTML = '<div class="comment-empty">暂无评论</div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="comment-empty">暂无评论</div>';
  }
}

async function loadHitokoto() {
  const widget = document.getElementById('hitokoto-widget');
  const textEl = document.getElementById('hitokoto-text');
  const fromEl = document.getElementById('hitokoto-from');
  
  if (!textEl || !widget) return;
  
  const apiUrl = widget.getAttribute('data-api') || 'https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=i&c=k';
  
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.hitokoto) {
        textEl.textContent = data.hitokoto;
        if (fromEl && data.from) {
          fromEl.textContent = `—— ${data.from}`;
        }
      }
    }
  } catch (error) {

  }
}

function truncateArchiveMeta() {
  var isMobile = window.innerWidth <= 768;
  document.querySelectorAll('.archive-card-meta').forEach(function (meta) {

    var oldEllipsis = meta.querySelector('.archive-meta-ellipsis');
    if (oldEllipsis) oldEllipsis.remove();
    meta.querySelectorAll('.archive-category, .archive-tag').forEach(function (el) {
      el.style.display = '';
    });
    if (!isMobile) return;

    var items = Array.from(meta.querySelectorAll('.archive-category, .archive-tag'));
    if (items.length <= 3) return;
    for (var i = 3; i < items.length; i++) {
      items[i].style.display = 'none';
    }

    var lastVisible = items[2];
    var dot = document.createElement('span');
    dot.className = 'archive-meta-ellipsis';
    dot.textContent = '...';
    lastVisible.parentNode.insertBefore(dot, lastVisible.nextSibling);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    sortPinnedPosts();
    loadLatestComments();
    loadHitokoto();
    truncateArchiveMeta();
  });
} else {
  sortPinnedPosts();
  loadLatestComments();
  loadHitokoto();
  truncateArchiveMeta();
}
