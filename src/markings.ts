import { CanvasRenderingContext2D } from "canvas";

import { Position, findPosition } from "./text.js";
import { options } from "../options.js";
import { input } from "../input.js";

export type Marking = {
	start: number;
	end?: number;
} & (
	| {
			type: "naamwoord";
			naamval: "nom" | "gen" | "dat" | "acc" | "abl" | "voc";
			hoofdfunctie: boolean;
			notitie?: "nw.d.";
			getal?: "ev" | "mv";
			geslacht?: "m" | "v" | "o";
	  }
	| {
			type: "werkwoord";
			modus: "ind" | "imp" | "inf" | "coni";
			tijd?: "pr" | "impf" | "pf" | "plqpf" | "fut" | "fut ex";
			persoon?: "1e" | "2e" | "3e";
			getal: "ev" | "mv";
			genus?: "A" | "P";
			rollen?: 1 | 2 | 3;
	  }
	| {
			type: "zin";
			streep?: "enkel" | "dubbel";
			zin?: "H" | "B";
			nummer?: number;
	  }
);

export function mark(
	ctx: CanvasRenderingContext2D,
	textLines: string[],
	markings: Marking[]
) {
	markings.forEach((marking) => {
		const position = findPosition(ctx, textLines, marking.start, marking.end);

		ctx.beginPath();
		ctx.font = `${options.noteFontSize}px ${options.noteFont}`;

		if (marking.type === "zin") {
			ctx.fillStyle = options.themes[input.theme].benoeming;

			if (marking.streep) {
				const x =
					position.x + position.width + (marking.streep === "dubbel" ? 4 : 2);
				const y = position.y + 5;
				const height = -options.fontSize - 15;

				ctx.roundRect(x, y, 2, height, 1);
				if (marking.streep === "dubbel") ctx.roundRect(x + 3, y, 2, height, 1);
				ctx.fill();
			}

			if (marking.zin) {
				ctx.textAlign = "left";
				if (marking.nummer)
					ctx.fillText(
						marking.nummer.toString(),
						position.x + 12,
						position.y - options.fontSize - 20
					);

				ctx.font = `16px ${options.noteFont}`;
				ctx.fillText(
					marking.zin,
					position.x + 2,
					position.y - options.fontSize - 20
				);
			}
		}

		if (marking.type === "naamwoord") {
			ctx.fillStyle = options.themes[input.theme][marking.naamval];

			if (marking.hoofdfunctie) {
				ctx.roundRect(
					position.x - options.highlightPadding,
					position.y + 2,
					position.width + options.highlightPadding * 2,
					-options.fontSize,
					2
				);
				ctx.fill();
			} else {
				underline(ctx, position);
			}

			if (marking.getal || marking.geslacht)
				drawNote(ctx, position, "top", [
					marking.getal ?? "",
					marking.geslacht ?? "",
				]);
			if (marking.notitie) drawNote(ctx, position, "bottom", [marking.notitie]);
		}

		if (marking.type === "werkwoord") {
			ctx.fillStyle = options.themes[input.theme].benoeming;
			underline(ctx, position);
			drawNote(ctx, position, "top", [
				`${marking.modus}${marking.tijd ? ` ${marking.tijd}` : ""}`,
				`${marking.persoon ? `${marking.persoon} ` : ""}${marking.getal}${
					marking.genus ? ` ${marking.genus}` : ""
				}`,
			]);
			if (marking.rollen)
				drawNote(ctx, position, "bottom", [marking.rollen.toString()]);
		}
	});

	// Apply markings
	// for (const marking of markings) {
	// 	ctx.fillStyle = marking.color;
	// 	const markedText = text.substring(marking.start, marking.end + 1);
	// 	console.log(markedText);
	// 	const textMetrics = ctx.measureText(text.substring(0, marking.start));
	// 	const startX = textMetrics.width + 10; // Adjust the X position based on text width
	// 	ctx.fillRect(startX, 20, ctx.measureText(markedText).width, 20); // Adjust the Y and height as needed
	// }
}

function underline(ctx: CanvasRenderingContext2D, position: Position) {
	ctx.roundRect(position.x, position.y, position.width, 2, 1);
	ctx.fill();
}

function drawNote(
	ctx: CanvasRenderingContext2D,
	position: Position,
	type: "top" | "bottom",
	note: string[]
) {
	ctx.textAlign = "center";
	ctx.fillStyle = options.themes[input.theme].benoeming;

	if (type === "top") {
		note.reverse().forEach((line, i) => {
			ctx.fillText(
				line,
				position.x + position.width / 2,
				position.y - options.fontSize - options.noteFontSize * i
			);
		});
		return;
	}

	note.forEach((line, i) => {
		ctx.fillText(
			line,
			position.x + position.width / 2,
			position.y + 12 + options.noteFontSize * i
		);
	});
}
