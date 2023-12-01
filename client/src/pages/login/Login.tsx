import { useState } from "react";
import Layout from "../../components/layout/Layout";
import { Card, Form, Row, Space, Typography } from "antd";
import LoginInput from "../../components/loginInput/LoginInput";
import PasswordInput from "../../components/passwordInput/PasswordInput";
import CustomButton from "../../components/customButton/CustomButton";
import { Link, useNavigate } from "react-router-dom";
import { Paths } from "../../path";
import { UserData, useLoginMutation } from "../../app/services/auth";
import { isErrorWithMessage } from "../../utils/isErrorWithMessage";
import ErrorMessage from "../../components/errorMessage/ErrorMessage";




const Login = () => {
    const navigate = useNavigate();
    const [loginUser, loginUserResult] = useLoginMutation();
    const [error, setError] = useState("");

    const login = async (data: UserData) => {
        try {
            await loginUser(data).unwrap();
            navigate("/")
        } catch (err) {

            const error = isErrorWithMessage(err);
            if (error) {
                setError(err.data.message);
            } else {
                setError("Неизвестная ошибка");
            }
        }
    };

    return (
        <Layout>
            <Row align="middle" justify="center">
                <Card title="Войдите" style={{ width: "30rem" }}>
                    <Form onFinish={login}>
                        <LoginInput type="email" name="email" placeholder="Email" />
                        <PasswordInput name="password" placeholder="Пароль" />
                        <CustomButton type="primary" htmlType="submit">
                            Войти
                        </CustomButton>
                    </Form>
                    <Space direction="vertical" size="large">
                        <Typography.Text>
                            Нет аккаунта? <Link to={Paths.register}>Зарегестрируйтесь</Link>
                        </Typography.Text>
                        <ErrorMessage message={error} />
                    </Space>
                </Card>
            </Row>
        </Layout>
    );
};

export default Login;
