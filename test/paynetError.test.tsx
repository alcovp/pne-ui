import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
    normalizePaynetError,
    OverlayHost,
    overlayActions,
    useOverlayStore,
} from '../src'
import { resetOverlayRuntimeForTests } from '../src/component/overlay/overlayRuntime'

const translations: Record<string, string> = {
    'react.unexpected.exception.title': 'Error',
    'react.unexpected.exception.message': 'Unexpected error occurred. Please contact our support and provide them the error id {errorId}',
    'duplicate-key.unq_login': 'This login already exists',
    'literal.message.key': 'This translation must not be used',
}

const clipboardWriteText = jest.fn<Promise<void>, [string]>()

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
        clipboardWriteText.mockReset()
        clipboardWriteText.mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: clipboardWriteText },
        })
    })

    afterEach(() => {
        jest.useRealTimers()
        window.getSelection()?.removeAllRanges()
        consoleErrorSpy.mockRestore()
    })

    it('renders translated message, validation text and details without exposing technical metadata visually', async () => {
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

        await waitFor(() => {
            expect(document.querySelector('[data-name="error-message"]')?.textContent)
                .toBe('Unexpected error occurred. Please contact our support and provide them the error id validation-7')
        })
        expect(screen.getByText('This login already exists')).toBeTruthy()
        expect(screen.getByRole('button', { name: 'Copy error ID: validation-7' })).toBeTruthy()
        expect(document.querySelector('[data-name="error-type"]')).toBeNull()
        expect(document.querySelector('[data-name="error-status"]')).toBeNull()
        expect(screen.queryByText('Details')).toBeNull()
        const message = document.querySelector<HTMLElement>('[data-name="error-message"]')!
        const details = document.querySelector<HTMLElement>('[data-name="error-details"]')!
        const detailsSection = document.querySelector<HTMLElement>('[data-name="error-details-section"]')!
        expect(details.textContent).toBe('Visible details\nsecond line')
        expect(details.tagName).toBe('DIV')
        expect(window.getComputedStyle(detailsSection).borderTopStyle).toBe('solid')
        expect(window.getComputedStyle(detailsSection).borderTopWidth).toBe('1px')
        expect(window.getComputedStyle(details).fontFamily)
            .toBe(window.getComputedStyle(message).fontFamily)
        expect(window.getComputedStyle(details).fontSize)
            .toBe(window.getComputedStyle(message).fontSize)
        expect(window.getComputedStyle(details).lineHeight)
            .toBe(window.getComputedStyle(message).lineHeight)
    })

    it('keeps a preview of long details inline and opens the complete diagnostic in a dialog', async () => {
        const details = Array.from(
            { length: 10 },
            (_, index) => `at com.payneteasy.processing.Step${index + 1}.run(Step${index + 1}.java:42)`,
        ).join('\n')

        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'long-details-1',
                    message: 'Processing failed',
                    details,
                },
            })
        })

        expect(await screen.findByText('Processing failed')).toBeTruthy()
        const inlineDetails = document.querySelector('[data-name="error-details"]')
        expect(inlineDetails?.textContent).toContain('Step1.run')
        expect(inlineDetails?.textContent).not.toContain('Step10.run')

        fireEvent.click(screen.getByRole('button', { name: 'Show full details' }))

        expect(await screen.findByRole('dialog', { name: 'Details' })).toBeTruthy()
        const dialogDetails = document.querySelector<HTMLElement>('[data-name="error-details-dialog"]')!
        expect(dialogDetails.textContent).toBe(details)
        const dialogDetailsStyle = window.getComputedStyle(dialogDetails)
        expect(dialogDetails.tagName).toBe('PRE')
        expect(dialogDetailsStyle.fontFamily).toContain('ui-monospace')
        expect(dialogDetailsStyle.fontSize).toBe('12px')
        expect(dialogDetailsStyle.lineHeight).toBe('18px')
        expect(dialogDetailsStyle.borderTopWidth).toBe('1px')
        expect(dialogDetailsStyle.borderTopStyle).toBe('solid')
        expect(dialogDetailsStyle.whiteSpace).toBe('pre')

        fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: 'Details' })).toBeNull()
        })
    })

    it('keeps an ordinary multiline diagnostic fully visible inline', async () => {
        const details = [
            'Processor: Acquirer A',
            'Response code: 05',
            'Response text: Do not honor',
            'Retryable: false',
            'Route: primary',
        ].join('\n')

        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'ordinary-details-1',
                    message: 'Transaction declined',
                    details,
                },
            })
        })

        expect(await screen.findByText('Transaction declined')).toBeTruthy()
        expect(document.querySelector('[data-name="error-details"]')?.textContent).toBe(details)
        expect(screen.queryByRole('button', { name: 'Show full details' })).toBeNull()
    })

    it('keeps the full-details dialog in a custom OverlayHost portal target', async () => {
        const portalTarget = document.createElement('div')
        document.body.appendChild(portalTarget)
        const details = Array.from({ length: 10 }, (_, index) => `Stack frame ${index + 1}`).join('\n')
        const view = render(<OverlayHost container={portalTarget} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'custom-portal-details',
                    message: 'Custom portal failure',
                    details,
                },
            })
        })

        fireEvent.click(await screen.findByRole('button', { name: 'Show full details' }))

        const dialog = await screen.findByRole('dialog', { name: 'Details' })
        expect(portalTarget.contains(dialog)).toBe(true)

        view.unmount()
        portalTarget.remove()
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

    it('falls back cleanly when a message requires an error id that is absent', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: { messageId: 'react.unexpected.exception.message' },
            })
        })

        expect(await screen.findByText('Internal server error')).toBeTruthy()
        expect(document.body.textContent).not.toContain('{errorId}')
        expect(document.querySelector('[data-name="copy-error-id"]')).toBeNull()
    })

    it('does not invent a separate error id when a literal message has no placeholder', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'literal-without-placeholder',
                    message: 'Processing failed',
                },
            })
        })

        expect(await screen.findByText('Processing failed')).toBeTruthy()
        expect(document.querySelector('[data-name="copy-error-id"]')).toBeNull()
        expect(document.body.textContent).not.toContain('literal-without-placeholder')
    })

    it('renders Error.message as a literal instead of treating it as an i18n key', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({ error: new Error('literal.message.key') })
        })

        expect(await screen.findByText('literal.message.key')).toBeTruthy()
        expect(screen.queryByText('This translation must not be used')).toBeNull()
    })

    it('renders the translated error id inline and copies it with temporary success feedback', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'substituted-9',
                    messageId: 'react.unexpected.exception.message',
                },
            })
        })

        await waitFor(() => {
            expect(document.querySelector('[data-name="error-message"]')?.textContent)
                .toBe('Unexpected error occurred. Please contact our support and provide them the error id substituted-9')
        })
        expect(document.querySelector('[data-name="error-id"]')).toBeNull()
        const errorId = document.querySelector<HTMLElement>('[data-name="error-id-value"]')!
        const copyControl = document.querySelector<HTMLElement>('[data-name="copy-error-id"]')!
        expect(copyControl.tagName).toBe('SPAN')
        expect(copyControl.getAttribute('role')).toBe('button')
        expect(copyControl.tabIndex).toBe(0)
        expect(window.getComputedStyle(copyControl).display).toBe('inline')
        expect(window.getComputedStyle(copyControl).userSelect).toBe('text')
        expect(window.getComputedStyle(errorId).textDecoration).toBe('underline')
        expect(window.getComputedStyle(errorId).overflowWrap).toBe('anywhere')
        expect(window.getComputedStyle(errorId).wordBreak).toBe('break-all')
        expect(window.getComputedStyle(
            document.querySelector<HTMLElement>('[data-name="error-id-tail"]')!,
        ).whiteSpace).toBe('nowrap')

        jest.useFakeTimers()
        const copyButton = screen.getByRole('button', { name: 'Copy error ID: substituted-9' })
        fireEvent.keyDown(copyButton, { key: 'Enter' })

        await act(async () => {
            await Promise.resolve()
        })

        expect(clipboardWriteText).toHaveBeenCalledWith('substituted-9')
        expect(copyButton.getAttribute('data-copy-state')).toBe('copied')
        expect(copyButton.getAttribute('aria-label')).toBe('Error ID copied')
        expect(copyButton.querySelector('[data-name="error-id-copied-icon"]')).not.toBeNull()

        act(() => {
            jest.advanceTimersByTime(2000)
        })

        expect(copyButton.getAttribute('data-copy-state')).toBe('idle')
        expect(copyButton.querySelector('[data-name="error-id-copy-icon"]')).not.toBeNull()
    })

    it('keeps the inline error id selectable as part of the complete error message', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'selectable-error-id',
                    messageId: 'react.unexpected.exception.message',
                },
            })
        })

        const copyControl = await screen.findByRole('button', { name: 'Copy error ID: selectable-error-id' })
        const message = document.querySelector<HTMLElement>('[data-name="error-message"]')!
        const selection = window.getSelection()!
        const range = document.createRange()
        range.selectNodeContents(message)
        selection.removeAllRanges()
        selection.addRange(range)

        expect(window.getComputedStyle(copyControl).userSelect).toBe('text')
        expect(selection.toString()).toContain('error id selectable-error-id')
    })

    it('copies the error id on an ordinary click and on Enter or Space', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'activation-error-id',
                    messageId: 'react.unexpected.exception.message',
                },
            })
        })

        const copyControl = await screen.findByRole('button', { name: 'Copy error ID: activation-error-id' })

        fireEvent.click(copyControl, { detail: 1 })
        await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledTimes(1))

        fireEvent.keyDown(copyControl, { key: 'Enter', code: 'Enter' })
        await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledTimes(2))

        fireEvent.keyDown(copyControl, { key: ' ', code: 'Space' })
        fireEvent.keyUp(copyControl, { key: ' ', code: 'Space' })
        await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledTimes(3))
        expect(clipboardWriteText).toHaveBeenNthCalledWith(1, 'activation-error-id')
        expect(clipboardWriteText).toHaveBeenNthCalledWith(2, 'activation-error-id')
        expect(clipboardWriteText).toHaveBeenNthCalledWith(3, 'activation-error-id')
    })

    it('does not copy after selecting or dragging the error id with the mouse', async () => {
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'dragged-error-id',
                    messageId: 'react.unexpected.exception.message',
                },
            })
        })

        const copyControl = await screen.findByRole('button', { name: 'Copy error ID: dragged-error-id' })
        const errorId = document.querySelector<HTMLElement>('[data-name="error-id-value"]')!
        const selection = window.getSelection()!
        const range = document.createRange()
        range.selectNodeContents(errorId)
        selection.removeAllRanges()
        selection.addRange(range)

        fireEvent.click(copyControl, { detail: 1 })
        expect(clipboardWriteText).not.toHaveBeenCalled()

        selection.removeAllRanges()
        fireEvent.mouseDown(copyControl, { button: 0, clientX: 10, clientY: 10 })
        fireEvent.mouseMove(copyControl, { buttons: 1, clientX: 20, clientY: 10 })
        fireEvent.mouseUp(copyControl, { button: 0, clientX: 20, clientY: 10 })
        fireEvent.click(copyControl, { detail: 1 })

        expect(clipboardWriteText).not.toHaveBeenCalled()
        expect(copyControl.getAttribute('data-copy-state')).toBe('idle')
    })

    it('ignores a delayed clipboard completion after the error is removed', async () => {
        let resolveCopy!: () => void
        clipboardWriteText.mockReturnValue(new Promise<void>(resolve => {
            resolveCopy = resolve
        }))
        render(<OverlayHost container={null} />)

        act(() => {
            overlayActions.showError({
                error: {
                    errorId: 'delayed-copy',
                    messageId: 'react.unexpected.exception.message',
                },
            })
        })

        const copyButton = await screen.findByRole('button', { name: 'Copy error ID: delayed-copy' })
        const setTimeoutSpy = jest.spyOn(window, 'setTimeout')
        fireEvent.click(copyButton)

        act(() => {
            overlayActions.clearSnackbars()
        })
        await act(async () => {
            await new Promise(resolve => window.setTimeout(resolve, 250))
        })
        expect(copyButton.isConnected).toBe(false)
        await act(async () => {
            resolveCopy()
            await Promise.resolve()
        })

        expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 2000)
        setTimeoutSpy.mockRestore()
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
