import React, {ChangeEvent, useEffect, useState} from 'react';
import {useSearchUIFiltersStore} from "../../../state/store";
import {exhaustiveCheck, PneTextField} from "../../../../../../index";
import {SxProps} from "@mui/material";
import {useTranslation} from "react-i18next";
import {OrdersSearchLabelsConfig} from "../../../state/actions";

export const OrdersSearchInput = () => {

    const {t} = useTranslation()

    const {
        ordersSearchLabel,
        ordersSearchValue,
        setOrderSearchCriterionValue,
    } = useSearchUIFiltersStore((store) => ({
        ordersSearchLabel: store.ordersSearchLabel,
        ordersSearchValue: store.ordersSearchValue,
        setOrderSearchCriterionValue: store.setOrderSearchCriterionValue,
    }))
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
            case 'country':
            case 'ip':
            case 'card6and4':
                return 'NOT IMPLEMENTED'
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