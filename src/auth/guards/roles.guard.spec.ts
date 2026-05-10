import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new RolesGuard(reflector as Reflector);
  });

  function createContext(user?: { rol?: string }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows the request when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined as never);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('throws when a role is required but missing from the request', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin'] as never);

    expect(() => guard.canActivate(createContext())).toThrow(
      new ForbiddenException('Acceso denegado: rol no presente'),
    );
  });

  it('allows the request when the user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'user'] as never);

    expect(guard.canActivate(createContext({ rol: 'user' }))).toBe(true);
  });

  it('returns false when the user role does not match', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin'] as never);

    expect(guard.canActivate(createContext({ rol: 'user' }))).toBe(false);
  });
});
