import * as React from 'react'
import {Box, Table, TableBody, TableHead, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneHeaderTableCell, PneTableCell, PneTableRow, PneTableSortLabel} from '../../index'
import type {TableSortOptions} from '../../component/table/AbstractTable'

export default {
    title: 'pne-ui 5/PneTable',
    parameters: {controls: {disable: true}},
} as Meta

type Story = StoryObj

const ROWS = [
    {id: 9232734, date: 'Dec 09 10:16:50', merchant: 'Contoso', amount: '767.50 USD', status: 'In progress'},
    {id: 9232735, date: 'Dec 09 10:17:12', merchant: 'Fabrikam', amount: '12.00 EUR', status: 'Approved'},
    {id: 9232736, date: 'Dec 09 10:18:01', merchant: 'Northwind', amount: '1 204.99 GBP', status: 'Declined'},
    {id: 9232737, date: 'Dec 09 10:19:44', merchant: 'Tailspin', amount: '54.10 USD', status: 'Approved'},
] as const

const COLUMNS = ['Date', 'ID', 'Merchant', 'Amount', 'Status'] as const

// Figma «PneTable — части»: the frame of a table. Rows of 40px with a hairline under each but the
// last, 14/20 text, 12px at the sides of a cell, a 14/20 SemiBold header over a hairline, and the
// sort sign of the UI Kit: both arrows at all times, the direction in force in the link colour.
const FrameDemo = () => {
    const [sortIndex, setSortIndex] = React.useState(1)
    const [order, setOrder] = React.useState<'asc' | 'desc'>('asc')
    const sortOptions: TableSortOptions = {
        sortIndex,
        order,
        setSortIndex,
        setOrder,
        onSortChange: () => undefined,
    }

    return (
        <Box sx={{p: 3, maxWidth: 900}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', mb: 2}}>
                The frame of a table by the UI Kit. The second column is sorted; click a header to sort by it.
                The third row is picked. A row takes the hover fill under the pointer.
            </Typography>
            <Table>
                <TableHead>
                    <PneTableRow>
                        {COLUMNS.map((column, index) => (
                            <PneHeaderTableCell key={column} sortIndex={index} sortOptions={sortOptions}>
                                <PneTableSortLabel sortIndex={index} sortOptions={sortOptions}>{column}</PneTableSortLabel>
                            </PneHeaderTableCell>
                        ))}
                    </PneTableRow>
                </TableHead>
                <TableBody>
                    {ROWS.map((row, index) => (
                        <PneTableRow key={row.id}>
                            <PneTableCell selected={index === 2}>{row.date}</PneTableCell>
                            <PneTableCell selected={index === 2}>{row.id}</PneTableCell>
                            <PneTableCell selected={index === 2}>{row.merchant}</PneTableCell>
                            <PneTableCell selected={index === 2}>{row.amount}</PneTableCell>
                            <PneTableCell selected={index === 2}>{row.status}</PneTableCell>
                        </PneTableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    )
}

export const Frame: Story = {
    render: () => <FrameDemo/>,
}
