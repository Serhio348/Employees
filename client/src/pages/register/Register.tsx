import React from "react";
import Layout from "../../components/layout/Layout";
import { Card, Form, Row, Space, Typography } from "antd";
import LoginInput from "../../components/loginInput/LoginInput";
import PasswordInput from "../../components/passwordInput/PasswordInput";
import CustomButton from "../../components/customButton/CustomButton";
import { Link } from "react-router-dom";
import { Paths } from "../../path";

const Register = () => {
    return (
        <Layout>
            <Row align="middle" justify="center">
                <Card title="Регистрация" style={{ width: "30rem" }}>
                    <Form>
                        <LoginInput name="name" placeholder="Имя" />
                        <LoginInput type="email" name="email" placeholder="Email" />
                        <PasswordInput name="password" placeholder="Пароль" />
                        <PasswordInput name="confirmPassword" placeholder="Повторите пароль" />
                        <CustomButton type="primary" htmlType="submit">
                            Зарегистрироваться
                        </CustomButton>
                    </Form>
                    <Space direction="vertical" size="large">
                        <Typography.Text>
                            Уже зарегестрированы? <Link to={Paths.login}>Войдите</Link>
                        </Typography.Text>
                    </Space>
                </Card>
            </Row>
        </Layout>
    );
};

export default Register;
