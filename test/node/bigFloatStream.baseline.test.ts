import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { BigFloat as CurrentBigFloat, BigFloatStream as CurrentBigFloatStream } from "../../dist/BigFloat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const BASELINE_PATH = path.resolve(ROOT_DIR, "dev", "baseline", "JavaLibraryScript.js");

const EXACT_COUNT = 10000;
const BUILD_MIN_MS = 20;
const BUILD_ROUNDS = 7;
const BUILD_TOLERANCE = 1.1;

if (!fs.existsSync(BASELINE_PATH)) {
	throw new Error(`Baseline build not found: ${BASELINE_PATH}`);
}

type CurrentBigFloatCtor = typeof CurrentBigFloat;
type CurrentBigFloatStreamCtor = typeof CurrentBigFloatStream;
type BigFloatInstance = InstanceType<typeof CurrentBigFloat>;
type BigFloatStreamInstance = InstanceType<typeof CurrentBigFloatStream>;

const baselineSource = fs.readFileSync(BASELINE_PATH, "utf8");
const baselineRequire = vm.runInNewContext(
	baselineSource,
	{
		console,
		navigator: { userAgent: "node" },
		window: {},
		self: {},
	},
	{ filename: BASELINE_PATH },
);
const JavaLibraryScript = baselineRequire(16);
const OldBigFloat = JavaLibraryScript.math.BigFloat as CurrentBigFloatCtor;
OldBigFloat.config.extraPrecision = 6n;
const OldBigFloatStream = JavaLibraryScript.util.stream.BigFloatStream as CurrentBigFloatStreamCtor;
const identity = <T>(value: T): T => value;
const alwaysTrue = (): boolean => true;
const noop = (): void => {};

const operations = {
	map: {
		old(stream: BigFloatStreamInstance) {
			return stream.map(identity);
		},
		current(stream: BigFloatStreamInstance) {
			return stream.map(identity);
		},
	},
	flatMap: {
		old(stream: BigFloatStreamInstance) {
			return stream.flatMap((value: BigFloatInstance) => [value]);
		},
		current(stream: BigFloatStreamInstance) {
			return stream.flatMap((value: BigFloatInstance) => [value]);
		},
	},
	distinct: {
		old(stream: BigFloatStreamInstance) {
			return stream.distinct((value: BigFloatInstance) => value.toString());
		},
		current(stream: BigFloatStreamInstance) {
			return stream.distinct((value: BigFloatInstance) => value.toString());
		},
	},
	filter: {
		old(stream: BigFloatStreamInstance) {
			return stream.filter(alwaysTrue);
		},
		current(stream: BigFloatStreamInstance) {
			return stream.filter(alwaysTrue);
		},
	},
	peek: {
		old(stream: BigFloatStreamInstance) {
			return stream.peek(noop);
		},
		current(stream: BigFloatStreamInstance) {
			return stream.peek(noop);
		},
	},
	limit: {
		old(stream: BigFloatStreamInstance) {
			return stream.limit(EXACT_COUNT);
		},
		current(stream: BigFloatStreamInstance) {
			return stream.limit(EXACT_COUNT);
		},
	},
	skip: {
		old(stream: BigFloatStreamInstance) {
			return stream.skip(1);
		},
		current(stream: BigFloatStreamInstance) {
			return stream.skip(1);
		},
	},
};

function makeOldBase() {
	return new OldBigFloatStream([new OldBigFloat("1", 20)]);
}

function makeCurrentBase() {
	return CurrentBigFloatStream.of(new CurrentBigFloat("1", 20));
}

function buildOld(name: keyof typeof operations, count: number) {
	let stream = makeOldBase();
	for (let i = 0; i < count; i++) stream = operations[name].old(stream);
	return stream;
}

function buildCurrent(name: keyof typeof operations, count: number) {
	let stream = makeCurrentBase();
	for (let i = 0; i < count; i++) stream = operations[name].current(stream);
	return stream;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return (sorted[middle - 1] + sorted[middle]) / 2;
	}
	return sorted[middle];
}

function timed<T>(fn: () => T): { ms: number; value: T } {
	const start = performance.now();
	const value = fn();
	return { ms: performance.now() - start, value };
}

function pairwise(runOld: () => unknown, runCurrent: () => unknown, rounds = BUILD_ROUNDS): { oldMs: number; currentMs: number } {
	const oldSamples: number[] = [];
	const currentSamples: number[] = [];
	for (let i = 0; i < rounds; i++) {
		if (i % 2 === 0) {
			oldSamples.push(timed(runOld).ms);
			currentSamples.push(timed(runCurrent).ms);
		} else {
			currentSamples.push(timed(runCurrent).ms);
			oldSamples.push(timed(runOld).ms);
		}
	}
	return { oldMs: median(oldSamples), currentMs: median(currentSamples) };
}

function resolveBuildCount(name: keyof typeof operations): number {
	let count = EXACT_COUNT;
	while (count <= 10000000) {
		const result = pairwise(
			() => buildOld(name, count),
			() => buildCurrent(name, count),
		);
		if (result.oldMs >= BUILD_MIN_MS || result.currentMs >= BUILD_MIN_MS) {
			return count;
		}
		count *= 10;
	}
	return 10000000;
}

function tryRun<T>(fn: () => T): { ok: true; value: T; ms: number } | { ok: false; message: string } {
	try {
		const result = timed(fn);
		return { ok: true, value: result.value, ms: result.ms };
	} catch (error) {
		return { ok: false, message: error instanceof Error ? error.message : String(error) };
	}
}

function makeOldSeries(size = 256) {
	return new OldBigFloatStream(Array.from({ length: size }, (_, index) => new OldBigFloat(index + 1, 40)));
}

function makeCurrentSeries(size = 256) {
	return CurrentBigFloatStream.from(Array.from({ length: size }, (_, index) => new CurrentBigFloat(index + 1, 40)));
}

type ExecutionBenchmarkCase = {
	name: string;
	old: () => unknown;
	current: () => unknown;
};

const executionBenchmarks: ExecutionBenchmarkCase[] = [
	{
		name: "map+count",
		old: () =>
			makeOldSeries()
				.map((value: BigFloatInstance) => value.mul(new OldBigFloat(2, 40)))
				.count(),
		current: () =>
			makeCurrentSeries()
				.map((value: BigFloatInstance) => value.mul(new CurrentBigFloat(2, 40)))
				.count(),
	},
	{
		name: "filter+count",
		old: () =>
			makeOldSeries()
				.filter((value: BigFloatInstance) => value.mod(new OldBigFloat(2, 40)).isZero())
				.count(),
		current: () =>
			makeCurrentSeries()
				.filter((value: BigFloatInstance) => value.mod(new CurrentBigFloat(2, 40)).isZero())
				.count(),
	},
	{
		name: "flatMap+count",
		old: () =>
			makeOldSeries(64)
				.flatMap((value: BigFloatInstance) => [value, value.add(new OldBigFloat(1, 40))])
				.count(),
		current: () =>
			makeCurrentSeries(64)
				.flatMap((value: BigFloatInstance) => [value, value.add(new CurrentBigFloat(1, 40))])
				.count(),
	},
	{
		name: "distinct+count",
		old: () =>
			makeOldSeries(64)
				.flatMap((value: BigFloatInstance) => [value.mod(new OldBigFloat(7, 40))])
				.distinct((value: BigFloatInstance) => value.toString())
				.count(),
		current: () =>
			makeCurrentSeries(64)
				.flatMap((value: BigFloatInstance) => [value.mod(new CurrentBigFloat(7, 40))])
				.distinct((value: BigFloatInstance) => value.toString())
				.count(),
	},
	{
		name: "skip+limit+count",
		old: () => makeOldSeries(256).skip(8).limit(64).count(),
		current: () => makeCurrentSeries(256).skip(8).limit(64).count(),
	},
	{
		name: "changePrecision+count",
		old: () => makeOldSeries(64).changePrecision(20).count(),
		current: () => makeCurrentSeries(64).changePrecision(20).count(),
	},
	{
		name: "pow+count",
		old: () => makeOldSeries(32).pow(new OldBigFloat(2, 40)).count(),
		current: () => makeCurrentSeries(32).pow(new CurrentBigFloat(2, 40)).count(),
	},
	{
		name: "sqrt+count",
		old: () => new OldBigFloatStream([new OldBigFloat("4", 40), new OldBigFloat("9", 40), new OldBigFloat("16", 40)]).sqrt().count(),
		current: () => CurrentBigFloatStream.of(new CurrentBigFloat("4", 40), new CurrentBigFloat("9", 40), new CurrentBigFloat("16", 40)).sqrt().count(),
	},
];

test("BigFloatStream baseline build overhead", (t) => {
	for (const name of Object.keys(operations) as Array<keyof typeof operations>) {
		const count = resolveBuildCount(name);
		const result = pairwise(
			() => buildOld(name, count),
			() => buildCurrent(name, count),
		);
		t.diagnostic(`${name}@${count}: baseline=${result.oldMs.toFixed(2)}ms current=${result.currentMs.toFixed(2)}ms`);
		assert.ok(result.currentMs <= result.oldMs * BUILD_TOLERANCE, `${name} build overhead regression: baseline=${result.oldMs.toFixed(2)}ms current=${result.currentMs.toFixed(2)}ms`);
	}
});

test("BigFloatStream deep map chain stays executable", (t) => {
	const baseline = tryRun(() => buildOld("map", EXACT_COUNT).findFirst());
	const current = tryRun(() => buildCurrent("map", EXACT_COUNT).findFirst());
	t.diagnostic(`baseline map+findFirst@${EXACT_COUNT}: ${baseline.ok ? `${baseline.ms.toFixed(2)}ms` : baseline.message}`);
	t.diagnostic(`current map+findFirst@${EXACT_COUNT}: ${current.ok ? `${current.ms.toFixed(2)}ms` : current.message}`);
	assert.ok(current.ok, `current BigFloatStream should execute ${EXACT_COUNT} no-op map stages without stack overflow`);
});

test("BigFloatStream execution throughput stays within baseline tolerance", (t) => {
	for (const benchmark of executionBenchmarks) {
		const result = pairwise(benchmark.old, benchmark.current);
		t.diagnostic(`${benchmark.name}: baseline=${result.oldMs.toFixed(2)}ms current=${result.currentMs.toFixed(2)}ms`);
	}
});
