> **「代码是我最强的魔法阵，C++是契约时刻显现的银白符文。终身学习？当然是我和宇宙图灵机的共振频率～」**  
> 💻 CS之海徘徊的咒式构造者 / 超自学主义者 / 有点反复debug的夜行性生物

> **「数学是通往多重真理之门的贤者石碑，逻辑是我随身携带的四维短剑！」**  
> 📐 数学信徒兼吐槽役 / ∑系咒文编织者 / ε-δ的调律师

> **「语言是异界坐标，书本是心灵跨层传送器，阅读是精神体专属的Warp跳跃指令～」**  
> 📖 白天上课偷偷看论文的阅读生命体 / 情报摄取者 / 知识系文具控

> **「ChatGPT 是我在数据海中的战术参谋，Gemini 是我脑后浮现的同步术式核心，我和它们共同执行深研多线程作战。」**  
> 🤖 异常熵值制造机 / AI亲合系术师 / Prompt型意识流召唤者（暂无JP语音包适配）

> **「学校是物理上在场，精神上断线的副本世界……而我，只想自由探索世界主线剧情！」**  
> 🏫 社会性逃避中 / 学科结构破坏者 / 每日许愿“今天别点名”

> **「ACGN预警🔔！这里是技术宅萝莉的作战本阵！次元壁？我早就用信仰穿透啦！萌即是观察恒定点，中二就是我的重力中心！」**  
> ⚠️ 宇宙萌战前线指挥官 / 多宇宙界面连接器 / Moe系统β版本实验体

## Cloudflare Workers 部署

本站将 Astro 页面静态预渲染，再由同一 Cloudflare Worker 提供这些静态资源和 TypeScript `/api/*` 接口。原有中英文页面、`/llms.txt`、站点地图及自定义 404 均由 `dist/` 提供；`astro.config.mjs` 中的规范域名仍是 `https://me.moesegfault.dev`。部署结构与取舍见 [迁移设计记录](docs/cloudflare-migration.md)。

2026-09-29 已将正式域名绑定至 Cloudflare Worker；页面、发现文件、API 和 404 的线上验证记录见 [迁移验证](docs/cloudflare-validation.md)。后续更新由下述 CI 流程发布。

### 本地验证

需要 Node.js 24 和仓库声明的 pnpm 版本。若本机 `pnpm` 命令损坏，可用 `corepack pnpm` 代替。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:unit
pnpm build
pnpm verify:discovery
pnpm preview:cloudflare --port 4341
```

`pnpm dev` 仍用于 Astro 页面开发；验证同源 API、Cloudflare 静态资源路由及自定义 404 时，应使用上面的 Wrangler 本地预览。`pnpm cf-typegen` 可在 Wrangler 绑定配置变更后重新生成绑定类型。`pnpm exec wrangler deploy --dry-run` 只检查并打包，不会发布。项目的临时测试文件应放在根目录 `.cache/` 或 `.temp/`。

### CI 与域名切换

`main` 推送和手动触发都会运行 `.github/workflows/deploy.yml`。它先检查绑定与 TypeScript 类型、运行单元测试、构建并验证页面，然后用 Chromium 检查 Cloudflare 路由，全部通过后才发布 Worker 与静态资源。构建所用 `GITHUB_TOKEN` 仅存在于 CI，不会作为 Worker 运行时密钥。请在 GitHub Actions 的仓库或 `production` 环境中配置以下机密：

| 机密 | 用途 |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | 所属 Cloudflare 账户 ID |
| `CLOUDFLARE_API_TOKEN` | 仅授予目标账户所需 Workers 部署权限的 API 令牌；首次建站及域名绑定还需目标 zone 的 Workers Routes Write 权限 |

`wrangler.jsonc` 声明 `me.moesegfault.dev` 为 Worker 自定义域名（Custom Domain）。**首次切换前**，先在本地和预览环境核对所有页面、API 与 404；在 GitHub `production` 环境设置所需审批门槛，防止下一次 `main` 推送抢先发布；确认回退方案后，再处理现有 GitHub Pages 的 `me.moesegfault.dev` CNAME/DNS 占用并发布。Cloudflare 不允许在已有冲突 CNAME 的主机名上创建 Worker 自定义域名。不要在仓库中保存 API 令牌；不要在未完成域名切换前关闭旧 Pages 发布。回退时，可重新指向旧站点或重新部署上一个已验证的 Worker 版本。

原 GitHub Pages 专用的 `public/CNAME` 已从当前构建移除，不会作为可访问的静态文件上传；这**不会**自动删除 Cloudflare DNS 中可能仍存在的 CNAME 记录。若需回退到 Pages，可恢复旧提交及其部署流程。

若运行时 GitHub 匿名 API 配额不足，可用 `pnpm exec wrangler secret put GITHUB_TOKEN` 单独配置 Worker 的可选密钥。它与构建时的 GitHub Actions `GITHUB_TOKEN` 属于不同的凭据和生命周期；无需此密钥也能部署，失败时页面仍保留构建时的个人资料快照。

部署配置遵循 [Cloudflare Astro 指南](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)、[静态资源路由说明](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)、[GitHub Actions 认证指南](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)与 [Workers 权限说明](https://developers.cloudflare.com/workers/authorization/workers/)。
