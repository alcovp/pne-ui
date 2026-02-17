import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { PneConfirmProvider } from '../../src/component/confirm'
import i18nForStorybook from '../i18n'

export const withContext = (Story, context) => {

    return <I18nextProvider i18n={i18nForStorybook}>
        <PneConfirmProvider>
            <Story/>
        </PneConfirmProvider>
    </I18nextProvider>
}
