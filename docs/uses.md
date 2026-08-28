# Uses

This is a current snapshot of the tools I actually use. It changes over time as my workflow changes.

## Computing Environment

- Windows as the host desktop operating system.
- WSL2 with Ubuntu 24.04 as my primary Linux development environment.
- Most systems work, builds, and command-line tooling live inside WSL2.

## IDEs and Editors

JetBrains IDEs are now my main development environment.

- **CLion** for C and C++.
- **IntelliJ IDEA** for Java.
- **PyCharm** for Python.
- **WebStorm** for TypeScript, web work, and LaTeX.
- **DataGrip** for databases.
- **RustRover** for Rust.
- **VS Code** remains installed as a fallback rather than my primary IDE.

I prefer semantic navigation, refactoring, code inspection, and project-aware tooling over treating the editor as a lightweight text surface.

## AI

- **ChatGPT Pro** for reasoning, research, discussion, and technical exploration.
- **Codex** is my primary coding agent.
- I use Codex both as a standalone application and alongside JetBrains IDEs.

My usual workflow is to let the agent explore code, documentation, and runtime evidence, then review its analysis, make the architectural decision myself, and let it implement and run regression checks.

## Programming Languages

- **C++23** and **Python** are my main languages.
- **TypeScript** for web frontends, usually with React and Vite.
- **Java** is something I am currently exploring more seriously.
- **Rust** for systems work when its ecosystem or language model is useful.
- **Markdown** and **LaTeX** for technical writing.

## Build and Package Tooling

- **CMake** for C and C++ projects.
- **uv** for modern Python project and dependency management.
- **pnpm** for TypeScript and frontend projects.
- **Git** and **GitHub** for source control and public project hosting.
- **GitHub Actions** for CI and deployment.

## Databases

- **PostgreSQL** is my default database for data-intensive systems.
- **pgvector** when vector search belongs in the same transactional system.
- I use migration and typed data-access tooling such as Alembic and SQLAlchemy when appropriate.

## Web

My current default frontend stack is:

- TypeScript
- React
- Vite
- pnpm

For static frontends and project showcases, I prefer pushing the built artifact to **GitHub Pages** instead of maintaining a web server myself.

## Infrastructure

- **Cloudflare** for DNS, domains, and tunnels.
- **GitHub Pages** for static sites and frontend deployment.
- **GitHub Actions** for automated builds and publishing.
- **PostgreSQL** for stateful application data.
- Linux servers and local WSL2 environments for backend services that actually need a runtime.

My public technical projects and sites live under `moesegfault.dev`.

## Systems and Performance Work

Depending on the project, I use tools such as:

- `perf`
- NVIDIA Nsight
- Valgrind
- heaptrack
- LIKWID
- mpiP
- Score-P

I generally prefer measuring runtime behavior over reasoning from source code alone.

## Writing and Publishing

I write primarily in Markdown and LaTeX.

My public writing and artifacts are organized under the `moesegfault.dev` namespace, with the publishing site increasingly serving as both a writing space and an artifact archive.
