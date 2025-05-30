import { Injectable, BadRequestException } from '@nestjs/common';
import { Product } from './product.entity';
import { ConfigService } from '@nestjs/config';

interface EnvironmentalMetrics {
  carbonSaved: number; // in kg CO2
  waterSaved: number;  // in liters
  energySaved: number; // in kWh
  wastePrevented: number; // in kg
}

// Lightweight type derived from Product entity for impact calculations
type ProductInput = Pick<Product, 'id' | 'title' | 'category' | 'metadata'>;

@Injectable()
export class EnvironmentalImpactService {
  private readonly IMPACT_FACTORS: Record<string, { carbonPerKg: number; waterPerKg: number; energyPerKg: number }>;
  private readonly MIN_WEIGHT = 0.01; // 10 grams
  private readonly MAX_WEIGHT = 1000; // 1000 kg

  constructor(private readonly configService: ConfigService) {
    this.IMPACT_FACTORS = this.configService.get('impact.factors') || {
      electronics: {
        carbonPerKg: 47.5,
        waterPerKg: 1500,
        energyPerKg: 85,
      },
      clothing: {
        carbonPerKg: 15.3,
        waterPerKg: 2700,
        energyPerKg: 25,
      },
      furniture: {
        carbonPerKg: 5.2,
        waterPerKg: 500,
        energyPerKg: 12,
      },
    };
  }

  private validateWeight(weight: number): void {
    if (weight < this.MIN_WEIGHT) {
      throw new BadRequestException(`Product weight must be at least ${this.MIN_WEIGHT} kg`);
    }
    if (weight > this.MAX_WEIGHT) {
      throw new BadRequestException(`Product weight cannot exceed ${this.MAX_WEIGHT} kg`);
    }
  }

  private extractWeight(metadata: Record<string, any> | null | undefined): number {
    const weight = metadata?.weight ?? 1; // Default to 1kg if missing
    if (typeof weight !== 'number' || isNaN(weight)) {
      throw new BadRequestException('Invalid weight in product metadata');
    }
    return weight;
  }

  calculateProductImpact(product: ProductInput): EnvironmentalMetrics {
    const category = product.category.toLowerCase();
    const weight = this.extractWeight(product.metadata);

    this.validateWeight(weight);

    const factors = this.IMPACT_FACTORS[category] || this.IMPACT_FACTORS.electronics;

    const carbonSaved = factors.carbonPerKg * weight * 0.8;
    const waterSaved = factors.waterPerKg * weight * 0.9;
    const energySaved = factors.energyPerKg * weight * 0.7;
    const wastePrevented = weight;

    return {
      carbonSaved,
      waterSaved,
      energySaved,
      wastePrevented,
    };
  }

  calculateTotalImpact(products: ProductInput[]): EnvironmentalMetrics {
    return products.reduce(
      (total, product) => {
        const impact = this.calculateProductImpact(product);
        return {
          carbonSaved: total.carbonSaved + impact.carbonSaved,
          waterSaved: total.waterSaved + impact.waterSaved,
          energySaved: total.energySaved + impact.energySaved,
          wastePrevented: total.wastePrevented + impact.wastePrevented,
        };
      },
      { carbonSaved: 0, waterSaved: 0, energySaved: 0, wastePrevented: 0 },
    );
  }

  formatMetricsForDisplay(metrics: EnvironmentalMetrics): Record<string, string> {
    return {
      carbonSaved: `${metrics.carbonSaved.toFixed(1)} kg CO2`,
      waterSaved: `${(metrics.waterSaved / 1000).toFixed(1)} m³`,
      energySaved: `${metrics.energySaved.toFixed(1)} kWh`,
      wastePrevented: `${metrics.wastePrevented.toFixed(1)} kg`,
    };
  }
}
