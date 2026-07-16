import * as React from 'react'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import {
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    MultigetSelect,
    MultigetSelectActions,
    MultigetSelectStoreProvider,
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
})
