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
        define(["require", "exports", "./index.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bind = bind;
    var index_js_1 = require("./index.js");
    function bind(input, opts) {
        if (opts === void 0) { opts = {}; }
        var qmInput = input;
        var oldValue = '';
        var errorValue = null;
        if (!opts.noUndo) {
            input.addEventListener('focus', function () {
                if (input.value === errorValue) {
                    // Save the previous value of the input so it can be reset using the escape key
                    oldValue = input.value;
                }
            });
        }
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                apply();
            }
            else if (!opts.noUndo && e.key === 'Escape') {
                var previous = input.value;
                input.value = oldValue;
                input.dispatchEvent(new CustomEvent('qmundo', { detail: previous }));
            }
        });
        input.addEventListener('blur', function (e) {
            apply();
        });
        var onError = opts.onError;
        if (onError) {
            qmInput.addEventListener('qmerror', function (e) { return onError(e.detail); });
        }
        var onValueChange = opts.onValueChange;
        if (onValueChange) {
            qmInput.addEventListener('qmvaluechange', function (e) { return onValueChange(e.detail); });
        }
        var onUndo = opts.onUndo;
        if (onUndo) {
            qmInput.addEventListener('qmundo', function (e) { return onUndo(e.detail); });
        }
        return qmInput;
        function apply() {
            var strValue = input.value;
            var result = (0, index_js_1.exec)(strValue);
            if (typeof result === 'number') {
                errorValue = null;
                input.value = "".concat(result);
                oldValue = input.value;
                input.dispatchEvent(new CustomEvent('qmvaluechange', { detail: result }));
            }
            else {
                errorValue = strValue;
                var errorObj = __assign(__assign({}, result), { region: [
                        strValue.slice(0, result.pos),
                        strValue.slice(result.pos, result.pos + result.len),
                        strValue.slice(result.pos + result.len),
                    ] });
                input.dispatchEvent(new CustomEvent('qmerror', { detail: errorObj }));
            }
        }
    }
});
