import React, {useMemo, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    CriterionTypeEnum,
    OverlayHost,
    SearchUIFilters,
    SearchUIProvider,
    type SearchUIDefaults,
    type SearchUITemplate,
} from '../index'
import {getSearchUIInitialSearchCriteria} from '../component/search-ui/filters/state/initial'
import {initialSearchUIDefaults} from '../component/search-ui/SearchUIProvider'
import type {DateRangeSpecType} from '../component/search-ui/filters/types'

type ReorderMode = 'supported' | 'fails' | 'unsupported'

type TemplatesStoryProps = {
    templateNames?: readonly string[]
    /** How the host handles `reorderSearchTemplates`. */
    reorder?: ReorderMode
    latencyMs?: number
}

const TICKET_TEMPLATE_NAMES = [
    'Merchant_CI',
    'PSP_CI',
    'Paywize',
    'PixPay',
    'Kynexas',
    'Altitude',
    'Cashier',
    'Gumballpay',
] as const

const MANY_TEMPLATE_NAMES = [
    ...TICKET_TEMPLATE_NAMES,
    'Chargebacks this month — all merchants with a very long template name',
    'Declines by issuer',
    'EU acquiring',
    'Fraud review queue',
    'High-risk MCC',
    'LATAM payouts',
    'Manual review',
    'Night batch',
    'Recurring renewals',
    'Refunds over 1000',
    'Settlement mismatches',
    'Test merchants',
    'UK open banking',
    'Weekend volume',
]

const DATE_RANGE_TYPES: DateRangeSpecType[] = [
    'TODAY',
    'YESTERDAY',
    'THIS_WEEK',
    'LAST_WEEK',
    'THIS_MONTH',
    'LAST_MONTH',
]

const createStoryTemplate = (name: string, index: number): SearchUITemplate => {
    const base = getSearchUIInitialSearchCriteria(initialSearchUIDefaults)

    return {
        name,
        searchConditions: {
            ...base,
            criteria: [CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.STATUS],
            dateRangeSpec: {
                ...base.dateRangeSpec,
                dateRangeSpecType: DATE_RANGE_TYPES[index % DATE_RANGE_TYPES.length],
            },
            status: index % 2 === 0 ? 'ENABLED' : 'ANY',
        },
    }
}

/** In-memory stand-in for the Paynet templates service, with network latency. */
const TemplatesStory = ({
    templateNames = TICKET_TEMPLATE_NAMES,
    reorder = 'supported',
    latencyMs = 300,
}: TemplatesStoryProps) => {
    const savedRef = useRef<SearchUITemplate[]>(templateNames.map(createStoryTemplate))
    const [savedOrder, setSavedOrder] = useState(() => templateNames.join(' · '))

    const defaults = useMemo<Partial<SearchUIDefaults>>(() => {
        const respond = () => new Promise(resolve => setTimeout(resolve, latencyMs))
        const publish = () => setSavedOrder(savedRef.current.map(template => template.name).join(' · '))

        return {
            getSearchTemplates: async () => {
                await respond()
                return [...savedRef.current]
            },
            searchTemplateExists: async ({templateName}) => {
                await respond()
                return savedRef.current.some(template => template.name === templateName)
            },
            saveSearchTemplate: async ({template}) => {
                await respond()
                const index = savedRef.current.findIndex(saved => saved.name === template.name)
                savedRef.current = index === -1
                    ? [...savedRef.current, template]
                    : savedRef.current.map(saved => saved.name === template.name ? template : saved)
                publish()
            },
            deleteSearchTemplate: async ({templateName}) => {
                await respond()
                savedRef.current = savedRef.current.filter(template => template.name !== templateName)
                publish()
            },
            ...(reorder === 'unsupported' ? {} : {
                reorderSearchTemplates: async ({templateNames: orderedNames}) => {
                    await respond()
                    if (reorder === 'fails') {
                        throw new Error('Template storage is unavailable')
                    }
                    const byName = new Map(savedRef.current.map(template => [template.name, template]))
                    savedRef.current = orderedNames.flatMap(name => byName.get(name) ?? [])
                    publish()
                },
            }),
        }
    }, [latencyMs, reorder])

    return <OverlayHost>
        <SearchUIProvider defaults={defaults}>
            <Box data-story-section='pne-ui-search-ui-templates' sx={{backgroundColor: 'background.paper'}}>
                <SearchUIFilters
                    autoTestId='storybook-templates'
                    settingsContextName={`storybook-templates-${reorder}`}
                    possibleCriteria={[CriterionTypeEnum.DATE_RANGE, CriterionTypeEnum.STATUS]}
                    predefinedCriteria={[CriterionTypeEnum.DATE_RANGE]}
                    onFiltersUpdate={() => undefined}
                />
                <Typography
                    color='text.secondary'
                    data-story-saved-order='true'
                    sx={{px: 2, pb: 2}}
                    variant='body2'
                >
                    {'Saved order: '}{savedOrder || '—'}
                </Typography>
            </Box>
        </SearchUIProvider>
    </OverlayHost>
}

export default {
    title: 'pne-ui/SearchUI/Templates',
    component: TemplatesStory,
    parameters: {
        docs: {
            description: {
                component: 'The templates menu of SearchUI filters. Drag a template by its grip, or focus it and '
                    + 'press Alt+↑ / Alt+↓, to change its position; the host persists the order through '
                    + '`reorderSearchTemplates`. "Saved order" below shows what the fake backend stored.',
            },
        },
    },
} as Meta<typeof TemplatesStory>

type Story = StoryObj<typeof TemplatesStory>

export const Reorderable: Story = {
    args: {},
}

export const ReorderSaveFails: Story = {
    name: 'Reorder save fails',
    args: {
        reorder: 'fails',
    },
}

export const HostWithoutReorder: Story = {
    name: 'Host without reorder support',
    args: {
        reorder: 'unsupported',
    },
}

export const ManyTemplates: Story = {
    name: 'Many templates',
    args: {
        templateNames: MANY_TEMPLATE_NAMES,
    },
}

export const NoTemplates: Story = {
    name: 'No templates',
    args: {
        templateNames: [],
    },
}

export const Mobile360: Story = {
    args: {},
    parameters: {
        viewport: {defaultViewport: 'mobile360'},
    },
}
