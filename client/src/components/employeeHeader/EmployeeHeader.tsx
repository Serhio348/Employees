import React, { useState, useEffect } from 'react';
import { Card, Typography, Button } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../../contexts/HeaderContext';
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
}

const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({ 
    employee, 
    showBackButton = true, 
    backPath = Paths.home 
}) => {
    const navigate = useNavigate();
    const { showHeader } = useHeader();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleBackClick = () => {
        showHeader();
        navigate(backPath);
    };

    return (
        <>
            <Card 
                style={{ 
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                bodyStyle={{ padding: '16px 20px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: isMobile ? '48px' : '52px',
                        height: isMobile ? '48px' : '52px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '20px' : '22px',
                        color: 'white',
                        flexShrink: 0
                    }}>
                        <UserOutlined />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title 
                            level={3} 
                            style={{ 
                                color: 'white', 
                                margin: 0, 
                                fontSize: isMobile ? '18px' : '22px',
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                lineHeight: '1.2',
                                wordBreak: 'break-word'
                            }}
                        >
                            {`${employee.lastName} ${employee.firstName} ${employee.surName || ''}`.trim()}
                        </Title>
                        <Text 
                            style={{ 
                                color: 'rgba(255, 255, 255, 0.9)', 
                                fontSize: '14px',
                                display: 'block',
                                marginTop: '2px',
                                wordBreak: 'break-word'
                            }}
                        >
                            {employee.profession}
                        </Text>
                        {employee.employeeNumber && (
                            <Text 
                                style={{ 
                                    color: 'rgba(255, 255, 255, 0.8)', 
                                    fontSize: '12px',
                                    display: 'block',
                                    marginTop: '2px',
                                    wordBreak: 'break-word'
                                }}
                            >
                                Табельный номер: {employee.employeeNumber}
                            </Text>
                        )}
                    </div>
                </div>
            </Card>
            
            {/* Кнопки навигации под карточкой */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '16px',
                flexWrap: 'wrap'
            }}>
                {showBackButton && (
                    <Button
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBackClick}
                        size="middle"
                    >
                        Назад
                    </Button>
                )}
                <Button
                    type="primary"
                    onClick={() => {
                        showHeader();
                        navigate(Paths.home);
                    }}
                    size="middle"
                >
                    Главное меню
                </Button>
            </div>
        </>
    );
};

export default EmployeeHeader;
