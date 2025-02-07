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
				num: 1,
				precedence: 1,
				apply: function (num) {
					return num;
				},
			},
			{
				op: '-',
				ass: 'prefix',
				num: 1,
				precedence: 1,
				apply: function (num) {
					return -num;
				},
			},
			{
				op: '^',
				ass: 'left',
				num: 2,
				precedence: 2,
				apply: function (x, y) {
					return Math.pow(x, y);
				},
			},
			{
				op: '²',
				ass: 'suffix',
				num: 1,
				precedence: 2,
				apply: function (num) {
					return Math.pow(num, 2);
				},
			},
			{
				op: '³',
				ass: 'suffix',
				num: 1,
				precedence: 2,
				apply: function (num) {
					return Math.pow(num, 3);
				},
			},
			{
				op: '*',
				ass: 'left',
				num: 2,
				precedence: 3,
				apply: function (x, y) {
					return x * y;
				},
			},
			{
				op: '/',
				ass: 'left',
				num: 2,
				precedence: 3,
				apply: function (x, y) {
					return x / y;
				},
			},
			{
				op: '+',
				ass: 'left',
				num: 2,
				precedence: 4,
				apply: function (x, y) {
					return x + y;
				},
			},
			{
				op: '-',
				ass: 'left',
				num: 2,
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
	 * @return {number|{error: number, pos: number}} - A number if the expression was successfully executed, otherwise an error object
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
		var tokens = tokenize(str, opts);
		// Propagate error
		if (!(tokens instanceof Array)) return tokens;
		return execTokenList(tokens, opts);
	},
};

/**
 * Takes an input strings and returns a list of tokens, in the form of js numbers for numbers, strings for operators
 * and arrays of more tokens where there were parentheses
 *
 * @param {string} str
 * @param {typeof QwickMaffs.DefaultOptions} opts
 * @return {TokenList | {error: number, pos: number}}
 * @private
 */
function tokenize(str, opts) {
	// To parse parentheses without recursion, an opening parenthesis pushes the currentList of tokens onto the
	// stack and creates a new, child currentList. A closing parenthesis then pops the currentList back from the
	// stack
	/** @type {TokenList} */
	var currentList = [];

	/** @type {TokenList[]} */
	var stack = [];
	var ops = new Set(
		opts.operators.map(function (x) {
			return x.op;
		})
	);

	for (var i = 0; i < str.length; ++i) {
		if (whitespaceReg.test(str[i])) continue;
		if (ops.has(str[i])) {
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
 * @param {TokenList} tokens
 * @param {typeof QwickMaffs.DefaultOptions} [opts]
 * @param {typeof QwickMaffs.DefaultOptions} [opts]
 * @return {number|{error: number, pos: number}}
 * @private
 */
function execTokenList(tokens, opts) {
	/** @type {Record<string, Op[]>} */
	var lookup = {};

	var operators = opts.operators;
	for (var iOp = 0; iOp < operators.length; iOp++) {
		var op = operators[iOp];
		if (!lookup[op.op]) {
			lookup[op.op] = [];
		}
		lookup[op.op].push(op);
	}

	/** @type {{val:Op | number, pos: number }[]} */
	var output = [];
	/** @type {({val:Op, pos: number })[]} */
	var operatorStack = [];
	var canPrefix = true;

	for (var i = 0; i < tokens.length; ++i) {
		var token = tokens[i];
		if (token instanceof Array) {
			var ret = execTokenList(/** @type {TokenList} */ token, opts);
			if (typeof ret === 'object') {
				return ret;
			}
			output.push({ val: ret, pos: token.pos });
			canPrefix = false;
		} else if (typeof token.value === 'string') {
			// Intelligently select prefix, suffix or infix
			var ops = lookup[token.value];
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
						output.push(operatorStack.pop());
					} else {
						break;
					}
				}
				operatorStack.push({ val: op, pos: token.pos });
				canPrefix = op.ass === 'prefix';
			} else {
				// Error?
			}
		} else if (typeof token.value === 'number') {
			output.push({ val: token.value, pos: token.pos });
			canPrefix = false;
		}
	}

	while (operatorStack.length > 0) {
		output.push(operatorStack.pop());
	}

	/** @type {{val:number, pos: number}[]} */
	var stack = [];

	for (i = 0; i < output.length; ++i) {
		var current = output[i];
		if (typeof current.val === 'number') {
			stack.push(current);
		} else {
			var func = current.val.apply;
			var needed = func.length;
			if (stack.length < needed) {
				return {
					error: QwickMaffs.Error.IncorrectNumberOfParameters,
					pos: current.pos,
				};
			} else {
				var data = stack
					.splice(stack.length - needed, needed)
					.map(function (x) {
						return x.val;
					});
				stack.push({ val: func.apply(null, data), pos: current.pos });
			}
		}
	}

	if (stack.length > 1) {
		if (opts.ignoreErrors & QwickMaffs.Error.MultipleNumbers) {
			return stack.reduce(function (a, b) {
				return a * b.val;
			}, 1);
		} else {
			return {
				error: QwickMaffs.Error.MultipleNumbers,
				pos: stack[1].pos,
			};
		}
	}
	if (stack.length === 0) {
		return {
			error: QwickMaffs.Error.NoNumbers,
			pos: tokens.pos || 0,
		};
	}
	return stack[0].val;
}

/**
 * @typedef {({value: number | string, pos: number}|QMToken[])} QMToken
 */

/** @typedef {(QMToken|TokenList)[] & {pos: number}} TokenList */

/**
 * @typedef {{ op: string, ass: 'right' | 'left' | 'prefix' | 'suffix', precedence: number, apply: ((num: number) => number) | ((x: number, y: number) => number)}} Op
 */

var numberReg = /^\d+/;
var eReg = /^e[+-]?\d+/i;
var whitespaceReg = /\s/g;
