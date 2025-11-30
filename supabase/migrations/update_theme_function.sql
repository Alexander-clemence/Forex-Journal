-- Create a function to update only the theme column
CREATE OR REPLACE FUNCTION update_user_theme(
  p_user_id UUID,
  p_theme TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_settings
  SET theme = p_theme,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no row exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_settings (user_id, theme, timezone, default_currency, notifications, trading_preferences)
    VALUES (
      p_user_id,
      p_theme,
      'UTC',
      'USD',
      '{"daily_summary": true, "trade_reminders": false, "update_notifications": true}'::jsonb,
      '{"default_position_size": 1000, "risk_per_trade": 2}'::jsonb
    );
  END IF;
END;
$$;



