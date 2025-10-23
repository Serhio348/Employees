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
            providesTags: [{ type: 'Employee', id: 'LIST' }],
        }),
        getEmployee: builder.query<Employee, string>({
            query: (id) => ({
                url: `/employees/${id}`,
                method: "GET",
            }),
            providesTags: (result, error, id) => [{ type: 'Employee', id }],
        }),
        editEmployee: builder.mutation<Employee, Employee>({
            query: (employee) => ({
                url: `/employees/edit/${employee.id}`,
                method: "PUT",
                body: employee,
            }),
            invalidatesTags: (result, error, employee) => [
                { type: 'Employee', id: employee.id },
                { type: 'Employee', id: 'LIST' }
            ],
        }),
        removeEmployee: builder.mutation<void, string>({
            query: (id) => ({
                url: `/employees/remove/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Employee', id },
                { type: 'Employee', id: 'LIST' }
            ],
        }),
        addEmployee: builder.mutation<Employee, Employee>({
            query: (employee) => ({
                url: "/employees/add",
                method: "POST",
                body: employee,
            }),
            invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
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