import type { BoardProps } from '@cloudscape-design/board-components/board'
import type { BoardItemProps } from '@cloudscape-design/board-components/board-item'

/**
 * Shared i18n strings for Cloudscape board items.
 */
export const boardItemI18nStrings: BoardItemProps.I18nStrings = {
    dragHandleAriaLabel: 'Drag handle',
    dragHandleAriaDescription:
        'Use Space or Enter to activate drag, arrow keys to move, Space or Enter to submit, or Escape to discard. Temporarily disable screen reader navigation if it interferes with arrow keys.',
    resizeHandleAriaLabel: 'Resize handle',
    resizeHandleAriaDescription:
        'Use Space or Enter to activate resize, arrow keys to move, Space or Enter to submit, or Escape to discard. Temporarily disable screen reader navigation if it interferes with arrow keys.',
}

function createAnnouncement<T>(
    operationAnnouncement: string,
    conflicts: ReadonlyArray<BoardProps.Item<T>>,
    disturbed: ReadonlyArray<BoardProps.Item<T>>,
    getTitle: (item: BoardProps.Item<T>) => string,
) {
    const conflictsAnnouncement = conflicts.length > 0 ? `Conflicts with ${conflicts.map(c => getTitle(c)).join(', ')}.` : ''
    const disturbedAnnouncement = disturbed.length > 0 ? `Disturbed ${disturbed.length} items.` : ''
    return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement].filter(Boolean).join(' ')
}

/**
 * Generates Cloudscape board i18n strings that reuse a title getter for announcements.
 */
export function createBoardI18nStrings<T>(getTitle: (item: BoardProps.Item<T>) => string): BoardProps.I18nStrings<T> {
    return {
        liveAnnouncementDndStarted: operationType => (operationType === 'resize' ? 'Resizing' : 'Dragging'),
        liveAnnouncementDndItemReordered: operation => {
            const columns = `column ${operation.placement.x + 1}`
            const rows = `row ${operation.placement.y + 1}`
            return createAnnouncement(`Item moved to ${operation.direction === 'horizontal' ? columns : rows}.`, operation.conflicts, operation.disturbed, getTitle)
        },
        liveAnnouncementDndItemResized: operation => {
            const columnsConstraint = operation.isMinimalColumnsReached ? ' (minimal)' : ''
            const rowsConstraint = operation.isMinimalRowsReached ? ' (minimal)' : ''
            const sizeAnnouncement =
                operation.direction === 'horizontal'
                    ? `columns ${operation.placement.width}${columnsConstraint}`
                    : `rows ${operation.placement.height}${rowsConstraint}`
            return createAnnouncement(`Item resized to ${sizeAnnouncement}.`, operation.conflicts, operation.disturbed, getTitle)
        },
        liveAnnouncementDndItemInserted: operation => {
            const columns = `column ${operation.placement.x + 1}`
            const rows = `row ${operation.placement.y + 1}`
            return createAnnouncement(`Item inserted to ${columns}, ${rows}.`, operation.conflicts, operation.disturbed, getTitle)
        },
        liveAnnouncementDndCommitted: operationType => `${operationType} committed`,
        liveAnnouncementDndDiscarded: operationType => `${operationType} discarded`,
        liveAnnouncementItemRemoved: op => createAnnouncement(`Removed item ${getTitle(op.item)}.`, [], op.disturbed, getTitle),
        navigationAriaLabel: 'Board navigation',
        navigationAriaDescription: 'Click on non-empty item to move focus over',
        navigationItemAriaLabel: item => (item ? getTitle(item) : 'Empty'),
    }
}
