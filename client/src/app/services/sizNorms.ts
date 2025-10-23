import { api } from './api';

export interface SizNorm {
    id?: string;
    name: string;
    classification?: string;
    quantity?: number; // Норматив количества (опционально)
    period: string;
    periodType: 'months' | 'until_worn';
    createdAt?: string;
    updatedAt?: string;
}

export const sizNormsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAllSizNorms: builder.query<SizNorm[], void>({
            query: () => ({
                url: `/siz-norms`,
                method: "GET",
            }),
        }),
        getSizNorm: builder.query<SizNorm, string>({
            query: (id) => ({
                url: `/siz-norms/${id}`,
                method: "GET",
            }),
        }),
        addSizNorm: builder.mutation<SizNorm, Partial<SizNorm>>({
            query: (norm) => ({
                url: "/siz-norms/add",
                method: "POST",
                body: norm,
            }),
        }),
        updateSizNorm: builder.mutation<SizNorm, { id: string; data: Partial<SizNorm> }>({
            query: ({ id, data }) => ({
                url: `/siz-norms/edit/${id}`,
                method: "PUT",
                body: data,
            }),
        }),
        deleteSizNorm: builder.mutation<void, string>({
            query: (id) => ({
                url: `/siz-norms/remove/${id}`,
                method: "DELETE",
            }),
        }),
        initDefaultSizNorms: builder.mutation<{ message: string; count: number }, void>({
            query: () => ({
                url: "/siz-norms/init-defaults",
                method: "POST",
            }),
        }),
    }),
});

export const {
    useGetAllSizNormsQuery,
    useGetSizNormQuery,
    useAddSizNormMutation,
    useUpdateSizNormMutation,
    useDeleteSizNormMutation,
    useInitDefaultSizNormsMutation,
} = sizNormsApi;

export const {
    endpoints: {
        getAllSizNorms,
        getSizNorm,
        addSizNorm,
        updateSizNorm,
        deleteSizNorm,
        initDefaultSizNorms,
    },
} = sizNormsApi;
