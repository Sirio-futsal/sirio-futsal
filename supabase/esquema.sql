-- =====================================================================
-- SIRIO FUTSAL · esquema de la base de datos (Supabase)
-- Pegá TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Se puede correr más de una vez sin romper nada.
-- =====================================================================

-- 1) Quién es la administradora. Si querés otro email, cambialo SOLO acá.
create or replace function public.email_admin() returns text
language sql immutable set search_path = public as $$ select 'siriofutsalrosario@gmail.com'::text $$;

-- 2) Tablas -------------------------------------------------------------
create table if not exists public.equipos (
  id text primary key,
  categoria_id text not null,
  nombre text not null,
  grupo text not null,
  division text,
  foto_cargada boolean not null default false
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null default '',
  rol text not null check (rol in ('admin', 'entrenador')),
  equipos text[] not null default '{}',
  creado timestamptz not null default now()
);

create table if not exists public.invitaciones (
  id text primary key default gen_random_uuid()::text,
  email text not null,
  nombre text not null,
  equipos text[] not null default '{}',
  creada timestamptz not null default now()
);
create unique index if not exists invitaciones_email_unico on public.invitaciones (lower(email));

create table if not exists public.partidos (
  id text primary key default gen_random_uuid()::text,
  equipo_id text not null references public.equipos(id),
  fecha date not null,
  hora text,
  hora_anterior text,
  rival text not null,
  condicion text not null check (condicion in ('local', 'visitante')),
  cancha text,
  goles_sirio int,
  goles_rival int,
  estado text not null default 'programado' check (estado in ('programado', 'jugado', 'suspendido', 'postergado')),
  origen text not null default 'club'
);
create index if not exists partidos_equipo_fecha on public.partidos (equipo_id, fecha);

create table if not exists public.noticias (
  id text primary key default gen_random_uuid()::text,
  categoria_id text,
  fecha date not null default current_date,
  destacada boolean not null default false,
  titulo text not null,
  bajada text not null default '',
  texto text not null default '',
  creada timestamptz not null default now()
);

create table if not exists public.jugadores (
  id text primary key default gen_random_uuid()::text,
  equipo_id text not null references public.equipos(id),
  nombre text not null,
  apellido text not null,
  dorsal int not null default 0,
  posicion text not null default '—',
  es_menor boolean not null default false,
  aut_nombre text check (aut_nombre in ('corto', 'completo')),
  aut_imagen boolean not null default false,
  aut_fecha date
);
create index if not exists jugadores_equipo on public.jugadores (equipo_id);

create table if not exists public.sugerencias (
  id text primary key default gen_random_uuid()::text,
  tipo text not null check (tipo in ('resultado', 'horario')),
  partido_id text not null references public.partidos(id) on delete cascade,
  goles_sirio int,
  goles_rival int,
  hora text,
  fuente text not null default ''
);

create table if not exists public.inscripciones (
  id text primary key default gen_random_uuid()::text,
  fecha date not null default current_date,
  jugador text not null check (char_length(jugador) <= 120),
  categoria text not null check (char_length(categoria) <= 60),
  adulto text not null check (char_length(adulto) <= 120),
  telefono text not null check (char_length(telefono) <= 40),
  mensaje text not null default '' check (char_length(mensaje) <= 1000)
);

create table if not exists public.avisos_enviados (
  id text primary key default gen_random_uuid()::text,
  tipo text not null,
  equipo_id text,
  categoria_id text,
  titulo text not null,
  mensaje text not null,
  fecha date not null default current_date,
  creado timestamptz not null default now()
);

-- Un solo registro: los jugadores del Sirio que figuran en el último boletín.
create table if not exists public.boletin (
  id int primary key check (id = 1),
  numero int not null,
  fecha date not null,
  jugadores text[] not null default '{}'
);

-- 3) Funciones de permisos ---------------------------------------------
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
$$;

create or replace function public.puede_editar_equipo(eq text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.es_admin() or exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'entrenador' and eq = any (equipos)
  )
$$;

create or replace function public.puede_publicar_categoria(cat text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.es_admin() or (
    cat is not null and exists (
      select 1 from public.profiles p join public.equipos e on e.id = any (p.equipos)
      where p.id = auth.uid() and p.rol = 'entrenador' and e.categoria_id = cat
    )
  )
$$;

-- 4) Al crearse una cuenta: la administradora o un entrenador invitado ----
create or replace function public.al_crear_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.invitaciones%rowtype;
begin
  if lower(new.email) = lower(public.email_admin()) then
    insert into public.profiles (id, email, nombre, rol) values (new.id, new.email, 'Administradora', 'admin')
    on conflict (id) do nothing;
  else
    select * into inv from public.invitaciones where lower(email) = lower(new.email);
    if found then
      insert into public.profiles (id, email, nombre, rol, equipos)
      values (new.id, new.email, inv.nombre, 'entrenador', inv.equipos)
      on conflict (id) do nothing;
      delete from public.invitaciones where id = inv.id;
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
for each row execute function public.al_crear_usuario();

-- Si la administradora ya tenía cuenta antes de correr este archivo:
insert into public.profiles (id, email, nombre, rol)
select id, email, 'Administradora', 'admin' from auth.users
where lower(email) = lower(public.email_admin())
on conflict (id) do nothing;

-- 5) Seguridad por fila (quién puede leer y escribir cada cosa) ----------
alter table public.equipos enable row level security;
alter table public.profiles enable row level security;
alter table public.invitaciones enable row level security;
alter table public.partidos enable row level security;
alter table public.noticias enable row level security;
alter table public.jugadores enable row level security;
alter table public.sugerencias enable row level security;
alter table public.inscripciones enable row level security;
alter table public.avisos_enviados enable row level security;
alter table public.boletin enable row level security;

drop policy if exists equipos_leer on public.equipos;
create policy equipos_leer on public.equipos for select using (true);
drop policy if exists equipos_admin on public.equipos;
create policy equipos_admin on public.equipos for all using (public.es_admin()) with check (public.es_admin());

drop policy if exists profiles_leer on public.profiles;
create policy profiles_leer on public.profiles for select using (id = auth.uid() or public.es_admin());
drop policy if exists profiles_admin_editar on public.profiles;
create policy profiles_admin_editar on public.profiles for update using (public.es_admin()) with check (public.es_admin());
drop policy if exists profiles_admin_borrar on public.profiles;
create policy profiles_admin_borrar on public.profiles for delete using (public.es_admin());

drop policy if exists invitaciones_admin on public.invitaciones;
create policy invitaciones_admin on public.invitaciones for all using (public.es_admin()) with check (public.es_admin());

drop policy if exists partidos_leer on public.partidos;
create policy partidos_leer on public.partidos for select using (true);
drop policy if exists partidos_crear on public.partidos;
create policy partidos_crear on public.partidos for insert with check (public.puede_editar_equipo(equipo_id));
drop policy if exists partidos_editar on public.partidos;
create policy partidos_editar on public.partidos for update
  using (public.puede_editar_equipo(equipo_id)) with check (public.puede_editar_equipo(equipo_id));

drop policy if exists noticias_leer on public.noticias;
create policy noticias_leer on public.noticias for select using (true);
drop policy if exists noticias_crear on public.noticias;
create policy noticias_crear on public.noticias for insert with check (public.puede_publicar_categoria(categoria_id));

-- Jugadores: la tabla completa solo la ven la administradora y el entrenador del equipo.
-- El público no lee jugadores: solo la administradora y el entrenador del equipo.
drop policy if exists jugadores_leer on public.jugadores;
create policy jugadores_leer on public.jugadores for select using (public.puede_editar_equipo(equipo_id));
drop policy if exists jugadores_crear on public.jugadores;
create policy jugadores_crear on public.jugadores for insert
  with check (public.puede_editar_equipo(equipo_id) and (public.es_admin() or (aut_nombre is null and aut_imagen = false)));
drop policy if exists jugadores_editar on public.jugadores;
create policy jugadores_editar on public.jugadores for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists sugerencias_admin on public.sugerencias;
create policy sugerencias_admin on public.sugerencias for all using (public.es_admin()) with check (public.es_admin());

-- Inscripciones: cualquiera puede enviar una consulta; solo la administradora las lee.
drop policy if exists inscripciones_enviar on public.inscripciones;
create policy inscripciones_enviar on public.inscripciones for insert to anon, authenticated with check (true);
drop policy if exists inscripciones_leer on public.inscripciones;
create policy inscripciones_leer on public.inscripciones for select using (public.es_admin());

drop policy if exists avisos_leer on public.avisos_enviados;
create policy avisos_leer on public.avisos_enviados for select
  using (public.es_admin() or (equipo_id is not null and public.puede_editar_equipo(equipo_id)));
drop policy if exists avisos_crear on public.avisos_enviados;
create policy avisos_crear on public.avisos_enviados for insert
  with check ((equipo_id is not null and public.puede_editar_equipo(equipo_id)) or (equipo_id is null and public.es_admin()));

drop policy if exists boletin_leer on public.boletin;
create policy boletin_leer on public.boletin for select using (true);
drop policy if exists boletin_admin on public.boletin;
create policy boletin_admin on public.boletin for all using (public.es_admin()) with check (public.es_admin());

-- 6) Vistas públicas: ver la sección 8 (equipos_publicos).

-- 7) Datos iniciales ------------------------------------------------------
insert into public.equipos (id, categoria_id, nombre, grupo, division) values
  ('masc-a-primera', 'masc-a', 'Primera', 'primera', null),
  ('masc-a-reserva', 'masc-a', 'Reserva', 'reserva', null),
  ('masc-a-inf-4ta', 'masc-a', 'Inferiores 4ta', 'inferiores', '4ta'),
  ('masc-a-inf-5ta', 'masc-a', 'Inferiores 5ta', 'inferiores', '5ta'),
  ('masc-a-inf-6ta', 'masc-a', 'Inferiores 6ta', 'inferiores', '6ta'),
  ('masc-a-inf-7ma', 'masc-a', 'Inferiores 7ma', 'inferiores', '7ma'),
  ('masc-a-inf-8va', 'masc-a', 'Inferiores 8va', 'inferiores', '8va'),
  ('masc-a-inf-9na', 'masc-a', 'Inferiores 9na', 'inferiores', '9na'),
  ('masc-b-primera', 'masc-b', 'Primera', 'primera', null),
  ('masc-b-reserva', 'masc-b', 'Reserva', 'reserva', null),
  ('masc-b-inf-4ta', 'masc-b', 'Inferiores 4ta', 'inferiores', '4ta'),
  ('masc-b-inf-5ta', 'masc-b', 'Inferiores 5ta', 'inferiores', '5ta'),
  ('masc-b-inf-6ta', 'masc-b', 'Inferiores 6ta', 'inferiores', '6ta'),
  ('masc-b-inf-7ma', 'masc-b', 'Inferiores 7ma', 'inferiores', '7ma'),
  ('masc-b-inf-8va', 'masc-b', 'Inferiores 8va', 'inferiores', '8va'),
  ('masc-b-inf-9na', 'masc-b', 'Inferiores 9na', 'inferiores', '9na'),
  ('fem-b-primera', 'fem-b', 'Primera', 'primera', null),
  ('fem-b-sub14', 'fem-b', 'Inferiores Sub-14', 'inferiores', 'Sub-14'),
  ('veteranos', 'veteranos', 'Veteranos', 'primera', null),
  ('escuelita', 'escuelita', 'Escuelita', 'escuelita', null)
on conflict (id) do nothing;

insert into public.boletin (id, numero, fecha, jugadores)
values (1, 3318, '2026-10-28', array['Ramiro Andalaf', 'Pedro Di Prinzio', 'Sebastián Pinto', 'Pilar Cairo'])
on conflict (id) do nothing;

-- 8) Ampliación: entrenador público, foto de equipo, tablas de posiciones,
--    datos del club y galería. Se puede correr más de una vez sin romper nada.

alter table public.equipos add column if not exists entrenador text;
alter table public.equipos add column if not exists foto_url text;

-- Tabla de posiciones de cada equipo (filas: [{pos, equipo, pj, pg, pe, pp, gf, gc, dg, pts}])
create table if not exists public.tablas (
  equipo_id text primary key references public.equipos(id) on delete cascade,
  filas jsonb not null default '[]'::jsonb,
  actualizada date not null default current_date
);

-- Un solo registro con los textos del club (historia, contacto, sponsors, archivo...)
create table if not exists public.club (
  id int primary key check (id = 1),
  historia text not null default '',
  direccion text not null default '',
  telefono text not null default '',
  whatsapp text not null default '',
  instagram text not null default '',
  indumentaria_texto text not null default '',
  indumentaria_url text not null default '',
  sponsors text not null default '',
  archivo text not null default ''
);
insert into public.club (id) values (1) on conflict (id) do nothing;

-- Galería de fotos del club
create table if not exists public.galeria (
  id text primary key default gen_random_uuid()::text,
  titulo text not null default '',
  categoria_id text,
  temporada text not null default '',
  url text not null,
  creada timestamptz not null default now()
);

alter table public.tablas enable row level security;
alter table public.club enable row level security;
alter table public.galeria enable row level security;

drop policy if exists tablas_leer on public.tablas;
create policy tablas_leer on public.tablas for select using (true);
drop policy if exists tablas_admin on public.tablas;
create policy tablas_admin on public.tablas for all using (public.es_admin()) with check (public.es_admin());

drop policy if exists club_leer on public.club;
create policy club_leer on public.club for select using (true);
drop policy if exists club_admin on public.club;
create policy club_admin on public.club for all using (public.es_admin()) with check (public.es_admin());

drop policy if exists galeria_leer on public.galeria;
create policy galeria_leer on public.galeria for select using (true);
drop policy if exists galeria_admin on public.galeria;
create policy galeria_admin on public.galeria for all using (public.es_admin()) with check (public.es_admin());

-- La tabla completa de equipos (con la URL de la foto) solo la ven la administradora y el entrenador del equipo.
-- El público usa la vista equipos_publicos, que muestra la foto solo si todos autorizaron su imagen.
drop policy if exists equipos_leer on public.equipos;
create policy equipos_leer on public.equipos for select using (public.puede_editar_equipo(id));

-- Ya no se publica ninguna lista de jugadores.
drop view if exists public.jugadores_publicos;

create or replace view public.equipos_publicos as
select s.id, s.categoria_id, s.nombre, s.grupo, s.division,
       s.foto_cargada, s.foto_publicable, s.entrenador,
       case when s.foto_publicable then s.foto_url end as foto_url
from (
  select e.id, e.categoria_id, e.nombre, e.grupo, e.division, e.entrenador, e.foto_url,
         (e.foto_url is not null) as foto_cargada,
         (e.foto_url is not null
           and exists (select 1 from public.jugadores j where j.equipo_id = e.id)
           and not exists (select 1 from public.jugadores j where j.equipo_id = e.id and not (j.aut_nombre is not null and j.aut_imagen))
         ) as foto_publicable
  from public.equipos e
) s;
grant select on public.equipos_publicos to anon, authenticated;

-- Almacén de imágenes (fotos de equipos y galería). Solo la administradora sube; todos pueden ver.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists imagenes_subir on storage.objects;
create policy imagenes_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'imagenes' and public.es_admin());
drop policy if exists imagenes_editar on storage.objects;
create policy imagenes_editar on storage.objects for update to authenticated
  using (bucket_id = 'imagenes' and public.es_admin()) with check (bucket_id = 'imagenes' and public.es_admin());
drop policy if exists imagenes_borrar on storage.objects;
create policy imagenes_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'imagenes' and public.es_admin());
