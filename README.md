# BigFloat

[![GitHub License](https://img.shields.io/github/license/hi2ma-bu4/BigFloat)](https://github.com/hi2ma-bu4/BigFloat/blob/main/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/hi2ma-bu4/BigFloat?label=latest)](https://github.com/hi2ma-bu4/BigFloat/releases/latest)
[![GitHub Tag](https://img.shields.io/github/v/tag/hi2ma-bu4/BigFloat?label=newest)](https://github.com/hi2ma-bu4/BigFloat/releases)
[![jsDelivr hits (GitHub)](https://img.shields.io/jsdelivr/gh/hy/hi2ma-bu4/BigFloat?logo=jsdelivr&logoColor=%23fff)](https://cdn.jsdelivr.net/gh/hi2ma-bu4/BigFloat/dist/BigFloat.js)

[![GitHub repo size](https://img.shields.io/github/repo-size/hi2ma-bu4/BigFloat)](https://github.com/hi2ma-bu4/BigFloat)
[![GitHub js file size in bytes](https://img.shields.io/github/size/hi2ma-bu4/BigFloat/dist/BigFloat.js?label=BigFloat.js)](https://github.com/hi2ma-bu4/BigFloat/blob/main/dist/BigFloat.js)
[![GitHub minify js file size in bytes](https://img.shields.io/github/size/hi2ma-bu4/BigFloat/dist/BigFloat.min.js?label=BigFloat.min.js)](https://github.com/hi2ma-bu4/BigFloat/blob/main/dist/BigFloat.min.js)
[![GitHub d.ts file size in bytes](https://img.shields.io/github/size/hi2ma-bu4/BigFloat/dist/BigFloat.d.ts?label=BigFloat.d.ts)](https://github.com/hi2ma-bu4/BigFloat/blob/main/dist/BigFloat.d.ts)

JavaScript / TypeScript で高精度な浮動小数点演算を扱うためのライブラリです。

## 特徴

- 任意精度の四則演算、冪乗、対数、三角関数に対応
- `Infinity` / `-Infinity` / `NaN` を状態として扱う特殊値対応
- 複素数、ベクトル、行列演算を標準サポート
- `BigFloatStream` による連続計算・集計 API

[API一覧(自動生成)](./API.md)

## CDN

```txt
https://cdn.jsdelivr.net/gh/hi2ma-bu4/BigFloat/dist/BigFloat.js
```

## 基本例

<details open>
<summary><b>高精度演算と検証 (High Precision & Verification)</b></summary>

```ts
import { bigFloat, BigFloat } from "BigFloat";

// 100桁の精度で2の平方根を計算
const sqrt2 = new BigFloat(2, 100).sqrt();
console.log(sqrt2.toString()); 
// "1.4142135623730950488016887242096980785696718753769480731766797379907324784621070388503875343276415727"

// 精度検証: 100桁目が正しいか確認
console.log(sqrt2.toFixed(100).endsWith("727")); // true

// 1000桁の円周率
const pi = BigFloat.pi(1000);
console.log(pi.toString().startsWith("3.1415926535")); // true

// メソッドチェーン
const result = bigFloat(1, 100).add(2).mul(3).div(4).pow(2);
console.log(result.toNumber()); // 5.0625
```
</details>

<details>
<summary><b>特殊値の発生例 (Infinity & NaN)</b></summary>

```ts
import { bigFloat, BigFloat, SpecialValueState } from "BigFloat";

// ゼロ除算 -> Infinity
console.log(bigFloat(1).div(0).toString()); // "Infinity"

// 負の数の対数 -> NaN (複素数モードOFF時)
console.log(bigFloat(-1).ln().toString()); // "NaN"

// ゼロの自然対数 -> -Infinity
console.log(bigFloat(0).ln().toString()); // "-Infinity"

// ゼータ関数の極 (s=1) -> Infinity
console.log(bigFloat(1).zeta().toString()); // "Infinity"

// 特殊値の状態判定
const val = bigFloat(1).div(0);
console.log(val._specialState === SpecialValueState.POSITIVE_INFINITY); // true
```
</details>

<details>
<summary><b>複素数演算 (Complex Numbers)</b></summary>

```ts
import { bigFloatComplex, BigFloatComplex } from "BigFloat";

// オイラーの等式: e^(i*pi) + 1 = 0
const pi = BigFloatComplex.pi(100);
const i = BigFloatComplex.i(100);
const res = i.mul(pi).exp().add(1);
console.log(res.toString()); // "0 + 0i"

// 複素数の作成と演算
const z1 = bigFloatComplex("1+2i");
const z2 = bigFloatComplex({ re: 3, im: -4 });
console.log(z1.add(z2).toString()); // "4 - 2i"
console.log(z1.mul(z2).toString()); // "11 + 2i"
console.log(z1.pow(2).toString());  // "-3 + 4i"
```
</details>

<details>
<summary><b>行列・ベクトル演算 (Matrix & Vector)</b></summary>

```ts
import { BigFloatMatrix, BigFloatVector } from "BigFloat";

// 連立一次方程式 Ax = b を解く
const A = BigFloatMatrix.from([
    [2, 1],
    [1, 3]
]);
const b = BigFloatVector.from([5, 10]);
const x = A.solveVector(b);
console.log(x.toArray().map(v => v.toNumber())); // [1, 3]

// 行列の基本操作
const m1 = BigFloatMatrix.identity(3).mul(2); // 単位行列の2倍
const m2 = BigFloatMatrix.ones(3, 3);         // 全要素1の行列
const prod = m1.matmul(m2);                   // 行列積
console.log(prod.at(0, 0).toNumber());        // 2
```
</details>

<details>
<summary><b>ストリーム API・統計 (Stream & Statistics)</b></summary>

```ts
import { BigFloatStream } from "BigFloat";

// フィボナッチ数列の生成と集計
const sum = BigFloatStream.fibonacci(10).sum();
console.log(sum.toNumber()); // 143

// 数値リストからの統計量計算
const data = [10, 20, 30, 40, 50];
const stream = BigFloatStream.from(data);
console.log(stream.average().toNumber()); // 30
console.log(stream.stddev().toFixed(2));  // "14.14"
console.log(stream.max().toNumber());     // 50

// 関数適用（全要素を2倍して平方根を取る）
const processed = BigFloatStream.range(1, 5)
    .map(v => v.mul(2))
    .sqrt()
    .toArray();
```
</details>

<details>
<summary><b>高度な数学関数 (Advanced Functions)</b></summary>

```ts
import { bigFloat } from "BigFloat";

// リーマン・ゼータ関数 ζ(s)
console.log(bigFloat(2).zeta().toString()); // 1.644934... (π²/6)

// ガンマ関数 Γ(x) と 階乗
console.log(bigFloat(5).gamma().toString());    // 24 (4!)
console.log(bigFloat(0.5).gamma().toString());  // 1.772453... (√π)

// 指数積分 Ei(x) と 対数積分 li(x)
console.log(bigFloat(1).Ei().toString()); // 1.895117...
console.log(bigFloat(2).li().toString()); // 1.045163...

// 算術幾何平均 AGM(x, y)
console.log(bigFloat(1).agm(bigFloat(2).sqrt()).toString());
```
</details>

<details>
<summary><b>設定とカスタマイズ (Config & Rounding)</b></summary>

```ts
import { BigFloat, RoundingMode } from "BigFloat";

// 1. 丸めモード (RoundingMode)
BigFloat.config.roundingMode = RoundingMode.HALF_UP;
console.log(new BigFloat("1.25", 1).toString()); // "1.3"
BigFloat.config.roundingMode = RoundingMode.TRUNCATE;
console.log(new BigFloat("1.25", 1).toString()); // "1.2"

// 2. 破壊的演算 (mutateResult) - インスタンス生成を抑えメモリを節約
BigFloat.config.mutateResult = true;
const a = BigFloat.one(100);
a.add(2); // a自身が 3 に書き換わる
console.log(a.toNumber()); // 3

// 3. 特殊値の許可 (allowSpecialValues) - falseの場合Infinity等で例外
BigFloat.config.allowSpecialValues = false;
// bigFloat(1).div(0); // throws SpecialValuesDisabledError

// 4. 複素数許可 (allowComplexNumbers) - BigFloatと複素数の混在を許可
BigFloat.config.allowComplexNumbers = true;

// 5. 精度不一致の許可 (allowPrecisionMismatch) - 異なる精度の演算を許可
BigFloat.config.allowPrecisionMismatch = true;

// 6. 計算用の追加精度 (extraPrecision) - 内部計算で指定桁多く保持して誤差を抑制
BigFloat.config.extraPrecision = 10n;

// 7. 最大収束ステップ数 (trigFuncsMaxSteps, lnMaxSteps)
BigFloat.config.trigFuncsMaxSteps = 2000n;
BigFloat.config.lnMaxSteps = 2000n;
```
</details>

## 開発

```bash
npm install
npm run build
npm run test
```
