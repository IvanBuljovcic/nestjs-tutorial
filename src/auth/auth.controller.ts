import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

// Controller
//
// takes a request from the UI
// calls a function from the service
// returns a response to the UI

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Post('signup')
  // signup(@Req() req: Request) { // Bad practice for futureproofing; If the framework changes, this will break

  // DTO = Data Transfer Object
  @Post('signup') // /auth/signup
  signup(
    // @Body('email') email: string,
    // @Body('password', ParseIntPipe) password: string,
    @Body() dto: AuthDto,
  ) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin') // /auth/signin
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }
}
