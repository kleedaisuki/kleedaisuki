/**
 * @brief 联系方式条目的数据模型。Contact channel data model.
 * @note 新增渠道只需向 contacts 数组追加一项，无需修改页面结构。Add a channel by appending one item to the contacts array without changing page structure.
 */
export interface ContactLink {
  /** @brief 稳定标识符，用于列表键与样式钩子。Stable identifier for list keys and style hooks. */
  readonly id: string;
  /** @brief 面向访客的渠道名称。Visitor-facing channel name. */
  readonly label: string;
  /** @brief 该渠道用途的简短说明。Short description of the channel's purpose. */
  readonly description: string;
  /** @brief 渠道的规范链接。Canonical URL for the channel. */
  readonly href: string;
  /** @brief 卡片中展示的紧凑地址。Compact address displayed in the card. */
  readonly display: string;
  /** @brief 无障碍可读的装饰字形。Accessible decorative glyph. */
  readonly glyph: string;
}

/**
 * @brief 个人公开入口的唯一数据源。Single source of truth for public personal entry points.
 * @note 此列表仅收录已经确认存在的站点，不推测邮箱或社交账号。This list contains only confirmed sites and does not infer email or social accounts.
 */
export const contacts: readonly ContactLink[] = [
  {
    id: "github",
    label: "GitHub",
    description: "代码、开源项目与持续更新的开发动态。",
    href: "https://github.com/kleedaisuki",
    display: "github.com/kleedaisuki",
    glyph: "GH",
  },
  {
    id: "me",
    label: "个人主页",
    description: "从这里了解我，以及最近在做的事情。",
    href: "https://me.moesegfault.dev/",
    display: "me.moesegfault.dev",
    glyph: "ME",
  },
  {
    id: "blog",
    label: "博客",
    description: "技术笔记、思考与值得长期保留的文字。",
    href: "https://blog.moesegfault.dev/",
    display: "blog.moesegfault.dev",
    glyph: "BL",
  },
  {
    id: "bot",
    label: "Bot",
    description: "访问我的机器人项目与相关服务。",
    href: "https://bot.moesegfault.dev/",
    display: "bot.moesegfault.dev",
    glyph: "BT",
  },
] as const;
