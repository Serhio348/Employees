import React, { useState, useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useGetEmployeeQuery, useRemoveEmployeeMutation } from '../../app/services/employees';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import EmployeeHeader from '../../components/employeeHeader/EmployeeHeader';
import { useHeader } from '../../contexts/HeaderContext';
import { Modal, Descriptions, Dropdown } from 'antd';
import { DeleteOutlined, EditOutlined, ToolOutlined, MoreOutlined } from '@ant-design/icons';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';
import { Paths } from '../../path';


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
    hasTelegram?: boolean;
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

    // Блокируем скрол страницы на мобильных
    useEffect(() => {
        if (!isMobile) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobile]);

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
                actions={user?.id === employeeData.userId ? (
                    isMobile ? (
                        <Dropdown
                            trigger={['click']}
                            dropdownRender={() => (
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                                    padding: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    minWidth: '180px',
                                }}>
                                    <button
                                        onClick={() => navigate(`/employee/edit/${employeeData.id}`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 12px', borderRadius: '6px',
                                            border: 'none', background: '#1677ff',
                                            color: '#fff', cursor: 'pointer',
                                            fontFamily: 'inherit', fontSize: '14px', width: '100%',
                                        }}
                                    >
                                        <EditOutlined /> Редактировать
                                    </button>
                                    <button
                                        onClick={() => navigate(`/employee/${employeeData.id}/inventory`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 12px', borderRadius: '6px',
                                            border: 'none', background: '#52c41a',
                                            color: '#fff', cursor: 'pointer',
                                            fontFamily: 'inherit', fontSize: '14px', width: '100%',
                                        }}
                                    >
                                        <ToolOutlined /> Инвентарь
                                    </button>
                                    <button
                                        onClick={showModal}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 12px', borderRadius: '6px',
                                            border: '1px solid #ff4d4f', background: '#fff',
                                            color: '#ff4d4f', cursor: 'pointer',
                                            fontFamily: 'inherit', fontSize: '14px', width: '100%',
                                        }}
                                    >
                                        <DeleteOutlined /> Удалить
                                    </button>
                                </div>
                            )}
                        >
                            <button style={{
                                display: 'inline-flex', alignItems: 'center',
                                height: '32px', padding: '0 12px', fontSize: '20px',
                                borderRadius: '6px', border: '1px solid #d9d9d9',
                                background: '#fff', color: 'rgba(0,0,0,0.88)',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                <MoreOutlined />
                            </button>
                        </Dropdown>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate(`/employee/edit/${employeeData.id}`)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    height: '32px', padding: '0 15px', fontSize: '14px',
                                    borderRadius: '6px', border: 'none',
                                    background: '#1677ff', color: '#fff',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <EditOutlined /> Редактировать
                            </button>
                            <button
                                onClick={() => navigate(`/employee/${employeeData.id}/inventory`)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    height: '32px', padding: '0 15px', fontSize: '14px',
                                    borderRadius: '6px', border: 'none',
                                    background: '#52c41a', color: '#fff',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <ToolOutlined /> Инвентарь
                            </button>
                            <button
                                onClick={showModal}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    height: '32px', padding: '0 15px', fontSize: '14px',
                                    borderRadius: '6px', border: '1px solid #ff4d4f',
                                    background: '#fff', color: '#ff4d4f',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <DeleteOutlined /> Удалить
                            </button>
                        </>
                    )
                ) : undefined}
            />

            <Descriptions
                title="Подробная информация"
                bordered
                column={1}
                size="small"
                style={{
                    marginBottom: 16,
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                }}
                labelStyle={{ fontWeight: 500, width: '40%', color: 'var(--text-secondary)', fontSize: '13px' }}
                contentStyle={{ color: 'var(--text-primary)', fontSize: '13px' }}
            >
                <Descriptions.Item label="Возраст">
                    {getCurrentAge() ? `${getCurrentAge()} лет` : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Дата рождения">
                    {employeeData.birthDate ? new Date(employeeData.birthDate).toLocaleDateString('ru-RU') : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Рост">
                    {employeeData.height ? `${employeeData.height} см` : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Размер одежды">
                    {employeeData.clothingSize || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Размер обуви">
                    {employeeData.shoeSize || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Telegram">
                    {employeeData.hasTelegram
                        ? <span style={{ color: '#52c41a' }}>✓ Привязан</span>
                        : <span style={{ color: 'var(--text-secondary)' }}>Не привязан — пусть сотрудник напишет <a href="https://t.me/belalkosiz_bot" target="_blank" rel="noreferrer">@belalkosiz_bot</a> команду /start</span>
                    }
                </Descriptions.Item>
                <Descriptions.Item label="Адрес">
                    {employeeData.address}
                </Descriptions.Item>
            </Descriptions>
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