/*!
 * BigFloat 1.0.1
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
var PiAlgorithm = /* @__PURE__ */ ((PiAlgorithm2) => {
  PiAlgorithm2[PiAlgorithm2["MATH_DEFAULT"] = 0] = "MATH_DEFAULT";
  PiAlgorithm2[PiAlgorithm2["LEIBNIZ"] = 1] = "LEIBNIZ";
  PiAlgorithm2[PiAlgorithm2["NEWTON"] = 2] = "NEWTON";
  PiAlgorithm2[PiAlgorithm2["CHUDNOVSKY"] = 3] = "CHUDNOVSKY";
  return PiAlgorithm2;
})(PiAlgorithm || {});

// src/bigFloat.ts
var BigFloatConfig = class _BigFloatConfig {
  /** 精度の不一致を許容するかどうか */
  allowPrecisionMismatch;
  /** 破壊的な計算(自身の上書き)をするかどうか */
  mutateResult;
  /** 丸めモード */
  roundingMode;
  /** 計算時に追加する精度 */
  extraPrecision;
  /** 円周率の計算アルゴリズム */
  piAlgorithm;
  /** 三角関数の最大ステップ数 */
  trigFuncsMaxSteps;
  /** 対数計算の最大ステップ数 */
  lnMaxSteps;
  /**
   * @param options - 設定オプション
   */
  constructor({ allowPrecisionMismatch = false, mutateResult = false, roundingMode = 0 /* TRUNCATE */, extraPrecision = 2n, piAlgorithm = 3 /* CHUDNOVSKY */, trigFuncsMaxSteps = 5000n, lnMaxSteps = 10000n } = {}) {
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
  clone() {
    return new _BigFloatConfig({
      allowPrecisionMismatch: this.allowPrecisionMismatch,
      mutateResult: this.mutateResult,
      roundingMode: this.roundingMode,
      extraPrecision: this.extraPrecision,
      piAlgorithm: this.piAlgorithm,
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
  /** 設定 */
  static config = new BigFloatConfig();
  /** キャッシュ */
  static _cached = {};
  /** 内部的な値 (整数値として保持) */
  value = 0n;
  /** 精度 (小数点以下の桁数) */
  _precision = 20n;
  /**
   * @param value - 初期値
   * @param precision - 精度
   * @throws {RangeError} 精度が不正な場合
   */
  constructor(value, precision = 20n) {
    if (value instanceof _BigFloat) {
      this.value = value.value;
      this._precision = value._precision;
      return;
    }
    this._precision = BigInt(precision);
    this.constructor._checkPrecision(this._precision);
    if (value === void 0 || value === null || value === "") {
      this.value = 0n;
      return;
    }
    const { intPart, fracPart, sign } = this._parse(value.toString());
    const exPrec = this._precision + this.constructor.config.extraPrecision;
    const frac = fracPart.padEnd(Number(exPrec), "0").slice(0, Number(exPrec));
    const rawValue = BigInt(intPart + frac) * BigInt(sign);
    this.value = this.constructor._round(rawValue, exPrec, this._precision);
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
    instance.value = this.value;
    return instance;
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
    let fracVal = 0n;
    let scale = 1n;
    let basePow = 1n;
    for (let i = 0; i < rawFrac.length && BigInt(i) < BigInt(precision); i++) {
      basePow *= bigBase;
      fracVal = fracVal * bigBase + toDigit(rawFrac[i]);
      scale = basePow;
    }
    const precisionBig = BigInt(precision);
    const scale10 = 10n ** precisionBig;
    const fracScaled = scale === 0n ? 0n : fracVal * scale10 / scale;
    const total = (intVal * scale10 + fracScaled) * sign;
    return this._makeResult(total, precisionBig);
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
   * 数値を正規化
   * @param val - 正規化する値
   * @returns 正規化された文字列
   */
  _normalize(val) {
    const sign = val < 0n ? "-" : "";
    const absVal = val < 0n ? -val : val;
    const prec = Number(this._precision);
    if (prec === 0) {
      return `${sign}${absVal.toString()}`;
    }
    const s = absVal.toString().padStart(prec + 1, "0");
    const intPart = s.slice(0, -prec);
    const fracPart = s.slice(-prec);
    return `${sign}${intPart}.${fracPart}`;
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
   * 精度を合わせる
   * @param other - 合わせる対象
   * @param useExPrecision - 拡張精度を使用するかどうか
   * @returns [値A, 値B, 内部精度, 外部精度]
   * @throws {Error} 精度の不一致が許容されていない場合
   */
  _bothRescale(other, useExPrecision = false) {
    const precisionA = this._precision;
    if (!(other instanceof _BigFloat)) {
      other = new this.constructor(other);
    }
    const precisionB = other._precision;
    const config = this.constructor.config;
    if (precisionA === precisionB) {
      if (useExPrecision) {
        const exPr = config.extraPrecision;
        const exScale = 10n ** exPr;
        const valA2 = this.value * exScale;
        const valB2 = other.value * exScale;
        return [valA2, valB2, precisionA + exPr, precisionA];
      }
      return [this.value, other.value, precisionA, precisionA];
    }
    if (!config.allowPrecisionMismatch) throw new Error("Precision mismatch");
    const maxPrecision = precisionA > precisionB ? precisionA : precisionB;
    const maxExPrecision = maxPrecision + (useExPrecision ? config.extraPrecision : 0n);
    const scaleDiffA = maxExPrecision - precisionA;
    const scaleDiffB = maxExPrecision - precisionB;
    const valA = this.value * 10n ** scaleDiffA;
    const valB = other.value * 10n ** scaleDiffB;
    return [valA, valB, maxExPrecision, maxPrecision];
  }
  /**
   * 複数の精度を合わせる
   * @param arr - 精度を合わせるインスタンスのリスト
   * @param useExPrecision - 拡張精度を使用するかどうか
   * @returns [値のリスト, 内部精度, 外部精度]
   * @throws {Error} 精度の不一致が許容されていない場合
   */
  static _batchRescale(arr, useExPrecision = false) {
    const config = this.config;
    const exPr = config.extraPrecision;
    if (arr.length === 0) {
      if (useExPrecision) {
        return [[], exPr, 0n];
      }
      return [[], 0n, 0n];
    }
    arr = arr.slice();
    const allowMismatch = config.allowPrecisionMismatch;
    let maxPrecision = 0n;
    for (let i = 0; i < arr.length; i++) {
      let bf = arr[i];
      if (!(bf instanceof this)) {
        bf = arr[i] = new this(bf);
      }
      if (!allowMismatch && i > 0 && bf._precision !== arr[0]._precision) {
        throw new Error("Precision mismatch and allowPrecisionMismatch = false");
      }
      if (bf._precision > maxPrecision) maxPrecision = bf._precision;
    }
    let maxExPrecision = maxPrecision + (useExPrecision ? exPr : 0n);
    const retArr = arr.map((bf) => {
      const diff = maxExPrecision - bf._precision;
      return bf.value * 10n ** diff;
    });
    return [retArr, maxExPrecision, maxPrecision];
  }
  /**
   * 結果を作成する (静的メソッド)
   * @param val - 値
   * @param precision - 精度
   * @param exPrecision - 拡張精度
   * @returns 作成されたBigFloatインスタンス
   */
  static _makeResult(val, precision, exPrecision = precision) {
    const rounded = this._round(val, exPrecision, precision);
    const result = new this();
    result._precision = precision;
    result.value = rounded;
    return result;
  }
  /**
   * 結果を作成する (インスタンスメソッド)
   * @param val - 値
   * @param precision - 精度
   * @param exPrecision - 拡張精度
   * @param okMutate - 破壊的な変更を許可するかどうか
   * @returns 作成または更新されたBigFloatインスタンス
   */
  _makeResult(val, precision, exPrecision = precision, okMutate = true) {
    const construct = this.constructor;
    if (construct.config.mutateResult && okMutate) {
      const rounded = construct._round(val, exPrecision, precision);
      this._precision = precision;
      this.value = rounded;
      return this;
    }
    return construct._makeResult(val, precision, exPrecision);
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
    this.value = this.constructor._round(this.value, this._precision, precisionBig);
    this._precision = precisionBig;
    return this;
  }
  /**
   * どこまで精度が一致しているかを判定する
   * @param other - 比較対象
   * @returns 一致している桁数
   */
  matchingPrecision(other) {
    const [valA, valB, prec] = this._bothRescale(other);
    let diff = valA - valB;
    if (diff === 0n) return prec;
    diff = diff < 0n ? -diff : diff;
    let factor = 10n ** prec;
    let matched = 0n;
    while (matched < prec) {
      factor /= 10n;
      if (diff < factor) {
        matched += 1n;
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
    const [valA, valB] = this._bothRescale(other);
    if (valA < valB) return -1;
    if (valA > valB) return 1;
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
    return this.value === 0n;
  }
  /**
   * 正の数かどうかを判定する
   * @returns 正の数の場合はtrue
   */
  isPositive() {
    return this.value > 0n;
  }
  /**
   * 負の数かどうかを判定する
   * @returns 負の数の場合はtrue
   */
  isNegative() {
    return this.value < 0n;
  }
  /**
   * 相対差を計算する
   * @param other - 比較対象
   * @returns 相対差
   */
  relativeDiff(other) {
    const [valA, valB, prec] = this._bothRescale(other);
    const absA = valA < 0n ? -valA : valA;
    const absB = valB < 0n ? -valB : valB;
    const diff = valA > valB ? valA - valB : valB - valA;
    const denominator = absA > absB ? absA : absB;
    if (denominator === 0n) return this.constructor._makeResult(0n, prec);
    const scale = 10n ** prec;
    return this.constructor._makeResult(diff * scale / denominator, prec);
  }
  /**
   * 絶対差を計算する
   * @param other - 比較対象
   * @returns 絶対差
   */
  absoluteDiff(other) {
    const [valA, valB, prec] = this._bothRescale(other);
    return this.constructor._makeResult(valA > valB ? valA - valB : valB - valA, prec);
  }
  /**
   * 差分の非一致度を計算する (百分率)
   * @param other - 比較対象
   * @returns 非一致度 (%)
   */
  percentDiff(other) {
    const [valA, valB, prec] = this._bothRescale(other);
    const absB = valB < 0n ? -valB : valB;
    const diff = valA > valB ? valA - valB : valB - valA;
    if (absB === 0n) return this.constructor._makeResult(0n, prec);
    const scale = 10n ** prec;
    return this.constructor._makeResult(diff * scale * 100n / absB, prec);
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
    if (base === 10) {
      const precisionBig2 = BigInt(precision);
      if (precisionBig2 === this._precision) {
        return this._normalize(this.value);
      }
      const roundedValue = this.constructor._round(this.value, this._precision, precisionBig2);
      const tempInstance = new this.constructor();
      tempInstance._precision = precisionBig2;
      tempInstance.value = roundedValue;
      return tempInstance._normalize(roundedValue);
    }
    const val = this.value;
    const scale = 10n ** this._precision;
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    const sign = val < 0n ? "-" : "";
    const absVal = val < 0n ? -val : val;
    const intPart = absVal / scale;
    const fracPart = absVal % scale;
    const bigBase = BigInt(base);
    let intStr = "";
    let intCopy = intPart;
    if (intCopy === 0n) {
      intStr = "0";
    } else {
      while (intCopy > 0n) {
        const digit = intCopy % bigBase;
        intStr = digits[Number(digit)] + intStr;
        intCopy /= bigBase;
      }
    }
    if (this._precision === 0n) return `${sign}${intStr}`;
    const precisionBig = BigInt(precision);
    let fracStr = "";
    let frac = fracPart;
    for (let i = 0n; i < precisionBig; i++) {
      frac *= bigBase;
      const digit = frac / scale;
      fracStr += digits[Number(digit)];
      frac %= scale;
      if (frac === 0n) break;
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
    if (config.mutateResult) bf = bf.clone();
    return bf.scale().toString();
  }
  /**
   * Number型に変換する
   * @returns 変換された数値
   */
  toNumber() {
    return Number(this.toString());
  }
  /**
   * 指定した桁数で固定した文字列を取得する
   * @param digits - 小数点以下の桁数
   * @returns 固定小数点形式の文字列
   */
  toFixed(digits) {
    const str = this._normalize(this.value);
    const [intPart, fracPart = ""] = str.split(".");
    const d = Math.max(0, Number(digits));
    if (d === 0) return intPart;
    const fracFixed = fracPart.padEnd(d, "0").slice(0, d);
    return `${intPart}.${fracFixed}`;
  }
  /**
   * 指数形式の文字列を取得する
   * @param digits - 有効桁数
   * @returns 指数形式の文字列
   * @throws {RangeError} digitsが不正な場合
   */
  toExponential(digits = Number(this._precision)) {
    const prec = Number(this._precision);
    if (digits <= 0 || digits > prec) throw new RangeError("Invalid digits (must be between 1 and precision)");
    const isNeg = this.value < 0n;
    const absVal = isNeg ? -this.value : this.value;
    const s = absVal.toString().padStart(prec + 1, "0");
    const intPart = s.slice(0, -prec) || "0";
    const fracPart = s.slice(-prec);
    const raw = `${intPart}${fracPart}`;
    const firstDigitIndex = raw.search(/[1-9]/);
    if (firstDigitIndex === -1) return "0e+0";
    const mantissa = raw.slice(firstDigitIndex, firstDigitIndex + digits).padEnd(digits, "0");
    let decimal;
    if (digits === 1) {
      decimal = mantissa[0];
    } else {
      decimal = `${mantissa[0]}.${mantissa.slice(1)}`;
    }
    const exp = intPart.length - firstDigitIndex - 1;
    const signStr = isNeg ? "-" : "";
    const expStr = exp >= 0 ? `e+${exp}` : `e${exp}`;
    return `${signStr}${decimal}${expStr}`;
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
    const [valA, valB, prec] = this._bothRescale(other);
    return this._makeResult(valA + valB, prec);
  }
  /**
   * 減算する (-)
   * @param other - 減算する値
   * @returns 減算結果
   */
  sub(other) {
    const [valA, valB, prec] = this._bothRescale(other);
    return this._makeResult(valA - valB, prec);
  }
  /**
   * 乗算する (*)
   * @param other - 乗算する値
   * @returns 乗算結果
   */
  mul(other) {
    const [valA, valB, exPrec, prec] = this._bothRescale(other, true);
    const scale = 10n ** exPrec;
    const result = valA * valB / scale;
    return this._makeResult(result, prec, exPrec);
  }
  /**
   * 除算する (/)
   * @param other - 除算する値
   * @returns 除算結果
   * @throws {Error} ゼロ除算の場合
   */
  div(other) {
    const [valA, valB, exPrec, prec] = this._bothRescale(other, true);
    const scale = 10n ** exPrec;
    if (valB === 0n) throw new Error("Division by zero");
    const result = valA * scale / valB;
    return this._makeResult(result, prec, exPrec);
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
    const [valA, valB, prec] = this._bothRescale(other);
    const result = this.constructor._mod(valA, valB);
    return this._makeResult(result, prec);
  }
  /**
   * 符号を反転させる
   * @returns 符号が反転した結果
   */
  neg() {
    return this._makeResult(-this.value, this._precision);
  }
  /**
   * 絶対値を取得する (内部用)
   * @param val - 値
   * @returns 絶対値
   */
  static _abs(val) {
    return val < 0n ? -val : val;
  }
  /**
   * 絶対値を取得する
   * @returns 絶対値
   */
  abs() {
    return this._makeResult(this.constructor._abs(this.value), this._precision);
  }
  /**
   * 逆数を取得する
   * @returns 逆数
   * @throws {Error} ゼロの場合
   */
  reciprocal() {
    if (this.value === 0n) throw new Error("Division by zero");
    const construct = this.constructor;
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
    const scale = 10n ** totalPr;
    const result = scale * scale / val;
    return this._makeResult(result, this._precision, totalPr);
  }
  /**
   * 床関数 (負の無限大方向への丸め)
   * @returns 丸められた結果
   */
  floor() {
    const scale = 10n ** this._precision;
    const scaled = this.value / scale;
    const floored = this.value < 0n && this.value % scale !== 0n ? scaled - 1n : scaled;
    return this._makeResult(floored * scale, this._precision);
  }
  /**
   * 天井関数 (正の無限大方向への丸め)
   * @returns 丸められた結果
   */
  ceil() {
    const scale = 10n ** this._precision;
    const scaled = this.value / scale;
    const ceiled = this.value > 0n && this.value % scale !== 0n ? scaled + 1n : scaled;
    return this._makeResult(ceiled * scale, this._precision);
  }
  /**
   * 値を丸める (内部用)
   * @param val - 丸める値
   * @param currentPrec - 現在の精度
   * @param targetPrec - 目標の精度
   * @returns 丸められた値
   */
  static _round(val, currentPrec, targetPrec) {
    const diff = currentPrec - targetPrec;
    if (diff < 0n) {
      return val * 10n ** -diff;
    }
    if (diff === 0n) return val;
    const scale = 10n ** diff;
    const rem = val % scale;
    const base = val - rem;
    if (rem === 0n) return base / scale;
    const mode = this.config.roundingMode;
    const absRem = rem < 0n ? -rem : rem;
    const half = scale / 2n;
    const isNeg = val < 0n;
    let offset = 0n;
    switch (mode) {
      case 1 /* UP */:
        offset = isNeg ? -scale : scale;
        break;
      case 2 /* CEIL */:
        if (!isNeg) offset = scale;
        break;
      case 3 /* FLOOR */:
        if (isNeg) offset = -scale;
        break;
      case 4 /* HALF_UP */:
        if (absRem >= half) offset = isNeg ? -scale : scale;
        break;
      case 5 /* HALF_DOWN */:
        if (absRem > half) offset = isNeg ? -scale : scale;
        break;
      case 0 /* TRUNCATE */:
      case 0 /* DOWN */:
      default:
        break;
    }
    return (base + offset) / scale;
  }
  /**
   * 四捨五入する
   * @returns 四捨五入された結果
   */
  round() {
    const scale = 10n ** this._precision;
    const scaled = this.value / scale;
    const remainder = this.value % scale;
    const half = scale / 2n;
    let rounded;
    if (this.value >= 0n) {
      rounded = remainder >= half ? scaled + 1n : scaled;
    } else {
      rounded = -remainder >= half ? scaled - 1n : scaled;
    }
    return this._makeResult(rounded * scale, this._precision);
  }
  /**
   * 0に近い方向へ切り捨てる
   * @returns 切り捨てられた結果
   */
  trunc() {
    const scale = 10n ** this._precision;
    const truncated = this.value / scale;
    return this._makeResult(truncated * scale, this._precision);
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
    const scale = 10n ** precision;
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
    const [valA, valB, exPrec, prec] = this._bothRescale(exponent, true);
    const construct = this.constructor;
    const result = construct._pow(valA, valB, exPrec);
    return this._makeResult(result, prec, exPrec);
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
  sqrt() {
    const construct = this.constructor;
    const exPr = construct.config.extraPrecision;
    const prec = this._precision;
    const totalPr = prec + exPr;
    const val = this.value * 10n ** exPr;
    const x = construct._sqrt(val, totalPr);
    return this._makeResult(x, prec, totalPr);
  }
  /**
   * 立方根を計算する
   * @returns 立方根
   */
  cbrt() {
    const construct = this.constructor;
    const exPr = construct.config.extraPrecision;
    const prec = this._precision;
    const totalPr = prec + exPr;
    const val = this.value * 10n ** exPr;
    const x = construct._nthRoot(val, 3n, totalPr);
    return this._makeResult(x, prec, totalPr);
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
    const scale = 10n ** precision;
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
    const construct = this.constructor;
    const exPr = construct.config.extraPrecision;
    const prec = this._precision;
    const totalPr = prec + exPr;
    const val = this.value * 10n ** exPr;
    const x = construct._nthRoot(val, BigInt(n), totalPr);
    return this._makeResult(x, prec, totalPr);
  }
  /**
   * 末尾のゼロを削除して精度を最適化する
   * @returns 最適化されたインスタンス
   */
  scale() {
    let val = this.value;
    let scale = this._precision;
    const ZERO = 0n;
    const TEN = 10n;
    while (scale > ZERO && val % TEN === ZERO) {
      val /= TEN;
      scale--;
    }
    return this.constructor._makeResult(val, scale);
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
    let x2 = x * x / scale;
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
   * 正弦(sin)を計算する
   * @returns 正弦
   */
  sin() {
    const construct = this.constructor;
    const config = construct.config;
    const maxSteps = config.trigFuncsMaxSteps;
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
    const result = construct._sin(val, totalPr, maxSteps);
    return this._makeResult(result, this._precision, totalPr);
  }
  /**
   * 余弦(cos)を計算する (内部用)
   * @param x - 角度(ラジアン)
   * @param precision - 精度
   * @param maxSteps - 最大ステップ数
   * @returns 余弦
   */
  static _cos(x, precision, maxSteps) {
    const scale = 10n ** precision;
    let term = scale;
    let result = term;
    let x2 = x * x / scale;
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
    const maxSteps = config.trigFuncsMaxSteps;
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
    const result = construct._cos(val, totalPr, maxSteps);
    return this._makeResult(result, this._precision, totalPr);
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
    const EPSILON = 10n ** (precision - 4n);
    if (cosX === 0n || cosX > -EPSILON && cosX < EPSILON) throw new Error("tan(x) is undefined or numerically unstable at this point");
    const sinX = this._sin(x, precision, maxSteps);
    const scale = 10n ** precision;
    return sinX * scale / cosX;
  }
  /**
   * 正接(tan)を計算する
   * @returns 正接
   */
  tan() {
    const construct = this.constructor;
    const config = construct.config;
    const maxSteps = config.trigFuncsMaxSteps;
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
    const result = construct._tan(val, totalPr, maxSteps);
    return this._makeResult(result, this._precision, totalPr);
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
    const scale = 10n ** precision;
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
    const maxSteps = config.trigFuncsMaxSteps;
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
    const result = construct._asin(val, totalPr, maxSteps);
    return this._makeResult(result, this._precision, totalPr);
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
    const maxSteps = config.trigFuncsMaxSteps;
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
    const result = construct._acos(val, totalPr, maxSteps);
    return this._makeResult(result, this._precision, totalPr);
  }
  /**
   * 逆正接(atan)を計算する (内部用)
   * @param x - 値
   * @param precision - 精度
   * @param maxSteps - 最大ステップ数
   * @returns 角度(ラジアン)
   */
  static _atan(x, precision, maxSteps) {
    const scale = 10n ** precision;
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
    const maxSteps = config.trigFuncsMaxSteps;
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
    const result = construct._atan(val, totalPr, maxSteps);
    return this._makeResult(result, this._precision, totalPr);
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
    const scale = 10n ** precision;
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
    const [valA, valB, exPrec, prec] = this._bothRescale(x, true);
    const construct = this.constructor;
    const config = construct.config;
    const maxSteps = config.trigFuncsMaxSteps;
    const result = construct._atan2(valA, valB, exPrec, maxSteps);
    return this._makeResult(result, prec, exPrec);
  }
  /**
   * マチン(Machin)の公式用のatan計算 (内部用)
   * @param invX - 1/xのx
   * @param precision - 精度
   * @returns atan(1/x)
   */
  static _atanMachine(invX, precision) {
    const scale = 10n ** precision;
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
    const scale = 10n ** precision;
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
    const x = pi * z / 10n ** precision;
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
    const scale = 10n ** precision;
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
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
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
    const scale = 10n ** precision;
    return this._exp(LN2 * value / scale, precision);
  }
  /**
   * 2の冪乗(2^x)を計算する
   * @returns 2^x
   */
  exp2() {
    const construct = this.constructor;
    const config = construct.config;
    const maxSteps = config.lnMaxSteps;
    const exPr = config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
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
    const exPr = construct.config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
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
    const z = (x - scale) * scale / (x + scale);
    let zSquared = z * z / scale;
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
    return 2n * result + k * LN10;
  }
  /**
   * 自然対数(ln)を計算する
   * @returns ln(x)
   */
  ln() {
    const construct = this.constructor;
    const config = construct.config;
    const maxSteps = config.lnMaxSteps;
    const exPr = config.extraPrecision;
    const totalPr = this._precision + exPr;
    const val = this.value * 10n ** exPr;
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
    if (value === 1n * 10n ** precision) return 0n;
    const lnB = this._ln(baseValue, precision, maxSteps);
    if (lnB === 0n) throw new Error("log base cannot be 1 or 0");
    const lnX = this._ln(value, precision, maxSteps);
    const SCALE = 10n ** precision;
    return lnX * SCALE / lnB;
  }
  /**
   * 対数を計算する
   * @param base - 底
   * @returns log_base(x)
   */
  log(base) {
    const [valA, valB, exPrec, prec] = this._bothRescale(base, true);
    const construct = this.constructor;
    const maxSteps = construct.config.lnMaxSteps;
    const raw = construct._log(valA, valB, exPrec, maxSteps);
    return this._makeResult(raw, prec, exPrec);
  }
  /**
   * 2を底とする対数(log2)を計算する (内部用)
   * @param value - 値
   * @param precision - 精度
   * @param maxSteps - 最大ステップ数
   * @returns log2(value)
   */
  static _log2(value, precision, maxSteps) {
    const scale = 10n ** precision;
    const baseValue = 2n * scale;
    return this._log(value, baseValue, precision, maxSteps);
  }
  /**
   * 2を底とする対数(log2)を計算する
   * @returns log2(x)
   */
  log2() {
    const construct = this.constructor;
    const maxSteps = construct.config.lnMaxSteps;
    const exPrec = construct.config.extraPrecision;
    const totalPr = this._precision + exPrec;
    const val = this.value * 10n ** exPrec;
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
    const baseValue = 10n * 10n ** precision;
    return this._log(value, baseValue, precision, maxSteps);
  }
  /**
   * 10を底とする対数(log10)を計算する
   * @returns log10(x)
   */
  log10() {
    const construct = this.constructor;
    const maxSteps = construct.config.lnMaxSteps;
    const exPrec = construct.config.extraPrecision;
    const totalPr = this._precision + exPrec;
    const val = this.value * 10n ** exPrec;
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
    const scale = 10n ** precision;
    const onePlusX = scale + value;
    return this._log(onePlusX, scale, precision, maxSteps);
  }
  /**
   * ln(1 + x) を計算する
   * @returns ln(1 + x)
   */
  log1p() {
    const construct = this.constructor;
    const maxSteps = construct.config.lnMaxSteps;
    const exPrec = construct.config.extraPrecision;
    const totalPr = this._precision + exPrec;
    const val = this.value * 10n ** exPrec;
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
    const scale = 10n ** precision;
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
    return 2n * result;
  }
  /**
   * ln(2) を計算する (内部用)
   * @param precision - 精度
   * @param maxSteps - 最大ステップ数
   * @returns ln(2)
   */
  static _ln2(precision, maxSteps) {
    const scale = 10n ** precision;
    return this._ln(2n * scale, precision, maxSteps);
  }
  /**
   * 自然対数の底(e)を取得する (内部用)
   * @param precision - 精度
   * @returns e
   */
  static _e(precision) {
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
  static e(precision = 20n) {
    const precisionBig = BigInt(precision);
    this._checkPrecision(precisionBig);
    const exPr = this.config.extraPrecision;
    const totalPr = precisionBig + exPr;
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
  static _piLeibniz(precision = 20n, mulPrecision = 100n) {
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
  static _piNewton(precision = 20n) {
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
  static _piChudnovsky(precision = 20n) {
    const scale = 10n ** precision;
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
    const piAlgorithm = this.config.piAlgorithm;
    if (this._getCheckCache("pi", precision, piAlgorithm)) {
      return this._getCache("pi", precision);
    }
    let piRet;
    switch (piAlgorithm) {
      case 3 /* CHUDNOVSKY */:
        piRet = this._piChudnovsky(precision);
        break;
      case 2 /* NEWTON */:
        piRet = this._piNewton(precision);
        break;
      case 1 /* LEIBNIZ */:
        piRet = this._piLeibniz(precision);
        break;
      case 0 /* MATH_DEFAULT */:
      default:
        this._checkPrecision(precision);
        return new this(`${Math.PI}`, precision).value;
    }
    this._updateCache("pi", piRet, precision, piAlgorithm);
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
    const piRet = new this();
    piRet.value = this._pi(precisionBig);
    piRet._precision = precisionBig;
    return piRet;
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
    const tauRet = new this();
    tauRet.value = this._tau(precisionBig);
    tauRet._precision = precisionBig;
    return tauRet;
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
    const arr = this._normalizeArgs(args);
    if (arr.length === 0) throw new Error("No arguments provided");
    const [scaled, prec] = this._batchRescale(arr);
    let maxVal = scaled[0];
    for (let i = 1; i < scaled.length; i++) {
      if (scaled[i] > maxVal) maxVal = scaled[i];
    }
    return this._makeResult(maxVal, prec);
  }
  /**
   * 引数の中で最小値を返す
   * @param args - 数値のリスト
   * @returns 最小値
   * @throws {Error} 引数が空の場合
   */
  static min(...args) {
    const arr = this._normalizeArgs(args);
    if (arr.length === 0) throw new Error("No arguments provided");
    const [scaled, prec] = this._batchRescale(arr);
    let minVal = scaled[0];
    for (let i = 1; i < scaled.length; i++) {
      if (scaled[i] < minVal) minVal = scaled[i];
    }
    return this._makeResult(minVal, prec);
  }
  /**
   * 引数の合計を返す
   * @param args - 数値のリスト
   * @returns 合計
   */
  static sum(...args) {
    const arr = this._normalizeArgs(args);
    if (arr.length === 0) return new this();
    const [scaled, prec] = this._batchRescale(arr);
    const totalVal = scaled.reduce((acc, cur) => acc + cur, 0n);
    return this._makeResult(totalVal, prec);
  }
  /**
   * 引数の積を返す
   * @param args - 数値のリスト
   * @returns 積
   */
  static product(...args) {
    const arr = this._normalizeArgs(args);
    if (arr.length === 0) return new this("1");
    const [scaled, exPrec, prec] = this._batchRescale(arr, true);
    let prod = new this(1, exPrec);
    for (const item of scaled) {
      const a = new this();
      a.value = item;
      a._precision = exPrec;
      prod = prod.mul(a);
    }
    return this._makeResult(prod.value, prec, exPrec);
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
    const arr = this._normalizeArgs(args);
    if (arr.length === 0) throw new Error("No arguments provided");
    const [scaled, prec] = this._batchRescale(arr);
    const sorted = scaled.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      return this._makeResult(sorted[mid], prec);
    } else {
      const a = new this();
      a.value = sorted[mid - 1];
      a._precision = prec;
      const b = new this();
      b.value = sorted[mid];
      b._precision = prec;
      return a.add(b).div(2);
    }
  }
  /**
   * 引数の分散を返す
   * @param args - 数値のリスト
   * @returns 分散
   * @throws {Error} 引数が空の場合
   */
  static variance(...args) {
    const arr = this._normalizeArgs(args);
    if (arr.length === 0) throw new Error("No arguments provided");
    if (arr.length === 1) return new this("0");
    const [scaled, exPrec, prec] = this._batchRescale(arr, true);
    const n = new this(arr.length, exPrec);
    const total = this.sum(arr);
    const meanVal = total.div(n).changePrecision(exPrec);
    let sumSquares = 0n;
    for (const item of scaled) {
      const a = new this();
      a.value = item;
      a._precision = exPrec;
      const diff = a.sub(meanVal);
      sumSquares += diff.mul(diff).value;
    }
    const sumS = new this();
    sumS.value = sumSquares;
    sumS._precision = exPrec;
    return this._makeResult(sumS.div(n).value, prec, exPrec);
  }
  /**
   * 引数の標準偏差を返す
   * @param args - 数値のリスト
   * @returns 標準偏差
   */
  static stddev(...args) {
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
  static _randomBigInt(precision) {
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
  static random(precision = 20n) {
    const precisionBig = BigInt(precision);
    this._checkPrecision(precisionBig);
    let randBigInt = this._randomBigInt(precisionBig);
    return this._makeResult(randBigInt, precisionBig);
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
    return delta * sum / denominator;
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
    const scale = 10n ** precision;
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
  static _bernoulliCache = {};
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
   * ガンマ関数をStirlingの近似で計算する (内部用)
   * @param z - 値
   * @param precision - 精度
   * @returns ガンマ関数
   * @throws {Error} 負の整数の場合
   */
  static _gammaLanczos(z, precision) {
    const scale = 10n ** precision;
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
    const exPrec = construct.config.extraPrecision;
    const totalPr = this._precision + exPrec;
    const val = this.value * 10n ** exPrec;
    const raw = construct._gammaLanczos(val, totalPr);
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
    const scale = 10n ** precision;
    return this._gammaLanczos(n + scale, precision);
  }
  /**
   * 階乗を計算する
   * @returns 階乗
   */
  factorial() {
    const construct = this.constructor;
    const exPrec = construct.config.extraPrecision;
    const totalPr = this._precision + exPrec;
    const val = this.value * 10n ** exPrec;
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
   * キャッシュが存在するか確認する (内部用)
   * @param key - キャッシュキー
   * @param precision - 必要精度
   * @param priority - アルゴリズム優先度
   * @returns 存在する場合はtrue
   */
  static _getCheckCache(key, precision, priority = 0) {
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
  static _getCache(key, precision) {
    const cachedData = this._cached[key];
    if (cachedData) {
      return this._round(cachedData.value, cachedData.precision, precision);
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
  static _updateCache(key, value, precision, priority = 0) {
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
   * 定数 1 を取得する
   * @param precision - 精度
   * @returns 1
   */
  static one(precision = 20n) {
    return new this(1n, precision);
  }
};
function bigFloat(value, precision) {
  return new BigFloat(value, precision);
}
export {
  BigFloat,
  BigFloatConfig,
  PiAlgorithm,
  RoundingMode,
  bigFloat
};
//# sourceMappingURL=BigFloat.js.map
