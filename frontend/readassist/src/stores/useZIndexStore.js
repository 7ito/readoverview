import { create } from 'zustand';

export const useZIndexStore = create((set, get) => ({
    baseZIndex: 1000,

    getNextZIndex: () => {
        const nextZ = get().baseZIndex + 1;
        set({ baseZIndex: nextZ });
        return nextZ;
    },
}));