import {
    createDefaultPneTableColumnSettings,
    isSamePneTableColumnSettings,
    resolvePneTableColumnSettings,
    type PneTableColumnOption,
} from '../src'

const columns: readonly PneTableColumnOption[] = [
    {id: 'id', label: 'ID'},
    {id: 'name', label: 'Name'},
    {id: 'email', label: 'Email', defaultVisible: false},
    {id: 'created', label: 'Created'},
]

const ids = (list: readonly PneTableColumnOption[]) => list.map(column => column.id)

describe('resolvePneTableColumnSettings', () => {
    it('returns catalog defaults for an unconfigured table', () => {
        for (const value of [undefined, null]) {
            const resolved = resolvePneTableColumnSettings(columns, value)

            expect(ids(resolved.visibleColumns)).toEqual(['id', 'name', 'created'])
            expect(ids(resolved.hiddenColumns)).toEqual(['email'])
            expect(resolved.isDefault).toBe(true)
            expect(resolved.value).toEqual(createDefaultPneTableColumnSettings(columns))
        }
    })

    it('keeps the stored visible order and drops unknown IDs', () => {
        const resolved = resolvePneTableColumnSettings(columns, {
            visibleColumnIds: ['created', 'legacy', 'id', 'id'],
            hiddenColumnIds: ['name', 'email', 'removed'],
        })

        expect(ids(resolved.visibleColumns)).toEqual(['created', 'id'])
        expect(ids(resolved.hiddenColumns)).toEqual(['name', 'email'])
        expect(resolved.value).toEqual({
            visibleColumnIds: ['created', 'id'],
            hiddenColumnIds: ['name', 'email'],
        })
        expect(resolved.isDefault).toBe(false)
    })

    it('appends catalog columns missing from a stored value as visible', () => {
        const resolved = resolvePneTableColumnSettings(columns, {
            visibleColumnIds: ['name'],
            hiddenColumnIds: ['id'],
        })

        expect(ids(resolved.visibleColumns)).toEqual(['name', 'email', 'created'])
        expect(ids(resolved.hiddenColumns)).toEqual(['id'])
    })

    it('prefers visibility when an ID is stored in both lists', () => {
        const resolved = resolvePneTableColumnSettings(columns, {
            visibleColumnIds: ['id'],
            hiddenColumnIds: ['id', 'name', 'email', 'created'],
        })

        expect(ids(resolved.visibleColumns)).toEqual(['id'])
        expect(ids(resolved.hiddenColumns)).toEqual(['name', 'email', 'created'])
    })

    it('falls back to defaults when nothing would stay visible', () => {
        const resolved = resolvePneTableColumnSettings(columns, {
            visibleColumnIds: ['legacy'],
            hiddenColumnIds: ['id', 'name', 'email', 'created'],
        })

        expect(ids(resolved.visibleColumns)).toEqual(['id', 'name', 'created'])
        expect(resolved.isDefault).toBe(true)
    })

    it('preserves consumer column fields on the resolved columns', () => {
        type RichColumn = PneTableColumnOption & {render: (row: {id: number}) => string}
        const rich: readonly RichColumn[] = [
            {id: 'id', label: 'ID', render: row => String(row.id)},
        ]

        const resolved = resolvePneTableColumnSettings(rich, undefined)

        expect(resolved.visibleColumns[0].render({id: 7})).toBe('7')
    })

    it('rejects an empty or duplicated catalog', () => {
        expect(() => resolvePneTableColumnSettings([], undefined)).toThrow(/must not be empty/)
        expect(() => resolvePneTableColumnSettings([
            {id: 'id', label: 'ID'},
            {id: 'id', label: 'Again'},
        ], undefined)).toThrow(/duplicate column ID "id"/)
    })
})

describe('isSamePneTableColumnSettings', () => {
    it('ignores hidden order but not visible order', () => {
        expect(isSamePneTableColumnSettings(
            {visibleColumnIds: ['a', 'b'], hiddenColumnIds: ['c', 'd']},
            {visibleColumnIds: ['a', 'b'], hiddenColumnIds: ['d', 'c']},
        )).toBe(true)
        expect(isSamePneTableColumnSettings(
            {visibleColumnIds: ['a', 'b'], hiddenColumnIds: []},
            {visibleColumnIds: ['b', 'a'], hiddenColumnIds: []},
        )).toBe(false)
    })
})
