/*!
 * QwickMaffs 0.5.0 by edave64
 * Released under the MIT license: https://github.com/edave64/qwick-maffs/blob/main/LICENCE
 */
export declare const DefaultOptions: QMOpts;
export declare const Errors: {
    readonly UnbalancedParenthesis: 1;
    readonly UnexpectedSymbol: 2;
    readonly IncorrectNumberOfParameters: 4;
    readonly MultipleNumbers: 8;
    readonly NoNumbers: 16;
    readonly All: 31;
};
export declare function exec(str: string, opts?: Partial<QMOpts>): number | QMError;
export interface QMOpts {
    /**
     * The allowed decimal separator. This must always be a single character in length.
     */
    decimalSep: RegExp | string;
    /**
     * If true, e-notation (like 4.5e5) is supported.
     */
    supportENotation: boolean;
    /**
     * The errors that will be silently ignored.
     * Set like this: `ignoreErrors: Errors.UnbalancedParenthesis | Errors.NoNumbers`
     */
    ignoreErrors: number;
    /**
     * A list of operators supported.
     */
    operators: QMOp[];
    /**
     * An object containing all the constants available. All keys must be
     * lowercase, casing in the input is forced to lowercase.
     */
    constants: Record<string, number>;
    /**
     * An object containing all functions available. All keys must be
     * lowercase, casing in the input is forced to lowercase.
     * Functions are called by their name followed by parenthesis with the
     * parameters.
     */
    functions: Record<string, (...nums: number[]) => number>;
}
export type QMError = {
    error: number;
    pos: number;
    len: number;
};
export type QMOp = {
    op: string;
    assoc: 'right' | 'left' | 'prefix' | 'suffix';
    precedence: number;
    apply: ((num: number) => number) | ((x: number, y: number) => number);
};
