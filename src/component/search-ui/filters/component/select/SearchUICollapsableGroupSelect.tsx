import React, {useState} from 'react';
import {MenuItem, Select, SelectChangeEvent, styled} from '@mui/material';
import {selectUnderChipSx} from "./style";
import Box from "@mui/material/Box";

// Описание структуры данных для групп
interface GroupConfig {
    id: string
    label: string
    // Список опций внутри группы
    items: {
        value: string
        label: string
        // Если нужно кастомное отображение, можно добавить сюда
        // любые поля, например icon, description и т.д.
    }[]
}

// Пример заранее известного массива групп (конфиг)
const GROUPS: GroupConfig[] = [
    {
        id: 'group1',
        label: 'Группа 1',
        items: [
            {value: 'option1_1', label: 'Опция 1.1'},
            {value: 'option1_2', label: 'Опция 1.2'},
        ],
    },
    {
        id: 'group2',
        label: 'Группа 2',
        items: [
            {value: 'option2_1', label: 'Опция 2.1'},
            {value: 'option2_2', label: 'Опция 2.2'},
            {value: 'option2_3', label: 'Опция 2.3'},
        ],
    },
]

type Props = {
    open: boolean
    onClose: () => void
    onOpen: () => void
}

export const SearchUICollapsableGroupSelect = (props: Props) => {

    // Выбранное значение
    const [value, setValue] = useState<string>('asdasd')

    // Храним состояние развернутости групп
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        group1: true,
        group2: false,
    })

    // Обработчик выбора (стандартный для Select)
    const handleChange = (event: SelectChangeEvent) => {
        console.log(event)
        const v = event.target.value
        console.log(v)
        setValue(v)
    }

    // Тоггл разворачивания/сворачивания группы
    const toggleGroup = (event: MouseEvent, groupId: string) => {
        alert('group')
        // Чтобы клик по заголовку группы не засчитывался как выбор пункта (не вызывался handleChange)
        event.stopPropagation()
        event.preventDefault()

        setExpandedGroups((prev) => ({
            ...prev,
            [groupId]: !prev[groupId],
        }))
    }

    return <Select
        value={value}
        // onChange={handleChange}
        size={'small'}
        variant={'outlined'}
        sx={selectUnderChipSx}
        {...props}
    >
        {/*{optionsPresent ? options.map(mapChoiceToSelectOption).map(option =>*/}
        {/*    <MenuItem*/}
        {/*        disabled={disableMenuItem ? disableMenuItem(option) : false}*/}
        {/*        key={option.value}*/}
        {/*        value={option.value}*/}
        {/*    >*/}
        {/*        {getOptionLabel(option)}*/}
        {/*    </MenuItem>) : null}*/}
        {/*{GROUPS.map((group) => {*/}
        {/*    // Заголовок группы как псевдо-пункт (не выбирает значение, а управляет коллапсом)*/}
        {/*    const isExpanded = expandedGroups[group.id]*/}
        {/*    return <React.Fragment key={group.id}>*/}
        {/*        <MenuItem*/}
        {/*            // Важно: onClick должен останавливать всплытие*/}
        {/*            onClick={(e) => toggleGroup(e, group.id)}*/}
        {/*            // Добавим небольшой Layout, чтобы и текст, и иконка были в одной строке*/}
        {/*            // и выглядели как "заголовок" с иконкой*/}
        {/*        >*/}
        {/*            <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">*/}
        {/*                <Box>*/}
        {/*                    <TitleSpan>{group.label}</TitleSpan>*/}
        {/*                    <GreySpan>Описание группы</GreySpan>*/}
        {/*                </Box>*/}
        {/*                {isExpanded ? <ExpandLessIcon/> : <ExpandMoreIcon/>}*/}
        {/*            </Box>*/}
        {/*        </MenuItem>*/}

        {/*        /!* Пункты внутри группы *!/*/}
        {/*        <Collapse in={isExpanded} timeout="auto" unmountOnExit>*/}
        {/*            {group.items.map((item) => (*/}
        {/*                <MenuItem key={item.value} value={item.value}>*/}
        {/*                    <TitleSpan>{item.label}</TitleSpan>*/}
        {/*                    <GreySpan>Доп. инфо</GreySpan>*/}
        {/*                </MenuItem>*/}
        {/*            ))}*/}
        {/*        </Collapse>*/}
        {/*    </React.Fragment>*/}
        {/*})}*/}
        <Box>
            {GROUPS[0].items.map((item) => (
                <MenuItem
                    onClick={() => setValue(item.value)}
                    key={item.value}
                    value={item.value}
                >
                    <TitleSpan>{item.label}</TitleSpan>
                    <GreySpan>Доп. инфо</GreySpan>
                </MenuItem>
            ))}
        </Box>
    </Select>
}

const TitleSpan = styled('span')(({theme}) => ({
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
}))

const GreySpan = styled('span')(({theme}) => ({
    color: theme.palette.grey[600],
}))