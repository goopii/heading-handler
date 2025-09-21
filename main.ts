import { App, Editor, MarkdownView, Modal, Notice, Plugin } from "obsidian";
import { Line } from "@Line";
import {
	MyPluginSettings,
	DEFAULT_SETTINGS,
	SampleSettingTab,
} from "@settings";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "increase-heading-at-current-line",
			name: "Increase Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const lineRow = editor.getCursor().line;
				const l = new Line(editor, lineRow);
				l.increaseHeading(editor);
			},
			hotkeys: [{ modifiers: ["Alt"], key: "w" }],
		});
		this.addCommand({
			id: "decrease-heading-at-current-line",
			name: "Decrease Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const lineRow = editor.getCursor().line;
				const l = new Line(editor, lineRow);
				l.decreaseHeading(editor);
			},
			hotkeys: [{ modifiers: ["Alt"], key: "s" }],
		});
		this.addCommand({
			id: "convert-indent-to-heading",
			name: "Convert indentation to heading level",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const lineRow = editor.getCursor().line;
				const l = new Line(editor, lineRow);
				l.convertIndentToHeading(editor);
			},
			hotkeys: [{ modifiers: ["Alt", "Shift"], key: "q" }],
		});
		this.addCommand({
			id: "set-heading-indent",
			name: "Set heading level to indentation level",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const lineRow = editor.getCursor().line;
				const l = new Line(editor, lineRow);
				l.setHeadingToIndent(editor);
			},
			hotkeys: [{ modifiers: ["Alt", "Shift"], key: "w" }],
		});
		this.addCommand({
			id: "remove heading",
			name: "Remove heading",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const lineRow = editor.getCursor().line;
				const l = new Line(editor, lineRow);
				l.removeHeading(editor);
			},
			hotkeys: [{ modifiers: ["Alt", "Shift"], key: "s" }],
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
