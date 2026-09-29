import { parseGitHubProfile, type GitHubProfile } from "../lib/github-profile-model.ts";

/** @brief 浏览器端 GitHub 资料状态 (Browser-side GitHub profile states)。 */
type ProfileState = "static" | "refreshing" | "live";

/** @brief 浏览器动态资料请求的最长等待时间，单位为毫秒 (Maximum browser profile-request duration in milliseconds)。 */
const PROFILE_REQUEST_TIMEOUT_MS = 8_000;
/** @brief 动态头像预加载的最长等待时间，单位为毫秒 (Maximum dynamic-avatar preload duration in milliseconds)。 */
const AVATAR_PRELOAD_TIMEOUT_MS = 4_000;
/** @brief 成功动态资料在当前会话中的缓存时长 (Lifetime of a successful dynamic profile in the current session)。 */
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1_000;
/** @brief 动态资料会话缓存键 (Session-cache key for dynamic profile data)。 */
const PROFILE_CACHE_KEY = "moesegfault:github-profile:v1";
/** @brief 限流后停止本会话后续请求的标记键 (Marker key that stops further requests in a rate-limited session)。 */
const PROFILE_BACKOFF_KEY = "moesegfault:github-profile:backoff";

/** @brief 会话中保存的动态资料记录 (Dynamic profile record stored in the session)。 */
interface CachedProfileRecord {
  /** @brief 缓存写入时间戳 (Cache-write timestamp)。 */
  cachedAt: number;
  /** @brief GitHub REST 原始响应 (Raw GitHub REST payload)。 */
  payload: unknown;
}

/**
 * @brief 查询资料卡中的元素 (Query an element inside a profile card)。
 * @param card GitHub 资料卡根元素 (GitHub profile-card root)。
 * @param selector 待查询的选择器 (Selector to query)。
 * @return 匹配元素；不存在时为空 (The matching element, or null when absent)。
 */
function profileElement<T extends Element>(card: HTMLElement, selector: string): T | null {
  return card.querySelector<T>(selector);
}

/**
 * @brief 更新可为空的文本字段 (Update an optional text field)。
 * @param container 可隐藏的字段容器 (Field container that may be hidden)。
 * @param target 实际承载文本的元素 (Element that carries the text)。
 * @param value 最新文本或空值 (Latest text or null)。
 * @return 无返回值 (No return value)。
 */
function updateOptionalText(
  container: HTMLElement | null,
  target: HTMLElement | null,
  value: string | null,
): void {
  if (!(container && target)) return;
  container.hidden = !value;
  if (value) target.textContent = value;
}

/**
 * @brief 设置资料卡状态并保留静态内容 (Set profile-card state while preserving static content)。
 * @param card GitHub 资料卡根元素 (GitHub profile-card root)。
 * @param state 新状态 (New state)。
 * @return 无返回值 (No return value)。
 */
function setProfileState(card: HTMLElement, state: ProfileState): void {
  card.dataset.profileState = state;
  card.setAttribute("aria-busy", String(state === "refreshing"));
  /** @brief 资料来源标签 (Profile source label)。 */
  const label = profileElement<HTMLElement>(card, "[data-profile-source-label]");
  if (!label) return;
  if (state === "live") {
    label.textContent = card.dataset.profileLiveLabel ?? label.textContent;
  } else if (state === "static") {
    label.textContent = card.dataset.profileStaticLabel ?? label.textContent;
  }
}

/**
 * @brief 读取当前会话中仍新鲜的动态资料 (Read fresh dynamic profile data from the current session)。
 * @return 已校验的缓存资料；无缓存或缓存失效时为空 (Validated cached profile, or null when missing or expired)。
 */
function readCachedProfile(): GitHubProfile | null {
  try {
    /** @brief 会话缓存中的原始记录文本 (Raw record text from session storage)。 */
    const stored = window.sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!stored) return null;
    /** @brief 解析后的缓存记录 (Parsed cache record)。 */
    const record = JSON.parse(stored) as Partial<CachedProfileRecord>;
    if (
      typeof record.cachedAt !== "number" ||
      Date.now() - record.cachedAt > PROFILE_CACHE_TTL_MS
    ) {
      window.sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    return parseGitHubProfile(record.payload);
  } catch {
    return null;
  }
}

/**
 * @brief 保存本次成功响应供当前会话复用 (Store a successful response for reuse in the current session)。
 * @param payload GitHub REST 原始响应 (Raw GitHub REST payload)。
 * @return 无返回值 (No return value)。
 */
function writeCachedProfile(payload: unknown): void {
  try {
    /** @brief 待写入的会话缓存记录 (Session-cache record to write)。 */
    const record: CachedProfileRecord = { cachedAt: Date.now(), payload };
    window.sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(record));
  } catch {
    // 会话存储不可用时仍保留本次实时资料 / Keep this live result when session storage is unavailable.
  }
}

/**
 * @brief 判断当前会话是否因 GitHub 限流而退避 (Check whether this session is backing off after GitHub rate limiting)。
 * @return 需要停止请求时为 true (True when further requests should be skipped)。
 */
function isRateLimitedSession(): boolean {
  try {
    return window.sessionStorage.getItem(PROFILE_BACKOFF_KEY) === "1";
  } catch {
    return false;
  }
}

/** @brief 标记当前会话不再请求 GitHub (Mark the current session to stop requesting GitHub)。 */
function markRateLimitedSession(): void {
  try {
    window.sessionStorage.setItem(PROFILE_BACKOFF_KEY, "1");
  } catch {
    // 会话存储不可用时依靠单次无重试语义 / Rely on the no-retry behavior when storage is unavailable.
  }
}

/**
 * @brief 在提交动态资料前预加载新头像 (Preload a new avatar before committing live profile data)。
 * @param card GitHub 资料卡根元素 (GitHub profile-card root)。
 * @param avatarUrl 动态头像地址 (Live avatar URL)。
 * @return 头像可用后完成的异步任务 (Promise completed when the avatar is usable)。
 */
function preloadAvatar(card: HTMLElement, avatarUrl: string): Promise<void> {
  /** @brief 当前静态头像元素 (Current static avatar element)。 */
  const current = profileElement<HTMLImageElement>(card, "[data-profile-avatar]");
  if (current?.src === avatarUrl) return Promise.resolve();
  return new Promise((resolve, reject) => {
    /** @brief 用于预加载的离屏图片 (Off-screen image used for preloading)。 */
    const image = new Image();
    /** @brief 头像预加载是否已经结束 (Whether avatar preloading has already settled)。 */
    let settled = false;
    /** @brief 头像预加载超时计时器 (Avatar-preload timeout timer)。 */
    const timeout = window.setTimeout(
      () => finish(new Error("GitHub avatar preload timed out")),
      AVATAR_PRELOAD_TIMEOUT_MS,
    );
    /**
     * @brief 结束头像预加载并释放监听状态 (Settle avatar preloading and release listener state)。
     * @param error 失败原因；成功时为空 (Failure reason, or undefined on success)。
     * @return 无返回值 (No return value)。
     */
    function finish(error?: Error): void {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error);
      else resolve();
    }
    image.onload = () => finish();
    image.onerror = () => finish(new Error("GitHub avatar failed to load"));
    image.src = avatarUrl;
  });
}

/**
 * @brief 用动态 GitHub 响应原位更新资料卡 (Update a profile card in place with a live GitHub response)。
 * @param card GitHub 资料卡根元素 (GitHub profile-card root)。
 * @param profile 已校验的 GitHub 资料 (Validated GitHub profile)。
 * @return 无返回值 (No return value)。
 */
function applyLiveProfile(card: HTMLElement, profile: GitHubProfile): void {
  /** @brief 最新显示名称 (Latest display name)。 */
  const displayName = profile.name ?? profile.login;
  /** @brief 当前页面语言 (Active page locale)。 */
  const locale = card.dataset.profileLocale ?? "en";
  /** @brief 本地化后的 GitHub 加入年份 (Localized GitHub join year)。 */
  const joinedYear = new Intl.DateTimeFormat(locale, { year: "numeric" }).format(
    new Date(profile.createdAt),
  );
  /** @brief 适合紧凑显示的个人网站地址 (Personal website address formatted for compact display)。 */
  const displayBlog = profile.blog?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? null;
  /** @brief 头像元素 (Avatar element)。 */
  const avatar = profileElement<HTMLImageElement>(card, "[data-profile-avatar]");
  if (avatar) {
    avatar.src = profile.avatarUrl;
    avatar.alt = `${displayName}${card.dataset.profileAvatarSuffix ?? ""}`;
  }

  /** @brief 显示名称元素 (Display-name element)。 */
  const name = profileElement<HTMLElement>(card, "[data-profile-name]");
  if (name) name.textContent = displayName;
  /** @brief 登录名元素 (Login-name element)。 */
  const login = profileElement<HTMLElement>(card, "[data-profile-login]");
  if (login) login.textContent = profile.login;
  /** @brief GitHub 资料链接 (GitHub profile link)。 */
  const profileLink = profileElement<HTMLAnchorElement>(card, "[data-profile-link]");
  if (profileLink) profileLink.href = profile.profileUrl;

  /** @brief 简介元素 (Biography element)。 */
  const bio = profileElement<HTMLElement>(card, "[data-profile-bio]");
  updateOptionalText(bio, bio, profile.bio);
  if (bio) {
    bio.lang =
      locale === "zh-CN" && profile.bio && !/\p{Script=Han}/u.test(profile.bio) ? "en" : "";
  }
  updateOptionalText(
    profileElement<HTMLElement>(card, "[data-profile-company]"),
    profileElement<HTMLElement>(card, "[data-profile-company-text]"),
    profile.company,
  );
  updateOptionalText(
    profileElement<HTMLElement>(card, "[data-profile-location]"),
    profileElement<HTMLElement>(card, "[data-profile-location-text]"),
    profile.location,
  );

  /** @brief 公开仓库计数元素 (Public-repository count element)。 */
  const repositories = profileElement<HTMLElement>(card, '[data-profile-stat="repositories"]');
  if (repositories) repositories.textContent = String(profile.publicRepositories);
  /** @brief 关注者计数元素 (Follower-count element)。 */
  const followers = profileElement<HTMLElement>(card, '[data-profile-stat="followers"]');
  if (followers) followers.textContent = String(profile.followers);
  /** @brief 正在关注计数元素 (Following-count element)。 */
  const following = profileElement<HTMLElement>(card, '[data-profile-stat="following"]');
  if (following) following.textContent = String(profile.following);

  /** @brief 加入年份元素 (Join-year element)。 */
  const joined = profileElement<HTMLElement>(card, "[data-profile-joined]");
  if (joined) joined.textContent = joinedYear;

  /** @brief 个人网站链接 (Personal website link)。 */
  const blog = profileElement<HTMLAnchorElement>(card, "[data-profile-blog]");
  /** @brief 个人网站显示文本 (Personal website display text)。 */
  const blogText = profileElement<HTMLElement>(card, "[data-profile-blog-text]");
  if (blog && blogText) {
    blog.hidden = !profile.blog;
    if (profile.blog) {
      blog.href = profile.blog;
      blogText.textContent = displayBlog ?? profile.blog;
    }
  }
}

/**
 * @brief 动态刷新一张 GitHub 资料卡 (Dynamically refresh one GitHub profile card)。
 * @param card GitHub 资料卡根元素 (GitHub profile-card root)。
 * @return 完成刷新后的异步任务 (Promise completed after refresh)。
 * @note 任意动态错误都会恢复 static 状态且不清空构建期内容 (Any dynamic failure restores the static state without clearing build-time content)。
 */
async function refreshProfileCard(card: HTMLElement): Promise<void> {
  /** @brief 同源边缘资料端点 (Same-origin edge profile endpoint)。 */
  const endpoint = card.dataset.profileEndpoint;
  if (!endpoint) return;

  /** @brief 当前会话中可直接使用的动态资料 (Dynamic profile reusable from the current session)。 */
  const cachedProfile = readCachedProfile();
  if (cachedProfile) {
    try {
      await preloadAvatar(card, cachedProfile.avatarUrl);
      applyLiveProfile(card, cachedProfile);
      setProfileState(card, "live");
    } catch {
      setProfileState(card, "static");
    }
    return;
  }
  if (isRateLimitedSession()) return;
  setProfileState(card, "refreshing");

  /** @brief 控制动态请求超时的中止器 (Abort controller enforcing the dynamic-request timeout)。 */
  const controller = new AbortController();
  /** @brief 动态请求超时计时器 (Dynamic-request timeout timer)。 */
  const timeout = window.setTimeout(() => controller.abort(), PROFILE_REQUEST_TIMEOUT_MS);
  try {
    /** @brief 同源 Worker 响应 (Same-origin Worker response)。 */
    let response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    // A shared anonymous Worker egress IP can exhaust GitHub's quota even when
    // the visitor's own quota remains available. Keep the previous path as a
    // rate-limit-only compatibility fallback until a Worker secret is provisioned.
    if (response.status === 429 && card.dataset.profileFallbackEndpoint) {
      response = await fetch(card.dataset.profileFallbackEndpoint, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      });
    }
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) markRateLimitedSession();
      throw new Error(`Profile endpoint returned ${response.status}`);
    }
    /** @brief GitHub REST 原始动态响应 (Raw live GitHub REST payload)。 */
    const payload: unknown = await response.json();
    /** @brief 已校验的动态 GitHub 资料 (Validated live GitHub profile)。 */
    const profile = parseGitHubProfile(payload);
    await preloadAvatar(card, profile.avatarUrl);
    applyLiveProfile(card, profile);
    writeCachedProfile(payload);
    setProfileState(card, "live");
  } catch (error) {
    setProfileState(card, "static");
    console.warn("[profile] Dynamic GitHub refresh failed; keeping static content.", error);
  } finally {
    window.clearTimeout(timeout);
  }
}

/** @brief 当前文档中的 GitHub 资料卡 (GitHub profile cards in the current document)。 */
const profileCards = document.querySelectorAll<HTMLElement>("[data-github-profile]");
for (const card of profileCards) void refreshProfileCard(card);
