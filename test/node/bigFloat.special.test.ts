import assert from "node:assert/strict";
import test from "node:test";
import { bigFloat, BigFloat, DivisionByZeroError, SpecialValuesDisabledError } from "../../dist/BigFloat.js";

function tolerance(precision: number | bigint, guardDigits = 8): BigFloat {
	const precisionBig = BigInt(precision);
	const exponent = precisionBig > BigInt(guardDigits) ? precisionBig - BigInt(guardDigits) : 0n;
	return new BigFloat(1, precisionBig).div(10n ** exponent);
}

function assertClose(actual: BigFloat, expected: BigFloat, precision: number | bigint, label: string, guardDigits = 8): void {
	const diff = actual.sub(expected).abs();
	assert.ok(diff.lt(tolerance(precision, guardDigits)), `${label}: got ${actual.toString(10, precision)}, expected ${expected.toString(10, precision)}, diff ${diff.toString(10, precision)}`);
}

test("BigFloat special values parse, stringify, and compare as explicit states", () => {
	assert.equal(BigFloat.config.allowSpecialValues, true);
	assert.equal(BigFloat.nan().toString(), "NaN");
	assert.equal(BigFloat.infinity().toString(), "Infinity");
	assert.equal(BigFloat.negativeInfinity().toString(), "-Infinity");
	assert.equal(bigFloat(Number.POSITIVE_INFINITY).toString(), "Infinity");
	assert.equal(bigFloat("-Infinity").toString(), "-Infinity");
	assert.equal(bigFloat(Number.NaN).toString(), "NaN");
	assert.equal(bigFloat("Infinity").gt(1), true);
	assert.equal(bigFloat("-Infinity").lt(1), true);
	assert.equal(bigFloat("NaN").eq("NaN"), false);
});

test("BigFloat arithmetic branches to Infinity and NaN without entering finite code paths", () => {
	assert.equal(bigFloat(1).div(0).toString(), "Infinity");
	assert.equal(bigFloat(-1).div(0).toString(), "-Infinity");
	assert.equal(bigFloat(0).div(0).toString(), "NaN");
	assert.equal(bigFloat(10).mod(0).toString(), "NaN");
	assert.equal(bigFloat("Infinity").add(1).toString(), "Infinity");
	assert.equal(bigFloat("Infinity").sub("Infinity").toString(), "NaN");
	assert.equal(bigFloat("Infinity").mul(0).toString(), "NaN");
	assert.equal(bigFloat("Infinity").div(-2).toString(), "-Infinity");
	assert.equal(bigFloat("Infinity").reciprocal().toString(), "0");
	assert.equal(bigFloat("-Infinity").neg().toString(), "Infinity");
	assert.equal(bigFloat("-Infinity").abs().toString(), "Infinity");
	assert.equal(bigFloat("Infinity").floor().toString(), "Infinity");
	assert.equal(bigFloat("NaN").ceil().toString(), "NaN");
});

test("BigFloat roots, trig, logs, and special functions propagate special states", () => {
	const precision = 80;
	const pi = BigFloat.pi(precision);

	assert.equal(bigFloat(-1).sqrt().toString(), "NaN");
	assert.equal(bigFloat("-Infinity").sqrt().toString(), "NaN");
	assert.equal(bigFloat("Infinity").cbrt().toString(), "Infinity");
	assert.equal(bigFloat("-Infinity").cbrt().toString(), "-Infinity");
	assert.equal(bigFloat(-16).nthRoot(2).toString(), "NaN");
	assert.equal(bigFloat("-Infinity").nthRoot(2).toString(), "NaN");
	assert.equal(bigFloat("Infinity").sin().toString(), "NaN");
	assert.equal(bigFloat("Infinity").cos().toString(), "NaN");
	assert.equal(bigFloat("Infinity").tan().toString(), "NaN");
	assert.equal(bigFloat("Infinity").asin().toString(), "NaN");
	assert.equal(bigFloat("Infinity").acos().toString(), "NaN");
	assert.equal(bigFloat("Infinity").sinh().toString(), "Infinity");
	assert.equal(bigFloat("-Infinity").sinh().toString(), "-Infinity");
	assert.equal(bigFloat("Infinity").cosh().toString(), "Infinity");
	assert.equal(bigFloat("Infinity").tanh().toString(), "1");
	assert.equal(bigFloat("-Infinity").tanh().toString(), "-1");
	assertClose(bigFloat("Infinity", precision).atan(), pi.div(2), precision, "atan(+Infinity)");
	assertClose(bigFloat("-Infinity", precision).atan(), pi.div(-2), precision, "atan(-Infinity)");
	assertClose(bigFloat("Infinity", precision).atan2(1), pi.div(2), precision, "atan2(+Infinity, 1)");
	assertClose(bigFloat("Infinity", precision).atan2("Infinity"), pi.div(4), precision, "atan2(+Infinity, +Infinity)");
	assertClose(bigFloat("Infinity", precision).atan2("-Infinity"), pi.mul(3).div(4), precision, "atan2(+Infinity, -Infinity)");
	assertClose(bigFloat("-Infinity", precision).atan2("Infinity"), pi.div(-4), precision, "atan2(-Infinity, +Infinity)");
	assertClose(bigFloat("-Infinity", precision).atan2("-Infinity"), pi.mul(-3).div(4), precision, "atan2(-Infinity, -Infinity)");
	assert.equal(bigFloat("Infinity").asinh().toString(), "Infinity");
	assert.equal(bigFloat("-Infinity").asinh().toString(), "-Infinity");
	assert.equal(bigFloat(1).acosh().toString(), "0");
	assert.equal(bigFloat("0.5").acosh().toString(), "NaN");
	assert.equal(bigFloat(1).atanh().toString(), "Infinity");
	assert.equal(bigFloat(-1).atanh().toString(), "-Infinity");
	assert.equal(bigFloat(2).atanh().toString(), "NaN");
	assert.equal(bigFloat(1, precision).atan2("Infinity").toString(), "0");
	assertClose(bigFloat(1, precision).atan2("-Infinity"), pi, precision, "atan2(1, -Infinity)");
	assert.equal(bigFloat("Infinity").exp().toString(), "Infinity");
	assert.equal(bigFloat("-Infinity").exp().toString(), "0");
	assert.equal(bigFloat("Infinity").exp2().toString(), "Infinity");
	assert.equal(bigFloat("-Infinity").exp2().toString(), "0");
	assert.equal(bigFloat("-Infinity").expm1().toString(), "-1");
	assert.equal(bigFloat(0).ln().toString(), "-Infinity");
	assert.equal(bigFloat(-1).ln().toString(), "NaN");
	assert.equal(bigFloat("Infinity").log(2).toString(), "Infinity");
	assert.equal(bigFloat("Infinity").log("0.5").toString(), "-Infinity");
	assert.equal(bigFloat(2).pow("Infinity").toString(), "Infinity");
	assert.equal(bigFloat("0.5").pow("Infinity").toString(), "0");
	assert.equal(bigFloat("-2").pow("Infinity").toString(), "NaN");
	assert.equal(bigFloat(10).log(1).toString(), "NaN");
	assert.equal(bigFloat(0).log2().toString(), "-Infinity");
	assert.equal(bigFloat(-1).log10().toString(), "NaN");
	assert.equal(bigFloat(-1).log1p().toString(), "-Infinity");
	assert.equal(bigFloat(-2).log1p().toString(), "NaN");
	assert.equal(bigFloat("Infinity").gamma().toString(), "Infinity");
	assert.equal(bigFloat("Infinity").zeta().toString(), "1");
	assert.equal(bigFloat(1).zeta().toString(), "Infinity");
	assert.equal(bigFloat("Infinity").factorial().toString(), "Infinity");
	assert.equal(bigFloat("NaN").factorial().toString(), "NaN");
	assert.equal(BigFloat.hypot("NaN", "Infinity").toString(), "Infinity");
	assert.equal(BigFloat.max("NaN", "Infinity").toString(), "NaN");
	assert.equal(BigFloat.min("NaN", "-Infinity").toString(), "NaN");
});

test("BigFloat can disable special values and throw instead of producing states", () => {
	const Strict = BigFloat.clone();
	Strict.config.allowSpecialValues = false;

	assert.equal(Strict.config.allowSpecialValues, false);
	assert.throws(() => Strict.nan(20), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => Strict.infinity(20), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => Strict.negativeInfinity(20), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => new Strict(Number.POSITIVE_INFINITY, 20), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => new Strict("NaN", 20), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => new Strict(1, 20).div(0), (error) => error instanceof DivisionByZeroError && /Division by zero/.test(error.message));
	assert.throws(() => new Strict(-1, 20).sqrt(), /negative number/);
	assert.throws(() => new Strict(0, 20).ln(), /undefined for x <= 0/);
	assert.throws(() => new Strict("0.5", 20).acosh(), /acosh input must be >= 1/);
	assert.throws(() => new Strict(2, 20).atanh(), /atanh input must be in \[-1,1\]/);

	const Carrier = BigFloat.clone();
	const infinity = new Carrier(1, 20).div(0);
	Carrier.config.allowSpecialValues = false;

	assert.throws(() => infinity.toString(), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => infinity.toNumber(), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => infinity.add(1), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
	assert.throws(() => Carrier.max(), (error) => error instanceof SpecialValuesDisabledError && /Special values are disabled/.test(error.message));
});
