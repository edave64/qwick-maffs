# QwickMaffs

A small, (runtime-)dependency-free library to support simple arithmetic in input fields.

## Install

QwickMaffs is available as an npm package.

```
npm install qwick-maffs
```

Alternatively, it supports several packaging schemes. The files you need to ship it can be found in the "dist" directory.

For a classic library for your browser that exports a simple global variable "QwickMaffs", use
[qwick-maffs.global.js](./dist/qwick-maffs.global.js). We also provide
[an AMD module](./dist/qwick-maffs.amd.js), [a commonjs module](./dist/qwick-maffs.cjs)
and [an esmodule](./dist/qwick-maffs.mjs).

## Usage

QwickMaffs exports a single function, `exec`.

```
QwickMaffs.exec('4 + 4') #=> returns 8
```

You can also provide a set of options with to the exec call:

```
QwickMaffs.exec('4 + 4', {
	decimalSep: /[,.]/,     // Either a string or a regex that indicates what symbol is accepted as a decimal separator.

	supportENotation: true, // Indicates if e-notation should be allowed. If false, it will complain about e not being
	                        // an UnexpectedSymbol
})
```

## Error handling

The `exec` function can return an error object if the expression cannot be parsed or executed. These error objects look
like this:

```
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
