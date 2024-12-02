
export type PneTableStore = PneTableState & PneTableActions

export type PneTableState = {
    needToScrollToPagination: boolean
}

export type PneTableActions = {
    setNeedToScrollToPagination: (needToScrollToPagination: boolean) => void
}
