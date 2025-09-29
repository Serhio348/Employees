import React, { useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import CustomButton from '../../components/customButton/CustomButton'
import { PlusCircleOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import { useGetAllEmployeesQuery } from '../../app/services/employees'
import { Employee } from '@prisma/client'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { Paths } from '../../path'
import { useSelector } from 'react-redux'
import { selectUser } from '../../features/auth/authSlice'


const columns: ColumnsType<Employee> = [
    {
        title: "Фамилия",
        dataIndex: "lastName",
        key: "lastName",
    },
    {
        title: "Имя",
        dataIndex: "firstName",
        key: "firstName",
    },
    {
        title: "Возраст",
        dataIndex: "age",
        key: "age",
    },
    {
        title: "Адрес",
        dataIndex: "address",
        key: "address",
    },
    {
        title: "Профессия",
        dataIndex: "profession",
        key: "profession",
    },
];


const Employees = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser)
    const { data, isLoading } = useGetAllEmployeesQuery()

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    const goToAddEployee = () => navigate(Paths.employeeAdd)

    return (
        <Layout>
            <CustomButton type="primary" onClick={goToAddEployee} icon={<PlusCircleOutlined />}>
                Добавить
            </CustomButton>
            <Table
                loading={isLoading}
                dataSource={data}
                pagination={false}
                columns={columns}
                rowKey={(record => record.id)}
                onRow={(record) => {
                    return {
                        onClick: () => navigate(`${Paths.employee}/${record.id}`),
                        style: { cursor: 'pointer' }
                    }
                }}
            />
        </Layout>
    )
}

export default Employees