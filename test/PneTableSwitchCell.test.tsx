import React from 'react'
import type {SwitchOwnerState} from '@mui/material/Switch'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {PneTableControlCell, PneTableSwitchCell} from '../src'

describe('PneTableSwitchCell', () => {
    it('renders a compact small switch while preserving cell and root customization', () => {
        const cellRef = React.createRef<HTMLTableCellElement>()
        const inputRef = React.createRef<HTMLInputElement>()
        const switchRef = React.createRef<HTMLSpanElement>()
        const {container} = render(
            <table>
                <tbody>
                    <tr>
                        <PneTableSwitchCell
                            aria-label='Enable gate'
                            checked={false}
                            data-cell='gate-status'
                            onChange={jest.fn()}
                            ref={cellRef}
                            switchProps={{
                                'data-autotest': 'legacy-status-switch',
                                inputRef,
                            }}
                            switchRef={switchRef}
                            sx={{width: '44px'}}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const input = screen.getByRole('switch', {name: 'Enable gate'})
        const root = input.closest('.MuiSwitch-root') as HTMLElement
        const cell = input.closest('td') as HTMLTableCellElement

        expect(root.classList.contains('MuiSwitch-sizeSmall')).toBe(true)
        expect(window.getComputedStyle(root).height).toBe('24px')
        expect(window.getComputedStyle(root).width).toBe('40px')
        expect(window.getComputedStyle(cell).boxSizing).toBe('border-box')
        expect(window.getComputedStyle(cell).padding).toBe('0px')
        expect(window.getComputedStyle(cell).textAlign).toBe('center')
        expect(window.getComputedStyle(cell).width).toBe('44px')
        expect(cell.dataset.cell).toBe('gate-status')
        expect(cellRef.current).toBe(cell)
        expect(inputRef.current).toBe(input)
        expect(switchRef.current?.tagName).toBe('SPAN')
        expect(switchRef.current?.classList.contains('MuiSwitch-switchBase')).toBe(true)
        expect(switchRef.current?.contains(input)).toBe(true)
        expect(switchRef.current?.dataset.autotest).toBe('legacy-status-switch')
        expect(input.dataset.autotest).toBe('table-switch')
        expect(container.querySelectorAll('[data-autotest]').length).toBe(2)
    })

    it('forwards the generic control-cell ref to its table cell', () => {
        const cellRef = React.createRef<HTMLTableCellElement>()

        render(<table>
            <tbody>
                <tr>
                    <PneTableControlCell ref={cellRef}>Control</PneTableControlCell>
                </tr>
            </tbody>
        </table>)

        expect(cellRef.current?.tagName).toBe('TD')
        expect(cellRef.current?.textContent).toBe('Control')
    })

    it('reports the next checked state and isolates switch and cell clicks from the row', () => {
        const onChange = jest.fn()
        const onRowClick = jest.fn()
        render(
            <table>
                <tbody>
                    <tr onClick={onRowClick}>
                        <PneTableSwitchCell
                            aria-label='Enable gate'
                            checked={false}
                            onChange={onChange}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const input = screen.getByRole('switch', {name: 'Enable gate'})
        fireEvent.click(input)
        fireEvent.click(input.closest('td') as Element)

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenCalledWith(true, expect.any(Object))
        expect(onRowClick).not.toHaveBeenCalled()
    })

    it('forwards disabled state and keeps a read-only status immutable', async () => {
        const onDisabledChange = jest.fn()
        render(
            <table>
                <tbody>
                    <tr>
                        <PneTableSwitchCell
                            aria-label='Disabled gate'
                            checked={false}
                            disabled
                            onChange={onDisabledChange}
                        />
                        <PneTableSwitchCell
                            aria-label='Required by default'
                            checked={false}
                            readOnly
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const disabled = screen.getByRole('switch', {name: 'Disabled gate'}) as HTMLInputElement
        const readOnly = screen.getByRole('switch', {name: 'Required by default'}) as HTMLInputElement

        expect(disabled.disabled).toBe(true)
        fireEvent.click(disabled)
        expect(onDisabledChange).not.toHaveBeenCalled()

        expect(readOnly.checked).toBe(false)
        expect(readOnly.getAttribute('aria-readonly')).toBe('true')
        fireEvent.click(readOnly)
        await waitFor(() => expect(readOnly.checked).toBe(false))
    })

    it('composes functional input props while owning its accessible name and locator', () => {
        const inputRef = React.createRef<HTMLInputElement>()
        const slotRef = React.createRef<HTMLInputElement>()
        const inputSlot = jest.fn((ownerState: SwitchOwnerState) => ({
            'aria-label': 'Ignored nested name',
            'aria-labelledby': 'ignored-label',
            'data-autotest': 'ignored-input-locator',
            'data-consumer-size': ownerState.size,
            ref: slotRef,
            title: 'Consumer input title',
        }))
        render(
            <table>
                <tbody>
                    <tr>
                        <th id='status-label'>Gate status</th>
                        <PneTableSwitchCell
                            aria-labelledby='status-label'
                            autoTestId='gate-status'
                            autoTestValue={42}
                            checked
                            onChange={jest.fn()}
                            switchProps={{
                                'data-autotest': 'legacy-root-locator',
                                id: 'gate-status-control',
                                inputRef,
                                name: 'enabled',
                                slotProps: {input: inputSlot},
                            }}
                        />
                    </tr>
                </tbody>
            </table>,
        )

        const input = screen.getByRole('switch', {name: 'Gate status'}) as HTMLInputElement
        const root = input.closest('.MuiSwitch-root') as HTMLElement

        expect(inputSlot).toHaveBeenCalledTimes(1)
        expect(inputRef.current).toBe(input)
        expect(slotRef.current).toBe(input)
        expect(input.id).toBe('gate-status-control')
        expect(input.name).toBe('enabled')
        expect(input.title).toBe('Consumer input title')
        expect(input.dataset.consumerSize).toBe('small')
        expect(input.dataset.autotest).toBe('gate-status')
        expect(input.dataset.autotestValue).toBe('42')
        expect(input.getAttribute('aria-label')).toBeNull()
        expect(input.getAttribute('aria-labelledby')).toBe('status-label')
        expect(root.contains(input)).toBe(true)
        expect(input.closest('[data-autotest="legacy-root-locator"]'))
            .not.toBeNull()
    })
})
