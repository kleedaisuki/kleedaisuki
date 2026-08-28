import type { GitHubProject } from "../lib/github";

/**
 * @brief GitHub API 不可用时的代表性项目快照 (representative project snapshot used when the GitHub API is unavailable)。
 * @note 该快照只保证页面可用；线上构建通常由 GitHub REST 数据覆盖 (This snapshot preserves page availability; normal online builds replace it with GitHub REST data)。
 */
export const PROJECT_FALLBACK: readonly GitHubProject[] = [
  {
    name: "cinder",
    description:
      "A tiny CUDA C++ runtime with a stable C ABI and Python FFI bindings — native kernels, no extension magic.",
    repositoryUrl: "https://github.com/kleedaisuki/cinder",
    homepage: null,
    language: "Cuda",
    stars: 0,
    forks: 0,
    topics: ["cuda", "cpp", "python"],
    updatedAt: "2026-06-08T12:44:01Z",
  },
  {
    name: "mini-core-bank",
    description:
      "A miniature core banking system for practicing domain-driven design, accounting flows, cards, credit, and investment modeling.",
    repositoryUrl: "https://github.com/kleedaisuki/mini-core-bank",
    homepage: null,
    language: "Java",
    stars: 0,
    forks: 0,
    topics: ["domain-driven-design", "banking"],
    updatedAt: "2026-06-05T14:23:15Z",
  },
  {
    name: "jacobi-svd-cuda-opt",
    description: "One-sided Jacobi (Hestenes) SVD on CUDA with libcu++.",
    repositoryUrl: "https://github.com/kleedaisuki/jacobi-svd-cuda-opt",
    homepage: null,
    language: "Cuda",
    stars: 0,
    forks: 0,
    topics: ["cuda", "linear-algebra", "svd"],
    updatedAt: "2026-05-16T11:56:13Z",
  },
  {
    name: "isa-compare-lab",
    description:
      "A minimal framework for comparing ARM and RISC-V instruction set architectures with assembly and QEMU.",
    repositoryUrl: "https://github.com/kleedaisuki/isa-compare-lab",
    homepage: null,
    language: "TeX",
    stars: 0,
    forks: 0,
    topics: ["arm", "risc-v", "qemu"],
    updatedAt: "2026-04-23T11:29:28Z",
  },
  {
    name: "histo-patch-cls",
    description:
      "A minimal, configuration-driven PyTorch pipeline for reproducible histopathology patch classification.",
    repositoryUrl: "https://github.com/kleedaisuki/histo-patch-cls",
    homepage: null,
    language: "Python",
    stars: 0,
    forks: 0,
    topics: ["pytorch", "computer-vision"],
    updatedAt: "2026-04-17T13:34:24Z",
  },
];
