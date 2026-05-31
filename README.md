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
- `BigFloatStream` による連続計算・集計 API を利用可能

[API一覧(自動生成)](./API.md)

## CDN

```txt
https://cdn.jsdelivr.net/gh/hi2ma-bu4/BigFloat/dist/BigFloat.js
```

## 基本例

```ts
import { bigFloat, BigFloat, BigFloatStream } from "BigFloat";

const value = bigFloat("1.234567890123456789", 80)
	.mul("3.5")
	.div("7");

console.log(value.toString()); // "0.6172839450617283945"

const root = new BigFloat("2", 100n).sqrt();
console.log(root.toString()); // "1.4142135623730950488016887242096980785696718753769480731766797379907324784621070388503875343276415727"

const sum = new BigFloatStream([1.1, 2.3, 5.8, 13.21]).sum();
console.log(sum.toString());

const special = bigFloat(1).div(0);
console.log(special.toString()); // Infinity
```

## 開発

```bash
npm install
npm run build
npm run test
```
