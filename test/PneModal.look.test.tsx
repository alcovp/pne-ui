import {Button} from '@mui/material'
import * as React from 'react'
import {act, cleanup, render, screen} from '@testing-library/react'

import {PneModal, PneModalActions, PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

const renderModal = (
    props: Partial<React.ComponentProps<typeof PneModal>> = {},
    body: React.ReactNode = 'Body text',
) => {
    render(
        <PneThemeProvider skin={UI_KIT_SKIN}>
            <PneModal
                actions={
                    <PneModalActions
                        primary={
                            <Button variant='contained' size='medium'>
                                Save
                            </Button>
                        }
                    />
                }
                onClose={() => undefined}
                open
                subtitle='3 gates selected'
                title='Min/max amounts'
                {...(props as object)}
            >
                {body}
            </PneModal>
        </PneThemeProvider>,
    )
    const dialog = screen.getByRole('dialog')
    return {
        dialog,
        header: dialog.querySelector<HTMLElement>('[data-pne-modal-header]')!,
        body: dialog.querySelector<HTMLElement>('[data-pne-modal-body]'),
        footer: dialog.querySelector<HTMLElement>('[data-pne-modal-footer]'),
    }
}

const style = (element: Element) => window.getComputedStyle(element)

describe('PneModal (UI Kit look)', () => {
    it('draws the window as a 16px-rounded card with 16px around its content, a border and a soft shadow', () => {
        const {dialog} = renderModal()

        expect(style(dialog).borderRadius).toBe('16px')
        expect(style(dialog).padding).toBe('16px')
        expect(style(dialog).border).toBe('1px solid rgb(226, 233, 240)')
        expect(style(dialog).boxShadow).toBe('0 8px 24px rgba(13, 26, 51, 0.12)')
        expect(style(dialog).background).toBe('rgb(255, 255, 255)')
        // The window takes the focus on opening and shows no ring around itself.
        expect(style(dialog).outline).toMatch(/none/)
    })

    it('sets the title 18/26 SemiBold and the subtitle 12/16 in the colours of the UI Kit', () => {
        renderModal()
        const title = screen.getByRole('heading', {name: 'Min/max amounts'})
        const subtitle = screen.getByText('3 gates selected')

        expect(style(title).fontSize).toBe('18px')
        expect(style(title).lineHeight).toBe('26px')
        expect(style(title).fontWeight).toBe('600')
        expect(style(title).color).toBe('rgb(44, 49, 54)')
        expect(style(subtitle).fontSize).toBe('12px')
        expect(style(subtitle).lineHeight).toBe('16px')
        expect(style(subtitle).color).toBe('rgb(86, 91, 97)')
        // The title stands on the middle line of the close button.
        expect(style(title.parentElement!).paddingTop).toBe('3px')
    })

    it('keeps a consumer colour of the title', () => {
        // A palette name: MUI 9 Typography ignores a dotted path like 'error.main'.
        renderModal({slotProps: {title: {color: 'error'}}})

        expect(style(screen.getByRole('heading', {name: 'Min/max amounts'})).color).toBe('rgb(211, 47, 47)')
    })

    it('draws the close cross as a 32px icon action: no fill, only the icon takes colour', () => {
        renderModal()
        const close = screen.getByRole('button', {name: 'Close'})

        expect(style(close).width).toBe('32px')
        expect(style(close).height).toBe('32px')
        expect(style(close).borderRadius).toBe('4px')
        expect(style(close).backgroundColor).toBe('rgba(0, 0, 0, 0)')
        // UI Kit Icon action: the tertiary text colour at rest.
        expect(style(close).color).toBe('rgb(110, 116, 122)')
        expect(close.querySelector('[data-testid="PneCloseIcon"]')).not.toBeNull()
    })

    it('parts the header and the buttons from the body by hairlines inside the padding of the window', () => {
        const {header, body, footer} = renderModal()

        expect(style(header).padding).toBe('0px 0px 8px 0px')
        expect(style(header).borderBottom).toBe('1px solid rgb(226, 233, 240)')
        expect(style(header).alignItems).toBe('flex-start')
        expect(style(body!).padding).toBe('7px 16px 8px')
        // The body scrolls across the whole width of the window.
        expect(style(body!).margin).toBe('0px -16px')
        expect(style(body!).fontSize).toBe('14px')
        expect(style(body!).lineHeight).toBe('20px')
        expect(style(footer!).padding).toBe('7px 0px 0px')
        expect(style(footer!).borderTop).toBe('1px solid rgb(226, 233, 240)')
    })

    it('draws no hairlines in a window with no body: they would lie one on the other', () => {
        const withBody = renderModal()
        expect(withBody.dialog.hasAttribute('data-pne-modal-lines')).toBe(false)
        cleanup()

        const {dialog, header, body, footer} = renderModal({}, null)
        expect(body).toBeNull()
        expect(dialog.getAttribute('data-pne-modal-lines')).toBe('none')
        // The lines keep their pixel and lose their colour, so the window does not change its height.
        expect(style(header).borderBottomColor).toBe('rgba(0, 0, 0, 0)')
        expect(style(footer!).borderTopColor).toBe('rgba(0, 0, 0, 0)')
    })

    it('draws no hairlines around a body of one row, and brings them back when the body grows', () => {
        const observers: Array<() => void> = []
        const original = window.ResizeObserver
        window.ResizeObserver = class {
            constructor(private readonly callback: () => void) {
                observers.push(callback)
            }
            observe() {
                this.callback()
            }
            unobserve() {
                /* nothing is kept */
            }
            disconnect() {
                /* nothing is kept */
            }
        } as unknown as typeof ResizeObserver
        let bodyHeight = 35
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {configurable: true, get: () => bodyHeight})

        try {
            const {dialog} = renderModal()
            // A line of text and the paddings of the body.
            expect(dialog.getAttribute('data-pne-modal-lines')).toBe('none')

            bodyHeight = 120
            act(() => observers.forEach(notify => notify()))
            expect(dialog.hasAttribute('data-pne-modal-lines')).toBe(false)
        } finally {
            delete (HTMLElement.prototype as {scrollHeight?: number}).scrollHeight
            window.ResizeObserver = original
        }
    })

    it('marks a body with no buttons under it, whose lower edge is the padding of the window', () => {
        const withButtons = renderModal()
        expect(withButtons.body!.hasAttribute('data-pne-modal-last')).toBe(false)
        cleanup()

        const {body, footer} = renderModal({actions: undefined})
        expect(footer).toBeNull()
        expect(body!.getAttribute('data-pne-modal-last')).toBe('true')
    })
})
