import { range } from "lodash-es";

// export function bytesToScore(input: string) {
//   if (input.length > 40) {
//     return null;
//   }

//   let bytes: number[];

//   try {
//     bytes = Array.from(Buffer.from(input, "base64"));
//   } catch {
//     return null;
//   }

//   if (bytes.length === 0) {
//     return null;
//   }

//   // Process all bytes consistently - check ALL bits for every byte
//   let a = 0;
//   let b = 0;

//   for (const byte of bytes) {
//     for (let i = 0; i < 8; i++) {
//       if ((byte & (1 << i)) === 0) {
//         a++;
//       } else {
//         b++;
//       }
//     }
//   }

//   return [a, b];
// }

export function bytesToScore1(input: string) {
	if (input.length > 40) {
		return null;
	}

	let bytes: number[];

	try {
		// Remove hex processing - only handle base64 like Rust
		bytes = Array.from(Buffer.from(input, "base64"));
	} catch {
		return null;
	}

	// let bytes: number[];

	// try {
	//   bytes = input.match(/\\x/g)
	//     ? Array.from(
	//         Buffer.from(
	//           Buffer.from(input.replace(/\\x/g, ""), "hex").toString("ascii"),
	//           "base64",
	//         ),
	//       )
	//     : Array.from(Buffer.from(input, "base64"));

	//   // // Convert hex string to base64, then decode to bytes
	//   // const cleanHex = input.replace(/\\x/g, "");

	//   // const ascii = Buffer.from(cleanHex, "hex").toString("ascii");

	//   // console.log(ascii);

	//   // bytes = Array.from(Buffer.from(ascii, "base64"));
	// } catch {
	//   return null;
	// }

	const lastByte = bytes.pop();

	if (lastByte === undefined) {
		return null;
	}

	const [_byte, a, b] = range(0, 8).reduce<[number, number, number]>(
		([byte, a, b], _i) => {
			if (byte === 0b0 || byte === 0b10000000) {
				return [0, a, b];
			}
			if ((byte & 0b10000000) === 0b0) {
				return [byte << 1, a + 1, b];
			}
			return [byte << 1, a, b + 1];
		},
		[lastByte, 0, 0],
	);

	return bytes.reduce<[number, number]>(
		([a, b], byte) => {
			return range(0, 8).reduce<[number, number]>(
				([a, b], i) => {
					if ((byte & (1 << i)) === 0) {
						return [a + 1, b];
					}
					return [a, b + 1];
				},
				[a, b],
			);
		},
		[a, b],
	);
}

// ```rust
// use base64::{engine::general_purpose::STANDARD_NO_PAD, Engine as _};
//
// fn bytes_to_score(bytes: &String) -> Option<(i16, i16)> {
//     if bytes.len() > 40 {
//         return None;
//     }

//     let mut bytes = STANDARD_NO_PAD.decode(bytes).ok()?;

//     let (_, a, b) = bytes.pop().map(|byte| {
//         (0..8).into_iter().fold((byte, 0, 0), |(byte, a, b), i| {
//             if byte == 0b0 || byte == 0b10000000 {
//                 (0, a, b)
//             } else if (byte & 0b10000000) == 0b0 {
//                 (byte << 1, a + 1, b)
//             } else {
//                 (byte << 1, a, b + 1)
//             }
//         })
//     })?;

//     Some(bytes.into_iter().fold((a, b), |(a, b), byte| {
//         (0..8).into_iter().fold((a, b), |(a, b), i| {
//             if byte & (1 << i) == 0 {
//                 (a + 1, b)
//             } else {
//                 (a, b + 1)
//             }
//         })
//     }))
// }
// ```

export function bytesToScore(input: string) {
	if (input.length > 40) {
		return null;
	}

	let bytes: number[];

	try {
		bytes = Array.from(Buffer.from(input, "base64"));
	} catch {
		return null;
	}

	const lastByte = bytes.pop();

	if (lastByte === undefined) {
		return null;
	}

	// Process the last byte with special logic (matching Rust implementation)
	const [_byte, a, b] = range(0, 8).reduce<[number, number, number]>(
		([byte, a, b], _i) => {
			if (byte === 0b0 || byte === 0b10000000) {
				return [0, a, b];
			}
			if ((byte & 0b10000000) === 0b0) {
				return [(byte << 1) & 0xff, a + 1, b];
			}
			return [(byte << 1) & 0xff, a, b + 1];
		},
		[lastByte, 0, 0],
	);

	// Process remaining bytes normally
	return bytes.reduce<[number, number]>(
		([a, b], byte) => {
			return range(0, 8).reduce<[number, number]>(
				([a, b], i) => {
					if ((byte & (1 << i)) === 0) {
						return [a + 1, b];
					}
					return [a, b + 1];
				},
				[a, b],
			);
		},
		[a, b],
	);
}
