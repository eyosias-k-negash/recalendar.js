import dayjs from 'dayjs/esm';

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
let initialized = false;

function loadScript() {
return new Promise( ( resolve, reject ) => {
const script = document.createElement( 'script' );
script.src = 'https://apis.google.com/js/api.js';
script.onload = resolve;
script.onerror = reject;
document.body.appendChild( script );
} );
}

export async function initGoogleApi( clientId ) {
if ( ! window.gapi ) {
await loadScript();
}
return new Promise( ( resolve, reject ) => {
window.gapi.load( 'client:auth2', async () => {
try {
await window.gapi.client.init( { clientId, scope: SCOPES } );
initialized = true;
resolve();
} catch ( err ) {
reject( err );
}
} );
} );
}

export async function getAccessToken() {
if ( ! initialized ) {
throw new Error( 'gapi not initialized' );
}
const auth = window.gapi.auth2.getAuthInstance();
const user = await auth.signIn();
return user.getAuthResponse().access_token;
}

export async function fetchEvents( accessToken, timeMin ) {
const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${ encodeURIComponent( timeMin ) }&singleEvents=true&orderBy=startTime`;
const res = await fetch( url, {
headers: { Authorization: `Bearer ${ accessToken }` },
} );
if ( ! res.ok ) {
throw new Error( 'Failed to fetch events' );
}
return res.json();
}

export function extractEventsForYear( data, year ) {
const items = data.items || [];
const now = dayjs();
return items.reduce( ( acc, item ) => {
const start = item.start?.dateTime || item.start?.date;
if ( ! start ) {
return acc;
}
const date = dayjs( start );
if ( date.year() !== year || date.isBefore( now, 'day' ) ) {
return acc;
}
acc.push( { date, summary: item.summary } );
return acc;
}, [] );
}

