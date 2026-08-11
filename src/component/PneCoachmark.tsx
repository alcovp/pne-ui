import CloseIcon from '@mui/icons-material/Close'
import Box, {type BoxProps} from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popper, {type PopperProps} from '@mui/material/Popper'
import Portal from '@mui/material/Portal'
import Typography from '@mui/material/Typography'
import {styled, type SxProps, type Theme} from '@mui/material/styles'
import * as React from 'react'
import type {
    PneModalBoxSlotProps,
    PneModalCloseButtonProps,
    PneModalContainerProps,
    PneModalContainerSlotProps,
    PneModalDataAttributes,
    PneModalSubtitleSlotProps,
    PneModalTitleSlotProps,
} from './PneModal'
import {
    PneSurface,
    PneSurfaceBody,
    PneSurfaceFooter,
    PneSurfaceHeader,
    pneSurfaceCloseButtonSx,
    pneSurfaceSubtitleSx,
    getPneSurfaceTitleSx,
} from './internal/PneSurface'

export type PneCoachmarkDataAttributes = PneModalDataAttributes

export type PneCoachmarkAnchor = PopperProps['anchorEl']
export type PneCoachmarkPlacement = NonNullable<PopperProps['placement']>
export type PneCoachmarkModifiers = PopperProps['modifiers']

export type PneCoachmarkCloseReason = 'closeButtonClick' | 'escapeKeyDown'
export type PneCoachmarkCloseEvent = React.SyntheticEvent | Event
export type PneCoachmarkCloseHandler = (
    event: PneCoachmarkCloseEvent,
    reason: PneCoachmarkCloseReason,
) => void

export type PneCoachmarkContainerProps = PneModalContainerProps
export type PneCoachmarkContainerSlotProps = PneModalContainerSlotProps
export type PneCoachmarkBoxSlotProps = PneModalBoxSlotProps
export type PneCoachmarkCloseButtonProps = PneModalCloseButtonProps
export type PneCoachmarkTitleSlotProps = PneModalTitleSlotProps
export type PneCoachmarkSubtitleSlotProps = PneModalSubtitleSlotProps

export type PneCoachmarkPopperSlotProps = Pick<PopperProps, 'className' | 'sx'>
    & PneCoachmarkDataAttributes

export type PneCoachmarkFallbackSlotProps = Omit<
    BoxProps<'div'>,
    'children' | 'component' | 'dangerouslySetInnerHTML'
> & PneCoachmarkDataAttributes

export interface PneCoachmarkSlotProps {
    body?: PneCoachmarkBoxSlotProps
    closeButton?: PneCoachmarkCloseButtonProps
    container?: PneCoachmarkContainerSlotProps
    fallback?: PneCoachmarkFallbackSlotProps
    footer?: PneCoachmarkBoxSlotProps
    header?: PneCoachmarkBoxSlotProps
    popper?: PneCoachmarkPopperSlotProps
    subtitle?: PneCoachmarkSubtitleSlotProps
    title?: PneCoachmarkTitleSlotProps
}

export type PneCoachmarkTitle = React.ReactNode

type PneCoachmarkAccessibleName =
    | {
        /** Fallback used when the title value is null or empty. Components that render null must be omitted explicitly. */
        ariaLabel?: string
        title: PneCoachmarkTitle
    }
    | {
        ariaLabel: string
        title?: null
    }

type PneCoachmarkOwnProps = {
    actions?: React.ReactNode
    anchorEl?: PneCoachmarkAnchor
    ariaDescribedBy?: string
    children?: React.ReactNode
    className?: string
    /** Optional localized label. Falls back to `Close`. */
    closeLabel?: string
    container?: PopperProps['container']
    containerSx?: SxProps<Theme>
    disableEscapeKeyDown?: boolean
    disablePortal?: boolean
    hideCloseButton?: boolean
    modifiers?: PneCoachmarkModifiers
    onClose: PneCoachmarkCloseHandler
    open: boolean
    placement?: PneCoachmarkPlacement
    slotProps?: PneCoachmarkSlotProps
    subtitle?: React.ReactNode
}

export type PneCoachmarkProps = PneCoachmarkOwnProps
    & PneCoachmarkAccessibleName
    & PneCoachmarkDataAttributes

const defaultModifiers: NonNullable<PneCoachmarkModifiers> = [
    {name: 'offset', options: {offset: [0, 8]}},
    {name: 'preventOverflow', options: {padding: 16}},
    {name: 'flip', options: {padding: 16}},
]

const PneCoachmark = React.forwardRef<HTMLDivElement, PneCoachmarkProps>(
    function PneCoachmark(props, ref) {
        const {
            actions,
            anchorEl,
            ariaDescribedBy,
            ariaLabel,
            children,
            className,
            closeLabel = 'Close',
            container,
            containerSx,
            disableEscapeKeyDown = false,
            disablePortal = false,
            hideCloseButton = false,
            modifiers = defaultModifiers,
            onClose,
            open,
            placement = 'bottom-start',
            slotProps,
            subtitle,
            title,
            ...directContainerDataAttributes
        } = props
        const generatedTitleId = React.useId()
        const generatedSubtitleId = React.useId()
        const hasTitle = hasRenderableContent(title)
        const hasSubtitle = hasRenderableContent(subtitle)
        const titleId = hasTitle ? generatedTitleId : undefined
        const subtitleId = hasSubtitle ? generatedSubtitleId : undefined
        const resolvedAriaLabel = normalizeLabel(ariaLabel)
        const resolvedAnchor = resolveAnchor(anchorEl)

        warnAboutMissingAccessibleName(open, hasTitle, resolvedAriaLabel)

        React.useEffect(() => {
            if (!open || disableEscapeKeyDown) return undefined

            const ownerDocument = resolveOwnerDocument(resolvedAnchor, container)
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key !== 'Escape') return
                event.preventDefault()
                onClose(event, 'escapeKeyDown')
            }

            ownerDocument.addEventListener('keydown', handleKeyDown)
            return () => ownerDocument.removeEventListener('keydown', handleKeyDown)
        }, [container, disableEscapeKeyDown, onClose, open, resolvedAnchor])

        if (!open) return null

        const resolvedContainerProps = sanitizeContainerProps({
            ...slotProps?.container,
            ...pickDataAttributes(directContainerDataAttributes),
        })
        const {
            sx: containerSlotSx,
            ...forwardedContainerProps
        } = resolvedContainerProps
        const resolvedCloseButtonProps = sanitizeCloseButtonProps(slotProps?.closeButton ?? {})
        const {
            'aria-label': closeButtonAriaLabel,
            ...forwardedCloseButtonProps
        } = resolvedCloseButtonProps
        const forwardedHeaderProps = sanitizeFixedElementProps(slotProps?.header)
        const forwardedBodyProps = sanitizeFixedElementProps(slotProps?.body)
        const forwardedFooterProps = sanitizeFixedElementProps(slotProps?.footer)
        const {
            sx: popperSx,
            ...forwardedPopperProps
        } = sanitizeFixedElementProps(slotProps?.popper)
        const {
            sx: fallbackSx,
            ...forwardedFallbackProps
        } = sanitizeFixedElementProps(slotProps?.fallback)
        const {
            component: titleComponent,
            sx: titleSx,
            ...forwardedTitleProps
        } = sanitizeTitleSlotProps(slotProps?.title)
        const {
            component: subtitleComponent,
            sx: subtitleSx,
            ...forwardedSubtitleProps
        } = sanitizeSubtitleSlotProps(slotProps?.subtitle)
        const resolvedCloseLabel = normalizeLabel(closeButtonAriaLabel)
            ?? normalizeLabel(closeLabel)
            ?? 'Close'

        const handleCloseButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            onClose(event, 'closeButtonClick')
        }

        const surface = <CoachmarkSurface
            {...forwardedContainerProps}
            aria-describedby={mergeIds(subtitleId, ariaDescribedBy)}
            aria-label={hasTitle ? undefined : resolvedAriaLabel}
            aria-labelledby={titleId}
            aria-modal='false'
            className={className}
            data-pne-coachmark-container='true'
            ref={ref}
            role='dialog'
            sx={[
                ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
                ...(Array.isArray(containerSlotSx) ? containerSlotSx : [containerSlotSx]),
            ]}
        >
            {(hasTitle || hasSubtitle || !hideCloseButton) && <PneSurfaceHeader
                {...forwardedHeaderProps}
                data-pne-coachmark-header='true'
            >
                <div>
                    {hasTitle && <Typography
                        {...forwardedTitleProps}
                        component={titleComponent ?? 'h3'}
                        id={titleId}
                        sx={[
                            getPneSurfaceTitleSx(forwardedTitleProps.color !== undefined),
                            ...(Array.isArray(titleSx) ? titleSx : [titleSx]),
                        ]}
                    >
                        {title}
                    </Typography>}
                    {hasSubtitle && <Typography
                        {...forwardedSubtitleProps}
                        component={subtitleComponent ?? 'span'}
                        id={subtitleId}
                        sx={[
                            pneSurfaceSubtitleSx,
                            ...(Array.isArray(subtitleSx) ? subtitleSx : [subtitleSx]),
                        ]}
                    >
                        {subtitle}
                    </Typography>}
                </div>
                {!hideCloseButton && <IconButton
                    {...forwardedCloseButtonProps}
                    aria-label={resolvedCloseLabel}
                    onClick={handleCloseButtonClick}
                    sx={pneSurfaceCloseButtonSx}
                    type='button'
                >
                    <CloseIcon fontSize='small'/>
                </IconButton>}
            </PneSurfaceHeader>}
            {children != null && <PneSurfaceBody
                {...forwardedBodyProps}
                data-pne-coachmark-body='true'
            >
                {children}
            </PneSurfaceBody>}
            {actions != null && <PneSurfaceFooter
                {...forwardedFooterProps}
                data-pne-coachmark-footer='true'
            >
                {actions}
            </PneSurfaceFooter>}
        </CoachmarkSurface>

        if (resolvedAnchor) {
            return <Popper
                {...forwardedPopperProps}
                anchorEl={anchorEl}
                container={container}
                data-pne-coachmark-popper='true'
                disablePortal={disablePortal}
                modifiers={modifiers}
                open
                placement={placement}
                sx={[
                    {zIndex: (theme: Theme) => theme.zIndex.tooltip},
                    ...(Array.isArray(popperSx) ? popperSx : [popperSx]),
                ]}
            >
                {surface}
            </Popper>
        }

        return <Portal container={container} disablePortal={disablePortal}>
            <Fallback
                {...forwardedFallbackProps}
                data-pne-coachmark-fallback='true'
                sx={[
                    {
                        zIndex: (theme: Theme) => theme.zIndex.tooltip,
                    },
                    ...(Array.isArray(fallbackSx) ? fallbackSx : [fallbackSx]),
                ]}
            >
                {surface}
            </Fallback>
        </Portal>
    },
)

export default PneCoachmark

const resolveAnchor = (
    anchorEl: PneCoachmarkAnchor,
): Exclude<NonNullable<PneCoachmarkAnchor>, (...args: never[]) => unknown> | undefined => {
    const resolvedAnchor = typeof anchorEl === 'function' ? anchorEl() : anchorEl
    return resolvedAnchor ?? undefined
}

const resolveOwnerDocument = (
    anchor: ReturnType<typeof resolveAnchor>,
    container: PopperProps['container'],
): Document => {
    const anchorNode = anchor && 'nodeType' in anchor ? anchor : anchor?.contextElement
    if (anchorNode?.ownerDocument) return anchorNode.ownerDocument

    const resolvedContainer = typeof container === 'function' ? container() : container
    return resolvedContainer?.ownerDocument ?? document
}

const hasRenderableContent = (value: React.ReactNode): boolean => {
    if (typeof value === 'string') return value.trim().length > 0
    return React.Children.toArray(value).length > 0
}

const sanitizeFixedElementProps = <Props extends object>(props?: Props): Props => {
    const safeProps: Record<string, unknown> = {...props}
    delete safeProps.as
    delete safeProps.children
    delete safeProps.component
    delete safeProps.dangerouslySetInnerHTML
    return safeProps as Props
}

const sanitizeContainerProps = (
    props: PneCoachmarkContainerProps & {sx?: SxProps<Theme>},
): PneCoachmarkContainerProps & {sx?: SxProps<Theme>} => {
    const safeProps: Record<string, unknown> = sanitizeFixedElementProps(props)
    delete safeProps['aria-describedby']
    delete safeProps['aria-hidden']
    delete safeProps['aria-label']
    delete safeProps['aria-labelledby']
    delete safeProps['aria-modal']
    delete safeProps.className
    delete safeProps.hidden
    delete safeProps.inert
    delete safeProps.role
    delete safeProps.style
    return safeProps as PneCoachmarkContainerProps & {sx?: SxProps<Theme>}
}

const sanitizeCloseButtonProps = (
    props: PneCoachmarkCloseButtonProps,
): PneCoachmarkCloseButtonProps => {
    const safeProps: Record<string, unknown> = sanitizeFixedElementProps(props)
    delete safeProps.href
    delete safeProps.LinkComponent
    delete safeProps.to
    delete safeProps.type
    return safeProps as PneCoachmarkCloseButtonProps
}

const headingComponents = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

const sanitizeTitleSlotProps = (
    props?: PneCoachmarkTitleSlotProps,
): PneCoachmarkTitleSlotProps => {
    const component = (props as {component?: unknown} | undefined)?.component
    const safeProps = sanitizeFixedElementProps(props ?? {}) as PneCoachmarkTitleSlotProps
    safeProps.component = typeof component === 'string' && headingComponents.has(component)
        ? component as NonNullable<PneCoachmarkTitleSlotProps['component']>
        : 'h3'
    delete (safeProps as Record<string, unknown>).id
    return safeProps
}

const sanitizeSubtitleSlotProps = (
    props?: PneCoachmarkSubtitleSlotProps,
): PneCoachmarkSubtitleSlotProps => {
    const component = (props as {component?: unknown} | undefined)?.component
    const safeProps = sanitizeFixedElementProps(props ?? {}) as PneCoachmarkSubtitleSlotProps
    safeProps.component = component === 'p' || component === 'span' ? component : 'span'
    delete (safeProps as Record<string, unknown>).id
    return safeProps
}

const normalizeLabel = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    const normalizedValue = value.trim()
    return normalizedValue.length > 0 ? normalizedValue : undefined
}

const pickDataAttributes = (props: object): PneCoachmarkDataAttributes => Object.fromEntries(
    Object.entries(props).filter(([attribute]) => attribute.startsWith('data-')),
) as PneCoachmarkDataAttributes

const mergeIds = (...values: Array<string | undefined>): string | undefined => {
    const ids = values.flatMap(value => value?.trim().split(/\s+/) ?? []).filter(Boolean)
    return ids.length > 0 ? Array.from(new Set(ids)).join(' ') : undefined
}

const warnAboutMissingAccessibleName = (
    open: boolean,
    hasTitle: boolean,
    ariaLabel: string | undefined,
) => {
    if (
        process.env.NODE_ENV !== 'production'
        && open
        && !hasTitle
        && !ariaLabel?.trim()
    ) {
        console.warn('PneCoachmark requires a non-empty title or ariaLabel for its accessible name.')
    }
}

const CoachmarkSurface = styled(PneSurface)`
    position: relative;
    width: min(360px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    pointer-events: auto;
`

const Fallback = styled(Box)`
    align-items: center;
    display: flex;
    inset: 0;
    justify-content: center;
    padding: 16px;
    pointer-events: none;
    position: fixed;
`
