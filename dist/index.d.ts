/*!
 * QwickMaffs 0.3.0 by edave64
 * Released under the MIT license: https://github.com/edave64/qwick-maffs/blob/main/LICENCE
 */
declare const QwickMaffs: {
    DefaultOptions: QMOpts;
    Error: {
        readonly UnbalancedParenthesis: 1;
        readonly UnexpectedSymbol: 2;
        readonly IncorrectNumberOfParameters: 4;
        readonly MultipleNumbers: 8;
        readonly NoNumbers: 16;
    };
    /**
     * Takes a string containing either a number or a simple numeric expression
     */
    exec: typeof exec;
    convert: typeof convert;
};
declare function exec(str: string, opts?: Partial<QMOpts>): number | QMError;
declare function convert(value: number | QMValue, unit: null, units: QMUnit[]): number;
declare function convert(value: number | QMValue, unit: QMUnit, units: QMUnit[]): QMValue;
export default QwickMaffs;
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
     * Set like this: `ignoreErrors: QwickMaffs.Error.UnbalancedParenthesis | QwickMaffs.Error.NoNumbers`
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
    /**
     *
     */
    units: QMUnit[];
}
export type QMValue = {
    value: number;
    unit: QMUnit;
};
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
type QMUnit = {
    name: string;
    from: Record<string, number>;
} & ({
    si: true;
} | {
    alias: Record<string, number>;
});
