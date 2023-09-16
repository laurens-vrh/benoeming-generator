import { createCanvas } from "canvas";
import { input } from "../input.js";
import fs from "node:fs";
import { options } from "../options.js";
import { mark } from "./markings.js";
import { drawText, splitText } from "./text.js";

const canvas = createCanvas(options.width, 1, "pdf");
const ctx = canvas.getContext("2d");

ctx.font = `${options.fontSize}px ${options.font}`;
const textLines = splitText(ctx, input.text);

canvas.height =
	options.linePadding +
	(options.fontSize + options.linePadding) * textLines.length;

// marker
mark(
	ctx,
	textLines,
	input.markings.filter((marking) => marking.type === "naamwoord")
);

// text
drawText(ctx, textLines);

// andere markings
mark(
	ctx,
	textLines,
	input.markings.filter((marking) => marking.type !== "naamwoord")
);

// save
const buffer = canvas.toBuffer("application/pdf");
fs.writeFileSync("marked-text.pdf", buffer);
console.log("Image saved as marked-text.pdf");
