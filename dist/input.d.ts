import { type QMError, type QMOpts } from './index.js';
export declare function bind(input: HTMLInputElement, opts?: Partial<QMOpts> & {
    noUndo?: boolean;
    onError?: (error: Error) => void;
    onValueChange?: (val: number) => void;
    onUndo?: (prev: string) => void;
}): QMInputElement;
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
    addEventListener<K extends keyof QMInputElementEventMap>(type: K, listener: (this: QMInputElement, ev: QMInputElementEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof QMInputElementEventMap>(type: K, listener: (this: QMInputElement, ev: QMInputElementEventMap[K]) => unknown, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
interface QMInputElementEventMap extends HTMLElementEventMap {
    qmerror: CustomEvent<Error>;
    qmvaluechange: CustomEvent<number>;
    qmundo: CustomEvent<string>;
}
export {};
