import { BigFloat } from "./bigFloat";
import { BigFloatStream } from "./bigFloatStream";
import { BigFloatVector } from "./bigFloatVector";
import type { BigFloatValue, PrecisionValue } from "./types";

type BigFloatMatrixRowSource = Iterable<BigFloatValue>;
type BigFloatMatrixSource = Iterable<BigFloatMatrixRowSource>;
type BigFloatMatrixOperand = BigFloatMatrix | BigFloatMatrixSource;
type BigFloatMatrixRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};

/**
 * BigFloat を固定長行列として扱うクラス
 */
export class BigFloatMatrix implements Iterable<BigFloatVector> {
	/** 内部要素 */
	protected _values: BigFloat[][];

	/**
	 * @param rows - 行列要素
	 * @param precision - 変換時の精度
	 */
	public constructor(rows: BigFloatMatrixSource = [], precision?: PrecisionValue) {
		const rawRows = Array.from(rows, (row) => Array.from(row));
		BigFloatMatrix._assertRectangularRaw(rawRows);
		const resolvedPrecision = BigFloatMatrix._resolvePrecision(rawRows.flat(), precision);
		this._values = rawRows.map((row) => row.map((value) => BigFloatMatrix._toBigFloat(value, resolvedPrecision)));
	}

	/** 内部配列から行列を生成する */
	protected static _fromBigFloatGrid(values: BigFloat[][]): BigFloatMatrix {
		const matrix = Object.create(BigFloatMatrix.prototype) as BigFloatMatrix;
		matrix._values = values;
		return matrix;
	}

	/** 値をBigFloatへ変換する */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat {
		if (value instanceof BigFloat) {
			const cloned = value.clone();
			if (precision === undefined || cloned._precision === precision) return cloned;
			return cloned.changePrecision(precision);
		}
		return new BigFloat(value, precision ?? BigFloat.DEFAULT_PRECISION);
	}

	/** 精度を解決する */
	protected static _resolvePrecision(values: BigFloatValue[], precision?: PrecisionValue): bigint {
		if (precision !== undefined) return BigInt(precision);
		let resolved = BigFloat.DEFAULT_PRECISION;
		for (const value of values) {
			if (value instanceof BigFloat && value._precision > resolved) resolved = value._precision;
		}
		return resolved;
	}

	/**
	 * 次元を正規化する
	 * @throws {RangeError} size が負または非有限の場合
	 */
	protected static _normalizeSize(size: number, name: string): number {
		if (!Number.isFinite(size)) throw new RangeError(`${name} must be finite`);
		const normalized = Math.trunc(size);
		if (normalized < 0) throw new RangeError(`${name} must be non-negative`);
		return normalized;
	}

	/**
	 * 生配列が長方形か検証する
	 * @throws {RangeError} 行列の行が同じ長さを持たない場合
	 */
	protected static _assertRectangularRaw(rows: BigFloatValue[][]): void {
		if (rows.length === 0) return;
		const columnCount = rows[0].length;
		for (const row of rows) {
			if (row.length !== columnCount) throw new RangeError("Matrix rows must have the same length");
		}
	}

	/**
	 * 同形状か検証する
	 * @throws {RangeError} 行列の形状が異なる場合
	 */
	protected static _assertSameShape(left: BigFloatMatrix, right: BigFloatMatrix): void {
		if (left.rowCount !== right.rowCount || left.columnCount !== right.columnCount) {
			throw new RangeError("Matrix shapes must match");
		}
	}

	/**
	 * 正方行列か検証する
	 * @throws {RangeError} 行列が正方行列でない場合
	 */
	protected static _assertSquare(matrix: BigFloatMatrix): void {
		if (!matrix.isSquare()) throw new RangeError("Matrix must be square");
	}

	/**
	 * 行列積可能か検証する
	 * @throws {RangeError} 行列の内積次元が一致しない場合
	 */
	protected static _assertMultipliable(left: BigFloatMatrix, right: BigFloatMatrix): void {
		if (left.columnCount !== right.rowCount) throw new RangeError("Inner matrix dimensions must agree");
	}

	/** 微小値を返す */
	protected static _epsilon(precision: bigint): BigFloat {
		if (precision <= 0n) return new BigFloat(1, 0);
		return new BigFloat(1, precision).div(10n ** precision);
	}

	/** 行列または生データを行列化する */
	protected static _coerceMatrix(value: BigFloatMatrixOperand, referenceValues: BigFloatValue[] = []): BigFloatMatrix {
		if (value instanceof BigFloatMatrix) return value;
		const rows = Array.from(value, (row) => Array.from(row));
		const resolvedPrecision = BigFloatMatrix._resolvePrecision([...referenceValues, ...rows.flat()]);
		return BigFloatMatrix.from(rows, resolvedPrecision);
	}

	/** ベクトルまたは生データをベクトル化する */
	protected static _coerceVector(value: BigFloatVector | Iterable<BigFloatValue>, referenceValues: BigFloatValue[] = []): BigFloatVector {
		if (value instanceof BigFloatVector) return value;
		const values = Array.from(value);
		const resolvedPrecision = BigFloatMatrix._resolvePrecision([...referenceValues, ...values]);
		return BigFloatVector.from(values, resolvedPrecision);
	}

	/** 要素列を平坦化する */
	protected _flattenValues(): BigFloat[] {
		return this._values.flat();
	}

	/** 要素ごとの写像を行う */
	protected _mapValues(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this {
		const values = this._values.map((currentRow, rowIndex) =>
			currentRow.map((value, columnIndex) => {
				const mapped = fn(value.clone(), rowIndex, columnIndex);
				return mapped instanceof BigFloat ? mapped.clone() : BigFloatMatrix._toBigFloat(mapped, value._precision);
			}),
		);
		return BigFloatMatrix._fromBigFloatGrid(values) as this;
	}

	/** 要素ごとの二項演算を行う */
	protected _mapWithOperand(other: BigFloatMatrixOperand | BigFloatValue, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this {
		if (other instanceof BigFloatMatrix || (typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat))) {
			const matrix = BigFloatMatrix._coerceMatrix(other as BigFloatMatrixOperand, this._flattenValues());
			BigFloatMatrix._assertSameShape(this, matrix);
			const values = this._values.map((currentRow, rowIndex) =>
				currentRow.map((value, columnIndex) => {
					const mapped = fn(value.clone(), matrix._values[rowIndex][columnIndex].clone(), rowIndex, columnIndex);
					return mapped instanceof BigFloat ? mapped.clone() : BigFloatMatrix._toBigFloat(mapped, value._precision);
				}),
			);
			return BigFloatMatrix._fromBigFloatGrid(values) as this;
		}

		return this._mapValues((value, row, column) => fn(value, BigFloatMatrix._toBigFloat(other as BigFloatValue, value._precision), row, column));
	}

	/** RREF を計算する */
	protected static _reducedRowEchelon(values: BigFloat[][], leftColumnCount = values[0]?.length ?? 0): { values: BigFloat[][]; pivotColumns: number[] } {
		const rows = values.map((row) => row.map((value) => value.clone()));
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

	/** 空行列を生成する */
	public static empty(): BigFloatMatrix {
		return this._fromBigFloatGrid([]);
	}

	/** 行列データから生成する */
	public static from(rows: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix {
		return new BigFloatMatrix(rows, precision);
	}

	/** 行ベクトル群から生成する */
	public static fromRows(rows: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix {
		return this.from(rows, precision);
	}

	/**
	 * 列ベクトル群から生成する
	 * @throws {RangeError} 列ベクトルの長さが異なる場合
	 */
	public static fromColumns(columns: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix {
		const rawColumns = Array.from(columns, (column) => Array.from(column));
		if (rawColumns.length === 0) return this.empty();
		const rowCount = rawColumns[0].length;
		for (const column of rawColumns) {
			if (column.length !== rowCount) throw new RangeError("Matrix columns must have the same length");
		}
		const rows = Array.from({ length: rowCount }, (_, rowIndex) => rawColumns.map((column) => column[rowIndex]));
		return this.from(rows, precision);
	}

	/** 行の並びから生成する */
	public static of(...rows: BigFloatValue[][]): BigFloatMatrix {
		return this.from(rows);
	}

	/** 指定値で埋めた行列を生成する */
	public static fill(rowCount: number, columnCount: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatMatrix {
		const normalizedRows = this._normalizeSize(rowCount, "Row count");
		const normalizedColumns = this._normalizeSize(columnCount, "Column count");
		if (normalizedRows === 0 || normalizedColumns === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([value], precision);
		const base = this._toBigFloat(value, resolvedPrecision);
		return this._fromBigFloatGrid(Array.from({ length: normalizedRows }, () => Array.from({ length: normalizedColumns }, () => base.clone())));
	}

	/** 0行列を生成する */
	public static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix {
		return this.fill(rowCount, columnCount, 0, precision);
	}

	/** 1行列を生成する */
	public static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix {
		return this.fill(rowCount, columnCount, 1, precision);
	}

	/** 単位行列を生成する */
	public static identity(size: number, precision?: PrecisionValue): BigFloatMatrix {
		const normalizedSize = this._normalizeSize(size, "Matrix size");
		const resolvedPrecision = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return this._fromBigFloatGrid(Array.from({ length: normalizedSize }, (_, row) => Array.from({ length: normalizedSize }, (_, column) => new BigFloat(row === column ? 1 : 0, resolvedPrecision))));
	}

	/** 対角行列を生成する */
	public static diagonal(values: Iterable<BigFloatValue>, precision?: PrecisionValue): BigFloatMatrix {
		const entries = Array.from(values);
		const resolvedPrecision = this._resolvePrecision(entries, precision);
		return this._fromBigFloatGrid(entries.map((value, row) => entries.map((_, column) => (row === column ? this._toBigFloat(value, resolvedPrecision) : new BigFloat(0, resolvedPrecision)))));
	}

	/**
	 * 乱数行列を生成する
	 * @throws {RangeError} max < min の場合
	 */
	public static random(rowCount: number, columnCount: number, options: BigFloatMatrixRandomOptions = {}): BigFloatMatrix {
		const normalizedRows = this._normalizeSize(rowCount, "Row count");
		const normalizedColumns = this._normalizeSize(columnCount, "Column count");
		if (normalizedRows === 0 || normalizedColumns === 0) return this.empty();
		const min = options.min ?? 0;
		const max = options.max ?? 1;
		const resolvedPrecision = this._resolvePrecision([min, max], options.precision);
		const minValue = this._toBigFloat(min, resolvedPrecision);
		const maxValue = this._toBigFloat(max, resolvedPrecision);
		const span = maxValue.sub(minValue);
		if (span.lt(0)) throw new RangeError("Random range requires max >= min");
		if (span.isZero()) return this.fill(normalizedRows, normalizedColumns, minValue, resolvedPrecision);
		return this._fromBigFloatGrid(Array.from({ length: normalizedRows }, () => Array.from({ length: normalizedColumns }, () => minValue.add(span.mul(BigFloat.random(resolvedPrecision))))));
	}

	/** 行数 */
	public get rowCount(): number {
		return this._values.length;
	}

	/** 列数 */
	public get columnCount(): number {
		return this.rowCount === 0 ? 0 : this._values[0].length;
	}

	/** 形状を返す */
	public shape(): [number, number] {
		return [this.rowCount, this.columnCount];
	}

	/** 空行列かどうか */
	public isEmpty(): boolean {
		return this.rowCount === 0 || this.columnCount === 0;
	}

	/** 正方行列かどうか */
	public isSquare(): boolean {
		return this.rowCount === this.columnCount;
	}

	/** 要素を取得する */
	public at(row: number, column: number): BigFloat | undefined {
		if (row < 0 || column < 0 || row >= this.rowCount || column >= this.columnCount) return undefined;
		return this._values[row][column].clone();
	}

	/** 行を取得する */
	public row(index: number): BigFloatVector | undefined {
		if (index < 0 || index >= this.rowCount) return undefined;
		return BigFloatVector.from(this._values[index].map((value) => value.clone()));
	}

	/** 列を取得する */
	public column(index: number): BigFloatVector | undefined {
		if (index < 0 || index >= this.columnCount) return undefined;
		return BigFloatVector.from(this._values.map((row) => row[index].clone()));
	}

	/** 対角成分を取得する */
	public diagonalVector(): BigFloatVector {
		BigFloatMatrix._assertSquare(this);
		return BigFloatVector.from(this._values.map((row, index) => row[index].clone()));
	}

	/** 行列を複製する */
	public clone(): BigFloatMatrix {
		return BigFloatMatrix._fromBigFloatGrid(this._values.map((row) => row.map((value) => value.clone())));
	}

	/** 配列へ変換する */
	public toArray(): BigFloat[][] {
		return this._values.map((row) => row.map((value) => value.clone()));
	}

	/** 行ベクトル配列へ変換する */
	public toVectors(): BigFloatVector[] {
		return this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())));
	}

	/** 平坦化ベクトルへ変換する */
	public flatten(): BigFloatVector {
		return BigFloatVector.from(this._flattenValues().map((value) => value.clone()));
	}

	/** Stream へ変換する */
	public toStream(): BigFloatStream {
		return this.flatten().toStream();
	}

	/** 行イテレータ */
	public [Symbol.iterator](): Iterator<BigFloatVector, void, undefined> {
		return this.toVectors()[Symbol.iterator]();
	}

	/** 各要素へ処理を適用する */
	public forEach(fn: (value: BigFloat, row: number, column: number) => void): void {
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				fn(this._values[row][column].clone(), row, column);
			}
		}
	}

	/** 要素ごとに変換する */
	public map(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this {
		return this._mapValues(fn);
	}

	/** 2つの行列を要素ごとに変換する */
	public zipMap(other: BigFloatMatrixOperand, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this {
		return this._mapWithOperand(other, fn);
	}

	/** 畳み込み処理を行う */
	public reduce<U>(fn: (acc: U, value: BigFloat, row: number, column: number) => U, initial: U): U {
		let acc = initial;
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				acc = fn(acc, this._values[row][column].clone(), row, column);
			}
		}
		return acc;
	}

	/** 条件に一致する要素があるか */
	public some(fn: (value: BigFloat, row: number, column: number) => boolean): boolean {
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				if (fn(this._values[row][column].clone(), row, column)) return true;
			}
		}
		return false;
	}

	/** すべての要素が条件を満たすか */
	public every(fn: (value: BigFloat, row: number, column: number) => boolean): boolean {
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				if (!fn(this._values[row][column].clone(), row, column)) return false;
			}
		}
		return true;
	}

	/**
	 * 行方向に連結する
	 * @throws {RangeError} 列数が一致しない場合
	 */
	public concatRows(...others: BigFloatMatrixOperand[]): this {
		const values = this.toArray();
		for (const other of others) {
			const matrix = BigFloatMatrix._coerceMatrix(other, this._flattenValues());
			if (this.columnCount !== 0 && matrix.columnCount !== this.columnCount) throw new RangeError("Column counts must match");
			values.push(...matrix.toArray());
		}
		return BigFloatMatrix._fromBigFloatGrid(values) as this;
	}

	/**
	 * 列方向に連結する
	 * @throws {RangeError} 行数が一致しない場合
	 */
	public concatColumns(...others: BigFloatMatrixOperand[]): this {
		let result = this.clone();
		for (const other of others) {
			const matrix = BigFloatMatrix._coerceMatrix(other, result._flattenValues());
			if (result.rowCount !== matrix.rowCount) throw new RangeError("Row counts must match");
			result = BigFloatMatrix._fromBigFloatGrid(result._values.map((row, rowIndex) => [...row.map((value) => value.clone()), ...matrix._values[rowIndex].map((value) => value.clone())]));
		}
		return result as this;
	}

	/** 行スライス */
	public sliceRows(start?: number, end?: number): this {
		return BigFloatMatrix._fromBigFloatGrid(this._values.slice(start, end).map((row) => row.map((value) => value.clone()))) as this;
	}

	/** 列スライス */
	public sliceColumns(start?: number, end?: number): this {
		return BigFloatMatrix._fromBigFloatGrid(this._values.map((row) => row.slice(start, end).map((value) => value.clone()))) as this;
	}

	/** 転置行列を返す */
	public transpose(): this {
		if (this.isEmpty()) return BigFloatMatrix.empty() as this;
		return BigFloatMatrix._fromBigFloatGrid(Array.from({ length: this.columnCount }, (_, column) => this._values.map((row) => row[column].clone()))) as this;
	}

	/** 一致判定 */
	public equals(other: BigFloatMatrixOperand): boolean {
		const matrix = BigFloatMatrix._coerceMatrix(other, this._flattenValues());
		if (this.rowCount !== matrix.rowCount || this.columnCount !== matrix.columnCount) return false;
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				if (!this._values[row][column].eq(matrix._values[row][column])) return false;
			}
		}
		return true;
	}

	/** すべての要素の精度を変更する */
	public changePrecision(precision: PrecisionValue): this {
		const precisionBig = BigInt(precision);
		return this._mapValues((value) => value.changePrecision(precisionBig));
	}

	/** 各要素へ加算する */
	public add(other: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(other, (left, right) => left.add(right));
	}

	/** 各要素から減算する */
	public sub(other: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(other, (left, right) => left.sub(right));
	}

	/** スカラ倍する */
	public mul(scalar: BigFloatValue): this {
		return this._mapValues((value) => value.mul(scalar));
	}

	/** スカラ除算する */
	public div(scalar: BigFloatValue): this {
		return this._mapValues((value) => value.div(scalar));
	}

	/** 剰余を計算する */
	public mod(other: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(other, (left, right) => left.mod(right));
	}

	/** 要素ごとの積を計算する */
	public hadamard(other: BigFloatMatrixOperand): this {
		return this._mapWithOperand(other, (left, right) => left.mul(right));
	}

	/** 符号反転する */
	public neg(): this {
		return this._mapValues((value) => value.neg());
	}

	/** 絶対値化する */
	public abs(): this {
		return this._mapValues((value) => value.abs());
	}

	/** 符号行列を返す */
	public sign(): this {
		return this._mapValues((value) => value.sign());
	}

	/** 逆数行列を返す */
	public reciprocal(): this {
		return this._mapValues((value) => value.reciprocal());
	}

	/** 要素ごとの冪乗を計算する */
	public pow(exponent: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(exponent, (left, right) => left.pow(right));
	}

	/** 各要素の平方根を計算する */
	public sqrt(): this {
		return this._mapValues((value) => value.sqrt());
	}

	/** 各要素の立方根を計算する */
	public cbrt(): this {
		return this._mapValues((value) => value.cbrt());
	}

	/** 各要素のn乗根を計算する */
	public nthRoot(n: number | bigint): this {
		return this._mapValues((value) => value.nthRoot(n));
	}

	/** 切り下げる */
	public floor(): this {
		return this._mapValues((value) => value.floor());
	}

	/** 切り上げる */
	public ceil(): this {
		return this._mapValues((value) => value.ceil());
	}

	/** 四捨五入する */
	public round(): this {
		return this._mapValues((value) => value.round());
	}

	/** 0方向へ切り捨てる */
	public trunc(): this {
		return this._mapValues((value) => value.trunc());
	}

	/** Float32相当に丸める */
	public fround(): this {
		return this._mapValues((value) => value.fround());
	}

	/** 先頭ゼロビット数を返す */
	public clz32(): this {
		return this._mapValues((value) => value.clz32());
	}

	/** 相対差を計算する */
	public relativeDiff(other: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(other, (left, right) => left.relativeDiff(right));
	}

	/** 絶対差を計算する */
	public absoluteDiff(other: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(other, (left, right) => left.absoluteDiff(right));
	}

	/** 百分率差分を計算する */
	public percentDiff(other: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(other, (left, right) => left.percentDiff(right));
	}

	/** 正弦を計算する */
	public sin(): this {
		return this._mapValues((value) => value.sin());
	}

	/** 余弦を計算する */
	public cos(): this {
		return this._mapValues((value) => value.cos());
	}

	/** 正接を計算する */
	public tan(): this {
		return this._mapValues((value) => value.tan());
	}

	/** 逆正弦を計算する */
	public asin(): this {
		return this._mapValues((value) => value.asin());
	}

	/** 逆余弦を計算する */
	public acos(): this {
		return this._mapValues((value) => value.acos());
	}

	/** 逆正接を計算する */
	public atan(): this {
		return this._mapValues((value) => value.atan());
	}

	/** atan2 を計算する */
	public atan2(x: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(x, (left, right) => left.atan2(right));
	}

	/** 双曲線正弦を計算する */
	public sinh(): this {
		return this._mapValues((value) => value.sinh());
	}

	/** 双曲線余弦を計算する */
	public cosh(): this {
		return this._mapValues((value) => value.cosh());
	}

	/** 双曲線正接を計算する */
	public tanh(): this {
		return this._mapValues((value) => value.tanh());
	}

	/** 逆双曲線正弦を計算する */
	public asinh(): this {
		return this._mapValues((value) => value.asinh());
	}

	/** 逆双曲線余弦を計算する */
	public acosh(): this {
		return this._mapValues((value) => value.acosh());
	}

	/** 逆双曲線正接を計算する */
	public atanh(): this {
		return this._mapValues((value) => value.atanh());
	}

	/** 指数関数を計算する */
	public exp(): this {
		return this._mapValues((value) => value.exp());
	}

	/** 2冪指数関数を計算する */
	public exp2(): this {
		return this._mapValues((value) => value.exp2());
	}

	/** exp(x)-1 を計算する */
	public expm1(): this {
		return this._mapValues((value) => value.expm1());
	}

	/** 自然対数を計算する */
	public ln(): this {
		return this._mapValues((value) => value.ln());
	}

	/** 対数を計算する */
	public log(base: BigFloatValue | BigFloatMatrixOperand): this {
		return this._mapWithOperand(base, (left, right) => left.log(right));
	}

	/** 底2対数を計算する */
	public log2(): this {
		return this._mapValues((value) => value.log2());
	}

	/** 底10対数を計算する */
	public log10(): this {
		return this._mapValues((value) => value.log10());
	}

	/** log(1+x) を計算する */
	public log1p(): this {
		return this._mapValues((value) => value.log1p());
	}

	/** ガンマ関数を計算する */
	public gamma(): this {
		return this._mapValues((value) => value.gamma());
	}

	/** ゼータ関数を計算する */
	public zeta(): this {
		return this._mapValues((value) => value.zeta());
	}

	/** 階乗を計算する */
	public factorial(): this {
		return this._mapValues((value) => value.factorial());
	}

	/**
	 * 最大値を返す
	 * @throws {TypeError} 行列が空の場合
	 */
	public max(): BigFloat {
		if (this.isEmpty()) throw new TypeError("No arguments provided");
		let result = this._values[0][0];
		for (const row of this._values) {
			for (const value of row) {
				if (value.gt(result)) result = value;
			}
		}
		return result.clone();
	}

	/**
	 * 最小値を返す
	 * @throws {TypeError} 行列が空の場合
	 */
	public min(): BigFloat {
		if (this.isEmpty()) throw new TypeError("No arguments provided");
		let result = this._values[0][0];
		for (const row of this._values) {
			for (const value of row) {
				if (value.lt(result)) result = value;
			}
		}
		return result.clone();
	}

	/** 合計を返す */
	public sum(): BigFloat {
		if (this.isEmpty()) return new BigFloat(0);
		return this.flatten().sum();
	}

	/** 積を返す */
	public product(): BigFloat {
		if (this.isEmpty()) return new BigFloat(1);
		return this.flatten().product();
	}

	/** 平均を返す */
	public average(): BigFloat {
		if (this.isEmpty()) return new BigFloat(0);
		return this.sum().div(this.rowCount * this.columnCount);
	}

	/** 行和ベクトルを返す */
	public rowSums(): BigFloatVector {
		return BigFloatVector.from(this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())).sum()));
	}

	/** 列和ベクトルを返す */
	public columnSums(): BigFloatVector {
		if (this.isEmpty()) return BigFloatVector.empty();
		const resolvedPrecision = BigFloatMatrix._resolvePrecision(this._flattenValues());
		return BigFloatVector.from(Array.from({ length: this.columnCount }, (_, column) => this._values.reduce((acc, row) => acc.add(row[column]), new BigFloat(0, resolvedPrecision))));
	}

	/** トレースを返す */
	public trace(): BigFloat {
		BigFloatMatrix._assertSquare(this);
		const resolvedPrecision = BigFloatMatrix._resolvePrecision(this._flattenValues());
		let total = new BigFloat(0, resolvedPrecision);
		for (let index = 0; index < this.rowCount; index++) {
			total = total.add(this._values[index][index]);
		}
		return total;
	}

	/** Frobenius ノルムを返す */
	public frobeniusNorm(): BigFloat {
		return this.flatten().squaredNorm().sqrt();
	}

	/** 行列積を計算する */
	public matmul(other: BigFloatMatrixOperand): this {
		const matrix = BigFloatMatrix._coerceMatrix(other, this._flattenValues());
		BigFloatMatrix._assertMultipliable(this, matrix);
		if (this.rowCount === 0 || this.columnCount === 0 || matrix.columnCount === 0) return BigFloatMatrix.empty() as this;
		const resolvedPrecision = BigFloatMatrix._resolvePrecision([...this._flattenValues(), ...matrix._flattenValues()]);
		const values = Array.from({ length: this.rowCount }, (_, row) =>
			Array.from({ length: matrix.columnCount }, (_, column) => {
				let total = new BigFloat(0, resolvedPrecision);
				for (let index = 0; index < this.columnCount; index++) {
					total = total.add(this._values[row][index].mul(matrix._values[index][column]));
				}
				return total;
			}),
		);
		return BigFloatMatrix._fromBigFloatGrid(values) as this;
	}

	/**
	 * ベクトル積を計算する
	 * @throws {RangeError} 内部次元が一致しない場合
	 */
	public mulVector(vector: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector {
		const rhs = BigFloatMatrix._coerceVector(vector, this._flattenValues());
		if (this.columnCount !== rhs.length) throw new RangeError("Inner matrix dimensions must agree");
		return BigFloatVector.from(this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())).dot(rhs)));
	}

	/** 行列式を返す */
	public determinant(): BigFloat {
		BigFloatMatrix._assertSquare(this);
		const size = this.rowCount;
		if (size === 0) return new BigFloat(1);
		const values = this.toArray();
		let sign = 1;
		let det = new BigFloat(1, BigFloatMatrix._resolvePrecision(this._flattenValues()));

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
			if (bestRow === -1) return new BigFloat(0, det._precision);
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

	/** ランクを返す */
	public rank(): number {
		return BigFloatMatrix._reducedRowEchelon(this.toArray(), this.columnCount).pivotColumns.length;
	}

	/** 逆行列を返す */
	public inverse(): this {
		BigFloatMatrix._assertSquare(this);
		const identity = BigFloatMatrix.identity(this.rowCount, BigFloatMatrix._resolvePrecision(this._flattenValues()));
		return this.solveMatrix(identity) as this;
	}

	/**
	 * 連立方程式 Ax=b を解く
	 * @throws {RangeError} 行列が特異な場合
	 */
	public solveVector(rhs: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector {
		BigFloatMatrix._assertSquare(this);
		const vector = BigFloatMatrix._coerceVector(rhs, this._flattenValues());
		if (vector.length !== this.rowCount) throw new RangeError("Right-hand side vector length must match row count");
		const solution = this.solveMatrix(BigFloatMatrix.fromColumns([vector.toArray()]));
		return solution.column(0) ?? BigFloatVector.empty();
	}

	/**
	 * 連立方程式 AX=B を解く
	 * @throws {RangeError} 右辺の行数が一致しない場合
	 */
	public solveMatrix(rhs: BigFloatMatrixOperand): this {
		BigFloatMatrix._assertSquare(this);
		const right = BigFloatMatrix._coerceMatrix(rhs, this._flattenValues());
		if (right.rowCount !== this.rowCount) throw new RangeError("Right-hand side row count must match");
		const size = this.rowCount;
		const augmented = this._values.map((row, rowIndex) => [...row.map((value) => value.clone()), ...right._values[rowIndex].map((value) => value.clone())]);
		const { values, pivotColumns } = BigFloatMatrix._reducedRowEchelon(augmented, size);
		if (pivotColumns.length !== size) throw new RangeError("Matrix is singular");
		const epsilon = BigFloatMatrix._epsilon(BigFloatMatrix._resolvePrecision([...this._flattenValues(), ...right._flattenValues()]));
		for (let row = 0; row < size; row++) {
			for (let column = 0; column < size; column++) {
				const expected = new BigFloat(row === column ? 1 : 0, epsilon._precision);
				if (values[row][column].absoluteDiff(expected).gt(epsilon)) throw new RangeError("Matrix is singular");
			}
		}
		return BigFloatMatrix._fromBigFloatGrid(values.map((row) => row.slice(size))) as this;
	}

	/**
	 * 行列累乗を返す
	 * @throws {RangeError} 指数が整数でない場合
	 */
	public matrixPow(exponent: number): this {
		BigFloatMatrix._assertSquare(this);
		if (!Number.isFinite(exponent) || !Number.isInteger(exponent)) throw new RangeError("Matrix exponent must be an integer");
		if (exponent === 0) return BigFloatMatrix.identity(this.rowCount, BigFloatMatrix._resolvePrecision(this._flattenValues())) as this;
		if (exponent < 0) return this.inverse().matrixPow(-exponent);

		let result = BigFloatMatrix.identity(this.rowCount, BigFloatMatrix._resolvePrecision(this._flattenValues()));
		let base = this.clone();
		let power = exponent;
		while (power > 0) {
			if ((power & 1) === 1) result = result.matmul(base);
			power >>= 1;
			if (power > 0) base = base.matmul(base);
		}
		return result as this;
	}
}
