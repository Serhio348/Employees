import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HeaderProvider } from "./contexts/HeaderContext";
import ThemeWrapper from "./components/theme/ThemeWrapper";
import { store } from "./app/store";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import "./index.css";
import { Paths } from "./path";
import Auth from "./features/auth/Auth";
import Employees from "./pages/employees/Employees";
import AddEmployee from "./pages/addEmployee/AddEmployee";
import Status from "./pages/status/Status";
import Employee from "./pages/employee/Employee";
import EditEmployee from "./pages/editEmployee/EditEmployee";
import EmployeeInventory from "./pages/employeeInventory/EmployeeInventory";
import InventoryAddons from "./pages/inventoryAddons/InventoryAddons";

// Инициализация приложения

// Отменяем регистрацию всех Service Workers (они вызывают проблемы с кэшированием)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service Worker успешно отменен');
        }
      }).catch((error) => {
        console.error('Ошибка при отмене Service Worker:', error);
      });
    }
  }).catch((error) => {
    console.error('Ошибка при получении регистраций Service Worker:', error);
  });
}

// Подавляем ошибку ResizeObserver
const resizeObserverErr = (e: ErrorEvent) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    const resizeObserverErrDiv = document.getElementById('resize-observer-error');
    if (resizeObserverErrDiv) {
      resizeObserverErrDiv.style.display = 'none';
    }
    e.stopImmediatePropagation();
  }
};
window.addEventListener('error', resizeObserverErr);

export const router = createBrowserRouter([
  {
    path: Paths.home,
    element: <Employees />,
  },
  {
    path: Paths.login,
    element: <Login />,
  },
  {
    path: Paths.register,
    element: <Register />,
  },
  {
    path: Paths.employeeAdd,
    element: <AddEmployee />,
  },
  {
    path: `${Paths.status}/:status`,
    element: <Status />,
  },
  {
    path: `${Paths.employee}/:id`,
    element: <Employee />,
  },
  {
    path: `${Paths.employeeEdit}/:id`,
    element: <EditEmployee />,
  },
  {
    path: `${Paths.employee}/:id/inventory`,
    element: <EmployeeInventory />,
  },
  {
    path: `/inventory/:inventoryId/addons`,
    element: <InventoryAddons />,
  },
]);


const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <HeaderProvider>
          <ThemeWrapper>
            <Auth>
              <RouterProvider router={router} />
            </Auth>
          </ThemeWrapper>
        </HeaderProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
