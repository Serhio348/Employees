import React, { useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import CustomButton from '../../components/customButton/CustomButton'
import { PlusCircleOutlined, UserOutlined } from '@ant-design/icons'
import { Table, Tag } from 'antd'
import { useGetAllEmployeesQuery } from '../../app/services/employees'
import { Employee } from '@prisma/client'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { Paths } from '../../path'
import { useSelector } from 'react-redux'
import { selectUser } from '../../features/auth/authSlice'

const columns: ColumnsType<Employee> = [
    {
        title: "ФИО",
        key: "fullName",
        render: (_, record) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px'
                }}>
                    <UserOutlined />
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                        {`${record.lastName} ${record.firstName} ${record.surName || ''}`.trim()}
                    </div>
                </div>
            </div>
        ),
    },
    {
        title: "Профессия",
        dataIndex: "profession",
        key: "profession",
        render: (profession) => (
            <Tag color="green" style={{ fontSize: '12px', padding: '2px 8px' }}>
                {profession || 'Не указана'}
            </Tag>
        ),
    },
    {
        title: "Табельный номер",
        dataIndex: "employeeNumber",
        key: "employeeNumber",
        render: (employeeNumber) => (
            <Tag color="blue" style={{ fontSize: '12px', padding: '2px 8px' }}>
                {employeeNumber || 'Не указан'}
            </Tag>
        ),
    },
    {
        title: "Адрес",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
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