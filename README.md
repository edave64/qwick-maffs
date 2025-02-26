# QwickMaffs

A small, (runtime-)dependency-free library to support simple arithmetic in input fields.

## Install

QwickMaffs is available as an NPM package.

```
npm install qwick-maffs
```

Alternatively, you can find the files needed for shipping the library in the dist folder.

You can either use the [UMD version](./dist/umd/index.js) for CommonJS and AMD,
or [an esmodule](./dist/esm/index.js).

## Usage

QwickMaffs has two functions, `bind` to automatically configure an input to execute math expressions,
and `exec` to manually run a math expression.

### Binding to an input

The `bind` function is the easy way to use QwickMaffs. It take an input and makes it so it automatically processes the
any math term when the user presses enter or the input looses focus.

It also adds an undo feature, where pressing ESC during editing reverts all changes since the input gained focus.

```ts
import { bind } `qwick-maffs/input.js`;

const qmInput = bind(input, {
	// See `exec` below for more options.

	// Set to `true` to remove the undo feature of the ESC key
	noUndo: false,

	onValueChanged(val: number) {
		// Called when an expression is executed successfully
	}

	onError(err: QMError /* -> see Error handling */) {
		// Called when an invalid expression was entered
	}, 

	onUndo(prev: string) {
		// Called when the user pressed ESC and the value was reset. `prev` contains the text value
		// before the undo was executed.
	}
});

// qmInput here is the same object as input, but with addition type info for TypeScript, so it
// can type-check the custom html events

qmInput.addEventListener('qmvaluechange', (e) => {
	// Same as the `onValueChanged` callback in `bind`. The value can be accessed through
	// `e.details`
});

qmInput.addEventListener('qmerror', (e) => {
	// Same as the `onError` callback in `bind`. The error can be accessed through `e.details`
});

qmInput.addEventListener('qmundo', (e) => {
	// Same as the `onUndo` callback in `bind`. The previous value can be accessed through
	// `e.details`
});
```

### Manual Usage

The `exec` function can be used to execute a math expression.

```ts
exec('4 + 4') //=> returns 8
```

You can also provide a set of options with to the exec call:

```ts
import { exec, Errors, DefaultOptions } `qwick-maffs`;

QwickMaffs.exec('4 + 4', {
	decimalSep: /[,.]/,     // Either a string or a regex that indicates what symbol is accepted as a decimal separator.

	supportENotation: true, // Indicates if e-notation should be allowed. If false, it will complain about e not being
	                        // an UnexpectedSymbol
	
	// Makes it exec will not return these errors. The parser will instead try to take a best guess at what the user
	// tried to accomplish.
	// E.g. MultipleNumbers will multiply the numbers, and UnbalancedParenthesis will be balanced automatically
	ignoreErrors: Errors.MultipleNumbers | Errors.UnbalancedParenthesis,
	
	// Sets the operators supported in the expression. Here, we take all default operators and add "%", which divides a
	// number by 100
	operators: [
		...DefaultOptions.operators,
		{
			op: '%',
			assoc: 'suffix',
			precedence: 3,
			apply: (x) => x / 100,
		},
	],

	// Constant values available. 
	constants: {
		...DefaultOptions.constants,
		'e': Math.E,
	},
	
	// Functions available. Functions are called by their name followed by
	// parenthesis with the parameters.
	// Here, we add `min` and `max` function.
	functions: {
		...DefaultOptions.functions,
		min: Math.min,
		max: Math.max,
	}
})
```

### Error handling

The `exec` function can return an error object if the expression cannot be parsed or executed. These error objects look
like this:

```ts
{
	type: 0, // An enum value. Can be one of the following from the `QwickMaffs.Errors` enum:
	         // UnbalancedParenthesis: There are too few or too many parentesis. If there are too few, pos will be at
	         //                        the end of the string.
	         //
	         // UnexpectedSymbol: A symbol that we don't know what to do with.
	         //
	         // IncorrectNumberOfParameters: The operator at the given position cannot execute, because it doesn't have
	         //                              the needed numbers.
	         //
	         // MultipleNumbers: After executing all the operators, there are more than one number left. Pos is the
	         //                  position of the second number
	         //
	         // NoNumbers: The expression or a subexpression in parentesis contains no numbers.

	pos: 0, // The position of the input string where the error occured.
	len: 0  // The length of the error
}
```
