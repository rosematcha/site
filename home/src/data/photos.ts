import photography from "./photos.json";

export interface Photo {
  id: string;
  src: string;
  thumbnail: string;
  thumbnailWidth: number; // the small file's own size (480 on its long side, or 480 wide for some uprights)
  thumbnailHeight: number;
  alt: string;
  width: number;
  height: number;
}
export interface PhotoEvent {
  id: string;
  title: string;
  year: string;
  date: string;
  coverId: string;
  photos: Photo[];
}
export const events: PhotoEvent[] = photography;
export function coverPhoto(event: PhotoEvent): Photo {
  const cover = event.photos.find(photo => photo.id === event.coverId) ?? event.photos[0];
  if (!cover) {
    throw new Error(`No photographs for ${event.id}`);
  }
  return cover;
}
