import * as React from 'react'

import {
    PneBreadcrumbs,
    PneOrdersIcon,
    type PneBreadcrumbItem,
    type PneBreadcrumbsProps,
} from 'pne-ui'

type BridgeLinkProps = Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> & {
    href: string
}

const BridgeLink = React.forwardRef<HTMLAnchorElement, BridgeLinkProps>(
    ({href, ...props}, ref) => <a href={href} ref={ref} {...props}/>,
)

const items = [
    {
        icon: <PneOrdersIcon/>,
        id: 'orders',
        label: 'Orders',
        type: 'text',
    },
    {
        href: '/paynet-ui/react-orders',
        id: 'orders-search',
        label: 'Orders search',
        type: 'link',
    },
    {
        id: 'refresh',
        label: 'Refresh',
        onClick: () => undefined,
        type: 'action',
    },
    {
        id: 'order',
        label: <>Order <strong>8861110</strong></>,
        tooltip: 'Order 8861110',
        type: 'text',
    },
] as const satisfies readonly PneBreadcrumbItem[]

const props: PneBreadcrumbsProps = {
    ariaLabel: 'Order path',
    items,
    linkComponent: BridgeLink,
    moreLabel: 'More pages',
}

const validContracts = <>
    <PneBreadcrumbs {...props}/>
    <PneBreadcrumbs items={items}/>
</>

// @ts-expect-error Link items require href.
const missingHref: PneBreadcrumbItem = {id: 'broken', label: 'Broken', type: 'link'}

// @ts-expect-error Text items cannot navigate.
const textWithHref: PneBreadcrumbItem = {
    href: '/broken',
    id: 'broken',
    label: 'Broken',
    type: 'text',
}

// @ts-expect-error Action items require onClick.
const missingAction: PneBreadcrumbItem = {id: 'broken', label: 'Broken', type: 'action'}

// @ts-expect-error Link items cannot also execute actions.
const linkWithAction: PneBreadcrumbItem = {
    href: '/broken',
    id: 'broken',
    label: 'Broken',
    onClick: () => undefined,
    type: 'link',
}

// @ts-expect-error Unknown item variants are rejected.
const invalidType: PneBreadcrumbItem = {id: 'broken', label: 'Broken', type: 'current'}

void validContracts
void missingHref
void textWithHref
void missingAction
void linkWithAction
void invalidType
