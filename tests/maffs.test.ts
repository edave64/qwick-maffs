import { describe, expect, test } from 'vitest';
import QwickMaffs from '../src/index';

describe('Basics', () => {
	test('"1" -> 1', () => {
		expect(QwickMaffs.exec('1')).toBe(1);
	});
	test('"42" -> 42', () => {
		expect(QwickMaffs.exec('42')).toBe(42);
	});
	test('"1.0" -> 1', () => {
		expect(QwickMaffs.exec('1.0')).toBe(1);
	});
	test('"1.1" -> 1.1', () => {
		expect(QwickMaffs.exec('1.1')).toBe(1.1);
	});
	test('"1c1" -> 1.1', () => {
		expect(QwickMaffs.exec('1c1', { decimalSep: 'c' })).toBe(1.1);
	});
	test('"1c1" -> 1.1', () => {
		expect(QwickMaffs.exec('1c1', { decimalSep: /\w/ })).toBe(1.1);
	});
	test('".1" -> 0.1', () => {
		expect(QwickMaffs.exec('.1')).toBe(0.1);
	});
	test('"1.1e1" -> 11', () => {
		expect(QwickMaffs.exec('1.1e1')).toBe(11);
	});
	test('"3 + 3" -> 6', () => {
		expect(QwickMaffs.exec('3 + 3')).toBe(6);
	});
	test('"3 - 3" -> 0', () => {
		expect(QwickMaffs.exec('3 - 3')).toBe(0);
	});
	test('"3 * 3" -> 9', () => {
		expect(QwickMaffs.exec('3 * 3')).toBe(9);
	});
	test('"3 / 3" -> 1', () => {
		expect(QwickMaffs.exec('3 / 3')).toBe(1);
	});
	test('"3 ^ 3" -> 27', () => {
		expect(QwickMaffs.exec('3 ^ 3')).toBe(27);
	});
	test('"3²" -> 9', () => {
		expect(QwickMaffs.exec('3²')).toBe(9);
	});
	test('"3³" -> 27', () => {
		expect(QwickMaffs.exec('3³')).toBe(27);
	});
	test('"(2) + 1" -> 3', () => {
		expect(QwickMaffs.exec('(2) + 1')).toBe(3);
	});
	test('"+ 4"', () => {
		expect(QwickMaffs.exec('+ 4')).toBe(4);
	});
	test('"- 4"', () => {
		expect(QwickMaffs.exec('- 4')).toBe(-4);
	});
});

describe('Order of operations', () => {
	test('"1 + 2 * 4 ^ 5" -> 2049', () => {
		expect(QwickMaffs.exec('1 + 2 * 4 ^ 5')).toBe(2049);
	});
	test('"5 ^ 4 * 2 + 1" -> 1251', () => {
		expect(QwickMaffs.exec('5 ^ 4 * 2 + 1')).toBe(1251);
	});
	test('"(1 + 2) * 4 ^ 5" -> 3072', () => {
		expect(QwickMaffs.exec('(1 + 2) * 4 ^ 5')).toBe(3072);
	});
	test('"1 + (2 * 4) ^ 5" -> 32769', () => {
		expect(QwickMaffs.exec('1 + (2 * 4) ^ 5')).toBe(32769);
	});
	test('"(1 + 2 * 4) ^ 5" -> 59049', () => {
		expect(QwickMaffs.exec('(1 + 2 * 4) ^ 5')).toBe(59049);
	});
	test('"((1 + 2) * 4) ^ 5" -> 248832', () => {
		expect(QwickMaffs.exec('((1 + 2) * 4) ^ 5')).toBe(248832);
	});
	test('"--4 -> 4"', () => {
		expect(QwickMaffs.exec('--4')).toBe(4);
	});
	test('"4²³ -> 256"', () => {
		expect(QwickMaffs.exec('4²²')).toBe(256);
	});
	test('"--4²² -> 256"', () => {
		expect(QwickMaffs.exec('--4²²')).toBe(256);
	});
	test('"8+-4 -> 4"', () => {
		expect(QwickMaffs.exec('8+-4')).toBe(4);
	});
});

describe('Errors', () => {
	test('"1 + (4"', () => {
		expect(QwickMaffs.exec('1 + (4')).toStrictEqual({
			error: QwickMaffs.Error.UnbalancedParenthesis,
			pos: 6,
		});
	});

	test('"1) + 4"', () => {
		expect(QwickMaffs.exec('1) + 4')).toStrictEqual({
			error: QwickMaffs.Error.UnbalancedParenthesis,
			pos: 1,
		});
	});

	test('"wat?"', () => {
		expect(QwickMaffs.exec('wat?')).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 0,
		});
	});

	test('"45.+"', () => {
		expect(QwickMaffs.exec('45.+')).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 3,
		});
	});

	test('"45e1"', () => {
		expect(QwickMaffs.exec('45e1', { supportENotation: false })).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 2,
		});
	});

	test('"4 + . 8"', () => {
		expect(QwickMaffs.exec('4 + . 8')).toStrictEqual({
			error: QwickMaffs.Error.UnexpectedSymbol,
			pos: 5,
		});
	});

	test('"4 +"', () => {
		expect(QwickMaffs.exec('4 +')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
		});
	});

	test('"4 +"', () => {
		expect(QwickMaffs.exec('4 +')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
		});
	});

	test('"* 4"', () => {
		expect(QwickMaffs.exec('* 4')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 0,
		});
	});

	test('"* ²"', () => {
		expect(QwickMaffs.exec('* ²')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
		});
	});

	test('"* +"', () => {
		expect(QwickMaffs.exec('* +')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 2,
		});
	});

	test('"+"', () => {
		expect(QwickMaffs.exec('+')).toStrictEqual({
			error: QwickMaffs.Error.IncorrectNumberOfParameters,
			pos: 0,
		});
	});

	test('"4 4"', () => {
		expect(QwickMaffs.exec('4 4')).toStrictEqual({
			error: QwickMaffs.Error.MultipleNumbers,
			pos: 2,
		});
	});

	test('"(4 4)"', () => {
		expect(QwickMaffs.exec('(4 4)')).toStrictEqual({
			error: QwickMaffs.Error.MultipleNumbers,
			pos: 3,
		});
	});

	test('""', () => {
		expect(QwickMaffs.exec('')).toStrictEqual({
			error: QwickMaffs.Error.NoNumbers,
			pos: 0,
		});
	});

	test('"4 + 4 ()"', () => {
		expect(QwickMaffs.exec('4 + 4 ()')).toStrictEqual({
			error: QwickMaffs.Error.NoNumbers,
			pos: 6,
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
