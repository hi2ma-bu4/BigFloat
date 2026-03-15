import { BigFloat } from "./bigFloat";

/**
 * BigFloat-specific Stream (Lazy List)
 */
export class BigFloatStream implements Iterable<BigFloat> {
	/** 内部イテレータ */
	private _iter: Iterator<BigFloat>;
	/** パイプラインステージのリスト */
	private _pipeline: Array<(iter: Iterator<BigFloat>) => Generator<BigFloat, void, unknown>>;

	/**
	 * @param source - BigFloatの反復可能オブジェクト
	 */
	constructor(source: Iterable<BigFloat>) {
		this._iter = source[Symbol.iterator]();
		this._pipeline = [];
	}

	/**
	 * 反復可能オブジェクトからBigFloatStreamを作成する
	 * @param iterable - BigFloatの反復可能オブジェクト
	 * @returns BigFloatStreamインスタンス
	 */
	public static from(iterable: Iterable<BigFloat>): BigFloatStream {
		return new BigFloatStream(iterable);
	}

	/**
	 * パイプラインステージを追加する
	 * @param fn - ステージ関数
	 * @returns 自身
	 */
	protected _use(fn: (iter: Iterator<BigFloat>) => Generator<BigFloat, void, unknown>): this {
		this._pipeline.push(fn);
		return this;
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
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				yield fn(next.value);
			}
		});
	}

	/**
	 * 要素をフィルタリングする
	 * @param fn - 判定関数
	 * @returns フィルタリングされたストリーム
	 */
	public filter(fn: (item: BigFloat) => boolean): this {
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				if (fn(next.value)) yield next.value;
			}
		});
	}

	/**
	 * 要素を平坦化して変換する
	 * @param fn - 変換関数
	 * @returns 平坦化されたストリーム
	 */
	public flatMap(fn: (item: BigFloat) => Iterable<BigFloat>): this {
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				yield* fn(next.value);
			}
		});
	}

	/**
	 * 重複を除去する
	 * @param keyFn - キー生成関数
	 * @returns 重複が除去されたストリーム
	 */
	public distinct(keyFn: (item: BigFloat) => any = (x) => x.toString()): this {
		return this._use(function* (iter) {
			const seen = new Set();
			for (let next = iter.next(); !next.done; next = iter.next()) {
				const key = keyFn(next.value);
				if (!seen.has(key)) {
					seen.add(key);
					yield next.value;
				}
			}
		});
	}

	/**
	 * 要素をソートする (終端操作ではないが、全要素を内部で保持する)
	 * @param compareFn - 比較関数
	 * @returns ソートされたストリーム
	 */
	public sorted(compareFn: (a: BigFloat, b: BigFloat) => number = (a, b) => a.compare(b)): this {
		return this._use(function* (iter) {
			const arr: BigFloat[] = [];
			for (let next = iter.next(); !next.done; next = iter.next()) {
				arr.push(next.value);
			}
			arr.sort(compareFn);
			yield* arr;
		});
	}

	/**
	 * 各要素に対してアクションを実行する (ストリームは維持)
	 * @param fn - アクション関数
	 * @returns 自身
	 */
	public peek(fn: (item: BigFloat) => void): this {
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				fn(next.value);
				yield next.value;
			}
		});
	}

	/**
	 * 要素数を制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	public limit(n: number): this {
		return this._use(function* (iter) {
			let i = 0;
			for (let next = iter.next(); !next.done; next = iter.next()) {
				if (i++ >= n) break;
				yield next.value;
			}
		});
	}

	/**
	 * 指定した要素数をスキップする
	 * @param n - スキップする数
	 * @returns スキップされたストリーム
	 */
	public skip(n: number): this {
		return this._use(function* (iter) {
			let i = 0;
			for (let next = iter.next(); !next.done; next = iter.next()) {
				if (i++ < n) continue;
				yield next.value;
			}
		});
	}

	// ==================================================
	// Iterator
	// ==================================================

	/**
	 * イテレータの実装
	 * @returns イテレータ
	 */
	public [Symbol.iterator](): Iterator<BigFloat> {
		return this._pipeline.reduce((iter, fn) => fn(iter), this._iter);
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
		return Array.from(this);
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
		let c = 0;
		for (const _ of this) c++;
		return c;
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
	 * 最初の要素を返す (終端操作)
	 * @returns 最初の要素、空の場合はundefined
	 */
	public findFirst(): BigFloat | undefined {
		for (const item of this) return item;
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
	public changePrecision(precision: number | bigint): this {
		return this.peek((x) => x.changePrecision(precision));
	}

	/**
	 * 各要素に加算する
	 * @param other - 加算する値
	 * @returns 加算後のストリーム
	 */
	public add(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.add(other));
	}

	/**
	 * 各要素から減算する
	 * @param other - 減算する値
	 * @returns 減算後のストリーム
	 */
	public sub(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.sub(other));
	}

	/**
	 * 各要素に乗算する
	 * @param other - 乗算する値
	 * @returns 乗算後のストリーム
	 */
	public mul(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.mul(other));
	}

	/**
	 * 各要素を除算する
	 * @param other - 除算する値
	 * @returns 除算後のストリーム
	 */
	public div(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.div(other));
	}

	/**
	 * 各要素の剰余を計算する
	 * @param other - 法
	 * @returns 剰余後のストリーム
	 */
	public mod(other: BigFloat | number | string | bigint): this {
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
	public pow(exponent: BigFloat | number | string | bigint): this {
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
	 * 要素の最大値を返す (終端操作)
	 * @returns 最大値
	 */
	public max(): BigFloat {
		return BigFloat.max(this.toArray());
	}

	/**
	 * 要素の最小値を返す (終端操作)
	 * @returns 最小値
	 */
	public min(): BigFloat {
		return BigFloat.min(this.toArray());
	}

	/**
	 * 要素の合計を返す (終端操作)
	 * @returns 合計
	 */
	public sum(): BigFloat {
		return BigFloat.sum(this.toArray());
	}

	/**
	 * 要素の積を返す (終端操作)
	 * @returns 積
	 */
	public product(): BigFloat {
		return BigFloat.product(this.toArray());
	}

	/**
	 * 要素の平均を返す (終端操作)
	 * @returns 平均
	 */
	public average(): BigFloat {
		return BigFloat.average(this.toArray());
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
