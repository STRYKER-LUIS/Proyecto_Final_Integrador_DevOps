import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { AuthContext, type AuthStatus } from '../context/auth-context';
import { ToastProvider } from '../context/ToastProvider';
import type { LoginPayload, PublicUser } from '../types';

const USER: PublicUser = {
  id: 'user-1',
  name: 'Ana Torres',
  email: 'ana@incidenthub.dev',
  role: 'ADMIN',
};

function renderLogin(options: {
  status?: AuthStatus;
  login?: ReturnType<typeof createLoginMock>;
  initialEntry?: string | { pathname: string; state?: unknown };
} = {}) {
  const login = options.login ?? createLoginMock();
  const status = options.status ?? 'anonymous';

  render(
    <AuthContext.Provider
      value={{
        user: status === 'authenticated' ? USER : null,
        status,
        login,
        logout: vi.fn(async () => undefined),
      }}
    >
      <ToastProvider>
        <MemoryRouter initialEntries={[options.initialEntry ?? '/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Panel principal</div>} />
            <Route path="/incidents" element={<div>Lista de incidentes</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>,
  );

  return { login };
}

function createLoginMock() {
  return vi.fn<(payload: LoginPayload) => Promise<PublicUser>>();
}

describe('LoginPage', () => {
  it('muestra un loader mientras se verifica la sesión', () => {
    renderLogin({ status: 'loading' });

    expect(screen.getByText('Verificando tu sesión…')).toBeInTheDocument();
  });

  it('redirige al panel cuando la sesión ya está autenticada', async () => {
    renderLogin({ status: 'authenticated' });

    expect(await screen.findByText('Panel principal')).toBeInTheDocument();
  });

  it('valida los campos obligatorios antes de llamar al backend', () => {
    const { login } = renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('rechaza un correo con formato inválido', () => {
    const { login } = renderLogin();

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'correo-invalido' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secreta' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('rellena las credenciales de demostración', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /Administrador/ }));

    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('admin@incidenthub.dev');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Admin123!');
  });

  it('permite mostrar y ocultar la contraseña', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /Administrador/ }));

    const password = screen.getByLabelText('Contraseña');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('inicia sesión, muestra la bienvenida y navega al panel', async () => {
    const login = createLoginMock().mockResolvedValue(USER);
    renderLogin({ login });

    fireEvent.click(screen.getByRole('button', { name: /Administrador/ }));
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'admin@incidenthub.dev',
        password: 'Admin123!',
      });
    });
    expect(await screen.findByText('Bienvenido, Ana')).toBeInTheDocument();
  });

  it('muestra el error del backend y reactiva el formulario', async () => {
    const login = createLoginMock().mockRejectedValue(new Error('Credenciales inválidas'));
    renderLogin({ login });

    fireEvent.click(screen.getByRole('button', { name: /Administrador/ }));
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(screen.getByRole('button', { name: /Iniciar sesión/ })).toBeEnabled();
  });

  it('respeta la ruta de origen al iniciar sesión', async () => {
    const login = createLoginMock().mockResolvedValue(USER);
    renderLogin({
      login,
      initialEntry: {
        pathname: '/login',
        state: { from: { pathname: '/incidents', search: '?status=NEW' } },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Administrador/ }));
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    expect(await screen.findByText('Lista de incidentes')).toBeInTheDocument();
  });
});
