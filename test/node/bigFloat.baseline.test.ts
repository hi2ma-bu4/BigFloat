import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { BigFloat as CurrentBigFloat, type BigFloatValue } from "../../dist/BigFloat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const BASELINE_PATH = path.resolve(ROOT_DIR, "dev", "baseline", "JavaLibraryScript.js");

const REGRESSION_PRECISION = 1000;
const BENCHMARK_PRECISION = 1000;
const BENCHMARK_MIN_DURATION_MS = 250;
const BENCHMARK_ROUNDS = 5;
const BENCHMARK_WARMUP_ITERATIONS = 2;
const BENCHMARK_TOLERANCE = 1.1;

if (!fs.existsSync(BASELINE_PATH)) {
	throw new Error(`Baseline build not found: ${BASELINE_PATH}`);
}

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

type ComparableBigFloat = InstanceType<typeof CurrentBigFloat>;
type ComparableBigFloatCtor = {
	new (value?: BigFloatValue, precision?: number | bigint): ComparableBigFloat;
	config: {
		allowPrecisionMismatch: boolean;
		mutateResult: boolean;
		roundingMode: number;
		extraPrecision: bigint;
		piAlgorithm: number;
		trigFuncsMaxSteps: bigint;
		lnMaxSteps: bigint;
	};
	clearCache?: () => void;
	pi(precision: number | bigint): ComparableBigFloat;
	e(precision: number | bigint): ComparableBigFloat;
};
type RegressionCase = {
	name: string;
	run: (BF: ComparableBigFloatCtor) => ComparableBigFloat;
};
type BenchmarkCase = {
	name: string;
	prepare: (BF: ComparableBigFloatCtor) => () => ComparableBigFloat;
};

const BaselineBigFloat = JavaLibraryScript.math.BigFloat as ComparableBigFloatCtor;
BaselineBigFloat.config.extraPrecision = 6n;
const TypedCurrentBigFloat: ComparableBigFloatCtor = CurrentBigFloat;

/**
 * 同じ計算を旧実装・新実装で実行して文字列を比較する
 */
function runCase(ctor: ComparableBigFloatCtor, runner: (BigFloatCtor: ComparableBigFloatCtor) => ComparableBigFloat, precision: number): { ok: boolean; value: string } {
	if (typeof ctor.clearCache === "function") {
		ctor.clearCache();
	}
	try {
		const result = runner(ctor);
		const rendered = typeof result.toFixed === "function" ? result.toFixed(precision) : result.toString(10, precision);
		return { ok: true, value: rendered };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, value: message.replace(/^Error:\s*/, "") };
	}
}

const regressionCases: RegressionCase[] = [
	{
		name: "add",
		run: (BF) => new BF("123456789.123456789", REGRESSION_PRECISION).add(new BF("0.000000000987654321", REGRESSION_PRECISION)),
	},
	{
		name: "mul",
		run: (BF) => new BF("3.1415926535897932384626", REGRESSION_PRECISION).mul(new BF("2.7182818284590452353602", REGRESSION_PRECISION)),
	},
	{
		name: "div",
		run: (BF) => new BF("22", REGRESSION_PRECISION).div(new BF("7", REGRESSION_PRECISION)),
	},
	{
		name: "sqrt",
		run: (BF) => new BF("2", REGRESSION_PRECISION).sqrt(),
	},
	{
		name: "sin",
		run: (BF) => new BF("0.5", REGRESSION_PRECISION).sin(),
	},
	{
		name: "cos",
		run: (BF) => new BF("0.5", REGRESSION_PRECISION).cos(),
	},
	{
		name: "tan",
		run: (BF) => new BF("0.5", REGRESSION_PRECISION).tan(),
	},
	{
		name: "asin",
		run: (BF) => new BF("0.5", REGRESSION_PRECISION).asin(),
	},
	{
		name: "acos",
		run: (BF) => new BF("0.5", REGRESSION_PRECISION).acos(),
	},
	{
		name: "atan",
		run: (BF) => new BF("1.25", REGRESSION_PRECISION).atan(),
	},
	{
		name: "atan2",
		run: (BF) => new BF("3.5", REGRESSION_PRECISION).atan2(new BF("-1.25", REGRESSION_PRECISION)),
	},
	{
		name: "exp",
		run: (BF) => new BF("1.2345", REGRESSION_PRECISION).exp(),
	},
	{
		name: "exp2",
		run: (BF) => new BF("1.2345", REGRESSION_PRECISION).exp2(),
	},
	{
		name: "expm1",
		run: (BF) => new BF("0.012345", REGRESSION_PRECISION).expm1(),
	},
	{
		name: "ln",
		run: (BF) => new BF("2.5", REGRESSION_PRECISION).ln(),
	},
	{
		name: "log",
		run: (BF) => new BF("5", REGRESSION_PRECISION).log(new BF("2", REGRESSION_PRECISION)),
	},
	{
		name: "log2",
		run: (BF) => new BF("2.5", REGRESSION_PRECISION).log2(),
	},
	{
		name: "log10",
		run: (BF) => new BF("2.5", REGRESSION_PRECISION).log10(),
	},
	{
		name: "log1p",
		run: (BF) => new BF("0.012345", REGRESSION_PRECISION).log1p(),
	},
	{
		name: "pi",
		run: (BF) => BF.pi(REGRESSION_PRECISION),
	},
	{
		name: "e",
		run: (BF) => BF.e(REGRESSION_PRECISION),
	},
];

const benchmarkCases: BenchmarkCase[] = [
	{
		name: "sin(0.5)",
		prepare: (BF) => {
			const value = new BF("0.5", BENCHMARK_PRECISION);
			return () => value.sin();
		},
	},
	{
		name: "exp(1.2345)",
		prepare: (BF) => {
			const value = new BF("1.2345", BENCHMARK_PRECISION);
			return () => value.exp();
		},
	},
	{
		name: "ln(2.5)",
		prepare: (BF) => {
			const value = new BF("2.5", BENCHMARK_PRECISION);
			return () => value.ln();
		},
	},
];

/**
 * ベンチマーク結果の中央値を取得する
 */
function getMedian(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return (sorted[middle - 1] + sorted[middle]) / 2;
	}
	return sorted[middle];
}

/**
 * ベンチマークを一定時間交互に実行して1回あたりの時間を返す
 */
function measurePair(firstRunner: () => ComparableBigFloat, secondRunner: () => ComparableBigFloat): { firstMs: number; secondMs: number } {
	let firstChecksum = 0;
	let secondChecksum = 0;
	let firstIterations = 0;
	let secondIterations = 0;
	let firstElapsed = 0;
	let secondElapsed = 0;
	const start = performance.now();
	let totalElapsed = 0;
	do {
		const firstStart = performance.now();
		firstChecksum += Number(Boolean(firstRunner()));
		firstElapsed += performance.now() - firstStart;
		firstIterations++;

		const secondStart = performance.now();
		secondChecksum += Number(Boolean(secondRunner()));
		secondElapsed += performance.now() - secondStart;
		secondIterations++;

		totalElapsed = performance.now() - start;
	} while (totalElapsed < BENCHMARK_MIN_DURATION_MS);
	if (firstChecksum === 0 || secondChecksum === 0) {
		throw new Error("Unexpected empty benchmark result");
	}
	return {
		firstMs: firstElapsed / firstIterations,
		secondMs: secondElapsed / secondIterations,
	};
}

/**
 * ベンチマークを実行する
 */
function benchmarkPair(baselineCtor: ComparableBigFloatCtor, currentCtor: ComparableBigFloatCtor, prepare: (BigFloatCtor: ComparableBigFloatCtor) => () => ComparableBigFloat): { baselineMs: number; currentMs: number } {
	if (typeof baselineCtor.clearCache === "function") {
		baselineCtor.clearCache();
	}
	if (typeof currentCtor.clearCache === "function") {
		currentCtor.clearCache();
	}

	const baselineRunner = prepare(baselineCtor);
	const currentRunner = prepare(currentCtor);
	for (let i = 0; i < BENCHMARK_WARMUP_ITERATIONS; i++) {
		baselineRunner();
		currentRunner();
	}

	const baselineSamples = [];
	const currentSamples = [];
	for (let round = 0; round < BENCHMARK_ROUNDS; round++) {
		if (round % 2 === 0) {
			const sample = measurePair(baselineRunner, currentRunner);
			baselineSamples.push(sample.firstMs);
			currentSamples.push(sample.secondMs);
		} else {
			const sample = measurePair(currentRunner, baselineRunner);
			currentSamples.push(sample.firstMs);
			baselineSamples.push(sample.secondMs);
		}
	}
	return { baselineMs: getMedian(baselineSamples), currentMs: getMedian(currentSamples) };
}

test("Baseline Regression Comparison", () => {
	for (const testCase of regressionCases) {
		const baseline = runCase(BaselineBigFloat, testCase.run, REGRESSION_PRECISION);
		const current = runCase(TypedCurrentBigFloat, testCase.run, REGRESSION_PRECISION);
		assert.deepStrictEqual(current, baseline, `${testCase.name} regression mismatch`);
	}
});

test("Baseline Benchmark Comparison", (t) => {
	const benchmarkResults: Array<{ name: string; baselineMs: number; currentMs: number }> = [];
	for (const testCase of benchmarkCases) {
		const { baselineMs, currentMs } = benchmarkPair(BaselineBigFloat, TypedCurrentBigFloat, testCase.prepare);
		benchmarkResults.push({ name: testCase.name, baselineMs, currentMs });
		assert.ok(currentMs <= baselineMs * BENCHMARK_TOLERANCE, `${testCase.name} benchmark regression: baseline=${baselineMs.toFixed(2)}ms/op current=${currentMs.toFixed(2)}ms/op`);
	}

	for (const result of benchmarkResults) {
		t.diagnostic(`${result.name}: baseline=${result.baselineMs.toFixed(2)}ms/op current=${result.currentMs.toFixed(2)}ms/op`);
	}
});
