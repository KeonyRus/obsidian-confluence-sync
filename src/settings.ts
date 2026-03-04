import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type ConfluenceSyncPlugin from "./main";

export class ConfluenceSyncSettingTab extends PluginSettingTab {
	plugin: ConfluenceSyncPlugin;

	constructor(app: App, plugin: ConfluenceSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Confluence base URL")
			.setDesc("Base URL of your Confluence instance (e.g., https://confluence.example.com)")
			.addText((text) =>
				text
					.setPlaceholder("https://confluence.example.com")
					.setValue(this.plugin.settings.baseUrl)
					.onChange((value) => {
						this.plugin.settings.baseUrl = value.replace(/\/+$/, "");
						void this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Personal access token")
			.setDesc("Confluence personal access token for authentication")
			.addText((text) => {
				text.inputEl.type = "password";
				text
					.setPlaceholder("Enter your token")
					.setValue(this.plugin.settings.pat)
					.onChange((value) => {
						this.plugin.settings.pat = value;
						void this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Test connection")
			.setDesc("Verify connection to server")
			.addButton((btn) =>
				btn.setButtonText("Test").onClick(() => {
					btn.setDisabled(true);
					btn.setButtonText("Testing...");
					void this.plugin.client.testConnection()
						.then((result) => {
							const total = result.size;
							new Notice(`Connected! Found ${total} space(s).`);
						})
						.catch((e: unknown) => {
							const msg = e instanceof Error ? e.message : String(e);
							new Notice(`Connection failed: ${msg}`);
						})
						.finally(() => {
							btn.setDisabled(false);
							btn.setButtonText("Test");
						});
				}),
			);

		new Setting(containerEl)
			.setName("Skip SSL verification")
			.setDesc("Disable TLS certificate verification (for self-signed certificates). Requires restart.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.skipSsl).onChange((value) => {
					this.plugin.settings.skipSsl = value;
					void this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Default space key")
			.setDesc("Space key used when searching by title")
			.addText((text) =>
				text
					.setPlaceholder("MYSPACE")
					.setValue(this.plugin.settings.defaultSpaceKey)
					.onChange((value) => {
						this.plugin.settings.defaultSpaceKey = value;
						void this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Sync folder path")
			.setDesc("Folder in vault where synced pages will be stored")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.syncFolder)
					.onChange((value) => {
						this.plugin.settings.syncFolder = value.replace(/\/+$/, "");
						void this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Pull attachments")
			.setDesc("Download page attachments when pulling pages")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.pullAttachments).onChange((value) => {
					this.plugin.settings.pullAttachments = value;
					void this.plugin.saveSettings();
				}),
			);
	}
}
