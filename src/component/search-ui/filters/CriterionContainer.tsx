import React from 'react'
import { CriterionTypeEnum, LinkedEntityTypeEnum } from './types'
import { Box, SxProps } from '@mui/material'
import { ExactSearchCriterion } from './component/criterion/ExactSearchCriterion'
import { StatusCriterion } from './component/criterion/StatusCriterion'
import { OtpStatusCriterion } from './component/criterion/OtpStatusCriterion'
import { CriterionLeft } from './component/criterion/CriterionLeft'
import { CriterionRight } from './component/criterion/CriterionRight'
import { ThreeDCriterion } from './component/criterion/ThreeDCriterion'
import { CurrenciesCriterion } from './component/criterion/CurrenciesCriterion'
import { MultigetCriterionPanel } from './component/criterion/MultigetCriterionPanel'
import { MarkerStatusCriterion } from './component/criterion/MarkerStatusCriterion'
import { MarkerTypesCriterion } from './component/criterion/MarkerTypesCriterion'
import { MfoConfigurationTypesCriterion } from './component/criterion/MfoFonfigurationTypesCriterion'
import { RecurrenceStatusesCriterion } from './component/criterion/RecurrenceStatusesCriterion'
import { RecurrenceTypesCriterion } from './component/criterion/RecurrenceTypesCriterion'
import { TransactionTypesCriterion } from './component/criterion/TransactionTypesCriterion'
import { TransactionStatusesCriterion } from './component/criterion/TransactionStatusesCriterion'
import { TransactionSessionStatusCriterion } from './component/criterion/TransactionSessionStatusCriterion'
import { CardTypesCriterion } from './component/criterion/CardTypesCriterion'
import { CountriesCriterion } from './component/criterion/CountriesCriterion'
import { DateRangeCriterion } from './component/criterion/DateRangeCriterion'
import { ProjectCurrencyCriterion } from './component/criterion/ProjectCurrencyCriterion'
import { GroupingCriterion } from './component/criterion/GroupingCriterion'
import { exhaustiveCheck } from '../../..'
import { OrdersSearchCriterion } from './component/criterion/orders-search/OrdersSearchCriterion'
import { ProcessorLogEntryTypesCriterion } from './component/criterion/ProcessorLogEntryTypesCriterion'
import { ErrorCodeCriterion } from './component/criterion/ErrorCodeCriterion'
import { CustomerLevelCriterion } from './component/criterion/CustomerLevelCriterion'
import {createAutoTestAttributes} from '../../AutoTestAttribute'
import {SearchUICriterionAutoTestScopeProvider} from './AutoTestScope'
import {useTranslation} from 'react-i18next'
import { TransactionReportScopeCriterion } from './component/criterion/TransactionReportScopeCriterion'
import { TransactionDateTypeCriterion } from './component/criterion/TransactionDateTypeCriterion'
import { TransactionRecurrentFilterCriterion } from './component/criterion/TransactionRecurrentFilterCriterion'
import { TimeZoneCriterion } from './component/criterion/TimeZoneCriterion'
import { CsvCharsetCriterion } from './component/criterion/CsvCharsetCriterion'
import {
    SEARCH_UI_FILTERS_COLUMN_GAP,
    SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
    SEARCH_UI_FILTERS_NO_SUBGRID,
    SEARCH_UI_FILTERS_PHONE_MEDIA,
} from './layout'

const CRITERION_AUTOTEST_ID = 'criterion'

interface IProps {
    disabled?: boolean
    type: CriterionTypeEnum
}

export const CriterionContainer = (props: IProps) => {

    const {
        disabled = false,
        type,
    } = props
    const {t} = useTranslation()
    const disabledTitle = disabled
        ? t('react.searchUI.criterion.notAvailableInView', {
            defaultValue: 'This filter is not available in the selected view',
        })
        : undefined
    const disabledAriaLabel = disabled
        ? `${t('react.CriterionTypeEnum.' + type)}: ${disabledTitle}`
        : undefined

    const renderCriterion = () => {
        switch (type) {
            case CriterionTypeEnum.PROJECT:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.PROJECT}
                />
            case CriterionTypeEnum.ENDPOINT:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.ENDPOINT}
                />
            case CriterionTypeEnum.GATE:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.GATE}
                />
            case CriterionTypeEnum.PROCESSOR:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.PROCESSOR}
                />
            case CriterionTypeEnum.COMPANY:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.COMPANY}
                />
            case CriterionTypeEnum.MANAGER:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.MANAGER}
                />
            case CriterionTypeEnum.MERCHANT:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.MERCHANT}
                />
            case CriterionTypeEnum.RESELLER:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.RESELLER}
                />
            case CriterionTypeEnum.DEALER:
                return <MultigetCriterionPanel
                    criterionType={type}
                    entityType={LinkedEntityTypeEnum.DEALER}
                />
            case CriterionTypeEnum.EXACT:
                return <ExactSearchCriterion/>
            case CriterionTypeEnum.ORDERS_SEARCH:
                return <OrdersSearchCriterion/>
            case CriterionTypeEnum.STATUS:
                return <StatusCriterion/>
            case CriterionTypeEnum.OTP_STATUS:
                return <OtpStatusCriterion/>
            case CriterionTypeEnum.THREE_D:
                return <ThreeDCriterion/>
            case CriterionTypeEnum.CURRENCY:
                return <CurrenciesCriterion/>
            case CriterionTypeEnum.CUSTOMER_LEVEL:
                return <CustomerLevelCriterion/>
            case CriterionTypeEnum.DATE_RANGE:
                return <DateRangeCriterion/>
            case CriterionTypeEnum.DATE_RANGE_ORDERS:
                return <DateRangeCriterion showOrdersDateType/>
            case CriterionTypeEnum.PROJECT_CURRENCY:
                return <ProjectCurrencyCriterion/>
            case CriterionTypeEnum.CARD_TYPES:
                return <CardTypesCriterion/>
            case CriterionTypeEnum.COUNTRIES:
                return <CountriesCriterion/>
            case CriterionTypeEnum.TRANSACTION_TYPES:
                return <TransactionTypesCriterion/>
            case CriterionTypeEnum.TRANSACTION_STATUS:
                return <TransactionStatusesCriterion/>
            case CriterionTypeEnum.TRANSACTION_SESSION_STATUS:
                return <TransactionSessionStatusCriterion/>
            case CriterionTypeEnum.GROUPING:
                return <GroupingCriterion/>
            case CriterionTypeEnum.RECURRENCE_TYPE:
                return <RecurrenceTypesCriterion/>
            case CriterionTypeEnum.RECURRENCE_STATUS:
                return <RecurrenceStatusesCriterion/>
            case CriterionTypeEnum.MFO_CONFIGURATION_TYPE:
                return <MfoConfigurationTypesCriterion/>
            case CriterionTypeEnum.MARKER_TYPE:
                return <MarkerTypesCriterion/>
            case CriterionTypeEnum.MARKER_STATUS:
                return <MarkerStatusCriterion/>
            case CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE:
                return <ProcessorLogEntryTypesCriterion/>
            case CriterionTypeEnum.ERROR_CODE:
                return <ErrorCodeCriterion/>
            case CriterionTypeEnum.TRANSACTION_REPORT_SCOPE:
                return <TransactionReportScopeCriterion/>
            case CriterionTypeEnum.TRANSACTION_DATE_TYPE:
                return <TransactionDateTypeCriterion/>
            case CriterionTypeEnum.TRANSACTION_RECURRENT_FILTER:
                return <TransactionRecurrentFilterCriterion/>
            case CriterionTypeEnum.TIME_ZONE:
                return <TimeZoneCriterion/>
            case CriterionTypeEnum.CSV_CHARSET:
                return <CsvCharsetCriterion/>
            default:
                exhaustiveCheck(type)
        }
        throw new Error('Can\'t be')
    }

    // The icons sit between the name and the value, in DOM order too, so the keyboard reaches them
    // before the control they act on.
    return <SearchUICriterionAutoTestScopeProvider criterionType={type}>
        <Box
            {...createAutoTestAttributes(CRITERION_AUTOTEST_ID, type)}
            sx={criterionSx}
        >
            <Box sx={criterionLeftWrapperSx}>
                <CriterionLeft criterionType={type}/>
            </Box>
            <Box sx={criterionActionsWrapperSx}>
                <CriterionRight criterionType={type}/>
            </Box>
            <Box
                aria-disabled={disabled || undefined}
                aria-label={disabledAriaLabel}
                onClickCapture={disabled ? event => {
                    event.preventDefault()
                    event.stopPropagation()
                } : undefined}
                role={disabled ? 'group' : undefined}
                sx={{
                    ...criterionContentWrapperSx,
                    ...(disabled ? disabledCriterionContentSx : {}),
                }}
                tabIndex={disabled ? 0 : undefined}
                title={disabledTitle}
            >
                <Box
                    component='fieldset'
                    disabled={disabled}
                    inert={disabled || undefined}
                    sx={criterionFieldsetSx}
                >
                    {renderCriterion()}
                </Box>
            </Box>
        </Box>
    </SearchUICriterionAutoTestScopeProvider>
}

// One row of the panel grid: a subgrid shares the root's name, icons and values columns.
const criterionSx: SxProps = {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    alignItems: 'center',
    minHeight: '40px',
    borderTop: '1px solid #EFF2F5',
    [SEARCH_UI_FILTERS_NO_SUBGRID]: {
        gridTemplateColumns: SEARCH_UI_FILTERS_FALLBACK_COLUMNS,
        columnGap: SEARCH_UI_FILTERS_COLUMN_GAP,
    },
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gridTemplateAreas: `
            "left right"
            "content content"
        `,
        columnGap: '8px',
        rowGap: '8px',
        paddingTop: '8px',
        paddingBottom: '8px',
    },
}

const criterionLeftWrapperSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridArea: 'left',
    },
}

const criterionContentWrapperSx = {
    minWidth: 0,
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridArea: 'content',
    },
}

const criterionFieldsetSx = {
    border: 0,
    margin: 0,
    minWidth: 0,
    padding: 0,
}

const disabledCriterionContentSx = {
    opacity: 0.5,
    pointerEvents: 'none',
}

// The icons column: a lone eraser keeps to the value side, the cross sits left of it.
const criterionActionsWrapperSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        gridArea: 'right',
    },
}
