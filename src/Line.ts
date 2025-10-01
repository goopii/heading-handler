import {
	Editor,
	EditorChange,
	EditorSelection,
	EditorPosition,
} from "obsidian";

const REGEX_BULLET = /^(?:\s*)-(?!\s*\[)/;
const REGEX_LIST = /^(\s*)(?:-\s+\[[ xX]\]|[-*+](?!\s*\[)|\d+\.)(?:\s|$)/;
const REGEX_HEADING = /^(#+)\s*/;

export class Line {
	private static INDENT_CHAR = "\t";
	private static HEADING_CHAR = "#";

	private static editor: Editor | undefined;
	private static updateQueue: Map<Line, string> = new Map();

	parentHeading: number;
	row: number;
	contentLength: number;
	isBullet: boolean;

	indent: number;
	prefix: string;
	heading: number;
	text: string;

	constructor(editor: Editor, lineRow: number) {
		if (Line.editor !== editor) {
			Line.editor = editor;
			Line.updateQueue.clear();
		}
		const lineContent = editor.getLine(lineRow);

		const listMatch = lineContent.match(REGEX_LIST);
		const prefix = listMatch ? listMatch[0].slice(listMatch[1].length) : ""; // Remove indentation from prefix

		let isBullet = false;
		if (listMatch) {
			isBullet = REGEX_BULLET.test(prefix);
		}
		let text = lineContent.replace(REGEX_LIST, "");

		// Extract indentation (tabs) from the original match
		const indent = listMatch ? (listMatch[1].match(/\t/g) || []).length : 0;

		// Extract heading level from text
		const headingMatch = text.match(REGEX_HEADING);
		const heading = headingMatch ? headingMatch[1].length : 0;

		// Remove heading from text if present
		if (headingMatch) {
			text = text.replace(REGEX_HEADING, "");
		}

		// Check the parent header
		let parentHeading = 0;
		for (let i = lineRow - 1; i > 0; i--) {
			// const lineAbove =
			// TODO:
			// find a good way to look for a 'parentHeader'
			// aka a line that has LESS hashtags
			// i was going to use this for loop to create and look through line objects but all those objects would run this loop too.
			// I should make better regexes, its a mess right now with all the postprocessing I have to do to extract the indent, prefix, heading and text
		}
		// const range = editor.getRange(
		// 	{ ch: 0, line: 0 },
		// 	{ ch: 0, line: lineRow }
		// );
		// let lines = range.split("\n");
		// const linesFiltered = lines.filter((l) => {
		// 	return l != "";
		// });

		// let parentHeading = 0;
		// for (const line of linesFiltered.reverse()) {
		// 	const pListMatch = lineContent.match(REGEX_LIST);
		// 	const pIndent = pListMatch
		// 		? (pListMatch[1].match(/\t/g) || []).length
		// 		: 0;

		// 	let pText = line.replace(REGEX_LIST, "");

		// 	const pHeadingMatch = pText.match(REGEX_HEADING);
		// 	if (!pHeadingMatch) continue;

		// 	const pHeading = pHeadingMatch ? pHeadingMatch[1].length : 0;

		// 	if (pHeading <= heading && pIndent <= indent) {
		// 		parentHeading = pHeading;
		// 		break;
		// 	}
		// }

		this.parentHeading = parentHeading;
		this.row = lineRow;
		this.contentLength = lineContent.length;
		this.isBullet = isBullet;

		this.indent = indent;
		this.prefix = prefix;
		this.heading = heading;
		this.text = text;
	}
	public static newFromCursor(editor: Editor): Line {
		const lineRow = editor.getCursor().line;
		return new Line(editor, lineRow);
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
			}
		);
		ed.transaction({
			changes: updatedLines,
		});

		Line.updateQueue.clear();
	}

	public static iterateOverSelectedLines(
		editor: Editor,
		callbackfn: (line: Line) => void
	): void {
		const selections: EditorSelection[] = editor.listSelections();
		if (!editor.somethingSelected()) {
			callbackfn(new Line(editor, selections[0].anchor.line));
		} else {
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
	}

	public stageUpdate(newContent: string) {
		Line.updateQueue.set(this, newContent);
	}
	public setHeading(heading: number): void {
		if (REGEX_BULLET.test(this.prefix) || this.prefix === "") {
			const newContent =
				Line.INDENT_CHAR.repeat(this.indent) +
				this.prefix +
				Line.HEADING_CHAR.repeat(heading) +
				" " +
				this.text;

			this.stageUpdate(newContent);
		}
	}
	public decreaseHeading(): void {
		if (this.heading <= 0) {
			return;
		} else if (this.heading === 1) {
			this.removeHeading();
		} else {
			this.setHeading(this.heading - 1);
		}
	}
	public increaseHeading(): void {
		if (this.heading >= 6) return;
		this.setHeading(this.heading + 1);
	}

	public removeHeading(): void {
		const newContent =
			Line.INDENT_CHAR.repeat(this.indent) + this.prefix + this.text;

		this.stageUpdate(newContent);
	}
	public convertIndentToHeading(): void {
		const newContent =
			Line.HEADING_CHAR.repeat(this.indent + 1) + " " + this.text;

		this.stageUpdate(newContent);
	}
	public setHeadingToIndent(): void {
		const newContent =
			Line.INDENT_CHAR.repeat(this.indent) +
			this.prefix +
			Line.HEADING_CHAR.repeat(this.indent + 1) +
			" " +
			this.text;

		this.stageUpdate(newContent);
	}
}
