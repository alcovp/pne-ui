import React, {ReactNode, useRef} from "react";
import {createIsolatedMultigetSelectStore, MultigetSelectStoreContext} from "./store";

type Props = {
    children: ReactNode
}

export const MultigetSelectStoreProvider = ({children}: Props) => {
    const store = useRef(createIsolatedMultigetSelectStore()).current

    return <MultigetSelectStoreContext value={store}>{children}</MultigetSelectStoreContext>
}