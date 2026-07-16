import * as React from "react";
import {Box, Typography} from "@mui/material";
import {Meta, StoryObj} from "@storybook/react-webpack5";
import {userEvent, within} from "storybook/test";
import {PneButton, PneModal, PneModalActions} from "../index";

export default {
    title: "pne-ui/PneModal",
    component: PneModal,
    parameters: {
        layout: "fullscreen",
    },
} as Meta<typeof PneModal>;

type Story = StoryObj<typeof PneModal>;

type ModalContentProps = {
    section: string
    title: string
    description: string
}

type ModalStoryHarnessProps = Pick<React.ComponentProps<typeof PneModal>, "containerSx" | "subtitle" | "title"> & {
    children: React.ReactNode
    renderActions: (close: () => void) => React.ReactNode
}

const ModalContent = ({section, title, description}: ModalContentProps) => <Box
    data-story-section={section}
    sx={{display: "grid", gap: 1}}
>
    <Typography sx={{fontSize: 14, fontWeight: 700, lineHeight: "20px"}}>
        {title}
    </Typography>
    <Typography sx={{color: "text.secondary", fontSize: 14, lineHeight: "20px"}}>
        {description}
    </Typography>
</Box>

const ModalStoryHarness = ({
    children,
    containerSx,
    renderActions,
    subtitle,
    title,
}: ModalStoryHarnessProps) => {
    const [open, setOpen] = React.useState(false);
    const close = React.useCallback(() => setOpen(false), []);

    return <Box sx={{p: 2}}>
        <PneButton pneStyle='outlined' onClick={() => setOpen(true)}>
            Открыть модалку
        </PneButton>
        <PneModal
            actions={renderActions(close)}
            containerSx={containerSx}
            onClose={close}
            open={open}
            subtitle={subtitle}
            title={title}
        >
            {children}
        </PneModal>
    </Box>
}

const openModal: NonNullable<Story["play"]> = async ({canvasElement}) => {
    await userEvent.click(within(canvasElement).getByRole("button", {name: "Открыть модалку"}));
}

export const Default: Story = {
    parameters: {
        docs: {
            description: {
                story: "Обычная модалка: вторичное действие слева от основного, вся группа прижата вправо.",
            },
        },
    },
    play: openModal,
    render: () => <ModalStoryHarness
        renderActions={close => <PneModalActions
            secondary={<PneButton pneStyle='outlined' onClick={close}>Отмена</PneButton>}
            primary={<PneButton pneStyle='contained' onClick={close}>Сохранить</PneButton>}
        />}
        title='Редактирование профиля'
    >
        <ModalContent
            section='modal-actions-default'
            title='Обычное подтверждение'
            description='Проверьте данные перед сохранением изменений.'
        />
    </ModalStoryHarness>,
};

export const Destructive: Story = {
    parameters: {
        docs: {
            description: {
                story: "Для необратимого действия меняется стиль основной кнопки, но расположение группы остаётся тем же.",
            },
        },
    },
    play: openModal,
    render: () => <ModalStoryHarness
        renderActions={close => <PneModalActions
            secondary={<PneButton pneStyle='outlined' onClick={close}>Отмена</PneButton>}
            primary={<PneButton pneStyle='error' onClick={close}>Удалить</PneButton>}
        />}
        title='Удаление ключа'
    >
        <ModalContent
            section='modal-actions-destructive'
            title='Необратимое действие'
            description='После удаления приватный ключ нельзя будет восстановить.'
        />
    </ModalStoryHarness>,
};

export const Wizard: Story = {
    parameters: {
        docs: {
            description: {
                story: "Разнесённый layout используется только для разных смысловых групп: отдельная Отмена слева и навигация по шагам справа.",
            },
        },
    },
    play: openModal,
    render: () => <ModalStoryHarness
        containerSx={{width: 560}}
        renderActions={close => <PneModalActions
            leading={<PneButton pneStyle='text' onClick={close}>Отмена</PneButton>}
            secondary={<PneButton pneStyle='outlined' onClick={close}>Назад</PneButton>}
            primary={<PneButton pneStyle='contained' onClick={close}>Далее</PneButton>}
        />}
        subtitle='Шаг 2 из 3'
        title='Подключение терминала'
    >
        <ModalContent
            section='modal-actions-wizard'
            title='Параметры подключения'
            description='Отмена относится ко всему процессу, а Назад и Далее управляют текущим шагом.'
        />
    </ModalStoryHarness>,
};

export const ResponsiveLongLabels: Story = {
    parameters: {
        docs: {
            description: {
                story: "При нехватке ширины действия автоматически становятся полноширинной вертикальной группой: основное сверху, вторичное снизу.",
            },
        },
        viewport: {
            defaultViewport: "mobile1",
        },
    },
    play: openModal,
    render: () => <ModalStoryHarness
        containerSx={{width: 640}}
        renderActions={close => <PneModalActions
            secondary={<PneButton pneStyle='outlined' onClick={close}>Вернуться без сохранения</PneButton>}
            primary={<PneButton pneStyle='contained' onClick={close}>Сохранить и отправить на проверку</PneButton>}
        />}
        title='Отправка заявления'
    >
        <ModalContent
            section='modal-actions-responsive'
            title='Адаптивная группа действий'
            description='Сценарий проверяет узкий экран, длинный перевод и увеличенную длину подписей кнопок.'
        />
    </ModalStoryHarness>,
};
