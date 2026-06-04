import React, { useEffect, useState } from 'react';
import {
    type BeforeInstallPromptEvent,
    canShowNativeInstallPrompt,
    getDeferredInstallPrompt,
    isInStandaloneMode,
    isIOS,
    requestPwaInstall,
} from '../../utils/pwaInstall';

const DISMISSED_KEY = 'pwa-install-dismissed';

const btnStyle: React.CSSProperties = {
    background: '#fff',
    color: '#1d4ed8',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 14px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    flexShrink: 0,
};

const closeStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    padding: '0 2px',
    flexShrink: 0,
};

const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #0c1b4a 0%, #1d4ed8 100%)',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 9999,
    maxWidth: '90vw',
    fontSize: '14px',
};

const PwaInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOS, setShowIOS] = useState(false);

    useEffect(() => {
        if (isInStandaloneMode()) return;
        if (localStorage.getItem(DISMISSED_KEY)) return;

        if (isIOS()) {
            setShowIOS(true);
            return;
        }

        // Событие могло уже сработать до монтирования компонента
        const already = getDeferredInstallPrompt();
        if (already) {
            setDeferredPrompt(already);
            setShowBanner(true);
            return;
        }

        const onPromptReady = () => {
            const prompt = getDeferredInstallPrompt();
            if (prompt) {
                setDeferredPrompt(prompt);
                setShowBanner(true);
            }
        };
        window.addEventListener('pwa-prompt-ready', onPromptReady);
        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
            setDeferredPrompt(null);
            (window as typeof window & { __deferredInstallPrompt?: null }).__deferredInstallPrompt = null;
        });
        return () => window.removeEventListener('pwa-prompt-ready', onPromptReady);
    }, []);

    const handleInstall = async () => {
        if (!canShowNativeInstallPrompt()) return;
        const result = await requestPwaInstall();
        if (result.status === 'accepted') {
            setShowBanner(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setShowIOS(false);
        localStorage.setItem(DISMISSED_KEY, '1');
    };

    if (showBanner) {
        return (
            <div style={bannerStyle}>
                <span>Установить приложение</span>
                <button style={btnStyle} onClick={handleInstall}>Установить</button>
                <button style={closeStyle} onClick={handleDismiss} aria-label="Закрыть">✕</button>
            </div>
        );
    }

    if (showIOS) {
        return (
            <div style={{ ...bannerStyle, flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Установить приложение</span>
                    <button style={closeStyle} onClick={handleDismiss} aria-label="Закрыть">✕</button>
                </div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                    Нажмите <strong>«Поделиться»</strong> → <strong>«На экран «Домой»»</strong>
                </span>
            </div>
        );
    }

    return null;
};

export default PwaInstallPrompt;
