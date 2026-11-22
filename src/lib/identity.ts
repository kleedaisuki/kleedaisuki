/** One self-description from the profile document: a quote and the roles that go with it. */
export interface IdentityFragment {
  readonly quote: string;
  /** The emoji that opens the role line. */
  readonly mark: string;
  readonly roles: readonly string[];
}

const fragmentPattern = /^\*\*(?<quote>.+?)\*\*[\\\s]*(?<mark>\S+)\s+(?<roles>.+)$/s;

/** Reads the profile's quote blocks; malformed blocks fail the build rather than vanish. */
export function parseIdentity(markdown: string): readonly IdentityFragment[] {
  return markdown
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.replace(/^>\s?/gm, "").trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const groups = block.match(fragmentPattern)?.groups;
      if (!groups) throw new Error(`Not an identity fragment: ${block.slice(0, 40)}`);
      const { quote = "", mark = "", roles = "" } = groups;
      return { quote, mark, roles: roles.split(/\s+\/\s+/).map((role) => role.trim()) };
    });
}
