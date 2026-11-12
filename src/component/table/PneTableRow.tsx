import {TableRow} from '@mui/material';
// The styled of MUI Material, not of MUI System: without a ThemeProvider it falls back to the Material
// theme, whose palette the colours of the row are built from.
import {styled} from '@mui/material/styles';
import {resolvePneSemanticPalette} from '../../createTheme';

/**
 * UI Kit Table row: a hairline under each row but the last one, and the hover fill under the pointer
 * (`hover={false}` switches it off). The cells carry the line, so a row keeps its height whatever
 * stands in it.
 */
const PneTableRow = styled(TableRow, {
    shouldForwardProp: prop => prop !== 'hover'
})<{ hover?: boolean }>(({theme, hover = true}) => {
    const table = resolvePneSemanticPalette(theme).table
    const paper = theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff'
    return {
        borderColor: 'transparent',
        borderBottomColor: table.line,
        fontSize: '14px',
        lineHeight: '20px',
        // The table drops the line of its last row.
        'tbody > &:last-of-type': {
            borderBottomColor: 'transparent',
        },
        ...(hover ? {
            'tbody > &:hover': {
                backgroundColor: table.row.hover,
            },
        } : {}),
        // A picked row keeps its fill under the pointer too (UI Kit: Brand/100).
        '&&.Mui-selected, tbody > &&.Mui-selected:hover': {
            backgroundColor: table.row.selected,
        },
        '& td': {
            borderTop: `1px solid ${paper}`,
            borderBottom: `1px solid ${paper}`,
            borderColor: 'inherit',
        },
        // No borders at the sides of a row: even an invisible one takes half a pixel of the first and
        // of the last column, so a 36px selection cell came out 36.5px wide.
    }
})

export default PneTableRow;
