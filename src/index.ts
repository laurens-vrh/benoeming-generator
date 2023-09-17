import fs from "node:fs";
import { Parser } from "./Parser.js";
import { Generator } from "./Generator.js";

const files = fs
	.readdirSync("./files/")
	.filter((fileName) => fileName.endsWith(".dicam"));

files.forEach(async (fileName) => {
	const file = fs.readFileSync("./files/" + fileName).toString();

	const parser = new Parser(fileName, file);
	const { text, markings } = parser.parse();

	const generator = new Generator(text, markings);
	const image = generator.generate();

	const buffer = image.toBuffer("application/pdf");
	fs.writeFileSync("./files/" + fileName.replace(".dicam", ".pdf"), buffer);
	console.log(`- converted ${fileName}`);
});

// TODO
// - uitgang werkwoord
// - verkort raar lange lijnen
