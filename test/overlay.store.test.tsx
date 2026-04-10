import * as React from 'react'
import { act } from '@testing-library/react'

import { overlayActions, useOverlayStore } from '../src'
import { resetOverlayRuntimeForTests } from '../src/component/overlay/overlayRuntime'

type UndoActionProps = {
    onClick: () => void
    children: React.ReactNode
}

describe('overlayActions.showUndoSnackbar', () => {
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        resetOverlayRuntimeForTests()
        useOverlayStore.getState().clearSnackbars()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        consoleErrorSpy.mockRestore()
    })

    it('enqueues an undo snackbar with default timeout and action label', () => {
        const onUndo = jest.fn()

        const id = overlayActions.showUndoSnackbar({
            id: 'undo-1',
            message: 'Filters cleared',
            onUndo,
        })

        const state = useOverlayStore.getState()
        expect(id).toBe('undo-1')
        expect(state.snackbars).toHaveLength(1)
        expect(state.snackbars[0]).toEqual(expect.objectContaining({
            id: 'undo-1',
            message: 'Filters cleared',
            variant: 'info',
            autoHideMs: 5000,
        }))

        expect(React.isValidElement(state.snackbars[0].action)).toBe(true)
        const action = state.snackbars[0].action as React.ReactElement<UndoActionProps>
        expect(action.props.children).toBe('Undo')
    })

    it('removes the snackbar and invokes the callback when undo is clicked', () => {
        const onUndo = jest.fn()

        overlayActions.showUndoSnackbar({
            id: 'undo-2',
            message: 'Filters cleared',
            undoLabel: 'Restore',
            onUndo,
        })

        const action = useOverlayStore.getState().snackbars[0].action as React.ReactElement<UndoActionProps>

        act(() => {
            action.props.onClick()
        })

        expect(onUndo).toHaveBeenCalledTimes(1)
        expect(useOverlayStore.getState().snackbars).toHaveLength(0)
    })

    it('logs a single explicit error when snackbars are enqueued without OverlayHost', () => {
        overlayActions.showInfo({
            id: 'missing-host-1',
            message: 'Invisible snackbar',
        })

        overlayActions.showUndoSnackbar({
            id: 'missing-host-2',
            message: 'Invisible undo snackbar',
            onUndo: jest.fn(),
        })

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('overlayActions.showInfo() was called without a mounted <OverlayHost />'))
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Mount exactly one <OverlayHost /> near the application root.'))
    })
})
