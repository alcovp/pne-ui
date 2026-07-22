import React from 'react'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import { AlertTitle, Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import PneModal, { type PneModalRootProps } from '../PneModal'
import { OverlayPortalContainerContext } from './OverlayPortalContainerContext'
import type { NormalizedPaynetError } from './types'

export type PaynetErrorContentProps = {
    error: NormalizedPaynetError
}

const MISSING_TRANSLATION = '\u0000pne-missing-translation\u0000'
const LONG_DETAILS_CHARACTER_THRESHOLD = 600
const LONG_DETAILS_LINE_THRESHOLD = 8
const DETAILS_PREVIEW_MAX_CHARACTERS = 300
const DETAILS_PREVIEW_MAX_LINES = 3
const ERROR_ID_PLACEHOLDER = '{errorId}'
const COPY_FEEDBACK_DURATION_MS = 2000
const ERROR_BODY_TEXT_SX = {
    fontSize: 14,
    lineHeight: '20px',
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
} as const

const replaceErrorId = (message: string, errorId?: string): string =>
    errorId ? message.split(ERROR_ID_PLACEHOLDER).join(errorId) : message

const isLongDetails = (details: string): boolean =>
    details.length > LONG_DETAILS_CHARACTER_THRESHOLD
    || details.split('\n').length > LONG_DETAILS_LINE_THRESHOLD

const createDetailsPreview = (details: string): string => {
    const lines = details.split('\n').slice(0, DETAILS_PREVIEW_MAX_LINES)
    const linePreview = lines.join('\n')
    const preview = linePreview.length > DETAILS_PREVIEW_MAX_CHARACTERS
        ? linePreview.slice(0, DETAILS_PREVIEW_MAX_CHARACTERS)
        : linePreview

    return `${preview.trimEnd()}\n…`
}

const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch {
            // Fall through to the legacy path. Clipboard access can be denied
            // in embedded or non-secure application contexts.
        }
    }

    if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.left = '-9999px'
    textarea.style.position = 'fixed'
    document.body.appendChild(textarea)
    textarea.select()

    try {
        return document.execCommand('copy')
    } catch {
        return false
    } finally {
        textarea.remove()
    }
}

const CopyableErrorId = ({ errorId }: { errorId: string }) => {
    const { t } = useTranslation()
    const [copied, setCopied] = React.useState(false)
    const mounted = React.useRef(true)
    const resetTimer = React.useRef<number | undefined>(undefined)
    const copyLabel = String(t('pne.error.copyErrorId', { defaultValue: 'Copy error ID' }))
    const copiedLabel = String(t('pne.error.errorIdCopied', { defaultValue: 'Error ID copied' }))

    React.useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
            if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current)
        }
    }, [])

    const handleCopy = async () => {
        if (!await copyTextToClipboard(errorId) || !mounted.current) return

        setCopied(true)
        if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current)
        resetTimer.current = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS)
    }

    return (
        <ButtonBase
            aria-label={copied ? copiedLabel : `${copyLabel}: ${errorId}`}
            aria-live='polite'
            component='span'
            data-copy-state={copied ? 'copied' : 'idle'}
            data-name='copy-error-id'
            disableRipple
            onClick={() => void handleCopy()}
            title={copied ? copiedLabel : copyLabel}
            sx={{
                borderRadius: 0.5,
                color: 'inherit',
                display: 'inline',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                mx: 0.25,
                px: 0.25,
                verticalAlign: 'baseline',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                '&.Mui-focusVisible': {
                    outline: '2px solid currentColor',
                    outlineOffset: 1,
                },
            }}
        >
            <Box
                component='span'
                data-name='error-id-value'
                sx={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontWeight: 600,
                    overflowWrap: 'anywhere',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    wordBreak: 'break-all',
                }}
            >
                {errorId.slice(0, -1)}
                <Box component='span' data-name='error-id-tail' sx={{ whiteSpace: 'nowrap' }}>
                    {errorId.slice(-1)}
                    {copied ? (
                        <CheckOutlinedIcon
                            data-name='error-id-copied-icon'
                            sx={{ color: 'success.main', fontSize: 15, ml: 0.375, verticalAlign: '-2px' }}
                        />
                    ) : (
                        <ContentCopyOutlinedIcon
                            data-name='error-id-copy-icon'
                            sx={{ fontSize: 14, ml: 0.375, verticalAlign: '-2px' }}
                        />
                    )}
                </Box>
            </Box>
        </ButtonBase>
    )
}

const renderMessage = (message: string, errorId?: string): React.ReactNode => {
    if (!errorId || !message.includes(ERROR_ID_PLACEHOLDER)) return message

    const parts = message.split(ERROR_ID_PLACEHOLDER)
    return parts.map((part, index) => (
        <React.Fragment key={`${index}-${part}`}>
            {part}
            {index < parts.length - 1 ? <CopyableErrorId errorId={errorId} /> : null}
        </React.Fragment>
    ))
}

/** Shared rich presentation for Paynet errors in an overlay or inline state. */
export const PaynetErrorContent = ({ error }: PaynetErrorContentProps) => {
    const { t } = useTranslation()
    const [detailsOpen, setDetailsOpen] = React.useState(false)
    const overlayPortalContainer = React.useContext(OverlayPortalContainerContext)
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
    const presentableMessageTemplate = !error.errorId && messageTemplate.includes(ERROR_ID_PLACEHOLDER)
        ? genericMessage
        : messageTemplate
    const resolvedMessage = replaceErrorId(presentableMessageTemplate, error.errorId)
    const showValidation = translatedValidation && translatedValidation !== resolvedMessage
    const longDetails = Boolean(error.details && isLongDetails(error.details))
    const inlineDetails = error.details && longDetails
        ? createDetailsPreview(error.details)
        : error.details
    const detailsLabel = String(t('pne.error.details', { defaultValue: 'Details' }))
    const detailsModalContainer = overlayPortalContainer === null
        ? undefined
        : overlayPortalContainer as PneModalRootProps['container']

    return (
        <Box
            data-pne-paynet-error
            sx={{ minWidth: 0, width: 344, maxWidth: '100%' }}
        >
            <AlertTitle
                data-name='error-title'
                sx={{ mb: 0.5, fontSize: 14, fontWeight: 700, lineHeight: '20px' }}
            >
                {title}
            </AlertTitle>
            <Stack spacing={0.75}>
                <Typography
                    data-name='error-message'
                    component='div'
                    sx={ERROR_BODY_TEXT_SX}
                >
                    {renderMessage(presentableMessageTemplate, error.errorId)}
                </Typography>
                {showValidation ? (
                    <Typography
                        data-name='error-validation-message'
                        component='div'
                        sx={{ fontSize: 13, lineHeight: '18px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                    >
                        {translatedValidation}
                    </Typography>
                ) : null}
                {inlineDetails ? (
                    <Box
                        data-name='error-details-section'
                        sx={{ borderColor: 'divider', borderTop: '1px solid', minWidth: 0, pt: 0.75 }}
                    >
                        <Typography
                            component='div'
                            data-name='error-details'
                            sx={ERROR_BODY_TEXT_SX}
                        >
                            {inlineDetails}
                        </Typography>
                        {longDetails ? (
                            <ButtonBase
                                data-name='open-error-details'
                                onClick={() => setDetailsOpen(true)}
                                sx={{
                                    borderRadius: 0.5,
                                    color: 'inherit',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    lineHeight: '18px',
                                    mt: 0.5,
                                    px: 0.25,
                                    py: 0.25,
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '2px',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                    '&.Mui-focusVisible': {
                                        outline: '2px solid currentColor',
                                        outlineOffset: 1,
                                    },
                                }}
                            >
                                {t('pne.error.showFullDetails', { defaultValue: 'Show full details' })}
                            </ButtonBase>
                        ) : null}
                    </Box>
                ) : null}
            </Stack>
            {error.details && longDetails ? (
                <PneModal
                    closeLabel={String(t('pne.error.closeDetails', { defaultValue: 'Close details' }))}
                    containerSx={{ width: 'min(680px, calc(100vw - 32px))' }}
                    modalProps={{
                        container: detailsModalContainer,
                        sx: { zIndex: theme => theme.zIndex.snackbar + 1 },
                    }}
                    onClose={() => setDetailsOpen(false)}
                    open={detailsOpen}
                    title={detailsLabel}
                >
                    <Box
                        component='pre'
                        data-name='error-details-dialog'
                        sx={{
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            boxSizing: 'border-box',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: 12,
                            lineHeight: '18px',
                            m: 0,
                            overflowX: 'auto',
                            p: 1.5,
                            whiteSpace: 'pre',
                        }}
                    >
                        {error.details}
                    </Box>
                </PneModal>
            ) : null}
        </Box>
    )
}

export default PaynetErrorContent
