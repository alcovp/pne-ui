import {Dispatch, SetStateAction, useEffect, useRef, useState} from 'react';
import {PaginatorProps, RowsPerPageOption} from './AbstractTable';
import {SxProps} from '@mui/material';
import {ensure, Order} from "../../common/pne/type";
import {TableDisplayOptions} from "./type";
import {usePneTableStore} from "./state/store";

const PAGE_SIZE_SETTING_NAME = 'page_size'
const PAGE_NUMBER_SETTING_NAME = 'page_number'
const SORT_INDEX_SETTING_NAME = 'sort_index'
const SORT_ORDER_ASC_SETTING_NAME = 'sort_asc'

type FetchDataArgs = {
    page: number,
    pageSize: number,
    order: Order,
    sortIndex: number,
    extraDeps?: unknown[]
}

export type UseTableParams<D> = {
    displayOptions?: Partial<TableDisplayOptions>
    onDisplayOptionsChange?: (options: TableDisplayOptions) => void
    paginatorActiveActionSx?: SxProps
    duplicatePagination?: boolean
    rowsPerPageOptions?: RowsPerPageOption[]
    settingsContextName?: string
    dataUseState?: [D[], Dispatch<SetStateAction<D[]>>]
    fetchData?: (args: FetchDataArgs) => Promise<D[]>,
    fetchDataExtraDeps?: unknown[]
}

interface IUseTableResult<D> {
    page: number
    pageSize: number
    setHasNext: Dispatch<SetStateAction<boolean>>
    paginator: PaginatorProps
    data: D[]
    setData: Dispatch<SetStateAction<D[]>>
    setSortIndex: Dispatch<SetStateAction<number>>
    sortIndex: number
    setOrder: Dispatch<SetStateAction<Order>>
    order: Order
    onSortChange: (sortIndex: number, sortOrder: Order) => void
    useSimpleFetch: (dataGetter: () => Promise<D[]>) => void
}

const useTable = <D, >(params: UseTableParams<D> = {}): IUseTableResult<D> => {
    const {
        displayOptions,
        onDisplayOptionsChange,
        paginatorActiveActionSx = {},
        rowsPerPageOptions = [10, 25, 50/*, {label: '∞', value: -1}*/],
        settingsContextName,
        dataUseState,
        fetchData,
        fetchDataExtraDeps,
        duplicatePagination,
    } = params;

    const {
        needToScrollToPagination,
        setNeedToScrollToPagination,
    } = usePneTableStore((store) => ({
        needToScrollToPagination: store.needToScrollToPagination,
        setNeedToScrollToPagination: store.setNeedToScrollToPagination,
    }))

    // const [initialDisplayOptions, setInitialDisplayOptions] = useState<TableDisplayOptions>({
    //     pageSize: 10,
    //     sortColumnIndex: 1,
    //     sortAsc: true
    // })
    let initialPageSize = displayOptions?.pageSize || rowsPerPageOptions[0]
    let initialSortIndex = displayOptions?.sortColumnIndex || 1
    let initialSortOrder: Order = 'asc'
    if (typeof displayOptions?.sortAsc !== 'undefined') {
        initialSortOrder = displayOptions.sortAsc ? 'asc' : 'desc'
    }
    let initialPageNumber = 0

    if (settingsContextName) {
        if (sessionStorage.hasOwnProperty(settingsContextName + PAGE_SIZE_SETTING_NAME)) {
            initialPageSize = +ensure(
                sessionStorage.getItem(settingsContextName + PAGE_SIZE_SETTING_NAME)
            )
        }
        if (sessionStorage.hasOwnProperty(settingsContextName + PAGE_NUMBER_SETTING_NAME)) {
            initialPageNumber = +ensure(
                sessionStorage.getItem(settingsContextName + PAGE_NUMBER_SETTING_NAME)
            )
        }
        if (sessionStorage.hasOwnProperty(settingsContextName + SORT_INDEX_SETTING_NAME)) {
            initialSortIndex = +ensure(
                sessionStorage.getItem(settingsContextName + SORT_INDEX_SETTING_NAME)
            )
        }
        if (sessionStorage.hasOwnProperty(settingsContextName + SORT_ORDER_ASC_SETTING_NAME)) {
            initialSortOrder = ensure(
                sessionStorage.getItem(settingsContextName + SORT_ORDER_ASC_SETTING_NAME)
            ) as Order
        }
    }

    const [pageNumber, setPageNumber] = useState(initialPageNumber)
    const [pageSize, setPageSize] = useState(initialPageSize)
    const [hasNext, setHasNext] = useState(false)
    const [disableActions, setDisableActions] = useState(false)
    const [data, setData] = useState<D[]>([])
    const [sortIndex, setSortIndex] = useState<number>(initialSortIndex)
    const [order, setOrder] = useState<Order>(initialSortOrder)

    const getData = (): D[] => {
        return dataUseState ? dataUseState[0] : data
    }

    const getSetData = (): Dispatch<SetStateAction<D[]>> => {
        return dataUseState ? dataUseState[1] : setData
    }

    useEffect(() => {
        setPageSize(initialPageSize)
    }, [initialPageSize])

    useEffect(() => {
        setPageNumber(initialPageNumber)
    }, [initialPageNumber])

    const isFirstRender = useIsFirstRender()
    useEffect(() => {
        if (!isFirstRender) {
            if (getData().length === 0 && pageNumber !== 0) {
                setPageNumber(0)
            }
        }
    }, [getData().length])

    const displayedRowsLabel = () => {
        if (getData().length === 0) {
            if (pageNumber === 0) {
                return 'Ø';
            } else {
                return (pageNumber * pageSize + 1) + ' - ' + (pageNumber * pageSize + pageSize)
            }
        }
        return (pageNumber * pageSize + 1) + ' - ' + (pageNumber * pageSize + getData().length)
    }

    const onSortChange = (sortIndex: number, sortOrder: Order) => {
        if (settingsContextName) {
            sessionStorage.setItem(settingsContextName + SORT_INDEX_SETTING_NAME, sortIndex.toString());
        }
        if (settingsContextName) {
            sessionStorage.setItem(settingsContextName + SORT_ORDER_ASC_SETTING_NAME, sortOrder);
        }
    }

    const wrapSetHasNext = (hasNext: SetStateAction<boolean>) => {
        setHasNext(hasNext)
        setDisableActions(false)
    }

    const paginationRef = useRef<HTMLDivElement | null>(null)
    const scrollToPagination = () => {
        if (needToScrollToPagination) {
            setTimeout(() => {
                if (paginationRef.current) {
                    paginationRef.current.scrollIntoView({behavior: "smooth", block: "end"})
                }
            }, 100)
            setNeedToScrollToPagination(false)
        }
    }

    const paginator: PaginatorProps = {
        rowsPerPageOptions: rowsPerPageOptions,
        rowsPerPage: pageSize,
        page: pageNumber,
        disableActions: disableActions,
        onPageChange: (event, newPage) => {
            setDisableActions(true)
            setPageNumber(newPage);
            if (settingsContextName) {
                sessionStorage.setItem(settingsContextName + PAGE_NUMBER_SETTING_NAME, newPage.toString());
            }
        },
        onPageSizeChange: (pageSize) => {
            //infinity case
            if (pageSize < 0) {
                setPageSize(999);
                sessionStorage.setItem(settingsContextName + PAGE_SIZE_SETTING_NAME, '999');
            } else {
                setPageSize(pageSize);
                sessionStorage.setItem(settingsContextName + PAGE_SIZE_SETTING_NAME, pageSize.toString());
            }
            setPageNumber(0);
            sessionStorage.setItem(settingsContextName + PAGE_NUMBER_SETTING_NAME, '0');
            if (onDisplayOptionsChange) {
                onDisplayOptionsChange({
                    pageSize: pageSize,
                    sortColumnIndex: sortIndex,
                    sortAsc: order === 'asc'
                });
            }
        },
        hasNext,
        displayedRowsLabel: displayedRowsLabel(),
        activeActionSx: paginatorActiveActionSx,
        duplicatePagination: duplicatePagination,
        paginationRef: paginationRef,
    };

    const afterDataFetch = (dataList: D[]) => {
        getSetData()(dataList.slice(0, pageSize))
        wrapSetHasNext(dataList.length === pageSize + 1)
        scrollToPagination()
    }

    const fetchDataDeps: unknown[] = [pageNumber, pageSize, order, sortIndex]
    if (fetchDataExtraDeps) {
        fetchDataDeps.push(...fetchDataExtraDeps)
    }

    const shouldSkipFetchDate = useRef(false)
    useEffect(() => {
        let mounted = true

        if (shouldSkipFetchDate.current) {
            shouldSkipFetchDate.current = false
            return
        }

        const asyncFetchData = async (args: FetchDataArgs) => {
            if (fetchData) {
                try {
                    let data = await fetchData(args)

                    /**
                     * Если получаем пустой массив, то проверим, первая ли это страница. Если нет, то, вероятно,
                     * с новыми параметрами поиска сервер отдает меньший массив данных, и нам нужно сбросить страницу
                     * на первую
                     * Это нужно только для того, чтобы не было промежуточного отображения 'no rows' между этими
                     * двумя запросами, в случае, когда первый раз получили пустой массив
                     */
                    if (data.length === 0 && args.page > 0) {
                        // пробуем получить первую страницу данных с новыми параметрами поиска
                        data = await fetchData({...args, page: 0})
                        // надо предотвратить следующую перерисовку из-за измененного pageNumber
                        if (mounted) {
                            shouldSkipFetchDate.current = true
                            setPageNumber(0)
                        }
                    }
                    if (mounted) {
                        afterDataFetch(data)
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        }

        asyncFetchData({
            page: pageNumber,
            pageSize,
            order,
            sortIndex,
            extraDeps: fetchDataExtraDeps,
        })

        return () => {
            mounted = false
        }
    }, fetchDataDeps)

    const useSimpleFetch = (getter: () => Promise<D[]>) => {
        if (fetchData) {
            throw new Error('useTable: Do not use useSimpleFetch hook and dataGetter param together! It makes no sense')
        }

        useEffect(() => {
            getter().then(afterDataFetch)
        }, fetchDataDeps)
    }

    return {
        page: pageNumber,
        pageSize,
        setHasNext: wrapSetHasNext,
        paginator,
        data: getData(),
        setData: getSetData(),
        sortIndex,
        setSortIndex,
        order,
        setOrder,
        onSortChange,
        useSimpleFetch,
    }
}

export default useTable

export const useIsFirstRender = () => {
    const isMountRef = useRef(true)

    useEffect(() => {
        isMountRef.current = false
    }, [])

    return isMountRef.current
}
