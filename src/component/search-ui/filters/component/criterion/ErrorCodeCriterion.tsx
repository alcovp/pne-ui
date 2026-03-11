import React, { useContext } from 'react'
import { Box, Typography } from '@mui/material'
import { useSearchUIFiltersStore } from '../../state/store'
import { SearchUIDefaultsContext } from '../../../SearchUIProvider'
import { AutoCompleteChoice, PneAsyncAutocomplete } from '../../../../..'
import { useTranslation } from 'react-i18next'

export const ErrorCodeCriterion = () => {
    const { t } = useTranslation()
    const errorCode = useSearchUIFiltersStore(s => s.errorCode)
    const setErrorCode = useSearchUIFiltersStore(s => s.setErrorCodeCriterion)

    const { searchErrorCodes } = useContext(SearchUIDefaultsContext)

    return <PneAsyncAutocomplete<AutoCompleteChoice>
        value={errorCode}
        onChange={(e, value) => setErrorCode(value)}
        searchChoices={searchErrorCodes}
        renderOption={(props, option) => (
            <li {...props}>
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
            </li>
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
