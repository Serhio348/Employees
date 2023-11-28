import React from "react";
import { Layout, Space, Typography } from "antd";
import { LoginOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

import styles from "./Header.module.css";
import CustomButton from "../customButton/CustomButton";
import { Link } from "react-router-dom";
import { Paths } from "../../path";

const Header = () => {
    return (
        <Layout.Header className={styles.header}>
            <Space>
                <TeamOutlined className={styles.teamIcon} />
                <Link to={Paths.home}>
                    <CustomButton type="ghost">
                        <Typography.Title level={1}>Участок ТЭО</Typography.Title>
                    </CustomButton>
                </Link>
            </Space>
            <Space>
                <Link to={Paths.register}>
                    <CustomButton type="ghost" icon={<UserOutlined />}>Зарегистрироваться</CustomButton>
                </Link>
                <Link to={Paths.login}>
                    <CustomButton type="ghost" icon={<LoginOutlined />}>Войти</CustomButton>
                </Link>
            </Space>
        </Layout.Header>
    );
};

export default Header;
