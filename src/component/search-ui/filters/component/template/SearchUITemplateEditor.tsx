import React, {useContext, useId, useState} from 'react';
import {Alert, Collapse} from '@mui/material';
import {useTranslation} from 'react-i18next';
import {useSearchUIFiltersStore} from '../../state/store';
import {PneButton, PneModal, PneModalActions, PneTextField} from '../../../../..';
import {SearchUIDefaultsContext} from "../../../SearchUIProvider";
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {useSearchUIAutoTestScope} from '../../AutoTestScope';

const TEMPLATE_EDITOR_AUTOTEST_ID = 'template-editor';
const CLOSE_TEMPLATE_EDITOR_AUTOTEST_ID = 'close-template-editor';

interface IProps {
    open: boolean
    onClose: () => void
}

/**
 * Names a new template made of the current filters. The name starts empty on every
 * open because the owner remounts the editor per session.
 */
const SearchUITemplateEditor = (props: IProps) => {
    const {
        open,
        onClose,
    } = props

    const createTemplate = useSearchUIFiltersStore(s => s.createTemplate)
    const settingsContextName = useSearchUIFiltersStore(s => s.settingsContextName)

    const {t} = useTranslation()
    const autoTestScope = useSearchUIAutoTestScope()?.scope
    const createFormId = useId()
    const templateEditorId = useId()
    const [templateName, setTemplateName] = useState('')
    const [showFeedback, setShowFeedback] = useState(false)
    const {searchTemplateExists} = useContext(SearchUIDefaultsContext)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTemplateName(event.target.value)
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
                    onClose()
                }
            })
            // .catch(raiseUIError)
            .catch(console.error)
    };

    return <PneModal
        actions={<PneModalActions
            secondary={<PneButton
                type={'button'}
                pneStyle='outlined'
                onClick={onClose}
            >{t('cancel')}</PneButton>}
            primary={<PneButton
                type='submit'
                form={createFormId}
            >{t('create')}</PneButton>}
        />}
        open={open}
        onClose={onClose}
        title={t('react.searchUI.template.newModal.title')}
        closeLabel={t('close', {defaultValue: 'Close'})}
        slotProps={{
            container: {
                ...createAutoTestAttributes(TEMPLATE_EDITOR_AUTOTEST_ID, autoTestScope),
                id: templateEditorId,
            },
            closeButton: createAutoTestAttributes(CLOSE_TEMPLATE_EDITOR_AUTOTEST_ID),
        }}
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
}

export default SearchUITemplateEditor
