export type BigFloatMatrixRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};
/**
 * BigFloat を固定長行列として扱うクラス
 */
export declare class BigFloatMatrix implements Iterable<BigFloatVector> {
	/** 内部要素 (行ごとの配列) */
	_values: BigFloat[][];
	/**
	 * BigFloatMatrix コンストラクタ
	 * @param rows - 行列要素の反復可能オブジェクト
	 * @param precision - 変換時の精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} 行列の行が同じ長さを持たない場合
	 */
	constructor(rows?: BigFloatMatrixLike, precision?: PrecisionValue);
	/**
	 * 内部配列から行列を生成する (内部用)
	 * @param values - BigFloat の二次元配列
	 * @returns BigFloatMatrix インスタンス
	 */
	protected static _fromBigFloatGrid(values: BigFloat[][]): BigFloatMatrix;
	/**
	 * 内部配列から複素行列を生成する (内部用)
	 * @param values - BigFloatComplex の二次元配列
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	protected static _fromBigFloatGrid(values: BigFloatComplex[][]): BigFloatComplexMatrix;
	/**
	 * 内部配列から行列を生成する (内部用)
	 * @param values - 値の二次元配列
	 * @returns 行列インスタンス
	 */
	protected static _fromBigFloatGrid(values: BigFloatLike[][]): BigFloatAnyMatrix;
	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象の値
	 * @param precision - 精度
	 * @returns BigFloat インスタンス
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象の複素数
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	protected static _toBigFloat(value: BigFloatComplex, precision?: bigint): BigFloatComplex;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatVectorLike, precision?: PrecisionValue): bigint;
	/**
	 * 次元を正規化する
	 * @param size - 元のサイズ
	 * @param name - パラメータ名
	 * @returns 正規化されたサイズ
	 * @throws {RangeError} size が負または非有限の場合
	 */
	protected static _normalizeSize(size: number, name: string): number;
	/**
	 * 生配列が長方形か検証する
	 * @throws {RangeError} 行列の行が同じ長さを持たない場合
	 */
	protected static _assertRectangularRaw(rows: BigFloatInputValue[][]): void;
	/**
	 * 同形状か検証する
	 * @throws {RangeError} 行列の形状が異なる場合
	 */
	protected static _assertSameShape(left: BigFloatMatrix, right: BigFloatMatrix): void;
	/**
	 * 正方行列か検証する
	 * @throws {RangeError} 行列が正方行列でない場合
	 */
	protected static _assertSquare(matrix: BigFloatMatrix): void;
	/**
	 * 行列積可能か検証する
	 * @throws {RangeError} 行列の内積次元が一致しない場合
	 */
	protected static _assertMultipliable(left: BigFloatMatrix, right: BigFloatMatrix): void;
	/**
	 * 指定された精度の微小値 (10^-precision) を返す (内部用)
	 * @param precision - 精度
	 * @returns 微小値
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _epsilon(precision: bigint): BigFloat;
	/**
	 * 任意入力を BigFloatMatrix へ変換する (内部用)
	 * @param value - 変換対象
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns BigFloatMatrix インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected static _coerceMatrix(value: BigFloatMatrixLike, referenceValues?: BigFloatVectorLike): BigFloatMatrix;
	/**
	 * 任意入力を BigFloatVector へ変換する (内部用)
	 * @param value - 変換対象
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns BigFloatVector インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	protected static _coerceVector(value: BigFloatVectorLike, referenceValues?: BigFloatValue[]): BigFloatVector;
	/**
	 * 全要素を一次元配列として取得する (内部用)
	 * @returns 要素の平坦化配列
	 */
	protected _flattenValues(): BigFloat[];
	/**
	 * 各要素に関数を適用して新しい実数行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい実数行列
	 */
	protected _mapValues(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this | BigFloatMatrix;
	/**
	 * 各要素に関数を適用して新しい複素行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい複素行列
	 */
	protected _mapValues(fn: (value: BigFloatLike, row: number, column: number) => BigFloatInputValue): BigFloatComplexMatrix;
	/**
	 * 各要素に関数を適用して新しい行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい行列
	 */
	protected _mapValues(fn: ((value: BigFloat, row: number, column: number) => BigFloatValue) | ((value: BigFloatLike, row: number, column: number) => BigFloatInputValue)): this | BigFloatAnyMatrix;
	/**
	 * オペランドを用いて各要素に関数を適用し、新しい実数行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい実数行列
	 */
	protected _mapWithOperand(other: BigFloatMatrixLike | BigFloatValue, fn: (left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue): this | BigFloatMatrix;
	/**
	 * オペランドを用いて各要素に関数を適用し、新しい複素行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい複素行列
	 */
	protected _mapWithOperand(other: BigFloatAnyMatrixLike | BigFloatComplex, fn: (left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatInputValue): BigFloatComplexMatrix;
	/**
	 * オペランドを用いて各要素に関数を適用し、新しい行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい行列
	 */
	protected _mapWithOperand(other: BigFloatAnyMatrixLike | BigFloatInputValue, fn: ((left: BigFloat, right: BigFloat, row: number, column: number) => BigFloatValue) | ((left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatInputValue)): this | BigFloatAnyMatrix;
	/**
	 * 行列の簡約階段形式 (RREF) を計算する (内部用)
	 * @param values - 対象行列の二次元配列
	 * @param leftColumnCount - 掃き出し対象の列数
	 * @returns RREF 後の配列と主成分(ピボット)列のインデックス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _reducedRowEchelon(values: BigFloat[][], leftColumnCount?: number): {
		values: BigFloat[][];
		pivotColumns: number[];
	};
	/**
	 * 空の行列 (0x0) を生成する
	 * @returns 空の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static empty(): BigFloatMatrix;
	/**
	 * 二次元配列から実数行列を生成する
	 * @param rows - 二次元配列
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 */
	static from(rows: BigFloatMatrixLike, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 二次元配列から複素行列を生成する
	 * @param rows - 二次元配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	static from(rows: BigFloatComplexMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * 行ベクトルのリストから行列を生成する
	 * @param rows - 行要素
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	static fromRows(rows: BigFloatMatrixLike, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 列ベクトル群から生成する
	 * @param columns - 列ベクトルのリスト
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} 列ベクトルの長さが異なる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static fromColumns(columns: BigFloatMatrixLike, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 行配列の可変長引数から行列を生成する
	 * @param rows - 各行の要素配列
	 * @returns BigFloatMatrix インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	static of(...rows: BigFloatVectorLike[]): BigFloatMatrix;
	/**
	 * 指定した値で埋められた行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static fill(rowCount: number, columnCount: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 零行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * すべての要素が 1 の行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 単位行列を生成する
	 * @param size - 次元数
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} size が負または非有限の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static identity(size: number, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 対角要素を指定して対角行列を生成する
	 * @param values - 対角要素のリスト
	 * @param precision - 精度
	 * @returns BigFloatMatrix インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static diagonal(values: Iterable<BigFloatValue>, precision?: PrecisionValue): BigFloatMatrix;
	/**
	 * 乱数行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param options - 乱数範囲と精度のオプション
	 * @returns 生成された行列
	 * @throws {RangeError} max < min の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static random(rowCount: number, columnCount: number, options?: BigFloatMatrixRandomOptions): BigFloatMatrix;
	/**
	 * 行数を取得する
	 */
	get rowCount(): number;
	/**
	 * 列数を取得する
	 */
	get columnCount(): number;
	/**
	 * 行列の形状 (行数と列数) を配列として取得する
	 * @returns [行数, 列数]
	 */
	shape(): [
		number,
		number
	];
	/**
	 * 行列が空 (次元が 0) かどうかを判定する
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 正方行列かどうかを判定する
	 * @returns 正方行列なら true
	 */
	isSquare(): boolean;
	/**
	 * 指定したインデックスの要素を取得する (複製)
	 * @param row - 行インデックス
	 * @param column - 列インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 */
	at(row: number, column: number): BigFloat | undefined;
	/**
	 * 指定した行を取得する
	 * @param index - 行インデックス
	 * @returns 指定行のベクトル、インデックスが範囲外の場合は undefined
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	row(index: number): BigFloatVector | undefined;
	/**
	 * 指定した列を取得する
	 * @param index - 列インデックス
	 * @returns 指定列のベクトル、インデックスが範囲外の場合は undefined
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	column(index: number): BigFloatVector | undefined;
	/**
	 * 対角成分を取得する
	 * @returns 対角成分のベクトル
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	diagonalVector(): BigFloatVector;
	/**
	 * 行列を複製する
	 * @returns 複製された BigFloatMatrix
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	clone(): BigFloatMatrix;
	/**
	 * 二次元配列へ変換する
	 * @returns 各要素が BigFloat の二次元配列
	 */
	toArray(): BigFloat[][];
	/**
	 * 行ごとのベクトルの配列へ変換する
	 * @returns BigFloatVector の配列
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	toVectors(): BigFloatVector[];
	/**
	 * 行列を平坦化したベクトルへ変換する
	 * @returns 行列の全要素を持つ BigFloatVector
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	flatten(): BigFloatVector;
	/**
	 * 全要素を流すストリームへ変換する
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	toStream(): BigFloatStream;
	/**
	 * 行ベクトルを順に反復するイテレータを取得する
	 * @returns 行ベクトルのイテレータ
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	[Symbol.iterator](): Iterator<BigFloatVector, void, undefined>;
	/**
	 * 各要素に対して関数を実行する
	 * @param fn - 実行する関数
	 */
	forEach(fn: (value: BigFloat, row: number, column: number) => void): void;
	/**
	 * 各要素を変換した新しい行列を取得する
	 * @param fn - 変換関数
	 * @returns 変換後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	map(fn: (value: BigFloat, row: number, column: number) => BigFloatValue): this | BigFloatMatrix;
	/**
	 * 別の行列と要素ごとに対になる変換を行い、新しい行列を取得する
	 * @param other - 対象行列
	 * @param fn - 変換関数
	 * @returns 変換後の新しい行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	zipMap(other: BigFloatAnyMatrixLike, fn: (left: BigFloat, right: BigFloatLike, row: number, column: number) => BigFloatValue): this | BigFloatAnyMatrix;
	/**
	 * 全要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 */
	reduce<U>(fn: (acc: U, value: BigFloat, row: number, column: number) => U, initial: U): U;
	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	some(fn: (value: BigFloat, row: number, column: number) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすかどうかを判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	every(fn: (value: BigFloat, row: number, column: number) => boolean): boolean;
	/**
	 * 行方向に連結する
	 * @param others - 連結する行列のリスト
	 * @returns 連結された新しい行列
	 * @throws {RangeError} 列数が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	concatRows(...others: BigFloatMatrixLike[]): this;
	/**
	 * 列方向に連結する
	 * @param others - 連結する行列のリスト
	 * @returns 連結された新しい行列
	 * @throws {RangeError} 行数が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	concatColumns(...others: BigFloatMatrixLike[]): this;
	/**
	 * 行の一部を抽出した新しい行列を返す
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sliceRows(start?: number, end?: number): this;
	/**
	 * 列の一部を抽出した新しい行列を返す
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sliceColumns(start?: number, end?: number): this;
	/**
	 * 転置行列を取得する
	 * @returns 転置された新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	transpose(): this;
	/**
	 * 別の行列と内容が等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	equals(other: BigFloatMatrixLike): boolean;
	/**
	 * すべての要素の精度を変更した新しい行列を取得する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	changePrecision(precision: PrecisionValue): this | BigFloatMatrix;
	/**
	 * 各要素に別の行列またはスカラ値を加算した新しい行列を取得する
	 * @param other - 加算する行列または数値
	 * @returns 加算後の新しい行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	add(other: BigFloatInputValue | BigFloatAnyMatrixLike): this | BigFloatAnyMatrix;
	/**
	 * 各要素から別の行列またはスカラ値を減算した新しい行列を取得する
	 * @param other - 減算する行列または数値
	 * @returns 減算後の新しい行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sub(other: BigFloatInputValue | BigFloatAnyMatrixLike): this | BigFloatAnyMatrix;
	/**
	 * 各要素にスカラ値を乗算した新しい行列を取得する
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	mul(scalar: BigFloatValue): this | BigFloatAnyMatrix;
	/**
	 * 各要素をスカラ値で除算した新しい行列を取得する
	 * @param scalar - 除数
	 * @returns 除算後の新しい行列
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	div(scalar: BigFloatValue): this | BigFloatMatrix;
	/**
	 * 各要素に対して剰余演算を行った新しい行列を取得する
	 * @param other - 法
	 * @returns 演算後の新しい行列
	 * @throws {TypeError} BigFloat.mod が複素数オペランドをサポートしていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	mod(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 別の行列とのアダマール積 (要素ごとの積) を計算する
	 * @param other - 対象行列
	 * @returns アダマール積の結果の行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	hadamard(other: BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 各要素の符号を反転させた新しい行列を取得する
	 * @returns 符号反転後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	neg(): this | BigFloatMatrix;
	/**
	 * 各要素を絶対値にした新しい行列を取得する
	 * @returns 絶対値適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	abs(): this | BigFloatMatrix;
	/**
	 * 各要素の符号 (1, 0, -1) を持つ行列を取得する
	 * @returns 符号行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sign(): this | BigFloatMatrix;
	/**
	 * 各要素の逆数を持つ行列を取得する
	 * @returns 逆数行列
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	reciprocal(): this | BigFloatMatrix;
	/**
	 * 各要素を指定した指数で冪乗した新しい行列を取得する
	 * @param exponent - 指数
	 * @returns 冪乗後の新しい行列
	 * @throws {RangeError} 負の数の非整数乗が実数にならない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	pow(exponent: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 各要素の平方根を計算した新しい行列を取得する
	 * @returns 平方根適用後の新しい行列
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sqrt(): this | BigFloatMatrix;
	/**
	 * 各要素の立方根を計算した新しい行列を取得する
	 * @returns 立方根適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cbrt(): this | BigFloatMatrix;
	/**
	 * 各要素の n 乗根を計算した新しい行列を取得する
	 * @param n - 指数
	 * @returns n 乗根適用後の新しい行列
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	nthRoot(n: number | bigint): this | BigFloatMatrix;
	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理した新しい行列を取得する
	 * @returns 床関数適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	floor(): this | BigFloatMatrix;
	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理した新しい行列を取得する
	 * @returns 天井関数適用後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	ceil(): this | BigFloatMatrix;
	/**
	 * 各要素を四捨五入した新しい行列を取得する
	 * @returns 四捨五入後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	round(): this | BigFloatMatrix;
	/**
	 * 各要素を 0 方向に切り捨てた新しい行列を取得する
	 * @returns 切り捨て後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	trunc(): this | BigFloatMatrix;
	/**
	 * 各要素を Float32 精度に丸めた新しい行列を取得する
	 * @returns 丸め後の新しい行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	fround(): this | BigFloatMatrix;
	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えた行列を取得する
	 * @returns 結果の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	clz32(): this | BigFloatMatrix;
	/**
	 * 別の行列または数値との相対差を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 相対差の行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	relativeDiff(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 別の行列または数値との絶対差を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 絶対差の行列
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	absoluteDiff(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 別の行列または数値との百分率差分を各要素ごとに計算した行列を取得する
	 * @param other - 比較対象
	 * @returns 百分率差分の行列 (%)
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	percentDiff(other: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 各要素の正弦 (sin) を計算した行列を取得する
	 * @returns sin 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sin(): this | BigFloatMatrix;
	/**
	 * 各要素の余弦 (cos) を計算した行列を取得する
	 * @returns cos 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cos(): this | BigFloatMatrix;
	/**
	 * 各要素の正接 (tan) を計算した行列を取得する
	 * @returns tan 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tan(): this | BigFloatMatrix;
	/**
	 * 各要素の逆正弦 (asin) を計算した行列を取得する
	 * @returns asin 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	asin(): this | BigFloatMatrix;
	/**
	 * 各要素の逆余弦 (acos) を計算した行列を取得する
	 * @returns acos 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	acos(): this | BigFloatMatrix;
	/**
	 * 各要素の逆正接 (atan) を計算した行列を取得する
	 * @returns atan 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atan(): this | BigFloatMatrix;
	/**
	 * 各要素に対して atan2 を計算した行列を取得する
	 * @param x - x 座標の行列または数値
	 * @returns atan2 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atan2(x: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 各要素の双曲線正弦 (sinh) を計算した行列を取得する
	 * @returns sinh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sinh(): this | BigFloatMatrix;
	/**
	 * 各要素の双曲線余弦 (cosh) を計算した行列を取得する
	 * @returns cosh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cosh(): this | BigFloatMatrix;
	/**
	 * 各要素の双曲線正接 (tanh) を計算した行列を取得する
	 * @returns tanh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tanh(): this | BigFloatMatrix;
	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算した行列を取得する
	 * @returns asinh 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	asinh(): this | BigFloatMatrix;
	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算した行列を取得する
	 * @returns acosh 適用後の行列
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	acosh(): this | BigFloatMatrix;
	/**
	 * 各要素の逆双曲線正接 (atanh) を計算した行列を取得する
	 * @returns atanh 適用後の行列
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atanh(): this | BigFloatMatrix;
	/**
	 * 各要素の指数関数 (exp) を計算した行列を取得する
	 * @returns exp 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	exp(): this | BigFloatMatrix;
	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算した行列を取得する
	 * @returns exp2 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	exp2(): this | BigFloatMatrix;
	/**
	 * 各要素に対して exp(x) - 1 を計算した行列を取得する
	 * @returns expm1 適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	expm1(): this | BigFloatMatrix;
	/**
	 * 各要素の自然対数 (ln) を計算した行列を取得する
	 * @returns ln 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	ln(): this | BigFloatMatrix;
	/**
	 * 各要素の任意の底による対数を計算した行列を取得する
	 * @param base - 底
	 * @returns 対数計算後の行列
	 * @throws {RangeError} 行列形状が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	log(base: BigFloatValue | BigFloatMatrixLike): this | BigFloatMatrix;
	/**
	 * 各要素の底を 2 とする対数を計算した行列を取得する
	 * @returns log2 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	log2(): this | BigFloatMatrix;
	/**
	 * 各要素の常用対数 (log10) を計算した行列を取得する
	 * @returns log10 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	log10(): this | BigFloatMatrix;
	/**
	 * 各要素に対して ln(1 + x) を計算した行列を取得する
	 * @returns log1p 適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	log1p(): this | BigFloatMatrix;
	/**
	 * 各要素に対してガンマ関数を計算した行列を取得する
	 * @returns ガンマ関数適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	gamma(): this | BigFloatMatrix;
	/**
	 * 各要素に対してリーマンゼータ関数を計算した行列を取得する
	 * @returns ゼータ関数適用後の行列
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	zeta(): this | BigFloatMatrix;
	/**
	 * 各要素に対して階乗を計算した行列を取得する
	 * @returns 階乗適用後の行列
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	factorial(): this | BigFloatMatrix;
	/**
	 * 最大値を返す
	 * @returns 最大値
	 * @throws {TypeError} 行列が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	max(): BigFloat;
	/**
	 * 最小値を返す
	 * @returns 最小値
	 * @throws {TypeError} 行列が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	min(): BigFloat;
	/**
	 * 全要素の合計を計算する
	 * @returns 合計
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sum(): BigFloat;
	/**
	 * 全要素の積を計算する
	 * @returns 総乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	product(): BigFloat;
	/**
	 * 全要素の平均を計算する
	 * @returns 平均
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	average(): BigFloat;
	/**
	 * 行ごとの合計を計算する
	 * @returns 各行の和を持つベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	rowSums(): BigFloatVector;
	/**
	 * 列ごとの合計を計算する
	 * @returns 各列の和を持つベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	columnSums(): BigFloatVector;
	/**
	 * 行列のトレース (対角成分の和) を計算する
	 * @returns トレース
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	trace(): BigFloat;
	/**
	 * フロベニウスノルムを計算する
	 * @returns フロベニウスノルム
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	frobeniusNorm(): BigFloat;
	/**
	 * 別の行列との行列積を計算する
	 * @param other - 乗じる行列
	 * @returns 行列積の結果
	 * @throws {RangeError} 内積次元が一致しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 */
	matmul(other: BigFloatMatrixLike): this;
	/**
	 * ベクトル積を計算する
	 * @param vector - 乗算するベクトル
	 * @returns 演算結果のベクトル
	 * @throws {RangeError} 内部次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	mulVector(vector: BigFloatVectorLike): BigFloatVector;
	/**
	 * 行列式を計算する
	 * @returns 行列式の値
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	determinant(): BigFloat;
	/**
	 * 行列のランク (階数) を計算する
	 * @returns ランク
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	rank(): number;
	/**
	 * 逆行列を計算する
	 * @returns 逆行列
	 * @throws {RangeError} 正方行列でない場合、または行列が特異な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	inverse(): this;
	/**
	 * 連立方程式 Ax = b を解く
	 * @param rhs - 右辺ベクトル b
	 * @returns 解ベクトル x
	 * @throws {RangeError} 行列が正方でない場合、ベクトル長が不一致な場合、または行列が特異な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	solveVector(rhs: BigFloatVectorLike): BigFloatVector;
	/**
	 * 連立方程式 AX = B を解く
	 * @param rhs - 右辺行列 B
	 * @returns 解行列 X
	 * @throws {RangeError} 行列が正方でない場合、行数が不一致な場合、または行列が特異な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	solveMatrix(rhs: BigFloatMatrixLike): this;
	/**
	 * 行列の累乗 A^exponent を計算する
	 * @param exponent - 指数 (整数)
	 * @returns 演算結果
	 * @throws {RangeError} 正方行列でない場合、または指数が整数でない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	matrixPow(exponent: number): this;
}
export type BigFloatComplexMatrixRandomOptions = {
	min?: BigFloatInputValue;
	max?: BigFloatInputValue;
	precision?: PrecisionValue;
};
/**
 * BigFloatComplex を要素とする固定長行列クラス
 */
export declare class BigFloatComplexMatrix implements Iterable<BigFloatComplexVector> {
	/** 内部要素 (行ごとの配列) */
	_values: BigFloatComplex[][];
	/**
	 * BigFloatComplexMatrix コンストラクタ
	 * @param rows - 行列要素の反復可能オブジェクト
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 * @throws {RangeError} 各行の長さが一致しない場合
	 */
	constructor(rows?: BigFloatAnyMatrixLike, precision?: PrecisionValue);
	/**
	 * BigFloatComplex の二次元配列から行列を生成する
	 * @param values - BigFloatComplex の二次元配列
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	protected static _fromComplexGrid(values: BigFloatComplex[][]): BigFloatComplexMatrix;
	/**
	 * 値を BigFloatComplex に変換する
	 * @param value - 変換する値
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toComplex(value: BigFloatInputValue, precision?: bigint): BigFloatComplex;
	/**
	 * 精度を解決する
	 * @param values - 対象の値の配列
	 * @param precision - 指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint;
	/**
	 * 二次元配列が矩形であることを検証する
	 * @param rows - 検証対象の二次元配列
	 * @throws {RangeError} 各行の長さが一致しない場合
	 */
	protected static _assertRectangularRaw(rows: BigFloatInputValue[][]): void;
	/**
	 * 二つの行列の形状が一致することを検証する
	 * @param left - 左辺行列
	 * @param right - 右辺行列
	 * @throws {RangeError} 行列の形状が一致しない場合
	 */
	protected static _assertSameShape(left: BigFloatAnyMatrix, right: BigFloatAnyMatrix): void;
	/**
	 * 値を行列に変換する
	 * @param value - 変換する値
	 * @param referenceValues - 精度の解決に使用する参照値
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	protected static _coerceMatrix(value: BigFloatAnyMatrixLike, referenceValues?: BigFloatInputValue[]): BigFloatComplexMatrix;
	/**
	 * 行列の全要素をフラットな配列として取得する
	 * @returns 全要素の配列
	 */
	protected _flattenValues(): BigFloatComplex[];
	/**
	 * 各要素に関数を適用して新しい行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapValues(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this;
	/**
	 * オペランドを用いて各要素に関数を適用し、新しい行列を生成する
	 * @param other - オペランド（行列またはスカラー）
	 * @param fn - 適用する関数
	 * @returns 演算後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapWithOperand(other: BigFloatAnyMatrixLike | BigFloatInputValue, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this;
	/**
	 * 空の行列を生成する
	 * @returns 空の行列
	 */
	static empty(): BigFloatComplexMatrix;
	/**
	 * 二次元配列から行列を生成する
	 * @param rows - 二次元配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	static from(rows: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * 行の配列から行列を生成する
	 * @param rows - 行の配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	static fromRows(rows: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * 列の配列から行列を生成する
	 * @param columns - 列の配列
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	static fromColumns(columns: BigFloatAnyMatrixLike, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * 可変長引数の行から行列を生成する
	 * @param rows - 行ベクトルの配列
	 * @returns BigFloatComplexMatrix インスタンス
	 */
	static of(...rows: BigFloatAnyVectorLike[]): BigFloatComplexMatrix;
	/**
	 * 指定された値で埋められた行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatComplexMatrix インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static fill(rowCount: number, columnCount: number, value: BigFloatInputValue, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * 零行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns 零行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static zeros(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * すべての要素が 1 の行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param precision - 精度
	 * @returns すべての要素が 1 の行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static ones(rowCount: number, columnCount: number, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * 対角行列を生成する
	 * @param values - 対角成分の配列
	 * @param precision - 精度
	 * @returns 対角行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static diagonal(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * ランダムな値を持つ行列を生成する
	 * @param rowCount - 行数
	 * @param columnCount - 列数
	 * @param options - ランダム生成のオプション
	 * @returns ランダムな行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	static random(rowCount: number, columnCount: number, options?: BigFloatComplexMatrixRandomOptions): BigFloatComplexMatrix;
	/**
	 * 行数
	 */
	get rowCount(): number;
	/**
	 * 列数
	 */
	get columnCount(): number;
	/**
	 * 正方行列であるか判定する
	 * @returns 正方行列なら true
	 */
	isSquare(): boolean;
	/**
	 * 空の行列であるか判定する
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 行列の形状を取得する
	 * @returns [行数, 列数]
	 */
	shape(): [
		number,
		number
	];
	/**
	 * 指定したインデックスの要素を取得する
	 * @param row - 行インデックス
	 * @param column - 列インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	at(row: number, column: number): BigFloatComplex | undefined;
	/**
	 * 指定した行のベクトルを取得する
	 * @param index - 行インデックス
	 * @returns 指定行のベクトル、インデックスが範囲外の場合は undefined
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	row(index: number): BigFloatComplexVector | undefined;
	/**
	 * 指定した列のベクトルを取得する
	 * @param index - 列インデックス
	 * @returns 指定列のベクトル、インデックスが範囲外の場合は undefined
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	column(index: number): BigFloatComplexVector | undefined;
	/**
	 * 行列を複製する
	 * @returns 複製された BigFloatComplexMatrix
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	clone(): BigFloatComplexMatrix;
	/**
	 * 二次元配列に変換する
	 * @returns 各要素が BigFloatComplex の二次元配列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	toArray(): BigFloatComplex[][];
	/**
	 * 行ベクトルの配列に変換する
	 * @returns BigFloatComplexVector の配列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	toVectors(): BigFloatComplexVector[];
	/**
	 * 行ベクトルのイテレータを取得する
	 * @returns 行ベクトルのイテレータ
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	[Symbol.iterator](): Iterator<BigFloatComplexVector, void, undefined>;
	/**
	 * 各要素に対して処理を実行する
	 * @param fn - 実行する関数
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	forEach(fn: (value: BigFloatComplex, row: number, column: number) => void): void;
	/**
	 * 各要素に関数を適用して新しい行列を生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	map(fn: (value: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this;
	/**
	 * 要素を流すストリームへ変換する
	 * @returns 要素のストリーム
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	toStream(): BigFloatStream;
	/**
	 * 行列の加算を行う
	 * @param other - 加算する行列またはスカラー
	 * @returns 加算後の新しい行列
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	add(other: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 行列の減算を行う
	 * @param other - 減算する行列またはスカラー
	 * @returns 減算後の新しい行列
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	sub(other: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * アダマール積（要素ごとの積）を計算する
	 * @param other - 乗算する行列
	 * @returns アダマール積の結果の行列
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	hadamard(other: BigFloatAnyMatrixLike): this;
	/**
	 * スカラー倍を行う
	 * @param scalar - 乗算するスカラー
	 * @returns 乗算後の新しい行列
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	mul(scalar: BigFloatInputValue): this;
	/**
	 * スカラー除算を行う
	 * @param scalar - 除算するスカラー
	 * @returns 除算後の新しい行列
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	div(scalar: BigFloatInputValue): this;
	/**
	 * 行列の積を計算する
	 * @param other - 乗算する行列
	 * @returns 行列の積
	 * @throws {RangeError} 行列の次元が一致しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	matmul(other: BigFloatAnyMatrixLike): this;
	/**
	 * 転置行列を生成する
	 * @returns 転置された新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	transpose(): this;
	/**
	 * 各行の和を計算する
	 * @returns 各行の和を持つベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	rowSums(): BigFloatComplexVector;
	/**
	 * 各列の和を計算する
	 * @returns 各列の和を持つベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	columnSums(): BigFloatComplexVector;
	/**
	 * 行列のトレース（対角和）を計算する
	 * @returns トレースの値
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	trace(): BigFloatComplex;
	/**
	 * 行列式を計算する
	 * @returns 行列式の値
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	determinant(): BigFloatComplex;
	/**
	 * 逆行列を計算する
	 * @returns 逆行列
	 * @throws {RangeError} 正方行列でない場合
	 * @throws {SingularMatrixError} 行列が特異な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	inverse(): this;
	/**
	 * 連立一次方程式を解く（ベクトル）
	 * @param rhs - 右辺ベクトル
	 * @returns 解ベクトル
	 * @throws {RangeError} 次元が正方でない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SingularMatrixError} 行列が特異な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DimensionMismatchError} 行列の次元が一致しない場合
	 */
	solveVector(rhs: BigFloatAnyVectorLike): BigFloatComplexVector;
	/**
	 * 連立一次方程式を解く（行列）
	 * @param rhs - 右辺行列
	 * @returns 解行列
	 * @throws {RangeError} 次元が正方でない場合
	 * @throws {SingularMatrixError} 行列が特異な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {DimensionMismatchError} 行列の次元が一致しない場合
	 */
	solveMatrix(rhs: BigFloatAnyMatrixLike): this;
	/**
	 * 行階段形（簡約行階段形）を計算する
	 * @param values - 対象の行列データ
	 * @param leftColumnCount - 左側の列数
	 * @returns 簡約行階段形行列とそのピボット列のインデックス
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	protected static _reducedRowEchelon(values: BigFloatComplex[][], leftColumnCount?: number): {
		values: BigFloatComplex[][];
		pivotColumns: number[];
	};
	/**
	 * 行列のべき乗を計算する
	 * @param exponent - 指数
	 * @returns 行列のべき乗
	 * @throws {RangeError} 指数が整数でない場合、または正方行列でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SingularMatrixError} 行列が特異な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	matrixPow(exponent: number): this;
	/**
	 * 単位行列を生成する
	 * @param size - 行列のサイズ
	 * @param precision - 精度
	 * @returns 単位行列
	 */
	static identity(size: number, precision?: PrecisionValue): BigFloatComplexMatrix;
	/**
	 * 行列が等しいかどうかを判定する
	 * @param other - 比較対象の行列
	 * @returns 等しい場合は true、そうでない場合は false
	 * @throws {RangeError} 次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	equals(other: BigFloatAnyMatrixLike): boolean;
	/**
	 * 全要素の合計を計算する
	 * @returns 合計値
	 * @throws {RangeError} 次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sum(): BigFloatComplex;
	/**
	 * 全要素の積を計算する
	 * @returns 積の値
	 * @throws {RangeError} 次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	product(): BigFloatComplex;
	/**
	 * 全要素の平均を計算する
	 * @returns 平均値
	 * @throws {RangeError} 次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	average(): BigFloatComplex;
	/**
	 * フロベニウスノルムを計算する
	 * @returns ノルムの値
	 * @throws {RangeError} 次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	frobeniusNorm(): BigFloat;
	/**
	 * 行列とベクトルの積を計算する
	 * @param vector - 乗算するベクトル
	 * @returns ベクトルとの積
	 * @throws {RangeError} 次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	mulVector(vector: BigFloatAnyVectorLike): BigFloatComplexVector;
	/**
	 * 対角成分をベクトルとして取得する
	 * @returns 対角成分のベクトル
	 * @throws {RangeError} 正方行列でない場合
	 */
	diagonalVector(): BigFloatComplexVector;
	/**
	 * 全要素を一つのベクトルに変換する
	 * @returns 全要素のベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	flatten(): BigFloatComplexVector;
	/**
	 * 二つの行列の各要素に対して関数を適用し、新しい行列を生成する
	 * @param other - 比較対象の行列
	 * @param fn - 適用する関数
	 * @returns 演算結果の行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	zipMap(other: BigFloatAnyMatrixLike, fn: (left: BigFloatComplex, right: BigFloatComplex, row: number, column: number) => BigFloatInputValue): this;
	/**
	 * 各要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	reduce<U>(fn: (acc: U, value: BigFloatComplex, row: number, column: number) => U, initial: U): U;
	/**
	 * いずれかの要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true、そうでない場合は false
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	some(fn: (value: BigFloatComplex, row: number, column: number) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たす場合は true、そうでない場合は false
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	every(fn: (value: BigFloatComplex, row: number, column: number) => boolean): boolean;
	/**
	 * 行列を行方向に連結する
	 * @param others - 連結する行列
	 * @returns 連結された行列
	 * @throws {RangeError} 列数が一致しない場合
	 */
	concatRows(...others: BigFloatAnyMatrixLike[]): this;
	/**
	 * 行列を列方向に連結する
	 * @param others - 連結する行列
	 * @returns 連結された行列
	 * @throws {RangeError} 行数が一致しない場合
	 */
	concatColumns(...others: BigFloatAnyMatrixLike[]): this;
	/**
	 * 指定した範囲の行を抽出する
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	sliceRows(start?: number, end?: number): this;
	/**
	 * 指定した範囲の列を抽出する
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	sliceColumns(start?: number, end?: number): this;
	/**
	 * 行列の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * 各要素の剰余を計算する
	 * @param other - 除数（行列またはスカラー）
	 * @returns 演算後の新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	mod(other: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 各要素の符号を反転する
	 * @returns 符号反転後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	neg(): this;
	/**
	 * 各要素の絶対値を計算する
	 * @returns 絶対値適用後の新しい実数行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	abs(): BigFloatMatrix;
	/**
	 * 各要素の符号を計算する
	 * @returns 符号行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	sign(): this;
	/**
	 * 各要素の逆数を計算する
	 * @returns 逆数行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	reciprocal(): this;
	/**
	 * 各要素のべき乗を計算する
	 * @param exponent - 指数（行列またはスカラー）
	 * @returns 冪乗後の新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	pow(exponent: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根適用後の新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根適用後の新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	cbrt(): this;
	/**
	 * 各要素の n 乗根を計算する
	 * @param n - 次数
	 * @returns n 乗根適用後の新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素の床関数を計算する
	 * @returns 床関数適用後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	floor(): this;
	/**
	 * 各要素の天井関数を計算する
	 * @returns 天井関数適用後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後の新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	round(): this;
	/**
	 * 各要素を切り捨てる
	 * @returns 切り捨て後の新しい行列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	trunc(): this;
	/**
	 * 各要素を最も近い単精度浮動小数点数形式に丸める
	 * @returns 丸め後の新しい行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	fround(): this;
	/**
	 * 各要素の 32 ビット整数としての先頭のゼロの個数を計算する
	 * @returns 結果の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	clz32(): this;
	/**
	 * 各要素の相対差を計算する
	 * @param other - 比較対象（行列またはスカラー）
	 * @returns 相対差の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	relativeDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 各要素の絶対差を計算する
	 * @param other - 比較対象（行列またはスカラー）
	 * @returns 絶対差の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	absoluteDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 各要素の百分率差分を計算する
	 * @param other - 比較対象（行列またはスカラー）
	 * @returns 百分率差分の行列 (%)
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	percentDiff(other: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 各要素の正弦（sin）を計算する
	 * @returns sin 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	sin(): this;
	/**
	 * 各要素の余弦（cos）を計算する
	 * @returns cos 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	cos(): this;
	/**
	 * 各要素の正接（tan）を計算する
	 * @returns tan 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦（asin）を計算する
	 * @returns asin 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦（acos）を計算する
	 * @returns acos 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	acos(): this;
	/**
	 * 各要素の逆正接（atan）を計算する
	 * @returns atan 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	atan(): this;
	/**
	 * 各要素の atan2 を計算する
	 * @param x - x 座標（行列またはスカラー）
	 * @returns atan2 適用後の行列
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	atan2(x: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 各要素の双曲線正弦（sinh）を計算する
	 * @returns sinh 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦（cosh）を計算する
	 * @returns cosh 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接（tanh）を計算する
	 * @returns tanh 適用後の行列
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦を計算する
	 * @returns asinh を適用した行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦（acosh）を計算する
	 * @returns acosh 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接（atanh）を計算する
	 * @returns atanh 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数（exp）を計算する
	 * @returns exp 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	exp(): this;
	/**
	 * 各要素の 2 のべき乗を計算する
	 * @returns exp2 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 */
	exp2(): this;
	/**
	 * 各要素の exp(x) - 1 を計算する
	 * @returns expm1 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数（ln）を計算する
	 * @returns ln 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 */
	ln(): this;
	/**
	 * 各要素の任意の底の対数を計算する
	 * @param base - 対数の底（行列またはスカラー）
	 * @returns 対数計算後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	log(base: BigFloatInputValue | BigFloatAnyMatrixLike): this;
	/**
	 * 各要素の 2 を底とする対数を計算する
	 * @returns log2 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	log2(): this;
	/**
	 * 各要素の 10 を底とする対数を計算する
	 * @returns log10 適用後の行列
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	log10(): this;
	/**
	 * 各要素の ln(1 + x) を計算する
	 * @returns log1p 適用後の行列
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	log1p(): this;
	/**
	 * 各要素のガンマ関数を計算する
	 * @returns ガンマ関数を適用した行列
	 * @throws {TypeError} 実数でない複素数が含まれる場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	gamma(): this;
	/**
	 * 各要素のゼータ関数を計算する
	 * @returns ゼータ関数を適用した行列
	 * @throws {TypeError} 実数でない複素数が含まれる場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 */
	zeta(): this;
	/**
	 * 各要素の階乗を計算する
	 * @returns 階乗適用後の行列
	 * @throws {TypeError} 実数でない複素数が含まれる場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	factorial(): this;
	/**
	 * 行列のランクを計算する
	 * @returns ランク
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	rank(): number;
}
/** 丸めモード */
export declare enum RoundingMode {
	/** 0に近い方向に切り捨て */
	TRUNCATE = 0,
	/** 絶対値が小さい方向に切り捨て（TRUNCATEと同じ） */
	DOWN = 0,
	/** 絶対値が大きい方向に切り上げ */
	UP = 1,
	/** 正の無限大方向に切り上げ */
	CEIL = 2,
	/** 負の無限大方向に切り捨て */
	FLOOR = 3,
	/** 四捨五入 */
	HALF_UP = 4,
	/** 五捨六入（5未満切り捨て） */
	HALF_DOWN = 5
}
/** BigFloat の特別な値の状態 */
export declare enum SpecialValueState {
	/** 有限の値 */
	FINITE = 0,
	/** 正の無限大 */
	POSITIVE_INFINITY = 1,
	/** 負の無限大 */
	NEGATIVE_INFINITY = 2,
	/** 非数 (NaN) */
	NAN = 3
}
/** BigFloat 構成オプション */
export interface BigFloatOptions {
	/** 精度の不一致を許容するかどうか */
	allowPrecisionMismatch?: boolean;
	/** BigFloatComplex との相互運用を許容するかどうか */
	allowComplexNumbers?: boolean;
	/** 破壊的な計算(自身の上書き)をするかどうか */
	mutateResult?: boolean;
	/** Infinity/NaN の特殊値を許容するかどうか */
	allowSpecialValues?: boolean;
	/** 丸めモード */
	roundingMode?: RoundingMode;
	/** 計算時に追加する精度 */
	extraPrecision?: bigint;
	/** 三角関数の最大ステップ数 */
	trigFuncsMaxSteps?: bigint;
	/** 対数計算の最大ステップ数 */
	lnMaxSteps?: bigint;
}
/** 精度を表す値 */
export type PrecisionValue = number | bigint;
/** BigFloatに変換可能な値 */
export type BigFloatValue = BigFloat | number | string | bigint;
/** BigFloat の可変引数または単一配列引数 */
export type BigFloatAggregateArgs = BigFloatValue[] | [
	readonly BigFloatValue[]
];
/** BigFloat または BigFloatComplex のインスタンス */
export type BigFloatLike = BigFloat | BigFloatComplex;
/** BigFloatとBigFloatComplexで共通利用可能で変換可能な値 */
export type BigFloatInputValue = BigFloatValue | BigFloatComplex;
/** BigFloatVector に変換可能な型 */
export type BigFloatVectorLike = BigFloatVector | Iterable<BigFloatValue>;
/** BigFloatComplexVector に変換可能な型 */
export type BigFloatComplexVectorLike = BigFloatComplexVector | Iterable<BigFloatComplex>;
/** BigFloatVector または BigFloatComplexVector のインスタンス */
export type BigFloatAnyVector = BigFloatVector | BigFloatComplexVector;
/** BigFloatAnyVector に変換可能な型 */
export type BigFloatAnyVectorLike = BigFloatVectorLike | BigFloatComplexVectorLike | Iterable<BigFloatInputValue>;
/** BigFloatMatrix に変換可能な型 */
export type BigFloatMatrixLike = BigFloatMatrix | Iterable<BigFloatVectorLike>;
/** BigFloatComplexMatrix に変換可能な型 */
export type BigFloatComplexMatrixLike = BigFloatComplexMatrix | Iterable<BigFloatComplexVectorLike>;
/** BigFloatMatrix または BigFloatComplexMatrix のインスタンス */
export type BigFloatAnyMatrix = BigFloatMatrix | BigFloatComplexMatrix;
/** BigFloatAnyMatrix に変換可能な型 */
export type BigFloatAnyMatrixLike = BigFloatMatrixLike | BigFloatComplexMatrixLike;
export type BigFloatIterator = Iterator<BigFloatLike, void, undefined>;
export type BigFloatStreamFactory = () => BigFloatIterator;
export type BigFloatStreamStageSignal = BigFloatLike | typeof BIGFLOAT_STREAM_SKIP;
export type BigFloatStreamStageContext = {
	pushIterator: (iterator: BigFloatIterator, stageIndex: number) => void;
	stop: () => void;
};
export type BigFloatStreamStageDefinition = {
	createState: (data: unknown) => unknown;
	process: (value: BigFloatLike, state: unknown, data: unknown, context: BigFloatStreamStageContext, nextStageIndex: number) => BigFloatStreamStageSignal;
};
export type BigFloatStreamStage = {
	definition: BigFloatStreamStageDefinition;
	data: unknown;
};
export type BigFloatStreamRandomOptions = {
	min?: BigFloatInputValue;
	max?: BigFloatInputValue;
	precision?: PrecisionValue;
};
declare const BIGFLOAT_STREAM_SKIP: unique symbol;
/**
 * BigFloat 用の遅延評価ストリーム（遅延リスト）クラス
 */
export declare class BigFloatStream implements Iterable<BigFloatLike> {
	/** mapステージ定義 */
	private static readonly _mapStageDefinition;
	/** filterステージ定義 */
	private static readonly _filterStageDefinition;
	/** peekステージ定義 */
	private static readonly _peekStageDefinition;
	/** flatMapステージ定義 */
	private static readonly _flatMapStageDefinition;
	/** distinctステージ定義 */
	private static readonly _distinctStageDefinition;
	/** limitステージ定義 */
	private static readonly _limitStageDefinition;
	/** skipステージ定義 */
	private static readonly _skipStageDefinition;
	/** 内部イテレータファクトリ */
	private _sourceFactory;
	/** パイプラインにおける直前のストリーム */
	private _previousStream;
	/** このストリームが表すステージの定義 */
	private _stageDefinition;
	/** ステージに渡される固定データ (コールバック関数など) */
	private _stageData;
	/**
	 * BigFloatStream コンストラクタ
	 * @param source - 要素の反復可能オブジェクト、またはイテレータを生成する関数
	 * @returns BigFloatStream インスタンス
	 */
	constructor(source: Iterable<BigFloatLike> | BigFloatStreamFactory);
	/**
	 * 内部状態からストリームを生成する (内部用)
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns 生成されたストリーム
	 */
	protected static _fromState(sourceFactory: BigFloatStreamFactory, previousStream: BigFloatStream | null, stageDefinition: BigFloatStreamStageDefinition | null, stageData: unknown): BigFloatStream;
	/**
	 * ストリーム値を BigFloat または BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された値
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toItem(value: BigFloatInputValue, precision?: bigint): BigFloatLike;
	/**
	 * 反復可能オブジェクトを BigFloatLike のイテレータへ変換する (内部用)
	 * @param iterable - 変換対象
	 * @param precision - 精度
	 * @returns BigFloatLike のイテレータ
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toIterator(iterable: Iterable<BigFloatInputValue>, precision?: bigint): IterableIterator<BigFloatLike, void, undefined>;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint;
	/**
	 * 要素数を非負の整数に正規化する (内部用)
	 * @param count - 要素数
	 * @returns 正規化された要素数
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 */
	protected static _normalizeCount(count: number): number;
	/**
	 * 空のストリームを生成する
	 * @returns 空の BigFloatStream
	 */
	static empty(): BigFloatStream;
	/**
	 * 反復可能オブジェクトからストリームを作成する
	 * @param iterable - 要素のソース
	 * @param precision - 変換時の精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static from(iterable: Iterable<BigFloatInputValue>, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 引数のリストからストリームを作成する
	 * @param values - 要素のリスト
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static of(...values: BigFloatInputValue[]): BigFloatStream;
	/**
	 * 等差数列のストリームを生成する
	 * @param start - 初項
	 * @param step - 公差
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static arithmetic(start: BigFloatInputValue, step: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 等比数列のストリームを生成する
	 * @param start - 初項
	 * @param ratio - 公比
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static geometric(start: BigFloatInputValue, ratio: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 指定した範囲を等分割する数値ストリームを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static linspace(start: BigFloatInputValue, end: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 10 を底とする対数スケールで等間隔な数値ストリームを生成する
	 * @param start - 開始指数
	 * @param end - 終了指数
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	static logspace(start: BigFloatInputValue, end: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 調和級数 (1/1, 1/2, 1/3, ...) のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static harmonic(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 乱数ストリームを生成する
	 * @param count - 要素数
	 * @param options - 乱数範囲と精度のオプション
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 最大値が最小値より小さい場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static random(count: number, options?: BigFloatStreamRandomOptions): BigFloatStream;
	/**
	 * 指定された値を繰り返すストリームを生成する
	 * @param value - 繰り返す値
	 * @param count - 回数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 */
	static repeat(value: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * フィボナッチ数列のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static fibonacci(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 階乗数列 (1!, 2!, 3!, ...) のストリームを生成する
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 有限の数値でない場合、または負の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static factorial(count: number, precision?: PrecisionValue): BigFloatStream;
	/**
	 * 数値の範囲を指定してストリームを生成する
	 * @param start - 開始値 (end 省略時は 0 からこの値まで)
	 * @param end - 終了値 (この値は含まない)
	 * @param step - 増分
	 * @param precision - 精度
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} step が 0 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static range(start: BigFloatInputValue, end?: BigFloatInputValue, step?: BigFloatInputValue, precision?: PrecisionValue): BigFloatStream;
	/**
	 * ストリームを複製する
	 * @returns 複製された BigFloatStream
	 */
	clone(): BigFloatStream;
	/**
	 * 現在の状態をフォークして新しいストリームを生成する (内部用)
	 * @param sourceFactory - ソースファクトリ
	 * @param previousStream - 直前のストリーム
	 * @param stageDefinition - ステージ定義
	 * @param stageData - ステージデータ
	 * @returns 新しいストリーム
	 */
	protected _fork(sourceFactory?: BigFloatStreamFactory, previousStream?: BigFloatStream | null, stageDefinition?: BigFloatStreamStageDefinition | null, stageData?: unknown): this;
	/**
	 * パイプラインに新しいステージを追加する (内部用)
	 * @param stage - 追加するステージ
	 * @returns 新しいストリーム
	 */
	protected _use(stage: BigFloatStreamStage): this;
	/**
	 * 現在のストリームからルートまで遡り、全パイプラインステージを収集する (内部用)
	 * @returns ステージの配列
	 */
	protected _collectPipelineStages(): BigFloatStreamStage[];
	/**
	 * 各要素を変換関数で写像する
	 * @param fn - 変換関数
	 * @returns 写像後のストリーム
	 */
	map(fn: (item: BigFloatLike) => BigFloatLike): this;
	/**
	 * 条件を満たす要素のみを通過させる
	 * @param fn - フィルタリング関数
	 * @returns フィルタリング後のストリーム
	 */
	filter(fn: (item: BigFloatLike) => boolean): this;
	/**
	 * 各要素を複数の要素に展開して平坦化する
	 * @param fn - 要素を反復可能オブジェクトへ変換する関数
	 * @returns 平坦化後のストリーム
	 */
	flatMap(fn: (item: BigFloatLike) => Iterable<BigFloatInputValue>): this;
	/**
	 * 要素の重複を除去する
	 * @param keyFn - 一致判定に使うキーを生成する関数 (デフォルトは toString)
	 * @returns 重複除去後のストリーム
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 */
	distinct(keyFn?: (item: BigFloatLike) => unknown): this;
	/**
	 * 要素をソートする (注意: この操作は全要素をメモリ上に展開します)
	 * @param compareFn - 比較関数
	 * @returns ソート後のストリーム
	 * @throws {TypeError} 複素数と比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 */
	sorted(compareFn?: (a: BigFloatLike, b: BigFloatLike) => number): this;
	/**
	 * 各要素に対して副作用のある処理を実行する (デバッグやロギング用)
	 * @param fn - 要素を受け取る関数
	 * @returns 自身
	 */
	peek(fn: (item: BigFloatLike) => void): this;
	/**
	 * peek の別名。各要素に対して副作用のある処理を実行する
	 * @param fn - 要素を受け取る関数
	 * @returns 自身
	 */
	tap(fn: (item: BigFloatLike) => void): this;
	/**
	 * 要素数を最大 n 個に制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	limit(n: number): this;
	/**
	 * limit の別名。要素数を最大 n 個に制限する
	 * @param n - 最大要素数
	 * @returns 制限されたストリーム
	 */
	take(n: number): this;
	/**
	 * 先頭の n 個の要素を読み飛ばす
	 * @param n - スキップする数
	 * @returns スキップ後のストリーム
	 */
	skip(n: number): this;
	/**
	 * skip の別名。先頭の n 個の要素を読み飛ばす
	 * @param n - スキップする数
	 * @returns スキップ後のストリーム
	 */
	drop(n: number): this;
	/**
	 * 末尾に別の反復可能オブジェクトの内容を連結する
	 * @param iterables - 連結する対象
	 * @returns 連結後のストリーム
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	concat(...iterables: Iterable<BigFloatInputValue>[]): this;
	/**
	 * ストリームを反復するためのイテレータを取得する
	 * @returns 要素のイテレータ
	 */
	[Symbol.iterator](): BigFloatIterator;
	/**
	 * ストリームの各要素に対して関数を実行する (終端操作)
	 * @param fn - 実行する関数
	 */
	forEach(fn: (item: BigFloatLike) => void): void;
	/**
	 * ストリームの全要素を収集して配列として返す (終端操作)
	 * @returns 要素の配列
	 */
	toArray(): BigFloatLike[];
	/**
	 * toArray の別名。ストリームの全要素を収集して配列として返す (終端操作)
	 * @returns 要素の配列
	 */
	collect(): BigFloatLike[];
	/**
	 * 全要素を累積して単一の値を計算する (終端操作)
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積結果
	 */
	reduce<U>(fn: (acc: U, item: BigFloatLike) => U, initial: U): U;
	/**
	 * ストリームに含まれる要素数を数える (終端操作)
	 * @returns 要素数
	 */
	count(): number;
	/**
	 * ストリームに要素が含まれていないかどうかを判定する (終端操作)
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	some(fn: (item: BigFloatLike) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすかどうかを判定する (終端操作)
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	every(fn: (item: BigFloatLike) => boolean): boolean;
	/**
	 * 条件を満たす最初の要素を返す (終端操作)
	 * @param fn - 判定関数
	 * @returns 最初に見つかった要素、見つからない場合は undefined
	 */
	find(fn: (item: BigFloatLike) => boolean): BigFloatLike | undefined;
	/**
	 * ストリームの最初の要素を取得する (終端操作)
	 * @returns 最初の要素、ストリームが空なら undefined
	 */
	findFirst(): BigFloatLike | undefined;
	/**
	 * findFirst の別名。ストリームの最初の要素を取得する
	 * @returns 最初の要素
	 */
	first(): BigFloatLike | undefined;
	/**
	 * 指定されたインデックスの要素を取得する (終端操作)
	 * @param index - 0 から始まるインデックス
	 * @returns 指定位置の要素、インデックスが範囲外なら undefined
	 */
	at(index: number): BigFloatLike | undefined;
	/**
	 * すべての要素の精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいストリーム
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * 各要素と別の値との相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差を各要素に持つストリーム
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	relativeDiff(other: BigFloatInputValue): this;
	/**
	 * 各要素と別の値との絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差を各要素に持つストリーム
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	absoluteDiff(other: BigFloatInputValue): this;
	/**
	 * 各要素と別の値との百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分を各要素に持つストリーム (%)
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	percentDiff(other: BigFloatInputValue): this;
	/**
	 * 各要素に別の値を加算する
	 * @param other - 加算する数値
	 * @returns 加算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	add(other: BigFloatInputValue): this;
	/**
	 * 各要素から別の値を減算する
	 * @param other - 減算する数値
	 * @returns 減算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sub(other: BigFloatInputValue): this;
	/**
	 * 各要素に別の値を乗算する
	 * @param other - 乗算する数値
	 * @returns 乗算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	mul(other: BigFloatInputValue): this;
	/**
	 * 各要素を別の値で除算する
	 * @param other - 除数
	 * @returns 除算後のストリーム
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	div(other: BigFloatInputValue): this;
	/**
	 * 各要素に対して剰余演算を行う
	 * @param other - 法
	 * @returns 剰余後のストリーム
	 * @throws {TypeError} BigFloat.mod does not support BigFloatComplex operands
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	mod(other: BigFloatInputValue): this;
	/**
	 * 各要素の符号を反転させる
	 * @returns 符号反転後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	neg(): this;
	/**
	 * 各要素を絶対値にする
	 * @returns 絶対値適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	abs(): this;
	/**
	 * 各要素の符号 (1, 0, -1) を取得する
	 * @returns 符号値を持つストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	sign(): this;
	/**
	 * 各要素の逆数を取得する
	 * @returns 逆数を持つストリーム
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	reciprocal(): this;
	/**
	 * 各要素を指定した指数で冪乗する
	 * @param exponent - 指数
	 * @returns 冪乗後のストリーム
	 * @throws {RangeError} 負の数の非整数乗が実数にならない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	pow(exponent: BigFloatValue): this;
	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根適用後のストリーム
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	cbrt(): this;
	/**
	 * 各要素の n 乗根を計算する
	 * @param n - 指数
	 * @returns n 乗根適用後のストリーム
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理する
	 * @returns 床関数適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	floor(): this;
	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理する
	 * @returns 天井関数適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	round(): this;
	/**
	 * 各要素を 0 方向に切り捨てる
	 * @returns 切り捨て後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	trunc(): this;
	/**
	 * 各要素を Float32 精度に丸める
	 * @returns 丸め後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	fround(): this;
	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数える
	 * @returns 結果のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	clz32(): this;
	/**
	 * 各要素の正弦 (sin) を計算する
	 * @returns sin 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	sin(): this;
	/**
	 * 各要素の余弦 (cos) を計算する
	 * @returns cos 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	cos(): this;
	/**
	 * 各要素の正接 (tan) を計算する
	 * @returns tan 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦 (asin) を計算する
	 * @returns asin 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦 (acos) を計算する
	 * @returns acos 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	acos(): this;
	/**
	 * 各要素の逆正接 (atan) を計算する
	 * @returns atan 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atan(): this;
	/**
	 * 各要素に対して atan2 を計算する
	 * @param x - x 座標
	 * @returns atan2 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atan2(x: BigFloatValue): this;
	/**
	 * 各要素の双曲線正弦 (sinh) を計算する
	 * @returns sinh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦 (cosh) を計算する
	 * @returns cosh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接 (tanh) を計算する
	 * @returns tanh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算する
	 * @returns asinh 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算する
	 * @returns acosh 適用後のストリーム
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接 (atanh) を計算する
	 * @returns atanh 適用後のストリーム
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数 (exp) を計算する
	 * @returns exp 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	exp(): this;
	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算する
	 * @returns exp2 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数の場合
	 */
	exp2(): this;
	/**
	 * 各要素に対して exp(x) - 1 を計算する
	 * @returns expm1 適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数 (ln) を計算する
	 * @returns ln 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	ln(): this;
	/**
	 * 各要素の任意の底による対数を計算する
	 * @param base - 底
	 * @returns 対数計算後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	log(base: BigFloatValue): this;
	/**
	 * 各要素の底を 2 とする対数を計算する
	 * @returns log2 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	log2(): this;
	/**
	 * 各要素の常用対数 (log10) を計算する
	 * @returns log10 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	log10(): this;
	/**
	 * 各要素に対して ln(1 + x) を計算する
	 * @returns log1p 適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	log1p(): this;
	/**
	 * 各要素に対してガンマ関数を計算する
	 * @returns ガンマ関数適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数の場合
	 */
	gamma(): this;
	/**
	 * 各要素に対してリーマンゼータ関数を計算する
	 * @returns ゼータ関数適用後のストリーム
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数の場合
	 */
	zeta(): this;
	/**
	 * 各要素に対して階乗を計算する
	 * @returns 階乗適用後のストリーム
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数の場合
	 */
	factorial(): this;
	/**
	 * ストリームの要素の中から最大値を返す (終端操作)
	 * @returns 最大値
	 * @throws {TypeError} ストリームが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	max(): BigFloatLike;
	/**
	 * ストリームの要素の中から最小値を返す (終端操作)
	 * @returns 最小値
	 * @throws {TypeError} ストリームが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	min(): BigFloatLike;
	/**
	 * ストリームの全要素の合計を計算する (終端操作)
	 * @returns 合計
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sum(): BigFloatLike;
	/**
	 * ストリームの全要素の積を計算する (終端操作)
	 * @returns 総乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	product(): BigFloatLike;
	/**
	 * ストリームの全要素の平均値を計算する (終端操作)
	 * @returns 平均値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	average(): BigFloatLike;
	/**
	 * ストリームの要素の中央値を計算する (終端操作)
	 * @returns 中央値
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	median(): BigFloatLike;
	/**
	 * ストリームの要素の分散を計算する (終端操作)
	 * @returns 分散
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	variance(): BigFloatLike;
	/**
	 * ストリームの要素の標準偏差を計算する (終端操作)
	 * @returns 標準偏差
	 * @throws {TypeError} 引数が空の場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	stddev(): BigFloatLike;
}
export type BigFloatComplexVectorRandomOptions = {
	min?: BigFloatInputValue;
	max?: BigFloatInputValue;
	precision?: PrecisionValue;
};
/**
 * BigFloatComplex を要素とする固定長ベクトルクラス
 */
export declare class BigFloatComplexVector implements Iterable<BigFloatComplex> {
	/** 内部要素 (BigFloatComplex の配列) */
	_values: BigFloatComplex[];
	/**
	 * BigFloatComplexVector コンストラクタ
	 * @param values - 要素のソース
	 * @param precision - 精度
	 * @returns BigFloatComplexVector インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	constructor(values?: BigFloatAnyVectorLike, precision?: PrecisionValue);
	/**
	 * 内部配列からベクトルを生成する (内部用)
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatComplexVector
	 */
	protected static _fromComplexArray(values: BigFloatComplex[]): BigFloatComplexVector;
	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toComplex(value: BigFloatInputValue, precision?: bigint): BigFloatComplex;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値列
	 * @param precision - 明示精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint;
	/**
	 * 次元一致を検証する
	 * @throws {RangeError} 次元が一致しない場合
	 */
	protected static _assertSameLength(left: BigFloatAnyVector, right: BigFloatAnyVector): void;
	/**
	 * 任意入力を BigFloatComplexVector へ変換する (内部用)
	 * @param value - オペランド
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatComplexVector
	 */
	protected static _coerceVector(value: BigFloatAnyVectorLike, referenceValues?: BigFloatInputValue[]): BigFloatComplexVector;
	/**
	 * 各要素に対して変換関数を適用した新しいベクトルを返す (内部用)
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapValues(fn: (value: BigFloatComplex, index: number) => BigFloatInputValue): this;
	/**
	 * オペランドとの二項演算を各要素に対して行う (内部用)
	 * @param other - ベクトルまたはスカラ値
	 * @param fn - 二項演算関数
	 * @returns 演算後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapWithOperand(other: BigFloatAnyVectorLike | BigFloatInputValue, fn: (left: BigFloatComplex, right: BigFloatComplex, index: number) => BigFloatInputValue): this;
	/**
	 * 空のベクトル (次元 0) を生成する
	 * @returns 空のベクトル
	 */
	static empty(): BigFloatComplexVector;
	/**
	 * 要素の反復可能オブジェクトから BigFloatComplexVector を生成する
	 * @param values - 要素のソース
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 */
	static from(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatComplexVector;
	/**
	 * BigFloatStream からベクトルを生成する
	 * @param stream - 要素のストリーム
	 * @returns 生成されたベクトル
	 */
	static fromStream(stream: BigFloatStream): BigFloatComplexVector;
	/**
	 * 引数リストからベクトルを生成する
	 * @param values - 要素のリスト
	 * @returns 生成されたベクトル
	 */
	static of(...values: BigFloatInputValue[]): BigFloatComplexVector;
	/**
	 * 指定された値で埋められたベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static fill(length: number, value: BigFloatInputValue, precision?: PrecisionValue): BigFloatComplexVector;
	/**
	 * 零ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns 生成された零ベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static zeros(length: number, precision?: PrecisionValue): BigFloatComplexVector;
	/**
	 * すべての要素が 1 のベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static ones(length: number, precision?: PrecisionValue): BigFloatComplexVector;
	/**
	 * 標準基底ベクトルを取得する
	 * @param length - ベクトルの長さ
	 * @param index - 基底のインデックス
	 * @param precision - 精度
	 * @returns 標準基底ベクトル
	 * @throws {RangeError} インデックスが範囲外の場合
	 */
	static basis(length: number, index: number, precision?: PrecisionValue): BigFloatComplexVector;
	/**
	 * 指定した範囲を等分割する数値ベクトルを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 分割数
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	static linspace(start: BigFloatInputValue, end: BigFloatInputValue, count: number, precision?: PrecisionValue): BigFloatComplexVector;
	/**
	 * 乱数ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param options - 乱数生成オプション
	 * @returns 生成された乱数ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合、または対象に特殊値が含まれる場合
	 */
	static random(length: number, options?: BigFloatComplexVectorRandomOptions): BigFloatComplexVector;
	/**
	 * ベクトルの長さ（要素数）
	 */
	get length(): number;
	/**
	 * ベクトルの次元数を取得する
	 * @returns 次元数 (length と同じ)
	 */
	dimension(): number;
	/**
	 * ベクトルが空であるか判定する
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 指定したインデックスの要素を取得する
	 * @param index - インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	at(index: number): BigFloatComplex | undefined;
	/**
	 * ベクトルを複製する
	 * @returns 複製された BigFloatComplexVector
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	clone(): BigFloatComplexVector;
	/**
	 * 配列に変換する
	 * @returns BigFloatComplex の配列
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	toArray(): BigFloatComplex[];
	/**
	 * 要素を流すストリームへ変換する
	 * @returns 要素のストリーム
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	toStream(): BigFloatStream;
	/**
	 * ベクトルのイテレータを取得する
	 * @returns 要素のイテレータ
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	[Symbol.iterator](): Iterator<BigFloatComplex, void, undefined>;
	/**
	 * 各要素に対して処理を実行する
	 * @param fn - 実行する関数
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	forEach(fn: (value: BigFloatComplex, index: number) => void): void;
	/**
	 * 各要素に関数を適用して新しいベクトルを生成する
	 * @param fn - 適用する関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	map(fn: (value: BigFloatComplex, index: number) => BigFloatInputValue): this;
	/**
	 * 二つのベクトルの各要素に対して関数を適用し、新しいベクトルを生成する
	 * @param other - 比較対象のベクトル
	 * @param fn - 適用する関数
	 * @returns 演算結果のベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	zipMap(other: BigFloatAnyVectorLike, fn: (left: BigFloatComplex, right: BigFloatComplex, index: number) => BigFloatInputValue): this;
	/**
	 * 各要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	reduce<U>(fn: (acc: U, value: BigFloatComplex, index: number) => U, initial: U): U;
	/**
	 * いずれかの要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	some(fn: (value: BigFloatComplex, index: number) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすか判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	every(fn: (value: BigFloatComplex, index: number) => boolean): boolean;
	/**
	 * ベクトルを連結する
	 * @param others - 連結するベクトル
	 * @returns 連結後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	concat(...others: BigFloatAnyVectorLike[]): this;
	/**
	 * 指定した範囲の要素を抽出する
	 * @param start - 開始インデックス
	 * @param end - 終了インデックス
	 * @returns 抽出された新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	slice(start?: number, end?: number): this;
	/**
	 * 要素の順序を反転させる
	 * @returns 反転した新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	reverse(): this;
	/**
	 * ベクトルの精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * ベクトルが等しいか判定する
	 * @param other - 比較対象のベクトル
	 * @returns 等しい場合は true
	 * @throws {TypeError} 複素数と比較しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 */
	equals(other: BigFloatAnyVectorLike): boolean;
	/**
	 * ベクトルの加算を行う
	 * @param other - 加算するベクトルまたはスカラ
	 * @returns 加算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	add(other: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * ベクトルの減算を行う
	 * @param other - 減算するベクトルまたはスカラ
	 * @returns 減算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	sub(other: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * スカラー倍を行う
	 * @param scalar - 乗算するスカラー
	 * @returns 乗算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	mul(scalar: BigFloatInputValue): this;
	/**
	 * スカラー除算を行う
	 * @param scalar - 除算するスカラー
	 * @returns 除算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	div(scalar: BigFloatInputValue): this;
	/**
	 * 各要素の剰余を計算する
	 * @param other - 除数（ベクトルまたはスカラ）
	 * @returns 演算後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 虚部が 0 でない場合
	 */
	mod(other: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * アダマール積（要素ごとの積）を計算する
	 * @param other - 乗算するベクトル
	 * @returns Hadamard積の結果のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	hadamard(other: BigFloatAnyVectorLike): this;
	/**
	 * 各要素の符号を反転する
	 * @returns 符号反転後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	neg(): this;
	/**
	 * 各要素の絶対値を計算する
	 * @returns 絶対値適用後の新しい実数ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	abs(): BigFloatVector;
	/**
	 * 各要素の符号を計算する
	 * @returns 符号ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	sign(): this;
	/**
	 * 各要素の逆数を計算する
	 * @returns 逆数ベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 */
	reciprocal(): this;
	/**
	 * 各要素のべき乗を計算する
	 * @param exponent - 指数（ベクトルまたはスカラ）
	 * @returns 冪乗後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	pow(exponent: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * 各要素の平方根を計算する
	 * @returns 平方根適用後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算する
	 * @returns 立方根適用後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	cbrt(): this;
	/**
	 * 各要素の n 乗根を計算する
	 * @param n - 次数
	 * @returns n 乗根適用後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} n が正の整数でない場合
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素の床関数を計算する
	 * @returns 床関数適用後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	floor(): this;
	/**
	 * 各要素の天井関数を計算する
	 * @returns 天井関数適用後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入する
	 * @returns 四捨五入後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	round(): this;
	/**
	 * 各要素を切り捨てる
	 * @returns 切り捨て後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	trunc(): this;
	/**
	 * 各要素を最も近い単精度浮動小数点数形式に丸める
	 * @returns 丸め後の新しいベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	fround(): this;
	/**
	 * 各要素の 32 ビット整数としての先頭のゼロの個数を計算する
	 * @returns 結果のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	clz32(): this;
	/**
	 * 各要素の相対差を計算する
	 * @param other - 比較対象（ベクトルまたはスカラ）
	 * @returns 相対差のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	relativeDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * 各要素の絶対差を計算する
	 * @param other - 比較対象（ベクトルまたはスカラ）
	 * @returns 絶対差のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	absoluteDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * 各要素の百分率差分を計算する
	 * @param other - 比較対象（ベクトルまたはスカラ）
	 * @returns 百分率差分のベクトル (%)
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	percentDiff(other: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * 各要素の正弦（sin）を計算する
	 * @returns sin 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	sin(): this;
	/**
	 * 各要素の余弦（cos）を計算する
	 * @returns cos 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	cos(): this;
	/**
	 * 各要素の正接（tan）を計算する
	 * @returns tan 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦（asin）を計算する
	 * @returns asin 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦（acos）を計算する
	 * @returns acos 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	acos(): this;
	/**
	 * 各要素の逆正接（atan）を計算する
	 * @returns atan 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	atan(): this;
	/**
	 * 各要素の双曲線正弦（sinh）を計算する
	 * @returns sinh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦（cosh）を計算する
	 * @returns cosh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接（tanh）を計算する
	 * @returns tanh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦（asinh）を計算する
	 * @returns asinh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦（acosh）を計算する
	 * @returns acosh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接（atanh）を計算する
	 * @returns atanh 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数（exp）を計算する
	 * @returns exp 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	exp(): this;
	/**
	 * 各要素の exp(x) - 1 を計算する
	 * @returns expm1 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数（ln）を計算する
	 * @returns ln 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	ln(): this;
	/**
	 * 各要素の任意の底の対数を計算する
	 * @param base - 対数の底（ベクトルまたはスカラ）
	 * @returns 対数計算後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	log(base: BigFloatInputValue | BigFloatAnyVectorLike): this;
	/**
	 * 各要素の 2 を底とする対数を計算する
	 * @returns log2 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	log2(): this;
	/**
	 * 各要素の 10 を底とする対数を計算する
	 * @returns log10 適用後のベクトル
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	log10(): this;
	/**
	 * 最大値を取得する（複素数では未サポート）
	 * @returns 最大値
	 * @throws {TypeError} 複素数ベクトルではサポートされていないため
	 */
	max(): BigFloatComplex;
	/**
	 * 最小値を取得する（複素数では未サポート）
	 * @returns 最小値
	 * @throws {TypeError} 複素数ベクトルではサポートされていないため
	 */
	min(): BigFloatComplex;
	/**
	 * 要素の合計を計算する
	 * @returns 合計値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	sum(): BigFloatComplex;
	/**
	 * 要素の総乗を計算する
	 * @returns 総乗の値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	product(): BigFloatComplex;
	/**
	 * 要素の平均を計算する
	 * @returns 平均値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	average(): BigFloatComplex;
	/**
	 * 他のベクトルとの内積を計算する
	 * @param other - 対象のベクトル
	 * @returns 内積の値
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	dot(other: BigFloatAnyVectorLike): BigFloatComplex;
	/**
	 * 二乗ノルムを計算する
	 * @returns 二乗ノルム
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	squaredNorm(): BigFloat;
	/**
	 * ノルム（ベクトルの長さ）を計算する
	 * @returns ノルム
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	norm(): BigFloat;
	/**
	 * ベクトルを正規化する
	 * @returns 正規化されたベクトル
	 * @throws {RangeError} ゼロベクトルを正規化しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	normalize(): this;
	/**
	 * 他のベクトルとの距離を計算する
	 * @param other - 対象のベクトル
	 * @returns 距離
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	distanceTo(other: BigFloatAnyVectorLike): BigFloat;
	/**
	 * 外積を計算する
	 * @param other - 相手のベクトル
	 * @returns 外積の結果
	 * @throws {RangeError} 3次元ベクトルでない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	cross(other: BigFloatAnyVectorLike): this;
	/**
	 * 他のベクトルとの二乗距離を計算する
	 * @param other - 対象のベクトル
	 * @returns 二乗距離
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	squaredDistanceTo(other: BigFloatAnyVectorLike): BigFloat;
	/**
	 * 別のベクトルへの正射影ベクトルを計算する
	 * @param other - 射影先のベクトル
	 * @returns 射影された新しいベクトル
	 * @throws {RangeError} ゼロベクトルに射影しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	projectOnto(other: BigFloatAnyVectorLike): this;
}
export type BigFloatVectorRandomOptions = {
	min?: BigFloatValue;
	max?: BigFloatValue;
	precision?: PrecisionValue;
};
/**
 * BigFloat を固定長ベクトルとして扱うクラス
 * @throws {RangeError} 例外が発生した場合
 */
export declare class BigFloatVector implements Iterable<BigFloat> {
	/** 内部要素 (BigFloat の配列) */
	_values: BigFloat[];
	/**
	 * BigFloatVector コンストラクタ
	 * @param values - 要素のソース (反復可能オブジェクト)
	 * @param precision - 変換時の精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	constructor(values?: BigFloatAnyVectorLike, precision?: PrecisionValue);
	/**
	 * 内部配列からベクトルを生成する (内部用)
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatVector
	 */
	protected static _fromBigFloatArray(values: BigFloat[]): BigFloatVector;
	/**
	 * @param values - 内部所有済みの要素列
	 * @returns 生成された BigFloatComplexVector
	 * @overload
	 */
	protected static _fromBigFloatArray(values: BigFloatLike[]): BigFloatComplexVector;
	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 明示精度
	 * @returns 変換された BigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toBigFloat(value: BigFloatValue, precision?: bigint): BigFloat;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値列
	 * @param precision - 明示精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint;
	/**
	 * ベクトルの長さを非負の整数に正規化する (内部用)
	 * @param length - ベクトル長
	 * @returns 正規化されたベクトル長
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	protected static _normalizeLength(length: number): number;
	/**
	 * 次元一致を検証する
	 * @param left - 左辺
	 * @param right - 右辺
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	protected static _assertSameLength(left: BigFloatAnyVector, right: BigFloatAnyVector): void;
	/**
	 * 任意入力を BigFloatVector へ変換する (内部用)
	 * @param value - ベクトルまたは要素列
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatVector
	 */
	protected static _coerceVector(value: BigFloatVectorLike, referenceValues: BigFloatValue[]): BigFloatVector;
	/**
	 * @param value - ベクトルまたは要素列
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatComplexVector
	 * @overload
	 */
	protected static _coerceVector(value: BigFloatComplexVectorLike, referenceValues: BigFloatInputValue[]): BigFloatComplexVector;
	/**
	 * @param value - ベクトルまたは要素列
	 * @param referenceValues - 精度解決のための参照値リスト
	 * @returns 変換された BigFloatComplexVector
	 * @overload
	 */
	protected static _coerceVector(value: BigFloatAnyVectorLike, referenceValues: BigFloatInputValue[]): BigFloatComplexVector;
	/**
	 * 各要素に対して変換関数を適用した新しいベクトルを返す (内部用)
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _mapValues(fn: (value: BigFloat, index: number) => BigFloatInputValue): this;
	/**
	 * オペランドとの二項演算を各要素に対して行う (内部用)
	 * @param other - ベクトルまたはスカラ値
	 * @param fn - 二項演算関数
	 * @returns 演算後の新しいベクトル
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 * @throws {TypeError} 複素数モードが無効な場合に複素数オペランドが渡された場合、または演算結果が複素数になった場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected _mapWithOperand(other: BigFloatAnyVectorLike | BigFloatInputValue, fn: (left: BigFloatLike, right: BigFloatLike, index: number) => BigFloatInputValue): this | BigFloatAnyVector;
	/**
	 * 空のベクトル (次元 0) を生成する
	 * @returns 空のベクトル
	 */
	static empty(): BigFloatVector;
	/**
	 * 要素の反復可能オブジェクトから BigFloatVector を生成する
	 * @param values - 要素列
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 */
	static from(values: BigFloatVectorLike, precision?: PrecisionValue): BigFloatVector;
	/**
	 * @param values - 要素列
	 * @param precision - 精度
	 * @returns BigFloatAnyVector インスタンス
	 * @overload
	 */
	static from(values: BigFloatAnyVectorLike, precision?: PrecisionValue): BigFloatAnyVector;
	/**
	 * BigFloatStream からベクトルを生成する
	 * @param stream - ソースストリーム
	 * @returns 生成された BigFloatVector
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	static fromStream(stream: BigFloatStream): BigFloatAnyVector;
	/**
	 * 引数リストからベクトルを生成する
	 * @param values - 要素のリスト
	 * @returns BigFloatVector インスタンス
	 * @throws {TypeError} 複素数モードが無効な場合に複素数が含まれる要素列を渡した場合
	 */
	static of(...values: BigFloatValue[]): BigFloatVector;
	/**
	 * 指定された値で埋められたベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param value - 埋める値
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	static fill(length: number, value: BigFloatValue, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 零ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	static zeros(length: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * すべての要素が 1 のベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param precision - 精度
	 * @returns BigFloatVector インスタンス
	 * @throws {RangeError} ベクトル長が有限でない場合、または負の場合
	 */
	static ones(length: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 標準基底ベクトルを取得する (指定インデックスのみ 1 で他は 0)
	 * @param length - ベクトルの長さ
	 * @param index - 1 を配置する位置 (0 から length-1)
	 * @param precision - 精度
	 * @returns 生成されたベクトル
	 * @throws {RangeError} インデックスが範囲外の場合
	 */
	static basis(length: number, index: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 指定した範囲を等分割する数値ベクトルを生成する
	 * @param start - 開始値
	 * @param end - 終了値
	 * @param count - 要素数
	 * @param precision - 精度
	 * @returns 生成された BigFloatVector
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static linspace(start: BigFloatValue, end: BigFloatValue, count: number, precision?: PrecisionValue): BigFloatVector;
	/**
	 * 乱数ベクトルを生成する
	 * @param length - ベクトルの長さ
	 * @param options - 乱数範囲と精度のオプション
	 * @returns 生成された BigFloatVector
	 * @throws {RangeError} 最大値が最小値より小さい場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static random(length: number, options?: BigFloatVectorRandomOptions): BigFloatVector;
	/**
	 * ベクトルの要素数を取得する
	 */
	get length(): number;
	/**
	 * ベクトルの次元数を取得する
	 * @returns 次元数 (length と同じ)
	 */
	dimension(): number;
	/**
	 * ベクトルが空 (次元が 0) かどうかを判定する
	 * @returns 空なら true
	 */
	isEmpty(): boolean;
	/**
	 * 指定したインデックスの要素を取得する (複製)
	 * @param index - インデックス
	 * @returns 要素の値、インデックスが範囲外の場合は undefined
	 */
	at(index: number): BigFloat | undefined;
	/**
	 * ベクトルを複製する
	 * @returns 複製された BigFloatVector
	 */
	clone(): BigFloatVector;
	/**
	 * 要素の配列へ変換する
	 * @returns BigFloat の配列
	 */
	toArray(): BigFloat[];
	/**
	 * 要素を流すストリームへ変換する
	 * @returns BigFloatStream インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	toStream(): BigFloatStream;
	/**
	 * 要素を順に反復するイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/**
	 * 各要素に対して関数を実行する
	 * @param fn - 実行する関数
	 */
	forEach(fn: (value: BigFloat, index: number) => void): void;
	/**
	 * 各要素を変換した新しいベクトルを取得する
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	map(fn: (value: BigFloat, index: number) => BigFloatValue): this;
	/**
	 * 別のベクトルと要素ごとに対になる変換を行い、新しいベクトルを取得する
	 * @param other - 対象ベクトル
	 * @param fn - 変換関数
	 * @returns 変換後の新しいベクトル
	 */
	zipMap(other: BigFloatVectorLike, fn: (left: BigFloatLike, right: BigFloatLike, index: number) => BigFloatValue): this;
	/**
	 * @param other - 対象ベクトル
	 * @param fn - 変換関数
	 * @returns 変換後の新しい複素ベクトル
	 * @overload
	 */
	zipMap(other: BigFloatComplexVectorLike, fn: (left: BigFloatLike, right: BigFloatLike, index: number) => BigFloatInputValue): BigFloatComplexVector;
	/**
	 * 全要素を累積して単一の値を計算する
	 * @param fn - 累積関数
	 * @param initial - 初期値
	 * @returns 累積された結果
	 */
	reduce<U>(fn: (acc: U, value: BigFloat, index: number) => U, initial: U): U;
	/**
	 * 条件を満たす要素が少なくとも一つ存在するかどうかを判定する
	 * @param fn - 判定関数
	 * @returns 条件を満たす要素があれば true
	 */
	some(fn: (value: BigFloat, index: number) => boolean): boolean;
	/**
	 * すべての要素が条件を満たすかどうかを判定する
	 * @param fn - 判定関数
	 * @returns すべての要素が条件を満たせば true
	 */
	every(fn: (value: BigFloat, index: number) => boolean): boolean;
	/**
	 * 別のベクトルまたは要素列を末尾に連結した新しいベクトルを取得する
	 * @param others - 連結する対象
	 * @returns 連結後の新しいベクトル
	 * @throws {TypeError} 複素数モードが無効な場合に複素数ベクトルを連結しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	concat(...others: BigFloatAnyVectorLike[]): BigFloatAnyVector;
	/**
	 * ベクトルの一部を抽出した新しいベクトルを返す
	 * @param start - 開始位置
	 * @param end - 終了位置
	 * @returns 抽出された新しいベクトル
	 */
	slice(start?: number, end?: number): this;
	/**
	 * 要素の並びを反転させた新しいベクトルを取得する
	 * @returns 反転した新しいベクトル
	 */
	reverse(): this;
	/**
	 * すべての要素の精度を変更した新しいベクトルを取得する
	 * @param precision - 新しい精度
	 * @returns 精度が変更された新しいベクトル
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * 別のベクトルと内容が等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	equals(other: BigFloatAnyVectorLike): boolean;
	/**
	 * 各要素に別のベクトルまたはスカラ値を加算した新しいベクトルを取得する
	 * @param other - 加算するベクトルまたは数値
	 * @returns 加算後の新しいベクトル
	 */
	add(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 加算する複素ベクトルまたは複素数
	 * @returns 加算後の新しい複素ベクトル
	 * @overload
	 */
	add(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param other - 加算するベクトルまたは数値
	 * @returns 加算後の新しいベクトル
	 * @overload
	 */
	add(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * 各要素から別のベクトルまたはスカラ値を減算した新しいベクトルを取得する
	 * @param other - 減算するベクトルまたは数値
	 * @returns 減算後の新しいベクトル
	 */
	sub(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 減算する複素ベクトルまたは複素数
	 * @returns 減算後の新しい複素ベクトル
	 * @overload
	 */
	sub(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param other - 減算するベクトルまたは数値
	 * @returns 減算後の新しいベクトル
	 * @overload
	 */
	sub(other: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * 各要素にスカラ値を乗算した新しいベクトルを取得する
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しいベクトル
	 */
	mul(scalar: BigFloatValue): this;
	/**
	 * @param scalar - 乗算する複素数
	 * @returns 乗算後の新しい複素ベクトル
	 * @overload
	 */
	mul(scalar: BigFloatComplex): BigFloatComplexVector;
	/**
	 * @param scalar - 乗算する数値
	 * @returns 乗算後の新しいベクトル
	 * @overload
	 */
	mul(scalar: BigFloatInputValue): this | BigFloatAnyVector;
	/**
	 * 各要素をスカラ値で除算した新しいベクトルを取得する
	 * @param scalar - 除数
	 * @returns 除算後の新しいベクトル
	 */
	div(scalar: BigFloatValue): this;
	/**
	 * @param scalar - 除数(複素数)
	 * @returns 除算後の新しい複素ベクトル
	 * @overload
	 */
	div(scalar: BigFloatComplex): BigFloatComplexVector;
	/**
	 * @param scalar - 除数
	 * @returns 除算後の新しいベクトル
	 * @overload
	 */
	div(scalar: BigFloatInputValue): this | BigFloatAnyVector;
	/**
	 * 各要素に対して剰余演算を行った新しいベクトルを取得する
	 * @param other - 法
	 * @returns 演算後の新しいベクトル
	 * @throws {TypeError} BigFloat.mod does not support BigFloatComplex operands
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	mod(other: BigFloatValue | BigFloatVectorLike): this | BigFloatAnyVector;
	/**
	 * 別のベクトルとのアダマール積 (要素ごとの積) を計算する
	 * @param other - 対象ベクトル
	 * @returns Hadamard積の結果のベクトル
	 */
	hadamard(other: BigFloatVectorLike): this;
	/**
	 * @param other - 対象の複素ベクトル
	 * @returns Hadamard積の結果の複素ベクトル
	 * @overload
	 */
	hadamard(other: BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * 各要素の符号を反転させた新しいベクトルを取得する
	 * @returns 符号反転後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	neg(): this;
	/**
	 * 各要素を絶対値にした新しいベクトルを取得する
	 * @returns 絶対値適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	abs(): this;
	/**
	 * 各要素の符号 (1, 0, -1) を持つベクトルを取得する
	 * @returns 符号ベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	sign(): this;
	/**
	 * 各要素の逆数を持つベクトルを取得する
	 * @returns 逆数ベクトル
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	reciprocal(): this;
	/**
	 * 各要素を指定した指数で冪乗した新しいベクトルを取得する
	 * @param exponent - 指数
	 * @returns 冪乗後の新しいベクトル
	 */
	pow(exponent: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param exponent - 指数(複素数)
	 * @returns 冪乗後の新しい複素ベクトル
	 * @overload
	 */
	pow(exponent: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param exponent - 指数
	 * @returns 冪乗後の新しいベクトル
	 * @overload
	 */
	pow(exponent: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * 各要素の平方根を計算した新しいベクトルを取得する
	 * @returns 平方根適用後の新しいベクトル
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sqrt(): this;
	/**
	 * 各要素の立方根を計算した新しいベクトルを取得する
	 * @returns 立方根適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	cbrt(): this;
	/**
	 * 各要素の n 乗根を計算した新しいベクトルを取得する
	 * @param n - 指数
	 * @returns n 乗根適用後の新しいベクトル
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	nthRoot(n: number | bigint): this;
	/**
	 * 各要素を床関数 (負の無限大方向への丸め) で処理した新しいベクトルを取得する
	 * @returns 床関数適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	floor(): this;
	/**
	 * 各要素を天井関数 (正の無限大方向への丸め) で処理した新しいベクトルを取得する
	 * @returns 天井関数適用後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	ceil(): this;
	/**
	 * 各要素を四捨五入した新しいベクトルを取得する
	 * @returns 四捨五入後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	round(): this;
	/**
	 * 各要素を 0 方向に切り捨てた新しいベクトルを取得する
	 * @returns 切り捨て後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	trunc(): this;
	/**
	 * 各要素を Float32 精度に丸めた新しいベクトルを取得する
	 * @returns 丸め後の新しいベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	fround(): this;
	/**
	 * 各要素を 32 ビット整数として見た時の先頭のゼロビット数を数えたベクトルを取得する
	 * @returns 結果のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	clz32(): this;
	/**
	 * 別のベクトルまたは数値との相対差を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 相対差のベクトル
	 */
	relativeDiff(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 比較対象の複素ベクトル
	 * @returns 複素相対差のベクトル
	 * @overload
	 */
	relativeDiff(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * 別のベクトルまたは数値との絶対差を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 絶対差のベクトル
	 */
	absoluteDiff(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 比較対象の複素ベクトル
	 * @returns 複素絶対差のベクトル
	 * @overload
	 */
	absoluteDiff(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * 別のベクトルまたは数値との百分率差分を各要素ごとに計算したベクトルを取得する
	 * @param other - 比較対象
	 * @returns 百分率差分のベクトル (%)
	 */
	percentDiff(other: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param other - 比較対象の複素ベクトル
	 * @returns 複素百分率差分のベクトル (%)
	 * @overload
	 */
	percentDiff(other: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * 各要素の正弦 (sin) を計算したベクトルを取得する
	 * @returns sin 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sin(): this;
	/**
	 * 各要素の余弦 (cos) を計算したベクトルを取得する
	 * @returns cos 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cos(): this;
	/**
	 * 各要素の正接 (tan) を計算したベクトルを取得する
	 * @returns tan 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tan(): this;
	/**
	 * 各要素の逆正弦 (asin) を計算したベクトルを取得する
	 * @returns asin 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	asin(): this;
	/**
	 * 各要素の逆余弦 (acos) を計算したベクトルを取得する
	 * @returns acos 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	acos(): this;
	/**
	 * 各要素の逆正接 (atan) を計算したベクトルを取得する
	 * @returns atan 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atan(): this;
	/**
	 * 各要素に対して atan2 を計算したベクトルを取得する
	 * @param x - x 座標のベクトルまたは数値
	 * @returns atan2 適用後のベクトル
	 */
	atan2(x: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param x - x 座標の複素ベクトルまたは複素数
	 * @returns atan2 適用後の複素ベクトル
	 * @overload
	 */
	atan2(x: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param x - x 座標
	 * @returns atan2 適用後のベクトル
	 * @overload
	 */
	atan2(x: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * 各要素の双曲線正弦 (sinh) を計算したベクトルを取得する
	 * @returns sinh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sinh(): this;
	/**
	 * 各要素の双曲線余弦 (cosh) を計算したベクトルを取得する
	 * @returns cosh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cosh(): this;
	/**
	 * 各要素の双曲線正接 (tanh) を計算したベクトルを取得する
	 * @returns tanh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tanh(): this;
	/**
	 * 各要素の逆双曲線正弦 (asinh) を計算したベクトルを取得する
	 * @returns asinh 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	asinh(): this;
	/**
	 * 各要素の逆双曲線余弦 (acosh) を計算したベクトルを取得する
	 * @returns acosh 適用後のベクトル
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	acosh(): this;
	/**
	 * 各要素の逆双曲線正接 (atanh) を計算したベクトルを取得する
	 * @returns atanh 適用後のベクトル
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atanh(): this;
	/**
	 * 各要素の指数関数 (exp) を計算したベクトルを取得する
	 * @returns exp 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	exp(): this;
	/**
	 * 各要素の 2 を底とする指数関数 (exp2) を計算したベクトルを取得する
	 * @returns exp2 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	exp2(): this;
	/**
	 * 各要素に対して exp(x) - 1 を計算したベクトルを取得する
	 * @returns expm1 適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	expm1(): this;
	/**
	 * 各要素の自然対数 (ln) を計算したベクトルを取得する
	 * @returns ln 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	ln(): this;
	/**
	 * 各要素の任意の底による対数を計算したベクトルを取得する
	 * @param base - 底
	 * @returns 対数計算後のベクトル
	 */
	log(base: BigFloatValue | BigFloatVectorLike): this;
	/**
	 * @param base - 底(複素数)
	 * @returns 対数計算後の複素ベクトル
	 * @overload
	 */
	log(base: BigFloatComplex | BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * @param base - 底
	 * @returns 対数計算後のベクトル
	 * @overload
	 */
	log(base: BigFloatInputValue | BigFloatAnyVectorLike): this | BigFloatAnyVector;
	/**
	 * 各要素の底を 2 とする対数を計算したベクトルを取得する
	 * @returns log2 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	log2(): this;
	/**
	 * 各要素の常用対数 (log10) を計算したベクトルを取得する
	 * @returns log10 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	log10(): this;
	/**
	 * 各要素に対して ln(1 + x) を計算したベクトルを取得する
	 * @returns log1p 適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	log1p(): this;
	/**
	 * 各要素に対してガンマ関数を計算したベクトルを取得する
	 * @returns ガンマ関数適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	gamma(): this;
	/**
	 * 各要素に対してリーマンゼータ関数を計算したベクトルを取得する
	 * @returns ゼータ関数適用後のベクトル
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	zeta(): this;
	/**
	 * 各要素に対して階乗を計算したベクトルを取得する
	 * @returns 階乗適用後のベクトル
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	factorial(): this;
	/**
	 * 最大値を返す
	 * @returns 最大値
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	max(): BigFloat;
	/**
	 * 最小値を返す
	 * @returns 最小値
	 * @throws {TypeError} ベクトルが空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	min(): BigFloat;
	/**
	 * 全要素の合計を計算する
	 * @returns 合計
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sum(): BigFloat;
	/**
	 * 全要素の積を計算する
	 * @returns 総乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	product(): BigFloat;
	/**
	 * 全要素の平均値を計算する
	 * @returns 平均
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	average(): BigFloat;
	/**
	 * 別のベクトルとの内積を計算する
	 * @param other - 対象ベクトル
	 * @returns 内積の値
	 */
	dot(other: BigFloatVectorLike): BigFloat;
	/**
	 * @param other - 対象の複素ベクトル
	 * @returns 複素内積の値
	 * @overload
	 */
	dot(other: BigFloatAnyVectorLike): BigFloatComplex;
	/**
	 * 二乗ノルム (自分自身との内積) を計算する
	 * @returns 二乗ノルム
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	squaredNorm(): BigFloat;
	/**
	 * ノルム (ベクトルの長さ) を計算する
	 * @returns ノルム
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	norm(): BigFloat;
	/**
	 * ベクトルを正規化する (長さを 1 にする)
	 * @returns 正規化された新しいベクトル
	 * @throws {RangeError} ベクトルの長さが 0 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	normalize(): this;
	/**
	 * 別のベクトルとの二乗距離を計算する
	 * @param other - 対象ベクトル
	 * @returns 二乗距離
	 * @throws {RangeError} ベクトルの次元が一致しない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	squaredDistanceTo(other: BigFloatVectorLike): BigFloat;
	/**
	 * 別のベクトルとの距離を計算する
	 * @param other - 対象ベクトル
	 * @returns 距離
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	distanceTo(other: BigFloatVectorLike): BigFloat;
	/**
	 * 別のベクトルへの正射影ベクトルを計算する
	 * @param other - 射影先のベクトル
	 * @returns 射影された新しいベクトル
	 */
	projectOnto(other: BigFloatVectorLike): this;
	/**
	 * @param other - 射影先の複素ベクトル
	 * @returns 射影された新しい複素ベクトル
	 * @overload
	 */
	projectOnto(other: BigFloatComplexVectorLike): BigFloatComplexVector;
	/**
	 * 別のベクトルとのなす角を計算する
	 * @param other - 対象ベクトル
	 * @returns 角度 (ラジアン)
	 * @throws {RangeError} いずれかのベクトルの長さが 0 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DimensionMismatchError} ベクトルの次元が一致しない場合
	 */
	angleTo(other: BigFloatVectorLike): BigFloat;
	/**
	 * 別のベクトルとの外積を計算する (3次元ベクトル専用)
	 * @param other - 対象ベクトル
	 * @returns 外積の結果の新しいベクトル
	 */
	cross(other: BigFloatVectorLike): this;
	/**
	 * @param other - 対象の複素ベクトル
	 * @returns 外積の結果の新しい複素ベクトル
	 * @overload
	 */
	cross(other: BigFloatComplexVectorLike): BigFloatComplexVector;
}
export type BigFloatComplexObject = {
	re?: BigFloatInputValue;
	im?: BigFloatInputValue;
	real?: BigFloatInputValue;
	imag?: BigFloatInputValue;
};
export type BigFloatComplexTuple = readonly [
	BigFloatInputValue,
	BigFloatInputValue
];
export type BigFloatComplexValue = BigFloatInputValue | BigFloatComplexTuple | BigFloatComplexObject;
export type BigFloatComplexAggregateSource = Iterable<BigFloatComplexValue>;
/**
 * BigFloat を用いた複素数クラス
 */
export declare class BigFloatComplex implements Iterable<BigFloat> {
	/** 実部 */
	protected _real: BigFloat;
	/** 虚部 */
	protected _imag: BigFloat;
	/** 精度 (小数点以下の最大桁数) */
	protected _precision: bigint;
	/**
	 * BigFloatComplex コンストラクタ
	 * @param value - 実部、複素数表現 (文字列 "1+2i" など)、または複素数オブジェクト
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	constructor(value?: BigFloatComplexValue, precision?: PrecisionValue);
	/**
	 * BigFloatComplex コンストラクタ
	 * @param real - 実部または複素数表現
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	constructor(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue);
	/**
	 * 値を BigFloat へ変換する (内部用)
	 * @param value - 変換対象の値
	 * @param precision - 精度
	 * @returns 変換された BigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _toBigFloat(value: BigFloatInputValue, precision?: bigint): BigFloat;
	/**
	 * 与えられた値リストから適切な精度を解決する (内部用)
	 * @param values - 値のリスト
	 * @param precision - 明示的に指定された精度
	 * @returns 解決された精度
	 */
	protected static _resolvePrecision(values: BigFloatInputValue[], precision?: PrecisionValue): bigint;
	/**
	 * 内部 BigFloat インスタンスから複素数を生成する (内部用)
	 * @param real - 実部 BigFloat
	 * @param imag - 虚部 BigFloat
	 * @returns 生成された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _fromBigFloats(real: BigFloat, imag: BigFloat): BigFloatComplex;
	/**
	 * 多様な複素数表現を実部と虚部のペアに正規化する (内部用)
	 * @param value - 正規化対象の値
	 * @param imag - 虚部 (value が実部のみの場合)
	 * @returns 実部と虚部のオブジェクト
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _normalizeParts(value: BigFloatComplexValue, imag?: BigFloatValue): {
		realPart: BigFloatInputValue;
		imagPart: BigFloatInputValue;
	};
	/**
	 * コンストラクタ引数を解析し、虚部と精度を特定する (内部用)
	 * @param value - 第1引数
	 * @param imagOrPrecision - 第2引数
	 * @param precision - 第3引数
	 * @param argCount - 引数の数
	 * @returns 解決された虚部と精度のオブジェクト
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _normalizeArguments(value: BigFloatComplexValue, imagOrPrecision?: BigFloatValue | PrecisionValue, precision?: PrecisionValue, argCount?: number): {
		imagPartValue: BigFloatValue;
		precisionValue: PrecisionValue | undefined;
	};
	/**
	 * 第2引数を(虚部ではなく)精度として解釈すべきか判定する (内部用)
	 * @param value - 第1引数
	 * @param imagOrPrecision - 第2引数
	 * @returns 精度として扱う場合は true
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _shouldTreatSecondArgumentAsPrecision(value: BigFloatComplexValue, imagOrPrecision?: BigFloatValue | PrecisionValue): imagOrPrecision is PrecisionValue;
	/**
	 * 複素数文字列を解析する
	 * @param value - 解析対象の文字列
	 * @returns 解析結果、または複素数でない場合は null
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _parseComplexString(value: string): {
		realPart: BigFloatValue;
		imagPart: BigFloatValue;
	} | null;
	/**
	 * 虚部係数を正規化する
	 * @param value - 係数文字列
	 * @param original - 元の複素数文字列
	 * @returns 正規化された係数
	 * @throws {SyntaxError} 係数が無効な場合
	 */
	protected static _normalizeImaginaryCoefficient(value: string, original: string): BigFloatValue;
	/**
	 * 値を BigFloatComplex へ変換する (内部用)
	 * @param value - 変換対象
	 * @param precision - 精度
	 * @returns 変換された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected static _toComplex(value: BigFloatComplexValue, precision?: bigint): BigFloatComplex;
	/**
	 * 複素数 0 を取得する
	 * @param precision - 精度
	 * @returns 0 + 0i
	 */
	static zero(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数 1 を取得する
	 * @param precision - 精度
	 * @returns 1 + 0i
	 */
	static one(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 虚数単位 i を取得する
	 * @param precision - 精度
	 * @returns 0 + 1i
	 */
	static i(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 自然対数の底 e を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns e + 0i
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static e(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 円周率 pi を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns pi + 0i
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static pi(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 2*pi (tau) を実部とした複素数を取得する
	 * @param precision - 精度
	 * @returns tau + 0i
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static tau(precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 与えられた値から BigFloatComplex を生成する
	 * @param value - 実部、複素数表現、または複素数オブジェクト
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	static from(value: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 与えられた値から BigFloatComplex を生成する
	 * @param value - 実部
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	static from(value: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 実部と虚部を指定して BigFloatComplex を生成する
	 * @param real - 実部
	 * @param imag - 虚部
	 * @param precision - 精度
	 * @returns BigFloatComplex インスタンス
	 */
	static of(real: BigFloatValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 極形式から複素数を生成する
	 * @param magnitude - 絶対値 (r)
	 * @param angle - 偏角 (theta, ラジアン)
	 * @param precision - 精度
	 * @returns 生成された BigFloatComplex
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static fromPolar(magnitude: BigFloatValue, angle: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数リストの総和を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 総和
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static sum(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数リストの総積を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 総積
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static product(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 複素数リストの平均を計算する
	 * @param values - 複素数のリスト
	 * @param precision - 結果の精度
	 * @returns 平均
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static average(values: BigFloatComplexAggregateSource, precision?: PrecisionValue): BigFloatComplex;
	/**
	 * 実部を取得する (複製)
	 * @returns 実部
	 */
	get real(): BigFloat;
	/**
	 * 虚部を取得する (複製)
	 * @returns 虚部
	 */
	get imag(): BigFloat;
	/**
	 * 精度を取得する
	 * @returns 精度
	 */
	get precision(): bigint;
	/**
	 * インスタンスを複製する
	 * @returns 複製された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	clone(): BigFloatComplex;
	/**
	 * 精度を変更した新しいインスタンスを返す
	 * @param precision - 新しい精度
	 * @returns 精度が変更された BigFloatComplex
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	changePrecision(precision: PrecisionValue): BigFloatComplex;
	/**
	 * 実部と虚部を配列として取得する
	 * @returns [実部, 虚部]
	 */
	toArray(): [
		BigFloat,
		BigFloat
	];
	/**
	 * 二次元のベクトルへ変換する
	 * @returns BigFloatVector インスタンス
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	toVector(): BigFloatVector;
	/**
	 * 極形式 (絶対値と偏角) へ変換する
	 * @returns 絶対値 (magnitude) と偏角 (angle) のオブジェクト
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toPolar(): {
		magnitude: BigFloat;
		angle: BigFloat;
	};
	/**
	 * JSON シリアライズ用のオブジェクトを取得する
	 * @returns {re: string, im: string} オブジェクト
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toJSON(): {
		re: string;
		im: string;
	};
	/**
	 * 文字列表現を取得する
	 * @param base - 基数 (2-36)
	 * @param precision - 表示精度
	 * @returns "a + bi" 形式の文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toString(base?: number, precision?: PrecisionValue): string;
	/**
	 * 実部と虚部を順に反復するイテレータを取得する
	 * @returns BigFloat のイテレータ
	 */
	[Symbol.iterator](): Iterator<BigFloat, void, undefined>;
	/**
	 * 別の複素数と等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	eq(other: BigFloatComplexValue): boolean;
	/**
	 * 別の複素数と等しいかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しい場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	equals(other: BigFloatComplexValue): boolean;
	/**
	 * 別の複素数と等しくないかどうかを判定する
	 * @param other - 比較対象
	 * @returns 等しくない場合は true
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	ne(other: BigFloatComplexValue): boolean;
	/**
	 * 複素数 0 (0 + 0i) かどうかを判定する
	 * @returns 0 なら true
	 */
	isZero(): boolean;
	/**
	 * 純実数 (虚部が 0) かどうかを判定する
	 * @returns 純実数なら true
	 */
	isReal(): boolean;
	/**
	 * 純虚数 (実部が 0 かつ虚部が 0 でない) かどうかを判定する
	 * @returns 純虚数なら true
	 */
	isImaginary(): boolean;
	/**
	 * 共役複素数 (a - bi) を取得する
	 * @returns 共役複素数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	conjugate(): BigFloatComplex;
	/**
	 * 符号を反転させた複素数 (-a - bi) を取得する
	 * @returns 符号反転された複素数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	neg(): BigFloatComplex;
	/**
	 * 絶対値の二乗 (a^2 + b^2) を計算する
	 * @returns 絶対値の二乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	absSquared(): BigFloat;
	/**
	 * 絶対値 (ノルム) を計算する
	 * @returns 絶対値
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	abs(): BigFloat;
	/**
	 * 偏角 (引数) を計算する
	 * @returns 偏角 (ラジアン)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	arg(): BigFloat;
	/**
	 * 複素数の符号 (z / |z|) を取得する
	 * @returns 単位円上の複素数、または 0
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sign(): BigFloatComplex;
	/**
	 * ベクトルとして正規化する (絶対値を 1 にする)
	 * @returns 正規化された複素数
	 * @throws {RangeError} ゼロ複素数を正規化しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	normalize(): BigFloatComplex;
	/**
	 * 二つの複素数間の距離を計算する
	 * @param other - 対象
	 * @returns 距離
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	distanceTo(other: BigFloatComplexValue): BigFloat;
	/**
	 * 別の複素数との相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	relativeDiff(other: BigFloatComplexValue): BigFloat;
	/**
	 * 別の複素数との絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	absoluteDiff(other: BigFloatComplexValue): BigFloat;
	/**
	 * 別の複素数との百分率差分を計算する
	 * @param other - 比較対象
	 * @returns 百分率差分 (%)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	percentDiff(other: BigFloatComplexValue): BigFloat;
	/**
	 * 複素数を加算する
	 * @param other - 加算する値
	 * @returns 加算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	add(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数を減算する
	 * @param other - 減算する値
	 * @returns 減算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sub(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数を乗算する
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	mul(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数で除算する
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	div(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 実数(またはその表現)で除算する (内部用)
	 * @param value - 実数
	 * @returns 除算結果
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected divByReal(value: BigFloatValue): BigFloatComplex;
	/**
	 * 複素数の逆数を計算する
	 * @returns 逆数
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	reciprocal(): BigFloatComplex;
	/**
	 * 複素数を回転させる
	 * @param angle - 回転角 (ラジアン)
	 * @returns 回転後の複素数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	rotate(angle: BigFloatValue): BigFloatComplex;
	/**
	 * 複素数の指数関数 exp(z) を計算する
	 * @returns exp(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	exp(): BigFloatComplex;
	/**
	 * 複素数における exp(z) - 1 を計算する
	 * @returns exp(z) - 1
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	expm1(): BigFloatComplex;
	/**
	 * 複素数の自然対数 ln(z) を計算する
	 * @returns ln(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	ln(): BigFloatComplex;
	/**
	 * 複素数の任意の底による対数を計算する
	 * @param base - 底
	 * @returns 対数結果
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	log(base: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数の冪乗 z^exponent を計算する
	 * @param exponent - 指数
	 * @returns 冪乗結果
	 * @throws {RangeError} ゼロ複素数を非正の実数以外の指数で冪乗しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	pow(exponent: BigFloatComplexValue): BigFloatComplex;
	/**
	 * 複素数の平方根を計算する
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sqrt(): BigFloatComplex;
	/**
	 * 複素数の立方根を計算する
	 * @returns 立方根
	 * @throws {RangeError} n が正の整数でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cbrt(): BigFloatComplex;
	/**
	 * 複素数の n 乗根の主値を計算する
	 * @param n - 指数
	 * @returns n 乗根の主値
	 * @throws {RangeError} n が正の整数でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	nthRoot(n: number | bigint): BigFloatComplex;
	/**
	 * 複素数のすべての n 乗根を取得する
	 * @param n - 指数 (正の整数)
	 * @returns n 乗根の配列
	 * @throws {RangeError} n が正の整数でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	nthRoots(n: number | bigint): BigFloatComplex[];
	/**
	 * 複素数の正弦 (sin) を計算する
	 * @returns sin(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sin(): BigFloatComplex;
	/**
	 * 複素数の余弦 (cos) を計算する
	 * @returns cos(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cos(): BigFloatComplex;
	/**
	 * 複素数の正接 (tan) を計算する
	 * @returns tan(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tan(): BigFloatComplex;
	/**
	 * 複素数の双曲線正弦 (sinh) を計算する
	 * @returns sinh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sinh(): BigFloatComplex;
	/**
	 * 複素数の双曲線余弦 (cosh) を計算する
	 * @returns cosh(z)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cosh(): BigFloatComplex;
	/**
	 * 複素数の双曲線正接 (tanh) を計算する
	 * @returns tanh(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tanh(): BigFloatComplex;
	/**
	 * 複素数の逆正弦 (asin) を計算する
	 * @returns asin(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	asin(): BigFloatComplex;
	/**
	 * 複素数の逆余弦 (acos) を計算する
	 * @returns acos(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	acos(): BigFloatComplex;
	/**
	 * 複素数の逆正接 (atan) を計算する
	 * @returns atan(z)
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	atan(): BigFloatComplex;
	/**
	 * 複素数の逆双曲線正弦 (asinh) を計算する
	 * @returns asinh(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	asinh(): BigFloatComplex;
	/**
	 * 複素数の逆双曲線余弦 (acosh) を計算する
	 * @returns acosh(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	acosh(): BigFloatComplex;
	/**
	 * 複素数の逆双曲線正接 (atanh) を計算する
	 * @returns atanh(z)
	 * @throws {RangeError} ゼロ複素数の対数を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	atanh(): BigFloatComplex;
	/**
	 * 床関数 (負の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	floor(): BigFloatComplex;
	/**
	 * 天井関数 (正の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	ceil(): BigFloatComplex;
	/**
	 * 0に近い方向へ切り捨てる
	 * @returns 切り捨てられた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	trunc(): BigFloatComplex;
	/**
	 * 四捨五入する
	 * @returns 四捨五入された結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	round(): BigFloatComplex;
	/**
	 * 剰余を計算する (%)
	 * @param other - 法
	 * @returns 剰余
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	mod(other: BigFloatComplexValue): BigFloatComplex;
	/**
	 * Float32 精度へ丸める
	 * @returns Float32相当に丸めた結果
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	fround(): BigFloatComplex;
	/**
	 * 32bit整数として見たときの先頭ゼロビット数を返す
	 * @returns 先頭ゼロビット数
	 * @throws {TypeError} 虚部が 0 でない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	clz32(): BigFloatComplex;
}
/**
 * BigFloatComplex を作成する
 * @param value - 実部、複素数表現、または複素数オブジェクト
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export declare function bigFloatComplex(value?: BigFloatComplexValue, precision?: PrecisionValue): BigFloatComplex;
/**
 * BigFloatComplex を作成する
 * @param real - 実部
 * @param imag - 虚部
 * @param precision - 精度
 * @returns BigFloatComplex インスタンス
 */
export declare function bigFloatComplex(real: BigFloatComplexValue, imag?: BigFloatValue, precision?: PrecisionValue): BigFloatComplex;
export type BigFloatConstructor = typeof BigFloat;
export type BigFloatRawValue = {
	mantissa: bigint;
	exp2: bigint;
	exp5: bigint;
};
export type BigFloatCacheEntry = {
	exactValue: bigint;
	precision: bigint;
};
/**
 * BigFloat の設定を管理するクラス
 */
export declare class BigFloatConfig {
	/** 精度の不一致を許容するかどうか */
	allowPrecisionMismatch: boolean;
	/** BigFloatComplex との相互運用を許容するかどうか */
	allowComplexNumbers: boolean;
	/** 破壊的な計算(自身の上書き)をするかどうか */
	mutateResult: boolean;
	/** Infinity/NaN の特殊値を許容するかどうか */
	allowSpecialValues: boolean;
	/** 丸めモード */
	roundingMode: RoundingMode;
	/** 計算時に追加する精度 */
	extraPrecision: bigint;
	/** 三角関数の最大ステップ数 */
	trigFuncsMaxSteps: bigint;
	/** 対数計算の最大ステップ数 */
	lnMaxSteps: bigint;
	/**
	 * BigFloatConfig コンストラクタ
	 * @param options - 設定オプション
	 * @param options.allowPrecisionMismatch - 精度の不一致を許容するかどうか
	 * @param options.allowComplexNumbers - BigFloatComplex との相互運用を許容するかどうか
	 * @param options.mutateResult - 破壊的な計算(自身の上書き)をするかどうか
	 * @param options.allowSpecialValues - Infinity/NaN の特殊値を許容するかどうか
	 * @param options.roundingMode - 丸めモード
	 * @param options.extraPrecision - 計算時に追加する精度
	 * @param options.trigFuncsMaxSteps - 三角関数の最大ステップ数
	 * @param options.lnMaxSteps - 対数計算の最大ステップ数
	 * @returns 設定オブジェクト
	 */
	constructor({ allowPrecisionMismatch, allowComplexNumbers, mutateResult, allowSpecialValues, roundingMode, extraPrecision, trigFuncsMaxSteps, lnMaxSteps }?: BigFloatOptions);
	/**
	 * 設定オブジェクトを複製する
	 * @returns 複製された設定オブジェクト
	 */
	clone(): BigFloatConfig;
	/**
	 * 精度の不一致を許容するかどうかを切り替える
	 */
	toggleMismatch(): void;
	/**
	 * BigFloatComplex との相互運用を許容するかどうかを切り替える
	 */
	toggleComplexNumbers(): void;
	/**
	 * 破壊的な計算(自身の上書き)をするかどうかを切り替える
	 */
	toggleMutation(): void;
}
/**
 * 大きな浮動小数点数を扱えるクラス
 */
export declare class BigFloat {
	/** 最大精度 (Stringの限界) */
	static MAX_PRECISION: bigint;
	/** レイジー正規化の閾値 */
	static LAZY_NORMALIZE_SMALL_THRESHOLD: bigint;
	/** デフォルトの精度 */
	static DEFAULT_PRECISION: bigint;
	/** 設定 */
	static config: BigFloatConfig;
	/** 円周率キャッシュ */
	private static _piCache;
	/** eキャッシュ */
	private static _eCache;
	/** 対数キャッシュ */
	private static _lnCache;
	/** 5の累乗キャッシュ */
	private static _pow5Cache;
	/** 2の累乗キャッシュ */
	private static _pow2Cache;
	/** ベルヌーイ数のキャッシュ */
	private static _bernoulliCache;
	/** 内部的な値 (mantissa × 2^exp2 × 5^exp5) */
	mantissa: bigint;
	/** 2の指数 */
	_exp2: bigint;
	/** 5の指数 */
	_exp5: bigint;
	/** 精度 (小数点以下の最大桁数) */
	_precision: bigint;
	/** 特殊値の状態 */
	_specialState: SpecialValueState;
	/**
	 * キャッシュをクリアする
	 */
	static clearCache(): void;
	/**
	 * 2の指数を取得する
	 * @returns 2の指数 (2^exp2)
	 */
	exponent2(): bigint;
	/**
	 * 5の指数を取得する
	 * @returns 5の指数 (5^exp5)
	 */
	exponent5(): bigint;
	/**
	 * 特殊値状態を表示用の文字列に変換する
	 * @param state - 特殊値状態
	 * @returns 表示用の文字列
	 */
	protected static _specialStateLabel(state: SpecialValueState): string;
	/**
	 * 文字列から特殊値状態を判定する
	 * @param value - 判定対象の文字列
	 * @returns 対応する特殊値状態（通常の数値文字列の場合は null）
	 */
	protected static _stateFromString(value: string): SpecialValueState | null;
	/**
	 * number値から特殊値状態を判定する
	 * @param value - 判定対象の値
	 * @returns 対応する特殊値状態（有限値の場合は null）
	 */
	protected static _stateFromNumber(value: number): SpecialValueState | null;
	/**
	 * 特殊値状態のインスタンスを生成する
	 * @param state - 特殊値状態
	 * @param precision - 結果の精度
	 * @returns 生成された特殊値インスタンス
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected static _createSpecialValue(state: SpecialValueState, precision: bigint): BigFloat;
	/**
	 * 自身または新しいインスタンスに特殊値状態を設定する
	 * @param state - 特殊値状態
	 * @param precision - 結果の精度
	 * @returns 特殊値状態を持つ結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected _specialResult(state: SpecialValueState, precision?: bigint): BigFloat;
	/**
	 * 有限値かどうかを判定する
	 * @returns 有限値の場合はtrue
	 */
	protected _isFiniteState(): boolean;
	/**
	 * NaN状態かどうかを判定する
	 * @returns NaN状態の場合はtrue
	 */
	protected _isNaNState(): boolean;
	/**
	 * 無限大状態かどうかを判定する
	 * @returns 正または負の無限大の場合はtrue
	 */
	protected _isInfinityState(): boolean;
	/**
	 * 符号を取得する
	 * @returns 正なら1、負なら-1、ゼロまたはNaNなら0
	 */
	protected _signum(): number;
	/**
	 * 特殊値が無効な設定で特殊値を扱っていないかを検証する
	 * @param values - 検証対象の値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	protected _ensureSpecialValuesEnabled(...values: BigFloat[]): void;
	/**
	 * BigFloatComplex らしい値か判定する
	 * @param value - 判定対象
	 * @returns BigFloatComplex の場合は true
	 */
	static _isComplexValue(value: unknown): value is BigFloatComplex;
	/**
	 * 複素数モードが無効な場合は例外にする
	 * @param operation - 操作名
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	_assertComplexNumbersEnabled(operation: string): void;
	/**
	 * 複素数オペランドを解決する
	 * @param other - 比較対象
	 * @param operation - 操作名
	 * @returns BigFloatComplex の場合はそのインスタンス、それ以外は null
	 * @throws {TypeError} 複素数モードが無効な場合
	 */
	protected _complexOperand(other: unknown, operation: string): BigFloatComplex | null;
	/**
	 * 自身を複素数へ昇格する
	 * @param other - 昇格の基準となる複素数
	 * @returns 昇格後の複素数
	 */
	protected _toComplexLike(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 特殊値を考慮してnumberへ変換する
	 * @returns 変換後のnumber値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	protected _specialAwareNumber(): number;
	/**
	 * number値から特殊値を考慮した結果を生成する
	 * @param value - 変換元のnumber値
	 * @param precision - 結果の精度
	 * @returns 変換後のBigFloat
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	protected _fromSpecialAwareNumber(value: number, precision?: bigint): BigFloat;
	/**
	 * 指定精度の厳密値結果を生成する
	 * @param mantissa - 仮数
	 * @param precision - 結果の精度
	 * @param exp2 - 2の指数
	 * @param exp5 - 5の指数
	 * @returns 厳密値の結果
	 */
	protected _makeExactResultWithPrecision(mantissa: bigint, precision: bigint, exp2?: bigint, exp5?: bigint): BigFloat;
	/**
	 * BigFloat コンストラクタ
	 * @param value - 初期値 (数値, 文字列, BigInt, または別の BigFloat)
	 * @param precision - 精度 (小数点以下の最大桁数)
	 * @returns BigFloat インスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を渡した場合
	 * @throws {TypeError} 虚部が 0 でない複素数を渡した場合
	 */
	constructor(value?: BigFloatInputValue, precision?: PrecisionValue);
	/**
	 * クラスを複製する (設定複製用)
	 * @returns 複製されたクラス
	 */
	static clone(): BigFloatConstructor;
	/**
	 * インスタンスを複製する
	 * @returns 複製されたインスタンス
	 */
	clone(): BigFloat;
	/**
	 * 他のインスタンスの値を自身にコピーする
	 * @param other - コピー元
	 * @returns 自身
	 */
	copyFrom(other: BigFloat): this;
	/**
	 * 生の内部表現から結果を作成する
	 * @param mantissa - 仮数
	 * @param exp2 - 2の指数
	 * @param exp5 - 5の指数
	 * @returns 結果
	 */
	protected _makeExactResult(mantissa: bigint, exp2?: bigint, exp5?: bigint): BigFloat;
	/**
	 * 厳密な整数値を取得する
	 * @returns 整数値、整数でない場合はnull
	 */
	protected _getExactInteger(): bigint | null;
	/**
	 * 厳密な2の冪指数を取得する
	 * @returns 2の冪指数、該当しない場合はnull
	 */
	protected _getExactPowerOf2Exponent(): bigint | null;
	/**
	 * 厳密な10の冪指数を取得する
	 * @returns 10の冪指数、該当しない場合はnull
	 */
	protected _getExactPowerOf10Exponent(): bigint | null;
	/**
	 * ソフト正規化 (2の累乗を外に出す)
	 */
	softNormalize(): void;
	/**
	 * レイジー正規化 (5の累乗を外に出す)
	 */
	lazyNormalize(): void;
	/**
	 * 指定された精度に丸める
	 * @param precision - 精度 (省略時は自身の _precision)
	 */
	protected _applyPrecision(precision?: bigint): void;
	/**
	 * 手動丸め (内部用)
	 * @param mantissa - 値
	 * @param divisor - 除数
	 * @returns 丸められた値
	 */
	protected static _roundManual(mantissa: bigint, divisor: bigint): bigint;
	/**
	 * 文字列を数値に変換する
	 * @param str - 変換する文字列
	 * @param precision - 小数点以下の桁数
	 * @param base - 基数
	 * @returns 変換されたBigFloatインスタンス
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SyntaxError} 不正な文字が含まれている場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 */
	static parseFloat(str: BigFloatValue, precision?: PrecisionValue, base?: number): BigFloat;
	/**
	 * 文字列を解析して数値を取得
	 * @param str - 解析する文字列
	 * @returns 整数部、小数部、符号
	 */
	_parse(str: string): {
		intPart: string;
		fracPart: string;
		sign: number;
	};
	/**
	 * 集計関数の単一配列引数かどうかを判定する
	 * @param args - 引数リスト
	 * @returns 単一配列引数の場合はtrue
	 */
	protected static _hasAggregateArrayArg(args: BigFloatAggregateArgs): args is [
		readonly BigFloatValue[]
	];
	/**
	 * 引数を正規化する
	 * @param args - 引数リスト
	 * @returns 正規化された引数リスト
	 */
	protected static _normalizeArgs(args: BigFloatAggregateArgs): BigFloatValue[];
	/**
	 * 演算に使う精度を解決する
	 * @param values - 対象値
	 * @param fallback - デフォルト精度
	 * @returns 解決済み精度
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _resolvePrecisionFromValues(values: readonly BigFloatValue[], fallback?: PrecisionValue): bigint;
	/**
	 * 値を指定精度のBigFloatへ正規化する
	 * @param value - 対象値
	 * @param precision - 精度
	 * @returns 正規化後のBigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _coerceBigFloatValue(value: BigFloatValue, precision: bigint): BigFloat;
	/**
	 * 内部整数値から生の内部表現を生成する
	 * @param value - 10^precision倍された整数値
	 * @param precision - 精度
	 * @returns 生の内部表現
	 */
	protected static _fromInternalValue(value: bigint, precision: bigint): BigFloatRawValue;
	/**
	 * 生の内部表現を10^precision倍された整数値に変換する
	 * @param value - 生の内部表現
	 * @param precision - 精度
	 * @returns 10^precision倍された整数値
	 */
	protected static _toInternalValue(value: BigFloatRawValue, precision: bigint): bigint;
	/**
	 * 生の内部表現をソフト正規化する
	 * @param value - 対象
	 * @returns 正規化後の内部表現
	 */
	protected static _softNormalizeRaw(value: BigFloatRawValue): BigFloatRawValue;
	/**
	 * 生の内部表現を指定精度へ丸める
	 * @param value - 対象
	 * @param precision - 精度
	 * @returns 丸め後の内部表現
	 */
	protected static _applyRawPrecision(value: BigFloatRawValue, precision: bigint): BigFloatRawValue;
	/**
	 * 生の内部表現をレイジー正規化する
	 * @param value - 対象
	 * @returns 正規化後の内部表現
	 */
	protected static _lazyNormalizeRaw(value: BigFloatRawValue): BigFloatRawValue;
	/**
	 * mantissa から符号・2の指数・5の指数を抽出する
	 * @param mantissa - 対象
	 * @returns 分解結果
	 */
	protected static _extractPowerFactors(mantissa: bigint): {
		sign: bigint;
		mantissa: bigint;
		exp2: bigint;
		exp5: bigint;
	};
	/**
	 * 最大公約数を取得する
	 * @param a - 値A
	 * @param b - 値B
	 * @returns 最大公約数
	 */
	protected static _gcd(a: bigint, b: bigint): bigint;
	/**
	 * 精度を合わせる
	 * @param other - 合わせる対象
	 * @param mutateA - 自身を破壊的に変更するかどうか
	 * @returns [BigFloatA, BigFloatB] (アラインメント済みのインスタンス)
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected _align(other: BigFloatValue, mutateA?: boolean): [
		BigFloat,
		BigFloat
	];
	/**
	 * 結果を作成する (静的メソッド)
	 * @param val - 値 (10^valPrecision倍された整数)
	 * @param precision - 保持する精度 (小数点以下の最大桁数)
	 * @param valPrecision - 入力値の現在の精度 (省略時は precision)
	 * @returns 作成されたBigFloatインスタンス
	 */
	protected static _makeResult(val: bigint, precision: bigint, valPrecision?: bigint): BigFloat;
	/**
	 * 結果を作成する (インスタンスメソッド)
	 * @param val - 値 (10^valPrecision倍された整数)
	 * @param precision - 保持する精度 (小数点以下の最大桁数)
	 * @param valPrecision - 入力値の現在の精度 (省略時は precision)
	 * @param okMutate - 破壊的な変更を許可するかどうか
	 * @returns 作成または更新されたBigFloatインスタンス
	 */
	protected _makeResult(val: bigint, precision: bigint, valPrecision?: bigint, okMutate?: boolean): BigFloat;
	/**
	 * 正の整数 n の degree 乗根の初期値を概算する
	 * @param value - 対象の正の整数
	 * @param degree - 乗根の次数
	 * @param decimalShift - 値に追加で掛かっている 10 の指数
	 * @returns ニュートン法用の初期値
	 * @throws {RangeError} degree が正の整数でない場合
	 */
	protected static _estimatePositiveRoot(value: bigint, degree: bigint, decimalShift?: bigint): bigint;
	/**
	 * 精度をチェックする
	 * @param precision - チェックする精度
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	protected static _checkPrecision(precision: bigint): void;
	/**
	 * 精度を変更する
	 * @param precision - 新しい精度
	 * @returns 精度が変更されたインスタンス
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	changePrecision(precision: PrecisionValue): this;
	/**
	 * どこまで精度が一致しているかを判定する
	 * @param other - 比較対象
	 * @returns 一致している桁数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	matchingPrecision(other: BigFloatValue): bigint;
	/**
	 * 比較演算
	 * @param other - 比較対象
	 * @returns 比較結果 (-1, 0, 1、NaN の比較が含まれる場合は NaN)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	compare(other: BigFloatInputValue): number;
	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	eq(other: BigFloatInputValue): boolean;
	/**
	 * 等しいかどうかを判定する (==)
	 * @param other - 比較対象
	 * @returns 等しい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	equals(other: BigFloatInputValue): boolean;
	/**
	 * 等しくないかどうかを判定する (!=)
	 * @param other - 比較対象
	 * @returns 等しくない場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	ne(other: BigFloatInputValue): boolean;
	/**
	 * より小さいかどうかを判定する (<)
	 * @param other - 比較対象
	 * @returns より小さい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	lt(other: BigFloatInputValue): boolean;
	/**
	 * 以下かどうかを判定する (<=)
	 * @param other - 比較対象
	 * @returns 以下の場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	lte(other: BigFloatInputValue): boolean;
	/**
	 * より大きいかどうかを判定する (>)
	 * @param other - 比較対象
	 * @returns より大きい場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	gt(other: BigFloatInputValue): boolean;
	/**
	 * 以上かどうかを判定する (>=)
	 * @param other - 比較対象
	 * @returns 以上の場合はtrue
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	gte(other: BigFloatInputValue): boolean;
	/**
	 * ゼロかどうかを判定する
	 * @returns ゼロの場合はtrue
	 */
	isZero(): boolean;
	/**
	 * 正の数かどうかを判定する
	 * @returns 正の数の場合はtrue
	 */
	isPositive(): boolean;
	/**
	 * 負の数かどうかを判定する
	 * @returns 負の数の場合はtrue
	 */
	isNegative(): boolean;
	/**
	 * 相対差を計算する
	 * @param other - 比較対象
	 * @returns 相対差
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	relativeDiff(other: BigFloatInputValue): BigFloat;
	/**
	 * 絶対差を計算する
	 * @param other - 比較対象
	 * @returns 絶対差
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	absoluteDiff(other: BigFloatInputValue): BigFloat;
	/**
	 * 差分の非一致度を計算する (百分率)
	 * @param other - 比較対象
	 * @returns 非一致度 (%)
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	percentDiff(other: BigFloatInputValue): BigFloat;
	/**
	 * 文字列に変換する
	 * @param base - 基数 (2-36)
	 * @param precision - 出力時の精度
	 * @returns 変換された文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toString(base?: number, precision?: PrecisionValue): string;
	/**
	 * JSON用の文字列表現を取得する
	 * @returns JSON文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toJSON(): string;
	/**
	 * Number型に変換する
	 * @returns 変換された数値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toNumber(): number;
	/**
	 * 指定した桁数で固定した文字列を取得する
	 * @param digits - 小数点以下の桁数
	 * @returns 固定小数点形式の文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toFixed(digits: PrecisionValue): string;
	/**
	 * 指数形式の文字列を取得する
	 * @param digits - 有効桁数
	 * @returns 指数形式の文字列
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	toExponential(digits?: number): string;
	/**
	 * 加算する (+)
	 * @param other - 加算する値
	 * @returns 加算結果
	 */
	add(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を加算する (+)
	 * @param other - 加算する複素数
	 * @returns 加算結果
	 * @overload
	 */
	add(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 加算する (+)
	 * @param other - 加算する値
	 * @returns 加算結果
	 * @overload
	 */
	add(other: BigFloatInputValue): BigFloatLike;
	/**
	 * 減算する (-)
	 * @param other - 減算する値
	 * @returns 減算結果
	 */
	sub(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を減算する (-)
	 * @param other - 減算する複素数
	 * @returns 減算結果
	 * @overload
	 */
	sub(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 減算する (-)
	 * @param other - 減算する値
	 * @returns 減算結果
	 * @overload
	 */
	sub(other: BigFloatInputValue): BigFloatLike;
	/**
	 * 乗算する (*)
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 */
	mul(other: BigFloatValue): BigFloat;
	/**
	 * 複素数を乗算する (*)
	 * @param other - 乗算する複素数
	 * @returns 乗算結果
	 * @overload
	 */
	mul(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 乗算する (*)
	 * @param other - 乗算する値
	 * @returns 乗算結果
	 * @overload
	 */
	mul(other: BigFloatInputValue): BigFloatLike;
	/**
	 * 除算する (/)
	 * @param other - 除算する値
	 * @returns 除算結果
	 */
	div(other: BigFloatValue): BigFloat;
	/**
	 * 複素数で除算する (/)
	 * @param other - 除算する複素数
	 * @returns 除算結果
	 * @overload
	 */
	div(other: BigFloatComplex): BigFloatComplex;
	/**
	 * 除算する (/)
	 * @param other - 除算する値
	 * @returns 除算結果
	 * @overload
	 */
	div(other: BigFloatInputValue): BigFloatLike;
	/**
	 * インスタンスから結果を作成する
	 * @param instance - 結果の元となるインスタンス
	 * @returns 結果のインスタンス
	 */
	protected _makeResultFromInstance(instance: BigFloat): BigFloat;
	/**
	 * 内部的な計算用に、指定した精度の10進整数値を取得する
	 * @param precision - 精度
	 * @returns 10^precision倍された整数値
	 */
	protected _getInternalValue(precision: bigint): bigint;
	/**
	 * 剰余を計算する (内部用)
	 * @param x - 被除数
	 * @param m - 法
	 * @returns 剰余
	 */
	protected static _mod(x: bigint, m: bigint): bigint;
	/**
	 * 剰余を計算する (%)
	 * @param other - 法
	 * @returns 剰余
	 */
	mod(other: BigFloatValue): BigFloat;
	/**
	 * 複素数の剰余（未サポート）
	 * @param other - 法
	 * @overload
	 */
	mod(other: BigFloatComplex): never;
	/**
	 * 剰余を計算する (%)
	 * @param other - 法
	 * @returns 剰余
	 * @overload
	 */
	mod(other: BigFloatInputValue): BigFloat;
	/**
	 * 符号を反転させる
	 * @returns 符号が反転した結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	neg(): BigFloat;
	/**
	 * 絶対値を取得する
	 * @returns 絶対値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	abs(): BigFloat;
	/**
	 * 符号を取得する
	 * @returns -1, 0, 1 または NaN
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	sign(): BigFloat;
	/**
	 * 逆数を取得する
	 * @returns 逆数
	 * @throws {DivisionByZeroError} ゼロの場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	reciprocal(): BigFloat;
	/**
	 * 床関数 (負の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	floor(): BigFloat;
	/**
	 * 天井関数 (正の無限大方向への丸め)
	 * @returns 丸められた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	ceil(): BigFloat;
	/**
	 * 四捨五入する
	 * @returns 四捨五入された結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	round(): BigFloat;
	/**
	 * 0に近い方向へ切り捨てる
	 * @returns 切り捨てられた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	trunc(): BigFloat;
	/**
	 * Float32 精度へ丸める
	 * @returns Float32相当に丸めた結果
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	fround(): BigFloat;
	/**
	 * 32bit整数として見たときの先頭ゼロビット数を返す
	 * @returns 先頭ゼロビット数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	clz32(): BigFloat;
	/**
	 * 冪乗を計算する (内部用)
	 * @param base - 底
	 * @param exponent - 指数
	 * @param precision - 精度
	 * @returns 冪乗の結果
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _pow(base: bigint, exponent: bigint, precision: bigint): bigint;
	/**
	 * 冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @overload
	 */
	pow(exponent: BigFloatValue): BigFloat;
	/**
	 * 複素数の冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @overload
	 */
	pow(exponent: BigFloatComplex): BigFloatComplex;
	/**
	 * 冪乗を計算する
	 * @param exponent - 指数
	 * @returns 冪乗の結果
	 * @overload
	 */
	pow(exponent: BigFloatInputValue): BigFloatLike;
	/**
	 * 平方根を計算する (内部用)
	 * @param n - 値
	 * @param precision - 精度
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _sqrt(n: bigint, precision: bigint): bigint;
	/**
	 * 平方根を計算する
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sqrt(): BigFloat;
	/**
	 * 立方根を計算する
	 * @returns 立方根
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	cbrt(): BigFloat;
	/**
	 * n乗根を計算する (内部用)
	 * @param v - 値
	 * @param n - 指数
	 * @param precision - 精度
	 * @returns n乗根
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 */
	protected static _nthRoot(v: bigint, n: bigint, precision: bigint): bigint;
	/**
	 * n乗根を計算する
	 * @param n - 指数
	 * @returns n乗根
	 * @throws {RangeError} nが正の整数でない場合、または負の数の偶数乗根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	nthRoot(n: number | bigint): BigFloat;
	/**
	 * 正弦(sin)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正弦
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _sin(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 範囲縮約なしで正弦(sin)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正弦
	 */
	protected static _sinSeries(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 正弦(sin)を計算する
	 * @returns 正弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sin(): BigFloat;
	/**
	 * 余弦(cos)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 余弦
	 */
	protected static _cos(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 余弦(cos)を計算する
	 * @returns 余弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cos(): BigFloat;
	/**
	 * 正接(tan)を計算する (内部用)
	 * @param x - 角度(ラジアン)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 正接
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _tan(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 正接(tan)を計算する
	 * @returns 正接
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tan(): BigFloat;
	/**
	 * 逆正弦(asin)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _asin(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 逆正弦(asin)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	asin(): BigFloat;
	/**
	 * 逆余弦(acos)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _acos(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 逆余弦(acos)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	acos(): BigFloat;
	/**
	 * 逆正接(atan)を計算する (内部用)
	 * @param x - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _atan(x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 逆正接(atan)を計算する
	 * @returns 角度(ラジアン)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atan(): BigFloat;
	/**
	 * 2引数の逆正接(atan2)を計算する (内部用)
	 * @param y - y座標
	 * @param x - x座標
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 角度(ラジアン)
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _atan2(y: bigint, x: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 2引数の逆正接(atan2)を計算する
	 * @param x - x座標
	 * @returns 角度(ラジアン)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atan2(x: BigFloatValue): BigFloat;
	/**
	 * 双曲線正弦(sinh)を計算する
	 * @returns 双曲線正弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	sinh(): BigFloat;
	/**
	 * 双曲線余弦(cosh)を計算する
	 * @returns 双曲線余弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	cosh(): BigFloat;
	/**
	 * 双曲線正接(tanh)を計算する
	 * @returns 双曲線正接
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	tanh(): BigFloat;
	/**
	 * 逆双曲線正弦(asinh)を計算する
	 * @returns 逆双曲線正弦
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	asinh(): BigFloat;
	/**
	 * 逆双曲線余弦(acosh)を計算する
	 * @returns 逆双曲線余弦
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	acosh(): BigFloat;
	/**
	 * 逆双曲線正接(atanh)を計算する
	 * @returns 逆双曲線正接
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	atanh(): BigFloat;
	/**
	 * マチン(Machin)の公式用のatan計算 (内部用)
	 * @param invX - 1/xのx
	 * @param precision - 精度
	 * @returns atan(1/x)
	 */
	protected static _atanMachine(invX: bigint, precision: bigint): bigint;
	/**
	 * 三角関数用のニュートン法 (内部用)
	 * @param f - 関数
	 * @param df - 導関数
	 * @param initial - 初期値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 解
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 */
	protected static _trigFuncsNewton(f: (x: bigint) => bigint, df: (x: bigint) => bigint, initial: bigint, precision: bigint, maxSteps?: number): bigint;
	/**
	 * sin(pi * z) を計算する (内部用)
	 * @param z - 値
	 * @param precision - 精度
	 * @returns sin(pi * z)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _sinPi(z: bigint, precision: bigint): bigint;
	/**
	 * 指数関数(e^x)を計算する (内部用)
	 * @param x - 指数
	 * @param precision - 精度
	 * @returns e^x
	 */
	protected static _exp(x: bigint, precision: bigint): bigint;
	/**
	 * 指数関数(e^x)を計算する
	 * @returns e^x
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 基数が2から36の範囲外の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	exp(): BigFloat;
	/**
	 * 2の冪乗(2^x)を計算する (内部用)
	 * @param value - 指数
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns 2^x
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _exp2(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 2の冪乗(2^x)を計算する
	 * @returns 2^x
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	exp2(): BigFloat;
	/**
	 * e^x - 1 を計算する (内部用)
	 * @param value - 指数
	 * @param precision - 精度
	 * @returns e^x - 1
	 */
	protected static _expm1(value: bigint, precision: bigint): bigint;
	/**
	 * e^x - 1 を計算する
	 * @returns e^x - 1
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	expm1(): BigFloat;
	/**
	 * 自然対数(ln)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(value)
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _ln(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 自然対数(ln)を計算する
	 * @returns ln(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	ln(): BigFloat;
	/**
	 * 対数を計算する (内部用)
	 * @param value - 値
	 * @param baseValue - 底
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log_base(value)
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log(value: bigint, baseValue: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 対数を計算する
	 * @param base - 底
	 * @returns log_base(x)
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	log(base: BigFloatValue): BigFloat;
	/**
	 * 2を底とする対数(log2)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log2(value)
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log2(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 2を底とする対数(log2)を計算する
	 * @returns log2(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	log2(): BigFloat;
	/**
	 * 10を底とする対数(log10)を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns log10(value)
	 * @throws {RangeError} 底が1または0の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log10(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 10を底とする対数(log10)を計算する
	 * @returns log10(x)
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	log10(): BigFloat;
	/**
	 * ln(1 + x) を計算する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(1 + value)
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _log1p(value: bigint, precision: bigint, maxSteps: bigint): bigint;
	/**
	 * ln(1 + x) を計算する
	 * @returns ln(1 + x)
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	log1p(): BigFloat;
	/**
	 * ln(10) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(10)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _ln10(precision: bigint, maxSteps?: bigint): bigint;
	/**
	 * ln(2) を計算する (内部用)
	 * @param precision - 精度
	 * @param maxSteps - 最大ステップ数
	 * @returns ln(2)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _ln2(precision: bigint, maxSteps: bigint): bigint;
	/**
	 * 自然対数の底(e)を取得する (内部用)
	 * @param precision - 精度
	 * @returns e
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _e(precision: bigint): bigint;
	/**
	 * 自然対数の底(e)を取得する
	 * @param precision - 精度
	 * @returns e
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static e(precision?: PrecisionValue): BigFloat;
	/**
	 * チュドノフスキー法で円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _piChudnovsky(precision?: bigint): bigint;
	/**
	 * 設定されたアルゴリズムで円周率を計算する (内部用)
	 * @param precision - 精度
	 * @returns 円周率
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _pi(precision: bigint): bigint;
	/**
	 * 円周率(pi)を取得する
	 * @param precision - 精度
	 * @returns pi
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static pi(precision?: PrecisionValue): BigFloat;
	/**
	 * タウ(tau = 2*pi)を計算する (内部用)
	 * @param precision - 精度
	 * @returns tau
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 */
	protected static _tau(precision: bigint): bigint;
	/**
	 * タウ(tau = 2*pi)を取得する
	 * @param precision - 精度
	 * @returns tau
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static tau(precision?: PrecisionValue): BigFloat;
	/**
	 * Math.abs() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 絶対値
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	static abs(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.acos() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆余弦
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static acos(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.acosh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線余弦
	 * @throws {RangeError} 入力が範囲外([1, ∞))の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static acosh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.asin() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆正弦
	 * @throws {RangeError} 特殊値が無効な設定で入力が [-1, 1] の範囲外の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 導関数がゼロになった場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static asin(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.asinh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線正弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static asinh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.atan() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆正接
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static atan(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.atan2() 相当
	 * @param y - y座標
	 * @param x - x座標
	 * @param precision - 結果精度
	 * @returns 逆正接
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static atan2(y: BigFloatValue, x: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.atanh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 逆双曲線正接
	 * @throws {RangeError} 入力が範囲外([-1, 1])の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static atanh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.cbrt() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 立方根
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	static cbrt(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.ceil() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り上げ結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	static ceil(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.clz32() 相当
	 * @param value - 対象値
	 * @returns 先頭ゼロビット数
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static clz32(value: BigFloatValue): BigFloat;
	/**
	 * Math.cos() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 余弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static cos(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.cosh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線余弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static cosh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.exp() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 指数関数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static exp(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.expm1() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns e^x - 1
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 */
	static expm1(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.floor() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り捨て結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	static floor(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.fround() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns Float32相当に丸めた結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static fround(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.hypot() 相当
	 * @param values - 値の列
	 * @returns sqrt(sum(x_i^2))
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static hypot(...values: BigFloatValue[]): BigFloat;
	/**
	 * Math.imul() 相当
	 * @param lhs - 左辺
	 * @param rhs - 右辺
	 * @returns 32bit整数乗算結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static imul(lhs: BigFloatValue, rhs: BigFloatValue): BigFloat;
	/**
	 * Math.log() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 自然対数
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static log(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.log10() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 常用対数
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static log10(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.log1p() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns ln(1 + x)
	 * @throws {RangeError} 特殊値が無効な設定で x が -1 以下の値の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	static log1p(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.log2() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 底2対数
	 * @throws {RangeError} 特殊値が無効な設定で値が 0 以下の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	static log2(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.max() 相当
	 * @param args - 数値のリスト
	 * @returns 最大値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	static max(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * Math.min() 相当
	 * @param args - 数値のリスト
	 * @returns 最小値
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合に特殊値を含む引数が渡されたとき
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数と比較しようとした場合
	 */
	static min(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * Math.pow() 相当
	 * @param base - 底
	 * @param exponent - 指数
	 * @param precision - 結果精度
	 * @returns 冪乗結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 * @throws {NumericalComputationError} 数値的に不安定な点の場合
	 */
	static pow(base: BigFloatValue, exponent: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.round() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 四捨五入結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static round(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sign() 相当
	 * @param value - 対象値
	 * @param precision - 入力精度
	 * @returns 符号
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static sign(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sin() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 正弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static sin(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sinh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線正弦
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static sinh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.sqrt() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 平方根
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static sqrt(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.tan() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 正接
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {NumericalComputationError} 正接が定義されない点の場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static tan(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.tanh() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 双曲線正接
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static tanh(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * Math.trunc() 相当
	 * @param value - 対象値
	 * @param precision - 結果精度
	 * @returns 切り捨て結果
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効で対象に特殊値が含まれる場合
	 */
	static trunc(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
	/**
	 * 引数の合計を返す
	 * @param args - 数値のリスト
	 * @returns 合計
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static sum(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の積を返す
	 * @param args - 数値のリスト
	 * @returns 積
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static product(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の平均を返す
	 * @param args - 数値のリスト
	 * @returns 平均
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {TypeError} 複素数モードが無効な場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static average(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の中央値を返す
	 * @param args - 数値のリスト
	 * @returns 中央値
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を比較しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static median(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の分散を返す
	 * @param args - 数値のリスト
	 * @returns 分散
	 * @throws {TypeError} 引数が空の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} ゼロ複素数で除算しようとした場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static variance(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * 引数の標準偏差を返す
	 * @param args - 数値のリスト
	 * @returns 標準偏差
	 * @throws {TypeError} 引数が空の場合
	 * @throws {RangeError} 負の数の平方根を計算しようとした場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {PrecisionMismatchError} 精度の不一致が許容されていない場合
	 * @throws {SyntaxError} 文字列が複素数表現として無効な場合
	 */
	static stddev(...args: BigFloatAggregateArgs): BigFloat;
	/**
	 * ランダムな整数値を生成する (内部用)
	 * @param precision - 精度
	 * @returns ランダムな値
	 */
	protected static _randomBigInt(precision: bigint): bigint;
	/**
	 * 0以上1未満のランダムなBigFloatを生成する
	 * @param precision - 精度
	 * @returns ランダムなBigFloat
	 * @throws {RangeError} 精度が 0 未満または MAX_PRECISION を超える場合
	 */
	static random(precision?: PrecisionValue): BigFloat;
	/**
	 * 数値積分を計算する (内部用)
	 * @param f - 関数
	 * @param a - 開始点
	 * @param b - 終了点
	 * @param n - 分割数
	 * @param precision - 精度
	 * @returns 積分結果
	 */
	protected static _integral(f: (k: bigint) => bigint, a: bigint, b: bigint, n: bigint, precision: bigint): bigint;
	/**
	 * 連続する整数の冪乗を計算する (内部用)
	 * (n * scale)^-s を n=1..N について計算する
	 * @param s - 指数
	 * @param N - 最大の整数
	 * @param precision - 精度
	 * @returns 冪乗の結果の配列 (1-indexed)
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _computePowers(s: bigint, N: number, precision: bigint): bigint[];
	/**
	 * ベルヌーイ数を生成する (内部用)
	 * @param n - 最大次数
	 * @param precision - 精度
	 * @returns ベルヌーイ数のリスト
	 */
	protected static _bernoulliNumbers(n: number, precision: bigint): bigint[];
	/**
	 * ln(2 * pi) を計算する (内部用)
	 * @param precision - 精度
	 * @returns ln(2 * pi)
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {RangeError} 値が0以下の場合
	 */
	protected static _ln2pi(precision: bigint): bigint;
	/**
	 * キャッシュ付きでベルヌーイ数を取得する
	 * @param n - 最大次数
	 * @param precision - 精度
	 * @returns ベルヌーイ数のリスト
	 */
	protected static _getBernoulliNumbers(n: number, precision: bigint): bigint[];
	/**
	 * 1 に近い zeta 引数に必要な追加精度を見積もる
	 * @param value - 値
	 * @param precision - 精度
	 * @returns 追加精度
	 */
	protected static _zetaPoleCancellationDigits(value: bigint, precision: bigint): bigint;
	/**
	 * 正の偶数整数に対する zeta 関数を計算する
	 * @param exponent - 偶数整数の指数
	 * @param precision - 精度
	 * @returns zeta(exponent)
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaPositiveEvenInteger(exponent: bigint, precision: bigint): bigint;
	/**
	 * 負の整数に対する zeta 関数を計算する
	 * @param absoluteInteger - 負の整数の絶対値
	 * @param precision - 精度
	 * @returns zeta(-absoluteInteger)
	 */
	protected static _zetaNegativeInteger(absoluteInteger: bigint, precision: bigint): bigint;
	/**
	 * Euler-Maclaurin 展開で zeta 関数を近似する
	 * @param s - 値
	 * @param precision - 精度
	 * @param terms - 直接和を取る項数
	 * @returns zeta(s) の近似値
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {RangeError} 値が0以下の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaEulerMaclaurinEstimate(s: bigint, precision: bigint, terms: number): bigint;
	/**
	 * s > 1 に対する zeta 関数を計算する
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s <= 1 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaPositive(s: bigint, precision: bigint): bigint;
	/**
	 * Dirichlet eta 関数を Euler 変換で計算して zeta 関数へ変換する
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s === 1 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zetaEta(s: bigint, precision: bigint): bigint;
	/**
	 * Riemann zeta 関数を計算する (内部用)
	 * @param s - 値
	 * @param precision - 精度
	 * @returns zeta(s)
	 * @throws {RangeError} s = 1 の場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _zeta(s: bigint, precision: bigint): bigint;
	/**
	 * ガンマ関数をStirlingの近似で計算する (内部用)
	 * @param z - 値
	 * @param precision - 精度
	 * @returns ガンマ関数
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	protected static _gammaLanczos(z: bigint, precision: bigint): bigint;
	/**
	 * ガンマ関数を計算する
	 * @returns ガンマ関数
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	gamma(): BigFloat;
	/**
	 * Riemann zeta 関数を計算する
	 * @returns zeta(this)
	 * @throws {RangeError} 特殊値が無効な設定で this = 1 の場合
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	zeta(): BigFloat;
	/**
	 * 階乗を計算する (内部用)
	 * @param n - 値
	 * @returns 階乗
	 */
	protected static _factorial(n: bigint): bigint;
	/**
	 * ガンマ関数を用いた階乗を計算する (内部用)
	 * @param n - 値
	 * @param precision - 精度
	 * @returns 階乗
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	protected static _factorialGamma(n: bigint, precision: bigint): bigint;
	/**
	 * 階乗を計算する
	 * @returns 階乗
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な設定で特殊値を扱おうとした場合
	 * @throws {RangeError} 負の整数の場合
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 * @throws {DivisionByZeroError} ゼロ除算が発生した場合
	 */
	factorial(): BigFloat;
	/**
	 * 二項係数を計算する (内部用)
	 * @param n - 全体数
	 * @param k - 選択数
	 * @returns 二項係数
	 */
	protected static _binomial(n: bigint, k: bigint): bigint;
	/**
	 * 円周率キャッシュが存在するか確認する (内部用)
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckPiCache(precision: bigint): boolean;
	/**
	 * 円周率キャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getPiCache(precision: bigint): bigint;
	/**
	 * 円周率キャッシュを更新する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updatePiCache(value: bigint, precision: bigint): void;
	/**
	 * eキャッシュが存在するか確認する (内部用)
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckECache(precision: bigint): boolean;
	/**
	 * eキャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getECache(precision: bigint): bigint;
	/**
	 * eキャッシュを更新する (内部用)
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updateECache(value: bigint, precision: bigint): void;
	/**
	 * 円周率の低精度キャッシュを取得する (内部用)
	 * @param precision - 必要精度
	 * @returns 低精度キャッシュ
	 */
	protected static _getPiSeedCache(precision: bigint): BigFloatCacheEntry | null;
	/**
	 * 対数キャッシュが存在するか確認する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns 存在する場合はtrue
	 */
	protected static _getCheckLnCache(key: string, precision: bigint): boolean;
	/**
	 * 対数キャッシュを取得する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns キャッシュされた値
	 * @throws {CacheNotInitializedError} キャッシュが存在しない場合
	 */
	protected static _getLnCache(key: string, precision: bigint): bigint;
	/**
	 * 対数キャッシュを更新する (内部用)
	 * @param key - キャッシュキー
	 * @param value - 値
	 * @param precision - 精度
	 */
	protected static _updateLnCache(key: string, value: bigint, precision: bigint): void;
	/**
	 * 対数の低精度キャッシュを取得する (内部用)
	 * @param key - キャッシュキー
	 * @param precision - 必要精度
	 * @returns 低精度キャッシュ
	 */
	protected static _getLnSeedCache(key: string, precision: bigint): BigFloatCacheEntry | null;
	/**
	 * キャッシュ値を別精度へ変換する
	 * @param value - 値
	 * @param fromPrecision - 元の精度
	 * @param toPrecision - 変換先の精度
	 * @returns 変換後の値
	 */
	protected static _rescaleInternalValue(value: bigint, fromPrecision: bigint, toPrecision: bigint): bigint;
	/**
	 * キャッシュされたpiを高精度へ補正する (Newton法を使用)
	 * @param seed - 低精度キャッシュ
	 * @param precision - 必要精度
	 * @returns 高精度化したpi
	 */
	protected static _refinePiFromCache(seed: BigFloatCacheEntry, precision: bigint): bigint;
	/**
	 * キャッシュされた対数定数を高精度へ補正する
	 * @param value - 対数を取る対象
	 * @param seed - 低精度キャッシュ
	 * @param precision - 必要精度
	 * @returns 高精度化した対数定数
	 */
	protected static _refineLogConstantFromCache(value: bigint, seed: BigFloatCacheEntry, precision: bigint): bigint;
	/**
	 * 5の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 5^n
	 */
	protected static _getPow5(n: bigint): bigint;
	/**
	 * 2の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 2^n
	 */
	protected static _getPow2(n: bigint): bigint;
	/**
	 * 10の累乗を取得する (キャッシュ付き)
	 * @param n - 指数
	 * @returns 10^n
	 */
	protected static _getPow10(n: bigint): bigint;
	/**
	 * 定数 NaN を取得する
	 * @param precision - 精度
	 * @returns NaN
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	static nan(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 Infinity を取得する
	 * @param precision - 精度
	 * @returns Infinity
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	static infinity(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -Infinity を取得する
	 * @param precision - 精度
	 * @returns -Infinity
	 * @throws {SpecialValuesDisabledError} 特殊値が無効な場合
	 */
	static negativeInfinity(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -10 を取得する
	 * @param precision - 精度
	 * @returns -10
	 */
	static minusTen(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -2 を取得する
	 * @param precision - 精度
	 * @returns -2
	 */
	static minusTwo(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 -1 を取得する
	 * @param precision - 精度
	 * @returns -1
	 */
	static minusOne(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 0 を取得する
	 * @param precision - 精度
	 * @returns 0
	 */
	static zero(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 0.25 を取得する
	 * @param precision - 精度
	 * @returns 0.25
	 */
	static quarter(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 0.5 を取得する
	 * @param precision - 精度
	 * @returns 0.5
	 */
	static half(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 1 を取得する
	 * @param precision - 精度
	 * @returns 1
	 */
	static one(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 2 を取得する
	 * @param precision - 精度
	 * @returns 2
	 */
	static two(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 10 を取得する
	 * @param precision - 精度
	 * @returns 10
	 */
	static ten(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 100 を取得する
	 * @param precision - 精度
	 * @returns 100
	 */
	static hundred(precision?: PrecisionValue): BigFloat;
	/**
	 * 定数 1000 を取得する
	 * @param precision - 精度
	 * @returns 1000
	 */
	static thousand(precision?: PrecisionValue): BigFloat;
}
/**
 * BigFloat を作成する
 * @param value - 初期値
 * @param precision - 精度
 * @returns BigFloat インスタンス
 */
export declare function bigFloat(value: BigFloatValue, precision?: PrecisionValue): BigFloat;
/**
 * BigFloat ライブラリ共通の基底エラークラス
 */
export declare class BigFloatError extends Error {
	/**
	 * BigFloatError コンストラクタ
	 * @param message - エラーメッセージ
	 * @param options - エラーオプション
	 * @returns BigFloatError インスタンス
	 */
	constructor(message?: string, options?: ErrorOptions);
}
/**
 * 特殊値が無効な設定で特殊値を扱おうとした場合のエラー
 */
export declare class SpecialValuesDisabledError extends BigFloatError {
}
/**
 * 精度不一致が許容されていない場合のエラー
 */
export declare class PrecisionMismatchError extends BigFloatError {
}
/**
 * BigFloat 上でゼロ除算が発生した場合のエラー
 */
export declare class DivisionByZeroError extends BigFloatError {
}
/**
 * 数値計算中に安定した結果を導けない場合のエラー
 */
export declare class NumericalComputationError extends BigFloatError {
}
/**
 * 必須キャッシュが初期化されていない場合のエラー
 */
export declare class CacheNotInitializedError extends BigFloatError {
}
/**
 * 行列やベクトルの次元が不一致の場合のエラー
 */
export declare class DimensionMismatchError extends BigFloatError {
}
/**
 * 行列が特異（逆行列が存在しない）場合のエラー
 */
export declare class SingularMatrixError extends BigFloatError {
}

export {};
