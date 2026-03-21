import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { BigFloat as CurrentBigFloat } from "../../dist/BigFloat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const BASELINE_PATH = path.resolve(ROOT_DIR, "dev", "baseline", "JavaLibraryScript.js");

const REGRESSION_PRECISION = 300;
const BENCHMARK_PRECISION = 300;
const BENCHMARK_MIN_DURATION_MS = 120;
const BENCHMARK_ROUNDS = 3;
const BENCHMARK_WARMUP_ITERATIONS = 1;
const BENCHMARK_TOLERANCE = 1.15;

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

type ComparableBigFloatCtor = typeof CurrentBigFloat;
type ComparableBigFloat = InstanceType<typeof CurrentBigFloat>;
type RegressionCase = {
	name: string;
	run: (BF: ComparableBigFloatCtor) => CurrentBigFloat;
};
type BenchmarkCase = {
	name: string;
	prepare: (BF: ComparableBigFloatCtor) => () => CurrentBigFloat;
};

const BaselineBigFloat = JavaLibraryScript.math.BigFloat as ComparableBigFloatCtor;
BaselineBigFloat.config.extraPrecision = 6n;

/**
 * 同じ計算を旧実装・新実装で実行して文字列を比較する
 */
function runCase(ctor: ComparableBigFloatCtor, runner: (BigFloatCtor: ComparableBigFloatCtor) => CurrentBigFloat, precision: number): { ok: boolean; value: string } {
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
		name: "sub",
		run: (BF) => new BF("123456789.123456789", REGRESSION_PRECISION).sub(new BF("0.000000000987654321", REGRESSION_PRECISION)),
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
		name: "mod",
		run: (BF) => new BF("12345.6789", REGRESSION_PRECISION).mod(new BF("98.76", REGRESSION_PRECISION)),
	},
	{
		name: "sqrt",
		run: (BF) => new BF("2", REGRESSION_PRECISION).sqrt(),
	},
	{
		name: "cbrt",
		run: (BF) => new BF("27.125", REGRESSION_PRECISION).cbrt(),
	},
	{
		name: "nthRoot",
		run: (BF) => new BF("81", REGRESSION_PRECISION).nthRoot(4),
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
		name: "pi",
		run: (BF) => BF.pi(REGRESSION_PRECISION),
	},
	{
		name: "e",
		run: (BF) => BF.e(REGRESSION_PRECISION),
	},
	{
		name: "tau",
		run: (BF) => BF.tau(REGRESSION_PRECISION),
	},
	{
		name: "parseFloat base2",
		run: (BF) => BF.parseFloat("101.101", REGRESSION_PRECISION, 2),
	},
	{
		name: "parseFloat base16",
		run: (BF) => BF.parseFloat("ff.8", REGRESSION_PRECISION, 16),
	},
];

const benchmarkCases: BenchmarkCase[] = [
	{
		name: "add",
		prepare: (BF) => {
			const a = new BF("123456789.123456789", BENCHMARK_PRECISION);
			const b = new BF("0.000000000987654321", BENCHMARK_PRECISION);
			return () => a.add(b);
		},
	},
	{
		name: "mul",
		prepare: (BF) => {
			const a = new BF("3.1415926535897932384626", BENCHMARK_PRECISION);
			const b = new BF("2.7182818284590452353602", BENCHMARK_PRECISION);
			return () => a.mul(b);
		},
	},
	{
		name: "div",
		prepare: (BF) => {
			const value = new BF("22", BENCHMARK_PRECISION);
			const divisor = new BF("7", BENCHMARK_PRECISION);
			return () => value.div(divisor);
		},
	},
	{
		name: "pow(1.2345, 3.5)",
		prepare: (BF) => {
			const value = new BF("1.2345", BENCHMARK_PRECISION);
			const exponent = new BF("3.5", BENCHMARK_PRECISION);
			return () => value.pow(exponent);
		},
	},
	{
		name: "sqrt(2)",
		prepare: (BF) => {
			const value = new BF("2", BENCHMARK_PRECISION);
			return () => value.sqrt();
		},
	},
	{
		name: "cbrt(27.125)",
		prepare: (BF) => {
			const value = new BF("27.125", BENCHMARK_PRECISION);
			return () => value.cbrt();
		},
	},
	{
		name: "nthRoot(81,4)",
		prepare: (BF) => {
			const value = new BF("81", BENCHMARK_PRECISION);
			return () => value.nthRoot(4);
		},
	},
	{
		name: "sin(0.5)",
		prepare: (BF) => {
			const value = new BF("0.5", BENCHMARK_PRECISION);
			return () => value.sin();
		},
	},
	{
		name: "cos(0.5)",
		prepare: (BF) => {
			const value = new BF("0.5", BENCHMARK_PRECISION);
			return () => value.cos();
		},
	},
	{
		name: "tan(0.5)",
		prepare: (BF) => {
			const value = new BF("0.5", BENCHMARK_PRECISION);
			return () => value.tan();
		},
	},
	{
		name: "asin(0.5)",
		prepare: (BF) => {
			const value = new BF("0.5", BENCHMARK_PRECISION);
			return () => value.asin();
		},
	},
	{
		name: "acos(0.5)",
		prepare: (BF) => {
			const value = new BF("0.5", BENCHMARK_PRECISION);
			return () => value.acos();
		},
	},
	{
		name: "atan(1.25)",
		prepare: (BF) => {
			const value = new BF("1.25", BENCHMARK_PRECISION);
			return () => value.atan();
		},
	},
	{
		name: "atan2(3.5, -1.25)",
		prepare: (BF) => {
			const y = new BF("3.5", BENCHMARK_PRECISION);
			const x = new BF("-1.25", BENCHMARK_PRECISION);
			return () => y.atan2(x);
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
		name: "exp2(1.2345)",
		prepare: (BF) => {
			const value = new BF("1.2345", BENCHMARK_PRECISION);
			return () => value.exp2();
		},
	},
	{
		name: "expm1(0.012345)",
		prepare: (BF) => {
			const value = new BF("0.012345", BENCHMARK_PRECISION);
			return () => value.expm1();
		},
	},
	{
		name: "ln(2.5)",
		prepare: (BF) => {
			const value = new BF("2.5", BENCHMARK_PRECISION);
			return () => value.ln();
		},
	},
	{
		name: "log(5, 2)",
		prepare: (BF) => {
			const value = new BF("5", BENCHMARK_PRECISION);
			const base = new BF("2", BENCHMARK_PRECISION);
			return () => value.log(base);
		},
	},
	{
		name: "log2(2.5)",
		prepare: (BF) => {
			const value = new BF("2.5", BENCHMARK_PRECISION);
			return () => value.log2();
		},
	},
	{
		name: "log10(2.5)",
		prepare: (BF) => {
			const value = new BF("2.5", BENCHMARK_PRECISION);
			return () => value.log10();
		},
	},
	{
		name: "gamma(4.5)",
		prepare: (BF) => {
			const value = new BF("4.5", BENCHMARK_PRECISION);
			return () => value.gamma();
		},
	},
	{
		name: "factorial(7.5)",
		prepare: (BF) => {
			const value = new BF("7.5", BENCHMARK_PRECISION);
			return () => value.factorial();
		},
	},
	{
		name: "pi()",
		prepare: (BF) => () => BF.pi(BENCHMARK_PRECISION),
	},
	{
		name: "e()",
		prepare: (BF) => () => BF.e(BENCHMARK_PRECISION),
	},
	{
		name: "tau()",
		prepare: (BF) => () => BF.tau(BENCHMARK_PRECISION),
	},
];

const gatedBenchmarks = new Set(["sin(0.5)", "exp(1.2345)", "ln(2.5)"]);

function getMedian(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return (sorted[middle - 1] + sorted[middle]) / 2;
	}
	return sorted[middle];
}

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
		const current = runCase(CurrentBigFloat, testCase.run, REGRESSION_PRECISION);
		assert.deepStrictEqual(current, baseline, `${testCase.name} regression mismatch`);
	}
});

test("Baseline Benchmark Comparison", (t) => {
	const benchmarkResults: Array<{ name: string; baselineMs: number; currentMs: number }> = [];
	for (const testCase of benchmarkCases) {
		const { baselineMs, currentMs } = benchmarkPair(BaselineBigFloat, CurrentBigFloat, testCase.prepare);
		benchmarkResults.push({ name: testCase.name, baselineMs, currentMs });
		if (gatedBenchmarks.has(testCase.name)) {
			assert.ok(currentMs <= baselineMs * BENCHMARK_TOLERANCE, `${testCase.name} benchmark regression: baseline=${baselineMs.toFixed(2)}ms/op current=${currentMs.toFixed(2)}ms/op`);
		}
	}

	for (const result of benchmarkResults) {
		t.diagnostic(`${result.name}: baseline=${result.baselineMs.toFixed(2)}ms/op current=${result.currentMs.toFixed(2)}ms/op`);
	}
});
