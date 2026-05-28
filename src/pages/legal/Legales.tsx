import { Link } from "react-router-dom";

export function Terminos() {
  return (
    <LegalShell title="Términos y Condiciones">
      <p>
        Bienvenido a <strong>MUNO</strong>, plataforma propiedad de <strong>ISA</strong>
        (Innovación &amp; Soluciones Aplicadas) y operada como herramienta tecnológica para
        municipios. Al usar MUNO aceptás estos términos.
      </p>
      <h2>1. Titularidad</h2>
      <p>
        MUNO es una marca y plataforma propiedad intelectual de ISA. ISA actúa como
        <em> procesador tecnológico</em>: provee la infraestructura, el software y la
        analítica. Los <strong>datos cargados</strong> (reclamos, padrones, comercios,
        contenido cultural y deportivo) son propiedad del <strong>municipio</strong> que
        contrata el servicio.
      </p>
      <h2>2. Uso del servicio</h2>
      <p>
        MUNO permite gestionar reclamos, turismo, cultura, deporte, comercios y
        comunicación municipal. El uso debe ajustarse a la normativa local y nacional
        aplicable.
      </p>
      <h2>3. Cuenta de usuario</h2>
      <p>
        Sos responsable de la veracidad de la información cargada y de mantener tu
        contraseña segura. El municipio puede suspender cuentas que vulneren estas
        condiciones.
      </p>
      <h2>4. Contenido municipal</h2>
      <p>
        El contenido publicado por el municipio es informativo y puede actualizarse sin
        previo aviso. ISA no edita ni revisa el contenido municipal salvo a pedido
        expreso del municipio.
      </p>
      <h2>5. Limitación de responsabilidad</h2>
      <p>
        ISA no se responsabiliza por interrupciones temporales del servicio, por la
        exactitud del contenido cargado por el municipio, ni por decisiones tomadas
        sobre la base de la información publicada.
      </p>
      <h2>6. Propiedad intelectual</h2>
      <p>
        El software, la marca MUNO, los reportes generados por <em>ISA Business
        Analyst</em> y la analítica son propiedad exclusiva de ISA. Está prohibida su
        reproducción sin autorización escrita.
      </p>
    </LegalShell>
  );
}

export function Privacidad() {
  return (
    <LegalShell title="Política de Privacidad">
      <p>
        Esta política describe cómo ISA, en su rol de <strong>procesador
        tecnológico</strong>, trata los datos personales que cargás en MUNO por cuenta y
        orden del municipio (responsable del tratamiento).
      </p>
      <h2>1. Datos personales</h2>
      <p>
        Almacenamos nombre, email, DNI, dirección y teléfono únicamente para
        identificarte ante el municipio. Estos datos <strong>no son visibles</strong>
        para otros vecinos ni se publican en perfiles externos.
      </p>
      <h2>2. Finalidad del tratamiento</h2>
      <p>
        Tus datos se usan para procesar reclamos, inscripciones, gestionar tasas
        comerciales y para que el municipio pueda comunicarse con vos.
      </p>
      <h2>3. Compartido con terceros</h2>
      <p>
        ISA <strong>no vende</strong> tus datos. Solo los procesa en infraestructura
        cloud certificada por cuenta del municipio. ISA puede generar métricas
        agregadas y anónimas para informes estratégicos del municipio.
      </p>
      <h2>4. Conservación</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa o mientras el municipio
        los requiera por obligaciones legales o administrativas.
      </p>
      <h2>5. Tus derechos</h2>
      <p>
        Podés solicitar acceso, rectificación, portabilidad o eliminación escribiendo a
        tu municipio o a <strong>privacidad@muno.app</strong>. Cumplimos con la Ley
        25.326 de Protección de Datos Personales (Argentina).
      </p>
      <h2>6. Cookies y analítica</h2>
      <p>
        Usamos cookies técnicas necesarias para mantener tu sesión. La analítica de uso
        es agregada y no permite identificarte individualmente.
      </p>
    </LegalShell>
  );
}

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-isa-light p-4">
      <div className="max-w-2xl mx-auto bg-card rounded-[20px] shadow-md p-7 space-y-4">
        <Link to="/auth/signup" className="text-[12px] font-bold text-muno-blue">← Volver</Link>
        <h1 className="font-display text-[24px] font-extrabold text-isa-navy">{title}</h1>
        <div className="space-y-3 text-[13px] text-isa-navy [&_h2]:font-extrabold [&_h2]:text-[15px] [&_h2]:mt-4 leading-relaxed">
          {children}
        </div>
        <p className="text-[10px] text-muted-foreground pt-4 border-t mt-4">
          MUNO — Propiedad intelectual de ISA · Datos propiedad del municipio · Última
          actualización: mayo 2026
        </p>
      </div>
    </div>
  );
}
