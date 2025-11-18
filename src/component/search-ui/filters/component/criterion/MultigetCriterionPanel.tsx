import React, {useEffect} from 'react';
import {CriterionTypeEnum, LinkedEntityTypeEnum, MultichoiceFilterTypeEnum, MultigetCriterion} from '../../types';
import {Box, Chip, Link, SxProps} from '@mui/material';
import {MultigetSelect} from '../../../multiget_select/MultigetSelect';
import {useSearchUIFiltersStore} from '../../state/store';
import {PneModal, useModal} from '../../../../..';
import {MultigetSelectStoreProvider} from "../../../multiget_select/state/IsolatedStoreProvider";
import {useTranslation} from "react-i18next";

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
    const getItemNamesChips = (commaSeparated: string) => {
        return <>{commaSeparated.split(',').map(name =>
            <Chip label={name} key={name} size={'small'}/>
        )}</>
    }

    const getLinkChildren = () => {
        switch (currentMultigetCriterion.filterType) {
            case MultichoiceFilterTypeEnum.ALL:
                if (currentMultigetCriterion.deselectedItemNames) {
                    return <Box sx={chipsSx}>
                        <Box component={'span'} sx={linkSpanSx}>{t('react.searchUI.allExcluding')}</Box>
                        {getItemNamesChips(currentMultigetCriterion.deselectedItemNames)}
                    </Box>
                } else {
                    return <Box component={'span'} sx={linkSpanSx}>{t('react.searchUI.all')}</Box>
                }
            case MultichoiceFilterTypeEnum.NONE:
                if (currentMultigetCriterion.selectedItemNames) {
                    return <Box sx={chipsSx}>
                        {getItemNamesChips(currentMultigetCriterion.selectedItemNames)}
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
            onClick={handleOpen}
            component="button"
            underline="hover"
            sx={linkSx}
        >
            {getLinkChildren()}
        </Link>
        <MultigetSelectStoreProvider>
            <PneModal
                open={open}
                onClose={handleClose}
                title={t('advancedSearch.addCriteria')}
                containerSx={modalContainerSx}
            >
                <MultigetSelect
                    multigetCriterion={currentMultigetCriterion}
                    linkedMultigetCriteria={linkedMultigetCriteria}
                    onSave={changeCriterion}
                    onCancel={handleClose}
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
