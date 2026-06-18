/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-06-18 20:14:25
 * Fingerprint: c08ea6ace3e674d1
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

(function () {
  'use strict';

  var container = document.getElementById('steamProfileCard');
  if (!container) return;

  // 读取主题显示控制设置
  var card = container.closest('.about-card') || container.parentElement;
  var cfg = {
    showBans: card.getAttribute('data-show-bans') !== 'false',
    showStats: card.getAttribute('data-show-stats') !== 'false',
    showAchievements: card.getAttribute('data-show-achievements') !== 'false',
    showGameLibrary: card.getAttribute('data-show-game-library') !== 'false',
    showBadges: card.getAttribute('data-show-badges') !== 'false',
    showFriends: card.getAttribute('data-show-friends') !== 'false'
  };

  var apiUrl = '/apis/api.plugin.halo.run/v1alpha1/steam/profile';

  fetch(apiUrl)
    .then(function (r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
    .then(function (res) {
      if (res.error) {
        container.innerHTML = '<div class="steam-error"><p>' + escHtml(res.error) + '</p></div>';
        return;
      }
      var profileData = res.profile;
      var players = profileData && profileData.response && profileData.response.players;
      if (!players || players.length === 0) {
        container.innerHTML = '<div class="steam-error"><p>未找到该 Steam 用户</p></div>';
        return;
      }
      var achRaw = res.achievements;
      var achData = achRaw && achRaw.playerstats && achRaw.playerstats.success ? achRaw.playerstats : null;
      // 优先使用 GetOwnedGames（完整游戏库，含名称和图标），fallback 到 playtime
      var ownedGames = res.ownedGames && res.ownedGames.response && res.ownedGames.response.games || [];
      var playtimeGames = res.playtime && res.playtime.response && res.playtime.response.games || [];
      var data = {
        player: players[0],
        allGames: ownedGames.length > 0 ? ownedGames : playtimeGames,
        recentGames: res.recent && res.recent.response && res.recent.response.games || [],
        level: res.level && res.level.response && res.level.response.player_level,
        friends: res.friends && res.friends.friendslist && res.friends.friendslist.friends || [],
        groups: res.groups && res.groups.response && res.groups.response.groups || [],
        badges: res.badges && res.badges.response || null,
        bans: res.bans && res.bans.players && res.bans.players[0] || null,
        achievements: achData
      };
      renderProfile(data);
    })
    .catch(function () {
      container.innerHTML = '<div class="steam-error"><p>Steam 数据加载失败，请检查插件配置</p></div>';
    });

  function renderProfile(data) {
    var d = data.player;
    if (d.communityvisibilitystate === 1) {
      container.innerHTML = '<div class="steam-error"><p>该用户的 Steam 资料为私密状态</p></div>';
      return;
    }

    var statusMap = { 0: '离线', 1: '在线', 2: '忙碌', 3: '离开', 4: '打盹', 5: '想交易', 6: '想玩游戏' };
    var statusClass = d.personastate === 1 ? 'steam-status--online' :
                      (d.personastate >= 2 ? 'steam-status--away' : 'steam-status--offline');
    var statusText = statusMap[d.personastate] || '离线';
    var avatar = d.avatarfull || d.avatarmedium || d.avatar || '';
    var name = escHtml(d.personaname || '未知用户');
    var profileLink = d.profileurl || '#';
    var realname = d.realname || '';
    var country = d.loccountrycode || '';
    var createdStr = d.timecreated ? formatTimestamp(d.timecreated) : '';
    var lastOnlineStr = d.lastlogoff ? formatTimestamp(d.lastlogoff) : '';

    var allGames = data.allGames;
    var totalMin = 0, winMin = 0, macMin = 0, linuxMin = 0;
    allGames.forEach(function (g) {
      totalMin += g.playtime_forever || 0;
      winMin += g.playtime_windows_forever || 0;
      macMin += g.playtime_mac_forever || 0;
      linuxMin += g.playtime_linux_forever || 0;
    });

    // === 头部：头像 + 信息 + 统计 ===
    var html = '<div class="steam-card-header">';

    // 头像
    html += '<a href="' + escHtml(profileLink) + '" target="_blank" rel="noopener" class="steam-avatar-link">' +
      '<img class="steam-avatar" src="' + escHtml(avatar) + '" alt="Steam Avatar" /></a>';

    // 用户信息（左侧）
    html += '<div class="steam-user-info">';
    html += '<div class="steam-username">' +
      '<a href="' + escHtml(profileLink) + '" target="_blank" rel="noopener">' + name + '</a>';
    // 状态 + 平台时长在同一行
    html += '<span class="steam-status ' + statusClass + '">' +
      '<span class="steam-status-dot"></span>' + statusText + '</span>';
    // 平台时长标签紧跟状态
    if (winMin > 0) html += '<span class="steam-platform-tag">Windows ' + formatHours(winMin) + '</span>';
    if (macMin > 0) html += '<span class="steam-platform-tag">Mac ' + formatHours(macMin) + '</span>';
    if (linuxMin > 0) html += '<span class="steam-platform-tag">Linux ' + formatHours(linuxMin) + '</span>';
    html += '</div>';

    if (realname) {
      html += '<div class="steam-realname">' + escHtml(realname) + '</div>';
    }
    var metaParts = [];
    if (country) metaParts.push('<span class="steam-meta-item">' + escHtml(country) + '</span>');
    if (createdStr) metaParts.push('<span class="steam-meta-item">注册于 ' + escHtml(createdStr) + '</span>');
    if (lastOnlineStr && d.personastate !== 1) {
      metaParts.push('<span class="steam-meta-item">最后在线 ' + escHtml(lastOnlineStr) + '</span>');
    }
    if (cfg.showBans && data.bans) {
      if (data.bans.VACBanned) metaParts.push('<span class="steam-meta-item steam-ban-tag">VAC 封禁 (' + data.bans.NumberOfVACBans + '次)</span>');
      if (data.bans.NumberOfGameBans > 0) metaParts.push('<span class="steam-meta-item steam-ban-tag">游戏封禁 (' + data.bans.NumberOfGameBans + '次)</span>');
      if (data.bans.CommunityBanned) metaParts.push('<span class="steam-meta-item steam-ban-tag">社区封禁</span>');
      if (data.bans.EconomyBan && data.bans.EconomyBan !== 'none') metaParts.push('<span class="steam-meta-item steam-ban-tag">交易封禁</span>');
    }
    if (metaParts.length > 0) {
      html += '<div class="steam-meta">' + metaParts.join('') + '</div>';
    }
    // XP 等级胶囊放在 meta 下面
    if (data.badges && typeof data.badges.player_xp === 'number' && typeof data.badges.player_xp_needed_to_level_up === 'number') {
      var currentXp = data.badges.player_xp - (data.badges.player_xp_needed_current_level || 0);
      var totalXpForLevel = (data.badges.player_xp_needed_to_level_up || 0) + currentXp;
      var xpPercent = totalXpForLevel > 0 ? Math.round(currentXp / totalXpForLevel * 100) : 0;
      html += '<div class="steam-xp-row">' +
        '<div class="steam-xp-capsule">' +
        '<span class="steam-xp-lv">Lv.' + (data.level || 0) + '</span>' +
        '<div class="steam-xp-track"><div class="steam-xp-fill" style="width:' + xpPercent + '%"></div></div>' +
        '<span class="steam-xp-lv">Lv.' + ((data.level || 0) + 1) + '</span>' +
        '</div>' +
        '<span class="steam-xp-hint">' + data.badges.player_xp_needed_to_level_up + ' XP 升级</span>';
      // 小徽章图标（最近获得，最多显示 8 个）
      if (cfg.showBadges && data.badges.badges && data.badges.badges.length > 0) {
        // 构建 appid → img_icon_url 映射
        var iconMap = {};
        allGames.forEach(function (g) {
          if (g.appid && g.img_icon_url) iconMap[g.appid] = g.img_icon_url;
        });
        var recentBadges = data.badges.badges.slice()
          .filter(function (b) { return b.completion_time > 0; })
          .sort(function (a, b) { return b.completion_time - a.completion_time; })
          .slice(0, 8);
        if (recentBadges.length > 0) {
          html += '<div class="steam-badge-icons">';
          recentBadges.forEach(function (b) {
            if (b.appid && iconMap[b.appid]) {
              // 游戏徽章：用游戏图标
              var iconUrl = 'https://media.steampowered.com/steamcommunity/public/images/apps/' + b.appid + '/' + iconMap[b.appid] + '.jpg';
              var title = (b.appid ? 'AppID ' + b.appid : '') + ' Lv.' + (b.level || 1);
              html += '<img class="steam-badge-icon" src="' + iconUrl + '" alt="' + escHtml(title) + '" title="' + escHtml(title) + '" loading="lazy" />';
            } else {
              // 社区徽章或无图标：用纯 CSS 小标签
              var lvText = 'Lv.' + (b.level || 1);
              html += '<span class="steam-badge-tag" title="Badge #' + (b.badgeid || '?') + '">' + lvText + '</span>';
            }
          });
          html += '</div>';
        }
      }
      html += '</div>';
    }
    html += '</div>'; // end steam-user-info

    // 统计标签区（水平排列，在头像右侧最右边）
    var hasStats = allGames.length > 0 || data.friends.length > 0 || data.badges;
    if (cfg.showStats && hasStats) {
      html += '<div class="steam-header-stats">';
      if (allGames.length > 0) {
        html += '<div class="steam-stat-tag"><span class="steam-stat-num">' + allGames.length + '</span><span class="steam-stat-label">游戏</span></div>';
        html += '<div class="steam-stat-tag"><span class="steam-stat-num">' + formatHours(totalMin) + '</span><span class="steam-stat-label">总时长</span></div>';
      }
      if (cfg.showFriends && data.friends.length > 0) {
        html += '<div class="steam-stat-tag"><span class="steam-stat-num">' + data.friends.length + '</span><span class="steam-stat-label">好友</span></div>';
      }
      if (data.badges && data.badges.badges) {
        html += '<div class="steam-stat-tag"><span class="steam-stat-num">' + data.badges.badges.length + '</span><span class="steam-stat-label">徽章</span></div>';
      }
      if (data.badges && typeof data.badges.player_xp === 'number') {
        html += '<div class="steam-stat-tag"><span class="steam-stat-num">' + data.badges.player_xp + '</span><span class="steam-stat-label">XP</span></div>';
      }
      html += '</div>'; // end steam-header-stats
    }

    html += '</div>'; // end steam-card-header

    // 成就信息
    if (cfg.showAchievements && data.achievements && data.achievements.achievements) {
      var achs = data.achievements.achievements;
      var achieved = achs.filter(function (a) { return a.achieved === 1; });
      var total = achs.length;
      var achPercent = total > 0 ? Math.round(achieved.length / total * 100) : 0;
      var gameName = data.achievements.gameName || '游戏成就';
      html += '<div class="steam-achievement-section">';
      // 头部：游戏名 + 进度统计在同一行
      html += '<div class="steam-ach-header">' +
        '<span class="steam-ach-game">' + escHtml(gameName) + '</span>' +
        '<span class="steam-ach-stats">' + achieved.length + ' / ' + total + '<span class="steam-ach-pct">' + achPercent + '%</span></span>' +
        '</div>';
      // 进度条
      html += '<div class="steam-ach-bar"><div class="steam-ach-bar-fill" style="width:' + achPercent + '%"></div></div>';
      // 最近解锁成就（胶囊标签）
      var unlocked = achieved.filter(function (a) { return a.unlocktime > 0; })
        .sort(function (a, b) { return b.unlocktime - a.unlocktime; }).slice(0, 6);
      if (unlocked.length > 0) {
        html += '<div class="steam-ach-chips">';
        unlocked.forEach(function (a) {
          var achName = a.name || a.apiname || '未知';
          var achTime = formatTimestamp(a.unlocktime);
          html += '<div class="steam-ach-chip">' +
            '<span class="steam-ach-chip-name">' + escHtml(achName) + '</span>' +
            '<span class="steam-ach-chip-time">' + achTime + '</span>' +
            '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    }

    // 收集游戏数据
    var recentGames = data.recentGames;
    // 完整游戏库按游玩时长排序
    var allSortedGames = allGames.slice()
      .filter(function (g) { return g.playtime_forever > 0; })
      .sort(function (a, b) { return (b.playtime_forever || 0) - (a.playtime_forever || 0); });
    // 卡片预览用最近在玩
    var displayGames = recentGames.length > 0 ? recentGames.slice(0, 12) :
      allSortedGames.slice(0, 12);

    // 折叠游戏库（默认收起，点击展开）
    var panelGames = allSortedGames.length > 0 ? allSortedGames : displayGames;
    if (cfg.showGameLibrary && panelGames.length > 0) {
      html += '<button type="button" class="steam-toggle-btn" id="steamToggleBtn">' +
        '<span class="steam-section-title" style="margin-bottom:0">游戏库 (' + panelGames.length + ')</span>' +
        '<svg class="steam-toggle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="6 9 12 15 18 9"/></svg></button>';
      html += '<div class="steam-collapse-panel" id="steamCollapsePanel"><div class="steam-game-grid">';
      panelGames.forEach(function (g) {
        var appid = g.appid;
        var imgUrl = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + appid + '/library_600x900.jpg';
        var headerImg = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + appid + '/header.jpg';
        var gameName = g.name || ('Game ' + appid);
        var hours2w = g.playtime_2weeks ? (g.playtime_2weeks / 60).toFixed(1) : '';
        var hoursTotal = g.playtime_forever ? (g.playtime_forever / 60).toFixed(1) : '0';
        var timeText = hours2w ? '两周 ' + hours2w + 'h / 总计 ' + hoursTotal + 'h' : '总计 ' + hoursTotal + 'h';
        html += '<div class="steam-game-card">' +
          '<img class="steam-game-card-img" src="' + imgUrl + '" alt="' + escHtml(gameName) + '" loading="lazy" ' +
          'onerror="this.src=\'' + headerImg + '\'" />' +
          '<div class="steam-game-card-overlay">' +
          '<div class="steam-game-card-name">' + escHtml(gameName) + '</div>' +
          '<div class="steam-game-card-time">' + timeText + '</div>' +
          '</div></div>';
      });
      html += '</div></div>';
    } else if (cfg.showGameLibrary && profileLink && profileLink !== '#') {
      html += '<a href="' + escHtml(profileLink) + '" target="_blank" rel="noopener" class="steam-more-btn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="steam-btn-icon">' +
        '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '查看更多</a>';
    }

    container.innerHTML = html;

    // 绑定折叠切换事件
    var toggleBtn = document.getElementById('steamToggleBtn');
    var panel = document.getElementById('steamCollapsePanel');
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', function () {
        var expanded = toggleBtn.classList.toggle('steam-toggle-btn--open');
        if (expanded) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          panel.style.maxHeight = '0';
        }
      });
    }
  }

  function formatHours(minutes) {
    var h = Math.round(minutes / 60);
    return h >= 1000 ? (h / 1000).toFixed(1) + 'k h' : h + 'h';
  }

  function formatTimestamp(ts) {
    var d = new Date(ts * 1000);
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    var h = ('0' + d.getHours()).slice(-2);
    var min = ('0' + d.getMinutes()).slice(-2);
    return y + '-' + m + '-' + day + ' ' + h + ':' + min;
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
})();
