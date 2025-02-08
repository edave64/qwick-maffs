define([], function () {
// noinspection JSUnusedGlobalSymbols
/*!
 * QwickMaffs 0.1.0 by edave64
 * Released under the MIT license: https://github.com/edave64/qwick-maffs/blob/main/LICENCE
 */
var QwickMaffs = {
	DefaultOptions: {
		/**
		 * The allowed decimal separator. This must always be a single character in length.
		 * @type {RegExp | String}
		 */
		decimalSep: /[,.]/,
		/**
		 * If true, e-notation (like 4.5e5) is supported.
		 */
		supportENotation: true,
		/**
		 * The errors that will be silently ignored. Set like this: `ignoreErrors: QwickMaffs.Error.UnbalancedParenthesis | QwickMaffs.Error.NoNumbers`
		 */
		ignoreErrors: 0,
		/**
		 * @type {Op[]}
		 */
		operators: [
			{
				op: '+',
				ass: 'prefix',
				precedence: 1,
				apply: function (num) {
					return num;
				},
			},
			{
				op: '-',
				ass: 'prefix',
				precedence: 1,
				apply: function (num) {
					return -num;
				},
			},
			{
				op: '^',
				ass: 'left',
				precedence: 2,
				apply: function (x, y) {
					return Math.pow(x, y);
				},
			},
			{
				op: '²',
				ass: 'suffix',
				precedence: 2,
				apply: function (num) {
					return Math.pow(num, 2);
				},
			},
			{
				op: '³',
				ass: 'suffix',
				precedence: 2,
				apply: function (num) {
					return Math.pow(num, 3);
				},
			},
			{
				op: '*',
				ass: 'left',
				precedence: 3,
				apply: function (x, y) {
					return x * y;
				},
			},
			{
				op: '/',
				ass: 'left',
				precedence: 3,
				apply: function (x, y) {
					return x / y;
				},
			},
			{
				op: '+',
				ass: 'left',
				precedence: 4,
				apply: function (x, y) {
					return x + y;
				},
			},
			{
				op: '-',
				ass: 'left',
				precedence: 4,
				apply: function (x, y) {
					return x - y;
				},
			},
		],
	},
	Error: {
		UnbalancedParenthesis: 1,
		UnexpectedSymbol: 2,
		IncorrectNumberOfParameters: 4,
		MultipleNumbers: 8,
		NoNumbers: 16,
	},
	/**W
	 * Takes a string containing either a number or a simple numeric expression
	 *
	 * @param {string} str - A simple arithmetic expression
	 * @param {typeof QwickMaffs.DefaultOptions} [opts] - Configuration
	 * @return {number|QMError} - A number if the expression was successfully executed, otherwise an error object
	 */
	exec: function (str, opts) {
		if (!opts) opts = QwickMaffs.DefaultOptions;
		else {
			for (var key in QwickMaffs.DefaultOptions) {
				if (!Object.prototype.hasOwnProperty.call(opts, key)) {
					opts[key] = QwickMaffs.DefaultOptions[key];
				}
			}
		}
		var ops = optimizeOps(opts.operators);
		var tokens = tokenize(str, ops, opts);
		// Propagate error
		if (!(tokens instanceof Array)) return tokens;
		return execTokenList(tokens, ops, opts);
	},
};

/**
 * Takes an input strings and returns a list of tokens, in the form of js numbers for numbers, strings for operators
 * and arrays of more tokens where there were parentheses
 *
 * @param {string} str
 * @param {Record<string, Op[]>} operators
 * @param {typeof QwickMaffs.DefaultOptions} opts
 * @return {TokenList | QMError}
 * @private
 */
function tokenize(str, operators, opts) {
	// To parse parentheses without recursion, an opening parenthesis pushes the currentList of tokens onto the
	// stack and creates a new, child currentList. A closing parenthesis then pops the currentList back from the
	// stack
	var currentList = /** @type {TokenList} */ [];
	currentList.pos = 0;

	/** @type {TokenList[]} */
	var stack = [];
	var ops = Object.keys(operators);

	for (var i = 0; i < str.length; ++i) {
		if (whitespaceReg.test(str[i])) continue;
		if (ops.indexOf(str[i]) !== -1) {
			currentList.push({ value: str[i], pos: i });
			continue;
		}
		switch (str[i]) {
			case '(':
				var newList = /** @type {TokenList} */ [];
				newList.pos = i;
				currentList.push(newList);
				stack.push(currentList);
				currentList = newList;
				break;
			case ')':
				if (stack.length === 0) {
					if (opts.ignoreErrors & QwickMaffs.Error.UnbalancedParenthesis) {
						// Move all already parsed elements into a sub-expression.
						currentList = /** @type {TokenList} */ [currentList];
						currentList.pos = currentList[0].pos;
					} else {
						return {
							error: QwickMaffs.Error.UnbalancedParenthesis,
							pos: i,
						};
					}
				} else {
					currentList = stack.pop();
				}
				break;
			default:
				// No operator, no parens -> Must be number
				var match = str.substring(i).match(numberReg);
				var num = '';
				if (match && match.index === 0) {
					i += match[0].length;
					num = match[0];
				} else {
					match = null;
				}
				if (
					opts.decimalSep instanceof RegExp
						? opts.decimalSep.test(str[i])
						: opts.decimalSep === str[i]
				) {
					num += '.';
					i += 1;
					match = str.substring(i).match(numberReg);
					// The decimal sep wasn't followed by a number. This isn't a number.
					if (!match || match.index !== 0) {
						if (opts.ignoreErrors & QwickMaffs.Error.UnexpectedSymbol) {
							continue;
						} else {
							return {
								error: QwickMaffs.Error.UnexpectedSymbol,
								pos: i,
							};
						}
					}
					num += match[0];
					i += match[0].length;
				} else if (!match) {
					// We neither found a decimal sep, nor a number. This isn't a number.
					if (opts.ignoreErrors & QwickMaffs.Error.UnexpectedSymbol) {
						continue;
					} else {
						return {
							error: QwickMaffs.Error.UnexpectedSymbol,
							pos: i,
						};
					}
				}
				if (opts.supportENotation) {
					var eMatch = str.substring(i).match(eReg);
					if (eMatch && match.index === 0) {
						num += eMatch[0];
						i += eMatch[0].length;
					}
				}
				currentList.push({ value: parseFloat(num), pos: i - num.length });
				i--;

				break;
		}
	}
	if (stack.length !== 0) {
		if (opts.ignoreErrors & QwickMaffs.Error.UnbalancedParenthesis) {
			return stack[0];
		}
		return {
			error: QwickMaffs.Error.UnbalancedParenthesis,
			pos: i,
		};
	}
	return currentList;
}

/**
 * Takes a string containing either a number or a simple numeric expression
 *
 * @param {TokenList} tokens
 * @param {Record<string, Op[]>} operators
 * @param {typeof QwickMaffs.DefaultOptions} opts
 * @return {number|{error: number, pos: number}}
 * @private
 */
function execTokenList(tokens, operators, opts) {
	/** @type {number[]} */
	var numberStack = [];

	// The token position of the second number on the stack (Index 1)
	// This is the position of the multiple numbers error, should it be fired.
	// As random as it seems to track this, it saves us from saving all the
	// positions
	var secondPos = -1;

	/** @type {({val:Op, pos: number })[]} */
	var operatorStack = [];
	var canPrefix = true;
	var error = null;

	for (var i = 0; i < tokens.length; ++i) {
		var token = tokens[i];
		if (token instanceof Array) {
			var ret = execTokenList(/** @type {TokenList} */ token, operators, opts);
			if (typeof ret === 'object') {
				return ret;
			}
			pushOnStack(ret, token.pos);
			canPrefix = false;
		} else if (typeof token.value === 'string') {
			// Intelligently select prefix, suffix or infix
			var ops = operators[token.value];
			var op = canPrefix
				? ops.filter(function (x) {
						return x.ass === 'prefix';
					})[0]
				: ops.filter(function (x) {
						return x.ass !== 'prefix';
					})[0];
			if (!op) {
				// TODO: Pretty sure whenever this is invoked, there is a not enough
				//       number error.
				op = ops[0];
			}
			if (op) {
				while (operatorStack.length > 0) {
					var previous = operatorStack[operatorStack.length - 1].val;
					if (
						previous.precedence < op.precedence ||
						(previous.precedence === op.precedence && previous.ass === 'left')
					) {
						if ((error = execOp(previous, operatorStack.pop().pos)))
							return error;
					} else {
						break;
					}
				}
				operatorStack.push({ val: op, pos: token.pos });
				canPrefix = op.ass !== 'suffix';
			} else {
				// Error?
			}
		} else if (typeof token.value === 'number') {
			pushOnStack(token.value, token.pos);
			canPrefix = false;
		}
	}

	for (i = operatorStack.length - 1; i >= 0; --i) {
		op = operatorStack[i];
		if ((error = execOp(op.val, op.pos))) return error;
	}

	if (numberStack.length > 1) {
		if (opts.ignoreErrors & QwickMaffs.Error.MultipleNumbers) {
			return numberStack.reduce(function (a, b) {
				return a * b;
			});
		} else {
			return {
				error: QwickMaffs.Error.MultipleNumbers,
				pos: secondPos,
			};
		}
	}
	if (numberStack.length === 0) {
		return {
			error: QwickMaffs.Error.NoNumbers,
			pos: tokens.pos || 0,
		};
	}
	return numberStack[0];

	/**
	 * @param {number} x
	 * @param {number} pos
	 */
	function pushOnStack(x, pos) {
		numberStack.push(x);
		if (numberStack.length === 2) {
			secondPos = pos;
		}
	}

	/**
	 * @param {Op} op
	 * @param {number} pos
	 * @return {QMError|undefined}
	 */
	function execOp(op, pos) {
		var func = op.apply;
		var needed = func.length;
		if (numberStack.length < needed) {
			return {
				error: QwickMaffs.Error.IncorrectNumberOfParameters,
				pos: pos,
			};
		} else {
			var data = numberStack.splice(numberStack.length - needed, needed);
			pushOnStack(func.apply(null, data), pos);
		}
	}
}

/**
 * @param {Op[]} ops
 * @return {Record<string, Op[]>}
 */
function optimizeOps(ops) {
	var lookup = /** @type {Record<string, Op[]>} */ {};

	for (var iOp = 0; iOp < ops.length; iOp++) {
		var op = ops[iOp];
		if (!lookup[op.op]) {
			lookup[op.op] = [];
		}
		lookup[op.op].push(op);
	}

	return lookup;
}

/**
 * @typedef {({value: number | string, pos: number}|QMToken[])} QMToken
 */

/** @typedef {(QMToken|TokenList)[] & {pos: number}} TokenList */

/** @typedef {{error: number, pos: number}} QMError */

/**
 * @typedef {{ op: string, ass: 'right' | 'left' | 'prefix' | 'suffix', precedence: number, apply: ((num: number) => number) | ((x: number, y: number) => number)}} Op
 */

var numberReg = /^\d+/;
var eReg = /^e[+-]?\d+/i;
var whitespaceReg = /\s/g;

return QwickMaffs;
})