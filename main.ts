import {
	App,
	Editor,
	EditorSelection,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
} from "obsidian";
import {
	MyPluginSettings,
	DEFAULT_SETTINGS,
	SampleSettingTab,
} from "@settings";
import { Line } from "@Line";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: "debug-command",
			name: "Command for testing purposes during development",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log("---debug-command---");
			},
			hotkeys: [{ modifiers: ["Alt"], key: "x" }],
		});
		this.addCommand({
			id: "increase-heading-smart",
			name: "Increase Heading Smartly",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				Line.iterateOverSelectedLines(editor, (l: Line) => {
					if (!editor.somethingSelected()) {
						if (l.parentHeading) {
							l.setHeading(l.parentHeading);
						} else {
							l.setHeading(l.heading + 1);
						}
					} else if (l.heading && l.parentHeading < l.heading) {
						l.increaseHeading();
					}
				});
				Line.applyUpdates();
			},
			hotkeys: [{ modifiers: ["Alt"], key: "w" }],
		});
		this.addCommand({
			id: "decrease-heading-smart",
			name: "Decrease Heading Smartly",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				Line.iterateOverSelectedLines(editor, (l: Line) => {
					console.log("parent: ", l.parentHeading);
					console.log("line: ", l.heading);
					if (l.parentHeading < l.heading || l.parentHeading === 1) {
						l.decreaseHeading();
					}
				});
				Line.applyUpdates();
			},
			hotkeys: [{ modifiers: ["Alt"], key: "s" }],
		});
		this.addCommand({
			id: "increase-heading-at-current-line",
			name: "Increase Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.newFromCursor(editor);
				l.increaseHeading();
				Line.applyUpdates();
			},
		});
		this.addCommand({
			id: "decrease-heading-at-current-line",
			name: "Decrease Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.newFromCursor(editor);
				l.decreaseHeading();
				Line.applyUpdates();
			},
		});
		this.addCommand({
			id: "convert-indent-to-heading",
			name: "Convert indentation to heading level",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.newFromCursor(editor);
				l.convertIndentToHeading();
				Line.applyUpdates();
			},
		});
		this.addCommand({
			id: "set-heading-indent",
			name: "Set heading level to indentation level",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.newFromCursor(editor);
				l.setHeadingToIndent();
				Line.applyUpdates();
			},
		});
		this.addCommand({
			id: "remove-heading",
			name: "Remove heading",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.newFromCursor(editor);
				l.removeHeading();
				Line.applyUpdates();
			},
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
