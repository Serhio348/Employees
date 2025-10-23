// Константы для адаптивности
export const BREAKPOINTS = {
    MOBILE: 768,
    SMALL_MOBILE: 480,
    VERY_SMALL: 420
} as const;

export const FONT_SIZES = {
    DESKTOP: {
        TITLE: '24px',
        SUBTITLE: '16px',
        BODY: '14px',
        SMALL: '12px'
    },
    MOBILE: {
        TITLE: '16px',
        SUBTITLE: '12px',
        BODY: '11px',
        SMALL: '9px'
    },
    VERY_SMALL: {
        TITLE: '14px',
        SUBTITLE: '11px',
        BODY: '10px',
        SMALL: '8px'
    }
} as const;

export const SPACING = {
    DESKTOP: {
        CARD_PADDING: '20px',
        SECTION_MARGIN: '16px',
        ELEMENT_GAP: '16px'
    },
    MOBILE: {
        CARD_PADDING: '16px',
        SECTION_MARGIN: '12px',
        ELEMENT_GAP: '8px'
    }
} as const;

export const CARD_SIZES = {
    DESKTOP: {
        MIN_HEIGHT: 'auto',
        ICON_SIZE: '60px',
        ICON_FONT_SIZE: '24px'
    },
    MOBILE: {
        MIN_HEIGHT: '80px',
        ICON_SIZE: '50px',
        ICON_FONT_SIZE: '20px'
    },
    VERY_SMALL: {
        MIN_HEIGHT: '70px',
        ICON_SIZE: '45px',
        ICON_FONT_SIZE: '18px'
    }
} as const;
