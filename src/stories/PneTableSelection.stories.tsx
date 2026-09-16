import React, {useRef, useState} from 'react'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {Alert, Box, IconButton, Stack, Tooltip, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    PneButton,
    PneHeaderTableCell,
    PneTable,
    PneTableCell,
    PneTableRow,
    PneTableSelectionCell,
    PneTableSelectionControls,
    PneTableSelectionHeaderCell,
    PneTableToolbar,
    PneTableViewSelector,
    TableSelectionModel,
    useTableSelection,
} from '../index'

type StoryRow = {
    id: number
    name: string
}

type StoryView = 'summary' | 'operations' | 'risk'

const storyRows: StoryRow[] = Array.from({length: 5}, (_, index) => ({
    id: index + 1,
    name: `Gate ${index + 1}`,
}))

type SelectionTableStoryProps = {
    initialSelection?: TableSelectionModel<number>
    matchingCount?: number
    maxSelected?: number
    showBulkActions?: boolean
    showLimitStatus?: boolean
    showViews?: boolean
}

const SelectionTableStory = ({
    initialSelection,
    matchingCount = 5,
    maxSelected = 20,
    showBulkActions = false,
    showLimitStatus = false,
    showViews = false,
}: SelectionTableStoryProps) => {
    const [view, setView] = useState<StoryView>('summary')
    const [limitVisible, setLimitVisible] = useState(showLimitStatus)
    const paginationRef = useRef<HTMLDivElement>(null)
    const selection = useTableSelection({
        rows: storyRows,
        getRowId: row => row.id,
        defaultSelection: initialSelection,
        maxSelected,
        scopeKey: `selection-story/${view}`,
    })

    const selectAllResults = () => {
        const update = selection.selectAllMatching(matchingCount)
        setLimitVisible(update.limitExceeded)
    }
    const clearSelection = () => {
        selection.clear()
        setLimitVisible(false)
    }
    const selectionControls = <PneTableSelectionControls
        actions={<>
            <PneButton
                onClick={selectAllResults}
                pneStyle='text'
                sx={{minHeight: '40px'}}
            >
                Select all results
            </PneButton>
            <PneButton
                disabled={selection.selectedCount === 0}
                onClick={clearSelection}
                pneStyle='text'
                sx={{minHeight: '40px'}}
            >
                Clear
            </PneButton>
            {showBulkActions ? <Box sx={{alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1}}>
                <Typography>Operations with selected rows</Typography>
                <PneButton pneStyle='outlined' sx={{minHeight: '40px'}}>
                    Actions
                </PneButton>
            </Box> : null}
        </>}
        summary={<Typography>{selection.selectedCount} rows selected</Typography>}
    />
    const selectionFeedback = limitVisible
        ? <Alert severity='warning'>
            <Typography>Selection is limited to {maxSelected} rows.</Typography>
            <Typography>Narrow the filters and try again before selecting all matching results.</Typography>
        </Alert>
        : undefined
    const viewSelector = showViews ? <PneTableViewSelector<StoryView>
        aria-label='Results view'
        actions={<Tooltip title='View settings'>
            <IconButton aria-label='View settings'>
                <SettingsOutlinedIcon sx={{height: '16px', width: '16px'}}/>
            </IconButton>
        </Tooltip>}
        onChange={setView}
        value={view}
        views={[
            {id: 'summary', label: 'Summary'},
            {id: 'operations', label: 'Operations'},
            {id: 'risk', label: 'Risk'},
        ]}
    /> : undefined

    return <Box
        data-story-section='pne-table-selection'
        sx={{backgroundColor: '#fff', boxSizing: 'border-box', p: 2, width: '100%'}}
    >
        <PneTable<StoryRow>
            autoTestId='selection-story'
            createRow={row => <PneTableRow
                aria-selected={selection.isRowSelected(row)}
                data-story-selection-row
                key={row.id}
                selected={selection.isRowSelected(row)}
            >
                <PneTableSelectionCell
                    aria-label={`Select ${row.name}`}
                    checked={selection.isRowSelected(row)}
                    disabled={selection.interactionDisabled || !selection.isRowSelectable(row)}
                    onChange={checked => selection.setRowSelected(row, checked)}
                />
                <PneTableCell>{row.id}</PneTableCell>
                <PneTableCell>{row.name}</PneTableCell>
            </PneTableRow>}
            createTableHeader={() => <PneTableRow data-story-selection-header-row>
                <PneTableSelectionHeaderCell
                    aria-label='Select current page'
                    disabled={selection.interactionDisabled || selection.pageSelectableCount === 0}
                    onChange={checked => selection.setPageSelected(checked)}
                    state={selection.pageState}
                />
                <PneHeaderTableCell>ID</PneHeaderTableCell>
                <PneHeaderTableCell>Name</PneHeaderTableCell>
            </PneTableRow>}
            data={storyRows}
            feedback={selectionFeedback}
            paginator={{
                rowsPerPageOptions: [5, 10, 25],
                rowsPerPage: 5,
                page: 0,
                onPageChange: () => undefined,
                onPageSizeChange: () => undefined,
                hasNext: true,
                disableActions: false,
                displayedRowsLabel: '1 - 5',
                paginationRef,
                duplicatePagination: true,
            }}
            tableAriaLabel='Selectable gates'
            toolbar={<PneTableToolbar
                aria-label='Table controls'
                contextual={selectionControls}
                persistent={viewSelector}
            />}
        />
    </Box>
}

const SubpixelSelectionLayoutStory = () => {
    const paginationRef = useRef<HTMLDivElement>(null)
    const selection = useTableSelection({
        rows: storyRows,
        getRowId: row => row.id,
    })
    const contextualWidth = selection.selectedCount === 0 ? 518.375 : 631.84375

    return <Box
        data-story-section='subpixel-selection-layout'
        sx={{
            backgroundColor: '#fff',
            boxSizing: 'border-box',
            maxWidth: 'calc(100vw - 32px)',
            p: 2,
            width: '1312px',
        }}
    >
        <PneTable<StoryRow>
            autoTestId='subpixel-selection-layout'
            createRow={row => <PneTableRow
                aria-selected={selection.isRowSelected(row)}
                key={row.id}
                selected={selection.isRowSelected(row)}
            >
                <PneTableSelectionCell
                    aria-label={`Select ${row.name}`}
                    checked={selection.isRowSelected(row)}
                    onChange={checked => selection.setRowSelected(row, checked)}
                />
                <PneTableCell>{row.id}</PneTableCell>
                <PneTableCell>{row.name}</PneTableCell>
            </PneTableRow>}
            createTableHeader={() => <PneTableRow data-story-selection-header-row>
                <PneTableSelectionHeaderCell
                    aria-label='Select current page for layout regression'
                    onChange={checked => selection.setPageSelected(checked)}
                    state={selection.pageState}
                />
                <PneHeaderTableCell>ID</PneHeaderTableCell>
                <PneHeaderTableCell>Name</PneHeaderTableCell>
            </PneTableRow>}
            data={storyRows}
            paginator={{
                rowsPerPageOptions: [5, 10, 25],
                rowsPerPage: 5,
                page: 0,
                onPageChange: () => undefined,
                onPageSizeChange: () => undefined,
                hasNext: false,
                disableActions: false,
                displayedRowsLabel: '1 - 5',
                paginationRef,
                duplicatePagination: true,
            }}
            tableAriaLabel='Subpixel selection layout regression'
            toolbar={<PneTableToolbar
                aria-label='Subpixel table controls'
                contextual={<Box
                    data-story-dynamic-selection-controls
                    sx={{
                        alignItems: 'center',
                        display: 'flex',
                        height: '40px',
                        justifyContent: 'flex-end',
                        width: `${contextualWidth}px`,
                    }}
                >
                    <Typography>{selection.selectedCount} rows selected</Typography>
                    {selection.selectedCount > 0 ? <PneButton
                        onClick={selection.clear}
                        pneStyle='text'
                    >
                        Unselect
                    </PneButton> : null}
                </Box>}
                persistent={<Box
                    data-story-persistent-view
                    sx={{
                        alignItems: 'center',
                        display: 'flex',
                        height: '40px',
                        justifyContent: 'flex-end',
                        width: '159.1875px',
                    }}
                >
                    Detailed view
                </Box>}
            />}
        />
    </Box>
}

/**
 * Mirrors the gates list: a wide selection band (summary, bulk actions and a nested
 * wrapping action group) beside a View selector, with four page sizes underneath.
 * Fractional CSS pixels used to drive those nested responsive bands into a
 * ResizeObserver loop, so the table header jumped continuously.
 */
const GatesLikeControlsStory = ({width}: {width?: number}) => {
    const [view, setView] = useState<StoryView>('summary')
    const paginationRef = useRef<HTMLDivElement>(null)
    const selection = useTableSelection({
        rows: storyRows,
        getRowId: row => row.id,
        defaultSelection: {mode: 'explicit', selectedIds: new Set([1, 3])},
    })

    return <Box
        data-story-section='gates-like-controls'
        sx={{
            backgroundColor: '#fff',
            boxSizing: 'border-box',
            maxWidth: '100%',
            p: 2,
            width: width === undefined ? '100%' : `${width}px`,
        }}
    >
        <PneTable<StoryRow>
            autoTestId='gates-like-controls'
            createRow={row => <PneTableRow key={row.id} selected={selection.isRowSelected(row)}>
                <PneTableSelectionCell
                    aria-label={`Select ${row.name}`}
                    checked={selection.isRowSelected(row)}
                    onChange={checked => selection.setRowSelected(row, checked)}
                />
                <PneTableCell>{row.id}</PneTableCell>
                <PneTableCell>{row.name}</PneTableCell>
            </PneTableRow>}
            createTableHeader={() => <PneTableRow>
                <PneTableSelectionHeaderCell
                    aria-label='Select current page'
                    onChange={checked => selection.setPageSelected(checked)}
                    state={selection.pageState}
                />
                <PneHeaderTableCell>Status</PneHeaderTableCell>
                <PneHeaderTableCell>Name</PneHeaderTableCell>
            </PneTableRow>}
            data={storyRows}
            paginator={{
                rowsPerPageOptions: [10, 25, 50, 100],
                rowsPerPage: 10,
                page: 0,
                onPageChange: () => undefined,
                onPageSizeChange: () => undefined,
                hasNext: true,
                disableActions: false,
                displayedRowsLabel: '1 - 10',
                paginationRef,
                duplicatePagination: true,
            }}
            tableAriaLabel='Gates'
            toolbar={<PneTableToolbar
                aria-label='Gates table controls'
                contextual={<PneTableSelectionControls
                    summary={<Typography>Selected gates: {selection.selectedCount}</Typography>}
                    actions={<>
                        <PneButton onClick={() => selection.selectAllMatching(120)} pneStyle='text'>
                            Select all
                        </PneButton>
                        {selection.selectedCount > 0 ? <PneButton
                            onClick={selection.clear}
                            pneStyle='text'
                        >
                            Unselect
                        </PneButton> : null}
                        <Stack
                            sx={{
                                alignItems: 'center',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 1,
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Box>Operations with selected gates</Box>
                            <PneButton pneStyle='outlined'>Actions</PneButton>
                        </Stack>
                    </>}
                />}
                persistent={<Box sx={{display: 'contents'}}>
                    <PneTableViewSelector<StoryView>
                        aria-label='Gates view'
                        actions={<Tooltip title='View settings'>
                            <IconButton aria-label='View settings'>
                                <SettingsOutlinedIcon sx={{height: '16px', width: '16px'}}/>
                            </IconButton>
                        </Tooltip>}
                        onChange={setView}
                        value={view}
                        views={[
                            {id: 'summary', label: 'Brief'},
                            {id: 'operations', label: 'Detailed'},
                        ]}
                    />
                </Box>}
            />}
        />
    </Box>
}

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

const requireControlBands = (canvasElement: HTMLElement) => {
    const topControls = canvasElement.querySelector<HTMLElement>(
        '[data-autotest="table-top-controls"]',
    )
    const actionBand = canvasElement.querySelector<HTMLElement>(
        '[data-autotest="pagination-actions"]',
    )
    const tableControlBar = canvasElement.querySelector<HTMLElement>(
        '[data-autotest="table-control-bar"]',
    )

    if (!topControls || !actionBand || !tableControlBar) {
        throw new Error('Gates-like control bands are missing from the story')
    }

    return {actionBand, tableControlBar, topControls}
}

/** Flex items of a wrapping band, looking through `display: contents` wrappers. */
const getBandItems = (band: HTMLElement): HTMLElement[] =>
    Array.from(band.children).flatMap(child => {
        const element = child as HTMLElement

        return window.getComputedStyle(element).display === 'contents'
            ? getBandItems(element)
            : [element]
    })

/**
 * Fails when a wrapping band broke to a new row earlier than it had to, which is
 * what used to leave the selection summary alone on a row of its own.
 */
const requireTightRowPacking = (band: HTMLElement, bandName: string, gap: number): number => {
    const rows: HTMLElement[][] = []

    getBandItems(band).forEach(item => {
        const rect = item.getBoundingClientRect()

        if (rect.width === 0 && rect.height === 0) {
            return
        }

        const currentRow = rows[rows.length - 1]
        const currentTop = currentRow
            ? Math.round(currentRow[0].getBoundingClientRect().top)
            : null

        if (currentRow && currentTop === Math.round(rect.top)) {
            currentRow.push(item)
        } else {
            rows.push([item])
        }
    })

    const availableWidth = band.clientWidth

    rows.forEach((row, index) => {
        const nextRow = rows[index + 1]

        if (!nextRow) {
            return
        }

        const rects = row.map(item => item.getBoundingClientRect())
        const packedWidth = Math.max(...rects.map(rect => rect.right))
            - Math.min(...rects.map(rect => rect.left))
        const candidateWidth = nextRow[0].getBoundingClientRect().width

        if (packedWidth + gap + candidateWidth <= availableWidth) {
            throw new Error(
                `${bandName} wrapped too early: row ${index + 1} (${Math.round(packedWidth)}px)`
                + ` had room for the next ${Math.round(candidateWidth)}px control`
                + ` within ${Math.round(availableWidth)}px`,
            )
        }
    })

    return rows.length
}

const meta = {
    title: 'pne-ui/PneTable/Selection',
    component: SelectionTableStory,
    parameters: {layout: 'fullscreen'},
} satisfies Meta<typeof SelectionTableStory>

export default meta
type Story = StoryObj<typeof meta>

export const ExplicitSelection: Story = {
    args: {
        initialSelection: {mode: 'explicit', selectedIds: new Set([1, 3])},
    },
}

export const CompactSelectionCells: Story = {
    args: {
        initialSelection: {mode: 'explicit', selectedIds: new Set([1, 3])},
    },
    play: ({canvasElement}) => {
        const selectionInputs = canvasElement.querySelectorAll<HTMLInputElement>(
            'input[data-autotest="row-selection"], input[data-autotest="page-selection"]',
        )
        const bodyRows = canvasElement.querySelectorAll<HTMLElement>(
            '[data-story-selection-row]',
        )

        if (selectionInputs.length !== storyRows.length + 1 || bodyRows.length !== storyRows.length) {
            throw new Error('Compact selection geometry fixture is incomplete')
        }

        selectionInputs.forEach(input => {
            const cell = input.closest<HTMLElement>('th, td')
            const root = input.closest<HTMLElement>('.MuiCheckbox-root')
            const icon = root?.querySelector<SVGSVGElement>('.MuiSvgIcon-root')

            if (!cell || !root || !icon) {
                throw new Error('Selection cell must render a checkbox root and icon')
            }

            const cellStyle = getComputedStyle(cell)
            const rootRect = root.getBoundingClientRect()
            const iconRect = icon.getBoundingClientRect()

            if (cellStyle.padding !== '0px' || cellStyle.width !== '40px') {
                throw new Error('Selection table cell must retain its compact 40px/p0 geometry')
            }
            if (rootRect.width !== 36 || rootRect.height !== 36) {
                throw new Error('Selection checkbox root must remain 36x36px')
            }
            if (iconRect.width !== 20 || iconRect.height !== 20) {
                throw new Error('Selection checkbox icon must remain 20x20px')
            }
        })

        bodyRows.forEach(row => {
            // The normal 8px-padded text cells round to about 37px in Chromium.
            // A 40px checkbox root must therefore fail this regression fixture.
            if (row.getBoundingClientRect().height > 38) {
                throw new Error('A selection checkbox must not expand its normal table row')
            }
        })
    },
}

export const AllMatchingWithExclusions: Story = {
    args: {
        initialSelection: {
            mode: 'allMatching',
            matchingCount: 12,
            excludedIds: new Set([2, 4]),
        },
        matchingCount: 12,
        maxSelected: 20,
    },
}

export const LimitWarning: Story = {
    args: {
        matchingCount: 12,
        maxSelected: 5,
        showLimitStatus: true,
    },
    play: ({canvasElement}) => {
        const feedback = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-feedback"]',
        )
        const topControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-top-controls"]',
        )
        const actionBand = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-actions"]',
        )

        if (!feedback || !topControls || !actionBand) {
            throw new Error('Full-width selection feedback fixture is incomplete')
        }
        if (feedback.nextElementSibling !== topControls) {
            throw new Error('Selection feedback must precede the complete top-control band')
        }
        if (feedback.closest('[data-autotest="pagination"]')) {
            throw new Error('Selection feedback must not be nested inside pagination')
        }
        if (Math.abs(feedback.getBoundingClientRect().width - topControls.getBoundingClientRect().width) > 1) {
            throw new Error('Selection feedback must span the full table-control width')
        }
        if (actionBand.dataset.autotestValue !== 'inline') {
            throw new Error('Desktop pagination must stay inline regardless of feedback height')
        }
    },
}

export const SelectionOnlyMobile360: Story = {
    args: {
        initialSelection: {mode: 'explicit', selectedIds: new Set([1, 3])},
        showBulkActions: true,
        showLimitStatus: true,
    },
    parameters: {
        viewport: {defaultViewport: 'mobile360'},
    },
    play: ({canvasElement}) => {
        const actionBand = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-actions"]',
        )
        const selectionControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="selection-controls"]',
        )
        const feedback = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-feedback"]',
        )
        const topControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-top-controls"]',
        )
        const persistent = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-persistent-controls"]',
        )

        if (!actionBand || !selectionControls || !feedback || !topControls) {
            throw new Error('Selection-only controls are missing from the 360px story')
        }
        if (persistent) {
            throw new Error('Selection-only regression story must not render View controls')
        }
        if (actionBand.dataset.autotestValue !== 'toolbar-stacked') {
            throw new Error('Selection-only controls must occupy their own row at 360px')
        }
        if (selectionControls.clientWidth < 240) {
            throw new Error('Selection-only controls collapsed below a usable mobile width')
        }
        if (selectionControls.scrollWidth > selectionControls.clientWidth) {
            throw new Error('Selection-only controls overflow at the supported 360px viewport')
        }
        if (feedback.nextElementSibling !== topControls) {
            throw new Error('Mobile feedback must precede Selection and Pagination')
        }
        if (feedback.scrollWidth > feedback.clientWidth) {
            throw new Error('Mobile feedback overflows the supported 360px viewport')
        }
        if (feedback.getBoundingClientRect().top >= selectionControls.getBoundingClientRect().top) {
            throw new Error('Mobile visual order must begin with Feedback')
        }
    },
}

export const SelectionAndViewsDesktop: Story = {
    args: {
        initialSelection: {mode: 'explicit', selectedIds: new Set([1, 3])},
        showViews: true,
    },
}

export const SelectPageKeepsHeaderStableAtSubpixelBoundary: Story = {
    render: () => <SubpixelSelectionLayoutStory/>,
    parameters: {
        viewport: {defaultViewport: 'desktop'},
    },
    play: async ({canvasElement}) => {
        const checkbox = canvasElement.querySelector<HTMLInputElement>(
            'input[aria-label="Select current page for layout regression"]',
        )
        const header = canvasElement.querySelector<HTMLElement>(
            '[data-story-selection-header-row]',
        )
        const actionBand = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-actions"]',
        )
        const tableControlBar = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-control-bar"]',
        )
        const persistentControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-persistent-controls"]',
        )

        if (!checkbox || !header || !actionBand || !tableControlBar || !persistentControls) {
            throw new Error('Subpixel selection layout fixture is incomplete')
        }

        checkbox.click()
        const observedLayouts = new Set<string>()
        const observedHeaderTops: number[] = []
        const observedToolbarLefts: number[] = []
        const observedPersistentLefts: number[] = []

        for (let frame = 0; frame < 20; frame += 1) {
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
            observedLayouts.add(
                `${actionBand.dataset.autotestValue}/${tableControlBar.dataset.autotestValue}`,
            )
            observedHeaderTops.push(header.getBoundingClientRect().top)
            observedToolbarLefts.push(tableControlBar.getBoundingClientRect().left)
            observedPersistentLefts.push(persistentControls.getBoundingClientRect().left)
        }

        if (observedLayouts.size !== 1 || !observedLayouts.has('inline/inline')) {
            throw new Error(`Table controls did not settle: ${[...observedLayouts].join(', ')}`)
        }
        if (Math.max(...observedHeaderTops) - Math.min(...observedHeaderTops) >= 1) {
            throw new Error('Table header moved after selecting the current page')
        }
        if (Math.max(...observedToolbarLefts) - Math.min(...observedToolbarLefts) >= 1
            || Math.max(...observedPersistentLefts) - Math.min(...observedPersistentLefts) >= 1) {
            throw new Error('Table controls moved after selecting the current page')
        }

        canvasElement.setAttribute('data-story-layout-stable', 'true')
    },
}

export const GatesControlsStayStableAtFractionalZoom: Story = {
    render: () => <GatesLikeControlsStory/>,
    parameters: {
        viewport: {defaultViewport: 'desktop'},
    },
    play: async ({canvasElement}) => {
        const section = canvasElement.querySelector<HTMLElement>(
            '[data-story-section="gates-like-controls"]',
        )

        if (!section) {
            throw new Error('Gates-like fixture is missing')
        }

        const {actionBand, tableControlBar} = requireControlBands(canvasElement)

        for (const zoom of [1, 1.05, 1.1, 1.25, 1.5]) {
            section.style.zoom = String(zoom)

            for (let frame = 0; frame < 30; frame += 1) {
                await nextFrame()
            }

            const observedLayouts = new Set<string>()

            for (let frame = 0; frame < 90; frame += 1) {
                await nextFrame()
                observedLayouts.add(
                    `${actionBand.dataset.autotestValue}/${tableControlBar.dataset.autotestValue}`,
                )
            }

            if (observedLayouts.size !== 1) {
                throw new Error(
                    `Table controls keep flipping at zoom ${zoom}: ${[...observedLayouts].join(', ')}`,
                )
            }
        }

        section.style.zoom = ''
        canvasElement.setAttribute('data-story-layout-stable', 'true')
    },
}

export const GatesControlsRowBudgetMobile360: Story = {
    render: () => <GatesLikeControlsStory width={360}/>,
    parameters: {
        viewport: {defaultViewport: 'mobile360'},
    },
    play: async ({canvasElement}) => {
        const {actionBand, tableControlBar, topControls} = requireControlBands(canvasElement)

        for (let frame = 0; frame < 30; frame += 1) {
            await nextFrame()
        }

        for (const [name, element] of [
            ['top controls', topControls],
            ['pagination actions', actionBand],
            ['table control bar', tableControlBar],
        ] as const) {
            if (element.scrollWidth > element.clientWidth) {
                throw new Error(`${name} overflow at the supported 360px viewport`)
            }
        }

        const selectionControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="selection-controls"]',
        )
        const summary = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="selection-summary"]',
        )
        const selectAll = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="selection-actions"] button',
        )

        if (!selectionControls || !summary || !selectAll) {
            throw new Error('Selection summary and actions are missing from the 360px story')
        }

        requireTightRowPacking(selectionControls, 'Selection controls', 8)

        if (Math.round(summary.getBoundingClientRect().top)
            !== Math.round(selectAll.getBoundingClientRect().top)) {
            throw new Error('Selection summary must share its row with the first bulk action')
        }
    },
}

export const SelectionAndViewsMobile360: Story = {
    args: {
        initialSelection: {mode: 'explicit', selectedIds: new Set([1, 3])},
        showViews: true,
    },
    parameters: {
        viewport: {defaultViewport: 'mobile360'},
    },
    play: ({canvasElement}) => {
        const topControls = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-top-controls"]',
        )
        const actionBand = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-actions"]',
        )
        const paginationToolbar = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="pagination-toolbar"]',
        )
        const tableControlBar = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-control-bar"]',
        )
        const contextual = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-contextual-controls"]',
        )
        const persistent = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-persistent-controls"]',
        )
        const navigation = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="page-navigation"]',
        )
        const pageSizes = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="page-sizes"]',
        )
        const settingsAction = canvasElement.querySelector<HTMLElement>(
            'button[aria-label="View settings"]',
        )

        if (!topControls
            || !actionBand
            || !paginationToolbar
            || !tableControlBar
            || !contextual
            || !persistent
            || !navigation
            || !pageSizes
            || !settingsAction) {
            throw new Error('Selection and View controls are missing from the 360px story')
        }

        for (const [name, element] of [
            ['top controls', topControls],
            ['pagination actions', actionBand],
            ['table control bar', tableControlBar],
            ['selection controls', contextual],
            ['view controls', persistent],
        ] as const) {
            if (element.scrollWidth > element.clientWidth) {
                throw new Error(`${name} overflow at the supported 360px viewport`)
            }
        }

        if (actionBand.dataset.autotestValue !== 'toolbar-stacked') {
            throw new Error('Combined table controls must sit above pagination at 360px')
        }
        if (tableControlBar.dataset.autotestValue !== 'stacked') {
            throw new Error('Selection and View controls must use separate rows at 360px')
        }
        if (
            actionBand.children[0] !== paginationToolbar
            || actionBand.children[1] !== navigation
            || actionBand.children[2] !== pageSizes
        ) {
            throw new Error('Pagination DOM order must follow the visual mobile rows')
        }
        if (
            tableControlBar.children[0] !== contextual
            || tableControlBar.children[1] !== persistent
        ) {
            throw new Error('Selection must precede View in visual and keyboard order')
        }

        const contextualRect = contextual.getBoundingClientRect()
        const persistentRect = persistent.getBoundingClientRect()
        const navigationRect = navigation.getBoundingClientRect()
        if (contextualRect.top >= persistentRect.top || persistentRect.top >= navigationRect.top) {
            throw new Error('Mobile control rows are not ordered as Selection, View, Pagination')
        }

        const settingsRect = settingsAction.getBoundingClientRect()
        if (settingsRect.width !== 40 || settingsRect.height !== 40) {
            throw new Error('View settings must retain the 40x40px touch target')
        }
    },
}
