import { registerAs } from '@nestjs/config';

export interface ImpactFactor {
  carbonPerKg: number;
  waterPerKg: number;
  wastePerKg: number;
  energyPerKg: number;
}

export interface ImpactConfig {
  categories: {
    [key: string]: ImpactFactor;
  };
  defaultFactors: ImpactFactor;
  minimumWeight: number;
  maximumWeight: number;
  cacheDuration: number;
}

export default registerAs('impact', (): ImpactConfig => ({
  categories: {
    electronics: {
      carbonPerKg: 47.5,  // CO2 equivalent in kg
      waterPerKg: 1500,   // Water usage in liters
      wastePerKg: 1,      // Waste reduction in kg
      energyPerKg: 150,   // Energy savings in kWh
    },
    clothing: {
      carbonPerKg: 15.3,
      waterPerKg: 2700,
      wastePerKg: 1,
      energyPerKg: 25,
    },
    furniture: {
      carbonPerKg: 5.2,
      waterPerKg: 500,
      wastePerKg: 1,
      energyPerKg: 10,
    },
    books: {
      carbonPerKg: 2.1,
      waterPerKg: 300,
      wastePerKg: 1,
      energyPerKg: 8,
    },
    toys: {
      carbonPerKg: 3.9,
      waterPerKg: 400,
      wastePerKg: 1,
      energyPerKg: 12,
    },
    sports: {
      carbonPerKg: 4.5,
      waterPerKg: 600,
      wastePerKg: 1,
      energyPerKg: 15,
    },
  },
  defaultFactors: {
    carbonPerKg: 10,
    waterPerKg: 1000,
    wastePerKg: 1,
    energyPerKg: 20,
  },
  minimumWeight: 0.01,    // 10 grams minimum
  maximumWeight: 1000,    // 1000 kg maximum
  cacheDuration: 3600,    // Cache duration in seconds (1 hour)
})); 