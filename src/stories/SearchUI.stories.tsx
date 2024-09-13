import {AbstractEntity, PneHeaderTableCell, PneTableCell, PneTableRow} from "../index";
import React from "react";
import {SearchUI} from "../component/search-ui/SearchUI";
import {CriterionTypeEnum} from "../component/search-ui/filters/types";
import {Meta, StoryObj} from "@storybook/react";
import {SearchUIDefaults, SearchUIProvider} from "../component/search-ui/SearchUIProvider";

type DataType = AbstractEntity

const getList = async (page: number, pageSize: number, limit: number): Promise<DataType[]> => {
    const data: DataType[] = []
    for (let i = 1; i <= limit; i++) {
        data.push({id: i, displayName: 'John ' + i})
    }

    await new Promise(resolve => setTimeout(resolve, 400))

    return data.slice(page * pageSize, page * pageSize + pageSize + 1)
}

const HookWrap = () => {

    return <SearchUIProvider defaults={{}}>
        <SearchUI<DataType>
            settingsContextName={'context'}
            possibleCriteria={[
                CriterionTypeEnum.STATUS,
            ]}
            searchData={(searchParams) => getList(
                0,
                searchParams.rowCount,
                999
            )}
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
