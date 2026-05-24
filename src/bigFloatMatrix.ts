import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import { BigFloatComplexMatrix } from "./bigFloatComplexMatrix";
import { BigFloatStream } from "./bigFloatStream";
import { BigFloatVector } from "./bigFloatVector";
import type { BigFloatAnyMatrix, BigFloatAnyMatrixLike, BigFloatComplexMatrixLike, BigFloatInputValue, BigFloatLike, BigFloatMatrixLike, BigFloatValue, BigFloatVectorLike, PrecisionValue } from "./types";

type BigFloatMatrixRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};

/**
 * BigFloat を固定長行列として扱うクラス
 */
export class BigFloatMatrix implements Iterable<BigFloatVector> {
	/** 内部要素 (行ごとの配列) */
	public _values: BigFloat[][];

	/**
	 * BigFloatMatrix コンストラクタ
	 * @param rows - 行列要素の反復可能オブジェクト
	 * @param precision - 変換時の精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} 行列の行が同じ長さを持たない場合
	 */
	public constructor(rows: BigFloatMatrixLike = [], precision?: PrecisionValue) {
		const rawRows = Array.from(rows, (row) => Array.from(row)) as BigFloatValue[][];
		BigFloatMatrix._assertRectangularRaw(rawRows);
		const resolvedPrecision = BigFloatMatrix._resolvePrecision(rawRows.flat(), precision);
		this._values = rawRows.map((row) => row.map((value) => BigFloatMatrix._toBigFloat(value, resolvedPrecision)));
	}

	/**
	 * 内部配列から行列を生成する (内部用)
	 * @param values - BigFloat の二次元配列
	 * @returns BigFloatMatrix インスタンス
	 */
	protected static _fromBigFloatGrid(values: BigFloat[][]): BigFloatMatrix;
	/**
	 * 内部配列から複素行列を生成する (内部用)
	 * @param values - BigFloatComplex の二次元配列
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	protected static _fromBigFloatGrid(values: BigFloatComplex[][]): BigFloatComplexMatrix;
	/**
	 * 内部配列から行列を生成する (内部用)
	 * @param values - 値の二次元配列
	 * @returns 行列インスタンス
	 */
	protected static _fromBigFloatGrid(values: BigFloatLike[][]): BigFloatAnyMatrix;
	/**
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _fromBigFloatGrid(values: BigFloatLike[][]): BigFloatAnyMatrix {
		let matrix: BigFloatAnyMatrix;
		if (values.every((r) => r.every((c) => c instanceof BigFloat))) {
			matrix = new this();
			matrix._values = values;
		} else {
			matrix = new BigFloatComplexMatrix();
			matrix._values = values.map((r) => r.map((c) => BigFloatComplex.from(c)));
		}
		return matrix;
	}

	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象の値
	 * @param precision - 精度
	 * @returns BigFloat インスタンス
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象の複素数
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	protected static _toBigFloat(value: BigFloatComplex, precision?: bigint): BigFloatComplex;
	/**
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toBigFloat(value: BigFloatInputValue, precision?: bigint): BigFloatLike {
		if (value instanceof BigFloat) {
			const cloned = value.clone();
			if (precision === undefined || cloned._precision === precision) return cloned;
			return cloned.changePrecision(precision);
		}
		if (value instanceof BigFloatComplex) {
			const cloned = value.clone();
			if (precision === undefined || cloned.precision === precision) return cloned;
			return cloned.changePrecision(precision);
		}
		return new BigFloat(value, precision ?? BigFloat.DEFAULT_PRECISION);
	}

	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatVectorLike, precision?: PrecisionValue): bigint {
		if (precision !== undefined) return BigInt(precision);
		let resolved = BigFloat.DEFAULT_PRECISION;
		for (const value of values) {
			if (value instanceof BigFloat && value._precision > resolved) resolved = value._precision;
		}
		return resolved;
	}

	/**
	 * 次元を正規化する
	 * @param size - 元のサイズ
	 * @param name - パラメータ名
	 * @returns 正規化されたサイズ
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
	protected static _assertRectangularRaw(rows: BigFloatInputValue[][]): void {
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

	/**
	 * 指定された精度の微小値 (10^-precision) を返す (内部用)
	 * @param precision - 精度
	 * @returns 微小値
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _epsilon(precision: bigint): BigFloat {
		if (precision <= 0n) return new BigFloat(1, 0);
		return new BigFloat(1, precision).div(10n ** precision);
	}

	/**
	 * 任意入力を BigFloatMatrix へ変換する (内部用)
	 * @param value - 変換対象
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns BigFloatMatrix インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected static _coerceMatrix(value: BigFloatMatrixLike, referenceValues: BigFloatVectorLike = []): BigFloatMatrix {
		if (value instanceof BigFloatMatrix) return value;
		const rows = Array.from(value, (row) => Array.from(row));
		const resolvedPrecision = BigFloatMatrix._resolvePrecision([...referenceValues, ...rows.flat()]);
		return BigFloatMatrix.from(rows, resolvedPrecision);
	}

	/**
	 * 任意入力を BigFloatVector へ変換する (内部用)
	 * @param value - 変換対象
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns BigFloatVector インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	protected static _coerceVector(value: BigFloatVectorLike, referenceValues: BigFloatValue[] = []): BigFloatVector {
		if (value instanceof BigFloatVector) return value;
		const values = Array.from(value);
		const resolvedPrecision = BigFloatMatrix._resolvePrecision([...referenceValues, ...values]);
		return BigFloatVector.from(values, resolvedPrecision);
	}

	/**
	 * 全要素を一次元配列として取得する (内部用)
	 * @returns 要素の平坦化配列
	 */
	protected _flattenValues(): BigFloat[] {
		return this._values.flat();
	}

	/**
	 * 各要素に関数を適用して新しい実数行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい実数行列
	 */
	protected _mapValues(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this | BigFloatMatrix;
	/**
	 * 各要素に関数を適用して新しい複素行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい複素行列
	 */
	protected _mapValues(fn: (value: BigFloatLike, row: number, column: number) => BigFloatInputValue): BigFloatComplexMatrix;
	/**
	 * 各要素に関数を適用して新しい行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい行列
	 */
	protected _mapValues(fn: ((value: BigFloat, row: number, column: number) => BigFloatValue) | ((value: BigFloatLike, row: number, column: number) => BigFloatInputValue)): this | BigFloatAnyMatrix;
	/**
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected _mapValues(fn: ((value: BigFloat, row: number, column: number) => BigFloatValue) | ((value: BigFloatLike, row: number, column: number) => BigFloatInputValue)): this | BigFloatAnyMatrix {
		const values = this._values.map((currentRow, rowIndex) =>
			currentRow.map((value, columnIndex) => {
				const mapped = fn(value.clone(), rowIndex, columnIndex);
				return mapped instanceof BigFloat || mapped instanceof BigFloatComplex ? mapped.clone() : BigFloatMatrix._toBigFloat(mapped, value._precision);
			}),
		);
		return BigFloatMatrix._fromBigFloatGrid(values);
	}

	/**
	 * オペランドを用いて各要素に関数を適用し、新しい実数行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい実数行列
	 */
	protected _mapWithOperand(other: BigFloatMatrixLike | BigFloatValue, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this | BigFloatMatrix;
	/**
	 * オペランドを用いて各要素に関数を適用し、新しい複素行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい複素行列
	 */
	protected _mapWithOperand(other: BigFloatAnyMatrixLike | BigFloatComplex, fn: (left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatInputValue): BigFloatComplexMatrix;
	/**
	 * オペランドを用いて各要素に関数を適用し、新しい行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい行列
	 */
	protected _mapWithOperand(other: BigFloatAnyMatrixLike | BigFloatInputValue, fn: ((left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue) | ((left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatInputValue)): this | BigFloatAnyMatrix;
	/**
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 行列の形状が一致しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected _mapWithOperand(other: BigFloatAnyMatrixLike | BigFloatInputValue, fn: ((left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue) | ((left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatInputValue)): this | BigFloatAnyMatrix {
		if (other instanceof BigFloatComplexMatrix || BigFloat._isComplexValue(other)) {
			if (this._values.length > 0 && this._values[0].length > 0) {
				this._values[0][0]._assertComplexNumbersEnabled("operation");
			} else if (!BigFloat.config.allowComplexNumbers) {
				throw new TypeError("BigFloatMatrix operation does not accept BigFloatComplex by default. Enable config.allowComplexNumbers to allow complex results.");
			}
			return BigFloatComplexMatrix.from(this.toArray()).zipMap(other as BigFloatComplexMatrix, (l, r, row, col) => (fn as (left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatInputValue)(l.real, r, row, col));
		}

		if (other instanceof BigFloatMatrix || (typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat) && !(other instanceof BigFloatComplex))) {
			const matrix = BigFloatMatrix._coerceMatrix(other as BigFloatMatrixLike, this._flattenValues());
			BigFloatMatrix._assertSameShape(this, matrix);
			const values = this._values.map((currentRow, rowIndex) =>
				currentRow.map((value, columnIndex) => {
					const mapped = fn(value.clone(), matrix._values[rowIndex][columnIndex].clone(), rowIndex, columnIndex);
					return mapped instanceof BigFloat ? mapped.clone() : BigFloatMatrix._toBigFloat(mapped as BigFloatValue, value._precision);
				}),
			);
			return BigFloatMatrix._fromBigFloatGrid(values) as this;
		}

		return this._mapValues((value, row, column) => fn(value, BigFloatMatrix._toBigFloat(other as BigFloatValue, value._precision), row, column) as BigFloat);
	}

	/**
	 * 行列の簡約階段形式 (RREF) を計算する (内部用)
	 * @param values - 対象行列の二次元配列
	 * @param leftColumnCount - 掃き出し対象の列数
	 * @returns RREF 後の配列と主成分(ピボット)列のインデックス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
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

	/**
	 * 空の行列 (0x0) を生成する
	 * @returns 空の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static empty(): BigFloatMatrix {
		return this._fromBigFloatGrid([]);
	}

	/**
	 * 二次元配列から実数行列を生成する
	 * @param rows - 二次元配列
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	public static from(rows: BigFloatMatrixLike, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 二次元配列から複素行列を生成する
	 * @param rows - 二次元配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	public static from(rows: BigFloatComplexMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	public static from(rows: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatAnyMatrix {
		const rawRows = Array.from(rows as BigFloatMatrix, (row) => Array.from(row));
		if (rawRows.flat().some((v) => BigFloat._isComplexValue(v))) {
			if (!BigFloat.config.allowComplexNumbers) {
				throw new TypeError("BigFloatMatrix.from does not accept BigFloatComplex by default. Enable config.allowComplexNumbers to allow complex results.");
			}
			return BigFloatComplexMatrix.from(rawRows, precision);
		}
		return new BigFloatMatrix(rawRows, precision);
	}

	/**
	 * 行ベクトルのリストから行列を生成する
	 * @param rows - 行要素
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	public static fromRows(rows: BigFloatMatrixLike, precision?: PrecisionValue): BigFloatMatrix {
		return this.from(rows, precision);
	}

	/**
	 * 列ベクトル群から生成する
	 * @param columns - 列ベクトルのリスト
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} 列ベクトルの長さが異なる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static fromColumns(columns: BigFloatMatrixLike, precision?: PrecisionValue): BigFloatMatrix {
		const rawColumns = Array.from(columns, (column) => Array.from(column));
		if (rawColumns.length === 0) return this.empty();
		const rowCount = rawColumns[0].length;
		for (const column of rawColumns) {
			if (column.length !== rowCount) throw new RangeError("Matrix columns must have the same length");
		}
		const rows = Array.from({ length: rowCount }, (_, rowIndex) => rawColumns.map((column) => column[rowIndex]));
		return this.from(rows, precision);
	}

	/**
	 * 行配列の可変長引数から行列を生成する
	 * @param rows - 各行の要素配列
	 * @returns BigFloatMatrix インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	public static of(...rows: BigFloatVectorLike[]): BigFloatMatrix {
		return this.from(rows);
	}

	/**
	 * 指定した値で埋められた行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static fill(rowCount: number, columnCount: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatMatrix {
		const normalizedRows = this._normalizeSize(rowCount, "Row count");
		const normalizedColumns = this._normalizeSize(columnCount, "Column count");
		if (normalizedRows === 0 || normalizedColumns === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([value], precision);
		const base = this._toBigFloat(value, resolvedPrecision);
		return this._fromBigFloatGrid(Array.from({ length: normalizedRows }, () => Array.from({ length: normalizedColumns }, () => base.clone())));
	}

	/**
	 * 零行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix {
		return this.fill(rowCount, columnCount, 0, precision);
	}

	/**
	 * すべての要素が 1 の行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix {
		return this.fill(rowCount, columnCount, 1, precision);
	}

	/**
	 * 単位行列を生成する
	 * @param size - 次元数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static identity(size: number, precision?: PrecisionValue): BigFloatMatrix {
		const normalizedSize = this._normalizeSize(size, "Matrix size");
		const resolvedPrecision = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return this._fromBigFloatGrid(Array.from({ length: normalizedSize }, (_, row) => Array.from({ length: normalizedSize }, (_, column) => new BigFloat(row === column ? 1 : 0, resolvedPrecision))));
	}

	/**
	 * 対角要素を指定して対角行列を生成する
	 * @param values - 対角要素のリスト
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static diagonal(values: Iterable<BigFloatValue>, precision?: PrecisionValue): BigFloatMatrix {
		const entries = Array.from(values);
		const resolvedPrecision = this._resolvePrecision(entries, precision);
		return this._fromBigFloatGrid(entries.map((value, row) => entries.map((_, column) => (row === column ? this._toBigFloat(value, resolvedPrecision) : new BigFloat(0, resolvedPrecision)))));
	}

	/**
	 * 乱数行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param options - 乱数範囲と精度のオプション
	 * @returns 生成された行列
	 * @throws {RangeError} max < min の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
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

	/**
	 * 行数を取得する
	 */
	public get rowCount(): number {
		return this._values.length;
	}

	/**
	 * 列数を取得する
	 */
	public get columnCount(): number {
		return this.rowCount === 0 ? 0 : this._values[0].length;
	}

	/**
	 * 行列の形状 (行数と列数) を配列として取得する
	 * @returns [行数, 列数]
	 */
	public shape(): [number, number] {
		return [this.rowCount, this.columnCount];
	}

	/**
	 * 行列が空 (次元が 0) かどうかを判定する
	 * @returns 空なら true
	 */
	public isEmpty(): boolean {
		return this.rowCount === 0 || this.columnCount === 0;
	}

	/**
	 * 正方行列かどうかを判定する
	 * @returns 正方行列なら true
	 */
	public isSquare(): boolean {
		return this.rowCount === this.columnCount;
	}

	/**
	 * 指定したインデックスの要素を取得する (複製)
	 * @param row - 行インデックス
	 * @param column - 列インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 */
	public at(row: number, column: number): BigFloat | undefined {
		if (row < 0 || column < 0 || row >= this.rowCount || column >= this.columnCount) return undefined;
		return this._values[row][column].clone();
	}

	/**
	 * 指定した行を取得する
	 * @param index - 行インデックス
	 * @returns 指定行のベクトル、インデックスが範囲外の場合は undefined
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public row(index: number): BigFloatVector | undefined {
		if (index < 0 || index >= this.rowCount) return undefined;
		return BigFloatVector.from(this._values[index].map((value) => value.clone()));
	}

	/**
	 * 指定した列を取得する
	 * @param index - 列インデックス
	 * @returns 指定列のベクトル、インデックスが範囲外の場合は undefined
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public column(index: number): BigFloatVector | undefined {
		if (index < 0 || index >= this.columnCount) return undefined;
		return BigFloatVector.from(this._values.map((row) => row[index].clone()));
	}

	/**
	 * 対角成分を取得する
	 * @returns 対角成分のベクトル
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public diagonalVector(): BigFloatVector {
		BigFloatMatrix._assertSquare(this);
		return BigFloatVector.from(this._values.map((row, index) => row[index].clone()));
	}

	/**
	 * 行列を複製する
	 * @returns 複製された BigFloatMatrix
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public clone(): BigFloatMatrix {
		return BigFloatMatrix._fromBigFloatGrid(this._values.map((row) => row.map((value) => value.clone())));
	}

	/**
	 * 二次元配列へ変換する
	 * @returns 各要素が BigFloat の二次元配列
	 */
	public toArray(): BigFloat[][] {
		return this._values.map((row) => row.map((value) => value.clone()));
	}

	/**
	 * 行ごとのベクトルの配列へ変換する
	 * @returns BigFloatVector の配列
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public toVectors(): BigFloatVector[] {
		return this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())));
	}

	/**
	 * 行列を平坦化したベクトルへ変換する
	 * @returns 行列の全要素を持つ BigFloatVector
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public flatten(): BigFloatVector {
		return BigFloatVector.from(this._flattenValues().map((value) => value.clone()));
	}

	/**
	 * 全要素を流すストリームへ変換する
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public toStream(): BigFloatStream {
		return this.flatten().toStream();
	}

	/**
	 * 行ベクトルを順に反復するイテレータを取得する
	 * @returns 行ベクトルのイテレータ
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public [Symbol.iterator](): Iterator<BigFloatVector, void, undefined> {
		return this.toVectors()[Symbol.iterator]();
	}

	/**
	 * 各要素に対して関数を実行する
	 * @param fn - 実行する関数
	 */
	public forEach(fn: (value: BigFloat, row: number, column: number) => void): void {
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				fn(this._values[row][column].clone(), row, column);
			}
		}
	}

	/**
	 * 各要素を変換した新しい行列を取得する
	 * @param fn - 変換関数
	 * @returns 変換後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public map(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this | BigFloatMatrix {
		return this._mapValues(fn);
	}

	/**
	 * 別の行列と要素ごとに対になる変換を行い、新しい行列を取得する
	 * @param other - 対象行列
	 * @param fn - 変換関数
	 * @returns 変換後の新しい行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public zipMap(other: BigFloatAnyMatrixLike, fn: (left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatValue): this | BigFloatAnyMatrix {
		return this._mapWithOperand(other, fn);
	}

	/**
	 * 全要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 */
	public reduce<U>(fn: (acc: U, value: BigFloat, row: number, column: number) => U, initial: U): U {
		let acc = initial;
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				acc = fn(acc, this._values[row][column].clone(), row, column);
			}
		}
		return acc;
	}

	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	public some(fn: (value: BigFloat, row: number, column: number) => boolean): boolean {
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				if (fn(this._values[row][column].clone(), row, column)) return true;
			}
		}
		return false;
	}

	/**
	 * すべての要素が条件を満たすかどうかを判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
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
	 * @param others - 連結する行列のリスト
	 * @returns 連結された新しい行列
	 * @throws {RangeError} 列数が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public concatRows(...others: BigFloatMatrixLike[]): this {
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
	 * @param others - 連結する行列のリスト
	 * @returns 連結された新しい行列
	 * @throws {RangeError} 行数が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public concatColumns(...others: BigFloatMatrixLike[]): this {
		let result = this.clone();
		for (const other of others) {
			const matrix = BigFloatMatrix._coerceMatrix(other, result._flattenValues());
			if (result.rowCount !== matrix.rowCount) throw new RangeError("Row counts must match");
			result = BigFloatMatrix._fromBigFloatGrid(result._values.map((row, rowIndex) => [...row.map((value) => value.clone()), ...matrix._values[rowIndex].map((value) => value.clone())]));
		}
		return result as this;
	}

	/**
	 * 行の一部を抽出した新しい行列を返す
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sliceRows(start?: number, end?: number): this {
		return BigFloatMatrix._fromBigFloatGrid(this._values.slice(start, end).map((row) => row.map((value) => value.clone()))) as this;
	}

	/**
	 * 列の一部を抽出した新しい行列を返す
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sliceColumns(start?: number, end?: number): this {
		return BigFloatMatrix._fromBigFloatGrid(this._values.map((row) => row.slice(start, end).map((value) => value.clone()))) as this;
	}

	/**
	 * 転置行列を取得する
	 * @returns 転置された新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public transpose(): this {
		if (this.isEmpty()) return BigFloatMatrix.empty() as this;
		return BigFloatMatrix._fromBigFloatGrid(Array.from({ length: this.columnCount }, (_, column) => this._values.map((row) => row[column].clone()))) as this;
	}

	/**
	 * 別の行列と内容が等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public equals(other: BigFloatMatrixLike): boolean {
		const matrix = BigFloatMatrix._coerceMatrix(other, this._flattenValues());
		if (this.rowCount !== matrix.rowCount || this.columnCount !== matrix.columnCount) return false;
		for (let row = 0; row < this.rowCount; row++) {
			for (let column = 0; column < this.columnCount; column++) {
				if (!this._values[row][column].eq(matrix._values[row][column])) return false;
			}
		}
		return true;
	}

	/**
	 * すべての要素の精度を変更した新しい行列を取得する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public changePrecision(precision: PrecisionValue): this | BigFloatMatrix {
		const precisionBig = BigInt(precision);
		return this._mapValues((value) => value.changePrecision(precisionBig));
	}

	/**
	 * 各要素に別の行列またはスカラ値を加算した新しい行列を取得する
	 * @param other - 加算する行列または数値
	 * @returns 加算後の新しい行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public add(other: BigFloatInputValue | BigFloatAnyMatrixLike): this | BigFloatAnyMatrix {
		return this._mapWithOperand(other as BigFloatValue, (left, right) => left.add(right));
	}

	/**
	 * 各要素から別の行列またはスカラ値を減算した新しい行列を取得する
	 * @param other - 減算する行列または数値
	 * @returns 減算後の新しい行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sub(other: BigFloatInputValue | BigFloatAnyMatrixLike): this | BigFloatAnyMatrix {
		return this._mapWithOperand(other as BigFloatValue, (left, right) => left.sub(right));
	}

	/**
	 * 各要素にスカラ値を乗算した新しい行列を取得する
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public mul(scalar: BigFloatValue): this | BigFloatAnyMatrix {
		return this._mapValues((value) => value.mul(scalar));
	}

	/**
	 * 各要素をスカラ値で除算した新しい行列を取得する
	 * @param scalar - 除数
	 * @returns 除算後の新しい行列
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public div(scalar: BigFloatValue): this | BigFloatMatrix {
		return this._mapValues((value) => value.div(scalar));
	}

	/**
	 * 各要素に対して剰余演算を行った新しい行列を取得する
	 * @param other - 法
	 * @returns 演算後の新しい行列
	 * @throws {TypeError} BigFloat.mod が複素数オペランドをサポートしていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public mod(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(other, (left, right) => left.mod(right));
	}

	/**
	 * 別の行列とのアダマール積 (要素ごとの積) を計算する
	 * @param other - 対象行列
	 * @returns アダマール積の結果の行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public hadamard(other: BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(other, (left, right) => left.mul(right));
	}

	/**
	 * 各要素の符号を反転させた新しい行列を取得する
	 * @returns 符号反転後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public neg(): this | BigFloatMatrix {
		return this._mapValues((value) => value.neg());
	}

	/**
	 * 各要素を絶対値にした新しい行列を取得する
	 * @returns 絶対値適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public abs(): this | BigFloatMatrix {
		return this._mapValues((value) => value.abs());
	}

	/**
	 * 各要素の符号 (1, 0, -1) を持つ行列を取得する
	 * @returns 符号行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sign(): this | BigFloatMatrix {
		return this._mapValues((value) => value.sign());
	}

	/**
	 * 各要素の逆数を持つ行列を取得する
	 * @returns 逆数行列
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public reciprocal(): this | BigFloatMatrix {
		return this._mapValues((value) => value.reciprocal());
	}

	/**
	 * 各要素を指定した指数で冪乗した新しい行列を取得する
	 * @param exponent - 指数
	 * @returns 冪乗後の新しい行列
	 * @throws {RangeError} 負の数の非整数乗が実数にならない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public pow(exponent: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(exponent, (left, right) => left.pow(right));
	}

	/**
	 * 各要素の平方根を計算した新しい行列を取得する
	 * @returns 平方根適用後の新しい行列
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sqrt(): this | BigFloatMatrix {
		return this._mapValues((value) => value.sqrt());
	}

	/**
	 * 各要素の立方根を計算した新しい行列を取得する
	 * @returns 立方根適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cbrt(): this | BigFloatMatrix {
		return this._mapValues((value) => value.cbrt());
	}

	/**
	 * 各要素の n 乗根を計算した新しい行列を取得する
	 * @param n - 指数
	 * @returns n 乗根適用後の新しい行列
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public nthRoot(n: number | bigint): this | BigFloatMatrix {
		return this._mapValues((value) => value.nthRoot(n));
	}

	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理した新しい行列を取得する
	 * @returns 床関数適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public floor(): this | BigFloatMatrix {
		return this._mapValues((value) => value.floor());
	}

	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理した新しい行列を取得する
	 * @returns 天井関数適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public ceil(): this | BigFloatMatrix {
		return this._mapValues((value) => value.ceil());
	}

	/**
	 * 各要素を四捨五入した新しい行列を取得する
	 * @returns 四捨五入後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public round(): this | BigFloatMatrix {
		return this._mapValues((value) => value.round());
	}

	/**
	 * 各要素を 0 方向に切り捨てた新しい行列を取得する
	 * @returns 切り捨て後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public trunc(): this | BigFloatMatrix {
		return this._mapValues((value) => value.trunc());
	}

	/**
	 * 各要素を Float32 精度に丸めた新しい行列を取得する
	 * @returns 丸め後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public fround(): this | BigFloatMatrix {
		return this._mapValues((value) => value.fround());
	}

	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えた行列を取得する
	 * @returns 結果の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public clz32(): this | BigFloatMatrix {
		return this._mapValues((value) => value.clz32());
	}

	/**
	 * 別の行列または数値との相対差を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 相対差の行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public relativeDiff(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(other, (left, right) => left.relativeDiff(right));
	}

	/**
	 * 別の行列または数値との絶対差を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 絶対差の行列
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public absoluteDiff(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(other, (left, right) => left.absoluteDiff(right));
	}

	/**
	 * 別の行列または数値との百分率差分を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 百分率差分の行列 (%)
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public percentDiff(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(other, (left, right) => left.percentDiff(right));
	}

	/**
	 * 各要素の正弦 (sin) を計算した行列を取得する
	 * @returns sin 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sin(): this | BigFloatMatrix {
		return this._mapValues((value) => value.sin());
	}

	/**
	 * 各要素の余弦 (cos) を計算した行列を取得する
	 * @returns cos 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cos(): this | BigFloatMatrix {
		return this._mapValues((value) => value.cos());
	}

	/**
	 * 各要素の正接 (tan) を計算した行列を取得する
	 * @returns tan 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tan(): this | BigFloatMatrix {
		return this._mapValues((value) => value.tan());
	}

	/**
	 * 各要素の逆正弦 (asin) を計算した行列を取得する
	 * @returns asin 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asin(): this | BigFloatMatrix {
		return this._mapValues((value) => value.asin());
	}

	/**
	 * 各要素の逆余弦 (acos) を計算した行列を取得する
	 * @returns acos 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acos(): this | BigFloatMatrix {
		return this._mapValues((value) => value.acos());
	}

	/**
	 * 各要素の逆正接 (atan) を計算した行列を取得する
	 * @returns atan 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atan(): this | BigFloatMatrix {
		return this._mapValues((value) => value.atan());
	}

	/**
	 * 各要素に対して atan2 を計算した行列を取得する
	 * @param x - x 座標の行列または数値
	 * @returns atan2 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atan2(x: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(x, (left, right) => left.atan2(right));
	}

	/**
	 * 各要素の双曲線正弦 (sinh) を計算した行列を取得する
	 * @returns sinh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sinh(): this | BigFloatMatrix {
		return this._mapValues((value) => value.sinh());
	}

	/**
	 * 各要素の双曲線余弦 (cosh) を計算した行列を取得する
	 * @returns cosh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cosh(): this | BigFloatMatrix {
		return this._mapValues((value) => value.cosh());
	}

	/**
	 * 各要素の双曲線正接 (tanh) を計算した行列を取得する
	 * @returns tanh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tanh(): this | BigFloatMatrix {
		return this._mapValues((value) => value.tanh());
	}

	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算した行列を取得する
	 * @returns asinh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asinh(): this | BigFloatMatrix {
		return this._mapValues((value) => value.asinh());
	}

	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算した行列を取得する
	 * @returns acosh 適用後の行列
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acosh(): this | BigFloatMatrix {
		return this._mapValues((value) => value.acosh());
	}

	/**
	 * 各要素の逆双曲線正接 (atanh) を計算した行列を取得する
	 * @returns atanh 適用後の行列
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atanh(): this | BigFloatMatrix {
		return this._mapValues((value) => value.atanh());
	}

	/**
	 * 各要素の指数関数 (exp) を計算した行列を取得する
	 * @returns exp 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public exp(): this | BigFloatMatrix {
		return this._mapValues((value) => value.exp());
	}

	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算した行列を取得する
	 * @returns exp2 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public exp2(): this | BigFloatMatrix {
		return this._mapValues((value) => value.exp2());
	}

	/**
	 * 各要素に対して exp(x) - 1 を計算した行列を取得する
	 * @returns expm1 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public expm1(): this | BigFloatMatrix {
		return this._mapValues((value) => value.expm1());
	}

	/**
	 * 各要素の自然対数 (ln) を計算した行列を取得する
	 * @returns ln 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public ln(): this | BigFloatMatrix {
		return this._mapValues((value) => value.ln());
	}

	/**
	 * 各要素の任意の底による対数を計算した行列を取得する
	 * @param base - 底
	 * @returns 対数計算後の行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public log(base: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix {
		return this._mapWithOperand(base, (left, right) => left.log(right));
	}

	/**
	 * 各要素の底を 2 とする対数を計算した行列を取得する
	 * @returns log2 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public log2(): this | BigFloatMatrix {
		return this._mapValues((value) => value.log2());
	}

	/**
	 * 各要素の常用対数 (log10) を計算した行列を取得する
	 * @returns log10 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public log10(): this | BigFloatMatrix {
		return this._mapValues((value) => value.log10());
	}

	/**
	 * 各要素に対して ln(1 + x) を計算した行列を取得する
	 * @returns log1p 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public log1p(): this | BigFloatMatrix {
		return this._mapValues((value) => value.log1p());
	}

	/**
	 * 各要素に対してガンマ関数を計算した行列を取得する
	 * @returns ガンマ関数適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public gamma(): this | BigFloatMatrix {
		return this._mapValues((value) => value.gamma());
	}

	/**
	 * 各要素に対してリーマンゼータ関数を計算した行列を取得する
	 * @returns ゼータ関数適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public zeta(): this | BigFloatMatrix {
		return this._mapValues((value) => value.zeta());
	}

	/**
	 * 各要素に対して階乗を計算した行列を取得する
	 * @returns 階乗適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public factorial(): this | BigFloatMatrix {
		return this._mapValues((value) => value.factorial());
	}

	/**
	 * 最大値を返す
	 * @returns 最大値
	 * @throws {TypeError} 行列が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
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
	 * @returns 最小値
	 * @throws {TypeError} 行列が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
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

	/**
	 * 全要素の合計を計算する
	 * @returns 合計
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sum(): BigFloat {
		if (this.isEmpty()) return new BigFloat(0);
		return this.flatten().sum();
	}

	/**
	 * 全要素の積を計算する
	 * @returns 総乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public product(): BigFloat {
		if (this.isEmpty()) return new BigFloat(1);
		return this.flatten().product();
	}

	/**
	 * 全要素の平均を計算する
	 * @returns 平均
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public average(): BigFloat {
		if (this.isEmpty()) return new BigFloat(0);
		return this.sum().div(this.rowCount * this.columnCount);
	}

	/**
	 * 行ごとの合計を計算する
	 * @returns 各行の和を持つベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public rowSums(): BigFloatVector {
		return BigFloatVector.from(this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())).sum()));
	}

	/**
	 * 列ごとの合計を計算する
	 * @returns 各列の和を持つベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public columnSums(): BigFloatVector {
		if (this.isEmpty()) return BigFloatVector.empty();
		const resolvedPrecision = BigFloatMatrix._resolvePrecision(this._flattenValues());
		return BigFloatVector.from(Array.from({ length: this.columnCount }, (_, column) => this._values.reduce((acc, row) => acc.add(row[column]), new BigFloat(0, resolvedPrecision))));
	}

	/**
	 * 行列のトレース (対角成分の和) を計算する
	 * @returns トレース
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public trace(): BigFloat {
		BigFloatMatrix._assertSquare(this);
		const resolvedPrecision = BigFloatMatrix._resolvePrecision(this._flattenValues());
		let total = new BigFloat(0, resolvedPrecision);
		for (let index = 0; index < this.rowCount; index++) {
			total = total.add(this._values[index][index]);
		}
		return total;
	}

	/**
	 * フロベニウスノルムを計算する
	 * @returns フロベニウスノルム
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public frobeniusNorm(): BigFloat {
		return this.flatten().squaredNorm().sqrt();
	}

	/**
	 * 別の行列との行列積を計算する
	 * @param other - 乗じる行列
	 * @returns 行列積の結果
	 * @throws {RangeError} 内積次元が一致しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 */
	public matmul(other: BigFloatMatrixLike): this {
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
	 * @param vector - 乗算するベクトル
	 * @returns 演算結果のベクトル
	 * @throws {RangeError} 内部次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public mulVector(vector: BigFloatVectorLike): BigFloatVector {
		const rhs = BigFloatMatrix._coerceVector(vector, this._flattenValues());
		if (this.columnCount !== rhs.length) throw new RangeError("Inner matrix dimensions must agree");
		return BigFloatVector.from(this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())).dot(rhs)));
	}

	/**
	 * 行列式を計算する
	 * @returns 行列式の値
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
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

	/**
	 * 行列のランク (階数) を計算する
	 * @returns ランク
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public rank(): number {
		return BigFloatMatrix._reducedRowEchelon(this.toArray(), this.columnCount).pivotColumns.length;
	}

	/**
	 * 逆行列を計算する
	 * @returns 逆行列
	 * @throws {RangeError} 正方行列でない場合、または行列が特異な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public inverse(): this {
		BigFloatMatrix._assertSquare(this);
		const identity = BigFloatMatrix.identity(this.rowCount, BigFloatMatrix._resolvePrecision(this._flattenValues()));
		return this.solveMatrix(identity) as this;
	}

	/**
	 * 連立方程式 Ax = b を解く
	 * @param rhs - 右辺ベクトル b
	 * @returns 解ベクトル x
	 * @throws {RangeError} 行列が正方でない場合、ベクトル長が不一致な場合、または行列が特異な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public solveVector(rhs: BigFloatVectorLike): BigFloatVector {
		BigFloatMatrix._assertSquare(this);
		const vector = BigFloatMatrix._coerceVector(rhs, this._flattenValues());
		if (vector.length !== this.rowCount) throw new RangeError("Right-hand side vector length must match row count");
		const solution = this.solveMatrix(BigFloatMatrix.fromColumns([vector.toArray()]));
		return solution.column(0) ?? BigFloatVector.empty();
	}

	/**
	 * 連立方程式 AX = B を解く
	 * @param rhs - 右辺行列 B
	 * @returns 解行列 X
	 * @throws {RangeError} 行列が正方でない場合、行数が不一致な場合、または行列が特異な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public solveMatrix(rhs: BigFloatMatrixLike): this {
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
	 * 行列の累乗 A^exponent を計算する
	 * @param exponent - 指数 (整数)
	 * @returns 演算結果
	 * @throws {RangeError} 正方行列でない場合、または指数が整数でない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
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
