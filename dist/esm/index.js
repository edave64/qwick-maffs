/*!
 * QwickMaffs 0.3.0 by edave64
 * Released under the MIT license: https://github.com/edave64/qwick-maffs/blob/main/LICENCE
 */
const numberReg = /^\d+/;
const eReg = /^e[+-]?\d+/i;
const whitespaceReg = /\s/g;
const QwickMaffs = {
    DefaultOptions: {
        decimalSep: /[,.]/,
        supportENotation: true,
        ignoreErrors: 0,
        operators: [
            {
                op: '+',
                assoc: 'prefix',
                precedence: 1,
                apply: (num) => num,
            },
            {
                op: '-',
                assoc: 'prefix',
                precedence: 1,
                apply: (num) => -num,
            },
            {
                op: '^',
                assoc: 'left',
                precedence: 2,
                apply: (x, y) => Math.pow(x, y),
            },
            {
                op: '²',
                assoc: 'suffix',
                precedence: 2,
                apply: (num) => Math.pow(num, 2),
            },
            {
                op: '³',
                assoc: 'suffix',
                precedence: 2,
                apply: (num) => Math.pow(num, 3),
            },
            {
                op: '*',
                assoc: 'left',
                precedence: 3,
                apply: (x, y) => x * y,
            },
            {
                op: '/',
                assoc: 'left',
                precedence: 3,
                apply: (x, y) => x / y,
            },
            {
                op: '+',
                assoc: 'left',
                precedence: 4,
                apply: (x, y) => x + y,
            },
            {
                op: '-',
                assoc: 'left',
                precedence: 4,
                apply: (x, y) => x - y,
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
    const normalizedOpts = normalizeOpts(opts);
    const ops = optimizeOps(normalizedOpts.operators);
    const tokens = tokenize(str, ops, normalizedOpts);
    // Propagate error
    if ('error' in tokens)
        return tokens;
    return execTokenList(tokens, ops, normalizedOpts);
}
function normalizeOpts(opts) {
    if (!opts)
        return QwickMaffs.DefaultOptions;
    return Object.assign(Object.assign({}, QwickMaffs.DefaultOptions), opts);
}
/**
 * Takes an input strings and returns a list of tokens, in the form of js numbers for numbers, strings for operators
 * and arrays of more tokens where there were parentheses
 */
function tokenize(str, operators, opts) {
    // To parse parentheses without recursion, an opening parenthesis pushes the currentList of tokens onto the
    // stack and creates a new, child currentList. A closing parenthesis then pops the currentList back from the
    // stack
    let currentList = [];
    currentList.pos = 0;
    const stack = [];
    const ops = Object.keys(operators);
    let i = 0;
    for (; i < str.length; ++i) {
        if (whitespaceReg.test(str[i]))
            continue;
        if (ops.indexOf(str[i]) !== -1) {
            currentList.push({ value: str[i], pos: i });
            continue;
        }
        switch (str[i]) {
            case '(': {
                const newList = [];
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
                let match = str.substring(i).match(numberReg);
                let num = '';
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
                    const eMatch = str.substring(i).match(eReg);
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
    const numberStack = [];
    // The token position of the second number on the stack (Index 1)
    // This is the position of the multiple numbers error, should it be fired.
    // As random as it seems to track this, it saves us from saving all the
    // positions
    let secondPos = -1;
    const operatorStack = [];
    let canPrefix = true;
    let error = null;
    for (let i = 0; i < tokens.length; ++i) {
        const token = tokens[i];
        if (token instanceof Array) {
            const ret = execTokenList(
            /** @type {TokenList} */ token, operators, opts);
            if (typeof ret === 'object') {
                return ret;
            }
            pushOnStack(ret, token.pos);
            canPrefix = false;
        }
        else if (typeof token.value === 'string') {
            // Intelligently select prefix, suffix or infix
            const ops = operators[token.value];
            let op = canPrefix
                ? ops.find((x) => x.assoc === 'prefix')
                : ops.find((x) => x.assoc !== 'prefix');
            if (!op) {
                // TODO: Pretty sure whenever this is invoked, there is a not enough
                //       number error.
                op = ops[0];
            }
            if (op) {
                while (operatorStack.length > 0) {
                    const previous = operatorStack[operatorStack.length - 1].val;
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
    for (let i = operatorStack.length - 1; i >= 0; --i) {
        const op = operatorStack[i];
        if ((error = execOp(op.val, op.pos)))
            return error;
    }
    if (numberStack.length > 1) {
        if (opts.ignoreErrors & QwickMaffs.Error.MultipleNumbers) {
            return numberStack.reduce((a, b) => a * b);
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
        const func = op.apply;
        const needed = func.length;
        if (numberStack.length < needed) {
            return {
                error: QwickMaffs.Error.IncorrectNumberOfParameters,
                pos: pos,
            };
        }
        const data = numberStack.splice(numberStack.length - needed, needed);
        pushOnStack(func.apply(null, data), pos);
    }
}
function optimizeOps(ops) {
    const lookup = {};
    for (let iOp = 0; iOp < ops.length; iOp++) {
        const op = ops[iOp];
        if (!lookup[op.op]) {
            lookup[op.op] = [];
        }
        lookup[op.op].push(op);
    }
    return lookup;
}
export default QwickMaffs;
