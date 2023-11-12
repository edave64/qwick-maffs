var QwickMaffs = require('../dist/qwick-maffs.cjs');

/**
 * @param {string} input
 * @param {number} output
 * @param {Object} [opts]
 */
function simpleTest(input, output, opts) {
    test('"' + input + '" -> ' + output, function () {
        expect(QwickMaffs.exec(input, opts)).toBe(output);
    })
}

/**
 * @param {string} input
 * @param {{error: number, pos: number}} error
 * @param {Object} [opts]
 */
function errorTest(input, error, opts) {
    test('"' + input + '"', function () {
        expect(QwickMaffs.exec(input, opts)).toStrictEqual(error);
    })
}

describe('Basics', function () {
    simpleTest("1", 1);
    simpleTest("1.0", 1);
    simpleTest("1.1", 1.1);
    simpleTest("1c1", 1.1, { decimalSep: 'c' });
    simpleTest("1c1", 1.1, { decimalSep: /\w/ });
    simpleTest(".1", 0.1);
    simpleTest("1.1e1", 11);
    simpleTest("3 + 3", 6);
    simpleTest("3 - 3", 0);
    simpleTest("3 * 3", 9);
    simpleTest("3 / 3", 1);
    simpleTest("3 ^ 3", 27);
    simpleTest("3²", 9);
    simpleTest("3³", 27);
    simpleTest("(2) + 1", 3);
})

describe('Order of operations', function () {
    simpleTest("1 + 2 * 4 ^ 5", 2049);
    simpleTest("(1 + 2) * 4 ^ 5", 3072);
    simpleTest("(1 + 2 * 4) ^ 5", 59049);
    simpleTest("((1 + 2) * 4) ^ 5", 248832);
})

describe('Errors', function () {
    errorTest('1 + (4', {
        error: QwickMaffs.Error.UnbalancedParentesis,
        pos: 6
    });

    errorTest('1) + 4', {
        error: QwickMaffs.Error.UnbalancedParentesis,
        pos: 1
    });

    errorTest('wat?', {
        error: QwickMaffs.Error.UnexpectedSymbol,
        pos: 0
    });

    errorTest('wat?', {
        error: QwickMaffs.Error.UnexpectedSymbol,
        pos: 0
    });

    errorTest('45.+', {
        error: QwickMaffs.Error.UnexpectedSymbol,
        pos: 3
    });

    errorTest('45e1', {
        error: QwickMaffs.Error.UnexpectedSymbol,
        pos: 2
    }, { supportENotation: false });
})
