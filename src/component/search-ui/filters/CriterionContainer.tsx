import React from 'react';
import {CriterionTypeEnum, LinkedEntityTypeEnum} from './types';
import {Box, SxProps} from '@mui/material';
import {ExactSearchCriterion} from './component/criterion/ExactSearchCriterion';
import {StatusCriterion} from './component/criterion/StatusCriterion';
import {CriterionLeft} from './component/criterion/CriterionLeft';
import {CriterionRight} from './component/criterion/CriterionRight';
import {ThreeDCriterion} from './component/criterion/ThreeDCriterion';
import {CurrenciesCriterion} from './component/criterion/CurrenciesCriterion';
import {MultigetCriterionPanel} from './component/criterion/MultigetCriterionPanel';
import {MarkerStatusCriterion} from './component/criterion/MarkerStatusCriterion';
import {MarkerTypesCriterion} from './component/criterion/MarkerTypesCriterion';
import {MfoConfigurationTypesCriterion} from './component/criterion/MfoFonfigurationTypesCriterion';
import {RecurrenceStatusesCriterion} from './component/criterion/RecurrenceStatusesCriterion';
import {RecurrenceTypesCriterion} from './component/criterion/RecurrenceTypesCriterion';
import {TransactionTypesCriterion} from './component/criterion/TransactionTypesCriterion';
import {CardTypesCriterion} from './component/criterion/CardTypesCriterion';
import {DateRangeCriterion} from './component/criterion/DateRangeCriterion';
import {ProjectCurrencyCriterion} from './component/criterion/ProjectCurrencyCriterion';
import {GroupingCriterion} from './component/criterion/GroupingCriterion';
import {exhaustiveCheck} from '../../..';
import {OrdersSearchCriterion} from "./component/criterion/orders-search/OrdersSearchCriterion";
import { ProcessorLogEntryTypesCriterion } from './component/criterion/ProcessorLogEntryTypesCriterion'

interface IProps {
    type: CriterionTypeEnum
}

export const CriterionContainer = (props: IProps) => {

    const {
        type,
    } = props

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
            case CriterionTypeEnum.THREE_D:
                return <ThreeDCriterion/>
            case CriterionTypeEnum.CURRENCY:
                return <CurrenciesCriterion/>
            case CriterionTypeEnum.DATE_RANGE:
                return <DateRangeCriterion/>
            case CriterionTypeEnum.DATE_RANGE_ORDERS:
                return <DateRangeCriterion showOrdersDateType/>
            case CriterionTypeEnum.PROJECT_CURRENCY:
                return <ProjectCurrencyCriterion/>
            case CriterionTypeEnum.CARD_TYPES:
                return <CardTypesCriterion/>
            case CriterionTypeEnum.TRANSACTION_TYPES:
                return <TransactionTypesCriterion/>
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
            default:
                exhaustiveCheck(type)
        }
        throw new Error('Can\'t be')
    }

    return <Box sx={criterionSx}>
        <CriterionLeft criterionType={type}/>
        {renderCriterion()}
        <CriterionRight criterionType={type}/>
    </Box>
}

const criterionSx: SxProps = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: '40px',
    borderTop: '1px solid #EFF2F5',
}
