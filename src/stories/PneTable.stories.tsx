import {PneButton, PneTable} from "../index";
import {Meta, StoryObj} from "@storybook/react";
import PneTableRow from "../component/table/PneTableRow";
import PneTableCell from "../component/table/PneTableCell";
import React, {useState} from "react";
import PneHeaderTableCell from "../component/table/PneHeaderTableCell";
import useTable from "../component/table/useTable";

type DataType = {
    id: number
    displayName: string
}

const getList = async (page: number, pageSize: number, limit: number): Promise<DataType[]> => {
    const data: DataType[] = []
    for (let i = 1; i <= limit; i++) {
        data.push({id: i, displayName: 'John ' + i})
    }

    await new Promise(resolve => setTimeout(resolve, 400))

    return data.slice(page * pageSize, page * pageSize + pageSize + 1)
}

const HookWrap = () => {
    const [customData, setCustomData] = useState<DataType[]>([])

    const {
        paginator,
        data,
        page,
        pageSize,
    } = useTable<DataType>({
        settingsContextName: 'context_1',
        dataUseState: [customData, setCustomData],
        fetchData: ({page, pageSize}) => getList(page, pageSize, 51),
    })

    // useSimpleFetch(() => getList(page, pageSize))

    // useEffect(() => {
    //     const list = getList(page, pageSize)
    //
    //     setData(list.slice(0, pageSize));
    //     setHasNext(list.length === pageSize + 1);
    // }, [page, pageSize])

    return <>
        <PneButton onClick={() => setCustomData([...customData, {id: 999, displayName: 'NEW'}])}>
            Create
        </PneButton>
        <PneButton
            onClick={async () => {
                const list = await getList(page, pageSize, 6)
                setCustomData(list)
            }}
        >
            Reduce array
        </PneButton>
        <PneTable
            data={data}
            createRow={(rowData: DataType, index: number, arr: DataType[]) =>
                <PneTableRow onClick={() => alert('Row clicked: ' + index)} key={rowData.id}>
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
    </>
}

export default {
    title: "pne-ui/PneTable",
    component: HookWrap,
} as Meta<typeof HookWrap>;

type Story = StoryObj<typeof HookWrap>;

export const Default: Story = {
    args: {}
};
