import {
    AbstractEntity,
    AutoCompleteChoiceWithStatus,
    Country,
    ensure,
    ExactCriterionSearchLabelEnum,
    PneHeaderTableCell,
    PneTableCell,
    PneTableRow,
} from '../index'
import React, { useState } from 'react'
import { SearchParams, SearchUI } from '../component/search-ui/SearchUI'
import { CriterionTypeEnum } from '../component/search-ui/filters/types'
import { Meta, StoryObj } from '@storybook/react'
import { SearchUIProvider } from '../component/search-ui/SearchUIProvider'

type DataType = AbstractEntity

class Service {

    static async getList(searchParams: SearchParams): Promise<DataType[]> {
        console.log('getList call:\n' + JSON.stringify(searchParams, null, 4))
        let data: DataType[] = []
        for (let i = 1; i <= 999; i++) {
            data.push({id: i, displayName: 'John ' + i})
        }
        await new Promise(resolve => setTimeout(resolve, 400))

        if (searchParams.multigetCriteria.length) {
            data = data.filter(item => {
                const ids = searchParams.multigetCriteria[0].selectedItems.split(',')
                return ids.some(some => +some === item.id)
            })
        }

        if (searchParams.exactSearchValue) {
            data = data.filter(item => {
                if (searchParams.exactSearchLabel === ExactCriterionSearchLabelEnum.ID) {
                    return item.id === +ensure(searchParams.exactSearchValue)
                } else if (searchParams.exactSearchLabel === ExactCriterionSearchLabelEnum.NAME) {
                    return item.displayName.includes(searchParams.exactSearchValue || '')
                } else {
                    return true
                }
            })
        }

        const dataSlice = data.slice(
            searchParams.startNum,
            searchParams.startNum + searchParams.rowCount
        )
        return dataSlice
    }

}

const HookWrap = () => {

    const [data, setData] = useState<DataType[]>([])

    return <SearchUIProvider
        defaults={{
            getDefaultCurrency: (): AbstractEntity => ({
                id: 99,
                displayName: 'BBB',
            }),
            getMatchLinkedItems: async () => {
                await new Promise(resolve => setTimeout(resolve, 400))

                return [
                    {id: 1, displayName: '(1) name1'},
                    {id: 2, displayName: '(2) name2'},
                    {id: 3, displayName: '(3) name3asdasdasd asd asdasd a sasdasdasdasdasdasd'},
                    {id: 4, displayName: '(4) name1'},
                    {id: 5, displayName: '(5) name2'},
                    {id: 6, displayName: '(6) name3'},
                    {id: 7, displayName: '(7) name1'},
                    {id: 8, displayName: '(8) name2'},
                    {id: 9, displayName: '(9) name3'},
                    {id: 10, displayName: '(10) name1'},
                    {id: 11, displayName: '(11) name2'},
                ]
            },
            getCountries: async () => {
                return [
                    {id: 1, displayName: 'Russia', theCode: 'RU', theCode3: 'RUS'},
                    {id: 2, displayName: 'Not Russia', theCode: 'XX', theCode3: 'XXX'},
                ] satisfies Country[]
            },
            getCurrencies: async () => {
                return [
                    {id: 1, displayName: 'USD'},
                    {id: 2, displayName: 'RUB'},
                    {id: 99, displayName: 'BBB'},
                ]
            },
            getProjectAvailableCurrencies: async () => {
                return [
                    {choiceId: 1, displayName: 'USD', description: '', status: "E"},
                    {choiceId: 2, displayName: 'RUB', description: '', status: "E"},
                    {choiceId: 99, displayName: 'BBB', description: '', status: "E"},
                ] satisfies AutoCompleteChoiceWithStatus[]
            },
            showGatesCriterion: () => true,
            showProjectsCriterion: () => true,
            getProcessorLogEntryTypes: async () => {
                return [
                    {id: 1, displayName: 'One'},
                    {id: 2, displayName: 'Second'},
                    {id: 99, displayName: '33333'},
                ]
            },
        }}
    >
        <SearchUI<DataType>
            settingsContextName={'context'}
            exactSearchLabels={[
                // ExactCriterionSearchLabelEnum.ALL,
                ExactCriterionSearchLabelEnum.ID,
                ExactCriterionSearchLabelEnum.NAME,
            ]}
            possibleCriteria={[
                // CriterionTypeEnum.EXACT,
                CriterionTypeEnum.ORDERS_SEARCH,
                CriterionTypeEnum.STATUS,
                CriterionTypeEnum.DATE_RANGE_ORDERS,
                CriterionTypeEnum.PROJECT_CURRENCY,
                CriterionTypeEnum.GATE,
                // CriterionTypeEnum.PROJECT,
                CriterionTypeEnum.GROUPING,
                CriterionTypeEnum.DATE_RANGE,
                // CriterionTypeEnum.PROJECT_CURRENCY,
                CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE
            ]}
            predefinedCriteria={[
                // CriterionTypeEnum.GROUPING,
                // CriterionTypeEnum.DATE_RANGE_ORDERS,
                // CriterionTypeEnum.EXACT,
                // CriterionTypeEnum.ORDERS_SEARCH,
                CriterionTypeEnum.STATUS,
                CriterionTypeEnum.PROJECT_CURRENCY,
                CriterionTypeEnum.DATE_RANGE,
                CriterionTypeEnum.PROCESSOR_LOG_ENTRY_TYPE
            ]}
            config={{
                // hideShowFiltersButton: true,
                // hideTemplatesSelect: true,
            }}
            searchData={(searchParams) => {
                console.log(JSON.stringify({
                    searchLabel: searchParams.exactSearchLabel,
                    searchString: searchParams.exactSearchValue,
                    orderDateType: searchParams.orderDateType,
                    processorLogEntryType: searchParams.processorLogEntryType
                }, null, 4))
                return Service.getList(searchParams)
            }}
            dataUseState={[data, setData]}
            initialSearchConditions={{
                transactionTypes: {all: true, entities: []},
                status: 'ENABLED',
            }}
            createTableHeader={(headerParams) =>
                <PneTableRow>
                    <PneHeaderTableCell>{'header1'}</PneHeaderTableCell>
                    <PneHeaderTableCell>{'header2'}</PneHeaderTableCell>
                </PneTableRow>
            }
            createTableRow={(item) =>
                <PneTableRow key={item.id}>
                    <PneTableCell>{item.id}</PneTableCell>
                    <PneTableCell>{item.displayName}</PneTableCell>
                </PneTableRow>
            }
        />
    </SearchUIProvider>
}

export default {
    title: "pne-ui/SearchUI",
    component: HookWrap,
} as Meta<typeof HookWrap>

type Story = StoryObj<typeof HookWrap>

export const Default: Story = {
    args: {}
}
