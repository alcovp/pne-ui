import * as React from 'react'
import {Box, Typography, Button} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {expect, userEvent, within} from 'storybook/test'
import {PneModal, PneModalActions} from '../index'

export default {
    title: 'pne-ui/PneModal',
    component: PneModal,
    parameters: {
        layout: 'fullscreen',
    },
} as Meta<typeof PneModal>

type Story = StoryObj<typeof PneModal>

type ModalContentProps = {
    section: string
    title: string
    description: string
}

type ModalStoryHarnessProps = Pick<
    React.ComponentProps<typeof PneModal>,
    'containerSx' | 'movable' | 'resizable' | 'subtitle' | 'title'
> & {
    children: React.ReactNode
    renderActions: (close: () => void) => React.ReactNode
}

const ModalContent = ({section, title, description}: ModalContentProps) => (
    <Box data-story-section={section} sx={{display: 'grid', gap: 1}}>
        <Typography sx={{fontSize: 14, fontWeight: 700, lineHeight: '20px'}}>{title}</Typography>
        <Typography sx={{color: 'text.secondary', fontSize: 14, lineHeight: '20px'}}>{description}</Typography>
    </Box>
)

const LongModalContent = () => (
    <Box sx={{display: 'grid', gap: 2}}>
        {Array.from({length: 16}, (_, index) => (
            <ModalContent
                key={index}
                section={`mobile-scroll-section-${index + 1}`}
                title={`Раздел ${index + 1}`}
                description='Длинный контент проверяет, что на узком экране прокручивается только тело модалки, а панель действий остаётся на месте.'
            />
        ))}
    </Box>
)

const ModalStoryHarness = ({
    children,
    containerSx,
    movable,
    renderActions,
    resizable,
    subtitle,
    title,
}: ModalStoryHarnessProps) => {
    const [open, setOpen] = React.useState(false)
    const close = React.useCallback(() => setOpen(false), [])

    return (
        <Box sx={{p: 2}}>
            <Button size='large' variant='outlined' onClick={() => setOpen(true)}>
                Открыть модалку
            </Button>
            <PneModal
                actions={renderActions(close)}
                closeLabel='Закрыть'
                containerSx={containerSx}
                movable={movable}
                onClose={close}
                open={open}
                resizable={resizable}
                subtitle={subtitle}
                title={title}
            >
                {children}
            </PneModal>
        </Box>
    )
}

const openModal: NonNullable<Story['play']> = async ({canvasElement}) => {
    await userEvent.click(within(canvasElement).getByRole('button', {name: 'Открыть модалку'}))
}

export const Default: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Обычная модалка: вторичное действие слева от основного, вся группа прижата вправо.',
            },
        },
    },
    play: openModal,
    render: () => (
        <ModalStoryHarness
            renderActions={close => (
                <PneModalActions
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Отмена
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' onClick={close}>
                            Сохранить
                        </Button>
                    }
                />
            )}
            title='Редактирование профиля'
        >
            <ModalContent
                section='modal-actions-default'
                title='Обычное подтверждение'
                description='Проверьте данные перед сохранением изменений.'
            />
        </ModalStoryHarness>
    ),
}

const dragBy = async (target: Element, from: {x: number; y: number}, by: {x: number; y: number}) => {
    await userEvent.pointer([
        {keys: '[MouseLeft>]', target, coords: {clientX: from.x, clientY: from.y}},
        {target, coords: {clientX: from.x + by.x, clientY: from.y + by.y}},
        {keys: '[/MouseLeft]', target, coords: {clientX: from.x + by.x, clientY: from.y + by.y}},
    ])
}

export const MovableAndResizable: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    'Окно, которое человек двигает за шапку и растягивает за правый нижний угол (`movable`, ' +
                    '`resizable`). Окно остаётся целиком на странице, тело занимает оставшуюся высоту и ' +
                    'прокручивается; при следующем открытии окно снова стоит по центру.',
            },
        },
    },
    play: async context => {
        await openModal(context)

        const dialog = within(document.body).getByRole('dialog')
        const header = dialog.querySelector('[data-pne-modal-header]')!
        const handle = dialog.querySelector('[data-pne-modal-resize-handle]')!
        const opened = dialog.getBoundingClientRect()

        // The window is taken by its header and follows the pointer. A centred window may stand on half a
        // pixel; once it is taken, it stands on whole pixels.
        await dragBy(header, {x: opened.left + 80, y: opened.top + 24}, {x: -60, y: -40})
        const moved = dialog.getBoundingClientRect()
        await expect(moved.left).toBe(Math.round(opened.left) - 60)
        await expect(moved.top).toBe(Math.round(opened.top) - 40)
        await expect(moved.width).toBe(Math.round(opened.width))

        // The lower right corner changes the size; the upper left corner stays.
        await dragBy(handle, {x: moved.right - 6, y: moved.bottom - 6}, {x: 80, y: -70})
        const resized = dialog.getBoundingClientRect()
        await expect(Math.round(resized.left)).toBe(Math.round(moved.left))
        await expect(Math.round(resized.top)).toBe(Math.round(moved.top))
        await expect(Math.round(resized.width - moved.width)).toBe(80)
        await expect(Math.round(resized.height - moved.height)).toBe(-70)

        // A window smaller than its content scrolls its body; the header and the buttons stay in view.
        const body = dialog.querySelector('[data-pne-modal-body]')!
        await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    },
    render: () => (
        <ModalStoryHarness
            containerSx={{width: 520}}
            movable
            renderActions={close => (
                <PneModalActions
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Отмена
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' onClick={close}>
                            Сохранить
                        </Button>
                    }
                />
            )}
            resizable
            subtitle='Двигается за шапку, растягивается за угол'
            title='Сравнение с таблицей под окном'
        >
            <Box sx={{display: 'grid', gap: 2}}>
                {Array.from({length: 4}, (_, index) => (
                    <ModalContent
                        key={index}
                        section={`movable-section-${index + 1}`}
                        title={`Раздел ${index + 1}`}
                        description='Окно можно отодвинуть, чтобы видеть страницу под ним, и растянуть под длинное содержимое.'
                    />
                ))}
            </Box>
        </ModalStoryHarness>
    ),
}

export const Destructive: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Для необратимого действия меняется стиль основной кнопки, но расположение группы остаётся тем же.',
            },
        },
    },
    play: openModal,
    render: () => (
        <ModalStoryHarness
            renderActions={close => (
                <PneModalActions
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Отмена
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' color='error' onClick={close}>
                            Удалить
                        </Button>
                    }
                />
            )}
            title='Удаление ключа'
        >
            <ModalContent
                section='modal-actions-destructive'
                title='Необратимое действие'
                description='После удаления приватный ключ нельзя будет восстановить.'
            />
        </ModalStoryHarness>
    ),
}

export const OneLine: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Содержимое в одну строку: линий над ним и под ним нет, заголовок, текст и кнопки читаются одним блоком.',
            },
        },
    },
    play: openModal,
    render: () => (
        <ModalStoryHarness
            renderActions={close => (
                <PneModalActions
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Отмена
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' color='error' onClick={close}>
                            Удалить
                        </Button>
                    }
                />
            )}
            title='Удаление ключа'
        >
            После удаления приватный ключ нельзя будет восстановить.
        </ModalStoryHarness>
    ),
}

export const NoBody: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Без содержимого: вопрос стоит в заголовке, под ним сразу кнопки, линий нет.',
            },
        },
    },
    play: openModal,
    render: () => (
        <ModalStoryHarness
            renderActions={close => (
                <PneModalActions
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Отмена
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' onClick={close}>
                            Приостановить
                        </Button>
                    }
                />
            )}
            title='Приостановить регулярный платёж?'
        >
            {null}
        </ModalStoryHarness>
    ),
}

export const Wizard: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Разнесённый layout используется только для разных смысловых групп: отдельная Отмена слева и навигация по шагам справа.',
            },
        },
    },
    play: openModal,
    render: () => (
        <ModalStoryHarness
            containerSx={{width: 560}}
            renderActions={close => (
                <PneModalActions
                    leading={
                        <Button size='medium' variant='text' onClick={close}>
                            Отмена
                        </Button>
                    }
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Назад
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' onClick={close}>
                            Далее
                        </Button>
                    }
                />
            )}
            subtitle='Шаг 2 из 3'
            title='Подключение терминала'
        >
            <ModalContent
                section='modal-actions-wizard'
                title='Параметры подключения'
                description='Отмена относится ко всему процессу, а Назад и Далее управляют текущим шагом.'
            />
        </ModalStoryHarness>
    ),
}

const GroupedSecondaryActionsExample = () => (
    <ModalStoryHarness
        containerSx={{width: 640}}
        renderActions={close => (
            <PneModalActions
                secondary={
                    <>
                        <Button size='medium' variant='outlined' onClick={close}>
                            Назад
                        </Button>
                        <Button size='medium' variant='outlined' onClick={close}>
                            Попробовать редактирование
                        </Button>
                    </>
                }
                primary={
                    <Button size='medium' variant='contained' onClick={close}>
                        Готово
                    </Button>
                }
            />
        )}
        title='Финальный шаг'
    >
        <ModalContent
            section='modal-actions-grouped-secondary'
            title='Два вторичных действия'
            description='Назад и Попробовать редактирование остаются одной вторичной группой перед основным действием Готово.'
        />
    </ModalStoryHarness>
)

const verifyGroupedSecondaryActions = async (canvasElement: HTMLElement, expectedOrder: string[]) => {
    const iframeDocument = canvasElement.ownerDocument
    const documentCanvas = within(iframeDocument.body)
    const dialog = await documentCanvas.findByRole('dialog', {name: 'Финальный шаг'})
    const actions = dialog.querySelector<HTMLElement>('[data-pne-modal-actions="true"]')!
    const secondary = actions.querySelector<HTMLElement>('[data-pne-modal-action="secondary"]')!
    const buttons = within(actions).getAllByRole('button')

    expect(buttons.map(button => button.textContent)).toEqual(expectedOrder)
    expect(
        within(secondary)
            .getAllByRole('button')
            .map(button => button.textContent),
    ).toEqual(['Назад', 'Попробовать редактирование'])
    expect(getComputedStyle(secondary).gap).toBe('8px')

    return {actions, buttons, secondary}
}

export const GroupedSecondaryActions: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Несколько вторичных действий передаются одним ReactNode-слотом, сохраняют порядок и внутренний отступ 8px.',
            },
        },
    },
    play: async context => {
        await openModal(context)
        await verifyGroupedSecondaryActions(context.canvasElement, ['Назад', 'Попробовать редактирование', 'Готово'])
    },
    render: () => <GroupedSecondaryActionsExample />,
}

export const ResponsiveGroupedSecondaryActions: Story = {
    globals: {
        viewport: {
            value: 'mobile360',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'На узком экране основное действие располагается первым, затем полноширинная вторичная группа в исходном порядке.',
            },
        },
    },
    play: async context => {
        await openModal(context)
        const {actions, buttons, secondary} = await verifyGroupedSecondaryActions(context.canvasElement, [
            'Готово',
            'Назад',
            'Попробовать редактирование',
        ])

        expect(context.canvasElement.ownerDocument.defaultView?.innerWidth).toBe(360)
        expect(secondary.scrollWidth).toBeLessThanOrEqual(secondary.clientWidth + 1)
        buttons.forEach(button => {
            expect(Math.abs(button.getBoundingClientRect().width - actions.clientWidth)).toBeLessThanOrEqual(1)
        })
    },
    render: () => <GroupedSecondaryActionsExample />,
}

export const ResponsiveLongLabels: Story = {
    parameters: {
        docs: {
            description: {
                story: 'При нехватке ширины действия автоматически становятся полноширинной вертикальной группой: основное сверху, вторичное снизу.',
            },
        },
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
    play: openModal,
    render: () => (
        <ModalStoryHarness
            containerSx={{width: 640}}
            renderActions={close => (
                <PneModalActions
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Вернуться без сохранения
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' onClick={close}>
                            Сохранить и отправить на проверку
                        </Button>
                    }
                />
            )}
            title='Отправка заявления'
        >
            <ModalContent
                section='modal-actions-responsive'
                title='Адаптивная группа действий'
                description='Сценарий проверяет узкий экран, длинный перевод и увеличенную длину подписей кнопок.'
            />
        </ModalStoryHarness>
    ),
}

export const MobileLongScroll: Story = {
    globals: {
        viewport: {
            value: 'mobile360',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                story: 'Регрессия мобильного скролла: длинное тело доходит до последнего раздела, а footer остаётся неподвижным.',
            },
        },
    },
    play: async context => {
        await openModal(context)

        const iframeDocument = context.canvasElement.ownerDocument
        const iframeWindow = iframeDocument.defaultView!
        const documentCanvas = within(iframeDocument.body)
        const dialog = await documentCanvas.findByRole('dialog', {name: 'Длинная мобильная модалка'})
        const container = dialog.closest<HTMLElement>('[data-pne-modal-container="true"]')!
        const body = dialog.querySelector<HTMLElement>('[data-pne-modal-body="true"]')!
        const footer = dialog.querySelector<HTMLElement>('[data-pne-modal-footer="true"]')!
        const lastSection = dialog.querySelector<HTMLElement>('[data-story-section="mobile-scroll-section-16"]')!
        const viewportWidth = iframeWindow.innerWidth
        const viewportHeight = iframeWindow.innerHeight
        const expectFullyInViewport = (element: HTMLElement) => {
            const rect = element.getBoundingClientRect()

            expect(rect.top).toBeGreaterThanOrEqual(-1)
            expect(rect.left).toBeGreaterThanOrEqual(-1)
            expect(rect.right).toBeLessThanOrEqual(viewportWidth + 1)
            expect(rect.bottom).toBeLessThanOrEqual(viewportHeight + 1)
        }

        expect(viewportWidth).toBe(360)
        expect(viewportHeight).toBe(780)
        expect(container).toBe(dialog)
        expectFullyInViewport(dialog)
        expectFullyInViewport(container)
        expectFullyInViewport(footer)
        expect(body.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 1)

        const footerTopBeforeScroll = footer.getBoundingClientRect().top

        expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)

        body.scrollTop = body.scrollHeight
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

        expect(body.scrollTop).toBeGreaterThan(0)
        expect(body.scrollTop).toBeGreaterThanOrEqual(body.scrollHeight - body.clientHeight - 1)
        expect(Math.abs(footer.getBoundingClientRect().top - footerTopBeforeScroll)).toBeLessThanOrEqual(1)
        expect(body.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 1)
        expectFullyInViewport(dialog)
        expectFullyInViewport(container)
        expectFullyInViewport(footer)
        expect(lastSection.getBoundingClientRect().bottom).toBeLessThanOrEqual(body.getBoundingClientRect().bottom + 1)
    },
    render: () => (
        <ModalStoryHarness
            containerSx={{width: 640}}
            renderActions={close => (
                <PneModalActions
                    secondary={
                        <Button size='medium' variant='outlined' onClick={close}>
                            Отмена
                        </Button>
                    }
                    primary={
                        <Button size='medium' variant='contained' onClick={close}>
                            Сохранить
                        </Button>
                    }
                />
            )}
            subtitle='16 разделов'
            title='Длинная мобильная модалка'
        >
            <LongModalContent />
        </ModalStoryHarness>
    ),
}
