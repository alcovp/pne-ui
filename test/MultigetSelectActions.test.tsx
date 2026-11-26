import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import {
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    MultigetSelect,
    MultigetSelectActions,
    MultigetSelectStoreProvider,
    SearchUIProvider,
} from '../src'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    })
})

describe('MultigetSelect external actions', () => {
    const criterion: MultigetCriterion = {
        entityType: LinkedEntityTypeEnum.PROCESSOR,
        filterType: MultichoiceFilterTypeEnum.NONE,
        searchString: '',
        selectedItems: '7',
        selectedItemNames: 'Processor 7',
        deselectedItems: '',
        deselectedItemNames: '',
    }

    it('renders one shared action row and saves state owned by the selector', async () => {
        const onCancel = jest.fn()
        const onSave = jest.fn()
        const {container} = render(
            <MultigetSelectStoreProvider>
                <MultigetSelect
                    actionsPlacement='external'
                    linkedMultigetCriteria={[]}
                    multigetCriterion={criterion}
                    onCancel={onCancel}
                    onSave={onSave}
                />
                <MultigetSelectActions
                    multigetCriterion={criterion}
                    onCancel={onCancel}
                    onSave={onSave}
                />
            </MultigetSelectStoreProvider>,
        )

        await screen.findByTitle('Processor 7')

        expect(container.querySelectorAll('[data-pne-modal-actions]')).toHaveLength(1)

        fireEvent.click(screen.getByRole('button', {name: 'save'}))
        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(criterion)
        })

        fireEvent.click(screen.getByRole('button', {name: 'cancel'}))
        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('shows skeleton rows in the available list until its first page comes', async () => {
        let resolvePage!: (entities: {id: number, displayName: string}[]) => void
        const getMatchLinkedItems = jest.fn(() => new Promise<{id: number, displayName: string}[]>(resolve => {
            resolvePage = resolve
        }))
        const {container} = render(
            <SearchUIProvider defaults={{getMatchLinkedItems}}>
                <MultigetSelectStoreProvider>
                    <MultigetSelect
                        linkedMultigetCriteria={[]}
                        multigetCriterion={criterion}
                        onCancel={jest.fn()}
                        onSave={jest.fn()}
                    />
                </MultigetSelectStoreProvider>
            </SearchUIProvider>,
        )
        const skeletonRows = () => container.querySelectorAll('[data-autotest="criterion-multiget-skeleton"]')
        const rows = () => container.querySelectorAll('[data-autotest="criterion-multiget-add"]')

        // From the first frame: a page of rows, no empty list before them.
        expect(skeletonRows()).toHaveLength(10)
        expect(rows()).toHaveLength(0)
        expect(container.querySelector('[aria-busy]')?.getAttribute('aria-busy')).toBe('true')

        resolvePage([{id: 21, displayName: 'Processor 21'}, {id: 22, displayName: 'Processor 22'}])

        await waitFor(() => {
            expect(rows()).toHaveLength(2)
        })
        expect(skeletonRows()).toHaveLength(0)
    })

    it('leaves the loading state when the request of the list fails', async () => {
        const failure = new Error('The list is not available')
        const getMatchLinkedItems = jest.fn().mockRejectedValue(failure)
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)

        try {
            const {container} = render(
                <SearchUIProvider defaults={{getMatchLinkedItems}}>
                    <MultigetSelectStoreProvider>
                        <MultigetSelect
                            linkedMultigetCriteria={[]}
                            multigetCriterion={criterion}
                            onCancel={jest.fn()}
                            onSave={jest.fn()}
                        />
                    </MultigetSelectStoreProvider>
                </SearchUIProvider>,
            )

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith(failure)
            })
            await waitFor(() => {
                expect(container.querySelector('[aria-busy]')?.getAttribute('aria-busy')).toBe('false')
            })
        } finally {
            consoleError.mockRestore()
        }
    })
})
