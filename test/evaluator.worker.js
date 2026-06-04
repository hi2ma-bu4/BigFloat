import { BigFloat, BigFloatComplex, BigFloatComplexMatrix, BigFloatComplexVector, BigFloatMatrix, BigFloatVector } from "../dist/BigFloat.js";
import { AstTeXPrinter, EvaluationContext, Evaluator, formatSerializedValue, parseExpression, serializeValue } from "./calculator-core.js";

const printer = new AstTeXPrinter();

self.addEventListener("message", (event) => {
	const { requestId, expression, precision, settings, lastAnswer, displayMode } = event.data;
	try {
		BigFloat.config.trigFuncsMaxSteps = BigInt(settings.trigFuncsMaxSteps);
		BigFloat.config.lnMaxSteps = BigInt(settings.lnMaxSteps);

		self.postMessage({ type: "status", requestId, status: "calculating" });

		const calculationPrecision = precision + (settings.auxPrecision || 0);

		const ast = parseExpression(expression);
		const evaluator = new Evaluator(new EvaluationContext(calculationPrecision, settings, lastAnswer));
		const value = evaluator.evaluate(ast);

		let text = "";
		if (displayMode === "decimal") {
			text = formatSerializedValue(serializeValue(value, precision), precision);
		} else {
			text = formatValueWithMode(value, displayMode, precision);
		}

		const serialized = serializeValue(value, precision);
		self.postMessage({
			requestId,
			ok: true,
			serialized,
			text,
			tex: printer.print(ast),
		});
	} catch (error) {
		self.postMessage({
			requestId,
			ok: false,
			errorName: error instanceof Error ? error.name : "Error",
			errorMessage: error instanceof Error ? error.message : String(error),
		});
	}
});

function formatValueWithMode(value, mode, precision) {
	if (value instanceof BigFloat) {
		return applyModeToScalar(value, mode, precision);
	}
	if (value instanceof BigFloatComplex) {
		const re = applyModeToScalar(value.real, mode, precision);
		const im = applyModeToScalar(value.imag, mode, precision);
		if (im.startsWith("-")) {
			return `${re} - ${im.slice(1)}i`;
		}
		return `${re} + ${im}i`;
	}
	if (value instanceof BigFloatVector || value instanceof BigFloatComplexVector) {
		return `[${value
			.toArray()
			.map((v) => formatValueWithMode(v, mode, precision))
			.join(", ")}]`;
	}
	if (value instanceof BigFloatMatrix || value instanceof BigFloatComplexMatrix) {
		return `[${value
			.toArray()
			.map((row) => `[${row.map((v) => formatValueWithMode(v, mode, precision)).join(", ")}]`)
			.join(", ")}]`;
	}
	return formatSerializedValue(serializeValue(value, precision), precision);
}

function applyModeToScalar(value, mode, precision) {
	if (value._specialState !== 0) {
		return value.toString();
	}
	const opt = { precision };
	switch (mode) {
		case "rationalize-improper":
			return value.rationalize({ ...opt, improper: true });
		case "rationalize-mixed":
			return value.rationalize({ ...opt, improper: false });
		case "recognize-improper":
			return value.recognize({ ...opt, improper: true });
		case "recognize-mixed":
			return value.recognize({ ...opt, improper: false });
		default:
			return value.toString(10, precision);
	}
}
