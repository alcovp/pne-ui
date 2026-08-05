import {Box, Link} from '@mui/material'
import type {Meta, StoryObj} from '@storybook/react-webpack5'
import * as React from 'react'

import {
    PneBreadcrumbs,
    PneOrdersIcon,
    type PneBreadcrumbItem,
} from '../index'

const orderItems: readonly PneBreadcrumbItem[] = [
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
        id: 'order',
        label: 'Order',
        type: 'text',
    },
]

const DemoLink = React.forwardRef<
    HTMLAnchorElement,
    React.ComponentPropsWithoutRef<typeof Link>
>((props, ref) => <Link ref={ref} {...props}/>)

const meta = {
    title: 'pne-ui/PneBreadcrumbs',
    component: PneBreadcrumbs,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Router- and i18n-agnostic breadcrumbs. Consumers provide localized labels and a bridge-aware link component.',
            },
        },
    },
    args: {
        ariaLabel: 'Order path',
        items: orderItems,
        linkComponent: DemoLink,
        moreLabel: 'More pages',
    },
    decorators: [
        Story => <Box
            sx={{
                alignItems: 'center',
                display: 'flex',
                minHeight: 64,
                px: 1.875,
            }}
        >
            <Story/>
        </Box>,
    ],
} satisfies Meta<typeof PneBreadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const OrderDetails: Story = {}

export const LongTrail: Story = {
    args: {
        items: [
            orderItems[0],
            orderItems[1],
            {
                href: '/paynet-ui/react-orders/saved',
                id: 'saved-searches',
                label: 'Saved order searches',
                type: 'link',
            },
            {
                id: 'refresh',
                label: 'Refresh data',
                onClick: () => undefined,
                type: 'action',
            },
            {
                id: 'order',
                label: 'Order 8861110 with a deliberately long localized title',
                type: 'text',
            },
        ],
    },
    decorators: [
        Story => <Box sx={{width: 430}}>
            <Story/>
        </Box>,
    ],
}

export const Mobile: Story = {
    parameters: {
        viewport: {
            defaultViewport: 'mobile360',
        },
    },
    args: {
        items: [
            orderItems[0],
            orderItems[1],
            {
                id: 'order',
                label: 'Order 8861110 with a long localized title',
                type: 'text',
            },
        ],
    },
}
