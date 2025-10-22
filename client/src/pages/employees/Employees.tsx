import React, { useEffect, useState } from 'react'
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

const Employees = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser)
    const { data, isLoading } = useGetAllEmployeesQuery(user?.id)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const goToAddEployee = () => navigate(Paths.employeeAdd)

    const getColumns = (): ColumnsType<Employee> => {
        const baseColumns: ColumnsType<Employee> = [
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
                            {isMobile && (
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    {record.profession || 'Профессия не указана'}
                                </div>
                            )}
                        </div>
                    </div>
                ),
            },
        ]

        if (!isMobile) {
            baseColumns.push(
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
                }
            )
        }

        return baseColumns
    }

    return (
        <Layout>
            <CustomButton type="primary" onClick={goToAddEployee} icon={<PlusCircleOutlined />}>
                Добавить
            </CustomButton>
            <Table
                loading={isLoading}
                dataSource={data}
                columns={getColumns()}
                rowKey={(record => record.id)}
                scroll={isMobile ? { x: 400 } : undefined}
                pagination={{
                    pageSize: isMobile ? 8 : 10,
                    showSizeChanger: false,
                    showQuickJumper: false,
                    showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} сотрудников`
                }}
                size={isMobile ? "small" : "middle"}
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