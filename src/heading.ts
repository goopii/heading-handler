import { Editor, EditorPosition } from "obsidian";
import { text } from "stream/consumers";

const REGEX_LIST = /^(\s*)(?:-\s+\[[ xX]\]|[-*+](?!\s*\[)|\d+\.)(?:\s|$)/;
const REGEX_BULLET = /^(?:\s*)-(?!\s*\[)/;
const REGEX_HEADING = /^(#+)\s*/;

const INDENT_CHAR = "\t";
const HEADING_CHAR = "#";

class Line {
	prefix: string;
	heading: number;
	text: string;
	indent: number;

	constructor(editor: Editor, line: number) {
		const lineContent = editor.getLine(line);

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

		console.log(`indent: '${indent}'`);
		console.log(`prefix: '${prefix}'`);
		console.log(`heading: '${heading}'`);
		console.log(`text: '${text}'`);
		this.indent = indent;
		this.prefix = prefix;
		this.heading = heading;
		this.text = text;
	}
}

interface LineContent {
	prefix: string;
	heading: number;
	text: string;
	indent: number;
}

/**
 * Splits a line into its list indicator and content
 * @param editor - The Obsidian editor instance
 * @returns Object containing line information and split parts
 */
function getLineContent(
	editor: Editor,
	lineCurrent: EditorPosition["line"]
): LineContent {
	const lineContent = editor.getLine(lineCurrent);

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

	console.log(`indent: '${indent}'`);
	console.log(`prefix: '${prefix}'`);
	console.log(`heading: '${heading}'`);
	console.log(`text: '${text}'`);
	return {
		indent: indent,
		prefix: prefix,
		heading: heading,
		text: text,
	};
}

/**
 * Increases the heading level at the current line
 * @param editor - The Obsidian editor instance
 */
export function increaseHeading(
	editor: Editor,
	line: number = editor.getCursor().line
): void {
	// const lineCurrent = editor.getCursor().line;

	const { indent, prefix, heading, text } = getLineContent(editor, line);
	const cursorPrev = editor.getCursor();

	if (REGEX_BULLET.test(prefix) || prefix === "") {
		const updatedLine =
			INDENT_CHAR.repeat(indent) +
			prefix +
			HEADING_CHAR.repeat(heading + 1) +
			" " +
			text;

		editor.setLine(line, updatedLine);

		// Move cursor to end of line
		editor.setCursor({
			ch: updatedLine.length,
			line: line,
		});
	}
}

/**
 * Sets the heading level based on the number of indentation characters (tabs) before the list prefix
 * @param editor - The Obsidian editor instance
 */
export function setHeadingBasedOnIndentLevel(editor: Editor): void {
	const lineCurrent = editor.getCursor().line;

	const { indent, prefix, heading, text } = getLineContent(
		editor,
		lineCurrent
	);
	const cursorPrev = editor.getCursor();

	if (prefix === "") return;

	// Generate hashtags based on indentation level
	const hashtags = "#".repeat(indent + 1) + " ";

	// Remove existing hashtags from text
	// const cleanText = text.replace(/^#+\s*/, "");

	editor.setLine(lineCurrent, prefix + hashtags + text);

	// Move cursor to end of line
	editor.setCursor({
		ch: cursorPrev.ch + hashtags.length,
		line: lineCurrent,
	});
}

/**
 * Decreases the heading level at the current line
 * @param editor - The Obsidian editor instance
 */
export function decreaseHeading(
	editor: Editor,
	line: number = editor.getCursor().line
): void {
	const { indent, prefix, heading, text } = getLineContent(editor, line);
	if (heading <= 0) return;
	let updatedLine = "";
	if (heading >= 2) {
		updatedLine =
			INDENT_CHAR.repeat(indent) +
			prefix +
			HEADING_CHAR.repeat(heading - 1) +
			" " +
			text;
	} else {
		updatedLine =
			INDENT_CHAR.repeat(indent) +
			prefix +
			HEADING_CHAR.repeat(heading - 1) +
			text;
	}
	editor.setLine(line, updatedLine);
	// Move cursor to end of line
	editor.setCursor({
		ch: updatedLine.length,
		line: line,
	});
}

function updateLine(editor: Editor, line: number) {
	const lineContent: LineContent = getLineContent(editor, line);

	const updatedLine =
		INDENT_CHAR.repeat(indent) +
		prefix +
		HEADING_CHAR.repeat(heading - 1) +
		text;

	editor.setLine(lineCurrent, updatedLine);
	// Move cursor to end of line
	editor.setCursor({
		ch: updatedLine.length,
		line: lineCurrent,
	});
}
