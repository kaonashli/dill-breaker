// Turn raw database errors into something a person can understand.
export function friendlyError(err) {
  const msg = err?.message || String(err)

  if (msg.includes('games_valid_score')) return "That isn't a valid pickleball score."
  if (msg.includes('row-level security')) return "You don't have permission to do that."
  if (msg.includes('profiles_username_lower_uniq')) return 'That username is already taken.'
  if (msg.includes('profiles_username_check'))
    return 'Usernames are 3-20 characters: letters, numbers or underscores.'
  if (msg.includes('Database error saving new user'))
    return 'Could not create the account. The username may have just been taken. Try another.'
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'

  return msg
}
