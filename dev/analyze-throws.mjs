import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";

/**
 * @typedef {{
 *   rootDir: string;
 *   allowedDynamicDirs: string[];
 * }} AnalyzeConfig
 *
 * @typedef {{
 *   file: string;
 *   line: number;
 *   message: string;
 * }} ThrowWarning
 */

/**
 * throw文のハンドリング状況を解析して警告を返す
 * @param {AnalyzeConfig} config
 * @returns {ThrowWarning[]}
 */
export function analyzeThrows(config) {
	const result = [];
	const project = new Project({
		tsConfigFilePath: path.join(config.rootDir, "tsconfig.json"),
		skipAddingFilesFromTsConfig: false,
	});

	const sourceFiles = project.getSourceFiles().filter((sf) => !sf.getFilePath().includes("/test/"));

	// [チェック1] 未補足の `throw` 文を検出
	for (const sourceFile of sourceFiles) {
		const throwStmts = sourceFile.getDescendantsOfKind(SyntaxKind.ThrowStatement);

		for (const throwStmt of throwStmts) {
			if (isThrowStatementHandled(throwStmt)) continue;

			// 匿名関数の場合は、さらに外側の関数を探す
			const func = findDocumentableEnclosingFunction(throwStmt);

			// default export + allowedDir + @throws があれば許容
			if (isAllowedThrowContext(func, sourceFile.getFilePath(), config.allowedDynamicDirs)) continue;

			// その他：@throwsがあれば許容、それ以外は警告
			if (hasThrowsJSDoc(func)) {
				// コメントチェック
				const throwsTags = getThrowsTags(func);
				for (const tag of throwsTags) {
					if (
						!tag
							.getText()
							.replace(/\{[^}]*\}/, "")
							.trim()
					) {
						result.push({
							file: path.relative(config.rootDir, sourceFile.getFilePath()) || sourceFile.getFilePath(),
							line: tag.getStartLineNumber(),
							message: "@throws に説明コメントがありません",
						});
					}
				}
				continue;
			}

			result.push({
				file: path.relative(config.rootDir, sourceFile.getFilePath()) || sourceFile.getFilePath(),
				line: throwStmt.getStartLineNumber(),
				message: "未補足のthrowがあります（@throwsなし）",
			});
		}
	}

	// [チェック2] `@throws` を持つ関数の呼び出し元がハンドリングしているか検出
	const throwingFunctions = [];
	for (const sourceFile of sourceFiles) {
		const functions = sourceFile.getFunctions();
		const classes = sourceFile.getClasses();
		const methods = classes.flatMap((c) => c.getMethods());
		const constructors = classes.flatMap((c) => c.getConstructors());
		const allFuncs = [...functions, ...methods, ...constructors];

		for (const func of allFuncs) {
			if (hasThrowsJSDoc(func)) {
				throwingFunctions.push(func);
			}
		}
	}

	for (const throwingFunc of throwingFunctions) {
		const nameNode = getFunctionNameNode(throwingFunc);
		if (!nameNode) continue;

		const references = nameNode.findReferences();
		for (const ref of references) {
			for (const refEntry of ref.getReferences()) {
				const refNode = refEntry.getNode();
				const callExpr = refNode.getParentIfKind(SyntaxKind.CallExpression);
				if (!callExpr) continue;

				const handled = isCallHandledByTryCatch(callExpr) || isCallHandledByPromise(callExpr) || isCallHandledByDelegation(callExpr, throwingFunc);

				if (!handled) {
					const funcName = Node.isNamed(throwingFunc) ? throwingFunc.getName() : "(constructor)";
					result.push({
						file: path.relative(config.rootDir, refNode.getSourceFile().getFilePath()) || refNode.getSourceFile().getFilePath(),
						line: refNode.getStartLineNumber(),
						message: `@throws が付与された関数'${funcName}'がここで呼び出されていますが、エラーがハンドリングされていません。`,
					});
				}
			}
		}
	}

	return result;
}

function findEnclosingFunction(node) {
	return node.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isFunctionExpression(a) || Node.isArrowFunction(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a));
}

/**
 * JSDoc を付与可能な外側の関数を探す
 */
function findDocumentableEnclosingFunction(node) {
	let current = node;
	while (true) {
		const func = current.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isFunctionExpression(a) || Node.isArrowFunction(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a));

		if (!func) return null;

		// 名前がある、または変数に代入されている、またはメソッド/コンストラクタならドキュメント可能
		if (isDocumentableFunction(func)) return func;

		current = func;
	}
}

function isDocumentableFunction(func) {
	// クラスのメソッドやコンストラクタはドキュメント可能
	if (Node.isMethodDeclaration(func) || Node.isConstructorDeclaration(func)) return true;

	// 関数宣言がトップレベルまたは名前付きでエクスポートされている場合はドキュメント可能
	if (Node.isFunctionDeclaration(func)) {
		const parent = func.getParent();
		return Node.isSourceFile(parent) || Node.isModuleDeclaration(parent);
	}

	// 変数に代入されている関数（ArrowFunction / FunctionExpression）
	if (Node.isArrowFunction(func) || Node.isFunctionExpression(func)) {
		const varDecl = func.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		if (varDecl) {
			const varStmt = varDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
			if (varStmt) {
				const parent = varStmt.getParent();
				// トップレベルの変数宣言ならドキュメント可能
				return Node.isSourceFile(parent) || Node.isModuleDeclaration(parent);
			}
		}
	}

	return false;
}

/**
 * 関数の名前ノードを安全に取得（ArrowFunction対応）
 */
function getFunctionNameNode(func) {
	if (!func) return null;

	if (func.getNameNode) {
		const nameNode = func.getNameNode();
		if (nameNode) return nameNode;
	}

	if (Node.isArrowFunction(func)) {
		const varDecl = func.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		if (varDecl) return varDecl.getNameNode();
	}

	return null;
}

/**
 * [チェック1用] throw文がtry/catchまたは.catch()で処理されているか
 * @param {import("ts-morph").ThrowStatement} throwStmt
 * @returns {boolean}
 */
function isThrowStatementHandled(throwStmt) {
	if (throwStmt.getFirstAncestorByKind(SyntaxKind.TryStatement)) return true;

	const func = findEnclosingFunction(throwStmt);
	if (!func) return false;

	const nameNode = getFunctionNameNode(func);
	if (!nameNode) return false;

	const refs = nameNode.findReferences();
	for (const ref of refs) {
		for (const refSymbol of ref.getReferences()) {
			const parent = refSymbol.getNode().getParent();
			if (!parent) continue;

			if (Node.isCallExpression(parent)) {
				if (isCallHandledByPromise(parent)) return true;
				if (isCallHandledByTryCatch(parent)) return true;
			}
		}
	}
	return false;
}

/**
 * [チェック2用] 呼び出しがtry/catchブロックに囲まれているか
 * @param {import("ts-morph").Node} node
 * @returns {boolean}
 */
function isCallHandledByTryCatch(node) {
	return !!node.getAncestors().some((a) => Node.isTryStatement(a));
}

/**
 * [チェック1, 2共通] Promiseチェーンで.catch()または.then(null, onRejected)が呼ばれているか
 * @param {import("ts-morph").CallExpression} callExpr
 * @returns {boolean}
 */
function isCallHandledByPromise(callExpr) {
	let curr = callExpr.getParent();
	while (curr) {
		if (Node.isPropertyAccessExpression(curr) && curr.getName() === "catch") {
			if (curr.getParent() && Node.isCallExpression(curr.getParent())) {
				return true;
			}
		}
		if (Node.isCallExpression(curr)) {
			const expr = curr.getExpression();
			if (Node.isPropertyAccessExpression(expr) && expr.getName() === "then") {
				if (curr.getArguments().length > 1) {
					return true;
				}
			}
		}
		curr = curr.getParent();
	}
	return false;
}

/**
 * [チェック2用] 呼び出し元の関数自身も@throwsを持つ（エラー処理を委任している）か
 * 呼び出している関数が持つ全てのエラー型を網羅しているか確認する
 * @param {import("ts-morph").Node} node
 * @param {import("ts-morph").Node} throwingFunc
 * @returns {boolean}
 */
function isCallHandledByDelegation(node, throwingFunc) {
	const enclosingFunc = findDocumentableEnclosingFunction(node);
	if (!enclosingFunc) return false;

	const callerThrows = getThrowsTags(enclosingFunc).map((t) => t.getText().match(/\{([^}]*)\}/)?.[1]);
	const calleeThrows = getThrowsTags(throwingFunc).map((t) => t.getText().match(/\{([^}]*)\}/)?.[1]);

	return calleeThrows.every((type) => callerThrows.includes(type));
}

/**
 * [チェック1用] default exportなどの特定の文脈で@throwsがあれば許容
 * @param {import("ts-morph").Node} func
 * @param {string} filePath
 * @param {string[]} allowedDirs
 * @returns {boolean}
 */
function isAllowedThrowContext(func, filePath, allowedDirs) {
	if (!func) return false;

	const normalized = path.normalize(filePath);
	const isInAllowedDir = allowedDirs.some((dir) => normalized.includes(path.normalize(dir + path.sep)));

	if (!isInAllowedDir || !func.getSymbol) return false;

	let isDefaultExported = false;
	if (Node.isMethodDeclaration(func) || Node.isConstructorDeclaration(func)) {
		const parentClass = func.getParentIfKind(SyntaxKind.ClassDeclaration);
		if (parentClass) {
			isDefaultExported = parentClass.getSymbol() === parentClass.getSourceFile().getDefaultExportSymbol();
		}
	} else if (Node.isFunctionDeclaration(func) || Node.isFunctionExpression(func) || Node.isArrowFunction(func)) {
		isDefaultExported = func.getSourceFile().getDefaultExportSymbol() === func.getSymbol();
	}

	return isDefaultExported && hasThrowsJSDoc(func);
}

/**
 * 全ての関連する宣言から @throws タグを取得する
 */
function getThrowsTags(func) {
	if (!func) return [];

	let declarations = [func];
	if (Node.isMethodDeclaration(func) || Node.isFunctionDeclaration(func) || Node.isConstructorDeclaration(func)) {
		const symbol = func.getSymbol();
		if (symbol) {
			declarations = symbol.getDeclarations().filter((d) => Node.isMethodDeclaration(d) || Node.isFunctionDeclaration(d) || Node.isConstructorDeclaration(d));
		}
	}

	const tags = [];
	for (const decl of declarations) {
		let target = decl;
		if (Node.isArrowFunction(decl)) {
			const varDecl = decl.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
			if (varDecl) {
				const varStmt = varDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
				if (varStmt) target = varStmt;
			}
		}
		if (target.getJsDocs) {
			tags.push(...target.getJsDocs().flatMap((doc) => doc.getTags().filter((tag) => tag.getTagName() === "throws")));
		}
	}

	if (Node.isConstructorDeclaration(func)) {
		const parentClass = func.getParentIfKind(SyntaxKind.ClassDeclaration);
		if (parentClass && parentClass.getJsDocs) {
			tags.push(...parentClass.getJsDocs().flatMap((doc) => doc.getTags().filter((tag) => tag.getTagName() === "throws")));
		}
	}

	return tags;
}

/**
 * [チェック1, 2共通] JSDocに@throwsがあるか。コンストラクタの場合はクラス自身のJSDocも見る。
 * @param {import("ts-morph").Node & { getJsDocs?: any }} func
 * @returns {boolean}
 */
function hasThrowsJSDoc(func) {
	return getThrowsTags(func).length > 0;
}
