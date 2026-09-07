import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {gzipSync} from 'node:zlib'
import {inspectArchive, main, packRelease, publishRelease, validateContext} from '../scripts/release-ci.mjs'
import {readReleaseTag, run} from '../scripts/release-common.mjs'

const COMMIT = 'a'.repeat(40)
const PACKAGE = {
    name: 'pne-ui', version: '4.3.0-rc.55',
    repository: {type: 'git', url: 'git+https://github.com/alcovp/pne-ui.git'},
    main: 'cjs/index.js', module: 'esm/index.js', types: './esm/index.d.ts',
    exports: {'.': {types: './esm/index.d.ts', import: './esm/index.js', require: './cjs/index.js', default: './esm/index.js'}, './package.json': './package.json'},
    scripts: {prepare: 'node -e "process.exit(99)"'},
}

function archiveEntries(manifest = PACKAGE) {
    return [
        {name: 'package/package.json', content: JSON.stringify(manifest)},
        ...['esm/index.js', 'cjs/index.js', 'esm/index.d.ts', 'cjs/index.d.ts'].map(name => ({name: `package/${name}`, content: 'export {}\n'})),
        {name: 'package/docs/releasing.md', content: 'Documentation'},
    ]
}

// A real tar.gz fixture, including checksums and padding, without extracting or running a package.
function makeArchive(entries = archiveEntries()) {
    const blocks = []
    for (const {name, content = '', type = '0', link = '', prefix = ''} of entries) {
        const bytes = Buffer.from(content)
        const header = Buffer.alloc(512)
        header.write(name, 0, 100)
        header.write('0000644\0', 100)
        header.write('0000000\0', 108)
        header.write('0000000\0', 116)
        header.write(`${bytes.length.toString(8).padStart(11, '0')}\0`, 124)
        header.write('00000000000\0', 136)
        header.fill(32, 148, 156)
        header.write(type, 156)
        header.write(link, 157, 100)
        header.write('ustar\0', 257)
        header.write('00', 263)
        header.write(prefix, 345, 155)
        const checksum = header.reduce((sum, byte) => sum + byte, 0)
        header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148)
        blocks.push(header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512))
    }
    return gzipSync(Buffer.concat([...blocks, Buffer.alloc(1024)]))
}

function githubEnv(version = PACKAGE.version, commit = COMMIT) {
    const ref = `refs/tags/npm/v${version}`
    return {
        GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_SERVER_URL: 'https://github.com', RUNNER_ENVIRONMENT: 'github-hosted',
        GITHUB_REPOSITORY: 'alcovp/pne-ui', GITHUB_REF_TYPE: 'tag', GITHUB_REF: ref,
        GITHUB_WORKFLOW_REF: `alcovp/pne-ui/.github/workflows/publish.yml@${ref}`, GITHUB_SHA: commit,
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fixture-oidc-token', ACTIONS_ID_TOKEN_REQUEST_URL: 'https://pipelines.actions.githubusercontent.com/fixture',
    }
}

async function fixture(t, {version = PACKAGE.version, branch = 'feature', failAncestry = false} = {}) {
    const cwd = await mkdtemp(path.join(tmpdir(), 'pne-release-ci-'))
    t.after(() => rm(cwd, {recursive: true, force: true}))
    const pkg = {...PACKAGE, version}
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg))
    const calls = []
    const env = githubEnv(version)
    const channel = version.includes('-rc.') ? 'next' : 'latest'
    const metadata = {version, branch, channel, commit: COMMIT}
    const runImpl = async (command, args, options) => {
        calls.push({command, args, options})
        if (command === 'git') {
            if (args[0] === 'rev-parse') return args[1] === 'HEAD' ? COMMIT : args[1].replace(/\^\{commit\}$/, '')
            if (args[0] === 'branch') return branch
            if (args[0] === 'show') return JSON.stringify(pkg)
            if (args[0] === 'merge-base') {
                if (failAncestry) throw new Error('Not an ancestor of origin/master')
                return ''
            }
        }
        if (command === 'npm' && args[0] === 'pack') {
            const filename = `pne-ui-${version}.tgz`
            await writeFile(path.join(cwd, '.release', filename), makeArchive(archiveEntries(pkg)))
            return JSON.stringify([{filename}])
        }
        if (command === 'npm' && args[0] === 'publish') return ''
        throw new Error(`Unexpected subprocess: ${command} ${args.join(' ')}`)
    }
    const readReleaseTagImpl = async tag => {
        assert.equal(tag, `npm/v${version}`)
        return metadata
    }
    return {cwd, env, runImpl, readReleaseTagImpl, pkg, metadata, calls}
}

function registryData(versions, latest = '4.2.13', next = '4.3.0-rc.54') {
    return {name: 'pne-ui', versions: Object.fromEntries(versions.map(version => [version, {}])), 'dist-tags': {latest, next}}
}

function registrySequence(...responses) {
    const urls = []
    const requests = []
    const fetchImpl = async (url, init) => {
        urls.push(url)
        requests.push({url, init})
        assert.ok(responses.length, `Unexpected request: ${url}`)
        const data = responses.shift()
        if (data instanceof Error) throw data
        if (data.http) return {ok: false, status: data.http}
        const expectedUrl = data.dist ? `https://registry.npmjs.org/pne-ui/${data.version}` : 'https://registry.npmjs.org/pne-ui'
        assert.equal(url, expectedUrl)
        return {ok: true, json: async () => data}
    }
    return {fetchImpl, urls, requests, assertConsumed: () => assert.equal(responses.length, 0)}
}

const beforePublish = () => registryData(['4.2.13', '4.3.0-rc.54'])
const published = manifest => ({name: 'pne-ui', version: manifest.version, dist: {integrity: `sha512-${manifest.sha512}`, shasum: manifest.sha1}})
const afterPublish = manifest => registryData(['4.2.13', '4.3.0-rc.54', manifest.version], '4.2.13', manifest.version)

function verificationClock() {
    let now = 0
    const delays = [], logs = []
    return {
        delays, logs, advance: ms => { now += ms },
        nowImpl: () => now,
        waitImpl: async ms => { delays.push(ms); now += ms },
        logImpl: message => logs.push(message),
    }
}

test('validates the tag event against annotated metadata and the checkout', async t => {
    const f = await fixture(t)
    const result = await validateContext(f)
    assert.equal(result.tag, `npm/v${PACKAGE.version}`)
    assert.deepEqual(result.manifest, f.pkg)
    assert.equal(f.calls.some(call => call.args[0] === 'merge-base'), false)
})

test('rejects wrong repository, workflow, event, ref, event commit and checkout package', async t => {
    const f = await fixture(t)
    for (const change of [
        {GITHUB_ACTIONS: 'false'}, {GITHUB_REPOSITORY: 'attacker/pne-ui'}, {GITHUB_EVENT_NAME: 'workflow_dispatch'},
        {GITHUB_REF: 'refs/heads/master'}, {GITHUB_REF: 'refs/tags/v4.3.0'}, {GITHUB_REF_TYPE: 'branch'},
        {GITHUB_WORKFLOW_REF: 'alcovp/pne-ui/.github/workflows/other.yml@refs/tags/npm/v4.3.0-rc.55'},
        {GITHUB_SHA: 'b'.repeat(40)}, {GITHUB_SHA: '--help'}, {GITHUB_SERVER_URL: 'https://example.com'}, {RUNNER_ENVIRONMENT: 'self-hosted'},
    ]) await assert.rejects(validateContext({...f, env: {...f.env, ...change}}))
    await assert.rejects(validateContext({...f, readReleaseTagImpl: async () => ({...f.metadata, commit: 'b'.repeat(40)})}), /commit do not match/)
    await writeFile(path.join(f.cwd, 'package.json'), JSON.stringify({...f.pkg, scripts: {prepare: 'changed'}}))
    await assert.rejects(validateContext(f), /differs from the checked package/)
})

test('stable requires master metadata and origin/master ancestry', async t => {
    const valid = await fixture(t, {version: '4.3.0', branch: 'master'})
    await validateContext(valid)
    assert.deepEqual(valid.calls.find(call => call.args[0] === 'merge-base').args, ['merge-base', '--is-ancestor', COMMIT, 'origin/master'])
    await assert.rejects(validateContext(await fixture(t, {version: '4.3.0'})), /require master/)
    await assert.rejects(validateContext(await fixture(t, {version: '4.3.0', branch: 'master', failAncestry: true})), /Not an ancestor/)
})

test('the production annotated-tag reader rejects a lightweight tag in a temporary git repository', async t => {
    const f = await fixture(t)
    await run('git', ['init', '-b', 'feature'], {cwd: f.cwd})
    await run('git', ['add', 'package.json'], {cwd: f.cwd})
    await run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Fixture'], {cwd: f.cwd})
    const tag = `npm/v${PACKAGE.version}`
    await run('git', ['-c', 'tag.gpgsign=false', 'tag', tag], {cwd: f.cwd})
    const commit = await run('git', ['rev-parse', 'HEAD'], {cwd: f.cwd})
    await assert.rejects(validateContext({cwd: f.cwd, env: githubEnv(PACKAGE.version, commit), readReleaseTagImpl: readReleaseTag}), /must be annotated/)
    await run('git', ['tag', '-d', tag], {cwd: f.cwd})
    await run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'tag.gpgsign=false', 'tag', '-a', tag, '-m', JSON.stringify({...f.metadata, commit})], {cwd: f.cwd})
    const tagObject = await run('git', ['rev-parse', `refs/tags/${tag}`], {cwd: f.cwd})
    assert.notEqual(tagObject, commit)
    const validated = await validateContext({cwd: f.cwd, env: githubEnv(PACKAGE.version, tagObject)})
    assert.equal(validated.commit, commit)
})

test('reads a valid archive, including PAX long paths and ustar prefixes, without extraction', () => {
    const longPath = `package/docs/${'long'.repeat(30)}.md`
    const record = `path=${longPath}\n`
    let length = Buffer.byteLength(record) + 3
    while (Buffer.byteLength(`${length} ${record}`) !== length) length = Buffer.byteLength(`${length} ${record}`)
    const entries = [...archiveEntries(),
        {name: 'PaxHeader', type: 'x', content: `${length} ${record}`},
        {name: 'short', content: 'Long filename'},
        {name: 'prefixed.md', prefix: 'package/docs', content: 'Prefix'},
    ]
    assert.deepEqual(inspectArchive(makeArchive(entries), PACKAGE), {manifest: PACKAGE, fileCount: 8})
})

test('rejects unsafe, duplicate and unexpected archive paths, links, missing outputs and wrong package metadata', () => {
    for (const entry of [
        {name: '../escape'}, {name: '/absolute'}, {name: 'package/../escape'}, {name: 'package/docs/.secret'},
        {name: 'package/docs/back\\slash'}, {name: 'package/docs/new\nline'}, {name: 'package/scripts/run.mjs'},
        {name: 'package/esm/index.js'}, {name: 'package/esm/link', type: '2', link: '/etc/passwd'},
        {name: 'package/esm/hardlink', type: '1', link: 'package/package.json'},
    ]) assert.throws(() => inspectArchive(makeArchive([...archiveEntries(), entry]), PACKAGE))
    assert.throws(() => inspectArchive(makeArchive(archiveEntries().filter(entry => entry.name !== 'package/cjs/index.d.ts')), PACKAGE), /Missing package entry/)
    assert.throws(() => inspectArchive(makeArchive(archiveEntries({...PACKAGE, name: 'other'})), PACKAGE), /Invalid release package/)
    assert.throws(() => inspectArchive(makeArchive(archiveEntries({...PACKAGE, version: '4.3.0-rc.56'})), PACKAGE), /differs from/)
    assert.throws(() => inspectArchive(makeArchive(archiveEntries({...PACKAGE, exports: {'.': {types: './missing'}}}))), /missing package export/)
    const corrupt = makeArchive()
    corrupt[corrupt.length - 5] ^= 255
    assert.throws(() => inspectArchive(corrupt, PACKAGE))
})

test('local pack needs no tag or registry, ignores scripts and removes only stale release outputs', async t => {
    const f = await fixture(t)
    await mkdir(path.join(f.cwd, '.release'))
    await writeFile(path.join(f.cwd, '.release', 'old.tgz'), 'stale')
    await writeFile(path.join(f.cwd, '.release', 'release.json'), '{}')
    await writeFile(path.join(f.cwd, '.release', 'keep.txt'), 'keep')
    const {manifest, fileCount} = await packRelease({...f, env: {}, readReleaseTagImpl: () => assert.fail('Local pack must not read a tag')})
    assert.equal(manifest.tag, null)
    assert.equal(fileCount, 6)
    assert.equal(manifest.commit, COMMIT)
    assert.deepEqual(f.calls.find(call => call.command === 'npm').args, ['pack', '--json', '--ignore-scripts', '--pack-destination', path.join(f.cwd, '.release')])
    assert.deepEqual((await readdir(path.join(f.cwd, '.release'))).sort(), ['keep.txt', `pne-ui-${PACKAGE.version}.tgz`, 'release.json'])
    assert.deepEqual(JSON.parse(await readFile(path.join(f.cwd, '.release', 'release.json'))), manifest)
    await assert.rejects(publishRelease(f), /metadata does not match/)
})

test('refuses symlink release directories and archives', async t => {
    const f = await fixture(t)
    await mkdir(path.join(f.cwd, 'other'))
    await symlink(path.join(f.cwd, 'other'), path.join(f.cwd, '.release'))
    await assert.rejects(packRelease({...f, env: {}}), /must not be a symlink/)
    await rm(path.join(f.cwd, '.release'))
    await packRelease(f)
    const archive = path.join(f.cwd, '.release', `pne-ui-${PACKAGE.version}.tgz`)
    await rm(archive)
    await symlink(path.join(f.cwd, 'package.json'), archive)
    await assert.rejects(publishRelease(f), /regular file/)
})

test('publishes only the exact verified tarball with explicit registry/access/channel and no scripts', async t => {
    const f = await fixture(t)
    const {manifest} = await packRelease(f)
    const registry = registrySequence(beforePublish(), published(manifest), registryData(['4.2.13', '4.3.0-rc.54', manifest.version], '4.2.13', manifest.version))
    const result = await publishRelease({...f, fetchImpl: registry.fetchImpl})
    assert.deepEqual(result, {status: 'published', version: PACKAGE.version, channel: 'next'})
    const calls = f.calls.filter(call => call.command === 'npm' && call.args[0] === 'publish')
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0].args, ['publish', path.join(f.cwd, '.release', manifest.filename), '--ignore-scripts', '--access', 'public', '--tag', 'next', '--registry', 'https://registry.npmjs.org'])
    assert.equal(calls[0].options.env.NODE_AUTH_TOKEN, '')
    assert.equal(f.calls.some(call => call.args.includes('install') || call.args.includes('whoami')), false)
    registry.assertConsumed()
})

test('stable publishes with latest after ancestry validation', async t => {
    const f = await fixture(t, {version: '4.3.0', branch: 'master'})
    const {manifest} = await packRelease(f)
    const registry = registrySequence(beforePublish(), published(manifest), registryData(['4.2.13', '4.3.0-rc.54', '4.3.0'], '4.3.0'))
    assert.equal((await publishRelease({...f, fetchImpl: registry.fetchImpl})).channel, 'latest')
    assert.equal(f.calls.find(call => call.command === 'npm' && call.args[0] === 'publish').args[6], 'latest')
    registry.assertConsumed()
})

test('missing OIDC, artifact metadata or bytes fail before registry/publication', async t => {
    const f = await fixture(t)
    const {manifest} = await packRelease(f)
    const fetchImpl = () => assert.fail('Must not access the registry')
    for (const key of ['ACTIONS_ID_TOKEN_REQUEST_TOKEN', 'ACTIONS_ID_TOKEN_REQUEST_URL']) {
        await assert.rejects(publishRelease({...f, fetchImpl, env: {...f.env, [key]: ''}}), /OIDC/)
    }
    const file = path.join(f.cwd, '.release', 'release.json')
    for (const changes of [{schema: 2}, {commit: 'b'.repeat(40)}, {tag: null}, {channel: 'latest'}, {filename: '../escape.tgz'}, {branch: 'master'}]) {
        await writeFile(file, JSON.stringify({...manifest, ...changes}))
        await assert.rejects(publishRelease({...f, fetchImpl}), /metadata does not match/)
    }
    await writeFile(file, JSON.stringify({...manifest, sha1: '0'.repeat(40)}))
    await assert.rejects(publishRelease({...f, fetchImpl}), /digest mismatch/)
    await writeFile(file, JSON.stringify(manifest))
    await writeFile(path.join(f.cwd, '.release', manifest.filename), makeArchive([...archiveEntries(), {name: 'package/docs/changed.md', content: 'Changed'}]))
    await assert.rejects(publishRelease({...f, fetchImpl}), /digest mismatch/)
    assert.equal(f.calls.some(call => call.args[0] === 'publish'), false)
})

test('idempotent rerun skips only identical bytes at the current channel target', async t => {
    const f = await fixture(t)
    const {manifest} = await packRelease(f)
    const snapshot = registryData(['4.2.13', '4.3.0-rc.54', manifest.version], '4.2.13', manifest.version)
    const registry = registrySequence(snapshot, published(manifest))
    assert.equal((await publishRelease({...f, fetchImpl: registry.fetchImpl})).status, 'already-published')
    registry.assertConsumed()
    assert.equal(f.calls.some(call => call.args[0] === 'publish'), false)
    for (const response of [
        {...published(manifest), dist: {...published(manifest).dist, integrity: 'sha512-other'}},
        {...published(manifest), dist: {...published(manifest).dist, shasum: 'other'}},
    ]) await assert.rejects(publishRelease({...f, fetchImpl: registrySequence(snapshot, response).fetchImpl}), /different archive integrity/)
    await assert.rejects(publishRelease({...f, fetchImpl: registrySequence({...snapshot, 'dist-tags': {latest: '4.2.13', next: '4.3.0-rc.54'}}, published(manifest)).fetchImpl}), /refusing a rollback/)
})

test('refuses stale new versions and even an identical version if a newer same-channel release exists', async t => {
    const f = await fixture(t)
    const {manifest} = await packRelease(f)
    const newer = '4.3.0-rc.56'
    const snapshot = registryData(['4.2.13', '4.3.0-rc.54', newer], '4.2.13', newer)
    await assert.rejects(publishRelease({...f, fetchImpl: registrySequence(snapshot).fetchImpl}), /would regress/)
    await assert.rejects(publishRelease({...f, fetchImpl: registrySequence(registryData([...Object.keys(snapshot.versions), manifest.version], '4.2.13', manifest.version), published(manifest)).fetchImpl}), /would regress/)
    await assert.rejects(publishRelease({...f, fetchImpl: registrySequence(registryData(['4.3.0', '4.3.0-rc.54'], '4.3.0')).fetchImpl}), /would regress/)
    assert.equal(f.calls.some(call => call.args[0] === 'publish'), false)
})

test('registry outages fail closed and do not publish', async t => {
    const f = await fixture(t)
    await packRelease(f)
    for (const response of [{http: 503}, new Error('Network failure')]) {
        await assert.rejects(publishRelease({...f, fetchImpl: registrySequence(response).fetchImpl}))
    }
    assert.equal(f.calls.some(call => call.args[0] === 'publish'), false)
})

test('post-publication integrity, newer channel and RC latest failures are immediate and never republish', async t => {
    for (const scenario of ['digest', 'name', 'sha1', 'channel', 'latest', 'latest-and-stale-next', 'unauthorized']) {
        const f = await fixture(t)
        const {manifest} = await packRelease(f)
        const clock = verificationClock()
        let responses = [beforePublish(), published(manifest)]
        if (scenario === 'digest') responses[1] = {...published(manifest), dist: {integrity: 'wrong'}}
        else if (scenario === 'name') responses[1].name = 'different-package'
        else if (scenario === 'sha1') responses[1].dist.shasum = 'wrong'
        else if (scenario === 'unauthorized') responses[1] = {http: 403}
        else responses.push(registryData(['4.2.13', '4.2.14', '4.3.0-rc.54', manifest.version, '4.3.0-rc.56'],
            scenario.startsWith('latest') ? '4.2.14' : '4.2.13',
            scenario === 'channel' ? '4.3.0-rc.56' : scenario === 'latest-and-stale-next' ? '4.3.0-rc.54' : manifest.version))
        const registry = registrySequence(...responses)
        await assert.rejects(publishRelease({...f, ...clock, fetchImpl: registry.fetchImpl}),
            ['digest', 'name', 'sha1'].includes(scenario) ? /different archive integrity/
                : scenario === 'channel' ? /expected channel/ : scenario === 'unauthorized' ? /HTTP 403/ : /latest changed/)
        registry.assertConsumed()
        assert.deepEqual(clock.delays, [])
        assert.equal(f.calls.filter(call => call.args[0] === 'publish').length, 1)
    }
})

test('waits for stale channel reads to converge after publishing exactly once', async t => {
    const f = await fixture(t)
    const {manifest} = await packRelease(f)
    const clock = verificationClock()
    const registry = registrySequence(beforePublish(), published(manifest), beforePublish(),
        published(manifest), registryData(['4.2.13', '4.3.0-rc.53'], '4.2.13', '4.3.0-rc.53'),
        published(manifest), afterPublish(manifest))
    assert.equal((await publishRelease({...f, ...clock, fetchImpl: registry.fetchImpl})).status, 'published')
    assert.deepEqual(clock.delays, [1000, 2000])
    assert.equal(clock.logs.length, 2)
    assert.match(clock.logs[0], /retrying registry verification.*next=4.3.0-rc.54/)
    assert.equal(f.calls.filter(call => call.args[0] === 'publish').length, 1)
    assert.equal(registry.requests[0].init.cache, undefined)
    for (const request of registry.requests.slice(1)) {
        assert.equal(request.init.cache, 'no-store')
        assert.equal(request.init.headers['cache-control'], 'no-cache')
        assert.ok(request.init.signal instanceof AbortSignal)
    }
    registry.assertConsumed()
})

test('retries temporary metadata visibility and transport errors after a successful publish only', async t => {
    for (const failure of [{http: 404}, {http: 429}, {http: 503}, new TypeError('fetch failed'),
        Object.assign(new Error('Timed out'), {name: 'TimeoutError'})]) {
        const f = await fixture(t)
        const {manifest} = await packRelease(f)
        const clock = verificationClock()
        const registry = registrySequence(beforePublish(), failure, published(manifest), afterPublish(manifest))
        assert.equal((await publishRelease({...f, ...clock, fetchImpl: registry.fetchImpl})).status, 'published')
        assert.deepEqual(clock.delays, [1000])
        assert.equal(f.calls.filter(call => call.args[0] === 'publish').length, 1)
        registry.assertConsumed()
    }
    const f = await fixture(t)
    const {manifest} = await packRelease(f)
    const clock = verificationClock()
    const registry = registrySequence(beforePublish(), published(manifest), {http: 503}, published(manifest), afterPublish(manifest))
    assert.equal((await publishRelease({...f, ...clock, fetchImpl: registry.fetchImpl})).status, 'published')
    assert.deepEqual(clock.delays, [1000])
    registry.assertConsumed()
})

test('stops stale registry verification after seven attempts without republishing', async t => {
    const f = await fixture(t)
    const {manifest} = await packRelease(f)
    const clock = verificationClock()
    const responses = Array.from({length: 7}, () => [published(manifest), beforePublish()]).flat()
    const registry = registrySequence(beforePublish(), ...responses)
    await assert.rejects(publishRelease({...f, ...clock, fetchImpl: registry.fetchImpl}), /did not converge within 7 attempts \/ 60s/)
    assert.deepEqual(clock.delays, [1000, 2000, 4000, 8000, 10000, 10000])
    assert.equal(clock.logs.length, 6)
    assert.equal(f.calls.filter(call => call.args[0] === 'publish').length, 1)
    registry.assertConsumed()
})

test('the elapsed verification budget prevents another request after a slow response', async t => {
    const f = await fixture(t)
    await packRelease(f)
    const clock = verificationClock()
    const registry = registrySequence(beforePublish(), {http: 503})
    const fetchImpl = async (url, init) => {
        const response = await registry.fetchImpl(url, init)
        if (registry.urls.length === 2) clock.advance(59_500)
        return response
    }
    await assert.rejects(publishRelease({...f, ...clock, fetchImpl}), /did not converge/)
    assert.deepEqual(clock.delays, [500])
    assert.equal(clock.nowImpl(), 60_000)
    assert.equal(registry.urls.length, 2)
    assert.equal(f.calls.filter(call => call.args[0] === 'publish').length, 1)
    registry.assertConsumed()
})

test('a failed npm publish is never retried or followed by verification reads', async t => {
    const f = await fixture(t)
    await packRelease(f)
    const clock = verificationClock()
    const registry = registrySequence(beforePublish())
    const runImpl = async (...args) => {
        const result = await f.runImpl(...args)
        if (args[0] === 'npm' && args[1][0] === 'publish') throw new Error('npm publish rejected')
        return result
    }
    await assert.rejects(publishRelease({...f, ...clock, runImpl, fetchImpl: registry.fetchImpl}), /npm publish rejected/)
    assert.deepEqual(clock.delays, [])
    assert.equal(f.calls.filter(call => call.args[0] === 'publish').length, 1)
    registry.assertConsumed()
})

test('CLI accepts only a single explicit operation and prints a compact validation result', async t => {
    const f = await fixture(t)
    const lines = []
    await main(['validate'], {...f, print: text => lines.push(text)})
    assert.equal(JSON.parse(lines[0]).tag, `npm/v${PACKAGE.version}`)
    assert.equal(Object.hasOwn(JSON.parse(lines[0]), 'manifest'), false)
    for (const args of [[], ['publish', '--force'], ['install'], ['pack', '.']]) await assert.rejects(main(args, f), /Usage/)
})
