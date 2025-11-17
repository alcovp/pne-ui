import React, { ChangeEvent } from 'react'
import { DateRangeSpecType } from '../../types'
import SearchUIDateRangeSpecTypeSelect from '../select/SearchUIDateRangeSpecTypeSelect'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Box, SxProps, useMediaQuery } from '@mui/material'
import { DateRange, DateRangePicker, LocalizationProvider } from '@mui/x-date-pickers-pro'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useSearchUIFiltersStore } from '../../state/store'
import timezone from 'dayjs/plugin/timezone'
import { PneTextField } from '../../../../..'
import { SearchUIOrderDateTypeSelect } from '../select/SearchUIOrderDateTypeSelect'
import { filtersInputSx } from './style'

dayjs.extend(utc)
dayjs.extend(timezone)

type Props = {
    showOrdersDateType?: boolean
}

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

export const DateRangeCriterion = (props: Props) => {
    const { showOrdersDateType } = props

    const dateRangeSpec = useSearchUIFiltersStore(s => s.dateRangeSpec)
    const setDateRangeCriterion = useSearchUIFiltersStore(s => s.setDateRangeCriterion)
    const timeSelectionEnabledInConfig = useSearchUIFiltersStore(
        s => !!s.config?.dateRange?.enableTimeSelection,
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

    const setExactDate = (from: Dayjs | null, to: Dayjs | null) => {
        setDateRangeCriterion({
            ...dateRangeSpec,
            dateFrom: from ? dayjs(from).toDate() : null,
            dateTo: to ? dayjs(to).toDate() : null,
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

    const dateRange: DateRange<Dayjs> = [
        dateRangeSpec.dateFrom ? dayjs(dateRangeSpec.dateFrom) : null,
        dateRangeSpec.dateTo ? dayjs(dateRangeSpec.dateTo) : null,
    ]

    const enableTimeSelection = showOrdersDateType || timeSelectionEnabledInConfig
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
                                        textField: {
                                            size: 'small',
                                            placeholder: DATE_TIME_FORMAT,
                                            sx: stackDateTimePickers ? dateTimePickerFullWidthInputSx : filtersInputSx,
                                            variant: 'filled',
                                            InputProps: { disableUnderline: true },
                                        },
                                        popper: { placement: 'auto' },
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
                                        textField: {
                                            size: 'small',
                                            placeholder: DATE_TIME_FORMAT,
                                            sx: stackDateTimePickers ? dateTimePickerFullWidthInputSx : filtersInputSx,
                                            variant: 'filled',
                                            InputProps: { disableUnderline: true },
                                        },
                                        popper: { placement: 'auto' },
                                    }}
                                />
                            </Box>
                            : <DateRangePicker
                                sx={dateRangePickerSx}
                                value={dateRange}
                                onChange={handleSetDateRange}
                                slotProps={{
                                    fieldSeparator: { sx: { display: 'none' } },
                                    popper: { placement: 'auto' },
                                }}
                            />}
                    </LocalizationProvider>
                    : <PneTextField
                        value={dateRangeSpec.beforeCount || ''}
                        onChange={changeBeforeCount}
                        type={'number'}
                        inputProps={{ min: 1 }}
                        sx={{
                            ...filtersInputSx,
                            ml: '5px',
                            width: '80px',
                        }}
                        size={'small'}
                        variant={'filled'}
                        InputProps={{
                            disableUnderline: true,
                        }}
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
