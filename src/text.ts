import { CanvasRenderingContext2D } from "canvas";

import { options } from "../options.js";
import { input } from "../input.js";

export function splitText(ctx: CanvasRenderingContext2D, text: string) {
	var lines = [""];

	text.split(" ").forEach((word) => {
		const newWidth = ctx.measureText(lines[lines.length - 1] + word).width;
		if (newWidth <= options.width - options.padding * 2)
			lines[lines.length - 1] += word + " ";
		else lines.push(word + " ");
	});

	return lines;
}

export function drawText(ctx: CanvasRenderingContext2D, lines: string[]) {
	ctx.textAlign = "left";
	ctx.font = `${options.fontSize}px ${options.font}`;
	ctx.fillStyle = options.themes[input.theme].text;

	lines.forEach((line, i) =>
		ctx.fillText(
			line,
			options.padding,
			(options.fontSize + options.linePadding) * (i + 1)
		)
	);
}

export function findPosition(
	ctx: CanvasRenderingContext2D,
	lines: string[],
	start: number,
	end?: number
): Position {
	ctx.font = `${options.fontSize}px ${options.font}`;

	const lineWords = lines.map((line) =>
		line.split(" ").filter((l) => l !== "")
	);
	const { linePosition, wordPosition } = findPartialPosition(lineWords, start);

	return {
		line: linePosition,
		word: wordPosition,
		x:
			options.padding +
			(wordPosition === 0
				? 0
				: ctx.measureText(
						lineWords[linePosition].slice(0, wordPosition).join(" ") + " "
				  ).width),
		y: (options.fontSize + options.linePadding) * (linePosition + 1) + 1,
		width: ctx.measureText(
			lineWords[linePosition]
				.slice(
					wordPosition,
					(end
						? findPartialPosition(lineWords, end).wordPosition
						: wordPosition) + 1
				)
				.join(" ")
				.replaceAll(".", "")
		).width,
	};
}

export function findPartialPosition(lineWords: string[][], position: number) {
	var linePosition = -1;
	var wordPosition = -1;

	lineWords.forEach((words, i) => {
		words.forEach((_, j) => {
			position--;
			if (position === -1) {
				linePosition = i;
				wordPosition = j;
			}
		});
	});
	return {
		linePosition,
		wordPosition,
	};
}

export interface Position {
	line: number;
	word: number;
	x: number;
	y: number;
	width: number;
}
