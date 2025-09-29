import { useGetAllSizNormsQuery, useAddSizNormMutation, useUpdateSizNormMutation, useDeleteSizNormMutation, useInitDefaultSizNormsMutation, SizNorm } from '../app/services/sizNorms';

export type { SizNorm };

export const useSizNorms = () => {
    const { data: sizNorms = [], isLoading, error, refetch } = useGetAllSizNormsQuery();
    const [addSizNorm] = useAddSizNormMutation();
    const [updateSizNorm] = useUpdateSizNormMutation();
    const [deleteSizNorm] = useDeleteSizNormMutation();
    const [initDefaultSizNorms] = useInitDefaultSizNormsMutation();

    const addNorm = async (norm: Omit<SizNorm, 'id'>) => {
        try {
            await addSizNorm(norm).unwrap();
            refetch();
        } catch (error) {
            console.error('Error adding SIZ norm:', error);
            throw error;
        }
    };

    const updateNorm = async (id: string, norm: Partial<SizNorm>) => {
        try {
            await updateSizNorm({ id, data: norm }).unwrap();
            refetch();
        } catch (error) {
            console.error('Error updating SIZ norm:', error);
            throw error;
        }
    };

    const deleteNorm = async (id: string) => {
        try {
            await deleteSizNorm(id).unwrap();
            refetch();
        } catch (error) {
            console.error('Error deleting SIZ norm:', error);
            throw error;
        }
    };

    const initDefaults = async () => {
        try {
            await initDefaultSizNorms().unwrap();
            refetch();
        } catch (error) {
            console.error('Error initializing default SIZ norms:', error);
            throw error;
        }
    };

    return {
        sizNorms,
        isLoading,
        error,
        addNorm,
        updateNorm,
        deleteNorm,
        initDefaults,
        refetch
    };
};
