import { AstTeXPrinter, ROUNDING_MODE_OPTIONS, escapeLatex, formatSerializedValue, parseExpression } from "./calculator-core.js";

const DEFAULT_HINT = "sin(x)";

const FUNCTION_GROUPS = [
	{
		id: "power",
		label: "Pow",
		title: "Power",
		items: [
			{ insert: "sqrt(", texLabel: "\\sqrt{x}", hint: "sqrt(x)" },
			{ insert: "cbrt(", texLabel: "\\sqrt[3]{x}", hint: "cbrt(x)" },
			{ insert: "nthRoot(", texLabel: "\\sqrt[n]{x}", hint: "nthRoot(x, n)" },
			{ insert: "pow(", texLabel: "x^n", hint: "pow(x, n)" },
			{ insert: "exp(", texLabel: "e^x", hint: "exp(x)" },
			{ insert: "exp2(", texLabel: "2^x", hint: "exp2(x)" },
			{ insert: "expm1(", label: "expm1", hint: "expm1(x)" },
			{ insert: "factorial(", texLabel: "x!", hint: "factorial(n)" },
			{ insert: "reciprocal(", texLabel: "\\frac{1}{x}", hint: "reciprocal(x)" },
		],
	},
	{
		id: "logs",
		label: "Log",
		title: "Log / Special",
		items: [
			{ insert: "ln(", texLabel: "\\ln(x)", hint: "ln(x)" },
			{ insert: "log(", texLabel: "\\log_b(x)", hint: "log(x, base)" },
			{ insert: "log10(", texLabel: "\\log_{10}(x)", hint: "log10(x)" },
			{ insert: "log2(", texLabel: "\\log_2(x)", hint: "log2(x)" },
			{ insert: "log1p(", label: "log1p", hint: "log1p(x)" },
			{ insert: "gamma(", texLabel: "\\Gamma(x)", hint: "gamma(x)" },
			{ insert: "zeta(", texLabel: "\\zeta(x)", hint: "zeta(x)" },
		],
	},
	{
		id: "trig",
		label: "Trig",
		title: "Trig / Hyper",
		items: [
			{ insert: "sin(", label: "sin", hint: "sin(x)" },
			{ insert: "cos(", label: "cos", hint: "cos(x)" },
			{ insert: "tan(", label: "tan", hint: "tan(x)" },
			{ insert: "asin(", label: "asin", hint: "asin(x)" },
			{ insert: "acos(", label: "acos", hint: "acos(x)" },
			{ insert: "atan(", label: "atan", hint: "atan(x)" },
			{ insert: "atan2(", label: "atan2", hint: "atan2(y, x)" },
			{ insert: "sinh(", label: "sinh", hint: "sinh(x)" },
			{ insert: "cosh(", label: "cosh", hint: "cosh(x)" },
			{ insert: "tanh(", label: "tanh", hint: "tanh(x)" },
			{ insert: "asinh(", label: "asinh", hint: "asinh(x)" },
			{ insert: "acosh(", label: "acosh", hint: "acosh(x)" },
			{ insert: "atanh(", label: "atanh", hint: "atanh(x)" },
		],
	},
	{
		id: "complex",
		label: "Cx",
		title: "Complex",
		items: [
			{ insert: "complex(", label: "complex", hint: "complex(re, im)" },
			{ insert: "polar(", label: "polar", hint: "polar(r, theta)" },
			{ insert: "conj(", texLabel: "\\overline{z}", hint: "conj(z)" },
			{ insert: "arg(", texLabel: "\\arg(z)", hint: "arg(z)" },
			{ insert: "real(", texLabel: "\\Re(z)", hint: "real(z)" },
			{ insert: "imag(", texLabel: "\\Im(z)", hint: "imag(z)" },
			{ insert: "rotate(", label: "rotate", hint: "rotate(z, theta)" },
			{ insert: "roots(", label: "roots", hint: "roots(z, n)" },
		],
	},
	{
		id: "linear",
		label: "Lin",
		title: "Vector / Matrix",
		items: [
			{ insert: "dot(", texLabel: "v\\cdot w", hint: "dot(v, w)" },
			{ insert: "cross(", texLabel: "v\\times w", hint: "cross(v, w)" },
			{ insert: "norm(", texLabel: "\\lVert v \\rVert", hint: "norm(v)" },
			{ insert: "angle(", label: "angle", hint: "angle(v, w)" },
			{ insert: "project(", label: "proj", hint: "project(v, onto)" },
			{ insert: "distance(", label: "dist", hint: "distance(a, b)" },
			{ insert: "det(", texLabel: "\\det(A)", hint: "det(matrix)" },
			{ insert: "trace(", texLabel: "\\operatorname{tr}(A)", hint: "trace(matrix)" },
			{ insert: "rank(", label: "rank", hint: "rank(matrix)" },
			{ insert: "transpose(", texLabel: "A^\\mathsf{T}", hint: "transpose(matrix)" },
			{ insert: "inv(", texLabel: "A^{-1}", hint: "inv(matrix)" },
			{ insert: "matmul(", label: "matmul", hint: "matmul(a, b)" },
			{ insert: "hadamard(", texLabel: "A\\odot B", hint: "hadamard(a, b)" },
			{ insert: "solve(", label: "solve", hint: "solve(matrix, vector)" },
			{ insert: "rowSums(", label: "rowSums", hint: "rowSums(matrix)" },
			{ insert: "columnSums(", label: "colSums", hint: "columnSums(matrix)" },
			{ insert: "frobenius(", label: "frobenius", hint: "frobenius(matrix)" },
			{ insert: "[[1,2],[3,4]]", label: "matrix", hint: "[[a,b],[c,d]]" },
			{ insert: "[1,2,3]", label: "vector", hint: "[x,y,z]" },
		],
	},
	{
		id: "stats",
		label: "Stat",
		title: "Stats",
		items: [
			{ insert: "sum(", label: "sum", hint: "sum([a,b,c])" },
			{ insert: "product(", label: "product", hint: "product([a,b,c])" },
			{ insert: "average(", label: "average", hint: "average([a,b,c])" },
			{ insert: "max(", label: "max", hint: "max([a,b,c])" },
			{ insert: "min(", label: "min", hint: "min([a,b,c])" },
			{ insert: "median(", label: "median", hint: "median([a,b,c])" },
			{ insert: "variance(", label: "variance", hint: "variance([a,b,c])" },
			{ insert: "stddev(", label: "stddev", hint: "stddev([a,b,c])" },
		],
	},
	{
		id: "more",
		label: "More",
		title: "Round / Utility",
		items: [
			{ insert: "abs(", texLabel: "\\left|x\\right|", hint: "abs(x)" },
			{ insert: "sign(", label: "sign", hint: "sign(x)" },
			{ insert: "floor(", texLabel: "\\lfloor x \\rfloor", hint: "floor(x)" },
			{ insert: "ceil(", texLabel: "\\lceil x \\rceil", hint: "ceil(x)" },
			{ insert: "round(", label: "round", hint: "round(x)" },
			{ insert: "trunc(", label: "trunc", hint: "trunc(x)" },
			{ insert: "fround(", label: "fround", hint: "fround(x)" },
			{ insert: "clz32(", label: "clz32", hint: "clz32(x)" },
			{ insert: "normalize(", label: "normalize", hint: "normalize(x)" },
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
		this.functionOverlay = document.getElementById("function-overlay");
		this.functionGrid = document.getElementById("function-grid");
		this.functionOverlayTitle = document.getElementById("function-overlay-title");
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
	}

	bind() {
		this.renderStaticLabels();
		this.renderButtonLabels();
		this.updateGhostHint();
		this.previewExpression();
		this.handleInput(false);
		this.editor.textarea.addEventListener("input", () => this.handleInput(false));
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
			this.closeFunctionOverlay();
		});
		document.getElementById("btn-backspace").addEventListener("click", () => {
			this.editor.backspace(false);
			this.handleInput(false);
		});
		document.getElementById("btn-left").addEventListener("click", () => this.editor.moveCursor(-1));
		document.getElementById("btn-right").addEventListener("click", () => this.editor.moveCursor(1));
		document.getElementById("btn-evaluate").addEventListener("click", () => this.handleInput(true));

		document.addEventListener("click", (event) => {
			const element = event.target instanceof Element ? event.target : null;
			if (!element) {
				return;
			}

			const button = element.closest("button");
			if (!button) {
				if (!element.closest("#function-overlay") && !element.closest(".mini-toggle")) {
					this.closeFunctionOverlay();
				}
				return;
			}

			if (button.dataset.closeOverlay !== undefined) {
				this.closeFunctionOverlay();
				return;
			}
			if (button.dataset.groupId) {
				this.toggleFunctionOverlay(button.dataset.groupId);
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
				if (button.closest("#function-overlay")) {
					this.closeFunctionOverlay();
				}
			}
		});
	}

	renderStaticLabels() {
		for (const node of document.querySelectorAll("[data-tex-label]")) {
			this.formatter.render(node.dataset.texLabel, node, false);
		}
	}

	renderFunctionGroupItems(group) {
		this.functionOverlayTitle.textContent = group.title;
		this.functionGrid.replaceChildren();
		for (const item of group.items) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "function-chip";
			button.dataset.insert = item.insert;
			button.dataset.hint = item.hint;
			if (item.texLabel) {
				const label = document.createElement("span");
				label.dataset.texLabel = item.texLabel;
				button.append(label);
			} else {
				button.textContent = item.label ?? item.insert;
			}
			this.functionGrid.append(button);
		}
		this.renderButtonLabels(this.functionGrid);
	}

	toggleFunctionOverlay(groupId) {
		if (this.activeFunctionGroup === groupId && !this.functionOverlay.hidden) {
			this.closeFunctionOverlay();
			return;
		}
		const group = FUNCTION_GROUPS.find((entry) => entry.id === groupId);
		if (!group) {
			return;
		}
		this.activeFunctionGroup = groupId;
		this.renderFunctionGroupItems(group);
		this.functionOverlay.hidden = false;
		for (const button of document.querySelectorAll(".mini-toggle[data-group-id]")) {
			const isActive = button.dataset.groupId === groupId;
			button.dataset.active = isActive ? "true" : "false";
			button.setAttribute("aria-pressed", isActive ? "true" : "false");
		}
	}

	closeFunctionOverlay() {
		this.activeFunctionGroup = null;
		this.functionOverlay.hidden = true;
		for (const button of document.querySelectorAll(".mini-toggle[data-group-id]")) {
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
