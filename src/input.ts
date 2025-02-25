import { exec, type QMError, type QMOpts } from './index.js';

export function bind(
	input: HTMLInputElement,
	opts: Partial<QMOpts> & {
		noUndo?: boolean;
		onError?: (error: Error) => void;
		onValueChange?: (val: number) => void;
		onUndo?: (prev: string) => void;
	} = {},
): QMInputElement {
	const qmInput = input as QMInputElement;
	let oldValue = '';
	let errorValue: string | null = null;
	if (!opts.noUndo) {
		input.addEventListener('focus', () => {
			if (input.value === errorValue) {
				// Save the previous value of the input so it can be reset using the escape key
				oldValue = input.value;
			}
		});
	}
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			apply();
		} else if (!opts.noUndo && e.key === 'Escape') {
			const previous = input.value;
			input.value = oldValue;
			input.dispatchEvent(
				new CustomEvent<string>('qmundo', { detail: previous }),
			);
		}
	});
	input.addEventListener('blur', (e) => {
		apply();
	});

	const onError = opts.onError;
	if (onError) {
		qmInput.addEventListener('qmerror', (e) => onError(e.detail));
	}

	const onValueChange = opts.onValueChange;
	if (onValueChange) {
		qmInput.addEventListener('qmvaluechange', (e) => onValueChange(e.detail));
	}

	const onUndo = opts.onUndo;
	if (onUndo) {
		qmInput.addEventListener('qmundo', (e) => onUndo(e.detail));
	}

	return qmInput;

	function apply() {
		const strValue = input.value;
		const result = exec(strValue);
		if (typeof result === 'number') {
			errorValue = null;
			input.value = `${result}`;
			oldValue = input.value;
			input.dispatchEvent(
				new CustomEvent<number>('qmvaluechange', { detail: result }),
			);
		} else {
			errorValue = strValue;
			const errorObj: Error = {
				...result,
				region: [
					strValue.slice(0, result.pos),
					strValue.slice(result.pos, result.pos + result.len),
					strValue.slice(result.pos + result.len),
				],
			};
			input.dispatchEvent(
				new CustomEvent<Error>('qmerror', { detail: errorObj }),
			);
		}
	}
}

export interface Error extends QMError {
	/**
	 * An array containing 3 strings. The code before, at, and after the error.
	 */
	region: [string, string, string];
}

/**
 * Extends the regular HTMLInputElement with new events
 */
interface QMInputElement extends HTMLInputElement {
	addEventListener<K extends keyof QMInputElementEventMap>(
		type: K,
		listener: (this: QMInputElement, ev: QMInputElementEventMap[K]) => unknown,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void;
	removeEventListener<K extends keyof QMInputElementEventMap>(
		type: K,
		listener: (this: QMInputElement, ev: QMInputElementEventMap[K]) => unknown,
		options?: boolean | EventListenerOptions,
	): void;
	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	): void;
}

interface QMInputElementEventMap extends HTMLElementEventMap {
	qmerror: CustomEvent<Error>;
	qmvaluechange: CustomEvent<number>;
	qmundo: CustomEvent<string>;
}
