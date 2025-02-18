export default [
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
];
