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
    const {
        removeTemplate,
        setTemplate,
        templates,
        template,
    } = useSearchUIFiltersStore((store) => ({
        removeTemplate: store.removeTemplate,
        setTemplate: store.setTemplate,
        templates: store.templates,
        template: store.template,
    }))
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

    // @ts-ignore
    return <>
        <PneButton
            onClick={handleOpen}
            size={'small'}
            color={'pneNeutral'}
            endIcon={<ExpandMore/>}
            sx={{mr: '20px',}}
        >{placeholder}</PneButton>
        <Popover
            open={open}
            onClose={handleClose}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
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
}

const templateRowSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '&:hover button': {
        display: 'flex',
    }
}

const templateNameSx: SxProps = {
    display: 'flex',
    width: '100%',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '20px',
}
