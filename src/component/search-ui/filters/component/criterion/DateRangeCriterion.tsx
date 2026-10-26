import React, { ChangeEvent, FocusEvent, useEffect, useMemo, useRef, useState } from 'react'
import { CriterionTypeEnum, DateRangeSpecType } from '../../types'
import SearchUIDateRangeSpecTypeSelect from '../select/SearchUIDateRangeSpecTypeSelect'
import dayjs, { Dayjs } from 'dayjs'
import { Box, FormHelperText, SxProps, useMediaQuery } from '@mui/material'
import { DateRange, DateRangePicker, LocalizationProvider } from '@mui/x-date-pickers-pro'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import type { FieldRef, PickerChangeHandlerContext } from '@mui/x-date-pickers/models'
import { useSearchUIFiltersStore, useSearchUIFiltersStoreApi } from '../../state/store'
import { PneTextField } from '../../../../..'
import { SearchUIOrderDateTypeSelect } from '../select/SearchUIOrderDateTypeSelect'
import { filtersInputSx } from './style'
import {
    createDateOnlyPickerDate,
    createDateOnlyPickerValue,
    isValidSearchUIDate,
    resolveDateOnlyTimeZone,
} from '../../dateRangeTimeZone'
import {createAutoTestAttributes} from '../../../../AutoTestAttribute'
import {useTranslation} from 'react-i18next'
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope'
import {
    SEARCH_UI_DATE_RANGE_END_BEFORE_START,
    SEARCH_UI_DATE_RANGE_INVALID_DATE,
} from '../../validation'
import {
    resolveSearchUIPickerLocale,
    SEARCH_UI_DATE_FORMAT,
    SEARCH_UI_DATE_TIME_FORMAT,
} from '../../datePickerLocale'

type Props = {
    showOrdersDateType?: boolean
}

type PickerRange = DateRange<Dayjs>

/**
 * How a commit treats an end the pickers hold as empty:
 * - `keep`: typing cleared it, and MUI reports a cleared section as an empty date, so the stored
 *   date stays until the field is left;
 * - `open`: the calendar left it empty, so the range is open on that side;
 * - `typed`: the field was left, so its sections tell an empty end from an unfinished one.
 */
type EmptyEndCommit = 'keep' | 'open' | 'typed'

const CRITERION_BEFORE_COUNT_AUTOTEST_ID = 'criterion-before-count'
const CRITERION_DATE_RANGE_AUTOTEST_ID = 'criterion-date-range'
const CRITERION_DATE_RANGE_PICKER_TOGGLE_AUTOTEST_ID = 'criterion-date-range-picker-toggle'
const CRITERION_DATE_RANGE_PICKER_AUTOTEST_ID = 'criterion-date-range-picker'
const CRITERION_DATE_OPTION_AUTOTEST_ID = 'criterion-date-option'
const CRITERION_TIME_OPTION_AUTOTEST_ID = 'criterion-time-option'
const CRITERION_DATE_TIME_FROM_AUTOTEST_ID = 'criterion-date-time-from'
const CRITERION_DATE_TIME_TO_AUTOTEST_ID = 'criterion-date-time-to'
const CRITERION_DATE_TIME_FROM_PICKER_TOGGLE_AUTOTEST_ID = 'criterion-date-time-from-picker-toggle'
const CRITERION_DATE_TIME_TO_PICKER_TOGGLE_AUTOTEST_ID = 'criterion-date-time-to-picker-toggle'
const CRITERION_DATE_TIME_FROM_PICKER_AUTOTEST_ID = 'criterion-date-time-from-picker'
const CRITERION_DATE_TIME_TO_PICKER_AUTOTEST_ID = 'criterion-date-time-to-picker'

/** A typed date that is unfinished or does not exist (31.02); validation reports it. */
const createInvalidDate = (): Date => new Date(Number.NaN)

/** A value that is not a Date (a string a template brought) gets a key of its own rather than a throw. */
const toDateKey = (date: Date | null): string => {
    if (date === null) {
        return ''
    }

    return date instanceof Date ? String(date.getTime()) : String(date)
}

const isSameStoredDate = (left: Date | null, right: Date | null): boolean => toDateKey(left) === toDateKey(right)

const hasTypedSection = (sections: ReadonlyArray<{ value: string }> | undefined): boolean => (
    !!sections?.some(section => section.value !== '')
)

export const DateRangeCriterion = (props: Props) => {
    const {t, i18n} = useTranslation()
    const { showOrdersDateType } = props
    const autoTestOwner = useSearchUIAutoTestScope()
    const storeApi = useSearchUIFiltersStoreApi()
    const pickerLocale = resolveSearchUIPickerLocale(i18n?.language)

    const dateRangeSpec = useSearchUIFiltersStore(s => s.dateRangeSpec)
    const setDateRangeCriterion = useSearchUIFiltersStore(s => s.setDateRangeCriterion)
    const timeSelectionEnabledInConfig = useSearchUIFiltersStore(
        s => !!s.config?.dateRange?.enableTimeSelection,
    )
    const dateOnlyTimeZone = useSearchUIFiltersStore(
        s => resolveDateOnlyTimeZone(s.config?.dateRange?.dateOnlyTimeZone),
    )
    const validationResult = useSearchUIFiltersStore(s => s.validationResult)

    const criterionType = showOrdersDateType
        ? CriterionTypeEnum.DATE_RANGE_ORDERS
        : CriterionTypeEnum.DATE_RANGE
    const dateErrors = validationResult.errors.filter(error => error.criterion === criterionType)
    const shownError = dateErrors[0]
    const fromInError = dateErrors.some(error => (
        error.code === SEARCH_UI_DATE_RANGE_INVALID_DATE && error.params.boundary === 'from'
    ))
    const toInError = dateErrors.some(error => (
        (error.code === SEARCH_UI_DATE_RANGE_INVALID_DATE && error.params.boundary === 'to')
        || error.code === SEARCH_UI_DATE_RANGE_END_BEFORE_START
    ))

    const changeBeforeCount = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const value = event.target.value
        let beforeCount = 0

        if (value) {
            beforeCount = Number.parseInt(value)
        }

        setDateRangeCriterion({
            ...dateRangeSpec,
            beforeCount: beforeCount,
        })
    }

    const exactDates = dateRangeSpec.dateRangeSpecType === 'EXACTLY'
    const daysOrHoursBefore = dateRangeSpec.dateRangeSpecType === 'DAYS_BEFORE'
        || dateRangeSpec.dateRangeSpecType === 'HOURS_BEFORE'
    const withInputNear = exactDates || daysOrHoursBefore
    const enableTimeSelection = !!showOrdersDateType || timeSelectionEnabledInConfig
    const beforeCountAriaLabel = dateRangeSpec.dateRangeSpecType === 'HOURS_BEFORE'
        ? t('react.searchUI.dateRange.hoursBefore', {defaultValue: 'Number of hours before'})
        : t('react.searchUI.dateRange.daysBefore', {defaultValue: 'Number of days before'})
    const exactDateRangeAriaLabel = t('react.searchUI.dateRange.exactRange', {
        defaultValue: 'Exact date range',
    })
    const exactDateRangePickerAriaLabel = t('react.searchUI.dateRange.exactCalendar', {
        defaultValue: 'Exact date range calendar',
    })
    const exactDateRangePickerAttributes = {
        ...createSearchUIOwnedAutoTestAttributes(
            CRITERION_DATE_RANGE_PICKER_AUTOTEST_ID,
            autoTestOwner,
        ),
        'aria-label': exactDateRangePickerAriaLabel,
    }
    const exactDateTimeFromAriaLabel = t('react.searchUI.dateRange.exactDateTimeFrom', {
        defaultValue: 'Exact date and time from',
    })
    const exactDateTimeToAriaLabel = t('react.searchUI.dateRange.exactDateTimeTo', {
        defaultValue: 'Exact date and time to',
    })
    const exactDateTimeFromPickerAttributes = {
        ...createSearchUIOwnedAutoTestAttributes(
            CRITERION_DATE_TIME_FROM_PICKER_AUTOTEST_ID,
            autoTestOwner,
        ),
        'aria-label': t('react.searchUI.dateRange.exactDateTimeFromPicker', {
            defaultValue: 'Exact start date and time picker',
        }),
    }
    const exactDateTimeToPickerAttributes = {
        ...createSearchUIOwnedAutoTestAttributes(
            CRITERION_DATE_TIME_TO_PICKER_AUTOTEST_ID,
            autoTestOwner,
        ),
        'aria-label': t('react.searchUI.dateRange.exactDateTimeToPicker', {
            defaultValue: 'Exact end date and time picker',
        }),
    }

    const toPickerDate = (date: Date | null): Dayjs | null => {
        if (date === null) {
            return null
        }

        if (!isValidSearchUIDate(date)) {
            return dayjs(Number.NaN)
        }

        if (enableTimeSelection) {
            return dayjs(date)
        }

        return createDateOnlyPickerValue(date, dateOnlyTimeZone)
    }

    const toStoredDate = (date: Dayjs | null): Date | null => {
        if (!date) {
            return null
        }

        if (!date.isValid()) {
            return createInvalidDate()
        }

        if (enableTimeSelection) {
            return dayjs(date).toDate()
        }

        return createDateOnlyPickerDate(date, dateOnlyTimeZone)
    }

    // The pickers keep what is being typed or picked; the store gets a date once it means a range.
    // The key keeps the picker value stable, so MUI does not rebuild the typed sections each render.
    const keyOfStoredRange = (from: Date | null, to: Date | null) => (
        `${toDateKey(from)}|${toDateKey(to)}|${enableTimeSelection}|${dateOnlyTimeZone ?? ''}`
    )
    const storedKey = keyOfStoredRange(dateRangeSpec.dateFrom, dateRangeSpec.dateTo)
    const storedRange = useMemo<PickerRange>(
        () => [toPickerDate(dateRangeSpec.dateFrom), toPickerDate(dateRangeSpec.dateTo)],
        // The key covers the stored instants and the settings the conversion reads.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [storedKey],
    )
    const [pickerRange, setPickerRange] = useState<PickerRange>(storedRange)
    const pickerRangeRef = useRef<PickerRange>(storedRange)
    const committedKeyRef = useRef(storedKey)
    const rangeFieldRef = useRef<FieldRef<PickerRange>>(null)
    const fromFieldRef = useRef<FieldRef<Dayjs | null>>(null)
    const toFieldRef = useRef<FieldRef<Dayjs | null>>(null)

    useEffect(() => {
        // A change from outside (a template, a preset, clearing) replaces what the pickers show;
        // dates this criterion committed itself leave the typed sections alone.
        if (storedKey === committedKeyRef.current) {
            return
        }
        committedKeyRef.current = storedKey
        pickerRangeRef.current = storedRange
        setPickerRange(storedRange)
    }, [storedKey, storedRange])

    const showPickerRange = (range: PickerRange) => {
        pickerRangeRef.current = range
        setPickerRange(range)
    }

    /** Only the field sections tell an empty end from an unfinished one: MUI reports null for both. */
    const readTypedEnds = (): [boolean, boolean] => {
        if (enableTimeSelection) {
            return [
                hasTypedSection(fromFieldRef.current?.getSections()),
                hasTypedSection(toFieldRef.current?.getSections()),
            ]
        }

        const sections = rangeFieldRef.current?.getSections() ?? []
        return [
            hasTypedSection(sections.filter(section => section.dateName === 'start')),
            hasTypedSection(sections.filter(section => section.dateName === 'end')),
        ]
    }

    const commitPickerRange = (range: PickerRange, emptyEnds: EmptyEndCommit) => {
        const stored = storeApi.getState().dateRangeSpec
        const typedEnds = emptyEnds === 'typed' ? readTypedEnds() : [false, false]
        const resolve = (date: Dayjs | null, storedDate: Date | null, typed: boolean): Date | null => {
            if (date !== null) {
                return toStoredDate(date)
            }
            if (emptyEnds === 'keep') {
                return storedDate
            }
            return typed ? createInvalidDate() : null
        }
        const dateFrom = resolve(range[0], stored.dateFrom, typedEnds[0])
        const dateTo = resolve(range[1], stored.dateTo, typedEnds[1])

        if (isSameStoredDate(dateFrom, stored.dateFrom) && isSameStoredDate(dateTo, stored.dateTo)) {
            return
        }

        committedKeyRef.current = keyOfStoredRange(dateFrom, dateTo)
        setDateRangeCriterion({
            ...stored,
            dateFrom,
            dateTo,
        })
    }

    const handleRangeChange = (range: PickerRange, context: PickerChangeHandlerContext<unknown>) => {
        showPickerRange(range)

        if (context.source === 'field') {
            commitPickerRange(range, 'keep')
        } else if ((range[0] === null) === (range[1] === null)) {
            // A lone first day waits for the second one or for the calendar to close.
            commitPickerRange(range, 'open')
        }
    }

    const handleBoundaryChange = (boundary: 'from' | 'to') => (
        date: Dayjs | null,
        context: PickerChangeHandlerContext<unknown>,
    ) => {
        const range: PickerRange = boundary === 'from'
            ? [date, pickerRangeRef.current[1]]
            : [pickerRangeRef.current[0], date]
        showPickerRange(range)
        commitPickerRange(range, context.source === 'field' ? 'keep' : 'open')
    }

    const commitTypedRange = () => {
        commitPickerRange(pickerRangeRef.current, 'typed')
    }

    const handleFieldBlur = (event: FocusEvent<HTMLElement>) => {
        // Moving between the sections of one field is not leaving it.
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
            return
        }
        commitTypedRange()
    }

    const handleSetDateRangeSpecType = (dateRangeSpecType: DateRangeSpecType) => {
        setDateRangeCriterion({
            ...dateRangeSpec,
            dateRangeSpecType: dateRangeSpecType,
        })
    }

    const isSmallScreen = useMediaQuery('(max-width:599px)')
    const stackDateTimePickers = enableTimeSelection && isSmallScreen
    const dateTimePickerWrapperSx: SxProps = stackDateTimePickers
        ? ({
            ...dateTimePickerContainerSx,
            ...stackedDateTimePickerContainerSx,
        } as SxProps)
        : dateTimePickerContainerSx
    const dateTimePickerInputSx = (stackDateTimePickers
        ? {...dateTimePickerFullWidthInputSx, ...fieldErrorSx}
        : {...filtersInputSx, ...fieldErrorSx}) as SxProps

    return <>
        <Box sx={{ display: 'flex', gap: '5px', py: '8px' }}>
            {showOrdersDateType ? <SearchUIOrderDateTypeSelect/> : null}
            <SearchUIDateRangeSpecTypeSelect/>
        </Box>
        <Box sx={{ display: 'flex', gap: '5px', pb: withInputNear ? '8px' : 0 }}>
            {withInputNear
                ? exactDates
                    ? <LocalizationProvider
                        dateAdapter={AdapterDayjs}
                        adapterLocale={pickerLocale.adapterLocale}
                        localeText={pickerLocale.localeText}
                    >
                        {enableTimeSelection
                            ? <Box sx={dateTimePickerWrapperSx}>
                                <DateTimePicker
                                    value={pickerRange[0]}
                                    onChange={handleBoundaryChange('from')}
                                    onClose={commitTypedRange}
                                    ampm={false}
                                    views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                                    format={SEARCH_UI_DATE_TIME_FORMAT}
                                    timeSteps={{
                                        minutes: 1,
                                        seconds: 1,
                                    }}
                                    slotProps={{
                                        day: ownerState => ({
                                            ...createAutoTestAttributes(
                                                CRITERION_DATE_OPTION_AUTOTEST_ID,
                                                ownerState.day.format('YYYY-MM-DD'),
                                            ),
                                            role: 'gridcell',
                                        }),
                                        digitalClockItem: {
                                            ...createAutoTestAttributes(CRITERION_TIME_OPTION_AUTOTEST_ID),
                                            role: 'option',
                                        },
                                        digitalClockSectionItem: {
                                            ...createAutoTestAttributes(CRITERION_TIME_OPTION_AUTOTEST_ID),
                                            role: 'option',
                                        },
                                        field: { fieldRef: fromFieldRef },
                                        mobilePaper: exactDateTimeFromPickerAttributes,
                                        openPickerButton: {
                                            ...createAutoTestAttributes(
                                                CRITERION_DATE_TIME_FROM_PICKER_TOGGLE_AUTOTEST_ID,
                                            ),
                                            type: 'button',
                                        },
                                        popper: {
                                            ...exactDateTimeFromPickerAttributes,
                                            placement: 'auto',
                                        },
                                        textField: {
                                            size: 'small',
                                            sx: dateTimePickerInputSx,
                                            variant: 'filled',
                                            // Replaces MUI's own verdict, which would also paint
                                            // a year outside 1900-2099 red.
                                            error: fromInError,
                                            onBlur: handleFieldBlur,
                                            slotProps: {
                                                htmlInput: { placeholder: SEARCH_UI_DATE_TIME_FORMAT },
                                                input: {
                                                    ...createAutoTestAttributes(
                                                        CRITERION_DATE_TIME_FROM_AUTOTEST_ID,
                                                    ),
                                                    'aria-label': exactDateTimeFromAriaLabel,
                                                    disableUnderline: true,
                                                },
                                            },
                                        },
                                    }}
                                />
                                <DateTimePicker
                                    value={pickerRange[1]}
                                    onChange={handleBoundaryChange('to')}
                                    onClose={commitTypedRange}
                                    ampm={false}
                                    views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                                    format={SEARCH_UI_DATE_TIME_FORMAT}
                                    timeSteps={{
                                        minutes: 1,
                                        seconds: 1,
                                    }}
                                    slotProps={{
                                        day: ownerState => ({
                                            ...createAutoTestAttributes(
                                                CRITERION_DATE_OPTION_AUTOTEST_ID,
                                                ownerState.day.format('YYYY-MM-DD'),
                                            ),
                                            role: 'gridcell',
                                        }),
                                        digitalClockItem: {
                                            ...createAutoTestAttributes(CRITERION_TIME_OPTION_AUTOTEST_ID),
                                            role: 'option',
                                        },
                                        digitalClockSectionItem: {
                                            ...createAutoTestAttributes(CRITERION_TIME_OPTION_AUTOTEST_ID),
                                            role: 'option',
                                        },
                                        field: { fieldRef: toFieldRef },
                                        mobilePaper: exactDateTimeToPickerAttributes,
                                        openPickerButton: {
                                            ...createAutoTestAttributes(
                                                CRITERION_DATE_TIME_TO_PICKER_TOGGLE_AUTOTEST_ID,
                                            ),
                                            type: 'button',
                                        },
                                        popper: {
                                            ...exactDateTimeToPickerAttributes,
                                            placement: 'auto',
                                        },
                                        textField: {
                                            size: 'small',
                                            sx: dateTimePickerInputSx,
                                            variant: 'filled',
                                            error: toInError,
                                            onBlur: handleFieldBlur,
                                            slotProps: {
                                                htmlInput: { placeholder: SEARCH_UI_DATE_TIME_FORMAT },
                                                input: {
                                                    ...createAutoTestAttributes(
                                                        CRITERION_DATE_TIME_TO_AUTOTEST_ID,
                                                    ),
                                                    'aria-label': exactDateTimeToAriaLabel,
                                                    disableUnderline: true,
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Box>
                            : <DateRangePicker
                                sx={dateRangePickerSx}
                                value={pickerRange}
                                onChange={handleRangeChange}
                                onClose={commitTypedRange}
                                format={SEARCH_UI_DATE_FORMAT}
                                slotProps={{
                                    day: ownerState => ({
                                        ...createAutoTestAttributes(
                                            CRITERION_DATE_OPTION_AUTOTEST_ID,
                                            ownerState.day.format('YYYY-MM-DD'),
                                        ),
                                        role: 'gridcell',
                                    }),
                                    field: { fieldRef: rangeFieldRef },
                                    mobilePaper: exactDateRangePickerAttributes,
                                    openPickerButton: {
                                        ...createAutoTestAttributes(
                                            CRITERION_DATE_RANGE_PICKER_TOGGLE_AUTOTEST_ID,
                                        ),
                                        type: 'button',
                                    },
                                    popper: {
                                        ...exactDateRangePickerAttributes,
                                        placement: 'auto',
                                    },
                                    textField: {
                                        size: 'small',
                                        sx: dateRangePickerSx,
                                        // Replaces MUI's own verdict, which would also paint
                                        // a year outside 1900-2099 red.
                                        error: dateErrors.length > 0,
                                        onBlur: handleFieldBlur,
                                        slotProps: {
                                            input: {
                                                ...createAutoTestAttributes(
                                                    CRITERION_DATE_RANGE_AUTOTEST_ID,
                                                ),
                                                'aria-label': exactDateRangeAriaLabel,
                                            },
                                        },
                                    },
                                }}
                            />}
                    </LocalizationProvider>
                    : <PneTextField
                        value={dateRangeSpec.beforeCount || ''}
                        onChange={changeBeforeCount}
                        type={'number'}
                        slotProps={{
                            htmlInput: {
                                ...createAutoTestAttributes(CRITERION_BEFORE_COUNT_AUTOTEST_ID),
                                'aria-label': beforeCountAriaLabel,
                                min: 1,
                            },
                            input: { disableUnderline: true },
                        }}
                        sx={{
                            ...filtersInputSx,
                            ml: '5px',
                            width: '80px',
                        }}
                        size={'small'}
                        variant={'filled'}
                    />
                : null}
        </Box>
        {shownError ? <FormHelperText error role={'alert'} sx={{mt: 0, mb: '8px'}}>
            {t(shownError.messageKey, shownError.params as Record<string, unknown>)}
        </FormHelperText> : null}
    </>
}

/** The fields have no visible outline or underline, so an error colors the date itself. */
const fieldErrorSx = {
    '& .MuiPickersInputBase-root.Mui-error': {
        color: 'error.main',
    },
}

const dateRangePickerSx: SxProps = {
    display: 'flex',
    flexDirection: 'column',
    height: '40px',
    '& .MuiFormLabel-root.MuiInputLabel-root': {
        display: 'none',
    },
    '& .MuiInputBase-input.MuiOutlinedInput-input': {
        p: '0 0 0 5px',
        height: '20px',
        fontSize: '14px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderRadius: '0',
        border: 'transparent !important',
    },
    '& .MuiFormControl-root.MuiTextField-root': {
        m: 0,
    },
    '& .MuiPickersOutlinedInput-root': {
        height: '40px',
    },
    '& .MuiPickersInputBase-sectionsContainer': {
        fontSize: '14px',
    },
    ...fieldErrorSx,
}

const dateTimePickerContainerSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    columnGap: '8px',
}

const stackedDateTimePickerContainerSx: SxProps = {
    flexDirection: 'column',
    alignItems: 'stretch',
    rowGap: '8px',
    columnGap: 0,
}

const dateTimePickerFullWidthInputSx: SxProps = {
    ...filtersInputSx,
    width: '100%',
}
