import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatStream, BigFloatVector } from "../../dist/BigFloat.js";

function toStrings(vector: BigFloatVector, precision?: number | bigint): string[] {
	return vector.toArray().map((value) => (precision === undefined ? value.toString() : value.toString(10, precision)));
}

function assertMapped(values: BigFloat[], vector: BigFloatVector, mapper: (value: BigFloat) => BigFloat, precision?: number | bigint): void {
	const actual = toStrings(vector, precision);
	const expected = values.map((value) => {
		const result = mapper(value.clone());
		return precision === undefined ? result.toString() : result.toString(10, precision);
	});
	assert.deepStrictEqual(actual, expected);
}

test("BigFloatVector factories create expected fixed-length values", () => {
	assert.deepStrictEqual(toStrings(BigFloatVector.empty()), []);
	assert.deepStrictEqual(toStrings(BigFloatVector.of(1, "2.5", 3n)), ["1", "2.5", "3"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.fill(3, "1.25", 10), 10), ["1.25", "1.25", "1.25"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.zeros(3)), ["0", "0", "0"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.ones(3)), ["1", "1", "1"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.basis(4, 2)), ["0", "0", "1", "0"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.linspace(0, 1, 5, 20), 20), ["0", "0.25", "0.5", "0.75", "1"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.fromStream(BigFloatStream.of(1, 2, 3))), ["1", "2", "3"]);

	const random = BigFloatVector.random(8, { min: 5, max: 6, precision: 20 });
	assert.equal(random.length, 8);
	assert.ok(random.every((value) => value.gte(5) && value.lt(6)));

	assert.throws(() => BigFloatVector.fill(Number.POSITIVE_INFINITY, 0), /finite/);
	assert.throws(() => BigFloatVector.basis(3, 3), /range/);
	assert.throws(() => BigFloatVector.random(1, { min: 3, max: 2 }), /max >= min/);
});

test("BigFloatVector accessors and collection helpers preserve vector ownership", () => {
	const source = [new BigFloat("1.2345", 4), new BigFloat("2.5000", 4)];
	const vector = BigFloatVector.from(source);

	source[0].copyFrom(new BigFloat("9.9999", 4));
	assert.deepStrictEqual(toStrings(vector, 4), ["1.2345", "2.5"]);

	const first = vector.at(0);
	assert.ok(first);
	first.changePrecision(2);
	assert.strictEqual(vector.at(0)?.toString(10, 4), "1.2345");

	const array = vector.toArray();
	array[1].copyFrom(new BigFloat("8.8888", 4));
	assert.strictEqual(vector.at(1)?.toString(10, 4), "2.5");

	const iterated = Array.from(vector).map((value) => value.toString(10, 4));
	assert.deepStrictEqual(iterated, ["1.2345", "2.5"]);

	const mapped = vector.map((value) => value.add(1));
	const zipped = vector.zipMap([10, 20], (left, right) => left.add(right));
	const concatenated = vector.concat([3, 4]);
	const sliced = concatenated.slice(1, 3);
	const reversed = concatenated.reverse();
	const streamed = vector.toStream().add(1).toArray().map((value) => value.toString(10, 4));

	assert.deepStrictEqual(toStrings(mapped, 4), ["2.2345", "3.5"]);
	assert.deepStrictEqual(toStrings(zipped, 4), ["11.2345", "22.5"]);
	assert.deepStrictEqual(toStrings(concatenated, 4), ["1.2345", "2.5", "3", "4"]);
	assert.deepStrictEqual(toStrings(sliced, 4), ["2.5", "3"]);
	assert.deepStrictEqual(toStrings(reversed, 4), ["4", "3", "2.5", "1.2345"]);
	assert.deepStrictEqual(streamed, ["2.2345", "3.5"]);

	assert.ok(Math.abs(vector.reduce((acc, value) => acc + value.toNumber(), 0) - 3.7345) < 1e-12);
	assert.equal(vector.some((value) => value.gt(2)), true);
	assert.equal(vector.every((value) => value.gt(0)), true);
	assert.equal(vector.dimension(), 2);
	assert.equal(vector.isEmpty(), false);
});

test("BigFloatVector vector algebra methods work with scalars and vectors", () => {
	const a = BigFloatVector.of(1, 2, 3);
	const b = BigFloatVector.of(4, 5, 6);

	assert.deepStrictEqual(toStrings(a.add(1)), ["2", "3", "4"]);
	assert.deepStrictEqual(toStrings(a.add(b)), ["5", "7", "9"]);
	assert.deepStrictEqual(toStrings(b.sub(a)), ["3", "3", "3"]);
	assert.deepStrictEqual(toStrings(a.mul(2)), ["2", "4", "6"]);
	assert.deepStrictEqual(toStrings(b.div(2), 20), ["2", "2.5", "3"]);
	assert.deepStrictEqual(toStrings(b.mod(4)), ["0", "1", "2"]);
	assert.deepStrictEqual(toStrings(a.hadamard(b)), ["4", "10", "18"]);
	assert.deepStrictEqual(toStrings(a.pow(2)), ["1", "4", "9"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.of(4, 9).sqrt()), ["2", "3"]);

	assert.equal(a.dot(b).toString(), "32");
	assert.equal(a.squaredNorm().toString(), "14");
	assert.equal(BigFloatVector.of(1, 2, 3).distanceTo([4, 6, 3]).toString(), "5");
	assert.deepStrictEqual(toStrings(BigFloatVector.of(3, 4).normalize(), 20), ["0.6", "0.8"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.of(3, 4).projectOnto([2, 0]), 20), ["3", "0"]);
	assert.deepStrictEqual(toStrings(BigFloatVector.of(1, 0, 0).cross([0, 1, 0])), ["0", "0", "1"]);

	const angle = BigFloatVector.from([new BigFloat(1, 40), new BigFloat(0, 40)]).angleTo([new BigFloat(0, 40), new BigFloat(1, 40)]);
	const diff = angle.sub(BigFloat.pi(40).div(2)).abs();
	assert.ok(diff.lt(new BigFloat("0.00000000000000000001", 40)));

	assert.equal(BigFloatVector.of(1, 2, 3).equals([1, 2, 3]), true);
	assert.equal(BigFloatVector.of(1, 2, 3).equals([1, 2, 4]), false);
	assert.throws(() => BigFloatVector.of(1, 2).add([1, 2, 3]), /dimensions/);
	assert.throws(() => BigFloatVector.of(0, 0).normalize(), /zero vector/);
	assert.throws(() => BigFloatVector.of(1, 2).cross([3, 4]), /3-dimensional/);
});

test("BigFloatVector element-wise BigFloat wrappers mirror direct BigFloat calls", () => {
	const precision = 30;
	const trigValues = [new BigFloat(0, precision), new BigFloat("0.5", precision)];
	const signedValues = [new BigFloat("-1.9", precision), new BigFloat("2.1", precision)];
	const gammaValues = [new BigFloat(1, precision), new BigFloat(5, precision)];

	assertMapped(trigValues, BigFloatVector.from(trigValues).sin(), (value) => value.sin(), precision);
	assertMapped(trigValues, BigFloatVector.from(trigValues).cos(), (value) => value.cos(), precision);
	assertMapped(trigValues, BigFloatVector.from(trigValues).atan2(1), (value) => value.atan2(1), precision);
	assertMapped(trigValues, BigFloatVector.from(trigValues).exp(), (value) => value.exp(), precision);
	assertMapped([new BigFloat(1, precision), new BigFloat(10, precision)], BigFloatVector.from([new BigFloat(1, precision), new BigFloat(10, precision)]).ln(), (value) => value.ln(), precision);
	assertMapped([new BigFloat(1, precision), new BigFloat(8, precision)], BigFloatVector.from([new BigFloat(1, precision), new BigFloat(8, precision)]).log2(), (value) => value.log2(), precision);
	assertMapped([new BigFloat(0, precision), new BigFloat(9, precision)], BigFloatVector.from([new BigFloat(0, precision), new BigFloat(9, precision)]).log1p(), (value) => value.log1p(), precision);
	assertMapped(signedValues, BigFloatVector.from(signedValues).sign(), (value) => value.sign(), precision);
	assertMapped(signedValues, BigFloatVector.from(signedValues).floor(), (value) => value.floor(), precision);
	assertMapped(signedValues, BigFloatVector.from(signedValues).ceil(), (value) => value.ceil(), precision);
	assertMapped(gammaValues, BigFloatVector.from(gammaValues).gamma(), (value) => value.gamma(), precision);
	assertMapped([new BigFloat(0, precision), new BigFloat(5, precision)], BigFloatVector.from([new BigFloat(0, precision), new BigFloat(5, precision)]).factorial(), (value) => value.factorial(), precision);

	assert.deepStrictEqual(
		toStrings(BigFloatVector.from([new BigFloat(5, precision), new BigFloat(10, precision)]).relativeDiff(10), precision),
		[new BigFloat(5, precision).relativeDiff(10).toString(10, precision), new BigFloat(10, precision).relativeDiff(10).toString(10, precision)],
	);
	assert.deepStrictEqual(
		toStrings(BigFloatVector.from([new BigFloat(5, precision), new BigFloat(10, precision)]).absoluteDiff([10, 12]), precision),
		[new BigFloat(5, precision).absoluteDiff(10).toString(10, precision), new BigFloat(10, precision).absoluteDiff(12).toString(10, precision)],
	);
});
