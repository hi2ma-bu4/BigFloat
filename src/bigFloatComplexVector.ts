import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import { BigFloatStream } from "./bigFloatStream";
import { BigFloatVector } from "./bigFloatVector";
import { DimensionMismatchError, DivisionByZeroError } from "./error";
import type { BigFloatAnyVector, BigFloatAnyVectorLike, BigFloatInputValue, PrecisionValue } from "./types";

type BigFloatComplexVectorRandomOptions = {
	min?: BigFloatInputValue;
	max?: BigFloatInputValue;
	precision?: PrecisionValue;
};

/**
 * BigFloatComplex を要素とする固定長ベクトルクラス
 */
export class BigFloatComplexVector implements Iterable<BigFloatComplex> {
	/** 内部要素 (BigFloatComplex の配列) */
	public _values: BigFloatComplex[];

	// ====================================================================================================
	// * 基本ユーティリティ (クラス生成・変換・クローン)
	// ====================================================================================================

	/**
	 * BigFloatComplexVector コンストラクタ
	 * @param values - 要素のソース
	 * @param precision - 精度
	 * @returns BigFloatComplexVector インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public constructor(values: BigFloatAnyVectorLike = [], precision?: PrecisionValue) {
		const array = Array.from(values);
		const resolvedPrecision = BigFloatComplexVector._resolvePrecision(array, precision);
		this._values = array.map((value) => BigFloatComplexVector._toComplex(value, resolvedPrecision));
	}

	// ====================================================================================================
	// * 内部ユーティリティ・補助関数
	// ====================================================================================================

	/**
	 * 内部配列からベクトルを生成する (内部用)
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatComplexVector
	 */
	protected static _fromComplexArray(values: BigFloatComplex[]): BigFloatComplexVector {
		const vector = new this();
		vector._values = values;
		return vector;
	}

	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toComplex(value: BigFloatInputValue, precision?: bigint): BigFloatComplex {
		if (value instanceof BigFloatComplex) {
			return precision === undefined || value.precision === precision ? value.clone() : value.changePrecision(precision);
		}
		return new BigFloatComplex(value, 0, precision);
	}

	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値列
	 * @param precision - 明示精度
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
	 * 次元一致を検証する
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	protected static _assertSameLength(left: BigFloatAnyVector, right: BigFloatAnyVector): void {
		if (left.length !== right.length) throw new DimensionMismatchError("Vector dimensions must match");
	}

	/**
	 * 任意入力を BigFloatComplexVector へ変換する (内部用)
	 * @param value - オペランド
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatComplexVector
	 */
	protected static _coerceVector(value: BigFloatAnyVectorLike, referenceValues: BigFloatInputValue[] = []): BigFloatComplexVector {
		if (value instanceof BigFloatComplexVector) return value;
		if (value instanceof BigFloatVector) {
			return BigFloatComplexVector._fromComplexArray(value.toArray().map((v) => new BigFloatComplex(v)));
		}
		const array = Array.from(value);
		const resolvedPrecision = BigFloatComplexVector._resolvePrecision([...referenceValues, ...array]);
		return new BigFloatComplexVector(array, resolvedPrecision);
	}

	/**
	 * 複素数ベクトルとして未サポートの実数専用演算であることを通知する
	 * @param operation - 演算名
	 * @throws {TypeError} 常に送出
	 */
	protected static _throwNonRealVectorOperation(operation: string): never {
		throw new TypeError(`${operation} is not supported for vectors containing non-real complex numbers`);
	}

	/**
	 * 任意の入力を実ベクトルへ変換する
	 * @param value - 対象のベクトル
	 * @param referenceValues - 精度解決のための参照値
	 * @param operation - 演算名
	 * @returns 実ベクトル
	 * @throws {TypeError} 非実数複素数要素を含む場合
	 */
	protected static _coerceRealVector(value: BigFloatAnyVectorLike, referenceValues: BigFloatInputValue[], operation: string): BigFloatVector {
		const vector = BigFloatComplexVector._coerceVector(value, referenceValues);
		return BigFloatVector.from(
			vector._values.map((entry) => {
				if (!entry.isReal()) BigFloatComplexVector._throwNonRealVectorOperation(operation);
				return entry.real;
			}),
		);
	}

	/**
	 * 全要素が実数であることを確認し、実ベクトルへ変換する
	 * @param operation - 演算名
	 * @returns 実ベクトル
	 * @throws {TypeError} 非実数複素数要素を含む場合
	 */
	protected _toRealVector(operation: string): BigFloatVector {
		return BigFloatVector.from(
			this._values.map((value) => {
				if (!value.isReal()) BigFloatComplexVector._throwNonRealVectorOperation(operation);
				return value.real;
			}),
		);
	}

	/**
	 * 各要素に対して変換関数を適用した新しいベクトルを返す (内部用)
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapValues(fn: (value: BigFloatComplex, index: number) => BigFloatInputValue): this {
		const values = this._values.map((value, index) => {
			const mapped = fn(value.clone(), index);
			return BigFloatComplexVector._toComplex(mapped, value.precision);
		});
		return BigFloatComplexVector._fromComplexArray(values) as this;
	}

	/**
	 * オペランドとの二項演算を各要素に対して行う (内部用)
	 * @param other - ベクトルまたはスカラ値
	 * @param fn - 二項演算関数
	 * @returns 演算後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	protected _mapWithOperand(other: BigFloatAnyVectorLike | BigFloatInputValue, fn: (left: BigFloatComplex, right: BigFloatComplex, index: number) => BigFloatInputValue): this {
		if (other instanceof BigFloatComplexVector || other instanceof BigFloatVector || (typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat) && !(other instanceof BigFloatComplex))) {
			const vector = BigFloatComplexVector._coerceVector(other, this._values);
			BigFloatComplexVector._assertSameLength(this, vector);
			const values = this._values.map((value, index) => {
				const mapped = fn(value.clone(), vector._values[index].clone(), index);
				return BigFloatComplexVector._toComplex(mapped, value.precision);
			});
			return BigFloatComplexVector._fromComplexArray(values) as this;
		}

		const right = BigFloatComplexVector._toComplex(other, this._values[0]?.precision);
		return this._mapValues((value, index) => fn(value, right, index));
	}

	// ====================================================================================================
	// * ベクトル生成・初期化
	// ====================================================================================================

	/**
	 * 要素の反復可能オブジェクトから BigFloatComplexVector を生成する
	 * @param values - 要素のソース
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 */
	public static from(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatComplexVector {
		return new BigFloatComplexVector(values, precision);
	}

	/**
	 * BigFloatStream からベクトルを生成する
	 * @param stream - 要素のストリーム
	 * @returns 生成されたベクトル
	 */
	public static fromStream(stream: BigFloatStream): BigFloatComplexVector {
		return this.from(stream.toArray());
	}

	/**
	 * 引数リストからベクトルを生成する
	 * @param values - 要素のリスト
	 * @returns 生成されたベクトル
	 */
	public static of(...values: BigFloatInputValue[]): BigFloatComplexVector {
		return this.from(values);
	}

	/**
	 * 指定された値で埋められたベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static fill(length: number, value: BigFloatInputValue, precision?: PrecisionValue): BigFloatComplexVector {
		if (length <= 0) return this.empty();
		const resolvedPrecision = BigFloatComplexVector._resolvePrecision([value], precision);
		const base = BigFloatComplexVector._toComplex(value, resolvedPrecision);
		return this._fromComplexArray(Array.from({ length }, () => base.clone()));
	}

	/**
	 * 零ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns 生成された零ベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static zeros(length: number, precision?: PrecisionValue): BigFloatComplexVector {
		return this.fill(length, 0, precision);
	}

	/**
	 * すべての要素が 1 のベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static ones(length: number, precision?: PrecisionValue): BigFloatComplexVector {
		return this.fill(length, 1, precision);
	}

	/**
	 * 標準基底ベクトルを取得する
	 * @param length - ベクトルの長さ
	 * @param index - 基底のインデックス
	 * @param precision - 精度
	 * @returns 標準基底ベクトル
	 * @throws {RangeError} インデックスが範囲外の場合
	 */
	public static basis(length: number, index: number, precision?: PrecisionValue): BigFloatComplexVector {
		if (index < 0 || index >= length) throw new RangeError("Index out of range");
		const p = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return this._fromComplexArray(Array.from({ length }, (_, i) => new BigFloatComplex(i === index ? 1 : 0, 0, p)));
	}

	/**
	 * 指定した範囲を等分割する数値ベクトルを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 分割数
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public static linspace(start: BigFloatInputValue, end: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatComplexVector {
		if (count <= 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, end], precision);
		const s = this._toComplex(start, resolvedPrecision);
		if (count === 1) return this._fromComplexArray([s]);
		const e = this._toComplex(end, resolvedPrecision);
		const step = e.sub(s).div(count - 1);
		const values: BigFloatComplex[] = [];
		let current = s.clone();
		for (let i = 0; i < count; i++) {
			if (i === count - 1) {
				values.push(e);
			} else {
				values.push(current);
				current = current.add(step);
			}
		}
		return this._fromComplexArray(values);
	}

	/**
	 * 乱数ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param options - 乱数生成オプション
	 * @returns 生成された乱数ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 */
	public static random(length: number, options: BigFloatComplexVectorRandomOptions = {}): BigFloatComplexVector {
		if (length <= 0) return this.empty();
		const min = options.min ?? 0;
		const max = options.max ?? 1;
		const resolvedPrecision = BigFloatComplexVector._resolvePrecision([min, max], options.precision);
		const minVal = BigFloatComplexVector._toComplex(min, resolvedPrecision);
		const maxVal = BigFloatComplexVector._toComplex(max, resolvedPrecision);
		const span = maxVal.sub(minVal);

		const values = Array.from({ length }, () => {
			if (span.isReal()) {
				return minVal.add(span.real.mul(BigFloat.random(resolvedPrecision)));
			}
			const r = BigFloat.random(resolvedPrecision);
			const i = BigFloat.random(resolvedPrecision);
			return minVal.add(new BigFloatComplex(span.real.mul(r), span.imag.mul(i)));
		});
		return this._fromComplexArray(values);
	}

	// ====================================================================================================
	// * 要素アクセス・反復
	// ====================================================================================================

	/**
	 * ベクトルの長さ（要素数）
	 */
	public get length(): number {
		return this._values.length;
	}

	/**
	 * ベクトルの次元数を取得する
	 * @returns 次元数 (length と同じ)
	 */
	public dimension(): number {
		return this.length;
	}

	/**
	 * ベクトルが空であるか判定する
	 * @returns 空なら true
	 */
	public isEmpty(): boolean {
		return this.length === 0;
	}

	/**
	 * 指定したインデックスの要素を取得する
	 * @param index - インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public at(index: number): BigFloatComplex | undefined {
		if (index < 0 || index >= this.length) return undefined;
		return this._values[index].clone();
	}

	/**
	 * ベクトルを複製する
	 * @returns 複製された BigFloatComplexVector
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public clone(): BigFloatComplexVector {
		return BigFloatComplexVector._fromComplexArray(this._values.map((v) => v.clone()));
	}

	/**
	 * 配列に変換する
	 * @returns BigFloatComplex の配列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public toArray(): BigFloatComplex[] {
		return this._values.map((v) => v.clone());
	}

	/**
	 * 要素を流すストリームへ変換する
	 * @returns 要素のストリーム
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public toStream(): BigFloatStream {
		return BigFloatStream.from(this.toArray());
	}

	/**
	 * ベクトルのイテレータを取得する
	 * @returns 要素のイテレータ
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public [Symbol.iterator](): Iterator<BigFloatComplex, void, undefined> {
		return this.toArray()[Symbol.iterator]();
	}

	// ====================================================================================================
	// * コレクション操作
	// ====================================================================================================

	/**
	 * 各要素に対して処理を実行する
	 * @param fn - 実行する関数
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public forEach(fn: (value: BigFloatComplex, index: number) => void): void {
		this._values.forEach((v, i) => fn(v.clone(), i));
	}

	/**
	 * 各要素に関数を適用して新しいベクトルを生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public map(fn: (value: BigFloatComplex, index: number) => BigFloatInputValue): this {
		return this._mapValues(fn);
	}

	/**
	 * 二つのベクトルの各要素に対して関数を適用し、新しいベクトルを生成する
	 * @param other - 比較対象のベクトル
	 * @param fn - 適用する関数
	 * @returns 演算結果のベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public zipMap(other: BigFloatAnyVectorLike, fn: (left: BigFloatComplex, right: BigFloatComplex, index: number) => BigFloatInputValue): this {
		return this._mapWithOperand(other, fn);
	}

	/**
	 * 各要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public reduce<U>(fn: (acc: U, value: BigFloatComplex, index: number) => U, initial: U): U {
		return this._values.reduce((acc, v, i) => fn(acc, v.clone(), i), initial);
	}

	/**
	 * いずれかの要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public some(fn: (value: BigFloatComplex, index: number) => boolean): boolean {
		return this._values.some((v, i) => fn(v.clone(), i));
	}

	/**
	 * すべての要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public every(fn: (value: BigFloatComplex, index: number) => boolean): boolean {
		return this._values.every((v, i) => fn(v.clone(), i));
	}

	// ====================================================================================================
	// * 結合・スライス
	// ====================================================================================================

	/**
	 * ベクトルを連結する
	 * @param others - 連結するベクトル
	 * @returns 連結後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public concat(...others: BigFloatAnyVectorLike[]): this {
		const values = this.toArray();
		for (const other of others) {
			values.push(...BigFloatComplexVector._coerceVector(other, this._values).toArray());
		}
		return BigFloatComplexVector._fromComplexArray(values) as this;
	}

	/**
	 * 指定した範囲の要素を抽出する
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public slice(start?: number, end?: number): this {
		return BigFloatComplexVector._fromComplexArray(this._values.slice(start, end).map((v) => v.clone())) as this;
	}

	/**
	 * 要素の順序を反転させる
	 * @returns 反転した新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public reverse(): this {
		return BigFloatComplexVector._fromComplexArray([...this._values].reverse().map((v) => v.clone())) as this;
	}

	// ====================================================================================================
	// * 精度・比較系
	// ====================================================================================================

	/**
	 * ベクトルの精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public changePrecision(precision: PrecisionValue): this {
		const p = BigInt(precision);
		return this._mapValues((v) => v.changePrecision(p));
	}

	/**
	 * ベクトルが等しいか判定する
	 * @param other - 比較対象のベクトル
	 * @returns 等しい場合は true
	 * @throws {TypeError} 複素数と比較しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 */
	public equals(other: BigFloatAnyVectorLike): boolean {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		if (this.length !== vector.length) return false;
		return this._values.every((v, i) => v.equals(vector._values[i]));
	}

	// ====================================================================================================
	// * 四則演算・基本関数
	// ====================================================================================================

	/**
	 * ベクトルの加算を行う
	 * @param other - 加算するベクトルまたはスカラ
	 * @returns 加算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public add(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.add(r));
	}

	/**
	 * ベクトルの減算を行う
	 * @param other - 減算するベクトルまたはスカラ
	 * @returns 減算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public sub(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.sub(r));
	}

	/**
	 * スカラー倍を行う
	 * @param scalar - 乗算するスカラー
	 * @returns 乗算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public mul(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexVector._toComplex(scalar, this._values[0]?.precision);
		return this._mapValues((v) => v.mul(s));
	}

	/**
	 * スカラー除算を行う
	 * @param scalar - 除算するスカラー
	 * @returns 除算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public div(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexVector._toComplex(scalar, this._values[0]?.precision);
		return this._mapValues((v) => v.div(s));
	}

	/**
	 * 各要素の剰余を計算する
	 * @param other - 除数（ベクトルまたはスカラ）
	 * @returns 演算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public mod(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.mod(r));
	}

	/**
	 * アダマール積（要素ごとの積）を計算する
	 * @param other - 乗算するベクトル
	 * @returns Hadamard積の結果のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public hadamard(other: BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.mul(r));
	}

	/**
	 * 各要素の符号を反転する
	 * @returns 符号反転後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public neg(): this {
		return this._mapValues((v) => v.neg());
	}

	/**
	 * 各要素の絶対値を計算する
	 * @returns 絶対値適用後の新しい実数ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public abs(): BigFloatVector {
		return BigFloatVector.from(this._values.map((v) => v.abs()));
	}

	/**
	 * 各要素の符号を計算する
	 * @returns 符号ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public sign(): this {
		return this._mapValues((v) => v.sign());
	}

	/**
	 * 各要素の逆数を計算する
	 * @returns 逆数ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public reciprocal(): this {
		return this._mapValues((v) => v.reciprocal());
	}

	// ====================================================================================================
	// * 冪乗・ルート・スケーリング
	// ====================================================================================================

	/**
	 * 各要素のべき乗を計算する
	 * @param exponent - 指数（ベクトルまたはスカラ）
	 * @returns 冪乗後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public pow(exponent: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(exponent, (l, r) => l.pow(r));
	}

	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根適用後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public sqrt(): this {
		return this._mapValues((v) => v.sqrt());
	}

	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根適用後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public cbrt(): this {
		return this._mapValues((v) => v.cbrt());
	}

	/**
	 * 各要素の n 乗根を計算する
	 * @param n - 次数
	 * @returns n 乗根適用後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} n が正の整数でない場合
	 */
	public nthRoot(n: number | bigint): this {
		return this._mapValues((v) => v.nthRoot(n));
	}

	/**
	 * 各要素の床関数を計算する
	 * @returns 床関数適用後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public floor(): this {
		return this._mapValues((v) => v.floor());
	}

	/**
	 * 各要素の天井関数を計算する
	 * @returns 天井関数適用後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public ceil(): this {
		return this._mapValues((v) => v.ceil());
	}

	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public round(): this {
		return this._mapValues((v) => v.round());
	}

	/**
	 * 各要素を切り捨てる
	 * @returns 切り捨て後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public trunc(): this {
		return this._mapValues((v) => v.trunc());
	}

	/**
	 * 各要素を最も近い単精度浮動小数点数形式に丸める
	 * @returns 丸め後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public fround(): this {
		return this._mapValues((v) => v.fround());
	}

	/**
	 * 各要素の 32 ビット整数としての先頭のゼロの個数を計算する
	 * @returns 結果のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public clz32(): this {
		return this._mapValues((v) => v.clz32());
	}

	/**
	 * 各要素の相対差を計算する
	 * @param other - 比較対象（ベクトルまたはスカラ）
	 * @returns 相対差のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public relativeDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.relativeDiff(r));
	}

	/**
	 * 各要素の絶対差を計算する
	 * @param other - 比較対象（ベクトルまたはスカラ）
	 * @returns 絶対差のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public absoluteDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.absoluteDiff(r));
	}

	/**
	 * 各要素の百分率差分を計算する
	 * @param other - 比較対象（ベクトルまたはスカラ）
	 * @returns 百分率差分のベクトル (%)
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public percentDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.percentDiff(r));
	}

	// ====================================================================================================
	// * 三角関数
	// ====================================================================================================

	/**
	 * 各要素の正弦（sin）を計算する
	 * @returns sin 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public sin(): this {
		return this._mapValues((v) => v.sin());
	}

	/**
	 * 各要素の余弦（cos）を計算する
	 * @returns cos 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public cos(): this {
		return this._mapValues((v) => v.cos());
	}

	/**
	 * 各要素の正接（tan）を計算する
	 * @returns tan 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public tan(): this {
		return this._mapValues((v) => v.tan());
	}

	/**
	 * 各要素の逆正弦（asin）を計算する
	 * @returns asin 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public asin(): this {
		return this._mapValues((v) => v.asin());
	}

	/**
	 * 各要素の逆余弦（acos）を計算する
	 * @returns acos 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public acos(): this {
		return this._mapValues((v) => v.acos());
	}

	/**
	 * 各要素の逆正接（atan）を計算する
	 * @returns atan 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public atan(): this {
		return this._mapValues((v) => v.atan());
	}

	/**
	 * 各要素の atan2 を計算する
	 * @param x - x 座標のベクトルまたはスカラ
	 * @returns atan2 適用後のベクトル
	 * @throws {TypeError} 非実数複素数要素を含む場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atan2(x: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(x, (left, right) => left.atan2(right));
	}

	// ====================================================================================================
	// * 双曲線関数
	// ====================================================================================================

	/**
	 * 各要素の双曲線正弦（sinh）を計算する
	 * @returns sinh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public sinh(): this {
		return this._mapValues((v) => v.sinh());
	}

	/**
	 * 各要素の双曲線余弦（cosh）を計算する
	 * @returns cosh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public cosh(): this {
		return this._mapValues((v) => v.cosh());
	}

	/**
	 * 各要素の双曲線正接（tanh）を計算する
	 * @returns tanh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public tanh(): this {
		return this._mapValues((v) => v.tanh());
	}

	/**
	 * 各要素の逆双曲線正弦（asinh）を計算する
	 * @returns asinh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public asinh(): this {
		return this._mapValues((v) => v.asinh());
	}

	/**
	 * 各要素の逆双曲線余弦（acosh）を計算する
	 * @returns acosh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public acosh(): this {
		return this._mapValues((v) => v.acosh());
	}

	/**
	 * 各要素の逆双曲線正接（atanh）を計算する
	 * @returns atanh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public atanh(): this {
		return this._mapValues((v) => v.atanh());
	}

	// ====================================================================================================
	// * 対数・指数・自然定数
	// ====================================================================================================

	/**
	 * 各要素の指数関数（exp）を計算する
	 * @returns exp 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public exp(): this {
		return this._mapValues((v) => v.exp());
	}

	/**
	 * 各要素の 2 を底とする指数関数を計算する
	 * @returns exp2 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public exp2(): this {
		return this._mapValues((v) => v.exp2());
	}

	/**
	 * 各要素の exp(x) - 1 を計算する
	 * @returns expm1 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public expm1(): this {
		return this._mapValues((v) => v.expm1());
	}

	/**
	 * 各要素の自然対数（ln）を計算する
	 * @returns ln 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public ln(): this {
		return this._mapValues((v) => v.ln());
	}

	/**
	 * 各要素の任意の底の対数を計算する
	 * @param base - 対数の底（ベクトルまたはスカラ）
	 * @returns 対数計算後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public log(base: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(base, (l, r) => l.log(r));
	}

	/**
	 * 各要素の 2 を底とする対数を計算する
	 * @returns log2 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public log2(): this {
		return this._mapValues((v) => v.log(2));
	}

	/**
	 * 各要素の 10 を底とする対数を計算する
	 * @returns log10 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public log10(): this {
		return this._mapValues((v) => v.log(10));
	}

	/**
	 * 各要素の ln(1 + x) を計算する
	 * @returns log1p 適用後のベクトル
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public log1p(): this {
		return this._mapValues((v) => v.log1p());
	}

	// ====================================================================================================
	// * 特殊関数・積分・ガンマ関数など
	// ====================================================================================================

	/**
	 * 各要素にガンマ関数を適用する
	 * @returns gamma 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 非実数複素数の場合
	 */
	public gamma(): this {
		return this._mapValues((v) => v.gamma());
	}

	/**
	 * 各要素にリーマンゼータ関数を適用する
	 * @returns zeta 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 非実数複素数の場合
	 */
	public zeta(): this {
		return this._mapValues((v) => v.zeta());
	}

	/**
	 * 各要素に階乗を適用する
	 * @returns factorial 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 非実数複素数の場合
	 */
	public factorial(): this {
		return this._mapValues((v) => v.factorial());
	}

	/**
	 * 各要素に対して指数積分 Ei(z) を計算する
	 * @returns Ei(z) 適用後のベクトル
	 * @throws {TypeError} 非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public Ei(): this {
		return this._mapValues((v) => v.Ei());
	}

	/**
	 * 各要素に対して対数積分 li(z) を計算する
	 * @returns li(z) 適用後のベクトル
	 * @throws {TypeError} 非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} x <= 0 の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 */
	public li(): this {
		return this._mapValues((v) => v.li());
	}

	// ====================================================================================================
	// * 統計関数
	// ====================================================================================================

	/**
	 * 最大値を取得する（複素数では未サポート）
	 * @returns 最大値
	 * @throws {TypeError} 複素数ベクトルではサポートされていないため
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public max(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		const realMax = this._toRealVector("max").max();
		return new BigFloatComplex(realMax, 0, realMax._precision);
	}

	/**
	 * 最小値を取得する（複素数では未サポート）
	 * @returns 最小値
	 * @throws {TypeError} 複素数ベクトルではサポートされていないため
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public min(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		const realMin = this._toRealVector("min").min();
		return new BigFloatComplex(realMin, 0, realMin._precision);
	}

	/**
	 * 要素の合計を計算する
	 * @returns 合計値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public sum(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0);
		return this._values.reduce((acc, v) => acc.add(v), new BigFloatComplex(0, this._values[0].precision));
	}

	/**
	 * 要素の総乗を計算する
	 * @returns 総乗の値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public product(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(1);
		return this._values.reduce((acc, v) => acc.mul(v), new BigFloatComplex(1, this._values[0].precision));
	}

	/**
	 * 要素の平均を計算する
	 * @returns 平均値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public average(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0);
		return this.sum().div(this.length);
	}

	/**
	 * 中央値を計算する
	 * @returns 中央値
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public median(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		const sorted = this._values.slice().sort((a, b) => a.compare(b));
		const mid = Math.floor(sorted.length / 2);
		if (sorted.length % 2 === 1) {
			return sorted[mid].clone();
		}
		return sorted[mid - 1].add(sorted[mid]).div(2);
	}

	/**
	 * 分散を計算する
	 * @returns 分散
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public variance(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		if (this.length === 1) return new BigFloatComplex(0, 0, this._values[0].precision);
		const mean = this.average();
		let sumSq = new BigFloatComplex(0, 0, this._values[0].precision);
		for (const val of this._values) {
			const diff = val.sub(mean);
			sumSq = sumSq.add(diff.mul(diff));
		}
		return sumSq.div(this.length);
	}

	/**
	 * 標準偏差を計算する
	 * @returns 標準偏差
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public stddev(): BigFloatComplex {
		return this.variance().sqrt();
	}

	/**
	 * 幾何平均を計算する
	 * @returns 幾何平均
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public geometricMean(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		return this.product().nthRoot(this.length);
	}

	/**
	 * 調和平均を計算する
	 * @returns 調和平均
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public harmonicMean(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		const p = this._values[0].precision;
		let sumRecip = new BigFloatComplex(0, 0, p);
		for (const val of this._values) {
			sumRecip = sumRecip.add(val.reciprocal());
		}
		return new BigFloatComplex(this.length, 0, p).div(sumRecip);
	}

	/**
	 * 二乗平均平方根 (RMS) を計算する
	 * @returns RMS
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public rms(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		const p = this._values[0].precision;
		let sumSq = new BigFloatComplex(0, 0, p);
		for (const val of this._values) {
			sumSq = sumSq.add(val.mul(val));
		}
		return sumSq.div(this.length).sqrt();
	}

	// ====================================================================================================
	// * ベクトル演算
	// ====================================================================================================

	/**
	 * 他のベクトルとの内積を計算する
	 * @param other - 対象のベクトル
	 * @returns 内積の値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public dot(other: BigFloatAnyVectorLike): BigFloatComplex {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		BigFloatComplexVector._assertSameLength(this, vector);
		let total = new BigFloatComplex(0, BigFloatComplexVector._resolvePrecision([...this._values, ...vector._values]));
		for (let i = 0; i < this.length; i++) {
			total = total.add(this._values[i].mul(vector._values[i]));
		}
		return total;
	}

	/**
	 * 二乗ノルムを計算する
	 * @returns 二乗ノルム
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public squaredNorm(): BigFloat {
		// For complex vectors, squared norm is sum(|v_i|^2)
		return this._values.reduce((acc, v) => acc.add(v.absSquared()), new BigFloat(0, this._values[0]?.precision));
	}

	/**
	 * ノルム（ベクトルの長さ）を計算する
	 * @returns ノルム
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public norm(): BigFloat {
		return this.squaredNorm().sqrt();
	}

	/**
	 * ベクトルを正規化する
	 * @returns 正規化されたベクトル
	 * @throws {DivisionByZeroError} ゼロベクトルを正規化しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public normalize(): this {
		const length = this.norm();
		if (length.isZero()) {
			if (BigFloat.config.allowSpecialValues) {
				const p = this._values[0]?.precision ?? BigFloat.DEFAULT_PRECISION;
				return this.map(() => BigFloat.nan(p)) as this;
			}
			throw new DivisionByZeroError("Cannot normalize zero vector");
		}
		return this.div(length);
	}

	/**
	 * 他のベクトルとの二乗距離を計算する
	 * @param other - 対象のベクトル
	 * @returns 二乗距離
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public squaredDistanceTo(other: BigFloatAnyVectorLike): BigFloat {
		return this.sub(other).squaredNorm();
	}

	/**
	 * 他のベクトルとの距離を計算する
	 * @param other - 対象のベクトル
	 * @returns 距離
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public distanceTo(other: BigFloatAnyVectorLike): BigFloat {
		return this.sub(other).norm();
	}

	/**
	 * 別のベクトルへの正射影ベクトルを計算する
	 * @param other - 射影先のベクトル
	 * @returns 射影された新しいベクトル
	 * @throws {DivisionByZeroError} ゼロベクトルに射影しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 */
	public projectOnto(other: BigFloatAnyVectorLike): this {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		const denominator = vector.squaredNorm();
		if (denominator.isZero()) {
			if (BigFloat.config.allowSpecialValues) {
				const p = vector._values[0]?.precision ?? BigFloat.DEFAULT_PRECISION;
				return vector.map(() => BigFloat.nan(p)) as this;
			}
			throw new DivisionByZeroError("Cannot project onto zero vector");
		}
		const scale = this.dot(vector).div(denominator);
		return vector.mul(scale) as this;
	}

	/**
	 * 別のベクトルとのなす角を計算する
	 * @param other - 対象ベクトル
	 * @returns 角度 (ラジアン)
	 * @throws {TypeError} 非実数複素数要素を含む場合
	 * @throws {DivisionByZeroError} ゼロベクトルが含まれる場合
	 * @throws {DimensionMismatchError} 次元が一致しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public angleTo(other: BigFloatAnyVectorLike): BigFloat {
		const left = this._toRealVector("angleTo");
		const right = BigFloatComplexVector._coerceRealVector(other, this._values, "angleTo");
		return left.angleTo(right);
	}

	/**
	 * 外積を計算する
	 * @param other - 相手のベクトル
	 * @returns 外積の結果
	 * @throws {DimensionMismatchError} 3次元ベクトルでない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public cross(other: BigFloatAnyVectorLike): this {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		BigFloatComplexVector._assertSameLength(this, vector);
		if (this.length !== 3) throw new DimensionMismatchError("Cross product is only defined for 3-dimensional vectors");
		const [ax, ay, az] = this._values;
		const [bx, by, bz] = vector._values;
		return BigFloatComplexVector._fromComplexArray([ay.mul(bz).sub(az.mul(by)), az.mul(bx).sub(ax.mul(bz)), ax.mul(by).sub(ay.mul(bx))]) as this;
	}

	// ====================================================================================================
	// * 定数オブジェクト
	// ====================================================================================================

	/**
	 * 空のベクトル (次元 0) を生成する
	 * @returns 空のベクトル
	 */
	public static empty(): BigFloatComplexVector {
		return this._fromComplexArray([]);
	}
}
