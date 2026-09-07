import {spawn} from 'node:child_process'

export const RELEASE_CONFIG = Object.freeze({
    packageName: 'pne-ui', repository: 'alcovp/pne-ui', remote: 'origin',
    stableBranch: 'master', tagPrefix: 'npm/v', workflow: 'publish.yml', environment: 'npm-release',
})

export function parseVersion(version) {
    const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-rc\.(0|[1-9]\d*))?$/.exec(version)
    if (!match || typeof version !== 'string') throw new Error(`Invalid release version: ${version}`)
    const [major, minor, patch, rc] = match.slice(1).map(value => value === undefined ? null : Number(value))
    if (![major, minor, patch, rc ?? 0].every(Number.isSafeInteger)) throw new Error('Version number is too large')
    return {major, minor, patch, rc}
}

export function compareVersions(a, b) {
    const left = parseVersion(a), right = parseVersion(b)
    for (const key of ['major', 'minor', 'patch']) {
        if (left[key] !== right[key]) return Math.sign(left[key] - right[key])
    }
    if (left.rc === right.rc) return 0
    if (left.rc === null) return 1
    if (right.rc === null) return -1
    return Math.sign(left.rc - right.rc)
}

export const channelForVersion = version => parseVersion(version).rc === null ? 'latest' : 'next'
export const tagForVersion = version => (parseVersion(version), `${RELEASE_CONFIG.tagPrefix}${version}`)
export function versionFromTag(tag) {
    if (typeof tag !== 'string' || !tag.startsWith(RELEASE_CONFIG.tagPrefix)) throw new Error('Expected an npm/vVERSION tag')
    const version = tag.slice(RELEASE_CONFIG.tagPrefix.length)
    parseVersion(version)
    return version
}

/** Runs an argument vector without a shell. Rejects failures, including their stderr. */
export function run(command, args, {cwd, input, env, timeout = 30_000} = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {cwd, env: {...process.env, ...env}, shell: false, stdio: 'pipe'})
        let stdout = '', stderr = ''
        const timer = setTimeout(() => child.kill('SIGTERM'), timeout)
        child.stdout.on('data', data => { stdout += data })
        child.stderr.on('data', data => { stderr += data })
        child.on('error', error => { clearTimeout(timer); reject(error) })
        child.on('close', (code, signal) => {
            clearTimeout(timer)
            if (code === 0) resolve(stdout.trimEnd())
            else reject(new Error(`${command} ${args.join(' ')} failed (${signal ?? code}): ${stderr.trim()}`))
        })
        child.stdin.on('error', () => {})
        child.stdin.end(input)
    })
}

export function parseReleaseTagAnnotation(text) {
    const metadata = JSON.parse(text.replace(/\n-----BEGIN (?:PGP|SSH) SIGNATURE-----[\s\S]*$/, ''))
    if (!metadata || Object.keys(metadata).sort().join(',') !== 'branch,channel,commit,version'
        || typeof metadata.branch !== 'string' || !metadata.branch || /[\n\r\0]/.test(metadata.branch)
        || !/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(metadata.commit)) throw new Error('Invalid release tag metadata')
    if (channelForVersion(metadata.version) !== metadata.channel) throw new Error('Release channel does not match version')
    if (metadata.channel === 'latest' && metadata.branch !== RELEASE_CONFIG.stableBranch) throw new Error('Stable releases require master')
    return metadata
}

export async function readReleaseTag(tag, {cwd} = {}) {
    const version = versionFromTag(tag)
    const ref = `refs/tags/${tag}`
    if (await run('git', ['cat-file', '-t', ref], {cwd}) !== 'tag') throw new Error('Release tag must be annotated')
    const object = await run('git', ['cat-file', 'tag', ref], {cwd})
    const boundary = object.indexOf('\n\n')
    const metadata = parseReleaseTagAnnotation(object.slice(boundary + 2))
    if (metadata.version !== version || !object.startsWith(`object ${metadata.commit}\ntype commit\ntag ${tag}\n`)) {
        throw new Error('Release tag metadata does not match its object')
    }
    await run('git', ['check-ref-format', '--branch', metadata.branch], {cwd})
    const manifest = JSON.parse(await run('git', ['show', `${metadata.commit}:package.json`], {cwd}))
    if (manifest.name !== RELEASE_CONFIG.packageName || manifest.version !== version) throw new Error('Tagged package does not match release metadata')
    return metadata
}

export async function registrySnapshot({fetchImpl = fetch} = {}) {
    const response = await fetchImpl(`https://registry.npmjs.org/${RELEASE_CONFIG.packageName}`, {
        headers: {accept: 'application/json'}, signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`Cannot check npm registry: HTTP ${response.status}`)
    const data = await response.json()
    if (data.name !== RELEASE_CONFIG.packageName || !data.versions || Array.isArray(data.versions)
        || typeof data.versions !== 'object' || !Object.keys(data.versions).length
        || !data['dist-tags'] || Array.isArray(data['dist-tags']) || typeof data['dist-tags'] !== 'object'
        || typeof data['dist-tags'].latest !== 'string') {
        throw new Error('Invalid npm registry response')
    }
    const distTags = data['dist-tags']
    for (const channel of ['latest', 'next']) if (distTags[channel] !== undefined) {
        parseVersion(distTags[channel])
        if (!Object.hasOwn(data.versions, distTags[channel])) throw new Error('npm dist-tag points to a missing version')
    }
    if (channelForVersion(distTags.latest) !== 'latest') throw new Error('npm latest must point to a stable version')
    return {versions: Object.keys(data.versions), distTags}
}

export function ensureFreshVersion(version, {versions, distTags}) {
    const channel = channelForVersion(version)
    if (versions.includes(version)) throw new Error(`${version} is already published`)
    const relevant = versions.filter(candidate => {
        try { return channelForVersion(candidate) === channel } catch { return false }
    })
    if (distTags[channel]) relevant.push(distTags[channel])
    if (channel === 'next' && distTags.latest) relevant.push(distTags.latest)
    for (const published of relevant) {
        if (compareVersions(version, published) <= 0) throw new Error(`${version} would regress ${channel} behind ${published}`)
    }
}
