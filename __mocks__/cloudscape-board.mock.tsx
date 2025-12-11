import React from 'react'

export type BoardProps<Item = any> = {
    items: Item[]
    renderItem: (item: Item) => React.ReactNode
    i18nStrings?: any
    onItemsChange?: (event: { detail: { items: Item[] } }) => void
    empty?: React.ReactNode
}

const Board = <Item,>({ items, renderItem }: BoardProps<Item>) => (
    <div data-testid='mock-board'>{items.map((item, index) => <div key={index}>{renderItem(item)}</div>)}</div>
)

export default Board
