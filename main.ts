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
				Line.iterateOverSelectedLines(editor, (l: Line) => {
					console.log(l);
				});
			},
			hotkeys: [{ modifiers: ["Alt"], key: "x" }],
		});
		this.addCommand({
			id: "increase-heading-smart",
			name: "Increase Heading Smartly",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (!editor.somethingSelected()) {
					// SINGLE LINE
					const l = Line.atCursor(editor);
					l.setParentLine(editor);
					// If line has no heading, set heading to parent, adding another heading for each indent below parent
					if (!l.heading && l.parent) {
						const indentCompensation = l.indent - l.parent.indent;
						l.setHeading(l.parent.heading + indentCompensation);
					} else {
						l.increaseHeading();
					}
				} else {
					// MULTIPLE LINES
					Line.iterateOverSelectedLines(editor, (l: Line) => {
						if (l.heading) {
							l.increaseHeading();
						}
					});
				}
				Line.applyUpdates(editor);
			},
			hotkeys: [{ modifiers: ["Alt"], key: "w" }],
		});
		this.addCommand({
			id: "decrease-heading-smart",
			name: "Decrease Heading Smartly",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (!editor.somethingSelected()) {
					// SINGLE LINE
					const l = Line.atCursor(editor);
					if (!l.heading) return;
					l.setParentLine(editor);
					if (l.parent) {
						if (l.heading - 1 < l.parent.heading) {
							l.setHeading(0);
						}
						l.setHeading(l.heading - 1);
					}
				} else {
					// MULTIPLE LINES
					Line.iterateOverSelectedLines(editor, (l: Line) => {
						// console.log(`iterating over '${l.text}':`);
						l.setParentLine(editor);
						if (l.heading && l.parent) {
							const indentCompensation =
								l.indent - l.parent.indent;
							l.setHeading(
								Math.max(
									l.heading - 1,
									l.parent.heading + indentCompensation
								)
							);
						}
						// console.log("----------------------");
					});
				}
				Line.applyUpdates(editor);
			},
			hotkeys: [{ modifiers: ["Alt"], key: "s" }],
		});
		this.addCommand({
			id: "increase-heading-at-current-line",
			name: "Increase Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.atCursor(editor);
				l.increaseHeading();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "decrease-heading-at-current-line",
			name: "Decrease Heading at Current Line",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.atCursor(editor);
				l.decreaseHeading();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "convert-indent-to-heading",
			name: "Convert indentation to heading level",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.atCursor(editor);
				l.convertIndentToHeading();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "set-heading-indent",
			name: "Set heading level to indentation level",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.atCursor(editor);
				l.setHeadingToIndent();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "remove-heading",
			name: "Remove heading",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const l = Line.atCursor(editor);
				l.removeHeading();
				Line.applyUpdates(editor);
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
