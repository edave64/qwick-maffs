import { exec } from './index.js';
export function bind(input, opts = {}) {
    const qmInput = input;
    let oldValue = '';
    let errorValue = null;
    if (!opts.noUndo) {
        input.addEventListener('focus', () => {
            if (input.value === errorValue) {
                // Save the previous value of the input so it can be reset using the escape key
                oldValue = input.value;
            }
        });
    }
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            apply();
        }
        else if (!opts.noUndo && e.key === 'Escape') {
            const previous = input.value;
            input.value = oldValue;
            input.dispatchEvent(new CustomEvent('qmundo', { detail: previous }));
        }
    });
    input.addEventListener('blur', (e) => {
        apply();
    });
    const onError = opts.onError;
    if (onError) {
        qmInput.addEventListener('qmerror', (e) => onError(e.detail));
    }
    const onValueChange = opts.onValueChange;
    if (onValueChange) {
        qmInput.addEventListener('qmvaluechange', (e) => onValueChange(e.detail));
    }
    const onUndo = opts.onUndo;
    if (onUndo) {
        qmInput.addEventListener('qmundo', (e) => onUndo(e.detail));
    }
    return qmInput;
    function apply() {
        const strValue = input.value;
        const result = exec(strValue);
        if (typeof result === 'number') {
            errorValue = null;
            input.value = `${result}`;
            oldValue = input.value;
            input.dispatchEvent(new CustomEvent('qmvaluechange', { detail: result }));
        }
        else {
            errorValue = strValue;
            const errorObj = Object.assign(Object.assign({}, result), { region: [
                    strValue.slice(0, result.pos),
                    strValue.slice(result.pos, result.pos + result.len),
                    strValue.slice(result.pos + result.len),
                ] });
            input.dispatchEvent(new CustomEvent('qmerror', { detail: errorObj }));
        }
    }
}
