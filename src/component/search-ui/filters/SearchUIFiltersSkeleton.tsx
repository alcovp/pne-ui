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
    footerLeadSx,
    footerSx,
    footerTrailSx,
    headerGroupSx,
    headerSx,
    rootSx,
    searchButtonSx,
} from './panelSx'
import {SEARCH_UI_FILTERS_PHONE_MEDIA} from './layout'

export const SEARCH_FILTERS_SKELETON_AUTOTEST_ID = 'search-filters-skeleton'

/** An action button of the skeleton: its width, and whether it takes the rest of its line on phones. */
export type SearchUIFiltersSkeletonAction = {
    width: number
    main?: boolean
    /** Stays in the header when the panel is unfolded: the saved sets. The others go to the footer. */
    header?: boolean
}

export type SearchUIFiltersSkeletonProps = {
    /** Criterion rows to draw; none while the panel is folded. */
    rows: number
    /** The panel is folded: the header is the whole panel and holds all the actions. */
    collapsed: boolean
    /** The fold toggle is there: the page did not hide it and the panel has criteria. */
    toggle: boolean
    /** The action buttons in their order, e.g. Saved filters, Add filter, Search. */
    actions: readonly SearchUIFiltersSkeletonAction[]
    autoTestId?: string
}

// The header, the rows and the footer take the panel's own layout, so the skeleton is exactly as tall
// as the panel it stands for: the 33px header, 40px rows with a line on top, the footer with 32px buttons.
// Every row looks the same: the name, and the value pill in the values column.
const nameCellSx: SystemStyleObject<Theme> = {
    alignItems: 'center',
    display: 'flex',
    // As wide as the narrowest real name column, so the values start where they will.
    minWidth: '120px',
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
    const unfolded = shownRows > 0
    const headerActions = unfolded ? actions.filter(action => action.header) : actions
    const footerActions = unfolded ? actions.filter(action => !action.header) : []
    const buttonHeight = unfolded ? 32 : 24
    const button = (action: SearchUIFiltersSkeletonAction, index: number, height: number) => <Skeleton
        height={height}
        key={index}
        sx={action.main ? [searchButtonSx, mainButtonSx] : undefined}
        variant='rounded'
        width={action.width}
    />

    return <Box
        {...createAutoTestAttributes(SEARCH_FILTERS_SKELETON_AUTOTEST_ID, autoTestId)}
        aria-busy='true'
        sx={rootSx}
    >
        <Box data-pne-folded={unfolded ? undefined : 'true'} sx={headerSx}>
            <Box sx={headerGroupSx}>
                {/* The name of the panel with its chevron, and the count. */}
                {toggle ? <Skeleton height={24} variant='rounded' width={96}/> : null}
            </Box>
            <Box sx={headerGroupSx}>
                {headerActions.map((action, index) => button(action, index, 24))}
            </Box>
        </Box>
        {Array.from({length: shownRows}, (_, index) => <Box data-pne-skeleton-row='true' key={index} sx={criterionSx}>
            <Box sx={[criterionActionsWrapperSx, iconsCellSx]}/>
            <Box sx={[criterionLeftWrapperSx, nameCellSx]}>
                <Skeleton height={14} variant='rounded' width={112}/>
            </Box>
            <Box sx={criterionContentWrapperSx}>
                <Skeleton height={24} sx={valuePillSx} variant='rounded' width={220}/>
            </Box>
        </Box>)}
        {unfolded && footerActions.length > 0 ? <Box sx={footerSx}>
            <Box sx={footerLeadSx}>
                {footerActions.filter(action => !action.main).map((action, index) => button(action, index, buttonHeight))}
            </Box>
            <Box sx={footerTrailSx}>
                {footerActions.filter(action => action.main).map((action, index) => button(action, index, buttonHeight))}
            </Box>
        </Box> : null}
    </Box>
}
