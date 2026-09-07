import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp, readFile, writeFile, chmod, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {main, bumpVersion} from '../scripts/release.mjs'
import {parseVersion, compareVersions, channelForVersion, tagForVersion, versionFromTag, readReleaseTag, run} from '../scripts/release-common.mjs'

const registry = (versions = ['1.2.2'], distTags = {latest: '1.2.2'}) => async () => ({
    ok: true, json: async () => ({name: 'pne-ui', versions: Object.fromEntries(versions.map(version => [version, {}])), 'dist-tags': distTags}),
})

async function fixture(t, version = '1.2.3-rc.0') {
    const root = await mkdtemp(path.join(tmpdir(), 'pne-release-test-'))
    t.after(() => rm(root, {recursive: true, force: true}))
    const cwd = path.join(root, 'repo'), remote = path.join(root, 'remote.git')
    await run('git', ['init', '-b', 'master', cwd])
    const git = args => run('git', args, {cwd})
    await git(['config', 'user.email', 'test@example.invalid'])
    await git(['config', 'user.name', 'Release test'])
    await git(['config', 'commit.gpgSign', 'false'])
    await git(['config', 'tag.gpgSign', 'false'])
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify({name: 'pne-ui', version, scripts: {prepare: 'exit 99'}}, null, 2) + '\n')
    await git(['add', 'package.json'])
    await git(['commit', '-m', 'Initial'])
    await run('git', ['init', '--bare', remote])
    await git(['remote', 'add', 'origin', remote])
    await git(['push', 'origin', 'refs/heads/master:refs/heads/master'])
    const invoke = (args, extras = {}) => main(args, {cwd, fixtureRemote: remote, fetchImpl: registry(), print: () => {}, ...extras})
    const refs = () => run('git', ['show-ref'], {cwd: remote})
    return {cwd, remote, git, invoke, refs}
}

test('strict release versions and npm-style bump/channel boundaries', () => {
    assert.deepEqual(parseVersion('1.2.3-rc.4'), {major: 1, minor: 2, patch: 3, rc: 4})
    for (const invalid of ['v1.2.3', '01.2.3', '1.2', '1.2.3-beta.1', '1.2.3+build', '1.2.3-rc.01', '9007199254740992.0.0']) {
        assert.throws(() => parseVersion(invalid))
    }
    assert.equal(compareVersions('1.2.3', '1.2.3-rc.100'), 1)
    assert.equal(compareVersions('1.2.3-rc.9', '1.2.3-rc.10'), -1)
    assert.equal(channelForVersion('1.2.3'), 'latest')
    assert.equal(versionFromTag(tagForVersion('1.2.3-rc.0')), '1.2.3-rc.0')
    assert.throws(() => versionFromTag('v1.2.3'))
    for (const [version, channel, bump, expected] of [
        ['1.2.3-rc.4', 'next', 'prerelease', '1.2.3-rc.5'], ['1.2.3', 'next', 'prerelease', '1.2.4-rc.0'],
        ['1.2.3-rc.4', 'next', 'patch', '1.2.4-rc.0'], ['1.2.3', 'next', 'minor', '1.3.0-rc.0'],
        ['1.2.3', 'next', 'major', '2.0.0-rc.0'], ['1.2.3-rc.4', 'latest', 'patch', '1.2.3'],
        ['1.2.0-rc.4', 'latest', 'minor', '1.2.0'], ['2.0.0-rc.4', 'latest', 'major', '2.0.0'],
        ['1.2.3', 'latest', 'patch', '1.2.4'],
    ]) assert.equal(bumpVersion(version, channel, bump), expected)
    assert.throws(() => bumpVersion('1.2.3', 'latest', 'prerelease'))
})

test('prepare commits only the version and annotates locally, without registry or remote writes', async t => {
    const f = await fixture(t), before = await f.refs()
    const result = await f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease'], {fetchImpl: () => { throw new Error('Unexpected network') }})
    assert.equal(result.version, '1.2.3-rc.1')
    assert.equal(await f.git(['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD']), 'package.json')
    assert.equal(await f.git(['status', '--porcelain']), '')
    assert.deepEqual(await readReleaseTag(result.tag, {cwd: f.cwd}), {version: result.version, channel: 'next', branch: 'master', commit: result.commit})
    assert.equal(await f.refs(), before)
})

test('current version tags HEAD without an empty commit; duplicate tag is rejected', async t => {
    const f = await fixture(t), head = await f.git(['rev-parse', 'HEAD'])
    await f.invoke(['prepare', '--channel', 'next', '--version', 'current'])
    assert.equal(await f.git(['rev-parse', 'HEAD']), head)
    await assert.rejects(f.invoke(['prepare', '--channel', 'next', '--version', 'current']), /Tag already exists/)
})

test('prepare dry run leaves every local and remote ref and package unchanged', async t => {
    const f = await fixture(t), refs = await f.git(['show-ref']), remote = await f.refs()
    const before = await readFile(path.join(f.cwd, 'package.json'), 'utf8')
    await f.invoke(['prepare', '--channel', 'next', '--bump', 'minor', '--dry-run'])
    assert.equal(await f.git(['show-ref']), refs)
    assert.equal(await f.refs(), remote)
    assert.equal(await readFile(path.join(f.cwd, 'package.json'), 'utf8'), before)
})

test('invalid flags, channels, old versions, dirty trees and detached HEAD fail before mutation', async t => {
    const f = await fixture(t), refs = await f.git(['show-ref'])
    for (const args of [
        ['prepare', '--channel', 'next'], ['prepare', '--channel', 'next', '--bump', 'patch', '--version', 'current'],
        ['prepare', '--channel', 'next', '--version', '1.2.2-rc.1'], ['prepare', '--channel', 'next', '--version', '1.2.4'],
        ['prepare', '--channel', 'next', '--bump', 'banana'], ['prepare', '--channel', 'next', '--channel', 'next'],
        ['prepare', '--channel'], ['send', '--all'], ['send', '--tag'], ['status', '--dry-run'],
    ]) await assert.rejects(f.invoke(args))
    await writeFile(path.join(f.cwd, 'untracked.txt'), 'user data')
    await assert.rejects(f.invoke(['prepare', '--channel', 'next', '--version', 'current']), /clean/)
    await rm(path.join(f.cwd, 'untracked.txt'))
    await writeFile(path.join(f.cwd, 'package.json'), (await readFile(path.join(f.cwd, 'package.json'), 'utf8')) + ' ')
    await assert.rejects(f.invoke(['prepare', '--channel', 'next', '--version', 'current']), /clean/)
    await f.git(['restore', 'package.json'])
    await f.git(['checkout', '--detach'])
    await assert.rejects(f.invoke(['prepare', '--channel', 'next', '--version', 'current']), /attached/)
    assert.equal(await f.git(['show-ref']), refs)
})

test('stable channel is master-only and stable alias promotes an RC', async t => {
    const f = await fixture(t)
    await f.git(['checkout', '-b', 'feature'])
    await assert.rejects(f.invoke(['prepare', '--channel', 'latest', '--bump', 'patch']), /master/)
    await f.git(['checkout', 'master'])
    const result = await f.invoke(['prepare', '--channel', 'stable', '--bump', 'patch'])
    assert.equal(result.version, '1.2.3')
    assert.equal(result.channel, 'latest')
})

test('failed commit restores only package and keeps pre-commit controls active', async t => {
    const f = await fixture(t), head = await f.git(['rev-parse', 'HEAD'])
    const hook = path.join(f.cwd, '.git/hooks/pre-commit')
    await writeFile(hook, '#!/bin/sh\nprintf preserved > hook-note.txt\nexit 1\n')
    await chmod(hook, 0o755)
    await assert.rejects(f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease']), /failed/)
    assert.equal(await f.git(['rev-parse', 'HEAD']), head)
    assert.equal(await f.git(['diff', 'HEAD', '--', 'package.json']), '')
    assert.equal(await readFile(path.join(f.cwd, 'hook-note.txt'), 'utf8'), 'preserved')
    assert.equal(await f.git(['tag']), '')
})

test('post-commit mutations are preserved for inspection and never tagged', async t => {
    const f = await fixture(t), head = await f.git(['rev-parse', 'HEAD'])
    const hook = path.join(f.cwd, '.git/hooks/post-commit')
    await writeFile(hook, '#!/bin/sh\nprintf preserved > hook-note.txt\n')
    await chmod(hook, 0o755)
    await assert.rejects(f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease']), /inspect it manually/)
    assert.notEqual(await f.git(['rev-parse', 'HEAD']), head)
    assert.equal(await readFile(path.join(f.cwd, 'hook-note.txt'), 'utf8'), 'preserved')
    assert.equal(await f.git(['tag']), '')
})

test('send dry run validates but never invokes push; actual local fixture push sends exactly two refs', async t => {
    const f = await fixture(t)
    const release = await f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease'])
    await f.git(['tag', '-a', 'unrelated-tag', '-m', 'must not be pushed'])
    await f.git(['config', 'push.followTags', 'true'])
    const hook = path.join(f.cwd, '.git/hooks/pre-push')
    await writeFile(hook, '#!/bin/sh\nexit 1\n')
    await chmod(hook, 0o755)
    const before = await f.refs()
    await f.invoke(['send', '--dry-run'])
    assert.equal(await f.refs(), before)
    await assert.rejects(f.invoke(['send']), /failed/)
    assert.equal(await f.refs(), before)
    await rm(hook)
    await f.invoke(['send', '--tag', release.tag])
    const refs = await f.refs()
    assert.match(refs, /refs\/tags\/npm\/v1\.2\.3-rc\.1/)
    assert.doesNotMatch(refs, /unrelated-tag/)
    assert.match(refs, new RegExp(`${release.commit} refs/heads/master`))
    await assert.rejects(f.invoke(['send']), /already remote/)
})

test('send fails closed on published/stale versions and unavailable or malformed registry', async t => {
    const f = await fixture(t)
    await f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease'])
    const before = await f.refs()
    for (const fetchImpl of [
        registry(['1.2.2', '1.2.3-rc.1']), registry(['1.2.2', '1.2.3-rc.2']), registry(['1.2.4'], {latest: '1.2.4'}),
        async () => { throw new Error('offline') }, async () => ({ok: false, status: 503}),
        async () => ({ok: true, json: async () => ({})}),
        registry([], {}), registry(['1.2.2'], {latest: '9.9.9'}),
    ]) await assert.rejects(f.invoke(['send'], {fetchImpl}))
    assert.equal(await f.refs(), before)
})

test('atomic send cannot advance the branch if remote rejects the release tag', async t => {
    const f = await fixture(t)
    await f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease'])
    const hook = path.join(f.remote, 'hooks/update')
    await writeFile(hook, '#!/bin/sh\ncase "$1" in refs/tags/*) exit 1;; esac\nexit 0\n')
    await chmod(hook, 0o755)
    const before = await f.refs()
    await assert.rejects(f.invoke(['send']), /failed/)
    assert.equal(await f.refs(), before)
})

test('tag metadata mismatch and changes during registry checks fail before remote writes', async t => {
    const f = await fixture(t)
    const release = await f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease'])
    const before = await f.refs()
    const metadata = {version: release.version, channel: release.channel, branch: release.branch, commit: release.commit}
    await f.git(['tag', '-d', release.tag])
    await f.git(['tag', '-a', release.tag, '-m', JSON.stringify({...metadata, version: '1.2.3-rc.2'})])
    await assert.rejects(f.invoke(['send']), /metadata does not match/)
    await f.git(['tag', '-d', release.tag])
    await f.git(['tag', '-a', release.tag, '-m', JSON.stringify(metadata)])
    await assert.rejects(f.invoke(['send'], {fetchImpl: async (...args) => {
        await f.git(['tag', '-f', '-a', release.tag, '-m', JSON.stringify({...metadata, branch: 'other-branch'})])
        return registry()(...args)
    }}), /tag changed/)
    assert.equal(await f.refs(), before)
})

test('send rejects stale HEAD, lightweight/mismatched tags, alternate push URL and advanced remote', async t => {
    const f = await fixture(t)
    const release = await f.invoke(['prepare', '--channel', 'next', '--bump', 'prerelease'])
    await assert.rejects(main(['send'], {cwd: f.cwd, fetchImpl: registry(), print: () => {}}), /origin must point/)
    await f.git(['remote', 'set-url', '--push', 'origin', 'https://example.invalid/other.git'])
    await assert.rejects(f.invoke(['send']), /fixture/)
    await f.git(['config', '--unset', 'remote.origin.pushurl'])
    await f.git(['tag', 'npm/v1.2.3-rc.2'])
    await assert.rejects(f.invoke(['send']), /exactly one/)
    await assert.rejects(f.invoke(['send', '--tag', 'npm/v1.2.3-rc.2']), /annotated/)
    await f.git(['tag', '-d', 'npm/v1.2.3-rc.2'])
    await f.git(['commit', '--allow-empty', '-m', 'New work'])
    await assert.rejects(f.invoke(['send', '--tag', release.tag]), /current HEAD/)
    await f.git(['push', 'origin', 'master'])
    await f.git(['reset', '--hard', release.commit])
    const before = await f.refs()
    await assert.rejects(f.invoke(['send']), /ancestor/)
    assert.equal(await f.refs(), before)
})

test('status is read-only and reports registry failure without requiring gh', async t => {
    const f = await fixture(t), before = await f.git(['show-ref'])
    const result = await f.invoke(['status'], {fetchImpl: async () => { throw new Error('offline') }})
    assert.equal(result.registry.unavailable, 'offline')
    assert.match(result.actionsUrl, /alcovp\/pne-ui\/actions\/workflows\/publish.yml/)
    assert.equal(await f.git(['show-ref']), before)
})
