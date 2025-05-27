# Garbage Hunters

A community-driven platform for organizing and sharing trash cleanup efforts. Built on the Nostr protocol for decentralized social coordination.

## Features

### 🗑️ Cleanup Gallery
- Share before and after photos of cleanup efforts
- Document your environmental impact
- Browse and get inspired by community cleanups
- Add location information to your cleanups

### 📅 Event Scheduling
- Create and organize community cleanup events
- RSVP to upcoming events
- View event details including location, time, and attendees
- Track past and upcoming events

### 👤 User Profiles
- View your cleanup history
- Track events you've organized
- Edit your profile information
- See your environmental impact statistics

### 🔐 Nostr Integration
- Decentralized authentication using Nostr
- No central server or database required
- Own your data and content
- Connect with existing Nostr identity

## Getting Started

### Development

```bash
# Install dependencies and start dev server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

### Deployment

```bash
# Deploy to Surge.sh
npm run deploy
```

## How It Works

1. **Login with Nostr**: Use any Nostr-compatible browser extension (like Alby or nos2x) to login
2. **Share Cleanups**: Upload before/after photos of areas you've cleaned
3. **Create Events**: Schedule cleanup events and invite the community
4. **Join Events**: RSVP to upcoming cleanup events in your area
5. **Track Progress**: View your profile to see your cleanup history and impact

## Technical Details

- Built with React 18, TypeScript, and Vite
- Styled with TailwindCSS and shadcn/ui components
- Uses Nostr protocol for decentralized data storage
- Event kinds:
  - `30023`: Cleanup posts (parameterized replaceable events)
  - `31923`: Cleanup events (time-based parameterized replaceable events)
  - `30311`: Event RSVPs

## Contributing

This is an open-source project. Feel free to contribute by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Organizing cleanup events!

## License

MIT