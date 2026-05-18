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

	// 0. JSDoc フォーマットチェック
	for (const sourceFile of sourceFiles) {
		const jsDocs = sourceFile.getDescendantsOfKind(SyntaxKind.JSDoc);
		for (const jsDoc of jsDocs) {
			const text = jsDoc.getText();
			const startLine = jsDoc.getStartLineNumber();
			const relPath = getRelPath(config.rootDir, sourceFile);

			const lines = text.split(/\r?\n/);
			// 複数行形式のチェック
			if (lines.length < 3) {
				result.push({
					file: relPath,
					line: startLine,
					message: "JSDocは複数行形式で記述してください",
				});
			} else {
				if (lines[0].trim() !== "/**") {
					result.push({
						file: relPath,
						line: startLine,
						message: "JSDocの開始タグは独立した行にする必要があります",
					});
				}
				if (lines[lines.length - 1].trim() !== "*/") {
					result.push({
						file: relPath,
						line: startLine + lines.length - 1,
						message: "JSDocの終了タグは独立した行にする必要があります",
					});
				}
			}

			// 二重アスタリスクのチェック
			for (let i = 0; i < lines.length; i++) {
				if (/^\s*\*\s+\*/.test(lines[i])) {
					result.push({
						file: relPath,
						line: startLine + i,
						message: "JSDocの行頭に二重のアスタリスクがあります",
					});
				}
			}

			// タグの個別チェック
			const tags = jsDoc.getTags();
			for (const tag of tags) {
				const tagName = tag.getTagName();
				const tagLine = tag.getStartLineNumber();

				// @return -> @returns 強制
				if (tagName === "return") {
					result.push({
						file: relPath,
						line: tagLine,
						message: "@return ではなく @returns を使用してください",
					});
				}

				// 説明の必須チェック (param, returns, throws)
				if (["param", "returns", "throws"].includes(tagName)) {
					const comment = tag.getComment()?.trim() || "";
					if (!comment) {
						result.push({
							file: relPath,
							line: tagLine,
							message: `@${tagName} に説明がありません`,
						});
					}

					// @param のフォーマットチェック: "* @param name - description"
					if (tagName === "param") {
						const tagText = tag.getText();
						// ts-morph の tag.getText() は "@param name - description" のような形式
						// 期待値: @param <name> - <description>
						// ハイフンの前後に少なくとも1つの空白が必要
						if (!/@param\s+\S+\s+-\s+/.test(tagText)) {
							result.push({
								file: relPath,
								line: tagLine,
								message: "@param のフォーマットが不正です。`@param 変数名 - 説明` の形式(ハイフンとその前後の空白)で記述してください",
							});
						}
					}
				}
			}
		}
	}

	// 1. プロジェクト内の全関数・メソッド定義と @throws タグを収集
	const allDefinedFunctions = [];
	const funcToTags = new Map();
	for (const sourceFile of sourceFiles) {
		const funcs = [...sourceFile.getFunctions(), ...sourceFile.getClasses().flatMap((c) => [...c.getMethods(), ...c.getConstructors()]), ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration), ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration)];
		const uniqueFuncs = Array.from(new Set(funcs));

		for (const func of uniqueFuncs) {
			const tags = getThrowsTags(func);
			const parsedTags = parseThrowsTags(tags);
			funcToTags.set(func, parsedTags);

			if (parsedTags.length > 0) {
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

	// [新チェック] オーバーロードと冗長な @throws のチェック
	const groupedDecls = new Map();
	for (const [func, tags] of funcToTags.entries()) {
		const nameNode = getFunctionNameNode(func);
		const name = nameNode ? nameNode.getText() : Node.isConstructorDeclaration(func) ? "constructor" : null;
		if (!name) continue;
		const parent = func.getParent();
		const scopeId = func.getSourceFile().getFilePath() + "@" + parent.getStart();
		const key = `${scopeId}:${name}:${(Node.isMethodDeclaration(func) || Node.isPropertyDeclaration(func)) && typeof func.isStatic === "function" && func.isStatic() ? "static" : "instance"}`;
		if (!groupedDecls.has(key)) groupedDecls.set(key, []);
		groupedDecls.get(key).push(func);
	}

	for (const [key, group] of groupedDecls) {
		// a. オーバーロードの JSDoc チェック
		if (group.length > 1) {
			let firstWithJsDoc = null;
			for (const decl of group) {
				const hasJsDoc = decl.getJsDocs().length > 0;
				if (hasJsDoc) {
					if (firstWithJsDoc === null) {
						firstWithJsDoc = decl;
					} else {
						const jsDocs = decl.getJsDocs();
						const hasOverloadTag = jsDocs.some((doc) => doc.getTags().some((tag) => tag.getTagName() === "overload"));
						if (!hasOverloadTag) {
							const currentParamCount = decl.getParameters().length;
							const firstParamCount = firstWithJsDoc.getParameters().length;
							if (currentParamCount === firstParamCount) {
								result.push({
									file: getRelPath(config.rootDir, decl.getSourceFile()),
									line: decl.getStartLineNumber(),
									message: "不必要なJSDocです。最初のオーバーロード宣言にのみ記述するか、@overloadを付与してください",
								});
							}
						}
					}
				}
			}
		}

		// b. 冗長な @throws のチェック
		const implementation = group.find((d) => (d.getBody && d.getBody()) || (Node.isArrowFunction(d) && d.getExpressionBody()));
		if (implementation) {
			const actualThrows = collectActualThrows(implementation, funcToTags, project);
			for (const decl of group) {
				const tags = funcToTags.get(decl);
				if (tags) {
					for (const tag of tags) {
						if (!actualThrows.has(tag.type)) {
							result.push({
								file: getRelPath(config.rootDir, decl.getSourceFile()),
								line: tag.line,
								message: `余剰な @throws {${tag.type}} があります`,
							});
						}
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
			if (!func) continue;
			if (isAllowedThrowContext(func, sourceFile.getFilePath(), config.allowedDynamicDirs)) continue;

			const throwType = getThrowType(throwStmt);
			const tags = funcToTags.get(func) || [];
			if (tags.some((t) => t.type === throwType)) continue;

			result.push({
				file: getRelPath(config.rootDir, sourceFile),
				line: throwStmt.getStartLineNumber(),
				message: `未補足のthrowです。@throws {${throwType}} を付与してください`,
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
	let description = text
		.replace(/^\/\*\*|\*\/$/g, "") // ブロックコメントの囲みを除去
		.replace(/^\s*\*\s*/gm, "") // 行頭の * を除去
		.replace(/@throws\s*/, "")
		.replace(/\{[^}]*\}\s*/, "");

	// ハイフンから始まる場合はハイフンを除去 (フォーマット統一のため)
	description = description.replace(/^\s*-\s+/, "").trim();

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
 * プロパティアクセス（Class.method）を考慮して CallExpression / NewExpression を取得
 */
function getCallExpressionFromRef(refNode) {
	let parent = refNode.getParent();
	while (parent && (Node.isPropertyAccessExpression(parent) || Node.isElementAccessExpression(parent))) {
		parent = parent.getParent();
	}
	return Node.isCallExpression(parent) || Node.isNewExpression(parent) ? parent : null;
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
	let curr = node.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a) || Node.isArrowFunction(a) || Node.isFunctionExpression(a));
	while (curr) {
		if (isDocumentable(curr)) return curr;
		curr = curr.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a) || Node.isArrowFunction(a) || Node.isFunctionExpression(a));
	}
	return null;
}

function isDocumentable(func) {
	const parent = func.getParent();
	if (Node.isSourceFile(parent)) return true;
	if (Node.isClassDeclaration(parent)) {
		return Node.isMethodDeclaration(func) || Node.isConstructorDeclaration(func);
	}
	if (isVariableArrowFunc(func)) {
		const varDecl = func.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		const varStmt = varDecl?.getFirstAncestorByKind(SyntaxKind.VariableStatement);
		if (varStmt && Node.isSourceFile(varStmt.getParent())) return true;
	}
	return false;
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

function collectActualThrows(func, funcToTags, project) {
	const types = new Set();
	const body = (func.getBody && func.getBody()) || (Node.isArrowFunction(func) && func.getExpressionBody());
	if (!body) return types;

	// 明示的な throw
	body.getDescendantsOfKind(SyntaxKind.ThrowStatement).forEach((throwStmt) => {
		if (isThrowStatementHandled(throwStmt)) return;
		// その関数（またはその内部関数）からの throw であることを確認
		let enclosing = throwStmt.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a) || Node.isArrowFunction(a) || Node.isFunctionExpression(a));
		while (enclosing && !isDocumentable(enclosing)) {
			enclosing = enclosing.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a) || Node.isArrowFunction(a) || Node.isFunctionExpression(a));
		}
		if (enclosing !== func) return;
		types.add(getThrowType(throwStmt));
	});

	// 関数呼び出し / インスタンス化
	const callNodes = [...body.getDescendantsOfKind(SyntaxKind.CallExpression), ...body.getDescendantsOfKind(SyntaxKind.NewExpression)];
	callNodes.forEach((callExpr) => {
		if (isCallHandledByTryCatch(callExpr) || isCallHandledByPromise(callExpr)) return;
		let enclosing = callExpr.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a) || Node.isArrowFunction(a) || Node.isFunctionExpression(a));
		while (enclosing && !isDocumentable(enclosing)) {
			enclosing = enclosing.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a) || Node.isArrowFunction(a) || Node.isFunctionExpression(a));
		}
		if (enclosing !== func) return;

		const accessExpr = callExpr.getExpression();
		// node_modules 内のものはスキップ
		const typeChecker = project.getTypeChecker();
		let symbol = typeChecker.getSymbolAtLocation(accessExpr);

		if (!symbol && (Node.isPropertyAccessExpression(accessExpr) || Node.isElementAccessExpression(accessExpr))) {
			symbol = accessExpr.getSymbol();
		}

		if (symbol) {
			const declarations = symbol.getDeclarations();
			if (!declarations || declarations.some((d) => d.getSourceFile().getFilePath().includes("/node_modules/"))) return;
			for (const decl of declarations) {
				if (Node.isClassDeclaration(decl)) {
					const constructors = decl.getConstructors();
					for (const ctor of constructors) {
						const tags = funcToTags.get(ctor);
						if (tags) {
							for (const t of tags) {
								types.add(t.type);
							}
						}
					}
					continue;
				}
				const tags = funcToTags.get(decl);
				if (tags) {
					for (const t of tags) {
						types.add(t.type);
					}
				}
			}
		}
	});

	return types;
}

function getThrowType(throwStmt) {
	const expr = throwStmt.getExpression();
	if (Node.isNewExpression(expr) || Node.isCallExpression(expr)) {
		const callExpr = expr.getExpression();
		return callExpr.getText();
	}
	return "Error";
}
