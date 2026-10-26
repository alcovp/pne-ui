import * as React from 'react'
import {cleanup, fireEvent, render, waitFor} from '@testing-library/react'

import {
    CriterionTypeEnum,
    SearchUIFilters,
    SearchUIProvider,
    type SearchUIDefaults,
    type SearchUITemplate,
} from '../src'
import {getSearchUIInitialSearchCriteria} from '../src/component/search-ui/filters/state/initial'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'
import {getLastSearchUITemplateStorageKey} from '../src/component/search-ui/filters/templateStorage'
import {initialSearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

const TEMPLATE_NAME = 'Declines by issuer'

// The template adds a criterion, so applying it offers "Clear all" to forget it with.
const template: SearchUITemplate = {
    name: TEMPLATE_NAME,
    searchConditions: {
        ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        criteria: [CriterionTypeEnum.STATUS],
        status: 'ENABLED',
    },
}

const renderFilters = (settingsContextName: string, defaults: Partial<SearchUIDefaults>) => render(
    <SearchUIProvider defaults={{getSearchTemplates: jest.fn().mockResolvedValue([template]), ...defaults}}>
        <SearchUIFilters
            autoTestId='last-template'
            settingsContextName={settingsContextName}
            possibleCriteria={[CriterionTypeEnum.STATUS]}
            onFiltersUpdate={jest.fn()}
            config={{hideShowFiltersButton: true}}
        />
    </SearchUIProvider>,
)

const query = <T extends HTMLElement>(selector: string): T | null => document.body.querySelector<T>(selector)

const templatesTrigger = (): Promise<HTMLButtonElement> => waitFor(() => {
    const trigger = query<HTMLButtonElement>('[data-autotest="templates"]')
    expect(trigger).not.toBeNull()
    return trigger as HTMLButtonElement
})

const expectTemplateApplied = async (): Promise<void> => {
    const trigger = await templatesTrigger()
    await waitFor(() => expect(trigger.textContent).toContain(TEMPLATE_NAME))
}

const expectNoTemplateApplied = async (): Promise<void> => {
    const trigger = await templatesTrigger()
    // The menu loads in the background; give a wrongly applied template a chance to show up.
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(trigger.textContent).not.toContain(TEMPLATE_NAME)
}

const clickMenuItem = async (selector: string): Promise<void> => {
    fireEvent.click(await templatesTrigger())
    const item = await waitFor(() => {
        const result = query<HTMLElement>(selector)
        expect(result).not.toBeNull()
        return result as HTMLElement
    })
    fireEvent.click(item)
}

const selectTemplate = async (): Promise<void> => {
    await clickMenuItem('[data-autotest="select-template"]')
    await expectTemplateApplied()
}

/** A host store that answers like the server: one name per context, `null` when nothing is kept. */
const createHostStore = (initial: string | null) => {
    const getLastSearchTemplateName = jest.fn<Promise<string | null>, [string]>().mockResolvedValue(initial)
    const saveLastSearchTemplateName = jest.fn<Promise<void>, [{contextName: string, templateName: string | null}]>()
        .mockResolvedValue(undefined)
    return {getLastSearchTemplateName, saveLastSearchTemplateName}
}

const createUnavailableHostStore = () => ({
    getLastSearchTemplateName: jest.fn().mockRejectedValue(new Error('Server predates the feature')),
    saveLastSearchTemplateName: jest.fn().mockRejectedValue(new Error('Server predates the feature')),
})

describe('SearchUI last chosen template', () => {
    let warn: jest.SpyInstance

    beforeEach(() => {
        localStorage.clear()
        resetSearchUIRetentionForTests()
        warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
        cleanup()
        resetSearchUIRetentionForTests()
        localStorage.clear()
        warn.mockRestore()
    })

    describe('without a host store', () => {
        it('keeps the chosen name in the browser and applies it on the next mount', async () => {
            const context = 'browser-kept'
            const key = getLastSearchUITemplateStorageKey(context)

            renderFilters(context, {})
            await selectTemplate()
            expect(localStorage.getItem(key)).toBe(TEMPLATE_NAME)

            cleanup()
            resetSearchUIRetentionForTests()
            renderFilters(context, {})
            await expectTemplateApplied()
            expect(localStorage.getItem(key)).toBe(TEMPLATE_NAME)
        })

        it('forgets a browser-kept name of a template that no longer exists', async () => {
            const context = 'browser-kept-stale'
            const key = getLastSearchUITemplateStorageKey(context)
            localStorage.setItem(key, 'Gone')

            renderFilters(context, {})
            await expectNoTemplateApplied()
            await waitFor(() => expect(localStorage.getItem(key)).toBeNull())
        })
    })

    describe('with a host store', () => {
        it('applies the host-kept name and retires the browser key', async () => {
            const context = 'host-kept'
            const key = getLastSearchUITemplateStorageKey(context)
            localStorage.setItem(key, 'Other')
            const host = createHostStore(TEMPLATE_NAME)

            renderFilters(context, host)
            await expectTemplateApplied()
            expect(host.getLastSearchTemplateName).toHaveBeenCalledWith(context)
            expect(localStorage.getItem(key)).toBeNull()
            expect(host.saveLastSearchTemplateName).not.toHaveBeenCalled()
        })

        it('moves a browser-kept name to the host once it names an existing template', async () => {
            const context = 'migrated'
            const key = getLastSearchUITemplateStorageKey(context)
            localStorage.setItem(key, TEMPLATE_NAME)
            const host = createHostStore(null)

            renderFilters(context, host)
            await expectTemplateApplied()
            await waitFor(() => expect(host.saveLastSearchTemplateName)
                .toHaveBeenCalledWith({contextName: context, templateName: TEMPLATE_NAME}))
            expect(host.saveLastSearchTemplateName).toHaveBeenCalledTimes(1)
            await waitFor(() => expect(localStorage.getItem(key)).toBeNull())
        })

        it('drops a browser-kept name of a missing template without troubling the host', async () => {
            const context = 'legacy-stale'
            const key = getLastSearchUITemplateStorageKey(context)
            localStorage.setItem(key, 'Gone')
            const host = createHostStore(null)

            renderFilters(context, host)
            await expectNoTemplateApplied()
            await waitFor(() => expect(localStorage.getItem(key)).toBeNull())
            expect(host.saveLastSearchTemplateName).not.toHaveBeenCalled()
        })

        it('forgets a host-kept name of a missing template', async () => {
            const context = 'host-stale'
            const host = createHostStore('Gone')

            renderFilters(context, host)
            await expectNoTemplateApplied()
            await waitFor(() => expect(host.saveLastSearchTemplateName)
                .toHaveBeenCalledWith({contextName: context, templateName: null}))
        })

        it('remembers a chosen template on the host and leaves no browser key', async () => {
            const context = 'host-remember'
            const host = createHostStore(null)

            renderFilters(context, host)
            await selectTemplate()
            await waitFor(() => expect(host.saveLastSearchTemplateName)
                .toHaveBeenCalledWith({contextName: context, templateName: TEMPLATE_NAME}))
            expect(localStorage.getItem(getLastSearchUITemplateStorageKey(context))).toBeNull()
        })

        it('forgets the name on the host when Default is chosen', async () => {
            const context = 'host-clear'
            const host = createHostStore(null)

            renderFilters(context, host)
            await selectTemplate()
            await clickMenuItem('[data-autotest="select-default-template"]')
            await waitFor(() => expect(host.saveLastSearchTemplateName)
                .toHaveBeenLastCalledWith({contextName: context, templateName: null}))
        })

        it('forgets the name on the host when the remembered template is deleted', async () => {
            const context = 'host-delete'
            const host = createHostStore(null)

            renderFilters(context, {...host, deleteSearchTemplate: jest.fn().mockResolvedValue(undefined)})
            await selectTemplate()
            host.getLastSearchTemplateName.mockResolvedValue(TEMPLATE_NAME)
            await clickMenuItem('[data-autotest="remove-template"]')
            await waitFor(() => expect(host.saveLastSearchTemplateName)
                .toHaveBeenLastCalledWith({contextName: context, templateName: null}))
        })

        it('falls back to the browser while the host cannot store the name', async () => {
            const context = 'host-unavailable'
            const key = getLastSearchUITemplateStorageKey(context)
            const host = createUnavailableHostStore()

            renderFilters(context, host)
            await selectTemplate()
            await waitFor(() => expect(localStorage.getItem(key)).toBe(TEMPLATE_NAME))

            cleanup()
            resetSearchUIRetentionForTests()
            renderFilters(context, host)
            await expectTemplateApplied()
            expect(localStorage.getItem(key)).toBe(TEMPLATE_NAME)
        })
    })
})
