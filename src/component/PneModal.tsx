import CloseIcon from '@mui/icons-material/Close'
import Box, {type BoxProps} from '@mui/material/Box'
import IconButton, {type IconButtonProps} from '@mui/material/IconButton'
import Modal, {type ModalProps} from '@mui/material/Modal'
import Typography, {type TypographyProps} from '@mui/material/Typography'
import {styled, type SxProps, type Theme} from '@mui/material/styles'
import * as React from 'react'

export type PneModalDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export type PneModalCloseReason =
    | Parameters<NonNullable<ModalProps['onClose']>>[1]
    | 'closeButtonClick'

export type PneModalCloseEvent = React.SyntheticEvent

export type PneModalCloseHandler = (
    event: PneModalCloseEvent,
    reason: PneModalCloseReason,
) => void

export type PneModalRootProps = Pick<
    ModalProps,
    | 'classes'
    | 'className'
    | 'container'
    | 'disablePortal'
    | 'disableScrollLock'
    | 'hideBackdrop'
    | 'keepMounted'
    | 'sx'
>

type ManagedContainerAttribute =
    | 'aria-describedby'
    | 'aria-hidden'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-modal'
    | 'children'
    | 'className'
    | 'dangerouslySetInnerHTML'
    | 'hidden'
    | 'inert'
    | 'role'
    | 'style'

export type PneModalContainerProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    ManagedContainerAttribute
> & PneModalDataAttributes

export type PneModalCloseButtonProps = Omit<
    IconButtonProps<'button'>,
    | 'LinkComponent'
    | 'children'
    | 'component'
    | 'dangerouslySetInnerHTML'
    | 'href'
    | 'onClick'
    | 'sx'
    | 'type'
    | 'to'
> & PneModalDataAttributes

export type PneModalContainerSlotProps = PneModalContainerProps & {
    sx?: SxProps<Theme>
}

export type PneModalBoxSlotProps = Omit<
    BoxProps<'div'>,
    'children' | 'component' | 'dangerouslySetInnerHTML'
> & PneModalDataAttributes

export type PneModalTitleSlotProps = Omit<
    TypographyProps<'h3'>,
    'children' | 'component' | 'dangerouslySetInnerHTML' | 'id'
> & {
    component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
} & PneModalDataAttributes

export type PneModalSubtitleSlotProps = Omit<
    TypographyProps,
    'children' | 'component' | 'dangerouslySetInnerHTML' | 'id'
> & {
    component?: 'p' | 'span'
} & PneModalDataAttributes

export interface PneModalSlotProps {
    body?: PneModalBoxSlotProps
    blockingOverlay?: PneModalBoxSlotProps
    closeButton?: PneModalCloseButtonProps
    container?: PneModalContainerSlotProps
    footer?: PneModalBoxSlotProps
    header?: PneModalBoxSlotProps
    subtitle?: PneModalSubtitleSlotProps
    title?: PneModalTitleSlotProps
}

export type PneModalTitle = React.ReactNode

type PneModalAccessibleName =
    | {
        /** Fallback used when the title value is null or empty. Components that render null must be omitted explicitly. */
        ariaLabel?: string
        title: PneModalTitle
    }
    | {
        ariaLabel: string
        title?: null
    }

type PneModalOwnProps = {
    actions?: React.ReactNode
    ariaDescribedBy?: string
    blockingOverlay?: React.ReactNode
    children?: React.ReactNode
    className?: string
    /** Optional localized label. Falls back to `Close`. */
    closeLabel?: string
    /** @deprecated Use `slotProps.closeButton`. */
    closeButtonProps?: PneModalCloseButtonProps
    /** @deprecated Use `slotProps.container`. */
    containerProps?: PneModalContainerProps
    containerSx?: SxProps<Theme>
    hideCloseButton?: boolean
    modalProps?: PneModalRootProps
    onClose: PneModalCloseHandler
    open: boolean
    /** @deprecated Use `blockingOverlay`; this slot always blocks dismissal and interaction. */
    overlay?: React.ReactNode
    slotProps?: PneModalSlotProps
    subtitle?: React.ReactNode
}

export type PneModalProps = PneModalOwnProps
    & PneModalAccessibleName
    & PneModalDataAttributes

const PneModal = React.forwardRef<HTMLDivElement, PneModalProps>(function PneModal(props, ref) {
    const {
        actions,
        ariaDescribedBy,
        ariaLabel,
        blockingOverlay,
        children,
        className,
        closeButtonProps,
        closeLabel = 'Close',
        containerProps,
        containerSx,
        hideCloseButton = false,
        modalProps,
        onClose,
        open,
        overlay,
        slotProps,
        subtitle,
        title,
        ...directContainerDataAttributes
    } = props

    const [containerElement, setContainerElement] = React.useState<HTMLDivElement | null>(null)
    const focusBeforeBlockingRef = React.useRef<HTMLElement | null>(null)
    const setContainerAnchorRef = React.useCallback((anchor: HTMLSpanElement | null) => {
        const nextContainer = anchor?.parentElement as HTMLDivElement | undefined
        setContainerElement(currentContainer => (
            currentContainer === nextContainer ? currentContainer : nextContainer ?? null
        ))
    }, [])
    const generatedTitleId = React.useId()
    const generatedSubtitleId = React.useId()
    const hasTitle = hasRenderableContent(title)
    const hasSubtitle = hasRenderableContent(subtitle)
    const resolvedBlockingOverlay = blockingOverlay !== undefined
        ? blockingOverlay
        : overlay
    const isBlocked = hasRenderableContent(resolvedBlockingOverlay)
    const titleId = hasTitle ? generatedTitleId : undefined
    const subtitleId = hasSubtitle ? generatedSubtitleId : undefined
    const resolvedAriaLabel = normalizeLabel(ariaLabel)

    React.useLayoutEffect(() => exposeForwardedRef(ref, containerElement), [containerElement, ref])

    React.useEffect(() => {
        const container = containerElement
        if (!open || !container) {
            focusBeforeBlockingRef.current = null
            return undefined
        }

        if (isBlocked) {
            const activeElement = document.activeElement
            if (
                activeElement instanceof HTMLElement
                && activeElement !== container
                && container.contains(activeElement)
            ) {
                focusBeforeBlockingRef.current = activeElement
            }
            return registerBlockingDialog(container)
        }

        const elementToRestore = focusBeforeBlockingRef.current
        focusBeforeBlockingRef.current = null
        if (elementToRestore?.isConnected && container.contains(elementToRestore)) {
            elementToRestore.focus({preventScroll: true})
        }
        return undefined
    }, [containerElement, isBlocked, open])

    warnAboutMissingAccessibleName(open, hasTitle, resolvedAriaLabel)

    const resolvedContainerProps = sanitizeContainerProps({
        ...containerProps,
        ...slotProps?.container,
        ...pickDataAttributes(directContainerDataAttributes),
    })
    const {
        'aria-busy': containerAriaBusy,
        sx: containerSlotSx,
        tabIndex: containerTabIndex,
        ...forwardedContainerProps
    } = resolvedContainerProps
    const resolvedCloseButtonProps = sanitizeCloseButtonProps({
        ...closeButtonProps,
        ...slotProps?.closeButton,
    })
    const {
        'aria-label': closeButtonAriaLabel,
        ...forwardedCloseButtonProps
    } = resolvedCloseButtonProps
    const {
        sx: modalRootSx,
        ...forwardedModalProps
    } = sanitizeModalRootProps(modalProps)
    const forwardedHeaderProps = sanitizeFixedElementProps(slotProps?.header)
    const forwardedBodyProps = sanitizeFixedElementProps(slotProps?.body)
    const forwardedFooterProps = sanitizeFixedElementProps(slotProps?.footer)
    const forwardedBlockingOverlayProps = sanitizeFixedElementProps(slotProps?.blockingOverlay)
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

    const handleModalClose: NonNullable<ModalProps['onClose']> = (event, reason) => {
        if (!isBlocked) {
            onClose(event as React.SyntheticEvent, reason)
        }
    }
    const handleCloseButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!isBlocked) {
            onClose(event, 'closeButtonClick')
        }
    }

    return <Modal
        {...forwardedModalProps}
        open={open}
        onClose={handleModalClose}
        sx={[
            ...(Array.isArray(modalRootSx) ? modalRootSx : [modalRootSx]),
            isBlocked ? blockingModalRootSx : undefined,
        ]}
    >
        <Container
            {...forwardedContainerProps}
            aria-busy={isBlocked ? true : containerAriaBusy}
            aria-describedby={mergeIds(subtitleId, ariaDescribedBy)}
            aria-label={hasTitle ? undefined : resolvedAriaLabel}
            aria-labelledby={titleId}
            aria-modal='true'
            className={className}
            data-pne-modal-container='true'
            role='dialog'
            tabIndex={isBlocked ? -1 : containerTabIndex}
            sx={[
                ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
                ...(Array.isArray(containerSlotSx) ? containerSlotSx : [containerSlotSx]),
            ]}
        >
            <span ref={setContainerAnchorRef} aria-hidden='true' hidden/>
            {(hasTitle || hasSubtitle || !hideCloseButton) && <Header
                {...forwardedHeaderProps}
                data-pne-modal-header='true'
                inert={isBlocked ? true : forwardedHeaderProps.inert}
            >
                <div>
                    {hasTitle && <Typography
                        {...forwardedTitleProps}
                        component={titleComponent ?? 'h3'}
                        id={titleId}
                        sx={[
                            {
                                padding: '0',
                                fontWeight: '700',
                                fontSize: '18px',
                                lineHeight: '24px',
                            },
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
                            {
                                padding: '0',
                                fontWeight: '400',
                                fontSize: '12px',
                                lineHeight: '12px',
                                letterSpacing: '0.15px',
                            },
                            ...(Array.isArray(subtitleSx) ? subtitleSx : [subtitleSx]),
                        ]}
                    >
                        {subtitle}
                    </Typography>}
                </div>
                {!hideCloseButton && <IconButton
                    {...forwardedCloseButtonProps}
                    aria-label={resolvedCloseLabel}
                    inert={isBlocked ? true : undefined}
                    sx={{
                        width: '40px',
                        height: '40px',
                        background: '#F1F5FA',
                        borderRadius: '4px',
                    }}
                    onClick={handleCloseButtonClick}
                    type='button'
                >
                    <CloseIcon fontSize='small'/>
                </IconButton>}
            </Header>}
            {children != null && <Body
                {...forwardedBodyProps}
                data-pne-modal-body='true'
                inert={isBlocked ? true : forwardedBodyProps.inert}
            >
                {children}
            </Body>}
            {actions != null && <Footer
                {...forwardedFooterProps}
                data-pne-modal-footer='true'
                inert={isBlocked ? true : forwardedFooterProps.inert}
            >
                {actions}
            </Footer>}
            {isBlocked && <BlockingOverlaySlot
                {...forwardedBlockingOverlayProps}
                data-pne-modal-blocking-overlay='true'
            >
                {resolvedBlockingOverlay}
            </BlockingOverlaySlot>}
        </Container>
    </Modal>
})

export default PneModal

const hasRenderableContent = (value: React.ReactNode): boolean => {
    if (typeof value === 'string') return value.trim().length > 0
    return React.Children.toArray(value).length > 0
}

const exposeForwardedRef = <T,>(
    forwardedRef: React.ForwardedRef<T>,
    value: T | null,
): (() => void) | undefined => {
    if (!forwardedRef || value === null) return undefined

    if (typeof forwardedRef === 'function') {
        const cleanup = forwardedRef(value)
        return typeof cleanup === 'function' ? cleanup : () => forwardedRef(null)
    }

    forwardedRef.current = value
    return () => {
        if (forwardedRef.current === value) forwardedRef.current = null
    }
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
    props: PneModalContainerProps & {sx?: SxProps<Theme>},
): PneModalContainerProps & {sx?: SxProps<Theme>} => {
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
    return safeProps as PneModalContainerProps & {sx?: SxProps<Theme>}
}

const sanitizeCloseButtonProps = (
    props: PneModalCloseButtonProps,
): PneModalCloseButtonProps => {
    const safeProps: Record<string, unknown> = sanitizeFixedElementProps(props)
    delete safeProps.href
    delete safeProps.LinkComponent
    delete safeProps.to
    delete safeProps.type
    return safeProps as PneModalCloseButtonProps
}

const headingComponents = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

const sanitizeTitleSlotProps = (
    props?: PneModalTitleSlotProps,
): PneModalTitleSlotProps => {
    const component = (props as {component?: unknown} | undefined)?.component
    const safeProps = sanitizeFixedElementProps(props ?? {}) as PneModalTitleSlotProps
    safeProps.component = typeof component === 'string' && headingComponents.has(component)
        ? component as NonNullable<PneModalTitleSlotProps['component']>
        : 'h3'
    delete (safeProps as Record<string, unknown>).id
    return safeProps
}

const sanitizeSubtitleSlotProps = (
    props?: PneModalSubtitleSlotProps,
): PneModalSubtitleSlotProps => {
    const component = (props as {component?: unknown} | undefined)?.component
    const safeProps = sanitizeFixedElementProps(props ?? {}) as PneModalSubtitleSlotProps
    safeProps.component = component === 'p' || component === 'span' ? component : 'span'
    delete (safeProps as Record<string, unknown>).id
    return safeProps
}

const sanitizeModalRootProps = (props?: PneModalRootProps): PneModalRootProps => ({
    classes: props?.classes,
    className: props?.className,
    container: props?.container,
    disablePortal: props?.disablePortal,
    disableScrollLock: props?.disableScrollLock,
    hideBackdrop: props?.hideBackdrop,
    keepMounted: props?.keepMounted,
    sx: props?.sx,
})

const normalizeLabel = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    const normalizedValue = value.trim()
    return normalizedValue.length > 0 ? normalizedValue : undefined
}

const pickDataAttributes = (props: object): PneModalDataAttributes => Object.fromEntries(
    Object.entries(props).filter(([attribute]) => attribute.startsWith('data-')),
) as PneModalDataAttributes

const blockingModalRootSx = (theme: Theme) => ({
    zIndex: Math.max(...Object.values(theme.zIndex)) + 1,
})

type BlockingDialogBoundaryState = {
    dialogs: HTMLDivElement[]
    focusHandler: (event: FocusEvent) => void
    inertSnapshots: Map<HTMLElement, boolean>
    observer?: MutationObserver
}

const blockingDialogBoundaryStates = new WeakMap<Document, BlockingDialogBoundaryState>()

const registerBlockingDialog = (dialog: HTMLDivElement): (() => void) => {
    const ownerDocument = dialog.ownerDocument
    let state = blockingDialogBoundaryStates.get(ownerDocument)

    if (!state) {
        state = createBlockingDialogBoundaryState(ownerDocument)
        blockingDialogBoundaryStates.set(ownerDocument, state)
    }

    state.dialogs.push(dialog)
    if (state.dialogs.length === 1) {
        ownerDocument.addEventListener('focusin', state.focusHandler, true)
        state.observer?.observe(ownerDocument.body, {childList: true})
    }
    applyBlockingDialogBoundary(ownerDocument, state)
    focusActiveBlockingDialog(ownerDocument, state, true)

    return () => {
        const dialogIndex = state.dialogs.lastIndexOf(dialog)
        if (dialogIndex >= 0) state.dialogs.splice(dialogIndex, 1)
        applyBlockingDialogBoundary(ownerDocument, state)
        focusActiveBlockingDialog(ownerDocument, state)

        if (state.dialogs.length === 0) {
            ownerDocument.removeEventListener('focusin', state.focusHandler, true)
            state.observer?.disconnect()
            blockingDialogBoundaryStates.delete(ownerDocument)
        }
    }
}

const focusActiveBlockingDialog = (
    ownerDocument: Document,
    state: BlockingDialogBoundaryState,
    force = false,
): void => {
    const activeDialog = getTopmostBlockingDialog(state)
    if (
        activeDialog
        && (force || !activeDialog.contains(ownerDocument.activeElement))
    ) {
        activeDialog.focus({preventScroll: true})
    }
}

const createBlockingDialogBoundaryState = (
    ownerDocument: Document,
): BlockingDialogBoundaryState => {
    const state: BlockingDialogBoundaryState = {
        dialogs: [],
        inertSnapshots: new Map(),
        focusHandler: event => {
            const activeDialog = getTopmostBlockingDialog(state)
            const target = event.target
            if (activeDialog && target instanceof Node && !activeDialog.contains(target)) {
                event.preventDefault()
                event.stopImmediatePropagation()
                activeDialog.focus({preventScroll: true})
            }
        },
    }
    const MutationObserverConstructor = ownerDocument.defaultView?.MutationObserver
    if (MutationObserverConstructor) {
        state.observer = new MutationObserverConstructor(() => {
            applyBlockingDialogBoundary(ownerDocument, state)
        })
    }
    return state
}

const applyBlockingDialogBoundary = (
    ownerDocument: Document,
    state: BlockingDialogBoundaryState,
): void => {
    state.inertSnapshots.forEach((wasInert, element) => {
        if (wasInert) {
            element.setAttribute('inert', '')
        } else {
            element.removeAttribute('inert')
        }
    })
    state.inertSnapshots.clear()

    state.dialogs = state.dialogs.filter(dialog => dialog.isConnected)
    const activeDialog = getTopmostBlockingDialog(state)
    if (!activeDialog) return

    const modalRoot = activeDialog.closest('.MuiModal-root')
    let modalHost = modalRoot
    while (modalHost?.parentElement && modalHost.parentElement !== ownerDocument.body) {
        modalHost = modalHost.parentElement
    }
    if (modalHost?.parentElement !== ownerDocument.body) modalHost = null

    Array.from(ownerDocument.body.children).forEach(element => {
        if (!(element instanceof HTMLElement) || element === modalHost) return
        state.inertSnapshots.set(element, element.hasAttribute('inert'))
        element.setAttribute('inert', '')
    })
}

const getTopmostBlockingDialog = (
    state: BlockingDialogBoundaryState,
): HTMLDivElement | undefined => state.dialogs.reduce<HTMLDivElement | undefined>(
    (topmostDialog, candidateDialog) => {
        if (!candidateDialog.isConnected) return topmostDialog
        if (!topmostDialog?.isConnected) return candidateDialog

        const topmostRoot = topmostDialog.closest('.MuiModal-root') ?? topmostDialog
        const candidateRoot = candidateDialog.closest('.MuiModal-root') ?? candidateDialog
        const documentPosition = topmostRoot.compareDocumentPosition(candidateRoot)
        const following = topmostDialog.ownerDocument.defaultView
            ?.Node.DOCUMENT_POSITION_FOLLOWING ?? 4

        return documentPosition & following ? candidateDialog : topmostDialog
    },
    undefined,
)

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
        console.warn('PneModal requires a non-empty title or ariaLabel for its accessible name.')
    }
}

const Container = styled(Box)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: min(400px, calc(100vw - 32px));
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    background: #fff;
    border: none;
    border-radius: 4px;
    max-height: 98%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0px -1px 12px rgba(0, 0, 0, 0.03), 0px 3px 3px rgba(0, 0, 0, 0.02), 0px 7px 6px rgba(0, 0, 0, 0.06), 0px 12px 10px rgba(0, 0, 3, 0.03), 0px 22px 18px rgba(0, 0, 0, 0.04), 0px 40px 33px rgba(0, 0, 0, 0.04), 0px 100px 80px rgba(0, 0, 0, 0.04);
`

const Header = styled(Box)`
    display: flex;
    flex: 0 0 auto;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #F1F5FA;
    gap: 16px;
`

const Body = styled(Box)`
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 24px;
`

const Footer = styled(Box)`
    flex: 0 0 auto;
    padding: 16px 24px;
    border-top: 1px solid #F1F5FA;
`

const BlockingOverlaySlot = styled(Box)`
    position: absolute;
    inset: 0;
    z-index: 1;
`
