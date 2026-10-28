import React from 'react';
import {useTheme} from '@mui/material/styles';
import {TABLE_CONTROL_DISABLED_TEXT_COLOR, TABLE_CONTROL_TEXT_COLOR} from './tableControlColors';

interface IProps {
    disabled: boolean
}

const PneNextPageIcon = (props: IProps) => {
    const {
        disabled
    } = props;

    const control = useTheme().palette.pne?.control
    const color = disabled
        ? (control?.foregroundDisabled ?? TABLE_CONTROL_DISABLED_TEXT_COLOR)
        : (control?.foreground ?? TABLE_CONTROL_TEXT_COLOR);

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66669 8H13.3334" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.33331 4L13.3333 8L9.33331 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default PneNextPageIcon;