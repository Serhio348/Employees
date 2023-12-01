import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ConfigProvider, theme } from "antd";

import { store } from "./app/store";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";

import "./index.css";
import { Paths } from "./path";
import Auth from "./features/auth/Auth";

export const router = createBrowserRouter([
  {
    path: Paths.home,
    element: <h1>Employees</h1>,
  },
  {
    path: Paths.login,
    element: <Login />,
  },
  {
    path: Paths.register,
    element: <Register />,
  },
]);


export const useContest = {
  name: 'serg',
  age: 12,
  city: 'brest'
}

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={{
        algorithm: theme.darkAlgorithm
      }}>
        <Auth>
          <RouterProvider router={router} />
        </Auth>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
