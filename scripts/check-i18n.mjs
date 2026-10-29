import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const slash = (value) => value.split(path.sep).join('/');
const sourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? sourceFiles(file) : /\.tsx?$/.test(file) ? [file] : [];
});
const unwrap = (node) => ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;

/** 字典只求值对象、字符串和相对导入，不执行应用模块或写出编译产物。 */
function dictionary(file, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const imports = new Map();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !statement.importClause?.name) continue;
    const base = path.resolve(path.dirname(file), statement.moduleSpecifier.text);
    const resolved = [base, `${base}.ts`, path.join(base, 'index.ts')].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    imports.set(statement.importClause.name.text, resolved);
  }
  const evaluate = (input) => {
    const node = unwrap(input);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isIdentifier(node) && imports.has(node.text)) return dictionary(imports.get(node.text), cache);
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map((property) => {
      if (ts.isShorthandPropertyAssignment(property)) return [property.name.text, evaluate(property.name)];
      if (ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) return [property.name.text, evaluate(property.initializer)];
      const position = source.getLineAndCharacterOfPosition(property.getStart(source));
      throw new Error(`${file}:${position.line + 1}:${position.character + 1}: unsupported dictionary property`);
    }));
    const position = source.getLineAndCharacterOfPosition(node.getStart(source));
    throw new Error(`${file}:${position.line + 1}:${position.character + 1}: dictionaries must contain string leaves and objects`);
  };
  const assignment = source.statements.find(ts.isExportAssignment);
  if (!assignment) throw new Error(`${file}: missing default dictionary export`);
  const result = evaluate(assignment.expression);
  cache.set(file, result);
  return result;
}

const leaves = (value, prefix = '') => typeof value === 'string' ? [[prefix, value]]
  : Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
const keyPaths = (value, prefix = '') => typeof value === 'string' ? []
  : Object.entries(value).flatMap(([key, child]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    return [current, ...keyPaths(child, current)];
  });
const placeholders = (value) => [...new Set([...value.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]))].sort();

export function checkI18n(root) {
  const errors = [];
  const allowlist = JSON.parse(fs.readFileSync(path.join(root, 'scripts/i18n-allowlist.json'), 'utf8'));
  const pending = JSON.parse(fs.readFileSync(path.join(root, 'scripts/i18n-pending.json'), 'utf8'));
  if (!Array.isArray(allowlist) || !Array.isArray(pending)) throw new Error('i18n exemption files must contain arrays');
  const usedAllowlist = new Set();
  const usedPending = new Set();
  const exemptKeys = new Set();
  for (const [index, entry] of allowlist.entries()) {
    if (!entry.file || typeof entry.text !== 'string' || !entry.reason?.trim()) errors.push(`scripts/i18n-allowlist.json:${index + 1}: file, text and reason are required`);
    const key = `${entry.file}\0${entry.text}`;
    if (exemptKeys.has(key)) errors.push(`scripts/i18n-allowlist.json:${index + 1}: duplicate exemption`);
    exemptKeys.add(key);
  }
  if (new Set(pending).size !== pending.length) errors.push('scripts/i18n-pending.json: duplicate file');
  let findings = 0;
  for (const file of sourceFiles(path.join(root, 'src'))) {
    const relative = slash(path.relative(root, file));
    if (relative.startsWith('src/i18n/locales/')) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      const supported = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
        || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node) || ts.isRegularExpressionLiteral(node);
      if (supported) {
        const decoded = ts.isRegularExpressionLiteral(node) ? node.text.replace(/\\u(?:\{([\da-f]+)\}|([\da-f]{4}))/gi, (_, full, short) => String.fromCodePoint(parseInt(full || short, 16))) : node.text;
        if (CJK.test(decoded)) {
          findings += 1;
          if (pending.includes(relative)) usedPending.add(relative);
          const exempt = allowlist.findIndex((entry) => entry.file === relative && entry.text === node.text);
          if (exempt >= 0) usedAllowlist.add(exempt);
          if (!pending.includes(relative) && exempt < 0) {
            const position = source.getLineAndCharacterOfPosition(node.getStart(source));
            const kind = ts.isNoSubstitutionTemplateLiteral(node) ? 'NoSubstitutionTemplateLiteral'
              : ts.isTemplateTail(node) ? 'TemplateTail' : ts.SyntaxKind[node.kind];
            errors.push(`${relative}:${position.line + 1}:${position.character + 1}: ${kind} ${JSON.stringify(node.text)}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  allowlist.forEach((entry, index) => {
    if (!usedAllowlist.has(index)) errors.push(`scripts/i18n-allowlist.json:${index + 1}: obsolete exemption ${entry.file} ${JSON.stringify(entry.text)}`);
  });
  pending.forEach((file, index) => {
    if (!usedPending.has(file)) errors.push(`scripts/i18n-pending.json:${index + 1}: obsolete pending file ${file}`);
  });
  const zhTree = dictionary(path.join(root, 'src/i18n/locales/zh-CN/index.ts'));
  const enTree = dictionary(path.join(root, 'src/i18n/locales/en-US/index.ts'));
  for (const key of new Set([...keyPaths(zhTree), ...keyPaths(enTree)])) {
    const segment = key.split('.').at(-1);
    if (!/^[a-z][a-zA-Z0-9]*$/.test(segment)) errors.push(`dictionary ${key}: key segment ${JSON.stringify(segment)} must match /^[a-z][a-zA-Z0-9]*$/ (camelCase)`);
    if (segment.length > 24) errors.push(`dictionary ${key}: key segment ${JSON.stringify(segment)} exceeds 24 characters (${segment.length})`);
  }
  const zh = new Map(leaves(zhTree));
  const en = new Map(leaves(enTree));
  for (const key of new Set([...zh.keys(), ...en.keys()])) {
    if (!zh.has(key) || !en.has(key)) { errors.push(`dictionary ${key}: missing in ${zh.has(key) ? 'en-US' : 'zh-CN'}`); continue; }
    const zhParams = placeholders(zh.get(key));
    const enParams = placeholders(en.get(key));
    if (JSON.stringify(zhParams) !== JSON.stringify(enParams)) errors.push(`dictionary ${key}: placeholder mismatch; zh-CN=${JSON.stringify(zhParams)} en-US=${JSON.stringify(enParams)}`);
  }
  return { errors, keys: zh.size, findings, pending: pending.length, allowlist: allowlist.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const flag = process.argv.indexOf('--root');
    const root = flag >= 0 ? path.resolve(process.argv[flag + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const result = checkI18n(root);
    if (result.errors.length) {
      console.error(result.errors.join('\n'));
      process.exitCode = 1;
    } else console.log(`i18n: ${result.keys} keys verified (camelCase, <=24 characters per segment); ${result.pending} pending files; ${result.allowlist} exact exemptions; no unapproved CJK`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
