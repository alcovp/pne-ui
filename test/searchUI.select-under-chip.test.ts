import {selectUnderChipSx} from '../src/component/search-ui/filters/component/select/style'

describe('the transparent select over a value chip of the filters', () => {
    it('is the box of its chip, so the keyboard focus rings the chip and not the 40px field around it', () => {
        const rules = selectUnderChipSx as Record<string, Record<string, unknown>>

        expect(rules['&&& .MuiInputBase-root']).toEqual({height: '100%', minHeight: 0})
        expect(rules['&&& .MuiSelect-select.MuiInputBase-input']).toEqual({
            boxSizing: 'border-box',
            fontSize: '0',
            height: '100%',
            minHeight: 0,
            padding: 0,
        })
    })
})
