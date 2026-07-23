export interface Pasti {
  id: string;
  name: string;
  headTeacher: string;
  phone: string;
}

export interface EquipmentItem {
  id: string;
  label: string;
  status: 'ADA' | 'TIADA' | boolean;
  photoUrl?: string;
  expiryDate?: string;
  serialNo?: string;
  notes?: string;
}

export interface Submission {
  id: string;
  pastiId?: string;
  name: string;
  headTeacher: string;
  phone: string;
  emergencyDoor: boolean | string;
  exitLight: boolean | string;
  lampuKecemasan: boolean | string;
  extinguisherExpiryDate: string;
  
  // Dynamic list for each equipment type with photo uploads
  emergencyDoorsList?: EquipmentItem[];
  exitLightsList?: EquipmentItem[];
  lampuKecemasanList?: EquipmentItem[];
  fireExtinguishers?: EquipmentItem[];

  notificationReceived?: string;
  createdAt: any;
  updatedAt?: any;
}

