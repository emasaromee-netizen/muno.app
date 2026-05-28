-- Notifications table (broadcast)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  audience text NOT NULL DEFAULT 'residents', -- residents | tourists | both
  source_type text,
  source_id uuid,
  municipality_id uuid DEFAULT public.default_municipality_id(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_public_select ON public.notifications
  FOR SELECT USING (true);

CREATE POLICY notifications_admin_insert ON public.notifications
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'mayor'::app_role)
    OR public.has_role(auth.uid(), 'area_manager'::app_role)
    OR public.has_role(auth.uid(), 'tourism_chief'::app_role)
  );

CREATE POLICY notifications_admin_delete ON public.notifications
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'mayor'::app_role)
  );

CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications (created_at DESC);

-- Per-user reads
CREATE TABLE IF NOT EXISTS public.notification_reads (
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_reads_owner_all ON public.notification_reads
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger: auto-create notification when an announcement is inserted (enabled)
CREATE OR REPLACE FUNCTION public.announcement_to_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (title, body, link, audience, source_type, source_id, municipality_id)
  VALUES (
    NEW.title,
    COALESCE(NEW.description, ''),
    NEW.cta_to,
    COALESCE(NEW.audience, 'residents'),
    'announcement',
    NEW.id,
    NEW.municipality_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcement_notify ON public.announcements;
CREATE TRIGGER trg_announcement_notify
AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.announcement_to_notification();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_reads;