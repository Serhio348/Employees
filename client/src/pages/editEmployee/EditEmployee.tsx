import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useEditEmployeeMutation, useGetEmployeeQuery } from '../../app/services/employees';
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';
import Layout from '../../components/layout/Layout';
import { Row, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import EmployeeForm from '../../components/employeeForm/EmployeeForm';
import CustomButton from '../../components/customButton/CustomButton';
import { Paths } from '../../path';

const EditEmployee = () => {

    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const [error, setError] = useState("");
    const { data, isLoading } = useGetEmployeeQuery(params.id || "");
    const [editEmployee, { isLoading: isEditing }] = useEditEmployeeMutation();


    if (isLoading) {
        return <span>Загрузка</span>
    }

    const handleEditUser = async (employee: any) => {
        try {
            const editedEmployee = {
                ...data,
                ...employee
            };

            await editEmployee(editedEmployee).unwrap();

            navigate(`${Paths.status}/updated`);
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
        navigate(`${Paths.employee}/${params.id}`);
    };


    return (
        <Layout>
            <Space style={{ marginBottom: 16 }}>
                <CustomButton
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleGoBack}
                >
                    Назад к сотруднику
                </CustomButton>
            </Space>
            <Row align="middle" justify="center">
                <EmployeeForm
                    onFinish={handleEditUser}
                    title="Редактировать сотрудника"
                    employee={data}
                    btnText="Редактировать"
                    error={error}
                    loading={isEditing}
                />
            </Row>
        </Layout>
    )
}

export default EditEmployee