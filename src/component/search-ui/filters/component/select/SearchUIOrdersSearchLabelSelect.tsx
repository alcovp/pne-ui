import React, {useId, useState} from 'react';
import {Box, Chip} from '@mui/material';
import {useTranslation} from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSearchUIFiltersStore} from "../../state/store";
import {SearchUICollapsableGroupSelect} from './SearchUICollapsableGroupSelect';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';

const CRITERION_LABEL_AUTOTEST_ID = 'criterion-label'

export const SearchUIOrdersSearchLabelSelect = () => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'searchLabel'})

    const ordersSearchLabel = useSearchUIFiltersStore(s => s.ordersSearchLabel)

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
    const optionsDialogId = useId()
    const open = anchorEl !== null
    const fieldLabel = t('react.searchUI.ordersSearch.label', {defaultValue: 'Order search field'})

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            setAnchorEl(event.currentTarget)
        }
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    return <Box>
        <Chip
            {...createAutoTestAttributes(CRITERION_LABEL_AUTOTEST_ID, ordersSearchLabel)}
            component={'button'}
            nativeButton
            type={'button'}
            clickable
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            label={<Box component={'span'} sx={triggerLabelSx}>
                {optionRenderer(ordersSearchLabel)}
                <ExpandMoreIcon aria-hidden={true} fontSize={'small'}/>
            </Box>}
            size={'small'}
            role={'combobox'}
            aria-label={fieldLabel}
            aria-autocomplete={'none'}
            aria-controls={open ? optionsDialogId : undefined}
            aria-expanded={open}
            aria-haspopup={'dialog'}
        />
        <SearchUICollapsableGroupSelect
            anchorEl={anchorEl}
            id={optionsDialogId}
            open={open}
            onClose={handleClose}
        />
    </Box>
}

const triggerLabelSx = {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '4px',
}
