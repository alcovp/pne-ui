import * as React from 'react'
import {fireEvent, render, waitFor} from '@testing-library/react'
import i18next from 'i18next'
import {I18nextProvider, initReactI18next} from 'react-i18next'

import {SearchUIFilters, SearchUIProvider, type SearchUITemplate} from '../src'
import {getSearchUIInitialSearchCriteria} from '../src/component/search-ui/filters/state/initial'
import {initialSearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'

// The Paynet host keeps i18next's default HTML escaping of interpolated values.
const hostLikeI18n = i18next.createInstance()
void hostLikeI18n.use(initReactI18next).init({
    lng: 'en',
    resources: {en: {translation: {}}},
    interpolation: {escapeValue: true},
})

it('shows template names in interpolated menu labels as typed', async () => {
    const template: SearchUITemplate = {
        name: 'EU/UK <cards> & "fees"',
        searchConditions: getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
    }
    render(<I18nextProvider i18n={hostLikeI18n}>
        <SearchUIProvider defaults={{getSearchTemplates: jest.fn().mockResolvedValue([template])}}>
            <SearchUIFilters
                autoTestId='escaping'
                settingsContextName='templates-menu-escaping'
                possibleCriteria={[]}
                onFiltersUpdate={jest.fn()}
                config={{hideShowFiltersButton: true}}
            />
        </SearchUIProvider>
    </I18nextProvider>)
    const trigger = document.body.querySelector<HTMLButtonElement>('[data-autotest="templates"]')!

    fireEvent.click(trigger)
    const select = await waitFor(() => {
        const result = document.body.querySelector<HTMLElement>('[data-autotest="select-template"]')
        expect(result).not.toBeNull()
        return result as HTMLElement
    })
    fireEvent.click(select)
    await waitFor(() => expect(trigger.textContent).toContain(template.name))

    fireEvent.click(trigger)
    const update = await waitFor(() => {
        const result = document.body.querySelector<HTMLElement>('[data-autotest="update-template"]')
        expect(result).not.toBeNull()
        return result as HTMLElement
    })
    expect(update.textContent).toBe('Update “EU/UK <cards> & "fees"”')
})
