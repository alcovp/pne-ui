import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PneButton from '../PneButton'
import PneModal from '../PneModal'
import PneModalActions from '../PneModalActions'
import { createAutoTestAttributes } from '../AutoTestAttribute'

export type PneConfirmOptions = {
    title?: string
    message?: React.ReactNode
    confirmLabel?: string
    cancelLabel?: string
    /** Use the destructive/error visual treatment for the confirm action. */
    danger?: boolean
    /** Set to false for acknowledgement flows that intentionally have no cancel action. */
    showCancel?: boolean
}

export type PneConfirmDestructiveOptions = Omit<PneConfirmOptions, 'danger'>
export type PneConfirmDeleteOptions = Omit<PneConfirmOptions, 'danger' | 'confirmLabel'>
export type PneConfirmDeleteDefaultOptions = Omit<PneConfirmOptions, 'message' | 'danger'>

export type PneConfirmProviderProps = {
    children: React.ReactNode
    defaultOptions?: Partial<Omit<PneConfirmOptions, 'message'>>
    deleteOptions?: PneConfirmDeleteDefaultOptions
}

type PendingConfirm = {
    requestId: number
    title: string
    message?: React.ReactNode
    confirmLabel: string
    cancelLabel: string
    danger: boolean
    showCancel: boolean
    resolve: (accepted: boolean) => void
}

export type PneConfirmContextValue = {
    confirm: (options?: PneConfirmOptions) => Promise<boolean>
    confirmDestructive: (options?: PneConfirmDestructiveOptions) => Promise<boolean>
    confirmDelete: (options?: PneConfirmDeleteOptions) => Promise<boolean>
}

const PneConfirmContext = createContext<PneConfirmContextValue | null>(null)

const MISSING_PROVIDER_ERROR = 'usePneConfirm must be used within <PneConfirmProvider>'
const normalizeTitle = (title?: string): string | undefined => {
    if (!title) return undefined
    return title.trim().length > 0 ? title : undefined
}
const hasMessage = (message: React.ReactNode): boolean => {
    if (typeof message === 'string') return message.trim().length > 0
    return React.Children.toArray(message).length > 0
}

export const PneConfirmProvider = ({ children, defaultOptions, deleteOptions }: PneConfirmProviderProps) => {
    const { t } = useTranslation()
    const queueRef = useRef<PendingConfirm[]>([])
    const currentRef = useRef<PendingConfirm | null>(null)
    const requestIdRef = useRef(0)
    const [current, setCurrent] = useState<PendingConfirm | null>(null)

    const fallbackStrings = useMemo(
        () => ({
            title: t('pne.confirm.title', { defaultValue: 'Confirm action' }),
            confirmLabel: t('pne.confirm.confirm', { defaultValue: 'Yes' }),
            cancelLabel: t('pne.confirm.cancel', { defaultValue: 'Cancel' }),
            deleteLabel: t('pne.confirm.delete', { defaultValue: 'Delete' }),
        }),
        [t],
    )

    const showNext = useCallback(() => {
        const next = queueRef.current.shift() ?? null
        currentRef.current = next
        setCurrent(next)
    }, [])

    const settle = useCallback(
        (pending: PendingConfirm | null, accepted: boolean) => {
            if (!pending || currentRef.current !== pending) return
            pending.resolve(accepted)
            showNext()
        },
        [showNext],
    )

    const confirm = useCallback(
        (options: PneConfirmOptions = {}) =>
            new Promise<boolean>(resolve => {
                const pending: PendingConfirm = {
                    requestId: ++requestIdRef.current,
                    title: normalizeTitle(options.title) ?? normalizeTitle(defaultOptions?.title) ?? fallbackStrings.title,
                    message: options.message,
                    confirmLabel: options.confirmLabel ?? defaultOptions?.confirmLabel ?? fallbackStrings.confirmLabel,
                    cancelLabel: options.cancelLabel ?? defaultOptions?.cancelLabel ?? fallbackStrings.cancelLabel,
                    danger: options.danger ?? defaultOptions?.danger ?? false,
                    showCancel: options.showCancel ?? defaultOptions?.showCancel ?? true,
                    resolve,
                }

                if (currentRef.current) {
                    queueRef.current.push(pending)
                    return
                }

                currentRef.current = pending
                setCurrent(pending)
            }),
        [defaultOptions?.cancelLabel, defaultOptions?.confirmLabel, defaultOptions?.danger, defaultOptions?.showCancel, defaultOptions?.title, fallbackStrings.cancelLabel, fallbackStrings.confirmLabel, fallbackStrings.title],
    )

    const confirmDestructive = useCallback(
        (options: PneConfirmDestructiveOptions = {}) => confirm({ ...options, danger: true }),
        [confirm],
    )

    const confirmDelete = useCallback(
        (options: PneConfirmDeleteOptions = {}) => confirm({
            title: normalizeTitle(options.title) ?? normalizeTitle(deleteOptions?.title),
            message: options.message,
            confirmLabel: deleteOptions?.confirmLabel ?? fallbackStrings.deleteLabel,
            cancelLabel: options.cancelLabel ?? deleteOptions?.cancelLabel,
            danger: true,
            showCancel: options.showCancel ?? deleteOptions?.showCancel,
        }),
        [confirm, deleteOptions?.cancelLabel, deleteOptions?.confirmLabel, deleteOptions?.showCancel, deleteOptions?.title, fallbackStrings.deleteLabel],
    )

    useEffect(
        () => () => {
            currentRef.current?.resolve(false)
            queueRef.current.forEach(pending => pending.resolve(false))
            queueRef.current = []
            currentRef.current = null
        },
        [],
    )

    const contextValue = useMemo<PneConfirmContextValue>(
        () => ({ confirm, confirmDestructive, confirmDelete }),
        [confirm, confirmDelete, confirmDestructive],
    )

    return (
        <PneConfirmContext.Provider value={contextValue}>
            {children}
            <PneModal
                actions={<PneModalActions
                    secondary={current?.showCancel ? <PneButton
                        key={`confirm-cancel-${current.requestId}`}
                        {...createAutoTestAttributes('alert.button.cancel')}
                        pneStyle='outlined'
                        onClick={() => settle(current, false)}
                    >
                        {current.cancelLabel}
                    </PneButton> : undefined}
                    primary={<PneButton
                        key={`confirm-submit-${current?.requestId ?? 'closed'}`}
                        {...createAutoTestAttributes('alert.button.submit')}
                        pneStyle={current?.danger ? 'error' : 'contained'}
                        onClick={() => settle(current, true)}
                    >
                        {current?.confirmLabel}
                    </PneButton>}
                />}
                closeLabel={current?.cancelLabel ?? fallbackStrings.cancelLabel}
                open={Boolean(current)}
                onClose={() => settle(current, false)}
                slotProps={{
                    closeButton: createAutoTestAttributes('alert.button.close'),
                    container: createAutoTestAttributes('alert.container'),
                }}
                title={current?.title ?? fallbackStrings.title}
                containerSx={{ maxWidth: 560, width: 'calc(100% - 32px)', minWidth: 0 }}
            >
                {current && hasMessage(current.message) ? (
                    <Stack spacing={3}>
                        <Box {...createAutoTestAttributes('alert.message')}>
                            <Typography sx={{ fontSize: '14px', lineHeight: '20px', color: '#4E5D78' }}>
                                {current.message}
                            </Typography>
                        </Box>
                    </Stack>
                ) : null}
            </PneModal>
        </PneConfirmContext.Provider>
    )
}

export const usePneConfirm = (): PneConfirmContextValue => {
    const context = useContext(PneConfirmContext)
    if (!context) {
        throw new Error(MISSING_PROVIDER_ERROR)
    }
    return context
}

export default PneConfirmProvider
