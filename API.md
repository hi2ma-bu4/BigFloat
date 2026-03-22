# BigFloat API

`npm run build:md` で自動生成された API リファレンスです。

## Contents

- [`bigFloat`](#bigfloat)
- [`BigFloat`](#bigfloat-1)
- [`BigFloatConfig`](#bigfloatconfig)
- [`bigFloatComplex`](#bigfloatcomplex)
- [`BigFloatComplex`](#bigfloatcomplex-1)
- [`BigFloatMatrix`](#bigfloatmatrix)
- [`BigFloatStream`](#bigfloatstream)
- [`BigFloatVector`](#bigfloatvector)
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
relativeDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat
```

相対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat
```

絶対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat
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
add(other: BigFloatComplex): BigFloatComplex
```

加算する (+)

**Parameters**
- `other`: 加算する値

**Returns**: 加算結果

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat): BigFloat
sub(other: BigFloatComplex): BigFloatComplex
```

減算する (-)

**Parameters**
- `other`: 減算する値

**Returns**: 減算結果

#### `mul`

```ts
mul(other: string | number | bigint | BigFloat): BigFloat
mul(other: BigFloatComplex): BigFloatComplex
```

乗算する (*)

**Parameters**
- `other`: 乗算する値

**Returns**: 乗算結果

#### `div`

```ts
div(other: string | number | bigint | BigFloat): BigFloat
div(other: BigFloatComplex): BigFloatComplex
```

除算する (/)

**Parameters**
- `other`: 除算する値

**Returns**: 除算結果

**Throws**: ゼロ除算の場合

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat): BigFloat
mod(other: BigFloatComplex): never
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
pow(exponent: BigFloatComplex): BigFloatComplex
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
constructor(__0?: { allowPrecisionMismatch?: boolean; allowComplexNumbers?: boolean; mutateResult?: boolean; allowSpecialValues?: boolean; roundingMode?: RoundingMode.TRUNCATE | RoundingMode.UP | RoundingMode.CEIL | RoundingMode.FLOOR | RoundingMode.HALF_UP | RoundingMode.HALF_DOWN; extraPrecision?: bigint; trigFuncsMaxSteps?: bigint; lnMaxSteps?: bigint }): BigFloatConfig
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

#### `allowComplexNumbers`

```ts
allowComplexNumbers: boolean
```

BigFloatComplex との相互運用を許容するかどうか

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

#### `toggleComplexNumbers`

```ts
toggleComplexNumbers(): void
```

BigFloatComplex との相互運用を許容するかどうかを切り替える

#### `toggleMutation`

```ts
toggleMutation(): void
```

破壊的な計算(自身の上書き)をするかどうかを切り替える

<a id="bigfloatcomplex"></a>

## `bigFloatComplex`

#### `bigFloatComplex`

```ts
bigFloatComplex(value?: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }, precision?: number | bigint): BigFloatComplex
```

BigFloatComplex を作成する

**Parameters**
- `real`: 実部または複素数表現
- `imag`: 虚部
- `precision`: 精度

**Returns**: BigFloatComplex インスタンス

<a id="bigfloatcomplex-1"></a>

## `BigFloatComplex`

BigFloat を用いた複素数クラス

```ts
class BigFloatComplex
```

### Constructor

#### `constructor`

```ts
constructor(value?: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }, precision?: number | bigint): BigFloatComplex
constructor(real: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }, imag?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

BigFloat を用いた複素数クラス

**Parameters**
- `real`: 実部または複素数表現
- `imag`: 虚部
- `precision`: 精度

### Static Methods

#### `zero`

```ts
zero(precision?: number | bigint): BigFloatComplex
```

複素数定数 0

#### `one`

```ts
one(precision?: number | bigint): BigFloatComplex
```

複素数定数 1

#### `i`

```ts
i(precision?: number | bigint): BigFloatComplex
```

複素数定数 i

#### `e`

```ts
e(precision?: number | bigint): BigFloatComplex
```

e を返す

#### `pi`

```ts
pi(precision?: number | bigint): BigFloatComplex
```

pi を返す

#### `tau`

```ts
tau(precision?: number | bigint): BigFloatComplex
```

tau を返す

#### `from`

```ts
from(value: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }, precision?: number | bigint): BigFloatComplex
from(value: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }, imag?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

値から生成する

#### `of`

```ts
of(real: string | number | bigint | BigFloat, imag?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

値の並びから生成する

#### `fromPolar`

```ts
fromPolar(magnitude: string | number | bigint | BigFloat, angle: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

極形式から生成する

#### `sum`

```ts
sum(values: Iterable<BigFloatComplexValue>, precision?: number | bigint): BigFloatComplex
```

複素数の総和を返す

#### `product`

```ts
product(values: Iterable<BigFloatComplexValue>, precision?: number | bigint): BigFloatComplex
```

複素数の総積を返す

#### `average`

```ts
average(values: Iterable<BigFloatComplexValue>, precision?: number | bigint): BigFloatComplex
```

複素数の平均を返す

### Instance Properties

#### `real`

```ts
real: BigFloat
```

実部

#### `imag`

```ts
imag: BigFloat
```

虚部

#### `precision`

```ts
precision: bigint
```

精度

### Instance Methods

#### `clone`

```ts
clone(): BigFloatComplex
```

複製する

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatComplex
```

精度を変更する

#### `toArray`

```ts
toArray(): [BigFloat, BigFloat]
```

配列へ変換する

#### `toVector`

```ts
toVector(): BigFloatVector
```

ベクトルへ変換する

#### `toPolar`

```ts
toPolar(): { magnitude: BigFloat; angle: BigFloat }
```

極形式へ変換する

#### `toJSON`

```ts
toJSON(): { re: string; im: string }
```

JSON へ変換する

#### `toString`

```ts
toString(base?: number, precision?: number | bigint): string
```

文字列化する

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloat, void, undefined>
```

イテレータ

#### `equals`

```ts
equals(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): boolean
```

一致判定

#### `ne`

```ts
ne(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): boolean
```

別値判定

#### `isZero`

```ts
isZero(): boolean
```

ゼロ判定

#### `isReal`

```ts
isReal(): boolean
```

純実数判定

#### `isImaginary`

```ts
isImaginary(): boolean
```

純虚数判定

#### `conjugate`

```ts
conjugate(): BigFloatComplex
```

共役複素数を返す

#### `neg`

```ts
neg(): BigFloatComplex
```

符号反転する

#### `absSquared`

```ts
absSquared(): BigFloat
```

絶対値の二乗を返す

#### `abs`

```ts
abs(): BigFloat
```

絶対値を返す

#### `arg`

```ts
arg(): BigFloat
```

偏角を返す

#### `sign`

```ts
sign(): BigFloatComplex
```

符号複素数を返す

#### `normalize`

```ts
normalize(): BigFloatComplex
```

正規化する

#### `distanceTo`

```ts
distanceTo(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloat
```

距離を返す

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloat
```

相対差を返す

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloat
```

絶対差を返す

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloat
```

百分率差分を返す

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloatComplex
```

加算する

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloatComplex
```

減算する

#### `mul`

```ts
mul(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloatComplex
```

乗算する

#### `div`

```ts
div(other: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloatComplex
```

除算する

#### `reciprocal`

```ts
reciprocal(): BigFloatComplex
```

逆数を返す

#### `rotate`

```ts
rotate(angle: string | number | bigint | BigFloat): BigFloatComplex
```

回転する

#### `exp`

```ts
exp(): BigFloatComplex
```

指数関数を計算する

#### `expm1`

```ts
expm1(): BigFloatComplex
```

exp(z)-1 を計算する

#### `ln`

```ts
ln(): BigFloatComplex
```

自然対数を計算する

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloatComplex
```

対数を計算する

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatComplex | [string | number | bigint | BigFloat, string | number | bigint | BigFloat] | { re?: string | number | bigint | BigFloat; im?: string | number | bigint | BigFloat; real?: string | number | bigint | BigFloat; imag?: string | number | bigint | BigFloat }): BigFloatComplex
```

冪乗を計算する

#### `sqrt`

```ts
sqrt(): BigFloatComplex
```

平方根を計算する

#### `cbrt`

```ts
cbrt(): BigFloatComplex
```

立方根を計算する

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatComplex
```

主値の n 乗根を計算する

#### `nthRoots`

```ts
nthRoots(n: number | bigint): BigFloatComplex[]
```

n 乗根を全て返す

#### `sin`

```ts
sin(): BigFloatComplex
```

正弦を計算する

#### `cos`

```ts
cos(): BigFloatComplex
```

余弦を計算する

#### `tan`

```ts
tan(): BigFloatComplex
```

正接を計算する

#### `sinh`

```ts
sinh(): BigFloatComplex
```

双曲線正弦を計算する

#### `cosh`

```ts
cosh(): BigFloatComplex
```

双曲線余弦を計算する

#### `tanh`

```ts
tanh(): BigFloatComplex
```

双曲線正接を計算する

#### `asin`

```ts
asin(): BigFloatComplex
```

逆正弦を計算する

#### `acos`

```ts
acos(): BigFloatComplex
```

逆余弦を計算する

#### `atan`

```ts
atan(): BigFloatComplex
```

逆正接を計算する

#### `asinh`

```ts
asinh(): BigFloatComplex
```

逆双曲線正弦を計算する

#### `acosh`

```ts
acosh(): BigFloatComplex
```

逆双曲線余弦を計算する

#### `atanh`

```ts
atanh(): BigFloatComplex
```

逆双曲線正接を計算する

<a id="bigfloatmatrix"></a>

## `BigFloatMatrix`

BigFloat を固定長行列として扱うクラス

```ts
class BigFloatMatrix
```

### Constructor

#### `constructor`

```ts
constructor(rows?: Iterable<BigFloatMatrixRowSource>, precision?: number | bigint): BigFloatMatrix
```

BigFloat を固定長行列として扱うクラス

**Parameters**
- `rows`: 行列要素
- `precision`: 変換時の精度

### Static Methods

#### `empty`

```ts
empty(): BigFloatMatrix
```

空行列を生成する

#### `from`

```ts
from(rows: Iterable<BigFloatMatrixRowSource>, precision?: number | bigint): BigFloatMatrix
```

行列データから生成する

#### `fromRows`

```ts
fromRows(rows: Iterable<BigFloatMatrixRowSource>, precision?: number | bigint): BigFloatMatrix
```

行ベクトル群から生成する

#### `fromColumns`

```ts
fromColumns(columns: Iterable<BigFloatMatrixRowSource>, precision?: number | bigint): BigFloatMatrix
```

列ベクトル群から生成する

#### `of`

```ts
of(...rows: string | number | bigint | BigFloat[][]): BigFloatMatrix
```

行の並びから生成する

#### `fill`

```ts
fill(rowCount: number, columnCount: number, value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatMatrix
```

指定値で埋めた行列を生成する

#### `zeros`

```ts
zeros(rowCount: number, columnCount: number, precision?: number | bigint): BigFloatMatrix
```

0行列を生成する

#### `ones`

```ts
ones(rowCount: number, columnCount: number, precision?: number | bigint): BigFloatMatrix
```

1行列を生成する

#### `identity`

```ts
identity(size: number, precision?: number | bigint): BigFloatMatrix
```

単位行列を生成する

#### `diagonal`

```ts
diagonal(values: Iterable<BigFloatValue>, precision?: number | bigint): BigFloatMatrix
```

対角行列を生成する

#### `random`

```ts
random(rowCount: number, columnCount: number, options?: { min?: string | number | bigint | BigFloat; max?: string | number | bigint | BigFloat; precision?: number | bigint }): BigFloatMatrix
```

乱数行列を生成する

### Instance Properties

#### `rowCount`

```ts
rowCount: number
```

行数

#### `columnCount`

```ts
columnCount: number
```

列数

### Instance Methods

#### `shape`

```ts
shape(): [number, number]
```

形状を返す

#### `isEmpty`

```ts
isEmpty(): boolean
```

空行列かどうか

#### `isSquare`

```ts
isSquare(): boolean
```

正方行列かどうか

#### `at`

```ts
at(row: number, column: number): undefined | BigFloat
```

要素を取得する

#### `row`

```ts
row(index: number): undefined | BigFloatVector
```

行を取得する

#### `column`

```ts
column(index: number): undefined | BigFloatVector
```

列を取得する

#### `diagonalVector`

```ts
diagonalVector(): BigFloatVector
```

対角成分を取得する

#### `clone`

```ts
clone(): BigFloatMatrix
```

行列を複製する

#### `toArray`

```ts
toArray(): BigFloat[][]
```

配列へ変換する

#### `toVectors`

```ts
toVectors(): BigFloatVector[]
```

行ベクトル配列へ変換する

#### `flatten`

```ts
flatten(): BigFloatVector
```

平坦化ベクトルへ変換する

#### `toStream`

```ts
toStream(): BigFloatStream
```

Stream へ変換する

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloatVector, void, undefined>
```

行イテレータ

#### `forEach`

```ts
forEach(fn: (value: BigFloat, row: number, column: number): void): void
```

各要素へ処理を適用する

#### `map`

```ts
map(fn: (value: BigFloat, row: number, column: number): string | number | bigint | BigFloat): BigFloatMatrix
```

要素ごとに変換する

#### `zipMap`

```ts
zipMap(other: BigFloatMatrix | Iterable<BigFloatMatrixRowSource>, fn: (left: BigFloat, right: BigFloat, row: number, column: number): string | number | bigint | BigFloat): BigFloatMatrix
```

2つの行列を要素ごとに変換する

#### `reduce`

```ts
reduce<U>(fn: (acc: U, value: BigFloat, row: number, column: number): U, initial: U): U
```

畳み込み処理を行う

#### `some`

```ts
some(fn: (value: BigFloat, row: number, column: number): boolean): boolean
```

条件に一致する要素があるか

#### `every`

```ts
every(fn: (value: BigFloat, row: number, column: number): boolean): boolean
```

すべての要素が条件を満たすか

#### `concatRows`

```ts
concatRows(...others: BigFloatMatrix | Iterable<BigFloatMatrixRowSource>[]): BigFloatMatrix
```

行方向に連結する

#### `concatColumns`

```ts
concatColumns(...others: BigFloatMatrix | Iterable<BigFloatMatrixRowSource>[]): BigFloatMatrix
```

列方向に連結する

#### `sliceRows`

```ts
sliceRows(start?: number, end?: number): BigFloatMatrix
```

行スライス

#### `sliceColumns`

```ts
sliceColumns(start?: number, end?: number): BigFloatMatrix
```

列スライス

#### `transpose`

```ts
transpose(): BigFloatMatrix
```

転置行列を返す

#### `equals`

```ts
equals(other: BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): boolean
```

一致判定

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatMatrix
```

すべての要素の精度を変更する

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

各要素へ加算する

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

各要素から減算する

#### `mul`

```ts
mul(scalar: string | number | bigint | BigFloat): BigFloatMatrix
```

スカラ倍する

#### `div`

```ts
div(scalar: string | number | bigint | BigFloat): BigFloatMatrix
```

スカラ除算する

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

剰余を計算する

#### `hadamard`

```ts
hadamard(other: BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

要素ごとの積を計算する

#### `neg`

```ts
neg(): BigFloatMatrix
```

符号反転する

#### `abs`

```ts
abs(): BigFloatMatrix
```

絶対値化する

#### `sign`

```ts
sign(): BigFloatMatrix
```

符号行列を返す

#### `reciprocal`

```ts
reciprocal(): BigFloatMatrix
```

逆数行列を返す

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

要素ごとの冪乗を計算する

#### `sqrt`

```ts
sqrt(): BigFloatMatrix
```

各要素の平方根を計算する

#### `cbrt`

```ts
cbrt(): BigFloatMatrix
```

各要素の立方根を計算する

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatMatrix
```

各要素のn乗根を計算する

#### `floor`

```ts
floor(): BigFloatMatrix
```

切り下げる

#### `ceil`

```ts
ceil(): BigFloatMatrix
```

切り上げる

#### `round`

```ts
round(): BigFloatMatrix
```

四捨五入する

#### `trunc`

```ts
trunc(): BigFloatMatrix
```

0方向へ切り捨てる

#### `fround`

```ts
fround(): BigFloatMatrix
```

Float32相当に丸める

#### `clz32`

```ts
clz32(): BigFloatMatrix
```

先頭ゼロビット数を返す

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

相対差を計算する

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

絶対差を計算する

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

百分率差分を計算する

#### `sin`

```ts
sin(): BigFloatMatrix
```

正弦を計算する

#### `cos`

```ts
cos(): BigFloatMatrix
```

余弦を計算する

#### `tan`

```ts
tan(): BigFloatMatrix
```

正接を計算する

#### `asin`

```ts
asin(): BigFloatMatrix
```

逆正弦を計算する

#### `acos`

```ts
acos(): BigFloatMatrix
```

逆余弦を計算する

#### `atan`

```ts
atan(): BigFloatMatrix
```

逆正接を計算する

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

atan2 を計算する

#### `sinh`

```ts
sinh(): BigFloatMatrix
```

双曲線正弦を計算する

#### `cosh`

```ts
cosh(): BigFloatMatrix
```

双曲線余弦を計算する

#### `tanh`

```ts
tanh(): BigFloatMatrix
```

双曲線正接を計算する

#### `asinh`

```ts
asinh(): BigFloatMatrix
```

逆双曲線正弦を計算する

#### `acosh`

```ts
acosh(): BigFloatMatrix
```

逆双曲線余弦を計算する

#### `atanh`

```ts
atanh(): BigFloatMatrix
```

逆双曲線正接を計算する

#### `exp`

```ts
exp(): BigFloatMatrix
```

指数関数を計算する

#### `exp2`

```ts
exp2(): BigFloatMatrix
```

2冪指数関数を計算する

#### `expm1`

```ts
expm1(): BigFloatMatrix
```

exp(x)-1 を計算する

#### `ln`

```ts
ln(): BigFloatMatrix
```

自然対数を計算する

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

対数を計算する

#### `log2`

```ts
log2(): BigFloatMatrix
```

底2対数を計算する

#### `log10`

```ts
log10(): BigFloatMatrix
```

底10対数を計算する

#### `log1p`

```ts
log1p(): BigFloatMatrix
```

log(1+x) を計算する

#### `gamma`

```ts
gamma(): BigFloatMatrix
```

ガンマ関数を計算する

#### `zeta`

```ts
zeta(): BigFloatMatrix
```

ゼータ関数を計算する

#### `factorial`

```ts
factorial(): BigFloatMatrix
```

階乗を計算する

#### `max`

```ts
max(): BigFloat
```

最大値を返す

#### `min`

```ts
min(): BigFloat
```

最小値を返す

#### `sum`

```ts
sum(): BigFloat
```

合計を返す

#### `product`

```ts
product(): BigFloat
```

積を返す

#### `average`

```ts
average(): BigFloat
```

平均を返す

#### `rowSums`

```ts
rowSums(): BigFloatVector
```

行和ベクトルを返す

#### `columnSums`

```ts
columnSums(): BigFloatVector
```

列和ベクトルを返す

#### `trace`

```ts
trace(): BigFloat
```

トレースを返す

#### `frobeniusNorm`

```ts
frobeniusNorm(): BigFloat
```

Frobenius ノルムを返す

#### `matmul`

```ts
matmul(other: BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

行列積を計算する

#### `mulVector`

```ts
mulVector(vector: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

ベクトル積を計算する

#### `determinant`

```ts
determinant(): BigFloat
```

行列式を返す

#### `rank`

```ts
rank(): number
```

ランクを返す

#### `inverse`

```ts
inverse(): BigFloatMatrix
```

逆行列を返す

#### `solveVector`

```ts
solveVector(rhs: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

連立方程式 Ax=b を解く

#### `solveMatrix`

```ts
solveMatrix(rhs: BigFloatMatrix | Iterable<BigFloatMatrixRowSource>): BigFloatMatrix
```

連立方程式 AX=B を解く

#### `matrixPow`

```ts
matrixPow(exponent: number): BigFloatMatrix
```

行列累乗を返す

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

<a id="bigfloatvector"></a>

## `BigFloatVector`

BigFloat を固定長ベクトルとして扱うクラス

```ts
class BigFloatVector
```

### Constructor

#### `constructor`

```ts
constructor(values?: Iterable<BigFloatValue>, precision?: number | bigint): BigFloatVector
```

BigFloat を固定長ベクトルとして扱うクラス

**Parameters**
- `values`: 要素列
- `precision`: 変換時の精度

### Static Methods

#### `empty`

```ts
empty(): BigFloatVector
```

空ベクトルを生成する

**Returns**: 空ベクトル

#### `from`

```ts
from(values: Iterable<BigFloatValue>, precision?: number | bigint): BigFloatVector
```

要素列からベクトルを生成する

**Parameters**
- `values`: 要素列
- `precision`: 変換時の精度

**Returns**: BigFloatVector

#### `fromStream`

```ts
fromStream(stream: BigFloatStream): BigFloatVector
```

Stream からベクトルを生成する

**Parameters**
- `stream`: 変換元ストリーム

**Returns**: BigFloatVector

#### `of`

```ts
of(...values: string | number | bigint | BigFloat[]): BigFloatVector
```

値の並びからベクトルを生成する

**Parameters**
- `values`: 要素列

**Returns**: BigFloatVector

#### `fill`

```ts
fill(length: number, value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatVector
```

指定値で埋めたベクトルを生成する

**Parameters**
- `length`: ベクトル長
- `value`: 埋める値
- `precision`: 精度

**Returns**: BigFloatVector

#### `zeros`

```ts
zeros(length: number, precision?: number | bigint): BigFloatVector
```

0ベクトルを生成する

**Parameters**
- `length`: ベクトル長
- `precision`: 精度

**Returns**: BigFloatVector

#### `ones`

```ts
ones(length: number, precision?: number | bigint): BigFloatVector
```

1ベクトルを生成する

**Parameters**
- `length`: ベクトル長
- `precision`: 精度

**Returns**: BigFloatVector

#### `basis`

```ts
basis(length: number, index: number, precision?: number | bigint): BigFloatVector
```

標準基底ベクトルを生成する

**Parameters**
- `length`: ベクトル長
- `index`: 1を置く位置
- `precision`: 精度

**Returns**: BigFloatVector

#### `linspace`

```ts
linspace(start: string | number | bigint | BigFloat, end: string | number | bigint | BigFloat, count: number, precision?: number | bigint): BigFloatVector
```

線形補間ベクトルを生成する

**Parameters**
- `start`: 開始値
- `end`: 終了値
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatVector

#### `random`

```ts
random(length: number, options?: { min?: string | number | bigint | BigFloat; max?: string | number | bigint | BigFloat; precision?: number | bigint }): BigFloatVector
```

乱数ベクトルを生成する

**Parameters**
- `length`: ベクトル長
- `options`: 生成オプション

**Returns**: BigFloatVector

### Instance Properties

#### `length`

```ts
length: number
```

ベクトル長

### Instance Methods

#### `dimension`

```ts
dimension(): number
```

ベクトルの次元数を返す

**Returns**: 次元数

#### `isEmpty`

```ts
isEmpty(): boolean
```

空ベクトルかどうか

**Returns**: 空ならtrue

#### `at`

```ts
at(index: number): undefined | BigFloat
```

指定位置の値を取得する

**Parameters**
- `index`: インデックス

**Returns**: 値またはundefined

#### `clone`

```ts
clone(): BigFloatVector
```

ベクトルを複製する

**Returns**: 複製されたベクトル

#### `toArray`

```ts
toArray(): BigFloat[]
```

配列へ変換する

**Returns**: 要素配列

#### `toStream`

```ts
toStream(): BigFloatStream
```

Stream へ変換する

**Returns**: BigFloatStream

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloat, void, undefined>
```

イテレータ

**Returns**: イテレータ

#### `forEach`

```ts
forEach(fn: (value: BigFloat, index: number): void): void
```

各要素に処理を適用する

**Parameters**
- `fn`: 処理関数

#### `map`

```ts
map(fn: (value: BigFloat, index: number): string | number | bigint | BigFloat): BigFloatVector
```

要素ごとに変換する

**Parameters**
- `fn`: 変換関数

**Returns**: 変換後ベクトル

#### `zipMap`

```ts
zipMap(other: BigFloatVector | Iterable<BigFloatValue>, fn: (left: BigFloat, right: BigFloat, index: number): string | number | bigint | BigFloat): BigFloatVector
```

2つのベクトルを要素ごとに変換する

**Parameters**
- `other`: 対象ベクトル
- `fn`: 変換関数

**Returns**: 変換後ベクトル

#### `reduce`

```ts
reduce<U>(fn: (acc: U, value: BigFloat, index: number): U, initial: U): U
```

畳み込み処理を行う

**Parameters**
- `fn`: 畳み込み関数
- `initial`: 初期値

**Returns**: 畳み込み結果

#### `some`

```ts
some(fn: (value: BigFloat, index: number): boolean): boolean
```

条件に一致する要素があるか

**Parameters**
- `fn`: 判定関数

**Returns**: 条件に一致する要素があればtrue

#### `every`

```ts
every(fn: (value: BigFloat, index: number): boolean): boolean
```

すべての要素が条件を満たすか

**Parameters**
- `fn`: 判定関数

**Returns**: すべて満たせばtrue

#### `concat`

```ts
concat(...others: BigFloatVector | Iterable<BigFloatValue>[]): BigFloatVector
```

ベクトルを連結する

**Parameters**
- `others`: 連結対象

**Returns**: 連結後ベクトル

#### `slice`

```ts
slice(start?: number, end?: number): BigFloatVector
```

スライスする

**Parameters**
- `start`: 開始位置
- `end`: 終了位置

**Returns**: スライス後ベクトル

#### `reverse`

```ts
reverse(): BigFloatVector
```

逆順にする

**Returns**: 逆順ベクトル

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatVector
```

すべての要素の精度を変更する

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度変更後ベクトル

#### `equals`

```ts
equals(other: BigFloatVector | Iterable<BigFloatValue>): boolean
```

ベクトル同士の一致判定

**Parameters**
- `other`: 比較対象

**Returns**: 一致すればtrue

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

各要素へ加算する

**Parameters**
- `other`: スカラ値またはベクトル

**Returns**: 加算後ベクトル

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

各要素から減算する

**Parameters**
- `other`: スカラ値またはベクトル

**Returns**: 減算後ベクトル

#### `mul`

```ts
mul(scalar: string | number | bigint | BigFloat): BigFloatVector
```

スカラ倍する

**Parameters**
- `scalar`: スカラ値

**Returns**: 乗算後ベクトル

#### `div`

```ts
div(scalar: string | number | bigint | BigFloat): BigFloatVector
```

スカラ除算する

**Parameters**
- `scalar`: スカラ値

**Returns**: 除算後ベクトル

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

剰余を計算する

**Parameters**
- `other`: スカラ値またはベクトル

**Returns**: 剰余後ベクトル

#### `hadamard`

```ts
hadamard(other: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

要素ごとの積を計算する

**Parameters**
- `other`: 対象ベクトル

**Returns**: Hadamard積

#### `neg`

```ts
neg(): BigFloatVector
```

符号を反転する

**Returns**: 反転後ベクトル

#### `abs`

```ts
abs(): BigFloatVector
```

絶対値化する

**Returns**: 絶対値ベクトル

#### `sign`

```ts
sign(): BigFloatVector
```

符号ベクトルを返す

**Returns**: 符号ベクトル

#### `reciprocal`

```ts
reciprocal(): BigFloatVector
```

各要素の逆数を返す

**Returns**: 逆数ベクトル

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

要素ごとの冪乗を計算する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗後ベクトル

#### `sqrt`

```ts
sqrt(): BigFloatVector
```

各要素の平方根を計算する

**Returns**: 平方根ベクトル

#### `cbrt`

```ts
cbrt(): BigFloatVector
```

各要素の立方根を計算する

**Returns**: 立方根ベクトル

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatVector
```

各要素のn乗根を計算する

**Parameters**
- `n`: 指数

**Returns**: n乗根ベクトル

#### `floor`

```ts
floor(): BigFloatVector
```

各要素を切り下げる

**Returns**: 切り下げ後ベクトル

#### `ceil`

```ts
ceil(): BigFloatVector
```

各要素を切り上げる

**Returns**: 切り上げ後ベクトル

#### `round`

```ts
round(): BigFloatVector
```

各要素を四捨五入する

**Returns**: 四捨五入後ベクトル

#### `trunc`

```ts
trunc(): BigFloatVector
```

各要素を0方向へ切り捨てる

**Returns**: 切り捨て後ベクトル

#### `fround`

```ts
fround(): BigFloatVector
```

各要素をFloat32相当に丸める

**Returns**: Float32相当へ丸めたベクトル

#### `clz32`

```ts
clz32(): BigFloatVector
```

各要素の先頭ゼロビット数を取得する

**Returns**: 先頭ゼロビット数ベクトル

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

相対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差ベクトル

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

絶対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差ベクトル

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

百分率差分を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 百分率差分ベクトル

#### `sin`

```ts
sin(): BigFloatVector
```

各要素の正弦を計算する

**Returns**: 正弦ベクトル

#### `cos`

```ts
cos(): BigFloatVector
```

各要素の余弦を計算する

**Returns**: 余弦ベクトル

#### `tan`

```ts
tan(): BigFloatVector
```

各要素の正接を計算する

**Returns**: 正接ベクトル

#### `asin`

```ts
asin(): BigFloatVector
```

各要素の逆正弦を計算する

**Returns**: 逆正弦ベクトル

#### `acos`

```ts
acos(): BigFloatVector
```

各要素の逆余弦を計算する

**Returns**: 逆余弦ベクトル

#### `atan`

```ts
atan(): BigFloatVector
```

各要素の逆正接を計算する

**Returns**: 逆正接ベクトル

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

各要素と逆正接を計算する

**Parameters**
- `x`: x座標

**Returns**: 逆正接ベクトル

#### `sinh`

```ts
sinh(): BigFloatVector
```

各要素の双曲線正弦を計算する

**Returns**: 双曲線正弦ベクトル

#### `cosh`

```ts
cosh(): BigFloatVector
```

各要素の双曲線余弦を計算する

**Returns**: 双曲線余弦ベクトル

#### `tanh`

```ts
tanh(): BigFloatVector
```

各要素の双曲線正接を計算する

**Returns**: 双曲線正接ベクトル

#### `asinh`

```ts
asinh(): BigFloatVector
```

各要素の逆双曲線正弦を計算する

**Returns**: 逆双曲線正弦ベクトル

#### `acosh`

```ts
acosh(): BigFloatVector
```

各要素の逆双曲線余弦を計算する

**Returns**: 逆双曲線余弦ベクトル

#### `atanh`

```ts
atanh(): BigFloatVector
```

各要素の逆双曲線正接を計算する

**Returns**: 逆双曲線正接ベクトル

#### `exp`

```ts
exp(): BigFloatVector
```

各要素の指数関数を計算する

**Returns**: 指数関数ベクトル

#### `exp2`

```ts
exp2(): BigFloatVector
```

各要素の2冪指数関数を計算する

**Returns**: 2冪指数関数ベクトル

#### `expm1`

```ts
expm1(): BigFloatVector
```

各要素のexp(x)-1を計算する

**Returns**: expm1ベクトル

#### `ln`

```ts
ln(): BigFloatVector
```

各要素の自然対数を計算する

**Returns**: 自然対数ベクトル

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

各要素の対数を計算する

**Parameters**
- `base`: 底

**Returns**: 対数ベクトル

#### `log2`

```ts
log2(): BigFloatVector
```

各要素の底2対数を計算する

**Returns**: 底2対数ベクトル

#### `log10`

```ts
log10(): BigFloatVector
```

各要素の底10対数を計算する

**Returns**: 底10対数ベクトル

#### `log1p`

```ts
log1p(): BigFloatVector
```

各要素のlog(1+x)を計算する

**Returns**: log1pベクトル

#### `gamma`

```ts
gamma(): BigFloatVector
```

各要素のガンマ関数を計算する

**Returns**: ガンマ関数ベクトル

#### `zeta`

```ts
zeta(): BigFloatVector
```

各要素のゼータ関数を計算する

**Returns**: ゼータ関数ベクトル

#### `factorial`

```ts
factorial(): BigFloatVector
```

各要素の階乗を計算する

**Returns**: 階乗ベクトル

#### `max`

```ts
max(): BigFloat
```

最大値を返す

**Returns**: 最大値

#### `min`

```ts
min(): BigFloat
```

最小値を返す

**Returns**: 最小値

#### `sum`

```ts
sum(): BigFloat
```

合計を返す

**Returns**: 合計

#### `product`

```ts
product(): BigFloat
```

積を返す

**Returns**: 積

#### `average`

```ts
average(): BigFloat
```

平均を返す

**Returns**: 平均

#### `dot`

```ts
dot(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
```

内積を返す

**Parameters**
- `other`: 対象ベクトル

**Returns**: 内積

#### `squaredNorm`

```ts
squaredNorm(): BigFloat
```

二乗ノルムを返す

**Returns**: 二乗ノルム

#### `norm`

```ts
norm(): BigFloat
```

ノルムを返す

**Returns**: ノルム

#### `normalize`

```ts
normalize(): BigFloatVector
```

正規化ベクトルを返す

**Returns**: 正規化ベクトル

#### `squaredDistanceTo`

```ts
squaredDistanceTo(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
```

二乗距離を返す

**Parameters**
- `other`: 対象ベクトル

**Returns**: 二乗距離

#### `distanceTo`

```ts
distanceTo(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
```

距離を返す

**Parameters**
- `other`: 対象ベクトル

**Returns**: 距離

#### `projectOnto`

```ts
projectOnto(other: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

射影ベクトルを返す

**Parameters**
- `other`: 射影先ベクトル

**Returns**: 射影ベクトル

#### `angleTo`

```ts
angleTo(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
```

2ベクトルのなす角を返す

**Parameters**
- `other`: 対象ベクトル

**Returns**: 角度

#### `cross`

```ts
cross(other: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

3次元外積を返す

**Parameters**
- `other`: 対象ベクトル

**Returns**: 外積ベクトル

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
interface BigFloatOptions { allowPrecisionMismatch?: boolean; allowComplexNumbers?: boolean; mutateResult?: boolean; allowSpecialValues?: boolean; roundingMode?: RoundingMode.TRUNCATE | RoundingMode.UP | RoundingMode.CEIL | RoundingMode.FLOOR | RoundingMode.HALF_UP | RoundingMode.HALF_DOWN; extraPrecision?: bigint; trigFuncsMaxSteps?: bigint; lnMaxSteps?: bigint }
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
