import {styled} from '@mui/material/styles';
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
`;

export default PneTablePagination;
