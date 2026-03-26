/**
 * 丸めモード
 */
export declare enum RoundingMode {
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
	HALF_DOWN = 5
}
/**
 * BigFloat の特別な値の状態
 */
export declare enum SpecialValueState {
	/** 有限の値 */
	FINITE = 0,
	/** 正の無限大 */
	POSITIVE_INFINITY = 1,
	/** 負の無限大 */
	NEGATIVE_INFINITY = 2,
	/** 非数 (NaN) */
	NAN = 3
}
/**
 * BigFloat 構成オプション
 */
export interface BigFloatOptions {
	/**
	 * 精度の不一致を許容するかどうか
	 */
	allowPrecisionMismatch?: boolean;
	/**
	 * BigFloatComplex との相互運用を許容するかどうか
	 */
	allowComplexNumbers?: boolean;
	/**
	 * 破壊的な計算(自身の上書き)をするかどうか
	 */
	mutateResult?: boolean;
	/**
	 * Infinity/NaN の特殊値を許容するかどうか
	 */
	allowSpecialValues?: boolean;
	/**
	 * 丸めモード
	 */
	roundingMode?: RoundingMode;
	/**
	 * 計算時に追加する精度
	 */
	extraPrecision?: bigint;
	/**
	 * 三角関数の最大ステップ数
	 */
	trigFuncsMaxSteps?: bigint;
	/**
	 * 対数計算の最大ステップ数
	 */
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
 * BigFloat の可変引数または単一配列引数
 */
export type BigFloatAggregateArgs = BigFloatValue[] | [
	readonly BigFloatValue[]
];
/**
 * BigFloatStreamで扱う値
 */
export type BigFloatStreamValue = BigFloatValue;
export type BigFloatIterator = Iterator<BigFloat, void, undefined>;
export type BigFloatStreamFactory = () => BigFloatIterator;
export type BigFloatStreamStageSignal = BigFloat | typeof BIGFLOAT_STREAM_SKIP;
export type BigFloatStreamStageContext = {
	pushIterator: (iterator: Iterator<BigFloat, void, undefined>, stageIndex: number) => void;
	stop: () => void;
};
export type BigFloatStreamStageDefinition = {
	createState: (data: unknown) => unknown;
	process: (value: BigFloat, state: unknown, data: unknown, context: BigFloatStreamStageContext, nextStageIndex: number) => BigFloatStreamStageSignal;
};
export type BigFloatStreamStage = {
	definition: BigFloatStreamStageDefinition;
	data: unknown;
};
export type BigFloatStreamRandomOptions = {
	min?: BigFloatStreamValue;
	max?: BigFloatStreamValue;
	precision?: PrecisionValue;
};
declare const BIGFLOAT_STREAM_SKIP: unique symbol;
/**
 * BigFloat 用の遅延評価ストリーム (Lazy List) クラス
 */
export declare class BigFloatStream implements Iterable<BigFloat> {
	/**
	 * mapステージ定義
	 */
	private static readonly _mapStageDefinition;
	/**
	 * filterステージ定義
	 */
	private static readonly _filterStageDefinition;
	/**
	 * peekステージ定義
	 */
	private static readonly _peekStageDefinition;
	/**
	 * flatMapステージ定義
	 */
	private static readonly _flatMapStageDefinition;
	/**
	 * distinctステージ定義
	 */
	private static readonly _distinctStageDefinition;
	/**
	 * limitステージ定義
	 */
	private static readonly _limitStageDefinition;
	/**
	 * skipステージ定義
	 */
	private static readonly _skipStageDefinition;
	/**
	 * 内部イテレータファクトリ
	 */
	private _sourceFactory;
	/**
	 * パイプラインにおける直前のストリーム
	 */
	private _previousStream;
	/**
	 * このストリームが表すステージの定義
	 */
	private _stageDefinition;
	/**
	 * ステージに渡される固定データ (コールバック関数など)
	 */
	private _stageData;
	/**
	 * BigFloatStream コンストラクタ
	 * @param source - BigFloat の反復可能オブジェクト、またはイテレータを生成する関数
	 */
	constructor(source: Iterable<BigFloat> | BigFloatStreamFactory);
	/**
	 * 内部状態からストリームを生成する (内部用)
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns 生成されたストリーム
	 */
	protected static _fromState(sourceFactory: BigFloatStreamFactory, previousStream: BigFloatStream | null, stageDefinition: BigFloatStreamStageDefinition | null, stageData: unknown): BigFloatStream;
	/**
	 * ストリーム値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された BigFloat
	 */
	protected static _toBigFloat(value: BigFloatStreamValue, precision?: bigint): BigFloat;
	/**
	 * 反復可能オブジェクトを BigFloat のイテレータへ変換する (内部用)
	 * @param iterable - 変換対象
	 * @param precision - 精度
	 * @returns BigFloat のイテレータ
	 */
	protected static _toIterator(iterable: Iterable<BigFloatStreamValue>, precision?: bigint): IterableIterator<BigFloat, void, undefined>;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatStreamValue[], precision?: PrecisionValue): bigint;
	/**
	 * 要素数を非負の整数に正規化する (内部用)
	 * @param count - 要素数
	 * @returns 正規化された要素数
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 */
	protected static _normalizeCount(count: number): number;
	/**
	 * 空のストリームを生成する
	 * @returns 空の BigFloatStream
	 */
	static empty(): BigFloatStream;
	/**
	 * 反復可能オブジェクトからストリームを作成する
	 * @param iterable - 要素のソース
	 * @param precision - 変換時の精度
	 * @returns BigFloatStream インスタンス
	 */
	static from(iterable: Iterable<BigFloatStreamValue>, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 引数のリストからストリームを作成する
	 * @param values - 要素のリスト
	 * @returns BigFloatStream インスタンス
	 */
	static of(...values: BigFloatStreamValue[]): BigFloatStream;
	/**
	 * 等差数列のストリームを生成する
	 * @param start - 初項
	 * @param step - 公差
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static arithmetic(start: BigFloatStreamValue, step: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 等比数列のストリームを生成する
	 * @param start - 初項
	 * @param ratio - 公比
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static geometric(start: BigFloatStreamValue, ratio: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 指定した範囲を等分割する数値ストリームを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static linspace(start: BigFloatStreamValue, end: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 10 を底とする対数スケールで等間隔な数値ストリームを生成する
	 * @param start - 開始指数
	 * @param end - 終了指数
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static logspace(start: BigFloatStreamValue, end: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 調和級数 (1/1, 1/2, 1/3, ...) のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static harmonic(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 乱数ストリームを生成する
	 * @param count - 要素数
	 * @param options - 乱数範囲と精度のオプション
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 最大値が最小値より小さい場合
	 */
	static random(count: number, options?: BigFloatStreamRandomOptions): BigFloatStream;
	/**
	 * 指定された値を繰り返すストリームを生成する
	 * @param value - 繰り返す値
	 * @param count - 回数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static repeat(value: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * フィボナッチ数列のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static fibonacci(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 階乗数列 (1!, 2!, 3!, ...) のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 */
	static factorial(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 数値の範囲を指定してストリームを生成する
	 * @param start - 開始値 (end 省略時は 0 からこの値まで)
	 * @param end - 終了値 (この値は含まない)
	 * @param step - 増分
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} step が 0 の場合
	 */
	static range(start: BigFloatStreamValue, end?: BigFloatStreamValue, step?: BigFloatStreamValue, precision?: PrecisionValue): BigFloatStream;
	/**
	 * ストリームを複製する
	 * @returns 複製された BigFloatStream
	 */
	clone(): BigFloatStream;
	/**
	 * 現在の状態をフォークして新しいストリームを生成する (内部用)
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns 新しいストリーム
	 */
	protected _fork(sourceFactory?: BigFloatStreamFactory, previousStream?: BigFloatStream | null, stageDefinition?: BigFloatStreamStageDefinition | null, stageData?: unknown): this;
	/**
	 * パイプラインに新しいステージを追加する (内部用)
	 * @param stage - 追加するステージ
	 * @returns 新しいストリーム
	 */
	protected _use(stage: BigFloatStreamStage): this;
	/**
	 * 現在のストリームからルートまで遡り、全パイプラインステージを収集する (内部用)
	 * @returns ステージの配列
	 */
	protected _collectPipelineStages(): BigFloatStreamStage[];
	/**
	 * 各要素を変換関数で写像する
	 * @param fn - 変換関数
	 * @returns 写像後のストリーム
	 */
	map(fn: (item: BigFloat) => BigFloat): this;
	/**
	 * 条件を満たす要素のみを通過させる
	 * @param fn - フィルタリング関数
	 * @returns フィルタリング後のストリーム
	 */
	filter(fn: (item: BigFloat) => boolean): this;
	/**
	 * 各要素を複数の要素に展開して平坦化する
	 * @param fn - 要素を反復可能オブジェクトへ変換する関数
	 * @returns 平坦化後のストリーム
	 */
	flatMap(fn: (item: BigFloat) => Iterable<BigFloatStreamValue>): this;
	/**
	 * 要素の重複を除去する
	 * @param keyFn - 一致判定に使うキーを生成する関数 (デフォルトは toString)
	 * @returns 重複除去後のストリーム
	 */
	distinct(keyFn?: (item: BigFloat) => unknown): this;
	/**
	 * 要素をソートする (注意: この操作は全要素をメモリ上に展開します)
	 * @param compareFn - 比較関数
	 * @returns ソート後のストリーム
	 */
	sorted(compareFn?: (a: BigFloat, b: BigFloat) => number): this;
	/**
	 * 各要素に対して副作用のある処理を実行する (デバッグやロギング用)
	 * @param fn - 要素を受け取る関数
	 * @returns 自身
	 */
	peek(fn: (item: BigFloat) => void): this;
	/**
	 * peek の別名。各要素に対して副作用のある処理を実行する
	 * @param fn - 要素を受け取る関数
	 * @returns 自身
	 */
	tap(fn: (item: BigFloat) => void): this;
	/**
	 * 要素数を最大 n 個に制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	limit(n: number): this;
	/**
	 * limit の別名。要素数を最大 n 個に制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	take(n: number): this;
	/**
	 * 先頭の n 個の要素を読み飛ばす
	 * @param n - スキップする数
	 * @returns スキップ後のストリーム
	 */
	skip(n: number): this;
	/**
	 * skip の別名。先頭の n 個の要素を読み飛ばす
	 * @param n - スキップする数
	 * @returns スキップ後のストリーム
	 */
	drop(n: number): this;
	/**
	 * 末尾に別の反復可能オブジェクトの内容を連結する
	 * @param iterables - 連結する対象
	 * @returns 連結後のストリーム
	 */
	concat(...iterables: Iterable<BigFloatStreamValue>[]): this;
	/**
	 * ストリームを反復するためのイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/**
	 * ストリームの各要素に対して関数を実行する (終端操作)
	 * @param fn - 実行する関数
	 */
	forEach(fn: (item: BigFloat) => void): void;
	/**
	 * ストリームの全要素を収集して配列として返す (終端操作)
	 * @returns 要素の配列
	 */
	toArray(): BigFloat[];
	/**
	 * toArray の別名。ストリームの全要素を収集して配列として返す (終端操作)
	 * @returns 要素の配列
	 */
	collect(): BigFloat[];
	/**
	 * 全要素を累積して単一の値を計算する (終端操作)
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積結果
	 */
	reduce<U>(fn: (acc: U, item: BigFloat) => U, initial: U): U;
	/**
	 * ストリームに含まれる要素数を数える (終端操作)
	 * @returns 要素数
	 */
	count(): number;
	/**
	 * ストリームに要素が含まれていないかどうかを判定する (終端操作)
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	some(fn: (item: BigFloat) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすかどうかを判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	every(fn: (item: BigFloat) => boolean): boolean;
	/**
	 * 条件を満たす最初の要素を返す (終端操作)
	 * @param fn - 判定関数
	 * @returns 最初に見つかった要素、見つからない場合は undefined
	 */
	find(fn: (item: BigFloat) => boolean): BigFloat | undefined;
	/**
	 * ストリームの最初の要素を取得する (終端操作)
	 * @returns 最初の要素、ストリームが空なら undefined
	 */
	findFirst(): BigFloat | undefined;
	/**
	 * findFirst の別名。ストリームの最初の要素を取得する
	 * @returns 最初の要素
	 */
	first(): BigFloat | undefined;
	/**
	 * 指定されたインデックスの要素を取得する (終端操作)
	 * @param index - 0 から始まるインデックス
	 * @returns 指定位置の要素、インデックスが範囲外なら undefined
	 */
	at(index: number): BigFloat | undefined;
	/**
	 * すべての要素の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいストリーム
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * 各要素と別の値との相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差を各要素に持つストリーム
	 */
	relativeDiff(other: BigFloatValue): this;
	/**
	 * 各要素と別の値との絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差を各要素に持つストリーム
	 */
	absoluteDiff(other: BigFloatValue): this;
	/**
	 * 各要素と別の値との百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分を各要素に持つストリーム (%)
	 */
	percentDiff(other: BigFloatValue): this;
	/**
	 * 各要素に別の値を加算する
	 * @param other - 加算する数値
	 * @returns 加算後のストリーム
	 */
	add(other: BigFloatValue): this;
	/**
	 * 各要素から別の値を減算する
	 * @param other - 減算する数値
	 * @returns 減算後のストリーム
	 */
	sub(other: BigFloatValue): this;
	/**
	 * 各要素に別の値を乗算する
	 * @param other - 乗算する数値
	 * @returns 乗算後のストリーム
	 */
	mul(other: BigFloatValue): this;
	/**
	 * 各要素を別の値で除算する
	 * @param other - 除数
	 * @returns 除算後のストリーム
	 */
	div(other: BigFloatValue): this;
	/**
	 * 各要素に対して剰余演算を行う
	 * @param other - 法
	 * @returns 剰余後のストリーム
	 */
	mod(other: BigFloatValue): this;
	/**
	 * 各要素の符号を反転させる
	 * @returns 符号反転後のストリーム
	 */
	neg(): this;
	/**
	 * 各要素を絶対値にする
	 * @returns 絶対値適用後のストリーム
	 */
	abs(): this;
	/**
	 * 各要素の符号 (1, 0, -1) を取得する
	 * @returns 符号値を持つストリーム
	 */
	sign(): this;
	/**
	 * 各要素の逆数を取得する
	 * @returns 逆数を持つストリーム
	 */
	reciprocal(): this;
	/**
	 * 各要素を指定した指数で冪乗する
	 * @param exponent - 指数
	 * @returns 冪乗後のストリーム
	 */
	pow(exponent: BigFloatValue): this;
	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根適用後のストリーム
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根適用後のストリーム
	 */
	cbrt(): this;
	/**
	 * 各要素の n 乗根を計算する
	 * @param n - 指数
	 * @returns n 乗根適用後のストリーム
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理する
	 * @returns 床関数適用後のストリーム
	 */
	floor(): this;
	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理する
	 * @returns 天井関数適用後のストリーム
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後のストリーム
	 */
	round(): this;
	/**
	 * 各要素を 0 方向に切り捨てる
	 * @returns 切り捨て後のストリーム
	 */
	trunc(): this;
	/**
	 * 各要素を Float32 精度に丸める
	 * @returns 丸め後のストリーム
	 */
	fround(): this;
	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数える
	 * @returns 結果のストリーム
	 */
	clz32(): this;
	/**
	 * 各要素の正弦 (sin) を計算する
	 * @returns sin 適用後のストリーム
	 */
	sin(): this;
	/**
	 * 各要素の余弦 (cos) を計算する
	 * @returns cos 適用後のストリーム
	 */
	cos(): this;
	/**
	 * 各要素の正接 (tan) を計算する
	 * @returns tan 適用後のストリーム
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦 (asin) を計算する
	 * @returns asin 適用後のストリーム
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦 (acos) を計算する
	 * @returns acos 適用後のストリーム
	 */
	acos(): this;
	/**
	 * 各要素の逆正接 (atan) を計算する
	 * @returns atan 適用後のストリーム
	 */
	atan(): this;
	/**
	 * 各要素に対して atan2 を計算する
	 * @param x - x 座標
	 * @returns atan2 適用後のストリーム
	 */
	atan2(x: BigFloatValue): this;
	/**
	 * 各要素の双曲線正弦 (sinh) を計算する
	 * @returns sinh 適用後のストリーム
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦 (cosh) を計算する
	 * @returns cosh 適用後のストリーム
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接 (tanh) を計算する
	 * @returns tanh 適用後のストリーム
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算する
	 * @returns asinh 適用後のストリーム
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算する
	 * @returns acosh 適用後のストリーム
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接 (atanh) を計算する
	 * @returns atanh 適用後のストリーム
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数 (exp) を計算する
	 * @returns exp 適用後のストリーム
	 */
	exp(): this;
	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算する
	 * @returns exp2 適用後のストリーム
	 */
	exp2(): this;
	/**
	 * 各要素に対して exp(x) - 1 を計算する
	 * @returns expm1 適用後のストリーム
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数 (ln) を計算する
	 * @returns ln 適用後のストリーム
	 */
	ln(): this;
	/**
	 * 各要素の任意の底による対数を計算する
	 * @param base - 底
	 * @returns 対数計算後のストリーム
	 */
	log(base: BigFloatValue): this;
	/**
	 * 各要素の底を 2 とする対数を計算する
	 * @returns log2 適用後のストリーム
	 */
	log2(): this;
	/**
	 * 各要素の常用対数 (log10) を計算する
	 * @returns log10 適用後のストリーム
	 */
	log10(): this;
	/**
	 * 各要素に対して ln(1 + x) を計算する
	 * @returns log1p 適用後のストリーム
	 */
	log1p(): this;
	/**
	 * 各要素に対してガンマ関数を計算する
	 * @returns ガンマ関数適用後のストリーム
	 */
	gamma(): this;
	/**
	 * 各要素に対してリーマンゼータ関数を計算する
	 * @returns ゼータ関数適用後のストリーム
	 */
	zeta(): this;
	/**
	 * 各要素に対して階乗を計算する
	 * @returns 階乗適用後のストリーム
	 */
	factorial(): this;
	/**
	 * ストリームの要素の中から最大値を返す (終端操作)
	 * @returns 最大値
	 * @throws {TypeError} ストリームが空の場合
	 */
	max(): BigFloat;
	/**
	 * ストリームの要素の中から最小値を返す (終端操作)
	 * @returns 最小値
	 * @throws {TypeError} ストリームが空の場合
	 */
	min(): BigFloat;
	/**
	 * ストリームの全要素の合計を計算する (終端操作)
	 * @returns 合計
	 */
	sum(): BigFloat;
	/**
	 * ストリームの全要素の積を計算する (終端操作)
	 * @returns 総乗
	 */
	product(): BigFloat;
	/**
	 * ストリームの全要素の平均値を計算する (終端操作)
	 * @returns 平均値
	 */
	average(): BigFloat;
	/**
	 * ストリームの要素の中央値を計算する (終端操作)
	 * @returns 中央値
	 */
	median(): BigFloat;
	/**
	 * ストリームの要素の分散を計算する (終端操作)
	 * @returns 分散
	 */
	variance(): BigFloat;
	/**
	 * ストリームの要素の標準偏差を計算する (終端操作)
	 * @returns 標準偏差
	 */
	stddev(): BigFloat;
}
export type BigFloatVectorSource = Iterable<BigFloatValue>;
export type BigFloatVectorOperand = BigFloatVector | BigFloatVectorSource;
export type BigFloatVectorRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};
/**
 * BigFloat を固定長ベクトルとして扱うクラス
 */
export declare class BigFloatVector implements Iterable<BigFloat> {
	/**
	 * 内部要素 (BigFloat の配列)
	 */
	protected _values: BigFloat[];
	/**
	 * BigFloatVector コンストラクタ
	 * @param values - 要素のソース (反復可能オブジェクト)
	 * @param precision - 変換時の精度
	 */
	constructor(values?: BigFloatVectorSource, precision?: PrecisionValue);
	/**
	 * 内部配列からベクトルを生成する (内部用)
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatVector
	 */
	protected static _fromBigFloatArray(values: BigFloat[]): BigFloatVector;
	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 明示精度
	 * @returns 変換された BigFloat
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値列
	 * @param precision - 明示精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatValue[], precision?: PrecisionValue): bigint;
	/**
	 * ベクトルの長さを非負の整数に正規化する (内部用)
	 * @param length - ベクトル長
	 * @returns 正規化されたベクトル長
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	protected static _normalizeLength(length: number): number;
	/**
	 * 次元一致を検証する
	 * @param left - 左辺
	 * @param right - 右辺
	 * @throws {RangeError} 次元が一致しない場合
	 */
	protected static _assertSameLength(left: BigFloatVector, right: BigFloatVector): void;
	/**
	 * 任意入力を BigFloatVector へ変換する (内部用)
	 * @param value - ベクトルまたは要素列
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatVector
	 */
	protected static _coerceVector(value: BigFloatVectorOperand, referenceValues?: BigFloatValue[]): BigFloatVector;
	/**
	 * 各要素に対して変換関数を適用した新しいベクトルを返す (内部用)
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 */
	protected _mapValues(fn: (value: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * オペランドとの二項演算を各要素に対して行う (内部用)
	 * @param other - ベクトルまたはスカラ値
	 * @param fn - 二項演算関数
	 * @returns 演算後の新しいベクトル
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 */
	protected _mapWithOperand(other: BigFloatVectorOperand | BigFloatValue, fn: (left: BigFloat, right: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 空のベクトル (次元 0) を生成する
	 * @returns 空のベクトル
	 */
	static empty(): BigFloatVector;
	/**
	 * 要素の反復可能オブジェクトから BigFloatVector を生成する
	 * @param values - 要素列
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 */
	static from(values: BigFloatVectorSource, precision?: PrecisionValue): BigFloatVector;
	/**
	 * BigFloatStream からベクトルを生成する
	 * @param stream - ソースストリーム
	 * @returns 生成された BigFloatVector
	 */
	static fromStream(stream: BigFloatStream): BigFloatVector;
	/**
	 * 引数リストからベクトルを生成する
	 * @param values - 要素のリスト
	 * @returns BigFloatVector インスタンス
	 */
	static of(...values: BigFloatValue[]): BigFloatVector;
	/**
	 * 指定された値で埋められたベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 */
	static fill(length: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 零ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 */
	static zeros(length: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * すべての要素が 1 のベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 */
	static ones(length: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 標準基底ベクトルを取得する (指定インデックスのみ 1 で他は 0)
	 * @param length - ベクトルの長さ
	 * @param index - 1 を配置する位置 (0 から length-1)
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {RangeError} インデックスが範囲外の場合
	 */
	static basis(length: number, index: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 指定した範囲を等分割する数値ベクトルを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns 生成された BigFloatVector
	 */
	static linspace(start: BigFloatValue, end: BigFloatValue, count: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 乱数ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param options - 乱数範囲と精度のオプション
	 * @returns 生成された BigFloatVector
	 * @throws {RangeError} 最大値が最小値より小さい場合
	 */
	static random(length: number, options?: BigFloatVectorRandomOptions): BigFloatVector;
	/**
	 * ベクトルの要素数を取得する
	 */
	get length(): number;
	/**
	 * ベクトルの次元数を取得する
	 * @returns 次元数 (length と同じ)
	 */
	dimension(): number;
	/**
	 * ベクトルが空 (次元が 0) かどうかを判定する
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 指定したインデックスの要素を取得する (複製)
	 * @param index - インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 */
	at(index: number): BigFloat | undefined;
	/**
	 * ベクトルを複製する
	 * @returns 複製された BigFloatVector
	 */
	clone(): BigFloatVector;
	/**
	 * 要素の配列へ変換する
	 * @returns BigFloat の配列
	 */
	toArray(): BigFloat[];
	/**
	 * 要素を流すストリームへ変換する
	 * @returns BigFloatStream インスタンス
	 */
	toStream(): BigFloatStream;
	/**
	 * 要素を順に反復するイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/**
	 * 各要素に対して関数を実行する
	 * @param fn - 実行する関数
	 */
	forEach(fn: (value: BigFloat, index: number) => void): void;
	/**
	 * 各要素を変換した新しいベクトルを取得する
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 */
	map(fn: (value: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 別のベクトルと要素ごとに対になる変換を行い、新しいベクトルを取得する
	 * @param other - 対象ベクトル
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 */
	zipMap(other: BigFloatVectorOperand, fn: (left: BigFloat, right: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 全要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 */
	reduce<U>(fn: (acc: U, value: BigFloat, index: number) => U, initial: U): U;
	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	some(fn: (value: BigFloat, index: number) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすかどうかを判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	every(fn: (value: BigFloat, index: number) => boolean): boolean;
	/**
	 * 別のベクトルまたは要素列を末尾に連結した新しいベクトルを取得する
	 * @param others - 連結する対象
	 * @returns 連結後の新しいベクトル
	 */
	concat(...others: BigFloatVectorOperand[]): this;
	/**
	 * ベクトルの一部を抽出した新しいベクトルを返す
	 * @param start - 開始位置
	 * @param end - 終了位置
	 * @returns 抽出された新しいベクトル
	 */
	slice(start?: number, end?: number): this;
	/**
	 * 要素の並びを反転させた新しいベクトルを取得する
	 * @returns 反転した新しいベクトル
	 */
	reverse(): this;
	/**
	 * すべての要素の精度を変更した新しいベクトルを取得する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいベクトル
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * 別のベクトルと内容が等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 */
	equals(other: BigFloatVectorOperand): boolean;
	/**
	 * 各要素に別のベクトルまたはスカラ値を加算した新しいベクトルを取得する
	 * @param other - 加算するベクトルまたは数値
	 * @returns 加算後の新しいベクトル
	 */
	add(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素から別のベクトルまたはスカラ値を減算した新しいベクトルを取得する
	 * @param other - 減算するベクトルまたは数値
	 * @returns 減算後の新しいベクトル
	 */
	sub(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素にスカラ値を乗算した新しいベクトルを取得する
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しいベクトル
	 */
	mul(scalar: BigFloatValue): this;
	/**
	 * 各要素をスカラ値で除算した新しいベクトルを取得する
	 * @param scalar - 除数
	 * @returns 除算後の新しいベクトル
	 */
	div(scalar: BigFloatValue): this;
	/**
	 * 各要素に対して剰余演算を行った新しいベクトルを取得する
	 * @param other - 法
	 * @returns 演算後の新しいベクトル
	 */
	mod(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 別のベクトルとのアダマール積 (要素ごとの積) を計算する
	 * @param other - 対象ベクトル
	 * @returns Hadamard積の結果のベクトル
	 */
	hadamard(other: BigFloatVectorOperand): this;
	/**
	 * 各要素の符号を反転させた新しいベクトルを取得する
	 * @returns 符号反転後の新しいベクトル
	 */
	neg(): this;
	/**
	 * 各要素を絶対値にした新しいベクトルを取得する
	 * @returns 絶対値適用後の新しいベクトル
	 */
	abs(): this;
	/**
	 * 各要素の符号 (1, 0, -1) を持つベクトルを取得する
	 * @returns 符号ベクトル
	 */
	sign(): this;
	/**
	 * 各要素の逆数を持つベクトルを取得する
	 * @returns 逆数ベクトル
	 */
	reciprocal(): this;
	/**
	 * 各要素を指定した指数で冪乗した新しいベクトルを取得する
	 * @param exponent - 指数
	 * @returns 冪乗後の新しいベクトル
	 */
	pow(exponent: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の平方根を計算した新しいベクトルを取得する
	 * @returns 平方根適用後の新しいベクトル
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算した新しいベクトルを取得する
	 * @returns 立方根適用後の新しいベクトル
	 */
	cbrt(): this;
	/**
	 * 各要素の n 乗根を計算した新しいベクトルを取得する
	 * @param n - 指数
	 * @returns n 乗根適用後の新しいベクトル
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理した新しいベクトルを取得する
	 * @returns 床関数適用後の新しいベクトル
	 */
	floor(): this;
	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理した新しいベクトルを取得する
	 * @returns 天井関数適用後の新しいベクトル
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入した新しいベクトルを取得する
	 * @returns 四捨五入後の新しいベクトル
	 */
	round(): this;
	/**
	 * 各要素を 0 方向に切り捨てた新しいベクトルを取得する
	 * @returns 切り捨て後の新しいベクトル
	 */
	trunc(): this;
	/**
	 * 各要素を Float32 精度に丸めた新しいベクトルを取得する
	 * @returns 丸め後の新しいベクトル
	 */
	fround(): this;
	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えたベクトルを取得する
	 * @returns 結果のベクトル
	 */
	clz32(): this;
	/**
	 * 別のベクトルまたは数値との相対差を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 相対差のベクトル
	 */
	relativeDiff(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 別のベクトルまたは数値との絶対差を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 絶対差のベクトル
	 */
	absoluteDiff(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 別のベクトルまたは数値との百分率差分を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 百分率差分のベクトル (%)
	 */
	percentDiff(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の正弦 (sin) を計算したベクトルを取得する
	 * @returns sin 適用後のベクトル
	 */
	sin(): this;
	/**
	 * 各要素の余弦 (cos) を計算したベクトルを取得する
	 * @returns cos 適用後のベクトル
	 */
	cos(): this;
	/**
	 * 各要素の正接 (tan) を計算したベクトルを取得する
	 * @returns tan 適用後のベクトル
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦 (asin) を計算したベクトルを取得する
	 * @returns asin 適用後のベクトル
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦 (acos) を計算したベクトルを取得する
	 * @returns acos 適用後のベクトル
	 */
	acos(): this;
	/**
	 * 各要素の逆正接 (atan) を計算したベクトルを取得する
	 * @returns atan 適用後のベクトル
	 */
	atan(): this;
	/**
	 * 各要素に対して atan2 を計算したベクトルを取得する
	 * @param x - x 座標のベクトルまたは数値
	 * @returns atan2 適用後のベクトル
	 */
	atan2(x: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の双曲線正弦 (sinh) を計算したベクトルを取得する
	 * @returns sinh 適用後のベクトル
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦 (cosh) を計算したベクトルを取得する
	 * @returns cosh 適用後のベクトル
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接 (tanh) を計算したベクトルを取得する
	 * @returns tanh 適用後のベクトル
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算したベクトルを取得する
	 * @returns asinh 適用後のベクトル
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算したベクトルを取得する
	 * @returns acosh 適用後のベクトル
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接 (atanh) を計算したベクトルを取得する
	 * @returns atanh 適用後のベクトル
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数 (exp) を計算したベクトルを取得する
	 * @returns exp 適用後のベクトル
	 */
	exp(): this;
	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算したベクトルを取得する
	 * @returns exp2 適用後のベクトル
	 */
	exp2(): this;
	/**
	 * 各要素に対して exp(x) - 1 を計算したベクトルを取得する
	 * @returns expm1 適用後のベクトル
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数 (ln) を計算したベクトルを取得する
	 * @returns ln 適用後のベクトル
	 */
	ln(): this;
	/**
	 * 各要素の任意の底による対数を計算したベクトルを取得する
	 * @param base - 底
	 * @returns 対数計算後のベクトル
	 */
	log(base: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の底を 2 とする対数を計算したベクトルを取得する
	 * @returns log2 適用後のベクトル
	 */
	log2(): this;
	/**
	 * 各要素の常用対数 (log10) を計算したベクトルを取得する
	 * @returns log10 適用後のベクトル
	 */
	log10(): this;
	/**
	 * 各要素に対して ln(1 + x) を計算したベクトルを取得する
	 * @returns log1p 適用後のベクトル
	 */
	log1p(): this;
	/**
	 * 各要素に対してガンマ関数を計算したベクトルを取得する
	 * @returns ガンマ関数適用後のベクトル
	 */
	gamma(): this;
	/**
	 * 各要素に対してリーマンゼータ関数を計算したベクトルを取得する
	 * @returns ゼータ関数適用後のベクトル
	 */
	zeta(): this;
	/**
	 * 各要素に対して階乗を計算したベクトルを取得する
	 * @returns 階乗適用後のベクトル
	 */
	factorial(): this;
	/**
	 * 最大値を返す
	 * @returns 最大値
	 * @throws {TypeError} ベクトルが空の場合
	 */
	max(): BigFloat;
	/**
	 * 最小値を返す
	 * @returns 最小値
	 * @throws {TypeError} ベクトルが空の場合
	 */
	min(): BigFloat;
	/**
	 * 全要素の合計を計算する
	 * @returns 合計
	 */
	sum(): BigFloat;
	/**
	 * 全要素の積を計算する
	 * @returns 総乗
	 */
	product(): BigFloat;
	/**
	 * 全要素の平均値を計算する
	 * @returns 平均
	 */
	average(): BigFloat;
	/**
	 * 別のベクトルとの内積を計算する
	 * @param other - 対象ベクトル
	 * @returns 内積の値
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 */
	dot(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 二乗ノルム (自分自身との内積) を計算する
	 * @returns 二乗ノルム
	 */
	squaredNorm(): BigFloat;
	/**
	 * ノルム (ベクトルの長さ) を計算する
	 * @returns ノルム
	 */
	norm(): BigFloat;
	/**
	 * ベクトルを正規化する (長さを 1 にする)
	 * @returns 正規化された新しいベクトル
	 * @throws {RangeError} ベクトルの長さが 0 の場合
	 */
	normalize(): this;
	/**
	 * 別のベクトルとの二乗距離を計算する
	 * @param other - 対象ベクトル
	 * @returns 二乗距離
	 */
	squaredDistanceTo(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 別のベクトルとの距離を計算する
	 * @param other - 対象ベクトル
	 * @returns 距離
	 */
	distanceTo(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 別のベクトルへの正射影ベクトルを計算する
	 * @param other - 射影先のベクトル
	 * @returns 射影された新しいベクトル
	 * @throws {RangeError} 射影先のベクトルの長さが 0 の場合
	 */
	projectOnto(other: BigFloatVectorOperand): this;
	/**
	 * 別のベクトルとのなす角を計算する
	 * @param other - 対象ベクトル
	 * @returns 角度 (ラジアン)
	 * @throws {RangeError} いずれかのベクトルの長さが 0 の場合
	 */
	angleTo(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 別のベクトルとの外積を計算する (3次元ベクトル専用)
	 * @param other - 対象ベクトル
	 * @returns 外積の結果の新しいベクトル
	 * @throws {RangeError} いずれかのベクトルが 3 次元でない場合
	 */
	cross(other: BigFloatVectorOperand): this;
}
export type BigFloatComplexObject = {
	re?: BigFloatValue;
	im?: BigFloatValue;
	real?: BigFloatValue;
	imag?: BigFloatValue;
};
export type BigFloatComplexTuple = readonly [
	BigFloatValue,
	BigFloatValue
];
export type BigFloatComplexValue = BigFloatComplex | BigFloatValue | BigFloatComplexTuple | BigFloatComplexObject;
export type BigFloatComplexAggregateSource = Iterable<BigFloatComplexValue>;
/**
 * BigFloat を用いた複素数クラス
 */
export declare class BigFloatComplex implements Iterable<BigFloat> {
	/**
	 * 実部
	 */
	protected _real: BigFloat;
	/**
	 * 虚部
	 */
	protected _imag: BigFloat;
	/**
	 * 精度 (小数点以下の最大桁数)
	 */
	protected _precision: bigint;
	/**
	 * BigFloatComplex コンストラクタ
	 * @param value - 実部、複素数表現 (文字列 "1+2i" など)、または複素数オブジェクト
	 * @param precision - 精度
	 */
	constructor(value?: BigFloatComplexValue, precision?: PrecisionValue);
	/**
	 * BigFloatComplex コンストラクタ
	 * @param real - 実部または複素数表現
	 * @param imag - 虚部
	 * @param precision - 精度
	 */
	constructor(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue);
	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象の値
	 * @param precision - 精度
	 * @returns 変換された BigFloat
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatValue[], precision?: PrecisionValue): bigint;
	/**
	 * 内部 BigFloat インスタンスから複素数を生成する (内部用)
	 * @param real - 実部 BigFloat
	 * @param imag - 虚部 BigFloat
	 * @returns 生成された BigFloatComplex
	 */
	protected static _fromBigFloats(real: BigFloat, imag: BigFloat): BigFloatComplex;
	/**
	 * 多様な複素数表現を実部と虚部のペアに正規化する (内部用)
	 * @param value - 正規化対象の値
	 * @param imag - 虚部 (value が実部のみの場合)
	 * @returns 実部と虚部のオブジェクト
	 */
	protected static _normalizeParts(value: BigFloatComplexValue, imag?: BigFloatValue): {
		realPart: BigFloatValue;
		imagPart: BigFloatValue;
	};
	/**
	 * コンストラクタ引数を解析し、虚部と精度を特定する (内部用)
	 * @param value - 第1引数
	 * @param imagOrPrecision - 第2引数
	 * @param precision - 第3引数
	 * @param argCount - 引数の数
	 * @returns 解決された虚部と精度のオブジェクト
	 */
	protected static _normalizeArguments(value: BigFloatComplexValue, imagOrPrecision: BigFloatValue | PrecisionValue | undefined, precision?: PrecisionValue, argCount?: number): {
		imagPartValue: BigFloatValue;
		precisionValue: PrecisionValue | undefined;
	};
	/**
	 * 第2引数を(虚部ではなく)精度として解釈すべきか判定する (内部用)
	 * @param value - 第1引数
	 * @param imagOrPrecision - 第2引数
	 * @returns 精度として扱う場合は true
	 */
	protected static _shouldTreatSecondArgumentAsPrecision(value: BigFloatComplexValue, imagOrPrecision: BigFloatValue | PrecisionValue | undefined): boolean;
	/**
	 * 複素数文字列を解析する
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _parseComplexString(value: string): {
		realPart: BigFloatValue;
		imagPart: BigFloatValue;
	} | null;
	/**
	 * 虚部係数を正規化する
	 * @throws {SyntaxError} 係数が無効な場合
	 */
	protected static _normalizeImaginaryCoefficient(value: string, original: string): BigFloatValue;
	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された BigFloatComplex
	 */
	protected static _toComplex(value: BigFloatComplexValue, precision?: bigint): BigFloatComplex;
	/**
	 * 複素数 0 を取得する
	 * @param precision - 精度
	 * @returns 0 + 0i
	 */
	static zero(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数 1 を取得する
	 * @param precision - 精度
	 * @returns 1 + 0i
	 */
	static one(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 虚数単位 i を取得する
	 * @param precision - 精度
	 * @returns 0 + 1i
	 */
	static i(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 自然対数の底 e を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns e + 0i
	 */
	static e(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 円周率 pi を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns pi + 0i
	 */
	static pi(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 2*pi (tau) を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns tau + 0i
	 */
	static tau(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 与えられた値から BigFloatComplex を生成する
	 * @param value - 実部、複素数表現、または複素数オブジェクト
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	static from(value: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 与えられた値から BigFloatComplex を生成する
	 * @param value - 実部
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	static from(value: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 実部と虚部を指定して BigFloatComplex を生成する
	 * @param real - 実部
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	static of(real: BigFloatValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 極形式から複素数を生成する
	 * @param magnitude - 絶対値 (r)
	 * @param angle - 偏角 (theta, ラジアン)
	 * @param precision - 精度
	 * @returns 生成された BigFloatComplex
	 */
	static fromPolar(magnitude: BigFloatValue, angle: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数リストの総和を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 総和
	 */
	static sum(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数リストの総積を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 総積
	 */
	static product(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数リストの平均を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 平均
	 */
	static average(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 実部を取得する (複製)
	 */
	get real(): BigFloat;
	/**
	 * 虚部を取得する (複製)
	 */
	get imag(): BigFloat;
	/**
	 * 精度を取得する
	 */
	get precision(): bigint;
	/**
	 * インスタンスを複製する
	 * @returns 複製された BigFloatComplex
	 */
	clone(): BigFloatComplex;
	/**
	 * 精度を変更した新しいインスタンスを返す
	 * @param precision - 新しい精度
	 * @returns 精度が変更された BigFloatComplex
	 */
	changePrecision(precision: PrecisionValue): BigFloatComplex;
	/**
	 * 実部と虚部を配列として取得する
	 * @returns [実部, 虚部]
	 */
	toArray(): [
		BigFloat,
		BigFloat
	];
	/**
	 * 二次元のベクトルへ変換する
	 * @returns BigFloatVector インスタンス
	 */
	toVector(): BigFloatVector;
	/**
	 * 極形式 (絶対値と偏角) へ変換する
	 * @returns 絶対値 (magnitude) と偏角 (angle) のオブジェクト
	 */
	toPolar(): {
		magnitude: BigFloat;
		angle: BigFloat;
	};
	/**
	 * JSON シリアライズ用のオブジェクトを取得する
	 * @returns {re: string, im: string} オブジェクト
	 */
	toJSON(): {
		re: string;
		im: string;
	};
	/**
	 * 文字列表現を取得する
	 * @param base - 基数 (2-36)
	 * @param precision - 表示精度
	 * @returns "a + bi" 形式の文字列
	 */
	toString(base?: number, precision?: PrecisionValue): string;
	/**
	 * 実部と虚部を順に反復するイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/**
	 * 別の複素数と等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 */
	equals(other: BigFloatComplexValue): boolean;
	/**
	 * 別の複素数と等しくないかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しくない場合は true
	 */
	ne(other: BigFloatComplexValue): boolean;
	/**
	 * 複素数 0 (0 + 0i) かどうかを判定する
	 * @returns 0 なら true
	 */
	isZero(): boolean;
	/**
	 * 純実数 (虚部が 0) かどうかを判定する
	 * @returns 純実数なら true
	 */
	isReal(): boolean;
	/**
	 * 純虚数 (実部が 0 かつ虚部が 0 でない) かどうかを判定する
	 * @returns 純虚数なら true
	 */
	isImaginary(): boolean;
	/**
	 * 共役複素数 (a - bi) を取得する
	 * @returns 共役複素数
	 */
	conjugate(): BigFloatComplex;
	/**
	 * 符号を反転させた複素数 (-a - bi) を取得する
	 * @returns 符号反転された複素数
	 */
	neg(): BigFloatComplex;
	/**
	 * 絶対値の二乗 (a^2 + b^2) を計算する
	 * @returns 絶対値の二乗
	 */
	absSquared(): BigFloat;
	/**
	 * 絶対値 (ノルム) を計算する
	 * @returns 絶対値
	 */
	abs(): BigFloat;
	/**
	 * 偏角 (引数) を計算する
	 * @returns 偏角 (ラジアン)
	 */
	arg(): BigFloat;
	/**
	 * 複素数の符号 (z / |z|) を取得する
	 * @returns 単位円上の複素数、または 0
	 */
	sign(): BigFloatComplex;
	/**
	 * ベクトルとして正規化する (絶対値を 1 にする)
	 * @returns 正規化された複素数
	 * @throws {RangeError} ゼロ複素数を正規化しようとした場合
	 */
	normalize(): BigFloatComplex;
	/**
	 * 二つの複素数間の距離を計算する
	 * @param other - 対象
	 * @returns 距離
	 */
	distanceTo(other: BigFloatComplexValue): BigFloat;
	/**
	 * 別の複素数との相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 */
	relativeDiff(other: BigFloatComplexValue): BigFloat;
	/**
	 * 別の複素数との絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差
	 */
	absoluteDiff(other: BigFloatComplexValue): BigFloat;
	/**
	 * 別の複素数との百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分 (%)
	 */
	percentDiff(other: BigFloatComplexValue): BigFloat;
	/**
	 * 複素数を加算する
	 * @param other - 加算する値
	 * @returns 加算結果
	 */
	add(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数を減算する
	 * @param other - 減算する値
	 * @returns 減算結果
	 */
	sub(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数を乗算する
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 */
	mul(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数で除算する
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	div(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 実数(またはその表現)で除算する (内部用)
	 * @param value - 実数
	 * @returns 除算結果
	 */
	protected divByReal(value: BigFloatValue): BigFloatComplex;
	/**
	 * 複素数の逆数を計算する
	 * @returns 逆数
	 */
	reciprocal(): BigFloatComplex;
	/**
	 * 複素数を回転させる
	 * @param angle - 回転角 (ラジアン)
	 * @returns 回転後の複素数
	 */
	rotate(angle: BigFloatValue): BigFloatComplex;
	/**
	 * 複素数の指数関数 exp(z) を計算する
	 * @returns exp(z)
	 */
	exp(): BigFloatComplex;
	/**
	 * 複素数における exp(z) - 1 を計算する
	 * @returns exp(z) - 1
	 */
	expm1(): BigFloatComplex;
	/**
	 * 複素数の自然対数 ln(z) を計算する
	 * @returns ln(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	ln(): BigFloatComplex;
	/**
	 * 複素数の任意の底による対数を計算する
	 * @param base - 底
	 * @returns 対数結果
	 */
	log(base: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数の冪乗 z^exponent を計算する
	 * @param exponent - 指数
	 * @returns 冪乗結果
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 */
	pow(exponent: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数の平方根を計算する
	 * @returns 平方根
	 */
	sqrt(): BigFloatComplex;
	/**
	 * 複素数の立方根を計算する
	 * @returns 立方根
	 */
	cbrt(): BigFloatComplex;
	/**
	 * 複素数の n 乗根の主値を計算する
	 * @param n - 指数
	 * @returns n 乗根の主値
	 */
	nthRoot(n: number | bigint): BigFloatComplex;
	/**
	 * 複素数のすべての n 乗根を取得する
	 * @param n - 指数 (正の整数)
	 * @returns n 乗根の配列
	 * @throws {RangeError} n が正の整数でない場合
	 */
	nthRoots(n: number | bigint): BigFloatComplex[];
	/**
	 * 複素数の正弦 (sin) を計算する
	 * @returns sin(z)
	 */
	sin(): BigFloatComplex;
	/**
	 * 複素数の余弦 (cos) を計算する
	 * @returns cos(z)
	 */
	cos(): BigFloatComplex;
	/**
	 * 複素数の正接 (tan) を計算する
	 * @returns tan(z)
	 */
	tan(): BigFloatComplex;
	/**
	 * 複素数の双曲線正弦 (sinh) を計算する
	 * @returns sinh(z)
	 */
	sinh(): BigFloatComplex;
	/**
	 * 複素数の双曲線余弦 (cosh) を計算する
	 * @returns cosh(z)
	 */
	cosh(): BigFloatComplex;
	/**
	 * 複素数の双曲線正接 (tanh) を計算する
	 * @returns tanh(z)
	 */
	tanh(): BigFloatComplex;
	/**
	 * 複素数の逆正弦 (asin) を計算する
	 * @returns asin(z)
	 */
	asin(): BigFloatComplex;
	/**
	 * 複素数の逆余弦 (acos) を計算する
	 * @returns acos(z)
	 */
	acos(): BigFloatComplex;
	/**
	 * 複素数の逆正接 (atan) を計算する
	 * @returns atan(z)
	 */
	atan(): BigFloatComplex;
	/**
	 * 複素数の逆双曲線正弦 (asinh) を計算する
	 * @returns asinh(z)
	 */
	asinh(): BigFloatComplex;
	/**
	 * 複素数の逆双曲線余弦 (acosh) を計算する
	 * @returns acosh(z)
	 */
	acosh(): BigFloatComplex;
	/**
	 * 複素数の逆双曲線正接 (atanh) を計算する
	 * @returns atanh(z)
	 */
	atanh(): BigFloatComplex;
}
/**
 * BigFloatComplex を作成する
 * @param value - 実部、複素数表現、または複素数オブジェクト
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export declare function bigFloatComplex(value?: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
/**
 * BigFloatComplex を作成する
 * @param real - 実部
 * @param imag - 虚部
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export declare function bigFloatComplex(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
export type BigFloatConstructor = typeof BigFloat;
export type BigFloatRawValue = {
	mantissa: bigint;
	exp2: bigint;
	exp5: bigint;
};
export type BigFloatCacheEntry = {
	exactValue: bigint;
	precision: bigint;
};
/**
 * BigFloat settings
 */
export declare class BigFloatConfig {
	/** 精度の不一致を許容するかどうか */
	allowPrecisionMismatch: boolean;
	/** BigFloatComplex との相互運用を許容するかどうか */
	allowComplexNumbers: boolean;
	/** 破壊的な計算(自身の上書き)をするかどうか */
	mutateResult: boolean;
	/** Infinity/NaN の特殊値を許容するかどうか */
	allowSpecialValues: boolean;
	/** 丸めモード */
	roundingMode: RoundingMode;
	/** 計算時に追加する精度 */
	extraPrecision: bigint;
	/** 三角関数の最大ステップ数 */
	trigFuncsMaxSteps: bigint;
	/** 対数計算の最大ステップ数 */
	lnMaxSteps: bigint;
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
	 */
	constructor({ allowPrecisionMismatch, allowComplexNumbers, mutateResult, allowSpecialValues, roundingMode, extraPrecision, trigFuncsMaxSteps, lnMaxSteps }?: BigFloatOptions);
	/**
	 * 設定オブジェクトを複製する
	 * @returns 複製された設定オブジェクト
	 */
	clone(): BigFloatConfig;
	/**
	 * 精度の不一致を許容するかどうかを切り替える
	 */
	toggleMismatch(): void;
	/**
	 * BigFloatComplex との相互運用を許容するかどうかを切り替える
	 */
	toggleComplexNumbers(): void;
	/**
	 * 破壊的な計算(自身の上書き)をするかどうかを切り替える
	 */
	toggleMutation(): void;
}
/**
 * 大きな浮動小数点数を扱えるクラス
 */
export declare class BigFloat {
	/** 最大精度 (Stringの限界) */
	static MAX_PRECISION: bigint;
	/** レイジー正規化の閾値 */
	static LAZY_NORMALIZE_SMALL_THRESHOLD: bigint;
	/** デフォルトの精度 */
	static DEFAULT_PRECISION: bigint;
	/** 設定 */
	static config: BigFloatConfig;
	/** 円周率キャッシュ */
	private static _piCache;
	/** eキャッシュ */
	private static _eCache;
	/** 対数キャッシュ */
	private static _lnCache;
	/** 5の累乗キャッシュ */
	private static _pow5Cache;
	/** 2の累乗キャッシュ */
	private static _pow2Cache;
	/** Bernoulli numbers cache */
	private static _bernoulliCache;
	/**
	 * キャッシュをクリアする
	 */
	static clearCache(): void;
	/** 内部的な値 (mantissa × 2^exp2 × 5^exp5) */
	mantissa: bigint;
	/** 2の指数 */
	_exp2: bigint;
	/** 5の指数 */
	_exp5: bigint;
	/**
	 * 2の指数を取得する
	 * @returns 2の指数 (2^exp2)
	 */
	exponent2(): bigint;
	/**
	 * 5の指数を取得する
	 * @returns 5の指数 (5^exp5)
	 */
	exponent5(): bigint;
	/** 精度 (小数点以下の最大桁数) */
	_precision: bigint;
	/** 特殊値の状態 */
	_specialState: SpecialValueState;
	/**
	 * 特殊値状態を表示用の文字列に変換する
	 * @param state - 特殊値状態
	 * @returns 表示用の文字列
	 */
	protected static _specialStateLabel(state: SpecialValueState): string;
	/**
	 * 文字列から特殊値状態を判定する
	 * @param value - 判定対象の文字列
	 * @returns 対応する特殊値状態。通常の数値文字列の場合はnull
	 */
	protected static _stateFromString(value: string): SpecialValueState | null;
	/**
	 * number値から特殊値状態を判定する
	 * @param value - 判定対象の値
	 * @returns 対応する特殊値状態。有限値の場合はnull
	 */
	protected static _stateFromNumber(value: number): SpecialValueState | null;
	/**
	 * 特殊値状態のインスタンスを生成する
	 * @param state - 特殊値状態
	 * @param precision - 結果の精度
	 * @returns 生成された特殊値インスタンス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected static _createSpecialValue(state: SpecialValueState, precision: bigint): BigFloat;
	/**
	 * 自身または新しいインスタンスに特殊値状態を設定する
	 * @param state - 特殊値状態
	 * @param precision - 結果の精度
	 * @returns 特殊値状態を持つ結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected _specialResult(state: SpecialValueState, precision?: bigint): BigFloat;
	/**
	 * 有限値かどうかを判定する
	 * @returns 有限値の場合はtrue
	 */
	protected _isFiniteState(): boolean;
	/**
	 * NaN状態かどうかを判定する
	 * @returns NaN状態の場合はtrue
	 */
	protected _isNaNState(): boolean;
	/**
	 * 無限大状態かどうかを判定する
	 * @returns 正または負の無限大の場合はtrue
	 */
	protected _isInfinityState(): boolean;
	/**
	 * 符号を取得する
	 * @returns 正なら1、負なら-1、ゼロまたはNaNなら0
	 */
	protected _signum(): number;
	/**
	 * 特殊値が無効な設定で特殊値を扱っていないかを検証する
	 * @param values - 検証対象の値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	protected _ensureSpecialValuesEnabled(...values: BigFloat[]): void;
	/**
	 * BigFloatComplex らしい値か判定する
	 * @param value - 判定対象
	 * @returns BigFloatComplex の場合は true
	 */
	protected static _isComplexValue(value: unknown): value is BigFloatComplex;
	/**
	 * 複素数モードが無効な場合は例外にする
	 * @param operation - 操作名
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected _assertComplexNumbersEnabled(operation: string): void;
	/**
	 * 複素数オペランドを解決する
	 * @param other - 比較対象
	 * @param operation - 操作名
	 * @returns BigFloatComplex の場合はそのインスタンス、それ以外は null
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected _complexOperand(other: unknown, operation: string): BigFloatComplex | null;
	/**
	 * 自身を複素数へ昇格する
	 * @param other - 昇格の基準となる複素数
	 * @returns 昇格後の複素数
	 */
	protected _toComplexLike(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 特殊値を考慮してnumberへ変換する
	 * @returns 変換後のnumber値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	protected _specialAwareNumber(): number;
	/**
	 * number値から特殊値を考慮した結果を生成する
	 * @param value - 変換元のnumber値
	 * @param precision - 結果の精度
	 * @returns 変換後のBigFloat
	 */
	protected _fromSpecialAwareNumber(value: number, precision?: bigint): BigFloat;
	/**
	 * 指定精度の厳密値結果を生成する
	 * @param mantissa - 仮数
	 * @param precision - 結果の精度
	 * @param exp2 - 2の指数
	 * @param exp5 - 5の指数
	 * @returns 厳密値の結果
	 */
	protected _makeExactResultWithPrecision(mantissa: bigint, precision: bigint, exp2?: bigint, exp5?: bigint): BigFloat;
	/**
	 * BigFloat コンストラクタ
	 * @param value - 初期値 (数値, 文字列, BigInt, または別の BigFloat)
	 * @param precision - 精度 (小数点以下の最大桁数)
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を渡した場合
	 */
	constructor(value?: BigFloatValue, precision?: PrecisionValue);
	/**
	 * クラスを複製する (設定複製用)
	 * @returns 複製されたクラス
	 */
	static clone(): BigFloatConstructor;
	/**
	 * インスタンスを複製する
	 * @returns 複製されたインスタンス
	 */
	clone(): BigFloat;
	/**
	 * 他のインスタンスの値を自身にコピーする
	 * @param other - コピー元
	 * @returns 自身
	 */
	copyFrom(other: BigFloat): this;
	/**
	 * 生の内部表現から結果を作成する
	 * @param mantissa - 仮数
	 * @param exp2 - 2の指数
	 * @param exp5 - 5の指数
	 * @returns 結果
	 */
	protected _makeExactResult(mantissa: bigint, exp2?: bigint, exp5?: bigint): BigFloat;
	/**
	 * 厳密な整数値を取得する
	 * @returns 整数値、整数でない場合はnull
	 */
	protected _getExactInteger(): bigint | null;
	/**
	 * 厳密な2の冪指数を取得する
	 * @returns 2の冪指数、該当しない場合はnull
	 */
	protected _getExactPowerOf2Exponent(): bigint | null;
	/**
	 * 厳密な10の冪指数を取得する
	 * @returns 10の冪指数、該当しない場合はnull
	 */
	protected _getExactPowerOf10Exponent(): bigint | null;
	/**
	 * ソフト正規化 (2の累乗を外に出す)
	 */
	softNormalize(): void;
	/**
	 * レイジー正規化 (5の累乗を外に出す)
	 */
	lazyNormalize(): void;
	/**
	 * 指定された精度に丸める
	 * @param precision - 精度 (省略時は自身の _precision)
	 */
	protected _applyPrecision(precision?: bigint): void;
	/**
	 * 手動丸め (内部用)
	 * @param mantissa - 値
	 * @param divisor - 除数
	 * @returns 丸められた値
	 */
	protected static _roundManual(mantissa: bigint, divisor: bigint): bigint;
	/**
	 * 文字列を数値に変換する
	 * @param str - 変換する文字列
	 * @param precision - 小数点以下の桁数
	 * @param base - 基数
	 * @returns 変換されたBigFloatインスタンス
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SyntaxError} 不正な文字が含まれている場合
	 */
	static parseFloat(str: BigFloatValue, precision?: PrecisionValue, base?: number): BigFloat;
	/**
	 * 文字列を解析して数値を取得
	 * @param str - 解析する文字列
	 * @returns 整数部、小数部、符号
	 */
	_parse(str: string): {
		intPart: string;
		fracPart: string;
		sign: number;
	};
	/**
	 * 集計関数の単一配列引数かどうかを判定する
	 * @param args - 引数リスト
	 * @returns 単一配列引数の場合はtrue
	 */
	protected static _hasAggregateArrayArg(args: BigFloatAggregateArgs): args is [
		readonly BigFloatValue[]
	];
	/**
	 * 引数を正規化する
	 * @param args - 引数リスト
	 * @returns 正規化された引数リスト
	 */
	protected static _normalizeArgs(args: BigFloatAggregateArgs): BigFloatValue[];
	/**
	 * 演算に使う精度を解決する
	 * @param values - 対象値
	 * @param fallback - デフォルト精度
	 * @returns 解決済み精度
	 */
	protected static _resolvePrecisionFromValues(values: readonly BigFloatValue[], fallback?: PrecisionValue): bigint;
	/**
	 * 値を指定精度のBigFloatへ正規化する
	 * @param value - 対象値
	 * @param precision - 精度
	 * @returns 正規化後のBigFloat
	 */
	protected static _coerceBigFloatValue(value: BigFloatValue, precision: bigint): BigFloat;
	/**
	 * 内部整数値から生の内部表現を生成する
	 * @param value - 10^precision倍された整数値
	 * @param precision - 精度
	 * @returns 生の内部表現
	 */
	protected static _fromInternalValue(value: bigint, precision: bigint): BigFloatRawValue;
	/**
	 * 生の内部表現を10^precision倍された整数値に変換する
	 * @param value - 生の内部表現
	 * @param precision - 精度
	 * @returns 10^precision倍された整数値
	 */
	protected static _toInternalValue(value: BigFloatRawValue, precision: bigint): bigint;
	/**
	 * 生の内部表現をソフト正規化する
	 * @param value - 対象
	 * @returns 正規化後の内部表現
	 */
	protected static _softNormalizeRaw(value: BigFloatRawValue): BigFloatRawValue;
	/**
	 * 生の内部表現を指定精度へ丸める
	 * @param value - 対象
	 * @param precision - 精度
	 * @returns 丸め後の内部表現
	 */
	protected static _applyRawPrecision(value: BigFloatRawValue, precision: bigint): BigFloatRawValue;
	/**
	 * 生の内部表現をレイジー正規化する
	 * @param value - 対象
	 * @returns 正規化後の内部表現
	 */
	protected static _lazyNormalizeRaw(value: BigFloatRawValue): BigFloatRawValue;
	/**
	 * mantissa から符号・2の指数・5の指数を抽出する
	 * @param mantissa - 対象
	 * @returns 分解結果
	 */
	protected static _extractPowerFactors(mantissa: bigint): {
		sign: bigint;
		mantissa: bigint;
		exp2: bigint;
		exp5: bigint;
	};
	/**
	 * 最大公約数を取得する
	 * @param a - 値A
	 * @param b - 値B
	 * @returns 最大公約数
	 */
	protected static _gcd(a: bigint, b: bigint): bigint;
	/**
	 * 精度を合わせる
	 * @param other - 合わせる対象
	 * @param mutateA - 自身を破壊的に変更するかどうか
	 * @returns [BigFloatA, BigFloatB] (アラインメント済みのインスタンス)
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 */
	protected _align(other: BigFloatValue, mutateA?: boolean): [
		BigFloat,
		BigFloat
	];
	/**
	 * 結果を作成する (静的メソッド)
	 * @param val - 値 (10^valPrecision倍された整数)
	 * @param precision - 保持する精度 (小数点以下の最大桁数)
	 * @param valPrecision - 入力値の現在の精度 (省略時は precision)
	 * @returns 作成されたBigFloatインスタンス
	 */
	protected static _makeResult(val: bigint, precision: bigint, valPrecision?: bigint): BigFloat;
	/**
	 * 結果を作成する (インスタンスメソッド)
	 * @param val - 値 (10^valPrecision倍された整数)
	 * @param precision - 保持する精度 (小数点以下の最大桁数)
	 * @param valPrecision - 入力値の現在の精度 (省略時は precision)
	 * @param okMutate - 破壊的な変更を許可するかどうか
	 * @returns 作成または更新されたBigFloatインスタンス
	 */
	protected _makeResult(val: bigint, precision: bigint, valPrecision?: bigint, okMutate?: boolean): BigFloat;
	/**
	 * 正の整数 n の degree 乗根の初期値を概算する
	 * @param value - 対象の正の整数
	 * @param degree - 乗根の次数
	 * @param decimalShift - 値に追加で掛かっている 10 の指数
	 * @returns ニュートン法用の初期値
	 * @throws {RangeError} degree が正の整数でない場合
	 */
	protected static _estimatePositiveRoot(value: bigint, degree: bigint, decimalShift?: bigint): bigint;
	/**
	 * 精度をチェックする
	 * @param precision - チェックする精度
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _checkPrecision(precision: bigint): void;
	/**
	 * 精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更されたインスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * どこまで精度が一致しているかを判定する
	 * @param other - 比較対象
	 * @returns 一致している桁数
	 */
	matchingPrecision(other: BigFloatValue): bigint;
	/**
	 * 比較演算
	 * @param other - 比較対象
	 * @returns 比較結果 (-1, 0, 1)。NaN の比較が含まれる場合は NaN
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 */
	compare(other: BigFloatValue): number;
	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 */
	eq(other: BigFloatValue): boolean;
	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 */
	equals(other: BigFloatValue): boolean;
	/**
	 * 等しくないかどうかを判定する (!=)
	 * @param other - 比較対象
	 * @returns 等しくない場合はtrue
	 */
	ne(other: BigFloatValue): boolean;
	/**
	 * より小さいかどうかを判定する (<)
	 * @param other - 比較対象
	 * @returns より小さい場合はtrue
	 */
	lt(other: BigFloatValue): boolean;
	/**
	 * 以下かどうかを判定する (<=)
	 * @param other - 比較対象
	 * @returns 以下の場合はtrue
	 */
	lte(other: BigFloatValue): boolean;
	/**
	 * より大きいかどうかを判定する (>)
	 * @param other - 比較対象
	 * @returns より大きい場合はtrue
	 */
	gt(other: BigFloatValue): boolean;
	/**
	 * 以上かどうかを判定する (>=)
	 * @param other - 比較対象
	 * @returns 以上の場合はtrue
	 */
	gte(other: BigFloatValue): boolean;
	/**
	 * ゼロかどうかを判定する
	 * @returns ゼロの場合はtrue
	 */
	isZero(): boolean;
	/**
	 * 正の数かどうかを判定する
	 * @returns 正の数の場合はtrue
	 */
	isPositive(): boolean;
	/**
	 * 負の数かどうかを判定する
	 * @returns 負の数の場合はtrue
	 */
	isNegative(): boolean;
	/**
	 * 相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 */
	relativeDiff(other: BigFloatValue | BigFloatComplex): BigFloat;
	/**
	 * 絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差
	 */
	absoluteDiff(other: BigFloatValue | BigFloatComplex): BigFloat;
	/**
	 * 差分の非一致度を計算する (百分率)
	 * @param other - 比較対象
	 * @returns 非一致度 (%)
	 */
	percentDiff(other: BigFloatValue | BigFloatComplex): BigFloat;
	/**
	 * 文字列に変換する
	 * @param base - 基数 (2-36)
	 * @param precision - 出力時の精度
	 * @returns 変換された文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 */
	toString(base?: number, precision?: PrecisionValue): string;
	/**
	 * JSON用の文字列表現を取得する
	 * @returns JSON文字列
	 */
	toJSON(): string;
	/**
	 * Number型に変換する
	 * @returns 変換された数値
	 */
	toNumber(): number;
	/**
	 * 指定した桁数で固定した文字列を取得する
	 * @param digits - 小数点以下の桁数
	 * @returns 固定小数点形式の文字列
	 */
	toFixed(digits: PrecisionValue): string;
	/**
	 * 指数形式の文字列を取得する
	 * @param digits - 有効桁数
	 * @returns 指数形式の文字列
	 */
	toExponential(digits?: number): string;
	/**
	 * 加算する (+)
	 * @param other - 加算する値
	 * @returns 加算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値が入力された場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない設定で精度が異なる値を加算しようとした場合
	 */
	add(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を加算する (+)
	 * @param other - 加算する複素数
	 * @returns 加算結果
	 */
	add(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 減算する (-)
	 * @param other - 減算する値
	 * @returns 減算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値が入力された場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない設定で精度が異なる値を減算しようとした場合
	 */
	sub(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を減算する (-)
	 * @param other - 減算する複素数
	 * @returns 減算結果
	 */
	sub(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 乗算する (*)
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値が入力された場合
	 */
	mul(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を乗算する (*)
	 * @param other - 乗算する複素数
	 * @returns 乗算結果
	 */
	mul(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 除算する (/)
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @throws {DivisionByZeroError} 特殊値が無効な設定でゼロ除算を行おうとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値が入力された場合
	 */
	div(other: BigFloatValue): BigFloat;
	/**
	 * 複素数で除算する (/)
	 * @param other - 除算する複素数
	 * @returns 除算結果
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	div(other: BigFloatComplex): BigFloatComplex;
	/**
	 * インスタンスから結果を作成する
	 * @param instance - 結果の元となるインスタンス
	 * @returns 結果のインスタンス
	 */
	protected _makeResultFromInstance(instance: BigFloat): BigFloat;
	/**
	 * 内部的な計算用に、指定した精度の10進整数値を取得する
	 * @param precision - 精度
	 * @returns 10^precision倍された整数値
	 */
	protected _getInternalValue(precision: bigint): bigint;
	/**
	 * 剰余を計算する (内部用)
	 * @param x - 被除数
	 * @param m - 法
	 * @returns 剰余
	 */
	protected static _mod(x: bigint, m: bigint): bigint;
	/**
	 * 剰余を計算する (%)
	 * @param other - 法
	 * @returns 剰余
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値が入力された場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない設定で精度が異なる値の剰余を計算しようとした場合
	 */
	mod(other: BigFloatValue): BigFloat;
	/**
	 * 複素数の剰余（未サポート）
	 * @param other - 法
	 * @throws {TypeError} 常にスローされる
	 */
	mod(other: BigFloatComplex): never;
	/**
	 * 符号を反転させる
	 * @returns 符号が反転した結果
	 */
	neg(): BigFloat;
	/**
	 * 絶対値を取得する
	 * @returns 絶対値
	 */
	abs(): BigFloat;
	/**
	 * 符号を取得する
	 * @returns -1, 0, 1 または NaN
	 */
	sign(): BigFloat;
	/**
	 * 逆数を取得する
	 * @returns 逆数
	 * @throws {DivisionByZeroError} ゼロの場合
	 */
	reciprocal(): BigFloat;
	/**
	 * 床関数 (負の無限大方向への丸め)
	 * @returns 丸められた結果
	 */
	floor(): BigFloat;
	/**
	 * 天井関数 (正の無限大方向への丸め)
	 * @returns 丸められた結果
	 */
	ceil(): BigFloat;
	/**
	 * 四捨五入する
	 * @returns 四捨五入された結果
	 */
	round(): BigFloat;
	/**
	 * 0に近い方向へ切り捨てる
	 * @returns 切り捨てられた結果
	 */
	trunc(): BigFloat;
	/**
	 * Float32 精度へ丸める
	 * @returns Float32相当に丸めた結果
	 */
	fround(): BigFloat;
	/**
	 * 32bit整数として見たときの先頭ゼロビット数を返す
	 * @returns 先頭ゼロビット数
	 */
	clz32(): BigFloat;
	/**
	 * 冪乗を計算する (内部用)
	 * @param base - 底
	 * @param exponent - 指数
	 * @param precision - 精度
	 * @returns 冪乗の結果
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	protected static _pow(base: bigint, exponent: bigint, precision: bigint): bigint;
	/**
	 * 冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @throws {RangeError} 負の数の非整数冪を計算しようとした場合
	 * @throws {DivisionByZeroError} 特殊値が無効な設定でゼロの負の数乗を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値が入力された場合
	 */
	pow(exponent: BigFloatValue): BigFloat;
	/**
	 * 複素数の冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 */
	pow(exponent: BigFloatComplex): BigFloatComplex;
	/**
	 * 平方根を計算する (内部用)
	 * @param n - 値
	 * @param precision - 精度
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _sqrt(n: bigint, precision: bigint): bigint;
	/**
	 * 平方根を計算する
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	sqrt(): BigFloat;
	/**
	 * 立方根を計算する
	 * @returns 立方根
	 */
	cbrt(): BigFloat;
	/**
	 * n乗根を計算する (内部用)
	 * @param v - 値
	 * @param n - 指数
	 * @param precision - 精度
	 * @returns n乗根
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	protected static _nthRoot(v: bigint, n: bigint, precision: bigint): bigint;
	/**
	 * n乗根を計算する
	 * @param n - 指数
	 * @returns n乗根
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	nthRoot(n: number | bigint): BigFloat;
	/**
	 * 正弦(sin)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正弦
	 */
	protected static _sin(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 範囲縮約なしで正弦(sin)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正弦
	 */
	protected static _sinSeries(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 正弦(sin)を計算する
	 * @returns 正弦
	 */
	sin(): BigFloat;
	/**
	 * 余弦(cos)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 余弦
	 */
	protected static _cos(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 余弦(cos)を計算する
	 * @returns 余弦
	 */
	cos(): BigFloat;
	/**
	 * 正接(tan)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正接
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 */
	protected static _tan(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 正接(tan)を計算する
	 * @returns 正接
	 */
	tan(): BigFloat;
	/**
	 * 逆正弦(asin)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 */
	protected static _asin(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 逆正弦(asin)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 */
	asin(): BigFloat;
	/**
	 * 逆余弦(acos)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 */
	protected static _acos(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 逆余弦(acos)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 */
	acos(): BigFloat;
	/**
	 * 逆正接(atan)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	protected static _atan(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 逆正接(atan)を計算する
	 * @returns 角度(ラジアン)
	 */
	atan(): BigFloat;
	/**
	 * 2引数の逆正接(atan2)を計算する (内部用)
	 * @param y - y座標
	 * @param x - x座標
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 */
	protected static _atan2(y: bigint, x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 2引数の逆正接(atan2)を計算する
	 * @param x - x座標
	 * @returns 角度(ラジアン)
	 */
	atan2(x: BigFloatValue): BigFloat;
	/**
	 * 双曲線正弦(sinh)を計算する
	 * @returns 双曲線正弦
	 */
	sinh(): BigFloat;
	/**
	 * 双曲線余弦(cosh)を計算する
	 * @returns 双曲線余弦
	 */
	cosh(): BigFloat;
	/**
	 * 双曲線正接(tanh)を計算する
	 * @returns 双曲線正接
	 */
	tanh(): BigFloat;
	/**
	 * 逆双曲線正弦(asinh)を計算する
	 * @returns 逆双曲線正弦
	 */
	asinh(): BigFloat;
	/**
	 * 逆双曲線余弦(acosh)を計算する
	 * @returns 逆双曲線余弦
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 */
	acosh(): BigFloat;
	/**
	 * 逆双曲線正接(atanh)を計算する
	 * @returns 逆双曲線正接
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 */
	atanh(): BigFloat;
	/**
	 * マチン(Machin)の公式用のatan計算 (内部用)
	 * @param invX - 1/xのx
	 * @param precision - 精度
	 * @returns atan(1/x)
	 */
	protected static _atanMachine(invX: bigint, precision: bigint): bigint;
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
	protected static _trigFuncsNewton(f: (x: bigint) => bigint, df: (x: bigint) => bigint, initial: bigint, precision: bigint, maxSteps?: number): bigint;
	/**
	 * sin(pi * z) を計算する (内部用)
	 * @param z - 値
	 * @param precision - 精度
	 * @returns sin(pi * z)
	 */
	protected static _sinPi(z: bigint, precision: bigint): bigint;
	/**
	 * 指数関数(e^x)を計算する (内部用)
	 * @param x - 指数
	 * @param precision - 精度
	 * @returns e^x
	 */
	protected static _exp(x: bigint, precision: bigint): bigint;
	/**
	 * 指数関数(e^x)を計算する
	 * @returns e^x
	 */
	exp(): BigFloat;
	/**
	 * 2の冪乗(2^x)を計算する (内部用)
	 * @param value - 指数
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 2^x
	 */
	protected static _exp2(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 2の冪乗(2^x)を計算する
	 * @returns 2^x
	 */
	exp2(): BigFloat;
	/**
	 * e^x - 1 を計算する (内部用)
	 * @param value - 指数
	 * @param precision - 精度
	 * @returns e^x - 1
	 */
	protected static _expm1(value: bigint, precision: bigint): bigint;
	/**
	 * e^x - 1 を計算する
	 * @returns e^x - 1
	 */
	expm1(): BigFloat;
	/**
	 * 自然対数(ln)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(value)
	 * @throws {RangeError} 値が0以下の場合
	 */
	protected static _ln(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 自然対数(ln)を計算する
	 * @returns ln(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 */
	ln(): BigFloat;
	/**
	 * 対数を計算する (内部用)
	 * @param value - 値
	 * @param baseValue - 底
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log_base(value)
	 * @throws {RangeError} 底が1または0の場合
	 */
	protected static _log(value: bigint, baseValue: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 対数を計算する
	 * @param base - 底
	 * @returns log_base(x)
	 */
	log(base: BigFloatValue): BigFloat;
	/**
	 * 2を底とする対数(log2)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log2(value)
	 */
	protected static _log2(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 2を底とする対数(log2)を計算する
	 * @returns log2(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 */
	log2(): BigFloat;
	/**
	 * 10を底とする対数(log10)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log10(value)
	 */
	protected static _log10(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 10を底とする対数(log10)を計算する
	 * @returns log10(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 */
	log10(): BigFloat;
	/**
	 * ln(1 + x) を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(1 + value)
	 */
	protected static _log1p(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * ln(1 + x) を計算する
	 * @returns ln(1 + x)
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 */
	log1p(): BigFloat;
	/**
	 * ln(10) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(10)
	 */
	protected static _ln10(precision: bigint, maxSteps?: bigint): bigint;
	/**
	 * ln(2) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(2)
	 */
	protected static _ln2(precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 自然対数の底(e)を取得する (内部用)
	 * @param precision - 精度
	 * @returns e
	 */
	protected static _e(precision: bigint): bigint;
	/**
	 * 自然対数の底(e)を取得する
	 * @param precision - 精度
	 * @returns e
	 */
	static e(precision?: PrecisionValue): BigFloat;
	/**
	 * チュドノフスキー法で円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 */
	protected static _piChudnovsky(precision?: bigint): bigint;
	/**
	 * 設定されたアルゴリズムで円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 */
	protected static _pi(precision: bigint): bigint;
	/**
	 * 円周率(pi)を取得する
	 * @param precision - 精度
	 * @returns pi
	 */
	static pi(precision?: PrecisionValue): BigFloat;
	/**
	 * タウ(tau = 2*pi)を計算する (内部用)
	 * @param precision - 精度
	 * @returns tau
	 */
	protected static _tau(precision: bigint): bigint;
	/**
	 * タウ(tau = 2*pi)を取得する
	 * @param precision - 精度
	 * @returns tau
	 */
	static tau(precision?: PrecisionValue): BigFloat;
	/**
	 * Math.abs() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 絶対値
	 */
	static abs(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.acos() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆余弦
	 */
	static acos(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.acosh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線余弦
	 */
	static acosh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.asin() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆正弦
	 */
	static asin(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.asinh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線正弦
	 */
	static asinh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.atan() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆正接
	 */
	static atan(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.atan2() 相当
	 * @param y - y座標
	 * @param x - x座標
	 * @param precision - 結果精度
	 * @returns 逆正接
	 */
	static atan2(y: BigFloatValue, x: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.atanh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線正接
	 */
	static atanh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.cbrt() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 立方根
	 */
	static cbrt(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.ceil() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り上げ結果
	 */
	static ceil(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.clz32() 相当
	 * @param value - 対象値
	 * @returns 先頭ゼロビット数
	 */
	static clz32(value: BigFloatValue): BigFloat;
	/**
	 * Math.cos() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 余弦
	 */
	static cos(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.cosh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線余弦
	 */
	static cosh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.exp() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 指数関数
	 */
	static exp(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.expm1() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns e^x - 1
	 */
	static expm1(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.floor() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り捨て結果
	 */
	static floor(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.fround() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns Float32相当に丸めた結果
	 */
	static fround(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.hypot() 相当
	 * @param values - 値の列
	 * @returns sqrt(sum(x_i^2))
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 */
	static hypot(...values: BigFloatValue[]): BigFloat;
	/**
	 * Math.imul() 相当
	 * @param lhs - 左辺
	 * @param rhs - 右辺
	 * @returns 32bit整数乗算結果
	 */
	static imul(lhs: BigFloatValue, rhs: BigFloatValue): BigFloat;
	/**
	 * Math.log() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 自然対数
	 */
	static log(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.log10() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 常用対数
	 */
	static log10(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.log1p() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns ln(1 + x)
	 */
	static log1p(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.log2() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 底2対数
	 */
	static log2(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.max() 相当
	 * @param args - 数値のリスト
	 * @returns 最大値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 */
	static max(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * Math.min() 相当
	 * @param args - 数値のリスト
	 * @returns 最小値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 */
	static min(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * Math.pow() 相当
	 * @param base - 底
	 * @param exponent - 指数
	 * @param precision - 結果精度
	 * @returns 冪乗結果
	 */
	static pow(base: BigFloatValue, exponent: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.round() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 四捨五入結果
	 */
	static round(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sign() 相当
	 * @param value - 対象値
	 * @param precision - 入力精度
	 * @returns 符号
	 */
	static sign(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sin() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 正弦
	 */
	static sin(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sinh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線正弦
	 */
	static sinh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sqrt() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 平方根
	 */
	static sqrt(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.tan() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 正接
	 */
	static tan(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.tanh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線正接
	 */
	static tanh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.trunc() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り捨て結果
	 */
	static trunc(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * 引数の合計を返す
	 * @param args - 数値のリスト
	 * @returns 合計
	 */
	static sum(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の積を返す
	 * @param args - 数値のリスト
	 * @returns 積
	 */
	static product(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の平均を返す
	 * @param args - 数値のリスト
	 * @returns 平均
	 */
	static average(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の中央値を返す
	 * @param args - 数値のリスト
	 * @returns 中央値
	 * @throws {TypeError} 引数が空の場合
	 */
	static median(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の分散を返す
	 * @param args - 数値のリスト
	 * @returns 分散
	 * @throws {TypeError} 引数が空の場合
	 */
	static variance(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の標準偏差を返す
	 * @param args - 数値のリスト
	 * @returns 標準偏差
	 */
	static stddev(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * ランダムな整数値を生成する (内部用)
	 * @param precision - 精度
	 * @returns ランダムな値
	 */
	protected static _randomBigInt(precision: bigint): bigint;
	/**
	 * 0以上1未満のランダムなBigFloatを生成する
	 * @param precision - 精度
	 * @returns ランダムなBigFloat
	 */
	static random(precision?: PrecisionValue): BigFloat;
	/**
	 * 数値積分を計算する (内部用)
	 * @param f - 関数
	 * @param a - 開始点
	 * @param b - 終了点
	 * @param n - 分割数
	 * @param precision - 精度
	 * @returns 積分結果
	 */
	protected static _integral(f: (k: bigint) => bigint, a: bigint, b: bigint, n: bigint, precision: bigint): bigint;
	/**
	 * 連続する整数の冪乗を計算する (内部用)
	 * (n * scale)^-s を n=1..N について計算する
	 * @param s - 指数
	 * @param N - 最大の整数
	 * @param precision - 精度
	 * @returns 冪乗の結果の配列 (1-indexed)
	 */
	protected static _computePowers(s: bigint, N: number, precision: bigint): bigint[];
	/**
	 * ベルヌーイ数を生成する (内部用)
	 * @param n - 最大次数
	 * @param precision - 精度
	 * @returns ベルヌーイ数のリスト
	 */
	protected static _bernoulliNumbers(n: number, precision: bigint): bigint[];
	/**
	 * ln(2 * pi) を計算する (内部用)
	 * @param precision - 精度
	 * @returns ln(2 * pi)
	 */
	protected static _ln2pi(precision: bigint): bigint;
	/**
	 * キャッシュ付きでベルヌーイ数を取得する
	 * @param n - 最大次数
	 * @param precision - 精度
	 * @returns ベルヌーイ数のリスト
	 */
	protected static _getBernoulliNumbers(n: number, precision: bigint): bigint[];
	/**
	 * 1 に近い zeta 引数に必要な追加精度を見積もる
	 * @param value - 値
	 * @param precision - 精度
	 * @returns 追加精度
	 */
	protected static _zetaPoleCancellationDigits(value: bigint, precision: bigint): bigint;
	/**
	 * 正の偶数整数に対する zeta 関数を計算する
	 * @param exponent - 偶数整数の指数
	 * @param precision - 精度
	 * @returns zeta(exponent)
	 */
	protected static _zetaPositiveEvenInteger(exponent: bigint, precision: bigint): bigint;
	/**
	 * 負の整数に対する zeta 関数を計算する
	 * @param absoluteInteger - 負の整数の絶対値
	 * @param precision - 精度
	 * @returns zeta(-absoluteInteger)
	 */
	protected static _zetaNegativeInteger(absoluteInteger: bigint, precision: bigint): bigint;
	/**
	 * Euler-Maclaurin 展開で zeta 関数を近似する
	 * @param s - 値
	 * @param precision - 精度
	 * @param terms - 直接和を取る項数
	 * @returns zeta(s) の近似値
	 */
	protected static _zetaEulerMaclaurinEstimate(s: bigint, precision: bigint, terms: number): bigint;
	/**
	 * s > 1 に対する zeta 関数を計算する
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s <= 1 の場合
	 */
	protected static _zetaPositive(s: bigint, precision: bigint): bigint;
	/**
	 * Dirichlet eta 関数を Euler 変換で計算して zeta 関数へ変換する
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s === 1 の場合
	 */
	protected static _zetaEta(s: bigint, precision: bigint): bigint;
	/**
	 * Riemann zeta 関数を計算する (内部用)
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s = 1 の場合
	 */
	protected static _zeta(s: bigint, precision: bigint): bigint;
	/**
	 * ガンマ関数をStirlingの近似で計算する (内部用)
	 * @param z - 値
	 * @param precision - 精度
	 * @returns ガンマ関数
	 * @throws {RangeError} 負の整数の場合
	 */
	protected static _gammaLanczos(z: bigint, precision: bigint): bigint;
	/**
	 * ガンマ関数を計算する
	 * @returns ガンマ関数
	 */
	gamma(): BigFloat;
	/**
	 * Riemann zeta 関数を計算する
	 * @returns zeta(this)
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 */
	zeta(): BigFloat;
	/**
	 * 階乗を計算する (内部用)
	 * @param n - 値
	 * @returns 階乗
	 */
	protected static _factorial(n: bigint): bigint;
	/**
	 * ガンマ関数を用いた階乗を計算する (内部用)
	 * @param n - 値
	 * @param precision - 精度
	 * @returns 階乗
	 */
	protected static _factorialGamma(n: bigint, precision: bigint): bigint;
	/**
	 * 階乗を計算する
	 * @returns 階乗
	 */
	factorial(): BigFloat;
	/**
	 * 二項係数を計算する (内部用)
	 * @param n - 全体数
	 * @param k - 選択数
	 * @returns 二項係数
	 */
	protected static _binomial(n: bigint, k: bigint): bigint;
	/**
	 * 円周率キャッシュが存在するか確認する (内部用)
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckPiCache(precision: bigint): boolean;
	/**
	 * 円周率キャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getPiCache(precision: bigint): bigint;
	/**
	 * 円周率キャッシュを更新する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updatePiCache(value: bigint, precision: bigint): void;
	/**
	 * eキャッシュが存在するか確認する (内部用)
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckECache(precision: bigint): boolean;
	/**
	 * eキャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getECache(precision: bigint): bigint;
	/**
	 * eキャッシュを更新する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updateECache(value: bigint, precision: bigint): void;
	/**
	 * 円周率の低精度キャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns 低精度キャッシュ
	 */
	protected static _getPiSeedCache(precision: bigint): BigFloatCacheEntry | null;
	/**
	 * 対数キャッシュが存在するか確認する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckLnCache(key: string, precision: bigint): boolean;
	/**
	 * 対数キャッシュを取得する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getLnCache(key: string, precision: bigint): bigint;
	/**
	 * 対数キャッシュを更新する (内部用)
	 * @param key - キャッシュキー
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updateLnCache(key: string, value: bigint, precision: bigint): void;
	/**
	 * 対数の低精度キャッシュを取得する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns 低精度キャッシュ
	 */
	protected static _getLnSeedCache(key: string, precision: bigint): BigFloatCacheEntry | null;
	/**
	 * キャッシュ値を別精度へ変換する
	 * @param value - 値
	 * @param fromPrecision - 元の精度
	 * @param toPrecision - 変換先の精度
	 * @returns 変換後の値
	 */
	protected static _rescaleInternalValue(value: bigint, fromPrecision: bigint, toPrecision: bigint): bigint;
	/**
	 * キャッシュされたpiを高精度へ補正する (Newton法を使用)
	 * @param seed - 低精度キャッシュ
	 * @param precision - 必要精度
	 * @returns 高精度化したpi
	 */
	protected static _refinePiFromCache(seed: BigFloatCacheEntry, precision: bigint): bigint;
	/**
	 * キャッシュされた対数定数を高精度へ補正する
	 * @param value - 対数を取る対象
	 * @param seed - 低精度キャッシュ
	 * @param precision - 必要精度
	 * @returns 高精度化した対数定数
	 */
	protected static _refineLogConstantFromCache(value: bigint, seed: BigFloatCacheEntry, precision: bigint): bigint;
	/**
	 * 5の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 5^n
	 */
	protected static _getPow5(n: bigint): bigint;
	/**
	 * 2の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 2^n
	 */
	protected static _getPow2(n: bigint): bigint;
	/**
	 * 10の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 10^n
	 */
	protected static _getPow10(n: bigint): bigint;
	/**
	 * 定数 NaN を取得する
	 * @param precision - 精度
	 * @returns NaN
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	static nan(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 Infinity を取得する
	 * @param precision - 精度
	 * @returns Infinity
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	static infinity(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -Infinity を取得する
	 * @param precision - 精度
	 * @returns -Infinity
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	static negativeInfinity(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -10 を取得する
	 * @param precision - 精度
	 * @returns -10
	 */
	static minusTen(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -2 を取得する
	 * @param precision - 精度
	 * @returns -2
	 */
	static minusTwo(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -1 を取得する
	 * @param precision - 精度
	 * @returns -1
	 */
	static minusOne(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 0 を取得する
	 * @param precision - 精度
	 * @returns 0
	 */
	static zero(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 0.25 を取得する
	 * @param precision - 精度
	 * @returns 0.25
	 */
	static quarter(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 0.5 を取得する
	 * @param precision - 精度
	 * @returns 0.5
	 */
	static half(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 1 を取得する
	 * @param precision - 精度
	 * @returns 1
	 */
	static one(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 2 を取得する
	 * @param precision - 精度
	 * @returns 2
	 */
	static two(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 10 を取得する
	 * @param precision - 精度
	 * @returns 10
	 */
	static ten(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 100 を取得する
	 * @param precision - 精度
	 * @returns 100
	 */
	static hundred(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 1000 を取得する
	 * @param precision - 精度
	 * @returns 1000
	 */
	static thousand(precision?: PrecisionValue): BigFloat;
}
/**
 * BigFloat を作成する
 * @param value - 初期値
 * @param precision - 精度
 * @returns BigFloat インスタンス
 */
export declare function bigFloat(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
export type BigFloatMatrixRowSource = Iterable<BigFloatValue>;
export type BigFloatMatrixSource = Iterable<BigFloatMatrixRowSource>;
export type BigFloatMatrixOperand = BigFloatMatrix | BigFloatMatrixSource;
export type BigFloatMatrixRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};
/**
 * BigFloat を固定長行列として扱うクラス
 */
export declare class BigFloatMatrix implements Iterable<BigFloatVector> {
	/**
	 * 内部要素 (行ごとの配列)
	 */
	protected _values: BigFloat[][];
	/**
	 * BigFloatMatrix コンストラクタ
	 * @param rows - 行列要素の反復可能オブジェクト
	 * @param precision - 変換時の精度
	 * @throws {RangeError} 行列の行が同じ長さを持たない場合
	 */
	constructor(rows?: BigFloatMatrixSource, precision?: PrecisionValue);
	/**
	 * 内部配列から行列を生成する (内部用)
	 * @param values - BigFloat の二次元配列
	 * @returns BigFloatMatrix インスタンス
	 */
	protected static _fromBigFloatGrid(values: BigFloat[][]): BigFloatMatrix;
	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象の値
	 * @param precision - 精度
	 * @returns BigFloat インスタンス
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatValue[], precision?: PrecisionValue): bigint;
	/**
	 * 次元を正規化する
	 * @throws {RangeError} size が負または非有限の場合
	 */
	protected static _normalizeSize(size: number, name: string): number;
	/**
	 * 生配列が長方形か検証する
	 * @throws {RangeError} 行列の行が同じ長さを持たない場合
	 */
	protected static _assertRectangularRaw(rows: BigFloatValue[][]): void;
	/**
	 * 同形状か検証する
	 * @throws {RangeError} 行列の形状が異なる場合
	 */
	protected static _assertSameShape(left: BigFloatMatrix, right: BigFloatMatrix): void;
	/**
	 * 正方行列か検証する
	 * @throws {RangeError} 行列が正方行列でない場合
	 */
	protected static _assertSquare(matrix: BigFloatMatrix): void;
	/**
	 * 行列積可能か検証する
	 * @throws {RangeError} 行列の内積次元が一致しない場合
	 */
	protected static _assertMultipliable(left: BigFloatMatrix, right: BigFloatMatrix): void;
	/**
	 * 指定された精度の微小値 (10^-precision) を返す (内部用)
	 * @param precision - 精度
	 * @returns 微小値
	 */
	protected static _epsilon(precision: bigint): BigFloat;
	/**
	 * 任意入力を BigFloatMatrix へ変換する (内部用)
	 * @param value - 変換対象
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns BigFloatMatrix インスタンス
	 */
	protected static _coerceMatrix(value: BigFloatMatrixOperand, referenceValues?: BigFloatValue[]): BigFloatMatrix;
	/**
	 * 任意入力を BigFloatVector へ変換する (内部用)
	 * @param value - 変換対象
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns BigFloatVector インスタンス
	 */
	protected static _coerceVector(value: BigFloatVector | Iterable<BigFloatValue>, referenceValues?: BigFloatValue[]): BigFloatVector;
	/**
	 * 全要素を一次元配列として取得する (内部用)
	 * @returns 要素の平坦化配列
	 */
	protected _flattenValues(): BigFloat[];
	/**
	 * 全要素に対して変換関数を適用した新しい行列を返す (内部用)
	 * @param fn - 変換関数
	 * @returns 変換後の新しい行列
	 */
	protected _mapValues(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this;
	/**
	 * オペランドとの二項演算を全要素に対して行う (内部用)
	 * @param other - 行列またはスカラ値
	 * @param fn - 二項演算関数
	 * @returns 演算後の新しい行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 */
	protected _mapWithOperand(other: BigFloatMatrixOperand | BigFloatValue, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this;
	/**
	 * 行列の簡約階段形式 (RREF) を計算する (内部用)
	 * @param values - 対象行列の二次元配列
	 * @param leftColumnCount - 掃き出し対象の列数
	 * @returns RREF 後の配列と主成分(ピボット)列のインデックス
	 */
	protected static _reducedRowEchelon(values: BigFloat[][], leftColumnCount?: number): {
		values: BigFloat[][];
		pivotColumns: number[];
	};
	/**
	 * 空の行列 (0x0) を生成する
	 * @returns 空の行列
	 */
	static empty(): BigFloatMatrix;
	/**
	 * 行列要素の反復可能オブジェクトから BigFloatMatrix を生成する
	 * @param rows - 要素
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static from(rows: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 行ベクトルのリストから行列を生成する
	 * @param rows - 行要素
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static fromRows(rows: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 列ベクトル群から生成する
	 * @throws {RangeError} 列ベクトルの長さが異なる場合
	 */
	static fromColumns(columns: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 行配列の可変長引数から行列を生成する
	 * @param rows - 各行の要素配列
	 * @returns BigFloatMatrix インスタンス
	 */
	static of(...rows: BigFloatValue[][]): BigFloatMatrix;
	/**
	 * 指定した値で埋められた行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static fill(rowCount: number, columnCount: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 零行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * すべての要素が 1 の行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 単位行列を生成する
	 * @param size - 次元数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static identity(size: number, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 対角要素を指定して対角行列を生成する
	 * @param values - 対角要素のリスト
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static diagonal(values: Iterable<BigFloatValue>, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 乱数行列を生成する
	 * @throws {RangeError} max < min の場合
	 */
	static random(rowCount: number, columnCount: number, options?: BigFloatMatrixRandomOptions): BigFloatMatrix;
	/**
	 * 行数を取得する
	 */
	get rowCount(): number;
	/**
	 * 列数を取得する
	 */
	get columnCount(): number;
	/**
	 * 行列の形状 (行数と列数) を配列として取得する
	 * @returns [行数, 列数]
	 */
	shape(): [
		number,
		number
	];
	/**
	 * 行列が空 (次元が 0) かどうかを判定する
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 正方行列かどうかを判定する
	 * @returns 正方行列なら true
	 */
	isSquare(): boolean;
	/**
	 * 指定したインデックスの要素を取得する (複製)
	 * @param row - 行インデックス
	 * @param column - 列インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 */
	at(row: number, column: number): BigFloat | undefined;
	/**
	 * 指定した行を取得する
	 * @param index - 行インデックス
	 * @returns 指定行のベクトル、インデックスが範囲外の場合は undefined
	 */
	row(index: number): BigFloatVector | undefined;
	/**
	 * 指定した列を取得する
	 * @param index - 列インデックス
	 * @returns 指定列のベクトル、インデックスが範囲外の場合は undefined
	 */
	column(index: number): BigFloatVector | undefined;
	/**
	 * 対角成分を取得する
	 * @returns 対角成分のベクトル
	 * @throws {RangeError} 正方行列でない場合
	 */
	diagonalVector(): BigFloatVector;
	/**
	 * 行列を複製する
	 * @returns 複製された BigFloatMatrix
	 */
	clone(): BigFloatMatrix;
	/**
	 * 二次元配列へ変換する
	 * @returns 各要素が BigFloat の二次元配列
	 */
	toArray(): BigFloat[][];
	/**
	 * 行ごとのベクトルの配列へ変換する
	 * @returns BigFloatVector の配列
	 */
	toVectors(): BigFloatVector[];
	/**
	 * 行列を平坦化したベクトルへ変換する
	 * @returns 行列の全要素を持つ BigFloatVector
	 */
	flatten(): BigFloatVector;
	/**
	 * 全要素を流すストリームへ変換する
	 * @returns BigFloatStream インスタンス
	 */
	toStream(): BigFloatStream;
	/**
	 * 行ベクトルを順に反復するイテレータを取得する
	 * @returns 行ベクトルのイテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloatVector, void, undefined>;
	/**
	 * 各要素に対して関数を実行する
	 * @param fn - 実行する関数
	 */
	forEach(fn: (value: BigFloat, row: number, column: number) => void): void;
	/**
	 * 各要素を変換した新しい行列を取得する
	 * @param fn - 変換関数
	 * @returns 変換後の新しい行列
	 */
	map(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this;
	/**
	 * 別の行列と要素ごとに対になる変換を行い、新しい行列を取得する
	 * @param other - 対象行列
	 * @param fn - 変換関数
	 * @returns 変換後の新しい行列
	 */
	zipMap(other: BigFloatMatrixOperand, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this;
	/**
	 * 全要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 */
	reduce<U>(fn: (acc: U, value: BigFloat, row: number, column: number) => U, initial: U): U;
	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	some(fn: (value: BigFloat, row: number, column: number) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすかどうかを判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	every(fn: (value: BigFloat, row: number, column: number) => boolean): boolean;
	/**
	 * 行方向に連結する
	 * @throws {RangeError} 列数が一致しない場合
	 */
	concatRows(...others: BigFloatMatrixOperand[]): this;
	/**
	 * 列方向に連結する
	 * @throws {RangeError} 行数が一致しない場合
	 */
	concatColumns(...others: BigFloatMatrixOperand[]): this;
	/**
	 * 行の一部を抽出した新しい行列を返す
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 */
	sliceRows(start?: number, end?: number): this;
	/**
	 * 列の一部を抽出した新しい行列を返す
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 */
	sliceColumns(start?: number, end?: number): this;
	/**
	 * 転置行列を取得する
	 * @returns 転置された新しい行列
	 */
	transpose(): this;
	/**
	 * 別の行列と内容が等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 */
	equals(other: BigFloatMatrixOperand): boolean;
	/**
	 * すべての要素の精度を変更した新しい行列を取得する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しい行列
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * 各要素に別の行列またはスカラ値を加算した新しい行列を取得する
	 * @param other - 加算する行列または数値
	 * @returns 加算後の新しい行列
	 */
	add(other: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 各要素から別の行列またはスカラ値を減算した新しい行列を取得する
	 * @param other - 減算する行列または数値
	 * @returns 減算後の新しい行列
	 */
	sub(other: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 各要素にスカラ値を乗算した新しい行列を取得する
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しい行列
	 */
	mul(scalar: BigFloatValue): this;
	/**
	 * 各要素をスカラ値で除算した新しい行列を取得する
	 * @param scalar - 除数
	 * @returns 除算後の新しい行列
	 */
	div(scalar: BigFloatValue): this;
	/**
	 * 各要素に対して剰余演算を行った新しい行列を取得する
	 * @param other - 法
	 * @returns 演算後の新しい行列
	 */
	mod(other: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 別の行列とのアダマール積 (要素ごとの積) を計算する
	 * @param other - 対象行列
	 * @returns アダマール積の結果の行列
	 */
	hadamard(other: BigFloatMatrixOperand): this;
	/**
	 * 各要素の符号を反転させた新しい行列を取得する
	 * @returns 符号反転後の新しい行列
	 */
	neg(): this;
	/**
	 * 各要素を絶対値にした新しい行列を取得する
	 * @returns 絶対値適用後の新しい行列
	 */
	abs(): this;
	/**
	 * 各要素の符号 (1, 0, -1) を持つ行列を取得する
	 * @returns 符号行列
	 */
	sign(): this;
	/**
	 * 各要素の逆数を持つ行列を取得する
	 * @returns 逆数行列
	 */
	reciprocal(): this;
	/**
	 * 各要素を指定した指数で冪乗した新しい行列を取得する
	 * @param exponent - 指数
	 * @returns 冪乗後の新しい行列
	 */
	pow(exponent: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 各要素の平方根を計算した新しい行列を取得する
	 * @returns 平方根適用後の新しい行列
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算した新しい行列を取得する
	 * @returns 立方根適用後の新しい行列
	 */
	cbrt(): this;
	/**
	 * 各要素の n 乗根を計算した新しい行列を取得する
	 * @param n - 指数
	 * @returns n 乗根適用後の新しい行列
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理した新しい行列を取得する
	 * @returns 床関数適用後の新しい行列
	 */
	floor(): this;
	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理した新しい行列を取得する
	 * @returns 天井関数適用後の新しい行列
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入した新しい行列を取得する
	 * @returns 四捨五入後の新しい行列
	 */
	round(): this;
	/**
	 * 各要素を 0 方向に切り捨てた新しい行列を取得する
	 * @returns 切り捨て後の新しい行列
	 */
	trunc(): this;
	/**
	 * 各要素を Float32 精度に丸めた新しい行列を取得する
	 * @returns 丸め後の新しい行列
	 */
	fround(): this;
	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えた行列を取得する
	 * @returns 結果の行列
	 */
	clz32(): this;
	/**
	 * 別の行列または数値との相対差を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 相対差の行列
	 */
	relativeDiff(other: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 別の行列または数値との絶対差を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 絶対差の行列
	 */
	absoluteDiff(other: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 別の行列または数値との百分率差分を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 百分率差分の行列 (%)
	 */
	percentDiff(other: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 各要素の正弦 (sin) を計算した行列を取得する
	 * @returns sin 適用後の行列
	 */
	sin(): this;
	/**
	 * 各要素の余弦 (cos) を計算した行列を取得する
	 * @returns cos 適用後の行列
	 */
	cos(): this;
	/**
	 * 各要素の正接 (tan) を計算した行列を取得する
	 * @returns tan 適用後の行列
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦 (asin) を計算した行列を取得する
	 * @returns asin 適用後の行列
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦 (acos) を計算した行列を取得する
	 * @returns acos 適用後の行列
	 */
	acos(): this;
	/**
	 * 各要素の逆正接 (atan) を計算した行列を取得する
	 * @returns atan 適用後の行列
	 */
	atan(): this;
	/**
	 * 各要素に対して atan2 を計算した行列を取得する
	 * @param x - x 座標の行列または数値
	 * @returns atan2 適用後の行列
	 */
	atan2(x: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 各要素の双曲線正弦 (sinh) を計算した行列を取得する
	 * @returns sinh 適用後の行列
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦 (cosh) を計算した行列を取得する
	 * @returns cosh 適用後の行列
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接 (tanh) を計算した行列を取得する
	 * @returns tanh 適用後の行列
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算した行列を取得する
	 * @returns asinh 適用後の行列
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算した行列を取得する
	 * @returns acosh 適用後の行列
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接 (atanh) を計算した行列を取得する
	 * @returns atanh 適用後の行列
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数 (exp) を計算した行列を取得する
	 * @returns exp 適用後の行列
	 */
	exp(): this;
	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算した行列を取得する
	 * @returns exp2 適用後の行列
	 */
	exp2(): this;
	/**
	 * 各要素に対して exp(x) - 1 を計算した行列を取得する
	 * @returns expm1 適用後の行列
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数 (ln) を計算した行列を取得する
	 * @returns ln 適用後の行列
	 */
	ln(): this;
	/**
	 * 各要素の任意の底による対数を計算した行列を取得する
	 * @param base - 底
	 * @returns 対数計算後の行列
	 */
	log(base: BigFloatValue | BigFloatMatrixOperand): this;
	/**
	 * 各要素の底を 2 とする対数を計算した行列を取得する
	 * @returns log2 適用後の行列
	 */
	log2(): this;
	/**
	 * 各要素の常用対数 (log10) を計算した行列を取得する
	 * @returns log10 適用後の行列
	 */
	log10(): this;
	/**
	 * 各要素に対して ln(1 + x) を計算した行列を取得する
	 * @returns log1p 適用後の行列
	 */
	log1p(): this;
	/**
	 * 各要素に対してガンマ関数を計算した行列を取得する
	 * @returns ガンマ関数適用後の行列
	 */
	gamma(): this;
	/**
	 * 各要素に対してリーマンゼータ関数を計算した行列を取得する
	 * @returns ゼータ関数適用後の行列
	 */
	zeta(): this;
	/**
	 * 各要素に対して階乗を計算した行列を取得する
	 * @returns 階乗適用後の行列
	 */
	factorial(): this;
	/**
	 * 最大値を返す
	 * @throws {TypeError} 行列が空の場合
	 */
	max(): BigFloat;
	/**
	 * 最小値を返す
	 * @throws {TypeError} 行列が空の場合
	 */
	min(): BigFloat;
	/**
	 * 全要素の合計を計算する
	 * @returns 合計
	 */
	sum(): BigFloat;
	/**
	 * 全要素の積を計算する
	 * @returns 総乗
	 */
	product(): BigFloat;
	/**
	 * 全要素の平均を計算する
	 * @returns 平均
	 */
	average(): BigFloat;
	/**
	 * 行ごとの合計を計算する
	 * @returns 各行の和を持つベクトル
	 */
	rowSums(): BigFloatVector;
	/**
	 * 列ごとの合計を計算する
	 * @returns 各列の和を持つベクトル
	 */
	columnSums(): BigFloatVector;
	/**
	 * 行列のトレース (対角成分の和) を計算する
	 * @returns トレース
	 * @throws {RangeError} 正方行列でない場合
	 */
	trace(): BigFloat;
	/**
	 * フロベニウスノルムを計算する
	 * @returns フロベニウスノルム
	 */
	frobeniusNorm(): BigFloat;
	/**
	 * 別の行列との行列積を計算する
	 * @param other - 乗じる行列
	 * @returns 行列積の結果
	 * @throws {RangeError} 内積次元が一致しない場合
	 */
	matmul(other: BigFloatMatrixOperand): this;
	/**
	 * ベクトル積を計算する
	 * @throws {RangeError} 内部次元が一致しない場合
	 */
	mulVector(vector: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector;
	/**
	 * 行列式を計算する
	 * @returns 行列式の値
	 * @throws {RangeError} 正方行列でない場合
	 */
	determinant(): BigFloat;
	/**
	 * 行列のランク (階数) を計算する
	 * @returns ランク
	 */
	rank(): number;
	/**
	 * 逆行列を計算する
	 * @returns 逆行列
	 * @throws {RangeError} 正方行列でない場合、または行列が特異な場合
	 */
	inverse(): this;
	/**
	 * 連立方程式 Ax = b を解く
	 * @param rhs - 右辺ベクトル b
	 * @returns 解ベクトル x
	 * @throws {RangeError} 行列が正方でない場合、ベクトル長が不一致な場合、または行列が特異な場合
	 */
	solveVector(rhs: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector;
	/**
	 * 連立方程式 AX = B を解く
	 * @param rhs - 右辺行列 B
	 * @returns 解行列 X
	 * @throws {RangeError} 行列が正方でない場合、行数が不一致な場合、または行列が特異な場合
	 */
	solveMatrix(rhs: BigFloatMatrixOperand): this;
	/**
	 * 行列の累乗 A^exponent を計算する
	 * @param exponent - 指数 (整数)
	 * @returns 演算結果
	 * @throws {RangeError} 正方行列でない場合、または指数が整数でない場合
	 */
	matrixPow(exponent: number): this;
}
/**
 * BigFloat ライブラリ共通の基底エラークラス
 */
export declare class BigFloatError extends Error {
	/**
	 * BigFloatError コンストラクタ
	 * @param message - エラーメッセージ
	 * @param options - エラーオプション
	 */
	constructor(message?: string, options?: ErrorOptions);
}
/**
 * 特殊値が無効な設定で特殊値を扱おうとした場合のエラー
 */
export declare class SpecialValuesDisabledError extends BigFloatError {
}
/**
 * 精度不一致が許容されていない場合のエラー
 */
export declare class PrecisionMismatchError extends BigFloatError {
}
/**
 * BigFloat 上でゼロ除算が発生した場合のエラー
 */
export declare class DivisionByZeroError extends BigFloatError {
}
/**
 * 数値計算中に安定した結果を導けない場合のエラー
 */
export declare class NumericalComputationError extends BigFloatError {
}
/**
 * 必須キャッシュが初期化されていない場合のエラー
 */
export declare class CacheNotInitializedError extends BigFloatError {
}

export {};
