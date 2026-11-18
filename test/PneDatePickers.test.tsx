import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import dayjs from 'dayjs'

import {
    PneDatePicker,
    PneDateRangePicker,
    PneDateTimePicker,
    PneField,
    PneThemeProvider,
    PneTimePicker,
    type Skin,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({i18n: {language: 'en'}, t: (key: string) => key}),
}))

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin
const DAY = dayjs('2026-11-18T08:50:07')

// jsdom has no layout and ignores selector specificity in getComputedStyle, so the look is checked
// on the rules of the element's own css- class. `&` stands for that class; selectors are compared
// without whitespace.
const ruleValue = (element: Element, selector: string, property: string): string | undefined => {
    const wanted = Array.from(element.classList)
        .filter(className => className.startsWith('css-'))
        .map(className => selector.replace(/&/g, `.${className}`).replace(/\s+/g, ''))
    const values = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .filter(rule => wanted.includes(rule.selectorText.replace(/\s+/g, '')))
        .map(rule => rule.style.getPropertyValue(property))
        .filter(Boolean)

    return values[values.length - 1]
}

const BOX = '.MuiPickersOutlinedInput-root.MuiPickersInputBase-root'
const SECTIONS = '.MuiPickersInputBase-sectionsContainer'

const renderPicker = (ui: React.ReactElement) => {
    const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>{ui}</PneThemeProvider>)
    const root = view.container.querySelector<HTMLElement>('.MuiPickersTextField-root')!
    const box = root.querySelector<HTMLElement>('.MuiPickersInputBase-root')!
    const input = root.querySelector<HTMLInputElement>('input')!
    return {...view, box, input, root}
}

describe('the date pickers of the library', () => {
    it('draw the field as the box of the UI Kit field', () => {
        const {root} = renderPicker(<PneDatePicker label='Date'/>)

        expect(ruleValue(root, `& ${BOX}`, '--pne-field-ring')).toBe('#E2E9F0')
        expect(ruleValue(root, `& ${BOX}`, '--pne-field-fill')).toBe('#FFFFFF')
        expect(ruleValue(root, `& ${BOX}`, 'border-radius')).toBe('4px')
        expect(ruleValue(root, `& ${BOX}.Mui-focused, &[data-pne-state="focus"] ${BOX}`, '--pne-field-ring')).toBe('#026FD7')
        expect(ruleValue(root, `& ${BOX}.Mui-error`, '--pne-field-ring')).toBe('#CC2538')
        expect(ruleValue(root, `&[data-pne-filled] ${BOX}`, '--pne-field-ring')).toBe('#8D9399')
        expect(ruleValue(root, `& ${BOX} .MuiPickersOutlinedInput-notchedOutline`, 'border-width')).toBe('1px')
        expect(ruleValue(root, `& ${BOX} .MuiPickersOutlinedInput-notchedOutline legend`, 'display')).toBe('none')
        // The label stands over the box, as the label of PneTextField.
        expect(ruleValue(root, '& > .MuiInputLabel-root', 'position')).toBe('static')
        expect(ruleValue(root, '& > .MuiInputLabel-root', 'font-size')).toBe('12px')
        expect(root.querySelector('label')?.textContent).toBe('Date')
    })

    it('have the three sizes of a field, medium by default', () => {
        const medium = renderPicker(<PneDatePicker/>)
        expect(medium.root.getAttribute('data-pne-size')).toBe('medium')
        expect(ruleValue(medium.root, `&[data-pne-size="small"] ${BOX}`, 'min-height')).toBe('24px')
        expect(ruleValue(medium.root, `&[data-pne-size="medium"] ${BOX}`, 'min-height')).toBe('32px')
        expect(ruleValue(medium.root, `&[data-pne-size="large"] ${BOX}`, 'min-height')).toBe('40px')
        expect(ruleValue(medium.root, `&[data-pne-size="medium"] ${BOX} ${SECTIONS}`, 'padding')).toBe('6px 0')
        expect(ruleValue(medium.root, `&[data-pne-size="large"] ${BOX}`, 'padding')).toBe('0 10px 0 12px')
        medium.unmount()

        const large = renderPicker(<PneDatePicker size='large'/>)
        expect(large.root.getAttribute('data-pne-size')).toBe('large')
    })

    it('tell an empty field from one that holds a date', () => {
        const empty = renderPicker(<PneDatePicker value={null}/>)
        expect(empty.root.hasAttribute('data-pne-empty')).toBe(true)
        expect(empty.root.hasAttribute('data-pne-filled')).toBe(false)
        // The format of an empty field is always shown, in the placeholder colour out of focus.
        expect(ruleValue(empty.root, `& ${BOX} ${SECTIONS}`, 'opacity')).toBe('1')
        expect(ruleValue(empty.root, `&[data-pne-empty] ${BOX}:not(.Mui-focused) ${SECTIONS}`, 'color')).toBeTruthy()
        empty.unmount()

        const filled = renderPicker(<PneDatePicker value={DAY}/>)
        expect(filled.root.hasAttribute('data-pne-empty')).toBe(false)
        expect(filled.root.hasAttribute('data-pne-filled')).toBe(true)
    })

    it('show dates day first and time in 24 hours', () => {
        expect(renderPicker(<PneDatePicker value={DAY}/>).input.value).toBe('18.11.2026')
        expect(renderPicker(<PneDateTimePicker value={DAY}/>).input.value).toBe('18.11.2026 08:50')
        expect(renderPicker(<PneTimePicker value={DAY}/>).input.value).toBe('08:50')
        expect(renderPicker(<PneDateTimePicker format='DD.MM.YYYY HH:mm:ss' value={DAY}/>).input.value)
            .toBe('18.11.2026 08:50:07')
        expect(renderPicker(<PneDatePicker format='YYYY-MM-DD' value={DAY}/>).input.value).toBe('2026-11-18')
        expect(renderPicker(<PneDateRangePicker value={[dayjs('2026-11-02'), DAY]}/>).input.value)
            .toBe('02.11.2026 – 18.11.2026')
    })

    it('take a far year for a date and a broken limit for an error', () => {
        const far = renderPicker(<PneDatePicker value={dayjs('2300-01-01')}/>)
        expect(far.box.classList.contains('Mui-error')).toBe(false)
        far.unmount()

        const old = renderPicker(<PneDatePicker value={dayjs('1800-06-15')}/>)
        expect(old.box.classList.contains('Mui-error')).toBe(false)
        old.unmount()

        const late = renderPicker(<PneDatePicker maxDate={dayjs('2026-11-10')} value={DAY}/>)
        expect(late.box.classList.contains('Mui-error')).toBe(true)
        late.unmount()

        const future = renderPicker(<PneDatePicker disableFuture value={dayjs('2300-01-01')}/>)
        expect(future.box.classList.contains('Mui-error')).toBe(true)
    })

    it('leave the verdict to the application that gives one', () => {
        const onError = jest.fn()
        const cleared = renderPicker(
            <PneDatePicker error={false} maxDate={dayjs('2026-11-10')} onError={onError} value={DAY}/>,
        )
        expect(cleared.box.classList.contains('Mui-error')).toBe(false)
        // The application still hears what MUI X found.
        expect(onError).toHaveBeenCalledWith('maxDate', expect.anything())
        cleared.unmount()

        const marked = renderPicker(<PneDatePicker error helperText='Wrong day' value={DAY}/>)
        expect(marked.box.classList.contains('Mui-error')).toBe(true)
        expect(screen.getByText('Wrong day')).not.toBeNull()
    })

    it('keep the field props of the application and add its attributes', () => {
        const {root} = renderPicker(<PneDatePicker
            size='small'
            slotProps={{textField: {'data-autotest': 'date', helperText: 'From the slot'} as object}}
            value={DAY}
        />)

        expect(root.getAttribute('data-autotest')).toBe('date')
        expect(root.getAttribute('data-pne-size')).toBe('small')
        expect(screen.getByText('From the slot')).not.toBeNull()
    })

    it('take the label, the error and the disabled state of the PneField around them', () => {
        const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <PneField disabled error helperText='Fix the date' label='Bank date'>
                <PneDatePicker value={DAY}/>
            </PneField>
        </PneThemeProvider>)
        const root = view.container.querySelector<HTMLElement>('.MuiPickersTextField-root')!
        const box = root.querySelector<HTMLElement>('.MuiPickersInputBase-root')!
        const label = screen.getByText('Bank date').closest('label')!
        const helper = screen.getByText('Fix the date')

        // The box is the control: it carries the id of the field and names its label and helper text.
        expect(box.id).toBe(label.getAttribute('for'))
        expect(root.querySelector('input')?.id).not.toBe(box.id)
        expect(box.getAttribute('aria-labelledby')).toBe(label.id)
        expect(box.getAttribute('aria-describedby')).toBe(helper.id)
        expect(box.getAttribute('aria-disabled')).toBe('true')
        expect(box.getAttribute('aria-invalid')).toBe('true')
        expect(box.classList.contains('Mui-error')).toBe(true)
        expect(box.classList.contains('Mui-disabled')).toBe(true)
        expect(screen.getByRole<HTMLButtonElement>('button', {name: /choose date/i}).disabled).toBe(true)
    })

    it('mark a required field on its box, in PneField and on its own', () => {
        const own = renderPicker(<PneDatePicker label='Date' required/>)
        expect(own.box.getAttribute('aria-required')).toBe('true')
        expect(own.input.required).toBe(true)
        own.unmount()

        const view = render(<PneThemeProvider skin={UI_KIT_SKIN}>
            <PneField label='Bank date' required>
                <PneDatePicker/>
            </PneField>
        </PneThemeProvider>)
        const box = view.container.querySelector<HTMLElement>('.MuiPickersInputBase-root')!

        expect(box.getAttribute('aria-required')).toBe('true')
        // The hidden input stays optional: a browser would stop the form over an input nobody sees.
        expect(view.container.querySelector('input')?.required).toBe(false)
    })

    it('clear a clearable field by the cross of the library', () => {
        const onChange = jest.fn()
        const {root} = renderPicker(<PneDatePicker
            onChange={onChange}
            slotProps={{field: {clearable: true}}}
            value={DAY}
        />)
        const clear = root.querySelector<HTMLElement>('button.clearButton')!

        expect(clear.querySelector('[data-testid="PneCloseIcon"]')).not.toBeNull()
        fireEvent.click(clear)

        expect(onChange).toHaveBeenCalledWith(null, expect.anything())
    })

    it('give the bar under the calendar the attributes of the application', () => {
        const onBarClick = jest.fn()
        renderPicker(<PneDatePicker
            slotProps={{actionBar: {actions: ['clear'], onClick: onBarClick}}}
            value={DAY}
        />)

        fireEvent.click(screen.getByRole('button', {name: /choose date/i}))
        const bar = screen.getByRole('dialog').querySelector<HTMLElement>('[data-pne-calendar-actions]')!
        expect(bar.hasAttribute('ownerstate')).toBe(false)
        fireEvent.click(bar.querySelector('button')!)

        expect(onBarClick).toHaveBeenCalledTimes(1)
    })

    it('open the calendar of the library with its own buttons', () => {
        renderPicker(<PneDateTimePicker value={DAY}/>)

        fireEvent.click(screen.getByRole('button', {name: /choose date/i}))

        const dialog = screen.getByRole('dialog')
        expect(dialog.querySelector('[data-pne-calendar-actions]')).not.toBeNull()
        // Every minute is in the list, not every fifth.
        expect(dialog.querySelectorAll('[aria-label="Select minutes"] li').length).toBe(60)
    })
})
