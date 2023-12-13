import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  // Password must be at least 8 characters long
  // Password must include at least 1 upper case letter
  // Password must include at least 1 lower case letter
  // Password must include at least 1 number
  // Password must include at least 1 special character
  // Password must not contain any spaces
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/,
    {
      message:
        'Password must be at least 8 characters long, include at least 1 upper case letter, 1 lower case letter, 1 number, 1 special character, and must not contain any spaces.',
    },
  )
  password: string;
}
