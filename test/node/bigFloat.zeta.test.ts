import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat } from "../../dist/BigFloat.js";

const REFERENCE_PRECISION = 60;

const ZETA_3 = "1.20205690315959428539973816151144999076498629234049888179227";
const ZETA_HALF = "-1.46035450880958681288949915251529801246722933101258149054288";
const ZETA_THREE_HALVES = "2.61237534868548834334856756792407163057080065240006340757332";
const ZETA_MINUS_HALF = "-0.20788622497735456601730672539704930222626853128767253761011";

function tolerance(precision: number | bigint, guardDigits = 6): BigFloat {
	const precisionBig = BigInt(precision);
	const exponent = precisionBig > BigInt(guardDigits) ? precisionBig - BigInt(guardDigits) : 0n;
	return new BigFloat(1, precisionBig).div(10n ** exponent);
}

function assertClose(actual: BigFloat, expected: BigFloat, precision: number | bigint, label: string, guardDigits = 6): void {
	const diff = actual.sub(expected).abs();
	assert.ok(diff.lt(tolerance(precision, guardDigits)), `${label}: got ${actual.toString(10, precision)}, expected ${expected.toString(10, precision)}, diff ${diff.toString(10, precision)}`);
}

function zetaSeriesBounds(s: BigFloat, terms: number, precision: number): { lower: BigFloat; upper: BigFloat } {
	let sum = new BigFloat(0, precision);
	for (let n = 1; n <= terms; n++) {
		sum = sum.add(new BigFloat(n, precision).pow(s.neg()));
	}

	const denominator = s.sub(1);
	const upperTail = new BigFloat(terms, precision).pow(new BigFloat(1, precision).sub(s)).div(denominator);
	const lowerTail = new BigFloat(terms + 1, precision).pow(new BigFloat(1, precision).sub(s)).div(denominator);
	return {
		lower: sum.add(lowerTail),
		upper: sum.add(upperTail),
	};
}

test("BigFloat zeta special values", () => {
	const p = 80;
	assert.strictEqual(new BigFloat(0, p).zeta().toString(10, p), "-0.5");
	assert.strictEqual(new BigFloat(-2, p).zeta().toString(10, p), "0");
	assert.strictEqual(new BigFloat(-4, p).zeta().toString(10, p), "0");

	assertClose(new BigFloat(-1, p).zeta(), new BigFloat(-1, p).div(12), p, "zeta(-1)");
	assertClose(new BigFloat(-3, p).zeta(), new BigFloat(1, p).div(120), p, "zeta(-3)");
	assert.throws(() => new BigFloat(1, p).zeta(), /pole/);
});

test("BigFloat zeta positive even integers match closed forms", async (t) => {
	for (const p of [20, 50, 100, 500]) {
		await t.test(`precision=${p}`, () => {
			const pi = BigFloat.pi(p);
			assertClose(new BigFloat(2, p).zeta(), pi.pow(2).div(6).changePrecision(p), p, "zeta(2)");
			assertClose(new BigFloat(4, p).zeta(), pi.pow(4).div(90).changePrecision(p), p, "zeta(4)");
			assertClose(new BigFloat(6, p).zeta(), pi.pow(6).div(945).changePrecision(p), p, "zeta(6)");
		});
	}
});

test("BigFloat zeta matches published reference values", () => {
	const cases = [
		{ value: "3", expected: ZETA_3, name: "zeta(3)" },
		{ value: "0.5", expected: ZETA_HALF, name: "zeta(1/2)" },
		{ value: "1.5", expected: ZETA_THREE_HALVES, name: "zeta(3/2)" },
		{ value: "-0.5", expected: ZETA_MINUS_HALF, name: "zeta(-1/2)" },
	];

	for (const testCase of cases) {
		const actual = new BigFloat(testCase.value, REFERENCE_PRECISION).zeta();
		const expected = new BigFloat(testCase.expected, REFERENCE_PRECISION);
		assertClose(actual, expected, REFERENCE_PRECISION, testCase.name, 8);
	}
});

test("BigFloat zeta stays within direct-series bounds for s > 1", () => {
	const p = 24;
	const s = new BigFloat("2.5", p);
	const actual = s.zeta();
	const { lower, upper } = zetaSeriesBounds(s, 2000, p);
	assert.ok(actual.gt(lower), `zeta(2.5) fell below lower bound: ${actual.toString(10, p)} <= ${lower.toString(10, p)}`);
	assert.ok(actual.lt(upper), `zeta(2.5) exceeded upper bound: ${actual.toString(10, p)} >= ${upper.toString(10, p)}`);
});

test("BigFloat zeta is stable around the pole at s = 1", () => {
	const p = 40;
	const delta = new BigFloat("0.00000001", p);
	const one = new BigFloat(1, p);
	const left = one.sub(delta).zeta();
	const right = one.add(delta).zeta();
	const principalPartGap = new BigFloat(2, p).div(delta);
	const residual = right.sub(left).sub(principalPartGap).abs();
	assert.ok(residual.lt(delta.mul(10)), `pole stability residual too large: ${residual.toString(10, p)}`);
});
