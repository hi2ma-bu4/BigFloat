import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import ts from "typescript";

const ROOT_DIR = process.cwd();
const INDEX_FILE = path.resolve(ROOT_DIR, "src", "index.ts");
const OUTPUT_FILE = path.resolve(ROOT_DIR, "API.md");
const SOURCE_ROOT = path.resolve(ROOT_DIR, "src");

function normalizePath(filePath) {
	return filePath.replace(/\\/g, "/").toLowerCase();
}

function loadCompilerOptions() {
	const configPath = ts.findConfigFile(ROOT_DIR, ts.sys.fileExists, "tsconfig.json");
	if (!configPath) {
		throw new Error("tsconfig.json が見つかりません");
	}

	const readResult = ts.readConfigFile(configPath, ts.sys.readFile);
	if (readResult.error) {
		throw new Error(ts.flattenDiagnosticMessageText(readResult.error.messageText, "\n"));
	}

	const parsed = ts.parseJsonConfigFileContent(readResult.config, ts.sys, path.dirname(configPath));
	return parsed.options;
}

const compilerOptions = loadCompilerOptions();
const program = ts.createProgram({
	rootNames: [INDEX_FILE],
	options: {
		...compilerOptions,
		noEmit: true,
	},
});
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile(INDEX_FILE);

if (!sourceFile) {
	throw new Error("src/index.ts を読み込めませんでした");
}

const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
if (!moduleSymbol) {
	throw new Error("src/index.ts のモジュールシンボルを取得できませんでした");
}

const moduleExports = checker.getExportsOfModule(moduleSymbol);
const resolvedExports = moduleExports.map((symbol) => {
	const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
	return { exportSymbol: symbol, targetSymbol: target };
});

const exportedClassNames = new Set(
	resolvedExports
		.map(({ targetSymbol }) => {
			const declaration = targetSymbol.getDeclarations()?.[0];
			return declaration && ts.isClassDeclaration(declaration) ? targetSymbol.getName() : null;
		})
		.filter(Boolean),
);

const exportedEnumNames = new Set(
	resolvedExports
		.map(({ targetSymbol }) => {
			const declaration = targetSymbol.getDeclarations()?.[0];
			return declaration && ts.isEnumDeclaration(declaration) ? targetSymbol.getName() : null;
		})
		.filter(Boolean),
);

function getDeclarationComment(node) {
	const blocks = ts.getJSDocCommentsAndTags(node).filter((entry) => ts.isJSDoc(entry));
	const texts = blocks
		.map((block) => block.comment)
		.filter(Boolean)
		.map((comment) => (typeof comment === "string" ? comment : comment.map((part) => part.text).join("")));
	return texts.join("\n").trim();
}

function getTagText(tag) {
	if (!("comment" in tag) || !tag.comment) return "";
	const text = typeof tag.comment === "string" ? tag.comment : tag.comment.map((part) => part.text).join("");
	return text.replace(/^\s*-\s*/, "").trim();
}

function getJsDocInfo(node, symbol) {
	const description =
		(symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)) : "") ||
		getDeclarationComment(node);
	const tags = { params: [], returns: "", throws: [], examples: [], others: [] };

	for (const tag of ts.getJSDocTags(node)) {
		const tagName = tag.tagName.getText();
		if (ts.isJSDocParameterTag(tag)) {
			tags.params.push({
				name: tag.name.getText(),
				text: getTagText(tag),
			});
			continue;
		}
		if (tagName === "returns" || tagName === "return") {
			tags.returns = getTagText(tag);
			continue;
		}
		if (tagName === "throws" || tagName === "throw") {
			tags.throws.push(getTagText(tag));
			continue;
		}
		if (tagName === "example") {
			tags.examples.push(getTagText(tag));
			continue;
		}
		tags.others.push({ name: tagName, text: getTagText(tag) });
	}

	return {
		description: description.trim(),
		tags,
	};
}

function isSourceDeclaration(node) {
	const fileName = normalizePath(node.getSourceFile().fileName);
	const sourceRoot = normalizePath(SOURCE_ROOT);
	return fileName === sourceRoot || fileName.startsWith(`${sourceRoot}/`);
}

function isPublicMember(node) {
	if (ts.canHaveModifiers(node)) {
		const modifiers = ts.getModifiers(node) ?? [];
		if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword)) {
			return false;
		}
	}
	return true;
}

function shouldDocumentMemberName(name) {
	return !name.startsWith("_");
}

function getMemberName(node) {
	if (!node.name) return "";
	if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) {
		return node.name.text;
	}
	return node.name.getText();
}

function serializeType(type, depth = 0, seen = new Set()) {
	if (!type) return "unknown";
	if ((type.flags & ts.TypeFlags.BooleanLike) !== 0) return "boolean";
	if (exportedClassNames.has(type.symbol?.getName?.())) return type.symbol.getName();
	if (exportedEnumNames.has(type.symbol?.getName?.())) return type.symbol.getName();

	const typeString = checker.typeToString(
		type,
		undefined,
		ts.TypeFormatFlags.NoTruncation |
			ts.TypeFormatFlags.UseFullyQualifiedType |
			ts.TypeFormatFlags.WriteArrayAsGenericType |
			ts.TypeFormatFlags.InTypeAlias,
	);

	if (depth >= 2 || seen.has(type)) return typeString.replace(/import\(".*?"\)\./g, "");
	seen.add(type);

	if (type.isUnion()) {
		const hasUndefined = type.types.some((item) => (item.flags & ts.TypeFlags.Undefined) !== 0);
		const definedTypes = type.types.filter((item) => (item.flags & ts.TypeFlags.Undefined) === 0);
		if (definedTypes.length > 0 && definedTypes.every((item) => (checker.getBaseTypeOfLiteralType(item).flags & ts.TypeFlags.Boolean) !== 0)) {
			return hasUndefined ? "boolean | undefined" : "boolean";
		}
		return type.types.map((item) => serializeType(item, depth + 1, seen)).join(" | ");
	}
	if (type.isIntersection()) {
		return type.types.map((item) => serializeType(item, depth + 1, seen)).join(" & ");
	}
	if (checker.isArrayType(type)) {
		const elementType = checker.getElementTypeOfArrayType(type);
		return `${serializeType(elementType, depth + 1, seen)}[]`;
	}
	if (checker.isTupleType(type)) {
		const tupleArgs = checker.getTypeArguments(type);
		return `[${tupleArgs.map((item) => serializeType(item, depth + 1, seen)).join(", ")}]`;
	}

	const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
	if (signatures.length > 0 && checker.getPropertiesOfType(type).length === 0) {
		return signatures.map((signature) => formatSignature(signature, false)).join(" | ");
	}

	const properties = checker
		.getPropertiesOfType(type)
		.filter((prop) => !["__@iterator", "__constructor"].includes(prop.getName()))
		.filter((prop) => {
			const declaration = prop.valueDeclaration ?? prop.getDeclarations()?.[0];
			return declaration ? isSourceDeclaration(declaration) : true;
		});

	if (properties.length > 0 && type.symbol?.getName() !== "BigFloat" && type.symbol?.getName() !== "BigFloatStream") {
		const parts = properties.map((prop) => {
			const declaration = prop.valueDeclaration ?? prop.getDeclarations()?.[0];
			const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
			const rawPropType = declaration ? checker.getTypeOfSymbolAtLocation(prop, declaration) : checker.getTypeOfSymbol(prop);
			const propType = optional ? stripUndefinedFromType(rawPropType) : rawPropType;
			return `${prop.getName()}${optional ? "?" : ""}: ${serializeType(propType, depth + 1, seen)}`;
		});
		return `{ ${parts.join("; ")} }`;
	}

	return typeString.replace(/import\(".*?"\)\./g, "");
}

function stripUndefinedFromType(type) {
	if (!type || !type.isUnion()) return type;
	const filtered = type.types.filter((item) => (item.flags & ts.TypeFlags.Undefined) === 0);
	if (filtered.length === 0) return type;
	return filtered.length === 1 ? filtered[0] : checker.getUnionType(filtered, ts.UnionReduction.None);
}

function formatSignature(signature, includeName = true, fallbackName = "") {
	const declaration = signature.getDeclaration();
	const typeParameters = signature.getTypeParameters() ?? [];
	const generics = typeParameters.length > 0 ? `<${typeParameters.map((item) => item.symbol.name).join(", ")}>` : "";
	const parameters = signature.parameters.map((param) => {
		const declarationNode = param.valueDeclaration ?? param.getDeclarations()?.[0];
		const rawType = declarationNode ? checker.getTypeOfSymbolAtLocation(param, declarationNode) : checker.getTypeOfSymbol(param);
		const optional =
			(param.flags & ts.SymbolFlags.Optional) !== 0 ||
			(declarationNode && ts.isParameter(declarationNode) && (!!declarationNode.questionToken || !!declarationNode.initializer));
		const isRest = declarationNode && ts.isParameter(declarationNode) && !!declarationNode.dotDotDotToken;
		const paramType = optional ? stripUndefinedFromType(rawType) : rawType;
		return `${isRest ? "..." : ""}${param.getName()}${optional ? "?" : ""}: ${serializeType(paramType)}`;
	});
	const returnType = checker.getReturnTypeOfSignature(signature);
	const name = includeName ? `${fallbackName || declaration?.name?.getText?.() || ""}` : "";
	return `${name}${generics}(${parameters.join(", ")})${includeName ? "" : ""}: ${serializeType(returnType)}`;
}

function formatFunctionLike(node, symbol, nameOverride = "") {
	const signature = checker.getSignatureFromDeclaration(node);
	if (!signature) return "";
	const docs = getJsDocInfo(node, symbol);
	const title = nameOverride || (node.name ? node.name.getText() : symbol?.getName?.() ?? "");
	const lines = [`#### \`${title}\``, "", "```ts", formatSignature(signature, true, title), "```"];

	if (docs.description) {
		lines.push("", docs.description);
	}

	if (docs.tags.params.length > 0) {
		lines.push("", "**Parameters**");
		for (const param of docs.tags.params) {
			lines.push(`- \`${param.name}\`: ${param.text || "説明なし"}`);
		}
	}

	if (docs.tags.returns) {
		lines.push("", `**Returns**: ${docs.tags.returns}`);
	}

	for (const throwText of docs.tags.throws) {
		lines.push("", `**Throws**: ${throwText}`);
	}

	for (const example of docs.tags.examples) {
		lines.push("", "**Example**", "", "```ts", example, "```");
	}

	return lines.join("\n");
}

function mergeJsDocInfos(infos) {
	const merged = {
		description: "",
		tags: {
			params: [],
			returns: "",
			throws: [],
			examples: [],
			others: [],
		},
	};

	const params = new Map();
	const throwSet = new Set();
	const exampleSet = new Set();
	const otherSet = new Set();

	for (const info of infos) {
		if (!merged.description && info.description) merged.description = info.description;
		if (!merged.tags.returns && info.tags.returns) merged.tags.returns = info.tags.returns;
		for (const param of info.tags.params) {
			if (!params.has(param.name)) params.set(param.name, param);
		}
		for (const throwText of info.tags.throws) {
			if (!throwText || throwSet.has(throwText)) continue;
			throwSet.add(throwText);
			merged.tags.throws.push(throwText);
		}
		for (const example of info.tags.examples) {
			if (!example || exampleSet.has(example)) continue;
			exampleSet.add(example);
			merged.tags.examples.push(example);
		}
		for (const other of info.tags.others) {
			const key = `${other.name}:${other.text}`;
			if (otherSet.has(key)) continue;
			otherSet.add(key);
			merged.tags.others.push(other);
		}
	}

	merged.tags.params = Array.from(params.values());
	return merged;
}

function isOverloadDeclaration(node) {
	return (ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node) || ts.isFunctionDeclaration(node)) && !node.body;
}

function selectPublicSignatures(nodes) {
	const overloads = nodes.filter((node) => isOverloadDeclaration(node));
	return overloads.length > 0 ? overloads : nodes;
}

function formatOverloadedFunctionLike(nodes, symbol, title) {
	const declarations = selectPublicSignatures(nodes);
	const docs = mergeJsDocInfos(nodes.map((node) => getJsDocInfo(node, symbol)));
	const signatures = declarations
		.map((node) => {
			const signature = checker.getSignatureFromDeclaration(node);
			return signature ? formatSignature(signature, true, title) : "";
		})
		.filter(Boolean);
	const lines = [`#### \`${title}\``, "", "```ts", ...signatures, "```"];

	if (docs.description) {
		lines.push("", docs.description);
	}

	if (docs.tags.params.length > 0) {
		lines.push("", "**Parameters**");
		for (const param of docs.tags.params) {
			lines.push(`- \`${param.name}\`: ${param.text || "説明なし"}`);
		}
	}

	if (docs.tags.returns) {
		lines.push("", `**Returns**: ${docs.tags.returns}`);
	}

	for (const throwText of docs.tags.throws) {
		lines.push("", `**Throws**: ${throwText}`);
	}

	for (const example of docs.tags.examples) {
		lines.push("", "**Example**", "", "```ts", example, "```");
	}

	return lines.join("\n");
}

function formatProperty(node, symbol, title) {
	const docs = getJsDocInfo(node, symbol);
	const type = checker.getTypeAtLocation(node);
	const lines = [`#### \`${title}\``, "", "```ts", `${title}: ${serializeType(type)}`, "```"];
	if (docs.description) {
		lines.push("", docs.description);
	}
	return lines.join("\n");
}

function getClassMembers(classDecl) {
	const constructors = [];
	const staticProperties = [];
	const staticMethods = [];
	const instanceProperties = [];
	const instanceMethods = [];

	for (const member of classDecl.members) {
		if (!isSourceDeclaration(member) || !isPublicMember(member)) continue;
		if (ts.isConstructorDeclaration(member)) {
			constructors.push(member);
			continue;
		}
		const name = getMemberName(member);
		if (!name || !shouldDocumentMemberName(name)) continue;
		const isStatic = (ts.getModifiers(member) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
		if (ts.isMethodDeclaration(member)) {
			(isStatic ? staticMethods : instanceMethods).push(member);
			continue;
		}
		if (ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member) || ts.isPropertyDeclaration(member)) {
			(isStatic ? staticProperties : instanceProperties).push(member);
		}
	}

	return { constructors, staticProperties, staticMethods, instanceProperties, instanceMethods };
}

function groupMembersByName(members) {
	const groups = [];
	const map = new Map();
	for (const member of members) {
		const name = ts.isConstructorDeclaration(member) ? "constructor" : getMemberName(member);
		if (!map.has(name)) {
			const group = { name, members: [] };
			map.set(name, group);
			groups.push(group);
		}
		map.get(name).members.push(member);
	}
	return groups;
}

function formatClass(symbol, classDecl) {
	const docs = getJsDocInfo(classDecl, symbol);
	const lines = [`## \`${symbol.getName()}\``, ""];

	if (docs.description) {
		lines.push(docs.description, "");
	}

	lines.push("```ts", `class ${symbol.getName()}`, "```");

	const { constructors, staticProperties, staticMethods, instanceProperties, instanceMethods } = getClassMembers(classDecl);

	if (constructors.length > 0) {
		lines.push("", "### Constructor", "");
		for (const group of groupMembersByName(constructors)) {
			lines.push(formatOverloadedFunctionLike(group.members, symbol, group.name), "");
		}
	}

	if (staticProperties.length > 0) {
		lines.push("", "### Static Properties", "");
		for (const member of staticProperties) {
			const memberSymbol = checker.getSymbolAtLocation(member.name);
			lines.push(formatProperty(member, memberSymbol, getMemberName(member)), "");
		}
	}

	if (staticMethods.length > 0) {
		lines.push("", "### Static Methods", "");
		for (const group of groupMembersByName(staticMethods)) {
			const memberSymbol = checker.getSymbolAtLocation(group.members[0].name);
			lines.push(formatOverloadedFunctionLike(group.members, memberSymbol, group.name), "");
		}
	}

	if (instanceProperties.length > 0) {
		lines.push("", "### Instance Properties", "");
		for (const member of instanceProperties) {
			const memberSymbol = checker.getSymbolAtLocation(member.name);
			lines.push(formatProperty(member, memberSymbol, getMemberName(member)), "");
		}
	}

	if (instanceMethods.length > 0) {
		lines.push("", "### Instance Methods", "");
		for (const group of groupMembersByName(instanceMethods)) {
			const memberSymbol = checker.getSymbolAtLocation(group.members[0].name);
			lines.push(formatOverloadedFunctionLike(group.members, memberSymbol, group.name), "");
		}
	}

	return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function formatEnum(symbol, enumDecl) {
	const docs = getJsDocInfo(enumDecl, symbol);
	const lines = [`## \`${symbol.getName()}\``, ""];

	if (docs.description) {
		lines.push(docs.description, "");
	}

	lines.push("```ts", `enum ${symbol.getName()}`, "```", "", "### Members", "");
	for (const member of enumDecl.members) {
		const memberSymbol = checker.getSymbolAtLocation(member.name);
		const memberDocs = memberSymbol ? getJsDocInfo(member, memberSymbol) : { description: "", tags: { params: [], returns: "", throws: [], examples: [], others: [] } };
		const initializer = member.initializer ? ` = ${member.initializer.getText()}` : "";
		lines.push(`- \`${member.name.getText()}${initializer}\`${memberDocs.description ? `: ${memberDocs.description}` : ""}`);
	}

	return lines.join("\n").trim();
}

function formatInterfaceLike(symbol, declaration) {
	const docs = getJsDocInfo(declaration, symbol);
	const type = checker.getTypeAtLocation(declaration);
	const lines = [`## \`${symbol.getName()}\``, ""];

	if (docs.description) {
		lines.push(docs.description, "");
	}

	const body = serializeType(type);
	if (ts.isInterfaceDeclaration(declaration)) {
		lines.push("```ts", `interface ${symbol.getName()} ${body}`, "```");
	} else {
		lines.push("```ts", `type ${symbol.getName()} = ${body}`, "```");
	}
	return lines.join("\n").trim();
}

function formatExport(entry) {
	const { targetSymbol } = entry;
	const declaration = targetSymbol.getDeclarations()?.find((node) => isSourceDeclaration(node)) ?? targetSymbol.getDeclarations()?.[0];
	if (!declaration) return "";

	if (ts.isClassDeclaration(declaration)) return formatClass(targetSymbol, declaration);
	if (ts.isFunctionDeclaration(declaration)) {
		return [`## \`${targetSymbol.getName()}\``, "", formatFunctionLike(declaration, targetSymbol, targetSymbol.getName())].join("\n").trim();
	}
	if (ts.isEnumDeclaration(declaration)) return formatEnum(targetSymbol, declaration);
	if (ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration)) return formatInterfaceLike(targetSymbol, declaration);
	if (ts.isVariableDeclaration(declaration)) {
		return [`## \`${targetSymbol.getName()}\``, "", formatProperty(declaration, targetSymbol, targetSymbol.getName())].join("\n").trim();
	}
	return "";
}

function createSlug(name, index) {
	const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
	return index === 0 ? base : `${base}-${index}`;
}

const slugCounts = new Map();
const sections = resolvedExports
	.map((entry) => {
		const name = entry.targetSymbol.getName();
		const content = formatExport(entry);
		const slugBase = createSlug(name, 0);
		const currentCount = slugCounts.get(slugBase) ?? 0;
		slugCounts.set(slugBase, currentCount + 1);
		return {
			name,
			slug: createSlug(name, currentCount),
			content,
		};
	})
	.filter((entry) => entry.content);

const toc = sections.map((section) => `- [\`${section.name}\`](#${section.slug})`).join("\n");

const markdown = [
	"# BigFloat API",
	"",
	"`npm run build:md` で自動生成された API リファレンスです。",
	"",
	"## Contents",
	"",
	toc,
	"",
	...sections.map((section) => `<a id="${section.slug}"></a>\n\n${section.content}`),
]
	.join("\n\n")
	.replace(/\n{3,}/g, "\n\n")
	.trim() + "\n";

fs.writeFileSync(OUTPUT_FILE, markdown, "utf8");
console.log(`Generated ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
