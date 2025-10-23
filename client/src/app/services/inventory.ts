import { api } from './api';

export interface InventoryItem {
    id?: string;
    itemName: string;
    itemType: string;
    issueDate?: string;
    quantity: number;
    status: string;
    employeeId: string;
    createdAt?: string;
    updatedAt?: string;
}

export const inventoryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAllInventory: builder.query<InventoryItem[], void>({
            query: () => ({
                url: `/inventory`,
                method: "GET",
            }),
            providesTags: [{ type: 'Inventory', id: 'LIST' }],
        }),
        getInventoryItem: builder.query<InventoryItem, string>({
            query: (id) => ({
                url: `/inventory/${id}`,
                method: "GET",
            }),
            providesTags: (result, error, id) => [{ type: 'Inventory', id }],
        }),
        getEmployeeInventory: builder.query<InventoryItem[], string>({
            query: (employeeId) => ({
                url: `/inventory/employee/${employeeId}`,
                method: "GET",
            }),
            providesTags: (result, error, employeeId) => [
                { type: 'Inventory', id: 'LIST' },
                { type: 'Inventory', id: `EMPLOYEE-${employeeId}` }
            ],
        }),
        addInventoryItem: builder.mutation<InventoryItem, Partial<InventoryItem>>({
            query: (item) => ({
                url: "/inventory/add",
                method: "POST",
                body: item,
            }),
            invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
        }),
        updateInventoryItem: builder.mutation<InventoryItem, { id: string; data: Partial<InventoryItem> }>({
            query: ({ id, data }) => ({
                url: `/inventory/edit/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Inventory', id },
                { type: 'Inventory', id: 'LIST' }
            ],
        }),
        deleteInventoryItem: builder.mutation<void, string>({
            query: (id) => ({
                url: `/inventory/remove/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Inventory', id },
                { type: 'Inventory', id: 'LIST' }
            ],
        }),
    }),
});

export const {
    useGetAllInventoryQuery,
    useGetInventoryItemQuery,
    useGetEmployeeInventoryQuery,
    useAddInventoryItemMutation,
    useUpdateInventoryItemMutation,
    useDeleteInventoryItemMutation,
} = inventoryApi;

export const {
    endpoints: {
        getAllInventory,
        getInventoryItem,
        getEmployeeInventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
    },
} = inventoryApi;