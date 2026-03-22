/*!
 * BigFloat 1.3.4
 * Copyright 2026 hi2ma-bu4
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */

// src/error.ts
var BigFloatError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, new.target);
    }
  }
};
var SpecialValuesDisabledError = class extends BigFloatError {
};
var PrecisionMismatchError = class extends BigFloatError {
};
var DivisionByZeroError = class extends BigFloatError {
};
var NumericalComputationError = class extends BigFloatError {
};
var CacheNotInitializedError = class extends BigFloatError {
};

// src/types.ts
var RoundingMode = /* @__PURE__ */ ((RoundingMode2) => {
  RoundingMode2[RoundingMode2["TRUNCATE"] = 0] = "TRUNCATE";
  RoundingMode2[RoundingMode2["DOWN"] = 0] = "DOWN";
  RoundingMode2[RoundingMode2["UP"] = 1] = "UP";
  RoundingMode2[RoundingMode2["CEIL"] = 2] = "CEIL";
  RoundingMode2[RoundingMode2["FLOOR"] = 3] = "FLOOR";
  RoundingMode2[RoundingMode2["HALF_UP"] = 4] = "HALF_UP";
  RoundingMode2[RoundingMode2["HALF_DOWN"] = 5] = "HALF_DOWN";
  return RoundingMode2;
})(RoundingMode || {});
var SpecialValueState = /* @__PURE__ */ ((SpecialValueState2) => {
  SpecialValueState2[SpecialValueState2["FINITE"] = 0] = "FINITE";
  SpecialValueState2[SpecialValueState2["POSITIVE_INFINITY"] = 1] = "POSITIVE_INFINITY";
  SpecialValueState2[SpecialValueState2["NEGATIVE_INFINITY"] = 2] = "NEGATIVE_INFINITY";
  SpecialValueState2[SpecialValueState2["NAN"] = 3] = "NAN";
  return SpecialValueState2;
})(SpecialValueState || {});

// src/bigFloat.ts
var BigFloatConfig = class _BigFloatConfig {
  /** 精度の不一致を許容するかどうか */
  allowPrecisionMismatch;
  /** 破壊的な計算(自身の上書き)をするかどうか */
  mutateResult;
  /** Infinity/NaN の特殊値を許容するかどうか */
  allowSpecialValues;
  /** 丸めモード */
  roundingMode;
  /** 計算時に追加する精度 */
  extraPrecision;
  /** 三角関数の最大ステップ数 */
  trigFuncsMaxSteps;
  /** 対数計算の最大ステップ数 */
  lnMaxSteps;
  /**
   * @param options - 設定オプション
   */
  constructor({ allowPrecisionMismatch = false, mutateResult = false, allowSpecialValues = true, roundingMode = 0 /* TRUNCATE */, extraPrecision = 6n, trigFuncsMaxSteps = 5000n, lnMaxSteps = 10000n } = {}) {
    this.allowPrecisionMismatch = allowPrecisionMismatch;
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
  clone() {
    return new _BigFloatConfig({
      allowPrecisionMismatch: this.allowPrecisionMismatch,
      mutateResult: this.mutateResult,
      allowSpecialValues: this.allowSpecialValues,
      roundingMode: this.roundingMode,
      extraPrecision: this.extraPrecision,
      trigFuncsMaxSteps: this.trigFuncsMaxSteps,
      lnMaxSteps: this.lnMaxSteps
    });
  }
  /**
   * 精度の不一致を許容するかどうかを切り替える
   */
  toggleMismatch() {
    this.allowPrecisionMismatch = !this.allowPrecisionMismatch;
  }
  /**
   * 破壊的な計算(自身の上書き)をするかどうかを切り替える
   */
  toggleMutation() {
    this.mutateResult = !this.mutateResult;
  }
};
var BigFloat = class _BigFloat {
  /** 最大精度 (Stringの限界) */
  static MAX_PRECISION = 200000000n;
  /** レイジー正規化の閾値 */
  static LAZY_NORMALIZE_SMALL_THRESHOLD = 32n;
  /** デフォルトの精度 */
  static DEFAULT_PRECISION = 20n;
  /** 設定 */
  static config = new BigFloatConfig();
  /** 円周率キャッシュ */
  static _piCache = null;
  /** eキャッシュ */
  static _eCache = null;
  /** 対数キャッシュ */
  static _lnCache = /* @__PURE__ */ Object.create(null);
  /** 5の累乗キャッシュ */
  static _pow5Cache = [1n];
  /** 2の累乗キャッシュ */
  static _pow2Cache = [1n];
  /** Bernoulli numbers cache */
  static _bernoulliCache = /* @__PURE__ */ Object.create(null);
  /**
   * キャッシュをクリアする
   */
  static clearCache() {
    this._piCache = null;
    this._eCache = null;
    this._lnCache = /* @__PURE__ */ Object.create(null);
    this._pow5Cache = [1n];
    this._pow2Cache = [1n];
    this._bernoulliCache = /* @__PURE__ */ Object.create(null);
  }
  /** 内部的な値 (mantissa × 2^exp2 × 5^exp5) */
  mantissa = 0n;
  /** 2の指数 */
  _exp2 = 0n;
  /** 5の指数 */
  _exp5 = 0n;
  /** 2の指数を取得する */
  exponent2() {
    return this._exp2;
  }
  /** 5の指数を取得する */
  exponent5() {
    return this._exp5;
  }
  /** 精度 (小数点以下の最大桁数) */
  _precision = this.constructor.DEFAULT_PRECISION;
  /** 特殊値の状態 */
  _specialState = 0 /* FINITE */;
  /**
   * 特殊値状態を表示用の文字列に変換する
   * @param state - 特殊値状態
   * @returns 表示用の文字列
   */
  static _specialStateLabel(state) {
    switch (state) {
      case 1 /* POSITIVE_INFINITY */:
        return "Infinity";
      case 2 /* NEGATIVE_INFINITY */:
        return "-Infinity";
      case 3 /* NAN */:
        return "NaN";
      default:
        return "";
    }
  }
  /**
   * 文字列から特殊値状態を判定する
   * @param value - 判定対象の文字列
   * @returns 対応する特殊値状態。通常の数値文字列の場合はnull
   */
  static _stateFromString(value) {
    const trimmed = value.trim();
    if (/^[+]?(?:infinity|inf)$/i.test(trimmed)) return 1 /* POSITIVE_INFINITY */;
    if (/^-(?:infinity|inf)$/i.test(trimmed)) return 2 /* NEGATIVE_INFINITY */;
    if (/^nan$/i.test(trimmed)) return 3 /* NAN */;
    return null;
  }
  /**
   * number値から特殊値状態を判定する
   * @param value - 判定対象の値
   * @returns 対応する特殊値状態。有限値の場合はnull
   */
  static _stateFromNumber(value) {
    if (Number.isNaN(value)) return 3 /* NAN */;
    if (value === Number.POSITIVE_INFINITY) return 1 /* POSITIVE_INFINITY */;
    if (value === Number.NEGATIVE_INFINITY) return 2 /* NEGATIVE_INFINITY */;
    return null;
  }
  /**
   * 特殊値状態のインスタンスを生成する
   * @param state - 特殊値状態
   * @param precision - 結果の精度
   * @returns 生成された特殊値インスタンス
   * @throws {Error} 特殊値が無効な場合
   */
  static _createSpecialValue(state, precision) {
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
   * @throws {Error} 特殊値が無効な場合
   */
  _specialResult(state, precision = this._precision) {
    const construct = this.constructor;
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
  _isFiniteState() {
    return this._specialState === 0 /* FINITE */;
  }
  /**
   * NaN状態かどうかを判定する
   * @returns NaN状態の場合はtrue
   */
  _isNaNState() {
    return this._specialState === 3 /* NAN */;
  }
  /**
   * 無限大状態かどうかを判定する
   * @returns 正または負の無限大の場合はtrue
   */
  _isInfinityState() {
    return this._specialState === 1 /* POSITIVE_INFINITY */ || this._specialState === 2 /* NEGATIVE_INFINITY */;
  }
  /**
   * 符号を取得する
   * @returns 正なら1、負なら-1、ゼロまたはNaNなら0
   */
  _signum() {
    if (this._specialState === 1 /* POSITIVE_INFINITY */) return 1;
    if (this._specialState === 2 /* NEGATIVE_INFINITY */) return -1;
    if (this.mantissa > 0n) return 1;
    if (this.mantissa < 0n) return -1;
    return 0;
  }
  /**
   * 特殊値が無効な設定で特殊値を扱っていないかを検証する
   * @param values - 検証対象の値
   * @throws {Error} 特殊値が無効で対象に特殊値が含まれる場合
   */
  _ensureSpecialValuesEnabled(...values) {
    const construct = this.constructor;
    if (construct.config.allowSpecialValues) return;
    for (const value of values) {
      if (!value._isFiniteState()) {
        throw new SpecialValuesDisabledError("Special values are disabled");
      }
    }
  }
  /**
   * 特殊値を考慮してnumberへ変換する
   * @returns 変換後のnumber値
   * @throws {Error} 特殊値が無効な場合
   */
  _specialAwareNumber() {
    this._ensureSpecialValuesEnabled(this);
    switch (this._specialState) {
      case 1 /* POSITIVE_INFINITY */:
        return Number.POSITIVE_INFINITY;
      case 2 /* NEGATIVE_INFINITY */:
        return Number.NEGATIVE_INFINITY;
      case 3 /* NAN */:
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
   */
  _fromSpecialAwareNumber(value, precision = this._precision) {
    const construct = this.constructor;
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
  _makeExactResultWithPrecision(mantissa, precision, exp2 = 0n, exp5 = 0n) {
    const construct = this.constructor;
    const mutate = construct.config.mutateResult;
    const result = mutate ? this : new construct();
    result._precision = precision;
    result.mantissa = mantissa;
    result._exp2 = exp2;
    result._exp5 = exp5;
    result._specialState = 0 /* FINITE */;
    result.softNormalize();
    return result;
  }
  /**
   * @param value - 初期値
   * @param precision - 精度
   * @throws {RangeError} 精度が不正な場合
   */
  constructor(value, precision = this.constructor.DEFAULT_PRECISION) {
    const construct = this.constructor;
    if (value instanceof _BigFloat) {
      this.mantissa = value.mantissa;
      this._exp2 = value._exp2;
      this._exp5 = value._exp5;
      this._precision = value._precision;
      this._specialState = value._specialState;
      return;
    }
    this._precision = BigInt(precision);
    construct._checkPrecision(this._precision);
    if (value === void 0 || value === null || value === "") {
      this.mantissa = 0n;
      this._exp2 = 0n;
      this._exp5 = 0n;
      this._specialState = 0 /* FINITE */;
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
      const len = BigInt(fracPart.length);
      this.mantissa = BigInt(intPart + fracPart) * BigInt(sign);
      this._exp2 = -len;
      this._exp5 = -len;
    }
    this._specialState = 0 /* FINITE */;
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
  static clone() {
    const Parent = this;
    return class extends Parent {
      static config = Parent.config.clone();
      static MAX_PRECISION = Parent.MAX_PRECISION;
    };
  }
  /**
   * インスタンスを複製する
   * @returns 複製されたインスタンス
   */
  clone() {
    const instance = new this.constructor();
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
  copyFrom(other) {
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
  _makeExactResult(mantissa, exp2 = 0n, exp5 = 0n) {
    const construct = this.constructor;
    const mutate = construct.config.mutateResult;
    const result = mutate ? this : new construct();
    result._precision = this._precision;
    result.mantissa = mantissa;
    result._exp2 = exp2;
    result._exp5 = exp5;
    result._specialState = 0 /* FINITE */;
    result.softNormalize();
    return result;
  }
  /**
   * 厳密な整数値を取得する
   * @returns 整数値、整数でない場合はnull
   */
  _getExactInteger() {
    if (this.mantissa === 0n) return 0n;
    const construct = this.constructor;
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
  _getExactPowerOf2Exponent() {
    if (this.mantissa <= 0n) return null;
    const construct = this.constructor;
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
  _getExactPowerOf10Exponent() {
    if (this.mantissa <= 0n) return null;
    const construct = this.constructor;
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
  softNormalize() {
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
  lazyNormalize() {
    if (!this._isFiniteState()) return;
    this.softNormalize();
    if (this.mantissa === 0n) return;
    let m = this.mantissa;
    const neg = m < 0n;
    if (neg) m = -m;
    const construct = this.constructor;
    let low = 0n;
    let high = 1n;
    while (true) {
      const p5 = construct._getPow5(high);
      const q = m / p5;
      if (q * p5 !== m) break;
      low = high;
      high <<= 1n;
    }
    while (low < high) {
      const mid = low + high + 1n >> 1n;
      const p5 = construct._getPow5(mid);
      const q = m / p5;
      if (q * p5 === m) {
        low = mid;
      } else {
        high = mid - 1n;
      }
    }
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
  _applyPrecision(precision = this._precision) {
    if (!this._isFiniteState()) return;
    if (this.mantissa === 0n) {
      this._exp2 = 0n;
      this._exp5 = 0n;
      return;
    }
    const diff2 = this._exp2 + precision;
    const diff5 = this._exp5 + precision;
    if (diff2 >= 0n && diff5 >= 0n) {
      return;
    }
    let scaledMantissa = this.mantissa;
    const construct = this.constructor;
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
  static _roundManual(mantissa, divisor) {
    const mode = this.config.roundingMode;
    const rem = mantissa % divisor;
    const base = mantissa / divisor;
    if (rem === 0n) return base;
    const absRem = rem < 0n ? -rem : rem;
    const isNeg = mantissa < 0n;
    let offset = 0n;
    switch (mode) {
      case 1 /* UP */:
        offset = isNeg ? -1n : 1n;
        break;
      case 2 /* CEIL */:
        if (!isNeg) offset = 1n;
        break;
      case 3 /* FLOOR */:
        if (isNeg) offset = -1n;
        break;
      case 4 /* HALF_UP */:
        if (absRem * 2n >= divisor) offset = isNeg ? -1n : 1n;
        break;
      case 5 /* HALF_DOWN */:
        if (absRem * 2n > divisor) offset = isNeg ? -1n : 1n;
        break;
      case 0 /* TRUNCATE */:
      case 0 /* DOWN */:
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
  static parseFloat(str, precision = this.DEFAULT_PRECISION, base = 10) {
    if (str instanceof _BigFloat) return str.clone();
    if (typeof str !== "string") str = String(str);
    if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
    if (base === 10) return new this(str, precision);
    const [rawInt, rawFrac = ""] = str.toLowerCase().replace(/^\+/, "").split(".");
    const sign = str.trim().startsWith("-") ? -1n : 1n;
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    const toDigit = (ch) => {
      const d = digits.indexOf(ch);
      if (d < 0 || d >= base) throw new SyntaxError(`Invalid digit '${ch}' for base ${base}`);
      return BigInt(d);
    };
    const bigBase = BigInt(base);
    let intVal = 0n;
    for (const ch of rawInt.replace(/^[-+]/, "")) {
      intVal = intVal * bigBase + toDigit(ch);
    }
    const res = new this(intVal * sign, precision);
    const config = this.config;
    const originalMutate = config.mutateResult;
    config.mutateResult = true;
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
  _parse(str) {
    str = str.toString().trim();
    const expMatch = str.match(/^([+-]?[\d.]+)[eE]([+-]?\d+)$/);
    if (expMatch) {
      let [_, base, expStr] = expMatch;
      const exp = parseInt(expStr, 10);
      let [intPart2, fracPart = ""] = base.split(".");
      const allDigits = intPart2 + fracPart;
      let pointIndex = intPart2.length + exp;
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
  static _hasAggregateArrayArg(args) {
    return args.length === 1 && Array.isArray(args[0]);
  }
  /**
   * 引数を正規化する
   * @param args - 引数リスト
   * @returns 正規化された引数リスト
   */
  static _normalizeArgs(args) {
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
   */
  static _resolvePrecisionFromValues(values, fallback = this.DEFAULT_PRECISION) {
    let resolved = BigInt(fallback);
    for (const value of values) {
      if (value instanceof _BigFloat && value._precision > resolved) {
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
   */
  static _coerceBigFloatValue(value, precision) {
    if (value instanceof _BigFloat) {
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
  static _fromInternalValue(value, precision) {
    const result = { mantissa: value, exp2: -precision, exp5: -precision };
    return this._softNormalizeRaw(result);
  }
  /**
   * 生の内部表現を10^precision倍された整数値に変換する
   * @param value - 生の内部表現
   * @param precision - 精度
   * @returns 10^precision倍された整数値
   */
  static _toInternalValue(value, precision) {
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
  static _softNormalizeRaw(value) {
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
  static _applyRawPrecision(value, precision) {
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
  static _lazyNormalizeRaw(value) {
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
      const mid = low + high + 1n >> 1n;
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
  static _extractPowerFactors(mantissa) {
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
  static _gcd(a, b) {
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
   * @throws {Error} 精度の不一致が許容されていない場合
   */
  _align(other, mutateA = false) {
    const construct = this.constructor;
    const bfB = other instanceof _BigFloat ? other : new construct(other, this._precision);
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
  static _makeResult(val, precision, valPrecision = precision) {
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
  _makeResult(val, precision, valPrecision = precision, okMutate = true) {
    const res = this.constructor._makeResult(val, precision, valPrecision);
    return this._makeResultFromInstance(res);
  }
  /**
   * 正の整数 n の degree 乗根の初期値を概算する
   * @param value - 対象の正の整数
   * @param degree - 乗根の次数
   * @param decimalShift - 値に追加で掛かっている 10 の指数
   * @returns ニュートン法用の初期値
   */
  static _estimatePositiveRoot(value, degree, decimalShift = 0n) {
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
   * @throws {RangeError} 精度が範囲外の場合
   */
  static _checkPrecision(precision) {
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
  changePrecision(precision) {
    const precisionBig = BigInt(precision);
    this.constructor._checkPrecision(precisionBig);
    this._precision = precisionBig;
    this._applyPrecision();
    return this;
  }
  /**
   * どこまで精度が一致しているかを判定する
   * @param other - 比較対象
   * @returns 一致している桁数
   */
  matchingPrecision(other) {
    const bfB = other instanceof _BigFloat ? other : new this.constructor(other, this._precision);
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      return this.compare(bfB) === 0 ? this._precision > bfB._precision ? this._precision : bfB._precision : 0n;
    }
    const diff = this.sub(bfB).abs();
    const maxP = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (diff.isZero()) return maxP;
    let matched = 0n;
    for (let p = 1n; p <= maxP; p++) {
      const check = diff.mul(this.constructor._getPow10(p));
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
  compare(other) {
    const construct = this.constructor;
    const bfB = other instanceof _BigFloat ? other : new construct(other, this._precision);
    if (!construct.config.allowSpecialValues && (!this._isFiniteState() || !bfB._isFiniteState())) {
      throw new SpecialValuesDisabledError("Special values are disabled");
    }
    if (this._isNaNState() || bfB._isNaNState()) return Number.NaN;
    if (this._specialState === bfB._specialState && !this._isFiniteState()) return 0;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      if (this._specialState === 1 /* POSITIVE_INFINITY */ || bfB._specialState === 2 /* NEGATIVE_INFINITY */) return 1;
      if (this._specialState === 2 /* NEGATIVE_INFINITY */ || bfB._specialState === 1 /* POSITIVE_INFINITY */) return -1;
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
   */
  eq(other) {
    return this.compare(other) === 0;
  }
  /**
   * 等しいかどうかを判定する (==)
   * @param other - 比較対象
   * @returns 等しい場合はtrue
   */
  equals(other) {
    return this.compare(other) === 0;
  }
  /**
   * 等しくないかどうかを判定する (!=)
   * @param other - 比較対象
   * @returns 等しくない場合はtrue
   */
  ne(other) {
    return this.compare(other) !== 0;
  }
  /**
   * より小さいかどうかを判定する (<)
   * @param other - 比較対象
   * @returns より小さい場合はtrue
   */
  lt(other) {
    return this.compare(other) === -1;
  }
  /**
   * 以下かどうかを判定する (<=)
   * @param other - 比較対象
   * @returns 以下の場合はtrue
   */
  lte(other) {
    return this.compare(other) <= 0;
  }
  /**
   * より大きいかどうかを判定する (>)
   * @param other - 比較対象
   * @returns より大きい場合はtrue
   */
  gt(other) {
    return this.compare(other) === 1;
  }
  /**
   * 以上かどうかを判定する (>=)
   * @param other - 比較対象
   * @returns 以上の場合はtrue
   */
  gte(other) {
    return this.compare(other) >= 0;
  }
  /**
   * ゼロかどうかを判定する
   * @returns ゼロの場合はtrue
   */
  isZero() {
    return this._isFiniteState() && this.mantissa === 0n;
  }
  /**
   * 正の数かどうかを判定する
   * @returns 正の数の場合はtrue
   */
  isPositive() {
    return this._specialState === 1 /* POSITIVE_INFINITY */ || this._isFiniteState() && this.mantissa > 0n;
  }
  /**
   * 負の数かどうかを判定する
   * @returns 負の数の場合はtrue
   */
  isNegative() {
    return this._specialState === 2 /* NEGATIVE_INFINITY */ || this._isFiniteState() && this.mantissa < 0n;
  }
  /**
   * 相対差を計算する
   * @param other - 比較対象
   * @returns 相対差
   */
  relativeDiff(other) {
    const construct = this.constructor;
    const diff = this.absoluteDiff(other);
    const absA = this.abs();
    const absB = (other instanceof _BigFloat ? other : new construct(other, this._precision)).abs();
    const denominator = absA.gt(absB) ? absA : absB;
    if (denominator.isZero()) return new construct(0n, this._precision);
    return diff.div(denominator);
  }
  /**
   * 絶対差を計算する
   * @param other - 比較対象
   * @returns 絶対差
   */
  absoluteDiff(other) {
    const bfB = other instanceof _BigFloat ? other : new this.constructor(other, this._precision);
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      return this.sub(bfB).abs();
    }
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
  percentDiff(other) {
    const construct = this.constructor;
    const diff = this.absoluteDiff(other);
    const absB = (other instanceof _BigFloat ? other : new construct(other, this._precision)).abs();
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
   */
  toString(base = 10, precision = this._precision) {
    if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
    const construct = this.constructor;
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
    const temp = this.clone();
    temp.lazyNormalize();
    temp._applyPrecision(prec);
    temp.lazyNormalize();
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    const bigBase = BigInt(base);
    const intPartBF = temp.trunc().abs();
    let intV = intPartBF._getInternalValue(0n);
    let intStr = "";
    if (intV === 0n) {
      intStr = "0";
    } else {
      while (intV > 0n) {
        intStr = digits[Number(intV % bigBase)] + intStr;
        intV /= bigBase;
      }
    }
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
  toJSON() {
    const config = this.constructor.config;
    let bf = this;
    return bf.toString();
  }
  /**
   * Number型に変換する
   * @returns 変換された数値
   */
  toNumber() {
    return this._specialAwareNumber();
  }
  /**
   * 指定した桁数で固定した文字列を取得する
   * @param digits - 小数点以下の桁数
   * @returns 固定小数点形式の文字列
   */
  toFixed(digits) {
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
  toExponential(digits = Number(this._precision)) {
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
  add(other) {
    const construct = this.constructor;
    const bfB = other instanceof _BigFloat ? other : new construct(other, this._precision);
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (this._isInfinityState() && bfB._isInfinityState()) {
        if (this._specialState !== bfB._specialState) return this._specialResult(3 /* NAN */, resultPrecision);
        return this._specialResult(this._specialState, resultPrecision);
      }
      return this._specialResult(this._isInfinityState() ? this._specialState : bfB._specialState, resultPrecision);
    }
    const mutate = construct.config.mutateResult;
    const [a, b] = this._align(other, mutate);
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
  sub(other) {
    const construct = this.constructor;
    const bfB = other instanceof _BigFloat ? other : new construct(other, this._precision);
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (this._isInfinityState() && bfB._isInfinityState()) {
        if (this._specialState === bfB._specialState) return this._specialResult(3 /* NAN */, resultPrecision);
        return this._specialResult(this._specialState, resultPrecision);
      }
      if (this._isInfinityState()) return this._specialResult(this._specialState, resultPrecision);
      return this._specialResult(bfB._specialState === 1 /* POSITIVE_INFINITY */ ? 2 /* NEGATIVE_INFINITY */ : 1 /* POSITIVE_INFINITY */, resultPrecision);
    }
    const mutate = construct.config.mutateResult;
    const [a, b] = this._align(other, mutate);
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
  mul(other) {
    const construct = this.constructor;
    if (!(other instanceof _BigFloat)) {
      other = new construct(other, this._precision);
    }
    const bfB = other;
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      const lhsInfinite = this._isInfinityState();
      const rhsInfinite = bfB._isInfinityState();
      if (lhsInfinite && bfB.isZero() || rhsInfinite && this.isZero()) {
        return this._specialResult(3 /* NAN */, resultPrecision);
      }
      const sign = this._signum() * bfB._signum();
      if (sign === 0) return this._specialResult(3 /* NAN */, resultPrecision);
      return this._specialResult(sign < 0 ? 2 /* NEGATIVE_INFINITY */ : 1 /* POSITIVE_INFINITY */, resultPrecision);
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
   * @throws {Error} ゼロ除算の場合
   */
  div(other) {
    const construct = this.constructor;
    if (!(other instanceof _BigFloat)) {
      other = new construct(other, this._precision);
    }
    const bfB = other;
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (this._isInfinityState() && bfB._isInfinityState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (this._isInfinityState()) {
        const sign = this._signum() * (bfB.isZero() ? 1 : bfB._signum());
        return this._specialResult(sign < 0 ? 2 /* NEGATIVE_INFINITY */ : 1 /* POSITIVE_INFINITY */, resultPrecision);
      }
      if (bfB._isInfinityState()) {
        return this._makeExactResultWithPrecision(0n, resultPrecision);
      }
    }
    if (construct.config.allowSpecialValues && bfB.isZero()) {
      if (this.isZero()) return this._specialResult(3 /* NAN */, resultPrecision);
      return this._specialResult(this._signum() < 0 ? 2 /* NEGATIVE_INFINITY */ : 1 /* POSITIVE_INFINITY */, resultPrecision);
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
  _makeResultFromInstance(instance) {
    const construct = this.constructor;
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
  _getInternalValue(precision) {
    const construct = this.constructor;
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
  static _mod(x, m) {
    const r = x % m;
    return r < 0n ? r + m : r;
  }
  /**
   * 剰余を計算する (%)
   * @param other - 法
   * @returns 剰余
   */
  mod(other) {
    const construct = this.constructor;
    const bfB = other instanceof _BigFloat ? other : new construct(other, this._precision);
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (this._isInfinityState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (bfB._isInfinityState()) return this._makeExactResultWithPrecision(this.mantissa, resultPrecision, this._exp2, this._exp5);
    }
    if (construct.config.allowSpecialValues && bfB.isZero()) {
      return this._specialResult(3 /* NAN */, resultPrecision);
    }
    const mutate = construct.config.mutateResult;
    const [a, b] = this._align(other, mutate);
    const result = construct._mod(a.mantissa, b.mantissa);
    a.mantissa = result;
    a.softNormalize();
    a._applyPrecision();
    return a;
  }
  /**
   * 符号を反転させる
   * @returns 符号が反転した結果
   */
  neg() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      return this._specialResult(this._specialState === 1 /* POSITIVE_INFINITY */ ? 2 /* NEGATIVE_INFINITY */ : 1 /* POSITIVE_INFINITY */);
    }
    const mutate = construct.config.mutateResult;
    const res = mutate ? this : this.clone();
    res.mantissa = -res.mantissa;
    return res;
  }
  /**
   * 絶対値を取得する
   * @returns 絶対値
   */
  abs() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      return this._specialResult(1 /* POSITIVE_INFINITY */);
    }
    const mutate = construct.config.mutateResult;
    const res = mutate ? this : this.clone();
    res.mantissa = res.mantissa < 0n ? -res.mantissa : res.mantissa;
    return res;
  }
  /**
   * 符号を取得する
   * @returns -1, 0, 1 または NaN
   */
  sign() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */, 0n);
      return this._makeExactResultWithPrecision(this._specialState === 1 /* POSITIVE_INFINITY */ ? 1n : -1n, 0n);
    }
    if (this.mantissa === 0n) return this._makeExactResultWithPrecision(0n, 0n);
    return this._makeExactResultWithPrecision(this.mantissa > 0n ? 1n : -1n, 0n);
  }
  /**
   * 逆数を取得する
   * @returns 逆数
   * @throws {Error} ゼロの場合
   */
  reciprocal() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._isNaNState()) return this._specialResult(3 /* NAN */);
      return this._makeExactResultWithPrecision(0n, this._precision);
    }
    if (construct.config.allowSpecialValues && this.isZero()) {
      return this._specialResult(1 /* POSITIVE_INFINITY */);
    }
    return new construct(1n, this._precision).div(this);
  }
  /**
   * 床関数 (負の無限大方向への丸め)
   * @returns 丸められた結果
   */
  floor() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this.clone();
    }
    const temp = this.clone();
    const config = this.constructor.config;
    const originalMode = config.roundingMode;
    config.roundingMode = 3 /* FLOOR */;
    temp._applyPrecision(0n);
    config.roundingMode = originalMode;
    return this._makeResultFromInstance(temp);
  }
  /**
   * 天井関数 (正の無限大方向への丸め)
   * @returns 丸められた結果
   */
  ceil() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this.clone();
    }
    const temp = this.clone();
    const config = this.constructor.config;
    const originalMode = config.roundingMode;
    config.roundingMode = 2 /* CEIL */;
    temp._applyPrecision(0n);
    config.roundingMode = originalMode;
    return this._makeResultFromInstance(temp);
  }
  /**
   * 四捨五入する
   * @returns 四捨五入された結果
   */
  round() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this.clone();
    }
    return this.add(new this.constructor(0.5, this._precision)).floor();
  }
  /**
   * 0に近い方向へ切り捨てる
   * @returns 切り捨てられた結果
   */
  trunc() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this.clone();
    }
    const temp = this.clone();
    const config = this.constructor.config;
    const originalMode = config.roundingMode;
    config.roundingMode = 0 /* TRUNCATE */;
    temp._applyPrecision(0n);
    config.roundingMode = originalMode;
    return this._makeResultFromInstance(temp);
  }
  /**
   * Float32 精度へ丸める
   * @returns Float32相当に丸めた結果
   */
  fround() {
    return this._fromSpecialAwareNumber(Math.fround(this._specialAwareNumber()), this._precision);
  }
  /**
   * 32bit整数として見たときの先頭ゼロビット数を返す
   * @returns 先頭ゼロビット数
   */
  clz32() {
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
   * @throws {Error} ゼロ除算が発生した場合
   */
  static _pow(base, exponent, precision) {
    const scale = this._getPow10(precision);
    if (exponent === 0n) return scale;
    if (base === 0n) return 0n;
    if (exponent < 0n) {
      const positivePow = this._pow(base, -exponent, precision);
      if (positivePow === 0n) throw new DivisionByZeroError("Division by zero in power function");
      return scale * scale / positivePow;
    }
    if (exponent % scale === 0n) {
      let exp = exponent / scale;
      let res = scale;
      let b = base;
      while (exp > 0n) {
        if (exp & 1n) {
          res = res * b / scale;
        }
        b = b * b / scale;
        exp >>= 1n;
      }
      return res;
    }
    const config = this.config;
    const maxSteps = config.lnMaxSteps;
    const lnBase = this._ln(base, precision, maxSteps);
    const mul = lnBase * exponent / scale;
    return this._exp(mul, precision);
  }
  /**
   * 冪乗を計算する
   * @param exponent - 指数
   * @returns 冪乗の結果
   */
  pow(exponent) {
    const construct = this.constructor;
    const bfB = exponent instanceof _BigFloat ? exponent : new construct(exponent, this._precision);
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (bfB.isZero()) return new construct(1, resultPrecision);
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (bfB._isInfinityState()) {
        if (!this._isFiniteState()) {
          if (this._specialState === 1 /* POSITIVE_INFINITY */) {
            return bfB._specialState === 1 /* POSITIVE_INFINITY */ ? this._specialResult(1 /* POSITIVE_INFINITY */, resultPrecision) : this._makeExactResultWithPrecision(0n, resultPrecision);
          }
          return this._specialResult(3 /* NAN */, resultPrecision);
        }
        if (this.isZero()) {
          return bfB._specialState === 1 /* POSITIVE_INFINITY */ ? this._makeExactResultWithPrecision(0n, resultPrecision) : this._specialResult(1 /* POSITIVE_INFINITY */, resultPrecision);
        }
        const exactBase = this._getExactInteger();
        if (exactBase === 1n) return this._makeExactResultWithPrecision(1n, resultPrecision);
        if (exactBase === -1n || this.mantissa < 0n) return this._specialResult(3 /* NAN */, resultPrecision);
        const absCmp = this.abs().compare(1);
        const tendsToInfinity = absCmp === 1 && bfB._specialState === 1 /* POSITIVE_INFINITY */ || absCmp === -1 && bfB._specialState === 2 /* NEGATIVE_INFINITY */;
        return tendsToInfinity ? this._specialResult(1 /* POSITIVE_INFINITY */, resultPrecision) : this._makeExactResultWithPrecision(0n, resultPrecision);
      }
      if (this._isInfinityState()) {
        if (bfB.isPositive()) {
          if (this._specialState === 1 /* POSITIVE_INFINITY */) {
            return this._specialResult(1 /* POSITIVE_INFINITY */, resultPrecision);
          }
          const exactExponent = bfB._getExactInteger();
          if (exactExponent === null) return this._specialResult(3 /* NAN */, resultPrecision);
          return this._specialResult(exactExponent % 2n === 0n ? 1 /* POSITIVE_INFINITY */ : 2 /* NEGATIVE_INFINITY */, resultPrecision);
        }
        if (bfB.isNegative()) return this._makeExactResultWithPrecision(0n, resultPrecision);
      }
    }
    if (this.mantissa < 0n && !(bfB._exp2 >= 0n && bfB._exp5 >= 0n)) {
      if (construct.config.allowSpecialValues) {
        return this._specialResult(3 /* NAN */, resultPrecision);
      }
      throw new RangeError("Fractional power of negative number is not real");
    }
    if (bfB._exp2 >= 0n && bfB._exp5 >= 0n) {
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
    return this.ln().mul(bfB).exp();
  }
  /**
   * 平方根を計算する (内部用)
   * @param n - 値
   * @param precision - 精度
   * @returns 平方根
   * @throws {Error} 負の数の平方根を計算しようとした場合
   */
  static _sqrt(n, precision) {
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
   */
  sqrt() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    if (this.mantissa < 0n) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
      throw new RangeError("Cannot compute square root of negative number");
    }
    if (this.mantissa === 0n) return new construct(0n, this._precision);
    const mutate = construct.config.mutateResult;
    const res = mutate ? this : this.clone();
    const targetP = res._precision;
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
    let valForSqrt = res.mantissa;
    let e2s = res._exp2 + 2n * targetP;
    let e5s = res._exp5 + 2n * targetP;
    if (e2s > 0n) valForSqrt <<= e2s;
    if (e5s > 0n) valForSqrt *= construct._getPow5(e5s);
    if (e2s < 0n) valForSqrt /= construct._getPow2(-e2s);
    if (e5s < 0n) valForSqrt /= construct._getPow5(-e5s);
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
   */
  cbrt() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
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
   * @throws {Error} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
   */
  static _nthRoot(v, n, precision) {
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
          xPow = xPow * x / scale;
        }
      }
      const numerator = (n - 1n) * x + v * scale / xPow;
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
  nthRoot(n) {
    const bn = BigInt(n);
    if (bn <= 0n) throw new RangeError("n must be a positive integer");
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      if (bn % 2n === 0n) return this._specialResult(3 /* NAN */);
      return this._specialResult(2 /* NEGATIVE_INFINITY */);
    }
    if (this.mantissa < 0n && bn % 2n === 0n) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
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
   */
  static _sin(x, precision, maxSteps) {
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
    const x2 = x * x / scale;
    let sgn = -1n;
    for (let n = 1n; n <= maxSteps; n++) {
      const denom = 2n * n;
      term = term * x2 / scale;
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
  static _sinSeries(x, precision, maxSteps) {
    const scale = this._getPow10(precision);
    let term = x;
    let result = term;
    const x2 = x * x / scale;
    let sign = -1n;
    for (let n = 1n; n <= maxSteps; n++) {
      const denom = 2n * n;
      term = term * x2 / scale;
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
   */
  sin() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this._specialResult(3 /* NAN */);
    }
    if (this.mantissa === 0n) return this._makeExactResult(0n);
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
  static _cos(x, precision, maxSteps) {
    const scale = this._getPow10(precision);
    let term = scale;
    let result = term;
    const x2 = x * x / scale;
    let sign = -1n;
    for (let n = 1n, denom = 2n; n <= maxSteps; n++, denom += 2n) {
      term = term * x2 / scale;
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
  cos() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this._specialResult(3 /* NAN */);
    }
    if (this.mantissa === 0n) return this._makeExactResult(1n);
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
   * @throws {Error} 正接が定義されない点の場合
   */
  static _tan(x, precision, maxSteps) {
    const cosX = this._cos(x, precision, maxSteps);
    const EPSILON = this._getPow10(precision - 4n);
    if (cosX === 0n || cosX > -EPSILON && cosX < EPSILON) throw new NumericalComputationError("tan(x) is undefined or numerically unstable at this point");
    const sinX = this._sin(x, precision, maxSteps);
    const scale = this._getPow10(precision);
    return sinX * scale / cosX;
  }
  /**
   * 正接(tan)を計算する
   * @returns 正接
   */
  tan() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this._specialResult(3 /* NAN */);
    }
    if (this.mantissa === 0n) return this._makeExactResult(0n);
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
   * @throws {Error} 入力が範囲外([-1, 1])の場合
   */
  static _asin(x, precision, maxSteps) {
    const scale = this._getPow10(precision);
    if (x > scale || x < -scale) throw new RangeError("asin input out of range [-1,1]");
    const halfPi = this._pi(precision) / 2n;
    const initial = x * halfPi / scale;
    const f = (theta) => this._sin(theta, precision, maxSteps) - x;
    const df = (theta) => this._cos(theta, precision, maxSteps);
    return this._trigFuncsNewton(f, df, initial, precision, Number(maxSteps));
  }
  /**
   * 逆正弦(asin)を計算する
   * @returns 角度(ラジアン)
   */
  asin() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this._specialResult(3 /* NAN */);
    }
    if ((this.gt(1) || this.lt(-1)) && construct.config.allowSpecialValues) {
      return this._specialResult(3 /* NAN */);
    }
    if (this.mantissa === 0n) return this._makeExactResult(0n);
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
   */
  static _acos(x, precision, maxSteps) {
    const halfPi = this._pi(precision) / 2n;
    const asinX = this._asin(x, precision, maxSteps);
    return halfPi - asinX;
  }
  /**
   * 逆余弦(acos)を計算する
   * @returns 角度(ラジアン)
   */
  acos() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this._specialResult(3 /* NAN */);
    }
    if ((this.gt(1) || this.lt(-1)) && construct.config.allowSpecialValues) {
      return this._specialResult(3 /* NAN */);
    }
    if (this._getExactInteger() === 1n) return this._makeExactResult(0n);
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
   */
  static _atan(x, precision, maxSteps) {
    const scale = this._getPow10(precision);
    const absX = x < 0n ? -x : x;
    if (absX <= scale) {
      const f = (theta) => this._tan(theta, precision, maxSteps) - x;
      const df = (theta) => {
        const cosTheta = this._cos(theta, precision, maxSteps);
        if (cosTheta === 0n) throw new NumericalComputationError("Derivative undefined");
        return scale * scale * scale / (cosTheta * cosTheta);
      };
      return this._trigFuncsNewton(f, df, x, precision, Number(maxSteps));
    }
    const sign = x < 0n ? -1n : 1n;
    const halfPi = this._pi(precision) / 2n;
    const invX = scale * scale / absX;
    const innerAtan = this._atan(invX, precision, maxSteps);
    return sign * (halfPi - innerAtan);
  }
  /**
   * 逆正接(atan)を計算する
   * @returns 角度(ラジアン)
   */
  atan() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      const halfPi = construct.pi(this._precision).div(2);
      return this._specialState === 1 /* POSITIVE_INFINITY */ ? halfPi : halfPi.neg();
    }
    if (this.mantissa === 0n) return this._makeExactResult(0n);
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
   */
  static _atan2(y, x, precision, maxSteps) {
    if (x === 0n) {
      if (y > 0n) return this._pi(precision) / 2n;
      if (y < 0n) return -this._pi(precision) / 2n;
      return 0n;
    }
    const scale = this._getPow10(precision);
    const angle = this._atan(y * scale / x, precision, maxSteps);
    if (x > 0n) return angle;
    if (y >= 0n) return angle + this._pi(precision);
    return angle - this._pi(precision);
  }
  /**
   * 2引数の逆正接(atan2)を計算する
   * @param x - x座標
   * @returns 角度(ラジアン)
   */
  atan2(x) {
    const construct = this.constructor;
    const bfB = x instanceof _BigFloat ? x : new construct(x, this._precision);
    const config = construct.config;
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      const pi = construct.pi(resultPrecision);
      const halfPi = pi.div(2);
      const quarterPi = pi.div(4);
      if (this._isInfinityState()) {
        if (bfB._isInfinityState()) {
          if (this._specialState === 1 /* POSITIVE_INFINITY */) {
            return bfB._specialState === 1 /* POSITIVE_INFINITY */ ? quarterPi : pi.sub(quarterPi);
          }
          return bfB._specialState === 1 /* POSITIVE_INFINITY */ ? quarterPi.neg() : pi.sub(quarterPi).neg();
        }
        return this._specialState === 1 /* POSITIVE_INFINITY */ ? halfPi : halfPi.neg();
      }
      if (bfB._specialState === 1 /* POSITIVE_INFINITY */) {
        return this._makeExactResultWithPrecision(0n, resultPrecision);
      }
      return this.isNegative() ? pi.neg() : pi;
    }
    if (this.mantissa === 0n && bfB.mantissa >= 0n) return this._makeExactResult(0n);
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
   */
  sinh() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
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
   */
  cosh() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      return this._specialResult(1 /* POSITIVE_INFINITY */);
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
   */
  tanh() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      return this._makeExactResultWithPrecision(this._specialState === 1 /* POSITIVE_INFINITY */ ? 1n : -1n, this._precision);
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
   */
  asinh() {
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
   */
  acosh() {
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    if (this.lt(1)) {
      if (this.constructor.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
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
   */
  atanh() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      return this._specialResult(3 /* NAN */);
    }
    if (this.eq(1)) {
      if (construct.config.allowSpecialValues) return this._specialResult(1 /* POSITIVE_INFINITY */);
      throw new RangeError("atanh input must be in [-1,1]");
    }
    if (this.eq(-1)) {
      if (construct.config.allowSpecialValues) return this._specialResult(2 /* NEGATIVE_INFINITY */);
      throw new RangeError("atanh input must be in [-1,1]");
    }
    if (this.gt(1) || this.lt(-1)) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
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
  static _atanMachine(invX, precision) {
    const scale = this._getPow10(precision);
    const x = scale / invX;
    const x2 = x * x / scale;
    let term = x;
    let sum = term;
    let sign = -1n;
    let lastTerm = 0n;
    for (let n = 3n; term !== lastTerm; n += 2n) {
      term = term * x2 / scale;
      lastTerm = term;
      sum += sign * term / n;
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
  static _trigFuncsNewton(f, df, initial, precision, maxSteps = 50) {
    const scale = this._getPow10(precision);
    let x = initial;
    for (let i = 0; i < maxSteps; i++) {
      const fx = f(x);
      if (fx === 0n) break;
      const dfx = df(x);
      if (dfx === 0n) throw new NumericalComputationError("Derivative zero during Newton iteration");
      const dx = fx * scale / dfx;
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
  static _sinPi(z, precision) {
    const pi = this._pi(precision);
    const scale = this._getPow10(precision);
    const x = pi * z / scale;
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
  static _exp(x, precision) {
    const scale = this._getPow10(precision);
    let sum = scale;
    let term = scale;
    let n = 1n;
    while (true) {
      term = term * x / (scale * n);
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
  exp() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._makeExactResultWithPrecision(0n, this._precision);
    }
    if (this.mantissa === 0n) return this._makeExactResult(1n);
    if (this._precision <= 15n) {
      const val2 = this.toNumber();
      const eVal = Math.exp(val2);
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
   */
  static _exp2(value, precision, maxSteps) {
    const LN2 = this._ln2(precision, maxSteps);
    const scale = this._getPow10(precision);
    return this._exp(LN2 * value / scale, precision);
  }
  /**
   * 2の冪乗(2^x)を計算する
   * @returns 2^x
   */
  exp2() {
    const construct = this.constructor;
    const config = construct.config;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
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
  static _expm1(value, precision) {
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
        term = term * value / scale;
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
  expm1() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 3 /* NAN */) return this._specialResult(3 /* NAN */);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
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
   * @throws {Error} 値が0以下の場合
   */
  static _ln(value, precision, maxSteps) {
    if (value <= 0n) throw new RangeError("ln(x) is undefined for x <= 0");
    const scale = this._getPow10(precision);
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
    const z = (x - scale) * scale / (x + scale);
    const zSquared = z * z / scale;
    let term = z;
    let result = term;
    for (let n = 1n; n < maxSteps; n++) {
      term = term * zSquared / scale;
      const denom = 2n * n + 1n;
      const addend = term / denom;
      if (addend === 0n) break;
      result += addend;
    }
    const LN10 = this._ln10(precision, maxSteps);
    const finalLn = 2n * result + k * LN10;
    if (value % scale === 0n) {
      this._updateLnCache((value / scale).toString(), finalLn, precision);
    }
    return finalLn;
  }
  /**
   * 自然対数(ln)を計算する
   * @returns ln(x)
   */
  ln() {
    const construct = this.constructor;
    const config = construct.config;
    const maxSteps = config.lnMaxSteps;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    if (this.isZero()) {
      if (config.allowSpecialValues) return this._specialResult(2 /* NEGATIVE_INFINITY */);
      throw new RangeError("ln(x) is undefined for x <= 0");
    }
    if (this.mantissa < 0n) {
      if (config.allowSpecialValues) return this._specialResult(3 /* NAN */);
      throw new RangeError("ln(x) is undefined for x <= 0");
    }
    if (this._getExactInteger() === 1n) return this._makeExactResult(0n);
    if (this._precision <= 15n) {
      const val2 = this.toNumber();
      if (val2 <= 0) throw new RangeError("ln(x) is undefined for x <= 0");
      const logVal = Math.log(val2);
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
   * @throws {Error} 底が1または0の場合
   */
  static _log(value, baseValue, precision, maxSteps) {
    if (value === this._getPow10(precision)) return 0n;
    const lnB = this._ln(baseValue, precision, maxSteps);
    if (lnB === 0n) throw new RangeError("log base cannot be 1 or 0");
    const lnX = this._ln(value, precision, maxSteps);
    const SCALE = this._getPow10(precision);
    return lnX * SCALE / lnB;
  }
  /**
   * 対数を計算する
   * @param base - 底
   * @returns log_base(x)
   */
  log(base) {
    const construct = this.constructor;
    const bfB = base instanceof _BigFloat ? base : new construct(base, this._precision);
    const maxSteps = construct.config.lnMaxSteps;
    const resultPrecision = this._precision > bfB._precision ? this._precision : bfB._precision;
    if (!this._isFiniteState() || !bfB._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this, bfB);
      if (this._isNaNState() || bfB._isNaNState()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (bfB._isInfinityState()) {
        if (bfB._specialState === 2 /* NEGATIVE_INFINITY */) return this._specialResult(3 /* NAN */, resultPrecision);
        if (this._isInfinityState()) return this._specialResult(3 /* NAN */, resultPrecision);
        if (this.mantissa <= 0n) return this._specialResult(3 /* NAN */, resultPrecision);
        if (this._getExactInteger() === 1n) return this._makeExactResultWithPrecision(0n, resultPrecision);
        return this._makeExactResultWithPrecision(0n, resultPrecision);
      }
      if (this._specialState === 2 /* NEGATIVE_INFINITY */) return this._specialResult(3 /* NAN */, resultPrecision);
      if (bfB.mantissa <= 0n || bfB._getExactInteger() === 1n) return this._specialResult(3 /* NAN */, resultPrecision);
      if (bfB.gt(1)) return this._specialResult(1 /* POSITIVE_INFINITY */, resultPrecision);
      return this._specialResult(2 /* NEGATIVE_INFINITY */, resultPrecision);
    }
    const baseExactInteger = bfB._getExactInteger();
    if (baseExactInteger === 1n && construct.config.allowSpecialValues) {
      return this._specialResult(3 /* NAN */, resultPrecision);
    }
    if ((this.mantissa <= 0n || bfB.mantissa <= 0n) && construct.config.allowSpecialValues) {
      if (this.mantissa < 0n || bfB.mantissa < 0n || bfB.isZero()) return this._specialResult(3 /* NAN */, resultPrecision);
      if (this.isZero()) {
        return bfB.gt(1) ? this._specialResult(2 /* NEGATIVE_INFINITY */, resultPrecision) : this._specialResult(1 /* POSITIVE_INFINITY */, resultPrecision);
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
   */
  static _log2(value, precision, maxSteps) {
    const scale = this._getPow10(precision);
    const baseValue = 2n * scale;
    return this._log(value, baseValue, precision, maxSteps);
  }
  /**
   * 2を底とする対数(log2)を計算する
   * @returns log2(x)
   */
  log2() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    if (this.isZero()) {
      if (construct.config.allowSpecialValues) return this._specialResult(2 /* NEGATIVE_INFINITY */);
      throw new RangeError("ln(x) is undefined for x <= 0");
    }
    if (this.mantissa < 0n) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
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
   */
  static _log10(value, precision, maxSteps) {
    const baseValue = this._getPow10(precision + 1n);
    return this._log(value, baseValue, precision, maxSteps);
  }
  /**
   * 10を底とする対数(log10)を計算する
   * @returns log10(x)
   */
  log10() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    if (this.isZero()) {
      if (construct.config.allowSpecialValues) return this._specialResult(2 /* NEGATIVE_INFINITY */);
      throw new RangeError("ln(x) is undefined for x <= 0");
    }
    if (this.mantissa < 0n) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
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
   */
  static _log1p(value, precision, maxSteps) {
    const scale = this._getPow10(precision);
    const onePlusX = scale + value;
    return this._ln(onePlusX, precision, maxSteps);
  }
  /**
   * ln(1 + x) を計算する
   * @returns ln(1 + x)
   */
  log1p() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    if (this._getExactInteger() === -1n) {
      if (construct.config.allowSpecialValues) return this._specialResult(2 /* NEGATIVE_INFINITY */);
      throw new RangeError("ln(x) is undefined for x <= 0");
    }
    if (this.lt(-1) && construct.config.allowSpecialValues) {
      return this._specialResult(3 /* NAN */);
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
   */
  static _ln10(precision, maxSteps = 10000n) {
    const key = "10";
    if (this._getCheckLnCache(key, precision)) {
      return this._getLnCache(key, precision);
    }
    const seed = this._getLnSeedCache(key, precision);
    if (seed) {
      const scale2 = this._getPow10(precision);
      const refined = this._refineLogConstantFromCache(10n * scale2, seed, precision);
      this._updateLnCache(key, refined, precision);
      return refined;
    }
    const scale = this._getPow10(precision);
    const x = 10n * scale;
    const z = (x - scale) * scale / (x + scale);
    const zSquared = z * z / scale;
    let term = z;
    let result = term;
    for (let n = 1n; n < maxSteps; n++) {
      term = term * zSquared / scale;
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
   */
  static _ln2(precision, maxSteps) {
    const key = "2";
    if (this._getCheckLnCache(key, precision)) {
      return this._getLnCache(key, precision);
    }
    const seed = this._getLnSeedCache(key, precision);
    if (seed) {
      const scale2 = this._getPow10(precision);
      const refined = this._refineLogConstantFromCache(2n * scale2, seed, precision);
      this._updateLnCache(key, refined, precision);
      return refined;
    }
    const scale = this._getPow10(precision);
    const x = 2n * scale;
    const z = (x - scale) * scale / (x + scale);
    const zSquared = z * z / scale;
    let term = z;
    let result = term;
    for (let n = 1n; n < maxSteps; n++) {
      term = term * zSquared / scale;
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
   */
  static _e(precision) {
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
   */
  static e(precision = this.DEFAULT_PRECISION) {
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
   */
  static _piChudnovsky(precision = this.DEFAULT_PRECISION) {
    const scale = this._getPow10(precision);
    const digitsPerTerm = 14n;
    const terms = precision / digitsPerTerm + 1n;
    const C = 426880n * this._sqrt(10005n * scale, precision);
    let sum = 0n;
    function bigPower(base, exp) {
      let res = 1n;
      for (let i = 0n; i < exp; i++) res *= base;
      return res;
    }
    for (let k = 0n; k < terms; k++) {
      const numerator = this._factorial(6n * k) * (545140134n * k + 13591409n) * (k % 2n === 0n ? 1n : -1n);
      const denominator = this._factorial(3n * k) * bigPower(this._factorial(k), 3n) * bigPower(640320n, 3n * k);
      sum += scale * numerator / denominator;
    }
    if (sum === 0n) {
      console.error("Chudnovsky\u6CD5\u306E\u8A08\u7B97\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
      return 0n;
    }
    return C * scale / sum;
  }
  /**
   * 設定されたアルゴリズムで円周率を計算する (内部用)
   * @param precision - 精度
   * @returns 円周率
   */
  static _pi(precision) {
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
   */
  static pi(precision = this.DEFAULT_PRECISION) {
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
  static _tau(precision) {
    const pi = this._pi(precision);
    return pi * 2n;
  }
  /**
   * タウ(tau = 2*pi)を取得する
   * @param precision - 精度
   * @returns tau
   */
  static tau(precision = this.DEFAULT_PRECISION) {
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
   */
  static abs(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).abs();
  }
  /**
   * Math.acos() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 逆余弦
   */
  static acos(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).acos();
  }
  /**
   * Math.acosh() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 逆双曲線余弦
   */
  static acosh(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).acosh();
  }
  /**
   * Math.asin() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 逆正弦
   */
  static asin(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).asin();
  }
  /**
   * Math.asinh() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 逆双曲線正弦
   */
  static asinh(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).asinh();
  }
  /**
   * Math.atan() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 逆正接
   */
  static atan(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).atan();
  }
  /**
   * Math.atan2() 相当
   * @param y - y座標
   * @param x - x座標
   * @param precision - 結果精度
   * @returns 逆正接
   */
  static atan2(y, x, precision) {
    const precisionBig = this._resolvePrecisionFromValues([y, x], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(y, precisionBig).atan2(this._coerceBigFloatValue(x, precisionBig));
  }
  /**
   * Math.atanh() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 逆双曲線正接
   */
  static atanh(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).atanh();
  }
  /**
   * Math.cbrt() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 立方根
   */
  static cbrt(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).cbrt();
  }
  /**
   * Math.ceil() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 切り上げ結果
   */
  static ceil(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).ceil();
  }
  /**
   * Math.clz32() 相当
   * @param value - 対象値
   * @returns 先頭ゼロビット数
   */
  static clz32(value) {
    const precisionBig = this._resolvePrecisionFromValues([value], this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).clz32();
  }
  /**
   * Math.cos() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 余弦
   */
  static cos(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).cos();
  }
  /**
   * Math.cosh() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 双曲線余弦
   */
  static cosh(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).cosh();
  }
  /**
   * Math.exp() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 指数関数
   */
  static exp(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).exp();
  }
  /**
   * Math.expm1() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns e^x - 1
   */
  static expm1(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).expm1();
  }
  /**
   * Math.floor() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 切り捨て結果
   */
  static floor(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).floor();
  }
  /**
   * Math.fround() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns Float32相当に丸めた結果
   */
  static fround(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).fround();
  }
  /**
   * Math.hypot() 相当
   * @param values - 値の列
   * @returns sqrt(sum(x_i^2))
   */
  static hypot(...values) {
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
   */
  static imul(lhs, rhs) {
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
   */
  static log(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).ln();
  }
  /**
   * Math.log10() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 常用対数
   */
  static log10(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).log10();
  }
  /**
   * Math.log1p() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns ln(1 + x)
   */
  static log1p(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).log1p();
  }
  /**
   * Math.log2() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 底2対数
   */
  static log2(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).log2();
  }
  /**
   * Math.max() 相当
   * @param args - 数値のリスト
   * @returns 最大値
   */
  static max(...args) {
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
   */
  static min(...args) {
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
   */
  static pow(base, exponent, precision) {
    const precisionBig = this._resolvePrecisionFromValues([base, exponent], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(base, precisionBig).pow(this._coerceBigFloatValue(exponent, precisionBig));
  }
  /**
   * Math.round() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 四捨五入結果
   */
  static round(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).round();
  }
  /**
   * Math.sign() 相当
   * @param value - 対象値
   * @param precision - 入力精度
   * @returns 符号
   */
  static sign(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).sign();
  }
  /**
   * Math.sin() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 正弦
   */
  static sin(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).sin();
  }
  /**
   * Math.sinh() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 双曲線正弦
   */
  static sinh(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).sinh();
  }
  /**
   * Math.sqrt() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 平方根
   */
  static sqrt(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).sqrt();
  }
  /**
   * Math.tan() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 正接
   */
  static tan(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).tan();
  }
  /**
   * Math.tanh() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 双曲線正接
   */
  static tanh(value, precision) {
    const precisionBig = this._resolvePrecisionFromValues([value], precision ?? this.DEFAULT_PRECISION);
    return this._coerceBigFloatValue(value, precisionBig).tanh();
  }
  /**
   * Math.trunc() 相当
   * @param value - 対象値
   * @param precision - 結果精度
   * @returns 切り捨て結果
   */
  static trunc(value, precision) {
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
   */
  static sum(...args) {
    const arr = this._normalizeArgs(args).map((x) => x instanceof _BigFloat ? x : new this(x));
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
   */
  static product(...args) {
    const arr = this._normalizeArgs(args).map((x) => x instanceof _BigFloat ? x : new this(x));
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
   */
  static average(...args) {
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
  static median(...args) {
    const arr = this._normalizeArgs(args).map((x) => x instanceof _BigFloat ? x : new this(x));
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
   * @throws {Error} 引数が空の場合
   */
  static variance(...args) {
    const arr = this._normalizeArgs(args).map((x) => x instanceof _BigFloat ? x : new this(x));
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
   */
  static stddev(...args) {
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
  static _randomBigInt(precision) {
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
   */
  static random(precision = this.DEFAULT_PRECISION) {
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
  static _integral(f, a, b, n, precision) {
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
    return delta * sum / denominator;
  }
  /**
   * 連続する整数の冪乗を計算する (内部用)
   * (n * scale)^-s を n=1..N について計算する
   * @param s - 指数
   * @param N - 最大の整数
   * @param precision - 精度
   * @returns 冪乗の結果の配列 (1-indexed)
   */
  static _computePowers(s, N, precision) {
    const scale = this._getPow10(precision);
    const results = new Array(N + 1);
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
        results[i] = results[p] * results[m] / scale;
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
  static _bernoulliNumbers(n, precision) {
    const A = new Array(n + 1).fill(0n);
    const B = new Array(n + 1).fill(0n);
    const scale = this._getPow10(precision);
    for (let m = 0; m <= n; m++) {
      A[m] = scale / BigInt(m + 1);
      for (let j = m; j >= 1; j--) {
        const term = A[j - 1] - A[j];
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
  static _ln2pi(precision) {
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
  static _getBernoulliNumbers(n, precision) {
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
  static _zetaPoleCancellationDigits(value, precision) {
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
   */
  static _zetaPositiveEvenInteger(exponent, precision) {
    const scale = this._getPow10(precision);
    const order = Number(exponent);
    const halfOrder = Number(exponent / 2n);
    const bNumbers = this._getBernoulliNumbers(order, precision);
    const b2n = bNumbers[order];
    const twoPi = 2n * this._pi(precision);
    const power = this._pow(twoPi, exponent * scale, precision);
    let result = b2n * power / scale / this._factorial(exponent);
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
  static _zetaNegativeInteger(absoluteInteger, precision) {
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
   */
  static _zetaEulerMaclaurinEstimate(s, precision, terms) {
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
    result += nPowOneMinusS * scale / (s - scale);
    const bernoulliTerms = Math.max(8, Math.ceil(Number(precision) / 4) + 10);
    const bNumbers = this._getBernoulliNumbers(2 * bernoulliTerms, precision);
    const nInv2 = nValue * nValue;
    let rising = s;
    let factorial = 2n;
    let nPow = this._pow(nScaled, -(s + scale), precision);
    for (let k = 1; k <= bernoulliTerms; k++) {
      const b2k = bNumbers[2 * k];
      let correction = b2k / factorial;
      correction = correction * rising / scale;
      correction = correction * nPow / scale;
      result += correction;
      if (correction === 0n && k > 2) break;
      const factorA = s + BigInt(2 * k - 1) * scale;
      const factorB = s + BigInt(2 * k) * scale;
      rising = rising * factorA / scale;
      rising = rising * factorB / scale;
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
   */
  static _zetaPositive(s, precision) {
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
    let terms = Math.max(16, Math.ceil(Number(precision) / 6) + 12);
    let previous = null;
    let current = 0n;
    for (let attempt = 0; attempt < 6; attempt++) {
      current = this._zetaEulerMaclaurinEstimate(s, precision, terms);
      if (previous !== null) {
        const diff = current >= previous ? current - previous : previous - current;
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
   */
  static _zetaEta(s, precision) {
    const scale = this._getPow10(precision);
    const termCount = Math.max(18, Math.ceil(Number(precision) * Math.log2(10)) + 12);
    const powers = this._computePowers(s, termCount + 1, precision);
    const differences = new Array(termCount + 1);
    for (let i = 0; i <= termCount; i++) {
      differences[i] = powers[i + 1];
    }
    let eta = 0n;
    let weight = scale / 2n;
    for (let order = 0; order <= termCount && weight !== 0n; order++) {
      eta += differences[0] * weight / scale;
      for (let i = 0; i < termCount - order; i++) {
        differences[i] = differences[i] - differences[i + 1];
      }
      weight /= 2n;
    }
    const ln2 = this._ln2(precision, this.config.lnMaxSteps);
    const exponent = (scale - s) * ln2 / scale;
    const denominator = -this._expm1(exponent, precision);
    if (denominator === 0n) throw new RangeError("zeta(s) has a pole at s = 1");
    return eta * scale / denominator;
  }
  /**
   * Riemann zeta 関数を計算する (内部用)
   * @param s - 値
   * @param precision - 精度
   * @returns zeta(s)
   */
  static _zeta(s, precision) {
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
    let result = twoPowS * piPow / scale;
    result = result * sinTerm / scale;
    result = result * gammaTerm / scale;
    result = result * reflected / scale;
    return result;
  }
  /**
   * ガンマ関数をStirlingの近似で計算する (内部用)
   * @param z - 値
   * @param precision - 精度
   * @returns ガンマ関数
   * @throws {Error} 負の整数の場合
   */
  static _gammaLanczos(z, precision) {
    const scale = this._getPow10(precision);
    const half_scale = scale / 2n;
    if (z <= 0n && z % scale === 0n) {
      throw new RangeError("z must not be a non-positive integer (pole)");
    }
    if (z < half_scale) {
      const config = this.config;
      const maxSteps = config.trigFuncsMaxSteps;
      const pi = this._pi(precision);
      const oneMinusZ = scale - z;
      const gammaOneMinusZ = this._gammaLanczos(oneMinusZ, precision);
      const pi_z = pi * z / scale;
      const sin_pi_z = this._sin(pi_z, precision, maxSteps);
      const denominator = sin_pi_z * gammaOneMinusZ / scale;
      if (denominator === 0n) throw new DivisionByZeroError("division by zero");
      return pi * scale / denominator;
    }
    let product = scale;
    let currentZ = z;
    const threshold = precision * 2n + 50n;
    while (currentZ < threshold * scale) {
      product = product * currentZ / scale;
      currentZ += scale;
    }
    const lnZ = this._ln(currentZ, precision, this.config.lnMaxSteps);
    const term1 = (currentZ - half_scale) * lnZ / scale;
    const term2 = currentZ;
    const term3 = this._ln2pi(precision) / 2n;
    let sum = 0n;
    const zInv = scale * scale / currentZ;
    const zInv2 = zInv * zInv / scale;
    let zInvPow = zInv;
    const numTerms = Math.floor(Number(precision) / 6) + 10;
    const bNumbers = this._getBernoulliNumbers(2 * numTerms, precision);
    for (let n = 1; n <= numTerms; n++) {
      const b2n = bNumbers[2 * n];
      const denom = BigInt(2 * n * (2 * n - 1));
      const term = b2n * zInvPow / (denom * scale);
      if (term === 0n && n > 1) break;
      sum += term;
      zInvPow = zInvPow * zInv2 / scale;
    }
    const lnGamma = term1 - term2 + term3 + sum;
    const gammaLarge = this._exp(lnGamma, precision);
    return gammaLarge * scale / product;
  }
  /**
   * ガンマ関数を計算する
   * @returns ガンマ関数
   */
  gamma() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    const totalPr = this._precision + construct.config.extraPrecision;
    const val = this._getInternalValue(totalPr);
    const raw = construct._gammaLanczos(val, totalPr);
    return this._makeResult(raw, this._precision, totalPr);
  }
  /**
   * Riemann zeta 関数を計算する
   * @returns zeta(this)
   */
  zeta() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._makeExactResult(1n);
      return this._specialResult(3 /* NAN */);
    }
    const exactInteger = this._getExactInteger();
    if (exactInteger === 1n) {
      if (construct.config.allowSpecialValues) return this._specialResult(1 /* POSITIVE_INFINITY */);
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
  static _factorial(n) {
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
  static _factorialGamma(n, precision) {
    const scale = this._getPow10(precision);
    return this._gammaLanczos(n + scale, precision);
  }
  /**
   * 階乗を計算する
   * @returns 階乗
   */
  factorial() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
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
  static _binomial(n, k) {
    if (k > n) return 0n;
    if (k > n - k) k = n - k;
    let result = 1n;
    for (let i = 1n; i <= k; i++) {
      result = result * (n - i + 1n) / i;
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
  static _getCheckPiCache(precision) {
    const cachedData = this._piCache;
    return !!(cachedData && cachedData.precision >= precision);
  }
  /**
   * 円周率キャッシュを取得する (内部用)
   * @param precision - 必要精度
   * @returns キャッシュされた値
   * @throws {Error} キャッシュが存在しない場合
   */
  static _getPiCache(precision) {
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
  static _updatePiCache(value, precision) {
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
  static _getCheckECache(precision) {
    const cachedData = this._eCache;
    return !!(cachedData && cachedData.precision >= precision);
  }
  /**
   * eキャッシュを取得する (内部用)
   * @param precision - 必要精度
   * @returns キャッシュされた値
   * @throws {Error} キャッシュが存在しない場合
   */
  static _getECache(precision) {
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
  static _updateECache(value, precision) {
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
  static _getPiSeedCache(precision) {
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
  static _getCheckLnCache(key, precision) {
    const cachedData = this._lnCache[key];
    return !!(cachedData && cachedData.precision >= precision);
  }
  /**
   * 対数キャッシュを取得する (内部用)
   * @param key - キャッシュキー
   * @param precision - 必要精度
   * @returns キャッシュされた値
   * @throws {Error} キャッシュが存在しない場合
   */
  static _getLnCache(key, precision) {
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
  static _updateLnCache(key, value, precision) {
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
  static _getLnSeedCache(key, precision) {
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
  static _rescaleInternalValue(value, fromPrecision, toPrecision) {
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
  static _refinePiFromCache(seed, precision) {
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
        const refined = estimate - sinValue * scale / cosValue;
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
  static _refineLogConstantFromCache(value, seed, precision) {
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
        const refined = estimate - scale + valueAtPrecision * scale / expEstimate;
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
  static _getPow5(n) {
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
  static _getPow2(n) {
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
  static _getPow10(n) {
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
   * @throws {Error} 特殊値が無効な場合
   */
  static nan(precision = this.DEFAULT_PRECISION) {
    return this._createSpecialValue(3 /* NAN */, BigInt(precision));
  }
  /**
   * 定数 Infinity を取得する
   * @param precision - 精度
   * @returns Infinity
   * @throws {Error} 特殊値が無効な場合
   */
  static infinity(precision = this.DEFAULT_PRECISION) {
    return this._createSpecialValue(1 /* POSITIVE_INFINITY */, BigInt(precision));
  }
  /**
   * 定数 -Infinity を取得する
   * @param precision - 精度
   * @returns -Infinity
   * @throws {Error} 特殊値が無効な場合
   */
  static negativeInfinity(precision = this.DEFAULT_PRECISION) {
    return this._createSpecialValue(2 /* NEGATIVE_INFINITY */, BigInt(precision));
  }
  /**
   * 定数 -10 を取得する
   * @param precision - 精度
   * @returns -10
   */
  static minusTen(precision = this.DEFAULT_PRECISION) {
    return new this(-10, precision);
  }
  /**
   * 定数 -2 を取得する
   * @param precision - 精度
   * @returns -2
   */
  static minusTwo(precision = this.DEFAULT_PRECISION) {
    return new this(-2, precision);
  }
  /**
   * 定数 -1 を取得する
   * @param precision - 精度
   * @returns -1
   */
  static minusOne(precision = this.DEFAULT_PRECISION) {
    return new this(-1, precision);
  }
  /**
   * 定数 0 を取得する
   * @param precision - 精度
   * @returns 0
   */
  static zero(precision = this.DEFAULT_PRECISION) {
    return new this(0, precision);
  }
  /**
   * 定数 0.25 を取得する
   * @param precision - 精度
   * @returns 0.25
   */
  static quarter(precision = this.DEFAULT_PRECISION) {
    return new this("0.25", precision);
  }
  /**
   * 定数 0.5 を取得する
   * @param precision - 精度
   * @returns 0.5
   */
  static half(precision = this.DEFAULT_PRECISION) {
    return new this("0.5", precision);
  }
  /**
   * 定数 1 を取得する
   * @param precision - 精度
   * @returns 1
   */
  static one(precision = this.DEFAULT_PRECISION) {
    return new this(1, precision);
  }
  /**
   * 定数 2 を取得する
   * @param precision - 精度
   * @returns 2
   */
  static two(precision = this.DEFAULT_PRECISION) {
    return new this(2, precision);
  }
  /**
   * 定数 10 を取得する
   * @param precision - 精度
   * @returns 10
   */
  static ten(precision = this.DEFAULT_PRECISION) {
    return new this(10, precision);
  }
  /**
   * 定数 100 を取得する
   * @param precision - 精度
   * @returns 100
   */
  static hundred(precision = this.DEFAULT_PRECISION) {
    return new this(100, precision);
  }
  /**
   * 定数 1000 を取得する
   * @param precision - 精度
   * @returns 1000
   */
  static thousand(precision = this.DEFAULT_PRECISION) {
    return new this(1e3, precision);
  }
};
function bigFloat(value, precision) {
  return new BigFloat(value, precision);
}

// src/bigFloatStream.ts
var BIGFLOAT_STREAM_SKIP = /* @__PURE__ */ Symbol("BIGFLOAT_STREAM_SKIP");
var BigFloatStream = class _BigFloatStream {
  /** mapステージ定義 */
  static _mapStageDefinition = {
    createState: () => null,
    process: (value, _state, data) => data(value)
  };
  /** filterステージ定義 */
  static _filterStageDefinition = {
    createState: () => null,
    process: (value, _state, data) => data(value) ? value : BIGFLOAT_STREAM_SKIP
  };
  /** peekステージ定義 */
  static _peekStageDefinition = {
    createState: () => null,
    process: (value, _state, data) => {
      data(value);
      return value;
    }
  };
  /** flatMapステージ定義 */
  static _flatMapStageDefinition = {
    createState: () => null,
    process: (value, _state, data, context, nextStageIndex) => {
      context.pushIterator(_BigFloatStream._toIterator(data(value), value._precision), nextStageIndex);
      return BIGFLOAT_STREAM_SKIP;
    }
  };
  /** distinctステージ定義 */
  static _distinctStageDefinition = {
    createState: () => /* @__PURE__ */ new Set(),
    process: (value, state, data) => {
      const seen = state;
      const key = data(value);
      if (seen.has(key)) return BIGFLOAT_STREAM_SKIP;
      seen.add(key);
      return value;
    }
  };
  /** limitステージ定義 */
  static _limitStageDefinition = {
    createState: (data) => ({ remaining: data }),
    process: (value, state, _data, context) => {
      const limitState = state;
      if (limitState.remaining <= 0) {
        context.stop();
        return BIGFLOAT_STREAM_SKIP;
      }
      limitState.remaining--;
      return value;
    }
  };
  /** skipステージ定義 */
  static _skipStageDefinition = {
    createState: (data) => ({ remaining: data }),
    process: (value, state) => {
      const skipState = state;
      if (skipState.remaining > 0) {
        skipState.remaining--;
        return BIGFLOAT_STREAM_SKIP;
      }
      return value;
    }
  };
  /** 内部イテレータファクトリ */
  _sourceFactory;
  /** 直前のストリーム */
  _previousStream;
  /** 現在のステージ定義 */
  _stageDefinition;
  /** 現在のステージデータ */
  _stageData;
  /**
   * @param source - BigFloatの反復可能オブジェクト
   */
  constructor(source) {
    if (typeof source === "function") {
      this._sourceFactory = source;
    } else {
      this._sourceFactory = () => source[Symbol.iterator]();
    }
    this._previousStream = null;
    this._stageDefinition = null;
    this._stageData = null;
  }
  /**
   * 内部状態からストリームを生成する
   * @param sourceFactory - ソースファクトリ
   * @param previousStream - 直前のストリーム
   * @param stageDefinition - ステージ定義
   * @param stageData - ステージデータ
   * @returns BigFloatStream
   */
  static _fromState(sourceFactory, previousStream, stageDefinition, stageData) {
    const stream = Object.create(_BigFloatStream.prototype);
    stream._sourceFactory = sourceFactory;
    stream._previousStream = previousStream;
    stream._stageDefinition = stageDefinition;
    stream._stageData = stageData;
    return stream;
  }
  /**
   * 値をBigFloatへ変換する
   * @param value - 変換する値
   * @param precision - 精度
   * @returns BigFloat
   */
  static _toBigFloat(value, precision) {
    if (value instanceof BigFloat) {
      if (precision === void 0 || value._precision === precision) return value;
      return value.clone().changePrecision(precision);
    }
    return new BigFloat(value, precision ?? BigFloat.DEFAULT_PRECISION);
  }
  /**
   * 値をBigFloatのイテレータに変換する
   * @param iterable - 変換する反復可能オブジェクト
   * @param precision - 精度
   * @returns BigFloatのイテレータ
   */
  static _toIterator(iterable, precision) {
    return (function* () {
      for (const item of iterable) {
        yield _BigFloatStream._toBigFloat(item, precision);
      }
    })();
  }
  /**
   * ストリームの精度を解決する
   * @param values - 値
   * @param precision - 明示精度
   * @returns 精度
   */
  static _resolvePrecision(values, precision) {
    if (precision !== void 0) return BigInt(precision);
    let resolved = BigFloat.DEFAULT_PRECISION;
    for (const value of values) {
      if (value instanceof BigFloat && value._precision > resolved) {
        resolved = value._precision;
      }
    }
    return resolved;
  }
  /**
   * 要素数を正規化する
   * @param count - 要素数
   * @returns 正規化された要素数
   * @throws {RangeError} 要素数が不正な場合
   */
  static _normalizeCount(count) {
    if (!Number.isFinite(count)) throw new RangeError("Count must be finite");
    const normalized = Math.trunc(count);
    if (normalized < 0) throw new RangeError("Count must be non-negative");
    return normalized;
  }
  /**
   * 空のストリームを生成する
   * @returns 空のストリーム
   */
  static empty() {
    return new _BigFloatStream(() => [][Symbol.iterator]());
  }
  /**
   * 反復可能オブジェクトからBigFloatStreamを作成する
   * @param iterable - BigFloatの反復可能オブジェクト
   * @param precision - 変換時の精度
   * @returns BigFloatStreamインスタンス
   */
  static from(iterable, precision) {
    if (precision === void 0) {
      return new _BigFloatStream(function* () {
        for (const item of iterable) {
          yield item instanceof BigFloat ? item : new BigFloat(item);
        }
      });
    }
    const precisionBig = BigInt(precision);
    return new _BigFloatStream(function* () {
      for (const item of iterable) {
        yield _BigFloatStream._toBigFloat(item, precisionBig);
      }
    });
  }
  /**
   * 値のリストからBigFloatStreamを作成する
   * @param values - 値のリスト
   * @returns BigFloatStreamインスタンス
   */
  static of(...values) {
    return this.from(values);
  }
  /**
   * 等差数列を生成する
   * @param start - 初項
   * @param step - 公差
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static arithmetic(start, step, count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = this._resolvePrecision([start, step], precision);
    return new _BigFloatStream(function* () {
      let current = _BigFloatStream._toBigFloat(start, resolvedPrecision);
      const stepValue = _BigFloatStream._toBigFloat(step, resolvedPrecision);
      for (let i = 0; i < normalizedCount; i++) {
        yield current;
        if (i + 1 < normalizedCount) current = current.add(stepValue);
      }
    });
  }
  /**
   * 等比数列を生成する
   * @param start - 初項
   * @param ratio - 公比
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static geometric(start, ratio, count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = this._resolvePrecision([start, ratio], precision);
    return new _BigFloatStream(function* () {
      let current = _BigFloatStream._toBigFloat(start, resolvedPrecision);
      const ratioValue = _BigFloatStream._toBigFloat(ratio, resolvedPrecision);
      for (let i = 0; i < normalizedCount; i++) {
        yield current;
        if (i + 1 < normalizedCount) current = current.mul(ratioValue);
      }
    });
  }
  /**
   * 指定個数で等間隔な値を生成する
   * @param start - 開始値
   * @param end - 終了値
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static linspace(start, end, count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = this._resolvePrecision([start, end], precision);
    return new _BigFloatStream(function* () {
      const startValue = _BigFloatStream._toBigFloat(start, resolvedPrecision);
      if (normalizedCount === 1) {
        yield startValue;
        return;
      }
      const endValue = _BigFloatStream._toBigFloat(end, resolvedPrecision);
      const stepValue = endValue.sub(startValue).div(normalizedCount - 1);
      let current = startValue;
      for (let i = 0; i < normalizedCount; i++) {
        if (i === normalizedCount - 1) {
          yield endValue;
        } else {
          yield current;
          current = current.add(stepValue);
        }
      }
    });
  }
  /**
   * 10を底とする対数間隔の値を生成する
   * @param start - 開始指数
   * @param end - 終了指数
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static logspace(start, end, count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = this._resolvePrecision([start, end], precision);
    return new _BigFloatStream(function* () {
      const base = new BigFloat(10, resolvedPrecision);
      const startValue = _BigFloatStream._toBigFloat(start, resolvedPrecision);
      let current = base.pow(startValue);
      if (normalizedCount === 1) {
        yield current;
        return;
      }
      const endValue = _BigFloatStream._toBigFloat(end, resolvedPrecision);
      const endTerm = base.pow(endValue);
      const stepExponent = endValue.sub(startValue).div(normalizedCount - 1);
      const ratio = base.pow(stepExponent);
      for (let i = 0; i < normalizedCount; i++) {
        if (i === normalizedCount - 1) {
          yield endTerm;
        } else {
          yield current;
          current = current.mul(ratio);
        }
      }
    });
  }
  /**
   * 調和級数を生成する
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static harmonic(count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = precision === void 0 ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
    return new _BigFloatStream(function* () {
      const one = new BigFloat(1, resolvedPrecision);
      for (let i = 1; i <= normalizedCount; i++) {
        yield one.div(i);
      }
    });
  }
  /**
   * 乱数列を生成する
   * @param count - 要素数
   * @param options - 生成オプション
   * @returns BigFloatStreamインスタンス
   */
  static random(count, options = {}) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const min = options.min ?? 0;
    const max = options.max ?? 1;
    const resolvedPrecision = this._resolvePrecision([min, max], options.precision);
    return new _BigFloatStream(function* () {
      const minValue = _BigFloatStream._toBigFloat(min, resolvedPrecision);
      const maxValue = _BigFloatStream._toBigFloat(max, resolvedPrecision);
      const span = maxValue.sub(minValue);
      if (span.lt(0)) throw new RangeError("Random range requires max >= min");
      if (span.isZero()) {
        yield* _BigFloatStream.repeat(minValue, normalizedCount, resolvedPrecision);
        return;
      }
      for (let i = 0; i < normalizedCount; i++) {
        yield minValue.add(span.mul(BigFloat.random(resolvedPrecision)));
      }
    });
  }
  /**
   * 同じ値を繰り返す
   * @param value - 繰り返す値
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static repeat(value, count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = this._resolvePrecision([value], precision);
    return new _BigFloatStream(function* () {
      const baseValue = _BigFloatStream._toBigFloat(value, resolvedPrecision);
      for (let i = 0; i < normalizedCount; i++) {
        yield baseValue.clone();
      }
    });
  }
  /**
   * フィボナッチ数列を生成する
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static fibonacci(count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = precision === void 0 ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
    return new _BigFloatStream(function* () {
      let a = new BigFloat(0, resolvedPrecision);
      let b = new BigFloat(1, resolvedPrecision);
      for (let i = 0; i < normalizedCount; i++) {
        yield a;
        const next = a.add(b);
        a = b;
        b = next;
      }
    });
  }
  /**
   * 階乗列を生成する
   * @param count - 要素数
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static factorial(count, precision) {
    const normalizedCount = this._normalizeCount(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = precision === void 0 ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
    return new _BigFloatStream(function* () {
      let current = new BigFloat(1, resolvedPrecision);
      for (let i = 0; i < normalizedCount; i++) {
        yield current;
        current = current.mul(i + 1);
      }
    });
  }
  /**
   * 範囲を生成する
   * @param start - 開始値
   * @param end - 終了値
   * @param step - ステップ
   * @param precision - 精度
   * @returns BigFloatStreamインスタンス
   */
  static range(start, end, step = 1, precision) {
    const actualStart = end === void 0 ? 0 : start;
    const actualEnd = end === void 0 ? start : end;
    const resolvedPrecision = this._resolvePrecision([actualStart, actualEnd, step], precision);
    return new _BigFloatStream(function* () {
      let current = _BigFloatStream._toBigFloat(actualStart, resolvedPrecision);
      const endValue = _BigFloatStream._toBigFloat(actualEnd, resolvedPrecision);
      const stepValue = _BigFloatStream._toBigFloat(step, resolvedPrecision);
      if (stepValue.isZero()) throw new RangeError("Step cannot be zero");
      if (stepValue.gt(0)) {
        while (current.lt(endValue)) {
          yield current;
          current = current.add(stepValue);
        }
      } else {
        while (current.gt(endValue)) {
          yield current;
          current = current.add(stepValue);
        }
      }
    });
  }
  /**
   * ストリームを複製する
   * @returns 複製されたストリーム
   */
  clone() {
    return this._fork();
  }
  /**
   * 現在の状態を引き継いだストリームを生成する
   * @param sourceFactory - ソースファクトリ
   * @param previousStream - 直前のストリーム
   * @param stageDefinition - ステージ定義
   * @param stageData - ステージデータ
   * @returns 新しいストリーム
   */
  _fork(sourceFactory = this._sourceFactory, previousStream = this._previousStream, stageDefinition = this._stageDefinition, stageData = this._stageData) {
    return _BigFloatStream._fromState(sourceFactory, previousStream, stageDefinition, stageData);
  }
  /**
   * パイプラインステージを追加する
   * @param stage - ステージ
   * @returns 新しいストリーム
   */
  _use(stage) {
    return this._fork(this._sourceFactory, this, stage.definition, stage.data);
  }
  /**
   * パイプラインを配列化する
   * @returns ステージ配列
   */
  _collectPipelineStages() {
    const stages = [];
    for (let stream = this; stream; stream = stream._previousStream) {
      if (stream._stageDefinition === null) continue;
      stages.push({ definition: stream._stageDefinition, data: stream._stageData });
    }
    stages.reverse();
    return stages;
  }
  // ==================================================
  // Pipeline Operations
  // ==================================================
  /**
   * 各要素を変換する
   * @param fn - 変換関数
   * @returns 変換されたストリーム
   */
  map(fn) {
    return this._use({ definition: _BigFloatStream._mapStageDefinition, data: fn });
  }
  /**
   * 要素をフィルタリングする
   * @param fn - 判定関数
   * @returns フィルタリングされたストリーム
   */
  filter(fn) {
    return this._use({ definition: _BigFloatStream._filterStageDefinition, data: fn });
  }
  /**
   * 要素を平坦化して変換する
   * @param fn - 変換関数
   * @returns 平坦化されたストリーム
   */
  flatMap(fn) {
    return this._use({ definition: _BigFloatStream._flatMapStageDefinition, data: fn });
  }
  /**
   * 重複を除去する
   * @param keyFn - キー生成関数
   * @returns 重複が除去されたストリーム
   */
  distinct(keyFn = (x) => x.toString()) {
    return this._use({ definition: _BigFloatStream._distinctStageDefinition, data: keyFn });
  }
  /**
   * 要素をソートする (終端操作ではないが、全要素を内部で保持する)
   * @param compareFn - 比較関数
   * @returns ソートされたストリーム
   */
  sorted(compareFn = (a, b) => a.compare(b)) {
    const current = this.clone();
    return this._fork(
      function* () {
        const arr = current.toArray();
        arr.sort(compareFn);
        yield* arr;
      },
      null,
      null,
      null
    );
  }
  /**
   * 各要素に対してアクションを実行する (ストリームは維持)
   * @param fn - アクション関数
   * @returns 自身
   */
  peek(fn) {
    return this._use({ definition: _BigFloatStream._peekStageDefinition, data: fn });
  }
  /**
   * 各要素に対してアクションを実行する (ストリームは維持)
   * @param fn - アクション関数
   * @returns 自身
   */
  tap(fn) {
    return this.peek(fn);
  }
  /**
   * 要素数を制限する
   * @param n - 最大要素数
   * @returns 制限されたストリーム
   */
  limit(n) {
    if (n <= 0) {
      return this._fork(() => [][Symbol.iterator](), null, null, null);
    }
    return this._use({ definition: _BigFloatStream._limitStageDefinition, data: n });
  }
  /**
   * 要素数を制限する
   * @param n - 最大要素数
   * @returns 制限されたストリーム
   */
  take(n) {
    return this.limit(n);
  }
  /**
   * 指定した要素数をスキップする
   * @param n - スキップする数
   * @returns スキップされたストリーム
   */
  skip(n) {
    if (n <= 0) return this;
    return this._use({ definition: _BigFloatStream._skipStageDefinition, data: n });
  }
  /**
   * 指定した要素数をスキップする
   * @param n - スキップする数
   * @returns スキップされたストリーム
   */
  drop(n) {
    return this.skip(n);
  }
  /**
   * 末尾にストリームを連結する
   * @param iterables - 連結するストリーム
   * @returns 連結後のストリーム
   */
  concat(...iterables) {
    const current = this.clone();
    return this._fork(
      function* () {
        yield* current;
        for (const iterable of iterables) {
          yield* _BigFloatStream._toIterator(iterable);
        }
      },
      null,
      null,
      null
    );
  }
  // ==================================================
  // Iterator
  // ==================================================
  /**
   * イテレータの実装
   * @returns イテレータ
   */
  [Symbol.iterator]() {
    const stages = this._collectPipelineStages();
    if (stages.length === 0) {
      return this._sourceFactory();
    }
    const states = stages.map((stage) => stage.definition.createState(stage.data));
    const stack = [{ iterator: this._sourceFactory(), stageIndex: 0 }];
    let shouldStop = false;
    const context = {
      pushIterator: (iterator, stageIndex) => {
        stack.push({ iterator, stageIndex });
      },
      stop: () => {
        shouldStop = true;
      }
    };
    return (function* () {
      while (stack.length > 0) {
        if (shouldStop) return;
        const frame = stack[stack.length - 1];
        const next = frame.iterator.next();
        if (next.done) {
          stack.pop();
          continue;
        }
        let current = next.value;
        let stageIndex = frame.stageIndex;
        let shouldYield = true;
        while (stageIndex < stages.length) {
          const stage = stages[stageIndex];
          const result = stage.definition.process(current, states[stageIndex], stage.data, context, stageIndex + 1);
          if (shouldStop) return;
          if (result === BIGFLOAT_STREAM_SKIP) {
            shouldYield = false;
            break;
          }
          current = result;
          stageIndex++;
        }
        if (shouldYield) {
          yield current;
        }
      }
    })();
  }
  // ==================================================
  // Terminal Operations
  // ==================================================
  /**
   * 各要素に対して処理を実行する (終端操作)
   * @param fn - 処理関数
   */
  forEach(fn) {
    for (const item of this) fn(item);
  }
  /**
   * 配列に変換する (終端操作)
   * @returns 要素の配列
   */
  toArray() {
    const values = [];
    for (const item of this) values.push(item);
    return values;
  }
  /**
   * 配列に変換する (終端操作)
   * @returns 要素の配列
   */
  collect() {
    return this.toArray();
  }
  /**
   * 畳み込み処理を行う (終端操作)
   * @param fn - 畳み込み関数
   * @param initial - 初期値
   * @returns 畳み込み結果
   */
  reduce(fn, initial) {
    let acc = initial;
    for (const item of this) {
      acc = fn(acc, item);
    }
    return acc;
  }
  /**
   * 要素数をカウントする (終端操作)
   * @returns 要素数
   */
  count() {
    let count = 0;
    for (const _ of this) count++;
    return count;
  }
  /**
   * ストリームが空かどうか判定する
   * @returns 空ならtrue
   */
  isEmpty() {
    return this.findFirst() === void 0;
  }
  /**
   * いずれかの要素が条件を満たすか判定する (終端操作)
   * @param fn - 判定関数
   * @returns 満たす要素があればtrue
   */
  some(fn) {
    for (const item of this) {
      if (fn(item)) return true;
    }
    return false;
  }
  /**
   * すべての要素が条件を満たすか判定する (終端操作)
   * @param fn - 判定関数
   * @returns すべて満たせばtrue
   */
  every(fn) {
    for (const item of this) {
      if (!fn(item)) return false;
    }
    return true;
  }
  /**
   * 条件に一致する最初の要素を返す (終端操作)
   * @param fn - 判定関数
   * @returns 条件に一致した要素、存在しない場合はundefined
   */
  find(fn) {
    for (const item of this) {
      if (fn(item)) return item;
    }
    return void 0;
  }
  /**
   * 最初の要素を返す (終端操作)
   * @returns 最初の要素、空の場合はundefined
   */
  findFirst() {
    for (const item of this) return item;
    return void 0;
  }
  /**
   * 最初の要素を返す (終端操作)
   * @returns 最初の要素、空の場合はundefined
   */
  first() {
    return this.findFirst();
  }
  /**
   * 指定位置の要素を返す (終端操作)
   * @param index - インデックス
   * @returns 要素、存在しない場合はundefined
   */
  at(index) {
    if (index < 0) return void 0;
    let currentIndex = 0;
    for (const item of this) {
      if (currentIndex++ === index) return item;
    }
    return void 0;
  }
  // ====================================================================================================
  // * BigFloatStream specific methods
  // ====================================================================================================
  /**
   * すべての要素の精度を変更する
   * @param precision - 新しい精度
   * @returns 精度が変更されたストリーム
   */
  changePrecision(precision) {
    const precisionBig = BigInt(precision);
    return this.map((x) => x.clone().changePrecision(precisionBig));
  }
  /**
   * 各要素と指定値の相対差を計算する
   * @param other - 比較対象
   * @returns 相対差を要素ごとに計算したストリーム
   */
  relativeDiff(other) {
    return this.map((x) => x.relativeDiff(other));
  }
  /**
   * 各要素と指定値の絶対差を計算する
   * @param other - 比較対象
   * @returns 絶対差を要素ごとに計算したストリーム
   */
  absoluteDiff(other) {
    return this.map((x) => x.absoluteDiff(other));
  }
  /**
   * 各要素と指定値の百分率差分を計算する
   * @param other - 比較対象
   * @returns 百分率差分を要素ごとに計算したストリーム
   */
  percentDiff(other) {
    return this.map((x) => x.percentDiff(other));
  }
  /**
   * 各要素に加算する
   * @param other - 加算する値
   * @returns 加算後のストリーム
   */
  add(other) {
    return this.map((x) => x.add(other));
  }
  /**
   * 各要素から減算する
   * @param other - 減算する値
   * @returns 減算後のストリーム
   */
  sub(other) {
    return this.map((x) => x.sub(other));
  }
  /**
   * 各要素に乗算する
   * @param other - 乗算する値
   * @returns 乗算後のストリーム
   */
  mul(other) {
    return this.map((x) => x.mul(other));
  }
  /**
   * 各要素を除算する
   * @param other - 除算する値
   * @returns 除算後のストリーム
   */
  div(other) {
    return this.map((x) => x.div(other));
  }
  /**
   * 各要素の剰余を計算する
   * @param other - 法
   * @returns 剰余後のストリーム
   */
  mod(other) {
    return this.map((x) => x.mod(other));
  }
  /**
   * 各要素の符号を反転させる
   * @returns 反転後のストリーム
   */
  neg() {
    return this.map((x) => x.neg());
  }
  /**
   * 各要素の絶対値を取得する
   * @returns 絶対値後のストリーム
   */
  abs() {
    return this.map((x) => x.abs());
  }
  /**
   * 各要素の符号を取得する
   * @returns 符号後のストリーム
   */
  sign() {
    return this.map((x) => x.sign());
  }
  /**
   * 各要素の逆数を取得する
   * @returns 逆数後のストリーム
   */
  reciprocal() {
    return this.map((x) => x.reciprocal());
  }
  /**
   * 各要素の冪乗を計算する
   * @param exponent - 指数
   * @returns 冪乗後のストリーム
   */
  pow(exponent) {
    return this.map((x) => x.pow(exponent));
  }
  /**
   * 各要素の平方根を計算する
   * @returns 平方根後のストリーム
   */
  sqrt() {
    return this.map((x) => x.sqrt());
  }
  /**
   * 各要素の立方根を計算する
   * @returns 立方根後のストリーム
   */
  cbrt() {
    return this.map((x) => x.cbrt());
  }
  /**
   * 各要素のn乗根を計算する
   * @param n - 指数
   * @returns n乗根後のストリーム
   */
  nthRoot(n) {
    return this.map((x) => x.nthRoot(n));
  }
  /**
   * 各要素を切り下げる
   * @returns 切り下げ後のストリーム
   */
  floor() {
    return this.map((x) => x.floor());
  }
  /**
   * 各要素を切り上げる
   * @returns 切り上げ後のストリーム
   */
  ceil() {
    return this.map((x) => x.ceil());
  }
  /**
   * 各要素を四捨五入する
   * @returns 四捨五入後のストリーム
   */
  round() {
    return this.map((x) => x.round());
  }
  /**
   * 各要素を0方向へ切り捨てる
   * @returns 切り捨て後のストリーム
   */
  trunc() {
    return this.map((x) => x.trunc());
  }
  /**
   * 各要素をFloat32相当に丸める
   * @returns Float32相当へ丸めたストリーム
   */
  fround() {
    return this.map((x) => x.fround());
  }
  /**
   * 各要素の先頭ゼロビット数を取得する
   * @returns 先頭ゼロビット数のストリーム
   */
  clz32() {
    return this.map((x) => x.clz32());
  }
  /**
   * 各要素の正弦を計算する
   * @returns 正弦後のストリーム
   */
  sin() {
    return this.map((x) => x.sin());
  }
  /**
   * 各要素の余弦を計算する
   * @returns 余弦後のストリーム
   */
  cos() {
    return this.map((x) => x.cos());
  }
  /**
   * 各要素の正接を計算する
   * @returns 正接後のストリーム
   */
  tan() {
    return this.map((x) => x.tan());
  }
  /**
   * 各要素の逆正弦を計算する
   * @returns 逆正弦後のストリーム
   */
  asin() {
    return this.map((x) => x.asin());
  }
  /**
   * 各要素の逆余弦を計算する
   * @returns 逆余弦後のストリーム
   */
  acos() {
    return this.map((x) => x.acos());
  }
  /**
   * 各要素の逆正接を計算する
   * @returns 逆正接後のストリーム
   */
  atan() {
    return this.map((x) => x.atan());
  }
  /**
   * 各要素と指定値から逆正接を計算する
   * @param x - x座標
   * @returns 逆正接後のストリーム
   */
  atan2(x) {
    return this.map((value) => value.atan2(x));
  }
  /**
   * 各要素の双曲線正弦を計算する
   * @returns 双曲線正弦後のストリーム
   */
  sinh() {
    return this.map((x) => x.sinh());
  }
  /**
   * 各要素の双曲線余弦を計算する
   * @returns 双曲線余弦後のストリーム
   */
  cosh() {
    return this.map((x) => x.cosh());
  }
  /**
   * 各要素の双曲線正接を計算する
   * @returns 双曲線正接後のストリーム
   */
  tanh() {
    return this.map((x) => x.tanh());
  }
  /**
   * 各要素の逆双曲線正弦を計算する
   * @returns 逆双曲線正弦後のストリーム
   */
  asinh() {
    return this.map((x) => x.asinh());
  }
  /**
   * 各要素の逆双曲線余弦を計算する
   * @returns 逆双曲線余弦後のストリーム
   */
  acosh() {
    return this.map((x) => x.acosh());
  }
  /**
   * 各要素の逆双曲線正接を計算する
   * @returns 逆双曲線正接後のストリーム
   */
  atanh() {
    return this.map((x) => x.atanh());
  }
  /**
   * 各要素の指数関数を計算する
   * @returns 指数関数適用後のストリーム
   */
  exp() {
    return this.map((x) => x.exp());
  }
  /**
   * 各要素の2冪指数関数を計算する
   * @returns 2冪指数関数適用後のストリーム
   */
  exp2() {
    return this.map((x) => x.exp2());
  }
  /**
   * 各要素のexp(x)-1を計算する
   * @returns expm1適用後のストリーム
   */
  expm1() {
    return this.map((x) => x.expm1());
  }
  /**
   * 各要素の自然対数を計算する
   * @returns 自然対数後のストリーム
   */
  ln() {
    return this.map((x) => x.ln());
  }
  /**
   * 各要素の任意底対数を計算する
   * @param base - 底
   * @returns 対数後のストリーム
   */
  log(base) {
    return this.map((x) => x.log(base));
  }
  /**
   * 各要素の底2対数を計算する
   * @returns 底2対数後のストリーム
   */
  log2() {
    return this.map((x) => x.log2());
  }
  /**
   * 各要素の底10対数を計算する
   * @returns 底10対数後のストリーム
   */
  log10() {
    return this.map((x) => x.log10());
  }
  /**
   * 各要素のlog(1+x)を計算する
   * @returns log1p適用後のストリーム
   */
  log1p() {
    return this.map((x) => x.log1p());
  }
  /**
   * 各要素のガンマ関数を計算する
   * @returns ガンマ関数適用後のストリーム
   */
  gamma() {
    return this.map((x) => x.gamma());
  }
  /**
   * 各要素のゼータ関数を計算する
   * @returns ゼータ関数適用後のストリーム
   */
  zeta() {
    return this.map((x) => x.zeta());
  }
  /**
   * 各要素の階乗を計算する
   * @returns 階乗後のストリーム
   */
  factorial() {
    return this.map((x) => x.factorial());
  }
  /**
   * 要素の最大値を返す (終端操作)
   * @returns 最大値
   */
  max() {
    const iter = this[Symbol.iterator]();
    const first = iter.next();
    if (first.done) throw new TypeError("No arguments provided");
    let result = first.value;
    for (let next = iter.next(); !next.done; next = iter.next()) {
      if (next.value.gt(result)) result = next.value;
    }
    return result.clone();
  }
  /**
   * 要素の最小値を返す (終端操作)
   * @returns 最小値
   */
  min() {
    const iter = this[Symbol.iterator]();
    const first = iter.next();
    if (first.done) throw new TypeError("No arguments provided");
    let result = first.value;
    for (let next = iter.next(); !next.done; next = iter.next()) {
      if (next.value.lt(result)) result = next.value;
    }
    return result.clone();
  }
  /**
   * 要素の合計を返す (終端操作)
   * @returns 合計
   */
  sum() {
    const iter = this[Symbol.iterator]();
    const first = iter.next();
    if (first.done) return new BigFloat(0);
    let total = first.value.clone();
    for (let next = iter.next(); !next.done; next = iter.next()) {
      total = total.add(next.value);
    }
    return total;
  }
  /**
   * 要素の積を返す (終端操作)
   * @returns 積
   */
  product() {
    const iter = this[Symbol.iterator]();
    const first = iter.next();
    if (first.done) return new BigFloat(1);
    let total = first.value.clone();
    for (let next = iter.next(); !next.done; next = iter.next()) {
      total = total.mul(next.value);
    }
    return total;
  }
  /**
   * 要素の平均を返す (終端操作)
   * @returns 平均
   */
  average() {
    const iter = this[Symbol.iterator]();
    const first = iter.next();
    if (first.done) return new BigFloat(0);
    let total = first.value.clone();
    let count = 1;
    for (let next = iter.next(); !next.done; next = iter.next()) {
      total = total.add(next.value);
      count++;
    }
    return total.div(count);
  }
  /**
   * 要素の中央値を返す (終端操作)
   * @returns 中央値
   */
  median() {
    return BigFloat.median(this.toArray());
  }
  /**
   * 要素の分散を返す (終端操作)
   * @returns 分散
   */
  variance() {
    return BigFloat.variance(this.toArray());
  }
  /**
   * 要素の標準偏差を返す (終端操作)
   * @returns 標準偏差
   */
  stddev() {
    return BigFloat.stddev(this.toArray());
  }
};

// src/bigFloatVector.ts
var BigFloatVector = class _BigFloatVector {
  /** 内部要素 */
  _values;
  /**
   * @param values - 要素列
   * @param precision - 変換時の精度
   */
  constructor(values = [], precision) {
    const array = Array.from(values);
    const resolvedPrecision = _BigFloatVector._resolvePrecision(array, precision);
    this._values = array.map((value) => _BigFloatVector._toBigFloat(value, resolvedPrecision));
  }
  /**
   * 内部配列からベクトルを生成する
   * @param values - 内部所有済みの要素列
   * @returns BigFloatVector
   */
  static _fromBigFloatArray(values) {
    const vector = Object.create(_BigFloatVector.prototype);
    vector._values = values;
    return vector;
  }
  /**
   * 値をBigFloatへ変換する
   * @param value - 変換対象
   * @param precision - 明示精度
   * @returns BigFloat
   */
  static _toBigFloat(value, precision) {
    if (value instanceof BigFloat) {
      const cloned = value.clone();
      if (precision === void 0 || cloned._precision === precision) return cloned;
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
  static _resolvePrecision(values, precision) {
    if (precision !== void 0) return BigInt(precision);
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
  static _normalizeLength(length) {
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
  static _assertSameLength(left, right) {
    if (left.length !== right.length) throw new RangeError("Vector dimensions must match");
  }
  /**
   * 任意入力をベクトル化する
   * @param value - ベクトルまたは要素列
   * @returns BigFloatVector
   */
  static _coerceVector(value, referenceValues = []) {
    if (value instanceof _BigFloatVector) return value;
    const array = Array.from(value);
    const resolvedPrecision = _BigFloatVector._resolvePrecision([...referenceValues, ...array]);
    return _BigFloatVector.from(array, resolvedPrecision);
  }
  /**
   * 要素ごとの写像を行う
   * @param fn - 変換関数
   * @returns 変換後のベクトル
   */
  _mapValues(fn) {
    const values = this._values.map((value, index) => {
      const mapped = fn(value.clone(), index);
      return mapped instanceof BigFloat ? mapped.clone() : _BigFloatVector._toBigFloat(mapped, value._precision);
    });
    return _BigFloatVector._fromBigFloatArray(values);
  }
  /**
   * 要素ごとの二項演算を行う
   * @param other - ベクトルまたはスカラ値
   * @param fn - 変換関数
   * @returns 演算後のベクトル
   */
  _mapWithOperand(other, fn) {
    if (other instanceof _BigFloatVector || typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat)) {
      const vector = _BigFloatVector._coerceVector(other, this._values);
      _BigFloatVector._assertSameLength(this, vector);
      const values = this._values.map((value, index) => {
        const mapped = fn(value.clone(), vector._values[index].clone(), index);
        return mapped instanceof BigFloat ? mapped.clone() : _BigFloatVector._toBigFloat(mapped, value._precision);
      });
      return _BigFloatVector._fromBigFloatArray(values);
    }
    return this._mapValues((value, index) => fn(value, _BigFloatVector._toBigFloat(other, value._precision), index));
  }
  /**
   * 空ベクトルを生成する
   * @returns 空ベクトル
   */
  static empty() {
    return this._fromBigFloatArray([]);
  }
  /**
   * 要素列からベクトルを生成する
   * @param values - 要素列
   * @param precision - 変換時の精度
   * @returns BigFloatVector
   */
  static from(values, precision) {
    return new _BigFloatVector(values, precision);
  }
  /**
   * Stream からベクトルを生成する
   * @param stream - 変換元ストリーム
   * @returns BigFloatVector
   */
  static fromStream(stream) {
    return this.from(stream.toArray());
  }
  /**
   * 値の並びからベクトルを生成する
   * @param values - 要素列
   * @returns BigFloatVector
   */
  static of(...values) {
    return this.from(values);
  }
  /**
   * 指定値で埋めたベクトルを生成する
   * @param length - ベクトル長
   * @param value - 埋める値
   * @param precision - 精度
   * @returns BigFloatVector
   */
  static fill(length, value, precision) {
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
  static zeros(length, precision) {
    return this.fill(length, 0, precision);
  }
  /**
   * 1ベクトルを生成する
   * @param length - ベクトル長
   * @param precision - 精度
   * @returns BigFloatVector
   */
  static ones(length, precision) {
    return this.fill(length, 1, precision);
  }
  /**
   * 標準基底ベクトルを生成する
   * @param length - ベクトル長
   * @param index - 1を置く位置
   * @param precision - 精度
   * @returns BigFloatVector
   */
  static basis(length, index, precision) {
    const normalizedLength = this._normalizeLength(length);
    const normalizedIndex = Math.trunc(index);
    if (normalizedIndex < 0 || normalizedIndex >= normalizedLength) throw new RangeError("Basis index out of range");
    const resolvedPrecision = precision === void 0 ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
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
  static linspace(start, end, count, precision) {
    const normalizedCount = this._normalizeLength(count);
    if (normalizedCount === 0) return this.empty();
    const resolvedPrecision = this._resolvePrecision([start, end], precision);
    const startValue = this._toBigFloat(start, resolvedPrecision);
    if (normalizedCount === 1) return this._fromBigFloatArray([startValue]);
    const endValue = this._toBigFloat(end, resolvedPrecision);
    const step = endValue.sub(startValue).div(normalizedCount - 1);
    const values = [];
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
  static random(length, options = {}) {
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
  get length() {
    return this._values.length;
  }
  /**
   * ベクトルの次元数を返す
   * @returns 次元数
   */
  dimension() {
    return this.length;
  }
  /**
   * 空ベクトルかどうか
   * @returns 空ならtrue
   */
  isEmpty() {
    return this.length === 0;
  }
  /**
   * 指定位置の値を取得する
   * @param index - インデックス
   * @returns 値またはundefined
   */
  at(index) {
    if (index < 0 || index >= this.length) return void 0;
    return this._values[index].clone();
  }
  /**
   * ベクトルを複製する
   * @returns 複製されたベクトル
   */
  clone() {
    return _BigFloatVector._fromBigFloatArray(this._values.map((value) => value.clone()));
  }
  /**
   * 配列へ変換する
   * @returns 要素配列
   */
  toArray() {
    return this._values.map((value) => value.clone());
  }
  /**
   * Stream へ変換する
   * @returns BigFloatStream
   */
  toStream() {
    return BigFloatStream.from(this.toArray());
  }
  /**
   * イテレータ
   * @returns イテレータ
   */
  [Symbol.iterator]() {
    return this.toArray()[Symbol.iterator]();
  }
  /**
   * 各要素に処理を適用する
   * @param fn - 処理関数
   */
  forEach(fn) {
    for (let index = 0; index < this.length; index++) {
      fn(this._values[index].clone(), index);
    }
  }
  /**
   * 要素ごとに変換する
   * @param fn - 変換関数
   * @returns 変換後ベクトル
   */
  map(fn) {
    return this._mapValues(fn);
  }
  /**
   * 2つのベクトルを要素ごとに変換する
   * @param other - 対象ベクトル
   * @param fn - 変換関数
   * @returns 変換後ベクトル
   */
  zipMap(other, fn) {
    return this._mapWithOperand(other, fn);
  }
  /**
   * 畳み込み処理を行う
   * @param fn - 畳み込み関数
   * @param initial - 初期値
   * @returns 畳み込み結果
   */
  reduce(fn, initial) {
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
  some(fn) {
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
  every(fn) {
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
  concat(...others) {
    const values = this.toArray();
    for (const other of others) {
      values.push(..._BigFloatVector._coerceVector(other, this._values).toArray());
    }
    return _BigFloatVector._fromBigFloatArray(values);
  }
  /**
   * スライスする
   * @param start - 開始位置
   * @param end - 終了位置
   * @returns スライス後ベクトル
   */
  slice(start, end) {
    return _BigFloatVector._fromBigFloatArray(this._values.slice(start, end).map((value) => value.clone()));
  }
  /**
   * 逆順にする
   * @returns 逆順ベクトル
   */
  reverse() {
    return _BigFloatVector._fromBigFloatArray(
      this._values.slice().reverse().map((value) => value.clone())
    );
  }
  /**
   * すべての要素の精度を変更する
   * @param precision - 新しい精度
   * @returns 精度変更後ベクトル
   */
  changePrecision(precision) {
    const precisionBig = BigInt(precision);
    return this._mapValues((value) => value.changePrecision(precisionBig));
  }
  /**
   * ベクトル同士の一致判定
   * @param other - 比較対象
   * @returns 一致すればtrue
   */
  equals(other) {
    const vector = _BigFloatVector._coerceVector(other, this._values);
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
  add(other) {
    return this._mapWithOperand(other, (left, right) => left.add(right));
  }
  /**
   * 各要素から減算する
   * @param other - スカラ値またはベクトル
   * @returns 減算後ベクトル
   */
  sub(other) {
    return this._mapWithOperand(other, (left, right) => left.sub(right));
  }
  /**
   * スカラ倍する
   * @param scalar - スカラ値
   * @returns 乗算後ベクトル
   */
  mul(scalar) {
    return this._mapValues((value) => value.mul(scalar));
  }
  /**
   * スカラ除算する
   * @param scalar - スカラ値
   * @returns 除算後ベクトル
   */
  div(scalar) {
    return this._mapValues((value) => value.div(scalar));
  }
  /**
   * 剰余を計算する
   * @param other - スカラ値またはベクトル
   * @returns 剰余後ベクトル
   */
  mod(other) {
    return this._mapWithOperand(other, (left, right) => left.mod(right));
  }
  /**
   * 要素ごとの積を計算する
   * @param other - 対象ベクトル
   * @returns Hadamard積
   */
  hadamard(other) {
    return this._mapWithOperand(other, (left, right) => left.mul(right));
  }
  /**
   * 符号を反転する
   * @returns 反転後ベクトル
   */
  neg() {
    return this._mapValues((value) => value.neg());
  }
  /**
   * 絶対値化する
   * @returns 絶対値ベクトル
   */
  abs() {
    return this._mapValues((value) => value.abs());
  }
  /**
   * 符号ベクトルを返す
   * @returns 符号ベクトル
   */
  sign() {
    return this._mapValues((value) => value.sign());
  }
  /**
   * 各要素の逆数を返す
   * @returns 逆数ベクトル
   */
  reciprocal() {
    return this._mapValues((value) => value.reciprocal());
  }
  /**
   * 要素ごとの冪乗を計算する
   * @param exponent - 指数
   * @returns 冪乗後ベクトル
   */
  pow(exponent) {
    return this._mapWithOperand(exponent, (left, right) => left.pow(right));
  }
  /**
   * 各要素の平方根を計算する
   * @returns 平方根ベクトル
   */
  sqrt() {
    return this._mapValues((value) => value.sqrt());
  }
  /**
   * 各要素の立方根を計算する
   * @returns 立方根ベクトル
   */
  cbrt() {
    return this._mapValues((value) => value.cbrt());
  }
  /**
   * 各要素のn乗根を計算する
   * @param n - 指数
   * @returns n乗根ベクトル
   */
  nthRoot(n) {
    return this._mapValues((value) => value.nthRoot(n));
  }
  /**
   * 各要素を切り下げる
   * @returns 切り下げ後ベクトル
   */
  floor() {
    return this._mapValues((value) => value.floor());
  }
  /**
   * 各要素を切り上げる
   * @returns 切り上げ後ベクトル
   */
  ceil() {
    return this._mapValues((value) => value.ceil());
  }
  /**
   * 各要素を四捨五入する
   * @returns 四捨五入後ベクトル
   */
  round() {
    return this._mapValues((value) => value.round());
  }
  /**
   * 各要素を0方向へ切り捨てる
   * @returns 切り捨て後ベクトル
   */
  trunc() {
    return this._mapValues((value) => value.trunc());
  }
  /**
   * 各要素をFloat32相当に丸める
   * @returns Float32相当へ丸めたベクトル
   */
  fround() {
    return this._mapValues((value) => value.fround());
  }
  /**
   * 各要素の先頭ゼロビット数を取得する
   * @returns 先頭ゼロビット数ベクトル
   */
  clz32() {
    return this._mapValues((value) => value.clz32());
  }
  /**
   * 相対差を計算する
   * @param other - 比較対象
   * @returns 相対差ベクトル
   */
  relativeDiff(other) {
    return this._mapWithOperand(other, (left, right) => left.relativeDiff(right));
  }
  /**
   * 絶対差を計算する
   * @param other - 比較対象
   * @returns 絶対差ベクトル
   */
  absoluteDiff(other) {
    return this._mapWithOperand(other, (left, right) => left.absoluteDiff(right));
  }
  /**
   * 百分率差分を計算する
   * @param other - 比較対象
   * @returns 百分率差分ベクトル
   */
  percentDiff(other) {
    return this._mapWithOperand(other, (left, right) => left.percentDiff(right));
  }
  /**
   * 各要素の正弦を計算する
   * @returns 正弦ベクトル
   */
  sin() {
    return this._mapValues((value) => value.sin());
  }
  /**
   * 各要素の余弦を計算する
   * @returns 余弦ベクトル
   */
  cos() {
    return this._mapValues((value) => value.cos());
  }
  /**
   * 各要素の正接を計算する
   * @returns 正接ベクトル
   */
  tan() {
    return this._mapValues((value) => value.tan());
  }
  /**
   * 各要素の逆正弦を計算する
   * @returns 逆正弦ベクトル
   */
  asin() {
    return this._mapValues((value) => value.asin());
  }
  /**
   * 各要素の逆余弦を計算する
   * @returns 逆余弦ベクトル
   */
  acos() {
    return this._mapValues((value) => value.acos());
  }
  /**
   * 各要素の逆正接を計算する
   * @returns 逆正接ベクトル
   */
  atan() {
    return this._mapValues((value) => value.atan());
  }
  /**
   * 各要素と逆正接を計算する
   * @param x - x座標
   * @returns 逆正接ベクトル
   */
  atan2(x) {
    return this._mapWithOperand(x, (left, right) => left.atan2(right));
  }
  /**
   * 各要素の双曲線正弦を計算する
   * @returns 双曲線正弦ベクトル
   */
  sinh() {
    return this._mapValues((value) => value.sinh());
  }
  /**
   * 各要素の双曲線余弦を計算する
   * @returns 双曲線余弦ベクトル
   */
  cosh() {
    return this._mapValues((value) => value.cosh());
  }
  /**
   * 各要素の双曲線正接を計算する
   * @returns 双曲線正接ベクトル
   */
  tanh() {
    return this._mapValues((value) => value.tanh());
  }
  /**
   * 各要素の逆双曲線正弦を計算する
   * @returns 逆双曲線正弦ベクトル
   */
  asinh() {
    return this._mapValues((value) => value.asinh());
  }
  /**
   * 各要素の逆双曲線余弦を計算する
   * @returns 逆双曲線余弦ベクトル
   */
  acosh() {
    return this._mapValues((value) => value.acosh());
  }
  /**
   * 各要素の逆双曲線正接を計算する
   * @returns 逆双曲線正接ベクトル
   */
  atanh() {
    return this._mapValues((value) => value.atanh());
  }
  /**
   * 各要素の指数関数を計算する
   * @returns 指数関数ベクトル
   */
  exp() {
    return this._mapValues((value) => value.exp());
  }
  /**
   * 各要素の2冪指数関数を計算する
   * @returns 2冪指数関数ベクトル
   */
  exp2() {
    return this._mapValues((value) => value.exp2());
  }
  /**
   * 各要素のexp(x)-1を計算する
   * @returns expm1ベクトル
   */
  expm1() {
    return this._mapValues((value) => value.expm1());
  }
  /**
   * 各要素の自然対数を計算する
   * @returns 自然対数ベクトル
   */
  ln() {
    return this._mapValues((value) => value.ln());
  }
  /**
   * 各要素の対数を計算する
   * @param base - 底
   * @returns 対数ベクトル
   */
  log(base) {
    return this._mapWithOperand(base, (left, right) => left.log(right));
  }
  /**
   * 各要素の底2対数を計算する
   * @returns 底2対数ベクトル
   */
  log2() {
    return this._mapValues((value) => value.log2());
  }
  /**
   * 各要素の底10対数を計算する
   * @returns 底10対数ベクトル
   */
  log10() {
    return this._mapValues((value) => value.log10());
  }
  /**
   * 各要素のlog(1+x)を計算する
   * @returns log1pベクトル
   */
  log1p() {
    return this._mapValues((value) => value.log1p());
  }
  /**
   * 各要素のガンマ関数を計算する
   * @returns ガンマ関数ベクトル
   */
  gamma() {
    return this._mapValues((value) => value.gamma());
  }
  /**
   * 各要素のゼータ関数を計算する
   * @returns ゼータ関数ベクトル
   */
  zeta() {
    return this._mapValues((value) => value.zeta());
  }
  /**
   * 各要素の階乗を計算する
   * @returns 階乗ベクトル
   */
  factorial() {
    return this._mapValues((value) => value.factorial());
  }
  /**
   * 最大値を返す
   * @returns 最大値
   */
  max() {
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
  min() {
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
  sum() {
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
  product() {
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
  average() {
    if (this.isEmpty()) return new BigFloat(0);
    return this.sum().div(this.length);
  }
  /**
   * 内積を返す
   * @param other - 対象ベクトル
   * @returns 内積
   */
  dot(other) {
    const vector = _BigFloatVector._coerceVector(other, this._values);
    _BigFloatVector._assertSameLength(this, vector);
    let total = new BigFloat(0, _BigFloatVector._resolvePrecision([...this._values, ...vector._values]));
    for (let index = 0; index < this.length; index++) {
      total = total.add(this._values[index].mul(vector._values[index]));
    }
    return total;
  }
  /**
   * 二乗ノルムを返す
   * @returns 二乗ノルム
   */
  squaredNorm() {
    return this.dot(this);
  }
  /**
   * ノルムを返す
   * @returns ノルム
   */
  norm() {
    return this.squaredNorm().sqrt();
  }
  /**
   * 正規化ベクトルを返す
   * @returns 正規化ベクトル
   */
  normalize() {
    const length = this.norm();
    if (length.isZero()) throw new RangeError("Cannot normalize zero vector");
    return this.div(length);
  }
  /**
   * 二乗距離を返す
   * @param other - 対象ベクトル
   * @returns 二乗距離
   */
  squaredDistanceTo(other) {
    return this.sub(other).squaredNorm();
  }
  /**
   * 距離を返す
   * @param other - 対象ベクトル
   * @returns 距離
   */
  distanceTo(other) {
    return this.squaredDistanceTo(other).sqrt();
  }
  /**
   * 射影ベクトルを返す
   * @param other - 射影先ベクトル
   * @returns 射影ベクトル
   */
  projectOnto(other) {
    const vector = _BigFloatVector._coerceVector(other, this._values);
    const denominator = vector.squaredNorm();
    if (denominator.isZero()) throw new RangeError("Cannot project onto zero vector");
    const scale = this.dot(vector).div(denominator);
    return vector.mul(scale);
  }
  /**
   * 2ベクトルのなす角を返す
   * @param other - 対象ベクトル
   * @returns 角度
   */
  angleTo(other) {
    const vector = _BigFloatVector._coerceVector(other, this._values);
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
  cross(other) {
    const vector = _BigFloatVector._coerceVector(other, this._values);
    _BigFloatVector._assertSameLength(this, vector);
    if (this.length !== 3) throw new RangeError("Cross product is only defined for 3-dimensional vectors");
    const [ax, ay, az] = this._values;
    const [bx, by, bz] = vector._values;
    return _BigFloatVector._fromBigFloatArray([ay.mul(bz).sub(az.mul(by)), az.mul(bx).sub(ax.mul(bz)), ax.mul(by).sub(ay.mul(bx))]);
  }
};

// src/bigFloatMatrix.ts
var BigFloatMatrix = class _BigFloatMatrix {
  /** 内部要素 */
  _values;
  /**
   * @param rows - 行列要素
   * @param precision - 変換時の精度
   */
  constructor(rows = [], precision) {
    const rawRows = Array.from(rows, (row) => Array.from(row));
    _BigFloatMatrix._assertRectangularRaw(rawRows);
    const resolvedPrecision = _BigFloatMatrix._resolvePrecision(rawRows.flat(), precision);
    this._values = rawRows.map((row) => row.map((value) => _BigFloatMatrix._toBigFloat(value, resolvedPrecision)));
  }
  /** 内部配列から行列を生成する */
  static _fromBigFloatGrid(values) {
    const matrix = Object.create(_BigFloatMatrix.prototype);
    matrix._values = values;
    return matrix;
  }
  /** 値をBigFloatへ変換する */
  static _toBigFloat(value, precision) {
    if (value instanceof BigFloat) {
      const cloned = value.clone();
      if (precision === void 0 || cloned._precision === precision) return cloned;
      return cloned.changePrecision(precision);
    }
    return new BigFloat(value, precision ?? BigFloat.DEFAULT_PRECISION);
  }
  /** 精度を解決する */
  static _resolvePrecision(values, precision) {
    if (precision !== void 0) return BigInt(precision);
    let resolved = BigFloat.DEFAULT_PRECISION;
    for (const value of values) {
      if (value instanceof BigFloat && value._precision > resolved) resolved = value._precision;
    }
    return resolved;
  }
  /** 次元を正規化する */
  static _normalizeSize(size, name) {
    if (!Number.isFinite(size)) throw new RangeError(`${name} must be finite`);
    const normalized = Math.trunc(size);
    if (normalized < 0) throw new RangeError(`${name} must be non-negative`);
    return normalized;
  }
  /** 生配列が長方形か検証する */
  static _assertRectangularRaw(rows) {
    if (rows.length === 0) return;
    const columnCount = rows[0].length;
    for (const row of rows) {
      if (row.length !== columnCount) throw new RangeError("Matrix rows must have the same length");
    }
  }
  /** 同形状か検証する */
  static _assertSameShape(left, right) {
    if (left.rowCount !== right.rowCount || left.columnCount !== right.columnCount) {
      throw new RangeError("Matrix shapes must match");
    }
  }
  /** 正方行列か検証する */
  static _assertSquare(matrix) {
    if (!matrix.isSquare()) throw new RangeError("Matrix must be square");
  }
  /** 行列積可能か検証する */
  static _assertMultipliable(left, right) {
    if (left.columnCount !== right.rowCount) throw new RangeError("Inner matrix dimensions must agree");
  }
  /** 微小値を返す */
  static _epsilon(precision) {
    if (precision <= 0n) return new BigFloat(1, 0);
    return new BigFloat(1, precision).div(10n ** precision);
  }
  /** 行列または生データを行列化する */
  static _coerceMatrix(value, referenceValues = []) {
    if (value instanceof _BigFloatMatrix) return value;
    const rows = Array.from(value, (row) => Array.from(row));
    const resolvedPrecision = _BigFloatMatrix._resolvePrecision([...referenceValues, ...rows.flat()]);
    return _BigFloatMatrix.from(rows, resolvedPrecision);
  }
  /** ベクトルまたは生データをベクトル化する */
  static _coerceVector(value, referenceValues = []) {
    if (value instanceof BigFloatVector) return value;
    const values = Array.from(value);
    const resolvedPrecision = _BigFloatMatrix._resolvePrecision([...referenceValues, ...values]);
    return BigFloatVector.from(values, resolvedPrecision);
  }
  /** 要素列を平坦化する */
  _flattenValues() {
    return this._values.flat();
  }
  /** 要素ごとの写像を行う */
  _mapValues(fn) {
    const values = this._values.map(
      (currentRow, rowIndex) => currentRow.map((value, columnIndex) => {
        const mapped = fn(value.clone(), rowIndex, columnIndex);
        return mapped instanceof BigFloat ? mapped.clone() : _BigFloatMatrix._toBigFloat(mapped, value._precision);
      })
    );
    return _BigFloatMatrix._fromBigFloatGrid(values);
  }
  /** 要素ごとの二項演算を行う */
  _mapWithOperand(other, fn) {
    if (other instanceof _BigFloatMatrix || typeof other === "object" && other !== null && Symbol.iterator in other && !(other instanceof BigFloat)) {
      const matrix = _BigFloatMatrix._coerceMatrix(other, this._flattenValues());
      _BigFloatMatrix._assertSameShape(this, matrix);
      const values = this._values.map(
        (currentRow, rowIndex) => currentRow.map((value, columnIndex) => {
          const mapped = fn(value.clone(), matrix._values[rowIndex][columnIndex].clone(), rowIndex, columnIndex);
          return mapped instanceof BigFloat ? mapped.clone() : _BigFloatMatrix._toBigFloat(mapped, value._precision);
        })
      );
      return _BigFloatMatrix._fromBigFloatGrid(values);
    }
    return this._mapValues((value, row, column) => fn(value, _BigFloatMatrix._toBigFloat(other, value._precision), row, column));
  }
  /** RREF を計算する */
  static _reducedRowEchelon(values, leftColumnCount = values[0]?.length ?? 0) {
    const rows = values.map((row) => row.map((value) => value.clone()));
    const pivotColumns = [];
    const rowCount = rows.length;
    if (rowCount === 0) return { values: rows, pivotColumns };
    const totalColumns = rows[0].length;
    let pivotRow = 0;
    for (let column = 0; column < leftColumnCount && pivotRow < rowCount; column++) {
      let bestRow = -1;
      let bestValue = null;
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
  /** 空行列を生成する */
  static empty() {
    return this._fromBigFloatGrid([]);
  }
  /** 行列データから生成する */
  static from(rows, precision) {
    return new _BigFloatMatrix(rows, precision);
  }
  /** 行ベクトル群から生成する */
  static fromRows(rows, precision) {
    return this.from(rows, precision);
  }
  /** 列ベクトル群から生成する */
  static fromColumns(columns, precision) {
    const rawColumns = Array.from(columns, (column) => Array.from(column));
    if (rawColumns.length === 0) return this.empty();
    const rowCount = rawColumns[0].length;
    for (const column of rawColumns) {
      if (column.length !== rowCount) throw new RangeError("Matrix columns must have the same length");
    }
    const rows = Array.from({ length: rowCount }, (_, rowIndex) => rawColumns.map((column) => column[rowIndex]));
    return this.from(rows, precision);
  }
  /** 行の並びから生成する */
  static of(...rows) {
    return this.from(rows);
  }
  /** 指定値で埋めた行列を生成する */
  static fill(rowCount, columnCount, value, precision) {
    const normalizedRows = this._normalizeSize(rowCount, "Row count");
    const normalizedColumns = this._normalizeSize(columnCount, "Column count");
    if (normalizedRows === 0 || normalizedColumns === 0) return this.empty();
    const resolvedPrecision = this._resolvePrecision([value], precision);
    const base = this._toBigFloat(value, resolvedPrecision);
    return this._fromBigFloatGrid(Array.from({ length: normalizedRows }, () => Array.from({ length: normalizedColumns }, () => base.clone())));
  }
  /** 0行列を生成する */
  static zeros(rowCount, columnCount, precision) {
    return this.fill(rowCount, columnCount, 0, precision);
  }
  /** 1行列を生成する */
  static ones(rowCount, columnCount, precision) {
    return this.fill(rowCount, columnCount, 1, precision);
  }
  /** 単位行列を生成する */
  static identity(size, precision) {
    const normalizedSize = this._normalizeSize(size, "Matrix size");
    const resolvedPrecision = precision === void 0 ? BigFloat.DEFAULT_PRECISION : BigInt(precision);
    return this._fromBigFloatGrid(Array.from({ length: normalizedSize }, (_, row) => Array.from({ length: normalizedSize }, (_2, column) => new BigFloat(row === column ? 1 : 0, resolvedPrecision))));
  }
  /** 対角行列を生成する */
  static diagonal(values, precision) {
    const entries = Array.from(values);
    const resolvedPrecision = this._resolvePrecision(entries, precision);
    return this._fromBigFloatGrid(entries.map((value, row) => entries.map((_, column) => row === column ? this._toBigFloat(value, resolvedPrecision) : new BigFloat(0, resolvedPrecision))));
  }
  /** 乱数行列を生成する */
  static random(rowCount, columnCount, options = {}) {
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
  /** 行数 */
  get rowCount() {
    return this._values.length;
  }
  /** 列数 */
  get columnCount() {
    return this.rowCount === 0 ? 0 : this._values[0].length;
  }
  /** 形状を返す */
  shape() {
    return [this.rowCount, this.columnCount];
  }
  /** 空行列かどうか */
  isEmpty() {
    return this.rowCount === 0 || this.columnCount === 0;
  }
  /** 正方行列かどうか */
  isSquare() {
    return this.rowCount === this.columnCount;
  }
  /** 要素を取得する */
  at(row, column) {
    if (row < 0 || column < 0 || row >= this.rowCount || column >= this.columnCount) return void 0;
    return this._values[row][column].clone();
  }
  /** 行を取得する */
  row(index) {
    if (index < 0 || index >= this.rowCount) return void 0;
    return BigFloatVector.from(this._values[index].map((value) => value.clone()));
  }
  /** 列を取得する */
  column(index) {
    if (index < 0 || index >= this.columnCount) return void 0;
    return BigFloatVector.from(this._values.map((row) => row[index].clone()));
  }
  /** 対角成分を取得する */
  diagonalVector() {
    _BigFloatMatrix._assertSquare(this);
    return BigFloatVector.from(this._values.map((row, index) => row[index].clone()));
  }
  /** 行列を複製する */
  clone() {
    return _BigFloatMatrix._fromBigFloatGrid(this._values.map((row) => row.map((value) => value.clone())));
  }
  /** 配列へ変換する */
  toArray() {
    return this._values.map((row) => row.map((value) => value.clone()));
  }
  /** 行ベクトル配列へ変換する */
  toVectors() {
    return this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())));
  }
  /** 平坦化ベクトルへ変換する */
  flatten() {
    return BigFloatVector.from(this._flattenValues().map((value) => value.clone()));
  }
  /** Stream へ変換する */
  toStream() {
    return this.flatten().toStream();
  }
  /** 行イテレータ */
  [Symbol.iterator]() {
    return this.toVectors()[Symbol.iterator]();
  }
  /** 各要素へ処理を適用する */
  forEach(fn) {
    for (let row = 0; row < this.rowCount; row++) {
      for (let column = 0; column < this.columnCount; column++) {
        fn(this._values[row][column].clone(), row, column);
      }
    }
  }
  /** 要素ごとに変換する */
  map(fn) {
    return this._mapValues(fn);
  }
  /** 2つの行列を要素ごとに変換する */
  zipMap(other, fn) {
    return this._mapWithOperand(other, fn);
  }
  /** 畳み込み処理を行う */
  reduce(fn, initial) {
    let acc = initial;
    for (let row = 0; row < this.rowCount; row++) {
      for (let column = 0; column < this.columnCount; column++) {
        acc = fn(acc, this._values[row][column].clone(), row, column);
      }
    }
    return acc;
  }
  /** 条件に一致する要素があるか */
  some(fn) {
    for (let row = 0; row < this.rowCount; row++) {
      for (let column = 0; column < this.columnCount; column++) {
        if (fn(this._values[row][column].clone(), row, column)) return true;
      }
    }
    return false;
  }
  /** すべての要素が条件を満たすか */
  every(fn) {
    for (let row = 0; row < this.rowCount; row++) {
      for (let column = 0; column < this.columnCount; column++) {
        if (!fn(this._values[row][column].clone(), row, column)) return false;
      }
    }
    return true;
  }
  /** 行方向に連結する */
  concatRows(...others) {
    const values = this.toArray();
    for (const other of others) {
      const matrix = _BigFloatMatrix._coerceMatrix(other, this._flattenValues());
      if (this.columnCount !== 0 && matrix.columnCount !== this.columnCount) throw new RangeError("Column counts must match");
      values.push(...matrix.toArray());
    }
    return _BigFloatMatrix._fromBigFloatGrid(values);
  }
  /** 列方向に連結する */
  concatColumns(...others) {
    let result = this.clone();
    for (const other of others) {
      const matrix = _BigFloatMatrix._coerceMatrix(other, result._flattenValues());
      if (result.rowCount !== matrix.rowCount) throw new RangeError("Row counts must match");
      result = _BigFloatMatrix._fromBigFloatGrid(result._values.map((row, rowIndex) => [...row.map((value) => value.clone()), ...matrix._values[rowIndex].map((value) => value.clone())]));
    }
    return result;
  }
  /** 行スライス */
  sliceRows(start, end) {
    return _BigFloatMatrix._fromBigFloatGrid(this._values.slice(start, end).map((row) => row.map((value) => value.clone())));
  }
  /** 列スライス */
  sliceColumns(start, end) {
    return _BigFloatMatrix._fromBigFloatGrid(this._values.map((row) => row.slice(start, end).map((value) => value.clone())));
  }
  /** 転置行列を返す */
  transpose() {
    if (this.isEmpty()) return _BigFloatMatrix.empty();
    return _BigFloatMatrix._fromBigFloatGrid(Array.from({ length: this.columnCount }, (_, column) => this._values.map((row) => row[column].clone())));
  }
  /** 一致判定 */
  equals(other) {
    const matrix = _BigFloatMatrix._coerceMatrix(other, this._flattenValues());
    if (this.rowCount !== matrix.rowCount || this.columnCount !== matrix.columnCount) return false;
    for (let row = 0; row < this.rowCount; row++) {
      for (let column = 0; column < this.columnCount; column++) {
        if (!this._values[row][column].eq(matrix._values[row][column])) return false;
      }
    }
    return true;
  }
  /** すべての要素の精度を変更する */
  changePrecision(precision) {
    const precisionBig = BigInt(precision);
    return this._mapValues((value) => value.changePrecision(precisionBig));
  }
  /** 各要素へ加算する */
  add(other) {
    return this._mapWithOperand(other, (left, right) => left.add(right));
  }
  /** 各要素から減算する */
  sub(other) {
    return this._mapWithOperand(other, (left, right) => left.sub(right));
  }
  /** スカラ倍する */
  mul(scalar) {
    return this._mapValues((value) => value.mul(scalar));
  }
  /** スカラ除算する */
  div(scalar) {
    return this._mapValues((value) => value.div(scalar));
  }
  /** 剰余を計算する */
  mod(other) {
    return this._mapWithOperand(other, (left, right) => left.mod(right));
  }
  /** 要素ごとの積を計算する */
  hadamard(other) {
    return this._mapWithOperand(other, (left, right) => left.mul(right));
  }
  /** 符号反転する */
  neg() {
    return this._mapValues((value) => value.neg());
  }
  /** 絶対値化する */
  abs() {
    return this._mapValues((value) => value.abs());
  }
  /** 符号行列を返す */
  sign() {
    return this._mapValues((value) => value.sign());
  }
  /** 逆数行列を返す */
  reciprocal() {
    return this._mapValues((value) => value.reciprocal());
  }
  /** 要素ごとの冪乗を計算する */
  pow(exponent) {
    return this._mapWithOperand(exponent, (left, right) => left.pow(right));
  }
  /** 各要素の平方根を計算する */
  sqrt() {
    return this._mapValues((value) => value.sqrt());
  }
  /** 各要素の立方根を計算する */
  cbrt() {
    return this._mapValues((value) => value.cbrt());
  }
  /** 各要素のn乗根を計算する */
  nthRoot(n) {
    return this._mapValues((value) => value.nthRoot(n));
  }
  /** 切り下げる */
  floor() {
    return this._mapValues((value) => value.floor());
  }
  /** 切り上げる */
  ceil() {
    return this._mapValues((value) => value.ceil());
  }
  /** 四捨五入する */
  round() {
    return this._mapValues((value) => value.round());
  }
  /** 0方向へ切り捨てる */
  trunc() {
    return this._mapValues((value) => value.trunc());
  }
  /** Float32相当に丸める */
  fround() {
    return this._mapValues((value) => value.fround());
  }
  /** 先頭ゼロビット数を返す */
  clz32() {
    return this._mapValues((value) => value.clz32());
  }
  /** 相対差を計算する */
  relativeDiff(other) {
    return this._mapWithOperand(other, (left, right) => left.relativeDiff(right));
  }
  /** 絶対差を計算する */
  absoluteDiff(other) {
    return this._mapWithOperand(other, (left, right) => left.absoluteDiff(right));
  }
  /** 百分率差分を計算する */
  percentDiff(other) {
    return this._mapWithOperand(other, (left, right) => left.percentDiff(right));
  }
  /** 正弦を計算する */
  sin() {
    return this._mapValues((value) => value.sin());
  }
  /** 余弦を計算する */
  cos() {
    return this._mapValues((value) => value.cos());
  }
  /** 正接を計算する */
  tan() {
    return this._mapValues((value) => value.tan());
  }
  /** 逆正弦を計算する */
  asin() {
    return this._mapValues((value) => value.asin());
  }
  /** 逆余弦を計算する */
  acos() {
    return this._mapValues((value) => value.acos());
  }
  /** 逆正接を計算する */
  atan() {
    return this._mapValues((value) => value.atan());
  }
  /** atan2 を計算する */
  atan2(x) {
    return this._mapWithOperand(x, (left, right) => left.atan2(right));
  }
  /** 双曲線正弦を計算する */
  sinh() {
    return this._mapValues((value) => value.sinh());
  }
  /** 双曲線余弦を計算する */
  cosh() {
    return this._mapValues((value) => value.cosh());
  }
  /** 双曲線正接を計算する */
  tanh() {
    return this._mapValues((value) => value.tanh());
  }
  /** 逆双曲線正弦を計算する */
  asinh() {
    return this._mapValues((value) => value.asinh());
  }
  /** 逆双曲線余弦を計算する */
  acosh() {
    return this._mapValues((value) => value.acosh());
  }
  /** 逆双曲線正接を計算する */
  atanh() {
    return this._mapValues((value) => value.atanh());
  }
  /** 指数関数を計算する */
  exp() {
    return this._mapValues((value) => value.exp());
  }
  /** 2冪指数関数を計算する */
  exp2() {
    return this._mapValues((value) => value.exp2());
  }
  /** exp(x)-1 を計算する */
  expm1() {
    return this._mapValues((value) => value.expm1());
  }
  /** 自然対数を計算する */
  ln() {
    return this._mapValues((value) => value.ln());
  }
  /** 対数を計算する */
  log(base) {
    return this._mapWithOperand(base, (left, right) => left.log(right));
  }
  /** 底2対数を計算する */
  log2() {
    return this._mapValues((value) => value.log2());
  }
  /** 底10対数を計算する */
  log10() {
    return this._mapValues((value) => value.log10());
  }
  /** log(1+x) を計算する */
  log1p() {
    return this._mapValues((value) => value.log1p());
  }
  /** ガンマ関数を計算する */
  gamma() {
    return this._mapValues((value) => value.gamma());
  }
  /** ゼータ関数を計算する */
  zeta() {
    return this._mapValues((value) => value.zeta());
  }
  /** 階乗を計算する */
  factorial() {
    return this._mapValues((value) => value.factorial());
  }
  /** 最大値を返す */
  max() {
    if (this.isEmpty()) throw new TypeError("No arguments provided");
    let result = this._values[0][0];
    for (const row of this._values) {
      for (const value of row) {
        if (value.gt(result)) result = value;
      }
    }
    return result.clone();
  }
  /** 最小値を返す */
  min() {
    if (this.isEmpty()) throw new TypeError("No arguments provided");
    let result = this._values[0][0];
    for (const row of this._values) {
      for (const value of row) {
        if (value.lt(result)) result = value;
      }
    }
    return result.clone();
  }
  /** 合計を返す */
  sum() {
    if (this.isEmpty()) return new BigFloat(0);
    return this.flatten().sum();
  }
  /** 積を返す */
  product() {
    if (this.isEmpty()) return new BigFloat(1);
    return this.flatten().product();
  }
  /** 平均を返す */
  average() {
    if (this.isEmpty()) return new BigFloat(0);
    return this.sum().div(this.rowCount * this.columnCount);
  }
  /** 行和ベクトルを返す */
  rowSums() {
    return BigFloatVector.from(this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())).sum()));
  }
  /** 列和ベクトルを返す */
  columnSums() {
    if (this.isEmpty()) return BigFloatVector.empty();
    const resolvedPrecision = _BigFloatMatrix._resolvePrecision(this._flattenValues());
    return BigFloatVector.from(Array.from({ length: this.columnCount }, (_, column) => this._values.reduce((acc, row) => acc.add(row[column]), new BigFloat(0, resolvedPrecision))));
  }
  /** トレースを返す */
  trace() {
    _BigFloatMatrix._assertSquare(this);
    const resolvedPrecision = _BigFloatMatrix._resolvePrecision(this._flattenValues());
    let total = new BigFloat(0, resolvedPrecision);
    for (let index = 0; index < this.rowCount; index++) {
      total = total.add(this._values[index][index]);
    }
    return total;
  }
  /** Frobenius ノルムを返す */
  frobeniusNorm() {
    return this.flatten().squaredNorm().sqrt();
  }
  /** 行列積を計算する */
  matmul(other) {
    const matrix = _BigFloatMatrix._coerceMatrix(other, this._flattenValues());
    _BigFloatMatrix._assertMultipliable(this, matrix);
    if (this.rowCount === 0 || this.columnCount === 0 || matrix.columnCount === 0) return _BigFloatMatrix.empty();
    const resolvedPrecision = _BigFloatMatrix._resolvePrecision([...this._flattenValues(), ...matrix._flattenValues()]);
    const values = Array.from(
      { length: this.rowCount },
      (_, row) => Array.from({ length: matrix.columnCount }, (_2, column) => {
        let total = new BigFloat(0, resolvedPrecision);
        for (let index = 0; index < this.columnCount; index++) {
          total = total.add(this._values[row][index].mul(matrix._values[index][column]));
        }
        return total;
      })
    );
    return _BigFloatMatrix._fromBigFloatGrid(values);
  }
  /** ベクトル積を計算する */
  mulVector(vector) {
    const rhs = _BigFloatMatrix._coerceVector(vector, this._flattenValues());
    if (this.columnCount !== rhs.length) throw new RangeError("Inner matrix dimensions must agree");
    return BigFloatVector.from(this._values.map((row) => BigFloatVector.from(row.map((value) => value.clone())).dot(rhs)));
  }
  /** 行列式を返す */
  determinant() {
    _BigFloatMatrix._assertSquare(this);
    const size = this.rowCount;
    if (size === 0) return new BigFloat(1);
    const values = this.toArray();
    let sign = 1;
    let det = new BigFloat(1, _BigFloatMatrix._resolvePrecision(this._flattenValues()));
    for (let column = 0; column < size; column++) {
      let bestRow = -1;
      let bestValue = null;
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
  /** ランクを返す */
  rank() {
    return _BigFloatMatrix._reducedRowEchelon(this.toArray(), this.columnCount).pivotColumns.length;
  }
  /** 逆行列を返す */
  inverse() {
    _BigFloatMatrix._assertSquare(this);
    const identity = _BigFloatMatrix.identity(this.rowCount, _BigFloatMatrix._resolvePrecision(this._flattenValues()));
    return this.solveMatrix(identity);
  }
  /** 連立方程式 Ax=b を解く */
  solveVector(rhs) {
    _BigFloatMatrix._assertSquare(this);
    const vector = _BigFloatMatrix._coerceVector(rhs, this._flattenValues());
    if (vector.length !== this.rowCount) throw new RangeError("Right-hand side vector length must match row count");
    const solution = this.solveMatrix(_BigFloatMatrix.fromColumns([vector.toArray()]));
    return solution.column(0) ?? BigFloatVector.empty();
  }
  /** 連立方程式 AX=B を解く */
  solveMatrix(rhs) {
    _BigFloatMatrix._assertSquare(this);
    const right = _BigFloatMatrix._coerceMatrix(rhs, this._flattenValues());
    if (right.rowCount !== this.rowCount) throw new RangeError("Right-hand side row count must match");
    const size = this.rowCount;
    const augmented = this._values.map((row, rowIndex) => [...row.map((value) => value.clone()), ...right._values[rowIndex].map((value) => value.clone())]);
    const { values, pivotColumns } = _BigFloatMatrix._reducedRowEchelon(augmented, size);
    if (pivotColumns.length !== size) throw new RangeError("Matrix is singular");
    const epsilon = _BigFloatMatrix._epsilon(_BigFloatMatrix._resolvePrecision([...this._flattenValues(), ...right._flattenValues()]));
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        const expected = new BigFloat(row === column ? 1 : 0, epsilon._precision);
        if (values[row][column].absoluteDiff(expected).gt(epsilon)) throw new RangeError("Matrix is singular");
      }
    }
    return _BigFloatMatrix._fromBigFloatGrid(values.map((row) => row.slice(size)));
  }
  /** 行列累乗を返す */
  matrixPow(exponent) {
    _BigFloatMatrix._assertSquare(this);
    if (!Number.isFinite(exponent) || !Number.isInteger(exponent)) throw new RangeError("Matrix exponent must be an integer");
    if (exponent === 0) return _BigFloatMatrix.identity(this.rowCount, _BigFloatMatrix._resolvePrecision(this._flattenValues()));
    if (exponent < 0) return this.inverse().matrixPow(-exponent);
    let result = _BigFloatMatrix.identity(this.rowCount, _BigFloatMatrix._resolvePrecision(this._flattenValues()));
    let base = this.clone();
    let power = exponent;
    while (power > 0) {
      if ((power & 1) === 1) result = result.matmul(base);
      power >>= 1;
      if (power > 0) base = base.matmul(base);
    }
    return result;
  }
};

// src/bigFloatComplex.ts
var BigFloatComplex = class _BigFloatComplex {
  /** 実部 */
  _real;
  /** 虚部 */
  _imag;
  /** 精度 */
  _precision;
  constructor(real = 0, imagOrPrecision, precision) {
    const { imagPartValue, precisionValue } = _BigFloatComplex._normalizeArguments(real, imagOrPrecision, precision, arguments.length);
    const { realPart, imagPart } = _BigFloatComplex._normalizeParts(real, imagPartValue);
    const resolvedPrecision = _BigFloatComplex._resolvePrecision([realPart, imagPart], precisionValue);
    this._real = _BigFloatComplex._toBigFloat(realPart, resolvedPrecision);
    this._imag = _BigFloatComplex._toBigFloat(imagPart, resolvedPrecision);
    this._precision = resolvedPrecision;
  }
  /** BigFloat へ変換する */
  static _toBigFloat(value, precision) {
    if (value instanceof BigFloat) {
      const cloned = value.clone();
      if (precision === void 0 || cloned._precision === precision) return cloned;
      return cloned.changePrecision(precision);
    }
    return new BigFloat(value, precision ?? BigFloat.DEFAULT_PRECISION);
  }
  /** 精度を解決する */
  static _resolvePrecision(values, precision) {
    if (precision !== void 0) return BigInt(precision);
    let resolved = BigFloat.DEFAULT_PRECISION;
    for (const value of values) {
      if (value instanceof BigFloat && value._precision > resolved) resolved = value._precision;
    }
    return resolved;
  }
  /** 内部 BigFloat から生成する */
  static _fromBigFloats(real, imag) {
    const complex = Object.create(_BigFloatComplex.prototype);
    const precision = real._precision > imag._precision ? real._precision : imag._precision;
    complex._real = real._precision === precision ? real.clone() : real.clone().changePrecision(precision);
    complex._imag = imag._precision === precision ? imag.clone() : imag.clone().changePrecision(precision);
    complex._precision = precision;
    return complex;
  }
  /** 複素数表現を正規化する */
  static _normalizeParts(value, imag) {
    if (value instanceof _BigFloatComplex) return { realPart: value._real, imagPart: value._imag };
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
      const objectValue = value;
      return {
        realPart: objectValue.re ?? objectValue.real ?? 0,
        imagPart: objectValue.im ?? objectValue.imag ?? 0
      };
    }
    return { realPart: 0, imagPart: imag ?? 0 };
  }
  /** 引数を正規化する */
  static _normalizeArguments(value, imagOrPrecision, precision, argCount = 0) {
    if (argCount <= 1) return { imagPartValue: 0, precisionValue: precision };
    if (precision !== void 0) return { imagPartValue: imagOrPrecision, precisionValue: precision };
    if (argCount === 2 && this._shouldTreatSecondArgumentAsPrecision(value, imagOrPrecision)) {
      return { imagPartValue: 0, precisionValue: imagOrPrecision };
    }
    return { imagPartValue: imagOrPrecision, precisionValue: precision };
  }
  /** 第2引数を精度として解釈すべきか */
  static _shouldTreatSecondArgumentAsPrecision(value, imagOrPrecision) {
    if (typeof imagOrPrecision !== "number" && typeof imagOrPrecision !== "bigint") return false;
    if (value instanceof _BigFloatComplex) return true;
    if (Array.isArray(value)) return true;
    if (typeof value === "string") return this._parseComplexString(value) !== null;
    return typeof value === "object" && value !== null;
  }
  /** 複素数文字列を解析する */
  static _parseComplexString(value) {
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
      imagPart: this._normalizeImaginaryCoefficient(imagPart, value)
    };
  }
  /** 虚部係数を正規化する */
  static _normalizeImaginaryCoefficient(value, original) {
    if (value === "" || value === "+") return 1;
    if (value === "-") return -1;
    if (/[iI]/.test(value)) throw new SyntaxError(`Invalid complex string: ${original}`);
    return value;
  }
  /** 値を複素数へ変換する */
  static _toComplex(value, precision) {
    if (value instanceof _BigFloatComplex) {
      if (precision === void 0 || value._precision === precision) return value.clone();
      return value.changePrecision(precision);
    }
    if (precision === void 0) return new _BigFloatComplex(value);
    if (this._shouldTreatSecondArgumentAsPrecision(value, precision)) return new _BigFloatComplex(value, precision);
    return new _BigFloatComplex(value, 0, precision);
  }
  /** 複素数定数 0 */
  static zero(precision = 20) {
    return new _BigFloatComplex(0, 0, precision);
  }
  /** 複素数定数 1 */
  static one(precision = 20) {
    return new _BigFloatComplex(1, 0, precision);
  }
  /** 複素数定数 i */
  static i(precision = 20) {
    return new _BigFloatComplex(0, 1, precision);
  }
  /** e を返す */
  static e(precision = 20) {
    return new _BigFloatComplex(BigFloat.e(precision), 0, precision);
  }
  /** pi を返す */
  static pi(precision = 20) {
    return new _BigFloatComplex(BigFloat.pi(precision), 0, precision);
  }
  /** tau を返す */
  static tau(precision = 20) {
    return new _BigFloatComplex(BigFloat.tau(precision), 0, precision);
  }
  static from(value, imag, precision) {
    if (precision !== void 0) return new _BigFloatComplex(value, imag, precision);
    if (imag === void 0) return new _BigFloatComplex(value);
    if (this._shouldTreatSecondArgumentAsPrecision(value, imag)) return new _BigFloatComplex(value, imag);
    return new _BigFloatComplex(value, imag);
  }
  /** 値の並びから生成する */
  static of(real, imag = 0, precision) {
    return new _BigFloatComplex(real, imag, precision);
  }
  /** 極形式から生成する */
  static fromPolar(magnitude, angle, precision) {
    const resolvedPrecision = this._resolvePrecision([magnitude, angle], precision);
    const r = this._toBigFloat(magnitude, resolvedPrecision);
    const theta = this._toBigFloat(angle, resolvedPrecision);
    return this._fromBigFloats(r.mul(theta.cos()), r.mul(theta.sin()));
  }
  /** 複素数の総和を返す */
  static sum(values, precision) {
    let result = precision === void 0 ? this.zero() : this.zero(precision);
    for (const value of values) result = result.add(value);
    return result;
  }
  /** 複素数の総積を返す */
  static product(values, precision) {
    let result = precision === void 0 ? this.one() : this.one(precision);
    for (const value of values) result = result.mul(value);
    return result;
  }
  /** 複素数の平均を返す */
  static average(values, precision) {
    let count = 0;
    let total = precision === void 0 ? this.zero() : this.zero(precision);
    for (const value of values) {
      total = total.add(value);
      count++;
    }
    if (count === 0) return precision === void 0 ? this.zero() : this.zero(precision);
    return total.div(count);
  }
  /** 実部 */
  get real() {
    return this._real.clone();
  }
  /** 虚部 */
  get imag() {
    return this._imag.clone();
  }
  /** 精度 */
  get precision() {
    return this._precision;
  }
  /** 複製する */
  clone() {
    return _BigFloatComplex._fromBigFloats(this._real, this._imag);
  }
  /** 精度を変更する */
  changePrecision(precision) {
    const precisionBig = BigInt(precision);
    return _BigFloatComplex._fromBigFloats(this._real.clone().changePrecision(precisionBig), this._imag.clone().changePrecision(precisionBig));
  }
  /** 配列へ変換する */
  toArray() {
    return [this._real.clone(), this._imag.clone()];
  }
  /** ベクトルへ変換する */
  toVector() {
    return BigFloatVector.from([this._real.clone(), this._imag.clone()]);
  }
  /** 極形式へ変換する */
  toPolar() {
    return { magnitude: this.abs(), angle: this.arg() };
  }
  /** JSON へ変換する */
  toJSON() {
    return { re: this._real.toString(), im: this._imag.toString() };
  }
  /** 文字列化する */
  toString(base = 10, precision = this._precision) {
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
  [Symbol.iterator]() {
    return this.toArray()[Symbol.iterator]();
  }
  /** 一致判定 */
  equals(other) {
    const rhs = _BigFloatComplex._toComplex(other, this._precision);
    return this._real.eq(rhs._real) && this._imag.eq(rhs._imag);
  }
  /** 別値判定 */
  ne(other) {
    return !this.equals(other);
  }
  /** ゼロ判定 */
  isZero() {
    return this._real.isZero() && this._imag.isZero();
  }
  /** 純実数判定 */
  isReal() {
    return this._imag.isZero();
  }
  /** 純虚数判定 */
  isImaginary() {
    return this._real.isZero() && !this._imag.isZero();
  }
  /** 共役複素数を返す */
  conjugate() {
    return _BigFloatComplex._fromBigFloats(this._real, this._imag.neg());
  }
  /** 符号反転する */
  neg() {
    return _BigFloatComplex._fromBigFloats(this._real.neg(), this._imag.neg());
  }
  /** 絶対値の二乗を返す */
  absSquared() {
    return this._real.mul(this._real).add(this._imag.mul(this._imag));
  }
  /** 絶対値を返す */
  abs() {
    return this.absSquared().sqrt();
  }
  /** 偏角を返す */
  arg() {
    if (this.isZero()) return new BigFloat(0, this._precision);
    return this._imag.atan2(this._real);
  }
  /** 符号複素数を返す */
  sign() {
    if (this.isZero()) return _BigFloatComplex.zero(this._precision);
    return this.div(this.abs());
  }
  /** 正規化する */
  normalize() {
    if (this.isZero()) throw new RangeError("Cannot normalize zero complex");
    return this.div(this.abs());
  }
  /** 距離を返す */
  distanceTo(other) {
    return this.sub(other).abs();
  }
  /** 相対差を返す */
  relativeDiff(other) {
    const rhs = _BigFloatComplex._toComplex(other, this._precision);
    const diff = this.sub(rhs).abs();
    const lhsAbs = this.abs();
    const rhsAbs = rhs.abs();
    const denominator = lhsAbs.gt(rhsAbs) ? lhsAbs : rhsAbs;
    if (denominator.isZero()) return new BigFloat(0, this._precision);
    return diff.div(denominator);
  }
  /** 絶対差を返す */
  absoluteDiff(other) {
    return this.sub(other).abs();
  }
  /** 百分率差分を返す */
  percentDiff(other) {
    const rhs = _BigFloatComplex._toComplex(other, this._precision);
    const rhsAbs = rhs.abs();
    if (rhsAbs.isZero()) return new BigFloat(0, this._precision);
    return this.absoluteDiff(rhs).div(rhsAbs).mul(100);
  }
  /** 加算する */
  add(other) {
    const rhs = _BigFloatComplex._toComplex(other, this._precision);
    return _BigFloatComplex._fromBigFloats(this._real.add(rhs._real), this._imag.add(rhs._imag));
  }
  /** 減算する */
  sub(other) {
    const rhs = _BigFloatComplex._toComplex(other, this._precision);
    return _BigFloatComplex._fromBigFloats(this._real.sub(rhs._real), this._imag.sub(rhs._imag));
  }
  /** 乗算する */
  mul(other) {
    const rhs = _BigFloatComplex._toComplex(other, this._precision);
    const real = this._real.mul(rhs._real).sub(this._imag.mul(rhs._imag));
    const imag = this._real.mul(rhs._imag).add(this._imag.mul(rhs._real));
    return _BigFloatComplex._fromBigFloats(real, imag);
  }
  /** 除算する */
  div(other) {
    const rhs = _BigFloatComplex._toComplex(other, this._precision);
    const denominator = rhs.absSquared();
    if (denominator.isZero()) throw new RangeError("Division by zero complex");
    return this.mul(rhs.conjugate()).divByReal(denominator);
  }
  /** 実数で除算する */
  divByReal(value) {
    return _BigFloatComplex._fromBigFloats(this._real.div(value), this._imag.div(value));
  }
  /** 逆数を返す */
  reciprocal() {
    return _BigFloatComplex.one(this._precision).div(this);
  }
  /** 回転する */
  rotate(angle) {
    return this.mul(_BigFloatComplex.fromPolar(1, angle, this._precision));
  }
  /** 指数関数を計算する */
  exp() {
    const realExp = this._real.exp();
    return _BigFloatComplex._fromBigFloats(realExp.mul(this._imag.cos()), realExp.mul(this._imag.sin()));
  }
  /** exp(z)-1 を計算する */
  expm1() {
    return this.exp().sub(1);
  }
  /** 自然対数を計算する */
  ln() {
    if (this.isZero()) throw new RangeError("ln(0) is undefined");
    return _BigFloatComplex._fromBigFloats(this.abs().ln(), this.arg());
  }
  /** 対数を計算する */
  log(base) {
    return this.ln().div(_BigFloatComplex._toComplex(base, this._precision).ln());
  }
  /** 冪乗を計算する */
  pow(exponent) {
    const rhs = _BigFloatComplex._toComplex(exponent, this._precision);
    if (rhs.isZero()) return _BigFloatComplex.one(this._precision);
    if (this.isZero()) {
      if (rhs.isReal() && rhs._real.gt(0)) return _BigFloatComplex.zero(this._precision);
      throw new RangeError("0 cannot be raised to this exponent");
    }
    return this.ln().mul(rhs).exp();
  }
  /** 平方根を計算する */
  sqrt() {
    if (this.isZero()) return _BigFloatComplex.zero(this._precision);
    const radius = this.abs();
    const two = new BigFloat(2, this._precision);
    const real = radius.add(this._real).div(two).sqrt();
    const imagMagnitude = radius.sub(this._real).div(two).sqrt();
    const imagSign = this._imag.isZero() && this._real.isNegative() ? new BigFloat(1, this._precision) : this._imag.sign();
    const imag = imagSign.mul(imagMagnitude);
    return _BigFloatComplex._fromBigFloats(real, imag);
  }
  /** 立方根を計算する */
  cbrt() {
    return this.nthRoot(3);
  }
  /** 主値の n 乗根を計算する */
  nthRoot(n) {
    const roots = this.nthRoots(n);
    return roots[0];
  }
  /** n 乗根を全て返す */
  nthRoots(n) {
    const degree = typeof n === "number" ? Math.trunc(n) : Number(n);
    if (!Number.isFinite(degree) || degree <= 0 || !Number.isInteger(degree)) throw new RangeError("Root degree must be a positive integer");
    if (this.isZero()) return [_BigFloatComplex.zero(this._precision)];
    const count = BigInt(degree);
    const magnitude = this.abs().nthRoot(count);
    const angle = this.arg();
    const tau = BigFloat.tau(this._precision);
    return Array.from({ length: degree }, (_, index) => _BigFloatComplex.fromPolar(magnitude, angle.add(tau.mul(index)).div(count), this._precision));
  }
  /** 正弦を計算する */
  sin() {
    return _BigFloatComplex._fromBigFloats(this._real.sin().mul(this._imag.cosh()), this._real.cos().mul(this._imag.sinh()));
  }
  /** 余弦を計算する */
  cos() {
    return _BigFloatComplex._fromBigFloats(this._real.cos().mul(this._imag.cosh()), this._real.sin().mul(this._imag.sinh()).neg());
  }
  /** 正接を計算する */
  tan() {
    return this.sin().div(this.cos());
  }
  /** 双曲線正弦を計算する */
  sinh() {
    return _BigFloatComplex._fromBigFloats(this._real.sinh().mul(this._imag.cos()), this._real.cosh().mul(this._imag.sin()));
  }
  /** 双曲線余弦を計算する */
  cosh() {
    return _BigFloatComplex._fromBigFloats(this._real.cosh().mul(this._imag.cos()), this._real.sinh().mul(this._imag.sin()));
  }
  /** 双曲線正接を計算する */
  tanh() {
    return this.sinh().div(this.cosh());
  }
  /** 逆正弦を計算する */
  asin() {
    const i = _BigFloatComplex.i(this._precision);
    const one = _BigFloatComplex.one(this._precision);
    return i.neg().mul(
      i.mul(this).add(one.sub(this.mul(this)).sqrt()).ln()
    );
  }
  /** 逆余弦を計算する */
  acos() {
    const halfPi = _BigFloatComplex.pi(this._precision).div(2);
    return halfPi.sub(this.asin());
  }
  /** 逆正接を計算する */
  atan() {
    const i = _BigFloatComplex.i(this._precision);
    const one = _BigFloatComplex.one(this._precision);
    return i.mul(
      one.sub(i.mul(this)).ln().sub(one.add(i.mul(this)).ln())
    ).div(2);
  }
  /** 逆双曲線正弦を計算する */
  asinh() {
    return this.mul(this).add(1).sqrt().add(this).ln();
  }
  /** 逆双曲線余弦を計算する */
  acosh() {
    const one = _BigFloatComplex.one(this._precision);
    return this.add(this.add(one).sqrt().mul(this.sub(one).sqrt())).ln();
  }
  /** 逆双曲線正接を計算する */
  atanh() {
    const one = _BigFloatComplex.one(this._precision);
    return one.add(this).ln().sub(one.sub(this).ln()).div(2);
  }
};
export {
  BigFloat,
  BigFloatComplex,
  BigFloatConfig,
  BigFloatError,
  BigFloatMatrix,
  BigFloatStream,
  BigFloatVector,
  CacheNotInitializedError,
  DivisionByZeroError,
  NumericalComputationError,
  PrecisionMismatchError,
  RoundingMode,
  SpecialValueState,
  SpecialValuesDisabledError,
  bigFloat
};
//# sourceMappingURL=BigFloat.js.map
