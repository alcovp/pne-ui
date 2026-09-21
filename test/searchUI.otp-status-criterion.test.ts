import { createSearchUIFiltersStore } from '../src/component/search-ui/filters/state/store'
import { CriterionTypeEnum } from '../src/component/search-ui/filters/types'
import { getSearchUIFiltersInitialState } from '../src/component/search-ui/filters/state/initial'
import { createClearCriteriaUndoSnapshot } from '../src/component/search-ui/filters/state/undo'
import { initialSearchUIDefaults } from '../src/component/search-ui/SearchUIProvider'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

describe('OTP_STATUS criterion', () => {
    let store: ReturnType<typeof createSearchUIFiltersStore>

    beforeEach(() => {
        localStorage.clear()
        store = createSearchUIFiltersStore()
        store.setState(getSearchUIFiltersInitialState())
        store.setState({
            defaults: initialSearchUIDefaults,
            settingsContextName: 'ctx',
            criteria: [CriterionTypeEnum.OTP_STATUS],
            onFiltersUpdate: () => {
            },
        })
    })

    it('starts from ANY and extracts it as an absent filter', () => {
        const onFiltersUpdate = jest.fn()
        store.setState({ onFiltersUpdate })

        expect(store.getState().otpStatus).toBe('ANY')

        store.getState().setOtpStatusCriterion('ANY')
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            otpStatus: null,
        }))
    })

    it('extracts ENABLED and DISABLED as is', () => {
        const onFiltersUpdate = jest.fn()
        store.setState({ onFiltersUpdate })

        store.getState().setOtpStatusCriterion('ENABLED')
        expect(store.getState().otpStatus).toBe('ENABLED')
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            otpStatus: 'ENABLED',
        }))

        store.getState().setOtpStatusCriterion('DISABLED')
        expect(onFiltersUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
            otpStatus: 'DISABLED',
        }))
    })

    it('resets to ANY when the criterion is cleared', () => {
        store.getState().setOtpStatusCriterion('DISABLED')
        store.getState().clearCriterion(CriterionTypeEnum.OTP_STATUS)

        expect(store.getState().otpStatus).toBe('ANY')
    })

    it('keeps the value in the clear-criteria undo snapshot and in a template', async () => {
        const saveSearchTemplate = jest.fn(() => Promise.resolve())
        store.setState({
            defaults: { ...initialSearchUIDefaults, saveSearchTemplate },
        })

        store.getState().setOtpStatusCriterion('ENABLED')

        expect(createClearCriteriaUndoSnapshot(store.getState()).otpStatus).toBe('ENABLED')

        store.getState().createTemplate('otp-template')
        await flushPromises()

        expect(saveSearchTemplate).toHaveBeenCalledWith(expect.objectContaining({
            template: expect.objectContaining({
                searchConditions: expect.objectContaining({ otpStatus: 'ENABLED' }),
            }),
        }))
        expect(store.getState().template?.searchConditions.otpStatus).toBe('ENABLED')
    })
})
