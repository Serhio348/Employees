import React, { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useGetEmployeeQuery, useRemoveEmployeeMutation } from '../../app/services/employees';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import { Descriptions, Divider, Modal, Space } from 'antd';
import { DeleteOutlined, EditOutlined, ToolOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';
import CustomButton from '../../components/customButton/CustomButton';
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
            <Descriptions title='Информация о сотруднике' bordered>
                <Descriptions.Item label="Имя" span={3} >
                    {`${employeeData.firstName} ${employeeData.lastName} ${employeeData.surName}`}
                </Descriptions.Item>
                <Descriptions.Item label="Возраст" span={3} >
                    {getCurrentAge() ? `${getCurrentAge()} лет` : 'Не указан'}
                </Descriptions.Item>
                <Descriptions.Item label="Дата рождения" span={3} >
                    {employeeData.birthDate ? new Date(employeeData.birthDate).toLocaleDateString('ru-RU') : 'Не указана'}
                </Descriptions.Item>
                <Descriptions.Item label="Адрес" span={3} >
                    {`${employeeData.address}`}
                </Descriptions.Item>
                <Descriptions.Item label="Профессия" span={3} >
                    {`${employeeData.profession}`}
                </Descriptions.Item>
                <Descriptions.Item label="Табельный номер" span={3} >
                    {employeeData.employeeNumber || 'Не указан'}
                </Descriptions.Item>
                <Descriptions.Item label="Рост" span={3} >
                    {employeeData.height ? `${employeeData.height} см` : 'Не указан'}
                </Descriptions.Item>
                <Descriptions.Item label="Размер одежды" span={3} >
                    {employeeData.clothingSize || 'Не указан'}
                </Descriptions.Item>
                <Descriptions.Item label="Размер обуви" span={3} >
                    {employeeData.shoeSize || 'Не указан'}
                </Descriptions.Item>
            </Descriptions>
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