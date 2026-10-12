import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto.js';

describe('RegisterDto', () => {
  it('trims email and username without changing the password', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: ' alice@example.com ',
      username: ' Alice ',
      password: ' my password ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.email).toBe('alice@example.com');
    expect(dto.username).toBe('Alice');
    expect(dto.password).toBe(' my password ');
  });

  it('rejects an invalid email', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'not-an-email',
      username: 'alice',
      password: 'example-password',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('rejects a username containing only whitespace', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'alice@example.com',
      username: '   ',
      password: 'example-password',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'username')).toBe(true);
  });

  it('rejects a missing password', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'alice@example.com',
      username: 'alice',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});
