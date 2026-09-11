import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {
    RELEASE_CONFIG as config, parseVersion, compareVersions, channelForVersion, tagForVersion,
    versionFromTag, readReleaseTag, registrySnapshot, ensureFreshVersion, run,
} from './release-common.mjs'

const usage = 'release.mjs prepare --channel next|latest (--bump patch|minor|major|prerelease | --version VERSION|current) [--dry-run]\nrelease.mjs send [--tag npm/vVERSION] [--dry-run]\nrelease.mjs status [--tag npm/vVERSION]'

function argumentsFor(argv) {
    const [command, ...rest] = argv
    const allowed = {prepare: ['channel', 'bump', 'version', 'dry-run'], send: ['tag', 'dry-run'], status: ['tag']}[command]
    if (!allowed) throw new Error(usage)
    const options = {}
    for (let index = 0; index < rest.length; index++) {
        const key = rest[index].slice(2)
        if (!rest[index].startsWith('--') || !allowed.includes(key) || key in options) throw new Error(`Invalid or repeated option: ${rest[index]}`)
        const value = key === 'dry-run' ? true : rest[++index]
        if (value === undefined || typeof value === 'string' && value.startsWith('--')) throw new Error(`Missing value for --${key}`)
        options[key] = value
    }
    return {command, options}
}

export function bumpVersion(current, channel, bump) {
    let {major, minor, patch, rc} = parseVersion(current)
    if (!['patch', 'minor', 'major', 'prerelease'].includes(bump)) throw new Error('Unknown version bump')
    if (channel !== 'next' && channel !== 'latest') throw new Error('Invalid release channel')
    if (bump === 'prerelease') {
        if (channel !== 'next') throw new Error('prerelease requires the next channel')
        if (rc === null) { patch++; rc = 0 } else rc++
    } else {
        if (bump === 'major') { if (channel === 'next' || rc === null || minor || patch) major++; minor = 0; patch = 0 }
        if (bump === 'minor') { if (channel === 'next' || rc === null || patch) minor++; patch = 0 }
        if (bump === 'patch' && (channel === 'next' || rc === null)) patch++
        rc = channel === 'next' ? 0 : null
    }
    const version = `${major}.${minor}.${patch}${rc === null ? '' : `-rc.${rc}`}`
    parseVersion(version)
    return version
}

export async function main(argv, {cwd = process.cwd(), fetchImpl = fetch, fixtureRemote, print = console.log} = {}) {
    const {command, options} = argumentsFor(argv)
    const git = (args, extra) => run('git', args, {cwd, ...extra})
    cwd = await git(['rev-parse', '--show-toplevel'])
    const manifestPath = path.join(cwd, 'package.json')
    const original = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(original)
    if (manifest.name !== config.packageName) throw new Error('This command only releases pne-ui')
    parseVersion(manifest.version)
    const head = await git(['rev-parse', 'HEAD'])
    const branch = await git(['symbolic-ref', '--quiet', '--short', 'HEAD']).catch(() => null)
    const clean = async () => {
        if (!branch) throw new Error('Release requires an attached branch')
        if (await git(['status', '--porcelain=v1', '--untracked-files=all'])) throw new Error('Release requires a clean tracked and untracked working tree')
        if (await git(['rev-parse', 'HEAD']) !== head || await git(['symbolic-ref', '--short', 'HEAD']) !== branch) throw new Error('HEAD or branch changed during release')
    }
    const headTags = async () => (await git(['tag', '--points-at', 'HEAD'])).split('\n').filter(tag => tag.startsWith(config.tagPrefix))
    const selectTag = async () => {
        if (options.tag) { versionFromTag(options.tag); return options.tag }
        const tags = await headTags()
        if (tags.length !== 1) throw new Error('Specify --tag: HEAD must have exactly one release tag')
        return tags[0]
    }
    const output = result => { print(JSON.stringify(result, null, 2)); return result }

    if (command === 'status') {
        const tags = await headTags()
        const tag = options.tag ?? (tags.length === 1 ? tags[0] : null)
        const release = tag ? await readReleaseTag(tag, {cwd}) : null
        let registry
        try { registry = (await registrySnapshot({fetchImpl})).distTags } catch (error) { registry = {unavailable: error.message} }
        return output({version: manifest.version, branch, commit: head, tags, tag, release, registry,
            npmUrl: `https://www.npmjs.com/package/${config.packageName}`,
            actionsUrl: `https://github.com/${config.repository}/actions/workflows/${config.workflow}?query=${encodeURIComponent(`head_sha:${release?.commit ?? head}`)}`})
    }
    await clean()
    if (command === 'prepare') {
        const channel = options.channel === 'stable' ? 'latest' : options.channel
        if (!['next', 'latest'].includes(channel) || Boolean(options.bump) === Boolean(options.version)) throw new Error('Select a channel and exactly one of --bump or --version')
        if (channel === 'latest' && branch !== config.stableBranch) throw new Error('Stable releases require master')
        const version = options.bump ? bumpVersion(manifest.version, channel, options.bump) : options.version === 'current' ? manifest.version : options.version
        if (channelForVersion(version) !== channel) throw new Error('Version does not match release channel')
        if (options.version !== 'current' && compareVersions(version, manifest.version) <= 0) throw new Error('New version must be greater than current; use --version current to tag HEAD')
        const tag = tagForVersion(version)
        if (await git(['tag', '--list', tag])) throw new Error(`Tag already exists: ${tag}`)
        const changesVersion = version !== manifest.version
        if (options['dry-run']) return output({command, dryRun: true, version, channel, branch, tag, createsCommit: changesVersion, pushes: false})
        let commit = head
        try {
            if (changesVersion) {
                const updated = original.replace(/("version"\s*:\s*")[^"]+(")/, (_match, prefix, suffix) => `${prefix}${version}${suffix}`)
                if (JSON.parse(updated).version !== version) throw new Error('Cannot update package version safely')
                await writeFile(manifestPath, updated)
                await git(['add', '--', 'package.json'])
                await git(['commit', '--only', '-m', `Release ${version}`, '--', 'package.json'])
                commit = await git(['rev-parse', 'HEAD'])
                if (await git(['log', '-1', '--format=%P']) !== head
                    || await git(['diff-tree', '--no-commit-id', '--name-only', '-r', commit]) !== 'package.json'
                    || await git(['show', `${commit}:package.json`]) !== updated.trimEnd()
                    || await git(['status', '--porcelain=v1', '--untracked-files=all'])) {
                    throw new Error('Release commit or working tree changed unexpectedly; inspect it manually (no tag created)')
                }
            }
            const metadata = {version, channel, branch, commit}
            await git(['tag', '-a', tag, commit, '-F', '-'], {input: JSON.stringify(metadata) + '\n'})
            return output({command, tag, ...metadata, pushes: false})
        } catch (error) {
            if (await git(['rev-parse', 'HEAD']) === head && changesVersion) {
                await git(['restore', '--staged', '--worktree', '--', 'package.json'])
            }
            throw error
        }
    }

    const tag = await selectTag()
    const release = await readReleaseTag(tag, {cwd})
    const tagObject = await git(['rev-parse', `refs/tags/${tag}`])
    if (release.commit !== head || release.branch !== branch || release.version !== manifest.version) throw new Error('Release tag must describe the clean current HEAD and branch')
    const urls = [await git(['remote', 'get-url', config.remote]), await git(['remote', 'get-url', '--push', '--all', config.remote])]
    if (fixtureRemote) {
        if (!path.isAbsolute(fixtureRemote) || urls.some(url => url !== fixtureRemote)
            || await run('git', ['rev-parse', '--is-bare-repository'], {cwd: fixtureRemote}) !== 'true') throw new Error('Invalid local bare test fixture')
    } else if (urls.some(url => ![
        `git@github.com:${config.repository}.git`, `https://github.com/${config.repository}.git`,
        `https://github.com/${config.repository}`, `ssh://git@github.com/${config.repository}.git`,
    ].includes(url))) throw new Error(`origin must point only to github.com/${config.repository}`)
    const refs = (await git(['ls-remote', '--refs', config.remote, `refs/heads/${branch}`, `refs/tags/${tag}`])).split('\n').filter(Boolean).map(line => line.split(/\s+/))
    if (refs.some(([, ref]) => ref === `refs/tags/${tag}`)) throw new Error('Release tag is already remote; use status')
    const remoteHead = refs.find(([, ref]) => ref === `refs/heads/${branch}`)?.[0]
    if (!remoteHead && release.channel === 'latest') throw new Error('Remote master must exist for a stable release')
    if (remoteHead) {
        try { await git(['merge-base', '--is-ancestor', remoteHead, head]) }
        catch { throw new Error('Remote branch is not a known ancestor of HEAD; fetch and reconcile before sending') }
    }
    ensureFreshVersion(release.version, await registrySnapshot({fetchImpl}))
    await clean()
    if (await git(['rev-parse', `refs/tags/${tag}`]) !== tagObject) throw new Error('Release tag changed during checks')
    const pushArgs = ['-c', 'push.followTags=false', '-c', `remote.${config.remote}.mirror=false`,
        'push', '--atomic', config.remote, `refs/heads/${branch}:refs/heads/${branch}`, `refs/tags/${tag}:refs/tags/${tag}`]
    if (!options['dry-run']) await git(pushArgs, {timeout: 120_000})
    return output({command, dryRun: Boolean(options['dry-run']), tag, ...release, refs: pushArgs.slice(-2), remote: config.remote})
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1 })
}
