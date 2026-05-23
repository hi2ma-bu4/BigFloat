# BigFloat API

`npm run build:md` で自動生成された API リファレンスです。

## Contents

- [`bigFloat`](#bigfloat)
- [`BigFloat`](#bigfloat-1)
- [`BigFloatConfig`](#bigfloatconfig)
- [`bigFloatComplex`](#bigfloatcomplex)
- [`BigFloatComplex`](#bigfloatcomplex-1)
- [`BigFloatComplexMatrix`](#bigfloatcomplexmatrix)
- [`BigFloatComplexVector`](#bigfloatcomplexvector)
- [`BigFloatMatrix`](#bigfloatmatrix)
- [`BigFloatStream`](#bigfloatstream)
- [`BigFloatVector`](#bigfloatvector)
- [`BigFloatError`](#bigfloaterror)
- [`CacheNotInitializedError`](#cachenotinitializederror)
- [`DimensionMismatchError`](#dimensionmismatcherror)
- [`DivisionByZeroError`](#divisionbyzeroerror)
- [`NumericalComputationError`](#numericalcomputationerror)
- [`PrecisionMismatchError`](#precisionmismatcherror)
- [`SingularMatrixError`](#singularmatrixerror)
- [`SpecialValuesDisabledError`](#specialvaluesdisablederror)
- [`RoundingMode`](#roundingmode)
- [`SpecialValueState`](#specialvaluestate)
- [`BigFloatOptions`](#bigfloatoptions)
- [`PrecisionValue`](#precisionvalue)
- [`BigFloatValue`](#bigfloatvalue)
- [`BigFloatAggregateArgs`](#bigfloataggregateargs)
- [`BigFloatLike`](#bigfloatlike)
- [`BigFloatInputValue`](#bigfloatinputvalue)
- [`BigFloatVectorLike`](#bigfloatvectorlike)
- [`BigFloatComplexVectorLike`](#bigfloatcomplexvectorlike)
- [`BigFloatAnyVector`](#bigfloatanyvector)
- [`BigFloatAnyVectorLike`](#bigfloatanyvectorlike)
- [`BigFloatMatrixLike`](#bigfloatmatrixlike)
- [`BigFloatComplexMatrixLike`](#bigfloatcomplexmatrixlike)
- [`BigFloatAnyMatrix`](#bigfloatanymatrix)
- [`BigFloatAnyMatrixLike`](#bigfloatanymatrixlike)

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
constructor(value?: string | number | bigint | BigFloat | BigFloatComplex, precision?: number | bigint): BigFloat
```

大きな浮動小数点数を扱えるクラス

**Parameters**
- `value`: 初期値 (数値, 文字列, BigInt, または別の BigFloat)
- `precision`: 精度 (小数点以下の最大桁数)

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を渡した場合

**Throws**: 虚部が 0 でない複素数を渡した場合

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

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

#### `e`

```ts
e(precision?: number | bigint): BigFloat
```

自然対数の底(e)を取得する

**Parameters**
- `precision`: 精度

**Returns**: e

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: キャッシュが存在しない場合

#### `pi`

```ts
pi(precision?: number | bigint): BigFloat
```

円周率(pi)を取得する

**Parameters**
- `precision`: 精度

**Returns**: pi

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: キャッシュが存在しない場合

#### `tau`

```ts
tau(precision?: number | bigint): BigFloat
```

タウ(tau = 2*pi)を取得する

**Parameters**
- `precision`: 精度

**Returns**: tau

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: キャッシュが存在しない場合

#### `abs`

```ts
abs(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.abs() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 絶対値

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `acos`

```ts
acos(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.acos() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆余弦

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 導関数がゼロになった場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acosh`

```ts
acosh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.acosh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆双曲線余弦

**Throws**: 入力が範囲外([1, ∞))の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asin`

```ts
asin(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.asin() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆正弦

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 導関数がゼロになった場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asinh`

```ts
asinh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.asinh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆双曲線正弦

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan`

```ts
atan(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.atan() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆正接

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

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

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 数値的に不安定な点の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atanh`

```ts
atanh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.atanh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 逆双曲線正接

**Throws**: 入力が範囲外([-1, 1])の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cbrt`

```ts
cbrt(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.cbrt() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 立方根

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `ceil`

```ts
ceil(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.ceil() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 切り上げ結果

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `clz32`

```ts
clz32(value: string | number | bigint | BigFloat): BigFloat
```

Math.clz32() 相当

**Parameters**
- `value`: 対象値

**Returns**: 先頭ゼロビット数

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cos`

```ts
cos(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.cos() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 余弦

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cosh`

```ts
cosh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.cosh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 双曲線余弦

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `exp`

```ts
exp(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.exp() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 指数関数

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `expm1`

```ts
expm1(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.expm1() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: e^x - 1

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `floor`

```ts
floor(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.floor() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 切り捨て結果

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `fround`

```ts
fround(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.fround() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: Float32相当に丸めた結果

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `hypot`

```ts
hypot(...values: string | number | bigint | BigFloat[]): BigFloat
```

Math.hypot() 相当

**Parameters**
- `values`: 値の列

**Returns**: sqrt(sum(x_i^2))

**Throws**: 特殊値が無効な場合に特殊値を含む引数が渡されたとき

**Throws**: 複素数モードが無効な場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `imul`

```ts
imul(lhs: string | number | bigint | BigFloat, rhs: string | number | bigint | BigFloat): BigFloat
```

Math.imul() 相当

**Parameters**
- `lhs`: 左辺
- `rhs`: 右辺

**Returns**: 32bit整数乗算結果

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `log`

```ts
log(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 自然対数

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `log10`

```ts
log10(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log10() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 常用対数

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log1p`

```ts
log1p(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log1p() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: ln(1 + x)

**Throws**: 特殊値が無効な設定で x が -1 以下の値の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `log2`

```ts
log2(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.log2() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 底2対数

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `max`

```ts
max(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

Math.max() 相当

**Parameters**
- `args`: 数値のリスト

**Returns**: 最大値

**Throws**: 特殊値が無効な場合に特殊値を含む引数が渡されたとき

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

#### `min`

```ts
min(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

Math.min() 相当

**Parameters**
- `args`: 数値のリスト

**Returns**: 最小値

**Throws**: 特殊値が無効な場合に特殊値を含む引数が渡されたとき

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

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

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `round`

```ts
round(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.round() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 四捨五入結果

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sign`

```ts
sign(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sign() 相当

**Parameters**
- `value`: 対象値
- `precision`: 入力精度

**Returns**: 符号

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `sin`

```ts
sin(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sin() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 正弦

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sinh`

```ts
sinh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sinh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 双曲線正弦

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sqrt`

```ts
sqrt(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.sqrt() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 平方根

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `tan`

```ts
tan(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.tan() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 正接

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 正接が定義されない点の場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `tanh`

```ts
tanh(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.tanh() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 双曲線正接

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `trunc`

```ts
trunc(value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloat
```

Math.trunc() 相当

**Parameters**
- `value`: 対象値
- `precision`: 結果精度

**Returns**: 切り捨て結果

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `sum`

```ts
sum(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の合計を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 合計

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `product`

```ts
product(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の積を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 積

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `average`

```ts
average(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の平均を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 平均

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `median`

```ts
median(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の中央値を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 中央値

**Throws**: 引数が空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `variance`

```ts
variance(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の分散を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 分散

**Throws**: 引数が空の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `stddev`

```ts
stddev(...args: string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]): BigFloat
```

引数の標準偏差を返す

**Parameters**
- `args`: 数値のリスト

**Returns**: 標準偏差

**Throws**: 引数が空の場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `random`

```ts
random(precision?: number | bigint): BigFloat
```

0以上1未満のランダムなBigFloatを生成する

**Parameters**
- `precision`: 精度

**Returns**: ランダムなBigFloat

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

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

**Returns**: 2の指数 (2^exp2)

#### `exponent5`

```ts
exponent5(): bigint
```

5の指数を取得する

**Returns**: 5の指数 (5^exp5)

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

**Throws**: BigFloat.mod does not support BigFloatComplex operands

#### `lazyNormalize`

```ts
lazyNormalize(): void
```

レイジー正規化 (5の累乗を外に出す)

**Throws**: BigFloat.mod does not support BigFloatComplex operands

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloat
```

精度を変更する

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度が変更されたインスタンス

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: BigFloat.mod does not support BigFloatComplex operands

#### `matchingPrecision`

```ts
matchingPrecision(other: string | number | bigint | BigFloat): bigint
```

どこまで精度が一致しているかを判定する

**Parameters**
- `other`: 比較対象

**Returns**: 一致している桁数

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `compare`

```ts
compare(other: string | number | bigint | BigFloat | BigFloatComplex): number
```

比較演算

**Parameters**
- `other`: 比較対象

**Returns**: 比較結果 (-1, 0, 1)。NaN の比較が含まれる場合は NaN

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 複素数と比較しようとした場合

#### `eq`

```ts
eq(other: string | number | bigint | BigFloat | BigFloatComplex): boolean
```

等しいかどうかを判定する (==)

**Parameters**
- `other`: 比較対象

**Returns**: 等しい場合はtrue

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `equals`

```ts
equals(other: string | number | bigint | BigFloat | BigFloatComplex): boolean
```

等しいかどうかを判定する (==)

**Parameters**
- `other`: 比較対象

**Returns**: 等しい場合はtrue

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `ne`

```ts
ne(other: string | number | bigint | BigFloat | BigFloatComplex): boolean
```

等しくないかどうかを判定する (!=)

**Parameters**
- `other`: 比較対象

**Returns**: 等しくない場合はtrue

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `lt`

```ts
lt(other: string | number | bigint | BigFloat | BigFloatComplex): boolean
```

より小さいかどうかを判定する (<)

**Parameters**
- `other`: 比較対象

**Returns**: より小さい場合はtrue

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `lte`

```ts
lte(other: string | number | bigint | BigFloat | BigFloatComplex): boolean
```

以下かどうかを判定する (<=)

**Parameters**
- `other`: 比較対象

**Returns**: 以下の場合はtrue

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `gt`

```ts
gt(other: string | number | bigint | BigFloat | BigFloatComplex): boolean
```

より大きいかどうかを判定する (>)

**Parameters**
- `other`: 比較対象

**Returns**: より大きい場合はtrue

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `gte`

```ts
gte(other: string | number | bigint | BigFloat | BigFloatComplex): boolean
```

以上かどうかを判定する (>=)

**Parameters**
- `other`: 比較対象

**Returns**: 以上の場合はtrue

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

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

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat
```

絶対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat
```

差分の非一致度を計算する (百分率)

**Parameters**
- `other`: 比較対象

**Returns**: 非一致度 (%)

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

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

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `toJSON`

```ts
toJSON(): string
```

JSON用の文字列表現を取得する

**Returns**: JSON文字列

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `toNumber`

```ts
toNumber(): number
```

Number型に変換する

**Returns**: 変換された数値

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `toFixed`

```ts
toFixed(digits: number | bigint): string
```

指定した桁数で固定した文字列を取得する

**Parameters**
- `digits`: 小数点以下の桁数

**Returns**: 固定小数点形式の文字列

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `toExponential`

```ts
toExponential(digits?: number): string
```

指数形式の文字列を取得する

**Parameters**
- `digits`: 有効桁数

**Returns**: 指数形式の文字列

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `add`

```ts
add(other: string | number | bigint | BigFloat): BigFloat
add(other: BigFloatComplex): BigFloatComplex
add(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat | BigFloatComplex
```

加算する (+)
複素数を加算する (+)

**Parameters**
- `other`: 加算する値

**Returns**: 加算結果

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat): BigFloat
sub(other: BigFloatComplex): BigFloatComplex
sub(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat | BigFloatComplex
```

減算する (-)
複素数を減算する (-)

**Parameters**
- `other`: 減算する値

**Returns**: 減算結果

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mul`

```ts
mul(other: string | number | bigint | BigFloat): BigFloat
mul(other: BigFloatComplex): BigFloatComplex
mul(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat | BigFloatComplex
```

乗算する (*)
複素数を乗算する (*)

**Parameters**
- `other`: 乗算する値

**Returns**: 乗算結果

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `div`

```ts
div(other: string | number | bigint | BigFloat): BigFloat
div(other: BigFloatComplex): BigFloatComplex
div(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat | BigFloatComplex
```

除算する (/)
複素数で除算する (/)

**Parameters**
- `other`: 除算する値

**Returns**: 除算結果

**Throws**: Division by zero

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat): BigFloat
mod(other: BigFloatComplex): never
mod(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloat
```

剰余を計算する (%)
複素数の剰余（未サポート）

**Parameters**
- `other`: 法

**Returns**: 剰余

**Throws**: 常にスローされる

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 複素数モードが無効な場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `neg`

```ts
neg(): BigFloat
```

符号を反転させる

**Returns**: 符号が反転した結果

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `abs`

```ts
abs(): BigFloat
```

絶対値を取得する

**Returns**: 絶対値

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `sign`

```ts
sign(): BigFloat
```

符号を取得する

**Returns**: 1, 0, 1 または NaN

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `reciprocal`

```ts
reciprocal(): BigFloat
```

逆数を取得する

**Returns**: 逆数

**Throws**: ゼロの場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `floor`

```ts
floor(): BigFloat
```

床関数 (負の無限大方向への丸め)

**Returns**: 丸められた結果

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `ceil`

```ts
ceil(): BigFloat
```

天井関数 (正の無限大方向への丸め)

**Returns**: 丸められた結果

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `round`

```ts
round(): BigFloat
```

四捨五入する

**Returns**: 四捨五入された結果

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `trunc`

```ts
trunc(): BigFloat
```

0に近い方向へ切り捨てる

**Returns**: 切り捨てられた結果

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `fround`

```ts
fround(): BigFloat
```

Float32 精度へ丸める

**Returns**: Float32相当に丸めた結果

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `clz32`

```ts
clz32(): BigFloat
```

32bit整数として見たときの先頭ゼロビット数を返す

**Returns**: 先頭ゼロビット数

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat): BigFloat
pow(exponent: BigFloatComplex): BigFloatComplex
```

冪乗を計算する
複素数の冪乗を計算する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗の結果

**Throws**: Fractional power of negative number is not real

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `sqrt`

```ts
sqrt(): BigFloat
```

平方根を計算する

**Returns**: 平方根

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cbrt`

```ts
cbrt(): BigFloat
```

立方根を計算する

**Returns**: 立方根

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloat
```

n乗根を計算する

**Parameters**
- `n`: 指数

**Returns**: n乗根

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `sin`

```ts
sin(): BigFloat
```

正弦(sin)を計算する

**Returns**: 正弦

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cos`

```ts
cos(): BigFloat
```

余弦(cos)を計算する

**Returns**: 余弦

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `tan`

```ts
tan(): BigFloat
```

正接(tan)を計算する

**Returns**: 正接

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 正接が定義されない点の場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asin`

```ts
asin(): BigFloat
```

逆正弦(asin)を計算する

**Returns**: 角度(ラジアン)

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 導関数がゼロになった場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acos`

```ts
acos(): BigFloat
```

逆余弦(acos)を計算する

**Returns**: 角度(ラジアン)

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 導関数がゼロになった場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan`

```ts
atan(): BigFloat
```

逆正接(atan)を計算する

**Returns**: 角度(ラジアン)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat): BigFloat
```

2引数の逆正接(atan2)を計算する

**Parameters**
- `x`: x座標

**Returns**: 角度(ラジアン)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sinh`

```ts
sinh(): BigFloat
```

双曲線正弦(sinh)を計算する

**Returns**: 双曲線正弦

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cosh`

```ts
cosh(): BigFloat
```

双曲線余弦(cosh)を計算する

**Returns**: 双曲線余弦

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `tanh`

```ts
tanh(): BigFloat
```

双曲線正接(tanh)を計算する

**Returns**: 双曲線正接

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asinh`

```ts
asinh(): BigFloat
```

逆双曲線正弦(asinh)を計算する

**Returns**: 逆双曲線正弦

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acosh`

```ts
acosh(): BigFloat
```

逆双曲線余弦(acosh)を計算する

**Returns**: 逆双曲線余弦

**Throws**: 入力が範囲外([1, ∞))の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atanh`

```ts
atanh(): BigFloat
```

逆双曲線正接(atanh)を計算する

**Returns**: 逆双曲線正接

**Throws**: 入力が範囲外([-1, 1])の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp`

```ts
exp(): BigFloat
```

指数関数(e^x)を計算する

**Returns**: e^x

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp2`

```ts
exp2(): BigFloat
```

2の冪乗(2^x)を計算する

**Returns**: 2^x

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `expm1`

```ts
expm1(): BigFloat
```

e^x - 1 を計算する

**Returns**: e^x - 1

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `ln`

```ts
ln(): BigFloat
```

自然対数(ln)を計算する

**Returns**: ln(x)

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `log`

```ts
log(base: string | number | bigint | BigFloat): BigFloat
```

対数を計算する

**Parameters**
- `base`: 底

**Returns**: log_base(x)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 底が1または0の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `log2`

```ts
log2(): BigFloat
```

2を底とする対数(log2)を計算する

**Returns**: log2(x)

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log10`

```ts
log10(): BigFloat
```

10を底とする対数(log10)を計算する

**Returns**: log10(x)

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log1p`

```ts
log1p(): BigFloat
```

ln(1 + x) を計算する

**Returns**: ln(1 + x)

**Throws**: 特殊値が無効な設定で x が -1 以下の値の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `gamma`

```ts
gamma(): BigFloat
```

ガンマ関数を計算する

**Returns**: ガンマ関数

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

#### `zeta`

```ts
zeta(): BigFloat
```

Riemann zeta 関数を計算する

**Returns**: zeta(this)

**Throws**: 特殊値が無効な設定で this = 1 の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ除算が発生した場合

**Throws**: キャッシュが存在しない場合

#### `factorial`

```ts
factorial(): BigFloat
```

階乗を計算する

**Returns**: 階乗

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

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
- `options.allowPrecisionMismatch`: 精度の不一致を許容するかどうか
- `options.allowComplexNumbers`: BigFloatComplex との相互運用を許容するかどうか
- `options.mutateResult`: 破壊的な計算(自身の上書き)をするかどうか
- `options.allowSpecialValues`: Infinity/NaN の特殊値を許容するかどうか
- `options.roundingMode`: 丸めモード
- `options.extraPrecision`: 計算時に追加する精度
- `options.trigFuncsMaxSteps`: 三角関数の最大ステップ数
- `options.lnMaxSteps`: 対数計算の最大ステップ数

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
bigFloatComplex(value?: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }, precision?: number | bigint): BigFloatComplex
```

BigFloatComplex を作成する

**Parameters**
- `value`: 実部、複素数表現、または複素数オブジェクト
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
constructor(value?: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }, precision?: number | bigint): BigFloatComplex
constructor(real: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }, imag?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

BigFloat を用いた複素数クラス

**Parameters**
- `value`: 実部、複素数表現 (文字列 "1+2i" など)、または複素数オブジェクト
- `precision`: 精度
- `real`: 実部または複素数表現
- `imag`: 虚部
- `imagOrPrecision`: 虚部または精度

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

### Static Methods

#### `zero`

```ts
zero(precision?: number | bigint): BigFloatComplex
```

複素数 0 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 0 + 0i

#### `one`

```ts
one(precision?: number | bigint): BigFloatComplex
```

複素数 1 を取得する

**Parameters**
- `precision`: 精度

**Returns**: 1 + 0i

#### `i`

```ts
i(precision?: number | bigint): BigFloatComplex
```

虚数単位 i を取得する

**Parameters**
- `precision`: 精度

**Returns**: 0 + 1i

#### `e`

```ts
e(precision?: number | bigint): BigFloatComplex
```

自然対数の底 e を実部とした複素数を取得する

**Parameters**
- `precision`: 精度

**Returns**: e + 0i

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: キャッシュが存在しない場合

#### `pi`

```ts
pi(precision?: number | bigint): BigFloatComplex
```

円周率 pi を実部とした複素数を取得する

**Parameters**
- `precision`: 精度

**Returns**: pi + 0i

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: キャッシュが存在しない場合

#### `tau`

```ts
tau(precision?: number | bigint): BigFloatComplex
```

2*pi (tau) を実部とした複素数を取得する

**Parameters**
- `precision`: 精度

**Returns**: tau + 0i

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: キャッシュが存在しない場合

#### `from`

```ts
from(value: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }, precision?: number | bigint): BigFloatComplex
from(value: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }, imag?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

与えられた値から BigFloatComplex を生成する

**Parameters**
- `value`: 実部、複素数表現、または複素数オブジェクト
- `precision`: 精度
- `imag`: 虚部

**Returns**: BigFloatComplex インスタンス

#### `of`

```ts
of(real: string | number | bigint | BigFloat, imag?: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

実部と虚部を指定して BigFloatComplex を生成する

**Parameters**
- `real`: 実部
- `imag`: 虚部
- `precision`: 精度

**Returns**: BigFloatComplex インスタンス

#### `fromPolar`

```ts
fromPolar(magnitude: string | number | bigint | BigFloat, angle: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatComplex
```

極形式から複素数を生成する

**Parameters**
- `magnitude`: 絶対値 (r)
- `angle`: 偏角 (theta, ラジアン)
- `precision`: 精度

**Returns**: 生成された BigFloatComplex

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sum`

```ts
sum(values: Iterable<BigFloatComplexValue>, precision?: number | bigint): BigFloatComplex
```

複素数リストの総和を計算する

**Parameters**
- `values`: 複素数のリスト
- `precision`: 結果の精度

**Returns**: 総和

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `product`

```ts
product(values: Iterable<BigFloatComplexValue>, precision?: number | bigint): BigFloatComplex
```

複素数リストの総積を計算する

**Parameters**
- `values`: 複素数のリスト
- `precision`: 結果の精度

**Returns**: 総積

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `average`

```ts
average(values: Iterable<BigFloatComplexValue>, precision?: number | bigint): BigFloatComplex
```

複素数リストの平均を計算する

**Parameters**
- `values`: 複素数のリスト
- `precision`: 結果の精度

**Returns**: 平均

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

### Instance Properties

#### `real`

```ts
real: BigFloat
```

実部を取得する (複製)

#### `imag`

```ts
imag: BigFloat
```

虚部を取得する (複製)

#### `precision`

```ts
precision: bigint
```

精度を取得する

### Instance Methods

#### `clone`

```ts
clone(): BigFloatComplex
```

インスタンスを複製する

**Returns**: 複製された BigFloatComplex

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatComplex
```

精度を変更した新しいインスタンスを返す

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度が変更された BigFloatComplex

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `toArray`

```ts
toArray(): [BigFloat, BigFloat]
```

実部と虚部を配列として取得する

**Returns**: [実部, 虚部]

#### `toVector`

```ts
toVector(): BigFloatVector
```

二次元のベクトルへ変換する

**Returns**: BigFloatVector インスタンス

#### `toPolar`

```ts
toPolar(): { magnitude: BigFloat; angle: BigFloat }
```

極形式 (絶対値と偏角) へ変換する

**Returns**: 絶対値 (magnitude) と偏角 (angle) のオブジェクト

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 数値的に不安定な点の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `toJSON`

```ts
toJSON(): { re: string; im: string }
```

JSON シリアライズ用のオブジェクトを取得する

**Returns**: : string, im: string} オブジェクト

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `toString`

```ts
toString(base?: number, precision?: number | bigint): string
```

文字列表現を取得する

**Parameters**
- `base`: 基数 (2-36)
- `precision`: 表示精度

**Returns**: "a + bi" 形式の文字列

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloat, void, undefined>
```

実部と虚部を順に反復するイテレータを取得する

**Returns**: BigFloat のイテレータ

#### `equals`

```ts
equals(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): boolean
```

別の複素数と等しいかどうかを判定する

**Parameters**
- `other`: 比較対象

**Returns**: 等しい場合は true

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `ne`

```ts
ne(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): boolean
```

別の複素数と等しくないかどうかを判定する

**Parameters**
- `other`: 比較対象

**Returns**: 等しくない場合は true

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `isZero`

```ts
isZero(): boolean
```

複素数 0 (0 + 0i) かどうかを判定する

**Returns**: 0 なら true

#### `isReal`

```ts
isReal(): boolean
```

純実数 (虚部が 0) かどうかを判定する

**Returns**: 純実数なら true

#### `isImaginary`

```ts
isImaginary(): boolean
```

純虚数 (実部が 0 かつ虚部が 0 でない) かどうかを判定する

**Returns**: 純虚数なら true

#### `conjugate`

```ts
conjugate(): BigFloatComplex
```

共役複素数 (a - bi) を取得する

**Returns**: 共役複素数

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `neg`

```ts
neg(): BigFloatComplex
```

符号を反転させた複素数 (-a - bi) を取得する

**Returns**: 符号反転された複素数

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `absSquared`

```ts
absSquared(): BigFloat
```

絶対値の二乗 (a^2 + b^2) を計算する

**Returns**: 絶対値の二乗

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `abs`

```ts
abs(): BigFloat
```

絶対値 (ノルム) を計算する

**Returns**: 絶対値

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `arg`

```ts
arg(): BigFloat
```

偏角 (引数) を計算する

**Returns**: 偏角 (ラジアン)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sign`

```ts
sign(): BigFloatComplex
```

複素数の符号 (z / |z|) を取得する

**Returns**: 単位円上の複素数、または 0

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `normalize`

```ts
normalize(): BigFloatComplex
```

ベクトルとして正規化する (絶対値を 1 にする)

**Returns**: 正規化された複素数

**Throws**: ゼロ複素数を正規化しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `distanceTo`

```ts
distanceTo(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloat
```

二つの複素数間の距離を計算する

**Parameters**
- `other`: 対象

**Returns**: 距離

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloat
```

別の複素数との相対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 複素数モードが無効な場合

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloat
```

別の複素数との絶対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloat
```

別の複素数との百分率差分を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 百分率差分 (%)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloatComplex
```

複素数を加算する

**Parameters**
- `other`: 加算する値

**Returns**: 加算結果

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloatComplex
```

複素数を減算する

**Parameters**
- `other`: 減算する値

**Returns**: 減算結果

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mul`

```ts
mul(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloatComplex
```

複素数を乗算する

**Parameters**
- `other`: 乗算する値

**Returns**: 乗算結果

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `div`

```ts
div(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloatComplex
```

複素数で除算する

**Parameters**
- `other`: 除算する値

**Returns**: 除算結果

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `reciprocal`

```ts
reciprocal(): BigFloatComplex
```

複素数の逆数を計算する

**Returns**: 逆数

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `rotate`

```ts
rotate(angle: string | number | bigint | BigFloat): BigFloatComplex
```

複素数を回転させる

**Parameters**
- `angle`: 回転角 (ラジアン)

**Returns**: 回転後の複素数

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp`

```ts
exp(): BigFloatComplex
```

複素数の指数関数 exp(z) を計算する

**Returns**: exp(z)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `expm1`

```ts
expm1(): BigFloatComplex
```

複素数における exp(z) - 1 を計算する

**Returns**: exp(z) - 1

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 複素数モードが無効な場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `ln`

```ts
ln(): BigFloatComplex
```

複素数の自然対数 ln(z) を計算する

**Returns**: ln(z)

**Throws**: ゼロ複素数の対数を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 数値的に不安定な点の場合

**Throws**: 文字列が複素数表現として無効な場合

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloatComplex
```

複素数の任意の底による対数を計算する

**Parameters**
- `base`: 底

**Returns**: 対数結果

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 数値的に不安定な点の場合

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloatComplex
```

複素数の冪乗 z^exponent を計算する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗結果

**Throws**: ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: キャッシュが存在しない場合

**Throws**: Division by zero

**Throws**: 数値的に不安定な点の場合

#### `sqrt`

```ts
sqrt(): BigFloatComplex
```

複素数の平方根を計算する

**Returns**: 平方根

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cbrt`

```ts
cbrt(): BigFloatComplex
```

複素数の立方根を計算する

**Returns**: 立方根

**Throws**: n が正の整数でない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 数値的に不安定な点の場合

**Throws**: 文字列が複素数表現として無効な場合

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatComplex
```

複素数の n 乗根の主値を計算する

**Parameters**
- `n`: 指数

**Returns**: n 乗根の主値

**Throws**: n が正の整数でない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 数値的に不安定な点の場合

**Throws**: 文字列が複素数表現として無効な場合

#### `nthRoots`

```ts
nthRoots(n: number | bigint): BigFloatComplex[]
```

複素数のすべての n 乗根を取得する

**Parameters**
- `n`: 指数 (正の整数)

**Returns**: n 乗根の配列

**Throws**: n が正の整数でない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 数値的に不安定な点の場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sin`

```ts
sin(): BigFloatComplex
```

複素数の正弦 (sin) を計算する

**Returns**: sin(z)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cos`

```ts
cos(): BigFloatComplex
```

複素数の余弦 (cos) を計算する

**Returns**: cos(z)

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `tan`

```ts
tan(): BigFloatComplex
```

複素数の正接 (tan) を計算する

**Returns**: tan(z)

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sinh`

```ts
sinh(): BigFloatComplex
```

複素数の双曲線正弦 (sinh) を計算する

**Returns**: sinh(z)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cosh`

```ts
cosh(): BigFloatComplex
```

複素数の双曲線余弦 (cosh) を計算する

**Returns**: cosh(z)

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `tanh`

```ts
tanh(): BigFloatComplex
```

複素数の双曲線正接 (tanh) を計算する

**Returns**: tanh(z)

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asin`

```ts
asin(): BigFloatComplex
```

複素数の逆正弦 (asin) を計算する

**Returns**: asin(z)

**Throws**: ゼロ複素数の対数を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `acos`

```ts
acos(): BigFloatComplex
```

複素数の逆余弦 (acos) を計算する

**Returns**: acos(z)

**Throws**: ゼロ複素数の対数を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `atan`

```ts
atan(): BigFloatComplex
```

複素数の逆正接 (atan) を計算する

**Returns**: atan(z)

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `asinh`

```ts
asinh(): BigFloatComplex
```

複素数の逆双曲線正弦 (asinh) を計算する

**Returns**: asinh(z)

**Throws**: ゼロ複素数の対数を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: キャッシュが存在しない場合

**Throws**: 数値的に不安定な点の場合

#### `acosh`

```ts
acosh(): BigFloatComplex
```

複素数の逆双曲線余弦 (acosh) を計算する

**Returns**: acosh(z)

**Throws**: ゼロ複素数の対数を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `atanh`

```ts
atanh(): BigFloatComplex
```

複素数の逆双曲線正接 (atanh) を計算する

**Returns**: atanh(z)

**Throws**: ゼロ複素数の対数を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: Division by zero

**Throws**: 数値的に不安定な点の場合

#### `floor`

```ts
floor(): BigFloatComplex
```

床関数 (負の無限大方向への丸め)

**Returns**: 丸められた結果

**Throws**: 虚部が 0 でない場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `ceil`

```ts
ceil(): BigFloatComplex
```

天井関数 (正の無限大方向への丸め)

**Returns**: 丸められた結果

**Throws**: 虚部が 0 でない場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `trunc`

```ts
trunc(): BigFloatComplex
```

0に近い方向へ切り捨てる

**Returns**: 切り捨てられた結果

**Throws**: 虚部が 0 でない場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `round`

```ts
round(): BigFloatComplex
```

四捨五入する

**Returns**: 四捨五入された結果

**Throws**: 虚部が 0 でない場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatComplex | [BigFloatValue | BigFloatComplex, BigFloatValue | BigFloatComplex] | { re?: string | number | bigint | BigFloat | BigFloatComplex; im?: string | number | bigint | BigFloat | BigFloatComplex; real?: string | number | bigint | BigFloat | BigFloatComplex; imag?: string | number | bigint | BigFloat | BigFloatComplex }): BigFloatComplex
```

剰余を計算する (%)

**Parameters**
- `other`: 法

**Returns**: 剰余

**Throws**: 虚部が 0 でない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `fround`

```ts
fround(): BigFloatComplex
```

Float32 精度へ丸める

**Returns**: Float32相当に丸めた結果

**Throws**: 虚部が 0 でない場合

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `clz32`

```ts
clz32(): BigFloatComplex
```

32bit整数として見たときの先頭ゼロビット数を返す

**Returns**: 先頭ゼロビット数

**Throws**: 虚部が 0 でない場合

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

<a id="bigfloatcomplexmatrix"></a>

## `BigFloatComplexMatrix`

BigFloatComplex を要素とする固定長行列クラス

```ts
class BigFloatComplexMatrix
```

### Constructor

#### `constructor`

```ts
constructor(rows?: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>, precision?: number | bigint): BigFloatComplexMatrix
```

BigFloatComplex を要素とする固定長行列クラス

**Parameters**
- `rows`: 行列要素の反復可能オブジェクト
- `precision`: 精度

**Throws**: Matrix rows must have the same length

### Static Methods

#### `empty`

```ts
empty(): BigFloatComplexMatrix
```

#### `from`

```ts
from(rows: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>, precision?: number | bigint): BigFloatComplexMatrix
```

#### `fromRows`

```ts
fromRows(rows: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>, precision?: number | bigint): BigFloatComplexMatrix
```

#### `fromColumns`

```ts
fromColumns(columns: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>, precision?: number | bigint): BigFloatComplexMatrix
```

#### `of`

```ts
of(...rows: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>[]): BigFloatComplexMatrix
```

#### `fill`

```ts
fill(rowCount: number, columnCount: number, value: string | number | bigint | BigFloat | BigFloatComplex, precision?: number | bigint): BigFloatComplexMatrix
```

#### `zeros`

```ts
zeros(rowCount: number, columnCount: number, precision?: number | bigint): BigFloatComplexMatrix
```

#### `ones`

```ts
ones(rowCount: number, columnCount: number, precision?: number | bigint): BigFloatComplexMatrix
```

#### `diagonal`

```ts
diagonal(values: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>, precision?: number | bigint): BigFloatComplexMatrix
```

#### `random`

```ts
random(rowCount: number, columnCount: number, options?: { min?: string | number | bigint | BigFloat | BigFloatComplex; max?: string | number | bigint | BigFloat | BigFloatComplex; precision?: number | bigint }): BigFloatComplexMatrix
```

#### `identity`

```ts
identity(size: number, precision?: number | bigint): BigFloatComplexMatrix
```

単位行列を生成する

**Parameters**
- `size`: 行列のサイズ
- `precision`: 精度

**Returns**: 単位行列

### Instance Properties

#### `rowCount`

```ts
rowCount: number
```

#### `columnCount`

```ts
columnCount: number
```

### Instance Methods

#### `isSquare`

```ts
isSquare(): boolean
```

#### `isEmpty`

```ts
isEmpty(): boolean
```

#### `shape`

```ts
shape(): [number, number]
```

#### `at`

```ts
at(row: number, column: number): undefined | BigFloatComplex
```

#### `row`

```ts
row(index: number): undefined | BigFloatComplexVector
```

#### `column`

```ts
column(index: number): undefined | BigFloatComplexVector
```

#### `clone`

```ts
clone(): BigFloatComplexMatrix
```

#### `toArray`

```ts
toArray(): BigFloatComplex[][]
```

#### `toVectors`

```ts
toVectors(): BigFloatComplexVector[]
```

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloatComplexVector, void, undefined>
```

#### `forEach`

```ts
forEach(fn: (value: BigFloatComplex, row: number, column: number): void): void
```

#### `map`

```ts
map(fn: (value: BigFloatComplex, row: number, column: number): string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexMatrix
```

#### `toStream`

```ts
toStream(): BigFloatStream
```

要素を流すストリームへ変換する

**Throws**: 例外が発生した場合

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `hadamard`

```ts
hadamard(other: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `mul`

```ts
mul(scalar: string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexMatrix
```

#### `div`

```ts
div(scalar: string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexMatrix
```

#### `matmul`

```ts
matmul(other: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

行列の積を計算する

**Parameters**
- `other`: 乗算する行列

**Returns**: 計算結果の行列

**Throws**: 行列の次元が一致しない場合

#### `transpose`

```ts
transpose(): BigFloatComplexMatrix
```

#### `rowSums`

```ts
rowSums(): BigFloatComplexVector
```

#### `columnSums`

```ts
columnSums(): BigFloatComplexVector
```

#### `trace`

```ts
trace(): BigFloatComplex
```

正方行列のトレース（対角和）を計算する

**Returns**: トレースの値

**Throws**: 正方行列でない場合

#### `determinant`

```ts
determinant(): BigFloatComplex
```

正方行列の行列式を計算する

**Returns**: 行列式の値

**Throws**: 正方行列でない場合

#### `inverse`

```ts
inverse(): BigFloatComplexMatrix
```

逆行列を計算する

**Returns**: 逆行列

**Throws**: 正方行列でない場合

**Throws**: 行列が特異（逆行列が存在しない）な場合

#### `solveVector`

```ts
solveVector(rhs: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

連立一次方程式 Ax = b を解く（bはベクトル）

**Parameters**
- `rhs`: 右辺ベクトル b

**Returns**: 解ベクトル x

**Throws**: 行列が正方でない、または次元が一致しない場合

#### `solveMatrix`

```ts
solveMatrix(rhs: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

連立一次方程式 AX = B を解く（Bは行列）

**Parameters**
- `rhs`: 右辺行列 B

**Returns**: 解行列 X

**Throws**: 行列が正方でない、または次元が一致しない場合

**Throws**: 行列が特異な場合

#### `matrixPow`

```ts
matrixPow(exponent: number): BigFloatComplexMatrix
```

行列のべき乗を計算する

**Parameters**
- `exponent`: 指数

**Returns**: 計算結果の行列

**Throws**: 行列が正方でない、または指数が整数でない場合

#### `equals`

```ts
equals(other: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): boolean
```

他の行列と等しいかどうかを判定する

**Parameters**
- `other`: 比較対象の行列

**Returns**: 等しい場合は true、そうでない場合は false

#### `sum`

```ts
sum(): BigFloatComplex
```

#### `product`

```ts
product(): BigFloatComplex
```

#### `average`

```ts
average(): BigFloatComplex
```

#### `frobeniusNorm`

```ts
frobeniusNorm(): BigFloat
```

#### `mulVector`

```ts
mulVector(vector: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

行列とベクトルの積を計算する

**Parameters**
- `vector`: 乗算するベクトル

**Returns**: 計算結果のベクトル

**Throws**: 行列の列数とベクトルの次元が一致しない場合

#### `diagonalVector`

```ts
diagonalVector(): BigFloatComplexVector
```

行列の対角成分をベクトルとして取得する

**Returns**: 対角成分のベクトル

**Throws**: 正方行列でない場合

#### `flatten`

```ts
flatten(): BigFloatComplexVector
```

#### `zipMap`

```ts
zipMap(other: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number): string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexMatrix
```

#### `reduce`

```ts
reduce<U>(fn: (acc: U, value: BigFloatComplex, row: number, column: number): U, initial: U): U
```

#### `some`

```ts
some(fn: (value: BigFloatComplex, row: number, column: number): boolean): boolean
```

#### `every`

```ts
every(fn: (value: BigFloatComplex, row: number, column: number): boolean): boolean
```

全ての要素が条件を満たすかどうかを判定する

**Parameters**
- `fn`: 判定関数

**Returns**: 全ての要素が条件を満たす場合は true、そうでない場合は false

#### `concatRows`

```ts
concatRows(...others: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>[]): BigFloatComplexMatrix
```

他の行列を行方向に連結する

**Parameters**
- `others`: 連結する行列

**Returns**: 連結された新しい行列

**Throws**: 列数が一致しない場合

#### `concatColumns`

```ts
concatColumns(...others: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>[]): BigFloatComplexMatrix
```

#### `sliceRows`

```ts
sliceRows(start?: number, end?: number): BigFloatComplexMatrix
```

#### `sliceColumns`

```ts
sliceColumns(start?: number, end?: number): BigFloatComplexMatrix
```

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatComplexMatrix
```

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `neg`

```ts
neg(): BigFloatComplexMatrix
```

#### `abs`

```ts
abs(): BigFloatMatrix
```

#### `sign`

```ts
sign(): BigFloatComplexMatrix
```

#### `reciprocal`

```ts
reciprocal(): BigFloatComplexMatrix
```

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `sqrt`

```ts
sqrt(): BigFloatComplexMatrix
```

#### `cbrt`

```ts
cbrt(): BigFloatComplexMatrix
```

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatComplexMatrix
```

#### `floor`

```ts
floor(): BigFloatComplexMatrix
```

#### `ceil`

```ts
ceil(): BigFloatComplexMatrix
```

#### `round`

```ts
round(): BigFloatComplexMatrix
```

#### `trunc`

```ts
trunc(): BigFloatComplexMatrix
```

#### `fround`

```ts
fround(): BigFloatComplexMatrix
```

#### `clz32`

```ts
clz32(): BigFloatComplexMatrix
```

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `sin`

```ts
sin(): BigFloatComplexMatrix
```

#### `cos`

```ts
cos(): BigFloatComplexMatrix
```

#### `tan`

```ts
tan(): BigFloatComplexMatrix
```

#### `asin`

```ts
asin(): BigFloatComplexMatrix
```

#### `acos`

```ts
acos(): BigFloatComplexMatrix
```

#### `atan`

```ts
atan(): BigFloatComplexMatrix
```

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `sinh`

```ts
sinh(): BigFloatComplexMatrix
```

#### `cosh`

```ts
cosh(): BigFloatComplexMatrix
```

#### `tanh`

```ts
tanh(): BigFloatComplexMatrix
```

#### `asinh`

```ts
asinh(): BigFloatComplexMatrix
```

各要素の逆双曲線正弦 (asinh) を計算する

**Returns**: 各要素に asinh を適用した行列

#### `acosh`

```ts
acosh(): BigFloatComplexMatrix
```

#### `atanh`

```ts
atanh(): BigFloatComplexMatrix
```

#### `exp`

```ts
exp(): BigFloatComplexMatrix
```

#### `exp2`

```ts
exp2(): BigFloatComplexMatrix
```

#### `expm1`

```ts
expm1(): BigFloatComplexMatrix
```

#### `ln`

```ts
ln(): BigFloatComplexMatrix
```

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix
```

#### `log2`

```ts
log2(): BigFloatComplexMatrix
```

#### `log10`

```ts
log10(): BigFloatComplexMatrix
```

#### `log1p`

```ts
log1p(): BigFloatComplexMatrix
```

#### `gamma`

```ts
gamma(): BigFloatComplexMatrix
```

gamma

**Throws**: 例外が発生した場合

#### `zeta`

```ts
zeta(): BigFloatComplexMatrix
```

#### `factorial`

```ts
factorial(): BigFloatComplexMatrix
```

#### `rank`

```ts
rank(): number
```

<a id="bigfloatcomplexvector"></a>

## `BigFloatComplexVector`

BigFloatComplex を要素とする固定長ベクトルクラス

```ts
class BigFloatComplexVector
```

### Constructor

#### `constructor`

```ts
constructor(values?: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>, precision?: number | bigint): BigFloatComplexVector
```

BigFloatComplex を要素とする固定長ベクトルクラス

**Parameters**
- `values`: 要素のソース
- `precision`: 精度

### Static Methods

#### `empty`

```ts
empty(): BigFloatComplexVector
```

空のベクトル (次元 0) を生成する

#### `from`

```ts
from(values: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>, precision?: number | bigint): BigFloatComplexVector
```

要素の反復可能オブジェクトから BigFloatComplexVector を生成する

#### `fromStream`

```ts
fromStream(stream: BigFloatStream): BigFloatComplexVector
```

BigFloatStream からベクトルを生成する

#### `of`

```ts
of(...values: string | number | bigint | BigFloat | BigFloatComplex[]): BigFloatComplexVector
```

引数リストからベクトルを生成する

#### `fill`

```ts
fill(length: number, value: string | number | bigint | BigFloat | BigFloatComplex, precision?: number | bigint): BigFloatComplexVector
```

指定された値で埋められたベクトルを生成する

#### `zeros`

```ts
zeros(length: number, precision?: number | bigint): BigFloatComplexVector
```

零ベクトルを生成する

#### `ones`

```ts
ones(length: number, precision?: number | bigint): BigFloatComplexVector
```

すべての要素が 1 のベクトルを生成する

#### `basis`

```ts
basis(length: number, index: number, precision?: number | bigint): BigFloatComplexVector
```

標準基底ベクトルを取得する

**Parameters**
- `length`: ベクトルの長さ
- `index`: 基底のインデックス
- `precision`: 精度

**Returns**: 標準基底ベクトル

**Throws**: インデックスが範囲外の場合

#### `linspace`

```ts
linspace(start: string | number | bigint | BigFloat | BigFloatComplex, end: string | number | bigint | BigFloat | BigFloatComplex, count: number, precision?: number | bigint): BigFloatComplexVector
```

指定した範囲を等分割する数値ベクトルを生成する

#### `random`

```ts
random(length: number, options?: { min?: string | number | bigint | BigFloat | BigFloatComplex; max?: string | number | bigint | BigFloat | BigFloatComplex; precision?: number | bigint }): BigFloatComplexVector
```

乱数ベクトルを生成する

### Instance Properties

#### `length`

```ts
length: number
```

### Instance Methods

#### `dimension`

```ts
dimension(): number
```

#### `isEmpty`

```ts
isEmpty(): boolean
```

#### `at`

```ts
at(index: number): undefined | BigFloatComplex
```

#### `clone`

```ts
clone(): BigFloatComplexVector
```

#### `toArray`

```ts
toArray(): BigFloatComplex[]
```

#### `toStream`

```ts
toStream(): BigFloatStream
```

要素を流すストリームへ変換する

**Throws**: 例外が発生した場合

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloatComplex, void, undefined>
```

#### `forEach`

```ts
forEach(fn: (value: BigFloatComplex, index: number): void): void
```

#### `map`

```ts
map(fn: (value: BigFloatComplex, index: number): string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexVector
```

#### `zipMap`

```ts
zipMap(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>, fn: (left: BigFloatComplex, right: BigFloatComplex, index: number): string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexVector
```

#### `reduce`

```ts
reduce<U>(fn: (acc: U, value: BigFloatComplex, index: number): U, initial: U): U
```

#### `some`

```ts
some(fn: (value: BigFloatComplex, index: number): boolean): boolean
```

#### `every`

```ts
every(fn: (value: BigFloatComplex, index: number): boolean): boolean
```

#### `concat`

```ts
concat(...others: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>[]): BigFloatComplexVector
```

#### `slice`

```ts
slice(start?: number, end?: number): BigFloatComplexVector
```

#### `reverse`

```ts
reverse(): BigFloatComplexVector
```

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatComplexVector
```

#### `equals`

```ts
equals(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): boolean
```

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `mul`

```ts
mul(scalar: string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexVector
```

#### `div`

```ts
div(scalar: string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexVector
```

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `hadamard`

```ts
hadamard(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `neg`

```ts
neg(): BigFloatComplexVector
```

#### `abs`

```ts
abs(): BigFloatVector
```

#### `sign`

```ts
sign(): BigFloatComplexVector
```

#### `reciprocal`

```ts
reciprocal(): BigFloatComplexVector
```

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `sqrt`

```ts
sqrt(): BigFloatComplexVector
```

#### `cbrt`

```ts
cbrt(): BigFloatComplexVector
```

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatComplexVector
```

#### `floor`

```ts
floor(): BigFloatComplexVector
```

#### `ceil`

```ts
ceil(): BigFloatComplexVector
```

#### `round`

```ts
round(): BigFloatComplexVector
```

#### `trunc`

```ts
trunc(): BigFloatComplexVector
```

#### `fround`

```ts
fround(): BigFloatComplexVector
```

#### `clz32`

```ts
clz32(): BigFloatComplexVector
```

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `sin`

```ts
sin(): BigFloatComplexVector
```

#### `cos`

```ts
cos(): BigFloatComplexVector
```

#### `tan`

```ts
tan(): BigFloatComplexVector
```

#### `asin`

```ts
asin(): BigFloatComplexVector
```

#### `acos`

```ts
acos(): BigFloatComplexVector
```

#### `atan`

```ts
atan(): BigFloatComplexVector
```

#### `sinh`

```ts
sinh(): BigFloatComplexVector
```

#### `cosh`

```ts
cosh(): BigFloatComplexVector
```

#### `tanh`

```ts
tanh(): BigFloatComplexVector
```

#### `asinh`

```ts
asinh(): BigFloatComplexVector
```

#### `acosh`

```ts
acosh(): BigFloatComplexVector
```

#### `atanh`

```ts
atanh(): BigFloatComplexVector
```

#### `exp`

```ts
exp(): BigFloatComplexVector
```

#### `expm1`

```ts
expm1(): BigFloatComplexVector
```

#### `ln`

```ts
ln(): BigFloatComplexVector
```

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

#### `log2`

```ts
log2(): BigFloatComplexVector
```

#### `log10`

```ts
log10(): BigFloatComplexVector
```

#### `max`

```ts
max(): BigFloatComplex
```

max

**Throws**: max() is not supported for complex vectors

#### `min`

```ts
min(): BigFloatComplex
```

min

**Throws**: min() is not supported for complex vectors

#### `sum`

```ts
sum(): BigFloatComplex
```

#### `product`

```ts
product(): BigFloatComplex
```

#### `average`

```ts
average(): BigFloatComplex
```

#### `dot`

```ts
dot(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplex
```

#### `squaredNorm`

```ts
squaredNorm(): BigFloat
```

#### `norm`

```ts
norm(): BigFloat
```

#### `normalize`

```ts
normalize(): BigFloatComplexVector
```

normalize

**Throws**: Cannot normalize zero vector

#### `distanceTo`

```ts
distanceTo(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloat
```

#### `cross`

```ts
cross(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

cross

**Throws**: Cross product is only defined for 3-dimensional vectors

#### `squaredDistanceTo`

```ts
squaredDistanceTo(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloat
```

#### `projectOnto`

```ts
projectOnto(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplexVector
```

別のベクトルへの正射影ベクトルを計算する

**Throws**: 例外が発生した場合

<a id="bigfloatmatrix"></a>

## `BigFloatMatrix`

BigFloat を固定長行列として扱うクラス

```ts
class BigFloatMatrix
```

### Constructor

#### `constructor`

```ts
constructor(rows?: BigFloatMatrix | Iterable<BigFloatVectorLike>, precision?: number | bigint): BigFloatMatrix
```

BigFloat を固定長行列として扱うクラス

**Parameters**
- `rows`: 行列要素の反復可能オブジェクト
- `precision`: 変換時の精度

**Throws**: 行列の行が同じ長さを持たない場合

### Static Methods

#### `empty`

```ts
empty(): BigFloatMatrix
```

空の行列 (0x0) を生成する

**Returns**: 空の行列

#### `from`

```ts
from(rows: BigFloatMatrix | Iterable<BigFloatVectorLike>, precision?: number | bigint): BigFloatMatrix
from(rows: BigFloatComplexMatrix | Iterable<BigFloatComplexVectorLike>, precision?: number | bigint): BigFloatComplexMatrix
```

行列要素の反復可能オブジェクトから BigFloatMatrix を生成する

**Parameters**
- `rows`: 要素
- `precision`: 精度

**Returns**: BigFloatMatrix インスタンス

**Throws**: 例外が発生した場合

#### `fromRows`

```ts
fromRows(rows: BigFloatMatrix | Iterable<BigFloatVectorLike>, precision?: number | bigint): BigFloatMatrix
```

行ベクトルのリストから行列を生成する

**Parameters**
- `rows`: 行要素
- `precision`: 精度

**Returns**: BigFloatMatrix インスタンス

#### `fromColumns`

```ts
fromColumns(columns: BigFloatMatrix | Iterable<BigFloatVectorLike>, precision?: number | bigint): BigFloatMatrix
```

列ベクトル群から生成する

**Throws**: 列ベクトルの長さが異なる場合

#### `of`

```ts
of(...rows: BigFloatVector | Iterable<BigFloatValue>[]): BigFloatMatrix
```

行配列の可変長引数から行列を生成する

**Parameters**
- `rows`: 各行の要素配列

**Returns**: BigFloatMatrix インスタンス

#### `fill`

```ts
fill(rowCount: number, columnCount: number, value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatMatrix
```

指定した値で埋められた行列を生成する

**Parameters**
- `rowCount`: 行数
- `columnCount`: 列数
- `value`: 埋める値
- `precision`: 精度

**Returns**: BigFloatMatrix インスタンス

**Throws**: size が負または非有限の場合

#### `zeros`

```ts
zeros(rowCount: number, columnCount: number, precision?: number | bigint): BigFloatMatrix
```

零行列を生成する

**Parameters**
- `rowCount`: 行数
- `columnCount`: 列数
- `precision`: 精度

**Returns**: BigFloatMatrix インスタンス

**Throws**: size が負または非有限の場合

#### `ones`

```ts
ones(rowCount: number, columnCount: number, precision?: number | bigint): BigFloatMatrix
```

すべての要素が 1 の行列を生成する

**Parameters**
- `rowCount`: 行数
- `columnCount`: 列数
- `precision`: 精度

**Returns**: BigFloatMatrix インスタンス

**Throws**: size が負または非有限の場合

#### `identity`

```ts
identity(size: number, precision?: number | bigint): BigFloatMatrix
```

単位行列を生成する

**Parameters**
- `size`: 次元数
- `precision`: 精度

**Returns**: BigFloatMatrix インスタンス

**Throws**: size が負または非有限の場合

#### `diagonal`

```ts
diagonal(values: Iterable<BigFloatValue>, precision?: number | bigint): BigFloatMatrix
```

対角要素を指定して対角行列を生成する

**Parameters**
- `values`: 対角要素のリスト
- `precision`: 精度

**Returns**: BigFloatMatrix インスタンス

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `random`

```ts
random(rowCount: number, columnCount: number, options?: { min?: string | number | bigint | BigFloat; max?: string | number | bigint | BigFloat; precision?: number | bigint }): BigFloatMatrix
```

乱数行列を生成する

**Throws**: max < min の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

### Instance Properties

#### `rowCount`

```ts
rowCount: number
```

行数を取得する

#### `columnCount`

```ts
columnCount: number
```

列数を取得する

### Instance Methods

#### `shape`

```ts
shape(): [number, number]
```

行列の形状 (行数と列数) を配列として取得する

**Returns**: [行数, 列数]

#### `isEmpty`

```ts
isEmpty(): boolean
```

行列が空 (次元が 0) かどうかを判定する

**Returns**: 空なら true

#### `isSquare`

```ts
isSquare(): boolean
```

正方行列かどうかを判定する

**Returns**: 正方行列なら true

#### `at`

```ts
at(row: number, column: number): undefined | BigFloat
```

指定したインデックスの要素を取得する (複製)

**Parameters**
- `row`: 行インデックス
- `column`: 列インデックス

**Returns**: 要素の値、インデックスが範囲外の場合は undefined

#### `row`

```ts
row(index: number): undefined | BigFloatVector
```

指定した行を取得する

**Parameters**
- `index`: 行インデックス

**Returns**: 指定行のベクトル、インデックスが範囲外の場合は undefined

#### `column`

```ts
column(index: number): undefined | BigFloatVector
```

指定した列を取得する

**Parameters**
- `index`: 列インデックス

**Returns**: 指定列のベクトル、インデックスが範囲外の場合は undefined

#### `diagonalVector`

```ts
diagonalVector(): BigFloatVector
```

対角成分を取得する

**Returns**: 対角成分のベクトル

**Throws**: 正方行列でない場合

#### `clone`

```ts
clone(): BigFloatMatrix
```

行列を複製する

**Returns**: 複製された BigFloatMatrix

#### `toArray`

```ts
toArray(): BigFloat[][]
```

二次元配列へ変換する

**Returns**: 各要素が BigFloat の二次元配列

#### `toVectors`

```ts
toVectors(): BigFloatVector[]
```

行ごとのベクトルの配列へ変換する

**Returns**: BigFloatVector の配列

#### `flatten`

```ts
flatten(): BigFloatVector
```

行列を平坦化したベクトルへ変換する

**Returns**: 行列の全要素を持つ BigFloatVector

#### `toStream`

```ts
toStream(): BigFloatStream
```

全要素を流すストリームへ変換する

**Returns**: BigFloatStream インスタンス

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloatVector, void, undefined>
```

行ベクトルを順に反復するイテレータを取得する

**Returns**: 行ベクトルのイテレータ

#### `forEach`

```ts
forEach(fn: (value: BigFloat, row: number, column: number): void): void
```

各要素に対して関数を実行する

**Parameters**
- `fn`: 実行する関数

#### `map`

```ts
map(fn: (value: BigFloat, row: number, column: number): string | number | bigint | BigFloat): BigFloatMatrix | BigFloatMatrix
```

各要素を変換した新しい行列を取得する

**Parameters**
- `fn`: 変換関数

**Returns**: 変換後の新しい行列

#### `zipMap`

```ts
zipMap(other: BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>, fn: (left: BigFloat, right: BigFloat | BigFloatComplex, row: number, column: number): string | number | bigint | BigFloat): BigFloatComplexMatrix | BigFloatMatrix | BigFloatMatrix
```

別の行列と要素ごとに対になる変換を行い、新しい行列を取得する

**Parameters**
- `other`: 対象行列
- `fn`: 変換関数

**Returns**: 変換後の新しい行列

**Throws**: 行列形状が一致しない場合

#### `reduce`

```ts
reduce<U>(fn: (acc: U, value: BigFloat, row: number, column: number): U, initial: U): U
```

全要素を累積して単一の値を計算する

**Parameters**
- `fn`: 累積関数
- `initial`: 初期値

**Returns**: 累積された結果

#### `some`

```ts
some(fn: (value: BigFloat, row: number, column: number): boolean): boolean
```

条件を満たす要素が少なくとも一つ存在するかどうかを判定する

**Parameters**
- `fn`: 判定関数

**Returns**: 条件を満たす要素があれば true

#### `every`

```ts
every(fn: (value: BigFloat, row: number, column: number): boolean): boolean
```

すべての要素が条件を満たすかどうかを判定する

**Parameters**
- `fn`: 判定関数

**Returns**: すべての要素が条件を満たせば true

#### `concatRows`

```ts
concatRows(...others: BigFloatMatrix | Iterable<BigFloatVectorLike>[]): BigFloatMatrix
```

行方向に連結する

**Throws**: 列数が一致しない場合

#### `concatColumns`

```ts
concatColumns(...others: BigFloatMatrix | Iterable<BigFloatVectorLike>[]): BigFloatMatrix
```

列方向に連結する

**Throws**: 行数が一致しない場合

#### `sliceRows`

```ts
sliceRows(start?: number, end?: number): BigFloatMatrix
```

行の一部を抽出した新しい行列を返す

**Parameters**
- `start`: 開始インデックス
- `end`: 終了インデックス

**Returns**: 抽出された新しい行列

#### `sliceColumns`

```ts
sliceColumns(start?: number, end?: number): BigFloatMatrix
```

列の一部を抽出した新しい行列を返す

**Parameters**
- `start`: 開始インデックス
- `end`: 終了インデックス

**Returns**: 抽出された新しい行列

#### `transpose`

```ts
transpose(): BigFloatMatrix
```

転置行列を取得する

**Returns**: 転置された新しい行列

#### `equals`

```ts
equals(other: BigFloatMatrix | Iterable<BigFloatVectorLike>): boolean
```

別の行列と内容が等しいかどうかを判定する

**Parameters**
- `other`: 比較対象

**Returns**: 等しい場合は true

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatMatrix | BigFloatMatrix
```

すべての要素の精度を変更した新しい行列を取得する

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度が変更された新しい行列

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix | BigFloatMatrix | BigFloatMatrix
```

各要素に別の行列またはスカラ値を加算した新しい行列を取得する

**Parameters**
- `other`: 加算する行列または数値

**Returns**: 加算後の新しい行列

**Throws**: 行列形状が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>): BigFloatComplexMatrix | BigFloatMatrix | BigFloatMatrix
```

各要素から別の行列またはスカラ値を減算した新しい行列を取得する

**Parameters**
- `other`: 減算する行列または数値

**Returns**: 減算後の新しい行列

**Throws**: 行列形状が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mul`

```ts
mul(scalar: string | number | bigint | BigFloat): BigFloatComplexMatrix | BigFloatMatrix | BigFloatMatrix
```

各要素にスカラ値を乗算した新しい行列を取得する

**Parameters**
- `scalar`: 乗算する数値

**Returns**: 乗算後の新しい行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `div`

```ts
div(scalar: string | number | bigint | BigFloat): BigFloatMatrix | BigFloatMatrix
```

各要素をスカラ値で除算した新しい行列を取得する

**Parameters**
- `scalar`: 除数

**Returns**: 除算後の新しい行列

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

各要素に対して剰余演算を行った新しい行列を取得する

**Parameters**
- `other`: 法

**Returns**: 演算後の新しい行列

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 行列形状が一致しない場合

**Throws**: 精度の不一致が許容されていない場合

#### `hadamard`

```ts
hadamard(other: BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

別の行列とのアダマール積 (要素ごとの積) を計算する

**Parameters**
- `other`: 対象行列

**Returns**: アダマール積の結果の行列

**Throws**: 行列形状が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `neg`

```ts
neg(): BigFloatMatrix | BigFloatMatrix
```

各要素の符号を反転させた新しい行列を取得する

**Returns**: 符号反転後の新しい行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `abs`

```ts
abs(): BigFloatMatrix | BigFloatMatrix
```

各要素を絶対値にした新しい行列を取得する

**Returns**: 絶対値適用後の新しい行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `sign`

```ts
sign(): BigFloatMatrix | BigFloatMatrix
```

各要素の符号 (1, 0, -1) を持つ行列を取得する

**Returns**: 符号行列

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `reciprocal`

```ts
reciprocal(): BigFloatMatrix | BigFloatMatrix
```

各要素の逆数を持つ行列を取得する

**Returns**: 逆数行列

**Throws**: ゼロの場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

各要素を指定した指数で冪乗した新しい行列を取得する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗後の新しい行列

**Throws**: Fractional power of negative number is not real

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `sqrt`

```ts
sqrt(): BigFloatMatrix | BigFloatMatrix
```

各要素の平方根を計算した新しい行列を取得する

**Returns**: 平方根適用後の新しい行列

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cbrt`

```ts
cbrt(): BigFloatMatrix | BigFloatMatrix
```

各要素の立方根を計算した新しい行列を取得する

**Returns**: 立方根適用後の新しい行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatMatrix | BigFloatMatrix
```

各要素の n 乗根を計算した新しい行列を取得する

**Parameters**
- `n`: 指数

**Returns**: n 乗根適用後の新しい行列

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `floor`

```ts
floor(): BigFloatMatrix | BigFloatMatrix
```

各要素を床関数 (負の無限大方向への丸め) で処理した新しい行列を取得する

**Returns**: 床関数適用後の新しい行列

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `ceil`

```ts
ceil(): BigFloatMatrix | BigFloatMatrix
```

各要素を天井関数 (正の無限大方向への丸め) で処理した新しい行列を取得する

**Returns**: 天井関数適用後の新しい行列

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `round`

```ts
round(): BigFloatMatrix | BigFloatMatrix
```

各要素を四捨五入した新しい行列を取得する

**Returns**: 四捨五入後の新しい行列

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `trunc`

```ts
trunc(): BigFloatMatrix | BigFloatMatrix
```

各要素を 0 方向に切り捨てた新しい行列を取得する

**Returns**: 切り捨て後の新しい行列

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `fround`

```ts
fround(): BigFloatMatrix | BigFloatMatrix
```

各要素を Float32 精度に丸めた新しい行列を取得する

**Returns**: 丸め後の新しい行列

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `clz32`

```ts
clz32(): BigFloatMatrix | BigFloatMatrix
```

各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えた行列を取得する

**Returns**: 結果の行列

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

別の行列または数値との相対差を各要素ごとに計算した行列を取得する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差の行列

**Throws**: 行列形状が一致しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

別の行列または数値との絶対差を各要素ごとに計算した行列を取得する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差の行列

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 行列形状が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

別の行列または数値との百分率差分を各要素ごとに計算した行列を取得する

**Parameters**
- `other`: 比較対象

**Returns**: 百分率差分の行列 (%)

**Throws**: 行列形状が一致しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `sin`

```ts
sin(): BigFloatMatrix | BigFloatMatrix
```

各要素の正弦 (sin) を計算した行列を取得する

**Returns**: sin 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cos`

```ts
cos(): BigFloatMatrix | BigFloatMatrix
```

各要素の余弦 (cos) を計算した行列を取得する

**Returns**: cos 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `tan`

```ts
tan(): BigFloatMatrix | BigFloatMatrix
```

各要素の正接 (tan) を計算した行列を取得する

**Returns**: tan 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 正接が定義されない点の場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asin`

```ts
asin(): BigFloatMatrix | BigFloatMatrix
```

各要素の逆正弦 (asin) を計算した行列を取得する

**Returns**: asin 適用後の行列

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 導関数がゼロになった場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acos`

```ts
acos(): BigFloatMatrix | BigFloatMatrix
```

各要素の逆余弦 (acos) を計算した行列を取得する

**Returns**: acos 適用後の行列

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 導関数がゼロになった場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan`

```ts
atan(): BigFloatMatrix | BigFloatMatrix
```

各要素の逆正接 (atan) を計算した行列を取得する

**Returns**: atan 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

各要素に対して atan2 を計算した行列を取得する

**Parameters**
- `x`: x 座標の行列または数値

**Returns**: atan2 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 行列形状が一致しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 数値的に不安定な点の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sinh`

```ts
sinh(): BigFloatMatrix | BigFloatMatrix
```

各要素の双曲線正弦 (sinh) を計算した行列を取得する

**Returns**: sinh 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cosh`

```ts
cosh(): BigFloatMatrix | BigFloatMatrix
```

各要素の双曲線余弦 (cosh) を計算した行列を取得する

**Returns**: cosh 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `tanh`

```ts
tanh(): BigFloatMatrix | BigFloatMatrix
```

各要素の双曲線正接 (tanh) を計算した行列を取得する

**Returns**: tanh 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asinh`

```ts
asinh(): BigFloatMatrix | BigFloatMatrix
```

各要素の逆双曲線正弦 (asinh) を計算した行列を取得する

**Returns**: asinh 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acosh`

```ts
acosh(): BigFloatMatrix | BigFloatMatrix
```

各要素の逆双曲線余弦 (acosh) を計算した行列を取得する

**Returns**: acosh 適用後の行列

**Throws**: 入力が範囲外([1, ∞))の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atanh`

```ts
atanh(): BigFloatMatrix | BigFloatMatrix
```

各要素の逆双曲線正接 (atanh) を計算した行列を取得する

**Returns**: atanh 適用後の行列

**Throws**: 入力が範囲外([-1, 1])の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp`

```ts
exp(): BigFloatMatrix | BigFloatMatrix
```

各要素の指数関数 (exp) を計算した行列を取得する

**Returns**: exp 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp2`

```ts
exp2(): BigFloatMatrix | BigFloatMatrix
```

各要素の 2 を底とする指数関数 (exp2) を計算した行列を取得する

**Returns**: exp2 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `expm1`

```ts
expm1(): BigFloatMatrix | BigFloatMatrix
```

各要素に対して exp(x) - 1 を計算した行列を取得する

**Returns**: expm1 適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `ln`

```ts
ln(): BigFloatMatrix | BigFloatMatrix
```

各要素の自然対数 (ln) を計算した行列を取得する

**Returns**: ln 適用後の行列

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix | BigFloatMatrix
```

各要素の任意の底による対数を計算した行列を取得する

**Parameters**
- `base`: 底

**Returns**: 対数計算後の行列

**Throws**: 行列形状が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `log2`

```ts
log2(): BigFloatMatrix | BigFloatMatrix
```

各要素の底を 2 とする対数を計算した行列を取得する

**Returns**: log2 適用後の行列

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log10`

```ts
log10(): BigFloatMatrix | BigFloatMatrix
```

各要素の常用対数 (log10) を計算した行列を取得する

**Returns**: log10 適用後の行列

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log1p`

```ts
log1p(): BigFloatMatrix | BigFloatMatrix
```

各要素に対して ln(1 + x) を計算した行列を取得する

**Returns**: log1p 適用後の行列

**Throws**: 特殊値が無効な設定で x が -1 以下の値の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `gamma`

```ts
gamma(): BigFloatMatrix | BigFloatMatrix
```

各要素に対してガンマ関数を計算した行列を取得する

**Returns**: ガンマ関数適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

#### `zeta`

```ts
zeta(): BigFloatMatrix | BigFloatMatrix
```

各要素に対してリーマンゼータ関数を計算した行列を取得する

**Returns**: ゼータ関数適用後の行列

**Throws**: 特殊値が無効な設定で this = 1 の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ除算が発生した場合

**Throws**: キャッシュが存在しない場合

#### `factorial`

```ts
factorial(): BigFloatMatrix | BigFloatMatrix
```

各要素に対して階乗を計算した行列を取得する

**Returns**: 階乗適用後の行列

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

#### `max`

```ts
max(): BigFloat
```

最大値を返す

**Throws**: 行列が空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `min`

```ts
min(): BigFloat
```

最小値を返す

**Throws**: 行列が空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `sum`

```ts
sum(): BigFloat
```

全要素の合計を計算する

**Returns**: 合計

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `product`

```ts
product(): BigFloat
```

全要素の積を計算する

**Returns**: 総乗

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `average`

```ts
average(): BigFloat
```

全要素の平均を計算する

**Returns**: 平均

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `rowSums`

```ts
rowSums(): BigFloatVector
```

行ごとの合計を計算する

**Returns**: 各行の和を持つベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `columnSums`

```ts
columnSums(): BigFloatVector
```

列ごとの合計を計算する

**Returns**: 各列の和を持つベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `trace`

```ts
trace(): BigFloat
```

行列のトレース (対角成分の和) を計算する

**Returns**: トレース

**Throws**: 正方行列でない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `frobeniusNorm`

```ts
frobeniusNorm(): BigFloat
```

フロベニウスノルムを計算する

**Returns**: フロベニウスノルム

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `matmul`

```ts
matmul(other: BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix
```

別の行列との行列積を計算する

**Parameters**
- `other`: 乗じる行列

**Returns**: 行列積の結果

**Throws**: 内積次元が一致しない場合

#### `mulVector`

```ts
mulVector(vector: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

ベクトル積を計算する

**Throws**: 内部次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `determinant`

```ts
determinant(): BigFloat
```

行列式を計算する

**Returns**: 行列式の値

**Throws**: 正方行列でない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `rank`

```ts
rank(): number
```

行列のランク (階数) を計算する

**Returns**: ランク

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `inverse`

```ts
inverse(): BigFloatMatrix
```

逆行列を計算する

**Returns**: 逆行列

**Throws**: 正方行列でない場合、または行列が特異な場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `solveVector`

```ts
solveVector(rhs: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
```

連立方程式 Ax = b を解く

**Parameters**
- `rhs`: 右辺ベクトル b

**Returns**: 解ベクトル x

**Throws**: 行列が正方でない場合、ベクトル長が不一致な場合、または行列が特異な場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `solveMatrix`

```ts
solveMatrix(rhs: BigFloatMatrix | Iterable<BigFloatVectorLike>): BigFloatMatrix
```

連立方程式 AX = B を解く

**Parameters**
- `rhs`: 右辺行列 B

**Returns**: 解行列 X

**Throws**: 行列が正方でない場合、行数が不一致な場合、または行列が特異な場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `matrixPow`

```ts
matrixPow(exponent: number): BigFloatMatrix
```

行列の累乗 A^exponent を計算する

**Parameters**
- `exponent`: 指数 (整数)

**Returns**: 演算結果

**Throws**: 正方行列でない場合、または指数が整数でない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

<a id="bigfloatstream"></a>

## `BigFloatStream`

BigFloat 用の遅延評価ストリーム (Lazy List) クラス

```ts
class BigFloatStream
```

### Constructor

#### `constructor`

```ts
constructor(source: Iterable<BigFloatLike> | (): Iterator<BigFloatLike, void, undefined>): BigFloatStream
```

BigFloat 用の遅延評価ストリーム (Lazy List) クラス

**Parameters**
- `source`: 要素の反復可能オブジェクト、またはイテレータを生成する関数

### Static Methods

#### `empty`

```ts
empty(): BigFloatStream
```

空のストリームを生成する

**Returns**: 空の BigFloatStream

#### `from`

```ts
from(iterable: Iterable<BigFloatInputValue>, precision?: number | bigint): BigFloatStream
```

反復可能オブジェクトからストリームを作成する

**Parameters**
- `iterable`: 要素のソース
- `precision`: 変換時の精度

**Returns**: BigFloatStream インスタンス

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `of`

```ts
of(...values: string | number | bigint | BigFloat | BigFloatComplex[]): BigFloatStream
```

引数のリストからストリームを作成する

**Parameters**
- `values`: 要素のリスト

**Returns**: BigFloatStream インスタンス

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `arithmetic`

```ts
arithmetic(start: string | number | bigint | BigFloat | BigFloatComplex, step: string | number | bigint | BigFloat | BigFloatComplex, count: number, precision?: number | bigint): BigFloatStream
```

等差数列のストリームを生成する

**Parameters**
- `start`: 初項
- `step`: 公差
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: 有限の数値でない場合、または負の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `geometric`

```ts
geometric(start: string | number | bigint | BigFloat | BigFloatComplex, ratio: string | number | bigint | BigFloat | BigFloatComplex, count: number, precision?: number | bigint): BigFloatStream
```

等比数列のストリームを生成する

**Parameters**
- `start`: 初項
- `ratio`: 公比
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `linspace`

```ts
linspace(start: string | number | bigint | BigFloat | BigFloatComplex, end: string | number | bigint | BigFloat | BigFloatComplex, count: number, precision?: number | bigint): BigFloatStream
```

指定した範囲を等分割する数値ストリームを生成する

**Parameters**
- `start`: 開始値
- `end`: 終了値
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: 有限の数値でない場合、または負の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `logspace`

```ts
logspace(start: string | number | bigint | BigFloat | BigFloatComplex, end: string | number | bigint | BigFloat | BigFloatComplex, count: number, precision?: number | bigint): BigFloatStream
```

10 を底とする対数スケールで等間隔な数値ストリームを生成する

**Parameters**
- `start`: 開始指数
- `end`: 終了指数
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `harmonic`

```ts
harmonic(count: number, precision?: number | bigint): BigFloatStream
```

調和級数 (1/1, 1/2, 1/3, ...) のストリームを生成する

**Parameters**
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: 有限の数値でない場合、または負の場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `random`

```ts
random(count: number, options?: { min?: string | number | bigint | BigFloat | BigFloatComplex; max?: string | number | bigint | BigFloat | BigFloatComplex; precision?: number | bigint }): BigFloatStream
```

乱数ストリームを生成する

**Parameters**
- `count`: 要素数
- `options`: 乱数範囲と精度のオプション

**Returns**: BigFloatStream インスタンス

**Throws**: 最大値が最小値より小さい場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `repeat`

```ts
repeat(value: string | number | bigint | BigFloat | BigFloatComplex, count: number, precision?: number | bigint): BigFloatStream
```

指定された値を繰り返すストリームを生成する

**Parameters**
- `value`: 繰り返す値
- `count`: 回数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: 有限の数値でない場合、または負の場合

#### `fibonacci`

```ts
fibonacci(count: number, precision?: number | bigint): BigFloatStream
```

フィボナッチ数列のストリームを生成する

**Parameters**
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 有限の数値でない場合、または負の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `factorial`

```ts
factorial(count: number, precision?: number | bigint): BigFloatStream
```

階乗数列 (1!, 2!, 3!, ...) のストリームを生成する

**Parameters**
- `count`: 要素数
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: 有限の数値でない場合、または負の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `range`

```ts
range(start: string | number | bigint | BigFloat | BigFloatComplex, end?: string | number | bigint | BigFloat | BigFloatComplex, step?: string | number | bigint | BigFloat | BigFloatComplex, precision?: number | bigint): BigFloatStream
```

数値の範囲を指定してストリームを生成する

**Parameters**
- `start`: 開始値 (end 省略時は 0 からこの値まで)
- `end`: 終了値 (この値は含まない)
- `step`: 増分
- `precision`: 精度

**Returns**: BigFloatStream インスタンス

**Throws**: step が 0 の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

### Instance Methods

#### `clone`

```ts
clone(): BigFloatStream
```

ストリームを複製する

**Returns**: 複製された BigFloatStream

#### `map`

```ts
map(fn: (item: BigFloat | BigFloatComplex): BigFloat | BigFloatComplex): BigFloatStream
```

各要素を変換関数で写像する

**Parameters**
- `fn`: 変換関数

**Returns**: 写像後のストリーム

**Throws**: exp2 is not supported for complex numbers

#### `filter`

```ts
filter(fn: (item: BigFloat | BigFloatComplex): boolean): BigFloatStream
```

条件を満たす要素のみを通過させる

**Parameters**
- `fn`: フィルタリング関数

**Returns**: フィルタリング後のストリーム

#### `flatMap`

```ts
flatMap(fn: (item: BigFloat | BigFloatComplex): Iterable<BigFloatInputValue>): BigFloatStream
```

各要素を複数の要素に展開して平坦化する

**Parameters**
- `fn`: 要素を反復可能オブジェクトへ変換する関数

**Returns**: 平坦化後のストリーム

#### `distinct`

```ts
distinct(keyFn?: (item: BigFloat | BigFloatComplex): unknown): BigFloatStream
```

要素の重複を除去する

**Parameters**
- `keyFn`: 一致判定に使うキーを生成する関数 (デフォルトは toString)

**Returns**: 重複除去後のストリーム

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sorted`

```ts
sorted(compareFn?: (a: BigFloat | BigFloatComplex, b: BigFloat | BigFloatComplex): number): BigFloatStream
```

要素をソートする (注意: この操作は全要素をメモリ上に展開します)

**Parameters**
- `compareFn`: 比較関数

**Returns**: ソート後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `peek`

```ts
peek(fn: (item: BigFloat | BigFloatComplex): void): BigFloatStream
```

各要素に対して副作用のある処理を実行する (デバッグやロギング用)

**Parameters**
- `fn`: 要素を受け取る関数

**Returns**: 自身

#### `tap`

```ts
tap(fn: (item: BigFloat | BigFloatComplex): void): BigFloatStream
```

peek の別名。各要素に対して副作用のある処理を実行する

**Parameters**
- `fn`: 要素を受け取る関数

**Returns**: 自身

#### `limit`

```ts
limit(n: number): BigFloatStream
```

要素数を最大 n 個に制限する

**Parameters**
- `n`: 最大要素数

**Returns**: 制限されたストリーム

#### `take`

```ts
take(n: number): BigFloatStream
```

limit の別名。要素数を最大 n 個に制限する

**Parameters**
- `n`: 最大要素数

**Returns**: 制限されたストリーム

#### `skip`

```ts
skip(n: number): BigFloatStream
```

先頭の n 個の要素を読み飛ばす

**Parameters**
- `n`: スキップする数

**Returns**: スキップ後のストリーム

#### `drop`

```ts
drop(n: number): BigFloatStream
```

skip の別名。先頭の n 個の要素を読み飛ばす

**Parameters**
- `n`: スキップする数

**Returns**: スキップ後のストリーム

#### `concat`

```ts
concat(...iterables: Iterable<BigFloatInputValue>[]): BigFloatStream
```

末尾に別の反復可能オブジェクトの内容を連結する

**Parameters**
- `iterables`: 連結する対象

**Returns**: 連結後のストリーム

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloatLike, void, undefined>
```

ストリームを反復するためのイテレータを取得する

**Returns**: 要素のイテレータ

#### `forEach`

```ts
forEach(fn: (item: BigFloat | BigFloatComplex): void): void
```

ストリームの各要素に対して関数を実行する (終端操作)

**Parameters**
- `fn`: 実行する関数

#### `toArray`

```ts
toArray(): BigFloat | BigFloatComplex[]
```

ストリームの全要素を収集して配列として返す (終端操作)

**Returns**: 要素の配列

#### `collect`

```ts
collect(): BigFloat | BigFloatComplex[]
```

toArray の別名。ストリームの全要素を収集して配列として返す (終端操作)

**Returns**: 要素の配列

#### `reduce`

```ts
reduce<U>(fn: (acc: U, item: BigFloat | BigFloatComplex): U, initial: U): U
```

全要素を累積して単一の値を計算する (終端操作)

**Parameters**
- `fn`: 累積関数
- `initial`: 初期値

**Returns**: 累積結果

#### `count`

```ts
count(): number
```

ストリームに含まれる要素数を数える (終端操作)

**Returns**: 要素数

#### `isEmpty`

```ts
isEmpty(): boolean
```

ストリームに要素が含まれていないかどうかを判定する (終端操作)

**Returns**: 空なら true

#### `some`

```ts
some(fn: (item: BigFloat | BigFloatComplex): boolean): boolean
```

条件を満たす要素が少なくとも一つ存在するかどうかを判定する (終端操作)

**Parameters**
- `fn`: 判定関数

**Returns**: 条件を満たす要素があれば true

#### `every`

```ts
every(fn: (item: BigFloat | BigFloatComplex): boolean): boolean
```

すべての要素が条件を満たすかどうかを判定する (終端操作)

**Parameters**
- `fn`: 判定関数

**Returns**: すべての要素が条件を満たせば true

#### `find`

```ts
find(fn: (item: BigFloat | BigFloatComplex): boolean): undefined | BigFloat | BigFloatComplex
```

条件を満たす最初の要素を返す (終端操作)

**Parameters**
- `fn`: 判定関数

**Returns**: 最初に見つかった要素、見つからない場合は undefined

#### `findFirst`

```ts
findFirst(): undefined | BigFloat | BigFloatComplex
```

ストリームの最初の要素を取得する (終端操作)

**Returns**: 最初の要素、ストリームが空なら undefined

#### `first`

```ts
first(): undefined | BigFloat | BigFloatComplex
```

findFirst の別名。ストリームの最初の要素を取得する

**Returns**: 最初の要素

#### `at`

```ts
at(index: number): undefined | BigFloat | BigFloatComplex
```

指定されたインデックスの要素を取得する (終端操作)

**Parameters**
- `index`: 0 から始まるインデックス

**Returns**: 指定位置の要素、インデックスが範囲外なら undefined

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatStream
```

すべての要素の精度を変更する

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度が変更された新しいストリーム

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素と別の値との相対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差を各要素に持つストリーム

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素と別の値との絶対差を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差を各要素に持つストリーム

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素と別の値との百分率差分を計算する

**Parameters**
- `other`: 比較対象

**Returns**: 百分率差分を各要素に持つストリーム (%)

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素に別の値を加算する

**Parameters**
- `other`: 加算する数値

**Returns**: 加算後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素から別の値を減算する

**Parameters**
- `other`: 減算する数値

**Returns**: 減算後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mul`

```ts
mul(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素に別の値を乗算する

**Parameters**
- `other`: 乗算する数値

**Returns**: 乗算後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `div`

```ts
div(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素を別の値で除算する

**Parameters**
- `other`: 除数

**Returns**: 除算後のストリーム

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatComplex): BigFloatStream
```

各要素に対して剰余演算を行う

**Parameters**
- `other`: 法

**Returns**: 剰余後のストリーム

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `neg`

```ts
neg(): BigFloatStream
```

各要素の符号を反転させる

**Returns**: 符号反転後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `abs`

```ts
abs(): BigFloatStream
```

各要素を絶対値にする

**Returns**: 絶対値適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `sign`

```ts
sign(): BigFloatStream
```

各要素の符号 (1, 0, -1) を取得する

**Returns**: 符号値を持つストリーム

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `reciprocal`

```ts
reciprocal(): BigFloatStream
```

各要素の逆数を取得する

**Returns**: 逆数を持つストリーム

**Throws**: ゼロの場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat): BigFloatStream
```

各要素を指定した指数で冪乗する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗後のストリーム

**Throws**: Fractional power of negative number is not real

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `sqrt`

```ts
sqrt(): BigFloatStream
```

各要素の平方根を計算する

**Returns**: 平方根適用後のストリーム

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cbrt`

```ts
cbrt(): BigFloatStream
```

各要素の立方根を計算する

**Returns**: 立方根適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatStream
```

各要素の n 乗根を計算する

**Parameters**
- `n`: 指数

**Returns**: n 乗根適用後のストリーム

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `floor`

```ts
floor(): BigFloatStream
```

各要素を床関数 (負の無限大方向への丸め) で処理する

**Returns**: 床関数適用後のストリーム

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `ceil`

```ts
ceil(): BigFloatStream
```

各要素を天井関数 (正の無限大方向への丸め) で処理する

**Returns**: 天井関数適用後のストリーム

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `round`

```ts
round(): BigFloatStream
```

各要素を四捨五入する

**Returns**: 四捨五入後のストリーム

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `trunc`

```ts
trunc(): BigFloatStream
```

各要素を 0 方向に切り捨てる

**Returns**: 切り捨て後のストリーム

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `fround`

```ts
fround(): BigFloatStream
```

各要素を Float32 精度に丸める

**Returns**: 丸め後のストリーム

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `clz32`

```ts
clz32(): BigFloatStream
```

各要素を 32 ビット整数として見た時の先頭のゼロビット数を数える

**Returns**: 結果のストリーム

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sin`

```ts
sin(): BigFloatStream
```

各要素の正弦 (sin) を計算する

**Returns**: sin 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cos`

```ts
cos(): BigFloatStream
```

各要素の余弦 (cos) を計算する

**Returns**: cos 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `tan`

```ts
tan(): BigFloatStream
```

各要素の正接 (tan) を計算する

**Returns**: tan 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 正接が定義されない点の場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asin`

```ts
asin(): BigFloatStream
```

各要素の逆正弦 (asin) を計算する

**Returns**: asin 適用後のストリーム

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 導関数がゼロになった場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acos`

```ts
acos(): BigFloatStream
```

各要素の逆余弦 (acos) を計算する

**Returns**: acos 適用後のストリーム

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 導関数がゼロになった場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan`

```ts
atan(): BigFloatStream
```

各要素の逆正接 (atan) を計算する

**Returns**: atan 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat): BigFloatStream
```

各要素に対して atan2 を計算する

**Parameters**
- `x`: x 座標

**Returns**: atan2 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sinh`

```ts
sinh(): BigFloatStream
```

各要素の双曲線正弦 (sinh) を計算する

**Returns**: sinh 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cosh`

```ts
cosh(): BigFloatStream
```

各要素の双曲線余弦 (cosh) を計算する

**Returns**: cosh 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `tanh`

```ts
tanh(): BigFloatStream
```

各要素の双曲線正接 (tanh) を計算する

**Returns**: tanh 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asinh`

```ts
asinh(): BigFloatStream
```

各要素の逆双曲線正弦 (asinh) を計算する

**Returns**: asinh 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acosh`

```ts
acosh(): BigFloatStream
```

各要素の逆双曲線余弦 (acosh) を計算する

**Returns**: acosh 適用後のストリーム

**Throws**: 入力が範囲外([1, ∞))の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atanh`

```ts
atanh(): BigFloatStream
```

各要素の逆双曲線正接 (atanh) を計算する

**Returns**: atanh 適用後のストリーム

**Throws**: 入力が範囲外([-1, 1])の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp`

```ts
exp(): BigFloatStream
```

各要素の指数関数 (exp) を計算する

**Returns**: exp 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp2`

```ts
exp2(): BigFloatStream
```

各要素の 2 を底とする指数関数 (exp2) を計算する

**Returns**: exp2 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `expm1`

```ts
expm1(): BigFloatStream
```

各要素に対して exp(x) - 1 を計算する

**Returns**: expm1 適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `ln`

```ts
ln(): BigFloatStream
```

各要素の自然対数 (ln) を計算する

**Returns**: ln 適用後のストリーム

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `log`

```ts
log(base: string | number | bigint | BigFloat): BigFloatStream
```

各要素の任意の底による対数を計算する

**Parameters**
- `base`: 底

**Returns**: 対数計算後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 底が1または0の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `log2`

```ts
log2(): BigFloatStream
```

各要素の底を 2 とする対数を計算する

**Returns**: log2 適用後のストリーム

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log10`

```ts
log10(): BigFloatStream
```

各要素の常用対数 (log10) を計算する

**Returns**: log10 適用後のストリーム

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log1p`

```ts
log1p(): BigFloatStream
```

各要素に対して ln(1 + x) を計算する

**Returns**: log1p 適用後のストリーム

**Throws**: 特殊値が無効な設定で x が -1 以下の値の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `gamma`

```ts
gamma(): BigFloatStream
```

各要素に対してガンマ関数を計算する

**Returns**: ガンマ関数適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

#### `zeta`

```ts
zeta(): BigFloatStream
```

各要素に対してリーマンゼータ関数を計算する

**Returns**: ゼータ関数適用後のストリーム

**Throws**: 特殊値が無効な設定で this = 1 の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ除算が発生した場合

**Throws**: キャッシュが存在しない場合

#### `factorial`

```ts
factorial(): BigFloatStream
```

各要素に対して階乗を計算する

**Returns**: 階乗適用後のストリーム

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

#### `max`

```ts
max(): BigFloat | BigFloatComplex
```

ストリームの要素の中から最大値を返す (終端操作)

**Returns**: 最大値

**Throws**: ストリームが空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `min`

```ts
min(): BigFloat | BigFloatComplex
```

ストリームの要素の中から最小値を返す (終端操作)

**Returns**: 最小値

**Throws**: ストリームが空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `sum`

```ts
sum(): BigFloat | BigFloatComplex
```

ストリームの全要素の合計を計算する (終端操作)

**Returns**: 合計

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `product`

```ts
product(): BigFloat | BigFloatComplex
```

ストリームの全要素の積を計算する (終端操作)

**Returns**: 総乗

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `average`

```ts
average(): BigFloat | BigFloatComplex
```

ストリームの全要素の平均値を計算する (終端操作)

**Returns**: 平均値

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `median`

```ts
median(): BigFloat | BigFloatComplex
```

ストリームの要素の中央値を計算する (終端操作)

**Returns**: 中央値

**Throws**: 引数が空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `variance`

```ts
variance(): BigFloat | BigFloatComplex
```

ストリームの要素の分散を計算する (終端操作)

**Returns**: 分散

**Throws**: 引数が空の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `stddev`

```ts
stddev(): BigFloat | BigFloatComplex
```

ストリームの要素の標準偏差を計算する (終端操作)

**Returns**: 標準偏差

**Throws**: 引数が空の場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

<a id="bigfloatvector"></a>

## `BigFloatVector`

BigFloat を固定長ベクトルとして扱うクラス

```ts
class BigFloatVector
```

### Constructor

#### `constructor`

```ts
constructor(values?: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>, precision?: number | bigint): BigFloatVector
```

BigFloat を固定長ベクトルとして扱うクラス

**Parameters**
- `values`: 要素のソース (反復可能オブジェクト)
- `precision`: 変換時の精度

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

### Static Methods

#### `empty`

```ts
empty(): BigFloatVector
```

空のベクトル (次元 0) を生成する

**Returns**: 空のベクトル

#### `from`

```ts
from(values: BigFloatVector | Iterable<BigFloatValue>, precision?: number | bigint): BigFloatVector
from(values: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>, precision?: number | bigint): BigFloatVector | BigFloatComplexVector
```

要素の反復可能オブジェクトから BigFloatVector を生成する

**Parameters**
- `values`: 要素列
- `precision`: 精度

**Returns**: BigFloatVector インスタンス

**Throws**: 例外が発生した場合

#### `fromStream`

```ts
fromStream(stream: BigFloatStream): BigFloatVector | BigFloatComplexVector
```

BigFloatStream からベクトルを生成する

**Parameters**
- `stream`: ソースストリーム

**Returns**: 生成された BigFloatVector

#### `of`

```ts
of(...values: string | number | bigint | BigFloat[]): BigFloatVector
```

引数リストからベクトルを生成する

**Parameters**
- `values`: 要素のリスト

**Returns**: BigFloatVector インスタンス

#### `fill`

```ts
fill(length: number, value: string | number | bigint | BigFloat, precision?: number | bigint): BigFloatVector
```

指定された値で埋められたベクトルを生成する

**Parameters**
- `length`: ベクトルの長さ
- `value`: 埋める値
- `precision`: 精度

**Returns**: BigFloatVector インスタンス

**Throws**: ベクトル長が有限でない場合、または負の場合

#### `zeros`

```ts
zeros(length: number, precision?: number | bigint): BigFloatVector
```

零ベクトルを生成する

**Parameters**
- `length`: ベクトルの長さ
- `precision`: 精度

**Returns**: BigFloatVector インスタンス

**Throws**: ベクトル長が有限でない場合、または負の場合

#### `ones`

```ts
ones(length: number, precision?: number | bigint): BigFloatVector
```

すべての要素が 1 のベクトルを生成する

**Parameters**
- `length`: ベクトルの長さ
- `precision`: 精度

**Returns**: BigFloatVector インスタンス

**Throws**: ベクトル長が有限でない場合、または負の場合

#### `basis`

```ts
basis(length: number, index: number, precision?: number | bigint): BigFloatVector
```

標準基底ベクトルを取得する (指定インデックスのみ 1 で他は 0)

**Parameters**
- `length`: ベクトルの長さ
- `index`: 1 を配置する位置 (0 から length-1)
- `precision`: 精度

**Returns**: 生成されたベクトル

**Throws**: インデックスが範囲外の場合

#### `linspace`

```ts
linspace(start: string | number | bigint | BigFloat, end: string | number | bigint | BigFloat, count: number, precision?: number | bigint): BigFloatVector
```

指定した範囲を等分割する数値ベクトルを生成する

**Parameters**
- `start`: 開始値
- `end`: 終了値
- `count`: 要素数
- `precision`: 精度

**Returns**: 生成された BigFloatVector

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `random`

```ts
random(length: number, options?: { min?: string | number | bigint | BigFloat; max?: string | number | bigint | BigFloat; precision?: number | bigint }): BigFloatVector
```

乱数ベクトルを生成する

**Parameters**
- `length`: ベクトルの長さ
- `options`: 乱数範囲と精度のオプション

**Returns**: 生成された BigFloatVector

**Throws**: 最大値が最小値より小さい場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

### Instance Properties

#### `length`

```ts
length: number
```

ベクトルの要素数を取得する

### Instance Methods

#### `dimension`

```ts
dimension(): number
```

ベクトルの次元数を取得する

**Returns**: 次元数 (length と同じ)

#### `isEmpty`

```ts
isEmpty(): boolean
```

ベクトルが空 (次元が 0) かどうかを判定する

**Returns**: 空なら true

#### `at`

```ts
at(index: number): undefined | BigFloat
```

指定したインデックスの要素を取得する (複製)

**Parameters**
- `index`: インデックス

**Returns**: 要素の値、インデックスが範囲外の場合は undefined

#### `clone`

```ts
clone(): BigFloatVector
```

ベクトルを複製する

**Returns**: 複製された BigFloatVector

#### `toArray`

```ts
toArray(): BigFloat[]
```

要素の配列へ変換する

**Returns**: BigFloat の配列

#### `toStream`

```ts
toStream(): BigFloatStream
```

要素を流すストリームへ変換する

**Returns**: BigFloatStream インスタンス

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `[Symbol.iterator]`

```ts
[Symbol.iterator](): Iterator<BigFloat, void, undefined>
```

要素を順に反復するイテレータを取得する

**Returns**: BigFloat のイテレータ

#### `forEach`

```ts
forEach(fn: (value: BigFloat, index: number): void): void
```

各要素に対して関数を実行する

**Parameters**
- `fn`: 実行する関数

#### `map`

```ts
map(fn: (value: BigFloat, index: number): string | number | bigint | BigFloat): BigFloatVector
```

各要素を変換した新しいベクトルを取得する

**Parameters**
- `fn`: 変換関数

**Returns**: 変換後の新しいベクトル

#### `zipMap`

```ts
zipMap(other: BigFloatVector | Iterable<BigFloatValue>, fn: (left: BigFloat | BigFloatComplex, right: BigFloat | BigFloatComplex, index: number): string | number | bigint | BigFloat): BigFloatVector
zipMap(other: BigFloatComplexVector | Iterable<BigFloatComplex>, fn: (left: BigFloat | BigFloatComplex, right: BigFloat | BigFloatComplex, index: number): string | number | bigint | BigFloat | BigFloatComplex): BigFloatComplexVector
```

別のベクトルと要素ごとに対になる変換を行い、新しいベクトルを取得する

**Parameters**
- `other`: 対象ベクトル
- `fn`: 変換関数

**Returns**: 変換後の新しいベクトル

**Throws**: ベクトルの次元が一致しない場合

#### `reduce`

```ts
reduce<U>(fn: (acc: U, value: BigFloat, index: number): U, initial: U): U
```

全要素を累積して単一の値を計算する

**Parameters**
- `fn`: 累積関数
- `initial`: 初期値

**Returns**: 累積された結果

#### `some`

```ts
some(fn: (value: BigFloat, index: number): boolean): boolean
```

条件を満たす要素が少なくとも一つ存在するかどうかを判定する

**Parameters**
- `fn`: 判定関数

**Returns**: 条件を満たす要素があれば true

#### `every`

```ts
every(fn: (value: BigFloat, index: number): boolean): boolean
```

すべての要素が条件を満たすかどうかを判定する

**Parameters**
- `fn`: 判定関数

**Returns**: すべての要素が条件を満たせば true

#### `concat`

```ts
concat(...others: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>[]): BigFloatVector | BigFloatComplexVector
```

別のベクトルまたは要素列を末尾に連結した新しいベクトルを取得する

**Parameters**
- `others`: 連結する対象

**Returns**: 連結後の新しいベクトル

#### `slice`

```ts
slice(start?: number, end?: number): BigFloatVector
```

ベクトルの一部を抽出した新しいベクトルを返す

**Parameters**
- `start`: 開始位置
- `end`: 終了位置

**Returns**: 抽出された新しいベクトル

#### `reverse`

```ts
reverse(): BigFloatVector
```

要素の並びを反転させた新しいベクトルを取得する

**Returns**: 反転した新しいベクトル

#### `changePrecision`

```ts
changePrecision(precision: number | bigint): BigFloatVector
```

すべての要素の精度を変更した新しいベクトルを取得する

**Parameters**
- `precision`: 新しい精度

**Returns**: 精度が変更された新しいベクトル

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `equals`

```ts
equals(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): boolean
```

別のベクトルと内容が等しいかどうかを判定する

**Parameters**
- `other`: 比較対象

**Returns**: 等しい場合は true

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `add`

```ts
add(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
add(other: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
add(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatVector | BigFloatVector | BigFloatComplexVector
```

各要素に別のベクトルまたはスカラ値を加算した新しいベクトルを取得する

**Parameters**
- `other`: 加算するベクトルまたは数値

**Returns**: 加算後の新しいベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sub`

```ts
sub(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
sub(other: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
sub(other: string | number | bigint | BigFloat | BigFloatComplex | BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatVector | BigFloatVector | BigFloatComplexVector
```

各要素から別のベクトルまたはスカラ値を減算した新しいベクトルを取得する

**Parameters**
- `other`: 減算するベクトルまたは数値

**Returns**: 減算後の新しいベクトル

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mul`

```ts
mul(scalar: string | number | bigint | BigFloat): BigFloatVector
mul(scalar: BigFloatComplex): BigFloatComplexVector
mul(scalar: string | number | bigint | BigFloat | BigFloatComplex): BigFloatVector | BigFloatVector | BigFloatComplexVector
```

各要素にスカラ値を乗算した新しいベクトルを取得する

**Parameters**
- `scalar`: 乗算する数値

**Returns**: 乗算後の新しいベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `div`

```ts
div(scalar: string | number | bigint | BigFloat): BigFloatVector
div(scalar: BigFloatComplex): BigFloatComplexVector
div(scalar: string | number | bigint | BigFloat | BigFloatComplex): BigFloatVector | BigFloatVector | BigFloatComplexVector
```

各要素をスカラ値で除算した新しいベクトルを取得する

**Parameters**
- `scalar`: 除数

**Returns**: 除算後の新しいベクトル

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `mod`

```ts
mod(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector | BigFloatVector | BigFloatComplexVector
```

各要素に対して剰余演算を行った新しいベクトルを取得する

**Parameters**
- `other`: 法

**Returns**: 演算後の新しいベクトル

**Throws**: BigFloat.mod does not support BigFloatComplex operands

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 精度の不一致が許容されていない場合

#### `hadamard`

```ts
hadamard(other: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
hadamard(other: BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

別のベクトルとのアダマール積 (要素ごとの積) を計算する

**Parameters**
- `other`: 対象ベクトル

**Returns**: Hadamard積の結果のベクトル

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `neg`

```ts
neg(): BigFloatVector
```

各要素の符号を反転させた新しいベクトルを取得する

**Returns**: 符号反転後の新しいベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `abs`

```ts
abs(): BigFloatVector
```

各要素を絶対値にした新しいベクトルを取得する

**Returns**: 絶対値適用後の新しいベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `sign`

```ts
sign(): BigFloatVector
```

各要素の符号 (1, 0, -1) を持つベクトルを取得する

**Returns**: 符号ベクトル

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `reciprocal`

```ts
reciprocal(): BigFloatVector
```

各要素の逆数を持つベクトルを取得する

**Returns**: 逆数ベクトル

**Throws**: ゼロの場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `pow`

```ts
pow(exponent: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
pow(exponent: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

各要素を指定した指数で冪乗した新しいベクトルを取得する

**Parameters**
- `exponent`: 指数

**Returns**: 冪乗後の新しいベクトル

**Throws**: Fractional power of negative number is not real

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

**Throws**: 数値的に不安定な点の場合

#### `sqrt`

```ts
sqrt(): BigFloatVector
```

各要素の平方根を計算した新しいベクトルを取得する

**Returns**: 平方根適用後の新しいベクトル

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cbrt`

```ts
cbrt(): BigFloatVector
```

各要素の立方根を計算した新しいベクトルを取得する

**Returns**: 立方根適用後の新しいベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

#### `nthRoot`

```ts
nthRoot(n: number | bigint): BigFloatVector
```

各要素の n 乗根を計算した新しいベクトルを取得する

**Parameters**
- `n`: 指数

**Returns**: n 乗根適用後の新しいベクトル

**Throws**: nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `floor`

```ts
floor(): BigFloatVector
```

各要素を床関数 (負の無限大方向への丸め) で処理した新しいベクトルを取得する

**Returns**: 床関数適用後の新しいベクトル

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `ceil`

```ts
ceil(): BigFloatVector
```

各要素を天井関数 (正の無限大方向への丸め) で処理した新しいベクトルを取得する

**Returns**: 天井関数適用後の新しいベクトル

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `round`

```ts
round(): BigFloatVector
```

各要素を四捨五入した新しいベクトルを取得する

**Returns**: 四捨五入後の新しいベクトル

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `trunc`

```ts
trunc(): BigFloatVector
```

各要素を 0 方向に切り捨てた新しいベクトルを取得する

**Returns**: 切り捨て後の新しいベクトル

**Throws**: 特殊値が無効で対象に特殊値が含まれる場合

#### `fround`

```ts
fround(): BigFloatVector
```

各要素を Float32 精度に丸めた新しいベクトルを取得する

**Returns**: 丸め後の新しいベクトル

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `clz32`

```ts
clz32(): BigFloatVector
```

各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えたベクトルを取得する

**Returns**: 結果のベクトル

**Throws**: 特殊値が無効な場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `relativeDiff`

```ts
relativeDiff(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
relativeDiff(other: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

別のベクトルまたは数値との相対差を各要素ごとに計算したベクトルを取得する

**Parameters**
- `other`: 比較対象

**Returns**: 相対差のベクトル

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `absoluteDiff`

```ts
absoluteDiff(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
absoluteDiff(other: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

別のベクトルまたは数値との絶対差を各要素ごとに計算したベクトルを取得する

**Parameters**
- `other`: 比較対象

**Returns**: 絶対差のベクトル

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `percentDiff`

```ts
percentDiff(other: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
percentDiff(other: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

別のベクトルまたは数値との百分率差分を各要素ごとに計算したベクトルを取得する

**Parameters**
- `other`: 比較対象

**Returns**: 百分率差分のベクトル (%)

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `sin`

```ts
sin(): BigFloatVector
```

各要素の正弦 (sin) を計算したベクトルを取得する

**Returns**: sin 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cos`

```ts
cos(): BigFloatVector
```

各要素の余弦 (cos) を計算したベクトルを取得する

**Returns**: cos 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `tan`

```ts
tan(): BigFloatVector
```

各要素の正接 (tan) を計算したベクトルを取得する

**Returns**: tan 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 正接が定義されない点の場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asin`

```ts
asin(): BigFloatVector
```

各要素の逆正弦 (asin) を計算したベクトルを取得する

**Returns**: asin 適用後のベクトル

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 導関数がゼロになった場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acos`

```ts
acos(): BigFloatVector
```

各要素の逆余弦 (acos) を計算したベクトルを取得する

**Returns**: acos 適用後のベクトル

**Throws**: 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 導関数がゼロになった場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan`

```ts
atan(): BigFloatVector
```

各要素の逆正接 (atan) を計算したベクトルを取得する

**Returns**: atan 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atan2`

```ts
atan2(x: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
atan2(x: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

各要素に対して atan2 を計算したベクトルを取得する

**Parameters**
- `x`: x 座標のベクトルまたは数値

**Returns**: atan2 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 数値的に不安定な点の場合

**Throws**: キャッシュが存在しない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `sinh`

```ts
sinh(): BigFloatVector
```

各要素の双曲線正弦 (sinh) を計算したベクトルを取得する

**Returns**: sinh 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cosh`

```ts
cosh(): BigFloatVector
```

各要素の双曲線余弦 (cosh) を計算したベクトルを取得する

**Returns**: cosh 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: Division by zero

**Throws**: 文字列が複素数表現として無効な場合

#### `tanh`

```ts
tanh(): BigFloatVector
```

各要素の双曲線正接 (tanh) を計算したベクトルを取得する

**Returns**: tanh 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 文字列が複素数表現として無効な場合

#### `asinh`

```ts
asinh(): BigFloatVector
```

各要素の逆双曲線正弦 (asinh) を計算したベクトルを取得する

**Returns**: asinh 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `acosh`

```ts
acosh(): BigFloatVector
```

各要素の逆双曲線余弦 (acosh) を計算したベクトルを取得する

**Returns**: acosh 適用後のベクトル

**Throws**: 入力が範囲外([1, ∞))の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `atanh`

```ts
atanh(): BigFloatVector
```

各要素の逆双曲線正接 (atanh) を計算したベクトルを取得する

**Returns**: atanh 適用後のベクトル

**Throws**: 入力が範囲外([-1, 1])の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: Division by zero

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp`

```ts
exp(): BigFloatVector
```

各要素の指数関数 (exp) を計算したベクトルを取得する

**Returns**: exp 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 基数が2から36の範囲外の場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `exp2`

```ts
exp2(): BigFloatVector
```

各要素の 2 を底とする指数関数 (exp2) を計算したベクトルを取得する

**Returns**: exp2 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `expm1`

```ts
expm1(): BigFloatVector
```

各要素に対して exp(x) - 1 を計算したベクトルを取得する

**Returns**: expm1 適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

#### `ln`

```ts
ln(): BigFloatVector
```

各要素の自然対数 (ln) を計算したベクトルを取得する

**Returns**: ln 適用後のベクトル

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `log`

```ts
log(base: string | number | bigint | BigFloat | BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
log(base: BigFloatComplex | BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

各要素の任意の底による対数を計算したベクトルを取得する

**Parameters**
- `base`: 底

**Returns**: 対数計算後のベクトル

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `log2`

```ts
log2(): BigFloatVector
```

各要素の底を 2 とする対数を計算したベクトルを取得する

**Returns**: log2 適用後のベクトル

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log10`

```ts
log10(): BigFloatVector
```

各要素の常用対数 (log10) を計算したベクトルを取得する

**Returns**: log10 適用後のベクトル

**Throws**: 特殊値が無効な設定で値が 0 以下の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: キャッシュが存在しない場合

#### `log1p`

```ts
log1p(): BigFloatVector
```

各要素に対して ln(1 + x) を計算したベクトルを取得する

**Returns**: log1p 適用後のベクトル

**Throws**: 特殊値が無効な設定で x が -1 以下の値の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: キャッシュが存在しない場合

#### `gamma`

```ts
gamma(): BigFloatVector
```

各要素に対してガンマ関数を計算したベクトルを取得する

**Returns**: ガンマ関数適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

#### `zeta`

```ts
zeta(): BigFloatVector
```

各要素に対してリーマンゼータ関数を計算したベクトルを取得する

**Returns**: ゼータ関数適用後のベクトル

**Throws**: 特殊値が無効な設定で this = 1 の場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ除算が発生した場合

**Throws**: キャッシュが存在しない場合

#### `factorial`

```ts
factorial(): BigFloatVector
```

各要素に対して階乗を計算したベクトルを取得する

**Returns**: 階乗適用後のベクトル

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 負の整数の場合

**Throws**: キャッシュが存在しない場合

**Throws**: division by zero

#### `max`

```ts
max(): BigFloat
```

最大値を返す

**Returns**: 最大値

**Throws**: ベクトルが空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `min`

```ts
min(): BigFloat
```

最小値を返す

**Returns**: 最小値

**Throws**: ベクトルが空の場合

**Throws**: 特殊値が無効な設定で特殊値を比較しようとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

#### `sum`

```ts
sum(): BigFloat
```

全要素の合計を計算する

**Returns**: 合計

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `product`

```ts
product(): BigFloat
```

全要素の積を計算する

**Returns**: 総乗

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 精度が 0 未満または MAX_PRECISION を超える場合

**Throws**: 文字列が複素数表現として無効な場合

#### `average`

```ts
average(): BigFloat
```

全要素の平均値を計算する

**Returns**: 平均

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: ゼロ複素数で除算しようとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `dot`

```ts
dot(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
dot(other: BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>): BigFloatComplex
```

別のベクトルとの内積を計算する

**Parameters**
- `other`: 対象ベクトル

**Returns**: 内積の値

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `squaredNorm`

```ts
squaredNorm(): BigFloat
```

二乗ノルム (自分自身との内積) を計算する

**Returns**: 二乗ノルム

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `norm`

```ts
norm(): BigFloat
```

ノルム (ベクトルの長さ) を計算する

**Returns**: ノルム

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `normalize`

```ts
normalize(): BigFloatVector
```

ベクトルを正規化する (長さを 1 にする)

**Returns**: 正規化された新しいベクトル

**Throws**: ベクトルの長さが 0 の場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `squaredDistanceTo`

```ts
squaredDistanceTo(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
```

別のベクトルとの二乗距離を計算する

**Parameters**
- `other`: 対象ベクトル

**Returns**: 二乗距離

**Throws**: ベクトルの次元が一致しない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `distanceTo`

```ts
distanceTo(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
```

別のベクトルとの距離を計算する

**Parameters**
- `other`: 対象ベクトル

**Returns**: 距離

**Throws**: 負の数の平方根を計算しようとした場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

#### `projectOnto`

```ts
projectOnto(other: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
projectOnto(other: BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

別のベクトルへの正射影ベクトルを計算する

**Parameters**
- `other`: 射影先のベクトル

**Returns**: 射影された新しいベクトル

**Throws**: 射影先のベクトルの長さが 0 の場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 複素数モードが無効な場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `angleTo`

```ts
angleTo(other: BigFloatVector | Iterable<BigFloatValue>): BigFloat
```

別のベクトルとのなす角を計算する

**Parameters**
- `other`: 対象ベクトル

**Returns**: 角度 (ラジアン)

**Throws**: いずれかのベクトルの長さが 0 の場合

**Throws**: Division by zero

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 導関数がゼロになった場合

**Throws**: キャッシュが存在しない場合

**Throws**: 文字列が複素数表現として無効な場合

#### `cross`

```ts
cross(other: BigFloatVector | Iterable<BigFloatValue>): BigFloatVector
cross(other: BigFloatComplexVector | Iterable<BigFloatComplex>): BigFloatComplexVector
```

別のベクトルとの外積を計算する (3次元ベクトル専用)

**Parameters**
- `other`: 対象ベクトル

**Returns**: 外積の結果の新しいベクトル

**Throws**: いずれかのベクトルが 3 次元でない場合

**Throws**: 特殊値が無効な設定で特殊値を扱おうとした場合

**Throws**: 精度の不一致が許容されていない場合

**Throws**: 複素数モードが無効な場合

**Throws**: 文字列が複素数表現として無効な場合

<a id="bigfloaterror"></a>

## `BigFloatError`

BigFloat ライブラリ共通の基底エラークラス

```ts
class BigFloatError
```

### Constructor

#### `constructor`

```ts
constructor(message?: string, options?: ErrorOptions): BigFloatError
```

BigFloat ライブラリ共通の基底エラークラス

**Parameters**
- `message`: エラーメッセージ
- `options`: エラーオプション

<a id="cachenotinitializederror"></a>

## `CacheNotInitializedError`

必須キャッシュが初期化されていない場合のエラー

```ts
class CacheNotInitializedError
```

<a id="dimensionmismatcherror"></a>

## `DimensionMismatchError`

行列やベクトルの次元が不一致の場合のエラー

```ts
class DimensionMismatchError
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

<a id="singularmatrixerror"></a>

## `SingularMatrixError`

行列が特異（逆行列が存在しない）場合のエラー

```ts
class SingularMatrixError
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

<a id="bigfloatoptions"></a>

## `BigFloatOptions`

BigFloat 構成オプション

```ts
interface BigFloatOptions { allowPrecisionMismatch?: boolean; allowComplexNumbers?: boolean; mutateResult?: boolean; allowSpecialValues?: boolean; roundingMode?: RoundingMode.TRUNCATE | RoundingMode.UP | RoundingMode.CEIL | RoundingMode.FLOOR | RoundingMode.HALF_UP | RoundingMode.HALF_DOWN; extraPrecision?: bigint; trigFuncsMaxSteps?: bigint; lnMaxSteps?: bigint }
```

<a id="precisionvalue"></a>

## `PrecisionValue`

精度を表す値

```ts
type PrecisionValue = number | bigint
```

<a id="bigfloatvalue"></a>

## `BigFloatValue`

BigFloatに変換可能な値

```ts
type BigFloatValue = string | number | bigint | BigFloat
```

<a id="bigfloataggregateargs"></a>

## `BigFloatAggregateArgs`

BigFloat の可変引数または単一配列引数

```ts
type BigFloatAggregateArgs = string | number | bigint | BigFloat[] | [ReadonlyArray<BigFloatValue>]
```

<a id="bigfloatlike"></a>

## `BigFloatLike`

BigFloat または BigFloatComplex のインスタンス

```ts
type BigFloatLike = BigFloat | BigFloatComplex
```

<a id="bigfloatinputvalue"></a>

## `BigFloatInputValue`

BigFloatとBigFloatComplexで共通利用可能で変換可能な値

```ts
type BigFloatInputValue = string | number | bigint | BigFloat | BigFloatComplex
```

<a id="bigfloatvectorlike"></a>

## `BigFloatVectorLike`

```ts
type BigFloatVectorLike = BigFloatVector | Iterable<BigFloatValue>
```

<a id="bigfloatcomplexvectorlike"></a>

## `BigFloatComplexVectorLike`

```ts
type BigFloatComplexVectorLike = BigFloatComplexVector | Iterable<BigFloatComplex>
```

<a id="bigfloatanyvector"></a>

## `BigFloatAnyVector`

BigFloatVector または BigFloatComplexVector のインスタンス

```ts
type BigFloatAnyVector = BigFloatVector | BigFloatComplexVector
```

<a id="bigfloatanyvectorlike"></a>

## `BigFloatAnyVectorLike`

```ts
type BigFloatAnyVectorLike = BigFloatVector | Iterable<BigFloatValue> | BigFloatComplexVector | Iterable<BigFloatComplex> | Iterable<BigFloatInputValue>
```

<a id="bigfloatmatrixlike"></a>

## `BigFloatMatrixLike`

```ts
type BigFloatMatrixLike = BigFloatMatrix | Iterable<BigFloatVectorLike>
```

<a id="bigfloatcomplexmatrixlike"></a>

## `BigFloatComplexMatrixLike`

```ts
type BigFloatComplexMatrixLike = BigFloatComplexMatrix | Iterable<BigFloatComplexVectorLike>
```

<a id="bigfloatanymatrix"></a>

## `BigFloatAnyMatrix`

BigFloatMatrix または BigFloatComplexMatrix のインスタンス

```ts
type BigFloatAnyMatrix = BigFloatComplexMatrix | BigFloatMatrix
```

<a id="bigfloatanymatrixlike"></a>

## `BigFloatAnyMatrixLike`

```ts
type BigFloatAnyMatrixLike = BigFloatComplexMatrix | BigFloatMatrix | Iterable<BigFloatVectorLike> | Iterable<BigFloatComplexVectorLike>
```
