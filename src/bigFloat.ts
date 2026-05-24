import { BigFloatComplex } from "./bigFloatComplex";
import { CacheNotInitializedError, DivisionByZeroError, NumericalComputationError, PrecisionMismatchError, SpecialValuesDisabledError } from "./error";
import { RoundingMode, SpecialValueState, type BigFloatAggregateArgs, type BigFloatInputValue, type BigFloatLike, type BigFloatOptions, type BigFloatValue, type PrecisionValue } from "./types";

type BigFloatConstructor = typeof BigFloat;
type BigFloatRawValue = { mantissa: bigint; exp2: bigint; exp5: bigint };
type BigFloatCacheEntry = {
	exactValue: bigint;
	precision: bigint;
};

/**
 * BigFloat の設定を管理するクラス
 */
export class BigFloatConfig {
	/** 精度の不一致を許容するかどうか */
	public allowPrecisionMismatch: boolean;
	/** BigFloatComplex との相互運用を許容するかどうか */
	public allowComplexNumbers: boolean;
	/** 破壊的な計算(自身の上書き)をするかどうか */
	public mutateResult: boolean;
	/** Infinity/NaN の特殊値を許容するかどうか */
	public allowSpecialValues: boolean;
	/** 丸めモード */
	public roundingMode: RoundingMode;
	/** 計算時に追加する精度 */
	public extraPrecision: bigint;
	/** 三角関数の最大ステップ数 */
	public trigFuncsMaxSteps: bigint;
	/** 対数計算の最大ステップ数 */
	public lnMaxSteps: bigint;

	/**
	 * BigFloatConfig コンストラクタ
	 * @param options - 設定オプション
	 * @param options.allowPrecisionMismatch - 精度の不一致を許容するかどうか
	 * @param options.allowComplexNumbers - BigFloatComplex との相互運用を許容するかどうか
	 * @param options.mutateResult - 破壊的な計算(自身の上書き)をするかどうか
	 * @param options.allowSpecialValues - Infinity/NaN の特殊値を許容するかどうか
	 * @param options.roundingMode - 丸めモード
	 * @param options.extraPrecision - 計算時に追加する精度
	 * @param options.trigFuncsMaxSteps - 三角関数の最大ステップ数
	 * @param options.lnMaxSteps - 対数計算の最大ステップ数
	 * @returns 設定オブジェクト
	 */
	public constructor({ allowPrecisionMismatch = false, allowComplexNumbers = false, mutateResult = false, allowSpecialValues = true, roundingMode = RoundingMode.TRUNCATE, extraPrecision = 6n, trigFuncsMaxSteps = 5000n, lnMaxSteps = 10000n }: BigFloatOptions = {}) {
		this.allowPrecisionMismatch = allowPrecisionMismatch;
		this.allowComplexNumbers = allowComplexNumbers;
		this.mutateResult = mutateResult;
		this.allowSpecialValues = allowSpecialValues;
		this.roundingMode = roundingMode;
		this.extraPrecision = extraPrecision;
		this.trigFuncsMaxSteps = trigFuncsMaxSteps;
		this.lnMaxSteps = lnMaxSteps;
	}

	/**
	 * 設定オブジェクトを複製する
	 * @returns 複製された設定オブジェクト
	 */
	public clone(): BigFloatConfig {
		return new BigFloatConfig({
			allowPrecisionMismatch: this.allowPrecisionMismatch,
			allowComplexNumbers: this.allowComplexNumbers,
			mutateResult: this.mutateResult,
			allowSpecialValues: this.allowSpecialValues,
			roundingMode: this.roundingMode,
			extraPrecision: this.extraPrecision,
			trigFuncsMaxSteps: this.trigFuncsMaxSteps,
			lnMaxSteps: this.lnMaxSteps,
		});
	}

	/**
	 * 精度の不一致を許容するかどうかを切り替える
	 */
	public toggleMismatch(): void {
		this.allowPrecisionMismatch = !this.allowPrecisionMismatch;
	}

	/**
	 * BigFloatComplex との相互運用を許容するかどうかを切り替える
	 */
	public toggleComplexNumbers(): void {
		this.allowComplexNumbers = !this.allowComplexNumbers;
	}

	/**
	 * 破壊的な計算(自身の上書き)をするかどうかを切り替える
	 */
	public toggleMutation(): void {
		this.mutateResult = !this.mutateResult;
	}
}

/**
 * 大きな浮動小数点数を扱えるクラス
 */
export class BigFloat {
	/** 最大精度 (Stringの限界) */
	public static MAX_PRECISION = 200000000n;

	/** レイジー正規化の閾値 */
	public static LAZY_NORMALIZE_SMALL_THRESHOLD = 32n;

	/** デフォルトの精度 */
	public static DEFAULT_PRECISION = 20n;

	/** 設定 */
	public static config = new BigFloatConfig();

	/** 円周率キャッシュ */
	private static _piCache: BigFloatCacheEntry | null = null;
	/** eキャッシュ */
	private static _eCache: BigFloatCacheEntry | null = null;
	/** 対数キャッシュ */
	private static _lnCache: Record<string, BigFloatCacheEntry> = Object.create(null);
	/** 5の累乗キャッシュ */
	private static _pow5Cache: bigint[] = [1n];
	/** 2の累乗キャッシュ */
	private static _pow2Cache: bigint[] = [1n];
	/** ベルヌーイ数のキャッシュ */
	private static _bernoulliCache: Record<string, bigint[]> = Object.create(null);

	/** 内部的な値 (mantissa × 2^exp2 × 5^exp5) */
	public mantissa: bigint = 0n;
	/** 2の指数 */
	public _exp2: bigint = 0n;
	/** 5の指数 */
	public _exp5: bigint = 0n;
	/** 精度 (小数点以下の最大桁数) */
	public _precision: bigint = (this.constructor as BigFloatConstructor).DEFAULT_PRECISION;
	/** 特殊値の状態 */
	public _specialState: SpecialValueState = SpecialValueState.FINITE;

	/**
	 * キャッシュをクリアする
	 */
	public static clearCache(): void {
		this._piCache = null;
		this._eCache = null;
		this._lnCache = Object.create(null);
		this._pow5Cache = [1n];
		this._pow2Cache = [1n];
		this._bernoulliCache = Object.create(null);
	}

	/**
	 * 2の指数を取得する
	 * @returns 2の指数 (2^exp2)
	 */
	public exponent2(): bigint {
		return this._exp2;
	}

	/**
	 * 5の指数を取得する
	 * @returns 5の指数 (5^exp5)
	 */
	public exponent5(): bigint {
		return this._exp5;
	}

	/**
	 * 特殊値状態を表示用の文字列に変換する
	 * @param state - 特殊値状態
	 * @returns 表示用の文字列
	 */
	protected static _specialStateLabel(state: SpecialValueState): string {
		switch (state) {
			case SpecialValueState.POSITIVE_INFINITY:
				return "Infinity";
			case SpecialValueState.NEGATIVE_INFINITY:
				return "-Infinity";
			case SpecialValueState.NAN:
				return "NaN";
			default:
				return "";
		}
	}

	/**
	 * 文字列から特殊値状態を判定する
	 * @param value - 判定対象の文字列
	 * @returns 対応する特殊値状態（通常の数値文字列の場合は null）
	 */
	protected static _stateFromString(value: string): SpecialValueState | null {
		const trimmed = value.trim();
		if (/^[+]?(?:infinity|inf)$/i.test(trimmed)) return SpecialValueState.POSITIVE_INFINITY;
		if (/^-(?:infinity|inf)$/i.test(trimmed)) return SpecialValueState.NEGATIVE_INFINITY;
		if (/^nan$/i.test(trimmed)) return SpecialValueState.NAN;
		return null;
	}

	/**
	 * number値から特殊値状態を判定する
	 * @param value - 判定対象の値
	 * @returns 対応する特殊値状態（有限値の場合は null）
	 */
	protected static _stateFromNumber(value: number): SpecialValueState | null {
		if (Number.isNaN(value)) return SpecialValueState.NAN;
		if (value === Number.POSITIVE_INFINITY) return SpecialValueState.POSITIVE_INFINITY;
		if (value === Number.NEGATIVE_INFINITY) return SpecialValueState.NEGATIVE_INFINITY;
		return null;
	}

	/**
	 * 特殊値状態のインスタンスを生成する
	 * @param state - 特殊値状態
	 * @param precision - 結果の精度
	 * @returns 生成された特殊値インスタンス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected static _createSpecialValue(state: SpecialValueState, precision: bigint): BigFloat {
		if (!this.config.allowSpecialValues) {
			throw new SpecialValuesDisabledError("Special values are disabled");
		}
		const result = new this(0n, precision);
		result._specialState = state;
		result.mantissa = 0n;
		result._exp2 = 0n;
		result._exp5 = 0n;
		return result;
	}

	/**
	 * 自身または新しいインスタンスに特殊値状態を設定する
	 * @param state - 特殊値状態
	 * @param precision - 結果の精度
	 * @returns 特殊値状態を持つ結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected _specialResult(state: SpecialValueState, precision = this._precision): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!construct.config.allowSpecialValues) {
			throw new SpecialValuesDisabledError("Special values are disabled");
		}
		const result = construct.config.mutateResult ? this : new construct(0n, precision);
		result._precision = precision;
		result._specialState = state;
		result.mantissa = 0n;
		result._exp2 = 0n;
		result._exp5 = 0n;
		return result;
	}

	/**
	 * 有限値かどうかを判定する
	 * @returns 有限値の場合はtrue
	 */
	protected _isFiniteState(): boolean {
		return this._specialState === SpecialValueState.FINITE;
	}

	/**
	 * NaN状態かどうかを判定する
	 * @returns NaN状態の場合はtrue
	 */
	protected _isNaNState(): boolean {
		return this._specialState === SpecialValueState.NAN;
	}

	/**
	 * 無限大状態かどうかを判定する
	 * @returns 正または負の無限大の場合はtrue
	 */
	protected _isInfinityState(): boolean {
		return this._specialState === SpecialValueState.POSITIVE_INFINITY || this._specialState === SpecialValueState.NEGATIVE_INFINITY;
	}

	/**
	 * 符号を取得する
	 * @returns 正なら1、負なら-1、ゼロまたはNaNなら0
	 */
	protected _signum(): number {
		if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return 1;
		if (this._specialState === SpecialValueState.NEGATIVE_INFINITY) return -1;
		if (this.mantissa > 0n) return 1;
		if (this.mantissa < 0n) return -1;
		return 0;
	}

	/**
	 * 特殊値が無効な設定で特殊値を扱っていないかを検証する
	 * @param values - 検証対象の値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	protected _ensureSpecialValuesEnabled(...values: BigFloat[]): void {
		const construct = this.constructor as BigFloatConstructor;
		if (construct.config.allowSpecialValues) return;
		for (const value of values) {
			if (!value._isFiniteState()) {
				throw new SpecialValuesDisabledError("Special values are disabled");
			}
		}
	}

	/**
	 * BigFloatComplex らしい値か判定する
	 * @param value - 判定対象
	 * @returns BigFloatComplex の場合は true
	 */
	public static _isComplexValue(value: unknown): value is BigFloatComplex {
		if (typeof value !== "object" || value === null) return false;
		const candidate = value as Partial<BigFloatComplex>;
		return typeof candidate.conjugate === "function" && typeof candidate.real === "object" && typeof candidate.imag === "object";
	}

	/**
	 * 複素数モードが無効な場合は例外にする
	 * @param operation - 操作名
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	public _assertComplexNumbersEnabled(operation: string): void {
		const construct = this.constructor as BigFloatConstructor;
		if (!construct.config.allowComplexNumbers) {
			throw new TypeError(`BigFloat.${operation} does not accept BigFloatComplex by default. Enable config.allowComplexNumbers to allow complex results.`);
		}
	}

	/**
	 * 複素数オペランドを解決する
	 * @param other - 比較対象
	 * @param operation - 操作名
	 * @returns BigFloatComplex の場合はそのインスタンス、それ以外は null
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected _complexOperand(other: unknown, operation: string): BigFloatComplex | null {
		if (!(this.constructor as typeof BigFloat)._isComplexValue(other)) return null;
		this._assertComplexNumbersEnabled(operation);
		return other;
	}

	/**
	 * 自身を複素数へ昇格する
	 * @param other - 昇格の基準となる複素数
	 * @returns 昇格後の複素数
	 */
	protected _toComplexLike(other: BigFloatComplex): BigFloatComplex {
		const precision = this._precision > other.precision ? this._precision : other.precision;
		const ComplexCtor = other.constructor as new (value?: unknown, imag?: unknown, precision?: PrecisionValue) => BigFloatComplex;
		return new ComplexCtor(this, 0, precision);
	}

	/**
	 * 特殊値を考慮してnumberへ変換する
	 * @returns 変換後のnumber値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected _specialAwareNumber(): number {
		this._ensureSpecialValuesEnabled(this);
		switch (this._specialState) {
			case SpecialValueState.POSITIVE_INFINITY:
				return Number.POSITIVE_INFINITY;
			case SpecialValueState.NEGATIVE_INFINITY:
				return Number.NEGATIVE_INFINITY;
			case SpecialValueState.NAN:
				return Number.NaN;
			default:
				return Number(this.toExponential(17));
		}
	}

	/**
	 * number値から特殊値を考慮した結果を生成する
	 * @param value - 変換元のnumber値
	 * @param precision - 結果の精度
	 * @returns 変換後のBigFloat
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected _fromSpecialAwareNumber(value: number, precision = this._precision): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const specialState = construct._stateFromNumber(value);
		if (specialState !== null) {
			return this._specialResult(specialState, precision);
		}
		const result = construct.config.mutateResult ? this : new construct(value, precision);
		if (construct.config.mutateResult) {
			result.copyFrom(new construct(value, precision));
		}
		return result;
	}

	/**
	 * 指定精度の厳密値結果を生成する
	 * @param mantissa - 仮数
	 * @param precision - 結果の精度
	 * @param exp2 - 2の指数
	 * @param exp5 - 5の指数
	 * @returns 厳密値の結果
	 */
	protected _makeExactResultWithPrecision(mantissa: bigint, precision: bigint, exp2 = 0n, exp5 = 0n): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const mutate = construct.config.mutateResult;
		const result = mutate ? this : new construct();
		result._precision = precision;
		result.mantissa = mantissa;
		result._exp2 = exp2;
		result._exp5 = exp5;
		result._specialState = SpecialValueState.FINITE;
		result.softNormalize();
		return result;
	}

	/**
	 * BigFloat コンストラクタ
	 * @param value - 初期値 (数値, 文字列, BigInt, または別の BigFloat)
	 * @param precision - 精度 (小数点以下の最大桁数)
	 * @returns BigFloat インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を渡した場合
	 * @throws {TypeError} 虚部が 0 でない複素数を渡した場合
	 */
	public constructor(value?: BigFloatInputValue, precision: PrecisionValue = (this.constructor as BigFloatConstructor).DEFAULT_PRECISION) {
		const construct = this.constructor as BigFloatConstructor;
		if (value instanceof BigFloat) {
			this.mantissa = value.mantissa;
			this._exp2 = value._exp2;
			this._exp5 = value._exp5;
			this._precision = value._precision;
			this._specialState = value._specialState;
			return;
		}
		if (value instanceof BigFloatComplex) {
			if (!value.isReal()) {
				throw TypeError("Cannot convert complex number with non-zero imaginary part to BigFloat");
			}
			const real = value.real;
			this.mantissa = real.mantissa;
			this._exp2 = real._exp2;
			this._exp5 = real._exp5;
			this._precision = real._precision;
			this._specialState = real._specialState;
			return;
		}

		this._precision = BigInt(precision);
		construct._checkPrecision(this._precision);

		if (value === undefined || value === null || value === "") {
			this.mantissa = 0n;
			this._exp2 = 0n;
			this._exp5 = 0n;
			this._specialState = SpecialValueState.FINITE;
			return;
		}

		if (typeof value === "number") {
			const specialState = construct._stateFromNumber(value);
			if (specialState !== null) {
				if (!construct.config.allowSpecialValues) throw new SpecialValuesDisabledError("Special values are disabled");
				this._specialState = specialState;
				this.mantissa = 0n;
				this._exp2 = 0n;
				this._exp5 = 0n;
				return;
			}
		}

		if (typeof value === "string") {
			const specialState = construct._stateFromString(value);
			if (specialState !== null) {
				if (!construct.config.allowSpecialValues) throw new SpecialValuesDisabledError("Special values are disabled");
				this._specialState = specialState;
				this.mantissa = 0n;
				this._exp2 = 0n;
				this._exp5 = 0n;
				return;
			}
		}

		if (typeof value === "number" && Number.isInteger(value)) {
			this.mantissa = BigInt(value);
			this._exp2 = 0n;
			this._exp5 = 0n;
		} else {
			const { intPart, fracPart, sign } = this._parse(value.toString());
			// value = (intPart + fracPart/10^fracPart.length) * sign
			// = (intPart * 10^len + fracPart) / 10^len * sign
			const len = BigInt(fracPart.length);
			this.mantissa = BigInt(intPart + fracPart) * BigInt(sign);
			this._exp2 = -len;
			this._exp5 = -len;
		}

		this._specialState = SpecialValueState.FINITE;
		this.lazyNormalize();
		this._applyPrecision();
	}

	// ====================================================================================================
	// * 基本ユーティリティ (クラス生成・変換・クローン)
	// ====================================================================================================

	/**
	 * クラスを複製する (設定複製用)
	 * @returns 複製されたクラス
	 */
	public static clone(): BigFloatConstructor {
		const Parent = this;
		return class extends Parent {
			public static override config = Parent.config.clone();
			public static override MAX_PRECISION = Parent.MAX_PRECISION;
		};
	}

	/**
	 * インスタンスを複製する
	 * @returns 複製されたインスタンス
	 */
	public clone(): BigFloat {
		const instance = new (this.constructor as BigFloatConstructor)();
		instance._precision = this._precision;
		instance.mantissa = this.mantissa;
		instance._exp2 = this._exp2;
		instance._exp5 = this._exp5;
		instance._specialState = this._specialState;
		return instance;
	}

	/**
	 * 他のインスタンスの値を自身にコピーする
	 * @param other - コピー元
	 * @returns 自身
	 */
	public copyFrom(other: BigFloat): this {
		this.mantissa = other.mantissa;
		this._exp2 = other._exp2;
		this._exp5 = other._exp5;
		this._precision = other._precision;
		this._specialState = other._specialState;
		return this;
	}

	/**
	 * 生の内部表現から結果を作成する
	 * @param mantissa - 仮数
	 * @param exp2 - 2の指数
	 * @param exp5 - 5の指数
	 * @returns 結果
	 */
	protected _makeExactResult(mantissa: bigint, exp2 = 0n, exp5 = 0n): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const mutate = construct.config.mutateResult;
		const result = mutate ? this : new construct();
		result._precision = this._precision;
		result.mantissa = mantissa;
		result._exp2 = exp2;
		result._exp5 = exp5;
		result._specialState = SpecialValueState.FINITE;
		result.softNormalize();
		return result;
	}

	/**
	 * 厳密な整数値を取得する
	 * @returns 整数値、整数でない場合はnull
	 */
	protected _getExactInteger(): bigint | null {
		if (this.mantissa === 0n) return 0n;
		const construct = this.constructor as BigFloatConstructor;
		const factors = construct._extractPowerFactors(this.mantissa);
		const totalExp2 = factors.exp2 + this._exp2;
		const totalExp5 = factors.exp5 + this._exp5;
		if (totalExp2 < 0n || totalExp5 < 0n) return null;

		let value = factors.sign * factors.mantissa;
		if (totalExp2 > 0n) value <<= totalExp2;
		if (totalExp5 > 0n) value *= construct._getPow5(totalExp5);
		return value;
	}

	/**
	 * 厳密な2の冪指数を取得する
	 * @returns 2の冪指数、該当しない場合はnull
	 */
	protected _getExactPowerOf2Exponent(): bigint | null {
		if (this.mantissa <= 0n) return null;
		const construct = this.constructor as BigFloatConstructor;
		const factors = construct._extractPowerFactors(this.mantissa);
		const totalExp2 = factors.exp2 + this._exp2;
		const totalExp5 = factors.exp5 + this._exp5;
		if (factors.sign > 0n && factors.mantissa === 1n && totalExp5 === 0n) {
			return totalExp2;
		}
		return null;
	}

	/**
	 * 厳密な10の冪指数を取得する
	 * @returns 10の冪指数、該当しない場合はnull
	 */
	protected _getExactPowerOf10Exponent(): bigint | null {
		if (this.mantissa <= 0n) return null;
		const construct = this.constructor as BigFloatConstructor;
		const factors = construct._extractPowerFactors(this.mantissa);
		const totalExp2 = factors.exp2 + this._exp2;
		const totalExp5 = factors.exp5 + this._exp5;
		if (factors.sign > 0n && factors.mantissa === 1n && totalExp2 === totalExp5) {
			return totalExp2;
		}
		return null;
	}

	/**
	 * ソフト正規化 (2の累乗を外に出す)
	 */
	public softNormalize(): void {
		if (!this._isFiniteState()) return;
		if (this.mantissa === 0n) {
			this._exp2 = 0n;
			this._exp5 = 0n;
			return;
		}
		let m = this.mantissa;
		if (m < 0n) m = -m;

		let shift = 0n;

		while ((m & 1n) === 0n) {
			m >>= 1n;
			shift++;
		}

		if (shift !== 0n) {
			this.mantissa >>= shift;
			this._exp2 += shift;
		}
	}

	/**
	 * レイジー正規化 (5の累乗を外に出す)
	 */
	public lazyNormalize(): void {
		if (!this._isFiniteState()) return;
		this.softNormalize();
		if (this.mantissa === 0n) return;

		let m = this.mantissa;
		const neg = m < 0n;
		if (neg) m = -m;

		const construct = this.constructor as BigFloatConstructor;

		let low = 0n;
		let high = 1n;

		// 指数探索
		while (true) {
			const p5 = construct._getPow5(high);
			const q = m / p5;
			if (q * p5 !== m) break;

			low = high;
			high <<= 1n;
		}

		// 二分探索
		while (low < high) {
			const mid = (low + high + 1n) >> 1n;
			const p5 = construct._getPow5(mid);

			const q = m / p5;

			if (q * p5 === m) {
				low = mid;
			} else {
				high = mid - 1n;
			}
		}

		// まとめて除去
		if (low !== 0n) {
			const p5 = construct._getPow5(low);
			m /= p5;

			this._exp5 += low;
			this.mantissa = neg ? -m : m;
		}
	}

	/**
	 * 指定された精度に丸める
	 * @param precision - 精度 (省略時は自身の _precision)
	 */
	protected _applyPrecision(precision = this._precision): void {
		if (!this._isFiniteState()) return;
		if (this.mantissa === 0n) {
			this._exp2 = 0n;
			this._exp5 = 0n;
			return;
		}

		// 10^-precision = 2^-precision * 5^-precision

		// 目的のスケール 10^precision 倍した値を整数に丸める
		// V * 10^P = M * 2^exp2 * 5^exp5 * 2^P * 5^P = M * 2^(exp2+P) * 5^(exp5+P)
		const diff2 = this._exp2 + precision;
		const diff5 = this._exp5 + precision;

		if (diff2 >= 0n && diff5 >= 0n) {
			// 既に目標精度より粗いので何もしない
			return;
		}

		// 丸めが必要
		let scaledMantissa = this.mantissa;
		const construct = this.constructor as BigFloatConstructor;

		let div2 = 1n;
		let div5 = 1n;

		if (diff2 > 0n) {
			scaledMantissa <<= diff2;
		} else if (diff2 < 0n) {
			div2 = construct._getPow2(-diff2);
		}

		if (diff5 > 0n) {
			scaledMantissa *= construct._getPow5(diff5);
		} else if (diff5 < 0n) {
			div5 = construct._getPow5(-diff5);
		}

		const divisor = div2 * div5;
		if (divisor > 1n) {
			this.mantissa = construct._roundManual(scaledMantissa, divisor);
		} else {
			this.mantissa = scaledMantissa;
		}
		this._exp2 = -precision;
		this._exp5 = -precision;
		this.softNormalize();
	}

	/**
	 * 手動丸め (内部用)
	 * @param mantissa - 値
	 * @param divisor - 除数
	 * @returns 丸められた値
	 */
	protected static _roundManual(mantissa: bigint, divisor: bigint): bigint {
		const mode = this.config.roundingMode;
		const rem = mantissa % divisor;
		const base = mantissa / divisor;
		if (rem === 0n) return base;

		const absRem = rem < 0n ? -rem : rem;
		const isNeg = mantissa < 0n;

		let offset = 0n;
		switch (mode) {
			case RoundingMode.UP:
				offset = isNeg ? -1n : 1n;
				break;
			case RoundingMode.CEIL:
				if (!isNeg) offset = 1n;
				break;
			case RoundingMode.FLOOR:
				if (isNeg) offset = -1n;
				break;
			case RoundingMode.HALF_UP:
				if (absRem * 2n >= divisor) offset = isNeg ? -1n : 1n;
				break;
			case RoundingMode.HALF_DOWN:
				if (absRem * 2n > divisor) offset = isNeg ? -1n : 1n;
				break;
			case RoundingMode.TRUNCATE:
			case RoundingMode.DOWN:
			default:
				break;
		}
		return base + offset;
	}

	/**
	 * 文字列を数値に変換する
	 * @param str - 変換する文字列
	 * @param precision - 小数点以下の桁数
	 * @param base - 基数
	 * @returns 変換されたBigFloatインスタンス
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SyntaxError} 不正な文字が含まれている場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 */
	public static parseFloat(str: BigFloatValue, precision: PrecisionValue = this.DEFAULT_PRECISION, base = 10): BigFloat {
		if (str instanceof BigFloat) return str.clone();
		if (typeof str !== "string") str = String(str);
		if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
		if (base === 10) return new this(str, precision);

		const [rawInt, rawFrac = ""] = str.toLowerCase().replace(/^\+/, "").split(".");
		const sign = str.trim().startsWith("-") ? -1n : 1n;
		const digits = "0123456789abcdefghijklmnopqrstuvwxyz";

		/**
		 * 文字を基数に対応する数値に変換する
		 * @param ch - 変換する文字
		 * @returns 対応する数値
		 * @throws {SyntaxError} 不正な文字が含まれている場合
		 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
		 */
		const toDigit = (ch: string) => {
			const d = digits.indexOf(ch);
			if (d < 0 || d >= base) throw new SyntaxError(`Invalid digit '${ch}' for base ${base}`);
			return BigInt(d);
		};

		const bigBase = BigInt(base);

		// 整数部分
		let intVal = 0n;
		for (const ch of rawInt.replace(/^[-+]/, "")) {
			intVal = intVal * bigBase + toDigit(ch);
		}

		// 小数部分
		// 1/base + 1/base^2 ...
		const res = new this(intVal * sign, precision);
		const config = this.config;
		const originalMutate = config.mutateResult;
		config.mutateResult = true; // Use mutation to avoid temporary objects

		let currentBase = bigBase;
		const tempD = new this(0n, precision);
		const tempBase = new this(0n, precision);

		for (let i = 0; i < rawFrac.length; i++) {
			const d = toDigit(rawFrac[i]);
			if (d !== 0n) {
				tempD.mantissa = d * sign;
				tempD._exp2 = 0n;
				tempD._exp5 = 0n;

				tempBase.mantissa = currentBase;
				tempBase._exp2 = 0n;
				tempBase._exp5 = 0n;

				const part = tempD.div(tempBase);
				res.add(part);
			}
			currentBase *= bigBase;
		}
		config.mutateResult = originalMutate;

		return res;
	}

	// ====================================================================================================
	// * 内部ユーティリティ・補助関数
	// ====================================================================================================

	/**
	 * 文字列を解析して数値を取得
	 * @param str - 解析する文字列
	 * @returns 整数部、小数部、符号
	 */
	public _parse(str: string): { intPart: string; fracPart: string; sign: number } {
		str = str.toString().trim();

		const expMatch = str.match(/^([+-]?[\d.]+)[eE]([+-]?\d+)$/);
		if (expMatch) {
			let [_, base, expStr] = expMatch;
			const exp = parseInt(expStr, 10);

			let [intPart, fracPart = ""] = base.split(".");
			const allDigits = intPart + fracPart;

			let pointIndex = intPart.length + exp;
			if (pointIndex < 0) {
				base = "0." + "0".repeat(-pointIndex) + allDigits;
			} else if (pointIndex >= allDigits.length) {
				base = allDigits + "0".repeat(pointIndex - allDigits.length);
			} else {
				base = allDigits.slice(0, pointIndex) + "." + allDigits.slice(pointIndex);
			}

			str = base;
		}

		const [intPartRaw, fracPartRaw = ""] = str.split(".");
		const sign = intPartRaw.startsWith("-") ? -1 : 1;
		const intPart = intPartRaw.replace("-", "");
		return { intPart, fracPart: fracPartRaw, sign };
	}

	/**
	 * 集計関数の単一配列引数かどうかを判定する
	 * @param args - 引数リスト
	 * @returns 単一配列引数の場合はtrue
	 */
	protected static _hasAggregateArrayArg(args: BigFloatAggregateArgs): args is [readonly BigFloatValue[]] {
		return args.length === 1 && Array.isArray(args[0]);
	}

	/**
	 * 引数を正規化する
	 * @param args - 引数リスト
	 * @returns 正規化された引数リスト
	 */
	protected static _normalizeArgs(args: BigFloatAggregateArgs): BigFloatValue[] {
		if (this._hasAggregateArrayArg(args)) {
			return [...args[0]];
		}
		return [...args];
	}

	/**
	 * 演算に使う精度を解決する
	 * @param values - 対象値
	 * @param fallback - デフォルト精度
	 * @returns 解決済み精度
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _resolvePrecisionFromValues(values: readonly BigFloatValue[], fallback: PrecisionValue = this.DEFAULT_PRECISION): bigint {
		let resolved = BigInt(fallback);
		for (const value of values) {
			if (value instanceof BigFloat && value._precision > resolved) {
				resolved = value._precision;
			}
		}
		this._checkPrecision(resolved);
		return resolved;
	}

	/**
	 * 値を指定精度のBigFloatへ正規化する
	 * @param value - 対象値
	 * @param precision - 精度
	 * @returns 正規化後のBigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _coerceBigFloatValue(value: BigFloatValue, precision: bigint): BigFloat {
		if (value instanceof BigFloat) {
			return value._precision === precision ? value.clone() : value.clone().changePrecision(precision);
		}
		return new this(value, precision);
	}

	/**
	 * 内部整数値から生の内部表現を生成する
	 * @param value - 10^precision倍された整数値
	 * @param precision - 精度
	 * @returns 生の内部表現
	 */
	protected static _fromInternalValue(value: bigint, precision: bigint): BigFloatRawValue {
		const result = { mantissa: value, exp2: -precision, exp5: -precision };
		return this._softNormalizeRaw(result);
	}

	/**
	 * 生の内部表現を10^precision倍された整数値に変換する
	 * @param value - 生の内部表現
	 * @param precision - 精度
	 * @returns 10^precision倍された整数値
	 */
	protected static _toInternalValue(value: BigFloatRawValue, precision: bigint): bigint {
		let mantissa = value.mantissa;
		const diff2 = value.exp2 + precision;
		const diff5 = value.exp5 + precision;

		if (diff2 > 0n) mantissa <<= diff2;
		if (diff5 > 0n) mantissa *= this._getPow5(diff5);
		if (diff2 < 0n) mantissa /= this._getPow2(-diff2);
		if (diff5 < 0n) mantissa /= this._getPow5(-diff5);
		return mantissa;
	}

	/**
	 * 生の内部表現をソフト正規化する
	 * @param value - 対象
	 * @returns 正規化後の内部表現
	 */
	protected static _softNormalizeRaw(value: BigFloatRawValue): BigFloatRawValue {
		if (value.mantissa === 0n) {
			value.exp2 = 0n;
			value.exp5 = 0n;
			return value;
		}

		let mantissa = value.mantissa;
		if (mantissa < 0n) mantissa = -mantissa;

		let shift = 0n;
		while ((mantissa & 1n) === 0n) {
			mantissa >>= 1n;
			shift++;
		}

		if (shift !== 0n) {
			value.mantissa >>= shift;
			value.exp2 += shift;
		}
		return value;
	}

	/**
	 * 生の内部表現を指定精度へ丸める
	 * @param value - 対象
	 * @param precision - 精度
	 * @returns 丸め後の内部表現
	 */
	protected static _applyRawPrecision(value: BigFloatRawValue, precision: bigint): BigFloatRawValue {
		if (value.mantissa === 0n) {
			value.exp2 = 0n;
			value.exp5 = 0n;
			return value;
		}

		const diff2 = value.exp2 + precision;
		const diff5 = value.exp5 + precision;
		if (diff2 >= 0n && diff5 >= 0n) return value;

		let scaledMantissa = value.mantissa;
		let div2 = 1n;
		let div5 = 1n;

		if (diff2 > 0n) {
			scaledMantissa <<= diff2;
		} else if (diff2 < 0n) {
			div2 = this._getPow2(-diff2);
		}

		if (diff5 > 0n) {
			scaledMantissa *= this._getPow5(diff5);
		} else if (diff5 < 0n) {
			div5 = this._getPow5(-diff5);
		}

		const divisor = div2 * div5;
		value.mantissa = divisor > 1n ? this._roundManual(scaledMantissa, divisor) : scaledMantissa;
		value.exp2 = -precision;
		value.exp5 = -precision;
		return this._softNormalizeRaw(value);
	}

	/**
	 * 生の内部表現をレイジー正規化する
	 * @param value - 対象
	 * @returns 正規化後の内部表現
	 */
	protected static _lazyNormalizeRaw(value: BigFloatRawValue): BigFloatRawValue {
		this._softNormalizeRaw(value);
		if (value.mantissa === 0n) return value;

		let mantissa = value.mantissa;
		const negative = mantissa < 0n;
		if (negative) mantissa = -mantissa;

		let low = 0n;
		let high = 1n;

		while (true) {
			const pow5 = this._getPow5(high);
			const quotient = mantissa / pow5;
			if (quotient * pow5 !== mantissa) break;
			low = high;
			high <<= 1n;
		}

		while (low < high) {
			const mid = (low + high + 1n) >> 1n;
			const pow5 = this._getPow5(mid);
			const quotient = mantissa / pow5;
			if (quotient * pow5 === mantissa) {
				low = mid;
			} else {
				high = mid - 1n;
			}
		}

		if (low !== 0n) {
			const pow5 = this._getPow5(low);
			mantissa /= pow5;
			value.exp5 += low;
			value.mantissa = negative ? -mantissa : mantissa;
		}

		return value;
	}

	/**
	 * mantissa から符号・2の指数・5の指数を抽出する
	 * @param mantissa - 対象
	 * @returns 分解結果
	 */
	protected static _extractPowerFactors(mantissa: bigint): { sign: bigint; mantissa: bigint; exp2: bigint; exp5: bigint } {
		if (mantissa === 0n) {
			return { sign: 0n, mantissa: 0n, exp2: 0n, exp5: 0n };
		}

		let sign = 1n;
		let value = mantissa;
		if (value < 0n) {
			sign = -1n;
			value = -value;
		}

		let exp2 = 0n;
		while ((value & 1n) === 0n) {
			value >>= 1n;
			exp2++;
		}

		let exp5 = 0n;
		while (value % 5n === 0n) {
			value /= 5n;
			exp5++;
		}

		return { sign, mantissa: value, exp2, exp5 };
	}

	/**
	 * 最大公約数を取得する
	 * @param a - 値A
	 * @param b - 値B
	 * @returns 最大公約数
	 */
	protected static _gcd(a: bigint, b: bigint): bigint {
		let x = a < 0n ? -a : a;
		let y = b < 0n ? -b : b;
		while (y !== 0n) {
			const remainder = x % y;
			x = y;
			y = remainder;
		}
		return x;
	}

	/**
	 * 精度を合わせる
	 * @param other - 合わせる対象
	 * @param mutateA - 自身を破壊的に変更するかどうか
	 * @returns [BigFloatA, BigFloatB] (アラインメント済みのインスタンス)
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _align(other: BigFloatValue, mutateA = false): [BigFloat, BigFloat] {
		const construct = this.constructor as BigFloatConstructor;
		const bfB = other instanceof BigFloat ? other : new construct(other, this._precision);
		const config = construct.config;

		if (this._precision !== bfB._precision && !config.allowPrecisionMismatch) {
			throw new PrecisionMismatchError(`Precision mismatch: ${this._precision} !== ${bfB._precision}`);
		}

		const resA = mutateA ? this : this.clone();
		let finalB = bfB._precision === resA._precision ? bfB : bfB.clone().changePrecision(resA._precision);

		if (resA._exp2 === finalB._exp2 && resA._exp5 === finalB._exp5) {
			return [resA, finalB];
		}

		const minExp2 = resA._exp2 < finalB._exp2 ? resA._exp2 : finalB._exp2;
		const minExp5 = resA._exp5 < finalB._exp5 ? resA._exp5 : finalB._exp5;

		if (resA._exp2 > minExp2) {
			resA.mantissa <<= BigInt(resA._exp2 - minExp2);
			resA._exp2 = minExp2;
		}
		// 元のインスタンスをそのまま参照している場合だけ、破壊的変更を避けるためにクローンする
		if (finalB._exp2 > minExp2 || finalB._exp5 > minExp5) {
			if (finalB === bfB) finalB = finalB.clone();
			if (finalB._exp2 > minExp2) {
				finalB.mantissa <<= BigInt(finalB._exp2 - minExp2);
				finalB._exp2 = minExp2;
			}
			if (finalB._exp5 > minExp5) {
				finalB.mantissa *= construct._getPow5(BigInt(finalB._exp5 - minExp5));
				finalB._exp5 = minExp5;
			}
		}

		if (resA._exp5 > minExp5) {
			resA.mantissa *= construct._getPow5(BigInt(resA._exp5 - minExp5));
			resA._exp5 = minExp5;
		}

		return [resA, finalB];
	}

	/**
	 * 結果を作成する (静的メソッド)
	 * @param val - 値 (10^valPrecision倍された整数)
	 * @param precision - 保持する精度 (小数点以下の最大桁数)
	 * @param valPrecision - 入力値の現在の精度 (省略時は precision)
	 * @returns 作成されたBigFloatインスタンス
	 */
	protected static _makeResult(val: bigint, precision: bigint, valPrecision: bigint = precision): BigFloat {
		const result = new this();
		result._precision = precision;
		result.mantissa = val;
		result._exp2 = -valPrecision;
		result._exp5 = -valPrecision;
		result.softNormalize();
		result._applyPrecision(precision);
		return result;
	}

	/**
	 * 結果を作成する (インスタンスメソッド)
	 * @param val - 値 (10^valPrecision倍された整数)
	 * @param precision - 保持する精度 (小数点以下の最大桁数)
	 * @param valPrecision - 入力値の現在の精度 (省略時は precision)
	 * @param okMutate - 破壊的な変更を許可するかどうか
	 * @returns 作成または更新されたBigFloatインスタンス
	 */
	protected _makeResult(val: bigint, precision: bigint, valPrecision: bigint = precision, okMutate = true): BigFloat {
		const res = (this.constructor as BigFloatConstructor)._makeResult(val, precision, valPrecision);
		return this._makeResultFromInstance(res);
	}

	/**
	 * 正の整数 n の degree 乗根の初期値を概算する
	 * @param value - 対象の正の整数
	 * @param degree - 乗根の次数
	 * @param decimalShift - 値に追加で掛かっている 10 の指数
	 * @returns ニュートン法用の初期値
	 * @throws {RangeError} degree が正の整数でない場合
	 */
	protected static _estimatePositiveRoot(value: bigint, degree: bigint, decimalShift = 0n): bigint {
		if (degree <= 0n) throw new RangeError("degree must be a positive integer");
		if (value <= 0n) return 0n;
		if (value === 1n && decimalShift === 0n) return 1n;

		const degreeNumber = Number(degree);
		if (!Number.isFinite(degreeNumber) || degreeNumber <= 0) {
			return 1n;
		}

		const digits = value.toString();
		const prefixLength = Math.min(15, digits.length);
		const prefix = Number(digits.slice(0, prefixLength));
		const totalShift = BigInt(digits.length - prefixLength) + decimalShift;
		const pow10Exponent = totalShift / degree;
		const fractionalRemainder = totalShift % degree;
		let leading = Math.floor(Math.pow(prefix, 1 / degreeNumber) * Math.pow(10, Number(fractionalRemainder) / degreeNumber));
		if (!Number.isFinite(leading) || leading < 1) {
			leading = 1;
		}
		return BigInt(leading) * this._getPow10(pow10Exponent);
	}

	/**
	 * 精度をチェックする
	 * @param precision - チェックする精度
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _checkPrecision(precision: bigint): void {
		if (precision < 0n) {
			throw new RangeError(`Precision must be greater than 0`);
		}
		if (precision > this.MAX_PRECISION) {
			throw new RangeError(`Precision exceeds BigFloat.MAX_PRECISION`);
		}
	}

	/**
	 * 精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更されたインスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public changePrecision(precision: PrecisionValue): this {
		const precisionBig = BigInt(precision);
		(this.constructor as BigFloatConstructor)._checkPrecision(precisionBig);
		this._precision = precisionBig;
		this._applyPrecision();
		return this;
	}

	/**
	 * どこまで精度が一致しているかを判定する
	 * @param other - 比較対象
	 * @returns 一致している桁数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public matchingPrecision(other: BigFloatValue): bigint {
		const bfB = other instanceof BigFloat ? other : new (this.constructor as BigFloatConstructor)(other, this._precision);
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			return this.compare(bfB) === 0 ? (this._precision > bfB._precision ? this._precision : bfB._precision) : 0n;
		}
		const diff = this.sub(bfB).abs();
		const maxP = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (diff.isZero()) return maxP;

		let matched = 0n;
		// 10^-p
		for (let p = 1n; p <= maxP; p++) {
			// diff < 10^-p <=> diff * 10^p < 1
			const check = diff.mul((this.constructor as BigFloatConstructor)._getPow10(p));
			if (check.lt(1)) {
				matched = p;
			} else {
				break;
			}
		}
		return matched;
	}

	// ====================================================================================================
	// * 精度・比較系
	// ====================================================================================================

	/**
	 * 比較演算
	 * @param other - 比較対象
	 * @returns 比較結果 (-1, 0, 1、NaN の比較が含まれる場合は NaN)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public compare(other: BigFloatInputValue): number {
		const construct = this.constructor as BigFloatConstructor;
		if (other instanceof BigFloatComplex) {
			throw new TypeError("Cannot compare BigFloat with a complex number");
		}
		const bfB = other instanceof BigFloat ? other : new construct(other, this._precision);
		if (!construct.config.allowSpecialValues && (!this._isFiniteState() || !bfB._isFiniteState())) {
			throw new SpecialValuesDisabledError("Special values are disabled");
		}
		if (this._isNaNState() || bfB._isNaNState()) return Number.NaN;
		if (this._specialState === bfB._specialState && !this._isFiniteState()) return 0;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY || bfB._specialState === SpecialValueState.NEGATIVE_INFINITY) return 1;
			if (this._specialState === SpecialValueState.NEGATIVE_INFINITY || bfB._specialState === SpecialValueState.POSITIVE_INFINITY) return -1;
		}
		const [a, b] = this._align(other);
		if (a.mantissa < b.mantissa) return -1;
		if (a.mantissa > b.mantissa) return 1;
		return 0;
	}

	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public eq(other: BigFloatInputValue): boolean {
		return this.compare(other) === 0;
	}

	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public equals(other: BigFloatInputValue): boolean {
		return this.compare(other) === 0;
	}

	/**
	 * 等しくないかどうかを判定する (!=)
	 * @param other - 比較対象
	 * @returns 等しくない場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public ne(other: BigFloatInputValue): boolean {
		return this.compare(other) !== 0;
	}

	/**
	 * より小さいかどうかを判定する (<)
	 * @param other - 比較対象
	 * @returns より小さい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public lt(other: BigFloatInputValue): boolean {
		return this.compare(other) === -1;
	}

	/**
	 * 以下かどうかを判定する (<=)
	 * @param other - 比較対象
	 * @returns 以下の場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public lte(other: BigFloatInputValue): boolean {
		return this.compare(other) <= 0;
	}

	/**
	 * より大きいかどうかを判定する (>)
	 * @param other - 比較対象
	 * @returns より大きい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public gt(other: BigFloatInputValue): boolean {
		return this.compare(other) === 1;
	}

	/**
	 * 以上かどうかを判定する (>=)
	 * @param other - 比較対象
	 * @returns 以上の場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public gte(other: BigFloatInputValue): boolean {
		return this.compare(other) >= 0;
	}

	/**
	 * ゼロかどうかを判定する
	 * @returns ゼロの場合はtrue
	 */
	public isZero(): boolean {
		return this._isFiniteState() && this.mantissa === 0n;
	}

	/**
	 * 正の数かどうかを判定する
	 * @returns 正の数の場合はtrue
	 */
	public isPositive(): boolean {
		return this._specialState === SpecialValueState.POSITIVE_INFINITY || (this._isFiniteState() && this.mantissa > 0n);
	}

	/**
	 * 負の数かどうかを判定する
	 * @returns 負の数の場合はtrue
	 */
	public isNegative(): boolean {
		return this._specialState === SpecialValueState.NEGATIVE_INFINITY || (this._isFiniteState() && this.mantissa < 0n);
	}

	/**
	 * 相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public relativeDiff(other: BigFloatInputValue): BigFloat {
		const complex = this._complexOperand(other, "relativeDiff");
		if (complex) return this._toComplexLike(complex).relativeDiff(complex);
		const value = other as BigFloatValue;
		const construct = this.constructor as BigFloatConstructor;
		const diff = this.absoluteDiff(value);
		const absA = this.abs();
		const absB = (value instanceof BigFloat ? value : new construct(value, this._precision)).abs();
		const denominator = absA.gt(absB) ? absA : absB;
		if (denominator.isZero()) return new construct(0n, this._precision);
		return diff.div(denominator);
	}

	/**
	 * 絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public absoluteDiff(other: BigFloatInputValue): BigFloat {
		const complex = this._complexOperand(other, "absoluteDiff");
		if (complex) return this._toComplexLike(complex).absoluteDiff(complex);
		const value = other as BigFloatValue;
		const bfB = value instanceof BigFloat ? value : new (this.constructor as BigFloatConstructor)(value, this._precision);
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			return this.sub(bfB).abs();
		}
		const [a, b] = this._align(value);
		const res = a.clone();
		res.mantissa = a.mantissa > b.mantissa ? a.mantissa - b.mantissa : b.mantissa - a.mantissa;
		res.softNormalize();
		res._applyPrecision();
		return this._makeResultFromInstance(res);
	}

	/**
	 * 差分の非一致度を計算する (百分率)
	 * @param other - 比較対象
	 * @returns 非一致度 (%)
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public percentDiff(other: BigFloatInputValue): BigFloat {
		const complex = this._complexOperand(other, "percentDiff");
		if (complex) return this._toComplexLike(complex).percentDiff(complex);
		const value = other as BigFloatValue;
		const construct = this.constructor as BigFloatConstructor;
		const diff = this.absoluteDiff(value);
		const absB = (value instanceof BigFloat ? value : new construct(value, this._precision)).abs();
		if (absB.isZero()) return new construct(0n, this._precision);
		return diff.div(absB).mul(100);
	}

	// ====================================================================================================
	// * 数値変換・出力系
	// ====================================================================================================

	/**
	 * 文字列に変換する
	 * @param base - 基数 (2-36)
	 * @param precision - 出力時の精度
	 * @returns 変換された文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public toString(base = 10, precision: PrecisionValue = this._precision): string {
		if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return construct._specialStateLabel(this._specialState);
		}

		const prec = BigInt(precision);
		const raw = { mantissa: this.mantissa, exp2: this._exp2, exp5: this._exp5 };
		construct._lazyNormalizeRaw(raw);
		construct._applyRawPrecision(raw, prec);
		construct._lazyNormalizeRaw(raw);

		const sign = raw.mantissa < 0n ? "-" : "";
		let m = raw.mantissa < 0n ? -raw.mantissa : raw.mantissa;
		// 10^P 倍して整数にする
		// V = M * 2^E2 * 5^E5
		// V * 10^P = M * 2^(E2+P) * 5^(E5+P)
		let e2 = raw.exp2 + prec;
		let e5 = raw.exp5 + prec;
		if (e2 > 0n) m <<= e2;
		if (e5 > 0n) m *= construct._getPow5(e5);

		const div2 = e2 < 0n ? construct._getPow2(-e2) : 1n;
		const div5 = e5 < 0n ? construct._getPow5(-e5) : 1n;
		const divisor = div2 * div5;

		m /= divisor;

		const s = m.toString();
		if (prec === 0n) return `${sign}${s}`;

		const padded = s.padStart(Number(prec) + 1, "0");
		const intPart = padded.slice(0, -Number(prec));
		const fracPart = padded.slice(-Number(prec)).replace(/0+$/, "");

		if (base === 10) {
			return fracPart.length > 0 ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
		}

		// base != 10 の場合
		const temp = this.clone();
		temp.lazyNormalize();
		temp._applyPrecision(prec);
		temp.lazyNormalize();
		const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
		const bigBase = BigInt(base);

		// 整数部
		const intPartBF = temp.trunc().abs();
		let intV = intPartBF._getInternalValue(0n);
		// truncate might leave small residue if not lazyNormalized
		let intStr = "";
		if (intV === 0n) {
			intStr = "0";
		} else {
			while (intV > 0n) {
				intStr = digits[Number(intV % bigBase)] + intStr;
				intV /= bigBase;
			}
		}

		// 小数部
		let fracStr = "";
		let fracV = temp.abs().sub(intPartBF);

		for (let i = 0n; i < prec; i++) {
			fracV = fracV.mul(BigInt(base));
			const digit = fracV.trunc();
			const d = Number(digit._getInternalValue(0n));
			fracStr += digits[d];
			fracV = fracV.sub(digit);
			if (fracV.isZero()) break;
		}

		return fracStr.length > 0 ? `${sign}${intStr}.${fracStr}` : `${sign}${intStr}`;
	}

	/**
	 * JSON用の文字列表現を取得する
	 * @returns JSON文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public toJSON(): string {
		const config = (this.constructor as BigFloatConstructor).config;
		let bf: BigFloat = this;
		return bf.toString();
	}

	/**
	 * Number型に変換する
	 * @returns 変換された数値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public toNumber(): number {
		return this._specialAwareNumber();
	}

	/**
	 * 指定した桁数で固定した文字列を取得する
	 * @param digits - 小数点以下の桁数
	 * @returns 固定小数点形式の文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public toFixed(digits: PrecisionValue): string {
		const d = BigInt(digits);
		const s = this.toString(10, d);
		const [intPart, fracPart = ""] = s.split(".");
		if (d === 0n) return intPart;
		const fracFixed = fracPart.padEnd(Number(d), "0").slice(0, Number(d));
		return `${intPart}.${fracFixed}`;
	}

	/**
	 * 指数形式の文字列を取得する
	 * @param digits - 有効桁数
	 * @returns 指数形式の文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public toExponential(digits = Number(this._precision)): string {
		const s = this.toString(10, this._precision).replace("-", "");
		if (s === "0") return "0e+0";

		const [intPart, fracPart = ""] = s.split(".");
		const combined = intPart + fracPart;
		const firstDigitIndex = combined.search(/[1-9]/);
		const dotIndex = intPart.length;

		let mantissaStr = combined.slice(firstDigitIndex);
		let exp = dotIndex - firstDigitIndex - 1;
		if (firstDigitIndex >= dotIndex) {
			exp = dotIndex - firstDigitIndex - 1;
		}

		mantissaStr = mantissaStr.padEnd(digits + 1, "0").slice(0, digits + 1);
		let formattedMantissa = mantissaStr[0];
		if (digits > 0) {
			formattedMantissa += "." + mantissaStr.slice(1);
		}

		const signStr = this.mantissa < 0n ? "-" : "";
		const expStr = exp >= 0 ? `e+${exp}` : `e${exp}`;
		return `${signStr}${formattedMantissa}${expStr}`;
	}

	// ====================================================================================================
	// * 四則演算・基本関数
	// ====================================================================================================

	/**
	 * 加算する (+)
	 * @param other - 加算する値
	 * @returns 加算結果
	 */
	public add(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を加算する (+)
	 * @param other - 加算する複素数
	 * @returns 加算結果
	 * @overload
	 */
	public add(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 加算する (+)
	 * @param other - 加算する値
	 * @returns 加算結果
	 * @overload
	 */
	public add(other: BigFloatInputValue): BigFloatLike;
	/**
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public add(other: BigFloatInputValue): BigFloatLike {
		const complex = this._complexOperand(other, "add");
		if (complex) return complex.add(this);
		const value = other as BigFloatValue;
		const construct = this.constructor as BigFloatConstructor;
		const bfB = value instanceof BigFloat ? value : new construct(value, this._precision);
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (this._isInfinityState() && bfB._isInfinityState()) {
				if (this._specialState !== bfB._specialState) return this._specialResult(SpecialValueState.NAN, resultPrecision);
				return this._specialResult(this._specialState, resultPrecision);
			}
			return this._specialResult(this._isInfinityState() ? this._specialState : bfB._specialState, resultPrecision);
		}
		const mutate = construct.config.mutateResult;
		const [a, b] = this._align(value, mutate);
		a.mantissa += b.mantissa;
		a.softNormalize();
		a._applyPrecision();
		return a;
	}

	/**
	 * 減算する (-)
	 * @param other - 減算する値
	 * @returns 減算結果
	 */
	public sub(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を減算する (-)
	 * @param other - 減算する複素数
	 * @returns 減算結果
	 * @overload
	 */
	public sub(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 減算する (-)
	 * @param other - 減算する値
	 * @returns 減算結果
	 * @overload
	 */
	public sub(other: BigFloatInputValue): BigFloatLike;
	/**
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sub(other: BigFloatInputValue): BigFloatLike {
		const complex = this._complexOperand(other, "sub");
		if (complex) return this._toComplexLike(complex).sub(complex);
		const value = other as BigFloatValue;
		const construct = this.constructor as BigFloatConstructor;
		const bfB = value instanceof BigFloat ? value : new construct(value, this._precision);
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (this._isInfinityState() && bfB._isInfinityState()) {
				if (this._specialState === bfB._specialState) return this._specialResult(SpecialValueState.NAN, resultPrecision);
				return this._specialResult(this._specialState, resultPrecision);
			}
			if (this._isInfinityState()) return this._specialResult(this._specialState, resultPrecision);
			return this._specialResult(bfB._specialState === SpecialValueState.POSITIVE_INFINITY ? SpecialValueState.NEGATIVE_INFINITY : SpecialValueState.POSITIVE_INFINITY, resultPrecision);
		}
		const mutate = construct.config.mutateResult;
		const [a, b] = this._align(value, mutate);
		a.mantissa -= b.mantissa;
		a.softNormalize();
		a._applyPrecision();
		return a;
	}

	/**
	 * 乗算する (*)
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 */
	public mul(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を乗算する (*)
	 * @param other - 乗算する複素数
	 * @returns 乗算結果
	 * @overload
	 */
	public mul(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 乗算する (*)
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 * @overload
	 */
	public mul(other: BigFloatInputValue): BigFloatLike;
	/**
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public mul(other: BigFloatInputValue): BigFloatLike {
		const complex = this._complexOperand(other, "mul");
		if (complex) return complex.mul(this);
		const value = other as BigFloatValue;
		const construct = this.constructor as BigFloatConstructor;
		if (!(value instanceof BigFloat)) {
			other = new construct(value, this._precision);
		}
		const bfB = other as BigFloat;
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			const lhsInfinite = this._isInfinityState();
			const rhsInfinite = bfB._isInfinityState();
			if ((lhsInfinite && bfB.isZero()) || (rhsInfinite && this.isZero())) {
				return this._specialResult(SpecialValueState.NAN, resultPrecision);
			}
			const sign = this._signum() * bfB._signum();
			if (sign === 0) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			return this._specialResult(sign < 0 ? SpecialValueState.NEGATIVE_INFINITY : SpecialValueState.POSITIVE_INFINITY, resultPrecision);
		}
		const mutate = construct.config.mutateResult;
		const res = mutate ? this : this.clone();

		res._precision = resultPrecision;
		res.mantissa *= bfB.mantissa;
		res._exp2 += bfB._exp2;
		res._exp5 += bfB._exp5;
		res.softNormalize();
		res._applyPrecision();
		return res;
	}

	/**
	 * 除算する (/)
	 * @param other - 除算する値
	 * @returns 除算結果
	 */
	public div(other: BigFloatValue): BigFloat;
	/**
	 * 複素数で除算する (/)
	 * @param other - 除算する複素数
	 * @returns 除算結果
	 * @overload
	 */
	public div(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 除算する (/)
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @overload
	 */
	public div(other: BigFloatInputValue): BigFloatLike;
	/**
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public div(other: BigFloatInputValue): BigFloatLike {
		const complex = this._complexOperand(other, "div");
		if (complex) return this._toComplexLike(complex).div(complex);
		const value = other as BigFloatValue;
		const construct = this.constructor as BigFloatConstructor;
		if (!(value instanceof BigFloat)) {
			other = new construct(value, this._precision);
		}
		const bfB = other as BigFloat;
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (this._isInfinityState() && bfB._isInfinityState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (this._isInfinityState()) {
				const sign = this._signum() * (bfB.isZero() ? 1 : bfB._signum());
				return this._specialResult(sign < 0 ? SpecialValueState.NEGATIVE_INFINITY : SpecialValueState.POSITIVE_INFINITY, resultPrecision);
			}
			if (bfB._isInfinityState()) {
				return this._makeExactResultWithPrecision(0n, resultPrecision);
			}
		}
		if (construct.config.allowSpecialValues && bfB.isZero()) {
			if (this.isZero()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			return this._specialResult(this._signum() < 0 ? SpecialValueState.NEGATIVE_INFINITY : SpecialValueState.POSITIVE_INFINITY, resultPrecision);
		}
		if (bfB.mantissa === 0n) throw new DivisionByZeroError("Division by zero");

		const mutate = construct.config.mutateResult;
		const res = mutate ? this : this.clone();

		res._precision = resultPrecision;

		if (bfB.mantissa === 1n || bfB.mantissa === -1n) {
			if (bfB.mantissa < 0n) res.mantissa = -res.mantissa;
			res._exp2 -= bfB._exp2;
			res._exp5 -= bfB._exp5;
			res.softNormalize();
			res._applyPrecision(res._precision);
			res.lazyNormalize();
			return res;
		}

		// ハイブリッド方式
		if (res._precision <= 15n) {
			const valA = this.toNumber();
			const valB = bfB.toNumber();
			const divRes = valA / valB;
			return res.copyFrom(new construct(divRes, res._precision));
		}

		const gcdMantissa = construct._gcd(res.mantissa, bfB.mantissa);
		const reducedNumeratorMantissa = res.mantissa / gcdMantissa;
		const reducedDivisorMantissa = bfB.mantissa / gcdMantissa;
		const divisorFactors = construct._extractPowerFactors(reducedDivisorMantissa);
		if (divisorFactors.mantissa === 1n) {
			res.mantissa = divisorFactors.sign < 0n ? -reducedNumeratorMantissa : reducedNumeratorMantissa;
			res._exp2 -= bfB._exp2 + divisorFactors.exp2;
			res._exp5 -= bfB._exp5 + divisorFactors.exp5;
			res.softNormalize();
			res._applyPrecision(res._precision);
			res.lazyNormalize();
			return res;
		}

		// V = (Ma * 2^E2a * 5^E5a) / (Mb * 2^E2b * 5^E5b)
		// = (Ma / Mb) * 2^(E2a - E2b) * 5^(E5a - E5b)
		// 精度 P まで求めるためには、10^P = 2^P * 5^P 倍して丸める
		// (Ma * 2^(E2a - E2b + P) * 5^(E5a - E5b + P) / Mb) / 10^P

		const targetP = res._precision + construct.config.extraPrecision;
		const e2 = res._exp2 - bfB._exp2 + targetP;
		const e5 = res._exp5 - bfB._exp5 + targetP;

		let m = res.mantissa;
		if (e2 > 0n) m <<= e2;
		if (e5 > 0n) m *= construct._getPow5(e5);

		const div2 = e2 < 0n ? construct._getPow2(-e2) : 1n;
		const div5 = e5 < 0n ? construct._getPow5(-e5) : 1n;
		const divisor = bfB.mantissa * div2 * div5;

		res.mantissa = construct._roundManual(m, divisor);
		res._exp2 = -targetP;
		res._exp5 = -targetP;

		res.softNormalize();
		res._applyPrecision(res._precision);
		res.lazyNormalize();
		return res;
	}

	/**
	 * インスタンスから結果を作成する
	 * @param instance - 結果の元となるインスタンス
	 * @returns 結果のインスタンス
	 */
	protected _makeResultFromInstance(instance: BigFloat): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (construct.config.mutateResult) {
			this.mantissa = instance.mantissa;
			this._exp2 = instance._exp2;
			this._exp5 = instance._exp5;
			this._precision = instance._precision;
			this._specialState = instance._specialState;
			return this;
		}
		return instance;
	}

	/**
	 * 内部的な計算用に、指定した精度の10進整数値を取得する
	 * @param precision - 精度
	 * @returns 10^precision倍された整数値
	 */
	protected _getInternalValue(precision: bigint): bigint {
		const construct = this.constructor as BigFloatConstructor;
		const raw = { mantissa: this.mantissa, exp2: this._exp2, exp5: this._exp5 };
		construct._applyRawPrecision(raw, precision);
		return construct._toInternalValue(raw, precision);
	}

	/**
	 * 剰余を計算する (内部用)
	 * @param x - 被除数
	 * @param m - 法
	 * @returns 剰余
	 */
	protected static _mod(x: bigint, m: bigint): bigint {
		const r = x % m;
		return r < 0n ? r + m : r;
	}

	/**
	 * 剰余を計算する (%)
	 * @param other - 法
	 * @returns 剰余
	 */
	public mod(other: BigFloatValue): BigFloat;
	/**
	 * 複素数の剰余（未サポート）
	 * @param other - 法
	 * @overload
	 */
	public mod(other: BigFloatComplex): never;
	/**
	 * 剰余を計算する (%)
	 * @param other - 法
	 * @returns 剰余
	 * @overload
	 */
	public mod(other: BigFloatInputValue): BigFloat;
	/**
	 * @throws {TypeError} 複素数モードが無効な場合、または対象が複素数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public mod(other: BigFloatInputValue): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const complex = construct._isComplexValue(other) ? other : null;
		if (complex) {
			this._assertComplexNumbersEnabled("mod");
			throw new TypeError("BigFloat.mod does not support BigFloatComplex operands");
		}
		const value = other as BigFloatValue;
		const bfB = value instanceof BigFloat ? value : new construct(value, this._precision);
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (this._isInfinityState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (bfB._isInfinityState()) return this._makeExactResultWithPrecision(this.mantissa, resultPrecision, this._exp2, this._exp5);
		}
		if (construct.config.allowSpecialValues && bfB.isZero()) {
			return this._specialResult(SpecialValueState.NAN, resultPrecision);
		}
		const mutate = construct.config.mutateResult;
		const [a, b] = this._align(value, mutate);
		const result = construct._mod(a.mantissa, b.mantissa);
		a.mantissa = result;
		a.softNormalize();
		a._applyPrecision();
		return a;
	}

	/**
	 * 符号を反転させる
	 * @returns 符号が反転した結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public neg(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			return this._specialResult(this._specialState === SpecialValueState.POSITIVE_INFINITY ? SpecialValueState.NEGATIVE_INFINITY : SpecialValueState.POSITIVE_INFINITY);
		}
		const mutate = construct.config.mutateResult;
		const res = mutate ? this : this.clone();
		res.mantissa = -res.mantissa;
		return res;
	}

	/**
	 * 絶対値を取得する
	 * @returns 絶対値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public abs(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
		}
		const mutate = construct.config.mutateResult;
		const res = mutate ? this : this.clone();
		res.mantissa = res.mantissa < 0n ? -res.mantissa : res.mantissa;
		return res;
	}

	/**
	 * 符号を取得する
	 * @returns -1, 0, 1 または NaN
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public sign(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN, 0n);
			return this._makeExactResultWithPrecision(this._specialState === SpecialValueState.POSITIVE_INFINITY ? 1n : -1n, 0n);
		}
		if (this.mantissa === 0n) return this._makeExactResultWithPrecision(0n, 0n);
		return this._makeExactResultWithPrecision(this.mantissa > 0n ? 1n : -1n, 0n);
	}

	/**
	 * 逆数を取得する
	 * @returns 逆数
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public reciprocal(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._isNaNState()) return this._specialResult(SpecialValueState.NAN);
			return this._makeExactResultWithPrecision(0n, this._precision);
		}
		if (construct.config.allowSpecialValues && this.isZero()) {
			return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
		}
		return new construct(1n, this._precision).div(this);
	}

	/**
	 * 床関数 (負の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public floor(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this.clone();
		}
		const temp = this.clone();
		// 常に FLOOR モードで丸める必要がある
		const config = (this.constructor as BigFloatConstructor).config;
		const originalMode = config.roundingMode;
		config.roundingMode = RoundingMode.FLOOR;
		temp._applyPrecision(0n);
		config.roundingMode = originalMode;
		return this._makeResultFromInstance(temp);
	}

	/**
	 * 天井関数 (正の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public ceil(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this.clone();
		}
		const temp = this.clone();
		const config = (this.constructor as BigFloatConstructor).config;
		const originalMode = config.roundingMode;
		config.roundingMode = RoundingMode.CEIL;
		temp._applyPrecision(0n);
		config.roundingMode = originalMode;
		return this._makeResultFromInstance(temp);
	}

	/**
	 * 四捨五入する
	 * @returns 四捨五入された結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public round(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this.clone();
		}
		return this.add(new (this.constructor as BigFloatConstructor)(0.5, this._precision)).floor();
	}

	/**
	 * 0に近い方向へ切り捨てる
	 * @returns 切り捨てられた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public trunc(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this.clone();
		}
		const temp = this.clone();
		const config = (this.constructor as BigFloatConstructor).config;
		const originalMode = config.roundingMode;
		config.roundingMode = RoundingMode.TRUNCATE;
		temp._applyPrecision(0n);
		config.roundingMode = originalMode;
		return this._makeResultFromInstance(temp);
	}

	/**
	 * Float32 精度へ丸める
	 * @returns Float32相当に丸めた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public fround(): BigFloat {
		return this._fromSpecialAwareNumber(Math.fround(this._specialAwareNumber()), this._precision);
	}

	/**
	 * 32bit整数として見たときの先頭ゼロビット数を返す
	 * @returns 先頭ゼロビット数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public clz32(): BigFloat {
		return this._makeExactResultWithPrecision(BigInt(Math.clz32(this._specialAwareNumber())), 0n);
	}

	// ====================================================================================================
	// * 冪乗・ルート・スケーリング
	// ====================================================================================================

	/**
	 * 冪乗を計算する (内部用)
	 * @param base - 底
	 * @param exponent - 指数
	 * @param precision - 精度
	 * @returns 冪乗の結果
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _pow(base: bigint, exponent: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		if (exponent === 0n) return scale;
		if (base === 0n) return 0n;
		if (exponent < 0n) {
			const positivePow = this._pow(base, -exponent, precision);
			if (positivePow === 0n) throw new DivisionByZeroError("Division by zero in power function");
			return (scale * scale) / positivePow;
		}
		if (exponent % scale === 0n) {
			let exp = exponent / scale;
			let res = scale;
			let b = base;
			while (exp > 0n) {
				if (exp & 1n) {
					res = (res * b) / scale;
				}
				b = (b * b) / scale;
				exp >>= 1n;
			}
			return res;
		}
		const config = this.config;
		const maxSteps = config.lnMaxSteps;

		const lnBase = this._ln(base, precision, maxSteps);
		const mul = (lnBase * exponent) / scale;
		return this._exp(mul, precision);
	}

	/**
	 * 冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @overload
	 */
	public pow(exponent: BigFloatValue): BigFloat;
	/**
	 * 複素数の冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @overload
	 */
	public pow(exponent: BigFloatComplex): BigFloatComplex;
	/**
	 * 冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @overload
	 */
	public pow(exponent: BigFloatInputValue): BigFloatLike;
	/**
	 * @throws {RangeError} 負の数の非整数乗が実数にならない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public pow(exponent: BigFloatInputValue): BigFloatLike {
		const complex = this._complexOperand(exponent, "pow");
		if (complex) return this._toComplexLike(complex).pow(complex);
		const exponentValue = exponent as BigFloatValue;
		const construct = this.constructor as BigFloatConstructor;
		const bfB = exponentValue instanceof BigFloat ? exponentValue : new construct(exponentValue, this._precision);
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;

		// 整数指数チェック
		if (bfB.isZero()) return new construct(1, resultPrecision);
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (bfB._isInfinityState()) {
				if (!this._isFiniteState()) {
					if (this._specialState === SpecialValueState.POSITIVE_INFINITY) {
						return bfB._specialState === SpecialValueState.POSITIVE_INFINITY ? this._specialResult(SpecialValueState.POSITIVE_INFINITY, resultPrecision) : this._makeExactResultWithPrecision(0n, resultPrecision);
					}
					return this._specialResult(SpecialValueState.NAN, resultPrecision);
				}
				if (this.isZero()) {
					return bfB._specialState === SpecialValueState.POSITIVE_INFINITY ? this._makeExactResultWithPrecision(0n, resultPrecision) : this._specialResult(SpecialValueState.POSITIVE_INFINITY, resultPrecision);
				}
				const exactBase = this._getExactInteger();
				if (exactBase === 1n) return this._makeExactResultWithPrecision(1n, resultPrecision);
				if (exactBase === -1n || this.mantissa < 0n) return this._specialResult(SpecialValueState.NAN, resultPrecision);
				const absCmp = this.abs().compare(1);
				const tendsToInfinity = (absCmp === 1 && bfB._specialState === SpecialValueState.POSITIVE_INFINITY) || (absCmp === -1 && bfB._specialState === SpecialValueState.NEGATIVE_INFINITY);
				return tendsToInfinity ? this._specialResult(SpecialValueState.POSITIVE_INFINITY, resultPrecision) : this._makeExactResultWithPrecision(0n, resultPrecision);
			}
			if (this._isInfinityState()) {
				if (bfB.isPositive()) {
					if (this._specialState === SpecialValueState.POSITIVE_INFINITY) {
						return this._specialResult(SpecialValueState.POSITIVE_INFINITY, resultPrecision);
					}
					const exactExponent = bfB._getExactInteger();
					if (exactExponent === null) return this._specialResult(SpecialValueState.NAN, resultPrecision);
					return this._specialResult(exactExponent % 2n === 0n ? SpecialValueState.POSITIVE_INFINITY : SpecialValueState.NEGATIVE_INFINITY, resultPrecision);
				}
				if (bfB.isNegative()) return this._makeExactResultWithPrecision(0n, resultPrecision);
			}
		}
		if (this.mantissa < 0n && !(bfB._exp2 >= 0n && bfB._exp5 >= 0n)) {
			if (construct.config.allowSpecialValues) {
				return this._specialResult(SpecialValueState.NAN, resultPrecision);
			}
			throw new RangeError("Fractional power of negative number is not real");
		}
		if (bfB._exp2 >= 0n && bfB._exp5 >= 0n) {
			// 指数は整数
			let expVal = bfB.mantissa;
			if (bfB._exp2 > 0n) expVal <<= bfB._exp2;
			if (bfB._exp5 > 0n) expVal *= construct._getPow5(bfB._exp5);

			if (expVal > 0n) {
				let res = new construct(1, this._precision);
				let base = this.clone();
				let e = expVal;
				while (e > 0n) {
					if (e & 1n) res = res.mul(base);
					base = base.mul(base);
					e >>= 1n;
				}
				return res;
			} else {
				return new construct(1, this._precision).div(this.pow(-expVal));
			}
		}

		// 非整数指数: a^b = exp(b * ln(a))
		return this.ln().mul(bfB).exp();
	}

	/**
	 * 平方根を計算する (内部用)
	 * @param n - 値
	 * @param precision - 精度
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _sqrt(n: bigint, precision: bigint): bigint {
		if (n < 0n) throw new RangeError("Cannot compute square root of negative number");
		if (n === 0n) return 0n;

		const scale = this._getPow10(precision);
		const nScaled = n * scale;
		const TWO = 2n;

		let x = this._estimatePositiveRoot(nScaled, 2n);
		if (x === 0n) x = 1n;
		let last;
		while (true) {
			last = x;
			x = (x + nScaled / x) / TWO;
			if (x === last) break;
		}
		return x;
	}

	/**
	 * 平方根を計算する
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sqrt(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.mantissa < 0n) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NAN);
			throw new RangeError("Cannot compute square root of negative number");
		}
		if (this.mantissa === 0n) return new construct(0n, this._precision);

		const mutate = construct.config.mutateResult;
		const res = mutate ? this : this.clone();

		// V = M * 2^E2 * 5^E5
		// sqrt(V) = sqrt(M) * 2^(E2/2) * 5^(E5/2)
		// 精度 P まで求める
		const targetP = res._precision;

		// ハイブリッド方式: 低精度ならMath.sqrtを利用
		if (targetP <= 15n) {
			const val = this.toNumber();
			const root = Math.sqrt(val);
			res.mantissa = BigInt(Math.floor(root * 1e15));
			res._exp2 = -15n;
			res._exp5 = -15n;
			res.softNormalize();
			res._applyPrecision(targetP);
			res.lazyNormalize();
			return res;
		}

		// 整数化は不要。10^(2P) 倍した状態でニュートン法
		// V = M * 2^E2 * 5^E5
		// 目標: sqrt(V) * 10^P = sqrt(V * 10^(2P))
		// V * 10^(2P) = M * 2^(E2+2P) * 5^(E5+2P)
		let valForSqrt = res.mantissa;
		let e2s = res._exp2 + 2n * targetP;
		let e5s = res._exp5 + 2n * targetP;
		if (e2s > 0n) valForSqrt <<= e2s;
		if (e5s > 0n) valForSqrt *= construct._getPow5(e5s);
		if (e2s < 0n) valForSqrt /= construct._getPow2(-e2s);
		if (e5s < 0n) valForSqrt /= construct._getPow5(-e5s);

		// Newton method for integer sqrt
		let x = 0n;
		if (valForSqrt > 0n) {
			x = construct._estimatePositiveRoot(valForSqrt, 2n);
			if (x === 0n) x = 1n;

			let lastX;
			while (true) {
				lastX = x;
				x = (x + valForSqrt / x) / 2n;
				if (x === lastX || (x > lastX ? x - lastX : lastX - x) <= 1n) break;
			}
		}

		res.mantissa = x;
		res._exp2 = -targetP;
		res._exp5 = -targetP;
		res.softNormalize();
		res._applyPrecision();
		return res;
	}

	/**
	 * 立方根を計算する
	 * @returns 立方根
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	public cbrt(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			return this._specialResult(this._specialState, this._precision);
		}
		if (this.isZero()) return this._makeExactResult(0n);
		return this.nthRoot(3n);
	}

	/**
	 * n乗根を計算する (内部用)
	 * @param v - 値
	 * @param n - 指数
	 * @param precision - 精度
	 * @returns n乗根
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	protected static _nthRoot(v: bigint, n: bigint, precision: bigint): bigint {
		if (n <= 0n) {
			throw new RangeError("n must be a positive integer");
		}
		if (v < 0n) {
			if (n % 2n === 0n) {
				throw new RangeError("Even root of negative number is not real");
			}
			return -this._nthRoot(-v, n, precision);
		}
		const scale = this._getPow10(precision);

		let x = this._estimatePositiveRoot(v, n, precision * (n - 1n));
		if (x < scale) x = scale;
		while (true) {
			let xPow = x;
			if (n === 1n) {
				xPow = scale;
			} else {
				for (let j = 1n; j < n - 1n; j++) {
					xPow = (xPow * x) / scale;
				}
			}

			const numerator = (n - 1n) * x + (v * scale) / xPow;
			const xNext = numerator / n;

			if (xNext === x) break;
			x = xNext;
		}
		return x;
	}

	/**
	 * n乗根を計算する
	 * @param n - 指数
	 * @returns n乗根
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public nthRoot(n: number | bigint): BigFloat {
		const bn = BigInt(n);
		if (bn <= 0n) throw new RangeError("n must be a positive integer");
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			if (bn % 2n === 0n) return this._specialResult(SpecialValueState.NAN);
			return this._specialResult(SpecialValueState.NEGATIVE_INFINITY);
		}
		if (this.mantissa < 0n && bn % 2n === 0n) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NAN);
			throw new RangeError("Even root of negative number");
		}
		if (this.isZero()) return this._makeExactResult(0n);
		if (bn === 1n) return this.clone();

		const totalPr = this._precision + construct.config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._nthRoot(val, bn, totalPr);
		return this._makeResult(raw, this._precision, totalPr);
	}

	// ====================================================================================================
	// * 三角関数
	// ====================================================================================================

	/**
	 * 正弦(sin)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正弦
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _sin(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = this._getPow10(precision);

		const pi = this._pi(precision);
		const twoPi = 2n * pi;
		const halfPi = pi / 2n;

		x = this._mod(x, twoPi);
		if (x > pi) x -= twoPi;
		let sign = 1n;
		if (x > halfPi) {
			x = pi - x;
			sign = 1n;
		} else if (x < -halfPi) {
			x = -pi - x;
			sign = -1n;
		}

		let term = x;
		let result = term;
		const x2 = (x * x) / scale;
		let sgn = -1n;

		for (let n = 1n; n <= maxSteps; n++) {
			const denom = 2n * n;
			term = (term * x2) / scale;
			term = term / (denom * (denom + 1n));
			if (term === 0n) break;
			result += sgn * term;
			sgn *= -1n;
		}
		return result * sign;
	}

	/**
	 * 範囲縮約なしで正弦(sin)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正弦
	 */
	protected static _sinSeries(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = this._getPow10(precision);
		let term = x;
		let result = term;
		const x2 = (x * x) / scale;
		let sign = -1n;

		for (let n = 1n; n <= maxSteps; n++) {
			const denom = 2n * n;
			term = (term * x2) / scale;
			term = term / (denom * (denom + 1n));
			if (term === 0n) break;
			result += sign * term;
			sign *= -1n;
		}
		return result;
	}

	/**
	 * 正弦(sin)を計算する
	 * @returns 正弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sin(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.mantissa === 0n) return this._makeExactResult(0n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const res = Math.sin(this.toNumber());
			const mutate = config.mutateResult;
			const out = mutate ? this : this.clone();
			out.mantissa = BigInt(Math.floor(res * 1e15));
			out._exp2 = -15n;
			out._exp5 = -15n;
			out.softNormalize();
			out._applyPrecision(this._precision);
			out.lazyNormalize();
			return out;
		}

		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._sin(val, totalPr, maxSteps);
		const resBF = new construct();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	/**
	 * 余弦(cos)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 余弦
	 */
	protected static _cos(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = this._getPow10(precision);

		let term = scale;
		let result = term;
		const x2 = (x * x) / scale;
		let sign = -1n;

		for (let n = 1n, denom = 2n; n <= maxSteps; n++, denom += 2n) {
			term = (term * x2) / scale;
			term = term / (denom * (denom - 1n));
			if (term === 0n) break;
			result += sign * term;
			sign *= -1n;
		}
		return result;
	}

	/**
	 * 余弦(cos)を計算する
	 * @returns 余弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cos(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.mantissa === 0n) return this._makeExactResult(1n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const res = Math.cos(this.toNumber());
			const mutate = config.mutateResult;
			const out = mutate ? this : this.clone();
			out.mantissa = BigInt(Math.floor(res * 1e15));
			out._exp2 = -15n;
			out._exp5 = -15n;
			out.softNormalize();
			out._applyPrecision(this._precision);
			out.lazyNormalize();
			return out;
		}

		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._cos(val, totalPr, maxSteps);
		const resBF = new construct();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	/**
	 * 正接(tan)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正接
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _tan(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const cosX = this._cos(x, precision, maxSteps);
		const EPSILON = this._getPow10(precision - 4n);
		if (cosX === 0n || (cosX > -EPSILON && cosX < EPSILON)) throw new NumericalComputationError("tan(x) is undefined or numerically unstable at this point");
		const sinX = this._sin(x, precision, maxSteps);
		const scale = this._getPow10(precision);
		return (sinX * scale) / cosX;
	}

	/**
	 * 正接(tan)を計算する
	 * @returns 正接
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tan(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.mantissa === 0n) return this._makeExactResult(0n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const res = Math.tan(this.toNumber());
			const mutate = config.mutateResult;
			const out = mutate ? this : this.clone();
			out.mantissa = BigInt(Math.floor(res * 1e15));
			out._exp2 = -15n;
			out._exp5 = -15n;
			out.softNormalize();
			out._applyPrecision(this._precision);
			out.lazyNormalize();
			return out;
		}

		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._tan(val, totalPr, maxSteps);
		const resBF = new construct();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	/**
	 * 逆正弦(asin)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _asin(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = this._getPow10(precision);
		if (x > scale || x < -scale) throw new RangeError("asin input out of range [-1,1]");

		const halfPi = this._pi(precision) / 2n;
		const initial = (x * halfPi) / scale;

		const f = (theta: bigint) => this._sin(theta, precision, maxSteps) - x;
		const df = (theta: bigint) => this._cos(theta, precision, maxSteps);
		return this._trigFuncsNewton(f, df, initial, precision, Number(maxSteps));
	}

	/**
	 * 逆正弦(asin)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asin(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this._specialResult(SpecialValueState.NAN);
		}
		if ((this.gt(1) || this.lt(-1)) && construct.config.allowSpecialValues) {
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.mantissa === 0n) return this._makeExactResult(0n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const res = Math.asin(this.toNumber());
			const mutate = config.mutateResult;
			const out = mutate ? this : this.clone();
			out.mantissa = BigInt(Math.floor(res * 1e15));
			out._exp2 = -15n;
			out._exp5 = -15n;
			out.softNormalize();
			out._applyPrecision(this._precision);
			out.lazyNormalize();
			return out;
		}

		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._asin(val, totalPr, maxSteps);
		const resBF = new construct();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	/**
	 * 逆余弦(acos)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _acos(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const halfPi = this._pi(precision) / 2n;
		const asinX = this._asin(x, precision, maxSteps);
		return halfPi - asinX;
	}

	/**
	 * 逆余弦(acos)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acos(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this._specialResult(SpecialValueState.NAN);
		}
		if ((this.gt(1) || this.lt(-1)) && construct.config.allowSpecialValues) {
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this._getExactInteger() === 1n) return this._makeExactResult(0n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const res = Math.acos(this.toNumber());
			const mutate = config.mutateResult;
			const out = mutate ? this : this.clone();
			out.mantissa = BigInt(Math.floor(res * 1e15));
			out._exp2 = -15n;
			out._exp5 = -15n;
			out.softNormalize();
			out._applyPrecision(this._precision);
			out.lazyNormalize();
			return out;
		}

		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._acos(val, totalPr, maxSteps);
		const resBF = new construct();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	/**
	 * 逆正接(atan)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _atan(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = this._getPow10(precision);
		const absX = x < 0n ? -x : x;

		if (absX <= scale) {
			const f = (theta: bigint) => this._tan(theta, precision, maxSteps) - x;
			const df = (theta: bigint) => {
				const cosTheta = this._cos(theta, precision, maxSteps);
				if (cosTheta === 0n) throw new NumericalComputationError("Derivative undefined");
				return (scale * scale * scale) / (cosTheta * cosTheta);
			};
			return this._trigFuncsNewton(f, df, x, precision, Number(maxSteps));
		}

		const sign = x < 0n ? -1n : 1n;
		const halfPi = this._pi(precision) / 2n;
		const invX = (scale * scale) / absX;
		const innerAtan = this._atan(invX, precision, maxSteps);
		return sign * (halfPi - innerAtan);
	}

	/**
	 * 逆正接(atan)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atan(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			const halfPi = construct.pi(this._precision).div(2);
			return this._specialState === SpecialValueState.POSITIVE_INFINITY ? halfPi : halfPi.neg();
		}
		if (this.mantissa === 0n) return this._makeExactResult(0n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const res = Math.atan(this.toNumber());
			const mutate = config.mutateResult;
			const out = mutate ? this : this.clone();
			out.mantissa = BigInt(Math.floor(res * 1e15));
			out._exp2 = -15n;
			out._exp5 = -15n;
			out.softNormalize();
			out._applyPrecision(this._precision);
			out.lazyNormalize();
			return out;
		}

		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._atan(val, totalPr, maxSteps);
		const resBF = new construct();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	/**
	 * 2引数の逆正接(atan2)を計算する (内部用)
	 * @param y - y座標
	 * @param x - x座標
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _atan2(y: bigint, x: bigint, precision: bigint, maxSteps: bigint): bigint {
		if (x === 0n) {
			if (y > 0n) return this._pi(precision) / 2n;
			if (y < 0n) return -this._pi(precision) / 2n;
			return 0n;
		}

		const scale = this._getPow10(precision);
		const angle = this._atan((y * scale) / x, precision, maxSteps);

		if (x > 0n) return angle;
		if (y >= 0n) return angle + this._pi(precision);
		return angle - this._pi(precision);
	}

	/**
	 * 2引数の逆正接(atan2)を計算する
	 * @param x - x座標
	 * @returns 角度(ラジアン)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atan2(x: BigFloatValue): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const bfB = x instanceof BigFloat ? x : new construct(x, this._precision);
		const config = construct.config;
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			const pi = construct.pi(resultPrecision);
			const halfPi = pi.div(2);
			const quarterPi = pi.div(4);
			if (this._isInfinityState()) {
				if (bfB._isInfinityState()) {
					if (this._specialState === SpecialValueState.POSITIVE_INFINITY) {
						return bfB._specialState === SpecialValueState.POSITIVE_INFINITY ? quarterPi : pi.sub(quarterPi);
					}
					return bfB._specialState === SpecialValueState.POSITIVE_INFINITY ? quarterPi.neg() : pi.sub(quarterPi).neg();
				}
				return this._specialState === SpecialValueState.POSITIVE_INFINITY ? halfPi : halfPi.neg();
			}
			if (bfB._specialState === SpecialValueState.POSITIVE_INFINITY) {
				return this._makeExactResultWithPrecision(0n, resultPrecision);
			}
			return this.isNegative() ? pi.neg() : pi;
		}
		if (this.mantissa === 0n && bfB.mantissa >= 0n) return this._makeExactResult(0n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const res = Math.atan2(this.toNumber(), bfB.toNumber());
			const mutate = config.mutateResult;
			const out = mutate ? this : this.clone();
			out.mantissa = BigInt(Math.floor(res * 1e15));
			out._exp2 = -15n;
			out._exp5 = -15n;
			out.softNormalize();
			out._applyPrecision(this._precision);
			out.lazyNormalize();
			return out;
		}

		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const valA = this._getInternalValue(totalPr);
		const valB = bfB._getInternalValue(totalPr);

		const result = construct._atan2(valA, valB, totalPr, maxSteps);
		const resBF = new construct();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	// ====================================================================================================
	// * 双曲線関数
	// ====================================================================================================

	/**
	 * 双曲線正弦(sinh)を計算する
	 * @returns 双曲線正弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sinh(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			return this._specialResult(this._specialState);
		}
		if (this.isZero()) return this._makeExactResult(0n);
		if (this._precision <= 15n) {
			return this._fromSpecialAwareNumber(Math.sinh(this.toNumber()), this._precision);
		}
		const positive = this.exp();
		const negative = this.neg().exp();
		return positive.sub(negative).div(2);
	}

	/**
	 * 双曲線余弦(cosh)を計算する
	 * @returns 双曲線余弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cosh(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
		}
		if (this.isZero()) return this._makeExactResult(1n);
		if (this._precision <= 15n) {
			return this._fromSpecialAwareNumber(Math.cosh(this.toNumber()), this._precision);
		}
		const positive = this.exp();
		const negative = this.neg().exp();
		return positive.add(negative).div(2);
	}

	/**
	 * 双曲線正接(tanh)を計算する
	 * @returns 双曲線正接
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tanh(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			return this._makeExactResultWithPrecision(this._specialState === SpecialValueState.POSITIVE_INFINITY ? 1n : -1n, this._precision);
		}
		if (this.isZero()) return this._makeExactResult(0n);
		if (this._precision <= 15n) {
			return this._fromSpecialAwareNumber(Math.tanh(this.toNumber()), this._precision);
		}
		const doubled = this.mul(2);
		const expDouble = doubled.exp();
		return expDouble.sub(1).div(expDouble.add(1));
	}

	/**
	 * 逆双曲線正弦(asinh)を計算する
	 * @returns 逆双曲線正弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asinh(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this._specialResult(this._specialState);
		}
		if (this.isZero()) return this._makeExactResult(0n);
		if (this._precision <= 15n) {
			return this._fromSpecialAwareNumber(Math.asinh(this.toNumber()), this._precision);
		}
		return this.mul(this).add(1).sqrt().add(this).ln();
	}

	/**
	 * 逆双曲線余弦(acosh)を計算する
	 * @returns 逆双曲線余弦
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acosh(): BigFloat {
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.lt(1)) {
			if ((this.constructor as BigFloatConstructor).config.allowSpecialValues) return this._specialResult(SpecialValueState.NAN);
			throw new RangeError("acosh input must be >= 1");
		}
		if (this.eq(1)) return this._makeExactResult(0n);
		if (this._precision <= 15n) {
			return this._fromSpecialAwareNumber(Math.acosh(this.toNumber()), this._precision);
		}
		return this.add(this.sub(1).sqrt().mul(this.add(1).sqrt())).ln();
	}

	/**
	 * 逆双曲線正接(atanh)を計算する
	 * @returns 逆双曲線正接
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atanh(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.eq(1)) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			throw new RangeError("atanh input must be in [-1,1]");
		}
		if (this.eq(-1)) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NEGATIVE_INFINITY);
			throw new RangeError("atanh input must be in [-1,1]");
		}
		if (this.gt(1) || this.lt(-1)) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NAN);
			throw new RangeError("atanh input must be in [-1,1]");
		}
		if (this.isZero()) return this._makeExactResult(0n);
		if (this._precision <= 15n) {
			return this._fromSpecialAwareNumber(Math.atanh(this.toNumber()), this._precision);
		}
		const one = new construct(1n, this._precision);
		return one.add(this).div(one.sub(this)).ln().div(2);
	}

	/**
	 * マチン(Machin)の公式用のatan計算 (内部用)
	 * @param invX - 1/xのx
	 * @param precision - 精度
	 * @returns atan(1/x)
	 */
	protected static _atanMachine(invX: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		const x = scale / invX;
		const x2 = (x * x) / scale;
		let term = x;
		let sum = term;
		let sign = -1n;

		let lastTerm = 0n;
		for (let n = 3n; term !== lastTerm; n += 2n) {
			term = (term * x2) / scale;
			lastTerm = term;
			sum += (sign * term) / n;
			sign *= -1n;
		}
		return sum;
	}

	/**
	 * 三角関数用のニュートン法 (内部用)
	 * @param f - 関数
	 * @param df - 導関数
	 * @param initial - 初期値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 解
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 */
	protected static _trigFuncsNewton(f: (x: bigint) => bigint, df: (x: bigint) => bigint, initial: bigint, precision: bigint, maxSteps = 50): bigint {
		const scale = this._getPow10(precision);
		let x = initial;
		for (let i = 0; i < maxSteps; i++) {
			const fx = f(x);
			if (fx === 0n) break;
			const dfx = df(x);
			if (dfx === 0n) throw new NumericalComputationError("Derivative zero during Newton iteration");
			const dx = (fx * scale) / dfx;
			x = x - dx;
			if (dx === 0n) break;
		}
		return x;
	}

	/**
	 * sin(pi * z) を計算する (内部用)
	 * @param z - 値
	 * @param precision - 精度
	 * @returns sin(pi * z)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _sinPi(z: bigint, precision: bigint): bigint {
		const pi = this._pi(precision);
		const scale = this._getPow10(precision);
		const x = (pi * z) / scale;
		return this._sin(x, precision, this.config.trigFuncsMaxSteps);
	}

	// ====================================================================================================
	// * 対数・指数・自然定数
	// ====================================================================================================

	/**
	 * 指数関数(e^x)を計算する (内部用)
	 * @param x - 指数
	 * @param precision - 精度
	 * @returns e^x
	 */
	protected static _exp(x: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		let sum = scale;
		let term = scale;
		let n = 1n;
		while (true) {
			term = (term * x) / (scale * n);
			if (term === 0n) break;
			sum += term;
			n++;
		}
		return sum;
	}

	/**
	 * 指数関数(e^x)を計算する
	 * @returns e^x
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public exp(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._makeExactResultWithPrecision(0n, this._precision);
		}
		if (this.mantissa === 0n) return this._makeExactResult(1n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const val = this.toNumber();
			const eVal = Math.exp(val);
			const mutate = config.mutateResult;
			const res = mutate ? this : this.clone();
			res.mantissa = BigInt(Math.floor(eVal * 1e15));
			res._exp2 = -15n;
			res._exp5 = -15n;
			res.softNormalize();
			res._applyPrecision(this._precision);
			res.lazyNormalize();
			return res;
		}

		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const expInt = construct._exp(val, totalPr);
		return this._makeResult(expInt, this._precision, totalPr);
	}

	/**
	 * 2の冪乗(2^x)を計算する (内部用)
	 * @param value - 指数
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 2^x
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _exp2(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const LN2 = this._ln2(precision, maxSteps);
		const scale = this._getPow10(precision);
		return this._exp((LN2 * value) / scale, precision);
	}

	/**
	 * 2の冪乗(2^x)を計算する
	 * @returns 2^x
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public exp2(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._makeExactResultWithPrecision(0n, this._precision);
		}
		if (this.mantissa === 0n) return this._makeExactResult(1n);
		const exactInteger = this._getExactInteger();
		if (exactInteger !== null) return this._makeExactResult(1n, exactInteger, 0n);
		const maxSteps = config.lnMaxSteps;
		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const exp2Int = construct._exp2(val, totalPr, maxSteps);
		return this._makeResult(exp2Int, this._precision, totalPr);
	}

	/**
	 * e^x - 1 を計算する (内部用)
	 * @param value - 指数
	 * @param precision - 精度
	 * @returns e^x - 1
	 */
	protected static _expm1(value: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		const absValue = value < 0n ? -value : value;
		const threshold = scale / 10n;

		if (absValue < threshold) {
			let term = value;
			let result = term;
			let factorial = 1n;
			let addend = 1n;
			for (let n = 2n; addend !== 0n; n++) {
				factorial *= n;
				term = (term * value) / scale;
				addend = term / factorial;
				result += addend;
			}
			return result;
		} else {
			return this._exp(value, precision) - scale;
		}
	}

	/**
	 * e^x - 1 を計算する
	 * @returns e^x - 1
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public expm1(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.NAN) return this._specialResult(SpecialValueState.NAN);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._makeExactResultWithPrecision(-1n, this._precision);
		}
		if (this.mantissa === 0n) return this._makeExactResult(0n);
		const totalPr = this._precision + construct.config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const expInt = construct._expm1(val, totalPr);
		return this._makeResult(expInt, this._precision, totalPr);
	}

	/**
	 * 自然対数(ln)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(value)
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _ln(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		if (value <= 0n) throw new RangeError("ln(x) is undefined for x <= 0");
		const scale = this._getPow10(precision);

		// 小さな整数の対数をキャッシュから取得・洗練
		if (value % scale === 0n) {
			const intVal = value / scale;
			if (intVal === 1n) return 0n;
			const key = intVal.toString();
			if (this._getCheckLnCache(key, precision)) {
				return this._getLnCache(key, precision);
			}
			const seed = this._getLnSeedCache(key, precision);
			if (seed) {
				const refined = this._refineLogConstantFromCache(value, seed, precision);
				this._updateLnCache(key, refined, precision);
				return refined;
			}
			// ln(10) や ln(2) は専用メソッドへ委譲して再帰を避ける
			if (intVal === 10n) return this._ln10(precision, maxSteps);
			if (intVal === 2n) return this._ln2(precision, maxSteps);
		}

		let x = value;
		let k = 0n;
		while (x > 10n * scale) {
			x /= 10n;
			k += 1n;
		}
		while (x < scale) {
			x *= 10n;
			k -= 1n;
		}
		const z = ((x - scale) * scale) / (x + scale);
		const zSquared = (z * z) / scale;
		let term = z;
		let result = term;
		for (let n = 1n; n < maxSteps; n++) {
			term = (term * zSquared) / scale;
			const denom = 2n * n + 1n;
			const addend = term / denom;
			if (addend === 0n) break;
			result += addend;
		}
		const LN10 = this._ln10(precision, maxSteps);
		const finalLn = 2n * result + k * LN10;

		// 整数引数の場合はキャッシュ
		if (value % scale === 0n) {
			this._updateLnCache((value / scale).toString(), finalLn, precision);
		}

		return finalLn;
	}

	/**
	 * 自然対数(ln)を計算する
	 * @returns ln(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public ln(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const config = construct.config;
		const maxSteps = config.lnMaxSteps;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.isZero()) {
			if (config.allowSpecialValues) return this._specialResult(SpecialValueState.NEGATIVE_INFINITY);
			throw new RangeError("ln(x) is undefined for x <= 0");
		}
		if (this.mantissa < 0n) {
			if (config.allowSpecialValues) return this._specialResult(SpecialValueState.NAN);
			throw new RangeError("ln(x) is undefined for x <= 0");
		}
		if (this._getExactInteger() === 1n) return this._makeExactResult(0n);

		// ハイブリッド方式
		if (this._precision <= 15n) {
			const val = this.toNumber();
			if (val <= 0) throw new RangeError("ln(x) is undefined for x <= 0");
			const logVal = Math.log(val);
			const mutate = config.mutateResult;
			const res = mutate ? this : this.clone();
			res.mantissa = BigInt(Math.floor(logVal * 1e15));
			res._exp2 = -15n;
			res._exp5 = -15n;
			res.softNormalize();
			res._applyPrecision(this._precision);
			res.lazyNormalize();
			return res;
		}

		const totalPr = this._precision + config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._ln(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * 対数を計算する (内部用)
	 * @param value - 値
	 * @param baseValue - 底
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log_base(value)
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log(value: bigint, baseValue: bigint, precision: bigint, maxSteps: bigint): bigint {
		if (value === this._getPow10(precision)) return 0n;
		const lnB = this._ln(baseValue, precision, maxSteps);
		if (lnB === 0n) throw new RangeError("log base cannot be 1 or 0");
		const lnX = this._ln(value, precision, maxSteps);
		const SCALE = this._getPow10(precision);
		return (lnX * SCALE) / lnB;
	}

	/**
	 * 対数を計算する
	 * @param base - 底
	 * @returns log_base(x)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public log(base: BigFloatValue): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		const bfB = base instanceof BigFloat ? base : new construct(base, this._precision);
		const maxSteps = construct.config.lnMaxSteps;
		const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (!this._isFiniteState() || !bfB._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this, bfB);
			if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (bfB._isInfinityState()) {
				if (bfB._specialState === SpecialValueState.NEGATIVE_INFINITY) return this._specialResult(SpecialValueState.NAN, resultPrecision);
				if (this._isInfinityState()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
				if (this.mantissa <= 0n) return this._specialResult(SpecialValueState.NAN, resultPrecision);
				if (this._getExactInteger() === 1n) return this._makeExactResultWithPrecision(0n, resultPrecision);
				return this._makeExactResultWithPrecision(0n, resultPrecision);
			}
			if (this._specialState === SpecialValueState.NEGATIVE_INFINITY) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (bfB.mantissa <= 0n || bfB._getExactInteger() === 1n) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (bfB.gt(1)) return this._specialResult(SpecialValueState.POSITIVE_INFINITY, resultPrecision);
			return this._specialResult(SpecialValueState.NEGATIVE_INFINITY, resultPrecision);
		}
		const baseExactInteger = bfB._getExactInteger();
		if (baseExactInteger === 1n && construct.config.allowSpecialValues) {
			return this._specialResult(SpecialValueState.NAN, resultPrecision);
		}
		if ((this.mantissa <= 0n || bfB.mantissa <= 0n) && construct.config.allowSpecialValues) {
			if (this.mantissa < 0n || bfB.mantissa < 0n || bfB.isZero()) return this._specialResult(SpecialValueState.NAN, resultPrecision);
			if (this.isZero()) {
				return bfB.gt(1) ? this._specialResult(SpecialValueState.NEGATIVE_INFINITY, resultPrecision) : this._specialResult(SpecialValueState.POSITIVE_INFINITY, resultPrecision);
			}
		}
		if (this._getExactInteger() === 1n) return this._makeExactResult(0n);

		const totalPr = resultPrecision + construct.config.extraPrecision;
		const valA = this._getInternalValue(totalPr);
		const valB = bfB._getInternalValue(totalPr);

		const raw = construct._log(valA, valB, totalPr, maxSteps);
		return this._makeResult(raw, resultPrecision, totalPr);
	}

	/**
	 * 2を底とする対数(log2)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log2(value)
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log2(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = this._getPow10(precision);
		const baseValue = 2n * scale;
		return this._log(value, baseValue, precision, maxSteps);
	}

	/**
	 * 2を底とする対数(log2)を計算する
	 * @returns log2(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log2(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.isZero()) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NEGATIVE_INFINITY);
			throw new RangeError("ln(x) is undefined for x <= 0");
		}
		if (this.mantissa < 0n) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NAN);
			throw new RangeError("ln(x) is undefined for x <= 0");
		}
		if (this._getExactInteger() === 1n) return this._makeExactResult(0n);
		const exactPower = this._getExactPowerOf2Exponent();
		if (exactPower !== null) return this._makeExactResult(exactPower);
		const maxSteps = construct.config.lnMaxSteps;
		const totalPr = this._precision + construct.config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._log2(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * 10を底とする対数(log10)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log10(value)
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log10(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const baseValue = this._getPow10(precision + 1n);
		return this._log(value, baseValue, precision, maxSteps);
	}

	/**
	 * 10を底とする対数(log10)を計算する
	 * @returns log10(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log10(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.isZero()) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NEGATIVE_INFINITY);
			throw new RangeError("ln(x) is undefined for x <= 0");
		}
		if (this.mantissa < 0n) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NAN);
			throw new RangeError("ln(x) is undefined for x <= 0");
		}
		if (this._getExactInteger() === 1n) return this._makeExactResult(0n);
		const exactPower = this._getExactPowerOf10Exponent();
		if (exactPower !== null) return this._makeExactResult(exactPower);
		const maxSteps = construct.config.lnMaxSteps;
		const totalPr = this._precision + construct.config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._log10(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * ln(1 + x) を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(1 + value)
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log1p(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = this._getPow10(precision);
		const onePlusX = scale + value;
		return this._ln(onePlusX, precision, maxSteps);
	}

	/**
	 * ln(1 + x) を計算する
	 * @returns ln(1 + x)
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public log1p(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this._getExactInteger() === -1n) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.NEGATIVE_INFINITY);
			throw new RangeError("ln(x) is undefined for x <= 0");
		}
		if (this.lt(-1) && construct.config.allowSpecialValues) {
			return this._specialResult(SpecialValueState.NAN);
		}
		if (this.mantissa === 0n) return this._makeExactResult(0n);
		const maxSteps = construct.config.lnMaxSteps;
		const totalPr = this._precision + construct.config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._log1p(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * ln(10) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(10)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _ln10(precision: bigint, maxSteps = 10000n): bigint {
		const key = "10";
		if (this._getCheckLnCache(key, precision)) {
			return this._getLnCache(key, precision);
		}
		const seed = this._getLnSeedCache(key, precision);
		if (seed) {
			const scale = this._getPow10(precision);
			const refined = this._refineLogConstantFromCache(10n * scale, seed, precision);
			this._updateLnCache(key, refined, precision);
			return refined;
		}

		const scale = this._getPow10(precision);
		const x = 10n * scale;
		const z = ((x - scale) * scale) / (x + scale);
		const zSquared = (z * z) / scale;
		let term = z;
		let result = term;
		for (let n = 1n; n < maxSteps; n++) {
			term = (term * zSquared) / scale;
			const denom = 2n * n + 1n;
			const addend = term / denom;
			if (addend === 0n) break;
			result += addend;
		}
		const res = 2n * result;
		this._updateLnCache(key, res, precision);
		return res;
	}

	/**
	 * ln(2) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(2)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _ln2(precision: bigint, maxSteps: bigint): bigint {
		const key = "2";
		if (this._getCheckLnCache(key, precision)) {
			return this._getLnCache(key, precision);
		}
		const seed = this._getLnSeedCache(key, precision);
		if (seed) {
			const scale = this._getPow10(precision);
			const refined = this._refineLogConstantFromCache(2n * scale, seed, precision);
			this._updateLnCache(key, refined, precision);
			return refined;
		}
		// ln() calls ln2/ln10 for integers, so we need to avoid recursion
		const scale = this._getPow10(precision);
		const x = 2n * scale;
		const z = ((x - scale) * scale) / (x + scale);
		const zSquared = (z * z) / scale;
		let term = z;
		let result = term;
		for (let n = 1n; n < maxSteps; n++) {
			term = (term * zSquared) / scale;
			const denom = 2n * n + 1n;
			const addend = term / denom;
			if (addend === 0n) break;
			result += addend;
		}
		const res = 2n * result;
		this._updateLnCache(key, res, precision);
		return res;
	}

	/**
	 * 自然対数の底(e)を取得する (内部用)
	 * @param precision - 精度
	 * @returns e
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _e(precision: bigint): bigint {
		if (this._getCheckECache(precision)) {
			return this._getECache(precision);
		}
		const scale = this._getPow10(precision);
		const eInt = this._exp(scale, precision);
		this._updateECache(eInt, precision);
		return eInt;
	}

	/**
	 * 自然対数の底(e)を取得する
	 * @param precision - 精度
	 * @returns e
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static e(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		const precisionBig = BigInt(precision);
		this._checkPrecision(precisionBig);
		const totalPr = precisionBig + this.config.extraPrecision;
		const eInt = this._e(totalPr);
		return this._makeResult(eInt, precisionBig, totalPr);
	}

	// ====================================================================================================
	// * 定数（π, τ）
	// ====================================================================================================

	/**
	 * チュドノフスキー法で円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _piChudnovsky(precision = this.DEFAULT_PRECISION): bigint {
		const scale = this._getPow10(precision);
		const digitsPerTerm = 14n;
		const terms = precision / digitsPerTerm + 1n;
		const C = 426880n * this._sqrt(10005n * scale, precision);
		let sum = 0n;
		/**
		 * 内部用の累乗計算
		 * @param base - 底
		 * @param exp - 指数
		 * @returns 累乗の結果
		 */
		function bigPower(base: bigint, exp: bigint) {
			let res = 1n;
			for (let i = 0n; i < exp; i++) res *= base;
			return res;
		}
		for (let k = 0n; k < terms; k++) {
			const numerator = this._factorial(6n * k) * (545140134n * k + 13591409n) * (k % 2n === 0n ? 1n : -1n);
			const denominator = this._factorial(3n * k) * bigPower(this._factorial(k), 3n) * bigPower(640320n, 3n * k);
			sum += (scale * numerator) / denominator;
		}
		if (sum === 0n) {
			console.error("Chudnovsky法の計算に失敗しました");
			return 0n;
		}
		return (C * scale) / sum;
	}

	/**
	 * 設定されたアルゴリズムで円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _pi(precision: bigint): bigint {
		if (this._getCheckPiCache(precision)) {
			return this._getPiCache(precision);
		}
		const seed = this._getPiSeedCache(precision);
		if (seed) {
			const refined = this._refinePiFromCache(seed, precision);
			this._updatePiCache(refined, precision);
			return refined;
		}
		const piRet = this._piChudnovsky(precision);
		this._updatePiCache(piRet, precision);
		return piRet;
	}

	/**
	 * 円周率(pi)を取得する
	 * @param precision - 精度
	 * @returns pi
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static pi(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		const precisionBig = BigInt(precision);
		this._checkPrecision(precisionBig);
		const val = this._pi(precisionBig);
		return this._makeResult(val, precisionBig);
	}

	/**
	 * タウ(tau = 2*pi)を計算する (内部用)
	 * @param precision - 精度
	 * @returns tau
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _tau(precision: bigint): bigint {
		const pi = this._pi(precision);
		return pi * 2n;
	}

	/**
	 * タウ(tau = 2*pi)を取得する
	 * @param precision - 精度
	 * @returns tau
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static tau(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		const precisionBig = BigInt(precision);
		this._checkPrecision(precisionBig);
		const val = this._tau(precisionBig);
		return this._makeResult(val, precisionBig);
	}

	// ====================================================================================================
	// * Math互換 静的メソッド
	// ====================================================================================================

	/**
	 * Math.abs() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 絶対値
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public static abs(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).abs();
	}

	/**
	 * Math.acos() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆余弦
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static acos(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).acos();
	}

	/**
	 * Math.acosh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線余弦
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static acosh(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).acosh();
	}

	/**
	 * Math.asin() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆正弦
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static asin(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).asin();
	}

	/**
	 * Math.asinh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線正弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static asinh(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).asinh();
	}

	/**
	 * Math.atan() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆正接
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static atan(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).atan();
	}

	/**
	 * Math.atan2() 相当
	 * @param y - y座標
	 * @param x - x座標
	 * @param precision - 結果精度
	 * @returns 逆正接
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static atan2(y: BigFloatValue, x: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([y, x], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(y, precisionBig).atan2(this._coerceBigFloatValue(x, precisionBig));
	}

	/**
	 * Math.atanh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線正接
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static atanh(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).atanh();
	}

	/**
	 * Math.cbrt() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 立方根
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public static cbrt(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).cbrt();
	}

	/**
	 * Math.ceil() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り上げ結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public static ceil(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).ceil();
	}

	/**
	 * Math.clz32() 相当
	 * @param value - 対象値
	 * @returns 先頭ゼロビット数
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static clz32(value: BigFloatValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).clz32();
	}

	/**
	 * Math.cos() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 余弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static cos(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).cos();
	}

	/**
	 * Math.cosh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線余弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static cosh(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).cosh();
	}

	/**
	 * Math.exp() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 指数関数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static exp(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).exp();
	}

	/**
	 * Math.expm1() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns e^x - 1
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public static expm1(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).expm1();
	}

	/**
	 * Math.floor() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り捨て結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public static floor(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).floor();
	}

	/**
	 * Math.fround() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns Float32相当に丸めた結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static fround(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).fround();
	}

	/**
	 * Math.hypot() 相当
	 * @param values - 値の列
	 * @returns sqrt(sum(x_i^2))
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static hypot(...values: BigFloatValue[]): BigFloat {
		if (values.length === 0) return new this(0);
		const precisionBig = this._resolvePrecisionFromValues(values, this.DEFAULT_PRECISION);
		const args = values.map((value) => this._coerceBigFloatValue(value, precisionBig));
		if (!this.config.allowSpecialValues) {
			for (const value of args) {
				if (!value._isFiniteState()) throw new SpecialValuesDisabledError("Special values are disabled");
			}
		}
		for (const value of args) {
			if (value._isInfinityState()) return this.infinity(precisionBig);
		}
		for (const value of args) {
			if (value._isNaNState()) return this.nan(precisionBig);
		}
		let total = new this(0, precisionBig);
		for (const value of args) {
			const squared = value.mul(value);
			total = total.add(squared);
		}
		return total.sqrt();
	}

	/**
	 * Math.imul() 相当
	 * @param lhs - 左辺
	 * @param rhs - 右辺
	 * @returns 32bit整数乗算結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static imul(lhs: BigFloatValue, rhs: BigFloatValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([lhs, rhs], this.DEFAULT_PRECISION);
		const left = this._coerceBigFloatValue(lhs, precisionBig);
		const right = this._coerceBigFloatValue(rhs, precisionBig);
		return new this(Math.imul(left.toNumber(), right.toNumber()), 0n);
	}

	/**
	 * Math.log() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 自然対数
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static log(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).ln();
	}

	/**
	 * Math.log10() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 常用対数
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static log10(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).log10();
	}

	/**
	 * Math.log1p() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns ln(1 + x)
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public static log1p(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).log1p();
	}

	/**
	 * Math.log2() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 底2対数
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public static log2(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).log2();
	}

	/**
	 * Math.max() 相当
	 * @param args - 数値のリスト
	 * @returns 最大値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public static max(...args: BigFloatAggregateArgs): BigFloat {
		const values = this._normalizeArgs(args);
		if (values.length === 0) return this.negativeInfinity();
		const precisionBig = this._resolvePrecisionFromValues(values, this.DEFAULT_PRECISION);
		const arr = values.map((value) => this._coerceBigFloatValue(value, precisionBig));
		if (!this.config.allowSpecialValues) {
			for (const value of arr) {
				if (!value._isFiniteState()) throw new SpecialValuesDisabledError("Special values are disabled");
			}
		}
		for (const value of arr) {
			if (value._isNaNState()) return this.nan(precisionBig);
		}
		let maxBF = arr[0];
		for (let i = 1; i < arr.length; i++) {
			if (arr[i].gt(maxBF)) maxBF = arr[i];
		}
		return maxBF.clone();
	}

	/**
	 * Math.min() 相当
	 * @param args - 数値のリスト
	 * @returns 最小値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	public static min(...args: BigFloatAggregateArgs): BigFloat {
		const values = this._normalizeArgs(args);
		if (values.length === 0) return this.infinity();
		const precisionBig = this._resolvePrecisionFromValues(values, this.DEFAULT_PRECISION);
		const arr = values.map((value) => this._coerceBigFloatValue(value, precisionBig));
		if (!this.config.allowSpecialValues) {
			for (const value of arr) {
				if (!value._isFiniteState()) throw new SpecialValuesDisabledError("Special values are disabled");
			}
		}
		for (const value of arr) {
			if (value._isNaNState()) return this.nan(precisionBig);
		}
		let minBF = arr[0];
		for (let i = 1; i < arr.length; i++) {
			if (arr[i].lt(minBF)) minBF = arr[i];
		}
		return minBF.clone();
	}

	/**
	 * Math.pow() 相当
	 * @param base - 底
	 * @param exponent - 指数
	 * @param precision - 結果精度
	 * @returns 冪乗結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public static pow(base: BigFloatValue, exponent: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([base, exponent], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(base, precisionBig).pow(this._coerceBigFloatValue(exponent, precisionBig));
	}

	/**
	 * Math.round() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 四捨五入結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static round(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).round();
	}

	/**
	 * Math.sign() 相当
	 * @param value - 対象値
	 * @param precision - 入力精度
	 * @returns 符号
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static sign(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).sign();
	}

	/**
	 * Math.sin() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 正弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static sin(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).sin();
	}

	/**
	 * Math.sinh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線正弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static sinh(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).sinh();
	}

	/**
	 * Math.sqrt() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static sqrt(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).sqrt();
	}

	/**
	 * Math.tan() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 正接
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static tan(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).tan();
	}

	/**
	 * Math.tanh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線正接
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static tanh(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).tanh();
	}

	/**
	 * Math.trunc() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り捨て結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public static trunc(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
		const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
		return this._coerceBigFloatValue(value, precisionBig).trunc();
	}

	// ====================================================================================================
	// * 統計関数
	// ====================================================================================================

	/**
	 * 引数の合計を返す
	 * @param args - 数値のリスト
	 * @returns 合計
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static sum(...args: BigFloatAggregateArgs): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new this(x)));
		if (arr.length === 0) return new this(0);
		let total = new this(0, arr[0]._precision);
		for (const item of arr) {
			total = total.add(item);
		}
		return total;
	}

	/**
	 * 引数の積を返す
	 * @param args - 数値のリスト
	 * @returns 積
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static product(...args: BigFloatAggregateArgs): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new this(x)));
		if (arr.length === 0) return new this(1);
		let prod = new this(1, arr[0]._precision);
		for (const item of arr) {
			prod = prod.mul(item);
		}
		return prod;
	}

	/**
	 * 引数の平均を返す
	 * @param args - 数値のリスト
	 * @returns 平均
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static average(...args: BigFloatAggregateArgs): BigFloat {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) return new this();
		const total = this.sum(arr);
		return total.div(new this(arr.length));
	}

	/**
	 * 引数の中央値を返す
	 * @param args - 数値のリスト
	 * @returns 中央値
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static median(...args: BigFloatAggregateArgs): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new this(x)));
		if (arr.length === 0) throw new TypeError("No arguments provided");
		const sorted = arr.sort((a, b) => a.compare(b));
		const mid = Math.floor(sorted.length / 2);
		if (sorted.length % 2 === 1) {
			return sorted[mid].clone();
		} else {
			return sorted[mid - 1].add(sorted[mid]).div(2);
		}
	}

	/**
	 * 引数の分散を返す
	 * @param args - 数値のリスト
	 * @returns 分散
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static variance(...args: BigFloatAggregateArgs): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new this(x)));
		if (arr.length === 0) throw new TypeError("No arguments provided");
		if (arr.length === 1) return new this(0, arr[0]._precision);

		const n = new this(arr.length);
		const total = this.sum(arr);
		const meanVal = total.div(n);

		let sumSquares = new this(0, meanVal._precision);
		for (const item of arr) {
			const diff = item.sub(meanVal);
			sumSquares = sumSquares.add(diff.mul(diff));
		}

		return sumSquares.div(n);
	}

	/**
	 * 引数の標準偏差を返す
	 * @param args - 数値のリスト
	 * @returns 標準偏差
	 * @throws {TypeError} 引数が空の場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static stddev(...args: BigFloatAggregateArgs): BigFloat {
		const varianceVal = this.variance(...args);
		return varianceVal.sqrt();
	}

	// ====================================================================================================
	// * ランダム・乱数生成
	// ====================================================================================================

	/**
	 * ランダムな整数値を生成する (内部用)
	 * @param precision - 精度
	 * @returns ランダムな値
	 */
	protected static _randomBigInt(precision: bigint): bigint {
		// 固定範囲なので直接指定
		const LOG2_10_NUM = 33219280948873626n;
		const LOG2_10_DEN = 10n ** 16n;

		const bits = (precision * LOG2_10_NUM + LOG2_10_DEN - 1n) / LOG2_10_DEN;
		const rounds = (bits + 52n) / 53n;

		const totalBits = rounds * 53n;
		const excessBits = totalBits - bits;

		const scale = this._getPow10(precision);

		while (true) {
			let result = 0n;

			for (let i = 0n; i < rounds; i++) {
				const r = BigInt(Math.floor(Math.random() * 2 ** 53));
				result = (result << 53n) + r;
			}
			if (excessBits > 0n) {
				result >>= excessBits;
			}
			if (result < scale) return result;
		}
	}

	/**
	 * 0以上1未満のランダムなBigFloatを生成する
	 * @param precision - 精度
	 * @returns ランダムなBigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static random(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		const precisionBig = BigInt(precision);
		this._checkPrecision(precisionBig);
		let randBigInt = this._randomBigInt(precisionBig);
		const res = new this(0, precisionBig);
		res.mantissa = randBigInt;
		res._exp2 = -precisionBig;
		res._exp5 = -precisionBig;
		res.softNormalize();
		res._applyPrecision();
		return res;
	}

	// ====================================================================================================
	// * 特殊関数・積分・ガンマ関数など
	// ====================================================================================================

	/**
	 * 数値積分を計算する (内部用)
	 * @param f - 関数
	 * @param a - 開始点
	 * @param b - 終了点
	 * @param n - 分割数
	 * @param precision - 精度
	 * @returns 積分結果
	 */
	protected static _integral(f: (k: bigint) => bigint, a: bigint, b: bigint, n: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		if (n <= 0n || a === b) return 0n;
		const delta = b - a;
		let sum = f(a) + f(b);
		for (let i = 1n; i < n; i++) {
			const numerator = a * n + i * delta;
			const x_i = numerator / n;
			const term = 2n * f(x_i);
			if (term === 0n) break;
			sum += term;
		}
		const denominator = scale * n * 2n;
		if (denominator === 0n) return 0n;
		return (delta * sum) / denominator;
	}

	/**
	 * 連続する整数の冪乗を計算する (内部用)
	 * (n * scale)^-s を n=1..N について計算する
	 * @param s - 指数
	 * @param N - 最大の整数
	 * @param precision - 精度
	 * @returns 冪乗の結果の配列 (1-indexed)
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _computePowers(s: bigint, N: number, precision: bigint): bigint[] {
		const scale = this._getPow10(precision);
		const results = new Array<bigint>(N + 1);
		if (N < 1) return results;
		results[1] = scale;
		if (N < 2) return results;

		const minPrimeFactor = new Int32Array(N + 1);
		for (let i = 2; i <= N; i++) {
			if (minPrimeFactor[i] === 0) {
				results[i] = this._pow(BigInt(i) * scale, -s, precision);
				for (let j = i; j <= N; j += i) {
					if (minPrimeFactor[j] === 0) minPrimeFactor[j] = i;
				}
			} else {
				const p = minPrimeFactor[i];
				const m = i / p;
				results[i] = (results[p] * results[m]) / scale;
			}
		}
		return results;
	}

	/**
	 * ベルヌーイ数を生成する (内部用)
	 * @param n - 最大次数
	 * @param precision - 精度
	 * @returns ベルヌーイ数のリスト
	 */
	protected static _bernoulliNumbers(n: number, precision: bigint): bigint[] {
		const A = new Array(n + 1).fill(0n);
		const B = new Array(n + 1).fill(0n);
		const scale = this._getPow10(precision);
		for (let m = 0; m <= n; m++) {
			A[m] = scale / BigInt(m + 1);
			for (let j = m; j >= 1; j--) {
				const term = (A[j - 1] as bigint) - (A[j] as bigint);
				A[j - 1] = BigInt(j) * term;
			}
			B[m] = A[0];
		}
		if (n >= 1) {
			B[1] = -scale / 2n;
		}
		return B;
	}

	/**
	 * ln(2 * pi) を計算する (内部用)
	 * @param precision - 精度
	 * @returns ln(2 * pi)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 値が0以下の場合
	 */
	protected static _ln2pi(precision: bigint): bigint {
		const key = "2pi";
		if (this._getCheckLnCache(key, precision)) {
			return this._getLnCache(key, precision);
		}
		const pi = this._pi(precision);
		const twoPi = 2n * pi;
		const seed = this._getLnSeedCache(key, precision);
		if (seed) {
			const refined = this._refineLogConstantFromCache(twoPi, seed, precision);
			this._updateLnCache(key, refined, precision);
			return refined;
		}
		const ln2pi = this._ln(twoPi, precision, this.config.lnMaxSteps);
		this._updateLnCache(key, ln2pi, precision);
		return ln2pi;
	}

	/**
	 * キャッシュ付きでベルヌーイ数を取得する
	 * @param n - 最大次数
	 * @param precision - 精度
	 * @returns ベルヌーイ数のリスト
	 */
	protected static _getBernoulliNumbers(n: number, precision: bigint): bigint[] {
		const key = precision.toString();
		if (this._bernoulliCache[key] && this._bernoulliCache[key].length > n) {
			return this._bernoulliCache[key];
		}
		const B = this._bernoulliNumbers(n, precision);
		this._bernoulliCache[key] = B;
		return B;
	}

	/**
	 * 1 に近い zeta 引数に必要な追加精度を見積もる
	 * @param value - 値
	 * @param precision - 精度
	 * @returns 追加精度
	 */
	protected static _zetaPoleCancellationDigits(value: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		const distance = value >= scale ? value - scale : scale - value;
		if (distance === 0n || distance >= scale) return 0n;
		return precision - BigInt(distance.toString().length) + 1n;
	}

	/**
	 * 正の偶数整数に対する zeta 関数を計算する
	 * @param exponent - 偶数整数の指数
	 * @param precision - 精度
	 * @returns zeta(exponent)
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaPositiveEvenInteger(exponent: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		const order = Number(exponent);
		const halfOrder = Number(exponent / 2n);
		const bNumbers = this._getBernoulliNumbers(order, precision);
		const b2n = bNumbers[order];
		const twoPi = 2n * this._pi(precision);
		const power = this._pow(twoPi, exponent * scale, precision);
		let result = (b2n * power) / scale / this._factorial(exponent);
		result /= 2n;
		if (halfOrder % 2 === 0) result = -result;
		return result;
	}

	/**
	 * 負の整数に対する zeta 関数を計算する
	 * @param absoluteInteger - 負の整数の絶対値
	 * @param precision - 精度
	 * @returns zeta(-absoluteInteger)
	 */
	protected static _zetaNegativeInteger(absoluteInteger: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		if (absoluteInteger === 0n) return -scale / 2n;
		if (absoluteInteger % 2n === 0n) return 0n;
		const order = Number(absoluteInteger + 1n);
		const bNumbers = this._getBernoulliNumbers(order, precision);
		return -bNumbers[order] / BigInt(order);
	}

	/**
	 * Euler-Maclaurin 展開で zeta 関数を近似する
	 * @param s - 値
	 * @param precision - 精度
	 * @param terms - 直接和を取る項数
	 * @returns zeta(s) の近似値
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaEulerMaclaurinEstimate(s: bigint, precision: bigint, terms: number): bigint {
		const scale = this._getPow10(precision);
		const results = this._computePowers(s, terms - 1, precision);
		let result = 0n;
		for (let n = 1; n < terms; n++) {
			result += results[n];
		}

		const nValue = BigInt(terms);
		const nScaled = nValue * scale;
		const nPowNegativeS = this._pow(nScaled, -s, precision);
		const nPowOneMinusS = this._pow(nScaled, scale - s, precision);
		result += nPowNegativeS / 2n;
		result += (nPowOneMinusS * scale) / (s - scale);

		// 精度に応じたベルヌーイ項数。項数を増やすことで terms (N) を小さく保つ
		const bernoulliTerms = Math.max(8, Math.ceil(Number(precision) / 4) + 10);
		const bNumbers = this._getBernoulliNumbers(2 * bernoulliTerms, precision);

		const nInv2 = nValue * nValue;
		let rising = s;
		let factorial = 2n;
		let nPow = this._pow(nScaled, -(s + scale), precision);

		for (let k = 1; k <= bernoulliTerms; k++) {
			const b2k = bNumbers[2 * k];
			let correction = b2k / factorial;
			correction = (correction * rising) / scale;
			correction = (correction * nPow) / scale;
			result += correction;
			if (correction === 0n && k > 2) break;

			const factorA = s + BigInt(2 * k - 1) * scale;
			const factorB = s + BigInt(2 * k) * scale;
			rising = (rising * factorA) / scale;
			rising = (rising * factorB) / scale;
			factorial *= BigInt(2 * k + 1) * BigInt(2 * k + 2);
			nPow = nPow / nInv2;
		}
		return result;
	}

	/**
	 * s > 1 に対する zeta 関数を計算する
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s <= 1 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaPositive(s: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		if (s <= scale) {
			throw new RangeError("zeta(s) requires s > 1 in _zetaPositive");
		}
		if (s % scale === 0n) {
			const integerValue = s / scale;
			if (integerValue > 0n && integerValue % 2n === 0n) {
				return this._zetaPositiveEvenInteger(integerValue, precision);
			}
		}

		// N は s と精度 P に依存するが、N ≈ P / (2 * pi) 程度で十分
		let terms = Math.max(16, Math.ceil(Number(precision) / 6) + 12);
		let previous: bigint | null = null;
		let current = 0n;
		for (let attempt = 0; attempt < 6; attempt++) {
			current = this._zetaEulerMaclaurinEstimate(s, precision, terms);
			if (previous !== null) {
				const diff = current >= previous ? current - previous : previous - current;
				// 精度に応じて許容誤差を調整 (10^-precision に対して数ユニット)
				if (diff <= 16n) return current;
			}
			previous = current;
			terms = Math.floor(terms * 1.5);
		}
		return current;
	}

	/**
	 * Dirichlet eta 関数を Euler 変換で計算して zeta 関数へ変換する
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s === 1 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaEta(s: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		const termCount = Math.max(18, Math.ceil(Number(precision) * Math.log2(10)) + 12);
		const powers = this._computePowers(s, termCount + 1, precision);
		const differences = new Array<bigint>(termCount + 1);
		for (let i = 0; i <= termCount; i++) {
			differences[i] = powers[i + 1];
		}

		let eta = 0n;
		let weight = scale / 2n;
		for (let order = 0; order <= termCount && weight !== 0n; order++) {
			eta += (differences[0] * weight) / scale;
			for (let i = 0; i < termCount - order; i++) {
				differences[i] = differences[i] - differences[i + 1];
			}
			weight /= 2n;
		}

		const ln2 = this._ln2(precision, this.config.lnMaxSteps);
		const exponent = ((scale - s) * ln2) / scale;
		const denominator = -this._expm1(exponent, precision);
		if (denominator === 0n) throw new RangeError("zeta(s) has a pole at s = 1");
		return (eta * scale) / denominator;
	}

	/**
	 * Riemann zeta 関数を計算する (内部用)
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s = 1 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zeta(s: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		if (s === scale) throw new RangeError("zeta(s) has a pole at s = 1");
		if (s === 0n) return -scale / 2n;

		if (s % scale === 0n) {
			const integerValue = s / scale;
			if (integerValue < 0n) return this._zetaNegativeInteger(-integerValue, precision);
			if (integerValue > 0n && integerValue % 2n === 0n) {
				return this._zetaPositiveEvenInteger(integerValue, precision);
			}
		}

		if (s > scale) return this._zetaPositive(s, precision);
		if (s > 0n) return this._zetaEta(s, precision);

		const oneMinusS = scale - s;
		const twoPowS = this._pow(2n * scale, s, precision);
		const piPow = this._pow(this._pi(precision), s - scale, precision);
		const sinTerm = this._sinPi(s / 2n, precision);
		const gammaTerm = this._gammaLanczos(oneMinusS, precision);
		const reflected = this._zetaPositive(oneMinusS, precision);
		let result = (twoPowS * piPow) / scale;
		result = (result * sinTerm) / scale;
		result = (result * gammaTerm) / scale;
		result = (result * reflected) / scale;
		return result;
	}

	/**
	 * ガンマ関数をStirlingの近似で計算する (内部用)
	 * @param z - 値
	 * @param precision - 精度
	 * @returns ガンマ関数
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	protected static _gammaLanczos(z: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		const half_scale = scale / 2n;

		// 負の整数およびゼロでの極
		if (z <= 0n && z % scale === 0n) {
			throw new RangeError("z must not be a non-positive integer (pole)");
		}

		// 反転公式: gamma(z) = pi / (sin(pi*z) * gamma(1-z))
		if (z < half_scale) {
			const config = this.config;
			const maxSteps = config.trigFuncsMaxSteps;
			const pi = this._pi(precision);
			const oneMinusZ = scale - z;
			const gammaOneMinusZ = this._gammaLanczos(oneMinusZ, precision);
			const pi_z = (pi * z) / scale;
			const sin_pi_z = this._sin(pi_z, precision, maxSteps);
			const denominator = (sin_pi_z * gammaOneMinusZ) / scale;
			if (denominator === 0n) throw new DivisionByZeroError("division by zero");
			return (pi * scale) / denominator;
		}

		// 引数シフト: gamma(z) = gamma(z+m) / (z * (z+1) * ... * (z+m-1))
		let product = scale;
		let currentZ = z;
		// 精度に応じて閾値を決定
		const threshold = precision * 2n + 50n;
		while (currentZ < threshold * scale) {
			product = (product * currentZ) / scale;
			currentZ += scale;
		}

		// Stirlingの近似 (ln(gamma(z)))
		// ln(gamma(z)) ≈ (z-0.5)ln(z) - z + 0.5ln(2pi) + sum(B_2n / (2n(2n-1)z^(2n-1)))
		const lnZ = this._ln(currentZ, precision, this.config.lnMaxSteps);
		const term1 = ((currentZ - half_scale) * lnZ) / scale;
		const term2 = currentZ;
		const term3 = this._ln2pi(precision) / 2n;

		let sum = 0n;
		const zInv = (scale * scale) / currentZ;
		const zInv2 = (zInv * zInv) / scale;
		let zInvPow = zInv;

		// 精度に応じて項数を決定
		const numTerms = Math.floor(Number(precision) / 6) + 10;
		const bNumbers = this._getBernoulliNumbers(2 * numTerms, precision);

		for (let n = 1; n <= numTerms; n++) {
			const b2n = bNumbers[2 * n];
			const denom = BigInt(2 * n * (2 * n - 1));
			const term = (b2n * zInvPow) / (denom * scale);
			if (term === 0n && n > 1) break;
			sum += term;
			zInvPow = (zInvPow * zInv2) / scale;
		}

		const lnGamma = term1 - term2 + term3 + sum;
		const gammaLarge = this._exp(lnGamma, precision);

		return (gammaLarge * scale) / product;
	}

	/**
	 * ガンマ関数を計算する
	 * @returns ガンマ関数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public gamma(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}

		const totalPr = this._precision + construct.config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._gammaLanczos(val, totalPr);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * Riemann zeta 関数を計算する
	 * @returns zeta(this)
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public zeta(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._makeExactResult(1n);
			return this._specialResult(SpecialValueState.NAN);
		}
		const exactInteger = this._getExactInteger();
		if (exactInteger === 1n) {
			if (construct.config.allowSpecialValues) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			throw new RangeError("zeta(s) has a pole at s = 1");
		}
		if (exactInteger === 0n) return this._makeExactResult(-1n, -1n);

		const currentPrecisionValue = this._getInternalValue(this._precision);
		const extraCancellationDigits = construct._zetaPoleCancellationDigits(currentPrecisionValue, this._precision);
		const totalPr = this._precision + extraCancellationDigits + (construct.config.extraPrecision << 1n);
		const val = this._getInternalValue(totalPr);
		const raw = construct._zeta(val, totalPr);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * 階乗を計算する (内部用)
	 * @param n - 値
	 * @returns 階乗
	 */
	protected static _factorial(n: bigint): bigint {
		let f = 1n;
		for (let i = 2n; i <= n; i++) f *= i;
		return f;
	}

	/**
	 * ガンマ関数を用いた階乗を計算する (内部用)
	 * @param n - 値
	 * @param precision - 精度
	 * @returns 階乗
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	protected static _factorialGamma(n: bigint, precision: bigint): bigint {
		const scale = this._getPow10(precision);
		return this._gammaLanczos(n + scale, precision);
	}

	/**
	 * 階乗を計算する
	 * @returns 階乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	public factorial(): BigFloat {
		const construct = this.constructor as BigFloatConstructor;
		if (!this._isFiniteState()) {
			this._ensureSpecialValuesEnabled(this);
			if (this._specialState === SpecialValueState.POSITIVE_INFINITY) return this._specialResult(SpecialValueState.POSITIVE_INFINITY);
			return this._specialResult(SpecialValueState.NAN);
		}
		const totalPr = this._precision + construct.config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const scale = construct._getPow10(totalPr);
		let raw;
		if (val % scale === 0n && val >= 0n) {
			raw = construct._factorial(val / scale) * scale;
		} else {
			raw = construct._factorialGamma(val, totalPr);
		}
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * 二項係数を計算する (内部用)
	 * @param n - 全体数
	 * @param k - 選択数
	 * @returns 二項係数
	 */
	protected static _binomial(n: bigint, k: bigint): bigint {
		if (k > n) return 0n;
		if (k > n - k) k = n - k;
		let result = 1n;
		for (let i = 1n; i <= k; i++) {
			result = (result * (n - i + 1n)) / i;
		}
		return result;
	}

	// ====================================================================================================
	// * キャッシュ管理
	// ====================================================================================================

	/**
	 * 円周率キャッシュが存在するか確認する (内部用)
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckPiCache(precision: bigint): boolean {
		const cachedData = this._piCache;
		return !!(cachedData && cachedData.precision >= precision);
	}

	/**
	 * 円周率キャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getPiCache(precision: bigint): bigint {
		const cachedData = this._piCache;
		if (cachedData) {
			return this._rescaleInternalValue(cachedData.exactValue, cachedData.precision, precision);
		}
		throw new CacheNotInitializedError("use _getCheckPiCache first");
	}

	/**
	 * 円周率キャッシュを更新する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updatePiCache(value: bigint, precision: bigint): void {
		const cachedData = this._piCache;
		if (cachedData && cachedData.precision >= precision) {
			return;
		}
		this._piCache = { exactValue: value, precision };
	}

	/**
	 * eキャッシュが存在するか確認する (内部用)
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckECache(precision: bigint): boolean {
		const cachedData = this._eCache;
		return !!(cachedData && cachedData.precision >= precision);
	}

	/**
	 * eキャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getECache(precision: bigint): bigint {
		const cachedData = this._eCache;
		if (cachedData) {
			return this._rescaleInternalValue(cachedData.exactValue, cachedData.precision, precision);
		}
		throw new CacheNotInitializedError("use _getCheckECache first");
	}

	/**
	 * eキャッシュを更新する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updateECache(value: bigint, precision: bigint): void {
		const cachedData = this._eCache;
		if (cachedData && cachedData.precision >= precision) {
			return;
		}
		this._eCache = { exactValue: value, precision };
	}

	/**
	 * 円周率の低精度キャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns 低精度キャッシュ
	 */
	protected static _getPiSeedCache(precision: bigint): BigFloatCacheEntry | null {
		const cachedData = this._piCache;
		if (!cachedData || cachedData.precision >= precision) {
			return null;
		}
		return cachedData;
	}

	/**
	 * 対数キャッシュが存在するか確認する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckLnCache(key: string, precision: bigint): boolean {
		const cachedData = this._lnCache[key];
		return !!(cachedData && cachedData.precision >= precision);
	}

	/**
	 * 対数キャッシュを取得する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getLnCache(key: string, precision: bigint): bigint {
		const cachedData = this._lnCache[key];
		if (cachedData) {
			return this._rescaleInternalValue(cachedData.exactValue, cachedData.precision, precision);
		}
		throw new CacheNotInitializedError("use _getCheckLnCache first");
	}

	/**
	 * 対数キャッシュを更新する (内部用)
	 * @param key - キャッシュキー
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updateLnCache(key: string, value: bigint, precision: bigint): void {
		const cachedData = this._lnCache[key];
		if (cachedData && cachedData.precision >= precision) {
			return;
		}
		this._lnCache[key] = { exactValue: value, precision };
	}

	/**
	 * 対数の低精度キャッシュを取得する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns 低精度キャッシュ
	 */
	protected static _getLnSeedCache(key: string, precision: bigint): BigFloatCacheEntry | null {
		const cachedData = this._lnCache[key];
		if (!cachedData || cachedData.precision >= precision) {
			return null;
		}
		return cachedData;
	}

	/**
	 * キャッシュ値を別精度へ変換する
	 * @param value - 値
	 * @param fromPrecision - 元の精度
	 * @param toPrecision - 変換先の精度
	 * @returns 変換後の値
	 */
	protected static _rescaleInternalValue(value: bigint, fromPrecision: bigint, toPrecision: bigint): bigint {
		if (fromPrecision === toPrecision) return value;
		if (fromPrecision < toPrecision) {
			return value * this._getPow10(toPrecision - fromPrecision);
		}
		return this._roundManual(value, this._getPow10(fromPrecision - toPrecision));
	}

	/**
	 * キャッシュされたpiを高精度へ補正する (Newton法を使用)
	 * @param seed - 低精度キャッシュ
	 * @param precision - 必要精度
	 * @returns 高精度化したpi
	 */
	protected static _refinePiFromCache(seed: BigFloatCacheEntry, precision: bigint): bigint {
		let currentPrecision = seed.precision;
		let current = seed.exactValue;

		while (currentPrecision < precision) {
			const grownPrecision = currentPrecision > 0n ? currentPrecision * 2n : 1n;
			const nextPrecision = grownPrecision > precision ? precision : grownPrecision;
			const workPrecision = nextPrecision + this.config.extraPrecision;
			const scale = this._getPow10(workPrecision);
			let estimate = this._rescaleInternalValue(current, currentPrecision, workPrecision);

			for (let i = 0; i < 2; i++) {
				const sinValue = this._sinSeries(estimate, workPrecision, this.config.trigFuncsMaxSteps);
				if (sinValue === 0n) break;
				const cosValue = this._cos(estimate, workPrecision, this.config.trigFuncsMaxSteps);
				const refined = estimate - (sinValue * scale) / cosValue;
				if (refined === estimate) break;
				estimate = refined;
			}

			current = this._rescaleInternalValue(estimate, workPrecision, nextPrecision);
			currentPrecision = nextPrecision;
		}

		return current;
	}

	/**
	 * キャッシュされた対数定数を高精度へ補正する
	 * @param value - 対数を取る対象
	 * @param seed - 低精度キャッシュ
	 * @param precision - 必要精度
	 * @returns 高精度化した対数定数
	 */
	protected static _refineLogConstantFromCache(value: bigint, seed: BigFloatCacheEntry, precision: bigint): bigint {
		let currentPrecision = seed.precision;
		let current = seed.exactValue;

		while (currentPrecision < precision) {
			const grownPrecision = currentPrecision > 0n ? currentPrecision * 2n : 1n;
			const nextPrecision = grownPrecision > precision ? precision : grownPrecision;
			const scale = this._getPow10(nextPrecision);
			const valueAtPrecision = this._rescaleInternalValue(value, precision, nextPrecision);
			let estimate = this._rescaleInternalValue(current, currentPrecision, nextPrecision);

			for (let i = 0; i < 2; i++) {
				const expEstimate = this._exp(estimate, nextPrecision);
				if (expEstimate === 0n) break;
				const refined = estimate - scale + (valueAtPrecision * scale) / expEstimate;
				if (refined === estimate) break;
				estimate = refined;
			}

			current = estimate;
			currentPrecision = nextPrecision;
		}

		return current;
	}

	/**
	 * 5の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 5^n
	 */
	protected static _getPow5(n: bigint): bigint {
		if (n < 0n) return 0n;

		const ni = Number(n);

		let cache = this._pow5Cache;

		for (let i = cache.length; i <= ni; i++) {
			cache[i] = cache[i - 1] * 5n;
		}

		return cache[ni];
	}

	/**
	 * 2の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 2^n
	 */
	protected static _getPow2(n: bigint): bigint {
		if (n < 0n) return 0n;

		const ni = Number(n);

		let cache = this._pow2Cache;

		for (let i = cache.length; i <= ni; i++) {
			cache[i] = cache[i - 1] << 1n;
		}

		return cache[ni];
	}

	/**
	 * 10の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 10^n
	 */
	protected static _getPow10(n: bigint): bigint {
		if (n < 0n) return 0n;
		return this._getPow5(n) << n;
	}

	// ====================================================================================================
	// * 定数オブジェクト
	// ====================================================================================================

	/**
	 * 定数 NaN を取得する
	 * @param precision - 精度
	 * @returns NaN
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	public static nan(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return this._createSpecialValue(SpecialValueState.NAN, BigInt(precision));
	}

	/**
	 * 定数 Infinity を取得する
	 * @param precision - 精度
	 * @returns Infinity
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	public static infinity(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return this._createSpecialValue(SpecialValueState.POSITIVE_INFINITY, BigInt(precision));
	}

	/**
	 * 定数 -Infinity を取得する
	 * @param precision - 精度
	 * @returns -Infinity
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	public static negativeInfinity(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return this._createSpecialValue(SpecialValueState.NEGATIVE_INFINITY, BigInt(precision));
	}

	/**
	 * 定数 -10 を取得する
	 * @param precision - 精度
	 * @returns -10
	 */
	public static minusTen(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(-10, precision);
	}

	/**
	 * 定数 -2 を取得する
	 * @param precision - 精度
	 * @returns -2
	 */
	public static minusTwo(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(-2, precision);
	}

	/**
	 * 定数 -1 を取得する
	 * @param precision - 精度
	 * @returns -1
	 */
	public static minusOne(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(-1, precision);
	}

	/**
	 * 定数 0 を取得する
	 * @param precision - 精度
	 * @returns 0
	 */
	public static zero(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(0, precision);
	}

	/**
	 * 定数 0.25 を取得する
	 * @param precision - 精度
	 * @returns 0.25
	 */
	public static quarter(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this("0.25", precision);
	}

	/**
	 * 定数 0.5 を取得する
	 * @param precision - 精度
	 * @returns 0.5
	 */
	public static half(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this("0.5", precision);
	}

	/**
	 * 定数 1 を取得する
	 * @param precision - 精度
	 * @returns 1
	 */
	public static one(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(1, precision);
	}

	/**
	 * 定数 2 を取得する
	 * @param precision - 精度
	 * @returns 2
	 */
	public static two(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(2, precision);
	}

	/**
	 * 定数 10 を取得する
	 * @param precision - 精度
	 * @returns 10
	 */
	public static ten(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(10, precision);
	}

	/**
	 * 定数 100 を取得する
	 * @param precision - 精度
	 * @returns 100
	 */
	public static hundred(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(100, precision);
	}

	/**
	 * 定数 1000 を取得する
	 * @param precision - 精度
	 * @returns 1000
	 */
	public static thousand(precision: PrecisionValue = this.DEFAULT_PRECISION): BigFloat {
		return new this(1000, precision);
	}
}

/**
 * BigFloat を作成する
 * @param value - 初期値
 * @param precision - 精度
 * @returns BigFloat インスタンス
 */
export function bigFloat(value: BigFloatValue, precision?: PrecisionValue): BigFloat {
	return new BigFloat(value, precision);
}
