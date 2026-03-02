/**
 * Sanitize a string to be used as a filename.
 * Removes/replaces characters that are invalid in file paths.
 */
export function sanitizeFilename(name: string): string {
	const sanitized = name
		.replace(/[\0]/g, "")
		.replace(/[\\/:*?"<>|]/g, "_")
		.replace(/^\.+/, "_")
		.replace(/\s+/g, " ")
		.trim();
	return sanitized || "unnamed";
}

/**
 * Build the file path for a pulled Confluence page.
 *
 * @param syncFolder - Base sync folder (e.g., "confluence-pages")
 * @param ancestors - Array of ancestor page titles (from root to parent)
 * @param title - The page title
 * @param hasChildren - Whether this page has children (determines folder creation)
 */
export function buildFilePath(
	syncFolder: string,
	ancestors: string[],
	title: string,
	hasChildren: boolean,
): string {
	const parts = [syncFolder];
	for (const ancestor of ancestors) {
		parts.push(sanitizeFilename(ancestor));
	}

	const safeName = sanitizeFilename(title);

	if (hasChildren) {
		// Page with children → create folder, file inside it
		parts.push(safeName);
		parts.push(safeName + ".md");
	} else {
		// Leaf page → just a file
		parts.push(safeName + ".md");
	}

	return parts.join("/");
}

/**
 * Build the folder path for a page's attachments.
 */
export function buildAttachmentFolder(
	syncFolder: string,
	ancestors: string[],
	title: string,
): string {
	const parts = [syncFolder];
	for (const ancestor of ancestors) {
		parts.push(sanitizeFilename(ancestor));
	}
	parts.push(sanitizeFilename(title));
	parts.push("_attachments");
	return parts.join("/");
}

/**
 * Normalize a folder path to not have trailing slash.
 */
export function normalizeFolderPath(path: string): string {
	return path.replace(/\/+$/, "");
}
