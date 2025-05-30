import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../cache/redis.service';
import { Logger } from '@nestjs/common';

interface ImpactConfig {
  factors: {
    electronics: { carbonPerKg: number; waterPerKg: number; energyPerKg: number; };
    clothing: { carbonPerKg: number; waterPerKg: number; energyPerKg: number; };
    furniture: { carbonPerKg: number; waterPerKg: number; energyPerKg: number; };
  };
  minimumWeight: number;
  maximumWeight: number;
  cacheDuration: number;
}

type ProductCategory = 'electronics' | 'clothing' | 'furniture';

export interface ImpactMetrics {
  carbonSaved: number; // in kg CO2
  waterSaved: number; // in liters
  wasteSaved: number; // in kg
  energySaved: number; // in kWh
}

@Injectable()
export class EnvironmentalImpactService implements OnModuleInit {
  private readonly logger = new Logger(EnvironmentalImpactService.name);
  private config!: ImpactConfig;
  private readonly defaultConfig: ImpactConfig = {
    factors: {
      electronics: { carbonPerKg: 10, waterPerKg: 1000, energyPerKg: 50 },
      clothing: { carbonPerKg: 5, waterPerKg: 500, energyPerKg: 25 },
      furniture: { carbonPerKg: 3, waterPerKg: 300, energyPerKg: 15 }
    },
    minimumWeight: 0.1,
    maximumWeight: 100,
    cacheDuration: 3600
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    const config = this.configService.get<ImpactConfig>('impact');
    this.config = config || this.defaultConfig;
  }

  async calculateProductImpact(productId: string): Promise<ImpactMetrics> {
    try {
      // Try to get from cache first
      const cached = await this.getCachedImpact(productId);
      if (cached) {
        return cached;
      }

      const { data: product } = await this.supabaseService.getClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      // Validate weight
      if (!this.validateWeight(product.weight)) {
        throw new BadRequestException(
          `Product weight must be between ${this.config.minimumWeight} and ${this.config.maximumWeight} kg`
        );
      }

      const factors = this.getImpactFactors(product.category);
      const impact = this.calculateImpact(product.category, product.weight);

      // Cache the result
      await this.cacheImpact(productId, impact);

      return impact;
    } catch (error) {
      this.logger.error(`Error calculating product impact: ${error.message}`, error.stack);
      throw error;
    }
  }

  async calculateUserImpact(userId: string): Promise<ImpactMetrics> {
    try {
      // Try to get from cache first
      const cached = await this.getCachedUserImpact(userId);
      if (cached) {
        return cached;
      }

      const { data: transactions } = await this.supabaseService.getClient
        .from('transactions')
        .select('product_id')
        .eq('seller_id', userId)
        .eq('status', 'completed');

      if (!transactions?.length) {
        return this.getZeroImpact();
      }

      const impacts = await Promise.all(
        transactions.map(t => this.calculateProductImpact(t.product_id))
      );

      const totalImpact = impacts.reduce(
        (total, impact) => ({
          carbonSaved: total.carbonSaved + impact.carbonSaved,
          waterSaved: total.waterSaved + impact.waterSaved,
          wasteSaved: total.wasteSaved + impact.wasteSaved,
          energySaved: total.energySaved + impact.energySaved,
        }),
        this.getZeroImpact()
      );

      // Cache the result
      await this.cacheUserImpact(userId, totalImpact);

      return totalImpact;
    } catch (error) {
      this.logger.error(`Error calculating user impact: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateProductImpact(productId: string): Promise<void> {
    try {
      const impact = await this.calculateProductImpact(productId);
      
      await this.supabaseService.getClient
        .from('product_impacts')
        .upsert({
          product_id: productId,
          carbon_saved: impact.carbonSaved,
          water_saved: impact.waterSaved,
          waste_saved: impact.wasteSaved,
          energy_saved: impact.energySaved,
          updated_at: new Date().toISOString(),
        });

      // Invalidate cache
      await this.invalidateProductCache(productId);
    } catch (error) {
      this.logger.error(`Error updating product impact: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getMarketplaceImpact(): Promise<ImpactMetrics> {
    try {
      // Try to get from cache first
      const cached = await this.getCachedMarketplaceImpact();
      if (cached) {
        return cached;
      }

      const { data: impacts } = await this.supabaseService.getClient
        .from('product_impacts')
        .select('carbon_saved, water_saved, waste_saved, energy_saved');

      if (!impacts?.length) {
        return this.getZeroImpact();
      }

      const totalImpact = impacts.reduce(
        (total, impact) => ({
          carbonSaved: total.carbonSaved + impact.carbon_saved,
          waterSaved: total.waterSaved + impact.water_saved,
          wasteSaved: total.wasteSaved + impact.waste_saved,
          energySaved: total.energySaved + impact.energy_saved,
        }),
        this.getZeroImpact()
      );

      // Cache the result
      await this.cacheMarketplaceImpact(totalImpact);

      return totalImpact;
    } catch (error) {
      this.logger.error(`Error calculating marketplace impact: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getImpactFactors(category: string): ImpactMetrics {
    const factors = this.config.factors[category as ProductCategory] || this.config.factors.electronics;
    return {
      carbonSaved: factors.carbonPerKg,
      waterSaved: factors.waterPerKg,
      wasteSaved: 0,
      energySaved: factors.energyPerKg,
    };
  }

  private calculateImpact(category: ProductCategory, weight: number): ImpactMetrics {
    if (!this.validateWeight(weight)) {
      throw new Error(
        `Product weight must be between ${this.config.minimumWeight} and ${this.config.maximumWeight} kg`
      );
    }

    const factors = this.config.factors[category] || this.config.factors.electronics;
    
    return {
      carbonSaved: factors.carbonPerKg * weight,
      waterSaved: factors.waterPerKg * weight,
      wasteSaved: 0,
      energySaved: factors.energyPerKg * weight,
    };
  }

  private validateWeight(weight: number): boolean {
    return weight >= this.config.minimumWeight && weight <= this.config.maximumWeight;
  }

  private getZeroImpact(): ImpactMetrics {
    return {
      carbonSaved: 0,
      waterSaved: 0,
      wasteSaved: 0,
      energySaved: 0,
    };
  }

  // Cache methods
  private async getCachedImpact(productId: string): Promise<ImpactMetrics | null> {
    const cached = await this.redisService.get(`impact:product:${productId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheImpact(productId: string, impact: ImpactMetrics): Promise<void> {
    await this.redisService.setWithExpiry(
      `impact:product:${productId}`,
      JSON.stringify(impact),
      this.config.cacheDuration
    );
  }

  private async getCachedUserImpact(userId: string): Promise<ImpactMetrics | null> {
    const cached = await this.redisService.get(`impact:user:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheUserImpact(userId: string, impact: ImpactMetrics): Promise<void> {
    await this.redisService.setWithExpiry(
      `impact:user:${userId}`,
      JSON.stringify(impact),
      this.config.cacheDuration
    );
  }

  private async getCachedMarketplaceImpact(): Promise<ImpactMetrics | null> {
    const cached = await this.redisService.get('impact:marketplace');
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheMarketplaceImpact(impact: ImpactMetrics): Promise<void> {
    await this.redisService.setWithExpiry(
      'impact:marketplace',
      JSON.stringify(impact),
      this.config.cacheDuration
    );
  }

  private async invalidateProductCache(productId: string): Promise<void> {
    await this.redisService.del(`impact:product:${productId}`);
  }
} 