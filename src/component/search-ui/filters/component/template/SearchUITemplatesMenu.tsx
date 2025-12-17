import React, {useState} from 'react';
import {Box, Divider, IconButton, Popover} from '@mui/material';
import SearchUITemplatePanel from './SearchUITemplatePanel';
import {SxProps} from '@mui/material/styles';
// import {invokeCommonDeletionAlert} from '../../../../ConfirmAlertInvoker'; //TODO migration
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {Close, ExpandMore} from '@mui/icons-material';
import {SearchUITemplate} from "../../types";
import {PneButton} from '../../../../..';

const SearchUITemplatesMenu = () => {
    const {t} = useTranslation();

    const removeTemplate = useSearchUIFiltersStore(s => s.removeTemplate)
    const setTemplate = useSearchUIFiltersStore(s => s.setTemplate)
    const templates = useSearchUIFiltersStore(s => s.templates)
    const template = useSearchUIFiltersStore(s => s.template)

    const placeholder = template?.name || t('react.searchUI.template');
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }
    const handleClose = () => {
        setAnchorEl(null);
    }
    const handleSetTemplate = (template: SearchUITemplate) => {
        setTemplate(template)
        handleClose()
    }
    const handleRemoveTemplate = (template: SearchUITemplate) => {
        // invokeCommonDeletionAlert(() => removeTemplate(template))
        removeTemplate(template)
    }

    const open = Boolean(anchorEl);

    return <>
        <PneButton
            onClick={handleOpen}
            size={'small'}
            color={'pneNeutral'}
            endIcon={<ExpandMore/>}
            sx={templateTriggerSx}
            title={placeholder}
        >
            <Box sx={templateTriggerLabelSx} component="span">{placeholder}</Box>
        </PneButton>
        <Popover
            open={open}
            onClose={handleClose}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            slotProps={{paper: {sx: menuPaperSx}}}
        >
            <Box sx={menuContainerSx}>
                <SearchUITemplatePanel onSave={handleClose}/>
                {templates.length > 0 ? <Divider sx={{m: '7px 0', borderColor: '#F1F5F1'}}/> : null}
                {templates.map((template, index) =>
                    <Box sx={templateRowSx} component={'p'} key={index}>
                        <Box
                            sx={templateNameSx}
                            component={'span'}
                            onClick={() => handleSetTemplate(template)}
                            title={template.name}
                        >{template.name}</Box>
                        <IconButton
                            onClick={() => handleRemoveTemplate(template)}
                            color={'primary'}
                        >
                            <Close fontSize={'small'}/>
                        </IconButton>
                    </Box>
                )}
            </Box>
        </Popover>
    </>
}

export default SearchUITemplatesMenu

const menuContainerSx: SxProps = {
    p: '16px',
    width: 'max-content',
    maxWidth: '100%',
    boxSizing: 'border-box',
}

const menuPaperSx: SxProps = {
    width: 'auto',
    maxWidth: '300px',
    boxSizing: 'border-box',
}

const templateRowSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    columnGap: '8px',
    m: 0,
    '&:hover button': {
        display: 'flex',
    }
}

const templateNameSx: SxProps = {
    display: 'flex',
    flex: '1 1 auto',
    minWidth: 0,
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '20px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}

const templateTriggerSx: SxProps = {
    maxWidth: {xs: '30vw', sm: '250px'},
    width: {xs: '30vw', sm: 'auto'},
    mr: {xs: '8px', sm: '20px'},
    justifyContent: 'space-between',
    textAlign: 'left',
    px: '12px',
    '& .MuiButton-endIcon': {
        ml: '8px',
    },
}

const templateTriggerLabelSx: SxProps = {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}
