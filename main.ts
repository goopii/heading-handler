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
	HeadingHandlerSettings,
	DEFAULT_SETTINGS,
	HeadingHandlerSettingTab,
} from "@settings";
import { Line } from "@Line";

export default class HeadingHandler extends Plugin {
	settings: HeadingHandlerSettings;

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: "debug-command",
			name: "Command for testing purposes during development",
			editorCallback: (editor: Editor) => {
				console.log("---debug-command---");
				Line.iterateOverSelectedLines(editor, (l: Line) => {
					console.log(l);
				});
			},
		});
		this.addCommand({
			id: "smart-promote-heading",
			name: "Smart Promote Heading",
			editorCallback: (editor: Editor) => {
				if (!editor.somethingSelected()) {
					// SINGLE LINE
					const l = Line.atCursor(editor);
					l.setParentLine(editor);
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
			repeatable: true,
		});
		this.addCommand({
			id: "smart-demote-heading",
			name: "Smart Demote Heading",
			editorCallback: (editor: Editor) => {
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
					});
				}
				Line.applyUpdates(editor);
			},
			repeatable: true,
		});
		this.addCommand({
			id: "increase-heading-at-current-line",
			name: "Increase Heading at Current Line",
			editorCallback: (editor: Editor) => {
				const l = Line.atCursor(editor);
				l.increaseHeading();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "decrease-heading-at-current-line",
			name: "Decrease Heading at Current Line",
			editorCallback: (editor: Editor) => {
				const l = Line.atCursor(editor);
				l.decreaseHeading();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "convert-indent-to-heading",
			name: "Convert indentation to heading level",
			editorCallback: (editor: Editor) => {
				const l = Line.atCursor(editor);
				l.convertIndentToHeading();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "set-heading-indent",
			name: "Set heading level to indentation level",
			editorCallback: (editor: Editor) => {
				const l = Line.atCursor(editor);
				l.setHeadingToIndent();
				Line.applyUpdates(editor);
			},
		});
		this.addCommand({
			id: "remove-heading",
			name: "Remove heading",
			editorCallback: (editor: Editor) => {
				const l = Line.atCursor(editor);
				l.removeHeading();
				Line.applyUpdates(editor);
			},
		});
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
