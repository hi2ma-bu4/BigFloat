import { BigFloat, BigFloatComplex, BigFloatMatrix, BigFloatStream, BigFloatVector } from "../dist/BigFloat.js";
import { AstTeXPrinter, ROUNDING_MODE_OPTIONS, escapeLatex, formatSerializedValue, parseExpression } from "./calculator-core.js";

const DEFAULT_HINT = "sin(x)";

const FUNCTION_GROUPS = [
	{
		id: "trig",
		label: "Trig",
		items: [
			{ insert: "sin(", texLabel: "\\sin", hint: "sin(x)" },
			{ insert: "cos(", texLabel: "\\cos", hint: "cos(x)" },
			{ insert: "tan(", texLabel: "\\tan", hint: "tan(x)" },
			{ insert: "asin(", texLabel: "\\arcsin", hint: "asin(x)" },
			{ insert: "acos(", texLabel: "\\arccos", hint: "acos(x)" },
			{ insert: "atan(", texLabel: "\\arctan", hint: "atan(x)" },
			{ insert: "atan2(", texLabel: "\\arctan_2", hint: "atan2(y, x)" },
			{ insert: "sinh(", texLabel: "\\sinh", hint: "sinh(x)" },
			{ insert: "cosh(", texLabel: "\\cosh", hint: "cosh(x)" },
			{ insert: "tanh(", texLabel: "\\tanh", hint: "tanh(x)" },
			{ insert: "asinh(", texLabel: "\\operatorname{arsinh}", hint: "asinh(x)" },
			{ insert: "acosh(", texLabel: "\\operatorname{arcosh}", hint: "acosh(x)" },
			{ insert: "atanh(", texLabel: "\\operatorname{artanh}", hint: "atanh(x)" },
		],
	},
	{
		id: "power",
		label: "Pow",
		items: [
			{ insert: "sqrt(", texLabel: "\\sqrt{x}", hint: "sqrt(x)" },
			{ insert: "cbrt(", texLabel: "\\sqrt[3]{x}", hint: "cbrt(x)" },
			{ insert: "nthRoot(", texLabel: "\\sqrt[n]{x}", hint: "nthRoot(x, n)" },
			{ insert: "pow(", texLabel: "x^y", hint: "pow(x, n)" },
			{ insert: "exp(", texLabel: "e^x", hint: "exp(x)" },
			{ insert: "exp2(", texLabel: "2^x", hint: "exp2(x)" },
			{ insert: "expm1(", texLabel: "e^x - 1", hint: "expm1(x)" },
			{ insert: "factorial(", texLabel: "x!", hint: "factorial(n)" },
			{ insert: "reciprocal(", texLabel: "\\frac{1}{x}", hint: "reciprocal(x)" },
		],
	},
	{
		id: "logs",
		label: "Log",
		items: [
			{ insert: "ln(", texLabel: "\\ln", hint: "ln(x)" },
			{ insert: "log(", texLabel: "\\log_y x", hint: "log(x, base)" },
			{ insert: "log10(", texLabel: "\\log_{10}", hint: "log10(x)" },
			{ insert: "log2(", texLabel: "\\log_2", hint: "log2(x)" },
			{ insert: "log1p(", texLabel: "\\ln(1+x)", hint: "log1p(x)" },
			{ insert: "gamma(", texLabel: "\\Gamma(x)", hint: "gamma(x)" },
			{ insert: "zeta(", texLabel: "\\zeta(x)", hint: "zeta(x)" },
		],
	},
	{
		id: "complex",
		label: "Cx",
		items: [
			{ insert: "complex(", texLabel: "\\operatorname{complex}", hint: "complex(re, im)" },
			{ insert: "polar(", texLabel: "r\\angle\\theta", hint: "polar(r, theta)" },
			{ insert: "conj(", texLabel: "\\overline{z}", hint: "conj(z)" },
			{ insert: "arg(", texLabel: "\\arg(z)", hint: "arg(z)" },
			{ insert: "real(", texLabel: "\\Re(z)", hint: "real(z)" },
			{ insert: "imag(", texLabel: "\\Im(z)", hint: "imag(z)" },
			{ insert: "rotate(", texLabel: "R_{\\theta}(z)", hint: "rotate(z, theta)" },
			{ insert: "roots(", texLabel: "\\sqrt[n]{z}", hint: "roots(z, n)" },
		],
	},
	{
		id: "linear",
		label: "Lin",
		items: [
			{ insert: "dot(", texLabel: "v\\cdot w", hint: "dot(v, w)" },
			{ insert: "cross(", texLabel: "v\\times w", hint: "cross(v, w)" },
			{ insert: "norm(", texLabel: "\\lVert v \\rVert", hint: "norm(v)" },
			{ insert: "angle(", texLabel: "\\theta_{v,w}", hint: "angle(v, w)" },
			{ insert: "project(", texLabel: "\\operatorname{proj}_w v", hint: "project(v, onto)" },
			{ insert: "distance(", texLabel: "d(a,b)", hint: "distance(a, b)" },
			{ insert: "det(", texLabel: "\\det(A)", hint: "det(matrix)" },
			{ insert: "trace(", texLabel: "\\operatorname{tr}(A)", hint: "trace(matrix)" },
			{ insert: "rank(", texLabel: "\\operatorname{rank}(A)", hint: "rank(matrix)" },
			{ insert: "transpose(", texLabel: "A^\\mathsf{T}", hint: "transpose(matrix)" },
			{ insert: "inv(", texLabel: "A^{-1}", hint: "inv(matrix)" },
			{ insert: "matmul(", texLabel: "AB", hint: "matmul(a, b)" },
			{ insert: "hadamard(", texLabel: "A\\odot B", hint: "hadamard(a, b)" },
			{ insert: "solve(", texLabel: "Ax=b", hint: "solve(matrix, vector)" },
			{ insert: "rowS(", label: "rowS", hint: "rowS(matrix)" },
			{ insert: "colS(", label: "colS", hint: "colS(matrix)" },
			{ insert: "frobenius(", texLabel: "\\lVert A \\rVert_F", hint: "frobenius(matrix)" },
			{ insert: "[[1,2],[3,4]]", texLabel: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}", hint: "[[a,b],[c,d]]" },
			{ insert: "[1,2,3]", texLabel: "[x,y,z]", hint: "[x,y,z]" },
		],
	},
	{
		id: "stats",
		label: "Stat",
		items: [
			{ insert: "sum(", texLabel: "\\operatorname{sum}", hint: "sum(x1, x2, ...)" },
			{ insert: "product(", texLabel: "\\operatorname{product}", hint: "product(x1, x2, ...)" },
			{ insert: "average(", texLabel: "\\operatorname{average}", hint: "average(x1, x2, ...)" },
			{ insert: "max(", texLabel: "\\operatorname{max}", hint: "max(x1, x2, ...)" },
			{ insert: "min(", texLabel: "\\operatorname{min}", hint: "min(x1, x2, ...)" },
			{ insert: "median(", texLabel: "\\operatorname{median}", hint: "median(x1, x2, ...)" },
			{ insert: "variance(", texLabel: "\\operatorname{variance}", hint: "variance(x1, x2, ...)" },
			{ insert: "stddev(", texLabel: "\\operatorname{stddev}", hint: "stddev(x1, x2, ...)" },
		],
	},
	{
		id: "more",
		label: "More",
		items: [
			{ insert: "abs(", texLabel: "\\left|x\\right|", hint: "abs(x)" },
			{ insert: "sign(", texLabel: "\\operatorname{sgn}", hint: "sign(x)" },
			{ insert: "floor(", texLabel: "\\lfloor x \\rfloor", hint: "floor(x)" },
			{ insert: "ceil(", texLabel: "\\lceil x \\rceil", hint: "ceil(x)" },
			{ insert: "round(", texLabel: "\\approx x", hint: "round(x)" },
			{ insert: "trunc(", texLabel: "\\operatorname{trunc}", hint: "trunc(x)" },
			{ insert: "fround(", texLabel: "32\\text{bit}", hint: "fround(x)" },
			{ insert: "clz32(", texLabel: "\\operatorname{clz}_{32}", hint: "clz32(x)" },
			{ insert: "normalize(", texLabel: "\\text{norm.}", hint: "normalize(x)" },
			{ insert: "tau", texLabel: "\\tau", hint: "tau" },
		],
	},
];

const VARIADIC_FUNCTIONS = new Set(["sum", "product", "average", "max", "min", "median", "variance", "stddev"]);
const FUNCTION_SIGNATURES = new Map(FUNCTION_GROUPS.flatMap((group) => group.items.filter((item) => item.insert.endsWith("(") && item.hint.includes("(")).map((item) => [item.insert.slice(0, -1), extractHintArguments(item.hint)])));

function extractHintArguments(hint) {
	const start = hint.indexOf("(");
	const end = hint.lastIndexOf(")");
	if (start === -1 || end === -1 || end <= start + 1) {
		return [];
	}
	return hint
		.slice(start + 1, end)
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
}

function deriveGhostCompletion(value, cursor) {
	const beforeCursor = value.slice(0, cursor);

	const stack = [];
	let identifier = "";

	for (let i = 0; i < beforeCursor.length; i++) {
		const char = beforeCursor[i];
		if (/[A-Za-z0-9_]/.test(char)) {
			identifier += char;
			if (stack.at(-1)?.type === "function") {
				stack.at(-1).currentArgHasText = true;
			} else if (stack.at(-1)?.type === "array") {
				stack.at(-1).hasContent = true;
			}
			continue;
		}

		if (char === "(") {
			if (stack.at(-1)?.type === "function") {
				stack.at(-1).currentArgHasText = true;
			} else if (stack.at(-1)?.type === "array") {
				stack.at(-1).hasContent = true;
			}
			if (FUNCTION_SIGNATURES.has(identifier)) {
				stack.push({
					type: "function",
					name: identifier,
					args: FUNCTION_SIGNATURES.get(identifier),
					argIndex: 0,
					currentArgHasText: false,
					isVariadic: VARIADIC_FUNCTIONS.has(identifier),
					closed: false,
				});
			} else {
				stack.push({ type: "generic", closed: false });
			}
			identifier = "";
			continue;
		}

		if (char === "[") {
			if (stack.at(-1)?.type === "function") {
				stack.at(-1).currentArgHasText = true;
			} else if (stack.at(-1)?.type === "array") {
				stack.at(-1).hasContent = true;
				stack.at(-1).containsArray = true;
			}
			stack.push({
				type: "array",
				depth: stack.at(-1)?.type === "array" ? stack.at(-1).depth + 1 : 1,
				hasContent: false,
				containsArray: false,
				closed: false,
			});
			identifier = "";
			continue;
		}

		if (char === ")") {
			for (let j = stack.length - 1; j >= 0; j--) {
				if ((stack[j].type === "function" || stack[j].type === "generic") && !stack[j].closed) {
					stack[j].closed = true;
					break;
				}
			}
			identifier = "";
			continue;
		}

		if (char === "]") {
			for (let j = stack.length - 1; j >= 0; j--) {
				if (stack[j].type === "array" && !stack[j].closed) {
					stack[j].closed = true;
					const parent = stack.slice(0, j).findLast((e) => !e.closed);
					if (parent?.type === "array") {
						parent.containsArray = true;
					}
					break;
				}
			}
			identifier = "";
			continue;
		}

		if (char === ",") {
			if (stack.at(-1)?.type === "function") {
				stack.at(-1).argIndex += 1;
				stack.at(-1).currentArgHasText = false;
			} else if (stack.at(-1)?.type === "array") {
				stack.at(-1).hasContent = false;
			}
			identifier = "";
			continue;
		}

		if (!/\s/.test(char)) {
			if (stack.at(-1)?.type === "function") {
				stack.at(-1).currentArgHasText = true;
			} else if (stack.at(-1)?.type === "array") {
				stack.at(-1).hasContent = true;
			}
		}
		identifier = "";
	}

	const unclosed = stack.filter((e) => !e.closed);
	let suffix = "";
	for (let i = unclosed.length - 1; i >= 0; i--) {
		const frame = unclosed[i];
		const isInnermost = i === unclosed.length - 1;
		if (frame.type === "function") {
			let funcSuffix = "";
			if (frame.isVariadic) {
				const nextFrame = unclosed[i + 1];
				const startsWithArray = nextFrame?.type === "array" && frame.argIndex === 0;
				if (startsWithArray) {
					// Single array mode for variadic functions
				} else {
					if (frame.currentArgHasText) {
						funcSuffix += `, x${frame.argIndex + 2}`;
					} else {
						funcSuffix += `x${frame.argIndex + 1}`;
					}
				}
			} else {
				const remaining = [];
				if (!frame.currentArgHasText && frame.argIndex < frame.args.length) {
					remaining.push(frame.args[frame.argIndex]);
				}
				if (frame.argIndex < frame.args.length - 1) {
					remaining.push(...frame.args.slice(frame.argIndex + 1));
				}
				if (frame.currentArgHasText && frame.argIndex < frame.args.length - 1) {
					funcSuffix += ", " + remaining.join(", ");
				} else {
					funcSuffix += remaining.join(", ");
				}
			}
			suffix += funcSuffix + ")";
		} else if (frame.type === "generic") {
			suffix += ")";
		} else if (frame.type === "array") {
			let arrSuffix = "";
			if (isInnermost) {
				if (frame.depth === 1) {
					if (!frame.hasContent) {
						arrSuffix += frame.containsArray ? "[a]" : "a";
					} else {
						arrSuffix += ", b";
					}
				} else if (frame.depth === 2) {
					if (!frame.hasContent) arrSuffix += "a";
				}
			}
			suffix += arrSuffix + "]";
		}
	}

	const afterCursor = value.slice(cursor).trim();
	if (afterCursor) {
		let matchLen = 0;
		for (let j = 1; j <= Math.min(suffix.length, afterCursor.length); j++) {
			if (suffix.startsWith(afterCursor.slice(0, j))) {
				matchLen = j;
			}
		}
		suffix = suffix.slice(matchLen);
	}

	return {
		prefix: beforeCursor,
		suffix,
	};
}

async function waitForKatex(timeoutMs = 6000) {
	const started = Date.now();
	while (!window.katex) {
		if (Date.now() - started > timeoutMs) {
			throw new Error("KaTeX could not be loaded.");
		}
		await new Promise((resolve) => window.setTimeout(resolve, 50));
	}
	return window.katex;
}

class MathFormatter {
	constructor(katexApi) {
		this.katexApi = katexApi;
	}

	render(tex, element, displayMode = false) {
		this.katexApi.render(tex || "\\text{ }", element, {
			displayMode,
			throwOnError: false,
		});
	}

	renderCode(text, element) {
		this.render(`\\texttt{${escapeLatex(text)}}`, element, false);
	}
}

class PrecisionController {
	constructor(precisionInput, extraInput, roundingSelect) {
		this.precisionInput = precisionInput;
		this.extraInput = extraInput;
		this.roundingSelect = roundingSelect;
		this.listeners = [];
		for (const key of ROUNDING_MODE_OPTIONS) {
			this.roundingSelect.add(new Option(key, key));
		}
		this.roundingSelect.value = "HALF_UP";
		const notify = () => {
			for (const listener of this.listeners) {
				listener(this.getSettings());
			}
		};
		this.precisionInput.addEventListener("change", notify);
		this.extraInput.addEventListener("change", notify);
		this.roundingSelect.addEventListener("change", notify);
		notify();
	}

	getPrecision() {
		return Math.max(1, Number(this.precisionInput.value || "28"));
	}

	getSettings() {
		return {
			precision: this.getPrecision(),
			extraPrecision: Math.max(0, Number(this.extraInput.value || "6")),
			roundingMode: this.roundingSelect.value,
		};
	}

	subscribe(listener) {
		this.listeners.push(listener);
	}
}

class EditorBuffer {
	constructor(textarea) {
		this.textarea = textarea;
		this.selectionStart = 0;
		this.selectionEnd = 0;
		for (const type of ["select", "keyup", "click", "input", "focus"]) {
			this.textarea.addEventListener(type, () => this.cacheSelection());
		}
		this.cacheSelection();
	}

	cacheSelection() {
		if (document.activeElement === this.textarea) {
			this.selectionStart = this.textarea.selectionStart ?? this.textarea.value.length;
			this.selectionEnd = this.textarea.selectionEnd ?? this.selectionStart;
		}
	}

	getValue() {
		return this.textarea.value;
	}

	safelyFocus() {
		this.textarea.focus({ preventScroll: true });
	}

	setValue(value, focus = true) {
		this.textarea.value = value;
		this.selectionStart = value.length;
		this.selectionEnd = value.length;
		this.textarea.selectionStart = value.length;
		this.textarea.selectionEnd = value.length;
		if (focus) {
			this.safelyFocus();
		}
	}

	insert(text, preserveFocus = false) {
		const start = this.selectionStart;
		const end = this.selectionEnd;
		this.textarea.setRangeText(text, start, end, "end");
		this.selectionStart = this.textarea.selectionStart;
		this.selectionEnd = this.textarea.selectionEnd;
		if (preserveFocus) {
			this.safelyFocus();
		} else {
			this.textarea.selectionStart = this.selectionStart;
			this.textarea.selectionEnd = this.selectionEnd;
		}
	}

	backspace(preserveFocus = false) {
		const start = this.selectionStart;
		const end = this.selectionEnd;
		if (start !== end) {
			this.textarea.setRangeText("", start, end, "end");
			this.selectionStart = this.textarea.selectionStart;
			this.selectionEnd = this.selectionStart;
			if (preserveFocus) {
				this.safelyFocus();
			} else {
				this.textarea.selectionStart = this.selectionStart;
				this.textarea.selectionEnd = this.selectionEnd;
			}
			return;
		}
		if (start > 0) {
			this.textarea.setRangeText("", start - 1, start, "end");
			this.selectionStart = this.textarea.selectionStart;
			this.selectionEnd = this.selectionStart;
			if (preserveFocus) {
				this.safelyFocus();
			} else {
				this.textarea.selectionStart = this.selectionStart;
				this.textarea.selectionEnd = this.selectionEnd;
			}
		}
	}

	moveCursor(delta, focus = true) {
		const next = Math.max(0, Math.min(this.textarea.value.length, this.selectionStart + delta));
		this.selectionStart = next;
		this.selectionEnd = next;
		this.textarea.selectionStart = next;
		this.textarea.selectionEnd = next;
		if (focus) {
			this.safelyFocus();
		}
	}

	clear(focus = true) {
		this.textarea.value = "";
		this.selectionStart = 0;
		this.selectionEnd = 0;
		this.textarea.selectionStart = 0;
		this.textarea.selectionEnd = 0;
		if (focus) {
			this.safelyFocus();
		}
	}
}

class EvaluationManager {
	constructor(onResult) {
		this.onResult = onResult;
		this.latestRequestId = 0;
		this.activeWorkers = new Map();
	}

	evaluate(expression, settings, lastAnswer, commit = false) {
		const requestId = ++this.latestRequestId;
		const worker = new Worker(new URL("./evaluator.worker.js", import.meta.url), { type: "module" });
		this.activeWorkers.set(requestId, worker);
		this.trimWorkers();

		worker.addEventListener("message", (event) => {
			const payload = event.data;
			worker.terminate();
			this.activeWorkers.delete(payload.requestId);
			this.onResult(payload, expression, payload.requestId === this.latestRequestId, commit);
		});

		worker.postMessage({
			requestId,
			expression,
			precision: settings.precision,
			settings,
			lastAnswer,
		});
	}

	trimWorkers() {
		if (this.activeWorkers.size <= 2) {
			return;
		}
		const oldestRequestId = [...this.activeWorkers.keys()].sort((a, b) => a - b)[0];
		const oldestWorker = this.activeWorkers.get(oldestRequestId);
		if (oldestWorker) {
			oldestWorker.terminate();
			this.activeWorkers.delete(oldestRequestId);
		}
	}

	cancelAll() {
		for (const worker of this.activeWorkers.values()) {
			worker.terminate();
		}
		this.activeWorkers.clear();
	}
}

class HistoryPanel {
	constructor(sectionElement, listElement, onSelect) {
		this.sectionElement = sectionElement;
		this.listElement = listElement;
		this.onSelect = onSelect;
		this.entries = [];
		this.render();
	}

	push(expression, result) {
		if (!expression) {
			return;
		}
		const latest = this.entries[0];
		if (latest && latest.expression === expression && latest.result === result) {
			return;
		}
		this.entries.unshift({ expression, result });
		this.entries = this.entries.slice(0, 4);
		this.render();
	}

	render() {
		this.listElement.replaceChildren();
		this.sectionElement.hidden = this.entries.length === 0;
		for (const entry of this.entries) {
			const item = document.createElement("li");
			item.className = "history-card";
			const button = document.createElement("button");
			button.type = "button";
			button.className = "history-button";
			button.innerHTML = `<span class="history-expression">${escapeHtml(entry.expression)}</span><span class="history-result">${escapeHtml(entry.result)}</span>`;
			button.addEventListener("click", () => this.onSelect(entry.expression));
			item.append(button);
			this.listElement.append(item);
		}
	}
}

class CalculatorApp {
	constructor(formatter) {
		this.formatter = formatter;
		this.printer = new AstTeXPrinter();
		this.editor = new EditorBuffer(document.getElementById("expression-input"));
		this.expressionGhost = document.getElementById("expression-ghost");
		this.expressionMath = document.getElementById("expression-math");
		this.resultOutput = document.getElementById("result-output");
		this.keypadGrid = document.getElementById("keypad-grid");
		this.defaultKeypadHTML = this.keypadGrid.innerHTML;
		this.activeFunctionGroup = null;
		this.currentHint = DEFAULT_HINT;
		this.lastAnswer = null;
		this.previewTimer = null;
		this.precisionController = new PrecisionController(document.getElementById("precision-input"), document.getElementById("extra-precision-input"), document.getElementById("rounding-mode"));
		this.history = new HistoryPanel(document.querySelector(".history-lane"), document.getElementById("history-list"), (expression) => {
			this.editor.setValue(expression, false);
			this.handleInput(false);
		});
		this.evaluator = new EvaluationManager((payload, expression, isLatest, commit) => this.handleWorkerResult(payload, expression, isLatest, commit));
		this.bind();
		this.updateFitty();
	}

	bind() {
		this.renderStaticLabels();
		this.renderButtonLabels();
		this.updateGhostHint();
		this.previewExpression();
		this.handleInput(false);
		this.editor.textarea.addEventListener("input", () => {
			this.handleInput(false);
		});
		this.editor.textarea.addEventListener("focus", () => this.updateGhostHint());
		this.editor.textarea.addEventListener("blur", () => this.updateGhostHint());
		this.editor.textarea.addEventListener("scroll", () => {
			this.expressionGhost.scrollTop = this.editor.textarea.scrollTop;
		});
		this.precisionController.subscribe(() => this.handleInput(false));
		this.editor.textarea.addEventListener("keydown", (event) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				this.handleInput(true);
			}
		});

		document.getElementById("btn-clear").addEventListener("click", () => {
			this.editor.clear(false);
			this.lastAnswer = null;
			this.resultOutput.textContent = "-";
			this.updateGhostHint();
			this.previewExpression();
			this.evaluator.cancelAll();
			this.resetKeypad();
		});
		document.getElementById("btn-backspace").addEventListener("click", () => {
			this.editor.backspace(false);
			this.handleInput(false);
		});
		document.getElementById("btn-left").addEventListener("click", () => this.editor.moveCursor(-1));
		document.getElementById("btn-right").addEventListener("click", () => this.editor.moveCursor(1));

		this.keypadGrid.addEventListener("click", (event) => {
			const button = event.target.closest("button");
			if (!button) return;

			if (button.id === "btn-evaluate") {
				this.handleInput(true);
				this.resetKeypad();
				return;
			}

			if (button.dataset.groupId) {
				this.toggleFunctionGroup(button.dataset.groupId);
				return;
			}

			if (button.dataset.insert) {
				const preserveFocus = document.activeElement === this.editor.textarea;
				this.editor.insert(button.dataset.insert, preserveFocus);
				if (button.dataset.hint) {
					this.currentHint = button.dataset.hint;
				}
				this.updateGhostHint();
				this.handleInput(false);
				if (this.activeFunctionGroup) {
					this.resetKeypad();
				}
			}
		});
	}

	updateFitty() {
		fitty(".fit", {
			minSize: 4,
			maxSize: 20,
		});
	}

	renderStaticLabels() {
		for (const node of document.querySelectorAll("[data-tex-label]")) {
			this.formatter.render(node.dataset.texLabel, node, false);
		}
	}

	toggleFunctionGroup(groupId) {
		if (this.activeFunctionGroup === groupId) {
			this.resetKeypad();
			return;
		}
		const group = FUNCTION_GROUPS.find((entry) => entry.id === groupId);
		if (!group) return;

		if (this.activeFunctionGroup) {
			this.resetKeypad();
		}

		this.activeFunctionGroup = groupId;
		this.renderSwappedKeypad(group);
	}

	renderSwappedKeypad(group) {
		const children = Array.from(this.keypadGrid.children);
		const middleButtons = children.filter((btn) => btn.classList.contains("swappable"));
		middleButtons.forEach((btn) => (btn.style.display = "none"));

		// Modify Row 6 (last 5 buttons)
		// children.at(-5) is '0' (span2)
		// children.at(-4) is '.'
		// children.at(-3) is '+'
		// children.at(-2) is 'Stats' ex
		// children.at(-1) is '='
		const btnZero = children[children.length - 5];
		const btnPlus = children[children.length - 3];

		btnZero.style.display = "none";
		btnPlus.style.display = "none";

		// Add '(' and ')' to replace '0'
		const createKey = (tex, insert, className = "key function swapped-key-row6") => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = className;
			button.dataset.insert = insert;
			const wrapper = document.createElement("span");
			wrapper.className = "fit-wrapper";
			const label = document.createElement("span");
			label.className = "fit";
			label.dataset.texLabel = tex;
			wrapper.append(label);
			button.append(wrapper);
			return button;
		};

		this.keypadGrid.insertBefore(createKey("(", "("), children[children.length - 4]);
		this.keypadGrid.insertBefore(createKey(")", ")"), children[children.length - 4]);
		this.keypadGrid.insertBefore(createKey(",", ",", "key function swapped-key-row6"), children[children.length - 2]);

		const items = group.items.slice(0, 24);
		items.forEach((item) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "key function swapped-key";
			button.dataset.insert = item.insert;
			button.dataset.hint = item.hint;
			const wrapper = document.createElement("span");
			wrapper.className = "fit-wrapper";
			const label = document.createElement("span");
			label.className = "fit";
			label.dataset.texLabel = item.texLabel;
			wrapper.append(label);
			button.append(wrapper);
			this.keypadGrid.insertBefore(button, children[children.length - 5]);
		});

		// Pad with empty buttons to maintain grid structure (Rows 2-5 = 24 slots)
		for (let i = items.length; i < 24; i++) {
			const placeholder = document.createElement("button");
			placeholder.type = "button";
			placeholder.className = "key swapped-key placeholder";
			placeholder.disabled = true;
			placeholder.style.visibility = "hidden";
			this.keypadGrid.insertBefore(placeholder, children[children.length - 5]);
		}

		for (const button of this.keypadGrid.querySelectorAll(".key.ex[data-group-id]")) {
			const isActive = button.dataset.groupId === this.activeFunctionGroup;
			button.dataset.active = isActive ? "true" : "false";
			button.setAttribute("aria-pressed", isActive ? "true" : "false");
		}
		this.renderButtonLabels(this.keypadGrid);
		this.updateFitty();
	}

	resetKeypad() {
		this.activeFunctionGroup = null;
		this.keypadGrid.querySelectorAll(".swapped-key").forEach((btn) => btn.remove());
		this.keypadGrid.querySelectorAll(".swapped-key-row6").forEach((btn) => btn.remove());
		Array.from(this.keypadGrid.children).forEach((btn) => (btn.style.display = ""));
		for (const button of this.keypadGrid.querySelectorAll(".key.ex[data-group-id]")) {
			button.dataset.active = "false";
			button.setAttribute("aria-pressed", "false");
		}
	}

	renderButtonLabels(root = document) {
		for (const node of root.querySelectorAll("[data-tex-label]")) {
			this.formatter.render(node.dataset.texLabel, node, false);
		}
	}

	updateGhostHint() {
		const value = this.editor.getValue();
		const isFocused = document.activeElement === this.editor.textarea;
		const completion = value.trim() ? deriveGhostCompletion(value, this.editor.selectionStart) : { prefix: "", suffix: this.currentHint || DEFAULT_HINT };
		const suffix = completion?.suffix ?? "";
		if (!suffix && isFocused) {
			this.expressionGhost.replaceChildren();
			this.expressionGhost.hidden = true;
			return;
		}
		const prefixNode = document.createElement("span");
		prefixNode.className = "ghost-prefix";
		prefixNode.textContent = completion?.prefix ?? "";
		const cursorNode = document.createElement("span");
		cursorNode.className = "virtual-cursor";
		if (isFocused) {
			cursorNode.style.display = "none";
		}
		const suffixNode = document.createElement("span");
		suffixNode.className = "ghost-suffix";
		suffixNode.textContent = suffix;
		this.expressionGhost.replaceChildren(prefixNode, cursorNode, suffixNode);
		this.expressionGhost.hidden = false;
	}

	handleInput(commit) {
		if (this.previewTimer) {
			window.clearTimeout(this.previewTimer);
		}
		this.updateGhostHint();
		this.previewExpression();
		const expression = this.editor.getValue().trim();
		if (!expression) {
			this.resultOutput.textContent = "-";
			this.evaluator.cancelAll();
			return;
		}
		const run = () => {
			this.evaluator.evaluate(expression, this.precisionController.getSettings(), this.lastAnswer, commit);
		};
		if (commit) {
			run();
			return;
		}
		this.previewTimer = window.setTimeout(run, 140);
	}

	previewExpression() {
		const expression = this.editor.getValue().trim();
		if (!expression) {
			this.expressionMath.textContent = "";
			return;
		}
		try {
			const ast = parseExpression(expression);
			this.formatter.render(this.printer.print(ast), this.expressionMath, false);
		} catch {
			this.formatter.renderCode(expression, this.expressionMath);
		}
	}

	handleWorkerResult(payload, expression, isLatest, commit) {
		if (!isLatest) {
			return;
		}
		if (!payload.ok) {
			this.resultOutput.textContent = `${payload.errorName}: ${payload.errorMessage}`;
			return;
		}
		if (commit) {
			this.lastAnswer = payload.serialized;
			this.history.push(expression, payload.text);
		}
		this.resultOutput.textContent = formatSerializedValue(payload.serialized, this.precisionController.getSettings().precision);
		this.formatter.render(payload.tex, this.expressionMath, false);
	}
}

function escapeHtml(value) {
	return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const formatter = new MathFormatter(await waitForKatex());
new CalculatorApp(formatter);

if (typeof window !== "undefined") {
	window.BigFloat = BigFloat;
	window.BigFloatComplex = BigFloatComplex;
	window.BigFloatMatrix = BigFloatMatrix;
	window.BigFloatVector = BigFloatVector;
	window.BigFloatStream = BigFloatStream;
}
