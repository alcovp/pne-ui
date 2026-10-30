import * as React from 'react'
import {act, render, waitFor} from '@testing-library/react'

import {
    CriterionTypeEnum,
    SearchUIFilters,
    SearchUIProvider,
    type SearchUIDefaults,
    type SearchUITemplate,
} from '../src'
import {getSearchUIInitialSearchCriteria} from '../src/component/search-ui/filters/state/initial'
import {resetSearchUIRetentionForTests} from '../src/component/search-ui/filters/state/retention'
import {initialSearchUIDefaults} from '../src/component/search-ui/SearchUIProvider'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string}) => options?.defaultValue ?? key,
    }),
}))

const TEMPLATE_NAME = 'Declines'

const template: SearchUITemplate = {
    name: TEMPLATE_NAME,
    searchConditions: {
        ...getSearchUIInitialSearchCriteria(initialSearchUIDefaults),
        criteria: [CriterionTypeEnum.STATUS],
        status: 'ENABLED',
    },
}

/** A host answer the test hands out when it wants: the panel waits for it meanwhile. */
const deferred = <T, >() => {
    let resolve: (value: T) => void = () => undefined
    const promise = new Promise<T>(done => {
        resolve = done
    })
    return {promise, resolve}
}

const renderFilters = (scope: string, defaults: Partial<SearchUIDefaults>) => {
    const utils = render(<SearchUIProvider defaults={defaults}>
        <SearchUIFilters
            autoTestId={scope}
            settingsContextName={`${scope}-context`}
            possibleCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY, CriterionTypeEnum.THREE_D]}
            predefinedCriteria={[CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY]}
            onFiltersUpdate={jest.fn()}
            config={{manualSearch: true}}
        />
    </SearchUIProvider>)
    const panel = () => utils.container.querySelector<HTMLElement>(
        `[data-autotest="search-filters"][data-autotest-value="${scope}"]`,
    )
    const skeleton = () => utils.container.querySelector<HTMLElement>(
        `[data-autotest="search-filters-skeleton"][data-autotest-value="${scope}"]`,
    )
    // The skeleton's children: a box per criterion row, then the actions row.
    const skeletonRows = () => Array.from(skeleton()?.children ?? []).length - 1

    return {...utils, panel, skeleton, skeletonRows}
}

const hostStores = (options: {
    collapsed?: boolean | null | undefined
    lastTemplate?: string | null | undefined
    templates?: Promise<SearchUITemplate[]>
    collapsedAnswer?: Promise<boolean | null>
}): Partial<SearchUIDefaults> => ({
    getSearchFiltersCollapsed: jest.fn(() => options.collapsedAnswer ?? Promise.resolve(options.collapsed ?? null)),
    saveSearchFiltersCollapsed: jest.fn().mockResolvedValue(undefined),
    peekSearchFiltersCollapsed: jest.fn(() => options.collapsed),
    getLastSearchTemplateName: jest.fn(() => Promise.resolve(options.lastTemplate ?? null)),
    saveLastSearchTemplateName: jest.fn().mockResolvedValue(undefined),
    peekLastSearchTemplateName: jest.fn(() => options.lastTemplate),
    getSearchTemplates: jest.fn(() => options.templates ?? Promise.resolve([template])),
})

describe('SearchUIFilters loading skeleton', () => {
    beforeEach(() => {
        resetSearchUIRetentionForTests()
        localStorage.clear()
    })

    it('shows the panel on its first frame when the host already knows the answers', () => {
        const {panel, skeleton} = renderFilters('skeleton-known', hostStores({collapsed: false, lastTemplate: null}))

        // No await: the first commit already has the real rows.
        expect(skeleton()).toBeNull()
        expect(panel()?.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(2)
    })

    it('folds at once when the host remembers a fold and no filter set', () => {
        const {panel, skeleton} = renderFilters('skeleton-known-folded', hostStores({collapsed: true, lastTemplate: null}))

        expect(skeleton()).toBeNull()
        expect(panel()?.querySelector('[data-autotest="criterion"]')).toBeNull()
        expect(panel()?.querySelector('[data-autotest="toggle-filters"]')?.getAttribute('aria-expanded')).toBe('false')
    })

    it('stands a folded skeleton in for a folded panel while the chosen set loads', async () => {
        const templates = deferred<SearchUITemplate[]>()
        const {panel, skeleton, skeletonRows} = renderFilters('skeleton-folded', hostStores({
            collapsed: true,
            lastTemplate: TEMPLATE_NAME,
            templates: templates.promise,
        }))

        expect(panel()).toBeNull()
        expect(skeleton()?.getAttribute('aria-busy')).toBe('true')
        // Folded: the actions row alone, as the folded panel will be.
        expect(skeletonRows()).toBe(0)
        expect(skeleton()?.querySelectorAll('.MuiSkeleton-root')).toHaveLength(4)

        await act(async () => templates.resolve([template]))

        await waitFor(() => expect(panel()).not.toBeNull())
        expect(skeleton()).toBeNull()
        expect(panel()?.querySelector('[data-autotest="toggle-filters"]')?.getAttribute('aria-expanded')).toBe('false')
    })

    it('draws a row per predefined filter while an open panel waits for the chosen set', async () => {
        const templates = deferred<SearchUITemplate[]>()
        const {panel, skeleton, skeletonRows} = renderFilters('skeleton-open', hostStores({
            collapsed: false,
            lastTemplate: TEMPLATE_NAME,
            templates: templates.promise,
        }))

        expect(panel()).toBeNull()
        expect(skeletonRows()).toBe(2)

        // The set adds a third filter: the one row the skeleton could not know about.
        await act(async () => templates.resolve([{
            ...template,
            searchConditions: {
                ...template.searchConditions,
                criteria: [CriterionTypeEnum.STATUS, CriterionTypeEnum.CURRENCY, CriterionTypeEnum.THREE_D],
            },
        }]))

        await waitFor(() => expect(panel()).not.toBeNull())
        expect(skeleton()).toBeNull()
        expect(panel()?.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(3)
    })

    it('takes the open panel while the host is still loading the fold', async () => {
        const collapsedAnswer = deferred<boolean | null>()
        const {panel, skeleton, skeletonRows} = renderFilters('skeleton-unknown', hostStores({
            collapsed: undefined,
            collapsedAnswer: collapsedAnswer.promise,
            lastTemplate: null,
        }))

        expect(panel()).toBeNull()
        expect(skeletonRows()).toBe(2)

        await act(async () => collapsedAnswer.resolve(null))

        await waitFor(() => expect(panel()).not.toBeNull())
        expect(skeleton()).toBeNull()
        expect(panel()?.querySelectorAll('[data-autotest="criterion"]')).toHaveLength(2)
    })
})
