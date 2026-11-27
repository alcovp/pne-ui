const SCHEME_PATTERN = /^https?:\/\//i
const WWW_PREFIX = 'www.'
// Letters of any script, digits, "-", "_" and ".": no spaces, controls or URL delimiters (@ / : ? # [ ] and others).
const HOSTNAME_PATTERN = /^[\p{L}\p{M}\p{N}_.-]+$/u

/**
 * The hostname by which orders are searched for a typed request source (the site URL of a payment request).
 * The rules are the ones the server applies to the stored values:
 * - the host part of the URL, with or without the `http://` / `https://` scheme;
 * - port, path, query, fragment and user info dropped, lower case, a leading `www.` cut;
 * - the result has a dot and only letters, digits, `-`, `_` and dots.
 *
 * Internationalised names are compared as typed: `пример.рф` and its punycode `xn--e1afmapc.xn--p1ai` are
 * different hosts, so the host is cut out of the string instead of going through `URL`.
 *
 * @returns the hostname, or `null` when the value holds no valid hostname
 */
export const getRequestSourceHostname = (value: string): string | null => {
    const trimmed = value.trim()
    const afterScheme = trimmed.replace(SCHEME_PATTERN, '')
    const authority = afterScheme.split(/[/?#]/, 1)[0]
    const hostAndPort = authority.slice(authority.lastIndexOf('@') + 1)
    const host = hostAndPort.split(':', 1)[0].toLowerCase()
    const hostname = host.startsWith(WWW_PREFIX) ? host.slice(WWW_PREFIX.length) : host

    return hostname.includes('.') && HOSTNAME_PATTERN.test(hostname) ? hostname : null
}
