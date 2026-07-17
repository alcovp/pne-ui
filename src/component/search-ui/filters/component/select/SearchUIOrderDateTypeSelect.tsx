import React, {useState} from 'react';
import {ORDER_DATE_TYPES, OrderDate} from '../../types';
import {Box, Chip, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {selectUnderChipSx} from './style';
import {PneSelect} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope';

const CRITERION_ORDER_DATE_TYPE_AUTOTEST_ID = 'criterion-order-date-type';
const CRITERION_ORDER_DATE_TYPE_OPTIONS_AUTOTEST_ID = 'criterion-order-date-type-options';
const CRITERION_ORDER_DATE_TYPE_OPTION_AUTOTEST_ID = 'criterion-order-date-type-option';

export const SearchUIOrderDateTypeSelect = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'orders.orderlist.search.datesType'})
    const autoTestOwner = useSearchUIAutoTestScope()

    const orderDateType = useSearchUIFiltersStore(s => s.orderDateType)
    const setDateRangeCriterionOrderDateType = useSearchUIFiltersStore(s => s.setDateRangeCriterionOrderDateType)

    const [open, setOpen] = useState(false)
    const orderDateTypeAriaLabel = t('react.searchUI.dateRange.orderDateType', {
        defaultValue: 'Order date type',
    })

    const selectSx: SxProps = {
        flexShrink: 0,
        width: '100%',
        [`& fieldset`]: {
            borderRadius: '0',
            borderColor: 'transparent !important',
            borderRightColor: 'transparent !important',
        },
        ...selectUnderChipSx
    }

    return <Box sx={{position: 'relative'}}>
        <Chip
            onDelete={() => setOpen(true)}
            deleteIcon={<ExpandMoreIcon/>}
            label={optionRenderer(orderDateType)}
            size={'small'}
            aria-hidden={true}
            tabIndex={-1}
            sx={{pointerEvents: 'none'}}
        />
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            sx={selectSx}
            getOptionLabel={opt => optionRenderer(opt.label)}
            value={orderDateType}
            onChange={orderDateType => setDateRangeCriterionOrderDateType(orderDateType as OrderDate)}
            options={ORDER_DATE_TYPES}
            getOptionProps={option => createAutoTestAttributes(
                CRITERION_ORDER_DATE_TYPE_OPTION_AUTOTEST_ID,
                option.value,
            )}
            MenuProps={{
                slotProps: {
                    list: createSearchUIOwnedAutoTestAttributes(
                        CRITERION_ORDER_DATE_TYPE_OPTIONS_AUTOTEST_ID,
                        autoTestOwner,
                    ),
                },
            }}
            SelectDisplayProps={{
                ...createAutoTestAttributes(CRITERION_ORDER_DATE_TYPE_AUTOTEST_ID, orderDateType),
                'aria-label': orderDateTypeAriaLabel,
            }}
        />
    </Box>
}
