export const options = {
	width: 700,

	font: "Times New Roman",
	fontSize: 20,
	noteFont: "Arial",
	noteFontSize: 12,

	padding: 10,
	linePadding: 75,
	highlightPadding: 2,

	theme: "default" as "default" | "pastel",
	themes: {
		default: {
			text: "black",
			benoeming: "#750000",
			nom: "#00ccff",
			gen: "#ff6600",
			dat: "#e5ff00",
			acc: "#26ff00",
			abl: "#ff00b3",
			voc: "#8400ff",
		},
		pastel: {
			text: "black",
			benoeming: "#750000",
			nom: "#8adfff",
			gen: "#ff9763",
			dat: "#fffc63",
			acc: "#9cff63",
			abl: "#ff9ef1",
			voc: "#ca69ff",
		},
	},
};
