import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatComplex } from "../../dist/BigFloat.js";

function toPair(value: BigFloatComplex, precision?: number | bigint): [string, string] {
	const [real, imag] = value.toArray();
	return [
		precision === undefined ? real.toString() : real.toString(10, precision),
		precision === undefined ? imag.toString() : imag.toString(10, precision),
	];
}

function assertComplexClose(actual: BigFloatComplex, expected: BigFloatComplex, epsilon: BigFloat): void {
	assert.ok(actual.sub(expected).abs().lt(epsilon), `expected ${expected.toString()} but got ${actual.toString()}`);
}

test("BigFloatComplex factories and accessors preserve owned values", () => {
	const sourceReal = new BigFloat("1.25", 20);
	const sourceImag = new BigFloat("-0.5", 20);
	const complex = BigFloatComplex.of(sourceReal, sourceImag, 20);

	sourceReal.copyFrom(new BigFloat("9", 20));
	sourceImag.copyFrom(new BigFloat("8", 20));
	assert.deepStrictEqual(toPair(complex, 20), ["1.25", "-0.5"]);

	const fromTuple = BigFloatComplex.from([2, 3], undefined, 20);
	const fromObject = BigFloatComplex.from({ re: "4.5", im: "-1.25" }, undefined, 20);
	const fromPolar = BigFloatComplex.fromPolar(2, BigFloat.pi(40).div(2), 40);

	assert.deepStrictEqual(toPair(BigFloatComplex.zero(20), 20), ["0", "0"]);
	assert.deepStrictEqual(toPair(BigFloatComplex.one(20), 20), ["1", "0"]);
	assert.deepStrictEqual(toPair(BigFloatComplex.i(20), 20), ["0", "1"]);
	assert.deepStrictEqual(toPair(fromTuple, 20), ["2", "3"]);
	assert.deepStrictEqual(toPair(fromObject, 20), ["4.5", "-1.25"]);
	assert.ok(fromPolar.real.abs().lt(new BigFloat("0.000000000000000001", 40)));
	assert.ok(fromPolar.imag.sub(2).abs().lt(new BigFloat("0.000000000000000001", 40)));

	assert.equal(complex.toString(10, 20), "1.25 - 0.5i");
	assert.equal(BigFloatComplex.of(0, 1).toString(), "i");
	assert.equal(BigFloatComplex.of(0, -1).toString(), "-i");
	assert.equal(BigFloatComplex.of(1, 0).toString(), "1");
	assert.deepStrictEqual(complex.toJSON(), { re: "1.25", im: "-0.5" });
	assert.deepStrictEqual(complex.toVector().toArray().map((value) => value.toString(10, 20)), ["1.25", "-0.5"]);
	assert.deepStrictEqual(Array.from(complex).map((value) => value.toString(10, 20)), ["1.25", "-0.5"]);

	const real = complex.real;
	const imag = complex.imag;
	real.copyFrom(new BigFloat(0, 20));
	imag.copyFrom(new BigFloat(0, 20));
	assert.deepStrictEqual(toPair(complex, 20), ["1.25", "-0.5"]);
});

test("BigFloatComplex parses complex strings in constructors and from()", () => {
	const implicitPrecision = new BigFloatComplex("2i");

	assert.deepStrictEqual(toPair(new BigFloatComplex("2i", 20), 20), ["0", "2"]);
	assert.deepStrictEqual(toPair(new BigFloatComplex("-i", 20), 20), ["0", "-1"]);
	assert.deepStrictEqual(toPair(new BigFloatComplex("1 + 2i", 20), 20), ["1", "2"]);
	assert.deepStrictEqual(toPair(new BigFloatComplex("1-2i", 20), 20), ["1", "-2"]);
	assert.deepStrictEqual(toPair(new BigFloatComplex("-3.5 + i", 20), 20), ["-3.5", "1"]);
	assert.deepStrictEqual(toPair(new BigFloatComplex("1e-3-2e+1i", 20), 20), ["0.001", "-20"]);
	assert.deepStrictEqual(toPair(implicitPrecision), ["0", "2"]);
	assert.equal(implicitPrecision.precision, BigFloat.DEFAULT_PRECISION);

	assert.deepStrictEqual(toPair(BigFloatComplex.from("2i")), ["0", "2"]);
	assert.deepStrictEqual(toPair(BigFloatComplex.from("2i", 20), 20), ["0", "2"]);
	assert.deepStrictEqual(toPair(BigFloatComplex.from("4 - i", 20), 20), ["4", "-1"]);
	assert.deepStrictEqual(toPair(BigFloatComplex.from("3", 4, 20), 20), ["3", "4"]);
	assert.equal(BigFloatComplex.from("2i").precision, BigFloat.DEFAULT_PRECISION);

	assert.throws(() => new BigFloatComplex("1+i2", 20), /Invalid complex string/);
});

test("BigFloatComplex methods accept complex strings as normal arguments", () => {
	const z = BigFloatComplex.of(1, 2, 40);
	const epsilon = new BigFloat("0.000000000000000001", 40);

	assert.deepStrictEqual(toPair(z.add("3-4i"), 40), ["4", "-2"]);
	assert.deepStrictEqual(toPair(z.sub("3-4i"), 40), ["-2", "6"]);
	assert.deepStrictEqual(toPair(z.mul("3-4i"), 40), ["11", "2"]);
	assertComplexClose(z.div("3-4i"), BigFloatComplex.of("-0.2", "0.4", 40), epsilon);
	assert.equal(z.equals("1+2i"), true);
	assert.equal(z.ne("1+2i"), false);
	assert.ok(z.distanceTo("3-4i").sub(new BigFloat(40, 40).sqrt()).abs().lt(epsilon));
	assert.ok(z.absoluteDiff("3-4i").sub(new BigFloat(40, 40).sqrt()).abs().lt(epsilon));
	assert.ok(z.relativeDiff("3-4i").gt(0));
	assert.ok(z.percentDiff("3-4i").gt(0));
	assertComplexClose(BigFloatComplex.of(1, 0, 40).pow("2i"), BigFloatComplex.of(1, 0, 40), epsilon);
	assertComplexClose(BigFloatComplex.of(1, 0, 40).log("1+i"), BigFloatComplex.zero(40), epsilon);
});

test("BigFloatComplex algebra, norms, and roots behave as expected", () => {
	const z = BigFloatComplex.of(1, 2, 40);
	const w = BigFloatComplex.of(3, -4, 40);
	const epsilon = new BigFloat("0.00000000000000000001", 40);

	assert.deepStrictEqual(toPair(z.add(w), 40), ["4", "-2"]);
	assert.deepStrictEqual(toPair(z.sub(w), 40), ["-2", "6"]);
	assert.deepStrictEqual(toPair(z.mul(w), 40), ["11", "2"]);
	assertComplexClose(z.div(w), BigFloatComplex.of("-0.2", "0.4", 40), epsilon);
	assertComplexClose(z.reciprocal(), BigFloatComplex.of("0.2", "-0.4", 40), epsilon);
	assert.deepStrictEqual(toPair(z.conjugate(), 40), ["1", "-2"]);
	assert.equal(z.absSquared().toString(10, 40), "5");
	assert.ok(z.abs().sub(new BigFloat(5, 40).sqrt()).abs().lt(epsilon));
	assertComplexClose(z.sign(), z.div(z.abs()), epsilon);
	assertComplexClose(z.normalize(), z.div(z.abs()), epsilon);
	assert.ok(z.distanceTo(w).sub(new BigFloat(40, 40).sqrt()).abs().lt(epsilon));
	assert.ok(z.absoluteDiff(w).sub(new BigFloat(40, 40).sqrt()).abs().lt(epsilon));
	assert.ok(z.relativeDiff(w).gt(0));
	assert.ok(z.percentDiff(w).gt(0));

	assertComplexClose(BigFloatComplex.of(4, 0, 40).sqrt(), BigFloatComplex.of(2, 0, 40), epsilon);
	assertComplexClose(BigFloatComplex.of(-1, 0, 40).sqrt(), BigFloatComplex.i(40), epsilon);
	assertComplexClose(BigFloatComplex.of(8, 0, 40).cbrt(), BigFloatComplex.of(2, 0, 40), epsilon);
	assertComplexClose(BigFloatComplex.of(-1, 0, 40).nthRoot(3), BigFloatComplex.fromPolar(1, BigFloat.pi(40).div(3), 40), epsilon);

	const roots = BigFloatComplex.one(40).nthRoots(3);
	assert.equal(roots.length, 3);
	for (const root of roots) {
		assertComplexClose(root.pow(3), BigFloatComplex.one(40), new BigFloat("0.000000000000000001", 40));
	}

	const rotated = BigFloatComplex.of(1, 0, 40).rotate(BigFloat.pi(40).div(2));
	assertComplexClose(rotated, BigFloatComplex.i(40), epsilon);

	assert.equal(BigFloatComplex.of(1, 2).equals([1, 2]), true);
	assert.equal(BigFloatComplex.of(1, 2).ne([1, 2]), false);
	assert.equal(BigFloatComplex.of(3, 0).isReal(), true);
	assert.equal(BigFloatComplex.of(0, 3).isImaginary(), true);
	assert.equal(BigFloatComplex.zero(20).isZero(), true);
	assert.throws(() => BigFloatComplex.zero(20).normalize(), /zero complex/);
});

test("BigFloatComplex elementary transcendental identities hold on principal branches", () => {
	const precision = 40;
	const epsilon = new BigFloat("0.000000000000000001", precision);
	const z = BigFloatComplex.of("0.25", "0.1", precision);
	const small = BigFloatComplex.of("0.1", "0.05", precision);

	assertComplexClose(BigFloatComplex.i(precision).mul(BigFloat.pi(precision)).exp(), BigFloatComplex.of(-1, 0, precision), epsilon);
	assertComplexClose(BigFloatComplex.of(0, 1, precision).sin(), BigFloatComplex.of(0, new BigFloat(1, precision).sinh(), precision), epsilon);
	assertComplexClose(BigFloatComplex.of(0, 1, precision).cos(), BigFloatComplex.of(new BigFloat(1, precision).cosh(), 0, precision), epsilon);
	assertComplexClose(z.exp().ln(), z, epsilon);
	assertComplexClose(z.pow(2), z.mul(z), epsilon);
	assertComplexClose(z.log(BigFloatComplex.e(precision)), z.ln(), epsilon);
	assertComplexClose(small.sin().asin(), small, epsilon);
	assertComplexClose(small.sinh().asinh(), small, epsilon);
	assertComplexClose(small.tanh().atanh(), small, epsilon);
	assertComplexClose(small.tan().atan(), small, epsilon);
	assertComplexClose(small.cos().acos(), small, new BigFloat("0.00000000000000001", precision));
});

test("BigFloatComplex aggregate helpers combine values correctly", () => {
	const values = [BigFloatComplex.of(1, 2, 20), BigFloatComplex.of(3, -1, 20), BigFloatComplex.of(-2, 4, 20)];

	assert.deepStrictEqual(toPair(BigFloatComplex.sum(values), 20), ["2", "5"]);
	assert.deepStrictEqual(toPair(BigFloatComplex.average(values), 20), ["0.66666666666666666666", "1.66666666666666666666"]);
	assertComplexClose(
		BigFloatComplex.product([BigFloatComplex.of(1, 1, 20), BigFloatComplex.of(1, -1, 20)]),
		BigFloatComplex.of(2, 0, 20),
		new BigFloat("0.000000000000000001", 20),
	);
});
