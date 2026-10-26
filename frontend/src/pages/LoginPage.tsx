import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FullPageLoader } from '../components/ui/Feedback';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../lib/api-error';
import { validateLoginForm, type LoginFormErrors } from '../lib/login-form';
import { ROLE_LABELS } from '../lib/labels';
import type { Role } from '../types';

const DEMO_ACCOUNTS: Array<{
  role: Role;
  email: string;
  password: string;
  description: string;
}> = [
  {
    role: 'ADMIN',
    email: 'admin@incidenthub.dev',
    password: 'Admin123!',
    description: 'Gestión completa',
  },
  {
    role: 'AGENT',
    email: 'diego.agente@incidenthub.dev',
    password: 'Agent123!',
    description: 'Atención de casos',
  },
  {
    role: 'REPORTER',
    email: 'andres.usuario@incidenthub.dev',
    password: 'User123!',
    description: 'Reporta incidentes',
  },
];

export function LoginPage() {
  useDocumentTitle('Iniciar sesión');
  const { status, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as { from?: { pathname: string; search?: string } } | null;
  const redirectTo = state?.from
    ? `${state.from.pathname}${state.from.search ?? ''}`
    : '/';

  if (status === 'loading') {
    return <FullPageLoader message="Verificando tu sesión…" />;
  }

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrors({});
    setGeneralError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);

    const validationErrors = validateLoginForm({ email, password });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      toast({
        title: `Bienvenido, ${user.name.split(' ')[0]}`,
        description: 'Sesión iniciada correctamente.',
        variant: 'success',
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setGeneralError(
        getApiErrorMessage(error, 'Correo o contraseña incorrectos. Verifica tus datos.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-[#0b1220] to-indigo-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="login-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -left-24 top-1/3 size-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative">
          <Logo inverted />
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Sparkles className="size-3" aria-hidden="true" />
            Operación de TI, sin puntos ciegos
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Cada incidente,
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              bajo control.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
            Centraliza la gestión de incidentes, prioriza con criterios objetivos y cumple los SLA
            con una trazabilidad completa de cada acción.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Feature icon={Clock} title="SLA automático" description="Prioridades y tiempos objetivo." />
            <Feature icon={Workflow} title="Flujo auditable" description="Cada cambio en la bitácora." />
            <Feature icon={ShieldCheck} title="Acceso seguro" description="Roles y sesiones protegidas." />
          </div>
        </div>

        <div className="relative flex items-center gap-6 border-t border-white/10 pt-6">
          <Stat value="4 h" label="SLA crítico" />
          <span className="h-8 w-px bg-white/10" />
          <Stat value="100 %" label="Trazabilidad" />
          <span className="h-8 w-px bg-white/10" />
          <Stat value="24 / 7" label="Visibilidad" />
        </div>
      </section>

      <section className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
              Acceso al sistema
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa con tu cuenta corporativa para continuar.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Cuentas de demostración
              </p>
              <span className="text-[10px] text-slate-400">Solo entorno local</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="rounded-xl border border-transparent bg-white px-2 py-2.5 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:border-indigo-200 hover:ring-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                    {account.role === 'REPORTER' ? 'Usuario' : ROLE_LABELS[account.role]}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
                    {account.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {generalError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{generalError}</span>
              </div>
            ) : null}

            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
                setGeneralError(null);
              }}
              placeholder="tu.nombre@empresa.com"
              autoComplete="email"
              leadingIcon={<Mail className="size-4" />}
              error={errors.email}
              required
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
                setGeneralError(null);
              }}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              leadingIcon={<Lock className="size-4" />}
              error={errors.password}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={submitting}
              leftIcon={submitting ? undefined : <ArrowRight className="size-4" />}
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-[11px] leading-5 text-slate-500">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
            <p>
              El acceso está protegido con tokens de corta duración y cookies HttpOnly. Si no
              perteneces al equipo autorizado, solicita acceso a tu administrador.
            </p>
          </div>

          <p className="mt-8 text-center text-[11px] text-slate-400">
            IT Incident Hub · v1.0 · Plataforma de gestión de incidentes
          </p>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Clock;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <Icon className="size-4 text-indigo-300" aria-hidden="true" />
      <p className="mt-2 text-xs font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{description}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
