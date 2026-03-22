import { generateDtsBundle } from "dts-bundle-generator";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { analyzeThrows } from "./analyze-throws.mjs";

import pkg from "../package.json" with { type: "json" };
/* -------------------------------------------------------------------------- */
/* 設定値 */
/* -------------------------------------------------------------------------- */

/** プロジェクトルート */
const ROOT_DIR = process.cwd();

const INPUT_FILE_NAME = "index";
const OUTPUT_FILE_NAME = "BigFloat";

/** esbuild の出力先 */
const DIST_DIR = path.resolve(ROOT_DIR, "dist");

/** エントリーポイント */
const ENTRY_FILE = path.resolve(ROOT_DIR, `src/${INPUT_FILE_NAME}.ts`);

/* -------------------------------------------------------------------------- */
/* ユーティリティ */
/* -------------------------------------------------------------------------- */

/**
 * ディレクトリを安全に削除して再作成する
 * @param {string} dirPath
 */
function cleanDir(dirPath) {
	if (fs.existsSync(dirPath)) {
		fs.rmSync(dirPath, { recursive: true, force: true });
	}
	fs.mkdirSync(dirPath, { recursive: true });
}

/* -------------------------------------------------------------------------- */
/* esbuild */
/* -------------------------------------------------------------------------- */

const ESBUILD_COMMON = {
	entryPoints: [ENTRY_FILE],
	outdir: DIST_DIR,
	bundle: true,

	/* ESM / browser 前提 */
	format: "esm",
	platform: "browser",
	target: "es2024",

	sourcemap: true,
	minify: false,
	treeShaking: true,

	loader: {
		".wasm": "file",
	},

	supported: {
		"import-meta": true,
	},

	banner: {
		js: `/*!
 * ${OUTPUT_FILE_NAME} ${pkg.version}
 * Copyright ${new Date().getFullYear()} ${pkg.author}
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */`,
	},
};

/**
 * esbuild を実行する
 *
 * - ESM 出力
 * - import.meta を保持
 * - wasm は file loader
 */
async function buildJs() {
	console.log("📦 esbuild 開始...");

	await build({
		...ESBUILD_COMMON,
		entryNames: OUTPUT_FILE_NAME,
	});

	console.log("┗✅ esbuild 完了");
}

async function buildJsMin() {
	console.log("📦 esbuild (min) 開始...");

	await build({
		...ESBUILD_COMMON,
		entryNames: `${OUTPUT_FILE_NAME}.min`,
		minify: true,
	});

	console.log("┗✅ esbuild (min) 完了");
}

/* -------------------------------------------------------------------------- */
/* .d.ts */
/* -------------------------------------------------------------------------- */

/**
 * .d.ts を dist に生成する
 */
function buildTypes() {
	console.log("📐 型定義(.d.ts)生成開始...");

	const bundles = generateDtsBundle([
		{
			filePath: ENTRY_FILE,
			output: {
				noBanner: true,
			},
		},
	]);
	const outputPath = path.join(DIST_DIR, `${OUTPUT_FILE_NAME}.d.ts`);
	const content = bundles.join("\n");
	fs.writeFileSync(outputPath, content);

	console.log("┗✅ 型定義生成完了");
}

/* -------------------------------------------------------------------------- */
/* メイン処理 */
/* -------------------------------------------------------------------------- */

(async () => {
	try {
		console.log("🧹 dist クリーン中...");
		cleanDir(DIST_DIR);

		await Promise.all([
			//
			buildJs(),
			buildJsMin(),
		]);

		{
			console.log("🔍 Throws回収判定中...");
			const result = await analyzeThrows({
				rootDir: ROOT_DIR,
				allowedDynamicDirs: [],
			});

			if (result.length > 0) {
				for (const r of result) {
					console.warn(`┃ ${r.file}:${r.line} - ${r.message}`);
				}
				console.error(`┗🛑 未処理Throwsが${result.length}件検出されました`);
			} else {
				console.log("┗✅ Throws回収判定完了！");
			}
		}

		buildTypes();

		console.log("🎉 build 完了");
	} catch (err) {
		console.error("❌ build 失敗:", err);
		process.exit(1);
	}
})();
