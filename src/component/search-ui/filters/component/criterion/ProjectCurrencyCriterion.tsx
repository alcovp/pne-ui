import React, {useContext, useEffect, useState} from 'react';
import {useSearchUIStore} from '../../state/store';
import {Box, Chip, FormControlLabel, FormGroup, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import Typography from '@mui/material/Typography';
import {selectUnderChipSx} from '../select/style';
import {ExpandMore} from '@mui/icons-material';
import {AbstractEntity, PneCheckbox, PneSelect, ensure} from '../../../../..';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";

export const ProjectCurrencyCriterion = () => {
    const {t} = useTranslation()
    const [availableCurrencies, setAvailableCurrencies] = useState<AbstractEntity[]>([])
    const searchUIDefaults = useContext(SearchUIDefaultsContext)
    const {
        currency,
        convertToUserCurrency,
        setProjectCurrencyCriterionCurrency,
        setProjectCurrencyCriterionConvertFlag,
        criteria,
        multigetCriteria,
    } = useSearchUIStore((store) => ({
        currency: store.projectCurrency.currency,
        convertToUserCurrency: store.projectCurrency.convertToUserCurrency,
        setProjectCurrencyCriterionCurrency: store.setProjectCurrencyCriterionCurrency,
        setProjectCurrencyCriterionConvertFlag: store.setProjectCurrencyCriterionConvertFlag,
        criteria: store.criteria,
        multigetCriteria: store.multigetCriteria,
    }))
    const [open, setOpen] = useState(false)

    useEffect(() => {
        setProjectCurrencyCriterionCurrency(searchUIDefaults.getDefaultCurrency())
    }, [])

    useEffect(() => {
        searchUIDefaults.getProjectAvailableCurrencies({
            searchConditions: criteria,
            multigetCriteria: multigetCriteria,
        })
            .then(response => {
                setAvailableCurrencies(response.map(choice => ({
                    id: choice.choiceId,
                    displayName: choice.displayName
                })))
            })
            // .catch(raiseUIError)
            .catch(console.error)
    }, [])

    const getConvertToUserCurrencyLabel = () => {
        return t('performanceReport.convertAllTo')
            + ' '
            + t('performanceReport.userCurrency')
            + ` (${searchUIDefaults.getDefaultCurrency().displayName})`
    }

    return <Box sx={containerSx}>
        <Box sx={{position: 'relative'}}>
            <Chip
                onDelete={() => setOpen(true)}
                deleteIcon={<ExpandMore/>}
                label={currency.displayName}
                size={'small'}
            />
            <PneSelect
                open={open}
                onClose={() => setOpen(false)}
                onOpen={() => setOpen(true)}
                sx={selectUnderChipSx}
                value={currency}
                onChange={(value) => setProjectCurrencyCriterionCurrency(value as AbstractEntity)}
                options={availableCurrencies}
            />
        </Box>
        <FormGroup>
            <FormControlLabel
                label={
                    <Typography sx={checkBoxLabelSx}>
                        {getConvertToUserCurrencyLabel()}
                    </Typography>
                }
                control={
                    <PneCheckbox
                        checked={convertToUserCurrency}
                        onChange={e => setProjectCurrencyCriterionConvertFlag(e.target.checked)}
                    />
                }
            />
        </FormGroup>
    </Box>
}

const containerSx: SxProps = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: '8px',
    height: '100%',
}

const checkBoxLabelSx: SxProps = {
    fontSize: '14px',
    lineHeight: '14px',
}
