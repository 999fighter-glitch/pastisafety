export interface Pasti {
  id: string;
  name: string;
  headTeacher: string;
  phone: string;
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
  fireExtinguishers?: { id: string; label: string; expiryDate: string }[];
  notificationReceived?: string;
  createdAt: any;
  updatedAt?: any;
}
