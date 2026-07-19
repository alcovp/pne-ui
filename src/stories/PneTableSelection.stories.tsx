import React, {useRef, useState} from 'react'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {Box, IconButton, Tooltip, Typography} from '@mui/material'
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
        status={limitVisible
            ? <Typography role='alert'>Selection is limited to {maxSelected} rows. Narrow the filters and try again.</Typography>
            : undefined}
        summary={<Typography>{selection.selectedCount} rows selected</Typography>}
    />
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
            createTableHeader={() => <PneTableRow>
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
        const persistent = canvasElement.querySelector<HTMLElement>(
            '[data-autotest="table-persistent-controls"]',
        )

        if (!actionBand || !selectionControls) {
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
    },
}

export const SelectionAndViewsDesktop: Story = {
    args: {
        initialSelection: {mode: 'explicit', selectedIds: new Set([1, 3])},
        showViews: true,
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
