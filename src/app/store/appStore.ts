import { create } from 'zustand';

interface Brand {
  id: string;
  name: string;
  productUrl: string;
  brandVibe: 'funny' | 'cool' | 'bold';
  memeStyle: 'image' | 'video' | 'mix';
}

interface Review {
  id: string;
  body: string;
  rating: number;
  author: string;
  sourceType: string;
  memeabilityScore: number;
  selected: boolean;
}

interface Meme {
  id: string;
  reviewId: string;
  imageUrl: string;
  videoUrl?: string;
  topText: string;
  bottomText: string;
  captionLinkedin: string;
  captionInstagram: string;
  captionTiktok: string;
  templateName?: string;
}

interface AppState {
  // Current brand
  currentBrand: Brand | null;
  setCurrentBrand: (brand: Brand | null) => void;

  // Reviews
  reviews: Review[];
  setReviews: (reviews: Review[]) => void;
  toggleReviewSelection: (reviewId: string) => void;

  // Generation
  isGenerating: boolean;
  generationProgress: number;
  currentPackId: string | null;
  memes: Meme[];
  setIsGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setCurrentPackId: (packId: string | null) => void;
  addMeme: (meme: Meme) => void;
  setMemes: (memes: Meme[]) => void;

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentBrand: null,
  setCurrentBrand: (brand) => set({ currentBrand: brand }),

  reviews: [],
  setReviews: (reviews) => set({ reviews }),
  toggleReviewSelection: (reviewId) =>
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === reviewId ? { ...r, selected: !r.selected } : r
      ),
    })),

  isGenerating: false,
  generationProgress: 0,
  currentPackId: null,
  memes: [],
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setCurrentPackId: (packId) => set({ currentPackId: packId }),
  addMeme: (meme) => set((state) => ({ memes: [...state.memes, meme] })),
  setMemes: (memes) => set({ memes }),

  reset: () =>
    set({
      currentBrand: null,
      reviews: [],
      isGenerating: false,
      generationProgress: 0,
      currentPackId: null,
      memes: [],
    }),
}));
