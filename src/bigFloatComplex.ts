import { BigFloat } from "./bigFloat";
import { BigFloatVector } from "./bigFloatVector";
import type { BigFloatInputValue, BigFloatValue, PrecisionValue } from "./types";

type BigFloatComplexObject = {
	re?: BigFloatInputValue;
	im?: BigFloatInputValue;
	real?: BigFloatInputValue;
	imag?: BigFloatInputValue;
};
type BigFloatComplexTuple = readonly [BigFloatInputValue, BigFloatInputValue];
type BigFloatComplexValue = BigFloatInputValue | BigFloatComplexTuple | BigFloatComplexObject;
type BigFloatComplexAggregateSource = Iterable<BigFloatComplexValue>;

/**
 * BigFloat を用いた複素数クラス
 */
export class BigFloatComplex implements Iterable<BigFloat> {
	/** 実部 */
	protected _real: BigFloat;
	/** 虚部 */
	protected _imag: BigFloat;
	/** 精度 (小数点以下の最大桁数) */
	protected _precision: bigint;

	/**
	 * BigFloatComplex コンストラクタ
	 * @param value - 実部、複素数表現 (文字列 "1+2i" など)、または複素数オブジェクト
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	public constructor(value?: BigFloatComplexValue, precision?: PrecisionValue);
	/**
	 * BigFloatComplex コンストラクタ
	 * @param real - 実部または複素数表現
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	public constructor(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue);
	/**
	 * BigFloatComplex コンストラクタ
	 * @param real - 実部または複素数表現
	 * @param imagOrPrecision - 虚部または精度
	 * @param precision - 精度
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @overload
	 */
	public constructor(real: BigFloatComplexValue = 0, imagOrPrecision?: BigFloatValue | PrecisionValue, precision?: PrecisionValue) {
		const { imagPartValue, precisionValue } = BigFloatComplex._normalizeArguments(real, imagOrPrecision, precision, arguments.length);
		const { realPart, imagPart } = BigFloatComplex._normalizeParts(real, imagPartValue);
		const resolvedPrecision = BigFloatComplex._resolvePrecision([realPart, imagPart], precisionValue);
		this._real = BigFloatComplex._toBigFloat(realPart, resolvedPrecision);
		this._imag = BigFloatComplex._toBigFloat(imagPart, resolvedPrecision);
		this._precision = resolvedPrecision;
	}

	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象の値
	 * @param precision - 精度
	 * @returns 変換された BigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toBigFloat(value: BigFloatInputValue, precision?: bigint): BigFloat {
		if (value instanceof BigFloat) {
			const cloned = value.clone();
			if (precision === undefined || cloned._precision === precision) return cloned;
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
	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint {
		if (precision !== undefined) return BigInt(precision);
		let resolved = BigFloat.DEFAULT_PRECISION;
		for (const value of values) {
			if (value instanceof BigFloat && value._precision > resolved) resolved = value._precision;
		}
		return resolved;
	}

	/**
	 * 内部 BigFloat インスタンスから複素数を生成する (内部用)
	 * @param real - 実部 BigFloat
	 * @param imag - 虚部 BigFloat
	 * @returns 生成された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _fromBigFloats(real: BigFloat, imag: BigFloat): BigFloatComplex {
		const complex = Object.create(BigFloatComplex.prototype) as BigFloatComplex;
		const precision = real._precision > imag._precision ? real._precision : imag._precision;
		complex._real = real._precision === precision ? real.clone() : real.clone().changePrecision(precision);
		complex._imag = imag._precision === precision ? imag.clone() : imag.clone().changePrecision(precision);
		complex._precision = precision;
		return complex;
	}

	/**
	 * 多様な複素数表現を実部と虚部のペアに正規化する (内部用)
	 * @param value - 正規化対象の値
	 * @param imag - 虚部 (value が実部のみの場合)
	 * @returns 実部と虚部のオブジェクト
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _normalizeParts(value: BigFloatComplexValue, imag?: BigFloatValue): { realPart: BigFloatInputValue; imagPart: BigFloatInputValue } {
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

	/**
	 * コンストラクタ引数を解析し、虚部と精度を特定する (内部用)
	 * @param value - 第1引数
	 * @param imagOrPrecision - 第2引数
	 * @param precision - 第3引数
	 * @param argCount - 引数の数
	 * @returns 解決された虚部と精度のオブジェクト
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _normalizeArguments(value: BigFloatComplexValue, imagOrPrecision?: BigFloatValue | PrecisionValue, precision?: PrecisionValue, argCount = 0): { imagPartValue: BigFloatValue; precisionValue: PrecisionValue | undefined } {
		if (argCount <= 1) return { imagPartValue: 0, precisionValue: precision };
		if (precision !== undefined) return { imagPartValue: imagOrPrecision as BigFloatValue, precisionValue: precision };
		if (argCount === 2 && this._shouldTreatSecondArgumentAsPrecision(value, imagOrPrecision)) {
			return { imagPartValue: 0, precisionValue: imagOrPrecision as PrecisionValue };
		}
		return { imagPartValue: imagOrPrecision as BigFloatValue, precisionValue: precision };
	}

	/**
	 * 第2引数を(虚部ではなく)精度として解釈すべきか判定する (内部用)
	 * @param value - 第1引数
	 * @param imagOrPrecision - 第2引数
	 * @returns 精度として扱う場合は true
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _shouldTreatSecondArgumentAsPrecision(value: BigFloatComplexValue, imagOrPrecision?: BigFloatValue | PrecisionValue): imagOrPrecision is PrecisionValue {
		if (typeof imagOrPrecision !== "number" && typeof imagOrPrecision !== "bigint") return false;
		if (value instanceof BigFloatComplex) return true;
		if (Array.isArray(value)) return true;
		if (typeof value === "string") return this._parseComplexString(value) !== null;
		return typeof value === "object" && value !== null;
	}

	/**
	 * 複素数文字列を解析する
	 * @param value - 解析対象の文字列
	 * @returns 解析結果、または複素数でない場合は null
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
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

	/**
	 * 虚部係数を正規化する
	 * @param value - 係数文字列
	 * @param original - 元の複素数文字列
	 * @returns 正規化された係数
	 * @throws {SyntaxError} 係数が無効な場合
	 */
	protected static _normalizeImaginaryCoefficient(value: string, original: string): BigFloatValue {
		if (value === "" || value === "+") return 1;
		if (value === "-") return -1;
		if (/[iI]/.test(value)) throw new SyntaxError(`Invalid complex string: ${original}`);
		return value;
	}

	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _toComplex(value: BigFloatComplexValue, precision?: bigint): BigFloatComplex {
		if (value instanceof BigFloatComplex) {
			if (precision === undefined || value._precision === precision) return value.clone();
			return value.changePrecision(precision);
		}
		if (precision === undefined) return new BigFloatComplex(value);
		if (this._shouldTreatSecondArgumentAsPrecision(value, precision)) return new BigFloatComplex(value, precision);
		return new BigFloatComplex(value, 0, precision);
	}

	/**
	 * 複素数 0 を取得する
	 * @param precision - 精度
	 * @returns 0 + 0i
	 */
	public static zero(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(0, 0, precision);
	}

	/**
	 * 複素数 1 を取得する
	 * @param precision - 精度
	 * @returns 1 + 0i
	 */
	public static one(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(1, 0, precision);
	}

	/**
	 * 虚数単位 i を取得する
	 * @param precision - 精度
	 * @returns 0 + 1i
	 */
	public static i(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(0, 1, precision);
	}

	/**
	 * 自然対数の底 e を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns e + 0i
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static e(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(BigFloat.e(precision), 0, precision);
	}

	/**
	 * 円周率 pi を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns pi + 0i
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static pi(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(BigFloat.pi(precision), 0, precision);
	}

	/**
	 * 2*pi (tau) を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns tau + 0i
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static tau(precision: PrecisionValue = 20): BigFloatComplex {
		return new BigFloatComplex(BigFloat.tau(precision), 0, precision);
	}

	/**
	 * 与えられた値から BigFloatComplex を生成する
	 * @param value - 実部、複素数表現、または複素数オブジェクト
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	public static from(value: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 与えられた値から BigFloatComplex を生成する
	 * @param value - 実部
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	public static from(value: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	public static from(value: BigFloatComplexValue, imag?: BigFloatValue | PrecisionValue, precision?: PrecisionValue): BigFloatComplex {
		if (precision !== undefined) return new BigFloatComplex(value, imag, precision);
		if (imag === undefined) return new BigFloatComplex(value);
		if (this._shouldTreatSecondArgumentAsPrecision(value, imag)) return new BigFloatComplex(value, imag);
		return new BigFloatComplex(value, imag);
	}

	/**
	 * 実部と虚部を指定して BigFloatComplex を生成する
	 * @param real - 実部
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	public static of(real: BigFloatValue, imag: BigFloatValue = 0, precision?: PrecisionValue): BigFloatComplex {
		return new BigFloatComplex(real, imag, precision);
	}

	/**
	 * 極形式から複素数を生成する
	 * @param magnitude - 絶対値 (r)
	 * @param angle - 偏角 (theta, ラジアン)
	 * @param precision - 精度
	 * @returns 生成された BigFloatComplex
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static fromPolar(magnitude: BigFloatValue, angle: BigFloatValue, precision?: PrecisionValue): BigFloatComplex {
		const resolvedPrecision = this._resolvePrecision([magnitude, angle], precision);
		const r = this._toBigFloat(magnitude, resolvedPrecision);
		const theta = this._toBigFloat(angle, resolvedPrecision);
		return this._fromBigFloats(r.mul(theta.cos()), r.mul(theta.sin()));
	}

	/**
	 * 複素数リストの総和を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 総和
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static sum(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		let result = precision === undefined ? this.zero() : this.zero(precision);
		for (const value of values) result = result.add(value);
		return result;
	}

	/**
	 * 複素数リストの総積を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 総積
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static product(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		let result = precision === undefined ? this.one() : this.one(precision);
		for (const value of values) result = result.mul(value);
		return result;
	}

	/**
	 * 複素数リストの平均を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 平均
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static average(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		let count = 0;
		const p = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		let total = this.zero(p);
		for (const value of values) {
			total = total.add(value);
			count++;
		}
		if (count === 0) return this.zero(p);
		return total.div(count);
	}

	/**
	 * 実部を取得する (複製)
	 * @returns 実部
	 */
	public get real(): BigFloat {
		return this._real.clone();
	}

	/**
	 * 虚部を取得する (複製)
	 * @returns 虚部
	 */
	public get imag(): BigFloat {
		return this._imag.clone();
	}

	/**
	 * 精度を取得する
	 * @returns 精度
	 */
	public get precision(): bigint {
		return this._precision;
	}

	/**
	 * インスタンスを複製する
	 * @returns 複製された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public clone(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real, this._imag);
	}

	/**
	 * 精度を変更した新しいインスタンスを返す
	 * @param precision - 新しい精度
	 * @returns 精度が変更された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public changePrecision(precision: PrecisionValue): BigFloatComplex {
		const precisionBig = BigInt(precision);
		return BigFloatComplex._fromBigFloats(this._real.clone().changePrecision(precisionBig), this._imag.clone().changePrecision(precisionBig));
	}

	/**
	 * 実部と虚部を配列として取得する
	 * @returns [実部, 虚部]
	 */
	public toArray(): [BigFloat, BigFloat] {
		return [this._real.clone(), this._imag.clone()];
	}

	/**
	 * 二次元のベクトルへ変換する
	 * @returns BigFloatVector インスタンス
	 */
	public toVector(): BigFloatVector {
		return BigFloatVector.from([this._real.clone(), this._imag.clone()]);
	}

	/**
	 * 極形式 (絶対値と偏角) へ変換する
	 * @returns 絶対値 (magnitude) と偏角 (angle) のオブジェクト
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public toPolar(): { magnitude: BigFloat; angle: BigFloat } {
		return { magnitude: this.abs(), angle: this.arg() };
	}

	/**
	 * JSON シリアライズ用のオブジェクトを取得する
	 * @returns {re: string, im: string} オブジェクト
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public toJSON(): { re: string; im: string } {
		return { re: this._real.toString(), im: this._imag.toString() };
	}

	/**
	 * 文字列表現を取得する
	 * @param base - 基数 (2-36)
	 * @param precision - 表示精度
	 * @returns "a + bi" 形式の文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
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

	/**
	 * 実部と虚部を順に反復するイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	public [Symbol.iterator](): Iterator<BigFloat, void, undefined> {
		return this.toArray()[Symbol.iterator]();
	}

	/**
	 * 別の複素数と等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public equals(other: BigFloatComplexValue): boolean {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		return this._real.eq(rhs._real) && this._imag.eq(rhs._imag);
	}

	/**
	 * 別の複素数と等しくないかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しくない場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public ne(other: BigFloatComplexValue): boolean {
		return !this.equals(other);
	}

	/**
	 * 複素数 0 (0 + 0i) かどうかを判定する
	 * @returns 0 なら true
	 */
	public isZero(): boolean {
		return this._real.isZero() && this._imag.isZero();
	}

	/**
	 * 純実数 (虚部が 0) かどうかを判定する
	 * @returns 純実数なら true
	 */
	public isReal(): boolean {
		return this._imag.isZero();
	}

	/**
	 * 純虚数 (実部が 0 かつ虚部が 0 でない) かどうかを判定する
	 * @returns 純虚数なら true
	 */
	public isImaginary(): boolean {
		return this._real.isZero() && !this._imag.isZero();
	}

	/**
	 * 共役複素数 (a - bi) を取得する
	 * @returns 共役複素数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public conjugate(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real, this._imag.neg());
	}

	/**
	 * 符号を反転させた複素数 (-a - bi) を取得する
	 * @returns 符号反転された複素数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public neg(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.neg(), this._imag.neg());
	}

	/**
	 * 絶対値の二乗 (a^2 + b^2) を計算する
	 * @returns 絶対値の二乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public absSquared(): BigFloat {
		return this._real.mul(this._real).add(this._imag.mul(this._imag));
	}

	/**
	 * 絶対値 (ノルム) を計算する
	 * @returns 絶対値
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public abs(): BigFloat {
		return this.absSquared().sqrt();
	}

	/**
	 * 偏角 (引数) を計算する
	 * @returns 偏角 (ラジアン)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public arg(): BigFloat {
		if (this.isZero()) return new BigFloat(0, this._precision);
		return this._imag.atan2(this._real);
	}

	/**
	 * 複素数の符号 (z / |z|) を取得する
	 * @returns 単位円上の複素数、または 0
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sign(): BigFloatComplex {
		if (this.isZero()) return BigFloatComplex.zero(this._precision);
		return this.div(this.abs());
	}

	/**
	 * ベクトルとして正規化する (絶対値を 1 にする)
	 * @returns 正規化された複素数
	 * @throws {RangeError} ゼロ複素数を正規化しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public normalize(): BigFloatComplex {
		if (this.isZero()) throw new RangeError("Cannot normalize zero complex");
		return this.div(this.abs());
	}

	/**
	 * 二つの複素数間の距離を計算する
	 * @param other - 対象
	 * @returns 距離
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public distanceTo(other: BigFloatComplexValue): BigFloat {
		return this.sub(other).abs();
	}

	/**
	 * 別の複素数との相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	public relativeDiff(other: BigFloatComplexValue): BigFloat {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const diff = this.sub(rhs).abs();
		const lhsAbs = this.abs();
		const rhsAbs = rhs.abs();
		const denominator = lhsAbs.gt(rhsAbs) ? lhsAbs : rhsAbs;
		if (denominator.isZero()) return new BigFloat(0, this._precision);
		return diff.div(denominator);
	}

	/**
	 * 別の複素数との絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public absoluteDiff(other: BigFloatComplexValue): BigFloat {
		return this.sub(other).abs();
	}

	/**
	 * 別の複素数との百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分 (%)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public percentDiff(other: BigFloatComplexValue): BigFloat {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const rhsAbs = rhs.abs();
		if (rhsAbs.isZero()) return new BigFloat(0, this._precision);
		return this.absoluteDiff(rhs).div(rhsAbs).mul(100);
	}

	/**
	 * 複素数を加算する
	 * @param other - 加算する値
	 * @returns 加算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public add(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		return BigFloatComplex._fromBigFloats(this._real.add(rhs._real), this._imag.add(rhs._imag));
	}

	/**
	 * 複素数を減算する
	 * @param other - 減算する値
	 * @returns 減算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sub(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		return BigFloatComplex._fromBigFloats(this._real.sub(rhs._real), this._imag.sub(rhs._imag));
	}

	/**
	 * 複素数を乗算する
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public mul(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const real = this._real.mul(rhs._real).sub(this._imag.mul(rhs._imag));
		const imag = this._real.mul(rhs._imag).add(this._imag.mul(rhs._real));
		return BigFloatComplex._fromBigFloats(real, imag);
	}

	/**
	 * 複素数で除算する
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public div(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const denominator = rhs.absSquared();
		if (denominator.isZero()) throw new RangeError("Division by zero complex");
		return this.mul(rhs.conjugate()).divByReal(denominator);
	}

	/**
	 * 実数(またはその表現)で除算する (内部用)
	 * @param value - 実数
	 * @returns 除算結果
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected divByReal(value: BigFloatValue): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.div(value), this._imag.div(value));
	}

	/**
	 * 複素数の逆数を計算する
	 * @returns 逆数
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public reciprocal(): BigFloatComplex {
		return BigFloatComplex.one(this._precision).div(this);
	}

	/**
	 * 複素数を回転させる
	 * @param angle - 回転角 (ラジアン)
	 * @returns 回転後の複素数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public rotate(angle: BigFloatValue): BigFloatComplex {
		return this.mul(BigFloatComplex.fromPolar(1, angle, this._precision));
	}

	/**
	 * 複素数の指数関数 exp(z) を計算する
	 * @returns exp(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public exp(): BigFloatComplex {
		const realExp = this._real.exp();
		return BigFloatComplex._fromBigFloats(realExp.mul(this._imag.cos()), realExp.mul(this._imag.sin()));
	}

	/**
	 * 複素数における exp(z) - 1 を計算する
	 * @returns exp(z) - 1
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public expm1(): BigFloatComplex {
		return this.exp().sub(1);
	}

	/**
	 * 複素数の自然対数 ln(z) を計算する
	 * @returns ln(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public ln(): BigFloatComplex {
		if (this.isZero()) throw new RangeError("ln(0) is undefined");
		return BigFloatComplex._fromBigFloats(this.abs().ln(), this.arg());
	}

	/**
	 * 複素数の任意の底による対数を計算する
	 * @param base - 底
	 * @returns 対数結果
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public log(base: BigFloatComplexValue): BigFloatComplex {
		return this.ln().div(BigFloatComplex._toComplex(base, this._precision).ln());
	}

	/**
	 * 複素数の冪乗 z^exponent を計算する
	 * @param exponent - 指数
	 * @returns 冪乗結果
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public pow(exponent: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(exponent, this._precision);
		if (rhs.isZero()) return BigFloatComplex.one(this._precision);
		if (this.isZero()) {
			if (rhs.isReal() && rhs._real.gt(0)) return BigFloatComplex.zero(this._precision);
			throw new RangeError("0 cannot be raised to this exponent");
		}
		return this.ln().mul(rhs).exp();
	}

	/**
	 * 複素数の平方根を計算する
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
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

	/**
	 * 複素数の立方根を計算する
	 * @returns 立方根
	 * @throws {RangeError} n が正の整数でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cbrt(): BigFloatComplex {
		return this.nthRoot(3);
	}

	/**
	 * 複素数の n 乗根の主値を計算する
	 * @param n - 指数
	 * @returns n 乗根の主値
	 * @throws {RangeError} n が正の整数でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public nthRoot(n: number | bigint): BigFloatComplex {
		const roots = this.nthRoots(n);
		return roots[0];
	}

	/**
	 * 複素数のすべての n 乗根を取得する
	 * @param n - 指数 (正の整数)
	 * @returns n 乗根の配列
	 * @throws {RangeError} n が正の整数でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
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

	/**
	 * 複素数の正弦 (sin) を計算する
	 * @returns sin(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sin(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.sin().mul(this._imag.cosh()), this._real.cos().mul(this._imag.sinh()));
	}

	/**
	 * 複素数の余弦 (cos) を計算する
	 * @returns cos(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cos(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.cos().mul(this._imag.cosh()), this._real.sin().mul(this._imag.sinh()).neg());
	}

	/**
	 * 複素数の正接 (tan) を計算する
	 * @returns tan(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tan(): BigFloatComplex {
		return this.sin().div(this.cos());
	}

	/**
	 * 複素数の双曲線正弦 (sinh) を計算する
	 * @returns sinh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sinh(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.sinh().mul(this._imag.cos()), this._real.cosh().mul(this._imag.sin()));
	}

	/**
	 * 複素数の双曲線余弦 (cosh) を計算する
	 * @returns cosh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cosh(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.cosh().mul(this._imag.cos()), this._real.sinh().mul(this._imag.sin()));
	}

	/**
	 * 複素数の双曲線正接 (tanh) を計算する
	 * @returns tanh(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tanh(): BigFloatComplex {
		return this.sinh().div(this.cosh());
	}

	/**
	 * 複素数の逆正弦 (asin) を計算する
	 * @returns asin(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
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

	/**
	 * 複素数の逆余弦 (acos) を計算する
	 * @returns acos(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public acos(): BigFloatComplex {
		const halfPi = BigFloatComplex.pi(this._precision).div(2);
		return halfPi.sub(this.asin());
	}

	/**
	 * 複素数の逆正接 (atan) を計算する
	 * @returns atan(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
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

	/**
	 * 複素数の逆双曲線正弦 (asinh) を計算する
	 * @returns asinh(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public asinh(): BigFloatComplex {
		return this.mul(this).add(1).sqrt().add(this).ln();
	}

	/**
	 * 複素数の逆双曲線余弦 (acosh) を計算する
	 * @returns acosh(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public acosh(): BigFloatComplex {
		const one = BigFloatComplex.one(this._precision);
		return this.add(this.add(one).sqrt().mul(this.sub(one).sqrt())).ln();
	}

	/**
	 * 複素数の逆双曲線正接 (atanh) を計算する
	 * @returns atanh(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public atanh(): BigFloatComplex {
		const one = BigFloatComplex.one(this._precision);
		return one.add(this).ln().sub(one.sub(this).ln()).div(2);
	}

	/**
	 * 床関数 (負の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public floor(): BigFloatComplex {
		if (!this._imag.isZero()) throw new TypeError("Complex number with non-zero imaginary part cannot be floored");
		return BigFloatComplex._fromBigFloats(this._real.floor(), this._imag.clone());
	}

	/**
	 * 天井関数 (正の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public ceil(): BigFloatComplex {
		if (!this._imag.isZero()) throw new TypeError("Complex number with non-zero imaginary part cannot be ceiled");
		return BigFloatComplex._fromBigFloats(this._real.ceil(), this._imag.clone());
	}

	/**
	 * 0に近い方向へ切り捨てる
	 * @returns 切り捨てられた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public trunc(): BigFloatComplex {
		if (!this._imag.isZero()) throw new TypeError("Complex number with non-zero imaginary part cannot be truncated");
		return BigFloatComplex._fromBigFloats(this._real.trunc(), this._imag.clone());
	}

	/**
	 * 四捨五入する
	 * @returns 四捨五入された結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public round(): BigFloatComplex {
		if (!this._imag.isZero()) throw new TypeError("Complex number with non-zero imaginary part cannot be rounded");
		return BigFloatComplex._fromBigFloats(this._real.round(), this._imag.clone());
	}

	/**
	 * 剰余を計算する (%)
	 * @param other - 法
	 * @returns 剰余
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public mod(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		if (!this._imag.isZero() || !rhs._imag.isZero()) throw new TypeError("Complex number with non-zero imaginary part does not support mod");
		return BigFloatComplex._fromBigFloats(this._real.mod(rhs._real), this._imag.clone());
	}

	/**
	 * Float32 精度へ丸める
	 * @returns Float32相当に丸めた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public fround(): BigFloatComplex {
		if (!this._imag.isZero()) throw new TypeError("Complex number with non-zero imaginary part does not support fround");
		return BigFloatComplex._fromBigFloats(this._real.fround(), this._imag.clone());
	}

	/**
	 * 32bit整数として見たときの先頭ゼロビット数を返す
	 * @returns 先頭ゼロビット数
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public clz32(): BigFloatComplex {
		if (!this._imag.isZero()) throw new TypeError("Complex number with non-zero imaginary part does not support clz32");
		return BigFloatComplex._fromBigFloats(this._real.clz32(), this._imag.clone());
	}
}

/**
 * BigFloatComplex を作成する
 * @param value - 実部、複素数表現、または複素数オブジェクト
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export function bigFloatComplex(value?: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
/**
 * BigFloatComplex を作成する
 * @param real - 実部
 * @param imag - 虚部
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export function bigFloatComplex(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
export function bigFloatComplex(real: BigFloatComplexValue = 0, imagOrPrecision?: BigFloatValue | PrecisionValue, precision?: PrecisionValue): BigFloatComplex {
	return new BigFloatComplex(real, imagOrPrecision, precision);
}
