
-- Tourist ratings (1-5 stars) per municipality
CREATE TABLE public.tourist_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid DEFAULT public.default_municipality_id(),
  user_id uuid,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tourist_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tourist_ratings_public_insert ON public.tourist_ratings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY tourist_ratings_internal_select ON public.tourist_ratings
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'mayor'::app_role)
    OR public.has_role(auth.uid(), 'area_manager'::app_role)
    OR public.has_role(auth.uid(), 'tourism_chief'::app_role)
    OR public.has_role(auth.uid(), 'isa_consultant'::app_role)
  );

CREATE POLICY tourist_ratings_owner_select ON public.tourist_ratings
  FOR SELECT USING (auth.uid() = user_id);

-- Tourist favorite places
CREATE TABLE public.tourist_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  municipality_id uuid DEFAULT public.default_municipality_id(),
  place_id text NOT NULL,
  place_name text NOT NULL,
  place_type text,
  place_photo_url text,
  place_zone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);
ALTER TABLE public.tourist_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY favs_owner_all ON public.tourist_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY favs_internal_select ON public.tourist_favorites
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'mayor'::app_role)
    OR public.has_role(auth.uid(), 'tourism_chief'::app_role)
    OR public.has_role(auth.uid(), 'isa_consultant'::app_role)
  );

CREATE INDEX idx_tourist_favorites_place ON public.tourist_favorites(place_id);
CREATE INDEX idx_tourist_ratings_municipality ON public.tourist_ratings(municipality_id);
