import assert from "node:assert";
import test from "node:test";
import { BigFloat } from "../../dist/BigFloat.js";

const precisions = [0, 1, 5, 10, 20, 50, 100, 1000];

test("BigFloat Precision and Identity Tests", async (t) => {
	for (const p of precisions) {
		await t.test(`Precision ${p}`, async (st) => {
			const a = new BigFloat("1.25", p);
			const b = new BigFloat("0.1", p);

			await st.test("Basic Arithmetic Consistency", () => {
				const sum = a.add(b);
				const mul = a.mul(b);

				if (p >= 3) {
					assert.strictEqual(sum.toString(10, p), "1.35");
					assert.strictEqual(mul.toString(10, p), "0.125");
				}

				if (p >= 1 && !b.isZero()) {
					const div = a.div(b);
					if (p >= 2) {
						assert.strictEqual(div.toString(10, p), "12.5");
					} else {
						assert.strictEqual(div.toString(10, p), "12");
					}
				}
			});

			if (p >= 20) {
				await st.test("Transcendental Identities", () => {
					// sin^2 + cos^2 = 1
					const x = new BigFloat("0.5", p);
					const s = x.sin();
					const c = x.cos();
					const identity = s.mul(s).add(c.mul(c));
					const diffSqr = identity.sub(1).abs();
					// We allow a small error due to rounding, but it should be proportional to precision
					const threshold = new BigFloat(1, p).div(10n ** BigInt(p - 2));
					assert.ok(diffSqr.lt(threshold), `sin^2+cos^2 failed at p=${p}: got ${identity.toString()}, diff ${diffSqr.toString()}`);

					// sqrt(x)^2 = x
					const x2 = new BigFloat("2", p);
					const root = x2.sqrt();
					const square = root.mul(root);
					const diffSqrt = square.sub(x2).abs();
					assert.ok(diffSqrt.lt(threshold), `sqrt(2)^2 failed at p=${p}: got ${square.toString()}, diff ${diffSqrt.toString()}`);

					// exp(ln(x)) = x
					const x3 = new BigFloat("2", p);
					const ln = x3.ln();
					const exp = ln.exp();
					const diffExp = exp.sub(x3).abs();
					assert.ok(diffExp.lt(threshold), `exp(ln(2)) failed at p=${p}: got ${exp.toString()}, diff ${diffExp.toString()}`);
				});
			}

			await st.test("Base Conversion and Round-trip", () => {
				if (p >= 5) {
					const x = new BigFloat("1.25", p);
					const s2 = x.toString(2);
					const s16 = x.toString(16);

					const from2 = BigFloat.parseFloat(s2, p, 2);
					const from16 = BigFloat.parseFloat(s16, p, 16);

					assert.ok(
						from2
							.sub(x)
							.abs()
							.lt(new BigFloat(1, p).div(10n ** BigInt(p - 1))),
						`Base 2 round-trip failed at p=${p}`,
					);
					assert.ok(
						from16
							.sub(x)
							.abs()
							.lt(new BigFloat(1, p).div(10n ** BigInt(p - 1))),
						`Base 16 round-trip failed at p=${p}`,
					);
				}
			});

			await st.test("Matching Precision", () => {
				const x = new BigFloat("1.23456789", p);
				const y = new BigFloat("1.23456000", p);
				if (p >= 10) {
					const matched = x.matchingPrecision(y);
					assert.strictEqual(matched, 5n, `matchingPrecision failed at p=${p}: expected 5, got ${matched}`);
				}
			});
		});
	}
});

test("Constant Precision", () => {
	const p = 50;
	const pi = BigFloat.pi(p);
	const e = BigFloat.e(p);

	// sin(pi) should be near 0
	assert.ok(
		pi
			.sin()
			.abs()
			.lt(new BigFloat(1, p).div(10n ** 40n)),
	);

	// ln(e) should be near 1
	assert.ok(
		e
			.ln()
			.sub(1)
			.abs()
			.lt(new BigFloat(1, p).div(10n ** 40n)),
	);
});
