import React, { ChangeEvent } from 'react'
import { DateRangeSpecType } from '../../types'
import SearchUIDateRangeSpecTypeSelect from '../select/SearchUIDateRangeSpecTypeSelect'
import dayjs, { Dayjs } from 'dayjs'
import { Box, SxProps, useMediaQuery } from '@mui/material'
import { DateRange, DateRangePicker, LocalizationProvider } from '@mui/x-date-pickers-pro'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useSearchUIFiltersStore } from '../../state/store'
import { PneTextField } from '../../../../..'
import { SearchUIOrderDateTypeSelect } from '../select/SearchUIOrderDateTypeSelect'
import { filtersInputSx } from './style'
import {
    createDateOnlyPickerDate,
    createDateOnlyPickerValue,
    resolveDateOnlyTimeZone,
} from '../../dateRangeTimeZone'
import {createAutoTestAttributes} from '../../../../AutoTestAttribute'
import {useTranslation} from 'react-i18next'
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope'

type Props = {
    showOrdersDateType?: boolean
}

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
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

export const DateRangeCriterion = (props: Props) => {
    const {t} = useTranslation()
    const { showOrdersDateType } = props
    const autoTestOwner = useSearchUIAutoTestScope()

    const dateRangeSpec = useSearchUIFiltersStore(s => s.dateRangeSpec)
    const setDateRangeCriterion = useSearchUIFiltersStore(s => s.setDateRangeCriterion)
    const timeSelectionEnabledInConfig = useSearchUIFiltersStore(
        s => !!s.config?.dateRange?.enableTimeSelection,
    )
    const dateOnlyTimeZone = useSearchUIFiltersStore(
        s => resolveDateOnlyTimeZone(s.config?.dateRange?.dateOnlyTimeZone),
    )

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

    const createExactDate = (date: Dayjs | null): Date | null => {
        if (!date) {
            return null
        }

        if (enableTimeSelection) {
            return dayjs(date).toDate()
        }

        return createDateOnlyPickerDate(date, dateOnlyTimeZone)
    }

    const setExactDate = (from: Dayjs | null, to: Dayjs | null) => {
        setDateRangeCriterion({
            ...dateRangeSpec,
            dateFrom: createExactDate(from),
            dateTo: createExactDate(to),
        })
    }

    const handleSetDateRange = (dateRange: DateRange<Dayjs>) => {
        if (dateRangeSpec.dateRangeSpecType === 'EXACTLY') {
            setExactDate(dateRange[0], dateRange[1])
        } else {
            throw new Error('Impossible')
        }
    }

    const handleSetDateRangeSpecType = (dateRangeSpecType: DateRangeSpecType) => {
        setDateRangeCriterion({
            ...dateRangeSpec,
            dateRangeSpecType: dateRangeSpecType,
        })
    }

    const dateRange: DateRange<Dayjs> = enableTimeSelection
        ? [
            dateRangeSpec.dateFrom ? dayjs(dateRangeSpec.dateFrom) : null,
            dateRangeSpec.dateTo ? dayjs(dateRangeSpec.dateTo) : null,
        ]
        : [
            createDateOnlyPickerValue(dateRangeSpec.dateFrom, dateOnlyTimeZone),
            createDateOnlyPickerValue(dateRangeSpec.dateTo, dateOnlyTimeZone),
        ]

    const isSmallScreen = useMediaQuery('(max-width:599px)')
    const stackDateTimePickers = enableTimeSelection && isSmallScreen
    const dateTimePickerWrapperSx: SxProps = stackDateTimePickers
        ? ({
            ...dateTimePickerContainerSx,
            ...stackedDateTimePickerContainerSx,
        } as SxProps)
        : dateTimePickerContainerSx

    return <>
        <Box sx={{ display: 'flex', gap: '5px', py: '8px' }}>
            {showOrdersDateType ? <SearchUIOrderDateTypeSelect/> : null}
            <SearchUIDateRangeSpecTypeSelect/>
        </Box>
        <Box sx={{ display: 'flex', gap: '5px', pb: withInputNear ? '8px' : 0 }}>
            {withInputNear
                ? exactDates
                    ? <LocalizationProvider dateAdapter={AdapterDayjs}>
                        {enableTimeSelection
                            ? <Box sx={dateTimePickerWrapperSx}>
                                <DateTimePicker
                                    value={dateRange[0]}
                                    onChange={from => setExactDate(from, dateRange[1])}
                                    ampm={false}
                                    views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                                    format={DATE_TIME_FORMAT}
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
                                            sx: stackDateTimePickers ? dateTimePickerFullWidthInputSx : filtersInputSx,
                                            variant: 'filled',
                                            slotProps: {
                                                htmlInput: { placeholder: DATE_TIME_FORMAT },
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
                                    value={dateRange[1]}
                                    onChange={to => setExactDate(dateRange[0], to)}
                                    ampm={false}
                                    views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                                    format={DATE_TIME_FORMAT}
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
                                            sx: stackDateTimePickers ? dateTimePickerFullWidthInputSx : filtersInputSx,
                                            variant: 'filled',
                                            slotProps: {
                                                htmlInput: { placeholder: DATE_TIME_FORMAT },
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
                                value={dateRange}
                                onChange={handleSetDateRange}
                                slotProps={{
                                    day: ownerState => ({
                                        ...createAutoTestAttributes(
                                            CRITERION_DATE_OPTION_AUTOTEST_ID,
                                            ownerState.day.format('YYYY-MM-DD'),
                                        ),
                                        role: 'gridcell',
                                    }),
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
    </>
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
