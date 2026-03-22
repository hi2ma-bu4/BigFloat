import { BigFloat } from "./bigFloat";
import { BigFloatVector } from "./bigFloatVector";
import type { BigFloatValue, PrecisionValue } from "./types";

type BigFloatComplexObject = {
	re?: BigFloatValue;
	im?: BigFloatValue;
	real?: BigFloatValue;
	imag?: BigFloatValue;
};
type BigFloatComplexTuple = readonly [BigFloatValue, BigFloatValue];
type BigFloatComplexValue = BigFloatComplex | BigFloatValue | BigFloatComplexTuple | BigFloatComplexObject;
type BigFloatComplexAggregateSource = Iterable<BigFloatComplexValue>;

/**
 * BigFloat を用いた複素数クラス
 */
export class BigFloatComplex implements Iterable<BigFloat> {
	/** 実部 */
	protected _real: BigFloat;
	/** 虚部 */
	protected _imag: BigFloat;
	/** 精度 */
	protected _precision: bigint;

	/**
	 * @param real - 実部または複素数表現
	 * @param imag - 虚部
	 * @param precision - 精度
	 */
	public constructor(value?: BigFloatComplexValue, precision?: PrecisionValue);
	public constructor(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue);
	public constructor(real: BigFloatComplexValue = 0, imagOrPrecision?: BigFloatValue | PrecisionValue, precision?: PrecisionValue) {
		const { imagPartValue, precisionValue } = BigFloatComplex._normalizeArguments(real, imagOrPrecision, precision, arguments.length);
		const { realPart, imagPart } = BigFloatComplex._normalizeParts(real, imagPartValue);
		const resolvedPrecision = BigFloatComplex._resolvePrecision([realPart, imagPart], precisionValue);
		this._real = BigFloatComplex._toBigFloat(realPart, resolvedPrecision);
		this._imag = BigFloatComplex._toBigFloat(imagPart, resolvedPrecision);
		this._precision = resolvedPrecision;
	}

	/** BigFloat へ変換する */
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

	/** 内部 BigFloat から生成する */
	protected static _fromBigFloats(real: BigFloat, imag: BigFloat): BigFloatComplex {
		const complex = Object.create(BigFloatComplex.prototype) as BigFloatComplex;
		const precision = real._precision > imag._precision ? real._precision : imag._precision;
		complex._real = real._precision === precision ? real.clone() : real.clone().changePrecision(precision);
		complex._imag = imag._precision === precision ? imag.clone() : imag.clone().changePrecision(precision);
		complex._precision = precision;
		return complex;
	}

	/** 複素数表現を正規化する */
	protected static _normalizeParts(value: BigFloatComplexValue, imag?: BigFloatValue): { realPart: BigFloatValue; imagPart: BigFloatValue } {
		if (value instanceof BigFloatComplex) return { realPart: value._real, imagPart: value._imag };
		if (Array.isArray(value)) return { realPart: value[0] ?? 0, imagPart: value[1] ?? 0 };
		if (typeof value === "string") {
			const parsed = this._parseComplexString(value);
			if (parsed !== null) return parsed;
			return { realPart: value, imagPart: imag ?? 0 };
		}
		if (value instanceof BigFloat || typeof value === "number" || typeof value === "bigint") {
			return { realPart: value, imagPart: imag ?? 0 };
		}
		if (typeof value === "object" && value !== null) {
			const objectValue = value as BigFloatComplexObject;
			return {
				realPart: objectValue.re ?? objectValue.real ?? 0,
				imagPart: objectValue.im ?? objectValue.imag ?? 0,
			};
		}
		return { realPart: 0, imagPart: imag ?? 0 };
	}

	/** 引数を正規化する */
	protected static _normalizeArguments(value: BigFloatComplexValue, imagOrPrecision: BigFloatValue | PrecisionValue | undefined, precision?: PrecisionValue, argCount = 0): { imagPartValue: BigFloatValue; precisionValue: PrecisionValue | undefined } {
		if (argCount <= 1) return { imagPartValue: 0, precisionValue: precision };
		if (precision !== undefined) return { imagPartValue: imagOrPrecision as BigFloatValue, precisionValue: precision };
		if (argCount === 2 && this._shouldTreatSecondArgumentAsPrecision(value, imagOrPrecision)) {
			return { imagPartValue: 0, precisionValue: imagOrPrecision as PrecisionValue };
		}
		return { imagPartValue: imagOrPrecision as BigFloatValue, precisionValue: precision };
	}

	/** 第2引数を精度として解釈すべきか */
	protected static _shouldTreatSecondArgumentAsPrecision(value: BigFloatComplexValue, imagOrPrecision: BigFloatValue | PrecisionValue | undefined): boolean {
		if (typeof imagOrPrecision !== "number" && typeof imagOrPrecision !== "bigint") return false;
		if (value instanceof BigFloatComplex) return true;
		if (Array.isArray(value)) return true;
		if (typeof value === "string") return this._parseComplexString(value) !== null;
		return typeof value === "object" && value !== null;
	}

	/** 複素数文字列を解析する */
	protected static _parseComplexString(value: string): { realPart: BigFloatValue; imagPart: BigFloatValue } | null {
		const normalized = value.trim().replace(/\s+/g, "");
		if (!/[iI]/.test(normalized)) return null;
		if (!/[iI]$/.test(normalized) || (normalized.match(/[iI]/g)?.length ?? 0) !== 1) {
			throw new SyntaxError(`Invalid complex string: ${value}`);
		}

		const body = normalized.slice(0, -1);
		if (body === "") return { realPart: 0, imagPart: 1 };
		if (body === "+") return { realPart: 0, imagPart: 1 };
		if (body === "-") return { realPart: 0, imagPart: -1 };

		let splitIndex = -1;
		for (let i = 1; i < body.length; i++) {
			const char = body[i];
			if ((char === "+" || char === "-") && body[i - 1] !== "e" && body[i - 1] !== "E") splitIndex = i;
		}
		if (splitIndex === -1) return { realPart: 0, imagPart: this._normalizeImaginaryCoefficient(body, value) };

		const realPart = body.slice(0, splitIndex);
		const imagPart = body.slice(splitIndex);
		if (realPart === "") throw new SyntaxError(`Invalid complex string: ${value}`);
		return {
			realPart,
			imagPart: this._normalizeImaginaryCoefficient(imagPart, value),
		};
	}

	/** 虚部係数を正規化する */
	protected static _normalizeImaginaryCoefficient(value: string, original: string): BigFloatValue {
		if (value === "" || value === "+") return 1;
		if (value === "-") return -1;
		if (/[iI]/.test(value)) throw new SyntaxError(`Invalid complex string: ${original}`);
		return value;
	}

	/** 値を複素数へ変換する */
	protected static _toComplex(value: BigFloatComplexValue, precision?: bigint): BigFloatComplex {
		if (value instanceof BigFloatComplex) {
			if (precision === undefined || value._precision === precision) return value.clone();
			return value.changePrecision(precision);
		}
		if (precision === undefined) return new BigFloatComplex(value);
		if (this._shouldTreatSecondArgumentAsPrecision(value, precision)) return new BigFloatComplex(value, precision);
		return new BigFloatComplex(value, 0, precision);
	}

	/** 複素数定数 0 */
	public static zero(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(0, 0, precision);
	}

	/** 複素数定数 1 */
	public static one(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(1, 0, precision);
	}

	/** 複素数定数 i */
	public static i(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(0, 1, precision);
	}

	/** e を返す */
	public static e(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(BigFloat.e(precision), 0, precision);
	}

	/** pi を返す */
	public static pi(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(BigFloat.pi(precision), 0, precision);
	}

	/** tau を返す */
	public static tau(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(BigFloat.tau(precision), 0, precision);
	}

	/** 値から生成する */
	public static from(value: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
	public static from(value: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	public static from(value: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex {
		if (precision !== undefined) return new BigFloatComplex(value, imag, precision);
		if (imag === undefined) return new BigFloatComplex(value);
		if (this._shouldTreatSecondArgumentAsPrecision(value, imag)) return new BigFloatComplex(value, imag as PrecisionValue);
		return new BigFloatComplex(value, imag);
	}

	/** 値の並びから生成する */
	public static of(real: BigFloatValue, imag: BigFloatValue = 0, precision?: PrecisionValue): BigFloatComplex {
		return new BigFloatComplex(real, imag, precision);
	}

	/** 極形式から生成する */
	public static fromPolar(magnitude: BigFloatValue, angle: BigFloatValue, precision?: PrecisionValue): BigFloatComplex {
		const resolvedPrecision = this._resolvePrecision([magnitude, angle], precision);
		const r = this._toBigFloat(magnitude, resolvedPrecision);
		const theta = this._toBigFloat(angle, resolvedPrecision);
		return this._fromBigFloats(r.mul(theta.cos()), r.mul(theta.sin()));
	}

	/** 複素数の総和を返す */
	public static sum(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		let result = precision === undefined ? this.zero() : this.zero(precision);
		for (const value of values) result = result.add(value);
		return result;
	}

	/** 複素数の総積を返す */
	public static product(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		let result = precision === undefined ? this.one() : this.one(precision);
		for (const value of values) result = result.mul(value);
		return result;
	}

	/** 複素数の平均を返す */
	public static average(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		let count = 0;
		let total = precision === undefined ? this.zero() : this.zero(precision);
		for (const value of values) {
			total = total.add(value);
			count++;
		}
		if (count === 0) return precision === undefined ? this.zero() : this.zero(precision);
		return total.div(count);
	}

	/** 実部 */
	public get real(): BigFloat {
		return this._real.clone();
	}

	/** 虚部 */
	public get imag(): BigFloat {
		return this._imag.clone();
	}

	/** 精度 */
	public get precision(): bigint {
		return this._precision;
	}

	/** 複製する */
	public clone(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real, this._imag);
	}

	/** 精度を変更する */
	public changePrecision(precision: PrecisionValue): BigFloatComplex {
		const precisionBig = BigInt(precision);
		return BigFloatComplex._fromBigFloats(this._real.clone().changePrecision(precisionBig), this._imag.clone().changePrecision(precisionBig));
	}

	/** 配列へ変換する */
	public toArray(): [BigFloat, BigFloat] {
		return [this._real.clone(), this._imag.clone()];
	}

	/** ベクトルへ変換する */
	public toVector(): BigFloatVector {
		return BigFloatVector.from([this._real.clone(), this._imag.clone()]);
	}

	/** 極形式へ変換する */
	public toPolar(): { magnitude: BigFloat; angle: BigFloat } {
		return { magnitude: this.abs(), angle: this.arg() };
	}

	/** JSON へ変換する */
	public toJSON(): { re: string; im: string } {
		return { re: this._real.toString(), im: this._imag.toString() };
	}

	/** 文字列化する */
	public toString(base = 10, precision: PrecisionValue = this._precision): string {
		const real = this._real.toString(base, precision);
		const imag = this._imag.toString(base, precision);
		if (this._imag.isZero()) return real;
		if (this._real.isZero()) {
			if (imag === "1") return "i";
			if (imag === "-1") return "-i";
			return `${imag}i`;
		}

		const imagAbs = this._imag.abs().toString(base, precision);
		const imagLabel = imagAbs === "1" ? "i" : `${imagAbs}i`;
		return this._imag.isNegative() ? `${real} - ${imagLabel}` : `${real} + ${imagLabel}`;
	}

	/** イテレータ */
	public [Symbol.iterator](): Iterator<BigFloat, void, undefined> {
		return this.toArray()[Symbol.iterator]();
	}

	/** 一致判定 */
	public equals(other: BigFloatComplexValue): boolean {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		return this._real.eq(rhs._real) && this._imag.eq(rhs._imag);
	}

	/** 別値判定 */
	public ne(other: BigFloatComplexValue): boolean {
		return !this.equals(other);
	}

	/** ゼロ判定 */
	public isZero(): boolean {
		return this._real.isZero() && this._imag.isZero();
	}

	/** 純実数判定 */
	public isReal(): boolean {
		return this._imag.isZero();
	}

	/** 純虚数判定 */
	public isImaginary(): boolean {
		return this._real.isZero() && !this._imag.isZero();
	}

	/** 共役複素数を返す */
	public conjugate(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real, this._imag.neg());
	}

	/** 符号反転する */
	public neg(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.neg(), this._imag.neg());
	}

	/** 絶対値の二乗を返す */
	public absSquared(): BigFloat {
		return this._real.mul(this._real).add(this._imag.mul(this._imag));
	}

	/** 絶対値を返す */
	public abs(): BigFloat {
		return this.absSquared().sqrt();
	}

	/** 偏角を返す */
	public arg(): BigFloat {
		if (this.isZero()) return new BigFloat(0, this._precision);
		return this._imag.atan2(this._real);
	}

	/** 符号複素数を返す */
	public sign(): BigFloatComplex {
		if (this.isZero()) return BigFloatComplex.zero(this._precision);
		return this.div(this.abs());
	}

	/** 正規化する */
	public normalize(): BigFloatComplex {
		if (this.isZero()) throw new RangeError("Cannot normalize zero complex");
		return this.div(this.abs());
	}

	/** 距離を返す */
	public distanceTo(other: BigFloatComplexValue): BigFloat {
		return this.sub(other).abs();
	}

	/** 相対差を返す */
	public relativeDiff(other: BigFloatComplexValue): BigFloat {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const diff = this.sub(rhs).abs();
		const lhsAbs = this.abs();
		const rhsAbs = rhs.abs();
		const denominator = lhsAbs.gt(rhsAbs) ? lhsAbs : rhsAbs;
		if (denominator.isZero()) return new BigFloat(0, this._precision);
		return diff.div(denominator);
	}

	/** 絶対差を返す */
	public absoluteDiff(other: BigFloatComplexValue): BigFloat {
		return this.sub(other).abs();
	}

	/** 百分率差分を返す */
	public percentDiff(other: BigFloatComplexValue): BigFloat {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const rhsAbs = rhs.abs();
		if (rhsAbs.isZero()) return new BigFloat(0, this._precision);
		return this.absoluteDiff(rhs).div(rhsAbs).mul(100);
	}

	/** 加算する */
	public add(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		return BigFloatComplex._fromBigFloats(this._real.add(rhs._real), this._imag.add(rhs._imag));
	}

	/** 減算する */
	public sub(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		return BigFloatComplex._fromBigFloats(this._real.sub(rhs._real), this._imag.sub(rhs._imag));
	}

	/** 乗算する */
	public mul(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const real = this._real.mul(rhs._real).sub(this._imag.mul(rhs._imag));
		const imag = this._real.mul(rhs._imag).add(this._imag.mul(rhs._real));
		return BigFloatComplex._fromBigFloats(real, imag);
	}

	/** 除算する */
	public div(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const denominator = rhs.absSquared();
		if (denominator.isZero()) throw new RangeError("Division by zero complex");
		return this.mul(rhs.conjugate()).divByReal(denominator);
	}

	/** 実数で除算する */
	protected divByReal(value: BigFloatValue): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.div(value), this._imag.div(value));
	}

	/** 逆数を返す */
	public reciprocal(): BigFloatComplex {
		return BigFloatComplex.one(this._precision).div(this);
	}

	/** 回転する */
	public rotate(angle: BigFloatValue): BigFloatComplex {
		return this.mul(BigFloatComplex.fromPolar(1, angle, this._precision));
	}

	/** 指数関数を計算する */
	public exp(): BigFloatComplex {
		const realExp = this._real.exp();
		return BigFloatComplex._fromBigFloats(realExp.mul(this._imag.cos()), realExp.mul(this._imag.sin()));
	}

	/** exp(z)-1 を計算する */
	public expm1(): BigFloatComplex {
		return this.exp().sub(1);
	}

	/** 自然対数を計算する */
	public ln(): BigFloatComplex {
		if (this.isZero()) throw new RangeError("ln(0) is undefined");
		return BigFloatComplex._fromBigFloats(this.abs().ln(), this.arg());
	}

	/** 対数を計算する */
	public log(base: BigFloatComplexValue): BigFloatComplex {
		return this.ln().div(BigFloatComplex._toComplex(base, this._precision).ln());
	}

	/** 冪乗を計算する */
	public pow(exponent: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(exponent, this._precision);
		if (rhs.isZero()) return BigFloatComplex.one(this._precision);
		if (this.isZero()) {
			if (rhs.isReal() && rhs._real.gt(0)) return BigFloatComplex.zero(this._precision);
			throw new RangeError("0 cannot be raised to this exponent");
		}
		return this.ln().mul(rhs).exp();
	}

	/** 平方根を計算する */
	public sqrt(): BigFloatComplex {
		if (this.isZero()) return BigFloatComplex.zero(this._precision);
		const radius = this.abs();
		const two = new BigFloat(2, this._precision);
		const real = radius.add(this._real).div(two).sqrt();
		const imagMagnitude = radius.sub(this._real).div(two).sqrt();
		const imagSign = this._imag.isZero() && this._real.isNegative() ? new BigFloat(1, this._precision) : this._imag.sign();
		const imag = imagSign.mul(imagMagnitude);
		return BigFloatComplex._fromBigFloats(real, imag);
	}

	/** 立方根を計算する */
	public cbrt(): BigFloatComplex {
		return this.nthRoot(3);
	}

	/** 主値の n 乗根を計算する */
	public nthRoot(n: number | bigint): BigFloatComplex {
		const roots = this.nthRoots(n);
		return roots[0];
	}

	/** n 乗根を全て返す */
	public nthRoots(n: number | bigint): BigFloatComplex[] {
		const degree = typeof n === "number" ? Math.trunc(n) : Number(n);
		if (!Number.isFinite(degree) || degree <= 0 || !Number.isInteger(degree)) throw new RangeError("Root degree must be a positive integer");
		if (this.isZero()) return [BigFloatComplex.zero(this._precision)];
		const count = BigInt(degree);
		const magnitude = this.abs().nthRoot(count);
		const angle = this.arg();
		const tau = BigFloat.tau(this._precision);
		return Array.from({ length: degree }, (_, index) => BigFloatComplex.fromPolar(magnitude, angle.add(tau.mul(index)).div(count), this._precision));
	}

	/** 正弦を計算する */
	public sin(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.sin().mul(this._imag.cosh()), this._real.cos().mul(this._imag.sinh()));
	}

	/** 余弦を計算する */
	public cos(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.cos().mul(this._imag.cosh()), this._real.sin().mul(this._imag.sinh()).neg());
	}

	/** 正接を計算する */
	public tan(): BigFloatComplex {
		return this.sin().div(this.cos());
	}

	/** 双曲線正弦を計算する */
	public sinh(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.sinh().mul(this._imag.cos()), this._real.cosh().mul(this._imag.sin()));
	}

	/** 双曲線余弦を計算する */
	public cosh(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.cosh().mul(this._imag.cos()), this._real.sinh().mul(this._imag.sin()));
	}

	/** 双曲線正接を計算する */
	public tanh(): BigFloatComplex {
		return this.sinh().div(this.cosh());
	}

	/** 逆正弦を計算する */
	public asin(): BigFloatComplex {
		const i = BigFloatComplex.i(this._precision);
		const one = BigFloatComplex.one(this._precision);
		return i.neg().mul(
			i
				.mul(this)
				.add(one.sub(this.mul(this)).sqrt())
				.ln(),
		);
	}

	/** 逆余弦を計算する */
	public acos(): BigFloatComplex {
		const halfPi = BigFloatComplex.pi(this._precision).div(2);
		return halfPi.sub(this.asin());
	}

	/** 逆正接を計算する */
	public atan(): BigFloatComplex {
		const i = BigFloatComplex.i(this._precision);
		const one = BigFloatComplex.one(this._precision);
		return i
			.mul(
				one
					.sub(i.mul(this))
					.ln()
					.sub(one.add(i.mul(this)).ln()),
			)
			.div(2);
	}

	/** 逆双曲線正弦を計算する */
	public asinh(): BigFloatComplex {
		return this.mul(this).add(1).sqrt().add(this).ln();
	}

	/** 逆双曲線余弦を計算する */
	public acosh(): BigFloatComplex {
		const one = BigFloatComplex.one(this._precision);
		return this.add(this.add(one).sqrt().mul(this.sub(one).sqrt())).ln();
	}

	/** 逆双曲線正接を計算する */
	public atanh(): BigFloatComplex {
		const one = BigFloatComplex.one(this._precision);
		return one.add(this).ln().sub(one.sub(this).ln()).div(2);
	}
}

/**
 * BigFloatComplex を作成する
 * @param real - 実部または複素数表現
 * @param imag - 虚部
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export function bigFloatComplex(value?: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
export function bigFloatComplex(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
export function bigFloatComplex(real: BigFloatComplexValue = 0, imagOrPrecision?: BigFloatValue | PrecisionValue, precision?: PrecisionValue): BigFloatComplex {
	return new BigFloatComplex(real, imagOrPrecision, precision);
}
