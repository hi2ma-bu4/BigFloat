import type { BigFloat } from "./bigFloat";

/**
 * 丸めモード
 */
export enum RoundingMode {
	/** 0に近い方向に切り捨て */
	TRUNCATE = 0,
	/** 絶対値が小さい方向に切り捨て（TRUNCATEと同じ） */
	DOWN = 0,
	/** 絶対値が大きい方向に切り上げ */
	UP = 1,
	/** 正の無限大方向に切り上げ */
	CEIL = 2,
	/** 負の無限大方向に切り捨て */
	FLOOR = 3,
	/** 四捨五入 */
	HALF_UP = 4,
	/** 五捨六入（5未満切り捨て） */
	HALF_DOWN = 5,
}

/**
 * BigFloat の特別な値の状態
 */
export enum SpecialValueState {
	/** 有限の値 */
	FINITE = 0,
	/** 正の無限大 */
	POSITIVE_INFINITY = 1,
	/** 負の無限大 */
	NEGATIVE_INFINITY = 2,
	/** 非数 (NaN) */
	NAN = 3,
}

/**
 * BigFloat 構成オプション
 */
export interface BigFloatOptions {
	/** 精度の不一致を許容するかどうか */
	allowPrecisionMismatch?: boolean;
	/** 破壊的な計算(自身の上書き)をするかどうか */
	mutateResult?: boolean;
	/** Infinity/NaN の特殊値を許容するかどうか */
	allowSpecialValues?: boolean;
	/** 丸めモード */
	roundingMode?: RoundingMode;
	/** 計算時に追加する精度 */
	extraPrecision?: bigint;
	/** 三角関数の最大ステップ数 */
	trigFuncsMaxSteps?: bigint;
	/** 対数計算の最大ステップ数 */
	lnMaxSteps?: bigint;
}

/**
 * 精度を表す値
 */
export type PrecisionValue = number | bigint;

/**
 * BigFloatに変換可能な値
 */
export type BigFloatValue = BigFloat | number | string | bigint;

/**
 * BigFloatStreamで扱う値
 */
export type BigFloatStreamValue = BigFloatValue;
