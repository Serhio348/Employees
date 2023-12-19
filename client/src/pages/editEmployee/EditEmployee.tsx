import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useEditEmployeeMutation, useGetEmployeeQuery } from '../../app/services/employees';
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';
import { Employee } from '@prisma/client';
import Layout from '../../components/layout/Layout';
import { Row } from 'antd';
import EmployeeForm from '../../components/employeeForm/EmployeeForm';
import { Paths } from '../../path';

const EditEmployee = () => {

    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const [error, setError] = useState("");
    const { data, isLoading } = useGetEmployeeQuery(params.id || "");
    const [editEmployee] = useEditEmployeeMutation();


    if (isLoading) {
        return <span>Загрузка</span>
    }

    const handleEditUser = async (employee: Employee) => {
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


    return (
        <Layout>
            <Row align="middle" justify="center">
                <EmployeeForm
                    onFinish={handleEditUser}
                    title="Редактировать сотрудника"
                    employee={data}
                    btnText="Редактировать"
                    error={error}
                />
            </Row>
        </Layout>
    )
}

export default EditEmployee