import * as React from 'react'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon from '@mui/icons-material/Close'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import ScheduleIcon from '@mui/icons-material/Schedule'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import {
    Box,
    ButtonBase,
    CircularProgress,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    Stack,
    Typography,
    useMediaQuery,
} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import {useTranslation} from 'react-i18next'
import PneButton from '../PneButton'
import {PneSurface} from '../internal/PneSurface'

export type PneOperationCenterStatus =
    | 'starting'
    | 'queued'
    | 'running'
    | 'finalizing'
    | 'monitoring-error'
    | 'succeeded'
    | 'failed'
    | 'cancelled'
    | 'unknown'

export type PneOperationCenterProgress =
    | {
        kind: 'indeterminate'
        label?: React.ReactNode
    }
    | {
        kind: 'determinate'
        value: number
        label?: React.ReactNode
    }

export type PneOperationCenterAction = {
    id: string
    label: React.ReactNode
    /** Text alternative for a non-text label. The operation context is appended automatically. */
    accessibleLabel?: string
    icon?: React.ReactNode
    disabled?: boolean
    loading?: boolean
}

export type PneOperationCenterItem = {
    id: string
    title: React.ReactNode
    status: PneOperationCenterStatus
    statusLabel?: React.ReactNode
    context?: React.ReactNode
    detail?: React.ReactNode
    progress?: PneOperationCenterProgress
    actions?: readonly PneOperationCenterAction[]
    /** Terminal operations are dismissible by default. This flag can hide their dismiss control. */
    dismissible?: boolean
}

export type PneOperationCenterSummary = {
    active: number
    attention: number
    completed: number
    total: number
}

export type PneOperationCenterLabels = {
    title?: React.ReactNode
    expand?: string
    collapse?: string
    clearFinished?: React.ReactNode
    dismiss?: string
    list?: string
    progress?: string
    operation?: string
    activeCount?: (count: number) => React.ReactNode
    attentionCount?: (count: number) => React.ReactNode
    completedCount?: (count: number) => React.ReactNode
    position?: (position: number, total: number) => string
    status?: Partial<Record<PneOperationCenterStatus, React.ReactNode>>
}

export type PneOperationCenterProps = {
    operations: readonly PneOperationCenterItem[]
    expanded?: boolean
    defaultExpanded?: boolean
    onExpandedChange?: (expanded: boolean) => void
    onAction?: (operationId: string, actionId: string) => void
    onDismiss?: (operationId: string) => void
    onClearTerminal?: (operationIds: readonly string[]) => void
    labels?: PneOperationCenterLabels
    className?: string
    sx?: SxProps<Theme>
}

const ACTIVE_STATUSES = new Set<PneOperationCenterStatus>([
    'starting',
    'queued',
    'running',
    'finalizing',
])

const ATTENTION_STATUSES = new Set<PneOperationCenterStatus>([
    'monitoring-error',
    'failed',
    'unknown',
])

const TERMINAL_STATUSES = new Set<PneOperationCenterStatus>([
    'succeeded',
    'failed',
    'cancelled',
    'unknown',
])

const clampProgress = (value: number) => Math.min(Math.max(value, 0), 100)

const toAccessibleText = (value: React.ReactNode): string | undefined => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }
    return undefined
}

const OperationStatusIcon = ({status}: {status: PneOperationCenterStatus}) => {
    switch (status) {
        case 'starting':
            return <HourglassTopIcon fontSize='small'/>
        case 'queued':
            return <ScheduleIcon fontSize='small'/>
        case 'running':
            return <AutorenewIcon fontSize='small'/>
        case 'finalizing':
            return <HourglassBottomIcon fontSize='small'/>
        case 'monitoring-error':
            return <WifiOffIcon fontSize='small'/>
        case 'succeeded':
            return <CheckCircleOutlineIcon fontSize='small'/>
        case 'failed':
            return <ErrorOutlineIcon fontSize='small'/>
        case 'cancelled':
            return <CancelOutlinedIcon fontSize='small'/>
        case 'unknown':
            return <HelpOutlineIcon fontSize='small'/>
    }
}

const getStatusColor = (status: PneOperationCenterStatus) => {
    if (status === 'succeeded') return 'success.main'
    if (status === 'failed' || status === 'monitoring-error') return 'error.main'
    if (status === 'cancelled' || status === 'unknown') return 'text.secondary'
    return 'primary.main'
}

/**
 * Controlled presentation for application-owned background operations.
 * The component deliberately owns no operation registry, polling, retry, or persistence logic.
 */
export function PneOperationCenter({
    operations,
    expanded,
    defaultExpanded = false,
    onExpandedChange,
    onAction,
    onDismiss,
    onClearTerminal,
    labels,
    className,
    sx,
}: PneOperationCenterProps) {
    const {t} = useTranslation()
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
    const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded)
    const resolvedExpanded = expanded ?? internalExpanded
    const surfaceRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const lastExternalFocusRef = React.useRef<HTMLElement | null>(null)
    const reactId = React.useId()
    const titleId = `${reactId}-title`
    const panelId = `${reactId}-panel`
    const previousStatusesRef = React.useRef<Map<string, PneOperationCenterStatus>>(new Map())
    const hasRecordedInitialStateRef = React.useRef(false)
    const [announcement, setAnnouncement] = React.useState('')

    const statusLabels = React.useMemo<Record<PneOperationCenterStatus, React.ReactNode>>(() => ({
        starting: labels?.status?.starting ?? t('pne.operationCenter.status.starting', {defaultValue: 'Starting'}),
        queued: labels?.status?.queued ?? t('pne.operationCenter.status.queued', {defaultValue: 'Queued'}),
        running: labels?.status?.running ?? t('pne.operationCenter.status.running', {defaultValue: 'Running'}),
        finalizing: labels?.status?.finalizing ?? t('pne.operationCenter.status.finalizing', {defaultValue: 'Finalizing'}),
        'monitoring-error': labels?.status?.['monitoring-error'] ?? t(
            'pne.operationCenter.status.monitoringError',
            {defaultValue: 'Monitoring interrupted'},
        ),
        succeeded: labels?.status?.succeeded ?? t('pne.operationCenter.status.succeeded', {defaultValue: 'Completed'}),
        failed: labels?.status?.failed ?? t('pne.operationCenter.status.failed', {defaultValue: 'Failed'}),
        cancelled: labels?.status?.cancelled ?? t('pne.operationCenter.status.cancelled', {defaultValue: 'Cancelled'}),
        unknown: labels?.status?.unknown ?? t('pne.operationCenter.status.unknown', {defaultValue: 'Status unknown'}),
    }), [labels?.status, t])

    const summary = React.useMemo<PneOperationCenterSummary>(() => operations.reduce((result, operation) => {
        if (ACTIVE_STATUSES.has(operation.status)) {
            result.active += 1
        } else if (ATTENTION_STATUSES.has(operation.status)) {
            result.attention += 1
        } else {
            result.completed += 1
        }
        result.total += 1
        return result
    }, {active: 0, attention: 0, completed: 0, total: 0}), [operations])

    const terminalIds = React.useMemo(
        () => operations
            .filter(operation => TERMINAL_STATUSES.has(operation.status) && operation.dismissible !== false)
            .map(operation => operation.id),
        [operations],
    )
    const showClearTerminal = terminalIds.length > 0 && onClearTerminal !== undefined

    const getOperationAccessibleName = React.useCallback((
        operation: PneOperationCenterItem,
        index: number,
    ) => {
        const titleText = toAccessibleText(operation.title)
        const contextText = toAccessibleText(operation.context)
        const positionText = operations.length > 1
            ? labels?.position?.(index + 1, operations.length)
                ?? String(t('pne.operationCenter.position', {
                    position: index + 1,
                    total: operations.length,
                    defaultValue: '{{position}} of {{total}}',
                }))
            : undefined
        return [
            titleText
                ?? String(labels?.operation
                    ?? t('pne.operationCenter.operation', {defaultValue: 'Operation'})),
            contextText,
            positionText,
        ].filter(Boolean).join(', ')
    }, [labels, operations.length, t])

    const restoreFocusAfterMutation = () => {
        queueMicrotask(() => {
            if (triggerRef.current?.isConnected) {
                triggerRef.current.focus()
                return
            }

            if (lastExternalFocusRef.current?.isConnected) {
                lastExternalFocusRef.current.focus()
            }
        })
    }

    React.useEffect(() => {
        const nextStatuses = new Map(operations.map(operation => [operation.id, operation.status]))

        if (hasRecordedInitialStateRef.current) {
            const changes = operations.flatMap((operation, index) => {
                const previousStatus = previousStatusesRef.current.get(operation.id)
                if (previousStatus === operation.status) return []

                const statusText = toAccessibleText(operation.statusLabel ?? statusLabels[operation.status])
                    ?? operation.status
                return [`${getOperationAccessibleName(operation, index)}: ${statusText}`]
            })

            if (changes.length > 0) {
                setAnnouncement(changes.join('. '))
            }
        }

        hasRecordedInitialStateRef.current = true
        previousStatusesRef.current = nextStatuses
    }, [getOperationAccessibleName, operations, statusLabels])

    if (operations.length === 0) {
        return null
    }

    const setExpanded = (nextExpanded: boolean) => {
        if (expanded === undefined) {
            setInternalExpanded(nextExpanded)
        }
        onExpandedChange?.(nextExpanded)
    }

    const title = labels?.title ?? t('pne.operationCenter.title', {defaultValue: 'Background operations'})
    const expandLabel = labels?.expand ?? String(t('pne.operationCenter.expand', {defaultValue: 'Show background operations'}))
    const collapseLabel = labels?.collapse ?? String(t('pne.operationCenter.collapse', {defaultValue: 'Hide background operations'}))
    const dismissLabel = labels?.dismiss ?? String(t('pne.operationCenter.dismiss', {defaultValue: 'Dismiss'}))
    const listLabel = labels?.list ?? String(t('pne.operationCenter.list', {defaultValue: 'Background operations'}))
    const progressLabel = labels?.progress ?? String(t('pne.operationCenter.progress', {defaultValue: 'Operation progress'}))

    const summaryParts = [
        summary.active > 0
            ? labels?.activeCount?.(summary.active)
                ?? t('pne.operationCenter.summary.active', {count: summary.active, defaultValue: '{{count}} active'})
            : null,
        summary.attention > 0
            ? labels?.attentionCount?.(summary.attention)
                ?? t('pne.operationCenter.summary.attention', {
                    count: summary.attention,
                    defaultValue: summary.attention === 1 ? '{{count}} needs attention' : '{{count}} need attention',
                })
            : null,
        summary.completed > 0
            ? labels?.completedCount?.(summary.completed)
                ?? t('pne.operationCenter.summary.completed', {count: summary.completed, defaultValue: '{{count}} finished'})
            : null,
    ].filter((part): part is React.ReactNode => part != null)

    return (
        <PneSurface
            className={className}
            data-pne-operation-center
            onFocusCapture={event => {
                const previousTarget = event.relatedTarget
                if (
                    previousTarget instanceof HTMLElement
                    && !surfaceRef.current?.contains(previousTarget)
                ) {
                    lastExternalFocusRef.current = previousTarget
                }
            }}
            ref={surfaceRef}
            sx={[
                {
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'min(60dvh, 560px)',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    width: '400px',
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <ButtonBase
                ref={triggerRef}
                aria-controls={resolvedExpanded ? panelId : undefined}
                aria-expanded={resolvedExpanded}
                aria-label={resolvedExpanded ? collapseLabel : expandLabel}
                onClick={() => setExpanded(!resolvedExpanded)}
                sx={{
                    alignItems: 'center',
                    borderBottom: resolvedExpanded ? '1px solid' : 'none',
                    borderColor: 'pne.border.subtle',
                    display: 'flex',
                    flex: '0 0 auto',
                    gap: 1.5,
                    justifyContent: 'space-between',
                    minHeight: 64,
                    px: 2,
                    py: 1.25,
                    textAlign: 'left',
                    width: '100%',
                    '&.Mui-focusVisible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '-2px',
                    },
                }}
            >
                <Box sx={{minWidth: 0}}>
                    <Typography
                        component='span'
                        id={titleId}
                        sx={{display: 'block', fontSize: 14, fontWeight: 700, lineHeight: '20px'}}
                    >
                        {title}
                    </Typography>
                    <Stack
                        component='span'
                        data-pne-operation-center-summary
                        direction='row'
                        divider={<Box aria-hidden='true' component='span'>•</Box>}
                        sx={{
                            color: 'text.secondary',
                            display: 'flex',
                            flexWrap: 'wrap',
                            fontSize: 12,
                            gap: 0.75,
                            lineHeight: '18px',
                            mt: 0.25,
                        }}
                    >
                        {summaryParts.map((part, index) => <Box component='span' key={index}>{part}</Box>)}
                    </Stack>
                </Box>
                {resolvedExpanded
                    ? <ExpandLessIcon aria-hidden='true' sx={{flex: '0 0 auto'}}/>
                    : <ExpandMoreIcon aria-hidden='true' sx={{flex: '0 0 auto'}}/>}
            </ButtonBase>

            {resolvedExpanded ? (
                <Box
                    aria-labelledby={titleId}
                    id={panelId}
                    onKeyDown={event => {
                        if (event.key !== 'Escape') return
                        event.stopPropagation()
                        setExpanded(false)
                        triggerRef.current?.focus()
                    }}
                    role='region'
                    sx={{minHeight: 0, overflowY: 'auto'}}
                >
                    {showClearTerminal ? (
                        <Box sx={{display: 'flex', justifyContent: 'flex-end', px: 2, pt: 1.25}}>
                            <PneButton
                                onClick={() => {
                                    onClearTerminal?.(terminalIds)
                                    restoreFocusAfterMutation()
                                }}
                                pneStyle='neutralText'
                                size='small'
                                sx={{minHeight: 44}}
                            >
                                {labels?.clearFinished ?? t('pne.operationCenter.clearFinished', {defaultValue: 'Clear finished'})}
                            </PneButton>
                        </Box>
                    ) : null}

                    <List aria-label={listLabel} disablePadding>
                        {operations.map((operation, index) => {
                            const terminal = TERMINAL_STATUSES.has(operation.status)
                            const resolvedStatusLabel = operation.statusLabel ?? statusLabels[operation.status]
                            const titleText = toAccessibleText(operation.title)
                            const operationAccessibleName = getOperationAccessibleName(operation, index)
                            const resolvedDismissLabel = `${dismissLabel}: ${operationAccessibleName}`
                            const resolvedProgressLabel = `${progressLabel}: ${operationAccessibleName}`
                            const progressValue = operation.progress?.kind === 'determinate'
                                ? clampProgress(operation.progress.value)
                                : undefined

                            return (
                                <ListItem
                                    aria-posinset={index + 1}
                                    aria-setsize={operations.length}
                                    component='li'
                                    data-pne-operation-id={operation.id}
                                    data-pne-operation-status={operation.status}
                                    disableGutters
                                    key={operation.id}
                                    sx={{
                                        alignItems: 'stretch',
                                        borderTop: index === 0 && !showClearTerminal ? 'none' : '1px solid',
                                        borderColor: 'pne.border.subtle',
                                        display: 'block',
                                        px: 2,
                                        py: 1.5,
                                    }}
                                >
                                    <Stack spacing={0.75}>
                                        <Stack direction='row' spacing={1} sx={{alignItems: 'flex-start'}}>
                                            <Box sx={{minWidth: 0, flex: 1, overflowWrap: 'anywhere'}}>
                                                <Typography
                                                    component='div'
                                                    sx={{fontSize: 14, fontWeight: 700, lineHeight: '20px'}}
                                                >
                                                    {operation.title}
                                                </Typography>
                                                {operation.context != null ? (
                                                    <Box
                                                        sx={{color: 'text.secondary', fontSize: 12, lineHeight: '18px', mt: 0.25}}
                                                    >
                                                        {operation.context}
                                                    </Box>
                                                ) : null}
                                            </Box>
                                            {terminal && operation.dismissible !== false && onDismiss ? (
                                                <IconButton
                                                    aria-label={resolvedDismissLabel}
                                                    onClick={() => {
                                                        onDismiss(operation.id)
                                                        restoreFocusAfterMutation()
                                                    }}
                                                    size='small'
                                                    sx={{flex: '0 0 auto', minHeight: 44, minWidth: 44, mt: -1}}
                                                >
                                                    <CloseIcon aria-hidden='true' fontSize='small'/>
                                                </IconButton>
                                            ) : null}
                                        </Stack>

                                        <Stack
                                            direction='row'
                                            spacing={0.75}
                                            sx={{alignItems: 'center', color: getStatusColor(operation.status)}}
                                        >
                                            <Box aria-hidden='true' component='span' sx={{display: 'inline-flex'}}>
                                                <OperationStatusIcon status={operation.status}/>
                                            </Box>
                                            <Typography component='span' sx={{fontSize: 12, fontWeight: 700, lineHeight: '18px'}}>
                                                {resolvedStatusLabel}
                                            </Typography>
                                        </Stack>

                                        {operation.detail != null ? (
                                            <Box sx={{color: 'text.secondary', fontSize: 12, lineHeight: '18px', overflowWrap: 'anywhere'}}>
                                                {operation.detail}
                                            </Box>
                                        ) : null}

                                        {operation.progress ? (
                                            <Stack direction='row' spacing={1} sx={{alignItems: 'center'}}>
                                                <LinearProgress
                                                    aria-label={resolvedProgressLabel}
                                                    aria-valuetext={progressValue !== undefined ? `${Math.round(progressValue)}%` : undefined}
                                                    value={progressValue}
                                                    variant={operation.progress.kind}
                                                    sx={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        '& .MuiLinearProgress-bar': prefersReducedMotion ? {
                                                            animation: 'none',
                                                            transition: 'none',
                                                        } : undefined,
                                                    }}
                                                />
                                                {operation.progress.label != null || progressValue !== undefined ? (
                                                    <Typography
                                                        component='span'
                                                        sx={{color: 'text.secondary', flex: '0 1 auto', fontSize: 12, lineHeight: '18px', minWidth: 0, overflowWrap: 'anywhere'}}
                                                    >
                                                        {operation.progress.label ?? `${Math.round(progressValue ?? 0)}%`}
                                                    </Typography>
                                                ) : null}
                                            </Stack>
                                        ) : null}

                                        {operation.actions && operation.actions.length > 0 ? (
                                            <Stack direction='row' sx={{flexWrap: 'wrap', gap: 1, pt: 0.25}}>
                                                {operation.actions.map(action => {
                                                    const actionAccessibleLabel = action.accessibleLabel
                                                        ?? toAccessibleText(action.label)
                                                    return <PneButton
                                                        aria-label={actionAccessibleLabel
                                                            ? `${actionAccessibleLabel}: ${operationAccessibleName}`
                                                            : undefined}
                                                        aria-busy={action.loading || undefined}
                                                        disabled={action.disabled || action.loading || !onAction}
                                                        key={action.id}
                                                        onClick={() => onAction?.(operation.id, action.id)}
                                                        pneStyle='text'
                                                        size='small'
                                                        startIcon={action.loading
                                                            ? <CircularProgress
                                                                aria-hidden='true'
                                                                size={14}
                                                                sx={prefersReducedMotion ? {
                                                                    animation: 'none',
                                                                    '& .MuiCircularProgress-circle': {animation: 'none'},
                                                                } : undefined}
                                                            />
                                                            : action.icon}
                                                        sx={{minHeight: 44}}
                                                    >
                                                        {action.label}
                                                    </PneButton>
                                                })}
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                </ListItem>
                            )
                        })}
                    </List>
                </Box>
            ) : null}

            <Box
                aria-atomic='true'
                aria-live='polite'
                role='status'
                sx={{
                    border: 0,
                    clip: 'rect(0 0 0 0)',
                    height: 1,
                    margin: -1,
                    overflow: 'hidden',
                    padding: 0,
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    width: 1,
                }}
            >
                {announcement}
            </Box>
        </PneSurface>
    )
}

export default PneOperationCenter
