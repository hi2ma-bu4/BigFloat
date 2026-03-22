# BigFloat API

`npm run build:md` で自動生成された API リファレンスです。

## Contents

- [`bigFloat`](#bigfloat)
- [`BigFloat`](#bigfloat-1)
- [`BigFloatConfig`](#bigfloatconfig)
- [`BigFloatStream`](#bigfloatstream)
- [`BigFloatError`](#bigfloaterror)
- [`CacheNotInitializedError`](#cachenotinitializederror)
- [`DivisionByZeroError`](#divisionbyzeroerror)
- [`NumericalComputationError`](#numericalcomputationerror)
- [`PrecisionMismatchError`](#precisionmismatcherror)
- [`SpecialValuesDisabledError`](#specialvaluesdisablederror)
- [`RoundingMode`](#roundingmode)
- [`SpecialValueState`](#specialvaluestate)
- [`BigFloatAggregateArgs`](#bigfloataggregateargs)
- [`BigFloatOptions`](#bigfloatoptions)
- [`BigFloatStreamValue`](#bigfloatstreamvalue)
- [`BigFloatValue`](#bigfloatvalue)
- [`PrecisionValue`](#precisionvalue)

<a id="bigfloat"></a>

## `bigFloat`

#### `bigFloat`

```ts
bigFloat(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

BigFloat を作成する

**Parameters**
- `value`: 初期値
- `precision`: 精度

**Returns**: BigFloat インスタンス

<a id="bigfloat-1"></a>

## `BigFloat`

大きな浮動小数点数を扱えるクラス

```ts
class BigFloat
```

### Constructor

#### `constructor`

```ts
constructor(value?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

大きな浮動小数点数を扱えるクラス

**Parameters**
- `value`: 初期値
- `precision`: 精度

**Throws**: 精度が不正な場合

### Static Properties

#### `MAX_PRECISION`

```ts
MAX_PRECISION: bigint
```

最大精度 (Stringの限界)

#### `LAZY_NORMALIZE_SMALL_THRESHOLD`

```ts
LAZY_NORMALIZE_SMALL_THRESHOLD: bigint
```

レイジー正規化の閾値

#### `DEFAULT_PRECISION`

```ts
DEFAULT_PRECISION: bigint
```

デフォルトの精度

#### `config`

```ts
config: BigFloatConfig
```

設定

### Static Methods

#### `clearCache`

```ts
clearCache(): void
```

キャッシュをクリアする

#### `clone`

```ts
clone(): BigFloat
```

クラスを複製する (設定複製用)

**Returns**: 複製されたクラス

#### `parseFloat`

```ts
parseFloat(str: string | number | bigint | BigFloat, precision?: number | bigint, base?: number): BigFloat
```

文字列を数値に変換する

**Parameters**
- `str`: 変換する文字列
- `precision`: 小数点以下の桁数
- `base`: 基数

**Returns**: 変換されたBigFloatインスタンス

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 不正な文字が含まれている場合

#### `e`

```ts
e(precision?: number | bigint): BigFloat
```

自然対数の底(e)を取得する

**Parameters**
- `precision`: 精度

**Returns**: e

#### `pi`

```ts
pi(precision?: number | bigint): BigFloat
```

円周率(pi)を取得する

**Parameters**
- `precision`: 精度

**Returns**: pi

#### `tau`

```ts
tau(precision?: number | bigint): BigFloat
```

タウ(tau = 2*pi)を取得する

**Parameters**
- `precision`: 精度

**Returns**: tau

#### `abs`

```ts
abs(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.abs() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 絶対値

#### `acos`

```ts
acos(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.acos() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆余弦

#### `acosh`

```ts
acosh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.acosh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆双曲線余弦

#### `asin`

```ts
asin(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.asin() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆正弦

#### `asinh`

```ts
asinh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.asinh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆双曲線正弦

#### `atan`

```ts
atan(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.atan() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆正接

#### `atan2`

```ts
atan2(y: string | number | bigint | BigFloat, x: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.atan2() 相当

**Parameters**
- `y`: y座標
- `x`: x座標
- `precision`: 結果精度

**Returns**: 逆正接

#### `atanh`

```ts
atanh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.atanh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆双曲線正接

#### `cbrt`

```ts
cbrt(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.cbrt() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 立方根

#### `ceil`

```ts
ceil(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.ceil() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 切り上げ結果

#### `clz32`

```ts
clz32(value: string | number | bigint | BigFloat): BigFloat
```

Math.clz32() 相当

**Parameters**
- `value`: 対象値

**Returns**: 先頭ゼロビット数

#### `cos`

```ts
cos(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.cos() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 余弦

#### `cosh`

```ts
cosh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.cosh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 双曲線余弦

#### `exp`

```ts
exp(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.exp() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 指数関数

#### `expm1`

```ts
expm1(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.expm1() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: e^x - 1

#### `floor`

```ts
floor(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.floor() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 切り捨て結果

#### `fround`

```ts
fround(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.fround() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: Float32相当に丸めた結果

#### `hypot`

```ts
hypot(...values: string | number | bigint | BigFloat[]): BigFloat
```

Math.hypot() 相当

**Parameters**
- `values`: 値の列

**Returns**: sqrt(sum(x_i^2))

#### `imul`

```ts
imul(lhs: string | number | bigint | BigFloat, rhs: string | number | bigint | BigFloat): BigFloat
```

Math.imul() 相当

**Parameters**
- `lhs`: 左辺
- `rhs`: 右辺

**Returns**: 32bit整数乗算結果

#### `log`

```ts
log(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 自然対数

#### `log10`

```ts
log10(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log10() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 常用対数

#### `log1p`

```ts
log1p(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log1p() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: ln(1 + x)

#### `log2`

```ts
log2(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log2() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 底2対数

#### `max`

```ts
max(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

Math.max() 相当

**Parameters**
- `args`: 数値のリスト

**Returns**: 最大値

#### `min`

```ts
min(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

Math.min() 相当

**Parameters**
- `args`: 数値のリスト

**Returns**: 最小値

#### `pow`

```ts
pow(base: string | number | bigint | BigFloat, exponent: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.pow() 相当

**Parameters**
- `base`: 底
- `exponent`: 指数
- `precision`: 結果精度

**Returns**: 冪乗結果

#### `round`

```ts
round(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.round() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 四捨五入結果

#### `sign`

```ts
sign(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sign() 相当

**Parameters**
- `value`: 対象値
- `precision`: 入力精度

**Returns**: 符号

#### `sin`

```ts
sin(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sin() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 正弦

#### `sinh`

```ts
sinh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sinh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 双曲線正弦

#### `sqrt`

```ts
sqrt(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sqrt() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 平方根

#### `tan`

```ts
tan(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.tan() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 正接

#### `tanh`

```ts
tanh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.tanh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 双曲線正接

#### `trunc`

```ts
trunc(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.trunc() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 切り捨て結果

#### `sum`

```ts
sum(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の合計を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 合計

#### `product`

```ts
product(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の積を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 積

#### `average`

```ts
average(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の平均を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 平均

#### `median`

```ts
median(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の中央値を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 中央値

**Throws**: 引数が空の場合

#### `variance`

```ts
variance(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の分散を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 分散

**Throws**: 引数が空の場合

#### `stddev`

```ts
stddev(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の標準偏差を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 標準偏差

#### `random`

```ts
random(precision?: number | bigint): BigFloat
```

0以上1未満のランダムなBigFloatを生成する

**Parameters**
- `precision`: 精度

**Returns**: ランダムなBigFloat

#### `nan`

```ts
nan(precision?: number | bigint): BigFloat
```

定数 NaN を取得する

**Parameters**
- `precision`: 精度

**Returns**: NaN

**Throws**: 特殊値が無効な場合

#### `infinity`

```ts
infinity(precision?: number | bigint): BigFloat
```

定数 Infinity を取得する

**Parameters**
- `precision`: 精度

**Returns**: Infinity

**Throws**: 特殊値が無効な場合

#### `negativeInfinity`

```ts
negativeInfinity(precision?: number | bigint): BigFloat
```

定数 -Infinity を取得する

**Parameters**
- `precision`: 精度

**Returns**: Infinity

**Throws**: 特殊値が無効な場合

#### `minusTen`

```ts
minusTen(precision?: number | bigint): BigFloat
```

定数 -10 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 10

#### `minusTwo`

```ts
minusTwo(precision?: number | bigint): BigFloat
```

定数 -2 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 2

#### `minusOne`

```ts
minusOne(precision?: number | bigint): BigFloat
```

定数 -1 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 1

#### `zero`

```ts
zero(precision?: number | bigint): BigFloat
```

定数 0 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 0

#### `quarter`

```ts
quarter(precision?: number | bigint): BigFloat
```

定数 0.25 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 0.25

#### `half`

```ts
half(precision?: number | bigint): BigFloat
```

定数 0.5 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 0.5

#### `one`

```ts
one(precision?: number | bigint): BigFloat
```

定数 1 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 1

#### `two`

```ts
two(precision?: number | bigint): BigFloat
```

定数 2 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 2

#### `ten`

```ts
ten(precision?: number | bigint): BigFloat
```

定数 10 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 10

#### `hundred`

```ts
hundred(precision?: number | bigint): BigFloat
```

定数 100 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 100

#### `thousand`

```ts
thousand(precision?: number | bigint): BigFloat
```

定数 1000 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 1000

### Instance Properties

#### `mantissa`

```ts
mantissa: bigint
```

内部的な値 (mantissa × 2^exp2 × 5^exp5)

### Instance Methods

#### `exponent2`

```ts
exponent2(): bigint
```

2の指数を取得する

#### `exponent5`

```ts
exponent5(): bigint
```

5の指数を取得する

#### `clone`

```ts
clone(): BigFloat
```

インスタンスを複製する

**Returns**: 複製されたインスタンス

#### `copyFrom`

```ts
copyFrom(other: BigFloat): BigFloat
```

他のインスタンスの値を自身にコピーする

**Parameters**
- `other`: コピー元

**Returns**: 自身

#### `softNormalize`

```ts
softNormalize(): void
```

ソフト正規化 (2の累乗を外に出す)

#### `lazyNormalize`

```ts
lazyNormalize(): void
```

レイジー正規化 (5の累乗を外に出す)

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloat
```

精度を変更する

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度が変更されたインスタンス

#### `matchingPrecision`

```ts
matchingPrecision(other: string | number | bigint | BigFloat): bigint
```

どこまで精度が一致しているかを判定する

**Parameters**
- `other`: 比較対象

**Returns**: 一致している桁数

#### `compare`

```ts
compare(other: string | number | bigint | BigFloat): number
```

比較演算

**Parameters**
- `other`: 比較対象

**Returns**: 比較結果 (-1, 0, 1)

#### `eq`

```ts
eq(other: string | number | bigint | BigFloat): boolean
```

等しいかどうかを判定する (==)

**Parameters**
- `other`: 比較対象

**Returns**: 等しい場合はtrue

#### `equals`

```ts
equals(other: string | number | bigint | BigFloat): boolean
```

等しいかどうかを判定する (==)

**Parameters**
- `other`: 比較対象

**Returns**: 等しい場合はtrue

#### `ne`

```ts
ne(other: string | number | bigint | BigFloat): boolean
```

等しくないかどうかを判定する (!=)

**Parameters**
- `other`: 比較対象

**Returns**: 等しくない場合はtrue

#### `lt`

```ts
lt(other: string | number | bigint | BigFloat): boolean
```

より小さいかどうかを判定する (<)

**Parameters**
- `other`: 比較対象

**Returns**: より小さい場合はtrue

#### `lte`

```ts
lte(other: string | number | bigint | BigFloat): boolean
```

以下かどうかを判定する (<=)

**Parameters**
- `other`: 比較対象

**Returns**: 以下の場合はtrue

#### `gt`

```ts
gt(other: string | number | bigint | BigFloat): boolean
```

より大きいかどうかを判定する (>)

**Parameters**
- `other`: 比較対象

**Returns**: より大きい場合はtrue

#### `gte`

```ts
gte(other: string | number | bigint | BigFloat): boolean
```

以上かどうかを判定する (>=)

**Parameters**
- `other`: 比較対象

**Returns**: 以上の場合はtrue

#### `isZero`

```ts
isZero(): boolean
```

ゼロかどうかを判定する

**Returns**: ゼロの場合はtrue

#### `isPositive`

```ts
isPositive(): boolean
```

正の数かどうかを判定する

**Returns**: 正の数の場合はtrue

#### `isNegative`

```ts
isNegative(): boolean
```

負の数かどうかを判定する

**Returns**: 負の数の場合はtrue

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat): BigFloat
```

相対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat): BigFloat
```

絶対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat): BigFloat
```

差分の非一致度を計算する (百分率)

**Parameters**
- `other`: 比較対象

**Returns**: 非一致度 (%)

#### `toString`

```ts
toString(base?: number, precision?: number | bigint): string
```

文字列に変換する

**Parameters**
- `base`: 基数 (2-36)
- `precision`: 出力時の精度

**Returns**: 変換された文字列

**Throws**: 基数が2から36の範囲外の場合

#### `toJSON`

```ts
toJSON(): string
```

JSON用の文字列表現を取得する

**Returns**: JSON文字列

#### `toNumber`

```ts
toNumber(): number
```

Number型に変換する

**Returns**: 変換された数値

#### `toFixed`

```ts
toFixed(digits: number | bigint): string
```

指定した桁数で固定した文字列を取得する

**Parameters**
- `digits`: 小数点以下の桁数

**Returns**: 固定小数点形式の文字列

#### `toExponential`

```ts
toExponential(digits?: number): string
```

指数形式の文字列を取得する

**Parameters**
- `digits`: 有効桁数

**Returns**: 指数形式の文字列

**Throws**: digitsが不正な場合

#### `add`

```ts
add(other: string | number | bigint | BigFloat): BigFloat
```

加算する (+)

**Parameters**
- `other`: 加算する値

**Returns**: 加算結果

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat): BigFloat
```

減算する (-)

**Parameters**
- `other`: 減算する値

**Returns**: 減算結果

#### `mul`

```ts
mul(other: string | number | bigint | BigFloat): BigFloat
```

乗算する (*)

**Parameters**
- `other`: 乗算する値

**Returns**: 乗算結果

#### `div`

```ts
div(other: string | number | bigint | BigFloat): BigFloat
```

除算する (/)

**Parameters**
- `other`: 除算する値

**Returns**: 除算結果

**Throws**: ゼロ除算の場合

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat): BigFloat
```

剰余を計算する (%)

**Parameters**
- `other`: 法

**Returns**: 剰余

#### `neg`

```ts
neg(): BigFloat
```

符号を反転させる

**Returns**: 符号が反転した結果

#### `abs`

```ts
abs(): BigFloat
```

絶対値を取得する

**Returns**: 絶対値

#### `sign`

```ts
sign(): BigFloat
```

符号を取得する

**Returns**: 1, 0, 1 または NaN

#### `reciprocal`

```ts
reciprocal(): BigFloat
```

逆数を取得する

**Returns**: 逆数

**Throws**: ゼロの場合

#### `floor`

```ts
floor(): BigFloat
```

床関数 (負の無限大方向への丸め)

**Returns**: 丸められた結果

#### `ceil`

```ts
ceil(): BigFloat
```

天井関数 (正の無限大方向への丸め)

**Returns**: 丸められた結果

#### `round`

```ts
round(): BigFloat
```

四捨五入する

**Returns**: 四捨五入された結果

#### `trunc`

```ts
trunc(): BigFloat
```

0に近い方向へ切り捨てる

**Returns**: 切り捨てられた結果

#### `fround`

```ts
fround(): BigFloat
```

Float32 精度へ丸める

**Returns**: Float32相当に丸めた結果

#### `clz32`

```ts
clz32(): BigFloat
```

32bit整数として見たときの先頭ゼロビット数を返す

**Returns**: 先頭ゼロビット数

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat): BigFloat
```

冪乗を計算する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗の結果

#### `sqrt`

```ts
sqrt(): BigFloat
```

平方根を計算する

**Returns**: 平方根

#### `cbrt`

```ts
cbrt(): BigFloat
```

立方根を計算する

**Returns**: 立方根

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloat
```

n乗根を計算する

**Parameters**
- `n`: 指数

**Returns**: n乗根

#### `sin`

```ts
sin(): BigFloat
```

正弦(sin)を計算する

**Returns**: 正弦

#### `cos`

```ts
cos(): BigFloat
```

余弦(cos)を計算する

**Returns**: 余弦

#### `tan`

```ts
tan(): BigFloat
```

正接(tan)を計算する

**Returns**: 正接

#### `asin`

```ts
asin(): BigFloat
```

逆正弦(asin)を計算する

**Returns**: 角度(ラジアン)

#### `acos`

```ts
acos(): BigFloat
```

逆余弦(acos)を計算する

**Returns**: 角度(ラジアン)

#### `atan`

```ts
atan(): BigFloat
```

逆正接(atan)を計算する

**Returns**: 角度(ラジアン)

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat): BigFloat
```

2引数の逆正接(atan2)を計算する

**Parameters**
- `x`: x座標

**Returns**: 角度(ラジアン)

#### `sinh`

```ts
sinh(): BigFloat
```

双曲線正弦(sinh)を計算する

**Returns**: 双曲線正弦

#### `cosh`

```ts
cosh(): BigFloat
```

双曲線余弦(cosh)を計算する

**Returns**: 双曲線余弦

#### `tanh`

```ts
tanh(): BigFloat
```

双曲線正接(tanh)を計算する

**Returns**: 双曲線正接

#### `asinh`

```ts
asinh(): BigFloat
```

逆双曲線正弦(asinh)を計算する

**Returns**: 逆双曲線正弦

#### `acosh`

```ts
acosh(): BigFloat
```

逆双曲線余弦(acosh)を計算する

**Returns**: 逆双曲線余弦

#### `atanh`

```ts
atanh(): BigFloat
```

逆双曲線正接(atanh)を計算する

**Returns**: 逆双曲線正接

#### `exp`

```ts
exp(): BigFloat
```

指数関数(e^x)を計算する

**Returns**: e^x

#### `exp2`

```ts
exp2(): BigFloat
```

2の冪乗(2^x)を計算する

**Returns**: 2^x

#### `expm1`

```ts
expm1(): BigFloat
```

e^x - 1 を計算する

**Returns**: e^x - 1

#### `ln`

```ts
ln(): BigFloat
```

自然対数(ln)を計算する

**Returns**: ln(x)

#### `log`

```ts
log(base: string | number | bigint | BigFloat): BigFloat
```

対数を計算する

**Parameters**
- `base`: 底

**Returns**: log_base(x)

#### `log2`

```ts
log2(): BigFloat
```

2を底とする対数(log2)を計算する

**Returns**: log2(x)

#### `log10`

```ts
log10(): BigFloat
```

10を底とする対数(log10)を計算する

**Returns**: log10(x)

#### `log1p`

```ts
log1p(): BigFloat
```

ln(1 + x) を計算する

**Returns**: ln(1 + x)

#### `gamma`

```ts
gamma(): BigFloat
```

ガンマ関数を計算する

**Returns**: ガンマ関数

#### `zeta`

```ts
zeta(): BigFloat
```

Riemann zeta 関数を計算する

**Returns**: zeta(this)

#### `factorial`

```ts
factorial(): BigFloat
```

階乗を計算する

**Returns**: 階乗

<a id="bigfloatconfig"></a>

## `BigFloatConfig`

BigFloat settings

```ts
class BigFloatConfig
```

### Constructor

#### `constructor`

```ts
constructor(__0?: { allowPrecisionMismatch?: boolean; mutateResult?: boolean; allowSpecialValues?: boolean; roundingMode?: RoundingMode.TRUNCATE | RoundingMode.UP | RoundingMode.CEIL | RoundingMode.FLOOR | RoundingMode.HALF_UP | RoundingMode.HALF_DOWN; extraPrecision?: bigint; trigFuncsMaxSteps?: bigint; lnMaxSteps?: bigint }): BigFloatConfig
```

BigFloat settings

**Parameters**
- `options`: 設定オプション

### Instance Properties

#### `allowPrecisionMismatch`

```ts
allowPrecisionMismatch: boolean
```

精度の不一致を許容するかどうか

#### `mutateResult`

```ts
mutateResult: boolean
```

破壊的な計算(自身の上書き)をするかどうか

#### `allowSpecialValues`

```ts
allowSpecialValues: boolean
```

Infinity/NaN の特殊値を許容するかどうか

#### `roundingMode`

```ts
roundingMode: RoundingMode
```

丸めモード

#### `extraPrecision`

```ts
extraPrecision: bigint
```

計算時に追加する精度

#### `trigFuncsMaxSteps`

```ts
trigFuncsMaxSteps: bigint
```

三角関数の最大ステップ数

#### `lnMaxSteps`

```ts
lnMaxSteps: bigint
```

対数計算の最大ステップ数

### Instance Methods

#### `clone`

```ts
clone(): BigFloatConfig
```

設定オブジェクトを複製する

**Returns**: 複製された設定オブジェクト

#### `toggleMismatch`

```ts
toggleMismatch(): void
```

精度の不一致を許容するかどうかを切り替える

#### `toggleMutation`

```ts
toggleMutation(): void
```

破壊的な計算(自身の上書き)をするかどうかを切り替える

<a id="bigfloatstream"></a>

## `BigFloatStream`

BigFloat-specific Stream (Lazy List)

```ts
class BigFloatStream
```

### Constructor

#### `constructor`

```ts
constructor(source: Iterable<BigFloat> | (): Iterator<BigFloat, void, undefined>): BigFloatStream
```

BigFloat-specific Stream (Lazy List)

**Parameters**
- `source`: BigFloatの反復可能オブジェクト

### Static Methods

#### `empty`

```ts
empty(): BigFloatStream
```

空のストリームを生成する

**Returns**: 空のストリーム

#### `from`

```ts
from(iterable: Iterable<BigFloatValue>, precision?: number | bigint): BigFloatStream
```

反復可能オブジェクトからBigFloatStreamを作成する

**Parameters**
- `iterable`: BigFloatの反復可能オブジェクト
- `precision`: 変換時の精度

**Returns**: BigFloatStreamインスタンス

#### `of`

```ts
of(...values: string | number | bigint | BigFloat[]): BigFloatStream
```

値のリストからBigFloatStreamを作成する

**Parameters**
- `values`: 値のリスト

**Returns**: BigFloatStreamインスタンス

#### `arithmetic`

```ts
arithmetic(start: string | number | bigint | BigFloat, step: string | number | bigint | BigFloat, count: number, precision?: number | bigint): BigFloatStream
```

等差数列を生成する

**Parameters**
- `start`: 初項
- `step`: 公差
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `geometric`

```ts
geometric(start: string | number | bigint | BigFloat, ratio: string | number | bigint | BigFloat, count: number, precision?: number | bigint): BigFloatStream
```

等比数列を生成する

**Parameters**
- `start`: 初項
- `ratio`: 公比
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `linspace`

```ts
linspace(start: string | number | bigint | BigFloat, end: string | number | bigint | BigFloat, count: number, precision?: number | bigint): BigFloatStream
```

指定個数で等間隔な値を生成する

**Parameters**
- `start`: 開始値
- `end`: 終了値
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `logspace`

```ts
logspace(start: string | number | bigint | BigFloat, end: string | number | bigint | BigFloat, count: number, precision?: number | bigint): BigFloatStream
```

10を底とする対数間隔の値を生成する

**Parameters**
- `start`: 開始指数
- `end`: 終了指数
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `harmonic`

```ts
harmonic(count: number, precision?: number | bigint): BigFloatStream
```

調和級数を生成する

**Parameters**
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `random`

```ts
random(count: number, options?: { min?: string | number | bigint | BigFloat; max?: string | number | bigint | BigFloat; precision?: number | bigint }): BigFloatStream
```

乱数列を生成する

**Parameters**
- `count`: 要素数
- `options`: 生成オプション

**Returns**: BigFloatStreamインスタンス

#### `repeat`

```ts
repeat(value: string | number | bigint | BigFloat, count: number, precision?: number | bigint): BigFloatStream
```

同じ値を繰り返す

**Parameters**
- `value`: 繰り返す値
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `fibonacci`

```ts
fibonacci(count: number, precision?: number | bigint): BigFloatStream
```

フィボナッチ数列を生成する

**Parameters**
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `factorial`

```ts
factorial(count: number, precision?: number | bigint): BigFloatStream
```

階乗列を生成する

**Parameters**
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

#### `range`

```ts
range(start: string | number | bigint | BigFloat, end?: string | number | bigint | BigFloat, step?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatStream
```

範囲を生成する

**Parameters**
- `start`: 開始値
- `end`: 終了値
- `step`: ステップ
- `precision`: 精度

**Returns**: BigFloatStreamインスタンス

### Instance Methods

#### `clone`

```ts
clone(): BigFloatStream
```

ストリームを複製する

**Returns**: 複製されたストリーム

#### `map`

```ts
map(fn: (item: BigFloat): BigFloat): BigFloatStream
```

各要素を変換する

**Parameters**
- `fn`: 変換関数

**Returns**: 変換されたストリーム

#### `filter`

```ts
filter(fn: (item: BigFloat): boolean): BigFloatStream
```

要素をフィルタリングする

**Parameters**
- `fn`: 判定関数

**Returns**: フィルタリングされたストリーム

#### `flatMap`

```ts
flatMap(fn: (item: BigFloat): Iterable<BigFloatValue>): BigFloatStream
```

要素を平坦化して変換する

**Parameters**
- `fn`: 変換関数

**Returns**: 平坦化されたストリーム

#### `distinct`

```ts
distinct(keyFn?: (item: BigFloat): unknown): BigFloatStream
```

重複を除去する

**Parameters**
- `keyFn`: キー生成関数

**Returns**: 重複が除去されたストリーム

#### `sorted`

```ts
sorted(compareFn?: (a: BigFloat, b: BigFloat): number): BigFloatStream
```

要素をソートする (終端操作ではないが、全要素を内部で保持する)

**Parameters**
- `compareFn`: 比較関数

**Returns**: ソートされたストリーム

#### `peek`

```ts
peek(fn: (item: BigFloat): void): BigFloatStream
```

各要素に対してアクションを実行する (ストリームは維持)

**Parameters**
- `fn`: アクション関数

**Returns**: 自身

#### `tap`

```ts
tap(fn: (item: BigFloat): void): BigFloatStream
```

各要素に対してアクションを実行する (ストリームは維持)

**Parameters**
- `fn`: アクション関数

**Returns**: 自身

#### `limit`

```ts
limit(n: number): BigFloatStream
```

要素数を制限する

**Parameters**
- `n`: 最大要素数

**Returns**: 制限されたストリーム

#### `take`

```ts
take(n: number): BigFloatStream
```

要素数を制限する

**Parameters**
- `n`: 最大要素数

**Returns**: 制限されたストリーム

#### `skip`

```ts
skip(n: number): BigFloatStream
```

指定した要素数をスキップする

**Parameters**
- `n`: スキップする数

**Returns**: スキップされたストリーム

#### `drop`

```ts
drop(n: number): BigFloatStream
```

指定した要素数をスキップする

**Parameters**
- `n`: スキップする数

**Returns**: スキップされたストリーム

#### `concat`

```ts
concat(...iterables: Iterable<BigFloatValue>[]): BigFloatStream
```

末尾にストリームを連結する

**Parameters**
- `iterables`: 連結するストリーム

**Returns**: 連結後のストリーム

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloat, void, undefined>
```

イテレータの実装

**Returns**: イテレータ

#### `forEach`

```ts
forEach(fn: (item: BigFloat): void): void
```

各要素に対して処理を実行する (終端操作)

**Parameters**
- `fn`: 処理関数

#### `toArray`

```ts
toArray(): BigFloat[]
```

配列に変換する (終端操作)

**Returns**: 要素の配列

#### `collect`

```ts
collect(): BigFloat[]
```

配列に変換する (終端操作)

**Returns**: 要素の配列

#### `reduce`

```ts
reduce<U>(fn: (acc: U, item: BigFloat): U, initial: U): U
```

畳み込み処理を行う (終端操作)

**Parameters**
- `fn`: 畳み込み関数
- `initial`: 初期値

**Returns**: 畳み込み結果

#### `count`

```ts
count(): number
```

要素数をカウントする (終端操作)

**Returns**: 要素数

#### `isEmpty`

```ts
isEmpty(): boolean
```

ストリームが空かどうか判定する

**Returns**: 空ならtrue

#### `some`

```ts
some(fn: (item: BigFloat): boolean): boolean
```

いずれかの要素が条件を満たすか判定する (終端操作)

**Parameters**
- `fn`: 判定関数

**Returns**: 満たす要素があればtrue

#### `every`

```ts
every(fn: (item: BigFloat): boolean): boolean
```

すべての要素が条件を満たすか判定する (終端操作)

**Parameters**
- `fn`: 判定関数

**Returns**: すべて満たせばtrue

#### `find`

```ts
find(fn: (item: BigFloat): boolean): undefined | BigFloat
```

条件に一致する最初の要素を返す (終端操作)

**Parameters**
- `fn`: 判定関数

**Returns**: 条件に一致した要素、存在しない場合はundefined

#### `findFirst`

```ts
findFirst(): undefined | BigFloat
```

最初の要素を返す (終端操作)

**Returns**: 最初の要素、空の場合はundefined

#### `first`

```ts
first(): undefined | BigFloat
```

最初の要素を返す (終端操作)

**Returns**: 最初の要素、空の場合はundefined

#### `at`

```ts
at(index: number): undefined | BigFloat
```

指定位置の要素を返す (終端操作)

**Parameters**
- `index`: インデックス

**Returns**: 要素、存在しない場合はundefined

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatStream
```

すべての要素の精度を変更する

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度が変更されたストリーム

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素と指定値の相対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差を要素ごとに計算したストリーム

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素と指定値の絶対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差を要素ごとに計算したストリーム

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素と指定値の百分率差分を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 百分率差分を要素ごとに計算したストリーム

#### `add`

```ts
add(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素に加算する

**Parameters**
- `other`: 加算する値

**Returns**: 加算後のストリーム

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素から減算する

**Parameters**
- `other`: 減算する値

**Returns**: 減算後のストリーム

#### `mul`

```ts
mul(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素に乗算する

**Parameters**
- `other`: 乗算する値

**Returns**: 乗算後のストリーム

#### `div`

```ts
div(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素を除算する

**Parameters**
- `other`: 除算する値

**Returns**: 除算後のストリーム

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat): BigFloatStream
```

各要素の剰余を計算する

**Parameters**
- `other`: 法

**Returns**: 剰余後のストリーム

#### `neg`

```ts
neg(): BigFloatStream
```

各要素の符号を反転させる

**Returns**: 反転後のストリーム

#### `abs`

```ts
abs(): BigFloatStream
```

各要素の絶対値を取得する

**Returns**: 絶対値後のストリーム

#### `sign`

```ts
sign(): BigFloatStream
```

各要素の符号を取得する

**Returns**: 符号後のストリーム

#### `reciprocal`

```ts
reciprocal(): BigFloatStream
```

各要素の逆数を取得する

**Returns**: 逆数後のストリーム

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat): BigFloatStream
```

各要素の冪乗を計算する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗後のストリーム

#### `sqrt`

```ts
sqrt(): BigFloatStream
```

各要素の平方根を計算する

**Returns**: 平方根後のストリーム

#### `cbrt`

```ts
cbrt(): BigFloatStream
```

各要素の立方根を計算する

**Returns**: 立方根後のストリーム

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatStream
```

各要素のn乗根を計算する

**Parameters**
- `n`: 指数

**Returns**: n乗根後のストリーム

#### `floor`

```ts
floor(): BigFloatStream
```

各要素を切り下げる

**Returns**: 切り下げ後のストリーム

#### `ceil`

```ts
ceil(): BigFloatStream
```

各要素を切り上げる

**Returns**: 切り上げ後のストリーム

#### `round`

```ts
round(): BigFloatStream
```

各要素を四捨五入する

**Returns**: 四捨五入後のストリーム

#### `trunc`

```ts
trunc(): BigFloatStream
```

各要素を0方向へ切り捨てる

**Returns**: 切り捨て後のストリーム

#### `fround`

```ts
fround(): BigFloatStream
```

各要素をFloat32相当に丸める

**Returns**: Float32相当へ丸めたストリーム

#### `clz32`

```ts
clz32(): BigFloatStream
```

各要素の先頭ゼロビット数を取得する

**Returns**: 先頭ゼロビット数のストリーム

#### `sin`

```ts
sin(): BigFloatStream
```

各要素の正弦を計算する

**Returns**: 正弦後のストリーム

#### `cos`

```ts
cos(): BigFloatStream
```

各要素の余弦を計算する

**Returns**: 余弦後のストリーム

#### `tan`

```ts
tan(): BigFloatStream
```

各要素の正接を計算する

**Returns**: 正接後のストリーム

#### `asin`

```ts
asin(): BigFloatStream
```

各要素の逆正弦を計算する

**Returns**: 逆正弦後のストリーム

#### `acos`

```ts
acos(): BigFloatStream
```

各要素の逆余弦を計算する

**Returns**: 逆余弦後のストリーム

#### `atan`

```ts
atan(): BigFloatStream
```

各要素の逆正接を計算する

**Returns**: 逆正接後のストリーム

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat): BigFloatStream
```

各要素と指定値から逆正接を計算する

**Parameters**
- `x`: x座標

**Returns**: 逆正接後のストリーム

#### `sinh`

```ts
sinh(): BigFloatStream
```

各要素の双曲線正弦を計算する

**Returns**: 双曲線正弦後のストリーム

#### `cosh`

```ts
cosh(): BigFloatStream
```

各要素の双曲線余弦を計算する

**Returns**: 双曲線余弦後のストリーム

#### `tanh`

```ts
tanh(): BigFloatStream
```

各要素の双曲線正接を計算する

**Returns**: 双曲線正接後のストリーム

#### `asinh`

```ts
asinh(): BigFloatStream
```

各要素の逆双曲線正弦を計算する

**Returns**: 逆双曲線正弦後のストリーム

#### `acosh`

```ts
acosh(): BigFloatStream
```

各要素の逆双曲線余弦を計算する

**Returns**: 逆双曲線余弦後のストリーム

#### `atanh`

```ts
atanh(): BigFloatStream
```

各要素の逆双曲線正接を計算する

**Returns**: 逆双曲線正接後のストリーム

#### `exp`

```ts
exp(): BigFloatStream
```

各要素の指数関数を計算する

**Returns**: 指数関数適用後のストリーム

#### `exp2`

```ts
exp2(): BigFloatStream
```

各要素の2冪指数関数を計算する

**Returns**: 2冪指数関数適用後のストリーム

#### `expm1`

```ts
expm1(): BigFloatStream
```

各要素のexp(x)-1を計算する

**Returns**: expm1適用後のストリーム

#### `ln`

```ts
ln(): BigFloatStream
```

各要素の自然対数を計算する

**Returns**: 自然対数後のストリーム

#### `log`

```ts
log(base: string | number | bigint | BigFloat): BigFloatStream
```

各要素の任意底対数を計算する

**Parameters**
- `base`: 底

**Returns**: 対数後のストリーム

#### `log2`

```ts
log2(): BigFloatStream
```

各要素の底2対数を計算する

**Returns**: 底2対数後のストリーム

#### `log10`

```ts
log10(): BigFloatStream
```

各要素の底10対数を計算する

**Returns**: 底10対数後のストリーム

#### `log1p`

```ts
log1p(): BigFloatStream
```

各要素のlog(1+x)を計算する

**Returns**: log1p適用後のストリーム

#### `gamma`

```ts
gamma(): BigFloatStream
```

各要素のガンマ関数を計算する

**Returns**: ガンマ関数適用後のストリーム

#### `zeta`

```ts
zeta(): BigFloatStream
```

各要素のゼータ関数を計算する

**Returns**: ゼータ関数適用後のストリーム

#### `factorial`

```ts
factorial(): BigFloatStream
```

各要素の階乗を計算する

**Returns**: 階乗後のストリーム

#### `max`

```ts
max(): BigFloat
```

要素の最大値を返す (終端操作)

**Returns**: 最大値

#### `min`

```ts
min(): BigFloat
```

要素の最小値を返す (終端操作)

**Returns**: 最小値

#### `sum`

```ts
sum(): BigFloat
```

要素の合計を返す (終端操作)

**Returns**: 合計

#### `product`

```ts
product(): BigFloat
```

要素の積を返す (終端操作)

**Returns**: 積

#### `average`

```ts
average(): BigFloat
```

要素の平均を返す (終端操作)

**Returns**: 平均

#### `median`

```ts
median(): BigFloat
```

要素の中央値を返す (終端操作)

**Returns**: 中央値

#### `variance`

```ts
variance(): BigFloat
```

要素の分散を返す (終端操作)

**Returns**: 分散

#### `stddev`

```ts
stddev(): BigFloat
```

要素の標準偏差を返す (終端操作)

**Returns**: 標準偏差

<a id="bigfloaterror"></a>

## `BigFloatError`

BigFloat ライブラリ共通の基底エラー

```ts
class BigFloatError
```

### Constructor

#### `constructor`

```ts
constructor(message?: string, options?: ErrorOptions): BigFloatError
```

BigFloat ライブラリ共通の基底エラー

<a id="cachenotinitializederror"></a>

## `CacheNotInitializedError`

必須キャッシュが初期化されていない場合のエラー

```ts
class CacheNotInitializedError
```

<a id="divisionbyzeroerror"></a>

## `DivisionByZeroError`

BigFloat 上でゼロ除算が発生した場合のエラー

```ts
class DivisionByZeroError
```

<a id="numericalcomputationerror"></a>

## `NumericalComputationError`

数値計算中に安定した結果を導けない場合のエラー

```ts
class NumericalComputationError
```

<a id="precisionmismatcherror"></a>

## `PrecisionMismatchError`

精度不一致が許容されていない場合のエラー

```ts
class PrecisionMismatchError
```

<a id="specialvaluesdisablederror"></a>

## `SpecialValuesDisabledError`

特殊値が無効な設定で特殊値を扱おうとした場合のエラー

```ts
class SpecialValuesDisabledError
```

<a id="roundingmode"></a>

## `RoundingMode`

丸めモード

```ts
enum RoundingMode
```

### Members

- `TRUNCATE = 0`: 0に近い方向に切り捨て
- `DOWN = 0`: 絶対値が小さい方向に切り捨て（TRUNCATEと同じ）
- `UP = 1`: 絶対値が大きい方向に切り上げ
- `CEIL = 2`: 正の無限大方向に切り上げ
- `FLOOR = 3`: 負の無限大方向に切り捨て
- `HALF_UP = 4`: 四捨五入
- `HALF_DOWN = 5`: 五捨六入（5未満切り捨て）

<a id="specialvaluestate"></a>

## `SpecialValueState`

BigFloat の特別な値の状態

```ts
enum SpecialValueState
```

### Members

- `FINITE = 0`: 有限の値
- `POSITIVE_INFINITY = 1`: 正の無限大
- `NEGATIVE_INFINITY = 2`: 負の無限大
- `NAN = 3`: 非数 (NaN)

<a id="bigfloataggregateargs"></a>

## `BigFloatAggregateArgs`

BigFloat の可変引数または単一配列引数

```ts
type BigFloatAggregateArgs = string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]
```

<a id="bigfloatoptions"></a>

## `BigFloatOptions`

BigFloat 構成オプション

```ts
interface BigFloatOptions { allowPrecisionMismatch?: boolean; mutateResult?: boolean; allowSpecialValues?: boolean; roundingMode?: RoundingMode.TRUNCATE | RoundingMode.UP | RoundingMode.CEIL | RoundingMode.FLOOR | RoundingMode.HALF_UP | RoundingMode.HALF_DOWN; extraPrecision?: bigint; trigFuncsMaxSteps?: bigint; lnMaxSteps?: bigint }
```

<a id="bigfloatstreamvalue"></a>

## `BigFloatStreamValue`

BigFloatStreamで扱う値

```ts
type BigFloatStreamValue = string | number | bigint | BigFloat
```

<a id="bigfloatvalue"></a>

## `BigFloatValue`

BigFloatに変換可能な値

```ts
type BigFloatValue = string | number | bigint | BigFloat
```

<a id="precisionvalue"></a>

## `PrecisionValue`

精度を表す値

```ts
type PrecisionValue = number | bigint
```
