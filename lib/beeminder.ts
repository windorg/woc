// https://api.beeminder.com/#client-oauth
export function beeminderAuthUrl() {
  let url = new URL('https://www.beeminder.com/apps/authorize')
  url.searchParams.append('client_id', process.env.NEXT_PUBLIC_BEEMINDER_CLIENT_ID!)
  url.searchParams.append('redirect_uri', process.env.NEXT_PUBLIC_BEEMINDER_REDIRECT_URI!)
  url.searchParams.append('response_type', 'token')
  return url
}
