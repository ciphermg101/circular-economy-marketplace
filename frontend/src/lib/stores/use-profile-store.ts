import { create } from 'zustand';

export interface EnvironmentalImpact {
  co2Saved: number;
  eWasteDiverted: number;
  itemsTraded: number;
  itemsRepaired: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isVerified?: boolean;
  type?: string;
  ratings?: {
    average: number;
    count: number;
  };
  location?: {
    address: string;
  };
  phone?: string;
  environmentalImpact: EnvironmentalImpact;
}

interface ProfileState {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  loading: boolean; 
  error: string | null;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (profile: Profile) => set({ profile }),
  updateProfile: async (profile: Partial<Profile>) => {
  },
  updateAvatar: async (file: File) => {
  },
  loading: false,
  error: null,
}));