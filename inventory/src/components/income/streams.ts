import { BedDouble, Bath, Bus, Car, Baby, Gamepad2, HandCoins, Landmark, TrainFront, Waves, type LucideIcon } from 'lucide-react';
import type { IncomeStream } from '@/lib/api/income';

/** Card look and wording for each income stream */
export const STREAM_CARD: Record<IncomeStream, { icon: LucideIcon; color: string; bg: string; qtyLabel: string | null; unit: string }> = {
  pool: { icon: Waves, color: '#0B7285', bg: '#E3FAFC', qtyLabel: 'People', unit: 'person' },
  pool_kids: { icon: Baby, color: '#1098AD', bg: '#E3FAFC', qtyLabel: 'Kids', unit: 'child' },
  train: { icon: TrainFront, color: '#C92A2A', bg: '#FFF5F5', qtyLabel: 'People', unit: 'person' },
  washroom: { icon: Bath, color: '#5F3DC4', bg: '#F3F0FF', qtyLabel: 'People', unit: 'person' },
  playground: { icon: Gamepad2, color: '#E8590C', bg: '#FFF4E6', qtyLabel: 'People', unit: 'person' },
  parking: { icon: Car, color: '#1F3A5F', bg: '#EDF2F7', qtyLabel: null, unit: 'vehicle' },
  bus_hire: { icon: Bus, color: '#2B8A3E', bg: '#EBFBEE', qtyLabel: 'Days', unit: 'day' },
  hall_hire: { icon: Landmark, color: '#862E9C', bg: '#F8F0FC', qtyLabel: 'Sessions', unit: 'session' },
  accommodation: { icon: BedDouble, color: '#A61E4D', bg: '#FFF0F6', qtyLabel: null, unit: '' },
  other: { icon: HandCoins, color: '#495057', bg: '#F1F3F5', qtyLabel: null, unit: '' },
};
