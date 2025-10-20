import React, { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useGetEmployeeQuery, useRemoveEmployeeMutation } from '../../app/services/employees';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import { Divider, Modal, Space, Typography, Card, Row, Col, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, ToolOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';
import CustomButton from '../../components/customButton/CustomButton';
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';
import { Paths } from '../../path';

const { Title, Text } = Typography;

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
    const { data, isLoading } = useGetEmployeeQuery(params.id || "")
    const employeeData = data as ExtendedEmployee | undefined
    const [removeEmployee] = useRemoveEmployeeMutation();
    const user = useSelector(selectUser);

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

    const handleGoBack = () => {
        navigate(Paths.home);
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
            <Space style={{ marginBottom: 16 }}>
                <CustomButton
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleGoBack}
                >
                    Назад к списку сотрудников
                </CustomButton>
            </Space>
            
            {/* Выделенная карточка с ФИО */}
            <Card 
                style={{ 
                    marginBottom: 24, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px'
                }}
                bodyStyle={{ padding: '24px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        color: 'white'
                    }}>
                        <UserOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Title 
                            level={1} 
                            style={{ 
                                color: 'white', 
                                margin: 0, 
                                fontSize: '32px',
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        >
                            {`${employeeData.lastName} ${employeeData.firstName} ${employeeData.surName || ''}`.trim()}
                        </Title>
                        <Text 
                            style={{ 
                                color: 'rgba(255, 255, 255, 0.9)', 
                                fontSize: '16px',
                                display: 'block',
                                marginTop: '8px'
                            }}
                        >
                            {employeeData.profession}
                        </Text>
                        {employeeData.employeeNumber && (
                            <Text 
                                style={{ 
                                    color: 'rgba(255, 255, 255, 0.8)', 
                                    fontSize: '14px',
                                    display: 'block',
                                    marginTop: '4px'
                                }}
                            >
                                Табельный номер: {employeeData.employeeNumber}
                            </Text>
                        )}
                    </div>
                </div>
            </Card>

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
                    <Divider orientation="left">Действия</Divider>
                    <Space>
                        <Link to={`/employee/edit/${employeeData.id}`}>
                            <CustomButton
                                shape="round"
                                type="default"
                                icon={<EditOutlined />}
                            >
                                Редактировать
                            </CustomButton>
                        </Link>
                        <Link to={`/employee/${employeeData.id}/inventory`}>
                            <CustomButton
                                shape="round"
                                type="default"
                                icon={<ToolOutlined />}
                            >
                                Инвентарь
                            </CustomButton>
                        </Link>
                        <CustomButton
                            shape="round"
                            danger
                            onClick={showModal}
                            icon={<DeleteOutlined />}
                        >
                            Удалить
                        </CustomButton>
                    </Space>
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
        </Layout>
    )
}

export default Employee