import {AbstractEntity, PneAsyncAutocomplete, PneButton, PneCheckbox, PneSwitch, PneTable} from "../index";
import {Meta, StoryObj} from "@storybook/react-webpack5";
import PneTableRow from "../component/table/PneTableRow";
import PneTableCell from "../component/table/PneTableCell";
import PneTableControlCell from "../component/table/PneTableControlCell";
import React, {useState} from "react";
import PneHeaderTableCell from "../component/table/PneHeaderTableCell";
import useTable from "../component/table/useTable";
import {Box} from "@mui/material";

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
    const [customData, setCustomData] = useState<DataType[]>([])
    const [checkedById, setCheckedById] = useState<Record<number, boolean>>({})
    const [onById, setOnById] = useState<Record<number, boolean>>({})

    const {
        loading,
        paginator,
        data,
        page,
        pageSize,
    } = useTable<DataType>({
        settingsContextName: 'context_1',
        dataUseState: [customData, setCustomData],
        duplicatePagination: true,
        fetchData: ({page, pageSize}) => getList(page, pageSize, 51),
    })

    // useSimpleFetch(() => getList(page, pageSize))

    // useEffect(() => {
    //     const list = getList(page, pageSize)
    //
    //     setData(list.slice(0, pageSize));
    //     setHasNext(list.length === pageSize + 1);
    // }, [page, pageSize])

    return <Box sx={{background: '#FFFFFF'}}>
        <PneAsyncAutocomplete
            searchChoices={() => {
                return getList(1, 10, 10)
            }}
        />
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
                    <PneTableControlCell onClick={(event) => event.stopPropagation()}>
                        <PneCheckbox
                            checked={checkedById[rowData.id] ?? false}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setCheckedById((prevState) => ({
                                ...prevState,
                                [rowData.id]: event.target.checked,
                            }))}
                        />
                    </PneTableControlCell>
                    <PneTableControlCell onClick={(event) => event.stopPropagation()}>
                        <PneButton
                            size="small"
                            onClick={(event) => {
                                event.stopPropagation()
                                alert('Control clicked: ' + rowData.id)
                            }}
                        >
                            {'Control'}
                        </PneButton>
                    </PneTableControlCell>
                    <PneTableControlCell onClick={(event) => event.stopPropagation()}>
                        <PneSwitch
                            checked={onById[rowData.id] ?? false}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setOnById((prevState) => ({
                                ...prevState,
                                [rowData.id]: event.target.checked,
                            }))}
                        />
                    </PneTableControlCell>
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
                <PneHeaderTableCell>{'Check'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'Control'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'On/Off'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'Name'}</PneHeaderTableCell>
            </PneTableRow>}
            paginator={paginator}
            loading={loading}
        />
    </Box>
}

const getListSlow = async (page: number, pageSize: number, limit: number): Promise<DataType[]> => {
    const data: DataType[] = []
    for (let i = 1; i <= limit; i++) {
        data.push({id: i, displayName: 'John ' + i})
    }

    await new Promise(resolve => setTimeout(resolve, 3000))

    return data.slice(page * pageSize, page * pageSize + pageSize + 1)
}

const SlowLoadingWrap = () => {
    const [customData, setCustomData] = useState<DataType[]>([])

    const {
        loading,
        paginator,
        data,
    } = useTable<DataType>({
        settingsContextName: 'context_slow',
        dataUseState: [customData, setCustomData],
        duplicatePagination: true,
        fetchData: ({page, pageSize}) => getListSlow(page, pageSize, 51),
    })

    return <Box sx={{background: '#FFFFFF'}}>
        <PneTable
            data={data}
            createRow={(rowData: DataType) =>
                <PneTableRow key={rowData.id}>
                    <PneTableCell>{rowData.id}</PneTableCell>
                    <PneTableCell>{rowData.displayName}</PneTableCell>
                </PneTableRow>}
            createTableHeader={() => <PneTableRow>
                <PneHeaderTableCell>{'ID'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'Name'}</PneHeaderTableCell>
            </PneTableRow>}
            paginator={paginator}
            loading={loading}
        />
    </Box>
}

export default {
    title: "pne-ui/PneTable",
    component: HookWrap,
} as Meta<typeof HookWrap>;

type Story = StoryObj<typeof HookWrap>;

export const Default: Story = {
    args: {}
};

export const SlowLoading: StoryObj<typeof SlowLoadingWrap> = {
    render: () => <SlowLoadingWrap />,
};

const SlowLoadingWithControlsWrap = () => {
    const [customData, setCustomData] = useState<DataType[]>([])
    const [checkedById, setCheckedById] = useState<Record<number, boolean>>({})

    const {
        loading,
        paginator,
        data,
    } = useTable<DataType>({
        settingsContextName: 'context_slow_controls',
        dataUseState: [customData, setCustomData],
        duplicatePagination: true,
        fetchData: ({page, pageSize}) => getListSlow(page, pageSize, 51),
    })

    return <Box sx={{background: '#FFFFFF'}}>
        <PneTable
            data={data}
            createRow={(rowData: DataType) =>
                <PneTableRow key={rowData.id}>
                    <PneTableCell>{rowData.id}</PneTableCell>
                    <PneTableControlCell>
                        <PneCheckbox
                            checked={checkedById[rowData.id] ?? false}
                            onChange={(event) => setCheckedById((prevState) => ({
                                ...prevState,
                                [rowData.id]: event.target.checked,
                            }))}
                        />
                    </PneTableControlCell>
                    <PneTableControlCell>
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: '4px', py: '4px'}}>
                            <PneButton size="small">{'Edit'}</PneButton>
                            <PneButton size="small" color="error">{'Delete'}</PneButton>
                        </Box>
                    </PneTableControlCell>
                    <PneTableCell>
                        <div>{rowData.displayName}</div>
                        <div style={{fontSize: '11px', color: '#8A94A6'}}>{'user-' + rowData.id + '@example.com'}</div>
                    </PneTableCell>
                </PneTableRow>}
            createTableHeader={() => <PneTableRow>
                <PneHeaderTableCell>{'ID'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'Check'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'Actions'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'Name'}</PneHeaderTableCell>
            </PneTableRow>}
            paginator={paginator}
            loading={loading}
        />
    </Box>
}

export const SlowLoadingWithControls: StoryObj<typeof SlowLoadingWithControlsWrap> = {
    render: () => <SlowLoadingWithControlsWrap />,
};

const getListFast = async (page: number, pageSize: number, limit: number): Promise<DataType[]> => {
    const data: DataType[] = []
    for (let i = 1; i <= limit; i++) {
        data.push({id: i, displayName: 'John ' + i})
    }

    await new Promise(resolve => setTimeout(resolve, 50))

    return data.slice(page * pageSize, page * pageSize + pageSize + 1)
}

const FastLoadingWrap = () => {
    const [customData, setCustomData] = useState<DataType[]>([])

    const {
        loading,
        paginator,
        data,
    } = useTable<DataType>({
        settingsContextName: 'context_fast',
        dataUseState: [customData, setCustomData],
        duplicatePagination: true,
        fetchData: ({page, pageSize}) => getListFast(page, pageSize, 51),
    })

    return <Box sx={{background: '#FFFFFF'}}>
        <PneTable
            data={data}
            createRow={(rowData: DataType) =>
                <PneTableRow key={rowData.id}>
                    <PneTableCell>{rowData.id}</PneTableCell>
                    <PneTableCell>{rowData.displayName}</PneTableCell>
                </PneTableRow>}
            createTableHeader={() => <PneTableRow>
                <PneHeaderTableCell>{'ID'}</PneHeaderTableCell>
                <PneHeaderTableCell>{'Name'}</PneHeaderTableCell>
            </PneTableRow>}
            paginator={paginator}
            loading={loading}
        />
    </Box>
}

export const FastLoading: StoryObj<typeof FastLoadingWrap> = {
    render: () => <FastLoadingWrap />,
};
