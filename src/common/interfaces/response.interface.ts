export interface ImetaPagination {
  totalPages: number;
  totalData: number;
  totalDataPerPage: number;
  page: number;
  limit: number;
}

export interface IResponseEntity<T = unknown> {
  code: number;
  status: boolean;
  message: string;
  data?: T;
  meta?: ImetaPagination;
}

export interface IResponsePageWrapper<T> {
  data: T[];
  meta: ImetaPagination;
}

export interface IServiceMessageResponse<T = unknown> {
  message?: string;
  data?: T;
  meta?: ImetaPagination;
  [key: string]: unknown;
}
