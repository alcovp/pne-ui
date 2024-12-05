import {AbstractEntity, ExactCriterionSearchLabelEnum, PneHeaderTableCell, PneTableCell, PneTableRow} from "../index";
import React, {useState} from "react";
import {SearchUI} from "../component/search-ui/SearchUI";
import {CriterionTypeEnum} from "../component/search-ui/filters/types";
import {Meta, StoryObj} from "@storybook/react";
import {SearchUIProvider} from "../component/search-ui/SearchUIProvider";

type DataType = AbstractEntity

const getList = async (page: number, pageSize: number, limit: number): Promise<DataType[]> => {
    console.log('getList call')
    const data: DataType[] = []
    for (let i = 1; i <= limit; i++) {
        data.push({id: i, displayName: 'John ' + i})
    }

    await new Promise(resolve => setTimeout(resolve, 400))

    return data.slice(page * pageSize, page * pageSize + pageSize + 1)
}

const HookWrap = () => {

    const [data, setData] = useState<DataType[]>([])

    return <SearchUIProvider
        defaults={{
            getDefaultCurrency: (): AbstractEntity => ({
                id: 99,
                displayName: 'BBB',
            }),
            getMatchLinkedItems: async () => [
                {id: 1, displayName: 'name1'},
                {id: 2, displayName: 'name2'},
                {id: 3, displayName: 'name3'},
            ],
            showGatesCriterion: () => true,
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
                CriterionTypeEnum.EXACT,
                CriterionTypeEnum.STATUS,
                CriterionTypeEnum.GATE,
                CriterionTypeEnum.GROUPING,
                CriterionTypeEnum.PROJECT_CURRENCY,
            ]}
            predefinedCriteria={[
                CriterionTypeEnum.EXACT,
                CriterionTypeEnum.STATUS,
            ]}
            searchData={(searchParams) => {
                console.dir(searchParams.exactSearchValue)
                return getList(
                    0,
                    searchParams.rowCount,
                    999
                )
            }}
            dataUseState={[data, setData]}
            initialSearchConditions={{
                transactionTypes: {all: true, list: []},
                status: 'ENABLED',
            }}
            createTableHeader={(headerParams) =>
                <PneTableRow>
                    <PneHeaderTableCell>{'header1'}</PneHeaderTableCell>
                    <PneHeaderTableCell>{'header2'}</PneHeaderTableCell>
                </PneTableRow>
            }
            createTableRow={(item) =>
                <PneTableRow>
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
