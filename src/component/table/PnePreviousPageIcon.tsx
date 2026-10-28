import React from 'react';
import {useTheme} from '@mui/material/styles';
import {TABLE_CONTROL_DISABLED_TEXT_COLOR, TABLE_CONTROL_TEXT_COLOR} from './tableControlColors';

interface IProps {
    disabled: boolean
}

const PnePreviousPageIcon = (props: IProps) => {
    const {
        disabled
    } = props;

    const control = useTheme().palette.pne?.control
    const color = disabled
        ? (control?.foregroundDisabled ?? TABLE_CONTROL_DISABLED_TEXT_COLOR)
        : (control?.foreground ?? TABLE_CONTROL_TEXT_COLOR);

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.3334 8H2.66669" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.66669 12L2.66669 8L6.66669 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default PnePreviousPageIcon;