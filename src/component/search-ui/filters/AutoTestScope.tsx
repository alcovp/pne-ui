import React, {createContext, use, useMemo} from 'react'

import {AutoTestAttributes, createAutoTestAttributes} from '../../AutoTestAttribute'
import type {CriterionTypeEnum} from './types'

export type SearchUIAutoTestScope = {
    scope?: string
    criterionType?: CriterionTypeEnum
}

export type SearchUIOwnedAutoTestAttributes = AutoTestAttributes & {
    'data-autotest-criterion'?: CriterionTypeEnum
}

export const createSearchUIOwnedAutoTestAttributes = (
    id: string,
    owner: SearchUIAutoTestScope | undefined,
): SearchUIOwnedAutoTestAttributes => ({
    ...createAutoTestAttributes(id, owner?.scope),
    ...(owner?.criterionType === undefined ? {} : {'data-autotest-criterion': owner.criterionType}),
})

const SearchUIAutoTestScopeContext = createContext<SearchUIAutoTestScope | undefined>(undefined)

export const SearchUIAutoTestScopeProvider = ({children, scope}: {children: React.ReactNode; scope: string}) => {
    const value = useMemo(() => ({scope}), [scope])

    return <SearchUIAutoTestScopeContext value={value}>{children}</SearchUIAutoTestScopeContext>
}

export const SearchUICriterionAutoTestScopeProvider = ({
    children,
    criterionType,
}: {
    children: React.ReactNode
    criterionType: CriterionTypeEnum
}) => {
    const parentScope = use(SearchUIAutoTestScopeContext)
    const value = useMemo(
        () => ({
            ...parentScope,
            criterionType,
        }),
        [criterionType, parentScope],
    )

    return <SearchUIAutoTestScopeContext value={value}>{children}</SearchUIAutoTestScopeContext>
}

export const useSearchUIAutoTestScope = (): SearchUIAutoTestScope | undefined => use(SearchUIAutoTestScopeContext)
