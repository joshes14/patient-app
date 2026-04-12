import { v4 as uuidv4 } from "uuid";

export const generatePatientId = (): string => {
  const short = uuidv4().split("-")[0].toUpperCase();
  const year = new Date().getFullYear();
  return `PT-${year}-${short}`;
};
