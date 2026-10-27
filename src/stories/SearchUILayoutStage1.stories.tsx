// Temporary: a walkthrough of the #172508 stage-1 result and the open questions for the owner.
// Remove before the branch goes to master.
import React from 'react'
import {Box, Chip, Divider, Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@mui/material'
import type {Meta, StoryObj} from '@storybook/react-webpack5'
import {OverlayHost} from '../index'
import {compactLayoutStoryArgs, HookWrapContent, LayoutComparison} from './SearchUI.stories'
import {TransactionReportFilters} from './SearchUITransactionReport.stories'

type StatusKind = 'done' | 'open' | 'skipped'

const statusLabels: Record<StatusKind, string> = {
    done: 'готово',
    open: 'вопрос',
    skipped: 'не делали',
}

const statusColors: Record<StatusKind, 'success' | 'warning' | 'default'> = {
    done: 'success',
    open: 'warning',
    skipped: 'default',
}

const Status = ({kind}: {kind: StatusKind}) => <Chip
    label={statusLabels[kind]}
    color={statusColors[kind]}
    size='small'
    variant='outlined'
    sx={{mr: 1, verticalAlign: 'middle'}}
/>

const Section = ({title, children}: {title: string, children: React.ReactNode}) => <Box
    component='section'
    sx={{mb: 5}}
>
    <Typography variant='h5' sx={{mb: 2, fontWeight: 700}}>{title}</Typography>
    {children}
</Box>

const Item = ({status, children}: {status?: StatusKind, children: React.ReactNode}) => <Box
    component='li'
    sx={{mb: 1, lineHeight: 1.5}}
>
    {status ? <Status kind={status}/> : null}
    {children}
</Box>

const List = ({children, ordered = false}: {children: React.ReactNode, ordered?: boolean}) => <Box
    component={ordered ? 'ol' : 'ul'}
    sx={{pl: 3, m: 0}}
>
    {children}
</Box>

const Demo = ({caption, children}: {caption: string, children: React.ReactNode}) => <Box
    sx={{mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden'}}
>
    <Typography
        sx={{px: 2, py: 1, fontSize: 13, color: 'text.secondary', bgcolor: 'action.hover'}}
    >
        {caption}
    </Typography>
    {children}
</Box>

const Measurements = () => <Table size='small' sx={{maxWidth: 720, mb: 2}}>
    <TableHead>
        <TableRow>
            <TableCell>Элемент, Storybook 1440 px</TableCell>
            <TableCell align='right'>header</TableCell>
            <TableCell align='right'>compact</TableCell>
        </TableRow>
    </TableHead>
    <TableBody>
        <TableRow>
            <TableCell>Полоса «Filters» / строка действий, px</TableCell>
            <TableCell align='right'>62</TableCell>
            <TableCell align='right'>42</TableCell>
        </TableRow>
        <TableRow>
            <TableCell>Строка критерия, px</TableCell>
            <TableCell align='right'>41</TableCell>
            <TableCell align='right'>41</TableCell>
        </TableRow>
        <TableRow>
            <TableCell>Отступ между панелью и полосой пагинации, px</TableCell>
            <TableCell align='right'>16</TableCell>
            <TableCell align='right'>8</TableCell>
        </TableRow>
        <TableRow>
            <TableCell>Начало колонки значений от левого края, px</TableCell>
            <TableCell align='right'>182</TableCell>
            <TableCell align='right'>238</TableCell>
        </TableRow>
        <TableRow>
            <TableCell>Колонка значков, px</TableCell>
            <TableCell align='right'>24 у правого края</TableCell>
            <TableCell align='right'>48 между названием и значением</TableCell>
        </TableRow>
        <TableRow>
            <TableCell sx={{fontWeight: 700}}>Экономия по высоте на блок фильтров, px</TableCell>
            <TableCell align='right'/>
            <TableCell align='right' sx={{fontWeight: 700}}>28</TableCell>
        </TableRow>
    </TableBody>
</Table>

const Presentation = () => <Box sx={{p: 4, maxWidth: 1400, bgcolor: '#fff', fontFamily: 'Arial, sans-serif'}}>
    <Typography variant='h4' sx={{fontWeight: 700, mb: 1}}>
        #172508 · SearchUIFilters: компактная раскладка, этап 1
    </Typography>
    <Typography sx={{color: 'text.secondary', mb: 4}}>
        Временная история для обсуждения. pne-ui 4.8.0-rc.0 в npm «next», ветка
        issue172508-search-ui-compact-layout от master 4.7.2, 27.10.2026.
    </Typography>

    <Section title='Откуда задача'>
        <List>
            <Item>
                Тикет Севака #172508 по комментариям Евгения Синева в #171399 (08.10 и note-22 от 22.10):
                убрать полосу «Filters», кнопки [Saved filters] [Add filter] [Search] поставить отдельной
                строкой под фильтрами по колонке значений, шеврон свёртки перенести в эту строку.
            </Item>
            <Item>
                Ластик и крестик критерия поставить в колонку между названием и значением: ластик у значения,
                крестик левее. По предложению Евгения значки бледные (0.45) и яркие при наведении.
            </Item>
            <Item>
                «Template» переименовать в «Saved filters», на кнопке показывать имя применённого набора.
            </Item>
            <Item>
                Критерий приёмки Евгения: первая строка таблицы React Orders при 1440×900 не ниже, чем в
                Wicket. На стенде Севака 377 px против 289 px.
            </Item>
            <Item>
                Севак сделал колонку значков снаружи библиотеки (searchUiFilterRowActionsSx, только Orders,
                nth-of-type по детям строки). Нам нужен общий вид для всех 33 страниц хоста, отчётов
                Вероники и дашборда.
            </Item>
        </List>
    </Section>

    <Section title='Что готово в 4.8.0-rc.0'>
        <List>
            <Item status='done'>
                Переключатель config.layout: «header» (по умолчанию, старый вид не тронут) и «compact».
                Все якоря data-autotest сохранены, контракт локаторов в README дополнен.
            </Item>
            <Item status='done'>
                Compact: полосы «Filters» нет, область получает role=region с именем «Filters». Критерии и
                строка действий лежат в одной CSS-сетке (строки — subgrid), поэтому кнопки стоят ровно по
                колонке значений. Шеврон свёртки и счётчик свёрнутых критериев слева в той же строке.
            </Item>
            <Item status='done'>
                Значки в колонке 48 px между названием и значением, крестик левее ластика, ластики всех строк
                на одной вертикали. Цвет из палитры (muted), темнее при наведении и фокусе с клавиатуры,
                есть кольцо фокуса. Крестик больше не красит SVG жёстко, тёмная тема берёт свой цвет.
            </Item>
            <Item status='done'>
                Тексты семейства «Template» переименованы: кнопка «Saved filters», сущность в меню и
                диалогах «filter set» / «набор». Значения ключей react.searchUI.template* сменены в
                paynet-i18n R3.36.142 (EN, RU) и в defaultValue библиотеки, сами ключи те же.
            </Item>
            <Item status='done'>
                SearchUI в compact оставляет над таблицей 8 px вместо 16; общий AbstractTable не тронут.
            </Item>
            <Item status='done'>
                Телефон до 600 px: прежняя вёрстка, название и значки в одной строке, значение под ними,
                кнопки переносятся.
            </Item>
            <Item status='done'>
                Истории обоих видов, jest-тест контракта обеих раскладок, README. Build, typecheck,
                754 теста, lint зелёные.
            </Item>
        </List>
    </Section>

    <Section title='Было и стало'>
        <Demo caption='Один и тот же набор фильтров: сверху текущий вид, снизу компактный. Ручной поиск, два фиксированных критерия без крестика и три удаляемых.'>
            <LayoutComparison/>
        </Demo>
        <Demo caption='Compact без меню шаблонов: на его месте Clear all, как на виртуальных картах.'>
            <OverlayHost>
                <HookWrapContent
                    {...compactLayoutStoryArgs}
                    config={{...compactLayoutStoryArgs.config, hideTemplatesSelect: true}}
                    settingsContextName='stage1-hidden-templates'
                />
            </OverlayHost>
        </Demo>
        <Demo caption='Отчётные фильтры (SearchUIFilters без таблицы) в compact: строка Search библиотеки и под ней строка Generate хоста. Это вопрос 1.'>
            <TransactionReportFilters layout='compact'/>
        </Demo>
        <Demo caption='Телефон 360 px: история CompactLayoutMobile360 во фрейме.'>
            <Box
                component='iframe'
                src='./iframe.html?id=pne-ui-searchui--compact-layout-mobile-360&viewMode=story'
                title='Compact layout on a 360px phone'
                sx={{width: 360, height: 640, border: 0, display: 'block', m: 2}}
            />
        </Demo>
    </Section>

    <Section title='Замеры'>
        <Measurements/>
        <Typography sx={{maxWidth: 900}}>
            На Orders у Севака первая строка на 377 px при цели 289 px. Библиотека даёт около 28 px
            (без полосы, минус новая строка действий, минус отступ над таблицей). Остальные ~60 px
            лежат вне SearchUI: панель статистики, крошки, шапка таблицы. Строки критериев остались 41 px.
        </Typography>
    </Section>

    <Section title='Сознательно не сделали'>
        <List>
            <Item status='skipped'>
                Бледность значков 0.45: контраст около 1.5:1 при норме 3:1, на touch без наведения они бледные
                навсегда. Вместо этого обычный muted-цвет и затемнение при наведении и фокусе.
            </Item>
            <Item status='skipped'>
                Префикс «Saved filters: имя» на кнопке: не влезает в 30vw на телефоне, имя и так на кнопке.
            </Item>
            <Item status='skipped'>
                Переименование пунктов меню (Create new, Save as new template, Template name …) и ключи в
                paynet-i18n: ждут решения по названию; пока defaultValue в коде.
            </Item>
            <Item status='skipped'>
                Отступы полосы пагинации (6 + 40 + 6) и общий AbstractTable: не трогали, это общая таблица.
            </Item>
            <Item status='skipped'>
                Строки 36 px и слияние строки действий с полосой пагинации ради 289 px: спорно, не делали.
            </Item>
        </List>
    </Section>

    <Section title='Вопросы перед этапом 2'>
        <List ordered>
            <Item status='done'>
                Слот действий хоста для отчётных страниц: снят 27.10. На отчётах Search прячется через
                hideRefreshButton, в демо он был только из-за manualSearch в истории.
            </Item>
            <Item status='done'>
                Название «Saved filters» и переименование всего семейства: утверждено и сделано 27.10.
            </Item>
            <Item status='done'>
                Решение владельца 27.10: двух раскладок не будет, новая становится единственной.
                Переключатель config.layout живёт только как наш инструмент сравнения и удаляется в конце
                работ, перед стабильным выпуском.
            </Item>
            <Item status='open'>
                Ширина колонки названий: по самому длинному названию до 240 px (сейчас) или фиксированная
                180 px, как у Севака? Самое длинное RU-название около 220 px. Предлагаю оставить.
            </Item>
            <Item status='open'>
                Севак: его searchUiFilterRowActionsSx ломается на новом DOM, его ветка на pne-ui 4.6.3.
                Кто и когда говорит ему снять override и поднять pne-ui?
            </Item>
            <Item status='open'>
                Цель 289 px на Orders: отвечаем Евгению, что библиотека даёт ~28 px, а остальное у панели
                статистики и крошек? Или ищем ещё?
            </Item>
            <Item status='done'>
                Снят вместе с решением о единственной раскладке.
            </Item>
        </List>
    </Section>

    <Section title='Следующие шаги после решений'>
        <List ordered>
            <Item>Слот действий хоста и правки по замечаниям, rc.1.</Item>
            <Item>Ветка react от R3.36.17: pne-ui rc, layout compact на страницах, e2e на моках.</Item>
            <Item>Стенд Env Manager с этой веткой, сравнение с Wicket при 1440×900, телефон.</Item>
            <Item>Ключи paynet-i18n, комментарий в #172508, Севаку про override.</Item>
        </List>
    </Section>

    <Divider sx={{my: 3}}/>
    <Typography sx={{color: 'text.secondary', fontSize: 13}}>
        Эта история временная и удаляется перед вливанием ветки в master.
    </Typography>
</Box>

export default {
    title: 'pne-ui/SearchUI/172508 Stage 1 (temporary)',
    component: Presentation,
} satisfies Meta<typeof Presentation>

type Story = StoryObj<typeof Presentation>

export const Overview: Story = {}
