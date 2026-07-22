import type { NormalizedPaynetError } from './types'

type UnknownRecord = Record<PropertyKey, unknown>

const UNKNOWN_ERROR_MESSAGE_ID = 'react.unexpected.exception.unknown-message'
const PAYNET_ERROR_ID_PREFIX = 'paynet-error:'

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null

const hasOwn = (value: UnknownRecord, key: PropertyKey): boolean =>
    Object.prototype.hasOwnProperty.call(value, key)

const readString = (value: UnknownRecord | undefined, key: PropertyKey): string | undefined => {
    const candidate = value?.[key]
    return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : undefined
}

const readNumber = (value: UnknownRecord | undefined, key: PropertyKey): number | undefined => {
    const candidate = value?.[key]
    return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : undefined
}

const createRandomId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createNotificationId = (errorId?: string): string =>
    `${PAYNET_ERROR_ID_PREFIX}${errorId ?? createRandomId()}`

const settle = async (value: unknown): Promise<unknown> => {
    try {
        return await Promise.resolve(value)
    } catch (reason) {
        return reason
    }
}

const isCancellation = (value: unknown): boolean => {
    if (!isRecord(value)) return false

    const code = readString(value, 'code')
    const name = readString(value, 'name')
    const config = isRecord(value.config) ? value.config : undefined
    const signal = config && isRecord(config.signal) ? config.signal : undefined
    return code === 'ERR_CANCELED'
        || name === 'AbortError'
        || name === 'CanceledError'
        || value.__CANCEL__ === true
        || signal?.aborted === true
}

const isFetchResponseLike = (value: unknown): value is UnknownRecord & {
    status: number
    text: () => Promise<string>
    clone?: () => unknown
} => isRecord(value)
    && typeof value.status === 'number'
    && typeof value.text === 'function'
    && !hasOwn(value, 'data')

const isBlobLike = (value: unknown): value is Blob => {
    if (typeof Blob !== 'undefined' && value instanceof Blob) return true
    return isRecord(value)
        && typeof value.size === 'number'
        && typeof value.type === 'string'
        && typeof value.arrayBuffer === 'function'
}

const readBlobText = async (blob: Blob): Promise<string> => {
    if (typeof blob.text === 'function') {
        return blob.text()
    }

    if (typeof FileReader !== 'undefined') {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = () => reject(reader.error ?? new Error('Unable to read error response'))
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
            reader.readAsText(blob)
        })
    }

    return ''
}

const parseString = (value: string): unknown => {
    const trimmed = value.trim()
    if (!trimmed) return value

    try {
        return JSON.parse(trimmed)
    } catch {
        return value
    }
}

const materializePayload = async (value: unknown): Promise<unknown> => {
    const settled = await settle(value)

    if (isBlobLike(settled)) {
        try {
            return parseString(await readBlobText(settled))
        } catch {
            return settled
        }
    }

    return typeof settled === 'string' ? parseString(settled) : settled
}

const stringifyDetails = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        return value.trim().length > 0 ? value : undefined
    }
    if (value === null || value === undefined) return undefined

    try {
        const serialized = JSON.stringify(value, null, 2)
        return serialized || undefined
    } catch {
        return String(value)
    }
}

type UnwrappedError = {
    payload: unknown
    source: unknown
    httpStatus?: number
}

const unwrapTransport = async (source: unknown): Promise<UnwrappedError> => {
    if (!isRecord(source)) return { payload: source, source }

    const response = isRecord(source.response) ? source.response : undefined
    if (response && hasOwn(response, 'data')) {
        return {
            payload: await materializePayload(response.data),
            source,
            httpStatus: readNumber(response, 'status'),
        }
    }

    // Supports passing a fulfilled AxiosResponse directly, including custom
    // validateStatus configurations where an error response is not rejected.
    if (hasOwn(source, 'data') && readNumber(source, 'status') !== undefined) {
        return {
            payload: await materializePayload(source.data),
            source,
            httpStatus: readNumber(source, 'status'),
        }
    }

    if (isFetchResponseLike(source)) {
        try {
            const clone = typeof source.clone === 'function' ? source.clone() : source
            const readText = isRecord(clone) && typeof clone.text === 'function'
                ? clone.text.bind(clone)
                : source.text.bind(source)
            return {
                payload: parseString(await readText()),
                source,
                httpStatus: source.status,
            }
        } catch {
            return { payload: source, source, httpStatus: source.status }
        }
    }

    return {
        payload: await materializePayload(source),
        source,
        httpStatus: readNumber(source, 'httpStatus') ?? readNumber(source, 'status'),
    }
}

const normalizeResolvedError = async (input: unknown): Promise<NormalizedPaynetError | null> => {
    const source = await settle(input)
    if (isCancellation(source)) return null

    const unwrapped = await unwrapTransport(source)
    const payload = await materializePayload(unwrapped.payload)
    if (isCancellation(payload)) return null

    const payloadRecord = isRecord(payload) ? payload : undefined
    const sourceRecord = isRecord(unwrapped.source) ? unwrapped.source : undefined

    const errorId = readString(payloadRecord, 'errorId') ?? readString(sourceRecord, 'errorId')
    const messageId = readString(payloadRecord, 'messageId') ?? readString(sourceRecord, 'messageId')
    const errorType = readString(payloadRecord, 'errorType')
        ?? readString(sourceRecord, 'errorType')
        // Temporary compatibility with Dashboard's former RFC-style model.
        ?? readString(payloadRecord, 'type')
        ?? readString(sourceRecord, 'type')
    const errorI18N = readString(payloadRecord, 'errorI18N') ?? readString(sourceRecord, 'errorI18N')
    const details = stringifyDetails(payloadRecord?.details ?? sourceRecord?.details)

    const primitiveMessage = typeof payload === 'string' && payload.trim().length > 0 ? payload : undefined
    const message = readString(payloadRecord, 'message')
        ?? readString(payloadRecord, 'title')
        ?? readString(sourceRecord, 'message')
        ?? readString(sourceRecord, 'title')
        ?? primitiveMessage

    const httpStatus = unwrapped.httpStatus
        ?? readNumber(payloadRecord, 'httpStatus')
        ?? readNumber(payloadRecord, 'status')
        ?? readNumber(sourceRecord, 'httpStatus')
        ?? readNumber(sourceRecord, 'status')

    return {
        notificationId: createNotificationId(errorId),
        errorId,
        messageId: messageId ?? (message ? undefined : UNKNOWN_ERROR_MESSAGE_ID),
        message,
        details,
        errorType,
        errorI18N,
        httpStatus,
    }
}

/**
 * Converts Paynet and transport error shapes into one safe presentation model.
 * Cancellation values resolve to `null`; malformed inputs always fall back to a
 * presentable unknown error rather than rejecting this Promise.
 */
export const normalizePaynetError = async (input: unknown): Promise<NormalizedPaynetError | null> => {
    try {
        return await normalizeResolvedError(input)
    } catch (error) {
        const message = isRecord(error) ? readString(error, 'message') : undefined
        return {
            notificationId: createNotificationId(),
            messageId: message ? undefined : UNKNOWN_ERROR_MESSAGE_ID,
            message,
        }
    }
}
