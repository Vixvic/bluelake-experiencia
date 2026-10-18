import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UpdatePassword from './UpdatePassword';

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'admin-user' }, isAdmin: true, requiresPasswordChange: false, loading: false },
  updateUser: vi.fn(), update: vi.fn(), eq: vi.fn(), toast: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { updateUser: mocks.updateUser },
  from: () => ({ update: mocks.update }),
} }));

describe('Password recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
  });
  it('allows a signed-in administrator without a temporary-password flag to submit a recovery password', async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: 'Test rejection' } });
    render(<MemoryRouter><UpdatePassword /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Nueva Contraseña'), { target: { value: 'private-test-value' } });
    fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), { target: { value: 'private-test-value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Continuar' }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'private-test-value' }));
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('does not send mismatched passwords to authentication', () => {
    render(<MemoryRouter><UpdatePassword /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Nueva Contraseña'), { target: { value: 'private-test-value' } });
    fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), { target: { value: 'different-test-value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Continuar' }));
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});