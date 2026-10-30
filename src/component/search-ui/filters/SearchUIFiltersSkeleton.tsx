import React from 'react'
import {Box, Skeleton} from '@mui/material'
import type {Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'
import {createAutoTestAttributes} from '../../AutoTestAttribute'
import {
    criterionActionsWrapperSx,
    criterionContentWrapperSx,
    criterionLeftWrapperSx,
    criterionSx,
} from './criterionRowSx'
import {
    actionsLeadSx,
    actionsRowSx,
    actionsSx,
    compactActionsRowSx,
    rootSx,
    searchButtonSx,
} from './panelSx'
import {SEARCH_UI_FILTERS_PHONE_MEDIA} from './layout'

export const SEARCH_FILTERS_SKELETON_AUTOTEST_ID = 'search-filters-skeleton'

/** An action button of the skeleton: its width, and whether it takes the rest of its line on phones. */
export type SearchUIFiltersSkeletonAction = {
    width: number
    main?: boolean
}

export type SearchUIFiltersSkeletonProps = {
    /** Criterion rows to draw; none while the panel is folded. */
    rows: number
    /** The panel is folded: the toggle carries the count and the actions follow it. */
    collapsed: boolean
    /** The fold toggle is there: the page did not hide it and the panel has criteria. */
    toggle: boolean
    /** The action buttons in their order, e.g. Saved filters, Add filter, Search. */
    actions: readonly SearchUIFiltersSkeletonAction[]
    autoTestId?: string
}

// The rows and the actions row take the panel's own layout, so the skeleton is exactly as tall as the
// panel it stands for: 40px rows with a line on top, the 28px buttons 6px from the edges of their row.
// Every row looks the same: the name, and the value pill in the values column.
const nameCellSx: SystemStyleObject<Theme> = {
    alignItems: 'center',
    display: 'flex',
    // As wide as the narrowest real name column, so the values start where they will.
    minWidth: '150px',
    minHeight: '24px',
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        minWidth: 0,
    },
}

const iconsCellSx: SystemStyleObject<Theme> = {
    minHeight: '24px',
}

const valuePillSx: SystemStyleObject<Theme> = {
    borderRadius: '16px',
}

const mainButtonSx: SystemStyleObject<Theme> = {
    [SEARCH_UI_FILTERS_PHONE_MEDIA]: {
        flexGrow: 1,
        width: 'auto',
    },
}

/**
 * The filters panel while it waits for the host: whether the user folded it, the filter set chosen last
 * time and that set itself. It takes the place the panel will take, so the table under it does not jump
 * when the panel arrives.
 */
export const SearchUIFiltersSkeleton = (props: SearchUIFiltersSkeletonProps) => {
    const {actions, autoTestId, collapsed, rows, toggle} = props
    const shownRows = collapsed ? 0 : rows
    const hasActions = toggle || actions.length > 0

    return <Box
        {...createAutoTestAttributes(SEARCH_FILTERS_SKELETON_AUTOTEST_ID, autoTestId)}
        aria-busy='true'
        sx={rootSx}
    >
        {Array.from({length: shownRows}, (_, index) => <Box key={index} sx={criterionSx}>
            <Box sx={[criterionLeftWrapperSx, nameCellSx]}>
                <Skeleton height={14} variant='rounded' width={112}/>
            </Box>
            <Box sx={[criterionActionsWrapperSx, iconsCellSx]}/>
            <Box sx={criterionContentWrapperSx}>
                <Skeleton height={24} sx={valuePillSx} variant='rounded' width={220}/>
            </Box>
        </Box>)}
        {hasActions ? <Box sx={shownRows > 0 ? actionsRowSx : compactActionsRowSx}>
            <Box sx={actionsLeadSx}>
                {/* The chevron alone, or with the count while folded. */}
                {toggle ? <Skeleton height={28} variant='rounded' width={collapsed ? 56 : 32}/> : null}
            </Box>
            <Box sx={actionsSx}>
                {actions.map((action, index) => <Skeleton
                    height={28}
                    key={index}
                    sx={action.main ? [searchButtonSx, mainButtonSx] : undefined}
                    variant='rounded'
                    width={action.width}
                />)}
            </Box>
        </Box> : null}
    </Box>
}
