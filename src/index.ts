import PneButton from './component/PneButton'
import PneTextField from './component/PneTextField'
import PneModal from './component/PneModal'
import useModal from './component/useModal'
import PneAutocomplete from './component/dropdown/PneAutocomplete'
import PneAsyncAutocomplete, {PneAsyncAutocompleteProps} from './component/dropdown/PneAsyncAutocomplete'
import PneSelect from './component/dropdown/PneSelect'
import PneTable from './component/table/PneTable'
import useTable from './component/table/useTable'
import type UseTableParams from './component/table/useTable'
import PneTableRow from './component/table/PneTableRow'
import PneHeaderTableCell from './component/table/PneHeaderTableCell'
import PneTableCell from './component/table/PneTableCell'
import AbstractTable, {
    PaginatorProps,
    TableCreateHeaderType,
    TableProps,
    TableSortOptions,
} from './component/table/AbstractTable'
import PneTableSortLabel from './component/table/PneTableSortLabel'
import AbstractHeaderTableCell from './component/table/AbstractHeaderTableCell'
import AbstractTableCell from './component/table/AbstractTableCell'
import {TableDisplayOptions} from './component/table/type'
import {PneCheckbox} from './component/PneCheckbox'
import {
    CriterionTypeEnum,
    ExactCriterionSearchLabelEnum,
    GroupingType,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    MultigetCriterion,
    OrderSearchLabel,
    SearchCriteria,
    SearchUIConditions,
    SearchUITemplate,
} from './component/search-ui/filters/types'
import {SearchUIDefaults, SearchUIProvider} from './component/search-ui/SearchUIProvider'
import {SearchParams, SearchUI} from './component/search-ui/SearchUI'
import {SearchUIFilters, SearchUIFiltersConfig} from './component/search-ui/filters/SearchUIFilters'
import {MultigetSelect} from './component/search-ui/multiget_select/MultigetSelect'
import {createPneTheme} from './createTheme'
import {
    AbstractEntitySelector,
    AbstractEntitySelectorProp,
    IAbstractEntityOptions,
    IMappedUnmappedList,
} from './component/non-abstract-entity-selector/AbstractEntitySelector'
import {AbstractEntitySelectModal} from './component/non-abstract-entity-selector/AbstractEntitySelectModal'
import {PneDropdownChoice} from './common/paynet/dropdown'
import {AutoTestAttribute} from './component/AutoTestAttribute'
import {getSearchUIInitialState} from './component/search-ui/state/initial'
import {PneButtonGroup} from './component/PneButtonGroup'
import {Skin} from './common/paynet/skin'
import CustomIconWrapper from './component/CustomIconWrapper'
import PneSwitch from './component/PneSwitch'

// TODO нужно ли тут импортировать и экспортировать после декларирования модулей? как сделать общую тему с
// возможностью ее дополнять?
declare module '@mui/material/styles' {
    interface Theme {
        skin: Skin
    }

    interface Palette {
        pneNeutral: Palette['primary']
        pnePrimary: Palette['primary']
        pnePrimaryLight: Palette['primary']
        pneWhite: Palette['primary']
        pneWarningLight: Palette['primary']
        pneAccentuated: Palette['primary']
    }

    interface PaletteOptions {
        pneNeutral: PaletteOptions['primary']
        pnePrimary: PaletteOptions['primary']
        pnePrimaryLight: PaletteOptions['primary']
        pneWhite: PaletteOptions['primary']
        pneWarningLight: PaletteOptions['primary']
        pneAccentuated: PaletteOptions['primary']
    }

    // allow configuration using `createTheme`
    interface ThemeOptions {
        skin: Skin
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        pneNeutral: true
        pnePrimary: true
    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        pnePrimaryLight: true
        pneNeutral: true
        pneWhite: true
        pneWarningLight: true
    }
}

declare module '@mui/material/ToggleButtonGroup' {
    interface ToggleButtonGroupPropsColorOverrides {
        pneAccentuated: true
    }
}

declare module '@mui/material/ToggleButton' {
    interface ToggleButtonPropsColorOverrides {
        pneAccentuated: true
    }
}

export {
    createPneTheme,
    PneButton,
    PneButtonGroup,
    PneTextField,
    PneModal,
    useModal,
    PneAutocomplete,
    PneAsyncAutocomplete,
    PneSelect,
    PneTable,
    useTable,
    UseTableParams,
    PneTableRow,
    PneHeaderTableCell,
    PneTableCell,
    PneTableSortLabel,
    AbstractTable,
    AbstractHeaderTableCell,
    AbstractTableCell,
    PaginatorProps,
    TableCreateHeaderType,
    TableProps,
    TableSortOptions,
    TableDisplayOptions,
    PneCheckbox,
    SearchUI,
    SearchParams,
    SearchUIFilters,
    SearchCriteria,
    SearchUIProvider,
    SearchUITemplate,
    SearchUIDefaults,
    SearchUIFiltersConfig,
    SearchUIConditions,
    CriterionTypeEnum,
    LinkedEntityTypeEnum,
    MultichoiceFilterTypeEnum,
    ExactCriterionSearchLabelEnum,
    MultigetCriterion,
    GroupingType,
    MultigetSelect,
    AbstractEntitySelector,
    AbstractEntitySelectModal,
    AbstractEntitySelectorProp,
    IMappedUnmappedList,
    IAbstractEntityOptions,
    PneAsyncAutocompleteProps,
    PneDropdownChoice,
    AutoTestAttribute,
    getSearchUIInitialState,
    Skin,
    CustomIconWrapper,
    PneSwitch,
    OrderSearchLabel,
}
export * from './common'