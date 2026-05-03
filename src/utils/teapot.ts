import { IncomingMessage, ServerResponse } from 'http';
import { print } from './print';

// helper: roll a number in [1,418] and optionally send a teapot prank
export function teapotRoll(req: IncomingMessage, res: ServerResponse) {
	print(`Rolling teapot: ${req.method} ${req.url}`);
	// check for an RNG override header (Node lowercases headers). If present and valid,
	// use it as the roll result. Valid values are integers in [1, 418].
	let roll: number;
	const rawRng = req.headers && (req.headers['rng']);
	if (rawRng) {
		const val = Array.isArray(rawRng) ? rawRng[0] : rawRng;
		const parsed = parseInt(String(val), 10);
		if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 418) {
			print(`Using RNG override from header: ${parsed}`);
			roll = parsed;
		} else {
			roll = Math.floor(Math.random() * 418) + 1;
			print(`Invalid RNG override value: ${val}, rolled ${roll} instead ... `,'');
		}
	} else {
		roll = Math.floor(Math.random() * 418) + 1;
		print(`Rolled ${roll} ... `,'');
	}
	if (roll === 418) {
		print(`Congratulations! Rolled the teapot number ${418}!`);
		const headers = {
			'Content-Type': 'application/json',
			'RNG': String(roll)
		} as Record<string, string>;
		res.writeHead(418, headers);
		res.end(JSON.stringify({message: 'I am a Teapot!'}));
		return;
	}
	// Regular roll: do not send a response body here to avoid double-writing.
	// Set an informative header so callers can react, then return.
	print(`Rolled a regular number: ${roll}`);
	res.setHeader('RNG', String(roll));
	return;
}

