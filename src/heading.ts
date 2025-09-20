import { Editor, EditorPosition } from "obsidian";

const REGEX_LIST = /^(?:\s*)(?:-\s+\[[ xX]\]|[-*+](?!\s*\[)|\d+\.)(?:\s|$)/;
const REGEX_BULLET = /^(?:\s*)-(?!\s*\[)/;

interface LineContent {
	prefix: string;
	text: string;
}

/**
 * Splits a line into its list indicator and content
 * @param editor - The Obsidian editor instance
 * @returns Object containing line information and split parts
 */
function splitLine(
	editor: Editor,
	lineCurrent: EditorPosition["line"]
): LineContent {
	const lineContent = editor.getLine(lineCurrent);
	// console.log("lineContent: ", lineContent);

	const prefix = lineContent.match(REGEX_LIST)?.[0] || "";
	const text = lineContent.replace(REGEX_LIST, "");

	// console.log("lineListIndicator:", prefix);
	// console.log("lineRest:", text);

	return {
		prefix: prefix,
		text: text,
	};
}

/**
 * Increases the heading level at the current line
 * @param editor - The Obsidian editor instance
 */
export function increaseHeading(editor: Editor): void {
	const lineCurrent = editor.getCursor().line;

	const { prefix, text } = splitLine(editor, lineCurrent);
	const cursorPrev = editor.getCursor();

	if (REGEX_BULLET.test(prefix) || prefix === "") {
		let hashtag = "# ";
		if (text.startsWith("#")) {
			hashtag = "#";
		}

		editor.setLine(lineCurrent, prefix + hashtag + text);

		// Move cursor to end of line
		editor.setCursor({
			ch: cursorPrev.ch + hashtag.length,
			line: lineCurrent,
		});
	}
}

/**
 * Decreases the heading level at the current line
 * @param editor - The Obsidian editor instance
 */
export function decreaseHeading(editor: Editor): void {
	const lineCurrent = editor.getCursor().line;

	const { prefix, text } = splitLine(editor, lineCurrent);

	if (text.startsWith("##")) {
		editor.setLine(lineCurrent, prefix + text.slice(1));
	} else if (text.startsWith("# ")) {
		editor.setLine(lineCurrent, prefix + text.slice(2));
	}
}
