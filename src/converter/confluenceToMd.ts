import TurndownService from "turndown";

type TNode = TurndownService.Node;

// Convert Confluence Storage Format HTML to Markdown.
// Handles ac:/ri: namespace prefixes, code macros, links, images, callouts, TOC, unknown macros.
export function confluenceToMarkdown(storageFormat: string, baseUrl: string): string {
	// Replace namespace colons with dashes so DOMParser can handle them
	const sanitized = storageFormat
		.replace(/<(\/?)ac:/g, "<$1ac-")
		.replace(/<(\/?)ri:/g, "<$1ri-");

	const turndown = createTurndownService(baseUrl);
	const markdown = turndown.turndown(sanitized);

	// Clean up excessive blank lines
	return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

function createTurndownService(baseUrl: string): TurndownService {
	const td = new TurndownService({
		headingStyle: "atx",
		codeBlockStyle: "fenced",
		bulletListMarker: "-",
		emDelimiter: "*",
	});

	// --- Code macro -> fenced code block ---
	td.addRule("confluenceCodeMacro", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-structured-macro") &&
				(node as HTMLElement).getAttribute("ac-name") === "code";
		},
		replacement(_content: string, node: TNode): string {
			const el = node as HTMLElement;
			const lang = getParamValue(el, "language") || "";
			const bodyEl = el.querySelector("ac-plain-text-body");
			const code = bodyEl?.textContent || "";
			return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
		},
	});

	// --- Info/Note/Warning/Tip macros -> Obsidian callouts ---
	const calloutTypes = ["info", "note", "warning", "tip"];
	td.addRule("confluenceCalloutMacros", {
		filter(node: TNode): boolean {
			if (!isTag(node, "ac-structured-macro")) return false;
			const name = (node as HTMLElement).getAttribute("ac-name") || "";
			return calloutTypes.includes(name);
		},
		replacement(content: string, node: TNode): string {
			const el = node as HTMLElement;
			const macroName = el.getAttribute("ac-name") || "info";
			const calloutType = macroName === "warning" ? "warning" : macroName;
			const title = getParamValue(el, "title") || "";
			const bodyEl = el.querySelector("ac-rich-text-body");
			const bodyContent = bodyEl ? td.turndown(bodyEl.innerHTML) : content;

			const lines = bodyContent.split("\n").map((l: string) => `> ${l}`);
			const header = title
				? `> [!${calloutType}] ${title}`
				: `> [!${calloutType}]`;
			return `\n${header}\n${lines.join("\n")}\n`;
		},
	});

	// --- Table of Contents macro -> [TOC] ---
	td.addRule("confluenceToc", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-structured-macro") &&
				(node as HTMLElement).getAttribute("ac-name") === "toc";
		},
		replacement(): string {
			return "\n[TOC]\n";
		},
	});

	// --- Expand macro -> details/summary ---
	td.addRule("confluenceExpand", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-structured-macro") &&
				(node as HTMLElement).getAttribute("ac-name") === "expand";
		},
		replacement(content: string, node: TNode): string {
			const el = node as HTMLElement;
			const title = getParamValue(el, "title") || "Click to expand";
			const bodyEl = el.querySelector("ac-rich-text-body");
			const bodyContent = bodyEl ? td.turndown(bodyEl.innerHTML) : content;
			return `\n<details>\n<summary>${title}</summary>\n\n${bodyContent}\n\n</details>\n`;
		},
	});

	// --- ac-link -> wikilink or markdown link ---
	td.addRule("confluenceLink", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-link");
		},
		replacement(_content: string, node: TNode): string {
			const el = node as HTMLElement;
			const pageRef = el.querySelector("ri-page");
			const attachmentRef = el.querySelector("ri-attachment");
			const linkBody = el.querySelector("ac-link-body, ac-plain-text-link-body");
			const linkText = linkBody?.textContent || "";

			if (pageRef) {
				const pageTitle = pageRef.getAttribute("ri-content-title") || "";
				if (linkText && linkText !== pageTitle) {
					return `[[${pageTitle}|${linkText}]]`;
				}
				return `[[${pageTitle}]]`;
			}

			if (attachmentRef) {
				const filename = attachmentRef.getAttribute("ri-filename") || "";
				return `[[${filename}]]`;
			}

			// URL link
			const anchor = el.getAttribute("ac-anchor") || "";
			if (anchor) {
				return linkText ? `[${linkText}](#${anchor})` : `[#${anchor}](#${anchor})`;
			}

			return linkText || "";
		},
	});

	// --- ac-image -> image embed ---
	td.addRule("confluenceImage", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-image");
		},
		replacement(_content: string, node: TNode): string {
			const el = node as HTMLElement;
			const attachmentRef = el.querySelector("ri-attachment");
			const urlRef = el.querySelector("ri-url");
			const alt = el.getAttribute("ac-alt") || "";

			if (urlRef) {
				const url = urlRef.getAttribute("ri-value") || "";
				return `![${alt}](${url})`;
			}

			if (attachmentRef) {
				const filename = attachmentRef.getAttribute("ri-filename") || "";
				return `![[${filename}]]`;
			}

			return `![${alt}]()`;
		},
	});

	// --- Emoticon macro ---
	td.addRule("confluenceEmoticon", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-emoticon");
		},
		replacement(_content: string, node: TNode): string {
			const el = node as HTMLElement;
			const name = el.getAttribute("ac-name") || "";
			const emojiMap: Record<string, string> = {
				smile: ":)",
				sad: ":(",
				"thumbs-up": ":+1:",
				"thumbs-down": ":-1:",
				warning: "!",
				tick: "v",
				cross: "x",
				information: "i",
				question: "?",
			};
			return emojiMap[name] || `:${name}:`;
		},
	});

	// --- Status macro -> badge-like text ---
	td.addRule("confluenceStatus", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-structured-macro") &&
				(node as HTMLElement).getAttribute("ac-name") === "status";
		},
		replacement(_content: string, node: TNode): string {
			const el = node as HTMLElement;
			const title = getParamValue(el, "title") || "STATUS";
			return `**[${title}]**`;
		},
	});

	// --- Panel macro -> blockquote ---
	td.addRule("confluencePanel", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-structured-macro") &&
				(node as HTMLElement).getAttribute("ac-name") === "panel";
		},
		replacement(content: string, node: TNode): string {
			const el = node as HTMLElement;
			const bodyEl = el.querySelector("ac-rich-text-body");
			const bodyContent = bodyEl ? td.turndown(bodyEl.innerHTML) : content;
			const lines = bodyContent.split("\n").map((l: string) => `> ${l}`);
			return `\n${lines.join("\n")}\n`;
		},
	});

	// --- Catch-all: unknown ac-structured-macro -> HTML comment ---
	td.addRule("confluenceUnknownMacro", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-structured-macro");
		},
		replacement(content: string, node: TNode): string {
			const el = node as HTMLElement;
			const name = el.getAttribute("ac-name") || "unknown";
			const bodyEl = el.querySelector("ac-rich-text-body");
			const bodyContent = bodyEl ? td.turndown(bodyEl.innerHTML) : content;
			if (bodyContent.trim()) {
				return `\n<!-- confluence:${name} -->\n${bodyContent}\n<!-- /confluence:${name} -->\n`;
			}
			return `\n<!-- confluence:${name} -->\n`;
		},
	});

	// --- Remove ri-* elements that leak through ---
	td.addRule("removeRiElements", {
		filter(node: TNode): boolean {
			const tag = node.nodeName.toLowerCase();
			return tag.startsWith("ri-");
		},
		replacement(): string {
			return "";
		},
	});

	// --- Remove ac-parameter elements ---
	td.addRule("removeAcParameter", {
		filter(node: TNode): boolean {
			return isTag(node, "ac-parameter");
		},
		replacement(): string {
			return "";
		},
	});

	return td;
}

function isTag(node: TNode, tagName: string): boolean {
	return node.nodeName.toLowerCase() === tagName;
}

function getParamValue(el: HTMLElement, paramName: string): string | null {
	const param = el.querySelector(`ac-parameter[ac-name="${paramName}"]`);
	return param?.textContent || null;
}
