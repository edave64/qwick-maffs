# QwickMaffs

A small, (runtime-)dependency-free library to support simple arithmetic in input fields.

## Install

QwickMaffs is available as an NPM package.

```
npm install qwick-maffs
```

Alternatively, you can find the files needed for shipping the library in the dist folder.

You can either use the [UMD version](./dist/umd/index.js) for commonJs and AMD,
or [an esmodule](./dist/esm/index.js).

## Usage

QwickMaffs exports a single function, `exec`.

```
QwickMaffs.exec('4 + 4') #=> returns 8
```

You can also provide a set of options with to the exec call:

```ts
QwickMaffs.exec('4 + 4', {
	decimalSep: /[,.]/,     // Either a string or a regex that indicates what symbol is accepted as a decimal separator.

	supportENotation: true, // Indicates if e-notation should be allowed. If false, it will complain about e not being
	                        // an UnexpectedSymbol
	
	// Makes it exec will not return these errors. The parser will instead try to take a best guess at what the user
	// tried to accomplish.
	// E.g. MultipleNumbers will multiply the numbers, and UnbalancedParenthesis will be balanced automatically
	ignoreErrors: QwickMaffs.Error.MultipleNumbers | QwickMaffs.Error.UnbalancedParenthesis,
	
	// Sets the operators supported in the expression. Here, we take all default operators and add "%", which divides a
	// number by 100
	operators: [
		...QwickMaffs.DefaultOptions.operators,
		{
			op: '%',
			assoc: 'suffix',
			precedence: 3,
			apply: (x) => x / 100,
		},
	],

	// Constant values available. 
	constants: {
		...QwickMaffs.DefaultOptions.constants,
		'e': Math.E,
	}
})
```

## Error handling

The `exec` function can return an error object if the expression cannot be parsed or executed. These error objects look
like this:

```ts
{
	type: 0 // An enum value. Can be one of the following from the `QwickMaffs.Error` enum:
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

	pos: 0  // The position of the input string where the error occured.
}
```
