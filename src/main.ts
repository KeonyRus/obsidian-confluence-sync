import { Plugin, Notice, TFile } from "obsidian";
import type { ConfluenceSyncSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { ConfluenceSyncSettingTab } from "./settings";
import { ConfluenceClient } from "./api/confluenceClient";
import { PullEngine } from "./sync/pullEngine";
import { PullModal } from "./ui/pullModal";
import { StatusBarManager } from "./ui/statusBar";

export default class ConfluenceSyncPlugin extends Plugin {
	settings: ConfluenceSyncSettings = DEFAULT_SETTINGS;
	client!: ConfluenceClient;
	pullEngine!: PullEngine;
	private statusBar!: StatusBarManager;
	private originalTlsReject: string | undefined;

	async onload(): Promise<void> {
		await this.loadSettings();

		// SSL bypass for self-signed certs
		if (this.settings.skipSsl) {
			this.originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		}

		this.client = new ConfluenceClient(this.settings);
		this.pullEngine = new PullEngine(this.client, this.app.vault, this.settings);

		// Status bar
		const statusBarEl = this.addStatusBarItem();
		this.statusBar = new StatusBarManager(statusBarEl);
		this.statusBar.startAutoUpdate();

		// Settings tab
		this.addSettingTab(new ConfluenceSyncSettingTab(this.app, this));

		// Commands
		this.addCommand({
			id: "pull-page",
			name: "Pull page",
			callback: () => {
				new PullModal(this.app, this.pullEngine, "page").open();
			},
		});

		this.addCommand({
			id: "pull-page-tree",
			name: "Pull page tree",
			callback: () => {
				new PullModal(this.app, this.pullEngine, "tree").open();
			},
		});

		this.addCommand({
			id: "re-pull-current",
			name: "Re-pull current file",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || !file.path.startsWith(this.settings.syncFolder + "/")) {
					return false;
				}
				if (checking) return true;
				void this.rePullCurrentFile(file);
				return true;
			},
		});

		this.addCommand({
			id: "re-pull-all",
			name: "Re-pull all synced files",
			callback: () => { void this.rePullAll(); },
		});

		this.addCommand({
			id: "browse-spaces",
			name: "Browse spaces",
			callback: () => { void this.browseSpaces(); },
		});

		// Ribbon icon
		this.addRibbonIcon("cloud-download", "Confluence: pull page", () => {
			new PullModal(this.app, this.pullEngine, "page").open();
		});
	}

	onunload(): void {
		this.statusBar.stopAutoUpdate();

		// Restore original TLS setting
		if (this.originalTlsReject !== undefined) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = this.originalTlsReject;
		} else if (this.settings.skipSsl) {
			delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.client?.updateSettings(this.settings);
		this.pullEngine?.updateSettings(this.settings);
	}

	private async rePullCurrentFile(file: TFile): Promise<void> {
		try {
			new Notice("Re-pulling from Confluence...");
			const status = await this.pullEngine.rePullFile(file);
			switch (status) {
				case "updated":
					new Notice("File updated from Confluence.");
					this.statusBar.setLastPullTime(new Date());
					break;
				case "skipped":
					new Notice("File is already up to date.");
					break;
				case "not-synced":
					new Notice("This file is not synced from Confluence.");
					break;
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			new Notice(`Re-pull failed: ${msg}`);
		}
	}

	private async rePullAll(): Promise<void> {
		try {
			new Notice("Re-pulling all synced files...");
			const result = await this.pullEngine.rePullAll(
				(msg) => new Notice(msg),
			);
			const summary = [
				`Re-pull complete.`,
				result.updated > 0 ? `Updated: ${result.updated}` : null,
				result.skipped > 0 ? `Up to date: ${result.skipped}` : null,
				result.errors.length > 0 ? `Errors: ${result.errors.length}` : null,
			]
				.filter(Boolean)
				.join(", ");
			new Notice(summary);
			this.statusBar.setLastPullTime(new Date());

			if (result.errors.length > 0) {
				console.error("Confluence re-pull errors:", result.errors);
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			new Notice(`Re-pull failed: ${msg}`);
		}
	}

	private async browseSpaces(): Promise<void> {
		try {
			new Notice("Fetching spaces...");
			const result = await this.client.getSpaces();
			const spaces = result.results;
			if (spaces.length === 0) {
				new Notice("No spaces found.");
				return;
			}
			const list = spaces.map((s) => `${s.key}: ${s.name}`).join("\n");
			new Notice(`Spaces:\n${list}`, 10000);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			new Notice(`Failed to fetch spaces: ${msg}`);
		}
	}
}
