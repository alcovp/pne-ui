import React, {Dispatch, SetStateAction} from "react";

const useModal = (): {
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>,
    handleOpen: () => void,
    handleClose: () => void,
} => {
    const [open, setOpen] = React.useState(false)
    const handleOpen = () => setOpen(true)
    const handleClose = () => setOpen(false)

    return {
        open,
        setOpen,
        handleOpen,
        handleClose,
    }
}

export default useModal