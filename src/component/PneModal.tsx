import React, {useId} from 'react';
import Box, {BoxProps} from "@mui/material/Box";
import IconButton, {IconButtonProps} from "@mui/material/IconButton";
import Modal, {ModalProps} from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import {SxProps} from "@mui/material";
import {styled} from "@mui/material/styles";
import CloseIcon from '@mui/icons-material/Close';

export type PneModalContainerProps = Omit<BoxProps, 'children' | 'className' | 'sx'> & {
    [key: `data-${string}`]: unknown
}

export type PneModalCloseButtonProps = Omit<IconButtonProps, 'onClick' | 'sx'> & {
    [key: `data-${string}`]: unknown
}

export interface PneModalProps {
    open: boolean
    onClose: () => void
    modalProps?: Omit<ModalProps, 'children' | 'onClose' | 'open'>
    containerProps?: PneModalContainerProps
    closeButtonProps?: PneModalCloseButtonProps
    containerSx?: SxProps
    title?: string
    subtitle?: string
    className?: string
    actions?: React.ReactNode
    overlay?: React.ReactNode
}

export type IProps = PneModalProps

const PneModal = (props: React.PropsWithChildren<PneModalProps>) => {
    const {
        open,
        onClose,
        modalProps,
        containerProps,
        closeButtonProps,
        containerSx = {},
        title,
        className,
        children,
        actions,
        overlay,
    } = props;

    const titleId = useId();
    const subtitleId = useId();

    return <Modal
        {...modalProps}
        open={open}
        onClose={onClose}
    >
        <Container
            role='dialog'
            aria-modal='true'
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={props.subtitle ? subtitleId : undefined}
            {...containerProps}
            className={className}
            sx={containerSx}
        >
            <Header>
                <div>
                    <Typography
                        sx={{
                            padding: '0',
                            fontWeight: '700',
                            fontSize: '18px',
                            lineHeight: '24px',
                        }}
                        component='h3'
                        id={titleId}
                    >
                        {title}
                    </Typography>
                    {props.subtitle && (
                        <Typography
                            sx={{
                                padding: '0',
                                fontWeight: '400',
                                fontSize: '12px',
                                lineHeight: '12px',
                                letterSpacing: '0.15px',
                            }}
                            id={subtitleId}
                        >
                            {props.subtitle}
                        </Typography>
                    )}
                </div>
                <IconButton
                    aria-label='Close'
                    {...closeButtonProps}
                    sx={{
                        width: '40px',
                        height: '40px',
                        background: '#F1F5FA',
                        borderRadius: '4px',
                    }}
                    onClick={onClose}
                >
                    <CloseIcon fontSize={'small'}/>
                </IconButton>
            </Header>
            {children != null && (
                <Body data-pne-modal-body='true'>
                    {children}
                </Body>
            )}
            {actions != null && (
                <Footer data-pne-modal-footer='true'>
                    {actions}
                </Footer>
            )}
            {overlay != null && (
                <OverlaySlot data-pne-modal-overlay='true'>
                    {overlay}
                </OverlaySlot>
            )}
        </Container>
    </Modal>
}

export default PneModal

const Container = styled(Box)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: min(400px, calc(100vw - 32px));
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    background: #fff;
    border: none;
    border-radius: 4px;
    max-height: 98%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0px -1px 12px rgba(0, 0, 0, 0.03), 0px 3px 3px rgba(0, 0, 0, 0.02), 0px 7px 6px rgba(0, 0, 0, 0.06), 0px 12px 10px rgba(0, 0, 3, 0.03), 0px 22px 18px rgba(0, 0, 0, 0.04), 0px 40px 33px rgba(0, 0, 0, 0.04), 0px 100px 80px rgba(0, 0, 0, 0.04);
`;

const Header = styled(Box)`
    display: flex;
    flex: 0 0 auto;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #F1F5FA;
    gap: 16px;
`;

const Body = styled(Box)`
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 24px;
`;

const Footer = styled(Box)`
    flex: 0 0 auto;
    padding: 16px 24px;
    border-top: 1px solid #F1F5FA;
`;

const OverlaySlot = styled(Box)`
    position: absolute;
    inset: 0;
    z-index: 1;
`;
