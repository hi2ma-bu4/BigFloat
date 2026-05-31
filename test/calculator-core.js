import { BigFloat, BigFloatComplex, BigFloatComplexMatrix, BigFloatComplexVector, BigFloatMatrix, BigFloatStream, BigFloatVector, RoundingMode } from "../dist/BigFloat.js";

export const ROUNDING_MODE_OPTIONS = ["TRUNCATE", "DOWN", "UP", "CEIL", "FLOOR", "HALF_UP", "HALF_DOWN"];

const UNARY_VALUE_FUNCTIONS = new Set([
	// trig
	"sin",
	"cos",
	"tan",
	"asin",
	"arcsin",
	"acos",
	"arccos",
	"atan",
	"arctan",
	"sinh",
	"cosh",
	"tanh",
	"asinh",
	"arsinh",
	"arcsinh",
	"acosh",
	"arcosh",
	"arccosh",
	"atanh",
	"artanh",
	"arctanh",
	// power
	"sqrt",
	"cbrt",
	"exp",
	"exp2",
	"expm1",
	"factorial",
	"reciprocal",
	// logs
	"ln",
	"log10",
	"log2",
	"log1p",
	"gamma",
	"zeta",
	// linear
	"transpose",
	// more
	"abs",
	"sign",
	"floor",
	"ceil",
	"round",
	"trace",
	"fround",
	"clz32",
	"normalize",
	"trunc",
]);

export function escapeLatex(value) {
	return String(value)
		.replace(/\\/g, "\\textbackslash{}")
		.replace(/([{}#$%&_])/g, "\\$1")
		.replace(/\^/g, "\\textasciicircum{}")
		.replace(/~/g, "\\textasciitilde{}");
}

export function formatSerializedValue(serialized, precision) {
	if (!serialized) {
		return "-";
	}
	switch (serialized.kind) {
		case "scalar":
			return serialized.value;
		case "complex":
			return serialized.text;
		case "boolean":
		case "number":
		case "text":
			return serialized.text;
		case "vector":
		case "complex-vector":
			return `[${serialized.values.map((entry) => formatSerializedValue(entry, precision)).join(", ")}]`;
		case "matrix":
		case "complex-matrix":
			return `[${serialized.rows.map((row) => `[${row.map((entry) => formatSerializedValue(entry, precision)).join(", ")}]`).join(", ")}]`;
		default:
			return String(serialized.text ?? serialized.value ?? "");
	}
}

export class Tokenizer {
	constructor(source) {
		this.source = source;
		this.index = 0;
		this.tokens = [];
	}

	tokenize() {
		while (this.index < this.source.length) {
			const current = this.source[this.index];
			if (/\s/.test(current)) {
				this.index += 1;
				continue;
			}
			if (/[0-9.]/.test(current)) {
				this.tokens.push(this.readNumber());
				continue;
			}
			if (/[A-Za-z_]/.test(current)) {
				this.tokens.push(this.readIdentifier());
				continue;
			}
			if ("+-*/%^(),[]!".includes(current)) {
				this.tokens.push({ type: current, value: current });
				this.index += 1;
				continue;
			}
			throw new SyntaxError(`Unexpected character: ${current}`);
		}
		this.tokens.push({ type: "eof", value: "" });
		return this.tokens;
	}

	readNumber() {
		const match = this.source.slice(this.index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
		if (!match) {
			throw new SyntaxError("Invalid number literal.");
		}
		this.index += match[0].length;
		return { type: "number", value: match[0] };
	}

	readIdentifier() {
		const match = this.source.slice(this.index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
		if (!match) {
			throw new SyntaxError("Invalid identifier.");
		}
		this.index += match[0].length;
		return { type: "identifier", value: match[0] };
	}
}

export class Parser {
	constructor(tokens) {
		this.tokens = tokens;
		this.index = 0;
	}

	parse() {
		const expression = this.parseExpression(0);
		this.expect("eof");
		return expression;
	}

	parseExpression(minPrecedence) {
		let left = this.parsePrefix();

		for (;;) {
			while (this.match("!")) {
				left = { type: "postfix", operator: "!", operand: left };
			}

			if (this.shouldInsertImplicitMultiplication()) {
				const precedence = 20;
				if (precedence < minPrecedence) {
					break;
				}
				const right = this.parseExpression(precedence + 1);
				left = { type: "binary", operator: "*", left, right, implicit: true };
				continue;
			}

			const token = this.peek();
			const precedence = this.getBinaryPrecedence(token.type);
			if (precedence < minPrecedence) {
				break;
			}
			this.consume();
			const right = this.parseExpression(token.type === "^" ? precedence : precedence + 1);
			left = { type: "binary", operator: token.type, left, right };
		}

		return left;
	}

	parsePrefix() {
		const token = this.peek();
		if (token.type === "+" || token.type === "-") {
			this.consume();
			return { type: "unary", operator: token.type, operand: this.parseExpression(40) };
		}
		return this.parsePrimary();
	}

	parsePrimary() {
		const token = this.peek();
		if (token.type === "number") {
			this.consume();
			return { type: "number", value: token.value };
		}
		if (token.type === "identifier") {
			this.consume();
			if (this.match("(")) {
				const args = [];
				if (!this.check(")")) {
					do {
						args.push(this.parseExpression(0));
					} while (this.match(","));
				}
				this.expect(")");
				return { type: "call", name: token.value, args };
			}
			return { type: "identifier", name: token.value };
		}
		if (token.type === "(") {
			this.consume();
			const expression = this.parseExpression(0);
			this.expect(")");
			return expression;
		}
		if (token.type === "[") {
			return this.parseArray();
		}
		throw new SyntaxError(`Unexpected token: ${token.value || token.type}`);
	}

	parseArray() {
		this.expect("[");
		const items = [];
		if (!this.check("]")) {
			do {
				items.push(this.parseExpression(0));
			} while (this.match(","));
		}
		this.expect("]");
		return { type: "array", items };
	}

	shouldInsertImplicitMultiplication() {
		return ["number", "identifier", "(", "["].includes(this.peek().type);
	}

	getBinaryPrecedence(type) {
		switch (type) {
			case "+":
			case "-":
				return 10;
			case "*":
			case "/":
			case "%":
				return 20;
			case "^":
				return 30;
			default:
				return -1;
		}
	}

	peek() {
		return this.tokens[this.index];
	}

	consume() {
		const token = this.tokens[this.index];
		this.index += 1;
		return token;
	}

	match(type) {
		if (this.check(type)) {
			this.index += 1;
			return true;
		}
		return false;
	}

	check(type) {
		return this.peek().type === type;
	}

	expect(type) {
		const token = this.consume();
		if (token.type !== type) {
			throw new SyntaxError(`Expected ${type} but received ${token.type}`);
		}
		return token;
	}
}

export class AstTeXPrinter {
	print(node, parentPrecedence = 0) {
		switch (node.type) {
			case "number":
				return escapeLatex(node.value);
			case "identifier":
				return this.printIdentifier(node.name);
			case "unary":
				return this.printUnary(node, parentPrecedence);
			case "postfix":
				return `${this.wrapIfNeeded(this.print(node.operand, 40), 40, parentPrecedence)}!`;
			case "binary":
				return this.printBinary(node, parentPrecedence);
			case "call":
				return this.printCall(node, parentPrecedence);
			case "array":
				return this.printArray(node);
			default:
				return "\\text{?}";
		}
	}

	printIdentifier(name) {
		switch (name) {
			case "pi":
				return "\\pi";
			case "tau":
				return "\\tau";
			case "i":
				return "i";
			case "ans":
				return "\\mathrm{Ans}";
			default:
				return escapeLatex(name);
		}
	}

	printUnary(node, parentPrecedence) {
		const tex = `${node.operator === "-" ? "-" : "+"}${this.print(node.operand, 40)}`;
		return this.wrapIfNeeded(tex, 40, parentPrecedence);
	}

	printBinary(node, parentPrecedence) {
		const precedence = this.getPrecedence(node.operator);
		const left = this.print(node.left, precedence);
		const right = this.print(node.right, node.operator === "^" ? precedence : precedence + 1);
		let tex;
		switch (node.operator) {
			case "+":
				tex = `${left} + ${right}`;
				break;
			case "-":
				tex = `${left} - ${right}`;
				break;
			case "*":
				tex = node.implicit ? `${left}${right}` : `${left} \\cdot ${right}`;
				break;
			case "/":
				tex = `\\frac{${this.print(node.left, 0)}}{${this.print(node.right, 0)}}`;
				break;
			case "%":
				tex = `${left} \\bmod ${right}`;
				break;
			case "^":
				tex = `{${this.print(node.left, precedence)}}^{${this.print(node.right, 0)}}`;
				break;
			default:
				tex = `${left} ${escapeLatex(node.operator)} ${right}`;
		}
		return this.wrapIfNeeded(tex, precedence, parentPrecedence);
	}

	printCall(node, parentPrecedence = 0) {
		const [first, second] = node.args;
		const firstTex = first ? this.print(first, 0) : "";
		const secondTex = second ? this.print(second, 0) : "";
		const wrap = (tex, ownPrecedence = 100) => this.wrapIfNeeded(tex, ownPrecedence, parentPrecedence);
		switch (node.name) {
			case "sin":
			case "cos":
			case "tan":
			case "sinh":
			case "cosh":
			case "tanh":
				return `\\${node.name}\\left(${firstTex}\\right)`;
			case "asin":
			case "arcsin":
				return `\\arcsin\\left(${firstTex}\\right)`;
			case "acos":
			case "arccos":
				return `\\arccos\\left(${firstTex}\\right)`;
			case "atan":
			case "arctan":
				return `\\arctan\\left(${firstTex}\\right)`;
			case "atan2":
			case "arctan2":
				return `\\arctan_2\\left(${firstTex}, ${secondTex}\\right)`;
			case "asinh":
			case "arsinh":
			case "arcsinh":
				return `\\operatorname{arsinh}\\left(${firstTex}\\right)`;
			case "acosh":
			case "arcosh":
			case "arccosh":
				return `\\operatorname{arcosh}\\left(${firstTex}\\right)`;
			case "atanh":
			case "artanh":
			case "arctanh":
				return `\\operatorname{artanh}\\left(${firstTex}\\right)`;
			case "sqrt":
				return `\\sqrt{${firstTex}}`;
			case "cbrt":
				return `\\sqrt[3]{${firstTex}}`;
			case "nthRoot":
				return `\\sqrt[${secondTex}]{${firstTex}}`;
			case "pow":
				return `\\left(${firstTex}\\right)^{${secondTex}}`;
			case "exp":
				return `e^{${firstTex}}`;
			case "exp2":
				return `2^{${firstTex}}`;
			case "expm1":
				return wrap(`e^{${firstTex}} - 1`, 9);
			case "factorial":
				return `{${firstTex}}!`;
			case "reciprocal":
				return `\\frac{1}{${firstTex}}`;
			case "ln":
				return `\\ln\\left(${firstTex}\\right)`;
			case "log":
				return node.args.length >= 2 ? `\\log_{${secondTex}}\\left(${firstTex}\\right)` : `\\log\\left(${firstTex}\\right)`;
			case "log10":
				return `\\log_{10}\\left(${firstTex}\\right)`;
			case "log2":
				return `\\log_{2}\\left(${firstTex}\\right)`;
			case "log1p":
				return `\\ln\\left(1 + ${firstTex}\\right)`;
			case "gamma":
				return `\\Gamma\\left(${firstTex}\\right)`;
			case "zeta":
				return `\\zeta\\left(${firstTex}\\right)`;
			case "complex":
				return wrap(`${firstTex} + ${secondTex}i`, 9);
			case "polar":
				return wrap(`${firstTex}\\angle${secondTex}`, 19);
			case "conj":
				return `\\overline{${firstTex}}`;
			case "arg":
				return `\\arg\\left(${firstTex}\\right)`;
			case "real":
				return `\\Re\\left(${firstTex}\\right)`;
			case "imag":
				return `\\Im\\left(${firstTex}\\right)`;
			case "rotate":
				return `R_{${secondTex}}\\left(${firstTex}\\right)`;
			// roots
			case "dot":
				return wrap(`${firstTex} \\cdot ${secondTex}`, 19);
			case "cross":
				return wrap(`${firstTex} \\times ${secondTex}`, 19);
			case "norm":
				return `\\left\\lVert ${firstTex} \\right\\rVert`;
			case "angle":
				return `\\angle\\left(${firstTex}, ${secondTex}\\right)`;
			case "project":
				return `\\operatorname{proj}_{${secondTex}}\\left(${firstTex}\\right)`;
			case "distance":
				return `d\\left(${firstTex}, ${secondTex}\\right)`;
			case "det":
				return `\\det\\left(${firstTex}\\right)`;
			case "trace":
				return `\\operatorname{tr}\\left(${firstTex}\\right)`;
			case "rank":
				return `\\operatorname{rank}\\left(${firstTex}\\right)`;
			case "transpose":
				return `{${this.print(first, 31)}}^{\\mathsf{T}}`;
			case "inv":
				return `{${this.print(first, 31)}}^{-1}`;
			case "matmul":
				return wrap(`${firstTex}${secondTex}`, 19);
			case "hadamard":
				return wrap(`${firstTex} \\odot ${secondTex}`, 19);
			// solve
			case "rowS":
			case "rowSums":
				return `\\operatorname{rowS}\\left(${firstTex}\\right)`;
			case "colS":
			case "columnSums":
				return `\\operatorname{colS}\\left(${firstTex}\\right)`;
			case "frobenius":
				return `\\left\\lVert ${firstTex} \\right\\rVert_F`;
			// sum
			// product
			// average
			// max
			// min
			// median
			// variance
			// stddev
			case "abs":
				return `\\left|${firstTex}\\right|`;
			case "sign":
				return `\\operatorname{sgn}\\left(${firstTex}\\right)`;
			case "floor":
				return `\\left\\lfloor ${firstTex} \\right\\rfloor`;
			case "ceil":
				return `\\left\\lceil ${firstTex} \\right\\rceil`;
			// round
			// trunc
			// fround
			// clz32
			// normalize
			default:
				return `\\operatorname{${escapeLatex(node.name)}}\\left(${node.args.map((argument) => this.print(argument, 0)).join(", ")}\\right)`;
		}
	}

	printArray(node) {
		const isMatrix = node.items.every((item) => item.type === "array");
		if (isMatrix) {
			const rows = node.items.map((row) => row.items.map((cell) => this.print(cell, 0)).join(" & ")).join(" \\\\ ");
			return `\\begin{bmatrix}${rows}\\end{bmatrix}`;
		}
		return `\\begin{bmatrix}${node.items.map((item) => this.print(item, 0)).join(" \\\\ ")}\\end{bmatrix}`;
	}

	getPrecedence(operator) {
		switch (operator) {
			case "+":
			case "-":
				return 10;
			case "*":
			case "/":
			case "%":
				return 20;
			case "^":
				return 30;
			default:
				return 0;
		}
	}

	wrapIfNeeded(tex, ownPrecedence, parentPrecedence) {
		return ownPrecedence < parentPrecedence ? `\\left(${tex}\\right)` : tex;
	}
}

export class EvaluationContext {
	constructor(precision, settings = {}, lastAnswer = null) {
		this.precision = BigInt(precision);
		this.lastAnswer = lastAnswer ? deserializeValue(lastAnswer, this.precision) : null;
		BigFloat.config.extraPrecision = BigInt(settings.extraPrecision ?? 6);
		BigFloat.config.roundingMode = RoundingMode[settings.roundingMode] ?? RoundingMode.TRUNCATE;
		BigFloat.config.allowComplexNumbers = true;
		BigFloat.config.allowPrecisionMismatch = true;
		BigFloat.config.allowSpecialValues = true;
	}

	createScalar(value) {
		return value instanceof BigFloat ? value.clone().changePrecision(this.precision) : new BigFloat(value, this.precision);
	}

	createComplex(real, imag = 0) {
		if (real instanceof BigFloatComplex && imag === 0) {
			return real.clone().changePrecision(this.precision);
		}
		return BigFloatComplex.of(real, imag, this.precision);
	}

	createVector(values) {
		return BigFloatVector.from(values, this.precision);
	}

	createMatrix(rows) {
		return BigFloatMatrix.from(rows, this.precision);
	}
}

export class Evaluator {
	constructor(context) {
		this.context = context;
	}

	evaluate(node) {
		switch (node.type) {
			case "number":
				return this.context.createScalar(node.value);
			case "identifier":
				return this.resolveIdentifier(node.name);
			case "unary":
				return this.evaluateUnary(node);
			case "postfix":
				return this.evaluatePostfix(node);
			case "binary":
				return this.evaluateBinary(node);
			case "call":
				return this.evaluateCall(node);
			case "array":
				return this.evaluateArray(node);
			default:
				throw new TypeError(`Unsupported AST node: ${node.type}`);
		}
	}

	resolveIdentifier(name) {
		switch (name) {
			case "pi":
				return BigFloat.pi(this.context.precision);
			case "e":
				return BigFloat.e(this.context.precision);
			case "tau":
				return BigFloat.tau(this.context.precision);
			case "i":
				return BigFloatComplex.i(this.context.precision);
			case "ans":
				if (this.context.lastAnswer === null) {
					throw new ReferenceError("ans is not available yet.");
				}
				return this.context.lastAnswer;
			default:
				throw new ReferenceError(`Unknown identifier: ${name}`);
		}
	}

	evaluateUnary(node) {
		const value = this.evaluate(node.operand);
		return node.operator === "-" ? this.negate(value) : value;
	}

	evaluatePostfix(node) {
		const value = this.evaluate(node.operand);
		if (typeof value.factorial === "function") {
			return value.factorial();
		}
		throw new TypeError("Factorial is not supported for this value.");
	}

	evaluateBinary(node) {
		const left = this.evaluate(node.left);
		const right = this.evaluate(node.right);
		switch (node.operator) {
			case "+":
				return this.add(left, right);
			case "-":
				return this.sub(left, right);
			case "*":
				return this.mul(left, right);
			case "/":
				return this.div(left, right);
			case "%":
				return this.mod(left, right);
			case "^":
				return this.pow(left, right);
			default:
				throw new TypeError(`Unsupported operator: ${node.operator}`);
		}
	}

	evaluateCall(node) {
		const args = node.args.map((argument) => this.evaluate(argument));
		return this.callFunction(node.name, args);
	}

	evaluateArray(node) {
		const isMatrix = node.items.every((item) => item.type === "array");
		if (isMatrix) {
			const rows = node.items.map((rowNode) => rowNode.items.map((cellNode) => this.expectScalarOrComplex(this.evaluate(cellNode))));
			return this.context.createMatrix(rows);
		}
		if (node.items.some((item) => item.type === "array")) {
			throw new TypeError("Nested arrays must be rectangular matrices.");
		}
		return this.context.createVector(node.items.map((item) => this.expectScalarOrComplex(this.evaluate(item))));
	}

	callFunction(name, args) {
		switch (name) {
			case "arcsin":
				name = "asin";
				break;
			case "arccos":
				name = "acos";
				break;
			case "arctan":
				name = "atan";
				break;
			case "arsinh":
			case "arcsinh":
				name = "asinh";
				break;
			case "arcosh":
			case "arccosh":
				name = "acosh";
				break;
			case "artanh":
			case "arctanh":
				name = "atanh";
				break;
			case "neq":
				name = "ne";
				break;
			case "le":
				name = "lte";
				break;
			case "ge":
				name = "gte";
				break;
		}

		switch (name) {
			// constants and scalar constructors
			case "parseFloat":
				return BigFloat.parseFloat(String(this.expectScalar(args[0]).toString(10)), this.context.precision, args[1] ? this.toInteger(args[1]) : 10);
			case "random":
				return BigFloat.random(this.context.precision);
			case "nan":
				return BigFloat.nan(this.context.precision);
			case "inf":
			case "infinity":
				return BigFloat.infinity(this.context.precision);
			case "ninf":
			case "negativeInfinity":
				return BigFloat.negativeInfinity(this.context.precision);
			case "zero":
			case "one":
			case "two":
			case "ten":
			case "hundred":
			case "thousand":
			case "half":
			case "quarter":
			case "minusOne":
			case "minusTwo":
			case "minusTen":
				return BigFloat[name](this.context.precision);
			// trig
			case "atan2":
				return this.callMethod(args[0], "atan2", args[1]);
			// power
			case "nthRoot":
				return this.callMethod(args[0], "nthRoot", this.toInteger(args[1]));
			case "pow":
				return this.pow(args[0], args[1]);
			case "hypot":
				return BigFloat.hypot(...args.map((arg) => this.expectScalar(arg)));
			case "imul":
				return BigFloat.imul(this.expectScalar(args[0]), this.expectScalar(args[1]));
			// logs
			case "log":
				if (args.length >= 2) {
					return this.callMethod(args[0], "log", args[1]);
				}
				return this.callMethod(args[0], "ln");
			// complex
			case "complex":
				return this.context.createComplex(args[0] ?? 0, args[1] ?? 0);
			case "polar":
				return BigFloatComplex.fromPolar(this.expectScalar(args[0]), this.expectScalar(args[1]), this.context.precision);
			case "conj":
				return this.toComplex(args[0]).conjugate();
			case "arg":
				return this.toComplex(args[0]).arg();
			case "real":
				return this.toComplex(args[0]).real;
			case "imag":
				return this.toComplex(args[0]).imag;
			case "rotate":
				return this.toComplex(args[0]).rotate(this.expectScalar(args[1]));
			case "roots":
				return this.context.createVector(this.toComplex(args[0]).nthRoots(this.toInteger(args[1])));
			// vector and matrix constructors
			case "vector":
			case "vec":
				return this.context.createVector(args.map((arg) => this.expectScalarOrComplex(arg)));
			case "matrix":
				return this.context.createMatrix(args.map((arg) => (this.isVector(arg) ? arg.toArray() : [this.expectScalarOrComplex(arg)])));
			case "zeros":
				return BigFloatVector.zeros(this.toInteger(args[0]), this.context.precision);
			case "ones":
				return BigFloatVector.ones(this.toInteger(args[0]), this.context.precision);
			case "fill":
				return this.context.createVector(Array.from({ length: this.toInteger(args[0]) }, () => this.expectScalarOrComplex(args[1])));
			case "basis":
				return BigFloatVector.basis(this.toInteger(args[0]), this.toInteger(args[1]), this.context.precision);
			case "linspace":
				return BigFloatVector.linspace(this.expectScalarOrComplex(args[0]), this.expectScalarOrComplex(args[1]), this.toInteger(args[2]), this.context.precision);
			case "identity":
				return BigFloatMatrix.identity(this.toInteger(args[0]), this.context.precision);
			case "diagonal":
				return this.createDiagonalMatrix(this.expectVector(args[0], true));
			case "matrixZeros":
				return BigFloatMatrix.zeros(this.toInteger(args[0]), this.toInteger(args[1]), this.context.precision);
			case "matrixOnes":
				return BigFloatMatrix.ones(this.toInteger(args[0]), this.toInteger(args[1]), this.context.precision);
			case "matrixFill":
				return this.context.createMatrix(Array.from({ length: this.toInteger(args[0]) }, () => Array.from({ length: this.toInteger(args[1]) }, () => this.expectScalarOrComplex(args[2]))));
			case "range":
				return BigFloatVector.fromStream(BigFloatStream.range(this.expectScalar(args[0]), args[1], args[2] ?? 1, this.context.precision));
			case "arithmetic":
				return BigFloatVector.fromStream(BigFloatStream.arithmetic(this.expectScalarOrComplex(args[0]), this.expectScalarOrComplex(args[1]), this.toInteger(args[2]), this.context.precision));
			case "geometric":
				return BigFloatVector.fromStream(BigFloatStream.geometric(this.expectScalarOrComplex(args[0]), this.expectScalarOrComplex(args[1]), this.toInteger(args[2]), this.context.precision));
			case "logspace":
				return BigFloatVector.fromStream(BigFloatStream.logspace(this.expectScalar(args[0]), this.expectScalar(args[1]), this.toInteger(args[2]), this.context.precision));
			case "harmonic":
				return BigFloatVector.fromStream(BigFloatStream.harmonic(this.toInteger(args[0]), this.context.precision));
			case "repeat":
				return BigFloatVector.fromStream(BigFloatStream.repeat(this.expectScalarOrComplex(args[0]), this.toInteger(args[1]), this.context.precision));
			case "fibonacci":
				return BigFloatVector.fromStream(BigFloatStream.fibonacci(this.toInteger(args[0]), this.context.precision));
			case "factorialSeq":
				return BigFloatVector.fromStream(BigFloatStream.factorial(this.toInteger(args[0]), this.context.precision));
			// linear
			case "dot":
				return this.expectVector(args[0], true).dot(this.expectVector(args[1], true));
			case "cross":
				return this.expectVector(args[0], true).cross(this.expectVector(args[1], true));
			case "norm":
				if (this.isMatrix(args[0])) {
					return this.expectMatrix(args[0], true).frobeniusNorm();
				}
				if (this.isVector(args[0])) {
					return this.expectVector(args[0], true).norm();
				}
				if (this.isComplex(args[0])) {
					return this.toComplex(args[0]).abs();
				}
				return this.expectScalar(args[0]).abs();
			case "angle":
				return this.expectVector(args[0], true).angleTo(this.expectVector(args[1], true));
			case "project":
				return this.expectVector(args[0], true).projectOnto(this.expectVector(args[1], true));
			case "distance":
				return this.callDistance(args[0], args[1]);
			case "det":
				return this.expectMatrix(args[0], true).determinant();
			case "trace":
				return this.expectMatrix(args[0], true).trace();
			case "rank":
				return this.expectMatrix(args[0], true).rank();
			case "transpose":
				return this.expectMatrix(args[0], true).transpose();
			case "inv":
				return this.expectMatrix(args[0], true).inverse();
			case "matmul":
				if (this.isVector(args[1])) {
					return this.expectMatrix(args[0], true).mulVector(this.expectVector(args[1], true));
				}
				return this.expectMatrix(args[0], true).matmul(this.expectMatrix(args[1], true));
			case "mulVector":
				return this.expectMatrix(args[0], true).mulVector(this.expectVector(args[1], true));
			case "hadamard":
				return this.callHadamard(args[0], args[1]);
			case "solve":
				return this.callSolve(args[0], args[1]);
			case "rowS":
			case "rowSums":
				return this.expectMatrix(args[0], true).rowSums();
			case "colS":
			case "columnSums":
				return this.expectMatrix(args[0], true).columnSums();
			case "frobenius":
				return this.expectMatrix(args[0], true).frobeniusNorm();
			case "squaredNorm":
				return this.expectVector(args[0], true).squaredNorm();
			case "squaredDistance":
				return this.expectVector(args[0], true).squaredDistanceTo(this.expectVector(args[1], true));
			case "shape":
				return this.expectMatrix(args[0], true).shape();
			case "dimension":
				return this.expectVector(args[0], true).dimension();
			case "row":
				return this.expectMatrix(args[0], true).row(this.toInteger(args[1]));
			case "column":
				return this.expectMatrix(args[0], true).column(this.toInteger(args[1]));
			case "diagonalVector":
				return this.expectMatrix(args[0], true).diagonalVector();
			case "flatten":
				return this.expectMatrix(args[0], true).flatten();
			// stats
			case "sum":
			case "product":
			case "average":
			case "max":
			case "min":
			case "median":
			case "variance":
			case "stddev":
				return this.callAggregate(name, args);
			// comparison and conversion
			case "compare":
			case "eq":
			case "equals":
			case "ne":
			case "lt":
			case "lte":
			case "gt":
			case "gte":
			case "relativeDiff":
			case "absoluteDiff":
			case "percentDiff":
			case "distanceTo":
				return this.callMethod(args[0], name, args[1]);
			case "isZero":
			case "isPositive":
			case "isNegative":
			case "isReal":
			case "isImaginary":
			case "isEmpty":
			case "isSquare":
				return this.callMethod(args[0], name);
			case "absSquared":
				return this.callMethod(args[0], "absSquared");
			case "toNumber":
				return this.callMethod(args[0], "toNumber");
			case "toFixed":
				return this.callMethod(args[0], "toFixed", this.toInteger(args[1]));
			case "toExponential":
				return this.callMethod(args[0], "toExponential", args[1] ? this.toInteger(args[1]) : undefined);
			case "string":
			case "toStringValue":
				return this.callMethod(args[0], "toString", args[1] ? this.toInteger(args[1]) : 10, args[2] ? this.toInteger(args[2]) : this.context.precision);

			default:
				if (UNARY_VALUE_FUNCTIONS.has(name)) {
					return this.callMethod(args[0], name);
				}
				throw new ReferenceError(`Unknown function: ${name}`);
		}
	}

	callMethod(value, method, ...args) {
		if (value === undefined || typeof value[method] !== "function") {
			throw new TypeError(`${method} is not supported for this value.`);
		}
		return value[method](...args);
	}

	callAggregate(name, args) {
		if (args.length === 1 && this.isVector(args[0])) {
			return args[0][name]();
		}
		if (args.length === 1 && this.isMatrix(args[0]) && typeof args[0][name] === "function") {
			return args[0][name]();
		}
		if (args.length === 1) {
			return this.expectScalarOrComplex(args[0]);
		}
		if (args.some((arg) => this.isComplex(arg))) {
			const values = args.map((arg) => this.toComplex(arg));
			switch (name) {
				case "sum":
					return values.reduce((acc, value) => acc.add(value));
				case "product":
					return values.reduce((acc, value) => acc.mul(value));
				case "average":
					return values.reduce((acc, value) => acc.add(value)).div(values.length);
				case "max":
				case "min":
					throw new TypeError(`${name} is not supported for complex values.`);
				default:
					throw new TypeError(`${name} is not supported for complex values.`);
			}
		}
		return BigFloat[name](...args.map((arg) => this.expectScalar(arg)));
	}

	callDistance(left, right) {
		if (this.isVector(left)) {
			return this.expectVector(left, true).distanceTo(this.expectVector(right, true));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).distanceTo(this.toComplex(right));
		}
		return this.expectScalar(left).absoluteDiff(this.expectScalar(right));
	}

	callHadamard(left, right) {
		if (this.isMatrix(left)) {
			return this.expectMatrix(left, true).hadamard(this.expectMatrix(right, true));
		}
		if (this.isVector(left)) {
			return this.expectVector(left, true).hadamard(this.expectVector(right, true));
		}
		throw new TypeError("hadamard expects vectors or matrices.");
	}

	callSolve(matrixValue, rhs) {
		const matrix = this.expectMatrix(matrixValue, true);
		if (this.isMatrix(rhs)) {
			return matrix.solveMatrix(rhs);
		}
		return matrix.solveVector(this.expectVector(rhs));
	}

	createDiagonalMatrix(vector) {
		const values = vector.toArray();
		return this.context.createMatrix(values.map((entry, row) => values.map((_, column) => (row === column ? entry : this.context.createScalar(0)))));
	}

	add(left, right) {
		if (this.isMatrix(left)) {
			return left.add(this.adaptMatrixOperand(right, true));
		}
		if (this.isMatrix(right)) {
			return right.add(this.adaptMatrixOperand(left, true));
		}
		if (this.isVector(left)) {
			return left.add(this.adaptVectorOperand(right, true));
		}
		if (this.isVector(right)) {
			return right.add(this.adaptVectorOperand(left, true));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).add(this.toComplex(right));
		}
		return this.expectScalar(left).add(this.expectScalar(right));
	}

	sub(left, right) {
		if (this.isMatrix(left)) {
			return left.sub(this.adaptMatrixOperand(right, true));
		}
		if (this.isVector(left)) {
			return left.sub(this.adaptVectorOperand(right, true));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).sub(this.toComplex(right));
		}
		return this.expectScalar(left).sub(this.expectScalar(right));
	}

	mul(left, right) {
		if (this.isMatrix(left)) {
			return left.mul(this.adaptMatrixOperand(right, true));
		}
		if (this.isMatrix(right)) {
			return right.mul(this.adaptMatrixOperand(left, true));
		}
		if (this.isVector(left)) {
			return left.mul(this.adaptVectorOperand(right, true));
		}
		if (this.isVector(right)) {
			return right.mul(this.adaptVectorOperand(left, true));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).mul(this.toComplex(right));
		}
		return this.expectScalar(left).mul(this.expectScalar(right));
	}

	div(left, right) {
		if (this.isMatrix(left)) {
			return left.div(this.adaptMatrixOperand(right, true));
		}
		if (this.isVector(left)) {
			return left.div(this.adaptVectorOperand(right, true));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).div(this.toComplex(right));
		}
		return this.expectScalar(left).div(this.expectScalar(right));
	}

	mod(left, right) {
		if (this.isMatrix(left)) {
			return left.mod(this.adaptMatrixOperand(right, true));
		}
		if (this.isVector(left)) {
			return left.mod(this.adaptVectorOperand(right, true));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			throw new TypeError("Complex modulo is not supported.");
		}
		return this.expectScalar(left).mod(this.expectScalar(right));
	}

	pow(left, right) {
		if (this.isMatrix(left)) {
			return left.matrixPow(this.toInteger(right));
		}
		if (this.isVector(left)) {
			return left.pow(this.expectScalarOrComplex(right));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).pow(this.toComplex(right));
		}
		return this.expectScalar(left).pow(this.expectScalar(right));
	}

	negate(value) {
		if (typeof value.neg === "function") {
			return value.neg();
		}
		throw new TypeError("Unary minus is not supported for this value.");
	}

	toComplex(value) {
		return value instanceof BigFloatComplex ? value : this.context.createComplex(this.expectScalar(value), 0);
	}

	toInteger(value) {
		const number = this.expectScalar(value).toNumber();
		if (!Number.isFinite(number) || !Number.isInteger(number)) {
			throw new TypeError("Expected an integer.");
		}
		return number;
	}

	adaptVectorOperand(value, allowComplex = false) {
		return this.isVector(value) ? value : this.expectScalarOrComplex(value, allowComplex);
	}

	adaptMatrixOperand(value, allowComplex = false) {
		return this.isMatrix(value) ? value : this.expectScalarOrComplex(value, allowComplex);
	}

	expectScalarOrComplex(value, allowComplex = true) {
		if (value instanceof BigFloat || (allowComplex && value instanceof BigFloatComplex)) {
			return value;
		}
		throw new TypeError(allowComplex ? "Expected a scalar BigFloat or BigFloatComplex value." : "Expected a scalar BigFloat value.");
	}

	expectScalar(value) {
		if (value instanceof BigFloat) {
			return value;
		}
		throw new TypeError("Expected a scalar BigFloat value.");
	}

	expectVector(value, allowComplex = false) {
		if (value instanceof BigFloatVector || (allowComplex && value instanceof BigFloatComplexVector)) {
			return value;
		}
		throw new TypeError(allowComplex ? "Expected a BigFloatVector or BigFloatComplexVector." : "Expected a BigFloatVector.");
	}

	expectMatrix(value, allowComplex = false) {
		if (value instanceof BigFloatMatrix || (allowComplex && value instanceof BigFloatComplexMatrix)) {
			return value;
		}
		throw new TypeError(allowComplex ? "Expected a BigFloatMatrix or BigFloatComplexMatrix." : "Expected a BigFloatMatrix.");
	}

	isComplex(value) {
		return value instanceof BigFloatComplex;
	}

	isVector(value) {
		return value instanceof BigFloatVector || value instanceof BigFloatComplexVector;
	}

	isMatrix(value) {
		return value instanceof BigFloatMatrix || value instanceof BigFloatComplexMatrix;
	}
}

export function serializeValue(value, precision) {
	const digits = BigInt(precision);
	if (typeof value === "boolean") {
		return { kind: "boolean", text: value ? "true" : "false" };
	}
	if (typeof value === "number" || typeof value === "bigint") {
		return { kind: "number", text: String(value) };
	}
	if (typeof value === "string") {
		return { kind: "text", text: value };
	}
	if (Array.isArray(value)) {
		return {
			kind: "vector",
			values: value.map((entry) => serializeValue(entry, digits)),
		};
	}
	if (value instanceof BigFloat) {
		return { kind: "scalar", value: value.toString(10, digits) };
	}
	if (value instanceof BigFloatComplex) {
		return {
			kind: "complex",
			text: value.toString(10, digits),
			re: value.real.toString(10, digits),
			im: value.imag.toString(10, digits),
		};
	}
	if (value instanceof BigFloatVector) {
		return {
			kind: "vector",
			values: value.toArray().map((entry) => serializeValue(entry, digits)),
		};
	}
	if (value instanceof BigFloatComplexVector) {
		return {
			kind: "complex-vector",
			values: value.toArray().map((entry) => serializeValue(entry, digits)),
		};
	}
	if (value instanceof BigFloatMatrix) {
		return {
			kind: "matrix",
			rows: value.toArray().map((row) => row.map((entry) => serializeValue(entry, digits))),
		};
	}
	if (value instanceof BigFloatComplexMatrix) {
		return {
			kind: "complex-matrix",
			rows: value.toArray().map((row) => row.map((entry) => serializeValue(entry, digits))),
		};
	}
	if (value instanceof BigFloatStream) {
		return {
			kind: "vector",
			values: value.toArray().map((entry) => serializeValue(entry, digits)),
		};
	}
	console.warn("Unsupported value for serialization:", value);
	throw new TypeError("Unsupported value for serialization.");
}

export function deserializeValue(serialized, precision) {
	const digits = BigInt(precision);
	switch (serialized.kind) {
		case "boolean":
			return serialized.text === "true";
		case "number":
			return Number(serialized.text);
		case "text":
			return serialized.text;
		case "scalar":
			return new BigFloat(serialized.value, digits);
		case "complex":
			return BigFloatComplex.of(serialized.re, serialized.im, digits);
		case "vector":
			return BigFloatVector.from(
				serialized.values.map((entry) => deserializeValue(entry, digits)),
				digits,
			);
		case "complex-vector":
			return BigFloatComplexVector.from(
				serialized.values.map((entry) => deserializeValue(entry, digits)),
				digits,
			);
		case "matrix":
			return BigFloatMatrix.fromRows(
				serialized.rows.map((row) => row.map((entry) => deserializeValue(entry, digits))),
				digits,
			);
		case "complex-matrix":
			return BigFloatComplexMatrix.fromRows(
				serialized.rows.map((row) => row.map((entry) => deserializeValue(entry, digits))),
				digits,
			);
		default:
			throw new TypeError("Unknown serialized value.");
	}
}

export function parseExpression(source) {
	return new Parser(new Tokenizer(source).tokenize()).parse();
}
