import {PneTable} from "../index";
import {Meta, StoryObj} from "@storybook/react";
import PneTableRow from "../component/table/PneTableRow";
import PneTableCell from "../component/table/PneTableCell";
import React, {useEffect} from "react";
import PneHeaderTableCell from "../component/table/PneHeaderTableCell";
import useTable from "../component/table/useTable";

type DataType = {
    id: number
    displayName: string
}

const getList = (page: number, pageSize: number): DataType[] => {
    const data: DataType[] = []
    for (let i = 1; i <= 100; i++) {
        data.push({id: i, displayName: 'John ' + i})
    }

    return data.slice(page * pageSize, page * pageSize + pageSize + 1)
}

const HookWrap = () => {
    const {
        page,
        pageSize,
        setHasNext,
        paginator,
        data,
        setData,
    } = useTable<DataType>()

    useEffect(() => {
        const list = getList(page, pageSize)

        setData(list.slice(0, pageSize));
        setHasNext(list.length === pageSize + 1);
    }, [page, pageSize])

    return <PneTable
        data={data}
        createRow={(rowData: DataType, index: number, arr: DataType[]) =>
            <PneTableRow onClick={() => alert('Row clicked: ' + index)}>
                <PneTableCell
                    onClick={(event) => {
                        event.stopPropagation()
                        alert('ID clicked: ' + rowData.id)
                    }}
                >
                    {rowData.id}
                </PneTableCell>
                <PneTableCell
                    onClick={(event) => {
                        event.stopPropagation()
                        alert('Name clicked: ' + rowData.displayName)
                    }}
                >
                    {rowData.displayName}
                </PneTableCell>
            </PneTableRow>}
        createTableHeader={() => <PneTableRow>
            <PneHeaderTableCell>{'ID'}</PneHeaderTableCell>
            <PneHeaderTableCell>{'Name'}</PneHeaderTableCell>
        </PneTableRow>}
        paginator={paginator}
    />
}

export default {
    title: "pne-ui/PneTable",
    component: HookWrap,
} as Meta<typeof HookWrap>;

type Story = StoryObj<typeof HookWrap>;

export const Default: Story = {
    args: {}
};
