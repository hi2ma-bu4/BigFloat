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
