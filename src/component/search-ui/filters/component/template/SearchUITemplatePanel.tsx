import React, {useContext, useState} from 'react';
import {Alert, Box, Collapse, Link} from '@mui/material';
import {SxProps} from '@mui/material/styles';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {PneButton, PneModal, PneTextField, useModal} from '../../../../..';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";

interface IProps {
    onSave: () => void
}

const SearchUITemplatePanel = (props: IProps) => {
    const {
        template,
        createTemplate,
        updateTemplate,
        settingsContextName,
    } = useSearchUIFiltersStore((store) => ({
        template: store.template,
        createTemplate: store.createTemplate,
        updateTemplate: store.updateTemplate,
        settingsContextName: store.settingsContextName,
    }))
    const {t} = useTranslation()
    const {open, handleOpen, handleClose} = useModal()
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
            open={open}
            onClose={handleClose}
            title={t('react.searchUI.template.newModal.title')}
        >
            <form onSubmit={handleCreate}>
                <PneTextField
                    value={templateName}
                    label={t('react.searchUI.template.name')}
                    onChange={handleChange}
                    inputProps={{required: true}}
                    sx={{width: '100%'}}
                    autoFocus
                />
                <Collapse in={showFeedback}>
                    <Alert sx={{mt: '16px'}} severity="error">
                        {t('react.searchUI.template.name.confirmRewrite')}
                    </Alert>
                </Collapse>
                <Box sx={buttonsBoxSx}>
                    <PneButton color={'pneNeutral'} onClick={handleClose}>{t('cancel')}</PneButton>
                    <PneButton type={'submit'}>{t('create')}</PneButton>
                </Box>
            </form>
        </PneModal>
    </>
}

export default SearchUITemplatePanel

const linksContainerSx: SxProps = {
    display: 'flex',
    flexDirection: 'column',
}

const linkSx: SxProps = {
    textAlign: 'left',
    fontSize: '14px',
    lineHeight: '20px',
}

const buttonsBoxSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '16px',
}
