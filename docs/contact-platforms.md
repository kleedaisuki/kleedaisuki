# Public platform curation for the contact page

Decision date: 2026-09-29. The site owner provided a Cloudflare BIND-format DNS export and explicitly confirmed which project landing pages should be promoted. The export is not committed: it also contains operational and mail records that are irrelevant to the public page. HTTP titles and descriptions were checked at each selected HTTPS origin; DNS alone was not treated as evidence of publication intent.

| Public destination | Decision | Reason |
| --- | --- | --- |
| `same.moesegfault.dev` | Show | Owner confirmed; live landing page describes exact local-file deduplication. |
| `scrap.moesegfault.dev` | Show | Owner confirmed; live landing page describes local-first secrets and field storage. |
| `xmlsquish.moesegfault.dev` | Show | Owner confirmed; live landing page describes multi-file XML prompt project management. |
| `style.moesegfault.dev` | Show | Owner confirmed; live design-system page. It was observed through public DNS/HTTPS but not in the supplied zone export, so the export alone is not a complete Worker-domain inventory. |
| `promptr.moesegfault.dev` | Do not show | Owner identified this as a retired project despite its live DNS/page. |

`status` and `bot` were explicitly excluded from the **new platform inventory** for this task. The existing `bot` contact card remains unchanged; no `status` card was added. Account/authentication, API, avatar, mail, and staging records are infrastructure, not visitor-facing platforms, and are not promoted merely because a DNS name exists.

The implementation keeps the existing contact channels and the confirmed platforms in separate lists in `src/data/contacts.ts`. Both language versions render the same links with localized descriptions. Before adding a future hostname, re-check live behavior and ask the owner whether it is intended for public discovery; a valid DNS record or certificate is insufficient.
