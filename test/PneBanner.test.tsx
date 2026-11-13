import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import {PneBanner, PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

// jsdom ignores selector specificity in getComputedStyle, so nested rules are read from the rules of
// the element's own css- class. `&` stands for that class; selectors are compared without whitespace.
const ruleValue = (element: Element, selector: string, property: string): string | undefined => {
    const wanted = Array.from(element.classList)
        .filter(className => className.startsWith('css-'))
        .map(className => selector.replace(/&/g, `.${className}`).replace(/\s+/g, ''))
    const values = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .filter(rule => wanted.includes(rule.selectorText.replace(/\s+/g, '')))
        .map(rule => rule.style.getPropertyValue(property))
        .filter(Boolean)

    return values[values.length - 1]
}

const renderBanner = (banner: React.ReactElement) => render(<PneThemeProvider skin={UI_KIT_SKIN}>{banner}</PneThemeProvider>)

// UI Kit Banner.
describe('PneBanner', () => {
    it('draws the pale fill of its tone in a ring of the tone, with the sign, the title and the text', () => {
        renderBanner(<PneBanner title='Traffic is paused' tone='warning'>The daily limit is reached.</PneBanner>)
        const banner = screen.getByRole('status')

        expect(banner.getAttribute('data-pne-tone')).toBe('warning')
        expect(ruleValue(banner, '&', 'border-radius')).toBe('8px')
        expect(ruleValue(banner, '&', 'padding')).toBe('12px 16px')
        expect(ruleValue(banner, '&', 'gap')).toBe('12px')
        expect(ruleValue(banner, '&[data-pne-tone="warning"]', 'background-color')).toBe('#FEEFE4')
        expect(ruleValue(banner, '&[data-pne-tone="warning"]', 'box-shadow')).toBe('inset 0 0 0 1px #FFC393')
        expect(ruleValue(banner, '& [data-pne-banner-sign]', 'width')).toBe('20px')
        expect(ruleValue(banner, '& [data-pne-banner-title]', 'font-weight')).toBe('600')
        expect(banner.querySelector('[data-pne-banner-sign]')).not.toBeNull()
        expect(banner.querySelector('[data-pne-banner-title]')?.textContent).toBe('Traffic is paused')
        expect(banner.querySelector('[data-pne-banner-text]')?.textContent).toBe('The daily limit is reached.')
        expect(banner.querySelector('button')).toBeNull()
    })

    it('announces an error as an alert and the other tones as a status', () => {
        renderBanner(<>
            <PneBanner tone='error'>Failed</PneBanner>
            <PneBanner>Note</PneBanner>
        </>)

        expect(screen.getByRole('alert').textContent).toBe('Failed')
        expect(screen.getByRole('status').getAttribute('data-pne-tone')).toBe('info')
    })

    it('offers an action link and a close cross when asked', () => {
        const onAction = jest.fn()
        const onClose = jest.fn()
        renderBanner(<PneBanner actionLabel='Retry' closeLabel='Dismiss' onAction={onAction} onClose={onClose} tone='error'>
            The policy did not load.
        </PneBanner>)

        fireEvent.click(screen.getByRole('button', {name: 'Retry'}))
        fireEvent.click(screen.getByRole('button', {name: 'Dismiss'}))

        expect(onAction).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(ruleValue(screen.getByRole('button', {name: 'Dismiss'}), '&', 'width')).toBe('24px')
    })

    it('hides the sign on request and keeps the consumer content as it is', () => {
        renderBanner(<PneBanner data-autotest='batch-progress' icon={false} tone='success'>
            <progress max={10} value={4}/>
        </PneBanner>)
        const banner = screen.getByRole('status')

        expect(banner.getAttribute('data-autotest')).toBe('batch-progress')
        expect(banner.querySelector('[data-pne-banner-sign]')).toBeNull()
        expect(banner.querySelector('progress')).not.toBeNull()
    })
})
