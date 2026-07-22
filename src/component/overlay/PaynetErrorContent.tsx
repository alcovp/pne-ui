import React from 'react'
import { AlertTitle, Box, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { NormalizedPaynetError } from './types'

export type PaynetErrorContentProps = {
    error: NormalizedPaynetError
}

const MISSING_TRANSLATION = '\u0000pne-missing-translation\u0000'

const replaceErrorId = (message: string, errorId?: string): string =>
    errorId ? message.split('{errorId}').join(errorId) : message

/** Shared rich presentation for Paynet errors in an overlay or inline state. */
export const PaynetErrorContent = ({ error }: PaynetErrorContentProps) => {
    const { t } = useTranslation()
    const title = t('react.unexpected.exception.title', { defaultValue: 'Error' })

    const translateOptional = (key?: string): string | undefined => {
        if (!key) return undefined
        const translated = String(t(key, { defaultValue: MISSING_TRANSLATION }))
        return translated === MISSING_TRANSLATION || translated.trim().length === 0 ? undefined : translated
    }

    const translatedMessageId = translateOptional(error.messageId)
    const translatedValidation = translateOptional(error.errorI18N)
    const genericMessage = String(t(
        'react.unexpected.exception.unknown-message',
        { defaultValue: 'Internal server error' },
    ))
    // `message` is an already-presentable literal (for example Error.message
    // or a legacy title). Only backend i18n fields are passed to `t`.
    const messageTemplate = error.messageId
        ? translatedMessageId ?? translatedValidation ?? genericMessage
        : error.message ?? translatedValidation ?? genericMessage
    const message = replaceErrorId(messageTemplate, error.errorId)
    const showSeparateErrorId = error.errorId && !messageTemplate.includes('{errorId}')
    const showValidation = translatedValidation && translatedValidation !== message

    return (
        <Box data-pne-paynet-error sx={{ minWidth: 0, width: '100%', maxWidth: 480 }}>
            <AlertTitle data-name='error-title'>{title}</AlertTitle>
            <Stack spacing={1}>
                <Typography
                    data-name='error-message'
                    component='div'
                    sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                    {message}
                </Typography>
                {showSeparateErrorId ? (
                    <Typography data-name='error-id' component='div' sx={{ overflowWrap: 'anywhere' }}>
                        <strong>{t('pne.error.errorId', { defaultValue: 'Error ID' })}:</strong>{' '}
                        {error.errorId}
                    </Typography>
                ) : null}
                {showValidation ? (
                    <Typography
                        data-name='error-validation-message'
                        component='div'
                        sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                    >
                        {translatedValidation}
                    </Typography>
                ) : null}
                {error.errorType ? (
                    <Typography data-name='error-type' component='div' sx={{ overflowWrap: 'anywhere' }}>
                        <strong>{t('pne.error.type', { defaultValue: 'Type' })}:</strong>{' '}
                        {error.errorType}
                    </Typography>
                ) : null}
                {error.httpStatus !== undefined ? (
                    <Typography data-name='error-status' component='div'>
                        <strong>{t('pne.error.status', { defaultValue: 'Status' })}:</strong>{' '}
                        {error.httpStatus}
                    </Typography>
                ) : null}
                {error.details ? (
                    <Box
                        data-name='error-details'
                        sx={{
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            pt: 1,
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                            maxHeight: 140,
                            overflow: 'auto',
                        }}
                    >
                        {error.details}
                    </Box>
                ) : null}
            </Stack>
        </Box>
    )
}

export default PaynetErrorContent
