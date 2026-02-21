import React from 'react';
import { Card, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../../contexts/HeaderContext';
import { useResponsive } from '../../hooks/useResponsive';
import { Paths } from '../../path';

const { Title, Text } = Typography;

interface EmployeeHeaderProps {
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        surName?: string | null;
        profession: string;
        employeeNumber?: string | null;
    };
    showBackButton?: boolean;
    backPath?: string;
    actions?: React.ReactNode;
}

const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
    employee,
    showBackButton = true,
    backPath = Paths.home,
    actions
}) => {
    const navigate = useNavigate();
    const { showHeader } = useHeader();
    const { isMobile } = useResponsive();

    const handleBackClick = () => {
        showHeader();
        navigate(backPath);
    };

    return (
        <>
            <Card
                style={{
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #0c1b4a 0%, #1d4ed8 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgba(29, 78, 216, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                bodyStyle={{ padding: isMobile ? '12px 16px' : '16px 20px' }}
            >
                {/* Верхняя световая линия — как в основной шапке */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                    pointerEvents: 'none',
                }} />
                {/* Внутренний оверлей глубины */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 55%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                    {/* Аватар */}
                    <div style={{
                        width: isMobile ? '46px' : '52px',
                        height: isMobile ? '46px' : '52px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.12)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '20px' : '22px',
                        color: '#93c5fd',
                        flexShrink: 0,
                        filter: 'drop-shadow(0 0 6px rgba(147, 197, 253, 0.4))',
                    }}>
                        <UserOutlined />
                    </div>

                    {/* Информация о сотруднике */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title
                            level={3}
                            style={{
                                color: 'white',
                                margin: 0,
                                fontSize: isMobile ? '17px' : '21px',
                                fontWeight: 700,
                                textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                letterSpacing: '-0.2px',
                            }}
                        >
                            {`${employee.lastName} ${employee.firstName} ${employee.surName || ''}`.trim()}
                        </Title>
                        <Text
                            style={{
                                color: 'rgba(255, 255, 255, 0.85)',
                                fontSize: isMobile ? '13px' : '14px',
                                display: 'block',
                                marginTop: '3px',
                                wordBreak: 'break-word',
                            }}
                        >
                            {employee.profession}
                        </Text>
                        {employee.employeeNumber && (
                            <Text
                                style={{
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: isMobile ? '13px' : '14px',
                                    display: 'block',
                                    marginTop: '3px',
                                    wordBreak: 'break-word',
                                }}
                            >
                                № {employee.employeeNumber}
                            </Text>
                        )}
                    </div>
                </div>
            </Card>

            {/* Кнопки навигации + действия */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                {showBackButton && (
                    <button
                        onClick={handleBackClick}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            height: '32px', padding: '0 15px', fontSize: '14px',
                            borderRadius: '6px', border: '1px solid #d9d9d9',
                            background: '#fff', color: 'rgba(0,0,0,0.88)',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        ← Назад
                    </button>
                )}
                {backPath !== Paths.home && (
                    <button
                        onClick={() => { showHeader(); navigate(Paths.home); }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            height: '32px', padding: '0 15px', fontSize: '14px',
                            borderRadius: '6px', border: 'none',
                            background: '#1677ff', color: '#fff',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        Главное меню
                    </button>
                )}
                {actions}
            </div>
        </>
    );
};

export default EmployeeHeader;
