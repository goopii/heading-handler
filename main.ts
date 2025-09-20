import { App, Editor, MarkdownView, Modal, Notice, Plugin } from "obsidian";
import { increaseHeading, decreaseHeading } from "@/heading";
import {
	MyPluginSettings,
	DEFAULT_SETTINGS,
	SampleSettingTab,
} from "@/settings";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "increase-heading-at-current-line",
			name: "Increase Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				increaseHeading(editor);
			},
			hotkeys: [{ modifiers: ["Alt"], key: "w" }],
		});
		this.addCommand({
			id: "decrease-heading-at-current-line",
			name: "Decrease Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				decreaseHeading(editor);
			},
			hotkeys: [{ modifiers: ["Alt"], key: "s" }],
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
