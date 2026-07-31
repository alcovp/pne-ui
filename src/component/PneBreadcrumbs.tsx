import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import {
    Box,
    Breadcrumbs,
    IconButton,
    Link as MuiLink,
    Menu,
    MenuItem,
    Tooltip,
    useMediaQuery,
} from '@mui/material'
import type {SxProps, Theme} from '@mui/material/styles'
import * as React from 'react'

import {createAutoTestAttributes} from './AutoTestAttribute'
import PneButton from './PneButton'

type PneBreadcrumbBaseItem = {
    /** Stable identity used for React keys and default autotest locators. */
    id: string
    /** Already localized content. PneBreadcrumbs intentionally has no i18n dependency. */
    label: React.ReactNode
    icon?: React.ReactNode
    /** Overrides the default `link.<id>` or `button.<id>` locator. Text items have no default locator. */
    autoTestId?: string
    /** Accessible/full label for truncated content. Defaults to a primitive label. */
    tooltip?: React.ReactNode
}

export type PneBreadcrumbLinkItem = PneBreadcrumbBaseItem & {
    type: 'link'
    href: string
    onClick?: never
}

export type PneBreadcrumbActionItem = PneBreadcrumbBaseItem & {
    type: 'action'
    onClick: () => void
    href?: never
}

export type PneBreadcrumbTextItem = PneBreadcrumbBaseItem & {
    type: 'text'
    href?: never
    onClick?: never
}

export type PneBreadcrumbItem =
    | PneBreadcrumbLinkItem
    | PneBreadcrumbActionItem
    | PneBreadcrumbTextItem

export type PneBreadcrumbsProps = {
    items: readonly PneBreadcrumbItem[]
    /**
     * Bridge/router-aware anchor component. It must accept `href`, forward DOM props,
     * className, and its ref to the underlying anchor so the overflow menu can manage focus.
     */
    linkComponent?: React.ElementType
    /** Localized accessible label for the collapsed-items button. */
    moreLabel?: string
    ariaLabel?: string
    sx?: SxProps<Theme>
}

const viewportSafetyOffset = 90

const getPrimitiveLabel = (label: React.ReactNode): React.ReactNode => {
    if (typeof label === 'string' || typeof label === 'number') {
        return label
    }

    return ''
}

const getElementTypeKey = (type: React.ElementType): string => {
    if (typeof type === 'string') {
        return type
    }

    return type.displayName || type.name || 'component'
}

const getReactNodeMeasurementKey = (node: React.ReactNode): string => {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return ''
    }

    if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') {
        return String(node)
    }

    if (Array.isArray(node)) {
        return node.map(getReactNodeMeasurementKey).join(',')
    }

    if (React.isValidElement<Record<string, unknown>>(node)) {
        const primitiveProps = Object.entries(node.props)
            .filter(([name, value]) => name !== 'children'
                && (typeof value === 'string'
                    || typeof value === 'number'
                    || typeof value === 'boolean'))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(',')
        const children = getReactNodeMeasurementKey(node.props.children as React.ReactNode)

        return `${getElementTypeKey(node.type as React.ElementType)}(${primitiveProps})[${children}]`
    }

    return typeof node
}

const getItemAutoTestId = (item: PneBreadcrumbItem): string | undefined => {
    if (item.autoTestId) {
        return item.autoTestId
    }

    if (item.type === 'link') {
        return `link.${item.id}`
    }

    if (item.type === 'action') {
        return `button.${item.id}`
    }

    return undefined
}

const getItemSx = (
    item: PneBreadcrumbItem,
    index: number,
    total: number,
): SxProps<Theme> => theme => {
    const clickable = item.type === 'link' || item.type === 'action'
    const current = index === total - 1 && !clickable

    return {
        alignItems: 'center',
        color: clickable
            ? theme.palette.primary.dark
            : current
                ? theme.palette.text.primary
                : theme.palette.text.secondary,
        display: 'flex',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontWeight: current ? 700 : 400,
        letterSpacing: '0%',
        lineHeight: '24px',
        verticalAlign: 'middle',
    }
}

const getMeasurementKey = (items: readonly PneBreadcrumbItem[]): string => {
    return items.map(item => {
        const destination = item.type === 'link' ? item.href : ''
        const label = getReactNodeMeasurementKey(item.label)
        const icon = getReactNodeMeasurementKey(item.icon)
        return `${item.type}:${item.id}:${label}:${icon}:${destination}`
    }).join('|')
}

export const PneBreadcrumbs = ({
    ariaLabel = 'breadcrumb',
    items,
    linkComponent: LinkComponent = 'a',
    moreLabel = 'More',
    sx,
}: PneBreadcrumbsProps) => {
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const expandedWidthRef = React.useRef(0)
    const [collapsed, setCollapsed] = React.useState(false)
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
    const menuButtonId = React.useId()
    const measurementKey = getMeasurementKey(items)
    const isNarrowViewport = useMediaQuery('(max-width:425px)')

    const menuItems = React.useMemo(
        () => items.length > 2 ? items.slice(1, -1) : [],
        [items],
    )

    React.useEffect(() => {
        expandedWidthRef.current = 0
        setCollapsed(false)
        setAnchorEl(null)
    }, [measurementKey])

    const measure = React.useCallback(() => {
        const root = rootRef.current
        if (!root) {
            return
        }

        const list = root.querySelector('ol')
        if (!list) {
            return
        }

        const previousWidth = list.style.width
        if (!collapsed) {
            list.style.width = 'max-content'
        }
        const renderedWidth = list.scrollWidth || list.getBoundingClientRect().width
        list.style.width = previousWidth
        if (!collapsed && renderedWidth > 0) {
            expandedWidthRef.current = renderedWidth
        }

        const expandedWidth = expandedWidthRef.current || renderedWidth
        const ownerWindow = root.ownerDocument.defaultView
        const rootRect = root.getBoundingClientRect()
        const containerWidth = root.clientWidth || rootRect.width
        const viewportWidth = ownerWindow
            ? ownerWindow.innerWidth - Math.max(rootRect.left, 0) - viewportSafetyOffset
            : Number.POSITIVE_INFINITY
        const availableWidth = containerWidth > 0
            ? Math.min(containerWidth, viewportWidth)
            : viewportWidth
        const shouldCollapse = items.length > 2
            && expandedWidth > 0
            && expandedWidth > availableWidth

        setCollapsed(current => current === shouldCollapse ? current : shouldCollapse)
    }, [collapsed, items.length])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root) {
            return
        }

        const ownerWindow = root.ownerDocument.defaultView
        const ResizeObserverConstructor = ownerWindow?.ResizeObserver
        const observer = ResizeObserverConstructor
            ? new ResizeObserverConstructor(measure)
            : undefined
        const list = root.querySelector('ol')

        observer?.observe(root)
        if (list) {
            observer?.observe(list)
        }
        if (root.parentElement) {
            observer?.observe(root.parentElement)
        }
        ownerWindow?.addEventListener('resize', measure)
        measure()

        return () => {
            observer?.disconnect()
            ownerWindow?.removeEventListener('resize', measure)
        }
    }, [measure, measurementKey])

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const renderContent = (
        item: PneBreadcrumbItem,
        index: number,
    ): React.ReactNode => {
        const isLast = index === items.length - 1
        const label = isLast && isNarrowViewport
            ? <Tooltip title={item.tooltip ?? getPrimitiveLabel(item.label)}>
                <Box
                    component='span'
                    sx={{
                        display: 'inline-block',
                        maxWidth: item.icon ? '200px' : '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {item.label}
                </Box>
            </Tooltip>
            : item.label

        if (!item.icon) {
            return label
        }

        return <Box
            component='span'
            sx={{
                alignItems: 'center',
                color: 'text.primary',
                display: 'flex',
                gap: '4px',
                minWidth: 0,
                '& > svg': {
                    flexShrink: 0,
                },
            }}
        >
            {item.icon}
            {label}
        </Box>
    }

    const renderItem = (
        item: PneBreadcrumbItem,
        index: number,
    ): React.ReactNode => {
        const sxProperties = getItemSx(item, index, items.length)
        const content = renderContent(item, index)
        const autoTestId = getItemAutoTestId(item)
        const autoTestAttributes = autoTestId
            ? createAutoTestAttributes(autoTestId)
            : {}

        if (item.type === 'text') {
            return <Box
                key={item.id}
                aria-current={index === items.length - 1 ? 'page' : undefined}
                sx={sxProperties}
                {...autoTestAttributes}
            >
                {content}
            </Box>
        }

        if (item.type === 'action') {
            return <PneButton
                key={item.id}
                pneStyle='text'
                sx={[
                    ...(Array.isArray(sxProperties) ? sxProperties : [sxProperties]),
                    {
                        justifyContent: 'left',
                        padding: 0,
                        '&:hover': {
                            backgroundColor: 'background.default',
                            textDecoration: 'none',
                        },
                    },
                ]}
                onClick={item.onClick}
                {...autoTestAttributes}
            >
                {content}
            </PneButton>
        }

        return <MuiLink
            key={item.id}
            component={LinkComponent}
            href={item.href}
            sx={[
                ...(Array.isArray(sxProperties) ? sxProperties : [sxProperties]),
                {textDecoration: 'none'},
            ]}
            {...autoTestAttributes}
        >
            {content}
        </MuiLink>
    }

    const renderMenuItem = (item: PneBreadcrumbItem): React.ReactNode => {
        const autoTestId = getItemAutoTestId(item)
        const autoTestAttributes = autoTestId
            ? createAutoTestAttributes(autoTestId)
            : {}

        if (item.type === 'link') {
            return <MenuItem
                key={item.id}
                component={LinkComponent}
                href={item.href}
                onClick={handleMenuClose}
                {...autoTestAttributes}
            >
                {item.label}
            </MenuItem>
        }

        if (item.type === 'action') {
            return <MenuItem
                key={item.id}
                onClick={() => {
                    handleMenuClose()
                    item.onClick()
                }}
                {...autoTestAttributes}
            >
                {item.label}
            </MenuItem>
        }

        return <MenuItem
            key={item.id}
            disabled
            {...autoTestAttributes}
        >
            {item.label}
        </MenuItem>
    }

    const visibleItems = collapsed && items.length > 2
        ? [
            renderItem(items[0], 0),
            <IconButton
                key='more-button'
                id={menuButtonId}
                aria-controls={anchorEl ? `${menuButtonId}-menu` : undefined}
                aria-expanded={anchorEl ? 'true' : undefined}
                aria-haspopup='menu'
                aria-label={moreLabel}
                color='primary'
                size='small'
                onClick={event => setAnchorEl(event.currentTarget)}
                {...createAutoTestAttributes('link.more')}
            >
                <MoreHorizIcon/>
            </IconButton>,
            renderItem(items[items.length - 1], items.length - 1),
        ]
        : items.map(renderItem)

    if (items.length === 0) {
        return null
    }

    return <>
        <Menu
            id={`${menuButtonId}-menu`}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            slotProps={{list: {'aria-labelledby': menuButtonId}}}
            disableScrollLock
        >
            {menuItems.map(renderMenuItem)}
        </Menu>
        <Box
            ref={rootRef}
            sx={[
                {
                    display: 'flex',
                    maxWidth: '100%',
                    minWidth: 0,
                    width: '100%',
                },
                ...(sx === undefined
                    ? []
                    : Array.isArray(sx)
                        ? sx
                        : [sx]),
            ]}
        >
            <Breadcrumbs
                aria-label={ariaLabel}
                separator='/'
                sx={{
                    maxWidth: '100%',
                    minWidth: 0,
                    '& .MuiBreadcrumbs-li': {
                        minWidth: 0,
                    },
                }}
            >
                {visibleItems}
            </Breadcrumbs>
        </Box>
    </>
}
