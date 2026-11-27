import React, {ChangeEvent} from 'react'
import {filtersInputSx} from '../style'
import {useSearchUIFiltersStore} from '../../../state/store'
import {exhaustiveCheck} from '../../../../../../common/pne/type'
import PneTextField from '../../../../../PneTextField'
import {SxProps} from '@mui/material'
import type {InputBaseComponentProps} from '@mui/material/InputBase'
import {useTranslation} from 'react-i18next'
import {OrdersSearchLabelsConfig} from '../../../state/actions'
import {AmountMaskInput} from './AmountMaskInput'
import {Card6And4MaskInput} from './Card6And4MaskInput'
import {OrdersSearchCountrySelect} from './OrdersSearchCountrySelect'
import {createAutoTestAttributes} from '../../../../../AutoTestAttribute'

const CRITERION_INPUT_AUTOTEST_ID = 'criterion-input'

type Props = {
    /** The value is shown as wrong, in the error look of the field. */
    error?: boolean
    onBlur?: () => void
    onFocus?: () => void
}

export const OrdersSearchInput = (props: Props) => {
    const {error = false, onBlur, onFocus} = props
    const {t} = useTranslation()

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)
    const ordersSearchValue = useSearchUIFiltersStore(s => s.ordersSearchValue)
    const setOrderSearchCriterionValue = useSearchUIFiltersStore(s => s.setOrderSearchCriterionValue)

    const inputType = OrdersSearchLabelsConfig[ordersSearchLabel]
    const inputAriaLabel = t('react.searchUI.ordersSearch.value', {defaultValue: 'Order search value'})
    const nativeInputProps = {
        ...createAutoTestAttributes(CRITERION_INPUT_AUTOTEST_ID),
        'aria-label': inputAriaLabel,
    }

    const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
        let newValue = event.target.value

        if (inputType.type === 'integer') {
            newValue = newValue.replace(/\D/g, '')
        }

        if (newValue.length > inputType.maxLength) {
            newValue = newValue.slice(0, inputType.maxLength)
        }

        setOrderSearchCriterionValue(newValue)
    }

    const handleMaskedChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value
        setOrderSearchCriterionValue(newValue)
    }

    const renderInput = () => {
        switch (inputType.type) {
            case 'integer':
            case 'string':
                return (
                    <PneTextField
                        value={ordersSearchValue}
                        onChange={handleTextChange}
                        placeholder={t('search')}
                        sx={valueInputSx}
                        size={'small'}
                        variant={'filled'}
                        slotProps={{
                            input: {
                                disableUnderline: true,
                            },
                            htmlInput: nativeInputProps,
                        }}
                    />
                )
            case 'amount':
                return (
                    <PneTextField
                        value={ordersSearchValue}
                        onChange={handleMaskedChange}
                        placeholder={t('search')}
                        size={'small'}
                        variant={'filled'}
                        sx={valueInputSx}
                        slotProps={{
                            input: {
                                disableUnderline: true,
                                inputComponent: AmountMaskInput as React.ElementType<InputBaseComponentProps>,
                            },
                            htmlInput: nativeInputProps,
                        }}
                    />
                )
            case 'ip':
                return (
                    <PneTextField
                        value={ordersSearchValue}
                        onChange={handleTextChange}
                        placeholder={'IPv4 / IPv6'}
                        size={'small'}
                        variant={'filled'}
                        sx={valueInputSx}
                        slotProps={{
                            input: {
                                disableUnderline: true,
                            },
                            htmlInput: nativeInputProps,
                        }}
                    />
                )
            case 'card6and4':
                return (
                    <PneTextField
                        value={ordersSearchValue}
                        onChange={handleMaskedChange}
                        placeholder={t('search')}
                        size={'small'}
                        variant={'filled'}
                        sx={valueInputSx}
                        slotProps={{
                            input: {
                                disableUnderline: true,
                                inputComponent: Card6And4MaskInput as React.ElementType<InputBaseComponentProps>,
                            },
                            htmlInput: nativeInputProps,
                        }}
                    />
                )
            case 'url':
                return (
                    <PneTextField
                        value={ordersSearchValue}
                        onChange={handleTextChange}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        error={error}
                        placeholder={t('search')}
                        sx={valueInputSx}
                        size={'small'}
                        variant={'filled'}
                        slotProps={{
                            input: {
                                disableUnderline: true,
                            },
                            htmlInput: nativeInputProps,
                        }}
                    />
                )
            case 'country':
                return <OrdersSearchCountrySelect />
            default:
                exhaustiveCheck(inputType.type)
        }
        throw new Error("Can't be")
    }

    return renderInput()
}

const valueInputSx: SxProps = filtersInputSx
