import React, {ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
    Box,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    SxProps,
    Theme,
    Tooltip,
    Typography,
} from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
    useKeyboardSensor,
    useMouseSensor,
} from '@hello-pangea/dnd'
import {useTranslation} from 'react-i18next'
import PneModal from '../../PneModal'
import PneModalActions from '../../PneModalActions'
import PneButton from '../../PneButton'
import {PneCheckbox} from '../../PneCheckbox'
import PneTextField from '../../PneTextField'
import {createAutoTestAttributes} from '../../AutoTestAttribute'
import useImmediateTouchSensor from '../../non-abstract-entity-selector/useImmediateTouchSensor'
import type {
    PneTableColumnId,
    PneTableColumnOption,
    PneTableColumnSettingsValue,
    PneTableResolvedColumnSettings,
} from './types'
import {resolvePneTableColumnSettings} from './resolveColumnSettings'

export const COLUMN_SETTINGS_DIALOG_AUTOTEST_ID = 'column-settings-dialog'
export const COLUMN_SETTINGS_SEARCH_AUTOTEST_ID = 'column-settings-search'
export const COLUMN_SETTINGS_OPTION_AUTOTEST_ID = 'column-settings-option'
export const COLUMN_SETTINGS_REORDER_AUTOTEST_ID = 'column-settings-reorder'
export const COLUMN_SETTINGS_EMPTY_AUTOTEST_ID = 'column-settings-empty'
export const COLUMN_SETTINGS_RESET_AUTOTEST_ID = 'column-settings-reset'
export const COLUMN_SETTINGS_CANCEL_AUTOTEST_ID = 'column-settings-cancel'
export const COLUMN_SETTINGS_SAVE_AUTOTEST_ID = 'column-settings-save'

const DROPPABLE_ID = 'pne-table-column-settings'

/** Mouse, keyboard and immediate touch dragging on the dedicated grip. */
const reorderSensors = [useMouseSensor, useKeyboardSensor, useImmediateTouchSensor]

export type PneTableColumnSettingsDialogProps<TColumn extends PneTableColumnOption = PneTableColumnOption> = {
    open: boolean
    /** Called on Cancel, on the close button, on backdrop/Escape, and after a successful save. */
    onClose: () => void
    /** Column catalog of the configured table view, in default display order. */
    columns: readonly TColumn[]
    /** Stored preference; `undefined` or `null` means the catalog defaults. */
    value?: PneTableColumnSettingsValue | null
    /**
     * Receives the normalized draft on Save. The dialog closes once the returned
     * promise resolves. A rejected promise keeps the dialog open with the draft
     * intact; reporting that failure to the user is the caller's job.
     */
    onSave: (value: PneTableColumnSettingsValue) => void | Promise<void>
    /** Stable, non-secret instance identifier used to scope Selenium locators. */
    autoTestId?: string
    /** Defaults to the localized "Table settings". */
    title?: ReactNode
    /** Set to false to drop the search field for short catalogs. Defaults to true. */
    searchable?: boolean
    /**
     * Lets the user drag visible columns into a new display order. Grips are
     * shown only for visible columns and only while the list is not filtered.
     * Defaults to true.
     */
    reorderable?: boolean
    containerSx?: SxProps<Theme>
}

/**
 * The list grows with the viewport and scrolls on its own, so the search field
 * and the actions stay in place. 300px covers the modal chrome around the list
 * within the surface's 98% height cap; the floor keeps four rows on tiny screens.
 */
const listSx: SxProps<Theme> = {
    maxHeight: 'max(160px, calc(100vh - 300px))',
    overflowY: 'auto',
    padding: 0,
}

const itemSx: SxProps<Theme> = {
    alignItems: 'stretch',
    display: 'flex',
    padding: 0,
}

const itemBodySx: SxProps<Theme> = {
    display: 'flex',
    flex: 1,
    minWidth: 0,
}

const itemButtonSx: SxProps<Theme> = {
    borderRadius: '4px',
    flex: 1,
    minHeight: '40px',
    minWidth: 0,
    paddingBottom: '2px',
    paddingLeft: '4px',
    paddingRight: '8px',
    paddingTop: '2px',
}

const gripSx: SxProps<Theme> = {
    borderRadius: '4px',
    cursor: 'grab',
    flexShrink: 0,
    minHeight: '40px',
    padding: 0,
    width: '32px',
    '@media (pointer: coarse)': {width: '44px'},
    '&.Mui-focusVisible': {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: -2,
    },
}

const normalizeSearch = (value: string): string => value.trim().toLocaleLowerCase()

/**
 * One row of the draft. The row order is the list order: it is fixed when the
 * dialog opens (visible columns in display order, then hidden ones) and changes
 * only by dragging or Reset, never by toggling a checkbox.
 */
type DraftRow = {
    id: PneTableColumnId
    visible: boolean
}

type DraftListItem<TColumn extends PneTableColumnOption> = {
    column: TColumn
    visible: boolean
}

const toDraftRows = (resolved: PneTableResolvedColumnSettings<PneTableColumnOption>): DraftRow[] => [
    ...resolved.visibleColumns.map(column => ({id: column.id, visible: true})),
    ...resolved.hiddenColumns.map(column => ({id: column.id, visible: false})),
]

type ColumnSettingsFormProps<TColumn extends PneTableColumnOption> = Omit<
    PneTableColumnSettingsDialogProps<TColumn>,
    'open'
>

const ColumnSettingsForm = <TColumn extends PneTableColumnOption>(
    props: ColumnSettingsFormProps<TColumn>,
) => {
    const {
        autoTestId,
        columns,
        containerSx,
        onClose,
        onSave,
        reorderable = true,
        searchable = true,
        title,
        value,
    } = props
    const {t} = useTranslation()
    const [rows, setRows] = useState<DraftRow[]>(() => toDraftRows(resolvePneTableColumnSettings(columns, value)))
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false)
    const mountedRef = useRef(false)

    useEffect(() => {
        // StrictMode replays mount/unmount, so the flag must be set here, not in the initializer.
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
    }, [])

    const byId = useMemo(() => new Map<PneTableColumnId, TColumn>(columns.map(column => [column.id, column])), [columns])

    /** Drops rows the catalog no longer has and appends catalog columns the draft does not know as visible. */
    const syncRows = useCallback((current: readonly DraftRow[]): DraftRow[] => {
        const seen = new Set<PneTableColumnId>()
        const synced: DraftRow[] = []
        for (const row of current) {
            if (byId.has(row.id) && !seen.has(row.id)) {
                seen.add(row.id)
                synced.push({...row})
            }
        }
        for (const column of columns) {
            if (!seen.has(column.id)) {
                synced.push({id: column.id, visible: true})
            }
        }
        return synced
    }, [byId, columns])

    const items = useMemo<DraftListItem<TColumn>[]>(
        () => syncRows(rows).map(row => ({column: byId.get(row.id) as TColumn, visible: row.visible})),
        [byId, rows, syncRows],
    )
    const draftValue = useMemo<PneTableColumnSettingsValue>(() => ({
        visibleColumnIds: items.filter(item => item.visible).map(item => item.column.id),
        hiddenColumnIds: items.filter(item => !item.visible).map(item => item.column.id),
    }), [items])
    const resolvedDraft = useMemo(() => resolvePneTableColumnSettings(columns, draftValue), [columns, draftValue])
    const normalizedSearch = normalizeSearch(search)
    const filtering = normalizedSearch !== ''
    const filteredItems = filtering
        ? items.filter(item => normalizeSearch(item.column.label).includes(normalizedSearch))
        : items
    const visibleCount = draftValue.visibleColumnIds.length
    const lastVisibleId: PneTableColumnId | null = visibleCount === 1 ? draftValue.visibleColumnIds[0] : null
    const dragEnabled = reorderable && !saving && !filtering && visibleCount > 1

    const toggle = (id: PneTableColumnId) => {
        setRows(current => {
            const synced = syncRows(current)
            const row = synced.find(candidate => candidate.id === id)
            if (!row) {
                return current
            }
            if (row.visible && synced.filter(candidate => candidate.visible).length <= 1) {
                return current
            }
            row.visible = !row.visible
            return synced
        })
    }

    const handleDragEnd = (result: DropResult) => {
        const {destination, source} = result
        if (!destination || destination.droppableId !== DROPPABLE_ID || destination.index === source.index) {
            return
        }
        // Dragging is enabled only without a filter, so list indices are draft indices.
        setRows(current => {
            const synced = syncRows(current)
            if (source.index >= synced.length) {
                return current
            }
            const [moved] = synced.splice(source.index, 1)
            synced.splice(Math.min(destination.index, synced.length), 0, moved)
            return synced
        })
    }

    const handleReset = () => {
        setRows(toDraftRows(resolvePneTableColumnSettings(columns, undefined)))
    }

    const handleSave = async () => {
        if (saving) {
            return
        }
        setSaving(true)
        try {
            await onSave(resolvedDraft.value)
            if (mountedRef.current) {
                setSaving(false)
            }
            onClose()
        } catch {
            // The consumer reports the failure; the draft stays editable.
            if (mountedRef.current) {
                setSaving(false)
            }
        }
    }

    const dialogTitle = t('pneTable.columnSettings.title', {defaultValue: 'Table settings'})
    const searchLabel = t('pneTable.columnSettings.search', {defaultValue: 'Search columns'})
    const lastVisibleHint = t('pneTable.columnSettings.lastVisible', {
        defaultValue: 'At least one column stays visible',
    })

    return <PneModal
        {...createAutoTestAttributes(COLUMN_SETTINGS_DIALOG_AUTOTEST_ID, autoTestId)}
        actions={<PneModalActions
            leading={<PneButton
                {...createAutoTestAttributes(COLUMN_SETTINGS_RESET_AUTOTEST_ID)}
                disabled={saving || resolvedDraft.isDefault}
                onClick={handleReset}
                pneStyle='text'
            >
                {t('pneTable.columnSettings.reset', {defaultValue: 'Reset to default'})}
            </PneButton>}
            primary={<PneButton
                {...createAutoTestAttributes(COLUMN_SETTINGS_SAVE_AUTOTEST_ID)}
                disabled={saving}
                onClick={() => {
                    void handleSave()
                }}
                pneStyle='contained'
            >
                {t('pneTable.columnSettings.save', {defaultValue: 'Save'})}
            </PneButton>}
            secondary={<PneButton
                {...createAutoTestAttributes(COLUMN_SETTINGS_CANCEL_AUTOTEST_ID)}
                disabled={saving}
                onClick={onClose}
                pneStyle='outlined'
            >
                {t('pneTable.columnSettings.cancel', {defaultValue: 'Cancel'})}
            </PneButton>}
        />}
        containerSx={[
            {maxWidth: '100%', width: '480px'},
            ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
        ]}
        onClose={() => {
            if (!saving) {
                onClose()
            }
        }}
        open
        title={title ?? dialogTitle}
    >
        <Box sx={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {searchable ? <PneTextField
                autoComplete='off'
                fullWidth
                label={searchLabel}
                onChange={event => setSearch(event.target.value)}
                slotProps={{
                    htmlInput: createAutoTestAttributes(COLUMN_SETTINGS_SEARCH_AUTOTEST_ID),
                }}
                type='search'
                value={search}
            /> : null}
            <DragDropContext
                enableDefaultSensors={false}
                onDragEnd={handleDragEnd}
                sensors={reorderSensors}
            >
                <Droppable droppableId={DROPPABLE_ID} isDropDisabled={!dragEnabled}>
                    {droppable => <List
                        {...droppable.droppableProps}
                        aria-label={dialogTitle}
                        dense
                        ref={droppable.innerRef}
                        sx={listSx}
                    >
                        {filteredItems.map(({column, visible}, index) => {
                            const locked = visible && column.id === lastVisibleId
                            const labelId = `pne-column-settings-${column.id}`
                            const draggable = dragEnabled && visible
                            const reorderLabel = t('pneTable.columnSettings.reorder', {
                                name: column.label,
                                defaultValue: 'Reorder {{name}}',
                            })

                            return <Draggable
                                // The grip is a real button; without this the library refuses to lift from it.
                                disableInteractiveElementBlocking
                                draggableId={column.id}
                                index={index}
                                isDragDisabled={!draggable}
                                key={column.id}
                            >
                                {provided => <ListItem
                                    {...provided.draggableProps}
                                    ref={provided.innerRef}
                                    style={provided.draggableProps.style}
                                    sx={itemSx}
                                >
                                    {/* A disabled button gets no pointer events, so the hint lives on this wrapper. */}
                                    <Tooltip
                                        describeChild
                                        enterDelay={300}
                                        enterNextDelay={300}
                                        title={locked ? lastVisibleHint : ''}
                                    >
                                        <Box component='span' sx={itemBodySx}>
                                            <ListItemButton
                                                dense
                                                disabled={saving || locked}
                                                onClick={() => toggle(column.id)}
                                                sx={itemButtonSx}
                                            >
                                                <ListItemIcon sx={{minWidth: '36px'}}>
                                                    <PneCheckbox
                                                        checked={visible}
                                                        disabled={saving || locked}
                                                        disableRipple
                                                        edge='start'
                                                        slotProps={{
                                                            input: {
                                                                ...createAutoTestAttributes(
                                                                    COLUMN_SETTINGS_OPTION_AUTOTEST_ID,
                                                                    column.id,
                                                                ),
                                                                'aria-labelledby': labelId,
                                                            },
                                                        }}
                                                        tabIndex={-1}
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    id={labelId}
                                                    primary={column.label}
                                                    slotProps={{primary: {noWrap: true}}}
                                                />
                                            </ListItemButton>
                                        </Box>
                                    </Tooltip>
                                    {draggable && provided.dragHandleProps ? <IconButton
                                        {...provided.dragHandleProps}
                                        {...createAutoTestAttributes(COLUMN_SETTINGS_REORDER_AUTOTEST_ID, column.id)}
                                        aria-label={reorderLabel}
                                        disableRipple
                                        style={{touchAction: 'none'}}
                                        sx={gripSx}
                                        type='button'
                                    >
                                        <DragIndicatorIcon fontSize='small'/>
                                    </IconButton> : null}
                                </ListItem>}
                            </Draggable>
                        })}
                        {droppable.placeholder}
                        {filteredItems.length === 0 ? <ListItem
                            {...createAutoTestAttributes(COLUMN_SETTINGS_EMPTY_AUTOTEST_ID)}
                            sx={{justifyContent: 'center', minHeight: '40px'}}
                        >
                            <Typography color='text.secondary' variant='body2'>
                                {t('pneTable.columnSettings.noMatches', {defaultValue: 'No columns match'})}
                            </Typography>
                        </ListItem> : null}
                    </List>}
                </Droppable>
            </DragDropContext>
        </Box>
    </PneModal>
}

/**
 * Modal editor for the visible column set of one table view: a searchable
 * checklist over the catalog with drag reordering of visible columns,
 * "Reset to default", "Cancel" and "Save". The list order is fixed when the
 * dialog opens (visible columns in display order, then hidden ones); toggling a
 * checkbox never moves the row, so a column hidden and shown again keeps its
 * place. The draft is created when the dialog opens and discarded when it
 * closes, so a reopened dialog always starts from the current `value`.
 */
const PneTableColumnSettingsDialog = <TColumn extends PneTableColumnOption = PneTableColumnOption>(
    props: PneTableColumnSettingsDialogProps<TColumn>,
) => {
    const {open, ...formProps} = props

    if (!open) {
        return null
    }

    return <ColumnSettingsForm {...formProps}/>
}

export default PneTableColumnSettingsDialog
