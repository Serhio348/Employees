import React, { useEffect, useState } from 'react';

const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOnline(false);
            setShowRestored(false);
        };

        const handleOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            setTimeout(() => {
                setShowRestored(false);
                window.location.reload();
            }, 2000);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (isOnline && !showRestored) return null;

    const style: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 500,
        color: '#fff',
        background: isOnline ? '#52c41a' : '#ff4d4f',
        transition: 'background 0.3s ease',
    };

    return (
        <div style={style}>
            {isOnline
                ? 'Подключение восстановлено. Обновление данных...'
                : 'Нет подключения к сети — данные могут быть устаревшими'}
        </div>
    );
};

export default OfflineIndicator;
