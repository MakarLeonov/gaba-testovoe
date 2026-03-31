import { Transform } from "class-transformer";
import { IsDateString, IsInt, IsString, Max, Min, MinLength } from "class-validator";

export class CreatePromocodeDto {
  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
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
