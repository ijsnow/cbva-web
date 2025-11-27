import type {
	ParagraphNode,
	SerializedEditorState,
	SerializedLexicalNode,
	SerializedParagraphNode,
	SerializedTextNode,
} from "lexical";
import { uniqBy } from "lodash-es";
import { db } from "../connection";
import type { beaches } from "../legacy/schema/tables";
import { type Venue, venues } from "../schema";

export async function getVenuesCache() {
	return (await db.select().from(venues)).reduce((memo, venue) => {
		memo.set(venue.externalRef as string, venue.id);

		return memo;
	}, new Map<string, number>());
}

function toLexicalStructure(input: string): SerializedEditorState {
	const state: SerializedEditorState = {
		root: {
			children: [],
			direction: null,
			format: "",
			indent: 0,
			type: "root",
			version: 1,
		},
	};

	// {
	//   "root": {
	//     "children": [
	//       [
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "From the 105 West freeway/Imperial Hwy:",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         },
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "Go South on Vista Del Mar about 1/4 mile to the 2nd traffic light and turn into the parking lot. The location is also the El Segundo Youth Center. You can google that in your phone GPS.",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         },
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         },
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         },
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "Parking lot will be on the right hand side;  Park in pay lot and courts are just in front of it. 12501 Vista Del Mar",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         },
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "Playa del Rey, CA 90293",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         },
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         },
	//         {
	//           "children": [
	//             {
	//               "detail": 0,
	//               "format": 0,
	//               "mode": "normal",
	//               "style": "",
	//               "text": "The location also has the El Segundo Beach Cafe which opens at 10am for breakfast and lunch. Great menu items! A menu will be at the tournament board for calling ahead for food to go!",
	//               "type": "text",
	//               "version": 1
	//             }
	//           ],
	//           "direction": null,
	//           "format": "",
	//           "indent": 0,
	//           "type": "paragraph",
	//           "version": 1,
	//           "textFormat": 0,
	//           "textStyle": ""
	//         }
	//       ]
	//     ],
	//     "direction": null,
	//     "format": "",
	//     "indent": 0,
	//     "type": "root",
	//     "version": 1
	//   }
	// }

	for (const p of input.split("\n")) {
		const textNode: SerializedTextNode = {
			detail: 0,
			format: 0,
			mode: "normal",
			style: "",
			text: p,
			type: "text",
			version: 1,
		};

		const paragraphNode: SerializedParagraphNode = {
			children: [textNode],
			direction: null,
			format: "",
			indent: 0,
			type: "paragraph",
			version: 1,
			textFormat: 0,
			textStyle: "",
		};

		state.root.children.push(paragraphNode);
	}

	return state;

	// const paragraphs: SerializedLexicalNode[] = input.split("\n").map((p) => ({
	//   children: [
	//     {
	//       detail: 0,
	//       format: 0,
	//       mode: "normal",
	//       style: "",
	//       text: p,
	//       type: "text",
	//       version: 1,
	//     },
	//   ],
	//   direction: null,
	//   format: "",
	//   indent: 0,
	//   type: "paragraph",
	//   version: 1,
	//   textFormat: 0,
	//   textStyle: "",
	// }));

	// return {
	//   root: {
	//     children: [paragraphs],
	//     direction: null,
	//     format: "",
	//     indent: 0,
	//     type: "root",
	//     version: 1,
	//   },
	// };
}

export async function createVenueFromBeach(
	beach: typeof beaches.$inferSelect,
): Promise<number> {
	console.log(`creating new venue: ${beach.name}, ${beach.city}`);

	const [venue] = await db
		.insert(venues)
		.values({
			slug: beach.url,
			name: beach.name,
			city: beach.city,
			status: beach.status.toLowerCase() as Venue["status"],
			description: toLexicalStructure(beach.description),
			directions: toLexicalStructure(beach.directions),
			mapUrl: beach.googleMapsLink,
			externalRef: beach.id,
		})
		.returning({ id: venues.id });

	return venue.id;
}

export async function createVenuesFromBeaches(
	beach: (typeof beaches.$inferSelect)[],
	venueCache: Map<string, number>,
): Promise<Map<string, number>> {
	const rows = await db
		.insert(venues)
		.values(
			uniqBy(beach, (b) => b.id).map((beach) => ({
				slug: beach.shortName,
				name: beach.name,
				city: beach.city,
				status: beach.status.toLowerCase() as Venue["status"],
				description: toLexicalStructure(beach.description),
				directions: toLexicalStructure(beach.directions),
				mapUrl: beach.googleMapsLink,
				externalRef: beach.id,
			})),
		)
		.onConflictDoNothing()
		.returning({ id: venues.id, externalRef: venues.externalRef });

	return rows.reduce((memo, row) => {
		memo.set(row.externalRef as string, row.id);

		return memo;
	}, venueCache);
}
