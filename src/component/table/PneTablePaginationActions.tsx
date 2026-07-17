import React from "react";
import Box from "@mui/material/Box";
import {Icon, IconButton} from "@mui/material";
import {PaginatorProps} from "./AbstractTable";
import PneFirstPageIcon from "./PneFirstPageIcon";
import PnePreviousPageIcon from "./PnePreviousPageIcon";
import PneNextPageIcon from "./PneNextPageIcon";
import {createAutoTestAttributes} from "../AutoTestAttribute";
import {
    TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
    TABLE_CONTROL_TEXT_COLOR,
} from "./tableControlColors";
// import {usePneTheme} from "../../usePneTheme";

interface IPaginationActionsProps {
    count: number
    page: number
    rowsPerPage: number
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number
    ) => void
    paginator: PaginatorProps
    shouldRequestScroll: boolean
    toolbar?: React.ReactNode
}

const PneTablePaginationActions = (props: IPaginationActionsProps) => {
    const {
        // count,
        page,
        rowsPerPage,
        onPageChange,
        paginator,
        shouldRequestScroll,
        toolbar,
    } = props;

    const {
        hasNext,
        disableActions,
        rowsPerPageOptions,
        onPageSizeChange,
        displayedRowsLabel,
        requestScrollToPagination,
        activeActionSx = {},
    } = paginator;

    // const theme = usePneTheme()

    const buttonStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: TABLE_CONTROL_TEXT_COLOR,
        '&:hover': {
            background: TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
            ...activeActionSx
        },
    }

    const selectedButtonStyle = {
        ...buttonStyle,
        background: TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
        ...activeActionSx
    }

    const displayedRowsStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 8px',
        width: 'auto',
        maxWidth: '120px',
        minWidth: '15px',
        height: '40px',
        overflow: 'hidden',
        borderRadius: '4px',
        background: TABLE_CONTROL_ACTIVE_BACKGROUND_COLOR,
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '16px',
        //TODO тут цвет из темы - основной
        color: TABLE_CONTROL_TEXT_COLOR,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...activeActionSx
    }

    const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (shouldRequestScroll) {
            requestScrollToPagination?.()
        }
        onPageChange(event, page + 1);
    };

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
            return <IconButton
                key={label}
                sx={selected ? selectedButtonStyle : buttonStyle}
                onClick={() => handleChangePageSizeButtonClick(size)}
                {...createAutoTestAttributes('page-size', label)}
            >
                {label}
            </IconButton>
        })
    }

    const hasToolbar = toolbar !== undefined
        && toolbar !== null
        && typeof toolbar !== 'boolean'

    return <Box
        sx={{
            alignItems: 'center',
            columnGap: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            rowGap: '8px',
            width: '100%',
        }}
    >
        <Box sx={{display: 'flex', flexShrink: 0}}>
            <IconButton
                sx={buttonStyle}
                onClick={handleFirstPageButtonClick}
                disabled={disableActions || page === 0}
                aria-label="first page"
                {...createAutoTestAttributes('first-page')}
            >
                <PneFirstPageIcon disabled={disableActions || page === 0}/>
            </IconButton>
            <IconButton
                sx={buttonStyle}
                onClick={handleBackButtonClick}
                disabled={disableActions || page === 0}
                aria-label="previous page"
                {...createAutoTestAttributes('prev-page')}
            >
                <PnePreviousPageIcon disabled={disableActions || page === 0}/>
            </IconButton>
            <Icon
                sx={displayedRowsStyle}
                {...createAutoTestAttributes('current-page')}
            >
                {displayedRowsLabel}
            </Icon>
            <IconButton
                sx={buttonStyle}
                onClick={handleNextButtonClick}
                disabled={disableActions || !hasNext}
                aria-label="next page"
                {...createAutoTestAttributes('next-page')}
            >
                <PneNextPageIcon disabled={disableActions || !hasNext}/>
            </IconButton>
        </Box>
        <Box
            sx={{
                alignItems: 'center',
                display: 'flex',
                flex: '0 1 auto',
                flexWrap: 'wrap',
                gap: hasToolbar ? '8px' : 0,
                justifyContent: 'flex-end',
                marginLeft: 'auto',
                maxWidth: '100%',
                minWidth: 0,
            }}
        >
            {hasToolbar ? toolbar : null}
            <Box
                sx={{display: 'flex', flexShrink: 0}}
                {...createAutoTestAttributes('page-sizes', rowsPerPage)}
            >
                {populateRowsPerPageOptions()}
            </Box>
        </Box>
    </Box>
}

export default PneTablePaginationActions;
