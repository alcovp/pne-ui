import * as React from 'react'
import {Table, TableHead, TableRow} from '@mui/material'
import {render, screen} from '@testing-library/react'

import {PneHeaderTableCell, PneThemeProvider, type Skin} from '../src'

const UI_KIT_SKIN = {experimentalColor: '#026fd7'} as Skin

describe('PneHeaderTableCell in a sticky header', () => {
    it('stands on the surface as every header does, not on the grey page background MUI gives it', () => {
        render(
            <PneThemeProvider skin={UI_KIT_SKIN}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <PneHeaderTableCell>Name</PneHeaderTableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </PneThemeProvider>,
        )
        const cell = screen.getByRole('columnheader', {name: 'Name'})

        expect(cell.classList.contains('MuiTableCell-stickyHeader')).toBe(true)
        expect(window.getComputedStyle(cell).backgroundColor).toBe('rgb(255, 255, 255)')
    })
})
