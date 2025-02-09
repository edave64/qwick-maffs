/*!
 * QwickMaffs 0.3.0 by edave64
 * Released under the MIT license: https://github.com/edave64/qwick-maffs/blob/main/LICENCE
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var numberReg = /^\d+/;
    var eReg = /^e[+-]?\d+/i;
    var whitespaceReg = /\s/g;
    var QwickMaffs = {
        DefaultOptions: {
            decimalSep: /[,.]/,
            supportENotation: true,
            ignoreErrors: 0,
            operators: [
                {
                    op: '+',
                    assoc: 'prefix',
                    precedence: 1,
                    apply: function (num) { return num; },
                },
                {
                    op: '-',
                    assoc: 'prefix',
                    precedence: 1,
                    apply: function (num) { return -num; },
                },
                {
                    op: '^',
                    assoc: 'left',
                    precedence: 2,
                    apply: function (x, y) { return Math.pow(x, y); },
                },
                {
                    op: '²',
                    assoc: 'suffix',
                    precedence: 2,
                    apply: function (num) { return Math.pow(num, 2); },
                },
                {
                    op: '³',
                    assoc: 'suffix',
                    precedence: 2,
                    apply: function (num) { return Math.pow(num, 3); },
                },
                {
                    op: '*',
                    assoc: 'left',
                    precedence: 3,
                    apply: function (x, y) { return x * y; },
                },
                {
                    op: '/',
                    assoc: 'left',
                    precedence: 3,
                    apply: function (x, y) { return x / y; },
                },
                {
                    op: '+',
                    assoc: 'left',
                    precedence: 4,
                    apply: function (x, y) { return x + y; },
                },
                {
                    op: '-',
                    assoc: 'left',
                    precedence: 4,
                    apply: function (x, y) { return x - y; },
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
        /**
         * Takes a string containing either a number or a simple numeric expression
         */
        exec: exec,
    };
    function exec(str, opts) {
        var normalizedOpts = normalizeOpts(opts);
        var ops = optimizeOps(normalizedOpts.operators);
        var tokens = tokenize(str, ops, normalizedOpts);
        // Propagate error
        if ('error' in tokens)
            return tokens;
        return execTokenList(tokens, ops, normalizedOpts);
    }
    function normalizeOpts(opts) {
        if (!opts)
            return QwickMaffs.DefaultOptions;
        return __assign(__assign({}, QwickMaffs.DefaultOptions), opts);
    }
    /**
     * Takes an input strings and returns a list of tokens, in the form of js numbers for numbers, strings for operators
     * and arrays of more tokens where there were parentheses
     */
    function tokenize(str, operators, opts) {
        // To parse parentheses without recursion, an opening parenthesis pushes the currentList of tokens onto the
        // stack and creates a new, child currentList. A closing parenthesis then pops the currentList back from the
        // stack
        var currentList = [];
        currentList.pos = 0;
        var stack = [];
        var ops = Object.keys(operators);
        var i = 0;
        for (; i < str.length; ++i) {
            if (whitespaceReg.test(str[i]))
                continue;
            if (ops.indexOf(str[i]) !== -1) {
                currentList.push({ value: str[i], pos: i });
                continue;
            }
            switch (str[i]) {
                case '(': {
                    var newList = [];
                    newList.pos = i;
                    currentList.push(newList);
                    stack.push(currentList);
                    currentList = newList;
                    break;
                }
                case ')':
                    if (stack.length === 0) {
                        if (opts.ignoreErrors & QwickMaffs.Error.UnbalancedParenthesis) {
                            // Move all already parsed elements into a sub-expression.
                            currentList = [currentList];
                            currentList.pos = currentList[0].pos;
                        }
                        else {
                            return {
                                error: QwickMaffs.Error.UnbalancedParenthesis,
                                pos: i,
                            };
                        }
                    }
                    else {
                        currentList = stack.pop();
                    }
                    break;
                default: {
                    // No operator, no parens -> Must be number
                    var match = str.substring(i).match(numberReg);
                    var num = '';
                    if (match && match.index === 0) {
                        i += match[0].length;
                        num = match[0];
                    }
                    else {
                        match = null;
                    }
                    if (opts.decimalSep instanceof RegExp
                        ? opts.decimalSep.test(str[i])
                        : opts.decimalSep === str[i]) {
                        num += '.';
                        i += 1;
                        match = str.substring(i).match(numberReg);
                        // The decimal sep wasn't followed by a number. This isn't a number.
                        if (!match || match.index !== 0) {
                            if (opts.ignoreErrors & QwickMaffs.Error.UnexpectedSymbol) {
                                continue;
                            }
                            return {
                                error: QwickMaffs.Error.UnexpectedSymbol,
                                pos: i,
                            };
                        }
                        num += match[0];
                        i += match[0].length;
                    }
                    else if (!match) {
                        // We neither found a decimal sep, nor a number. This isn't a number.
                        if (opts.ignoreErrors & QwickMaffs.Error.UnexpectedSymbol) {
                            continue;
                        }
                        return {
                            error: QwickMaffs.Error.UnexpectedSymbol,
                            pos: i,
                        };
                    }
                    if (opts.supportENotation) {
                        var eMatch = str.substring(i).match(eReg);
                        if (eMatch && match.index === 0) {
                            num += eMatch[0];
                            i += eMatch[0].length;
                        }
                    }
                    currentList.push({
                        value: Number.parseFloat(num),
                        pos: i - num.length,
                    });
                    i--;
                    break;
                }
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
     */
    function execTokenList(tokens, operators, opts) {
        var numberStack = [];
        // The token position of the second number on the stack (Index 1)
        // This is the position of the multiple numbers error, should it be fired.
        // As random as it seems to track this, it saves us from saving all the
        // positions
        var secondPos = -1;
        var operatorStack = [];
        var canPrefix = true;
        var error = null;
        for (var i = 0; i < tokens.length; ++i) {
            var token = tokens[i];
            if (token instanceof Array) {
                var ret = execTokenList(
                /** @type {TokenList} */ token, operators, opts);
                if (typeof ret === 'object') {
                    return ret;
                }
                pushOnStack(ret, token.pos);
                canPrefix = false;
            }
            else if (typeof token.value === 'string') {
                // Intelligently select prefix, suffix or infix
                var ops = operators[token.value];
                var op = canPrefix
                    ? ops.find(function (x) { return x.assoc === 'prefix'; })
                    : ops.find(function (x) { return x.assoc !== 'prefix'; });
                if (!op) {
                    // TODO: Pretty sure whenever this is invoked, there is a not enough
                    //       number error.
                    op = ops[0];
                }
                if (op) {
                    while (operatorStack.length > 0) {
                        var previous = operatorStack[operatorStack.length - 1].val;
                        if (previous.precedence < op.precedence ||
                            (previous.precedence === op.precedence && previous.assoc === 'left')) {
                            if ((error = execOp(previous, operatorStack.pop().pos)))
                                return error;
                        }
                        else {
                            break;
                        }
                    }
                    operatorStack.push({ val: op, pos: token.pos });
                    canPrefix = op.assoc !== 'suffix';
                }
                else {
                    // Error?
                }
            }
            else if (typeof token.value === 'number') {
                pushOnStack(token.value, token.pos);
                canPrefix = false;
            }
        }
        for (var i = operatorStack.length - 1; i >= 0; --i) {
            var op = operatorStack[i];
            if ((error = execOp(op.val, op.pos)))
                return error;
        }
        if (numberStack.length > 1) {
            if (opts.ignoreErrors & QwickMaffs.Error.MultipleNumbers) {
                return numberStack.reduce(function (a, b) { return a * b; });
            }
            return {
                error: QwickMaffs.Error.MultipleNumbers,
                pos: secondPos,
            };
        }
        if (numberStack.length === 0) {
            return {
                error: QwickMaffs.Error.NoNumbers,
                pos: tokens.pos || 0,
            };
        }
        return numberStack[0];
        function pushOnStack(x, pos) {
            numberStack.push(x);
            if (numberStack.length === 2) {
                secondPos = pos;
            }
        }
        function execOp(op, pos) {
            var func = op.apply;
            var needed = func.length;
            if (numberStack.length < needed) {
                return {
                    error: QwickMaffs.Error.IncorrectNumberOfParameters,
                    pos: pos,
                };
            }
            var data = numberStack.splice(numberStack.length - needed, needed);
            pushOnStack(func.apply(null, data), pos);
        }
    }
    function optimizeOps(ops) {
        var lookup = {};
        for (var iOp = 0; iOp < ops.length; iOp++) {
            var op = ops[iOp];
            if (!lookup[op.op]) {
                lookup[op.op] = [];
            }
            lookup[op.op].push(op);
        }
        return lookup;
    }
    exports.default = QwickMaffs;
});
