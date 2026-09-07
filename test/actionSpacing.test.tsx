import React from 'react'
import {render} from '@testing-library/react'
import {PneActionSpacingStyles, PneThemeProvider, Skin} from '../src'

describe('library-owned action spacing', () => {
    it.each(['application-provider', 'pne-provider'])('provides both CSS tokens without host CSS: %s', mode => {
        render(mode === 'application-provider'
            ? <PneActionSpacingStyles/>
            : <PneThemeProvider skin={{experimentalColor: '#0a91bc'} as Skin}>
                <div/>
            </PneThemeProvider>)

        const styles = getComputedStyle(document.documentElement)
        expect(styles.getPropertyValue('--pne-action-buttons-gap')).toBe('8px')
        expect(styles.getPropertyValue('--pne-action-groups-gap')).toBe('8px')
    })
})
