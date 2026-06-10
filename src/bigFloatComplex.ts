import { BigFloat } from "./bigFloat";
import { BigFloatVector } from "./bigFloatVector";
import { DivisionByZeroError } from "./error";
import type { BigFloatInputValue, BigFloatValue, FractionResult, PrecisionValue, RationalizeOptions, RecognizeOptions } from "./types";

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

	// ====================================================================================================
	// * 内部ユーティリティ・補助関数
	// ====================================================================================================

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
		const complex = new this();
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
	 * 複素数として未サポートの実数専用演算であることを通知する
	 * @param operation - 演算名
	 * @throws {TypeError} 常に送出
	 */
	protected static _throwNonRealOperation(operation: string): never {
		throw new TypeError(`${operation} is not supported for non-real complex numbers`);
	}

	/**
	 * 実数結果を複素数へ持ち上げる
	 * @param real - 実数結果
	 * @returns 虚部 0 の複素数
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _fromRealResult(real: BigFloat): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(real, new BigFloat(0, real._precision));
	}

	// ====================================================================================================
	// * 基本ユーティリティ (クラス生成・変換・クローン)
	// ====================================================================================================

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
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
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
	/**
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
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
	 * 値を上書きコピーする
	 * @param other - コピー元
	 * @returns 自身
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public copyFrom(other: BigFloatComplexValue): this {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		this._real = rhs._real.clone();
		this._imag = rhs._imag.clone();
		this._precision = rhs._precision;
		return this;
	}

	/**
	 * 内部表現を正規化する
	 */
	public softNormalize(): void {
		this._real.softNormalize();
		this._imag.softNormalize();
	}

	/**
	 * 内部表現を遅延正規化する
	 */
	public lazyNormalize(): void {
		this._real.lazyNormalize();
		this._imag.lazyNormalize();
	}

	/**
	 * 2 の指数部を取得する
	 * @returns 2 の指数部
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	public exponent2(): bigint {
		return this._requireRealPart("exponent2").exponent2();
	}

	/**
	 * 5 の指数部を取得する
	 * @returns 5 の指数部
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	public exponent5(): bigint {
		return this._requireRealPart("exponent5").exponent5();
	}

	// ====================================================================================================
	// * 精度・比較系
	// ====================================================================================================

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
	 * どこまで精度が一致しているかを判定する
	 * @param other - 比較対象
	 * @returns 一致している桁数
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 */
	public matchingPrecision(other: BigFloatComplexValue): bigint {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const realPrecision = this._real.matchingPrecision(rhs._real);
		const imagPrecision = this._imag.matchingPrecision(rhs._imag);
		return realPrecision < imagPrecision ? realPrecision : imagPrecision;
	}

	/**
	 * 実数専用演算のために純実数であることを確認し、実部を返す
	 * @param operation - 演算名
	 * @returns 複製された実部
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	protected _requireRealPart(operation: string): BigFloat {
		if (!this.isReal()) BigFloatComplex._throwNonRealOperation(operation);
		return this._real.clone();
	}

	/**
	 * 実数専用演算のためにオペランドを純実数へ正規化する
	 * @param other - 対象の値
	 * @param operation - 演算名
	 * @returns 正規化された実部
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _coerceRealOperand(other: BigFloatComplexValue, operation: string): BigFloat {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		if (!rhs.isReal()) BigFloatComplex._throwNonRealOperation(operation);
		return rhs._real.clone();
	}

	/**
	 * 実数専用の単項演算を適用し、複素数結果へ持ち上げる
	 * @param operation - 演算名
	 * @param fn - 実数演算
	 * @returns 虚部 0 の複素数結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _applyRealUnaryComplex(operation: string, fn: (value: BigFloat) => BigFloat): BigFloatComplex {
		return BigFloatComplex._fromRealResult(fn(this._requireRealPart(operation)));
	}

	/**
	 * 実数専用の二項演算を適用し、複素数結果へ持ち上げる
	 * @param other - 対象の値
	 * @param operation - 演算名
	 * @param fn - 実数演算
	 * @returns 虚部 0 の複素数結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected _applyRealBinaryComplex(other: BigFloatComplexValue, operation: string, fn: (left: BigFloat, right: BigFloat) => BigFloat): BigFloatComplex {
		return BigFloatComplex._fromRealResult(fn(this._requireRealPart(operation), this._coerceRealOperand(other, operation)));
	}

	/**
	 * 実数専用の二項演算を適用する
	 * @param other - 対象の値
	 * @param operation - 演算名
	 * @param fn - 実数演算
	 * @returns 実数演算結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected _applyRealBinary<T>(other: BigFloatComplexValue, operation: string, fn: (left: BigFloat, right: BigFloat) => T): T {
		return fn(this._requireRealPart(operation), this._coerceRealOperand(other, operation));
	}

	/**
	 * 実数順序に従って比較する
	 * @param other - 比較対象
	 * @returns 比較結果 (-1, 0, 1、NaN 比較時は NaN)
	 * @throws {TypeError} いずれかが非実数複素数の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public compare(other: BigFloatComplexValue): number {
		return this._applyRealBinary(other, "compare", (left, right) => left.compare(right));
	}

	/**
	 * 別の複素数と等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public eq(other: BigFloatComplexValue): boolean {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		return this._real.eq(rhs._real) && this._imag.eq(rhs._imag);
	}

	/**
	 * 別の複素数と等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数と比較しようとした場合
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
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public ne(other: BigFloatComplexValue): boolean {
		return !this.eq(other);
	}

	/**
	 * より小さいかどうかを判定する
	 * @param other - 比較対象
	 * @returns より小さい場合は true
	 * @throws {TypeError} いずれかが非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public lt(other: BigFloatComplexValue): boolean {
		return this.compare(other) === -1;
	}

	/**
	 * 以下かどうかを判定する
	 * @param other - 比較対象
	 * @returns 以下の場合は true
	 * @throws {TypeError} いずれかが非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public lte(other: BigFloatComplexValue): boolean {
		return this.compare(other) <= 0;
	}

	/**
	 * より大きいかどうかを判定する
	 * @param other - 比較対象
	 * @returns より大きい場合は true
	 * @throws {TypeError} いずれかが非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public gt(other: BigFloatComplexValue): boolean {
		return this.compare(other) === 1;
	}

	/**
	 * 以上かどうかを判定する
	 * @param other - 比較対象
	 * @returns 以上の場合は true
	 * @throws {TypeError} いずれかが非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public gte(other: BigFloatComplexValue): boolean {
		return this.compare(other) >= 0;
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
	 * 正の数かどうかを判定する
	 * @returns 正の数なら true
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	public isPositive(): boolean {
		return this._requireRealPart("isPositive").isPositive();
	}

	/**
	 * 負の数かどうかを判定する
	 * @returns 負の数なら true
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	public isNegative(): boolean {
		return this._requireRealPart("isNegative").isNegative();
	}

	/**
	 * 別の複素数との相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throwsSuppressed {DivisionByZeroError}
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
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public percentDiff(other: BigFloatComplexValue): BigFloat {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const rhsAbs = rhs.abs();
		if (rhsAbs.isZero()) return new BigFloat(0, this._precision);
		return this.absoluteDiff(rhs).div(rhsAbs).mul(100);
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

	// ====================================================================================================
	// * 数値変換・出力系
	// ====================================================================================================

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
	 * @throws {TypeError} 複素数と比較しようとした場合
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
	 * number へ変換する
	 * @returns 変換後の number
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	public toNumber(): number {
		return this._requireRealPart("toNumber").toNumber();
	}

	/**
	 * 固定小数点表記へ変換する
	 * @param digits - 小数点以下桁数
	 * @returns 固定小数点表記文字列
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 */
	public toFixed(digits: PrecisionValue): string {
		return this._requireRealPart("toFixed").toFixed(digits);
	}

	/**
	 * 指数表記へ変換する
	 * @param digits - 小数点以下桁数
	 * @returns 指数表記文字列
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 */
	public toExponential(digits = Number(this._precision)): string {
		return this._requireRealPart("toExponential").toExponential(digits);
	}

	// ====================================================================================================
	// * 変換・認識系
	// ====================================================================================================

	/**
	 * 小数点表示を分数で表示する
	 * @param options - オプション
	 * @returns 分数表示 (文字列またはオブジェクト)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public rationalize(options: RationalizeOptions = {}): string | { re: string | FractionResult; im: string | FractionResult } {
		const real = this._real.rationalize(options);
		const imag = this._imag.rationalize(options);
		if (options.asObject) {
			return { re: real, im: imag };
		}
		if (this._imag.isZero()) return real as string;
		if (this._real.isZero()) {
			if (imag === "1") return "i";
			if (imag === "-1") return "-i";
			return `${imag}i`;
		}

		const imagStr = imag as string;
		if (imagStr.startsWith("-")) {
			const absImag = imagStr.slice(1);
			return `${real} - ${absImag === "1" ? "i" : `${absImag}i`}`;
		}
		return `${real} + ${imagStr === "1" ? "i" : `${imagStr}i`}`;
	}

	/**
	 * 値を定数やその組み合わせとして認識を試める
	 * @param options - オプション
	 * @returns 認識結果の文字列、または分数の表示
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	public recognize(options: RecognizeOptions = {}): string | { re: string | FractionResult; im: string | FractionResult } {
		const real = this._real.recognize(options);
		const imag = this._imag.recognize(options);
		if (options.asObject) {
			return { re: real, im: imag };
		}
		if (this._imag.isZero()) return real as string;
		if (this._real.isZero()) {
			if (imag === "1") return "i";
			if (imag === "-1") return "-i";
			return `${imag}i`;
		}

		const imagStr = imag as string;
		if (imagStr.startsWith("-")) {
			const absImag = imagStr.slice(1);
			return `${real} - ${absImag === "1" ? "i" : `(${absImag})i`}`;
		}
		return `${real} + ${imagStr === "1" ? "i" : `(${imagStr})i`}`;
	}

	/**
	 * 実部と虚部を順に反復するイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	public [Symbol.iterator](): Iterator<BigFloat, void, undefined> {
		return this.toArray()[Symbol.iterator]();
	}

	// ====================================================================================================
	// * 四則演算・基本関数
	// ====================================================================================================

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
	 * @throws {DivisionByZeroError} 特殊値が無効な設定でゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public div(other: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(other, this._precision);
		const denominator = rhs.absSquared();
		if (denominator.isZero()) {
			if (BigFloat.config.allowSpecialValues) {
				return this.isZero() ? BigFloatComplex.from(BigFloat.nan(this._precision)) : BigFloatComplex.from(BigFloat.infinity(this._precision));
			}
			throw new DivisionByZeroError("Division by zero complex");
		}
		return this.mul(rhs.conjugate()).divByReal(denominator);
	}

	/**
	 * 実数(またはその表現)で除算する (内部用)
	 * @param value - 実数
	 * @returns 除算結果
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected divByReal(value: BigFloatValue): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.div(value), this._imag.div(value));
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
		return BigFloatComplex._fromBigFloats(this._requireRealPart("mod").mod(rhs._requireRealPart("mod")), this._imag.clone());
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
	 * 共役複素数 (a - bi) を取得する
	 * @returns 共役複素数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public conjugate(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real, this._imag.neg());
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
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public arg(): BigFloat {
		if (this.isZero()) return new BigFloat(0, this._precision);
		return this._imag.atan2(this._real);
	}

	/**
	 * 複素数の符号 (z / |z|) を取得する
	 * @returns 単位円上の複素数、または 0
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public sign(): BigFloatComplex {
		if (this.isZero()) return BigFloatComplex.zero(this._precision);
		return this.div(this.abs());
	}

	/**
	 * 複素数の逆数を計算する
	 * @returns 逆数
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public reciprocal(): BigFloatComplex {
		return BigFloatComplex.one(this._precision).div(this);
	}

	/**
	 * ベクトルとして正規化する (絶対値を 1 にする)
	 * @returns 正規化された複素数
	 * @throws {DivisionByZeroError} 特殊値が無効な設定でゼロ複素数を正規化しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public normalize(): BigFloatComplex {
		if (this.isZero()) {
			if (BigFloat.config.allowSpecialValues) return BigFloatComplex.from(BigFloat.nan(this._precision));
			throw new DivisionByZeroError("Cannot normalize zero complex");
		}
		return this.div(this.abs());
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
	 * 床関数 (負の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public floor(): BigFloatComplex {
		return this._applyRealUnaryComplex("floor", (value) => value.floor());
	}

	/**
	 * 天井関数 (正の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public ceil(): BigFloatComplex {
		return this._applyRealUnaryComplex("ceil", (value) => value.ceil());
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
		return this._applyRealUnaryComplex("round", (value) => value.round());
	}

	/**
	 * 0に近い方向へ切り捨てる
	 * @returns 切り捨てられた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public trunc(): BigFloatComplex {
		return this._applyRealUnaryComplex("trunc", (value) => value.trunc());
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
		return this._applyRealUnaryComplex("fround", (value) => value.fround());
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
		return this._applyRealUnaryComplex("clz32", (value) => value.clz32());
	}

	// ====================================================================================================
	// * 冪乗・ルート・スケーリング
	// ====================================================================================================

	/**
	 * 複素数の冪乗 z^exponent を計算する
	 * @param exponent - 指数
	 * @returns 冪乗結果
	 * @throws {DivisionByZeroError} 特殊値が無効な設定でゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public pow(exponent: BigFloatComplexValue): BigFloatComplex {
		const rhs = BigFloatComplex._toComplex(exponent, this._precision);
		if (rhs.isZero()) return BigFloatComplex.one(this._precision);
		if (this.isZero()) {
			if (rhs.isReal() && rhs._real.gt(0)) return BigFloatComplex.zero(this._precision);
			if (rhs.isReal() && rhs._real.lt(0)) {
				if (BigFloat.config.allowSpecialValues) return BigFloatComplex.from(BigFloat.infinity(this._precision));
				throw new DivisionByZeroError("0 cannot be raised to a negative power");
			}
			if (BigFloat.config.allowSpecialValues) return BigFloatComplex.from(BigFloat.nan(this._precision));
			throw new DivisionByZeroError("0 cannot be raised to this exponent");
		}
		return this.ln().mul(rhs).exp();
	}

	/**
	 * 複素数の平方根を計算する
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throwsSuppressed {DivisionByZeroError}
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
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throwsSuppressed {DivisionByZeroError}
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

	// ====================================================================================================
	// * 三角関数
	// ====================================================================================================

	/**
	 * 複素数の正弦 (sin) を計算する
	 * @returns sin(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public sin(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.sin().mul(this._imag.cosh()), this._real.cos().mul(this._imag.sinh()));
	}

	/**
	 * 複素数の余弦 (cos) を計算する
	 * @returns cos(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public cos(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.cos().mul(this._imag.cosh()), this._real.sin().mul(this._imag.sinh()).neg());
	}

	/**
	 * 複素数の正接 (tan) を計算する
	 * @returns tan(z)
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public tan(): BigFloatComplex {
		return this.sin().div(this.cos());
	}

	/**
	 * 複素数の逆正弦 (asin) を計算する
	 * @returns asin(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
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
	 * @throws {DivisionByZeroError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	public acos(): BigFloatComplex {
		const halfPi = BigFloatComplex.pi(this._precision).div(2);
		return halfPi.sub(this.asin());
	}

	/**
	 * 複素数の逆正接 (atan) を計算する
	 * @returns atan(z)
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
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
	 * 実数順序における atan2 を計算する
	 * @param x - x 座標
	 * @returns 偏角
	 * @throws {TypeError} いずれかが非実数複素数の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public atan2(x: BigFloatComplexValue): BigFloatComplex {
		return this._applyRealBinaryComplex(x, "atan2", (left, right) => left.atan2(right));
	}

	// ====================================================================================================
	// * 双曲線関数
	// ====================================================================================================

	/**
	 * 複素数の双曲線正弦 (sinh) を計算する
	 * @returns sinh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
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
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cosh(): BigFloatComplex {
		return BigFloatComplex._fromBigFloats(this._real.cosh().mul(this._imag.cos()), this._real.sinh().mul(this._imag.sin()));
	}

	/**
	 * 複素数の双曲線正接 (tanh) を計算する
	 * @returns tanh(z)
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public tanh(): BigFloatComplex {
		return this.sinh().div(this.cosh());
	}

	/**
	 * 複素数の逆双曲線正弦 (asinh) を計算する
	 * @returns asinh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public asinh(): BigFloatComplex {
		return this.mul(this).add(1).sqrt().add(this).ln();
	}

	/**
	 * 複素数の逆双曲線余弦 (acosh) を計算する
	 * @returns acosh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public acosh(): BigFloatComplex {
		const one = BigFloatComplex.one(this._precision);
		return this.add(this.add(one).sqrt().mul(this.sub(one).sqrt())).ln();
	}

	/**
	 * 複素数の逆双曲線正接 (atanh) を計算する
	 * @returns atanh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public atanh(): BigFloatComplex {
		const one = BigFloatComplex.one(this._precision);
		return one.add(this).ln().sub(one.sub(this).ln()).div(2);
	}

	// ====================================================================================================
	// * 対数・指数・自然定数
	// ====================================================================================================

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
	 * 2 を底とする指数関数を計算する
	 * @returns 2^z
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 */
	public exp2(): BigFloatComplex {
		return this.mul(BigFloat.two(this._precision).ln()).exp();
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
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 特殊値が無効な設定で ln(0) を計算しようとした場合
	 */
	public ln(): BigFloatComplex {
		if (this.isZero()) {
			if (BigFloat.config.allowSpecialValues) return BigFloatComplex.from(BigFloat.negativeInfinity(this._precision));
			throw new RangeError("ln(0) is undefined");
		}
		return BigFloatComplex._fromBigFloats(this.abs().ln(), this.arg());
	}

	/**
	 * 複素数の任意の底による対数を計算する
	 * @param base - 底
	 * @returns 対数結果
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public log(base: BigFloatComplexValue): BigFloatComplex {
		return this.ln().div(BigFloatComplex._toComplex(base, this._precision).ln());
	}

	/**
	 * 2 を底とする対数を計算する
	 * @returns log2(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public log2(): BigFloatComplex {
		return this.log(2);
	}

	/**
	 * 10 を底とする対数を計算する
	 * @returns log10(z)
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public log10(): BigFloatComplex {
		return this.log(10);
	}

	/**
	 * ln(1 + z) を計算する
	 * @returns log1p(z)
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log1p(): BigFloatComplex {
		return this.add(1).ln();
	}

	// ====================================================================================================
	// * 定数（π, τ）
	// ====================================================================================================

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

	// ====================================================================================================
	// * 特殊関数・積分・ガンマ関数など
	// ====================================================================================================

	/**
	 * ガンマ関数を計算する
	 * @returns gamma(z)
	 * @throws {TypeError} 非実数複素数の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} Lanczos級数が数値的に不安定な場合
	 */
	public gamma(): BigFloatComplex {
		return this._applyRealUnaryComplex("gamma", (value) => value.gamma());
	}

	/**
	 * リーマンゼータ関数を計算する
	 * @returns zeta(z)
	 * @throws {TypeError} 非実数複素数の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} Lanczos級数が数値的に不安定な場合
	 */
	public zeta(): BigFloatComplex {
		return this._applyRealUnaryComplex("zeta", (value) => value.zeta());
	}

	/**
	 * 階乗を計算する
	 * @returns factorial(z)
	 * @throws {TypeError} 非実数複素数の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} Lanczos級数が数値的に不安定な場合
	 */
	public factorial(): BigFloatComplex {
		return this._applyRealUnaryComplex("factorial", (value) => value.factorial());
	}

	/**
	 * 算術幾何平均 (Arithmetic-Geometric Mean) を計算する
	 * @param other - 対象の数値
	 * @returns 算術幾何平均
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {RangeError} 引数が負の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public agm(other: BigFloatComplexValue): BigFloatComplex {
		return this._applyRealBinaryComplex(other, "agm", (l, r) => l.agm(r));
	}

	/**
	 * 指数積分 Ei(z) を計算する
	 * @returns 指数積分 Ei(z)
	 * @throws {TypeError} 非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public Ei(): BigFloatComplex {
		return this._applyRealUnaryComplex("Ei", (value) => value.Ei());
	}

	/**
	 * 対数積分 li(z) を計算する
	 * @returns 対数積分 li(z)
	 * @throws {TypeError} 非実数複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} x <= 0 の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public li(): BigFloatComplex {
		return this._applyRealUnaryComplex("li", (value) => value.li());
	}

	// ====================================================================================================
	// * 統計関数
	// ====================================================================================================

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
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throwsSuppressed {DivisionByZeroError}
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
	 * 複素数リストの幾何平均を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 幾何平均
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static geometricMean(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		const arr = Array.from(values);
		if (arr.length === 0) return precision === undefined ? this.zero() : this.zero(precision);
		const total = this.product(arr, precision);
		return total.nthRoot(arr.length);
	}

	/**
	 * 複素数リストの調和平均を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 調和平均
	 * @throws {DivisionByZeroError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static harmonicMean(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		const arr = Array.from(values);
		if (arr.length === 0) return precision === undefined ? this.zero() : this.zero(precision);
		const p = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		let sumRecip = this.zero(p);
		for (const val of arr) {
			sumRecip = sumRecip.add(BigFloatComplex.from(val, p).reciprocal());
		}
		return BigFloatComplex.from(arr.length, 0, p).div(sumRecip);
	}

	/**
	 * 複素数リストの二乗平均平方根 (RMS) を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns RMS
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throwsSuppressed {DivisionByZeroError}
	 */
	public static rms(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex {
		const arr = Array.from(values);
		if (arr.length === 0) return precision === undefined ? this.zero() : this.zero(precision);
		const p = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
		let sumSq = this.zero(p);
		for (const val of arr) {
			const bfc = BigFloatComplex.from(val, p);
			sumSq = sumSq.add(bfc.mul(bfc));
		}
		return sumSq.div(arr.length).sqrt();
	}

	// ====================================================================================================
	// * 定数オブジェクト
	// ====================================================================================================

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
