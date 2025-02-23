import { describe, expect, test } from 'vitest';
import QwickMaffs from '../src/index';
import PhysicalUnits, { lookup } from '../src/units/physicalSize';

describe('Units', () => {
	test.each([
		['1m', { value: 1, unit: lookup.m }],
		['62m', { value: 62, unit: lookup.m }],
		['62.2m', { value: 62.2, unit: lookup.m }],
		['2km', { value: 2000, unit: lookup.m }],
		['2mm', { value: 0.002, unit: lookup.m }],
		['2mi', { value: 10560, unit: lookup.ft }],
		['2m + 2', { value: 4, unit: lookup.m }],
		['2dm + 6cm', { value: 0.26, unit: lookup.m }],
		['2dm * 6m', { value: 0.2 * 6, unit: lookup.m }], // This is pretty wrong :/
		['3m ^ 2', { value: 9, unit: lookup.m }], // But we don't support things like area
		['1m + 1ft', { value: 1.3048, unit: lookup.m }],
	])('"%s" -> %o', (expression, result) => {
		expect(QwickMaffs.exec(expression, { units: PhysicalUnits })).toMatchObject(
			result,
		);
	});
});
