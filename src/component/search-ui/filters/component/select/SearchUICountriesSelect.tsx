import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Chip, SxProps} from '@mui/material'
import {Country, PneAutocomplete, PneCheckbox} from '../../../../..'
import {CountryAllableCollection} from '../../types'

const ALL_OPTION_ID = -1

type Props = {
    value: CountryAllableCollection
    onChange: (value: CountryAllableCollection) => void
    options: readonly Country[]
}

const SearchUICountriesSelect = (props: Props) => {
    const {t} = useTranslation()
    const {
        value,
        onChange,
        options,
    } = props

    const allOption = useMemo<Country>(() => ({
        id: ALL_OPTION_ID,
        displayName: t('react.searchUI.all'),
        theCode: '',
        theCode3: '',
    }), [t])

    const optionsWithAll = useMemo<Country[]>(() => [allOption, ...options], [allOption, options])

    const selectedEntities = value.entities ?? []
    const isSelectAllChecked = value.all || selectedEntities.length === 0 || selectedEntities.length === options.length

    const onOptionChange = (optionValue: readonly Country[]) => {
        if (optionValue.length === 0
            || (optionValue.length === 1 && optionValue[0].id === ALL_OPTION_ID)) {
            onChange({
                all: true,
                entities: [],
            })
        } else {
            onChange({
                all: false,
                entities: optionValue.filter(v => v.id !== ALL_OPTION_ID),
            })
        }
    }

    const onSelectAllOptionClick = (selected: boolean) => {
        if (!selected) {
            onChange({
                all: true,
                entities: [],
            })
        }
    }

    return <PneAutocomplete
        value={isSelectAllChecked ? [allOption] : selectedEntities}
        options={optionsWithAll}
        onChange={(e, optionValue) => onOptionChange(optionValue as Country[])}
        sx={selectSx}
        multiple
        renderOption={(autocompleteProps, option, {selected}) => {
            if (option.id === ALL_OPTION_ID) {
                return <li {...autocompleteProps} onClick={() => onSelectAllOptionClick(selected)}>
                    <PneCheckbox checked={selected} disabled={selected}/>
                    {option.displayName}
                </li>
            } else {
                return <li {...autocompleteProps}>
                    {option.displayName}
                </li>
            }
        }}
        renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
                const {key, onDelete, ...tagProps} = getTagProps({index})
                return <Chip
                    {...tagProps}
                    key={key}
                    label={option.displayName}
                    size={'small'}
                    onDelete={option.id === ALL_OPTION_ID ? undefined : onDelete}
                />
            })
        }
        disableClearable
        disableCloseOnSelect
        size={'small'}
    />
}

export default SearchUICountriesSelect

const selectSx: SxProps = {
    width: '100%',
    '& .MuiButtonBase-root.MuiIconButton-root.MuiAutocomplete-popupIndicator': {
        display: 'none',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent !important',
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        pl: '0 !important',
    },
    '& .MuiButtonBase-root.MuiChip-root': {
        m: '0 4px 0 0 !important',
    },
}
