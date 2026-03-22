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

	const sourceFiles = project.getSourceFiles();

	// [チェック1] 未補足の `throw` 文を検出
	for (const sourceFile of sourceFiles) {
		const throwStmts = sourceFile.getDescendantsOfKind(SyntaxKind.ThrowStatement);

		for (const throwStmt of throwStmts) {
			if (isThrowStatementHandled(throwStmt)) continue;

			const func = findEnclosingFunction(throwStmt);

			// default export + allowedDir + @throws があれば許容
			if (isAllowedThrowContext(func, sourceFile.getFilePath(), config.allowedDynamicDirs)) continue;

			// その他：@throwsがあれば許容、それ以外は警告
			if (hasThrowsJSDoc(func)) continue;

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

				const handled = isCallHandledByTryCatch(callExpr) || isCallHandledByPromise(callExpr) || isCallHandledByDelegation(callExpr);

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
 * @param {import("ts-morph").Node} node
 * @returns {boolean}
 */
function isCallHandledByDelegation(node) {
	const enclosingFunc = findEnclosingFunction(node);
	if (!enclosingFunc) return false;
	return hasThrowsJSDoc(enclosingFunc);
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
 * [チェック1, 2共通] JSDocに@throwsがあるか。コンストラクタの場合はクラス自身のJSDocも見る。
 * @param {import("ts-morph").Node & { getJsDocs?: any }} func
 * @returns {boolean}
 */
function hasThrowsJSDoc(func) {
	if (!func || !func.getJsDocs) return false;

	const hasOwnThrows = func.getJsDocs().some((doc) => doc.getTags().some((tag) => tag.getTagName() === "throws"));
	if (hasOwnThrows) return true;

	if (Node.isConstructorDeclaration(func)) {
		const parentClass = func.getParentIfKind(SyntaxKind.ClassDeclaration);
		if (parentClass && parentClass.getJsDocs) {
			return parentClass.getJsDocs().some((doc) => doc.getTags().some((tag) => tag.getTagName() === "throws"));
		}
	}

	return false;
}
