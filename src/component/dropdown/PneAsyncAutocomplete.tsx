/* eslint-disable react/prop-types -- TypeScript validates this generic MUI-derived prop contract. */
import React, {
    ReactNode,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'
import {
    Autocomplete,
    type AutocompleteInputChangeReason,
    AutocompleteProps,
    CircularProgress,
    SxProps,
} from '@mui/material'
import type {ChipTypeMap} from '@mui/material/Chip'
import {useThemeProps} from '@mui/material/styles'
import {
    dropDownSx,
    getOptionKey as getBuiltInOptionKey,
    getOptionLabel as getBuiltInOptionLabel,
    isOptionEqualToValue as areBuiltInOptionsEqual,
    PneAutocompleteKey,
    PneAutocompleteOption,
    PneBuiltInAutocompleteOption,
} from '../../common/paynet/dropdown'
import PneTextField from '../PneTextField'
import {mergeAriaDescribedBy, usePneFieldControlProps} from '../PneFieldContext'
import type {
    PneAutocompleteBuiltInProps,
    PneAutocompleteCustomProps,
} from './PneAutocomplete'
import {
    areAutocompleteOptionsEqualBy,
    hasAutocompleteLabel,
    mergeAutocompleteHtmlInputProps,
    type PneAutocompleteHtmlInputProps,
    resolveAutocompleteListboxName,
    sanitizeAutocompleteHtmlInputProps,
    withAutocompleteListboxName,
    withoutAutocompleteRootSlot,
} from './PneAutocompleteShared'

export type PneAsyncAutocompleteLoadReason = 'open' | 'input' | 'clear' | 'reload'

export interface PneAsyncAutocompleteLoadContext {
    signal: AbortSignal
    reason: PneAsyncAutocompleteLoadReason
}

export interface PneAsyncAutocompleteLoadErrorContext extends PneAsyncAutocompleteLoadContext {
    query: string
}

export type PneLoadOptions<T> = (
    query: string,
    context: PneAsyncAutocompleteLoadContext,
) => Promise<readonly T[]>

export type PneAsyncAutocompleteHtmlInputProps = PneAutocompleteHtmlInputProps

interface PneAsyncAutocompleteOwnedProps<T extends PneAutocompleteOption> {
    /** Initial popup state when `open` is uncontrolled. @default false */
    defaultOpen?: boolean
    /** Loads remote options immediately for the supplied query. This component does not debounce calls. */
    loadOptions: PneLoadOptions<T>
    /** The minimum query length required before calling `loadOptions`. */
    minQueryLength?: number
    /** Changing this value while open reloads the current query. Loader identity changes do not. */
    reloadKey?: unknown
    /** Keeps previous options during the next load. Errors and ineligible queries still clear them. @default false */
    keepPreviousOptions?: boolean
    /** Text shown and announced after a load failure. */
    loadErrorText?: ReactNode
    /** Text shown and announced while the query is shorter than `minQueryLength`. */
    minQueryLengthText?: ReactNode | ((minimum: number, query: string) => ReactNode)
    onLoadError?: (error: unknown, context: PneAsyncAutocompleteLoadErrorContext) => void
}

export type PneAsyncAutocompleteBuiltInProps<
    T extends PneBuiltInAutocompleteOption,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> = Omit<
    PneAutocompleteBuiltInProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>,
    'filterOptions' | 'loading' | 'options'
> & PneAsyncAutocompleteOwnedProps<T>

export type PneAsyncAutocompleteCustomProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> = Omit<
    PneAutocompleteCustomProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>,
    'filterOptions' | 'loading' | 'options'
> & PneAsyncAutocompleteOwnedProps<T>

export type PneAsyncAutocompleteProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> = [T] extends [PneBuiltInAutocompleteOption]
    ? PneAsyncAutocompleteBuiltInProps<
        Extract<T, PneBuiltInAutocompleteOption>,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    : PneAsyncAutocompleteCustomProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >

type MuiAutocompleteProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>

type PneAsyncAutocompleteImplementationProps<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = Omit<
    PneAsyncAutocompleteCustomProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >,
    'getOptionKey' | 'getOptionLabel' | 'isOptionEqualToValue'
> & Pick<
    MuiAutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>,
    'getOptionKey' | 'getOptionLabel' | 'isOptionEqualToValue'
>

type OptionKeyResolver<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = NonNullable<MuiAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['getOptionKey']>

type OptionLabelResolver<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = NonNullable<MuiAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['getOptionLabel']>

type OptionEquality<
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = NonNullable<MuiAutocompleteProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>['isOptionEqualToValue']>

type LoadState = 'idle' | 'loading' | 'loaded' | 'error' | 'min-query'

interface PendingInputTransition {
    query: string
    reason: AutocompleteInputChangeReason
}

const useAsyncLifecycleEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type PneAsyncAutocompleteInferredCustomProps<
    Result extends readonly PneAutocompleteOption[],
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
> = Omit<
    PneAsyncAutocompleteCustomProps<
        NoInfer<Result[number]>,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >,
    'loadOptions'
> & {
    loadOptions: (
        ...args: Parameters<PneLoadOptions<Result[number]>>
    ) => Promise<Result>
}

type PneAsyncAutocompleteComponent = {
    <
        const Result extends readonly PneAutocompleteOption[],
        Multiple extends boolean | undefined = false,
        DisableClearable extends boolean | undefined = false,
        FreeSolo extends boolean | undefined = false,
        ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
    >(props: PneAsyncAutocompleteInferredCustomProps<
        Result,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >): React.JSX.Element
    <
        T extends PneBuiltInAutocompleteOption,
        Multiple extends boolean | undefined = false,
        DisableClearable extends boolean | undefined = false,
        FreeSolo extends boolean | undefined = false,
        ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
    >(props: PneAsyncAutocompleteBuiltInProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >): React.JSX.Element
    <
        T extends PneAutocompleteOption,
        Multiple extends boolean | undefined = false,
        DisableClearable extends boolean | undefined = false,
        FreeSolo extends boolean | undefined = false,
        ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
    >(props: PneAsyncAutocompleteCustomProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >): React.JSX.Element
    displayName?: string
}

const PneAsyncAutocompleteImplementation = <
    T extends PneAutocompleteOption,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
>(rawProps: PneAsyncAutocompleteImplementationProps<
    T,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
>) => {
    const props = rawProps as typeof rawProps & {as?: unknown; component?: unknown}
    const {
        as: _as,
        component: _component,
        defaultOpen = false,
        disabled,
        error,
        fullWidth,
        getOptionKey,
        getOptionLabel,
        helperText,
        htmlInputProps,
        id: idProp,
        inputRef,
        inputValue: controlledInputValue,
        isOptionEqualToValue,
        keepPreviousOptions = false,
        label,
        loadErrorText = 'Unable to load options',
        loadOptions,
        loadingText,
        minQueryLength = 0,
        minQueryLengthText = defaultMinQueryLengthText,
        noOptionsText,
        onClose,
        onInputChange,
        onLoadError,
        onOpen,
        open: controlledOpen,
        placeholder,
        ref,
        reloadKey,
        required,
        size = 'small',
        slotProps,
        slots,
        sx,
        variant,
        ...rest
    } = props

    const generatedId = useId()
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
    const [uncontrolledQuery, setUncontrolledQuery] = useState('')
    const [options, setOptions] = useState<readonly T[]>([])
    const [loadState, setLoadState] = useState<LoadState>('idle')
    const requestIdRef = useRef(0)
    const controllerRef = useRef<AbortController | undefined>(undefined)
    const loadOptionsRef = useRef(loadOptions)
    const onLoadErrorRef = useRef(onLoadError)
    const keepPreviousOptionsRef = useRef(keepPreviousOptions)
    const minQueryLengthRef = useRef(normalizeMinQueryLength(minQueryLength))
    const pendingInputTransitionsRef = useRef<PendingInputTransition[]>([])

    const isOpenControlled = controlledOpen !== undefined
    const isInputValueControlled = controlledInputValue !== undefined
    const open = controlledOpen ?? uncontrolledOpen
    const query = controlledInputValue ?? uncontrolledQuery
    const normalizedMinQueryLength = normalizeMinQueryLength(minQueryLength)
    const localizedTextProps = useThemeProps({
        name: 'MuiAutocomplete',
        props: {loadingText, noOptionsText},
    })
    const resolvedLoadingText = localizedTextProps.loadingText === undefined
        ? 'Loading…'
        : localizedTextProps.loadingText
    const resolvedDefaultNoOptionsText = localizedTextProps.noOptionsText === undefined
        ? 'No options'
        : localizedTextProps.noOptionsText
    const loading = loadState === 'loading'
    const controlProps = usePneFieldControlProps({
        disabled,
        error,
        fullWidth,
        id: idProp,
        required,
    })
    const id = controlProps.id ?? generatedId
    const statusId = `${id}-async-status`
    const safeHtmlInputProps = sanitizeAutocompleteHtmlInputProps(htmlInputProps)
    const resolvedOptionKey = (getOptionKey ?? getBuiltInOptionKey) as OptionKeyResolver<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    const resolvedOptionLabel = (getOptionLabel ?? getBuiltInOptionLabel) as OptionLabelResolver<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    const resolvedOptionEquality = (isOptionEqualToValue ?? (getOptionKey
        ? (option: T, value: unknown) => areAutocompleteOptionsEqualBy(
            option,
            value,
            resolvedOptionKey as (option: T) => PneAutocompleteKey,
        )
        : areBuiltInOptionsEqual)) as OptionEquality<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >
    const listboxName = resolveAutocompleteListboxName({
        controlLabelId: controlProps.labelId,
        hasTextFieldLabel: hasAutocompleteLabel(label),
        htmlInputProps: safeHtmlInputProps,
        inputId: id,
    })
    const resolvedSlotProps = withAutocompleteListboxName(slotProps, listboxName)
    const resolvedSlots = withoutAutocompleteRootSlot(slots)
    const innerSx: SxProps = [
        dropDownSx,
        ...(Array.isArray(sx) ? sx : [sx]),
    ]

    const abortCurrentRequest = useCallback(() => {
        requestIdRef.current += 1
        controllerRef.current?.abort()
        controllerRef.current = undefined
    }, [])

    useAsyncLifecycleEffect(() => {
        loadOptionsRef.current = loadOptions
        onLoadErrorRef.current = onLoadError
        keepPreviousOptionsRef.current = keepPreviousOptions
        minQueryLengthRef.current = normalizedMinQueryLength
    }, [
        keepPreviousOptions,
        loadOptions,
        normalizedMinQueryLength,
        onLoadError,
    ])

    const committedRequestInputsRef = useRef({
        minQueryLength: normalizedMinQueryLength,
        open,
        query,
        reloadKey,
    })

    useAsyncLifecycleEffect(() => {
        const previous = committedRequestInputsRef.current
        const requestInputsChanged = previous.open && (
            !open
            || previous.query !== query
            || !Object.is(previous.reloadKey, reloadKey)
            || previous.minQueryLength !== normalizedMinQueryLength
        )

        if (requestInputsChanged) {
            abortCurrentRequest()
        }

        committedRequestInputsRef.current = {
            minQueryLength: normalizedMinQueryLength,
            open,
            query,
            reloadKey,
        }
    }, [
        abortCurrentRequest,
        normalizedMinQueryLength,
        open,
        query,
        reloadKey,
    ])

    const stopLoading = useCallback((clearOptions: boolean) => {
        abortCurrentRequest()
        setLoadState('idle')
        if (clearOptions) {
            setOptions([])
        }
    }, [abortCurrentRequest])

    const beginLoad = useCallback((nextQuery: string, reason: PneAsyncAutocompleteLoadReason) => {
        controllerRef.current?.abort()
        const requestId = ++requestIdRef.current

        if (nextQuery.length < minQueryLengthRef.current) {
            controllerRef.current = undefined
            setOptions([])
            setLoadState('min-query')
            return
        }

        const controller = new AbortController()
        const context: PneAsyncAutocompleteLoadContext = {
            reason,
            signal: controller.signal,
        }
        const loader = loadOptionsRef.current
        controllerRef.current = controller

        if (!keepPreviousOptionsRef.current) {
            setOptions([])
        }
        setLoadState('loading')

        void Promise.resolve()
            .then(() => {
                if (controller.signal.aborted || requestIdRef.current !== requestId) {
                    return [] as readonly T[]
                }

                return loader(nextQuery, context)
            })
            .then(
                result => {
                    if (controller.signal.aborted || requestIdRef.current !== requestId) {
                        return
                    }

                    controllerRef.current = undefined
                    setOptions(result)
                    setLoadState('loaded')
                },
                loadError => {
                    if (controller.signal.aborted || requestIdRef.current !== requestId) {
                        return
                    }

                    controllerRef.current = undefined
                    if (isAbortError(loadError)) {
                        setLoadState('idle')
                        return
                    }

                    setOptions([])
                    setLoadState('error')
                    onLoadErrorRef.current?.(loadError, {
                        ...context,
                        query: nextQuery,
                    })
                },
            )
    }, [])

    const previousOpenRef = useRef(false)
    const previousQueryRef = useRef(query)
    const previousReloadKeyRef = useRef(reloadKey)
    const previousMinQueryLengthRef = useRef(normalizedMinQueryLength)

    useEffect(() => {
        const wasOpen = previousOpenRef.current
        const previousQuery = previousQueryRef.current
        const reloadKeyChanged = !Object.is(previousReloadKeyRef.current, reloadKey)
        const minQueryLengthChanged = previousMinQueryLengthRef.current !== normalizedMinQueryLength
        const queryChanged = previousQuery !== query
        const pendingInputTransitionIndex = queryChanged
            ? findLastTransitionIndex(pendingInputTransitionsRef.current, query)
            : -1
        const pendingInputTransition = pendingInputTransitionIndex >= 0
            ? pendingInputTransitionsRef.current[pendingInputTransitionIndex]
            : undefined

        previousOpenRef.current = open
        previousQueryRef.current = query
        previousReloadKeyRef.current = reloadKey
        previousMinQueryLengthRef.current = normalizedMinQueryLength

        if (pendingInputTransitionIndex >= 0) {
            pendingInputTransitionsRef.current.splice(0, pendingInputTransitionIndex + 1)
        }

        if (!open) {
            pendingInputTransitionsRef.current = []
            if (wasOpen) {
                stopLoading(true)
            }
            return
        }

        if (!wasOpen) {
            pendingInputTransitionsRef.current = []
            beginLoad(query, 'open')
            return
        }

        if (reloadKeyChanged || minQueryLengthChanged) {
            beginLoad(query, 'reload')
            return
        }

        if (!queryChanged) {
            return
        }

        if (!pendingInputTransition || pendingInputTransition.query !== query) {
            beginLoad(query, 'input')
            return
        }

        if (pendingInputTransition.reason === 'input' || pendingInputTransition.reason === 'clear') {
            beginLoad(query, pendingInputTransition.reason)
            return
        }

        // Selection/reset/blur changes update the tracked query but do not start a remote search.
        stopLoading(false)
    }, [
        beginLoad,
        normalizedMinQueryLength,
        open,
        query,
        reloadKey,
        stopLoading,
    ])

    useEffect(() => () => {
        requestIdRef.current += 1
        controllerRef.current?.abort()
        previousOpenRef.current = false
    }, [])

    const handleOpen: NonNullable<MuiAutocompleteProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >['onOpen']> = event => {
        if (!isOpenControlled) {
            setUncontrolledOpen(true)
        }
        onOpen?.(event)
    }

    const handleClose: NonNullable<MuiAutocompleteProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >['onClose']> = (event, reason) => {
        if (!isOpenControlled) {
            setUncontrolledOpen(false)
            stopLoading(true)
        }
        onClose?.(event, reason)
    }

    const handleInputChange: NonNullable<MuiAutocompleteProps<
        T,
        Multiple,
        DisableClearable,
        FreeSolo,
        ChipComponent
    >['onInputChange']> = (event, value, reason) => {
        const isSameQueryClear = reason === 'clear' && value === query

        if (isSameQueryClear) {
            pendingInputTransitionsRef.current = []
            if (open) {
                beginLoad(value, 'clear')
            }
        } else {
            pendingInputTransitionsRef.current.push({query: value, reason})
            if (pendingInputTransitionsRef.current.length > 20) {
                pendingInputTransitionsRef.current.shift()
            }
        }
        if (!isInputValueControlled) {
            setUncontrolledQuery(value)
        }
        onInputChange?.(event, value, reason)
    }

    const statusContent = resolveStatusContent({
        loadErrorText,
        loadingText: resolvedLoadingText,
        minQueryLength: normalizedMinQueryLength,
        minQueryLengthText,
        noOptionsText: resolvedDefaultNoOptionsText,
        open,
        optionsCount: options.length,
        query,
        state: loadState,
    })
    const resolvedNoOptionsText = loadState === 'error'
        ? loadErrorText
        : loadState === 'min-query'
            ? resolveMinQueryLengthText(minQueryLengthText, normalizedMinQueryLength, query)
            : resolvedDefaultNoOptionsText

    return <>
        <Autocomplete<T, Multiple, DisableClearable, FreeSolo, ChipComponent>
            {...rest as unknown as MuiAutocompleteProps<
                T,
                Multiple,
                DisableClearable,
                FreeSolo,
                ChipComponent
            >}
            disabled={controlProps.disabled}
            filterOptions={remoteOptions => remoteOptions}
            fullWidth={controlProps.fullWidth}
            getOptionKey={resolvedOptionKey}
            getOptionLabel={resolvedOptionLabel}
            id={id}
            inputValue={controlledInputValue}
            isOptionEqualToValue={resolvedOptionEquality}
            loading={loading}
            loadingText={resolvedLoadingText}
            noOptionsText={resolvedNoOptionsText}
            onClose={handleClose}
            onInputChange={handleInputChange}
            onOpen={handleOpen}
            open={open}
            options={options}
            ref={ref}
            renderInput={params => <PneTextField
                {...params}
                error={controlProps.error ?? false}
                helperText={helperText}
                inputRef={inputRef}
                label={label}
                placeholder={placeholder}
                required={controlProps.required}
                slotProps={{
                    ...params.slotProps,
                    input: {
                        ...params.slotProps.input,
                        endAdornment: <>
                            {loading ? <CircularProgress color="inherit" size={20}/> : null}
                            {params.slotProps.input.endAdornment}
                        </>,
                    },
                    htmlInput: (() => {
                        const mergedInputProps = mergeAutocompleteHtmlInputProps(
                            params.slotProps.htmlInput,
                            safeHtmlInputProps,
                        )

                        return {
                            ...mergedInputProps as Record<string, unknown>,
                            'aria-busy': loading,
                            'aria-describedby': mergeAriaDescribedBy(
                                getString(mergedInputProps['aria-describedby']),
                                controlProps.ariaDescribedBy,
                                statusContent === undefined ? undefined : statusId,
                            ),
                        }
                    })(),
                }}
                variant={variant}
            />}
            size={size}
            slotProps={resolvedSlotProps}
            slots={resolvedSlots}
            sx={innerSx}
        />
        {statusContent === undefined ? null : <span
            aria-atomic="true"
            aria-live={loadState === 'error' ? 'assertive' : 'polite'}
            id={statusId}
            role={loadState === 'error' ? 'alert' : 'status'}
            style={visuallyHiddenStyle}
        >
            {statusContent}
        </span>}
    </>
}

interface StatusContentOptions {
    loadErrorText: ReactNode
    loadingText?: ReactNode
    minQueryLength: number
    minQueryLengthText: ReactNode | ((minimum: number, query: string) => ReactNode)
    noOptionsText?: ReactNode
    open: boolean
    optionsCount: number
    query: string
    state: LoadState
}

const resolveStatusContent = ({
    loadErrorText,
    loadingText,
    minQueryLength,
    minQueryLengthText,
    noOptionsText,
    open,
    optionsCount,
    query,
    state,
}: StatusContentOptions): ReactNode | undefined => {
    if (!open) {
        return undefined
    }

    switch (state) {
        case 'loading':
            return loadingText === undefined ? 'Loading…' : loadingText
        case 'error':
            return loadErrorText
        case 'min-query':
            return resolveMinQueryLengthText(minQueryLengthText, minQueryLength, query)
        case 'loaded':
            return optionsCount === 0
                ? (noOptionsText === undefined ? 'No options' : noOptionsText)
                : undefined
        case 'idle':
            return undefined
    }
}

const defaultMinQueryLengthText = (minimum: number): ReactNode =>
    `Enter at least ${minimum} ${minimum === 1 ? 'character' : 'characters'}`

const resolveMinQueryLengthText = (
    text: ReactNode | ((minimum: number, query: string) => ReactNode),
    minimum: number,
    query: string,
): ReactNode => typeof text === 'function' ? text(minimum, query) : text

const normalizeMinQueryLength = (minimum: number): number =>
    Number.isFinite(minimum) ? Math.max(0, Math.floor(minimum)) : 0

const isAbortError = (error: unknown): boolean =>
    typeof error === 'object'
    && error !== null
    && 'name' in error
    && error.name === 'AbortError'

const findLastTransitionIndex = (
    transitions: PendingInputTransition[],
    query: string,
): number => {
    for (let index = transitions.length - 1; index >= 0; index -= 1) {
        if (transitions[index].query === query) {
            return index
        }
    }

    return -1
}

const getString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined

const visuallyHiddenStyle: React.CSSProperties = {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
}

const PneAsyncAutocomplete = PneAsyncAutocompleteImplementation as PneAsyncAutocompleteComponent

PneAsyncAutocomplete.displayName = 'PneAsyncAutocomplete'

export default PneAsyncAutocomplete
