import React, {useId, useState} from 'react';
import {Box, Divider, IconButton, Popover} from '@mui/material';
import SearchUITemplatePanel from './SearchUITemplatePanel';
import {SxProps} from '@mui/material/styles';
// import {invokeCommonDeletionAlert} from '../../../../ConfirmAlertInvoker'; //TODO migration
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {SearchUITemplate} from "../../types";
import {PneButton} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {useSearchUIAutoTestScope} from '../../AutoTestScope';

const TEMPLATES_AUTOTEST_ID = 'templates';
const TEMPLATES_PANEL_AUTOTEST_ID = 'templates-panel';
const TEMPLATE_ITEM_AUTOTEST_ID = 'template-item';
const SELECT_TEMPLATE_AUTOTEST_ID = 'select-template';
const REMOVE_TEMPLATE_AUTOTEST_ID = 'remove-template';

const SearchUITemplatesMenu = () => {
    const {t} = useTranslation();
    const autoTestScope = useSearchUIAutoTestScope()?.scope
    const templatesPanelId = useId()

    const removeTemplate = useSearchUIFiltersStore(s => s.removeTemplate)
    const setTemplate = useSearchUIFiltersStore(s => s.setTemplate)
    const templates = useSearchUIFiltersStore(s => s.templates)
    const template = useSearchUIFiltersStore(s => s.template)

    const placeholder = template?.name || t('react.searchUI.template');
    const selectTemplateLabel = t('react.searchUI.template.select', {defaultValue: 'Use template'})
    const removeTemplateLabel = t('react.searchUI.template.remove', {defaultValue: 'Remove template'})
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }
    const handleClose = () => {
        setAnchorEl(null);
    }
    const handleSetTemplate = (template: SearchUITemplate) => {
        setTemplate(template, { forceSearch: true })
        handleClose()
    }
    const handleRemoveTemplate = (template: SearchUITemplate) => {
        // invokeCommonDeletionAlert(() => removeTemplate(template))
        removeTemplate(template)
    }

    const open = Boolean(anchorEl);

    return <>
        <PneButton
            {...createAutoTestAttributes(TEMPLATES_AUTOTEST_ID)}
            onClick={handleOpen}
            size={'small'}
            color={'pneNeutral'}
            endIcon={<ExpandMoreIcon/>}
            sx={templateTriggerSx}
            title={placeholder}
            aria-controls={open ? templatesPanelId : undefined}
            aria-expanded={open}
            aria-haspopup={'dialog'}
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
            slotProps={{paper: {
                ...createAutoTestAttributes(TEMPLATES_PANEL_AUTOTEST_ID, autoTestScope),
                id: templatesPanelId,
                role: 'dialog',
                'aria-label': t('react.searchUI.template'),
                'aria-modal': true,
                sx: menuPaperSx,
            }}}
        >
            <Box sx={menuContainerSx}>
                <SearchUITemplatePanel onSave={handleClose}/>
                {templates.length > 0 ? <Divider sx={{m: '7px 0', borderColor: '#F1F5F1'}}/> : null}
                {templates.map((template) =>
                    <Box
                        {...createAutoTestAttributes(TEMPLATE_ITEM_AUTOTEST_ID)}
                        sx={templateRowSx}
                        component={'p'}
                        key={template.name}
                    >
                        <Box
                            {...createAutoTestAttributes(SELECT_TEMPLATE_AUTOTEST_ID)}
                            sx={templateNameSx}
                            component={'button'}
                            type={'button'}
                            onClick={() => handleSetTemplate(template)}
                            title={template.name}
                            aria-label={`${selectTemplateLabel}: ${template.name}`}
                        >{template.name}</Box>
                        <IconButton
                            {...createAutoTestAttributes(REMOVE_TEMPLATE_AUTOTEST_ID)}
                            onClick={() => handleRemoveTemplate(template)}
                            color={'primary'}
                            type={'button'}
                            aria-label={`${removeTemplateLabel}: ${template.name}`}
                        >
                            <CloseIcon fontSize={'small'}/>
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
    appearance: 'none',
    background: 'transparent',
    border: 0,
    padding: 0,
    display: 'flex',
    flex: '1 1 auto',
    minWidth: 0,
    cursor: 'pointer',
    color: 'inherit',
    font: 'inherit',
    fontSize: '14px',
    lineHeight: '20px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}

const templateTriggerSx: SxProps = {
    maxWidth: {xs: '30vw', sm: '250px'},
    width: {xs: '30vw', sm: 'auto'},
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
