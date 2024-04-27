import React, {Dispatch, SetStateAction} from 'react';
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import {SxProps} from "@mui/material";
import {styled} from "@mui/material/styles";
import CloseIcon from '@mui/icons-material/Close';

export interface IProps {
    open: boolean
    onClose: () => void
    containerSx?: SxProps
    title?: string
    subtitle?: string
    className?: string
}

const PneModal = (props: React.PropsWithChildren<IProps>) => {
    const {
        open,
        onClose,
        containerSx = {},
        title,
        className,
        children,
    } = props;

    return <Modal
        open={open}
        onClose={onClose}
        aria-labelledby='modal-title'
    >
        <Container className={className} sx={containerSx}>
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
                        id={'modal-title'}
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
                            id={'modal-subtitle'}
                        >
                            {props.subtitle}
                        </Typography>
                    )}
                </div>
                <IconButton
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
            <Body>
                {children}
            </Body>
        </Container>
    </Modal>
}

export default PneModal

const Container = styled(Box)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 400px;
    background: #fff;
    border: none;
    border-radius: 4px;
    max-height: 98%;
    overflow-y: auto;
    box-shadow: 0px -1px 12px rgba(0, 0, 0, 0.03), 0px 3px 3px rgba(0, 0, 0, 0.02), 0px 7px 6px rgba(0, 0, 0, 0.06), 0px 12px 10px rgba(0, 0, 3, 0.03), 0px 22px 18px rgba(0, 0, 0, 0.04), 0px 40px 33px rgba(0, 0, 0, 0.04), 0px 100px 80px rgba(0, 0, 0, 0.04);
`;

const Header = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #F1F5FA;
    gap: 16px;
`;

const Body = styled(Box)`
    padding: 16px 24px;
`;

export const useModal = (): {
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>,
    handleOpen: () => void,
    handleClose: () => void,
} => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return {
        open,
        setOpen,
        handleOpen,
        handleClose
    };
}
