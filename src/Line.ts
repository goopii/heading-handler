import { Editor, EditorChange, EditorSelection } from "obsidian";

// One-pass splitter: [indentTabs, prefix, headingHashes, text]
const REGEX_LINE = /^(\t*)[ ]*(?:(-\s+\[[ xX]\]|[\-\*\+](?!\s*\[)|\d+\.)(?=\s|$)\s*)?(?:(\#+)\s*)?(.*)$/;

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

	private static virtualLines: Array<Line> = [];

	private static readonly ROOT_LINE: Line = (() => {
		const root = Object.create(Line.prototype);
		root.row = -1;
		root.content = "";
		root.indent = 0;
		root.prefix = "";
		root.heading = 0;
		root.text = "";
		root.parent = root;
		root.stagedUpdate = {
			indent: 0,
			prefix: "",
			heading: 0,
			text: "",
			content: "",
		};
		return root;
	})();

	parent: Line;
	row: number;

	content: string;
	indent: number;
	prefix: string;
	heading: number;
	text: string;

	stagedUpdate: ParsedLine;

	private constructor(editor: Editor, row: number) {
		this.row = row;
		const lineContent = editor.getLine(row);
		const parsed = parseLine(lineContent);
		this.updateInfo(parsed);
		this.stagedUpdate = parsed;
		Line.virtualLines[row] = this;
	}

	private updateInfo(pl: ParsedLine): void {
		this.indent = pl.indent;
		this.prefix = pl.prefix;
		this.heading = pl.heading;
		this.text = pl.text;
		this.content = pl.content;
	}

	private setParentLine(editor: Editor): void {
		for (let i = this.row - 1; i >= 0; i--) {
			const l = Line.atRow(editor, i, false);

			if (this.prefix && l.prefix !== this.prefix) {
				this.parent = Line.ROOT_LINE;
				return;
			}

			if (l.heading <= 0) continue;

			if (l.indent <= this.indent && l.prefix === this.prefix) {
				if (this.heading === 0 || l.heading <= this.heading) {
					this.parent = l;
					return;
				}
			}
		}
		this.parent = Line.ROOT_LINE;
	}

	public static atRow(editor: Editor, lineRow: number, setParent: boolean = true): Line {
		if (Line.virtualLines[lineRow]) {
			return Line.virtualLines[lineRow];
		}
		const l = new Line(editor, lineRow);
		if (setParent) {
			l.setParentLine(editor);
		}
		return l;
	}

	public static atCursor(editor: Editor, setParent: boolean = true): Line {
		const lineRow = editor.getCursor().line;
		return Line.atRow(editor, lineRow, setParent);
	}

	public static iterateOverSelectedLines(editor: Editor, callbackfn: (line: Line) => void): void {
		if (!editor.somethingSelected()) return;
		const selections: EditorSelection[] = editor.listSelections();
		selections.forEach((s) => {
			for (
				let lineRow = Math.min(s.head.line, s.anchor.line);
				lineRow < Math.max(s.head.line, s.anchor.line) + 1;
				lineRow++
			) {
				callbackfn(Line.atRow(editor, lineRow, true));
			}
		});
	}

	public static applyUpdates(editor: Editor): void {
		if (Line.updateQueue.size === 0) return;

		const updatedLines: EditorChange[] = [];
		const cursor = editor.getCursor();
		let newCursorPosition: number | undefined = undefined;

		Line.updateQueue.forEach((newContent: string, l: Line, map: Map<Line, string>) => {
			const oldContentLength = editor.getLine(l.row).length;
			const change: EditorChange = {
				from: { ch: 0, line: l.row },
				text: newContent,
				to: { ch: oldContentLength, line: l.row },
			};
			if (!editor.somethingSelected()) {
				newCursorPosition = newContent.length;
			}
			updatedLines.push(change);
		});

		editor.transaction({
			changes: updatedLines,
		});

		if (newCursorPosition !== undefined) {
			editor.setCursor({
				line: cursor.line,
				ch: newCursorPosition,
			});
		}

		Line.updateQueue.clear();
		Line.virtualLines = [];
	}

	public stageUpdate(newContent: string) {
		// const parsed = parseLine(newContent);
		// this.updateInfo(parsed);
		this.stagedUpdate = parseLine(newContent);

		Line.updateQueue.set(this, newContent);
	}

	public setHeading(heading: number): void {
		if (this.prefix === "" || this.prefix === "-") {
			// Clamp heading to 0-6
			heading = Math.max(0, Math.min(6, heading));
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

	public getMinimumHeading(): number {
		const absoluteMinimum = this.indent + 1;
		const relativeMinimum = this.parent.stagedUpdate.heading + 1;
		const minHeading = Math.max(absoluteMinimum, relativeMinimum);
		return minHeading;
	}

	public promoteHeading(): void {
		const minHeading = this.getMinimumHeading();
		this.setHeading(Math.max(this.heading + 1, minHeading));
	}

	public demoteHeading(): void {
		const minHeading = this.getMinimumHeading();
		const desiredHeading = this.heading - 1;
		if (desiredHeading < minHeading) {
			if (this.heading === minHeading && this.heading < 6) {
				this.setHeading(0);
			}
		} else {
			this.setHeading(desiredHeading);
		}
	}
}
