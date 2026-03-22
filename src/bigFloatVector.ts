import { BigFloat } from "./bigFloat";
import { BigFloatStream } from "./bigFloatStream";
import type { BigFloatValue, PrecisionValue } from "./types";

type BigFloatVectorSource = Iterable<BigFloatValue>;
type BigFloatVectorOperand = BigFloatVector | BigFloatVectorSource;
type BigFloatVectorRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};

/**
 * BigFloat を固定長ベクトルとして扱うクラス
 */
export class BigFloatVector implements Iterable<BigFloat> {
	/** 内部要素 */
	protected _values: BigFloat[];

	/**
	 * @param values - 要素列
	 * @param precision - 変換時の精度
	 */
	public constructor(values: BigFloatVectorSource = [], precision?: PrecisionValue) {
		const array = Array.from(values);
		const resolvedPrecision = BigFloatVector._resolvePrecision(array, precision);
		this._values = array.map((value) => BigFloatVector._toBigFloat(value, resolvedPrecision));
	}

	/**
	 * 内部配列からベクトルを生成する
	 * @param values - 内部所有済みの要素列
	 * @returns BigFloatVector
	 */
	protected static _fromBigFloatArray(values: BigFloat[]): BigFloatVector {
		const vector = Object.create(BigFloatVector.prototype) as BigFloatVector;
		vector._values = values;
		return vector;
	}

	/**
	 * 値をBigFloatへ変換する
	 * @param value - 変換対象
	 * @param precision - 明示精度
	 * @returns BigFloat
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
	 * 精度を解決する
	 * @param values - 値列
	 * @param precision - 明示精度
	 * @returns 解決済み精度
	 */
	protected static _resolvePrecision(values: BigFloatValue[], precision?: PrecisionValue): bigint {
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
	 * ベクトル長を正規化する
	 * @param length - ベクトル長
	 * @returns 正規化済みベクトル長
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
	 * @throws {RangeError} 次元が一致しない場合
	 */
	protected static _assertSameLength(left: BigFloatVector, right: BigFloatVector): void {
		if (left.length !== right.length) throw new RangeError("Vector dimensions must match");
	}

	/**
	 * 任意入力をベクトル化する
	 * @param value - ベクトルまたは要素列
	 * @returns BigFloatVector
	 */
	protected static _coerceVector(value: BigFloatVectorOperand, referenceValues: BigFloatValue[] = []): BigFloatVector {
		if (value instanceof BigFloatVector) return value;
		const array = Array.from(value);
		const resolvedPrecision = BigFloatVector._resolvePrecision([...referenceValues, ...array]);
		return BigFloatVector.from(array, resolvedPrecision);
	}

	/**
	 * 要素ごとの写像を行う
	 * @param fn - 変換関数
	 * @returns 変換後のベクトル
	 */
	protected _mapValues(fn: (value: BigFloat, index: number) => BigFloatValue): this {
		const values = this._values.map((value, index) => {
			const mapped = fn(value.clone(), index);
			return mapped instanceof BigFloat ? mapped.clone() : BigFloatVector._toBigFloat(mapped, value._precision);
		});
		return BigFloatVector._fromBigFloatArray(values) as this;
	}

	/**
	 * 要素ごとの二項演算を行う
	 * @param other - ベクトルまたはスカラ値
	 * @param fn - 変換関数
	 * @returns 演算後のベクトル
	 */
	protected _mapWithOperand(other: BigFloatVectorOperand | BigFloatValue, fn: (left: BigFloat, right: BigFloat, index: number) => BigFloatValue): this {
		if (other instanceof BigFloatVector || (typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat))) {
			const vector = BigFloatVector._coerceVector(other as BigFloatVectorOperand, this._values);
			BigFloatVector._assertSameLength(this, vector);
			const values = this._values.map((value, index) => {
				const mapped = fn(value.clone(), vector._values[index].clone(), index);
				return mapped instanceof BigFloat ? mapped.clone() : BigFloatVector._toBigFloat(mapped, value._precision);
			});
			return BigFloatVector._fromBigFloatArray(values) as this;
		}

		return this._mapValues((value, index) => fn(value, BigFloatVector._toBigFloat(other as BigFloatValue, value._precision), index));
	}

	/**
	 * 空ベクトルを生成する
	 * @returns 空ベクトル
	 */
	public static empty(): BigFloatVector {
		return this._fromBigFloatArray([]);
	}

	/**
	 * 要素列からベクトルを生成する
	 * @param values - 要素列
	 * @param precision - 変換時の精度
	 * @returns BigFloatVector
	 */
	public static from(values: BigFloatVectorSource, precision?: PrecisionValue): BigFloatVector {
		return new BigFloatVector(values, precision);
	}

	/**
	 * Stream からベクトルを生成する
	 * @param stream - 変換元ストリーム
	 * @returns BigFloatVector
	 */
	public static fromStream(stream: BigFloatStream): BigFloatVector {
		return this.from(stream.toArray());
	}

	/**
	 * 値の並びからベクトルを生成する
	 * @param values - 要素列
	 * @returns BigFloatVector
	 */
	public static of(...values: BigFloatValue[]): BigFloatVector {
		return this.from(values);
	}

	/**
	 * 指定値で埋めたベクトルを生成する
	 * @param length - ベクトル長
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	public static fill(length: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatVector {
		const normalizedLength = this._normalizeLength(length);
		if (normalizedLength === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([value], precision);
		const base = this._toBigFloat(value, resolvedPrecision);
		return this._fromBigFloatArray(Array.from({ length: normalizedLength }, () => base.clone()));
	}

	/**
	 * 0ベクトルを生成する
	 * @param length - ベクトル長
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	public static zeros(length: number, precision?: PrecisionValue): BigFloatVector {
		return this.fill(length, 0, precision);
	}

	/**
	 * 1ベクトルを生成する
	 * @param length - ベクトル長
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	public static ones(length: number, precision?: PrecisionValue): BigFloatVector {
		return this.fill(length, 1, precision);
	}

	/**
	 * 標準基底ベクトルを生成する
	 * @param length - ベクトル長
	 * @param index - 1を置く位置
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	public static basis(length: number, index: number, precision?: PrecisionValue): BigFloatVector {
		const normalizedLength = this._normalizeLength(length);
		const normalizedIndex = Math.trunc(index);
		if (normalizedIndex < 0 || normalizedIndex >= normalizedLength) throw new RangeError("Basis index out of range");
		const resolvedPrecision = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return this._fromBigFloatArray(Array.from({ length: normalizedLength }, (_, currentIndex) => new BigFloat(currentIndex === normalizedIndex ? 1 : 0, resolvedPrecision)));
	}

	/**
	 * 線形補間ベクトルを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatVector
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
	 * @param length - ベクトル長
	 * @param options - 生成オプション
	 * @returns BigFloatVector
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

		const values = Array.from({ length: normalizedLength }, () => minValue.add(span.mul(BigFloat.random(resolvedPrecision))));
		return this._fromBigFloatArray(values);
	}

	/**
	 * ベクトル長
	 */
	public get length(): number {
		return this._values.length;
	}

	/**
	 * ベクトルの次元数を返す
	 * @returns 次元数
	 */
	public dimension(): number {
		return this.length;
	}

	/**
	 * 空ベクトルかどうか
	 * @returns 空ならtrue
	 */
	public isEmpty(): boolean {
		return this.length === 0;
	}

	/**
	 * 指定位置の値を取得する
	 * @param index - インデックス
	 * @returns 値またはundefined
	 */
	public at(index: number): BigFloat | undefined {
		if (index < 0 || index >= this.length) return undefined;
		return this._values[index].clone();
	}

	/**
	 * ベクトルを複製する
	 * @returns 複製されたベクトル
	 */
	public clone(): BigFloatVector {
		return BigFloatVector._fromBigFloatArray(this._values.map((value) => value.clone()));
	}

	/**
	 * 配列へ変換する
	 * @returns 要素配列
	 */
	public toArray(): BigFloat[] {
		return this._values.map((value) => value.clone());
	}

	/**
	 * Stream へ変換する
	 * @returns BigFloatStream
	 */
	public toStream(): BigFloatStream {
		return BigFloatStream.from(this.toArray());
	}

	/**
	 * イテレータ
	 * @returns イテレータ
	 */
	public [Symbol.iterator](): Iterator<BigFloat, void, undefined> {
		return this.toArray()[Symbol.iterator]();
	}

	/**
	 * 各要素に処理を適用する
	 * @param fn - 処理関数
	 */
	public forEach(fn: (value: BigFloat, index: number) => void): void {
		for (let index = 0; index < this.length; index++) {
			fn(this._values[index].clone(), index);
		}
	}

	/**
	 * 要素ごとに変換する
	 * @param fn - 変換関数
	 * @returns 変換後ベクトル
	 */
	public map(fn: (value: BigFloat, index: number) => BigFloatValue): this {
		return this._mapValues(fn);
	}

	/**
	 * 2つのベクトルを要素ごとに変換する
	 * @param other - 対象ベクトル
	 * @param fn - 変換関数
	 * @returns 変換後ベクトル
	 */
	public zipMap(other: BigFloatVectorOperand, fn: (left: BigFloat, right: BigFloat, index: number) => BigFloatValue): this {
		return this._mapWithOperand(other, fn);
	}

	/**
	 * 畳み込み処理を行う
	 * @param fn - 畳み込み関数
	 * @param initial - 初期値
	 * @returns 畳み込み結果
	 */
	public reduce<U>(fn: (acc: U, value: BigFloat, index: number) => U, initial: U): U {
		let acc = initial;
		for (let index = 0; index < this.length; index++) {
			acc = fn(acc, this._values[index].clone(), index);
		}
		return acc;
	}

	/**
	 * 条件に一致する要素があるか
	 * @param fn - 判定関数
	 * @returns 条件に一致する要素があればtrue
	 */
	public some(fn: (value: BigFloat, index: number) => boolean): boolean {
		for (let index = 0; index < this.length; index++) {
			if (fn(this._values[index].clone(), index)) return true;
		}
		return false;
	}

	/**
	 * すべての要素が条件を満たすか
	 * @param fn - 判定関数
	 * @returns すべて満たせばtrue
	 */
	public every(fn: (value: BigFloat, index: number) => boolean): boolean {
		for (let index = 0; index < this.length; index++) {
			if (!fn(this._values[index].clone(), index)) return false;
		}
		return true;
	}

	/**
	 * ベクトルを連結する
	 * @param others - 連結対象
	 * @returns 連結後ベクトル
	 */
	public concat(...others: BigFloatVectorOperand[]): this {
		const values = this.toArray();
		for (const other of others) {
			values.push(...BigFloatVector._coerceVector(other, this._values).toArray());
		}
		return BigFloatVector._fromBigFloatArray(values) as this;
	}

	/**
	 * スライスする
	 * @param start - 開始位置
	 * @param end - 終了位置
	 * @returns スライス後ベクトル
	 */
	public slice(start?: number, end?: number): this {
		return BigFloatVector._fromBigFloatArray(this._values.slice(start, end).map((value) => value.clone())) as this;
	}

	/**
	 * 逆順にする
	 * @returns 逆順ベクトル
	 */
	public reverse(): this {
		return BigFloatVector._fromBigFloatArray(
			this._values
				.slice()
				.reverse()
				.map((value) => value.clone()),
		) as this;
	}

	/**
	 * すべての要素の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度変更後ベクトル
	 */
	public changePrecision(precision: PrecisionValue): this {
		const precisionBig = BigInt(precision);
		return this._mapValues((value) => value.changePrecision(precisionBig));
	}

	/**
	 * ベクトル同士の一致判定
	 * @param other - 比較対象
	 * @returns 一致すればtrue
	 */
	public equals(other: BigFloatVectorOperand): boolean {
		const vector = BigFloatVector._coerceVector(other, this._values);
		if (this.length !== vector.length) return false;
		for (let index = 0; index < this.length; index++) {
			if (!this._values[index].eq(vector._values[index])) return false;
		}
		return true;
	}

	/**
	 * 各要素へ加算する
	 * @param other - スカラ値またはベクトル
	 * @returns 加算後ベクトル
	 */
	public add(other: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(other, (left, right) => left.add(right));
	}

	/**
	 * 各要素から減算する
	 * @param other - スカラ値またはベクトル
	 * @returns 減算後ベクトル
	 */
	public sub(other: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(other, (left, right) => left.sub(right));
	}

	/**
	 * スカラ倍する
	 * @param scalar - スカラ値
	 * @returns 乗算後ベクトル
	 */
	public mul(scalar: BigFloatValue): this {
		return this._mapValues((value) => value.mul(scalar));
	}

	/**
	 * スカラ除算する
	 * @param scalar - スカラ値
	 * @returns 除算後ベクトル
	 */
	public div(scalar: BigFloatValue): this {
		return this._mapValues((value) => value.div(scalar));
	}

	/**
	 * 剰余を計算する
	 * @param other - スカラ値またはベクトル
	 * @returns 剰余後ベクトル
	 */
	public mod(other: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(other, (left, right) => left.mod(right));
	}

	/**
	 * 要素ごとの積を計算する
	 * @param other - 対象ベクトル
	 * @returns Hadamard積
	 */
	public hadamard(other: BigFloatVectorOperand): this {
		return this._mapWithOperand(other, (left, right) => left.mul(right));
	}

	/**
	 * 符号を反転する
	 * @returns 反転後ベクトル
	 */
	public neg(): this {
		return this._mapValues((value) => value.neg());
	}

	/**
	 * 絶対値化する
	 * @returns 絶対値ベクトル
	 */
	public abs(): this {
		return this._mapValues((value) => value.abs());
	}

	/**
	 * 符号ベクトルを返す
	 * @returns 符号ベクトル
	 */
	public sign(): this {
		return this._mapValues((value) => value.sign());
	}

	/**
	 * 各要素の逆数を返す
	 * @returns 逆数ベクトル
	 */
	public reciprocal(): this {
		return this._mapValues((value) => value.reciprocal());
	}

	/**
	 * 要素ごとの冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗後ベクトル
	 */
	public pow(exponent: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(exponent, (left, right) => left.pow(right));
	}

	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根ベクトル
	 */
	public sqrt(): this {
		return this._mapValues((value) => value.sqrt());
	}

	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根ベクトル
	 */
	public cbrt(): this {
		return this._mapValues((value) => value.cbrt());
	}

	/**
	 * 各要素のn乗根を計算する
	 * @param n - 指数
	 * @returns n乗根ベクトル
	 */
	public nthRoot(n: number | bigint): this {
		return this._mapValues((value) => value.nthRoot(n));
	}

	/**
	 * 各要素を切り下げる
	 * @returns 切り下げ後ベクトル
	 */
	public floor(): this {
		return this._mapValues((value) => value.floor());
	}

	/**
	 * 各要素を切り上げる
	 * @returns 切り上げ後ベクトル
	 */
	public ceil(): this {
		return this._mapValues((value) => value.ceil());
	}

	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後ベクトル
	 */
	public round(): this {
		return this._mapValues((value) => value.round());
	}

	/**
	 * 各要素を0方向へ切り捨てる
	 * @returns 切り捨て後ベクトル
	 */
	public trunc(): this {
		return this._mapValues((value) => value.trunc());
	}

	/**
	 * 各要素をFloat32相当に丸める
	 * @returns Float32相当へ丸めたベクトル
	 */
	public fround(): this {
		return this._mapValues((value) => value.fround());
	}

	/**
	 * 各要素の先頭ゼロビット数を取得する
	 * @returns 先頭ゼロビット数ベクトル
	 */
	public clz32(): this {
		return this._mapValues((value) => value.clz32());
	}

	/**
	 * 相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差ベクトル
	 */
	public relativeDiff(other: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(other, (left, right) => left.relativeDiff(right));
	}

	/**
	 * 絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差ベクトル
	 */
	public absoluteDiff(other: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(other, (left, right) => left.absoluteDiff(right));
	}

	/**
	 * 百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分ベクトル
	 */
	public percentDiff(other: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(other, (left, right) => left.percentDiff(right));
	}

	/**
	 * 各要素の正弦を計算する
	 * @returns 正弦ベクトル
	 */
	public sin(): this {
		return this._mapValues((value) => value.sin());
	}

	/**
	 * 各要素の余弦を計算する
	 * @returns 余弦ベクトル
	 */
	public cos(): this {
		return this._mapValues((value) => value.cos());
	}

	/**
	 * 各要素の正接を計算する
	 * @returns 正接ベクトル
	 */
	public tan(): this {
		return this._mapValues((value) => value.tan());
	}

	/**
	 * 各要素の逆正弦を計算する
	 * @returns 逆正弦ベクトル
	 */
	public asin(): this {
		return this._mapValues((value) => value.asin());
	}

	/**
	 * 各要素の逆余弦を計算する
	 * @returns 逆余弦ベクトル
	 */
	public acos(): this {
		return this._mapValues((value) => value.acos());
	}

	/**
	 * 各要素の逆正接を計算する
	 * @returns 逆正接ベクトル
	 */
	public atan(): this {
		return this._mapValues((value) => value.atan());
	}

	/**
	 * 各要素と逆正接を計算する
	 * @param x - x座標
	 * @returns 逆正接ベクトル
	 */
	public atan2(x: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(x, (left, right) => left.atan2(right));
	}

	/**
	 * 各要素の双曲線正弦を計算する
	 * @returns 双曲線正弦ベクトル
	 */
	public sinh(): this {
		return this._mapValues((value) => value.sinh());
	}

	/**
	 * 各要素の双曲線余弦を計算する
	 * @returns 双曲線余弦ベクトル
	 */
	public cosh(): this {
		return this._mapValues((value) => value.cosh());
	}

	/**
	 * 各要素の双曲線正接を計算する
	 * @returns 双曲線正接ベクトル
	 */
	public tanh(): this {
		return this._mapValues((value) => value.tanh());
	}

	/**
	 * 各要素の逆双曲線正弦を計算する
	 * @returns 逆双曲線正弦ベクトル
	 */
	public asinh(): this {
		return this._mapValues((value) => value.asinh());
	}

	/**
	 * 各要素の逆双曲線余弦を計算する
	 * @returns 逆双曲線余弦ベクトル
	 */
	public acosh(): this {
		return this._mapValues((value) => value.acosh());
	}

	/**
	 * 各要素の逆双曲線正接を計算する
	 * @returns 逆双曲線正接ベクトル
	 */
	public atanh(): this {
		return this._mapValues((value) => value.atanh());
	}

	/**
	 * 各要素の指数関数を計算する
	 * @returns 指数関数ベクトル
	 */
	public exp(): this {
		return this._mapValues((value) => value.exp());
	}

	/**
	 * 各要素の2冪指数関数を計算する
	 * @returns 2冪指数関数ベクトル
	 */
	public exp2(): this {
		return this._mapValues((value) => value.exp2());
	}

	/**
	 * 各要素のexp(x)-1を計算する
	 * @returns expm1ベクトル
	 */
	public expm1(): this {
		return this._mapValues((value) => value.expm1());
	}

	/**
	 * 各要素の自然対数を計算する
	 * @returns 自然対数ベクトル
	 */
	public ln(): this {
		return this._mapValues((value) => value.ln());
	}

	/**
	 * 各要素の対数を計算する
	 * @param base - 底
	 * @returns 対数ベクトル
	 */
	public log(base: BigFloatValue | BigFloatVectorOperand): this {
		return this._mapWithOperand(base, (left, right) => left.log(right));
	}

	/**
	 * 各要素の底2対数を計算する
	 * @returns 底2対数ベクトル
	 */
	public log2(): this {
		return this._mapValues((value) => value.log2());
	}

	/**
	 * 各要素の底10対数を計算する
	 * @returns 底10対数ベクトル
	 */
	public log10(): this {
		return this._mapValues((value) => value.log10());
	}

	/**
	 * 各要素のlog(1+x)を計算する
	 * @returns log1pベクトル
	 */
	public log1p(): this {
		return this._mapValues((value) => value.log1p());
	}

	/**
	 * 各要素のガンマ関数を計算する
	 * @returns ガンマ関数ベクトル
	 */
	public gamma(): this {
		return this._mapValues((value) => value.gamma());
	}

	/**
	 * 各要素のゼータ関数を計算する
	 * @returns ゼータ関数ベクトル
	 */
	public zeta(): this {
		return this._mapValues((value) => value.zeta());
	}

	/**
	 * 各要素の階乗を計算する
	 * @returns 階乗ベクトル
	 */
	public factorial(): this {
		return this._mapValues((value) => value.factorial());
	}

	/**
	 * 最大値を返す
	 * @returns 最大値
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
	 * 合計を返す
	 * @returns 合計
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
	 * 積を返す
	 * @returns 積
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
	 * 平均を返す
	 * @returns 平均
	 */
	public average(): BigFloat {
		if (this.isEmpty()) return new BigFloat(0);
		return this.sum().div(this.length);
	}

	/**
	 * 内積を返す
	 * @param other - 対象ベクトル
	 * @returns 内積
	 */
	public dot(other: BigFloatVectorOperand): BigFloat {
		const vector = BigFloatVector._coerceVector(other, this._values);
		BigFloatVector._assertSameLength(this, vector);
		let total = new BigFloat(0, BigFloatVector._resolvePrecision([...this._values, ...vector._values]));
		for (let index = 0; index < this.length; index++) {
			total = total.add(this._values[index].mul(vector._values[index]));
		}
		return total;
	}

	/**
	 * 二乗ノルムを返す
	 * @returns 二乗ノルム
	 */
	public squaredNorm(): BigFloat {
		return this.dot(this);
	}

	/**
	 * ノルムを返す
	 * @returns ノルム
	 */
	public norm(): BigFloat {
		return this.squaredNorm().sqrt();
	}

	/**
	 * 正規化ベクトルを返す
	 * @returns 正規化ベクトル
	 */
	public normalize(): this {
		const length = this.norm();
		if (length.isZero()) throw new RangeError("Cannot normalize zero vector");
		return this.div(length);
	}

	/**
	 * 二乗距離を返す
	 * @param other - 対象ベクトル
	 * @returns 二乗距離
	 */
	public squaredDistanceTo(other: BigFloatVectorOperand): BigFloat {
		return this.sub(other).squaredNorm();
	}

	/**
	 * 距離を返す
	 * @param other - 対象ベクトル
	 * @returns 距離
	 */
	public distanceTo(other: BigFloatVectorOperand): BigFloat {
		return this.squaredDistanceTo(other).sqrt();
	}

	/**
	 * 射影ベクトルを返す
	 * @param other - 射影先ベクトル
	 * @returns 射影ベクトル
	 */
	public projectOnto(other: BigFloatVectorOperand): this {
		const vector = BigFloatVector._coerceVector(other, this._values);
		const denominator = vector.squaredNorm();
		if (denominator.isZero()) throw new RangeError("Cannot project onto zero vector");
		const scale = this.dot(vector).div(denominator);
		return vector.mul(scale) as this;
	}

	/**
	 * 2ベクトルのなす角を返す
	 * @param other - 対象ベクトル
	 * @returns 角度
	 */
	public angleTo(other: BigFloatVectorOperand): BigFloat {
		const vector = BigFloatVector._coerceVector(other, this._values);
		const denominator = this.norm().mul(vector.norm());
		if (denominator.isZero()) throw new RangeError("Cannot compute angle with zero vector");
		let cosine = this.dot(vector).div(denominator);
		if (cosine.gt(1)) cosine = new BigFloat(1, cosine._precision);
		if (cosine.lt(-1)) cosine = new BigFloat(-1, cosine._precision);
		return cosine.acos();
	}

	/**
	 * 3次元外積を返す
	 * @param other - 対象ベクトル
	 * @returns 外積ベクトル
	 */
	public cross(other: BigFloatVectorOperand): this {
		const vector = BigFloatVector._coerceVector(other, this._values);
		BigFloatVector._assertSameLength(this, vector);
		if (this.length !== 3) throw new RangeError("Cross product is only defined for 3-dimensional vectors");
		const [ax, ay, az] = this._values;
		const [bx, by, bz] = vector._values;
		return BigFloatVector._fromBigFloatArray([ay.mul(bz).sub(az.mul(by)), az.mul(bx).sub(ax.mul(bz)), ax.mul(by).sub(ay.mul(bx))]) as this;
	}
}
