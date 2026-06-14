/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-14 20:38:41
 * Fingerprint: c77ef69c22818532
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

var GITHUB_API_BASE = 'https://api.github.com';
var FETCH_TIMEOUT = 8000;

var LANGUAGE_COLORS = {
  'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
  'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584', 'C++': '#f34b7d',
  'C': '#555555', 'PHP': '#4F5D95', 'Ruby': '#701516', 'Swift': '#F05138',
  'Kotlin': '#A97BFF', 'Vue': '#41b883', 'HTML': '#e34c26', 'CSS': '#563d7c',
  'Shell': '#89e051', 'Dart': '#00B4AB'
};

// 存储项目数据用于弹窗
var projectsCache = new Map();

function parseGitHubUrl(url) {
  if (typeof url !== 'string') return null;
  const normalized = url.trim();
  if (!normalized) return null;

  let parsed;
  try {
    // 支持协议缺失写法：github.com/owner/repo
    let stripped = normalized;
    while (stripped.startsWith('/')) stripped = stripped.slice(1);
    const candidate = normalized.startsWith('http://') || normalized.startsWith('https://')
      ? normalized
      : ('https://' + stripped);
    parsed = new URL(candidate);
  } catch (e) {
    return null;
  }

  if (!parsed.hostname || parsed.hostname.toLowerCase().indexOf('github.com') === -1) return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  let repo = parts[1];
  if (repo.toLowerCase().endsWith('.git')) repo = repo.slice(0, -4);
  return { owner: parts[0], repo: repo };
}

function sanitizeUrl(url, fallback = '#') {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/')
  ) return trimmed;
  return fallback;
}

async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function getAuthHeaders() {
  const token = window.GITHUB_TOKEN;
  if (token) return { 'Authorization': `token ${token}` };
  return {};
}

async function fetchGitHubRepo(owner, repo) {
  try {
    const response = await fetchWithTimeout(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchGitHubReleases(owner, repo) {
  try {
    const response = await fetchWithTimeout(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=20`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    return [];
  }
}

function createProjectCard(data, isCustom = false, ownerType = 'mine') {
  const card = document.createElement('a');
  card.className = 'project-card';
  card.setAttribute('data-aos', 'fade-up');
  card.setAttribute('data-owner-type', ownerType);
  
  const languageColor = LANGUAGE_COLORS[data.language] || '#858585';
  let topics = [];
  if (isCustom && typeof data.topics === 'string') {
    topics = data.topics.split(',').map(t => t.trim()).filter(t => t).slice(0, 2);
  } else if (Array.isArray(data.topics)) {
    topics = data.topics.slice(0, 2);
  }
  
  const avatarUrl = sanitizeUrl(data.avatar || data.owner?.avatar_url || '', '');
  const stars = data.stars || data.stargazers_count || 0;
  const forks = data.forks || data.forks_count || 0;
  const projectUrl = sanitizeUrl(isCustom ? data.url : (data.html_url || data.url), '#');
  const safeName = escapeForHtml(data.name || 'Untitled');
  const safeDescription = escapeForHtml(data.description || '暂无描述');
  const safeLanguage = escapeForHtml(data.language || '');
  const safeAvatarUrl = escapeForHtml(avatarUrl);
  const safeTopics = topics.map(t => escapeForHtml(t));
  
  // 根据项目类型设置不同行为
  if (ownerType === 'starred') {
    // 收藏项目：直接跳转链接
    card.href = projectUrl;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
  } else {
    // 我的项目：打开版本详情弹窗
    card.href = 'javascript:void(0)';
    const projectId = data.full_name || data.name;
    projectsCache.set(projectId, { data, isCustom, avatarUrl, projectUrl });
    card.onclick = (e) => {
      e.preventDefault();
      openReleasesModal(projectId);
    };
  }
  
  const ownerBadge = ownerType === 'mine' 
    ? `<div class="project-owner-badge mine" title="我的项目">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
       </div>`
    : `<div class="project-owner-badge starred" title="收藏项目">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
       </div>`;
  
  card.innerHTML = `
    ${ownerBadge}
    <div class="project-avatar${avatarUrl ? '' : ' no-image'}">
      ${avatarUrl ? 
        `<img src="${safeAvatarUrl}" alt="${safeName}" class="project-avatar-img" />` :
        `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`}
    </div>
    <div class="project-info">
      <span class="project-name">${safeName}</span>
      <p class="project-description">${safeDescription}</p>
      <div class="project-meta">
        ${data.language ? `<div class="project-language"><span class="language-dot" style="background-color: ${languageColor}"></span><span>${safeLanguage}</span></div>` : ''}
        <div class="project-meta-item"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg><span>${stars}</span></div>
        <div class="project-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/></svg><span>${forks}</span></div>
        ${safeTopics.length > 0 ? `<div class="project-topics">${safeTopics.map(t => `<span class="project-topic">${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>
    <div class="project-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg></div>
  `;
  return card;
}

// 版本详情弹窗功能
function openReleasesModal(projectId) {
  const project = projectsCache.get(projectId);
  if (!project) return;
  
  const modal = document.getElementById('releasesModal');
  const loading = document.getElementById('releasesLoading');
  const empty = document.getElementById('releasesEmpty');
  const timeline = document.getElementById('releasesTimeline');
  
  // 设置项目信息
  document.getElementById('releasesAvatar').src = project.avatarUrl || '';
  document.getElementById('releasesProjectName').textContent = project.data.name;
  document.getElementById('releasesProjectDesc').textContent = project.data.description || '暂无描述';
  document.getElementById('releasesGithubLink').href = project.projectUrl;
  
  // 两步显示：先 display:flex，再触发 opacity 过渡
  modal.classList.add('ready');
  document.body.style.overflow = 'hidden';
  // 强制回流后再添加 active，确保 transition 生效
  void modal.offsetHeight;
  modal.classList.add('active');
  
  // 重置状态
  loading.style.display = 'flex';
  empty.style.display = 'none';
  timeline.innerHTML = '';
  
  // 加载版本信息
  loadReleases(project);
}

function closeReleasesModal() {
  const modal = document.getElementById('releasesModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  // 等 transition 结束后再隐藏 display
  modal.addEventListener('transitionend', function handler() {
    if (!modal.classList.contains('active')) {
      modal.classList.remove('ready');
    }
    modal.removeEventListener('transitionend', handler);
  });
}

async function loadReleases(project) {
  const loading = document.getElementById('releasesLoading');
  const empty = document.getElementById('releasesEmpty');
  const timeline = document.getElementById('releasesTimeline');
  
  const parsed = parseGitHubUrl(project.projectUrl);
  if (!parsed) {
    loading.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }
  
  const releases = await fetchGitHubReleases(parsed.owner, parsed.repo);
  loading.style.display = 'none';
  
  if (!releases || releases.length === 0) {
    empty.style.display = 'flex';
    return;
  }
  
  // 渲染时间线
  releases.forEach((release, index) => {
    const item = createReleaseItem(release, index === 0);
    timeline.appendChild(item);
  });
}

function createReleaseItem(release, isLatest) {
  const item = document.createElement('div');
  item.className = 'release-item' + (isLatest ? ' latest' : '');
  
  const date = new Date(release.published_at);
  const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeAgo = getTimeAgo(date);
  
  item.innerHTML = `
    <div class="release-marker">
      <div class="release-dot"></div>
      <div class="release-line"></div>
    </div>
    <div class="release-content">
      <div class="release-header">
        <span class="release-tag">${release.tag_name}</span>
        ${isLatest ? '<span class="release-latest-badge">最新</span>' : ''}
        ${release.prerelease ? '<span class="release-prerelease-badge">预发布</span>' : ''}
      </div>
      <h3 class="release-title">${release.name || release.tag_name}</h3>
      <div class="release-meta">
        <span class="release-date">${dateStr}</span>
        <span class="release-time-ago">${timeAgo}</span>
      </div>
      ${release.body ? `<div class="release-body">${formatReleaseBody(release.body)}</div>` : ''}
      <div class="release-actions">
        <a href="${release.html_url}" target="_blank" rel="noopener noreferrer" class="release-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          查看详情
        </a>
      </div>
    </div>
  `;
  return item;
}

function escapeForHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatReleaseBody(body) {
  if (!body) return '';

  // 使用不会与 Markdown 语法冲突的占位符前缀
  var PH = '\x00PH';

  // 保护代码块
  var codeBlocks = [];
  var text = body.replace(/```[\s\S]*?```/g, function(match) {
    codeBlocks.push(match.slice(3, -3));
    return PH + 'CODE' + (codeBlocks.length - 1) + '\x00';
  });

  // 保护行内代码
  var inlineCodes = [];
  text = text.replace(/`([^`]+)`/g, function(match, code) {
    inlineCodes.push(code);
    return PH + 'IC' + (inlineCodes.length - 1) + '\x00';
  });

  // 标准化换行
  text = text.replace(/\r\n/g, '\n');

  // 内联格式化：先处理链接、粗体、斜体，再转义其余 HTML
  function formatInline(str) {
    // 保护已有的占位符
    var phs = [];
    str = str.replace(/\x00PH[A-Z]+\d+\x00/g, function(m) {
      phs.push(m);
      return '\x01REF' + (phs.length - 1) + '\x01';
    });

    // 保护链接
    var links = [];
    str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m, label, url) {
      links.push('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + escapeForHtml(label) + '</a>');
      return '\x01LINK' + (links.length - 1) + '\x01';
    });

    // 转义 HTML
    str = escapeForHtml(str);

    // 粗体和斜体（在转义后的文本上匹配，因为 ** 和 _ 不会被转义）
    str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 恢复链接
    links.forEach(function(html, i) {
      str = str.replace('\x01LINK' + i + '\x01', html);
    });

    // 恢复占位符
    phs.forEach(function(ph, i) {
      str = str.replace('\x01REF' + i + '\x01', ph);
    });

    return str;
  }

  // 计算行的缩进级别（每 2 个空格或 1 个 tab 为一级）
  function getIndentLevel(rawLine) {
    var match = rawLine.match(/^(\s*)/);
    if (!match) return 0;
    var spaces = match[1].replace(/\t/g, '  ').length;
    return Math.floor(spaces / 2);
  }

  var lines = text.split('\n');
  var result = [];
  // 用栈跟踪嵌套列表：每个元素 { type: 'ul'|'ol', indent: number }
  var listStack = [];

  function closeListsToLevel(targetIndent) {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent >= targetIndent) {
      var top = listStack.pop();
      result.push(top.type === 'ol' ? '</ol>' : '</ul>');
    }
  }

  function closeAllLists() {
    while (listStack.length > 0) {
      var top = listStack.pop();
      result.push(top.type === 'ol' ? '</ol>' : '</ul>');
    }
  }

  for (var i = 0; i < lines.length; i++) {
    var rawLine = lines[i];
    var trimmed = rawLine.trim();

    if (!trimmed) {
      // 空行不关闭列表（GitHub 的列表在空行后仍可继续）
      continue;
    }

    // 标题
    var headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      closeAllLists();
      var level = headingMatch[1].length + 1; // # -> h2, ## -> h3, ### -> h4
      if (level > 4) level = 4;
      result.push('<h' + level + '>' + formatInline(headingMatch[2]) + '</h' + level + '>');
      continue;
    }

    // 无序列表项（支持嵌套，通过缩进检测）
    var ulMatch = rawLine.match(/^(\s*)[\*\-]\s+(.+)$/);
    if (ulMatch) {
      var indent = getIndentLevel(rawLine);
      var content = ulMatch[2];

      if (listStack.length === 0) {
        result.push('<ul>');
        listStack.push({ type: 'ul', indent: indent });
      } else {
        var topIndent = listStack[listStack.length - 1].indent;
        if (indent > topIndent) {
          // 更深层嵌套
          result.push('<ul>');
          listStack.push({ type: 'ul', indent: indent });
        } else if (indent < topIndent) {
          // 回到上层
          closeListsToLevel(indent + 1);
          // 如果当前栈顶不是 ul 或缩进不匹配，开新列表
          if (listStack.length === 0 || listStack[listStack.length - 1].type !== 'ul') {
            result.push('<ul>');
            listStack.push({ type: 'ul', indent: indent });
          }
        } else {
          // 同级，如果类型不同需要切换
          if (listStack[listStack.length - 1].type !== 'ul') {
            var old = listStack.pop();
            result.push('</ol>');
            result.push('<ul>');
            listStack.push({ type: 'ul', indent: indent });
          }
        }
      }
      result.push('<li>' + formatInline(content) + '</li>');
      continue;
    }

    // 有序列表项
    var olMatch = rawLine.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      var indent = getIndentLevel(rawLine);
      var content = olMatch[2];

      if (listStack.length === 0) {
        result.push('<ol>');
        listStack.push({ type: 'ol', indent: indent });
      } else {
        var topIndent = listStack[listStack.length - 1].indent;
        if (indent > topIndent) {
          result.push('<ol>');
          listStack.push({ type: 'ol', indent: indent });
        } else if (indent < topIndent) {
          closeListsToLevel(indent + 1);
          if (listStack.length === 0 || listStack[listStack.length - 1].type !== 'ol') {
            result.push('<ol>');
            listStack.push({ type: 'ol', indent: indent });
          }
        } else {
          if (listStack[listStack.length - 1].type !== 'ol') {
            var old = listStack.pop();
            result.push('</ul>');
            result.push('<ol>');
            listStack.push({ type: 'ol', indent: indent });
          }
        }
      }
      result.push('<li>' + formatInline(content) + '</li>');
      continue;
    }

    // 普通行
    closeAllLists();
    result.push('<p>' + formatInline(trimmed) + '</p>');
  }

  closeAllLists();

  var html = result.join('');

  // 恢复行内代码
  inlineCodes.forEach(function(code, i) {
    html = html.replace(PH + 'IC' + i + '\x00', '<code>' + escapeForHtml(code) + '</code>');
  });

  // 恢复代码块
  codeBlocks.forEach(function(code, i) {
    var lang = code.split('\n')[0];
    var content = lang ? code.slice(lang.length + 1) : code;
    html = html.replace(PH + 'CODE' + i + '\x00', '<pre><code>' + escapeForHtml(content) + '</code></pre>');
  });

  return html;
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

// ESC 关闭弹窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeReleasesModal();
});

async function loadProjects() {
  const grid = document.getElementById('projectsGrid');
  const loading = document.getElementById('projectsLoading');
  const empty = document.getElementById('projectsEmpty');
  
  // 元素不存在则直接返回
  if (!grid || !loading || !empty) return;
  
  const GITHUB_PROJECTS = window.GITHUB_PROJECTS || [];
  const CUSTOM_PROJECTS = window.CUSTOM_PROJECTS || [];
  
  if ((!GITHUB_PROJECTS || GITHUB_PROJECTS.length === 0) && 
      (!CUSTOM_PROJECTS || CUSTOM_PROJECTS.length === 0)) {
    loading.style.display = 'none';
    empty.style.display = 'flex';
    empty.classList.remove('aos-animate');
    void empty.offsetHeight;
    if (typeof AOS !== 'undefined') AOS.refresh();
    return;
  }
  
  const projects = [];
  let totalStars = 0, totalForks = 0, mineCount = 0, starredCount = 0;
  
  for (const item of GITHUB_PROJECTS) {
    const url = typeof item === 'string' ? item : item.url;
    const ownerType = typeof item === 'string' ? 'mine' : (item.ownerType || 'mine');
    const parsed = parseGitHubUrl(url);
    if (!parsed) continue;
    
    const data = await fetchGitHubRepo(parsed.owner, parsed.repo);
    if (data) {
      projects.push({ data, isCustom: false, ownerType });
      totalStars += parseInt(data.stargazers_count) || 0;
      totalForks += parseInt(data.forks_count) || 0;
      if (ownerType === 'mine') mineCount++; else starredCount++;
    }
  }
  
  for (const customProject of CUSTOM_PROJECTS) {
    const ownerType = customProject.ownerType || 'mine';
    projects.push({ data: customProject, isCustom: true, ownerType });
    totalStars += parseInt(customProject.stars) || 0;
    totalForks += parseInt(customProject.forks) || 0;
    if (ownerType === 'mine') mineCount++; else starredCount++;
  }
  
  loading.style.display = 'none';
  
  // 元素不存在则直接返回
  if (!document.getElementById('projectsGrid')) return;
  
  if (projects.length === 0) {
    empty.style.display = 'flex';
    empty.classList.remove('aos-animate');
    void empty.offsetHeight;
    if (typeof AOS !== 'undefined') AOS.refresh();
    return;
  }
  
  const fmt = n => n >= 1000 ? n.toLocaleString('en-US') : n.toString();
  var el;
  if ((el = document.getElementById('totalProjects'))) el.textContent = projects.length;
  if ((el = document.getElementById('mineProjects'))) el.textContent = mineCount;
  if ((el = document.getElementById('starredProjects'))) el.textContent = starredCount;
  if ((el = document.getElementById('totalStars'))) el.textContent = fmt(totalStars);
  if ((el = document.getElementById('totalForks'))) el.textContent = fmt(totalForks);
  
  projects.forEach((p, i) => {
    const card = createProjectCard(p.data, p.isCustom, p.ownerType);
    card.setAttribute('data-aos-delay', (i * 50).toString());
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadProjects);
