import assert from "node:assert/strict";
import test from "node:test";
import { BigFloat, BigFloatMatrix, BigFloatVector } from "../../dist/BigFloat.js";

function toStrings(matrix: BigFloatMatrix, precision?: number | bigint): string[][] {
	return matrix.toArray().map((row) => row.map((value) => (precision === undefined ? value.toString() : value.toString(10, precision))));
}

function assertMapped(values: BigFloat[][], matrix: BigFloatMatrix, mapper: (value: BigFloat) => BigFloat, precision?: number | bigint): void {
	const actual = toStrings(matrix, precision);
	const expected = values.map((row) =>
		row.map((value) => {
			const result = mapper(value.clone());
			return precision === undefined ? result.toString() : result.toString(10, precision);
		}),
	);
	assert.deepStrictEqual(actual, expected);
}

test("BigFloatMatrix factories create expected rectangular values", () => {
	assert.deepStrictEqual(toStrings(BigFloatMatrix.empty()), []);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.of([1, 2], [3, 4])), [["1", "2"], ["3", "4"]]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.fill(2, 3, "1.25", 10), 10), [["1.25", "1.25", "1.25"], ["1.25", "1.25", "1.25"]]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.zeros(2, 2)), [["0", "0"], ["0", "0"]]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.ones(2, 2)), [["1", "1"], ["1", "1"]]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.identity(3)), [["1", "0", "0"], ["0", "1", "0"], ["0", "0", "1"]]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.diagonal([1, 2, 3])), [["1", "0", "0"], ["0", "2", "0"], ["0", "0", "3"]]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.fromColumns([[1, 3], [2, 4]])), [["1", "2"], ["3", "4"]]);

	const random = BigFloatMatrix.random(2, 3, { min: 5, max: 6, precision: 20 });
	assert.deepStrictEqual(random.shape(), [2, 3]);
	assert.ok(random.every((value) => value.gte(5) && value.lt(6)));

	assert.throws(() => BigFloatMatrix.from([[1], [2, 3]]), /same length/);
	assert.throws(() => BigFloatMatrix.random(1, 1, { min: 3, max: 2 }), /max >= min/);
});

test("BigFloatMatrix accessors and collection helpers preserve matrix ownership", () => {
	const source = [
		[new BigFloat("1.2345", 4), new BigFloat("2.5000", 4)],
		[new BigFloat("3.0000", 4), new BigFloat("4.7500", 4)],
	];
	const matrix = BigFloatMatrix.from(source);

	source[0][0].copyFrom(new BigFloat("9.9999", 4));
	assert.deepStrictEqual(toStrings(matrix, 4), [["1.2345", "2.5"], ["3", "4.75"]]);

	const cell = matrix.at(0, 0);
	assert.ok(cell);
	cell.changePrecision(2);
	assert.strictEqual(matrix.at(0, 0)?.toString(10, 4), "1.2345");

	const row = matrix.row(0);
	assert.ok(row);
	row.at(0)?.copyFrom(new BigFloat("8.8888", 4));
	assert.strictEqual(matrix.at(0, 0)?.toString(10, 4), "1.2345");

	const column = matrix.column(1);
	assert.ok(column);
	column.at(0)?.copyFrom(new BigFloat("7.7777", 4));
	assert.strictEqual(matrix.at(0, 1)?.toString(10, 4), "2.5");

	const array = matrix.toArray();
	array[1][1].copyFrom(new BigFloat("6.6666", 4));
	assert.strictEqual(matrix.at(1, 1)?.toString(10, 4), "4.75");

	const iterated = Array.from(matrix).map((vector) => vector.toArray().map((value) => value.toString(10, 4)));
	assert.deepStrictEqual(iterated, [["1.2345", "2.5"], ["3", "4.75"]]);

	const mapped = matrix.map((value) => value.add(1));
	const zipped = matrix.zipMap([[10, 20], [30, 40]], (left, right) => left.add(right));
	const rowConcat = matrix.concatRows([[5, 6]]);
	const columnConcat = matrix.concatColumns([[5], [6]]);
	const rowSlice = rowConcat.sliceRows(1);
	const columnSlice = columnConcat.sliceColumns(1);
	const transposed = matrix.transpose();

	assert.deepStrictEqual(toStrings(mapped, 4), [["2.2345", "3.5"], ["4", "5.75"]]);
	assert.deepStrictEqual(toStrings(zipped, 4), [["11.2345", "22.5"], ["33", "44.75"]]);
	assert.deepStrictEqual(toStrings(rowConcat, 4), [["1.2345", "2.5"], ["3", "4.75"], ["5", "6"]]);
	assert.deepStrictEqual(toStrings(columnConcat, 4), [["1.2345", "2.5", "5"], ["3", "4.75", "6"]]);
	assert.deepStrictEqual(toStrings(rowSlice, 4), [["3", "4.75"], ["5", "6"]]);
	assert.deepStrictEqual(toStrings(columnSlice, 4), [["2.5", "5"], ["4.75", "6"]]);
	assert.deepStrictEqual(toStrings(transposed, 4), [["1.2345", "3"], ["2.5", "4.75"]]);
	assert.deepStrictEqual(matrix.diagonalVector().toArray().map((value) => value.toString(10, 4)), ["1.2345", "4.75"]);
	assert.deepStrictEqual(matrix.flatten().toArray().map((value) => value.toString(10, 4)), ["1.2345", "2.5", "3", "4.75"]);

	assert.ok(Math.abs(matrix.reduce((acc, value) => acc + value.toNumber(), 0) - 11.4845) < 1e-12);
	assert.equal(matrix.some((value) => value.gt(4)), true);
	assert.equal(matrix.every((value) => value.gt(0)), true);
});

test("BigFloatMatrix algebra methods work for scalar, matrix, and vector operations", () => {
	const a = BigFloatMatrix.of([1, 2], [3, 4]);
	const b = BigFloatMatrix.of([2, 0], [1, 2]);

	assert.deepStrictEqual(toStrings(a.add(1)), [["2", "3"], ["4", "5"]]);
	assert.deepStrictEqual(toStrings(a.add(b)), [["3", "2"], ["4", "6"]]);
	assert.deepStrictEqual(toStrings(a.sub(b)), [["-1", "2"], ["2", "2"]]);
	assert.deepStrictEqual(toStrings(a.mul(2)), [["2", "4"], ["6", "8"]]);
	assert.deepStrictEqual(toStrings(a.div(2), 20), [["0.5", "1"], ["1.5", "2"]]);
	assert.deepStrictEqual(toStrings(a.mod(2)), [["1", "0"], ["1", "0"]]);
	assert.deepStrictEqual(toStrings(a.hadamard(b)), [["2", "0"], ["3", "8"]]);
	assert.deepStrictEqual(toStrings(a.pow(2)), [["1", "4"], ["9", "16"]]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.of([4, 9]).sqrt()), [["2", "3"]]);

	assert.deepStrictEqual(toStrings(a.matmul(b)), [["4", "4"], ["10", "8"]]);
	assert.deepStrictEqual(a.mulVector([1, 2]).toArray().map((value) => value.toString()), ["5", "11"]);
	assert.equal(a.trace().toString(), "5");
	assert.ok(a.determinant().sub(-2).abs().lt(new BigFloat("0.000000000000000001", 20)));
	assert.equal(BigFloatMatrix.of([1, 2], [2, 4]).rank(), 1);
	assert.equal(BigFloatMatrix.of([3, 4]).frobeniusNorm().toString(), "5");
	assert.deepStrictEqual(a.rowSums().toArray().map((value) => value.toString()), ["3", "7"]);
	assert.deepStrictEqual(a.columnSums().toArray().map((value) => value.toString()), ["4", "6"]);

	const inverseBase = BigFloatMatrix.of([4, 7], [2, 6]);
	assert.deepStrictEqual(toStrings(inverseBase.inverse(), 20), [["0.6", "-0.7"], ["-0.2", "0.4"]]);
	assert.deepStrictEqual(toStrings(inverseBase.solveMatrix(BigFloatMatrix.identity(2)), 20), [["0.6", "-0.7"], ["-0.2", "0.4"]]);
	assert.deepStrictEqual(inverseBase.solveVector([1, 0]).toArray().map((value) => value.toString(10, 20)), ["0.6", "-0.2"]);
	assert.deepStrictEqual(toStrings(BigFloatMatrix.of([1, 1], [1, 0]).matrixPow(5)), [["8", "5"], ["5", "3"]]);

	assert.equal(a.equals([[1, 2], [3, 4]]), true);
	assert.equal(a.equals([[1, 2], [4, 3]]), false);
	assert.throws(() => a.add([[1, 2, 3]]), /shapes/);
	assert.throws(() => a.matmul([[1, 2, 3]]), /Inner matrix dimensions/);
	assert.throws(() => BigFloatMatrix.of([1, 2, 3]).trace(), /square/);
	assert.throws(() => BigFloatMatrix.of([1, 2], [2, 4]).inverse(), /singular/);
});

test("BigFloatMatrix element-wise BigFloat wrappers mirror direct BigFloat calls", () => {
	const precision = 30;
	const values = [
		[new BigFloat(0, precision), new BigFloat("0.5", precision)],
		[new BigFloat("-1.9", precision), new BigFloat("2.1", precision)],
	];
	const gammaValues = [
		[new BigFloat(1, precision), new BigFloat(5, precision)],
		[new BigFloat(0, precision), new BigFloat(5, precision)],
	];

	assertMapped(values, BigFloatMatrix.from(values).sin(), (value) => value.sin(), precision);
	assertMapped(values, BigFloatMatrix.from(values).cos(), (value) => value.cos(), precision);
	assertMapped(values, BigFloatMatrix.from(values).exp(), (value) => value.exp(), precision);
	assertMapped(
		[
			[new BigFloat(1, precision), new BigFloat(10, precision)],
			[new BigFloat(0, precision), new BigFloat(9, precision)],
		],
		BigFloatMatrix.from([
			[new BigFloat(1, precision), new BigFloat(10, precision)],
			[new BigFloat(0, precision), new BigFloat(9, precision)],
		]).log1p(),
		(value) => value.log1p(),
		precision,
	);
	assertMapped(values, BigFloatMatrix.from(values).sign(), (value) => value.sign(), precision);
	assertMapped(values, BigFloatMatrix.from(values).floor(), (value) => value.floor(), precision);
	assertMapped(values, BigFloatMatrix.from(values).ceil(), (value) => value.ceil(), precision);
	assertMapped([gammaValues[0]], BigFloatMatrix.from([gammaValues[0]]).gamma(), (value) => value.gamma(), precision);
	assertMapped([gammaValues[1]], BigFloatMatrix.from([gammaValues[1]]).factorial(), (value) => value.factorial(), precision);

	assert.deepStrictEqual(
		toStrings(BigFloatMatrix.from([[new BigFloat(5, precision), new BigFloat(10, precision)]]).relativeDiff(10), precision),
		[[new BigFloat(5, precision).relativeDiff(10).toString(10, precision), new BigFloat(10, precision).relativeDiff(10).toString(10, precision)]],
	);
	assert.deepStrictEqual(
		toStrings(BigFloatMatrix.from([[new BigFloat(5, precision), new BigFloat(10, precision)]]).absoluteDiff([[10, 12]]), precision),
		[[new BigFloat(5, precision).absoluteDiff(10).toString(10, precision), new BigFloat(10, precision).absoluteDiff(12).toString(10, precision)]],
	);
	assert.deepStrictEqual(
		toStrings(BigFloatMatrix.from([[new BigFloat(0, precision), new BigFloat("0.5", precision)]]).atan2(1), precision),
		[[new BigFloat(0, precision).atan2(1).toString(10, precision), new BigFloat("0.5", precision).atan2(1).toString(10, precision)]],
	);
});
