// noinspection JSUnusedGlobalSymbols
var numberReg = /^\d+?/;
var eReg = /^e[+-]?\d+/i;
var whitespaceReg = /\s/g;
var QwickMaffs= {
    defaultOptions: {
        decimalSep: /[,.]/,
        supportENotation: true
    },
    Error: {
        UnbalancedParentesis: 0,
        UnexpectedSymbol: 1,
        IncorrectNumberOfParameters: 2,
        MultipleNumbers: 3,
        NoNumbers: 4
    },
    precedence: {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2,
        '^': 3,
        '²': 3,
        '³': 3
    },
    /**
     * Takes a string containing either a number or a simple numeric expression
     * @param {string} str
     * @param {typeof QwickMaffs.defaultOptions} [opts]
     * @return {number|{error: number, pos: number}}
     */
    exec: function (str, opts) {
        if (!opts) opts = QwickMaffs.defaultOptions;
        else {
            for (var key in QwickMaffs.defaultOptions) {
                if (!Object.prototype.hasOwnProperty.call(opts, key)) {
                    opts[key] = QwickMaffs.defaultOptions[key];
                }
            }
        }
        var tokens = QwickMaffs._tokenize(str, opts);
        // Propagate error
        if (!(tokens instanceof Array)) return tokens;
        return this._execTokenList(tokens);
    },
    /**
     * Takes an input strings and returns a list of tokens, in the form of js numbers for numbers, strings for operators
     * and arrays of more tokens where there were parenthesis
     *
     * @param {string} str
     * @param {typeof QwickMaffs.defaultOptions} [opts]
     * @return {QMToken[] | {error: number, pos: number}}
     */
    _tokenize: function (str, opts) {
        // To parse parentheses without recursion, an opening parenthesis pushes the currentList of tokens onto the
        // stack and creates a new, child currentList. A closing parenthesis then pops the currentList back from the
        // stack
        /** @type {QMToken[]} */
        var currentList = [];
        var stack = [];
        for (var i = 0; i < str.length; ++i) {
            if (whitespaceReg.test(str[i])) continue;
            switch (str[i]) {
                case '(':
                    var newList = [];
                    newList.pos = i;
                    currentList.push(newList);
                    stack.push(currentList);
                    currentList = newList;
                    break;
                case ')':
                    if (stack.length === 0) {
                        return {
                            error: QwickMaffs.Error.UnbalancedParentesis,
                            pos: i
                        }
                    }
                    currentList = stack.pop();
                    break;
                case '+':
                case '-':
                case '*':
                case '/':
                case '^':
                case '²':
                case '³':
                    currentList.push({value: str[i], pos: i});
                    break;
                default:
                    var match = str.substring(i).match(numberReg);
                    var num = '';
                    if (match && match.index === 0) {
                        i += match[0].length;
                        num = match[0]
                    } else {
                        match = null;
                    }
                    if (opts.decimalSep instanceof RegExp ? opts.decimalSep.test(str[i]) : opts.decimalSep === str[i]) {
                        num += ".";
                        i += 1;
                        match = str.substring(i).match(numberReg);
                        // The decimal sep wasn't followed by a number. This isn't a number.
                        if (!match || match.index !== 0) {
                            return {
                                error: QwickMaffs.Error.UnexpectedSymbol,
                                pos: i
                            }
                        }
                        num += match[0];
                        i += match[0].length;
                    } else if (!match) {
                        // We neither found a decimal sep, nor a number. This isn't a number.
                        return {
                            error: QwickMaffs.Error.UnexpectedSymbol,
                            pos: i
                        }
                    }
                    if (opts.supportENotation) {
                        var eMatch = str.substring(i).match(eReg);
                        if (eMatch && match.index === 0) {
                            num += eMatch[0];
                            i += eMatch[0].length;
                        }
                    }
                    currentList.push({value: parseFloat(num), pos: i - num.length });
                    i--;

                    break;
            }
        }
        if (stack.length !== 0) {
            return {
                error: QwickMaffs.Error.UnbalancedParentesis,
                pos: i
            }
        }
        return currentList;
    },

    /**
     * Takes a string containing either a number or a simple numeric expression
     * @param {QMToken[]} tokens
     * @param {typeof QwickMaffs.defaultOptions} [opts]
     * @return {number|{error: number, pos: number}}
     */
    _execTokenList: function (tokens, opts) {
        var highestPrecedence = -1;
        for (var i = 0; i < tokens.length; ++i) {
            var token = tokens[i];
            if (token instanceof Array) {
                var ret = QwickMaffs._execTokenList(token);
                if (typeof ret === 'object') {
                    return ret;
                }
                tokens[i] = { value: ret, pos: token.pos };
                continue;
            }
            if (typeof token.value === 'string') {
                // Since precedence rules cause multiple scans of the token array, and the most common use is just
                // adding or subtracting things, or even no ops at all, we check for the highest precedence operation
                // first, when we need to resolve parens anyway. Then we can skip passes we don't need.
                var precedence = QwickMaffs.precedence[token.value];
                if (precedence > highestPrecedence) {
                    highestPrecedence = precedence;
                }
            }
        }
        for (precedence = highestPrecedence; precedence >= 1; --precedence) {
            for (i = 0; i < tokens.length; ++i) {
                var op;
                token = tokens[i];
                if (typeof token.value === 'number') continue;
                if (precedence === 3) {
                    op = {
                        '²': function (a) { return Math.pow(a, 2) },
                        '³': function (a) { return Math.pow(a, 3) },
                        '^': function (a, b) { return Math.pow(a, b) }
                    }[token.value];
                } else if (precedence === 2) {
                    op = {
                        '*': function (a, b) { return a * b; },
                        '/': function (a, b) { return a / b; }
                    }[token.value];
                } else if (precedence === 1) {
                    op = {
                        '+': function (a, b) { return a + b; },
                        '-': function (a, b) { return a - b; }
                    }[token.value];
                }
                if (!op) continue;
                var a = expectNumber(tokens[i - 1], token.pos);
                // Propagate error
                if (typeof a === 'object') return a;
                var b = 0;
                if (op.length > 1) {
                    b = expectNumber(tokens[i + 1], token.pos);
                    // Propagate error
                    if (typeof b === 'object') return b;
                    tokens.splice(i - 1, 3, { value: op(a, b), pos: token.pos });
                    --i;
                } else {
                    tokens.splice(i - 1, 2, { value: op(a), pos: token.pos });
                    --i;
                }
            }
        }
        if (tokens.length > 1) {
            return {
                error: QwickMaffs.Error.MultipleNumbers,
                pos: tokens[1].pos
            }
        }
        if (tokens.length === 0) {
            return {
                error: QwickMaffs.Error.NoNumbers,
                pos: tokens.pos
            }
        }
        return tokens[0].value;
    }

    /**
     * @typedef {({value: number | string, pos: number}|QMToken[])} QMToken
     */
};

/**
 * @param {QMToken} value
 * @param {number} pos
 * @returns {{error: number, pos: number} | number}
 */
function expectNumber(value, pos) {
    if (!value || typeof value.value !== 'number') return {
        error: QwickMaffs.Error.IncorrectNumberOfParameters,
        pos: pos
    }
    return value.value;
}

export default QwickMaffs;