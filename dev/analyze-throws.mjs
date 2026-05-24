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

	const sourceFiles = project.getSourceFiles().filter((sf) => !sf.getFilePath().includes("/node_modules/"));

	// 0. JSDoc フォーマット・存在チェック
	for (const sourceFile of sourceFiles) {
		const relPath = getRelPath(config.rootDir, sourceFile);

		// ドキュメント化可能な要素への JSDoc 強制
		sourceFile.getDescendants().forEach((node) => {
			if (isDocumentable(node)) {
				// export from は除く
				if (Node.isExportDeclaration(node)) return;

				// VariableDeclaration は親の VariableStatement でチェックするためスキップ
				if (Node.isVariableDeclaration(node)) return;

				// 名前がないもの、プライベートなものはスキップ（ただし明示的な private は除く）
				if (node.getName && !node.getName()) return;

				// 実装を持つ関数のオーバーロードがある場合は、実態には JSDoc 必須ではない
				if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
					if (node.getOverloads().length > 0 && node.getBody()) return;
				}

				const jsDocs = node.getJsDocs ? node.getJsDocs() : [];
				if (jsDocs.length === 0) {
					result.push({
						file: relPath,
						line: node.getStartLineNumber(),
						message: `${Node.isMethodDeclaration(node) || Node.isPropertyDeclaration(node) ? "クラスメンバ" : "Exportされている要素"}にはJSDocが必須です`,
					});
				}
			}
		});

		const jsDocs = sourceFile.getDescendantsOfKind(SyntaxKind.JSDoc);
		for (const jsDoc of jsDocs) {
			const text = jsDoc.getText();
			const startLine = jsDoc.getStartLineNumber();
			const parent = jsDoc.getParent();

			const lines = text.split(/\r?\n/);
			const isSingleLine = lines.length === 1;

			// アスタリスクの位置が揃っているか検証
			// インデント（タブまたはスペース）を取得
			const fullText = sourceFile.getFullText();
			const start = jsDoc.getStart();
			const lineStart = fullText.lastIndexOf("\n", start) + 1;
			const indent = fullText.substring(lineStart, start);

			for (let i = 1; i < lines.length; i++) {
				const line = lines[i];

				// 0文字の空行チェック
				if (line.length === 0) {
					result.push({
						file: relPath,
						line: startLine + i,
						message: "JSDoc内に0文字の空行が含まれています。' *' を含めてください",
					});
				}

				if (i === lines.length - 1) {
					// 最終行 ( */ )
					if (line.trim() === "*/") {
						if (!line.startsWith(indent + " */")) {
							result.push({
								file: relPath,
								line: startLine + i,
								message: "JSDocの終了タグの位置が揃っていません",
							});
						}
					}
				} else {
					// ' *' (スペース1つ + *) で始まっているか
					const expectedPrefix = indent + " *";
					if (!line.startsWith(expectedPrefix) || (line.length > expectedPrefix.length && line[expectedPrefix.length] !== " " && line[expectedPrefix.length] !== "\n" && line[expectedPrefix.length] !== "\r")) {
						// 例外: ' *' だけの行は許容
						if (line.trim() !== "*") {
							result.push({
								file: relPath,
								line: startLine + i,
								message: "JSDocのアスタリスクの位置が揃っていません。行頭は ' *' (半角スペース1つ + アスタリスク) で開始してください",
							});
						}
					}

					// 余計なスペースや二重アスタリスクのチェック
					if (line.startsWith(indent + "  *")) {
						result.push({
							file: relPath,
							line: startLine + i,
							message: "JSDocのアスタリスクの前に余計なスペースがあります",
						});
					}
					if (line.startsWith(indent + " **")) {
						result.push({
							file: relPath,
							line: startLine + i,
							message: "JSDocの行頭に二重のアスタリスクがあります",
						});
					}
				}
			}

			// 関数・メソッドの JSDoc は必ず複数行
			const isFunctionLike = Node.isFunctionLikeDeclaration(parent) || Node.isMethodDeclaration(parent) || Node.isConstructorDeclaration(parent);
			if (isFunctionLike && isSingleLine) {
				result.push({
					file: relPath,
					line: startLine,
					message: "関数・メソッドのJSDocは必ず複数行形式にしてください",
				});
			}

			// 変数・フィールドの JSDoc
			const isVariableLike = Node.isVariableStatement(parent) || Node.isPropertyDeclaration(parent) || Node.isPropertySignature(parent) || Node.isEnumMember(parent) || Node.isVariableDeclaration(parent);
			if (isVariableLike) {
				const commentContent = jsDoc.getComment()?.trim() || "";
				const hasTags = jsDoc.getTags().length > 0;
				const isContentMultiLine = commentContent.includes("\n");

				if (!isContentMultiLine && !hasTags) {
					if (!isSingleLine) {
						result.push({
							file: relPath,
							line: startLine,
							message: "内容が1行しかない変数のJSDocは必ず1行形式 `/** content */` にしてください",
						});
					}
				}
			}

			// JSDoc タイトルと名称の一致チェック
			const nameNode = getFunctionNameNode(parent) || (parent.getNameNode ? parent.getNameNode() : null);
			if (nameNode) {
				const name = nameNode.getText();
				const fullComment = jsDoc.getComment()?.trim() || "";
				const firstLineComment = fullComment.split("\n")[0].trim();
				if (firstLineComment === name) {
					result.push({
						file: relPath,
						line: startLine,
						message: `JSDocタイトルが名称 \`${name}\` と完全一致しています`,
					});
				}
			}

			// タグの個別チェック
			const tags = jsDoc.getTags();
			for (const tag of tags) {
				const tagName = tag.getTagName();
				const tagLine = tag.getStartLineNumber();

				if (tagName === "return") {
					result.push({
						file: relPath,
						line: tagLine,
						message: "@return ではなく @returns を使用してください",
					});
				}

				if (tagName === "overload") {
					if (!hasOverloads(parent)) {
						result.push({
							file: relPath,
							line: tagLine,
							message: "冗長な @overload タグです。オーバーロードが存在しません",
						});
					}
				}

				if (["param", "returns", "throws"].includes(tagName)) {
					const comment = tag.getComment()?.trim() || "";
					if (!comment) {
						result.push({
							file: relPath,
							line: tagLine,
							message: `@${tagName} に説明がありません`,
						});
					}

					if (tagName === "param") {
						const tagText = tag.getText();
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

			// returns 強制チェック (void, Promise<void>, never 以外)
			if (isFunctionLike) {
				const hasOverloads = parent.getOverloads?.().length > 0;
				const isImplementation = parent.getBody && parent.getBody();

				if (!(hasOverloads && isImplementation)) {
					const returnType = parent.getReturnType().getText();
					const skipReturns = returnType === "void" || returnType === "Promise<void>" || returnType === "never" || returnType === "void | Promise<void>";

					const hasReturnsTag = tags.some((t) => t.getTagName() === "returns" || t.getTagName() === "return");
					if (!skipReturns && !hasReturnsTag) {
						if (isDocumentable(parent)) {
							result.push({
								file: relPath,
								line: startLine,
								message: `@returns が不足しています (戻り値の型: ${returnType})`,
							});
						}
					}
				}
			}
		}
	}

	// 1. プロジェクト内の全関数・メソッド定義を収集
	const allFuncsInProject = [];
	for (const sourceFile of sourceFiles) {
		const funcs = sourceFile.getDescendants().filter((n) => Node.isFunctionDeclaration(n) || Node.isMethodDeclaration(n) || Node.isConstructorDeclaration(n) || Node.isArrowFunction(n) || Node.isFunctionExpression(n));
		allFuncsInProject.push(...funcs);
	}

	const funcToTags = new Map();
	for (const func of allFuncsInProject) {
		const tags = getThrowsTags(func);
		funcToTags.set(func, parseThrowsTags(tags));
	}

	// [新チェック] オーバーロードと冗長な @throws のチェック
	const groupedDecls = new Map();
	for (const func of allFuncsInProject) {
		if (!isDocumentable(func)) continue;
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
		const hasOverloads = group.length > 1;
		const implementation = group.find((d) => (d.getBody && d.getBody()) || (Node.isArrowFunction(d) && d.getExpressionBody()));

		for (const decl of group) {
			const jsDocs = decl.getJsDocs();
			const relPath = getRelPath(config.rootDir, decl.getSourceFile());

			if (decl === implementation && hasOverloads) {
				// 実態かつオーバーロードがある場合: @throws のみ許可
				for (const jsDoc of jsDocs) {
					const tags = jsDoc.getTags();
					const comment = jsDoc.getComment()?.trim();
					const nonThrowsTags = tags.filter((t) => t.getTagName() !== "throws");

					if (comment || nonThrowsTags.length > 0) {
						result.push({
							file: relPath,
							line: jsDoc.getStartLineNumber(),
							message: "オーバーロードを持つ関数の実態には @throws のみを許可し、タイトルや他のタグは許可されません",
						});
					}
				}
			} else if (hasOverloads && decl !== implementation) {
				// オーバーロード定義
				if (jsDocs.length > 0) {
					const hasOverloadTag = jsDocs.some((doc) => doc.getTags().some((tag) => tag.getTagName() === "overload"));

					// オーバーロードに @throws があるかチェック
					for (const jsDoc of jsDocs) {
						if (jsDoc.getTags().some((t) => t.getTagName() === "throws")) {
							result.push({
								file: relPath,
								line: jsDoc.getStartLineNumber(),
								message: "オーバーロードには @throws を記述できません。実態(実装)側に集約してください",
							});
						}
					}

					if (!hasOverloadTag) {
						const currentParams = decl.getParameters().map((p) => p.getType().getText());
						const sameSignatureDecls = group.filter((d) => d !== decl && d !== implementation && d.getParameters().length === decl.getParameters().length && d.getParameters().every((p, i) => p.getType().getText() === currentParams[i]));

						if (sameSignatureDecls.length > 0) {
							const myIndex = group.indexOf(decl);
							const earlierSame = sameSignatureDecls.some((d) => group.indexOf(d) < myIndex);
							if (earlierSame) {
								result.push({
									file: relPath,
									line: decl.getStartLineNumber(),
									message: "引数が同一のオーバーロードにはJSDocを許可しません (@overloadを付与する場合を除く)",
								});
							}
						}
					}
				}
			}
		}

		if (implementation) {
			const actualThrows = collectActualThrowsRecursive(implementation, funcToTags, project);
			for (const decl of group) {
				const tags = funcToTags.get(decl);
				if (tags) {
					for (const tag of tags) {
						if (!actualThrows.has(tag.type)) {
							result.push({
								file: getRelPath(config.rootDir, decl.getSourceFile()),
								line: tag.line,
								message: `余剰な @throws {${tag.type}} があります (この例外は発生しません)`,
							});
						}
					}
				}
			}
		}
	}

	// 2. 明示的な throw 文のチェック と 3. 伝播のチェック
	for (const sourceFile of sourceFiles) {
		const relPath = getRelPath(config.rootDir, sourceFile);

		// 明示的な throw
		const throwStmts = sourceFile.getDescendantsOfKind(SyntaxKind.ThrowStatement);
		for (const throwStmt of throwStmts) {
			if (isThrowStatementHandled(throwStmt)) continue;
			const func = findDocumentableEnclosingFunction(throwStmt);
			if (!func) continue;

			const throwType = getThrowType(throwStmt);
			const tags = funcToTags.get(func) || [];
			if (tags.some((t) => t.type === throwType)) continue;

			result.push({
				file: relPath,
				line: throwStmt.getStartLineNumber(),
				message: `未補足のthrowです。@throws {${throwType}} を付与してください`,
			});
		}

		// 関数呼び出し
		const callNodes = [...sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression), ...sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression)];
		for (const callExpr of callNodes) {
			if (isCallHandledByTryCatch(callExpr) || isCallHandledByPromise(callExpr)) continue;

			const enclosingFunc = findDocumentableEnclosingFunction(callExpr);
			if (!enclosingFunc) continue;

			const calledDecls = getCalledDeclarations(callExpr, project);
			for (const decl of calledDecls) {
				const targetTags = funcToTags.get(decl) || [];
				const callerTags = funcToTags.get(enclosingFunc) || [];

				for (const targetTag of targetTags) {
					if (!callerTags.some((t) => t.type === targetTag.type)) {
						const errorDetail = targetTag.description ? `{${targetTag.type}} ${targetTag.description}` : `{${targetTag.type}}`;
						result.push({
							file: relPath,
							line: callExpr.getStartLineNumber(),
							message: `例外未処理: \`${errorDetail}\` を @throws に追加してください`,
						});
					}
				}
			}
		}
	}

	return result;
}

function isExported(node) {
	if (Node.isExportable(node) && node.isExported()) return true;
	if (Node.isVariableDeclaration(node)) {
		const stmt = node.getFirstAncestorByKind(SyntaxKind.VariableStatement);
		return stmt && stmt.isExported();
	}
	if (Node.isTypeAliasDeclaration(node) || Node.isInterfaceDeclaration(node) || Node.isEnumDeclaration(node)) {
		return node.isExported();
	}
	return false;
}

function isDocumentable(node) {
	if (!node) return false;

	// クラス、インターフェース、列挙型、関数、変数、型エイリアスなどが対象
	const isBasicDocumentable = Node.isClassDeclaration(node) || Node.isInterfaceDeclaration(node) || Node.isEnumDeclaration(node) || Node.isFunctionDeclaration(node) || Node.isVariableStatement(node) || Node.isTypeAliasDeclaration(node) || Node.isMethodDeclaration(node) || Node.isPropertyDeclaration(node) || Node.isPropertySignature(node) || Node.isEnumMember(node) || Node.isConstructorDeclaration(node);

	if (!isBasicDocumentable) return false;

	// Export されているものは必須
	if (isExported(node)) return true;

	// クラスメンバやインターフェースメンバなどのチェック
	const parent = node.getParent();
	if (Node.isClassDeclaration(parent) || Node.isInterfaceDeclaration(parent) || Node.isEnumDeclaration(parent)) {
		// 親がドキュメント化対象（Exportされているなど）であれば、そのメンバも対象
		if (isDocumentable(parent)) {
			return true;
		}
	}

	if (Node.isFunctionLikeDeclaration(node) || Node.isMethodDeclaration(node) || Node.isConstructorDeclaration(node)) {
		if (isVariableArrowFunc(node)) {
			const varDecl = node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
			const varStmt = varDecl?.getFirstAncestorByKind(SyntaxKind.VariableStatement);
			if (varStmt && isExported(varStmt)) return true;
		}
	}

	return false;
}

function hasOverloads(node) {
	if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node) || Node.isConstructorDeclaration(node)) {
		const nameNode = getFunctionNameNode(node);
		const name = nameNode ? nameNode.getText() : Node.isConstructorDeclaration(node) ? "constructor" : null;
		if (!name) return false;
		const parent = node.getParent();
		const all = parent.getDescendants().filter((n) => (Node.isFunctionDeclaration(n) || Node.isMethodDeclaration(n) || Node.isConstructorDeclaration(n)) && (getFunctionNameNode(n)?.getText() === name || (Node.isConstructorDeclaration(n) && name === "constructor")));
		return all.length > 1;
	}
	return false;
}

function isVariableArrowFunc(node) {
	if (!Node.isArrowFunction(node) && !Node.isFunctionExpression(node)) return false;
	return !!node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
}

function getFunctionNameNode(func) {
	if (!func) return null;
	if (func.getNameNode?.()) return func.getNameNode();
	if (isVariableArrowFunc(func)) {
		return func.getFirstAncestorByKind(SyntaxKind.VariableDeclaration)?.getNameNode();
	}
	return null;
}

function findDocumentableEnclosingFunction(node) {
	let curr = node.getParent();
	while (curr) {
		if (Node.isFunctionDeclaration(curr) || Node.isMethodDeclaration(curr) || Node.isConstructorDeclaration(curr) || Node.isArrowFunction(curr) || Node.isFunctionExpression(curr)) {
			if (isDocumentable(curr)) return curr;
		}
		curr = curr.getParent();
	}
	return null;
}

function getThrowsTags(func) {
	if (!func) return [];
	let target = func;
	if (isVariableArrowFunc(func)) {
		const varDecl = func.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		const varStmt = varDecl?.getFirstAncestorByKind(SyntaxKind.VariableStatement);
		if (varStmt) target = varStmt;
	}
	if (!target.getJsDocs) return [];
	return target.getJsDocs().flatMap((doc) => doc.getTags().filter((t) => t.getTagName() === "throws"));
}

function parseThrowsTags(tags) {
	return tags.map((tag) => {
		const text = tag.getText();
		const typeMatch = text.match(/\{([^}]*)\}/);
		const type = typeMatch ? typeMatch[1] : "Error";
		let description = text
			.replace(/^\/\*\*|\*\/$/g, "")
			.replace(/^\s*\*\s*/gm, "")
			.replace(/@throws\s*/, "")
			.replace(/\{[^}]*\}\s*/, "");
		description = description.replace(/^\s*-\s+/, "").trim();
		return { type, description, line: tag.getStartLineNumber() };
	});
}

function getRelPath(rootDir, sourceFile) {
	return path.relative(rootDir, sourceFile.getFilePath()) || sourceFile.getFilePath();
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

function getThrowType(throwStmt) {
	const expr = throwStmt.getExpression();
	if (Node.isNewExpression(expr) || Node.isCallExpression(expr)) {
		const callExpr = expr.getExpression();
		return callExpr.getText();
	}
	return "Error";
}

function getCalledDeclarations(callExpr, project) {
	const accessExpr = callExpr.getExpression();
	const typeChecker = project.getTypeChecker();
	let symbol = typeChecker.getSymbolAtLocation(accessExpr);
	if (!symbol && (Node.isPropertyAccessExpression(accessExpr) || Node.isElementAccessExpression(accessExpr))) {
		symbol = accessExpr.getSymbol();
	}
	if (!symbol) return [];
	const declarations = symbol.getDeclarations() || [];
	return declarations.filter((d) => !d.getSourceFile().getFilePath().includes("/node_modules/"));
}

function collectActualThrowsRecursive(func, funcToTags, project, visited = new Set()) {
	if (visited.has(func)) return new Set();
	visited.add(func);

	const types = new Set();
	const body = (func.getBody && func.getBody()) || (Node.isArrowFunction(func) && func.getExpressionBody());
	if (!body) return types;

	// 明示的な throw
	body.getDescendantsOfKind(SyntaxKind.ThrowStatement).forEach((throwStmt) => {
		if (isThrowStatementHandled(throwStmt)) return;

		let temp = throwStmt.getParent();
		let belongsToFunc = false;
		while (temp && temp !== func) {
			if (Node.isFunctionLikeDeclaration(temp) || Node.isMethodDeclaration(temp)) {
				if (isDocumentable(temp)) {
					belongsToFunc = false;
					break;
				}
			}
			temp = temp.getParent();
		}
		if (temp === func) belongsToFunc = true;

		if (belongsToFunc) types.add(getThrowType(throwStmt));
	});

	// 関数呼び出し
	const callNodes = [...body.getDescendantsOfKind(SyntaxKind.CallExpression), ...body.getDescendantsOfKind(SyntaxKind.NewExpression)];
	callNodes.forEach((callExpr) => {
		if (isCallHandledByTryCatch(callExpr) || isCallHandledByPromise(callExpr)) return;

		let temp = callExpr.getParent();
		let belongsToFunc = false;
		while (temp && temp !== func) {
			if (Node.isFunctionLikeDeclaration(temp) || Node.isMethodDeclaration(temp)) {
				if (isDocumentable(temp)) {
					belongsToFunc = false;
					break;
				}
			}
			temp = temp.getParent();
		}
		if (temp === func) belongsToFunc = true;
		if (!belongsToFunc) return;

		const calledDecls = getCalledDeclarations(callExpr, project);
		for (const decl of calledDecls) {
			if (Node.isClassDeclaration(decl)) {
				decl.getConstructors().forEach((ctor) => {
					const tags = funcToTags.get(ctor) || [];
					tags.forEach((t) => types.add(t.type));
					if (!isDocumentable(ctor)) {
						collectActualThrowsRecursive(ctor, funcToTags, project, visited).forEach((t) => types.add(t));
					}
				});
			} else {
				const tags = funcToTags.get(decl) || [];
				tags.forEach((t) => types.add(t.type));
				if (!isDocumentable(decl) && (Node.isFunctionLikeDeclaration(decl) || Node.isMethodDeclaration(decl))) {
					collectActualThrowsRecursive(decl, funcToTags, project, visited).forEach((t) => types.add(t));
				}
			}
		}
	});

	return types;
}
