import { create } from 'zustand'

interface CameraState {
  // Flash
  isFlashOn: boolean;
  // Camera
  showCamera: boolean;
  // Actions
  toggleFlash: () => void;
  setShowCamera: (show: boolean) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  isFlashOn: false,
  showCamera: false,

  toggleFlash: () => set((state) => ({ isFlashOn: !state.isFlashOn })),
  setShowCamera: (show: boolean) => {
    if (!show) {
      set({
        showCamera: false,
        isFlashOn: false,
      });
    } else {
      set({ showCamera: show });
    }
  },
})); 