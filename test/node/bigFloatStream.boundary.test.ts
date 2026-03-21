import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatStream } from "../../dist/BigFloat.js";

function toStrings(stream: BigFloatStream, precision?: number | bigint): string[] {
	return stream.toArray().map((value) => (precision === undefined ? value.toString() : value.toString(10, precision)));
}

test("BigFloatStream factories normalize counts, precision, and range boundaries", () => {
	assert.deepStrictEqual(toStrings(BigFloatStream.empty()), []);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(1, 2, 3)), ["1", "2", "3"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.from([new BigFloat("1.2345", 4), "2.5"], 2), 2), ["1.23", "2.5"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.repeat(7, 3.9)), ["7", "7", "7"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.range(5)), ["0", "1", "2", "3", "4"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.range(5, 0, -2)), ["5", "3", "1"]);
	assert.throws(() => BigFloatStream.arithmetic(0, 1, -1), /non-negative/);
	assert.throws(() => BigFloatStream.repeat(1, Number.POSITIVE_INFINITY), /finite/);
	assert.throws(() => BigFloatStream.range(0, 1, 0).toArray(), (error) => error instanceof RangeError && /Step cannot be zero/.test(error.message));
	assert.throws(() => BigFloatStream.random(1, { min: 2, max: 1 }).toArray(), /max >= min/);
});

test("BigFloatStream sequence factories preserve high-precision endpoints and exact cases", () => {
	assert.deepStrictEqual(toStrings(BigFloatStream.arithmetic("1.000000000000000001", "0.000000000000000001", 3, 18), 18), [
		"1.000000000000000001",
		"1.000000000000000002",
		"1.000000000000000003",
	]);
	assert.deepStrictEqual(toStrings(BigFloatStream.geometric("0.1", 10, 4, 20), 20), ["0.1", "1", "10", "100"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.linspace(0, 1, 5, 60), 60), ["0", "0.25", "0.5", "0.75", "1"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.linspace(2, 4, 1, 60), 60), ["2"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.logspace(0, 3, 4, 40), 40), ["1", "10", "100", "1000"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.logspace(2, 4, 1, 40), 40), ["100"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.harmonic(4, 30), 30), ["1", "0.5", "0.333333333333333333333333333333", "0.25"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.repeat("1.25", 3, 20), 20), ["1.25", "1.25", "1.25"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.fibonacci(7), 20), ["0", "1", "1", "2", "3", "5", "8"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.factorial(6), 20), ["1", "1", "2", "6", "24", "120"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.random(3, { min: 7, max: 7, precision: 40 }), 40), ["7", "7", "7"]);
});

test("BigFloatStream pipeline methods compose without exhausting reusable streams", () => {
	const seen: string[] = [];
	const result = BigFloatStream.of(3, 1, 2, 2)
		.map((value) => value.mul(2))
		.filter((value) => value.gte(4))
		.flatMap((value) => [value, value.div(2)])
		.distinct((value) => value.toString())
		.sorted((a, b) => a.compare(b))
		.peek((value) => seen.push(value.toString()))
		.tap(() => undefined)
		.skip(1)
		.drop(1)
		.limit(3)
		.take(2)
		.concat([99]);

	assert.deepStrictEqual(toStrings(result), ["4", "6", "99"]);
	assert.deepStrictEqual(seen, ["2", "3", "4", "6"]);
	assert.deepStrictEqual(toStrings(result), ["4", "6", "99"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(1, 2, 3).clone()), ["1", "2", "3"]);
});

test("BigFloatStream terminal helpers cover iteration, selection, and emptiness boundaries", () => {
	const stream = BigFloatStream.of(1, 2, 3, 4);
	const visited: string[] = [];

	stream.forEach((value) => visited.push(value.toString()));
	assert.deepStrictEqual(visited, ["1", "2", "3", "4"]);
	assert.deepStrictEqual(toStrings(stream), ["1", "2", "3", "4"]);
	assert.deepStrictEqual(stream.collect().map((value) => value.toString()), ["1", "2", "3", "4"]);
	assert.equal(stream.reduce((sum, value) => sum + value.toNumber(), 0), 10);
	assert.equal(stream.count(), 4);
	assert.equal(BigFloatStream.empty().isEmpty(), true);
	assert.equal(stream.some((value) => value.eq(3)), true);
	assert.equal(stream.every((value) => value.gt(0)), true);
	assert.equal(stream.find((value) => value.eq(2))?.toString(), "2");
	assert.equal(stream.findFirst()?.toString(), "1");
	assert.equal(stream.first()?.toString(), "1");
	assert.equal(stream.at(2)?.toString(), "3");
	assert.equal(stream.at(-1), undefined);
});

test("BigFloatStream numeric wrapper methods map across the stream without mutating the source", () => {
	const source = BigFloatStream.of("1.2345", "-2.25");

	assert.deepStrictEqual(toStrings(source.changePrecision(2), 2), ["1.23", "-2.25"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(1, 2).add(1)), ["2", "3"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(1, 2).sub(1)), ["0", "1"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(2, 3).mul(4)), ["8", "12"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(8, 9).div(2), 20), ["4", "4.5"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(5, 7).mod(2)), ["1", "1"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(1, -2).neg()), ["-1", "2"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(1, -2).abs()), ["1", "2"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(2, 4).reciprocal(), 20), ["0.5", "0.25"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(2, 3).pow(3)), ["8", "27"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(4, 9).sqrt()), ["2", "3"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(8, 27).cbrt()), ["2", "3"]);
	assert.deepStrictEqual(toStrings(BigFloatStream.of(16, 81).nthRoot(4)), ["2", "3"]);
	assert.deepStrictEqual(toStrings(source), ["1.2345", "-2.25"]);
});

test("BigFloatStream aggregate methods cover empty and populated boundary cases", () => {
	const stats = BigFloatStream.of(2, 4, 4, 4, 5, 5, 7, 9);

	assert.equal(stats.max().toString(), "9");
	assert.equal(stats.min().toString(), "2");
	assert.equal(stats.sum().toString(), "40");
	assert.equal(BigFloatStream.of(2, 3, 4).product().toString(), "24");
	assert.equal(stats.average().toString(), "5");
	assert.equal(stats.median().toString(), "4.5");
	assert.equal(stats.variance().toString(), "4");
	assert.equal(stats.stddev().toString(), "2");
	assert.equal(BigFloatStream.empty().sum().toString(), "0");
	assert.equal(BigFloatStream.empty().product().toString(), "1");
	assert.equal(BigFloatStream.empty().average().toString(), "0");
	assert.throws(() => BigFloatStream.empty().max(), (error) => error instanceof TypeError && /No arguments/.test(error.message));
	assert.throws(() => BigFloatStream.empty().min(), (error) => error instanceof TypeError && /No arguments/.test(error.message));
});
