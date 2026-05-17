import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import { BigFloatStream } from "./bigFloatStream";
import { BigFloatVector } from "./bigFloatVector";
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
	/**
	 * 内部要素 (BigFloatComplex の配列)
	 */
	public _values: BigFloatComplex[];

	/**
	 * BigFloatComplexVector コンストラクタ
	 * @param values - 要素のソース
	 * @param precision - 精度
	 */
	public constructor(values: BigFloatAnyVectorLike = [], precision?: PrecisionValue) {
		const array = Array.from(values);
		const resolvedPrecision = BigFloatComplexVector._resolvePrecision(array, precision);
		this._values = array.map((value) => BigFloatComplexVector._toComplex(value, resolvedPrecision));
	}

	/**
	 * 内部配列からベクトルを生成する (内部用)
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatComplexVector
	 */
	protected static _fromComplexArray(values: BigFloatComplex[]): BigFloatComplexVector {
		const vector = Object.create(BigFloatComplexVector.prototype) as BigFloatComplexVector;
		vector._values = values;
		return vector;
	}

	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された BigFloatComplex
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
	 * @throws {RangeError} 次元が一致しない場合
	 */
	protected static _assertSameLength(left: BigFloatAnyVector, right: BigFloatAnyVector): void {
		if (left.length !== right.length) throw new RangeError("Vector dimensions must match");
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
	 * 各要素に対して変換関数を適用した新しいベクトルを返す (内部用)
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
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

	/**
	 * 空のベクトル (次元 0) を生成する
	 */
	public static empty(): BigFloatComplexVector {
		return this._fromComplexArray([]);
	}

	/**
	 * 要素の反復可能オブジェクトから BigFloatComplexVector を生成する
	 */
	public static from(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatComplexVector {
		return new BigFloatComplexVector(values, precision);
	}

	/**
	 * BigFloatStream からベクトルを生成する
	 */
	public static fromStream(stream: BigFloatStream): BigFloatComplexVector {
		return this.from(stream.toArray());
	}

	/**
	 * 引数リストからベクトルを生成する
	 */
	public static of(...values: BigFloatInputValue[]): BigFloatComplexVector {
		return this.from(values);
	}

	/**
	 * 指定された値で埋められたベクトルを生成する
	 */
	public static fill(length: number, value: BigFloatInputValue, precision?: PrecisionValue): BigFloatComplexVector {
		if (length <= 0) return this.empty();
		const resolvedPrecision = BigFloatComplexVector._resolvePrecision([value], precision);
		const base = BigFloatComplexVector._toComplex(value, resolvedPrecision);
		return this._fromComplexArray(Array.from({ length }, () => base.clone()));
	}

	/**
	 * 零ベクトルを生成する
	 */
	public static zeros(length: number, precision?: PrecisionValue): BigFloatComplexVector {
		return this.fill(length, 0, precision);
	}

	/**
	 * すべての要素が 1 のベクトルを生成する
	 */
	public static ones(length: number, precision?: PrecisionValue): BigFloatComplexVector {
		return this.fill(length, 1, precision);
	}

	/**
	 * 標準基底ベクトルを取得する
	 */
	public static basis(length: number, index: number, precision?: PrecisionValue): BigFloatComplexVector {
		if (index < 0 || index >= length) throw new RangeError("Index out of range");
		const p = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		return this._fromComplexArray(Array.from({ length }, (_, i) => new BigFloatComplex(i === index ? 1 : 0, 0, p)));
	}

	/**
	 * 指定した範囲を等分割する数値ベクトルを生成する
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

	public get length(): number {
		return this._values.length;
	}

	public dimension(): number {
		return this.length;
	}

	public isEmpty(): boolean {
		return this.length === 0;
	}

	public at(index: number): BigFloatComplex | undefined {
		if (index < 0 || index >= this.length) return undefined;
		return this._values[index].clone();
	}

	public clone(): BigFloatComplexVector {
		return BigFloatComplexVector._fromComplexArray(this._values.map((v) => v.clone()));
	}

	public toArray(): BigFloatComplex[] {
		return this._values.map((v) => v.clone());
	}

	/**
	 * 要素を流すストリームへ変換する
	 */
	public toStream(): BigFloatStream {
		return BigFloatStream.from(this.toArray());
	}

	public [Symbol.iterator](): Iterator<BigFloatComplex, void, undefined> {
		return this.toArray()[Symbol.iterator]();
	}

	public forEach(fn: (value: BigFloatComplex, index: number) => void): void {
		this._values.forEach((v, i) => fn(v.clone(), i));
	}

	public map(fn: (value: BigFloatComplex, index: number) => BigFloatInputValue): this {
		return this._mapValues(fn);
	}

	public zipMap(other: BigFloatAnyVectorLike, fn: (left: BigFloatComplex, right: BigFloatComplex, index: number) => BigFloatInputValue): this {
		return this._mapWithOperand(other, fn);
	}

	public reduce<U>(fn: (acc: U, value: BigFloatComplex, index: number) => U, initial: U): U {
		return this._values.reduce((acc, v, i) => fn(acc, v.clone(), i), initial);
	}

	public some(fn: (value: BigFloatComplex, index: number) => boolean): boolean {
		return this._values.some((v, i) => fn(v.clone(), i));
	}

	public every(fn: (value: BigFloatComplex, index: number) => boolean): boolean {
		return this._values.every((v, i) => fn(v.clone(), i));
	}

	public concat(...others: BigFloatAnyVectorLike[]): this {
		const values = this.toArray();
		for (const other of others) {
			values.push(...BigFloatComplexVector._coerceVector(other, this._values).toArray());
		}
		return BigFloatComplexVector._fromComplexArray(values) as this;
	}

	public slice(start?: number, end?: number): this {
		return BigFloatComplexVector._fromComplexArray(this._values.slice(start, end).map((v) => v.clone())) as this;
	}

	public reverse(): this {
		return BigFloatComplexVector._fromComplexArray([...this._values].reverse().map((v) => v.clone())) as this;
	}

	public changePrecision(precision: PrecisionValue): this {
		const p = BigInt(precision);
		return this._mapValues((v) => v.changePrecision(p));
	}

	public equals(other: BigFloatAnyVectorLike): boolean {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		if (this.length !== vector.length) return false;
		return this._values.every((v, i) => v.equals(vector._values[i]));
	}

	public add(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.add(r));
	}

	public sub(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.sub(r));
	}

	public mul(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexVector._toComplex(scalar, this._values[0]?.precision);
		return this._mapValues((v) => v.mul(s));
	}

	public div(scalar: BigFloatInputValue): this {
		const s = BigFloatComplexVector._toComplex(scalar, this._values[0]?.precision);
		return this._mapValues((v) => v.div(s));
	}

	public mod(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.mod(r));
	}

	public hadamard(other: BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.mul(r));
	}

	public neg(): this {
		return this._mapValues((v) => v.neg());
	}

	public abs(): BigFloatVector {
		return BigFloatVector.from(this._values.map((v) => v.abs()));
	}

	public sign(): this {
		return this._mapValues((v) => v.sign());
	}

	public reciprocal(): this {
		return this._mapValues((v) => v.reciprocal());
	}

	public pow(exponent: BigFloatInputValue | BigFloatAnyVectorLike): this {
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

	public relativeDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.relativeDiff(r));
	}

	public absoluteDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(other, (l, r) => l.absoluteDiff(r));
	}

	public percentDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this {
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

	public expm1(): this {
		return this._mapValues((v) => v.expm1());
	}

	public ln(): this {
		return this._mapValues((v) => v.ln());
	}

	public log(base: BigFloatInputValue | BigFloatAnyVectorLike): this {
		return this._mapWithOperand(base, (l, r) => l.log(r));
	}

	public log2(): this {
		return this._mapValues((v) => v.log(2));
	}

	public log10(): this {
		return this._mapValues((v) => v.log(10));
	}

	public max(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		// Complex numbers don't have a natural ordering, but we follow BigFloatVector logic if possible
		// BigFloatComplex doesn't have gt/lt.
		throw new TypeError("max() is not supported for complex vectors");
	}

	public min(): BigFloatComplex {
		if (this.isEmpty()) throw new TypeError("No elements");
		throw new TypeError("min() is not supported for complex vectors");
	}

	public sum(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0);
		return this._values.reduce((acc, v) => acc.add(v), new BigFloatComplex(0, this._values[0].precision));
	}

	public product(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(1);
		return this._values.reduce((acc, v) => acc.mul(v), new BigFloatComplex(1, this._values[0].precision));
	}

	public average(): BigFloatComplex {
		if (this.isEmpty()) return new BigFloatComplex(0);
		return this.sum().div(this.length);
	}

	public dot(other: BigFloatAnyVectorLike): BigFloatComplex {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		BigFloatComplexVector._assertSameLength(this, vector);
		let total = new BigFloatComplex(0, BigFloatComplexVector._resolvePrecision([...this._values, ...vector._values]));
		for (let i = 0; i < this.length; i++) {
			total = total.add(this._values[i].mul(vector._values[i]));
		}
		return total;
	}

	public squaredNorm(): BigFloat {
		// For complex vectors, squared norm is sum(|v_i|^2)
		return this._values.reduce((acc, v) => acc.add(v.absSquared()), new BigFloat(0, this._values[0]?.precision));
	}

	public norm(): BigFloat {
		return this.squaredNorm().sqrt();
	}

	public normalize(): this {
		const length = this.norm();
		if (length.isZero()) throw new RangeError("Cannot normalize zero vector");
		return this.div(length);
	}

	public distanceTo(other: BigFloatAnyVectorLike): BigFloat {
		return this.sub(other).norm();
	}

	public cross(other: BigFloatAnyVectorLike): this {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		BigFloatComplexVector._assertSameLength(this, vector);
		if (this.length !== 3) throw new RangeError("Cross product is only defined for 3-dimensional vectors");
		const [ax, ay, az] = this._values;
		const [bx, by, bz] = vector._values;
		return BigFloatComplexVector._fromComplexArray([ay.mul(bz).sub(az.mul(by)), az.mul(bx).sub(ax.mul(bz)), ax.mul(by).sub(ay.mul(bx))]) as this;
	}

	public squaredDistanceTo(other: BigFloatAnyVectorLike): BigFloat {
		return this.sub(other).squaredNorm();
	}

	/**
	 * 別のベクトルへの正射影ベクトルを計算する
	 */
	public projectOnto(other: BigFloatAnyVectorLike): this {
		const vector = BigFloatComplexVector._coerceVector(other, this._values);
		const denominator = vector.squaredNorm();
		if (denominator.isZero()) throw new RangeError("Cannot project onto zero vector");
		const scale = this.dot(vector).div(denominator);
		return vector.mul(scale) as this;
	}
}
