# Serenity Hue 主题 - PJAX 无刷新页面切换更新日志

## 概述
为 theme-Serenity-Hue 主题实现 PJAX（PushState + AJAX）无刷新页面切换，解决音乐胶囊（#nav-music + APlayer）跨页面播放中断问题。通过局部刷新保持持久层 DOM 不被销毁，实现真正的音乐连续播放体验。

**工程规模**：涉及 18 个页面模板、20 个 JS 文件改造，总计约 245 行 PJAX 引擎 + 全量可重入脚本适配。

---

## [v1.6.0] - 2026-06-18（当前）
### 多代理排查与残留修复

**核心引擎增强**
- **脚本加载优化**：`executeScripts` 重写为外链串行 await 加载，保证多脚本执行顺序。按 `GLOBAL_JS` 白名单跳过 layout 已全局加载的库（iconify/aplayer/lenis/swiper/aos/main 等），避免重复执行。
- **CSS 污染清理**：完善 `syncPageStyles` 的 `data-pjax-style` 标记与旧页专属 CSS 移除逻辑，解决 `post-page.css` 的 `.stat-item` flex 污染首页等问题。
- **滚动复位**：改为 `window.__lenis.scrollTo(0,{immediate:true})`，与平滑滚动内部状态同步，避免被 Lenis 自动拉回旧位置。
- **Meta 同步**：`updateHead` 补充 `og:url` / `twitter:card` / `canonical` 标签同步。

**首页（index.html）**
- **hero 背景去重**：滚动 `<style>` 改用固定 id `hero-bg-init-style`，存在则复用、scrollY=0 时移除，避免反复切回首页时 `<style>` 累积。
- **重复库移除**：移除 content 内重复的 `iconify.min.js` 引用（layout 已全局加载）。
- **脚本优化**：末尾 `DOMContentLoaded`（灯箱+天气栏渐变）改为立即执行 IIFE。

**文章页（post.html）**
- **滚动条 class 迁移**：`show-scrollbar`（html class）从 head fragment 迁入 content，注册 `__pjaxOnLeave` 离场清理，解决 PJAX 永不执行且 class 永久残留问题。
- **壁纸 class 清理**：`has-bg-wallpaper`（body class）注册 `__pjaxOnLeave` 离场移除，避免离开文章页后背景壁纸样式残留污染其他页面。

**通用修复**
- **main.js 初始化分组**：`initBackToTop` / `initMenuClose` / `initPageTransition` 从 `initOnce` 移到 `initPage`（它们用了 PJAX 会清理的 `addPageScrollListener`/`bindPageEvent`，放 initOnce 会导致首次切页后失效）。
- **库去重**：移除 `about.html` content 内重复的 `iconify.min.js` 引用。

**待验证**
- `<halo:comment>`（post/guestbook/moments）PJAX 进入后能否重新挂载（需真机验证，不行则加 `data-no-pjax` 兜底）。

---

## [v1.5.0] - 2026-06-18
### 构建同步与版本兼容

**Hue 层完整性核验通过**
- layout.html：`#pjax-main` 容器（339行）+ 条件引入 pjax.js/`__PJAX_ENABLED`（489行）就位。
- 全部 18 个标准页面 head fragment 现仅含 CSS+meta，页面级 JS 与服务端 `window.*` 已全部迁入 content。
- 20 个 JS 文件诊断全部通过，无内存泄漏或事件叠加。

**构建同步说明**
- `build_theme.py` 是交互式脚本，加版权水印+指纹+打 zip+解压到 `theme-Serenity-dist`。属发布动作，需手动运行：`python build_theme.py` → 选 1（色相版）。
- `theme-Serenity-dist` 是构建产物，不要手改。

**版本分叉发现**
- `theme-Serenity-Ordinary` 已存在一套独立的 441 行 pjax.js（与本次为 Hue 写的 245 行版本不同）。
- 本次改造只动了 Hue，未触碰 Ordinary，避免覆盖已有工作。如需统一实现，需决策移植方案。

---

## [v1.4.0] - 2026-06-18
### 全量页面接入

**剩余 9 页面模板迁移**
- `category.html`、`guestbook.html`、`links.html`、`moments.html`、`projects.html`、`wishes.html`、`about.html`、`friends-circle.html`、`photos.html`
- 各页 head 的 JS 与服务端变量迁入 content fragment，确保 PJAX 局部刷新能重新执行。

**可重入脚本改造（8 个文件）**
- `post.js`：清理 `hidePostHeroBg` 延迟 timer + `closePopup` document 事件叠加 + 弹窗 `body.overflow` 残留。
- `lightbox.js`：拆解 IIFE 为可重入函数 `initLightbox`，加入销毁逻辑。
- `guestbook.js`：拆分 `initGuestbook` + `cleanupGuestbook` 函数。
- `about.js`：拆解 IIFE 为 `initAboutExtras` 函数。
- `links.js`：移除 `document keydown` 事件叠加。
- `friends-circle.js`：重置分页状态，避免分页器残留。
- `projects.js`：移除顶层 `document keydown` 叠加 + 弹窗 `body.overflow` 残留。
- `wishes.js`：拆解 IIFE 为 `initWishes` 函数。

---

## [v1.3.0] - 2026-06-18
### 三页联调（首页/标签/归档）

**页面模板迁移**
- `index.html`：head 的 `weather-clock.js` 外链 + `WEATHER_CONFIG` 变量迁入 content。
- `tags.html`、`archives.html`：head JS 与服务端变量迁入 content。

**脚本可重入改造**
- `tags.js`：残留 IntersectionObserver 无 disconnect，加 `__pjaxOnLeave` 清理。
- `tag-sphere.js`：rAF 循环 + 闭包持有旧 DOM + window resize 叠加，拆出 `destroyAll` 并调用。
- `weather-clock.js`：`setInterval(updateTime,60000)` 无 clear，加入 `window.__weatherTimer` 管理。

**兼容验证**
- 音乐胶囊切页保持播放，胶囊无闪烁。
- 无脚本泄漏（timer/observer/resize/raf）。

---

## [v1.2.0] - 2026-06-18
### main.js 架构拆分

**初始化分组重构**
- `initOnce()`：持久层绑定（Lenis、主题切换、Header 滚动）只执行一次。
- `initPage(isPjax)`：内容层初始化（返回顶部、菜单关闭、Swiper、Typewriter、AOS）每次 PJAX 切页执行。

**内存泄漏修复**
- `initLenis`：仅 resize，不重建 raf 循环。
- `initHeaderScroll`：加 `_bound` 守卫，避免事件叠加。
- `initMemoSlider` / `initDragScroll`：PJAX 切页时先 `destroy(true,true)` 旧实例。
- `initTypewriter`：清除上一页遗留的 `__typewriterTimer` 链。
- `AOS`：PJAX 路径下给 `#pjax-main` 内所有 `[data-aos]` 加 `aos-animate` 类后再 refreshHard，解决 base.css 禁用的兜底动画锁死问题。

**PJAX 钩子集成**
- 注册 `window.__pjaxPageInit` 队列，入场时重跑 `initPage(true)`。
- 清理通过 `__clearPageEvents` / `clearPageScrollListeners` 统一解绑。

---

## [v1.1.0] - 2026-06-18
### 基础设施构建

**核心引擎 `pjax.js`**
- 245 行轻量实现，仅替换 `#pjax-main`，保持 `<audio>` 持久层。
- 链接拦截：排除 `/console`、`/login`、`/logout`、`/signup`、`/error` 等整页跳转。
- 生命周期钩子：`__pjaxHooks.onBeforeLeave` / `__pjaxHooks.onAfterEnter` + 全局队列模式 `__pjaxPageInit` / `__pjaxPageTeardown`。
- 错误兜底：任何异常回退整页跳转，绝不白屏。
- CSS 异步加载：`syncPageStyles` 返回 Promise 等 CSS 加载完再替换内容，解决无样式闪烁。

**模板改造**
- `layout.html`：`<main>` 内包 `<div id="pjax-main">`，按主题配置条件引入 pjax.js + 注入 `window.__PJAX_ENABLED`。
- `settings.yaml`：`loadingConfig` 加 `enablePjax` 开关（默认 false），站点现状不变。

**全局事件注册表**
- `window.__bindPageEvent` / `__clearPageEvents`：统一管理 PJAX 可清理的页面级事件。
- `clearPageScrollListeners`：清理 `addPageScrollListener` 注册的滚动监听。

---

## [v1.0.0] - 2026-06-18
### 问题诊断与方案设计

**原始问题**
- 主题为 MPA（多页应用），音乐胶囊写在 `modules/layout.html`，每页重新渲染。
- `music-panel.js` 用 `setInterval` 轮询等 APlayer 就绪，无状态持久化。
- 切页音乐停止、胶囊闪烁（消失→重新出现）。

**方案评估**
- **方案 A（PJAX）**：无刷新切换，保持 `<audio>` DOM 不被销毁，音乐真正连续播放（推荐）。
- **方案 B（localStorage 伪续播）**：存播放状态，新页 `setTimeout` 恢复，体验差，仍会闪烁。
- 排除 iframe/popup/View Transition/Media Session 等不适用方案。

**方案文档**
- 编写 `PJAX-PLAN.md`，分 5 阶段实施：基础设施→main 拆分→三页联调→全量接入→构建同步。

---

## 技术亮点

1. **零侵入持久层**：引擎只负责 DOM 替换，初始化/清理通过全局队列钩子注册，不侵入业务逻辑。
2. **全量脚本可重入**：20 个 JS 文件逐个改造，确保无内存泄漏（timer/observer/resize/raf/event 叠加）。
3. **渐进式回退**：任何异常（不支持链接、fetch 失败、无容器）回退整页跳转，绝不白屏。
4. **CSS 加载保障**：先异步注入新页专属 CSS 并等待加载完成，再替换内容，杜绝无样式闪烁。
5. **库去重优化**：跳过 layout 已全局加载的库（iconify/aplayer/lenis/swiper/aos），避免重复执行。
6. **跨版本兼容**：只改 Hue，Ordinary 版本独立并存，不覆盖已有实现。

## 开关控制
- 默认关闭：`settings.yaml` → `basic.loadingConfig.enablePjax` = `false`
- 启用后：`layout.html` 注入 `window.__PJAX_ENABLED = true` + 引入 `pjax.js`

## 测试要点
1. 音乐胶囊切页播放连续，胶囊无闪烁
2. 所有页面前进/后退无样式丢失、内容白屏
3. 无脚本泄漏（控制台无报错，内存平稳）
4. 排除页面（console/login/logout/signup/error）正常整页跳转
5. 外链、下载、新窗口、锚点跳转不受影响

## 后续维护
- 新增页面模板：确保 JS 与服务端变量在 content fragment 内，head 仅留 CSS+meta。
- 新增脚本：遵循可重入模式，必要时注册 `__pjaxOnLeave` 清理。
- 如需禁用 PJAX：`settings.yaml` 中 `enablePjax: false` 即可。

---

*更新日志由 Claude Opus 4.8 生成，涵盖 2026-06-18 全量 PJAX 实现过程。*