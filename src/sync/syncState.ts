import { TFile, Vault } from "obsidian";
import { parseFrontmatter } from "../utils/frontmatter";
import type { ConfluenceFrontmatter } from "../types";

/**
 * Read confluence frontmatter fields from a vault file.
 */
export async function readConfluenceState(
	vault: Vault,
	file: TFile,
): Promise<ConfluenceFrontmatter | null> {
	const content = await vault.read(file);
	const { fm } = parseFrontmatter(content);

	if (!fm["confluence-id"]) {
		return null;
	}

	return {
		"confluence-id": String(fm["confluence-id"]),
		"confluence-space": String(fm["confluence-space"] || ""),
		"confluence-version": Number(fm["confluence-version"] || 0),
		"confluence-title": String(fm["confluence-title"] || ""),
		"confluence-url": String(fm["confluence-url"] || ""),
		"confluence-last-pull": String(fm["confluence-last-pull"] || ""),
		"confluence-author": String(fm["confluence-author"] || ""),
	};
}

/**
 * Find all files in a folder that have confluence-id in frontmatter.
 */
export function findSyncedFiles(vault: Vault, syncFolder: string): TFile[] {
	return vault.getMarkdownFiles().filter((f) =>
		f.path.startsWith(syncFolder + "/"),
	);
}

/**
 * Find a file by confluence-id within the sync folder.
 */
export async function findFileByConfluenceId(
	vault: Vault,
	syncFolder: string,
	confluenceId: string,
): Promise<TFile | null> {
	const candidates = findSyncedFiles(vault, syncFolder);
	for (const file of candidates) {
		const state = await readConfluenceState(vault, file);
		if (state && state["confluence-id"] === confluenceId) {
			return file;
		}
	}
	return null;
}
