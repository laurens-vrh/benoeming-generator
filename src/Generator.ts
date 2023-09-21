import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import { Options, defaultOptions } from "../options.js";
import { Drawer } from "./Drawer.js";

export type Marking = {
	start: number;
	end?: number;
	topNote?: string[];
	bottomNote?: string[];
	to?: number;
} & (
	| {
			type: "nw" | "ovw";
			naamval: "nom" | "gen" | "dat" | "acc" | "abl" | "voc";
			hoofdfunctie: boolean;
			participium: boolean;
	  }
	| {
			type: "ww";
			persoonsvorm: boolean;
			onderwerp: boolean;
	  }
	| {
			type: "zin";
			zin: "H" | "B";
			nummer?: number;
			streep?: "enkel" | "dubbel";
	  }
	| {
			type: "constructie";
			constructie: "aci" | "ablabs";
			close: boolean;
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
	options: Options;
	canvas: Canvas | HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	drawer: Drawer;
	text: string;
	lines: string[];
	markings: Marking[];

	constructor(
		text: string,
		markings: Marking[],
		options?: Partial<Options>,
		canvas?: Canvas | HTMLCanvasElement
	) {
		this.options = { ...defaultOptions, ...options };
		this.canvas = canvas ?? createCanvas(this.options.width, 1, "pdf");
		this.canvas.width = this.options.width;
		this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

		this.text = text;
		this.markings = markings;

		this.context.font = `${this.options.fontSize}px ${this.options.font}`;
		this.context.lineCap = "round";
		this.context.lineJoin = "round";
		this.context.lineWidth = 2;
		this.lines = this.splitText();
		this.canvas.height =
			this.options.linePadding +
			(this.options.fontSize + this.options.linePadding) * this.lines.length;
		this.context.fillStyle = this.options.themes[this.options.theme].background;
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.drawer = new Drawer(this, this.context);
	}

	generate() {
		this.mark(this.markings.filter((marking) => marking.type !== "zin"));
		this.mark(this.markings.filter((marking) => marking.type === "zin"));
		this.drawer.drawText(this.lines);

		return this.canvas;
	}

	splitText() {
		var lines = [""];

		this.text.split(" ").forEach((word) => {
			const newWidth = this.context.measureText(
				lines[lines.length - 1] + word
			).width;

			if (newWidth <= this.options.width - this.options.padding * 2)
				lines[lines.length - 1] += word + " ";
			else lines.push(word + " ");

			if (word.endsWith("\n")) lines.push("");
		});

		return lines;
	}

	mark(markings: Marking[]) {
		markings.forEach((marking) => {
			const position = this.findPosition(marking.start, marking.end);
			this.context.font = `${this.options.noteFontSize}px ${this.options.noteFont}`;

			if (marking.to) {
				const toPosition = this.findPosition(marking.to);

				this.context.beginPath();
				this.context.strokeStyle =
					(marking.type === "nw" || marking.type === "ovw") &&
					!marking.hoofdfunctie
						? this.options.themes[this.options.theme][marking.naamval]
						: this.options.themes[this.options.theme].benoeming;
				this.context.setLineDash([]);

				const startX = position.x + position.width / 2;
				const startY = position.y + 2;
				const endX = toPosition.x + toPosition.width / 2;
				const endY = toPosition.y + 4;

				if (position.line === toPosition.line) {
					const controlX = (startX + endX) / 2;
					const controlY = position.y + 20;

					this.context.moveTo(startX, startY);
					this.context.quadraticCurveTo(controlX, controlY, endX, endY);
					this.context.stroke();
				} else {
					const lineBreakX1 =
						position.line > toPosition.line
							? this.options.padding
							: this.options.width - this.options.padding;
					const lineBreakY1 = position.y + 25;
					const controlX1 =
						position.line > toPosition.line ? startX - 20 : startX + 20;

					this.context.moveTo(startX, startY);
					this.context.quadraticCurveTo(
						controlX1,
						lineBreakY1,
						lineBreakX1,
						lineBreakY1
					);
					this.context.stroke();

					const lineBreakX2 =
						position.line > toPosition.line
							? this.options.width - this.options.padding
							: this.options.padding;
					const lineBreakY2 = toPosition.y + 25;
					const controlX2 =
						position.line > toPosition.line ? endX + 20 : endX - 20;

					this.context.beginPath();
					this.context.moveTo(endX, endY);
					this.context.quadraticCurveTo(
						controlX2,
						lineBreakY2,
						lineBreakX2,
						lineBreakY2
					);
					this.context.stroke();
				}
			}

			this.context.beginPath();
			if (marking.type === "zin") {
				this.context.fillStyle =
					this.options.themes[this.options.theme].benoeming;

				if (marking.streep) {
					const x = position.x - 2;
					const y = position.y + 5;
					const height = -this.options.fontSize - 15;

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
							position.y - this.options.fontSize - 20
						);

					this.context.font = `16px ${this.options.noteFont}`;
					this.context.fillText(
						marking.zin,
						position.x + 2,
						position.y - this.options.fontSize - 20
					);
				}
			}

			if (marking.type === "constructie") {
				this.context.strokeStyle =
					this.options.themes[this.options.theme].benoeming;

				this.context.beginPath();
				this.context.setLineDash([]);

				var startX = position.x;
				if (marking.constructie === "ablabs") startX += marking.close ? -5 : 5;
				var middleX = startX - 7;
				if (marking.close) {
					var temp = middleX;
					middleX = startX;
					startX = temp;
				}

				const startY = position.y + 5;
				const endY = position.y + 5 - this.options.fontSize - 15;
				const middleY = (startY + endY) / 2;

				if (marking.constructie === "aci") {
					this.context.moveTo(startX, startY);
					this.context.quadraticCurveTo(middleX, middleY, startX, endY);
					this.context.stroke();
				} else if (marking.constructie === "ablabs") {
					this.context.moveTo(startX, startY);
					this.context.lineTo(middleX, startY);
					this.context.lineTo(middleX, endY);
					this.context.lineTo(startX, endY);
					this.context.stroke();
				}
			}

			if (
				marking.type === "nw" ||
				(marking.type === "ovw" && marking.naamval)
			) {
				this.context.fillStyle =
					this.options.themes[this.options.theme][marking.naamval];
				if (marking.hoofdfunctie) {
					this.context.roundRect(
						position.x - this.options.highlightPadding,
						position.y + 2,
						position.width + this.options.highlightPadding * 2,
						-this.options.fontSize,
						2
					);
					this.context.fill();
				} else {
					this.drawer.drawUnderline(marking);
				}

				if (marking.participium) {
					this.context.fillStyle =
						this.options.themes[this.options.theme].benoeming;
					this.drawer.drawUnderline(marking, true, 2);
				}
			}

			if (marking.type === "ww") {
				if (marking.onderwerp) {
					this.context.fillStyle = this.options.themes[this.options.theme].nom;
					const markWidth = Math.max(position.width * 0.3, 13);
					this.context.roundRect(
						position.x +
							position.width -
							markWidth -
							this.options.highlightPadding,
						position.y + 2,
						markWidth + this.options.highlightPadding * 2,
						-this.options.fontSize,
						2
					);
					this.context.fill();
				}

				this.context.fillStyle =
					this.options.themes[this.options.theme].benoeming;
				this.drawer.drawUnderline(marking, !marking.persoonsvorm);
			}

			if (marking.type === "ovw") {
				this.context.strokeStyle =
					this.options.themes[this.options.theme].benoeming;
				this.context.setLineDash([]);
				this.context.beginPath();
				this.context.roundRect(
					position.x,
					position.y + 2,
					position.width + 1,
					-this.options.fontSize,
					6
				);
				this.context.stroke();
			}

			this.drawer.drawNotes(position, marking);
		});
	}

	findPosition(start: number, end?: number): Position {
		this.context.font = `${this.options.fontSize}px ${this.options.font}`;

		const lineWords = this.lines.map((line) =>
			line.split(" ").filter((l) => l !== "")
		);
		lineWords[lineWords.length - 1].push("");

		const { linePosition, wordPosition } = this.findPartialPosition(
			lineWords,
			start
		);

		const x =
			this.options.padding +
			(wordPosition === 0
				? 0
				: this.context.measureText(
						lineWords[linePosition].slice(0, wordPosition).join(" ") + " "
				  ).width);
		const y =
			(this.options.fontSize + this.options.linePadding) * (linePosition + 1) +
			1;
		const width = this.context.measureText(
			lineWords[linePosition]
				.slice(
					wordPosition,
					(end
						? this.findPartialPosition(lineWords, end).wordPosition
						: wordPosition) + 1
				)
				.join(" ")
				.replace(/[.;,]/g, "")
		).width;

		return {
			line: linePosition,
			word: wordPosition,
			x,
			y,
			width,
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
