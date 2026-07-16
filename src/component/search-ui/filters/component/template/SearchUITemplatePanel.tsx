import React, {useContext, useId, useState} from 'react';
import {Alert, Box, Collapse, Link} from '@mui/material';
import {SxProps} from '@mui/material/styles';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {PneButton, PneModal, PneModalActions, PneTextField, useModal} from '../../../../..';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";

interface IProps {
    onSave: () => void
}

const SearchUITemplatePanel = (props: IProps) => {

    const template = useSearchUIFiltersStore(s => s.template)
    const createTemplate = useSearchUIFiltersStore(s => s.createTemplate)
    const updateTemplate = useSearchUIFiltersStore(s => s.updateTemplate)
    const settingsContextName = useSearchUIFiltersStore(s => s.settingsContextName)

    const {t} = useTranslation()
    const {open, handleOpen, handleClose} = useModal()
    const createFormId = useId()
    const [templateName, setTemplateName] = useState(template?.name || '')
    const [showFeedback, setShowFeedback] = useState(false)
    const {
        onSave
    } = props
    const {searchTemplateExists} = useContext(SearchUIDefaultsContext)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const name = event.target.value
        setTemplateName(name)
        setShowFeedback(false)
    }

    const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        searchTemplateExists({
            contextName: settingsContextName,
            templateName,
        })
            .then(templateExists => {
                if (templateExists) {
                    setShowFeedback(true)
                } else {
                    createTemplate(templateName)
                    handleClose()
                    onSave()
                }
            })
            // .catch(raiseUIError)
            .catch(console.error)
    };

    const handleUpdate = () => {
        updateTemplate(templateName)
        handleClose()
        onSave()
    }

    return <>
        <Box sx={linksContainerSx}>
            <Link
                sx={linkSx}
                component="button"
                underline="hover"
                onClick={handleOpen}
            >{t('react.searchUI.template.create')}
            </Link>
            {template ? <Link
                sx={linkSx}
                component="button"
                underline="hover"
                onClick={handleUpdate}
            >{t('react.searchUI.template.update')}</Link> : null}
        </Box>
        <PneModal
            actions={<PneModalActions
                secondary={<PneButton pneStyle='outlined' onClick={handleClose}>{t('cancel')}</PneButton>}
                primary={<PneButton type='submit' form={createFormId}>{t('create')}</PneButton>}
            />}
            open={open}
            onClose={handleClose}
            title={t('react.searchUI.template.newModal.title')}
        >
            <form id={createFormId} onSubmit={handleCreate}>
                <PneTextField
                    value={templateName}
                    label={t('react.searchUI.template.name')}
                    onChange={handleChange}
                    slotProps={{htmlInput: {required: true}}}
                    sx={{width: '100%'}}
                    autoFocus
                />
                <Collapse in={showFeedback}>
                    <Alert sx={{mt: '16px'}} severity="error">
                        {t('react.searchUI.template.name.confirmRewrite')}
                    </Alert>
                </Collapse>
            </form>
        </PneModal>
    </>
}

export default SearchUITemplatePanel

const linksContainerSx: SxProps = {
    display: 'flex',
    flexDirection: 'row',
    columnGap: '32px',
}

const linkSx: SxProps = {
    textAlign: 'left',
    fontSize: '14px',
    lineHeight: '20px',
}
