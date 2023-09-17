import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import { options } from "../options.js";

export type Marking = {
	start: number;
	end?: number;
	topNote?: string[];
	bottomNote?: string[];
} & (
	| {
			type: "nw";
			naamval: "nom" | "gen" | "dat" | "acc" | "abl" | "voc";
			hoofdfunctie: boolean;
	  }
	| {
			type: "ww";
			persoonsvorm: boolean;
	  }
	| {
			type: "zin";
			zin: "H" | "B";
			nummer?: number;
			streep?: "enkel" | "dubbel";
	  }
);

export interface Position {
	line: number;
	word: number;
	x: number;
	y: number;
	width: number;
}

export class Generator {
	canvas: Canvas;
	context: CanvasRenderingContext2D;
	text: string;
	lines: string[];
	markings: Marking[];

	constructor(text: string, markings: Marking[]) {
		this.canvas = createCanvas(options.width, 1, "pdf");
		this.context = this.canvas.getContext("2d");

		this.text = text;
		this.markings = markings;

		this.context.font = `${options.fontSize}px ${options.font}`;
		this.lines = this.splitText();
		this.canvas.height =
			options.linePadding +
			(options.fontSize + options.linePadding) * this.lines.length;
	}

	generate() {
		this.mark(this.markings.filter((marking) => marking.type === "nw"));
		this.drawText();
		this.mark(this.markings.filter((marking) => marking.type !== "nw"));

		return this.canvas;
	}

	splitText() {
		var lines = [""];

		this.text.split(" ").forEach((word) => {
			const newWidth = this.context.measureText(
				lines[lines.length - 1] + word
			).width;
			if (newWidth <= options.width - options.padding * 2)
				lines[lines.length - 1] += word + " ";
			else lines.push(word + " ");
		});

		return lines;
	}

	mark(markings: Marking[]) {
		markings.forEach((marking) => {
			const position = this.findPosition(marking.start, marking.end);

			this.context.beginPath();
			this.context.font = `${options.noteFontSize}px ${options.noteFont}`;

			if (marking.type === "zin") {
				this.context.fillStyle = options.themes[options.theme].benoeming;

				if (marking.streep) {
					const x = position.x - 2;
					const y = position.y + 5;
					const height = -options.fontSize - 15;

					this.context.roundRect(x, y, 2, height, 1);
					if (marking.streep === "dubbel")
						this.context.roundRect(x - 3, y, 2, height, 1);
					this.context.fill();
				}

				if (marking.zin) {
					this.context.textAlign = "left";
					if (marking.nummer)
						this.context.fillText(
							marking.nummer.toString(),
							position.x + 12,
							position.y - options.fontSize - 20
						);

					this.context.font = `16px ${options.noteFont}`;
					this.context.fillText(
						marking.zin,
						position.x + 2,
						position.y - options.fontSize - 20
					);
				}
			}

			if (marking.type === "nw") {
				this.context.fillStyle = options.themes[options.theme][marking.naamval];

				if (marking.hoofdfunctie) {
					this.context.roundRect(
						position.x - options.highlightPadding,
						position.y + 2,
						position.width + options.highlightPadding * 2,
						-options.fontSize,
						2
					);
					this.context.fill();
				} else {
					this.drawUnderline(position);
				}
			}

			if (marking.type === "ww") {
				this.context.fillStyle = options.themes[options.theme].benoeming;
				this.drawUnderline(position);
			}

			this.drawNotes(position, marking);
		});
	}

	drawUnderline(position: Position) {
		this.context.roundRect(position.x, position.y, position.width, 2, 1);
		this.context.fill();
	}

	drawNotes(position: Position, marking: Marking) {
		this.context.font = `${options.noteFontSize}px ${options.noteFont}`;
		this.context.textAlign = "center";
		this.context.fillStyle = options.themes[options.theme].benoeming;

		if (marking.topNote)
			marking.topNote.reverse().forEach((line, i) => {
				this.context.fillText(
					line,
					position.x + position.width / 2,
					position.y - options.fontSize - options.noteFontSize * i
				);
			});

		if (marking.bottomNote)
			marking.bottomNote.forEach((line, i) => {
				this.context.fillText(
					line,
					position.x + position.width / 2,
					position.y + 12 + options.noteFontSize * i
				);
			});
	}

	drawText() {
		this.context.textAlign = "left";
		this.context.font = `${options.fontSize}px ${options.font}`;
		this.context.fillStyle = options.themes[options.theme].text;

		this.lines.forEach((line, i) =>
			this.context.fillText(
				line,
				options.padding,
				(options.fontSize + options.linePadding) * (i + 1)
			)
		);
	}

	findPosition(start: number, end?: number): Position {
		this.context.font = `${options.fontSize}px ${options.font}`;

		const lineWords = this.lines.map((line) =>
			line.split(" ").filter((l) => l !== "")
		);
		const { linePosition, wordPosition } = this.findPartialPosition(
			lineWords,
			start
		);

		return {
			line: linePosition,
			word: wordPosition,
			x:
				options.padding +
				(wordPosition === 0
					? 0
					: this.context.measureText(
							lineWords[linePosition].slice(0, wordPosition).join(" ") + " "
					  ).width),
			y: (options.fontSize + options.linePadding) * (linePosition + 1) + 1,
			width: this.context.measureText(
				lineWords[linePosition]
					.slice(
						wordPosition,
						(end
							? this.findPartialPosition(lineWords, end).wordPosition
							: wordPosition) + 1
					)
					.join(" ")
					.replaceAll(".", "")
			).width,
		};
	}

	findPartialPosition(lineWords: string[][], position: number) {
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
}
