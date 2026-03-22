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
	/** 精度の不一致を許容するかどうか */
	allowPrecisionMismatch?: boolean;
	/** BigFloatComplex との相互運用を許容するかどうか */
	allowComplexNumbers?: boolean;
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
 * BigFloat-specific Stream (Lazy List)
 */
export declare class BigFloatStream implements Iterable<BigFloat> {
	/** mapステージ定義 */
	private static readonly _mapStageDefinition;
	/** filterステージ定義 */
	private static readonly _filterStageDefinition;
	/** peekステージ定義 */
	private static readonly _peekStageDefinition;
	/** flatMapステージ定義 */
	private static readonly _flatMapStageDefinition;
	/** distinctステージ定義 */
	private static readonly _distinctStageDefinition;
	/** limitステージ定義 */
	private static readonly _limitStageDefinition;
	/** skipステージ定義 */
	private static readonly _skipStageDefinition;
	/** 内部イテレータファクトリ */
	private _sourceFactory;
	/** 直前のストリーム */
	private _previousStream;
	/** 現在のステージ定義 */
	private _stageDefinition;
	/** 現在のステージデータ */
	private _stageData;
	/**
	 * @param source - BigFloatの反復可能オブジェクト
	 */
	constructor(source: Iterable<BigFloat> | BigFloatStreamFactory);
	/**
	 * 内部状態からストリームを生成する
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns BigFloatStream
	 */
	protected static _fromState(sourceFactory: BigFloatStreamFactory, previousStream: BigFloatStream | null, stageDefinition: BigFloatStreamStageDefinition | null, stageData: unknown): BigFloatStream;
	/**
	 * 値をBigFloatへ変換する
	 * @param value - 変換する値
	 * @param precision - 精度
	 * @returns BigFloat
	 */
	protected static _toBigFloat(value: BigFloatStreamValue, precision?: bigint): BigFloat;
	/**
	 * 値をBigFloatのイテレータに変換する
	 * @param iterable - 変換する反復可能オブジェクト
	 * @param precision - 精度
	 * @returns BigFloatのイテレータ
	 */
	protected static _toIterator(iterable: Iterable<BigFloatStreamValue>, precision?: bigint): IterableIterator<BigFloat, void, undefined>;
	/**
	 * ストリームの精度を解決する
	 * @param values - 値
	 * @param precision - 明示精度
	 * @returns 精度
	 */
	protected static _resolvePrecision(values: BigFloatStreamValue[], precision?: PrecisionValue): bigint;
	/**
	 * 要素数を正規化する
	 * @param count - 要素数
	 * @returns 正規化された要素数
	 * @throws {RangeError} 要素数が不正な場合
	 */
	protected static _normalizeCount(count: number): number;
	/**
	 * 空のストリームを生成する
	 * @returns 空のストリーム
	 */
	static empty(): BigFloatStream;
	/**
	 * 反復可能オブジェクトからBigFloatStreamを作成する
	 * @param iterable - BigFloatの反復可能オブジェクト
	 * @param precision - 変換時の精度
	 * @returns BigFloatStreamインスタンス
	 */
	static from(iterable: Iterable<BigFloatStreamValue>, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 値のリストからBigFloatStreamを作成する
	 * @param values - 値のリスト
	 * @returns BigFloatStreamインスタンス
	 */
	static of(...values: BigFloatStreamValue[]): BigFloatStream;
	/**
	 * 等差数列を生成する
	 * @param start - 初項
	 * @param step - 公差
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static arithmetic(start: BigFloatStreamValue, step: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 等比数列を生成する
	 * @param start - 初項
	 * @param ratio - 公比
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static geometric(start: BigFloatStreamValue, ratio: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 指定個数で等間隔な値を生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static linspace(start: BigFloatStreamValue, end: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 10を底とする対数間隔の値を生成する
	 * @param start - 開始指数
	 * @param end - 終了指数
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static logspace(start: BigFloatStreamValue, end: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 調和級数を生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static harmonic(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 乱数列を生成する
	 * @param count - 要素数
	 * @param options - 生成オプション
	 * @returns BigFloatStreamインスタンス
	 * @throws {RangeError} optionsの範囲が不正な場合
	 */
	static random(count: number, options?: BigFloatStreamRandomOptions): BigFloatStream;
	/**
	 * 同じ値を繰り返す
	 * @param value - 繰り返す値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static repeat(value: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * フィボナッチ数列を生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static fibonacci(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 階乗列を生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	static factorial(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 範囲を生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param step - ステップ
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 * @throws {RangeError} stepが0の場合
	 */
	static range(start: BigFloatStreamValue, end?: BigFloatStreamValue, step?: BigFloatStreamValue, precision?: PrecisionValue): BigFloatStream;
	/**
	 * ストリームを複製する
	 * @returns 複製されたストリーム
	 */
	clone(): BigFloatStream;
	/**
	 * 現在の状態を引き継いだストリームを生成する
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns 新しいストリーム
	 */
	protected _fork(sourceFactory?: BigFloatStreamFactory, previousStream?: BigFloatStream | null, stageDefinition?: BigFloatStreamStageDefinition | null, stageData?: unknown): this;
	/**
	 * パイプラインステージを追加する
	 * @param stage - ステージ
	 * @returns 新しいストリーム
	 */
	protected _use(stage: BigFloatStreamStage): this;
	/**
	 * パイプラインを配列化する
	 * @returns ステージ配列
	 */
	protected _collectPipelineStages(): BigFloatStreamStage[];
	/**
	 * 各要素を変換する
	 * @param fn - 変換関数
	 * @returns 変換されたストリーム
	 */
	map(fn: (item: BigFloat) => BigFloat): this;
	/**
	 * 要素をフィルタリングする
	 * @param fn - 判定関数
	 * @returns フィルタリングされたストリーム
	 */
	filter(fn: (item: BigFloat) => boolean): this;
	/**
	 * 要素を平坦化して変換する
	 * @param fn - 変換関数
	 * @returns 平坦化されたストリーム
	 */
	flatMap(fn: (item: BigFloat) => Iterable<BigFloatStreamValue>): this;
	/**
	 * 重複を除去する
	 * @param keyFn - キー生成関数
	 * @returns 重複が除去されたストリーム
	 */
	distinct(keyFn?: (item: BigFloat) => unknown): this;
	/**
	 * 要素をソートする (終端操作ではないが、全要素を内部で保持する)
	 * @param compareFn - 比較関数
	 * @returns ソートされたストリーム
	 */
	sorted(compareFn?: (a: BigFloat, b: BigFloat) => number): this;
	/**
	 * 各要素に対してアクションを実行する (ストリームは維持)
	 * @param fn - アクション関数
	 * @returns 自身
	 */
	peek(fn: (item: BigFloat) => void): this;
	/**
	 * 各要素に対してアクションを実行する (ストリームは維持)
	 * @param fn - アクション関数
	 * @returns 自身
	 */
	tap(fn: (item: BigFloat) => void): this;
	/**
	 * 要素数を制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	limit(n: number): this;
	/**
	 * 要素数を制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	take(n: number): this;
	/**
	 * 指定した要素数をスキップする
	 * @param n - スキップする数
	 * @returns スキップされたストリーム
	 */
	skip(n: number): this;
	/**
	 * 指定した要素数をスキップする
	 * @param n - スキップする数
	 * @returns スキップされたストリーム
	 */
	drop(n: number): this;
	/**
	 * 末尾にストリームを連結する
	 * @param iterables - 連結するストリーム
	 * @returns 連結後のストリーム
	 */
	concat(...iterables: Iterable<BigFloatStreamValue>[]): this;
	/**
	 * イテレータの実装
	 * @returns イテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/**
	 * 各要素に対して処理を実行する (終端操作)
	 * @param fn - 処理関数
	 */
	forEach(fn: (item: BigFloat) => void): void;
	/**
	 * 配列に変換する (終端操作)
	 * @returns 要素の配列
	 */
	toArray(): BigFloat[];
	/**
	 * 配列に変換する (終端操作)
	 * @returns 要素の配列
	 */
	collect(): BigFloat[];
	/**
	 * 畳み込み処理を行う (終端操作)
	 * @param fn - 畳み込み関数
	 * @param initial - 初期値
	 * @returns 畳み込み結果
	 */
	reduce<U>(fn: (acc: U, item: BigFloat) => U, initial: U): U;
	/**
	 * 要素数をカウントする (終端操作)
	 * @returns 要素数
	 */
	count(): number;
	/**
	 * ストリームが空かどうか判定する
	 * @returns 空ならtrue
	 */
	isEmpty(): boolean;
	/**
	 * いずれかの要素が条件を満たすか判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns 満たす要素があればtrue
	 */
	some(fn: (item: BigFloat) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすか判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns すべて満たせばtrue
	 */
	every(fn: (item: BigFloat) => boolean): boolean;
	/**
	 * 条件に一致する最初の要素を返す (終端操作)
	 * @param fn - 判定関数
	 * @returns 条件に一致した要素、存在しない場合はundefined
	 */
	find(fn: (item: BigFloat) => boolean): BigFloat | undefined;
	/**
	 * 最初の要素を返す (終端操作)
	 * @returns 最初の要素、空の場合はundefined
	 */
	findFirst(): BigFloat | undefined;
	/**
	 * 最初の要素を返す (終端操作)
	 * @returns 最初の要素、空の場合はundefined
	 */
	first(): BigFloat | undefined;
	/**
	 * 指定位置の要素を返す (終端操作)
	 * @param index - インデックス
	 * @returns 要素、存在しない場合はundefined
	 */
	at(index: number): BigFloat | undefined;
	/**
	 * すべての要素の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更されたストリーム
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * 各要素と指定値の相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差を要素ごとに計算したストリーム
	 */
	relativeDiff(other: BigFloatValue): this;
	/**
	 * 各要素と指定値の絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差を要素ごとに計算したストリーム
	 */
	absoluteDiff(other: BigFloatValue): this;
	/**
	 * 各要素と指定値の百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分を要素ごとに計算したストリーム
	 */
	percentDiff(other: BigFloatValue): this;
	/**
	 * 各要素に加算する
	 * @param other - 加算する値
	 * @returns 加算後のストリーム
	 */
	add(other: BigFloatValue): this;
	/**
	 * 各要素から減算する
	 * @param other - 減算する値
	 * @returns 減算後のストリーム
	 */
	sub(other: BigFloatValue): this;
	/**
	 * 各要素に乗算する
	 * @param other - 乗算する値
	 * @returns 乗算後のストリーム
	 */
	mul(other: BigFloatValue): this;
	/**
	 * 各要素を除算する
	 * @param other - 除算する値
	 * @returns 除算後のストリーム
	 */
	div(other: BigFloatValue): this;
	/**
	 * 各要素の剰余を計算する
	 * @param other - 法
	 * @returns 剰余後のストリーム
	 */
	mod(other: BigFloatValue): this;
	/**
	 * 各要素の符号を反転させる
	 * @returns 反転後のストリーム
	 */
	neg(): this;
	/**
	 * 各要素の絶対値を取得する
	 * @returns 絶対値後のストリーム
	 */
	abs(): this;
	/**
	 * 各要素の符号を取得する
	 * @returns 符号後のストリーム
	 */
	sign(): this;
	/**
	 * 各要素の逆数を取得する
	 * @returns 逆数後のストリーム
	 */
	reciprocal(): this;
	/**
	 * 各要素の冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗後のストリーム
	 */
	pow(exponent: BigFloatValue): this;
	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根後のストリーム
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根後のストリーム
	 */
	cbrt(): this;
	/**
	 * 各要素のn乗根を計算する
	 * @param n - 指数
	 * @returns n乗根後のストリーム
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素を切り下げる
	 * @returns 切り下げ後のストリーム
	 */
	floor(): this;
	/**
	 * 各要素を切り上げる
	 * @returns 切り上げ後のストリーム
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後のストリーム
	 */
	round(): this;
	/**
	 * 各要素を0方向へ切り捨てる
	 * @returns 切り捨て後のストリーム
	 */
	trunc(): this;
	/**
	 * 各要素をFloat32相当に丸める
	 * @returns Float32相当へ丸めたストリーム
	 */
	fround(): this;
	/**
	 * 各要素の先頭ゼロビット数を取得する
	 * @returns 先頭ゼロビット数のストリーム
	 */
	clz32(): this;
	/**
	 * 各要素の正弦を計算する
	 * @returns 正弦後のストリーム
	 */
	sin(): this;
	/**
	 * 各要素の余弦を計算する
	 * @returns 余弦後のストリーム
	 */
	cos(): this;
	/**
	 * 各要素の正接を計算する
	 * @returns 正接後のストリーム
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦を計算する
	 * @returns 逆正弦後のストリーム
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦を計算する
	 * @returns 逆余弦後のストリーム
	 */
	acos(): this;
	/**
	 * 各要素の逆正接を計算する
	 * @returns 逆正接後のストリーム
	 */
	atan(): this;
	/**
	 * 各要素と指定値から逆正接を計算する
	 * @param x - x座標
	 * @returns 逆正接後のストリーム
	 */
	atan2(x: BigFloatValue): this;
	/**
	 * 各要素の双曲線正弦を計算する
	 * @returns 双曲線正弦後のストリーム
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦を計算する
	 * @returns 双曲線余弦後のストリーム
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接を計算する
	 * @returns 双曲線正接後のストリーム
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦を計算する
	 * @returns 逆双曲線正弦後のストリーム
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦を計算する
	 * @returns 逆双曲線余弦後のストリーム
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接を計算する
	 * @returns 逆双曲線正接後のストリーム
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数を計算する
	 * @returns 指数関数適用後のストリーム
	 */
	exp(): this;
	/**
	 * 各要素の2冪指数関数を計算する
	 * @returns 2冪指数関数適用後のストリーム
	 */
	exp2(): this;
	/**
	 * 各要素のexp(x)-1を計算する
	 * @returns expm1適用後のストリーム
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数を計算する
	 * @returns 自然対数後のストリーム
	 */
	ln(): this;
	/**
	 * 各要素の任意底対数を計算する
	 * @param base - 底
	 * @returns 対数後のストリーム
	 */
	log(base: BigFloatValue): this;
	/**
	 * 各要素の底2対数を計算する
	 * @returns 底2対数後のストリーム
	 */
	log2(): this;
	/**
	 * 各要素の底10対数を計算する
	 * @returns 底10対数後のストリーム
	 */
	log10(): this;
	/**
	 * 各要素のlog(1+x)を計算する
	 * @returns log1p適用後のストリーム
	 */
	log1p(): this;
	/**
	 * 各要素のガンマ関数を計算する
	 * @returns ガンマ関数適用後のストリーム
	 */
	gamma(): this;
	/**
	 * 各要素のゼータ関数を計算する
	 * @returns ゼータ関数適用後のストリーム
	 */
	zeta(): this;
	/**
	 * 各要素の階乗を計算する
	 * @returns 階乗後のストリーム
	 */
	factorial(): this;
	/**
	 * 要素の最大値を返す (終端操作)
	 * @returns 最大値
	 * @throws {TypeError} 要素が存在しない場合
	 */
	max(): BigFloat;
	/**
	 * 要素の最小値を返す (終端操作)
	 * @returns 最小値
	 * @throws {TypeError} 要素が存在しない場合
	 */
	min(): BigFloat;
	/**
	 * 要素の合計を返す (終端操作)
	 * @returns 合計
	 */
	sum(): BigFloat;
	/**
	 * 要素の積を返す (終端操作)
	 * @returns 積
	 */
	product(): BigFloat;
	/**
	 * 要素の平均を返す (終端操作)
	 * @returns 平均
	 */
	average(): BigFloat;
	/**
	 * 要素の中央値を返す (終端操作)
	 * @returns 中央値
	 */
	median(): BigFloat;
	/**
	 * 要素の分散を返す (終端操作)
	 * @returns 分散
	 */
	variance(): BigFloat;
	/**
	 * 要素の標準偏差を返す (終端操作)
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
	/** 内部要素 */
	protected _values: BigFloat[];
	/**
	 * @param values - 要素列
	 * @param precision - 変換時の精度
	 */
	constructor(values?: BigFloatVectorSource, precision?: PrecisionValue);
	/**
	 * 内部配列からベクトルを生成する
	 * @param values - 内部所有済みの要素列
	 * @returns BigFloatVector
	 */
	protected static _fromBigFloatArray(values: BigFloat[]): BigFloatVector;
	/**
	 * 値をBigFloatへ変換する
	 * @param value - 変換対象
	 * @param precision - 明示精度
	 * @returns BigFloat
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/**
	 * 精度を解決する
	 * @param values - 値列
	 * @param precision - 明示精度
	 * @returns 解決済み精度
	 */
	protected static _resolvePrecision(values: BigFloatValue[], precision?: PrecisionValue): bigint;
	/**
	 * ベクトル長を正規化する
	 * @param length - ベクトル長
	 * @returns 正規化済みベクトル長
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
	 * 任意入力をベクトル化する
	 * @param value - ベクトルまたは要素列
	 * @returns BigFloatVector
	 */
	protected static _coerceVector(value: BigFloatVectorOperand, referenceValues?: BigFloatValue[]): BigFloatVector;
	/**
	 * 要素ごとの写像を行う
	 * @param fn - 変換関数
	 * @returns 変換後のベクトル
	 */
	protected _mapValues(fn: (value: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 要素ごとの二項演算を行う
	 * @param other - ベクトルまたはスカラ値
	 * @param fn - 変換関数
	 * @returns 演算後のベクトル
	 */
	protected _mapWithOperand(other: BigFloatVectorOperand | BigFloatValue, fn: (left: BigFloat, right: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 空ベクトルを生成する
	 * @returns 空ベクトル
	 */
	static empty(): BigFloatVector;
	/**
	 * 要素列からベクトルを生成する
	 * @param values - 要素列
	 * @param precision - 変換時の精度
	 * @returns BigFloatVector
	 */
	static from(values: BigFloatVectorSource, precision?: PrecisionValue): BigFloatVector;
	/**
	 * Stream からベクトルを生成する
	 * @param stream - 変換元ストリーム
	 * @returns BigFloatVector
	 */
	static fromStream(stream: BigFloatStream): BigFloatVector;
	/**
	 * 値の並びからベクトルを生成する
	 * @param values - 要素列
	 * @returns BigFloatVector
	 */
	static of(...values: BigFloatValue[]): BigFloatVector;
	/**
	 * 指定値で埋めたベクトルを生成する
	 * @param length - ベクトル長
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	static fill(length: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 0ベクトルを生成する
	 * @param length - ベクトル長
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	static zeros(length: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 1ベクトルを生成する
	 * @param length - ベクトル長
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	static ones(length: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 標準基底ベクトルを生成する
	 * @param length - ベクトル長
	 * @param index - 1を置く位置
	 * @param precision - 精度
	 * @returns BigFloatVector
	 * @throws {RangeError} index が範囲外の場合
	 */
	static basis(length: number, index: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 線形補間ベクトルを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatVector
	 */
	static linspace(start: BigFloatValue, end: BigFloatValue, count: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 乱数ベクトルを生成する
	 * @param length - ベクトル長
	 * @param options - 生成オプション
	 * @returns BigFloatVector
	 * @throws {RangeError} options.max < options.min の場合
	 */
	static random(length: number, options?: BigFloatVectorRandomOptions): BigFloatVector;
	/**
	 * ベクトル長
	 */
	get length(): number;
	/**
	 * ベクトルの次元数を返す
	 * @returns 次元数
	 */
	dimension(): number;
	/**
	 * 空ベクトルかどうか
	 * @returns 空ならtrue
	 */
	isEmpty(): boolean;
	/**
	 * 指定位置の値を取得する
	 * @param index - インデックス
	 * @returns 値またはundefined
	 */
	at(index: number): BigFloat | undefined;
	/**
	 * ベクトルを複製する
	 * @returns 複製されたベクトル
	 */
	clone(): BigFloatVector;
	/**
	 * 配列へ変換する
	 * @returns 要素配列
	 */
	toArray(): BigFloat[];
	/**
	 * Stream へ変換する
	 * @returns BigFloatStream
	 */
	toStream(): BigFloatStream;
	/**
	 * イテレータ
	 * @returns イテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/**
	 * 各要素に処理を適用する
	 * @param fn - 処理関数
	 */
	forEach(fn: (value: BigFloat, index: number) => void): void;
	/**
	 * 要素ごとに変換する
	 * @param fn - 変換関数
	 * @returns 変換後ベクトル
	 */
	map(fn: (value: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 2つのベクトルを要素ごとに変換する
	 * @param other - 対象ベクトル
	 * @param fn - 変換関数
	 * @returns 変換後ベクトル
	 */
	zipMap(other: BigFloatVectorOperand, fn: (left: BigFloat, right: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 畳み込み処理を行う
	 * @param fn - 畳み込み関数
	 * @param initial - 初期値
	 * @returns 畳み込み結果
	 */
	reduce<U>(fn: (acc: U, value: BigFloat, index: number) => U, initial: U): U;
	/**
	 * 条件に一致する要素があるか
	 * @param fn - 判定関数
	 * @returns 条件に一致する要素があればtrue
	 */
	some(fn: (value: BigFloat, index: number) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすか
	 * @param fn - 判定関数
	 * @returns すべて満たせばtrue
	 */
	every(fn: (value: BigFloat, index: number) => boolean): boolean;
	/**
	 * ベクトルを連結する
	 * @param others - 連結対象
	 * @returns 連結後ベクトル
	 */
	concat(...others: BigFloatVectorOperand[]): this;
	/**
	 * スライスする
	 * @param start - 開始位置
	 * @param end - 終了位置
	 * @returns スライス後ベクトル
	 */
	slice(start?: number, end?: number): this;
	/**
	 * 逆順にする
	 * @returns 逆順ベクトル
	 */
	reverse(): this;
	/**
	 * すべての要素の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度変更後ベクトル
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * ベクトル同士の一致判定
	 * @param other - 比較対象
	 * @returns 一致すればtrue
	 */
	equals(other: BigFloatVectorOperand): boolean;
	/**
	 * 各要素へ加算する
	 * @param other - スカラ値またはベクトル
	 * @returns 加算後ベクトル
	 */
	add(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素から減算する
	 * @param other - スカラ値またはベクトル
	 * @returns 減算後ベクトル
	 */
	sub(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * スカラ倍する
	 * @param scalar - スカラ値
	 * @returns 乗算後ベクトル
	 */
	mul(scalar: BigFloatValue): this;
	/**
	 * スカラ除算する
	 * @param scalar - スカラ値
	 * @returns 除算後ベクトル
	 */
	div(scalar: BigFloatValue): this;
	/**
	 * 剰余を計算する
	 * @param other - スカラ値またはベクトル
	 * @returns 剰余後ベクトル
	 */
	mod(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 要素ごとの積を計算する
	 * @param other - 対象ベクトル
	 * @returns Hadamard積
	 */
	hadamard(other: BigFloatVectorOperand): this;
	/**
	 * 符号を反転する
	 * @returns 反転後ベクトル
	 */
	neg(): this;
	/**
	 * 絶対値化する
	 * @returns 絶対値ベクトル
	 */
	abs(): this;
	/**
	 * 符号ベクトルを返す
	 * @returns 符号ベクトル
	 */
	sign(): this;
	/**
	 * 各要素の逆数を返す
	 * @returns 逆数ベクトル
	 */
	reciprocal(): this;
	/**
	 * 要素ごとの冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗後ベクトル
	 */
	pow(exponent: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根ベクトル
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根ベクトル
	 */
	cbrt(): this;
	/**
	 * 各要素のn乗根を計算する
	 * @param n - 指数
	 * @returns n乗根ベクトル
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素を切り下げる
	 * @returns 切り下げ後ベクトル
	 */
	floor(): this;
	/**
	 * 各要素を切り上げる
	 * @returns 切り上げ後ベクトル
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後ベクトル
	 */
	round(): this;
	/**
	 * 各要素を0方向へ切り捨てる
	 * @returns 切り捨て後ベクトル
	 */
	trunc(): this;
	/**
	 * 各要素をFloat32相当に丸める
	 * @returns Float32相当へ丸めたベクトル
	 */
	fround(): this;
	/**
	 * 各要素の先頭ゼロビット数を取得する
	 * @returns 先頭ゼロビット数ベクトル
	 */
	clz32(): this;
	/**
	 * 相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差ベクトル
	 */
	relativeDiff(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差ベクトル
	 */
	absoluteDiff(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分ベクトル
	 */
	percentDiff(other: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の正弦を計算する
	 * @returns 正弦ベクトル
	 */
	sin(): this;
	/**
	 * 各要素の余弦を計算する
	 * @returns 余弦ベクトル
	 */
	cos(): this;
	/**
	 * 各要素の正接を計算する
	 * @returns 正接ベクトル
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦を計算する
	 * @returns 逆正弦ベクトル
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦を計算する
	 * @returns 逆余弦ベクトル
	 */
	acos(): this;
	/**
	 * 各要素の逆正接を計算する
	 * @returns 逆正接ベクトル
	 */
	atan(): this;
	/**
	 * 各要素と逆正接を計算する
	 * @param x - x座標
	 * @returns 逆正接ベクトル
	 */
	atan2(x: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の双曲線正弦を計算する
	 * @returns 双曲線正弦ベクトル
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦を計算する
	 * @returns 双曲線余弦ベクトル
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接を計算する
	 * @returns 双曲線正接ベクトル
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦を計算する
	 * @returns 逆双曲線正弦ベクトル
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦を計算する
	 * @returns 逆双曲線余弦ベクトル
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接を計算する
	 * @returns 逆双曲線正接ベクトル
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数を計算する
	 * @returns 指数関数ベクトル
	 */
	exp(): this;
	/**
	 * 各要素の2冪指数関数を計算する
	 * @returns 2冪指数関数ベクトル
	 */
	exp2(): this;
	/**
	 * 各要素のexp(x)-1を計算する
	 * @returns expm1ベクトル
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数を計算する
	 * @returns 自然対数ベクトル
	 */
	ln(): this;
	/**
	 * 各要素の対数を計算する
	 * @param base - 底
	 * @returns 対数ベクトル
	 */
	log(base: BigFloatValue | BigFloatVectorOperand): this;
	/**
	 * 各要素の底2対数を計算する
	 * @returns 底2対数ベクトル
	 */
	log2(): this;
	/**
	 * 各要素の底10対数を計算する
	 * @returns 底10対数ベクトル
	 */
	log10(): this;
	/**
	 * 各要素のlog(1+x)を計算する
	 * @returns log1pベクトル
	 */
	log1p(): this;
	/**
	 * 各要素のガンマ関数を計算する
	 * @returns ガンマ関数ベクトル
	 */
	gamma(): this;
	/**
	 * 各要素のゼータ関数を計算する
	 * @returns ゼータ関数ベクトル
	 */
	zeta(): this;
	/**
	 * 各要素の階乗を計算する
	 * @returns 階乗ベクトル
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
	 * 合計を返す
	 * @returns 合計
	 */
	sum(): BigFloat;
	/**
	 * 積を返す
	 * @returns 積
	 */
	product(): BigFloat;
	/**
	 * 平均を返す
	 * @returns 平均
	 */
	average(): BigFloat;
	/**
	 * 内積を返す
	 * @param other - 対象ベクトル
	 * @returns 内積
	 */
	dot(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 二乗ノルムを返す
	 * @returns 二乗ノルム
	 */
	squaredNorm(): BigFloat;
	/**
	 * ノルムを返す
	 * @returns ノルム
	 */
	norm(): BigFloat;
	/**
	 * 正規化ベクトルを返す
	 * @returns 正規化ベクトル
	 * @throws {RangeError} ベクトル長がゼロの場合
	 */
	normalize(): this;
	/**
	 * 二乗距離を返す
	 * @param other - 対象ベクトル
	 * @returns 二乗距離
	 */
	squaredDistanceTo(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 距離を返す
	 * @param other - 対象ベクトル
	 * @returns 距離
	 */
	distanceTo(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 射影ベクトルを返す
	 * @param other - 射影先ベクトル
	 * @returns 射影ベクトル
	 * @throws {RangeError} 射影先ベクトルがゼロベクトルの場合
	 */
	projectOnto(other: BigFloatVectorOperand): this;
	/**
	 * 2ベクトルのなす角を返す
	 * @param other - 対象ベクトル
	 * @returns 角度
	 * @throws {RangeError} いずれかのベクトルがゼロベクトルの場合
	 */
	angleTo(other: BigFloatVectorOperand): BigFloat;
	/**
	 * 3次元外積を返す
	 * @param other - 対象ベクトル
	 * @returns 外積ベクトル
	 * @throws {RangeError} いずれかのベクトルが3次元でない場合
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
	/** 実部 */
	protected _real: BigFloat;
	/** 虚部 */
	protected _imag: BigFloat;
	/** 精度 */
	protected _precision: bigint;
	/**
	 * @param real - 実部または複素数表現
	 * @param imag - 虚部
	 * @param precision - 精度
	 */
	constructor(value?: BigFloatComplexValue, precision?: PrecisionValue);
	constructor(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue);
	/** BigFloat へ変換する */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/** 精度を解決する */
	protected static _resolvePrecision(values: BigFloatValue[], precision?: PrecisionValue): bigint;
	/** 内部 BigFloat から生成する */
	protected static _fromBigFloats(real: BigFloat, imag: BigFloat): BigFloatComplex;
	/** 複素数表現を正規化する */
	protected static _normalizeParts(value: BigFloatComplexValue, imag?: BigFloatValue): {
		realPart: BigFloatValue;
		imagPart: BigFloatValue;
	};
	/** 引数を正規化する */
	protected static _normalizeArguments(value: BigFloatComplexValue, imagOrPrecision: BigFloatValue | PrecisionValue | undefined, precision?: PrecisionValue, argCount?: number): {
		imagPartValue: BigFloatValue;
		precisionValue: PrecisionValue | undefined;
	};
	/** 第2引数を精度として解釈すべきか */
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
	/** 値を複素数へ変換する */
	protected static _toComplex(value: BigFloatComplexValue, precision?: bigint): BigFloatComplex;
	/** 複素数定数 0 */
	static zero(precision?: PrecisionValue): BigFloatComplex;
	/** 複素数定数 1 */
	static one(precision?: PrecisionValue): BigFloatComplex;
	/** 複素数定数 i */
	static i(precision?: PrecisionValue): BigFloatComplex;
	/** e を返す */
	static e(precision?: PrecisionValue): BigFloatComplex;
	/** pi を返す */
	static pi(precision?: PrecisionValue): BigFloatComplex;
	/** tau を返す */
	static tau(precision?: PrecisionValue): BigFloatComplex;
	/** 値から生成する */
	static from(value: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
	static from(value: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/** 値の並びから生成する */
	static of(real: BigFloatValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/** 極形式から生成する */
	static fromPolar(magnitude: BigFloatValue, angle: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/** 複素数の総和を返す */
	static sum(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/** 複素数の総積を返す */
	static product(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/** 複素数の平均を返す */
	static average(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/** 実部 */
	get real(): BigFloat;
	/** 虚部 */
	get imag(): BigFloat;
	/** 精度 */
	get precision(): bigint;
	/** 複製する */
	clone(): BigFloatComplex;
	/** 精度を変更する */
	changePrecision(precision: PrecisionValue): BigFloatComplex;
	/** 配列へ変換する */
	toArray(): [
		BigFloat,
		BigFloat
	];
	/** ベクトルへ変換する */
	toVector(): BigFloatVector;
	/** 極形式へ変換する */
	toPolar(): {
		magnitude: BigFloat;
		angle: BigFloat;
	};
	/** JSON へ変換する */
	toJSON(): {
		re: string;
		im: string;
	};
	/** 文字列化する */
	toString(base?: number, precision?: PrecisionValue): string;
	/** イテレータ */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/** 一致判定 */
	equals(other: BigFloatComplexValue): boolean;
	/** 別値判定 */
	ne(other: BigFloatComplexValue): boolean;
	/** ゼロ判定 */
	isZero(): boolean;
	/** 純実数判定 */
	isReal(): boolean;
	/** 純虚数判定 */
	isImaginary(): boolean;
	/** 共役複素数を返す */
	conjugate(): BigFloatComplex;
	/** 符号反転する */
	neg(): BigFloatComplex;
	/** 絶対値の二乗を返す */
	absSquared(): BigFloat;
	/** 絶対値を返す */
	abs(): BigFloat;
	/** 偏角を返す */
	arg(): BigFloat;
	/** 符号複素数を返す */
	sign(): BigFloatComplex;
	/**
	 * 正規化する
	 * @throws {RangeError} ゼロ複素数を正規化しようとした場合
	 */
	normalize(): BigFloatComplex;
	/** 距離を返す */
	distanceTo(other: BigFloatComplexValue): BigFloat;
	/** 相対差を返す */
	relativeDiff(other: BigFloatComplexValue): BigFloat;
	/** 絶対差を返す */
	absoluteDiff(other: BigFloatComplexValue): BigFloat;
	/** 百分率差分を返す */
	percentDiff(other: BigFloatComplexValue): BigFloat;
	/** 加算する */
	add(other: BigFloatComplexValue): BigFloatComplex;
	/** 減算する */
	sub(other: BigFloatComplexValue): BigFloatComplex;
	/** 乗算する */
	mul(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 除算する
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	div(other: BigFloatComplexValue): BigFloatComplex;
	/** 実数で除算する */
	protected divByReal(value: BigFloatValue): BigFloatComplex;
	/** 逆数を返す */
	reciprocal(): BigFloatComplex;
	/** 回転する */
	rotate(angle: BigFloatValue): BigFloatComplex;
	/** 指数関数を計算する */
	exp(): BigFloatComplex;
	/** exp(z)-1 を計算する */
	expm1(): BigFloatComplex;
	/**
	 * 自然対数を計算する
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	ln(): BigFloatComplex;
	/** 対数を計算する */
	log(base: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 冪乗を計算する
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 */
	pow(exponent: BigFloatComplexValue): BigFloatComplex;
	/** 平方根を計算する */
	sqrt(): BigFloatComplex;
	/** 立方根を計算する */
	cbrt(): BigFloatComplex;
	/** 主値の n 乗根を計算する */
	nthRoot(n: number | bigint): BigFloatComplex;
	/**
	 * n 乗根を全て返す
	 * @throws {RangeError} n <= 0 の場合
	 */
	nthRoots(n: number | bigint): BigFloatComplex[];
	/** 正弦を計算する */
	sin(): BigFloatComplex;
	/** 余弦を計算する */
	cos(): BigFloatComplex;
	/** 正接を計算する */
	tan(): BigFloatComplex;
	/** 双曲線正弦を計算する */
	sinh(): BigFloatComplex;
	/** 双曲線余弦を計算する */
	cosh(): BigFloatComplex;
	/** 双曲線正接を計算する */
	tanh(): BigFloatComplex;
	/** 逆正弦を計算する */
	asin(): BigFloatComplex;
	/** 逆余弦を計算する */
	acos(): BigFloatComplex;
	/** 逆正接を計算する */
	atan(): BigFloatComplex;
	/** 逆双曲線正弦を計算する */
	asinh(): BigFloatComplex;
	/** 逆双曲線余弦を計算する */
	acosh(): BigFloatComplex;
	/** 逆双曲線正接を計算する */
	atanh(): BigFloatComplex;
}
/**
 * BigFloatComplex を作成する
 * @param real - 実部または複素数表現
 * @param imag - 虚部
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export declare function bigFloatComplex(value?: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
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
	 * @param options - 設定オプション
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
	/** 2の指数を取得する */
	exponent2(): bigint;
	/** 5の指数を取得する */
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
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	protected static _createSpecialValue(state: SpecialValueState, precision: bigint): BigFloat;
	/**
	 * 自身または新しいインスタンスに特殊値状態を設定する
	 * @param state - 特殊値状態
	 * @param precision - 結果の精度
	 * @returns 特殊値状態を持つ結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
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
	/** BigFloatComplex らしい値か判定する */
	protected static _isComplexValue(value: unknown): value is BigFloatComplex;
	/**
	 * 複素数モードが無効な場合は例外にする
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected _assertComplexNumbersEnabled(operation: string): void;
	/**
	 * 複素数オペランドを解決する
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected _complexOperand(other: unknown, operation: string): BigFloatComplex | null;
	/** 自身を複素数へ昇格する */
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
	 * @param value - 初期値
	 * @param precision - 精度
	 * @throws {RangeError} 精度が不正な場合
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
	 * @throws {RangeError} 精度が範囲外の場合
	 */
	protected static _checkPrecision(precision: bigint): void;
	/**
	 * 精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更されたインスタンス
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
	 * @returns 比較結果 (-1, 0, 1)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を比較しようとしたとき
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
	 * @throws {RangeError} digitsが不正な場合
	 */
	toExponential(digits?: number): string;
	/**
	 * 加算する (+)
	 * @param other - 加算する値
	 * @returns 加算結果
	 */
	add(other: BigFloatValue): BigFloat;
	add(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 減算する (-)
	 * @param other - 減算する値
	 * @returns 減算結果
	 */
	sub(other: BigFloatValue): BigFloat;
	sub(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 乗算する (*)
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 */
	mul(other: BigFloatValue): BigFloat;
	mul(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 除算する (/)
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @throws {DivisionByZeroError} ゼロ除算の場合
	 */
	div(other: BigFloatValue): BigFloat;
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
	 * @throws {TypeError} BigFloatComplexが渡された場合
	 */
	mod(other: BigFloatValue): BigFloat;
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
	 */
	pow(exponent: BigFloatValue): BigFloat;
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
	 * @throws {RangeError} 値が0以下の場合
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
	 * @throws {RangeError} 値が0以下の場合
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
	 * @throws {RangeError} 値が0以下の場合
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
	 * @throws {RangeError} 値が0以下の場合
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
	 * @throws {RangeError} this = 1 の場合
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
	/** 内部要素 */
	protected _values: BigFloat[][];
	/**
	 * @param rows - 行列要素
	 * @param precision - 変換時の精度
	 */
	constructor(rows?: BigFloatMatrixSource, precision?: PrecisionValue);
	/** 内部配列から行列を生成する */
	protected static _fromBigFloatGrid(values: BigFloat[][]): BigFloatMatrix;
	/** 値をBigFloatへ変換する */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/** 精度を解決する */
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
	/** 微小値を返す */
	protected static _epsilon(precision: bigint): BigFloat;
	/** 行列または生データを行列化する */
	protected static _coerceMatrix(value: BigFloatMatrixOperand, referenceValues?: BigFloatValue[]): BigFloatMatrix;
	/** ベクトルまたは生データをベクトル化する */
	protected static _coerceVector(value: BigFloatVector | Iterable<BigFloatValue>, referenceValues?: BigFloatValue[]): BigFloatVector;
	/** 要素列を平坦化する */
	protected _flattenValues(): BigFloat[];
	/** 要素ごとの写像を行う */
	protected _mapValues(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this;
	/** 要素ごとの二項演算を行う */
	protected _mapWithOperand(other: BigFloatMatrixOperand | BigFloatValue, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this;
	/** RREF を計算する */
	protected static _reducedRowEchelon(values: BigFloat[][], leftColumnCount?: number): {
		values: BigFloat[][];
		pivotColumns: number[];
	};
	/** 空行列を生成する */
	static empty(): BigFloatMatrix;
	/** 行列データから生成する */
	static from(rows: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix;
	/** 行ベクトル群から生成する */
	static fromRows(rows: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 列ベクトル群から生成する
	 * @throws {RangeError} 列ベクトルの長さが異なる場合
	 */
	static fromColumns(columns: BigFloatMatrixSource, precision?: PrecisionValue): BigFloatMatrix;
	/** 行の並びから生成する */
	static of(...rows: BigFloatValue[][]): BigFloatMatrix;
	/** 指定値で埋めた行列を生成する */
	static fill(rowCount: number, columnCount: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatMatrix;
	/** 0行列を生成する */
	static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix;
	/** 1行列を生成する */
	static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix;
	/** 単位行列を生成する */
	static identity(size: number, precision?: PrecisionValue): BigFloatMatrix;
	/** 対角行列を生成する */
	static diagonal(values: Iterable<BigFloatValue>, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 乱数行列を生成する
	 * @throws {RangeError} max < min の場合
	 */
	static random(rowCount: number, columnCount: number, options?: BigFloatMatrixRandomOptions): BigFloatMatrix;
	/** 行数 */
	get rowCount(): number;
	/** 列数 */
	get columnCount(): number;
	/** 形状を返す */
	shape(): [
		number,
		number
	];
	/** 空行列かどうか */
	isEmpty(): boolean;
	/** 正方行列かどうか */
	isSquare(): boolean;
	/** 要素を取得する */
	at(row: number, column: number): BigFloat | undefined;
	/** 行を取得する */
	row(index: number): BigFloatVector | undefined;
	/** 列を取得する */
	column(index: number): BigFloatVector | undefined;
	/** 対角成分を取得する */
	diagonalVector(): BigFloatVector;
	/** 行列を複製する */
	clone(): BigFloatMatrix;
	/** 配列へ変換する */
	toArray(): BigFloat[][];
	/** 行ベクトル配列へ変換する */
	toVectors(): BigFloatVector[];
	/** 平坦化ベクトルへ変換する */
	flatten(): BigFloatVector;
	/** Stream へ変換する */
	toStream(): BigFloatStream;
	/** 行イテレータ */
	[Symbol.iterator](): Iterator<BigFloatVector, void, undefined>;
	/** 各要素へ処理を適用する */
	forEach(fn: (value: BigFloat, row: number, column: number) => void): void;
	/** 要素ごとに変換する */
	map(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this;
	/** 2つの行列を要素ごとに変換する */
	zipMap(other: BigFloatMatrixOperand, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this;
	/** 畳み込み処理を行う */
	reduce<U>(fn: (acc: U, value: BigFloat, row: number, column: number) => U, initial: U): U;
	/** 条件に一致する要素があるか */
	some(fn: (value: BigFloat, row: number, column: number) => boolean): boolean;
	/** すべての要素が条件を満たすか */
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
	/** 行スライス */
	sliceRows(start?: number, end?: number): this;
	/** 列スライス */
	sliceColumns(start?: number, end?: number): this;
	/** 転置行列を返す */
	transpose(): this;
	/** 一致判定 */
	equals(other: BigFloatMatrixOperand): boolean;
	/** すべての要素の精度を変更する */
	changePrecision(precision: PrecisionValue): this;
	/** 各要素へ加算する */
	add(other: BigFloatValue | BigFloatMatrixOperand): this;
	/** 各要素から減算する */
	sub(other: BigFloatValue | BigFloatMatrixOperand): this;
	/** スカラ倍する */
	mul(scalar: BigFloatValue): this;
	/** スカラ除算する */
	div(scalar: BigFloatValue): this;
	/** 剰余を計算する */
	mod(other: BigFloatValue | BigFloatMatrixOperand): this;
	/** 要素ごとの積を計算する */
	hadamard(other: BigFloatMatrixOperand): this;
	/** 符号反転する */
	neg(): this;
	/** 絶対値化する */
	abs(): this;
	/** 符号行列を返す */
	sign(): this;
	/** 逆数行列を返す */
	reciprocal(): this;
	/** 要素ごとの冪乗を計算する */
	pow(exponent: BigFloatValue | BigFloatMatrixOperand): this;
	/** 各要素の平方根を計算する */
	sqrt(): this;
	/** 各要素の立方根を計算する */
	cbrt(): this;
	/** 各要素のn乗根を計算する */
	nthRoot(n: number | bigint): this;
	/** 切り下げる */
	floor(): this;
	/** 切り上げる */
	ceil(): this;
	/** 四捨五入する */
	round(): this;
	/** 0方向へ切り捨てる */
	trunc(): this;
	/** Float32相当に丸める */
	fround(): this;
	/** 先頭ゼロビット数を返す */
	clz32(): this;
	/** 相対差を計算する */
	relativeDiff(other: BigFloatValue | BigFloatMatrixOperand): this;
	/** 絶対差を計算する */
	absoluteDiff(other: BigFloatValue | BigFloatMatrixOperand): this;
	/** 百分率差分を計算する */
	percentDiff(other: BigFloatValue | BigFloatMatrixOperand): this;
	/** 正弦を計算する */
	sin(): this;
	/** 余弦を計算する */
	cos(): this;
	/** 正接を計算する */
	tan(): this;
	/** 逆正弦を計算する */
	asin(): this;
	/** 逆余弦を計算する */
	acos(): this;
	/** 逆正接を計算する */
	atan(): this;
	/** atan2 を計算する */
	atan2(x: BigFloatValue | BigFloatMatrixOperand): this;
	/** 双曲線正弦を計算する */
	sinh(): this;
	/** 双曲線余弦を計算する */
	cosh(): this;
	/** 双曲線正接を計算する */
	tanh(): this;
	/** 逆双曲線正弦を計算する */
	asinh(): this;
	/** 逆双曲線余弦を計算する */
	acosh(): this;
	/** 逆双曲線正接を計算する */
	atanh(): this;
	/** 指数関数を計算する */
	exp(): this;
	/** 2冪指数関数を計算する */
	exp2(): this;
	/** exp(x)-1 を計算する */
	expm1(): this;
	/** 自然対数を計算する */
	ln(): this;
	/** 対数を計算する */
	log(base: BigFloatValue | BigFloatMatrixOperand): this;
	/** 底2対数を計算する */
	log2(): this;
	/** 底10対数を計算する */
	log10(): this;
	/** log(1+x) を計算する */
	log1p(): this;
	/** ガンマ関数を計算する */
	gamma(): this;
	/** ゼータ関数を計算する */
	zeta(): this;
	/** 階乗を計算する */
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
	/** 合計を返す */
	sum(): BigFloat;
	/** 積を返す */
	product(): BigFloat;
	/** 平均を返す */
	average(): BigFloat;
	/** 行和ベクトルを返す */
	rowSums(): BigFloatVector;
	/** 列和ベクトルを返す */
	columnSums(): BigFloatVector;
	/** トレースを返す */
	trace(): BigFloat;
	/** Frobenius ノルムを返す */
	frobeniusNorm(): BigFloat;
	/** 行列積を計算する */
	matmul(other: BigFloatMatrixOperand): this;
	/**
	 * ベクトル積を計算する
	 * @throws {RangeError} 内部次元が一致しない場合
	 */
	mulVector(vector: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector;
	/** 行列式を返す */
	determinant(): BigFloat;
	/** ランクを返す */
	rank(): number;
	/** 逆行列を返す */
	inverse(): this;
	/**
	 * 連立方程式 Ax=b を解く
	 * @throws {RangeError} 行列が特異な場合
	 */
	solveVector(rhs: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector;
	/**
	 * 連立方程式 AX=B を解く
	 * @throws {RangeError} 右辺の行数が一致しない場合
	 */
	solveMatrix(rhs: BigFloatMatrixOperand): this;
	/**
	 * 行列累乗を返す
	 * @throws {RangeError} 指数が整数でない場合
	 */
	matrixPow(exponent: number): this;
}
/**
 * BigFloat ライブラリ共通の基底エラー
 */
export declare class BigFloatError extends Error {
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
