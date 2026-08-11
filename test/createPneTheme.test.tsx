import {getContrastRatio, useTheme} from '@mui/material/styles'
import {fireEvent, render, screen} from '@testing-library/react'
import React from 'react'

import {
    createPneTheme,
    PNE_DARK_COLORS,
    PneThemeProvider,
    type Skin,
    usePneColorMode,
} from '../src'

const createSkin = (experimentalColor: string): Skin => ({experimentalColor} as Skin)

const compositeRgbaOnHex = (foreground: string, background: string): string => {
    const match = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(foreground)
    if (!match) return foreground

    const alpha = Number(match[4])
    const backgroundChannels = [1, 3, 5].map(index =>
        Number.parseInt(background.slice(index, index + 2), 16),
    )
    const foregroundChannels = match.slice(1, 4).map(Number)
    return `#${foregroundChannels.map((channel, index) =>
        Math.round(channel * alpha + backgroundChannels[index] * (1 - alpha))
            .toString(16)
            .padStart(2, '0'),
    ).join('')}`
}

describe('createPneTheme', () => {
    it('preserves the current light palette by default', () => {
        const theme = createPneTheme(createSkin('#0a91bc'))

        expect(theme.palette.mode).toBe('light')
        expect(theme.palette.primary.main).toBe('#0A91BC')
        expect(theme.palette.background.default).toBe('#fff')
        expect(theme.palette.pne.brand.seed).toBe('#0A91BC')
        expect(theme.palette.pne.brand.foreground).toBe('#0A91BC')
    })

    it('builds the neutral dark surface and text contract', () => {
        const theme = createPneTheme(createSkin('#0a91bc'), {colorMode: 'dark'})

        expect(theme.palette.mode).toBe('dark')
        expect(theme.palette.background.default).toBe(PNE_DARK_COLORS.backgroundDefault)
        expect(theme.palette.background.paper).toBe(PNE_DARK_COLORS.backgroundPaper)
        expect(theme.palette.text.primary).toBe(PNE_DARK_COLORS.textPrimary)
        expect(theme.palette.text.secondary).toBe(PNE_DARK_COLORS.textSecondary)
        expect(theme.palette.pne.surface).toEqual({
            sunken: PNE_DARK_COLORS.surfaceSunken,
            subtle: PNE_DARK_COLORS.surfaceSubtle,
            raised: PNE_DARK_COLORS.surfaceRaised,
        })
    })

    it.each([
        '#000000',
        '#111111',
        '#151515',
        '#FFFFFF',
        '#FFD600',
        '#D25A5B',
        '#1C9941',
        '#0A91BC',
        '#0E0A24',
    ])('derives accessible dark foreground and filled-control text for %s', seed => {
        const theme = createPneTheme(createSkin(seed), {colorMode: 'dark'})
        const {brand, surface} = theme.palette.pne
        const foregroundSurfaces = [
            theme.palette.background.default,
            theme.palette.background.paper,
            surface.sunken,
            surface.subtle,
            surface.raised,
        ]

        foregroundSurfaces.forEach(background => {
            expect(getContrastRatio(brand.foreground, background)).toBeGreaterThanOrEqual(4.5)
            expect(getContrastRatio(brand.foregroundHover, background)).toBeGreaterThanOrEqual(4.5)
        })
        expect(getContrastRatio(
            brand.foreground,
            compositeRgbaOnHex(brand.soft, theme.palette.background.paper),
        )).toBeGreaterThanOrEqual(4.5)
        const fillStates = [brand.fill, brand.fillHover, brand.fillActive]
        fillStates.forEach(fill => {
            expect(getContrastRatio(fill, brand.onFill)).toBeGreaterThanOrEqual(4.5)
        })

        const fillBoundaryContrast = getContrastRatio(brand.fill, surface.raised)
        if (fillBoundaryContrast < 3) {
            expect(brand.fillBorder).toBe(brand.foreground)
            expect(getContrastRatio(brand.fillBorder, surface.raised)).toBeGreaterThanOrEqual(3)
        }
        expect(createPneTheme(createSkin(seed), {colorMode: 'dark'}).palette.pne.brand)
            .toEqual(brand)
    })

    it('deeply composes caller options without dropping the PNE palette or component overrides', () => {
        const theme = createPneTheme(createSkin('#0a91bc'), {
            colorMode: 'dark',
            palette: {
                error: {main: '#FF1234'},
            },
            components: {
                MuiPaper: {
                    defaultProps: {square: true},
                },
            },
        })

        expect(theme.palette.mode).toBe('dark')
        expect(theme.palette.primary.main).not.toBe('#90caf9')
        expect(theme.palette.pne.brand.seed).toBe('#0A91BC')
        expect(theme.palette.error.main).toBe('#FF1234')
        expect(theme.components?.MuiButton?.styleOverrides?.root).toBeDefined()
        expect(theme.components?.MuiPaper?.defaultProps?.square).toBe(true)
    })
})

const ThemeProbe = () => {
    const theme = useTheme()
    const {mode, setMode} = usePneColorMode()
    return (
        <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} type='button'>
            {`${mode}:${theme.palette.mode}:${theme.palette.background.paper}`}
        </button>
    )
}

describe('PneThemeProvider', () => {
    it('owns in-memory mode without using browser storage', () => {
        const getItem = jest.spyOn(Storage.prototype, 'getItem')
        const setItem = jest.spyOn(Storage.prototype, 'setItem')

        render(
            <PneThemeProvider skin={createSkin('#111111')}>
                <ThemeProbe />
            </PneThemeProvider>,
        )

        expect(screen.getByRole('button').textContent).toBe('light:light:#fff')
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByRole('button').textContent)
            .toBe(`dark:dark:${PNE_DARK_COLORS.backgroundPaper}`)
        expect(getItem).not.toHaveBeenCalled()
        expect(setItem).not.toHaveBeenCalled()

        getItem.mockRestore()
        setItem.mockRestore()
    })
})
