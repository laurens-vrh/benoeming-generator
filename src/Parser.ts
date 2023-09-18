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
			.replace(/\n- .+/g, "")
			.replace(/ *(?=<|{)/g, "")
			.replace(/\n(?=.)/g, "  ");
		this.words = this.text.split("  ");

		this.advance();
	}

	advance(number = 1, increment = true) {
		if (increment) this.textPosition += number;
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
				/(\((.+?)(:(.+?))?\))|(([^<{]+)(<(.+?)(:(.+))?>)?(\[([+-]?[0-9]+?)\])?({([^_]+?)?(_(.+))?})?)/.exec(
					this.currentWord
				);
			if (!result)
				throw new Error(
					`Unable to execute regex on string '${this.currentWord}'`
				);

			const parts = {
				annotationType: result[2],
				annotationValue: result[4],

				cleanWord: result[6],
				type: result[8],
				value: result[10],
				offset: result[12],
				topNote: result[14],
				bottomNote: result[16],
			};

			if (parts.cleanWord)
				cleanText +=
					parts.cleanWord + (this.currentWord.endsWith("\n") ? "\n " : " ");

			if (
				!parts.annotationType &&
				!parts.type &&
				!parts.topNote &&
				!parts.bottomNote
			) {
				this.advance();
				continue;
			}

			const words = parts.cleanWord?.split(" ");
			const marking: any = {
				start: this.textPosition,
				end:
					words?.length > 1 ? this.textPosition + words.length - 1 : undefined,
				type: parts.type,
				topNote: parts.topNote?.split("/"),
				bottomNote: parts.bottomNote?.split("/"),
			};

			if (parts.offset) marking.to = this.textPosition + parseInt(parts.offset);

			if (parts.annotationType === "zin") {
				marking.type = "zin";

				if (parts.annotationValue.startsWith("||")) {
					marking.streep = "dubbel";
					parts.annotationValue = parts.annotationValue.slice(2);
				} else if (parts.annotationValue.startsWith("|")) {
					marking.streep = "enkel";
					parts.annotationValue = parts.annotationValue.slice(1);
				}

				marking.zin = parts.annotationValue[0];
				const nummer = parts.annotationValue.slice(1);
				if (nummer) marking.nummer = parseInt(nummer);
			} else if (parts.annotationType === "c") {
				marking.type = "constructie";

				if (parts.annotationValue.endsWith(".")) {
					marking.close = true;
					parts.annotationValue = parts.annotationValue.slice(0, -1);
				}
				marking.constructie = parts.annotationValue;
			} else if (parts.type === "nw" || parts.type === "ovw") {
				if (parts.value?.endsWith(".")) {
					marking.participium = true;
					parts.value = parts.value?.slice(0, -1);
				}
				marking.naamval = parts.value?.slice(0, 3);
				marking.hoofdfunctie = !parts.value?.endsWith("_");
			} else if (parts.type === "ww") {
				marking.persoonsvorm = !parts.value || parts.value === "ow";
				marking.onderwerp = parts.value === "ow";
			}

			markings.push(marking);
			if (words) {
				this.advance(words.length, true);
			} else this.advance(1, false);
		}

		return { text: cleanText, markings };
	}
}
