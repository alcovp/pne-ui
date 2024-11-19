import React from "react";
import Box from "@mui/material/Box";
import {Icon, IconButton} from "@mui/material";
import {PaginatorProps} from "./AbstractTable";
import PneFirstPageIcon from "./PneFirstPageIcon";
import PnePreviousPageIcon from "./PnePreviousPageIcon";
import PneNextPageIcon from "./PneNextPageIcon";
import {AutoTestAttribute} from "../AutoTestAttribute";

interface IPaginationActionsProps {
    count: number
    page: number
    rowsPerPage: number
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement>,
        newPage: number
    ) => void
    paginator: PaginatorProps
}

const PneTablePaginationActions = (props: IPaginationActionsProps) => {
    const {
        // count,
        page,
        rowsPerPage,
        onPageChange,
        paginator
    } = props;

    const {
        hasNext,
        disableActions,
        rowsPerPageOptions,
        onPageSizeChange,
        displayedRowsLabel,
        activeActionSx = {},
    } = paginator;

    const buttonStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: '#809EAE',
        '&:hover': {
            background: '#F1F5FA',
            ...activeActionSx
        },
    }

    const selectedButtonStyle = {
        ...buttonStyle,
        background: '#fff',
        ...activeActionSx
    }

    const displayedRowsStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 8px',
        width: 'auto',
        minWidth: '15px',
        height: '40px',
        borderRadius: '4px',
        background: '#F1F5FA',
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: '#809EAE',
        ...activeActionSx
    }

    const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page + 1);
    };

    // const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    //     onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    // };

    const handleChangePageSizeButtonClick = (size: number) => {
        onPageSizeChange(size);
    };

    const populateRowsPerPageOptions = () => {
        return rowsPerPageOptions.map((option, index) => {
            let size: number;
            let label: string;
            if (typeof option === 'number') {
                size = option;
                label = option.toString();
            } else {
                // size = option.value;
                // label = option.label;
                throw new Error('Uncomment RowsPerPageOption type to do like this');
            }
            const selected = rowsPerPage === size;
            return <AutoTestAttribute id={'page-size'} value={label} key={label}>
                <IconButton
                    sx={selected ? selectedButtonStyle : buttonStyle}
                    onClick={() => handleChangePageSizeButtonClick(size)}
                >
                    {label}
                </IconButton>
            </AutoTestAttribute>
        })
    }

    return <Box
        sx={{
            display: 'flex',
            width: '100%',
        }}
    >
        <AutoTestAttribute id={'first-page'}>
            <IconButton
                sx={buttonStyle}
                onClick={handleFirstPageButtonClick}
                disabled={disableActions || page === 0}
                aria-label="first page"
            >
                <PneFirstPageIcon disabled={disableActions || page === 0}/>
            </IconButton>
        </AutoTestAttribute>
        <AutoTestAttribute id={'prev-page'}>
            <IconButton
                sx={buttonStyle}
                onClick={handleBackButtonClick}
                disabled={disableActions || page === 0}
                aria-label="previous page"
            >
                <PnePreviousPageIcon disabled={disableActions || page === 0}/>
            </IconButton>
        </AutoTestAttribute>
        <AutoTestAttribute id={'current-page'}>
            <Icon sx={displayedRowsStyle}>{displayedRowsLabel}</Icon>
        </AutoTestAttribute>
        <AutoTestAttribute id={'next-page'}>
            <IconButton
                sx={buttonStyle}
                onClick={handleNextButtonClick}
                disabled={disableActions || !hasNext}
                aria-label="next page"
            >
                <PneNextPageIcon disabled={disableActions || !hasNext}/>
            </IconButton>
        </AutoTestAttribute>
        <AutoTestAttribute id={'page-sizes'} value={rowsPerPage}>
            <Box
                sx={{
                    marginLeft: 'auto',
                    order: 2,
                }}
            >
                {populateRowsPerPageOptions()}
            </Box>
        </AutoTestAttribute>
    </Box>
}

export default PneTablePaginationActions;
