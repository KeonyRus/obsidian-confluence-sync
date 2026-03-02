import { requestUrl, RequestUrlParam, RequestUrlResponse } from "obsidian";
import type { ConfluenceSyncSettings, ConfluencePage, ConfluenceSpacesResult, ConfluenceChildrenResult, ConfluenceAttachmentsResult, ConfluenceSearchResult } from "../types";

export class ConfluenceClient {
	private settings: ConfluenceSyncSettings;

	constructor(settings: ConfluenceSyncSettings) {
		this.settings = settings;
	}

	updateSettings(settings: ConfluenceSyncSettings): void {
		this.settings = settings;
	}

	private get apiBase(): string {
		return this.settings.baseUrl.replace(/\/+$/, "") + "/rest/api";
	}

	private async request(path: string, params?: Record<string, string>): Promise<RequestUrlResponse> {
		const url = new URL(path.startsWith("http") ? path : this.apiBase + path);
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.set(key, value);
			}
		}

		const reqParams: RequestUrlParam = {
			url: url.toString(),
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.settings.pat}`,
				"Accept": "application/json",
			},
		};

		return requestUrl(reqParams);
	}

	async testConnection(): Promise<ConfluenceSpacesResult> {
		const resp = await this.request("/space", { limit: "10" });
		return resp.json as ConfluenceSpacesResult;
	}

	async getSpaces(start = 0, limit = 100): Promise<ConfluenceSpacesResult> {
		const resp = await this.request("/space", {
			start: String(start),
			limit: String(limit),
		});
		return resp.json as ConfluenceSpacesResult;
	}

	async getPage(id: string): Promise<ConfluencePage> {
		const resp = await this.request(`/content/${id}`, {
			expand: "body.storage,version,metadata.labels,ancestors",
		});
		return resp.json as ConfluencePage;
	}

	async getPageChildren(id: string, start = 0, limit = 100): Promise<ConfluenceChildrenResult> {
		const resp = await this.request(`/content/${id}/child/page`, {
			start: String(start),
			limit: String(limit),
		});
		return resp.json as ConfluenceChildrenResult;
	}

	async getPageAttachments(id: string, start = 0, limit = 100): Promise<ConfluenceAttachmentsResult> {
		const resp = await this.request(`/content/${id}/child/attachment`, {
			start: String(start),
			limit: String(limit),
		});
		return resp.json as ConfluenceAttachmentsResult;
	}

	async searchByTitle(title: string, spaceKey?: string): Promise<ConfluenceSearchResult> {
		const safeTitle = escapeCql(title);
		let cql = `title="${safeTitle}" AND type=page`;
		if (spaceKey) {
			cql += ` AND space.key="${escapeCql(spaceKey)}"`;
		}
		const resp = await this.request("/content/search", { cql });
		return resp.json as ConfluenceSearchResult;
	}

	async searchByCql(cql: string): Promise<ConfluenceSearchResult> {
		const resp = await this.request("/content/search", { cql });
		return resp.json as ConfluenceSearchResult;
	}

	async downloadAttachment(downloadPath: string): Promise<ArrayBuffer> {
		const url = this.settings.baseUrl.replace(/\/+$/, "") + downloadPath;
		const resp = await requestUrl({
			url,
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.settings.pat}`,
			},
		});
		return resp.arrayBuffer;
	}
}

function escapeCql(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
