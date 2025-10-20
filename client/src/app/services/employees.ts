import { Employee } from "@prisma/client";
import { api } from "./api";

export const employeesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // userKey используется только для разделения кэша между пользователями
        getAllEmployees: builder.query<Employee[], string | void>({
            query: () => ({
                url: "/employees",
                method: "GET",
            }),
        }),
        getEmployee: builder.query<Employee, string>({
            query: (id) => ({
                url: `/employees/${id}`,
                method: "GET",
            }),
        }),
        editEmployee: builder.mutation<Employee, Employee>({
            query: (employee) => ({
                url: `/employees/edit/${employee.id}`,
                method: "PUT",
                body: employee,
            }),
        }),
        removeEmployee: builder.mutation<void, string>({
            query: (id) => ({
                url: `/employees/remove/${id}`,
                method: "DELETE",
            }),
        }),
        addEmployee: builder.mutation<Employee, Employee>({
            query: (employee) => ({
                url: "/employees/add",
                method: "POST",
                body: employee,
            }),
        }),
    }),
});

export const {
    useGetAllEmployeesQuery,
    useGetEmployeeQuery,
    useEditEmployeeMutation,
    useRemoveEmployeeMutation,
    useAddEmployeeMutation,
} = employeesApi;

export const {
    endpoints: {
        getAllEmployees,
        getEmployee,
        editEmployee,
        removeEmployee,
        addEmployee,
    },
} = employeesApi;