/*!
 * BigFloat 1.2.10
 * Copyright 2026 hi2ma-bu4
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */

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
  _precision = 20n;
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
      throw new Error("Special values are disabled");
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
      throw new Error("Special values are disabled");
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
        throw new Error("Special values are disabled");
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
        return Number(this.mantissa) * Math.pow(2, Number(this._exp2)) * Math.pow(5, Number(this._exp5));
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
  constructor(value, precision = 20n) {
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
        if (!construct.config.allowSpecialValues) throw new Error("Special values are disabled");
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
        if (!construct.config.allowSpecialValues) throw new Error("Special values are disabled");
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
  static parseFloat(str, precision = 20n, base = 10) {
    if (str instanceof _BigFloat) return str.clone();
    if (typeof str !== "string") str = String(str);
    if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
    if (base === 10) return new this(str, precision);
    const [rawInt, rawFrac = ""] = str.toLowerCase().replace(/^\+/, "").split(".");
    const sign = str.trim().startsWith("-") ? -1n : 1n;
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    const toDigit = (ch) => {
      const d = digits.indexOf(ch);
      if (d < 0 || d >= base) throw new Error(`Invalid digit '${ch}' for base ${base}`);
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
   * 引数を正規化する
   * @param args - 引数リスト
   * @returns 正規化された引数リスト
   */
  static _normalizeArgs(args) {
    if (args.length === 1 && Array.isArray(args[0])) {
      return args[0];
    }
    return args;
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
      if (this._precision > bfB._precision) {
        bfB.changePrecision(this._precision);
      } else {
        this.changePrecision(bfB._precision);
      }
    }
    const resA = mutateA ? this : this.clone();
    const resB = bfB._precision === resA._precision ? bfB : bfB.clone().changePrecision(resA._precision);
    if (resA._exp2 === resB._exp2 && resA._exp5 === resB._exp5) {
      return [resA, resB];
    }
    const minExp2 = resA._exp2 < resB._exp2 ? resA._exp2 : resB._exp2;
    const minExp5 = resA._exp5 < resB._exp5 ? resA._exp5 : resB._exp5;
    if (resA._exp2 > minExp2) {
      resA.mantissa <<= BigInt(resA._exp2 - minExp2);
      resA._exp2 = minExp2;
    }
    let finalB = resB;
    if (resB._exp2 > minExp2 || resB._exp5 > minExp5) {
      finalB = resB.clone();
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
      throw new Error("Special values are disabled");
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
    if (bfB.mantissa === 0n) throw new Error("Division by zero");
    const mutate = construct.config.mutateResult;
    const res = mutate ? this : this.clone();
    res._precision = resultPrecision;
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
    const targetP = res._precision + 10n;
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
    const temp = this.clone();
    const config = this.constructor.config;
    const originalMode = config.roundingMode;
    config.roundingMode = 4 /* HALF_UP */;
    temp._applyPrecision(0n);
    config.roundingMode = originalMode;
    return this._makeResultFromInstance(temp);
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
      if (positivePow === 0n) throw new Error("Division by zero in power function");
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
      throw new Error("Fractional power of negative number is not real");
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
    if (n < 0n) throw new Error("Cannot compute square root of negative number");
    if (n === 0n) return 0n;
    const scale = this._getPow10(precision);
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
  sqrt() {
    const construct = this.constructor;
    if (!this._isFiniteState()) {
      this._ensureSpecialValuesEnabled(this);
      if (this._specialState === 1 /* POSITIVE_INFINITY */) return this._specialResult(1 /* POSITIVE_INFINITY */);
      return this._specialResult(3 /* NAN */);
    }
    if (this.mantissa < 0n) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
      throw new Error("Cannot compute square root of negative number");
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
      const numVal = Number(valForSqrt.toString().slice(0, 15));
      const numLen = valForSqrt.toString().length;
      if (numLen > 15) {
        x = BigInt(Math.floor(Math.sqrt(numVal))) * construct._getPow10(BigInt(Math.floor((numLen - 15) / 2)));
      } else {
        x = BigInt(Math.floor(Math.sqrt(Number(valForSqrt))));
      }
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
      throw new Error("n must be a positive integer");
    }
    if (v < 0n) {
      if (n % 2n === 0n) {
        throw new Error("Even root of negative number is not real");
      }
      return -this._nthRoot(-v, n, precision);
    }
    const scale = this._getPow10(precision);
    let x = scale;
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
    if (bn <= 0n) throw new Error("n must be a positive integer");
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
      throw new Error("Even root of negative number");
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
    if (cosX === 0n || cosX > -EPSILON && cosX < EPSILON) throw new Error("tan(x) is undefined or numerically unstable at this point");
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
    if (x > scale || x < -scale) throw new Error("asin input out of range [-1,1]");
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
        if (cosTheta === 0n) throw new Error("Derivative undefined");
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
      if (dfx === 0n) throw new Error("Derivative zero during Newton iteration");
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
    if (value <= 0n) throw new Error("ln(x) is undefined for x <= 0");
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
      throw new Error("ln(x) is undefined for x <= 0");
    }
    if (this.mantissa < 0n) {
      if (config.allowSpecialValues) return this._specialResult(3 /* NAN */);
      throw new Error("ln(x) is undefined for x <= 0");
    }
    if (this._getExactInteger() === 1n) return this._makeExactResult(0n);
    if (this._precision <= 15n) {
      const val2 = this.toNumber();
      if (val2 <= 0) throw new Error("ln(x) is undefined for x <= 0");
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
    if (lnB === 0n) throw new Error("log base cannot be 1 or 0");
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
      throw new Error("ln(x) is undefined for x <= 0");
    }
    if (this.mantissa < 0n) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
      throw new Error("ln(x) is undefined for x <= 0");
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
      throw new Error("ln(x) is undefined for x <= 0");
    }
    if (this.mantissa < 0n) {
      if (construct.config.allowSpecialValues) return this._specialResult(3 /* NAN */);
      throw new Error("ln(x) is undefined for x <= 0");
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
      throw new Error("ln(x) is undefined for x <= 0");
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
  static e(precision = 20n) {
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
  static _piChudnovsky(precision = 20n) {
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
  static pi(precision = 20n) {
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
  static tau(precision = 20n) {
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
  static max(...args) {
    const arr = this._normalizeArgs(args).map((x) => x instanceof _BigFloat ? x : new this(x));
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
  static min(...args) {
    const arr = this._normalizeArgs(args).map((x) => x instanceof _BigFloat ? x : new this(x));
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
  static variance(...args) {
    const arr = this._normalizeArgs(args).map((x) => x instanceof _BigFloat ? x : new this(x));
    if (arr.length === 0) throw new Error("No arguments provided");
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
  static random(precision = 20n) {
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
      throw new Error("zeta(s) requires s > 1 in _zetaPositive");
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
    if (denominator === 0n) throw new Error("zeta(s) has a pole at s = 1");
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
    if (s === scale) throw new Error("zeta(s) has a pole at s = 1");
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
      throw new Error("z must not be a non-positive integer (pole)");
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
      if (denominator === 0n) throw new Error("division by zero");
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
      throw new Error("zeta(s) has a pole at s = 1");
    }
    if (exactInteger === 0n) return this._makeExactResult(-1n, -1n);
    const currentPrecisionValue = this._getInternalValue(this._precision);
    const extraCancellationDigits = construct._zetaPoleCancellationDigits(currentPrecisionValue, this._precision);
    const totalPr = this._precision + construct.config.extraPrecision + extraCancellationDigits + 6n;
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
    throw new Error(`use _getCheckPiCache first`);
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
    throw new Error(`use _getCheckECache first`);
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
    throw new Error(`use _getCheckLnCache first`);
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
      const workPrecision = nextPrecision + 8n;
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
  static nan(precision = 20n) {
    return this._createSpecialValue(3 /* NAN */, BigInt(precision));
  }
  /**
   * 定数 Infinity を取得する
   * @param precision - 精度
   * @returns Infinity
   * @throws {Error} 特殊値が無効な場合
   */
  static infinity(precision = 20n) {
    return this._createSpecialValue(1 /* POSITIVE_INFINITY */, BigInt(precision));
  }
  /**
   * 定数 -Infinity を取得する
   * @param precision - 精度
   * @returns -Infinity
   * @throws {Error} 特殊値が無効な場合
   */
  static negativeInfinity(precision = 20n) {
    return this._createSpecialValue(2 /* NEGATIVE_INFINITY */, BigInt(precision));
  }
  /**
   * 定数 -10 を取得する
   * @param precision - 精度
   * @returns -10
   */
  static minusTen(precision = 20n) {
    return new this(-10n, precision);
  }
  /**
   * 定数 -2 を取得する
   * @param precision - 精度
   * @returns -2
   */
  static minusTwo(precision = 20n) {
    return new this(-2n, precision);
  }
  /**
   * 定数 -1 を取得する
   * @param precision - 精度
   * @returns -1
   */
  static minusOne(precision = 20n) {
    return new this(-1n, precision);
  }
  /**
   * 定数 0 を取得する
   * @param precision - 精度
   * @returns 0
   */
  static zero(precision = 20n) {
    return new this(0n, precision);
  }
  /**
   * 定数 0.25 を取得する
   * @param precision - 精度
   * @returns 0.25
   */
  static quarter(precision = 20n) {
    return new this("0.25", precision);
  }
  /**
   * 定数 0.5 を取得する
   * @param precision - 精度
   * @returns 0.5
   */
  static half(precision = 20n) {
    return new this("0.5", precision);
  }
  /**
   * 定数 1 を取得する
   * @param precision - 精度
   * @returns 1
   */
  static one(precision = 20n) {
    return new this(1n, precision);
  }
  /**
   * 定数 2 を取得する
   * @param precision - 精度
   * @returns 2
   */
  static two(precision = 20n) {
    return new this(2n, precision);
  }
  /**
   * 定数 10 を取得する
   * @param precision - 精度
   * @returns 10
   */
  static ten(precision = 20n) {
    return new this(10n, precision);
  }
  /**
   * 定数 100 を取得する
   * @param precision - 精度
   * @returns 100
   */
  static hundred(precision = 20n) {
    return new this(100n, precision);
  }
  /**
   * 定数 1000 を取得する
   * @param precision - 精度
   * @returns 1000
   */
  static thousand(precision = 20n) {
    return new this(1000n, precision);
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
    return new BigFloat(value, precision ?? 20n);
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
    let resolved = 20n;
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
    const resolvedPrecision = precision === void 0 ? 20n : BigInt(precision);
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
    const resolvedPrecision = precision === void 0 ? 20n : BigInt(precision);
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
    const resolvedPrecision = precision === void 0 ? 20n : BigInt(precision);
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
      if (stepValue.isZero()) throw new Error("Step cannot be zero");
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
    return Array.from(this);
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
   * 要素の最大値を返す (終端操作)
   * @returns 最大値
   */
  max() {
    const iter = this[Symbol.iterator]();
    const first = iter.next();
    if (first.done) throw new Error("No arguments provided");
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
    if (first.done) throw new Error("No arguments provided");
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
export {
  BigFloat,
  BigFloatConfig,
  BigFloatStream,
  RoundingMode,
  SpecialValueState,
  bigFloat
};
//# sourceMappingURL=BigFloat.js.map
