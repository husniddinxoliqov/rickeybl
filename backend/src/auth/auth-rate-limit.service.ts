import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface AttemptState {
  windowStart: number;
  count: number;
}

@Injectable()
export class AuthRateLimitService {
  private readonly attempts = new Map<string, AttemptState>();
  private readonly maxAttempts = 30;
  private readonly windowMs = 60 * 1000;

  consume(key: string) {
    const now = Date.now();
    const state = this.attempts.get(key);
    if (!state || now - state.windowStart > this.windowMs) {
      this.attempts.set(key, { windowStart: now, count: 1 });
      return;
    }

    state.count += 1;
    if (state.count > this.maxAttempts) {
      throw new HttpException(
        'Too many authentication attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
