const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export type Config = {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) return;

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
            if (isLocalhost) {
                checkValidServiceWorker(swUrl, config);
                navigator.serviceWorker.ready.then(() => {
                    console.log('PWA: приложение обслуживается service worker (localhost).');
                });
            } else {
                registerValidSW(swUrl, config);
            }
        });
    }
}

function registerValidSW(swUrl: string, config?: Config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.log('PWA: доступна новая версия.');
                            config?.onUpdate?.(registration);
                        } else {
                            console.log('PWA: контент закэширован для офлайн-доступа.');
                            config?.onSuccess?.(registration);
                        }
                    }
                };
            };
        })
        .catch((error) => {
            console.error('Ошибка регистрации service worker:', error);
        });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
    fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
        .then((response) => {
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => window.location.reload());
                });
            } else {
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            console.log('Нет подключения. Приложение работает в офлайн-режиме.');
        });
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => registration.unregister())
            .catch((error) => console.error(error.message));
    }
}
