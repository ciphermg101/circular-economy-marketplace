import { IsString, IsOptional, IsArray, IsEnum, IsUrl, IsNotEmpty } from 'class-validator';
import { Express } from 'express';
import { ApiProperty } from '@nestjs/swagger';

export enum TutorialCategory {
  REPAIR = 'repair',
  MAINTENANCE = 'maintenance',
  UPCYCLING = 'upcycling',
  RECYCLING = 'recycling',
}

export enum TutorialDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export class CreateTutorialDto {
  @ApiProperty({ description: 'Title of the tutorial' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Content of the tutorial' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: TutorialCategory, description: 'Category of the tutorial' })
  @IsEnum(TutorialCategory)
  category: TutorialCategory;

  @ApiProperty({ enum: TutorialDifficulty, description: 'Difficulty level of the tutorial' })
  @IsEnum(TutorialDifficulty)
  difficulty: TutorialDifficulty;

  @ApiProperty({ type: 'string', format: 'binary', required: false, description: 'Media file (image, video, or PDF)' })
  @IsOptional()
  media?: Express.Multer.File;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  estimatedTime?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredTools?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];
}

export class UpdateTutorialDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ enum: TutorialCategory, required: false })
  @IsEnum(TutorialCategory)
  @IsOptional()
  category?: TutorialCategory;

  @ApiProperty({ enum: TutorialDifficulty, required: false })
  @IsEnum(TutorialDifficulty)
  @IsOptional()
  difficulty?: TutorialDifficulty;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  media?: Express.Multer.File;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  estimatedTime?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredTools?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];
}

export class SearchTutorialsDto {
  @ApiProperty({ description: 'Search term for title/content', required: false })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiProperty({ enum: TutorialCategory, description: 'Filter by category', required: false })
  @IsEnum(TutorialCategory)
  @IsOptional()
  category?: TutorialCategory;

  @ApiProperty({ enum: TutorialDifficulty, description: 'Filter by difficulty', required: false })
  @IsEnum(TutorialDifficulty)
  @IsOptional()
  difficulty?: TutorialDifficulty;

  @ApiProperty({ type: [String], description: 'Tags to filter by', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Author ID to filter tutorials', required: false })
  @IsString()
  @IsOptional()
  authorId?: string;
}
