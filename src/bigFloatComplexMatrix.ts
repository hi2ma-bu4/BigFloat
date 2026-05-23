import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import { BigFloatComplexVector } from "./bigFloatComplexVector";
import { BigFloatMatrix } from "./bigFloatMatrix";
import { BigFloatStream } from "./bigFloatStream";
import type { BigFloatAnyMatrix, BigFloatAnyMatrixLike, BigFloatAnyVectorLike, BigFloatComplexMatrixLike, BigFloatInputValue, PrecisionValue } from "./types";

type BigFloatComplexMatrixRandomOptions = {
	min?: BigFloatInputValue;
	max?: BigFloatInputValue;
	precision?: PrecisionValue;
};

/**
 * BigFloatComplex を要素とする固定長行列クラス
 * @throws {RangeError} 例外が発生した場合
 */
export class BigFloatComplexMatrix implements Iterable<BigFloatComplexVector> {
	/** 内部要素 (行ごとの配列) */
	public _values: BigFloatComplex[][];

	/**
	 * BigFloatComplexMatrix コンストラクタ
	 * @param rows - 行列要素の反復可能オブジェクト
	 * @param precision - 精度
	 * @throws {RangeError} Matrix rows must have the same length
	 */
	public constructor(rows: BigFloatAnyMatrixLike = [], precision?: PrecisionValue) {
		const rawRows = Array.from(rows as BigFloatComplexMatrixLike, (row) => Array.from(row));
		BigFloatComplexMatrix._assertRectangularRaw(rawRows);
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(rawRows.flat(), precision);
		this._values = rawRows.map((row) => row.map((value) => BigFloatComplexMatrix._toComplex(value, resolvedPrecision)));
	}

	protected static _fromComplexGrid(values: BigFloatComplex[][]): BigFloatComplexMatrix {
		const matrix = Object.create(BigFloatComplexMatrix.prototype) as BigFloatComplexMatrix;
		matrix._values = values;
		return matrix;
	}

	protected static _toComplex(value: BigFloatInputValue, precision?: bigint): BigFloatComplex {
		if (value instanceof BigFloatComplex) {
			return precision === undefined || value.precision === precision ? value.clone() : value.changePrecision(precision);
		}
		return new BigFloatComplex(value, 0, precision);
	}

	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint {
		if (precision !== undefined) return BigInt(precision);
		let resolved = BigFloat.DEFAULT_PRECISION;
		for (const value of values) {
			const p = value instanceof BigFloatComplex ? value.precision : value instanceof BigFloat ? value._precision : 0n;
			if (p > resolved) resolved = p;
		}
		return resolved;
	}

	/**
	 * 与えられた二次元配列が矩形であることを検証する
	 * @param rows - 検証対象の二次元配列
	 * @throws {RangeError} 各行の長さが一致しない場合
	 */
	protected static _assertRectangularRaw(rows: BigFloatInputValue[][]): void {
		if (rows.length === 0) return;
		const columnCount = rows[0].length;
		/**
		 * for
		 * @throws {RangeError} Matrix rows must have the same length
		 */
		for (const row of rows) {
			if (row.length !== columnCount) throw new RangeError("Matrix rows must have the same length");
		}
	}

	protected static _assertSameShape(left: BigFloatAnyMatrix, right: BigFloatAnyMatrix): void {
		/**
		 * if
		 * @throws {RangeError} Matrix shapes must match
		 * @throws {TypeError} factorial is not supported for non-real complex numbers
		 */
		if (left.rowCount !== right.rowCount || left.columnCount !== right.columnCount) {
			throw new RangeError("Matrix shapes must match");
		}
	}

	protected static _coerceMatrix(value: BigFloatAnyMatrixLike, referenceValues: BigFloatInputValue[] = []): BigFloatComplexMatrix {
		if (value instanceof BigFloatComplexMatrix) return value;
		if (value instanceof BigFloatMatrix) {
			return BigFloatComplexMatrix._fromComplexGrid(value.toArray().map((row) => row.map((v) => new BigFloatComplex(v))));
		}
		const rows = Array.from(value as BigFloatComplexMatrixLike, (row) => Array.from(row));
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision([...referenceValues, ...rows.flat()]);
		return new BigFloatComplexMatrix(rows, resolvedPrecision);
	}

	protected _flattenValues(): BigFloatComplex[] {
		return this._values.flat();
	}

	protected _mapValues(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this {
		const values = this._values.map((currentRow, rowIndex) =>
			currentRow.map((value, columnIndex) => {
				const mapped = fn(value.clone(), rowIndex, columnIndex);
				return BigFloatComplexMatrix._toComplex(mapped, value.precision);
			}),
		);
		return BigFloatComplexMatrix._fromComplexGrid(values) as this;
	}

	protected _mapWithOperand(other: BigFloatAnyMatrixLike | BigFloatInputValue, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this {
		if (other instanceof BigFloatComplexMatrix || other instanceof BigFloatMatrix || (typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat) && !(other instanceof BigFloatComplex))) {
			const matrix = BigFloatComplexMatrix._coerceMatrix(other as BigFloatAnyMatrixLike, this._flattenValues());
			BigFloatComplexMatrix._assertSameShape(this, matrix);
			const values = this._values.map((currentRow, rowIndex) =>
				currentRow.map((value, columnIndex) => {
					const mapped = fn(value.clone(), matrix._values[rowIndex][columnIndex].clone(), rowIndex, columnIndex);
					return BigFloatComplexMatrix._toComplex(mapped, value.precision);
				}),
			);
			return BigFloatComplexMatrix._fromComplexGrid(values) as this;
		}

		const right = BigFloatComplexMatrix._toComplex(other as BigFloatInputValue, this._values[0]?.[0]?.precision);
		return this._mapValues((value, row, column) => fn(value, right, row, column));
	}

	public static empty(): BigFloatComplexMatrix {
		return this._fromComplexGrid([]);
	}

	public static from(rows: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix {
		return new BigFloatComplexMatrix(rows, precision);
	}

	public static fromRows(rows: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix {
		return this.from(rows, precision);
	}

	public static fromColumns(columns: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix {
		const rawColumns = Array.from(columns as BigFloatComplexMatrixLike, (col) => Array.from(col));
		if (rawColumns.length === 0) return this.empty();
		const rowCount = rawColumns[0].length;
		const rows = Array.from({ length: rowCount }, (_, r) => rawColumns.map((col) => col[r]));
		return this.from(rows, precision);
	}

	public static of(...rows: BigFloatAnyVectorLike[]): BigFloatComplexMatrix {
		return this.from(rows as BigFloatAnyMatrixLike);
	}

	public static fill(rowCount: number, columnCount: number, value: BigFloatInputValue, precision?: PrecisionValue): BigFloatComplexMatrix {
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

	public static diagonal(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatComplexMatrix {
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

	public map(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this {
		return this._mapValues(fn);
	}

	/**
	 * 要素を流すストリームへ変換する
	 * @throws {RangeError} 例外が発生した場合
	 * @throws {TypeError} 例外が発生した場合
	 */
	public toStream(): BigFloatStream {
		return BigFloatStream.from(this._flattenValues());
	}

	public add(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.add(r));
	}

	public sub(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.sub(r));
	}

	public hadamard(other: BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.mul(r));
	}

	public mul(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexMatrix._toComplex(scalar, this._values[0]?.[0]?.precision);
		return this._mapValues((v) => v.mul(s));
	}

	public div(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexMatrix._toComplex(scalar, this._values[0]?.[0]?.precision);
		return this._mapValues((v) => v.div(s));
	}

	/**
	 * 行列の積を計算する
	 * @param other - 乗算する行列
	 * @returns 計算結果の行列
	 * @throws {RangeError} 行列の次元が一致しない場合
	 */
	public matmul(other: BigFloatAnyMatrixLike): this {
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

	/**
	 * 正方行列のトレース（対角和）を計算する
	 * @returns トレースの値
	 * @throws {RangeError} 正方行列でない場合
	 */
	public trace(): BigFloatComplex {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		let total = new BigFloatComplex(0, 0, resolvedPrecision);
		for (let i = 0; i < this.rowCount; i++) {
			total = total.add(this._values[i][i]);
		}
		return total;
	}

	/**
	 * 正方行列の行列式を計算する
	 * @returns 行列式の値
	 * @throws {RangeError} 正方行列でない場合
	 */
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

	/**
	 * 逆行列を計算する
	 * @returns 逆行列
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SingularMatrixError} 行列が特異（逆行列が存在しない）な場合
	 */
	public inverse(): this {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const size = this.rowCount;
		const identity = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => new BigFloatComplex(row === col ? 1 : 0, 0, this._values[0]?.[0]?.precision)));
		const augmented = this._values.map((row, i) => [...row.map((v) => v.clone()), ...identity[i]]);

		const rowCount = size;
		const totalColumns = 2 * size;
		let pivotRow = 0;

		/**
		 * for
		 * @throws {RangeError} Matrix is singular
		 */
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

	/**
	 * 連立一次方程式 Ax = b を解く（bはベクトル）
	 * @param rhs - 右辺ベクトル b
	 * @returns 解ベクトル x
	 * @throws {RangeError} 行列が正方でない、または次元が一致しない場合
	 */
	public solveVector(rhs: BigFloatAnyVectorLike): BigFloatComplexVector {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const vector = BigFloatComplexVector.from(rhs);
		if (vector.length !== this.rowCount) throw new RangeError("Dimension mismatch");
		const solution = this.solveMatrix(BigFloatComplexMatrix.from(vector.toArray().map((v) => [v])));
		return solution.column(0) ?? BigFloatComplexVector.empty();
	}

	/**
	 * 連立一次方程式 AX = B を解く（Bは行列）
	 * @param rhs - 右辺行列 B
	 * @returns 解行列 X
	 * @throws {RangeError} 行列が正方でない、または次元が一致しない場合
	 * @throws {SingularMatrixError} 行列が特異な場合
	 */
	public solveMatrix(rhs: BigFloatAnyMatrixLike): this {
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

	/**
	 * 行列のべき乗を計算する
	 * @param exponent - 指数
	 * @returns 計算結果の行列
	 * @throws {RangeError} 行列が正方でない、または指数が整数でない場合
	 */
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

	/**
	 * 単位行列を生成する
	 * @param size - 行列のサイズ
	 * @param precision - 精度
	 * @returns 単位行列
	 */
	public static identity(size: number, precision?: PrecisionValue): BigFloatComplexMatrix {
		const s = Math.trunc(size);
		const p = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return BigFloatComplexMatrix._fromComplexGrid(Array.from({ length: s }, (_, r) => Array.from({ length: s }, (_, c) => new BigFloatComplex(r === c ? 1 : 0, 0, p))));
	}

	/**
	 * 他の行列と等しいかどうかを判定する
	 * @param other - 比較対象の行列
	 * @returns 等しい場合は true、そうでない場合は false
	 */
	public equals(other: BigFloatAnyMatrixLike): boolean {
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

	/**
	 * 行列とベクトルの積を計算する
	 * @param vector - 乗算するベクトル
	 * @returns 計算結果のベクトル
	 * @throws {RangeError} 行列の列数とベクトルの次元が一致しない場合
	 */
	public mulVector(vector: BigFloatAnyVectorLike): BigFloatComplexVector {
		const rhs = BigFloatComplexVector.from(vector);
		if (this.columnCount !== rhs.length) throw new RangeError("Inner matrix dimensions must agree");
		return BigFloatComplexVector.from(this._values.map((row) => BigFloatComplexVector.from(row).dot(rhs)));
	}

	/**
	 * 行列の対角成分をベクトルとして取得する
	 * @returns 対角成分のベクトル
	 * @throws {RangeError} 正方行列でない場合
	 */
	public diagonalVector(): BigFloatComplexVector {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		return BigFloatComplexVector.from(this._values.map((row, index) => row[index].clone()));
	}

	public flatten(): BigFloatComplexVector {
		return BigFloatComplexVector.from(this._flattenValues().map((v) => v.clone()));
	}

	public zipMap(other: BigFloatAnyMatrixLike, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this {
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

	/**
	 * 全ての要素が条件を満たすかどうかを判定する
	 * @param fn - 判定関数
	 * @returns 全ての要素が条件を満たす場合は true、そうでない場合は false
	 */
	public every(fn: (value: BigFloatComplex, row: number, column: number) => boolean): boolean {
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				if (!fn(this._values[r][c].clone(), r, c)) return false;
			}
		}
		return true;
	}

	/**
	 * 他の行列を行方向に連結する
	 * @param others - 連結する行列
	 * @returns 連結された新しい行列
	 * @throws {RangeError} 列数が一致しない場合
	 */
	public concatRows(...others: BigFloatAnyMatrixLike[]): this {
		const values = this.toArray();
		/**
		 * for
		 * @throws {RangeError} Column counts must match
		 */
		for (const other of others) {
			const matrix = BigFloatComplexMatrix._coerceMatrix(other, this._flattenValues());
			if (this.columnCount !== 0 && matrix.columnCount !== this.columnCount) throw new RangeError("Column counts must match");
			values.push(...matrix.toArray());
		}
		return BigFloatComplexMatrix._fromComplexGrid(values) as this;
	}

	public concatColumns(...others: BigFloatAnyMatrixLike[]): this {
		let result = this.clone();
		/**
		 * for
		 * @throws {RangeError} Row counts must match
		 */
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

	public mod(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
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

	public pow(exponent: BigFloatInputValue | BigFloatAnyMatrixLike): this {
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

	public relativeDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.relativeDiff(r));
	}

	public absoluteDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.absoluteDiff(r));
	}

	public percentDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
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

	public atan2(x: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		/**
		 * _mapWithOperand
		 * @throws {TypeError} atan2 is not supported for non-real complex numbers
		 */
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

	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算する
	 * @returns 各要素に asinh を適用した行列
	 */
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

	public log(base: BigFloatInputValue | BigFloatAnyMatrixLike): this {
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

	/**
	 * gamma
	 * @throws {TypeError} 例外が発生した場合
	 */
	public gamma(): this {
		// Not implemented in BigFloatComplex
		/**
		 * _mapValues
		 * @throws {TypeError} gamma is not supported for non-real complex numbers
		 */
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("gamma is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.gamma(), 0, v.precision);
		});
	}

	public zeta(): this {
		/**
		 * _mapValues
		 * @throws {TypeError} zeta is not supported for non-real complex numbers
		 */
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("zeta is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.zeta(), 0, v.precision);
		});
	}

	public factorial(): this {
		/**
		 * _mapValues
		 * @throws {TypeError} factorial is not supported for non-real complex numbers
		 */
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("factorial is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.factorial(), 0, v.precision);
		});
	}

	public rank(): number {
		return BigFloatComplexMatrix._reducedRowEchelon(this.toArray(), this.columnCount).pivotColumns.length;
	}
}
