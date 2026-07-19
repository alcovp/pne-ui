import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { PneConfirmProvider, type PneConfirmOptions, usePneConfirm } from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? _key,
    }),
}))

const autoTestNode = (id: string): HTMLElement => {
    const node = document.querySelector<HTMLElement>(`[data-autotest='${id}']`)
    if (!node) {
        throw new Error(`Missing data-autotest='${id}'`)
    }
    return node
}

const ConfirmTrigger = ({
    onResult,
    options,
}: {
    onResult: (accepted: boolean) => void
    options: PneConfirmOptions
}) => {
    const { confirm } = usePneConfirm()

    return <button onClick={() => void confirm(options).then(onResult)}>
        Open confirm
    </button>
}

describe('PneConfirmProvider', () => {
    it('renders the supported confirm anchors in the modal portal', async () => {
        const { container } = render(
            <PneConfirmProvider>
                <ConfirmTrigger
                    onResult={jest.fn()}
                    options={{ title: 'Delete item', message: 'This cannot be undone' }}
                />
            </PneConfirmProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Open confirm' }))

        expect(await screen.findByText('This cannot be undone')).toBeTruthy()
        expect(document.body.contains(autoTestNode('alert.container'))).toBe(true)
        expect(container.contains(autoTestNode('alert.container'))).toBe(false)
        expect(screen.getByRole('dialog', { name: 'Delete item' })).toBe(autoTestNode('alert.container'))
        expect(autoTestNode('alert.message').textContent).toBe('This cannot be undone')
        expect(autoTestNode('alert.button.close').getAttribute('aria-label')).toBe('Close')
        expect(autoTestNode('alert.button.cancel').textContent).toBe('Cancel')
        expect(autoTestNode('alert.button.submit').textContent).toBe('Yes')
    })

    it('resolves true from the destructive confirm action', async () => {
        const onResult = jest.fn()
        render(
            <PneConfirmProvider>
                <ConfirmTrigger
                    onResult={onResult}
                    options={{ danger: true, message: 'Delete item?' }}
                />
            </PneConfirmProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Open confirm' }))
        const submit = await waitFor(() => autoTestNode('alert.button.submit'))

        expect(submit.className).toContain('MuiButton-colorError')
        expect(submit.className).toContain('MuiButton-outlined')
        fireEvent.click(submit)

        await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
    })

    it.each([
        ['cancel', 'alert.button.cancel'],
        ['close', 'alert.button.close'],
    ])('resolves false from the %s action', async (_action, autoTestId) => {
        const onResult = jest.fn()
        render(
            <PneConfirmProvider>
                <ConfirmTrigger onResult={onResult} options={{ message: 'Continue?' }} />
            </PneConfirmProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Open confirm' }))
        await screen.findByText('Continue?')
        fireEvent.click(autoTestNode(autoTestId))

        await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    })

    it('supports dismissible acknowledgement flows without a cancel action', async () => {
        const onResult = jest.fn()
        render(
            <PneConfirmProvider>
                <ConfirmTrigger
                    onResult={onResult}
                    options={{ message: 'Configuration required', showCancel: false }}
                />
            </PneConfirmProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Open confirm' }))

        expect(await screen.findByText('Configuration required')).toBeTruthy()
        expect(document.querySelector("[data-autotest='alert.button.cancel']")).toBeNull()
        expect(autoTestNode('alert.button.submit')).toBeTruthy()

        fireEvent.click(autoTestNode('alert.button.close'))
        await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    })

    it('inherits provider defaults without leaking them into explicit queued overrides', async () => {
        let confirm: (options: PneConfirmOptions) => Promise<boolean> = async () => false
        const CaptureConfirm = () => {
            confirm = usePneConfirm().confirm
            return null
        }

        render(
            <PneConfirmProvider defaultOptions={{ danger: true, showCancel: false }}>
                <CaptureConfirm />
            </PneConfirmProvider>,
        )

        act(() => {
            void confirm({ message: 'Inherited defaults' })
            void confirm({ danger: false, message: 'Explicit overrides', showCancel: true })
        })

        expect(await screen.findByText('Inherited defaults')).toBeTruthy()
        expect(autoTestNode('alert.button.submit').className).toContain('MuiButton-colorError')
        expect(document.querySelector("[data-autotest='alert.button.cancel']")).toBeNull()
        fireEvent.click(autoTestNode('alert.button.submit'))

        expect(await screen.findByText('Explicit overrides')).toBeTruthy()
        expect(autoTestNode('alert.button.submit').className).not.toContain('MuiButton-colorError')
        expect(autoTestNode('alert.button.cancel')).toBeTruthy()
    })

    it('serves concurrent requests in FIFO order', async () => {
        let confirm: (options: PneConfirmOptions) => Promise<boolean> = async () => false
        const CaptureConfirm = () => {
            confirm = usePneConfirm().confirm
            return null
        }

        render(
            <PneConfirmProvider>
                <CaptureConfirm />
            </PneConfirmProvider>,
        )

        let firstResult: Promise<boolean>
        let secondResult: Promise<boolean>
        act(() => {
            firstResult = confirm({ title: 'First', message: 'First message' })
            secondResult = confirm({ title: 'Second', message: 'Second message' })
        })

        expect(await screen.findByText('First message')).toBeTruthy()
        expect(screen.queryByText('Second message')).toBeNull()
        fireEvent.click(autoTestNode('alert.button.submit'))

        await expect(firstResult!).resolves.toBe(true)
        expect(await screen.findByText('Second message')).toBeTruthy()
        fireEvent.click(autoTestNode('alert.button.cancel'))
        await expect(secondResult!).resolves.toBe(false)
    })

    it('does not settle the next queued request from a repeated click on the previous submit control', async () => {
        let confirm: (options: PneConfirmOptions) => Promise<boolean> = async () => false
        const CaptureConfirm = () => {
            confirm = usePneConfirm().confirm
            return null
        }

        render(
            <PneConfirmProvider>
                <CaptureConfirm />
            </PneConfirmProvider>,
        )

        let secondSettled = false
        let firstResult: Promise<boolean>
        let secondResult: Promise<boolean>
        act(() => {
            firstResult = confirm({ message: 'First destructive action', danger: true })
            secondResult = confirm({ message: 'Second destructive action', danger: true })
            void secondResult.then(() => {
                secondSettled = true
            })
        })

        expect(await screen.findByText('First destructive action')).toBeTruthy()
        const firstSubmit = autoTestNode('alert.button.submit')
        fireEvent.click(firstSubmit)
        fireEvent.click(firstSubmit)

        await expect(firstResult!).resolves.toBe(true)
        expect(await screen.findByText('Second destructive action')).toBeTruthy()
        expect(secondSettled).toBe(false)

        fireEvent.click(autoTestNode('alert.button.cancel'))
        await expect(secondResult!).resolves.toBe(false)
    })

    it('resolves the current and queued requests as false on unmount', async () => {
        let confirm: (options: PneConfirmOptions) => Promise<boolean> = async () => false
        const CaptureConfirm = () => {
            confirm = usePneConfirm().confirm
            return null
        }

        const { unmount } = render(
            <PneConfirmProvider>
                <CaptureConfirm />
            </PneConfirmProvider>,
        )

        let firstResult: Promise<boolean>
        let secondResult: Promise<boolean>
        act(() => {
            firstResult = confirm({ message: 'First message' })
            secondResult = confirm({ message: 'Second message' })
        })

        unmount()

        await expect(Promise.all([firstResult!, secondResult!])).resolves.toEqual([false, false])
    })

    it('fails clearly when the hook is rendered without its provider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const MissingProvider = () => {
            usePneConfirm()
            return null
        }

        expect(() => render(<MissingProvider />)).toThrow(
            'usePneConfirm must be used within <PneConfirmProvider>',
        )
        consoleError.mockRestore()
    })
})
