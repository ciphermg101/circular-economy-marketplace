import { Injectable, ConflictException } from '@nestjs/common';
import { UsersRepository } from '@users/users.repository';
import { CreateProfileDto, UpdateProfileDto, VerifyProfileDto } from '@users/dto/user.dto';
import { BaseException } from '@common/exceptions/base-exception.filter';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(userId: string, dto: CreateProfileDto) {
    try {
      const { data: existingUser } = await this.usersRepository.findByUsername(dto.username);
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
      return await this.usersRepository.createUser(userId, dto);
    } catch (error) {
      throw new BaseException(error);
    }
  }

  async getUser(userId: string) {
    try {
      return await this.usersRepository.getUser(userId);
    } catch (error) {
      throw new BaseException(error);
    }
  }

  async updateUser(userId: string, dto: UpdateProfileDto) {
    try {
      return await this.usersRepository.updateUser(userId, dto);
    } catch (error) {
      throw new BaseException(error);
    }
  }

  async verifyUser(userId: string, dto: VerifyProfileDto) {
    try {
      return await this.usersRepository.verifyUser(userId, dto);
    } catch (error) {
      throw new BaseException(error);
    }
  }

  async searchUsers(query: string) {
    try {
      return await this.usersRepository.searchUsers(query);
    } catch (error) {
      throw new BaseException(error);
    }
  }

  async getUsersByType(type: string) {
    try {
      return await this.usersRepository.getUsersByType(type);
    } catch (error) {
      throw new BaseException(error);
    }
  }
}