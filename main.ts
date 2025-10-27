import { Editor, Plugin } from "obsidian";
import { Line } from "@Line";

export default class HeadingHandler extends Plugin {
	async onload() {
		this.addCommand({
			id: "smart-promote-heading",
			name: "Smart Promote Heading",
			editorCallback: (editor: Editor) => {
				if (!editor.somethingSelected()) {
					// SINGLE LINE
					const l = Line.atCursor(editor);
					l.promoteHeading();
				} else {
					// MULTIPLE LINES
					Line.iterateOverSelectedLines(editor, (l: Line) => {
						l.promoteHeading();
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
					if (l.heading - 1 < l.getMinimumHeading()) {
						l.setHeading(0);
					} else {
						l.demoteHeading();
					}
				} else {
					// MULTIPLE LINES
					Line.iterateOverSelectedLines(editor, (l: Line) => {
						if (!l.heading) return;
						l.demoteHeading();
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
}
