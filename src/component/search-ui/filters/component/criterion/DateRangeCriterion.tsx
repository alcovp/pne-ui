import React, {ChangeEvent} from 'react';
import {DateRangeSpecType} from '../../types';
import SearchUIDateRangeSpecTypeSelect from '../select/SearchUIDateRangeSpecTypeSelect';
import dayjs, {Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {Box, SxProps} from '@mui/material';
import {DateRange, DateRangePicker, LocalizationProvider} from '@mui/x-date-pickers-pro'; //TODO migration
import {AdapterDayjs} from '@mui/x-date-pickers-pro/AdapterDayjs';
import {useSearchUIFiltersStore} from '../../state/store';
import timezone from 'dayjs/plugin/timezone';
import {PneTextField} from '../../../../..';
import {SearchUIOrderDateTypeSelect} from "../select/SearchUIOrderDateTypeSelect";

dayjs.extend(utc)
dayjs.extend(timezone)

type Props = {
    showOrdersDateType?: boolean
}

export const DateRangeCriterion = (props: Props) => {
    const {showOrdersDateType} = props

    const {
        dateRangeSpec,
        setDateRangeCriterion,
        orderDateType,
        setDateRangeCriterionOrderDateType,
    } = useSearchUIFiltersStore((store) => ({
        dateRangeSpec: store.dateRangeSpec,
        setDateRangeCriterion: store.setDateRangeCriterion,
        orderDateType: store.orderDateType,
        setDateRangeCriterionOrderDateType: store.setDateRangeCriterionOrderDateType,
    }))

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
            dateFrom: dayjs(from).toDate(),
            dateTo: dayjs(to).toDate(),
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

    const dateRange: [Dayjs, Dayjs] = [
        dayjs(dateRangeSpec.dateFrom),
        dayjs(dateRangeSpec.dateTo),
    ]

    return <>
        <Box sx={{display: 'flex', gap: '5px'}}>
            {showOrdersDateType ? <SearchUIOrderDateTypeSelect/> : null}
            <SearchUIDateRangeSpecTypeSelect/>
        </Box>
        {withInputNear
            ? exactDates
                ? <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateRangePicker
                        sx={dateRangePickerSx}
                        value={dateRange}
                        onChange={handleSetDateRange}
                        slotProps={{
                            fieldSeparator: {sx: {display: 'none'}},
                            popper: {placement: 'auto'}
                        }}
                    />
                </LocalizationProvider>
                : <PneTextField
                    value={dateRangeSpec.beforeCount}
                    onChange={changeBeforeCount}
                    type={'number'}
                    sx={beforeCountSx}
                />
            : null}
    </>
}

const beforeCountSx: SxProps = {
    '& fieldset': {
        borderRadius: '0',
        borderColor: 'transparent !important',
    }
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
