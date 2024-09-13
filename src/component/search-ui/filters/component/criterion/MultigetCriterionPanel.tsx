import React from 'react';
import {CriterionTypeEnum, LinkedEntityTypeEnum, MultichoiceFilterTypeEnum, MultigetCriterion} from '../../types';
import {Box, Chip, Link, SxProps} from '@mui/material';
import {MultigetSelect} from '../../../multiget_select/MultigetSelect';
import {useSearchUIStore} from '../../state/store';
import {PneModal, useModal} from '../../../../..';

interface IProps {
    criterionType: CriterionTypeEnum
    entityType: LinkedEntityTypeEnum
}

export const MultigetCriterionPanel = (props: IProps) => {
    const {
        criterionType,
        entityType,
    } = props

    const {open, handleOpen, handleClose: closeModal} = useModal()
    const {
        multigetCriteria,
        setMultigetCriterion,
        justAddedCriterion,
        setJustAddedCriterion,
    } = useSearchUIStore()

    const currentMultigetCriterion = multigetCriteria.find(c => c.entityType === entityType)
    if (currentMultigetCriterion === undefined) {
        throw new Error(
            `Cannot find multiget criteria with type: ${entityType}. 
            Maybe you did not define it in initialSearchConditions prop?`
        )
    }
    const linkedMultigetCriteria = multigetCriteria.filter(c => c.entityType !== entityType)
    const currentIsJustAdded = criterionType === justAddedCriterion

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
                        <Box component={'span'} sx={linkSpanSx}>{'All excluding'}</Box>
                        {getItemNamesChips(currentMultigetCriterion.deselectedItemNames)}
                    </Box>
                } else {
                    return <Box component={'span'} sx={linkSpanSx}>{'All'}</Box>
                }
            case MultichoiceFilterTypeEnum.NONE:
                if (currentMultigetCriterion.selectedItemNames) {
                    return <Box sx={chipsSx}>
                        {getItemNamesChips(currentMultigetCriterion.selectedItemNames)}
                    </Box>
                } else {
                    return <Box component={'span'} sx={linkSpanSx}>{'None'}</Box>
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
        <PneModal
            open={open || currentIsJustAdded}
            onClose={handleClose}
            containerSx={{width: '600px'}}
        >
            <MultigetSelect
                multigetCriterion={currentMultigetCriterion}
                linkedMultigetCriteria={linkedMultigetCriteria}
                onSave={changeCriterion}
                onCancel={handleClose}
            />
        </PneModal>
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
