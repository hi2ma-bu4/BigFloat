import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatComplex, BigFloatComplexMatrix, BigFloatMatrix } from "../../dist/BigFloat.js";

test("BigFloatComplexMatrix operations", () => {
	BigFloat.config.allowComplexNumbers = true;
	const m1 = BigFloatComplexMatrix.from([
		["1+2i", "3+4i"],
		["5+6i", "7+8i"],
	]);
	const m2 = BigFloatComplexMatrix.from([
		["1", "2"],
		["3", "4"],
	]);

	const sum = m1.add(m2);
	assert.ok(sum instanceof BigFloatComplexMatrix);
	assert.strictEqual(sum.at(0, 0)?.toString(), "2 + 2i");
	assert.strictEqual(sum.at(1, 1)?.toString(), "11 + 8i");

	const promoted = BigFloatMatrix.from([
		[1, 2],
		[3, 4],
	]).add(new BigFloatComplex(0, 1));
	assert.ok(promoted instanceof BigFloatComplexMatrix);
	assert.strictEqual(promoted.at(0, 0)?.toString(), "1 + i");
});

test("BigFloatComplexMatrix matmul", () => {
	const m1 = BigFloatComplexMatrix.from([
		["i", "0"],
		["0", "i"],
	]);
	const m2 = BigFloatComplexMatrix.from([
		["i", "0"],
		["0", "i"],
	]);
	const res = m1.matmul(m2);
	assert.strictEqual(res.at(0, 0)?.toString(), "-1");
	assert.strictEqual(res.at(1, 1)?.toString(), "-1");
});

test("BigFloatComplexMatrix determinant and inverse", () => {
	const m = BigFloatComplexMatrix.from([
		["1+i", "1-i"],
		["1-i", "1+i"],
	]);
	const det = m.determinant();
	// (1+i)^2 - (1-i)^2 = (1+2i-1) - (1-2i-1) = 2i - (-2i) = 4i
	assert.strictEqual(det.toString(), "4i");

	const inv = m.inverse();
	const id = m.matmul(inv);
	assert.ok(id.at(0, 0)?.real.eq(1));
	assert.ok(id.at(0, 0)?.imag.isZero());
	assert.ok(id.at(1, 1)?.real.eq(1));
	assert.ok(id.at(0, 1)?.isZero());
});
