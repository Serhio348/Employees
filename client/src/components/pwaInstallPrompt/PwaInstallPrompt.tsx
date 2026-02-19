import React, { useEffect, useState } from 'react';
import { Button } from 'antd';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

const isIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as any).MSStream;

const isInStandaloneMode = () =>
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

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

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setShowIOS(false);
        localStorage.setItem(DISMISSED_KEY, '1');
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
        whiteSpace: 'nowrap',
    };

    const closeBtn: React.CSSProperties = {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        fontSize: '16px',
        lineHeight: 1,
        padding: '0 2px',
        flexShrink: 0,
    };

    if (showBanner) {
        return (
            <div style={bannerStyle}>
                <span>Установить приложение</span>
                <Button
                    size="small"
                    onClick={handleInstall}
                    style={{ background: '#fff', color: '#1d4ed8', border: 'none', fontWeight: 600 }}
                >
                    Установить
                </Button>
                <button style={closeBtn} onClick={handleDismiss} aria-label="Закрыть">✕</button>
            </div>
        );
    }

    if (showIOS) {
        return (
            <div style={{ ...bannerStyle, whiteSpace: 'normal', maxWidth: '80vw', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Установить приложение</span>
                    <button style={closeBtn} onClick={handleDismiss} aria-label="Закрыть">✕</button>
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
