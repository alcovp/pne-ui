import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import {Chip, SxProps} from '@mui/material';
import React, {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {AbstractEntity, AbstractEntityAllableCollection, PneAutocomplete} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope';

const ALL_OPTION_ID = -1
const ALL_AUTOTEST_VALUE = 'all'
const CRITERION_COLLECTION_AUTOTEST_ID = 'criterion-collection'
const CRITERION_COLLECTION_PANEL_AUTOTEST_ID = 'criterion-collection-panel'
const CRITERION_COLLECTION_OPTIONS_AUTOTEST_ID = 'criterion-collection-options'
const CRITERION_COLLECTION_OPTION_AUTOTEST_ID = 'criterion-collection-option'
const CRITERION_COLLECTION_VALUE_AUTOTEST_ID = 'criterion-collection-value'

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
    const autoTestOwner = useSearchUIAutoTestScope()
    const criterionAriaLabel = autoTestOwner?.criterionType === undefined
        ? t('react.searchUI.values', {defaultValue: 'Filter values'})
        : t(`react.CriterionTypeEnum.${autoTestOwner.criterionType}`)
    const allOptionLabel = t('react.searchUI.all')
    const allOption = useMemo<AbstractEntity>(() => ({
        id: ALL_OPTION_ID,
        displayName: allOptionLabel,
    }), [allOptionLabel])
    const optionsWithAll = useMemo(
        () => [allOption, ...options],
        [allOption, options],
    )

    const onOptionChange = (
        selectedOptions: readonly AbstractEntity[],
        changedOption?: AbstractEntity,
    ) => {
        if (changedOption?.id === ALL_OPTION_ID) {
            if (!value.all) {
                onChange({
                    all: true,
                    entities: [],
                })
            }
            return
        }

        const selectedEntities = selectedOptions.filter(option => option.id !== ALL_OPTION_ID)

        if (selectedEntities.length === 0) {
            onChange({
                all: true,
                entities: [],
            })
            return
        }

        onChange({
            all: false,
            entities: selectedEntities,
        })
    }

    const getAutoTestValue = (option: AbstractEntity) => (
        option.id === ALL_OPTION_ID ? ALL_AUTOTEST_VALUE : option.id
    )

    return <PneAutocomplete
        value={value.all ? [allOption] : (value.entities ?? [])}
        options={optionsWithAll}
        onChange={(_event, selectedOptions, _reason, details) => onOptionChange(
            selectedOptions as AbstractEntity[],
            details?.option,
        )}
        sx={selectSx}
        multiple
        htmlInputProps={{
            ...createAutoTestAttributes(CRITERION_COLLECTION_AUTOTEST_ID),
            'aria-label': criterionAriaLabel,
        }}
        slotProps={{
            paper: createSearchUIOwnedAutoTestAttributes(
                CRITERION_COLLECTION_PANEL_AUTOTEST_ID,
                autoTestOwner,
            ),
            listbox: {
                ...createSearchUIOwnedAutoTestAttributes(
                    CRITERION_COLLECTION_OPTIONS_AUTOTEST_ID,
                    autoTestOwner,
                ),
                'aria-label': criterionAriaLabel,
                'aria-labelledby': undefined,
            },
        }}
        renderOption={(autocompleteProps, option, {selected}) => {
            const {key, ...optionProps} = autocompleteProps
            const AllIcon = selected ? CheckBoxIcon : CheckBoxOutlineBlankIcon

            return <li
                {...optionProps}
                {...createAutoTestAttributes(
                    CRITERION_COLLECTION_OPTION_AUTOTEST_ID,
                    getAutoTestValue(option),
                )}
                key={key}
            >
                {option.id === ALL_OPTION_ID
                    ? <AllIcon
                        aria-hidden={true}
                        fontSize={'small'}
                        sx={{mr: 1, pointerEvents: 'none'}}
                    />
                    : null}
                {option.displayName}
            </li>
        }}
        renderValue={(tagValue, getItemProps) =>
            tagValue.map((option, index) => {
                const {key: _itemKey, onDelete, ...tagProps} = getItemProps({index})
                const autoTestValue = getAutoTestValue(option)

                return <Chip
                    {...tagProps}
                    {...createAutoTestAttributes(
                        CRITERION_COLLECTION_VALUE_AUTOTEST_ID,
                        autoTestValue,
                    )}
                    key={autoTestValue}
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
