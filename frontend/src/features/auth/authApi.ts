// frontend/src/features/auth/authApi.ts
import { apiRequest, authApi as baseAuthApi } from "../../api/client";
import { API_ENDPOINTS } from "../../lib/constants";
import type {
  LoginResponse,
  MeResponse,
  ActivateCheckResponse,
  ChangePasswordResponse,
} from "../../api/types";

export const authApi = {
  login: (identifier: string, password: string): Promise<LoginResponse> =>
    baseAuthApi.login(identifier, password),

  refresh: (): Promise<LoginResponse> => baseAuthApi.refresh(),

  logout: (): Promise<void> => baseAuthApi.logout(),

  me: (): Promise<MeResponse> => baseAuthApi.me(),

  activate: (data: {
    token: string;
    enrollment_no: string;
    dob: string;
    new_password: string;
    accepted_terms: boolean;
  }) => baseAuthApi.activate(data),

  checkActivationToken: (token: string): Promise<ActivateCheckResponse> =>
    baseAuthApi.checkActivationToken(token),

  changePassword: (
    current_password: string,
    new_password: string,
  ): Promise<ChangePasswordResponse> => baseAuthApi.changePassword(current_password, new_password),
};

export type {
  LoginResponse,
  MeResponse,
  ActivateCheckResponse,
  ChangePasswordResponse,
} from "../../api/types";
