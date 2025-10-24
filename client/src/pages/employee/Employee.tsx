import React, { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useGetEmployeeQuery, useRemoveEmployeeMutation } from '../../app/services/employees';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import EmployeeHeader from '../../components/employeeHeader/EmployeeHeader';
import { useHeader } from '../../contexts/HeaderContext';
import { Divider, Modal, Typography, Card, Row, Col, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';
import CustomButton from '../../components/customButton/CustomButton';
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';
import { Paths } from '../../path';

const { Text } = Typography;

// Расширенный интерфейс Employee с новыми полями
interface ExtendedEmployee {
    id: string;
    firstName: string;
    lastName: string;
    surName: string | null;
    age: number;
    birthDate?: string | null;
    profession: string;
    address: string;
    employeeNumber?: string | null;
    height?: number | null;
    clothingSize?: string | null;
    shoeSize?: string | null;
    userId: string;
}


const Employee = () => {

    const navigate = useNavigate();
    const [error, setError] = useState("");
    const params = useParams<{ id: string }>();
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { data, isLoading } = useGetEmployeeQuery(params.id || "")
    const employeeData = data as ExtendedEmployee | undefined
    const [removeEmployee] = useRemoveEmployeeMutation();
    const user = useSelector(selectUser);
    const { hideHeader } = useHeader();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Скрываем хедер при загрузке страницы сотрудника
    useEffect(() => {
        if (employeeData) {
            hideHeader();
        }
        
        return () => {
            // При размонтировании компонента показываем хедер обратно
            // Это произойдет автоматически при переходе на другую страницу
        };
    }, [employeeData, hideHeader]);

    if (isLoading) {
        return <span>Загрузка</span>;
    }

    if (!employeeData) {
        return <Navigate to="/" />;
    }

    const showModal = () => {
        setIsModalOpen(true);
    };

    const hideModal = () => {
        setIsModalOpen(false);
        // Принудительно очищаем состояние
        setTimeout(() => {
            setIsModalOpen(false);
        }, 100);
    };

    const handleDeleteUser = async () => {
        hideModal();

        try {
            await removeEmployee(employeeData.id).unwrap();

            navigate(`${Paths.status}/deleted`);
        } catch (err) {
            const maybeError = isErrorWithMessage(err);

            if (maybeError) {
                setError(err.data.message);
            } else {
                setError("Неизвестная ошибка");
            }
        }
    };


    // Функция для расчета возраста на основе даты рождения
    const calculateAge = (birthDate: string | null | undefined): number | null => {
        if (!birthDate) return null;
        
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    };

    // Получаем возраст (либо из поля age, либо рассчитываем из даты рождения)
    const getCurrentAge = (): number | null => {
        if (employeeData.birthDate) {
            return calculateAge(employeeData.birthDate);
        }
        return employeeData.age;
    };

    return (
        <Layout>
            <EmployeeHeader 
                employee={{
                    id: employeeData.id,
                    firstName: employeeData.firstName,
                    lastName: employeeData.lastName,
                    surName: employeeData.surName,
                    profession: employeeData.profession,
                    employeeNumber: employeeData.employeeNumber
                }}
                backPath={Paths.home}
            />

            {/* Современный дизайн подробной информации */}
            <Card 
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px'
                        }}>
                            <UserOutlined />
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '600' }}>Подробная информация</span>
                    </div>
                }
                style={{ 
                    marginBottom: 24,
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-color)'
                }}
                bodyStyle={{ padding: '24px' }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            size="small" 
                            style={{ 
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{ marginBottom: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Возраст
                                </Text>
                            </div>
                            <div>
                                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                                    {getCurrentAge() ? `${getCurrentAge()} лет` : 'Не указан'}
                                </Tag>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            size="small" 
                            style={{ 
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{ marginBottom: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Дата рождения
                                </Text>
                            </div>
                            <div>
                                <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                                    {employeeData.birthDate ? new Date(employeeData.birthDate).toLocaleDateString('ru-RU') : 'Не указана'}
                                </Tag>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            size="small" 
                            style={{ 
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{ marginBottom: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Рост
                                </Text>
                            </div>
                            <div>
                                <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                                    {employeeData.height ? `${employeeData.height} см` : 'Не указан'}
                                </Tag>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            size="small" 
                            style={{ 
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{ marginBottom: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Размер одежды
                                </Text>
                            </div>
                            <div>
                                <Tag color="purple" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                                    {employeeData.clothingSize || 'Не указан'}
                                </Tag>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            size="small" 
                            style={{ 
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{ marginBottom: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Размер обуви
                                </Text>
                            </div>
                            <div>
                                <Tag color="cyan" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                                    {employeeData.shoeSize || 'Не указан'}
                                </Tag>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            size="small" 
                            style={{ 
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{ marginBottom: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Адрес
                                </Text>
                            </div>
                            <div>
                                <Text style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                                    {employeeData.address}
                                </Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Card>
            {user?.id === employeeData.userId && (
                <>
                    <Divider orientation="left">Управление</Divider>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '8px' : '12px',
                        flexWrap: 'wrap'
                    }}>
                        <Link to={`/employee/edit/${employeeData.id}`}>
                            <CustomButton
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                                style={{
                                    width: isMobile ? "100%" : "140px",
                                    height: "32px",
                                    fontSize: "12px",
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                Редактировать
                            </CustomButton>
                        </Link>
                        <Link to={`/employee/${employeeData.id}/inventory`}>
                            <CustomButton
                                type="default"
                                icon={<ToolOutlined />}
                                size="small"
                                style={{
                                    width: isMobile ? "100%" : "140px",
                                    height: "32px",
                                    fontSize: "12px",
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    borderColor: '#1890ff',
                                    color: '#1890ff'
                                }}
                            >
                                Инвентарь
                            </CustomButton>
                        </Link>
                        <CustomButton
                            danger
                            onClick={showModal}
                            icon={<DeleteOutlined />}
                            size="small"
                            style={{
                                width: isMobile ? "100%" : "140px",
                                height: "32px",
                                fontSize: "12px",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            Удалить
                        </CustomButton>
                    </div>
                </>
            )}
            <ErrorMessage message={error} />
            <Modal
                title="Подтвердите удаление"
                open={isModalOpen}
                onOk={handleDeleteUser}
                onCancel={hideModal}
                okText="Подтвердить"
                cancelText="Отменить"
            >
                Вы действительно хотите удалить сотрудника из таблицы?
            </Modal>
            
            <style>
                {`
                    /* Адаптивные стили для карточки сотрудника */
                    @media (max-width: 768px) {
                        .ant-card-body {
                            padding: 16px !important;
                        }
                        
                        .ant-typography h1 {
                            font-size: 16px !important;
                            line-height: 1.2 !important;
                            word-break: break-word !important;
                        }
                        
                        .ant-typography {
                            font-size: 12px !important;
                            word-break: break-word !important;
                        }
                        
                        /* Дополнительные стили для табельного номера */
                        .ant-typography:last-child {
                            font-size: 9px !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .ant-typography h1 {
                            font-size: 14px !important;
                        }
                        
                        .ant-typography {
                            font-size: 11px !important;
                        }
                        
                        .ant-typography:last-child {
                            font-size: 8px !important;
                        }
                    }
                `}
            </style>
        </Layout>
    )
}

export default Employee