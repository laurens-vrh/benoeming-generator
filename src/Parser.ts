export class Parser {
	fileName: string;
	file: string;

	header: string;
	text: string;
	words: string[];

	position = -1;
	currentWord?: string;
	textPosition = -1;

	constructor(fileName: string, file: string) {
		this.fileName = fileName;
		this.file = file.replace(/\r\n/g, "\n");

		const [header, ...text] = this.file.split("\n\n");
		this.header = header;
		this.parseHeader();
		this.text = text
			.join("\n\n")
			.replaceAll(/ *(?=<|{)/g, "")
			.replaceAll(/\n(?=.)/g, "  ");
		this.words = this.text.split("  ");

		this.advance();
	}

	advance(increment = true) {
		if (increment) this.textPosition++;
		this.position++;
		this.currentWord = this.words[this.position];
	}

	parseHeader() {
		const lines = this.header.split("\n");

		if (lines.shift() !== "DICAM FILE")
			throw new Error(`File '${this.fileName}' is not a Dicam-file.`);

		const version = lines.shift();
		if (version !== "v1.0.0")
			throw new Error(`Incompatible version: '${version}' (running v1.0.0)`);

		const notes = lines.map((line) => line.slice(2));

		return { version, notes };
	}

	parse() {
		const markings = [];
		var cleanText = "";

		while (this.currentWord) {
			const result =
				/(\(.+?:.+?\))|(([^<{]+)(<(.+?)(:(.+))?>)?({([^_]+?)?(_(.+))?})?)/.exec(
					this.currentWord
				);
			if (!result)
				throw new Error(
					`Unable to execute regex on string '${this.currentWord}'`
				);

			const parts = {
				zin: result[1],
				cleanWord: result[3],
				type: result[5],
				value: result[7],
				topNote: result[9],
				bottomNote: result[11],
			};

			if (!parts.zin)
				cleanText += (cleanText === "" ? "" : " ") + parts.cleanWord;

			if (!parts.zin && !parts.type && !parts.topNote && !parts.bottomNote) {
				this.advance();
				continue;
			}

			const words = parts.cleanWord?.split(" ");
			const marking: any = {
				start: this.textPosition,
				end: words?.length > 1 ? this.position + words.length - 1 : undefined,
				type: parts.type,
				topNote: parts.topNote?.split("/"),
				bottomNote: parts.bottomNote?.split("/"),
			};

			if (parts.zin) {
				marking.type = "zin";
				var zin = parts.zin.split(":")[1];

				if (zin.startsWith("||")) {
					marking.streep = "dubbel";
					zin = zin.slice(2);
				} else if (zin.startsWith("|")) {
					marking.streep = "enkel";
					zin = zin.slice(1);
				}

				marking.zin = zin[0];
				marking.nummer = parseInt(zin.slice(1));
				markings.push(marking);
				this.advance(false);
				continue;
			}

			if (parts.type === "nw") {
				marking.naamval = parts.value.slice(0, 3);
				marking.hoofdfunctie = !parts.value.endsWith("_");
			} else if (parts.type === "ww") {
				marking.persoonsvorm = !parts.value || parts.value === "pv";
			}

			markings.push(marking);
			this.advance();
			continue;
		}

		return { text: cleanText, markings };
	}
}
