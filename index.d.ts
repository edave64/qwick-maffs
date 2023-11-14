/**
 * The default options that are used when an option is not provided in the exec call
 */
export declare const DefaultOptions: Options;
/**
 * The types of errors that may be returned from the exec call
 */
export declare enum Error {
	UnbalancedParenthesis = 1,
	UnexpectedSymbol = 2,
	IncorrectNumberOfParameters = 4,
	MultipleNumbers = 8,
	NoNumbers = 16,
}
/**
 * Takes a string containing either a number or a simple numeric expression
 *
 * @param str - A simple arithmetic expression
 * @param [opts] - Configuration
 * @returns A number if the expression was successfully executed, otherwise an error object
 */
export declare function exec(str: string, opts: Options): number | IError;

declare interface Options {
	/**
	 * The allowed decimal separator. This must always be a single character in length.
	 */
	decimalSep: RegExp | String;
	/**
	 * If true, e-notation (like 4.5e5) is supported.
	 */
	supportENotation: true;
}

declare interface IError {
	/**
	 * The type of error that occurred
	 */
	type: Error;
	/**
	 * The position where the error occurred
	 */
	pos: number;
}
