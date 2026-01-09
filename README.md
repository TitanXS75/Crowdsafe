<div align="center">
  <img src="public/logo.png" alt="CrowdSafe Logo" width="120" height="120">
</div>

# CrowdSafe - Smart Crowd Navigation & Safety Platform

## Project Overview

CrowdSafe is a comprehensive platform designed to provide real-time navigation, safety guidance, and smart parking assistance for large-scale events. Whether you're attending festivals, gatherings, sports events, or any crowded venue, CrowdSafe helps you navigate safely and efficiently.

## Features

- **Real-time Navigation**: Navigate through crowded events with live map updates
- **Safety Alerts**: Receive instant notifications about crowd density and safety concerns
- **Smart Parking**: Find and reserve parking spots near your event
- **Emergency Assistance**: Quick access to emergency services and help
- **Event Management**: Organizers can manage events, monitor crowds, and broadcast alerts
- **Role-based Access**: Separate interfaces for attendees and event organizers

## Technology Stack

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn-ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Framer Motion** - Smooth animations

## Getting Started

### Prerequisites

- Node.js 16+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

Follow these steps to run the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd Crowdsafe

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build for Production

```sh
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
Crowdsafe/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   │   ├── attendee/  # Attendee dashboard pages
│   │   └── organizer/ # Organizer dashboard pages
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
└── index.html         # HTML template
```

## User Roles

### Attendee
Navigate events safely with features like:
- Live event maps
- Parking assistance
- Safety alerts
- Emergency contact

### Organizer
Manage your events with tools for:
- Event setup and configuration
- Point of Interest (POI) management
- Crowd monitoring and control
- Parking management
- Alert broadcasting
- Emergency monitoring
- Analytics and reports

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Contact

For questions or support, please contact the development team.
