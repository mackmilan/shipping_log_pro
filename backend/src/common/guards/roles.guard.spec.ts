import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/role.enum';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: UserRole.USER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN access to any protected role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OPERATOR]);
    const context = createMockContext({ role: UserRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow OPERATOR access to OPERATOR protected role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OPERATOR]);
    const context = createMockContext({ role: UserRole.OPERATOR });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny USER access to OPERATOR or ADMIN protected role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.USER });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow DRIVER access to DRIVER protected role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.DRIVER]);
    const context = createMockContext({ role: UserRole.DRIVER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny DRIVER access to ADMIN only protected role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.DRIVER });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);
    const context = createMockContext(null);

    expect(guard.canActivate(context)).toBe(false);
  });
});
