import React, { useState } from "react";
import { Layout, Space, Typography, Avatar, Modal, Form, Input, Button } from "antd";
import { LoginOutlined, TeamOutlined, UserOutlined, EditOutlined } from "@ant-design/icons";

import styles from "./Header.module.css";
import CustomButton from "../customButton/CustomButton";
import { Link, useNavigate } from "react-router-dom";
import { Paths } from "../../path";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../../features/auth/authSlice";

const Header = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();

    const onLogoutClick = () => {
        dispatch(logout());
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleEditProfile = () => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                lastName: user.lastName,
                email: user.email
            });
            setIsEditModalVisible(true);
        }
    };

    const handleEditSubmit = async (values: any) => {
        try {
            // Здесь будет логика обновления профиля пользователя
            console.log('Updating profile:', values);
            // TODO: Добавить API вызов для обновления профиля
            setIsEditModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        form.resetFields();
    };

    return (
        <Layout.Header className={styles.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space align="center">
                <TeamOutlined className={styles.teamIcon} />
                <Link to={Paths.home}>
                    <CustomButton type="ghost">
                        <Typography.Title level={1}>Участок ТЭО</Typography.Title>
                    </CustomButton>
                </Link>
            </Space>
            {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            marginBottom: '4px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                        }}
                        onClick={handleEditProfile}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Avatar icon={<UserOutlined />} size="small" />
                        <Typography.Text strong style={{ color: 'white', fontSize: '14px' }}>
                            {user.name} {user.lastName}
                        </Typography.Text>
                        <EditOutlined style={{ color: 'white', fontSize: '12px' }} />
                    </div>
                    <CustomButton
                        type="ghost"
                        icon={<LoginOutlined />}
                        onClick={onLogoutClick}
                    >
                        Выйти
                    </CustomButton>
                </div>
            ) : (
                <Space align="center">
                    <Link to={Paths.register}>
                        <CustomButton type="ghost" icon={<UserOutlined />}>
                            Зарегистрироваться
                        </CustomButton>
                    </Link>
                    <Link to={Paths.login}>
                        <CustomButton type="ghost" icon={<LoginOutlined />}>
                            Войти
                        </CustomButton>
                    </Link>
                </Space>
            )}

            <Modal
                title="Редактировать профиль"
                open={isEditModalVisible}
                onOk={() => form.submit()}
                onCancel={handleEditCancel}
                okText="Сохранить"
                cancelText="Отмена"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleEditSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Имя"
                        rules={[{ required: true, message: 'Введите имя' }]}
                    >
                        <Input placeholder="Введите имя" />
                    </Form.Item>
                    
                    <Form.Item
                        name="lastName"
                        label="Фамилия"
                        rules={[{ required: true, message: 'Введите фамилию' }]}
                    >
                        <Input placeholder="Введите фамилию" />
                    </Form.Item>
                    
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Введите email' },
                            { type: 'email', message: 'Введите корректный email' }
                        ]}
                    >
                        <Input placeholder="Введите email" />
                    </Form.Item>
                </Form>
            </Modal>

        </Layout.Header>
    );
};

export default Header;
