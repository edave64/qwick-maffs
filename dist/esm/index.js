/*!
 * QwickMaffs 0.5.0 by edave64
 * Released under the MIT license: https://github.com/edave64/qwick-maffs/blob/main/LICENCE
 */
const numberReg = /^\d+/;
const eReg = /^e[+-]?\d+/i;
const whitespaceReg = /\s/g;
export const DefaultOptions = {
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
    constants: {
        pi: Math.PI,
    },
    functions: {
        sin: Math.sin,
        cos: Math.cos,
    },
};
export const Errors = {
    UnbalancedParenthesis: 1,
    UnexpectedSymbol: 2,
    IncorrectNumberOfParameters: 4,
    MultipleNumbers: 8,
    NoNumbers: 16,
    All: 31,
};
export function exec(str, opts) {
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
        return DefaultOptions;
    return Object.assign(Object.assign({}, DefaultOptions), opts);
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
    currentList.len = str.length;
    const stack = [];
    const ops = Object.keys(operators);
    const constants = Object.keys(opts.constants);
    constants.sort((a, b) => b.length - a.length);
    const constantsRegex = new RegExp(`^(${constants.join('|')})`, 'i');
    const functions = Object.keys(opts.functions);
    functions.sort((a, b) => b.length - a.length);
    const functionsRegex = new RegExp(`^(${functions.join('|')})\\s*\\(`, 'i');
    let i = 0;
    for (; i < str.length; ++i) {
        if (whitespaceReg.test(str[i]))
            continue;
        if (ops.indexOf(str[i]) !== -1) {
            currentList.push({ value: str[i], pos: i, len: 1 });
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
                    if (opts.ignoreErrors & Errors.UnbalancedParenthesis) {
                        // Move all already parsed elements into a sub-expression.
                        const oldLen = currentList.len;
                        currentList.len = i;
                        currentList = [currentList];
                        currentList.pos = currentList[0].pos;
                        currentList.len = oldLen;
                    }
                    else {
                        return {
                            error: Errors.UnbalancedParenthesis,
                            pos: i,
                            len: 1,
                        };
                    }
                }
                else {
                    currentList.len = i - currentList.pos;
                    currentList = stack.pop();
                }
                break;
            default: {
                const subStr = str.substring(i);
                const numberMatch = parseNumber(subStr, opts);
                if (typeof numberMatch === 'string') {
                    currentList.push({
                        value: Number(numberMatch),
                        pos: i,
                        len: numberMatch.length,
                    });
                    i += numberMatch.length - 1;
                    continue;
                }
                if (typeof numberMatch === 'object') {
                    numberMatch.pos += i;
                    return numberMatch;
                }
                // This has to be checked after numbers, because we allow "," as a decimal separator.
                // So we ensure this isn't a decimal with the leading 0 dropped first
                if (str[i] === ',') {
                    currentList.push({ value: ',', pos: i, len: 1 });
                    continue;
                }
                const constMatch = subStr.match(constantsRegex);
                if (constMatch) {
                    currentList.push({
                        value: opts.constants[constMatch[0].toLowerCase()],
                        pos: i,
                        len: constMatch[0].length,
                    });
                    i += constMatch[0].length - 1;
                    continue;
                }
                const funcMatch = subStr.match(functionsRegex);
                if (funcMatch) {
                    const newList = [];
                    newList.func = opts.functions[funcMatch[1].toLowerCase()];
                    currentList.push(newList);
                    stack.push(currentList);
                    currentList = newList;
                    i += funcMatch[0].length - 1;
                    break;
                }
                // We neither found a decimal sep, nor a number. This isn't a number.
                if (opts.ignoreErrors & Errors.UnexpectedSymbol) {
                    continue;
                }
                return {
                    error: Errors.UnexpectedSymbol,
                    pos: i,
                    len: 1,
                };
            }
        }
    }
    if (stack.length !== 0) {
        if (opts.ignoreErrors & Errors.UnbalancedParenthesis) {
            return stack[0];
        }
        return {
            error: Errors.UnbalancedParenthesis,
            pos: i,
            len: 1,
        };
    }
    return currentList;
}
function parseNumber(subStr, opts) {
    let i = 0;
    let match = subStr.match(numberReg);
    let num = '';
    if (match && match.index === 0) {
        i += match[0].length;
        num = match[0];
    }
    else {
        match = null;
    }
    if (opts.decimalSep instanceof RegExp
        ? opts.decimalSep.test(subStr[i])
        : opts.decimalSep === subStr[i]) {
        i += 1;
        match = subStr.substring(i).match(numberReg);
        // There is a decimal sep, but no number after it, so stop the number here.
        if (!match || match.index !== 0) {
            return num.length > 0 ? num : undefined;
        }
        num += '.';
        num += match[0];
        i += match[0].length;
    }
    else if (!match) {
        return;
    }
    if (opts.supportENotation) {
        const eMatch = subStr.substring(i).match(eReg);
        if (eMatch && eMatch.index === 0) {
            num += eMatch[0];
            i += eMatch[0].length;
        }
    }
    return num;
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
    let secondLen = 0;
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
            pushOnStack(ret, token.pos, token.len);
            canPrefix = false;
        }
        else if (typeof token.value === 'string') {
            if (token.value === ',') {
                // The , token does nothing except suppress infix operators to properly separate function args
                canPrefix = true;
                continue;
            }
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
                        const prevOp = operatorStack.pop();
                        if ((error = execOp(prevOp.val, prevOp.pos, prevOp.len))) {
                            return error;
                        }
                    }
                    else {
                        break;
                    }
                }
                operatorStack.push({ val: op, pos: token.pos, len: token.len });
                canPrefix = op.assoc !== 'suffix';
            }
            else {
                // Error?
            }
        }
        else if (typeof token.value === 'number') {
            pushOnStack(token.value, token.pos, token.len);
            canPrefix = false;
        }
    }
    for (let i = operatorStack.length - 1; i >= 0; --i) {
        const op = operatorStack[i];
        if ((error = execOp(op.val, op.pos, op.len)))
            return error;
    }
    if ('func' in tokens) {
        return tokens.func(...numberStack);
    }
    if (numberStack.length > 1) {
        if (opts.ignoreErrors & Errors.MultipleNumbers) {
            return numberStack.reduce((a, b) => a * b);
        }
        return {
            error: Errors.MultipleNumbers,
            pos: secondPos,
            len: secondLen,
        };
    }
    if (numberStack.length === 0) {
        return {
            error: Errors.NoNumbers,
            pos: tokens.pos || 0,
            len: tokens.len,
        };
    }
    return numberStack[0];
    function pushOnStack(x, pos, len) {
        numberStack.push(x);
        if (numberStack.length === 2) {
            secondPos = pos;
            secondLen = len;
        }
    }
    function execOp(op, pos, len) {
        const func = op.apply;
        const needed = func.length;
        if (numberStack.length < needed) {
            return {
                error: Errors.IncorrectNumberOfParameters,
                pos,
                len,
            };
        }
        const data = numberStack.splice(numberStack.length - needed, needed);
        pushOnStack(func.apply(null, data), pos, len);
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
