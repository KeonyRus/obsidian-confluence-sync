import type { ConfluencePageRef, ConfluenceSpace, ConfluenceAttachment } from "../types";
import type { ConfluenceClient } from "./confluenceClient";

export async function fetchAllChildren(
	client: ConfluenceClient,
	pageId: string,
): Promise<ConfluencePageRef[]> {
	const all: ConfluencePageRef[] = [];
	let start = 0;
	const limit = 100;

	while (true) {
		const result = await client.getPageChildren(pageId, start, limit);
		all.push(...result.results);
		if (result.size < limit || !result._links.next) {
			break;
		}
		start += limit;
	}
	return all;
}

export async function fetchAllSpaces(
	client: ConfluenceClient,
): Promise<ConfluenceSpace[]> {
	const all: ConfluenceSpace[] = [];
	let start = 0;
	const limit = 100;

	while (true) {
		const result = await client.getSpaces(start, limit);
		all.push(...result.results);
		if (result.size < limit || !result._links.next) {
			break;
		}
		start += limit;
	}
	return all;
}

export async function fetchAllAttachments(
	client: ConfluenceClient,
	pageId: string,
): Promise<ConfluenceAttachment[]> {
	const all: ConfluenceAttachment[] = [];
	let start = 0;
	const limit = 100;

	while (true) {
		const result = await client.getPageAttachments(pageId, start, limit);
		all.push(...result.results);
		if (result.size < limit || !result._links.next) {
			break;
		}
		start += limit;
	}
	return all;
}
