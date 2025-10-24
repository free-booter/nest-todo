export enum ErrorCode {
  SUCCESS = 200,
  PARAMS_ERROR = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,

  INTERNAL_ERROR = 500,
  METHOD_NOT_ALLOWED = 405,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  PAYLOAD_TOO_LARGE = 413,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export const ErrorMessages = {
  [ErrorCode.SUCCESS]: '请求成功',
  [ErrorCode.PARAMS_ERROR]: '参数错误',
  [ErrorCode.UNAUTHORIZED]: '未授权',
  [ErrorCode.FORBIDDEN]: '无权限访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.METHOD_NOT_ALLOWED]: '请求方法不被允许',
  [ErrorCode.REQUEST_TIMEOUT]: '请求超时',
  [ErrorCode.CONFLICT]: '资源冲突',
  [ErrorCode.PAYLOAD_TOO_LARGE]: '请求体过大',
  [ErrorCode.UNSUPPORTED_MEDIA_TYPE]: '不支持的媒体类型',
  [ErrorCode.UNPROCESSABLE_ENTITY]: '请求语义错误/无法处理的实体',
  [ErrorCode.TOO_MANY_REQUESTS]: '请求过于频繁',
  [ErrorCode.BAD_GATEWAY]: '网关错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务不可用',
  [ErrorCode.GATEWAY_TIMEOUT]: '网关超时',
} as const;

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] ?? ErrorMessages[ErrorCode.INTERNAL_ERROR];
}
