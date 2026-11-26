import * as React from 'react'
import {render, screen} from '@testing-library/react'

import {PneEmptyState, PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

describe('PneEmptyState', () => {
    it('says what is not here under the glyph of an empty table, 14/20 Medium in the middle', () => {
        const {container} = render(
            <PneThemeProvider skin={UI_KIT_SKIN}>
                <PneEmptyState>No templates yet.</PneEmptyState>
            </PneThemeProvider>,
        )
        const root = container.querySelector<HTMLElement>('[data-pne-empty-state]')!
        const style = window.getComputedStyle(root)

        expect(screen.getByText('No templates yet.')).not.toBeNull()
        expect(root.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
        expect(style.textAlign).toBe('center')
        expect(style.fontWeight).toBe('500')
        expect(style.fontSize).toBe('14px')
        expect(style.lineHeight).toBe('20px')
        const sign = window.getComputedStyle(root.firstElementChild!)
        expect([sign.width, sign.height, sign.borderRadius]).toEqual(['48px', '48px', '50%'])
    })
})
