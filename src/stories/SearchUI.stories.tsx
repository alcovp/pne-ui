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
