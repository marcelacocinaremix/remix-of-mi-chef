
CREATE TABLE public.app_config (
  id INTEGER NOT NULL PRIMARY KEY,
  min_version TEXT NOT NULL DEFAULT '1.0.0',
  store_url TEXT NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=app.marcelacocina.michef',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app config"
  ON public.app_config FOR SELECT USING (true);

CREATE POLICY "Only service role can insert app config"
  ON public.app_config FOR INSERT WITH CHECK (false);

CREATE POLICY "Only service role can update app config"
  ON public.app_config FOR UPDATE USING (false);

CREATE POLICY "Only service role can delete app config"
  ON public.app_config FOR DELETE USING (false);

INSERT INTO public.app_config (id, min_version, store_url)
VALUES (1, '1.0.0', 'https://play.google.com/store/apps/details?id=app.marcelacocina.michef');
