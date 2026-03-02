const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

/**
 * Parse YAML frontmatter from file content.
 * Returns the frontmatter as a key-value map and the body (everything after frontmatter).
 */
export function parseFrontmatter(content: string): { fm: Record<string, string | number>; body: string } {
	const match = content.match(FRONTMATTER_REGEX);
	if (!match) {
		return { fm: {}, body: content };
	}

	const fmBlock = match[1];
	const body = content.slice(match[0].length);
	const fm: Record<string, string | number> = {};

	for (const line of fmBlock.split("\n")) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		let value: string | number = line.slice(colonIdx + 1).trim();

		// Remove surrounding quotes
		if ((value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		// Try to parse numbers
		if (/^\d+$/.test(String(value))) {
			value = parseInt(String(value), 10);
		}

		fm[key] = value;
	}

	return { fm, body };
}

/**
 * Serialize a frontmatter map back to YAML string (--- delimited).
 * Preserves existing non-confluence fields.
 */
export function serializeFrontmatter(fm: Record<string, string | number>): string {
	const lines: string[] = ["---"];
	for (const [key, value] of Object.entries(fm)) {
		if (typeof value === "number") {
			lines.push(`${key}: ${value}`);
		} else {
			lines.push(`${key}: "${value}"`);
		}
	}
	lines.push("---");
	return lines.join("\n");
}

/**
 * Build a complete file content from frontmatter and body.
 */
export function buildFileContent(fm: Record<string, string | number>, body: string): string {
	return serializeFrontmatter(fm) + "\n" + body;
}

/**
 * Update only confluence-* fields in existing frontmatter, preserving other fields.
 */
export function updateConfluenceFrontmatter(
	existingFm: Record<string, string | number>,
	confluenceData: Record<string, string | number>,
): Record<string, string | number> {
	const merged = { ...existingFm };
	for (const [key, value] of Object.entries(confluenceData)) {
		merged[key] = value;
	}
	return merged;
}
