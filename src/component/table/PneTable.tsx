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
        borderRadius: '12px',
        padding: '16px',
        background: '#F1F5FA',
        ...boxSx
    }

    const _tableSx: SxProps = {
        borderCollapse: 'separate',
        borderSpacing: '0 2px',
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
