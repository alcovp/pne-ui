import {Alert, IconButton} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import * as React from 'react'
import {resolvePneSemanticPalette} from '../../createTheme'
import type {PneToastTone} from '../../toastPalette'
import {PneCloseIcon} from '../dropdown/dropdownLook'
import {pneIconActionSx} from '../iconActionLook'
import PneBanner from '../PneBanner'

export type OverlayToastPresentation = 'toast' | 'banner'

export type OverlayToastProps = {
    /**
     * The consumer's action, for example an undo button: before the close cross of a toast, under the
     * text of a banner.
     */
    action?: React.ReactNode
    /** The message: the title of a toast, the whole content of a banner. */
    children: React.ReactNode
    closeLabel?: string
    /** The second line of a toast, in the text colour of its tone. */
    description?: React.ReactNode
    onClose?: () => void
    /** A toast is a short message; a banner is an error with an identifier and details. */
    presentation?: OverlayToastPresentation
    /** How much of the time to live is left, 1…0; without it there is no timer bar. */
    progress?: number | null
    tone?: PneToastTone
    /** The transition of the snackbar animates the card through its style. */
    style?: React.CSSProperties
}

/**
 * One notification of OverlayHost by the UI Kit.
 * Toast: a card filled with the colour of its tone, radius 8, 8/16 inside, the toast shadow; the
 * message as the title (18/26 SemiBold) over an optional description (12/16 in the text colour of
 * the tone); the consumer's action and a 32px close cross on the right, 64px from the text; a 3px
 * timer bar along the bottom that shrinks to the left. No sign of the tone.
 * Banner (an error with details): the library's `PneBanner` as it is - the pale fill of the tone
 * inside a ring of its colour, the sign of the tone, a small close cross - lifted by the toast shadow
 * and carrying the same timer bar.
 */
// The snackbar's transition holds the card by its ref and style, so both go to the root.
const OverlayToast = React.forwardRef<HTMLDivElement, OverlayToastProps>(function OverlayToast({
    action,
    children,
    closeLabel = 'Close',
    description,
    onClose,
    presentation = 'toast',
    progress,
    style,
    tone = 'info',
}, ref) {
    const timer = progress != null ? <span
        aria-hidden='true'
        data-pne-toast-timer='true'
        data-testid='overlay-snackbar-progress'
        style={{transform: `scaleX(${progress})`}}
    /> : null

    if (presentation === 'banner') {
        // A notification interrupts whatever its tone is, as the toast does.
        return <PneBanner
            ref={ref}
            style={style}
            closeLabel={closeLabel}
            data-pne-toast='banner'
            onClose={onClose}
            role='alert'
            sx={overlayBannerSx}
            tone={tone}
        >
            {timer}
            {children}
            {action ? <div data-pne-toast-action='true'>{action}</div> : null}
        </PneBanner>
    }

    return <Alert
        ref={ref}
        style={style}
        action={<>
            {action}
            {onClose ? <IconButton
                aria-label={closeLabel}
                data-pne-toast-close='true'
                disableRipple
                onClick={onClose}
                sx={pneIconActionSx('medium', 'var(--pne-toast-text)')}
                title={closeLabel}
                type='button'
            >
                <PneCloseIcon/>
            </IconButton> : null}
        </>}
        data-pne-toast='toast'
        data-pne-tone={tone}
        elevation={0}
        icon={false}
        severity={tone}
        sx={overlayToastSx}
    >
        {timer}
        <span data-pne-toast-title='true'>{children}</span>
        {description != null && description !== ''
            ? <span data-pne-toast-description='true'>{description}</span>
            : null}
    </Alert>
})

export default OverlayToast

type Rules = Record<string, SystemStyleObject<Theme>>

const TONES: PneToastTone[] = ['info', 'success', 'warning', 'error']

const timerBarStyle = (color: string): SystemStyleObject<Theme> => ({
    backgroundColor: color,
    bottom: 0,
    height: '3px',
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
})

/**
 * What a notification adds to the banner of a page: the whole width of the stack, the toast shadow
 * over the ring of the tone and the timer bar along the bottom.
 */
const overlayBannerSx: SxProps<Theme> = theme => {
    const toast = resolvePneSemanticPalette(theme).toast
    const rules: Rules = {
        '&': {
            maxWidth: '100%',
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
        },
        '& [data-pne-toast-timer]': timerBarStyle('var(--pne-banner-text)'),
        '& [data-pne-toast-action]': {
            marginTop: '4px',
        },
    }
    for (const tone of TONES) {
        rules[`&[data-pne-tone="${tone}"]`] = {
            boxShadow: `inset 0 0 0 1px ${toast[tone].fill}, ${toast.shadow}`,
        }
    }
    return rules
}

const overlayToastSx: SxProps<Theme> = theme => {
    const toast = resolvePneSemanticPalette(theme).toast
    const rules: Rules = {
        '&': {
            alignItems: 'center',
            borderRadius: '8px',
            boxShadow: toast.shadow,
            boxSizing: 'border-box',
            color: toast.title,
            maxWidth: '100%',
            overflow: 'hidden',
            padding: '8px 16px',
            position: 'relative',
            width: '100%',
        },
        '& .MuiAlert-message': {
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'visible',
            padding: 0,
        },
        // The actions keep 64px from the text; on a phone the text needs that room itself.
        '& .MuiAlert-action': {
            alignItems: 'center',
            display: 'flex',
            flex: '0 0 auto',
            gap: '8px',
            margin: 0,
            padding: '0 0 0 64px',
            '@media (max-width: 480px)': {
                paddingLeft: '16px',
            },
        },
        '& [data-pne-toast-title]': {
            fontSize: '18px',
            fontWeight: 600,
            lineHeight: '26px',
            overflowWrap: 'anywhere',
        },
        '& [data-pne-toast-description]': {
            color: 'var(--pne-toast-text)',
            fontSize: '12px',
            lineHeight: '16px',
            overflowWrap: 'anywhere',
        },
        '& [data-pne-toast-timer]': timerBarStyle('var(--pne-toast-text)'),
    }
    for (const tone of TONES) {
        const colors = toast[tone]
        rules[`&[data-pne-tone="${tone}"]`] = {
            '--pne-toast-text': colors.text,
            backgroundColor: colors.fill,
        }
    }
    return rules
}
