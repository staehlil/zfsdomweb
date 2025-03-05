import { ExpressAdapter } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common_1 = require("@nestjs/common");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const stream_1 = require("stream");

export class CustomExpressAdapter extends ExpressAdapter {
  constructor(instance) {
    super(instance);
  }
  reply(response, body, statusCode) {
    if (statusCode) {
      response.status(statusCode);
    }
    if ((0, shared_utils_1.isNil)(body)) {
      return response.send();
    }
    if (body instanceof common_1.StreamableFile) {
      const streamHeaders = body.getHeaders();
      if (response.getHeader('Content-Type') === undefined &&
          streamHeaders.type !== undefined) {
        response.setHeader('Content-Type', streamHeaders.type);
      }
      if (response.getHeader('Content-Disposition') === undefined &&
          streamHeaders.disposition !== undefined) {
        response.setHeader('Content-Disposition', streamHeaders.disposition);
      }
      if (response.getHeader('Content-Length') === undefined &&
          streamHeaders.length !== undefined) {
        response.setHeader('Content-Length', streamHeaders.length);
      }
      return (0, stream_1.pipeline)(body.getStream().once('error', (err) => {
        body.errorHandler(err, response);
      }), response, (err) => {
        if (err) {
          body.errorHandler(err,response);
        }
      });
    }
    const responseContentType = response.getHeader('Content-Type');
    if (typeof responseContentType === 'string' &&
        !responseContentType.startsWith('application/json') &&
        body?.statusCode >= common_1.HttpStatus.BAD_REQUEST) {
      this.logger.warn("Content-Type doesn't match Reply body, you might need a custom ExceptionFilter for non-JSON responses");
      response.setHeader('Content-Type', 'application/json');
    }
    return (0, shared_utils_1.isObject)(body) ? response.json(body) : response.send(String(body));
  }
}