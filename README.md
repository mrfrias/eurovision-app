# Eurovision 2026 Voting App

A real-time Eurovision voting app to use with friends during the Eurovision 2026 final.

## Features

- **Voter registration** — friends join by entering their name, no passwords needed
- **Eurovision-style voting** — assign 12, 10, 8, 7, 6, 5, 4, 3, 2, 1 points to 10 different acts
- **Admin panel** — manage contestants, users, and control the voting phases
- **Voting phases**: Waiting → Voting Open → Voting Closed → Results Revealed
- **Live results** — admin can see live tallies; results revealed to all when admin decides

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # edit admin password
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### As Admin
1. Click "Admin login" on the home page
2. Enter the admin password (default: `eurovision2026`)
3. Use the **Control** tab to manage voting phases
4. Use the **Contestants** tab to add/edit/remove acts
5. Use the **Users** tab to manage voters
6. Use the **Results** tab to see live vote tallies

### As a Voter
1. Enter your name on the home page
2. Tap any country to reveal point buttons
3. Assign your 10 point values (12, 10, 8, 7, 6, 5, 4, 3, 2, 1) to 10 different acts
4. Submit your votes — you can update them until the admin closes voting

## Configuration

Set `ADMIN_PASSWORD` in `.env.local` to change the admin password.
