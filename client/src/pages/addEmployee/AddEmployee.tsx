import React, { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { Row } from 'antd'
import EmployeeForm from '../../components/employeeForm/EmployeeForm'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser } from '../../features/auth/authSlice'
import { useAddEmployeeMutation } from '../../app/services/employees'
import { Employee } from '@prisma/client'
import { Paths } from '../../path'
import { isErrorWithMessage } from '../../utils/isErrorWithMessage'

const AddEmployee = () => {
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [AddEmployee, { isLoading: isAdding }] = useAddEmployeeMutation();

    useEffect(() => {
        if (!user) {
            navigate('/login')
        }
    }, [navigate, user])

    const handleAddEmployee = async (data: Employee) => {
        try {
            await AddEmployee(data).unwrap()

            navigate(`${Paths.status}/created`)
        } catch (error) {
            const maybeError = isErrorWithMessage(error)

            if (maybeError) {
                setError(error.data.message)
            } else {
                setError('Неизвестная ошибка')
            }
        }
    }

    return (
        <Layout>
            <Row align='middle' justify='center'>
                <EmployeeForm
                    title='Добавить сотрудника'
                    btnText='Добавить'
                    onFinish={handleAddEmployee}
                    error={error}
                    loading={isAdding}
                />
            </Row>
        </Layout>
    )
}

export default AddEmployee