import { Editor, EditorChange, EditorSelection } from "obsidian";

// One-pass splitter: [indentTabs, prefix, headingHashes, text]
const REGEX_LINE =
	/^(\t*)[ ]*(?:(-\s+\[[ xX]\]|[\-\*\+](?!\s*\[)|\d+\.)(?=\s|$)\s*)?(?:(\#+)\s*)?(.*)$/;

type ParsedLine = {
	content: string;
	indent: number; // number of leading tabs
	prefix: string; // list marker or ""
	heading: number; // number of "#" or 0
	text: string; // remainder
};

function parseLine(content: string): ParsedLine {
	const m = content.match(REGEX_LINE);
	const indentStr = m?.[1] ?? "";
	const prefix = m?.[2] ?? "";
	const headingStr = m?.[3] ?? "";
	const text = m?.[4] ?? "";
	return {
		indent: indentStr.length,
		prefix,
		heading: headingStr.length,
		text,
		content,
	};
}

export class Line {
	private static INDENT_CHAR = "\t";
	private static HEADING_CHAR = "#";

	private static updateQueue: Map<Line, string> = new Map();

	private static currentLines: Set<Line> = new Set<Line>();

	parent: Line | undefined;
	row: number;

	content: string;
	indent: number;
	prefix: string;
	heading: number;
	text: string;

	public static atRow(editor: Editor, lineRow: number): Line {
		let l: Line | undefined = undefined;

		Line.currentLines.forEach((line: Line) => {
			if (line.row === lineRow) {
				l = line;
				return;
			}
		});
		if (l) return l;
		else {
			l = new Line();
			Line.currentLines.add(l);
			l.row = lineRow;

			const lineContent = editor.getLine(lineRow);
			const parsed = parseLine(lineContent);
			l.updateInfo(parsed);
			return l;
		}
	}

	public static atCursor(editor: Editor): Line {
		const lineRow = editor.getCursor().line;
		return Line.atRow(editor, lineRow);
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
				callbackfn(Line.atRow(editor, lineRow));
			}
		});
	}

	public static applyUpdates(editor: Editor): void {
		if (Line.updateQueue.size === 0) return;

		const updatedLines: EditorChange[] = [];

		Line.updateQueue.forEach(
			(newContent: string, l: Line, map: Map<Line, string>) => {
				const change: EditorChange = {
					from: { ch: 0, line: l.row },
					text: newContent,
					to: { ch: editor.getLine(l.row).length, line: l.row },
				};
				updatedLines.push(change);
			}
		);
		editor.transaction({
			changes: updatedLines,
		});

		Line.updateQueue.clear();
		Line.currentLines.clear();
	}

	public stageUpdate(newContent: string) {
		const parsed = parseLine(newContent);
		this.updateInfo(parsed);

		Line.updateQueue.set(this, newContent);
	}

	private updateInfo(pl: ParsedLine): void {
		this.indent = pl.indent;
		this.prefix = pl.prefix;
		this.heading = pl.heading;
		this.text = pl.text;
		this.content = pl.content;
	}

	public setParentLine(editor: Editor): void {
		// If current line has a heading, look for the nearest heading above
		// with heading <= current heading and indent <= current indent.
		// If current line has no heading, accept any heading above with
		// indent <= current indent.
		const currIndent = this.indent;
		const currHeading = this.heading;

		for (let i = this.row - 1; i >= 0; i--) {
			const content = editor.getLine(i);
			if (!content) continue; // skip blank lines

			const pl = parseLine(content);
			if (pl.heading <= 0) continue; // only consider actual headings

			if (pl.indent <= currIndent) {
				if (currHeading === 0 || pl.heading <= currHeading) {
					const l = Line.atRow(editor, i);
					// console.log(`parent for ${this.text}: ${l.text}:`);
					// console.log(l);
					this.parent = l;
					return;
				}
			}
		}
	}

	public setHeading(heading: number): void {
		if (this.prefix === "" || this.prefix === "-") {
			let newContent: string = "";
			newContent += Line.INDENT_CHAR.repeat(this.indent);
			newContent += this.prefix;
			if (this.prefix === "-" && heading != 0) newContent += " ";
			newContent += Line.HEADING_CHAR.repeat(heading);
			newContent += " ";
			newContent += this.text;
			this.stageUpdate(newContent);
		} else {
			return;
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
		this.setHeading(0);
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
