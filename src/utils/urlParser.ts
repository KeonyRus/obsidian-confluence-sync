export interface ParsedConfluenceUrl {
	pageId?: string;
	spaceKey?: string;
	title?: string;
}

/**
 * Parses a Confluence URL and extracts pageId, spaceKey, and/or title.
 *
 * Supported formats:
 * - /pages/viewpage.action?pageId=12345
 * - /display/SPACE/Page+Title
 * - /spaces/SPACE/pages/12345/Page+Title
 * - Raw page ID (numeric string)
 */
export function parseConfluenceUrl(input: string): ParsedConfluenceUrl {
	const trimmed = input.trim();

	// Raw numeric page ID
	if (/^\d+$/.test(trimmed)) {
		return { pageId: trimmed };
	}

	try {
		const url = new URL(trimmed);

		// /pages/viewpage.action?pageId=12345
		if (url.pathname.includes("/viewpage.action")) {
			const pageId = url.searchParams.get("pageId");
			if (pageId) {
				return { pageId };
			}
		}

		// /spaces/SPACE/pages/12345/Page+Title
		const spacesMatch = url.pathname.match(/\/spaces\/([^/]+)\/pages\/(\d+)/);
		if (spacesMatch) {
			return {
				spaceKey: decodeURIComponent(spacesMatch[1]),
				pageId: spacesMatch[2],
			};
		}

		// /display/SPACE/Page+Title
		const displayMatch = url.pathname.match(/\/display\/([^/]+)\/(.+)/);
		if (displayMatch) {
			return {
				spaceKey: decodeURIComponent(displayMatch[1]),
				title: decodeURIComponent(displayMatch[2].replace(/\+/g, " ")),
			};
		}

		// /pages/viewpage.action without pageId but with title param
		if (url.pathname.includes("/viewpage.action")) {
			const title = url.searchParams.get("title");
			const spaceKey = url.searchParams.get("spaceKey");
			if (title || spaceKey) {
				return {
					...(spaceKey ? { spaceKey } : {}),
					...(title ? { title: decodeURIComponent(title) } : {}),
				};
			}
		}
	} catch {
		// Not a valid URL — treat as title search
	}

	// Fallback: treat as title
	return { title: trimmed };
}
