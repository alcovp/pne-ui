import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import dayjs from 'dayjs'

import {PneDatePicker, PneThemeProvider, type Skin} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({i18n: {language: 'ru'}, t: (key: string) => key}),
}))

describe('the date pickers of the library in the UI language', () => {
    it('speak Russian and start the week on Monday, with the same day-first format', () => {
        const view = render(<PneThemeProvider skin={{experimentalColor: '#026fd7'} as Skin}>
            <PneDatePicker value={dayjs('2026-11-18')}/>
        </PneThemeProvider>)

        expect(view.container.querySelector('input')?.value).toBe('18.11.2026')

        fireEvent.click(screen.getByRole('button', {name: /выберите дату/i}))

        const dialog = screen.getByRole('dialog')
        expect(dialog.textContent).toContain('ноябрь 2026')
        const weekDays = Array.from(dialog.querySelectorAll('[role="columnheader"]')).map(day => day.getAttribute('aria-label'))
        expect(weekDays[0]).toBe('понедельник')
    })
})
