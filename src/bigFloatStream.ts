import { BigFloat } from "./bigFloat";
import { BigFloatComplex } from "./bigFloatComplex";
import type { BigFloatInputValue, BigFloatLike, BigFloatValue, PrecisionValue } from "./types";

type BigFloatIterator = Iterator<BigFloatLike, void, undefined>;
type BigFloatStreamFactory = () => BigFloatIterator;
type BigFloatStreamFrame = { iterator: BigFloatIterator; stageIndex: number };
type BigFloatStreamStageSignal = BigFloatLike | typeof BIGFLOAT_STREAM_SKIP;
type BigFloatStreamStageContext = {
	pushIterator: (iterator: BigFloatIterator, stageIndex: number) => void;
	stop: () => void;
};
type BigFloatStreamStageDefinition = {
	createState: (data: unknown) => unknown;
	process: (value: BigFloatLike, state: unknown, data: unknown, context: BigFloatStreamStageContext, nextStageIndex: number) => BigFloatStreamStageSignal;
};
type BigFloatStreamStage = {
	definition: BigFloatStreamStageDefinition;
	data: unknown;
};
type BigFloatStreamRandomOptions = {
	min?: BigFloatInputValue;
	max?: BigFloatInputValue;
	precision?: PrecisionValue;
};

const BIGFLOAT_STREAM_SKIP = Symbol("BIGFLOAT_STREAM_SKIP");

/**
 * BigFloat 用の遅延評価ストリーム (Lazy List) クラス
 */
export class BigFloatStream implements Iterable<BigFloatLike> {
	/**
	 * mapステージ定義
	 */
	private static readonly _mapStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data) => (data as (item: BigFloatLike) => BigFloatLike)(value),
	};
	/**
	 * filterステージ定義
	 */
	private static readonly _filterStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data) => ((data as (item: BigFloatLike) => boolean)(value) ? value : BIGFLOAT_STREAM_SKIP),
	};
	/**
	 * peekステージ定義
	 */
	private static readonly _peekStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data) => {
			(data as (item: BigFloatLike) => void)(value);
			return value;
		},
	};
	/**
	 * flatMapステージ定義
	 */
	private static readonly _flatMapStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data, context, nextStageIndex) => {
			const p = value instanceof BigFloat ? value._precision : value.precision;
			context.pushIterator(BigFloatStream._toIterator((data as (item: BigFloatLike) => Iterable<BigFloatInputValue>)(value), p), nextStageIndex);
			return BIGFLOAT_STREAM_SKIP;
		},
	};
	/**
	 * distinctステージ定義
	 */
	private static readonly _distinctStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => new Set<unknown>(),
		process: (value, state, data) => {
			const seen = state as Set<unknown>;
			const key = (data as (item: BigFloatLike) => unknown)(value);
			if (seen.has(key)) return BIGFLOAT_STREAM_SKIP;
			seen.add(key);
			return value;
		},
	};
	/**
	 * limitステージ定義
	 */
	private static readonly _limitStageDefinition: BigFloatStreamStageDefinition = {
		createState: (data) => ({ remaining: data as number }),
		process: (value, state, _data, context) => {
			const limitState = state as { remaining: number };
			if (limitState.remaining <= 0) {
				context.stop();
				return BIGFLOAT_STREAM_SKIP;
			}
			limitState.remaining--;
			return value;
		},
	};
	/**
	 * skipステージ定義
	 */
	private static readonly _skipStageDefinition: BigFloatStreamStageDefinition = {
		createState: (data) => ({ remaining: data as number }),
		process: (value, state) => {
			const skipState = state as { remaining: number };
			if (skipState.remaining > 0) {
				skipState.remaining--;
				return BIGFLOAT_STREAM_SKIP;
			}
			return value;
		},
	};

	/**
	 * 内部イテレータファクトリ
	 */
	private _sourceFactory: BigFloatStreamFactory;
	/**
	 * パイプラインにおける直前のストリーム
	 */
	private _previousStream: BigFloatStream | null;
	/**
	 * このストリームが表すステージの定義
	 */
	private _stageDefinition: BigFloatStreamStageDefinition | null;
	/**
	 * ステージに渡される固定データ (コールバック関数など)
	 */
	private _stageData: unknown;

	/**
	 * BigFloatStream コンストラクタ
	 * @param source - 要素の反復可能オブジェクト、またはイテレータを生成する関数
	 */
	public constructor(source: Iterable<BigFloatLike> | BigFloatStreamFactory) {
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
	 * 内部状態からストリームを生成する (内部用)
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns 生成されたストリーム
	 */
	protected static _fromState(sourceFactory: BigFloatStreamFactory, previousStream: BigFloatStream | null, stageDefinition: BigFloatStreamStageDefinition | null, stageData: unknown): BigFloatStream {
		const stream = Object.create(BigFloatStream.prototype) as BigFloatStream;
		stream._sourceFactory = sourceFactory;
		stream._previousStream = previousStream;
		stream._stageDefinition = stageDefinition;
		stream._stageData = stageData;
		return stream;
	}

	/**
	 * ストリーム値を BigFloat または BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された値
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toItem(value: BigFloatInputValue, precision?: bigint): BigFloatLike {
		if (value instanceof BigFloatComplex) {
			return precision === undefined || value.precision === precision ? value : value.changePrecision(precision);
		}
		if (value instanceof BigFloat) {
			if (precision === undefined || value._precision === precision) return value;
			return value.clone().changePrecision(precision);
		}
		return new BigFloat(value, precision ?? BigFloat.DEFAULT_PRECISION);
	}

	/**
	 * 反復可能オブジェクトを BigFloatLike のイテレータへ変換する (内部用)
	 * @param iterable - 変換対象
	 * @param precision - 精度
	 * @returns BigFloatLike のイテレータ
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toIterator(iterable: Iterable<BigFloatInputValue>, precision?: bigint): IterableIterator<BigFloatLike, void, undefined> {
		return (function* () {
			for (const item of iterable) {
				yield BigFloatStream._toItem(item, precision);
			}
		})();
	}

	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint {
		if (precision !== undefined) return BigInt(precision);
		let resolved = BigFloat.DEFAULT_PRECISION;
		for (const value of values) {
			const p = value instanceof BigFloatComplex ? value.precision : value instanceof BigFloat ? value._precision : 0n;
			if (p > resolved) resolved = p;
		}
		return resolved;
	}

	/**
	 * 要素数を非負の整数に正規化する (内部用)
	 * @param count - 要素数
	 * @returns 正規化された要素数
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 */
	protected static _normalizeCount(count: number): number {
		if (!Number.isFinite(count)) throw new RangeError("Count must be finite");
		const normalized = Math.trunc(count);
		if (normalized < 0) throw new RangeError("Count must be non-negative");
		return normalized;
	}

	/**
	 * 空のストリームを生成する
	 * @returns 空の BigFloatStream
	 */
	public static empty(): BigFloatStream {
		return new BigFloatStream(() => [][Symbol.iterator]());
	}

	/**
	 * 反復可能オブジェクトからストリームを作成する
	 * @param iterable - 要素のソース
	 * @param precision - 変換時の精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static from(iterable: Iterable<BigFloatInputValue>, precision?: PrecisionValue): BigFloatStream {
		if (precision === undefined) {
			return new BigFloatStream(function* () {
				for (const item of iterable) {
					yield item instanceof BigFloat || item instanceof BigFloatComplex ? item : new BigFloat(item);
				}
			});
		}

		const precisionBig = BigInt(precision);
		return new BigFloatStream(function* () {
			for (const item of iterable) {
				yield BigFloatStream._toItem(item, precisionBig);
			}
		});
	}

	/**
	 * 引数のリストからストリームを作成する
	 * @param values - 要素のリスト
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public static of(...values: BigFloatInputValue[]): BigFloatStream {
		return this.from(values);
	}

	/**
	 * 等差数列のストリームを生成する
	 * @param start - 初項
	 * @param step - 公差
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static arithmetic(start: BigFloatInputValue, step: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, step], precision);

		return new BigFloatStream(function* () {
			let current = BigFloatStream._toItem(start, resolvedPrecision);
			const stepValue = BigFloatStream._toItem(step, resolvedPrecision);
			for (let i = 0; i < normalizedCount; i++) {
				yield current;
				if (i + 1 < normalizedCount) current = current.add(stepValue);
			}
		});
	}

	/**
	 * 等比数列のストリームを生成する
	 * @param start - 初項
	 * @param ratio - 公比
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static geometric(start: BigFloatInputValue, ratio: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, ratio], precision);

		return new BigFloatStream(function* () {
			let current = BigFloatStream._toItem(start, resolvedPrecision);
			const ratioValue = BigFloatStream._toItem(ratio, resolvedPrecision);
			for (let i = 0; i < normalizedCount; i++) {
				yield current;
				if (i + 1 < normalizedCount) current = current.mul(ratioValue);
			}
		});
	}

	/**
	 * 指定した範囲を等分割する数値ストリームを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static linspace(start: BigFloatInputValue, end: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, end], precision);

		return new BigFloatStream(function* () {
			const startValue = BigFloatStream._toItem(start, resolvedPrecision);
			if (normalizedCount === 1) {
				yield startValue;
				return;
			}

			const endValue = BigFloatStream._toItem(end, resolvedPrecision);
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
	 * 10 を底とする対数スケールで等間隔な数値ストリームを生成する
	 * @param start - 開始指数
	 * @param end - 終了指数
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public static logspace(start: BigFloatInputValue, end: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, end], precision);

		return new BigFloatStream(function* () {
			const base = new BigFloat(10, resolvedPrecision);
			const startValue = BigFloatStream._toItem(start, resolvedPrecision);
			let current = base.pow(startValue as BigFloat);
			if (normalizedCount === 1) {
				yield current;
				return;
			}

			const endValue = BigFloatStream._toItem(end, resolvedPrecision);
			const endTerm = base.pow(endValue as BigFloat);
			const stepExponent = endValue.sub(startValue).div(normalizedCount - 1);
			const ratio = base.pow(stepExponent as BigFloat);

			for (let i = 0; i < normalizedCount; i++) {
				if (i === normalizedCount - 1) {
					yield endTerm as BigFloatLike;
				} else {
					yield current;
					current = current.mul(ratio);
				}
			}
		});
	}

	/**
	 * 調和級数 (1/1, 1/2, 1/3, ...) のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static harmonic(count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);

		return new BigFloatStream(function* () {
			const one = new BigFloat(1, resolvedPrecision);
			for (let i = 1; i <= normalizedCount; i++) {
				yield one.div(i);
			}
		});
	}

	/**
	 * 乱数ストリームを生成する
	 * @param count - 要素数
	 * @param options - 乱数範囲と精度のオプション
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 最大値が最小値より小さい場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static random(count: number, options: BigFloatStreamRandomOptions = {}): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const min = options.min ?? 0;
		const max = options.max ?? 1;
		const resolvedPrecision = this._resolvePrecision([min, max], options.precision);

		return new BigFloatStream(function* () {
			const minValue = BigFloatStream._toItem(min, resolvedPrecision);
			const maxValue = BigFloatStream._toItem(max, resolvedPrecision);
			const span = maxValue.sub(minValue);
			if ((span as BigFloat).lt(0)) throw new RangeError("Random range requires max >= min");
			if ((span as BigFloat).isZero()) {
				yield* BigFloatStream.repeat(minValue, normalizedCount, resolvedPrecision);
				return;
			}

			for (let i = 0; i < normalizedCount; i++) {
				yield minValue.add(span.mul(BigFloat.random(resolvedPrecision)));
			}
		});
	}

	/**
	 * 指定された値を繰り返すストリームを生成する
	 * @param value - 繰り返す値
	 * @param count - 回数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 */
	public static repeat(value: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([value], precision);

		return new BigFloatStream(function* () {
			const baseValue = BigFloatStream._toItem(value, resolvedPrecision);
			for (let i = 0; i < normalizedCount; i++) {
				yield baseValue.clone() as BigFloatLike;
			}
		});
	}

	/**
	 * フィボナッチ数列のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static fibonacci(count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);

		return new BigFloatStream(function* () {
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
	 * 階乗数列 (1!, 2!, 3!, ...) のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static factorial(count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = precision === undefined ? BigFloat.DEFAULT_PRECISION : BigInt(precision);

		return new BigFloatStream(function* () {
			let current = new BigFloat(1, resolvedPrecision);
			for (let i = 0; i < normalizedCount; i++) {
				yield current;
				current = current.mul(i + 1);
			}
		});
	}

	/**
	 * 数値の範囲を指定してストリームを生成する
	 * @param start - 開始値 (end 省略時は 0 からこの値まで)
	 * @param end - 終了値 (この値は含まない)
	 * @param step - 増分
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} step が 0 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public static range(start: BigFloatInputValue, end?: BigFloatInputValue, step: BigFloatInputValue = 1, precision?: PrecisionValue): BigFloatStream {
		const actualStart = end === undefined ? 0 : start;
		const actualEnd = end === undefined ? start : end;
		const resolvedPrecision = this._resolvePrecision([actualStart, actualEnd, step], precision);

		return new BigFloatStream(function* () {
			let current = BigFloatStream._toItem(actualStart, resolvedPrecision);
			const endValue = BigFloatStream._toItem(actualEnd, resolvedPrecision);
			const stepValue = BigFloatStream._toItem(step, resolvedPrecision);
			if (stepValue.isZero()) throw new RangeError("Step cannot be zero");

			if ((stepValue as BigFloat).gt(0)) {
				while ((current as BigFloat).lt(endValue)) {
					yield current;
					current = current.add(stepValue);
				}
			} else {
				while ((current as BigFloat).gt(endValue)) {
					yield current;
					current = current.add(stepValue);
				}
			}
		});
	}

	/**
	 * ストリームを複製する
	 * @returns 複製された BigFloatStream
	 */
	public clone(): BigFloatStream {
		return this._fork();
	}

	/**
	 * 現在の状態をフォークして新しいストリームを生成する (内部用)
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns 新しいストリーム
	 */
	protected _fork(sourceFactory: BigFloatStreamFactory = this._sourceFactory, previousStream: BigFloatStream | null = this._previousStream, stageDefinition: BigFloatStreamStageDefinition | null = this._stageDefinition, stageData: unknown = this._stageData): this {
		return BigFloatStream._fromState(sourceFactory, previousStream, stageDefinition, stageData) as this;
	}

	/**
	 * パイプラインに新しいステージを追加する (内部用)
	 * @param stage - 追加するステージ
	 * @returns 新しいストリーム
	 */
	protected _use(stage: BigFloatStreamStage): this {
		return this._fork(this._sourceFactory, this, stage.definition, stage.data);
	}

	/**
	 * 現在のストリームからルートまで遡り、全パイプラインステージを収集する (内部用)
	 * @returns ステージの配列
	 */
	protected _collectPipelineStages(): BigFloatStreamStage[] {
		const stages: BigFloatStreamStage[] = [];
		for (let stream: BigFloatStream | null = this; stream; stream = stream._previousStream) {
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
	 * 各要素を変換関数で写像する
	 * @param fn - 変換関数
	 * @returns 写像後のストリーム
	 */
	public map(fn: (item: BigFloatLike) => BigFloatLike): this {
		return this._use({ definition: BigFloatStream._mapStageDefinition, data: fn });
	}

	/**
	 * 条件を満たす要素のみを通過させる
	 * @param fn - フィルタリング関数
	 * @returns フィルタリング後のストリーム
	 */
	public filter(fn: (item: BigFloatLike) => boolean): this {
		return this._use({ definition: BigFloatStream._filterStageDefinition, data: fn });
	}

	/**
	 * 各要素を複数の要素に展開して平坦化する
	 * @param fn - 要素を反復可能オブジェクトへ変換する関数
	 * @returns 平坦化後のストリーム
	 */
	public flatMap(fn: (item: BigFloatLike) => Iterable<BigFloatInputValue>): this {
		return this._use({ definition: BigFloatStream._flatMapStageDefinition, data: fn });
	}

	/**
	 * 要素の重複を除去する
	 * @param keyFn - 一致判定に使うキーを生成する関数 (デフォルトは toString)
	 * @returns 重複除去後のストリーム
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public distinct(keyFn: (item: BigFloatLike) => unknown = (x) => x.toString()): this {
		return this._use({ definition: BigFloatStream._distinctStageDefinition, data: keyFn });
	}

	/**
	 * 要素をソートする (注意: この操作は全要素をメモリ上に展開します)
	 * @param compareFn - 比較関数
	 * @returns ソート後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public sorted(compareFn: (a: BigFloatLike, b: BigFloatLike) => number = (a, b) => (a as BigFloat).compare(b)): this {
		const current = this.clone();
		return this._fork(
			function* () {
				const arr = current.toArray();
				arr.sort(compareFn);
				yield* arr;
			},
			null,
			null,
			null,
		);
	}

	/**
	 * 各要素に対して副作用のある処理を実行する (デバッグやロギング用)
	 * @param fn - 要素を受け取る関数
	 * @returns 自身
	 */
	public peek(fn: (item: BigFloatLike) => void): this {
		return this._use({ definition: BigFloatStream._peekStageDefinition, data: fn });
	}

	/**
	 * peek の別名。各要素に対して副作用のある処理を実行する
	 * @param fn - 要素を受け取る関数
	 * @returns 自身
	 */
	public tap(fn: (item: BigFloatLike) => void): this {
		return this.peek(fn);
	}

	/**
	 * 要素数を最大 n 個に制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	public limit(n: number): this {
		if (n <= 0) {
			return this._fork(() => [][Symbol.iterator](), null, null, null);
		}
		return this._use({ definition: BigFloatStream._limitStageDefinition, data: n });
	}

	/**
	 * limit の別名。要素数を最大 n 個に制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	public take(n: number): this {
		return this.limit(n);
	}

	/**
	 * 先頭の n 個の要素を読み飛ばす
	 * @param n - スキップする数
	 * @returns スキップ後のストリーム
	 */
	public skip(n: number): this {
		if (n <= 0) return this;
		return this._use({ definition: BigFloatStream._skipStageDefinition, data: n });
	}

	/**
	 * skip の別名。先頭の n 個の要素を読み飛ばす
	 * @param n - スキップする数
	 * @returns スキップ後のストリーム
	 */
	public drop(n: number): this {
		return this.skip(n);
	}

	/**
	 * 末尾に別の反復可能オブジェクトの内容を連結する
	 * @param iterables - 連結する対象
	 * @returns 連結後のストリーム
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public concat(...iterables: Iterable<BigFloatInputValue>[]): this {
		const current = this.clone();
		return this._fork(
			function* () {
				yield* current;
				for (const iterable of iterables) {
					yield* BigFloatStream._toIterator(iterable);
				}
			},
			null,
			null,
			null,
		);
	}

	// ==================================================
	// Iterator
	// ==================================================

	/**
	 * ストリームを反復するためのイテレータを取得する
	 * @returns 要素のイテレータ
	 */
	public [Symbol.iterator](): BigFloatIterator {
		const stages = this._collectPipelineStages();
		if (stages.length === 0) {
			return this._sourceFactory();
		}
		const states = stages.map((stage) => stage.definition.createState(stage.data));
		const stack: BigFloatStreamFrame[] = [{ iterator: this._sourceFactory(), stageIndex: 0 }];
		let shouldStop = false;
		const context: BigFloatStreamStageContext = {
			pushIterator: (iterator, stageIndex) => {
				stack.push({ iterator, stageIndex });
			},
			stop: () => {
				shouldStop = true;
			},
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
	 * ストリームの各要素に対して関数を実行する (終端操作)
	 * @param fn - 実行する関数
	 */
	public forEach(fn: (item: BigFloatLike) => void): void {
		for (const item of this) fn(item);
	}

	/**
	 * ストリームの全要素を収集して配列として返す (終端操作)
	 * @returns 要素の配列
	 */
	public toArray(): BigFloatLike[] {
		const values: BigFloatLike[] = [];
		for (const item of this) values.push(item);
		return values;
	}

	/**
	 * toArray の別名。ストリームの全要素を収集して配列として返す (終端操作)
	 * @returns 要素の配列
	 */
	public collect(): BigFloatLike[] {
		return this.toArray();
	}

	/**
	 * 全要素を累積して単一の値を計算する (終端操作)
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積結果
	 */
	public reduce<U>(fn: (acc: U, item: BigFloatLike) => U, initial: U): U {
		let acc = initial;
		for (const item of this) {
			acc = fn(acc, item);
		}
		return acc;
	}

	/**
	 * ストリームに含まれる要素数を数える (終端操作)
	 * @returns 要素数
	 */
	public count(): number {
		let count = 0;
		for (const _ of this) count++;
		return count;
	}

	/**
	 * ストリームに要素が含まれていないかどうかを判定する (終端操作)
	 * @returns 空なら true
	 */
	public isEmpty(): boolean {
		return this.findFirst() === undefined;
	}

	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	public some(fn: (item: BigFloatLike) => boolean): boolean {
		for (const item of this) {
			if (fn(item)) return true;
		}
		return false;
	}

	/**
	 * すべての要素が条件を満たすかどうかを判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	public every(fn: (item: BigFloatLike) => boolean): boolean {
		for (const item of this) {
			if (!fn(item)) return false;
		}
		return true;
	}

	/**
	 * 条件を満たす最初の要素を返す (終端操作)
	 * @param fn - 判定関数
	 * @returns 最初に見つかった要素、見つからない場合は undefined
	 */
	public find(fn: (item: BigFloatLike) => boolean): BigFloatLike | undefined {
		for (const item of this) {
			if (fn(item)) return item;
		}
		return undefined;
	}

	/**
	 * ストリームの最初の要素を取得する (終端操作)
	 * @returns 最初の要素、ストリームが空なら undefined
	 */
	public findFirst(): BigFloatLike | undefined {
		for (const item of this) return item;
		return undefined;
	}

	/**
	 * findFirst の別名。ストリームの最初の要素を取得する
	 * @returns 最初の要素
	 */
	public first(): BigFloatLike | undefined {
		return this.findFirst();
	}

	/**
	 * 指定されたインデックスの要素を取得する (終端操作)
	 * @param index - 0 から始まるインデックス
	 * @returns 指定位置の要素、インデックスが範囲外なら undefined
	 */
	public at(index: number): BigFloatLike | undefined {
		if (index < 0) return undefined;
		let currentIndex = 0;
		for (const item of this) {
			if (currentIndex++ === index) return item;
		}
		return undefined;
	}

	// ====================================================================================================
	// * BigFloatStream specific methods
	// ====================================================================================================

	/**
	 * すべての要素の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいストリーム
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public changePrecision(precision: PrecisionValue): this {
		const precisionBig = BigInt(precision);
		return this.map((x) => x.clone().changePrecision(precisionBig));
	}

	/**
	 * 各要素と別の値との相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差を各要素に持つストリーム
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public relativeDiff(other: BigFloatInputValue): this {
		return this.map((x) => x.relativeDiff(other));
	}

	/**
	 * 各要素と別の値との絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差を各要素に持つストリーム
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public absoluteDiff(other: BigFloatInputValue): this {
		return this.map((x) => x.absoluteDiff(other));
	}

	/**
	 * 各要素と別の値との百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分を各要素に持つストリーム (%)
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public percentDiff(other: BigFloatInputValue): this {
		return this.map((x) => x.percentDiff(other));
	}

	/**
	 * 各要素に別の値を加算する
	 * @param other - 加算する数値
	 * @returns 加算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public add(other: BigFloatInputValue): this {
		return this.map((x) => x.add(other));
	}

	/**
	 * 各要素から別の値を減算する
	 * @param other - 減算する数値
	 * @returns 減算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sub(other: BigFloatInputValue): this {
		return this.map((x) => x.sub(other));
	}

	/**
	 * 各要素に別の値を乗算する
	 * @param other - 乗算する数値
	 * @returns 乗算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public mul(other: BigFloatInputValue): this {
		return this.map((x) => x.mul(other));
	}

	/**
	 * 各要素を別の値で除算する
	 * @param other - 除数
	 * @returns 除算後のストリーム
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public div(other: BigFloatInputValue): this {
		return this.map((x) => x.div(other));
	}

	/**
	 * 各要素に対して剰余演算を行う
	 * @param other - 法
	 * @returns 剰余後のストリーム
	 * @throws {TypeError} BigFloat.mod does not support BigFloatComplex operands
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public mod(other: BigFloatInputValue): this {
		return this.map((x) => x.mod(other));
	}

	/**
	 * 各要素の符号を反転させる
	 * @returns 符号反転後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public neg(): this {
		return this.map((x) => x.neg());
	}

	/**
	 * 各要素を絶対値にする
	 * @returns 絶対値適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public abs(): this {
		return this.map((x) => x.abs());
	}

	/**
	 * 各要素の符号 (1, 0, -1) を取得する
	 * @returns 符号値を持つストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public sign(): this {
		return this.map((x) => x.sign());
	}

	/**
	 * 各要素の逆数を取得する
	 * @returns 逆数を持つストリーム
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public reciprocal(): this {
		return this.map((x) => x.reciprocal());
	}

	/**
	 * 各要素を指定した指数で冪乗する
	 * @param exponent - 指数
	 * @returns 冪乗後のストリーム
	 * @throws {RangeError} Fractional power of negative number is not real
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	public pow(exponent: BigFloatValue): this {
		return this.map((x) => x.pow(exponent));
	}

	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根適用後のストリーム
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sqrt(): this {
		return this.map((x) => x.sqrt());
	}

	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	public cbrt(): this {
		return this.map((x) => x.cbrt());
	}

	/**
	 * 各要素の n 乗根を計算する
	 * @param n - 指数
	 * @returns n 乗根適用後のストリーム
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public nthRoot(n: number | bigint): this {
		return this.map((x) => x.nthRoot(n));
	}

	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理する
	 * @returns 床関数適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public floor(): this {
		return this.map((x) => x.floor());
	}

	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理する
	 * @returns 天井関数適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public ceil(): this {
		return this.map((x) => x.ceil());
	}

	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public round(): this {
		return this.map((x) => x.round());
	}

	/**
	 * 各要素を 0 方向に切り捨てる
	 * @returns 切り捨て後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	public trunc(): this {
		return this.map((x) => x.trunc());
	}

	/**
	 * 各要素を Float32 精度に丸める
	 * @returns 丸め後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public fround(): this {
		return this.map((x) => x.fround());
	}

	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数える
	 * @returns 結果のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public clz32(): this {
		return this.map((x) => x.clz32());
	}

	/**
	 * 各要素の正弦 (sin) を計算する
	 * @returns sin 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sin(): this {
		return this.map((x) => x.sin());
	}

	/**
	 * 各要素の余弦 (cos) を計算する
	 * @returns cos 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cos(): this {
		return this.map((x) => x.cos());
	}

	/**
	 * 各要素の正接 (tan) を計算する
	 * @returns tan 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tan(): this {
		return this.map((x) => x.tan());
	}

	/**
	 * 各要素の逆正弦 (asin) を計算する
	 * @returns asin 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asin(): this {
		return this.map((x) => x.asin());
	}

	/**
	 * 各要素の逆余弦 (acos) を計算する
	 * @returns acos 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acos(): this {
		return this.map((x) => x.acos());
	}

	/**
	 * 各要素の逆正接 (atan) を計算する
	 * @returns atan 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atan(): this {
		return this.map((x) => x.atan());
	}

	/**
	 * 各要素に対して atan2 を計算する
	 * @param x - x 座標
	 * @returns atan2 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atan2(x: BigFloatValue): this {
		return this.map((value) => (value as BigFloat).atan2(x));
	}

	/**
	 * 各要素の双曲線正弦 (sinh) を計算する
	 * @returns sinh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sinh(): this {
		return this.map((x) => x.sinh());
	}

	/**
	 * 各要素の双曲線余弦 (cosh) を計算する
	 * @returns cosh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public cosh(): this {
		return this.map((x) => x.cosh());
	}

	/**
	 * 各要素の双曲線正接 (tanh) を計算する
	 * @returns tanh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public tanh(): this {
		return this.map((x) => x.tanh());
	}

	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算する
	 * @returns asinh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public asinh(): this {
		return this.map((x) => x.asinh());
	}

	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算する
	 * @returns acosh 適用後のストリーム
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public acosh(): this {
		return this.map((x) => x.acosh());
	}

	/**
	 * 各要素の逆双曲線正接 (atanh) を計算する
	 * @returns atanh 適用後のストリーム
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public atanh(): this {
		return this.map((x) => x.atanh());
	}

	/**
	 * 各要素の指数関数 (exp) を計算する
	 * @returns exp 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public exp(): this {
		return this.map((x) => x.exp());
	}

	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算する
	 * @returns exp2 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public exp2(): this {
		return this.map((x) => {
			if (x instanceof BigFloat) return x.exp2();
			throw new TypeError("exp2 is not supported for complex numbers");
		});
	}

	/**
	 * 各要素に対して exp(x) - 1 を計算する
	 * @returns expm1 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	public expm1(): this {
		return this.map((x) => x.expm1());
	}

	/**
	 * 各要素の自然対数 (ln) を計算する
	 * @returns ln 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public ln(): this {
		return this.map((x) => x.ln());
	}

	/**
	 * 各要素の任意の底による対数を計算する
	 * @param base - 底
	 * @returns 対数計算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log(base: BigFloatValue): this {
		return this.map((x) => x.log(base));
	}

	/**
	 * 各要素の底を 2 とする対数を計算する
	 * @returns log2 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log2(): this {
		return this.map((x) => {
			if (x instanceof BigFloat) return x.log2();
			return x.log(2);
		});
	}

	/**
	 * 各要素の常用対数 (log10) を計算する
	 * @returns log10 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log10(): this {
		return this.map((x) => {
			if (x instanceof BigFloat) return x.log10();
			return x.log(10);
		});
	}

	/**
	 * 各要素に対して ln(1 + x) を計算する
	 * @returns log1p 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public log1p(): this {
		return this.map((x) => {
			if (x instanceof BigFloat) return x.log1p();
			return x.add(1).ln();
		});
	}

	/**
	 * 各要素に対してガンマ関数を計算する
	 * @returns ガンマ関数適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} division by zero
	 */
	public gamma(): this {
		return this.map((x) => {
			if (x instanceof BigFloat) return x.gamma();
			if (!x.isReal()) throw new TypeError("gamma is not supported for non-real complex numbers");
			return new BigFloatComplex(x.real.gamma(), 0, x.precision);
		});
	}

	/**
	 * 各要素に対してリーマンゼータ関数を計算する
	 * @returns ゼータ関数適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	public zeta(): this {
		return this.map((x) => {
			if (x instanceof BigFloat) return x.zeta();
			if (!x.isReal()) throw new TypeError("zeta is not supported for non-real complex numbers");
			return new BigFloatComplex(x.real.zeta(), 0, x.precision);
		});
	}

	/**
	 * 各要素に対して階乗を計算する
	 * @returns 階乗適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} division by zero
	 */
	public factorial(): this {
		return this.map((x) => {
			if (x instanceof BigFloat) return x.factorial();
			if (!x.isReal()) throw new TypeError("factorial is not supported for non-real complex numbers");
			return new BigFloatComplex(x.real.factorial(), 0, x.precision);
		});
	}

	/**
	 * ストリームの要素の中から最大値を返す (終端操作)
	 * @returns 最大値
	 * @throws {TypeError} ストリームが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public max(): BigFloatLike {
		const iter = this[Symbol.iterator]();
		const first = iter.next();
		if (first.done) throw new TypeError("No arguments provided");

		let result = first.value;
		for (let next = iter.next(); !next.done; next = iter.next()) {
			if ((next.value as BigFloat).gt(result)) result = next.value;
		}
		return result.clone() as BigFloatLike;
	}

	/**
	 * ストリームの要素の中から最小値を返す (終端操作)
	 * @returns 最小値
	 * @throws {TypeError} ストリームが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	public min(): BigFloatLike {
		const iter = this[Symbol.iterator]();
		const first = iter.next();
		if (first.done) throw new TypeError("No arguments provided");

		let result = first.value;
		for (let next = iter.next(); !next.done; next = iter.next()) {
			if ((next.value as BigFloat).lt(result)) result = next.value;
		}
		return result.clone() as BigFloatLike;
	}

	/**
	 * ストリームの全要素の合計を計算する (終端操作)
	 * @returns 合計
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public sum(): BigFloatLike {
		const iter = this[Symbol.iterator]();
		const first = iter.next();
		if (first.done) return new BigFloat(0);

		let total = first.value.clone();
		for (let next = iter.next(); !next.done; next = iter.next()) {
			total = total.add(next.value);
		}
		return total as BigFloatLike;
	}

	/**
	 * ストリームの全要素の積を計算する (終端操作)
	 * @returns 総乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public product(): BigFloatLike {
		const iter = this[Symbol.iterator]();
		const first = iter.next();
		if (first.done) return new BigFloat(1);

		let total = first.value.clone();
		for (let next = iter.next(); !next.done; next = iter.next()) {
			total = total.mul(next.value);
		}
		return total as BigFloatLike;
	}

	/**
	 * ストリームの全要素の平均値を計算する (終端操作)
	 * @returns 平均値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public average(): BigFloatLike {
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
	 * ストリームの要素の中央値を計算する (終端操作)
	 * @returns 中央値
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public median(): BigFloatLike {
		const arr = this.toArray();
		if (arr.length === 0) throw new TypeError("No arguments provided");
		const sorted = arr.sort((a, b) => (a as BigFloat).compare(b));
		const mid = Math.floor(sorted.length / 2);
		if (sorted.length % 2 === 1) {
			return sorted[mid].clone() as BigFloatLike;
		} else {
			return sorted[mid - 1].add(sorted[mid]).div(2);
		}
	}

	/**
	 * ストリームの要素の分散を計算する (終端操作)
	 * @returns 分散
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public variance(): BigFloatLike {
		const arr = this.toArray();
		if (arr.length === 0) throw new TypeError("No arguments provided");
		if (arr.length === 1) {
			const p = arr[0] instanceof BigFloat ? arr[0]._precision : arr[0].precision;
			return new BigFloat(0, p);
		}

		const n = arr.length;
		const meanVal = this.average();

		let sumSquares: BigFloatLike | null = null;
		for (const item of arr) {
			const diff = item.sub(meanVal);
			const sq = diff.mul(diff);
			if (sumSquares === null) {
				sumSquares = sq;
			} else {
				sumSquares = sumSquares.add(sq);
			}
		}

		return (sumSquares as BigFloatLike).div(n);
	}

	/**
	 * ストリームの要素の標準偏差を計算する (終端操作)
	 * @returns 標準偏差
	 * @throws {TypeError} 引数が空の場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} Division by zero
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	public stddev(): BigFloatLike {
		const varianceVal = this.variance();
		return varianceVal.sqrt();
	}
}
