#!/usr/bin/env node
/**
 * Usage map of the public API.
 *
 * Reads the public names of the library from `src/index.ts` and tells which of them the given
 * applications import, in how many files, and which props they pass to its components. The
 * applications are read from their git objects with the TypeScript parser alone: their working
 * trees do not matter and nothing in them is touched.
 *
 *   yarn usage:map ../app-one ../app-two
 *   yarn usage:map --since origin/master --json usage.json ../app-one@origin/main
 *   yarn usage:map --props PneModal ../app-one
 *   yarn usage:map --help
 */
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'

const HELP = `Usage: node scripts/usage-map.mjs [options] <application>...

Tells which public names of the library the applications import, in how many files, and which
props they pass to its components. An application is a directory with a git checkout: its committed
sources are read, so the working tree does not matter and nothing in it is touched. "dir@rev" reads
a revision other than HEAD.

  --since <rev>       revision of the library to compare the public names with: tells the names
                      added and removed since, for example since the version the applications use
  --branches <days>   also read the branches of the applications updated in the last <days> days,
                      as of the last fetch: a name nobody imports may be in use on a branch in
                      progress (default 30, 0 reads none)
  --words <list>      also count the files where these words occur, through a comma: theme keys
                      and other names that are not imported
  --props <name>      print how often each prop of this component is passed
  --json <file>       write everything that was found as JSON
  -h, --help          this text

Files under a test, story or mock directory and files named *.test.*, *.spec.* or *.stories.* are
counted apart from the application code: "12+3" is 12 files of the application and 3 of its tests.`

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ts = createRequire(import.meta.url)('typescript')
const LIBRARY = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const ENTRY = 'src/index.ts'
const SOURCES = ['*.ts', '*.tsx', '*.mts', '*.cts', '*.js', '*.jsx', '*.mjs', '*.cjs']
const TOP = 25

const git = (cwd, args, input) => execFileSync('git', args, {cwd, input, maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'pipe']})
const isLibrary = specifier => specifier === LIBRARY.name || Boolean(specifier?.startsWith(`${LIBRARY.name}/`))
const isAside = file => /(^|\/)(tests?|__tests__|__mocks__|e2e|stories|mocks?|\.storybook)\//.test(file)
    || /\.(test|spec|stories)\.[a-z]+$/.test(file)
const hasModifier = (node, kind) =>
    (ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined)?.some(modifier => modifier.kind === kind) ?? false
const isTypeOnly = clause => Boolean(clause.isTypeOnly || clause.phaseModifier === ts.SyntaxKind.TypeKeyword)
const bindingNames = name => ts.isIdentifier(name)
    ? [name.text]
    : name.elements.flatMap(element => ts.isOmittedExpression(element) ? [] : bindingNames(element.name))
const count = (counts, key, by = 1) => { counts[key] = (counts[key] ?? 0) + by }

function readOptions(argv) {
    const {values, positionals} = parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
            since: {type: 'string'},
            branches: {type: 'string', default: '30'},
            words: {type: 'string', default: ''},
            props: {type: 'string'},
            json: {type: 'string'},
            help: {type: 'boolean', short: 'h', default: false},
        },
    })
    const days = Number(values.branches)
    if (!Number.isInteger(days) || days < 0) throw new Error('--branches takes a whole number of days')
    if (!values.help && !positionals.length) throw new Error('Give at least one application directory, see --help')
    return {
        help: values.help, since: values.since, days, props: values.props,
        json: values.json && path.resolve(values.json),
        words: values.words.split(',').map(word => word.trim()).filter(Boolean),
        applications: positionals,
    }
}

/** Reads a source file of the library by its path from the root: the working tree, or a revision. */
function librarySources(revision) {
    if (!revision) return file => fs.existsSync(path.join(ROOT, file)) ? fs.readFileSync(path.join(ROOT, file), 'utf8') : null
    const files = new Set(git(ROOT, ['ls-tree', '-r', '-z', '--name-only', revision, '--', 'src']).toString().split('\0'))
    return file => files.has(file) ? git(ROOT, ['show', `${revision}:${file}`]).toString() : null
}

/** The text of the `@deprecated` tag in the comment right above a node, or null. */
function deprecation(source, node) {
    for (const {pos, end} of ts.getLeadingCommentRanges(source.text, node.pos) ?? []) {
        const match = /@deprecated\b([^\n]*)/.exec(source.text.slice(pos, end))
        if (match) return match[1].replace(/\*\/$/, '').trim()
    }
    return null
}

/**
 * The public names of the library: everything `src/index.ts` exports, followed through the
 * re-exports. For each name: whether it exists at run time, the module of the first level it comes
 * through (its group) and the file that declares it. Also the members marked `@deprecated` in the
 * files that declare public names.
 */
function publicNames(read) {
    const sources = new Map()
    const parse = file => {
        if (!sources.has(file)) {
            const text = read(file)
            sources.set(file, text === null ? null : ts.createSourceFile(
                file, text, ts.ScriptTarget.Latest, false, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
            ))
        }
        return sources.get(file)
    }
    const resolve = (from, specifier) => {
        const base = path.posix.join(path.posix.dirname(from), specifier)
        return [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(file => parse(file)) ?? null
    }
    // A name that comes from another package is taken for a value: only its own `type` keyword says otherwise.
    const fromModule = (file, specifier, name, trail) => specifier.startsWith('.')
        ? declaration(resolve(file, specifier), name, trail)
        : {kind: 'value', file: null}

    /** Finds what stands behind a name that a file exports or has in scope. */
    const declaration = (file, name, trail = new Set()) => {
        const source = file && parse(file)
        if (!source || trail.has(`${file}\n${name}`)) return null
        trail.add(`${file}\n${name}`)
        let type = null
        for (const statement of source.statements) {
            const value = syntax => ({kind: 'value', file, syntax, deprecated: deprecation(source, statement)})
            if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
                if (statement.name.text === name) type = {kind: 'type', file, deprecated: deprecation(source, statement)}
            } else if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) {
                if (statement.name?.text === name || (name === 'default' && hasModifier(statement, ts.SyntaxKind.DefaultKeyword))) {
                    return value(ts.isEnumDeclaration(statement) ? 'enum' : ts.isClassDeclaration(statement) ? 'class' : 'function')
                }
            } else if (ts.isVariableStatement(statement)) {
                const declared = statement.declarationList.declarations.find(item => bindingNames(item.name).includes(name))
                const initializer = declared?.initializer
                if (declared) return value(initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) ? 'function' : 'const')
            } else if (ts.isExportAssignment(statement)) {
                if (name !== 'default' || statement.isExportEquals) continue
                return (ts.isIdentifier(statement.expression) ? declaration(file, statement.expression.text, trail) : null) ?? value('const')
            } else if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
                const element = statement.exportClause.elements.find(candidate => candidate.name.text === name)
                const original = element && (element.propertyName ?? element.name).text
                // `export {name}` of a local name is found at its own declaration, by this same loop.
                if (!element || (!statement.moduleSpecifier && original === name)) continue
                const behind = statement.moduleSpecifier
                    ? fromModule(file, statement.moduleSpecifier.text, original, trail)
                    : declaration(file, original, trail)
                return behind && (statement.isTypeOnly || element.isTypeOnly) ? {...behind, kind: 'type'} : behind
            } else if (ts.isImportDeclaration(statement) && statement.importClause) {
                const clause = statement.importClause
                const bindings = clause.namedBindings
                const element = bindings && ts.isNamedImports(bindings)
                    ? bindings.elements.find(candidate => candidate.name.text === name)
                    : null
                const original = element ? (element.propertyName ?? element.name).text : clause.name?.text === name ? 'default' : null
                if (original) {
                    const behind = fromModule(file, statement.moduleSpecifier.text, original, trail)
                    return behind && (isTypeOnly(clause) || element?.isTypeOnly) ? {...behind, kind: 'type'} : behind
                }
                if (bindings && ts.isNamespaceImport(bindings) && bindings.name.text === name) return value('const')
            }
        }
        if (type) return type
        for (const statement of source.statements) {
            if (ts.isExportDeclaration(statement) && !statement.exportClause && statement.moduleSpecifier.text.startsWith('.')) {
                const behind = declaration(resolve(file, statement.moduleSpecifier.text), name, trail)
                if (behind) return behind
            }
        }
        return null
    }

    const names = new Map()
    const visited = new Set()
    const add = (name, behind, typeOnly, group) => {
        if (names.has(name)) return
        if (!behind) console.error(`Declaration not found, taken for a value: ${name} of ${group}`)
        names.set(name, {
            kind: typeOnly ? 'type' : behind?.kind ?? 'value', group, file: behind?.file ?? null,
            syntax: behind?.syntax ?? null, deprecated: behind?.deprecated ?? null,
        })
    }
    const walk = (file, group) => {
        const source = parse(file)
        if (!source || visited.has(file)) return
        visited.add(file)
        for (const statement of source.statements) {
            if (ts.isExportDeclaration(statement)) {
                const specifier = statement.moduleSpecifier?.text
                const clause = statement.exportClause
                if (!clause) {
                    const target = specifier.startsWith('.') ? resolve(file, specifier) : null
                    if (target) walk(target, group ?? target)
                    else console.error(`Not followed: export * from '${specifier}' in ${file}`)
                } else if (ts.isNamedExports(clause)) {
                    for (const element of clause.elements) {
                        const original = (element.propertyName ?? element.name).text
                        const behind = specifier ? fromModule(file, specifier, original) : declaration(file, original)
                        add(element.name.text, behind, statement.isTypeOnly || element.isTypeOnly, group ?? file)
                    }
                } else {
                    add(clause.name.text, {kind: 'value', file}, statement.isTypeOnly, group ?? file)
                }
            } else if (hasModifier(statement, ts.SyntaxKind.ExportKeyword) && !hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
                const declared = ts.isVariableStatement(statement)
                    ? statement.declarationList.declarations.flatMap(item => bindingNames(item.name))
                    : statement.name && ts.isIdentifier(statement.name) ? [statement.name.text] : []
                for (const name of declared) add(name, declaration(file, name), false, group ?? file)
            }
        }
    }
    walk(ENTRY, null)
    if (!names.size) throw new Error(`No public name found in ${ENTRY}`)

    const members = []
    for (const [file, source] of sources) {
        if (!source?.text.includes('@deprecated')) continue
        const visit = node => {
            if (ts.isPropertySignature(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) {
                const note = deprecation(source, node)
                if (note !== null) members.push({file, member: node.name.text, note})
            }
            ts.forEachChild(node, visit)
        }
        visit(source)
    }
    return {names, members}
}

/** What a public name is, as far as its name and declaration tell. */
const shapeOf = (name, {kind, syntax}) => kind === 'type' ? 'type'
    : syntax === 'enum' || syntax === 'class' ? syntax
        : /^use[A-Z]/.test(name) ? 'hook'
            : /^[A-Z][A-Z0-9_]*$/.test(name) ? 'constant'
                : /^[A-Z]/.test(name) ? 'component'
                    : syntax === 'function' ? 'function' : 'value'

/** The names a `jest.mock` factory replaces: the keys of the object it returns. */
function mockedKeys(factory) {
    if (!factory || !(ts.isArrowFunction(factory) || ts.isFunctionExpression(factory))) return []
    const unwrap = node => node && ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node
    const returned = ts.isBlock(factory.body)
        ? factory.body.statements.filter(statement => ts.isReturnStatement(statement)).map(statement => unwrap(statement.expression))
        : [unwrap(factory.body)]
    return returned.filter(node => node && ts.isObjectLiteralExpression(node))
        .flatMap(node => node.properties)
        .flatMap(({name}) => name && (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) ? [name.text] : [])
}

/** What one application file takes from the library. */
function analyse(file, text) {
    const kind = /\.[cm]?tsx$/.test(file) ? ts.ScriptKind.TSX : /\.[cm]?ts$/.test(file) ? ts.ScriptKind.TS : ts.ScriptKind.JSX
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, kind)
    const names = new Set(), deep = new Set(), mocked = new Set(), namespaces = new Set(), reexported = new Set()
    const locals = new Map()
    const elements = Object.create(null)
    let opaque = 0, mock = false
    for (const statement of source.statements) {
        const imported = ts.isImportDeclaration(statement)
        if (!imported && !ts.isExportDeclaration(statement)) continue
        const specifier = statement.moduleSpecifier?.text
        if (!isLibrary(specifier)) continue
        if (specifier !== LIBRARY.name) deep.add(specifier)
        const bindings = imported ? statement.importClause?.namedBindings : statement.exportClause
        if (imported && statement.importClause?.name) {
            names.add('default')
            locals.set(statement.importClause.name.text, 'default')
        }
        if (!bindings) {
            // `import 'library'` takes nothing, `export * from 'library'` hands everything over unnamed.
            if (!imported) opaque++
        } else if (ts.isNamedImports(bindings) || ts.isNamedExports(bindings)) {
            for (const element of bindings.elements) {
                const original = (element.propertyName ?? element.name).text
                names.add(original)
                if (imported) locals.set(element.name.text, original)
                else reexported.add(original)
            }
        } else if (ts.isNamespaceImport(bindings)) {
            namespaces.add(bindings.name.text)
        } else {
            opaque++
        }
    }
    const member = node => ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && namespaces.has(node.expression.text)
        ? node.name.text
        : ts.isQualifiedName(node) && ts.isIdentifier(node.left) && namespaces.has(node.left.text) ? node.right.text : null
    const visit = node => {
        const viaNamespace = member(node)
        if (viaNamespace) names.add(viaNamespace)
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const name = ts.isIdentifier(node.tagName) ? locals.get(node.tagName.text) : member(node.tagName)
            if (name) {
                const entry = elements[name] ??= {count: 0, spreads: 0, props: Object.create(null)}
                entry.count++
                if (node.attributes.properties.some(attribute => ts.isJsxSpreadAttribute(attribute))) entry.spreads++
                for (const attribute of node.attributes.properties) {
                    if (ts.isJsxAttribute(attribute)) count(entry.props, attribute.name.getText(source))
                }
            }
        } else if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteralLike(node.arguments[0])
            && isLibrary(node.arguments[0].text)) {
            const callee = node.expression
            if (ts.isPropertyAccessExpression(callee) && /^(mock|doMock)$/.test(callee.name.text)) {
                mock = true
                for (const key of mockedKeys(node.arguments[1])) mocked.add(key)
            } else if (callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require')) {
                opaque++
            }
        }
        ts.forEachChild(node, visit)
    }
    visit(source)
    return {
        names: [...names], deep: [...deep], mocked: [...mocked], reexported: [...reexported], mock, opaque, elements,
        imports: names.size > 0 || namespaces.size > 0 || opaque > 0,
    }
}

/** `git grep -l`: the source files of a commit that match, as "<commit>:<path>". */
function grep(dir, commit, pattern) {
    try {
        return git(dir, ['grep', '-l', '-z', ...pattern, commit, '--', ...SOURCES]).toString().split('\0').filter(Boolean)
    } catch (error) {
        if (error.status === 1) return []
        throw error
    }
}

/** The files of a commit that mention the library, analysed; a blob met before is not parsed again. */
function readRevision(dir, commit, cache) {
    const specs = grep(dir, commit, ['-F', '-e', LIBRARY.name])
    if (!specs.length) return []
    const batch = git(dir, ['cat-file', '--batch'], `${specs.join('\n')}\n`)
    const files = []
    let position = 0
    for (const spec of specs) {
        const lineEnd = batch.indexOf(10, position)
        const [sha, type, size] = batch.subarray(position, lineEnd).toString().split(' ')
        position = lineEnd + 1
        if (type !== 'blob') continue
        const file = spec.slice(commit.length + 1)
        if (!cache.has(sha)) cache.set(sha, analyse(file, batch.subarray(position, position + Number(size)).toString('utf8')))
        files.push({file, ...cache.get(sha)})
        position += Number(size) + 1
    }
    return files
}

/** The branches updated in the last `days` days, one per commit, without the commit that is read anyway. */
function branchTips(dir, days, skip) {
    const after = Date.now() / 1000 - days * 86400
    const seen = new Set([skip])
    const tips = []
    const refs = git(dir, ['for-each-ref', '--sort=-committerdate', '--format=%(objectname) %(committerdate:unix) %(refname)',
        'refs/heads', 'refs/remotes']).toString().split('\n')
    for (const line of days ? refs : []) {
        const [commit, time, ref] = line.split(' ')
        if (!ref || Number(time) < after || ref.endsWith('/HEAD') || seen.has(commit)) continue
        seen.add(commit)
        tips.push({commit, ref: ref.replace(/^refs\/(heads|remotes)\//, '')})
    }
    return tips
}

function main() {
    const options = readOptions(process.argv.slice(2))
    if (options.help) {
        console.log(HELP)
        return 0
    }
    const {names, members} = publicNames(librarySources(null))
    const before = options.since
        ? publicNames(librarySources(git(ROOT, ['rev-parse', '--verify', `${options.since}^{commit}`]).toString().trim())).names
        : null

    const cache = new Map()
    const usage = new Map()
    const elements = Object.create(null)
    const words = Object.create(null)
    const applications = []
    const usageOf = (name, application) => {
        if (!usage.has(name)) usage.set(name, Object.create(null))
        return usage.get(name)[application] ??= {files: 0, aside: 0, mocked: 0, branches: 0, branch: null}
    }
    for (const argument of options.applications) {
        const at = fs.existsSync(argument) ? -1 : argument.lastIndexOf('@')
        const dir = path.resolve(at < 0 ? argument : argument.slice(0, at))
        const revision = at < 0 ? 'HEAD' : argument.slice(at + 1)
        const read = (...args) => git(dir, args).toString().trim()
        const commit = read('rev-parse', '--verify', `${revision}^{commit}`)
        let manifest = {}
        try {
            manifest = JSON.parse(read('show', `${commit}:package.json`))
        } catch {
            // An application without a root package.json has no version to show.
        }
        const tips = branchTips(dir, options.days, commit)
        const base = path.basename(dir)
        const application = {
            name: applications.some(other => other.name === base) ? `${base}@${revision}` : base,
            revision: revision === 'HEAD' ? read('rev-parse', '--abbrev-ref', 'HEAD') : revision,
            version: ['dependencies', 'devDependencies', 'peerDependencies'].map(field => manifest[field]?.[LIBRARY.name]).find(Boolean) ?? null,
            files: 0, aside: 0, names: 0, mocks: 0, opaque: 0, deep: Object.create(null), reexports: Object.create(null),
            branches: tips.length,
        }
        applications.push(application)
        const taken = new Set()
        for (const entry of readRevision(dir, commit, cache)) {
            const scope = isAside(entry.file) ? 'aside' : 'files'
            if (entry.imports) application[scope]++
            if (entry.mock) application.mocks++
            if (entry.opaque) application.opaque++
            for (const specifier of entry.deep) count(application.deep, specifier)
            for (const name of entry.reexported) count(application.reexports, name)
            for (const name of entry.names) {
                usageOf(name, application.name)[scope]++
                if (scope === 'files') taken.add(name)
            }
            for (const name of entry.mocked) usageOf(name, application.name).mocked++
            for (const [name, found] of Object.entries(entry.elements)) {
                const total = elements[name] ??= {count: 0, spreads: 0, props: Object.create(null)}
                total.count += found.count
                total.spreads += found.spreads
                for (const [prop, times] of Object.entries(found.props)) count(total.props, prop, times)
            }
        }
        application.names = taken.size
        for (const tip of tips) {
            const onBranch = new Set(readRevision(dir, tip.commit, cache)
                .flatMap(entry => isAside(entry.file) ? [] : entry.names))
            for (const name of onBranch) {
                const entry = usageOf(name, application.name)
                entry.branches++
                entry.branch ??= tip.ref
            }
        }
        for (const word of options.words) {
            const files = grep(dir, commit, ['-w', '-F', '-e', word]).map(spec => spec.slice(commit.length + 1))
            const aside = files.filter(isAside).length
            if (files.length) (words[word] ??= Object.create(null))[application.name] = {files: files.length - aside, aside}
        }
    }

    const sum = (uses, field) => Object.values(uses).reduce((total, entry) => total + entry[field], 0)
    const rows = [...names].map(([name, entry]) => {
        const uses = usage.get(name) ?? {}
        return {
            name, ...entry, shape: shapeOf(name, entry), added: before ? !before.has(name) : null, uses,
            files: sum(uses, 'files'), aside: sum(uses, 'aside'), mocked: sum(uses, 'mocked'), branches: sum(uses, 'branches'),
        }
    })
    const foreign = [...usage]
        .filter(([name, uses]) => !names.has(name) && sum(uses, 'files') + sum(uses, 'aside') + sum(uses, 'branches') > 0)
        .map(([name, uses]) => ({
            name, removed: before ? before.has(name) : null, uses,
            files: sum(uses, 'files'), aside: sum(uses, 'aside'), branches: sum(uses, 'branches'),
        }))
    const removed = before ? [...before.keys()].filter(name => !names.has(name)) : []
    const deprecatedProps = members.flatMap(({file, member, note}) => rows
        .filter(row => row.shape === 'component' && row.file === file)
        .map(row => ({
            component: row.name, prop: member, note,
            passed: elements[row.name]?.props[member] ?? 0, elements: elements[row.name]?.count ?? 0,
            spreads: elements[row.name]?.spreads ?? 0,
        })))

    const values = rows.filter(row => row.kind === 'value')
    const where = uses => Object.entries(uses).filter(([, entry]) => entry.files + entry.aside)
        .map(([application, entry]) => `${application} ${entry.files}${entry.aside ? `+${entry.aside}` : ''}`).join(', ')
    const mark = row => `${row.name}${row.added ? '*' : ''}${row.branches ? '†' : ''}`
    const whereOnBranches = uses => Object.entries(uses).filter(([, entry]) => entry.branches)
        .map(([application, entry]) => `${application} ${entry.branch}${entry.branches > 1 ? ` and ${entry.branches - 1} more` : ''}`).join(', ')
    const byGroup = list => {
        const groups = new Map()
        for (const row of list) groups.set(row.group, [...groups.get(row.group) ?? [], row])
        return [...groups].sort((a, b) => b[1].length - a[1].length)
    }
    const section = (title, lines) => {
        if (lines.length) console.log(`\n${title}\n${lines.map(line => `  ${line}`).join('\n')}`)
    }

    console.log(`${LIBRARY.name} ${LIBRARY.version}: ${rows.length} public names, ${values.length} of them exist at run time`
        + (before ? `; since ${options.since} ${rows.filter(row => row.added).length} added and ${removed.length} removed` : ''))
    section('Applications', applications.map(application => `${application.name} at ${application.revision}`
        + ` (${LIBRARY.name} ${application.version ?? 'is not a dependency'}): ${application.files}+${application.aside} files import it,`
        + ` ${application.names} names; ${application.mocks} files mock it`
        + (application.opaque ? `, ${application.opaque} take it whole (require, import() or export *)` : '')
        + (Object.keys(application.deep).length ? `; deep imports: ${Object.keys(application.deep).join(', ')}` : '')
        + (Object.keys(application.reexports).length
            ? `; re-exports ${Object.keys(application.reexports).join(', ')}: the files that take them from there are not counted` : '')
        + (options.days ? `; ${application.branches} more branches of the last ${options.days} days read` : '')))
    section(`Most imported, files`, [...rows].sort((a, b) => b.files - a.files).slice(0, TOP).filter(row => row.files)
        .map(row => `${row.name} ${row.files}`))
    const rare = values.filter(row => row.files > 0 && row.files <= 2)
    section(`Run-time names imported in one or two files: ${rare.length}`, rare.map(row => `${row.name} — ${where(row.uses)}`))
    const asideOnly = values.filter(row => !row.files && row.aside)
    section(`Run-time names imported by tests, stories or mocks only: ${asideOnly.length}`,
        asideOnly.map(row => `${mark(row)} — ${where(row.uses)}`))
    const unused = values.filter(row => !row.files && !row.aside)
    section(`Run-time names nobody imports: ${unused.length}`
        + `${before ? `, * added since ${options.since}` : ''}${options.days ? ', † imported on a branch in progress' : ''}`,
    byGroup(unused).map(([group, list]) => `${group} (${list.length}): ${list.map(mark).join(', ')}`))
    const unusedTypes = rows.filter(row => row.kind === 'type' && !row.files && !row.aside)
    console.log(`\nTypes nobody imports: ${unusedTypes.length} of ${rows.length - values.length}`)
    section(`Imported, but not exported by this version: ${foreign.length}${options.days ? ', † on a branch in progress only' : ''}`,
        foreign.map(entry => (entry.files + entry.aside ? `${entry.name} — ${where(entry.uses)}` : `${entry.name}† — ${whereOnBranches(entry.uses)}`)
            + (entry.removed ? `, removed since ${options.since}` : '')))
    section('Deprecated', [
        ...rows.filter(row => row.deprecated !== null).map(row =>
            `${row.name}: ${row.files + row.aside ? `imported in ${where(row.uses)}` : 'not imported'} — ${row.deprecated}`),
        ...deprecatedProps.map(entry => `${entry.component} ${entry.prop}: passed ${entry.passed} times in ${entry.elements} elements`
            + `${entry.spreads ? `, ${entry.spreads} more take their props from a spread` : ''} — ${entry.note}`),
    ])
    section('Words, files', Object.entries(words).map(([word, uses]) => `${word} — ${where(uses)}`))
    if (options.props) {
        const found = elements[options.props]
        section(`${options.props}: ${found?.count ?? 0} elements${found?.spreads ? `, ${found.spreads} of them with a spread` : ''}`,
            Object.entries(found?.props ?? {}).sort((a, b) => b[1] - a[1]).map(([prop, times]) => `${prop} ${times}`))
    }
    if (options.json) {
        fs.writeFileSync(options.json, `${JSON.stringify({
            library: {name: LIBRARY.name, version: LIBRARY.version, since: options.since ?? null},
            applications, names: rows, foreign, removed, deprecatedProps, words, elements,
        }, null, 2)}\n`)
        console.log(`\nWritten: ${options.json}`)
    }
    return 0
}

try {
    process.exitCode = main()
} catch (error) {
    console.error(error.stderr?.toString().trim() || error.message)
    process.exitCode = 2
}
