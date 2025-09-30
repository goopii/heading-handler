import { Editor, EditorChange, EditorSelection } from "obsidian";

const REGEX_LIST = /^(\s*)(?:-\s+\[[ xX]\]|[-*+](?!\s*\[)|\d+\.)(?:\s|$)/;
const REGEX_BULLET = /^(?:\s*)-(?!\s*\[)/;
const REGEX_HEADING = /^(#+)\s*/;

export class Line {
	INDENT_CHAR = "\t";
	HEADING_CHAR = "#";

	private static editor: Editor | undefined;
	private static updateQueue: Map<Line, string> = new Map();

	row: number;
	contentLength: number;

	indent: number;
	prefix: string;
	heading: number;
	text: string;

	constructor(editor: Editor, lineRow: number) {
		if (Line.editor !== editor) {
			Line.editor = editor;
			Line.updateQueue.clear();
		}
		this.row = lineRow;
		const lineContent = editor.getLine(lineRow);
		this.contentLength = lineContent.length;

		const match = lineContent.match(REGEX_LIST);
		const prefix = match ? match[0].slice(match[1].length) : ""; // Remove indentation from prefix
		let text = lineContent.replace(REGEX_LIST, "");

		// Extract indentation (tabs) from the original match
		const indent = match ? (match[1].match(/\t/g) || []).length : 0;

		// Extract heading level from text
		const headingMatch = text.match(REGEX_HEADING);
		const heading = headingMatch ? headingMatch[1].length : 0;

		// Remove heading from text if present
		if (headingMatch) {
			text = text.replace(REGEX_HEADING, "");
		}

		// console.log(`indent: '${indent}'`);
		// console.log(`prefix: '${prefix}'`);
		// console.log(`heading: '${heading}'`);
		// console.log(`text: '${text}'`);
		this.indent = indent;
		this.prefix = prefix;
		this.heading = heading;
		this.text = text;
	}

	public static iterateOverSelectedLines(
		editor: Editor,
		callbackfn: (line: Line) => void
	): void {
		if (!editor.somethingSelected()) return;
		const selections: EditorSelection[] = editor.listSelections();

		selections.forEach((s) => {
			for (
				let lineRow = Math.min(s.head.line, s.anchor.line);
				lineRow < Math.max(s.head.line, s.anchor.line) + 1;
				lineRow++
			) {
				callbackfn(new Line(editor, lineRow));
			}
		});
	}

	public static applyUpdates(): void {
		const ed = Line.editor;
		if (!ed) return;
		if (Line.updateQueue.size === 0) return;

		const updatedLines: EditorChange[] = [];

		Line.updateQueue.forEach(
			(newContent: string, l: Line, map: Map<Line, string>) => {
				const change: EditorChange = {
					from: { ch: 0, line: l.row },
					text: newContent,
					to: { ch: l.contentLength, line: l.row },
				};
				updatedLines.push(change);
				if (Line.updateQueue.size === 1) {
					if (l.contentLength > newContent.length) {
						ed.setCursor({
							ch: newContent.length + 1,
							line: l.row,
						});
					} else {
						ed.setCursor({
							ch: newContent.length - 1,
							line: l.row,
						});
					}
				}
			}
		);
		ed.transaction({
			changes: updatedLines,
		});

		Line.updateQueue.clear();
	}

	public stageUpdate(newContent: string) {
		const ed = Line.editor;
		if (!ed) return;
		Line.updateQueue.set(this, newContent);
		return;
		// if (defer) {
		// }

		// ed.setLine(this.row, newContent);
		// ed.setCursor({
		// 	ch: newContent.length,
		// 	line: this.row,
		// });
	}

	public decreaseHeading(): void {
		if (this.heading <= 0) return;
		let newContent = "";
		if (this.heading >= 2) {
			newContent =
				this.INDENT_CHAR.repeat(this.indent) +
				this.prefix +
				this.HEADING_CHAR.repeat(this.heading - 1) +
				" " +
				this.text;
		} else {
			newContent =
				this.INDENT_CHAR.repeat(this.indent) +
				this.prefix +
				this.HEADING_CHAR.repeat(this.heading - 1) +
				this.text;
		}
		this.stageUpdate(newContent);
	}
	public increaseHeading(): void {
		if (this.heading >= 6) return;
		if (REGEX_BULLET.test(this.prefix) || this.prefix === "") {
			const newContent =
				this.INDENT_CHAR.repeat(this.indent) +
				this.prefix +
				this.HEADING_CHAR.repeat(this.heading + 1) +
				" " +
				this.text;

			this.stageUpdate(newContent);
		}
	}
	public convertIndentToHeading(defer: boolean = false): void {
		const newContent =
			this.HEADING_CHAR.repeat(this.indent + 1) + " " + this.text;

		this.stageUpdate(newContent);
	}
	public setHeadingToIndent(defer: boolean = false): void {
		const newContent =
			this.INDENT_CHAR.repeat(this.indent) +
			this.prefix +
			this.HEADING_CHAR.repeat(this.indent + 1) +
			" " +
			this.text;

		this.stageUpdate(newContent);
	}
	public removeHeading(defer: boolean = false): void {
		const newContent =
			this.INDENT_CHAR.repeat(this.indent) + this.prefix + this.text;

		this.stageUpdate(newContent);
	}
}
