/**
 * BigFloat ライブラリ共通の基底エラークラス
 */
export class BigFloatError extends Error {
	/**
	 * BigFloatError コンストラクタ
	 * @param message - エラーメッセージ
	 * @param options - エラーオプション
	 * @returns BigFloatError インスタンス
	 */
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = new.target.name;
		Object.setPrototypeOf(this, new.target.prototype);
		if (typeof Error.captureStackTrace === "function") {
			Error.captureStackTrace(this, new.target);
		}
	}
}

/**
 * 特殊値が無効な設定で特殊値を扱おうとした場合のエラー
 */
export class SpecialValuesDisabledError extends BigFloatError {}

/**
 * 精度不一致が許容されていない場合のエラー
 */
export class PrecisionMismatchError extends BigFloatError {}

/**
 * BigFloat 上でゼロ除算が発生した場合のエラー
 */
export class DivisionByZeroError extends BigFloatError {}

/**
 * 数値計算中に安定した結果を導けない場合のエラー
 */
export class NumericalComputationError extends BigFloatError {}

/**
 * 必須キャッシュが初期化されていない場合のエラー
 */
export class CacheNotInitializedError extends BigFloatError {}

/**
 * 行列やベクトルの次元が不一致の場合のエラー
 */
export class DimensionMismatchError extends BigFloatError {}

/**
 * 行列が特異（逆行列が存在しない）場合のエラー
 */
export class SingularMatrixError extends BigFloatError {}
