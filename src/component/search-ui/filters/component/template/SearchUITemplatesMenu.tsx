import React, {useId, useLayoutEffect, useRef, useState} from 'react';
import {Box, Divider, InputAdornment, ListItemIcon, ListItemText, Menu, MenuItem, useMediaQuery} from '@mui/material';
import {alpha, SxProps, Theme, useTheme} from '@mui/material/styles';
import {
    DragDropContext,
    Draggable,
    type DraggableProvidedDraggableProps,
    Droppable,
    type DropResult,
    type ResponderProvided,
    useMouseSensor,
} from '@hello-pangea/dnd';
import {useTranslation} from 'react-i18next';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {useSearchUIFiltersStore} from '../../state/store';
import {SearchUITemplate} from "../../types";
import {overlayActions, PneButton, PneTextField} from '../../../../..';
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {useOptionalPneConfirm} from '../../../../confirm/PneConfirmProvider';
import useImmediateTouchSensor from '../../../../non-abstract-entity-selector/useImmediateTouchSensor';
import {useSearchUIAutoTestScope} from '../../AutoTestScope';
import SearchUITemplateEditor from './SearchUITemplateEditor';

const TEMPLATES_AUTOTEST_ID = 'templates';
const TEMPLATES_PANEL_AUTOTEST_ID = 'templates-panel';
const TEMPLATE_ITEM_AUTOTEST_ID = 'template-item';
const SELECT_TEMPLATE_AUTOTEST_ID = 'select-template';
const REMOVE_TEMPLATE_AUTOTEST_ID = 'remove-template';
const REORDER_TEMPLATE_AUTOTEST_ID = 'reorder-template';
const CREATE_TEMPLATE_AUTOTEST_ID = 'create-template';
const UPDATE_TEMPLATE_AUTOTEST_ID = 'update-template';
const TEMPLATE_SEARCH_AUTOTEST_ID = 'template-search';
const TEMPLATE_SEARCH_EMPTY_AUTOTEST_ID = 'template-search-empty';

const DROPPABLE_ID = 'pne-search-ui-templates';
const KEYBOARD_REORDER_SHORTCUTS = 'Alt+ArrowUp Alt+ArrowDown';
/** Short lists stay a plain menu; a search field appears once the list stops fitting at a glance. */
const SEARCH_FROM_TEMPLATE_COUNT = 10;

const normalizeSearch = (value: string) => value.trim().toLocaleLowerCase();

/**
 * Template names are rendered as React text, which escapes them already; hosts that keep
 * i18next's HTML escaping would otherwise show "EU/UK" as "EU&#x2F;UK".
 */
const RAW_NAME_INTERPOLATION = {escapeValue: false};

/**
 * Pointer and touch dragging on the grip only. Keyboard users reorder with Alt+Arrow on
 * the focused template, so arrow keys keep their usual menu navigation.
 */
const reorderSensors = [useMouseSensor, useImmediateTouchSensor];

/** Template names are user input; the prefix keeps them clear of object-key collisions. */
const toDraggableId = (templateName: string) => `template:${templateName}`;

/** A dragged row moves only vertically, so it never leaves the menu column. */
const lockToVerticalAxis = (style: DraggableProvidedDraggableProps['style']) => {
    if (!style?.transform) {
        return style
    }
    return {...style, transform: style.transform.replace(/translate\(\s*[^,]+,/, 'translate(0px,')}
}

type RowState = 'base' | 'focus' | 'hover'

/** Same state colors as a MUI MenuItem, painted on the whole row (grip, name and delete). */
const getRowBackground = (theme: Theme, selected: boolean, state: RowState) => {
    if (!selected) {
        if (state === 'focus') return theme.palette.action.focus
        if (state === 'hover') return theme.palette.action.hover
        return undefined
    }

    const stateOpacity = state === 'focus'
        ? theme.palette.action.focusOpacity
        : state === 'hover'
            ? theme.palette.action.hoverOpacity
            : 0
    return alpha(theme.palette.primary.main, Math.min(1, theme.palette.action.selectedOpacity + stateOpacity))
}

const SearchUITemplatesMenu = () => {
    const {t} = useTranslation();
    const autoTestScope = useSearchUIAutoTestScope()?.scope
    const menuId = useId()
    const confirm = useOptionalPneConfirm()

    const removeTemplate = useSearchUIFiltersStore(s => s.removeTemplate)
    const reorderTemplates = useSearchUIFiltersStore(s => s.reorderTemplates)
    const setTemplate = useSearchUIFiltersStore(s => s.setTemplate)
    const updateTemplate = useSearchUIFiltersStore(s => s.updateTemplate)
    const templates = useSearchUIFiltersStore(s => s.templates)
    const template = useSearchUIFiltersStore(s => s.template)
    const canPersistOrder = useSearchUIFiltersStore(s => Boolean(s.defaults.reorderSearchTemplates))
    // Phones keep the trigger at 30vw; the icon would leave the template name no room.
    const showTriggerIcon = useMediaQuery(useTheme().breakpoints.up('sm'), {noSsr: true})

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [editorOpen, setEditorOpen] = useState(false)
    const [editorSession, setEditorSession] = useState(0)
    const [announcement, setAnnouncement] = useState('')
    const [query, setQuery] = useState('')
    const searchInputRef = useRef<HTMLInputElement>(null)
    const draggingRef = useRef(false)
    const selectItemsRef = useRef(new Map<string, HTMLElement>())
    const pendingFocusRef = useRef<string | null>(null)

    const open = Boolean(anchorEl);
    const searchable = templates.length >= SEARCH_FROM_TEMPLATE_COUNT
    const normalizedQuery = searchable ? normalizeSearch(query) : ''
    const filtering = normalizedQuery !== ''
    const visibleTemplates = filtering
        ? templates.filter(item => normalizeSearch(item.name).includes(normalizedQuery))
        : templates
    // A move inside a filtered subset has no clear place among the hidden templates.
    const reorderable = canPersistOrder && templates.length > 1 && !filtering
    const placeholder = template?.name || t('react.searchUI.template');
    const removeTemplateLabel = t('react.searchUI.template.remove', {defaultValue: 'Remove template'})
    const reorderLabel = t('react.searchUI.template.reorder', {defaultValue: 'Drag to reorder'})
    const searchLabel = t('react.searchUI.template.search', {defaultValue: 'Search templates'})

    // Moving a row can detach its focused element; put focus back on the moved template.
    useLayoutEffect(() => {
        const templateName = pendingFocusRef.current
        pendingFocusRef.current = null
        const element = templateName ? selectItemsRef.current.get(templateName) : undefined
        if (element && element.ownerDocument.activeElement !== element) {
            element.focus()
        }
    }, [templates])

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Cleared on open rather than on close, so the closing menu keeps its filtered look.
        setQuery('')
        setAnchorEl(event.currentTarget);
    }
    const handleClose = () => {
        setAnchorEl(null);
    }
    const handleMenuClose = () => {
        // Escape cancels an active drag; it must not close the menu under the pointer.
        if (draggingRef.current) {
            return
        }
        handleClose()
    }
    const handleSelectTemplate = (template: SearchUITemplate) => {
        setTemplate(template, { forceSearch: true })
        handleClose()
    }
    const handleRemoveTemplate = async (template: SearchUITemplate) => {
        handleClose()
        if (confirm) {
            const accepted = await confirm.confirmDelete({
                autoTestValue: autoTestScope,
                title: t('react.searchUI.template.delete', {defaultValue: 'Delete template'}),
                message: t('react.searchUI.template.deleteMessage', {
                    defaultValue: 'Template “{{name}}” will be permanently deleted. This action can’t be undone.',
                    name: template.name,
                    interpolation: RAW_NAME_INTERPOLATION,
                }),
            })
            if (!accepted) {
                return
            }
        }
        removeTemplate(template)
    }
    const handleCreateTemplate = () => {
        handleClose()
        setEditorSession(session => session + 1)
        setEditorOpen(true)
    }
    const handleUpdateTemplate = () => {
        if (template) {
            updateTemplate(template.name)
        }
        handleClose()
    }

    const moveTemplate = (from: number, to: number) => {
        const templateNames = templates.map(item => item.name)
        const [moved] = templateNames.splice(from, 1)
        templateNames.splice(to, 0, moved)
        setAnnouncement(t('react.searchUI.template.moved', {
            defaultValue: '{{name}}: position {{position}} of {{count}}',
            name: moved,
            position: to + 1,
            count: templateNames.length,
            interpolation: RAW_NAME_INTERPOLATION,
        }))
        reorderTemplates(templateNames).catch((error: unknown) => {
            console.error(error)
            overlayActions.showTransientError({
                message: t('react.searchUI.template.reorderError', {
                    defaultValue: 'Couldn’t save the template order. Try again.',
                }),
            })
        })
    }

    const handleTemplateKeyDown = (event: React.KeyboardEvent, index: number) => {
        const up = event.key === 'ArrowUp'
        if (searchable && up && index === 0 && !event.altKey && !event.ctrlKey && !event.metaKey
            && !event.shiftKey) {
            event.preventDefault()
            event.stopPropagation()
            searchInputRef.current?.focus()
            return
        }
        if (!reorderable || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
            || (!up && event.key !== 'ArrowDown')) {
            return
        }
        event.preventDefault()
        event.stopPropagation()
        const target = up ? index - 1 : index + 1
        if (target < 0 || target >= templates.length) {
            return
        }
        pendingFocusRef.current = templates[index].name
        moveTemplate(index, target)
    }

    const handleSearchKeyDown = (event: React.KeyboardEvent) => {
        // Escape and Tab keep closing the menu as usual.
        if (event.key === 'Escape' || event.key === 'Tab') {
            return
        }
        // The menu's type-ahead and arrow navigation would otherwise pull focus out of the field.
        event.stopPropagation()
        const firstMatch = visibleTemplates[0]
        if (event.key === 'ArrowDown' && firstMatch) {
            event.preventDefault()
            selectItemsRef.current.get(firstMatch.name)?.focus()
        } else if (event.key === 'Enter' && filtering && firstMatch) {
            event.preventDefault()
            handleSelectTemplate(firstMatch)
        }
    }
    const revealSelectedTemplate = () => {
        // With the search field focused the menu does not focus, and so scroll to, the applied template.
        if (searchable && template) {
            selectItemsRef.current.get(template.name)?.scrollIntoView?.({block: 'center'})
        }
    }

    const handleDragStart = (_start: unknown, provided: ResponderProvided) => {
        draggingRef.current = true
        // The menu announces the result itself, in the user's language.
        provided.announce('')
    }
    const handleDragEnd = (result: DropResult, provided: ResponderProvided) => {
        provided.announce('')
        // Escape that cancelled the drag is still on its way to the menu: release on the next task.
        setTimeout(() => {
            draggingRef.current = false
        })
        const {destination, source} = result
        if (!destination || destination.droppableId !== DROPPABLE_ID || destination.index === source.index) {
            return
        }
        moveTemplate(source.index, destination.index)
    }

    return <>
        <PneButton
            {...createAutoTestAttributes(TEMPLATES_AUTOTEST_ID)}
            onClick={handleOpen}
            size={'small'}
            pneStyle='neutral'
            startIcon={showTriggerIcon ? <BookmarkBorderOutlinedIcon/> : undefined}
            endIcon={<ExpandMoreIcon/>}
            sx={templateTriggerSx}
            title={placeholder}
            aria-controls={open ? menuId : undefined}
            aria-expanded={open}
            aria-haspopup={'menu'}
        >
            <Box sx={templateTriggerLabelSx} component="span">{placeholder}</Box>
        </PneButton>
        <Box component={'span'} aria-live={'polite'} sx={visuallyHiddenSx}>{announcement}</Box>
        <Menu
            open={open}
            onClose={handleMenuClose}
            anchorEl={anchorEl}
            // A long list opens with the cursor in the search field instead of on a template.
            autoFocus={!searchable}
            slotProps={{
                paper: {sx: menuPaperSx},
                list: {
                    ...createAutoTestAttributes(TEMPLATES_PANEL_AUTOTEST_ID, autoTestScope),
                    id: menuId,
                    'aria-label': t('react.searchUI.template'),
                    sx: searchable ? searchableMenuListSx : menuListSx,
                },
                transition: {onEntered: revealSelectedTemplate},
            }}
        >
            {searchable ? <Box component={'li'} role={'none'} sx={menuSearchSx}>
                <PneTextField
                    aria-label={searchLabel}
                    autoComplete={'off'}
                    autoFocus
                    fullWidth
                    inputRef={searchInputRef}
                    onChange={event => setQuery(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchLabel}
                    slotProps={{
                        htmlInput: createAutoTestAttributes(TEMPLATE_SEARCH_AUTOTEST_ID),
                        input: {
                            startAdornment: <InputAdornment position={'start'} sx={searchAdornmentSx}>
                                <SearchRoundedIcon fontSize={'small'}/>
                            </InputAdornment>,
                            sx: searchInputSx,
                        },
                    }}
                    type={'search'}
                    value={query}
                />
            </Box> : null}
            {templates.length > 0 ? <DragDropContext
                enableDefaultSensors={false}
                sensors={reorderSensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Droppable droppableId={DROPPABLE_ID} isDropDisabled={!reorderable}>
                    {(droppable, droppableSnapshot) => <Box
                        component={'li'}
                        ref={droppable.innerRef}
                        {...droppable.droppableProps}
                        data-pne-search-template-list-dragging={
                            droppableSnapshot.draggingFromThisWith ? 'true' : undefined
                        }
                        role={'none'}
                        sx={templateListSx}
                    >
                        {visibleTemplates.map((item, index) => {
                            const selected = item.name === template?.name
                            return <Draggable
                                draggableId={toDraggableId(item.name)}
                                index={index}
                                isDragDisabled={!reorderable}
                                key={item.name}
                            >
                                {(draggable, snapshot) => <Box
                                    ref={draggable.innerRef}
                                    {...draggable.draggableProps}
                                    {...createAutoTestAttributes(TEMPLATE_ITEM_AUTOTEST_ID)}
                                    data-pne-search-template-row={'true'}
                                    style={lockToVerticalAxis(draggable.draggableProps.style)}
                                    sx={getTemplateRowSx(selected, snapshot.isDragging)}
                                >
                                    <MenuItem
                                        {...createAutoTestAttributes(SELECT_TEMPLATE_AUTOTEST_ID)}
                                        component={'button'}
                                        ref={(element: HTMLButtonElement | null) => {
                                            if (element) {
                                                selectItemsRef.current.set(item.name, element)
                                            } else {
                                                selectItemsRef.current.delete(item.name)
                                            }
                                        }}
                                        role={'menuitemradio'}
                                        aria-checked={selected}
                                        aria-keyshortcuts={reorderable ? KEYBOARD_REORDER_SHORTCUTS : undefined}
                                        selected={selected}
                                        title={item.name}
                                        onClick={() => handleSelectTemplate(item)}
                                        onKeyDown={event => handleTemplateKeyDown(event, index)}
                                        sx={selectItemSx}
                                    >
                                        <ListItemIcon sx={{color: selected ? 'primary.main' : 'transparent'}}>
                                            <CheckRoundedIcon fontSize={'small'}/>
                                        </ListItemIcon>
                                        <ListItemText primary={item.name} slotProps={{primary: {noWrap: true}}}/>
                                    </MenuItem>
                                    {reorderable ? <Box
                                        component={'span'}
                                        {...draggable.dragHandleProps}
                                        {...createAutoTestAttributes(REORDER_TEMPLATE_AUTOTEST_ID)}
                                        // Pointer-only grip; keyboard reordering lives on the template item.
                                        aria-describedby={undefined}
                                        aria-hidden={true}
                                        role={undefined}
                                        tabIndex={-1}
                                        data-pne-search-template-grip={'true'}
                                        title={reorderLabel}
                                        style={{touchAction: 'none'}}
                                        sx={gripSx}
                                    >
                                        <DragIndicatorIcon sx={{fontSize: 18}}/>
                                    </Box> : null}
                                    <MenuItem
                                        {...createAutoTestAttributes(REMOVE_TEMPLATE_AUTOTEST_ID)}
                                        component={'button'}
                                        aria-label={`${removeTemplateLabel}: ${item.name}`}
                                        data-pne-search-template-remove={'true'}
                                        title={`${removeTemplateLabel}: ${item.name}`}
                                        onClick={() => void handleRemoveTemplate(item)}
                                        sx={removeItemSx}
                                    >
                                        <CloseRoundedIcon sx={{fontSize: 18}}/>
                                    </MenuItem>
                                </Box>}
                            </Draggable>
                        })}
                        {droppable.placeholder}
                    </Box>}
                </Droppable>
            </DragDropContext> : null}
            {filtering && visibleTemplates.length === 0 ? <Box
                component={'li'}
                {...createAutoTestAttributes(TEMPLATE_SEARCH_EMPTY_AUTOTEST_ID)}
                role={'none'}
                sx={searchEmptySx}
            >
                {t('react.searchUI.template.noMatches', {defaultValue: 'No templates match'})}
            </Box> : null}
            <Box component={'li'} role={'none'} sx={menuFooterSx}>
                {templates.length > 0 ? <Divider sx={{mb: '4px'}}/> : null}
                <MenuItem
                    {...createAutoTestAttributes(CREATE_TEMPLATE_AUTOTEST_ID)}
                    component={'button'}
                    aria-haspopup={'dialog'}
                    onClick={handleCreateTemplate}
                    sx={actionItemSx}
                >
                    <ListItemIcon>
                        <BookmarkAddOutlinedIcon fontSize={'small'}/>
                    </ListItemIcon>
                    <ListItemText
                        primary={t('react.searchUI.template.saveAsNew', {
                            defaultValue: 'Save as new template',
                        })}
                    />
                </MenuItem>
                {template ? <MenuItem
                    {...createAutoTestAttributes(UPDATE_TEMPLATE_AUTOTEST_ID)}
                    component={'button'}
                    onClick={handleUpdateTemplate}
                    title={template.name}
                    sx={actionItemSx}
                >
                    <ListItemIcon>
                        <SaveOutlinedIcon fontSize={'small'}/>
                    </ListItemIcon>
                    <ListItemText
                        primary={t('react.searchUI.template.updateNamed', {
                            defaultValue: 'Update “{{name}}”',
                            name: template.name,
                            interpolation: RAW_NAME_INTERPOLATION,
                        })}
                        slotProps={{primary: {noWrap: true}}}
                    />
                </MenuItem> : null}
            </Box>
        </Menu>
        <SearchUITemplateEditor
            key={editorSession}
            open={editorOpen}
            onClose={() => setEditorOpen(false)}
        />
    </>
}

export default SearchUITemplatesMenu

const menuPaperSx: SxProps<Theme> = {
    boxSizing: 'border-box',
    mt: 0.5,
    // 20px wider than the layouts menu: the trailing grip and delete keep their place while hidden.
    width: 320,
    maxWidth: 'calc(100vw - 32px)',
}

const menuListSx: SxProps<Theme> = {
    // The sticky footer carries the bottom inset so it can sit flush with the paper edge.
    pb: 0,
}

/** Same for the sticky search field at the top. */
const searchableMenuListSx: SxProps<Theme> = {
    pb: 0,
    pt: 0,
}

const menuSearchSx: SxProps<Theme> = {
    backgroundColor: 'background.paper',
    backgroundImage: 'var(--Paper-overlay)',
    display: 'block',
    pb: 1,
    position: 'sticky',
    pt: 1,
    px: 1,
    top: 0,
    zIndex: 2,
}

/**
 * Field inset 8px + input inset 8px puts the magnifier on the menu icon column (16px),
 * and the 16px gap after it starts the query where template names start (52px).
 */
const searchInputSx: SxProps<Theme> = {
    pl: '8px',
}

const searchAdornmentSx: SxProps<Theme> = {
    mr: '16px',
}

const searchEmptySx: SxProps<Theme> = {
    color: 'text.secondary',
    display: 'block',
    // In line with the template names.
    pl: '52px',
    pr: 2,
    py: 1,
    typography: 'body2',
}

const templateListSx: SxProps<Theme> = {
    display: 'block',
    listStyle: 'none',
    m: 0,
    p: 0,
}

const revealOnRowSx = {
    opacity: 0,
    transition: 'opacity 120ms ease',
    '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
    },
    '@media (hover: none), (pointer: coarse)': {
        opacity: 1,
    },
}

const getTemplateRowSx = (selected: boolean, dragging: boolean): SxProps<Theme> => theme => ({
    alignItems: 'stretch',
    display: 'flex',
    minWidth: 0,
    position: 'relative',
    ...(dragging ? {
        backgroundColor: theme.palette.background.paper,
        // Keeps the dark-mode elevation tint of the menu paper on the lifted row.
        backgroundImage: selected
            ? `linear-gradient(${getRowBackground(theme, true, 'base')}, ${getRowBackground(theme, true, 'base')}), var(--Paper-overlay)`
            : 'var(--Paper-overlay)',
        borderRadius: '4px',
        boxShadow: theme.shadows[6],
        '& [data-pne-search-template-grip]': {opacity: 1, cursor: 'grabbing'},
        '& [data-pne-search-template-remove]': {opacity: 0},
    } : {
        backgroundColor: getRowBackground(theme, selected, 'base'),
        '&:hover': {
            backgroundColor: getRowBackground(theme, selected, 'hover'),
        },
        '&:has(.Mui-focusVisible)': {
            backgroundColor: getRowBackground(theme, selected, 'focus'),
        },
        '&:hover [data-pne-search-template-grip], &:has(.Mui-focusVisible) [data-pne-search-template-grip]': {
            opacity: 1,
        },
        '&:hover [data-pne-search-template-remove], &:has(.Mui-focusVisible) [data-pne-search-template-remove]': {
            opacity: 1,
        },
        // Rows passing under the lifted one are not hovered by the user; keep them at rest.
        '[data-pne-search-template-list-dragging] &': {
            backgroundColor: getRowBackground(theme, selected, 'base') ?? 'transparent',
        },
        '[data-pne-search-template-list-dragging] & [data-pne-search-template-grip], [data-pne-search-template-list-dragging] & [data-pne-search-template-remove]': {
            opacity: 0,
        },
    }),
})

/** Trailing grip next to delete, as in the table column settings: the leading column stays for icons. */
const gripSx: SxProps<Theme> = {
    ...revealOnRowSx,
    alignItems: 'center',
    color: 'text.secondary',
    cursor: 'grab',
    display: 'flex',
    flex: '0 0 32px',
    justifyContent: 'center',
    '@media (hover: none), (pointer: coarse)': {
        opacity: 1,
        flexBasis: '44px',
    },
}

const transparentItemStatesSx = {
    backgroundColor: 'transparent',
    '&:hover, &.Mui-focusVisible, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
        backgroundColor: 'transparent',
    },
}

const selectItemSx: SxProps<Theme> = {
    ...transparentItemStatesSx,
    flex: '1 1 auto',
    minWidth: 0,
    pr: 1,
    textAlign: 'left',
}

const removeItemSx: SxProps<Theme> = {
    ...transparentItemStatesSx,
    ...revealOnRowSx,
    color: 'text.secondary',
    flex: '0 0 44px',
    justifyContent: 'center',
    minWidth: 44,
    px: 0,
    '&:hover, &.Mui-focusVisible': {
        backgroundColor: 'transparent',
        color: 'error.main',
        opacity: 1,
    },
}

const menuFooterSx: SxProps<Theme> = {
    backgroundColor: 'background.paper',
    backgroundImage: 'var(--Paper-overlay)',
    bottom: 0,
    display: 'block',
    pb: 1,
    position: 'sticky',
    zIndex: 1,
}

const actionItemSx: SxProps<Theme> = {
    textAlign: 'left',
    width: '100%',
}

const visuallyHiddenSx: SxProps = {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: '1px',
}

const templateTriggerSx: SxProps = {
    maxWidth: {xs: '30vw', sm: '250px'},
    width: {xs: '30vw', sm: 'auto'},
    justifyContent: 'space-between',
    textAlign: 'left',
    px: '12px',
    '& .MuiButton-endIcon': {
        ml: '8px',
    },
}

const templateTriggerLabelSx: SxProps = {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}
