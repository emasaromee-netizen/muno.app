import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "area_manager" | "tourism_chief" | "mayor" | "resident" | "admin";

const HIERARCHY_ROLES: Role[] = ["area_manager", "tourism_chief", "mayor", "admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (!caller) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const dni = String(body.dni || "").replace(/\D/g, "");
    const role = String(body.role || "") as Role;
    const area = body.area ? String(body.area) : null;

    if (!fullName || fullName.length < 2 || fullName.length > 120) return json({ error: "Nombre inválido" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Email inválido" }, 400);
    if (!/^\d{7,9}$/.test(dni)) return json({ error: "DNI inválido (7-9 dígitos)" }, 400);
    if (!["area_manager", "tourism_chief", "mayor", "resident"].includes(role)) return json({ error: "Rol inválido" }, 400);

    // Get caller roles + area
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role,area,municipality_id")
      .eq("user_id", caller.id);

    const callerRoleNames = (callerRoles || []).map((r: any) => r.role) as string[];
    const isAdmin = callerRoleNames.includes("admin");
    const isMayor = callerRoleNames.includes("mayor");
    const isAreaMgr = callerRoleNames.includes("area_manager");
    const callerArea = (callerRoles || []).find((r: any) => r.role === "area_manager")?.area || null;
    const callerMunicipality =
      (callerRoles || []).find((r: any) => r.municipality_id)?.municipality_id || null;

    // Authorization: hierarchy
    if (HIERARCHY_ROLES.includes(role)) {
      // Creating an area chief / tourism chief / mayor → only admin or mayor
      if (!isAdmin && !isMayor) {
        return json({ error: "Solo el Intendente puede crear Jefes de Área" }, 403);
      }
    } else {
      // Creating a collaborator (resident) → admin/mayor OR area_manager (own area only)
      if (!isAdmin && !isMayor) {
        if (!isAreaMgr) return json({ error: "No autorizado" }, 403);
        if (!area || area !== callerArea) {
          return json({ error: "Solo podés agregar colaboradores en tu propia área" }, 403);
        }
      }
    }

    // Check if user exists in profiles by email
    let userId: string | null = null;
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      userId = existingProfile.id;
    } else {
      // Create auth user with DNI as provisional password
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: dni,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr || !created?.user) {
        return json({ error: "No se pudo crear el usuario: " + (createErr?.message || "desconocido") }, 400);
      }
      userId = created.user.id;
    }

    // Upsert profile (name, dni, municipality)
    await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          dni,
          ...(callerMunicipality ? { municipality_id: callerMunicipality } : {}),
        } as any,
        { onConflict: "id" },
      );

    // Insert user_roles (avoid duplicate role+user)
    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role as any)
      .maybeSingle();

    if (!existingRole) {
      const insertPayload: any = {
        user_id: userId,
        role,
        area: HIERARCHY_ROLES.includes(role) || role === "resident" ? area : null,
        active: true,
      };
      if (callerMunicipality) insertPayload.municipality_id = callerMunicipality;
      const { error: roleErr } = await admin.from("user_roles").insert(insertPayload);
      if (roleErr) return json({ error: "No se pudo asignar el rol: " + roleErr.message }, 400);
    } else if (area) {
      await admin.from("user_roles").update({ area, active: true } as any).eq("id", existingRole.id);
    }

    return json({
      ok: true,
      user_id: userId,
      provisional_password: dni,
      message: `Usuario habilitado. Credenciales: ${email} / ${dni}`,
    });
  } catch (e: any) {
    return json({ error: e?.message || "Error interno" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
