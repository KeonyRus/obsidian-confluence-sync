# Obsidian Confluence Reader

Read-only sync of **Confluence Server** pages into your Obsidian vault as Markdown.

## Features

- **Pull single page** — by URL, page ID, or title
- **Pull page tree** — recursively pull a page and all its children
- **Re-pull** — update previously synced pages when Confluence content changes
- **Confluence → Markdown** conversion with support for:
  - Code blocks (with language)
  - Info/Warning/Note/Tip macros → Obsidian callouts (`> [!info]`)
  - Page links → `[[wikilinks]]`
  - Images and attachments
  - Expand macros → `<details>` blocks
  - Table of Contents → `[TOC]`
  - Status badges, panels, emoticons
- **Version tracking** — skips pages that haven't changed
- **Frontmatter mapping** — each synced file has `confluence-*` YAML fields
- **Attachment download** (optional)

## Setup

1. Install the plugin (BRAT or manual)
2. Go to **Settings → Confluence Reader**
3. Enter your Confluence Base URL (e.g., `https://confluence.example.com`)
4. Enter your Personal Access Token (PAT)
5. Click **Test Connection**
6. Set the sync folder (default: `70-docs/confluence-rnd`)

### SSL

For self-signed certificates, enable **Skip SSL verification** in settings (requires Obsidian restart).

## Commands

| Command | Description |
|---------|-------------|
| `Confluence: Pull page` | Pull a single page by URL/ID/title |
| `Confluence: Pull page tree` | Recursively pull page and all children |
| `Confluence: Re-pull current file` | Update the current file from Confluence |
| `Confluence: Re-pull all synced files` | Update all previously synced files |
| `Confluence: Browse spaces` | List available Confluence spaces |

A ribbon icon (cloud download) opens the Pull page modal.

## Frontmatter

Each synced file gets YAML frontmatter:

```yaml
---
confluence-id: "12345678"
confluence-space: "RND"
confluence-version: 5
confluence-title: "Page Title"
confluence-url: "https://confluence.example.com/pages/viewpage.action?pageId=12345678"
confluence-last-pull: "2026-03-02T10:00:00.000Z"
confluence-author: "John Doe"
---
```

## File Structure

Pages with children create a folder hierarchy:

```
sync-folder/
  Root Page/
    Root Page.md
    Child A.md
    Child B/
      Child B.md
      Grandchild.md
```

## Development

```bash
npm install
npm run dev      # watch mode
npm run build    # production build
npm run typecheck # TypeScript check
```

## Compatibility

- Confluence **Server / Data Center** (REST API v1)
- Authentication: Personal Access Token (Bearer)
- Obsidian **1.5.0+**, desktop only

## License

[MIT](LICENSE)
