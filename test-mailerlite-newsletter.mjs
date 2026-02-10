// Enkel test för MailerLite-subscription via API
// Användning:
//   1) Sätt miljövariabler (PowerShell):
//        $env:MAILERLITE_API_KEY = "DIN_API_NYCKEL_HÄR"
//        $env:MAILERLITE_GROUP_ID = "169680723602572313"
//   2) Kör:
//        node test-mailerlite-newsletter.mjs test+elchef@example.com

const email = process.argv[2];

if (!email) {
  console.error('Användning: node test-mailerlite-newsletter.mjs test@example.com');
  process.exit(1);
}

const API_KEY = process.env.MAILERLITE_API_KEY;
const GROUP_ID = process.env.MAILERLITE_GROUP_ID || '169680723602572313';

if (!API_KEY) {
  console.error(
    'MAILERLITE_API_KEY saknas. Sätt den i din miljö (t.ex. i PowerShell: $env:MAILERLITE_API_KEY = "DIN_API_NYCKEL_HÄR")',
  );
  process.exit(1);
}

async function run() {
  const body = {
    email,
    status: 'active',
  };

  // Viktigt: behandla grupp-ID som sträng för att undvika att stora tal
  // avrundas när de konverteras till Number (JavaScript precision).
  if (GROUP_ID) {
    body.groups = [GROUP_ID];
  }

  console.log('Skickar till MailerLite:', body);

  const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  console.log('Status:', res.status);
  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }
  console.log('Svar:', data);
}

run().catch((err) => {
  console.error('Fel vid anrop:', err);
  process.exit(1);
});

