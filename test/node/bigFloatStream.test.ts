import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatStream } from "../../dist/BigFloat.js";

function toDecimalList(stream: BigFloatStream): string[] {
	return stream.toArray().map((value) => value.toString());
}

test("BigFloatStream is reusable after terminal operations", () => {
	const stream = BigFloatStream.of(1, 2, 3).mul(2);

	assert.deepStrictEqual(toDecimalList(stream), ["2", "4", "6"]);
	assert.deepStrictEqual(toDecimalList(stream), ["2", "4", "6"]);
});

test("BigFloatStream clone allows branching", () => {
	const base = BigFloatStream.of(1, 2, 3);
	const branch = base.clone().mul(2);
	const shifted = base.add(1);

	assert.deepStrictEqual(toDecimalList(base), ["1", "2", "3"]);
	assert.deepStrictEqual(toDecimalList(shifted), ["2", "3", "4"]);
	assert.deepStrictEqual(toDecimalList(branch), ["2", "4", "6"]);
});

test("BigFloatStream intermediate operations do not mutate the source", () => {
	const stream = BigFloatStream.range(0, 1001, 1, 1000);
	const first = stream.add(10).sum();
	const second = stream.add(10).sum();

	assert.strictEqual(first.toString(), second.toString());
	assert.strictEqual(stream.sum().toString(), "500500");
});

test("BigFloatStream changePrecision does not mutate source values", () => {
	const source = [new BigFloat("1.2345", 4)];
	const changed = BigFloatStream.from(source).changePrecision(2).first();

	assert.ok(changed);
	assert.strictEqual(source[0]._precision, 4n);
	assert.strictEqual(changed?._precision, 2n);
	assert.strictEqual(source[0].toString(10, 4), "1.2345");
	assert.strictEqual(changed?.toString(10, 2), "1.23");
});

test("BigFloatStream usability helpers work together", () => {
	const stream = BigFloatStream.range(1, 6).take(3).add(1);

	assert.deepStrictEqual(toDecimalList(stream), ["2", "3", "4"]);
	assert.strictEqual(stream.first()?.toString(), "2");
	assert.strictEqual(stream.at(1)?.toString(), "3");
	assert.strictEqual(stream.find((value) => value.eq(4))?.toString(), "4");
});

test("BigFloatStream flatMap and distinct compose correctly", () => {
	const stream = BigFloatStream.of(1, 2, 3)
		.flatMap((value) => [value, value.add(1)])
		.distinct((value) => value.toString())
		.drop(1)
		.take(4);

	assert.deepStrictEqual(toDecimalList(stream), ["2", "3", "4"]);
	assert.deepStrictEqual(toDecimalList(stream), ["2", "3", "4"]);
});

test("BigFloatStream aggregations avoid exhausting the source", () => {
	const stream = BigFloatStream.of(1, 2, 3, 4);

	assert.strictEqual(stream.sum().toString(), "10");
	assert.strictEqual(stream.product().toString(), "24");
	assert.strictEqual(stream.average().toString(), "2.5");
	assert.strictEqual(stream.max().toString(), "4");
	assert.strictEqual(stream.min().toString(), "1");
});

test("BigFloatStream sequence factories generate expected values", () => {
	assert.deepStrictEqual(toDecimalList(BigFloatStream.arithmetic(1, 2, 4)), ["1", "3", "5", "7"]);
	assert.deepStrictEqual(toDecimalList(BigFloatStream.geometric(2, 3, 4)), ["2", "6", "18", "54"]);
	assert.deepStrictEqual(toDecimalList(BigFloatStream.linspace(0, 1, 5, 10)), ["0", "0.25", "0.5", "0.75", "1"]);
	assert.deepStrictEqual(toDecimalList(BigFloatStream.logspace(0, 3, 4, 10)), ["1", "10", "100", "1000"]);
	assert.deepStrictEqual(toDecimalList(BigFloatStream.repeat(7, 3)), ["7", "7", "7"]);
	assert.deepStrictEqual(toDecimalList(BigFloatStream.fibonacci(7)), ["0", "1", "1", "2", "3", "5", "8"]);
	assert.deepStrictEqual(toDecimalList(BigFloatStream.factorial(6)), ["1", "1", "2", "6", "24", "120"]);

	const harmonic = BigFloatStream.harmonic(4, 10).toArray().map((value) => value.toString(10, 10));
	assert.deepStrictEqual(harmonic.slice(0, 2), ["1", "0.5"]);
	assert.ok(harmonic[2].startsWith("0.3333333333"));
	assert.strictEqual(harmonic[3], "0.25");
});

test("BigFloatStream random respects bounds and count", () => {
	const values = BigFloatStream.random(16, { precision: 20, min: 5, max: 6 }).toArray();

	assert.strictEqual(values.length, 16);
	for (const value of values) {
		assert.ok(value.gte(5));
		assert.ok(value.lt(6));
	}

	assert.deepStrictEqual(toDecimalList(BigFloatStream.random(3, { min: 7, max: 7 })), ["7", "7", "7"]);
});
