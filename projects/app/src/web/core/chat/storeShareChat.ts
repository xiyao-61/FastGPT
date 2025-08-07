import { create, devtools, persist, immer } from '@fastgpt/web/common/zustand';

type State = {
  localUId?: string;
  setLocalUId: (localUId: string) => void;
  loaded: boolean;
  removeShareChatStore: () => void;
};

export const useShareChatStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        localUId: undefined,
        setLocalUId(localUId: string) {
          set({ localUId });
        },
        loaded: false,
        removeShareChatStore() {
          set({
            localUId: undefined,
            loaded: false
          });

          if (typeof window !== 'undefined') {
            localStorage.removeItem('shareChatStore');
          }
        }
      })),
      {
        name: 'shareChatStore',
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.loaded = true;
          }
        },
        partialize: (state) => ({
          localUId: state.localUId
        })
      }
    )
  )
);
