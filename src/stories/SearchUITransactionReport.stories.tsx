import React, {useState} from 'react'
import {Box, Typography} from '@mui/material'
import type {Meta, StoryObj} from '@storybook/react-webpack5'
import {userEvent, within} from 'storybook/test'
import {
    CriterionTypeEnum,
    type SearchUIConditionsInput,
} from '../component/search-ui/filters/types'
import {
    SearchUIFilters,
    type SearchUIFiltersConfig,
} from '../component/search-ui/filters/SearchUIFilters'
import type {SearchUIValidationResult} from '../component/search-ui/filters/validation'
import {SearchUIProvider} from '../component/search-ui/SearchUIProvider'
import {OverlayHost, PneButton} from '../index'

type Props = {
    invalidRange?: boolean
}

const REPORT_CRITERIA = [
    CriterionTypeEnum.DATE_RANGE,
    CriterionTypeEnum.TRANSACTION_REPORT_SCOPE,
    CriterionTypeEnum.TRANSACTION_DATE_TYPE,
    CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER,
    CriterionTypeEnum.TIME_ZONE,
    CriterionTypeEnum.CSV_CHARSET,
]

const FILTERS_CONFIG: SearchUIFiltersConfig = {
    hideTemplatesSelect: true,
    hideShowFiltersButton: true,
    manualSearch: true,
    dateRange: {
        dateRangeSpecTypes: ['EXACTLY'],
        maxRangeSpanInDays: 93,
    },
}

const TransactionReportFilters = ({invalidRange = false}: Props) => {
    const [validationResult, setValidationResult] = useState<SearchUIValidationResult | null>(null)

    const initialSearchConditions: Partial<Omit<SearchUIConditionsInput, 'criteria'>> = {
        dateRangeSpec: {
            dateRangeSpecType: 'EXACTLY',
            dateFrom: new Date('2026-01-01T00:00:00.000Z'),
            dateTo: new Date(invalidRange
                ? '2026-04-04T00:00:00.000Z'
                : '2026-01-31T00:00:00.000Z'),
        },
        scope: 'SELECTED_BY_SESS_ID',
        transactionIds: '103421\n103422\n103423',
        datesType: 'CREATED',
        recurrentFilter: 'RECURRENTS_ONLY',
        timeZoneOffsetHours: 3,
        csvCharset: 'UTF-8-SIG',
    }

    return <OverlayHost>
        <SearchUIProvider>
            <Box sx={{width: 'min(1120px, 100%)', mx: 'auto', py: '16px'}}>
                <SearchUIFilters
                    settingsContextName={`storybook-transaction-report-${invalidRange ? 'invalid' : 'valid'}`}
                    possibleCriteria={REPORT_CRITERIA}
                    predefinedCriteria={REPORT_CRITERIA}
                    initialSearchConditions={initialSearchConditions}
                    onFiltersUpdate={() => undefined}
                    onValidationChange={setValidationResult}
                    config={FILTERS_CONFIG}
                />
                <Box sx={{display: 'flex', alignItems: 'center', gap: '12px', px: '16px', pt: '16px'}}>
                    <PneButton
                        variant={'contained'}
                        disabled={!validationResult?.isValid}
                    >
                        {'Generate report'}
                    </PneButton>
                    <Typography
                        data-testid={'external-validation-status'}
                        color={validationResult?.isValid ? 'success.main' : 'error.main'}
                        variant={'body2'}
                    >
                        {validationResult?.isValid ? 'Ready to generate' : 'Report filters are invalid'}
                    </Typography>
                </Box>
            </Box>
        </SearchUIProvider>
    </OverlayHost>
}

export default {
    title: 'pne-ui/SearchUI/Transaction Report',
    component: TransactionReportFilters,
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof TransactionReportFilters>

type Story = StoryObj<typeof TransactionReportFilters>

export const CompleteCriteria: Story = {
    args: {
        invalidRange: false,
    },
}

export const RangeValidation: Story = {
    args: {
        invalidRange: true,
    },
}

export const ScopeOptions: Story = {
    args: {
        invalidRange: false,
    },
    play: async ({canvasElement}) => {
        const scopeLabel = within(canvasElement).getAllByText('By order ID')
            .find(element => element.closest('.MuiChip-root'))
        const scopeMenuButton = scopeLabel?.closest('.MuiChip-root')
            ?.querySelector('.MuiChip-deleteIcon')

        if (!(scopeMenuButton instanceof Element)) {
            throw new Error('Report scope menu button was not found')
        }

        await userEvent.click(scopeMenuButton)
    },
}
