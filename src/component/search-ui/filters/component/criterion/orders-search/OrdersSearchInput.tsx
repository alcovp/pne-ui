import React, {ChangeEvent, useEffect, useState} from 'react';
import {useSearchUIFiltersStore} from "../../../state/store";
import {exhaustiveCheck, PneTextField} from "../../../../../../index";
import {SxProps} from "@mui/material";
import {useTranslation} from "react-i18next";
import {OrdersSearchLabelsConfig} from "../../../state/actions";
import {AmountMaskInput} from "./AmountMaskInput";
import {Card6And4MaskInput} from "./Card6And4MaskInput";
import {IPv4MaskInput} from "./IPv4MaskInput";
import {OrdersSearchCountrySelect} from "./OrdersSearchCountrySelect";

export const OrdersSearchInput = () => {

    const {t} = useTranslation()

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)
    const ordersSearchValue = useSearchUIFiltersStore(s => s.ordersSearchValue)
    const setOrderSearchCriterionValue = useSearchUIFiltersStore(s => s.setOrderSearchCriterionValue)

    const [searchValue, setSearchValue] = useState(ordersSearchValue)

    useEffect(() => {
        setSearchValue(ordersSearchValue)
    }, [ordersSearchValue])

    useEffect(() => {
        setOrderSearchCriterionValue(searchValue)
    }, [searchValue])

    const inputType = OrdersSearchLabelsConfig[ordersSearchLabel]

    const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
        let newValue = event.target.value

        if (inputType.type === 'integer') {
            newValue = newValue.replace(/\D/g, '')
        }

        if (newValue.length > inputType.maxLength) {
            newValue = newValue.slice(0, inputType.maxLength)
        }

        setSearchValue(newValue)
    }

    const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value
        setSearchValue(newValue)
    }

    const renderInput = () => {
        switch (inputType.type) {
            case 'integer':
            case 'string':
                return <PneTextField
                    value={searchValue}
                    onChange={handleTextChange}
                    placeholder={t('search')}
                    sx={valueInputSx}
                    size={'small'}
                    variant={'filled'}
                    InputProps={{
                        disableUnderline: true,
                    }}
                />
            case 'amount':
                return <PneTextField
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    placeholder={t('search')}
                    size={'small'}
                    variant={'filled'}
                    sx={valueInputSx}
                    InputProps={{
                        disableUnderline: true,
                        inputComponent: AmountMaskInput as any,
                    }}
                />
            case 'ip':
                return <PneTextField
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    placeholder={t('search')}
                    size={'small'}
                    variant={'filled'}
                    sx={valueInputSx}
                    InputProps={{
                        disableUnderline: true,
                        inputComponent: IPv4MaskInput as any,
                    }}
                />
            case 'card6and4':
                return <PneTextField
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    placeholder={t('search')}
                    size={'small'}
                    variant={'filled'}
                    sx={valueInputSx}
                    InputProps={{
                        disableUnderline: true,
                        inputComponent: Card6And4MaskInput as any,
                    }}
                />
            case 'country':
                return <OrdersSearchCountrySelect/>
            default:
                exhaustiveCheck(inputType.type)
        }
        throw new Error('Can\'t be')
    }

    return renderInput()
}

const valueInputSx: SxProps = {
    '& .MuiInputBase-root.MuiFilledInput-root': {
        height: '24px',
        borderRadius: '16px',
    },
    '& .MuiInputBase-input.MuiFilledInput-input': {
        py: '3px',
        fontSize: '13px',
        lineHeight: '18px',
    },
}