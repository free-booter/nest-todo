export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

export const SUCCESS_CODE = 200;
export const SUCCESS_MESSAGE = '操作成功';
