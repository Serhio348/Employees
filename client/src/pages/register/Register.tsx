import React, { useState } from "react";
import Layout from "../../components/layout/Layout";
import { Card, Form, Row, Space, Typography } from "antd";
import CustomInput from "../../components/customInput/CustomInput";
import PasswordInput from "../../components/passwordInput/PasswordInput";
import CustomButton from "../../components/customButton/CustomButton";
import { Link, useNavigate } from "react-router-dom";
import { Paths } from "../../path";
import { useRegisterMutation } from "../../app/services/auth";
import { User } from "@prisma/client";
import { isErrorWithMessage } from "../../utils/isErrorWithMessage";
import ErrorMessage from "../../components/errorMessage/ErrorMessage";
// import { useDispatch } from "react-redux";
// import { clearAuth } from "../../features/auth/authSlice";
// import { api } from "../../app/services/api";

type RegisterData = Omit<User, "id"> & { confirmPassword: string }; //удалим из user id  и добавим confirm password

const Register = () => {
    const navigate = useNavigate();
    // const dispatch = useDispatch();
    const [error, setError] = useState("");
    const [registerUser] = useRegisterMutation()
    
    const register = async (data: RegisterData) => {
        try {
            await registerUser(data).unwrap();
            navigate("/");
        } catch (err) {
            const error = isErrorWithMessage(err);
            if (error) {
                setError(err.data.message);
            } else {
                setError("Неизвестная ошибка");
            }
        }
    }


    return (
        <Layout>
            <Row align="middle" justify="center">
                <Card title="Регистрация" style={{ width: "30rem" }}>
                    <Form onFinish={register}>
                        <CustomInput name="name" placeholder="Имя" />
                        <CustomInput name="lastName" placeholder="Фамилия" />
                        <CustomInput type="email" name="email" placeholder="Email" />
                        <PasswordInput name="password" placeholder="Пароль" />
                        <PasswordInput name="confirmPassword" placeholder="Повторите пароль" />
                        <CustomButton type="primary" htmlType="submit">
                            Зарегистрироваться
                        </CustomButton>
                    </Form>
                    <Space direction="vertical" size="large">
                        <Typography.Text>
                            Уже зарегистрированы? <Link to={Paths.login}>Войдите</Link>
                        </Typography.Text>
                        <ErrorMessage message={error} />
                    </Space>
                </Card>
            </Row>
        </Layout>
    );
};

export default Register;
