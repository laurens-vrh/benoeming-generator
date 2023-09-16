import { options } from "options.js";
import { Marking } from "src/markings.js";

export const input: {
	theme: keyof typeof options.themes;
	text: string;
	markings: Marking[];
} = {
	theme: "pastel",
	text: "Ego beatus sum. ".repeat(10),

	markings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0].flatMap((_, i) => [
		{
			type: "zin",
			start: i * 3 + 0,
			zin: "H",
			nummer: 1,
		},
		{
			type: "naamwoord",
			start: i * 3 + 0,
			naamval: "nom",
			hoofdfunctie: true,
			getal: "ev",
			geslacht: "m",
		},
		{
			type: "naamwoord",
			start: i * 3 + 1,
			end: i * 3 + 1,
			naamval: "nom",
			hoofdfunctie: false,
			notitie: "nw.d.",
			getal: "ev",
			geslacht: "m",
		},
		{
			type: "werkwoord",
			start: i * 3 + 2,
			modus: "ind",
			tijd: "pr",
			persoon: "1e",
			getal: "ev",
			genus: "A",
			rollen: 1,
		},
		{
			type: "zin",
			start: i * 3 + 2,
			streep: "dubbel",
		},
	]),
};
