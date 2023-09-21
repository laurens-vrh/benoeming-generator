import { CanvasRenderingContext2D } from "canvas";
import { Generator, Marking, Position } from "./Generator.js";

export class Drawer {
	generator: Generator;
	context: CanvasRenderingContext2D;

	constructor(generator: Generator, context: CanvasRenderingContext2D) {
		this.generator = generator;
		this.context = context;
	}

	drawText(lines: string[]) {
		this.context.textAlign = "left";
		this.context.font = `${this.generator.options.fontSize}px ${this.generator.options.font}`;
		this.context.fillStyle =
			this.generator.options.themes[this.generator.options.theme].text;

		lines.forEach((line, i) =>
			this.context.fillText(
				line,
				this.generator.options.padding,
				(this.generator.options.fontSize + this.generator.options.linePadding) *
					(i + 1)
			)
		);
	}

	drawUnderline(marking: Marking, dashed = false, offsetY = 0) {
		const startPosition = this.generator.findPosition(marking.start);
		const endPosition = this.generator.findPosition(
			marking.end ?? marking.start
		);

		this.context.beginPath();
		this.context.strokeStyle = this.context.fillStyle;
		this.context.lineCap = "round";
		this.context.lineWidth = 2;
		if (dashed) this.context.setLineDash([8, 6]);
		else this.context.setLineDash([]);

		const startX = startPosition.x;
		const startY = startPosition.y + 1 + offsetY;
		const endX = endPosition.x + endPosition.width;
		const endY = endPosition.y + 1 + offsetY;
		this.context.moveTo(startX, startY);

		if (startPosition.line === endPosition.line) {
			this.context.lineTo(endX, startY);
			this.context.stroke();
		} else {
			const lineBreakX1 = startPosition.x + startPosition.width;
			this.context.lineTo(lineBreakX1, startY);
			this.context.stroke();

			this.context.beginPath();
			this.context.moveTo(endPosition.x, endY);
			this.context.lineTo(endX, endY);
			this.context.stroke();
		}
	}

	drawNotes(position: Position, marking: Marking) {
		this.context.font = `${this.generator.options.noteFontSize}px ${this.generator.options.noteFont}`;
		this.context.textAlign = "center";
		this.context.fillStyle =
			this.generator.options.themes[this.generator.options.theme].benoeming;

		if (marking.topNote)
			marking.topNote.reverse().forEach((line, i) => {
				this.context.fillText(
					line,
					position.x + position.width / 2,
					position.y -
						this.generator.options.fontSize -
						this.generator.options.noteFontSize * i
				);
			});

		if (marking.bottomNote)
			marking.bottomNote.forEach((line, i) => {
				this.context.fillText(
					line,
					position.x + position.width / 2,
					position.y + 13 + this.generator.options.noteFontSize * i
				);
			});
	}
}
