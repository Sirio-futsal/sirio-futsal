-- =====================================================================
-- SIRIO FUTSAL · ACTUALIZACIÓN 2 (para quien ya corrió esquema.sql)
-- Pegá TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Se puede correr más de una vez sin romper nada.
-- =====================================================================

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
