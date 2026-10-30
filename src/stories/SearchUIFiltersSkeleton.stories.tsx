import React from 'react'
import {Box, Divider, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    CriterionTypeEnum,
    SearchUIFilters,
    SearchUIProvider,
    type SearchUIDefaults,
} from '../index'

const meta = {
    title: 'pne-ui/SearchUI/Loading skeleton',
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta

export default meta

type Story = StoryObj<Record<string, never>>

// The host already knows the fold and the name of the set chosen last time, but the set itself never
// arrives: the panel stays on its skeleton.
const waitingForTheSet = (collapsed: boolean): Partial<SearchUIDefaults> => ({
    getSearchFiltersCollapsed: () => Promise.resolve(collapsed),
    saveSearchFiltersCollapsed: () => Promise.resolve(),
    peekSearchFiltersCollapsed: () => collapsed,
    getLastSearchTemplateName: () => Promise.resolve('Declines'),
    saveLastSearchTemplateName: () => Promise.resolve(),
    peekLastSearchTemplateName: () => 'Declines',
    getSearchTemplates: () => new Promise(() => undefined),
})

const Panel = (props: {collapsed: boolean, context: string}) => <SearchUIProvider defaults={waitingForTheSet(props.collapsed)}>
    <SearchUIFilters
        autoTestId={props.context}
        settingsContextName={props.context}
        possibleCriteria={[
            CriterionTypeEnum.EXACT,
            CriterionTypeEnum.STATUS,
            CriterionTypeEnum.CURRENCY,
            CriterionTypeEnum.THREE_D,
        ]}
        predefinedCriteria={[CriterionTypeEnum.EXACT, CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY]}
        onFiltersUpdate={() => undefined}
        config={{manualSearch: true}}
    />
    <Divider/>
</SearchUIProvider>

/**
 * The panel waiting for the filter set chosen last time: folded it is the actions row alone, open it
 * draws a row per predefined filter, so the table under it stays where it will be. Below 600px the rows
 * take the phone layout of the panel.
 */
export const WaitingForTheChosenSet: Story = {
    render: () => <Stack spacing={4} sx={{py: 2}}>
        <Box>
            <Typography sx={{px: 2}} variant='caption'>Folded</Typography>
            <Panel collapsed context='skeleton-story-folded'/>
        </Box>
        <Box>
            <Typography sx={{px: 2}} variant='caption'>Open, three predefined filters</Typography>
            <Panel collapsed={false} context='skeleton-story-open'/>
        </Box>
    </Stack>,
}
