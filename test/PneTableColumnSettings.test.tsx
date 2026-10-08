import * as React from 'react'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {
    PneTableColumnSettingsAction,
    PneTableColumnSettingsDialog,
    usePneTableColumnSettings,
    type PneTableColumnOption,
    type PneTableColumnSettingsValue,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: {defaultValue?: string} & Record<string, unknown>) => {
            const template = options?.defaultValue ?? key
            return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? ''))
        },
    }),
}))

const columns: readonly PneTableColumnOption[] = [
    {id: 'id', label: 'ID'},
    {id: 'name', label: 'Name'},
    {id: 'email', label: 'Email', defaultVisible: false},
    {id: 'created', label: 'Created'},
]

const dialog = () => screen.getByRole('dialog')
const button = (autoTestId: string) => dialog()
    .querySelector(`[data-autotest="${autoTestId}"]`) as HTMLButtonElement

const renderDialog = (
    overrides: Partial<React.ComponentProps<typeof PneTableColumnSettingsDialog>> = {},
) => {
    const onClose = jest.fn()
    const onSave = jest.fn<Promise<void>, [PneTableColumnSettingsValue]>().mockResolvedValue(undefined)
    const utils = render(<PneTableColumnSettingsDialog
        autoTestId='items'
        columns={columns}
        onClose={onClose}
        onSave={onSave}
        open
        {...overrides}
    />)
    return {...utils, onClose, onSave}
}

const optionInputs = () => Array.from(
    dialog().querySelectorAll<HTMLInputElement>('input[data-autotest="column-settings-option"]'),
)

const optionById = (id: string): HTMLInputElement => {
    const input = optionInputs().find(candidate => candidate.dataset.autotestValue === id)
    if (!input) {
        throw new Error(`No option for column "${id}"`)
    }
    return input
}

describe('PneTableColumnSettingsDialog', () => {
    it('renders nothing while closed', () => {
        const {container} = renderDialog({open: false})

        expect(container.innerHTML).toBe('')
        expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('lists visible columns first in stored order, then hidden ones, with native checked state', () => {
        renderDialog({
            value: {visibleColumnIds: ['created', 'id'], hiddenColumnIds: ['name', 'email']},
        })

        expect(dialog().getAttribute('data-autotest')).toBe('column-settings-dialog')
        expect(dialog().getAttribute('data-autotest-value')).toBe('items')
        expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['created', 'id', 'name', 'email'])
        expect(optionInputs().map(input => input.checked)).toEqual([true, true, false, false])
        expect(screen.getByText('Table settings')).toBeTruthy()
    })

    it('filters the checklist by label without changing the draft', () => {
        renderDialog()
        const search = dialog().querySelector('input[data-autotest="column-settings-search"]') as HTMLInputElement

        fireEvent.change(search, {target: {value: '  MAIL '}})

        expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['email'])

        fireEvent.change(search, {target: {value: 'zzz'}})

        expect(optionInputs()).toHaveLength(0)
        expect(dialog().querySelector('[data-autotest="column-settings-empty"]')).not.toBeNull()
        expect(screen.getByText('No columns match')).toBeTruthy()

        fireEvent.change(search, {target: {value: ''}})

        expect(optionInputs().map(input => input.checked)).toEqual([true, true, true, false])
    })

    it('saves the normalized draft and closes on success', async () => {
        const {onClose, onSave} = renderDialog()

        fireEvent.click(optionById('name'))
        fireEvent.click(optionById('email'))
        expect(optionById('name').checked).toBe(false)
        expect(optionById('email').checked).toBe(true)

        fireEvent.click(button('column-settings-save'))

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
        expect(onSave).toHaveBeenCalledWith({
            visibleColumnIds: ['id', 'created', 'email'],
            hiddenColumnIds: ['name'],
        })
    })

    it('keeps the last visible column locked', () => {
        renderDialog({
            value: {visibleColumnIds: ['id', 'name'], hiddenColumnIds: ['email', 'created']},
        })

        fireEvent.click(optionById('name'))

        expect(optionById('name').checked).toBe(false)
        expect(optionById('id').checked).toBe(true)
        expect(optionById('id').disabled).toBe(true)

        // Disabled controls receive no clicks in a browser; jsdom still toggles a
        // disabled checkbox, so the row button is the realistic target here.
        fireEvent.click(optionById('id').closest('[role="button"]') as HTMLElement)

        expect(optionById('id').checked).toBe(true)

        fireEvent.click(optionById('created'))

        expect(optionById('id').disabled).toBe(false)
    })

    it('resets the draft to catalog defaults without saving', () => {
        const {onSave} = renderDialog({
            value: {visibleColumnIds: ['email'], hiddenColumnIds: ['id', 'name', 'created']},
        })

        expect(button('column-settings-reset').disabled).toBe(false)

        fireEvent.click(button('column-settings-reset'))

        expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['id', 'name', 'created', 'email'])
        expect(optionInputs().map(input => input.checked)).toEqual([true, true, true, false])
        expect(button('column-settings-reset').disabled).toBe(true)
        expect(onSave).not.toHaveBeenCalled()
    })

    it('discards the draft on cancel and starts from the stored value when reopened', () => {
        const {onClose, onSave, rerender} = renderDialog()

        fireEvent.click(optionById('name'))
        fireEvent.click(button('column-settings-cancel'))

        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onSave).not.toHaveBeenCalled()

        rerender(<PneTableColumnSettingsDialog
            autoTestId='items'
            columns={columns}
            onClose={onClose}
            onSave={onSave}
            open={false}
        />)
        rerender(<PneTableColumnSettingsDialog
            autoTestId='items'
            columns={columns}
            onClose={onClose}
            onSave={onSave}
            open
        />)

        expect(optionById('name').checked).toBe(true)
    })

    it('keeps every row in place when a column is hidden and shown again', () => {
        const {onSave} = renderDialog({
            value: {visibleColumnIds: ['created', 'id', 'name'], hiddenColumnIds: ['email']},
        })

        fireEvent.click(optionById('id'))

        expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['created', 'id', 'name', 'email'])
        expect(optionInputs().map(input => input.checked)).toEqual([true, false, true, false])

        fireEvent.click(optionById('id'))

        expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['created', 'id', 'name', 'email'])
        expect(optionInputs().map(input => input.checked)).toEqual([true, true, true, false])

        fireEvent.click(optionById('email'))
        fireEvent.click(button('column-settings-save'))

        expect(onSave).toHaveBeenCalledWith({
            visibleColumnIds: ['created', 'id', 'name', 'email'],
            hiddenColumnIds: [],
        })
    })

    it('shows the last-visible hint as a tooltip on the locked row', async () => {
        renderDialog({value: {visibleColumnIds: ['id'], hiddenColumnIds: ['name', 'email', 'created']}})
        const lockedRow = optionById('id').closest('li') as HTMLElement

        expect(screen.queryByText('At least one column stays visible')).toBeNull()

        fireEvent.mouseOver(lockedRow.querySelector('span') as HTMLElement)

        expect(await screen.findByText('At least one column stays visible')).toBeTruthy()
    })

    it('re-enables the controls after a failed save when StrictMode replays effects', async () => {
        let rejectSave: (reason: Error) => void = () => undefined
        const onSave = jest.fn(() => new Promise<void>((_resolve, reject) => {
            rejectSave = reject
        }))
        const onClose = jest.fn()
        render(<React.StrictMode>
            <PneTableColumnSettingsDialog autoTestId='items' columns={columns} onClose={onClose} onSave={onSave} open/>
        </React.StrictMode>)

        fireEvent.click(optionById('name'))
        fireEvent.click(button('column-settings-save'))
        expect(button('column-settings-save').disabled).toBe(true)

        await act(async () => {
            rejectSave(new Error('offline'))
            await Promise.resolve()
        })

        await waitFor(() => expect(button('column-settings-save').disabled).toBe(false))
        expect(onClose).not.toHaveBeenCalled()
        expect(optionById('name').checked).toBe(false)
    })

    it('stays open with the draft intact when saving fails', async () => {
        let rejectSave: (reason: Error) => void = () => undefined
        const onSave = jest.fn(() => new Promise<void>((_resolve, reject) => {
            rejectSave = reject
        }))
        const {onClose} = renderDialog({onSave})

        fireEvent.click(optionById('name'))
        fireEvent.click(button('column-settings-save'))

        expect(button('column-settings-save').disabled).toBe(true)
        expect(button('column-settings-cancel').disabled).toBe(true)
        expect(optionById('created').disabled).toBe(true)

        await act(async () => {
            rejectSave(new Error('offline'))
            await Promise.resolve()
        })

        await waitFor(() => expect(button('column-settings-save').disabled).toBe(false))
        expect(onClose).not.toHaveBeenCalled()
        expect(optionById('name').checked).toBe(false)
    })
})

describe('PneTableColumnSettingsAction', () => {
    it('renders an icon button with an accessible name and scoped locator by default', () => {
        const onClick = jest.fn()
        render(<PneTableColumnSettingsAction autoTestId='items' onClick={onClick}/>)

        const action = screen.getByRole('button', {name: 'Table settings'})
        expect(action.getAttribute('data-autotest')).toBe('column-settings')
        expect(action.getAttribute('data-autotest-value')).toBe('items')

        fireEvent.click(action)

        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('renders a labelled outlined button for wide layouts', () => {
        render(<PneTableColumnSettingsAction label='Columns' onClick={jest.fn()} variant='button'/>)

        const action = screen.getByRole('button', {name: 'Columns'})
        expect(action.getAttribute('data-autotest')).toBe('column-settings')
        expect(action.textContent).toContain('Columns')
    })
})

describe('usePneTableColumnSettings', () => {
    const Harness = (props: {
        value?: PneTableColumnSettingsValue
        onSave: (value: PneTableColumnSettingsValue) => Promise<void>
    }) => {
        const settings = usePneTableColumnSettings({columns, onSave: props.onSave, value: props.value})

        return <div>
            <PneTableColumnSettingsAction onClick={settings.openDialog}/>
            <PneTableColumnSettingsDialog {...settings.dialogProps}/>
            <output data-testid='visible'>{settings.visibleColumns.map(column => column.id).join(',')}</output>
            <output data-testid='email-visible'>{String(settings.isVisible('email'))}</output>
            <output data-testid='default'>{String(settings.isDefault)}</output>
        </div>
    }

    it('resolves visible columns from the stored value and drives the dialog', async () => {
        const onSave = jest.fn<Promise<void>, [PneTableColumnSettingsValue]>().mockResolvedValue(undefined)
        const {rerender} = render(<Harness onSave={onSave}/>)

        expect(screen.getByTestId('visible').textContent).toBe('id,name,created')
        expect(screen.getByTestId('email-visible').textContent).toBe('false')
        expect(screen.getByTestId('default').textContent).toBe('true')
        expect(screen.queryByRole('dialog')).toBeNull()

        fireEvent.click(screen.getByRole('button', {name: 'Table settings'}))
        expect(screen.getByRole('dialog')).toBeTruthy()

        fireEvent.click(optionById('email'))
        fireEvent.click(button('column-settings-save'))

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        const saved = onSave.mock.calls[0][0]
        expect(saved).toEqual({visibleColumnIds: ['id', 'name', 'created', 'email'], hiddenColumnIds: []})

        rerender(<Harness onSave={onSave} value={saved}/>)

        expect(screen.getByTestId('visible').textContent).toBe('id,name,created,email')
        expect(screen.getByTestId('email-visible').textContent).toBe('true')
        expect(screen.getByTestId('default').textContent).toBe('false')
    })
})

describe('PneTableColumnSettingsDialog reordering', () => {
    const rect = (left: number, top: number, width: number, height: number): DOMRect => ({
        x: left, y: top, left, top, width, height,
        right: left + width, bottom: top + height,
        toJSON: () => ({}),
    })
    const grips = () => Array.from(
        dialog().querySelectorAll<HTMLButtonElement>('[data-autotest="column-settings-reorder"]'),
    )
    const gripFor = (id: string) => grips().find(grip => grip.dataset.autotestValue === id)

    beforeEach(() => {
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const list = this.closest('[data-rfd-droppable-id]')
            if (this.hasAttribute('data-rfd-draggable-id') && list) {
                const index = Array.from(list.querySelectorAll('[data-rfd-draggable-id]')).indexOf(this)
                return rect(100, 100 + index * 40, 400, 40)
            }
            return rect(100, 100, 400, 400)
        })
        jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
        jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400)
        jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400)
        jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(400)
        jest.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
        jest.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('shows grips only for visible columns and hides them while filtering or when disabled', () => {
        const {rerender, onClose, onSave} = renderDialog()

        expect(grips().map(grip => grip.dataset.autotestValue)).toEqual(['id', 'name', 'created'])
        expect(gripFor('id')?.getAttribute('aria-label')).toBe('Reorder ID')

        const search = dialog().querySelector('input[data-autotest="column-settings-search"]') as HTMLInputElement
        fireEvent.change(search, {target: {value: 'a'}})
        expect(grips()).toHaveLength(0)
        fireEvent.change(search, {target: {value: ''}})
        expect(grips()).toHaveLength(3)

        rerender(<PneTableColumnSettingsDialog
            autoTestId='items'
            columns={columns}
            onClose={onClose}
            onSave={onSave}
            open
            reorderable={false}
        />)
        expect(grips()).toHaveLength(0)
    })

    it('reorders visible columns from the keyboard and saves the new order', async () => {
        const {onSave} = renderDialog()
        const grip = gripFor('id') as HTMLButtonElement

        act(() => grip.focus())
        fireEvent.keyDown(grip, {key: ' ', code: 'Space', keyCode: 32})
        await waitFor(() => expect(grip.closest('[data-rfd-draggable-id]')?.getAttribute('style')).toContain('position: fixed'))
        fireEvent.keyDown(window, {key: 'ArrowDown', code: 'ArrowDown', keyCode: 40})
        fireEvent.keyDown(window, {key: ' ', code: 'Space', keyCode: 32})

        await waitFor(() => expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['name', 'id', 'created', 'email']))

        fireEvent.click(button('column-settings-save'))

        await waitFor(() => expect(onSave).toHaveBeenCalledWith({
            visibleColumnIds: ['name', 'id', 'created'],
            hiddenColumnIds: ['email'],
        }))
    })

    it('keeps the single visible column without a grip', () => {
        renderDialog({value: {visibleColumnIds: ['id'], hiddenColumnIds: ['name', 'email', 'created']}})

        expect(grips()).toHaveLength(0)
    })

    it('gives a re-enabled column a grip in its own place and saves the list order', async () => {
        const {onSave} = renderDialog({
            value: {visibleColumnIds: ['id', 'created'], hiddenColumnIds: ['name', 'email']},
        })

        expect(grips().map(grip => grip.dataset.autotestValue)).toEqual(['id', 'created'])

        fireEvent.click(optionById('name'))

        expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['id', 'created', 'name', 'email'])
        expect(grips().map(grip => grip.dataset.autotestValue)).toEqual(['id', 'created', 'name'])

        const grip = gripFor('name') as HTMLButtonElement
        act(() => grip.focus())
        fireEvent.keyDown(grip, {key: ' ', code: 'Space', keyCode: 32})
        await waitFor(() => expect(grip.closest('[data-rfd-draggable-id]')?.getAttribute('style')).toContain('position: fixed'))
        fireEvent.keyDown(window, {key: 'ArrowUp', code: 'ArrowUp', keyCode: 38})
        fireEvent.keyDown(window, {key: 'ArrowUp', code: 'ArrowUp', keyCode: 38})
        fireEvent.keyDown(window, {key: ' ', code: 'Space', keyCode: 32})

        await waitFor(() => expect(optionInputs().map(input => input.dataset.autotestValue)).toEqual(['name', 'id', 'created', 'email']))

        fireEvent.click(button('column-settings-save'))

        await waitFor(() => expect(onSave).toHaveBeenCalledWith({
            visibleColumnIds: ['name', 'id', 'created'],
            hiddenColumnIds: ['email'],
        }))
    })
})
