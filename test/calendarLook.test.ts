import {createPneTheme, type Skin} from '../src'
import {pneCalendarPopperSx} from '../src/component/calendarLook'

type Rules = Record<string, Record<string, unknown>>

const rulesOf = (colorMode: 'light' | 'dark'): Rules => {
    const theme = createPneTheme({experimentalColor: '#0a91bc'} as Skin, {colorMode})
    return (pneCalendarPopperSx as (theme: unknown) => Rules)(theme)
}

const DAY = '& .MuiDateRangePickerDay-root, & .MuiPickersDay-root'

describe('pneCalendarPopperSx', () => {
    it('draws a day as the UI Kit Date picker/Day cell: 36x32, radius 4, no gap in a week', () => {
        const rules = rulesOf('light')

        expect(rules[DAY]).toMatchObject({
            '--PickerDay-horizontalMargin': '0px',
            borderRadius: '4px',
            fontSize: '14px',
            height: '32px',
            margin: 0,
            width: '36px',
        })
        expect(rules['& .MuiDayCalendar-weekContainer']).toMatchObject({margin: '6px 0 0'})
        expect(rules['& .MuiPickerPopper-paper']).toMatchObject({borderRadius: '8px'})
    })

    it.each(['light', 'dark'] as const)('keeps the ends of a range solid over the band in the %s theme', mode => {
        const rules = rulesOf(mode)
        const end = '& .MuiDateRangePickerDay-root.Mui-selected:not(.MuiDateRangePickerDay-insideSelection)'
        const solid = rules[`${end}, & .MuiPickersDay-root.Mui-selected`]

        // MUI multiplies a tint over the cell; the band here is a plain fill and stops beside the ends.
        expect(rules['& .MuiDateRangePickerDay-root::before']).toMatchObject({mixBlendMode: 'normal'})
        expect(rules[`${end}::before`]).toMatchObject({backgroundColor: 'transparent'})
        expect(typeof solid.backgroundColor).toBe('string')
        expect(solid.backgroundColor).not.toBe(rules['& .MuiDateRangePickerDay-root::before'].backgroundColor)
        expect(rules['& .MuiDateRangePickerDay-selectionStart:not(.MuiDateRangePickerDay-selectionEnd)'])
            .toMatchObject({borderRadius: '4px 0 0 4px'})
        expect(rules['& .MuiDateRangePickerDay-selectionEnd:not(.MuiDateRangePickerDay-selectionStart)'])
            .toMatchObject({borderRadius: '0 4px 4px 0'})
    })
})
