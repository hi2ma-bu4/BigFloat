import { PiAlgorithm, RoundingMode, type BigFloatOptions } from "./types";

/**
 * BigFloat settings
 */
export class BigFloatConfig {
	/** 精度の不一致を許容するかどうか */
	public allowPrecisionMismatch: boolean;
	/** 破壊的な計算(自身の上書き)をするかどうか */
	public mutateResult: boolean;
	/** 丸めモード */
	public roundingMode: RoundingMode;
	/** 計算時に追加する精度 */
	public extraPrecision: bigint;
	/** 円周率の計算アルゴリズム */
	public piAlgorithm: PiAlgorithm;
	/** 三角関数の最大ステップ数 */
	public trigFuncsMaxSteps: bigint;
	/** 対数計算の最大ステップ数 */
	public lnMaxSteps: bigint;

	/**
	 * @param options - 設定オプション
	 */
	public constructor({ allowPrecisionMismatch = false, mutateResult = false, roundingMode = RoundingMode.TRUNCATE, extraPrecision = 2n, piAlgorithm = PiAlgorithm.CHUDNOVSKY, trigFuncsMaxSteps = 5000n, lnMaxSteps = 10000n }: BigFloatOptions = {}) {
		this.allowPrecisionMismatch = allowPrecisionMismatch;
		this.mutateResult = mutateResult;
		this.roundingMode = roundingMode;
		this.extraPrecision = extraPrecision;
		this.piAlgorithm = piAlgorithm;
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
			mutateResult: this.mutateResult,
			roundingMode: this.roundingMode,
			extraPrecision: this.extraPrecision,
			piAlgorithm: this.piAlgorithm,
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

	/** 設定 */
	public static config = new BigFloatConfig();

	/** キャッシュ */
	private static _cached: Record<string, { value: bigint; precision: bigint; priority: number }> = {};

	/** 内部的な値 (mantissa × 2^exp2 × 5^exp5) */
	public mantissa: bigint = 0n;
	/** 2の指数 */
	public _exp2: bigint = 0n;
	/** 5の指数 */
	public _exp5: bigint = 0n;

	/** 2の指数を取得する */
	public exponent2(): bigint {
		return this._exp2;
	}

	/** 5の指数を取得する */
	public exponent5(): bigint {
		return this._exp5;
	}
	/** 精度 (小数点以下の最大桁数) */
	public _precision: bigint = 20n;

	/**
	 * @param value - 初期値
	 * @param precision - 精度
	 * @throws {RangeError} 精度が不正な場合
	 */
	public constructor(value?: string | number | bigint | BigFloat, precision: number | bigint = 20n) {
		if (value instanceof BigFloat) {
			this.mantissa = value.mantissa;
			this._exp2 = value._exp2;
			this._exp5 = value._exp5;
			this._precision = value._precision;
			return;
		}

		this._precision = BigInt(precision);
		(this.constructor as typeof BigFloat)._checkPrecision(this._precision);

		if (value === undefined || value === null || value === "") {
			this.mantissa = 0n;
			this._exp2 = 0n;
			this._exp5 = 0n;
			return;
		}

		const { intPart, fracPart, sign } = this._parse(value.toString());
		// value = (intPart + fracPart/10^fracPart.length) * sign
		// = (intPart * 10^len + fracPart) / 10^len * sign
		const len = BigInt(fracPart.length);
		this.mantissa = BigInt(intPart + fracPart) * BigInt(sign);
		this._exp2 = -len;
		this._exp5 = -len;

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
	public static clone(): typeof BigFloat {
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
		const instance = new (this.constructor as any)();
		instance._precision = this._precision;
		instance.mantissa = this.mantissa;
		instance._exp2 = this._exp2;
		instance._exp5 = this._exp5;
		return instance;
	}

	/**
	 * ソフト正規化 (2の累乗を外に出す。bit演算で高速)
	 */
	public softNormalize(): void {
		if (this.mantissa === 0n) {
			this._exp2 = 0n;
			this._exp5 = 0n;
			return;
		}
		let m = this.mantissa;
		if (m < 0n) m = -m;
		// 2で割れるだけ割る
		while (m > 0n && (m & 1n) === 0n) {
			m >>= 1n;
			this.mantissa >>= 1n;
			this._exp2++;
		}
	}

	/**
	 * レイジー正規化 (5の累乗も外に出す)
	 */
	public lazyNormalize(): void {
		this.softNormalize();
		if (this.mantissa === 0n) return;
		let m = this.mantissa;
		if (m < 0n) m = -m;
		while (m > 0n && m % 5n === 0n) {
			m /= 5n;
			this.mantissa /= 5n;
			this._exp5++;
		}
	}

	/**
	 * 指定された精度に丸める
	 * @param precision - 精度 (省略時は自身の _precision)
	 */
	protected _applyPrecision(precision = this._precision): void {
		if (this.mantissa === 0n) {
			this._exp2 = 0n;
			this._exp5 = 0n;
			return;
		}
		// 10^-precision = 2^-precision * 5^-precision
		// 現在の値: mantissa * 2^exp2 * 5^exp5
		// 目標精度と比較して、足りない分を削る

		const diff2 = precision + this._exp2;
		const diff5 = precision + this._exp5;

		// 10^-precision より細かい精度を持っている場合 (exp < -precision)
		// 10^-precision に合わせるためには、10^(exp + precision) 倍して丸めて、10^-precision にする
		// ここでは exp2 と exp5 がバラバラなので、
		// 共通のスケール 10^X = 2^X * 5^X に合わせる必要があるかもしれないが、
		// 実際には 10^-precision の形に落とし込むのが toString 等で楽。

		// 簡易的に、10^-precision の精度に丸めるロジック:
		// 現在の値 V = M * 2^e2 * 5^e5
		// 目標精度 P の値 V' = round(V * 10^P) / 10^P
		// V * 10^P = M * 2^e2 * 5^e5 * 2^P * 5^P = M * 2^(e2+P) * 5^(e5+P)

		let e2p = this._exp2 + precision;
		let e5p = this._exp5 + precision;

		if (e2p >= 0n && e5p >= 0n) {
			// 既に目標精度より粗いので何もしない (あるいは正規化で綺麗にするだけ)
			return;
		}

		// 丸めが必要
		let scaledMantissa = this.mantissa;
		if (e2p < 0n) {
			// e2pが負なので、その分 2^|e2p| で割る必要がある
		} else if (e2p > 0n) {
			scaledMantissa <<= e2p;
			e2p = 0n;
		}
		if (e5p < 0n) {
			// e5pが負なので、その分 5^|e5p| で割る必要がある
		} else if (e5p > 0n) {
			scaledMantissa *= 5n ** e5p;
			e5p = 0n;
		}

		// scaledMantissa * 2^e2p * 5^e5p を整数に丸める (e2p, e5p <= 0)
		const div2 = 2n ** BigInt(-e2p);
		const div5 = 5n ** BigInt(-e5p);
		const divisor = div2 * div5;

		if (divisor > 1n) {
			this.mantissa = (this.constructor as typeof BigFloat)._roundManual(scaledMantissa, divisor);
			this._exp2 = -precision;
			this._exp5 = -precision;
		}
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
		const half = divisor / 2n;
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
				if (absRem >= half) offset = isNeg ? -1n : 1n;
				break;
			case RoundingMode.HALF_DOWN:
				if (absRem > half) offset = isNeg ? -1n : 1n;
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
	 * @throws {Error} 不正な文字が含まれている場合
	 */
	public static parseFloat(str: string | number | bigint | BigFloat, precision: number | bigint = 20n, base = 10): BigFloat {
		if (str instanceof BigFloat) return str.clone();
		if (typeof str !== "string") str = String(str);
		if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
		if (base === 10) return new this(str, precision);

		const [rawInt, rawFrac = ""] = str.toLowerCase().replace(/^\+/, "").split(".");
		const sign = str.trim().startsWith("-") ? -1n : 1n;
		const digits = "0123456789abcdefghijklmnopqrstuvwxyz";

		const toDigit = (ch: string) => {
			const d = digits.indexOf(ch);
			if (d < 0 || d >= base) throw new Error(`Invalid digit '${ch}' for base ${base}`);
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
		let res = new this(intVal * sign, precision);
		let currentBase = bigBase;
		for (let i = 0; i < rawFrac.length; i++) {
			const d = toDigit(rawFrac[i]);
			if (d !== 0n) {
				const part = new this(d * sign, precision).div(currentBase.toString());
				res = res.add(part);
			}
			currentBase *= bigBase;
		}

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
	 * 引数を正規化する
	 * @param args - 引数リスト
	 * @returns 正規化された引数リスト
	 */
	protected static _normalizeArgs(args: any[]): any[] {
		if (args.length === 1 && Array.isArray(args[0])) {
			return args[0];
		}
		return args;
	}

	/**
	 * 精度を合わせる
	 * @param other - 合わせる対象
	 * @returns [BigFloatA, BigFloatB] (クローンされた、アラインメント済みのインスタンス)
	 * @throws {Error} 精度の不一致が許容されていない場合
	 */
	protected _align(other: BigFloat | number | string | bigint): [BigFloat, BigFloat] {
		const bfB = other instanceof BigFloat ? other : new (this.constructor as any)(other, this._precision);
		const config = (this.constructor as typeof BigFloat).config;
		if (this._precision !== bfB._precision && !config.allowPrecisionMismatch) {
			// 同精度のテンポラリを作成して計算を続行
			if (this._precision > bfB._precision) {
				bfB.changePrecision(this._precision);
			} else {
				this.changePrecision(bfB._precision);
			}
		}

		const resA = this.clone();
		const resB = bfB.clone();

		if (resA._exp2 === resB._exp2 && resA._exp5 === resB._exp5) {
			return [resA, resB];
		}

		const minExp2 = resA._exp2 < resB._exp2 ? resA._exp2 : resB._exp2;
		const minExp5 = resA._exp5 < resB._exp5 ? resA._exp5 : resB._exp5;

		if (resA._exp2 > minExp2) {
			resA.mantissa <<= BigInt(resA._exp2 - minExp2);
			resA._exp2 = minExp2;
		} else if (resB._exp2 > minExp2) {
			resB.mantissa <<= BigInt(resB._exp2 - minExp2);
			resB._exp2 = minExp2;
		}

		if (resA._exp5 > minExp5) {
			resA.mantissa *= 5n ** BigInt(resA._exp5 - minExp5);
			resA._exp5 = minExp5;
		} else if (resB._exp5 > minExp5) {
			resB.mantissa *= 5n ** BigInt(resB._exp5 - minExp5);
			resB._exp5 = minExp5;
		}

		return [resA, resB];
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
		const construct = this.constructor as typeof BigFloat;
		const res = construct._makeResult(val, precision, valPrecision);
		return this._makeResultFromInstance(res);
	}

	/**
	 * 精度をチェックする
	 * @param precision - チェックする精度
	 * @throws {RangeError} 精度が範囲外の場合
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
	 */
	public changePrecision(precision: number | bigint): this {
		const precisionBig = BigInt(precision);
		this._precision = precisionBig;
		this._applyPrecision();
		return this;
	}

	/**
	 * どこまで精度が一致しているかを判定する
	 * @param other - 比較対象
	 * @returns 一致している桁数
	 */
	public matchingPrecision(other: BigFloat | number | string | bigint): bigint {
		const bfB = other instanceof BigFloat ? other : new BigFloat(other, this._precision);
		const diff = this.sub(bfB).abs();
		const maxP = this._precision > bfB._precision ? this._precision : bfB._precision;
		if (diff.isZero()) return maxP;

		let matched = 0n;
		// 10^-p
		for (let p = 1n; p <= maxP; p++) {
			// diff < 10^-p <=> diff * 10^p < 1
			const check = diff.mul(10n ** p);
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
	 * @returns 比較結果 (-1, 0, 1)
	 */
	public compare(other: BigFloat | number | string | bigint): number {
		const [a, b] = this._align(other);
		if (a.mantissa < b.mantissa) return -1;
		if (a.mantissa > b.mantissa) return 1;
		return 0;
	}

	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 */
	public eq(other: BigFloat | number | string | bigint): boolean {
		return this.compare(other) === 0;
	}

	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 */
	public equals(other: BigFloat | number | string | bigint): boolean {
		return this.compare(other) === 0;
	}

	/**
	 * 等しくないかどうかを判定する (!=)
	 * @param other - 比較対象
	 * @returns 等しくない場合はtrue
	 */
	public ne(other: BigFloat | number | string | bigint): boolean {
		return this.compare(other) !== 0;
	}

	/**
	 * より小さいかどうかを判定する (<)
	 * @param other - 比較対象
	 * @returns より小さい場合はtrue
	 */
	public lt(other: BigFloat | number | string | bigint): boolean {
		return this.compare(other) === -1;
	}

	/**
	 * 以下かどうかを判定する (<=)
	 * @param other - 比較対象
	 * @returns 以下の場合はtrue
	 */
	public lte(other: BigFloat | number | string | bigint): boolean {
		return this.compare(other) <= 0;
	}

	/**
	 * より大きいかどうかを判定する (>)
	 * @param other - 比較対象
	 * @returns より大きい場合はtrue
	 */
	public gt(other: BigFloat | number | string | bigint): boolean {
		return this.compare(other) === 1;
	}

	/**
	 * 以上かどうかを判定する (>=)
	 * @param other - 比較対象
	 * @returns 以上の場合はtrue
	 */
	public gte(other: BigFloat | number | string | bigint): boolean {
		return this.compare(other) >= 0;
	}

	/**
	 * ゼロかどうかを判定する
	 * @returns ゼロの場合はtrue
	 */
	public isZero(): boolean {
		return this.mantissa === 0n;
	}

	/**
	 * 正の数かどうかを判定する
	 * @returns 正の数の場合はtrue
	 */
	public isPositive(): boolean {
		return this.mantissa > 0n;
	}

	/**
	 * 負の数かどうかを判定する
	 * @returns 負の数の場合はtrue
	 */
	public isNegative(): boolean {
		return this.mantissa < 0n;
	}

	/**
	 * 相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 */
	public relativeDiff(other: BigFloat | number | string | bigint): BigFloat {
		const diff = this.absoluteDiff(other);
		const absA = this.abs();
		const absB = (other instanceof BigFloat ? other : new BigFloat(other, this._precision)).abs();
		const denominator = absA.gt(absB) ? absA : absB;
		if (denominator.isZero()) return new BigFloat(0n, this._precision);
		return diff.div(denominator);
	}

	/**
	 * 絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差
	 */
	public absoluteDiff(other: BigFloat | number | string | bigint): BigFloat {
		const [a, b] = this._align(other);
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
	 */
	public percentDiff(other: BigFloat | number | string | bigint): BigFloat {
		const diff = this.absoluteDiff(other);
		const absB = (other instanceof BigFloat ? other : new BigFloat(other, this._precision)).abs();
		if (absB.isZero()) return new BigFloat(0n, this._precision);
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
	 */
	public toString(base = 10, precision: number | bigint = this._precision): string {
		if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");

		const prec = BigInt(precision);
		const temp = this.clone();
		temp.lazyNormalize();
		temp._applyPrecision(prec);
		temp.lazyNormalize();

		const sign = temp.mantissa < 0n ? "-" : "";
		let m = temp.mantissa < 0n ? -temp.mantissa : temp.mantissa;

		// 10^P 倍して整数にする
		// V = M * 2^E2 * 5^E5
		// V * 10^P = M * 2^(E2+P) * 5^(E5+P)
		let e2 = temp._exp2 + prec;
		let e5 = temp._exp5 + prec;
		if (e2 > 0n) m <<= e2;
		if (e5 > 0n) m *= 5n ** e5;

		const div2 = e2 < 0n ? 2n ** -e2 : 1n;
		const div5 = e5 < 0n ? 5n ** -e5 : 1n;
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
	 */
	public toJSON(): string {
		const config = (this.constructor as typeof BigFloat).config;
		let bf: BigFloat = this;
		if (config.mutateResult) bf = bf.clone();
		return bf.toString();
	}

	/**
	 * Number型に変換する
	 * @returns 変換された数値
	 */
	public toNumber(): number {
		// V = M * 2^E2 * 5^E5
		return Number(this.mantissa) * Math.pow(2, Number(this._exp2)) * Math.pow(5, Number(this._exp5));
	}

	/**
	 * 指定した桁数で固定した文字列を取得する
	 * @param digits - 小数点以下の桁数
	 * @returns 固定小数点形式の文字列
	 */
	public toFixed(digits: number | bigint): string {
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
	 * @throws {RangeError} digitsが不正な場合
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
	public add(other: BigFloat | number | string | bigint): BigFloat {
		const [a, b] = this._align(other);
		a.mantissa += b.mantissa;
		a.softNormalize();
		a._applyPrecision();
		return this._makeResultFromInstance(a);
	}

	/**
	 * 減算する (-)
	 * @param other - 減算する値
	 * @returns 減算結果
	 */
	public sub(other: BigFloat | number | string | bigint): BigFloat {
		const [a, b] = this._align(other);
		a.mantissa -= b.mantissa;
		a.softNormalize();
		a._applyPrecision();
		return this._makeResultFromInstance(a);
	}

	/**
	 * 乗算する (*)
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 */
	public mul(other: BigFloat | number | string | bigint): BigFloat {
		if (!(other instanceof BigFloat)) {
			other = new (this.constructor as any)(other, this._precision);
		}
		const bfB = other as BigFloat;
		const res = this.clone();
		res._precision = this._precision > bfB._precision ? this._precision : bfB._precision;
		res.mantissa *= bfB.mantissa;
		res._exp2 += bfB._exp2;
		res._exp5 += bfB._exp5;
		res.softNormalize();
		res._applyPrecision();
		return this._makeResultFromInstance(res);
	}

	/**
	 * 除算する (/)
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @throws {Error} ゼロ除算の場合
	 */
	public div(other: BigFloat | number | string | bigint): BigFloat {
		if (!(other instanceof BigFloat)) {
			other = new (this.constructor as any)(other, this._precision);
		}
		const bfB = other as BigFloat;
		if (bfB.mantissa === 0n) throw new Error("Division by zero");

		const res = this.clone();
		res._precision = this._precision > bfB._precision ? this._precision : bfB._precision;

		// V = (Ma * 2^E2a * 5^E5a) / (Mb * 2^E2b * 5^E5b)
		// = (Ma / Mb) * 2^(E2a - E2b) * 5^(E5a - E5b)
		// 精度 P まで求めるためには、10^P = 2^P * 5^P 倍して丸める
		// (Ma * 2^(E2a - E2b + P) * 5^(E5a - E5b + P) / Mb) / 10^P

		const targetP = res._precision + 10n;
		const e2 = res._exp2 - bfB._exp2 + targetP;
		const e5 = res._exp5 - bfB._exp5 + targetP;

		let m = res.mantissa;
		if (e2 > 0n) m <<= e2;
		if (e5 > 0n) m *= 5n ** e5;

		const div2 = e2 < 0n ? 2n ** -e2 : 1n;
		const div5 = e5 < 0n ? 5n ** -e5 : 1n;
		const divisor = bfB.mantissa * div2 * div5;

		res.mantissa = (this.constructor as typeof BigFloat)._roundManual(m, divisor);
		res._exp2 = -targetP;
		res._exp5 = -targetP;

		res.softNormalize();
		res._applyPrecision(res._precision);
		return this._makeResultFromInstance(res);
	}

	/**
	 * インスタンスから結果を作成する
	 * @param instance - 結果の元となるインスタンス
	 * @returns 結果のインスタンス
	 */
	protected _makeResultFromInstance(instance: BigFloat): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		if (construct.config.mutateResult) {
			this.mantissa = instance.mantissa;
			this._exp2 = instance._exp2;
			this._exp5 = instance._exp5;
			this._precision = instance._precision;
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
		const temp = this.clone();
		temp._applyPrecision(precision);
		let m = temp.mantissa;
		let e2 = temp._exp2 + precision;
		let e5 = temp._exp5 + precision;
		if (e2 > 0n) m <<= e2;
		if (e5 > 0n) m *= 5n ** e5;
		const div2 = e2 < 0n ? 2n ** -e2 : 1n;
		const div5 = e5 < 0n ? 5n ** -e5 : 1n;
		return m / (div2 * div5);
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
	public mod(other: BigFloat | number | string | bigint): BigFloat {
		const [a, b] = this._align(other);
		const result = (this.constructor as typeof BigFloat)._mod(a.mantissa, b.mantissa);
		const res = a.clone();
		res.mantissa = result;
		res.softNormalize();
		res._applyPrecision();
		return this._makeResultFromInstance(res);
	}

	/**
	 * 符号を反転させる
	 * @returns 符号が反転した結果
	 */
	public neg(): BigFloat {
		const res = this.clone();
		res.mantissa = -res.mantissa;
		return this._makeResultFromInstance(res);
	}

	/**
	 * 絶対値を取得する
	 * @returns 絶対値
	 */
	public abs(): BigFloat {
		const res = this.clone();
		res.mantissa = res.mantissa < 0n ? -res.mantissa : res.mantissa;
		return this._makeResultFromInstance(res);
	}

	/**
	 * 逆数を取得する
	 * @returns 逆数
	 * @throws {Error} ゼロの場合
	 */
	public reciprocal(): BigFloat {
		return new BigFloat(1n, this._precision).div(this);
	}

	/**
	 * 床関数 (負の無限大方向への丸め)
	 * @returns 丸められた結果
	 */
	public floor(): BigFloat {
		const temp = this.clone();
		temp._applyPrecision(0n); // 丸めモードの影響を受けるので注意
		// 常に FLOOR モードで丸める必要がある
		const originalMode = (this.constructor as typeof BigFloat).config.roundingMode;
		(this.constructor as typeof BigFloat).config.roundingMode = RoundingMode.FLOOR;
		temp._applyPrecision(0n);
		(this.constructor as typeof BigFloat).config.roundingMode = originalMode;
		return this._makeResultFromInstance(temp);
	}

	/**
	 * 天井関数 (正の無限大方向への丸め)
	 * @returns 丸められた結果
	 */
	public ceil(): BigFloat {
		const temp = this.clone();
		const originalMode = (this.constructor as typeof BigFloat).config.roundingMode;
		(this.constructor as typeof BigFloat).config.roundingMode = RoundingMode.CEIL;
		temp._applyPrecision(0n);
		(this.constructor as typeof BigFloat).config.roundingMode = originalMode;
		return this._makeResultFromInstance(temp);
	}

	/**
	 * 四捨五入する
	 * @returns 四捨五入された結果
	 */
	public round(): BigFloat {
		const temp = this.clone();
		const originalMode = (this.constructor as typeof BigFloat).config.roundingMode;
		(this.constructor as typeof BigFloat).config.roundingMode = RoundingMode.HALF_UP;
		temp._applyPrecision(0n);
		(this.constructor as typeof BigFloat).config.roundingMode = originalMode;
		return this._makeResultFromInstance(temp);
	}

	/**
	 * 0に近い方向へ切り捨てる
	 * @returns 切り捨てられた結果
	 */
	public trunc(): BigFloat {
		const temp = this.clone();
		const originalMode = (this.constructor as typeof BigFloat).config.roundingMode;
		(this.constructor as typeof BigFloat).config.roundingMode = RoundingMode.TRUNCATE;
		temp._applyPrecision(0n);
		(this.constructor as typeof BigFloat).config.roundingMode = originalMode;
		return this._makeResultFromInstance(temp);
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
	 * @throws {Error} ゼロ除算が発生した場合
	 */
	protected static _pow(base: bigint, exponent: bigint, precision: bigint): bigint {
		const scale = 10n ** precision;
		if (exponent === 0n) return scale;
		if (base === 0n) return 0n;
		if (exponent < 0n) {
			const positivePow = this._pow(base, -exponent, precision);
			if (positivePow === 0n) throw new Error("Division by zero in power function");
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
	 */
	public pow(exponent: BigFloat | number | string | bigint): BigFloat {
		const bfB = exponent instanceof BigFloat ? exponent : new BigFloat(exponent, this._precision);
		const construct = this.constructor as typeof BigFloat;

		// 整数指数チェック
		if (bfB.isZero()) return new BigFloat(1, this._precision);
		if (bfB._exp2 >= 0n && bfB._exp5 >= 0n) {
			// 指数は整数
			let expVal = bfB.mantissa;
			if (bfB._exp2 > 0n) expVal <<= bfB._exp2;
			if (bfB._exp5 > 0n) expVal *= 5n ** bfB._exp5;

			if (expVal > 0n) {
				let res = new BigFloat(1, this._precision);
				let base = this.clone();
				let e = expVal;
				while (e > 0n) {
					if (e & 1n) res = res.mul(base);
					base = base.mul(base);
					e >>= 1n;
				}
				return res;
			} else {
				return new BigFloat(1, this._precision).div(this.pow(-expVal));
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
	 * @throws {Error} 負の数の平方根を計算しようとした場合
	 */
	protected static _sqrt(n: bigint, precision: bigint): bigint {
		if (n < 0n) throw new Error("Cannot compute square root of negative number");
		if (n === 0n) return 0n;

		const scale = 10n ** precision;
		const nScaled = n * scale;
		const TWO = 2n;

		let x = nScaled;
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
	 */
	public sqrt(): BigFloat {
		if (this.mantissa < 0n) throw new Error("Cannot compute square root of negative number");
		if (this.mantissa === 0n) return new BigFloat(0n, this._precision);

		const res = this.clone();
		// V = M * 2^E2 * 5^E5
		// sqrt(V) = sqrt(M) * 2^(E2/2) * 5^(E5/2)
		// 精度 P まで求める
		const targetP = res._precision;
		// V * 10^(2P) / 10^P
		let m = res.mantissa;
		const extra = 20n;
		let e2 = res._exp2 + 2n * targetP + extra;
		let e5 = res._exp5 + 2n * targetP + extra;

		if (e2 > 0n) m <<= e2;
		if (e5 > 0n) m *= 5n ** e5;

		const div2 = e2 < 0n ? 2n ** -e2 : 1n;
		const div5 = e5 < 0n ? 5n ** -e5 : 1n;
		const divisor = div2 * div5;

		// 整数化は不要。10^(2P) 倍した状態でニュートン法
		// V = M * 2^E2 * 5^E5
		// 目標: sqrt(V) * 10^P = sqrt(V * 10^(2P))
		// V * 10^(2P) = M * 2^(E2+2P) * 5^(E5+2P)
		let valForSqrt = res.mantissa;
		let e2s = res._exp2 + 2n * targetP;
		let e5s = res._exp5 + 2n * targetP;
		if (e2s > 0n) valForSqrt <<= BigInt(e2s);
		if (e5s > 0n) valForSqrt *= 5n ** BigInt(e5s);
		if (e2s < 0n) valForSqrt /= 2n ** BigInt(-e2s);
		if (e5s < 0n) valForSqrt /= 5n ** BigInt(-e5s);

		// Newton method for integer sqrt
		let x = 0n;
		if (valForSqrt > 0n) {
			let bits = 0n;
			let tmpM = valForSqrt;
			while (tmpM > 0n) {
				tmpM >>= 1n;
				bits++;
			}
			x = 1n << (bits / 2n + 1n);
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
		return this._makeResultFromInstance(res);
	}

	/**
	 * 立方根を計算する
	 * @returns 立方根
	 */
	public cbrt(): BigFloat {
		return this.nthRoot(3n);
	}

	/**
	 * n乗根を計算する (内部用)
	 * @param v - 値
	 * @param n - 指数
	 * @param precision - 精度
	 * @returns n乗根
	 * @throws {Error} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	protected static _nthRoot(v: bigint, n: bigint, precision: bigint): bigint {
		if (n <= 0n) {
			throw new Error("n must be a positive integer");
		}
		if (v < 0n) {
			if (n % 2n === 0n) {
				throw new Error("Even root of negative number is not real");
			}
			return -this._nthRoot(-v, n, precision);
		}
		const scale = 10n ** precision;

		let x = scale;
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
	 */
	public nthRoot(n: number | bigint): BigFloat {
		const bn = BigInt(n);
		if (bn <= 0n) throw new Error("n must be a positive integer");
		if (this.mantissa < 0n && bn % 2n === 0n) throw new Error("Even root of negative number");

		const res = this.clone();
		const targetP = res._precision;
		// V * 10^(nP) / 10^P
		let m = res.mantissa;
		let e2 = res._exp2 + bn * targetP;
		let e5 = res._exp5 + bn * targetP;
		if (e2 > 0n) m <<= e2;
		if (e5 > 0n) m *= 5n ** e5;
		const div2 = e2 < 0n ? 2n ** -e2 : 1n;
		const div5 = e5 < 0n ? 5n ** -e5 : 1n;
		const divisor = div2 * div5;
		m /= divisor;

		// nth root using Newton method: x_{k+1} = 1/n * ((n-1)x_k + m/x_k^{n-1})
		let x = m > 0n ? (m > 1n ? m / bn : 1n) : 0n;
		if (m < 0n) x = -(-m / bn);

		if (x !== 0n) {
			let lastX;
			while (true) {
				lastX = x;
				let xPow = 1n;
				for (let i = 0n; i < bn - 1n; i++) xPow *= x;
				x = ((bn - 1n) * x + m / xPow) / bn;
				if (x === lastX || (x > lastX ? x - lastX : lastX - x) < 1n) break;
			}
		}

		res.mantissa = x;
		res._exp2 = -targetP;
		res._exp5 = -targetP;
		res.softNormalize();
		res._applyPrecision();
		return this._makeResultFromInstance(res);
	}

	/**
	 * 末尾のゼロを削除して精度を最適化する
	 * @returns 最適化されたインスタンス
	 */
	public scale(): BigFloat {
		const res = this.clone();
		res.lazyNormalize();
		return res;
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
	 */
	protected static _sin(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = 10n ** precision;

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
		let x2 = (x * x) / scale;
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
	 * 正弦(sin)を計算する
	 * @returns 正弦
	 */
	public sin(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._sin(val, totalPr, maxSteps);
		const resBF = new BigFloat();
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
		const scale = 10n ** precision;

		let term = scale;
		let result = term;
		let x2 = (x * x) / scale;
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
	 */
	public cos(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._cos(val, totalPr, maxSteps);
		const resBF = new BigFloat();
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
	 * @throws {Error} 正接が定義されない点の場合
	 */
	protected static _tan(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const cosX = this._cos(x, precision, maxSteps);
		const EPSILON = 10n ** (precision - 4n);
		if (cosX === 0n || (cosX > -EPSILON && cosX < EPSILON)) throw new Error("tan(x) is undefined or numerically unstable at this point");
		const sinX = this._sin(x, precision, maxSteps);
		const scale = 10n ** precision;
		return (sinX * scale) / cosX;
	}

	/**
	 * 正接(tan)を計算する
	 * @returns 正接
	 */
	public tan(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._tan(val, totalPr, maxSteps);
		const resBF = new BigFloat();
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
	 * @throws {Error} 入力が範囲外([-1, 1])の場合
	 */
	protected static _asin(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = 10n ** precision;
		if (x > scale || x < -scale) throw new Error("asin input out of range [-1,1]");

		const halfPi = this._pi(precision) / 2n;
		const initial = (x * halfPi) / scale;

		const f = (theta: bigint) => this._sin(theta, precision, maxSteps) - x;
		const df = (theta: bigint) => this._cos(theta, precision, maxSteps);
		return this._trigFuncsNewton(f, df, initial, precision, Number(maxSteps));
	}

	/**
	 * 逆正弦(asin)を計算する
	 * @returns 角度(ラジアン)
	 */
	public asin(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._asin(val, totalPr, maxSteps);
		const resBF = new BigFloat();
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
	 */
	protected static _acos(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const halfPi = this._pi(precision) / 2n;
		const asinX = this._asin(x, precision, maxSteps);
		return halfPi - asinX;
	}

	/**
	 * 逆余弦(acos)を計算する
	 * @returns 角度(ラジアン)
	 */
	public acos(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._acos(val, totalPr, maxSteps);
		const resBF = new BigFloat();
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
	 */
	protected static _atan(x: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = 10n ** precision;
		const absX = x < 0n ? -x : x;

		if (absX <= scale) {
			const f = (theta: bigint) => this._tan(theta, precision, maxSteps) - x;
			const df = (theta: bigint) => {
				const cosTheta = this._cos(theta, precision, maxSteps);
				if (cosTheta === 0n) throw new Error("Derivative undefined");
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
	 */
	public atan(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);

		const result = construct._atan(val, totalPr, maxSteps);
		const resBF = new BigFloat();
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
	 */
	protected static _atan2(y: bigint, x: bigint, precision: bigint, maxSteps: bigint): bigint {
		if (x === 0n) {
			if (y > 0n) return this._pi(precision) / 2n;
			if (y < 0n) return -this._pi(precision) / 2n;
			return 0n;
		}

		const scale = 10n ** precision;
		const angle = this._atan((y * scale) / x, precision, maxSteps);

		if (x > 0n) return angle;
		if (y >= 0n) return angle + this._pi(precision);
		return angle - this._pi(precision);
	}

	/**
	 * 2引数の逆正接(atan2)を計算する
	 * @param x - x座標
	 * @returns 角度(ラジアン)
	 */
	public atan2(x: BigFloat | number | string | bigint): BigFloat {
		const bfB = x instanceof BigFloat ? x : new BigFloat(x, this._precision);
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;

		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const valA = this._getInternalValue(totalPr);
		const valB = bfB._getInternalValue(totalPr);

		const result = construct._atan2(valA, valB, totalPr, maxSteps);
		const resBF = new BigFloat();
		resBF._precision = this._precision;
		resBF.mantissa = result;
		resBF._exp2 = -totalPr;
		resBF._exp5 = -totalPr;
		resBF.softNormalize();
		resBF._applyPrecision();
		return this._makeResultFromInstance(resBF);
	}

	/**
	 * マチン(Machin)の公式用のatan計算 (内部用)
	 * @param invX - 1/xのx
	 * @param precision - 精度
	 * @returns atan(1/x)
	 */
	protected static _atanMachine(invX: bigint, precision: bigint): bigint {
		const scale = 10n ** precision;
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
	 * @throws {Error} 導関数がゼロになった場合
	 */
	protected static _trigFuncsNewton(f: (x: bigint) => bigint, df: (x: bigint) => bigint, initial: bigint, precision: bigint, maxSteps = 50): bigint {
		const scale = 10n ** precision;
		let x = initial;
		for (let i = 0; i < maxSteps; i++) {
			const fx = f(x);
			if (fx === 0n) break;
			const dfx = df(x);
			if (dfx === 0n) throw new Error("Derivative zero during Newton iteration");
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
	 */
	protected static _sinPi(z: bigint, precision: bigint): bigint {
		const pi = this._pi(precision);
		const scale = 10n ** precision;
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
		const scale = 10n ** precision;
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
	 */
	public exp(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
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
	 */
	protected static _exp2(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const LN2 = this._ln2(precision, maxSteps);
		const scale = 10n ** precision;
		return this._exp((LN2 * value) / scale, precision);
	}

	/**
	 * 2の冪乗(2^x)を計算する
	 * @returns 2^x
	 */
	public exp2(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.lnMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
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
		const scale = 10n ** precision;
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
	 */
	public expm1(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
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
	 * @throws {Error} 値が0以下の場合
	 */
	protected static _ln(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		if (value <= 0n) throw new Error("ln(x) is undefined for x <= 0");
		const scale = 10n ** precision;
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
		// Use more bits for ln scaling if needed, but let's try increasing precision first
		const z = ((x - scale) * scale) / (x + scale);
		let zSquared = (z * z) / scale;
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
		return 2n * result + k * LN10;
	}

	/**
	 * 自然対数(ln)を計算する
	 * @returns ln(x)
	 */
	public ln(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const config = construct.config;
		const maxSteps = config.lnMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
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
	 * @throws {Error} 底が1または0の場合
	 */
	protected static _log(value: bigint, baseValue: bigint, precision: bigint, maxSteps: bigint): bigint {
		if (value === 1n * 10n ** precision) return 0n;
		const lnB = this._ln(baseValue, precision, maxSteps);
		if (lnB === 0n) throw new Error("log base cannot be 1 or 0");
		const lnX = this._ln(value, precision, maxSteps);
		const SCALE = 10n ** precision;
		return (lnX * SCALE) / lnB;
	}

	/**
	 * 対数を計算する
	 * @param base - 底
	 * @returns log_base(x)
	 */
	public log(base: BigFloat | number | string | bigint): BigFloat {
		const bfB = base instanceof BigFloat ? base : new BigFloat(base, this._precision);
		const construct = this.constructor as typeof BigFloat;
		const maxSteps = construct.config.lnMaxSteps;

		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const valA = this._getInternalValue(totalPr);
		const valB = bfB._getInternalValue(totalPr);

		const raw = construct._log(valA, valB, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * 2を底とする対数(log2)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log2(value)
	 */
	protected static _log2(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = 10n ** precision;
		const baseValue = 2n * scale;
		return this._log(value, baseValue, precision, maxSteps);
	}

	/**
	 * 2を底とする対数(log2)を計算する
	 * @returns log2(x)
	 */
	public log2(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const maxSteps = construct.config.lnMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
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
	 */
	protected static _log10(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const baseValue = 10n * 10n ** precision;
		return this._log(value, baseValue, precision, maxSteps);
	}

	/**
	 * 10を底とする対数(log10)を計算する
	 * @returns log10(x)
	 */
	public log10(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const maxSteps = construct.config.lnMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
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
	 */
	protected static _log1p(value: bigint, precision: bigint, maxSteps: bigint): bigint {
		const scale = 10n ** precision;
		const onePlusX = scale + value;
		return this._log(onePlusX, scale, precision, maxSteps);
	}

	/**
	 * ln(1 + x) を計算する
	 * @returns ln(1 + x)
	 */
	public log1p(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const maxSteps = construct.config.lnMaxSteps;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._log1p(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}

	/**
	 * ln(10) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(10)
	 */
	protected static _ln10(precision: bigint, maxSteps = 10000n): bigint {
		const scale = 10n ** precision;
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
		return 2n * result;
	}

	/**
	 * ln(2) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(2)
	 */
	protected static _ln2(precision: bigint, maxSteps: bigint): bigint {
		const scale = 10n ** precision;
		return this._ln(2n * scale, precision, maxSteps);
	}

	/**
	 * 自然対数の底(e)を取得する (内部用)
	 * @param precision - 精度
	 * @returns e
	 */
	protected static _e(precision: bigint): bigint {
		if (this._getCheckCache("e", precision)) {
			return this._getCache("e", precision);
		}
		const scale = 10n ** precision;
		const eInt = this._exp(scale, precision);
		this._updateCache("e", eInt, precision);
		return eInt;
	}

	/**
	 * 自然対数の底(e)を取得する
	 * @param precision - 精度
	 * @returns e
	 */
	public static e(precision: number | bigint = 20n): BigFloat {
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
	 * ライプニッツの公式で円周率を計算する (内部用)
	 * @param precision - 精度
	 * @param mulPrecision - 反復回数の倍率
	 * @returns 円周率
	 */
	protected static _piLeibniz(precision = 20n, mulPrecision = 100n): bigint {
		const scale = 10n ** precision;
		const iterations = precision * mulPrecision;
		let sum = 0n;
		const scale_4 = scale * 4n;
		const ZERO = 0n;
		const ONE = 1n;
		const TWO = 2n;
		let lastTerm = 0n;
		for (let i = 0n; i < iterations; i++) {
			const term = scale_4 / (TWO * i + ONE);
			if (term === lastTerm) break;
			lastTerm = term;
			sum += i % TWO === ZERO ? term : -term;
		}
		return sum;
	}

	/**
	 * ニュートン法(マチンの公式)で円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 */
	protected static _piNewton(precision = 20n): bigint {
		const EXTRA = 10n;
		const prec = precision + EXTRA;
		const atan1_5 = this._atanMachine(5n, prec);
		const atan1_239 = this._atanMachine(239n, prec);
		const value = 16n * atan1_5 - 4n * atan1_239;
		return value / 10n ** EXTRA;
	}

	/**
	 * チュドノフスキー法で円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 */
	protected static _piChudnovsky(precision = 20n): bigint {
		const scale = 10n ** precision;
		const digitsPerTerm = 14n;
		const terms = precision / digitsPerTerm + 1n;
		const C = 426880n * this._sqrt(10005n * scale, precision);
		let sum = 0n;
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
	 */
	protected static _pi(precision: bigint): bigint {
		const piAlgorithm = this.config.piAlgorithm;
		if (this._getCheckCache("pi", precision, piAlgorithm)) {
			return this._getCache("pi", precision);
		}
		let piRet;
		switch (piAlgorithm) {
			case PiAlgorithm.CHUDNOVSKY:
				piRet = this._piChudnovsky(precision);
				break;
			case PiAlgorithm.NEWTON:
				piRet = this._piNewton(precision);
				break;
			case PiAlgorithm.LEIBNIZ:
				piRet = this._piLeibniz(precision);
				break;
			case PiAlgorithm.MATH_DEFAULT:
			default:
				this._checkPrecision(precision);
				return new (this as any)(`${Math.PI}`, precision)._getInternalValue(precision);
		}
		this._updateCache("pi", piRet, precision, piAlgorithm);
		return piRet;
	}

	/**
	 * 円周率(pi)を取得する
	 * @param precision - 精度
	 * @returns pi
	 */
	public static pi(precision: number | bigint = 20n): BigFloat {
		const precisionBig = BigInt(precision);
		this._checkPrecision(precisionBig);
		const val = this._pi(precisionBig);
		return this._makeResult(val, precisionBig);
	}

	/**
	 * タウ(tau = 2*pi)を計算する (内部用)
	 * @param precision - 精度
	 * @returns tau
	 */
	protected static _tau(precision: bigint): bigint {
		const pi = this._pi(precision);
		return pi * 2n;
	}

	/**
	 * タウ(tau = 2*pi)を取得する
	 * @param precision - 精度
	 * @returns tau
	 */
	public static tau(precision: number | bigint = 20n): BigFloat {
		const precisionBig = BigInt(precision);
		this._checkPrecision(precisionBig);
		const val = this._tau(precisionBig);
		return this._makeResult(val, precisionBig);
	}

	// ====================================================================================================
	// * 統計関数
	// ====================================================================================================

	/**
	 * 引数の中で最大値を返す
	 * @param args - 数値のリスト
	 * @returns 最大値
	 * @throws {Error} 引数が空の場合
	 */
	public static max(...args: any[]): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new BigFloat(x)));
		if (arr.length === 0) throw new Error("No arguments provided");
		let maxBF = arr[0];
		for (let i = 1; i < arr.length; i++) {
			if (arr[i].gt(maxBF)) maxBF = arr[i];
		}
		return maxBF.clone();
	}

	/**
	 * 引数の中で最小値を返す
	 * @param args - 数値のリスト
	 * @returns 最小値
	 * @throws {Error} 引数が空の場合
	 */
	public static min(...args: any[]): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new BigFloat(x)));
		if (arr.length === 0) throw new Error("No arguments provided");
		let minBF = arr[0];
		for (let i = 1; i < arr.length; i++) {
			if (arr[i].lt(minBF)) minBF = arr[i];
		}
		return minBF.clone();
	}

	/**
	 * 引数の合計を返す
	 * @param args - 数値のリスト
	 * @returns 合計
	 */
	public static sum(...args: any[]): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new BigFloat(x)));
		if (arr.length === 0) return new BigFloat(0);
		let total = new BigFloat(0, arr[0]._precision);
		for (const item of arr) {
			total = total.add(item);
		}
		return total;
	}

	/**
	 * 引数の積を返す
	 * @param args - 数値のリスト
	 * @returns 積
	 */
	public static product(...args: any[]): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new BigFloat(x)));
		if (arr.length === 0) return new BigFloat(1);
		let prod = new BigFloat(1, arr[0]._precision);
		for (const item of arr) {
			prod = prod.mul(item);
		}
		return prod;
	}

	/**
	 * 引数の平均を返す
	 * @param args - 数値のリスト
	 * @returns 平均
	 */
	public static average(...args: any[]): BigFloat {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) return new this();
		const total = this.sum(arr);
		return total.div(new this(arr.length));
	}

	/**
	 * 引数の中央値を返す
	 * @param args - 数値のリスト
	 * @returns 中央値
	 * @throws {Error} 引数が空の場合
	 */
	public static median(...args: any[]): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new BigFloat(x)));
		if (arr.length === 0) throw new Error("No arguments provided");
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
	 * @throws {Error} 引数が空の場合
	 */
	public static variance(...args: any[]): BigFloat {
		const arr: BigFloat[] = this._normalizeArgs(args).map((x) => (x instanceof BigFloat ? x : new BigFloat(x)));
		if (arr.length === 0) throw new Error("No arguments provided");
		if (arr.length === 1) return new BigFloat("0", arr[0]._precision);

		const n = new BigFloat(arr.length);
		const total = this.sum(arr);
		const meanVal = total.div(n);

		let sumSquares = new BigFloat(0, meanVal._precision);
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
	 */
	public static stddev(...args: any[]): BigFloat {
		const varianceVal = this.variance(args);
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
		const maxSteps = this.config.lnMaxSteps;
		const scale = 10n ** precision;
		let result = 0n;
		const maxBits = this._log2(scale * scale, precision, maxSteps);
		const rawBits = (maxBits + scale - 1n) / scale;
		const rounds = Number((rawBits + 52n) / 53n);
		for (let i = 0; i < rounds; i++) {
			const r = BigInt(Math.floor(Math.random() * Number(2 ** 53)));
			result = (result << 53n) + r;
		}
		return result % scale;
	}

	/**
	 * 0以上1未満のランダムなBigFloatを生成する
	 * @param precision - 精度
	 * @returns ランダムなBigFloat
	 */
	public static random(precision: number | bigint = 20n): BigFloat {
		const precisionBig = BigInt(precision);
		this._checkPrecision(precisionBig);
		let randBigInt = this._randomBigInt(precisionBig);
		const res = new BigFloat(0, precisionBig);
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
		const scale = 10n ** precision;
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
	 * ベルヌーイ数を生成する (内部用)
	 * @param n - 最大次数
	 * @param precision - 精度
	 * @returns ベルヌーイ数のリスト
	 */
	protected static _bernoulliNumbers(n: number, precision: bigint): bigint[] {
		const A = new Array(n + 1).fill(0n);
		const B = new Array(n + 1).fill(0n);
		const scale = 10n ** precision;
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
	 */
	protected static _ln2pi(precision: bigint): bigint {
		if (this._getCheckCache("ln2pi", precision)) {
			return this._getCache("ln2pi", precision);
		}
		const scale = 10n ** precision;
		const pi = this._pi(precision);
		const twoPi = 2n * pi;
		const ln2pi = this._ln(twoPi, precision, this.config.lnMaxSteps);
		this._updateCache("ln2pi", ln2pi, precision);
		return ln2pi;
	}

	/** Bernoulli numbers cache */
	private static _bernoulliCache: Record<string, bigint[]> = {};

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
	 * ガンマ関数をStirlingの近似で計算する (内部用)
	 * @param z - 値
	 * @param precision - 精度
	 * @returns ガンマ関数
	 * @throws {Error} 負の整数の場合
	 */
	protected static _gammaLanczos(z: bigint, precision: bigint): bigint {
		const scale = 10n ** precision;
		const half_scale = scale / 2n;

		// 負の整数およびゼロでの極
		if (z <= 0n && z % scale === 0n) {
			throw new Error("z must not be a non-positive integer (pole)");
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
			if (denominator === 0n) throw new Error("division by zero");
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
	 */
	public gamma(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const raw = construct._gammaLanczos(val, totalPr);
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
	 */
	protected static _factorialGamma(n: bigint, precision: bigint): bigint {
		const scale = 10n ** precision;
		return this._gammaLanczos(n + scale, precision);
	}

	/**
	 * 階乗を計算する
	 * @returns 階乗
	 */
	public factorial(): BigFloat {
		const construct = this.constructor as typeof BigFloat;
		const totalPr = this._precision + (this.constructor as typeof BigFloat).config.extraPrecision;
		const val = this._getInternalValue(totalPr);
		const scale = 10n ** totalPr;
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
	 * キャッシュが存在するか確認する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @param priority - アルゴリズム優先度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckCache(key: string, precision: bigint, priority = 0): boolean {
		const cachedData = this._cached[key];
		return !!(cachedData && cachedData.precision >= precision && cachedData.priority >= priority);
	}

	/**
	 * キャッシュを取得する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {Error} キャッシュが存在しない場合
	 */
	protected static _getCache(key: string, precision: bigint): bigint {
		const cachedData = this._cached[key];
		if (cachedData) {
			const bf = new this();
			bf.mantissa = cachedData.value;
			bf._exp2 = -cachedData.precision;
			bf._exp5 = -cachedData.precision;
			bf._precision = precision;
			bf._applyPrecision();
			bf.lazyNormalize();

			// 10^precision 倍して整数にする
			let m = bf.mantissa;
			let e2 = bf._exp2 + precision;
			let e5 = bf._exp5 + precision;
			if (e2 > 0n) m <<= e2;
			if (e5 > 0n) m *= 5n ** e5;
			const div2 = e2 < 0n ? 2n ** -e2 : 1n;
			const div5 = e5 < 0n ? 5n ** -e5 : 1n;
			const divisor = div2 * div5;
			return m / divisor;
		}
		throw new Error(`use _getCheckCache first`);
	}

	/**
	 * キャッシュを更新する (内部用)
	 * @param key - キャッシュキー
	 * @param value - 値
	 * @param precision - 精度
	 * @param priority - アルゴリズム優先度
	 */
	protected static _updateCache(key: string, value: bigint, precision: bigint, priority = 0): void {
		const cachedData = this._cached[key];
		if (cachedData && cachedData.precision >= precision && cachedData.priority >= priority) {
			return;
		}
		this._cached[key] = { value, precision, priority };
	}

	// ====================================================================================================
	// * 定数オブジェクト
	// ====================================================================================================

	/**
	 * 定数 -1 を取得する
	 * @param precision - 精度
	 * @returns -1
	 */
	public static minusOne(precision: number | bigint = 20n): BigFloat {
		return new this(-1n, precision);
	}

	/**
	 * 定数 0 を取得する
	 * @param precision - 精度
	 * @returns 0
	 */
	public static zero(precision: number | bigint = 20n): BigFloat {
		return new this(0n, precision);
	}

	/**
	 * 定数 1 を取得する
	 * @param precision - 精度
	 * @returns 1
	 */
	public static one(precision: number | bigint = 20n): BigFloat {
		return new this(1n, precision);
	}
}

/**
 * BigFloat を作成する
 * @param value - 初期値
 * @param precision - 精度
 * @returns BigFloat インスタンス
 */
export function bigFloat(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat {
	return new BigFloat(value, precision);
}
