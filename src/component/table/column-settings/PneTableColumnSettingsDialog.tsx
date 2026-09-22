import React, {ReactNode, useEffect, useMemo, useRef, useState} from 'react'
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    SxProps,
    Theme,
    Typography,
} from '@mui/material'
import {useTranslation} from 'react-i18next'
import PneModal from '../../PneModal'
import PneModalActions from '../../PneModalActions'
import PneButton from '../../PneButton'
import {PneCheckbox} from '../../PneCheckbox'
import PneTextField from '../../PneTextField'
import {createAutoTestAttributes} from '../../AutoTestAttribute'
import type {PneTableColumnId, PneTableColumnOption, PneTableColumnSettingsValue} from './types'
import {
    createDefaultPneTableColumnSettings,
    resolvePneTableColumnSettings,
} from './resolveColumnSettings'

export const COLUMN_SETTINGS_DIALOG_AUTOTEST_ID = 'column-settings-dialog'
export const COLUMN_SETTINGS_SEARCH_AUTOTEST_ID = 'column-settings-search'
export const COLUMN_SETTINGS_OPTION_AUTOTEST_ID = 'column-settings-option'
export const COLUMN_SETTINGS_EMPTY_AUTOTEST_ID = 'column-settings-empty'
export const COLUMN_SETTINGS_RESET_AUTOTEST_ID = 'column-settings-reset'
export const COLUMN_SETTINGS_CANCEL_AUTOTEST_ID = 'column-settings-cancel'
export const COLUMN_SETTINGS_SAVE_AUTOTEST_ID = 'column-settings-save'

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
    containerSx?: SxProps<Theme>
}

const listSx: SxProps<Theme> = {
    maxHeight: '320px',
    overflowY: 'auto',
    padding: 0,
}

const itemButtonSx: SxProps<Theme> = {
    borderRadius: '4px',
    minHeight: '40px',
    paddingBottom: '2px',
    paddingLeft: '4px',
    paddingRight: '8px',
    paddingTop: '2px',
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
    const filteredItems = normalizedSearch === ''
        ? items
        : items.filter(item => normalizeSearch(item.column.label).includes(normalizedSearch))
    const lastVisibleId: PneTableColumnId | null = resolvedDraft.visibleColumns.length === 1
        ? resolvedDraft.visibleColumns[0].id
        : null

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
                pneStyle='outlined'
            >
                {t('pneTable.columnSettings.reset', {defaultValue: 'Reset to default'})}
            </PneButton>}
            primary={<PneButton
                {...createAutoTestAttributes(COLUMN_SETTINGS_SAVE_AUTOTEST_ID)}
                disabled={saving}
                onClick={() => {
                    void handleSave()
                }}
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
            <List
                aria-label={actionLabel}
                dense
                sx={listSx}
            >
                {filteredItems.map(({column, visible}) => {
                    const locked = visible && column.id === lastVisibleId
                    const labelId = `pne-column-settings-${column.id}`

                    return <ListItem
                        disablePadding
                        key={column.id}
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
                    </ListItem>
                })}
                {filteredItems.length === 0 ? <ListItem
                    {...createAutoTestAttributes(COLUMN_SETTINGS_EMPTY_AUTOTEST_ID)}
                    sx={{justifyContent: 'center', minHeight: '40px'}}
                >
                    <Typography color='text.secondary' variant='body2'>
                        {t('pneTable.columnSettings.noMatches', {defaultValue: 'No columns match'})}
                    </Typography>
                </ListItem> : null}
            </List>
        </Box>
    </PneModal>
}

/**
 * Modal editor for the visible column set of one table view: a searchable
 * checklist over the catalog, "Reset to default", "Cancel" and "Save". The
 * draft is created when the dialog opens and discarded when it closes, so a
 * reopened dialog always starts from the current `value`.
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
