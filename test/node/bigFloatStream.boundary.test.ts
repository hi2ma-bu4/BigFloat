import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatStream, type PrecisionValue } from "../../dist/BigFloat.js";

function toStrings(stream: BigFloatStream, precision?: PrecisionValue): string[] {
	return stream.toArray().map((value) => (precision === undefined ? value.toString() : value.toString(10, precision)));
}

function assertMapped(values: BigFloat[], stream: BigFloatStream, mapper: (value: BigFloat) => BigFloat, precision?: PrecisionValue): void {
	const actual = toStrings(stream, precision);
	const expected = values.map((value) => {
		const result = mapper(value.clone());
		return precision === undefined ? result.toString() : result.toString(10, precision);
	});
	assert.deepStrictEqual(actual, expected);
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
	assert.throws(
		() => BigFloatStream.range(0, 1, 0).toArray(),
		(error) => error instanceof RangeError && /Step cannot be zero/.test(error.message),
	);
	assert.throws(() => BigFloatStream.random(1, { min: 2, max: 1 }).toArray(), /max >= min/);
});

test("BigFloatStream sequence factories preserve high-precision endpoints and exact cases", () => {
	assert.deepStrictEqual(toStrings(BigFloatStream.arithmetic("1.000000000000000001", "0.000000000000000001", 3, 18), 18), ["1.000000000000000001", "1.000000000000000002", "1.000000000000000003"]);
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
	assert.deepStrictEqual(
		stream.collect().map((value) => value.toString()),
		["1", "2", "3", "4"],
	);
	assert.equal(
		stream.reduce((sum, value) => sum + value.toNumber(), 0),
		10,
	);
	assert.equal(stream.count(), 4);
	assert.equal(BigFloatStream.empty().isEmpty(), true);
	assert.equal(
		stream.some((value) => value.eq(3)),
		true,
	);
	assert.equal(
		stream.every((value) => value.gt(0)),
		true,
	);
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

test("BigFloatStream mirrors extended BigFloat transform methods", () => {
	const precision = 30;
	const diffValues = [new BigFloat(5, precision), new BigFloat(10, precision)];
	assertMapped(diffValues, BigFloatStream.from(diffValues).relativeDiff(10), (value) => value.relativeDiff(10), precision);
	assertMapped(diffValues, BigFloatStream.from(diffValues).absoluteDiff(10), (value) => value.absoluteDiff(10), precision);
	assertMapped(diffValues, BigFloatStream.from(diffValues).percentDiff(10), (value) => value.percentDiff(10), precision);

	const signValues = [new BigFloat(-3, precision), new BigFloat(0, precision), new BigFloat(5, precision)];
	assertMapped(signValues, BigFloatStream.from(signValues).sign(), (value) => value.sign(), precision);

	const roundingValues = [new BigFloat("1.9", precision), new BigFloat("-1.1", precision)];
	assertMapped(roundingValues, BigFloatStream.from(roundingValues).floor(), (value) => value.floor(), precision);
	assertMapped(roundingValues, BigFloatStream.from(roundingValues).ceil(), (value) => value.ceil(), precision);
	assertMapped(roundingValues, BigFloatStream.from(roundingValues).round(), (value) => value.round(), precision);
	assertMapped(roundingValues, BigFloatStream.from(roundingValues).trunc(), (value) => value.trunc(), precision);
	assertMapped(roundingValues, BigFloatStream.from(roundingValues).fround(), (value) => value.fround(), precision);

	const clzValues = [new BigFloat(0, precision), new BigFloat(1, precision), new BigFloat(16, precision)];
	assertMapped(clzValues, BigFloatStream.from(clzValues).clz32(), (value) => value.clz32(), precision);

	const trigValues = [new BigFloat(0, precision), new BigFloat("0.5", precision)];
	assertMapped(trigValues, BigFloatStream.from(trigValues).sin(), (value) => value.sin(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).cos(), (value) => value.cos(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).tan(), (value) => value.tan(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).asin(), (value) => value.asin(), precision);
	assertMapped([new BigFloat(1, precision), new BigFloat("0.5", precision)], BigFloatStream.from([new BigFloat(1, precision), new BigFloat("0.5", precision)]).acos(), (value) => value.acos(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).atan(), (value) => value.atan(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).atan2(1), (value) => value.atan2(1), precision);

	assertMapped(trigValues, BigFloatStream.from(trigValues).sinh(), (value) => value.sinh(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).cosh(), (value) => value.cosh(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).tanh(), (value) => value.tanh(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).asinh(), (value) => value.asinh(), precision);
	assertMapped([new BigFloat(1, precision), new BigFloat(2, precision)], BigFloatStream.from([new BigFloat(1, precision), new BigFloat(2, precision)]).acosh(), (value) => value.acosh(), precision);
	assertMapped(trigValues, BigFloatStream.from(trigValues).atanh(), (value) => value.atanh(), precision);

	const expValues = [new BigFloat(0, precision), new BigFloat(3, precision)];
	assertMapped(expValues, BigFloatStream.from(expValues).exp(), (value) => value.exp(), precision);
	assertMapped(expValues, BigFloatStream.from(expValues).exp2(), (value) => value.exp2(), precision);
	assertMapped(expValues, BigFloatStream.from(expValues).expm1(), (value) => value.expm1(), precision);

	const logValues = [new BigFloat(1, precision), new BigFloat(10, precision)];
	assertMapped(logValues, BigFloatStream.from(logValues).ln(), (value) => value.ln(), precision);
	assertMapped(logValues, BigFloatStream.from(logValues).log(10), (value) => value.log(10), precision);
	assertMapped([new BigFloat(1, precision), new BigFloat(8, precision)], BigFloatStream.from([new BigFloat(1, precision), new BigFloat(8, precision)]).log2(), (value) => value.log2(), precision);
	assertMapped([new BigFloat(1, precision), new BigFloat(100, precision)], BigFloatStream.from([new BigFloat(1, precision), new BigFloat(100, precision)]).log10(), (value) => value.log10(), precision);
	assertMapped([new BigFloat(0, precision), new BigFloat(9, precision)], BigFloatStream.from([new BigFloat(0, precision), new BigFloat(9, precision)]).log1p(), (value) => value.log1p(), precision);

	const specialValues = [new BigFloat(1, precision), new BigFloat(5, precision)];
	assertMapped(specialValues, BigFloatStream.from(specialValues).gamma(), (value) => value.gamma(), precision);
	assertMapped([new BigFloat(2, precision), new BigFloat(4, precision)], BigFloatStream.from([new BigFloat(2, precision), new BigFloat(4, precision)]).zeta(), (value) => value.zeta(), precision);
	assertMapped([new BigFloat(0, precision), new BigFloat(5, precision)], BigFloatStream.from([new BigFloat(0, precision), new BigFloat(5, precision)]).factorial(), (value) => value.factorial(), precision);
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
	assert.throws(
		() => BigFloatStream.empty().max(),
		(error) => error instanceof TypeError && /No arguments/.test(error.message),
	);
	assert.throws(
		() => BigFloatStream.empty().min(),
		(error) => error instanceof TypeError && /No arguments/.test(error.message),
	);
});
