import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatComplex, BigFloatComplexVector, BigFloatVector } from "../../dist/BigFloat.js";

test("BigFloatComplexVector operations", () => {
	BigFloat.config.allowComplexNumbers = true;
	const v1 = BigFloatComplexVector.of("1+2i", "3+4i");
	const v2 = BigFloatComplexVector.of("5+6i", "7+8i");

	const sum = v1.add(v2);
	assert.ok(sum instanceof BigFloatComplexVector);
	assert.strictEqual(sum.at(0)?.toString(), "6 + 8i");
	assert.strictEqual(sum.at(1)?.toString(), "10 + 12i");

	const promoted = BigFloatVector.of(1, 2).add(new BigFloatComplex(0, 1));
	assert.ok(promoted instanceof BigFloatComplexVector);
	assert.strictEqual(promoted.at(0)?.toString(), "1 + i");
	assert.strictEqual(promoted.at(1)?.toString(), "2 + i");
});

test("BigFloatComplexVector mixed real/complex", () => {
	BigFloat.config.allowComplexNumbers = true;
	const v = BigFloatVector.from([1, new BigFloatComplex(2, 3)]);
	assert.ok(v instanceof BigFloatComplexVector);
	assert.strictEqual(v.at(0)?.toString(), "1");
	assert.strictEqual(v.at(1)?.toString(), "2 + 3i");
});

test("BigFloatComplexVector real-only operations on complex with imag=0", () => {
	const v = BigFloatComplexVector.of(new BigFloatComplex(1.5, 0), new BigFloatComplex(2.5, 0));
	const floor = v.floor();
	assert.strictEqual(floor.at(0)?.toString(), "1");
	assert.strictEqual(floor.at(1)?.toString(), "2");

	const vNonReal = BigFloatComplexVector.of(new BigFloatComplex(1.5, 1));
	assert.throws(() => vNonReal.floor(), TypeError);
});

test("BigFloatComplexVector compatibility methods work for real-valued complex vectors", () => {
	const v = BigFloatComplexVector.of(new BigFloatComplex(1, 0, 40), new BigFloatComplex(4, 0, 40));
	const w = BigFloatComplexVector.of(new BigFloatComplex(2, 0, 40), new BigFloatComplex(8, 0, 40));
	const epsilon = new BigFloat("0.000000000000000001", 40);

	assert.ok(v.atan2(BigFloatComplexVector.of(1, 1)).at(0)?.sub(BigFloat.pi(40).div(4)).abs().lt(epsilon));
	assert.ok(v.exp2().at(0)?.sub(BigFloatComplex.of(2, 0, 40)).abs().lt(epsilon));
	assert.ok(w.log1p().at(1)?.sub(BigFloatComplex.of(new BigFloat(8, 40).log1p(), 0, 40)).abs().lt(epsilon));
	assert.ok(BigFloatComplexVector.of(BigFloatComplex.of(5, 0, 40), BigFloatComplex.of(6, 0, 40)).gamma().at(0)?.sub(BigFloatComplex.of(24, 0, 40)).abs().lt(epsilon));
	assert.ok(BigFloatComplexVector.of(BigFloatComplex.of(5, 0, 40), BigFloatComplex.of(6, 0, 40)).factorial().at(0)?.sub(BigFloatComplex.of(120, 0, 40)).abs().lt(epsilon));
	assert.strictEqual(v.max().toString(), "4");
	assert.strictEqual(v.min().toString(), "1");
	assert.ok(
		BigFloatComplexVector
			.of(BigFloatComplex.of(1, 0, 40), BigFloatComplex.of(0, 0, 40))
			.angleTo(BigFloatComplexVector.of(BigFloatComplex.of(0, 0, 40), BigFloatComplex.of(1, 0, 40)))
			.sub(BigFloat.pi(40).div(2))
			.abs()
			.lt(epsilon),
	);
});

test("BigFloatComplexVector compatibility methods reject non-real complex entries", () => {
	const v = BigFloatComplexVector.of("1+i", 2);

	assert.throws(() => v.atan2(1), /not supported for non-real complex numbers/);
	assert.throws(() => v.gamma(), /not supported for non-real complex numbers/);
	assert.throws(() => v.max(), /not supported for vectors containing non-real complex numbers/);
	assert.throws(() => v.angleTo(BigFloatComplexVector.of(1, 0)), /not supported for vectors containing non-real complex numbers/);
});
