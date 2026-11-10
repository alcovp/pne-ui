#!/usr/bin/env node
/**
 * Storybook browser check.
 *
 * Builds Storybook from the working tree and opens every story in headless Chrome in three views:
 * light, dark and the near-black skin. A story fails when it or its play function throws, when the
 * page reports an uncaught error or console.error, when a request fails or when the story never
 * finishes. Docs pages are opened once for the same errors. Only the local server answers the
 * browser, so the result does not depend on the network.
 *
 * With --baseline the same stories are also shot from another revision and the pictures that differ
 * are listed, so a change in a component shows up in every story that uses it.
 *
 *   yarn storybook:check                             errors and play functions, pictures are kept
 *   yarn storybook:check --baseline origin/master    the same plus the picture comparison
 *   yarn storybook:check --filter pnemodal --views light
 *   yarn storybook:check --help
 */
import {execFileSync, spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {closeSync, createReadStream, openSync, rmSync} from 'node:fs'
import fs from 'node:fs/promises'
import http from 'node:http'
import {createRequire} from 'node:module'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {chromium} from 'playwright-core'

const HELP = `Usage: node scripts/storybook-check.mjs [options]

Opens every story of the built Storybook in headless Chrome in three views (light, dark and the
near-black skin), lets the play functions run and fails on any error. With a baseline it also
compares the pictures. The browser reaches the local server only, so a story that asks the network
for anything fails. A few failed stories are opened once more, one at a time: a story that passes
then is listed apart and does not fail the run.

A picture is taken once the play function is done and the page has been still for 0.6 s. The clock
is not moved: a story that changes its look later, on a timer, needs a play function that waits.

  --baseline <rev>         git revision to compare the pictures with; its sources are built with
                           the current .storybook and the installed dependencies, and its pictures
                           are taken again from --out for a day while all three stay the same
  --baseline-static <dir>  an already built Storybook to compare the pictures with
  --static <dir>           an already built Storybook to check, instead of building the working tree
  --views <list>           views to open: light,dark,black (default: all three)
  --filter <text>          only the stories whose id contains the text; several texts through a comma
  --no-pictures            errors and play functions only, no pictures
  --tolerance <n>          ignore colour channel differences up to n, 0..255 (default 0: two runs of
                           the same build give the same pictures, so every changed pixel counts)
  --workers <n>            pages open at the same time (default: one per processor, at most 8)
  --timeout <seconds>      time one story has to finish (default 60)
  --out <dir>              builds, pictures and the report (default node_modules/.cache/storybook-check)
  --browser <path>         browser executable (default: the installed Google Chrome)
  -h, --help               this text

Exit code: 0 when every story is fine, 1 when a story failed, 2 when the check itself could not run.
Changed pictures do not fail the run: they are listed in the output and in report.html.`

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

/** A view is a set of Storybook globals; the names come from `.storybook/preview.tsx` and `skins.ts`. */
const VIEWS = {
    light: 'colorMode:light',
    dark: 'colorMode:dark',
    black: 'colorMode:light;skin:black',
}
const DEFAULT_VIEWPORT = {width: 1280, height: 800}
/**
 * A story is settled when its DOM stays unchanged this long; stories load their data in up to half a second.
 * The check does not move the clock: a story that changes its look later, on a timer, needs a play function
 * that waits for the look its picture is to show.
 */
const QUIET_MS = 600
const SETTLE_LIMIT_MS = 5000
const SHOT_ATTEMPTS = 6
/** A docs page that throws never says it has rendered: after its first problem it gets this long to finish. */
const DOCS_GRACE_MS = 3000
/** Console errors that say nothing about the library: this Storybook has no MUI X licence key to give. */
const IGNORED_CONSOLE_ERRORS = [/MUI X: Missing license key/]
/** More failures than this are not a loaded machine: they are reported without a second attempt. */
const RETRY_LIMIT = 10
/**
 * Stories must not depend on the network: every host but the local server fails to resolve, which is reported.
 * Partial raster is off for the pictures: a dark MUI surface is a gradient the browser dithers, and repainting
 * a part of it moved the dither, so two shots of the same page differed by a colour step.
 */
const BROWSER_ARGS = ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', '--disable-partial-raster']

const CHANNEL_EVENTS = {
    storyFinished: null,
    docsRendered: null,
    storyThrewException: 'story threw',
    storyErrored: 'story failed to render',
    storyMissing: 'story not found',
    playFunctionThrewException: 'play function failed',
    unhandledErrorsWhilePlaying: 'unhandled error while playing',
    configError: 'preview configuration failed',
}

const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const git = (...args) => execFileSync('git', args, {cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30}).trim()
const relative = file => {
    const local = path.relative(process.cwd(), file) || '.'
    return local.startsWith('..') ? file : local
}

function readOptions(argv) {
    const {values} = parseArgs({
        args: argv,
        options: {
            baseline: {type: 'string'},
            'baseline-static': {type: 'string'},
            static: {type: 'string'},
            views: {type: 'string', default: Object.keys(VIEWS).join(',')},
            filter: {type: 'string'},
            'no-pictures': {type: 'boolean', default: false},
            tolerance: {type: 'string', default: '0'},
            workers: {type: 'string'},
            timeout: {type: 'string', default: '60'},
            out: {type: 'string'},
            browser: {type: 'string'},
            help: {type: 'boolean', short: 'h', default: false},
        },
    })
    const number = (name, text, min, max) => {
        const value = Number(text)
        if (!Number.isInteger(value) || value < min || value > max) throw new Error(`--${name} takes a whole number from ${min} to ${max}`)
        return value
    }
    const views = values.views.split(',').map(view => view.trim()).filter(Boolean)
    const unknown = views.filter(view => !(view in VIEWS))
    if (!views.length || unknown.length) throw new Error(`--views takes ${Object.keys(VIEWS).join(', ')}; got ${values.views}`)
    if (values.baseline && values['baseline-static']) throw new Error('Give either --baseline or --baseline-static')
    const pictures = !values['no-pictures']
    if (!pictures && (values.baseline || values['baseline-static'])) throw new Error('A baseline needs pictures: drop --no-pictures')
    return {
        help: values.help,
        baseline: values.baseline,
        baselineStatic: values['baseline-static'] && path.resolve(values['baseline-static']),
        static: values.static && path.resolve(values.static),
        views: [...new Set(views)],
        filters: (values.filter ?? '').split(',').map(text => text.trim().toLowerCase()).filter(Boolean),
        pictures,
        tolerance: number('tolerance', values.tolerance, 0, 255),
        workers: values.workers === undefined
            ? Math.min(8, os.availableParallelism())
            : number('workers', values.workers, 1, 32),
        timeoutMs: number('timeout', values.timeout, 1, 3600) * 1000,
        out: path.resolve(values.out ?? path.join(ROOT, 'node_modules/.cache/storybook-check')),
        browser: values.browser,
    }
}

/** Serves the named directories as /<name>/... on a free local port; `mounts` may grow while it runs. */
async function serve(mounts) {
    const server = http.createServer(async (request, response) => {
        try {
            const {pathname} = new URL(request.url, 'http://localhost')
            const [mount, ...rest] = decodeURIComponent(pathname).slice(1).split('/')
            if (mount === 'blank') return response.writeHead(200, {'content-type': MIME['.html']}).end('<!doctype html><title>blank</title>')
            // The browser asks for it on its own when the preview frame is opened as a page.
            if (pathname === '/favicon.ico') return response.writeHead(204).end()
            const root = mounts[mount]
            const file = root && path.resolve(root, rest.join('/'))
            if (!file || !file.startsWith(root + path.sep) || !(await fs.stat(file)).isFile()) throw new Error('not found')
            response.writeHead(200, {'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store'})
            createReadStream(file).pipe(response)
        } catch {
            response.writeHead(404, {'content-type': MIME['.txt']}).end('not found')
        }
    })
    await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
    return {
        origin: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }),
    }
}

/** Runs `storybook build` for the tree in `cwd`; the output of the build goes to `logFile`. */
async function buildStorybook(cwd, outputDir, logFile) {
    const manifestFile = require.resolve('storybook/package.json')
    const {bin} = JSON.parse(await fs.readFile(manifestFile, 'utf8'))
    const cli = path.resolve(path.dirname(manifestFile), typeof bin === 'string' ? bin : bin.storybook)
    await fs.rm(outputDir, {recursive: true, force: true})
    await fs.mkdir(path.dirname(logFile), {recursive: true})
    const log = openSync(logFile, 'w')
    try {
        const code = await new Promise((resolve, reject) => {
            const child = spawn(process.execPath,
                [cli, 'build', '--config-dir', path.join(cwd, '.storybook'), '--output-dir', outputDir, '--quiet'],
                {cwd, env: {...process.env, STORYBOOK_DISABLE_TELEMETRY: '1'}, stdio: ['ignore', log, log]})
            child.on('error', reject)
            child.on('close', (exitCode, signal) => resolve(exitCode ?? signal))
        })
        if (code !== 0) {
            const tail = (await fs.readFile(logFile, 'utf8')).trimEnd().split('\n').slice(-30).join('\n')
            throw new Error(`Storybook build failed (${code}), full log: ${relative(logFile)}\n${tail}`)
        }
    } finally {
        closeSync(log)
    }
}

/**
 * Unpacks a revision next to nothing else: its sources with the current `.storybook` laid over and the
 * installed `node_modules` linked in. So both builds share one Storybook shell and one set of
 * dependencies, and the pictures differ only by what changed in the sources. The directory must not
 * sit under `node_modules`: the loaders skip such paths.
 */
async function exportRevision(revision) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pne-ui-storybook-check-'))
    process.once('exit', () => rmSync(dir, {recursive: true, force: true}))
    const archive = execFileSync('git', ['archive', '--format=tar', revision], {cwd: ROOT, maxBuffer: 1 << 30})
    execFileSync('tar', ['-x', '-C', dir], {input: archive})
    await fs.rm(path.join(dir, '.storybook'), {recursive: true, force: true})
    await fs.cp(path.join(ROOT, '.storybook'), path.join(dir, '.storybook'), {recursive: true})
    await fs.symlink(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
    return dir
}

async function hashDirectory(dir, hash, prefix = '') {
    const entries = await fs.readdir(dir, {withFileTypes: true})
    for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : 1)) {
        const name = `${prefix}${entry.name}`
        if (entry.isDirectory()) await hashDirectory(path.join(dir, entry.name), hash, `${name}/`)
        else hash.update(name).update('\0').update(await fs.readFile(path.join(dir, entry.name))).update('\0')
    }
}

/**
 * Everything the pictures of a baseline revision depend on. While it stays the same, the pictures kept
 * from an earlier run are compared again without building and opening the baseline once more. The day
 * is a part of it: a story may show today's date.
 */
async function baselineKey(revision, browser, options) {
    const hash = createHash('sha256').update(JSON.stringify([
        revision, browser.version(), options.views, options.filters, options.timeoutMs, new Date().toISOString().slice(0, 10),
    ]))
    await hashDirectory(path.join(ROOT, '.storybook'), hash)
    for (const file of [path.join(ROOT, 'yarn.lock'), fileURLToPath(import.meta.url)]) hash.update(await fs.readFile(file))
    return hash.digest('hex')
}

/** Runs inside the page before Storybook starts: forwards the preview channel events to the check. */
function forwardChannelEvents(names) {
    const text = value => {
        if (value === undefined || value === null) return ''
        if (typeof value === 'string') return value
        if (Array.isArray(value)) return value.map(text).join('\n')
        const head = [value.name, value.message ?? value.title].filter(Boolean).join(': ')
        const body = value.stack ?? value.description ?? ''
        return (body.startsWith(head) ? body : [head, body].filter(Boolean).join('\n')) || JSON.stringify(value)
    }
    const subscribe = channel => {
        for (const name of names) {
            channel.on(name, payload => window.__storybookCheckEvent(name, name === 'storyFinished' ? payload?.status ?? '' : text(payload)))
        }
    }
    let channel = window.__STORYBOOK_ADDONS_CHANNEL__
    if (channel) subscribe(channel)
    // Storybook assigns the channel once at start; catching the assignment misses no early event.
    Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
        configurable: true,
        enumerable: true,
        get: () => channel,
        set: next => {
            channel = next
            if (next) subscribe(next)
        },
    })
}

/** Runs inside the page: resolves when fonts are loaded and the DOM has stopped changing. */
async function settleInPage({quiet, limit}) {
    await document.fonts.ready
    await new Promise(resolve => {
        const finish = () => {
            observer.disconnect()
            clearTimeout(timer)
            clearTimeout(stop)
            resolve()
        }
        let timer = setTimeout(finish, quiet)
        const observer = new MutationObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(finish, quiet)
        })
        observer.observe(document, {subtree: true, childList: true, attributes: true, characterData: true})
        const stop = setTimeout(finish, limit)
    })
}

/** Saves a full page picture once two shots in a row are the same; tells whether that happened. */
async function shoot(page, file) {
    let previous = null
    for (let attempt = 0; attempt < SHOT_ATTEMPTS; attempt++) {
        const shot = await page.screenshot({fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css'})
        const stable = previous?.equals(shot) ?? false
        previous = shot
        if (stable) break
        if (attempt === SHOT_ATTEMPTS - 1) previous = null
        else await delay(150)
    }
    await fs.mkdir(path.dirname(file), {recursive: true})
    await fs.writeFile(file, previous ?? await page.screenshot({fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css'}))
    return previous !== null
}

/** Opens one story view or docs page in its own browser context and returns what went wrong. */
async function visit(browser, job, {timeoutMs}) {
    const problems = []
    const seen = new Set()
    let open = true, finish, grace
    const finished = new Promise(resolve => { finish = resolve })
    const report = (kind, text = '') => {
        const message = String(text).trim()
        const key = message.split('\n')[0] || kind
        if (!open || seen.has(key)) return
        seen.add(key)
        problems.push({kind, text: message.slice(0, 4000)})
        if (job.kind === 'docs') grace ??= setTimeout(finish, DOCS_GRACE_MS)
    }
    const started = Date.now()
    let stable = null
    const context = await browser.newContext({
        viewport: job.viewport, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC',
    })
    try {
        const page = await context.newPage()
        await page.exposeFunction('__storybookCheckEvent', (name, text) => {
            if (name === 'storyFinished') {
                if (text !== 'success' && !problems.length) report('story finished with an error')
                if (job.kind === 'story') finish()
            } else if (name === 'docsRendered') {
                if (job.kind === 'docs') finish()
            } else {
                report(CHANNEL_EVENTS[name], text)
                if (name === 'storyMissing' || name === 'configError') finish()
            }
        })
        await page.addInitScript(forwardChannelEvents, Object.keys(CHANNEL_EVENTS))
        page.on('pageerror', error => report('uncaught error', error.stack ?? String(error)))
        page.on('console', message => {
            const text = message.text()
            if (message.type() === 'error' && !IGNORED_CONSOLE_ERRORS.some(ignored => ignored.test(text))) report('console.error', text)
        })
        page.on('requestfailed', request => report('request failed', `${request.url()} ${request.failure()?.errorText ?? ''}`))
        page.on('response', response => {
            if (response.status() >= 400) report(`HTTP ${response.status()}`, response.url())
        })
        page.on('crash', () => {
            report('page crashed')
            finish()
        })
        await page.goto(job.url, {waitUntil: 'load', timeout: timeoutMs})
        let timer
        const timedOut = await Promise.race([
            finished.then(() => false),
            new Promise(resolve => { timer = setTimeout(resolve, timeoutMs, true) }),
        ])
        clearTimeout(timer)
        if (timedOut) {
            report('timeout', `did not finish in ${timeoutMs / 1000} s`)
        } else {
            await page.evaluate(settleInPage, {quiet: QUIET_MS, limit: SETTLE_LIMIT_MS})
            if (job.shot) stable = await shoot(page, job.shot)
        }
    } catch (error) {
        report('check failed', error.message)
    } finally {
        open = false
        clearTimeout(grace)
        await context.close().catch(() => {})
    }
    // A story that never finished has no picture.
    return {...job, shot: stable === null ? null : job.shot, problems, stable, ms: Date.now() - started}
}

/** Reads the stories of a built Storybook with the viewport each one asks for. */
async function readStories(browser, base, {filters, timeoutMs}) {
    const response = await fetch(`${base}/index.json`)
    if (!response.ok) throw new Error(`No Storybook index at ${base}/index.json`)
    const entries = Object.values((await response.json()).entries)
    const first = entries.find(entry => entry.type === 'story')
    if (!first) throw new Error('The Storybook has no stories')
    const matches = id => !filters.length || filters.some(text => id.toLowerCase().includes(text))
    const stories = [], docs = []
    for (const {type, id, title, name} of entries) {
        if (!matches(id)) continue
        if (type === 'docs') docs.push({id, title, name})
        else if (type === 'story') stories.push({id, title, name, viewport: DEFAULT_VIEWPORT})
    }
    const context = await browser.newContext()
    try {
        const page = await context.newPage()
        await page.goto(`${base}/iframe.html?viewMode=story&id=${encodeURIComponent(first.id)}`, {timeout: timeoutMs})
        await page.waitForFunction(() => window.__STORYBOOK_PREVIEW__?.storyStoreValue, null, {timeout: timeoutMs})
        const {globals, viewports} = await page.evaluate(async ids => {
            const store = window.__STORYBOOK_PREVIEW__.storyStoreValue
            const projectGlobals = {...store.userGlobals.initialGlobals, ...store.userGlobals.globals}
            const viewports = {}
            for (const id of ids) {
                // A story file that fails to load keeps the default size; opening the story reports the error.
                const story = await store.loadStory({storyId: id}).catch(() => null)
                if (!story) continue
                // Both forms are in use: the `viewport` global and the older `defaultViewport` parameter.
                const viewport = {...projectGlobals, ...story.storyGlobals}.viewport
                const name = viewport?.value ?? story.parameters?.viewport?.defaultViewport
                const styles = story.parameters?.viewport?.options?.[name]?.styles
                const size = styles && [Number.parseInt(styles.width, 10), Number.parseInt(styles.height, 10)]
                if (!size?.every(Number.isFinite)) continue
                if (viewport?.isRotated) size.reverse()
                viewports[id] = {width: size[0], height: size[1]}
            }
            return {globals: Object.keys(projectGlobals), viewports}
        }, stories.map(story => story.id))
        for (const story of stories) story.viewport = viewports[story.id] ?? DEFAULT_VIEWPORT
        return {stories, docs, globals: new Set(globals)}
    } finally {
        await context.close()
    }
}

/** Opens every story in every view (and, with `docs`, every docs page once) and returns the results. */
async function runTarget(browser, base, {stories, docs = [], views, shotsDir, label}, options) {
    const jobs = []
    for (const story of stories) {
        for (const view of views) {
            jobs.push({
                kind: 'story', id: story.id, title: `${story.title} / ${story.name}`, view, viewport: story.viewport,
                url: `${base}/iframe.html?viewMode=story&id=${encodeURIComponent(story.id)}&globals=${VIEWS[view]}`,
                shot: shotsDir && path.join(shotsDir, view, `${story.id}.png`),
            })
        }
    }
    for (const page of docs) {
        jobs.push({
            kind: 'docs', id: page.id, title: `${page.title} / ${page.name}`, view: views[0], viewport: DEFAULT_VIEWPORT,
            url: `${base}/iframe.html?viewMode=docs&id=${encodeURIComponent(page.id)}&globals=${VIEWS[views[0]]}`,
            shot: null,
        })
    }
    if (shotsDir) await fs.rm(shotsDir, {recursive: true, force: true})
    const results = new Array(jobs.length)
    let next = 0, done = 0
    await Promise.all(Array.from({length: Math.min(options.workers, jobs.length)}, async () => {
        while (next < jobs.length) {
            const index = next++
            results[index] = await visit(browser, jobs[index], options)
            if (++done % 50 === 0 || done === jobs.length) console.log(`  ${label}: ${done} of ${jobs.length}`)
        }
    }))
    // A loaded machine makes a slow story look broken: the few that failed are opened again, one at a time.
    const failed = results.flatMap((result, index) => result.problems.length ? [index] : [])
    for (const index of failed.length > RETRY_LIMIT ? [] : failed) {
        const again = await visit(browser, jobs[index], options)
        if (!again.problems.length) results[index] = {...again, firstAttempt: results[index].problems}
    }
    return results
}

/** Runs inside the page: compares two pictures pixel by pixel and draws where they differ. */
async function compareInPage({before, after, tolerance}) {
    const load = async url => createImageBitmap(await (await fetch(url)).blob(), {colorSpaceConversion: 'none'})
    const [left, right] = await Promise.all([load(before), load(after)])
    const width = Math.max(left.width, right.width), height = Math.max(left.height, right.height)
    const read = bitmap => {
        const context = new OffscreenCanvas(width, height).getContext('2d', {willReadFrequently: true})
        context.drawImage(bitmap, 0, 0)
        return context.getImageData(0, 0, width, height).data
    }
    const a = read(left), b = read(right)
    const result = {
        width, height, changed: 0, maxDelta: 0,
        resized: left.width !== right.width || left.height !== right.height ? `${left.width}×${left.height} → ${right.width}×${right.height}` : null,
    }
    left.close()
    right.close()
    // Unchanged pixels are a pale copy of the new picture, changed ones are magenta.
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d')
    const image = context.createImageData(width, height)
    const out = image.data
    for (let i = 0; i < a.length; i += 4) {
        const delta = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]), Math.abs(a[i + 3] - b[i + 3]))
        if (delta > tolerance) {
            result.changed++
            if (delta > result.maxDelta) result.maxDelta = delta
            out[i] = 255
            out[i + 1] = 0
            out[i + 2] = 144
        } else {
            const pale = 255 - (255 - (b[i] * 0.3 + b[i + 1] * 0.59 + b[i + 2] * 0.11)) * 0.2
            out[i] = out[i + 1] = out[i + 2] = pale
        }
        out[i + 3] = 255
    }
    if (result.changed) {
        context.putImageData(image, 0, 0)
        const bytes = new Uint8Array(await (await canvas.convertToBlob({type: 'image/png'})).arrayBuffer())
        let binary = ''
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        result.diff = btoa(binary)
    }
    return result
}

/** Compares the pictures of two runs; `before` and `after` are the results of `runTarget`. */
async function comparePictures(browser, server, mounts, {before, after, beforeDir, afterDir, diffDir, tolerance}) {
    const key = result => `${result.view}/${result.id}`
    const stories = results => new Map(results.filter(result => result.kind === 'story').map(result => [key(result), result]))
    const old = stories(before), fresh = stories(after)
    const pictures = {changed: [], added: [], removed: [], missing: [], same: 0, tolerated: 0}
    mounts.before = beforeDir
    mounts.after = afterDir
    await fs.rm(diffDir, {recursive: true, force: true})
    const context = await browser.newContext()
    try {
        const page = await context.newPage()
        await page.goto(`${server.origin}/blank`)
        for (const [name, result] of fresh) {
            const entry = {id: result.id, title: result.title, view: result.view}
            const baseline = old.get(name)
            if (!baseline) {
                pictures.added.push(entry)
                continue
            }
            if (!baseline.shot || !result.shot) {
                pictures.missing.push(entry)
                continue
            }
            const [a, b] = await Promise.all([fs.readFile(baseline.shot), fs.readFile(result.shot)])
            if (a.equals(b)) {
                pictures.same++
                continue
            }
            const {diff, ...numbers} = await page.evaluate(compareInPage, {
                before: `${server.origin}/before/${name}.png`, after: `${server.origin}/after/${name}.png`, tolerance,
            })
            if (!numbers.changed) {
                pictures.same++
                pictures.tolerated++
                continue
            }
            const file = path.join(diffDir, `${name}.png`)
            await fs.mkdir(path.dirname(file), {recursive: true})
            await fs.writeFile(file, Buffer.from(diff, 'base64'))
            pictures.changed.push({
                ...entry, ...numbers, share: numbers.changed / (numbers.width * numbers.height),
                unstable: baseline.stable === false || result.stable === false,
                before: baseline.shot, after: result.shot, diff: file,
            })
        }
        for (const [name, result] of old) {
            if (!fresh.has(name)) pictures.removed.push({id: result.id, title: result.title, view: result.view})
        }
    } finally {
        await context.close()
    }
    return pictures
}

/** Groups per-view entries of one story: `[{id, title, views: [...], ...}]`, in the order they came. */
function groupByStory(entries, signature = () => '') {
    const groups = new Map()
    for (const entry of entries) {
        const key = `${entry.id}\n${signature(entry)}`
        if (!groups.has(key)) groups.set(key, {...entry, views: []})
        groups.get(key).views.push(entry.view)
    }
    return [...groups.values()]
}

/** Views of one story that failed the same way are reported together. */
const failureSignature = failure => JSON.stringify([failure.inBaseline, failure.problems.map(problem => [problem.kind, problem.text.split('\n')[0]])])

const percent = share => share < 0.0001 ? '<0.01%' : `${(share * 100).toFixed(share < 0.01 ? 2 : 1)}%`

function renderHtml(report, outDir) {
    const escape = text => String(text).replace(/[&<>"]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[char])
    const link = file => escape(path.relative(outDir, file).split(path.sep).join('/'))
    const picture = (file, caption) => `<figure><a href="${link(file)}"><img loading="lazy" src="${link(file)}"></a><figcaption>${caption}</figcaption></figure>`
    const list = (title, entries) => entries.length
        ? `<h2>${title}: ${entries.length}</h2><ul>${groupByStory(entries).map(entry =>
            `<li>${escape(entry.title)} <code>${escape(entry.id)}</code> [${entry.views.join(', ')}]</li>`).join('')}</ul>`
        : ''
    const problems = entries => groupByStory(entries, failureSignature).map(entry =>
        `<h3>${escape(entry.title)} <code>${escape(entry.id)}</code> [${entry.views.join(', ')}]${
            entry.inBaseline ? ' — fails in the baseline too' : ''}</h3>${entry.problems.map(problem =>
            `<p><b>${escape(problem.kind)}</b></p><pre>${escape(problem.text)}</pre>`).join('')}`).join('')
    const failures = report.failures.length
        ? `<h2>Failed: ${report.failures.length}</h2>${problems(report.failures)}`
        : '<h2>No story failed</h2>'
    const retried = report.retried.length
        ? `<h2>Failed once and passed on the second attempt: ${report.retried.length}</h2>${problems(report.retried)}`
        : ''
    const pictures = report.pictures
    const changed = pictures?.changed.length
        ? `<h2>Changed pictures: ${pictures.changed.length}</h2>${pictures.changed.map(entry =>
            `<h3>${escape(entry.title)} <code>${escape(entry.id)}</code> [${entry.view}] — ${percent(entry.share)} of the pixels, by up to ${
                entry.maxDelta} of 255${entry.resized ? `, size ${entry.resized}` : ''}${
                entry.unstable ? ', the picture was not stable' : ''}</h3><div class="row">${
                picture(entry.before, 'baseline')}${picture(entry.after, 'current')}${picture(entry.diff, 'difference')}</div>`).join('')}`
        : ''
    return `<!doctype html><meta charset="utf-8"><title>Storybook check</title>
<style>
body { font: 14px/1.4 system-ui, sans-serif; margin: 24px; color: #1f2328; }
h2 { margin-top: 32px; } h3 { font-size: 14px; margin: 24px 0 8px; } code { color: #57606a; }
pre { background: #f6f8fa; padding: 8px 12px; overflow: auto; white-space: pre-wrap; }
.row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: start; }
figure { margin: 0; } img { max-width: 100%; border: 1px solid #d0d7de; } figcaption { color: #57606a; }
</style>
<h1>Storybook check</h1>
<p>${escape(report.summary.join(' · '))}</p>
${failures}${retried}${list('Pictures that were not stable', report.unstable)}${changed}${
    pictures ? list('New stories, nothing to compare with', pictures.added) + list('Stories that are gone', pictures.removed)
        + list('Failed stories without a picture to compare', pictures.missing) : ''}
`
}

async function main() {
    const options = readOptions(process.argv.slice(2))
    if (options.help) {
        console.log(HELP)
        return 0
    }
    const out = options.out
    await fs.mkdir(out, {recursive: true})
    const comparing = Boolean(options.baseline || options.baselineStatic)

    let currentStatic = options.static
    if (!currentStatic) {
        currentStatic = path.join(out, 'current/static')
        console.log('Building Storybook from the working tree...')
        await buildStorybook(ROOT, currentStatic, path.join(out, 'build-current.log'))
    }
    const mounts = {current: currentStatic}
    const server = await serve(mounts)
    const browser = await chromium.launch({
        args: BROWSER_ARGS, ...(options.browser ? {executablePath: options.browser} : {channel: 'chrome'}),
    })
    try {
        const current = await readStories(browser, `${server.origin}/current`, options)
        for (const view of options.views) {
            const missing = VIEWS[view].split(';').map(pair => pair.split(':')[0]).filter(name => !current.globals.has(name))
            if (missing.length) throw new Error(`View ${view} sets ${missing.join(', ')}, which this Storybook does not declare as a global`)
        }
        if (!current.stories.length && !current.docs.length) throw new Error('No story matches the filter')
        console.log(`Checking ${current.stories.length} stories in ${options.views.length} views (${options.views.join(', ')})`
            + ` and ${current.docs.length} docs pages, ${options.workers} at a time`)
        const started = Date.now()
        const currentShots = path.join(out, 'current/shots')
        const results = await runTarget(browser, `${server.origin}/current`, {
            ...current, views: options.views, shotsDir: options.pictures ? currentShots : null, label: 'current',
        }, options)

        let pictures = null, baselineName = null, baselineFailed = null
        if (comparing) {
            const baselineShots = path.join(out, 'baseline/shots')
            const keptFile = path.join(out, 'baseline/results.json')
            let baselineStatic = options.baselineStatic, before = null, key = null
            baselineName = options.baselineStatic ? relative(options.baselineStatic) : options.baseline
            if (!baselineStatic) {
                const revision = git('rev-parse', '--verify', `${options.baseline}^{commit}`)
                baselineName = `${options.baseline} (${revision.slice(0, 10)})`
                key = await baselineKey(revision, browser, options)
                const kept = await fs.readFile(keptFile, 'utf8').then(JSON.parse, () => null)
                const shots = kept?.key === key ? kept.results.filter(result => result.shot) : null
                if (shots && (await Promise.all(shots.map(result => fs.access(result.shot).then(() => true, () => false)))).every(Boolean)) {
                    console.log(`The pictures of ${baselineName} are kept from an earlier run`)
                    before = kept.results
                } else {
                    console.log(`Building Storybook from ${baselineName}...`)
                    const tree = await exportRevision(revision)
                    baselineStatic = path.join(tree, 'storybook-static')
                    await buildStorybook(tree, baselineStatic, path.join(out, 'build-baseline.log'))
                }
            }
            if (!before) {
                await fs.rm(keptFile, {force: true})
                mounts.baseline = baselineStatic
                const baseline = await readStories(browser, `${server.origin}/baseline`, options)
                before = await runTarget(browser, `${server.origin}/baseline`, {
                    stories: baseline.stories, views: options.views, shotsDir: baselineShots, label: 'baseline',
                }, options)
                if (key) await fs.writeFile(keptFile, JSON.stringify({key, results: before}))
            }
            pictures = await comparePictures(browser, server, mounts, {
                before, after: results, beforeDir: baselineShots, afterDir: currentShots,
                diffDir: path.join(out, 'diff'), tolerance: options.tolerance,
            })
            baselineFailed = new Set(before.filter(result => result.problems.length).map(result => `${result.view}/${result.id}`))
        }

        const failures = results.filter(result => result.problems.length).map(({kind, id, title, view, problems}) => ({
            kind, id, title, view, problems,
            ...(baselineFailed && kind === 'story' ? {inBaseline: baselineFailed.has(`${view}/${id}`)} : {}),
        }))
        const old = failures.filter(failure => failure.inBaseline).length
        const retried = results.filter(result => result.firstAttempt)
            .map(({kind, id, title, view, firstAttempt}) => ({kind, id, title, view, problems: firstAttempt}))
        const unstable = results.filter(result => result.stable === false).map(({id, title, view}) => ({id, title, view}))
        const summary = [
            `${current.stories.length} stories × ${options.views.length} views, ${current.docs.length} docs pages`,
            `${failures.length} failed${old ? `, ${old} of them in the baseline too` : ''}`
                + (retried.length ? `, ${retried.length} passed on the second attempt` : ''),
            ...(pictures ? [`compared with ${baselineName}: ${pictures.changed.length} pictures changed, ${pictures.same} the same`
                + `${pictures.tolerated ? ` (${pictures.tolerated} of them within the tolerance)` : ''}, `
                + `${pictures.added.length} new, ${pictures.removed.length} gone`
                + (pictures.missing.length ? `, ${pictures.missing.length} without a picture` : '')] : []),
            `${Math.round((Date.now() - started) / 1000)} s`,
        ]
        const report = {summary, views: options.views, baseline: baselineName, failures, retried, unstable, pictures}
        await fs.writeFile(path.join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
        await fs.writeFile(path.join(out, 'report.html'), renderHtml(report, out))

        for (const failure of groupByStory(failures, failureSignature)) {
            console.log(`\n✗ ${failure.title} (${failure.id}) [${failure.views.join(', ')}]${failure.inBaseline ? ' — fails in the baseline too' : ''}`)
            for (const problem of failure.problems) console.log(`    ${problem.kind}${problem.text ? `: ${problem.text.split('\n')[0].slice(0, 300)}` : ''}`)
        }
        if (retried.length) {
            console.log('\nFailed once and passed on the second attempt:')
            for (const entry of groupByStory(retried, failureSignature)) {
                console.log(`    ${entry.id} [${entry.views.join(', ')}] — ${entry.problems[0].kind}`)
            }
        }
        if (unstable.length) {
            console.log('\nPictures that were not stable:')
            for (const entry of groupByStory(unstable)) console.log(`    ${entry.id} [${entry.views.join(', ')}]`)
        }
        if (pictures) {
            const views = entry => `${entry.id} [${entry.views.join(', ')}]`
            const lines = [
                ...pictures.changed.map(entry => `changed ${entry.id} [${entry.view}] ${percent(entry.share)}${entry.resized ? `, size ${entry.resized}` : ''}`),
                ...groupByStory(pictures.added).map(entry => `new     ${views(entry)}`),
                ...groupByStory(pictures.removed).map(entry => `gone    ${views(entry)}`),
                ...groupByStory(pictures.missing).map(entry => `no picture to compare ${views(entry)}`),
            ]
            if (lines.length) console.log(`\nPictures compared with ${baselineName}:\n${lines.map(line => `    ${line}`).join('\n')}`)
        }
        console.log(`\n${summary.join(' · ')}`)
        console.log(`Report: ${relative(path.join(out, 'report.html'))}`)
        return failures.length ? 1 : 0
    } finally {
        await browser.close()
        await server.close()
    }
}

process.exitCode = await main().catch(error => {
    console.error(error.message)
    return 2
})
