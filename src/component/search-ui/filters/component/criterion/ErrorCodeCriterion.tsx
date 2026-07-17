import React, { useContext } from 'react'
import { Box, Typography } from '@mui/material'
import { useSearchUIFiltersStore } from '../../state/store'
import { SearchUIDefaultsContext } from '../../../SearchUIProvider'
import { AutoCompleteChoice, PneAsyncAutocomplete } from '../../../../..'
import { useTranslation } from 'react-i18next'
import { createAutoTestAttributes } from '../../../../AutoTestAttribute'
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope'

const CRITERION_ERROR_CODE_AUTOTEST_ID = 'criterion-error-code'
const CRITERION_ERROR_CODE_CLEAR_AUTOTEST_ID = 'criterion-error-code-clear'
const CRITERION_ERROR_CODE_PANEL_AUTOTEST_ID = 'criterion-error-code-panel'
const CRITERION_ERROR_CODE_OPTIONS_AUTOTEST_ID = 'criterion-error-code-options'
const CRITERION_ERROR_CODE_OPTION_AUTOTEST_ID = 'criterion-error-code-option'

export const ErrorCodeCriterion = () => {
    const { t } = useTranslation()
    const autoTestOwner = useSearchUIAutoTestScope()
    const errorCode = useSearchUIFiltersStore(s => s.errorCode)
    const setErrorCode = useSearchUIFiltersStore(s => s.setErrorCodeCriterion)

    const { searchErrorCodes } = useContext(SearchUIDefaultsContext)
    const inputAriaLabel = t('react.CriterionTypeEnum.ERROR_CODE', {
        defaultValue: 'Error code',
    })

    return <PneAsyncAutocomplete<AutoCompleteChoice>
        value={errorCode}
        onChange={(e, value) => setErrorCode(value)}
        searchChoices={searchErrorCodes}
        htmlInputProps={{
            ...createAutoTestAttributes(CRITERION_ERROR_CODE_AUTOTEST_ID, errorCode?.choiceId),
            'aria-label': inputAriaLabel,
        }}
        slotProps={{
            clearIndicator: {
                type: 'button',
                ...createAutoTestAttributes(CRITERION_ERROR_CODE_CLEAR_AUTOTEST_ID),
            },
            paper: createSearchUIOwnedAutoTestAttributes(
                CRITERION_ERROR_CODE_PANEL_AUTOTEST_ID,
                autoTestOwner,
            ),
            listbox: {
                ...createSearchUIOwnedAutoTestAttributes(
                    CRITERION_ERROR_CODE_OPTIONS_AUTOTEST_ID,
                    autoTestOwner,
                ),
                'aria-label': inputAriaLabel,
                'aria-labelledby': undefined,
            },
        }}
        renderOption={(props, option) => React.createElement(
            'li',
            {
                ...props,
                ...createAutoTestAttributes(
                    CRITERION_ERROR_CODE_OPTION_AUTOTEST_ID,
                    option.choiceId,
                ),
            },
            <>
                <Box sx={optionContentSx}>
                    <Typography component="span" variant="body2">
                        {option.displayName}
                    </Typography>
                    {option.description && (
                        <Typography component="span" variant="caption" color="text.secondary">
                            {option.description}
                        </Typography>
                    )}
                </Box>
            </>,
        )}
        placeholder={t('search')}
        sx={{
            width: '300px',
            '& .MuiSvgIcon-root.MuiSelect-icon': {
                display: 'none',
            },
            '& .MuiSelect-select': {
                height: '100%',
                paddingY: 0,
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent !important',
            },
            '& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input': {
                height: '100%',
                fontSize: '0',
            },
        }}
    />
}

export default ErrorCodeCriterion

const optionContentSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    py: '4px',
}
