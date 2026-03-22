import path from "node:path";
import { Node, Project, SyntaxKind } from "ts-morph";

/**
 * @typedef {{
 * rootDir: string;
 * allowedDynamicDirs: string[];
 * }} AnalyzeConfig
 *
 * @typedef {{
 * file: string;
 * line: number;
 * message: string;
 * }} ThrowWarning
 */

export function analyzeThrows(config) {
	const result = [];
	const project = new Project({
		tsConfigFilePath: path.join(config.rootDir, "tsconfig.json"),
		skipAddingFilesFromTsConfig: false,
	});

	const sourceFiles = project.getSourceFiles().filter((sf) => !sf.getFilePath().includes("/test/"));

	// 1. プロジェクト内の全関数・メソッド定義と @throws タグを収集
	const allDefinedFunctions = [];
	for (const sourceFile of sourceFiles) {
		const funcs = [...sourceFile.getFunctions(), ...sourceFile.getClasses().flatMap((c) => [...c.getMethods(), ...c.getConstructors()])];

		for (const func of funcs) {
			const tags = getThrowsTags(func);
			if (tags.length > 0) {
				const parsedTags = parseThrowsTags(tags);
				allDefinedFunctions.push({ node: func, tags: parsedTags });

				// [チェック1] @throws の説明コメント必須チェック
				for (const tagInfo of parsedTags) {
					if (!tagInfo.description) {
						result.push({
							file: getRelPath(config.rootDir, sourceFile),
							line: tagInfo.line,
							message: `@throws {${tagInfo.type}} に説明がありません`,
						});
					}
				}
			}
		}
	}

	// 2. [チェック2] 明示的な throw 文のチェック
	for (const sourceFile of sourceFiles) {
		const throwStmts = sourceFile.getDescendantsOfKind(SyntaxKind.ThrowStatement);
		for (const throwStmt of throwStmts) {
			if (isThrowStatementHandled(throwStmt)) continue;
			const func = findDocumentableEnclosingFunction(throwStmt);
			if (isAllowedThrowContext(func, sourceFile.getFilePath(), config.allowedDynamicDirs)) continue;
			if (hasThrowsJSDoc(func)) continue;

			result.push({
				file: getRelPath(config.rootDir, sourceFile),
				line: throwStmt.getStartLineNumber(),
				message: "未補足のthrowです。@throwsを付与してください",
			});
		}
	}

	// 3. [チェック3] @throws を持つ関数の呼び出し元のチェック（伝播の強制）
	for (const { node: targetFunc, tags: targetTags } of allDefinedFunctions) {
		const nameNode = getFunctionNameNode(targetFunc);
		if (!nameNode) continue;

		const references = nameNode.findReferences();
		for (const ref of references) {
			for (const refEntry of ref.getReferences()) {
				const refNode = refEntry.getNode();
				const callExpr = getCallExpressionFromRef(refNode);
				if (!callExpr) continue;

				// ハンドリング（try-catch / .catch）されていればOK
				if (isCallHandledByTryCatch(callExpr) || isCallHandledByPromise(callExpr)) continue;

				const enclosingFunc = findDocumentableEnclosingFunction(callExpr);
				if (!enclosingFunc) continue;

				const callerTags = parseThrowsTags(getThrowsTags(enclosingFunc));

				// 呼び出し先の全ての @throws が呼び出し元にも定義されているか確認
				for (const targetTag of targetTags) {
					const isDelegated = callerTags.some((t) => t.type === targetTag.type);
					if (!isDelegated) {
						// 【修正箇所】型だけでなく、説明文(description)も含めて返却
						const errorDetail = targetTag.description ? `{${targetTag.type}} ${targetTag.description}` : `{${targetTag.type}}`;
						result.push({
							file: getRelPath(config.rootDir, refNode.getSourceFile()),
							line: refNode.getStartLineNumber(),
							message: `例外未処理: \`${errorDetail}\` を @throws に追加してください`,
						});
					}
				}
			}
		}
	}

	return result;
}

/**
 * JSDocタグから情報を抽出
 */
function parseSingleTag(tag) {
	const text = tag.getText();
	const typeMatch = text.match(/\{([^}]*)\}/);
	const type = typeMatch ? typeMatch[1] : "Error";

	// @throws と {Type} を除去して残りを説明とする
	const description = text
		.replace(/^\/\*\*|\*\/$/g, "") // ブロックコメントの囲みを除去
		.replace(/^\s*\*\s*/gm, "") // 行頭の * を除去
		.replace(/@throws\s*/, "")
		.replace(/\{[^}]*\}\s*/, "")
		.trim();

	return {
		type,
		description,
		line: tag.getStartLineNumber(),
	};
}

function parseThrowsTags(tags) {
	return tags.map(parseSingleTag);
}

/**
 * プロパティアクセス（Class.method）を考慮して CallExpression を取得
 */
function getCallExpressionFromRef(refNode) {
	let parent = refNode.getParent();
	while (parent && (Node.isPropertyAccessExpression(parent) || Node.isElementAccessExpression(parent))) {
		parent = parent.getParent();
	}
	return Node.isCallExpression(parent) ? parent : null;
}

function getRelPath(rootDir, sourceFile) {
	return path.relative(rootDir, sourceFile.getFilePath()) || sourceFile.getFilePath();
}

function getThrowsTags(func) {
	if (!func) return [];
	let target = func;

	// アロー関数の場合は変数宣言側からJSDocを取得
	if (Node.isArrowFunction(func) || Node.isFunctionExpression(func)) {
		const varDecl = func.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		const varStmt = varDecl?.getFirstAncestorByKind(SyntaxKind.VariableStatement);
		if (varStmt) target = varStmt;
	}

	if (!target.getJsDocs) return [];
	return target.getJsDocs().flatMap((doc) => doc.getTags().filter((t) => t.getTagName() === "throws"));
}

function hasThrowsJSDoc(func) {
	return getThrowsTags(func).length > 0;
}

function findDocumentableEnclosingFunction(node) {
	return node.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a) || isVariableArrowFunc(a));
}

function isVariableArrowFunc(node) {
	if (!Node.isArrowFunction(node) && !Node.isFunctionExpression(node)) return false;
	return !!node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
}

function getFunctionNameNode(func) {
	if (func.getNameNode?.()) return func.getNameNode();
	if (isVariableArrowFunc(func)) {
		return func.getFirstAncestorByKind(SyntaxKind.VariableDeclaration)?.getNameNode();
	}
	return null;
}

function isThrowStatementHandled(throwStmt) {
	return !!throwStmt.getFirstAncestorByKind(SyntaxKind.TryStatement);
}

function isCallHandledByTryCatch(node) {
	return !!node.getFirstAncestorByKind(SyntaxKind.TryStatement);
}

function isCallHandledByPromise(callExpr) {
	let curr = callExpr.getParent();
	while (curr) {
		if (Node.isPropertyAccessExpression(curr) && (curr.getName() === "catch" || curr.getName() === "then")) return true;
		if (Node.isTryStatement(curr)) return true;
		curr = curr.getParent();
	}
	return false;
}

function isAllowedThrowContext(func, filePath, allowedDirs) {
	if (!func) return false;
	const normalized = path.normalize(filePath);
	if (!allowedDirs.some((dir) => normalized.includes(path.normalize(dir + path.sep)))) return false;
	return hasThrowsJSDoc(func);
}
