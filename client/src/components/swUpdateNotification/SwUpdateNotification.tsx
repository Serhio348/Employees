import React, { useEffect, useState } from 'react';
import { Button } from 'antd';

const SwUpdateNotification: React.FC = () => {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            setRegistration((e as CustomEvent<ServiceWorkerRegistration>).detail);
        };
        window.addEventListener('sw-update', handler);
        return () => window.removeEventListener('sw-update', handler);
    }, []);

    if (!registration) return null;

    const handleUpdate = () => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    };

    const style: React.CSSProperties = {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#0c1b4a',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9998,
        maxWidth: '90vw',
        fontSize: '14px',
        whiteSpace: 'nowrap',
    };

    return (
        <div style={style}>
            <span>Доступна новая версия</span>
            <Button
                size="small"
                onClick={handleUpdate}
                style={{ background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 600 }}
            >
                Обновить
            </Button>
        </div>
    );
};

export default SwUpdateNotification;
