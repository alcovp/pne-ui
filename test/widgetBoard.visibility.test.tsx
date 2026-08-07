import React, { useEffect } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
    WidgetBoard,
    WidgetBoardScopeProvider,
    WidgetBoardVisibilityControl,
    useWidgetBoardScopeStore,
} from '../src/component/widget-board'
import { useOverlayStore } from '../src/component/overlay/overlayStore'
import type { WidgetBoardEditBehavior } from '../src/component/widget-board/types'
import type { WidgetBoardVisibilityItem } from '../src/component/widget-board/widgetBoardFabStore'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options: Record<string, unknown> = {}) =>
            String(options.defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_match, name) => String(options[name] ?? '')),
    }),
}))

jest.mock('../src/component/overlay/overlayRuntime', () => ({
    registerOverlayHost: () => () => undefined,
    reportMissingOverlayHost: jest.fn(),
}))

jest.mock('react-grid-layout', () => {
    const ReactModule = jest.requireActual<typeof import('react')>('react')
    const Grid = ({ children }: React.PropsWithChildren) =>
        ReactModule.createElement('div', { className: 'react-grid-layout' }, children)

    return {
        __esModule: true,
        default: Grid,
        getCompactor: () => jest.fn(),
        useContainerWidth: () => ({
            containerRef: jest.fn(),
            mounted: true,
            width: 1200,
        }),
    }
})

const visibilityItems: WidgetBoardVisibilityItem[] = [
    { id: 'beta', title: 'Beta', visible: false, canHide: true },
    { id: 'alpha', title: 'Alpha', visible: true, canHide: true },
    { id: 'required', title: 'Required widget', visible: true, canHide: false },
]

type VisibilityStateBridgeProps = {
    activeBreakpointId: string
    editBehavior?: WidgetBoardEditBehavior
    isLoadingLayouts?: boolean
    onRestoreHidden: jest.Mock
    onSetWidgetVisibility: jest.Mock
}

const VisibilityStateBridge = ({
    activeBreakpointId,
    editBehavior = 'grid',
    isLoadingLayouts = false,
    onRestoreHidden,
    onSetWidgetVisibility,
}: VisibilityStateBridgeProps) => {
    const store = useWidgetBoardScopeStore()

    useEffect(() => {
        store.getState().setPanelState({
            activeBreakpointId,
            editBehavior,
            isLoadingLayouts,
            items: [{ id: 'default', name: 'Default' }],
            lockedIds: ['default'],
            onRestoreHidden,
            onSetWidgetVisibility,
            selectedId: 'default',
            visibilityItems,
        })
    }, [activeBreakpointId, editBehavior, isLoadingLayouts, onRestoreHidden, onSetWidgetVisibility, store])

    return null
}

describe('WidgetBoardVisibilityControl', () => {
    it('opens a non-modal scoped side sheet with stable full order and required state', async () => {
        const onSetWidgetVisibility = jest.fn()
        const onRestoreHidden = jest.fn()

        render(
            <WidgetBoardScopeProvider>
                <VisibilityStateBridge
                    activeBreakpointId='desktop'
                    onRestoreHidden={onRestoreHidden}
                    onSetWidgetVisibility={onSetWidgetVisibility}
                />
                <WidgetBoardVisibilityControl />
            </WidgetBoardScopeProvider>,
        )

        const trigger = await screen.findByRole('button', { name: 'Widgets · 1 hidden' })
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        fireEvent.click(trigger)

        const panel = await screen.findByRole('dialog', { name: 'Widgets' })
        expect(panel.getAttribute('aria-modal')).toBe('false')
        expect(panel.getAttribute('data-pne-widget-board-breakpoint-id')).toBe('desktop')
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
        expect(document.body.style.overflow).toBe('')

        const rows = panel.querySelectorAll('[data-pne-widget-board-visibility-item="true"]')
        expect([...rows].map(row => row.getAttribute('data-pne-widget-board-item-id'))).toEqual([
            'beta',
            'alpha',
            'required',
        ])
        expect(within(panel).getByText('Shown 2 of 3')).toBeTruthy()
        expect(within(panel).getByText('Hidden')).toBeTruthy()
        expect(within(panel).getByText('Required')).toBeTruthy()

        const hiddenCheckbox = within(panel).getByRole('checkbox', { name: 'Show widget Beta' }) as HTMLInputElement
        const requiredCheckbox = within(panel).getByRole('checkbox', { name: 'Show widget Required widget' }) as HTMLInputElement
        expect(hiddenCheckbox.checked).toBe(false)
        expect(requiredCheckbox.checked).toBe(true)
        expect(requiredCheckbox.disabled).toBe(true)

        fireEvent.click(hiddenCheckbox)
        expect(onSetWidgetVisibility).toHaveBeenCalledWith('beta', true)
        fireEvent.click(within(panel).getByRole('button', { name: 'Show all' }))
        expect(onRestoreHidden).toHaveBeenCalledTimes(1)
    })

    it('restores trigger focus on Escape and closes when the active breakpoint changes', async () => {
        const onSetWidgetVisibility = jest.fn()
        const onRestoreHidden = jest.fn()
        const view = render(
            <WidgetBoardScopeProvider>
                <VisibilityStateBridge
                    activeBreakpointId='desktop'
                    onRestoreHidden={onRestoreHidden}
                    onSetWidgetVisibility={onSetWidgetVisibility}
                />
                <WidgetBoardVisibilityControl />
            </WidgetBoardScopeProvider>,
        )

        const trigger = await screen.findByRole('button', { name: 'Widgets · 1 hidden' })
        fireEvent.click(trigger)
        const panel = await screen.findByRole('dialog', { name: 'Widgets' })
        fireEvent.keyDown(panel, { key: 'Escape' })
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Widgets' })).toBeNull())
        await waitFor(() => expect(document.activeElement).toBe(trigger))

        fireEvent.click(trigger)
        expect(await screen.findByRole('dialog', { name: 'Widgets' })).toBeTruthy()
        view.rerender(
            <WidgetBoardScopeProvider>
                <VisibilityStateBridge
                    activeBreakpointId='compact'
                    onRestoreHidden={onRestoreHidden}
                    onSetWidgetVisibility={onSetWidgetVisibility}
                />
                <WidgetBoardVisibilityControl />
            </WidgetBoardScopeProvider>,
        )
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Widgets' })).toBeNull())
    })

    it('does not duplicate the side-sheet control in order-only editing', async () => {
        render(
            <WidgetBoardScopeProvider>
                <VisibilityStateBridge
                    activeBreakpointId='narrow'
                    editBehavior='order-only'
                    onRestoreHidden={jest.fn()}
                    onSetWidgetVisibility={jest.fn()}
                />
                <WidgetBoardVisibilityControl />
            </WidgetBoardScopeProvider>,
        )

        await waitFor(() => expect(screen.queryByRole('button', { name: /Widgets/ })).toBeNull())
    })

    it('does not allow visibility changes before saved layouts finish loading', async () => {
        render(
            <WidgetBoardScopeProvider>
                <VisibilityStateBridge
                    activeBreakpointId='desktop'
                    isLoadingLayouts
                    onRestoreHidden={jest.fn()}
                    onSetWidgetVisibility={jest.fn()}
                />
                <WidgetBoardVisibilityControl />
            </WidgetBoardScopeProvider>,
        )

        const trigger = await screen.findByRole('button', { name: 'Widgets · 1 hidden' }) as HTMLButtonElement
        expect(trigger.disabled).toBe(true)
        fireEvent.click(trigger)
        expect(screen.queryByRole('dialog', { name: 'Widgets' })).toBeNull()
    })
})

describe('WidgetBoard direct hide recovery', () => {
    const breakpoints = [{ id: 'desktop', minWidth: 0 }] as const
    const layoutByBreakpoint = {
        desktop: {
            columns: 2,
            widgetOrder: ['alpha', 'beta'],
            widgets: {
                alpha: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
                beta: { defaultSize: { columnSpan: 1, rowSpan: 2 } },
            },
        },
    }
    const widgets = [
        { id: 'alpha', title: 'Alpha', render: () => <span>Alpha content</span> },
        { id: 'beta', title: 'Beta', render: () => <span>Beta content</span> },
    ]
    const loadLayouts = async () => null
    const saveLayouts = async () => undefined

    beforeEach(() => {
        useOverlayStore.getState().clearSnackbars()
    })

    afterEach(() => {
        useOverlayStore.getState().clearSnackbars()
    })

    it('offers context-safe undo and restores the original full order after all-hidden recovery', async () => {
        render(
            <WidgetBoardScopeProvider>
                <WidgetBoard
                    autoHeightEnabled={false}
                    breakpoints={breakpoints}
                    interactionMode='edit'
                    layoutByBreakpoint={layoutByBreakpoint}
                    loadLayouts={loadLayouts}
                    saveLayouts={saveLayouts}
                    showHideUndo
                    widgets={widgets}
                />
            </WidgetBoardScopeProvider>,
        )

        expect(await screen.findByText('Alpha content')).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: 'Hide widget Alpha' }))
        await waitFor(() => expect(screen.queryByText('Alpha content')).toBeNull())

        const undoAction = useOverlayStore.getState().snackbars[0]?.action as React.ReactElement<{
            onClick: () => void
        }>
        expect(undoAction).toBeTruthy()
        act(() => undoAction.props.onClick())
        expect(await screen.findByText('Alpha content')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Hide widget Alpha' }))
        fireEvent.click(await screen.findByRole('button', { name: 'Hide widget Beta' }))
        expect(await screen.findByText('No widgets are shown')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
        await waitFor(() => {
            const content = screen.getAllByText(/content$/).map(node => node.textContent)
            expect(content).toEqual(['Alpha content', 'Beta content'])
        })
        expect(useOverlayStore.getState().snackbars).toHaveLength(0)
    })
})
