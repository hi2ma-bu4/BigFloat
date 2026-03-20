(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const JavaLibraryScriptCore = require("../libs/sys/JavaLibraryScriptCore");

/**
 * 単一のEnum要素を表すクラス
 * @extends {JavaLibraryScriptCore}
 * @class
 */
class _EnumItem extends JavaLibraryScriptCore {
	/**
	 * @param {string} name - Enumのキー名
	 * @param {number} ordinal - 順序番号（自動インクリメント）
	 * @param {any} value - 任意の値（name, 数値, オブジェクトなど）
	 * @param {_EnumCore} [owner] - Enumのインスタンス
	 * @param {{[methodName: string]: (...args: any[]) => any}} [methods] - Enumのメソッド
	 */
	constructor(name, ordinal, value = name, owner = null, methods = {}) {
		super();
		this.name = name;
		this.ordinal = ordinal;
		this.value = value;

		this.owner = owner;

		for (const [key, fn] of Object.entries(methods)) {
			if (typeof fn === "function") {
				this[key] = fn.bind(this);
			}
		}

		Object.freeze(this);
	}

	/**
	 * 名前を返す
	 * @returns {string}
	 */
	toString() {
		return this.name;
	}

	/**
	 * JSON化
	 * @returns {string}
	 */
	toJSON() {
		return this.name;
	}

	/**
	 * ordinalでの比較
	 * @param {this} other
	 * @returns {number}
	 */
	compareTo(other) {
		return this.ordinal - other.ordinal;
	}

	/**
	 * 同一EnumItemかチェック
	 * @param {this} other
	 * @returns {boolean}
	 */
	equals(other) {
		return other instanceof _EnumItem && this.name === other.name && this.ordinal === other.ordinal && this.value === other.value;
	}

	/**
	 * ハッシュコード生成（簡易）
	 * @returns {number}
	 */
	hashCode() {
		return this.name.split("").reduce((h, c) => h + c.charCodeAt(0), 0) + this.ordinal * 31;
	}
}

/**
 * Enum を生成するクラス
 * @extends {JavaLibraryScriptCore}
 * @class
 */
class _EnumCore extends JavaLibraryScriptCore {
	/**
	 * @param {Array<string | [string, any]> | Record<string, any>} defs - 定義
	 * @param {{[methodName: string]: (...args: any[]) => any}} [options.methods] - Enumのメソッド
	 */
	constructor(defs, options = {}) {
		super();
		/** @type {_EnumItem[]} */
		this._items = [];
		this._methods = options.methods || {};

		let entries;

		if (Array.isArray(defs)) {
			entries = defs.map((def) => (Array.isArray(def) ? def : [def, def]));
		} else if (typeof defs === "object" && defs !== null) {
			entries = Object.entries(defs);
		} else {
			throw new TypeError("Enum: 配列か連想配列で定義してください");
		}

		entries.forEach(([name, value], index) => {
			const item = new _EnumItem(name, index, value, this, this._methods);
			Object.defineProperty(this, name, {
				value: item,
				writable: false,
				configurable: false,
				enumerable: true,
			});
			this._items.push(item);
		});

		Object.freeze(this._items);
	}

	/**
	 * Enumの全要素を配列で取得
	 * @returns {_EnumItem[]}
	 */
	values() {
		return this._items.slice();
	}

	/**
	 * 名前からEnumItemを取得
	 * @param {string} name
	 * @returns {_EnumItem | undefined}
	 */
	valueOf(name) {
		return this[name];
	}
	/**
	 * 名前からEnumItemを取得
	 * @param {string} name
	 * @returns {_EnumItem | undefined}
	 */
	fromName = valueOf;

	/**
	 * 値からEnumItemを取得
	 * @param {any} value
	 * @returns {_EnumItem | undefined}
	 */
	fromValue(value) {
		return this._items.find((e) => e.value === value);
	}

	/**
	 * ordinalからEnumItemを取得
	 * @param {number} ordinal
	 * @returns {_EnumItem | undefined}
	 */
	fromOrdinal(ordinal) {
		return this._items.find((e) => e.ordinal === ordinal);
	}

	/**
	 * Enumにそのnameが存在するか
	 * @param {string} name
	 * @returns {boolean}
	 */
	has(name) {
		return typeof this[name] === "object" && this[name] instanceof _EnumItem;
	}

	/**
	 * name → _EnumItem の [name, item] 配列を返す
	 * @returns {[string, _EnumItem][]}
	 */
	entries() {
		return this._items.map((e) => [e.name, e]);
	}

	/**
	 * Enumの全nameを返す
	 * @returns {string[]}
	 */
	keys() {
		return this._items.map((e) => e.name);
	}

	/**
	 * name → value のマップを返す
	 * @returns {Record<string, any>}
	 */
	toMap() {
		const map = {};
		for (const e of this._items) {
			map[e.name] = e.value;
		}
		return map;
	}

	/**
	 * JSONシリアライズ用のtoJSONメソッド
	 * @returns {Array<{name: string, ordinal: number, value: any}>} 列挙子の配列
	 */
	toJSON() {
		return this._items.map((item) => item.toJSON());
	}

	/**
	 * for...of に対応
	 */
	*[Symbol.iterator]() {
		yield* this._items;
	}

	/**
	 * インデックス付きで列挙子を返すジェネレータ
	 * @returns {Generator<[number, _EnumItem]>} インデックスと列挙子のペア
	 */
	*enumerate() {
		for (let i = 0; i < this._items.length; i++) {
			yield [i, this._items[i]];
		}
	}
}

/**
 * DynamicEnum生成関数（インデックスアクセスに対応したProxy付き）
 * @param {Array<string | [string, any]> | Record<string, any>} defs
 * @param {{[methodName: string]: (...args: any[]) => any}} [options.methods] - Enumのメソッド
 * @returns {_EnumCore & Proxy}
 */
function Enum(defs, options = {}) {
	const core = new _EnumCore(defs, options);
	return new Proxy(core, {
		get(target, prop, receiver) {
			if (typeof prop === "string" && /^[0-9]+$/.test(prop)) {
				const index = Number(prop);
				return target._items[index];
			}
			return Reflect.get(target, prop, receiver);
		},

		enumerate(target) {
			// 数字のインデックスを除外
			return Object.keys(target._items).map((i) => i.toString());
		},

		has(target, prop) {
			if (typeof prop === "string" && /^[0-9]+$/.test(prop)) {
				const index = Number(prop);
				return index >= 0 && index < target._items.length;
			}
			return prop in target;
		},

		ownKeys(target) {
			const keys = Reflect.ownKeys(target);
			const indexes = target._items.map((_, i) => i.toString());
			return [...keys, ...indexes];
		},

		getOwnPropertyDescriptor(target, prop) {
			if (typeof prop === "string" && /^[0-9]+$/.test(prop)) {
				// プロパティがターゲットに存在するか確認
				if (prop in target._items) {
					return {
						value: target._items[Number(prop)],
						writable: false,
						configurable: false,
						enumerable: true,
					};
				} else {
					// プロパティが存在しない場合はエラーを避ける
					return undefined; // これでエラーを避ける
				}
			}
			return Object.getOwnPropertyDescriptor(target, prop);
		},

		set(target, prop, value) {
			throw new TypeError(`Enumは変更できません: ${String(prop)} = ${value}`);
		},

		defineProperty(target, prop, descriptor) {
			throw new TypeError(`Enumにプロパティを追加/変更できません: ${String(prop)}`);
		},

		deleteProperty(target, prop) {
			throw new TypeError(`Enumのプロパティを削除できません: ${String(prop)}`);
		},
	});
}

module.exports = {
	_EnumItem,
	_EnumCore,
	Enum,
};

},{"../libs/sys/JavaLibraryScriptCore":11}],2:[function(require,module,exports){
const JavaLibraryScriptCore = require("../libs/sys/JavaLibraryScriptCore");
const { logging } = require("../libs/sys/Logger");
const TypeChecker = require("../libs/TypeChecker");
const { _EnumItem, Enum } = require("./Enum");

/**
 * @typedef {{throw: _EnumItem, log: _EnumItem, ignore: _EnumItem}} ErrorModeItem
 */

/**
 * @typedef {Object} InterfaceTypeData
 * @property {Function[] | null} [args] - 引数の型定義
 * @property {Function | Function[] | null} [returns] - 戻り値の型定義
 * @property {boolean} [abstract=true] - 抽象クラス化
 */

/**
 * @typedef {Object.<string, InterfaceTypeData>} InterfaceTypeDataList
 */

/**
 * インターフェイス管理
 * @extends {JavaLibraryScriptCore}
 * @class
 */
class Interface extends JavaLibraryScriptCore {
	/**
	 * デバッグモード
	 * @type {boolean}
	 * @static
	 */
	static isDebugMode = false;

	/**
	 * エラーモード
	 * @type {ErrorModeItem}
	 * @static
	 * @readonly
	 */
	static ErrorMode = Enum(["throw", "log", "ignore"]);

	/**
	 * エラーモード
	 * @type {ErrorModeItem}
	 * @static
	 */
	static _errorMode = this.ErrorMode.throw;

	/**
	 * エラーモード設定
	 * @param {ErrorModeItem} mode - エラーモード
	 * @static
	 */
	static setErrorMode(mode) {
		if (!this.ErrorMode.has(mode)) throw new Error(`不正な errorMode: ${mode}`);
		this._errorMode = mode;
	}

	/**
	 * エラー処理
	 * @param {typeof Error} error
	 * @param {string} message - エラーメッセージ
	 * @returns {undefined}
	 * @throws {Error}
	 * @static
	 */
	static _handleError(error, message) {
		const ErrorMode = this.ErrorMode;
		switch (this._errorMode) {
			case ErrorMode.throw:
				throw new error(message);
			case ErrorMode.log:
				logging.warn("[Interface Warning]", message);
				break;
			case ErrorMode.ignore:
				break;
		}
	}

	/**
	 * 型定義
	 * @param {Function} TargetClass - 型定義を追加するクラス
	 * @param {InterfaceTypeDataList} [newMethods] - 追加するメソッド群
	 * @param {Object} [opt] - オプション
	 * @param {boolean} [opt.inherit=true] - 継承モード
	 * @returns {undefined}
	 * @static
	 */
	static applyTo(TargetClass, newDefs = {}, { inherit = true } = {}) {
		const proto = TargetClass.prototype;

		// 継承モードなら親の型定義をマージ
		let inheritedDefs = {};
		if (inherit) {
			const parentProto = Object.getPrototypeOf(proto);
			if (parentProto && parentProto.__interfaceTypes) {
				inheritedDefs = { ...parentProto.__interfaceTypes };
			}
		}

		// クラスの型定義ストレージを用意 or 上書き
		if (!proto.__interfaceTypes) {
			Object.defineProperty(proto, "__interfaceTypes", {
				value: {},
				configurable: false,
				writable: false,
				enumerable: false,
			});
		}

		// 継承＋新規定義マージ（子定義優先）
		Object.assign(proto.__interfaceTypes, inheritedDefs, newDefs);
	}

	/**
	 * 型定義とメゾットの強制実装
	 * @template T
	 * @param {new (...args: any[]) => T} TargetClass - 型定義を追加するクラス
	 * @param {InterfaceTypeDataList} [newMethods] - 追加するメソッド群
	 * @param {Object} [opt] - オプション
	 * @param {boolean} [opt.inherit=true] - 継承モード
	 * @param {boolean} [opt.abstract=true] - 抽象クラス化
	 * @returns {new (...args: any[]) => T}
	 * @static
	 */
	static convert(TargetClass, newDefs = {}, { inherit = true, abstract = true } = {}) {
		this.applyTo(TargetClass, newDefs, { inherit });

		const this_ = this;

		const interfaceClass = class extends TargetClass {
			constructor(...args) {
				if (abstract) {
					if (new.target === interfaceClass) {
						new TypeError(`Cannot instantiate abstract class ${TargetClass.name}`);
					}
				}
				super(...args);

				if (!Interface.isDebugMode) return;

				const proto = Object.getPrototypeOf(this);
				const defs = proto.__interfaceTypes || {};

				for (const methodName of Object.keys(defs)) {
					const def = defs[methodName];
					const original = this[methodName];
					const isAbstract = !!def.abstract;

					if (typeof original !== "function") {
						if (isAbstract) continue;
						this_._handleError(Error, `"${this.constructor.name}" はメソッド "${methodName}" を実装する必要があります`);
						return;
					}

					// ラップは一度だけ（重複防止）
					if (!original.__isWrapped) {
						const wrapped = (...args) => {
							// 引数チェック
							const expectedArgs = def.args || [];
							for (let i = 0; i < expectedArgs.length; i++) {
								if (!TypeChecker.matchType(args[i], expectedArgs[i])) {
									this_._handleError(TypeError, `"${this.constructor.name}.${methodName}" 第${i + 1}引数: ${TypeChecker.typeNames(expectedArgs[i])} を期待 → 実際: ${TypeChecker.stringify(args[i])}`);
								}
							}

							const result = original.apply(this, args);
							const expectedReturn = TypeChecker.checkFunction(def.returns) ? def.returns(args) : def.returns;

							const validate = (val) => {
								if (!TypeChecker.matchType(val, expectedReturn)) {
									if (expectedReturn === TypeChecker.NoReturn) {
										this_._handleError(TypeError, `"${this.constructor.name}.${methodName}" は戻り値を返してはいけません → 実際: ${TypeChecker.stringify(val)}`);
									} else {
										this_._handleError(TypeError, `"${this.constructor.name}.${methodName}" の戻り値: ${TypeChecker.typeNames(expectedReturn)} を期待 → 実際: ${TypeChecker.stringify(val)}`);
									}
								}
								return val;
							};

							return result instanceof Promise ? result.then(validate) : validate(result);
						};
						wrapped.__isWrapped = true;
						this[methodName] = wrapped;
					}
				}
			}
		};

		Object.defineProperty(interfaceClass, "name", { value: TargetClass.name });

		return interfaceClass;
	}

	/**
	 * 抽象メソッドが未実装かを個別に検査
	 * @param {Object} instance
	 * @returns {boolean}
	 */
	static isAbstractImplemented(instance) {
		const proto = Object.getPrototypeOf(instance);
		const defs = proto.__interfaceTypes || {};

		for (const [methodName, def] of Object.entries(defs)) {
			if (!def.abstract) continue;
			if (typeof instance[methodName] !== "function") return false;
		}
		return true;
	}

	/**
	 * 型定義を取得
	 * @param {Function|Object} ClassOrInstance
	 * @returns {InterfaceTypeDataList}
	 * @static
	 */
	static getDefinition(ClassOrInstance) {
		const proto = typeof ClassOrInstance === "function" ? ClassOrInstance.prototype : Object.getPrototypeOf(ClassOrInstance);
		return proto.__interfaceTypes || {};
	}

	/**
	 * 型定義を文字列化
	 * @param {Function|Object} ClassOrInstance
	 * @returns {string}
	 * @static
	 */
	static describe(ClassOrInstance) {
		const defs = this.getDefinition(ClassOrInstance);
		const lines = [];
		for (const [name, def] of Object.entries(defs)) {
			const argsStr = (def.args || []).map((t) => TypeChecker.typeNames(t)).join(", ");
			const retStr = TypeChecker.typeNames(def.returns);
			lines.push(`${def.abstract ? "abstract " : ""}function ${name}(${argsStr}) → ${retStr}`);
		}
		return lines.join("\n");
	}

	/**
	 * メソッド名を取得
	 * @param {Function|Object} ClassOrInstance
	 * @param {Object} [opt]
	 * @param {boolean} [opt.abstractOnly=false]
	 * @returns {string[]}
	 * @static
	 */
	static getMethodNames(ClassOrInstance, { abstractOnly = false } = {}) {
		const defs = this.getDefinition(ClassOrInstance);
		return Object.entries(defs)
			.filter(([_, def]) => !abstractOnly || def.abstract)
			.map(([name]) => name);
	}

	/**
	 * メソッド定義を取得
	 * @param {Function|Object} classOrInstance
	 * @param {string} methodName
	 * @returns {InterfaceTypeData | null}
	 * @static
	 */
	static getExpectedSignature(classOrInstance, methodName) {
		const defs = this.getDefinition(classOrInstance);
		if (!(methodName in defs)) return null;
		return {
			args: defs[methodName].args,
			returns: defs[methodName].returns,
			abstract: !!defs[methodName].abstract,
		};
	}

	/**
	 * 型定義を結合
	 * @param {...InterfaceTypeDataList} defs
	 * @returns {InterfaceTypeDataList}
	 * @static
	 */
	static merge(...defs) {
		const result = {};
		for (const def of defs) {
			Object.assign(result, def);
		}
		return result;
	}
}

module.exports = Interface;

},{"../libs/TypeChecker":7,"../libs/sys/JavaLibraryScriptCore":11,"../libs/sys/Logger":12,"./Enum":1}],3:[function(require,module,exports){
module.exports = {
    ...require("./Enum.js"),
    Interface: require("./Interface.js")
};

},{"./Enum.js":1,"./Interface.js":2}],4:[function(require,module,exports){
module.exports = {
    base: require("./base/index.js"),
    libs: require("./libs/index.js"),
    math: require("./math/index.js"),
    util: require("./util/index.js")
};

},{"./base/index.js":3,"./libs/index.js":10,"./math/index.js":18,"./util/index.js":25}],5:[function(require,module,exports){
const SymbolDict = require("./sys/symbol/SymbolDict");
const JavaLibraryScriptCore = require("./sys/JavaLibraryScriptCore");
const ProxyManager = require("./ProxyManager");
const TypeChecker = require("./TypeChecker");

/** @type {Symbol} */
const instanceofTarget = SymbolDict.instanceofTarget;

/**
 * Index参照機能を提供する
 * @template T
 * @extends {JavaLibraryScriptCore}
 * @class
 */
class IndexProxy extends JavaLibraryScriptCore {
	/**
	 * @param {new (...args: any[]) => T} targetClass
	 * @param {{getMethod?: string, setMethod?: string, sizeMethod?: string, addMethod?: string, typeCheckMethod?: string | null, autoExtend?: boolean}} options
	 */
	constructor(targetClass, { getMethod = "get", setMethod = "set", sizeMethod = "size", addMethod = "add", typeCheckMethod = null, autoExtend = true } = {}) {
		super();
		this._TargetClass = targetClass;
		this._config = {
			getMethod,
			setMethod,
			sizeMethod,
			addMethod,
			typeCheckMethod,
			autoExtend,
		};
		this._cachedMethods = {
			get: null,
			set: null,
			size: null,
			add: null,
			typeCheck: null,
		};
	}

	/**
	 * @param {...any} args
	 * @returns {T}
	 */
	create(...args) {
		const target = new this._TargetClass(...args);
		const class_name = TypeChecker.typeNames(this._TargetClass);

		const cfg = this._config;
		const m = this._cachedMethods;

		if (typeof target[cfg.getMethod] !== "function") {
			throw new TypeError(`${class_name}.${cfg.getMethod}(index) メソッドが必要です。`);
		}
		if (typeof target[cfg.setMethod] !== "function") {
			throw new TypeError(`${class_name}.${cfg.setMethod}(index, value) メソッドが必要です。`);
		}
		m.get = target[cfg.getMethod].bind(target);
		m.set = target[cfg.setMethod].bind(target);

		// sizeは関数かgetterか判定
		const sizeVal = target[cfg.sizeMethod];
		if (typeof sizeVal === "function") {
			m.size = sizeVal.bind(target);
		} else if (typeof sizeVal === "number") {
			// getterはbind不要なので関数化
			m.size = () => target[cfg.sizeMethod];
		} else {
			throw new TypeError(`${class_name}.${cfg.sizeMethod}() メソッドまたは、${class_name}.${cfg.sizeMethod} getterが必要です。`);
		}

		if (typeof target[cfg.addMethod] === "function") {
			m.add = target[cfg.addMethod].bind(target);
		} else if (this._config.autoExtend) {
			throw new TypeError(`${this._TargetClass}.${cfg.addMethod}(item) メソッドが必要です。範囲外追加を許容しない場合はautoExtendをfalseにしてください。`);
		}
		if (typeof target[cfg.typeCheckMethod] === "function") {
			m.typeCheck = target[cfg.typeCheckMethod].bind(target);
		}

		return new Proxy(target, {
			get: (t, prop, r) => {
				if (!isNaN(prop)) {
					return m.get(Number(prop));
				}
				return ProxyManager.over_get(t, prop, r);
			},
			set: (t, prop, val, r) => {
				if (!isNaN(prop)) {
					const i = Number(prop);
					if (m.typeCheck) {
						m.typeCheck(val);
					}
					const size = m.size();

					if (i < size) {
						m.set(i, val);
					} else if (i === size && this._config.autoExtend) {
						m.add(val);
					} else {
						throw new RangeError(`インデックス ${i} は無効です（サイズ: ${size}）`);
					}
					return true;
				}
				return Reflect.set(t, prop, val, r);
			},
			has: (t, prop) => {
				if (!isNaN(prop)) {
					const i = Number(prop);
					const size = m.size();
					return i >= 0 && i < size;
				}
				return prop in t;
			},
		});
	}

	/**
	 * インスタンス化時に初期データを設定する
	 * @template C
	 * @param {C} targetInstance
	 */
	static defineInitData(targetInstance) {
		Object.defineProperty(targetInstance, instanceofTarget, {
			value: targetInstance,
			enumerable: false,
			writable: false,
		});
	}

	/**
	 * [Symbol.hasInstance]の処理を自動化
	 * @template S, C
	 * @param {new (...args: any[]) => S} targetClass - 多くの場合、this
	 * @param {C} otherInstance
	 */
	static hasInstance(targetClass, otherInstance) {
		const target = otherInstance?.[instanceofTarget];
		return typeof target === "object" && target !== null && targetClass.prototype.isPrototypeOf(target);
	}
}

module.exports = IndexProxy;

},{"./ProxyManager":6,"./TypeChecker":7,"./sys/JavaLibraryScriptCore":11,"./sys/symbol/SymbolDict":14}],6:[function(require,module,exports){
const JavaLibraryScriptCore = require("./sys/JavaLibraryScriptCore");

/**
 * プロキシマネージャー
 * @class
 */
class ProxyManager extends JavaLibraryScriptCore {
	/**
	 * getのreturnのオーバーライド
	 * @param {any} target
	 * @param {any} prop
	 * @param {any} receiver
	 * @returns {any}
	 */
	static over_get(target, prop, receiver) {
		switch (prop) {
			case "toString":
				return () => `Proxy(${target.toString()})`;
		}
		return Reflect.get(target, prop, receiver);
	}
}

module.exports = ProxyManager;

},{"./sys/JavaLibraryScriptCore":11}],7:[function(require,module,exports){
const SymbolDict = require("../libs/sys/symbol/SymbolDict");
const JavaLibraryScriptCore = require("../libs/sys/JavaLibraryScriptCore");
const { _EnumCore, _EnumItem } = require("../base/Enum");

/**
 * 型チェッカー
 * @extends {JavaLibraryScriptCore}
 * @class
 */
class TypeChecker extends JavaLibraryScriptCore {
	static _CLASS_REG = /^\s*class\s+/;

	// ==================================================
	/**
	 * Typeの否定
	 * @extends {JavaLibraryScriptCore}
	 * @class
	 * @static
	 */
	static _NotType = class _NotType extends JavaLibraryScriptCore {
		/**
		 * @param {Function | Function[]} typeToExclude
		 */
		constructor(typeToExclude) {
			super();
			if (typeToExclude instanceof TypeChecker._NotType) throw new TypeError("typeToExclude must be instance of NotType");
			this.typeToExclude = typeToExclude;
		}
	};

	/**
	 * 否定型を返す
	 * @param {Function | Function[]} typeToExclude
	 * @returns {TypeChecker._NotType}
	 */
	static NotType(typeToExclude) {
		return new TypeChecker._NotType(typeToExclude);
	}
	// ==================================================

	/**
	 * 任意の型
	 * @type {Symbol}
	 * @static
	 * @readonly
	 */
	static Any = SymbolDict.TypeAny;
	/**
	 * 返り値を返さない関数の型
	 * @type {Symbol}
	 * @static
	 * @readonly
	 */
	static Void = SymbolDict.TypeVoid;
	/**
	 * 返り値を返さない関数の型
	 * @type {Symbol}
	 * @static
	 * @readonly
	 */
	static NoReturn = this.Void;

	/**
	 * null以外の型
	 * @type {TypeChecker._NotType}
	 * @static
	 * @readonly
	 */
	static NotNull = this.NotType(null);
	/**
	 * undefined以外の型
	 * @type {TypeChecker._NotType}
	 * @static
	 * @readonly
	 */
	static NotUndefined = this.NotType(undefined);

	// ==================================================

	/**
	 * 型チェック(一括)
	 * @param {any} value
	 * @param {Function} expected
	 * @returns {boolean}
	 * @static
	 */
	static matchType(value, expected) {
		if (Array.isArray(expected)) {
			const notTypes = expected.filter((t) => t instanceof this._NotType);
			const isNotExcluded = notTypes.some((t) => this.checkType(value, t.typeToExclude));
			if (isNotExcluded) return false;
			const notExcluded = expected.filter((t) => !(t instanceof this._NotType));
			if (notExcluded.length === 0) return true;
			return notExcluded.some((e) => this.checkType(value, e));
		}
		return this.checkType(value, expected);
	}

	/**
	 * 型チェック(個別)
	 * @param {any} value
	 * @param {Function} expected
	 * @returns {boolean}
	 * @static
	 */
	static checkType(value, expected) {
		if (expected instanceof this._NotType) {
			// 除外型なので、valueが除外型にマッチしたらfalse
			return !this.checkType(value, expected.typeToExclude);
		}
		if (expected === this.Any) return true;
		if (expected === this.NoReturn) return value === undefined;
		if (expected === null) return value === null;
		if (expected === undefined) return value === undefined;
		if (expected === String || expected === Number || expected === Boolean || expected === Symbol || expected === Function || expected === BigInt) return typeof value === expected.name.toLowerCase();
		if (expected === Object) return typeof value === "object" && value !== null && !Array.isArray(value);
		if (expected === Array) return Array.isArray(value);
		// ----- Enum対応
		if (expected instanceof _EnumCore) {
			// Enumの場合
			return expected.has(value?.name);
		}
		if (expected === _EnumItem) return value instanceof _EnumItem;
		// -----
		if (typeof expected === "function") return value instanceof expected;
		return false;
	}

	/**
	 * 型を取得する
	 * @param {any} value
	 * @returns {Function | null}
	 */
	static getType(value) {
		if (value === null) return null;
		if (value === undefined) return undefined;
		const type = typeof value;
		switch (type) {
			case "string":
				return String;
			case "number":
				return Number;
			case "boolean":
				return Boolean;
			case "symbol":
				return Symbol;
			case "function":
				return Function;
			case "bigint":
				return BigInt;
			case "object":
				if (Array.isArray(value)) return Array;
				return value.constructor;
		}
		throw new TypeError(`TypeChecker: getType()に対応していない型:${type}`);
	}

	/**
	 * 型名を取得
	 * @param {Function} expected
	 * @returns {string}
	 * @static
	 */
	static typeNames(expected) {
		if (Array.isArray(expected)) return expected.map((t) => t?.name || TypeChecker.stringify(t)).join(" | ");
		return expected?.name || TypeChecker.stringify(expected);
	}

	/**
	 * 値を文字列に変換
	 * @param {any} value
	 * @returns {string}
	 * @static
	 */
	static stringify(value) {
		if (value === null || value === undefined) {
			return String(value);
		}
		if (typeof value === "symbol") {
			switch (value) {
				case this.Any:
					return "Any";
				case this.NoReturn:
				case this.Void:
					return "NoReturn";
			}
		}
		if (typeof value === "object") {
			if (value?.toString() !== "[object Object]") {
				return String(value);
			}
			if (value instanceof this._NotType) {
				return `NotType(${TypeChecker.stringify(value.typeToExclude)})`;
			}
			try {
				const jsonString = JSON.stringify(
					value,
					(key, val) => {
						if (val && typeof val === "object") {
							const size = Object.keys(val).length;
							// オブジェクトが大きすぎる場合は省略表示
							if (size > 5) {
								return `Object with ${size} properties`;
							}
						}
						return val;
					},
					0
				);
				// JSON.stringifyエラー時にfallback
				if (jsonString === undefined) {
					return "Object is too large to display or contains circular references";
				}

				return jsonString.length > 1000 ? "Object is too large to display" : jsonString; // 文字数が多すぎる場合は省略
			} catch (e) {
				return `[オブジェクト表示エラー: ${e.message}]`; // サークル参照等のエラー防止
			}
		}
		return String(value); // それ以外の型はそのまま文字列に変換
	}

	/**
	 * 関数かチェック
	 * @param {any} fn
	 * @returns {boolean}
	 * @static
	 */
	static checkFunction(fn) {
		if (typeof fn !== "function") return false;
		if (this.checkClass(fn)) return false;
		return true;
	}

	/**
	 * クラスかチェック
	 * @param {any} fn
	 * @returns {boolean}
	 * @static
	 */
	static checkClass(fn) {
		if (typeof fn !== "function") return false;
		if (this._CLASS_REG.test(fn.toString())) return true;
		if (fn === Function) return true;
		try {
			new new Proxy(fn, { construct: () => ({}) })();
			return true;
		} catch {
			return false;
		}
	}
}

module.exports = TypeChecker;

},{"../base/Enum":1,"../libs/sys/JavaLibraryScriptCore":11,"../libs/sys/symbol/SymbolDict":14}],8:[function(require,module,exports){
const JavaLibraryScriptCore = require("../sys/JavaLibraryScriptCore");
const Interface = require("../../base/Interface");
const TypeChecker = require("../TypeChecker");

/**
 * キャッシュのオプション
 * @typedef {{ whitelist: string[] | null, blacklist: string[], maxSize: number, policy: CacheMapInterface }} CacheWrapperOptions
 */

/**
 * キャッシュ用のマップ
 * @class
 * @abstract
 * @interface
 */
class CacheMapInterface extends JavaLibraryScriptCore {
	/**
	 * @param {number} limit
	 */
	constructor(limit) {
		super();
		this._limit = limit;
		this._cache = new Map();
	}
}

const Any = TypeChecker.Any;
const NoReturn = TypeChecker.NoReturn;

CacheMapInterface = Interface.convert(CacheMapInterface, {
	get: { args: [String], returns: Any },
	set: { args: [String, Any], returns: NoReturn },
	has: { args: [String], returns: Boolean },
	clear: { returns: NoReturn },
});

/**
 * FIFOキャッシュ
 * @class
 */
class FIFOCache extends CacheMapInterface {
	constructor(limit) {
		super(limit);
	}
	/**
	 * キーに対応する値を返却する
	 * @param {string} key
	 * @returns {any}
	 */
	get(key) {
		return this._cache.get(key);
	}
	/**
	 * キーに対応する値を設定する
	 * @param {string} key
	 * @param {any} value
	 */
	set(key, value) {
		const c = this._cache;
		if (!c.has(key) && c.size >= this._limit) {
			const firstKey = c.keys().next().value;
			c.delete(firstKey);
		}
		c.set(key, value);
	}
	/**
	 * キーの存在を確認する
	 * @param {string} key
	 * @returns {boolean}
	 */
	has(key) {
		return this._cache.has(key);
	}
	/**
	 * キャッシュをクリアする
	 */
	clear() {
		this._cache.clear();
	}
}

/**
 * LFUキャッシュ
 * @class
 */
class LFUCache extends CacheMapInterface {
	/**
	 * @param {number} limit
	 */
	constructor(limit) {
		super(limit);
		this._freq = new Map(); // 使用回数追跡
	}
	/**
	 * キーに対応する値を返却する
	 * @param {string} key
	 * @returns {any}
	 */
	get(key) {
		const c = this._cache;
		if (!c.has(key)) return undefined;
		const freq = this.freq;
		freq.set(key, (freq.get(key) || 0) + 1);
		return c.get(key);
	}
	/**
	 * キーに対応する値を設定する
	 * @param {string} key
	 * @param {any} value
	 */
	set(key, value) {
		const c = this._cache;
		const freq = this._freq;
		if (!c.has(key) && c.size >= this._limit) {
			let leastUsedKey = null;
			let minFreq = Infinity;
			for (const k of c.keys()) {
				const f = freq.get(k) || 0;
				if (f < minFreq) {
					minFreq = f;
					leastUsedKey = k;
				}
			}
			if (leastUsedKey !== null) {
				c.delete(leastUsedKey);
				freq.delete(leastUsedKey);
			}
		}

		c.set(key, value);
		freq.set(key, (freq.get(key) || 0) + 1);
	}
	/**
	 * キーの存在を確認する
	 * @param {string} key
	 * @returns {boolean}
	 */
	has(key) {
		return this._cache.has(key);
	}
	/**
	 * キャッシュをクリアする
	 */
	clear() {
		this._cache.clear();
		this._freq.clear();
	}
}

/**
 * LRUキャッシュ
 * @class
 */
class LRUCache extends CacheMapInterface {
	/**
	 * @param {number} limit
	 */
	constructor(limit) {
		super(limit);
	}
	/**
	 * キーに対応する値を返却する
	 * @param {string} key
	 * @returns {any}
	 */
	get(key) {
		const c = this._cache;
		if (!c.has(key)) return undefined;
		const val = c.get(key);
		c.delete(key);
		c.set(key, val);
		return val;
	}
	/**
	 * キーに対応する値を設定する
	 * @param {string} key
	 * @param {any} val
	 */
	set(key, val) {
		const c = this._cache;
		if (c.has(key)) c.delete(key);
		else if (c.size === this._limit) {
			const oldestKey = c.keys().next().value;
			c.delete(oldestKey);
		}
		c.set(key, val);
	}
	/**
	 * キーの存在を確認する
	 * @param {string} key
	 * @returns {boolean}
	 */
	has(key) {
		return this._cache.has(key);
	}
	/**
	 * キャッシュをクリアする
	 */
	clear() {
		this._cache.clear();
	}
}

/**
 * クラスのstaticメゾットをキャッシュするクラス
 * @template T
 * @class
 */
class CacheWrapper extends JavaLibraryScriptCore {
	/**
	 * 先入れ先出し
	 * @type {FIFOCache}
	 * @static
	 * @readonly
	 */
	static POLICY_FIFO = FIFOCache;
	/**
	 * 最頻出順
	 * @type {LFUCache}
	 * @static
	 * @readonly
	 */
	static POLICY_LFU = LFUCache;
	/**
	 * 最近使った順
	 * @type {LRUCache}
	 * @static
	 * @readonly
	 */
	static POLICY_LRU = LRUCache;

	/**
	 * @type {WeakMap<object, number>}
	 * @static
	 * @readonly
	 */
	static _objectIdMap = new WeakMap();
	/**
	 * @type {number}
	 * @static
	 */
	static _objectIdCounter = 1;

	/**
	 * MurmurHash3 32bit ハッシュ関数 (36進数)
	 * @see https://github.com/garycourt/murmurhash-js/blob/master/murmurhash3_gc.js
	 * @param {string} key
	 * @param {number} [seed=0]
	 * @returns {string}
	 * @static
	 */
	static _murmurhash3_32_gc(key, seed = 0) {
		const key_len = key.length;
		let remainder = key_len & 3;
		let bytes = key_len - remainder;
		let h1 = seed;
		let c1 = 0xcc9e2d51;
		let c2 = 0x1b873593;
		let i = 0;

		while (i < bytes) {
			let k1 = (key.charCodeAt(i) & 0xff) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24);
			i += 4;

			k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

			h1 ^= k1;
			h1 = (h1 << 13) | (h1 >>> 19);
			const h1b = ((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
			h1 = (h1b & 0xffff) + 0x6b64 + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
		}

		let k1 = 0;
		switch (remainder) {
			case 3:
				k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
			case 2:
				k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
			case 1:
				k1 ^= key.charCodeAt(i) & 0xff;
				k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
				k1 = (k1 << 15) | (k1 >>> 17);
				k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
				h1 ^= k1;
		}

		h1 ^= key_len;

		// fmix(h1)
		h1 ^= h1 >>> 16;
		h1 = ((h1 & 0xffff) * 0x85ebca6b + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= h1 >>> 13;
		h1 = ((h1 & 0xffff) * 0xc2b2ae35 + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= h1 >>> 16;

		return (h1 >>> 0).toString(36);
	}

	/**
	 * オブジェクトのIDを返す
	 * @param {Object} obj
	 * @returns {number}
	 * @static
	 */
	static _getObjectId(obj) {
		const oim = this._objectIdMap;
		if (!oim.has(obj)) {
			oim.set(obj, this._objectIdCounter++);
		}
		return oim.get(obj);
	}
	/**
	 * オブジェクトを文字列(key)に変換する
	 * @param {Object} obj
	 * @returns {string}
	 * @static
	 */
	static _toStringObject(obj) {
		if (obj === null) return "null";
		const type = typeof obj;
		if (type === "object" || type === "function") {
			return `#id:${this._getObjectId(obj)}`;
		}
		if (type === "bigint") {
			return `#bigint:${obj.toString()}`;
		}
		return `${type}:${String(obj)}`;
	}
	/**
	 * オブジェクト配列を文字列(key)に変換する
	 * @param {Object[]} args
	 * @returns {string}
	 * @static
	 */
	static _identityHash(args) {
		const key = args.map(this._toStringObject.bind(this)).join("|");
		return this._murmurhash3_32_gc(key);
	}

	static isGeneratorObject(obj) {
		if (!obj || !obj.constructor) return false;
		return obj.constructor.name === "Generator" || obj.constructor.name === "GeneratorFunction" || obj.constructor.name === "AsyncGenerator";
	}

	/**
	 * クラスを変換する
	 * @template T
	 * @param {new (...args: any[]) => T} BaseClass - 変換するクラス
	 * @param {CacheWrapperOptions} options
	 * @static
	 */
	static convert(BaseClass, { whitelist = null, blacklist = [], maxSize = 100, policy = LRUCache } = {}) {
		/** @type {Set<string> | null} */
		whitelist = whitelist && new Set(whitelist);
		/** @type {Set<string>} */
		blacklist = new Set(blacklist);

		if (!policy || !(policy.prototype instanceof CacheMapInterface)) throw new TypeError("policy must be instance of CacheMapInterface");

		// キャッシュを有効化するかどうか
		function _isCacheEnabled(methodName) {
			if (whitelist) return whitelist.has(methodName);
			return !blacklist.has(methodName);
		}

		const methodCaches = new Map();

		/** @type {typeof CacheWrapper} */
		const thisClass = this;

		const Wrapped = class extends BaseClass {
			static __clearCache(methodName) {
				if (methodName) {
					methodCaches.get(methodName)?.clear();
				} else {
					methodCaches.forEach((c) => c.clear());
				}
			}
			static __getCache(methodName) {
				return methodCaches.get(methodName);
			}
			static __getCacheDict() {
				return Object.fromEntries(methodCaches);
			}
			static __getCacheSize() {
				let sum = 0;
				for (const cache of methodCaches.values()) {
					sum += cache._cache.size;
				}
				return sum;
			}
		};

		const staticProps = Object.getOwnPropertyNames(BaseClass).filter((name) => {
			const fn = BaseClass[name];
			const isFunc = typeof fn === "function";
			const isGen = fn?.constructor?.name === "GeneratorFunction" || fn?.constructor?.name === "AsyncGeneratorFunction";
			return isFunc && !isGen && _isCacheEnabled(name);
		});

		for (const name of staticProps) {
			const original = BaseClass[name];
			const cache = new policy(maxSize);
			methodCaches.set(name, cache);

			Wrapped[name] = function (...args) {
				if (args.some(thisClass.isGeneratorObject)) {
					return original.apply(this, args);
				}

				const key = thisClass._identityHash(args);
				if (cache.has(key)) return cache.get(key);
				const result = original.apply(this, args);

				if (thisClass.isGeneratorObject(result)) {
					caches.delete(name);
					Wrapped[name] = original;
					return result;
				}
				cache.set(key, result);
				return result;
			};
		}

		Object.defineProperty(Wrapped, "name", { value: BaseClass.name });

		return Wrapped;
	}
}

module.exports = {
	CacheMapInterface,
	LRUCache,
	FIFOCache,
	LFUCache,
	CacheWrapper,
};

},{"../../base/Interface":2,"../TypeChecker":7,"../sys/JavaLibraryScriptCore":11}],9:[function(require,module,exports){
module.exports = {
    ...require("./CacheWrapper.js")
};

},{"./CacheWrapper.js":8}],10:[function(require,module,exports){
module.exports = {
    IndexProxy: require("./IndexProxy.js"),
    ProxyManager: require("./ProxyManager.js"),
    TypeChecker: require("./TypeChecker.js"),
    cache: require("./cache/index.js"),
    sys: require("./sys/index.js")
};

},{"./IndexProxy.js":5,"./ProxyManager.js":6,"./TypeChecker.js":7,"./cache/index.js":9,"./sys/index.js":13}],11:[function(require,module,exports){
const SymbolDict = require("./symbol/SymbolDict");

/**
 * JavaLibraryScriptの共通継承元
 * @class
 */
class JavaLibraryScriptCore {
	/** @type {true} */
	static [SymbolDict.JavaLibraryScript] = true;
}

module.exports = JavaLibraryScriptCore;

},{"./symbol/SymbolDict":14}],12:[function(require,module,exports){
const SymbolDict = require("./symbol/SymbolDict");
const JavaLibraryScriptCore = require("./JavaLibraryScriptCore");

/**
 * ログ出力管理クラス
 * @class
 */
class Logger extends JavaLibraryScriptCore {
	/**
	 * コンソールスタイルを有効にする
	 * @type {boolean}
	 * @default true
	 * @static
	 */
	static ENABLE_CONSOLE_STYLE = this._isEnableCustomConsole();
	/**
	 * 折りたたみなしのログを有効にする
	 * @type {boolean}
	 * @default true
	 * @static
	 */
	static ENABLE_SIMPLE_LOG = true;
	/**
	 * スタックトレースを有効にする
	 * @type {boolean}
	 * @default true
	 * @static
	 */
	static ENABLE_STACK_TRACE = true;
	/**
	 * 区切り線の長さの初期値
	 * @type {number}
	 * @default 50
	 * @static
	 */
	static DEFAULT_HR_SIZE = 40;

	/**
	 * ログレベル
	 * @enum {number}
	 * @readonly
	 * @static
	 */
	static LOG_LEVEL = {
		DEBUG: 0,
		TIME: 1,
		LOG: 3,
		WARN: 5,
		ERROR: 7,
		INFO: 9,
		IGNORE: 11,
	};
	/**
	 * コンソールスタイル
	 * @enum {string}
	 * @readonly
	 * @static
	 */
	static CONSOLE_STYLE = {
		DEBUG_TITLE: "color: gray;font-weight: normal;",
		DEBUG: "color: gray;",
		LOG_TITLE: "color: teal;font-weight: normal;",
		LOG: "color: teal;",
		WARN_TITLE: "background-color: #fef6d5;font-weight: normal;",
		WARN: "",
		ERROR_TITLE: "background-color: #fcebeb;font-weight: normal;",
		ERROR: "",
		INFO_TITLE: "color: blue;font-weight: normal;",
		INFO: "font-family: serif;",
		STACK_TRACE: "font-size: 0.8em;color: darkblue;",
	};
	/**
	 * スタックトレースを取得する正規表現
	 * @type {RegExp}
	 * @readonly
	 * @static
	 */
	static STACK_TRACE_GET_REG = /at (?:.+? )?\(?(.+):(\d+):(?:\d+)\)?/;

	/**
	 * @param {String} [prefix=""]
	 * @param {number} [visibleLevel=Logger.LOG_LEVEL.WARN]
	 */
	constructor(prefix = "", visibleLevel = Logger.LOG_LEVEL.WARN) {
		super();

		/**
		 * ログの先頭の文字列
		 * @type {String}
		 */
		this._prefix = prefix;
		/**
		 * 表示するログレベル
		 * @type {number}
		 */
		this._visibleLevel = visibleLevel;
	}

	/**
	 * ログの先頭の文字列を変更する
	 * @param {String} prefix
	 */
	setPrefix(prefix) {
		this._prefix = prefix;
	}
	/**
	 * ログの先頭の文字列を取得する
	 * @returns {String}
	 */
	getPrefix() {
		return this._prefix;
	}

	/**
	 * 表示するログレベルを変更する
	 * @param {number} level
	 */
	setVisibleLevel(level) {
		this._visibleLevel = level;
	}
	/**
	 * 表示するログレベルを取得する
	 * @returns {number}
	 */
	getVisibleLevel() {
		return this._visibleLevel;
	}

	/**
	 * カスタムコンソールが使用可能か判定する
	 * @returns {boolean}
	 * @static
	 */
	static _isEnableCustomConsole() {
		const t = navigator?.userAgent?.toLowerCase();
		if (!t) return false;
		return /(chrome|firefox|safari)/.test(t);
	}

	/**
	 * 表示可能なログレベルか判定する
	 * @param {number} level
	 * @returns {boolean}
	 */
	_isVisible(level) {
		return level >= this._visibleLevel;
	}

	/**
	 * ログの先頭の文字列を生成する
	 * @returns {String}
	 */
	_generatePrefix() {
		if (!this._prefix) return "";
		return `[${this._prefix}] `;
	}

	/**
	 * ログレベルを文字列に変換する
	 * @param {number} level
	 * @returns {String | false}
	 */
	_getLevelToString(level) {
		/** @type {typeof Logger.LOG_LEVEL} */
		const LOG_LEVEL = this.constructor.LOG_LEVEL;
		switch (level) {
			case LOG_LEVEL.DEBUG:
				return "DEBUG";
			case LOG_LEVEL.LOG:
				return "LOG";
			case LOG_LEVEL.WARN:
				return "WARN";
			case LOG_LEVEL.ERROR:
				return "ERROR";
			case LOG_LEVEL.INFO:
				return "INFO";
			default:
				return false;
		}
	}

	/**
	 * 呼び出し元のスタックトレースを取得する
	 * @returns {String}
	 */
	_getTopStackTrace() {
		const stackLines = new Error().stack.split("\n");
		/** @type {typeof Logger} */
		const construct = this.constructor;
		const className = construct.name;
		const LibName = SymbolDict.LIBRARY_NAME;

		const reg = new RegExp(`(?:^|\\W)(?:${className}|${LibName})\\.`);

		// Logger.* 系のフレームを飛ばす
		let callerLine = "";
		for (let i = 1; i < stackLines.length; i++) {
			const line = stackLines[i];
			if (!reg.test(line)) {
				callerLine = line.trim();
				break;
			}
		}
		const match = callerLine.match(construct.STACK_TRACE_GET_REG);
		let location = "";
		if (match) {
			const filePath = match[1];
			const lineNumber = match[2];

			const parts = filePath.split(/[\\/]/);
			const shortPath = parts.slice(-1).join("/");
			location = `${shortPath}:${lineNumber}`;
		}

		return location;
	}

	/**
	 * ログを出力する
	 * @param {number} level
	 * @param {any[]} args
	 * @returns {boolean}
	 */
	_levelToPrint(level, args) {
		if (!this._isVisible(level)) return true;

		const levelStr = this._getLevelToString(level);
		if (!levelStr) return false;

		/** @type {typeof Logger} */
		const construct = this.constructor;

		let logFunc,
			title_prefix = "";
		/** @type {typeof Logger.LOG_LEVEL} */
		const LOG_LEVEL = construct.LOG_LEVEL;
		switch (level) {
			case LOG_LEVEL.DEBUG:
			case LOG_LEVEL.LOG:
				logFunc = console.log.bind(console);
				break;
			case LOG_LEVEL.WARN:
				logFunc = console.warn.bind(console);
				title_prefix = "⚠️";
				break;
			case LOG_LEVEL.ERROR:
				logFunc = console.error.bind(console);
				title_prefix = "🛑";
				break;
			case LOG_LEVEL.INFO:
				logFunc = console.info.bind(console);
				title_prefix = "ℹ️";
				break;
			default:
				logFunc = console.log.bind(console);
		}

		const format = args.map((a) => (typeof a === "string" ? "%s" : "%o")).join(" ");
		/** @type {typeof Logger.CONSOLE_STYLE} */
		const console_style = construct.CONSOLE_STYLE;

		let stackTrace = "";
		if (construct.ENABLE_STACK_TRACE) {
			stackTrace = this._getTopStackTrace();
		}

		if (construct.ENABLE_SIMPLE_LOG) {
			let stackName = "";
			if (stackTrace) {
				stackName = `[${stackTrace}]\n`;
			}
			if (construct.ENABLE_CONSOLE_STYLE) {
				logFunc(
					// 通常表示
					`%c%s%c${this._generatePrefix()}${format}`,
					console_style.STACK_TRACE,
					stackName,
					console_style[levelStr],
					...args
				);
			} else {
				logFunc(
					// 通常表示
					`%s${format}`,
					stackName,
					...args
				);
			}
			return true;
		}

		if (construct.ENABLE_CONSOLE_STYLE) {
			console.groupCollapsed(
				// タイトル表示
				`%c${this._generatePrefix()}${title_prefix}${format}`,
				console_style[`${levelStr}_TITLE`],
				...args
			);
		} else {
			console.groupCollapsed(
				// タイトル表示
				`${this._generatePrefix()}${title_prefix}${format}`,
				...args
			);
		}

		if (stackTrace) {
			if (construct.ENABLE_CONSOLE_STYLE) {
				console.log(`%c[%s]`, console_style.STACK_TRACE, stackTrace);
			} else {
				console.log(`[%s]`, stackTrace);
			}
		}
		if (construct.ENABLE_CONSOLE_STYLE) {
			logFunc(
				// 内部表示
				`%c${format}`,
				console_style[levelStr],
				...args
			);
		} else {
			logFunc(
				// 内部表示
				`${format}`,
				...args
			);
		}
		console.groupEnd();

		return true;
	}

	/**
	 * 開発用ログ
	 * @param {...any} args
	 */
	debug(...args) {
		const level = this.constructor.LOG_LEVEL.DEBUG;
		this._levelToPrint(level, args);
	}
	/**
	 * 通常ログ
	 * @param {...any} args
	 */
	log(...args) {
		const level = this.constructor.LOG_LEVEL.LOG;
		this._levelToPrint(level, args);
	}
	/**
	 * 警告ログ
	 * @param {...any} args
	 */
	warning(...args) {
		const level = this.constructor.LOG_LEVEL.WARN;
		this._levelToPrint(level, args);
	}
	/**
	 * 警告ログ
	 * @param {...any} args
	 */
	warn(...args) {
		this.warning(...args);
	}
	/**
	 * エラーログ
	 * @param {...any} args
	 */
	error(...args) {
		const level = this.constructor.LOG_LEVEL.ERROR;
		this._levelToPrint(level, args);
	}
	/**
	 * エラーログ
	 * @param {...any} args
	 */
	err(...args) {
		this.error(...args);
	}
	/**
	 * 情報ログ
	 * @param {...any} args
	 */
	information(...args) {
		const level = this.constructor.LOG_LEVEL.INFO;
		this._levelToPrint(level, args);
	}
	/**
	 * 情報ログ
	 * @param {...any} args
	 */
	info(...args) {
		this.information(...args);
	}
	/**
	 * タイムログ (開始)
	 * @param {String} label
	 * @returns {String}
	 */
	time(label) {
		const level = this.constructor.LOG_LEVEL.TIME;
		if (this._isVisible(level)) {
			const str = `${this._generatePrefix()}${label}`;
			console.log(`${str}: Start`);
			console.time(str);
		}
		return label;
	}
	/**
	 * タイムログ (終了)
	 * @param {String} label
	 */
	timeEnd(label) {
		const level = this.constructor.LOG_LEVEL.TIME;
		if (this._isVisible(level)) {
			console.timeEnd(`${this._generatePrefix()}${label}`);
		}
	}
	/**
	 * 区切り線を出力する
	 * @param {Number} [size]
	 */
	hr(size) {
		const hr_size = size || this.constructor.DEFAULT_HR_SIZE;

		let hr = "".padEnd(hr_size, "-");
		if (this._isVisible(this.constructor.LOG_LEVEL.LOG)) {
			console.log(hr);
		}
	}

	/**
	 * クラスのインスタンスをラップする
	 * @template {Object} T
	 * @param {T} instance
	 * @returns {T}
	 */
	wrapInstanceIO(instance) {
		// すでにラップ済みならそのまま返す
		if (instance[SymbolDict.LoggerWrapped]) return instance;

		const Log = this;
		const classRef = instance.constructor;
		const className = classRef.name;
		const proxy = new Proxy(instance, {
			get(target, prop, receiver) {
				const value = target[prop];
				if (typeof value === "function") {
					return (...args) => {
						Log.debug(`call ${className}.${prop}:`, args);
						const result = value.apply(target, args);

						// 戻り値が同じクラスのインスタンスなら再ラップ
						if (result instanceof classRef) {
							return Log.wrapInstanceIO(result, classRef);
						}

						return result;
					};
				}
				return value;
			},
		});

		proxy[SymbolDict.LoggerWrapped] = true;
		return proxy;
	}
}

/**
 * 内容ログ出力用のインスタンス
 * @type {Logger}
 */
const logging = new Logger("JLS", Logger.LOG_LEVEL.LOG);

module.exports = { Logger, logging };

},{"./JavaLibraryScriptCore":11,"./symbol/SymbolDict":14}],13:[function(require,module,exports){
module.exports = {
    JavaLibraryScriptCore: require("./JavaLibraryScriptCore.js"),
    ...require("./Logger.js"),
    symbol: require("./symbol/index.js")
};

},{"./JavaLibraryScriptCore.js":11,"./Logger.js":12,"./symbol/index.js":15}],14:[function(require,module,exports){
/**
 * Symbolの共通プレフィックス
 * @type {string}
 * @readonly
 */
const prefix = "@@JLS_";

const LIBRARY_NAME = "JavaLibraryScript";

/**
 * 内部利用Symbolの辞書
 * @enum {Symbol}
 * @readonly
 */
const SYMBOL_DICT = {
	// 定数
	/** @type {string} */
	LIBRARY_NAME,
	// 公開
	JavaLibraryScript: Symbol.for(`${prefix}${LIBRARY_NAME}`),
	instanceofTarget: Symbol.for(`${prefix}instanceofTarget`),
	LoggerWrapped: Symbol.for(`${prefix}LoggerWrapped`),
	// 内部
	TypeAny: Symbol("Any"),
	TypeVoid: Symbol("Void"),
};

module.exports = SYMBOL_DICT;

},{}],15:[function(require,module,exports){
module.exports = {
    ...require("./SymbolDict.js")
};

},{"./SymbolDict.js":14}],16:[function(require,module,exports){
const JavaLibraryScript = require("./index");

if (typeof window !== "undefined") {
	window.JavaLibraryScript = JavaLibraryScript;
}
if (typeof self !== "undefined") {
	self.JavaLibraryScript = JavaLibraryScript;
}

module.exports = JavaLibraryScript;

},{"./index":4}],17:[function(require,module,exports){
const JavaLibraryScriptCore = require("../libs/sys/JavaLibraryScriptCore");
const { logging } = require("../libs/sys/Logger");
const { CacheWrapper } = require("../libs/cache/CacheWrapper");

/**
 * BigFloat の設定
 * @class
 */
class BigFloatConfig extends JavaLibraryScriptCore {
	/**
	 * 0に近い方向に切り捨て
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static ROUND_TRUNCATE = 0;
	/**
	 * 絶対値が小さい方向に切り捨て（ROUND_TRUNCATEと同じ）
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static ROUND_DOWN = 0;
	/**
	 * 絶対値が大きい方向に切り上げ
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static ROUND_UP = 1;
	/**
	 * 正の無限大方向に切り上げ
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static ROUND_CEIL = 2;
	/**
	 * 負の無限大方向に切り捨て
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static ROUND_FLOOR = 3;
	/**
	 * 四捨五入
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static ROUND_HALF_UP = 4;
	/**
	 * 五捨六入（5未満切り捨て）
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static ROUND_HALF_DOWN = 5;

	/**
	 * 円周率の計算アルゴリズム
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static PI_MATH_DEFAULT = 0;
	/**
	 * 円周率[Gregory-Leibniz法] (超高速・超低収束)
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static PI_LEIBNIZ = 1;
	/**
	 * 円周率[ニュートン法] (高速・低収束)
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static PI_NEWTON = 2;
	/**
	 * 円周率[Chudnovsky法] (低速・高収束)
	 * @type {number}
	 * @static
	 * @readonly
	 */
	static PI_CHUDNOVSKY = 3;

	/**
	 * @param {Object | BigFloatConfig} [options]
	 * @param {boolean} [options.allowPrecisionMismatch=false] - 精度の不一致を許容する
	 * @param {boolean} [options.mutateResult=false] - 破壊的な計算(自身の上書き)をする (falseは新インスタンスを作成)
	 * @param {number} [options.roundingMode=BigFloatConfig.ROUND_TRUNCATE] - 丸めモード
	 * @param {BigInt} [options.extraPrecision=2n] - 追加の精度
	 * @param {number} [options.piAlgorithm=BigFloatConfig.PI_CHUDNOVSKY] - 円周率算出アルゴリズム
	 * @param {BigInt} [options.trigFuncsMaxSteps=5000n] - 三角関数の最大ステップ数
	 * @param {BigInt} [options.lnMaxSteps=10000n] - 自然対数の最大ステップ数
	 */
	constructor({
		// 設定
		allowPrecisionMismatch = false,
		mutateResult = false,
		roundingMode = BigFloatConfig.ROUND_TRUNCATE,
		extraPrecision = 2n,
		piAlgorithm = BigFloatConfig.PI_CHUDNOVSKY,
		trigFuncsMaxSteps = 5000n,
		lnMaxSteps = 10000n,
	} = {}) {
		super();
		/**
		 * 精度の不一致を許容する
		 * @type {boolean}
		 * @default false
		 */
		this.allowPrecisionMismatch = allowPrecisionMismatch;
		/**
		 * 破壊的な計算(自身の上書き)をする (falseは新インスタンスを作成)
		 * @type {boolean}
		 * @default false
		 */
		this.mutateResult = mutateResult;
		/**
		 * 丸めモード
		 * @type {number}
		 * @default BigFloatConfig.ROUND_TRUNCATE
		 */
		this.roundingMode = roundingMode;
		/**
		 * 追加の精度
		 * @type {BigInt}
		 * @default 2n
		 */
		this.extraPrecision = extraPrecision;
		/**
		 * 円周率算出アルゴリズム
		 * @type {number}
		 * @default BigFloatConfig.PI_CHUDNOVSKY
		 */
		this.piAlgorithm = piAlgorithm;
		/**
		 * 三角関数の最大ステップ数
		 * @type {BigInt}
		 * @default 1000n
		 */
		this.trigFuncsMaxSteps = trigFuncsMaxSteps;
		/**
		 * 自然対数の最大ステップ数
		 * @type {BigInt}
		 * @default 50000n
		 */
		this.lnMaxSteps = lnMaxSteps;
	}

	/**
	 * 設定オブジェクトを複製する
	 * @returns {BigFloatConfig}
	 */
	clone() {
		// shallow copy で新しい設定オブジェクトを返す
		return new BigFloatConfig({ ...this });
	}

	/**
	 * 精度の不一致を許容するかどうかを切り替える
	 */
	toggleMismatch() {
		this.allowPrecisionMismatch = !this.allowPrecisionMismatch;
	}

	/**
	 * 破壊的な計算(自身の上書き)をするかどうかを切り替える
	 */
	toggleMutation() {
		this.mutateResult = !this.mutateResult;
	}
}

/**
 * 大きな浮動小数点数を扱えるクラス
 * @class
 */
class BigFloat extends JavaLibraryScriptCore {
	/**
	 * 最大精度 (Stringの限界)
	 * @type {BigInt}
	 * @static
	 */
	static MAX_PRECISION = 200000000n;

	/**
	 * 設定
	 * @type {BigFloatConfig}
	 * @static
	 */
	static config = new BigFloatConfig();

	/**
	 * キャッシュ
	 * @type {Record<string, {value: BigInt, precision: BigInt, priority: number}>}
	 * @static
	 * @readonly
	 */
	static _cached = {};

	/**
	 * @param {string | number | BigInt | BigFloat} value - 初期値
	 * @param {number} [precision=20] - 精度
	 * @throws {Error}
	 */
	constructor(value, precision = 20n) {
		super();

		if (value instanceof BigFloat) {
			this.value = value.value;
			return;
		}

		/** @type {BigInt} */
		this._precision = BigInt(precision);
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		construct._checkPrecision(this._precision);

		if (!value) {
			this.value = 0n;
			return;
		}

		const { intPart, fracPart, sign } = this._parse(value);
		const exPrec = this._precision + construct.config.extraPrecision;
		const frac = fracPart.padEnd(Number(exPrec), "0").slice(0, Number(exPrec));
		const rawValue = BigInt(intPart + frac) * BigInt(sign);

		/** @type {BigInt} */
		this.value = construct._round(rawValue, exPrec, this._precision);
	}

	// ====================================================================================================
	// * 基本ユーティリティ (クラス生成・変換・クローン)
	// ====================================================================================================
	// --------------------------------------------------
	// クラス操作
	// --------------------------------------------------
	/**
	 * BigFloatのstaticメゾット実行結果をキャッシュ化するクラスを生成する (同じ計算を繰り返さない限り使用した方が遅い)
	 * @param {number} [maxSize=10000] - キャッシュサイズ
	 * @param {string[]} [addBlacklist=[]] - 追加ブラックリスト
	 * @returns {typeof BigFloat}
	 */
	static generateCachedClass(maxSize = 10000, addBlacklist = []) {
		return CacheWrapper.convert(this, {
			blacklist: [
				// オブジェクトを返却するため
				"generateCachedClass",
				"clone",
				"max",
				"min",
				"sum",
				"average",
				"median",
				"product",
				"variance",
				"stddev",
				"_normalizeArgs",
				"_batchRescale",
				"_makeResult",
				"pi",
				"e",
				// 何も返却しないため
				"_checkPrecision",
				// 毎回ランダムなため
				"_randomBigInt",
				"random",
				// 同業者
				"_getCheckCache",
				"_getCache",
				"_updateCache",
				// 定数
				"minusOne",
				"zero",
				"one",
				// 追加
				...addBlacklist,
			],
			maxSize,
		});
	}
	// --------------------------------------------------
	// オブジェクト複製
	// --------------------------------------------------
	/**
	 * クラスを複製する (設定複製用)
	 * @returns {BigFloat}
	 * @static
	 */
	static clone() {
		const Parent = this;
		return class extends Parent {
			static config = Parent.config.clone();
			static MAX_PRECISION = Parent.MAX_PRECISION;
		};
	}
	/**
	 * インスタンスを複製する
	 * @returns {BigFloat}
	 */
	clone() {
		const instance = new this.constructor();
		instance._precision = this._precision;
		instance.value = this.value;
		return instance;
	}
	// --------------------------------------------------
	// パース・変換
	// --------------------------------------------------
	/**
	 * 文字列を数値に変換する
	 * @param {string} str - 変換する文字列
	 * @param {BigInt} precision - 小数点以下の桁数
	 * @param {number} base - 基数
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static parseFloat(str, precision = 20n, base = 10) {
		if (str instanceof BigFloat) return str.clone();
		if (typeof str !== "string") str = String(str);
		if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
		if (base === 10) return new this(str, precision);

		const [rawInt, rawFrac = ""] = str.toLowerCase().replace(/^\+/, "").split(".");
		const sign = str.trim().startsWith("-") ? -1n : 1n;
		const digits = "0123456789abcdefghijklmnopqrstuvwxyz";

		const toDigit = (ch) => {
			const d = digits.indexOf(ch);
			if (d < 0 || d >= base) throw new Error(`Invalid digit '${ch}' for base ${base}`);
			return BigInt(d);
		};

		const bigBase = BigInt(base);

		// 整数部分
		let intVal = 0n;
		for (const ch of rawInt.replace(/^[-+]/, "")) {
			intVal = intVal * bigBase + toDigit(ch);
		}

		// 小数部分
		let fracVal = 0n;
		let scale = 1n;
		let basePow = 1n;

		for (let i = 0; i < rawFrac.length && i < precision; i++) {
			basePow *= bigBase;
			fracVal = fracVal * bigBase + toDigit(rawFrac[i]);
			scale = basePow;
		}

		precision = BigInt(precision);

		const scale10 = 10n ** precision;
		const fracScaled = scale === 0n ? 0n : (fracVal * scale10) / scale;
		const total = (intVal * scale10 + fracScaled) * sign;

		return this._makeResult(total, precision);
	}
	// ====================================================================================================
	// * 内部ユーティリティ・補助関数
	// ====================================================================================================
	// --------------------------------------------------
	// 解析・正規化
	// --------------------------------------------------
	/**
	 * 文字列を解析して数値を取得
	 * @param {string} str - 文字列
	 * @returns {{intPart: string, fracPart: string, sign: number}}
	 */
	_parse(str) {
		str = str.toString().trim();

		const expMatch = str.match(/^([+-]?[\d.]+)[eE]([+-]?\d+)$/);
		if (expMatch) {
			// 指数表記を通常の小数に変換
			let [_, base, expStr] = expMatch;
			const exp = parseInt(expStr, 10);

			// 小数点位置をずらす
			let [intPart, fracPart = ""] = base.split(".");
			const allDigits = intPart + fracPart;

			let pointIndex = intPart.length + exp;
			if (pointIndex < 0) {
				base = "0." + "0".repeat(-pointIndex) + allDigits;
			} else if (pointIndex >= allDigits.length) {
				base = allDigits + "0".repeat(pointIndex - allDigits.length);
			} else {
				base = allDigits.slice(0, pointIndex) + "." + allDigits.slice(pointIndex);
			}

			str = base;
		}

		const [intPartRaw, fracPartRaw = ""] = str.split(".");
		const sign = intPartRaw.startsWith("-") ? -1 : 1;
		const intPart = intPartRaw.replace("-", "");
		return { intPart, fracPart: fracPartRaw, sign };
	}
	/**
	 * 数値を正規化
	 * @param {BigInt} val
	 * @returns {string}
	 */
	_normalize(val) {
		const sign = val < 0n ? "-" : "";
		const absVal = val < 0n ? -val : val;
		const prec = Number(this._precision);
		if (prec === 0) {
			return `${sign}${absVal.toString()}`;
		}
		const s = absVal.toString().padStart(prec + 1, "0");
		const intPart = s.slice(0, -prec);
		const fracPart = s.slice(-prec);
		return `${sign}${intPart}.${fracPart}`;
	}
	/**
	 * 引数を正規化する
	 * @param {any[]} args
	 * @returns {any[]}
	 */
	static _normalizeArgs(args) {
		// 配列か複数引数か判別して配列にまとめる
		if (args.length === 1 && Array.isArray(args[0])) {
			return args[0];
		}
		return args;
	}
	// --------------------------------------------------
	// スケーリング関連
	// --------------------------------------------------
	/**
	 * 精度を合わせる
	 * @param {BigFloat} other
	 * @param {boolean} [useExPrecision=false] - 追加の精度を使う
	 * @returns {[BigInt, BigInt, BigInt, BigInt]}
	 * @throws {Error}
	 */
	_bothRescale(other, useExPrecision = false) {
		const precisionA = this._precision;
		if (!(other instanceof BigFloat)) {
			other = new this.constructor(other);
		}
		const precisionB = other._precision;
		/** @type {BigFloatConfig} */
		const config = this.constructor.config;
		if (precisionA === precisionB) {
			if (useExPrecision) {
				const exPr = config.extraPrecision;
				const exScale = 10n ** exPr;
				const valA = this.value * exScale;
				const valB = other.value * exScale;
				return [valA, valB, precisionA + exPr, precisionA];
			}
			return [this.value, other.value, precisionA, precisionA];
		}
		if (!config.allowPrecisionMismatch) throw new Error("Precision mismatch");

		const maxPrecision = precisionA > precisionB ? precisionA : precisionB;
		const maxExPrecision = maxPrecision + (useExPrecision ? config.extraPrecision : 0n);
		const scaleDiffA = maxExPrecision - precisionA;
		const scaleDiffB = maxExPrecision - precisionB;
		const valA = this.value * 10n ** scaleDiffA;
		const valB = other.value * 10n ** scaleDiffB;
		return [valA, valB, maxExPrecision, maxPrecision];
	}
	/**
	 * 複数の精度を合わせる
	 * @param {BigFloat[]} arr
	 * @param {boolean} [useExPrecision=false]
	 * @returns {[BigFloat[], BigInt, BigInt]}
	 * @throws {Error}
	 * @static
	 */
	static _batchRescale(arr, useExPrecision = false) {
		/** @type {BigFloatConfig} */
		const config = this.config;
		const exPr = config.extraPrecision;
		if (arr.length === 0) {
			if (useExPrecision) {
				return [[], exPr, 0n];
			}
			return [[], 0n, 0n];
		}
		arr = arr.slice();

		const allowMismatch = config.allowPrecisionMismatch;
		// 最大精度を探す
		let maxPrecision = 0n;
		for (let i = 0; i < arr.length; i++) {
			let bf = arr[i];
			if (!(bf instanceof this)) {
				bf = arr[i] = new this(bf);
			}
			if (!allowMismatch && bf._precision !== maxPrecision) {
				throw new Error("Precision mismatch and allowPrecisionMismatch = false");
			}
			if (bf._precision > maxPrecision) maxPrecision = bf._precision;
		}

		let maxExPrecision = maxPrecision + (useExPrecision ? exPr : 0n);
		// スケール計算とBigInt変換
		const retArr = arr.map((bf) => {
			const diff = maxExPrecision - bf._precision;
			return bf.value * 10n ** diff;
		});
		return [retArr, maxExPrecision, maxPrecision];
	}
	// --------------------------------------------------
	// 結果生成
	// --------------------------------------------------
	/**
	 * 結果を作成する
	 * @param {BigInt} val
	 * @param {BigInt} precision
	 * @param {BigInt} [exPrecision]
	 * @returns {BigFloat}
	 * @static
	 */
	static _makeResult(val, precision, exPrecision = precision) {
		const rounded = this._round(val, exPrecision, precision);
		const result = new this();
		result._precision = precision;
		result.value = rounded;
		return result;
	}
	/**
	 * 結果を作成する
	 * @param {BigInt} val
	 * @param {BigInt} precision
	 * @param {BigInt} [exPrecision]
	 * @param {boolean} [okMutate=true] - 破壊的変更を許容
	 * @returns {this}
	 */
	_makeResult(val, precision, exPrecision = precision, okMutate = true) {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		if (construct.config.mutateResult && okMutate) {
			const rounded = construct._round(val, exPrecision, precision);
			this._precision = precision;
			this.value = rounded;
			return this;
		}
		return construct._makeResult(val, precision, exPrecision);
	}
	// --------------------------------------------------
	// 精度チェック
	// --------------------------------------------------
	/**
	 * 精度をチェックする
	 * @param {BigInt} precision
	 * @throws {Error}
	 * @static
	 */
	static _checkPrecision(precision) {
		if (precision < 0n) {
			throw new RangeError(`Precision must be greater than 0`);
		}
		if (precision > this.MAX_PRECISION) {
			throw new RangeError(`Precision exceeds ${this.name}.MAX_PRECISION`);
		}
	}
	/**
	 * 精度を変更する
	 * @param {BigInt} precision
	 * @returns {this}
	 */
	changePrecision(precision) {
		precision = BigInt(precision);
		this.value = this.constructor._round(this.value, this._precision, precision);
		this._precision = precision;
		return this;
	}
	/**
	 * どこまで精度が一致しているかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {number}
	 * @throws {Error}
	 */
	matchingPrecision(other) {
		const [valA, valB, prec] = this._bothRescale(other);
		let diff = valA - valB;
		if (diff === 0n) return prec;
		diff = diff < 0n ? -diff : diff;

		let factor = 10n ** prec;
		let matched = 0n;

		while (matched < prec) {
			factor /= 10n;
			if (diff < factor) {
				matched += 1n;
			} else {
				break;
			}
		}
		return matched;
	}
	// ====================================================================================================
	// * 精度・比較系
	// ====================================================================================================
	// --------------------------------------------------
	// 比較演算
	// --------------------------------------------------
	/**
	 * 等しいかどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	compare(other) {
		const [valA, valB] = this._bothRescale(other);
		if (valA < valB) return -1;
		if (valA > valB) return 1;
		return 0;
	}
	/**
	 * 等しいかどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	eq(other) {
		return this.compare(other) === 0;
	}
	/**
	 * 等しいかどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	equals(other) {
		return this.compare(other) === 0;
	}
	/**
	 * 等しくないかどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	ne(other) {
		return this.compare(other) !== 0;
	}
	/**
	 * this < other かどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	lt(other) {
		return this.compare(other) === -1;
	}
	/**
	 * this <= other かどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	lte(other) {
		return this.compare(other) <= 0;
	}
	/**
	 * this > other かどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	gt(other) {
		return this.compare(other) === 1;
	}
	/**
	 * this >= other かどうかを判定する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {boolean}
	 * @throws {Error}
	 */
	gte(other) {
		return this.compare(other) >= 0;
	}
	// --------------------------------------------------
	// 状態判定
	// --------------------------------------------------
	/**
	 * 0かどうかを判定する
	 * @returns {boolean}
	 */
	isZero() {
		return this.value === 0n;
	}
	/**
	 * 正かどうかを判定する
	 * @returns {boolean}
	 */
	isPositive() {
		return this.value > 0n;
	}
	/**
	 * 負かどうかを判定する
	 * @returns {boolean}
	 */
	isNegative() {
		return this.value < 0n;
	}
	// --------------------------------------------------
	// 差分・誤差計算
	// --------------------------------------------------
	/**
	 * 相対差を計算する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {BigInt}
	 * @throws {Error}
	 */
	relativeDiff(other) {
		const [valA, valB, prec] = this._bothRescale(other);

		const absA = valA < 0n ? -valA : valA;
		const absB = valB < 0n ? -valB : valB;
		const diff = valA > valB ? valA - valB : valB - valA;

		const denominator = absA > absB ? absA : absB;
		if (denominator === 0n) return 0n;

		const scale = 10n ** prec;
		return this._makeResult((diff * scale) / denominator, prec);
	}
	/**
	 * 絶対差を計算する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	absoluteDiff(other) {
		const [valA, valB, prec] = this._bothRescale(other);
		return this._makeResult(valA > valB ? valA - valB : valB - valA, prec);
	}
	/**
	 * 差分の非一致度を計算する
	 * @param {BigFloat | number | string | BigInt} other - 比較する値
	 * @returns {BigInt}
	 * @throws {Error}
	 */
	percentDiff(other) {
		const [valA, valB, prec] = this._bothRescale(other);

		const absB = valB < 0n ? -valB : valB;
		const diff = valA > valB ? valA - valB : valB - valA;

		if (absB === 0n) return 0n;

		const scale = 10n ** prec;
		return this._makeResult((diff * scale * 100n) / absB, prec);
	}
	// ====================================================================================================
	// * 数値変換・出力系
	// ====================================================================================================
	// --------------------------------------------------
	// 基本変換
	// --------------------------------------------------
	/**
	 * 文字列に変換する
	 * @param {number} base - 基数
	 * @param {number} precision - 精度
	 * @returns {string}
	 */
	toString(base = 10, precision = this._precision) {
		if (base < 2 || base > 36) throw new RangeError("Base must be between 2 and 36");
		if (base === 10) return this._normalize(this.value);
		const val = this.value;
		const scale = 10n ** this._precision;

		const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
		const sign = val < 0n ? "-" : "";
		const absVal = val < 0n ? -val : val;

		const intPart = absVal / scale;
		const fracPart = absVal % scale;

		const bigBase = BigInt(base);

		// 整数部
		let intStr = "";
		let intCopy = intPart;
		if (intCopy === 0n) {
			intStr = "0";
		} else {
			while (intCopy > 0n) {
				const digit = intCopy % bigBase;
				intStr = digits[digit] + intStr;
				intCopy /= bigBase;
			}
		}
		if (this._precision === 0n) return `${sign}${intStr}`;
		precision = BigInt(precision);

		// 小数部
		let fracStr = "";
		let frac = fracPart;
		for (let i = 0n; i < precision; i++) {
			frac *= bigBase;
			const digit = frac / scale;
			fracStr += digits[digit];
			frac %= scale;
			if (frac === 0n) break;
		}

		return fracStr.length > 0 ? `${sign}${intStr}.${fracStr}` : `${sign}${intStr}`;
	}
	/**
	 * JSONに変換する
	 * @returns {string}
	 */
	toJSON() {
		/** @type {BigFloatConfig} */
		const config = this.constructor.config;
		let bf = this;
		if (config.mutateResult) bf = bf.clone();
		return bf.scale().toString();
	}
	/**
	 * 数値に変換する
	 * @returns {number}
	 */
	toNumber() {
		return Number(this.toString());
	}
	// --------------------------------------------------
	// フォーマット
	// --------------------------------------------------
	/**
	 * 小数点以下の桁数を指定して数値を丸める
	 * @param {number} digits - 小数点以下の桁数
	 * @returns {string}
	 */
	toFixed(digits) {
		const str = this._normalize(this.value);
		const [intPart, fracPart = ""] = str.split(".");
		const d = Math.max(0, Number(digits));
		if (d === 0) return intPart;
		const fracFixed = fracPart.padEnd(d, "0").slice(0, d);
		return `${intPart}.${fracFixed}`;
	}
	/**
	 * 指数表記に変換する
	 * @param {number} digits - 小数点以下の桁数
	 * @returns {string}
	 */
	toExponential(digits = Number(this._precision)) {
		const prec = Number(this._precision);
		if (digits <= 0 || digits > prec) throw new RangeError("Invalid digits (must be between 1 and precision)");
		const isNeg = this.value < 0n;
		const absVal = isNeg ? -this.value : this.value;
		const s = absVal.toString().padStart(prec + 1, "0");

		const intPart = s.slice(0, -prec) || "0";
		const fracPart = s.slice(-prec);
		const raw = `${intPart}${fracPart}`;

		// 最初の非ゼロ桁探す（有効数字先頭）
		const firstDigitIndex = raw.search(/[1-9]/);
		if (firstDigitIndex === -1) return "0e+0";

		const mantissa = raw.slice(firstDigitIndex, firstDigitIndex + digits);
		let decimal;
		if (digits === 1) {
			decimal = raw[firstDigitIndex]; // 有効数字1桁だけ（整数部）
		} else if (mantissa.length === 1) {
			decimal = `${mantissa[0]}.0`;
		} else {
			decimal = `${mantissa[0]}.${mantissa.slice(1)}`;
		}
		const exp = intPart.length - firstDigitIndex - 1;

		const signStr = isNeg ? "-" : "";
		const expStr = exp >= 0 ? `e+${exp}` : `e${exp}`;
		return `${signStr}${decimal}${expStr}`;
	}
	// ====================================================================================================
	// * 四則演算・基本関数
	// ====================================================================================================
	// --------------------------------------------------
	// 基本演算
	// --------------------------------------------------
	/**
	 * 加算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	add(other) {
		const [valA, valB, prec] = this._bothRescale(other);
		return this._makeResult(valA + valB, prec);
	}
	/**
	 * 減算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	sub(other) {
		const [valA, valB, prec] = this._bothRescale(other);
		return this._makeResult(valA - valB, prec);
	}
	/**
	 * 乗算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	mul(other) {
		const [valA, valB, exPrec, prec] = this._bothRescale(other, true);
		const scale = 10n ** exPrec;
		const result = (valA * valB) / scale;
		return this._makeResult(result, prec, exPrec);
	}
	/**
	 * 除算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	div(other) {
		const [valA, valB, exPrec, prec] = this._bothRescale(other, true);
		const scale = 10n ** exPrec;
		if (valB === 0n) throw new Error("Division by zero");
		const result = (valA * scale) / valB;
		return this._makeResult(result, prec, exPrec);
	}
	/**
	 * 剰余
	 * @param {BigInt} x
	 * @param {BigInt} m
	 * @returns {BigInt}
	 * @static
	 */
	static _mod(x, m) {
		const r = x % m;
		return r < 0n ? r + m : r;
	}
	/**
	 * 剰余
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	mod(other) {
		const [valA, valB, prec] = this._bothRescale(other);
		const result = this.constructor._mod(valA, valB);
		return this._makeResult(result, prec);
	}
	// --------------------------------------------------
	// 符号操作
	// --------------------------------------------------
	/**
	 * 符号反転
	 * @returns {this}
	 * @throws {Error}
	 */
	neg() {
		return this._makeResult(-this.value, this._precision);
	}
	/**
	 * 絶対値
	 * @param {BigInt} val
	 * @returns {BigInt}
	 * @static
	 */
	static _abs(val) {
		return val < 0n ? -val : val;
	}
	/**
	 * 絶対値
	 * @returns {this}
	 * @throws {Error}
	 */
	abs() {
		return this._makeResult(this.constructor._abs(this.value), this._precision);
	}
	/**
	 * 逆数を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	reciprocal() {
		if (this.value === 0n) throw new Error("Division by zero");
		const exPr = this.constructor.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const scale = 10n ** totalPr;
		// 1をスケール倍して割る
		const result = (scale * scale) / val;
		return this._makeResult(result, this._precision, totalPr);
	}
	// --------------------------------------------------
	// 丸め・切り捨て・切り上げ
	// --------------------------------------------------
	/**
	 * 小数点以下を切り捨て
	 * @returns {BigFloat}
	 */
	floor() {
		const scale = 10n ** this._precision;
		const scaled = this.value / scale;
		const floored = this.value < 0n && this.value % scale !== 0n ? scaled - 1n : scaled;
		return this._makeResult(floored * scale, this._precision);
	}
	/**
	 * 小数点以下を切り上げ
	 * @returns {BigFloat}
	 */
	ceil() {
		const scale = 10n ** this._precision;
		const scaled = this.value / scale;
		const ceiled = this.value > 0n && this.value % scale !== 0n ? scaled + 1n : scaled;
		return this._makeResult(ceiled * scale, this._precision);
	}
	/**
	 * 数値を丸める
	 * @param {BigInt} val
	 * @param {BigInt} currentPrec
	 * @param {BigInt} targetPrec
	 * @returns {BigInt}
	 * @static
	 */
	static _round(val, currentPrec, targetPrec) {
		const diff = currentPrec - targetPrec;
		if (diff < 0n) {
			// 精度が上がる場合は0埋め
			return diff === 0n ? val : val * 10n ** -diff;
		}
		// 精度が下がる場合は丸める
		const scale = 10n ** diff;
		const rem = val % scale;
		const base = val - rem;
		if (rem === 0n) return base / scale;

		const mode = this.config.roundingMode;
		const absRem = rem < 0n ? -rem : rem;
		const half = scale / 2n;
		const isNeg = val < 0n;

		let offset = 0n;
		switch (mode) {
			case BigFloatConfig.ROUND_UP:
				offset = isNeg ? -scale : scale;
				break;
			case BigFloatConfig.ROUND_CEIL:
				if (!isNeg) offset = scale;
				break;
			case BigFloatConfig.ROUND_FLOOR:
				if (isNeg) offset = -scale;
				break;
			case BigFloatConfig.ROUND_HALF_UP:
				if (absRem >= half) offset = isNeg ? -scale : scale;
				break;
			case BigFloatConfig.ROUND_HALF_DOWN:
				if (absRem > half) offset = isNeg ? -scale : scale;
				break;
			case BigFloatConfig.ROUND_TRUNCATE:
			case BigFloatConfig.ROUND_DOWN:
			default:
				// 何もしないの...?
				break;
		}

		return (base + offset) / scale;
	}
	/**
	 * 四捨五入
	 * @returns {BigFloat}
	 */
	round() {
		const scale = 10n ** this._precision;
		const scaled = this.value / scale;
		const remainder = this.value % scale;
		const half = scale / 2n;

		let rounded;
		if (this.value >= 0n) {
			rounded = remainder >= half ? scaled + 1n : scaled;
		} else {
			rounded = -remainder >= half ? scaled - 1n : scaled;
		}

		return this._makeResult(rounded * scale, this._precision);
	}
	/**
	 * 整数部分だけを取得
	 * @returns {BigFloat}
	 */
	trunc() {
		const scale = 10n ** this._precision;
		const truncated = this.value / scale;
		return this._makeResult(truncated * scale, this._precision);
	}
	// ====================================================================================================
	// * 冪乗・ルート・スケーリング
	// ====================================================================================================
	// --------------------------------------------------
	// べき乗
	// --------------------------------------------------
	/**
	 * べき乗
	 * @param {BigInt} base - 基数
	 * @param {BigInt} exponent - 指数
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @static
	 */
	static _pow(base, exponent, precision) {
		const scale = 10n ** precision;
		if (exponent === 0n) return scale;
		if (base === 0n) return 0n;
		if (exponent < 0n) {
			const positivePow = this._pow(base, -exponent, precision);
			if (positivePow === 0n) throw new Error("Division by zero in power function");
			// (scale * scale) は、スケールされた値の除算で精度を維持するためのおまじない
			return (scale * scale) / positivePow;
		}
		if (exponent % scale === 0n) {
			// 整数が指数の場合
			exponent /= scale;
			let result = scale;
			while (exponent > 0n) {
				if (exponent & 1n) {
					result = (result * base) / scale;
				}
				base = (base * base) / scale;
				exponent >>= 1n;
			}
			return result;
		}
		// 小数が指数の場合
		const config = this.config;
		const maxSteps = config.lnMaxSteps;

		const lnBase = this._ln(base, precision, maxSteps);
		const mul = (lnBase * exponent) / scale;
		return this._exp(mul, precision, maxSteps);
	}
	/**
	 * べき乗
	 * @param {BigFloat} exponent - 指数
	 * @returns {this}
	 * @throws {Error}
	 */
	pow(exponent) {
		const [valA, valB, exPrec, prec] = this._bothRescale(exponent, true);
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const result = construct._pow(valA, valB, exPrec);
		return this._makeResult(result, prec, exPrec);
	}
	// --------------------------------------------------
	// 平方根・立方根・任意根
	// --------------------------------------------------
	/**
	 * 平方根[ニュートン法] (_nthRootとは高速化のために分離)
	 * @param {BigInt} n
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _sqrt(n, precision) {
		if (n < 0n) throw new Error("Cannot compute square root of negative number");
		if (n === 0n) return 0n;

		const scale = 10n ** precision;
		const nScaled = n * scale;
		const TWO = 2n;

		let x = nScaled;

		let last;
		while (true) {
			last = x;
			x = (x + nScaled / x) / TWO;
			if (x === last) break;
		}

		return x;
	}
	/**
	 * 平方根[ニュートン法]
	 * @returns {this}
	 * @throws {Error}
	 */
	sqrt() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const exPr = construct.config.extraPrecision;
		const prec = this._precision;
		const totalPr = prec + exPr;
		const val = this.value * 10n ** exPr;

		const x = construct._sqrt(val, totalPr);

		return this._makeResult(x, prec, totalPr);
	}
	/**
	 * 立方根[ニュートン法]
	 * @returns {this}
	 * @throws {Error}
	 */
	cbrt() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const exPr = construct.config.extraPrecision;
		const prec = this._precision;
		const totalPr = prec + exPr;
		const val = this.value * 10n ** exPr;

		const x = construct._nthRoot(val, 3n, totalPr);

		return this._makeResult(x, prec, totalPr);
	}
	/**
	 * n乗根[ニュートン法]
	 * @param {BigInt} v
	 * @param {BigInt} n
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _nthRoot(v, n, precision) {
		if (n <= 0n) {
			throw new Error("n must be a positive integer");
		}
		if (v < 0n) {
			if (n % 2n === 0n) {
				throw new Error("Even root of negative number is not real");
			}
			return -this._nthRoot(-v, n, precision);
		}
		const scale = 10n ** precision;

		// 初期値 x = 1.0 (scaled)
		let x = scale;

		while (true) {
			// x_{k+1} = ((n - 1) * x_k + target / x_k^{n-1}) / n
			// BigIntでべき乗計算
			let xPow = x;
			if (n === 1n) {
				xPow = scale; // n=1は例外処理
			} else {
				for (let j = 1n; j < n - 1n; j++) {
					xPow = (xPow * x) / scale;
				}
			}

			const numerator = (n - 1n) * x + (v * scale) / xPow;
			const xNext = numerator / n;

			if (xNext === x) break; // 収束判定
			x = xNext;
		}
		return x;
	}
	/**
	 * n乗根[ニュートン法]
	 * @param {BigInt} n
	 * @returns {this}
	 * @throws {Error}
	 */
	nthRoot(n) {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const exPr = construct.config.extraPrecision;
		const prec = this._precision;
		const totalPr = prec + exPr;
		const val = this.value * 10n ** exPr;

		const x = construct._nthRoot(val, BigInt(n), totalPr);

		return this._makeResult(x, prec, totalPr);
	}
	// --------------------------------------------------
	// スケーリング
	// --------------------------------------------------
	/**
	 * precisionを最小限まで縮める
	 * @returns {this}
	 */
	scale() {
		let val = this.value;
		let scale = this._precision;

		const ZERO = 0n;
		const TEN = 10n;

		while (scale > ZERO && val % TEN === ZERO) {
			val /= TEN;
			scale--;
		}
		return this._makeResult(val, scale);
	}
	// ====================================================================================================
	// * 三角関数
	// ====================================================================================================
	// --------------------------------------------------
	// 基本三角関数
	// --------------------------------------------------
	/**
	 * 正弦[Maclaurin展開]
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @static
	 */
	static _sin(x, precision, maxSteps) {
		const scale = 10n ** precision;

		const pi = this._pi(precision);
		const twoPi = 2n * pi;
		const halfPi = pi / 2n;

		// xを[0, 2π)に
		x = this._mod(x, twoPi);
		// xを[-π, π]に
		if (x > pi) x -= twoPi;
		// xを[-π/2, π/2]に
		let sign = 1n;
		if (x > halfPi) {
			x = pi - x;
			sign = 1n;
		} else if (x < -halfPi) {
			x = -pi - x;
			sign = -1n;
		}

		let term = x; // x^1 / 1!
		let result = term;
		let x2 = (x * x) / scale;
		let sgn = -1n;

		for (let n = 1n; n <= maxSteps; n++) {
			const denom = 2n * n;

			term = (term * x2) / scale;
			term = term / (denom * (denom + 1n));

			if (term === 0n) break;
			result += sgn * term;
			sgn *= -1n;
		}
		return result * sign;
	}
	/**
	 * 正弦[Maclaurin展開]
	 * @returns {this}
	 * @throws {Error}
	 */
	sin() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const result = construct._sin(val, totalPr, maxSteps);
		return this._makeResult(result, this._precision, totalPr);
	}
	/**
	 * 余弦
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @static
	 */
	static _cos(x, precision, maxSteps) {
		const scale = 10n ** precision;

		let term = scale; // x^0 / 0! = 1
		let result = term;
		let x2 = (x * x) / scale;
		let sign = -1n;

		for (let n = 1n, denom = 2n; n <= maxSteps; n++, denom += 2n) {
			term = (term * x2) / scale;
			term = term / (denom * (denom - 1n));
			if (term === 0n) break;
			result += sign * term;
			sign *= -1n;
		}
		return result;
	}
	/**
	 * 余弦
	 * @returns {this}
	 */
	cos() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const result = construct._cos(val, totalPr, maxSteps);
		return this._makeResult(result, this._precision, totalPr);
	}
	/**
	 * 正接
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _tan(x, precision, maxSteps) {
		const cosX = this._cos(x, precision, maxSteps);
		const EPSILON = 10n ** (precision - 4n);
		if (cosX === 0n || (cosX > -EPSILON && cosX < EPSILON)) throw new Error("tan(x) is undefined or numerically unstable at this point");
		const sinX = this._sin(x, precision, maxSteps);
		const scale = 10n ** precision;
		return (sinX * scale) / cosX;
	}
	/**
	 * 正接
	 * @returns {this}
	 * @throws {Error}
	 */
	tan() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const result = construct._tan(val, totalPr, maxSteps);
		return this._makeResult(result, this._precision, totalPr);
	}
	// --------------------------------------------------
	// 逆三角関数
	// --------------------------------------------------
	/**
	 * 逆正弦
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _asin(x, precision, maxSteps) {
		const scale = 10n ** precision;
		if (x > scale || x < -scale) throw new Error("asin input out of range [-1,1]");

		const halfPi = this._pi(precision) / 2n;
		// 初期値を x * π/2 にして必ず [-π/2, π/2] に収める
		const initial = (x * halfPi) / scale;

		const f = (theta) => this._sin(theta, precision, maxSteps) - x;
		const df = (theta) => this._cos(theta, precision, maxSteps);
		return this._trigFuncsNewton(f, df, initial, precision, BigInt(maxSteps));
	}
	/**
	 * 逆正弦
	 * @returns {this}
	 * @throws {Error}
	 */
	asin() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const result = construct._asin(val, totalPr, maxSteps);
		return this._makeResult(result, this._precision, totalPr);
	}
	/**
	 * 逆余弦
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _acos(x, precision, maxSteps) {
		const halfPi = this._pi(precision) / 2n;
		const asinX = this._asin(x, precision, maxSteps);
		return halfPi - asinX;
	}
	/**
	 * 逆余弦
	 * @returns {this}
	 * @throws {Error}
	 */
	acos() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const result = construct._acos(val, totalPr, maxSteps);
		return this._makeResult(result, this._precision, totalPr);
	}
	/**
	 * 逆正接
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _atan(x, precision, maxSteps) {
		const scale = 10n ** precision;
		const absX = x < 0n ? -x : x;

		// |x| <= 1 → そのままニュートン法
		if (absX <= scale) {
			const f = (theta) => this._tan(theta, precision, maxSteps) - x;
			const df = (theta) => {
				const cosTheta = this._cos(theta, precision, maxSteps);
				if (cosTheta === 0n) throw new Error("Derivative undefined");

				return (scale * scale * scale) / (cosTheta * cosTheta);
			};
			return this._trigFuncsNewton(f, df, x, precision, BigInt(maxSteps));
		}

		// |x| > 1 → atan(x) = sign * (π/2 - atan(1 / |x|))
		const sign = x < 0n ? -1n : 1n;
		const halfPi = this._pi(precision) / 2n;
		const invX = (scale * scale) / absX;
		const innerAtan = this._atan(invX, precision, maxSteps);
		return sign * (halfPi - innerAtan);
	}
	/**
	 * 逆正接
	 * @returns {this}
	 * @throws {Error}
	 */
	atan() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const result = construct._atan(val, totalPr, maxSteps);
		return this._makeResult(result, this._precision, totalPr);
	}
	/**
	 * 逆正接2 (atan2(y, x))
	 * @param {BigInt} y
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @static
	 */
	static _atan2(y, x, precision, maxSteps) {
		// x == 0
		if (x === 0n) {
			if (y > 0n) return this._pi(precision) / 2n;
			if (y < 0n) return -this._pi(precision) / 2n;
			return 0n;
		}

		const scale = 10n ** precision;
		const angle = this._atan((y * scale) / x, precision, maxSteps);

		if (x > 0n) return angle;
		if (y >= 0n) return angle + this._pi(precision);
		return angle - this._pi(precision);
	}
	/**
	 * 逆正接2 (atan2(y, x))
	 * @param {BigFloat} x
	 * @returns {this}
	 * @throws {Error}
	 */
	atan2(x) {
		const [valA, valB, exPrec, prec] = this._bothRescale(x, true);
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.trigFuncsMaxSteps;
		const result = construct._atan2(valA, valB, exPrec, maxSteps);
		return this._makeResult(result, prec, exPrec);
	}
	// --------------------------------------------------
	// 内部計算補助・その他
	// --------------------------------------------------
	/**
	 * 逆正接[Machine's formula]
	 * @param {BigInt} invX
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @static
	 */
	static _atanMachine(invX, precision) {
		const scale = 10n ** precision;

		const x = scale / invX;
		const x2 = (x * x) / scale;
		let term = x;
		let sum = term;
		let sign = -1n;

		let lastTerm = 0n;
		for (let n = 3n; term !== lastTerm; n += 2n) {
			term = (term * x2) / scale;
			lastTerm = term;
			sum += (sign * term) / n;
			sign *= -1n;
		}
		return sum;
	}
	/**
	 * Newton法
	 * @param {(x:BigInt) => BigInt} f
	 * @param {(x:BigInt) => BigInt} df
	 * @param {BigInt} initial
	 * @param {BigInt} precision
	 * @param {number} maxSteps
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _trigFuncsNewton(f, df, initial, precision, maxSteps = 50) {
		const scale = 10n ** precision;
		let x = initial;

		for (let i = 0; i < maxSteps; i++) {
			const fx = f(x);
			if (fx === 0n) break;
			const dfx = df(x);
			if (dfx === 0n) throw new Error("Derivative zero during Newton iteration");

			// dx = fx / dfx （整数で割り算）
			// dx は分母あるから SCALEかけて割る
			const dx = (fx * scale) / dfx;
			x = x - dx;

			if (dx === 0n) break; // 収束判定
		}
		return x;
	}
	/**
	 * sin(π * z)
	 * @param {BigInt} z
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 */
	static _sinPi(z, precision) {
		// π * z / scale のsinを計算
		// 既存の_sinと_pi使う想定
		const pi = this._pi(precision);
		const x = (pi * z) / 10n ** precision;
		return this._sin(x, precision);
	}
	// ====================================================================================================
	// * 対数・指数・自然定数
	// ====================================================================================================
	// --------------------------------------------------
	// 指数関数
	// --------------------------------------------------
	/**
	 * 指数関数のTaylor展開
	 * @param {BigInt} x
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @static
	 */
	static _exp(x, precision) {
		const scale = 10n ** precision;
		let sum = scale;
		let term = scale;
		let n = 1n;

		while (true) {
			term = (term * x) / (scale * n); // term *= x / n
			if (term === 0n) break;
			sum += term;
			n++;
		}
		return sum;
	}
	/**
	 * 指数関数
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {this}
	 * @throws {Error}
	 */
	exp() {
		const construct = this.constructor;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;
		const expInt = construct._exp(val, totalPr);
		return this._makeResult(expInt, this._precision, totalPr);
	}
	/**
	 * 2の指数関数
	 * @param {BigInt} value
	 * @param {BigInt} precision
	 * @param {number} maxSteps
	 * @returns {BigInt}
	 * @static
	 */
	static _exp2(value, precision, maxSteps) {
		const LN2 = this._ln2(precision, maxSteps);
		const scale = 10n ** precision;

		return this._exp((LN2 * value) / scale, precision);
	}
	/**
	 * 2の指数関数
	 * @returns {this}
	 */
	exp2() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.lnMaxSteps;
		const exPr = config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;
		const exp2Int = construct._exp2(val, totalPr, maxSteps);
		return this._makeResult(exp2Int, this._precision, totalPr);
	}
	/**
	 * 指数関数 exp(x) - 1
	 * @param {BigInt} value
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @static
	 */
	static _expm1(value, precision) {
		const scale = 10n ** precision;

		// |x| が小さい場合はテイラー級数で近似
		const absValue = value < 0n ? -value : value;
		const threshold = scale / 10n; // 適当な小さい値の閾値

		if (absValue < threshold) {
			// テイラー展開で計算 (x + x^2/2 + x^3/6 + ... 最大 maxSteps 項)
			let term = value; // 初項 x
			let result = term;
			let factorial = 1n;
			let addend = 1n;
			for (let n = 2n; addend !== 0n; n++) {
				factorial *= n;
				term = (term * value) / scale; // x^n
				addend = term / factorial;
				result += addend;
			}
			return result;
		} else {
			// 大きい値は exp(x) - 1 = exp(x) - 1 を計算（_expは別途実装想定）
			return this._exp(value, precision) - scale;
		}
	}
	/**
	 * 指数関数 exp(x) - 1
	 * @returns {this}
	 */
	expm1() {
		const construct = this.constructor;
		const exPr = construct.config.extraPrecision;
		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;
		const expInt = construct._expm1(val, totalPr);
		return this._makeResult(expInt, this._precision, totalPr);
	}
	// --------------------------------------------------
	// 対数関数
	// --------------------------------------------------
	/**
	 * 自然対数[Atanh法]
	 * @param {BigInt} value
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _ln(value, precision, maxSteps) {
		if (value <= 0n) throw new Error("ln(x) is undefined for x <= 0");

		const scale = 10n ** precision;

		let x = value;
		let k = 0n;
		while (x > 10n * scale) {
			x /= 10n;
			k += 1n;
		}
		while (x < scale) {
			x *= 10n;
			k -= 1n;
		}

		const z = ((x - scale) * scale) / (x + scale);
		let zSquared = (z * z) / scale;

		let term = z;
		let result = term;
		for (let n = 1n; n < maxSteps; n++) {
			term = (term * zSquared) / scale; // 次の奇数乗 z^(2n+1)
			const denom = 2n * n + 1n;
			const addend = term / denom;
			if (addend === 0n) break;
			result += addend;
		}

		const LN10 = this._ln10(precision, maxSteps);
		return 2n * result + k * LN10;
	}
	/**
	 * 自然対数 ln(x)
	 * @returns {BigFloat}
	 */
	ln() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const config = construct.config;
		const maxSteps = config.lnMaxSteps;
		const exPr = config.extraPrecision;

		const totalPr = this._precision + exPr;
		const val = this.value * 10n ** exPr;

		const raw = construct._ln(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}
	/**
	 * 対数
	 * @param {BigInt} baseValue
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _log(value, baseValue, precision, maxSteps) {
		if (value === 1n) return 0n;
		const lnB = this._ln(baseValue, precision, maxSteps);
		if (lnB === 0n) throw new Error("log base cannot be 1 or 0");
		const lnX = this._ln(value, precision, maxSteps);

		// log_b(x) = ln(x) / ln(b)
		const SCALE = 10n ** precision;
		const result = (lnX * SCALE) / lnB;

		return result;
	}
	/**
	 * 対数
	 * @param {BigFloat} base
	 * @returns {BigFloat}
	 */
	log(base) {
		const [valA, valB, exPrec, prec] = this._bothRescale(base, true);

		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const maxSteps = construct.config.lnMaxSteps;
		const raw = construct._log(valA, valB, exPrec, maxSteps);
		return this._makeResult(raw, prec, exPrec);
	}
	/**
	 * 底2の対数
	 * @param {BigInt} value
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 * @static
	 */
	static _log2(value, precision, maxSteps) {
		const scale = 10n ** precision;
		const baseValue = 2n * scale;
		return this._log(value, baseValue, precision, maxSteps);
	}
	/**
	 * 底2の対数
	 * @returns {BigFloat}
	 */
	log2() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const maxSteps = construct.config.lnMaxSteps;
		const exPrec = construct.config.extraPrecision;
		const totalPr = this._precision + exPrec;
		const val = this.value * 10n ** exPrec;
		const raw = construct._log2(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}
	/**
	 * 底10の対数
	 * @param {BigInt} value
	 * @returns {BigInt}
	 * @static
	 */
	static _log10(value, precision, maxSteps) {
		const baseValue = 10n * 10n ** precision;
		return this._log(value, baseValue, precision, maxSteps);
	}
	/**
	 * 底10の対数
	 * @returns {BigFloat}
	 */
	log10() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const maxSteps = construct.config.lnMaxSteps;
		const exPrec = construct.config.extraPrecision;
		const totalPr = this._precision + exPrec;
		const val = this.value * 10n ** exPrec;
		const raw = construct._log10(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}
	/**
	 * 対数 log(1 + x)
	 * @returns {BigFloat}
	 * @static
	 */
	static _log1p(value, precision, maxSteps) {
		// 1 + x を計算
		const scale = 10n ** precision;
		const onePlusX = scale + value;

		// _logを利用して log(1+x) を計算
		return this._log(onePlusX, scale, precision, maxSteps);
	}
	/**
	 * 対数 log(1 + x)
	 * @returns {BigFloat}
	 */
	log1p() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const maxSteps = construct.config.lnMaxSteps;
		const exPrec = construct.config.extraPrecision;
		const totalPr = this._precision + exPrec;
		const val = this.value * 10n ** exPrec;
		const raw = construct._log1p(val, totalPr, maxSteps);
		return this._makeResult(raw, this._precision, totalPr);
	}
	// --------------------------------------------------
	// 定数（対数関連）
	// --------------------------------------------------
	/**
	 * 自然対数 ln(10) (簡易計算用)
	 * @param {BigInt} precision - 精度
	 * @param {BigInt} [maxSteps=10000n] - 最大反復回数
	 * @returns {BigInt}
	 * @static
	 */
	static _ln10(precision, maxSteps = 10000n) {
		const scale = 10n ** precision;
		const x = 10n * scale; // ln(10) の対象

		// z = (x - ONE) / (x + ONE)
		const z = ((x - scale) * scale) / (x + scale);
		const zSquared = (z * z) / scale;

		let term = z;
		let result = term;

		for (let n = 1n; n < maxSteps; n++) {
			term = (term * zSquared) / scale;
			const denom = 2n * n + 1n;
			const addend = term / denom;
			if (addend === 0n) break;
			result += addend;
		}

		return 2n * result;
	}
	/**
	 * 自然対数 ln(2)
	 * @param {BigInt} precision
	 * @param {BigInt} maxSteps
	 * @returns {BigInt}
	 */
	static _ln2(precision, maxSteps) {
		const scale = 10n ** precision;
		return this._ln(2n * scale, precision, maxSteps);
	}
	// --------------------------------------------------
	// 自然対数の底・定数
	// --------------------------------------------------
	/**
	 * ネイピア数
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @static
	 */
	static _e(precision) {
		if (this._getCheckCache("e", precision)) {
			return this._getCache("e", precision);
		}

		const scale = 10n ** precision;
		const eInt = this._exp(scale, precision);

		this._updateCache("e", eInt, precision);
		return eInt;
	}
	/**
	 * ネイピア数
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static e(precision = 20n) {
		precision = BigInt(precision);
		this._checkPrecision(precision);

		const exPr = this.config.extraPrecision;
		const totalPr = precision + exPr;

		const eInt = this._e(totalPr);
		return this._makeResult(eInt, precision, totalPr);
	}
	// ====================================================================================================
	// * 定数（π, τ）
	// ====================================================================================================
	// --------------------------------------------------
	// π関連の計算手法
	// --------------------------------------------------
	/**
	 * 円周率[Gregory-Leibniz法] (超高速・超低収束)
	 * @param {BigInt} [precision=20n] - 精度
	 * @param {BigInt} [mulPrecision=100n] - 計算精度の倍率
	 * @returns {BigInt}
	 * @static
	 */
	static _piLeibniz(precision = 20n, mulPrecision = 100n) {
		const scale = 10n ** precision;
		const iterations = precision * mulPrecision;
		let sum = 0n;

		const scale_4 = scale * 4n;
		const ZERO = 0n;
		const ONE = 1n;
		const TWO = 2n;

		let lastTerm = 0n;
		for (let i = 0n; i < iterations; i++) {
			const term = scale_4 / (TWO * i + ONE);
			if (term === lastTerm) break;
			lastTerm = term;
			sum += i % TWO === ZERO ? term : -term;
		}

		return sum;
	}
	/**
	 * 円周率[ニュートン法] (高速・低収束)
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigInt}
	 * @static
	 */
	static _piNewton(precision = 20n) {
		const EXTRA = 10n;
		const prec = precision + EXTRA;

		const atan1_5 = this._atanMachine(5n, prec);
		const atan1_239 = this._atanMachine(239n, prec);

		const value = 16n * atan1_5 - 4n * atan1_239;

		return value / 10n ** EXTRA;
	}
	/**
	 * 円周率[Chudnovsky法] (低速・高収束)
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigInt}
	 * @static
	 */
	static _piChudnovsky(precision = 20n) {
		const scale = 10n ** precision;
		const digitsPerTerm = 14n;
		const terms = precision / digitsPerTerm + 1n;

		const C = 426880n * this._sqrt(10005n * scale, precision);
		let sum = 0n;

		function bigPower(base, exp) {
			let res = 1n;
			for (let i = 0n; i < exp; i++) res *= base;
			return res;
		}

		for (let k = 0n; k < terms; k++) {
			const numerator = this._factorial(6n * k) * (545140134n * k + 13591409n) * (k % 2n === 0n ? 1n : -1n);
			const denominator = this._factorial(3n * k) * bigPower(this._factorial(k), 3n) * bigPower(640320n, 3n * k);

			sum += (scale * numerator) / denominator;
		}

		if (sum === 0n) {
			logging.error("Chudnovsky法の計算に失敗しました");
			return 0n;
		}

		// C / sum = π⁻¹ → π = 1/π⁻¹
		return (C * scale) / sum;
	}
	// --------------------------------------------------
	// π定数
	// --------------------------------------------------
	/**
	 * 円周率
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigInt}
	 * @static
	 */
	static _pi(precision) {
		const piAlgorithm = this.config.piAlgorithm;
		if (this._getCheckCache("pi", precision, piAlgorithm)) {
			return this._getCache("pi", precision);
		}

		let piRet;
		switch (piAlgorithm) {
			case BigFloatConfig.PI_CHUDNOVSKY: // 3
				piRet = this._piChudnovsky(precision);
				break;
			case BigFloatConfig.PI_NEWTON: // 2
				piRet = this._piNewton(precision);
				break;
			case BigFloatConfig.PI_LEIBNIZ: // 1
				piRet = this._piLeibniz(precision);
				break;
			case BigFloatConfig.PI_MATH_DEFAULT: // 0
			default:
				this._checkPrecision(precision);
				return new this(`${Math.PI}`, precision).value;
		}

		// キャッシュ
		this._updateCache("pi", piRet, precision, piAlgorithm);
		return piRet;
	}
	/**
	 * 円周率
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static pi(precision = 20n) {
		precision = BigInt(precision);
		this._checkPrecision(precision);

		const piRet = new this();
		piRet.value = this._pi(precision);
		piRet._precision = precision;
		return piRet;
	}
	// --------------------------------------------------
	// τ定数
	// --------------------------------------------------
	/**
	 * 円周率の2倍
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigInt}
	 * @static
	 */
	static _tau(precision) {
		const pi = this._pi(precision);
		return pi * 2n;
	}
	/**
	 * 円周率の2倍
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigFloat}
	 * @static
	 */
	static tau(precision = 20n) {
		precision = BigInt(precision);
		this._checkPrecision(precision);

		const tauRet = new this();
		tauRet.value = this._tau(precision);
		tauRet._precision = precision;
		return tauRet;
	}
	// ====================================================================================================
	// * 統計関数
	// ====================================================================================================
	// --------------------------------------------------
	// 集計
	// --------------------------------------------------
	/**
	 * 最大値を返す
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static max(...args) {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) throw new Error("No arguments provided");

		const [scaled, prec] = this._batchRescale(arr);

		let max = scaled[0];
		for (let i = 1; i < scaled.length; i++) {
			if (scaled[i] > max) max = scaled[i];
		}

		return this._makeResult(max, prec);
	}
	/**
	 * 最小値を返す
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static min(...args) {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) throw new Error("No arguments provided");

		const [scaled, prec] = this._batchRescale(arr);

		let min = scaled[0];
		for (let i = 1; i < scaled.length; i++) {
			if (scaled[i] < min) min = scaled[i];
		}

		return this._makeResult(min, prec);
	}
	/**
	 * 合計値を返す
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static sum(...args) {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) return new this();

		const [scaled, prec] = this._batchRescale(arr);
		const totalVal = scaled.reduce((acc, cur) => acc + cur, 0n);
		return this._makeResult(totalVal, prec);
	}
	/**
	 * 積を返す (丸め誤差に注意)
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static product(...args) {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) return new this("1");

		const [scaled, exPrec, prec] = this._batchRescale(arr, true);
		// 積をBigIntで計算
		let prod = new this(1, exPrec);
		for (const item of scaled) {
			const a = new this();
			a.value = item;
			a._precision = exPrec;
			prod = prod.mul(a);
		}
		return this._makeResult(prod.value, prec, exPrec);
	}
	// --------------------------------------------------
	// 平均・中央値
	// --------------------------------------------------
	/**
	 * 平均値を返す
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static average(...args) {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) return new this();

		const total = this.sum(arr);
		return total.div(new this(arr.length));
	}
	/**
	 * 中央値を返す
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static median(...args) {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) throw new Error("No arguments provided");

		const [scaled, prec] = this._batchRescale(arr);
		// valでソート
		const sorted = scaled.sort();
		const mid = Math.floor(sorted.length / 2);

		if (sorted.length % 2 === 1) {
			return this._makeResult(sorted[mid], prec);
		} else {
			// 偶数の場合は中間2つの平均
			const a = new this();
			a.value = sorted[mid - 1];
			a._precision = prec;
			const b = new this();
			b.value = sorted[mid];
			b._precision = prec;
			return a.add(b).div(2);
		}
	}
	// --------------------------------------------------
	// 分散・標準偏差
	// --------------------------------------------------
	/**
	 * 分散を返す
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static variance(...args) {
		const arr = this._normalizeArgs(args);
		if (arr.length === 0) throw new Error("No arguments provided");
		if (arr.length === 1) return new this("0");

		const [scaled, exPrec, prec] = this._batchRescale(arr, true);
		const n = new this(arr.length, exPrec);

		// 平均値計算
		const total = this.sum(arr);
		const meanVal = total.div(n).changePrecision(exPrec);

		// 分散 = Σ(x_i - mean)^2 / n
		let sumSquares = 0n;
		for (const item of scaled) {
			const a = new this();
			a.value = item;
			a._precision = exPrec;
			const diff = a.sub(meanVal);
			sumSquares += diff.mul(diff).value;
		}

		const sumS = new this();
		sumS.value = sumSquares;
		sumS._precision = exPrec;

		// 分散は元の精度に合わせて返す
		return this._makeResult(sumS.div(n).value, prec, exPrec);
	}
	/**
	 * 標準偏差を返す
	 * @param {...(BigFloat | number | string | BigInt) | Array<BigFloat | number | string | BigInt>} args
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static stddev(...args) {
		const variance = this.variance(args);
		return variance.sqrt();
	}
	// ====================================================================================================
	// * ランダム・乱数生成
	// ====================================================================================================
	/**
	 * bigintの乱数を生成する
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 */
	static _randomBigInt(precision) {
		const maxSteps = this.config.lnMaxSteps;
		const scale = 10n ** precision;
		// 0 <= r < scale になる乱数BigIntを作る
		// JSのMath.randomは53bitまでなので複数回繰り返し足し合わせる
		let result = 0n;
		const maxBits = this._log2(scale * scale, precision, maxSteps);
		const rawBits = (maxBits + scale - 1n) / scale; // ← ceil相当
		const rounds = Number((rawBits + 52n) / 53n);

		for (let i = 0; i < rounds; i++) {
			// 53bit乱数取得
			const r = BigInt(Math.floor(Math.random() * Number(2 ** 53)));
			result = (result << 53n) + r;
		}
		return result % scale;
	}
	/**
	 * 乱数を生成する
	 * @param {BigInt} [precision=20n] - 精度
	 * @returns {BigFloat}
	 * @throws {Error}
	 * @static
	 */
	static random(precision = 20n) {
		precision = BigInt(precision);
		this._checkPrecision(precision);
		let randBigInt = this._randomBigInt(precision);
		return this._makeResult(randBigInt, precision);
	}
	// ====================================================================================================
	// * 特殊関数・積分・ガンマ関数など
	// ====================================================================================================
	// --------------------------------------------------
	// ガンマ関数・積分
	// --------------------------------------------------
	/**
	 * 台形積分
	 * @param {(k:BigInt) => BigInt} f
	 * @param {BigInt} a - スケール済
	 * @param {BigInt} b - スケール済
	 * @param {BigInt} n
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @static
	 */
	static _integral(f, a, b, n, precision) {
		const scale = 10n ** precision;

		if (n <= 0n || a === b) return 0n;

		const delta = b - a;

		let sum = f(a) + f(b);

		for (let i = 1n; i < n; i++) {
			const numerator = a * n + i * delta;
			const x_i = numerator / n;
			const term = 2n * f(x_i);
			if (term === 0n) break;
			sum += term;
		}

		const denominator = scale * n * 2n;
		if (denominator === 0n) return 0n;
		return (delta * sum) / denominator;
	}

	/**
	 * ベルヌーイ数 [阿部-Zeta関数/Akiyama-Tanigawaアルゴリズム]
	 * @param {number} n - ベルヌーイ数のインデックス (偶数のみ有効)
	 * @param {BigInt} precision - 精度
	 * @returns {BigInt[]} 0からnまでのベルヌーイ数の配列
	 * @static
	 */
	static _bernoulliNumbers(n, precision) {
		const A = new Array(n + 1).fill(0n);
		const B = new Array(n + 1).fill(0n);

		const scale = 10n ** precision;

		for (let m = 0; m <= n; m++) {
			A[m] = scale / BigInt(m + 1);
			for (let j = m; j >= 1; j--) {
				const term = A[j - 1] - A[j];
				A[j - 1] = BigInt(j) * term;
			}
			B[m] = A[0];
		}

		if (n >= 1) {
			B[1] = -scale / 2n;
		}
		return B;
	}

	/**
	 * Lanczos-Spouge近似のパラメータ a を決定
	 * @param {BigInt} precision - 精度
	 * @returns {number} 非スケール
	 * @static
	 */
	static _getSpougeParamA(precision) {
		const config = this.config;
		const maxSteps = config.lnMaxSteps;
		const log10_2pi = this._log10(2n * this._pi(precision), precision, maxSteps);

		const b = new this();
		b.value = precision * log10_2pi;
		b._precision = precision;

		// 予備で+10
		const calculated_a = Math.ceil(b.toNumber() + 10);
		// a > 2 が必要。
		return Math.max(3, calculated_a);
	}

	/**
	 * Lanczos-Spouge近似の係数を動的に計算
	 * @param {number} numCoeffs - 係数の数
	 * @param {number} a - 非スケール
	 * @param {BigInt} precision - 精度
	 * @returns {BigInt[]} 係数
	 * @static
	 */
	static _lanczosSpougeCoefficients(numCoeffs, a, precision) {
		const scale = 10n ** precision;
		const half_scale = scale / 2n;

		const aBig = BigInt(a) * scale;

		const coeffs = [scale];

		let sign = 1n;
		for (let k = 1; k < numCoeffs; k++) {
			const k_minus_1_fact = this._factorial(BigInt(k - 1));

			const kBig = BigInt(k) * scale;

			// (-k + a)
			const term_base = aBig - kBig;
			// k - 1/2
			const term1_exp = kBig - half_scale;
			// (-k + a)^(k - 1/2)
			const term1 = this._pow(term_base, term1_exp, precision);

			// e^(-k + a)
			const term2 = this._exp(term_base, precision);

			//let c_k = (((((sign * scale) / k_minus_1_fact) * term1) / scale) * term2) / scale;
			let c_k = (sign * term1 * term2) / (k_minus_1_fact * scale);

			coeffs.push(c_k);

			sign *= -1n;
		}
		return coeffs;
	}

	/**
	 * gamma関数[Lanczos-Spouge近似]
	 * @param {BigInt} z - スケール済
	 * @param {BigInt} precision - 精度
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _gammaLanczos(z, precision) {
		const scale = 10n ** precision;
		if (z <= 0n && z % scale === 0n) {
			throw new Error("z must not be a minus integer");
		}
		const scale2 = scale * scale;
		const half_scale = scale / 2n;

		if (z < half_scale) {
			const config = this.config;
			const maxSteps = config.trigFuncsMaxSteps;
			// 反射公式
			const pi = this._pi(precision);
			const oneMinusZ = scale - z;
			const gammaOneMinusZ = this._gammaLanczos(oneMinusZ, precision);
			const pi_z = (pi * z) / scale;
			const sin_pi_z = this._sin(pi_z, precision, maxSteps);
			const denominator = sin_pi_z * gammaOneMinusZ; // scale^2
			if (denominator === 0n) {
				throw new Error("division by zero");
			}
			return (pi * scale2) / denominator;
		}

		const a = this._getSpougeParamA(precision);
		const numCoeffs = Math.trunc(a);
		const coeffs = this._lanczosSpougeCoefficients(numCoeffs, a, precision);

		const z_minus_1 = z - scale;
		let series = coeffs[0];
		for (let k = 1; k < numCoeffs; k++) {
			const term = (coeffs[k] * scale) / (z_minus_1 + BigInt(k) * scale);
			series += term;
		}

		const t = z_minus_1 + BigInt(a) * scale;
		const exponent = z - half_scale;
		const t_pow_exp = this._pow(t, exponent, precision);
		const exp_minus_t = this._exp(-t, precision);

		return (t_pow_exp * exp_minus_t * series) / scale2;
	}

	/**
	 * ガンマ関数[Lanczos-Spouge近似]
	 * @returns {BigFloat}
	 */
	gamma() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const exPrec = construct.config.extraPrecision;
		const totalPr = this._precision + exPrec;
		const val = this.value * 10n ** exPrec;
		const raw = construct._gammaLanczos(val, totalPr);
		return this._makeResult(raw, this._precision, totalPr);
	}
	// --------------------------------------------------
	// 階乗・二項係数
	// --------------------------------------------------
	/**
	 * 階乗を計算する (整数のみ)
	 * @param {BigInt} n - スケールなし
	 * @returns {BigInt}
	 * @static
	 */
	static _factorial(n) {
		let f = 1n;
		for (let i = 2n; i <= n; i++) f *= i;
		return f;
	}
	/**
	 * 階乗を計算する (小数対応)
	 * @param {BigInt} n - スケールあり
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @static
	 */
	static _factorialGamma(n, precision) {
		const scale = 10n ** precision;
		return this._gammaLanczos(n + scale, precision);
	}
	/**
	 * 階乗を計算する (小数計算の場合の精度に注意)
	 * @returns {BigFloat}
	 */
	factorial() {
		/** @type {typeof BigFloat} */
		const construct = this.constructor;
		const exPrec = construct.config.extraPrecision;
		const totalPr = this._precision + exPrec;
		const val = this.value * 10n ** exPrec;
		const scale = 10n ** totalPr;
		let raw;
		if (val % scale === 0n && val >= 0n) {
			// 整数の場合
			raw = construct._factorial(val / scale) * scale;
		} else {
			// 小数の場合
			raw = construct._factorialGamma(val, totalPr);
		}
		return this._makeResult(raw, this._precision, totalPr);
	}
	/**
	 * 二項係数を計算する
	 * @param {BigInt} n
	 * @param {BigInt} k
	 * @returns {BigInt}
	 * @static
	 */
	static _binomial(n, k) {
		if (k > n) return 0n;
		if (k > n - k) k = n - k;
		let result = 1n;
		for (let i = 1n; i <= k; i++) {
			result = (result * (n - i + 1n)) / i;
		}
		return result;
	}
	// ====================================================================================================
	// * キャッシュ管理
	// ====================================================================================================
	/**
	 * キャッシュを取得すべきか判定
	 * @param {String} key
	 * @param {BigInt} precision
	 * @param {Number} [priority=0]
	 * @returns {Boolean}
	 * @static
	 */
	static _getCheckCache(key, precision, priority = 0) {
		const cachedData = this._cached[key];
		return cachedData && cachedData.precision >= precision && cachedData.priority >= priority;
	}
	/**
	 * キャッシュを取得する
	 * @param {String} name
	 * @param {BigInt} precision
	 * @returns {BigInt}
	 * @throws {Error}
	 * @static
	 */
	static _getCache(key, precision) {
		const cachedData = this._cached[key];
		if (cachedData) {
			return this._round(cachedData.value, cachedData.precision, precision);
		}
		throw new Error(`use _getCheckCache first`);
	}
	/**
	 * キャッシュを更新する
	 * @param {String} key
	 * @param {BigInt} value
	 * @param {BigInt} precision
	 * @param {Number} [priority=0]
	 * @static
	 */
	static _updateCache(key, value, precision, priority = 0) {
		const cachedData = this._cached[key];
		if (cachedData && cachedData.precision >= precision && cachedData.priority >= priority) {
			return;
		}
		this._cached[key] = { value, precision, priority };
	}
	// ====================================================================================================
	// * 定数オブジェクト
	// ====================================================================================================
	/**
	 * -1のBigFloat
	 * @param {BigInt} [precision=20n] 精度
	 * @returns {BigFloat}
	 * @static
	 */
	static minusOne(precision = 20n) {
		return new this(-1n, precision);
	}
	/**
	 * 0のBigFloat
	 * @param {BigInt} [precision=20n] 精度
	 * @returns {BigFloat}
	 * @static
	 */
	static zero(precision = 20n) {
		return new this(0n, precision);
	}
	/**
	 * 1のBigFloat
	 * @param {BigInt} [precision=20n] 精度
	 * @returns {BigFloat}
	 * @static
	 */
	static one(precision = 20n) {
		return new this(1n, precision);
	}
}

/**
 * BigFloat を作成する
 * @param {string | number | BigInt | BigFloat} value 初期値
 * @param {number} [precision=20] 精度
 * @returns {BigFloat}
 * @throws {Error}
 */
function bigFloat(value, precision) {
	return new BigFloat(value, precision);
}

module.exports = {
	BigFloatConfig,
	BigFloat,
	bigFloat,
};

},{"../libs/cache/CacheWrapper":8,"../libs/sys/JavaLibraryScriptCore":11,"../libs/sys/Logger":12}],18:[function(require,module,exports){
module.exports = {
    ...require("./BigFloat.js")
};

},{"./BigFloat.js":17}],19:[function(require,module,exports){
const IndexProxy = require("../libs/IndexProxy");
const ListInterface = require("./ListInterface");
const TypeChecker = require("../libs/TypeChecker");
const StreamChecker = require("./stream/StreamChecker");
const Stream = require("./stream/Stream");

/**
 * 型チェック機能のついたList
 * @template V
 * @extends {ListInterface<V>}
 * @class
 */
class ArrayList extends ListInterface {
	/**
	 * @param {Function} ValueType
	 * @param {Iterable<V>} [collection]
	 */
	constructor(ValueType, collection) {
		super(ValueType);
		this._list = [];

		if (collection) this.addAll(collection);

		IndexProxy.defineInitData(this);
	}

	/**
	 * instanceof を実装する
	 * @param {any} obj
	 * @returns {boolean}
	 */
	[Symbol.hasInstance](obj) {
		return IndexProxy.hasInstance(this, obj);
	}

	// ==================================================
	// 基本操作
	// ==================================================

	/**
	 * 要素を追加する
	 * @param {V} item
	 * @returns {this}
	 * @throws {TypeError}
	 */
	add(item) {
		this._checkValue(item);
		this._list.push(item);
		return this;
	}

	/**
	 * 値を一括で追加する
	 * @param {Iterable<V>} collection
	 * @returns {this}
	 * @throws {TypeError}
	 */
	addAll(collection) {
		for (const item of collection) {
			this.add(item);
		}
		return this;
	}

	/**
	 * 指定したインデックスの要素を取得する
	 * @param {Number} index
	 * @returns {V}
	 */
	get(index) {
		return this._list[index];
	}

	/**
	 * 指定したインデックスの要素を設定する
	 * @param {Number} index
	 * @param {V} item
	 * @returns {this}
	 * @throws {TypeError}
	 */
	set(index, item) {
		this._checkValue(item);
		this._list[index] = item;
		return this;
	}

	/**
	 * 指定したインデックスの要素を削除する
	 * @param {Number} index
	 * @returns {V}
	 */
	remove(index) {
		return this._list.splice(index, 1)[0];
	}

	/**
	 * 要素数を返却する
	 * @returns {Number}
	 * @readonly
	 */
	get size() {
		return this._list.length;
	}

	/**
	 * 全要素を削除する
	 */
	clear() {
		this._list.length = 0;
	}

	// ==================================================
	// 追加機能
	// ==================================================

	/**
	 * 等価判定を行う
	 * @param {this} other
	 * @returns {boolean}
	 */
	equals(other) {
		if (!(other instanceof ArrayList) || this.size !== other.size) return false;

		for (let i = 0; i < this.size; i++) {
			if (this._list[i] !== other._list[i]) return false;
		}
		return true;
	}

	/**
	 * EnumのIteratorを返却する
	 * @returns {ArrayIterator<V>}
	 */
	values() {
		return this._list.values();
	}

	/**
	 * 全てのデータを呼び出す
	 * @param {Function} callback
	 * @param {any} [thisArg]
	 */
	forEach(callback, thisArg) {
		for (const item of this._list) {
			callback.call(thisArg, item, item, this._list);
		}
	}

	/**
	 * ソートする
	 * @param {Function} [compareFn]
	 * @returns {this}
	 */
	sort(compareFn = undefined) {
		this._list.sort(compareFn);
	}

	/**
	 * ソートしたStreamを返却する
	 * @param {Function} [compareFn]
	 * @returns {Generator<V>}
	 */
	*sorted(compareFn = undefined) {
		yield* this.toArray().sort(compareFn);
	}

	/**
	 * 指定した範囲の配列を返却する
	 * @param {Number} from
	 * @param {Number} to
	 * @returns {ArrayList<V>}
	 */
	subList(from, to) {
		if (from < 0 || to > this.size || from > to) {
			throw new RangeError(`subList(${from}, ${to}) は無効な範囲です`);
		}
		return new this.constructor(this._ValueType, this._list.slice(from, to));
	}

	// ==================================================
	// Stream
	// ==================================================

	/**
	 * Streamを返却する
	 * @returns {Stream<V>}
	 */
	stream() {
		return StreamChecker.typeToStream(this._ValueType).from(this._list, this._ValueType);
	}

	// ==================================================
	// 基本操作(システム)
	// ==================================================

	/**
	 * 配列に変換する
	 * @returns {V[]}
	 */
	toArray() {
		return this._list.slice();
	}

	/**
	 * 文字列に変換する
	 * @returns {string}
	 */
	toString() {
		return `${this.constructor.name}<${TypeChecker.typeNames(this._ValueType)}>(size=${this.size})`;
	}

	/**
	 * イテレータを返却する
	 * @returns {Iterator<V>}
	 */
	[Symbol.iterator]() {
		return this.values();
	}
}

/**
 * 直接参照機能を提供する
 * @type {IndexProxy<ArrayList>}
 * @readonly
 */
const indProxy = new IndexProxy(ArrayList);

/**
 * 配列を返却する
 * @param {Function} ValueType
 * @param {Iterable<V>} [collection]
 * @returns {ArrayList<V>}
 */
function arrayList(ValueType, collection) {
	return indProxy.create(ValueType, collection);
}

module.exports = { ArrayList, arrayList };

},{"../libs/IndexProxy":5,"../libs/TypeChecker":7,"./ListInterface":22,"./stream/Stream":30,"./stream/StreamChecker":31}],20:[function(require,module,exports){
const { TypeChecker } = require("../libs");
const MapInterface = require("./MapInterface");
const EntryStream = require("./stream/EntryStream");

/**
 * 型チェック機能のついたMap
 * @template K, V
 * @extends {MapInterface<K, V>}
 * @class
 */
class HashMap extends MapInterface {
	/**
	 * @param {Function} KeyType
	 * @param {Function} ValueType
	 */
	constructor(KeyType, ValueType) {
		super(KeyType, ValueType);
	}

	// ==================================================
	// 基本操作(override)
	// ==================================================

	/**
	 * データを追加・更新する
	 * @param {K} key
	 * @param {V} value
	 * @returns {this}
	 * @throws {TypeError}
	 */
	set(key, value) {
		this._checkKey(key);
		this._checkValue(value);
		return super.set(key, value);
	}
	/**
	 * データを追加・更新する
	 * @param {K} key
	 * @param {V} value
	 * @returns {this}
	 * @throws {TypeError}
	 */
	put(key, value) {
		return this.set(key, value);
	}

	/**
	 * データを一括で追加・更新する
	 * @param {Map<K, V>} map
	 * @throws {TypeError}
	 */
	setAll(map) {
		for (const [k, v] of map.entries()) {
			this.set(k, v);
		}
	}
	/**
	 * データを一括で追加・更新する
	 * @param {Map<K, V>} map
	 * @throws {TypeError}
	 */
	putAll(map) {
		return this.setAll(map);
	}

	/**
	 * データを取得する
	 * @param {K} key
	 * @returns {V}
	 * @throws {TypeError}
	 */
	get(key) {
		this._checkKey(key);
		return super.get(key);
	}

	/**
	 * Keyの存在を確認する
	 * @param {K} key
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	has(key) {
		this._checkKey(key);
		return super.has(key);
	}
	/**
	 * Keyの存在を確認する
	 * @param {K} key
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	containsKey(key) {
		return this.has(key);
	}

	/**
	 * Valueの存在を確認する
	 * @param {V} value
	 * @returns {boolean}
	 */
	containsValue(value) {
		for (const v of super.values()) {
			if (v === value) return true;
		}
		return false;
	}

	/**
	 * データを削除する
	 * @param {K} key
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	delete(key) {
		this._checkKey(key);
		return super.delete(key);
	}
	/**
	 * データを削除する
	 * @param {K} key
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	remove(key) {
		return this.delete(key);
	}

	/**
	 * EntrySetを返却する
	 * @returns {MapIterator<[...[K, V]]>}
	 */
	entrySet() {
		return this.entries();
	}

	// ==================================================
	// 追加機能
	// ==================================================

	/**
	 * 等価判定を行う
	 * @param {this} otherMap
	 * @returns {boolean}
	 */
	equals(otherMap) {
		if (!(otherMap instanceof Map) || this.size !== otherMap.size) return false;
		for (const [k, v] of this.entries()) {
			if (!otherMap.has(k) || otherMap.get(k) !== v) return false;
		}
		return true;
	}

	/**
	 * 全てのデータを呼び出す
	 * @param {Function} callback
	 * @param {any} thisArg
	 */
	forEach(callback, thisArg) {
		for (const [key, value] of this.entries()) {
			callback.call(thisArg, value, key, this);
		}
	}

	// ==================================================
	// Stream
	// ==================================================

	/**
	 * Streamを返却する
	 * @returns {EntryStream<K, V>}
	 */
	stream() {
		return EntryStream.from(this.entries(), this._KeyType, this._ValueType);
	}

	// ==================================================
	// 基本操作(システム)
	// ==================================================

	/**
	 * 文字列に変換する
	 * @returns {string}
	 */
	toString() {
		return `${this.constructor.name}<${TypeChecker.typeNames(this._KeyType)}, ${TypeChecker.typeNames(this._ValueType)}>(size=${this.size})`;
	}

	/**
	 * イテレータを返却する
	 * @returns {Iterator<V>}
	 */
	[Symbol.iterator]() {
		return this.entries();
	}
}

module.exports = HashMap;

},{"../libs":10,"./MapInterface":23,"./stream/EntryStream":28}],21:[function(require,module,exports){
const SetInterface = require("./SetInterface");
const TypeChecker = require("../libs/TypeChecker");
const StreamChecker = require("./stream/StreamChecker");
const Stream = require("./stream/Stream");

/**
 * 型チェック機能のついたSet
 * @template V
 * @extends {SetInterface<V>}
 * @class
 */
class HashSet extends SetInterface {
	/**
	 * @param {Function} ValueType
	 */
	constructor(ValueType) {
		super(ValueType);
	}

	// ==================================================
	// 基本操作(override)
	// ==================================================

	/**
	 * 値を追加する
	 * @param {V} value
	 * @returns {this}
	 * @throws {TypeError}
	 */
	add(value) {
		this._checkValue(value);
		return super.add(value);
	}

	/**
	 * 値を一括で追加する
	 * @param {Iterable<V>} collection
	 * @returns {this}
	 * @throws {TypeError}
	 */
	addAll(collection) {
		for (const item of collection) {
			this.add(item);
		}
		return this;
	}

	/**
	 * 値の存在を確認
	 * @param {V} value
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	has(value) {
		this._checkValue(value);
		return super.has(value);
	}
	/**
	 * 値の存在を確認
	 * @param {V} value
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	contains(value) {
		return this.has(value);
	}

	/**
	 * 全ての値の存在を確認
	 * @param {Iterable<V>} collection
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	containsAll(collection) {
		for (const item of collection) {
			if (!this.has(item)) return false;
		}
		return true;
	}

	/**
	 * 値を削除する
	 * @param {V} value
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	delete(value) {
		this._checkValue(value);
		return super.delete(value);
	}
	/**
	 * 値を削除する
	 * @param {V} value
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	remove(value) {
		return this.delete(value);
	}

	/**
	 * 全ての値を削除する
	 * @param {Iterable<V>} collection
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	removeAll(collection) {
		let modified = false;
		for (const item of collection) {
			modified = this.delete(item) || modified;
		}
		return modified;
	}

	/**
	 * 含まれない要素を全削除する
	 * @param {Iterable<V>} collection
	 * @returns {boolean}
	 * @throws {TypeError}
	 */
	retainAll(collection) {
		const otherSet = new Set(collection);
		let modified = false;
		for (const item of this) {
			if (!otherSet.has(item)) {
				this.delete(item);
				modified = true;
			}
		}
		return modified;
	}

	// ==================================================
	// 追加機能
	// ==================================================

	/**
	 * 等価判定を行う
	 * @param {this} otherSet
	 * @returns {boolean}
	 */
	equals(otherSet) {
		if (!(otherSet instanceof Set) || this.size !== otherSet.size) return false;
		for (const item of this) {
			if (!otherSet.has(item)) return false;
		}
		return true;
	}

	/**
	 * 全てのデータを呼び出す
	 * @param {Function} callback
	 * @param {any} [thisArg]
	 */
	forEach(callback, thisArg) {
		for (const item of this) {
			callback.call(thisArg, item, item, this);
		}
	}

	// ==================================================
	// Stream
	// ==================================================

	/**
	 * Streamを返却する
	 * @returns {Stream<V>}
	 */
	stream() {
		return StreamChecker.typeToStream(this._ValueType).from(this.values(), this._ValueType);
	}

	// ==================================================
	// 基本操作(システム)
	// ==================================================

	/**
	 * 配列に変換する
	 * @returns {V[]}
	 */
	toArray() {
		return Array.from(this);
	}

	/**
	 * 文字列に変換する
	 * @returns {string}
	 */
	toString() {
		return `${this.constructor.name}<${TypeChecker.typeNames(this._ValueType)}>(size=${this.size})`;
	}

	/**
	 * イテレータを返却する
	 * @returns {Iterator<V>}
	 */
	[Symbol.iterator]() {
		return this.values();
	}
}

module.exports = HashSet;

},{"../libs/TypeChecker":7,"./SetInterface":24,"./stream/Stream":30,"./stream/StreamChecker":31}],22:[function(require,module,exports){
const JavaLibraryScriptCore = require("../libs/sys/JavaLibraryScriptCore");
const Interface = require("../base/Interface");
const TypeChecker = require("../libs/TypeChecker");

const Any = TypeChecker.Any;
const NoReturn = TypeChecker.NoReturn;
const NotNull = TypeChecker.NotNull;
const NotUndefined = TypeChecker.NotUndefined;

const NotEmpty = [NotNull, NotUndefined];

/**
 * Listの基底クラス
 * @template V
 * @extends {JavaLibraryScriptCore}
 * @class
 * @abstract
 * @interface
 */
class ListInterface extends JavaLibraryScriptCore {
	/**
	 * @param {Function} ValueType
	 */
	constructor(ValueType) {
		super();
		this._ValueType = ValueType || Any;
	}

	/**
	 * Valueの型をチェックする
	 * @param {V} value
	 * @throws {TypeError}
	 */
	_checkValue(value) {
		if (!TypeChecker.matchType(value, this._ValueType)) {
			throw new TypeError(`値型が一致しません。期待: ${TypeChecker.typeNames(this._ValueType)} → 実際: ${TypeChecker.stringify(value)}`);
		}
	}

	/**
	 * 空かどうかを返却する
	 * @returns {boolean}
	 */
	isEmpty() {
		return this.size === 0;
	}
}

ListInterface = Interface.convert(ListInterface, {
	add: { args: [NotEmpty], returns: ListInterface },
	get: { args: [Number], returns: Any },
	set: { args: [Number, NotEmpty], returns: ListInterface },
	remove: { args: [Number], returns: Any },
	isEmpty: { returns: Boolean, abstract: true },
	clear: { returns: NoReturn },
	toArray: { returns: Array },
});

module.exports = ListInterface;

},{"../base/Interface":2,"../libs/TypeChecker":7,"../libs/sys/JavaLibraryScriptCore":11}],23:[function(require,module,exports){
const Interface = require("../base/Interface");
const TypeChecker = require("../libs/TypeChecker");

const Any = TypeChecker.Any;
const NoReturn = TypeChecker.NoReturn;
const NotNull = TypeChecker.NotNull;
const NotUndefined = TypeChecker.NotUndefined;

const NotEmpty = [NotNull, NotUndefined];

/**
 * Mapの基底クラス
 * @template K, V
 * @extends {Map<K, V>}
 * @class
 * @abstract
 * @interface
 */
class MapInterface extends Map {
	/**
	 * @param {Function} KeyType
	 * @param {Function} ValueType
	 */
	constructor(KeyType, ValueType) {
		super();
		this._KeyType = KeyType || Any;
		this._ValueType = ValueType || Any;
	}

	/**
	 * Keyの型をチェックする
	 * @param {K} key
	 * @throws {TypeError}
	 */
	_checkKey(key) {
		if (!TypeChecker.matchType(key, this._KeyType)) {
			throw new TypeError(`キー型が一致しません。期待: ${TypeChecker.typeNames(this._KeyType)} → 実際: ${TypeChecker.stringify(key)}`);
		}
	}

	/**
	 * Valueの型をチェックする
	 * @param {V} value
	 * @throws {TypeError}
	 */
	_checkValue(value) {
		if (!TypeChecker.matchType(value, this._ValueType)) {
			throw new TypeError(`値型が一致しません。期待: ${TypeChecker.typeNames(this._ValueType)} → 実際: ${TypeChecker.stringify(value)}`);
		}
	}

	/**
	 * 空かどうかを返却する
	 * @returns {boolean}
	 */
	isEmpty() {
		return this.size === 0;
	}
}

MapInterface = Interface.convert(MapInterface, {
	set: { args: [NotEmpty, NotEmpty], returns: MapInterface, abstract: true },
	put: { args: [NotEmpty, NotEmpty], returns: MapInterface },
	get: { args: [NotEmpty], returns: Any, abstract: true },
	delete: { args: [NotEmpty], returns: Boolean, abstract: true },
	remove: { args: [NotEmpty], returns: Boolean },
	isEmpty: { returns: Boolean, abstract: true },
	clear: { returns: NoReturn },
	has: { args: [NotEmpty], returns: Boolean, abstract: true },
	containsKey: { args: [NotEmpty], returns: Boolean },
	containsValue: { args: [NotEmpty], returns: Boolean },
});

module.exports = MapInterface;

},{"../base/Interface":2,"../libs/TypeChecker":7}],24:[function(require,module,exports){
const Interface = require("../base/Interface");
const TypeChecker = require("../libs/TypeChecker");

const Any = TypeChecker.Any;
const NoReturn = TypeChecker.NoReturn;
const NotNull = TypeChecker.NotNull;
const NotUndefined = TypeChecker.NotUndefined;

const NotEmpty = [NotNull, NotUndefined];

/**
 * Setの基底クラス
 * @template V
 * @extends {Set<V>}
 * @class
 * @abstract
 * @interface
 */
class SetInterface extends Set {
	/**
	 * @param {Function} ValueType
	 */
	constructor(ValueType) {
		super();
		this._ValueType = ValueType || Any;
	}

	/**
	 * Valueの型をチェックする
	 * @param {V} value
	 * @throws {TypeError}
	 */
	_checkValue(value) {
		if (!TypeChecker.matchType(value, this._ValueType)) {
			throw new TypeError(`値型が一致しません。期待: ${TypeChecker.typeNames(this._ValueType)} → 実際: ${TypeChecker.stringify(value)}`);
		}
	}

	/**
	 * 空かどうかを返却する
	 * @returns {boolean}
	 */
	isEmpty() {
		return this.size === 0;
	}
}

SetInterface = Interface.convert(SetInterface, {
	add: { args: [NotEmpty], returns: SetInterface },
	delete: { args: [NotEmpty], returns: Boolean },
	remove: { args: [NotEmpty], returns: Boolean },
	isEmpty: { returns: Boolean, abstract: true },
	clear: { returns: NoReturn },
	has: { args: [NotEmpty], returns: Boolean },
	contains: { args: [NotEmpty], returns: Boolean },
});

module.exports = SetInterface;

},{"../base/Interface":2,"../libs/TypeChecker":7}],25:[function(require,module,exports){
module.exports = {
    ...require("./ArrayList.js"),
    HashMap: require("./HashMap.js"),
    HashSet: require("./HashSet.js"),
    ListInterface: require("./ListInterface.js"),
    MapInterface: require("./MapInterface.js"),
    SetInterface: require("./SetInterface.js"),
    stream: require("./stream/index.js")
};

},{"./ArrayList.js":19,"./HashMap.js":20,"./HashSet.js":21,"./ListInterface.js":22,"./MapInterface.js":23,"./SetInterface.js":24,"./stream/index.js":34}],26:[function(require,module,exports){
const StreamInterface = require("./StreamInterface");
const Stream = require("./Stream");

/**
 * 非同期Stream (LazyAsyncList)
 * @extends {StreamInterface}
 * @class
 */
class AsyncStream extends StreamInterface {
	/**
	 * @param {Iterable | AsyncIterator} source
	 */
	constructor(source) {
		super();
		this._iter = AsyncStream._normalize(source);
		this._pipeline = [];
	}

	/**
	 * AsyncStream化
	 * @template {AsyncStream} T
	 * @this {new (iterable: Iterable | AsyncIterator) => T}
	 * @param {Iterable | AsyncIterator} iterable
	 * @returns {T}
	 * @static
	 */
	static from(iterable) {
		return new AsyncStream(iterable);
	}

	/**
	 * Iterable化
	 * @param {Iterable | AsyncIterator} input
	 * @returns {AsyncIterator}
	 */
	static _normalize(input) {
		if (typeof input[Symbol.asyncIterator] === "function") return input;
		if (typeof input[Symbol.iterator] === "function") {
			return (async function* () {
				for (const x of input) yield x;
			})();
		}
		throw new TypeError("not (Async)Iterable");
	}

	// ==================================================
	// パイプライン計算
	// ==================================================

	/**
	 * pipelineに追加
	 * @param {Generator} fn
	 * @returns {this}
	 */
	_use(fn) {
		this._pipeline.push(fn);
		return this;
	}

	/**
	 * pipelineを圧縮
	 * @returns {this}
	 */
	flattenPipeline() {
		const flattenedFn = this._pipeline.reduceRight(
			(nextFn, currentFn) => {
				return async function* (iterable) {
					yield* currentFn(nextFn(iterable));
				};
			},
			async function* (x) {
				yield* x;
			}
		);
		const flat = new this.constructor([]);
		flat._iter = this._iter;
		flat._pipeline = [flattenedFn];
		return flat;
	}

	/**
	 * 処理を一括関数化
	 * @returns {Function}
	 */
	toFunction() {
		const flat = this.flattenPipeline();
		const fn = flat._pipeline[0];
		return (input) => fn(input);
	}

	// ==================================================
	// Pipeline
	// ==================================================

	/**
	 * AsyncStreamをマップ
	 * @param {Function | Promise} fn
	 * @returns {this}
	 */
	map(fn) {
		return this._use(async function* (iter) {
			for await (const x of iter) yield await fn(x);
		});
	}

	/**
	 * AsyncStreamをフィルタ
	 * @param {Function | Promise} fn
	 * @returns {this}
	 */
	filter(fn) {
		return this._use(async function* (iter) {
			for await (const x of iter) {
				if (await fn(x)) yield x;
			}
		});
	}

	/**
	 * AsyncStreamを展開
	 * @param {Function | Promise} fn
	 * @returns {this}
	 */
	flatMap(fn) {
		return this._use(async function* (iter) {
			for await (const x of iter) {
				const sub = await fn(x);
				for await (const y of AsyncStream._normalize(sub)) yield y;
			}
		});
	}

	/**
	 * AsyncStreamの重複を排除
	 * @param {Function | Promise} keyFn
	 * @returns {this}
	 */
	distinct(keyFn = (x) => x) {
		return this._use(async function* (iter) {
			const seen = new Set();
			for await (const x of iter) {
				const key = await keyFn(x);
				if (!seen.has(key)) {
					seen.add(key);
					yield x;
				}
			}
		});
	}

	/**
	 * AsyncStreamの要素は変更せずに関数のみを実行
	 * @param {Function} fn
	 * @returns {this}
	 */
	peek(fn) {
		return this._use(async function* (iter) {
			for await (const x of iter) {
				fn(x);
				yield x;
			}
		});
	}

	/**
	 * AsyncStreamの要素数を先頭から制限
	 * @param {Number} n
	 * @returns {this}
	 */
	limit(n) {
		return this._use(async function* (iter) {
			let i = 0;
			for await (const x of iter) {
				if (i++ < n) yield x;
				else break;
			}
		});
	}

	/**
	 * AsyncStreamの要素数を先頭からスキップ
	 * @param {Number} n
	 * @returns {this}
	 */
	skip(n) {
		return this._use(async function* (iter) {
			let i = 0;
			for await (const x of iter) {
				if (i++ >= n) yield x;
			}
		});
	}

	// ==================================================
	// Iterator
	// ==================================================

	/**
	 * Streamをイテレータ化(非同期)
	 * @returns {AsyncIterator}
	 */
	[Symbol.asyncIterator]() {
		let iter = this._iter;
		for (const op of this._pipeline) {
			iter = op(iter);
		}
		return iter[Symbol.asyncIterator]();
	}
	// ==================================================
	// End
	// ==================================================

	/**
	 * AsyncStreamをforEach
	 * @param {Function | Promise} fn
	 * @async
	 */
	async forEach(fn) {
		for await (const x of this) {
			await fn(x);
		}
	}

	/**
	 * AsyncStreamを配列化
	 * @returns {Array}
	 * @async
	 */
	async toArray() {
		const result = [];
		for await (const x of this) {
			result.push(x);
		}
		return result;
	}

	/**
	 * AsyncStreamをreduce
	 * @param {Function | Promise} fn
	 * @param {any} initial
	 * @returns {any}
	 * @async
	 */
	async reduce(fn, initial) {
		let acc = initial;
		for await (const x of this) {
			acc = await fn(acc, x);
		}
		return acc;
	}

	/**
	 * AsyncStreamの要素数を取得
	 * @returns {Number}
	 * @async
	 */
	async count() {
		return await this.reduce((acc) => acc + 1, 0);
	}

	/**
	 * AsyncStreamで条件を満たす要素があるか検査
	 * @param {Function | Promise} fn
	 * @returns {Boolean}
	 * @async
	 */
	async some(fn) {
		for await (const x of this) {
			if (await fn(x)) return true;
		}
		return false;
	}

	/**
	 * Streamで全ての要素が条件を満たすか検査
	 * @param {Function | Promise} fn
	 * @returns {Boolean}
	 * @async
	 */
	async every(fn) {
		for await (const x of this) {
			if (!(await fn(x))) return false;
		}
		return true;
	}

	/**
	 * AsyncStreamから最初の要素を取得
	 * @returns {any}
	 * @async
	 */
	async findFirst() {
		for await (const item of this) return item;
		return undefined;
	}

	/**
	 * Streamから任意の要素を取得
	 * @returns {any}
	 * @async
	 */
	async find() {
		return await this.findFirst();
	}

	/**
	 * Java Collectors 相当
	 * @param {Function} collectorFn
	 * @returns {any}
	 */
	collectWith(collectorFn) {
		return collectorFn(this);
	}

	// ==================================================
	// mapTo
	// ==================================================

	/**
	 * AsyncStreamをStreamに変換
	 * @returns {Stream}
	 * @async
	 */
	async toLazy() {
		const arr = [];
		for await (const item of this) {
			arr.push(item);
		}
		return new Stream(arr);
	}

	// ==================================================
	// その他
	// ==================================================

	/**
	 * 文字列に変換する
	 * @returns {String}
	 */
	toString() {
		return `${this.constructor.name}<Promise>`;
	}
}

module.exports = AsyncStream;

},{"./Stream":30,"./StreamInterface":32}],27:[function(require,module,exports){
const Stream = require("./Stream");
const { BigFloat } = require("../../math/BigFloat");

/**
 * BigFloat専用Stream (LazyList)
 * @extends {Stream<BigFloat>}
 * @class
 */
class BigFloatStream extends Stream {
	/**
	 * @param {Iterable<BigFloat>} source
	 */
	constructor(source) {
		super(source, BigFloat);

		this.mapToBigFloat = undefined;
	}

	// ====================================================================================================
	// * 内部ユーティリティ・補助関数
	// ====================================================================================================
	// --------------------------------------------------
	// 精度チェック
	// --------------------------------------------------
	/**
	 * 精度を変更する
	 * @param {BigInt} precision
	 * @returns {this}
	 * @throws {Error}
	 */
	changePrecision(precision) {
		return this.peek((x) => x.changePrecision(precision));
	}
	// ====================================================================================================
	// * 四則演算・基本関数
	// ====================================================================================================
	// --------------------------------------------------
	// 基本演算
	// --------------------------------------------------
	/**
	 * 加算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	add(other) {
		return this.map((x) => x.add(other));
	}
	/**
	 * 減算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	sub(other) {
		return this.map((x) => x.sub(other));
	}
	/**
	 * 乗算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	mul(other) {
		return this.map((x) => x.mul(other));
	}
	/**
	 * 除算
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	div(other) {
		return this.map((x) => x.div(other));
	}
	/**
	 * 剰余
	 * @param {BigFloat} other
	 * @returns {this}
	 * @throws {Error}
	 */
	mod(other) {
		return this.map((x) => x.mod(other));
	}
	// --------------------------------------------------
	// 符号操作
	// --------------------------------------------------
	/**
	 * 符号反転
	 * @returns {this}
	 * @throws {Error}
	 */
	neg() {
		return this.map((x) => x.neg());
	}
	/**
	 * 絶対値
	 * @returns {this}
	 * @throws {Error}
	 */
	abs() {
		return this.map((x) => x.abs());
	}
	/**
	 * 逆数を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	reciprocal() {
		return this.map((x) => x.reciprocal());
	}
	// ====================================================================================================
	// * 冪乗・ルート・スケーリング
	// ====================================================================================================
	// --------------------------------------------------
	// べき乗
	// --------------------------------------------------
	/**
	 * べき乗
	 * @param {BigFloat} exponent - 指数
	 * @returns {this}
	 */
	pow(exponent) {
		return this.map((x) => x.pow(exponent));
	}
	// --------------------------------------------------
	// 平方根・立方根・任意根
	// --------------------------------------------------
	/**
	 * 平方根
	 * @returns {this}
	 * @throws {Error}
	 */
	sqrt() {
		return this.map((x) => x.sqrt());
	}
	/**
	 * 立方根
	 * @returns {this}
	 * @throws {Error}
	 */
	cbrt() {
		return this.map((x) => x.cbrt());
	}
	/**
	 * n乗根
	 * @param {BigInt} n
	 * @returns {this}
	 * @throws {Error}
	 */
	nthRoot(n) {
		return this.map((x) => x.nthRoot(n));
	}
	// ====================================================================================================
	// * 統計関数
	// ====================================================================================================
	// --------------------------------------------------
	// 集計
	// --------------------------------------------------
	/**
	 * 最大値を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	max() {
		return BigFloat.max(this.toArray());
	}
	/**
	 * 最小値を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	min() {
		return BigFloat.min(this.toArray());
	}
	/**
	 * 合計値を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	sum() {
		return BigFloat.sum(this.toArray());
	}
	/**
	 * 積を返す (丸め誤差に注意)
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	product() {
		return BigFloat.product(this.toArray());
	}
	// --------------------------------------------------
	// 平均・中央値
	// --------------------------------------------------
	/**
	 * 平均値を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	average() {
		return BigFloat.average(this.toArray());
	}
	/**
	 * 中央値を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	median() {
		return BigFloat.median(this.toArray());
	}
	// --------------------------------------------------
	// 分散・標準偏差
	// --------------------------------------------------
	/**
	 * 分散を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	variance() {
		return BigFloat.variance(this.toArray());
	}
	/**
	 * 標準偏差を返す
	 * @returns {BigFloat}
	 * @throws {Error}
	 */
	stddev() {
		return BigFloat.stddev(this.toArray());
	}
	// ====================================================================================================
	// * 三角関数
	// ====================================================================================================
	// --------------------------------------------------
	// 基本三角関数
	// --------------------------------------------------
}

module.exports = BigFloatStream;

},{"../../math/BigFloat":17,"./Stream":30}],28:[function(require,module,exports){
const Stream = require("./Stream");
const StreamChecker = require("./StreamChecker");
const TypeChecker = require("../../libs/TypeChecker");

/** @typedef {import("../HashMap.js")} HashMapType */

const Any = TypeChecker.Any;

let HashMap;
function init() {
	if (HashMap) return;
	HashMap = require("../HashMap");
}

/**
 * Entry専用Stream (LazyList)
 * @template K, V
 * @extends {Stream<V>}
 * @class
 */
class EntryStream extends Stream {
	/**
	 * @param {Iterable<[K, V]>} source
	 * @param {Function} KeyType
	 * @param {Function} ValueType
	 */
	constructor(source, KeyType, ValueType) {
		super(source, ValueType);

		this.mapToEntry = undefined;
		this._KeyType = KeyType || Any;
	}

	/**
	 * Stream化
	 * @template {EntryStream} T
	 * @this {new (Iterable, Function, Function) => T}
	 * @param {Iterable} iterable
	 * @param {Function} KeyType
	 * @param {Function} ValueType
	 * @returns {T}
	 * @overload
	 * @static
	 */
	static from(iterable, KeyType, ValueType) {
		return new this(iterable, KeyType, ValueType);
	}

	/**
	 * EntryStreamからキーのStreamを返却
	 * @returns {Stream<K>}
	 */
	keys() {
		return this._convertToX(StreamChecker.typeToStream(this._KeyType)).map(([k, _]) => k);
	}

	/**
	 * EntryStreamから値のStreamを返却
	 * @returns {Stream<V>}
	 */
	values() {
		return this._convertToX(StreamChecker.typeToStream(this._ValueType)).map(([_, v]) => v);
	}

	/**
	 * EntryStreamのキーをマップ
	 * @param {Function} fn
	 * @returns {this}
	 */
	mapKeys(fn) {
		return this.map(([k, v]) => [fn(k), v]);
	}

	/**
	 * EntryStreamの値をマップ
	 * @param {Function} fn
	 * @returns {this}
	 */
	mapValues(fn) {
		return this.map(([k, v]) => [k, fn(v)]);
	}

	// ==================================================
	// to
	// ==================================================

	/**
	 * EntryStreamをHashMapに変換する
	 * @param {Function} [KeyType]
	 * @param {Function} [ValueType]
	 * @returns {HashMapType}
	 */
	toHashMap(KeyType = this._KeyType, ValueType = this._ValueType) {
		init();
		const map = new HashMap(KeyType, ValueType);
		this.forEach(([k, v]) => map.set(k, v));
		return map;
	}

	/**
	 * 文字列に変換する
	 * @returns {String}
	 * @override
	 */
	toString() {
		return `${this.constructor.name}<${TypeChecker.typeNames(this._KeyType)}, ${TypeChecker.typeNames(this._ValueType)}>`;
	}
}

module.exports = EntryStream;

},{"../../libs/TypeChecker":7,"../HashMap":20,"./Stream":30,"./StreamChecker":31}],29:[function(require,module,exports){
const Stream = require("./Stream");

/**
 * 数値専用Stream (LazyList)
 * @extends {Stream<Number>}
 * @class
 */
class NumberStream extends Stream {
	/**
	 * @param {Iterable<Number>} source
	 */
	constructor(source) {
		super(source, Number);

		this.mapToNumber = undefined;
	}

	/**
	 * 合計
	 * @returns {Number}
	 */
	sum() {
		let total = 0;
		for (const num of this) {
			total += num;
		}
		return total;
	}

	/**
	 * 平均
	 * @returns {Number}
	 */
	average() {
		let total = 0;
		let count = 0;
		for (const num of this) {
			total += num;
			count++;
		}
		return count === 0 ? NaN : total / count;
	}

	/**
	 * 最小値
	 * @returns {Number | null}
	 */
	min() {
		let min = Infinity;
		for (const num of this) {
			if (num < min) min = num;
		}
		return min === Infinity ? null : min;
	}

	/**
	 * 最大値
	 * @returns {Number | null}
	 */
	max() {
		let max = -Infinity;
		for (const num of this) {
			if (num > max) max = num;
		}
		return max === -Infinity ? null : max;
	}
}

module.exports = NumberStream;

},{"./Stream":30}],30:[function(require,module,exports){
const StreamInterface = require("./StreamInterface");
const TypeChecker = require("../../libs/TypeChecker");
const { BigFloat } = require("../../math/BigFloat");

const Any = TypeChecker.Any;

/** @typedef {import("./NumberStream.js")} NumberStreamType */
// /** @typedef {import("./StringStream.js")} StringStream_forceRep */ // なぜかこいつだけ動かん
/** @typedef {import("./BigFloatStream")} BigFloatStreamType */
/** @typedef {import("./EntryStream.js")} EntryStreamType */
/** @typedef {import("./AsyncStream.js")} AsyncStreamType */
/** @typedef {import("../HashSet.js")} HashSetType */

let NumberStream, StringStream, BigFloatStream, EntryStream, AsyncStream, HashSet;
function init() {
	if (NumberStream) return;
	NumberStream = require("./NumberStream");
	StringStream = require("./StringStream");
	BigFloatStream = require("./BigFloatStream");
	EntryStream = require("./EntryStream");
	AsyncStream = require("./AsyncStream");
	HashSet = require("../HashSet");
}

/**
 * Streamオブジェクト(LazyList)
 * @template V
 * @extends {StreamInterface}
 * @class
 */
class Stream extends StreamInterface {
	/**
	 * @param {Iterable<V>} source
	 * @param {Function} ValueType
	 */
	constructor(source, ValueType) {
		super();
		this._iter = source[Symbol.iterator]();
		this._pipeline = [];

		this._ValueType = ValueType || Any;

		init();
	}

	/**
	 * Stream化
	 * @template {Stream} T
	 * @this {new (Iterable) => T}
	 * @param {Iterable<V>} iterable
	 * @param {Function} ValueType
	 * @returns {T}
	 * @static
	 */
	static from(iterable, ValueType) {
		return new this(iterable, ValueType);
	}

	// ==================================================
	// パイプライン計算
	// ==================================================

	/**
	 * pipelineに追加
	 * @param {Generator} fn
	 * @returns {this}
	 */
	_use(fn) {
		this._pipeline.push(fn);
		return this;
	}

	/**
	 * 他Streamに変換
	 * @param {Function} construct
	 * @param {Generator} fn
	 * @param {...any} args
	 * @returns {this}
	 */
	_convertToX(construct, fn, ...args) {
		const newStream = new construct([], ...args);
		newStream._iter = this._iter;
		newStream._pipeline = [...this._pipeline];
		if (fn) newStream._pipeline.push(fn);
		return newStream;
	}

	/**
	 * pipelineを圧縮
	 * @returns {this}
	 */
	flattenPipeline() {
		const flattenedFn = this._pipeline.reduceRight(
			(nextFn, currentFn) => {
				return function* (iterable) {
					yield* currentFn(nextFn(iterable));
				};
			},
			(x) => x
		);

		const flat = new this.constructor([]); // 継承クラス対応
		flat._iter = this._iter;
		flat._pipeline = [flattenedFn];
		return flat;
	}

	/**
	 * 処理を一括関数化
	 * @returns {Function}
	 */
	toFunction() {
		const flat = this.flattenPipeline();
		const fn = flat._pipeline[0];
		return (input) => fn(input);
	}

	// ==================================================
	// Pipeline
	// ==================================================

	/**
	 * Streamをマップ
	 * @param {Function} fn
	 * @returns {this}
	 */
	map(fn) {
		return this._use(function* (iter) {
			for (const item of iter) yield fn(item);
		});
	}

	/**
	 * Streamをフィルタ
	 * @param {Function} fn
	 * @returns {this}
	 */
	filter(fn) {
		return this._use(function* (iter) {
			for (const item of iter) if (fn(item)) yield item;
		});
	}

	/**
	 * Streamを展開
	 * @param {Function} fn
	 * @returns {this}
	 */
	flatMap(fn) {
		return this._use(function* (iter) {
			for (const item of iter) {
				const sub = fn(item);
				yield* sub instanceof StreamInterface ? sub : sub[Symbol.iterator]();
			}
		});
	}

	/**
	 * Streamの重複を排除
	 * @param {Function} keyFn
	 * @returns {this}
	 */
	distinct(keyFn = JSON.stringify.bind(JSON)) {
		return this._use(function* (iter) {
			const seen = new Set();
			for (const item of iter) {
				const key = keyFn(item);
				if (!seen.has(key)) {
					seen.add(key);
					yield item;
				}
			}
		});
	}

	/**
	 * Streamをソート
	 * @param {Function} compareFn
	 * @returns {this}
	 */
	sorted(compareFn = (a, b) => (a > b ? 1 : a < b ? -1 : 0)) {
		return this._use(function* (iter) {
			const arr = [...iter].sort(compareFn);
			yield* arr;
		});
	}

	/**
	 * Streamの要素は変更せずに関数のみを実行
	 * @param {Function} fn
	 * @returns {this}
	 */
	peek(fn) {
		return this._use(function* (iter) {
			for (const item of iter) {
				fn(item);
				yield item;
			}
		});
	}

	/**
	 * Streamの要素数を先頭から制限
	 * @param {Number} n
	 * @returns {this}
	 */
	limit(n) {
		return this._use(function* (iter) {
			let i = 0;
			for (const item of iter) {
				if (i++ >= n) break;
				yield item;
			}
		});
	}

	/**
	 * Streamの要素数を先頭からスキップ
	 * @param {Number} n
	 * @returns {this}
	 */
	skip(n) {
		return this._use(function* (iter) {
			let i = 0;
			for (const item of iter) {
				if (i++ < n) continue;
				yield item;
			}
		});
	}

	/**
	 * Streamを分割
	 * @param {Number} size
	 * @returns {this}
	 */
	chunk(size) {
		return this._use(function* (iter) {
			let buf = [];
			for (const item of iter) {
				buf.push(item);
				if (buf.length === size) {
					yield buf;
					buf = [];
				}
			}
			if (buf.length) yield buf;
		});
	}

	/**
	 * Streamをスライド分割
	 * @param {Number} size
	 * @param {Number} step
	 * @returns {this}
	 */
	windowed(size, step = size) {
		return this._use(function* (iter) {
			const buffer = [];
			for (const item of iter) {
				buffer.push(item);
				if (buffer.length === size) {
					yield buffer.slice();
					buffer.splice(0, step); // スライド
				}
			}
		});
	}

	// ==================================================
	// Iterator
	// ==================================================

	/**
	 * Streamをイテレータ化
	 * @returns {Iterator}
	 */
	[Symbol.iterator]() {
		return this._pipeline.reduce((iter, fn) => fn(iter), this._iter);
	}

	/**
	 * Streamをイテレータ化(非同期)
	 * @returns {AsyncIterator}
	 */
	[Symbol.asyncIterator]() {
		let iter = this._pipeline.reduce((i, fn) => fn(i), this._iter);
		return {
			async next() {
				return Promise.resolve(iter.next());
			},
		};
	}

	// ==================================================
	// End
	// ==================================================

	/**
	 * StreamをforEach
	 * @param {Function} fn
	 */
	forEach(fn) {
		for (const item of this) fn(item);
	}

	/**
	 * Streamを配列化
	 * @returns {V[]}
	 */
	toArray() {
		return Array.from(this);
	}

	/**
	 * Streamをreduce
	 * @param {Function} fn
	 * @param {any} initial
	 * @returns {any}
	 */
	reduce(fn, initial) {
		let acc = initial;
		for (const item of this) {
			acc = fn(acc, item);
		}
		return acc;
	}

	/**
	 * Streamの要素数を取得
	 * @returns {Number}
	 */
	count() {
		let c = 0;
		for (const _ of this) c++;
		return c;
	}

	/**
	 * Streamで条件を満たす要素があるか検査
	 * @param {Function} fn
	 * @returns {Boolean}
	 */
	some(fn) {
		for (const item of this) {
			if (fn(item)) return true;
		}
		return false;
	}

	/**
	 * Streamで全ての要素が条件を満たすか検査
	 * @param {Function} fn
	 * @returns {Boolean}
	 */
	every(fn) {
		for (const item of this) {
			if (!fn(item)) return false;
		}
		return true;
	}

	/**
	 * Streamから最初の要素を取得
	 * @returns {any}
	 */
	findFirst() {
		for (const item of this) return item;
		return undefined;
	}

	/**
	 * Streamから任意の要素を取得
	 * @returns {any}
	 */
	findAny() {
		return this.findFirst(); // 同義（非並列）
	}

	/**
	 * Java Collectors 相当
	 * @param {Function} collectorFn
	 * @returns {any}
	 */
	collectWith(collectorFn) {
		return collectorFn(this);
	}

	// ==================================================
	// mapTo
	// ==================================================

	/**
	 * StreamをNumberStreamに変換
	 * @param {Function} fn
	 * @returns {NumberStreamType}
	 */
	mapToNumber(fn) {
		return this._convertToX(NumberStream, function* (iter) {
			for (const item of iter) {
				const mapped = fn(item);
				if (typeof mapped !== "number") {
					throw new TypeError(`mapToNumber() must return number. Got ${typeof mapped}`);
				}
				yield mapped;
			}
		});
	}

	/**
	 * StreamをStringStreamに変換
	 * @param {Function} fn
	 * @returns {StringStream_forceRep}
	 */
	mapToString(fn) {
		return this._convertToX(StringStream, function* (iter) {
			for (const item of iter) {
				const mapped = fn(item);
				if (typeof mapped !== "string") {
					throw new TypeError(`mapToString() must return string. Got ${typeof mapped}`);
				}
				yield mapped;
			}
		});
	}

	/**
	 * StreamをBigFloatStreamに変換
	 * @param {Function | number | BigInt} [fn=20n] - 数値なら自動変換
	 * @returns {BigFloatStreamType}
	 */
	mapToBigFloat(fn = 20n) {
		const type = typeof fn;
		return this._convertToX(BigFloatStream, function* (iter) {
			for (const item of iter) {
				let mapped;

				if (type === "function") mapped = fn(item);
				else if (type === "number" || type === "bigint") {
					mapped = new BigFloat(item, fn);
				}
				if (!(mapped instanceof BigFloat)) {
					throw new TypeError(`mapToBigFloat() must return BigFloat. Got ${typeof mapped}`);
				}
				yield mapped;
			}
		});
	}

	/**
	 * StreamをEntryStreamに変換
	 * @param {Function} fn
	 * @returns {EntryStreamType}
	 */
	mapToEntry(fn) {
		return this._convertToX(
			EntryStream,
			function* (iter) {
				for (const item of iter) {
					const entry = fn(item);
					if (!Array.isArray(entry) || entry.length !== 2) {
						throw new TypeError(`mapToEntry() must return [key, value] pair. Got: ${entry}`);
					}
					yield entry;
				}
			},
			Any,
			Any
		);
	}

	/**
	 * StreamをAsyncStreamに変換
	 * @param {Function} fn
	 * @returns {AsyncStreamType}
	 */
	mapToAsync(fn) {
		const input = this.flattenPipeline();
		const sourceIterable = input._pipeline[0](input._iter); // 実行（同期 generator）

		// AsyncStream に渡す非同期イテレータを構築
		const asyncIterable = (async function* () {
			for (const item of sourceIterable) {
				yield await fn(item);
			}
		})();

		return new AsyncStream(asyncIterable);
	}

	// ==================================================
	// to
	// ==================================================

	/**
	 * StreamをHashSetに変換
	 * @param {Function} [ValueType]
	 * @returns {HashSetType}
	 */
	toHashSet(ValueType = this._ValueType) {
		const set = new HashSet(ValueType);
		for (const item of this) set.add(item);
		return set;
	}

	/**
	 * 文字列に変換する
	 * @returns {String}
	 */
	toString() {
		return `${this.constructor.name}<${TypeChecker.typeNames(this._ValueType)}>`;
	}
}

module.exports = Stream;

},{"../../libs/TypeChecker":7,"../../math/BigFloat":17,"../HashSet":21,"./AsyncStream":26,"./BigFloatStream":27,"./EntryStream":28,"./NumberStream":29,"./StreamInterface":32,"./StringStream":33}],31:[function(require,module,exports){
const JavaLibraryScriptCore = require("../../libs/sys/JavaLibraryScriptCore");
const TypeChecker = require("../../libs/TypeChecker");
const StreamInterface = require("./StreamInterface");
const { BigFloat } = require("../../math/BigFloat");

let Stream, NumberStream, StringStream, BigFloatStream, EntryStream, AsyncStream;
function init() {
	if (Stream) return;
	Stream = require("./Stream");
	NumberStream = require("./NumberStream");
	StringStream = require("./StringStream");
	BigFloatStream = require("./BigFloatStream");
	EntryStream = require("./EntryStream");
	AsyncStream = require("./AsyncStream");
}

/**
 * Streamの型チェック
 * @extends {JavaLibraryScriptCore}
 * @class
 */
class StreamChecker extends JavaLibraryScriptCore {
	/**
	 * TypeをStreamに変換する
	 * @param {Function} expected
	 * @returns {StreamInterface}
	 */
	static typeToStream(expected) {
		init();
		if (expected == null) return Stream;
		if (expected === String) return StringStream;
		if (expected === Number) return NumberStream;
		if (expected?.prototype instanceof BigFloat) return BigFloatStream;
		if (expected === Map) return EntryStream;
		if (expected === Promise) return AsyncStream;
		return Stream;
	}

	/**
	 * StreamをTypeに変換する
	 * @param {StreamInterface} stream
	 * @returns {Function}
	 * @static
	 */
	static streamToType(stream) {
		init();
		// Stream継承
		if (stream instanceof StringStream) return String;
		if (stream instanceof NumberStream) return Number;
		if (stream instanceof BigFloatStream) return BigFloat;
		if (stream instanceof EntryStream) return Map;
		// StreamInterface継承
		if (stream instanceof AsyncStream) return Promise;
		if (stream instanceof Stream) return TypeChecker.Any;
		return null;
	}
}

module.exports = StreamChecker;

},{"../../libs/TypeChecker":7,"../../libs/sys/JavaLibraryScriptCore":11,"../../math/BigFloat":17,"./AsyncStream":26,"./BigFloatStream":27,"./EntryStream":28,"./NumberStream":29,"./Stream":30,"./StreamInterface":32,"./StringStream":33}],32:[function(require,module,exports){
const JavaLibraryScriptCore = require("../../libs/sys/JavaLibraryScriptCore");
const Interface = require("../../base/Interface");

/**
 * Streamの基底クラス
 * @extends {JavaLibraryScriptCore}
 * @class
 * @abstract
 */
class StreamInterface extends JavaLibraryScriptCore {
	constructor() {
		super();
	}
}

StreamInterface = Interface.convert(StreamInterface, {
	map: {
		args: [Function],
		returns: StreamInterface,
	},
	filter: {
		args: [Function],
		returns: StreamInterface,
	},
	flatMap: {
		args: [Function],
		returns: StreamInterface,
	},
	//
	forEach: {
		args: [[Function, Promise]],
		returns: [undefined, Promise],
	},
});

module.exports = StreamInterface;

},{"../../base/Interface":2,"../../libs/sys/JavaLibraryScriptCore":11}],33:[function(require,module,exports){
const Stream = require("./Stream");

/**
 * 文字列専用Stream (LazyList)
 * @extends {Stream<String>}
 * @class
 */
class StringStream extends Stream {
	/**
	 * @param {Iterable<String>} source
	 */
	constructor(source) {
		super(source, String);

		this.mapToString = undefined;
	}

	/**
	 * 文字列連結
	 * @param {string} separator
	 * @returns {string}
	 */
	join(separator = " ") {
		return Array.from(this).join(separator);
	}

	/**
	 * 文字列を結合
	 * @returns {string}
	 */
	concatAll() {
		return this.join("");
	}

	/**
	 * 最長の文字列を返す
	 * @returns {string}
	 */
	longest() {
		let max = "";
		for (const str of this) {
			if (str.length > max.length) max = str;
		}
		return max || null;
	}

	/**
	 * 最短の文字列を返す
	 * @returns {string}
	 */
	shortest() {
		let min = null;
		for (const str of this) {
			if (min === null || str.length < min.length) min = str;
		}
		return min || null;
	}
}

module.exports = StringStream;

},{"./Stream":30}],34:[function(require,module,exports){
module.exports = {
    AsyncStream: require("./AsyncStream.js"),
    BigFloatStream: require("./BigFloatStream.js"),
    EntryStream: require("./EntryStream.js"),
    NumberStream: require("./NumberStream.js"),
    Stream: require("./Stream.js"),
    StreamChecker: require("./StreamChecker.js"),
    StreamInterface: require("./StreamInterface.js"),
    StringStream: require("./StringStream.js")
};

},{"./AsyncStream.js":26,"./BigFloatStream.js":27,"./EntryStream.js":28,"./NumberStream.js":29,"./Stream.js":30,"./StreamChecker.js":31,"./StreamInterface.js":32,"./StringStream.js":33}]},{},[16])
//# sourceMappingURL=JavaLibraryScript.js.map
