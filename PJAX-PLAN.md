# Serenity-Hue 主题 PJAX 改造方案

> 目标：在不破坏 SEO / URL / 现有交互的前提下，让站内页面切换走「局部刷新」（只替换 `<main>` 内容），使音乐胶囊（`#nav-music` + APlayer/Meting）所在的 `<audio>` DOM 不被销毁，从而实现**音乐跨页面连续播放、播放状态/进度/面板完全保留**，并顺带消除胶囊「闪烁、重新出现」的问题。

---

## 0. 背景与结论

- 当前主题是标准 MPA（多页应用），无任何 PJAX/Turbo/Swup。每次点击导航 = 整页跳转 → 旧 DOM（含 `<audio>`）被销毁 → 音乐中断。
- `music-panel.js` 无任何状态持久化，且每次切页都要等 Meting 重新拉歌单、`setInterval` 轮询 APlayer 就绪 → 胶囊闪烁、状态归零。
- 物理事实：只要发生整页导航，`<audio>` 必然销毁。要音乐不断，**唯一**可行方向是让承载 audio 的 DOM 不被销毁 → 即局部刷新（PJAX）。iframe/popup/View Transition/Media Session 均不满足「URL 正常 + UI 形态 + 真正不断」的组合。

**核心策略**：把页面分成「持久层」（PJAX 永不替换，含音乐胶囊）和「替换层」（`<main>` 内，每次切页只换它）。

---

## 1. 架构边界（已逐文件确认）

### 持久层（PJAX 永不替换，DOM 与实例保留）
- `.page-gradient`
- `welcome-overlay`（开屏遮罩）
- `page-transition`（加载遮罩）
- `<header class="header">`：含 `#theme-toggle` / `.nav-left` / `.nav-right` / `.menu-toggle` / `#search-box`
- `search-modal`
- **`#nav-music` + `#music-panel` + APlayer/Meting**（音乐胶囊，本方案核心保护对象）
- `#back-to-top`
- `<footer>`（含 runtime / 看板娘轮询 / legal-modal）
- 全部 `<script>`（位于 `</body>` 前，layout 统一加载）

### 替换层（唯一 PJAX 目标）
- `<main class="main">` 内的 content fragment
- 替换目标：在 `<main>` 内层新增固定 id 容器 `#pjax-main`

---

## 2. 技术选型

**自研轻量 PJAX**（`fetch` + `DOMParser` + History API），不引入 Swup/Barba。理由：
- 本主题脚本副作用重（AOS / Lenis / Swiper / 各页 JS / welcome / loading mask），无论哪个框架都得手写重跑/清理逻辑。
- 各页 CSS/JS 动态注入 `<head>`，需精确控制注入与去重，自研更可控。
- 已有 `addPageScrollListener` / `clearPageScrollListeners` / `bindPageEvent` 基础设施，自研契合度高。
- 体积小、无新依赖、可由配置开关，失败自动回退整页跳转。

---

## 3. 改造总清单（基于子代理全量分析）

### 3.1 新增文件
- `templates/assets/js/pjax.js`：PJAX 引擎（持久层全局加载）。

### 3.2 模板层（modules/layout.html + 17 个标准页）
1. `layout.html`：`<main class="main">` 内包 `<div id="pjax-main">` 作为替换目标。音乐胶囊已在 `<main>` 之外，**无需移动**。
2. 各页 head fragment 里的**专属 CSS/JS 迁入 content fragment 顶部**（进入 `#pjax-main`），否则 PJAX 不会带入。
3. 服务端注入的 `window.*` 变量必须随 content 进入替换层并重新执行（见 3.5）。
4. content 内联 `<script>` 需被引擎 clone 重建后执行。
5. `<halo:comment>` / `<halo:footer>` 组件需确认局部刷新可重新挂载。

#### 专属 CSS（去重）
`index.css / about.css / steam.css / archives.css(archives,category,tag) / tags.css(tags,categories) / equipments.css / friends-circle.css / guestbook.css / links.css / moments.css / post-page.css(post,page) / photos.css / projects.css / wishes.css`

#### 专属 JS（去重，切页需重载/重执行）
`lightbox.js / weather-clock.js / about.js / steam.js / about-afdian.js / archives.js / tag-sphere.js(archives,post) / friends-circle.js / guestbook.js / links.js / photos.js / post.js / projects.js / tags.js / wishes.js`

### 3.3 main.js（核心）
**前置基础设施**：实现 `window.__bindPageEvent` 注册表 + `clearPageEvents()`（当前 `bindPageEvent` 的 dispose 全被丢弃，无清理能力）。

**initOnce 组（只绑一次）**：`initThemeToggle` / `initHeaderScroll` / `initMenuClose` / `initMobileDropdowns`（已有 `_bound` 守卫）/ `initPageTransition` / `initBackToTop` / `initLenis` 核心。

**initPage 组（每页重跑）**：
- `initHeroBackground` ✅ 已走 `addPageScrollListener`
- `initMemoSlider` / `initDragScroll` ⚠️ Swiper 必须先 `destroy()`
- `initTypewriter` ⚠️ 递归 setTimeout 需保存句柄并 clear
- `initSmoothScroll` ⚠️ 依赖 `__bindPageEvent` 注册表
- `cleanLifeDescriptions` / `sortStreamFeed` / `initListScrollPassthrough` ✅ 安全
- `AOS` ⚠️ 用 `AOS.refreshHard()`，不要重复 `AOS.init()`

**必修泄漏点**：
1. `initLenis` 重调 raf 循环退不出（lenis 被赋新值）→ 切页只 `resize`+`scrollTo(0)`，不整体重建。
2. `initHeaderScroll` 直接 `window scroll` 未走 `addPageScrollListener` → clear 盲区（头号）。
3. Swiper（memo/drag）无 destroy。
4. `initTypewriter` 定时器未保存。
5. 所有 `bindPageEvent` click dispose 全丢弃。

### 3.4 各页脚本（按风险）
**高危 — 定时器/rAF 泄漏（必改）**
- `about.js`：`setInterval(updateCountdown,1000)` 无 clear + DOMContentLoaded 入口
- `guestbook.js`：弹幕 `setInterval` 无 clear + `COMMENT_DATA` 重复 push 翻倍
- `weather-clock.js`：`setInterval(updateTime,60000)` 无 clear
- `tag-sphere.js`：rAF 循环 + 闭包持有旧 DOM + window resize 叠加（有 destroyAll 但 PJAX 无人调）
- `projects.js`：**顶层** `document keydown` 叠加 + 弹窗 `body.overflow` 残留
- `links.js`：`document keydown`（中危）

**入口失效（IIFE 内套 DOMContentLoaded）**：`wishes.js` / `tag-sphere.js` → 初始化抽成可被钩子调用的函数。

**需改可重入**：`friends-circle.js`（重置分页）/ `tags.js`（残留 IntersectionObserver disconnect）。

**已是范例，几乎不动**：`photos.js`（幂等 cleanup）/ `steam.js`（IIFE+立即执行）/ `archives.js`（readyState 兼容）/ `about-afdian.js`（var+内联 onclick）。

**post.js（文章页，最复杂）**
- 主体 DOMContentLoaded → 抽成 `initPost()` 切页重调
- **核心泄漏**：`onScroll`（TOC/进度）、`onCommentsScroll` 两个 window scroll 监听无 remove → 保存引用，`teardownPost()` 移除
- TOC 生成前 `tocNav.innerHTML=''`；标题图标 toggle 插入加幂等
- 分享 IIFE → 具名 `initPostShare()` 切页重调
- 移除 post.js 里 500ms 的 `__postLightbox` 创建，避免与 lightbox.js 双重创建

**lightbox.js**：基本 ready，已有 `__serenityInitLightboxes` + destroy + 幂等。切页调用它，`clearTimeout` 消除 100ms 竞态。

**全局脚本（不动 / initOnce）**：`search.js`（持久层+dataLoaded 守卫）/ `welcome.js`（sessionStorage 防重）/ `cursor-init.js`（注入全局 CSS，加幂等守卫）/ `theme-color-init.js`（写 html 变量）/ `gateway-toast.js`（仅工具函数）。

### 3.5 服务端注入变量（随 content 重执行）
- `post → window.__showHeadingIcons`
- `wishes → window.__WISH_CONFIG__`
- `guestbook → window.__GUESTBOOK_PAGE_NAME__`
- `index → window.WEATHER_CONFIG`
- `projects → window.GITHUB_PROJECTS / CUSTOM_PROJECTS / GITHUB_TOKEN`
- `categories/category → th:inline 局部数据`

---

## 4. PJAX 引擎设计（pjax.js）

### 4.1 拦截规则（命中才走 PJAX）
- 仅左键、无修饰键、`<a>` 同源、非 `target=_blank`、非 `download`。
- 排除：`/console`、`/login`、`/logout`、`signup`、纯 hash 锚点（`#...`）、`mailto:`/`tel:`、跨域、带 `data-no-pjax` 属性的链接。
- 排除独立 layout 页：login/logout/signup、error 目录（这些走整页跳转）。

### 4.2 导航流程
1. 拦截点击 → 复用 `page-transition` 过渡动画（已存在）。
2. `fetch(href)` → `DOMParser` 解析新文档。
3. 取新文档 `#pjax-main` innerHTML 替换当前。
4. 更新 `<title>` + `<meta description/og/twitter>`。
5. 注入新页专属 CSS（按 href 去重，移除上一页不再需要的页面级 CSS）。
6. 重建并执行 `#pjax-main` 内的 `<script>`（clone 节点）。
7. `history.pushState`；监听 `popstate` 支持前进/后退。
8. 调度生命周期钩子（见 4.3）。
9. 滚动复位到顶部（或按需保存/恢复）。

### 4.3 生命周期钩子顺序
```
beforeLeave:
  clearPageScrollListeners()
  clearPageEvents()           // __bindPageEvent 注册表
  destroy 旧实例(Swiper/Lenis observer/Typewriter timer)
  各页 teardown(teardownPost / tag-sphere destroyAll / 清各 interval)
replace:
  替换 #pjax-main + 更新 head + 注入css + 执行 script
afterEnter:
  initPage 组
  各页 init(initPost / initPostShare / __serenityInitLightboxes / ...)
  AOS.refreshHard()
  lenis.resize()
  scrollTo(0)
```

### 4.4 失败回退
- fetch 失败 / 非 200 / 解析无 `#pjax-main` → `window.location.href = href`（整页跳转兜底）。
- 配置开关 `enablePjax`（theme.yaml，默认开），关闭则完全走原生跳转。

### 4.5 边界
- welcome/loading mask 在 `#pjax-main` 外，PJAX 不触发，不重复。
- `data-theme` 在 `<html>`，持久层不变。
- 防快速连点：导航期间忽略新点击或取消上一个 fetch（AbortController）。

---

## 5. 实施阶段（每步可独立验证）

- **阶段 1（基础设施，不破坏现有功能）**
  - 建 `__bindPageEvent` 注册表 + `clearPageEvents`
  - 写 `pjax.js` 骨架（带开关，默认可先关闭或仅 console 日志）
  - `layout.html` 包 `#pjax-main`
  - theme.yaml 增加 `enablePjax` 开关
- **阶段 2（main.js 拆分）**：initOnce/initPage 拆分 + 修 5 个泄漏点
- **阶段 3（三页联调）**：首页 / 标签 / 归档 接入，验证音乐连续 + 无泄漏
- **阶段 4（全量接入）**：剩余页面模板迁移 head 资源 + 各页脚本可重入改造
- **阶段 5（构建同步）**：只改 `theme-Serenity-Hue`，走 `build_theme.py` 同步到 dist，不手改副本

---

## 6. 排除 PJAX 清单
`login.html / logout.html / signup.html`（gateway_fragments/layout）、`templates/error/`、`/console`、`/login`、`target=_blank`、跨域、下载链接、`data-no-pjax`。

---

## 7. 风险与缓解
| 风险 | 缓解 |
|---|---|
| 各页脚本二次执行命名冲突 | 全 13 个脚本无顶层 const/let（仅 var/function/IIFE），**不会** already-declared；friends-circle/projects 全局 `sanitizeUrl` 重名 → IIFE 化 |
| 定时器/监听泄漏 | 钩子按序清理 + 各页提供 teardown |
| 初始化不再触发 | DOMContentLoaded 入口改可重入函数，由 afterEnter 调用 |
| Halo 自定义组件（评论） | 局部刷新后确认重新挂载，必要时该页 `data-no-pjax` 整页跳转 |
| 构建副本不一致 | 统一走 build_theme.py |

---

## 8. 验收标准
1. 首页↔标签↔归档↔文章 切换时音乐不中断，进度/曲目/面板状态保留。
2. 切页后各页交互（AOS 动画、目录、灯箱、轮播、倒计时、弹幕、时钟）正常。
3. 连续切 10+ 页，无重复监听叠加、无 interval/rAF 泄漏（DevTools 验证）。
4. 浏览器前进/后退、刷新、深链直达正常；URL 正确；SEO meta 更新正确。
5. login/console 等仍整页跳转。
6. PJAX 失败时自动回退整页跳转，不白屏。


---

## 实施进度记录

### 阶段 1 ✅ 完成（基础设施）
- 新增 `PJAX-PLAN.md`、`templates/assets/js/pjax.js`（引擎骨架）
- `settings.yaml`：loadingConfig 加 `enablePjax` 开关（默认 false）
- `modules/layout.html`：`<main>` 内包 `#pjax-main`；条件引入 pjax.js + 注入 `window.__PJAX_ENABLED`
- `main.js`：实现 `window.__bindPageEvent` 注册表 + `__clearPageEvents` / `clearPageEvents`

### 阶段 2 ✅ 完成（main.js 拆分 + 泄漏修复）
- 拆分 `initOnce`（initLenis/initThemeToggle/initHeaderScroll/initMenuClose/initBackToTop/initPageTransition）与 `initPage`（initSmoothScroll/initMobileDropdowns/initMemoSlider/initHeroBackground/initTypewriter/initDragScroll/cleanLifeDescriptions/sortStreamFeed/AOS）
- 修复泄漏点：
  1. `initLenis`：已存在实例则只 `resize()` 不重建（消除 raf 循环叠加）
  2. `initHeaderScroll`：加 `_bound` 幂等守卫（持久层只绑一次，消除 scroll 盲区叠加）
  3. `initMemoSlider` / `initDragScroll`：登记 `window.__memoSwiper` / `__lifeSwiper`，重 init 前 `destroy(true,true)`
  4. `initTypewriter`：保存 `window.__typewriterTimer`，重 init 前 clearTimeout
  5. AOS：首次 `init`，之后 `refreshHard`（`window.__aosInited` 守卫）
- PJAX 钩子改为全局队列 `window.__pjaxPageInit` / `__pjaxPageTeardown`（与脚本加载顺序解耦）；main.js push initPage + lenis.resize
- pjax.js 的 runBeforeLeave/runAfterEnter 统一消费全局队列 + 保留 `__pjaxHooks` 兼容 API

### 阶段 3 ✅ 完成（三页接入：首页 / 标签 / 归档）
- pjax.js 新增一次性页面清理 API `window.__pjaxOnLeave(fn)`（离场执行一次后清空，防膨胀）
- 统一策略：**CSS 留 head**（防 FOUC，pjax `syncPageStyles` 切页注入新页 CSS），**页面 JS + 服务端 window.* 变量迁入 content**（随 `executeScripts` 重执行）
- 模板迁移：
  - `index.html`：iconify/lightbox/hero 内联/`WEATHER_CONFIG`/weather-clock 移入 content
  - `archives.html`：archives.js / tag-sphere.js 移入 content
  - `tags.html`：tags.js 移入 content
- 脚本可重入改造：
  - `tags.js`：入口改 `__initTagsPage`（readyState 兼容），IntersectionObserver 登记 `window.__tagsBarObserver` 并在重入前 disconnect
  - `tag-sphere.js`：改全局单例（`__tagSphereLoaded` 守卫），暴露 `__tagSphereInit`，resize 仅绑一次，每次进入注册 `__pjaxOnLeave`→destroyAll（停 rAF/解绑/清 timer）
  - `weather-clock.js`：改全局单例（`__weatherClockLoaded` 守卫），暴露 `__weatherClockInit`，时钟 setInterval 登记 `__weatherClockTimer`，每次进入注册 `__pjaxOnLeave`→clearInterval
  - `archives.js`：已用 readyState 兼容 + innerHTML 幂等，无需改
- 待真机验证：开启 `enablePjax`，测首页↔标签↔归档切换：音乐连续、各页交互正常、无 interval/rAF 泄漏。

### 阶段 4 ✅ 完成（全量页面接入）
**模板迁移（head JS + 服务端 window.* → content 顶部，CSS 留 head）**：
- wishes（+`__WISH_CONFIG__`）、projects、photos、moments、links、guestbook（+`__GUESTBOOK_PAGE_NAME__`）、friends-circle、about（iconify/about/steam/about-afdian）、post（lightbox/post/tag-sphere + `__showHeadingIcons`）
- 修复 archives.html 之前误加的重复 `<div class="container">`
- category/tag/categories/equipments/page：无专属 JS，纯内容 + 全局 AOS，由 initPage 处理，无需迁移

**脚本可重入改造**：
- post.js：DOMContentLoaded→initPost()（readyState 入口）；分享 IIFE→initPostShare()；两处 scroll 监听经 `__pjaxOnLeave` removeEventListener；TOC 生成前 `innerHTML=''`；标题图标 toggle 幂等守卫；移除 500ms 双重创建 __postLightbox
- lightbox.js：setTimeout 句柄存 `__lightboxInitTimer` 并 clear 消竞态；销毁逻辑抽 `__serenityDestroyLightboxes`；`__pjaxOnLeave` 注册销毁+清 timer+恢复 overflow
- guestbook.js：`COMMENT_DATA=[]` 重置幂等；DanmakuSystem 存 `__danmakuSystem`，重入前 clearInterval `_autoPlayTimer`，`__pjaxOnLeave` 注册清理
- about.js：readyState 入口；倒计时 interval 存 `__aboutCountdownTimer` + 离场清理
- links.js：readyState 入口；keydown 经 `__pjaxOnLeave` removeEventListener
- friends-circle.js：readyState 入口；init 开头重置分页状态
- projects.js：readyState 入口；顶层 keydown 单例守卫 `__projectsKeydownBound`；`__pjaxOnLeave` 恢复 body.overflow
- wishes.js：IIFE 内 readyState 入口
- photos.js：补 `__pjaxOnLeave`→`__photosCleanup`
- steam.js / about-afdian.js：已可重入，无需改

**待验证风险**：`<halo:comment>`（post/guestbook/moments）局部刷新后能否重新挂载，需真机确认；不行则该页加 `data-no-pjax` 兜底。

### 阶段 5 ✅ 完成（核验 + 构建说明）
**Hue 层完整性核验通过**：
- layout.html：`#pjax-main` 容器（339行）+ 条件引入 pjax.js/`__PJAX_ENABLED`（489行）就位
- 全部 18 个标准页面 head fragment 现仅含 CSS+meta，页面级 JS 与服务端 `window.*` 已全部迁入 content
- 20 个 JS 文件诊断全部通过

**构建同步说明（需你本人执行）**：
- `build_theme.py` 是**交互式**脚本（`input()` 选版本 1=Hue / 2=Ordinary），会加版权水印+指纹+打 zip+解压到 `theme-Serenity-dist`。属发布动作，建议真机验证通过后由你手动运行：`python build_theme.py` → 选 1（色相版）。
- `theme-Serenity-dist` 是构建产物，不要手改。

**⚠️ 重要发现 - Ordinary 版本分叉**：
- `theme-Serenity-Ordinary` 已存在一套**独立的 441 行 pjax.js**（与本次为 Hue 写的 245 行版本不同），其 layout.html 也已引用 pjax.js。
- 说明 Ordinary 此前已被单独做过 PJAX 改造，与 Hue 现在两套实现并存、不同步。
- 本次改造**只动了 Hue**，未触碰 Ordinary，避免覆盖你已有的工作。
- 决策点：若发布版是 Ordinary，需你确认是用 Ordinary 现有实现，还是把 Hue 这套移植过去统一。这一步需你拍板，我不擅自合并。

---

### 阶段 6 ✅ 完成（多代理排查后的残留修复）

**main.js**：
- `initBackToTop` / `initMenuClose` / `initPageTransition` 从 `initOnce` 移到 `initPage`（它们用了 PJAX 会清理的 `addPageScrollListener`/`bindPageEvent`，放 initOnce 会导致首次切页后失效）。

**pjax.js**：
- `updateHead` 补充 `og:url` / `twitter:card` / `canonical` 同步。
- `syncPageStyles` 加 `data-pjax-style` 标记 + 移除旧页专属 CSS（解决 CSS 累积污染），初始化按 `GLOBAL_CSS` 白名单给首屏非全局 CSS 打标记。
- 滚动复位改用 `window.__lenis.scrollTo(0,{immediate:true})`。
- `executeScripts` 重写：外链脚本**串行 await 加载**保证顺序；按 `GLOBAL_JS` 白名单跳过 layout 已全局加载的库（iconify/aplayer/lenis/swiper/aos/main 等），避免重复执行。navigate 等脚本加载完再 `runAfterEnter`。

**index.html**：
- 末尾 `DOMContentLoaded`（灯箱+天气栏渐变）改立即执行 IIFE。
- hero 背景滚动 `<style>` 用固定 id `hero-bg-init-style` 去重（存在则复用、scrollY=0 时移除），避免反复切回首页累积 style。
- 移除 content 内重复的 iconify 引用（layout 已全局加载）。

**post.html**：
- `show-scrollbar`（html class）从 head fragment 迁入 content，注册 `__pjaxOnLeave` 离场移除。
- `has-bg-wallpaper`（body class）注册 `__pjaxOnLeave` 离场移除。

**about.html**：移除 content 内重复 iconify 引用。

**仍待真机验证**：`<halo:comment>`（post/guestbook/moments）PJAX 进入后能否重新挂载，不行则该页 `data-no-pjax` 兜底。
