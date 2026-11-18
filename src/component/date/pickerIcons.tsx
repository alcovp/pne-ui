import * as React from 'react'
import {createSvgIcon} from '@mui/material'

/** UI Kit IcCalendarCalendar: the button that opens the calendar of a date field. */
export const PneCalendarIcon = createSvgIcon(
    <>
        <rect x='3.45' y='3.9' width='17.1' height='17.1' rx='4.5' fill='none' stroke='currentColor' strokeWidth={1.5}/>
        <path
            d='M3.9 8.4h16.2M6.6 3v1.8M17.4 3v1.8'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeWidth={1.5}
        />
    </>,
    'PneCalendar',
)

/** UI Kit IcTimeClock: the button that opens the clock of a time field. */
export const PneClockIcon = createSvgIcon(
    <>
        <circle cx='12' cy='12' r='8' fill='none' stroke='currentColor' strokeWidth={1.5}/>
        <path
            d='M12 8v4l2 2'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
        />
    </>,
    'PneClock',
)
