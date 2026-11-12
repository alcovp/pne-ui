import {Alert, IconButton} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import * as React from 'react'
import {resolvePneSemanticPalette} from '../../createTheme'
import type {PneToastTone} from '../../toastPalette'
import {PneCloseIcon} from '../dropdown/dropdownLook'
import {pneIconActionSx} from '../iconActionLook'

export type OverlayToastPresentation = 'toast' | 'banner'

export type OverlayToastProps = {
    /** The consumer's action, for example an undo button; it stands before the close cross. */
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
 * Banner (an error with details): the pale fill of the tone inside a ring of its colour, 12/16
 * inside, the 20px sign of the tone on the left, a 24px close cross.
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
    const isBanner = presentation === 'banner'

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
                sx={pneIconActionSx(isBanner ? 'small' : 'medium', 'var(--pne-toast-text)')}
                title={closeLabel}
                type='button'
            >
                <PneCloseIcon/>
            </IconButton> : null}
        </>}
        data-pne-toast={presentation}
        data-pne-tone={tone}
        elevation={0}
        icon={isBanner ? undefined : false}
        severity={tone}
        sx={overlayToastSx}
    >
        {progress != null ? <span
            aria-hidden='true'
            data-pne-toast-timer='true'
            data-testid='overlay-snackbar-progress'
            style={{transform: `scaleX(${progress})`}}
        /> : null}
        {isBanner ? children : <>
            <span data-pne-toast-title='true'>{children}</span>
            {description != null && description !== ''
                ? <span data-pne-toast-description='true'>{description}</span>
                : null}
        </>}
    </Alert>
})

export default OverlayToast

type Rules = Record<string, SystemStyleObject<Theme>>

const TONES: PneToastTone[] = ['info', 'success', 'warning', 'error']

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
        '& [data-pne-toast-timer]': {
            backgroundColor: 'var(--pne-toast-text)',
            bottom: 0,
            height: '3px',
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
            transformOrigin: 'left',
        },
        // Banner: an error with an identifier and details.
        '&[data-pne-toast="banner"]': {
            alignItems: 'flex-start',
            padding: '12px 16px',
        },
        '&[data-pne-toast="banner"] .MuiAlert-icon': {
            color: 'var(--pne-toast-text)',
            fontSize: '20px',
            marginRight: '12px',
            opacity: 1,
            padding: 0,
        },
        '&[data-pne-toast="banner"] .MuiAlert-message': {
            fontSize: '14px',
            lineHeight: '20px',
        },
        '&[data-pne-toast="banner"] .MuiAlert-action': {
            alignItems: 'flex-start',
            paddingLeft: '12px',
        },
    }
    for (const tone of TONES) {
        const colors = toast[tone]
        rules[`&[data-pne-tone="${tone}"]`] = {
            '--pne-toast-text': colors.text,
            backgroundColor: colors.fill,
        }
        rules[`&[data-pne-toast="banner"][data-pne-tone="${tone}"]`] = {
            backgroundColor: colors.bannerFill,
            boxShadow: `inset 0 0 0 1px ${colors.fill}, ${toast.shadow}`,
        }
    }
    return rules
}
