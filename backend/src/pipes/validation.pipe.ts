import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor(private readonly logger: LoggerService) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value,
      }));
    
      // this.logger!.warn('Validation failed', 'ValidationPipe');
      // this.logger!.debug(messages, 'ValidationPipe');
    
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }    

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
