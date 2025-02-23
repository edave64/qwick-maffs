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
    exports.lookup = void 0;
    var allUnits = [
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
    exports.default = allUnits;
    exports.lookup = Object.fromEntries(allUnits.map(function (unit) { return [unit.name, unit]; }));
});
