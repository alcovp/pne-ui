import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Chip, SxProps} from '@mui/material';
import {AbstractEntity, AbstractEntityAllableCollection, PneAutocomplete, PneCheckbox} from '../../../../..';

const ALL_OPTION_ID = -1

type Props = {
    value: AbstractEntityAllableCollection
    onChange: (value: AbstractEntityAllableCollection) => void
    options: readonly AbstractEntity[]
}

const SearchUIAbstractEntitySelect = (props: Props) => {
    const {t} = useTranslation()
    const {
        value,
        onChange,
        options,
    } = props
    const allOption: AbstractEntity = {
        id: ALL_OPTION_ID,
        displayName: t('react.searchUI.all'),
    }
    const [isSelectAllChecked, setIsSelectAllChecked] = useState(value.all)
    const [optionsWithAll, setOptionsWithAll] = useState<AbstractEntity[]>([])

    useEffect(() => {
        setIsSelectAllChecked(value.all)
    }, [value.all])

    useEffect(() => {
        setOptionsWithAll([allOption, ...(options ?? [])])
    }, [options])

    useEffect(() => {
        const entities = value.entities ?? []
        const optLength = options?.length ?? 0
        setIsSelectAllChecked(
            entities.length === 0 || entities.length === optLength
        )
    }, [options, value.entities])

    const onOptionChange = (value: readonly AbstractEntity[]) => {
        if (value.length === 0
            || (value.length === 1 && value[0].id === ALL_OPTION_ID)) {
            setIsSelectAllChecked(true)
            onChange({
                all: true,
                entities: [],
            })
        } else {
            setIsSelectAllChecked(false)
            onChange({
                all: false,
                entities: value.filter(v => v.id !== ALL_OPTION_ID),
            })
        }
    }

    const onSelectAllOptionClick = (selected: boolean) => {
        if (!selected) {
            setIsSelectAllChecked(true)
            onChange({
                all: true,
                entities: [],
            })
        }
    }


    return <PneAutocomplete
        value={isSelectAllChecked ? [allOption] : (value.entities ?? [])}
        options={optionsWithAll}
        onChange={(e, value) => onOptionChange(value as AbstractEntity[])}
        sx={selectSx}
        multiple
        renderOption={(props, option, {selected}) => {
            if (option.id === ALL_OPTION_ID) {
                return <li {...props} onClick={() => onSelectAllOptionClick(selected)}>
                    <PneCheckbox checked={selected} disabled={selected}/>
                    {option.displayName}
                </li>
            } else {
                return <li {...props}>
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

export default SearchUIAbstractEntitySelect

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
