/**
 * Represents a service offered by a complex (e.g., WiFi, Parking, Showers)
 */
export interface ComplexService {
  id: string;
  name: string;
  key: string;
  faIcon: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
