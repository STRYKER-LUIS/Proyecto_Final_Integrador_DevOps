import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { calculatePriority } from '../../backend/src/domain/priority';
import { addHours, calculateSlaDueAt } from '../../backend/src/domain/sla';
import type {
  CategoryValue,
  ImpactValue,
  IncidentStatusValue,
  UrgencyValue,
} from '../../backend/src/domain/types';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = Math.min(15, Math.max(10, Number(process.env.BCRYPT_ROUNDS ?? 12)));

interface Fixture {
  title: string;
  description: string;
  category: CategoryValue;
  impact: ImpactValue;
  urgency: UrgencyValue;
  status: IncidentStatusValue;
  hoursAgo: number;
  reporter: 'andres' | 'lucia';
  assignee: 'diego' | 'camila' | null;
  resolveAfterHours?: number;
  comment?: string;
  internalComment?: string;
}

const fixtures: Fixture[] = [
  {
    title: 'No puedo acceder al ERP desde la VPN',
    description:
      'Al conectarme por VPN y abrir el ERP, la sesión se cierra inmediatamente con un error de autenticación. Ocurre desde ayer y afecta a tres personas del área de compras.',
    category: 'ACCESS',
    impact: 'CRITICAL',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    hoursAgo: 3,
    reporter: 'andres',
    assignee: 'diego',
    comment: 'Ya validé que el usuario existe y la cuenta no está bloqueada.',
  },
  {
    title: 'Caída del enlace principal en oficina central',
    description:
      'El enlace de fibra de la sede central está caído. Los usuarios están trabajando por hotspot y el sistema de facturación no es accesible desde las sucursales.',
    category: 'NETWORK',
    impact: 'CRITICAL',
    urgency: 'HIGH',
    status: 'NEW',
    hoursAgo: 1.5,
    reporter: 'lucia',
    assignee: null,
  },
  {
    title: 'Impresora de facturación no responde',
    description:
      'La impresora del área de facturación aparece en línea, pero los trabajos quedan en cola. Se reinició el spooler sin resultado.',
    category: 'HARDWARE',
    impact: 'LOW',
    urgency: 'MEDIUM',
    status: 'RESOLVED',
    hoursAgo: 30,
    reporter: 'andres',
    assignee: 'camila',
    resolveAfterHours: 20,
    comment: 'Se reemplazó el cable USB y se limpió la cola de impresión.',
  },
  {
    title: 'Error 500 al cargar el portal de proveedores',
    description:
      'El portal de proveedores devuelve un error 500 al iniciar sesión. El equipo de desarrollo reporta que la base de datos secundaria estaba desincronizada.',
    category: 'SOFTWARE',
    impact: 'HIGH',
    urgency: 'HIGH',
    status: 'CLOSED',
    hoursAgo: 50,
    reporter: 'andres',
    assignee: 'camila',
    resolveAfterHours: 7,
    comment: 'Se promovió el hotfix y se validó el acceso con dos proveedores.',
  },
  {
    title: 'Solicitud de acceso a carpeta de auditoría',
    description:
      'Necesito permiso de lectura sobre la carpeta compartida de auditoría interna para revisar los documentos del trimestre.',
    category: 'ACCESS',
    impact: 'LOW',
    urgency: 'LOW',
    status: 'ASSIGNED',
    hoursAgo: 10,
    reporter: 'lucia',
    assignee: 'diego',
  },
  {
    title: 'Correos de clientes rechazados por SPF',
    description:
      'Varios clientes reportan que nuestros correos rebotan con un error de SPF. Se sospecha que el registro DNS fue modificado durante la migración del dominio.',
    category: 'EMAIL',
    impact: 'HIGH',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    hoursAgo: 6,
    reporter: 'andres',
    assignee: 'camila',
    comment: 'Se solicitó al proveedor DNS restaurar el registro SPF anterior.',
  },
  {
    title: 'Laptop se reinicia aleatoriamente',
    description:
      'La laptop de gerencia se apaga y reinicia sin mostrar pantalla azul. Sucede principalmente cuando está conectada a la base de expansión.',
    category: 'HARDWARE',
    impact: 'MEDIUM',
    urgency: 'HIGH',
    status: 'ON_HOLD',
    hoursAgo: 26,
    reporter: 'andres',
    assignee: 'diego',
    comment: 'Equipo en banco de pruebas. Se espera respuesta del proveedor por la garantía.',
  },
  {
    title: 'VPN intermitente desde sede norte',
    description:
      'Las conexiones VPN de la sede norte se desconectan cada 10 o 15 minutos. El enlace local parece estable y el problema solo afecta túneles IPSec.',
    category: 'NETWORK',
    impact: 'HIGH',
    urgency: 'HIGH',
    status: 'ASSIGNED',
    hoursAgo: 9,
    reporter: 'lucia',
    assignee: 'diego',
  },
  {
    title: 'Restablecer MFA de usuario nuevo',
    description:
      'La nueva analista cambió de teléfono y no puede completar el segundo factor. Se requiere reiniciar el registro MFA.',
    category: 'ACCESS',
    impact: 'MEDIUM',
    urgency: 'LOW',
    status: 'RESOLVED',
    hoursAgo: 5,
    reporter: 'andres',
    assignee: 'camila',
    resolveAfterHours: 1,
    comment: 'Registro MFA reiniciado y validado con la usuaria.',
  },
  {
    title: 'Sistema de nómina lento al cierre',
    description:
      'Durante el cierre de nómina, las consultas tardan más de dos minutos. El problema es recurrente en los últimos tres periodos y afecta a 40 usuarios.',
    category: 'SOFTWARE',
    impact: 'HIGH',
    urgency: 'MEDIUM',
    status: 'IN_PROGRESS',
    hoursAgo: 4,
    reporter: 'lucia',
    assignee: 'camila',
  },
  {
    title: 'Monitor principal con líneas verticales',
    description:
      'El monitor principal muestra líneas verticales intermitentes. Se probó otro cable DisplayPort y el problema persiste.',
    category: 'HARDWARE',
    impact: 'LOW',
    urgency: 'HIGH',
    status: 'CLOSED',
    hoursAgo: 80,
    reporter: 'lucia',
    assignee: 'diego',
    resolveAfterHours: 50,
    comment: 'Monitor reemplazado bajo garantía.',
  },
  {
    title: 'No llegan notificaciones de Teams',
    description:
      'Desde esta mañana no llegan notificaciones ni mensajes en la aplicación de escritorio de Teams. La versión web funciona correctamente.',
    category: 'SOFTWARE',
    impact: 'MEDIUM',
    urgency: 'MEDIUM',
    status: 'NEW',
    hoursAgo: 2,
    reporter: 'andres',
    assignee: null,
  },
  {
    title: 'Ataque de phishing reportado por finanzas',
    description:
      'Un usuario de finanzas recibió un correo que suplanta al banco y abrió un enlace. Se aisló el equipo y se está revisando si hubo ingreso de credenciales.',
    category: 'EMAIL',
    impact: 'CRITICAL',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    hoursAgo: 2.5,
    reporter: 'lucia',
    assignee: 'diego',
    comment: 'Equipo aislado de la red y sesiones revocadas. Se revisan correos similares.',
    internalComment: 'Verificar con seguridad si el dominio del enlace está en la lista de IoC.',
  },
  {
    title: 'Servidor de archivos sin espacio',
    description:
      'El servidor de archivos alcanzó el 100% de uso de disco. Ya no se pueden guardar documentos ni generar respaldos incrementales.',
    category: 'SOFTWARE',
    impact: 'CRITICAL',
    urgency: 'MEDIUM',
    status: 'NEW',
    hoursAgo: 12,
    reporter: 'andres',
    assignee: null,
  },
  {
    title: 'Alta de usuario en CRM',
    description:
      'Solicitud de alta y asignación de licencia CRM para la nueva ejecutiva comercial de la zona occidente.',
    category: 'ACCESS',
    impact: 'LOW',
    urgency: 'HIGH',
    status: 'CANCELLED',
    hoursAgo: 100,
    reporter: 'lucia',
    assignee: null,
    comment: 'Solicitud duplicada. Se cerró y se dio seguimiento en INC del área de ventas.',
  },
  {
    title: 'Wi-Fi de sala de juntas inestable',
    description:
      'Durante las videollamadas el Wi-Fi de la sala de juntas se desconecta. El punto de acceso tiene la última actualización de firmware.',
    category: 'NETWORK',
    impact: 'MEDIUM',
    urgency: 'MEDIUM',
    status: 'ON_HOLD',
    hoursAgo: 32,
    reporter: 'andres',
    assignee: 'camila',
    comment: 'Se espera aprobación para reemplazar el access point de la sala.',
  },
  {
    title: 'Aplicación móvil no sincroniza',
    description:
      'La app móvil muestra datos de ayer y no sincroniza nuevas visitas. Se validó que el usuario tiene conexión y la versión más reciente.',
    category: 'SOFTWARE',
    impact: 'HIGH',
    urgency: 'MEDIUM',
    status: 'RESOLVED',
    hoursAgo: 18,
    reporter: 'lucia',
    assignee: 'diego',
    resolveAfterHours: 6,
    comment: 'Se eliminó un token corrupto en el servidor de sincronización.',
  },
  {
    title: 'Cambio de tóner impresora piso 4',
    description:
      'La impresora compartida del piso 4 muestra el aviso de tóner agotado. Es necesario reemplazarlo para retomar las impresiones.',
    category: 'HARDWARE',
    impact: 'LOW',
    urgency: 'LOW',
    status: 'CLOSED',
    hoursAgo: 120,
    reporter: 'andres',
    assignee: 'diego',
    resolveAfterHours: 40,
    comment: 'Se instaló un tóner nuevo y se actualizó el contador.',
  },
  {
    title: 'Bloqueo de cuenta por intentos fallidos',
    description:
      'La cuenta corporativa quedó bloqueada luego de varios intentos fallidos. El usuario necesita recuperar acceso para una reunión.',
    category: 'ACCESS',
    impact: 'MEDIUM',
    urgency: 'HIGH',
    status: 'RESOLVED',
    hoursAgo: 11,
    reporter: 'lucia',
    assignee: 'camila',
    resolveAfterHours: 2,
    comment: 'Cuenta desbloqueada y contraseña restablecida de forma segura.',
  },
  {
    title: 'Backup nocturno falló en base de datos',
    description:
      'El respaldo automático de la base transaccional terminó con error de consistencia. La copia anterior se encuentra disponible.',
    category: 'SOFTWARE',
    impact: 'CRITICAL',
    urgency: 'HIGH',
    status: 'CLOSED',
    hoursAgo: 48,
    reporter: 'lucia',
    assignee: 'diego',
    resolveAfterHours: 3,
    comment: 'Se reconstruyó el snapshot y se validó la restauración en ambiente de pruebas.',
  },
  {
    title: 'Pantalla azul al abrir aplicación contable',
    description:
      'El equipo de contabilidad se reinicia con una pantalla azul al abrir la nueva versión de la aplicación. Ocurre en dos equipos Windows 11.',
    category: 'SOFTWARE',
    impact: 'HIGH',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    hoursAgo: 5,
    reporter: 'andres',
    assignee: 'camila',
  },
  {
    title: 'Solicitud de licencia de software de diseño',
    description:
      'El equipo de marketing solicita una licencia adicional de la herramienta de diseño para un colaborador temporal.',
    category: 'SOFTWARE',
    impact: 'LOW',
    urgency: 'LOW',
    status: 'ASSIGNED',
    hoursAgo: 20,
    reporter: 'andres',
    assignee: 'diego',
  },
  {
    title: 'Teléfono IP sin tono en recepción',
    description:
      'El teléfono IP de recepción permanece sin tono desde el reinicio de la central telefónica. El cableado fue revisado por mantenimiento.',
    category: 'NETWORK',
    impact: 'HIGH',
    urgency: 'HIGH',
    status: 'RESOLVED',
    hoursAgo: 14,
    reporter: 'lucia',
    assignee: 'camila',
    resolveAfterHours: 7.5,
    comment: 'Se reasignó la extensión en la central y se validaron llamadas entrantes y salientes.',
  },
  {
    title: 'Correo masivo rebotado',
    description:
      'La campaña mensual de mercadeo fue rechazada por varios proveedores por superar los límites de envío. Se requiere revisar la reputación del dominio.',
    category: 'EMAIL',
    impact: 'MEDIUM',
    urgency: 'HIGH',
    status: 'CLOSED',
    hoursAgo: 70,
    reporter: 'andres',
    assignee: 'diego',
    resolveAfterHours: 30,
    comment: 'Se ajustó la cola de envío y se actualizó el registro DMARC.',
  },
  {
    title: 'Fallo de autenticación en SSO',
    description:
      'El proveedor de identidad devuelve errores intermitentes al iniciar sesión. Afecta a usuarios de varias áreas y crece la cantidad de reportes.',
    category: 'ACCESS',
    impact: 'CRITICAL',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    hoursAgo: 3.5,
    reporter: 'lucia',
    assignee: 'diego',
    comment: 'Se contactó al proveedor y se aplicó un workaround temporal para administradores.',
  },
  {
    title: 'Actualizar antivirus en equipos de ventas',
    description:
      '20 equipos del área de ventas mantienen una firma de antivirus desactualizada. La actualización central falla por políticas de grupo.',
    category: 'SOFTWARE',
    impact: 'LOW',
    urgency: 'MEDIUM',
    status: 'ASSIGNED',
    hoursAgo: 15,
    reporter: 'andres',
    assignee: 'camila',
  },
  {
    title: 'Disco externo no reconocido',
    description:
      'El disco externo de respaldo del área de diseño no aparece en Windows. Se probó en otro puerto sin éxito.',
    category: 'HARDWARE',
    impact: 'MEDIUM',
    urgency: 'LOW',
    status: 'NEW',
    hoursAgo: 6,
    reporter: 'lucia',
    assignee: null,
  },
  {
    title: 'Incidente de seguridad: acceso no autorizado',
    description:
      'Se detectó un inicio de sesión fuera de horario desde una ubicación no habitual. La cuenta está bloqueada y se inició el protocolo de seguridad.',
    category: 'ACCESS',
    impact: 'CRITICAL',
    urgency: 'HIGH',
    status: 'ON_HOLD',
    hoursAgo: 8,
    reporter: 'andres',
    assignee: 'diego',
    internalComment: 'Caso escalado a seguridad corporativa. No compartir detalles fuera del equipo.',
  },
  {
    title: 'Solicitud de nueva cuenta de correo',
    description:
      'Solicitud de creación de buzón corporativo para una practicante que ingresa el próximo lunes. Requiere acceso al calendario compartido.',
    category: 'EMAIL',
    impact: 'LOW',
    urgency: 'MEDIUM',
    status: 'RESOLVED',
    hoursAgo: 3,
    reporter: 'lucia',
    assignee: 'camila',
    resolveAfterHours: 2,
  },
  {
    title: 'Latencia en aplicación de RRHH',
    description:
      'La aplicación de recursos humanos tarda más de 20 segundos en cargar el listado de empleados desde la red corporativa.',
    category: 'SOFTWARE',
    impact: 'MEDIUM',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    hoursAgo: 7,
    reporter: 'andres',
    assignee: 'camila',
    comment: 'Se identificó una consulta sin índice y se está revisando con el proveedor.',
  },
  {
    title: 'Configurar firma de correo para dirección',
    description:
      'Dirección solicita actualizar la firma institucional en Outlook con el nuevo cargo y teléfono de contacto.',
    category: 'EMAIL',
    impact: 'LOW',
    urgency: 'LOW',
    status: 'RESOLVED',
    hoursAgo: 24,
    reporter: 'andres',
    assignee: 'diego',
    resolveAfterHours: 4,
    comment: 'Firma configurada en Outlook de escritorio y web.',
  },
];

const users = {
  admin: {
    email: 'admin@incidenthub.dev',
    name: 'Valeria Ríos',
    password: 'Admin123!',
    role: 'ADMIN' as const,
  },
  diego: {
    email: 'diego.agente@incidenthub.dev',
    name: 'Diego Torres',
    password: 'Agent123!',
    role: 'AGENT' as const,
  },
  camila: {
    email: 'camila.agente@incidenthub.dev',
    name: 'Camila Herrera',
    password: 'Agent123!',
    role: 'AGENT' as const,
  },
  andres: {
    email: 'andres.usuario@incidenthub.dev',
    name: 'Andrés Molina',
    password: 'User123!',
    role: 'REPORTER' as const,
  },
  lucia: {
    email: 'lucia.usuario@incidenthub.dev',
    name: 'Lucía Fernández',
    password: 'User123!',
    role: 'REPORTER' as const,
  },
};

function getStatusPath(status: IncidentStatusValue): Array<{
  from: IncidentStatusValue;
  to: IncidentStatusValue;
}> {
  switch (status) {
    case 'NEW':
      return [];
    case 'CANCELLED':
      return [{ from: 'NEW', to: 'CANCELLED' }];
    case 'ASSIGNED':
      return [{ from: 'NEW', to: 'ASSIGNED' }];
    case 'IN_PROGRESS':
      return [
        { from: 'NEW', to: 'ASSIGNED' },
        { from: 'ASSIGNED', to: 'IN_PROGRESS' },
      ];
    case 'ON_HOLD':
      return [
        { from: 'NEW', to: 'ASSIGNED' },
        { from: 'ASSIGNED', to: 'IN_PROGRESS' },
        { from: 'IN_PROGRESS', to: 'ON_HOLD' },
      ];
    case 'RESOLVED':
      return [
        { from: 'NEW', to: 'ASSIGNED' },
        { from: 'ASSIGNED', to: 'IN_PROGRESS' },
        { from: 'IN_PROGRESS', to: 'RESOLVED' },
      ];
    case 'CLOSED':
      return [
        { from: 'NEW', to: 'ASSIGNED' },
        { from: 'ASSIGNED', to: 'IN_PROGRESS' },
        { from: 'IN_PROGRESS', to: 'RESOLVED' },
        { from: 'RESOLVED', to: 'CLOSED' },
      ];
  }
}

async function main(): Promise<void> {
  console.log('Sembrando datos de demostración...');

  const passwordHashes = {
    admin: await bcrypt.hash(users.admin.password, BCRYPT_ROUNDS),
    agent: await bcrypt.hash(users.diego.password, BCRYPT_ROUNDS),
    reporter: await bcrypt.hash(users.andres.password, BCRYPT_ROUNDS),
  };

  const userEntries = await Promise.all(
    Object.values(users).map(async (seedUser) => {
      const passwordHash =
        seedUser.role === 'ADMIN'
          ? passwordHashes.admin
          : seedUser.role === 'AGENT'
            ? passwordHashes.agent
            : passwordHashes.reporter;

      const user = await prisma.user.upsert({
        where: { email: seedUser.email },
        update: {
          name: seedUser.name,
          role: seedUser.role,
          isActive: true,
          passwordHash,
        },
        create: {
          email: seedUser.email,
          name: seedUser.name,
          role: seedUser.role,
          passwordHash,
        },
      });

      return [seedUser.email, user] as const;
    }),
  );

  const byEmail = new Map(userEntries);
  const admin = byEmail.get(users.admin.email);
  const diego = byEmail.get(users.diego.email);
  const camila = byEmail.get(users.camila.email);
  const andres = byEmail.get(users.andres.email);
  const lucia = byEmail.get(users.lucia.email);

  if (!admin || !diego || !camila || !andres || !lucia) {
    throw new Error('No se pudieron crear los usuarios de demostración');
  }

  const existingIncidents = await prisma.incident.count();
  if (existingIncidents > 0) {
    console.log(
      `Ya existen ${existingIncidents} incidentes. No se duplican datos. Usa "npm run db:reset" si deseas reiniciar la demo.`,
    );
  } else {
    const now = new Date();
    const staffById = { diego, camila };
    const reporterById = { andres, lucia };

    for (const [index, fixture] of fixtures.entries()) {
      const createdAt = new Date(now.getTime() - fixture.hoursAgo * 60 * 60 * 1000);
      const priority = calculatePriority(fixture.impact, fixture.urgency);
      const slaDueAt = calculateSlaDueAt(createdAt, priority);
      const assignee = fixture.assignee ? staffById[fixture.assignee] : null;
      const reporter = reporterById[fixture.reporter];
      const isFinished = fixture.status === 'RESOLVED' || fixture.status === 'CLOSED';
      const resolvedAt =
        isFinished && fixture.resolveAfterHours !== undefined
          ? addHours(createdAt, fixture.resolveAfterHours)
          : null;
      const closedAt =
        fixture.status === 'CLOSED' && resolvedAt ? addHours(resolvedAt, 1) : null;
      const firstResponseAt =
        fixture.status === 'NEW' || fixture.status === 'CANCELLED'
          ? null
          : addHours(createdAt, 0.5);

      const incident = await prisma.incident.create({
        data: {
          title: fixture.title,
          description: fixture.description,
          category: fixture.category,
          impact: fixture.impact,
          urgency: fixture.urgency,
          priority,
          status: fixture.status,
          reporterId: reporter.id,
          assigneeId: assignee?.id ?? null,
          slaDueAt,
          firstResponseAt,
          resolvedAt,
          closedAt,
          createdAt,
        },
      });

      const events: Array<{
        action: 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED';
        actorId: string | null;
        detail: string | null;
        fromStatus: IncidentStatusValue | null;
        toStatus: IncidentStatusValue | null;
        createdAt: Date;
      }> = [
        {
          action: 'CREATED',
          actorId: reporter.id,
          detail: 'Incidente registrado',
          fromStatus: null,
          toStatus: null,
          createdAt,
        },
      ];

      const path = getStatusPath(fixture.status);
      path.forEach((transition, step) => {
        const eventAt = addHours(createdAt, 0.5 + step * 0.25);
        events.push({
          action: transition.to === 'ASSIGNED' && fixture.assignee ? 'ASSIGNED' : 'STATUS_CHANGED',
          actorId:
            transition.to === 'CANCELLED'
              ? admin.id
              : fixture.assignee
                ? staffById[fixture.assignee].id
                : reporter.id,
          detail:
            transition.to === 'ASSIGNED' && fixture.assignee
              ? `Incidente asignado a ${staffById[fixture.assignee].name}`
              : null,
          fromStatus: transition.from,
          toStatus: transition.to,
          createdAt: eventAt,
        });
      });

      if (fixture.comment) {
        await prisma.comment.create({
          data: {
            incidentId: incident.id,
            authorId: assignee?.id ?? reporter.id,
            content: fixture.comment,
            isInternal: false,
            createdAt: addHours(createdAt, 1),
          },
        });
        events.push({
          action: 'COMMENTED',
          actorId: assignee?.id ?? reporter.id,
          detail: 'Comentario agregado',
          fromStatus: null,
          toStatus: null,
          createdAt: addHours(createdAt, 1),
        });
      }

      if (fixture.internalComment && assignee) {
        await prisma.comment.create({
          data: {
            incidentId: incident.id,
            authorId: assignee.id,
            content: fixture.internalComment,
            isInternal: true,
            createdAt: addHours(createdAt, 1.25),
          },
        });
        events.push({
          action: 'COMMENTED',
          actorId: assignee.id,
          detail: 'Nota interna agregada',
          fromStatus: null,
          toStatus: null,
          createdAt: addHours(createdAt, 1.25),
        });
      }

      await prisma.activity.createMany({
        data: events.map((event) => ({
          ...event,
          incidentId: incident.id,
        })),
      });

      if ((index + 1) % 10 === 0) {
        console.log(`  ${index + 1} incidentes creados`);
      }
    }
  }

  const [incidentCount, commentCount] = await Promise.all([
    prisma.incident.count(),
    prisma.comment.count(),
  ]);

  console.log('');
  console.log(`Datos listos: ${incidentCount} incidentes y ${commentCount} comentarios.`);
  console.log('Cuentas de demostración:');
  console.log(`  ADMIN    ${users.admin.email} / ${users.admin.password}`);
  console.log(`  AGENTE   ${users.diego.email} / ${users.diego.password}`);
  console.log(`  USUARIO  ${users.andres.email} / ${users.andres.password}`);
  console.log('');
}

main()
  .catch((error: unknown) => {
    console.error('Error al sembrar la base de datos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
