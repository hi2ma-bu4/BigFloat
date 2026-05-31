import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatComplex, BigFloatComplexMatrix, BigFloatComplexVector, BigFloatMatrix, BigFloatVector } from "../../dist/BigFloat.js";

function getPublicInstanceMethodNames(ctor: { prototype: object }): string[] {
	return Object.getOwnPropertyNames(ctor.prototype)
		.filter((name) => {
			if (name === "constructor" || name.startsWith("_")) return false;
			const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, name);
			return typeof descriptor?.value === "function";
		})
		.sort();
}

test("BigFloatComplex exposes every public BigFloat instance method", () => {
	const realMethods = getPublicInstanceMethodNames(BigFloat);
	const complexMethods = new Set(getPublicInstanceMethodNames(BigFloatComplex));
	const missing = realMethods.filter((name) => !complexMethods.has(name));
	assert.deepStrictEqual(missing, []);
});

test("BigFloatComplexVector exposes every public BigFloatVector instance method", () => {
	const realMethods = getPublicInstanceMethodNames(BigFloatVector);
	const complexMethods = new Set(getPublicInstanceMethodNames(BigFloatComplexVector));
	const missing = realMethods.filter((name) => !complexMethods.has(name));
	assert.deepStrictEqual(missing, []);
});

test("BigFloatComplexMatrix exposes every public BigFloatMatrix instance method", () => {
	const realMethods = getPublicInstanceMethodNames(BigFloatMatrix);
	const complexMethods = new Set(getPublicInstanceMethodNames(BigFloatComplexMatrix));
	const missing = realMethods.filter((name) => !complexMethods.has(name));
	assert.deepStrictEqual(missing, []);
});
