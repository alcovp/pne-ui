import * as React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'

import {
    normalizePaynetError,
    OverlayHost,
    overlayActions,
    useOverlayStore,
} from '../src'
import { resetOverlayRuntimeForTests } from '../src/component/overlay/overlayRuntime'

const translations: Record<string, string> = {
    'react.unexpected.exception.title': 'Error',
    'react.unexpected.exception.message': 'Unexpected error {errorId}',
    'duplicate-key.unq_login': 'This login already exists',
    'literal.message.key': 'This translation must not be used',
}

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => translations[key] ?? options?.defaultValue ?? key,
    }),
}))

describe('Paynet error normalization', () => {
    it('preserves every field from a direct Paynet v1 envelope', async () => {
        const normalized = await normalizePaynetError({
            errorId: 'backend-123',
            messageId: 'react.unexpected.exception.message',
            details: 'Private backend details',
            errorType: 'VALIDATION_ERROR',
            errorI18N: 'duplicate-key.unq_login',
        })

        expect(normalized).toEqual({
            notificationId: 'paynet-error:backend-123',
            errorId: 'backend-123',
            messageId: 'react.unexpected.exception.message',
            message: undefined,
            details: 'Private backend details',
            errorType: 'VALIDATION_ERROR',
            errorI18N: 'duplicate-key.unq_login',
            httpStatus: undefined,
        })
    })

    it('unwraps a direct AxiosResponse and preserves its HTTP status', async () => {
        const normalized = await normalizePaynetError({
            status: 500,
            data: JSON.stringify({
                errorId: 'direct-response',
                messageId: 'react.unexpected.exception.message',
                details: 'Direct response details',
            }),
        })

        expect(normalized).toEqual(expect.objectContaining({
            notificationId: 'paynet-error:direct-response',
            errorId: 'direct-response',
            messageId: 'react.unexpected.exception.message',
            details: 'Direct response details',
            httpStatus: 500,
        }))
    })

    it('serializes structured details without dropping their content', async () => {
        const normalized = await normalizePaynetError({
            errorId: 'structured-details',
            messageId: 'react.unexpected.exception.message',
            details: {
                path: '/dashboard/chart',
                method: 'POST',
            },
        })

        expect(normalized?.details).toBe('{\n  "path": "/dashboard/chart",\n  "method": "POST"\n}')
    })

    it('preserves an empty structured details object', async () => {
        const normalized = await normalizePaynetError({
            errorId: 'empty-details',
            messageId: 'react.unexpected.exception.message',
            details: {},
        })

        expect(normalized?.details).toBe('{}')
    })

    it('unwraps a promised AxiosError with a JSON Blob response', async () => {
        const response = new Blob([JSON.stringify({
            errorId: 'blob-response',
            messageId: 'react.unexpected.exception.message',
            details: 'Blob details',
            errorType: 'SERVER_ERROR',
            errorI18N: 'translated.detail',
        })], { type: 'application/json' })

        const normalized = await normalizePaynetError(Promise.resolve({
            response: {
                status: 422,
                data: response,
            },
        }))

        expect(normalized).toEqual(expect.objectContaining({
            notificationId: 'paynet-error:blob-response',
            errorId: 'blob-response',
            details: 'Blob details',
            errorType: 'SERVER_ERROR',
            errorI18N: 'translated.detail',
            httpStatus: 422,
        }))
    })

    it.each([
        { code: 'ERR_CANCELED' },
        { name: 'AbortError' },
        { name: 'CanceledError' },
        { config: { signal: { aborted: true } } },
    ])('suppresses canceled requests: %o', async cancellation => {
        await expect(normalizePaynetError(cancellation)).resolves.toBeNull()
    })

    it('uses a separate internal notification id when the backend has no error id', async () => {
        const normalized = await normalizePaynetError(new Error('Network unavailable'))

        expect(normalized?.errorId).toBeUndefined()
        expect(normalized?.notificationId).toMatch(/^paynet-error:/)
        expect(normalized?.message).toBe('Network unavailable')
    })
})

describe('structured overlay errors', () => {
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        resetOverlayRuntimeForTests()
        useOverlayStore.getState().clearSnackbars()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        consoleErrorSpy.mockRestore()
    })

    it('renders translated message and validation text with metadata and visible details', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    status: 422,
                    errorId: 'validation-7',
                    messageId: 'react.unexpected.exception.message',
                    details: 'Visible details\nsecond line',
                    errorType: 'VALIDATION_ERROR',
                    errorI18N: 'duplicate-key.unq_login',
                },
            })
        })

        expect(await screen.findByText('Unexpected error validation-7')).toBeTruthy()
        expect(screen.getByText('This login already exists')).toBeTruthy()
        expect(document.querySelector('[data-name="error-type"]')?.textContent)
            .toBe('Type: VALIDATION_ERROR')
        expect(document.querySelector('[data-name="error-status"]')?.textContent)
            .toBe('Status: 422')
        expect(document.querySelector('[data-name="error-details"]')?.textContent)
            .toBe('Visible details\nsecond line')
    })

    it('uses translated errorI18N once when messageId has no translation', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'missing-message-id',
                    messageId: 'react.validation.exception.message',
                    errorI18N: 'duplicate-key.unq_login',
                },
            })
        })

        expect(await screen.findByText('This login already exists')).toBeTruthy()
        expect(screen.getAllByText('This login already exists')).toHaveLength(1)
        expect(screen.queryByText('react.validation.exception.message')).toBeNull()
        expect(document.querySelector('[data-name="error-validation-message"]')).toBeNull()
    })

    it('renders Error.message as a literal instead of treating it as an i18n key', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({ error: new Error('literal.message.key') })
        })

        expect(await screen.findByText('literal.message.key')).toBeTruthy()
        expect(screen.queryByText('This translation must not be used')).toBeNull()
    })

    it('substitutes the error id in a translated message without rendering a duplicate id row', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'substituted-9',
                    messageId: 'react.unexpected.exception.message',
                },
            })
        })

        expect(await screen.findByText('Unexpected error substituted-9')).toBeTruthy()
        expect(document.querySelector('[data-name="error-id"]')).toBeNull()
    })

    it('deduplicates concurrent reports by backend error id', async () => {
        render(<OverlayHost container={null} />)
        const error = {
            errorId: 'same-backend-error',
            messageId: 'react.unexpected.exception.message',
        }

        act(() => {
            overlayActions.showError({ error })
            overlayActions.showError({ error: Promise.resolve(error) })
        })

        await waitFor(() => {
            expect(useOverlayStore.getState().snackbars).toHaveLength(1)
        })
        expect(useOverlayStore.getState().snackbars[0].id).toBe('paynet-error:same-backend-error')
    })

    it('does not enqueue or report a missing host for a canceled request', async () => {
        act(() => {
            overlayActions.showError({ error: { config: { signal: { aborted: true } } } })
        })

        await act(async () => {
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(useOverlayStore.getState().snackbars).toHaveLength(0)
        expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
})
