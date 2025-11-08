-- Assign admin role to ray.vazquez48@gmail.com
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'ray.vazquez48@gmail.com'
);

-- Verify the update
SELECT 
  up.user_id,
  au.email,
  up.role,
  up.full_name
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'ray.vazquez48@gmail.com';
