import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {DesktopDateTimePicker} from '@mui/x-date-pickers/DesktopDateTimePicker'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'

import PneCalendarActionBar from '../src/component/PneCalendarActionBar'

describe('PneCalendarActionBar', () => {
    it('gives a picker the library buttons: a tertiary Cancel and a primary OK that act as MUI X ones', async () => {
        const onAccept = jest.fn()
        const onClose = jest.fn()

        render(<LocalizationProvider dateAdapter={AdapterDayjs}>
            <DesktopDateTimePicker
                defaultValue={dayjs('2026-01-05T10:00:00')}
                onAccept={onAccept}
                onClose={onClose}
                open
                slots={{actionBar: PneCalendarActionBar}}
            />
        </LocalizationProvider>)

        const bar = await waitFor(() => {
            const element = document.querySelector<HTMLElement>('[data-pne-calendar-actions]')
            expect(element).not.toBeNull()
            return element as HTMLElement
        })
        const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('button'))

        expect(buttons.map(button => button.textContent)).toEqual(['Cancel', 'OK'])
        // PneButton, not MUI's text button: its size and variant marks.
        expect(buttons.map(button => button.getAttribute('data-pne-size'))).toEqual(['medium', 'medium'])
        expect(buttons[0].getAttribute('data-pne-variant')).not.toBe(buttons[1].getAttribute('data-pne-variant'))

        fireEvent.click(screen.getByRole('button', {name: 'OK'}))
        await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1))
        expect(onClose).toHaveBeenCalled()
    })
})
