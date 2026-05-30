import assert from "node:assert";
import { test } from "node:test";
import { BigFloat } from "../../dist/BigFloat.js";

test("BigFloat transcendental identity formula accuracy", async (t) => {
	const nValues = [1, 2, 3, 4, 5, 10, 100, 1000, 10000, 99991, 99999, 100000];
	const precisions = [20, 50];

	for (const p of precisions) {
		await t.test(`Precision ${p}`, () => {
			for (const n of nValues) {
				const bn = new BigFloat(n, p);

				// exp(exp(-ln(-ln(sqrt(exp(-exp(-ln(-ln(cos(arctan(sqrt(n)))))))))))) = n + 1
				const step1 = bn.sqrt();
				const step2 = step1.atan();
				const step3 = step2.cos();
				const step4 = step3.ln().neg().ln().neg();
				const step5 = step4.exp().neg().exp();
				const step6 = step5.sqrt();
				const step7 = step6.ln().neg().ln().neg();
				const step8 = step7.exp().exp();

				const expected = n + 1;

				// We expect the result to be significantly more accurate than before.
				// Pre-fix errors were around 10^-(p-2) or worse.
				// Post-fix errors are usually 0 or extremely small.
				const diff = step8.sub(expected).abs();

				// We just want to ensure accuracy is better than 10^-14 relative error
				// as a reasonable bound for various n.
				const relError = diff.div(expected);
				const threshold = new BigFloat(1, p).div(new BigFloat(10, p).pow(14));
				assert.ok(relError.lt(threshold), `n=${n}, p=${p}: Relative error ${relError.toString()} is too high.`);
			}
		});
	}
});
