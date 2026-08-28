---
locale: zh-CN
source: /docs/uses.md
---

# 使用中的工具

这是我实际使用的工具的当前快照。随着工作流变化，它也会随时间改变。

## 计算环境

- Windows 作为宿主桌面操作系统。
- WSL2 与 Ubuntu 24.04 作为我的主要 Linux 开发环境。
- 大多数系统开发、构建和命令行工具都运行在 WSL2 内。

## IDE 与编辑器

JetBrains IDE 现在是我的主要开发环境。

- **CLion** 用于 C 和 C++。
- **IntelliJ IDEA** 用于 Java。
- **PyCharm** 用于 Python。
- **WebStorm** 用于 TypeScript、Web 开发和 LaTeX。
- **DataGrip** 用于数据库。
- **RustRover** 用于 Rust。
- **VS Code** 仍然保留作为备用工具，而不是我的主要 IDE。

相比把编辑器仅仅当作轻量文本界面，我更偏好语义导航、重构、代码检查以及理解项目上下文的工具能力。

## AI

- **ChatGPT Pro** 用于推理、研究、讨论和技术探索。
- **Codex** 是我的主要编码智能体。
- 我既会将 Codex 作为独立应用使用，也会把它与 JetBrains IDE 配合使用。

我通常会先让智能体探索代码、文档和运行时证据，再审阅它的分析，亲自作出架构决策，最后让它完成实现并运行回归检查。

## 编程语言

- **C++23** 和 **Python** 是我的主要语言。
- **TypeScript** 用于 Web 前端，通常搭配 React 和 Vite。
- 我目前正在更认真地探索 **Java**。
- 当 **Rust** 的生态系统或语言模型适合任务时，用它进行系统开发。
- **Markdown** 和 **LaTeX** 用于技术写作。

## 构建与包管理工具

- **CMake** 用于 C 和 C++ 项目。
- **uv** 用于现代 Python 项目与依赖管理。
- **pnpm** 用于 TypeScript 和前端项目。
- **Git** 和 **GitHub** 用于版本控制和公开项目托管。
- **GitHub Actions** 用于 CI 和部署。

## 数据库

- **PostgreSQL** 是我开发数据密集型系统时的默认数据库。
- 当向量搜索属于同一个事务系统时，使用 **pgvector**。
- 适当时，我会使用 Alembic 和 SQLAlchemy 等迁移与类型化数据访问工具。

## Web

我目前默认的前端技术栈是：

- TypeScript
- React
- Vite
- pnpm

对于静态前端和项目展示，我倾向于把构建产物发布到 **GitHub Pages**，而不是自行维护 Web 服务器。

## 基础设施

- **Cloudflare** 用于 DNS、域名和隧道。
- **GitHub Pages** 用于静态站点和前端部署。
- **GitHub Actions** 用于自动构建与发布。
- **PostgreSQL** 用于有状态应用数据。
- 真正需要运行时的后端服务则使用 Linux 服务器和本地 WSL2 环境。

我的公开技术项目和站点都位于 `moesegfault.dev` 之下。

## 系统与性能工作

视项目而定，我会使用以下工具：

- `perf`
- NVIDIA Nsight
- Valgrind
- heaptrack
- LIKWID
- mpiP
- Score-P

通常，相比仅从源代码进行推断，我更倾向于测量运行时行为。

## 写作与发布

我主要使用 Markdown 和 LaTeX 写作。

我的公开写作和作品都组织在 `moesegfault.dev` 命名空间下；其发布站点正日益同时成为写作空间和作品档案库。
