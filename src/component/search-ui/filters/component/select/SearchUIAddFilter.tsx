import React, {useState} from 'react';
import {CriterionTypeEnum} from '../../types';
import {Box, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {PneButton, PneSelect} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {useSearchUIAutoTestScope} from '../../AutoTestScope';

const ADD_FILTER_AUTOTEST_ID = 'add-filter';
const ADD_FILTER_OPTIONS_AUTOTEST_ID = 'add-filter-options';

type Props = {
    onChange: (value: CriterionTypeEnum) => void
    options: CriterionTypeEnum[]
}

const SearchUIAddFilter = (props: Props) => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.CriterionTypeEnum'})
    const autoTestScope = useSearchUIAutoTestScope()?.scope
    const {
        onChange,
        options,
    } = props
    const [open, setOpen] = useState(false)

    return <Box sx={relativeContainerSx}>
        <PneButton
            size={'small'}
            pneStyle='neutral'
            endIcon={<ExpandMoreIcon/>}
            sx={addFilterButtonSx}
            aria-hidden={true}
            tabIndex={-1}
        >{t('react.searchUI.addCriterion')}</PneButton>
        <PneSelect
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            options={options}
            onChange={(value) => onChange(value as CriterionTypeEnum)}
            sx={selectSx}
            value={''}
            getOptionLabel={opt => optionRenderer(opt.label)}
            MenuProps={{
                slotProps: {
                    list: createAutoTestAttributes(ADD_FILTER_OPTIONS_AUTOTEST_ID, autoTestScope),
                },
            }}
            SelectDisplayProps={{
                ...createAutoTestAttributes(ADD_FILTER_AUTOTEST_ID),
                'aria-label': t('react.searchUI.addCriterion'),
            }}
        />
    </Box>
}

export default SearchUIAddFilter

const relativeContainerSx: SxProps = {
    position: 'relative',
}

const addFilterButtonSx: SxProps = {
    whiteSpace: 'nowrap',
    px: '12px',
    pointerEvents: 'none',
    '& .MuiButton-endIcon': {
        ml: '8px',
    },
}

const selectSx: SxProps = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
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
    },
}
