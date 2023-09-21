import fs from "node:fs";
import { Parser } from "../src/Parser.js";
import { Generator } from "../src/Generator.js";
import { Canvas } from "canvas";

const files = fs
	.readdirSync("./files/")
	.filter((fileName) => fileName.endsWith(".dicam"));

files.forEach(async (fileName) => {
	const file = fs.readFileSync("./files/" + fileName).toString();

	const parser = new Parser(fileName, file);
	const { text, markings } = parser.parse();

	const generator = new Generator(text, markings, {});
	const image = generator.generate() as Canvas;

	const buffer = image.toBuffer("application/pdf");
	fs.writeFileSync("./files/" + fileName.replace(".dicam", ".pdf"), buffer);
	console.log(`- converted ${fileName}`);
});

// TODO
// - verkort raar lange lijnen
