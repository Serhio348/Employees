import { api } from './api';

export interface InventoryAddon {
    id?: string;
    name: string;
    issueDate: string;
    wearPeriodMonths: number;
    nextReplacementDate: string;
    inventoryId: string;
    inventory?: {
        itemName: string;
        employee?: {
            firstName: string;
            lastName: string;
            surName?: string;
            employeeNumber?: string;
        };
    };
}

export const inventoryAddonApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getInventoryAddons: builder.query<InventoryAddon[], string>({
            query: (inventoryId) => ({
                url: `/inventory-addon/inventory/${inventoryId}`,
                method: "GET",
            }),
        }),
        getInventoryAddon: builder.query<InventoryAddon, string>({
            query: (id) => ({
                url: `/inventory-addon/item/${id}`,
                method: "GET",
            }),
        }),
        getExpiringAddons: builder.query<InventoryAddon[], { days?: number }>({
            query: ({ days = 30 } = {}) => ({
                url: `/inventory-addon/expiring?days=${days}`,
                method: "GET",
            }),
        }),
        addInventoryAddon: builder.mutation<InventoryAddon, Partial<InventoryAddon>>({
            query: (addon) => ({
                url: "/inventory-addon/add",
                method: "POST",
                body: addon,
            }),
        }),
        updateInventoryAddon: builder.mutation<InventoryAddon, { id: string; data: Partial<InventoryAddon> }>({
            query: ({ id, data }) => ({
                url: `/inventory-addon/${id}`,
                method: "PUT",
                body: data,
            }),
        }),
        deleteInventoryAddon: builder.mutation<void, string>({
            query: (id) => ({
                url: `/inventory-addon/${id}`,
                method: "DELETE",
            }),
        }),
    }),
});

export const {
    useGetInventoryAddonsQuery,
    useGetInventoryAddonQuery,
    useGetExpiringAddonsQuery,
    useAddInventoryAddonMutation,
    useUpdateInventoryAddonMutation,
    useDeleteInventoryAddonMutation,
} = inventoryAddonApi;

export const {
    endpoints: {
        getInventoryAddons,
        getInventoryAddon,
        getExpiringAddons,
        addInventoryAddon,
        updateInventoryAddon,
        deleteInventoryAddon,
    },
} = inventoryAddonApi;
