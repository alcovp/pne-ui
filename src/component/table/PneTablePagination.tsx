import {styled} from '@mui/system';
import {TablePagination} from "@mui/material";
import {TABLE_CONTROL_SIZE} from "./tableControlMetrics";

const PneTablePagination = styled(TablePagination)`
    border: none;
    & .MuiToolbar-root {
        padding: 0;
        align-items: flex-end;
    }
    & .MuiTablePagination-spacer {
        display: none;
    }
    & .MuiTablePagination-selectLabel {
        display: none;
    }
    & .MuiTablePagination-displayedRows {
        display: none;
    }
    & .MuiInputBase-root {
        display: none;
    }
    & .MuiToolbar-root.MuiTablePagination-toolbar {
        margin-top: 6px;
        margin-bottom: 6px;
        min-height: ${TABLE_CONTROL_SIZE}px;
    }
`;

export default PneTablePagination;
