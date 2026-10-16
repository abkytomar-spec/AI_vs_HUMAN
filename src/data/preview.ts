import type { Origin } from '../types/constants';
import type { ImageSource } from '../types/dataset';

/**
 * The sample round on the home page. These three images are not in the game
 * pool, so showing them (and their answer on the credits page) reveals nothing.
 */
export interface PreviewImage {
  file: string;
  alt: string;
  origin: Origin;
  source: Pick<ImageSource, 'title' | 'pageUrl' | 'author' | 'license' | 'licenseUrl'>;
}

export const PREVIEW_IMAGES: PreviewImage[] = [
  {
    file: 'f4ac689f151bdfff-800.jpg',
    alt: "The Milky Way above a tree at dusk",
    origin: 'human',
    source: { title: "File:Clear Night (227774827).jpeg", pageUrl: "https://commons.wikimedia.org/wiki/File%3AClear_Night_(227774827).jpeg", author: "Alexandre Patrier", license: "CC BY 3.0", licenseUrl: 'https://creativecommons.org/licenses/by/3.0' },
  },
  {
    file: 'f13498343d2db7a5-800.jpg',
    alt: "The Milky Way above a parked car in the desert",
    origin: 'ai',
    source: { title: "File:Gemini Generated Image yp81eoyp81eoyp81.png", pageUrl: "https://commons.wikimedia.org/wiki/File%3AGemini_Generated_Image_yp81eoyp81eoyp81.png", author: "Zhaotian201512", license: "CC BY-SA 4.0", licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0' },
  },
  {
    file: 'a6fb3c25497b1e76-800.jpg',
    alt: "The Milky Way above red shrubs",
    origin: 'human',
    source: { title: "File:A deeper view into the Summer (9065419958).jpg", pageUrl: "https://commons.wikimedia.org/wiki/File%3AA_deeper_view_into_the_Summer_(9065419958).jpg", author: "jason jenkins from stockton, california", license: "CC BY-SA 2.0", licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0' },
  },
];
