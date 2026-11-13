import type {SxProps, Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {resolvePneSemanticPalette} from '../createTheme'
import {createPneMenuPanelStyle} from './dropdown/dropdownLook'
import {createTableControlTextButtonStyle} from './table/tableControlButtonStyle'

const DAY = '& .MuiDateRangePickerDay-root, & .MuiPickersDay-root'
const DAY_HOVER = [
    '& .MuiDateRangePickerDay-root:hover',
    '& .MuiDateRangePickerDay-root:focus',
    '& .MuiPickersDay-root:hover',
    '& .MuiPickersDay-root:focus',
].join(', ')
const DAY_MUTED = [
    '& .MuiDateRangePickerDay-dayOutsideMonth',
    '& .MuiPickersDay-dayOutsideMonth',
    '& .MuiDateRangePickerDay-root.Mui-disabled',
    '& .MuiPickersDay-root.Mui-disabled',
].join(', ')
const RANGE_END = '& .MuiDateRangePickerDay-root.Mui-selected:not(.MuiDateRangePickerDay-insideSelection)'
const PICKED_DAY = '& .MuiPickersDay-root.Mui-selected'
const selectedDay = (state = ''): string => `${RANGE_END}${state}, ${PICKED_DAY}${state}`

/**
 * The UI Kit Date picker look on a MUI X calendar, set on its popper: the panel of the library's
 * dropdowns (radius 8, a ring, the popover shadow), the month arrows as 24px tertiary buttons, a
 * 14/20 month name, and the Date picker/Day cell - 36x32 with a radius of 4, no gap in a week and
 * 6px between weeks. A day under the pointer takes the tabs fill, today a 1px ring of the link
 * colour, the ends of a range the primary fill, the days between them the selected row fill, a day
 * of another month or a disabled one the disabled text.
 */
export const pneCalendarPopperSx: SxProps<Theme> = theme => {
    const pne = resolvePneSemanticPalette(theme)
    const option = pne.dropdown.option
    const primary = pne.button.primary
    const solid: SystemStyleObject<Theme> = {
        backgroundColor: primary.default.fill,
        color: primary.default.text,
        fontWeight: 400,
    }
    const rules: Record<string, SystemStyleObject<Theme>> = {
        '& .MuiPickerPopper-paper': createPneMenuPanelStyle(theme),
        '& .MuiPickersArrowSwitcher-button': {
            ...createTableControlTextButtonStyle(theme),
            margin: 0,
            padding: 0,
            width: '24px',
        },
        '& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root': {
            fontSize: '16px',
        },
        '& .MuiPickersArrowSwitcher-root .MuiTypography-root, & .MuiPickersCalendarHeader-label': {
            color: option.text,
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: '20px',
        },
        '& .MuiDayCalendar-weekDayLabel': {
            color: pne.dropdown.chip.remove,
            fontSize: '12px',
            height: '32px',
            lineHeight: '16px',
            margin: 0,
            width: '36px',
        },
        '& .MuiDayCalendar-weekContainer': {
            margin: '6px 0 0',
        },
        [DAY]: {
            '--PickerDay-horizontalMargin': '0px',
            borderRadius: '4px',
            color: option.text,
            fontSize: '14px',
            height: '32px',
            lineHeight: '20px',
            margin: 0,
            width: '36px',
        },
        [DAY_HOVER]: {
            backgroundColor: pne.table.band.tabs.fill,
        },
        '& .MuiDateRangePickerDay-root.Mui-focusVisible, & .MuiPickersDay-root.Mui-focusVisible': {
            outline: `2px solid ${pne.focusRing}`,
            outlineOffset: '-2px',
        },
        '& .MuiDateRangePickerDay-today:not(.Mui-selected), & .MuiPickersDay-today:not(.Mui-selected)': {
            border: 0,
            boxShadow: `inset 0 0 0 1px ${pne.link}`,
            outline: 'none',
        },
        [DAY_MUTED]: {
            color: option.disabled,
        },
        // The band of a range: the selected row fill, laid as it is (MUI multiplies its own tint).
        '& .MuiDateRangePickerDay-root::before': {
            backgroundColor: pne.table.row.selected,
            mixBlendMode: 'normal',
        },
        // The ends of a range are solid cells; the band starts beside them, so they join it by a flat side.
        [`${RANGE_END}::before`]: {
            backgroundColor: 'transparent',
        },
        '& .MuiDateRangePickerDay-selectionStart:not(.MuiDateRangePickerDay-selectionEnd)': {
            borderRadius: '4px 0 0 4px',
        },
        '& .MuiDateRangePickerDay-selectionEnd:not(.MuiDateRangePickerDay-selectionStart)': {
            borderRadius: '0 4px 4px 0',
        },
        [selectedDay()]: solid,
        [selectedDay(':focus')]: solid,
        [selectedDay(':hover')]: {
            backgroundColor: primary.hover.fill,
            color: primary.hover.text,
        },
    }
    return rules
}
