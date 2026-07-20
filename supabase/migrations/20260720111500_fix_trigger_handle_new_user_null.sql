CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, dni, municipality_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'dni',
    COALESCE((NEW.raw_user_meta_data->>'municipality_id')::uuid, public.default_municipality_id())
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;