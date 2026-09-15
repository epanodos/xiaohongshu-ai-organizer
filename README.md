# Xiaohongshu AI Organizer

两个安全优先的 Codex Skill，用 AI 协助整理你自己的小红书账号：

- `xhs-published-cleanup`：盘点已发布笔记，保留指定内容，预览并确认后再删除其余内容。
- `xhs-favorites-organizer`：盘点收藏夹和全局收藏，保护指定收藏夹中的全部笔记，再整理其余收藏与收藏夹。

> 当前版本：`0.1.0-preview`。计划校验和安全规则已离线测试；小红书页面会变化，任何真实批量操作都应先小范围验证。这个项目不是小红书官方工具。

## 它解决什么问题

这个项目处理两个很实际的麻烦：以前发布的笔记太多，想只留下指定的几篇；收藏和收藏夹越积越乱，想保留真正有用的内容，把其余部分清掉。手工逐条处理很费时间，数量一多还容易漏掉或误删。

使用时，你只需要告诉 AI 哪些内容必须保留，例如发给它一篇笔记的链接，或者指定要留下的收藏夹。AI 会在独立的登录浏览器里先盘点全部内容，把要保留的笔记加入保护名单，再列出准备删除或取消收藏的项目。你看过清单并确认后，它才开始执行；完成后还会重新盘点，检查保留内容是否还在、待清理内容是否真的消失。

发布内容和收藏内容的操作页面、保护规则及执行顺序不同，所以项目分别提供两个 Skill，但安装、浏览器配置和安全检查都放在同一个仓库里。

## 安全模型

两个 Skill 默认遵循同一条流水线：

```text
独立浏览器 → 只读盘点 → 保护集 → 操作预览 → 用户确认
           → 计划哈希校验 → 限速执行 → 检查点 → 集合复核
```

关键规则：

- 使用独立、持久化的 Agent 浏览器配置，不占用日常 Chrome。
- 用户自己登录；项目不读取、不导出、不提交 Cookie、Token 或密码。
- 默认只盘点，不执行删除。
- 以稳定 ID 保护内容，不依赖标题或屏幕坐标。
- 计划一旦变化，旧确认立即失效。
- 遇到登录失效、验证码、限流或状态不一致，停止而不是强行重试。
- 收藏整理先取消非保护笔记的收藏，最后删除不保留的收藏夹。

详细边界见 [SECURITY.md](SECURITY.md) 与 [PRIVACY.md](PRIVACY.md)。

## 环境

- Windows 10/11
- Node.js 20+
- Codex Desktop 或支持本地 Skill 的 Codex 环境
- Chrome/Chromium
- 可操作浏览器的 Agent 工具；示例使用 `agent-browser`

## 安装

克隆仓库：

```powershell
git clone https://github.com/epanodos/xiaohongshu-ai-organizer.git
Set-Location xiaohongshu-ai-organizer
npm test
npm run check
```

将需要的 Skill 复制到 Codex Skills 目录：

```powershell
Copy-Item -Recurse skills\xhs-published-cleanup "$env:USERPROFILE\.codex\skills\xhs-published-cleanup"
Copy-Item -Recurse skills\xhs-favorites-organizer "$env:USERPROFILE\.codex\skills\xhs-favorites-organizer"
```

重启或刷新 Codex 后即可调用。浏览器工具的安装方式请以其当前官方文档为准。

## 第一次登录：使用独立浏览器

建议为 Agent 创建专用持久化目录：

```powershell
$env:AGENT_BROWSER_PROFILE = "$env:USERPROFILE\.agent-browser\profiles\xhs-organizer"
agent-browser --session xhs-organizer --profile $env:AGENT_BROWSER_PROFILE open https://www.xiaohongshu.com/
```

在打开的窗口里手动登录，然后关闭窗口。以后复用相同 session/profile，即可保留该专用浏览器的登录状态，不影响你日常使用的 Chrome。

不要让 Agent 直接接管日常 Chrome 的 `Default` profile；也不要把 profile 目录同步到 GitHub。

## 调用方式

传入链接或清晰的保留条件即可触发对应流程。例如：

```text
用 $xhs-published-cleanup 整理我发布过的内容。保留这个链接对应的笔记，其余先盘点并给我删除预览，不要立即删除：<链接>
```

```text
用 $xhs-favorites-organizer 整理我的收藏。只保留“AI”和“Design”两个收藏夹里的笔记，先盘点并给我完整预览，不要立即修改。
```

“我发一个链接就能开始”是合理体验：链接可用于确定保护对象并启动只读盘点。但删除仍需要第二阶段确认，因为登录失效、重名、页面变化或盘点不完整都可能改变实际目标。

## 计划校验器

每个 Skill 都自带独立的 `plan_guard.mjs`。先复制示例计划到 Git 忽略的运行目录，再验证：

```powershell
New-Item -ItemType Directory -Force .xhs-organizer | Out-Null
Copy-Item examples\published-plan.example.json .xhs-organizer\published-plan.json
node skills\xhs-published-cleanup\scripts\plan_guard.mjs validate .xhs-organizer\published-plan.json
```

用户确认预览后，才记录确认：

```powershell
node skills\xhs-published-cleanup\scripts\plan_guard.mjs confirm .xhs-organizer\published-plan.json --phrase "CONFIRM XHS DESTRUCTIVE ACTIONS"
node skills\xhs-published-cleanup\scripts\plan_guard.mjs validate .xhs-organizer\published-plan.json --require-confirmed
```

确认绑定计划内容的 SHA-256 哈希。修改保护集或操作列表后，`--require-confirmed` 会失败，必须重新预览和确认。

## 当前能力边界

仓库提供的是可复用的 Agent 工作流、安全约束、计划格式和离线校验，不是一个无人值守的“批量删除脚本”。小红书的页面结构、风控和账号状态会变化，浏览器执行层必须基于当时可见页面工作。真实操作是否完成，应以操作后的 ID 集合复核为准。

## 验证

```powershell
npm test
npm run check
```

测试覆盖保护对象拦截、计划变更导致确认失效、收藏夹最后删除、未解决事项阻止执行，以及仓库敏感信息/占位符检查。

## 经验记录

从真实整理过程抽象出的事实、失败原因和设计取舍见 [docs/case-study.md](docs/case-study.md)。示例中的账号、笔记和收藏夹 ID 均为虚构值。

## License

[MIT](LICENSE)
