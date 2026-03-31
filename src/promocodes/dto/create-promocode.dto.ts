import { Transform } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreatePromocodeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discount!: number;

  @IsInt()
  @Min(1)
  limit!: number;

  @IsDateString()
  expiresAt!: string;
}
