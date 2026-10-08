import React, {ReactNode, useEffect, useMemo, useRef, useState} from 'react'
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
import type {PneTableColumnId, PneTableColumnOption, PneTableColumnSettingsValue} from './types'
import {
    createDefaultPneTableColumnSettings,
    resolvePneTableColumnSettings,
} from './resolveColumnSettings'

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

const listSx: SxProps<Theme> = {
    maxHeight: '320px',
    overflowY: 'auto',
    padding: 0,
}

const itemSx: SxProps<Theme> = {
    alignItems: 'stretch',
    display: 'flex',
    padding: 0,
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

type DraftListItem<TColumn extends PneTableColumnOption> = {
    column: TColumn
    visible: boolean
}

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
    const initial = useMemo(() => resolvePneTableColumnSettings(columns, value), [columns, value])
    const [draft, setDraft] = useState<PneTableColumnSettingsValue>(initial.value)
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false)
    const mountedRef = useRef(true)

    useEffect(() => () => {
        mountedRef.current = false
    }, [])

    const resolvedDraft = useMemo(() => resolvePneTableColumnSettings(columns, draft), [columns, draft])
    const items = useMemo<DraftListItem<TColumn>[]>(() => [
        ...resolvedDraft.visibleColumns.map(column => ({column, visible: true})),
        ...resolvedDraft.hiddenColumns.map(column => ({column, visible: false})),
    ], [resolvedDraft])
    const normalizedSearch = normalizeSearch(search)
    const filtering = normalizedSearch !== ''
    const filteredItems = filtering
        ? items.filter(item => normalizeSearch(item.column.label).includes(normalizedSearch))
        : items
    const lastVisibleId: PneTableColumnId | null = resolvedDraft.visibleColumns.length === 1
        ? resolvedDraft.visibleColumns[0].id
        : null
    const visibleCount = resolvedDraft.visibleColumns.length
    const dragEnabled = reorderable && !saving && !filtering && visibleCount > 1

    const toggle = (id: PneTableColumnId) => {
        setDraft(current => {
            const visible = current.visibleColumnIds.includes(id)
            if (visible) {
                if (current.visibleColumnIds.length <= 1) {
                    return current
                }
                return {
                    visibleColumnIds: current.visibleColumnIds.filter(columnId => columnId !== id),
                    hiddenColumnIds: [...current.hiddenColumnIds, id],
                }
            }
            return {
                visibleColumnIds: [...current.visibleColumnIds, id],
                hiddenColumnIds: current.hiddenColumnIds.filter(columnId => columnId !== id),
            }
        })
    }

    const handleDragEnd = (result: DropResult) => {
        const {destination, source} = result
        if (!destination || destination.droppableId !== DROPPABLE_ID) {
            return
        }
        // Visible columns occupy the leading list slots in draft order, so list
        // indices map onto visibleColumnIds; hidden rows are not a valid target.
        const target = Math.min(destination.index, visibleCount - 1)
        if (source.index >= visibleCount || target === source.index) {
            return
        }
        setDraft(current => {
            const visible = [...current.visibleColumnIds]
            const [moved] = visible.splice(source.index, 1)
            visible.splice(target, 0, moved)
            return {...current, visibleColumnIds: visible}
        })
    }

    const handleReset = () => {
        setDraft(createDefaultPneTableColumnSettings(columns))
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

    const actionLabel = t('pneTable.columnSettings.title', {defaultValue: 'Table settings'})
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
                pneStyle='neutral'
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
        title={title ?? actionLabel}
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
                        aria-label={actionLabel}
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
                                    <ListItemButton
                                        dense
                                        disabled={saving || locked}
                                        onClick={() => toggle(column.id)}
                                        sx={itemButtonSx}
                                        title={locked ? lastVisibleHint : undefined}
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
 * "Reset to default", "Cancel" and "Save". The draft is created when the
 * dialog opens and discarded when it closes, so a reopened dialog always
 * starts from the current `value`.
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
