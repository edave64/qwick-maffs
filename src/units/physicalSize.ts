import type { QMUnit } from '../index';

const allUnits = [
	{
		name: 'm',
		si: true,
		from: {
			ft: 0.3048,
		},
	},
	{
		name: 'ft',
		from: {
			m: 1 / 0.3048,
		},
		alias: {
			yd: 3,
			mi: 5280,
			in: 1 / 12,
		},
	},
] as QMUnit[];

export default allUnits;
export const lookup = Object.fromEntries(
	allUnits.map((unit) => [unit.name, unit]),
);
