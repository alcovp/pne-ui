import {createHash} from 'node:crypto'
import {lstat, mkdir, readFile, readdir, unlink, writeFile} from 'node:fs/promises'
import {isDeepStrictEqual} from 'node:util'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {gunzipSync} from 'node:zlib'
import {
    RELEASE_CONFIG, channelForVersion, compareVersions, ensureFreshVersion, readReleaseTag,
    registrySnapshot, run, versionFromTag,
} from './release-common.mjs'

const REGISTRY = 'https://registry.npmjs.org'
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
const PUBLICATION_VERIFY_BUDGET_MS = 60_000
const PUBLICATION_VERIFY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 10_000, 10_000]
const digest = (bytes, algorithm, encoding) => createHash(algorithm).update(bytes).digest(encoding)
const packageFilename = version => `${RELEASE_CONFIG.packageName}-${version}.tgz`

async function readRegularFile(filename) {
    const stat = await lstat(filename)
    if (!stat.isFile() || stat.size > MAX_ARCHIVE_BYTES) throw new Error(`Expected a bounded regular file: ${filename}`)
    return readFile(filename)
}

function verifyPackage(manifest, expected) {
    if (manifest.name !== RELEASE_CONFIG.packageName || manifest.private === true
        || manifest.repository?.type !== 'git'
        || manifest.repository?.url !== `git+https://github.com/${RELEASE_CONFIG.repository}.git`
        || manifest.main !== 'cjs/index.js' || manifest.module !== 'esm/index.js'
        || manifest.types !== './esm/index.d.ts') throw new Error('Invalid release package metadata or entry points')
    channelForVersion(manifest.version)
    if (expected && !isDeepStrictEqual(manifest, expected)) throw new Error('Archive package.json differs from the checked package')
}

/** Check the event, annotated tag and checkout before any privileged operation. */
export async function validateContext({cwd = process.cwd(), env = process.env, runImpl = run, readReleaseTagImpl = readReleaseTag} = {}) {
    const ref = env.GITHUB_REF
    if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'push' || env.RUNNER_ENVIRONMENT !== 'github-hosted'
        || env.GITHUB_SERVER_URL !== 'https://github.com' || env.GITHUB_REPOSITORY !== RELEASE_CONFIG.repository
        || env.GITHUB_REF_TYPE !== 'tag' || typeof ref !== 'string' || !ref.startsWith('refs/tags/')) {
        throw new Error('Publication requires the canonical GitHub tag-push context')
    }
    const tag = ref.slice('refs/tags/'.length)
    const version = versionFromTag(tag)
    if (env.GITHUB_WORKFLOW_REF !== `${RELEASE_CONFIG.repository}/.github/workflows/${RELEASE_CONFIG.workflow}@${ref}`) {
        throw new Error('Unexpected GitHub workflow ref')
    }
    const metadata = await readReleaseTagImpl(tag, {cwd})
    const commit = await runImpl('git', ['rev-parse', 'HEAD'], {cwd})
    if (!/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(env.GITHUB_SHA ?? '')) throw new Error('Invalid GitHub event SHA')
    const eventCommit = await runImpl('git', ['rev-parse', `${env.GITHUB_SHA}^{commit}`], {cwd})
    if (metadata.commit !== commit || eventCommit !== commit || metadata.version !== version
        || metadata.channel !== channelForVersion(version)) throw new Error('Tag, event and checkout commit do not match')
    if (metadata.channel === 'latest') {
        if (metadata.branch !== RELEASE_CONFIG.stableBranch) throw new Error('Stable releases require master')
        await runImpl('git', ['merge-base', '--is-ancestor', commit, `${RELEASE_CONFIG.remote}/${RELEASE_CONFIG.stableBranch}`], {cwd})
    }
    const manifest = JSON.parse(await readRegularFile(path.join(cwd, 'package.json')))
    const committed = JSON.parse(await runImpl('git', ['show', `${commit}:package.json`], {cwd}))
    verifyPackage(manifest, committed)
    if (manifest.version !== version) throw new Error('Checkout version does not match release tag')
    return {tag, ...metadata, manifest}
}

function tarNumber(field) {
    const text = field.toString('ascii').replace(/\0.*$/, '').trim()
    if (!/^[0-7]+$/.test(text)) throw new Error('Invalid tar numeric field')
    const number = Number.parseInt(text, 8)
    if (!Number.isSafeInteger(number)) throw new Error('Tar size is too large')
    return number
}

function tarText(field) {
    return field.toString('utf8').replace(/\0.*$/, '')
}

function paxFields(bytes) {
    const fields = Object.create(null)
    let offset = 0
    while (offset < bytes.length) {
        const space = bytes.indexOf(32, offset)
        const lengthText = bytes.subarray(offset, space).toString('ascii')
        if (space < offset || !/^[1-9]\d*$/.test(lengthText)) throw new Error('Invalid PAX record')
        const length = Number(lengthText)
        const end = offset + length
        if (!Number.isSafeInteger(end) || end > bytes.length || end <= space + 2 || bytes[end - 1] !== 10) throw new Error('Invalid PAX record length')
        const record = bytes.subarray(space + 1, end - 1).toString('utf8')
        const equals = record.indexOf('=')
        if (equals <= 0 || Object.hasOwn(fields, record.slice(0, equals))) throw new Error('Invalid PAX field')
        fields[record.slice(0, equals)] = record.slice(equals + 1)
        offset = end
    }
    return fields
}

/** Read a bounded tar.gz in memory. Never extract it or follow archive links. */
export function inspectArchive(bytes, expectedPackage) {
    if (!Buffer.isBuffer(bytes) || bytes.length > MAX_ARCHIVE_BYTES) throw new Error('Archive is too large')
    const tar = gunzipSync(bytes, {maxOutputLength: MAX_ARCHIVE_BYTES})
    const files = new Map()
    const seen = new Set()
    let offset = 0, pax = null, ended = false
    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512)
        if (header.every(byte => byte === 0)) {
            if (pax || tar.length - offset < 1024 || !tar.subarray(offset).every(byte => byte === 0)) throw new Error('Invalid tar end marker')
            ended = true
            break
        }
        const checksum = header.reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0)
        if (tarNumber(header.subarray(148, 156)) !== checksum) throw new Error('Tar header checksum mismatch')
        const size = tarNumber(header.subarray(124, 136))
        const start = offset + 512
        offset = start + Math.ceil(size / 512) * 512
        if (offset > tar.length) throw new Error('Truncated tar entry')
        const content = tar.subarray(start, start + size)
        const type = String.fromCharCode(header[156])
        if (type === 'x') {
            if (pax) throw new Error('Unexpected repeated PAX header')
            pax = paxFields(content)
            continue
        }
        if (!['0', '\0', '5'].includes(type) || tarText(header.subarray(157, 257)) || pax?.linkpath !== undefined) {
            throw new Error('Archive links and special entries are forbidden')
        }
        if (pax?.size !== undefined && pax.size !== String(size)) throw new Error('Conflicting PAX size')
        const prefix = tarText(header.subarray(345, 500))
        let name = pax?.path ?? `${prefix ? `${prefix}/` : ''}${tarText(header.subarray(0, 100))}`
        pax = null
        if (type === '5') name = name.replace(/\/$/, '')
        if (name !== 'package' && (!name.startsWith('package/') || /[\\\0\r\n\uFFFD]/u.test(name)
            || name.split('/').some(part => !part || part.startsWith('.')))) throw new Error('Unsafe archive path')
        if (seen.has(name) || seen.size >= 10_000) throw new Error('Duplicate path or too many archive entries')
        seen.add(name)
        if (type === '5') {
            if (size !== 0) throw new Error('Invalid archive directory')
            continue
        }
        if (!/^package\/(?:package\.json|README\.md|LICENSE|(?:cjs|esm|docs)\/.+)$/.test(name)) throw new Error(`Unexpected archive file: ${name}`)
        files.set(name, content)
    }
    if (!ended) throw new Error('Missing tar end marker')
    for (const file of ['package.json', 'esm/index.js', 'esm/index.d.ts', 'cjs/index.js', 'cjs/index.d.ts']) {
        if (!files.get(`package/${file}`)?.length) throw new Error(`Missing package entry: ${file}`)
    }
    const manifest = JSON.parse(files.get('package/package.json').toString('utf8'))
    verifyPackage(manifest, expectedPackage)
    for (const entry of ['types', 'import', 'require', 'default']) {
        const target = manifest.exports?.['.']?.[entry]
        if (typeof target !== 'string' || !target.startsWith('./') || !files.has(`package/${target.slice(2)}`)) {
            throw new Error(`Invalid or missing package export: ${entry}`)
        }
    }
    if (manifest.exports['./package.json'] !== './package.json') throw new Error('Missing package.json export')
    return {manifest, fileCount: files.size}
}

async function releaseDirectory(cwd, {create = false} = {}) {
    const directory = path.join(cwd, '.release')
    if (create) await mkdir(directory, {recursive: true})
    if (!(await lstat(directory)).isDirectory()) throw new Error('Release directory must not be a symlink')
    return directory
}

/** Local checks can pack uncommitted work, but their tag:null manifest cannot be published. */
export async function packRelease(options = {}) {
    const {cwd = process.cwd(), env = process.env, runImpl = run} = options
    let context
    if (env.GITHUB_ACTIONS === 'true') {
        context = await validateContext(options)
    } else {
        const manifest = JSON.parse(await readRegularFile(path.join(cwd, 'package.json')))
        verifyPackage(manifest)
        context = {
            tag: null, version: manifest.version, channel: channelForVersion(manifest.version), manifest,
            branch: await runImpl('git', ['branch', '--show-current'], {cwd}),
            commit: await runImpl('git', ['rev-parse', 'HEAD'], {cwd}),
        }
    }
    const directory = await releaseDirectory(cwd, {create: true})
    for (const name of await readdir(directory)) {
        if (name.endsWith('.tgz') || name === 'release.json') await unlink(path.join(directory, name))
    }
    const output = JSON.parse(await runImpl('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory], {cwd, timeout: 120_000}))
    const filename = packageFilename(context.version)
    if (!Array.isArray(output) || output.length !== 1 || output[0].filename !== filename) throw new Error('Unexpected npm pack output')
    const bytes = await readRegularFile(path.join(directory, filename))
    const {fileCount} = inspectArchive(bytes, context.manifest)
    const manifest = {
        schema: 1, name: RELEASE_CONFIG.packageName, repository: RELEASE_CONFIG.repository,
        version: context.version, tag: context.tag, branch: context.branch, commit: context.commit,
        channel: context.channel, filename,
        sha1: digest(bytes, 'sha1', 'hex'), sha512: digest(bytes, 'sha512', 'base64'),
    }
    await writeFile(path.join(directory, 'release.json'), `${JSON.stringify(manifest, null, 2)}\n`, {flag: 'wx'})
    return {manifest, fileCount}
}

async function publishedDigest(version, manifest, fetchImpl) {
    const response = await fetchImpl(`${REGISTRY}/${RELEASE_CONFIG.packageName}/${encodeURIComponent(version)}`, {
        headers: {accept: 'application/json'}, signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`Cannot verify published archive: HTTP ${response.status}`)
    const published = await response.json()
    if (published.name !== manifest.name || published.version !== version
        || published.dist?.integrity !== `sha512-${manifest.sha512}` || published.dist?.shasum !== manifest.sha1) {
        throw new Error('Published version has different archive integrity')
    }
}

class RegistryVisibilityError extends Error {}

/** Registry reads may lag a successful publish. Retry reads only, with a hard time/attempt bound. */
async function verifyPublication(manifest, before, {
    fetchImpl, waitImpl = ms => new Promise(resolve => setTimeout(resolve, ms)),
    nowImpl = Date.now, logImpl = console.error,
}) {
    const deadline = nowImpl() + PUBLICATION_VERIFY_BUDGET_MS
    const read = async (url, init) => {
        const remaining = deadline - nowImpl()
        if (remaining <= 0) throw new RegistryVisibilityError('Registry verification time budget exhausted')
        const transport = async operation => {
            try { return await operation() } catch (error) {
                if (error instanceof TypeError || ['AbortError', 'TimeoutError'].includes(error.name)) {
                    throw new RegistryVisibilityError(`Temporary registry read failure: ${error.message}`, {cause: error})
                }
                throw error
            }
        }
        const response = await transport(() => fetchImpl(url, {
            ...init, cache: 'no-store', headers: {...init.headers, 'cache-control': 'no-cache'},
            signal: AbortSignal.any([init.signal, AbortSignal.timeout(remaining)]),
        }))
        if ([404, 429].includes(response.status) || response.status >= 500) {
            throw new RegistryVisibilityError(`Registry metadata is temporarily unavailable: HTTP ${response.status}`)
        }
        return {ok: response.ok, status: response.status, json: () => transport(() => response.json())}
    }
    for (let attempt = 0; ; attempt++) {
        try {
            await publishedDigest(manifest.version, manifest, read)
            const after = await registrySnapshot({fetchImpl: read})
            if (manifest.channel === 'next' && after.distTags.latest !== before.distTags.latest) {
                throw new Error('npm latest changed during RC publication')
            }
            if (after.distTags[manifest.channel] === manifest.version) return
            const observed = after.distTags[manifest.channel]
            if (observed !== undefined && compareVersions(observed, manifest.version) > 0) {
                throw new Error(`Published version is not the expected channel target: ${manifest.channel} now points to ${observed}`)
            }
            throw new RegistryVisibilityError(`Published version is not the expected channel target yet: ${manifest.channel}=${observed ?? 'missing'}`)
        } catch (error) {
            if (!(error instanceof RegistryVisibilityError)) throw error
            const remaining = deadline - nowImpl()
            if (attempt >= PUBLICATION_VERIFY_DELAYS_MS.length || remaining <= 0) {
                throw new Error(`npm publish completed, but registry verification did not converge within 7 attempts / 60s: ${error.message}`, {cause: error})
            }
            const delay = Math.min(PUBLICATION_VERIFY_DELAYS_MS[attempt], remaining)
            logImpl(`npm publish completed; retrying registry verification in ${delay}ms (${attempt + 1}/6): ${error.message}`)
            await waitImpl(delay)
        }
    }
}

/** Publish only a checked artifact from this exact tag, using the runner OIDC credentials. */
export async function publishRelease(options = {}) {
    const {cwd = process.cwd(), env = process.env, runImpl = run, fetchImpl = fetch} = options
    const context = await validateContext(options)
    if (!env.ACTIONS_ID_TOKEN_REQUEST_TOKEN || !env.ACTIONS_ID_TOKEN_REQUEST_URL?.startsWith('https://')) {
        throw new Error('GitHub OIDC credentials are required')
    }
    const directory = await releaseDirectory(cwd)
    const manifest = JSON.parse(await readRegularFile(path.join(directory, 'release.json')))
    if (manifest.schema !== 1 || manifest.name !== RELEASE_CONFIG.packageName || manifest.repository !== RELEASE_CONFIG.repository
        || manifest.filename !== packageFilename(context.version)
        || ['tag', 'version', 'branch', 'commit', 'channel'].some(key => manifest[key] !== context[key])) {
        throw new Error('Release artifact metadata does not match the checked-out tag')
    }
    const archivePath = path.join(directory, manifest.filename)
    const bytes = await readRegularFile(archivePath)
    if (manifest.sha1 !== digest(bytes, 'sha1', 'hex') || manifest.sha512 !== digest(bytes, 'sha512', 'base64')) {
        throw new Error('Release archive digest mismatch')
    }
    inspectArchive(bytes, context.manifest)
    const before = await registrySnapshot({fetchImpl})
    const existing = before.versions.includes(manifest.version)
    if (existing) {
        await publishedDigest(manifest.version, manifest, fetchImpl)
        if (before.distTags[manifest.channel] !== manifest.version) throw new Error('Existing version is no longer the channel target; refusing a rollback')
        const distTags = {...before.distTags}
        delete distTags[manifest.channel]
        ensureFreshVersion(manifest.version, {versions: before.versions.filter(version => version !== manifest.version), distTags})
        return {status: 'already-published', version: manifest.version, channel: manifest.channel}
    }
    ensureFreshVersion(manifest.version, before)
    await runImpl('npm', ['publish', archivePath, '--ignore-scripts', '--access', 'public', '--tag', manifest.channel, '--registry', REGISTRY], {
        cwd, timeout: 120_000,
        // An OIDC failure must not silently fall back to a developer's publishing token.
        env: {NODE_AUTH_TOKEN: '', NPM_TOKEN: '', NPM_CONFIG_USERCONFIG: '/dev/null', npm_config_userconfig: '/dev/null'},
    })
    await verifyPublication(manifest, before, {...options, fetchImpl})
    return {status: 'published', version: manifest.version, channel: manifest.channel}
}

export async function main(argv = process.argv.slice(2), options = {}) {
    if (argv.length !== 1 || !['validate', 'pack', 'publish'].includes(argv[0])) throw new Error('Usage: release-ci.mjs validate|pack|publish')
    const result = await ({validate: validateContext, pack: packRelease, publish: publishRelease})[argv[0]](options)
    const {manifest, ...summary} = result
    ;(options.print ?? console.log)(JSON.stringify(argv[0] === 'validate' ? summary : result, null, 2))
    return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
