import { describe, expect, test } from 'vitest';
import QwickMaffs from '../src/index';

describe('Basics', () => {
	test.each([
		['1', 1],
		['42', 42],
		['1.0', 1],
		['1.1', 1.1],
		['.1', 0.1],
		['1.1e1', 11],
		['3 + 3', 6],
		['3 - 3', 0],
		['3 * 3', 9],
		['3 / 3', 1],
		['3 ^ 3', 27],
		['3²', 9],
		['3³', 27],
		['(2) + 1', 3],
		['+ 4', 4],
		['- 4', -4],
	])('"%s" -> %i', (expression, result) => {
		expect(QwickMaffs.exec(expression)).toBe(result);
	});
});

describe('Constants', () => {
	test('"2*pi"', () => {
		expect(QwickMaffs.exec('2*pi')).toBe(2 * Math.PI);
	});
	test('"2 * pI"', () => {
		expect(QwickMaffs.exec('2 * pI')).toBe(2 * Math.PI);
	});
	test('Prefixing', () => {
		expect(
			QwickMaffs.exec('pinuts * pi', {
				constants: {
					...QwickMaffs.DefaultOptions.constants,
					pinuts: 3,
				},
			}),
		).toBe(3 * Math.PI);
	});
});

describe('Functions', () => {
	test('"cos(pi)"', () => {
		expect(QwickMaffs.exec('cos(pi)')).toBe(-1);
	});
});

describe('Comma supressing infix', () => {
	test('max(4, -4)', () => {
		expect(
			QwickMaffs.exec('max(4, -4)', {
				functions: {
					max: Math.max,
				},
			}),
		).toBe(4);
	});
});

describe('Custom decimal separators', () => {
	test('"1c1" -> 1.1', () => {
		expect(QwickMaffs.exec('1c1', { decimalSep: 'c' })).toBe(1.1);
	});
	test('"1c1" -> 1.1', () => {
		expect(QwickMaffs.exec('1c1', { decimalSep: /\w/ })).toBe(1.1);
	});
});

describe('Custom operators', () => {
	test('"50%" -> 0.5', () => {
		expect(
			QwickMaffs.exec('50%', {
				operators: [
					...QwickMaffs.DefaultOptions.operators,
					{
						op: '%',
						assoc: 'suffix',
						precedence: 3,
						apply: (x: number) => x / 100,
					},
				],
			}),
		).toBe(0.5);
	});
	test('"3 + 50%" -> 3.5', () => {
		expect(
			QwickMaffs.exec('3 + 50%', {
				operators: [
					...QwickMaffs.DefaultOptions.operators,
					{
						op: '%',
						assoc: 'suffix',
						precedence: 3,
						apply: (x: number) => x / 100,
					},
				],
			}),
		).toBe(3.5);
	});
});

describe('Order of operations', () => {
	test.each([
		['1 + 2 * 4 ^ 5', 2049],
		['5 ^ 4 * 2 + 1', 1251],
		['(1 + 2) * 4 ^ 5', 3072],
		['1 + (2 * 4) ^ 5', 32769],
		['(1 + 2 * 4) ^ 5', 59049],
		['((1 + 2) * 4) ^ 5', 248832],
		['--4', 4],
		['4²²', 256],
		['--4²²', 256],
		['8+-4', 4],
	])('"%s" -> %i', (expression, result) => {
		expect(QwickMaffs.exec(expression)).toBe(result);
	});
});

describe('Errors', () => {
	test('"1 + (4"', () => {
		expect(QwickMaffs.exec('1 + (4')).toStrictEqual({
			error: QwickMaffs.Error.UnbalancedParenthesis,
			pos: 6,
			len: 1,
		});
	});

	test('"1) + 4"', () => {
		expect(QwickMaffs.exec('1) + 4')).toStrictEqual({
			error: QwickMaffs.Error.UnbalancedParenthesis,
			pos: 1,
			len: 1,
		});
	});

	test('"wat?"', () => {
		expect(QwickMaffs.exec('wat?')).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 0,
			len: 1,
		});
	});

	test('"45.+"', () => {
		expect(QwickMaffs.exec('45.+')).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 2,
			len: 1,
		});
	});

	test('"45e1"', () => {
		expect(QwickMaffs.exec('45e1', { supportENotation: false })).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 2,
			len: 1,
		});
	});

	test('"4 + . 8"', () => {
		expect(QwickMaffs.exec('4 + . 8')).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 4,
			len: 1,
		});
	});

	test('"4 +"', () => {
		expect(QwickMaffs.exec('4 +')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
			len: 1,
		});
	});

	test('"4 +"', () => {
		expect(QwickMaffs.exec('4 +')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
			len: 1,
		});
	});

	test('"* 4"', () => {
		expect(QwickMaffs.exec('* 4')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 0,
			len: 1,
		});
	});

	test('"* ²"', () => {
		expect(QwickMaffs.exec('* ²')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
			len: 1,
		});
	});

	test('"* +"', () => {
		expect(QwickMaffs.exec('* +')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
			len: 1,
		});
	});

	test('"+"', () => {
		expect(QwickMaffs.exec('+')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 0,
			len: 1,
		});
	});

	test('"4 4"', () => {
		expect(QwickMaffs.exec('4 4')).toStrictEqual({
			error: QwickMaffs.Error.MultipleNumbers,
			pos: 2,
			len: 1,
		});
	});

	test('"4 4.3"', () => {
		expect(QwickMaffs.exec('4 4.3')).toStrictEqual({
			error: QwickMaffs.Error.MultipleNumbers,
			pos: 2,
			len: 3,
		});
	});

	test('"pi pi"', () => {
		expect(QwickMaffs.exec('pi pi')).toStrictEqual({
			error: QwickMaffs.Error.MultipleNumbers,
			pos: 3,
			len: 2,
		});
	});

	test('"(4 4)"', () => {
		expect(QwickMaffs.exec('(4 4)')).toStrictEqual({
			error: QwickMaffs.Error.MultipleNumbers,
			pos: 3,
			len: 1,
		});
	});

	test('""', () => {
		expect(QwickMaffs.exec('')).toStrictEqual({
			error: QwickMaffs.Error.NoNumbers,
			pos: 0,
			len: 0,
		});
	});

	test('"4 + 4 ()"', () => {
		expect(QwickMaffs.exec('4 + 4 ()')).toStrictEqual({
			error: QwickMaffs.Error.NoNumbers,
			pos: 6,
			len: 1,
		});
	});
});

describe('Skip UnbalancedParenthesis', () => {
	test('"1 + (4"', () => {
		expect(
			QwickMaffs.exec('1 + (4', {
				ignoreErrors: QwickMaffs.Error.UnbalancedParenthesis,
			}),
		).toBe(5);
	});
	test('"1 + (4 - (3"', () => {
		expect(
			QwickMaffs.exec('1 + (4 - (3', {
				ignoreErrors: QwickMaffs.Error.UnbalancedParenthesis,
			}),
		).toBe(2);
	});
	test('"4 - 1) * 4"', () => {
		expect(
			QwickMaffs.exec('4 - 1) * 4', {
				ignoreErrors: QwickMaffs.Error.UnbalancedParenthesis,
			}),
		).toBe(12);
	});
	test('"5 - 1)² * (3 + 2"', () => {
		expect(
			QwickMaffs.exec('5 - 1)² * (3 + 2', {
				ignoreErrors: QwickMaffs.Error.UnbalancedParenthesis,
			}),
		).toBe(80);
	});
});

describe('Skip UnexpectedSymbol', () => {
	test('"4 + . 8"', () => {
		expect(
			QwickMaffs.exec('4 + . 8', {
				ignoreErrors: QwickMaffs.Error.UnexpectedSymbol,
			}),
		).toBe(12);
	});
	test('"45e1"', () => {
		expect(
			QwickMaffs.exec('45e1', {
				supportENotation: false,
				ignoreErrors: QwickMaffs.Error.UnexpectedSymbol,
			}),
		).toStrictEqual({
			error: QwickMaffs.Error.MultipleNumbers,
			len: 1,
			pos: 3,
		});
	});
});

describe('Skip MultipleNumbers', () => {
	test('"4(8)"', () => {
		expect(
			QwickMaffs.exec('4(8)', {
				ignoreErrors: QwickMaffs.Error.MultipleNumbers,
			}),
		).toBe(32);
	});
});
