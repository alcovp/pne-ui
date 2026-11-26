import {Box, Button, Link} from '@mui/material'
import type {Meta, StoryObj} from '@storybook/react-webpack5'
import * as React from 'react'

import {PAYNET_LEFT_MENU_PAGE_HEADER_INSET, PnePageHeader, PneOrdersIcon, type PneBreadcrumbItem} from '../index'

const DemoLink = ({
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {ref?: React.Ref<HTMLAnchorElement>}) => <Link ref={ref} {...props} />

const merchantsTrail: readonly PneBreadcrumbItem[] = [
    {href: '/paynet-ui/react-settings', id: 'settings', label: 'Settings', type: 'link'},
    {id: 'users', label: 'Users', type: 'text'},
    {id: 'merchants', label: 'Merchants', type: 'text'},
]

const gateTrail: readonly PneBreadcrumbItem[] = [
    {href: '/paynet-ui/react-settings', id: 'settings', label: 'Settings', type: 'link'},
    {id: 'configuration', label: 'Configuration', type: 'text'},
    {href: '/paynet-ui/settings/react-gates', id: 'gates', label: 'Gates', type: 'link'},
    {id: 'gate', label: 'Gate', type: 'text'},
]

const gateTabTrail: readonly PneBreadcrumbItem[] = [
    ...gateTrail.slice(0, 3),
    {href: '/paynet-ui/settings/react-gates/view/id/311056', id: 'gate', label: 'Gate', type: 'link'},
    {id: 'properties', label: 'Properties', type: 'text'},
]

const gateEntity = {
    crumbId: 'gate',
    id: '311056',
    link: {autoTestId: 'order-search-btn', href: '/paynet-ui/react-orders?order_entity_id=311056', label: 'Orders'},
    name: 'Visa EUR 3DS gate',
}

const labels = {breadcrumbs: 'Page path', copied: 'Text copied!', copy: 'Copy to clipboard', more: 'More pages'}

const meta = {
    title: 'pne-ui/PnePageHeader',
    component: PnePageHeader,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'The header of an application page: one row of the breadcrumbs and the page actions. The last crumb names the page; the crumb of the page entity holds its id and name.',
            },
        },
    },
    args: {
        breadcrumbs: merchantsTrail,
        labels,
        linkComponent: DemoLink,
        menuInset: PAYNET_LEFT_MENU_PAGE_HEADER_INSET,
        sticky: false,
    },
    decorators: [
        Story => (
            <Box sx={{bgcolor: 'background.default', minWidth: 0}}>
                <Story />
            </Box>
        ),
    ],
} satisfies Meta<typeof PnePageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const List: Story = {
    args: {
        actions: (
            <Button variant='contained' size='medium'>
                New merchant
            </Button>
        ),
    },
}

export const Entity: Story = {
    args: {
        breadcrumbs: gateTrail,
        entity: gateEntity,
        actions: (
            <>
                <Button variant='soft' size='medium'>
                    Clone
                </Button>
                <Button variant='contained' size='medium'>
                    Edit
                </Button>
            </>
        ),
    },
}

export const EntityTab: Story = {
    args: {
        breadcrumbs: gateTabTrail,
        entity: gateEntity,
        actions: (
            <Button variant='contained' size='medium'>
                Edit
            </Button>
        ),
    },
}

export const OrderPage: Story = {
    args: {
        breadcrumbs: [
            {icon: <PneOrdersIcon />, id: 'orders', label: 'Orders', type: 'text'},
            {href: '/paynet-ui/react-orders', id: 'orders-search', label: 'Orders search', type: 'link'},
            {id: 'order', label: 'Order', type: 'text'},
        ],
        entity: {crumbId: 'order', id: '1000055950'},
        actions: (
            <Button variant='soft' size='medium'>
                Edit
            </Button>
        ),
    },
}

export const NarrowEntityTab: Story = {
    args: EntityTab.args,
    globals: {
        viewport: {
            // A phone: the trail folds around the entity's crumb, the actions take a row of their own.
            value: 'mobile360Short',
            isRotated: false,
        },
    },
}
