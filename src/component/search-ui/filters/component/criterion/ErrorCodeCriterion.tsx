import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import React, { useContext } from 'react'
import { Box, SxProps, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'
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
        loadOptions={query => searchErrorCodes({searchString: query})}
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
            // The list keeps room for the descriptions and opens from the field's left edge, as the
            // other menus of the panel do; the field itself is narrow.
            popper: {sx: {minWidth: '320px'}, placement: 'bottom-start'},
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
        // The panel's one chevron: 16px in the field's text colour, as on the buttons and the chips.
        popupIcon={<ExpandMoreIcon sx={{fontSize: '16px'}}/>}
        variant={'filled'}
        sx={fieldSx}
    />
}

// The field looks like the other dropdowns of the panel: the 24px pill of the Exact search input, the
// chevron and the clear cross inside it on the right. MUI's filled autocomplete sizes are overridden
// with a doubled root selector, as its own padding rules carry the popup and clear icon classes.
const fieldSx: SxProps<Theme> = {
    width: '220px',
    '&& .MuiInputBase-root.MuiFilledInput-root.MuiAutocomplete-inputRoot': {
        height: '24px',
        borderRadius: '16px',
        padding: '0 48px 0 12px',
    },
    '& .MuiFilledInput-root::before, & .MuiFilledInput-root::after': {
        display: 'none',
    },
    '&&& .MuiAutocomplete-input.MuiFilledInput-input': {
        padding: '3px 0',
        height: '18px',
        fontSize: '13px',
        lineHeight: '18px',
    },
    '& .MuiAutocomplete-endAdornment': {
        right: '6px',
        top: '50%',
        transform: 'translateY(-50%)',
    },
    '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
        padding: '2px',
        margin: 0,
        color: 'inherit',
    },
    '& .MuiAutocomplete-clearIndicator .MuiSvgIcon-root': {
        fontSize: '16px',
    },
}

export default ErrorCodeCriterion

const optionContentSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    py: '4px',
}
