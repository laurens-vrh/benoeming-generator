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

	drawCurve(marking: Marking, position: Position, toPosition: Position) {
		const toRight = marking.start < (marking.to ?? 0);

		this.context.beginPath();
		this.context.strokeStyle =
			(marking.type === "nw" || marking.type === "ovw") && !marking.hoofdfunctie
				? this.generator.options.themes[this.generator.options.theme][
						marking.naamval
				  ]
				: this.generator.options.themes[this.generator.options.theme].benoeming;
		this.context.setLineDash([]);

		const startX =
			position.width > 30
				? toRight
					? position.x + position.width - 20
					: position.x + 20
				: position.x + position.width / 2;
		const startY = position.y + 2;
		const endX =
			toPosition.width > 30
				? toRight
					? toPosition.x + 10
					: toPosition.x + toPosition.width - 10
				: toPosition.x + toPosition.width / 2;
		const endY = toPosition.y + 4;

		if (position.line === toPosition.line) {
			const controlX = (startX + endX) / 2;
			const controlY = position.y + 20;

			this.context.moveTo(startX, startY);
			this.context.quadraticCurveTo(controlX, controlY, endX, endY);
			this.context.stroke();
		} else {
			const lineBreakX1 = toRight
				? position.x + position.width + 10
				: position.x - 10;
			const lineBreakY1 = position.y + 15;
			const controlX1 = (startX + lineBreakX1) / 2;

			this.context.moveTo(startX, startY);
			this.context.quadraticCurveTo(
				controlX1,
				lineBreakY1,
				lineBreakX1,
				lineBreakY1
			);
			this.context.stroke();

			const lineBreakX2 = toRight
				? toPosition.x - 10
				: toPosition.x + toPosition.width + 10;
			const lineBreakY2 = toPosition.y + 15;
			const controlX2 = (endX + lineBreakX2) / 2;

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
}
