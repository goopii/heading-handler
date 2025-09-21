import { Editor } from "obsidian";

const REGEX_LIST = /^(\s*)(?:-\s+\[[ xX]\]|[-*+](?!\s*\[)|\d+\.)(?:\s|$)/;
const REGEX_BULLET = /^(?:\s*)-(?!\s*\[)/;
const REGEX_HEADING = /^(#+)\s*/;

export class Line {
	INDENT_CHAR = "\t";
	HEADING_CHAR = "#";

	row: number;

	indent: number;
	prefix: string;
	heading: number;
	text: string;

	constructor(editor: Editor, lineRow: number) {
		this.row = lineRow;
		const lineContent = editor.getLine(lineRow);

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

	public update(
		editor: Editor,
		newContent: string,
		moveCursorToEnd: boolean = true
	) {
		editor.setLine(this.row, newContent);
		if (moveCursorToEnd) {
			editor.setCursor({
				ch: newContent.length,
				line: this.row,
			});
		}
	}

	public decreaseHeading(editor: Editor): void {
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
		this.update(editor, newContent);
	}
	public increaseHeading(editor: Editor): void {
		if (this.heading >= 6) return;
		if (REGEX_BULLET.test(this.prefix) || this.prefix === "") {
			const newContent =
				this.INDENT_CHAR.repeat(this.indent) +
				this.prefix +
				this.HEADING_CHAR.repeat(this.heading + 1) +
				" " +
				this.text;

			this.update(editor, newContent);
		}
	}
	public convertIndentToHeading(editor: Editor): void {
		const newContent =
			this.HEADING_CHAR.repeat(this.indent + 1) + " " + this.text;

		this.update(editor, newContent);
	}
	public setHeadingToIndent(editor: Editor): void {
		const newContent =
			this.INDENT_CHAR.repeat(this.indent) +
			this.prefix +
			this.HEADING_CHAR.repeat(this.indent + 1) +
			" " +
			this.text;

		this.update(editor, newContent);
	}
	public removeHeading(editor: Editor): void {
		const newContent =
			this.INDENT_CHAR.repeat(this.indent) + this.prefix + this.text;

		this.update(editor, newContent);
	}
}
