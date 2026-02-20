import React, { useEffect, useState } from 'react';

const OfflineIndicator: React.FC = () => {
    // visible: null = не показывать (ещё не было события), false = offline, true = restored
    const [visible, setVisible] = useState<null | 'offline' | 'restored'>(null);

    useEffect(() => {
        const handleOffline = () => setVisible('offline');

        const handleOnline = () => {
            setVisible('restored');
            setTimeout(() => {
                setVisible(null);
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

    if (visible === null) return null;

    const restored = visible === 'restored';

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
        background: restored ? '#52c41a' : '#ff4d4f',
        transition: 'background 0.3s ease',
    };

    return (
        <div style={style}>
            {restored
                ? 'Подключение восстановлено. Обновление данных...'
                : 'Нет подключения к сети — данные могут быть устаревшими'}
        </div>
    );
};

export default OfflineIndicator;
