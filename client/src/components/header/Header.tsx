import { useState, useEffect, useCallback } from "react";
import { Layout, Avatar, Button, Modal, Form, Input, Switch, message } from "antd";
import { LoginOutlined, TeamOutlined, UserOutlined, EditOutlined, BulbOutlined, BulbFilled, DownloadOutlined } from "@ant-design/icons";

import styles from "./Header.module.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Paths } from "../../path";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../../features/auth/authSlice";
import { useTheme } from "../../contexts/ThemeContext";
import {
    canShowNativeInstallPrompt,
    installUnavailableMessage,
    isInStandaloneMode,
    isIOS,
    requestPwaInstall,
} from "../../utils/pwaInstall";

const Header = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [canNativeInstall, setCanNativeInstall] = useState(canShowNativeInstallPrompt);
    const [isInstalled, setIsInstalled] = useState(isInStandaloneMode);

    const syncInstallPrompt = useCallback(() => {
        setCanNativeInstall(canShowNativeInstallPrompt());
    }, []);

    useEffect(() => {
        if (isInstalled) return;

        syncInstallPrompt();

        const onReady = () => syncInstallPrompt();
        const onInstalled = () => {
            setIsInstalled(true);
            setCanNativeInstall(false);
        };

        window.addEventListener('pwa-prompt-ready', onReady);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('pwa-prompt-ready', onReady);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, [isInstalled, syncInstallPrompt]);

    const handleInstallClick = async () => {
        const result = await requestPwaInstall();

        if (result.status === 'accepted') {
            setIsInstalled(true);
            setCanNativeInstall(false);
            return;
        }

        if (result.status === 'ios_manual') {
            message.info('Safari: нажмите «Поделиться» → «На экран «Домой»»', 6);
            return;
        }

        if (result.status === 'dismissed') {
            return;
        }

        if (result.status === 'unavailable') {
            message.info(installUnavailableMessage(result.reason), 8);
        }
    };

    const showInstallButton = !isInstalled && (canNativeInstall || isIOS());

    const isAuthPage = location.pathname === Paths.login || location.pathname === Paths.register;

    const onLogoutClick = () => {
        dispatch(logout());
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleEditProfile = () => {
        if (user) {
            form.setFieldsValue({ name: user.name, lastName: user.lastName, email: user.email });
            setIsEditModalVisible(true);
        }
    };

    const handleEditSubmit = async (values: any) => {
        try {
            console.log('Updating profile:', values);
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

            <Link to={Paths.home} className={isAuthPage ? styles.authBrand : styles.brand}>
                <TeamOutlined className={isAuthPage ? styles.authBrandIcon : styles.brandIcon} />
                <span className={isAuthPage ? styles.authBrandTitle : styles.brandTitle}>
                    Участок ТЭО
                </span>
            </Link>

            {!isAuthPage && (
                <div className={styles.controls}>

                    {/* Кнопка установки — скрыта если уже установлено */}
                    {showInstallButton && (
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className={styles.installBtn}
                            title={
                                canNativeInstall
                                    ? 'Установить приложение'
                                    : 'Установить через меню Safari'
                            }
                        >
                            <DownloadOutlined />
                            <span className={styles.installLabel}>Установить</span>
                        </button>
                    )}

                    {/* Переключатель темы */}
                    <div className={styles.themeToggle}>
                        <BulbOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }} />
                        <Switch
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                            size="small"
                            style={{ backgroundColor: theme === 'dark' ? '#3b82f6' : 'rgba(255,255,255,0.3)' }}
                        />
                        <BulbFilled style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }} />
                    </div>

                    {user ? (
                        <>
                            <div className={styles.divider} />
                            <div className={styles.userProfile} onClick={handleEditProfile}>
                                <Avatar icon={<UserOutlined />} size="small" />
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{user.name} {user.lastName}</span>
                                    <EditOutlined style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px' }} />
                                </div>
                            </div>
                            <Button
                                type="default"
                                icon={<LoginOutlined />}
                                onClick={onLogoutClick}
                                size="small"
                                className={styles.logoutButton}
                            >
                                Выйти
                            </Button>
                        </>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link to={Paths.register}>
                                <Button type="default" icon={<UserOutlined />} size="small">Регистрация</Button>
                            </Link>
                            <Link to={Paths.login}>
                                <Button type="default" icon={<LoginOutlined />} size="small">Войти</Button>
                            </Link>
                        </div>
                    )}
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
                <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
                    <Form.Item name="name" label="Имя" rules={[{ required: true, message: 'Введите имя' }]}>
                        <Input placeholder="Введите имя" />
                    </Form.Item>
                    <Form.Item name="lastName" label="Фамилия" rules={[{ required: true, message: 'Введите фамилию' }]}>
                        <Input placeholder="Введите фамилию" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Введите корректный email' }]}>
                        <Input placeholder="Введите email" />
                    </Form.Item>
                </Form>
            </Modal>

        </Layout.Header>
    );
};

export default Header;
