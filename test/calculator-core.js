import {
	BigFloat,
	BigFloatComplex,
	BigFloatMatrix,
	BigFloatVector,
	RoundingMode,
} from "../dist/BigFloat.js";

export const ROUNDING_MODE_OPTIONS = ["TRUNCATE", "DOWN", "UP", "CEIL", "FLOOR", "HALF_UP", "HALF_DOWN"];

const UNARY_VALUE_FUNCTIONS = new Set([
	"abs",
	"acos",
	"acosh",
	"asin",
	"asinh",
	"atan",
	"atanh",
	"cbrt",
	"ceil",
	"clz32",
	"cos",
	"cosh",
	"exp",
	"exp2",
	"expm1",
	"factorial",
	"floor",
	"fround",
	"gamma",
	"ln",
	"log1p",
	"log10",
	"log2",
	"normalize",
	"reciprocal",
	"round",
	"sign",
	"sin",
	"sinh",
	"sqrt",
	"tan",
	"tanh",
	"trace",
	"transpose",
	"trunc",
	"zeta",
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
		case "vector":
			return `[${serialized.values.map((entry) => formatSerializedValue(entry, precision)).join(", ")}]`;
		case "matrix":
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
				return this.printCall(node);
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

	printCall(node) {
		const [first, second] = node.args;
		const firstTex = first ? this.print(first, 0) : "";
		const secondTex = second ? this.print(second, 0) : "";
		switch (node.name) {
			case "sqrt":
				return `\\sqrt{${firstTex}}`;
			case "cbrt":
				return `\\sqrt[3]{${firstTex}}`;
			case "nthRoot":
				return `\\sqrt[${secondTex}]{${firstTex}}`;
			case "abs":
				return `\\left|${firstTex}\\right|`;
			case "floor":
				return `\\left\\lfloor ${firstTex} \\right\\rfloor`;
			case "ceil":
				return `\\left\\lceil ${firstTex} \\right\\rceil`;
			case "exp":
				return `e^{${firstTex}}`;
			case "exp2":
				return `2^{${firstTex}}`;
			case "ln":
				return `\\ln\\left(${firstTex}\\right)`;
			case "log":
				return node.args.length >= 2
					? `\\log_{${secondTex}}\\left(${firstTex}\\right)`
					: `\\log\\left(${firstTex}\\right)`;
			case "log10":
				return `\\log_{10}\\left(${firstTex}\\right)`;
			case "log2":
				return `\\log_{2}\\left(${firstTex}\\right)`;
			case "gamma":
				return `\\Gamma\\left(${firstTex}\\right)`;
			case "zeta":
				return `\\zeta\\left(${firstTex}\\right)`;
			case "real":
				return `\\Re\\left(${firstTex}\\right)`;
			case "imag":
				return `\\Im\\left(${firstTex}\\right)`;
			case "conj":
				return `\\overline{${firstTex}}`;
			case "arg":
				return `\\arg\\left(${firstTex}\\right)`;
			case "complex":
				return `${firstTex} + ${secondTex}i`;
			case "polar":
				return `\\operatorname{polar}\\left(${firstTex}, ${secondTex}\\right)`;
			case "dot":
				return `${firstTex} \\cdot ${secondTex}`;
			case "cross":
				return `${firstTex} \\times ${secondTex}`;
			case "distance":
				return `d\\left(${firstTex}, ${secondTex}\\right)`;
			case "angle":
				return `\\angle\\left(${firstTex}, ${secondTex}\\right)`;
			case "project":
				return `\\operatorname{proj}_{${secondTex}}\\left(${firstTex}\\right)`;
			case "norm":
				return `\\left\\lVert ${firstTex} \\right\\rVert`;
			case "det":
				return `\\det\\left(${firstTex}\\right)`;
			case "trace":
				return `\\operatorname{tr}\\left(${firstTex}\\right)`;
			case "rank":
				return `\\operatorname{rank}\\left(${firstTex}\\right)`;
			case "inv":
				return `{${firstTex}}^{-1}`;
			case "transpose":
				return `{${firstTex}}^{\\mathsf{T}}`;
			case "matmul":
				return `${firstTex}${secondTex}`;
			case "hadamard":
				return `${firstTex} \\odot ${secondTex}`;
			case "solve":
				return `${firstTex}x = ${secondTex}`;
			case "frobenius":
				return `\\left\\lVert ${firstTex} \\right\\rVert_F`;
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
		return BigFloatMatrix.fromRows(rows, this.precision);
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
			const rows = node.items.map((rowNode) => rowNode.items.map((cellNode) => this.expectScalar(this.evaluate(cellNode))));
			return this.context.createMatrix(rows);
		}
		if (node.items.some((item) => item.type === "array")) {
			throw new TypeError("Nested arrays must be rectangular matrices.");
		}
		return this.context.createVector(node.items.map((item) => this.expectScalar(this.evaluate(item))));
	}

	callFunction(name, args) {
		switch (name) {
			case "complex":
				return this.context.createComplex(args[0] ?? 0, args[1] ?? 0);
			case "polar":
				return BigFloatComplex.fromPolar(this.expectScalar(args[0]), this.expectScalar(args[1]), this.context.precision);
			case "real":
				return this.toComplex(args[0]).real;
			case "imag":
				return this.toComplex(args[0]).imag;
			case "conj":
				return this.toComplex(args[0]).conjugate();
			case "arg":
				return this.toComplex(args[0]).arg();
			case "rotate":
				return this.toComplex(args[0]).rotate(this.expectScalar(args[1]));
			case "roots":
				return this.toComplex(args[0]).nthRoots(this.toInteger(args[1]));
			case "dot":
				return this.expectVector(args[0]).dot(this.expectVector(args[1]));
			case "cross":
				return this.expectVector(args[0]).cross(this.expectVector(args[1]));
			case "norm":
				if (this.isMatrix(args[0])) {
					return this.expectMatrix(args[0]).frobeniusNorm();
				}
				if (this.isVector(args[0])) {
					return this.expectVector(args[0]).norm();
				}
				if (this.isComplex(args[0])) {
					return this.toComplex(args[0]).abs();
				}
				return this.expectScalar(args[0]).abs();
			case "distance":
				return this.callDistance(args[0], args[1]);
			case "angle":
				return this.expectVector(args[0]).angleTo(this.expectVector(args[1]));
			case "project":
				return this.expectVector(args[0]).projectOnto(this.expectVector(args[1]));
			case "det":
				return this.expectMatrix(args[0]).determinant();
			case "trace":
				return this.expectMatrix(args[0]).trace();
			case "rank":
				return this.expectMatrix(args[0]).rank();
			case "transpose":
				return this.expectMatrix(args[0]).transpose();
			case "inv":
				return this.expectMatrix(args[0]).inverse();
			case "rowSums":
				return this.expectMatrix(args[0]).rowSums();
			case "columnSums":
				return this.expectMatrix(args[0]).columnSums();
			case "matmul":
				return this.expectMatrix(args[0]).matmul(this.expectMatrix(args[1]));
			case "hadamard":
				return this.callHadamard(args[0], args[1]);
			case "solve":
				return this.callSolve(args[0], args[1]);
			case "frobenius":
				return this.expectMatrix(args[0]).frobeniusNorm();
			case "sum":
			case "product":
			case "average":
			case "max":
			case "min":
				return this.callAggregate(name, args);
			case "median":
			case "variance":
			case "stddev":
				return BigFloat[name](...args.map((arg) => this.expectScalar(arg)));
			case "pow":
				return this.pow(args[0], args[1]);
			case "nthRoot":
				return this.callMethod(args[0], "nthRoot", this.toInteger(args[1]));
			case "log":
				if (args.length >= 2) {
					return this.callMethod(args[0], "log", args[1]);
				}
				return this.callMethod(args[0], "ln");
			case "atan2":
				return this.callMethod(args[0], "atan2", args[1]);
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
		if (args.length === 1 && this.isMatrix(args[0])) {
			return args[0][name]();
		}
		if (args.length === 1 && this.isComplex(args[0])) {
			throw new TypeError(`${name} is not defined for a single complex value.`);
		}
		return BigFloat[name](...args.map((arg) => this.expectScalar(arg)));
	}

	callDistance(left, right) {
		if (this.isVector(left)) {
			return left.distanceTo(this.expectVector(right));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).distanceTo(this.toComplex(right));
		}
		return this.expectScalar(left).absoluteDiff(this.expectScalar(right));
	}

	callHadamard(left, right) {
		if (this.isMatrix(left)) {
			return left.hadamard(this.expectMatrix(right));
		}
		if (this.isVector(left)) {
			return left.hadamard(this.expectVector(right));
		}
		throw new TypeError("hadamard expects vectors or matrices.");
	}

	callSolve(matrixValue, rhs) {
		const matrix = this.expectMatrix(matrixValue);
		if (this.isMatrix(rhs)) {
			return matrix.solveMatrix(rhs);
		}
		return matrix.solveVector(this.expectVector(rhs));
	}

	add(left, right) {
		if (this.isMatrix(left)) {
			return left.add(this.adaptMatrixOperand(right));
		}
		if (this.isMatrix(right)) {
			return right.add(this.adaptMatrixOperand(left));
		}
		if (this.isVector(left)) {
			return left.add(this.adaptVectorOperand(right));
		}
		if (this.isVector(right)) {
			return right.add(this.adaptVectorOperand(left));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).add(this.toComplex(right));
		}
		return this.expectScalar(left).add(this.expectScalar(right));
	}

	sub(left, right) {
		if (this.isMatrix(left)) {
			return left.sub(this.adaptMatrixOperand(right));
		}
		if (this.isVector(left)) {
			return left.sub(this.adaptVectorOperand(right));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).sub(this.toComplex(right));
		}
		return this.expectScalar(left).sub(this.expectScalar(right));
	}

	mul(left, right) {
		if (this.isMatrix(left)) {
			return left.mul(this.adaptMatrixOperand(right));
		}
		if (this.isMatrix(right)) {
			return right.mul(this.adaptMatrixOperand(left));
		}
		if (this.isVector(left)) {
			return left.mul(this.adaptVectorOperand(right));
		}
		if (this.isVector(right)) {
			return right.mul(this.adaptVectorOperand(left));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).mul(this.toComplex(right));
		}
		return this.expectScalar(left).mul(this.expectScalar(right));
	}

	div(left, right) {
		if (this.isMatrix(left)) {
			return left.div(this.adaptMatrixOperand(right));
		}
		if (this.isVector(left)) {
			return left.div(this.adaptVectorOperand(right));
		}
		if (this.isComplex(left) || this.isComplex(right)) {
			return this.toComplex(left).div(this.toComplex(right));
		}
		return this.expectScalar(left).div(this.expectScalar(right));
	}

	mod(left, right) {
		if (this.isMatrix(left)) {
			return left.mod(this.adaptMatrixOperand(right));
		}
		if (this.isVector(left)) {
			return left.mod(this.adaptVectorOperand(right));
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
			return left.pow(this.expectScalar(right));
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

	adaptVectorOperand(value) {
		return value instanceof BigFloatVector ? value : this.expectScalar(value);
	}

	adaptMatrixOperand(value) {
		return value instanceof BigFloatMatrix ? value : this.expectScalar(value);
	}

	expectScalar(value) {
		if (value instanceof BigFloat) {
			return value;
		}
		throw new TypeError("Expected a scalar BigFloat value.");
	}

	expectVector(value) {
		if (value instanceof BigFloatVector) {
			return value;
		}
		throw new TypeError("Expected a BigFloatVector.");
	}

	expectMatrix(value) {
		if (value instanceof BigFloatMatrix) {
			return value;
		}
		throw new TypeError("Expected a BigFloatMatrix.");
	}

	isComplex(value) {
		return value instanceof BigFloatComplex;
	}

	isVector(value) {
		return value instanceof BigFloatVector;
	}

	isMatrix(value) {
		return value instanceof BigFloatMatrix;
	}
}

export function serializeValue(value, precision) {
	const digits = BigInt(precision);
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
	if (value instanceof BigFloatMatrix) {
		return {
			kind: "matrix",
			rows: value.toArray().map((row) => row.map((entry) => serializeValue(entry, digits))),
		};
	}
	throw new TypeError("Unsupported value for serialization.");
}

export function deserializeValue(serialized, precision) {
	const digits = BigInt(precision);
	switch (serialized.kind) {
		case "scalar":
			return new BigFloat(serialized.value, digits);
		case "complex":
			return BigFloatComplex.of(serialized.re, serialized.im, digits);
		case "vector":
			return BigFloatVector.from(serialized.values.map((entry) => deserializeValue(entry, digits)), digits);
		case "matrix":
			return BigFloatMatrix.fromRows(serialized.rows.map((row) => row.map((entry) => deserializeValue(entry, digits))), digits);
		default:
			throw new TypeError("Unknown serialized value.");
	}
}

export function parseExpression(source) {
	return new Parser(new Tokenizer(source).tokenize()).parse();
}
