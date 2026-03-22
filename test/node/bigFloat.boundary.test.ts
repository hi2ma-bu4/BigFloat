import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatComplex, BigFloatConfig, PrecisionMismatchError, RoundingMode } from "../../dist/BigFloat.js";

const HIGH_PRECISION = 80;
const ULTRA_PRECISION = 120;

function tolerance(precision: number | bigint, guardDigits = 8): BigFloat {
	const precisionBig = BigInt(precision);
	const exponent = precisionBig > BigInt(guardDigits) ? precisionBig - BigInt(guardDigits) : 0n;
	return new BigFloat(1, precisionBig).div(10n ** exponent);
}

function assertClose(actual: BigFloat, expected: BigFloat, precision: number | bigint, label: string, guardDigits = 8): void {
	const diff = actual.sub(expected).abs();
	assert.ok(diff.lt(tolerance(precision, guardDigits)), `${label}: got ${actual.toString(10, precision)}, expected ${expected.toString(10, precision)}, diff ${diff.toString(10, precision)}`);
}

function captureDivisionTargetPrecision(construct: typeof BigFloat, precision: number | bigint): bigint {
	const numerator = new construct(1, precision);
	const denominator = new construct(3, precision);
	const prototype = construct.prototype as BigFloat & { _applyPrecision: (precision?: bigint) => void };
	const originalApplyPrecision = prototype._applyPrecision;
	let capturedPrecision: bigint | null = null;
	prototype._applyPrecision = function (targetPrecision?: bigint): void {
		if (capturedPrecision === null && this._exp2 === this._exp5 && this._exp2 < 0n) {
			capturedPrecision = -this._exp2;
		}
		return originalApplyPrecision.call(this, targetPrecision);
	};
	try {
		numerator.div(denominator);
		assert.notStrictEqual(capturedPrecision, null);
		if (capturedPrecision === null) {
			throw new Error("division target precision was not captured");
		}
		return capturedPrecision;
	} finally {
		prototype._applyPrecision = originalApplyPrecision;
	}
}

function capturePiRefineWorkPrecision(construct: typeof BigFloat, seedPrecision: number | bigint, precision: number | bigint): bigint {
	construct.clearCache();
	construct.pi(seedPrecision);
	const originalSinSeries = (construct as typeof BigFloat & { _sinSeries: (value: bigint, precision: bigint, maxSteps: bigint) => bigint })._sinSeries;
	let capturedPrecision: bigint | null = null;
	(construct as typeof BigFloat & { _sinSeries: (value: bigint, precision: bigint, maxSteps: bigint) => bigint })._sinSeries = function (value: bigint, workPrecision: bigint, maxSteps: bigint): bigint {
		if (capturedPrecision === null) {
			capturedPrecision = workPrecision;
		}
		return originalSinSeries.call(this, value, workPrecision, maxSteps);
	};
	try {
		construct.pi(precision);
		assert.notStrictEqual(capturedPrecision, null);
		if (capturedPrecision === null) {
			throw new Error("pi refine work precision was not captured");
		}
		return capturedPrecision;
	} finally {
		(construct as typeof BigFloat & { _sinSeries: (value: bigint, precision: bigint, maxSteps: bigint) => bigint })._sinSeries = originalSinSeries;
		construct.clearCache();
	}
}

test("BigFloatConfig clones and toggles every option", () => {
	const config = new BigFloatConfig({
		allowPrecisionMismatch: true,
		allowComplexNumbers: true,
		mutateResult: true,
		allowSpecialValues: false,
		roundingMode: RoundingMode.HALF_DOWN,
		extraPrecision: 11n,
		trigFuncsMaxSteps: 22n,
		lnMaxSteps: 33n,
	});
	const clone = config.clone();

	assert.notStrictEqual(clone, config);
	assert.deepStrictEqual(
		{
			allowPrecisionMismatch: clone.allowPrecisionMismatch,
			allowComplexNumbers: clone.allowComplexNumbers,
			mutateResult: clone.mutateResult,
			allowSpecialValues: clone.allowSpecialValues,
			roundingMode: clone.roundingMode,
			extraPrecision: clone.extraPrecision,
			trigFuncsMaxSteps: clone.trigFuncsMaxSteps,
			lnMaxSteps: clone.lnMaxSteps,
		},
		{
			allowPrecisionMismatch: true,
			allowComplexNumbers: true,
			mutateResult: true,
			allowSpecialValues: false,
			roundingMode: RoundingMode.HALF_DOWN,
			extraPrecision: 11n,
			trigFuncsMaxSteps: 22n,
			lnMaxSteps: 33n,
		},
	);

	config.toggleMismatch();
	config.toggleComplexNumbers();
	config.toggleMutation();
	assert.equal(config.allowPrecisionMismatch, false);
	assert.equal(config.allowComplexNumbers, false);
	assert.equal(config.mutateResult, false);
	assert.equal(clone.allowPrecisionMismatch, true);
	assert.equal(clone.allowComplexNumbers, true);
	assert.equal(clone.mutateResult, true);
});

test("BigFloat class cloning isolates configuration, instance cloning, and copy helpers", () => {
	const Derived = BigFloat.clone();
	Derived.config.allowPrecisionMismatch = true;
	Derived.config.allowComplexNumbers = true;
	Derived.config.mutateResult = true;
	Derived.config.allowSpecialValues = false;
	Derived.config.roundingMode = RoundingMode.UP;
	Derived.config.extraPrecision = 3n;
	Derived.config.trigFuncsMaxSteps = 7n;
	Derived.config.lnMaxSteps = 9n;

	assert.equal(BigFloat.config.allowPrecisionMismatch, false);
	assert.equal(BigFloat.config.allowComplexNumbers, false);
	assert.equal(BigFloat.config.mutateResult, false);
	assert.equal(BigFloat.config.allowSpecialValues, true);
	assert.equal(BigFloat.config.roundingMode, RoundingMode.TRUNCATE);
	assert.equal(BigFloat.config.extraPrecision, 6n);
	assert.equal(BigFloat.config.trigFuncsMaxSteps, 5000n);
	assert.equal(BigFloat.config.lnMaxSteps, 10000n);

	const original = new BigFloat("1.25", HIGH_PRECISION);
	const cloned = original.clone();
	const copied = new BigFloat(0, HIGH_PRECISION).copyFrom(original);

	assert.notStrictEqual(cloned, original);
	assert.notStrictEqual(copied, original);
	assert.equal(cloned.toString(10, HIGH_PRECISION), original.toString(10, HIGH_PRECISION));
	assert.equal(copied.toString(10, HIGH_PRECISION), original.toString(10, HIGH_PRECISION));

	cloned.add(1);
	assert.equal(original.toString(), "1.25");
});

test("BigFloat changePrecision validates precision bounds", () => {
	const value = new BigFloat("1.25", HIGH_PRECISION);

	assert.throws(() => value.clone().changePrecision(-1), /Precision must be greater than 0/);
	assert.throws(() => value.clone().changePrecision(BigFloat.MAX_PRECISION + 1n), /Precision exceeds BigFloat\.MAX_PRECISION/);
});

test("BigFloat extraPrecision drives division and pi cache refinement work precision", () => {
	const lowPrecisionClass = BigFloat.clone();
	const highPrecisionClass = BigFloat.clone();
	lowPrecisionClass.config.extraPrecision = 2n;
	highPrecisionClass.config.extraPrecision = 9n;

	const lowDivisionPrecision = captureDivisionTargetPrecision(lowPrecisionClass, 20);
	const highDivisionPrecision = captureDivisionTargetPrecision(highPrecisionClass, 20);
	assert.equal(highDivisionPrecision - lowDivisionPrecision, 7n);

	const lowPiPrecision = capturePiRefineWorkPrecision(lowPrecisionClass, 8, 20);
	const highPiPrecision = capturePiRefineWorkPrecision(highPrecisionClass, 8, 20);
	assert.equal(highPiPrecision - lowPiPrecision, 7n);
});

test("BigFloat construction, parsing, normalization, and formatting handle boundaries", () => {
	const zeroFromUndefined = new BigFloat(undefined, HIGH_PRECISION);
	const sci = new BigFloat("-1.25e2", HIGH_PRECISION);
	const rawSoft = new BigFloat(0, HIGH_PRECISION);
	rawSoft.mantissa = 40n;
	rawSoft._exp2 = 0n;
	rawSoft._exp5 = 0n;
	rawSoft.softNormalize();

	const rawLazy = new BigFloat(0, HIGH_PRECISION);
	rawLazy.mantissa = 625n;
	rawLazy._exp2 = 0n;
	rawLazy._exp5 = 0n;
	rawLazy.lazyNormalize();

	assert.equal(zeroFromUndefined.toString(), "0");
	assert.equal(sci.toString(), "-125");
	assert.deepStrictEqual(new BigFloat(0, HIGH_PRECISION)._parse("-1.25e2"), { intPart: "125", fracPart: "", sign: -1 });

	assert.equal(rawSoft.mantissa, 5n);
	assert.equal(rawSoft.exponent2(), 3n);
	assert.equal(rawSoft.exponent5(), 0n);
	assert.equal(rawLazy.mantissa, 1n);
	assert.equal(rawLazy.exponent2(), 0n);
	assert.equal(rawLazy.exponent5(), 4n);

	const base2 = BigFloat.parseFloat("1.101", HIGH_PRECISION, 2);
	const base16 = BigFloat.parseFloat("ff.8", HIGH_PRECISION, 16);
	assert.equal(base2.toString(), "1.625");
	assert.equal(base16.toString(), "255.5");
	assert.equal(new BigFloat("1.625", HIGH_PRECISION).toString(2, 3), "1.101");
	assert.equal(new BigFloat("255.5", HIGH_PRECISION).toString(16, 1), "ff.8");

	assert.equal(new BigFloat("1234.5", HIGH_PRECISION).toJSON(), "1234.5");
	assert.equal(new BigFloat("1.5", HIGH_PRECISION).toNumber(), 1.5);
	assert.equal(new BigFloat("1.2", HIGH_PRECISION).toFixed(4), "1.2000");
	assert.equal(new BigFloat("1234.5", HIGH_PRECISION).toExponential(4), "1.2345e+3");

	assert.throws(() => BigFloat.parseFloat("1", HIGH_PRECISION, 1), /Base must be between 2 and 36/);
	assert.throws(
		() => BigFloat.parseFloat("2", HIGH_PRECISION, 2),
		(error) => error instanceof SyntaxError && /Invalid digit/.test(error.message),
	);
	assert.throws(() => new BigFloat("1", HIGH_PRECISION).toString(37), /Base must be between 2 and 36/);
	assert.throws(() => new BigFloat("1", -1), /Precision must be greater than 0/);
});

test("BigFloat precision mismatch and mutation options change result precision semantics", () => {
	const Strict = BigFloat.clone();
	const strictA = new Strict("1.23456", 5);
	const strictB = new Strict("0.000009", 6);

	assert.throws(
		() => strictA.add(strictB),
		(error) => error instanceof PrecisionMismatchError && /5 !== 6/.test(error.message),
	);
	assert.equal(strictA._precision, 5n);
	assert.equal(strictB._precision, 6n);

	const Permissive = BigFloat.clone();
	Permissive.config.allowPrecisionMismatch = true;
	const permissiveA = new Permissive("1.23456", 5);
	const permissiveB = new Permissive("0.000009", 6);
	const permissiveSum = permissiveA.add(permissiveB);

	assert.equal(permissiveA._precision, 5n);
	assert.equal(permissiveSum._precision, 5n);
	assert.equal(permissiveSum.toString(10, 5), "1.23456");

	const Mutating = BigFloat.clone();
	Mutating.config.mutateResult = true;
	const mutatingValue = new Mutating("1.5", HIGH_PRECISION);
	const mutated = mutatingValue.add("0.5");

	assert.strictEqual(mutated, mutatingValue);
	assert.equal(mutatingValue.toString(), "2");
});

test("BigFloat rejects complex operands by default and promotes to BigFloatComplex when enabled", () => {
	const complex = new BigFloatComplex("2i", HIGH_PRECISION);
	const real = new BigFloat(2, HIGH_PRECISION);

	assert.throws(() => real.add(complex), /allowComplexNumbers/);
	assert.throws(() => real.absoluteDiff(complex), /allowComplexNumbers/);

	const ComplexEnabled = BigFloat.clone();
	ComplexEnabled.config.allowComplexNumbers = true;

	const enabledReal = new ComplexEnabled(2, HIGH_PRECISION);
	const enabledComplex = new BigFloatComplex("2i", HIGH_PRECISION);
	const epsilon = tolerance(HIGH_PRECISION, 12);

	const sum = enabledReal.add(enabledComplex);
	const diff = enabledReal.sub(enabledComplex);
	const product = enabledReal.mul(enabledComplex);
	const quotient = enabledReal.div(new BigFloatComplex("1+i", HIGH_PRECISION));
	const powered = enabledReal.pow(enabledComplex);

	if (!(sum instanceof BigFloatComplex && diff instanceof BigFloatComplex && product instanceof BigFloatComplex && quotient instanceof BigFloatComplex && powered instanceof BigFloatComplex)) {
		assert.fail("expected complex-enabled arithmetic to return BigFloatComplex");
	}
	assert.equal(sum.toString(10, HIGH_PRECISION), "2 + 2i");
	assert.equal(diff.toString(10, HIGH_PRECISION), "2 - 2i");
	assert.equal(product.toString(10, HIGH_PRECISION), "4i");
	assert.ok(quotient.sub(new BigFloatComplex(1, -1, HIGH_PRECISION)).abs().lt(epsilon));
	assert.ok(powered.sub(new BigFloatComplex(2, 0, HIGH_PRECISION).pow(enabledComplex)).abs().lt(epsilon));
	assert.ok(enabledReal.relativeDiff(enabledComplex).sub(new BigFloatComplex(2, 0, HIGH_PRECISION).relativeDiff(enabledComplex)).abs().lt(epsilon));
	assert.ok(enabledReal.absoluteDiff(enabledComplex).sub(new BigFloatComplex(2, 0, HIGH_PRECISION).absoluteDiff(enabledComplex)).abs().lt(epsilon));
	assert.ok(enabledReal.percentDiff(enabledComplex).sub(new BigFloatComplex(2, 0, HIGH_PRECISION).percentDiff(enabledComplex)).abs().lt(epsilon));
	assert.throws(() => enabledReal.mod(enabledComplex), /does not support BigFloatComplex operands/);
});

test("BigFloat rounding modes and integer rounding helpers cover signed tie cases", () => {
	const expectations = [
		{ mode: RoundingMode.TRUNCATE, positive: "1.2", negative: "-1.2" },
		{ mode: RoundingMode.UP, positive: "1.3", negative: "-1.3" },
		{ mode: RoundingMode.CEIL, positive: "1.3", negative: "-1.2" },
		{ mode: RoundingMode.FLOOR, positive: "1.2", negative: "-1.3" },
		{ mode: RoundingMode.HALF_UP, positive: "1.3", negative: "-1.3" },
		{ mode: RoundingMode.HALF_DOWN, positive: "1.2", negative: "-1.2" },
	];

	for (const entry of expectations) {
		const Rounded = BigFloat.clone();
		Rounded.config.roundingMode = entry.mode;
		assert.equal(new Rounded("1.25", 1).toString(10, 1), entry.positive);
		assert.equal(new Rounded("-1.25", 1).toString(10, 1), entry.negative);
	}

	const value = new BigFloat("-1.75", HIGH_PRECISION);
	assert.equal(value.floor().toString(), "-2");
	assert.equal(value.ceil().toString(), "-1");
	assert.equal(value.round().toString(), "-2");
	assert.equal(new BigFloat("-1.5", HIGH_PRECISION).round().toString(), "-1");
	assert.equal(value.trunc().toString(), "-1");
});

test("BigFloat comparison, precision matching, and diff helpers stay stable at high precision", () => {
	const a = new BigFloat("100", HIGH_PRECISION);
	const b = new BigFloat("110", HIGH_PRECISION);
	const x = new BigFloat("1.23456789", HIGH_PRECISION);
	const y = new BigFloat("1.23456000", HIGH_PRECISION);

	assert.equal(a.compare(b), -1);
	assert.equal(b.compare(a), 1);
	assert.equal(a.compare("100"), 0);
	assert.equal(a.eq("100"), true);
	assert.equal(a.equals("100"), true);
	assert.equal(a.ne(b), true);
	assert.equal(a.lt(b), true);
	assert.equal(a.lte("100"), true);
	assert.equal(b.gt(a), true);
	assert.equal(b.gte("110"), true);
	assert.equal(new BigFloat(0, HIGH_PRECISION).isZero(), true);
	assert.equal(new BigFloat("0.0001", HIGH_PRECISION).isPositive(), true);
	assert.equal(new BigFloat("-0.0001", HIGH_PRECISION).isNegative(), true);
	assert.equal(x.matchingPrecision(y), 5n);
	assert.equal(a.absoluteDiff(b).toString(), "10");
	assert.ok(a.relativeDiff(b).toString(10, 20).startsWith("0.090909090909"));
	assert.ok(a.percentDiff(b).toString(10, 18).startsWith("9.090909090909"));
});

test("BigFloat arithmetic, reciprocal, and root methods hit exact edge cases", () => {
	const farA = new BigFloat(`1.${"0".repeat(59)}1`, 60);
	const farB = new BigFloat(`0.${"0".repeat(59)}9`, 60);
	const sum = farA.add(farB);
	const reduced = new BigFloat(6, ULTRA_PRECISION).div(15);
	const lowPrecisionDivisor = new BigFloat("0.1", 1);
	const lowPrecisionQuotient = new BigFloat("1.25", 1).div(lowPrecisionDivisor);

	assert.equal(sum.toString(10, 60), `1.${"0".repeat(58)}1`);
	assert.equal(reduced.toString(10, ULTRA_PRECISION), "0.4");
	assert.equal(reduced.mantissa, 1n);
	assert.equal(reduced.exponent2(), 1n);
	assert.equal(reduced.exponent5(), -1n);
	assert.equal(lowPrecisionDivisor.mantissa, 1n);
	assert.equal(lowPrecisionQuotient.toString(10, 1), "12");
	assert.equal(new BigFloat("10.5", HIGH_PRECISION).mod("0.6").toString(10, 1), "0.3");
	assert.equal(new BigFloat("-12.5", HIGH_PRECISION).neg().toString(), "12.5");
	assert.equal(new BigFloat("-12.5", HIGH_PRECISION).abs().toString(), "12.5");
	assert.equal(new BigFloat(8, HIGH_PRECISION).reciprocal().toString(), "0.125");
	assert.equal(new BigFloat(2, HIGH_PRECISION).pow(-3).toString(), "0.125");
	assert.equal(new BigFloat(2, HIGH_PRECISION).pow(0).toString(), "1");
	assert.equal(new BigFloat(144, HIGH_PRECISION).sqrt().toString(), "12");
	assert.equal(new BigFloat("-27", HIGH_PRECISION).cbrt().toString(), "-3");
	assert.equal(new BigFloat(81, HIGH_PRECISION).nthRoot(4).toString(), "3");
	assert.equal(new BigFloat(-1, HIGH_PRECISION).sqrt().toString(), "NaN");
	assert.equal(new BigFloat(-16, HIGH_PRECISION).nthRoot(2).toString(), "NaN");
	assert.throws(() => new BigFloat(16, HIGH_PRECISION).nthRoot(0), /positive integer/);
});

test("BigFloat trigonometric methods satisfy high-precision boundary identities", () => {
	const pi = BigFloat.pi(ULTRA_PRECISION);

	assert.equal(new BigFloat(0, ULTRA_PRECISION).sin().toString(), "0");
	assert.equal(new BigFloat(0, ULTRA_PRECISION).cos().toString(), "1");
	assert.equal(new BigFloat(0, ULTRA_PRECISION).tan().toString(), "0");
	assertClose(pi.div(6).sin(), new BigFloat("0.5", ULTRA_PRECISION), ULTRA_PRECISION, "sin(pi/6)");
	assertClose(pi.div(3).cos(), new BigFloat("0.5", ULTRA_PRECISION), ULTRA_PRECISION, "cos(pi/3)");
	assertClose(pi.div(4).tan(), new BigFloat(1, ULTRA_PRECISION), ULTRA_PRECISION, "tan(pi/4)");
	assertClose(new BigFloat("0.5", ULTRA_PRECISION).asin(), pi.div(6), ULTRA_PRECISION, "asin(0.5)");
	assertClose(new BigFloat("0.5", ULTRA_PRECISION).acos(), pi.div(3), ULTRA_PRECISION, "acos(0.5)");
	assertClose(new BigFloat(1, ULTRA_PRECISION).atan(), pi.div(4), ULTRA_PRECISION, "atan(1)");
	assertClose(new BigFloat(1, ULTRA_PRECISION).atan2(-1), pi.mul(3).div(4), ULTRA_PRECISION, "atan2(1, -1)");
	assert.throws(() => pi.div(2).tan(), /undefined|unstable/);
	assert.equal(new BigFloat("1.1", ULTRA_PRECISION).asin().toString(), "NaN");
});

test("BigFloat exponential and logarithmic methods preserve inverse relationships at high precision", () => {
	const x = new BigFloat("1.234567890123456789", ULTRA_PRECISION);
	const tiny = new BigFloat("0.0000000000000000012345", ULTRA_PRECISION);

	assert.equal(new BigFloat(0, ULTRA_PRECISION).exp().toString(), "1");
	assert.equal(new BigFloat(10, ULTRA_PRECISION).exp2().toString(), "1024");
	assert.equal(new BigFloat(1, ULTRA_PRECISION).ln().toString(), "0");
	assertClose(new BigFloat(81, ULTRA_PRECISION).log(3), new BigFloat(4, ULTRA_PRECISION), ULTRA_PRECISION, "log_3(81)");
	assertClose(new BigFloat(8, ULTRA_PRECISION).log2(), new BigFloat(3, ULTRA_PRECISION), ULTRA_PRECISION, "log2(8)");
	assertClose(new BigFloat(1000, ULTRA_PRECISION).log10(), new BigFloat(3, ULTRA_PRECISION), ULTRA_PRECISION, "log10(1000)");
	assert.equal(new BigFloat(0, ULTRA_PRECISION).log1p().toString(), "0");
	assert.equal(new BigFloat(0, ULTRA_PRECISION).expm1().toString(), "0");
	assertClose(x.ln().exp(), x, ULTRA_PRECISION, "exp(ln(x))", 7);
	assertClose(tiny.expm1().log1p(), tiny, ULTRA_PRECISION, "log1p(expm1(x))", 7);
	assertClose(new BigFloat(2, ULTRA_PRECISION).exp2().log2(), new BigFloat(2, ULTRA_PRECISION), ULTRA_PRECISION, "log2(exp2(2))");
	assert.equal(new BigFloat(-1, ULTRA_PRECISION).ln().toString(), "NaN");
	assert.equal(new BigFloat(10, ULTRA_PRECISION).log(1).toString(), "NaN");
});

test("BigFloat constants, aggregates, random, gamma, zeta, and factorial helpers cover public APIs", () => {
	BigFloat.clearCache();
	const piA = BigFloat.pi(ULTRA_PRECISION);
	BigFloat.clearCache();
	const piB = BigFloat.pi(ULTRA_PRECISION);
	const tau = BigFloat.tau(ULTRA_PRECISION);
	const e = BigFloat.e(ULTRA_PRECISION);
	const statsValues = [2, 4, 4, 4, 5, 5, 7, 9].map((value) => new BigFloat(value, ULTRA_PRECISION));

	assertClose(piA, piB, ULTRA_PRECISION, "pi cache reset");
	assertClose(tau, piA.mul(2), ULTRA_PRECISION, "tau = 2pi");
	assertClose(e.ln(), new BigFloat(1, ULTRA_PRECISION), ULTRA_PRECISION, "ln(e)");

	assert.equal(BigFloat.max(statsValues).toString(), "9");
	assert.equal(BigFloat.min(statsValues).toString(), "2");
	assert.equal(BigFloat.sum(statsValues).toString(), "40");
	assert.equal(BigFloat.product(2, 3, 4).toString(), "24");
	assert.equal(BigFloat.average(statsValues).toString(), "5");
	assert.equal(BigFloat.median(1, 2, 3, 4).toString(), "2.5");
	assert.equal(BigFloat.variance(statsValues).toString(), "4");
	assert.equal(BigFloat.stddev(statsValues).toString(), "2");
	assert.equal(BigFloat.sum().toString(), "0");
	assert.equal(BigFloat.product().toString(), "1");
	assert.equal(BigFloat.average().toString(), "0");
	assert.equal(BigFloat.max().toString(), "-Infinity");
	assert.equal(BigFloat.min().toString(), "Infinity");
	assert.throws(() => BigFloat.median(), /No arguments/);
	assert.throws(() => BigFloat.variance(), /No arguments/);

	const randomValues = Array.from({ length: 8 }, () => BigFloat.random(30));
	for (const value of randomValues) {
		assert.ok(value.gte(0));
		assert.ok(value.lt(1));
		assert.equal(value._precision, 30n);
	}

	assert.equal(BigFloat.minusOne(ULTRA_PRECISION).toString(), "-1");
	assert.equal(BigFloat.zero(ULTRA_PRECISION).toString(), "0");
	assert.equal(BigFloat.quarter(ULTRA_PRECISION).toString(), "0.25");
	assert.equal(BigFloat.half(ULTRA_PRECISION).toString(), "0.5");
	assert.equal(BigFloat.one(ULTRA_PRECISION).toString(), "1");
	assert.equal(BigFloat.two(ULTRA_PRECISION).toString(), "2");
	assert.equal(BigFloat.ten(ULTRA_PRECISION).toString(), "10");
	assert.equal(BigFloat.hundred(ULTRA_PRECISION).toString(), "100");
	assert.equal(BigFloat.thousand(ULTRA_PRECISION).toString(), "1000");
	assert.equal(BigFloat.minusTwo(ULTRA_PRECISION).toString(), "-2");
	assert.equal(BigFloat.minusTen(ULTRA_PRECISION).toString(), "-10");
	assertClose(new BigFloat("0.5", ULTRA_PRECISION).gamma(), piA.sqrt(), ULTRA_PRECISION, "gamma(1/2)", 22);
	assert.equal(new BigFloat(0, ULTRA_PRECISION).factorial().toString(), "1");
	assertClose(new BigFloat("0.5", ULTRA_PRECISION).factorial(), piA.sqrt().div(2), ULTRA_PRECISION, "factorial(1/2)", 22);
	assert.equal(new BigFloat(0, ULTRA_PRECISION).zeta().toString(), "-0.5");
	assert.equal(new BigFloat(-2, ULTRA_PRECISION).zeta().toString(), "0");
});

test("BigFloat static Math-compatible methods cover missing Math APIs", () => {
	const x = new BigFloat("1.25", ULTRA_PRECISION);

	assert.equal(BigFloat.abs(-3).toString(), "3");
	assert.equal(BigFloat.sign(-3).toString(), "-1");
	assert.equal(BigFloat.sign(0).toString(), "0");
	assert.equal(BigFloat.ceil("1.2").toString(), "2");
	assert.equal(BigFloat.floor("-1.2").toString(), "-2");
	assert.equal(BigFloat.round("-1.5").toString(), "-1");
	assert.equal(BigFloat.trunc("-1.9").toString(), "-1");
	assert.equal(BigFloat.clz32(1).toString(), "31");
	assert.equal(BigFloat.imul(0xffffffff, 5).toString(), "-5");
	assert.equal(BigFloat.hypot(3, 4).toString(), "5");
	assert.equal(BigFloat.max("NaN", 1).toString(), "NaN");
	assert.equal(BigFloat.min(1, "NaN").toString(), "NaN");
	assert.equal(BigFloat.sinh(0, ULTRA_PRECISION).toString(), "0");
	assert.equal(BigFloat.cosh(0, ULTRA_PRECISION).toString(), "1");
	assertClose(BigFloat.asinh(x, ULTRA_PRECISION).sinh(), x, ULTRA_PRECISION, "sinh(asinh(x))");
	assertClose(BigFloat.acosh(2, ULTRA_PRECISION).cosh(), new BigFloat(2, ULTRA_PRECISION), ULTRA_PRECISION, "cosh(acosh(2))");
	assertClose(BigFloat.atanh("0.5", ULTRA_PRECISION).tanh(), new BigFloat("0.5", ULTRA_PRECISION), ULTRA_PRECISION, "tanh(atanh(0.5))");
	assertClose(BigFloat.log(BigFloat.e(ULTRA_PRECISION), ULTRA_PRECISION), new BigFloat(1, ULTRA_PRECISION), ULTRA_PRECISION, "log(e)");
	assertClose(BigFloat.sqrt(9, ULTRA_PRECISION), new BigFloat(3, ULTRA_PRECISION), ULTRA_PRECISION, "sqrt(9)");
	assertClose(BigFloat.pow(2, 10, ULTRA_PRECISION), new BigFloat(1024, ULTRA_PRECISION), ULTRA_PRECISION, "pow(2,10)");
	assert.equal(BigFloat.fround("1.337", ULTRA_PRECISION).toNumber(), Math.fround(1.337), "fround(1.337)");
});
