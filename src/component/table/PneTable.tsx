import React from 'react';
import AbstractTable, {TableProps} from "./AbstractTable";
import {SxProps} from "@mui/material";

const PneTable = <D, >(
    props: React.PropsWithChildren<TableProps<D>>
) => {
    const {
        stickyHeader = false,
        tableSx = {},
        boxSx = {},
        ...rest
    } = props;

    const _boxSx: SxProps = {
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 8px 0',
        ...boxSx
    }

    const _tableSx: SxProps = {
        ...tableSx
    }

    return (
        <AbstractTable
            boxSx={_boxSx}
            tableSx={_tableSx}
            stickyHeader={stickyHeader}
            {...rest}
        />
    );  
}

export default PneTable;
