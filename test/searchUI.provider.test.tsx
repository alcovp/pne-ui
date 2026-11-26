import * as React from 'react'
import {act, render} from '@testing-library/react'

import {
    initialSearchUIDefaults,
    SearchUIDefaults,
    SearchUIDefaultsContext,
    SearchUIProvider,
} from '../src/component/search-ui/SearchUIProvider'

const HOST_DEFAULTS: Partial<SearchUIDefaults> = {
    showGatesCriterion: () => false,
}

describe('SearchUIProvider', () => {
    it('keeps one context value while the application passes the same defaults', () => {
        const seen: SearchUIDefaults[] = []
        const Reader = React.memo(() => {
            seen.push(React.use(SearchUIDefaultsContext))
            return null
        })
        let rerender: () => void = () => undefined
        const Application = () => {
            const [, tick] = React.useReducer((count: number) => count + 1, 0)
            rerender = tick
            return (
                <SearchUIProvider defaults={HOST_DEFAULTS}>
                    <Reader />
                </SearchUIProvider>
            )
        }

        render(<Application />)
        act(() => rerender())
        act(() => rerender())

        // A reader that nothing else re-renders is drawn once: the provider gave it nothing new.
        expect(seen).toHaveLength(1)
        expect(seen[0].showGatesCriterion()).toBe(false)
        expect(seen[0].showProjectsCriterion).toBe(initialSearchUIDefaults.showProjectsCriterion)
    })

    it('gives the readers a new value when the application changes the defaults', () => {
        const seen: SearchUIDefaults[] = []
        const Reader = React.memo(() => {
            seen.push(React.use(SearchUIDefaultsContext))
            return null
        })
        const reorderSearchTemplates = () => Promise.resolve()
        const view = render(
            <SearchUIProvider defaults={HOST_DEFAULTS}>
                <Reader />
            </SearchUIProvider>,
        )

        view.rerender(
            <SearchUIProvider defaults={{...HOST_DEFAULTS, reorderSearchTemplates}}>
                <Reader />
            </SearchUIProvider>,
        )

        expect(seen).toHaveLength(2)
        expect(seen[0].reorderSearchTemplates).toBeUndefined()
        expect(seen[1].reorderSearchTemplates).toBe(reorderSearchTemplates)
    })
})
