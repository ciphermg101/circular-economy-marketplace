import { IsString, IsOptional, IsArray, IsEnum, IsUrl, IsNotEmpty } from 'class-validator';

export enum TutorialDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export class CreateTutorialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(TutorialDifficulty)
  difficulty: TutorialDifficulty;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  estimatedTime?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredTools?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];
}

export class UpdateTutorialDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(TutorialDifficulty)
  @IsOptional()
  difficulty?: TutorialDifficulty;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  estimatedTime?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredTools?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];
}

export class SearchTutorialsDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(TutorialDifficulty)
  @IsOptional()
  difficulty?: TutorialDifficulty;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  authorId?: string;
} 