export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const isInStandaloneMode = (): boolean =>
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

export const isIOS = (): boolean =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;

export const getDeferredInstallPrompt = (): BeforeInstallPromptEvent | null =>
    (window as typeof window & { __deferredInstallPrompt?: BeforeInstallPromptEvent | null })
        .__deferredInstallPrompt ?? null;

/** Браузер разрешил показать нативный диалог установки (Chrome / Edge на Android и desktop). */
export const canShowNativeInstallPrompt = (): boolean => getDeferredInstallPrompt() != null;

export type PwaInstallResult =
    | { status: 'accepted' }
    | { status: 'dismissed' }
    | { status: 'ios_manual' }
    | { status: 'unavailable'; reason: 'dev' | 'no_sw' | 'not_https' | 'unknown' };

export const getInstallUnavailableReason = (): PwaInstallResult['reason'] => {
    if (process.env.NODE_ENV !== 'production') return 'dev';
    if (!window.isSecureContext) return 'not_https';
    if (!('serviceWorker' in navigator)) return 'no_sw';
    return 'unknown';
};

export const requestPwaInstall = async (): Promise<PwaInstallResult> => {
    const deferred = getDeferredInstallPrompt();
    if (deferred) {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === 'accepted') {
            (window as typeof window & { __deferredInstallPrompt?: null }).__deferredInstallPrompt = null;
            return { status: 'accepted' };
        }
        return { status: 'dismissed' };
    }

    if (isIOS()) {
        return { status: 'ios_manual' };
    }

    return { status: 'unavailable', reason: getInstallUnavailableReason() };
};

export const installUnavailableMessage = (reason: PwaInstallResult extends { status: 'unavailable' } ? PwaInstallResult['reason'] : never): string => {
    switch (reason) {
        case 'dev':
            return 'В режиме разработки (npm run dev) установка недоступна. Откройте собранную версию сайта (npm run build и деплой по HTTPS).';
        case 'not_https':
            return 'Установка работает только по HTTPS. Откройте сайт по защищённому адресу.';
        case 'no_sw':
            return 'Ваш браузер не поддерживает установку приложений.';
        default:
            return 'Браузер пока не предлагает установку. Обновите страницу, откройте сайт в Chrome и подождите несколько секунд — кнопка «Установить» появится, когда сайт будет готов.';
    }
};
