import * as React from 'react'
import {Box, IconButton} from '@mui/material'
import type {BoxProps} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import {resolvePneSemanticPalette} from '../createTheme'
import type {PneToastTone} from '../toastPalette'
import {PneCloseIcon} from './dropdown/dropdownLook'
import {pneIconActionSx} from './iconActionLook'

export type PneBannerTone = PneToastTone

type ActionDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export type PneBannerActionProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onClick' | 'type'
> & ActionDataAttributes

export type PneBannerProps = Omit<BoxProps<'div'>, 'children' | 'title'> & {
    /** What the message is about: a note, a success, a warning or an error. `info` by default. */
    tone?: PneBannerTone
    /** A short heading over the text. */
    title?: React.ReactNode
    /** The text of the message. */
    children?: React.ReactNode
    /** The label of the action under the text: a link that acts in place («Retry», «Change the limit»). */
    actionLabel?: React.ReactNode
    onAction?: () => void
    /** Props of the action button: `disabled`, a locator, an accessible name. */
    actionProps?: PneBannerActionProps
    /** Shows the close cross. */
    onClose?: () => void
    closeLabel?: string
    /** The sign of the tone on the left; `false` hides it. */
    icon?: boolean
}

// UI Kit IcStatusInfo, IcActionApprove, IcStatusWarning and IcStatusBlock.
const TONE_GLYPH: Record<PneBannerTone, React.ReactNode> = {
    info: <><circle cx={12} cy={12} r={9}/><path d='M11 11h1v6M12 7.6v.2'/></>,
    success: <path d='M5 14l3.5 3.5L19 6.5'/>,
    warning: <path d='M12 4.5 3.5 19h17L12 4.5ZM12 10v4.5M12 17v.2'/>,
    error: <><circle cx={12} cy={12} r={9}/><path d='M6 6l12 12'/></>,
}

const bannerSx: SxProps<Theme> = theme => {
    const pne = resolvePneSemanticPalette(theme)
    const rules: Record<string, Record<string, string | number>> = {
        '&': {
            alignItems: 'flex-start',
            borderRadius: '8px',
            boxSizing: 'border-box',
            color: pne.toast.title,
            display: 'flex',
            fontSize: '14px',
            gap: '12px',
            lineHeight: '20px',
            padding: '12px 16px',
        },
        '& [data-pne-banner-sign]': {
            color: 'var(--pne-banner-text)',
            flexShrink: 0,
            height: '20px',
            width: '20px',
        },
        '& [data-pne-banner-content]': {
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            gap: '4px',
            minWidth: 0,
            overflowWrap: 'anywhere',
        },
        '& [data-pne-banner-title]': {
            fontWeight: 600,
        },
        '& [data-pne-banner-action]': {
            alignSelf: 'flex-start',
            appearance: 'none',
            background: 'none',
            border: 'none',
            color: pne.link,
            cursor: 'pointer',
            font: 'inherit',
            margin: 0,
            padding: 0,
            textAlign: 'left',
        },
        '& [data-pne-banner-action]:hover:not(:disabled)': {
            textDecoration: 'underline',
        },
        '& [data-pne-banner-action]:disabled': {
            color: theme.palette.text.disabled,
            cursor: 'default',
        },
        '& [data-pne-banner-action]:focus-visible': {
            borderRadius: '2px',
            outline: `2px solid ${pne.focusRing}`,
            outlineOffset: '2px',
        },
    }
    for (const tone of ['info', 'success', 'warning', 'error'] as const) {
        const colors = pne.toast[tone]
        rules[`&[data-pne-tone="${tone}"]`] = {
            '--pne-banner-text': colors.text,
            backgroundColor: colors.bannerFill,
            boxShadow: `inset 0 0 0 1px ${colors.fill}`,
        }
    }
    return rules
}

/**
 * A message built into the page (UI Kit Banner): the pale fill of its tone inside a ring of the tone,
 * radius 8, the 20px sign of the tone on the left, then a title, the text and an action link, and a
 * small close cross on the right. An error is announced as an alert, the other tones as a status.
 */
const PneBanner = React.forwardRef<HTMLDivElement, PneBannerProps>(function PneBanner(props, ref) {
    const {
        actionLabel,
        actionProps,
        children,
        closeLabel = 'Close',
        icon = true,
        onAction,
        onClose,
        sx,
        title,
        tone = 'info',
        ...rest
    } = props
    const hasTitle = title !== undefined && title !== null && title !== false && title !== ''
    const hasText = children !== undefined && children !== null && children !== false && children !== ''

    return <Box
        role={tone === 'error' ? 'alert' : 'status'}
        {...rest}
        data-pne-banner='true'
        data-pne-tone={tone}
        ref={ref}
        sx={[bannerSx, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}
    >
        {icon ? <svg
            aria-hidden='true'
            data-pne-banner-sign='true'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            viewBox='0 0 24 24'
        >
            {TONE_GLYPH[tone]}
        </svg> : null}
        <div data-pne-banner-content='true'>
            {hasTitle ? <div data-pne-banner-title='true'>{title}</div> : null}
            {/* A block: the text may hold paragraphs or a progress bar of the consumer. */}
            {hasText ? <div data-pne-banner-text='true'>{children}</div> : null}
            {actionLabel ? <button {...actionProps} data-pne-banner-action='true' onClick={onAction} type='button'>
                {actionLabel}
            </button> : null}
        </div>
        {onClose ? <IconButton
            aria-label={closeLabel}
            data-pne-banner-close='true'
            disableRipple
            onClick={onClose}
            sx={pneIconActionSx('small', 'var(--pne-banner-text)')}
            title={closeLabel}
            type='button'
        >
            <PneCloseIcon/>
        </IconButton> : null}
    </Box>
})

export default PneBanner
