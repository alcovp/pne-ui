import * as React from 'react'
import {act, render, screen, within} from '@testing-library/react'

import {PneModalActions} from '../src'

const buttonLabels = (container: HTMLElement) => (
    within(container)
        .getAllByRole('button')
        .map(button => button.textContent)
)

type MediaQueryListener = (event: MediaQueryListEvent) => void

const originalMatchMedia = window.matchMedia

const installControllableMatchMedia = () => {
    let matches = false
    const listeners = new Set<MediaQueryListener>()
    const matchMedia = jest.fn().mockImplementation((query: string) => ({
        get matches() {
            return matches
        },
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: MediaQueryListener) => listeners.add(listener),
        removeEventListener: (_type: string, listener: MediaQueryListener) => listeners.delete(listener),
        addListener: (listener: MediaQueryListener) => listeners.add(listener),
        removeListener: (listener: MediaQueryListener) => listeners.delete(listener),
        dispatchEvent: jest.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: matchMedia,
    })

    return {
        matchMedia,
        setMatches(nextMatches: boolean) {
            matches = nextMatches
            const event = {matches, media: '(max-width:480px)'} as MediaQueryListEvent
            listeners.forEach(listener => listener(event))
        },
    }
}

describe('PneModalActions', () => {
    afterEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: originalMatchMedia,
        })
    })

    it('matches semantic and visual order without remounting actions at the breakpoint', () => {
        const media = installControllableMatchMedia()
        const {container} = render(
            <PneModalActions
                leading={<button>Help</button>}
                primary={<button>Save</button>}
                secondary={<button>Cancel</button>}
            />,
        )

        const actions = container.querySelector<HTMLElement>('[data-pne-modal-actions]')!
        const leading = container.querySelector<HTMLElement>("[data-pne-modal-action='leading']")!
        const trailing = container.querySelector<HTMLElement>('[data-pne-modal-actions-group]')!
        const helpButton = screen.getByRole('button', {name: 'Help'})
        const cancelButton = screen.getByRole('button', {name: 'Cancel'})
        const saveButton = screen.getByRole('button', {name: 'Save'})

        expect(buttonLabels(actions)).toEqual(['Help', 'Cancel', 'Save'])
        expect(buttonLabels(trailing)).toEqual(['Cancel', 'Save'])
        expect(leading.parentElement).toBe(actions)
        expect(trailing.parentElement).toBe(actions)
        expect(media.matchMedia).toHaveBeenCalledWith('(max-width:480px)')

        saveButton.focus()
        act(() => media.setMatches(true))

        expect(buttonLabels(actions)).toEqual(['Save', 'Cancel', 'Help'])
        expect(buttonLabels(trailing)).toEqual(['Save', 'Cancel'])
        expect(leading.parentElement).toBe(actions)
        expect(trailing.parentElement).toBe(actions)
        expect(screen.getByRole('button', {name: 'Save'})).toBe(saveButton)
        expect(screen.getByRole('button', {name: 'Cancel'})).toBe(cancelButton)
        expect(screen.getByRole('button', {name: 'Help'})).toBe(helpButton)
        expect(document.activeElement).toBe(saveButton)
    })

    it('does not remount actions or drop focus when its props update', () => {
        const {rerender} = render(
            <PneModalActions
                primary={<button>Save</button>}
                secondary={<button>Cancel</button>}
            />,
        )

        const saveButton = screen.getByRole('button', {name: 'Save'})
        saveButton.focus()
        expect(document.activeElement).toBe(saveButton)

        rerender(
            <PneModalActions
                aria-label='Updated actions'
                primary={<button>Save</button>}
                secondary={<button>Cancel</button>}
            />,
        )

        expect(screen.getByRole('button', {name: 'Save'})).toBe(saveButton)
        expect(document.activeElement).toBe(saveButton)
    })

    it('forwards a div ref and common root attributes while keeping its marker managed', () => {
        const ref = React.createRef<HTMLDivElement>()

        render(
            <PneModalActions
                ref={ref}
                aria-label='Form actions'
                className='consumer-class'
                data-pne-modal-actions='false'
                data-testid='actions'
                primary={<button>Save</button>}
                style={{minHeight: 40}}
                sx={{padding: '12px'}}
            />,
        )

        const actions = screen.getByTestId('actions')

        expect(ref.current).toBe(actions)
        expect(actions.tagName).toBe('DIV')
        expect(actions.classList.contains('consumer-class')).toBe(true)
        expect(actions.getAttribute('aria-label')).toBe('Form actions')
        expect(actions.dataset.pneModalActions).toBe('true')
        expect(window.getComputedStyle(actions).minHeight).toBe('40px')
        expect(window.getComputedStyle(actions).padding).toBe('12px')
    })

    it('keeps its owned root and content fixed for untyped callers', () => {
        const unsafeProps = {
            as: 'section',
            children: 'Replaced actions',
            component: 'article',
            dangerouslySetInnerHTML: {__html: 'Replaced actions'},
        } as unknown as React.ComponentProps<typeof PneModalActions>

        const {container} = render(
            <PneModalActions
                {...unsafeProps}
                primary={<button>Save</button>}
            />,
        )

        const actions = container.querySelector<HTMLElement>('[data-pne-modal-actions]')!
        expect(actions.tagName).toBe('DIV')
        expect(screen.getByRole('button', {name: 'Save'})).not.toBeNull()
        expect(actions.textContent).toBe('Save')
    })

    it('ships the narrow sizing and stacking layout as CSS', () => {
        installControllableMatchMedia()
        render(
            <PneModalActions
                leading={<button>Help</button>}
                primary={<button>Save</button>}
                secondary={<button>Cancel</button>}
            />,
        )

        const cssText = Array.from(document.styleSheets)
            .flatMap(styleSheet => Array.from(styleSheet.cssRules))
            .map(rule => rule.cssText)
            .join('\n')

        expect(cssText).toMatch(/@media\s*\(max-width:\s*480px\)/)
        expect(cssText).toContain('flex-direction: column')
        expect(cssText).toContain('align-items: stretch')
        expect(cssText).toContain('width: 100%')
    })
})
