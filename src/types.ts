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
 * BigFloat configuration options
 */
export interface BigFloatOptions {
	allowPrecisionMismatch?: boolean;
	mutateResult?: boolean;
	roundingMode?: RoundingMode;
	extraPrecision?: bigint;
	trigFuncsMaxSteps?: bigint;
	lnMaxSteps?: bigint;
}

/**
 * BigFloatに変換可能な値
 */
export type BigFloatValue = BigFloat | number | string | bigint;

/**
 * BigFloatStreamで扱う値
 */
export type BigFloatStreamValue = BigFloatValue;
