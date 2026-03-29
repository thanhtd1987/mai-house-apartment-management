export interface SmartLock {
  id: string;
  roomId: string;              // Reference to Room
  password: string;            // Current password
  passwordExpiryDate: string;  // Password expiration date (ISO string)

  // Battery tracking
  batteryReplacementDate: string;      // Last battery replacement date (ISO string)
  nextBatteryReplacementDate: string;  // Next replacement date (ISO string, +45 days)

  // Metadata
  createdAt: string;
  updatedAt: string;
}
