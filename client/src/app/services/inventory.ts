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
        }),
        getInventoryItem: builder.query<InventoryItem, string>({
            query: (id) => ({
                url: `/inventory/${id}`,
                method: "GET",
            }),
        }),
        getEmployeeInventory: builder.query<InventoryItem[], string>({
            query: (employeeId) => ({
                url: `/inventory/employee/${employeeId}`,
                method: "GET",
            }),
        }),
        addInventoryItem: builder.mutation<InventoryItem, Partial<InventoryItem>>({
            query: (item) => ({
                url: "/inventory/add",
                method: "POST",
                body: item,
            }),
        }),
        updateInventoryItem: builder.mutation<InventoryItem, { id: string; data: Partial<InventoryItem> }>({
            query: ({ id, data }) => ({
                url: `/inventory/edit/${id}`,
                method: "PUT",
                body: data,
            }),
        }),
        deleteInventoryItem: builder.mutation<void, string>({
            query: (id) => ({
                url: `/inventory/remove/${id}`,
                method: "DELETE",
            }),
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