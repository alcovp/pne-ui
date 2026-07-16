import * as React from "react";
import {Box, Typography} from "@mui/material";
import {Meta, StoryObj} from "@storybook/react-webpack5";
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

export const Default: Story = {
    parameters: {
        docs: {
            description: {
                story: "Обычная модалка: вторичное действие слева от основного, вся группа прижата вправо.",
            },
        },
    },
    render: () => <PneModal
        actions={<PneModalActions
            secondary={<PneButton pneStyle='outlined'>Отмена</PneButton>}
            primary={<PneButton pneStyle='contained'>Сохранить</PneButton>}
        />}
        onClose={() => undefined}
        open
        title='Редактирование профиля'
    >
        <ModalContent
            section='modal-actions-default'
            title='Обычное подтверждение'
            description='Проверьте данные перед сохранением изменений.'
        />
    </PneModal>,
};

export const Destructive: Story = {
    parameters: {
        docs: {
            description: {
                story: "Для необратимого действия меняется стиль основной кнопки, но расположение группы остаётся тем же.",
            },
        },
    },
    render: () => <PneModal
        actions={<PneModalActions
            secondary={<PneButton pneStyle='outlined'>Отмена</PneButton>}
            primary={<PneButton pneStyle='error'>Удалить</PneButton>}
        />}
        onClose={() => undefined}
        open
        title='Удаление ключа'
    >
        <ModalContent
            section='modal-actions-destructive'
            title='Необратимое действие'
            description='После удаления приватный ключ нельзя будет восстановить.'
        />
    </PneModal>,
};

export const Wizard: Story = {
    parameters: {
        docs: {
            description: {
                story: "Разнесённый layout используется только для разных смысловых групп: отдельная Отмена слева и навигация по шагам справа.",
            },
        },
    },
    render: () => <PneModal
        actions={<PneModalActions
            leading={<PneButton pneStyle='text'>Отмена</PneButton>}
            secondary={<PneButton pneStyle='outlined'>Назад</PneButton>}
            primary={<PneButton pneStyle='contained'>Далее</PneButton>}
        />}
        containerSx={{width: 560}}
        onClose={() => undefined}
        open
        subtitle='Шаг 2 из 3'
        title='Подключение терминала'
    >
        <ModalContent
            section='modal-actions-wizard'
            title='Параметры подключения'
            description='Отмена относится ко всему процессу, а Назад и Далее управляют текущим шагом.'
        />
    </PneModal>,
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
    render: () => <PneModal
        actions={<PneModalActions
            secondary={<PneButton pneStyle='outlined'>Вернуться без сохранения</PneButton>}
            primary={<PneButton pneStyle='contained'>Сохранить и отправить на проверку</PneButton>}
        />}
        containerSx={{width: 640}}
        onClose={() => undefined}
        open
        title='Отправка заявления'
    >
        <ModalContent
            section='modal-actions-responsive'
            title='Адаптивная группа действий'
            description='Сценарий проверяет узкий экран, длинный перевод и увеличенную длину подписей кнопок.'
        />
    </PneModal>,
};
