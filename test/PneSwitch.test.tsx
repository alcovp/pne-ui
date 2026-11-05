import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react'

import {PneSwitch, PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#007dff'} as Skin

const renderSwitch = (ui: React.ReactElement) => {
    const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)
    const root = view.container.querySelector<HTMLElement>('.MuiSwitch-root')!
    return {...view, root}
}

// jsdom has no layout and ignores selector specificity in getComputedStyle, so geometry and
// colour checks read the switch's own rules (those starting with its css- class). The selector
// suffix is compared without whitespace; an empty suffix means the root rule itself.
const ruleValue = (root: HTMLElement, selectorSuffix: string, property: string, exact = false): string | undefined => {
    const rootClasses = Array.from(root.classList).filter(className => className.startsWith('css-'))
    const values = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .filter(rule => {
            const selector = rule.selectorText.replace(/\s+/g, '')
            return rootClasses.some(className => exact || selectorSuffix === ''
                ? selector === `.${className}${selectorSuffix}`
                : selector.startsWith(`.${className}`) && selector.endsWith(selectorSuffix))
        })
        .map(rule => rule.style.getPropertyValue(property))
        .filter(Boolean)

    return values[values.length - 1]
}

const TRACK_OFF = '.MuiSwitch-switchBase+.MuiSwitch-track'
const TRACK_ON = '.MuiSwitch-switchBase.Mui-checked+.MuiSwitch-track'
const KNOB_OFF = '.MuiSwitch-switchBase.MuiSwitch-thumb'
const KNOB_ON = '.MuiSwitch-switchBase.Mui-checked.MuiSwitch-thumb'

describe('PneSwitch (UI Kit look)', () => {
    it.each([
        {rootHeight: '32px', rootWidth: '58px', size: 'medium', trackHeight: '20px', trackLeft: '13px', trackTop: '6px', trackWidth: '32px', thumb: '16px'},
        {rootHeight: '24px', rootWidth: '40px', size: 'small', trackHeight: '16px', trackLeft: '8px', trackTop: '4px', trackWidth: '24px', thumb: '12px'},
    ] as const)('lays the $size switch out as the UI Kit Switcher', ({rootHeight, rootWidth, size, trackHeight, trackLeft, trackTop, trackWidth, thumb}) => {
        const {root} = renderSwitch(<PneSwitch aria-label='Sized' size={size}/>)

        expect([ruleValue(root, '', 'width'), ruleValue(root, '', 'height')]).toEqual([rootWidth, rootHeight])
        expect([ruleValue(root, '.MuiSwitch-track', 'width'), ruleValue(root, '.MuiSwitch-track', 'height')]).toEqual([trackWidth, trackHeight])
        expect([ruleValue(root, '.MuiSwitch-track', 'left'), ruleValue(root, '.MuiSwitch-track', 'top')]).toEqual([trackLeft, trackTop])
        expect([ruleValue(root, '.MuiSwitch-thumb', 'width'), ruleValue(root, '.MuiSwitch-thumb', 'height')]).toEqual([thumb, thumb])
    })

    it('draws the off value as a brand knob on a tinted, ringed track and the on value inverted', () => {
        const {root} = renderSwitch(<PneSwitch aria-label='Values'/>)

        expect(ruleValue(root, TRACK_OFF, 'background-color', true)).toBe('#F2F8FF')
        expect(ruleValue(root, TRACK_OFF, 'box-shadow', true)).toBe('inset 0 0 0 1px #C9D2D9')
        expect(ruleValue(root, KNOB_OFF, 'background-color', true)).toBe('#007DFF')
        expect(ruleValue(root, TRACK_ON, 'background-color', true)).toBe('#007DFF')
        expect(ruleValue(root, TRACK_ON, 'box-shadow', true)).toBe('none')
        expect(ruleValue(root, KNOB_ON, 'background-color', true)).toBe('#FFFFFF')
    })

    it('keeps the track opaque where MUI fades it', () => {
        const {root} = renderSwitch(<PneSwitch aria-label='Opaque'/>)

        expect(ruleValue(root, TRACK_OFF, 'opacity', true)).toBe('1')
        expect(ruleValue(root, TRACK_ON, 'opacity', true)).toBe('1')
        expect(ruleValue(root, '.MuiSwitch-switchBase.Mui-checked.Mui-disabled+.MuiSwitch-track', 'opacity', true)).toBe('1')
    })

    it('has hover, pressed, read-only and disabled rules by UI Kit role', () => {
        const {root} = renderSwitch(<PneSwitch aria-label='States'/>)

        expect(ruleValue(root, `[data-pne-state="hover"]${TRACK_OFF}`, 'background-color')).toBe('#CCE5FF')
        expect(ruleValue(root, `[data-pne-state="hover"]${TRACK_OFF}`, 'box-shadow')).toBe('inset 0 0 0 1px #007DFF')
        expect(ruleValue(root, `[data-pne-state="hover"]${KNOB_OFF}`, 'background-color')).toBe('#0972DE')
        expect(ruleValue(root, `[data-pne-state="pressed"]${TRACK_ON}`, 'background-color')).toBe('#1266BD')
        expect(ruleValue(root, `:hover.MuiSwitch-switchBase:not(.Mui-disabled)${TRACK_ON.slice('.MuiSwitch-switchBase'.length)}`, 'background-color')).toBe('#0972DE')
        expect(ruleValue(root, `[data-pne-readonly]${TRACK_ON}`, 'background-color')).toBe('#8F9CAA')
        expect(ruleValue(root, '.MuiSwitch-switchBase.Mui-disabled+.MuiSwitch-track', 'background-color')).toBe('#EBEDF0')
        expect(ruleValue(root, '.MuiSwitch-switchBase.Mui-checked.Mui-disabled+.MuiSwitch-track', 'background-color')).toBe('#A2AEB9')
    })

    it('puts the focus ring on the track and the spinner into the knob', () => {
        const {root} = renderSwitch(<PneSwitch aria-label='Focus'/>)

        // The focus rule is a selector list; its last member is the pinned specimen state.
        expect(ruleValue(root, '[data-pne-state="focus"].MuiSwitch-switchBase+.MuiSwitch-track::before', 'box-shadow'))
            .toBe('0 0 0 2px #fff,0 0 0 4px #0972DE')
        // The spinner rules are selector lists too; their last member is the pinned loading state.
        expect(ruleValue(root, '[data-pne-state="loading"].MuiSwitch-thumb::after', 'border')).toBe('1.5px solid #FFFFFF')
        expect(ruleValue(root, '[data-pne-state="loading"].MuiSwitch-switchBase.Mui-checked.MuiSwitch-thumb::after', 'border')).toBe('1.5px solid #007DFF')
        expect(ruleValue(root, '[data-pne-state="loading"].MuiSwitch-thumb::after', 'inset')).toBe('2px')
    })

    it('marks read-only and pinned states on the root span', () => {
        const readOnly = renderSwitch(<PneSwitch aria-label='Read only' defaultChecked readOnly/>)
        expect(readOnly.root.getAttribute('data-pne-readonly')).toBe('true')
        expect(readOnly.root.querySelector('.MuiSwitch-switchBase')?.getAttribute('data-pne-readonly')).toBeNull()
        readOnly.unmount()

        const pinned = renderSwitch(<PneSwitch aria-label='Pinned' data-pne-state='hover'/>)
        expect(pinned.root.getAttribute('data-pne-state')).toBe('hover')
    })

    it('marks a pending change on the root while keeping the requested value', async () => {
        let resolveRequest: () => void = () => undefined
        const request = new Promise<void>(resolve => {
            resolveRequest = resolve
        })
        const {root} = renderSwitch(<PneSwitch aria-label='Pending' onChange={() => request}/>)
        const input = screen.getByRole('switch', {name: 'Pending'}) as HTMLInputElement

        fireEvent.click(input)

        expect(input.checked).toBe(true)
        expect(root.getAttribute('data-pne-loading')).toBe('true')
        expect(root.getAttribute('data-pne-readonly')).toBeNull()

        await act(async () => {
            resolveRequest()
            await request
        })

        expect(root.getAttribute('data-pne-loading')).toBeNull()
    })
})
