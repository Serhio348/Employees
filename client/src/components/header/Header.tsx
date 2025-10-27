import React, { useState } from "react";
import { Layout, Typography, Avatar, Modal, Form, Input, Switch } from "antd";
import { LoginOutlined, TeamOutlined, UserOutlined, EditOutlined, BulbOutlined, BulbFilled } from "@ant-design/icons";

import styles from "./Header.module.css";
import CustomButton from "../customButton/CustomButton";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Paths } from "../../path";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../../features/auth/authSlice";
import { useTheme } from "../../contexts/ThemeContext";

const Header = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Определяем, находимся ли мы на странице авторизации
    const isAuthPage = location.pathname === Paths.login || location.pathname === Paths.register;

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
        <Layout.Header className={isAuthPage ? styles.authHeader : styles.header}>
            {/* Логотип и название */}
            <div className={isAuthPage ? styles.authHeaderCenter : styles.headerLeft}>
                <Link to={Paths.home} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <TeamOutlined className={isAuthPage ? styles.authTeamIcon : styles.teamIcon} />
                    <Typography.Title level={1} style={{ 
                        margin: 0, 
                        fontSize: isAuthPage ? 'clamp(24px, 5vw, 32px)' : 'clamp(18px, 4vw, 24px)', 
                        color: isAuthPage ? 'var(--text-primary)' : 'white',
                        textAlign: isAuthPage ? 'center' : 'left'
                    }}>
                        Участок ТЭО
                    </Typography.Title>
                </Link>
            </div>

            {/* Правая часть - все элементы управления в столбце */}
            {!isAuthPage && (
                <div className={styles.headerRight}>
                    <div className={styles.controlsColumn}>
                        {/* Переключатель темы - скрыт на мобильных */}
                        <div className={styles.themeToggle}>
                            <BulbOutlined style={{ color: 'white', fontSize: '12px' }} />
                            <Switch
                                checked={theme === 'dark'}
                                onChange={toggleTheme}
                                size="small"
                                style={{ backgroundColor: theme === 'dark' ? '#1890ff' : '#d9d9d9' }}
                            />
                            <BulbFilled style={{ color: 'white', fontSize: '12px' }} />
                        </div>

                        {user ? (
                            <>
                                {/* Профиль пользователя */}
                                <div 
                                    className={styles.userProfile}
                                    onClick={handleEditProfile}
                                >
                                    <Avatar icon={<UserOutlined />} size="default" />
                                    <div className={styles.userInfo}>
                                        <Typography.Text strong style={{ color: 'white', fontSize: 'clamp(14px, 4vw, 16px)' }}>
                                            {user.name} {user.lastName}
                                        </Typography.Text>
                                        <EditOutlined style={{ color: 'white', fontSize: '12px' }} />
                                    </div>
                                </div>
                                
                                {/* Кнопка выхода */}
                                <CustomButton
                                    type="ghost"
                                    icon={<LoginOutlined />}
                                    onClick={onLogoutClick}
                                    size="small"
                                    className={styles.logoutButton}
                                >
                                    Выйти
                                </CustomButton>
                            </>
                        ) : (
                            <div className={styles.authButtons}>
                                <Link to={Paths.register}>
                                    <CustomButton type="ghost" icon={<UserOutlined />} size="small">
                                        Регистрация
                                    </CustomButton>
                                </Link>
                                <Link to={Paths.login}>
                                    <CustomButton type="ghost" icon={<LoginOutlined />} size="small">
                                        Войти
                                    </CustomButton>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Переключатель темы для мобильных - в самом низу */}
            {!isAuthPage && (
                <div className={styles.mobileThemeToggle}>
                    <div className={styles.themeToggle}>
                        <BulbOutlined style={{ color: 'white', fontSize: '12px' }} />
                        <Switch
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                            size="small"
                            style={{ backgroundColor: theme === 'dark' ? '#1890ff' : '#d9d9d9' }}
                        />
                        <BulbFilled style={{ color: 'white', fontSize: '12px' }} />
                    </div>
                </div>
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
