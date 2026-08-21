import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userService = {
    createUser: jest.fn(),
    findByUsername: jest.fn(),
    validatePassword: jest.fn(),
    updatePassword: jest.fn(),
  };
  const jwtService = { sign: jest.fn(() => 'jwt-token') };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(userService as any, jwtService as any);
  });

  it('registers a user and returns a JWT without exposing the password hash', async () => {
    userService.createUser.mockResolvedValue({ id: 1, username: 'alice', email: 'alice@example.com', passwordHash: 'hash' });

    await expect(service.register({ username: 'alice', email: 'alice@example.com', password: 'secret123' })).resolves.toEqual({
      user: { id: 1, username: 'alice', email: 'alice@example.com' },
      accessToken: 'jwt-token',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, username: 'alice' });
  });

  it('rejects an unknown user or invalid password', async () => {
    userService.findByUsername.mockResolvedValue(null);
    await expect(service.login({ username: 'missing', password: 'secret123' })).rejects.toBeInstanceOf(UnauthorizedException);

    userService.findByUsername.mockResolvedValue({ id: 1, username: 'alice', passwordHash: 'hash' });
    userService.validatePassword.mockResolvedValue(false);
    await expect(service.login({ username: 'alice', password: 'wrong123' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('changes the password only after validating the current password', async () => {
    const user = { id: 1, username: 'alice', passwordHash: 'hash' } as any;
    userService.validatePassword.mockResolvedValueOnce(false);
    await expect(service.changePassword(user, { currentPassword: 'wrong123', newPassword: 'new12345' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userService.updatePassword).not.toHaveBeenCalled();

    userService.validatePassword.mockResolvedValueOnce(true);
    await expect(service.changePassword(user, { currentPassword: 'old12345', newPassword: 'new12345' })).resolves.toBeUndefined();
    expect(userService.updatePassword).toHaveBeenCalledWith(user, 'new12345');
  });

  it('rejects reusing the current password', async () => {
    userService.validatePassword.mockResolvedValue(true);
    await expect(service.changePassword({ passwordHash: 'hash' } as any, { currentPassword: 'same123', newPassword: 'same123' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
