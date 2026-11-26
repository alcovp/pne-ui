import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {Box, ButtonBase, IconButton, Stack, Tooltip} from '@mui/material'
import * as React from 'react'

import {pneActionSpacing} from '../actionSpacing'
import {createAutoTestAttributes} from './AutoTestAttribute'
import {copyTextToClipboard} from './copyTextToClipboard'
import {overlayActions} from './overlay/overlayStore'
import {PneBreadcrumbs, type PneBreadcrumbItem} from './PneBreadcrumbs'

/** CSS custom property on `<html>` with the height of the sticky page header, for what sticks under it. */
export const PNE_PAGE_HEADER_HEIGHT_VARIABLE = '--pne-page-header-height'

/** Room left at the start of the header for a menu button that overlays the page on narrow screens. */
export type PnePageHeaderMenuInset = {
    /** Viewport width up to which the menu button overlays the page. */
    maxWidth: number
    inset: number
}

/** The Paynet left menu: up to 1080px it is a 48x64 button over the start of the page. */
export const PAYNET_LEFT_MENU_PAGE_HEADER_INSET = {maxWidth: 1080, inset: 56} as const satisfies PnePageHeaderMenuInset

export type PnePageHeaderEntity = {
    /** `id` of the crumb in `breadcrumbs` that stands for the entity; it shows the entity's id and name. */
    crumbId: string
    /** Shown in the crumb. On the entity's own page, where its crumb is the last one, a click copies it. */
    id: string
    name?: string
    /** A small ↗ right after the entity's crumb, e.g. to the entity's orders. */
    link?: {
        href: string
        /** Tooltip and accessible name. */
        label: string
        autoTestId?: string
    }
}

export type PnePageHeaderLabels = {
    /** Accessible name of the trail. */
    breadcrumbs?: string
    /** The button of the folded middle of the trail. */
    more?: string
    /** Tooltip of the entity's id on its own page. */
    copy?: string
    /** Message after the id is copied. */
    copied?: string
}

export type PnePageHeaderProps = {
    /** Already localized. The last crumb names the page: the header has no title of its own. */
    breadcrumbs: readonly PneBreadcrumbItem[]
    entity?: PnePageHeaderEntity
    /** The page's actions, right of the trail. They take a row of their own only when even the folded trail does not fit. */
    actions?: React.ReactNode
    /** A row across the whole header under the trail and the actions. */
    notice?: React.ReactNode
    /**
     * Sticks to the top while the page scrolls and publishes its height in `--pne-page-header-height`;
     * `false` scrolls with the page and publishes 0.
     */
    sticky?: boolean
    /** Bridge/router-aware anchor for the crumbs and the entity's link, as in PneBreadcrumbs. */
    linkComponent?: React.ElementType
    menuInset?: PnePageHeaderMenuInset
    labels?: PnePageHeaderLabels
    /** Locator of the header's row. */
    autoTestId?: string
}

/** PneBreadcrumbs' "..." button, a small IconButton, while the trail is not folded to show it. */
const FOLDED_MORE_WIDTH = 34

const NO_LABELS: PnePageHeaderLabels = {}

const outerWidth = (element: Element) => {
    const style = window.getComputedStyle(element)
    return (
        element.getBoundingClientRect().width +
        (Number.parseFloat(style.marginLeft) || 0) +
        (Number.parseFloat(style.marginRight) || 0)
    )
}

/**
 * Width of the trail folded into "...": the first crumb, the button, the crumbs that keep their place and the
 * last crumb, the narrowest PneBreadcrumbs gets. Read off its list, folded or not.
 */
const measureFoldedBreadcrumbsWidth = (list: HTMLElement): number => {
    const previousWidth = list.style.width
    // A squeezed list wraps and shrinks its crumbs; at its natural width each one is whole.
    list.style.width = 'max-content'
    try {
        const children = [...list.children]
        const crumbs = children.filter(child => child.classList.contains('MuiBreadcrumbs-li'))
        const separator = children.find(child => child.classList.contains('MuiBreadcrumbs-separator'))
        if (crumbs.length < 3 || !separator) {
            return Math.ceil(list.getBoundingClientRect().width)
        }
        const folded = crumbs.some(crumb => crumb.querySelector('[aria-haspopup="menu"]'))
        const kept = crumbs.slice(1, -1).filter(crumb => crumb.querySelector('[data-pne-breadcrumb-keep="true"]'))
        const more = folded
            ? outerWidth(crumbs.find(crumb => crumb.querySelector('[aria-haspopup="menu"]')) as Element)
            : FOLDED_MORE_WIDTH
        const shown = 3 + kept.length
        return Math.ceil(
            outerWidth(crumbs[0]) +
                more +
                kept.reduce((sum, crumb) => sum + outerWidth(crumb), 0) +
                outerWidth(crumbs[crumbs.length - 1]) +
                (shown - 1) * outerWidth(separator),
        )
    } finally {
        list.style.width = previousWidth
    }
}

type EntityLabelProps = {
    entity: PnePageHeaderEntity
    copyable: boolean
    labels: PnePageHeaderLabels
}

const EntityLabel = ({entity, copyable, labels}: EntityLabelProps) => {
    const copy = async () => {
        if (await copyTextToClipboard(entity.id)) {
            if (labels.copied) {
                overlayActions.showInfo({message: labels.copied})
            }
        }
    }

    return (
        <Box component='span' sx={{alignItems: 'center', display: 'inline-flex', gap: '8px', minWidth: 0}}>
            {copyable ? (
                <Tooltip title={labels.copy ?? ''} disableHoverListener={!labels.copy}>
                    <ButtonBase
                        disableRipple
                        onClick={() => void copy()}
                        {...createAutoTestAttributes('copy-entity-id')}
                        sx={{
                            alignItems: 'center',
                            borderRadius: '4px',
                            color: 'primary.main',
                            display: 'inline-flex',
                            flexShrink: 0,
                            font: 'inherit',
                            fontWeight: 400,
                            gap: '4px',
                            '&.Mui-focusVisible': {
                                outline: '2px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '2px',
                            },
                        }}
                    >
                        <ContentCopyIcon sx={{fontSize: 16}} />
                        {entity.id}
                    </ButtonBase>
                </Tooltip>
            ) : (
                <Box component='span' sx={{flexShrink: 0, fontWeight: 400}}>
                    {entity.id}
                </Box>
            )}
            {entity.name && (
                <Box
                    component='span'
                    sx={{minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
                >
                    {entity.name}
                </Box>
            )}
        </Box>
    )
}

type EntityLinkProps = {
    link: NonNullable<PnePageHeaderEntity['link']>
    linkComponent: React.ElementType
}

const EntityLink = ({link, linkComponent}: EntityLinkProps) => (
    <Tooltip title={link.label}>
        <IconButton
            component={linkComponent}
            href={link.href}
            size='small'
            color='primary'
            aria-label={link.label}
            {...createAutoTestAttributes(link.autoTestId ?? 'entity-link')}
            sx={{flexShrink: 0, height: 24, width: 24}}
        >
            <ArrowOutwardIcon sx={{fontSize: 16}} />
        </IconButton>
    </Tooltip>
)

/**
 * The header of an application page: one row of the breadcrumbs and the page's actions, with a line under it.
 * The last crumb names the page; the crumb of the page's entity holds its id and name and never folds away.
 */
export const PnePageHeader = ({
    breadcrumbs,
    entity,
    actions,
    notice,
    sticky = true,
    linkComponent = 'a',
    menuInset,
    labels = NO_LABELS,
    autoTestId = 'page-header',
}: PnePageHeaderProps) => {
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const trailRef = React.useRef<HTMLDivElement | null>(null)
    const [foldedWidth, setFoldedWidth] = React.useState<number>()

    const items = React.useMemo(() => {
        if (!entity) {
            return breadcrumbs
        }
        return breadcrumbs.map((item, index) => {
            if (item.id !== entity.crumbId) {
                return item
            }
            const copyable = index === breadcrumbs.length - 1 && item.type === 'text'
            return {
                ...item,
                label: <EntityLabel entity={entity} copyable={copyable} labels={labels} />,
                tooltip: entity.name ? `${entity.id} ${entity.name}` : entity.id,
                keepVisible: true,
                endAdornment: entity.link ? <EntityLink link={entity.link} linkComponent={linkComponent} /> : undefined,
            }
        })
    }, [breadcrumbs, entity, labels, linkComponent])

    // The trail asks for its folded width only: anything wider it takes from the free room, and PneBreadcrumbs
    // folds itself when the room is short. The width depends on the labels only, so the layout cannot feed back.
    React.useLayoutEffect(() => {
        const list = trailRef.current?.querySelector('ol')
        if (list) {
            setFoldedWidth(measureFoldedBreadcrumbsWidth(list))
        }
    }, [items])

    React.useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) {
            return
        }
        const html = root.ownerDocument.documentElement
        const publish = () => {
            html.style.setProperty(
                PNE_PAGE_HEADER_HEIGHT_VARIABLE,
                sticky ? `${Math.round(root.getBoundingClientRect().height)}px` : '0px',
            )
        }
        publish()
        const ResizeObserverConstructor = root.ownerDocument.defaultView?.ResizeObserver
        const observer = ResizeObserverConstructor ? new ResizeObserverConstructor(publish) : undefined
        observer?.observe(root)
        return () => {
            observer?.disconnect()
            html.style.removeProperty(PNE_PAGE_HEADER_HEIGHT_VARIABLE)
        }
    }, [sticky])

    const hasActions = actions !== undefined && actions !== null && actions !== false

    return (
        <Box
            ref={rootRef}
            data-pne-page-header='true'
            sx={{
                position: sticky ? 'sticky' : 'relative',
                top: 0,
                zIndex: 888,
                bgcolor: 'background.default',
                borderBottom: '1px solid',
                borderColor: 'primary.main',
                minWidth: 0,
            }}
        >
            <Box
                data-pne-page-header-row='true'
                {...createAutoTestAttributes(autoTestId)}
                sx={{
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    columnGap: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    minHeight: '64px',
                    minWidth: 0,
                    px: '15px',
                    py: '16px',
                    rowGap: '8px',
                    ...(menuInset && {
                        [`@media (max-width: ${menuInset.maxWidth}px)`]: {pl: `${menuInset.inset}px`},
                    }),
                }}
            >
                <Box
                    ref={trailRef}
                    data-pne-page-header-trail='true'
                    style={foldedWidth === undefined ? undefined : {minWidth: `min(${foldedWidth}px, 100%)`}}
                    sx={{
                        alignItems: 'center',
                        display: 'flex',
                        flex: '1 1 0',
                        // The trail's line box: folding into "..." leaves the header as tall, the 34px button
                        // runs into the padding instead, cut only at the sides.
                        height: '24px',
                        minWidth: 0,
                        overflow: 'hidden',
                        '@supports (overflow: clip)': {overflowX: 'clip', overflowY: 'visible'},
                    }}
                >
                    <PneBreadcrumbs
                        items={items}
                        linkComponent={linkComponent}
                        ariaLabel={labels.breadcrumbs}
                        moreLabel={labels.more}
                    />
                </Box>
                {hasActions && (
                    <Stack
                        direction='row'
                        data-pne-page-header-actions='true'
                        sx={{
                            alignItems: 'center',
                            flex: '0 1 auto',
                            flexWrap: 'wrap',
                            gap: pneActionSpacing.groups,
                            justifyContent: 'flex-end',
                            minWidth: 0,
                            ml: 'auto',
                        }}
                    >
                        {actions}
                    </Stack>
                )}
                {notice !== undefined && notice !== null && notice !== false && (
                    <Box sx={{flexBasis: '100%', minWidth: 0}}>{notice}</Box>
                )}
            </Box>
        </Box>
    )
}
