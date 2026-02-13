import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PneButton from '../PneButton'
import PneModal from '../PneModal'

export type PneConfirmOptions = {
    title?: string
    message: React.ReactNode
    confirmLabel?: string
    cancelLabel?: string
}

export type PneConfirmProviderProps = {
    children: React.ReactNode
    defaultOptions?: Partial<Omit<PneConfirmOptions, 'message'>>
}

type PendingConfirm = {
    title: string
    message: React.ReactNode
    confirmLabel: string
    cancelLabel: string
    resolve: (accepted: boolean) => void
}

type PneConfirmContextValue = {
    confirm: (options: PneConfirmOptions) => Promise<boolean>
}

const PneConfirmContext = createContext<PneConfirmContextValue | null>(null)

const MISSING_PROVIDER_ERROR = 'usePneConfirm must be used within <PneConfirmProvider>'

export const PneConfirmProvider = ({ children, defaultOptions }: PneConfirmProviderProps) => {
    const { t } = useTranslation()
    const queueRef = useRef<PendingConfirm[]>([])
    const currentRef = useRef<PendingConfirm | null>(null)
    const [current, setCurrent] = useState<PendingConfirm | null>(null)

    const fallbackStrings = useMemo(
        () => ({
            title: t('react.confirm-alert.title.are-you-sure', { defaultValue: 'Are you sure?' }),
            confirmLabel: t('react.confirm-alert.yes', { defaultValue: 'Yes' }),
            cancelLabel: t('react.confirm-alert.no.cancel', { defaultValue: 'Cancel' }),
        }),
        [t],
    )

    const showNext = useCallback(() => {
        const next = queueRef.current.shift() ?? null
        currentRef.current = next
        setCurrent(next)
    }, [])

    const settle = useCallback(
        (accepted: boolean) => {
            const pending = currentRef.current
            if (!pending) return
            pending.resolve(accepted)
            showNext()
        },
        [showNext],
    )

    const confirm = useCallback(
        (options: PneConfirmOptions) =>
            new Promise<boolean>(resolve => {
                const pending: PendingConfirm = {
                    title: options.title ?? defaultOptions?.title ?? fallbackStrings.title,
                    message: options.message,
                    confirmLabel: options.confirmLabel ?? defaultOptions?.confirmLabel ?? fallbackStrings.confirmLabel,
                    cancelLabel: options.cancelLabel ?? defaultOptions?.cancelLabel ?? fallbackStrings.cancelLabel,
                    resolve,
                }

                if (currentRef.current) {
                    queueRef.current.push(pending)
                    return
                }

                currentRef.current = pending
                setCurrent(pending)
            }),
        [defaultOptions?.cancelLabel, defaultOptions?.confirmLabel, defaultOptions?.title, fallbackStrings.cancelLabel, fallbackStrings.confirmLabel, fallbackStrings.title],
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

    const contextValue = useMemo<PneConfirmContextValue>(() => ({ confirm }), [confirm])

    return (
        <PneConfirmContext.Provider value={contextValue}>
            {children}
            <PneModal
                open={Boolean(current)}
                onClose={() => settle(false)}
                title={current?.title}
                containerSx={{ maxWidth: 560, width: 'calc(100% - 32px)', minWidth: 0 }}
            >
                <Stack spacing={3}>
                    <Box>
                        <Typography sx={{ fontSize: '14px', lineHeight: '20px', color: '#4E5D78' }}>
                            {current?.message}
                        </Typography>
                    </Box>
                    <Stack direction='row' spacing={1} justifyContent='flex-end'>
                        <PneButton pneStyle='text' color='pneNeutral' onClick={() => settle(false)}>
                            {current?.cancelLabel}
                        </PneButton>
                        <PneButton pneStyle='contained' onClick={() => settle(true)}>
                            {current?.confirmLabel}
                        </PneButton>
                    </Stack>
                </Stack>
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
