import React, {useId, useState} from 'react';
import {CriterionTypeEnum} from '../../types';
import {Menu, MenuItem, SxProps} from '@mui/material';
import {useTranslation} from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {PneButton} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {useSearchUIAutoTestScope} from '../../AutoTestScope';

const ADD_FILTER_AUTOTEST_ID = 'add-filter';
const ADD_FILTER_OPTIONS_AUTOTEST_ID = 'add-filter-options';
const ADD_FILTER_OPTION_AUTOTEST_ID = 'add-filter-option';

type Props = {
    onChange: (value: CriterionTypeEnum) => void
    options: CriterionTypeEnum[]
}

/**
 * A button with a menu, built as the saved filters trigger next to it: the hover, the pressed look
 * and the keyboard focus are the same on both. Before, a transparent select lay over a button that
 * was there for show, and the focus landed on the select, which drew its own mark.
 */
const SearchUIAddFilter = (props: Props) => {
    const {t} = useTranslation()
    const {t: optionRenderer} = useTranslation('', {keyPrefix: 'react.CriterionTypeEnum'})
    const autoTestScope = useSearchUIAutoTestScope()?.scope
    const menuId = useId()
    const {
        onChange,
        options,
    } = props
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
    const open = anchorEl !== null
    const label = t('react.searchUI.addCriterion')

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }
    // The arrow keys open the menu, as they open a native select.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            setAnchorEl(event.currentTarget)
        }
    }
    const handleClose = () => {
        setAnchorEl(null)
    }
    const handleSelect = (option: CriterionTypeEnum) => {
        handleClose()
        onChange(option)
    }

    return <>
        <PneButton
            {...createAutoTestAttributes(ADD_FILTER_AUTOTEST_ID)}
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            size={'small'}
            pneStyle='neutral'
            endIcon={<ExpandMoreIcon/>}
            sx={addFilterButtonSx}
            aria-controls={open ? menuId : undefined}
            aria-expanded={open}
            aria-haspopup={'menu'}
        >{label}</PneButton>
        <Menu
            open={open}
            onClose={handleClose}
            anchorEl={anchorEl}
            // Under the button from its left edge, as the saved filters menu opens.
            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
            transformOrigin={{vertical: 'top', horizontal: 'left'}}
            slotProps={{
                list: {
                    ...createAutoTestAttributes(ADD_FILTER_OPTIONS_AUTOTEST_ID, autoTestScope),
                    id: menuId,
                    'aria-label': label,
                },
            }}
        >
            {options.map(option => <MenuItem
                {...createAutoTestAttributes(ADD_FILTER_OPTION_AUTOTEST_ID, option)}
                key={option}
                onClick={() => handleSelect(option)}
            >
                {optionRenderer(option)}
            </MenuItem>)}
        </Menu>
    </>
}

export default SearchUIAddFilter

const addFilterButtonSx: SxProps = {
    whiteSpace: 'nowrap',
    px: '12px',
    '& .MuiButton-endIcon': {
        ml: '8px',
    },
}
