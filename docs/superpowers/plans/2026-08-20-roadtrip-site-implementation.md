# 2026 国庆自驾行程网页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并通过 GitHub Pages 公开发布一份移动端优先、可打印的 2026 国庆鄂西—湘西自驾行程网页。

**Architecture:** 使用单文件 `index.html` 承载语义化 HTML、CSS 与原生 JavaScript，避免外部依赖。使用独立 Node 校验脚本检查核心路线、日期、里程、无障碍与发布文件，最后创建公开 GitHub 仓库并从 `main` 根目录启用 Pages。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js 内置模块、Git、GitHub Pages

---

## File Structure

- `index.html`: 完整网页、样式、交互和打印布局。
- `scripts/validate.mjs`: 使用 Node 内置模块执行静态内容与结构校验。
- `README.md`: 项目说明、行程摘要、本地预览和发布说明。
- `.nojekyll`: 禁止 GitHub Pages 的 Jekyll 处理。
- `docs/superpowers/specs/2026-08-20-roadtrip-site-design.md`: 已批准设计规格。
- `docs/superpowers/plans/2026-08-20-roadtrip-site-implementation.md`: 本实施计划。

### Task 1: Add Failing Content Validator

**Files:**
- Create: `scripts/validate.mjs`

- [ ] **Step 1: Write the validation script**

脚本读取 `index.html`，检查 `14:00` 出发、8 天日期、每日公里数、八面山住宿、无芙蓉镇、语义化标签、打印按钮和视口声明；缺失时退出码为 1。

- [ ] **Step 2: Run validator before page exists**

Run: `node scripts/validate.mjs`

Expected: FAIL，提示无法读取 `index.html`。

- [ ] **Step 3: Commit validator**

```bash
git add scripts/validate.mjs
git commit -m "test: add itinerary page validator"
```

### Task 2: Build Responsive Itinerary Page

**Files:**
- Create: `index.html`

- [ ] **Step 1: Add semantic page structure**

创建 `header`、`nav`、`main`、每日 `article`、天气方案、预订清单、装备清单和 `footer`，写入完整 8 天路线与约 2330 公里总里程。

- [ ] **Step 2: Add visual system**

在内联 CSS 中定义深蓝、暖金和青绿色变量；实现首屏路线带、日期导航、公里数标签、时间轴、双列卡片、移动端断点和 A4 打印样式。

- [ ] **Step 3: Add lightweight interactions**

使用原生 JavaScript 实现日期锚点滚动、展开/收起每日详情、打印按钮和返回顶部按钮；对减少动态效果设置提供降级。

- [ ] **Step 4: Run static validator**

Run: `node scripts/validate.mjs`

Expected: PASS，输出所有结构和行程检查通过。

- [ ] **Step 5: Commit page**

```bash
git add index.html
git commit -m "feat: build responsive roadtrip itinerary"
```

### Task 3: Add Repository Documentation

**Files:**
- Create: `README.md`
- Create: `.nojekyll`

- [ ] **Step 1: Write README**

记录旅行日期、路线、总里程、9 月 30 日 14:00 出发信息、本地预览命令 `python3 -m http.server 8000` 与 GitHub Pages 发布方式。

- [ ] **Step 2: Add `.nojekyll`**

创建空文件，确保 GitHub Pages 原样发布静态资源。

- [ ] **Step 3: Extend validator**

增加 `README.md`、`.nojekyll` 存在性检查和禁止 `http://` 混合内容检查。

- [ ] **Step 4: Run validator**

Run: `node scripts/validate.mjs`

Expected: PASS，输出发布文件检查通过。

- [ ] **Step 5: Commit documentation**

```bash
git add README.md .nojekyll scripts/validate.mjs
git commit -m "docs: add Pages usage and publishing files"
```

### Task 4: Verify Layout and Accessibility

**Files:**
- Modify: `index.html` only if verification finds defects

- [ ] **Step 1: Start local server**

Run: `python3 -m http.server 8000`

Expected: local server listens on port 8000.

- [ ] **Step 2: Render desktop and mobile screenshots**

使用 Playwright 打开 `http://127.0.0.1:8000`，分别以 1440×1000 和 390×844 截图。

- [ ] **Step 3: Check browser console and interactions**

确认控制台无错误，打印按钮、展开按钮、日期导航和返回顶部按钮可工作。

- [ ] **Step 4: Re-run validator**

Run: `node scripts/validate.mjs`

Expected: PASS。

- [ ] **Step 5: Commit verification fixes if needed**

```bash
git add index.html scripts/validate.mjs
git commit -m "fix: polish responsive itinerary layout"
```

### Task 5: Publish GitHub Pages

**Files:**
- No content changes expected

- [ ] **Step 1: Install or locate GitHub CLI**

确认 `gh` 可用；若不存在，通过 Homebrew 安装并完成浏览器设备授权。

- [ ] **Step 2: Create public repository**

Run: `gh repo create wuhan-yichang-roadtrip-2026 --public --source=. --remote=origin --push`

Expected: public repository created and `main` pushed.

- [ ] **Step 3: Enable GitHub Pages**

使用 GitHub API 将 Pages source 设置为 `main` 分支根目录。

- [ ] **Step 4: Verify deployment**

轮询 Pages 状态并访问公开 URL，确认 HTTP 200 且页面包含“14:00 武汉出发”和“八面山”。

- [ ] **Step 5: Report URLs**

输出 GitHub Pages 公网 URL、本地交付文件和 GitHub 仓库 URL。
