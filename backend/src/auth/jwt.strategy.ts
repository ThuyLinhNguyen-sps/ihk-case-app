import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: "dev_secret",
    });
  }

  // payload chính là những gì bạn sign ở login: { sub, role, email }
  async validate(payload: any) {
    return payload; // sẽ nằm ở req.user
  }
}
