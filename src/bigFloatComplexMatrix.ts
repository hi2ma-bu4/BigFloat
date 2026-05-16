import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import { BigFloatComplexVector } from "./bigFloatComplexVector";
import { BigFloatMatrix } from "./bigFloatMatrix";
import { BigFloatStream } from "./bigFloatStream";
import type { BigFloatValue, PrecisionValue } from "./types";

type BigFloatComplexMatrixRowSource = Iterable<BigFloatComplex | BigFloatValue>;
type BigFloatComplexMatrixSource = Iterable<BigFloatComplexMatrixRowSource>;
type BigFloatComplexMatrixOperand = BigFloatComplexMatrix | BigFloatMatrix | BigFloatComplexMatrixSource;
type BigFloatComplexMatrixRandomOptions = {
	min?: BigFloatComplex | BigFloatValue;
	max?: BigFloatComplex | BigFloatValue;
	precision?: PrecisionValue;
};

/**
 * BigFloatComplex を要素とする固定長行列クラス
 */
export class BigFloatComplexMatrix implements Iterable<BigFloatComplexVector> {
	/**
	 * 内部要素 (行ごとの配列)
	 */
	protected _values: BigFloatComplex[][];

	/**
	 * BigFloatComplexMatrix コンストラクタ
	 * @param rows - 行列要素の反復可能オブジェクト
	 * @param precision - 精度
	 */
	public constructor(rows: BigFloatComplexMatrixSource = [], precision?: PrecisionValue) {
		const rawRows = Array.from(rows, (row) => Array.from(row));
		BigFloatComplexMatrix._assertRectangularRaw(rawRows);
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(rawRows.flat(), precision);
		this._values = rawRows.map((row) => row.map((value) => BigFloatComplexMatrix._toComplex(value, resolvedPrecision)));
	}

	protected static _fromComplexGrid(values: BigFloatComplex[][]): BigFloatComplexMatrix {
		const matrix = Object.create(BigFloatComplexMatrix.prototype) as BigFloatComplexMatrix;
		matrix._values = values;
		return matrix;
	}

	protected static _toComplex(value: BigFloatComplex | BigFloatValue, precision?: bigint): BigFloatComplex {
		if (value instanceof BigFloatComplex) {
			return precision === undefined || value.precision === precision ? value.clone() : value.changePrecision(precision);
		}
		return new BigFloatComplex(value, 0, precision);
	}

	protected static _resolvePrecision(values: (BigFloatComplex | BigFloatValue)[], precision?: PrecisionValue): bigint {
		if (precision !== undefined) return BigInt(precision);
		let resolved = BigFloat.DEFAULT_PRECISION;
		for (const value of values) {
			const p = value instanceof BigFloatComplex ? value.precision : value instanceof BigFloat ? value._precision : 0n;
			if (p > resolved) resolved = p;
		}
		return resolved;
	}

	protected static _assertRectangularRaw(rows: (BigFloatComplex | BigFloatValue)[][]): void {
		if (rows.length === 0) return;
		const columnCount = rows[0].length;
		for (const row of rows) {
			if (row.length !== columnCount) throw new RangeError("Matrix rows must have the same length");
		}
	}

	protected static _assertSameShape(left: BigFloatComplexMatrix | BigFloatMatrix, right: BigFloatComplexMatrix | BigFloatMatrix): void {
		if (left.rowCount !== right.rowCount || left.columnCount !== right.columnCount) {
			throw new RangeError("Matrix shapes must match");
		}
	}

	protected static _coerceMatrix(value: BigFloatComplexMatrixOperand, referenceValues: (BigFloatComplex | BigFloatValue)[] = []): BigFloatComplexMatrix {
		if (value instanceof BigFloatComplexMatrix) return value;
		if (value instanceof BigFloatMatrix) {
			return BigFloatComplexMatrix._fromComplexGrid(value.toArray().map((row) => row.map((v) => new BigFloatComplex(v))));
		}
		const rows = Array.from(value, (row) => Array.from(row));
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision([...referenceValues, ...rows.flat()]);
		return new BigFloatComplexMatrix(rows, resolvedPrecision);
	}

	protected _flattenValues(): BigFloatComplex[] {
		return this._values.flat();
	}

	protected _mapValues(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatComplex | BigFloatValue): this {
		const values = this._values.map((currentRow, rowIndex) =>
			currentRow.map((value, columnIndex) => {
				const mapped = fn(value.clone(), rowIndex, columnIndex);
				return BigFloatComplexMatrix._toComplex(mapped, value.precision);
			}),
		);
		return BigFloatComplexMatrix._fromComplexGrid(values) as this;
	}

	protected _mapWithOperand(other: BigFloatComplexMatrixOperand | BigFloatComplex | BigFloatValue, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number) => BigFloatComplex | BigFloatValue): this {
		if (other instanceof BigFloatComplexMatrix || other instanceof BigFloatMatrix || (typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat) && !(other instanceof BigFloatComplex))) {
			const matrix = BigFloatComplexMatrix._coerceMatrix(other as BigFloatComplexMatrixOperand, this._flattenValues());
			BigFloatComplexMatrix._assertSameShape(this, matrix);
			const values = this._values.map((currentRow, rowIndex) =>
				currentRow.map((value, columnIndex) => {
					const mapped = fn(value.clone(), matrix._values[rowIndex][columnIndex].clone(), rowIndex, columnIndex);
					return BigFloatComplexMatrix._toComplex(mapped, value.precision);
				}),
			);
			return BigFloatComplexMatrix._fromComplexGrid(values) as this;
		}

		const right = BigFloatComplexMatrix._toComplex(other as BigFloatComplex | BigFloatValue, this._values[0]?.[0]?.precision);
		return this._mapValues((value, row, column) => fn(value, right, row, column));
	}

	public static empty(): BigFloatComplexMatrix {
		return this._fromComplexGrid([]);
	}

	public static from(rows: BigFloatComplexMatrixSource, precision?: PrecisionValue): BigFloatComplexMatrix {
		return new BigFloatComplexMatrix(rows, precision);
	}

	public static fromRows(rows: BigFloatComplexMatrixSource, precision?: PrecisionValue): BigFloatComplexMatrix {
		return this.from(rows, precision);
	}

	public static fromColumns(columns: BigFloatComplexMatrixSource, precision?: PrecisionValue): BigFloatComplexMatrix {
		const rawColumns = Array.from(columns, (col) => Array.from(col));
		if (rawColumns.length === 0) return this.empty();
		const rowCount = rawColumns[0].length;
		const rows = Array.from({ length: rowCount }, (_, r) => rawColumns.map((col) => col[r]));
		return this.from(rows, precision);
	}

	public static of(...rows: (BigFloatComplex | BigFloatValue)[][]): BigFloatComplexMatrix {
		return this.from(rows);
	}

	public static fill(rowCount: number, columnCount: number, value: BigFloatComplex | BigFloatValue, precision?: PrecisionValue): BigFloatComplexMatrix {
		if (rowCount <= 0 || columnCount <= 0) return this.empty();
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision([value], precision);
		const base = this._toComplex(value, resolvedPrecision);
		return this._fromComplexGrid(Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => base.clone())));
	}

	public static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatComplexMatrix {
		return this.fill(rowCount, columnCount, 0, precision);
	}

	public static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatComplexMatrix {
		return this.fill(rowCount, columnCount, 1, precision);
	}

	public static diagonal(values: Iterable<BigFloatComplex | BigFloatValue>, precision?: PrecisionValue): BigFloatComplexMatrix {
		const entries = Array.from(values);
		const resolvedPrecision = this._resolvePrecision(entries, precision);
		return this._fromComplexGrid(entries.map((v, r) => entries.map((_, c) => (r === c ? this._toComplex(v, resolvedPrecision) : new BigFloatComplex(0, 0, resolvedPrecision)))));
	}

	public static random(rowCount: number, columnCount: number, options: BigFloatComplexMatrixRandomOptions = {}): BigFloatComplexMatrix {
		if (rowCount <= 0 || columnCount <= 0) return this.empty();
		const min = options.min ?? 0;
		const max = options.max ?? 1;
		const resolvedPrecision = this._resolvePrecision([min, max], options.precision);
		const minVal = this._toComplex(min, resolvedPrecision);
		const maxVal = this._toComplex(max, resolvedPrecision);
		const span = maxVal.sub(minVal);

		return this._fromComplexGrid(
			Array.from({ length: rowCount }, () =>
				Array.from({ length: columnCount }, () => {
					if (span.isReal()) {
						return minVal.add(span.real.mul(BigFloat.random(resolvedPrecision)));
					}
					const r = BigFloat.random(resolvedPrecision);
					const i = BigFloat.random(resolvedPrecision);
					return minVal.add(new BigFloatComplex(span.real.mul(r), span.imag.mul(i)));
				}),
			),
		);
	}

	public get rowCount(): number {
		return this._values.length;
	}

	public get columnCount(): number {
		return this.rowCount === 0 ? 0 : this._values[0].length;
	}

	public isSquare(): boolean {
		return this.rowCount === this.columnCount;
	}

	public isEmpty(): boolean {
		return this.rowCount === 0 || this.columnCount === 0;
	}

	public shape(): [number, number] {
		return [this.rowCount, this.columnCount];
	}

	public at(row: number, column: number): BigFloatComplex | undefined {
		if (row < 0 || column < 0 || row >= this.rowCount || column >= this.columnCount) return undefined;
		return this._values[row][column].clone();
	}

	public row(index: number): BigFloatComplexVector | undefined {
		if (index < 0 || index >= this.rowCount) return undefined;
		return BigFloatComplexVector.from(this._values[index].map((v) => v.clone()));
	}

	public column(index: number): BigFloatComplexVector | undefined {
		if (index < 0 || index >= this.columnCount) return undefined;
		return BigFloatComplexVector.from(this._values.map((row) => row[index].clone()));
	}

	public clone(): BigFloatComplexMatrix {
		return BigFloatComplexMatrix._fromComplexGrid(this._values.map((row) => row.map((v) => v.clone())));
	}

	public toArray(): BigFloatComplex[][] {
		return this._values.map((row) => row.map((v) => v.clone()));
	}

	public toVectors(): BigFloatComplexVector[] {
		return this._values.map((row) => BigFloatComplexVector.from(row.map((v) => v.clone())));
	}

	public [Symbol.iterator](): Iterator<BigFloatComplexVector, void, undefined> {
		return this.toVectors()[Symbol.iterator]();
	}

	public forEach(fn: (value: BigFloatComplex, row: number, column: number) => void): void {
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				fn(this._values[r][c].clone(), r, c);
			}
		}
	}

	public map(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatComplex | BigFloatValue): this {
		return this._mapValues(fn);
	}

	/**
	 * 要素を流すストリームへ変換する
	 */
	public toStream(): BigFloatStream {
		return BigFloatStream.from(this._flattenValues());
	}

	public add(other: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(other, (l, r) => l.add(r));
	}

	public sub(other: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(other, (l, r) => l.sub(r));
	}

	public hadamard(other: BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(other, (l, r) => l.mul(r));
	}

	public mul(scalar: BigFloatComplex | BigFloatValue): this {
		const s = BigFloatComplexMatrix._toComplex(scalar, this._values[0]?.[0]?.precision);
		return this._mapValues((v) => v.mul(s));
	}

	public div(scalar: BigFloatComplex | BigFloatValue): this {
		const s = BigFloatComplexMatrix._toComplex(scalar, this._values[0]?.[0]?.precision);
		return this._mapValues((v) => v.div(s));
	}

	public matmul(other: BigFloatComplexMatrixOperand): this {
		const matrix = BigFloatComplexMatrix._coerceMatrix(other, this._flattenValues());
		if (this.columnCount !== matrix.rowCount) throw new RangeError("Inner matrix dimensions must agree");
		if (this.rowCount === 0 || this.columnCount === 0 || matrix.columnCount === 0) return BigFloatComplexMatrix.empty() as this;
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision([...this._flattenValues(), ...matrix._flattenValues()]);

		const values = Array.from({ length: this.rowCount }, (_, row) =>
			Array.from({ length: matrix.columnCount }, (_, column) => {
				let total = new BigFloatComplex(0, 0, resolvedPrecision);
				for (let i = 0; i < this.columnCount; i++) {
					total = total.add(this._values[row][i].mul(matrix._values[i][column]));
				}
				return total;
			}),
		);
		return BigFloatComplexMatrix._fromComplexGrid(values) as this;
	}

	public transpose(): this {
		if (this.rowCount === 0) return BigFloatComplexMatrix.empty() as this;
		return BigFloatComplexMatrix._fromComplexGrid(Array.from({ length: this.columnCount }, (_, column) => this._values.map((row) => row[column].clone()))) as this;
	}

	public rowSums(): BigFloatComplexVector {
		return BigFloatComplexVector.from(this._values.map((row) => BigFloatComplexVector.from(row).sum()));
	}

	public columnSums(): BigFloatComplexVector {
		if (this.isEmpty()) return BigFloatComplexVector.empty();
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		return BigFloatComplexVector.from(Array.from({ length: this.columnCount }, (_, col) => this._values.reduce((acc, row) => acc.add(row[col]), new BigFloatComplex(0, 0, resolvedPrecision))));
	}

	public trace(): BigFloatComplex {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		let total = new BigFloatComplex(0, 0, resolvedPrecision);
		for (let i = 0; i < this.rowCount; i++) {
			total = total.add(this._values[i][i]);
		}
		return total;
	}

	public determinant(): BigFloatComplex {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const size = this.rowCount;
		if (size === 0) return new BigFloatComplex(1, 0, BigFloat.DEFAULT_PRECISION);
		const values = this.toArray();
		let sign = 1;
		let det = new BigFloatComplex(1, 0, BigFloatComplexMatrix._resolvePrecision(this._flattenValues()));

		for (let column = 0; column < size; column++) {
			let bestRow = -1;
			let bestValue: BigFloat | null = null;
			for (let row = column; row < size; row++) {
				const current = values[row][column].abs();
				if (current.isZero()) continue;
				if (bestValue === null || current.gt(bestValue)) {
					bestValue = current;
					bestRow = row;
				}
			}
			if (bestRow === -1) return new BigFloatComplex(0, 0, det.precision);
			if (bestRow !== column) {
				[values[column], values[bestRow]] = [values[bestRow], values[column]];
				sign *= -1;
			}
			const pivot = values[column][column].clone();
			det = det.mul(pivot);
			for (let row = column + 1; row < size; row++) {
				const factor = values[row][column].div(pivot);
				if (factor.isZero()) continue;
				for (let index = column; index < size; index++) {
					values[row][index] = values[row][index].sub(factor.mul(values[column][index]));
				}
			}
		}

		return sign < 0 ? det.neg() : det;
	}

	public inverse(): this {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const size = this.rowCount;
		const identity = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => new BigFloatComplex(row === col ? 1 : 0, 0, this._values[0]?.[0]?.precision)));
		const augmented = this._values.map((row, i) => [...row.map((v) => v.clone()), ...identity[i]]);

		const rowCount = size;
		const totalColumns = 2 * size;
		let pivotRow = 0;

		for (let column = 0; column < size && pivotRow < rowCount; column++) {
			let bestRow = -1;
			let bestValue: BigFloat | null = null;
			for (let candidate = pivotRow; candidate < rowCount; candidate++) {
				const current = augmented[candidate][column].abs();
				if (current.isZero()) continue;
				if (bestValue === null || current.gt(bestValue)) {
					bestValue = current;
					bestRow = candidate;
				}
			}
			if (bestRow === -1) throw new RangeError("Matrix is singular");
			if (bestRow !== pivotRow) {
				[augmented[pivotRow], augmented[bestRow]] = [augmented[bestRow], augmented[pivotRow]];
			}

			const pivot = augmented[pivotRow][column].clone();
			for (let index = column; index < totalColumns; index++) {
				augmented[pivotRow][index] = augmented[pivotRow][index].div(pivot);
			}

			for (let row = 0; row < rowCount; row++) {
				if (row === pivotRow) continue;
				const factor = augmented[row][column].clone();
				if (factor.isZero()) continue;
				for (let index = column; index < totalColumns; index++) {
					augmented[row][index] = augmented[row][index].sub(factor.mul(augmented[pivotRow][index]));
				}
			}
			pivotRow++;
		}

		return BigFloatComplexMatrix._fromComplexGrid(augmented.map((row) => row.slice(size))) as this;
	}

	public solveVector(rhs: BigFloatComplexVector | Iterable<BigFloatComplex | BigFloatValue>): BigFloatComplexVector {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const vector = BigFloatComplexVector.from(rhs as any);
		if (vector.length !== this.rowCount) throw new RangeError("Dimension mismatch");
		const solution = this.solveMatrix(BigFloatComplexMatrix.from(vector.toArray().map((v) => [v])));
		return solution.column(0) ?? BigFloatComplexVector.empty();
	}

	public solveMatrix(rhs: BigFloatComplexMatrixOperand): this {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const right = BigFloatComplexMatrix._coerceMatrix(rhs, this._flattenValues());
		if (right.rowCount !== this.rowCount) throw new RangeError("Dimension mismatch");
		const size = this.rowCount;
		const augmented = this._values.map((row, i) => [...row.map((v) => v.clone()), ...right._values[i].map((v) => v.clone())]);
		const { values, pivotColumns } = BigFloatComplexMatrix._reducedRowEchelon(augmented, size);
		if (pivotColumns.length !== size) throw new RangeError("Matrix is singular");
		return BigFloatComplexMatrix._fromComplexGrid(values.map((row) => row.slice(size))) as this;
	}

	protected static _reducedRowEchelon(values: BigFloatComplex[][], leftColumnCount = values[0]?.length ?? 0): { values: BigFloatComplex[][]; pivotColumns: number[] } {
		const rows = values.map((row) => row.map((v) => v.clone()));
		const pivotColumns: number[] = [];
		const rowCount = rows.length;
		if (rowCount === 0) return { values: rows, pivotColumns };
		const totalColumns = rows[0].length;
		let pivotRow = 0;

		for (let column = 0; column < leftColumnCount && pivotRow < rowCount; column++) {
			let bestRow = -1;
			let bestValue: BigFloat | null = null;
			for (let candidate = pivotRow; candidate < rowCount; candidate++) {
				const current = rows[candidate][column].abs();
				if (current.isZero()) continue;
				if (bestValue === null || current.gt(bestValue)) {
					bestValue = current;
					bestRow = candidate;
				}
			}
			if (bestRow === -1) continue;
			if (bestRow !== pivotRow) {
				[rows[pivotRow], rows[bestRow]] = [rows[bestRow], rows[pivotRow]];
			}

			const pivot = rows[pivotRow][column].clone();
			for (let index = column; index < totalColumns; index++) {
				rows[pivotRow][index] = rows[pivotRow][index].div(pivot);
			}

			for (let row = 0; row < rowCount; row++) {
				if (row === pivotRow) continue;
				const factor = rows[row][column].clone();
				if (factor.isZero()) continue;
				for (let index = column; index < totalColumns; index++) {
					rows[row][index] = rows[row][index].sub(factor.mul(rows[pivotRow][index]));
				}
			}

			pivotColumns.push(column);
			pivotRow++;
		}

		return { values: rows, pivotColumns };
	}

	public matrixPow(exponent: number): this {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		if (!Number.isInteger(exponent)) throw new RangeError("Exponent must be integer");
		if (exponent === 0) return BigFloatComplexMatrix.identity(this.rowCount, BigFloatComplexMatrix._resolvePrecision(this._flattenValues())) as this;
		if (exponent < 0) return this.inverse().matrixPow(-exponent);
		let result = BigFloatComplexMatrix.identity(this.rowCount, BigFloatComplexMatrix._resolvePrecision(this._flattenValues()));
		let base = this.clone();
		let p = exponent;
		while (p > 0) {
			if (p & 1) result = result.matmul(base);
			p >>= 1;
			if (p > 0) base = base.matmul(base);
		}
		return result as this;
	}

	public static identity(size: number, precision?: PrecisionValue): BigFloatComplexMatrix {
		const s = Math.trunc(size);
		const p = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return BigFloatComplexMatrix._fromComplexGrid(Array.from({ length: s }, (_, r) => Array.from({ length: s }, (_, c) => new BigFloatComplex(r === c ? 1 : 0, 0, p))));
	}

	public equals(other: BigFloatComplexMatrixOperand): boolean {
		const matrix = BigFloatComplexMatrix._coerceMatrix(other, this._flattenValues());
		if (this.rowCount !== matrix.rowCount || this.columnCount !== matrix.columnCount) return false;
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				if (!this._values[r][c].equals(matrix._values[r][c])) return false;
			}
		}
		return true;
	}

	public sum(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0, 0, BigFloat.DEFAULT_PRECISION);
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		return this._flattenValues().reduce((acc, v) => acc.add(v), new BigFloatComplex(0, 0, resolvedPrecision));
	}

	public product(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(1, 0, BigFloat.DEFAULT_PRECISION);
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		return this._flattenValues().reduce((acc, v) => acc.mul(v), new BigFloatComplex(1, 0, resolvedPrecision));
	}

	public average(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0, 0, BigFloat.DEFAULT_PRECISION);
		return this.sum().div(this.rowCount * this.columnCount);
	}

	public frobeniusNorm(): BigFloat {
		return this._flattenValues()
			.reduce((acc, v) => acc.add(v.absSquared()), new BigFloat(0, this._values[0]?.[0]?.precision))
			.sqrt();
	}

	public mulVector(vector: BigFloatComplexVector | Iterable<BigFloatComplex | BigFloatValue>): BigFloatComplexVector {
		const rhs = BigFloatComplexVector.from(vector as any);
		if (this.columnCount !== rhs.length) throw new RangeError("Inner matrix dimensions must agree");
		return BigFloatComplexVector.from(this._values.map((row) => BigFloatComplexVector.from(row).dot(rhs)));
	}

	public diagonalVector(): BigFloatComplexVector {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		return BigFloatComplexVector.from(this._values.map((row, index) => row[index].clone()));
	}

	public flatten(): BigFloatComplexVector {
		return BigFloatComplexVector.from(this._flattenValues().map((v) => v.clone()));
	}

	public zipMap(other: BigFloatComplexMatrixOperand, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number) => BigFloatComplex | BigFloatValue): this {
		return this._mapWithOperand(other, fn);
	}

	public reduce<U>(fn: (acc: U, value: BigFloatComplex, row: number, column: number) => U, initial: U): U {
		let acc = initial;
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				acc = fn(acc, this._values[r][c].clone(), r, c);
			}
		}
		return acc;
	}

	public some(fn: (value: BigFloatComplex, row: number, column: number) => boolean): boolean {
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				if (fn(this._values[r][c].clone(), r, c)) return true;
			}
		}
		return false;
	}

	public every(fn: (value: BigFloatComplex, row: number, column: number) => boolean): boolean {
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				if (!fn(this._values[r][c].clone(), r, c)) return false;
			}
		}
		return true;
	}

	public concatRows(...others: BigFloatComplexMatrixOperand[]): this {
		const values = this.toArray();
		for (const other of others) {
			const matrix = BigFloatComplexMatrix._coerceMatrix(other, this._flattenValues());
			if (this.columnCount !== 0 && matrix.columnCount !== this.columnCount) throw new RangeError("Column counts must match");
			values.push(...matrix.toArray());
		}
		return BigFloatComplexMatrix._fromComplexGrid(values) as this;
	}

	public concatColumns(...others: BigFloatComplexMatrixOperand[]): this {
		let result = this.clone();
		for (const other of others) {
			const matrix = BigFloatComplexMatrix._coerceMatrix(other, result._flattenValues());
			if (result.rowCount !== matrix.rowCount) throw new RangeError("Row counts must match");
			result = BigFloatComplexMatrix._fromComplexGrid(result._values.map((row, rowIndex) => [...row.map((v) => v.clone()), ...matrix._values[rowIndex].map((v) => v.clone())]));
		}
		return result as this;
	}

	public sliceRows(start?: number, end?: number): this {
		return BigFloatComplexMatrix._fromComplexGrid(this._values.slice(start, end).map((row) => row.map((v) => v.clone()))) as this;
	}

	public sliceColumns(start?: number, end?: number): this {
		return BigFloatComplexMatrix._fromComplexGrid(this._values.map((row) => row.slice(start, end).map((v) => v.clone()))) as this;
	}

	public changePrecision(precision: PrecisionValue): this {
		const p = BigInt(precision);
		return this._mapValues((v) => v.changePrecision(p));
	}

	public mod(other: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(other, (l, r) => l.mod(r));
	}

	public neg(): this {
		return this._mapValues((v) => v.neg());
	}

	public abs(): BigFloatMatrix {
		return BigFloatMatrix.from(this._values.map((row) => row.map((v) => v.abs())));
	}

	public sign(): this {
		return this._mapValues((v) => v.sign());
	}

	public reciprocal(): this {
		return this._mapValues((v) => v.reciprocal());
	}

	public pow(exponent: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(exponent, (l, r) => l.pow(r));
	}

	public sqrt(): this {
		return this._mapValues((v) => v.sqrt());
	}

	public cbrt(): this {
		return this._mapValues((v) => v.cbrt());
	}

	public nthRoot(n: number | bigint): this {
		return this._mapValues((v) => v.nthRoot(n));
	}

	public floor(): this {
		return this._mapValues((v) => v.floor());
	}

	public ceil(): this {
		return this._mapValues((v) => v.ceil());
	}

	public round(): this {
		return this._mapValues((v) => v.round());
	}

	public trunc(): this {
		return this._mapValues((v) => v.trunc());
	}

	public fround(): this {
		return this._mapValues((v) => v.fround());
	}

	public clz32(): this {
		return this._mapValues((v) => v.clz32());
	}

	public relativeDiff(other: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(other, (l, r) => l.relativeDiff(r));
	}

	public absoluteDiff(other: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(other, (l, r) => l.absoluteDiff(r));
	}

	public percentDiff(other: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(other, (l, r) => l.percentDiff(r));
	}

	public sin(): this {
		return this._mapValues((v) => v.sin());
	}

	public cos(): this {
		return this._mapValues((v) => v.cos());
	}

	public tan(): this {
		return this._mapValues((v) => v.tan());
	}

	public asin(): this {
		return this._mapValues((v) => v.asin());
	}

	public acos(): this {
		return this._mapValues((v) => v.acos());
	}

	public atan(): this {
		return this._mapValues((v) => v.atan());
	}

	public atan2(x: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		// atan2 is tricky for complex, but BigFloat.atan2 exists.
		// BigFloatComplex doesn't have atan2.
		// If I follow BigFloatVector logic, I'd need BigFloatComplex.atan2.
		// Since it doesn't exist, I'll only support it if they are real-like or throw.
		return this._mapWithOperand(x, (l, r) => {
			if (!l.isReal() || !r.isReal()) throw new TypeError("atan2 is not supported for non-real complex numbers");
			return new BigFloatComplex(l.real.atan2(r.real), 0, l.precision);
		});
	}

	public sinh(): this {
		return this._mapValues((v) => v.sinh());
	}

	public cosh(): this {
		return this._mapValues((v) => v.cosh());
	}

	public tanh(): this {
		return this._mapValues((v) => v.tanh());
	}

	public asinh(): this {
		return this._mapValues((v) => v.asinh());
	}

	public acosh(): this {
		return this._mapValues((v) => v.acosh());
	}

	public atanh(): this {
		return this._mapValues((v) => v.atanh());
	}

	public exp(): this {
		return this._mapValues((v) => v.exp());
	}

	public exp2(): this {
		return this._mapValues((v) => v.pow(2));
	}

	public expm1(): this {
		return this._mapValues((v) => v.expm1());
	}

	public ln(): this {
		return this._mapValues((v) => v.ln());
	}

	public log(base: BigFloatComplex | BigFloatValue | BigFloatComplexMatrixOperand): this {
		return this._mapWithOperand(base, (l, r) => l.log(r));
	}

	public log2(): this {
		return this._mapValues((v) => v.log(2));
	}

	public log10(): this {
		return this._mapValues((v) => v.log(10));
	}

	public log1p(): this {
		return this._mapValues((v) => v.add(1).ln());
	}

	public gamma(): this {
		// Not implemented in BigFloatComplex
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("gamma is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.gamma(), 0, v.precision);
		});
	}

	public zeta(): this {
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("zeta is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.zeta(), 0, v.precision);
		});
	}

	public factorial(): this {
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("factorial is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.factorial(), 0, v.precision);
		});
	}

	public rank(): number {
		return BigFloatComplexMatrix._reducedRowEchelon(this.toArray(), this.columnCount).pivotColumns.length;
	}
}
