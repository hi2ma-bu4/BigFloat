import { BigFloat } from "./bigFloat";

/**
 * BigFloat-specific Stream (Lazy List)
 */
export class BigFloatStream implements Iterable<BigFloat> {
	private _iter: Iterator<BigFloat>;
	private _pipeline: Array<(iter: Iterator<BigFloat>) => Generator<BigFloat, void, unknown>>;

	/**
	 * @param source - Source iterable of BigFloat
	 */
	constructor(source: Iterable<BigFloat>) {
		this._iter = source[Symbol.iterator]();
		this._pipeline = [];
	}

	/**
	 * Create a BigFloatStream from an iterable
	 */
	static from(iterable: Iterable<BigFloat>): BigFloatStream {
		return new BigFloatStream(iterable);
	}

	/**
	 * Add a pipeline stage
	 */
	protected _use(fn: (iter: Iterator<BigFloat>) => Generator<BigFloat, void, unknown>): this {
		this._pipeline.push(fn);
		return this;
	}

	// ==================================================
	// Pipeline Operations
	// ==================================================

	/**
	 * Map each element
	 */
	map(fn: (item: BigFloat) => BigFloat): this {
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				yield fn(next.value);
			}
		});
	}

	/**
	 * Filter elements
	 */
	filter(fn: (item: BigFloat) => boolean): this {
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				if (fn(next.value)) yield next.value;
			}
		});
	}

	/**
	 * Flatten elements
	 */
	flatMap(fn: (item: BigFloat) => Iterable<BigFloat>): this {
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				yield* fn(next.value);
			}
		});
	}

	/**
	 * Distinct elements
	 */
	distinct(keyFn: (item: BigFloat) => any = (x) => x.toString()): this {
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
	 * Sort elements
	 */
	sorted(compareFn: (a: BigFloat, b: BigFloat) => number = (a, b) => a.compare(b)): this {
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
	 * Peek elements
	 */
	peek(fn: (item: BigFloat) => void): this {
		return this._use(function* (iter) {
			for (let next = iter.next(); !next.done; next = iter.next()) {
				fn(next.value);
				yield next.value;
			}
		});
	}

	/**
	 * Limit elements
	 */
	limit(n: number): this {
		return this._use(function* (iter) {
			let i = 0;
			for (let next = iter.next(); !next.done; next = iter.next()) {
				if (i++ >= n) break;
				yield next.value;
			}
		});
	}

	/**
	 * Skip elements
	 */
	skip(n: number): this {
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
	 * Iterator implementation
	 */
	[Symbol.iterator](): Iterator<BigFloat> {
		return this._pipeline.reduce((iter, fn) => fn(iter), this._iter);
	}

	// ==================================================
	// Terminal Operations
	// ==================================================

	/**
	 * ForEach operation
	 */
	forEach(fn: (item: BigFloat) => void): void {
		for (const item of this) fn(item);
	}

	/**
	 * Convert to array
	 */
	toArray(): BigFloat[] {
		return Array.from(this);
	}

	/**
	 * Reduce operation
	 */
	reduce<U>(fn: (acc: U, item: BigFloat) => U, initial: U): U {
		let acc = initial;
		for (const item of this) {
			acc = fn(acc, item);
		}
		return acc;
	}

	/**
	 * Count elements
	 */
	count(): number {
		let c = 0;
		for (const _ of this) c++;
		return c;
	}

	/**
	 * Check if some elements satisfy condition
	 */
	some(fn: (item: BigFloat) => boolean): boolean {
		for (const item of this) {
			if (fn(item)) return true;
		}
		return false;
	}

	/**
	 * Check if all elements satisfy condition
	 */
	every(fn: (item: BigFloat) => boolean): boolean {
		for (const item of this) {
			if (!fn(item)) return false;
		}
		return true;
	}

	/**
	 * Find first element
	 */
	findFirst(): BigFloat | undefined {
		for (const item of this) return item;
		return undefined;
	}

	// ====================================================================================================
	// * BigFloatStream specific methods
	// ====================================================================================================

	/**
	 * Change precision of all elements
	 */
	changePrecision(precision: number | bigint): this {
		return this.peek((x) => x.changePrecision(precision));
	}

	/** Add to each element */
	add(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.add(other));
	}
	/** Subtract from each element */
	sub(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.sub(other));
	}
	/** Multiply each element */
	mul(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.mul(other));
	}
	/** Divide each element */
	div(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.div(other));
	}
	/** Remainder of each element */
	mod(other: BigFloat | number | string | bigint): this {
		return this.map((x) => x.mod(other));
	}
	/** Negate each element */
	neg(): this {
		return this.map((x) => x.neg());
	}
	/** Absolute value of each element */
	abs(): this {
		return this.map((x) => x.abs());
	}
	/** Reciprocal of each element */
	reciprocal(): this {
		return this.map((x) => x.reciprocal());
	}
	/** Power of each element */
	pow(exponent: BigFloat | number | string | bigint): this {
		return this.map((x) => x.pow(exponent));
	}
	/** Square root of each element */
	sqrt(): this {
		return this.map((x) => x.sqrt());
	}
	/** Cube root of each element */
	cbrt(): this {
		return this.map((x) => x.cbrt());
	}
	/** n-th root of each element */
	nthRoot(n: number | bigint): this {
		return this.map((x) => x.nthRoot(n));
	}

	/** Max element */
	max(): BigFloat {
		return BigFloat.max(this.toArray());
	}
	/** Min element */
	min(): BigFloat {
		return BigFloat.min(this.toArray());
	}
	/** Sum of elements */
	sum(): BigFloat {
		return BigFloat.sum(this.toArray());
	}
	/** Product of elements */
	product(): BigFloat {
		return BigFloat.product(this.toArray());
	}
	/** Average of elements */
	average(): BigFloat {
		return BigFloat.average(this.toArray());
	}
	/** Median of elements */
	median(): BigFloat {
		return BigFloat.median(this.toArray());
	}
	/** Variance of elements */
	variance(): BigFloat {
		return BigFloat.variance(this.toArray());
	}
	/** Standard deviation of elements */
	stddev(): BigFloat {
		return BigFloat.stddev(this.toArray());
	}
}
