import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type ConfluenceSyncPlugin from "./main";
import type { ConfluenceSyncSettings } from "./types";

export class ConfluenceSyncSettingTab extends PluginSettingTab {
	plugin: ConfluenceSyncPlugin;

	constructor(app: App, plugin: ConfluenceSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Confluence Reader Settings" });

		new Setting(containerEl)
			.setName("Confluence Base URL")
			.setDesc("Base URL of your Confluence instance (e.g., https://confluence.example.com)")
			.addText((text) =>
				text
					.setPlaceholder("https://confluence.example.com")
					.setValue(this.plugin.settings.baseUrl)
					.onChange(async (value) => {
						this.plugin.settings.baseUrl = value.replace(/\/+$/, "");
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Personal Access Token")
			.setDesc("Confluence Personal Access Token for authentication")
			.addText((text) => {
				text.inputEl.type = "password";
				text
					.setPlaceholder("Enter your PAT")
					.setValue(this.plugin.settings.pat)
					.onChange(async (value) => {
						this.plugin.settings.pat = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Test Connection")
			.setDesc("Verify connection to Confluence server")
			.addButton((btn) =>
				btn.setButtonText("Test").onClick(async () => {
					btn.setDisabled(true);
					btn.setButtonText("Testing...");
					try {
						const result = await this.plugin.client.testConnection();
						const count = result.results.length;
						const total = result.size;
						new Notice(`Connected! Found ${total} space(s).`);
					} catch (e: unknown) {
						const msg = e instanceof Error ? e.message : String(e);
						new Notice(`Connection failed: ${msg}`);
					} finally {
						btn.setDisabled(false);
						btn.setButtonText("Test");
					}
				}),
			);

		new Setting(containerEl)
			.setName("Skip SSL verification")
			.setDesc("Disable TLS certificate verification (for self-signed certificates). Requires restart.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.skipSsl).onChange(async (value) => {
					this.plugin.settings.skipSsl = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Default Space Key")
			.setDesc("Default Confluence space key (e.g., DEV, HR, ENG)")
			.addText((text) =>
				text
					.setPlaceholder("MYSPACE")
					.setValue(this.plugin.settings.defaultSpaceKey)
					.onChange(async (value) => {
						this.plugin.settings.defaultSpaceKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Sync Folder Path")
			.setDesc("Folder in vault where Confluence pages will be stored")
			.addText((text) =>
				text
					.setPlaceholder("confluence-pages")
					.setValue(this.plugin.settings.syncFolder)
					.onChange(async (value) => {
						this.plugin.settings.syncFolder = value.replace(/\/+$/, "");
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Pull attachments")
			.setDesc("Download page attachments when pulling pages")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.pullAttachments).onChange(async (value) => {
					this.plugin.settings.pullAttachments = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
