import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import { BigFloatComplexVector } from "./bigFloatComplexVector";
import { BigFloatStream } from "./bigFloatStream";
import { DimensionMismatchError, DivisionByZeroError } from "./error";
import type { BigFloatAnyVector, BigFloatAnyVectorLike, BigFloatComplexVectorLike, BigFloatInputValue, BigFloatLike, BigFloatValue, BigFloatVectorLike, PrecisionValue } from "./types";

type BigFloatVectorRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};

/**
 * BigFloat を固定長ベクトルとして扱うクラス
 * @throws {RangeError} 例外が発生した場合
 */
export class BigFloatVector implements Iterable<BigFloat> {
	/** 内部要素 (BigFloat の配列) */
	public _values: BigFloat[];

	// ====================================================================================================
	// * 基本ユーティリティ (クラス生成・変換・クローン)
	// ====================================================================================================

	/**
	 * BigFloatVector コンストラクタ
	 * @param values - 要素のソース (反復可能オブジェクト)
	 * @param precision - 変換時の精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public constructor(values: BigFloatAnyVectorLike = [], precision?: PrecisionValue) {
		const array = Array.from(values);
		const resolvedPrecision = BigFloatVector._resolvePrecision(array, precision);
		this._values = array.map((value) => {
			if (BigFloat._isComplexValue(value)) {
				// This case should ideally not happen if constructor is called properly,
				// but for type safety we handle it by taking the real part.
				// However, if complex is encountered, BigFloatVector.from handles it by returning BigFloatComplexVector.
				return BigFloatVector._toBigFloat(value.real, resolvedPrecision);
			}
			return BigFloatVector._toBigFloat(value, resolvedPrecision);
		});
	}

	// ====================================================================================================
	// * 内部ユーティリティ・補助関数
	// ====================================================================================================

	/**
	 * 内部配列からベクトルを生成する (内部用)
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatVector
	 */
	protected static _fromBigFloatArray(values: BigFloat[]): BigFloatVector;
	/**
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatComplexVector
	 * @overload
	 */
	protected static _fromBigFloatArray(values: BigFloatLike[]): BigFloatComplexVector;
	protected static _fromBigFloatArray(values: BigFloatLike[]): BigFloatAnyVector {
		let vector: BigFloatAnyVector;
		if (values.every((v) => v instanceof BigFloat)) {
			vector = new this();
			vector._values = values;
		} else {
			vector = new BigFloatComplexVector();
			vector._values = values.map((v) => (v instanceof BigFloatComplex ? v : new BigFloatComplex(v)));
		}
		return vector;
	}

	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 明示精度
	 * @returns 変換された BigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat {
		if (value instanceof BigFloat) {
			const cloned = value.clone();
			if (precision === undefined || cloned._precision === precision) return cloned;
			return cloned.changePrecision(precision);
		}
		return new BigFloat(value, precision ?? BigFloat.DEFAULT_PRECISION);
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
			if (value instanceof BigFloat && value._precision > resolved) {
				resolved = value._precision;
			}
		}
		return resolved;
	}

	/**
	 * ベクトルの長さを非負の整数に正規化する (内部用)
	 * @param length - ベクトル長
	 * @returns 正規化されたベクトル長
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	protected static _normalizeLength(length: number): number {
		if (!Number.isFinite(length)) throw new RangeError("Vector length must be finite");
		const normalized = Math.trunc(length);
		if (normalized < 0) throw new RangeError("Vector length must be non-negative");
		return normalized;
	}

	/**
	 * 次元一致を検証する
	 * @param left - 左辺
	 * @param right - 右辺
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	protected static _assertSameLength(left: BigFloatAnyVector, right: BigFloatAnyVector): void {
		if (left.length !== right.length) throw new DimensionMismatchError("Vector dimensions must match");
	}

	/**
	 * 任意入力を BigFloatVector へ変換する (内部用)
	 * @param value - ベクトルまたは要素列
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatVector
	 */
	protected static _coerceVector(value: BigFloatVectorLike, referenceValues: BigFloatValue[]): BigFloatVector;
	/**
	 * @param value - ベクトルまたは要素列
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatComplexVector
	 * @overload
	 */
	protected static _coerceVector(value: BigFloatComplexVectorLike, referenceValues: BigFloatInputValue[]): BigFloatComplexVector;
	/**
	 * @param value - ベクトルまたは要素列
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatComplexVector
	 * @overload
	 */
	protected static _coerceVector(value: BigFloatAnyVectorLike, referenceValues: BigFloatInputValue[]): BigFloatComplexVector;
	/**
	 * @throws {TypeError} 複素数モードが無効な場合に複素数結果が生じた場合
	 */
	protected static _coerceVector(value: BigFloatAnyVectorLike, referenceValues: BigFloatInputValue[] = []): BigFloatAnyVector {
		if (value instanceof BigFloatVector || value instanceof BigFloatComplexVector) return value;
		const array = Array.from(value);
		const resolvedPrecision = BigFloatVector._resolvePrecision([...referenceValues, ...array]);
		return BigFloatVector.from(array, resolvedPrecision);
	}

	/**
	 * 各要素に対して変換関数を適用した新しいベクトルを返す (内部用)
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapValues(fn: (value: BigFloat, index: number) => BigFloatInputValue): this {
		const values = this._values.map((value, index) => {
			const mapped = fn(value.clone(), index);
			return BigFloatVector._toBigFloat(mapped as BigFloatValue, value._precision);
		});
		return BigFloatVector._fromBigFloatArray(values) as this;
	}

	/**
	 * オペランドとの二項演算を各要素に対して行う (内部用)
	 * @param other - ベクトルまたはスカラ値
	 * @param fn - 二項演算関数
	 * @returns 演算後の新しいベクトル
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数オペランドが渡された場合、または演算結果が複素数になった場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapWithOperand(other: BigFloatAnyVectorLike | BigFloatInputValue, fn: (left: BigFloatLike, right: BigFloatLike, index: number) => BigFloatInputValue): this | BigFloatAnyVector {
		if (other instanceof BigFloatComplexVector || BigFloat._isComplexValue(other)) {
			if (this._values.length > 0) {
				this._values[0]._assertComplexNumbersEnabled("operation");
			} else if (!BigFloat.config.allowComplexNumbers) {
				throw new TypeError("BigFloatVector operation does not accept BigFloatComplex by default. Enable config.allowComplexNumbers to allow complex results.");
			}
			const op = other instanceof BigFloatComplexVector ? other : BigFloatComplex.from(other as BigFloatComplex);
			return BigFloatComplexVector.from(this.toArray()).zipMap(op, (l, r, i) => fn(l.real, r, i));
		}

		if (other instanceof BigFloatVector || (typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat) && !(other instanceof BigFloatComplex))) {
			const vector = BigFloatVector._coerceVector(other as BigFloatAnyVectorLike, this._values);
			BigFloatVector._assertSameLength(this, vector);
			const values = this._values.map((value, index) => {
				const mapped = fn(value.clone(), vector._values[index].clone(), index);
				return BigFloatVector._toBigFloat(mapped as BigFloatValue, value._precision);
			});
			return BigFloatVector._fromBigFloatArray(values);
		}

		const right = BigFloatVector._toBigFloat(other as BigFloatValue, this._values[0]?._precision);
		return this._mapValues((value, index) => fn(value, right, index));
	}

	// ====================================================================================================
	// * ベクトル生成・初期化
	// ====================================================================================================

	/**
	 * 要素の反復可能オブジェクトから BigFloatVector を生成する
	 * @param values - 要素列
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 */
	public static from(values: BigFloatVectorLike, precision?: PrecisionValue): BigFloatVector;
	/**
	 * @param values - 要素列
	 * @param precision - 精度
	 * @returns BigFloatAnyVector インスタンス
	 * @overload
	 */
	public static from(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatAnyVector;
	/**
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public static from(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatAnyVector {
		const array = Array.from(values);
		if (array.some((v) => BigFloat._isComplexValue(v))) {
			if (!BigFloat.config.allowComplexNumbers) {
				throw new TypeError("BigFloatVector.from does not accept BigFloatComplex by default. Enable config.allowComplexNumbers to allow complex results.");
			}
			return BigFloatComplexVector.from(array, precision);
		}
		return new BigFloatVector(array, precision);
	}

	/**
	 * BigFloatStream からベクトルを生成する
	 * @param stream - ソースストリーム
	 * @returns 生成された BigFloatVector
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public static fromStream(stream: BigFloatStream): BigFloatAnyVector {
		return this.from(stream.toArray());
	}

	/**
	 * 引数リストからベクトルを生成する
	 * @param values - 要素のリスト
	 * @returns BigFloatVector インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	public static of(...values: BigFloatValue[]): BigFloatVector {
		return this.from(values);
	}

	/**
	 * 指定された値で埋められたベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	public static fill(length: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatVector {
		const normalizedLength = this._normalizeLength(length);
		if (normalizedLength === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([value], precision);
		const base = this._toBigFloat(value, resolvedPrecision);
		return this._fromBigFloatArray(Array.from({ length: normalizedLength }, () => base.clone()));
	}

	/**
	 * 零ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	public static zeros(length: number, precision?: PrecisionValue): BigFloatVector {
		return this.fill(length, 0, precision);
	}

	/**
	 * すべての要素が 1 のベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	public static ones(length: number, precision?: PrecisionValue): BigFloatVector {
		return this.fill(length, 1, precision);
	}

	/**
	 * 標準基底ベクトルを取得する (指定インデックスのみ 1 で他は 0)
	 * @param length - ベクトルの長さ
	 * @param index - 1 を配置する位置 (0 から length-1)
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {RangeError} インデックスが範囲外の場合
	 */
	public static basis(length: number, index: number, precision?: PrecisionValue): BigFloatVector {
		const normalizedLength = this._normalizeLength(length);
		const normalizedIndex = Math.trunc(index);
		if (normalizedIndex < 0 || normalizedIndex >= normalizedLength) throw new RangeError("Basis index out of range");
		const resolvedPrecision = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return this._fromBigFloatArray(Array.from({ length: normalizedLength }, (_, currentIndex) => new BigFloat(currentIndex === normalizedIndex ? 1 : 0, resolvedPrecision)));
	}

	/**
	 * 指定した範囲を等分割する数値ベクトルを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns 生成された BigFloatVector
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static linspace(start: BigFloatValue, end: BigFloatValue, count: number, precision?: PrecisionValue): BigFloatVector {
		const normalizedCount = this._normalizeLength(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, end], precision);
		const startValue = this._toBigFloat(start, resolvedPrecision);
		if (normalizedCount === 1) return this._fromBigFloatArray([startValue]);
		const endValue = this._toBigFloat(end, resolvedPrecision);
		const step = endValue.sub(startValue).div(normalizedCount - 1);
		const values: BigFloat[] = [];
		let current = startValue.clone();
		for (let index = 0; index < normalizedCount; index++) {
			if (index === normalizedCount - 1) {
				values.push(endValue.clone());
			} else {
				values.push(current);
				current = current.add(step);
			}
		}
		return this._fromBigFloatArray(values);
	}

	/**
	 * 乱数ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param options - 乱数範囲と精度のオプション
	 * @returns 生成された BigFloatVector
	 * @throws {RangeError} 最大値が最小値より小さい場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static random(length: number, options: BigFloatVectorRandomOptions = {}): BigFloatVector {
		const normalizedLength = this._normalizeLength(length);
		if (normalizedLength === 0) return this.empty();
		const min = options.min ?? 0;
		const max = options.max ?? 1;
		const resolvedPrecision = this._resolvePrecision([min, max], options.precision);
		const minValue = this._toBigFloat(min, resolvedPrecision);
		const maxValue = this._toBigFloat(max, resolvedPrecision);
		const span = maxValue.sub(minValue);
		if (span.lt(0)) throw new RangeError("Random range requires max >= min");
		if (span.isZero()) return this.fill(normalizedLength, minValue, resolvedPrecision);

		/**
		 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
		 * @throws {TypeError} 複素数モードが無効な場合
		 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
		 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
		 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
		 */
		const values = Array.from({ length: normalizedLength }, () => minValue.add(span.mul(BigFloat.random(resolvedPrecision))));
		return this._fromBigFloatArray(values);
	}

	// ====================================================================================================
	// * 要素アクセス・反復
	// ====================================================================================================

	/**
	 * ベクトルの要素数を取得する
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
	 * ベクトルが空 (次元が 0) かどうかを判定する
	 * @returns 空なら true
	 */
	public isEmpty(): boolean {
		return this.length === 0;
	}

	/**
	 * 指定したインデックスの要素を取得する (複製)
	 * @param index - インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 */
	public at(index: number): BigFloat | undefined {
		if (index < 0 || index >= this.length) return undefined;
		return this._values[index].clone();
	}

	/**
	 * ベクトルを複製する
	 * @returns 複製された BigFloatVector
	 */
	public clone(): BigFloatVector {
		return BigFloatVector._fromBigFloatArray(this._values.map((value) => value.clone()));
	}

	/**
	 * 要素の配列へ変換する
	 * @returns BigFloat の配列
	 */
	public toArray(): BigFloat[] {
		return this._values.map((value) => value.clone());
	}

	/**
	 * 要素を流すストリームへ変換する
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public toStream(): BigFloatStream {
		return BigFloatStream.from(this.toArray());
	}

	/**
	 * 要素を順に反復するイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	public [Symbol.iterator](): Iterator<BigFloat, void, undefined> {
		return this.toArray()[Symbol.iterator]();
	}

	// ====================================================================================================
	// * コレクション操作
	// ====================================================================================================

	/**
	 * 各要素に対して関数を実行する
	 * @param fn - 実行する関数
	 */
	public forEach(fn: (value: BigFloat, index: number) => void): void {
		for (let index = 0; index < this.length; index++) {
			fn(this._values[index].clone(), index);
		}
	}

	/**
	 * 各要素を変換した新しいベクトルを取得する
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public map(fn: (value: BigFloat, index: number) => BigFloatValue): this {
		return this._mapValues(fn);
	}

	/**
	 * 別のベクトルと要素ごとに対になる変換を行い、新しいベクトルを取得する
	 * @param other - 対象ベクトル
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 */
	public zipMap(other: BigFloatVectorLike, fn: (left: BigFloatLike, right: BigFloatLike, index: number) => BigFloatValue): this;
	/**
	 * @param other - 対象ベクトル
	 * @param fn - 変換関数
	 * @returns 変換後の新しい複素ベクトル
	 * @overload
	 */
	public zipMap(other: BigFloatComplexVectorLike, fn: (left: BigFloatLike, right: BigFloatLike, index: number) => BigFloatInputValue): BigFloatComplexVector;
	/**
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数オペランドまたは結果が生じた場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public zipMap(other: BigFloatAnyVectorLike, fn: (left: BigFloatLike, right: BigFloatLike, index: number) => BigFloatInputValue): this | BigFloatAnyVector {
		return this._mapWithOperand(other, fn);
	}

	/**
	 * 全要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 */
	public reduce<U>(fn: (acc: U, value: BigFloat, index: number) => U, initial: U): U {
		let acc = initial;
		for (let index = 0; index < this.length; index++) {
			acc = fn(acc, this._values[index].clone(), index);
		}
		return acc;
	}

	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	public some(fn: (value: BigFloat, index: number) => boolean): boolean {
		for (let index = 0; index < this.length; index++) {
			if (fn(this._values[index].clone(), index)) return true;
		}
		return false;
	}

	/**
	 * すべての要素が条件を満たすかどうかを判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	public every(fn: (value: BigFloat, index: number) => boolean): boolean {
		for (let index = 0; index < this.length; index++) {
			if (!fn(this._values[index].clone(), index)) return false;
		}
		return true;
	}

	// ====================================================================================================
	// * 結合・スライス
	// ====================================================================================================

	/**
	 * 別のベクトルまたは要素列を末尾に連結した新しいベクトルを取得する
	 * @param others - 連結する対象
	 * @returns 連結後の新しいベクトル
	 * @throws {TypeError} 複素数モードが無効な場合に複素数ベクトルを連結しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public concat(...others: BigFloatAnyVectorLike[]): BigFloatAnyVector {
		const values: BigFloatLike[] = this.toArray();
		for (const other of others) {
			values.push(...BigFloatVector._coerceVector(other, this._values).toArray());
		}
		return BigFloatVector._fromBigFloatArray(values);
	}

	/**
	 * ベクトルの一部を抽出した新しいベクトルを返す
	 * @param start - 開始位置
	 * @param end - 終了位置
	 * @returns 抽出された新しいベクトル
	 */
	public slice(start?: number, end?: number): this {
		return BigFloatVector._fromBigFloatArray(this._values.slice(start, end).map((value) => value.clone())) as this;
	}

	/**
	 * 要素の並びを反転させた新しいベクトルを取得する
	 * @returns 反転した新しいベクトル
	 */
	public reverse(): this {
		return BigFloatVector._fromBigFloatArray(
			this._values
				.slice()
				.reverse()
				.map((value) => value.clone()),
		) as this;
	}

	// ====================================================================================================
	// * 精度・比較系
	// ====================================================================================================

	/**
	 * すべての要素の精度を変更した新しいベクトルを取得する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public changePrecision(precision: PrecisionValue): this {
		const precisionBig = BigInt(precision);
		return this._mapValues((value) => value.changePrecision(precisionBig));
	}

	/**
	 * 別のベクトルと内容が等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public equals(other: BigFloatAnyVectorLike): boolean {
		const vector = BigFloatVector._coerceVector(other, this._values);
		if (this.length !== vector.length) return false;
		for (let index = 0; index < this.length; index++) {
			if (!this._values[index].eq(vector._values[index])) return false;
		}
		return true;
	}

	// ====================================================================================================
	// * 四則演算・基本関数
	// ====================================================================================================

	/**
	 * 各要素に別のベクトルまたはスカラ値を加算した新しいベクトルを取得する
	 * @param other - 加算するベクトルまたは数値
	 * @returns 加算後の新しいベクトル
	 */
	public add(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 加算する複素ベクトルまたは複素数
	 * @returns 加算後の新しい複素ベクトル
	 * @overload
	 */
	public add(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param other - 加算するベクトルまたは数値
	 * @returns 加算後の新しいベクトル
	 * @overload
	 */
	public add(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public add(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(other, (left, right) => left.add(right));
	}

	/**
	 * 各要素から別のベクトルまたはスカラ値を減算した新しいベクトルを取得する
	 * @param other - 減算するベクトルまたは数値
	 * @returns 減算後の新しいベクトル
	 */
	public sub(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 減算する複素ベクトルまたは複素数
	 * @returns 減算後の新しい複素ベクトル
	 * @overload
	 */
	public sub(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param other - 減算するベクトルまたは数値
	 * @returns 減算後の新しいベクトル
	 * @overload
	 */
	public sub(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public sub(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(other, (left, right) => left.sub(right));
	}

	/**
	 * 各要素にスカラ値を乗算した新しいベクトルを取得する
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しいベクトル
	 */
	public mul(scalar: BigFloatValue): this;
	/**
	 * @param scalar - 乗算する複素数
	 * @returns 乗算後の新しい複素ベクトル
	 * @overload
	 */
	public mul(scalar: BigFloatComplex): BigFloatComplexVector;
	/**
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しいベクトル
	 * @overload
	 */
	public mul(scalar: BigFloatInputValue): this | BigFloatAnyVector;
	/**
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public mul(scalar: BigFloatInputValue): this | BigFloatAnyVector {
		if (BigFloat._isComplexValue(scalar)) {
			this._values[0]?._assertComplexNumbersEnabled("mul");
			return BigFloatComplexVector.from(this.toArray()).mul(scalar);
		}
		return this._mapValues((value) => value.mul(scalar));
	}

	/**
	 * 各要素をスカラ値で除算した新しいベクトルを取得する
	 * @param scalar - 除数
	 * @returns 除算後の新しいベクトル
	 */
	public div(scalar: BigFloatValue): this;
	/**
	 * @param scalar - 除数(複素数)
	 * @returns 除算後の新しい複素ベクトル
	 * @overload
	 */
	public div(scalar: BigFloatComplex): BigFloatComplexVector;
	/**
	 * @param scalar - 除数
	 * @returns 除算後の新しいベクトル
	 * @overload
	 */
	public div(scalar: BigFloatInputValue): this | BigFloatAnyVector;
	/**
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public div(scalar: BigFloatInputValue): this | BigFloatAnyVector {
		if (BigFloat._isComplexValue(scalar)) {
			this._values[0]?._assertComplexNumbersEnabled("div");
			return BigFloatComplexVector.from(this.toArray()).div(scalar);
		}
		return this._mapValues((value) => value.div(scalar));
	}

	/**
	 * 各要素に対して剰余演算を行った新しいベクトルを取得する
	 * @param other - 法
	 * @returns 演算後の新しいベクトル
	 * @throws {TypeError} BigFloat.mod does not support BigFloatComplex operands
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public mod(other: BigFloatValue | BigFloatVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(other, (left, right) => left.mod(right));
	}

	/**
	 * 別のベクトルとのアダマール積 (要素ごとの積) を計算する
	 * @param other - 対象ベクトル
	 * @returns Hadamard積の結果のベクトル
	 */
	public hadamard(other: BigFloatVectorLike): this;
	/**
	 * @param other - 対象の複素ベクトル
	 * @returns Hadamard積の結果の複素ベクトル
	 * @overload
	 */
	public hadamard(other: BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public hadamard(other: BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(other, (left, right) => left.mul(right));
	}

	/**
	 * 各要素の符号を反転させた新しいベクトルを取得する
	 * @returns 符号反転後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public neg(): this {
		return this._mapValues((value) => value.neg());
	}

	/**
	 * 各要素を絶対値にした新しいベクトルを取得する
	 * @returns 絶対値適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public abs(): this {
		return this._mapValues((value) => value.abs());
	}

	/**
	 * 各要素の符号 (1, 0, -1) を持つベクトルを取得する
	 * @returns 符号ベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public sign(): this {
		return this._mapValues((value) => value.sign());
	}

	/**
	 * 各要素の逆数を持つベクトルを取得する
	 * @returns 逆数ベクトル
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public reciprocal(): this {
		return this._mapValues((value) => value.reciprocal());
	}

	// ====================================================================================================
	// * 冪乗・ルート・スケーリング
	// ====================================================================================================

	/**
	 * 各要素を指定した指数で冪乗した新しいベクトルを取得する
	 * @param exponent - 指数
	 * @returns 冪乗後の新しいベクトル
	 */
	public pow(exponent: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param exponent - 指数(複素数)
	 * @returns 冪乗後の新しい複素ベクトル
	 * @overload
	 */
	public pow(exponent: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param exponent - 指数
	 * @returns 冪乗後の新しいベクトル
	 * @overload
	 */
	public pow(exponent: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * @throws {RangeError} 負の数の非整数乗が実数にならない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public pow(exponent: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(exponent, (left, right) => left.pow(right as BigFloat));
	}

	/**
	 * 各要素の平方根を計算した新しいベクトルを取得する
	 * @returns 平方根適用後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sqrt(): this {
		return this._mapValues((value) => value.sqrt());
	}

	/**
	 * 各要素の立方根を計算した新しいベクトルを取得する
	 * @returns 立方根適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	public cbrt(): this {
		return this._mapValues((value) => value.cbrt());
	}

	/**
	 * 各要素の n 乗根を計算した新しいベクトルを取得する
	 * @param n - 指数
	 * @returns n 乗根適用後の新しいベクトル
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public nthRoot(n: number | bigint): this {
		return this._mapValues((value) => value.nthRoot(n));
	}

	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理した新しいベクトルを取得する
	 * @returns 床関数適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public floor(): this {
		return this._mapValues((value) => value.floor());
	}

	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理した新しいベクトルを取得する
	 * @returns 天井関数適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public ceil(): this {
		return this._mapValues((value) => value.ceil());
	}

	/**
	 * 各要素を四捨五入した新しいベクトルを取得する
	 * @returns 四捨五入後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public round(): this {
		return this._mapValues((value) => value.round());
	}

	/**
	 * 各要素を 0 方向に切り捨てた新しいベクトルを取得する
	 * @returns 切り捨て後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public trunc(): this {
		return this._mapValues((value) => value.trunc());
	}

	/**
	 * 各要素を Float32 精度に丸めた新しいベクトルを取得する
	 * @returns 丸め後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public fround(): this {
		return this._mapValues((value) => value.fround());
	}

	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えたベクトルを取得する
	 * @returns 結果のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public clz32(): this {
		return this._mapValues((value) => value.clz32());
	}

	/**
	 * 別のベクトルまたは数値との相対差を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 相対差のベクトル
	 */
	public relativeDiff(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 比較対象の複素ベクトル
	 * @returns 複素相対差のベクトル
	 * @overload
	 */
	public relativeDiff(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public relativeDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(other, (left, right) => left.relativeDiff(right));
	}

	/**
	 * 別のベクトルまたは数値との絶対差を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 絶対差のベクトル
	 */
	public absoluteDiff(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 比較対象の複素ベクトル
	 * @returns 複素絶対差のベクトル
	 * @overload
	 */
	public absoluteDiff(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public absoluteDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(other, (left, right) => left.absoluteDiff(right));
	}

	/**
	 * 別のベクトルまたは数値との百分率差分を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 百分率差分のベクトル (%)
	 */
	public percentDiff(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 比較対象の複素ベクトル
	 * @returns 複素百分率差分のベクトル (%)
	 * @overload
	 */
	public percentDiff(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public percentDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(other, (left, right) => left.percentDiff(right));
	}

	// ====================================================================================================
	// * 三角関数
	// ====================================================================================================

	/**
	 * 各要素の正弦 (sin) を計算したベクトルを取得する
	 * @returns sin 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sin(): this {
		return this._mapValues((value) => value.sin());
	}

	/**
	 * 各要素の余弦 (cos) を計算したベクトルを取得する
	 * @returns cos 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cos(): this {
		return this._mapValues((value) => value.cos());
	}

	/**
	 * 各要素の正接 (tan) を計算したベクトルを取得する
	 * @returns tan 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tan(): this {
		return this._mapValues((value) => value.tan());
	}

	/**
	 * 各要素の逆正弦 (asin) を計算したベクトルを取得する
	 * @returns asin 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asin(): this {
		return this._mapValues((value) => value.asin());
	}

	/**
	 * 各要素の逆余弦 (acos) を計算したベクトルを取得する
	 * @returns acos 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acos(): this {
		return this._mapValues((value) => value.acos());
	}

	/**
	 * 各要素の逆正接 (atan) を計算したベクトルを取得する
	 * @returns atan 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public atan(): this {
		return this._mapValues((value) => value.atan());
	}

	/**
	 * 各要素に対して atan2 を計算したベクトルを取得する
	 * @param x - x 座標のベクトルまたは数値
	 * @returns atan2 適用後のベクトル
	 */
	public atan2(x: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param x - x 座標の複素ベクトルまたは複素数
	 * @returns atan2 適用後の複素ベクトル
	 * @overload
	 */
	public atan2(x: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param x - x 座標
	 * @returns atan2 適用後のベクトル
	 * @overload
	 */
	public atan2(x: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合、または非実数複素数に対して atan2 を適用しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	public atan2(x: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(x, (left, right) => {
			if (left instanceof BigFloat) return left.atan2(right as BigFloat);
			if (!left.isReal() || (right instanceof BigFloatComplex && !right.isReal())) throw new TypeError("atan2 is not supported for non-real complex numbers");
			return new BigFloatComplex(left.real.atan2(right instanceof BigFloatComplex ? right.real : right), 0, left.precision);
		});
	}

	// ====================================================================================================
	// * 双曲線関数
	// ====================================================================================================

	/**
	 * 各要素の双曲線正弦 (sinh) を計算したベクトルを取得する
	 * @returns sinh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public sinh(): this {
		return this._mapValues((value) => value.sinh());
	}

	/**
	 * 各要素の双曲線余弦 (cosh) を計算したベクトルを取得する
	 * @returns cosh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cosh(): this {
		return this._mapValues((value) => value.cosh());
	}

	/**
	 * 各要素の双曲線正接 (tanh) を計算したベクトルを取得する
	 * @returns tanh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public tanh(): this {
		return this._mapValues((value) => value.tanh());
	}

	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算したベクトルを取得する
	 * @returns asinh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asinh(): this {
		return this._mapValues((value) => value.asinh());
	}

	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算したベクトルを取得する
	 * @returns acosh 適用後のベクトル
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acosh(): this {
		return this._mapValues((value) => value.acosh());
	}

	/**
	 * 各要素の逆双曲線正接 (atanh) を計算したベクトルを取得する
	 * @returns atanh 適用後のベクトル
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atanh(): this {
		return this._mapValues((value) => value.atanh());
	}

	// ====================================================================================================
	// * 対数・指数・自然定数
	// ====================================================================================================

	/**
	 * 各要素の指数関数 (exp) を計算したベクトルを取得する
	 * @returns exp 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public exp(): this {
		return this._mapValues((value) => value.exp());
	}

	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算したベクトルを取得する
	 * @returns exp2 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public exp2(): this {
		return this._mapValues((value) => value.exp2());
	}

	/**
	 * 各要素に対して exp(x) - 1 を計算したベクトルを取得する
	 * @returns expm1 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public expm1(): this {
		return this._mapValues((value) => value.expm1());
	}

	/**
	 * 各要素の自然対数 (ln) を計算したベクトルを取得する
	 * @returns ln 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public ln(): this {
		return this._mapValues((value) => value.ln());
	}

	/**
	 * 各要素の任意の底による対数を計算したベクトルを取得する
	 * @param base - 底
	 * @returns 対数計算後のベクトル
	 */
	public log(base: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param base - 底(複素数)
	 * @returns 対数計算後の複素ベクトル
	 * @overload
	 */
	public log(base: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param base - 底
	 * @returns 対数計算後のベクトル
	 * @overload
	 */
	public log(base: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public log(base: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector {
		return this._mapWithOperand(base, (left, right) => left.log(right as BigFloat));
	}

	/**
	 * 各要素の底を 2 とする対数を計算したベクトルを取得する
	 * @returns log2 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log2(): this {
		return this._mapValues((value) => value.log2());
	}

	/**
	 * 各要素の常用対数 (log10) を計算したベクトルを取得する
	 * @returns log10 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log10(): this {
		return this._mapValues((value) => value.log10());
	}

	/**
	 * 各要素に対して ln(1 + x) を計算したベクトルを取得する
	 * @returns log1p 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public log1p(): this {
		return this._mapValues((value) => value.log1p());
	}

	// ====================================================================================================
	// * 特殊関数・積分・ガンマ関数など
	// ====================================================================================================

	/**
	 * 各要素に対してガンマ関数を計算したベクトルを取得する
	 * @returns ガンマ関数適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public gamma(): this {
		return this._mapValues((value) => value.gamma());
	}

	/**
	 * 各要素に対してリーマンゼータ関数を計算したベクトルを取得する
	 * @returns ゼータ関数適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public zeta(): this {
		return this._mapValues((value) => value.zeta());
	}

	/**
	 * 各要素に対して階乗を計算したベクトルを取得する
	 * @returns 階乗適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public factorial(): this {
		return this._mapValues((value) => value.factorial());
	}

	// ====================================================================================================
	// * 統計関数
	// ====================================================================================================

	/**
	 * 最大値を返す
	 * @returns 最大値
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public max(): BigFloat {
		if (this.isEmpty()) throw new TypeError("No arguments provided");
		let result = this._values[0];
		for (let index = 1; index < this.length; index++) {
			if (this._values[index].gt(result)) result = this._values[index];
		}
		return result.clone();
	}

	/**
	 * 最小値を返す
	 * @returns 最小値
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public min(): BigFloat {
		if (this.isEmpty()) throw new TypeError("No arguments provided");
		let result = this._values[0];
		for (let index = 1; index < this.length; index++) {
			if (this._values[index].lt(result)) result = this._values[index];
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
		let total = this._values[0].clone();
		for (let index = 1; index < this.length; index++) {
			total = total.add(this._values[index]);
		}
		return total;
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
		let total = this._values[0].clone();
		for (let index = 1; index < this.length; index++) {
			total = total.mul(this._values[index]);
		}
		return total;
	}

	/**
	 * 全要素の平均値を計算する
	 * @returns 平均
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	public average(): BigFloat {
		if (this.isEmpty()) return new BigFloat(0);
		return this.sum().div(this.length);
	}

	// ====================================================================================================
	// * ベクトル演算
	// ====================================================================================================

	/**
	 * 別のベクトルとの内積を計算する
	 * @param other - 対象ベクトル
	 * @returns 内積の値
	 */
	public dot(other: BigFloatVectorLike): BigFloat;
	/**
	 * @param other - 対象の複素ベクトル
	 * @returns 複素内積の値
	 * @overload
	 */
	public dot(other: BigFloatAnyVectorLike): BigFloatComplex;
	/**
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public dot(other: BigFloatAnyVectorLike): BigFloatLike {
		const vector = BigFloatVector._coerceVector(other, this._values);
		BigFloatVector._assertSameLength(this, vector);
		let total: BigFloatLike = new BigFloat(0, BigFloatVector._resolvePrecision([...this._values, ...vector._values]));
		for (let index = 0; index < this.length; index++) {
			total = total.add(this._values[index].mul(vector._values[index]));
		}
		return total;
	}

	/**
	 * 二乗ノルム (自分自身との内積) を計算する
	 * @returns 二乗ノルム
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public squaredNorm(): BigFloat {
		return this.dot(this);
	}

	/**
	 * ノルム (ベクトルの長さ) を計算する
	 * @returns ノルム
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public norm(): BigFloat {
		return this.squaredNorm().sqrt();
	}

	/**
	 * ベクトルを正規化する (長さを 1 にする)
	 * @returns 正規化された新しいベクトル
	 * @throws {DimensionMismatchError} ベクトルの長さが 0 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public normalize(): this {
		const length = this.norm();
		if (length.isZero()) throw new DivisionByZeroError("Cannot normalize zero vector");
		return this.div(length);
	}

	/**
	 * 別のベクトルとの二乗距離を計算する
	 * @param other - 対象ベクトル
	 * @returns 二乗距離
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public squaredDistanceTo(other: BigFloatVectorLike): BigFloat {
		return this.sub(other).squaredNorm();
	}

	/**
	 * 別のベクトルとの距離を計算する
	 * @param other - 対象ベクトル
	 * @returns 距離
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	public distanceTo(other: BigFloatVectorLike): BigFloat {
		return this.squaredDistanceTo(other).sqrt();
	}

	/**
	 * 別のベクトルへの正射影ベクトルを計算する
	 * @param other - 射影先のベクトル
	 * @returns 射影された新しいベクトル
	 */
	public projectOnto(other: BigFloatVectorLike): this;
	/**
	 * @param other - 射影先の複素ベクトル
	 * @returns 射影された新しい複素ベクトル
	 * @overload
	 */
	public projectOnto(other: BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @throws {DimensionMismatchError} 射影先のベクトルの長さが 0 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public projectOnto(other: BigFloatAnyVectorLike): this | BigFloatAnyVector {
		const vector = BigFloatVector._coerceVector(other, this._values);
		const denominator = vector.squaredNorm();
		if (denominator.isZero()) throw new DivisionByZeroError("Cannot project onto zero vector");
		const scale = this.dot(vector).div(denominator);
		return vector.mul(scale);
	}

	/**
	 * 別のベクトルとのなす角を計算する
	 * @param other - 対象ベクトル
	 * @returns 角度 (ラジアン)
	 * @throws {DimensionMismatchError} いずれかのベクトルの長さが 0 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public angleTo(other: BigFloatVectorLike): BigFloat {
		const vector = BigFloatVector._coerceVector(other, this._values) as BigFloatVector;
		const denominator = this.norm().mul(vector.norm());
		if (denominator.isZero()) throw new DivisionByZeroError("Cannot compute angle with zero vector");
		let cosine = this.dot(vector).div(denominator);
		if (cosine.gt(1)) cosine = new BigFloat(1, cosine._precision);
		if (cosine.lt(-1)) cosine = new BigFloat(-1, cosine._precision);
		return cosine.acos();
	}

	/**
	 * 別のベクトルとの外積を計算する (3次元ベクトル専用)
	 * @param other - 対象ベクトル
	 * @returns 外積の結果の新しいベクトル
	 */
	public cross(other: BigFloatVectorLike): this;
	/**
	 * @param other - 対象の複素ベクトル
	 * @returns 外積の結果の新しい複素ベクトル
	 * @overload
	 */
	public cross(other: BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @throws {DimensionMismatchError} いずれかのベクトルが 3 次元でない場合、または次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public cross(other: BigFloatAnyVectorLike): this | BigFloatAnyVector {
		const vector = BigFloatVector._coerceVector(other, this._values);
		BigFloatVector._assertSameLength(this, vector);
		if (this.length !== 3) throw new DimensionMismatchError("Cross product is only defined for 3-dimensional vectors");
		const [ax, ay, az] = this._values;
		const [bx, by, bz] = vector._values;
		return BigFloatVector._fromBigFloatArray([ay.mul(bz).sub(az.mul(by)), az.mul(bx).sub(ax.mul(bz)), ax.mul(by).sub(ay.mul(bx))]);
	}

	// ====================================================================================================
	// * 定数オブジェクト
	// ====================================================================================================

	/**
	 * 空のベクトル (次元 0) を生成する
	 * @returns 空のベクトル
	 */
	public static empty(): BigFloatVector {
		return this._fromBigFloatArray([]);
	}
}
