export type Skin = SkinHeader & SkinBody

type SkinBody = {
    experimentalColor: string
}

type SkinHeader = {
    headerBackgroundColor: string
    headerTextColor: string
    headerBorder: string

    menuBackgroundColor: string
    menuBorder: string
    menuItemBackgroundColor: string
    menuItemTextColor: string
    menuItemBorderLeft: string
    menuItemBorderTop: string
    menuItemBorderRight: string
    menuItemBorderBottom: string
    menuItemActiveBackgroundColor: string
    menuItemActiveTextColor: string
    menuItemActiveBorderLeft: string
    menuItemActiveBorderTop: string
    menuItemActiveBorderRight: string
    menuItemActiveBorderBottom: string
    menuItemHoverBackgroundColor: string
    menuItemHoverTextColor: string
    menuItemHoverBorderLeft: string
    menuItemHoverBorderTop: string
    menuItemHoverBorderRight: string
    menuItemHoverBorderBottom: string

    subMenuBackgroundColor: string
    subMenuItemTextColor: string
    subMenuItemHoverTextColor: string
    subMenuItemHoverBackgroundColor: string

    footerBackgroundColor: string
    footerTextColor: string
}