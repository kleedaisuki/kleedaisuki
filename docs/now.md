# Now

Updated: 2026-08-28

## Building

### FOGMOE

I am continuing development of **FOGMOE**, my Telegram bot and agent infrastructure project.

The project has grown into a full software system with Python and C++ components, PostgreSQL-backed durable state, isolated workspaces, observability, transactional messaging, runtime infrastructure, and reproducible deployment.

The current work is less about adding isolated features and more about refining the architecture, product boundary, and overall system.

### FOGMOE Web UI

I am building a web frontend for FOGMOE with:

- TypeScript
- React
- Vite
- pnpm

The static frontend is intended to live on GitHub Pages, while backend API and authentication services remain separate behind Cloudflare-managed routing and tunnels.

### Personal Web Space

I am reorganizing my public web presence around `moesegfault.dev`.

Current work includes:

- creating `me.moesegfault.dev` as the personal identity and project index;
- evolving the existing blog into a broader publishing and artifact space;
- moving toward the name `atelier.moesegfault.dev`;
- keeping individual live products on their own subdomains when they have a real product boundary;
- keeping the visual language consistent across the sites.

## Researching

### Agent-legible Systems

I am continuing to develop the idea of **Agent-legible Systems**: systems designed to expose runtime state, invariants, traces, experiments, and other machine-queryable evidence so that agents can reason about software through executable evidence rather than static code review alone.

A recurring question is how software governance changes when code generation becomes cheap but human attention remains scarce.

### Agent and Model Cost Modelling

I am interested in building a more useful cost model for agentic workloads.

API price alone is not enough. I want to model real agent tasks using empirical measurements so that questions such as model choice, reasoning level, subagent parallelism, caching, and scheduling can be treated as an optimization problem rather than guesswork.

### Modern Research Systems

I am exploring how research workflows should change when implementation becomes dramatically cheaper.

My current direction emphasizes:

- modern project management;
- top-down system design;
- reproducible experimental infrastructure;
- productization from the beginning rather than as a final cleanup step;
- using software engineering to make experiments easier to query, repeat, compare, and extend.

## Systems & Websites

My current public structure is converging toward:

- `me.moesegfault.dev` — identity, selected work, current activity, and links;
- `atelier.moesegfault.dev` — writing, technical notes, and artifacts;
- `bot.moesegfault.dev` — FOGMOE's user-facing web surface;
- `api.moesegfault.dev` — backend API gateway;
- `auth.moesegfault.dev` — authentication boundary;
- GitHub — source code and implementation history.

I am increasingly treating static web frontends as immutable artifacts that should be deployed by managed infrastructure rather than operated as long-running services.

## Current Interests

- AI-native software engineering.
- Systems architecture and runtime design.
- Agent-legible software and executable evidence.
- Multi-agent scheduling and model-cost optimization.
- Modern project management for research and engineering.
- Native productization of technical and research projects.
- JetBrains IDEs combined with Codex-centered development workflows.
- PostgreSQL-centered data-intensive systems.
- C++ and Python systems programming.
- TypeScript and modern frontend engineering.
- Java and the JVM ecosystem.
- Making research prototypes and engineering projects directly explorable through live web interfaces.
