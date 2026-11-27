import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Box, FormHelperText, SxProps} from '@mui/material';
import {SearchUIOrdersSearchLabelSelect} from "../../select/SearchUIOrdersSearchLabelSelect";
import {OrdersSearchInput} from "./OrdersSearchInput";
import {useSearchUIFiltersStore} from '../../../state/store';
import {CriterionTypeEnum} from '../../../types';
import {getRequestSourceHostname} from '../../../requestSource';
import {createAutoTestAttributes} from '../../../../../AutoTestAttribute';

const REQUEST_SOURCE_HOSTNAME_AUTOTEST_ID = 'criterion-request-source-hostname'
const REQUEST_SOURCE_DELAY_AUTOTEST_ID = 'criterion-request-source-delay'
const REQUEST_SOURCE_ERROR_AUTOTEST_ID = 'criterion-request-source-error'

export const OrdersSearchCriterion = () => {
    const {t} = useTranslation()

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)
    const ordersSearchValue = useSearchUIFiltersStore(s => s.ordersSearchValue)
    const validationError = useSearchUIFiltersStore(s => s.validationResult.errors.find(
        error => error.criterion === CriterionTypeEnum.ORDERS_SEARCH,
    ))
    const [inputFocused, setInputFocused] = useState(false)

    const requestSource = ordersSearchLabel === 'request_source'
    // Like an unfinished date, a wrong address is shown once the focus leaves the field, not while typing.
    const shownError = requestSource && !inputFocused ? validationError : undefined
    const hostname = requestSource ? getRequestSourceHostname(ordersSearchValue) : null

    const row = <Box sx={centerSx}>
        <OrdersSearchInput
            error={!!shownError}
            onBlur={() => setInputFocused(false)}
            onFocus={() => setInputFocused(true)}
        />
        <Box component={'span'} sx={{display: 'inline-block', color: theme => theme.palette.pne?.text.muted ?? '#808080'}}>{t('in')}</Box>
        <SearchUIOrdersSearchLabelSelect/>
    </Box>

    if (!requestSource) {
        return row
    }

    // The hostname that is searched for and the data delay of this search, under the field.
    return <Box sx={requestSourceSx}>
        {row}
        {shownError
            ? <FormHelperText
                {...createAutoTestAttributes(REQUEST_SOURCE_ERROR_AUTOTEST_ID)}
                error
                role={'alert'}
                sx={noteSx}
            >
                {t(shownError.messageKey, {defaultValue: 'Enter a site address such as example.com'})}
            </FormHelperText>
            : null}
        {!shownError && hostname
            ? <FormHelperText
                {...createAutoTestAttributes(REQUEST_SOURCE_HOSTNAME_AUTOTEST_ID, hostname)}
                sx={noteSx}
            >
                {t('react.searchUI.ordersSearch.requestSource.hostname', {
                    hostname,
                    defaultValue: 'Search by hostname: {{hostname}}',
                })}
            </FormHelperText>
            : null}
        <FormHelperText {...createAutoTestAttributes(REQUEST_SOURCE_DELAY_AUTOTEST_ID)} sx={noteSx}>
            {t('react.searchUI.ordersSearch.requestSource.delay', {
                defaultValue: 'Data is updated with a delay of up to 7 minutes',
            })}
        </FormHelperText>
    </Box>
}

const centerSx: SxProps = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: '8px',
}

// The field keeps the place it has in a one-line row; the notes add lines under it.
const requestSourceSx: SxProps = {
    py: '8px',
}

const noteSx: SxProps = {
    mt: '4px',
}
