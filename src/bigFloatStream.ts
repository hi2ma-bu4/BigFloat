import { BigFloat } from "./bigFloat";
import type { BigFloatStreamValue, BigFloatValue, PrecisionValue } from "./types";

type BigFloatIterator = Iterator<BigFloat, void, undefined>;
type BigFloatStreamFactory = () => BigFloatIterator;
type BigFloatStreamFrame = { iterator: Iterator<BigFloat, void, undefined>; stageIndex: number };
type BigFloatStreamStageSignal = BigFloat | typeof BIGFLOAT_STREAM_SKIP;
type BigFloatStreamStageContext = {
	pushIterator: (iterator: Iterator<BigFloat, void, undefined>, stageIndex: number) => void;
	stop: () => void;
};
type BigFloatStreamStageDefinition = {
	createState: (data: unknown) => unknown;
	process: (value: BigFloat, state: unknown, data: unknown, context: BigFloatStreamStageContext, nextStageIndex: number) => BigFloatStreamStageSignal;
};
type BigFloatStreamStage = {
	definition: BigFloatStreamStageDefinition;
	data: unknown;
};
type BigFloatStreamRandomOptions = {
	min?: BigFloatStreamValue;
	max?: BigFloatStreamValue;
	precision?: PrecisionValue;
};

const BIGFLOAT_STREAM_SKIP = Symbol("BIGFLOAT_STREAM_SKIP");

/**
 * BigFloat-specific Stream (Lazy List)
 */
export class BigFloatStream implements Iterable<BigFloat> {
	/** mapステージ定義 */
	private static readonly _mapStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data) => (data as (item: BigFloat) => BigFloat)(value),
	};
	/** filterステージ定義 */
	private static readonly _filterStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data) => ((data as (item: BigFloat) => boolean)(value) ? value : BIGFLOAT_STREAM_SKIP),
	};
	/** peekステージ定義 */
	private static readonly _peekStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data) => {
			(data as (item: BigFloat) => void)(value);
			return value;
		},
	};
	/** flatMapステージ定義 */
	private static readonly _flatMapStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => null,
		process: (value, _state, data, context, nextStageIndex) => {
			context.pushIterator(BigFloatStream._toIterator((data as (item: BigFloat) => Iterable<BigFloatStreamValue>)(value), value._precision), nextStageIndex);
			return BIGFLOAT_STREAM_SKIP;
		},
	};
	/** distinctステージ定義 */
	private static readonly _distinctStageDefinition: BigFloatStreamStageDefinition = {
		createState: () => new Set<unknown>(),
		process: (value, state, data) => {
			const seen = state as Set<unknown>;
			const key = (data as (item: BigFloat) => unknown)(value);
			if (seen.has(key)) return BIGFLOAT_STREAM_SKIP;
			seen.add(key);
			return value;
		},
	};
	/** limitステージ定義 */
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
	/** skipステージ定義 */
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

	/** 内部イテレータファクトリ */
	private _sourceFactory: BigFloatStreamFactory;
	/** 直前のストリーム */
	private _previousStream: BigFloatStream | null;
	/** 現在のステージ定義 */
	private _stageDefinition: BigFloatStreamStageDefinition | null;
	/** 現在のステージデータ */
	private _stageData: unknown;

	/**
	 * @param source - BigFloatの反復可能オブジェクト
	 */
	constructor(source: Iterable<BigFloat> | BigFloatStreamFactory) {
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
	protected static _fromState(sourceFactory: BigFloatStreamFactory, previousStream: BigFloatStream | null, stageDefinition: BigFloatStreamStageDefinition | null, stageData: unknown): BigFloatStream {
		const stream = Object.create(BigFloatStream.prototype) as BigFloatStream;
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
	protected static _toBigFloat(value: BigFloatStreamValue, precision?: bigint): BigFloat {
		if (value instanceof BigFloat) {
			if (precision === undefined || value._precision === precision) return value;
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
	protected static _toIterator(iterable: Iterable<BigFloatStreamValue>, precision?: bigint): IterableIterator<BigFloat, void, undefined> {
		return (function* () {
			for (const item of iterable) {
				yield BigFloatStream._toBigFloat(item, precision);
			}
		})();
	}

	/**
	 * ストリームの精度を解決する
	 * @param values - 値
	 * @param precision - 明示精度
	 * @returns 精度
	 */
	protected static _resolvePrecision(values: BigFloatStreamValue[], precision?: PrecisionValue): bigint {
		if (precision !== undefined) return BigInt(precision);
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
	protected static _normalizeCount(count: number): number {
		if (!Number.isFinite(count)) throw new RangeError("Count must be finite");
		const normalized = Math.trunc(count);
		if (normalized < 0) throw new RangeError("Count must be non-negative");
		return normalized;
	}

	/**
	 * 空のストリームを生成する
	 * @returns 空のストリーム
	 */
	public static empty(): BigFloatStream {
		return new BigFloatStream(() => [][Symbol.iterator]());
	}

	/**
	 * 反復可能オブジェクトからBigFloatStreamを作成する
	 * @param iterable - BigFloatの反復可能オブジェクト
	 * @param precision - 変換時の精度
	 * @returns BigFloatStreamインスタンス
	 */
	public static from(iterable: Iterable<BigFloatStreamValue>, precision?: PrecisionValue): BigFloatStream {
		if (precision === undefined) {
			return new BigFloatStream(function* () {
				for (const item of iterable) {
					yield item instanceof BigFloat ? item : new BigFloat(item);
				}
			});
		}

		const precisionBig = BigInt(precision);
		return new BigFloatStream(function* () {
			for (const item of iterable) {
				yield BigFloatStream._toBigFloat(item, precisionBig);
			}
		});
	}

	/**
	 * 値のリストからBigFloatStreamを作成する
	 * @param values - 値のリスト
	 * @returns BigFloatStreamインスタンス
	 */
	public static of(...values: BigFloatStreamValue[]): BigFloatStream {
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
	public static arithmetic(start: BigFloatStreamValue, step: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, step], precision);

		return new BigFloatStream(function* () {
			let current = BigFloatStream._toBigFloat(start, resolvedPrecision);
			const stepValue = BigFloatStream._toBigFloat(step, resolvedPrecision);
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
	public static geometric(start: BigFloatStreamValue, ratio: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, ratio], precision);

		return new BigFloatStream(function* () {
			let current = BigFloatStream._toBigFloat(start, resolvedPrecision);
			const ratioValue = BigFloatStream._toBigFloat(ratio, resolvedPrecision);
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
	public static linspace(start: BigFloatStreamValue, end: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, end], precision);

		return new BigFloatStream(function* () {
			const startValue = BigFloatStream._toBigFloat(start, resolvedPrecision);
			if (normalizedCount === 1) {
				yield startValue;
				return;
			}

			const endValue = BigFloatStream._toBigFloat(end, resolvedPrecision);
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
	public static logspace(start: BigFloatStreamValue, end: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([start, end], precision);

		return new BigFloatStream(function* () {
			const base = new BigFloat(10, resolvedPrecision);
			const startValue = BigFloatStream._toBigFloat(start, resolvedPrecision);
			let current = base.pow(startValue);
			if (normalizedCount === 1) {
				yield current;
				return;
			}

			const endValue = BigFloatStream._toBigFloat(end, resolvedPrecision);
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
	public static harmonic(count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = precision === undefined ? 20n : BigInt(precision);

		return new BigFloatStream(function* () {
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
	public static random(count: number, options: BigFloatStreamRandomOptions = {}): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const min = options.min ?? 0;
		const max = options.max ?? 1;
		const resolvedPrecision = this._resolvePrecision([min, max], options.precision);

		return new BigFloatStream(function* () {
			const minValue = BigFloatStream._toBigFloat(min, resolvedPrecision);
			const maxValue = BigFloatStream._toBigFloat(max, resolvedPrecision);
			const span = maxValue.sub(minValue);
			if (span.lt(0)) throw new RangeError("Random range requires max >= min");
			if (span.isZero()) {
				yield* BigFloatStream.repeat(minValue, normalizedCount, resolvedPrecision);
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
	public static repeat(value: BigFloatStreamValue, count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = this._resolvePrecision([value], precision);

		return new BigFloatStream(function* () {
			const baseValue = BigFloatStream._toBigFloat(value, resolvedPrecision);
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
	public static fibonacci(count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = precision === undefined ? 20n : BigInt(precision);

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
	 * 階乗列を生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStreamインスタンス
	 */
	public static factorial(count: number, precision?: PrecisionValue): BigFloatStream {
		const normalizedCount = this._normalizeCount(count);
		if (normalizedCount === 0) return this.empty();
		const resolvedPrecision = precision === undefined ? 20n : BigInt(precision);

		return new BigFloatStream(function* () {
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
	public static range(start: BigFloatStreamValue, end?: BigFloatStreamValue, step: BigFloatStreamValue = 1, precision?: PrecisionValue): BigFloatStream {
		const actualStart = end === undefined ? 0 : start;
		const actualEnd = end === undefined ? start : end;
		const resolvedPrecision = this._resolvePrecision([actualStart, actualEnd, step], precision);

		return new BigFloatStream(function* () {
			let current = BigFloatStream._toBigFloat(actualStart, resolvedPrecision);
			const endValue = BigFloatStream._toBigFloat(actualEnd, resolvedPrecision);
			const stepValue = BigFloatStream._toBigFloat(step, resolvedPrecision);
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
	public clone(): BigFloatStream {
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
	protected _fork(sourceFactory: BigFloatStreamFactory = this._sourceFactory, previousStream: BigFloatStream | null = this._previousStream, stageDefinition: BigFloatStreamStageDefinition | null = this._stageDefinition, stageData: unknown = this._stageData): this {
		return BigFloatStream._fromState(sourceFactory, previousStream, stageDefinition, stageData) as this;
	}

	/**
	 * パイプラインステージを追加する
	 * @param stage - ステージ
	 * @returns 新しいストリーム
	 */
	protected _use(stage: BigFloatStreamStage): this {
		return this._fork(this._sourceFactory, this, stage.definition, stage.data);
	}

	/**
	 * パイプラインを配列化する
	 * @returns ステージ配列
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
	 * 各要素を変換する
	 * @param fn - 変換関数
	 * @returns 変換されたストリーム
	 */
	public map(fn: (item: BigFloat) => BigFloat): this {
		return this._use({ definition: BigFloatStream._mapStageDefinition, data: fn });
	}

	/**
	 * 要素をフィルタリングする
	 * @param fn - 判定関数
	 * @returns フィルタリングされたストリーム
	 */
	public filter(fn: (item: BigFloat) => boolean): this {
		return this._use({ definition: BigFloatStream._filterStageDefinition, data: fn });
	}

	/**
	 * 要素を平坦化して変換する
	 * @param fn - 変換関数
	 * @returns 平坦化されたストリーム
	 */
	public flatMap(fn: (item: BigFloat) => Iterable<BigFloatStreamValue>): this {
		return this._use({ definition: BigFloatStream._flatMapStageDefinition, data: fn });
	}

	/**
	 * 重複を除去する
	 * @param keyFn - キー生成関数
	 * @returns 重複が除去されたストリーム
	 */
	public distinct(keyFn: (item: BigFloat) => unknown = (x) => x.toString()): this {
		return this._use({ definition: BigFloatStream._distinctStageDefinition, data: keyFn });
	}

	/**
	 * 要素をソートする (終端操作ではないが、全要素を内部で保持する)
	 * @param compareFn - 比較関数
	 * @returns ソートされたストリーム
	 */
	public sorted(compareFn: (a: BigFloat, b: BigFloat) => number = (a, b) => a.compare(b)): this {
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
	 * 各要素に対してアクションを実行する (ストリームは維持)
	 * @param fn - アクション関数
	 * @returns 自身
	 */
	public peek(fn: (item: BigFloat) => void): this {
		return this._use({ definition: BigFloatStream._peekStageDefinition, data: fn });
	}

	/**
	 * 各要素に対してアクションを実行する (ストリームは維持)
	 * @param fn - アクション関数
	 * @returns 自身
	 */
	public tap(fn: (item: BigFloat) => void): this {
		return this.peek(fn);
	}

	/**
	 * 要素数を制限する
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
	 * 要素数を制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	public take(n: number): this {
		return this.limit(n);
	}

	/**
	 * 指定した要素数をスキップする
	 * @param n - スキップする数
	 * @returns スキップされたストリーム
	 */
	public skip(n: number): this {
		if (n <= 0) return this;
		return this._use({ definition: BigFloatStream._skipStageDefinition, data: n });
	}

	/**
	 * 指定した要素数をスキップする
	 * @param n - スキップする数
	 * @returns スキップされたストリーム
	 */
	public drop(n: number): this {
		return this.skip(n);
	}

	/**
	 * 末尾にストリームを連結する
	 * @param iterables - 連結するストリーム
	 * @returns 連結後のストリーム
	 */
	public concat(...iterables: Iterable<BigFloatStreamValue>[]): this {
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
	 * イテレータの実装
	 * @returns イテレータ
	 */
	public [Symbol.iterator](): Iterator<BigFloat, void, undefined> {
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
	 * 各要素に対して処理を実行する (終端操作)
	 * @param fn - 処理関数
	 */
	public forEach(fn: (item: BigFloat) => void): void {
		for (const item of this) fn(item);
	}

	/**
	 * 配列に変換する (終端操作)
	 * @returns 要素の配列
	 */
	public toArray(): BigFloat[] {
		const values: BigFloat[] = [];
		for (const item of this) values.push(item);
		return values;
	}

	/**
	 * 配列に変換する (終端操作)
	 * @returns 要素の配列
	 */
	public collect(): BigFloat[] {
		return this.toArray();
	}

	/**
	 * 畳み込み処理を行う (終端操作)
	 * @param fn - 畳み込み関数
	 * @param initial - 初期値
	 * @returns 畳み込み結果
	 */
	public reduce<U>(fn: (acc: U, item: BigFloat) => U, initial: U): U {
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
	public count(): number {
		let count = 0;
		for (const _ of this) count++;
		return count;
	}

	/**
	 * ストリームが空かどうか判定する
	 * @returns 空ならtrue
	 */
	public isEmpty(): boolean {
		return this.findFirst() === undefined;
	}

	/**
	 * いずれかの要素が条件を満たすか判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns 満たす要素があればtrue
	 */
	public some(fn: (item: BigFloat) => boolean): boolean {
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
	public every(fn: (item: BigFloat) => boolean): boolean {
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
	public find(fn: (item: BigFloat) => boolean): BigFloat | undefined {
		for (const item of this) {
			if (fn(item)) return item;
		}
		return undefined;
	}

	/**
	 * 最初の要素を返す (終端操作)
	 * @returns 最初の要素、空の場合はundefined
	 */
	public findFirst(): BigFloat | undefined {
		for (const item of this) return item;
		return undefined;
	}

	/**
	 * 最初の要素を返す (終端操作)
	 * @returns 最初の要素、空の場合はundefined
	 */
	public first(): BigFloat | undefined {
		return this.findFirst();
	}

	/**
	 * 指定位置の要素を返す (終端操作)
	 * @param index - インデックス
	 * @returns 要素、存在しない場合はundefined
	 */
	public at(index: number): BigFloat | undefined {
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
	 * @returns 精度が変更されたストリーム
	 */
	public changePrecision(precision: PrecisionValue): this {
		const precisionBig = BigInt(precision);
		return this.map((x) => x.clone().changePrecision(precisionBig));
	}

	/**
	 * 各要素と指定値の相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差を要素ごとに計算したストリーム
	 */
	public relativeDiff(other: BigFloatValue): this {
		return this.map((x) => x.relativeDiff(other));
	}

	/**
	 * 各要素と指定値の絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差を要素ごとに計算したストリーム
	 */
	public absoluteDiff(other: BigFloatValue): this {
		return this.map((x) => x.absoluteDiff(other));
	}

	/**
	 * 各要素と指定値の百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分を要素ごとに計算したストリーム
	 */
	public percentDiff(other: BigFloatValue): this {
		return this.map((x) => x.percentDiff(other));
	}

	/**
	 * 各要素に加算する
	 * @param other - 加算する値
	 * @returns 加算後のストリーム
	 */
	public add(other: BigFloatValue): this {
		return this.map((x) => x.add(other));
	}

	/**
	 * 各要素から減算する
	 * @param other - 減算する値
	 * @returns 減算後のストリーム
	 */
	public sub(other: BigFloatValue): this {
		return this.map((x) => x.sub(other));
	}

	/**
	 * 各要素に乗算する
	 * @param other - 乗算する値
	 * @returns 乗算後のストリーム
	 */
	public mul(other: BigFloatValue): this {
		return this.map((x) => x.mul(other));
	}

	/**
	 * 各要素を除算する
	 * @param other - 除算する値
	 * @returns 除算後のストリーム
	 */
	public div(other: BigFloatValue): this {
		return this.map((x) => x.div(other));
	}

	/**
	 * 各要素の剰余を計算する
	 * @param other - 法
	 * @returns 剰余後のストリーム
	 */
	public mod(other: BigFloatValue): this {
		return this.map((x) => x.mod(other));
	}

	/**
	 * 各要素の符号を反転させる
	 * @returns 反転後のストリーム
	 */
	public neg(): this {
		return this.map((x) => x.neg());
	}

	/**
	 * 各要素の絶対値を取得する
	 * @returns 絶対値後のストリーム
	 */
	public abs(): this {
		return this.map((x) => x.abs());
	}

	/**
	 * 各要素の符号を取得する
	 * @returns 符号後のストリーム
	 */
	public sign(): this {
		return this.map((x) => x.sign());
	}

	/**
	 * 各要素の逆数を取得する
	 * @returns 逆数後のストリーム
	 */
	public reciprocal(): this {
		return this.map((x) => x.reciprocal());
	}

	/**
	 * 各要素の冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗後のストリーム
	 */
	public pow(exponent: BigFloatValue): this {
		return this.map((x) => x.pow(exponent));
	}

	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根後のストリーム
	 */
	public sqrt(): this {
		return this.map((x) => x.sqrt());
	}

	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根後のストリーム
	 */
	public cbrt(): this {
		return this.map((x) => x.cbrt());
	}

	/**
	 * 各要素のn乗根を計算する
	 * @param n - 指数
	 * @returns n乗根後のストリーム
	 */
	public nthRoot(n: number | bigint): this {
		return this.map((x) => x.nthRoot(n));
	}

	/**
	 * 各要素を切り下げる
	 * @returns 切り下げ後のストリーム
	 */
	public floor(): this {
		return this.map((x) => x.floor());
	}

	/**
	 * 各要素を切り上げる
	 * @returns 切り上げ後のストリーム
	 */
	public ceil(): this {
		return this.map((x) => x.ceil());
	}

	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後のストリーム
	 */
	public round(): this {
		return this.map((x) => x.round());
	}

	/**
	 * 各要素を0方向へ切り捨てる
	 * @returns 切り捨て後のストリーム
	 */
	public trunc(): this {
		return this.map((x) => x.trunc());
	}

	/**
	 * 各要素をFloat32相当に丸める
	 * @returns Float32相当へ丸めたストリーム
	 */
	public fround(): this {
		return this.map((x) => x.fround());
	}

	/**
	 * 各要素の先頭ゼロビット数を取得する
	 * @returns 先頭ゼロビット数のストリーム
	 */
	public clz32(): this {
		return this.map((x) => x.clz32());
	}

	/**
	 * 各要素の正弦を計算する
	 * @returns 正弦後のストリーム
	 */
	public sin(): this {
		return this.map((x) => x.sin());
	}

	/**
	 * 各要素の余弦を計算する
	 * @returns 余弦後のストリーム
	 */
	public cos(): this {
		return this.map((x) => x.cos());
	}

	/**
	 * 各要素の正接を計算する
	 * @returns 正接後のストリーム
	 */
	public tan(): this {
		return this.map((x) => x.tan());
	}

	/**
	 * 各要素の逆正弦を計算する
	 * @returns 逆正弦後のストリーム
	 */
	public asin(): this {
		return this.map((x) => x.asin());
	}

	/**
	 * 各要素の逆余弦を計算する
	 * @returns 逆余弦後のストリーム
	 */
	public acos(): this {
		return this.map((x) => x.acos());
	}

	/**
	 * 各要素の逆正接を計算する
	 * @returns 逆正接後のストリーム
	 */
	public atan(): this {
		return this.map((x) => x.atan());
	}

	/**
	 * 各要素と指定値から逆正接を計算する
	 * @param x - x座標
	 * @returns 逆正接後のストリーム
	 */
	public atan2(x: BigFloatValue): this {
		return this.map((value) => value.atan2(x));
	}

	/**
	 * 各要素の双曲線正弦を計算する
	 * @returns 双曲線正弦後のストリーム
	 */
	public sinh(): this {
		return this.map((x) => x.sinh());
	}

	/**
	 * 各要素の双曲線余弦を計算する
	 * @returns 双曲線余弦後のストリーム
	 */
	public cosh(): this {
		return this.map((x) => x.cosh());
	}

	/**
	 * 各要素の双曲線正接を計算する
	 * @returns 双曲線正接後のストリーム
	 */
	public tanh(): this {
		return this.map((x) => x.tanh());
	}

	/**
	 * 各要素の逆双曲線正弦を計算する
	 * @returns 逆双曲線正弦後のストリーム
	 */
	public asinh(): this {
		return this.map((x) => x.asinh());
	}

	/**
	 * 各要素の逆双曲線余弦を計算する
	 * @returns 逆双曲線余弦後のストリーム
	 */
	public acosh(): this {
		return this.map((x) => x.acosh());
	}

	/**
	 * 各要素の逆双曲線正接を計算する
	 * @returns 逆双曲線正接後のストリーム
	 */
	public atanh(): this {
		return this.map((x) => x.atanh());
	}

	/**
	 * 各要素の指数関数を計算する
	 * @returns 指数関数適用後のストリーム
	 */
	public exp(): this {
		return this.map((x) => x.exp());
	}

	/**
	 * 各要素の2冪指数関数を計算する
	 * @returns 2冪指数関数適用後のストリーム
	 */
	public exp2(): this {
		return this.map((x) => x.exp2());
	}

	/**
	 * 各要素のexp(x)-1を計算する
	 * @returns expm1適用後のストリーム
	 */
	public expm1(): this {
		return this.map((x) => x.expm1());
	}

	/**
	 * 各要素の自然対数を計算する
	 * @returns 自然対数後のストリーム
	 */
	public ln(): this {
		return this.map((x) => x.ln());
	}

	/**
	 * 各要素の任意底対数を計算する
	 * @param base - 底
	 * @returns 対数後のストリーム
	 */
	public log(base: BigFloatValue): this {
		return this.map((x) => x.log(base));
	}

	/**
	 * 各要素の底2対数を計算する
	 * @returns 底2対数後のストリーム
	 */
	public log2(): this {
		return this.map((x) => x.log2());
	}

	/**
	 * 各要素の底10対数を計算する
	 * @returns 底10対数後のストリーム
	 */
	public log10(): this {
		return this.map((x) => x.log10());
	}

	/**
	 * 各要素のlog(1+x)を計算する
	 * @returns log1p適用後のストリーム
	 */
	public log1p(): this {
		return this.map((x) => x.log1p());
	}

	/**
	 * 各要素のガンマ関数を計算する
	 * @returns ガンマ関数適用後のストリーム
	 */
	public gamma(): this {
		return this.map((x) => x.gamma());
	}

	/**
	 * 各要素のゼータ関数を計算する
	 * @returns ゼータ関数適用後のストリーム
	 */
	public zeta(): this {
		return this.map((x) => x.zeta());
	}

	/**
	 * 各要素の階乗を計算する
	 * @returns 階乗後のストリーム
	 */
	public factorial(): this {
		return this.map((x) => x.factorial());
	}

	/**
	 * 要素の最大値を返す (終端操作)
	 * @returns 最大値
	 */
	public max(): BigFloat {
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
	public min(): BigFloat {
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
	public sum(): BigFloat {
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
	public product(): BigFloat {
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
	public average(): BigFloat {
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
	public median(): BigFloat {
		return BigFloat.median(this.toArray());
	}

	/**
	 * 要素の分散を返す (終端操作)
	 * @returns 分散
	 */
	public variance(): BigFloat {
		return BigFloat.variance(this.toArray());
	}

	/**
	 * 要素の標準偏差を返す (終端操作)
	 * @returns 標準偏差
	 */
	public stddev(): BigFloat {
		return BigFloat.stddev(this.toArray());
	}
}
