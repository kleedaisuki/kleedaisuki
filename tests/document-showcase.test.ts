import assert from "node:assert/strict";
import test from "node:test";
import { parseShowcaseDocument } from "../src/lib/document-showcase.ts";

test("keeps headings inside fenced code blocks in their source section", () => {
  /** @brief 包含围栏内伪标题的 Markdown 样本 (Markdown sample containing pseudo-headings inside fences)。 */
  const markdown = `# Uses

Updated: 2026-08-28

## Editor

- [Neovim](https://neovim.io/)

\`\`\`md
## Example heading
### Nested example
\`\`\`

### Plugins

- Treesitter
`;
  /** @brief 章节化后的展陈文档 (Sectionized showcase document)。 */
  const document = parseShowcaseDocument(markdown);

  assert.equal(document.sections.length, 1);
  assert.equal(document.sections[0]?.title, "Editor");
  assert.match(document.sections[0]?.html ?? "", /Example heading/);
  assert.match(document.sections[0]?.html ?? "", /Neovim/);
  assert.equal(document.sections[0]?.items.length, 1);
  assert.equal(document.sections[0]?.items[0]?.title, "Plugins");
  assert.match(document.sections[0]?.items[0]?.html ?? "", /Treesitter/);
});
