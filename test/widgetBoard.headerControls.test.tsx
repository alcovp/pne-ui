import React, { useEffect } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
    WidgetBoardDraftNotice,
    WidgetBoardHeaderControls,
    WidgetBoardScopeProvider,
    WidgetBoardVisibilityControl,
    useWidgetBoardScopeStore,
} from '../src/component/widget-board'
import type { WidgetBoardActionsState } from '../src/component/widget-board/types'
import type { WidgetBoardFabPanelState } from '../src/component/widget-board/widgetBoardFabStore'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options: Record<string, unknown> = {}) =>
            String(options.defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_match, name) => String(options[name] ?? '')),
    }),
}))

const makeActionsState = (
    overrides: Partial<WidgetBoardActionsState> = {},
): WidgetBoardActionsState => ({
    canResetLayout: false,
    defaultLayoutId: 'default',
    dirtyBreakpointIds: [],
    hasDraftChanges: false,
    hasHiddenWidgets: false,
    isDefaultLayoutSelected: true,
    isSelectedLayoutLocked: true,
    persistenceStatus: 'idle',
    selectedLayoutId: 'default',
    ...overrides,
})

const makePanelState = (
    overrides: Partial<WidgetBoardFabPanelState> = {},
): WidgetBoardFabPanelState => ({
    activeBreakpointId: 'desktop',
    actionsState: makeActionsState(),
    items: [
        { id: 'default', name: 'Default layout' },
        { id: 'custom', name: 'Custom layout' },
    ],
    isLoadingLayouts: false,
    lockedIds: ['default'],
    selectedId: 'default',
    visibilityItems: [],
    ...overrides,
})

const HeaderStateBridge: React.FC<{ panelState: WidgetBoardFabPanelState }> = ({ panelState }) => {
    const store = useWidgetBoardScopeStore()

    useEffect(() => {
        store.getState().setPanelState(panelState)
    }, [panelState, store])

    return null
}

const HeaderHarness: React.FC<{
    onInteractionModeChange: jest.Mock
    panelState: WidgetBoardFabPanelState
    visibilityControl?: React.ReactNode
}> = ({ onInteractionModeChange, panelState, visibilityControl }) => (
    <WidgetBoardScopeProvider>
        <HeaderStateBridge panelState={panelState} />
        <WidgetBoardHeaderControls
            interactionMode='edit'
            onInteractionModeChange={onInteractionModeChange}
            visibilityControl={visibilityControl}
        />
    </WidgetBoardScopeProvider>
)

const expectLargeButton = (button: HTMLElement) => {
    expect(button.classList.contains('MuiButton-sizeLarge')).toBe(true)
}

describe('WidgetBoardDraftNotice', () => {
    it('identifies an immutable Default draft and puts the active dirty breakpoint first', () => {
        render(
            <WidgetBoardDraftNotice
                activeBreakpointId='desktop'
                dirtyBreakpointIds={['narrow', 'desktop']}
                hasDraftChanges
            />,
        )

        const notice = screen.getByText('You’re editing the Default layout').closest('[data-pne-widget-board-default-draft-notice]')
        expect(notice?.getAttribute('data-pne-widget-board-dirty')).toBe('true')
        expect(notice?.getAttribute('data-pne-widget-board-dirty-breakpoint-ids')).toBe('narrow desktop')
        expect(screen.getByText('Unsaved changes · desktop, narrow')).toBeTruthy()
    })
})

describe('WidgetBoardHeaderControls layout editing UX', () => {
    it('uses standard menu semantics and shows the active board size once above the layouts', async () => {
        render(
            <HeaderHarness
                onInteractionModeChange={jest.fn()}
                panelState={makePanelState({
                    onAdd: jest.fn(async () => 'new-layout'),
                    onSelect: jest.fn(async () => undefined),
                })}
            />,
        )

        const trigger = await screen.findByRole('button', { name: 'Default layout' })
        fireEvent.click(trigger)

        const menu = await screen.findByRole('menu', { name: 'Layouts' })
        const context = menu.querySelector<HTMLElement>('[data-pne-widget-board-layout-menu-context="true"]')
        const layoutOptions = within(menu).getAllByRole('menuitemradio')
        const defaultOption = within(menu).getByRole('menuitemradio', { name: 'Default layout' })
        const customOption = within(menu).getByRole('menuitemradio', { name: 'Custom layout' })
        const saveAsAction = within(menu).getByRole('menuitem', { name: 'Save as new layout' })
        const dividers = within(menu).getAllByRole('separator')

        expect(context).toBeTruthy()
        expect(within(context!).getByText('Board size')).toBeTruthy()
        expect(within(context!).getByText('desktop')).toBeTruthy()
        expect(within(menu).getAllByText('desktop')).toHaveLength(1)
        expect(trigger.getAttribute('aria-controls')).toBe(menu.id)
        expect(menu.getAttribute('aria-describedby')).toBe(context!.id)
        expect(context!.getAttribute('role')).toBe('presentation')
        expect(within(menu).queryByRole('listitem')).toBeNull()
        expect(layoutOptions).toHaveLength(2)
        expect(defaultOption.getAttribute('aria-checked')).toBe('true')
        expect(defaultOption.classList.contains('Mui-selected')).toBe(true)
        expect(within(defaultOption).getByTestId('CheckRoundedIcon')).toBeTruthy()
        await waitFor(() => expect(document.activeElement).toBe(defaultOption))
        expect(customOption.getAttribute('aria-checked')).toBe('false')
        expect(defaultOption.parentElement).toBe(menu)
        expect(customOption.parentElement).toBe(menu)
        expect(saveAsAction.parentElement).toBe(menu)
        expect(dividers).toHaveLength(2)
        expect(dividers[1].compareDocumentPosition(saveAsAction) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

        fireEvent.keyDown(defaultOption, { key: 'ArrowDown' })
        await waitFor(() => expect(document.activeElement).toBe(customOption))
        fireEvent.keyDown(customOption, { key: 'End' })
        await waitFor(() => expect(document.activeElement).toBe(saveAsAction))
        fireEvent.keyDown(saveAsAction, { key: 'Escape' })
        await waitFor(() => expect(screen.queryByRole('menu', { name: 'Layouts' })).toBeNull())
        expect(trigger.hasAttribute('aria-expanded')).toBe(false)

        fireEvent.click(trigger)
        fireEvent.click(await screen.findByRole('menuitem', { name: 'Save as new layout' }))
        expect(await screen.findByRole('dialog', { name: 'Create layout' })).toBeTruthy()
    })

    it('keeps equal 8px outer gaps around Saved when order-only visibility renders nothing', async () => {
        render(
            <HeaderHarness
                onInteractionModeChange={jest.fn()}
                panelState={makePanelState({
                    actionsState: makeActionsState({
                        defaultLayoutId: 'default',
                        isDefaultLayoutSelected: false,
                        isSelectedLayoutLocked: false,
                        selectedLayoutId: 'custom',
                    }),
                    editBehavior: 'order-only',
                    onFlushLayoutSave: jest.fn(async () => undefined),
                    onSelect: jest.fn(async () => undefined),
                    selectedId: 'custom',
                })}
                visibilityControl={<WidgetBoardVisibilityControl />}
            />,
        )

        const savedStatus = (await screen.findByText('Saved')).closest<HTMLElement>(
            '[data-pne-widget-board-persistence-status]',
        )
        const controls = document.querySelector<HTMLElement>(
            '[data-pne-widget-board-header-controls="true"]',
        )
        const layoutSelector = controls?.querySelector<HTMLElement>(
            '[data-pne-widget-board-layout-selector="true"]',
        )
        const doneButton = screen.getByRole('button', { name: 'Done' })

        expect(controls).toBeTruthy()
        expect(layoutSelector).toBeTruthy()
        expect(savedStatus).toBeTruthy()
        expect(layoutSelector?.nextElementSibling).toBe(savedStatus)
        expect(savedStatus?.nextElementSibling).toBe(doneButton)
        expect(window.getComputedStyle(controls!).gap).toBe('4px')
        expect(window.getComputedStyle(savedStatus!).marginLeft).toBe('4px')
        expect(window.getComputedStyle(savedStatus!).marginRight).toBe('4px')
        expect(window.getComputedStyle(savedStatus!).gap).toBe('6px')
        expect(controls?.querySelector('[data-pne-widget-board-visibility-trigger="true"]')).toBeNull()
    })

    it('marks a dirty locked selector and guards Done with Continue or Discard', async () => {
        const onInteractionModeChange = jest.fn()
        const onDiscardLayoutChanges = jest.fn(async () => undefined)
        const panelState = makePanelState({
            actionsState: makeActionsState({
                dirtyBreakpointIds: ['desktop'],
                hasDraftChanges: true,
            }),
            onAdd: jest.fn(async () => 'new-layout'),
            onDiscardLayoutChanges,
            onSelect: jest.fn(async () => undefined),
        })

        render(
            <HeaderHarness
                onInteractionModeChange={onInteractionModeChange}
                panelState={panelState}
            />,
        )

        const selector = await screen.findByRole('button', {
            name: 'Default layout. Unsaved changes · desktop',
        })
        expect(selector.getAttribute('data-pne-widget-board-layout-locked')).toBe('true')
        expect(selector.getAttribute('data-pne-widget-board-layout-dirty')).toBe('true')
        expect(selector.getAttribute('title')).toBe('Unsaved changes · desktop')
        expect(window.getComputedStyle(selector.closest('[data-pne-widget-board-header-controls]') as HTMLElement).flexWrap).toBe('wrap')
        expect(screen.queryByText('You’re editing the Default layout')).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'Done' }))
        let guard = await screen.findByRole('dialog', { name: 'Keep your changes?' })
        const guardActions = guard.querySelector<HTMLElement>('[data-pne-modal-actions="true"]')!
        const guardLeading = guard.querySelector<HTMLElement>('[data-pne-modal-action="leading"]')!
        const guardTrailing = guard.querySelector<HTMLElement>('[data-pne-modal-actions-group="trailing"]')!
        expect(window.getComputedStyle(guardActions).gap).toBe('8px')
        expect(window.getComputedStyle(guardLeading).marginInlineEnd).toBe('0px')
        expect(window.getComputedStyle(guardTrailing).gap).toBe('8px')
        const guardButtonNames = ['Continue editing', 'Discard changes', 'Save as new layout']
        guardButtonNames.forEach(name => {
            expectLargeButton(within(guard).getByText(name).closest('button') as HTMLButtonElement)
        })
        fireEvent.click(within(guard).getByText('Continue editing').closest('button') as HTMLButtonElement)
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Keep your changes?' })).toBeNull())
        expect(onInteractionModeChange).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: 'Done' }))
        guard = await screen.findByRole('dialog', { name: 'Keep your changes?' })
        fireEvent.click(within(guard).getByRole('button', { name: 'Discard changes' }))
        await waitFor(() => expect(onDiscardLayoutChanges).toHaveBeenCalledTimes(1))
        await waitFor(() => expect(onInteractionModeChange).toHaveBeenCalledWith('view'))
    })

    it('keeps a failed guarded Save As open, then creates and completes the deferred layout switch', async () => {
        const onInteractionModeChange = jest.fn()
        const onSelect = jest.fn(async () => undefined)
        const onAdd = jest
            .fn<Promise<string>, [string]>()
            .mockRejectedValueOnce(new Error('backend unavailable'))
            .mockResolvedValueOnce('saved-draft')
        const panelState = makePanelState({
            addInfo: { basedOnName: 'Default layout' },
            actionsState: makeActionsState({
                dirtyBreakpointIds: ['desktop'],
                hasDraftChanges: true,
            }),
            onAdd,
            onDiscardLayoutChanges: jest.fn(async () => undefined),
            onSelect,
        })

        render(
            <HeaderHarness
                onInteractionModeChange={onInteractionModeChange}
                panelState={panelState}
            />,
        )

        const selector = await screen.findByRole('button', { name: /Default layout/ })
        fireEvent.click(selector)
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Custom layout' }))

        const guard = await screen.findByRole('dialog', { name: 'Keep your changes?' })
        fireEvent.click(within(guard).getByRole('button', { name: 'Save as new layout' }))

        const createDialog = await screen.findByRole('dialog', { name: 'Create layout' })
        const createActions = createDialog.querySelector<HTMLElement>('[data-pne-modal-actions="true"]')!
        const createTrailing = createDialog.querySelector<HTMLElement>('[data-pne-modal-actions-group="trailing"]')!
        expect(window.getComputedStyle(createActions).gap).toBe('8px')
        expect(window.getComputedStyle(createTrailing).gap).toBe('8px')
        expectLargeButton(within(createDialog).getByText('Cancel').closest('button') as HTMLButtonElement)
        expectLargeButton(within(createDialog).getByRole('button', { name: 'Create' }))
        const inheritanceNotice = within(createDialog).getByRole('status')
        expect(inheritanceNotice.getAttribute('data-pne-widget-board-save-as-inheritance')).toBe('true')
        expect(inheritanceNotice.textContent).toBe('Will inherit from: Default layout')
        expect(inheritanceNotice.classList.contains('MuiAlert-colorInfo')).toBe(true)
        expect(inheritanceNotice.classList.contains('MuiAlert-standard')).toBe(true)
        expect(inheritanceNotice.querySelector('.MuiAlert-icon')).toBeTruthy()
        expect(within(createDialog).queryByRole('alert')).toBeNull()
        const nameInput = within(createDialog).getByRole('textbox', { name: 'Layout name' }) as HTMLInputElement
        fireEvent.change(nameInput, { target: { value: 'Saved draft' } })
        fireEvent.click(within(createDialog).getByRole('button', { name: 'Create' }))

        const createError = await within(createDialog).findByRole('alert')
        expect(createError.textContent).toBe('Couldn’t create the layout. Try again.')
        expect(inheritanceNotice.isConnected).toBe(true)
        expect(nameInput.value).toBe('Saved draft')
        expect(onSelect).not.toHaveBeenCalled()

        fireEvent.click(within(createDialog).getByRole('button', { name: 'Create' }))
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create layout' })).toBeNull())
        expect(onAdd).toHaveBeenCalledTimes(2)
        expect(onAdd).toHaveBeenLastCalledWith('Saved draft')
        expect(onSelect).toHaveBeenCalledWith('custom')
        expect(onInteractionModeChange).not.toHaveBeenCalled()
    })

    it('does not report a create error when only the deferred layout switch fails', async () => {
        const onAdd = jest.fn(async () => 'saved-draft')
        const onSelect = jest
            .fn<Promise<void>, [string]>()
            .mockRejectedValueOnce(new Error('selection persistence failed'))
            .mockResolvedValueOnce(undefined)

        render(
            <HeaderHarness
                onInteractionModeChange={jest.fn()}
                panelState={makePanelState({
                    actionsState: makeActionsState({
                        dirtyBreakpointIds: ['desktop'],
                        hasDraftChanges: true,
                    }),
                    onAdd,
                    onDiscardLayoutChanges: jest.fn(async () => undefined),
                    onSelect,
                })}
            />,
        )

        fireEvent.click(await screen.findByRole('button', { name: /Default layout/ }))
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Custom layout' }))
        const guard = await screen.findByRole('dialog', { name: 'Keep your changes?' })
        fireEvent.click(within(guard).getByRole('button', { name: 'Save as new layout' }))

        const createDialog = await screen.findByRole('dialog', { name: 'Create layout' })
        fireEvent.change(within(createDialog).getByRole('textbox', { name: 'Layout name' }), {
            target: { value: 'Saved despite switch failure' },
        })
        fireEvent.click(within(createDialog).getByRole('button', { name: 'Create' }))

        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create layout' })).toBeNull())
        expect(onAdd).toHaveBeenCalledTimes(1)
        expect(onSelect).toHaveBeenCalledWith('custom')
        expect(screen.queryByText('Couldn’t create the layout. Try again.')).toBeNull()
        expect(await screen.findByText('Couldn’t save changes')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(2))
        await waitFor(() => expect(screen.queryByText('Couldn’t save changes')).toBeNull())
    })

    it('retries a failed direct layout selection with its original target', async () => {
        const onSelect = jest
            .fn<Promise<void>, [string]>()
            .mockRejectedValueOnce(new Error('selection persistence failed'))
            .mockResolvedValueOnce(undefined)

        render(
            <HeaderHarness
                onInteractionModeChange={jest.fn()}
                panelState={makePanelState({
                    onAdd: jest.fn(async () => 'new-layout'),
                    onSelect,
                })}
            />,
        )

        fireEvent.click(await screen.findByRole('button', { name: 'Default layout' }))
        fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Custom layout' }))
        expect(await screen.findByText('Couldn’t save changes')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(2))
        expect(onSelect).toHaveBeenNthCalledWith(1, 'custom')
        expect(onSelect).toHaveBeenNthCalledWith(2, 'custom')
    })

    it('keeps the Create dialog blocked until Save As succeeds', async () => {
        let resolveAdd: ((id: string) => void) | undefined
        const onAdd = jest.fn(() => new Promise<string>(resolve => {
            resolveAdd = resolve
        }))

        render(
            <HeaderHarness
                onInteractionModeChange={jest.fn()}
                panelState={makePanelState({
                    onAdd,
                    onSelect: jest.fn(async () => undefined),
                })}
            />,
        )

        fireEvent.click(await screen.findByRole('button', { name: 'Save as new layout' }))
        const createDialog = await screen.findByRole('dialog', { name: 'Create layout' })
        expect(createDialog.querySelector('[data-pne-widget-board-save-as-inheritance="true"]')).toBeNull()
        const nameInput = within(createDialog).getByRole('textbox', { name: 'Layout name' }) as HTMLInputElement
        fireEvent.change(nameInput, { target: { value: 'Awaited layout' } })
        fireEvent.click(within(createDialog).getByRole('button', { name: 'Create' }))

        expect(screen.getByRole('dialog', { name: 'Create layout' })).toBeTruthy()
        expect(nameInput.disabled).toBe(true)
        expect((within(createDialog).getByRole('button', { name: 'Create' }) as HTMLButtonElement).disabled).toBe(true)

        await act(async () => {
            resolveAdd?.('awaited-layout')
        })
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Create layout' })).toBeNull())
    })

    it('shows custom autosave state, flushes Done, and exposes retry after an error', async () => {
        const onInteractionModeChange = jest.fn()
        let resolveDone: (() => void) | undefined
        const onFlushLayoutSave = jest
            .fn<Promise<void>, []>()
            .mockImplementationOnce(() => new Promise<void>(resolve => {
                resolveDone = resolve
            }))
            .mockResolvedValueOnce(undefined)
        const baseCustomState = {
            defaultLayoutId: 'default',
            dirtyBreakpointIds: ['desktop'],
            hasDraftChanges: true,
            isDefaultLayoutSelected: false,
            isSelectedLayoutLocked: false,
            selectedLayoutId: 'custom',
        }
        const customPanel = (persistenceStatus: 'idle' | 'pending') => makePanelState({
            actionsState: makeActionsState({
                ...baseCustomState,
                persistenceStatus,
            }),
            onAdd: jest.fn(async () => 'new-layout'),
            onFlushLayoutSave,
            onSelect: jest.fn(async () => undefined),
            selectedId: 'custom',
        })

        const view = render(
            <HeaderHarness
                onInteractionModeChange={onInteractionModeChange}
                panelState={customPanel('idle')}
            />,
        )

        expect(await screen.findByText('Saved')).toBeTruthy()
        view.rerender(
            <HeaderHarness
                onInteractionModeChange={onInteractionModeChange}
                panelState={customPanel('pending')}
            />,
        )
        expect(await screen.findByText('Saving…')).toBeTruthy()
        expect(document.querySelector('[data-pne-widget-board-persistence-status="pending"]')).toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Save as new layout' })).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'Done' }))
        expect(onInteractionModeChange).not.toHaveBeenCalled()
        await act(async () => {
            resolveDone?.()
        })
        await waitFor(() => expect(onInteractionModeChange).toHaveBeenCalledWith('view'))

        view.rerender(
            <HeaderHarness
                onInteractionModeChange={onInteractionModeChange}
                panelState={makePanelState({
                    actionsState: makeActionsState({
                        ...baseCustomState,
                        persistenceError: 'request failed',
                        persistenceStatus: 'error',
                    }),
                    onAdd: jest.fn(async () => 'new-layout'),
                    onFlushLayoutSave,
                    onSelect: jest.fn(async () => undefined),
                    selectedId: 'custom',
                })}
            />,
        )

        const errorStatus = await screen.findByText('Couldn’t save changes')
        expect(errorStatus.closest('[data-pne-widget-board-persistence-status]')?.getAttribute('title')).toBe('request failed')
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
        await waitFor(() => expect(onFlushLayoutSave).toHaveBeenCalledTimes(2))
    })

    it('blocks layout mutation controls while saved layouts are loading', async () => {
        const onAdd = jest.fn(async () => 'new-layout')
        render(
            <HeaderHarness
                onInteractionModeChange={jest.fn()}
                panelState={makePanelState({
                    isLoadingLayouts: true,
                    onAdd,
                    onSelect: jest.fn(async () => undefined),
                })}
            />,
        )

        const selector = await screen.findByRole('button', { name: 'Default layout' }) as HTMLButtonElement
        const saveAs = screen.getByRole('button', { name: 'Save as new layout' }) as HTMLButtonElement
        const done = screen.getByRole('button', { name: 'Done' }) as HTMLButtonElement
        expect(selector.disabled).toBe(true)
        expect(saveAs.disabled).toBe(true)
        expect(done.disabled).toBe(true)
        fireEvent.click(saveAs)
        expect(onAdd).not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog', { name: 'Create layout' })).toBeNull()
    })
})
