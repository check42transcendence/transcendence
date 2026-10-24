import { BadRequestException } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';

// Preserve malformed JSON errors before Nest normalizes them.
export class ApiExpressAdapter extends ExpressAdapter {
  override mapException(error: unknown): unknown {
    if (
      error instanceof SyntaxError &&
      'status' in error &&
      error.status === 400 &&
      'type' in error &&
      error.type === 'entity.parse.failed'
    ) {
      return new BadRequestException({
        error: {
          code: 'MALFORMED_REQUEST',
          message: 'Malformed request',
          details: {},
        },
      });
    }

    return super.mapException(error);
  }
}
