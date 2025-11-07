import {styled} from '@mui/system';
import {TablePagination} from "@mui/material";

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
        min-height: 40px;
    }
`;

export default PneTablePagination;
