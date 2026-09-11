import React, {useEffect} from 'react';
import {CriterionTypeEnum, LinkedEntityTypeEnum, MultichoiceFilterTypeEnum, MultigetCriterion} from '../../types';
import {Box, Chip, Link, SxProps} from '@mui/material';
import {MultigetSelect, MultigetSelectActions} from '../../../multiget_select/MultigetSelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {PneModal, useModal} from '../../../../..';
import {MultigetSelectStoreProvider} from "../../../multiget_select/state/IsolatedStoreProvider";
import {useTranslation} from "react-i18next";
import {createAutoTestAttributes} from '../../../../AutoTestAttribute';
import {
    createSearchUIOwnedAutoTestAttributes,
    useSearchUIAutoTestScope,
} from '../../AutoTestScope';

const CRITERION_MULTIGET_TRIGGER_AUTOTEST_ID = 'criterion-multiget-trigger'
const CRITERION_MULTIGET_VALUE_AUTOTEST_ID = 'criterion-multiget-value'
const CRITERION_MULTIGET_PANEL_AUTOTEST_ID = 'criterion-multiget-panel'
const CRITERION_MULTIGET_CLOSE_AUTOTEST_ID = 'criterion-multiget-close'

interface IProps {
    criterionType: CriterionTypeEnum
    entityType: LinkedEntityTypeEnum
}

export const MultigetCriterionPanel = (props: IProps) => {
    const {
        criterionType,
        entityType,
    } = props
    const {t} = useTranslation()
    const autoTestOwner = useSearchUIAutoTestScope()
    const panelId = React.useId()

    const {open, handleOpen, handleClose: closeModal} = useModal()

    const multigetCriteria = useSearchUIFiltersStore(s => s.multigetCriteria)
    const setMultigetCriterion = useSearchUIFiltersStore(s => s.setMultigetCriterion)
    const justAddedCriterion = useSearchUIFiltersStore(s => s.justAddedCriterion)
    const setJustAddedCriterion = useSearchUIFiltersStore(s => s.setJustAddedCriterion)

    const currentMultigetCriterion = multigetCriteria.find(c => c.entityType === entityType)
    if (currentMultigetCriterion === undefined) {
        throw new Error(
            `Cannot find multiget criteria with type: ${entityType}. 
            Maybe you did not define it in initialSearchConditions prop?`
        )
    }
    const linkedMultigetCriteria = multigetCriteria.filter(c => c.entityType !== entityType)
    const criterionLabel = t('react.CriterionTypeEnum.' + criterionType)
    const triggerLabel = `${t('react.searchUI.multiget.edit', {
        defaultValue: 'Edit filter',
    })}: ${criterionLabel}`
    const modalTitle = t('advancedSearch.addCriteria')

    useEffect(() => {
        if (justAddedCriterion === criterionType) {
            handleOpen()
            setJustAddedCriterion(null)
        }
    }, [justAddedCriterion, criterionType, handleOpen, setJustAddedCriterion])

    const changeCriterion = (criterion: MultigetCriterion) => {
        setMultigetCriterion(criterion)
        handleClose()
    }

    const handleClose = () => {
        setJustAddedCriterion(null)
        closeModal()
    }
    const getItemNamesChips = (commaSeparatedIds: string, commaSeparatedNames: string) => {
        const ids = commaSeparatedIds.split(',')

        return <>{commaSeparatedNames.split(',').map((name, index) => {
            const id = Number.parseInt(ids[index], 10)
            const autoTestAttributes = Number.isNaN(id)
                ? {}
                : createAutoTestAttributes(CRITERION_MULTIGET_VALUE_AUTOTEST_ID, id)

            return <Chip
                {...autoTestAttributes}
                label={name}
                key={Number.isNaN(id) ? `${name}-${index}` : id}
                size={'small'}
            />
        })}</>
    }

    const getLinkChildren = () => {
        switch (currentMultigetCriterion.filterType) {
            case MultichoiceFilterTypeEnum.ALL:
                if (currentMultigetCriterion.deselectedItemNames) {
                    return <Box sx={chipsSx}>
                        <Box component={'span'} sx={linkSpanSx}>{t('react.searchUI.allExcluding')}</Box>
                        {getItemNamesChips(
                            currentMultigetCriterion.deselectedItems,
                            currentMultigetCriterion.deselectedItemNames,
                        )}
                    </Box>
                } else {
                    return <Box component={'span'} sx={linkSpanSx}>{t('react.searchUI.all')}</Box>
                }
            case MultichoiceFilterTypeEnum.NONE:
                if (currentMultigetCriterion.selectedItemNames) {
                    return <Box sx={chipsSx}>
                        {getItemNamesChips(
                            currentMultigetCriterion.selectedItems,
                            currentMultigetCriterion.selectedItemNames,
                        )}
                    </Box>
                } else {
                    return <Box component={'span'} sx={linkSpanSx}>{t('react.searchUI.none')}</Box>
                }
            case MultichoiceFilterTypeEnum.SEARCH:
                return <Box
                    component={'span'}
                    sx={linkSpanSx}
                >{'Search by "' + currentMultigetCriterion.searchString + '"'}</Box>
            default:
                throw new Error('Unexpected MultichoiceFilterTypeEnum: ' + currentMultigetCriterion.filterType)
        }
    }

    return <>
        <Link
            {...createAutoTestAttributes(
                CRITERION_MULTIGET_TRIGGER_AUTOTEST_ID,
                currentMultigetCriterion.filterType,
            )}
            onClick={handleOpen}
            component="button"
            type="button"
            underline="hover"
            aria-label={triggerLabel}
            aria-controls={open ? panelId : undefined}
            aria-expanded={open}
            aria-haspopup="dialog"
            sx={linkSx}
        >
            {getLinkChildren()}
        </Link>
        <MultigetSelectStoreProvider>
            <PneModal
                actions={(
                    <MultigetSelectActions
                        multigetCriterion={currentMultigetCriterion}
                        onSave={changeCriterion}
                        onCancel={handleClose}
                    />
                )}
                open={open}
                onClose={handleClose}
                title={modalTitle}
                containerSx={modalContainerSx}
                closeLabel={t('close', {defaultValue: 'Close'})}
                slotProps={{
                    container: {
                        ...createSearchUIOwnedAutoTestAttributes(
                            CRITERION_MULTIGET_PANEL_AUTOTEST_ID,
                            autoTestOwner,
                        ),
                        id: panelId,
                    },
                    closeButton: createAutoTestAttributes(CRITERION_MULTIGET_CLOSE_AUTOTEST_ID),
                }}
            >
                <MultigetSelect
                    multigetCriterion={currentMultigetCriterion}
                    linkedMultigetCriteria={linkedMultigetCriteria}
                    onSave={changeCriterion}
                    onCancel={handleClose}
                    actionsPlacement='external'
                />
            </PneModal>
        </MultigetSelectStoreProvider>
    </>
}

const chipsSx: SxProps = {
    display: 'flex',
    alignItems: 'center',
    columnGap: '5px',
    rowGap: '5px',
    flexWrap: 'wrap',
    m: '8px 0',
}

const linkSx: SxProps = {
    display: 'flex',
    width: '100%',
    fontSize: '13px',
}

const linkSpanSx: SxProps = {
    display: 'inline-block',
    pl: '8px',
}

const modalContainerSx: SxProps = {
    width: {
        xs: 'clamp(360px, calc(100vw - 32px), 600px)',
        sm: '600px',
    },
    minWidth: 0,
    maxWidth: '600px',
}
