import {
	AstTeXPrinter,
	EvaluationContext,
	Evaluator,
	formatSerializedValue,
	parseExpression,
	serializeValue,
} from "./calculator-core.js";

const printer = new AstTeXPrinter();

self.addEventListener("message", (event) => {
	const { requestId, expression, precision, settings, lastAnswer } = event.data;
	try {
		const ast = parseExpression(expression);
		const evaluator = new Evaluator(new EvaluationContext(precision, settings, lastAnswer));
		const value = evaluator.evaluate(ast);
		const serialized = serializeValue(value, precision);
		self.postMessage({
			requestId,
			ok: true,
			serialized,
			text: formatSerializedValue(serialized, precision),
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
