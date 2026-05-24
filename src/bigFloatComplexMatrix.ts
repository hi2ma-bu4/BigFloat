import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import { BigFloatComplexVector } from "./bigFloatComplexVector";
import { BigFloatMatrix } from "./bigFloatMatrix";
import { BigFloatStream } from "./bigFloatStream";
import { SingularMatrixError } from "./error";
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
	 * @returns BigFloatComplexMatrix インスタンス
	 * @throws {RangeError} 各行の長さが一致しない場合
	 */
	public constructor(rows: BigFloatAnyMatrixLike = [], precision?: PrecisionValue) {
		const rawRows = Array.from(rows as BigFloatComplexMatrixLike, (row) => Array.from(row));
		BigFloatComplexMatrix._assertRectangularRaw(rawRows);
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(rawRows.flat(), precision);
		this._values = rawRows.map((row) => row.map((value) => BigFloatComplexMatrix._toComplex(value, resolvedPrecision)));
	}

	/**
	 * BigFloatComplex の二次元配列から行列を生成する
	 * @param values - BigFloatComplex の二次元配列
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	protected static _fromComplexGrid(values: BigFloatComplex[][]): BigFloatComplexMatrix {
		const matrix = Object.create(BigFloatComplexMatrix.prototype) as BigFloatComplexMatrix;
		matrix._values = values;
		return matrix;
	}

	/**
	 * 値を BigFloatComplex に変換する
	 * @param value - 変換する値
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	protected static _toComplex(value: BigFloatInputValue, precision?: bigint): BigFloatComplex {
		if (value instanceof BigFloatComplex) {
			return precision === undefined || value.precision === precision ? value.clone() : value.changePrecision(precision);
		}
		return new BigFloatComplex(value, 0, precision);
	}

	/**
	 * 精度を解決する
	 * @param values - 対象の値の配列
	 * @param precision - 指定された精度
	 * @returns 解決された精度
	 */
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
	 * 二次元配列が矩形であることを検証する
	 * @param rows - 検証対象の二次元配列
	 * @throws {RangeError} 各行の長さが一致しない場合
	 */
	protected static _assertRectangularRaw(rows: BigFloatInputValue[][]): void {
		if (rows.length === 0) return;
		const columnCount = rows[0].length;
		for (const row of rows) {
			if (row.length !== columnCount) throw new RangeError("Matrix rows must have the same length");
		}
	}

	/**
	 * 二つの行列の形状が一致することを検証する
	 * @param left - 左辺行列
	 * @param right - 右辺行列
	 * @throws {RangeError} 行列の形状が一致しない場合
	 */
	protected static _assertSameShape(left: BigFloatAnyMatrix, right: BigFloatAnyMatrix): void {
		if (left.rowCount !== right.rowCount || left.columnCount !== right.columnCount) {
			throw new RangeError("Matrix shapes must match");
		}
	}

	/**
	 * 値を行列に変換する
	 * @param value - 変換する値
	 * @param referenceValues - 精度の解決に使用する参照値
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	protected static _coerceMatrix(value: BigFloatAnyMatrixLike, referenceValues: BigFloatInputValue[] = []): BigFloatComplexMatrix {
		if (value instanceof BigFloatComplexMatrix) return value;
		if (value instanceof BigFloatMatrix) {
			return BigFloatComplexMatrix._fromComplexGrid(value.toArray().map((row) => row.map((v) => new BigFloatComplex(v))));
		}
		const rows = Array.from(value as BigFloatComplexMatrixLike, (row) => Array.from(row));
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision([...referenceValues, ...rows.flat()]);
		return new BigFloatComplexMatrix(rows, resolvedPrecision);
	}

	/**
	 * 行列の全要素をフラットな配列として取得する
	 * @returns 全要素の配列
	 */
	protected _flattenValues(): BigFloatComplex[] {
		return this._values.flat();
	}

	/**
	 * 各要素に関数を適用して新しい行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい行列
	 */
	protected _mapValues(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this {
		const values = this._values.map((currentRow, rowIndex) =>
			currentRow.map((value, columnIndex) => {
				const mapped = fn(value.clone(), rowIndex, columnIndex);
				return BigFloatComplexMatrix._toComplex(mapped, value.precision);
			}),
		);
		return BigFloatComplexMatrix._fromComplexGrid(values) as this;
	}

	/**
	 * オペランドを用いて各要素に関数を適用し、新しい行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい行列
	 */
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

	/**
	 * 空の行列を生成する
	 * @returns 空の行列
	 */
	public static empty(): BigFloatComplexMatrix {
		return this._fromComplexGrid([]);
	}

	/**
	 * 二次元配列から行列を生成する
	 * @param rows - 二次元配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	public static from(rows: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix {
		return new BigFloatComplexMatrix(rows, precision);
	}

	/**
	 * 行の配列から行列を生成する
	 * @param rows - 行の配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	public static fromRows(rows: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix {
		return this.from(rows, precision);
	}

	/**
	 * 列の配列から行列を生成する
	 * @param columns - 列の配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	public static fromColumns(columns: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix {
		const rawColumns = Array.from(columns as BigFloatComplexMatrixLike, (col) => Array.from(col));
		if (rawColumns.length === 0) return this.empty();
		const rowCount = rawColumns[0].length;
		const rows = Array.from({ length: rowCount }, (_, r) => rawColumns.map((col) => col[r]));
		return this.from(rows, precision);
	}

	/**
	 * 可変長引数の行から行列を生成する
	 * @param rows - 行ベクトルの配列
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	public static of(...rows: BigFloatAnyVectorLike[]): BigFloatComplexMatrix {
		return this.from(rows as BigFloatAnyMatrixLike);
	}

	/**
	 * 指定された値で埋められた行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	public static fill(rowCount: number, columnCount: number, value: BigFloatInputValue, precision?: PrecisionValue): BigFloatComplexMatrix {
		if (rowCount <= 0 || columnCount <= 0) return this.empty();
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision([value], precision);
		const base = this._toComplex(value, resolvedPrecision);
		return this._fromComplexGrid(Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => base.clone())));
	}

	/**
	 * 零行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns 零行列
	 */
	public static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatComplexMatrix {
		return this.fill(rowCount, columnCount, 0, precision);
	}

	/**
	 * すべての要素が 1 の行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns すべての要素が 1 の行列
	 */
	public static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatComplexMatrix {
		return this.fill(rowCount, columnCount, 1, precision);
	}

	/**
	 * 対角行列を生成する
	 * @param values - 対角成分の配列
	 * @param precision - 精度
	 * @returns 対角行列
	 */
	public static diagonal(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatComplexMatrix {
		const entries = Array.from(values);
		const resolvedPrecision = this._resolvePrecision(entries, precision);
		return this._fromComplexGrid(entries.map((v, r) => entries.map((_, c) => (r === c ? this._toComplex(v, resolvedPrecision) : new BigFloatComplex(0, 0, resolvedPrecision)))));
	}

	/**
	 * ランダムな値を持つ行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param options - ランダム生成のオプション
	 * @returns ランダムな行列
	 */
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

	/**
	 * 行数
	 */
	public get rowCount(): number {
		return this._values.length;
	}

	/**
	 * 列数
	 */
	public get columnCount(): number {
		return this.rowCount === 0 ? 0 : this._values[0].length;
	}

	/**
	 * 正方行列であるか判定する
	 * @returns 正方行列なら true
	 */
	public isSquare(): boolean {
		return this.rowCount === this.columnCount;
	}

	/**
	 * 空の行列であるか判定する
	 * @returns 空なら true
	 */
	public isEmpty(): boolean {
		return this.rowCount === 0 || this.columnCount === 0;
	}

	/**
	 * 行列の形状を取得する
	 * @returns [行数, 列数]
	 */
	public shape(): [number, number] {
		return [this.rowCount, this.columnCount];
	}

	/**
	 * 指定したインデックスの要素を取得する
	 * @param row - 行インデックス
	 * @param column - 列インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 */
	public at(row: number, column: number): BigFloatComplex | undefined {
		if (row < 0 || column < 0 || row >= this.rowCount || column >= this.columnCount) return undefined;
		return this._values[row][column].clone();
	}

	/**
	 * 指定した行のベクトルを取得する
	 * @param index - 行インデックス
	 * @returns 指定行のベクトル、インデックスが範囲外の場合は undefined
	 */
	public row(index: number): BigFloatComplexVector | undefined {
		if (index < 0 || index >= this.rowCount) return undefined;
		return BigFloatComplexVector.from(this._values[index].map((v) => v.clone()));
	}

	/**
	 * 指定した列のベクトルを取得する
	 * @param index - 列インデックス
	 * @returns 指定列のベクトル、インデックスが範囲外の場合は undefined
	 */
	public column(index: number): BigFloatComplexVector | undefined {
		if (index < 0 || index >= this.columnCount) return undefined;
		return BigFloatComplexVector.from(this._values.map((row) => row[index].clone()));
	}

	/**
	 * 行列を複製する
	 * @returns 複製された BigFloatComplexMatrix
	 */
	public clone(): BigFloatComplexMatrix {
		return BigFloatComplexMatrix._fromComplexGrid(this._values.map((row) => row.map((v) => v.clone())));
	}

	/**
	 * 二次元配列に変換する
	 * @returns 各要素が BigFloatComplex の二次元配列
	 */
	public toArray(): BigFloatComplex[][] {
		return this._values.map((row) => row.map((v) => v.clone()));
	}

	/**
	 * 行ベクトルの配列に変換する
	 * @returns BigFloatComplexVector の配列
	 */
	public toVectors(): BigFloatComplexVector[] {
		return this._values.map((row) => BigFloatComplexVector.from(row.map((v) => v.clone())));
	}

	/**
	 * 行ベクトルのイテレータを取得する
	 * @returns 行ベクトルのイテレータ
	 */
	public [Symbol.iterator](): Iterator<BigFloatComplexVector, void, undefined> {
		return this.toVectors()[Symbol.iterator]();
	}

	/**
	 * 各要素に対して処理を実行する
	 * @param fn - 実行する関数
	 */
	public forEach(fn: (value: BigFloatComplex, row: number, column: number) => void): void {
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				fn(this._values[r][c].clone(), r, c);
			}
		}
	}

	/**
	 * 各要素に関数を適用して新しい行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい行列
	 */
	public map(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this {
		return this._mapValues(fn);
	}

	/**
	 * 要素を流すストリームへ変換する
	 * @returns 要素のストリーム
	 */
	public toStream(): BigFloatStream {
		return BigFloatStream.from(this._flattenValues());
	}

	/**
	 * 行列の加算を行う
	 * @param other - 加算する行列またはスカラー
	 * @returns 加算後の新しい行列
	 */
	public add(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.add(r));
	}

	/**
	 * 行列の減算を行う
	 * @param other - 減算する行列またはスカラー
	 * @returns 減算後の新しい行列
	 */
	public sub(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.sub(r));
	}

	/**
	 * アダマール積（要素ごとの積）を計算する
	 * @param other - 乗算する行列
	 * @returns アダマール積の結果の行列
	 */
	public hadamard(other: BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.mul(r));
	}

	/**
	 * スカラー倍を行う
	 * @param scalar - 乗算するスカラー
	 * @returns 乗算後の新しい行列
	 */
	public mul(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexMatrix._toComplex(scalar, this._values[0]?.[0]?.precision);
		return this._mapValues((v) => v.mul(s));
	}

	/**
	 * スカラー除算を行う
	 * @param scalar - 除算するスカラー
	 * @returns 除算後の新しい行列
	 */
	public div(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexMatrix._toComplex(scalar, this._values[0]?.[0]?.precision);
		return this._mapValues((v) => v.div(s));
	}

	/**
	 * 行列の積を計算する
	 * @param other - 乗算する行列
	 * @returns 行列の積
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

	/**
	 * 転置行列を生成する
	 * @returns 転置された新しい行列
	 */
	public transpose(): this {
		if (this.rowCount === 0) return BigFloatComplexMatrix.empty() as this;
		return BigFloatComplexMatrix._fromComplexGrid(Array.from({ length: this.columnCount }, (_, column) => this._values.map((row) => row[column].clone()))) as this;
	}

	/**
	 * 各行の和を計算する
	 * @returns 各行の和を持つベクトル
	 */
	public rowSums(): BigFloatComplexVector {
		return BigFloatComplexVector.from(this._values.map((row) => BigFloatComplexVector.from(row).sum()));
	}

	/**
	 * 各列の和を計算する
	 * @returns 各列の和を持つベクトル
	 */
	public columnSums(): BigFloatComplexVector {
		if (this.isEmpty()) return BigFloatComplexVector.empty();
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		return BigFloatComplexVector.from(Array.from({ length: this.columnCount }, (_, col) => this._values.reduce((acc, row) => acc.add(row[col]), new BigFloatComplex(0, 0, resolvedPrecision))));
	}

	/**
	 * 行列のトレース（対角和）を計算する
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
	 * 行列式を計算する
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
	 * @throws {SingularMatrixError} 行列が特異な場合
	 */
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
			if (bestRow === -1) throw new SingularMatrixError("Matrix is singular");
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
	 * 連立一次方程式を解く（ベクトル）
	 * @param rhs - 右辺ベクトル
	 * @returns 解ベクトル
	 * @throws {RangeError} 次元が一致しない場合
	 */
	public solveVector(rhs: BigFloatAnyVectorLike): BigFloatComplexVector {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const vector = BigFloatComplexVector.from(rhs);
		if (vector.length !== this.rowCount) throw new RangeError("Dimension mismatch");
		const solution = this.solveMatrix(BigFloatComplexMatrix.from(vector.toArray().map((v) => [v])));
		return solution.column(0) ?? BigFloatComplexVector.empty();
	}

	/**
	 * 連立一次方程式を解く（行列）
	 * @param rhs - 右辺行列
	 * @returns 解行列
	 * @throws {RangeError} 次元が一致しない場合
	 * @throws {SingularMatrixError} 行列が特異な場合
	 */
	public solveMatrix(rhs: BigFloatAnyMatrixLike): this {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		const right = BigFloatComplexMatrix._coerceMatrix(rhs, this._flattenValues());
		if (right.rowCount !== this.rowCount) throw new RangeError("Dimension mismatch");
		const size = this.rowCount;
		const augmented = this._values.map((row, i) => [...row.map((v) => v.clone()), ...right._values[i].map((v) => v.clone())]);
		const { values, pivotColumns } = BigFloatComplexMatrix._reducedRowEchelon(augmented, size);
		if (pivotColumns.length !== size) throw new SingularMatrixError("Matrix is singular");
		return BigFloatComplexMatrix._fromComplexGrid(values.map((row) => row.slice(size))) as this;
	}

	/**
	 * 行階段形（簡約行階段形）を計算する
	 * @param values - 対象の行列データ
	 * @param leftColumnCount - 左側の列数
	 * @returns 簡約行階段形行列とそのピボット列のインデックス
	 */
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
	 * @returns 行列のべき乗
	 * @throws {RangeError} 指数が整数でない場合、または正方行列でない場合
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
	 * 行列が等しいかどうかを判定する
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

	/**
	 * 全要素の合計を計算する
	 * @returns 合計値
	 */
	public sum(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0, 0, BigFloat.DEFAULT_PRECISION);
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		return this._flattenValues().reduce((acc, v) => acc.add(v), new BigFloatComplex(0, 0, resolvedPrecision));
	}

	/**
	 * 全要素の積を計算する
	 * @returns 積の値
	 */
	public product(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(1, 0, BigFloat.DEFAULT_PRECISION);
		const resolvedPrecision = BigFloatComplexMatrix._resolvePrecision(this._flattenValues());
		return this._flattenValues().reduce((acc, v) => acc.mul(v), new BigFloatComplex(1, 0, resolvedPrecision));
	}

	/**
	 * 全要素の平均を計算する
	 * @returns 平均値
	 */
	public average(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0, 0, BigFloat.DEFAULT_PRECISION);
		return this.sum().div(this.rowCount * this.columnCount);
	}

	/**
	 * フロベニウスノルムを計算する
	 * @returns ノルムの値
	 */
	public frobeniusNorm(): BigFloat {
		return this._flattenValues()
			.reduce((acc, v) => acc.add(v.absSquared()), new BigFloat(0, this._values[0]?.[0]?.precision))
			.sqrt();
	}

	/**
	 * 行列とベクトルの積を計算する
	 * @param vector - 乗算するベクトル
	 * @returns ベクトルとの積
	 * @throws {RangeError} 次元が一致しない場合
	 */
	public mulVector(vector: BigFloatAnyVectorLike): BigFloatComplexVector {
		const rhs = BigFloatComplexVector.from(vector);
		if (this.columnCount !== rhs.length) throw new RangeError("Inner matrix dimensions must agree");
		return BigFloatComplexVector.from(this._values.map((row) => BigFloatComplexVector.from(row).dot(rhs)));
	}

	/**
	 * 対角成分をベクトルとして取得する
	 * @returns 対角成分のベクトル
	 * @throws {RangeError} 正方行列でない場合
	 */
	/**
	 * 対角成分をベクトルとして取得する
	 * @returns 対角成分のベクトル
	 * @throws {RangeError} 正方行列でない場合
	 */
	public diagonalVector(): BigFloatComplexVector {
		if (!this.isSquare()) throw new RangeError("Matrix must be square");
		return BigFloatComplexVector.from(this._values.map((row, index) => row[index].clone()));
	}

	/**
	 * 全要素を一つのベクトルに変換する
	 * @returns 全要素のベクトル
	 */
	public flatten(): BigFloatComplexVector {
		return BigFloatComplexVector.from(this._flattenValues().map((v) => v.clone()));
	}

	/**
	 * 二つの行列の各要素に対して関数を適用し、新しい行列を生成する
	 * @param other - 比較対象の行列
	 * @param fn - 適用する関数
	 * @returns 演算結果の行列
	 */
	public zipMap(other: BigFloatAnyMatrixLike, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this {
		return this._mapWithOperand(other, fn);
	}

	/**
	 * 各要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 */
	public reduce<U>(fn: (acc: U, value: BigFloatComplex, row: number, column: number) => U, initial: U): U {
		let acc = initial;
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				acc = fn(acc, this._values[r][c].clone(), r, c);
			}
		}
		return acc;
	}

	/**
	 * いずれかの要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true、そうでない場合は false
	 */
	public some(fn: (value: BigFloatComplex, row: number, column: number) => boolean): boolean {
		for (let r = 0; r < this.rowCount; r++) {
			for (let c = 0; c < this.columnCount; c++) {
				if (fn(this._values[r][c].clone(), r, c)) return true;
			}
		}
		return false;
	}

	/**
	 * すべての要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たす場合は true、そうでない場合は false
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
	 * 行列を行方向に連結する
	 * @param others - 連結する行列
	 * @returns 連結された行列
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

	/**
	 * 行列を列方向に連結する
	 * @param others - 連結する行列
	 * @returns 連結された行列
	 * @throws {RangeError} 行数が一致しない場合
	 */
	public concatColumns(...others: BigFloatAnyMatrixLike[]): this {
		let result = this.clone();
		for (const other of others) {
			const matrix = BigFloatComplexMatrix._coerceMatrix(other, result._flattenValues());
			if (result.rowCount !== matrix.rowCount) throw new RangeError("Row counts must match");
			result = BigFloatComplexMatrix._fromComplexGrid(result._values.map((row, rowIndex) => [...row.map((v) => v.clone()), ...matrix._values[rowIndex].map((v) => v.clone())]));
		}
		return result as this;
	}

	/**
	 * 指定した範囲の行を抽出する
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 */
	public sliceRows(start?: number, end?: number): this {
		return BigFloatComplexMatrix._fromComplexGrid(this._values.slice(start, end).map((row) => row.map((v) => v.clone()))) as this;
	}

	/**
	 * 指定した範囲の列を抽出する
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 */
	public sliceColumns(start?: number, end?: number): this {
		return BigFloatComplexMatrix._fromComplexGrid(this._values.map((row) => row.slice(start, end).map((v) => v.clone()))) as this;
	}

	/**
	 * 行列の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しい行列
	 */
	public changePrecision(precision: PrecisionValue): this {
		const p = BigInt(precision);
		return this._mapValues((v) => v.changePrecision(p));
	}

	/**
	 * 各要素の剰余を計算する
	 * @param other - 除数（行列またはスカラー）
	 * @returns 演算後の新しい行列
	 */
	public mod(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.mod(r));
	}

	/**
	 * 各要素の符号を反転する
	 * @returns 符号反転後の新しい行列
	 */
	public neg(): this {
		return this._mapValues((v) => v.neg());
	}

	/**
	 * 各要素の絶対値を計算する
	 * @returns 絶対値適用後の新しい実数行列
	 */
	public abs(): BigFloatMatrix {
		return BigFloatMatrix.from(this._values.map((row) => row.map((v) => v.abs())));
	}

	/**
	 * 各要素の符号を計算する
	 * @returns 符号行列
	 */
	public sign(): this {
		return this._mapValues((v) => v.sign());
	}

	/**
	 * 各要素の逆数を計算する
	 * @returns 逆数行列
	 */
	public reciprocal(): this {
		return this._mapValues((v) => v.reciprocal());
	}

	/**
	 * 各要素のべき乗を計算する
	 * @param exponent - 指数（行列またはスカラー）
	 * @returns 冪乗後の新しい行列
	 */
	public pow(exponent: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(exponent, (l, r) => l.pow(r));
	}

	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根適用後の新しい行列
	 */
	public sqrt(): this {
		return this._mapValues((v) => v.sqrt());
	}

	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根適用後の新しい行列
	 */
	public cbrt(): this {
		return this._mapValues((v) => v.cbrt());
	}

	/**
	 * 各要素の n 乗根を計算する
	 * @param n - 次数
	 * @returns n 乗根適用後の新しい行列
	 */
	public nthRoot(n: number | bigint): this {
		return this._mapValues((v) => v.nthRoot(n));
	}

	/**
	 * 各要素の床関数を計算する
	 * @returns 床関数適用後の新しい行列
	 */
	public floor(): this {
		return this._mapValues((v) => v.floor());
	}

	/**
	 * 各要素の天井関数を計算する
	 * @returns 天井関数適用後の新しい行列
	 */
	public ceil(): this {
		return this._mapValues((v) => v.ceil());
	}

	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後の新しい行列
	 */
	public round(): this {
		return this._mapValues((v) => v.round());
	}

	/**
	 * 各要素を切り捨てる
	 * @returns 切り捨て後の新しい行列
	 */
	public trunc(): this {
		return this._mapValues((v) => v.trunc());
	}

	/**
	 * 各要素を最も近い単精度浮動小数点数形式に丸める
	 * @returns 丸め後の新しい行列
	 */
	public fround(): this {
		return this._mapValues((v) => v.fround());
	}

	/**
	 * 各要素の 32 ビット整数としての先頭のゼロの個数を計算する
	 * @returns 結果の行列
	 */
	public clz32(): this {
		return this._mapValues((v) => v.clz32());
	}

	/**
	 * 各要素の相対差を計算する
	 * @param other - 比較対象（行列またはスカラー）
	 * @returns 相対差の行列
	 */
	public relativeDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.relativeDiff(r));
	}

	/**
	 * 各要素の絶対差を計算する
	 * @param other - 比較対象（行列またはスカラー）
	 * @returns 絶対差の行列
	 */
	public absoluteDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.absoluteDiff(r));
	}

	/**
	 * 各要素の百分率差分を計算する
	 * @param other - 比較対象（行列またはスカラー）
	 * @returns 百分率差分の行列 (%)
	 */
	public percentDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(other, (l, r) => l.percentDiff(r));
	}

	/**
	 * 各要素の正弦（sin）を計算する
	 * @returns sin 適用後の行列
	 */
	public sin(): this {
		return this._mapValues((v) => v.sin());
	}

	/**
	 * 各要素の余弦（cos）を計算する
	 * @returns cos 適用後の行列
	 */
	public cos(): this {
		return this._mapValues((v) => v.cos());
	}

	/**
	 * 各要素の正接（tan）を計算する
	 * @returns tan 適用後の行列
	 */
	public tan(): this {
		return this._mapValues((v) => v.tan());
	}

	/**
	 * 各要素の逆正弦（asin）を計算する
	 * @returns asin 適用後の行列
	 */
	public asin(): this {
		return this._mapValues((v) => v.asin());
	}

	/**
	 * 各要素の逆余弦（acos）を計算する
	 * @returns acos 適用後の行列
	 */
	public acos(): this {
		return this._mapValues((v) => v.acos());
	}

	/**
	 * 各要素の逆正接（atan）を計算する
	 * @returns atan 適用後の行列
	 */
	public atan(): this {
		return this._mapValues((v) => v.atan());
	}

	/**
	 * 各要素の atan2 を計算する
	 * @param x - x 座標（行列またはスカラー）
	 * @returns atan2 適用後の行列
	 * @throws {TypeError} 実数でない複素数が含まれる場合
	 */
	public atan2(x: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(x, (l, r) => {
			if (!l.isReal() || !r.isReal()) throw new TypeError("atan2 is not supported for non-real complex numbers");
			return new BigFloatComplex(l.real.atan2(r.real), 0, l.precision);
		});
	}

	/**
	 * 各要素の双曲線正弦（sinh）を計算する
	 * @returns sinh 適用後の行列
	 */
	public sinh(): this {
		return this._mapValues((v) => v.sinh());
	}

	/**
	 * 各要素の双曲線余弦（cosh）を計算する
	 * @returns cosh 適用後の行列
	 */
	public cosh(): this {
		return this._mapValues((v) => v.cosh());
	}

	/**
	 * 各要素の双曲線正接（tanh）を計算する
	 * @returns tanh 適用後の行列
	 */
	public tanh(): this {
		return this._mapValues((v) => v.tanh());
	}

	/**
	 * 各要素の逆双曲線正弦を計算する
	 * @returns asinh を適用した行列
	 */
	public asinh(): this {
		return this._mapValues((v) => v.asinh());
	}

	/**
	 * 各要素の逆双曲線余弦（acosh）を計算する
	 * @returns acosh 適用後の行列
	 */
	public acosh(): this {
		return this._mapValues((v) => v.acosh());
	}

	/**
	 * 各要素の逆双曲線正接（atanh）を計算する
	 * @returns atanh 適用後の行列
	 */
	public atanh(): this {
		return this._mapValues((v) => v.atanh());
	}

	/**
	 * 各要素の指数関数（exp）を計算する
	 * @returns exp 適用後の行列
	 */
	public exp(): this {
		return this._mapValues((v) => v.exp());
	}

	/**
	 * 各要素の 2 のべき乗を計算する
	 * @returns exp2 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 */
	public exp2(): this {
		return this._mapValues((v) => v.pow(2));
	}

	/**
	 * 各要素の exp(x) - 1 を計算する
	 * @returns expm1 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public expm1(): this {
		return this._mapValues((v) => v.expm1());
	}

	/**
	 * 各要素の自然対数（ln）を計算する
	 * @returns ln 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	public ln(): this {
		return this._mapValues((v) => v.ln());
	}

	/**
	 * 各要素の任意の底の対数を計算する
	 * @param base - 対数の底（行列またはスカラー）
	 * @returns 対数計算後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	public log(base: BigFloatInputValue | BigFloatAnyMatrixLike): this {
		return this._mapWithOperand(base, (l, r) => l.log(r));
	}

	/**
	 * 各要素の 2 を底とする対数を計算する
	 * @returns log2 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	public log2(): this {
		return this._mapValues((v) => v.log(2));
	}

	/**
	 * 各要素の 10 を底とする対数を計算する
	 * @returns log10 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	public log10(): this {
		return this._mapValues((v) => v.log(10));
	}

	/**
	 * 各要素の ln(1 + x) を計算する
	 * @returns log1p 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log1p(): this {
		return this._mapValues((v) => v.add(1).ln());
	}

	/**
	 * 各要素のガンマ関数を計算する
	 * @returns ガンマ関数を適用した行列
	 * @throws {TypeError} 実数でない複素数が含まれる場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public gamma(): this {
		// Not implemented in BigFloatComplex
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("gamma is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.gamma(), 0, v.precision);
		});
	}

	/**
	 * 各要素のゼータ関数を計算する
	 * @returns ゼータ関数を適用した行列
	 * @throws {TypeError} 実数でない複素数が含まれる場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 */
	public zeta(): this {
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("zeta is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.zeta(), 0, v.precision);
		});
	}

	/**
	 * 各要素の階乗を計算する
	 * @returns 階乗適用後の行列
	 * @throws {TypeError} 実数でない複素数が含まれる場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public factorial(): this {
		return this._mapValues((v) => {
			if (!v.isReal()) throw new TypeError("factorial is not supported for non-real complex numbers");
			return new BigFloatComplex(v.real.factorial(), 0, v.precision);
		});
	}

	/**
	 * 行列のランクを計算する
	 * @returns ランク
	 */
	public rank(): number {
		return BigFloatComplexMatrix._reducedRowEchelon(this.toArray(), this.columnCount).pivotColumns.length;
	}
}
